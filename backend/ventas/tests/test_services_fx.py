"""Tests of the two gateway methods behind the settings page: the current rate and the manual one.

Like the rest of the real gateway, they run Postgres functions SQLite does not have, so what is
proved here is how they talk: which statement, which parameters and how the answer is read.
"""

from datetime import date
from decimal import Decimal

from django.db import InternalError
from django.test import SimpleTestCase

from ventas.services import GatewayError, PostgresGateway
from ventas.tests.test_gateway import RecordingCursor, gateway_over


class RaisedByTheStore(Exception):
    sqlstate = "P0001"


class CurrentFxTests(SimpleTestCase):
    def open_gateway(self, **cursor_args):
        cursor = RecordingCursor(**cursor_args)
        gateway, patcher = gateway_over(cursor)
        self.addCleanup(patcher.stop)
        return gateway, cursor

    def test_it_reads_the_view_current_fx_and_turns_the_text_into_numbers(self):
        answer = {
            "status": "ok",
            "rate": "18.5000",
            "buffer_pct": "2.00",
            "house_rate": "18.1300",
            "fetched_on": "2026-11-16",
            "source": "manual",
        }
        gateway, cursor = self.open_gateway(result=answer)

        fx = gateway.current_fx()

        self.assertIn("public.current_fx", cursor.calls[0][0])
        self.assertEqual(
            fx,
            {
                "status": "ok",
                "rate": Decimal("18.5000"),
                "buffer_pct": Decimal("2.00"),
                "house_rate": Decimal("18.1300"),
                "fetched_on": date(2026, 11, 16),
                "source": "manual",
            },
        )

    def test_without_any_rate_the_view_says_missing_and_the_numbers_are_none(self):
        gateway, _ = self.open_gateway(result={"status": "missing"})

        fx = gateway.current_fx()

        self.assertEqual(fx["status"], "missing")
        self.assertIsNone(fx["rate"])
        self.assertIsNone(fx["buffer_pct"])
        self.assertIsNone(fx["fetched_on"])


class SetManualFxRateTests(SimpleTestCase):
    def open_gateway(self, **cursor_args):
        cursor = RecordingCursor(**cursor_args)
        gateway, patcher = gateway_over(cursor)
        self.addCleanup(patcher.stop)
        return gateway, cursor

    def test_it_calls_the_function_with_every_value_as_a_parameter(self):
        gateway, cursor = self.open_gateway(result=7)

        row_id = gateway.set_manual_fx_rate(Decimal("18.5"), staff_ref="user-1")

        sql, params = cursor.calls[0]
        self.assertIn("public.set_manual_fx_rate(%s, %s, %s)", sql)
        self.assertEqual(params, [Decimal("18.5"), None, "user-1"])
        self.assertEqual(row_id, 7)

    def test_the_buffer_is_sent_when_given(self):
        gateway, cursor = self.open_gateway(result=7)

        gateway.set_manual_fx_rate(Decimal("18.5"), buffer_pct=Decimal("3"))

        self.assertEqual(cursor.calls[0][1], [Decimal("18.5"), Decimal("3"), None])

    def test_a_refusal_of_the_function_is_a_rule_of_the_store(self):
        error = InternalError("invalid_rate: the rate must be between 0 and 1000")
        error.__cause__ = RaisedByTheStore()
        gateway, _ = self.open_gateway(error=error)

        with self.assertRaises(GatewayError) as caught:
            gateway.set_manual_fx_rate(Decimal("0"))

        self.assertEqual(caught.exception.code, "invalid_rate")

    def test_it_is_a_method_of_the_real_gateway(self):
        self.assertTrue(callable(PostgresGateway.set_manual_fx_rate))
        self.assertTrue(callable(PostgresGateway.current_fx))
