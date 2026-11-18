"""Tests of the header of the store, the same on every public page (Eduardo, 2026-11-18).

Left: "Menú" and the search. Centre: the title. Right: "Contacto", favourites, the account and
the cart. Each button opens its panel with the native `popover` attribute, so the panels open
without JavaScript; `static/tienda/tienda.js` only adds the live search, the favourites, the
header over the video and the pause button of the video. The cart panel lists what the session
holds (names, amounts and notes, no prices: the prices are on the cart page) and never blocks the
page behind it (`popover="manual"`, Engram #541).
"""

import json
import re
from decimal import Decimal
from pathlib import Path
from unittest import mock

from django.contrib.staticfiles import finders
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from inventory.models import Product
from ventas.negocio import NEGOCIO
from ventas.tests.support import FakeGateway, make_store

PAGES = ("ventas:landing", "ventas:catalogo", "ventas:acceso", "ventas:carrito")
PANELS = ("menu", "buscador", "contactar", "favoritos", "bolsa")


def header_of(html):
    start = html.index("<header")
    return html[start : html.index("</header>", start)]


class HeaderTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()

    def setUp(self):
        ids = {key: self.store[key].pk for key in ("bistec", "molida", "camiseta")}
        patcher = mock.patch(
            "ventas.services.get_gateway", return_value=FakeGateway.from_cases(ids)
        )
        patcher.start()
        self.addCleanup(patcher.stop)
        cache.clear()
        self.addCleanup(cache.clear)

    def page(self, name="ventas:landing"):
        return self.client.get(reverse(name)).content.decode()


class SameHeaderTests(HeaderTestCase):
    def test_every_page_has_the_same_buttons_in_the_same_order(self):
        layouts = []
        for name in PAGES:
            header = header_of(self.page(name))
            with self.subTest(page=name):
                targets = re.findall(r'popovertarget="([a-z]+)"', header)
                self.assertEqual(
                    list(dict.fromkeys(targets)),
                    ["menu", "buscador", "contactar", "favoritos", "bolsa"],
                )
                self.assertIn('href="/acceso/"', header)
                self.assertIn(">Menú<", header)
                self.assertIn(">Contacto<", header)
            layouts.append(re.sub(r"\s+", " ", header).replace(' aria-current="page"', ""))
        # Only the mode over the video may differ.
        normalized = {re.sub(r'data-cabecera="[a-z]+"', "", h) for h in layouts}
        self.assertEqual(len(normalized), 1)

    def test_every_panel_exists_once_with_a_label_and_a_close_button(self):
        html = self.page()
        for panel in PANELS:
            with self.subTest(panel=panel):
                self.assertEqual(html.count(f'id="{panel}"'), 1)
                tag = re.search(rf'<[a-z]+ id="{panel}"[^>]*>', html).group(0)
                self.assertRegex(tag, r'\bpopover(="(auto|manual)")?')
                self.assertRegex(tag, r'aria-label(ledby)?="')
                self.assertRegex(html, rf'popovertarget="{panel}" popovertargetaction="hide"')

    def test_the_cart_panel_does_not_block_the_page_behind_it(self):
        tag = re.search(r'<[a-z]+ id="bolsa"[^>]*>', self.page()).group(0)

        self.assertIn('popover="manual"', tag)

    def test_the_title_sits_in_the_centre_and_goes_home(self):
        header = header_of(self.page("ventas:catalogo"))

        self.assertRegex(header, r'<a href="/" aria-label="[^"]*" class="justify-self-center')

    def test_the_landing_puts_the_header_over_the_video_and_the_others_do_not(self):
        self.assertIn('data-cabecera="sobre"', header_of(self.page("ventas:landing")))
        for name in ("ventas:catalogo", "ventas:acceso", "ventas:carrito"):
            with self.subTest(page=name):
                self.assertIn('data-cabecera="solida"', header_of(self.page(name)))


class PanelsTests(HeaderTestCase):
    def test_the_menu_links_the_pages_and_the_active_categories(self):
        html = self.page()
        menu = html[html.index('id="menu"') :]
        menu = menu[: menu.index("</aside>")]

        for href in ("/", "/productos/", "/acceso/", "/#preguntas", "/privacidad/"):
            with self.subTest(href=href):
                self.assertIn(f'href="{href}"', menu)
        self.assertIn(f'href="/productos/?category={self.store["meat"].pk}"', menu)
        self.assertIn(">Res<", menu)

    def test_the_search_is_a_get_form_to_the_catalogue(self):
        html = self.page()
        search = html[html.index('id="buscador"') :]

        self.assertRegex(search, r'<form [^>]*method="get" action="/productos/"')
        self.assertRegex(search, r'<input [^>]*type="search" name="q"')

    def test_the_contact_panel_carries_the_phone_whatsapp_address_and_hours(self):
        html = self.page("ventas:catalogo")
        panel = html[html.index('id="contactar"') :]
        panel = panel[: panel.index("</aside>")]

        self.assertIn(NEGOCIO["telefono_href"], panel)
        self.assertIn(NEGOCIO["whatsapp_href"], panel)
        self.assertIn(NEGOCIO["direccion"][0], panel)
        self.assertIn("Lunes a sábado", panel)

    def test_the_footer_keeps_its_contact_section(self):
        html = self.page()
        footer = html[html.index("<footer") :]

        self.assertIn(NEGOCIO["telefono_href"], footer)


class CartPanelTests(HeaderTestCase):
    def add(self, key, **fields):
        data = {"mode": "weight", "amount": "0.5", "unit": "kg"}
        data.update(fields)
        self.client.post(reverse("ventas:tienda_agregar", args=[self.store[key].pk]), data)

    def bolsa(self, name="ventas:catalogo"):
        html = self.page(name)
        panel = html[html.index('id="bolsa"') :]
        return panel[: panel.index("</aside>")]

    def test_an_empty_cart_says_so(self):
        self.assertIn("Tu carrito está vacío.", self.bolsa())

    def test_it_lists_each_line_with_its_amount_and_note_and_no_price(self):
        self.add("bistec", note="Sin tanta grasa")
        self.add("molida", mode="money", amount="150", unit="")

        panel = self.bolsa()

        self.assertIn("Bistec", panel)
        self.assertIn("0.5 kg", panel)
        self.assertIn("Sin tanta grasa", panel)
        self.assertIn("Molida", panel)
        self.assertIn("$150", panel)
        self.assertNotIn("$100", panel)  # the quote of the bistec is not shown here
        self.assertIn('href="/carrito/"', panel)

    def test_each_line_can_be_removed_with_a_post_form(self):
        self.add("bistec")

        panel = self.bolsa()

        action = reverse("ventas:tienda_quitar", args=[self.store["bistec"].pk])
        self.assertRegex(panel, rf'<form method="post" action="{action}"')
        self.assertIn("csrfmiddlewaretoken", panel)

    def test_the_counter_in_the_header_counts_the_lines(self):
        self.add("bistec")
        self.add("molida")

        self.assertRegex(header_of(self.page()), r"data-cart-count[^>]*>2<")

    def test_a_product_that_left_the_catalogue_is_not_listed(self):
        self.add("bistec")
        Product.objects.filter(pk=self.store["bistec"].pk).update(is_active=False)

        self.assertNotIn("Bistec", self.bolsa())


class SearchJsonTests(HeaderTestCase):
    def search(self, q):
        return self.client.get(reverse("ventas:buscar"), {"q": q})

    def test_it_returns_the_matching_active_products_with_their_page(self):
        data = json.loads(self.search("bis").content)

        self.assertEqual(len(data["resultados"]), 1)
        result = data["resultados"][0]
        self.assertEqual(result["nombre"], "Bistec")
        self.assertEqual(result["url"], reverse("ventas:producto", args=[self.store["bistec"].pk]))
        self.assertEqual(result["precio"], "200.00")
        self.assertEqual(result["unidad"], "kg")
        self.assertNotIn("cost", json.dumps(data))

    def test_a_query_shorter_than_two_letters_returns_nothing(self):
        self.assertEqual(json.loads(self.search("b").content), {"resultados": []})

    def test_it_never_returns_more_than_eight(self):
        meat = self.store["meat"]
        for n in range(12):
            Product.objects.create(category=meat, name=f"Corte {n}", price_per_kg=Decimal("1"))

        self.assertEqual(len(json.loads(self.search("corte").content)["resultados"]), 8)

    def test_only_a_read_is_allowed(self):
        self.assertEqual(self.client.post(reverse("ventas:buscar")).status_code, 405)


class HeroVideoTests(HeaderTestCase):
    def test_the_video_has_a_pause_button(self):
        html = self.page()

        self.assertRegex(html, r'<button [^>]*data-hero-toggle[^>]*aria-pressed="false"[^>]*>')
        self.assertIn('aria-label="Pausar el video"', html)

    def test_the_video_is_never_scaled_by_the_motion_script(self):
        script = Path(finders.find("tienda/landing.js")).read_text(encoding="utf-8")

        self.assertNotRegex(script, r'"\[data-hero-video\]"[^;]*scale')

    def test_the_frame_is_never_cut_to_the_height_of_the_screen(self):
        tag = re.search(r"<div data-hero-media[^>]*>", self.page()).group(0)

        self.assertIn("aspect-video", tag)
        self.assertNotIn("max-h-", tag)

    def test_every_page_loads_the_header_script_from_the_site(self):
        for name in PAGES:
            with self.subTest(page=name):
                self.assertRegex(self.page(name), r'<script [^>]*src="/static/tienda/tienda\.js"')
