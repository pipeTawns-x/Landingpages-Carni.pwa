"""Stock per product (T14, S19.7, assumption A8): adjust it and move it from one product to another.

Eduardo, 2026-11-26: "El inventario debe de ser correspondiente a los productos, donde yo voy a
inventariar. [...] Y ya yo voy a poder modificar cuánto tengo de tal producto, cuánto tengo de tal
otro producto, cuánto voy a cambiar de este producto a otro producto."

There is one ledger, `stock_movements` (reasons `adjustment` and `transfer` here), and one number
per product, `products.stock`, which every ledger function changes in the same transaction. This
module adds no table: it holds the rules of the two new operations as pure functions of Decimals
(`plan_change`, `plan_transfer`), and the two doors that apply them.

- In production (PostgreSQL) the `django` role cannot write the ledger: it calls the SECURITY
  DEFINER functions `change_product_stock` and `transfer_product_stock`
  (`supabase/migrations/20261126000001_inventario_por_producto.sql`), which lock the rows, check
  the same rules and write the rows.
- On SQLite (the tests and the local preview) `OrmStockStore` applies the plan over the ORM, inside
  one transaction and with the rows locked by ascending id, the order the SQL uses too.

Contract: `docs/contratos/inventario-por-producto.md`. A refused operation raises
`sources.InventoryError` with one of the codes of that contract and changes nothing.
"""

import re
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from inventory.pricing import MILLI
from inventory.sources import InventoryError

MODES = ("set", "add", "remove")
# The same ceiling as `adjust_stock` and `register_purchase` in the store's SQL.
MAX_STOCK = Decimal("1000000")
MAX_REASON_LENGTH = 200
MAX_STAFF_LENGTH = 100
# Plain ASCII digits only: `Decimal()` also reads Arabic-Indic and full-width digits (F-47).
_QUANTITY_TEXT = re.compile(r"[0-9]{1,7}(\.[0-9]{1,3})?")


@dataclass(frozen=True)
class Holding:
    """A product as the rules see it: what it is counted in and how much is on hand."""

    product_id: int
    name: str
    unit: str  # "kg" or "piece", `products.stock_unit`
    stock: Decimal


@dataclass(frozen=True)
class StockChange:
    """What one product ends up with: the stock on hand after, and how much it moved."""

    product_id: int
    stock: Decimal
    delta: Decimal


@dataclass(frozen=True)
class LedgerEntry:
    """One row of `stock_movements`. `via_product_id` is the other product of a transfer."""

    product_id: int
    delta: Decimal
    reason: str
    note: str
    staff_ref: str
    via_product_id: int | None = None


@dataclass(frozen=True)
class Plan:
    """What an accepted operation does: the new stock of each product and the rows to write."""

    changes: tuple[StockChange, ...]
    entries: tuple[LedgerEntry, ...]


def parse_quantity(value: object) -> Decimal:
    """Read a quantity typed by a person: plain ASCII digits, up to three decimals, never negative.

    Text and whole numbers are accepted, and a Decimal that a JSON parser produced. A float, a
    boolean, an exponent, a comma or a digit that is not 0-9 is refused with `invalid_amount`.
    """
    if isinstance(value, bool) or not isinstance(value, str | int | Decimal):
        raise InventoryError("invalid_amount", "a quantity is a number")
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise InventoryError("invalid_amount", "a quantity is a finite number")
        text = format(value, "f")
    else:
        text = str(value).strip()
    if _QUANTITY_TEXT.fullmatch(text) is None:
        raise InventoryError("invalid_amount", "digits 0-9 with up to three decimals")
    return Decimal(text).quantize(MILLI)


def _amount(value: object) -> Decimal:
    """A finite Decimal rounded half up to the gram, like the `round(x, 3)` of the SQL."""
    if not isinstance(value, Decimal) or not value.is_finite():
        raise InventoryError("invalid_amount", "amounts are finite Decimals")
    try:
        return value.quantize(MILLI, rounding=ROUND_HALF_UP)
    except InvalidOperation:
        raise InventoryError("invalid_amount", "the amount is too large") from None


def _text(value: object, limit: int, code: str, detail: str) -> str:
    text = value.strip() if isinstance(value, str) else ""
    if not text or len(text) > limit:
        raise InventoryError(code, detail)
    return text


def _reason(value: object) -> str:
    return _text(value, MAX_REASON_LENGTH, "reason_required", "a reason of at most 200 characters")


def _staff(value: object) -> str:
    return _text(value, MAX_STAFF_LENGTH, "invalid_staff_ref", "who did it, at most 100 characters")


def _is_whole(value: Decimal) -> bool:
    return value == value.to_integral_value()


def _check_pieces(holding: Holding, quantity: Decimal) -> None:
    if holding.unit == "piece" and not _is_whole(quantity):
        raise InventoryError("invalid_amount", f"{holding.name} is counted in whole pieces")


def plan_change(
    holding: Holding, mode: str, qty: object, reason: object, staff_ref: object
) -> Plan:
    """Set, add or remove stock of one product, with the reason and who did it.

    `set` is a physical count: the stock becomes `qty`, zero included. `add` and `remove` move
    `qty` above zero. The stock never goes below zero (`insufficient_stock`) and never above the
    ceiling of the store. A count that equals the stock changes nothing and writes no row (the
    ledger refuses a movement of zero).
    """
    if mode not in MODES:
        raise InventoryError("invalid_amount", f"the mode is one of {', '.join(MODES)}")
    amount = _amount(qty)
    if amount < 0 or amount > MAX_STOCK or (mode != "set" and amount == 0):
        raise InventoryError("invalid_amount", "the quantity is above zero and below the ceiling")
    note = _reason(reason)
    who = _staff(staff_ref)
    _check_pieces(holding, amount)

    if mode == "set":
        new_stock = amount
    elif mode == "add":
        new_stock = holding.stock + amount
    else:
        if amount > holding.stock:
            raise InventoryError(
                "insufficient_stock", f"{holding.name} has {holding.stock}, cannot remove {amount}"
            )
        new_stock = holding.stock - amount
    if new_stock > MAX_STOCK:
        raise InventoryError("invalid_amount", "the stock cannot pass the ceiling of the store")

    delta = new_stock - holding.stock
    change = StockChange(holding.product_id, new_stock, delta)
    entries = (LedgerEntry(holding.product_id, delta, "adjustment", note, who),) if delta else ()
    return Plan((change,), entries)


def _arriving(source: Holding, target: Holding, amount: Decimal, to_qty: object) -> Decimal:
    """What the target receives: the same quantity, or the one the person wrote across units."""
    if source.unit == target.unit:
        if to_qty is None:
            return amount
        arriving = _amount(to_qty)
        if arriving != amount:
            raise InventoryError("invalid_amount", "the same unit moves the same quantity")
        return arriving
    if to_qty is None:
        raise InventoryError(
            "unit_mismatch",
            f"{source.name} is counted in {source.unit}, {target.name} in {target.unit}: "
            "say how much arrives",
        )
    arriving = _amount(to_qty)
    if arriving <= 0 or arriving > MAX_STOCK:
        raise InventoryError("invalid_amount", "what arrives is above zero and below the ceiling")
    return arriving


def plan_transfer(
    source: Holding,
    target: Holding,
    qty: object,
    to_qty: object,
    reason: object,
    staff_ref: object,
) -> Plan:
    """Move `qty` of `source` to `target`: two paired ledger rows, one out and one in.

    Both products are counted in the same unit and the quantity that leaves is the one that
    arrives. Across units (kilos to pieces) the person writes `to_qty`, what arrives, because
    nothing converts it for them. A difference between two products of the same unit is not a
    transfer: it is a shrink, and it is recorded as one.
    """
    if source.product_id == target.product_id:
        raise InventoryError("same_product", "a transfer needs two different products")
    amount = _amount(qty)
    if amount <= 0 or amount > MAX_STOCK:
        raise InventoryError("invalid_amount", "the quantity is above zero and below the ceiling")
    note = _reason(reason)
    who = _staff(staff_ref)
    arriving = _arriving(source, target, amount, to_qty)
    _check_pieces(source, amount)
    _check_pieces(target, arriving)
    if amount > source.stock:
        raise InventoryError(
            "insufficient_stock", f"{source.name} has {source.stock}, cannot move {amount}"
        )
    if target.stock + arriving > MAX_STOCK:
        raise InventoryError("invalid_amount", "the stock cannot pass the ceiling of the store")

    changes = (
        StockChange(source.product_id, source.stock - amount, -amount),
        StockChange(target.product_id, target.stock + arriving, arriving),
    )
    entries = (
        LedgerEntry(source.product_id, -amount, "transfer", note, who, target.product_id),
        LedgerEntry(target.product_id, arriving, "transfer", note, who, source.product_id),
    )
    return Plan(changes, entries)
