"""Tests for the compiled stylesheet of the panel and the fonts it loads.

backend/static/panel/panel.css is compiled by backend/scripts/build_panel_css.sh
(Tailwind v4, inside Docker) from backend/assets/panel.css and the store's design
tokens, and it is committed because the Django runtime has no Node. These tests
need neither Docker nor a network: they check that Django's static finders serve
the files and that the committed CSS carries the store's tokens and the
self-hosted fonts. Whether the CSS is up to date with its sources is what
`build_panel_css.sh --check` answers.
"""

import posixpath
import re
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase

STYLESHEET = "panel/panel.css"
# The family each @font-face has to declare, and the file it has to load.
FONTS = {
    "Geist Variable": "panel/fonts/geist/geist-latin-wght-normal.woff2",
    "Fraunces Variable": "panel/fonts/fraunces/fraunces-latin-opsz-normal.woff2",
}
# The fonts are SIL OFL: the license travels with each file.
FONT_LICENSES = ["panel/fonts/geist/LICENSE", "panel/fonts/fraunces/LICENSE"]
TOKENS_FILE = Path(settings.BASE_DIR) / "assets" / "tokens.css"

CUSTOM_PROPERTY = re.compile(r"(--[a-z0-9-]+)\s*:\s*([^;}]+)")


def custom_properties(css):
    """Map each custom property declared in `css` to its value."""
    return {name: value.strip() for name, value in CUSTOM_PROPERTY.findall(css)}


def squash(value):
    """Drop the whitespace, which the minifier is free to change."""
    return re.sub(r"\s+", "", value)


def long_hex(value):
    """Lower-case a hex colour and expand #abc to #aabbcc, as the minifier may shorten it."""
    value = value.lower()
    if re.fullmatch(r"#[0-9a-f]{3}", value):
        value = "#" + "".join(digit * 2 for digit in value[1:])
    return value


class ServedFilesTests(SimpleTestCase):
    def test_the_finders_serve_the_stylesheet_the_fonts_and_their_licenses(self):
        for path in [STYLESHEET, *FONTS.values(), *FONT_LICENSES]:
            with self.subTest(path=path):
                self.assertIsNotNone(finders.find(path))

    def test_the_font_files_are_woff2(self):
        for path in FONTS.values():
            with self.subTest(path=path):
                found = finders.find(path)
                self.assertIsNotNone(found)
                self.assertEqual(Path(found).read_bytes()[:4], b"wOF2")

    def test_the_tailwind_sources_are_not_served(self):
        for path in ("tokens.css", "panel.css", "assets/tokens.css", "assets/panel.css"):
            with self.subTest(path=path):
                self.assertIsNone(finders.find(path))


class CompiledStylesheetTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        found = finders.find(STYLESHEET)
        if found is None:
            raise AssertionError(f"{STYLESHEET} is not served by the static finders")
        cls.css = Path(found).read_text(encoding="utf-8")
        cls.compiled = custom_properties(cls.css)
        cls.tokens = custom_properties(TOKENS_FILE.read_text(encoding="utf-8"))

    def test_it_declares_every_custom_property_of_the_store_tokens(self):
        # A token added to tokens.css without a rebuild fails here, with no Docker needed.
        self.assertGreater(len(self.tokens), 30)
        self.assertEqual([name for name in self.tokens if name not in self.compiled], [])

    def test_it_carries_the_colours_and_font_stacks_of_the_store_tokens(self):
        checked = 0
        for name, value in self.tokens.items():
            compiled = self.compiled.get(name, "")
            if name.startswith("--color-") and re.fullmatch(r"#[0-9a-fA-F]{3,8}", value):
                with self.subTest(name=name):
                    self.assertEqual(long_hex(compiled), long_hex(value))
                checked += 1
            elif name.startswith("--font-"):
                with self.subTest(name=name):
                    self.assertEqual(squash(compiled), squash(value))
                checked += 1
        self.assertGreater(checked, 10)

    def test_it_declares_both_font_families_with_font_display_swap(self):
        faces = re.findall(r"@font-face\s*\{([^}]*)\}", self.css)
        families = set()
        for face in faces:
            with self.subTest(face=face[:60]):
                self.assertRegex(face, r"font-display:\s*swap")
            family = re.search(r"font-family:\s*[\"']?([^;\"']+)", face)
            self.assertIsNotNone(family)
            families.add(family.group(1).strip())
        self.assertEqual(families, set(FONTS))

    def test_the_font_tokens_name_families_the_stylesheet_declares(self):
        # If the store renames a family in tokens.css, the panel must load the new file.
        for name in ("--font-sans", "--font-display"):
            with self.subTest(name=name):
                first_family = re.match(r'"([^"]+)"', self.tokens[name])
                self.assertIsNotNone(first_family, f"{name} should start with a quoted family")
                self.assertIn(first_family.group(1), FONTS)

    def test_it_is_self_contained_and_every_url_in_it_is_served(self):
        self.assertNotIn("@import", self.css)
        urls = re.findall(r"url\(\s*[\"']?([^)\"']+)", self.css)
        served = set()
        for url in urls:
            with self.subTest(url=url):
                self.assertNotRegex(url, r"^(?:https?:)?//", "the panel loads nothing from a CDN")
                if not url.startswith("data:"):
                    # Relative to the compiled file, which lives in static/panel/.
                    path = posixpath.normpath(posixpath.join("panel", url))
                    self.assertIsNotNone(finders.find(path))
                    served.add(path)
        self.assertLessEqual(set(FONTS.values()), served)
