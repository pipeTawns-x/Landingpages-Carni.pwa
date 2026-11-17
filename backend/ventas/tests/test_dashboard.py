"""Tests of the first dashboard: the home of the panel with its metrics, and the orders board.

The home (`panel:inicio`, /panel/) shows what `panel_kpis()` returns (shape D4) and the latest
orders. The board (`orders:board`, /panel/pedidos/) shows the orders in their six statuses and
moves them only through `set_order_status`, the function that knows the transitions and the
stock. Both are pages of the panel: plain HTML, no JavaScript.
"""

import re
import uuid
from decimal import Decimal

from django.db import models
from django.test import Client
from django.urls import resolve, reverse
from django.utils import timezone

from panel.tests import sign_in_as_panel_admin
from ventas import domain
from ventas.models import PanelOrder
from ventas.services import GatewayUnavailable
from ventas.tests.support import SalesTestCase, messages_of

KPIS = {
    "ventas_hoy": {"total": "450.00", "pedidos": 3},
    "pendientes": 2,
    "ticket_promedio_30d": "240.00",
    "margen_30d": {"monto": "220.00", "pct": "44.0"},
    "top5": [
        {"producto": "Arrachera", "ingreso": "1000.00", "kg": "10.000"},
        {"producto": "Bistec", "ingreso": "300.00", "kg": "3.000"},
    ],
    "serie_7d": [
        {"dia": "2026-11-10", "total": "0.00"},
        {"dia": "2026-11-11", "total": "0.00"},
        {"dia": "2026-11-12", "total": "0.00"},
        {"dia": "2026-11-13", "total": "0.00"},
        {"dia": "2026-11-14", "total": "0.00"},
        {"dia": "2026-11-15", "total": "210.00"},
        {"dia": "2026-11-16", "total": "450.00"},
    ],
}


def make_order(status="pending", name="Cliente", total="100.00", **fields):
    """Write an order to the mirror the way the database would (Django never does)."""
    now = timezone.now()
    row = PanelOrder(
        order_id=uuid.uuid4(),
        status=status,
        channel=fields.get("channel", "mostrador"),
        customer_name=name,
        customer_phone=None,
        delivery_type="pickup",
        delivery_address={},
        notes=None,
        payment_method=None,
        currency="MXN",
        total_mxn=Decimal(total),
        total_usd=None,
        fx_rate_used=None,
        staff_ref=None,
        created_at=fields.get("created_at", now),
        updated_at=now,
        lines=[],
    )
    models.Model.save(row, force_insert=True)
    return row


def form_actions(html):
    return re.findall(r'<form[^>]*action="([^"]+)"', html)


class HomeTests(SalesTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("panel:inicio")

    def test_the_home_is_the_dashboard_and_not_a_redirect(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/inicio.html")
        self.assertTemplateUsed(response, "panel/base.html")
        self.assertContains(
            response, "<title>Inicio · Panel · Carnicería El Señor de La Misericordia</title>"
        )

    def test_it_shows_the_metrics_of_the_store(self):
        self.gateway.kpis = KPIS

        response = self.client.get(self.url)

        for text in ("450.00", "3 pedidos", "240.00", "220.00", "44.0", "Arrachera", "1000.00"):
            with self.subTest(text=text):
                self.assertContains(response, text)
        self.assertContains(response, "Pendientes")

    def test_the_week_chart_has_one_bar_per_day_scaled_to_the_best_day(self):
        self.gateway.kpis = KPIS

        html = self.client.get(self.url).content.decode()

        bars = re.findall(r'data-bar="height" data-step="(\d+)"', html)
        self.assertEqual(len(bars), 7)
        self.assertEqual(bars[-1], "10")
        self.assertEqual(bars[0], "0")

    def test_without_costs_the_margin_says_so_instead_of_zero(self):
        response = self.client.get(self.url)

        self.assertContains(response, "Sin costos registrados")
        self.assertContains(response, "Aún no hay ventas en los últimos 30 días")

    def test_the_latest_orders_are_listed_and_link_to_their_detail(self):
        order = make_order(name="Doña Mary")

        response = self.client.get(self.url)

        self.assertContains(response, "Doña Mary")
        self.assertContains(response, reverse("ventas:pedido_detalle", args=[order.pk]))

    def test_it_points_to_the_new_sale_and_the_board(self):
        html = self.client.get(self.url).content.decode()

        self.assertIn(reverse("ventas:nueva"), html)
        self.assertIn(reverse("orders:board"), html)

    def test_when_the_database_is_down_the_page_still_opens_and_says_so(self):
        self.gateway.errors["panel_kpis"] = GatewayUnavailable()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "No se pudieron cargar las métricas")

    def test_it_works_without_javascript(self):
        self.gateway.kpis = KPIS
        make_order()

        html = self.client.get(self.url).content.decode()

        for forbidden in ("<script", "<style", " style=", " onclick=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)

    def test_what_comes_from_the_database_is_drawn_as_text(self):
        self.gateway.kpis = {
            **KPIS,
            "top5": [{"producto": "<b>x</b>", "ingreso": "1.00", "kg": "1.000"}],
        }
        make_order(name="<i>y</i>")

        html = self.client.get(self.url).content.decode()

        self.assertNotIn("<b>x</b>", html)
        self.assertNotIn("<i>y</i>", html)


class BoardTests(SalesTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("orders:board")

    def move_url(self, order):
        return reverse("orders:mover", args=[order.pk])

    def test_it_lives_at_panel_pedidos_in_the_orders_section(self):
        self.assertEqual(self.url, "/panel/pedidos/")
        self.assertEqual(resolve(self.url).namespace, "orders")

    def test_it_shows_the_six_statuses_with_their_orders(self):
        pending = make_order("pending", "Ana")
        ready = make_order("ready", "Beto")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/tablero.html")
        self.assertTemplateUsed(response, "panel/base.html")
        for label in domain.STATUS_LABELS.values():
            self.assertContains(response, label)
        html = response.content.decode()
        self.assertIn(reverse("ventas:pedido_detalle", args=[pending.pk]), html)
        self.assertIn(reverse("ventas:pedido_detalle", args=[ready.pk]), html)
        self.assertLess(html.index("Ana"), html.index("Beto"))

    def test_a_card_offers_only_the_moves_its_status_allows(self):
        pending = make_order("pending")
        delivered = make_order("delivered")

        html = self.client.get(self.url).content.decode()

        self.assertEqual(form_actions(html).count(self.move_url(pending)), 2)
        self.assertNotIn(self.move_url(delivered), html)
        self.assertIn('name="status" value="confirmed"', html)
        self.assertIn('name="status" value="cancelled"', html)

    def test_moving_an_order_goes_through_the_store_and_comes_back_to_the_board(self):
        order = make_order("pending")

        response = self.client.post(self.move_url(order), {"status": "confirmed"})

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        self.assertEqual(self.gateway.moves, [(order.pk, "confirmed", str(self.admin_id))])
        self.assertEqual(PanelOrder.objects.get(pk=order.pk).status, "confirmed")
        self.assertEqual([level for level, _ in messages_of(response)], ["success"])

    def test_a_move_the_store_refuses_changes_nothing_and_says_why(self):
        order = make_order("pending")

        response = self.client.post(self.move_url(order), {"status": "delivered"})

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        self.assertEqual(PanelOrder.objects.get(pk=order.pk).status, "pending")
        self.assertEqual(
            messages_of(response), [("error", domain.ERROR_MESSAGES["invalid_transition"])]
        )

    def test_a_status_that_does_not_exist_is_a_bad_request(self):
        order = make_order("pending")

        response = self.client.post(self.move_url(order), {"status": "lost"})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.gateway.moves, [])

    def test_a_move_can_come_back_to_the_detail_of_the_order(self):
        order = make_order("pending")
        detail = reverse("ventas:pedido_detalle", args=[order.pk])

        response = self.client.post(self.move_url(order), {"status": "confirmed", "next": detail})

        self.assertRedirects(response, detail, fetch_redirect_response=False)

    def test_the_next_page_has_to_be_of_this_site(self):
        order = make_order("pending")

        response = self.client.post(
            self.move_url(order), {"status": "confirmed", "next": "https://evil.example/"}
        )

        self.assertRedirects(response, self.url, fetch_redirect_response=False)

    def test_when_the_database_is_down_the_order_stays_and_the_staff_is_told(self):
        order = make_order("pending")
        self.gateway.errors["set_order_status"] = GatewayUnavailable()

        response = self.client.post(self.move_url(order), {"status": "confirmed"})

        self.assertEqual(messages_of(response), [("error", domain.UNAVAILABLE_MESSAGE)])
        self.assertEqual(PanelOrder.objects.get(pk=order.pk).status, "pending")

    def test_the_detail_page_offers_the_same_moves(self):
        order = make_order("confirmed")

        html = self.client.get(reverse("ventas:pedido_detalle", args=[order.pk])).content.decode()

        self.assertEqual(form_actions(html).count(self.move_url(order)), 2)
        self.assertIn('name="status" value="preparing"', html)

    def test_only_the_panel_admin_gets_in_and_the_move_is_a_post_with_csrf(self):
        order = make_order("pending")
        self.assertEqual(self.client.get(self.move_url(order)).status_code, 405)
        self.assertEqual(self.client.post(self.url).status_code, 405)

        for route in (resolve(self.url), resolve(self.move_url(order))):
            self.assertTrue(getattr(route.func, "panel_admin_required", False))

        strict = Client(enforce_csrf_checks=True)
        sign_in_as_panel_admin(strict)
        response = strict.post(self.move_url(order), {"status": "confirmed"})
        self.assertEqual(response.status_code, 403)

        self.client.logout()
        response = self.client.get(self.url)
        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)
        self.assertEqual(self.gateway.moves, [])

    def test_a_name_typed_by_a_web_customer_is_drawn_as_text(self):
        # A web order carries the name a stranger typed on the store, and the board shows it.
        make_order("pending", "<script>alert(1)</script>", channel="web")

        html = self.client.get(self.url).content.decode()

        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", html)
        self.assertNotIn("<script>alert(1)", html)

    def test_it_works_without_javascript(self):
        make_order("pending")

        html = self.client.get(self.url).content.decode()

        for forbidden in ("<script", "<style", " style=", " onclick=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)
