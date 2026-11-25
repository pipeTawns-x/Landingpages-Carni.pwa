"""Inventory by source (S14.1-2): the entry stays on the source, sales take their grams from it.

The examples are Eduardo's, literally: "el lunes llega una pierna de puerco de 10 kg" and "3 kg a
molida y 3 kg a molida mixta".
"""

from decimal import Decimal

from django.test import SimpleTestCase, TestCase

from inventory import sources
from inventory.models import Category, Product
from inventory.sources import InventoryError

TEN_KG = Decimal("10.000")


class DeferredSplitTests(SimpleTestCase):
    def test_a_sale_of_one_kilo_of_bistec_takes_it_from_the_pierna(self):
        draw = sources.draw_stock(Decimal("1.000"), own_kg=Decimal("0"), source_kg=TEN_KG)

        self.assertEqual(draw.from_own, Decimal("0.000"))
        self.assertEqual(draw.from_source, Decimal("1.000"))
        self.assertEqual(TEN_KG - draw.from_source, Decimal("9.000"))

    def test_the_own_stock_left_by_a_cut_is_used_before_the_source(self):
        draw = sources.draw_stock(Decimal("4.000"), own_kg=Decimal("3.000"), source_kg=Decimal("4"))

        self.assertEqual(draw.from_own, Decimal("3.000"))
        self.assertEqual(draw.from_source, Decimal("1.000"))

    def test_a_sale_above_own_plus_source_is_refused_and_nothing_goes_negative(self):
        with self.assertRaises(InventoryError) as caught:
            sources.draw_stock(Decimal("10.001"), own_kg=Decimal("0"), source_kg=TEN_KG)

        self.assertEqual(caught.exception.code, "insufficient_stock")

    def test_a_product_without_a_source_takes_only_its_own_stock(self):
        with self.assertRaises(InventoryError) as caught:
            sources.draw_stock(Decimal("2.000"), own_kg=Decimal("1.000"), source_kg=None)

        self.assertEqual(caught.exception.code, "insufficient_stock")
        draw = sources.draw_stock(Decimal("1.000"), own_kg=Decimal("1.000"), source_kg=None)
        self.assertEqual((draw.from_own, draw.from_source), (Decimal("1.000"), Decimal("0.000")))

    def test_a_need_of_zero_or_less_is_refused(self):
        with self.assertRaises(InventoryError) as caught:
            sources.draw_stock(Decimal("0"), own_kg=Decimal("1"), source_kg=TEN_KG)

        self.assertEqual(caught.exception.code, "invalid_amount")


class ExplicitCutTests(SimpleTestCase):
    def test_three_kilos_to_molida_and_three_to_molida_mixta_leave_four_on_the_pierna(self):
        left = sources.cut_source(TEN_KG, {"molida": Decimal("3"), "molida mixta": Decimal("3")})

        self.assertEqual(left, Decimal("4.000"))

    def test_a_cut_above_the_source_is_refused(self):
        with self.assertRaises(InventoryError) as caught:
            sources.cut_source(TEN_KG, {"molida": Decimal("6"), "molida mixta": Decimal("5")})

        self.assertEqual(caught.exception.code, "insufficient_stock")

    def test_a_cut_with_no_outputs_or_a_non_positive_output_is_refused(self):
        for outputs in ({}, {"molida": Decimal("0")}, {"molida": Decimal("-1")}):
            with self.subTest(outputs=outputs), self.assertRaises(InventoryError) as caught:
                sources.cut_source(TEN_KG, outputs)
            self.assertEqual(caught.exception.code, "invalid_amount")


class SourceLinkTests(SimpleTestCase):
    def test_a_product_cannot_be_its_own_source(self):
        with self.assertRaises(InventoryError) as caught:
            sources.check_source_link(product_id=5, source_id=5, source_has_source=False)

        self.assertEqual(caught.exception.code, "source_cycle")

    def test_a_source_cannot_have_a_source_itself(self):
        with self.assertRaises(InventoryError) as caught:
            sources.check_source_link(product_id=5, source_id=4, source_has_source=True)

        self.assertEqual(caught.exception.code, "source_cycle")

    def test_a_plain_source_is_accepted(self):
        sources.check_source_link(product_id=5, source_id=4, source_has_source=False)


class DecimalOnlyTests(SimpleTestCase):
    """The contract says "Decimals only": a float, text or a non-finite Decimal is refused.

    Text is refused too, so a view parses the user's input with its ASCII parser first and a
    Unicode digit such as "٣" never becomes 3 here (F-47).
    """

    BAD = (1.0, "1.000", "٣", Decimal("NaN"), Decimal("Infinity"), Decimal("-Infinity"), True)

    def assert_refused(self, call):
        for bad in self.BAD:
            with self.subTest(value=bad), self.assertRaises(InventoryError) as caught:
                call(bad)
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_draw_stock(self):
        self.assert_refused(lambda v: sources.draw_stock(v, own_kg=Decimal("0"), source_kg=TEN_KG))
        self.assert_refused(lambda v: sources.draw_stock(Decimal("1"), own_kg=v, source_kg=TEN_KG))
        self.assert_refused(
            lambda v: sources.draw_stock(Decimal("1"), own_kg=Decimal("0"), source_kg=v)
        )

    def test_cut_source(self):
        self.assert_refused(lambda v: sources.cut_source(v, {"molida": Decimal("3")}))
        self.assert_refused(lambda v: sources.cut_source(TEN_KG, {"molida": v}))

    def test_apply_shrink(self):
        self.assert_refused(lambda v: sources.apply_shrink(TEN_KG, v, "trim", "recorte"))
        self.assert_refused(lambda v: sources.apply_shrink(v, Decimal("1"), "trim", "recorte"))

    def test_reconcile(self):
        def run(drop=TEN_KG, sold=Decimal("1"), shrink=Decimal("0")):
            return sources.reconcile(
                source_drop_kg=drop, sold_kg={"bistec": sold}, shrink_kg=shrink
            )

        self.assert_refused(lambda v: run(drop=v))
        self.assert_refused(lambda v: run(sold=v))
        self.assert_refused(lambda v: run(shrink=v))

    def test_count_variance(self):
        self.assert_refused(lambda v: sources.count_variance(v, TEN_KG))
        self.assert_refused(lambda v: sources.count_variance(TEN_KG, v))

    def test_amounts_and_rates(self):
        self.assert_refused(lambda v: sources.grams_for_amount(Decimal("300"), v))
        self.assert_refused(lambda v: sources.grams_for_amount(v, Decimal("260")))
        self.assert_refused(lambda v: sources.mxn_for_usd(v, Decimal("26")))
        self.assert_refused(lambda v: sources.mxn_for_usd(Decimal("10"), v))

    def test_decimals_are_still_accepted(self):
        draw = sources.draw_stock(Decimal("1"), own_kg=Decimal("0"), source_kg=TEN_KG)

        self.assertEqual(draw.from_source, Decimal("1.000"))


class SourceColumnTests(TestCase):
    def test_a_sellable_product_points_at_its_source(self):
        category = Category.objects.create(name="Cerdo", slug="cerdo-fuente")
        pierna = Product.objects.create(
            category=category, name="Pierna de puerco", price_per_kg=Decimal("150.00")
        )
        bistec = Product.objects.create(
            category=category,
            name="Bistec de pierna",
            price_per_kg=Decimal("190.00"),
            source_product=pierna,
        )

        self.assertEqual(list(pierna.sellables.all()), [bistec])
        self.assertIsNone(pierna.source_product)
