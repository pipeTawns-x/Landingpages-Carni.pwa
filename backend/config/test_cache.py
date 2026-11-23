"""The cache holds the counters of the public limits: a flood of other keys must not evict them.

ventas/throttle.py counts attempts per client in Django's cache. The default LocMemCache keeps
300 entries and drops the oldest first, so a visitor that sends requests from many addresses
could push a victim's counter out and give them a fresh window (audit F-17).
"""

from django.core.cache import cache
from django.test import SimpleTestCase


class ThrottleCacheTests(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

    def test_a_flood_of_other_clients_does_not_evict_a_counter(self):
        cache.set("checkout-throttle:ip:victim", 58, 3600)

        for n in range(2000):
            cache.set(f"checkout-throttle:ip:other-{n}", 1, 3600)

        self.assertEqual(cache.get("checkout-throttle:ip:victim"), 58)
