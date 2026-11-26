"""Tests for panel.metrics: the read-only numbers the Inicio of the panel draws.

The orders live in the `panel_orders` mirror and the products in `products` and `product_costs`;
the tests write them the way the database would and only read them back through `metrics`.
"""

import datetime
import uuid
from decimal import Decimal

from django.db import models
from django.test import TestCase
from django.utils import timezone

from inventory.models import Product, ProductCost
from panel import metrics
from ventas.models import PanelOrder
from ventas.tests.support import make_store

TODAY = datetime.date(2026, 11, 25)  # A Wednesday.


def at(day, hour=12):
    """An aware datetime at `hour` of `day` in the time zone of the store."""
    return timezone.make_aware(datetime.datetime.combine(day, datetime.time(hour)))


def make_order(created_at, total, status="delivered"):
    row = PanelOrder(
        order_id=uuid.uuid4(),
        status=status,
        channel="mostrador",
        customer_name="Cliente",
        delivery_type="pickup",
        delivery_address={},
        currency="MXN",
        total_mxn=Decimal(total),
        created_at=created_at,
        updated_at=created_at,
        lines=[],
    )
    # The mirror is read-only for Django: write it the way the database would.
    models.Model.save(row, force_insert=True)
    return row


class WeeklySalesTests(TestCase):
    def test_eight_weeks_oldest_first_each_starting_on_monday(self):
        weeks = metrics.weekly_sales(TODAY)

        self.assertEqual(len(weeks), 8)
        self.assertEqual(weeks[-1]["start"], datetime.date(2026, 11, 23))
        self.assertEqual(weeks[0]["start"], datetime.date(2026, 10, 5))
        self.assertTrue(all(week["start"].weekday() == 0 for week in weeks))

    def test_it_adds_the_orders_of_each_week_and_leaves_out_the_cancelled(self):
        make_order(at(datetime.date(2026, 11, 23)), "100.50")
        make_order(at(datetime.date(2026, 11, 25)), "200.25", status="pending")
        make_order(at(datetime.date(2026, 11, 24)), "999.00", status="cancelled")
        make_order(at(datetime.date(2026, 11, 16)), "40.00")

        weeks = metrics.weekly_sales(TODAY)

        self.assertEqual(weeks[-1]["total"], Decimal("300.75"))
        self.assertEqual(weeks[-1]["orders"], 2)
        self.assertEqual(weeks[-2]["total"], Decimal("40.00"))
        self.assertIsInstance(weeks[-1]["total"], Decimal)

    def test_a_week_without_sales_is_zero_not_missing(self):
        weeks = metrics.weekly_sales(TODAY)

        self.assertEqual({week["total"] for week in weeks}, {Decimal("0")})

    def test_the_day_is_the_local_day_of_the_store(self):
        # 23:30 on Sunday in Mexico City is already Monday in UTC: it belongs to the old week.
        sunday_night = timezone.make_aware(datetime.datetime(2026, 11, 22, 23, 30))
        make_order(sunday_night, "50.00")

        weeks = metrics.weekly_sales(TODAY)

        self.assertEqual(weeks[-1]["total"], Decimal("0"))
        self.assertEqual(weeks[-2]["total"], Decimal("50.00"))

    def test_orders_older_than_the_window_are_not_counted(self):
        make_order(at(datetime.date(2026, 10, 4)), "70.00")

        self.assertEqual(sum(week["total"] for week in metrics.weekly_sales(TODAY)), 0)


class PriceMarginTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = make_store()["bistec"].category
        Product.objects.update(is_active=False)

    def product(self, name, price, cost=None, yield_pct="100", **fields):
        product = Product.objects.create(
            category=self.category,
            name=name,
            price_per_kg=Decimal(price),
            sale_modes=["money", "weight"],
            **fields,
        )
        if cost is not None:
            ProductCost.objects.create(
                product=product, cost_per_kg=Decimal(cost), yield_pct=Decimal(yield_pct)
            )
        return product

    def test_the_margin_is_price_minus_cost_per_sellable_kilo(self):
        # 200 $/kg bought at 80 % yield is 250 $ per kilo that can be sold.
        self.product("Arrachera", "400.00", cost="200.00", yield_pct="80")

        (row,) = metrics.price_margins()

        self.assertEqual(row["name"], "Arrachera")
        self.assertEqual(row["cost_per_kg"], Decimal("250.00"))
        self.assertEqual(row["margin_mxn"], Decimal("150.00"))
        self.assertEqual(row["margin_pct"], Decimal("37.5"))

    def test_the_thinnest_margin_comes_first_and_a_loss_is_negative(self):
        self.product("Bistec de res", "220.00", cost="150.00")
        self.product("Molida", "180.00", cost="200.00")

        rows = metrics.price_margins()

        self.assertEqual([row["name"] for row in rows], ["Molida", "Bistec de res"])
        self.assertEqual(rows[0]["margin_mxn"], Decimal("-20.00"))
        self.assertTrue(rows[0]["is_loss"])
        self.assertFalse(rows[1]["is_loss"])

    def test_a_product_without_cost_or_inactive_is_left_out(self):
        self.product("Sin costo", "100.00")
        self.product("Inactivo", "100.00", cost="50.00", is_active=False)

        self.assertEqual(metrics.price_margins(), [])

    def test_it_counts_the_products_without_a_cost(self):
        self.product("Sin costo", "100.00")
        self.product("Con costo", "100.00", cost="50.00")

        self.assertEqual(metrics.products_without_cost(), 1)


class LowStockTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = make_store()["bistec"].category
        Product.objects.update(is_active=False)

    def product(self, name, stock, **fields):
        return Product.objects.create(
            category=self.category,
            name=name,
            price_per_kg=Decimal("100.00"),
            stock=Decimal(stock),
            sale_modes=["money", "weight"],
            **fields,
        )

    def test_products_at_or_below_the_threshold_lowest_first(self):
        self.product("Chuleta", "5")
        self.product("Costilla", "1.5")
        self.product("Suficiente", "5.001")

        rows = metrics.low_stock()

        self.assertEqual([row["name"] for row in rows], ["Costilla", "Chuleta"])
        self.assertEqual(rows[0]["stock"], "1.5")
        self.assertEqual(rows[0]["unit"], "kg")

    def test_an_empty_product_is_flagged_as_out(self):
        self.product("Agotado", "0")

        (row,) = metrics.low_stock()

        self.assertTrue(row["is_out"])

    def test_inactive_products_are_not_listed(self):
        self.product("Inactivo", "0", is_active=False)

        self.assertEqual(metrics.low_stock(), [])
