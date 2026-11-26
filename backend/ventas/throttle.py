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


def _valid_ip(text):
    """`text` stripped if it is an IP address, else None."""
    text = text.strip()
    try:
        ipaddress.ip_address(text)
    except ValueError:
        return None
    return text


def client_ip(request):
    """The key a limit counts for the client of `request` (audit F-04).

    Behind the proxy (Cloudflare, then Render's load balancer), the client is CF-Connecting-IP:
    Cloudflare sets it and refuses a request whose client sent its own (error 1000). If it is
    missing or not an IP, the last X-Forwarded-For entry, the one the proxy appended; the earlier
    entries are written by the client and are never read, nor True-Client-IP or X-Real-IP.
    Without a trusted proxy every header is the client's own, so only REMOTE_ADDR counts.
    Invariant: a caller on Render's private network skips Cloudflare and can set
    CF-Connecting-IP; if a service there ever calls Django, this rule has to be reviewed.
    """
    if settings.CHECKOUT_TRUST_FORWARDED_FOR:
        connecting = _valid_ip(request.META.get("HTTP_CF_CONNECTING_IP", ""))
        if connecting:
            return _key_of(connecting)
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
