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


def key_behind(remote="10.0.0.1", forwarded=None, cf=None, **extra):
    """The key of a request that went through Render's proxy (Cloudflare + load balancer)."""
    meta = {"REMOTE_ADDR": remote, **extra}
    if forwarded is not None:
        meta["HTTP_X_FORWARDED_FOR"] = forwarded
    if cf is not None:
        meta["HTTP_CF_CONNECTING_IP"] = cf
    return throttle.client_ip(RequestFactory().get("/", **meta))


@override_settings(CHECKOUT_TRUST_FORWARDED_FOR=True)
class ProxyClientAddressTests(SimpleTestCase):
    """Audit F-04: behind Render the client is CF-Connecting-IP, which Cloudflare refuses to take
    from the client (403); the last X-Forwarded-For entry is only the fallback."""

    def test_cf_connecting_ip_wins_over_x_forwarded_for(self):
        self.assertEqual(
            key_behind(forwarded="1.1.1.1, 198.51.100.9", cf="203.0.113.7"), "203.0.113.7"
        )

    def test_two_clients_behind_the_same_last_hop_do_not_share_a_counter(self):
        self.assertNotEqual(
            key_behind(forwarded="198.51.100.9", cf="203.0.113.7"),
            key_behind(forwarded="198.51.100.9", cf="203.0.113.8"),
        )

    def test_without_cf_connecting_ip_the_last_forwarded_entry_counts_as_today(self):
        self.assertEqual(key_behind(forwarded="1.1.1.1, 198.51.100.9"), "198.51.100.9")

    def test_a_forged_leftmost_entry_never_wins(self):
        self.assertEqual(key_behind(forwarded="6.6.6.6, 198.51.100.9"), "198.51.100.9")
        self.assertEqual(
            key_behind(forwarded="6.6.6.6, 198.51.100.9", cf="203.0.113.7"), "203.0.113.7"
        )

    def test_a_cf_connecting_ipv6_is_grouped_by_its_64(self):
        self.assertEqual(key_behind(cf="2001:db8:1:2::1"), "2001:db8:1:2::/64")
        self.assertEqual(key_behind(cf="2001:db8:1:2::1"), key_behind(cf="2001:db8:1:2::ffff"))

    def test_an_invalid_cf_connecting_ip_falls_back_to_the_next_source(self):
        self.assertEqual(key_behind(forwarded="198.51.100.9", cf="abc"), "198.51.100.9")
        self.assertEqual(key_behind(remote="10.0.0.1", cf="abc"), "10.0.0.1")
        self.assertEqual(key_behind(remote="10.0.0.1", cf=""), "10.0.0.1")

    def test_true_client_ip_and_x_real_ip_are_never_read(self):
        self.assertEqual(
            key_behind(
                forwarded="198.51.100.9",
                HTTP_TRUE_CLIENT_IP="6.6.6.6",
                HTTP_X_REAL_IP="7.7.7.7",
            ),
            "198.51.100.9",
        )


@override_settings(CHECKOUT_TRUST_FORWARDED_FOR=False)
class NoProxyClientAddressTests(SimpleTestCase):
    def test_without_a_trusted_proxy_cf_connecting_ip_is_ignored(self):
        self.assertEqual(key_behind(remote="198.51.100.7", cf="203.0.113.7"), "198.51.100.7")
