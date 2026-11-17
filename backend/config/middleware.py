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
