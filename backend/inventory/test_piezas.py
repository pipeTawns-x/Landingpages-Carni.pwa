"""Selling by pieces: the weight of a piece must reach the tables the store reads.

The product form keeps the cut spec in Django's own table (`CutSpec`). `quote_cart` reads
`public.product_cut_specs` and only accepts "pieces" when `products.sale_modes` lists it, so
saving a product copies the spec there and sets the modes. `load_piece_weights` gives the
catalogue the piece weights the previous cart of the store used.
"""

from decimal import Decimal
from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from inventory.models import Category, CutSpec, Product, StoreCutSpec
from panel.tests import sign_in_as_panel_admin


class SaveSyncsTheStoreTests(TestCase):
    fixtures = ["categories.json"]

    def setUp(self):
        self.category = Category.objects.first()
        sign_in_as_panel_admin(self.client)

    def post_create(self, **fields):
        data = {
            "name": "Rib Eye",
            "category": self.category.pk,
            "price_per_kg": "549.00",
            "min_quantity_kg": "0",
            "stock": "5",
            "is_active": "on",
            **fields,
        }
        self.client.post(reverse("inventory:create"), data)
        return Product.objects.get(name="Rib Eye")

    def test_a_piece_weight_enables_pieces_and_reaches_the_store_table(self):
        product = self.post_create(avg_piece_weight_kg="0.4", thickness_default_in="1.25")

        self.assertEqual(product.sale_modes, ["money", "weight", "pieces"])
        store = StoreCutSpec.objects.get(product=product)
        self.assertEqual(store.avg_piece_weight_kg, Decimal("0.400"))
        self.assertEqual(store.thickness_default_in, Decimal("1.25"))

    def test_without_a_piece_weight_it_sells_by_money_and_weight(self):
        product = self.post_create(supplier="Rancho Sur")

        self.assertEqual(product.sale_modes, ["money", "weight"])
        self.assertIsNone(StoreCutSpec.objects.get(product=product).avg_piece_weight_kg)

    def test_a_weight_of_zero_means_no_weight(self):
        product = self.post_create(avg_piece_weight_kg="0")

        self.assertEqual(product.sale_modes, ["money", "weight"])
        self.assertIsNone(StoreCutSpec.objects.get(product=product).avg_piece_weight_kg)

    def test_no_spec_at_all_leaves_the_store_table_alone(self):
        product = self.post_create()

        self.assertEqual(product.sale_modes, ["money", "weight"])
        self.assertFalse(StoreCutSpec.objects.exists())

    def test_clearing_the_weight_takes_pieces_away(self):
        product = self.post_create(avg_piece_weight_kg="0.4")
        spec = CutSpec.objects.get(product=product)
        spec.avg_piece_weight_kg = None
        spec.save()

        from inventory.services import sync_store_spec

        sync_store_spec(product)
        product.refresh_from_db()

        self.assertEqual(product.sale_modes, ["money", "weight"])
        self.assertIsNone(StoreCutSpec.objects.get(product=product).avg_piece_weight_kg)

    def test_a_product_priced_by_piece_still_sells_only_by_pieces(self):
        product = self.post_create(price_unit="piece", avg_piece_weight_kg="0.4")

        self.assertEqual(product.sale_modes, ["pieces"])


class LoadPieceWeightsTests(TestCase):
    fixtures = ["categories.json"]

    def setUp(self):
        category = Category.objects.first()
        self.products = {
            name: Product.objects.create(category=category, name=name, price_per_kg=Decimal("200"))
            for name in ("Tomahawk", "Bistec de Res", "Chuleta de Cerdo", "Alas Adobadas", "Molida")
        }

    def run_command(self):
        out = StringIO()
        call_command("load_piece_weights", stdout=out)
        return out.getvalue()

    def test_it_gives_the_weights_of_the_previous_cart_by_name_and_by_family(self):
        self.run_command()

        expected = {
            "Tomahawk": "0.800",
            "Bistec de Res": "0.120",
            "Chuleta de Cerdo": "0.220",
            "Alas Adobadas": "0.090",
        }
        for name, weight in expected.items():
            with self.subTest(name=name):
                product = Product.objects.get(name=name)
                self.assertEqual(product.spec.avg_piece_weight_kg, Decimal(weight))
                self.assertEqual(product.spec.thickness_default_in, Decimal("1.25"))
                self.assertEqual(product.sale_modes, ["money", "weight", "pieces"])
                self.assertEqual(
                    StoreCutSpec.objects.get(product=product).avg_piece_weight_kg, Decimal(weight)
                )

    def test_a_product_with_no_known_weight_is_left_as_it_was(self):
        self.run_command()

        molida = Product.objects.get(name="Molida")
        self.assertFalse(CutSpec.objects.filter(product=molida).exists())
        self.assertEqual(molida.sale_modes, ["money", "weight"])

    def test_a_weight_the_owner_already_set_is_kept(self):
        CutSpec.objects.create(
            product=self.products["Tomahawk"], avg_piece_weight_kg=Decimal("1.1")
        )

        self.run_command()

        self.assertEqual(
            CutSpec.objects.get(product=self.products["Tomahawk"]).avg_piece_weight_kg,
            Decimal("1.100"),
        )

    def test_it_says_what_it_did_and_running_it_twice_changes_nothing(self):
        first = self.run_command()
        second = self.run_command()

        self.assertIn("4 productos con peso por pieza", first)
        self.assertIn("0 productos con peso por pieza", second)
