"""Shared pieces of the tests of `ventas`: the catalogue they sell and the double of the RPC.

Postgres functions do not exist in SQLite, and the views of `ventas` know none of their SQL (they
only talk to `ventas.services.get_gateway()`). `FakeGateway` stands in for the real gateway and
applies the rules of `supabase/tests/cotizacion-casos.json`, the file the SQL tests of the same
functions read, so a number the double gives is a number the database has to give.
"""

import json
import uuid
from decimal import ROUND_CEILING, ROUND_HALF_UP, Decimal
from pathlib import Path
from unittest import mock

from django.contrib.messages import get_messages
from django.db import models
from django.test import TestCase
from django.utils import timezone

from inventory.models import Category, CutSpec, Product
from panel.tests import sign_in_as_panel_admin
from ventas.models import PanelOrder
from ventas.services import GatewayError, Quote, QuoteLine

# backend/ventas/tests/support.py -> the root of the repository is three levels up.
CASES_PATH = Path(__file__).resolve().parents[3] / "supabase" / "tests" / "cotizacion-casos.json"
CASES = json.loads(CASES_PATH.read_text(encoding="utf-8"))

CENT = Decimal("0.01")
MILLI = Decimal("0.001")
RATE_STEP = Decimal("0.0001")
KG_PER = {
    "kg": Decimal(1),
    "g": Decimal(CASES["meta"]["g_kg"]),
    "lb": Decimal(CASES["meta"]["lb_kg"]),
}
MAX_LINES = 50
STALE_AFTER_DAYS = 4
# set_order_status (A2): where an order can go from each status.
TRANSITIONS = {
    "pending": ("confirmed", "cancelled"),
    "confirmed": ("preparing", "cancelled"),
    "preparing": ("ready", "cancelled"),
    "ready": ("delivered", "cancelled"),
    "delivered": (),
    "cancelled": (),
}
# panel_kpis with no orders at all (the shape D4 and the SQL test of A3 fix).
EMPTY_KPIS = {
    "ventas_hoy": {"total": "0.00", "pedidos": 0},
    "pendientes": 0,
    "ticket_promedio_30d": "0.00",
    "margen_30d": None,
    "top5": [],
    "serie_7d": [{"dia": f"2026-11-{day:02d}", "total": "0.00"} for day in range(10, 17)],
}


def q2(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def q3(value):
    return value.quantize(MILLI, rounding=ROUND_HALF_UP)


def ceil_cents(value):
    return ((value * 100).to_integral_value(rounding=ROUND_CEILING) / 100).quantize(CENT)


class FakeGateway:
    """The Postgres functions of the store, as the cases file describes them.

    `products` maps a product id to the data `public.products` and `product_cut_specs` would
    give the function. `errors` maps a method name to an exception raised by that method, to
    test what the views do when the database refuses.
    """

    def __init__(self, products, fx=None, promos=None):
        self.products = products
        self.fx = fx
        self.promos = promos or {}
        self.errors = {}
        self.warnings = []
        self.quotes = []
        self.orders = []
        self.moves = []
        self.kpis = None

    @classmethod
    def from_cases(cls, ids, *, fx_age_days=None, promos=None):
        """Build the double with the products of the cases file, under the ids in `ids`."""
        products = {}
        for key, spec in CASES["productos"].items():
            if key not in ids:
                continue
            weight = spec.get("avg_piece_weight_kg")
            default = spec.get("thickness_default_in")
            products[ids[key]] = {
                "price_per_kg": Decimal(spec["price_per_kg"]),
                "price_unit": spec["price_unit"],
                "sale_modes": spec["sale_modes"],
                "avg_piece_weight_kg": Decimal(weight) if weight else None,
                "thickness_default_in": Decimal(default) if default else None,
            }
        fx = dict(CASES["fx"])
        age = fx["dias_de_antiguedad"] if fx_age_days is None else fx_age_days
        return cls(
            products,
            fx={
                "rate": Decimal(fx["rate"]),
                "buffer_pct": Decimal(fx["buffer_pct"]),
                "age_days": age,
            },
            promos=promos,
        )

    # The two helpers below are the `current_fx` view and `house_rate` of the cases file.
    def usd_available(self):
        return self.fx is not None and self.fx["age_days"] <= STALE_AFTER_DAYS

    def house_rate(self):
        return (self.fx["rate"] * (1 - self.fx["buffer_pct"] / 100)).quantize(
            RATE_STEP, rounding=ROUND_HALF_UP
        )

    def _fail_if_asked(self, method):
        if method in self.errors:
            raise self.errors[method]

    def quote_cart(self, items, currency="MXN"):
        self._fail_if_asked("quote_cart")
        self.quotes.append((list(items), currency))
        if len(items) > MAX_LINES:
            raise GatewayError("too_many_lines")
        lines = [self._quote_line(item, currency) for item in items]
        total_mxn = sum((line.line_total_mxn for line in lines), Decimal("0.00"))
        total_usd = self._cart_total_usd(lines, currency, total_mxn)
        fx = None
        if self.usd_available():
            fx = {
                "rate": str(self.fx["rate"]),
                "house_rate": str(self.house_rate()),
                "fetched_on": "2026-11-13",
            }
        return Quote(
            lines=lines, total_mxn=total_mxn, total_usd=total_usd, currency=currency, fx=fx
        )

    def _cart_total_usd(self, lines, currency, total_mxn):
        """Datos' formula: the money lines asked in dollars add up exactly, and the rest of the
        cart gets one single ceiling to the cent (not one per line)."""
        if not self.usd_available():
            return None
        in_dollars = [line for line in lines if currency == "USD" and line.sale_mode == "money"]
        exact_usd = sum((line.line_total_usd for line in in_dollars), Decimal("0.00"))
        rest_mxn = total_mxn - sum((line.line_total_mxn for line in in_dollars), Decimal("0.00"))
        return exact_usd + ceil_cents(rest_mxn / self.house_rate())

    def create_order_staff(self, **order):
        self._fail_if_asked("create_order_staff")
        quote = self.quote_cart(order["items"], order["currency"])
        self.orders.append(order)
        ids = [item["product_id"] for item in order["items"]]
        names = dict(Product.objects.filter(pk__in=ids).values_list("pk", "name"))
        lines = [
            {
                "product_id": item["product_id"],
                "product_name": names.get(item["product_id"], "?"),
                "sale_mode": line.sale_mode,
                "quantity_kg": str(line.quantity_kg),
                "pieces": line.pieces,
                "unit_price": str(line.unit_price),
                "discount": str(line.discount_mxn),
                "subtotal": str(line.line_total_mxn),
                "note": item.get("note"),
            }
            for item, line in zip(order["items"], quote.lines, strict=True)
        ]
        now = timezone.now()
        row = PanelOrder(
            order_id=uuid.uuid4(),
            status="pending",
            channel=order["channel"],
            customer_name=order["customer_name"],
            customer_phone=order["customer_phone"],
            delivery_type=order["delivery_type"],
            delivery_address=order["delivery_address"],
            notes=order["notes"],
            payment_method=order["payment_method"],
            currency=order["currency"],
            total_mxn=quote.total_mxn,
            total_usd=quote.total_usd,
            fx_rate_used=self.house_rate() if self.usd_available() else None,
            staff_ref=order["staff_ref"],
            created_at=now,
            updated_at=now,
            lines=lines,
        )
        # The mirror refuses writes from Django, as it should; the database is what writes it.
        models.Model.save(row, force_insert=True)
        return row.pk

    def panel_kpis(self):
        self._fail_if_asked("panel_kpis")
        return self.kpis if self.kpis is not None else EMPTY_KPIS

    def set_order_status(self, order_id, status, actor=None):
        """The transitions of `set_order_status` (A2), applied to the mirror the tests read."""
        self._fail_if_asked("set_order_status")
        if status not in TRANSITIONS:
            raise GatewayError("invalid_status")
        row = PanelOrder.objects.filter(pk=order_id).first()
        if row is None:
            raise GatewayError("order_not_found")
        if status not in TRANSITIONS[row.status]:
            raise GatewayError("invalid_transition")
        self.moves.append((order_id, status, actor))
        row.status = status
        models.Model.save(row, update_fields=["status"])
        return status

    def _quote_line(self, item, currency):
        product = self.products.get(item["product_id"])
        if product is None:
            raise GatewayError("product_not_found")
        mode = item["mode"]
        if mode not in product["sale_modes"]:
            raise GatewayError("sale_mode_not_allowed")
        amount = Decimal(item["amount"])
        if amount <= 0:
            raise GatewayError("invalid_amount")
        if currency == "USD" and not self.usd_available():
            raise GatewayError("fx_unavailable")

        base_price = product["price_per_kg"]
        unit_price = self._promo_price(item["product_id"], base_price)
        total_usd = None
        pieces = None

        if mode == "money":
            if currency == "USD":
                total_usd = q2(amount)
                total_mxn = q2(amount * self.house_rate())
            else:
                total_mxn = q2(amount)
            kg_exact = total_mxn / unit_price
        elif mode == "weight":
            kg_exact = amount * KG_PER[item.get("unit") or "kg"]
            total_mxn = q2(kg_exact * unit_price)
        else:
            if amount != amount.to_integral_value():
                raise GatewayError("invalid_amount")
            pieces = int(amount)
            if product["price_unit"] in ("piece", "package"):
                kg_exact = Decimal(0)
                total_mxn = q2(pieces * unit_price)
            else:
                thickness = item.get("thickness_in")
                factor = Decimal(1)
                if thickness and product["thickness_default_in"]:
                    factor = Decimal(thickness) / product["thickness_default_in"]
                kg_exact = pieces * product["avg_piece_weight_kg"] * factor
                total_mxn = q2(kg_exact * unit_price)

        if total_usd is None and self.usd_available():
            total_usd = ceil_cents(total_mxn / self.house_rate())
        quantity_kg = q3(kg_exact)
        return QuoteLine(
            product_id=item["product_id"],
            sale_mode=mode,
            quantity_kg=quantity_kg,
            pieces=pieces,
            unit_price=unit_price,
            line_total_mxn=total_mxn,
            discount_mxn=q2(kg_exact * (base_price - unit_price)),
            line_total_usd=total_usd,
            warnings=list(self.warnings),
        )

    def _promo_price(self, product_id, base_price):
        promo = self.promos.get(product_id)
        if promo is None:
            return base_price
        value = Decimal(promo["value"])
        if promo["kind"] == "percent":
            return q2(base_price * (1 - value / 100))
        if promo["kind"] == "amount_off":
            return q2(base_price - value)
        return q2(value)


def messages_of(response):
    """Return the (level, text) pairs of the messages the request queued."""
    return [(m.level_tag, str(m)) for m in get_messages(response.wsgi_request)]


def make_store():
    """Create the catalogue of the cases file in the database and return it by key.

    The products are `bistec` (per kilo, with a cut spec: 150 g a piece, 1 in thick), `molida`
    (per kilo, no spec) and `camiseta` (merchandise, sold by the piece).
    """
    meat = Category.objects.create(name="Res", slug="res")
    merch = Category.objects.create(name="Merch", slug="merch")
    bistec = Product.objects.create(category=meat, name="Bistec", price_per_kg=Decimal("200.00"))
    molida = Product.objects.create(category=meat, name="Molida", price_per_kg=Decimal("140.00"))
    camiseta = Product.objects.create(
        category=merch, name="Camiseta", price_per_kg=Decimal("250.00"), price_unit="piece"
    )
    CutSpec.objects.create(
        product=bistec,
        avg_piece_weight_kg=Decimal("0.150"),
        thickness_min_in=Decimal("0.50"),
        thickness_max_in=Decimal("3.00"),
        thickness_default_in=Decimal("1.00"),
    )
    return {"bistec": bistec, "molida": molida, "camiseta": camiseta, "meat": meat, "merch": merch}


class SalesTestCase(TestCase):
    """A panel admin signed in, the catalogue in the database and the double in place of the RPC."""

    @classmethod
    def setUpTestData(cls):
        cls.store = make_store()

    def setUp(self):
        ids = {key: self.store[key].pk for key in ("bistec", "molida", "camiseta")}
        self.gateway = FakeGateway.from_cases(ids)
        patcher = mock.patch("ventas.services.get_gateway", return_value=self.gateway)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.admin_id = sign_in_as_panel_admin(self.client)

    def cart(self):
        """Return the cart the session of the test client holds."""
        return self.client.session.get("ventas_cart", [])
