"""The cart of the sale at the counter, kept in the session of the panel admin.

A line has the shape that the cart of the store and the `p_items` of the Postgres functions share
(contract D7): `{product_id, mode, amount, unit, thickness_in, note}`. It holds what the staff
asked for and never a price or a total, so there is nothing in it that could be edited to pay
less: every number on the page and in the order comes from the quote of the store.

One line per product. Adding a product that is already in the cart replaces its line.
"""

from decimal import Decimal

SESSION_KEY = "ventas_cart"
# The functions of the store refuse an order of more than 50 lines (`too_many_lines`).
MAX_LINES = 50
LINE_KEYS = frozenset({"product_id", "mode", "amount", "unit", "thickness_in", "note"})


class CartFull(Exception):
    """The cart already has MAX_LINES lines and the new one is not a replacement."""


def _number(value):
    """Write a number as text with no trailing zeros: `1.50` and `100` stay `1.5` and `100`."""
    return format(Decimal(str(value)).normalize(), "f")


def make_line(product_id, mode, amount, unit=None, thickness_in=None, note=None):
    """Build a line of the cart from what the form of the page gave."""
    return {
        "product_id": int(product_id),
        "mode": mode,
        "amount": _number(amount),
        "unit": unit or None,
        "thickness_in": None if thickness_in in (None, "") else _number(thickness_in),
        "note": note or None,
    }


def _is_line(value):
    return (
        isinstance(value, dict) and set(value) == LINE_KEYS and isinstance(value["product_id"], int)
    )


def lines(session):
    """Return the lines of the cart, in the order they were added."""
    held = session.get(SESSION_KEY, [])
    return [line for line in held if _is_line(line)] if isinstance(held, list) else []


def get(session, product_id):
    """Return the line of a product, or None."""
    return next((line for line in lines(session) if line["product_id"] == product_id), None)


def put(session, line):
    """Add a line, or replace the one of the same product where it is."""
    held = lines(session)
    for position, existing in enumerate(held):
        if existing["product_id"] == line["product_id"]:
            held[position] = line
            break
    else:
        if len(held) >= MAX_LINES:
            raise CartFull
        held.append(line)
    # A new list each time: the session only notices what is assigned to it.
    session[SESSION_KEY] = held


def remove(session, product_id):
    """Take the line of a product out. Say whether it was there."""
    held = lines(session)
    kept = [line for line in held if line["product_id"] != product_id]
    session[SESSION_KEY] = kept
    return len(kept) != len(held)


def clear(session):
    session.pop(SESSION_KEY, None)
