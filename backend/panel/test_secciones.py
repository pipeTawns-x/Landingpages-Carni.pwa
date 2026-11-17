"""Tests of the sections the frame links: Clientes, Ajustes, and the two products in development.

Clientes reads the `panel_orders` mirror and groups it by customer. Ajustes shows the data of the
business and writes the exchange rate through the gateway (the Postgres function decides; the
double here applies its range). BuildAds and ProductAds are one page that says they are under
development, and Publicidad is gone: it answers 404.
"""

import re
import uuid
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.contrib.messages import get_messages
from django.db import models
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from panel.tests import sign_in_as_panel_admin
from ventas.models import PanelOrder
from ventas.negocio import HORARIO, NEGOCIO
from ventas.services import GatewayError, GatewayUnavailable
from ventas.tests.support import FakeGateway

FORBIDDEN_IN_HTML = ("<script", "<style", " style=", " onclick=", " onchange=", "javascript:")


class FxGateway(FakeGateway):
    """The double of the settings page: a store with a known rate and no products."""

    def __init__(self):
        super().__init__(
            {}, fx={"rate": Decimal("18.50"), "buffer_pct": Decimal("2.00"), "age_days": 0}
        )


def add_order(name, phone, total, *, days_ago=0, status="delivered"):
    """Insert one row in the mirror, the way the database would."""
    when = timezone.now() - timedelta(days=days_ago)
    row = PanelOrder(
        order_id=uuid.uuid4(),
        status=status,
        channel="counter",
        customer_name=name,
        customer_phone=phone,
        delivery_type="pickup",
        delivery_address={},
        currency="MXN",
        total_mxn=Decimal(total),
        created_at=when,
        updated_at=when,
        lines=[],
    )
    models.Model.save(row, force_insert=True)
    return row


def assert_clean(test, html):
    for forbidden in FORBIDDEN_IN_HTML:
        test.assertNotIn(forbidden, html, forbidden)


class SectionAccessTests(TestCase):
    NAMES = ("panel:clientes", "panel:ajustes", "panel:buildads", "panel:productads")

    def test_the_paths_are_the_ones_of_the_contract(self):
        self.assertEqual(reverse("panel:clientes"), "/panel/clientes/")
        self.assertEqual(reverse("panel:ajustes"), "/panel/ajustes/")
        self.assertEqual(reverse("panel:buildads"), "/panel/buildads/")
        self.assertEqual(reverse("panel:productads"), "/panel/productads/")

    def test_an_anonymous_visitor_is_sent_to_the_access_bridge(self):
        for name in self.NAMES:
            with self.subTest(name=name):
                response = self.client.get(reverse(name))

                self.assertRedirects(
                    response, reverse("panel:acceso"), fetch_redirect_response=False
                )

    def test_a_panel_admin_gets_every_page_without_script_or_inline_style(self):
        sign_in_as_panel_admin(self.client)
        with mock.patch("ventas.services.get_gateway", return_value=FxGateway()):
            for name in self.NAMES:
                with self.subTest(name=name):
                    response = self.client.get(reverse(name))

                    self.assertEqual(response.status_code, 200)
                    assert_clean(self, response.content.decode())

    def test_publicidad_is_gone(self):
        sign_in_as_panel_admin(self.client)

        self.assertEqual(self.client.get("/panel/publicidad/").status_code, 404)


class InDevelopmentTests(TestCase):
    def setUp(self):
        sign_in_as_panel_admin(self.client)

    def test_each_product_names_itself_and_says_it_is_under_development(self):
        for name, product in (("panel:buildads", "BuildAds"), ("panel:productads", "ProductAds")):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                html = response.content.decode()

                self.assertTemplateUsed(response, "panel/proximamente.html")
                self.assertEqual(
                    re.findall(r"<h1[^>]*>(.*?)</h1>", html, flags=re.DOTALL)[0].strip(), product
                )
                self.assertContains(response, "Próximamente · funcionalidad en desarrollo")
                self.assertContains(response, product, count=html.count(product))

    def test_the_sidebar_and_the_phone_menu_list_them_and_not_publicidad(self):
        html = self.client.get(reverse("panel:mas")).content.decode()

        self.assertNotIn("Publicidad", html)
        self.assertNotIn("/panel/publicidad/", html)
        self.assertIn('href="/panel/buildads/"', html)
        self.assertIn('href="/panel/productads/"', html)

    def test_the_current_one_is_marked(self):
        html = self.client.get(reverse("panel:buildads")).content.decode()
        sidebar = re.search(r"<aside.*?</aside>", html, flags=re.DOTALL).group(0)

        self.assertRegex(sidebar, r'href="/panel/buildads/" aria-current="page"')
        self.assertNotRegex(sidebar, r'href="/panel/productads/" aria-current')


class ClientesTests(TestCase):
    def setUp(self):
        sign_in_as_panel_admin(self.client)
        self.url = reverse("panel:clientes")

    def test_without_orders_it_says_so(self):
        response = self.client.get(self.url)

        self.assertContains(response, "Todavía no hay clientes")
        self.assertEqual(
            re.findall(r"<h1[^>]*>(.*?)</h1>", response.content.decode(), flags=re.DOTALL)[
                0
            ].strip(),
            "Clientes",
        )

    def test_orders_are_grouped_by_customer_with_count_total_and_last_date(self):
        add_order("Ana", "4441112233", "100.50", days_ago=5)
        latest = add_order("Ana", "4441112233", "200.00", days_ago=1)
        add_order("Beto", None, "50.00", days_ago=3)

        response = self.client.get(self.url)

        customers = response.context["page_obj"].object_list
        self.assertEqual([c["name"] for c in customers], ["Ana", "Beto"])
        ana = customers[0]
        self.assertEqual(ana["orders"], 2)
        self.assertEqual(ana["total_mxn"], Decimal("300.50"))
        self.assertEqual(ana["phone"], "4441112233")
        self.assertEqual(ana["last_order_id"], latest.pk)
        self.assertContains(response, reverse("ventas:pedido_detalle", args=[latest.pk]))
        self.assertContains(response, "$300.50")
        self.assertContains(response, "4441112233")

    def test_the_same_name_with_another_phone_is_another_customer(self):
        add_order("Ana", "111", "10")
        add_order("Ana", "222", "10")

        self.assertEqual(len(self.client.get(self.url).context["page_obj"].object_list), 2)

    def test_a_cancelled_order_counts_as_an_order_but_not_as_money_spent(self):
        add_order("Ana", "111", "100", status="delivered")
        add_order("Ana", "111", "999", status="cancelled")

        ana = self.client.get(self.url).context["page_obj"].object_list[0]

        self.assertEqual(ana["orders"], 2)
        self.assertEqual(ana["total_mxn"], Decimal("100.00"))

    def test_an_order_without_a_name_is_listed_as_sin_nombre(self):
        add_order(None, None, "10")

        response = self.client.get(self.url)

        self.assertContains(response, "Sin nombre")

    def test_the_list_is_paginated_and_the_newest_customer_comes_first(self):
        for number in range(25):
            add_order(f"Cliente {number:02d}", f"{number:010d}", "10", days_ago=30 - number)

        first = self.client.get(self.url)
        second = self.client.get(self.url, {"page": 2})

        self.assertEqual(first.context["page_obj"].paginator.num_pages, 2)
        self.assertEqual(first.context["page_obj"].object_list[0]["name"], "Cliente 24")
        self.assertEqual(len(second.context["page_obj"].object_list), 5)
        assert_clean(self, first.content.decode())

    def test_a_post_is_refused(self):
        self.assertEqual(self.client.post(self.url).status_code, 405)

    def test_the_current_entry_is_marked_in_both_navigations(self):
        html = self.client.get(self.url).content.decode()

        self.assertEqual(html.count('href="/panel/clientes/" aria-current="page"'), 2)


class AjustesTests(TestCase):
    def setUp(self):
        self.admin_id = sign_in_as_panel_admin(self.client)
        self.gateway = FxGateway()
        patcher = mock.patch("ventas.services.get_gateway", return_value=self.gateway)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.url = reverse("panel:ajustes")

    def post(self, rate):
        return self.client.post(self.url, {"rate": rate})

    def test_it_shows_the_business_data_read_only(self):
        response = self.client.get(self.url)

        for text in (
            NEGOCIO["nombre"],
            NEGOCIO["telefono"],
            NEGOCIO["direccion"][0],
            HORARIO["dias"],
        ):
            with self.subTest(text=text):
                self.assertContains(response, text)

    def test_it_shows_the_rate_and_the_buffer(self):
        response = self.client.get(self.url)

        self.assertContains(response, "18.50")
        self.assertContains(response, "2.00")

    def test_without_a_rate_it_says_there_is_none(self):
        self.gateway.fx = None

        self.assertContains(self.client.get(self.url), "Todavía no hay tipo de cambio")

    def test_the_form_is_a_post_with_the_csrf_token(self):
        html = self.client.get(self.url).content.decode()
        main = html[html.index("<main") : html.index("</main>")]

        forms = re.findall(r"<form [^>]*>.*?</form>", main, flags=re.DOTALL)
        self.assertEqual(len(forms), 1)
        self.assertIn('method="post"', forms[0])
        self.assertIn('name="csrfmiddlewaretoken"', forms[0])
        self.assertIn('name="rate"', forms[0])
        assert_clean(self, html)

    def test_a_valid_rate_is_saved_and_the_page_is_reloaded_with_a_success_message(self):
        response = self.post("19.25")

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        self.assertEqual(self.gateway.manual_rates, [(Decimal("19.25"), None, str(self.admin_id))])
        self.assertEqual(
            [m.message for m in get_messages(response.wsgi_request)],
            ["Tipo de cambio actualizado."],
        )
        self.assertContains(self.client.get(self.url), "19.25")

    def test_zero_negative_text_and_empty_are_rejected_with_a_spanish_error(self):
        cases = {
            "0": "mayor que cero",
            "-3": "mayor que cero",
            "abc": "número",
            "": "obligatorio",
            "NaN": "número",
            "1001": "1,000",
        }
        for value, expected in cases.items():
            with self.subTest(value=value):
                response = self.post(value)

                self.assertEqual(response.status_code, 200)
                self.assertContains(response, expected)
                self.assertEqual(self.gateway.manual_rates, [])

    def test_a_refusal_of_the_store_is_shown_and_nothing_is_redirected(self):
        self.gateway.errors["set_manual_fx_rate"] = GatewayError("invalid_rate")

        response = self.post("19")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(list(get_messages(response.wsgi_request))), 1)

    def test_an_unavailable_database_is_shown_and_the_page_still_renders(self):
        self.gateway.errors["set_manual_fx_rate"] = GatewayUnavailable()
        self.gateway.errors["current_fx"] = GatewayUnavailable()

        response = self.post("19")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "No se pudo hablar con la base de datos")

    def test_the_rate_cannot_be_read_but_the_page_opens(self):
        self.gateway.errors["current_fx"] = GatewayUnavailable()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, NEGOCIO["nombre"])

    def test_a_visitor_cannot_post_the_rate(self):
        self.client.logout()

        response = self.post("19")

        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)
        self.assertEqual(self.gateway.manual_rates, [])

    def test_ajustes_is_current_in_the_sidebar_and_in_mas(self):
        html = self.client.get(self.url).content.decode()

        self.assertIn('href="/panel/ajustes/" aria-current="page"', html)
        self.assertIn('href="/panel/mas/" aria-current="true"', html)
