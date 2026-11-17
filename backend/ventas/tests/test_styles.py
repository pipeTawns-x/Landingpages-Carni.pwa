"""Tests of the styles of the sales pages.

The panel stylesheet is compiled with Tailwind inside Docker and committed, so a class that it
does not define draws nothing. The sales pages use Tailwind utilities only: the hand-written
`static/ventas/ventas.css` and its `v-` classes are gone; these tests keep them gone.
"""

import re
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase

from panel.test_stylesheet import classes_missing_from

TEMPLATES = Path(settings.BASE_DIR) / "ventas" / "templates" / "ventas"
PANEL_CSS = "panel/panel.css"
# The public store templates live in ventas/tienda/ and have their own tests.
PANEL_TEMPLATES = sorted(TEMPLATES.glob("*.html"))
V_CLASS = re.compile(r"""class="[^"]*(?<![\w-])v-[a-z]""")


def read_static(path):
    found = finders.find(path)
    if found is None:
        raise AssertionError(f"{path} is not served by the static finders")
    return Path(found).read_text(encoding="utf-8")


class SalesStylesTests(SimpleTestCase):
    def test_the_hand_written_stylesheet_is_gone(self):
        self.assertIsNone(finders.find("ventas/ventas.css"))

    def test_no_template_of_the_sales_pages_links_it_or_uses_a_v_class(self):
        self.assertGreaterEqual(len(PANEL_TEMPLATES), 4)
        for template in PANEL_TEMPLATES:
            html = template.read_text(encoding="utf-8")
            with self.subTest(template=template.name):
                self.assertNotIn("ventas.css", html)
                self.assertIsNone(V_CLASS.search(html))

    def test_every_class_of_every_template_is_defined_in_the_panel_stylesheet(self):
        css = read_static(PANEL_CSS)

        for template in PANEL_TEMPLATES:
            with self.subTest(template=template.name):
                missing = classes_missing_from(css, template.read_text(encoding="utf-8"))
                self.assertEqual(missing, [])

    def test_the_steps_of_the_bars_are_classes_of_the_stylesheet(self):
        css = read_static(PANEL_CSS)
        for template in ("_step_h.html", "_step_w.html"):
            prefix = "h" if template == "_step_h.html" else "w"
            for step in range(1, 11):
                with self.subTest(template=template, step=step):
                    name = f".{prefix}-\\[{step * 10}\\%\\]"
                    self.assertIn(name, css)
