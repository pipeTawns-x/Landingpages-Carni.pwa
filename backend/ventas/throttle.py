"""Per-client limits for the store's public endpoints, counted in Django's cache.

The cache increments are atomic and a window is fixed when its counter is created, so a client
that keeps insisting cannot keep its window open. The counters live in the cache of the process:
enough for the one gunicorn worker of the deployment (render.yaml); more workers need a shared
cache.
"""

from django.conf import settings
from django.core.cache import cache


def client_ip(request):
    """The address a limit counts: the proxy's own entry behind one, else REMOTE_ADDR."""
    if settings.CHECKOUT_TRUST_FORWARDED_FOR:
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        last = forwarded.rsplit(",", 1)[-1].strip()
        if last:
            return last
    return request.META.get("REMOTE_ADDR", "")


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
