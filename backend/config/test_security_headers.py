"""Tests of the security headers of every response (OWASP Top 10 2025, A02 misconfiguration).

- Content-Security-Policy: scripts, styles, fonts and media only from the site, images also from
  the Supabase Storage of the project, connections only to the site and to Supabase (the access
  page signs in from the browser), no frames around the site, no plugins. No inline script runs:
  the store templates have none (ventas/tests), so the policy needs no 'unsafe-inline' for them.
  Django's admin keeps inline styles, so only its pages allow them.
- Permissions-Policy turns off the device features the store never uses.
- Cross-Origin-Resource-Policy keeps other sites from embedding the responses.
- HSTS and the redirect to https are on whenever the cookies are secure (the deployment), and
  off on a local http run.
"""

import json
import os
import subprocess
import sys

from django.conf import settings
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from config.test_deploy import BACKEND_DIR, BASE_ENV
from ventas.tests.support import make_store

PRINT_SECURITY = """
import json
from config import settings
print(json.dumps({
    "hsts": settings.SECURE_HSTS_SECONDS,
    "subdomains": settings.SECURE_HSTS_INCLUDE_SUBDOMAINS,
    "redirect": settings.SECURE_SSL_REDIRECT,
}))
"""


def directives(header):
    """The CSP as {directive: [sources]}."""
    parsed = {}
    for part in header.split(";"):
        words = part.split()
        if words:
            parsed[words[0]] = words[1:]
    return parsed


class HeadersTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        make_store()

    def csp_of(self, url):
        response = self.client.get(url)
        self.assertIn("Content-Security-Policy", response.headers)
        return directives(response.headers["Content-Security-Policy"])

    def test_the_store_pages_run_scripts_only_from_the_site(self):
        for name in ("ventas:landing", "ventas:catalogo", "ventas:acceso", "ventas:carrito"):
            with self.subTest(page=name):
                csp = self.csp_of(reverse(name))
                self.assertEqual(csp["default-src"], ["'self'"])
                self.assertEqual(csp["script-src"], ["'self'"])
                self.assertEqual(csp["style-src"], ["'self'"])
                self.assertEqual(csp["object-src"], ["'none'"])
                self.assertEqual(csp["frame-ancestors"], ["'none'"])
                self.assertEqual(csp["base-uri"], ["'self'"])
                self.assertEqual(csp["form-action"], ["'self'"])

    def test_images_and_connections_also_reach_supabase_and_nothing_else(self):
        csp = self.csp_of(reverse("ventas:landing"))

        self.assertEqual(csp["img-src"], ["'self'", "data:", settings.SUPABASE_URL])
        self.assertEqual(csp["connect-src"], ["'self'", settings.SUPABASE_URL])
        self.assertEqual(csp["media-src"], ["'self'"])

    def test_the_admin_keeps_its_inline_styles_and_nothing_more(self):
        csp = self.csp_of(reverse("admin:login"))

        self.assertEqual(csp["style-src"], ["'self'", "'unsafe-inline'"])
        self.assertEqual(csp["script-src"], ["'self'"])

    def test_the_device_features_are_off_and_other_sites_cannot_embed_a_response(self):
        response = self.client.get(reverse("ventas:catalogo"))

        policy = response.headers["Permissions-Policy"]
        for feature in ("camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()"):
            with self.subTest(feature=feature):
                self.assertIn(feature, policy)
        self.assertEqual(response.headers["Cross-Origin-Resource-Policy"], "same-origin")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")

    def test_a_json_answer_carries_them_too(self):
        response = self.client.get(reverse("ventas:buscar"), {"q": "bis"})

        self.assertIn("Content-Security-Policy", response.headers)


class HttpsSettingsTests(SimpleTestCase):
    def loaded(self, **environment):
        inherited = {
            name: os.environ[name] for name in ("PATH", "HOME", "LANG") if name in os.environ
        }
        result = subprocess.run(
            [sys.executable, "-c", PRINT_SECURITY],
            cwd=BACKEND_DIR,
            env={**inherited, **BASE_ENV, **environment},
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_with_secure_cookies_hsts_and_the_redirect_are_on(self):
        loaded = self.loaded(DJANGO_COOKIE_SECURE="true")

        self.assertEqual(loaded["hsts"], 31536000)
        self.assertTrue(loaded["subdomains"])
        self.assertTrue(loaded["redirect"])

    def test_on_a_local_http_run_they_are_off(self):
        loaded = self.loaded(DJANGO_COOKIE_SECURE="false")

        self.assertEqual(loaded["hsts"], 0)
        self.assertFalse(loaded["redirect"])

    def test_the_redirect_can_be_switched_off_on_its_own(self):
        loaded = self.loaded(DJANGO_COOKIE_SECURE="true", DJANGO_SSL_REDIRECT="false")

        self.assertFalse(loaded["redirect"])
        self.assertEqual(loaded["hsts"], 31536000)
