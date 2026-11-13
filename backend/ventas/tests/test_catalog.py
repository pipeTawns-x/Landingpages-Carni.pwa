"""Tests of the public catalogue (`ventas:catalogo`, /tienda/): what a common user sees.

Anyone may open it, signed in or not. It lists the active products of the real catalogue, never
shows what the store keeps private (the cost, the inactive products) and never talks to the
database functions: it only reads the mirror of `public.products`.
"""

import re
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from inventory.models import Category, Product
from panel.test_frame import anchors
from ventas.tests.support import make_store

COST = "123.45"


class PublicCatalogTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()
        meat = cls.store["meat"]
        Product.objects.create(
            category=meat,
            name="Descontinuado",
            price_per_kg=Decimal("99.00"),
            is_active=False,
        )
        hidden = Category.objects.create(name="Oculta", slug="oculta", is_active=False)
        Product.objects.create(
            category=hidden, name="De categoria oculta", price_per_kg=Decimal("88.00")
        )
        Product.objects.create(
            category=meat,
            name="Ribeye",
            description="Corte marmoleado",
            price_per_kg=Decimal("549.00"),
            metadata={"cost_per_kg": COST, "costo": COST},
        )

    def setUp(self):
        self.url = reverse("ventas:catalogo")
        # The catalogue reads the mirror of the products; a call to the functions is a bug.
        patcher = mock.patch(
            "ventas.services.get_gateway",
            side_effect=AssertionError("the public catalogue must not call the database functions"),
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_it_lives_at_tienda(self):
        self.assertEqual(self.url, "/tienda/")

    def test_an_anonymous_visitor_sees_the_active_products_with_their_price_and_unit(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/catalogo.html")
        for name in ("Bistec", "Molida", "Camiseta", "Ribeye"):
            self.assertContains(response, name)
        self.assertContains(response, "200.00")
        self.assertContains(response, "549.00")
        # Bistec is sold by the kilo and the shirt by the piece.
        self.assertContains(response, "/ kg")
        self.assertContains(response, "/ pieza")

    def test_an_inactive_product_is_not_listed(self):
        self.assertNotContains(self.client.get(self.url), "Descontinuado")

    def test_a_product_of_an_inactive_category_is_not_listed(self):
        self.assertNotContains(self.client.get(self.url), "De categoria oculta")

    def test_the_cost_never_shows_up(self):
        response = self.client.get(self.url)

        self.assertNotContains(response, COST)
        self.assertIsNone(re.search(r"cost", response.content.decode(), flags=re.IGNORECASE))

    def test_a_signed_in_customer_without_a_role_sees_the_same_page(self):
        customer = get_user_model().objects.create_user("a-customer")
        self.client.force_login(customer)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Bistec")
        self.assertTemplateUsed(response, "ventas/catalogo.html")

    def test_the_page_is_not_the_panel_and_does_not_point_to_it(self):
        response = self.client.get(self.url)

        self.assertTemplateNotUsed(response, "panel/base.html")
        links = [a.get("href", "") for a in anchors(response.content.decode())]
        self.assertEqual([href for href in links if href.startswith("/panel/")], [])

    def test_the_search_looks_in_the_name_and_in_the_description(self):
        by_name = self.client.get(self.url, {"q": "bist"})
        by_description = self.client.get(self.url, {"q": "marmoleado"})

        self.assertContains(by_name, "Bistec")
        self.assertNotContains(by_name, "Molida")
        self.assertContains(by_description, "Ribeye")
        self.assertNotContains(by_description, "Bistec")

    def test_the_category_filter_keeps_only_that_category(self):
        response = self.client.get(self.url, {"category": self.store["merch"].pk})

        self.assertContains(response, "Camiseta")
        self.assertNotContains(response, "Bistec")

    def test_a_category_that_is_not_a_number_is_ignored(self):
        response = self.client.get(self.url, {"category": "abc"})

        self.assertContains(response, "Bistec")
        self.assertContains(response, "Camiseta")

    def test_a_search_with_no_match_says_so_instead_of_an_empty_page(self):
        response = self.client.get(self.url, {"q": "nada que coincida"})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "No encontramos productos")

    def test_the_name_of_a_product_is_drawn_as_text_and_not_as_html(self):
        Product.objects.create(
            category=self.store["meat"],
            name="<img src=x onerror=alert(1)>",
            price_per_kg=Decimal("10.00"),
        )

        html = self.client.get(self.url).content.decode()

        self.assertIn("&lt;img src=x onerror=alert(1)&gt;", html)
        self.assertNotIn("<img src=x", html)

    def test_it_is_paginated_and_a_bad_page_number_still_gives_a_page(self):
        for number in range(30):
            Product.objects.create(
                category=self.store["meat"],
                name=f"Corte {number:02d}",
                price_per_kg=Decimal("10.00"),
            )

        self.assertContains(self.client.get(self.url), "Página")
        self.assertEqual(self.client.get(self.url, {"page": "abc"}).status_code, 200)
        self.assertEqual(self.client.get(self.url, {"page": "999"}).status_code, 200)

    def test_it_works_without_javascript(self):
        html = self.client.get(self.url).content.decode()

        for forbidden in ("<script", " style=", " onclick=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)

    def test_only_a_read_is_allowed(self):
        self.assertEqual(self.client.post(self.url).status_code, 405)
