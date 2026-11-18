"""Tests of the sign-in / sign-up page (`ventas:acceso`, /acceso/), the old accessweb.html.

Supabase Auth signs people in from the browser. Django serves the page, hands it the public values
it needs (the project URL and the publishable key, never a service key) and opens the panel
session once an admin has signed in (`panel:sesion`, covered in panel/tests.py).
"""

import re
from html.parser import HTMLParser
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase, override_settings
from django.urls import reverse


class Tags(HTMLParser):
    """Collect every start tag with its attributes, and the text outside of scripts."""

    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def named(self, name):
        return [attrs for tag, attrs in self.tags if tag == name]


def read(path):
    return Path(path).read_text(encoding="utf-8")


def parse(html):
    parser = Tags()
    parser.feed(html)
    return parser


class AccessPageTests(TestCase):
    def get(self, **query):
        return self.client.get(reverse("ventas:acceso"), query)

    def test_an_anonymous_visitor_gets_the_page(self):
        response = self.get()

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/tienda/acceso.html")

    def test_it_lives_at_acceso_and_the_old_address_still_lands_on_it(self):
        self.assertEqual(reverse("ventas:acceso"), "/acceso/")
        response = self.client.get("/accessweb.html", {"salir": "1"})

        self.assertRedirects(
            response, "/acceso/?salir=1", status_code=301, fetch_redirect_response=False
        )

    def test_it_sits_inside_the_store_frame(self):
        response = self.get()

        self.assertTemplateUsed(response, "ventas/tienda/base.html")
        html = response.content.decode()
        self.assertIn('<main id="contenido">', html)
        self.assertIn("<title>Acceso", html)
        self.assertEqual(len(re.findall(r"<h1[ >]", html)), 1)

    def test_both_forms_are_there_with_their_fields(self):
        html = self.get().content.decode()
        tags = parse(html)
        ids = {attrs.get("id") for _, attrs in tags.tags}

        self.assertIn("form-ingresar", ids)
        self.assertIn("form-registro", ids)
        by_id = {attrs.get("id"): attrs for _, attrs in tags.tags if attrs.get("id")}
        self.assertEqual(by_id["ingresar-correo"]["type"], "email")
        self.assertEqual(by_id["ingresar-correo"]["autocomplete"], "email")
        self.assertEqual(by_id["ingresar-clave"]["type"], "password")
        self.assertEqual(by_id["ingresar-clave"]["autocomplete"], "current-password")
        self.assertEqual(by_id["registro-nombre"]["autocomplete"], "name")
        self.assertEqual(by_id["registro-correo"]["type"], "email")
        self.assertEqual(by_id["registro-telefono"]["type"], "tel")
        self.assertEqual(by_id["registro-clave"]["autocomplete"], "new-password")
        self.assertEqual(by_id["registro-clave2"]["autocomplete"], "new-password")
        self.assertEqual(by_id["registro-terminos"]["type"], "checkbox")
        # Every field has its label.
        for field in (
            "ingresar-correo",
            "ingresar-clave",
            "registro-nombre",
            "registro-correo",
            "registro-clave",
        ):
            self.assertIn(f'for="{field}"', html)

    def test_the_two_forms_never_send_a_password_anywhere_by_themselves(self):
        # The browser talks to Supabase from the script. Without it a submit must not put a
        # password in an address: both forms post, and Django refuses the post (405 below).
        tags = parse(self.get().content.decode())
        # The search of the header is the one GET form of every page, and it has no password.
        forms = [attrs for attrs in tags.named("form") if attrs.get("role") != "search"]

        self.assertEqual(len(forms), 2)
        for attrs in forms:
            self.assertEqual(attrs["method"], "post")
        self.assertEqual(
            self.client.post(reverse("ventas:acceso"), {"password": "x"}).status_code, 405
        )

    def test_the_switch_between_the_two_forms_is_there(self):
        html = self.get().content.decode()

        self.assertIn('id="acceso"', html)
        self.assertIn('data-modo="ingresar"', html)
        for button in ("ver-registro", "ver-ingresar"):
            self.assertIn(f'data-accion="{button}"', html)

    def test_don_carlos_is_in_both_modes(self):
        tags = parse(self.get().content.decode())
        sources = {attrs["src"]: attrs for attrs in tags.named("img") if "src" in attrs}

        for pose in ("login", "register"):
            image = f"/img/mascota/don-carlos-{pose}.webp"
            self.assertIn(image, sources)
            attrs = sources[image]
            self.assertTrue(attrs.get("alt"))
            self.assertTrue(attrs.get("width") and attrs.get("height"))
            self.assertIn(f"/img/mascota/don-carlos-{pose}@2x.webp 2x", attrs.get("srcset", ""))

    def test_the_script_is_one_external_module_and_nothing_runs_inline(self):
        html = self.get().content.decode()
        tags = parse(html)
        scripts = tags.named("script")
        modules = [s for s in scripts if s.get("type") == "module"]

        # The header script of every page, and the one module of this page.
        self.assertEqual(len(scripts), 2)
        self.assertEqual(len(modules), 1)
        self.assertRegex(modules[0].get("src", ""), r"^/static/tienda/acceso(\.[0-9a-f]+)?\.js$")
        for script in scripts:
            self.assertTrue(script.get("src", "").startswith("/static/tienda/"))
        self.assertNotIn("<style", html)
        for _, attrs in tags.tags:
            self.assertNotIn("style", attrs)
            self.assertEqual([name for name in attrs if name.startswith("on")], [])

    def test_without_javascript_it_says_so(self):
        html = self.get().content.decode()

        match = re.search(r"<noscript>(.*?)</noscript>", html, flags=re.DOTALL)
        self.assertIsNotNone(match)
        self.assertIn("JavaScript", match.group(1))
        # The forms stay hidden until the script runs: a dead form would invite a typed password.
        self.assertIn(
            "hidden", next(a for a in parse(html).named("div") if a.get("id") == "acceso")
        )

    def test_it_hands_the_script_only_public_values(self):
        with override_settings(
            SUPABASE_URL="http://supabase.test",
            SUPABASE_PUBLISHABLE_KEY="sb_publishable_only_for_tests",
        ):
            html = self.get().content.decode()

        attrs = parse(html).named("div")
        config = next(a for a in attrs if a.get("id") == "acceso")
        self.assertEqual(config["data-supabase-url"], "http://supabase.test")
        self.assertEqual(config["data-supabase-key"], "sb_publishable_only_for_tests")
        self.assertEqual(config["data-sesion-url"], reverse("panel:sesion"))
        self.assertEqual(config["data-panel-url"], reverse("panel:inicio"))
        self.assertEqual(config["data-tienda-url"], reverse("ventas:catalogo"))
        self.assertTrue(config["data-supabase-js"].startswith("/static/tienda/vendor/supabase-js"))

    def test_no_secret_of_the_server_reaches_the_page(self):
        html = self.get().content.decode()

        self.assertNotIn(settings.SECRET_KEY, html)
        self.assertNotIn(settings.SUPABASE_JWT_SECRET, html)
        self.assertNotIn("service_role", html.lower())
        self.assertNotIn("SERVICE_KEY", html.upper())

    def test_without_the_publishable_key_the_page_says_it_is_not_configured(self):
        with override_settings(SUPABASE_PUBLISHABLE_KEY=""):
            response = self.get()

        self.assertEqual(response.status_code, 503)
        html = response.content.decode()
        self.assertIn("no está configurado", html)
        self.assertNotIn("data-supabase-key", html)
        # Only the header script of every page: the sign-in module is not loaded.
        sources = [attrs.get("src") for attrs in parse(html).named("script")]
        self.assertEqual(sources, ["/static/tienda/tienda.js"])

    def test_salir_is_accepted_and_the_page_is_never_cached(self):
        response = self.get(salir="1")

        self.assertEqual(response.status_code, 200)
        self.assertIn("no-store", response["Cache-Control"])
        self.assertIn('id="acceso-aviso"', response.content.decode())

    def test_the_admin_notice_only_when_the_address_asks_for_it(self):
        self.assertNotIn('data-admin="true"', self.get().content.decode())
        self.assertIn('data-admin="true"', self.get(admin="true").content.decode())

    def test_it_only_answers_safe_methods(self):
        self.assertEqual(self.client.put(reverse("ventas:acceso")).status_code, 405)


class AccessAssetsTests(SimpleTestCase):
    def test_the_script_and_the_supabase_build_are_files_of_the_project(self):
        script = finders.find("tienda/acceso.js")
        vendor = finders.find("tienda/vendor/supabase-js.mjs")

        self.assertIsNotNone(script)
        self.assertIsNotNone(vendor)

    def test_the_script_reaches_no_other_site_and_keeps_no_secret(self):
        source = read(finders.find("tienda/acceso.js"))

        self.assertNotRegex(source, r"https?://")
        self.assertNotIn("service_role", source.lower())
        self.assertNotIn("innerHTML", source)

    def test_the_vendored_library_has_no_network_import(self):
        source = read(finders.find("tienda/vendor/supabase-js.mjs"))

        self.assertNotRegex(source, r"""import\s*(\(|[^;]*from)\s*["']https?://""")
        self.assertIn("export{", source)

    def test_the_script_names_what_the_page_gives_it(self):
        source = read(finders.find("tienda/acceso.js"))

        for name in (
            "supabaseUrl",
            "supabaseKey",
            "sesionUrl",
            "panelUrl",
            "tiendaUrl",
            "supabaseJs",
        ):
            self.assertIn(f"dataset.{name}", source)


class LoginUrlTests(SimpleTestCase):
    def test_the_login_of_the_store_is_the_django_page(self):
        self.assertEqual(settings.STORE_LOGIN_URL, reverse("ventas:acceso"))

    def test_it_does_not_depend_on_where_the_old_store_lived(self):
        self.assertFalse(settings.STORE_LOGIN_URL.startswith("http"))
        self.assertNotIn("accessweb", settings.STORE_LOGIN_URL)
