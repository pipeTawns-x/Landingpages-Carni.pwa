"""Standard prices: what an order line costs at the moment it is ordered (S13, T7a).

Eduardo, 2026-11-23: "se estandarizan precios por piezas y gramaje: una pieza de tal gramaje
cuesta tanto. Eso es el pedido por pieza; de ahí el pedido por precio; por peso". Every order has
a closed price, so the whole order can be charged at checkout (S11) and nothing is pre-authorised.

The three ways to order, with the codes the store already uses (`products.sale_modes`):

- `pieces`: a piece of a standard weight (`ProductSize`: "340 g costs $265") or a whole piece with
  its real weight (a lot piece of `purchase_lots`: "Lipón of 7.3 kg"). The price of one piece is
  closed first, and the total is that price times the quantity.
- `money` ("por precio"): the customer fixes the amount and the butcher cuts the weight it buys.
  The customer pays exactly the amount; the weight is `amount / price per kilo`, to the gram.
- `weight` ("por peso"): the grams ordered at the price per kilo, to the cent.

Everything here is a pure function of Decimals and plain objects, so it is tested without a
database and T9 calls it with rows it already loaded. The functions never read a price or a total
from a request: a line that carries one is refused, and the price per kilo comes from the product
row (or from the caller, when a promotion applies). Money is a Decimal everywhere and travels as
text in the JSON; `close_price` and `order_total` take no float on any path and refuse a float in
the input. `piece_price` is the one exception: it moved here unchanged from the purchases page,
takes a Decimal weight from the view and keeps its old behavior.

The rounding is half up (`ROUND_HALF_UP`, the policy of `models.price_per_kg_from` and of the
store's `round()`), to the cent for weight and money, and to a configurable step for a standard
size (default one peso, which is how the public prices of the example are published).
"""

import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")
MILLI = Decimal("0.001")
CURRENCY = "MXN"

MODES = ("money", "weight", "pieces")
# The step a standard size price is rounded to. One peso is the default: Grill House's published
# $265, $390 and $545 for 340, 500 and 700 g at $779/kg are whole pesos (Engram #3277).
ROUNDING_STEPS = (Decimal("0.01"), Decimal("0.10"), Decimal("0.50"), Decimal("1.00"))
DEFAULT_ROUNDING_STEP = Decimal("1.00")

# The limits of the store's own `quote_line` (supabase/migrations/20261113000002), so the same
# order is refused at the same size in both places.
MAX_AMOUNT = Decimal("1000000")
MAX_GRAMS = 1_000_000  # 1000 kg a line
MAX_PIECES = 10_000
MAX_SIZE_GRAMS = 50_000  # a standard size is a piece, not a side of beef
MAX_PIECE_WEIGHT_KG = Decimal("999.999")  # numeric(6,3) of `purchase_lots.piece_weight_kg`
MAX_ORDER_LINES = 50

# Plain ASCII digits only: `\d` also matches Arabic-Indic and full-width digits, which `int()` and
# `Decimal()` would read as numbers while the SQL `quote_line` refuses them (F-29).
_MONEY_TEXT = re.compile(r"[0-9]{1,7}(\.[0-9]{1,2})?")
_WEIGHT_TEXT = re.compile(r"[0-9]{1,3}(\.[0-9]{1,3})?")
_DIGITS_TEXT = re.compile(r"[0-9]{1,12}")

# What each mode accepts besides `mode` and `product_id`. Anything else (a `total`, a
# `unit_price`, a `currency`) is refused: the server is the only one that prices.
_ALLOWED_FIELDS = {
    "money": {"amount"},
    "weight": {"grams"},
    "pieces": {"quantity", "size_id", "piece_weight_kg"},
}


class PricingError(ValueError):
    """A line or a distance the store cannot price. `code` is one the store already speaks."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class PieceVariant:
    """Whole pieces of one real weight that are on the shelf: `purchase_lots` piece lots."""

    piece_weight_kg: Decimal
    pieces_left: int


@dataclass(frozen=True)
class ClosedPrice:
    """The closed price of one order line."""

    product_id: int
    mode: str
    source: str  # "standard_size", "whole_piece", "amount" or "weight"
    size_id: int | None
    quantity: int | None
    unit_price: Decimal | None  # what one piece costs; None for money and weight
    price_per_kg: Decimal
    weight_kg: Decimal
    total: Decimal
    warnings: list[str] = field(default_factory=list)

    def as_json(self) -> dict[str, object]:
        """The shape the store and the panel read: money and weights as text, never a float."""
        return {
            "product_id": self.product_id,
            "mode": self.mode,
            "source": self.source,
            "size_id": self.size_id,
            "quantity": self.quantity,
            "unit_price": _text(self.unit_price, CENT),
            "price_per_kg": _text(self.price_per_kg, CENT),
            "weight_kg": _text(self.weight_kg, MILLI),
            "total": _text(self.total, CENT),
            "currency": CURRENCY,
            "warnings": list(self.warnings),
        }


def _text(value: Decimal | None, places: Decimal) -> str | None:
    return None if value is None else format(value.quantize(places, rounding=ROUND_HALF_UP), "f")


def round_money(value: Decimal, step: Decimal = CENT) -> Decimal:
    """Round half up to a multiple of `step`, with two places (a step of 1 gives 265.00)."""
    multiples = (value / step).quantize(Decimal(1), rounding=ROUND_HALF_UP)
    return (multiples * step).quantize(CENT, rounding=ROUND_HALF_UP)


def price_for_weight(price_per_kg: Decimal, weight_kg: Decimal) -> Decimal:
    """The weight times the price per kilo, to the cent."""
    return (weight_kg * price_per_kg).quantize(CENT, rounding=ROUND_HALF_UP)


def piece_price(product, piece_weight_kg):
    """What one piece of the lot costs: its weight times the price per kilo, to the cent.

    It lived in `panel.views_compras` (the purchases page); it moved here so that the contract and
    the page share one rule, and that module imports it back under the same name.
    """
    return price_for_weight(product.price_per_kg, Decimal(piece_weight_kg))


def _positive_price(value: object) -> Decimal:
    if not isinstance(value, Decimal) or not value.is_finite() or value <= 0:
        raise PricingError("invalid_amount", "the price per kilo must be a positive Decimal")
    return value


def size_price(
    price_per_kg: Decimal, grams: int, rounding_step: Decimal = DEFAULT_ROUNDING_STEP
) -> Decimal:
    """What one piece of a standard size costs: its weight times the price per kilo, rounded.

    340 g at $779/kg is $264.86 to the cent and $265.00 to the peso (step 1.00, the default).
    """
    price = _positive_price(price_per_kg)
    if isinstance(grams, bool) or not isinstance(grams, int) or not 1 <= grams <= MAX_SIZE_GRAMS:
        raise PricingError("invalid_amount", f"a size is 1 to {MAX_SIZE_GRAMS} grams")
    if rounding_step not in ROUNDING_STEPS:
        raise PricingError("invalid_amount", f"unknown rounding step {rounding_step!r}")
    return round_money(Decimal(grams) / 1000 * price, rounding_step)


def weight_for_amount(price_per_kg: Decimal, amount: Decimal) -> Decimal:
    """The kilos an amount buys, to the gram (half up): what the butcher cuts for "por precio"."""
    price = _positive_price(price_per_kg)
    weight = (amount / price).quantize(MILLI, rounding=ROUND_HALF_UP)
    if weight <= 0:
        raise PricingError("invalid_amount", "the amount buys less than a gram")
    return weight


def sells_pieces_by_kg(product) -> bool:
    """Whether a standard size can exist for the product: priced per kilo and sold by piece."""
    return product.price_unit == "kg" and "pieces" in (product.sale_modes or [])


def _whole_number(value: object, low: int, high: int, detail: str) -> int:
    """An integer, or the digits of one, within [low, high]. Never a float and never a bool."""
    if isinstance(value, bool) or not isinstance(value, int | str):
        raise PricingError("invalid_amount", detail)
    if isinstance(value, str):
        if not _DIGITS_TEXT.fullmatch(value):
            raise PricingError("invalid_amount", detail)
        value = int(value)
    if not low <= value <= high:
        raise PricingError("invalid_amount", detail)
    return value


def _decimal_text(value: object, pattern: re.Pattern[str], detail: str) -> Decimal:
    """A Decimal from an int or from plain digits with a decimal point; no float, no 'NaN'."""
    if isinstance(value, bool) or not isinstance(value, int | str):
        raise PricingError("invalid_amount", detail)
    text = str(value)
    if not pattern.fullmatch(text):
        raise PricingError("invalid_amount", detail)
    return Decimal(text)


def _effective_price(product, price_per_kg: Decimal | None) -> Decimal:
    return _positive_price(product.price_per_kg if price_per_kg is None else price_per_kg)


def _check_line_shape(product, line: object) -> tuple[str, Mapping]:
    if not isinstance(line, Mapping):
        raise PricingError("invalid_items", "a line is an object")
    mode = line.get("mode")
    if not isinstance(mode, str) or mode not in MODES:
        raise PricingError("sale_mode_not_allowed", f"unknown way to order: {mode!r}")
    unknown = set(line) - _ALLOWED_FIELDS[mode] - {"mode", "product_id"}
    if unknown:
        raise PricingError("invalid_items", f"fields the server decides: {sorted(unknown)}")
    if "product_id" in line and line["product_id"] != product.id:
        raise PricingError("invalid_items", "the line is for another product")
    return mode, line


def _check_product_sells(product, mode: str) -> None:
    if product.price_unit != "kg":
        raise PricingError(
            "sale_mode_not_allowed", "a product priced per piece or package is quoted by the store"
        )
    if mode not in (product.sale_modes or []):
        name = getattr(product, "name", None) or "the product"
        raise PricingError("sale_mode_not_allowed", f"{name} is not sold by {mode}")


def _stock_and_minimum_warnings(product, weight_kg: Decimal, *, by_weight: bool) -> list[str]:
    warnings = []
    if product.stock_unit == "kg" and weight_kg > Decimal(product.stock):
        warnings.append("low_stock")
    if by_weight and weight_kg < Decimal(product.min_quantity_kg):
        warnings.append("below_minimum_quantity")
    return warnings


def close_price(
    product,
    line: Mapping,
    *,
    sizes: Iterable = (),
    whole_pieces: Iterable[PieceVariant] = (),
    price_per_kg: Decimal | None = None,
) -> ClosedPrice:
    """Close the price of one line in any of the three ways to order.

    `line` is what the customer sent: `{"mode": "money", "amount": "200.00"}`,
    `{"mode": "weight", "grams": 850}` or `{"mode": "pieces", "quantity": 2, "size_id": 1}` (or
    `"piece_weight_kg": "7.3"` for a whole piece). `sizes` are the product's `ProductSize` rows and
    `whole_pieces` the `PieceVariant`s on the shelf. `price_per_kg` replaces the list price when a
    promotion applies. Raises `PricingError` with a code of the store's `domain.ERROR_MESSAGES`.
    """
    mode, line = _check_line_shape(product, line)
    per_kg = _effective_price(product, price_per_kg)
    _check_product_sells(product, mode)
    if mode == "money":
        return _close_money(product, line, per_kg)
    if mode == "weight":
        return _close_weight(product, line, per_kg)
    return _close_pieces(product, line, per_kg, tuple(sizes), tuple(whole_pieces))


def _need(line: Mapping, key: str) -> object:
    if key not in line:
        raise PricingError("invalid_items", f"the line needs {key}")
    return line[key]


def _close_money(product, line: Mapping, per_kg: Decimal) -> ClosedPrice:
    amount = _decimal_text(_need(line, "amount"), _MONEY_TEXT, "an amount in pesos and cents")
    if not 0 < amount <= MAX_AMOUNT:
        raise PricingError("invalid_amount", "the amount must be above zero and at most 1,000,000")
    weight = weight_for_amount(per_kg, amount)
    if weight * 1000 > MAX_GRAMS:
        raise PricingError("invalid_amount", "at most 1000 kg per line")
    return ClosedPrice(
        product_id=product.id,
        mode="money",
        source="amount",
        size_id=None,
        quantity=None,
        unit_price=None,
        price_per_kg=per_kg,
        weight_kg=weight,
        total=amount.quantize(CENT),
        warnings=_stock_and_minimum_warnings(product, weight, by_weight=True),
    )


def _close_weight(product, line: Mapping, per_kg: Decimal) -> ClosedPrice:
    grams = _whole_number(_need(line, "grams"), 1, MAX_GRAMS, "grams, from 1 to 1,000,000")
    weight = (Decimal(grams) / 1000).quantize(MILLI)
    return ClosedPrice(
        product_id=product.id,
        mode="weight",
        source="weight",
        size_id=None,
        quantity=None,
        unit_price=None,
        price_per_kg=per_kg,
        weight_kg=weight,
        total=price_for_weight(per_kg, weight),
        warnings=_stock_and_minimum_warnings(product, weight, by_weight=True),
    )


def _close_pieces(
    product,
    line: Mapping,
    per_kg: Decimal,
    sizes: tuple,
    whole_pieces: tuple[PieceVariant, ...],
) -> ClosedPrice:
    quantity = _whole_number(
        _need(line, "quantity"), 1, MAX_PIECES, "a whole number of pieces, from 1 to 10,000"
    )
    if ("size_id" in line) == ("piece_weight_kg" in line):
        raise PricingError("invalid_items", "the line names a size or a piece weight, not both")
    if "size_id" in line:
        return _close_standard_size(product, line, per_kg, quantity, sizes)
    return _close_whole_piece(product, line, per_kg, quantity, whole_pieces)


def _close_standard_size(
    product, line: Mapping, per_kg: Decimal, quantity: int, sizes: tuple
) -> ClosedPrice:
    size_id = line["size_id"]
    if isinstance(size_id, bool) or not isinstance(size_id, int):
        raise PricingError("invalid_items", "size_id is the id of a size")
    # The size must be one of THIS product's (F-30): the caller is not trusted to filter `sizes`.
    size = next(
        (s for s in sizes if s.id == size_id and s.product_id == product.id and s.is_active), None
    )
    if size is None:
        raise PricingError("sale_mode_not_allowed", "that size is not offered")
    unit = size_price(per_kg, size.grams, size.rounding_step)
    weight = (Decimal(size.grams) * quantity / 1000).quantize(MILLI)
    return ClosedPrice(
        product_id=product.id,
        mode="pieces",
        source="standard_size",
        size_id=size.id,
        quantity=quantity,
        unit_price=unit,
        price_per_kg=per_kg,
        weight_kg=weight,
        total=unit * quantity,
        warnings=_stock_and_minimum_warnings(product, weight, by_weight=False),
    )


def _close_whole_piece(
    product, line: Mapping, per_kg: Decimal, quantity: int, whole_pieces: tuple[PieceVariant, ...]
) -> ClosedPrice:
    piece_weight = _decimal_text(line["piece_weight_kg"], _WEIGHT_TEXT, "a weight in kilos")
    on_shelf = sum(
        v.pieces_left
        for v in whole_pieces
        if v.piece_weight_kg == piece_weight and v.pieces_left > 0
    )
    if on_shelf == 0 or not 0 < piece_weight <= MAX_PIECE_WEIGHT_KG:
        raise PricingError("sale_mode_not_allowed", "no piece of that weight is on the shelf")
    unit = price_for_weight(per_kg, piece_weight)
    return ClosedPrice(
        product_id=product.id,
        mode="pieces",
        source="whole_piece",
        size_id=None,
        quantity=quantity,
        unit_price=unit,
        price_per_kg=per_kg,
        weight_kg=(piece_weight * quantity).quantize(MILLI),
        total=unit * quantity,
        warnings=["low_stock"] if quantity > on_shelf else [],
    )


def size_listing(
    product, sizes: Iterable, price_per_kg: Decimal | None = None
) -> list[dict[str, object]]:
    """The standard sizes a product offers, lightest first, each with its closed price.

    Empty for a product that is not priced per kilo or not sold by piece: the sizes of such a
    product (left over from before the owner switched it) are not orderable.
    """
    if not sells_pieces_by_kg(product):
        return []
    per_kg = _effective_price(product, price_per_kg)
    return [
        {
            "id": size.id,
            "grams": size.grams,
            "weight_kg": _text(Decimal(size.grams) / 1000, MILLI),
            "price": _text(size_price(per_kg, size.grams, size.rounding_step), CENT),
        }
        for size in sorted(
            (s for s in sizes if s.is_active and s.product_id == product.id),
            key=lambda s: s.grams,
        )
    ]


def order_total(lines: Iterable[ClosedPrice], delivery_fee: Decimal | None) -> Decimal:
    """What the order costs: the closed lines plus the delivery fee. Only the server adds it up."""
    closed = list(lines)
    if not closed or len(closed) > MAX_ORDER_LINES:
        code = "too_many_lines" if closed else "invalid_items"
        raise PricingError(code, f"an order has 1 to {MAX_ORDER_LINES} lines")
    fee = Decimal(0) if delivery_fee is None else delivery_fee
    if not isinstance(fee, Decimal) or not fee.is_finite() or fee < 0:
        raise PricingError("invalid_items", "the delivery fee is a Decimal of zero or more")
    return (sum((line.total for line in closed), Decimal(0)) + fee).quantize(CENT)
