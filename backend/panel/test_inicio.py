"""Tests for the Inicio of the panel (/panel/, panel:inicio), slice 1 of T7d.

The page keeps everything the previous home drew (ventas/inicio.html: today, pending, ticket,
margin of the last 30 days, the week and the latest orders) and adds what panel.metrics reads:
the sales of the last eight weeks, the margin of each product (cost against price) and the
products with low stock. Shrinkage and the stock per source arrive with T7b: nothing about them
is drawn yet.
"""

import datetime
import re
import uuid
from decimal import Decimal

from django.db import models
from django.test import Client
from django.urls import resolve, reverse
from django.utils import timezone

from inventory.models import Product, ProductCost
from ventas.models import PanelOrder
from ventas.tests.support import SalesTestCase


def make_order(total, days_ago=0, status="delivered"):
    created = timezone.now() - datetime.timedelta(days=days_ago)
    row = PanelOrder(
        order_id=uuid.uuid4(),
        status=status,
        channel="mostrador",
        customer_name="Cliente",
        delivery_type="pickup",
        delivery_address={},
        currency="MXN",
        total_mxn=Decimal(total),
        created_at=created,
        updated_at=created,
        lines=[],
    )
    # The mirror is read-only for Django: write it the way the database would.
    models.Model.save(row, force_insert=True)
    return row


class InicioTests(SalesTestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("panel:inicio")
        self.category = self.store["bistec"].category

    def get(self):
        return self.client.get(self.url)

    def html(self):
        return self.get().content.decode()

    def test_the_home_of_ventas_draws_it_in_place(self):
        response = self.get()

        self.assertEqual(response.status_code, 200)
        # One page, improved in place: ventas/inicio.html, no parallel template on top of it.
        self.assertTemplateUsed(response, "ventas/inicio.html")
        self.assertTemplateNotUsed(response, "panel/inicio.html")
        self.assertContains(response, "Pedidos recientes")
        self.assertContains(
            response, "<title>Inicio · Panel · Carnicería El Señor de La Misericordia</title>"
        )

    def test_the_panel_route_is_served_by_the_guarded_home_of_ventas(self):
        view = resolve(self.url).func

        self.assertEqual((view.__module__, view.__name__), ("panel.views", "inicio"))

    def test_a_post_is_answered_as_before_not_with_405(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 200)

    def test_the_low_stock_threshold_is_marked_as_provisional(self):
        section = re.search(r'aria-labelledby="stock-titulo".*?</section>', self.html(), re.DOTALL)

        self.assertIn("provisional", section.group(0))

    def test_the_weekly_chart_has_eight_bars_scaled_to_the_best_week(self):
        make_order("300.00", days_ago=0)
        make_order("150.00", days_ago=14)

        html = self.html()

        chart = re.search(r'<svg[^>]*data-chart="weekly".*?</svg>', html, flags=re.DOTALL).group(0)
        heights = [float(h) for h in re.findall(r'data-week="[^"]+"[^>]*height="([\d.]+)"', chart)]
        self.assertEqual(len(heights), 8)
        self.assertEqual(max(heights), heights[-1])
        self.assertAlmostEqual(heights[-3], heights[-1] / 2, places=1)
        self.assertIn('role="img"', chart)
        self.assertIn("aria-labelledby=", chart)

    def test_the_two_sales_charts_have_headings_that_tell_them_apart(self):
        make_order("120.00")

        html = self.html()

        self.assertIn(">Esta semana por día</h2>", html)
        self.assertIn(">Últimas 8 semanas</h2>", html)
        self.assertNotIn(">Ventas por semana</h2>", html)

    def test_the_week_labels_of_the_chart_are_readable_on_a_phone(self):
        make_order("120.00")

        chart = re.search(r'<svg[^>]*data-chart="weekly".*?</svg>', self.html(), re.DOTALL).group(0)
        sizes = [int(size) for size in re.findall(r'<text[^>]*font-size="(\d+)"', chart)]
        # The viewBox is 320 wide and the card is about 326 px on a 390 px phone: 1 unit ~ 1 px.
        self.assertEqual(len(sizes), 8)
        self.assertTrue(all(size >= 12 for size in sizes), sizes)

    def test_the_past_weeks_keep_3_to_1_against_the_card(self):
        make_order("120.00", days_ago=7)
        make_order("120.00")

        chart = re.search(r'<svg[^>]*data-chart="weekly".*?</svg>', self.html(), re.DOTALL).group(0)
        opacities = [float(value) for value in re.findall(r'fill-opacity="([\d.]+)"', chart)]
        # text-muted (#A8A29B) over surface-1 (#151517): 0.45 gives 2.43:1, 0.6 gives 3.4:1
        # (WCAG 1.4.11, non-text contrast).
        self.assertEqual(len(opacities), 7)
        self.assertTrue(all(value >= 0.6 for value in opacities), opacities)

    def test_the_weekly_numbers_are_also_a_table(self):
        make_order("300.00")

        html = self.html()

        table = re.search(r'<table[^>]*id="semanas-tabla".*?</table>', html, flags=re.DOTALL)
        self.assertIsNotNone(table)
        self.assertEqual(table.group(0).count("<tr"), 9)  # The header row and eight weeks.
        self.assertIn("$300.00", table.group(0))
        self.assertIn("<caption", table.group(0))
        self.assertIn("<thead", table.group(0))

    def test_without_sales_the_weekly_chart_says_so(self):
        self.assertContains(self.get(), "Aún no hay ventas en las últimas 8 semanas")

    def test_the_margin_of_each_product_thinnest_first_with_the_loss_marked(self):
        for name, price, cost in (("Arrachera", "400.00", "200.00"), ("Molida", "180", "200")):
            product = Product.objects.create(
                category=self.category, name=name, price_per_kg=Decimal(price)
            )
            ProductCost.objects.create(product=product, cost_per_kg=Decimal(cost))

        html = self.html()

        section = re.search(r'aria-labelledby="margen-titulo".*?</section>', html, re.DOTALL)
        text = section.group(0)
        self.assertLess(text.index("Molida"), text.index("Arrachera"))
        self.assertIn("-$20.00", text)
        self.assertIn("50.0 %", text)
        self.assertIn("Pierde", text)

    def test_without_costs_the_margin_points_to_compras(self):
        html = self.html()

        section = re.search(r'aria-labelledby="margen-titulo".*?</section>', html, re.DOTALL)
        self.assertIn("Sin costos registrados", section.group(0))
        self.assertIn(reverse("panel:compras"), section.group(0))

    def test_low_stock_lists_the_products_and_links_to_each_one(self):
        Product.objects.update(stock=Decimal("50"))
        product = Product.objects.create(
            category=self.category, name="Costilla", price_per_kg=Decimal("100"), stock=Decimal("2")
        )

        html = self.html()

        section = re.search(r'aria-labelledby="stock-titulo".*?</section>', html, re.DOTALL)
        self.assertIn("Costilla", section.group(0))
        self.assertIn("2 kg", section.group(0))
        self.assertIn(reverse("inventory:detail", args=[product.pk]), section.group(0))

    def test_with_enough_stock_it_says_so(self):
        Product.objects.update(stock=Decimal("50"))

        self.assertContains(self.get(), "Todos los productos tienen existencias suficientes")

    def test_shrinkage_and_stock_per_source_are_not_drawn_before_t7b(self):
        html = self.html()

        self.assertNotIn("Merma", html)
        self.assertNotIn("merma", html)
        self.assertNotIn("por fuente", html)

    def test_it_works_without_javascript_or_inline_styles(self):
        make_order("120.00")

        html = self.html()

        for forbidden in ("<script", "<style", " style=", " onclick=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)

    def test_names_from_the_database_are_drawn_as_text(self):
        product = Product.objects.create(
            category=self.category,
            name="<b>x</b>",
            price_per_kg=Decimal("100"),
            stock=Decimal("1"),
        )
        ProductCost.objects.create(product=product, cost_per_kg=Decimal("50"))

        html = self.html()

        self.assertNotIn("<b>x</b>", html)
        self.assertIn("&lt;b&gt;x&lt;/b&gt;", html)

    def test_an_anonymous_visitor_is_sent_to_the_access_bridge(self):
        response = Client().get(self.url)

        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)
