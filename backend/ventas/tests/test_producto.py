"""Tests of the page of a product (ventas:producto, /productos/<id>/): its configuration.

The configuration of the CodePen dPGYMxJ (Engram #541): price per kilo and per pound, the way to
order it (by weight in kg, g or lb, by money, or by pieces), the thickness of the cut with a
slider when the panel says the cut is sold by pieces, free notes that travel with the line to the
panel, and a live summary. Nothing is added without passing through it: no hidden "1 kg".
The live summary asks the store (`quote_cart`) through ventas:producto_cotizar; the browser
never computes a price.
"""

import json
import re
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from inventory.models import CutSpec
from ventas.tests.support import FakeGateway, make_store


class ProductTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()

    def setUp(self):
        ids = {key: self.store[key].pk for key in ("bistec", "molida", "camiseta")}
        self.gateway = FakeGateway.from_cases(ids)
        patcher = mock.patch("ventas.services.get_gateway", return_value=self.gateway)
        patcher.start()
        self.addCleanup(patcher.stop)
        cache.clear()
        self.addCleanup(cache.clear)

    def url(self, key="bistec"):
        return reverse("ventas:producto", args=[self.store[key].pk])

    def html(self, key="bistec"):
        return self.client.get(self.url(key)).content.decode()


class PageTests(ProductTestCase):
    def test_it_lives_under_productos(self):
        self.assertEqual(self.url(), f"/productos/{self.store['bistec'].pk}/")
        self.assertTemplateUsed(self.client.get(self.url()), "ventas/tienda/producto.html")

    def test_an_inactive_or_unknown_product_is_a_404(self):
        self.store["molida"].is_active = False
        self.store["molida"].save()

        self.assertEqual(self.client.get(self.url("molida")).status_code, 404)
        self.assertEqual(
            self.client.get(reverse("ventas:producto", args=[999999])).status_code, 404
        )

    def test_it_shows_the_price_per_kilo_and_per_pound(self):
        html = self.html()

        self.assertIn("$200.00", html)
        self.assertIn("/ kg", html)
        self.assertIn("$90.72", html)  # 200 / 2.20462
        self.assertIn("/ lb", html)

    def test_it_offers_only_the_modes_the_store_accepts(self):
        modes = re.findall(r'name="mode" value="([a-z]+)"', self.html("molida"))

        self.assertEqual(modes, ["weight", "money"])
        self.assertEqual(
            re.findall(r'name="mode" value="([a-z]+)"', self.html("bistec")),
            ["weight", "money", "pieces"],
        )
        self.assertEqual(
            re.findall(r'name="mode" value="([a-z]+)"', self.html("camiseta")), ["pieces"]
        )

    def test_pieces_are_offered_only_when_the_panel_says_so(self):
        bistec = self.store["bistec"]
        bistec.sale_modes = ["money", "weight"]
        bistec.save()

        html = self.html()

        self.assertEqual(re.findall(r'name="mode" value="([a-z]+)"', html), ["weight", "money"])
        self.assertNotIn('name="thickness_in"', html)

    def test_the_weight_unit_offers_kg_g_and_lb(self):
        units = re.findall(r'name="unit" value="([a-z]+)"', self.html())

        self.assertEqual(units, ["kg", "g", "lb"])

    def test_the_thickness_slider_takes_its_range_from_the_panel(self):
        CutSpec.objects.filter(product=self.store["bistec"]).update(
            thickness_min_in=Decimal("0.75"),
            thickness_max_in=Decimal("2.50"),
            thickness_default_in=Decimal("1.25"),
        )

        tag = re.search(r'<input [^>]*name="thickness_in"[^>]*>', self.html()).group(0)

        self.assertIn('type="range"', tag)
        self.assertIn('min="0.75"', tag)
        self.assertIn('max="2.50"', tag)
        self.assertIn('step="0.25"', tag)
        self.assertIn('value="1.25"', tag)

    def test_without_pieces_there_is_no_thickness(self):
        self.assertNotIn('name="thickness_in"', self.html("molida"))

    def test_the_notes_travel_with_the_line(self):
        tag = re.search(r'<textarea [^>]*name="note"[^>]*>', self.html()).group(0)

        self.assertIn('maxlength="200"', tag)

    def test_nothing_is_preset_to_one_kilo(self):
        html = self.html()

        self.assertNotRegex(html, r'type="hidden" name="amount"')
        self.assertNotIn("Agregar 1 kg", html)
        self.assertRegex(html, r'<input [^>]*name="amount"[^>]*required')

    def test_the_form_adds_to_the_cart_and_comes_back_to_the_cart(self):
        html = self.html()

        action = reverse("ventas:tienda_agregar", args=[self.store["bistec"].pk])
        self.assertRegex(html, rf'<form [^>]*method="post" action="{action}"')
        self.assertIn('name="next" value="/carrito/"', html)

    def test_adding_by_pieces_with_a_thickness_and_a_note_keeps_them(self):
        self.client.post(
            reverse("ventas:tienda_agregar", args=[self.store["bistec"].pk]),
            {
                "mode": "pieces",
                "amount": "4",
                "unit": "kg",
                "thickness_in": "1.25",
                "note": "Con más grasa",
                "next": "/carrito/",
            },
        )

        line = self.client.session["tienda_cart"][0]
        self.assertEqual((line["mode"], line["amount"]), ("pieces", "4"))
        self.assertEqual(line["thickness_in"], "1.25")
        self.assertEqual(line["note"], "Con más grasa")

    def test_the_catalogue_cards_open_the_page(self):
        # The landing's showcase cards open it too: see test_landing.py.
        html = self.client.get(reverse("ventas:catalogo")).content.decode()

        self.assertIn(f'href="{self.url()}"', html)
        self.assertIn("Haz clic para personalizar tu pedido", html)
        self.assertNotIn("Agregar 1 kg", html)
        self.assertNotIn("Agregar 1 pieza", html)


class QuoteTests(ProductTestCase):
    def quote(self, key="bistec", **params):
        url = reverse("ventas:producto_cotizar", args=[self.store[key].pk])
        return self.client.get(url, params)

    def test_it_returns_the_total_the_store_gives(self):
        response = self.quote(mode="weight", amount="0.5", unit="kg")
        data = json.loads(response.content)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["total"], "100.00")
        self.assertEqual(data["kg"], "0.500")
        self.assertEqual(len(self.gateway.quotes), 1)

    def test_pieces_with_a_thickness_return_the_weight_the_store_estimates(self):
        data = json.loads(self.quote(mode="pieces", amount="4", thickness_in="1").content)

        self.assertEqual(data["kg"], "0.600")
        self.assertEqual(data["piezas"], 4)

    def test_a_bad_line_says_why_with_a_400(self):
        response = self.quote(mode="pieces", amount="1.5")

        self.assertEqual(response.status_code, 400)
        self.assertIn("enteros", json.loads(response.content)["error"])

    def test_the_note_is_not_needed_and_no_cart_changes(self):
        self.quote(mode="money", amount="150")

        self.assertNotIn("tienda_cart", self.client.session)

    def test_only_a_read_is_allowed(self):
        url = reverse("ventas:producto_cotizar", args=[self.store["bistec"].pk])
        self.assertEqual(self.client.post(url).status_code, 405)

    def test_the_answer_is_never_cached(self):
        response = self.quote(mode="weight", amount="1", unit="kg")

        self.assertIn("no-store", response["Cache-Control"])

    def test_a_client_that_asks_too_often_gets_a_429_before_any_lookup(self):
        from ventas.views.productos import QUOTES_PER_MINUTE

        for _ in range(QUOTES_PER_MINUTE):
            self.quote(mode="weight", amount="1", unit="kg")
        asked = len(self.gateway.quotes)

        response = self.client.get(reverse("ventas:producto_cotizar", args=[999999]))

        self.assertEqual(response.status_code, 429)
        self.assertEqual(len(self.gateway.quotes), asked)

    def test_a_line_the_store_refuses_is_a_400_with_its_reason(self):
        from ventas import domain, services

        self.gateway.quote_cart = mock.Mock(side_effect=services.GatewayError("product_inactive"))

        response = self.quote(mode="weight", amount="1", unit="kg")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content)["error"], domain.message_for("product_inactive")
        )

    def test_without_the_store_it_is_a_503(self):
        from ventas import domain, services

        self.gateway.quote_cart = mock.Mock(side_effect=services.GatewayUnavailable())

        response = self.quote(mode="weight", amount="1", unit="kg")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(json.loads(response.content)["error"], domain.UNAVAILABLE_MESSAGE)
