"""Who gets into `panel/ventas/`: the panel admin, and nobody else.

The sales pages of the panel sit behind `panel_admin_required` like every other panel route, and
their POSTs carry Django's CSRF check. A common user (anonymous, or signed in with no panel role)
is sent to the access bridge and nothing happens: no line in a cart, no call to the database.
"""

import uuid

from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import get_resolver, reverse

from panel.tests import hand_off, insert_profile, routes, sign_in_as_panel_admin
from ventas.tests.support import SalesTestCase

# Every route under panel/ventas/: (url name, url arguments, method that does the job).
# `test_the_table_covers_every_route_of_panel_ventas` fails the day a route is added without a row.
PANEL_ROUTES = {
    "panel/ventas/nueva/": ("ventas:nueva", {}, "get"),
    "panel/ventas/carrito/agregar/<int:pk>/": ("ventas:carrito_agregar", {"pk": 1}, "post"),
    "panel/ventas/carrito/actualizar/<int:pk>/": ("ventas:carrito_actualizar", {"pk": 1}, "post"),
    "panel/ventas/carrito/quitar/<int:pk>/": ("ventas:carrito_quitar", {"pk": 1}, "post"),
    "panel/ventas/procesar/": ("ventas:procesar", {}, "post"),
    "panel/ventas/pedidos/<uuid:pk>/": ("ventas:pedido_detalle", {"pk": uuid.uuid4()}, "get"),
}
ADD_LINE = {"mode": "weight", "amount": "1", "unit": "kg"}


def panel_ventas_routes():
    return {
        path: callback
        for path, callback in routes(get_resolver().url_patterns)
        if path.startswith("panel/ventas/")
    }


class PanelVentasAccessTests(SalesTestCase):
    def call(self, client, name, kwargs, method):
        return getattr(client, method)(
            reverse(name, kwargs=kwargs), ADD_LINE if method == "post" else None
        )

    def assert_nothing_happened(self):
        self.assertEqual(self.cart(), [])
        self.assertEqual((self.gateway.quotes, self.gateway.orders), ([], []))

    def test_the_table_covers_every_route_of_panel_ventas(self):
        self.assertEqual(set(panel_ventas_routes()), set(PANEL_ROUTES))

    def test_every_route_of_panel_ventas_is_guarded(self):
        for path, callback in panel_ventas_routes().items():
            with self.subTest(route=path):
                self.assertTrue(getattr(callback, "panel_admin_required", False))

    def test_an_anonymous_visitor_is_sent_to_the_access_bridge_from_every_route(self):
        self.client.logout()

        for path, (name, kwargs, method) in PANEL_ROUTES.items():
            with self.subTest(route=path):
                response = self.call(self.client, name, kwargs, method)

                self.assertRedirects(
                    response, reverse("panel:acceso"), fetch_redirect_response=False
                )
        self.assert_nothing_happened()

    def test_a_signed_in_user_without_a_panel_role_is_sent_there_too(self):
        self.client.logout()
        self.client.force_login(get_user_model().objects.create_user("a-customer"))

        for path, (name, kwargs, method) in PANEL_ROUTES.items():
            with self.subTest(route=path):
                response = self.call(self.client, name, kwargs, method)

                self.assertRedirects(
                    response, reverse("panel:acceso"), fetch_redirect_response=False
                )
        self.assert_nothing_happened()

    def test_a_customer_of_the_store_cannot_open_a_panel_session_and_stays_out(self):
        self.client.logout()
        customer_id = uuid.uuid4()
        insert_profile(customer_id, "customer")

        self.assertEqual(hand_off(self.client, customer_id).status_code, 403)
        for path, (name, kwargs, method) in PANEL_ROUTES.items():
            with self.subTest(route=path):
                response = self.call(self.client, name, kwargs, method)

                self.assertRedirects(
                    response, reverse("panel:acceso"), fetch_redirect_response=False
                )
        self.assert_nothing_happened()

    def test_a_panel_admin_gets_in(self):
        self.assertEqual(self.client.get(reverse("ventas:nueva")).status_code, 200)
        # An order that does not exist is a 404 of the page itself, not a bounce at the door.
        self.assertEqual(
            self.client.get(reverse("ventas:pedido_detalle", args=[uuid.uuid4()])).status_code, 404
        )

    def test_the_post_routes_refuse_a_get(self):
        for path, (name, kwargs, method) in PANEL_ROUTES.items():
            if method != "post":
                continue
            with self.subTest(route=path):
                self.assertEqual(self.client.get(reverse(name, kwargs=kwargs)).status_code, 405)

    def test_the_get_routes_refuse_a_post(self):
        for path, (name, kwargs, method) in PANEL_ROUTES.items():
            if method != "get":
                continue
            with self.subTest(route=path):
                self.assertEqual(self.client.post(reverse(name, kwargs=kwargs)).status_code, 405)

    def test_a_post_without_the_csrf_token_is_refused_and_changes_nothing(self):
        strict = Client(enforce_csrf_checks=True)
        sign_in_as_panel_admin(strict)
        product = self.store["bistec"]

        for path, (name, kwargs, method) in PANEL_ROUTES.items():
            if method != "post":
                continue
            kwargs = {"pk": product.pk} if kwargs else {}
            with self.subTest(route=path):
                response = strict.post(reverse(name, kwargs=kwargs), ADD_LINE)

                self.assertEqual(response.status_code, 403)
        self.assertEqual(strict.session.get("ventas_cart", []), [])
        self.assertEqual(self.gateway.orders, [])
