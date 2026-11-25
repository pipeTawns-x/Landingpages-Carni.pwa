"""Inventory by source (S14.1-3, T7b): the rules the panel and the store share, as pure functions.

A source is a product that holds raw stock in kilos ("una pierna de puerco de 10 kg"); sellable
products point at it (`products.source_product_id`). A sale deducts exactly the grams sold (L25),
from the product's own stock first (what an explicit cut left there) and the rest from its source.
The stock never goes below zero. The yield factor never takes part in a deduction (assumption A3).

The SQL functions of `supabase/migrations/20261125000001_inventario_por_fuente.sql` apply the same
rules inside the database, where the rows are locked; these functions are what the Django code and
its tests use, with Decimals only: a float, text or a non-finite Decimal is refused with
`invalid_amount`, so a view parses the user's input with its ASCII parser first (F-47).
Contract: `docs/contratos/inventario-por-fuente.md`.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from inventory.pricing import CENT, MILLI, ClosedPrice

CUT_LEGEND = "sujeto al corte del carnicero"
SHRINK_KINDS = ("trim", "drying", "expiry")
# The investigator's suggestion (L25), not a norm: configurable in `inventory_settings`.
DEFAULT_ALERT_PCT = Decimal("2")
DEFAULT_NOTE_REQUIRED_PCT = Decimal("5")
ZERO = Decimal("0")
TENTH = Decimal("0.1")
HUNDRED = Decimal("100")


class InventoryError(ValueError):
    """A refused inventory operation. `code` is one of the contract's error codes."""

    def __init__(self, code: str, detail: str = ""):
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class Draw:
    """Where the kilos of one sale come from."""

    from_own: Decimal
    from_source: Decimal


@dataclass(frozen=True)
class Reconciliation:
    """One source on one day: what was sold from it against what it lost."""

    source_drop_kg: Decimal
    sold_kg: Decimal
    shrink_kg: Decimal
    difference_kg: Decimal
    shrink_pct: Decimal


@dataclass(frozen=True)
class CountResult:
    """A physical count against the system stock."""

    system_qty: Decimal
    counted_qty: Decimal
    variance_qty: Decimal
    variance_pct: Decimal | None  # None when the system had nothing to compare with
    alert: bool
    note_required: bool


def _decimal(value: Decimal) -> Decimal:
    if not isinstance(value, Decimal) or not value.is_finite():
        raise InventoryError("invalid_amount", "amounts are finite Decimals")
    return value


def _kg(value: Decimal) -> Decimal:
    return _decimal(value).quantize(MILLI, rounding=ROUND_HALF_UP)


def legend_for(closed: ClosedPrice) -> str:
    """The legend a line carries: by weight and by price the pieces vary (S14.4-5), so
    "sujeto al corte del carnicero"; a fixed piece weighs its standard and carries none."""
    return CUT_LEGEND if closed.mode in {"weight", "money"} else ""


def deduction_kg(closed: ClosedPrice) -> Decimal:
    """The kilos a closed line takes from stock: exactly the grams sold, to the gram.

    By weight, the grams ordered; by price, amount / price per kg; by piece, pieces x standard
    weight. A piece of merchandise has no weight and takes no kilos (its stock is in pieces).
    """
    return _kg(closed.weight_kg)


def grams_for_amount(price_per_kg: Decimal, amount: Decimal) -> Decimal:
    """The grams an amount buys, to a tenth of a gram, as the store shows it.

    $260 at $300/kg = 866.7 g. The stock itself is kept to the gram (see `deduction_kg`).
    """
    if _decimal(price_per_kg) <= 0 or _decimal(amount) <= 0:
        raise InventoryError("invalid_amount", "price and amount must be above zero")
    return (amount * 1000 / price_per_kg).quantize(TENTH, rounding=ROUND_HALF_UP)


def mxn_for_usd(amount_usd: Decimal, house_rate: Decimal) -> Decimal:
    """An amount in dollars, in pesos at the panel's rate, to the cent (half up)."""
    if _decimal(amount_usd) <= 0 or _decimal(house_rate) <= 0:
        raise InventoryError("invalid_amount", "amount and rate must be above zero")
    return (amount_usd * house_rate).quantize(CENT, rounding=ROUND_HALF_UP)


def draw_stock(need_kg: Decimal, *, own_kg: Decimal, source_kg: Decimal | None) -> Draw:
    """Split a sale between the product's own stock and its source; refuse what is not there."""
    need = _kg(need_kg)
    if need <= 0:
        raise InventoryError("invalid_amount", "a sale takes more than zero")
    own = max(_kg(own_kg), ZERO)
    from_own = min(own, need)
    rest = need - from_own
    available = ZERO if source_kg is None else max(_kg(source_kg), ZERO)
    if rest > available:
        raise InventoryError("insufficient_stock", f"needs {need}, has {own + available}")
    return Draw(from_own=_kg(from_own), from_source=_kg(rest))


def cut_source(source_kg: Decimal, outputs: Mapping[object, Decimal]) -> Decimal:
    """An explicit cut: move kilos from the source to each output; return what is left on it."""
    if not outputs or any(_decimal(kg) <= 0 for kg in outputs.values()):
        raise InventoryError("invalid_amount", "every output takes more than zero")
    taken = _kg(sum(outputs.values(), ZERO))
    if taken > _kg(source_kg):
        raise InventoryError("insufficient_stock", f"cuts {taken} of {source_kg}")
    return _kg(source_kg) - taken


def check_source_link(*, product_id: int, source_id: int, source_has_source: bool) -> None:
    """A source is one level deep: a product is not its own source, and a source has none."""
    if product_id == source_id or source_has_source:
        raise InventoryError("source_cycle", "a source is a product without a source")


def apply_shrink(stock_kg: Decimal, kg: Decimal, kind: str, note: str) -> Decimal:
    """Lower the stock by a shrink of a known kind, with its note; return the new stock."""
    if kind not in SHRINK_KINDS:
        raise InventoryError("invalid_shrink_kind", f"one of {', '.join(SHRINK_KINDS)}")
    if not (note or "").strip():
        raise InventoryError("note_required", "a shrink always carries a note")
    loss = _kg(kg)
    if loss <= 0:
        raise InventoryError("invalid_amount", "a shrink is more than zero")
    if loss > _kg(stock_kg):
        raise InventoryError("insufficient_stock", "the stock never goes below zero")
    return _kg(stock_kg) - loss


def reconcile(
    *, source_drop_kg: Decimal, sold_kg: Mapping[object, Decimal], shrink_kg: Decimal
) -> Reconciliation:
    """Compare what each source lost in a day with what was sold from it and its shrink."""
    sold = _kg(sum((_decimal(kg) for kg in sold_kg.values()), ZERO))
    shrink = _kg(shrink_kg)
    used = sold + shrink
    shrink_pct = (
        (shrink * HUNDRED / used).quantize(CENT, ROUND_HALF_UP) if used else Decimal("0.00")
    )
    return Reconciliation(
        source_drop_kg=_kg(source_drop_kg),
        sold_kg=sold,
        shrink_kg=shrink,
        difference_kg=_kg(source_drop_kg) - used,
        shrink_pct=shrink_pct,
    )


def count_variance(
    system_qty: Decimal,
    counted_qty: Decimal,
    *,
    alert_pct: Decimal = DEFAULT_ALERT_PCT,
    note_required_pct: Decimal = DEFAULT_NOTE_REQUIRED_PCT,
) -> CountResult:
    """Counted against system, with the variance and whether it alerts or needs a note."""
    counted = _kg(counted_qty)
    if counted < 0:
        raise InventoryError("invalid_amount", "a count is zero or more")
    system = _kg(system_qty)
    variance = counted - system
    if system > 0:
        pct = (variance * HUNDRED / system).quantize(CENT, rounding=ROUND_HALF_UP)
        alert, note_required = abs(pct) > alert_pct, abs(pct) > note_required_pct
    else:
        pct = None
        alert = note_required = variance != 0
    return CountResult(system, counted, variance, pct, alert, note_required)


def check_count_note(result: CountResult, note: str) -> None:
    """Refuse a count above the note threshold that does not say why."""
    if result.note_required and not (note or "").strip():
        raise InventoryError("note_required", "explain a variance above the threshold")
