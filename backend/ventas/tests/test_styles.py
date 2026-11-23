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
# index.html is the store's real landing: it is styled by the Vite build (Bootstrap and the site's
# own CSS, see test_landing.py), not by the panel's Tailwind stylesheet.
PANEL_TEMPLATES = sorted(path for path in TEMPLATES.glob("*.html") if path.name != "index.html")
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


STORE_TEMPLATES = sorted((TEMPLATES / "tienda").glob("*.html"))
STORE_CSS = "tienda/tienda.css"


class StoreStylesTests(SimpleTestCase):
    """The store pages compile their own stylesheet: a class it does not define draws nothing."""

    def test_every_class_of_every_store_template_is_defined_in_the_store_stylesheet(self):
        css = read_static(STORE_CSS)
        self.assertGreaterEqual(len(STORE_TEMPLATES), 10)

        for template in STORE_TEMPLATES:
            with self.subTest(template=template.name):
                missing = classes_missing_from(css, template.read_text(encoding="utf-8"))
                # `bento-{{ tile.slot }}` leaves `bento-` once the template tag is dropped.
                self.assertEqual([name for name in missing if not name.endswith("-")], [])


class StoreTokenContractTests(SimpleTestCase):
    """The tokens say how each colour may be used (assets/tokens.css): the hairline border is
    never the border of a control (1.88:1, below the 3:1 of WCAG 1.4.11) and the fill red is
    never text (about 4.1:1 on the background; `red-text` is the red for words)."""

    CONTROL = re.compile(r"<(?:input|select|textarea)\b[^>]*>")

    def test_no_control_uses_the_hairline_border(self):
        for template in STORE_TEMPLATES:
            html = template.read_text(encoding="utf-8")
            for tag in self.CONTROL.findall(html):
                with self.subTest(template=template.name, tag=tag[:60]):
                    self.assertNotRegex(tag, r"\bborder-border(?![-\w])")

    def test_red_is_never_used_as_a_text_colour(self):
        for template in STORE_TEMPLATES:
            with self.subTest(template=template.name):
                self.assertNotRegex(
                    template.read_text(encoding="utf-8"), r"(?<![-\w:])text-red(?![-\w])"
                )
