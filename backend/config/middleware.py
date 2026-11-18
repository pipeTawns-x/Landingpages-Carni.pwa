"""Middleware of the whole site."""

from django.conf import settings
from django.http import HttpResponse


class RequestBodyLimitMiddleware:
    """Refuse a request whose declared body is larger than MAX_REQUEST_BODY_BYTES, with 413.

    Django caps a form's fields (DATA_UPLOAD_MAX_MEMORY_SIZE) but not an uploaded file, which it
    spools to disk however large it is, and the free hosting puts no cap in front of the app. The
    check reads only the Content-Length header, so an oversized body is never read. A body sent
    without that header is not a way around it: Django reads exactly Content-Length bytes, so it
    reads nothing.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            declared = int(request.META.get("CONTENT_LENGTH") or 0)
        except ValueError:
            declared = 0
        if declared > settings.MAX_REQUEST_BODY_BYTES:
            return HttpResponse(
                "La solicitud es demasiado grande.",
                status=413,
                content_type="text/plain; charset=utf-8",
            )
        return self.get_response(request)


def _content_security_policy(path):
    """The CSP of a response, as one header value. See SecurityHeadersMiddleware."""
    supabase = settings.SUPABASE_URL
    styles = "'self' 'unsafe-inline'" if path.startswith("/admin/") else "'self'"
    policy = [
        "default-src 'self'",
        "script-src 'self'",
        f"style-src {styles}",
        f"img-src 'self' data: {supabase}",
        "font-src 'self'",
        "media-src 'self'",
        f"connect-src 'self' {supabase}",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ]
    if settings.SECURE_SSL_REDIRECT:
        policy.append("upgrade-insecure-requests")
    return "; ".join(policy)


PERMISSIONS_POLICY = ", ".join(
    f"{feature}=()"
    for feature in (
        "accelerometer",
        "camera",
        "geolocation",
        "gyroscope",
        "magnetometer",
        "microphone",
        "payment",
        "usb",
        "browsing-topics",
    )
)


class SecurityHeadersMiddleware:
    """The headers Django's SecurityMiddleware does not set, on every response.

    - Content-Security-Policy: scripts, styles, fonts and media only from the site; images also
      from the Supabase Storage of the project, connections also to Supabase (the access page
      signs in from the browser). No inline script runs anywhere; only Django's admin keeps
      inline styles. No frames around the site, no plugins, forms post only to the site.
    - Permissions-Policy: the device features the store never uses are off.
    - Cross-Origin-Resource-Policy: other sites cannot embed a response.

    A view that sets one of them itself keeps its own.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.headers.setdefault(
            "Content-Security-Policy", _content_security_policy(request.path)
        )
        response.headers.setdefault("Permissions-Policy", PERMISSIONS_POLICY)
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        return response
