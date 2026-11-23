"""Contract tests of the catalogue and the live quote of the store (T4a, S2, S6).

They pin the shapes that the products page consumes (docs/datos/contrato-productos.md): the
inputs of the catalogue, and the JSON of the live quote. Every number comes from the double of the
store (`FakeGateway`, the cases file the SQL tests read); the browser never names a price.
"""

from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse

from inventory.models import Product
from ventas import domain, services
from ventas.tests.support import FakeGateway, ceil_cents, make_store


class ContractCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()

    def setUp(self):
        self.ids = {key: self.store[key].pk for key in ("bistec", "molida", "camiseta")}
        self.use(FakeGateway.from_cases(self.ids))
        # The limits count in the cache, which outlives a test: start each one with none.
        cache.clear()
        self.addCleanup(cache.clear)

    def use(self, gateway):
        self.gateway = gateway
        patcher = mock.patch("ventas.services.get_gateway", return_value=gateway)
        patcher.start()
        self.addCleanup(patcher.stop)


class CatalogueInputTests(ContractCase):
    def test_a_long_search_is_cut_to_80_characters(self):
        response = self.client.get(reverse("ventas:catalogo"), {"q": "a" * 500})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["query"], "a" * 80)

    def test_a_category_id_too_large_for_the_database_is_ignored(self):
        response = self.client.get(reverse("ventas:catalogo"), {"category": "9" * 30})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["selected_category"], "")
        self.assertEqual(response.context["page_obj"].paginator.count, 3)

    def test_a_category_id_is_read_as_a_number_whatever_its_digits(self):
        meat = self.store["meat"].pk

        response = self.client.get(reverse("ventas:catalogo"), {"category": f"00{meat}"})

        self.assertEqual(response.context["selected_category"], str(meat))
        self.assertEqual(response.context["page_obj"].paginator.count, 2)  # bistec and molida

    def test_the_context_keys_of_the_contract(self):
        response = self.client.get(reverse("ventas:catalogo"))

        for key in ("page_obj", "categories", "query", "selected_category"):
            self.assertIn(key, response.context)


class QuoteContractTests(ContractCase):
    def quote(self, key="bistec", **params):
        return self.client.get(
            reverse("ventas:producto_cotizar", args=[self.store[key].pk]), params
        )

    def test_the_answer_says_its_currency_and_the_total_in_dollars(self):
        data = self.quote(mode="weight", amount="0.5", unit="kg").json()

        expected = ceil_cents(Decimal("100.00") / self.gateway.house_rate())
        self.assertEqual(data["moneda"], "MXN")
        self.assertEqual(data["total_usd"], f"{expected:.2f}")
        # The keys the first version had are still there, with the same meaning.
        self.assertEqual(
            (data["total"], data["descuento"], data["kg"], data["piezas"]),
            ("100.00", "0.00", "0.500", None),
        )

    def test_a_quote_in_dollars_reads_a_money_amount_as_dollars(self):
        data = self.quote(mode="money", amount="10", currency="USD").json()

        self.assertEqual(self.gateway.quotes[-1][1], "USD")
        self.assertEqual(data["moneda"], "USD")
        self.assertEqual(data["total_usd"], "10.00")

    def test_another_currency_is_asked_in_pesos(self):
        data = self.quote(mode="weight", amount="1", unit="kg", currency="EUR").json()

        self.assertEqual(self.gateway.quotes[-1][1], "MXN")
        self.assertEqual(data["moneda"], "MXN")

    def test_without_a_valid_rate_the_dollars_are_null_and_a_dollar_quote_is_refused(self):
        self.use(FakeGateway.from_cases(self.ids, fx_age_days=10))

        pesos = self.quote(mode="weight", amount="1", unit="kg")
        dollars = self.quote(mode="weight", amount="1", unit="kg", currency="USD")

        self.assertEqual(pesos.status_code, 200)
        self.assertIsNone(pesos.json()["total_usd"])
        self.assertEqual(dollars.status_code, 400)
        self.assertEqual(dollars.json()["error"], domain.ERROR_MESSAGES["fx_unavailable"])

    def test_the_warnings_of_the_store_come_as_spanish_sentences(self):
        self.assertEqual(self.quote(mode="weight", amount="1", unit="kg").json()["avisos"], [])
        self.gateway.warnings = ["low_stock", "mixed_lots"]

        data = self.quote(mode="weight", amount="1", unit="kg").json()

        self.assertEqual(
            data["avisos"],
            [domain.WARNING_MESSAGES["low_stock"], domain.WARNING_MESSAGES["mixed_lots"]],
        )

    def test_an_unknown_product_is_a_json_404(self):
        response = self.client.get(
            reverse("ventas:producto_cotizar", args=[999999]), {"mode": "weight", "amount": "1"}
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(response.json(), {"error": domain.ERROR_MESSAGES["product_not_found"]})
        self.assertEqual(self.gateway.quotes, [])

    def test_an_inactive_product_is_a_json_404(self):
        Product.objects.filter(pk=self.store["molida"].pk).update(is_active=False)

        response = self.quote("molida", mode="weight", amount="1", unit="kg")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["error"], domain.ERROR_MESSAGES["product_not_found"])

    def test_the_store_refusing_a_line_is_still_a_400_with_its_sentence(self):
        self.gateway.errors["quote_cart"] = services.GatewayError("sale_mode_not_allowed")

        response = self.quote("camiseta", mode="weight", amount="1", unit="kg")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], domain.ERROR_MESSAGES["sale_mode_not_allowed"])
