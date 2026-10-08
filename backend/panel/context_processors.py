"""Context processors of the panel."""

from django.conf import settings


def store_origin(request):
    """Expose the origin of the store, which owns the images the panel shows.

    The logo and the product pictures are files of the store (`/img/...`), not of
    Django, so a template links them as `{{ store_origin }}/img/...`.
    """
    return {"store_origin": settings.STORE_ORIGIN}
