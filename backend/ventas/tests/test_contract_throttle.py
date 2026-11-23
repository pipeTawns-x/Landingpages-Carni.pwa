"""Contract tests of the address a limit counts (`ventas.throttle.client_ip`, audit F-17).

A limit per client is only as good as the key: an IPv6 customer owns a whole /64 (a phone or a
home rotates inside it), so counting the full address would give a script millions of keys.
"""

from django.test import RequestFactory, SimpleTestCase, override_settings

from ventas import throttle


def key_of(address="", forwarded=None):
    meta = {"REMOTE_ADDR": address}
    if forwarded is not None:
        meta["HTTP_X_FORWARDED_FOR"] = forwarded
    return throttle.client_ip(RequestFactory().get("/", **meta))


class ClientAddressTests(SimpleTestCase):
    def test_an_ipv4_address_is_its_own_key(self):
        self.assertEqual(key_of("198.51.100.7"), "198.51.100.7")

    def test_the_addresses_of_one_ipv6_64_share_a_key(self):
        self.assertEqual(key_of("2001:db8:1:2::1"), key_of("2001:db8:1:2:ffff:ffff:ffff:ffff"))
        self.assertEqual(key_of("2001:db8:1:2::1"), "2001:db8:1:2::/64")

    def test_another_64_is_another_key(self):
        self.assertNotEqual(key_of("2001:db8:1:2::1"), key_of("2001:db8:1:3::1"))

    def test_an_ipv4_written_as_ipv6_counts_as_the_ipv4(self):
        self.assertEqual(key_of("::ffff:198.51.100.7"), key_of("198.51.100.7"))

    def test_text_that_is_not_an_address_stays_as_it_is(self):
        self.assertEqual(key_of("unknown"), "unknown")
        self.assertEqual(key_of(""), "")

    @override_settings(CHECKOUT_TRUST_FORWARDED_FOR=True)
    def test_the_entry_of_the_proxy_is_shaped_the_same_way(self):
        self.assertEqual(
            key_of("10.0.0.1", forwarded="1.1.1.1, 2001:db8:1:2::5"),
            key_of("10.0.0.2", forwarded="9.9.9.9, 2001:db8:1:2::9"),
        )

    @override_settings(CHECKOUT_TRUST_FORWARDED_FOR=False)
    def test_the_forwarded_header_is_ignored_without_a_trusted_proxy(self):
        self.assertEqual(key_of("198.51.100.7", forwarded="1.1.1.1"), "198.51.100.7")
