"""Standard prices (S13): what a line costs the moment it is ordered, in the three ways to order.

Eduardo, 2026-11-23: "se estandarizan precios por piezas y gramaje: una pieza de tal gramaje
cuesta tanto. Eso es el pedido por pieza; de ahí el pedido por precio; por peso".

The functions under test are pure: they take Decimals and plain objects, never the database, and
they never read a price or a total from the client. The numbers of the size tests are the public
ones of Grill House (Engram #3277): Rib Eye CAB at $779/kg sold in 340, 500 and 700 g.
"""

import json
from decimal import Decimal
from types import SimpleNamespace

from django.test import SimpleTestCase

from inventory import pricing
from inventory.models import Product
from inventory.pricing import PieceVariant, PricingError

RIB_EYE_PER_KG = Decimal("779.00")


def kg_product(price_per_kg="779.00", **overrides):
    """A product priced per kilo that sells by money, by weight and by piece."""
    fields = {
        "id": 7,
        "price_per_kg": Decimal(price_per_kg),
        "price_unit": "kg",
        "sale_modes": ["money", "weight", "pieces"],
        "stock": Decimal("50.000"),
        "stock_unit": "kg",
        "min_quantity_kg": Decimal("0"),
        **overrides,
    }
    return SimpleNamespace(**fields)


def a_size(pk, grams, product_id=7, **overrides):
    """One standard size row; `product_id` 7 is the id of `kg_product()`."""
    fields = {
        "id": pk,
        "product_id": product_id,
        "grams": grams,
        "rounding_step": Decimal("1.00"),
        "is_active": True,
        **overrides,
    }
    return SimpleNamespace(**fields)


def standard_sizes():
    """The three sizes of the example, whole-peso rounding (the default)."""
    return [a_size(1, 340), a_size(2, 500), a_size(3, 700)]


def sizes_with_one_of_another_product():
    """The example sizes plus a 250 g one (id 9) that belongs to product 8, not to product 7."""
    return [*standard_sizes(), a_size(9, 250, product_id=8)]


class RoundMoneyTests(SimpleTestCase):
    def test_cents_round_half_up(self):
        self.assertEqual(pricing.round_money(Decimal("0.005")), Decimal("0.01"))
        self.assertEqual(pricing.round_money(Decimal("2.674")), Decimal("2.67"))

    def test_a_whole_peso_step_rounds_half_up_to_the_peso(self):
        step = Decimal("1.00")
        self.assertEqual(pricing.round_money(Decimal("264.86"), step), Decimal("265.00"))
        self.assertEqual(pricing.round_money(Decimal("389.50"), step), Decimal("390.00"))
        self.assertEqual(pricing.round_money(Decimal("545.30"), step), Decimal("545.00"))

    def test_a_fifty_cent_step_rounds_to_the_nearest_half_peso(self):
        step = Decimal("0.50")
        self.assertEqual(pricing.round_money(Decimal("264.70"), step), Decimal("264.50"))
        self.assertEqual(pricing.round_money(Decimal("264.75"), step), Decimal("265.00"))

    def test_the_result_is_a_decimal_with_two_places(self):
        result = pricing.round_money(Decimal("265"), Decimal("1.00"))
        self.assertIsInstance(result, Decimal)
        self.assertEqual(result.as_tuple().exponent, -2)


class SizePriceTests(SimpleTestCase):
    def test_rib_eye_cab_at_779_a_kilo_costs_265_390_and_545(self):
        prices = [pricing.size_price(RIB_EYE_PER_KG, grams) for grams in (340, 500, 700)]

        self.assertEqual(prices, [Decimal("265.00"), Decimal("390.00"), Decimal("545.00")])

    def test_with_a_cents_step_the_same_sizes_are_not_the_published_prices(self):
        # The brief asks for "cents, half up" and for $265, $390 and $545 at once. They cannot both
        # hold: 340 g x $779 is $264.86. The step is the setting that picks one (default: 1 peso).
        cents = Decimal("0.01")
        prices = [pricing.size_price(RIB_EYE_PER_KG, g, cents) for g in (340, 500, 700)]

        self.assertEqual(prices, [Decimal("264.86"), Decimal("389.50"), Decimal("545.30")])

    def test_a_size_that_is_not_a_positive_whole_number_of_grams_is_refused(self):
        for grams in (0, -340, 340.5, True, "340", None):
            with self.subTest(grams=grams), self.assertRaises(PricingError) as caught:
                pricing.size_price(RIB_EYE_PER_KG, grams)
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_a_price_per_kilo_that_is_not_positive_is_refused(self):
        for price in (Decimal("0"), Decimal("-1"), Decimal("NaN")):
            with self.subTest(price=price), self.assertRaises(PricingError) as caught:
                pricing.size_price(price, 340)
            self.assertEqual(caught.exception.code, "invalid_amount")


class PiecePriceTests(SimpleTestCase):
    """`piece_price` moved here from `panel.views_compras`; its contract did not change."""

    def test_it_is_the_function_the_purchases_page_uses(self):
        from panel import views_compras

        self.assertIs(views_compras.piece_price, pricing.piece_price)

    def test_a_piece_costs_its_weight_times_the_price_per_kilo(self):
        chicken = Product(price_per_kg=Decimal("75.00"))

        self.assertEqual(pricing.piece_price(chicken, Decimal("1.5")), Decimal("112.50"))
        self.assertEqual(pricing.piece_price(chicken, Decimal("2.5")), Decimal("187.50"))

    def test_whole_pieces_with_their_real_weight_lipon_7_7_3_and_7_6_kg(self):
        lipon = Product(price_per_kg=Decimal("185.00"))

        prices = [pricing.piece_price(lipon, kg) for kg in ("7.0", "7.3", "7.6")]

        self.assertEqual(prices, [Decimal("1295.00"), Decimal("1350.50"), Decimal("1406.00")])

    def test_the_price_is_rounded_half_up_to_the_cent(self):
        self.assertEqual(
            pricing.piece_price(Product(price_per_kg=Decimal("5.00")), Decimal("0.001")),
            Decimal("0.01"),
        )


class ClosePriceByPieceTests(SimpleTestCase):
    def close(self, line, **extra):
        return pricing.close_price(kg_product(), line, sizes=standard_sizes(), **extra)

    def test_two_pieces_of_340_g_cost_what_two_standard_pieces_cost(self):
        closed = self.close({"mode": "pieces", "size_id": 1, "quantity": 2})

        self.assertEqual(
            closed.as_json(),
            {
                "product_id": 7,
                "mode": "pieces",
                "source": "standard_size",
                "size_id": 1,
                "quantity": 2,
                "unit_price": "265.00",
                "price_per_kg": "779.00",
                "weight_kg": "0.680",
                "total": "530.00",
                "currency": "MXN",
                "warnings": [],
            },
        )

    def test_the_total_is_the_rounded_piece_price_times_the_quantity(self):
        # 3 x 500 g unrounded is $1,168.50; three pieces that cost $390 each are $1,170.00.
        closed = self.close({"mode": "pieces", "size_id": 2, "quantity": 3})

        self.assertEqual(closed.total, Decimal("1170.00"))

    def test_a_size_that_is_not_offered_is_refused(self):
        sizes = standard_sizes()
        sizes[0].is_active = False
        for size_id in (1, 99):
            with self.subTest(size_id=size_id), self.assertRaises(PricingError) as caught:
                pricing.close_price(
                    kg_product(),
                    {"mode": "pieces", "size_id": size_id, "quantity": 1},
                    sizes=sizes,
                )
            self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_a_size_of_another_product_is_not_offered_even_if_the_caller_passes_it(self):
        # F-30: the function does not trust the caller to hand over only `product.sizes`.
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(
                kg_product(),
                {"mode": "pieces", "size_id": 9, "quantity": 1},
                sizes=sizes_with_one_of_another_product(),
            )

        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_a_whole_piece_costs_its_real_weight_times_the_price_per_kilo(self):
        lipon = kg_product(price_per_kg="185.00")
        variants = [PieceVariant(Decimal(w), 4) for w in ("7.000", "7.300", "7.600")]

        closed = pricing.close_price(
            lipon,
            {"mode": "pieces", "piece_weight_kg": "7.3", "quantity": 1},
            whole_pieces=variants,
        )

        self.assertEqual(closed.as_json()["source"], "whole_piece")
        self.assertEqual(closed.as_json()["total"], "1350.50")
        self.assertEqual(closed.as_json()["weight_kg"], "7.300")
        self.assertIsNone(closed.as_json()["size_id"])

    def test_asking_for_more_whole_pieces_than_there_are_only_warns(self):
        variants = [PieceVariant(Decimal("7.300"), 2)]

        closed = pricing.close_price(
            kg_product(price_per_kg="185.00"),
            {"mode": "pieces", "piece_weight_kg": "7.300", "quantity": 3},
            whole_pieces=variants,
        )

        self.assertEqual(closed.warnings, ["low_stock"])

    def test_a_weight_nobody_holds_is_refused(self):
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(
                kg_product(price_per_kg="185.00"),
                {"mode": "pieces", "piece_weight_kg": "7.4", "quantity": 1},
                whole_pieces=[PieceVariant(Decimal("7.300"), 2)],
            )
        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_the_quantity_is_a_whole_number_from_1_to_10000(self):
        for quantity in (0, -1, "2.5", 2.5, 10001, True, None):
            with self.subTest(quantity=quantity), self.assertRaises(PricingError) as caught:
                self.close({"mode": "pieces", "size_id": 1, "quantity": quantity})
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_exactly_one_of_size_or_piece_weight_is_needed(self):
        for line in (
            {"mode": "pieces", "quantity": 1},
            {"mode": "pieces", "quantity": 1, "size_id": 1, "piece_weight_kg": "7.3"},
        ):
            with self.subTest(line=line), self.assertRaises(PricingError) as caught:
                self.close(line, whole_pieces=[PieceVariant(Decimal("7.300"), 2)])
            self.assertEqual(caught.exception.code, "invalid_items")

    def test_a_product_that_is_not_sold_by_piece_refuses_the_mode(self):
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(
                kg_product(sale_modes=["money", "weight"]),
                {"mode": "pieces", "size_id": 1, "quantity": 1},
                sizes=standard_sizes(),
            )
        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_a_product_priced_per_piece_is_left_to_the_stores_own_quote(self):
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(
                kg_product(price_unit="piece", sale_modes=["pieces"]),
                {"mode": "pieces", "size_id": 1, "quantity": 1},
                sizes=standard_sizes(),
            )
        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_ordering_more_kilos_than_the_stock_warns(self):
        closed = pricing.close_price(
            kg_product(stock=Decimal("1.000")),
            {"mode": "pieces", "size_id": 3, "quantity": 2},
            sizes=standard_sizes(),
        )

        self.assertEqual(closed.warnings, ["low_stock"])


class ClosePriceByMoneyTests(SimpleTestCase):
    """By price: the customer fixes the amount and the butcher cuts the weight it buys."""

    def close(self, amount, **product_overrides):
        return pricing.close_price(
            kg_product(**product_overrides), {"mode": "money", "amount": amount}
        )

    def test_the_customer_pays_the_amount_and_the_weight_is_what_it_buys(self):
        closed = self.close("200.00")

        self.assertEqual(
            closed.as_json(),
            {
                "product_id": 7,
                "mode": "money",
                "source": "amount",
                "size_id": None,
                "quantity": None,
                "unit_price": None,
                "price_per_kg": "779.00",
                "weight_kg": "0.257",
                "total": "200.00",
                "currency": "MXN",
                "warnings": [],
            },
        )

    def test_an_amount_that_buys_less_than_a_gram_is_refused(self):
        with self.assertRaises(PricingError) as caught:
            self.close("0.01")
        self.assertEqual(caught.exception.code, "invalid_amount")

    def test_amounts_that_are_not_money_are_refused(self):
        bad = ("0", "-5", "NaN", "Infinity", "1E+9999", "10.005", "1000000.01", "", "abc")
        for amount in (*bad, 12.5, True):
            with self.subTest(amount=amount), self.assertRaises(PricingError) as caught:
                self.close(amount)
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_a_whole_number_amount_is_accepted_as_an_integer_or_as_text(self):
        self.assertEqual(self.close(200).total, Decimal("200.00"))
        self.assertEqual(self.close("200").total, Decimal("200.00"))

    def test_a_product_that_is_not_sold_by_money_refuses_the_mode(self):
        with self.assertRaises(PricingError) as caught:
            self.close("100.00", sale_modes=["weight"])
        self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_buying_less_than_the_minimum_warns(self):
        closed = self.close("50.00", min_quantity_kg=Decimal("0.250"))

        self.assertEqual(closed.warnings, ["below_minimum_quantity"])


class ClosePriceByWeightTests(SimpleTestCase):
    """By weight: the grams ordered, at the price per kilo."""

    def close(self, grams, **product_overrides):
        return pricing.close_price(
            kg_product(**product_overrides), {"mode": "weight", "grams": grams}
        )

    def test_850_g_cost_850_thousandths_of_the_price_per_kilo(self):
        closed = self.close(850)

        self.assertEqual(closed.as_json()["total"], "662.15")
        self.assertEqual(closed.as_json()["weight_kg"], "0.850")
        self.assertEqual(closed.as_json()["source"], "weight")
        self.assertIsNone(closed.as_json()["quantity"])

    def test_the_total_is_rounded_half_up_to_the_cent(self):
        self.assertEqual(self.close(1).total, Decimal("0.78"))  # 0.779
        self.assertEqual(self.close(333).total, Decimal("259.41"))  # 259.407

    def test_grams_may_arrive_as_text_of_digits(self):
        self.assertEqual(self.close("850").total, Decimal("662.15"))

    def test_grams_that_are_not_a_whole_positive_number_up_to_1000_kg_are_refused(self):
        for grams in (0, -1, 1.5, "1.5", "abc", None, True, 1_000_001):
            with self.subTest(grams=grams), self.assertRaises(PricingError) as caught:
                self.close(grams)
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_buying_less_than_the_minimum_warns(self):
        closed = self.close(100, min_quantity_kg=Decimal("0.250"))

        self.assertEqual(closed.warnings, ["below_minimum_quantity"])

    def test_the_price_per_kilo_can_be_the_one_with_a_promotion_applied(self):
        closed = pricing.close_price(
            kg_product(), {"mode": "weight", "grams": 1000}, price_per_kg=Decimal("700.00")
        )

        self.assertEqual(closed.total, Decimal("700.00"))
        self.assertEqual(closed.as_json()["price_per_kg"], "700.00")


class ServerSidePriceTests(SimpleTestCase):
    """The server decides the price: nothing in the request can be one."""

    def test_a_line_that_carries_a_price_or_a_total_is_refused(self):
        for forbidden in ("total", "unit_price", "price_per_kg", "price", "subtotal", "currency"):
            line = {"mode": "weight", "grams": 500, forbidden: "1.00"}
            with self.subTest(field=forbidden), self.assertRaises(PricingError) as caught:
                pricing.close_price(kg_product(), line)
            self.assertEqual(caught.exception.code, "invalid_items")

    def test_a_line_of_another_product_is_refused(self):
        with self.assertRaises(PricingError) as caught:
            pricing.close_price(kg_product(), {"mode": "weight", "grams": 500, "product_id": 8})
        self.assertEqual(caught.exception.code, "invalid_items")

    def test_the_product_id_of_the_same_product_is_allowed(self):
        closed = pricing.close_price(
            kg_product(), {"mode": "weight", "grams": 500, "product_id": 7}
        )

        self.assertEqual(closed.total, Decimal("389.50"))

    def test_an_unknown_mode_is_refused(self):
        for mode in ("preauth", "", None, 3):
            with self.subTest(mode=mode), self.assertRaises(PricingError) as caught:
                pricing.close_price(kg_product(), {"mode": mode, "grams": 500})
            self.assertEqual(caught.exception.code, "sale_mode_not_allowed")

    def test_a_line_that_is_not_an_object_is_refused(self):
        for line in (None, [], "weight", 5):
            with self.subTest(line=line), self.assertRaises(PricingError) as caught:
                pricing.close_price(kg_product(), line)
            self.assertEqual(caught.exception.code, "invalid_items")

    def test_digits_that_are_not_plain_ascii_are_refused(self):
        # F-29: `\d` also matches Arabic-Indic and full-width digits, and `int()` and `Decimal()`
        # read them as numbers; the contract says plain digits, as the SQL `quote_line` does.
        scripts = {
            "arabic-indic": ("٥٠٠", "٢٠٠.٥٠", "٥", "٧.٣"),
            "full-width": ("５００", "２００.５０", "５", "７.３"),
        }
        for script, (grams, amount, quantity, weight) in scripts.items():
            lines = {
                "grams": {"mode": "weight", "grams": grams},
                "amount": {"mode": "money", "amount": amount},
                "quantity": {"mode": "pieces", "size_id": 1, "quantity": quantity},
                "piece_weight_kg": {"mode": "pieces", "piece_weight_kg": weight, "quantity": 1},
            }
            for field, line in lines.items():
                with self.subTest(script=script, field=field), self.assertRaises(PricingError) as c:
                    pricing.close_price(
                        kg_product(),
                        line,
                        sizes=standard_sizes(),
                        whole_pieces=[PieceVariant(Decimal("7.300"), 4)],
                    )
                self.assertEqual(c.exception.code, "invalid_amount")

    def test_the_same_numbers_in_plain_digits_are_accepted(self):
        # Control for the test above: only the script of the digits changes.
        lines = (
            {"mode": "weight", "grams": "500"},
            {"mode": "money", "amount": "200.50"},
            {"mode": "pieces", "size_id": 1, "quantity": "5"},
            {"mode": "pieces", "piece_weight_kg": "7.3", "quantity": 1},
        )
        for line in lines:
            with self.subTest(line=line):
                closed = pricing.close_price(
                    kg_product(),
                    line,
                    sizes=standard_sizes(),
                    whole_pieces=[PieceVariant(Decimal("7.300"), 4)],
                )
                self.assertGreater(closed.total, 0)

    def test_the_price_per_kilo_override_must_be_a_positive_decimal(self):
        for price in (Decimal("0"), Decimal("-5"), 700.0, "700"):
            with self.subTest(price=price), self.assertRaises(PricingError) as caught:
                pricing.close_price(
                    kg_product(), {"mode": "weight", "grams": 500}, price_per_kg=price
                )
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_the_json_carries_money_as_text_and_no_float_anywhere(self):
        lines = (
            {"mode": "money", "amount": "200.00"},
            {"mode": "weight", "grams": 850},
            {"mode": "pieces", "size_id": 1, "quantity": 2},
        )
        for line in lines:
            with self.subTest(mode=line["mode"]):
                payload = pricing.close_price(kg_product(), line, sizes=standard_sizes()).as_json()

                self.assertEqual(json.loads(json.dumps(payload)), payload)
                for key in ("price_per_kg", "weight_kg", "total"):
                    self.assertIsInstance(payload[key], str)
                self.assertFalse([v for v in payload.values() if isinstance(v, float)])


class OrderTotalTests(SimpleTestCase):
    def test_the_total_is_the_lines_plus_the_delivery_fee(self):
        lines = [
            pricing.close_price(kg_product(), {"mode": "weight", "grams": 850}),
            pricing.close_price(
                kg_product(),
                {"mode": "pieces", "size_id": 1, "quantity": 2},
                sizes=standard_sizes(),
            ),
        ]

        self.assertEqual(pricing.order_total(lines, Decimal("90.00")), Decimal("1282.15"))

    def test_a_pickup_order_has_no_delivery_fee(self):
        lines = [pricing.close_price(kg_product(), {"mode": "money", "amount": "200"})]

        self.assertEqual(pricing.order_total(lines, None), Decimal("200.00"))

    def test_a_negative_fee_or_an_empty_order_is_refused(self):
        line = pricing.close_price(kg_product(), {"mode": "money", "amount": "200"})
        for lines, fee in (([line], Decimal("-1")), ([], Decimal("50.00"))):
            with self.subTest(fee=fee), self.assertRaises(PricingError) as caught:
                pricing.order_total(lines, fee)
            self.assertEqual(caught.exception.code, "invalid_items")


class SizeListingTests(SimpleTestCase):
    """What the panel and the store show: the standard sizes of a product with their price."""

    def test_the_active_sizes_are_listed_by_weight_with_their_price(self):
        sizes = list(reversed(standard_sizes()))
        sizes[1].is_active = False  # the 500 g one

        listing = pricing.size_listing(kg_product(), sizes)

        self.assertEqual(
            listing,
            [
                {"id": 1, "grams": 340, "weight_kg": "0.340", "price": "265.00"},
                {"id": 3, "grams": 700, "weight_kg": "0.700", "price": "545.00"},
            ],
        )

    def test_the_sizes_of_another_product_are_not_listed(self):
        listing = pricing.size_listing(kg_product(), sizes_with_one_of_another_product())

        self.assertEqual([row["id"] for row in listing], [1, 2, 3])

    def test_a_product_that_cannot_sell_by_piece_lists_nothing(self):
        self.assertEqual(
            pricing.size_listing(kg_product(sale_modes=["money", "weight"]), standard_sizes()), []
        )
        self.assertEqual(pricing.size_listing(kg_product(price_unit="piece"), standard_sizes()), [])
