"""Per-client limits for the store's public endpoints, counted in Django's cache.

The cache increments are atomic and a window is fixed when its counter is created, so a client
that keeps insisting cannot keep its window open. The counters live in the cache of the process:
enough for the one gunicorn worker of the deployment (render.yaml); more workers need a shared
cache.
"""

import ipaddress

from django.conf import settings
from django.core.cache import cache


def _key_of(address):
    """What a limit counts for an address.

    An IPv6 customer owns a whole /64 (a phone or a home rotates inside it), so counting the full
    address would hand a script millions of keys: every address of the /64 shares one. An IPv4
    address written as IPv6 counts as the IPv4, and text that is not an address stays as it is.
    """
    try:
        ip = ipaddress.ip_address(address)
        if ip.version == 6 and ip.ipv4_mapped is not None:
            return str(ip.ipv4_mapped)
        if ip.version == 6:
            return str(ipaddress.ip_network((ip, 64), strict=False))
        return str(ip)
    except ValueError:
        return address


def client_ip(request):
    """The key a limit counts: the proxy's own entry behind one, else REMOTE_ADDR."""
    if settings.CHECKOUT_TRUST_FORWARDED_FOR:
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        last = forwarded.rsplit(",", 1)[-1].strip()
        if last:
            return _key_of(last)
    return _key_of(request.META.get("REMOTE_ADDR", ""))


def count(key, window_seconds):
    """Count one more hit on `key` in its window and return the count."""
    cache.add(key, 0, window_seconds)
    try:
        return cache.incr(key)
    except ValueError:  # the counter expired between the two calls
        cache.set(key, 1, window_seconds)
        return 1


def too_many(request, scope, limit, window_seconds=60):
    """Count this request of the client under `scope`; True once it goes over `limit`."""
    return count(f"tienda:{scope}:{client_ip(request)}", window_seconds) > limit
