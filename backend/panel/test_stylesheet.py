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
CLASS_ATTRIBUTE = re.compile(r'class="([^"]*)"')
TEMPLATE_TAG = re.compile(r"\{%.*?%\}|\{\{.*?\}\}")

# The templates of the panel whose classes `PageClassesTests` checks. The stylesheet is committed,
# not built when the page is served, so a page may only use classes it already defines.
PANEL_PAGES = ("panel/base.html", "panel/mas.html", "panel/messages.html")


def custom_properties(css):
    """Map each custom property declared in `css` to its value."""
    return {name: value.strip() for name, value in CUSTOM_PROPERTY.findall(css)}


def classes_missing_from(css, html):
    """Return the classes `html` uses in a `class` attribute that `css` does not define.

    A class counts as defined when `.<class>` is in the CSS, escaped the way Tailwind
    escapes it (`lg:pl-62` is `.lg\\:pl-62`) and not followed by more of the same
    identifier (`.size-5` is not `.size-5\\.5`). Django tags inside an attribute are dropped
    before it is split.
    """
    used = set()
    for value in CLASS_ATTRIBUTE.findall(html):
        used.update(TEMPLATE_TAG.sub(" ", value).split())

    missing = []
    for name in sorted(used):
        selector = "." + re.sub(r"([^a-zA-Z0-9_-])", r"\\\1", name)
        if not re.search(re.escape(selector) + r"(?![\w\\-])", css):
            missing.append(name)
    return missing


def undefined_classes(template_name):
    """Return the classes of a template that the compiled stylesheet does not define.

    Tailwind only compiles the classes it finds in the templates when the script runs, so a
    class added to a page without rebuilding the stylesheet silently has no style.
    """
    css = Path(finders.find(STYLESHEET)).read_text(encoding="utf-8")
    html = (Path(settings.BASE_DIR) / "templates" / template_name).read_text(encoding="utf-8")
    return classes_missing_from(css, html)


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

    def test_it_carries_the_base_layer_of_the_panel_pages(self):
        # What src/styles/panel.css gives the store's copy of these pages, and what panel/base.html
        # relies on: the page background and type, the heading font and the sand focus ring.
        css = squash(self.css)
        for rule in (
            "html{color-scheme:dark;scrollbar-gutter:stable;",
            "body{background:var(--color-bg);color:var(--color-text);font-family:var(--font-sans);",
            "font-size:var(--text-ui);line-height:var(--text-ui--line-height);",
            "h1,h2,h3{font-family:var(--font-display);",
            ":focus-visible{outline:2pxsolidvar(--color-sand);outline-offset:2px}",
        ):
            with self.subTest(rule=rule):
                self.assertIn(rule, css)

    def test_it_has_the_utilities_the_frame_and_the_pages_use(self):
        # A spot check that Tailwind scanned the templates: the frame's own utilities, and the
        # variants it builds on aria-current.
        utilities = (
            ".lg\\:pl-62",
            ".min-h-dvh",
            ".duration-160",
            ".size-5\\.5",
            ".rounded-control",
        )
        for selector in utilities:
            with self.subTest(selector=selector):
                self.assertIn(selector, self.css)
        self.assertIn("[aria-current]", self.css)

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


class ClassesMissingFromTests(SimpleTestCase):
    """The check that the pages below rely on, tried on small inputs."""

    CSS = ".flex{display:flex}.lg\\:pl-62{padding-left:1rem}.size-5\\.5{width:1rem}"

    def test_a_class_the_css_defines_is_not_reported(self):
        html = '<p class="flex lg:pl-62 size-5.5">'

        self.assertEqual(classes_missing_from(self.CSS, html), [])

    def test_a_class_the_css_lacks_is_reported(self):
        html = '<p class="flex gap-9 lg:pl-9">'

        self.assertEqual(classes_missing_from(self.CSS, html), ["gap-9", "lg:pl-9"])

    def test_a_class_is_not_found_by_the_start_of_a_longer_one(self):
        # `.size-5\.5` is defined, `.size-5` is not.
        self.assertEqual(classes_missing_from(self.CSS, '<p class="size-5">'), ["size-5"])

    def test_django_tags_inside_the_attribute_are_not_classes(self):
        html = '<p class="flex {% if big %}size-5.5{% endif %} {{ extra }}">'

        self.assertEqual(classes_missing_from(self.CSS, html), [])


class PageClassesTests(SimpleTestCase):
    """The pages are styled by the committed stylesheet, so they may only use classes it defines."""

    def test_every_class_of_the_panel_pages_is_defined_by_the_stylesheet(self):
        for template_name in PANEL_PAGES:
            with self.subTest(template=template_name):
                self.assertEqual(undefined_classes(template_name), [])
