"""Delivery by zones (S13): the fee depends on the distance, not on the size of the order.

The zones are rows meant to be edited by the owner (`ventas.models.DeliveryZone`; the panel screen
is planned, not built); nothing about them is fixed here. The example behind them is Carnívoros'
(Engram #3277): $50 up to 5.5 km, $90 up to 11, $160 up to 16 and $210 up to 22, and nothing
beyond.

The functions are pure and take the zones as plain objects, like `inventory.pricing`. The distance
is an input the server must measure (planned for T10, which does not exist yet: the address will
be geocoded there); a fee is always looked up here, never taken from a request.

ASSUMPTION: a zone covers `from_km < km <= to_km`, so exactly 5.5 km still costs the first zone's
fee. The source publishes the ranges ("0-5.5 km", "5.5-11 km") but not which edge is inclusive.
Distance 0 falls in the zone that starts at 0.
"""

from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal

from inventory.pricing import CENT, CURRENCY, PricingError

MAX_KM = Decimal("1000")


def _distance(km: object) -> Decimal:
    if isinstance(km, bool) or not isinstance(km, Decimal | int):
        raise PricingError("invalid_amount", "the distance is a Decimal number of kilometres")
    distance = Decimal(km)
    if not distance.is_finite() or distance < 0 or distance > MAX_KM:
        raise PricingError("invalid_amount", "the distance is between 0 and 1000 km")
    return distance


def _is_usable(zone) -> bool:
    """An active zone whose numbers are all finite.

    In Postgres a `numeric` NaN passes `>= 0` and `> from_km` (it sorts above every number), so a
    row can hold one (F-31). Comparing a NaN raises `InvalidOperation` and a NaN fee would be
    quoted as "NaN": such a zone is ignored, so it never covers a distance or prints a fee.
    """
    return zone.is_active and all(
        Decimal(value).is_finite() for value in (zone.from_km, zone.to_km, zone.fee)
    )


def zone_for_distance(zones: Iterable, km: Decimal | int):
    """The active zone that covers the distance, or None when it is beyond the last one."""
    distance = _distance(km)
    covering = [
        zone
        for zone in zones
        if _is_usable(zone)
        and distance <= zone.to_km
        and (distance > zone.from_km or (distance == 0 and zone.from_km == 0))
    ]
    return min(covering, key=lambda zone: (zone.from_km, zone.id), default=None)


def delivery_fee(zones: Iterable, km: Decimal | int) -> Decimal | None:
    """The fee of the zone that covers the distance, or None when there is no delivery there."""
    zone = zone_for_distance(zones, km)
    return None if zone is None else zone.fee.quantize(CENT, rounding=ROUND_HALF_UP)


def delivery_quote(zones: Iterable, km: Decimal | int) -> dict[str, object]:
    """What the store and the panel read for a distance: the fee and the zone, or why not."""
    distance = _distance(km)
    zone = zone_for_distance(zones, distance)
    return {
        "deliverable": zone is not None,
        "km": format(distance.quantize(CENT, rounding=ROUND_HALF_UP), "f"),
        "fee": None if zone is None else format(delivery_fee([zone], distance), "f"),
        "zone": None if zone is None else {"id": zone.id, "name": zone.name},
        "currency": CURRENCY,
        "reason": None if zone is not None else "out_of_range",
    }
