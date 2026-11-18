"""Tests of Descuentos (/panel/descuentos/): create a discount, see its price, switch it off.

`quote_cart` charges the price; the page writes `product_promotions` (the `django` role may) and
shows the price that rule gives. Dates are whole days in the time of the store: a discount
typed "del 1 al 30" counts from the 1st at 00:00 to the end of the 30th.
"""

import re
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.contrib.messages import get_messages
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from inventory.models import Promotion
from panel.tests import sign_in_as_panel_admin
from ventas.tests.support import make_store

FORBIDDEN_IN_HTML = ("<script", "<style", " style=", " onclick=", " onchange=", "javascript:")


def at_midnight(day):
    return timezone.make_aware(datetime.combine(day, time.min))


class DiscountsTestCase(TestCase):
    def setUp(self):
        self.store = make_store()
        sign_in_as_panel_admin(self.client)
        self.url = reverse("panel:descuentos")
        self.today = timezone.localdate()

    def create(self, **data):
        payload = {
            "product": self.store["bistec"].pk,
            "kind": "percent",
            "value": "10",
            "starts_on": self.today.isoformat(),
            "ends_on": (self.today + timedelta(days=6)).isoformat(),
        }
        payload.update(data)
        return self.client.post(self.url, {"action": "create", **payload})

    def messages_of(self, response):
        return [str(m) for m in get_messages(response.wsgi_request)]


class PriceRuleTests(TestCase):
    def test_each_kind_gives_the_price_quote_cart_charges(self):
        base = Decimal("200.00")
        for kind, value, price in (
            ("percent", "10", "180.00"),
            ("percent", "33.33", "133.34"),
            ("amount_off", "25", "175.00"),
            ("amount_off", "500", "0.01"),
            ("fixed_price", "150", "150"),
            ("fixed_price", "250", "200.00"),
        ):
            with self.subTest(kind=kind, value=value):
                promo = Promotion(kind=kind, value=Decimal(value))
                self.assertEqual(promo.price_for(base), Decimal(price))


class CreateTests(DiscountsTestCase):
    def test_a_valid_discount_is_saved_with_whole_days_and_redirects(self):
        response = self.create()

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        promo = Promotion.objects.get()
        self.assertEqual(promo.product, self.store["bistec"])
        self.assertEqual(
            (promo.kind, promo.value, promo.is_active), ("percent", Decimal("10"), True)
        )
        self.assertEqual(promo.starts_at, at_midnight(self.today))
        self.assertEqual(promo.ends_at, at_midnight(self.today + timedelta(days=7)))
        self.assertEqual(self.messages_of(response), ["Descuento guardado: Bistec."])

    def test_a_one_day_discount_covers_that_whole_day(self):
        self.create(ends_on=self.today.isoformat())

        promo = Promotion.objects.get()
        self.assertEqual(promo.ends_at - promo.starts_at, timedelta(days=1))

    def test_the_end_cannot_come_before_the_start(self):
        response = self.create(ends_on=(self.today - timedelta(days=1)).isoformat())

        self.assertContains(response, "La fecha final no puede ser antes de la inicial.")
        self.assertFalse(Promotion.objects.exists())

    def test_a_percent_of_100_or_more_and_a_value_of_zero_are_refused(self):
        for value, error in (
            ("100", "El porcentaje debe ser menor que 100."),
            ("0", "El valor debe ser mayor que cero."),
        ):
            with self.subTest(value=value):
                response = self.create(value=value)

                self.assertContains(response, error)
        self.assertFalse(Promotion.objects.exists())

    def test_an_overlapping_active_discount_of_the_same_product_is_refused(self):
        self.create()

        response = self.create(
            kind="fixed_price",
            value="150",
            starts_on=(self.today + timedelta(days=6)).isoformat(),
            ends_on=(self.today + timedelta(days=9)).isoformat(),
        )

        self.assertContains(response, "Ya hay un descuento activo de este producto en esas fechas.")
        self.assertEqual(Promotion.objects.count(), 1)

    def test_back_to_back_discounts_and_other_products_are_fine(self):
        self.create()
        self.create(
            starts_on=(self.today + timedelta(days=7)).isoformat(),
            ends_on=(self.today + timedelta(days=8)).isoformat(),
        )
        self.create(product=self.store["molida"].pk)

        self.assertEqual(Promotion.objects.count(), 3)

    def test_an_unknown_action_changes_nothing(self):
        response = self.client.post(self.url, {"action": "borrar"})

        self.assertEqual(response.status_code, 400)


class ListTests(DiscountsTestCase):
    def test_it_lists_each_discount_with_its_state_and_its_price(self):
        self.create()
        self.create(
            product=self.store["molida"].pk,
            kind="amount_off",
            value="40",
            starts_on=(self.today + timedelta(days=3)).isoformat(),
            ends_on=(self.today + timedelta(days=4)).isoformat(),
        )

        response = self.client.get(self.url)
        html = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "panel/descuentos.html")
        self.assertContains(response, "10 %")
        text = re.sub(r"<[^>]+>", "", html)
        self.assertIn("$200.00 → $180.00", text)
        self.assertIn("$140.00 → $100.00", text)
        self.assertContains(response, "Vigente")
        self.assertContains(response, "Programado")
        for forbidden in FORBIDDEN_IN_HTML:
            self.assertNotIn(forbidden, html)

    def test_the_last_day_shown_is_the_one_typed(self):
        last = self.today + timedelta(days=6)
        self.create()

        self.assertContains(self.client.get(self.url), f"al {last:%d/%m/%Y}")

    def test_without_discounts_it_says_so(self):
        self.assertContains(self.client.get(self.url), "Todavía no hay descuentos.")

    def test_the_sidebar_links_it_and_marks_it_current(self):
        html = self.client.get(self.url).content.decode()

        self.assertIn('href="/panel/descuentos/" aria-current="page"', html)

    def test_an_anonymous_visitor_is_sent_to_the_access_bridge(self):
        self.client.logout()

        response = self.client.get(self.url)

        self.assertRedirects(response, reverse("panel:acceso"), fetch_redirect_response=False)


class SwitchOffTests(DiscountsTestCase):
    def test_switching_off_keeps_the_row_and_marks_it_inactive(self):
        self.create()
        promo = Promotion.objects.get()

        response = self.client.post(self.url, {"action": "off", "promotion": promo.pk})

        self.assertRedirects(response, self.url, fetch_redirect_response=False)
        promo.refresh_from_db()
        self.assertFalse(promo.is_active)
        self.assertIn("Descuento desactivado: Bistec.", self.messages_of(response))
        self.assertContains(self.client.get(self.url), "Desactivado")

    def test_an_unknown_discount_is_a_404(self):
        response = self.client.post(self.url, {"action": "off", "promotion": "999999"})

        self.assertEqual(response.status_code, 404)

    def test_a_discount_id_that_is_not_a_number_is_a_404(self):
        response = self.client.post(self.url, {"action": "off", "promotion": "abc"})

        self.assertEqual(response.status_code, 404)

    def test_once_off_a_new_one_may_take_its_dates(self):
        self.create()
        self.client.post(self.url, {"action": "off", "promotion": Promotion.objects.get().pk})

        self.create(value="20")

        self.assertEqual(Promotion.objects.filter(is_active=True).count(), 1)


class DateTests(TestCase):
    def test_whole_day_window_for_a_date_range(self):
        from panel.views_descuentos import window_of

        start, end = window_of(date(2026, 11, 30), date(2026, 12, 1))

        self.assertEqual(start, at_midnight(date(2026, 11, 30)))
        self.assertEqual(end, at_midnight(date(2026, 12, 2)))
