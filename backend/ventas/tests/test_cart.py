"""Tests of the session cart: what it keeps, and what it never does.

The cart is a list of lines in the shape the cart of the store and `p_items` share (contract D7).
It holds what the staff asked for and nothing the browser could use to name a price.
"""

from django.test import SimpleTestCase

from ventas import cart

PRICE_KEYS = {"price", "unit_price", "total", "subtotal", "line_total", "total_mxn", "total_usd"}


def line(product_id=12, **fields):
    return cart.make_line(
        product_id,
        fields.get("mode", "weight"),
        fields.get("amount", "1"),
        fields.get("unit", "lb"),
        fields.get("thickness_in"),
        fields.get("note"),
    )


class MakeLineTests(SimpleTestCase):
    def test_a_line_has_exactly_the_keys_of_the_shared_shape(self):
        self.assertEqual(
            line(note="sin grasa"),
            {
                "product_id": 12,
                "mode": "weight",
                "amount": "1",
                "unit": "lb",
                "thickness_in": None,
                "note": "sin grasa",
            },
        )

    def test_a_line_never_carries_a_price(self):
        self.assertFalse(PRICE_KEYS & set(line()))

    def test_numbers_are_kept_as_text_without_trailing_zeros(self):
        made = cart.make_line(12, "pieces", "3.000", None, "1.50", None)

        self.assertEqual((made["amount"], made["thickness_in"]), ("3", "1.5"))

    def test_an_empty_note_is_no_note(self):
        self.assertIsNone(line(note="")["note"])


class SessionCartTests(SimpleTestCase):
    def setUp(self):
        self.session = {}

    def test_a_new_session_has_an_empty_cart(self):
        self.assertEqual(cart.lines(self.session), [])

    def test_putting_a_line_keeps_it_in_the_session_under_one_key(self):
        cart.put(self.session, line())

        self.assertEqual(self.session[cart.SESSION_KEY], [line()])
        self.assertEqual(cart.lines(self.session), [line()])

    def test_putting_the_same_product_again_replaces_its_line_in_place(self):
        cart.put(self.session, line(1, amount="1"))
        cart.put(self.session, line(2, amount="5"))
        cart.put(self.session, line(1, amount="3"))

        self.assertEqual(
            [(entry["product_id"], entry["amount"]) for entry in cart.lines(self.session)],
            [(1, "3"), (2, "5")],
        )

    def test_a_line_can_be_read_by_product(self):
        cart.put(self.session, line(7))

        self.assertEqual(cart.get(self.session, 7), line(7))
        self.assertIsNone(cart.get(self.session, 8))

    def test_removing_a_line_says_whether_it_was_there(self):
        cart.put(self.session, line(1))

        self.assertTrue(cart.remove(self.session, 1))
        self.assertFalse(cart.remove(self.session, 1))
        self.assertEqual(cart.lines(self.session), [])

    def test_the_cart_holds_at_most_fifty_lines(self):
        for product_id in range(cart.MAX_LINES):
            cart.put(self.session, line(product_id))

        with self.assertRaises(cart.CartFull):
            cart.put(self.session, line(999))
        # Replacing a line of a full cart is not adding one.
        cart.put(self.session, line(0, amount="9"))
        self.assertEqual(len(cart.lines(self.session)), cart.MAX_LINES)

    def test_clearing_empties_it(self):
        cart.put(self.session, line())

        cart.clear(self.session)

        self.assertEqual(cart.lines(self.session), [])

    def test_what_a_session_holds_that_is_not_a_line_is_ignored(self):
        self.session[cart.SESSION_KEY] = [line(1), {"product_id": "x"}, "junk", None, {"price": 1}]

        self.assertEqual(cart.lines(self.session), [line(1)])
