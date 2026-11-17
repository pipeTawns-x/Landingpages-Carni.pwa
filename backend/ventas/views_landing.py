"""The store's landing page: the static index.html, migrated into Django (ventas:landing, /)."""

from django.shortcuts import render
from django.views.decorators.http import require_safe


@require_safe
def landing(request):
    """The landing page of the store."""
    return render(request, "ventas/tienda/landing.html")
