"""Sale modes on the server (S14.4-7), with Eduardo's examples.

"$260 a $300/kg = 866.7 g"; "100 g ±5 g y un precio fijo por pieza ($20)"; the products sold only
by piece "NO aceptan gramaje ni precio"; "La mercancía no se vende por peso."
"""

from decimal import Decimal
from types import SimpleNamespace

from django.test import SimpleTestCase

from inventory import pricing, sources
from inventory.pricing import PricingError, StandardPiece

MILANESA_PIECE = StandardPiece(weight_kg=Decimal("0.100"), tolerance_kg=Decimal("0.005"))


def product(**overrides):
    fields = {
        "id": 11,
        "name": "Pierna",
        "price_per_kg": Decimal("300.00"),
        "price_unit": "kg",
        "sale_modes": ["money", "weight"],
        "stock": Decimal("10.000"),
        "stock_unit": "kg",
        "min_quantity_kg": Decimal("0"),
        **overrides,
    }
    return SimpleNamespace(**fields)


def milanesa():
    return product(
        id=12,
        name="Milanesa de res 100 g",
        price_per_kg=Decimal("20.00"),
        price_unit="piece",
        sale_modes=["pieces"],
        stock=Decimal("60"),
        stock_unit="piece",
    )


class ByPriceTests(SimpleTestCase):
    def test_260_pesos_at_300_per_kilo_are_866_point_7_grams(self):
        self.assertEqual(sources.grams_for_amount(Decimal("300"), Decimal("260")), Decimal("866.7"))

    def test_the_stock_deduction_of_260_pesos_is_rounded_to_the_gram(self):
        closed = pricing.close_price(product(), {"mode": "money", "amount": "260.00"})

        self.assertEqual(closed.total, Decimal("260.00"))
        self.assertEqual(sources.deduction_kg(closed), Decimal("0.867"))

    def test_an_amount_in_dollars_is_converted_with_the_panel_rate_first(self):
        self.assertEqual(
            sources.mxn_for_usd(Decimal("10.00"), Decimal("26.0000")), Decimal("260.00")
        )


class ByWeightTests(SimpleTestCase):
    def test_the_grams_ordered_are_deducted(self):
        closed = pricing.close_price(product(), {"mode": "weight", "grams": 850})

        self.assertEqual(sources.deduction_kg(closed), Decimal("0.850"))
        self.assertEqual(closed.total, Decimal("255.00"))

    def test_a_line_by_weight_or_by_price_carries_the_butcher_cut_legend(self):
        for line in ({"mode": "weight", "grams": 850}, {"mode": "money", "amount": "260.00"}):
            with self.subTest(line=line):
                closed = pricing.close_price(product(), line)

                self.assertEqual(sources.legend_for(closed), "sujeto al corte del carnicero")

    def test_a_fixed_piece_carries_no_cut_legend(self):
        closed = pricing.close_price(
            milanesa(), {"mode": "pieces", "quantity": 3}, standard_piece=MILANESA_PIECE
        )

        self.assertEqual(sources.legend_for(closed), "")


class ByPieceTests(SimpleTestCase):
    def test_three_milanesas_of_100_g_cost_60_and_deduct_300_g(self):
        closed = pricing.close_price(
            milanesa(), {"mode": "pieces", "quantity": 3}, standard_piece=MILANESA_PIECE
        )

        self.assertEqual(closed.source, "fixed_piece")
        self.assertEqual(closed.unit_price, Decimal("20.00"))
        self.assertEqual(closed.total, Decimal("60.00"))
        self.assertEqual(sources.deduction_kg(closed), Decimal("0.300"))

    def test_the_price_of_one_piece_rounds_half_up_like_the_sql(self):
        # 20.125 per piece: half up gives 20.13 (the SQL cast), half even 20.12.
        closed = pricing.close_price(
            milanesa(),
            {"mode": "pieces", "quantity": 1},
            price_per_kg=Decimal("20.125"),
            standard_piece=MILANESA_PIECE,
        )

        self.assertEqual(closed.unit_price, Decimal("20.13"))
        self.assertEqual(closed.total, Decimal("20.13"))

    def test_a_fixed_piece_reports_its_price_per_unit_in_price_per_kg(self):
        # Schema convention: products.price_per_kg holds the price of one `price_unit`, so for a
        # product priced per piece the field carries the price of one piece, not of a kilo.
        closed = pricing.close_price(
            milanesa(), {"mode": "pieces", "quantity": 3}, standard_piece=MILANESA_PIECE
        )

        self.assertEqual(closed.price_per_kg, closed.unit_price)
        self.assertEqual(closed.as_json()["price_per_kg"], "20.00")
        self.assertEqual(closed.as_json()["unit_price"], "20.00")

    def test_a_standard_piece_refuses_a_negative_tolerance_or_a_non_decimal(self):
        for weight, tolerance in (
            (Decimal("0.100"), Decimal("-0.005")),
            (Decimal("0"), Decimal("0.005")),
            (0.1, Decimal("0.005")),
            (Decimal("0.100"), 0.005),
            (Decimal("NaN"), Decimal("0.005")),
            (Decimal("0.100"), Decimal("Infinity")),
        ):
            with self.subTest(weight=weight, tolerance=tolerance):
                with self.assertRaises(PricingError) as caught:
                    StandardPiece(weight_kg=weight, tolerance_kg=tolerance)
                self.assertEqual(caught.exception.code, "invalid_amount")

    def test_a_weighed_piece_must_be_a_finite_decimal(self):
        for weighed in (0.1, "0.100", "٠.١٠٠", Decimal("NaN")):
            with self.subTest(weighed=weighed), self.assertRaises(PricingError) as caught:
                MILANESA_PIECE.accepts(weighed)
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_a_weighed_piece_inside_plus_minus_5_g_is_accepted(self):
        for grams in ("0.095", "0.100", "0.105"):
            with self.subTest(grams=grams):
                self.assertTrue(MILANESA_PIECE.accepts(Decimal(grams)))

    def test_a_weighed_piece_outside_plus_minus_5_g_is_not(self):
        for grams in ("0.094", "0.106"):
            with self.subTest(grams=grams):
                self.assertFalse(MILANESA_PIECE.accepts(Decimal(grams)))

    def test_a_product_sold_only_by_piece_refuses_grams_and_amount(self):
        for line in ({"mode": "weight", "grams": 500}, {"mode": "money", "amount": "100.00"}):
            with self.subTest(line=line), self.assertRaises(PricingError) as caught:
                pricing.close_price(milanesa(), line, standard_piece=MILANESA_PIECE)
            self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_a_piece_product_refuses_a_price_or_weight_sent_by_the_client(self):
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(
                milanesa(),
                {"mode": "pieces", "quantity": 1, "piece_weight_kg": "0.500"},
                standard_piece=MILANESA_PIECE,
            )

        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")


class PiecesOfAKiloProductTests(SimpleTestCase):
    def close(self, line):
        cut = product(sale_modes=["money", "weight", "pieces"])
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(cut, {"mode": "pieces", "quantity": 1, **line})
        return caught.exception

    def test_a_line_with_neither_a_size_nor_a_piece_weight_says_one_is_missing(self):
        error = self.close({})

        self.assertEqual(error.code, "invalid_items")
        self.assertEqual(error.detail, "the line names neither a size nor a piece weight")

    def test_a_line_with_both_a_size_and_a_piece_weight_says_not_both(self):
        error = self.close({"size_id": 1, "piece_weight_kg": "0.500"})

        self.assertEqual(error.code, "invalid_items")
        self.assertEqual(error.detail, "the line names a size or a piece weight, not both")


class MerchandiseTests(SimpleTestCase):
    def apron(self):
        return product(
            id=13,
            name="Delantal",
            price_per_kg=Decimal("250.00"),
            price_unit="piece",
            sale_modes=["pieces"],
            stock=Decimal("12"),
            stock_unit="piece",
        )

    def test_merchandise_is_not_sold_by_weight(self):
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(self.apron(), {"mode": "weight", "grams": 1000})

        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_merchandise_by_piece_costs_its_price_and_deducts_no_kilos(self):
        closed = pricing.close_price(self.apron(), {"mode": "pieces", "quantity": 2})

        self.assertEqual(closed.total, Decimal("500.00"))
        self.assertEqual(sources.deduction_kg(closed), Decimal("0.000"))
