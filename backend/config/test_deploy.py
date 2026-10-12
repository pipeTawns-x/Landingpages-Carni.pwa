"""Tests for what the Render deployment depends on: the settings that read the environment, the
Blueprint (render.yaml at the root of the repo) and the build script.

Nothing here talks to Render. The Blueprint and the script are checked against the code they
configure, so that a required variable, an app with migrations or a secret put in the wrong place
fails here and not in the first deploy.
"""

import copy
import io
import json
import logging
import logging.config
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from unittest import mock

from django.apps import apps
from django.conf import settings
from django.test import Client, SimpleTestCase, TestCase, override_settings
from django.urls import reverse
from django.utils.log import configure_logging

from config import settings as production_settings
from config.logging_filters import RedactInviteToken

BACKEND_DIR = Path(settings.BASE_DIR)
BLUEPRINT = BACKEND_DIR.parent / "render.yaml"
BUILD_SCRIPT = BACKEND_DIR / "scripts" / "render_build.sh"

# What the settings need to be imported. They are made up: nothing here is a real value.
BASE_ENV = {
    "DJANGO_SECRET_KEY": "not-a-real-key-only-for-this-test",
    "DJANGO_DEBUG": "False",
    "DJANGO_ALLOWED_HOSTS": "",
    "POSTGRES_DB": "db",
    "POSTGRES_USER": "user",
    "POSTGRES_PASSWORD": "password",
    "POSTGRES_HOST": "localhost",
    "POSTGRES_PORT": "5432",
    "SUPABASE_URL": "http://supabase.test",
    "SUPABASE_JWKS_URL": "",
    "SUPABASE_JWT_SECRET": "x" * 48,
    "STORE_ORIGIN": "http://store.test",
    "PANEL_ALLOWED_ORIGINS": "http://store.test",
    "PANEL_TOKEN_MAX_AGE_SECONDS": "300",
    "DJANGO_COOKIE_SECURE": "False",
    "DJANGO_COOKIE_HTTPONLY": "True",
    "DJANGO_COOKIE_SAMESITE": "Lax",
    "REVIEW_INVITES_ENABLED": "",
    # The ones under test start unset. An empty value is the "unset" case, and it also stops
    # backend/.env from filling them in: python-dotenv never overrides a variable that is set.
    "DJANGO_BEHIND_PROXY": "",
    "DJANGO_CSRF_TRUSTED_ORIGINS": "",
}

PRINT_SETTINGS = """
import json
from config import settings
print(json.dumps({
    "proxy_header": getattr(settings, "SECURE_PROXY_SSL_HEADER", None),
    "csrf_trusted_origins": settings.CSRF_TRUSTED_ORIGINS,
}))
"""


def import_settings(**environment):
    """Import config.settings in a fresh interpreter, with the environment BASE_ENV + `environment`.

    A fresh interpreter, because the settings read the environment once, when they are imported.
    Returns the finished process: `stdout` is the JSON of PRINT_SETTINGS, `stderr` the reason when
    the settings refused to load.
    """
    inherited = {name: os.environ[name] for name in ("PATH", "HOME", "LANG") if name in os.environ}
    return subprocess.run(
        [sys.executable, "-c", PRINT_SETTINGS],
        cwd=BACKEND_DIR,
        env={**inherited, **BASE_ENV, **environment},
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )


class ProxySettingsTests(SimpleTestCase):
    """SECURE_PROXY_SSL_HEADER makes Django believe a header, so it is on only when asked for."""

    def loaded(self, **environment):
        result = import_settings(**environment)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_without_the_flag_django_does_not_trust_the_proxy_header(self):
        self.assertIsNone(self.loaded()["proxy_header"])

    def test_with_the_flag_the_forwarded_protocol_header_is_trusted(self):
        for value in ("true", "True", "1", "yes"):
            with self.subTest(value=value):
                header = self.loaded(DJANGO_BEHIND_PROXY=value)["proxy_header"]
                self.assertEqual(header, ["HTTP_X_FORWARDED_PROTO", "https"])

    def test_with_the_flag_off_it_is_not_trusted(self):
        for value in ("false", "0", "no"):
            with self.subTest(value=value):
                self.assertIsNone(self.loaded(DJANGO_BEHIND_PROXY=value)["proxy_header"])

    def test_a_typo_fails_instead_of_switching_a_security_flag_off(self):
        result = import_settings(DJANGO_BEHIND_PROXY="ture")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("DJANGO_BEHIND_PROXY", result.stderr)


class CsrfTrustedOriginsTests(SimpleTestCase):
    def loaded(self, **environment):
        result = import_settings(**environment)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)["csrf_trusted_origins"]

    def test_by_default_no_other_origin_is_trusted(self):
        self.assertEqual(self.loaded(), [])

    def test_the_variable_lists_origins_separated_by_commas(self):
        value = "https://demo.onrender.com, https://tienda.example.com:8443"

        self.assertEqual(
            self.loaded(DJANGO_CSRF_TRUSTED_ORIGINS=value),
            ["https://demo.onrender.com", "https://tienda.example.com:8443"],
        )

    def test_a_bad_origin_fails_the_start_and_names_the_variable(self):
        for value in ("demo.onrender.com", "https://demo.onrender.com/panel"):
            with self.subTest(value=value):
                result = import_settings(DJANGO_CSRF_TRUSTED_ORIGINS=value)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("DJANGO_CSRF_TRUSTED_ORIGINS", result.stderr)


@override_settings(ALLOWED_HOSTS=["demo.example"])
class BehindProxyCsrfTests(TestCase):
    """What DJANGO_BEHIND_PROXY is for, seen through Django's CSRF check.

    The proxy ends TLS: the browser posts from https://demo.example, and Django receives the
    request over plain http with `X-Forwarded-Proto: https`.
    """

    def post_through_the_proxy(self):
        client = Client(enforce_csrf_checks=True)
        client.get("/admin/login/", HTTP_HOST="demo.example")  # sets the CSRF cookie
        return client.post(
            reverse("panel:salir"),
            HTTP_HOST="demo.example",
            HTTP_ORIGIN="https://demo.example",
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_X_CSRFTOKEN=client.cookies[settings.CSRF_COOKIE_NAME].value,
        )

    def test_without_trusting_the_header_every_post_from_the_https_page_is_refused(self):
        with self.assertLogs("django.security.csrf", level="WARNING") as logs:
            response = self.post_through_the_proxy()

        self.assertEqual(response.status_code, 403)
        # Refused for the right reason: Django sees http, and the origin of the page is https.
        self.assertIn("Origin checking failed", "\n".join(logs.output))

    @override_settings(SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"))
    def test_trusting_the_header_the_same_post_goes_through(self):
        response = self.post_through_the_proxy()

        self.assertEqual(response.status_code, 302)


class StaticFilesSettingsTests(SimpleTestCase):
    """The real settings serve static files with WhiteNoise; the test settings do not need it."""

    def test_whitenoise_comes_right_after_the_security_middleware(self):
        middleware = production_settings.MIDDLEWARE

        position = middleware.index("django.middleware.security.SecurityMiddleware")
        self.assertEqual(middleware[position + 1], "whitenoise.middleware.WhiteNoiseMiddleware")

    def test_the_real_settings_use_compressed_hashed_static_files(self):
        storages = production_settings.STORAGES

        self.assertEqual(
            storages["staticfiles"]["BACKEND"],
            "whitenoise.storage.CompressedManifestStaticFilesStorage",
        )
        self.assertIn("default", storages)

    def test_the_tests_run_without_collectstatic(self):
        # The manifest storage fails on every {% static %} until collectstatic has written the
        # manifest, and WhiteNoise warns about a STATIC_ROOT that does not exist yet.
        self.assertEqual(
            settings.STORAGES["staticfiles"]["BACKEND"],
            "django.contrib.staticfiles.storage.StaticFilesStorage",
        )
        self.assertNotIn("whitenoise.middleware.WhiteNoiseMiddleware", settings.MIDDLEWARE)


class LoggingSettingsTests(SimpleTestCase):
    """A host that only shows the output of the process needs the errors written to it."""

    def test_a_server_error_and_its_traceback_go_to_the_console_with_debug_off(self):
        # Django logs a 500 to the console only with DEBUG on and mails it to ADMINS otherwise,
        # so without this a failure on Render would leave nothing to read in its log.
        logger = production_settings.LOGGING["loggers"]["django.request"]

        self.assertEqual(logger["handlers"], ["console"])
        self.assertEqual(logger["level"], "ERROR")
        # Not twice with DEBUG on: Django's own console handler would repeat it.
        self.assertIs(logger["propagate"], False)

    def test_a_not_found_is_not_logged_because_its_path_can_hold_a_review_invite_token(self):
        # `django.request` logs a 404 as a warning, with the path. Only errors are asked for.
        logger = production_settings.LOGGING["loggers"]["django.request"]

        self.assertGreater(logging.getLevelName(logger["level"]), logging.WARNING)


class RedactInviteTokenTests(SimpleTestCase):
    """The filter rewrites the path of a review invite, which is where its token sits."""

    def redacted(self, message, *args):
        record = logging.LogRecord("test", logging.ERROR, __file__, 1, message, args, None)

        self.assertIs(RedactInviteToken().filter(record), True, "a record is never dropped")
        return record.getMessage()

    def test_the_token_of_the_path_is_replaced(self):
        self.assertEqual(
            self.redacted("Internal Server Error: %s", "/panel/invitado/aB3-_xYz0123456789/"),
            "Internal Server Error: /panel/invitado/<redacted>",
        )

    def test_a_query_string_after_the_token_goes_too(self):
        self.assertEqual(
            self.redacted("boom: /panel/invitado/aB3/?next=/panel/ end"),
            "boom: /panel/invitado/<redacted> end",
        )

    def test_the_scheme_the_host_and_the_words_around_it_stay(self):
        self.assertEqual(
            self.redacted("GET https://demo.onrender.com/panel/invitado/aB3/ failed"),
            "GET https://demo.onrender.com/panel/invitado/<redacted> failed",
        )

    def test_a_quote_closes_the_path_and_stays(self):
        self.assertEqual(
            self.redacted("path '/panel/invitado/aB3/' and \"/panel/invitado/cD4/\""),
            "path '/panel/invitado/<redacted>' and \"/panel/invitado/<redacted>\"",
        )

    def test_every_token_of_a_message_is_replaced(self):
        self.assertEqual(
            self.redacted("%s then %s", "/panel/invitado/one/", "/panel/invitado/two/"),
            "/panel/invitado/<redacted> then /panel/invitado/<redacted>",
        )

    def test_running_it_twice_changes_nothing_more(self):
        once = self.redacted("/panel/invitado/aB3/")

        self.assertEqual(self.redacted(once), once)

    def test_anything_else_is_left_exactly_as_it_was(self):
        record = logging.LogRecord(
            "test", logging.INFO, __file__, 1, "Opened %s for %s", ("/panel/productos/", 7), None
        )

        RedactInviteToken().filter(record)

        self.assertEqual(record.msg, "Opened %s for %s")
        self.assertEqual(record.args, ("/panel/productos/", 7))

    def test_a_message_that_cannot_be_formatted_does_not_raise_inside_the_logging_call(self):
        record = logging.LogRecord("test", logging.ERROR, __file__, 1, "%s %s", ("one",), None)

        self.assertIs(RedactInviteToken().filter(record), True)


class ConsoleLoggingTests(TestCase):
    """The real LOGGING of the settings, with its console writing to a buffer we can read.

    The test settings swap the console handler for one that writes nothing, so the config under
    test is the one in config/settings.py, applied to the logging module here and put back after.
    """

    TOKEN = "aB3-_xYz0123456789AbCdEfGhIjKlMnOpQrStUvW"

    def setUp(self):
        self.output = io.StringIO()
        config = copy.deepcopy(production_settings.LOGGING)
        config["handlers"]["console"]["stream"] = self.output
        logging.config.dictConfig(config)
        self.addCleanup(configure_logging, settings.LOGGING_CONFIG, settings.LOGGING)

    @override_settings(REVIEW_INVITES_ENABLED=True)
    def test_a_server_error_on_an_invite_link_reaches_the_console_without_its_token(self):
        client = Client(raise_request_exception=False)

        with mock.patch("panel.views.ReviewInvite.find", side_effect=RuntimeError("boom")):
            response = client.get(f"/panel/invitado/{self.TOKEN}/")

        self.assertEqual(response.status_code, 500)
        written = self.output.getvalue()
        self.assertIn("Internal Server Error: /panel/invitado/<redacted>", written)
        self.assertIn("RuntimeError: boom", written)  # the traceback is still there to debug with
        self.assertNotIn(self.TOKEN, written)

    def test_what_the_panel_logs_goes_through_the_same_filter(self):
        logging.getLogger("panel").warning("Looked at %s", f"/panel/invitado/{self.TOKEN}/")

        written = self.output.getvalue()
        self.assertIn("WARNING panel: Looked at /panel/invitado/<redacted>", written)
        self.assertNotIn(self.TOKEN, written)

    def test_the_filter_is_on_the_console_handler_and_not_on_a_logger_that_could_be_bypassed(self):
        # A filter on a logger does not apply to the records of its children; one on the handler
        # applies to everything the handler writes.
        console = production_settings.LOGGING["handlers"]["console"]

        self.assertEqual(console["filters"], ["redact_invite_token"])
        self.assertEqual(
            production_settings.LOGGING["filters"]["redact_invite_token"]["()"],
            "config.logging_filters.RedactInviteToken",
        )


def read_blueprint():
    """Read render.yaml, which uses only a small subset of YAML.

    One service under `services:`, plain `key: value` pairs and a list of `envVars` made of
    `key`, `value` and `sync`. Anything else raises, so a change of shape cannot make the checks
    below pass for the wrong reason.
    """
    service, env_vars = None, []
    in_env_vars = False

    def pair(text):
        name, separator, value = text.partition(": ")
        if not separator:
            name, value = text.rstrip(":"), ""
        return name.strip(), value.strip().strip("\"'")

    for number, line in enumerate(BLUEPRINT.read_text(encoding="utf-8").splitlines(), start=1):
        text = line.strip()
        if not text or text.startswith("#"):
            continue
        indent = len(line) - len(line.lstrip(" "))

        if indent == 0 and text == "services:":
            continue
        if indent == 2 and text.startswith("- "):
            if service is not None:
                raise ValueError(f"render.yaml:{number}: this reader handles one service")
            service = dict([pair(text[2:])])
            in_env_vars = False
        elif indent == 4 and service is not None:
            name, value = pair(text)
            in_env_vars = name == "envVars"
            if not in_env_vars:
                service[name] = value
        elif indent == 6 and in_env_vars and text.startswith("- "):
            env_vars.append(dict([pair(text[2:])]))
        elif indent == 8 and in_env_vars and env_vars:
            name, value = pair(text)
            env_vars[-1][name] = value
        else:
            raise ValueError(f"render.yaml:{number}: unexpected line {line!r}")

    if service is None:
        raise ValueError("render.yaml has no service")
    return service, env_vars


class BlueprintTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.service, cls.env_vars = read_blueprint()
        cls.by_key = {env_var["key"]: env_var for env_var in cls.env_vars}

    def test_it_is_one_free_python_web_service_on_the_practices_branch(self):
        self.assertEqual(self.service["type"], "web")
        self.assertEqual(self.service["runtime"], "python")
        self.assertEqual(self.service["plan"], "free")
        self.assertEqual(self.service["branch"], "practicas-ebac")
        self.assertEqual(self.service["rootDir"], "backend")

    def test_it_runs_in_the_region_of_the_demo_database(self):
        # The region cannot be changed once the service exists, and the demo Supabase project
        # lives in East US (Ohio): every query would cross the country from Render's default.
        self.assertEqual(self.service["region"], "ohio")

    def test_it_builds_with_the_script_and_starts_gunicorn_on_the_port_render_gives(self):
        self.assertEqual(self.service["buildCommand"], "bash scripts/render_build.sh")
        start = self.service["startCommand"]
        self.assertTrue(start.startswith("uv run "), start)
        self.assertIn("gunicorn config.wsgi:application", start)
        self.assertIn("--bind 0.0.0.0:$PORT", start)

    def test_the_start_does_not_sync_the_dev_group_and_does_not_log_accesses(self):
        # A free service starts again after every sleep: `uv run` must not reach for dev tools.
        # An access log would write the path of every request, and the path of a review invite
        # holds its token.
        start = self.service["startCommand"]

        self.assertIn("--no-dev", start)
        self.assertIn("--frozen", start)
        self.assertNotIn("--access-logfile", start)
        self.assertNotIn("--reload", start)

    def test_every_variable_the_settings_require_is_declared(self):
        source = (BACKEND_DIR / "config" / "settings.py").read_text(encoding="utf-8")
        required = set(re.findall(r'require_env\("([A-Z0-9_]+)"\)', source))
        # No request is served without ALLOWED_HOSTS, and the token needs one of the two keys.
        required |= {"DJANGO_ALLOWED_HOSTS", "SUPABASE_JWKS_URL"}

        self.assertGreater(len(required), 10)
        self.assertEqual(sorted(required - set(self.by_key)), [])

    def test_no_variable_is_declared_twice(self):
        keys = [env_var["key"] for env_var in self.env_vars]

        self.assertEqual(sorted(keys), sorted(set(keys)))

    def test_only_the_variables_that_are_not_secret_or_specific_to_an_environment_have_a_value(
        self,
    ):
        python_version = (BACKEND_DIR / ".python-version").read_text(encoding="utf-8").strip()
        plain = {
            env_var["key"]: env_var["value"] for env_var in self.env_vars if "value" in env_var
        }

        self.assertEqual(
            plain,
            {
                "PYTHON_VERSION": python_version,
                "UV_PYTHON_PREFERENCE": "only-system",
                "DJANGO_BEHIND_PROXY": "true",
                "PGSSLMODE": "require",
                "PANEL_TOKEN_MAX_AGE_SECONDS": "300",
            },
        )

    def test_the_database_connection_is_forced_to_tls(self):
        # libpq reads PGSSLMODE when the connection does not say otherwise, so the settings must
        # not set an `sslmode` of their own: it would win over this variable.
        self.assertEqual(self.by_key["PGSSLMODE"], {"key": "PGSSLMODE", "value": "require"})
        options = production_settings.DATABASES["default"].get("OPTIONS", {})
        self.assertNotIn("sslmode", options)

    def test_the_review_invites_switch_is_the_owners_and_a_sync_never_flips_it(self):
        # With a value in the file, a Blueprint sync would turn back on a switch that the owner
        # turned off in the Dashboard in an emergency.
        self.assertEqual(
            self.by_key["REVIEW_INVITES_ENABLED"],
            {"key": "REVIEW_INVITES_ENABLED", "sync": "false"},
        )

    def test_every_other_variable_is_typed_by_the_owner_and_never_synced_from_the_file(self):
        for env_var in self.env_vars:
            if "value" in env_var:
                continue
            with self.subTest(key=env_var["key"]):
                self.assertEqual(env_var, {"key": env_var["key"], "sync": "false"})

    def test_the_python_version_is_fully_qualified_as_render_requires(self):
        self.assertRegex(self.by_key["PYTHON_VERSION"]["value"], r"^\d+\.\d+\.\d+$")


def apps_with_migrations():
    """The labels of the installed apps that have a migrations package."""
    return {
        config.label
        for config in apps.get_app_configs()
        if (Path(config.path) / "migrations").is_dir()
    }


class BuildScriptTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.script = BUILD_SCRIPT.read_text(encoding="utf-8")

    def test_it_stops_at_the_first_failure(self):
        self.assertIn("set -euo pipefail", self.script)

    def test_it_installs_the_locked_dependencies_without_the_dev_group(self):
        self.assertIn("uv sync --frozen --no-dev", self.script)

    def test_it_collects_the_static_files(self):
        self.assertIn("collectstatic --noinput", self.script)

    def test_it_migrates_each_app_by_label_and_never_everything_at_once(self):
        loop = re.search(r"for app in ([a-z_ ]+); do", self.script)
        self.assertIsNotNone(loop, "the script has no `for app in ...; do` loop")

        self.assertEqual(set(loop.group(1).split()), apps_with_migrations())
        self.assertRegex(self.script, r'manage\.py migrate "\$app"')
        for line in self.script.splitlines():
            if "manage.py migrate" in line:
                self.assertNotRegex(line, r"manage\.py migrate\s*(--|$)", "a bare migrate")

    def test_the_script_is_valid_bash(self):
        bash = shutil.which("bash")
        if bash is None:
            self.skipTest("bash is not installed")

        result = subprocess.run(
            [bash, "-n", str(BUILD_SCRIPT)], capture_output=True, text=True, check=False
        )

        self.assertEqual(result.returncode, 0, result.stderr)
