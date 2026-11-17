"""Sign in and sign up: the static accessweb.html, migrated into Django (ventas:acceso)."""

from django.shortcuts import render
from django.views.decorators.http import require_safe


@require_safe
def acceso(request):
    """One page to sign in and to create an account."""
    return render(request, "ventas/tienda/acceso.html")
