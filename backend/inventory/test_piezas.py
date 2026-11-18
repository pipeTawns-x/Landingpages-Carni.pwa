"""Selling by pieces: the owner says it, product by product, in the panel.

The product form has a "Se vende por pieza" switch next to the weight of a piece and the
thickness range (Eduardo, 2026-11-18: "no asumas"): a weight alone does not make a product sell
by pieces, and nothing fills the weights in for him. The form keeps the cut spec in Django's own
table (`CutSpec`); `quote_cart` reads `public.product_cut_specs` and only accepts "pieces" when
`products.sale_modes` lists it, so saving a product copies the spec there and sets the modes.
"""

from decimal import Decimal

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

    def test_the_switch_and_a_piece_weight_enable_pieces_and_reach_the_store_table(self):
        product = self.post_create(
            sells_by_piece="on", avg_piece_weight_kg="0.4", thickness_default_in="1.25"
        )

        self.assertEqual(product.sale_modes, ["money", "weight", "pieces"])
        store = StoreCutSpec.objects.get(product=product)
        self.assertEqual(store.avg_piece_weight_kg, Decimal("0.400"))
        self.assertEqual(store.thickness_default_in, Decimal("1.25"))

    def test_a_piece_weight_without_the_switch_does_not_sell_by_pieces(self):
        product = self.post_create(avg_piece_weight_kg="0.4")

        self.assertEqual(product.sale_modes, ["money", "weight"])
        self.assertEqual(
            StoreCutSpec.objects.get(product=product).avg_piece_weight_kg, Decimal("0.400")
        )

    def test_the_switch_without_a_piece_weight_is_refused(self):
        response = self.client.post(
            reverse("inventory:create"),
            {
                "name": "Rib Eye",
                "category": self.category.pk,
                "price_per_kg": "549.00",
                "min_quantity_kg": "0",
                "stock": "5",
                "is_active": "on",
                "sells_by_piece": "on",
            },
        )

        self.assertContains(response, "Para venderlo por pieza escribe cuánto pesa una pieza.")
        self.assertFalse(Product.objects.filter(name="Rib Eye").exists())

    def test_switching_it_off_in_the_edit_takes_pieces_away_and_keeps_the_weight(self):
        product = self.post_create(sells_by_piece="on", avg_piece_weight_kg="0.4")
        data = {
            "name": "Rib Eye",
            "category": self.category.pk,
            "price_per_kg": "549.00",
            "min_quantity_kg": "0",
            "stock": "5",
            "is_active": "on",
            "avg_piece_weight_kg": "0.4",
        }

        self.client.post(reverse("inventory:update", args=[product.pk]), data)
        product.refresh_from_db()

        self.assertEqual(product.sale_modes, ["money", "weight"])
        self.assertEqual(CutSpec.objects.get(product=product).avg_piece_weight_kg, Decimal("0.4"))

    def test_the_edit_form_shows_the_switch_as_it_is(self):
        product = self.post_create(sells_by_piece="on", avg_piece_weight_kg="0.4")

        html = self.client.get(reverse("inventory:update", args=[product.pk])).content.decode()

        self.assertRegex(html, r'<input [^>]*name="sells_by_piece"[^>]*checked')
        self.assertIn("Se vende por pieza", html)

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
        product = self.post_create(sells_by_piece="on", avg_piece_weight_kg="0.4")
        spec = CutSpec.objects.get(product=product)
        spec.avg_piece_weight_kg = None
        spec.save()

        from inventory.services import sync_store_spec

        sync_store_spec(product)
        product.refresh_from_db()

        self.assertEqual(product.sale_modes, ["money", "weight"])
        self.assertIsNone(StoreCutSpec.objects.get(product=product).avg_piece_weight_kg)

    def test_a_product_priced_by_piece_still_sells_only_by_pieces(self):
        product = self.post_create(
            price_unit="piece", sells_by_piece="on", avg_piece_weight_kg="0.4"
        )

        self.assertEqual(product.sale_modes, ["pieces"])


class NoAssumedWeightsTests(TestCase):
    def test_the_command_that_filled_in_weights_is_gone(self):
        from django.core.management import get_commands

        self.assertNotIn("load_piece_weights", get_commands())
