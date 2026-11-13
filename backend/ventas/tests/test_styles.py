"""Tests of the styles of the sales pages.

The panel stylesheet is compiled with Tailwind inside Docker and committed, so a class that it
does not define draws nothing. The sales pages use what it already defines plus
`static/ventas/ventas.css`, written by hand on the same tokens, and these tests keep both honest.
"""

import re
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase

from panel.test_stylesheet import classes_missing_from

TEMPLATES = Path(settings.BASE_DIR) / "ventas" / "templates" / "ventas"
PANEL_CSS = "panel/panel.css"
VENTAS_CSS = "ventas/ventas.css"


def read_static(path):
    found = finders.find(path)
    if found is None:
        raise AssertionError(f"{path} is not served by the static finders")
    return Path(found).read_text(encoding="utf-8")


class SalesStylesTests(SimpleTestCase):
    def test_the_stylesheet_is_served(self):
        self.assertIsNotNone(finders.find(VENTAS_CSS))

    def test_it_uses_the_tokens_of_the_store_and_nothing_remote(self):
        css = read_static(VENTAS_CSS)

        self.assertIn("var(--color-", css)
        self.assertNotRegex(css, r"@import|https?://")
        # No colour of its own: every colour is a token of the palette.
        self.assertEqual(re.findall(r"#[0-9a-fA-F]{3,8}\b", css), [])

    def test_every_class_of_every_template_is_defined_in_one_of_the_two_stylesheets(self):
        css = read_static(PANEL_CSS) + read_static(VENTAS_CSS)
        templates = sorted(TEMPLATES.glob("*.html"))

        self.assertGreaterEqual(len(templates), 3)
        for template in templates:
            with self.subTest(template=template.name):
                missing = classes_missing_from(css, template.read_text(encoding="utf-8"))
                self.assertEqual(missing, [])
