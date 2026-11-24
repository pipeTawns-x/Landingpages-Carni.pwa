"""The pricing contract against the database (S13): sizes as rows, and the shared golden cases.

`ProductSize` mirrors `public.product_sizes` (supabase/migrations/20261124000001). The tests build
the rows with the ORM, hand them to the pure functions of `inventory.pricing` exactly as T9 will,
and check the JSON the panel and the store read. The last class pins the contract to the golden
cases that the SQL `quote_line`, the Django mirror and the TypeScript estimator already share
(`supabase/tests/cotizacion-casos.json`), so the two ways of pricing a line cannot drift apart.
"""

import json
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from inventory import pricing
from inventory.models import Category, Product
from inventory.pricing import PricingError
from ventas.models import ProductSize

GOLDEN = Path(__file__).resolve().parents[3] / "supabase" / "tests" / "cotizacion-casos.json"


def make_rib_eye(**overrides):
    category, _ = Category.objects.get_or_create(name="Res", slug="res")
    fields = {
        "category": category,
        "name": "Rib Eye CAB",
        "price_per_kg": Decimal("779.00"),
        "sale_modes": ["money", "weight", "pieces"],
        **overrides,
    }
    return Product.objects.create(**fields)


class ProductSizeModelTests(TestCase):
    def setUp(self):
        self.product = make_rib_eye()

    def test_a_size_defaults_to_whole_peso_rounding_and_active(self):
        size = ProductSize.objects.create(product=self.product, grams=340)

        size.refresh_from_db()

        self.assertEqual(size.rounding_step, Decimal("1.00"))
        self.assertIsInstance(size.rounding_step, Decimal)
        self.assertTrue(size.is_active)

    def test_a_product_has_one_size_of_each_weight(self):
        ProductSize.objects.create(product=self.product, grams=340)

        with self.assertRaises(IntegrityError), transaction.atomic():
            ProductSize.objects.create(product=self.product, grams=340)

    def test_two_products_may_share_a_weight(self):
        other = make_rib_eye(name="New York CAB")
        ProductSize.objects.create(product=self.product, grams=340)

        ProductSize.objects.create(product=other, grams=340)

        self.assertEqual(ProductSize.objects.filter(grams=340).count(), 2)

    def test_a_weight_outside_1_to_50000_grams_is_refused(self):
        for grams in (0, -340, 50001):
            with self.subTest(grams=grams), self.assertRaises(IntegrityError), transaction.atomic():
                ProductSize.objects.create(product=self.product, grams=grams)

    def test_a_rounding_step_outside_the_allowed_ones_is_refused(self):
        for step in ("0.25", "0", "2.00", "-1.00"):
            with self.subTest(step=step), self.assertRaises(IntegrityError), transaction.atomic():
                ProductSize.objects.create(
                    product=self.product, grams=340, rounding_step=Decimal(step)
                )

    def test_the_allowed_steps_are_cents_ten_cents_fifty_cents_and_the_peso(self):
        for grams, step in enumerate(("0.01", "0.10", "0.50", "1.00"), start=1):
            ProductSize.objects.create(
                product=self.product, grams=grams, rounding_step=Decimal(step)
            )

        self.assertEqual(ProductSize.objects.count(), 4)

    def test_a_product_priced_per_piece_cannot_have_sizes(self):
        merch = make_rib_eye(name="Camiseta", price_unit="piece")

        with self.assertRaises(ValidationError) as caught:
            ProductSize(product=merch, grams=340).full_clean()

        self.assertIn("precio por kilo", str(caught.exception))

    def test_a_product_not_sold_by_piece_cannot_have_sizes(self):
        molida = make_rib_eye(name="Molida", sale_modes=["money", "weight"])

        with self.assertRaises(ValidationError) as caught:
            ProductSize(product=molida, grams=500).full_clean()

        self.assertIn("venta por pieza", str(caught.exception))

    def test_deleting_the_product_takes_its_sizes_with_it(self):
        ProductSize.objects.create(product=self.product, grams=340)

        self.product.delete()

        self.assertEqual(ProductSize.objects.count(), 0)


class ContractWithRowsTests(TestCase):
    """The rows go straight into the pure functions: what T9 and the panel will do."""

    def setUp(self):
        self.product = make_rib_eye()
        for grams in (700, 340, 500):
            ProductSize.objects.create(product=self.product, grams=grams)

    def test_the_listing_of_the_rib_eye_sizes_is_265_390_and_545(self):
        listing = pricing.size_listing(self.product, self.product.sizes.all())

        self.assertEqual(
            [(row["grams"], row["price"]) for row in listing],
            [(340, "265.00"), (500, "390.00"), (700, "545.00")],
        )

    def test_an_order_for_two_340_g_pieces_is_closed_with_the_row_id(self):
        size = self.product.sizes.get(grams=340)

        closed = pricing.close_price(
            self.product,
            {"mode": "pieces", "size_id": size.pk, "quantity": 2},
            sizes=self.product.sizes.filter(is_active=True),
        )

        self.assertEqual(closed.total, Decimal("530.00"))
        self.assertEqual(closed.as_json()["size_id"], size.pk)

    def test_a_size_switched_off_in_the_panel_stops_being_orderable(self):
        size = self.product.sizes.get(grams=500)
        size.is_active = False
        size.save()

        with self.assertRaises(PricingError) as caught:
            pricing.close_price(
                self.product,
                {"mode": "pieces", "size_id": size.pk, "quantity": 1},
                sizes=self.product.sizes.all(),
            )
        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_raising_the_price_per_kilo_reprices_every_size_without_touching_them(self):
        self.product.price_per_kg = Decimal("800.00")
        self.product.save()

        listing = pricing.size_listing(self.product, self.product.sizes.all())

        self.assertEqual([row["price"] for row in listing], ["272.00", "400.00", "560.00"])


class GoldenCaseParityTests(TestCase):
    """The contract prices a line like the store's SQL does, on the cases both already share."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.golden = json.loads(GOLDEN.read_text(encoding="utf-8"))

    def product_for(self, key):
        spec = self.golden["productos"][key]
        return SimpleNamespace(
            id=1,
            price_per_kg=Decimal(spec["price_per_kg"]),
            price_unit=spec["price_unit"],
            sale_modes=spec["sale_modes"],
            stock=Decimal("1000"),
            stock_unit="kg",
            min_quantity_kg=Decimal("0"),
        )

    def comparable(self):
        """Money and weight in MXN that a grams-based line can express (no pounds)."""
        for case in self.golden["casos"]:
            entry = case["entrada"]
            if entry["currency"] != "MXN" or entry["mode"] not in ("money", "weight"):
                continue
            if entry["mode"] == "weight" and entry.get("unit") not in ("g", "kg"):
                continue
            if case["id"].startswith("promo-"):
                continue  # promotions pick the price per kilo; the caller passes it in
            yield case

    def line_of(self, entry):
        if entry["mode"] == "money":
            return {"mode": "money", "amount": entry["amount"]}
        factor = Decimal(1000) if entry["unit"] == "kg" else Decimal(1)
        return {"mode": "weight", "grams": str(int(Decimal(entry["amount"]) * factor))}

    def test_there_are_golden_cases_to_compare_against(self):
        self.assertGreaterEqual(len(list(self.comparable())), 4)

    def test_quantity_and_total_equal_the_ones_the_sql_gives(self):
        compared = 0
        for case in self.comparable():
            expected = case.get("esperado")
            if not isinstance(expected, dict):  # a case the store refuses carries "error"
                continue
            compared += 1
            with self.subTest(case=case["id"]):
                closed = pricing.close_price(
                    self.product_for(case["producto"]), self.line_of(case["entrada"])
                )

                self.assertEqual(closed.as_json()["weight_kg"], expected["quantity_kg"])
                self.assertEqual(closed.as_json()["total"], expected["line_total_mxn"])
        self.assertGreaterEqual(compared, 4)  # not vacuous: the file holds at least these

    def test_the_cases_the_sql_refuses_are_refused_with_the_same_code(self):
        refused = 0
        for case in self.comparable():
            code = case.get("error")
            if code is None:
                continue
            refused += 1
            with self.subTest(case=case["id"]), self.assertRaises(PricingError) as caught:
                pricing.close_price(
                    self.product_for(case["producto"]), self.line_of(case["entrada"])
                )
            self.assertEqual(caught.exception.code, code)
        self.assertGreaterEqual(refused, 3)
