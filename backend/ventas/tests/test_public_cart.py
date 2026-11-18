"""Tests of the cart and the order of the public store (/carrito/, ventas:carrito).

A customer adds products from the catalogue or the landing, reviews the quote of the store and
places the order, with plain forms and no JavaScript. The browser never names a price: the quote
comes from the gateway (here the `FakeGateway` of the cases file) and so does the order total.
"""

import re
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from inventory.models import Product
from ventas import services
from ventas.models import PanelOrder
from ventas.tests.support import FakeGateway, make_store, messages_of
from ventas.views.carrito import (
    FALLBACK_CHANNEL,
    LAST_ORDER_KEY,
    PUBLIC_CART_KEY,
    STORE_CHANNEL,
    THROTTLED_MESSAGE,
)

PRICE_KEYS = {"price", "unit_price", "total", "subtotal", "line_total", "total_mxn", "total_usd"}
ORDER = {
    "customer_name": "Ana Pérez",
    "customer_phone": "444 123 4567",
    "delivery_type": "pickup",
    "delivery_address": "",
    "payment_method": "efectivo",
    "notes": "Sin grasa, por favor",
    "currency": "MXN",
}


class StoreTestCase(TestCase):
    """An anonymous customer, the catalogue in the database and the double in place of the RPC."""

    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()

    def setUp(self):
        ids = {key: self.store[key].pk for key in ("bistec", "molida", "camiseta")}
        self.gateway = FakeGateway.from_cases(ids)
        patcher = mock.patch("ventas.services.get_gateway", return_value=self.gateway)
        patcher.start()
        self.addCleanup(patcher.stop)
        # The throttle counts in the cache, which outlives a test: start each one with none.
        cache.clear()
        self.addCleanup(cache.clear)

    def add(self, key="bistec", **fields):
        data = {"mode": "weight", "amount": "1", "unit": "kg"}
        data.update(fields)
        return self.client.post(reverse("ventas:tienda_agregar", args=[self.store[key].pk]), data)

    def cart(self):
        return self.client.session.get(PUBLIC_CART_KEY, [])

    def page(self, name="ventas:carrito", **query):
        return self.client.get(reverse(name), query)


class AddToCartTests(StoreTestCase):
    def test_every_add_goes_through_the_page_of_the_product(self):
        """Engram #541: the whole card opens the configuration; no card adds by itself."""
        for name in ("ventas:catalogo", "ventas:landing"):
            html = self.page(name).content.decode()
            for key in ("bistec", "camiseta"):
                with self.subTest(page=name, product=key):
                    page = reverse("ventas:producto", args=[self.store[key].pk])
                    action = reverse("ventas:tienda_agregar", args=[self.store[key].pk])
                    self.assertIn(f'href="{page}"', html)
                    self.assertNotIn(f'action="{action}"', html)

    def test_the_page_of_a_product_offers_its_modes_and_its_thickness(self):
        bistec = self.client.get(reverse("ventas:producto", args=[self.store["bistec"].pk]))
        html = bistec.content.decode()
        for value in ('value="money"', 'value="weight"', 'value="pieces"', 'value="lb"'):
            self.assertIn(value, html)
        # Only the bistec has a cut spec with a thickness to ask.
        self.assertEqual(html.count('name="thickness_in"'), 1)
        molida = reverse("ventas:producto", args=[self.store["molida"].pk])
        self.assertNotIn('name="thickness_in"', self.client.get(molida).content.decode())

    def test_each_way_of_buying_is_kept_as_the_shared_line_without_a_price(self):
        for key, fields in (
            ("bistec", {"mode": "money", "amount": "100"}),
            ("molida", {"mode": "weight", "amount": "2", "unit": "lb"}),
            ("camiseta", {"mode": "pieces", "amount": "3"}),
        ):
            self.add(key, **fields)
        lines = self.cart()
        self.assertEqual([line["mode"] for line in lines], ["money", "weight", "pieces"])
        self.assertEqual(lines[1]["unit"], "lb")
        for line in lines:
            self.assertFalse(PRICE_KEYS & set(line))

    def test_the_unit_and_thickness_of_another_mode_are_left_out_instead_of_refused(self):
        self.add("bistec", mode="money", amount="100", unit="kg", thickness_in="2")
        self.assertIsNone(self.cart()[0]["unit"])
        self.assertIsNone(self.cart()[0]["thickness_in"])
        self.add("bistec", mode="pieces", amount="4", unit="kg", thickness_in="2")
        self.assertEqual(self.cart()[0]["thickness_in"], "2")
        self.assertIsNone(self.cart()[0]["unit"])

    def test_the_line_is_checked_with_the_store_before_it_is_kept(self):
        self.add("bistec")
        self.assertEqual(self.gateway.quotes[-1][0][0]["product_id"], self.store["bistec"].pk)

    def test_a_tampered_price_is_ignored(self):
        self.add(price="1", unit_price="1", total="1", total_mxn="1", line_total="1")
        self.assertEqual(len(self.cart()), 1)
        self.assertFalse(PRICE_KEYS & set(self.cart()[0]))
        self.assertContains(self.page(), "$200.00")  # 1 kg of bistec at the price of the store

    def test_a_way_the_product_does_not_allow_is_refused_in_spanish(self):
        response = self.add("camiseta", mode="weight", amount="1")
        self.assertRedirects(response, reverse("ventas:catalogo"))
        self.assertEqual(self.cart(), [])
        self.assertIn(("error", "Este producto no se vende de esa forma."), messages_of(response))

    def test_a_bad_amount_is_refused_without_asking_the_store(self):
        self.add(amount="0")
        self.add(amount="abc")
        self.assertEqual(self.cart(), [])
        self.assertEqual(self.gateway.quotes, [])

    def test_an_unavailable_database_does_not_add_the_line(self):
        self.gateway.errors["quote_cart"] = services.GatewayUnavailable()
        response = self.add()
        self.assertEqual(self.cart(), [])
        self.assertTrue(messages_of(response))

    def test_next_returns_to_a_page_of_the_site_and_never_to_another_one(self):
        self.assertRedirects(self.add(next="/"), "/")
        self.assertRedirects(self.add(next="https://evil.example/"), reverse("ventas:catalogo"))

    def test_an_inactive_product_is_a_404(self):
        Product.objects.filter(pk=self.store["molida"].pk).update(is_active=False)
        self.assertEqual(self.add("molida").status_code, 404)

    def test_adding_the_same_product_replaces_its_line(self):
        self.add(amount="1")
        self.add(amount="3")
        self.assertEqual([line["amount"] for line in self.cart()], ["3"])

    def test_the_counter_cart_of_the_panel_is_a_different_cart(self):
        self.add()
        self.assertIsNone(self.client.session.get("ventas_cart"))

    def test_only_a_post_adds(self):
        url = reverse("ventas:tienda_agregar", args=[self.store["bistec"].pk])
        self.assertEqual(self.client.get(url).status_code, 405)


class CartPageTests(StoreTestCase):
    def test_the_note_of_a_line_is_shown_and_survives_an_update(self):
        """Engram #541: the notes travel with the line to the panel; "Actualizar" keeps them."""
        self.add("bistec", note="Sin tanta grasa")

        html = self.page().content.decode()

        self.assertIn("Sin tanta grasa", html)
        self.assertRegex(html, r'<textarea [^>]*name="note"[^>]*>Sin tanta grasa</textarea>')
        self.client.post(
            reverse("ventas:tienda_actualizar", args=[self.store["bistec"].pk]),
            {"mode": "weight", "amount": "2", "unit": "kg", "note": "Sin tanta grasa"},
        )
        self.assertEqual(self.cart()[0]["note"], "Sin tanta grasa")

    def test_an_empty_cart_says_so_and_has_no_order_form(self):
        html = self.page().content.decode()
        self.assertIn("Tu carrito está vacío", html)
        self.assertIn(reverse("ventas:catalogo"), html)
        self.assertNotIn(reverse("ventas:tienda_pedido"), html)

    def test_the_cart_shows_the_quote_of_the_store_in_pesos_and_in_dollars(self):
        self.add("bistec", mode="weight", amount="2", unit="kg")
        self.add("camiseta", mode="pieces", amount="2")
        response = self.page()
        quote = self.gateway.quotes[-1][0]
        self.assertEqual(
            [item["product_id"] for item in quote],
            [self.store["bistec"].pk, self.store["camiseta"].pk],
        )
        self.assertEqual(response.context["quote"].total_mxn, Decimal("900.00"))
        self.assertContains(response, "$900.00")
        self.assertContains(response, "MXN")
        self.assertContains(response, "USD")

    def test_the_quote_is_asked_again_on_every_visit_never_taken_from_the_browser(self):
        self.add()
        before = len(self.gateway.quotes)
        self.page(total="1", price="1")
        self.assertGreater(len(self.gateway.quotes), before)

    def test_usd_is_asked_when_chosen_and_falls_back_to_pesos_without_a_rate(self):
        self.add()
        response = self.page(currency="USD")
        self.assertEqual(response.context["currency"], "USD")
        self.assertEqual(self.gateway.quotes[-1][1], "USD")
        self.gateway.fx["age_days"] = 30
        response = self.page(currency="USD")
        self.assertEqual(response.context["currency"], "MXN")
        self.assertIn("warning", [level for level, _ in messages_of(response)])

    def test_update_changes_the_amount_and_remove_takes_the_line_out(self):
        self.add(amount="1")
        pk = self.store["bistec"].pk
        self.client.post(
            reverse("ventas:tienda_actualizar", args=[pk]),
            {"mode": "weight", "amount": "2.5", "unit": "kg"},
        )
        self.assertEqual(self.cart()[0]["amount"], "2.5")
        response = self.client.post(reverse("ventas:tienda_quitar", args=[pk]))
        self.assertRedirects(response, reverse("ventas:carrito"))
        self.assertEqual(self.cart(), [])

    def test_updating_or_removing_a_line_that_is_not_there_is_a_notice_not_an_error(self):
        pk = self.store["bistec"].pk
        for name in ("tienda_actualizar", "tienda_quitar"):
            response = self.client.post(reverse(f"ventas:{name}", args=[pk]), follow=True)
            self.assertEqual(response.status_code, 200)
            self.assertIn("warning", [level for level, _ in messages_of(response)])

    def test_a_refused_update_keeps_the_previous_line(self):
        self.add(amount="1")
        self.client.post(
            reverse("ventas:tienda_actualizar", args=[self.store["bistec"].pk]),
            {"mode": "weight", "amount": "-4", "unit": "kg"},
        )
        self.assertEqual(self.cart()[0]["amount"], "1")

    def test_a_product_that_is_gone_is_marked_and_blocks_the_order(self):
        self.add()
        Product.objects.filter(pk=self.store["bistec"].pk).update(is_active=False)
        response = self.page()
        self.assertContains(response, "ya no está disponible")
        self.assertTrue(response.context["blocked"])

    def test_the_cart_page_has_no_inline_script_or_style_and_no_external_cdn(self):
        self.add()
        html = self.page().content.decode()
        self.assertIn("tienda/carrito.js", html)
        self.assertNotRegex(html, r"<script(?![^>]*\bsrc=)[^>]*>")
        self.assertNotRegex(html, r'<script[^>]+src="https?://')
        for forbidden in (" style=", " onclick=", "javascript:", "<style"):
            self.assertNotIn(forbidden, html)

    def test_product_names_are_escaped(self):
        Product.objects.filter(pk=self.store["bistec"].pk).update(name="<b>Bistec</b>")
        self.add()
        for name in ("ventas:carrito", "ventas:catalogo", "ventas:landing"):
            html = self.page(name).content.decode()
            self.assertNotIn("<b>Bistec</b>", html)
            self.assertIn("&lt;b&gt;Bistec&lt;/b&gt;", html)

    def test_the_header_shows_how_many_products_the_cart_has(self):
        self.assertRegex(
            self.page("ventas:catalogo").content.decode(), r"data-cart-count[^>]*>\s*0\s*<"
        )
        self.add("bistec")
        self.add("camiseta", mode="pieces", amount="1")
        html = self.page("ventas:catalogo").content.decode()
        self.assertRegex(html, r"data-cart-count[^>]*>\s*2\s*<")
        self.assertIn(f'href="{reverse("ventas:carrito")}"', html)

    def test_the_catalogue_runs_no_inline_script(self):
        html = self.page("ventas:catalogo").content.decode()

        self.assertNotRegex(html, r"<script(?![^>]*\bsrc=\"/static/)[^>]*>")


class CheckoutTests(StoreTestCase):
    url = property(lambda self: reverse("ventas:tienda_pedido"))

    def test_an_empty_cart_cannot_check_out(self):
        response = self.client.post(self.url, ORDER)
        self.assertRedirects(response, reverse("ventas:carrito"))
        self.assertEqual(self.gateway.orders, [])
        self.assertIn("error", [level for level, _ in messages_of(response)])

    def test_the_required_fields_are_validated_in_spanish(self):
        self.add()
        response = self.client.post(
            self.url, {**ORDER, "customer_name": "", "customer_phone": "", "delivery_type": "x"}
        )
        self.assertEqual(response.status_code, 200)
        errors = response.context["order_form"].errors
        self.assertEqual(errors["customer_name"], ["Escribe tu nombre."])
        self.assertEqual(
            errors["customer_phone"], ["Escribe tu teléfono para avisarte de tu pedido."]
        )
        self.assertEqual(errors["delivery_type"], ["Elige si recoges o quieres envío."])
        self.assertContains(response, "Escribe tu nombre.")
        self.assertEqual(self.gateway.orders, [])
        self.assertEqual(len(self.cart()), 1)  # nothing is lost

    def test_a_delivery_needs_the_address_and_a_pickup_does_not(self):
        self.add()
        response = self.client.post(self.url, {**ORDER, "delivery_type": "delivery"})
        self.assertEqual(
            response.context["order_form"].errors["delivery_address"],
            ["Un envío necesita la dirección de entrega."],
        )
        self.assertEqual(self.client.post(self.url, ORDER).status_code, 302)

    def test_the_phone_and_the_payment_method_must_be_valid(self):
        self.add()
        response = self.client.post(
            self.url, {**ORDER, "customer_phone": "hola", "payment_method": "bitcoin"}
        )
        errors = response.context["order_form"].errors
        self.assertIn("customer_phone", errors)
        self.assertEqual(errors["payment_method"], ["Elige una forma de pago de la lista."])

    def test_the_order_is_created_by_the_store_pending_and_the_cart_is_cleared(self):
        self.add("bistec", mode="weight", amount="2", unit="kg")
        response = self.client.post(
            self.url, {**ORDER, "delivery_type": "delivery", "delivery_address": "Calle 1, Centro"}
        )
        self.assertRedirects(response, reverse("ventas:pedido_confirmado"))
        order = self.gateway.orders[0]
        self.assertEqual(order["channel"], STORE_CHANNEL)
        self.assertIn("[Tienda en línea]", order["notes"])
        self.assertIn("Sin grasa", order["notes"])
        self.assertEqual(order["delivery_address"], {"address": "Calle 1, Centro"})
        self.assertEqual(order["customer_phone"], "444 123 4567")
        self.assertEqual(order["items"][0]["product_id"], self.store["bistec"].pk)
        self.assertFalse(PRICE_KEYS & set(order["items"][0]))
        self.assertEqual(PanelOrder.objects.get().status, "pending")
        self.assertEqual(self.cart(), [])

    def test_the_order_is_a_guest_web_order_saved_by_create_order_web(self):
        self.add()
        self.client.post(self.url, ORDER)
        self.assertEqual(STORE_CHANNEL, "web")
        row = PanelOrder.objects.get()
        self.assertEqual(row.channel, "web")
        self.assertIsNone(row.staff_ref)
        self.assertEqual(row.customer_phone, "444 123 4567")

    def test_a_phone_with_three_pending_orders_is_refused_in_spanish_and_keeps_the_cart(self):
        for _ in range(3):
            self.add()
            self.assertEqual(self.client.post(self.url, ORDER).status_code, 302)
        other = Client()
        other.post(
            reverse("ventas:tienda_agregar", args=[self.store["bistec"].pk]),
            {"mode": "weight", "amount": "1", "unit": "kg"},
        )
        refused = other.post(self.url, ORDER)
        self.assertEqual(refused.status_code, 200)
        self.assertContains(refused, "Este teléfono ya tiene 3 pedidos pendientes")
        self.assertEqual(PanelOrder.objects.count(), 3)
        self.assertEqual(len(other.session.get(PUBLIC_CART_KEY, [])), 1)

    def test_a_tampered_channel_status_or_price_is_ignored(self):
        self.add()
        self.client.post(
            self.url,
            {**ORDER, "channel": "mostrador", "status": "delivered", "total": "1", "price": "1"},
        )
        self.assertEqual(self.gateway.orders[0]["channel"], STORE_CHANNEL)
        self.assertEqual(PanelOrder.objects.get().channel, "web")
        row = PanelOrder.objects.get()
        self.assertEqual(row.status, "pending")
        self.assertEqual(row.total_mxn, Decimal("200.00"))

    def test_the_confirmation_shows_the_short_id_and_the_total_of_the_database(self):
        self.add("bistec", mode="weight", amount="2", unit="kg")
        response = self.client.post(self.url, ORDER, follow=True)
        row = PanelOrder.objects.get()
        self.assertContains(response, str(row.pk)[:8])
        self.assertContains(response, "$400.00")
        self.assertNotContains(response, str(row.pk))
        self.assertEqual(self.client.session.get(LAST_ORDER_KEY), str(row.pk))

    def test_the_confirmation_is_only_for_the_session_that_ordered(self):
        self.add()
        self.client.post(self.url, ORDER)
        response = Client().get(reverse("ventas:pedido_confirmado"))
        self.assertRedirects(response, reverse("ventas:catalogo"))

    def test_a_refusal_of_the_store_keeps_the_cart_and_says_why(self):
        self.add()
        self.gateway.errors["create_order_web"] = services.GatewayError("below_minimum_order")
        response = self.client.post(
            self.url, {**ORDER, "delivery_type": "delivery", "delivery_address": "Calle 1"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "no llega al mínimo")
        self.assertEqual(len(self.cart()), 1)

    def test_an_unavailable_database_keeps_the_cart(self):
        self.add()
        self.gateway.errors["create_order_web"] = services.GatewayUnavailable()
        response = self.client.post(self.url, ORDER)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.cart()), 1)

    def test_only_a_post_places_an_order(self):
        self.assertEqual(self.client.get(self.url).status_code, 405)

    def test_csrf_is_enforced_on_every_form(self):
        strict = Client(enforce_csrf_checks=True)
        pk = self.store["bistec"].pk
        for url in (
            reverse("ventas:tienda_agregar", args=[pk]),
            reverse("ventas:tienda_actualizar", args=[pk]),
            reverse("ventas:tienda_quitar", args=[pk]),
            self.url,
        ):
            with self.subTest(url=url):
                self.assertEqual(strict.post(url, ORDER).status_code, 403)

    def test_the_cart_page_forms_carry_the_csrf_token(self):
        self.add()
        html = self.page().content.decode()
        self.assertGreaterEqual(len(re.findall(r'name="csrfmiddlewaretoken"', html)), 3)


class MissingFunctionFallbackTests(StoreTestCase):
    """Until the migration of `create_order_web` is applied the store keeps selling."""

    def missing(self, function="public.create_order_web"):
        self.gateway.errors["create_order_web"] = services.GatewayFunctionMissing(function)

    def test_without_the_function_the_order_is_saved_as_whatsapp_and_a_warning_is_logged(self):
        self.missing()
        self.add()
        with self.assertLogs("ventas.checkout", level="WARNING") as logged:
            response = self.client.post(reverse("ventas:tienda_pedido"), ORDER)
        self.assertRedirects(response, reverse("ventas:pedido_confirmado"))
        self.assertIn("20261117000002_create_order_web.sql", logged.output[0])
        self.assertEqual(self.gateway.orders[0]["channel"], FALLBACK_CHANNEL)
        self.assertEqual(PanelOrder.objects.get().channel, "whatsapp")
        self.assertEqual(self.cart(), [])

    def test_a_different_missing_function_is_not_the_fallback(self):
        self.missing("public.quote_cart")
        self.add()
        response = self.client.post(reverse("ventas:tienda_pedido"), ORDER)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(PanelOrder.objects.count(), 0)
        self.assertEqual(len(self.cart()), 1)

    def test_the_fallback_still_reports_what_the_store_refuses(self):
        self.missing()
        self.gateway.errors["create_order_staff"] = services.GatewayError("below_minimum_order")
        self.add()
        with self.assertLogs("ventas.checkout", level="WARNING"):
            response = self.client.post(
                reverse("ventas:tienda_pedido"),
                {**ORDER, "delivery_type": "delivery", "delivery_address": "Calle 1"},
            )
        self.assertContains(response, "no llega al mínimo")
        self.assertEqual(len(self.cart()), 1)


@override_settings(CHECKOUT_THROTTLE_LIMIT=2, CHECKOUT_THROTTLE_WINDOW_SECONDS=3600)
class CheckoutThrottleTests(StoreTestCase):
    url = "/carrito/pedido/"

    def order_from(self, client, **extra):
        pk = self.store["bistec"].pk
        client.post(
            reverse("ventas:tienda_agregar", args=[pk]),
            {"mode": "weight", "amount": "1", "unit": "kg"},
            **extra,
        )
        return client.post(self.url, {**ORDER, "customer_phone": "555 000 0000"}, **extra)

    def test_the_attempt_after_the_limit_is_refused_in_spanish_and_creates_no_order(self):
        client = Client()
        # Different phones keep the rule of pending orders out of the way.
        for number in ("5550000001", "5550000002"):
            client.post(
                reverse("ventas:tienda_agregar", args=[self.store["bistec"].pk]),
                {"mode": "weight", "amount": "1", "unit": "kg"},
            )
            self.assertEqual(
                client.post(self.url, {**ORDER, "customer_phone": number}).status_code, 302
            )
        client.post(
            reverse("ventas:tienda_agregar", args=[self.store["bistec"].pk]),
            {"mode": "weight", "amount": "1", "unit": "kg"},
        )
        response = client.post(self.url, {**ORDER, "customer_phone": "5550000003"})
        self.assertEqual(response.status_code, 429)
        self.assertContains(response, THROTTLED_MESSAGE, status_code=429)
        self.assertEqual(PanelOrder.objects.count(), 2)
        self.assertEqual(len(client.session.get(PUBLIC_CART_KEY, [])), 1)

    def test_the_limit_is_per_client_ip_even_with_a_new_session(self):
        for _ in range(2):
            self.assertEqual(self.order_from(Client(), REMOTE_ADDR="10.0.0.9").status_code, 302)
        # The third attempt from the address, in a brand-new session, is refused.
        response = self.order_from(Client(), REMOTE_ADDR="10.0.0.9")
        self.assertEqual(response.status_code, 429)

    def test_another_ip_and_another_session_are_not_affected(self):
        for _ in range(2):
            self.order_from(Client(), REMOTE_ADDR="10.0.0.9")
        response = self.order_from(Client(), REMOTE_ADDR="10.0.0.10")
        self.assertNotEqual(response.status_code, 429)

    def test_the_limit_is_per_session_even_from_another_ip(self):
        client = Client()
        for _ in range(2):
            self.order_from(client, REMOTE_ADDR="10.0.1.1")
        response = self.order_from(client, REMOTE_ADDR="10.0.1.2")
        self.assertEqual(response.status_code, 429)

    def test_a_form_with_errors_does_not_use_up_an_attempt(self):
        client = Client()
        client.post(
            reverse("ventas:tienda_agregar", args=[self.store["bistec"].pk]),
            {"mode": "weight", "amount": "1", "unit": "kg"},
        )
        for _ in range(5):
            self.assertEqual(client.post(self.url, {**ORDER, "customer_name": ""}).status_code, 200)
        self.assertEqual(client.post(self.url, ORDER).status_code, 302)

    @override_settings(CHECKOUT_TRUST_FORWARDED_FOR=True)
    def test_behind_a_proxy_the_client_is_the_last_forwarded_address(self):
        # A client that writes its own X-Forwarded-For cannot dodge the limit: only the entry
        # the proxy appended counts.
        for index in range(2):
            self.order_from(
                Client(), REMOTE_ADDR="10.9.9.9", HTTP_X_FORWARDED_FOR=f"6.6.6.{index}, 203.0.113.5"
            )
        response = self.order_from(
            Client(), REMOTE_ADDR="10.9.9.9", HTTP_X_FORWARDED_FOR="7.7.7.7, 203.0.113.5"
        )
        self.assertEqual(response.status_code, 429)

    def test_the_gateway_is_never_called_for_a_refused_attempt(self):
        for _ in range(2):
            self.order_from(Client(), REMOTE_ADDR="10.0.2.2")
        before = len(self.gateway.orders)
        self.order_from(Client(), REMOTE_ADDR="10.0.2.2")
        self.assertEqual(len(self.gateway.orders), before)
