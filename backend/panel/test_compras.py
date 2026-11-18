"""Tests of Compras y stock (/panel/compras/): register a purchase, count the stock, see the lots.

The Postgres functions decide the stock, the yield and the cost (`register_purchase`,
`adjust_stock`); the page only sends what the owner typed and shows what they answer. The
shared double records the calls and returns the lots the view `panel_purchase_performance`
would.
"""

from datetime import datetime
from decimal import Decimal
from unittest import mock

from django.contrib.messages import get_messages
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from inventory.models import ProductCost
from panel.access import PANEL_SESSION_KEY
from panel.tests import sign_in_as_panel_admin
from ventas.domain import UNAVAILABLE_MESSAGE, message_for
from ventas.services import GatewayError, GatewayUnavailable
from ventas.tests.support import FakeGateway, make_store

FORBIDDEN_IN_HTML = ("<script", "<style", " style=", " onclick=", " onchange=", "javascript:")


def lot(name, **overrides):
    row = {
        "lot_id": 1,
        "product_name": name,
        "created_at": timezone.make_aware(datetime(2026, 11, 18, 9, 30)),
        "qty": Decimal("10.000"),
        "total_cost": Decimal("1500.00"),
        "unit_cost": Decimal("150.0000"),
        "expected_revenue": Decimal("2000.00"),
        "expected_margin": Decimal("500.00"),
        "expected_margin_pct": Decimal("25.0"),
        "sold_qty": Decimal("2.500"),
        "sold_revenue": Decimal("500.00"),
    }
    row.update(overrides)
    return row


class PurchasesTestCase(TestCase):
    def setUp(self):
        self.store = make_store()
        self.user_id = sign_in_as_panel_admin(self.client)
        self.gateway = FakeGateway({})
        patcher = mock.patch("ventas.services.get_gateway", return_value=self.gateway)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.url = reverse("panel:compras")

    def messages_of(self, response):
        return [str(m) for m in get_messages(response.wsgi_request)]


class PageTests(PurchasesTestCase):
    def test_it_shows_both_forms_and_the_lots_without_inline_code(self):
        self.gateway.lots = [lot("Bistec")]

        response = self.client.get(self.url)
        html = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "panel/compras.html")
        self.assertContains(response, "Registrar compra")
        self.assertContains(response, "Conteo de stock")
        self.assertContains(response, "Bistec")
        self.assertContains(response, "$1,500.00")
        self.assertContains(response, "25.0 %")
        for forbidden in FORBIDDEN_IN_HTML:
            self.assertNotIn(forbidden, html)

    def test_the_product_list_offers_every_product_by_name(self):
        html = self.client.get(self.url).content.decode()

        for key in ("bistec", "molida", "camiseta"):
            product = self.store[key]
            self.assertIn(f'<option value="{product.pk}">{product.name}</option>', html)

    def test_a_product_name_in_a_lot_is_drawn_as_text(self):
        self.gateway.lots = [lot("<b onmouseover=x>")]

        html = self.client.get(self.url).content.decode()

        self.assertIn("&lt;b onmouseover=x&gt;", html)
        self.assertNotIn("<b onmouseover=x>", html)

    def test_without_lots_it_says_so(self):
        self.assertContains(self.client.get(self.url), "Todavía no hay compras registradas.")

    def test_when_the_lots_cannot_be_read_the_forms_still_work(self):
        self.gateway.errors["recent_purchases"] = GatewayUnavailable()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Registrar compra")
        self.assertIn(UNAVAILABLE_MESSAGE, self.messages_of(response))

    def test_the_sidebar_links_it_and_marks_it_current(self):
        html = self.client.get(self.url).content.decode()

        self.assertIn('href="/panel/compras/" aria-current="page"', html)

    def test_an_anonymous_visitor_is_sent_to_the_access_bridge(self):
        self.client.logout()

        response = self.client.get(self.url)

        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)
        self.assertEqual(self.gateway.purchases, [])


class PurchaseTests(PurchasesTestCase):
    def post(self, **data):
        payload = {"action": "purchase", "product": self.store["bistec"].pk}
        payload.update(data)
        return self.client.post(self.url, payload)

    def test_a_valid_purchase_is_sent_to_the_store_and_redirects(self):
        response = self.post(qty="10", total_cost="1500", note="Proveedor del rastro")

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        self.assertEqual(
            self.gateway.purchases,
            [
                (
                    self.store["bistec"].pk,
                    Decimal("10"),
                    Decimal("1500"),
                    "Proveedor del rastro",
                    self.client.session[PANEL_SESSION_KEY],
                )
            ],
        )
        self.assertEqual(self.messages_of(response), ["Compra registrada: Bistec."])

    def test_an_empty_note_is_sent_as_none(self):
        self.post(qty="2.5", total_cost="300")

        self.assertIsNone(self.gateway.purchases[0][3])

    def test_a_quantity_of_zero_or_a_missing_cost_is_refused_before_the_store(self):
        for data in ({"qty": "0", "total_cost": "100"}, {"qty": "3", "total_cost": ""}):
            with self.subTest(data=data):
                response = self.post(**data)

                self.assertEqual(response.status_code, 200)
                self.assertEqual(self.gateway.purchases, [])

        response = self.post(qty="0", total_cost="100")
        self.assertContains(response, "La cantidad debe ser mayor que cero.")

    def test_a_negative_cost_is_refused(self):
        response = self.post(qty="3", total_cost="-1")

        self.assertContains(response, "El costo no puede ser negativo.")
        self.assertEqual(self.gateway.purchases, [])

    def test_an_unknown_product_is_refused(self):
        response = self.post(product="999999", qty="3", total_cost="10")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.gateway.purchases, [])

    def test_a_refusal_of_the_store_is_shown_and_nothing_redirects(self):
        self.gateway.errors["register_purchase"] = GatewayError("invalid_amount")

        response = self.post(qty="3", total_cost="10")

        self.assertEqual(response.status_code, 200)
        self.assertIn(message_for("invalid_amount"), self.messages_of(response))

    def test_an_unavailable_store_is_shown(self):
        self.gateway.errors["register_purchase"] = GatewayUnavailable()

        response = self.post(qty="3", total_cost="10")

        self.assertEqual(response.status_code, 200)
        self.assertIn(UNAVAILABLE_MESSAGE, self.messages_of(response))


class CountTests(PurchasesTestCase):
    def post(self, **data):
        payload = {"action": "count", "product": self.store["molida"].pk}
        payload.update(data)
        return self.client.post(self.url, payload)

    def test_a_valid_count_is_sent_to_the_store_and_redirects(self):
        response = self.post(new_stock="7.5", reason="Conteo del sábado")

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        self.assertEqual(
            self.gateway.counts,
            [
                (
                    self.store["molida"].pk,
                    Decimal("7.5"),
                    "Conteo del sábado",
                    self.client.session[PANEL_SESSION_KEY],
                )
            ],
        )
        self.assertEqual(self.messages_of(response), ["Stock actualizado: Molida."])

    def test_the_reason_is_required(self):
        response = self.post(new_stock="7.5", reason="   ")

        self.assertContains(response, "Escribe por qué cambia el stock.")
        self.assertEqual(self.gateway.counts, [])

    def test_a_negative_stock_is_refused(self):
        response = self.post(new_stock="-1", reason="Merma")

        self.assertContains(response, "El stock no puede ser negativo.")
        self.assertEqual(self.gateway.counts, [])

    def test_a_refusal_of_the_store_is_shown(self):
        self.gateway.errors["adjust_stock"] = GatewayError("reason_required")

        response = self.post(new_stock="1", reason="x")

        self.assertIn(message_for("reason_required"), self.messages_of(response))

    def test_an_unknown_action_changes_nothing(self):
        response = self.client.post(self.url, {"action": "borrar", "product": 1})

        self.assertEqual(response.status_code, 400)
        self.assertEqual((self.gateway.purchases, self.gateway.counts), ([], []))


class YieldTests(PurchasesTestCase):
    """The yield of the cut: what is left to sell from each kilo bought (`product_costs.yield_pct`).

    `register_purchase` reads it to grow the stock by the sellable kilos, and the cost of a sale
    divides the cost per kilo bought by it: 10 kg for $1,500 at 80 % is 8 kg at $187.50 a kilo.
    """

    def post(self, **data):
        payload = {"action": "purchase", "product": self.store["bistec"].pk, "qty": "10"}
        payload.update({"total_cost": "1500", **data})
        return self.client.post(self.url, payload)

    def test_a_yield_is_saved_before_the_purchase_is_sent(self):
        response = self.post(yield_pct="80")

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        cost = ProductCost.objects.get(product=self.store["bistec"])
        self.assertEqual(cost.yield_pct, Decimal("80"))
        self.assertEqual(cost.updated_by, self.client.session[PANEL_SESSION_KEY])
        self.assertEqual(len(self.gateway.purchases), 1)
        self.assertEqual(
            self.messages_of(response), ["Compra registrada: Bistec (rendimiento 80 %)."]
        )

    def test_a_new_yield_keeps_the_cost_already_known(self):
        ProductCost.objects.create(
            product=self.store["bistec"], cost_per_kg=Decimal("150"), yield_pct=Decimal("100")
        )

        self.post(yield_pct="75.5")

        cost = ProductCost.objects.get(product=self.store["bistec"])
        self.assertEqual((cost.cost_per_kg, cost.yield_pct), (Decimal("150"), Decimal("75.5")))

    def test_without_a_yield_the_known_one_stays(self):
        ProductCost.objects.create(product=self.store["bistec"], yield_pct=Decimal("80"))

        self.post(yield_pct="")

        self.assertEqual(ProductCost.objects.get().yield_pct, Decimal("80"))
        self.assertEqual(len(self.gateway.purchases), 1)

    def test_a_yield_out_of_range_is_refused(self):
        for value in ("0", "100.01", "-5"):
            with self.subTest(value=value):
                response = self.post(yield_pct=value)

                self.assertContains(response, "El rendimiento va de más de 0 a 100 %.")
        self.assertFalse(ProductCost.objects.exists())
        self.assertEqual(self.gateway.purchases, [])

    def test_a_piece_product_takes_no_yield(self):
        response = self.post(product=self.store["camiseta"].pk, qty="12", yield_pct="80")

        self.assertContains(response, "El rendimiento solo aplica a productos por kilo.")
        self.assertFalse(ProductCost.objects.exists())
        self.assertEqual(self.gateway.purchases, [])

    def test_when_the_store_refuses_the_yield_is_not_kept(self):
        self.gateway.errors["register_purchase"] = GatewayError("invalid_amount")

        response = self.post(yield_pct="80")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(ProductCost.objects.exists())
