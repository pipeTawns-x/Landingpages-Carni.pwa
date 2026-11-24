"""Delivery by zones (S13): the fee depends on the kilometres, not on the size of the order.

The numbers are Carnívoros' (Engram #3277), from its branch Zenón Fernández, in MXN:
$50 (0-5.5 km), $90 (5.5-11), $160 (11-16) and $210 (16-22). The zones are rows the owner edits
in the panel; nothing about them lives in the code.

ASSUMPTION (not in the source): the upper edge of a zone is inclusive, so exactly 5.5 km costs
$50 and 5.51 km costs $90. Beyond the last zone there is no delivery to the door.
"""

from decimal import Decimal
from types import SimpleNamespace

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import SimpleTestCase, TestCase

from inventory.pricing import PricingError
from ventas import shipping
from ventas.models import DeliveryZone

CARNIVOROS = (
    ("Zona 1", "0", "5.5", "50.00"),
    ("Zona 2", "5.5", "11", "90.00"),
    ("Zona 3", "11", "16", "160.00"),
    ("Zona 4", "16", "22", "210.00"),
)


def zone(pk, name, from_km, to_km, fee, is_active=True):
    return SimpleNamespace(
        id=pk,
        name=name,
        from_km=Decimal(from_km),
        to_km=Decimal(to_km),
        fee=Decimal(fee),
        is_active=is_active,
    )


def carnivoros_zones():
    return [zone(i, *row) for i, row in enumerate(CARNIVOROS, start=1)]


class DeliveryFeeTests(SimpleTestCase):
    def test_each_distance_costs_the_fee_of_its_zone(self):
        cases = {
            "0.5": "50.00",
            "5.5": "50.00",
            "5.51": "90.00",
            "11": "90.00",
            "11.01": "160.00",
            "16": "160.00",
            "16.5": "210.00",
            "22": "210.00",
        }
        for km, fee in cases.items():
            with self.subTest(km=km):
                self.assertEqual(
                    shipping.delivery_fee(carnivoros_zones(), Decimal(km)), Decimal(fee)
                )

    def test_beyond_the_last_zone_there_is_no_delivery_to_the_door(self):
        self.assertIsNone(shipping.delivery_fee(carnivoros_zones(), Decimal("22.01")))

    def test_zero_kilometres_falls_in_the_first_zone(self):
        self.assertEqual(shipping.delivery_fee(carnivoros_zones(), Decimal("0")), Decimal("50.00"))

    def test_an_inactive_zone_does_not_deliver(self):
        zones = carnivoros_zones()
        zones[1].is_active = False

        self.assertIsNone(shipping.delivery_fee(zones, Decimal("7")))

    def test_a_distance_that_is_not_a_kilometre_count_is_refused(self):
        for km in (Decimal("-1"), Decimal("NaN"), Decimal("Infinity"), 7.2, "7.2", None, True):
            with self.subTest(km=km), self.assertRaises(PricingError) as caught:
                shipping.delivery_fee(carnivoros_zones(), km)
            self.assertEqual(caught.exception.code, "invalid_amount")

    def test_a_zone_with_a_value_that_is_not_a_finite_number_never_covers_a_distance(self):
        # F-31: in Postgres `numeric` a NaN passes `>= 0` and `> from_km`, so a zone row can hold
        # one. The zone is ignored: no fee is read from it and the other zones keep working.
        for column in ("from_km", "to_km", "fee"):
            for bad in (Decimal("NaN"), Decimal("Infinity")):
                zones = carnivoros_zones()
                setattr(zones[1], column, bad)
                with self.subTest(column=column, value=str(bad)):
                    self.assertIsNone(shipping.delivery_fee(zones, Decimal("7")))
                    self.assertEqual(shipping.delivery_fee(zones, Decimal("3")), Decimal("50.00"))
                    self.assertEqual(shipping.delivery_fee(zones, Decimal("12")), Decimal("160.00"))

    def test_the_quote_never_prints_a_fee_that_is_not_a_number(self):
        for column in ("from_km", "to_km", "fee"):
            zones = carnivoros_zones()
            setattr(zones[1], column, Decimal("NaN"))
            with self.subTest(column=column):
                quote = shipping.delivery_quote(zones, Decimal("7"))

                self.assertFalse(quote["deliverable"])
                self.assertIsNone(quote["fee"])
                self.assertEqual(quote["reason"], "out_of_range")

    def test_the_quote_for_a_distance_inside_a_zone(self):
        quote = shipping.delivery_quote(carnivoros_zones(), Decimal("7.2"))

        self.assertEqual(
            quote,
            {
                "deliverable": True,
                "km": "7.20",
                "fee": "90.00",
                "zone": {"id": 2, "name": "Zona 2"},
                "currency": "MXN",
                "reason": None,
            },
        )

    def test_the_quote_for_a_distance_beyond_the_last_zone(self):
        quote = shipping.delivery_quote(carnivoros_zones(), Decimal("30"))

        self.assertEqual(
            quote,
            {
                "deliverable": False,
                "km": "30.00",
                "fee": None,
                "zone": None,
                "currency": "MXN",
                "reason": "out_of_range",
            },
        )

    def test_the_total_of_a_delivery_order_adds_the_fee_the_server_found(self):
        # The client sends a distance at most; the fee is looked up, never accepted.
        quote = shipping.delivery_quote(carnivoros_zones(), Decimal("12"))

        self.assertEqual(Decimal(quote["fee"]), Decimal("160.00"))


class DeliveryZoneModelTests(TestCase):
    def make(self, **fields):
        data = {
            "name": "Zona 1",
            "from_km": Decimal("0"),
            "to_km": Decimal("5.5"),
            "fee": Decimal("50.00"),
            **fields,
        }
        return DeliveryZone(**data)

    def test_the_fee_is_a_decimal_and_the_zones_come_ordered_by_distance(self):
        for row in reversed(CARNIVOROS):
            name, from_km, to_km, fee = row
            DeliveryZone.objects.create(
                name=name, from_km=Decimal(from_km), to_km=Decimal(to_km), fee=Decimal(fee)
            )

        zones = list(DeliveryZone.objects.all())

        self.assertEqual([z.name for z in zones], ["Zona 1", "Zona 2", "Zona 3", "Zona 4"])
        self.assertIsInstance(zones[0].fee, Decimal)
        self.assertEqual(zones[3].fee, Decimal("210.00"))
        self.assertTrue(zones[0].is_active)

    def assert_refused(self, **fields):
        with self.assertRaises(IntegrityError), transaction.atomic():
            self.make(**fields).save()

    def test_a_zone_that_ends_where_it_starts_or_before_is_refused(self):
        for from_km, to_km in (("5", "5"), ("5", "4")):
            with self.subTest(range=(from_km, to_km)):
                self.assert_refused(from_km=Decimal(from_km), to_km=Decimal(to_km))

    def test_a_negative_start_or_fee_is_refused(self):
        for fields in ({"from_km": Decimal("-1")}, {"fee": Decimal("-0.01")}):
            with self.subTest(fields=fields):
                self.assert_refused(**fields)

    def test_a_value_that_is_not_a_finite_number_is_a_validation_error_not_a_crash(self):
        # F-31: Postgres lets a NaN through its CHECKs (the migration closes that), and the
        # panel calls `full_clean()`, so a NaN typed there must come back as a message.
        self.make().save()
        for column in ("from_km", "to_km", "fee"):
            for bad in (Decimal("NaN"), Decimal("Infinity")):
                with self.subTest(column=column, value=str(bad)):
                    with self.assertRaises(ValidationError) as caught:
                        self.make(name="Otra", **{column: bad}).full_clean()
                    self.assertIn(column, caught.exception.message_dict)

    def test_a_free_zone_is_allowed(self):
        self.make(fee=Decimal("0")).save()

        self.assertEqual(DeliveryZone.objects.get().fee, Decimal("0.00"))

    def test_zones_that_share_only_a_border_may_coexist(self):
        self.make().save()

        self.make(
            name="Zona 2", from_km=Decimal("5.5"), to_km=Decimal("11"), fee=Decimal("90.00")
        ).full_clean()

    def test_a_zone_that_overlaps_an_active_one_is_refused_with_a_reason(self):
        self.make().save()

        with self.assertRaises(ValidationError) as caught:
            self.make(name="Otra", from_km=Decimal("5"), to_km=Decimal("8")).full_clean()

        self.assertIn("se traslapa", str(caught.exception))

    def test_an_inactive_zone_may_overlap_and_a_zone_does_not_overlap_itself(self):
        first = self.make()
        first.save()
        old = self.make(name="Vieja", from_km=Decimal("1"), to_km=Decimal("3"), is_active=False)
        old.full_clean()

        first.fee = Decimal("55.00")
        first.full_clean()  # editing a zone must not trip over its own row
