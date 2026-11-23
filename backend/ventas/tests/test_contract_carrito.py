"""Contract tests of the cart writes of the public store (T4a, S2, S6): the JSON mode.

A form of the page keeps its redirect and its message; a script that sends `Accept:
application/json` gets the answer as JSON (docs/datos/contrato-productos.md, section 5). Both
modes share the validation, the CSRF rule, the quote of the store before a line is kept, and the
limit of writes per client. The cart holds what was asked and never a price.
"""

from unittest import mock

from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse

from inventory.models import Product
from ventas import domain, services
from ventas.tests.support import FakeGateway, make_store, messages_of
from ventas.views.carrito import CART_WRITES_PER_MINUTE, PUBLIC_CART_KEY

AS_JSON = {"Accept": "application/json"}
# What a form of the browser sends: HTML first, anything else after.
AS_FORM = {"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"}
PRICE_WORDS = ("price", "precio", "total", "subtotal", "importe")


class CartContractCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()

    def setUp(self):
        ids = {key: self.store[key].pk for key in ("bistec", "molida", "camiseta")}
        self.gateway = FakeGateway.from_cases(ids)
        patcher = mock.patch("ventas.services.get_gateway", return_value=self.gateway)
        patcher.start()
        self.addCleanup(patcher.stop)
        # The limits count in the cache, which outlives a test: start each one with none.
        cache.clear()
        self.addCleanup(cache.clear)

    def url(self, name, key="bistec"):
        return reverse(f"ventas:{name}", args=[self.store[key].pk])

    def write(self, name, key="bistec", data=None, headers=AS_JSON, **extra):
        return self.client.post(self.url(name, key), data or {}, headers=headers, **extra)

    def add(self, key="bistec", **fields):
        data = {"mode": "weight", "amount": "1", "unit": "kg"}
        data.update(fields)
        return self.write("tienda_agregar", key, data)

    def cart(self):
        return self.client.session.get(PUBLIC_CART_KEY, [])


class AddAsJsonTests(CartContractCase):
    def test_it_answers_json_with_the_cart_and_no_redirect(self):
        response = self.add()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        body = response.json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["mensaje"], "Bistec se agregó a tu carrito.")
        self.assertEqual(body["carrito"]["total_lineas"], 1)
        self.assertEqual(
            body["carrito"]["lineas"],
            [
                {
                    "producto_id": self.store["bistec"].pk,
                    "nombre": "Bistec",
                    "url": self.url("producto"),
                    "imagen": self.store["bistec"].image_src,
                    "cantidad": "1 kg",
                    "nota": None,
                }
            ],
        )
        self.assertEqual([line["product_id"] for line in self.cart()], [self.store["bistec"].pk])

    def test_the_amount_is_worded_the_way_the_customer_asked_for_it(self):
        asked = (
            ({"mode": "weight", "amount": "0.5", "unit": "kg"}, "0.5 kg"),
            ({"mode": "money", "amount": "150"}, "$150"),
            ({"mode": "pieces", "amount": "4", "thickness_in": "1.25"}, "4 piezas · 1.25 in"),
        )
        for fields, words in asked:
            with self.subTest(words=words):
                lines = self.add(**fields).json()["carrito"]["lineas"]
                self.assertEqual(lines[0]["cantidad"], words)

    def test_the_answer_has_no_price_and_a_tampered_price_is_ignored(self):
        body = self.add(price="1", unit_price="1", total="1", total_mxn="1").json()

        for line in body["carrito"]["lineas"]:
            self.assertFalse([key for key in line if any(word in key for word in PRICE_WORDS)])
        self.assertFalse([key for key in self.cart()[0] if any(w in key for w in PRICE_WORDS)])

    def test_the_drawer_and_the_answer_list_the_same_lines(self):
        self.add(note="Con más grasa", mode="weight", amount="2", unit="lb")
        body = self.add("molida", mode="money", amount="100").json()

        drawer = self.client.get(reverse("ventas:catalogo")).context["bolsa"]

        self.assertEqual(
            [(line["product"].name, line["amount"], line["note"]) for line in drawer],
            [
                (line["nombre"], line["cantidad"], line["nota"])
                for line in body["carrito"]["lineas"]
            ],
        )

    def test_a_bad_line_is_a_400_in_words_and_the_store_is_not_asked(self):
        response = self.add(mode="pieces", amount="1.5")

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertFalse(body["ok"])
        self.assertEqual(
            body["error"],
            "No se agregó la línea: Las piezas van en números enteros.",
        )
        self.assertNotIn("carrito", body)
        self.assertEqual((self.cart(), self.gateway.quotes), ([], []))

    def test_a_way_the_product_does_not_allow_is_a_400_with_the_sentence_of_the_store(self):
        response = self.add("camiseta", mode="weight", amount="1")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], domain.ERROR_MESSAGES["sale_mode_not_allowed"])
        self.assertEqual(self.cart(), [])

    def test_an_unavailable_database_is_a_503_and_keeps_the_cart_as_it_was(self):
        self.gateway.errors["quote_cart"] = services.GatewayUnavailable()

        response = self.add()

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"ok": False, "error": domain.UNAVAILABLE_MESSAGE})
        self.assertEqual(self.cart(), [])

    def test_an_inactive_product_is_a_json_404(self):
        Product.objects.filter(pk=self.store["molida"].pk).update(is_active=False)

        response = self.add("molida")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(
            response.json(), {"ok": False, "error": domain.ERROR_MESSAGES["product_not_found"]}
        )

    def test_a_full_cart_is_a_409_but_a_line_already_in_it_can_still_change(self):
        with mock.patch("ventas.cart.MAX_LINES", 1):
            self.add("bistec")
            full = self.add("molida", mode="money", amount="100")
            again = self.add("bistec", amount="2")

        self.assertEqual(full.status_code, 409)
        self.assertEqual(full.json()["error"], domain.ERROR_MESSAGES["too_many_lines"])
        self.assertEqual(again.status_code, 200)
        self.assertEqual([line["amount"] for line in self.cart()], ["2"])

    def test_the_csrf_token_is_required_in_json_mode_too(self):
        strict = Client(enforce_csrf_checks=True)

        response = strict.post(
            self.url("tienda_agregar"),
            {"mode": "weight", "amount": "1", "unit": "kg"},
            headers=AS_JSON,
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.session.get(PUBLIC_CART_KEY), None)

    def test_only_a_post_writes(self):
        for name in ("tienda_agregar", "tienda_actualizar", "tienda_quitar"):
            with self.subTest(name=name):
                self.assertEqual(self.client.get(self.url(name), headers=AS_JSON).status_code, 405)

    def test_a_form_of_the_browser_keeps_the_redirect_and_the_message(self):
        response = self.write(
            "tienda_agregar",
            data={"mode": "weight", "amount": "1", "unit": "kg", "next": "/carrito/"},
            headers=AS_FORM,
        )

        self.assertRedirects(response, "/carrito/", fetch_redirect_response=False)
        self.assertIn(("success", "Bistec se agregó a tu carrito."), messages_of(response))


class UpdateAndRemoveAsJsonTests(CartContractCase):
    def test_an_update_changes_the_line_and_answers_with_the_cart(self):
        self.add()

        response = self.write(
            "tienda_actualizar", data={"mode": "weight", "amount": "3", "unit": "kg"}
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["mensaje"], "Se actualizó Bistec.")
        self.assertEqual(body["carrito"]["lineas"][0]["cantidad"], "3 kg")
        self.assertEqual([line["amount"] for line in self.cart()], ["3"])

    def test_an_update_of_a_line_that_is_not_in_the_cart_is_a_404(self):
        response = self.write("tienda_actualizar", data={"mode": "weight", "amount": "3"})

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json(), {"ok": False, "error": "Ese producto ya no estaba en tu carrito."}
        )
        self.assertEqual(self.cart(), [])

    def test_an_update_the_store_refuses_keeps_the_old_line(self):
        self.add()
        self.gateway.errors["quote_cart"] = services.GatewayError("invalid_amount")

        response = self.write(
            "tienda_actualizar", data={"mode": "weight", "amount": "3", "unit": "kg"}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], domain.ERROR_MESSAGES["invalid_amount"])
        self.assertEqual([line["amount"] for line in self.cart()], ["1"])

    def test_removing_a_line_answers_with_the_cart_that_is_left(self):
        self.add()
        self.add("molida", mode="money", amount="100")

        response = self.write("tienda_quitar")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["mensaje"], "Se quitó el producto de tu carrito.")
        self.assertEqual(body["carrito"]["total_lineas"], 1)
        self.assertEqual(body["carrito"]["lineas"][0]["nombre"], "Molida")
        self.assertEqual([line["product_id"] for line in self.cart()], [self.store["molida"].pk])

    def test_removing_a_line_that_is_not_in_the_cart_is_a_404(self):
        response = self.write("tienda_quitar")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json(), {"ok": False, "error": "Ese producto ya no estaba en tu carrito."}
        )

    def test_a_form_of_the_browser_keeps_the_redirect_to_the_cart(self):
        self.add()

        response = self.write("tienda_quitar", headers=AS_FORM)

        self.assertRedirects(response, reverse("ventas:carrito"), fetch_redirect_response=False)
        self.assertIn(("success", "Se quitó el producto de tu carrito."), messages_of(response))


class NextAfterWriteTests(CartContractCase):
    """The drawer of any page removes or changes a line without leaving the page (T4b)."""

    LINE = {"mode": "weight", "amount": "3", "unit": "kg"}

    def post(self, name, **fields):
        return self.client.post(self.url(name), {**self.LINE, **fields})

    def test_remove_and_update_go_back_to_the_page_named_in_next(self):
        for name in ("tienda_quitar", "tienda_actualizar"):
            with self.subTest(name=name):
                self.add()
                response = self.post(name, next="/productos/")
                self.assertRedirects(response, "/productos/", fetch_redirect_response=False)

    def test_without_next_they_still_go_to_the_cart(self):
        for name in ("tienda_quitar", "tienda_actualizar"):
            with self.subTest(name=name):
                self.add()
                response = self.post(name)
                self.assertRedirects(
                    response, reverse("ventas:carrito"), fetch_redirect_response=False
                )

    def test_a_next_of_another_site_is_never_followed(self):
        for name in ("tienda_quitar", "tienda_actualizar"):
            with self.subTest(name=name):
                self.add()
                response = self.post(name, next="https://evil.example/")
                self.assertRedirects(
                    response, reverse("ventas:carrito"), fetch_redirect_response=False
                )

    def test_a_line_that_is_not_there_also_goes_back_to_the_page_named_in_next(self):
        for name in ("tienda_quitar", "tienda_actualizar"):
            with self.subTest(name=name):
                response = self.post(name, next="/productos/")
                self.assertRedirects(response, "/productos/", fetch_redirect_response=False)
                self.assertIn(
                    ("warning", "Ese producto ya no estaba en tu carrito."), messages_of(response)
                )

    def test_json_mode_ignores_next(self):
        self.add()

        response = self.write("tienda_quitar", data={"next": "/productos/"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")


class WriteLimitTests(CartContractCase):
    def spend_the_limit(self):
        """Use up the writes of this client with `quitar`, which never asks the store."""
        for _ in range(CART_WRITES_PER_MINUTE):
            self.write("tienda_quitar")

    def test_a_client_that_writes_too_often_gets_a_429_before_any_quote(self):
        self.spend_the_limit()

        response = self.add()

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json(), {"ok": False, "error": domain.TOO_MANY_REQUESTS_MESSAGE})
        self.assertEqual((self.cart(), self.gateway.quotes), ([], []))

    def test_the_limit_is_shared_by_the_three_writes(self):
        self.spend_the_limit()

        for name in ("tienda_agregar", "tienda_actualizar", "tienda_quitar"):
            with self.subTest(name=name):
                self.assertEqual(self.write(name).status_code, 429)

    def test_a_form_over_the_limit_gets_the_message_and_the_redirect(self):
        self.spend_the_limit()

        response = self.write(
            "tienda_agregar",
            data={"mode": "weight", "amount": "1", "unit": "kg"},
            headers=AS_FORM,
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn(("error", domain.TOO_MANY_REQUESTS_MESSAGE), messages_of(response))
        self.assertEqual((self.cart(), self.gateway.quotes), ([], []))

    def test_another_client_is_not_held_back(self):
        self.spend_the_limit()

        response = self.write(
            "tienda_agregar",
            data={"mode": "weight", "amount": "1", "unit": "kg"},
            REMOTE_ADDR="198.51.100.7",
        )

        self.assertEqual(response.status_code, 200)

    def test_a_405_does_not_spend_the_limit(self):
        for _ in range(CART_WRITES_PER_MINUTE + 5):
            self.client.get(self.url("tienda_agregar"))

        self.assertEqual(self.add().status_code, 200)
