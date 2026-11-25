"""Daily reconciliation, shrink and the weekly count (S14.3).

Eduardo: "Conciliación diaria en el panel: lo vendido por producto en el día contra lo que bajó cada
fuente ... Más un conteo físico semanal con ajuste, motivo y merma." The 2 % and 5 % thresholds are
the investigator's suggestion (L25), configurable, and an assumption of the contract.
"""

from decimal import Decimal

from django.test import SimpleTestCase

from inventory import sources
from inventory.sources import InventoryError


class ReconciliationTests(SimpleTestCase):
    def test_sales_and_shrink_explain_the_drop_of_the_pierna(self):
        row = sources.reconcile(
            source_drop_kg=Decimal("6.200"),
            sold_kg={
                "Bistec": Decimal("1.000"),
                "Molida": Decimal("3.000"),
                "Milanesa": Decimal("2"),
            },
            shrink_kg=Decimal("0.200"),
        )

        self.assertEqual(row.sold_kg, Decimal("6.000"))
        self.assertEqual(row.difference_kg, Decimal("0.000"))
        self.assertEqual(row.shrink_pct, Decimal("3.23"))

    def test_an_unexplained_drop_shows_as_a_difference(self):
        row = sources.reconcile(
            source_drop_kg=Decimal("5.000"),
            sold_kg={"Bistec": Decimal("4.500")},
            shrink_kg=Decimal("0"),
        )

        self.assertEqual(row.difference_kg, Decimal("0.500"))
        self.assertEqual(row.shrink_pct, Decimal("0.00"))

    def test_a_day_without_movement_is_all_zero(self):
        row = sources.reconcile(source_drop_kg=Decimal("0"), sold_kg={}, shrink_kg=Decimal("0"))

        self.assertEqual((row.sold_kg, row.difference_kg, row.shrink_pct), (0, 0, 0))


class ShrinkTests(SimpleTestCase):
    def test_trim_drying_and_expiry_lower_the_stock_with_a_note(self):
        for kind in ("trim", "drying", "expiry"):
            with self.subTest(kind=kind):
                left = sources.apply_shrink(Decimal("4.000"), Decimal("0.250"), kind, "oreo 24 h")
                self.assertEqual(left, Decimal("3.750"))

    def test_an_unknown_kind_is_refused(self):
        with self.assertRaises(InventoryError) as caught:
            sources.apply_shrink(Decimal("4"), Decimal("0.250"), "stolen", "note")

        self.assertEqual(caught.exception.code, "invalid_shrink_kind")

    def test_shrink_always_needs_a_note(self):
        with self.assertRaises(InventoryError) as caught:
            sources.apply_shrink(Decimal("4"), Decimal("0.250"), "trim", "  ")

        self.assertEqual(caught.exception.code, "note_required")

    def test_shrink_never_leaves_the_stock_below_zero(self):
        with self.assertRaises(InventoryError) as caught:
            sources.apply_shrink(Decimal("0.100"), Decimal("0.250"), "expiry", "caducó")

        self.assertEqual(caught.exception.code, "insufficient_stock")


class WeeklyCountTests(SimpleTestCase):
    def test_a_count_within_two_percent_raises_no_alert(self):
        result = sources.count_variance(Decimal("10.000"), Decimal("9.850"))

        self.assertEqual(result.variance_qty, Decimal("-0.150"))
        self.assertEqual(result.variance_pct, Decimal("-1.50"))
        self.assertFalse(result.alert)
        self.assertFalse(result.note_required)

    def test_above_two_percent_alerts_and_above_five_needs_a_note(self):
        three = sources.count_variance(Decimal("10.000"), Decimal("9.700"))
        six = sources.count_variance(Decimal("10.000"), Decimal("9.400"))

        self.assertEqual((three.alert, three.note_required), (True, False))
        self.assertEqual((six.alert, six.note_required), (True, True))

    def test_the_thresholds_are_configurable(self):
        result = sources.count_variance(
            Decimal("10"), Decimal("9.7"), alert_pct=Decimal("5"), note_required_pct=Decimal("10")
        )

        self.assertFalse(result.alert)

    def test_a_count_above_the_note_threshold_without_a_note_is_refused(self):
        result = sources.count_variance(Decimal("10.000"), Decimal("9.400"))

        with self.assertRaises(InventoryError) as caught:
            sources.check_count_note(result, "")
        self.assertEqual(caught.exception.code, "note_required")
        sources.check_count_note(result, "merma no explicada")

    def test_a_count_of_a_product_with_no_system_stock_has_no_percentage(self):
        result = sources.count_variance(Decimal("0"), Decimal("1.000"))

        self.assertIsNone(result.variance_pct)
        self.assertTrue(result.alert)
        self.assertTrue(result.note_required)

    def test_a_negative_count_is_refused(self):
        with self.assertRaises(InventoryError) as caught:
            sources.count_variance(Decimal("1"), Decimal("-0.001"))

        self.assertEqual(caught.exception.code, "invalid_amount")
