"""Tests of the preview settings and of its routes (config.settings_preview, config.urls_preview).

The settings are loaded in a child process: importing them here would run their module code inside
the test process, which already runs on config.settings_test.
"""

import io
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest import mock, skipIf
from urllib.parse import urlsplit

from django.conf import settings
from django.core.management import call_command
from django.http import Http404, HttpResponse
from django.test import Client, RequestFactory, SimpleTestCase, TestCase, override_settings
from django.urls import NoReverseMatch, get_resolver, reverse

from config import urls as real_urls
from config.urls_preview import LoopbackOnlyMiddleware, PreviewGateway
from panel.access import PANEL_SESSION_KEY
from panel.management.commands.preview_seed import PREVIEW_ADMIN_ID

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent

# What the child process prints once the preview settings are loaded.
REPORT = """
import io
import json
import os
import tempfile
from pathlib import Path

import django
import dotenv
from django.conf import settings
django.setup()
# A .env file the child is told to load: with loading disabled, nothing reaches the environment.
probe = Path(tempfile.mkdtemp(prefix="carni-dotenv-probe-")) / ".env"
probe.write_text("CARNI_DOTENV_PROBE=loaded\\n")
loaded = dotenv.load_dotenv(probe)
probe.unlink()
probe.parent.rmdir()
db_dir = Path(settings.DATABASES["default"]["NAME"]).parent
print(json.dumps({
    "debug": settings.DEBUG,
    "allowed_hosts": settings.ALLOWED_HOSTS,
    "engine": settings.DATABASES["default"]["ENGINE"],
    "name": str(settings.DATABASES["default"]["NAME"]),
    "root_urlconf": settings.ROOT_URLCONF,
    "supabase_url": settings.SUPABASE_URL,
    "service_role_key": settings.SUPABASE_SERVICE_ROLE_KEY,
    "publishable_key": settings.SUPABASE_PUBLISHABLE_KEY,
    "secret_key": settings.SECRET_KEY,
    "preview": settings.CARNI_PREVIEW,
    "dotenv_loaded": loaded,
    "dotenv_probe": os.environ.get("CARNI_DOTENV_PROBE"),
    "db_dir_mode": oct(db_dir.stat().st_mode & 0o777),
    "review_invites": settings.REVIEW_INVITES_ENABLED,
    "session_cookie": settings.SESSION_COOKIE_NAME,
    "csrf_cookie": settings.CSRF_COOKIE_NAME,
    "store_origin": settings.STORE_ORIGIN,
    "first_middleware": settings.MIDDLEWARE[0],
}))
"""


def load_preview_settings(**env):
    """Import config.settings_preview in a child process and return (exit code, output).

    The child starts from a clean environment: no RENDER, no shell secrets, a database file in a
    temporary directory removed afterwards, unless a keyword overrides one of them.
    """
    with tempfile.TemporaryDirectory(prefix="carni-preview-test-") as scratch:
        child_env = {
            "PATH": os.environ.get("PATH", ""),
            "DJANGO_SETTINGS_MODULE": "config.settings_preview",
            "CARNI_PREVIEW_DB": str(Path(scratch) / "preview.sqlite3"),
            **env,
        }
        result = subprocess.run(  # noqa: S603
            [sys.executable, "-c", REPORT],
            cwd=BACKEND_DIR,
            env=child_env,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
    return result.returncode, result.stdout + result.stderr


class PreviewSettingsTests(SimpleTestCase):
    def test_settings_refuse_to_load_when_render_is_set(self):
        code, output = load_preview_settings(RENDER="true")

        self.assertNotEqual(code, 0)
        self.assertIn("RENDER", output)

    def test_settings_refuse_a_database_inside_the_repository(self):
        code, output = load_preview_settings(CARNI_PREVIEW_DB=str(BACKEND_DIR / "preview.sqlite3"))

        self.assertNotEqual(code, 0)
        self.assertIn("outside the repository", output)

    def test_settings_refuse_a_relative_database_path(self):
        code, output = load_preview_settings(CARNI_PREVIEW_DB="preview.sqlite3")

        self.assertNotEqual(code, 0)
        self.assertIn("absolute", output)

    def test_settings_refuse_an_in_memory_database(self):
        code, output = load_preview_settings(CARNI_PREVIEW_DB=":memory:")

        self.assertNotEqual(code, 0)
        self.assertIn("absolute", output)

    def test_settings_use_a_sqlite_file_outside_the_repository(self):
        code, output = load_preview_settings()

        self.assertEqual(code, 0, output)
        loaded = json.loads(output)
        self.assertEqual(loaded["engine"], "django.db.backends.sqlite3")
        name = Path(loaded["name"])
        self.assertTrue(name.is_absolute())
        self.assertFalse(name.resolve().is_relative_to(REPO_ROOT.resolve()))

    def test_allowed_hosts_are_only_the_loopback_names(self):
        code, output = load_preview_settings(DJANGO_ALLOWED_HOSTS="carni.example.com")

        self.assertEqual(code, 0, output)
        self.assertEqual(json.loads(output)["allowed_hosts"], ["127.0.0.1", "localhost"])

    def test_settings_turn_on_debug_the_preview_flag_and_their_own_routes(self):
        code, output = load_preview_settings(DJANGO_DEBUG="False")

        self.assertEqual(code, 0, output)
        loaded = json.loads(output)
        self.assertTrue(loaded["debug"])
        self.assertTrue(loaded["preview"])
        self.assertEqual(loaded["root_urlconf"], "config.urls_preview")

    def test_settings_ignore_supabase_values_and_secrets_from_the_shell(self):
        code, output = load_preview_settings(
            SUPABASE_URL="https://real-project.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY="shell-service-role",
            SUPABASE_PUBLISHABLE_KEY="shell-publishable",
            DJANGO_SECRET_KEY="shell-secret",
        )

        self.assertEqual(code, 0, output)
        loaded = json.loads(output)
        self.assertEqual(loaded["supabase_url"], "http://supabase.test")
        self.assertEqual(loaded["service_role_key"], "")
        self.assertNotIn("shell", loaded["publishable_key"])
        self.assertNotEqual(loaded["secret_key"], "shell-secret")

    def test_the_secret_key_is_random_and_ignores_the_shell(self):
        shell = {"DJANGO_SECRET_KEY": "shell-secret", "CARNI_PREVIEW_SECRET_KEY": "shell-secret"}
        first = json.loads(load_preview_settings(**shell)[1])["secret_key"]
        second = json.loads(load_preview_settings(**shell)[1])["secret_key"]

        self.assertNotEqual(first, "shell-secret")
        self.assertNotEqual(first, second)
        self.assertGreaterEqual(len(first), 50)

    def test_backend_env_is_never_loaded(self):
        code, output = load_preview_settings()

        self.assertEqual(code, 0, output)
        loaded = json.loads(output)
        self.assertFalse(loaded["dotenv_loaded"])
        self.assertIsNone(loaded["dotenv_probe"])

    def test_the_database_directory_is_created_private(self):
        with tempfile.TemporaryDirectory(prefix="carni-preview-test-") as scratch:
            code, output = load_preview_settings(
                CARNI_PREVIEW_DB=str(Path(scratch) / "new" / "preview.sqlite3")
            )

        self.assertEqual(code, 0, output)
        self.assertEqual(json.loads(output)["db_dir_mode"], "0o700")

    def test_settings_refuse_a_directory_others_can_read(self):
        with tempfile.TemporaryDirectory(prefix="carni-preview-test-") as scratch:
            shared = Path(scratch) / "shared"
            shared.mkdir()
            shared.chmod(0o755)
            code, output = load_preview_settings(CARNI_PREVIEW_DB=str(shared / "preview.sqlite3"))

        self.assertNotEqual(code, 0)
        self.assertIn("0o700", output)

    @skipIf(os.getuid() == 0, "root owns /usr/bin, so it is not another user's directory")
    def test_settings_refuse_a_directory_of_another_user(self):
        code, output = load_preview_settings(CARNI_PREVIEW_DB="/usr/bin/preview.sqlite3")

        self.assertNotEqual(code, 0)
        self.assertIn("owned by", output)

    def test_review_invites_are_on_with_their_own_cookie_names(self):
        code, output = load_preview_settings()

        self.assertEqual(code, 0, output)
        loaded = json.loads(output)
        self.assertTrue(loaded["review_invites"])
        self.assertEqual(loaded["session_cookie"], "carni_preview_sessionid")
        self.assertEqual(loaded["csrf_cookie"], "carni_preview_csrftoken")

    def test_the_store_origin_is_the_preview_itself(self):
        code, output = load_preview_settings()

        self.assertEqual(code, 0, output)
        self.assertEqual(json.loads(output)["store_origin"], "http://127.0.0.1:8000")

    def test_the_loopback_guard_is_the_first_middleware(self):
        code, output = load_preview_settings()

        self.assertEqual(code, 0, output)
        self.assertEqual(
            json.loads(output)["first_middleware"], "config.urls_preview.LoopbackOnlyMiddleware"
        )


class RealRoutesTests(SimpleTestCase):
    def test_the_real_routes_have_no_preview_entry(self):
        with self.assertRaises(NoReverseMatch):
            reverse("preview_enter")

    def test_the_preview_entry_path_is_not_found_with_the_real_routes(self):
        response = self.client.get("/preview/enter/")

        self.assertEqual(response.status_code, 404)

    def test_the_preview_routes_keep_every_real_route(self):
        preview = get_resolver("config.urls_preview")
        real_names = {
            name for name in get_resolver(real_urls).reverse_dict if isinstance(name, str)
        }

        for name in real_names:
            self.assertIn(name, preview.reverse_dict, name)


class PreviewRoutesTests(SimpleTestCase):
    @override_settings(ROOT_URLCONF="config.urls_preview")
    def test_the_old_preview_entry_no_longer_exists(self):
        with self.assertRaises(NoReverseMatch):
            reverse("preview_enter")
        self.assertEqual(self.client.get("/preview/enter/").status_code, 404)


class LoopbackOnlyMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.middleware = LoopbackOnlyMiddleware(lambda request: HttpResponse("ok"))

    def test_a_request_from_another_address_gets_404(self):
        request = RequestFactory().get("/panel/", REMOTE_ADDR="203.0.113.5")

        with self.assertRaises(Http404):
            self.middleware(request)

    def test_requests_from_loopback_pass(self):
        for address in ("127.0.0.1", "::1"):
            with self.subTest(address=address):
                request = RequestFactory().get("/panel/", REMOTE_ADDR=address)
                self.assertEqual(self.middleware(request).content, b"ok")


@override_settings(
    ROOT_URLCONF="config.urls_preview", CARNI_PREVIEW=True, REVIEW_INVITES_ENABLED=True
)
class PreviewInviteTests(TestCase):
    def setUp(self):
        call_command("preview_seed", verbosity=0)
        patcher = mock.patch("ventas.services.get_gateway", return_value=PreviewGateway())
        patcher.start()
        self.addCleanup(patcher.stop)
        out = io.StringIO()
        call_command(
            "issue_review_invite",
            "--supabase-user",
            str(PREVIEW_ADMIN_ID),
            "--label",
            "Local preview",
            "--days",
            "1",
            "--base-url",
            "http://127.0.0.1:8000",
            stdout=out,
        )
        link = next(line for line in out.getvalue().splitlines() if "/panel/invitado/" in line)
        self.path = urlsplit(link.strip()).path
        self.client = Client(enforce_csrf_checks=True)

    def test_the_get_of_the_link_shows_the_button_and_opens_no_session(self):
        response = self.client.get(self.path)

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(PANEL_SESSION_KEY, self.client.session)

    def test_the_post_with_csrf_opens_the_panel_of_the_synthetic_admin(self):
        self.client.get(self.path)
        token = self.client.cookies[settings.CSRF_COOKIE_NAME].value

        response = self.client.post(self.path, {"csrfmiddlewaretoken": token})

        self.assertRedirects(response, "/panel/", fetch_redirect_response=False)
        self.assertEqual(self.client.session[PANEL_SESSION_KEY], str(PREVIEW_ADMIN_ID))
        self.assertEqual(self.client.get("/panel/").status_code, 200)

    def test_the_post_without_csrf_is_refused(self):
        self.assertEqual(self.client.post(self.path).status_code, 403)
        self.assertNotIn(PANEL_SESSION_KEY, self.client.session)
