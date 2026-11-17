"""Tests of the gateway: the double against the shared cases, and the real one against a cursor.

The real gateway runs Postgres functions that SQLite does not have, so what can be proved here is
how it talks: which function, with which parameters, how it reads the answer and how it turns a
`RAISE EXCEPTION` of the store into an error the views know. The numbers themselves are proved by
the double (which applies `cotizacion-casos.json`) and by the SQL tests that read the same file.
"""

import json
import uuid
from decimal import Decimal
from unittest import mock

from django.db import InternalError, ProgrammingError
from django.test import SimpleTestCase

from ventas import domain
from ventas.services import (
    ERROR_CODES,
    GatewayError,
    GatewayFunctionMissing,
    GatewayUnavailable,
    PostgresGateway,
    get_gateway,
)
from ventas.tests.support import CASES, FakeGateway

IDS = {"bistec": 1, "molida": 2, "camiseta": 3}


def line_for(case):
    entry = case["entrada"]
    return {
        "product_id": IDS[case["producto"]],
        "mode": entry["mode"],
        "amount": entry["amount"],
        "unit": entry.get("unit"),
        "thickness_in": entry.get("thickness_in"),
        "note": None,
    }


def gateway_for(case):
    age = case.get("fx", CASES["fx"])["dias_de_antiguedad"]
    promos = {IDS[case["producto"]]: case["promo"]} if "promo" in case else None
    return FakeGateway.from_cases(IDS, fx_age_days=age, promos=promos)


class DoubleAppliesTheSharedCasesTests(SimpleTestCase):
    """If the double drifts from the file, every view test that leans on it would lie."""

    def test_every_case_with_a_result_gives_the_numbers_of_the_file(self):
        cases = [case for case in CASES["casos"] if "esperado" in case]
        # The cases file has 12 cases with a result and 6 with an error (18 in all).
        self.assertGreaterEqual(len(cases), 12)
        for case in cases:
            with self.subTest(case=case["id"]):
                quote = gateway_for(case).quote_cart([line_for(case)], case["entrada"]["currency"])
                got, expected = quote.lines[0], case["esperado"]

                self.assertEqual(str(got.quantity_kg), expected["quantity_kg"])
                self.assertEqual(got.pieces, expected["pieces"])
                self.assertEqual(str(got.unit_price), expected["unit_price"])
                self.assertEqual(str(got.line_total_mxn), expected["line_total_mxn"])
                self.assertEqual(str(got.discount_mxn), expected["discount_mxn"])
                if "total_usd" in expected:
                    self.assertEqual(str(got.line_total_usd), expected["total_usd"])

    def test_every_case_with_an_error_is_refused_with_its_code(self):
        cases = [case for case in CASES["casos"] if "error" in case]
        self.assertGreaterEqual(len(cases), 5)
        for case in cases:
            with self.subTest(case=case["id"]), self.assertRaises(GatewayError) as caught:
                gateway_for(case).quote_cart([line_for(case)], case["entrada"]["currency"])
            self.assertEqual(caught.exception.code, case["error"])

    def test_the_total_of_a_cart_is_the_sum_of_its_lines(self):
        cases = {case["id"]: case for case in CASES["casos"]}
        items = [line_for(cases["peso-1lb-bistec"]), line_for(cases["dinero-50-molida"])]

        quote = gateway_for(cases["peso-1lb-bistec"]).quote_cart(items, "MXN")

        self.assertEqual(quote.total_mxn, Decimal("140.72"))


class ErrorCodesTests(SimpleTestCase):
    def test_the_codes_are_the_ones_the_store_raises(self):
        self.assertEqual(
            sorted(ERROR_CODES),
            sorted(
                [
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
                ]
            ),
        )

    def test_every_code_has_a_message_for_the_staff(self):
        for code in ERROR_CODES:
            with self.subTest(code=code):
                self.assertTrue(domain.ERROR_MESSAGES[code].strip())

    def test_a_code_nobody_wrote_a_message_for_still_gets_a_generic_one(self):
        self.assertEqual(domain.message_for("a_new_rule"), domain.GENERIC_REFUSAL)
        self.assertEqual(
            domain.message_for("invalid_amount"), domain.ERROR_MESSAGES["invalid_amount"]
        )


class RaisedByTheStore(Exception):
    """Stands for the psycopg error of a `RAISE EXCEPTION` (SQLSTATE P0001)."""

    sqlstate = "P0001"


class MissingFunction(Exception):
    """Stands for the psycopg `UndefinedFunction` error (SQLSTATE 42883)."""

    sqlstate = "42883"


class RecordingCursor:
    """Stands for `connection.cursor()`: remembers what runs and answers with one value."""

    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.calls = []

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False

    def execute(self, sql, params=None):
        self.calls.append((sql, params))
        if self.error is not None:
            raise self.error

    def fetchone(self):
        return (self.result,)


def gateway_over(cursor):
    """Return a real gateway whose database connection is `cursor`."""
    connection = mock.Mock()
    connection.cursor.return_value = cursor
    patcher = mock.patch("ventas.services.connection", connection)
    patcher.start()
    return PostgresGateway(), patcher


QUOTE = {
    "lines": [
        {
            "product_id": 1,
            "sale_mode": "weight",
            "quantity_kg": "0.454",
            "pieces": None,
            "unit_price": "200.00",
            "line_total_mxn": "90.72",
            "discount_mxn": "0.00",
            "line_total_usd": None,
            "warnings": ["low_stock"],
        }
    ],
    "total_mxn": "90.72",
    "total_usd": None,
    "currency": "MXN",
    "fx": None,
}
LINE = {"product_id": 1, "mode": "weight", "amount": "1", "unit": "lb", "thickness_in": None}


class PostgresGatewayTests(SimpleTestCase):
    def open_gateway(self, **cursor_args):
        cursor = RecordingCursor(**cursor_args)
        gateway, patcher = gateway_over(cursor)
        self.addCleanup(patcher.stop)
        return gateway, cursor

    def test_quote_cart_calls_the_function_with_the_cart_and_the_currency_as_parameters(self):
        gateway, cursor = self.open_gateway(result=json.dumps(QUOTE))

        gateway.quote_cart([LINE], "MXN")

        ((sql, params),) = cursor.calls
        self.assertIn("public.quote_cart", sql)
        self.assertEqual(sql.count("%s"), 2)
        self.assertEqual(json.loads(params[0]), [LINE])
        self.assertEqual(params[1], "MXN")

    def test_quote_cart_reads_the_money_as_decimals_and_keeps_the_warnings(self):
        gateway, _ = self.open_gateway(result=json.dumps(QUOTE))

        quote = gateway.quote_cart([LINE], "MXN")

        self.assertEqual(quote.total_mxn, Decimal("90.72"))
        self.assertIsNone(quote.total_usd)
        self.assertIsNone(quote.fx)
        line = quote.lines[0]
        self.assertEqual(
            (line.product_id, line.sale_mode, line.quantity_kg, line.unit_price),
            (1, "weight", Decimal("0.454"), Decimal("200.00")),
        )
        self.assertEqual((line.line_total_mxn, line.discount_mxn), (Decimal("90.72"), Decimal("0")))
        self.assertEqual(line.warnings, ["low_stock"])

    def test_quote_cart_accepts_a_driver_that_already_decoded_the_json(self):
        gateway, _ = self.open_gateway(result=QUOTE)

        self.assertEqual(gateway.quote_cart([LINE], "MXN").total_mxn, Decimal("90.72"))

    def test_the_fx_of_a_dollar_quote_is_kept(self):
        usd = {**QUOTE, "currency": "USD", "total_usd": "4.98", "fx": {"rate": "18.61"}}
        gateway, _ = self.open_gateway(result=json.dumps(usd))

        quote = gateway.quote_cart([LINE], "USD")

        self.assertEqual(quote.total_usd, Decimal("4.98"))
        self.assertEqual(quote.fx["rate"], "18.61")

    def test_a_rule_of_the_store_becomes_a_gateway_error_with_its_code(self):
        for code in ERROR_CODES:
            for message in (f"{code}: detail for the staff", f"ERROR: P0001 {code} (CONTEXT)"):
                with self.subTest(message=message):
                    gateway, _ = self.open_gateway(error=InternalError(message))

                    with self.assertRaises(GatewayError) as caught:
                        gateway.quote_cart([LINE], "MXN")

                    self.assertEqual(caught.exception.code, code)

    def test_a_rule_with_a_code_this_code_does_not_know_is_still_a_rule_of_the_store(self):
        error = InternalError("a_new_rule: detail")
        error.__cause__ = RaisedByTheStore("a_new_rule: detail")
        gateway, _ = self.open_gateway(error=error)

        with self.assertRaises(GatewayError) as caught:
            gateway.quote_cart([LINE], "MXN")

        self.assertEqual(caught.exception.code, "a_new_rule")

    def test_any_other_database_failure_is_unavailable_and_says_nothing_of_the_cause(self):
        gateway, _ = self.open_gateway(error=InternalError("password for role django is secret"))

        with (
            self.assertLogs("ventas.services", level="ERROR"),
            self.assertRaises(GatewayUnavailable) as caught,
        ):
            gateway.quote_cart([LINE], "MXN")

        self.assertNotIn("secret", str(caught.exception))

    def test_create_order_staff_sends_every_value_as_a_parameter_and_returns_the_id(self):
        new_id = uuid.uuid4()
        gateway, cursor = self.open_gateway(result=new_id)
        hostile = "Robert'); DROP TABLE orders;--"

        result = gateway.create_order_staff(
            items=[LINE],
            customer_name=hostile,
            customer_phone="4441234567",
            delivery_type="delivery",
            delivery_address={"address": "Calle 1"},
            notes="sin grasa",
            channel="whatsapp",
            currency="USD",
            payment_method="efectivo",
            staff_ref="staff-1",
        )

        self.assertEqual(result, new_id)
        ((sql, params),) = cursor.calls
        self.assertIn("public.create_order_staff", sql)
        self.assertNotIn("DROP TABLE", sql)
        self.assertEqual(sql.count("%s"), 10)
        self.assertEqual(json.loads(params[0]), [LINE])
        self.assertIn(hostile, params)
        self.assertEqual(json.loads(params[4]), {"address": "Calle 1"})
        self.assertEqual(
            [
                params[1],
                params[2],
                params[3],
                params[5],
                params[6],
                params[7],
                params[8],
                params[9],
            ],
            [
                hostile,
                "4441234567",
                "delivery",
                "sin grasa",
                "whatsapp",
                "USD",
                "efectivo",
                "staff-1",
            ],
        )

    def test_create_order_staff_reads_the_id_when_the_driver_gives_text(self):
        new_id = uuid.uuid4()
        gateway, _ = self.open_gateway(result=str(new_id))

        result = gateway.create_order_staff(
            items=[LINE],
            customer_name="Ana",
            customer_phone="",
            delivery_type="pickup",
            delivery_address={},
            notes="",
            channel="mostrador",
            currency="MXN",
            payment_method=None,
            staff_ref="staff-1",
        )

        self.assertEqual(result, new_id)

    def test_create_order_web_sends_every_value_as_a_parameter_and_names_no_channel(self):
        new_id = uuid.uuid4()
        gateway, cursor = self.open_gateway(result=new_id)
        hostile = "Robert'); DROP TABLE orders;--"

        result = gateway.create_order_web(
            items=[LINE],
            customer_name=hostile,
            customer_phone="4441234567",
            delivery_type="delivery",
            delivery_address={"address": "Calle 1"},
            notes="",
            currency="USD",
            payment_method="efectivo",
        )

        self.assertEqual(result, new_id)
        ((sql, params),) = cursor.calls
        self.assertIn("public.create_order_web", sql)
        self.assertNotIn("DROP TABLE", sql)
        self.assertNotIn("channel", sql)
        self.assertNotIn("staff", sql)
        self.assertEqual(sql.count("%s"), 8)
        self.assertEqual(json.loads(params[0]), [LINE])
        self.assertEqual(json.loads(params[4]), {"address": "Calle 1"})
        self.assertEqual(
            [params[1], params[2], params[3], params[5], params[6], params[7]],
            [hostile, "4441234567", "delivery", None, "USD", "efectivo"],
        )

    def test_create_order_web_reads_the_id_when_the_driver_gives_text(self):
        new_id = uuid.uuid4()
        gateway, _ = self.open_gateway(result=str(new_id))
        result = gateway.create_order_web(
            items=[LINE],
            customer_name="Ana",
            customer_phone="4441234567",
            delivery_type="pickup",
            delivery_address={},
            notes=None,
            currency="MXN",
            payment_method=None,
        )
        self.assertEqual(result, new_id)

    def test_too_many_pending_of_create_order_web_is_a_rule_of_the_store(self):
        error = InternalError("too_many_pending: at most 3 pending orders for the same phone")
        error.__cause__ = RaisedByTheStore(str(error))
        gateway, _ = self.open_gateway(error=error)
        with self.assertRaises(GatewayError) as caught:
            gateway.create_order_web(
                items=[LINE],
                customer_name="Ana",
                customer_phone="4441234567",
                delivery_type="pickup",
                delivery_address={},
                notes=None,
                currency="MXN",
                payment_method=None,
            )
        self.assertEqual(caught.exception.code, "too_many_pending")

    def test_a_function_missing_in_the_database_is_told_apart_and_is_still_unavailable(self):
        error = ProgrammingError(
            "function public.create_order_web(p_items => jsonb, p_customer_name => text) "
            "does not exist"
        )
        error.__cause__ = MissingFunction(str(error))
        gateway, _ = self.open_gateway(error=error)
        with (
            self.assertLogs("ventas.services", level="ERROR"),
            self.assertRaises(GatewayFunctionMissing) as caught,
        ):
            gateway.create_order_web(
                items=[LINE],
                customer_name="Ana",
                customer_phone="4441234567",
                delivery_type="pickup",
                delivery_address={},
                notes=None,
                currency="MXN",
                payment_method=None,
            )
        self.assertEqual(caught.exception.function, "public.create_order_web")
        self.assertIsInstance(caught.exception, GatewayUnavailable)

    def test_the_double_offers_what_the_real_gateway_offers(self):
        public = {
            name
            for name in dir(PostgresGateway)
            if not name.startswith("_") and callable(getattr(PostgresGateway, name))
        }

        self.assertTrue(public)
        self.assertTrue(public <= {name for name in dir(FakeGateway) if not name.startswith("_")})

    def test_get_gateway_gives_the_real_one(self):
        self.assertIsInstance(get_gateway(), PostgresGateway)
