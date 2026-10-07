"""Tests for the environment parsers that config/settings.py relies on."""

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.env import (
    parse_bool,
    parse_http_url,
    parse_origin,
    parse_origins,
    parse_positive_int,
    parse_samesite,
)


class ParseOriginTests(SimpleTestCase):
    def test_an_origin_is_returned_as_a_browser_writes_it(self):
        self.assertEqual(parse_origin("http://localhost:3002", "X"), "http://localhost:3002")
        self.assertEqual(
            parse_origin("https://tienda.example.com", "X"), "https://tienda.example.com"
        )

    def test_case_spaces_and_a_trailing_slash_are_normalised(self):
        self.assertEqual(
            parse_origin("  HTTPS://Tienda.Example.com/ ", "X"), "https://tienda.example.com"
        )

    def test_a_default_port_is_dropped_because_browsers_leave_it_out(self):
        self.assertEqual(
            parse_origin("https://tienda.example.com:443", "X"), "https://tienda.example.com"
        )
        self.assertEqual(
            parse_origin("http://tienda.example.com:80", "X"), "http://tienda.example.com"
        )

    def test_a_port_that_is_not_the_default_one_is_kept(self):
        self.assertEqual(
            parse_origin("https://tienda.example.com:8443", "X"), "https://tienda.example.com:8443"
        )

    def test_an_ipv6_host_keeps_its_brackets(self):
        self.assertEqual(parse_origin("http://[::1]:3002", "X"), "http://[::1]:3002")

    def test_anything_that_is_not_an_origin_fails_and_names_the_variable(self):
        for value in (
            "",
            "localhost:3002",
            "ftp://tienda.example.com",
            "http://tienda.example.com/panel",
            "http://tienda.example.com?x=1",
            "http://tienda.example.com#top",
            "http://user:pass@tienda.example.com",
            "http://tienda.example.com:notaport",
            "*",
        ):
            with (
                self.subTest(value=value),
                self.assertRaisesMessage(ImproperlyConfigured, "PANEL_ALLOWED_ORIGINS"),
            ):
                parse_origin(value, "PANEL_ALLOWED_ORIGINS")


class ParseOriginsTests(SimpleTestCase):
    def test_a_comma_separated_list_is_parsed_in_order(self):
        self.assertEqual(
            parse_origins("http://localhost:3002, http://127.0.0.1:3002", "X"),
            ["http://localhost:3002", "http://127.0.0.1:3002"],
        )

    def test_duplicates_and_empty_entries_are_ignored(self):
        self.assertEqual(
            parse_origins("http://localhost:3002,,http://localhost:3002/,", "X"),
            ["http://localhost:3002"],
        )

    def test_an_empty_list_fails(self):
        for raw in ("", " , ,"):
            with (
                self.subTest(raw=raw),
                self.assertRaisesMessage(ImproperlyConfigured, "at least one origin"),
            ):
                parse_origins(raw, "X")

    def test_one_bad_entry_fails_the_whole_list(self):
        with self.assertRaises(ImproperlyConfigured):
            parse_origins("http://localhost:3002,not-an-origin", "X")


class ParsePositiveIntTests(SimpleTestCase):
    def test_a_whole_number_is_parsed(self):
        self.assertEqual(parse_positive_int(" 300 ", "X"), 300)

    def test_zero_negatives_and_text_fail(self):
        for raw in ("0", "-5", "abc", "", "1.5"):
            with self.subTest(raw=raw), self.assertRaises(ImproperlyConfigured):
                parse_positive_int(raw, "X")


class ParseHttpUrlTests(SimpleTestCase):
    def test_an_http_or_https_url_is_returned_as_given(self):
        url = "https://project.supabase.co/auth/v1/.well-known/jwks.json"

        self.assertEqual(parse_http_url(f" {url} ", "X"), url)
        self.assertEqual(parse_http_url("http://127.0.0.1:54321", "X"), "http://127.0.0.1:54321")

    def test_anything_else_fails(self):
        for value in ("", "127.0.0.1:54321", "file:///etc/passwd", "ftp://host", "http://"):
            with self.subTest(value=value), self.assertRaises(ImproperlyConfigured):
                parse_http_url(value, "X")


class ParseBoolTests(SimpleTestCase):
    def test_the_usual_spellings_of_true_and_false_are_read(self):
        for raw in ("1", "true", "True", " YES ", "on"):
            with self.subTest(raw=raw):
                self.assertIs(parse_bool(raw, "X", default=False), True)
        for raw in ("0", "false", "False", " NO ", "off"):
            with self.subTest(raw=raw):
                self.assertIs(parse_bool(raw, "X", default=True), False)

    def test_an_unset_or_empty_variable_gives_the_default(self):
        for raw in (None, "", "   "):
            with self.subTest(raw=raw):
                self.assertIs(parse_bool(raw, "X", default=True), True)
                self.assertIs(parse_bool(raw, "X", default=False), False)

    def test_a_typo_fails_instead_of_switching_the_flag_off(self):
        for raw in ("ture", "2", "enabled"):
            with self.subTest(raw=raw), self.assertRaisesMessage(ImproperlyConfigured, "X"):
                parse_bool(raw, "X", default=True)


class ParseSameSiteTests(SimpleTestCase):
    def test_lax_is_the_default(self):
        for raw in (None, "", " "):
            with self.subTest(raw=raw):
                self.assertEqual(parse_samesite(raw, "X", secure=False), "Lax")

    def test_lax_is_read_in_any_case(self):
        self.assertEqual(parse_samesite("lax", "X", secure=False), "Lax")
        self.assertEqual(parse_samesite(" LAX ", "X", secure=True), "Lax")

    def test_none_needs_secure_cookies(self):
        self.assertEqual(parse_samesite("None", "X", secure=True), "None")
        with self.assertRaisesMessage(ImproperlyConfigured, "Secure"):
            parse_samesite("None", "X", secure=False)

    def test_strict_is_refused_because_the_handoff_could_not_work_with_it(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "Strict"):
            parse_samesite("Strict", "DJANGO_COOKIE_SAMESITE", secure=True)

    def test_anything_else_fails(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "DJANGO_COOKIE_SAMESITE"):
            parse_samesite("sometimes", "DJANGO_COOKIE_SAMESITE", secure=True)
