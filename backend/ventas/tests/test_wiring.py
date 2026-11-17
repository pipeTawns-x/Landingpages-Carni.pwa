"""Tests of how `ventas` plugs into the project, and that what was already there did not move.

`config/urls.py`, `config/settings.py` and the frame of the panel are shared, so each thing
`ventas` changes in them has a test that the old behaviour is the same.
"""

from django.apps import apps
from django.conf import settings
from django.test import SimpleTestCase, TestCase
from django.urls import resolve, reverse

from panel.tests import sign_in_as_panel_admin


class WiringTests(SimpleTestCase):
    def test_the_app_is_installed(self):
        self.assertTrue(apps.is_installed("ventas"))
        self.assertIn("ventas.apps.VentasConfig", settings.INSTALLED_APPS)

    def test_the_routes_of_the_contract_have_their_names_and_paths(self):
        self.assertEqual(reverse("ventas:catalogo"), "/productos/")
        self.assertEqual(reverse("ventas:nueva"), "/panel/ventas/nueva/")
        self.assertEqual(reverse("ventas:procesar"), "/panel/ventas/procesar/")
        self.assertEqual(
            reverse("ventas:carrito_agregar", args=[7]), "/panel/ventas/carrito/agregar/7/"
        )
        self.assertEqual(
            reverse("ventas:carrito_actualizar", args=[7]), "/panel/ventas/carrito/actualizar/7/"
        )
        self.assertEqual(
            reverse("ventas:carrito_quitar", args=[7]), "/panel/ventas/carrito/quitar/7/"
        )

    def test_the_routes_that_were_already_there_still_resolve_to_the_same_paths(self):
        self.assertEqual(reverse("panel:inicio"), "/panel/")
        self.assertEqual(reverse("panel:mas"), "/panel/mas/")
        self.assertEqual(reverse("inventory:list"), "/panel/productos/")
        self.assertEqual(reverse("inventory:create"), "/panel/productos/nuevo/")
        self.assertEqual(reverse("ecommerce:my-products"), "/my-products/")
        self.assertEqual(resolve("/panel/productos/").view_name, "inventory:list")
        self.assertEqual(resolve("/panel/mas/").view_name, "panel:mas")

    def test_the_course_app_is_still_installed_apart_from_the_store(self):
        # D1: ventas is its own app on the real catalogue; the M14-M15 practice stays aside.
        self.assertIn("ecommerce.apps.EcommerceConfig", settings.INSTALLED_APPS)
        self.assertNotEqual(
            apps.get_app_config("ventas").path, apps.get_app_config("ecommerce").path
        )


class FrameKeepsWorkingTests(TestCase):
    """The frame gained a block for the page's own stylesheet; the pages that do not use it
    are drawn as before."""

    def test_the_mas_page_is_unchanged(self):
        sign_in_as_panel_admin(self.client)

        response = self.client.get(reverse("panel:mas"))

        self.assertContains(response, '<link rel="stylesheet" href="/static/panel/panel.css" />')
        self.assertNotContains(response, "ventas.css")
        self.assertContains(response, "Cerrar sesión", count=2)
