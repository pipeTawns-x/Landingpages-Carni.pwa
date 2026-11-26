"""Stock per product (S19.7, assumption A8): the rules of an adjustment and of a transfer.

Eduardo, 2026-11-26: "Y ya yo voy a poder modificar cuánto tengo de tal producto, cuánto tengo de
tal otro producto, cuánto voy a cambiar de este producto a otro producto." The products are real:
their names, units and stock come from supabase/seed.sql (Bistec de Res 80 kg, Diezmillo 60 kg,
Molida de Res Especial 100 kg, Gorra Bordada 40 pieces). The expected numbers are written out by
hand, never computed with the code under test.
"""

from decimal import Decimal

from django.test import SimpleTestCase

from inventory import stock
from inventory.sources import InventoryError
from inventory.stock import LedgerEntry
from inventory.stock_support import holding

REASON = "Conteo de la mañana"
WHO = "admin-1"


def refusal(call, *args, **kwargs) -> str:
    """The code of the InventoryError a call raises; fails when it raises nothing."""
    try:
        call(*args, **kwargs)
    except InventoryError as error:
        return error.code
    raise AssertionError("the call was not refused")


class AdjustmentRuleTests(SimpleTestCase):
    def setUp(self):
        self.bistec = holding(1, "Bistec de Res")  # 80 kg in seed.sql
        self.gorra = holding(2, "Gorra Bordada")  # 40 pieces in seed.sql

    def test_setting_the_count_of_bistec_to_75_records_minus_5_with_its_reason(self):
        plan = stock.plan_change(self.bistec, "set", Decimal("75"), REASON, WHO)

        (change,) = plan.changes
        self.assertEqual(
            (change.product_id, change.stock, change.delta),
            (1, Decimal("75.000"), Decimal("-5.000")),
        )
        self.assertEqual(
            plan.entries, (LedgerEntry(1, Decimal("-5.000"), "adjustment", REASON, WHO),)
        )

    def test_adding_ten_kilos_raises_the_stock_to_90_and_records_plus_10(self):
        plan = stock.plan_change(self.bistec, "add", Decimal("10"), REASON, WHO)

        self.assertEqual(plan.changes[0].stock, Decimal("90.000"))
        self.assertEqual(plan.entries[0].delta, Decimal("10.000"))

    def test_removing_two_and_a_half_kilos_lowers_the_stock_to_77_5(self):
        plan = stock.plan_change(self.bistec, "remove", Decimal("2.5"), REASON, WHO)

        self.assertEqual(plan.changes[0].stock, Decimal("77.500"))
        self.assertEqual(plan.entries[0].delta, Decimal("-2.500"))

    def test_a_count_that_matches_the_stock_changes_nothing_and_writes_no_ledger_row(self):
        plan = stock.plan_change(self.bistec, "set", Decimal("80"), REASON, WHO)

        self.assertEqual((plan.changes[0].stock, plan.changes[0].delta), (80, 0))
        self.assertEqual(plan.entries, ())

    def test_removing_everything_is_allowed_and_leaves_zero(self):
        plan = stock.plan_change(self.bistec, "remove", Decimal("80"), REASON, WHO)

        self.assertEqual(plan.changes[0].stock, Decimal("0.000"))

    def test_removing_more_than_there_is_is_refused_so_the_stock_never_goes_negative(self):
        code = refusal(stock.plan_change, self.bistec, "remove", Decimal("80.001"), REASON, WHO)

        self.assertEqual(code, "insufficient_stock")

    def test_a_negative_count_is_refused(self):
        self.assertEqual(
            refusal(stock.plan_change, self.bistec, "set", Decimal("-1"), REASON, WHO),
            "invalid_amount",
        )

    def test_adding_or_removing_nothing_is_refused(self):
        for mode in ("add", "remove"):
            with self.subTest(mode=mode):
                self.assertEqual(
                    refusal(stock.plan_change, self.bistec, mode, Decimal("0"), REASON, WHO),
                    "invalid_amount",
                )

    def test_a_count_of_zero_is_a_valid_count(self):
        plan = stock.plan_change(self.bistec, "set", Decimal("0"), REASON, WHO)

        self.assertEqual(plan.changes[0].delta, Decimal("-80.000"))

    def test_every_adjustment_needs_a_reason(self):
        for reason in ("", "   ", None, "x" * 201):
            with self.subTest(reason=reason):
                code = refusal(stock.plan_change, self.bistec, "add", Decimal("1"), reason, WHO)
                self.assertEqual(code, "reason_required")

    def test_a_reason_of_200_characters_is_accepted_and_trimmed(self):
        plan = stock.plan_change(self.bistec, "add", Decimal("1"), "  " + "x" * 200 + " ", WHO)

        self.assertEqual(plan.entries[0].note, "x" * 200)

    def test_every_adjustment_says_who_made_it(self):
        for who in ("", "  ", None, "x" * 101):
            with self.subTest(who=who):
                code = refusal(stock.plan_change, self.bistec, "add", Decimal("1"), REASON, who)
                self.assertEqual(code, "invalid_staff_ref")

    def test_pieces_are_counted_whole(self):
        self.assertEqual(
            refusal(stock.plan_change, self.gorra, "add", Decimal("1.5"), REASON, WHO),
            "invalid_amount",
        )
        plan = stock.plan_change(self.gorra, "add", Decimal("2"), REASON, WHO)
        self.assertEqual(plan.changes[0].stock, Decimal("42.000"))

    def test_a_float_text_or_non_finite_amount_is_refused(self):
        for amount in (1.5, "1.5", Decimal("NaN"), Decimal("Infinity"), None):
            with self.subTest(amount=amount):
                code = refusal(stock.plan_change, self.bistec, "add", amount, REASON, WHO)
                self.assertEqual(code, "invalid_amount")

    def test_an_unknown_mode_is_refused(self):
        self.assertEqual(
            refusal(stock.plan_change, self.bistec, "swap", Decimal("1"), REASON, WHO),
            "invalid_amount",
        )

    def test_the_stock_cannot_pass_the_limit_of_the_store(self):
        self.assertEqual(
            refusal(stock.plan_change, self.bistec, "set", Decimal("1000000.001"), REASON, WHO),
            "invalid_amount",
        )
        self.assertEqual(
            refusal(stock.plan_change, self.bistec, "add", Decimal("999920.001"), REASON, WHO),
            "invalid_amount",
        )
        plan = stock.plan_change(self.bistec, "set", Decimal("1000000"), REASON, WHO)
        self.assertEqual(plan.changes[0].stock, Decimal("1000000.000"))

    def test_the_amount_is_rounded_half_up_to_the_gram(self):
        plan = stock.plan_change(self.bistec, "add", Decimal("0.0005"), REASON, WHO)

        self.assertEqual(plan.changes[0].delta, Decimal("0.001"))


class TransferRuleTests(SimpleTestCase):
    def setUp(self):
        self.diezmillo = holding(3, "Diezmillo")  # 60 kg
        self.molida = holding(2, "Molida de Res Especial")  # 100 kg
        self.gorra = holding(9, "Gorra Bordada")  # 40 pieces
        self.hielera = holding(10, "Hielera Rígida")  # 10 pieces

    def test_three_kilos_from_diezmillo_to_molida_change_both_stocks_with_two_paired_rows(self):
        plan = stock.plan_transfer(
            self.diezmillo, self.molida, Decimal("3"), None, "Para la molida del día", WHO
        )

        source, target = plan.changes
        self.assertEqual(
            (source.product_id, source.stock, source.delta),
            (3, Decimal("57.000"), Decimal("-3.000")),
        )
        self.assertEqual(
            (target.product_id, target.stock, target.delta),
            (2, Decimal("103.000"), Decimal("3.000")),
        )
        self.assertEqual(
            plan.entries,
            (
                LedgerEntry(3, Decimal("-3.000"), "transfer", "Para la molida del día", WHO, 2),
                LedgerEntry(2, Decimal("3.000"), "transfer", "Para la molida del día", WHO, 3),
            ),
        )

    def test_moving_all_the_stock_of_the_source_is_allowed(self):
        plan = stock.plan_transfer(self.diezmillo, self.molida, Decimal("60"), None, REASON, WHO)

        self.assertEqual(plan.changes[0].stock, Decimal("0.000"))
        self.assertEqual(plan.changes[1].stock, Decimal("160.000"))

    def test_moving_more_than_the_source_has_is_refused(self):
        code = refusal(
            stock.plan_transfer, self.diezmillo, self.molida, Decimal("60.001"), None, REASON, WHO
        )

        self.assertEqual(code, "insufficient_stock")

    def test_a_product_cannot_be_moved_to_itself(self):
        code = refusal(
            stock.plan_transfer, self.diezmillo, self.diezmillo, Decimal("1"), None, REASON, WHO
        )

        self.assertEqual(code, "same_product")

    def test_kilos_to_pieces_without_an_explicit_conversion_are_refused(self):
        code = refusal(
            stock.plan_transfer, self.diezmillo, self.gorra, Decimal("3"), None, REASON, WHO
        )

        self.assertEqual(code, "unit_mismatch")

    def test_an_explicit_conversion_moves_kilos_out_and_pieces_in(self):
        plan = stock.plan_transfer(
            self.diezmillo, self.gorra, Decimal("3"), Decimal("6"), REASON, WHO
        )

        source, target = plan.changes
        self.assertEqual((source.stock, source.delta), (Decimal("57.000"), Decimal("-3.000")))
        self.assertEqual((target.stock, target.delta), (Decimal("46.000"), Decimal("6.000")))

    def test_a_conversion_into_fractional_pieces_is_refused(self):
        code = refusal(
            stock.plan_transfer,
            self.diezmillo,
            self.gorra,
            Decimal("3"),
            Decimal("2.5"),
            REASON,
            WHO,
        )

        self.assertEqual(code, "invalid_amount")

    def test_the_same_unit_moves_the_same_quantity(self):
        code = refusal(
            stock.plan_transfer,
            self.diezmillo,
            self.molida,
            Decimal("3"),
            Decimal("2"),
            REASON,
            WHO,
        )
        self.assertEqual(code, "invalid_amount")

        plan = stock.plan_transfer(
            self.diezmillo, self.molida, Decimal("3"), Decimal("3.000"), REASON, WHO
        )
        self.assertEqual(plan.changes[1].delta, Decimal("3.000"))

    def test_pieces_move_whole_between_pieces_products(self):
        code = refusal(
            stock.plan_transfer, self.gorra, self.hielera, Decimal("1.5"), None, REASON, WHO
        )
        self.assertEqual(code, "invalid_amount")

        plan = stock.plan_transfer(self.gorra, self.hielera, Decimal("5"), None, REASON, WHO)
        self.assertEqual((plan.changes[0].stock, plan.changes[1].stock), (35, 15))

    def test_a_transfer_needs_its_reason_and_who_made_it(self):
        self.assertEqual(
            refusal(stock.plan_transfer, self.diezmillo, self.molida, Decimal("1"), None, " ", WHO),
            "reason_required",
        )
        self.assertEqual(
            refusal(
                stock.plan_transfer, self.diezmillo, self.molida, Decimal("1"), None, REASON, ""
            ),
            "invalid_staff_ref",
        )

    def test_the_quantity_is_a_finite_decimal_above_zero(self):
        for amount in (Decimal("0"), Decimal("-1"), 1.5, "1", Decimal("NaN"), None):
            with self.subTest(amount=amount):
                code = refusal(
                    stock.plan_transfer, self.diezmillo, self.molida, amount, None, REASON, WHO
                )
                self.assertEqual(code, "invalid_amount")

    def test_the_target_cannot_pass_the_limit_of_the_store(self):
        full = holding(2, "Molida de Res Especial")
        full = stock.Holding(full.product_id, full.name, full.unit, Decimal("999999"))

        code = refusal(stock.plan_transfer, self.diezmillo, full, Decimal("2"), None, REASON, WHO)

        self.assertEqual(code, "invalid_amount")


class ParseQuantityTests(SimpleTestCase):
    def test_plain_ascii_numbers_with_up_to_three_decimals_are_read_exactly(self):
        for text, expected in (
            ("3", "3.000"),
            ("2.5", "2.500"),
            (" 0.001 ", "0.001"),
            ("9999999.999", "9999999.999"),
            (7, "7.000"),
            (Decimal("0.250"), "0.250"),
        ):
            with self.subTest(text=text):
                self.assertEqual(stock.parse_quantity(text), Decimal(expected))

    def test_anything_else_is_refused(self):
        for text in (
            "",
            " ",
            "-1",
            "+1",
            "1,5",
            "1e3",
            "3.1234",
            "abc",
            "٣",  # Arabic-Indic digit three: Decimal() would read it, the store would not
            "３",  # full-width digit three
            "1.",
            ".5",
            None,
            1.5,
            True,
            Decimal("NaN"),
            Decimal("Infinity"),
            Decimal("0.0005"),
        ):
            with self.subTest(text=text):
                self.assertEqual(refusal(stock.parse_quantity, text), "invalid_amount")
