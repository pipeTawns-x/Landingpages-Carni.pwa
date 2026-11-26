"""Read-only numbers for the Inicio of the panel (T7d, slice 1).

Everything here reads tables that already exist: the `panel_orders` mirror, `products` and
`product_costs`. Nothing writes. Money stays Decimal from the database to the template.

The sales follow the definitions of `panel_kpis` (supabase/migrations/
20261113000003_comercio_v1_panel.sql): a cancelled order is not a sale, and the day is the local
day of the store (settings.TIME_ZONE, America/Mexico_City).

Shrinkage and the stock per source come with T7b; this module does not guess them.
"""

import datetime
from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone

from inventory.models import Product
from ventas.models import PanelOrder

WEEKS = 8
# Provisional threshold (assumption A6 of slice 1, not decided by the owner): no field holds a
# minimum per product yet, so low stock is 5 kg or less, or 5 pieces or less for a piece product.
LOW_STOCK_THRESHOLD = Decimal("5")
CENT = Decimal("0.01")
TENTH = Decimal("0.1")


def _start_of_local_day(day: datetime.date) -> datetime.datetime:
    return timezone.make_aware(datetime.datetime.combine(day, datetime.time.min))


def weekly_sales(today: datetime.date, weeks: int = WEEKS) -> list[dict]:
    """The sales of the last `weeks` weeks (Monday to Sunday), oldest first, the current last.

    Each week is `{start, total, orders}`; a week without sales is there with a total of 0.
    """
    current_monday = today - datetime.timedelta(days=today.weekday())
    first_monday = current_monday - datetime.timedelta(weeks=weeks - 1)
    starts = [first_monday + datetime.timedelta(weeks=n) for n in range(weeks)]
    buckets = {start: {"start": start, "total": Decimal("0"), "orders": 0} for start in starts}

    rows = (
        PanelOrder.objects.exclude(status="cancelled")
        .filter(created_at__gte=_start_of_local_day(first_monday))
        .values_list("created_at", "total_mxn")
    )
    for created_at, total in rows:
        day = timezone.localtime(created_at).date()
        bucket = buckets.get(day - datetime.timedelta(days=day.weekday()))
        if bucket is not None:
            bucket["total"] += total
            bucket["orders"] += 1
    return [buckets[start] for start in starts]


def _priced_products():
    return Product.objects.filter(is_active=True, price_per_kg__gt=0)


def price_margins() -> list[dict]:
    """The margin of each active product with a cost per kilo, the thinnest one first.

    The cost of a kilo that can be sold is the cost per kilo bought over the yield of the cut,
    so 200 $/kg at 80 % yield is 250 $. A negative margin is a loss (`is_loss`).
    """
    rows = []
    products = _priced_products().filter(cost__cost_per_kg__isnull=False).select_related("cost")
    for product in products:
        yield_share = (product.cost.yield_pct or Decimal("100")) / Decimal("100")
        if yield_share <= 0:
            continue
        price = product.price_per_kg
        cost = (product.cost.cost_per_kg / yield_share).quantize(CENT, ROUND_HALF_UP)
        margin = (price - cost).quantize(CENT, ROUND_HALF_UP)
        rows.append(
            {
                "id": product.pk,
                "name": product.name,
                "price_per_kg": price,
                "cost_per_kg": cost,
                "margin_mxn": margin,
                "margin_pct": (margin / price * 100).quantize(TENTH, ROUND_HALF_UP),
                "is_loss": margin < 0,
            }
        )
    rows.sort(key=lambda row: (row["margin_pct"], row["name"]))
    return rows


def products_without_cost() -> int:
    """How many active priced products have no cost per kilo yet."""
    return _priced_products().filter(cost__cost_per_kg__isnull=True).count()


def low_stock(threshold: Decimal = LOW_STOCK_THRESHOLD) -> list[dict]:
    """The active products whose stock is at or below `threshold`, the emptiest first."""
    products = Product.objects.filter(is_active=True, stock__lte=threshold).order_by(
        "stock", "name"
    )
    return [
        {
            "id": product.pk,
            "name": product.name,
            "stock": product.stock_display,
            "unit": "pz" if product.stock_unit == "piece" else "kg",
            "is_out": product.stock <= 0,
        }
        for product in products
    ]
