"""Tests of the store's landing page (`ventas:landing`, /): index.html migrated into Django.

Anyone may open it. It shows the hero video, the categories and a selection of the real active
products with their price and unit, the family section, the FAQ, the schedule and the contact. It
never shows what the store keeps private (the cost, the inactive products).
"""

import re
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from inventory.models import Category, Product
from ventas.negocio import NEGOCIO
from ventas.tests.support import make_store

COST = "123.45"


class LandingTests(TestCase):
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
            price_per_kg=Decimal("549.00"),
            metadata={"cost_per_kg": COST, "costo": COST},
        )

    def setUp(self):
        self.url = reverse("ventas:landing")

    def html(self):
        return re.sub(r"\s+", " ", self.client.get(self.url).content.decode())

    def test_it_lives_at_the_root(self):
        self.assertEqual(self.url, "/")

    def test_an_anonymous_visitor_gets_it_inside_the_store_frame(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "ventas/tienda/landing.html")
        self.assertTemplateUsed(response, "ventas/tienda/base.html")

    def test_the_hero_keeps_a_looping_muted_video_with_both_sources_and_a_poster(self):
        html = self.html()

        self.assertRegex(
            html, r"<video[^>]*\bautoplay\b[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b"
        )
        self.assertRegex(html, r'<video[^>]*poster="/img/Videos/VideoCarniwebP01-poster\.jpg"')
        self.assertIn('src="/img/Videos/VideoCarniwebP01.webm" type="video/webm"', html)
        self.assertIn('src="/img/Videos/VideoCarniwebP01.mp4" type="video/mp4"', html)

    def test_the_hero_points_to_the_catalogue(self):
        self.assertContains(self.client.get(self.url), 'href="/productos/"')

    def test_the_categories_link_to_the_filtered_catalogue(self):
        html = self.html()

        self.assertIn(f'href="/productos/?category={self.store["meat"].pk}"', html)
        self.assertNotIn("category=" + str(Category.objects.get(slug="oculta").pk), html)

    def test_it_lists_the_active_products_with_price_and_unit(self):
        html = self.html()

        for name in ("Bistec", "Molida", "Camiseta", "Ribeye"):
            self.assertIn(name, html)
        self.assertIn("$549.00 / kg", html)
        self.assertIn("$250.00 / pieza", html)

    def test_it_never_lists_inactive_products_nor_the_cost(self):
        response = self.client.get(self.url)

        self.assertNotContains(response, "Descontinuado")
        self.assertNotContains(response, "De categoria oculta")
        self.assertNotContains(response, COST)

    def test_it_shows_at_most_eight_products(self):
        for number in range(12):
            Product.objects.create(
                category=self.store["meat"],
                name=f"Extra {number:02d}",
                price_per_kg=Decimal("10.00"),
            )

        html = self.html()

        self.assertLessEqual(html.count('data-producto="'), 8)

    def test_product_names_are_escaped(self):
        Product.objects.create(
            category=self.store["meat"],
            name="<script>alert(1)</script>",
            price_per_kg=Decimal("10.00"),
        )

        response = self.client.get(self.url)

        self.assertNotContains(response, "<script>alert(1)</script>")

    def test_the_faq_uses_native_details(self):
        html = self.html()

        self.assertIn('id="preguntas"', html)
        self.assertIn("Preguntas frecuentes", html)
        self.assertIn("<details", html)
        self.assertIn("<summary", html)

    def test_the_family_section_is_there(self):
        html = self.html()

        self.assertIn("Carnicería de familia, pieza por pieza", html)
        self.assertIn(NEGOCIO["lema"], html)

    def test_the_address_and_the_whatsapp_link_are_there(self):
        response = self.client.get(self.url)

        self.assertContains(response, "Agua Marina 110")
        self.assertContains(response, NEGOCIO["whatsapp_href"])
        self.assertContains(response, NEGOCIO["mapa_href"].replace("&", "&amp;"))

    def test_the_schedule_is_shown(self):
        html = self.html()

        self.assertIn("Lunes a sábado", html)
        self.assertIn("8:00 a 17:00", html)

    def test_the_header_and_the_footer_link_home_and_to_the_faq(self):
        html = self.html()

        self.assertRegex(html, r'<a href="/"[^>]*>Inicio</a>')
        self.assertIn('href="/#preguntas"', html)

    def test_the_brand_in_the_header_goes_home(self):
        self.assertRegex(
            self.html(), r'<a href="/" aria-label="[^"]*" class="justify-self-center">'
        )

    def test_it_loads_no_script_from_outside(self):
        html = self.html()

        self.assertNotRegex(html, r'<script[^>]+src="https?://')
        self.assertNotRegex(html, r"<script(?![^>]*\bsrc=)[^>]*>")
