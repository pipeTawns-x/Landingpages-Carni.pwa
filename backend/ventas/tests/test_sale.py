"""Tests of the sale at the counter, as the panel admin does it: pick products, fill the cart,
register the order and see it.

The pages are plain forms and tables (they work without JavaScript). Every number on them comes
from the quote of the store, which these tests get from the double of the Postgres functions.
"""

import re
import uuid
from decimal import Decimal

from django.urls import reverse

from inventory.models import Product
from ventas import domain
from ventas.models import PanelOrder
from ventas.services import GatewayError, GatewayUnavailable
from ventas.tests.support import SalesTestCase, messages_of

PANEL_TITLE = "Panel · Carnicería El Señor de La Misericordia"
ORDER = {
    "customer_name": "María López",
    "customer_phone": "444 123 4567",
    "delivery_type": "pickup",
    "delivery_address": "",
    "channel": "mostrador",
    "payment_method": "efectivo",
    "notes": "Sin grasa",
    "currency": "MXN",
}


def add_url(product):
    return reverse("ventas:carrito_agregar", args=[product.pk])


def form_of(html, action):
    """Return the HTML of the <form> that posts to `action`."""
    return re.search(rf'<form[^>]*action="{re.escape(action)}".*?</form>', html, re.DOTALL).group(0)


class SaleTestCase(SalesTestCase):
    def add(self, key, **line):
        """Add a line to the cart through the view, the way the page does."""
        line = {"mode": "weight", "amount": "1", "unit": "kg", **line}
        response = self.client.post(add_url(self.store[key]), line)
        # The page the redirect leads to would show the message; the tests do not follow it,
        # so it is dropped here and the next response carries only its own messages.
        self.client.cookies.pop("messages", None)
        return response

    def levels(self, response):
        return [level for level, _ in messages_of(response)]

    def texts(self, response):
        return [text for _, text in messages_of(response)]


class NewSalePageTests(SaleTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("ventas:nueva")

    def test_the_page_is_served_in_the_frame_of_the_panel(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/ventas.html")
        self.assertTemplateUsed(response, "panel/base.html")
        self.assertContains(response, f"<title>Nueva venta · {PANEL_TITLE}</title>")
        headings = re.findall(r"<h1[^>]*>(.*?)</h1>", response.content.decode(), re.DOTALL)
        self.assertEqual([h.strip() for h in headings], ["Nueva venta"])

    def test_the_url_is_the_one_of_the_contract(self):
        self.assertEqual(self.url, "/panel/ventas/nueva/")

    def test_it_lists_the_active_products_and_leaves_out_the_inactive_ones(self):
        Product.objects.create(
            category=self.store["meat"],
            name="Agotado para siempre",
            price_per_kg=Decimal("5.00"),
            is_active=False,
        )

        response = self.client.get(self.url)

        for name in ("Bistec", "Molida", "Camiseta"):
            self.assertContains(response, name)
        self.assertNotContains(response, "Agotado para siempre")

    def test_the_search_and_the_category_narrow_the_list(self):
        by_search = self.client.get(self.url, {"q": "mol"})
        by_category = self.client.get(self.url, {"category": self.store["merch"].pk})

        self.assertContains(by_search, "Molida")
        self.assertNotContains(by_search, "Camiseta")
        self.assertContains(by_category, "Camiseta")
        self.assertNotContains(by_category, "Bistec")

    def test_each_product_offers_only_the_ways_it_is_sold(self):
        html = self.client.get(self.url).content.decode()

        def modes(key):
            form = form_of(html, add_url(self.store[key]))
            return re.findall(r'<option value="(money|weight|pieces)"', form) or re.findall(
                r'name="mode" value="(\w+)"', form
            )

        self.assertEqual(modes("bistec"), ["money", "weight", "pieces"])
        self.assertEqual(modes("molida"), ["money", "weight"])
        self.assertEqual(modes("camiseta"), ["pieces"])

    def test_the_unit_and_the_thickness_only_show_where_they_mean_something(self):
        html = self.client.get(self.url).content.decode()

        bistec = form_of(html, add_url(self.store["bistec"]))
        molida = form_of(html, add_url(self.store["molida"]))
        camiseta = form_of(html, add_url(self.store["camiseta"]))
        self.assertIn('name="unit"', bistec)
        self.assertIn('name="thickness_in"', bistec)
        self.assertIn('name="unit"', molida)
        self.assertNotIn('name="thickness_in"', molida)
        self.assertNotIn('name="unit"', camiseta)
        self.assertNotIn('name="thickness_in"', camiseta)

    def test_every_form_of_the_page_posts_with_the_csrf_token(self):
        self.add("bistec")
        html = self.client.get(self.url).content.decode()

        forms = re.findall(r"<form [^>]*>.*?</form>", html, re.DOTALL)
        posting = [form for form in forms if 'method="post"' in form]
        self.assertGreaterEqual(len(posting), 6)
        for form in posting:
            with self.subTest(form=form[:90]):
                self.assertIn('name="csrfmiddlewaretoken"', form)

    def test_the_order_form_asks_for_what_the_counter_needs(self):
        html = self.client.get(self.url).content.decode()

        form = form_of(html, reverse("ventas:procesar"))
        for field in (
            "customer_name",
            "customer_phone",
            "delivery_type",
            "delivery_address",
            "channel",
            "payment_method",
            "notes",
            "currency",
        ):
            with self.subTest(field=field):
                self.assertIn(f'name="{field}"', form)

    def test_an_empty_cart_says_so_and_cannot_be_processed(self):
        response = self.client.get(self.url)

        self.assertContains(response, "El carrito está vacío")
        form = form_of(response.content.decode(), reverse("ventas:procesar"))
        self.assertRegex(form, r"<button[^>]*type=\"submit\"[^>]*disabled")

    def test_the_page_works_without_javascript(self):
        self.add("bistec")
        html = self.client.get(self.url).content.decode()

        for forbidden in ("<script", "<style", " style=", " onclick=", " onchange=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)

    def test_the_name_of_a_product_is_drawn_as_text(self):
        Product.objects.create(
            category=self.store["meat"], name="<b onmouseover=x>", price_per_kg=Decimal("5.00")
        )

        html = self.client.get(self.url).content.decode()

        self.assertIn("&lt;b onmouseover=x&gt;", html)
        self.assertNotIn("<b onmouseover=x>", html)


class AddToCartTests(SaleTestCase):
    def test_a_line_is_stored_as_the_shared_shape_without_any_price(self):
        response = self.add("bistec", unit="lb")

        self.assertRedirects(response, reverse("ventas:nueva"), fetch_redirect_response=False)
        self.assertEqual(
            self.cart(),
            [
                {
                    "product_id": self.store["bistec"].pk,
                    "mode": "weight",
                    "amount": "1",
                    "unit": "lb",
                    "thickness_in": None,
                    "note": None,
                }
            ],
        )
        self.assertEqual(self.levels(response), ["success"])

    def test_pieces_keep_their_thickness_and_the_note_is_kept(self):
        self.add("bistec", mode="pieces", amount="2", unit="", thickness_in="1.5", note="sin grasa")

        line = self.cart()[0]
        self.assertEqual(
            (line["mode"], line["amount"], line["unit"], line["thickness_in"], line["note"]),
            ("pieces", "2", None, "1.5", "sin grasa"),
        )

    def test_the_browser_cannot_name_a_price_or_a_total(self):
        self.add("bistec", unit="lb", unit_price="0.01", price="0.01", total="1", subtotal="1")

        self.assertEqual(
            set(self.cart()[0]), {"product_id", "mode", "amount", "unit", "thickness_in", "note"}
        )
        page = self.client.get(reverse("ventas:nueva"))
        self.assertContains(page, "90.72")

    def test_the_store_is_asked_whether_the_line_can_be_sold_before_it_is_kept(self):
        self.add("bistec")

        lines, currency = self.gateway.quotes[0]
        self.assertEqual(currency, "MXN")
        self.assertEqual([line["product_id"] for line in lines], [self.store["bistec"].pk])

    def test_a_way_of_selling_the_store_refuses_is_not_kept_and_the_staff_is_told_why(self):
        response = self.add("camiseta", mode="weight", unit="kg")

        self.assertRedirects(response, reverse("ventas:nueva"), fetch_redirect_response=False)
        self.assertEqual(self.cart(), [])
        self.assertEqual(
            messages_of(response), [("error", domain.ERROR_MESSAGES["sale_mode_not_allowed"])]
        )

    def test_an_amount_that_is_not_a_positive_number_is_refused_without_asking_the_store(self):
        for amount in ("", "abc", "0", "-1", "1e99999"):
            with self.subTest(amount=amount):
                response = self.add("bistec", amount=amount)

                self.assertRedirects(
                    response, reverse("ventas:nueva"), fetch_redirect_response=False
                )
                self.assertEqual(self.cart(), [])
                self.assertIn("error", self.levels(response))
        self.assertEqual(self.gateway.quotes, [])

    def test_pieces_have_to_be_a_whole_number(self):
        response = self.add("bistec", mode="pieces", amount="2.5", unit="")

        self.assertEqual(self.cart(), [])
        self.assertIn("error", self.levels(response))

    def test_the_unit_is_only_for_weight_and_the_thickness_only_for_pieces(self):
        cases = {
            "unit with money": {"mode": "money", "amount": "100", "unit": "lb"},
            "weight without unit": {"mode": "weight", "amount": "1", "unit": ""},
            "unit that does not exist": {"mode": "weight", "amount": "1", "unit": "oz"},
            "thickness with weight": {
                "mode": "weight",
                "amount": "1",
                "unit": "kg",
                "thickness_in": "1",
            },
            "mode that does not exist": {"mode": "grams", "amount": "1", "unit": "kg"},
        }
        for label, line in cases.items():
            with self.subTest(case=label):
                response = self.add("bistec", **line)

                self.assertEqual(self.cart(), [])
                self.assertIn("error", self.levels(response))
        self.assertEqual(self.gateway.quotes, [])

    def test_a_product_that_does_not_exist_or_is_inactive_is_a_404(self):
        inactive = Product.objects.create(
            category=self.store["meat"],
            name="Inactivo",
            price_per_kg=Decimal("9.00"),
            is_active=False,
        )

        for pk in (inactive.pk, 987654):
            with self.subTest(pk=pk):
                response = self.client.post(
                    reverse("ventas:carrito_agregar", args=[pk]),
                    {"mode": "weight", "amount": "1", "unit": "kg"},
                )

                self.assertEqual(response.status_code, 404)
        self.assertEqual(self.cart(), [])

    def test_the_same_product_twice_leaves_one_line_with_the_last_amount(self):
        self.add("bistec", amount="1")
        self.add("molida", amount="2")
        self.add("bistec", amount="3")

        self.assertEqual(
            [(line["product_id"], line["amount"]) for line in self.cart()],
            [(self.store["bistec"].pk, "3"), (self.store["molida"].pk, "2")],
        )

    def test_a_full_cart_does_not_take_one_more_line(self):
        session = self.client.session
        session["ventas_cart"] = [
            {
                "product_id": 10_000 + n,
                "mode": "weight",
                "amount": "1",
                "unit": "kg",
                "thickness_in": None,
                "note": None,
            }
            for n in range(50)
        ]
        session.save()

        response = self.add("bistec")

        self.assertEqual(len(self.cart()), 50)
        self.assertIn("error", self.levels(response))

    def test_when_the_database_is_down_nothing_is_kept_and_the_staff_is_told(self):
        self.gateway.errors["quote_cart"] = GatewayUnavailable()

        response = self.add("bistec")

        self.assertEqual(self.cart(), [])
        self.assertEqual(messages_of(response), [("error", domain.UNAVAILABLE_MESSAGE)])


class ChangeTheCartTests(SaleTestCase):
    def update(self, key, **line):
        line = {"mode": "weight", "amount": "2", "unit": "kg", **line}
        return self.client.post(
            reverse("ventas:carrito_actualizar", args=[self.store[key].pk]), line
        )

    def remove(self, key):
        return self.client.post(reverse("ventas:carrito_quitar", args=[self.store[key].pk]))

    def test_updating_changes_the_amount_of_the_line_and_asks_the_store_again(self):
        self.add("bistec", amount="1")
        asked_before = len(self.gateway.quotes)

        response = self.update("bistec", amount="2")

        self.assertRedirects(response, reverse("ventas:nueva"), fetch_redirect_response=False)
        self.assertEqual([line["amount"] for line in self.cart()], ["2"])
        self.assertGreater(len(self.gateway.quotes), asked_before)
        self.assertEqual(self.levels(response), ["success"])

    def test_an_update_the_store_refuses_keeps_the_line_as_it_was(self):
        self.add("bistec", amount="1")

        response = self.update("bistec", amount="0")

        self.assertEqual([line["amount"] for line in self.cart()], ["1"])
        self.assertIn("error", self.levels(response))

    def test_updating_a_product_that_is_not_in_the_cart_adds_nothing(self):
        response = self.update("bistec")

        self.assertEqual(self.cart(), [])
        self.assertEqual(self.levels(response), ["warning"])

    def test_removing_takes_the_line_out_and_leaves_the_others(self):
        self.add("bistec")
        self.add("molida")

        response = self.remove("bistec")

        self.assertRedirects(response, reverse("ventas:nueva"), fetch_redirect_response=False)
        self.assertEqual([line["product_id"] for line in self.cart()], [self.store["molida"].pk])
        self.assertEqual(self.levels(response), ["success"])

    def test_removing_a_line_that_is_not_there_is_not_an_error(self):
        response = self.remove("bistec")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.levels(response), ["warning"])


class QuoteOnThePageTests(SaleTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("ventas:nueva")

    def test_the_lines_and_the_total_are_the_numbers_of_the_store(self):
        self.add("bistec", amount="1", unit="lb")
        self.add("molida", mode="money", amount="50", unit="")

        response = self.client.get(self.url)

        for number in ("90.72", "50.00", "140.72", "0.454", "0.357"):
            with self.subTest(number=number):
                self.assertContains(response, number)
        lines, currency = self.gateway.quotes[-1]
        self.assertEqual((len(lines), currency), (2, "MXN"))

    def test_a_discount_and_a_warning_of_the_store_are_shown_on_the_line(self):
        self.gateway.promos[self.store["bistec"].pk] = {"kind": "percent", "value": "10"}
        self.gateway.warnings = ["low_stock"]
        self.add("bistec", amount="1", unit="kg")

        response = self.client.get(self.url)

        self.assertContains(response, "180.00")
        self.assertContains(response, "20.00")
        self.assertContains(response, domain.WARNING_MESSAGES["low_stock"])

    def test_the_names_of_the_lines_are_drawn_as_text(self):
        hostile = Product.objects.create(
            category=self.store["meat"], name="<i>x</i>", price_per_kg=Decimal("10.00")
        )
        session = self.client.session
        session["ventas_cart"] = [
            {
                "product_id": hostile.pk,
                "mode": "weight",
                "amount": "1",
                "unit": "kg",
                "thickness_in": None,
                "note": "<u>n</u>",
            }
        ]
        session.save()
        self.gateway.products[hostile.pk] = dict(self.gateway.products[self.store["molida"].pk])

        html = self.client.get(self.url).content.decode()

        self.assertIn("&lt;i&gt;x&lt;/i&gt;", html)
        self.assertNotIn("<i>x</i>", html)
        self.assertNotIn("<u>n</u>", html)

    def test_a_line_the_store_now_refuses_is_marked_and_blocks_the_sale_but_not_the_others(self):
        self.add("bistec", amount="1", unit="kg")
        session = self.client.session
        session["ventas_cart"] = [
            *session["ventas_cart"],
            {
                "product_id": self.store["camiseta"].pk,
                "mode": "weight",
                "amount": "1",
                "unit": "kg",
                "thickness_in": None,
                "note": None,
            },
        ]
        session.save()

        response = self.client.get(self.url)

        self.assertContains(response, domain.ERROR_MESSAGES["sale_mode_not_allowed"])
        self.assertContains(response, "200.00")
        form = form_of(response.content.decode(), reverse("ventas:procesar"))
        self.assertRegex(form, r"<button[^>]*type=\"submit\"[^>]*disabled")

    def test_dollars_quote_the_money_lines_in_dollars(self):
        self.add("bistec", mode="money", amount="10", unit="")

        response = self.client.get(self.url, {"currency": "USD"})

        self.assertEqual(self.gateway.quotes[-1][1], "USD")
        self.assertContains(response, "10.00")
        self.assertContains(response, 'name="currency" value="USD"')

    def test_without_a_fresh_exchange_rate_the_page_falls_back_to_pesos_and_says_so(self):
        self.add("bistec", mode="money", amount="100", unit="")
        self.gateway.fx["age_days"] = 5

        response = self.client.get(self.url, {"currency": "USD"})

        self.assertEqual(self.gateway.quotes[-1][1], "MXN")
        self.assertContains(response, 'name="currency" value="MXN"')
        self.assertIn(("warning", domain.ERROR_MESSAGES["fx_unavailable"]), messages_of(response))

    def test_a_currency_that_does_not_exist_is_pesos(self):
        self.add("bistec")

        self.client.get(self.url, {"currency": "EUR"})

        self.assertEqual(self.gateway.quotes[-1][1], "MXN")

    def test_a_cart_the_database_cannot_quote_still_shows_the_page(self):
        self.add("bistec")
        self.gateway.errors["quote_cart"] = GatewayUnavailable()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertIn(("error", domain.UNAVAILABLE_MESSAGE), messages_of(response))


class ProcessOrderTests(SaleTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("ventas:procesar")
        self.add("bistec", amount="1", unit="lb")

    def process(self, **changes):
        return self.client.post(self.url, {**ORDER, **changes})

    def test_the_order_is_registered_through_the_store_with_what_the_staff_typed(self):
        response = self.process()

        (order,) = self.gateway.orders
        self.assertEqual(
            order["items"],
            [
                {
                    "product_id": self.store["bistec"].pk,
                    "mode": "weight",
                    "amount": "1",
                    "unit": "lb",
                    "thickness_in": None,
                    "note": None,
                }
            ],
        )
        self.assertEqual(
            {key: order[key] for key in ORDER if key not in ("delivery_address",)},
            {key: value for key, value in ORDER.items() if key != "delivery_address"},
        )
        self.assertEqual(order["delivery_address"], {})
        self.assertEqual(order["staff_ref"], str(self.admin_id))
        saved = PanelOrder.objects.get()
        self.assertRedirects(
            response,
            reverse("ventas:pedido_detalle", args=[saved.pk]),
            fetch_redirect_response=False,
        )

    def test_the_total_is_the_one_of_the_store_and_nothing_the_browser_sent_counts(self):
        self.process(total="1.00", unit_price="0.01", subtotal="1", total_mxn="1")

        (order,) = self.gateway.orders
        self.assertFalse({"total", "unit_price", "subtotal", "total_mxn"} & set(order))
        self.assertEqual(PanelOrder.objects.get().total_mxn, Decimal("90.72"))

    def test_the_cart_is_emptied_and_the_staff_is_told(self):
        response = self.process()

        self.assertEqual(self.cart(), [])
        self.assertEqual(self.levels(response), ["success"])

    def test_an_empty_cart_registers_nothing(self):
        self.client.post(reverse("ventas:carrito_quitar", args=[self.store["bistec"].pk]))

        response = self.process()

        self.assertRedirects(response, reverse("ventas:nueva"), fetch_redirect_response=False)
        self.assertEqual(self.gateway.orders, [])
        self.assertIn("error", self.levels(response))

    def test_pressing_the_button_twice_registers_the_order_once(self):
        first = self.process()
        second = self.process()

        self.assertEqual(len(self.gateway.orders), 1)
        self.assertEqual(PanelOrder.objects.count(), 1)
        self.assertEqual(first.status_code, 302)
        self.assertRedirects(second, reverse("ventas:nueva"), fetch_redirect_response=False)

    def test_what_is_missing_or_wrong_is_shown_on_the_form_and_nothing_is_registered(self):
        cases = {
            "no name": {"customer_name": "  "},
            "name too long": {"customer_name": "x" * 121},
            "phone with letters": {"customer_phone": "llamar luego"},
            "delivery without an address": {"delivery_type": "delivery", "delivery_address": ""},
            "delivery type that does not exist": {"delivery_type": "dron"},
            "web channel": {"channel": "web"},
            "payment method that does not exist": {"payment_method": "cripto"},
            "notes too long": {"notes": "n" * 501},
            "currency that does not exist": {"currency": "EUR"},
        }
        for label, changes in cases.items():
            with self.subTest(case=label):
                response = self.process(**changes)

                self.assertEqual(response.status_code, 200)
                self.assertTemplateUsed(response, "ventas/ventas.html")
                self.assertTrue(response.context["order_form"].errors)
                self.assertEqual(len(self.cart()), 1)
        self.assertEqual(self.gateway.orders, [])

    def test_the_form_keeps_what_was_typed_when_it_has_an_error(self):
        response = self.process(customer_name="", notes="para las 3")

        self.assertContains(response, "para las 3")
        self.assertContains(response, "444 123 4567")

    def test_a_delivery_keeps_its_address(self):
        self.process(delivery_type="delivery", delivery_address="Calle 1 #2, Centro")

        (order,) = self.gateway.orders
        self.assertEqual(order["delivery_type"], "delivery")
        self.assertEqual(order["delivery_address"], {"address": "Calle 1 #2, Centro"})

    def test_the_phone_and_the_payment_method_are_optional(self):
        self.process(customer_phone="", payment_method="")

        (order,) = self.gateway.orders
        self.assertEqual((order["customer_phone"], order["payment_method"]), ("", None))

    def test_a_rule_of_the_store_stops_the_order_and_keeps_the_cart(self):
        self.gateway.errors["create_order_staff"] = GatewayError("product_not_found")

        response = self.process()

        self.assertEqual(response.status_code, 200)
        self.assertIn(("error", domain.ERROR_MESSAGES["product_not_found"]), messages_of(response))
        self.assertEqual(len(self.cart()), 1)
        self.assertEqual(PanelOrder.objects.count(), 0)

    def test_a_database_that_is_down_stops_the_order_and_keeps_the_cart(self):
        self.gateway.errors["create_order_staff"] = GatewayUnavailable()

        response = self.process()

        self.assertEqual(response.status_code, 200)
        self.assertIn(("error", domain.UNAVAILABLE_MESSAGE), messages_of(response))
        self.assertEqual(len(self.cart()), 1)

    def test_an_order_in_dollars_is_asked_for_in_dollars(self):
        self.process(currency="USD")

        (order,) = self.gateway.orders
        self.assertEqual(order["currency"], "USD")
        self.assertEqual(PanelOrder.objects.get().currency, "USD")

    def test_an_order_in_dollars_without_a_fresh_rate_is_refused_and_keeps_the_cart(self):
        self.gateway.fx["age_days"] = 5

        response = self.process(currency="USD")

        self.assertIn(("error", domain.ERROR_MESSAGES["fx_unavailable"]), messages_of(response))
        self.assertEqual(len(self.cart()), 1)
        self.assertEqual(self.gateway.orders, [])


class OrderDetailTests(SaleTestCase):
    def register(self, **changes):
        self.add("bistec", amount="1", unit="lb")
        self.client.post(reverse("ventas:procesar"), {**ORDER, **changes})
        return PanelOrder.objects.get()

    def test_the_page_shows_the_order_the_store_registered(self):
        order = self.register(delivery_type="delivery", delivery_address="Calle 1 #2")

        response = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/pedido_detalle.html")
        self.assertTemplateUsed(response, "panel/base.html")
        for text in (
            "María López",
            "444 123 4567",
            domain.STATUS_LABELS["pending"],
            domain.CHANNEL_LABELS["mostrador"],
            domain.PAYMENT_LABELS["efectivo"],
            "Calle 1 #2",
            "Sin grasa",
            "Bistec",
            "0.454",
            "90.72",
        ):
            with self.subTest(text=text):
                self.assertContains(response, text)

    def test_the_url_is_the_one_of_the_contract(self):
        order = self.register()

        self.assertEqual(
            reverse("ventas:pedido_detalle", args=[order.pk]), f"/panel/ventas/pedidos/{order.pk}/"
        )

    def test_a_dollar_order_shows_the_total_in_dollars(self):
        order = self.register(currency="USD")

        response = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk]))

        self.assertContains(response, "USD")
        self.assertContains(response, str(order.total_usd))

    def test_an_order_that_does_not_exist_is_a_404(self):
        self.assertEqual(
            self.client.get(reverse("ventas:pedido_detalle", args=[uuid.uuid4()])).status_code, 404
        )

    def test_each_line_carries_the_lots_that_served_it(self):
        order = self.register()
        lot = {
            "line_no": 1,
            "lot_id": 41,
            "product_id": 1,
            "product_name": "Bistec",
            "pieces": 2,
            "piece_weight_kg": Decimal("1.500"),
            "returned": False,
        }
        self.gateway.order_lot_rows = [lot, {**lot, "line_no": 2, "lot_id": 42}]

        response = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk]))

        self.assertEqual(self.gateway.order_lot_asks, [order.pk])
        self.assertEqual(response.context["order"].lines[0]["lots"], [lot])

    def test_a_line_no_lot_served_has_no_lots(self):
        order = self.register()

        response = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk]))

        self.assertEqual(response.context["order"].lines[0]["lots"], [])

    def test_the_order_still_shows_when_its_lots_cannot_be_read(self):
        order = self.register()
        self.gateway.errors["order_lots"] = GatewayUnavailable()

        response = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["order"].lines[0]["lots"], [])
        self.assertIn(("error", domain.UNAVAILABLE_MESSAGE), messages_of(response))

    def test_a_refused_lot_read_shows_its_message_and_the_order(self):
        order = self.register()
        self.gateway.errors["order_lots"] = GatewayError("lot_not_found")

        response = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["order"].lines[0]["lots"], [])
        self.assertIn(("error", domain.message_for("lot_not_found")), messages_of(response))

    def test_what_the_staff_typed_is_drawn_as_text(self):
        order = self.register(customer_name="<script>alert(1)</script>", notes="<b>fuerte</b>")

        html = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk])).content.decode()

        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", html)
        self.assertNotIn("<script>alert(1)", html)
        self.assertNotIn("<b>fuerte</b>", html)
