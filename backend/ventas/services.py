"""The only door from `ventas` to the Postgres functions of the store.

Prices, discounts, stock and the exchange rate are decided by `public.quote_cart` and
`public.create_order_staff` (migration A2), never in Python. This module sends them what the staff
asked for, as parameters and never as SQL text, and reads back what they answer. The views reach
it through `get_gateway()`, which the tests replace with a double that applies the same cases file
as the SQL tests.

A rule of the store arrives as `RAISE EXCEPTION '<code>: <detail>'` (SQLSTATE P0001) and leaves
here as `GatewayError(code)`. Any other database failure leaves as `GatewayUnavailable`, which
says nothing of its cause: the cause is logged, not shown.
"""

import json
import logging
import re
import uuid
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from django.db import Error as DatabaseError
from django.db import connection

logger = logging.getLogger("ventas.services")

# Every code the functions of the store raise (migrations A1-A2).
ERROR_CODES = (
    "sale_mode_not_allowed",
    "invalid_amount",
    "fx_unavailable",
    "product_not_found",
    "insufficient_stock",
    "invalid_transition",
    "too_many_lines",
    "too_many_pending",
    "not_authenticated",
    "invalid_items",
    "invalid_currency",
    "invalid_delivery_type",
    "notes_too_long",
    "order_not_found",
    "invalid_status",
    "below_minimum_order",
    "invalid_address",
    "address_too_long",
    "invalid_channel",
    "invalid_customer_name",
    "invalid_customer_phone",
    "invalid_payment_method",
    "invalid_staff_ref",
    "below_minimum_quantity",
)
_CODE_PATTERN = re.compile(r"\b(" + "|".join(ERROR_CODES) + r")\b")
RULE_SQLSTATE = "P0001"


class GatewayError(Exception):
    """The store refused: `code` says which of its rules."""

    def __init__(self, code):
        super().__init__(code)
        self.code = code


class GatewayUnavailable(Exception):
    """The database could not answer. The reason is in the log, never in the message."""

    def __init__(self):
        super().__init__("the database of the store is unavailable")


@dataclass(frozen=True)
class QuoteLine:
    product_id: int
    sale_mode: str
    quantity_kg: Decimal
    pieces: int | None
    unit_price: Decimal
    line_total_mxn: Decimal
    discount_mxn: Decimal
    line_total_usd: Decimal | None
    warnings: list = field(default_factory=list)


@dataclass(frozen=True)
class Quote:
    lines: list
    total_mxn: Decimal
    total_usd: Decimal | None
    currency: str
    fx: dict | None


def _decimal(value):
    return None if value is None else Decimal(str(value))


def parse_quote(data):
    """Turn the jsonb that `quote_cart` returns (decoded or as text) into a `Quote`."""
    if isinstance(data, str | bytes):
        data = json.loads(data)
    lines = [
        QuoteLine(
            product_id=int(line["product_id"]),
            sale_mode=line["sale_mode"],
            quantity_kg=_decimal(line["quantity_kg"]),
            pieces=None if line.get("pieces") is None else int(line["pieces"]),
            unit_price=_decimal(line["unit_price"]),
            line_total_mxn=_decimal(line["line_total_mxn"]),
            discount_mxn=_decimal(line.get("discount_mxn") or "0"),
            line_total_usd=_decimal(line.get("line_total_usd")),
            warnings=list(line.get("warnings") or []),
        )
        for line in data.get("lines") or []
    ]
    return Quote(
        lines=lines,
        total_mxn=_decimal(data["total_mxn"]),
        total_usd=_decimal(data.get("total_usd")),
        currency=data.get("currency") or "MXN",
        fx=data.get("fx"),
    )


def _error_from(exc):
    """Translate a database error into a GatewayError or a GatewayUnavailable."""
    text = str(exc)
    known = _CODE_PATTERN.search(text)
    if known:
        return GatewayError(known.group(1))
    cause = exc.__cause__
    if getattr(cause, "sqlstate", None) == RULE_SQLSTATE:
        code = text.split(":", 1)[0].strip()
        if code:
            return GatewayError(code)
    logger.error("The database of the store failed: %s", type(exc).__name__, exc_info=exc)
    return GatewayUnavailable()


def _blank_to_none(value):
    return value or None


class PostgresGateway:
    """The real gateway: one SQL statement per call, every value a parameter."""

    def _call(self, sql, params):
        try:
            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                return cursor.fetchone()[0]
        except DatabaseError as exc:
            raise _error_from(exc) from None

    def quote_cart(self, items, currency="MXN"):
        result = self._call(
            "SELECT public.quote_cart(%s::jsonb, %s)", [json.dumps(list(items)), currency]
        )
        return parse_quote(result)

    def create_order_staff(
        self,
        *,
        items,
        customer_name,
        customer_phone,
        delivery_type,
        delivery_address,
        notes,
        channel,
        currency,
        payment_method,
        staff_ref,
    ):
        result = self._call(
            "SELECT public.create_order_staff("
            "p_items => %s::jsonb, p_customer_name => %s, p_customer_phone => %s, "
            "p_delivery_type => %s, p_delivery_address => %s::jsonb, p_notes => %s, "
            "p_channel => %s, p_currency => %s, p_payment_method => %s, p_staff_ref => %s)",
            [
                json.dumps(list(items)),
                customer_name,
                _blank_to_none(customer_phone),
                delivery_type,
                json.dumps(delivery_address or {}),
                _blank_to_none(notes),
                channel,
                currency,
                _blank_to_none(payment_method),
                staff_ref,
            ],
        )
        return result if isinstance(result, uuid.UUID) else uuid.UUID(str(result))

    def panel_kpis(self):
        """The numbers of the home of the panel (shape D4), money and kilos as text."""
        result = self._call("SELECT public.panel_kpis()", [])
        return json.loads(result) if isinstance(result, str | bytes) else result

    def set_order_status(self, order_id, status, actor=None):
        """Move an order; the function checks the transition and moves the stock."""
        return self._call(
            "SELECT public.set_order_status(%s::uuid, %s, %s)", [str(order_id), status, actor]
        )

    def current_fx(self):
        """The rate in force, read from the view `current_fx` (D8), numbers and date decoded.

        `status` is "ok", "stale" (older than four days) or "missing" (no rate at all: then the
        numbers are None).
        """
        result = self._call(
            "SELECT jsonb_build_object('status', f.status, 'rate', f.rate::text, "
            "'buffer_pct', f.buffer_pct::text, 'house_rate', f.house_rate::text, "
            "'fetched_on', f.fetched_on::text, 'source', f.source) "
            "FROM public.current_fx f LIMIT 1",
            [],
        )
        data = json.loads(result) if isinstance(result, str | bytes) else result
        fetched_on = data.get("fetched_on")
        return {
            "status": data["status"],
            "rate": _decimal(data.get("rate")),
            "buffer_pct": _decimal(data.get("buffer_pct")),
            "house_rate": _decimal(data.get("house_rate")),
            "fetched_on": date.fromisoformat(fetched_on) if fetched_on else None,
            "source": data.get("source"),
        }

    def set_manual_fx_rate(self, rate, buffer_pct=None, staff_ref=None):
        """Write the rate of the owner for today (one per day); the function checks the range."""
        return self._call(
            "SELECT public.set_manual_fx_rate(%s, %s, %s)", [rate, buffer_pct, staff_ref]
        )


_gateway = None


def get_gateway():
    """Return the one gateway of the process."""
    global _gateway
    if _gateway is None:
        _gateway = PostgresGateway()
    return _gateway
