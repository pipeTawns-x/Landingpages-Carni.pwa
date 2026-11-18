"""Sign in and sign up: the static accessweb.html, migrated into Django (ventas:acceso)."""

from django.conf import settings
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from ventas.views.comun import moved_to

accessweb_html = moved_to("ventas:acceso")


@never_cache
@require_safe
def acceso(request):
    """One page to sign in and to create an account.

    Supabase Auth does the signing in, from the browser (static/tienda/acceso.js). The page only
    receives the public values it needs: the project URL and the publishable key. Whoever loads
    `?salir=1` (the panel sends people there after closing its session) is signed out of Supabase
    too. Without the publishable key the page cannot work, so it says so with a 503.
    """
    key = settings.SUPABASE_PUBLISHABLE_KEY
    context = {
        "configurado": bool(key),
        "supabase_url": settings.SUPABASE_URL,
        "supabase_key": key,
        "supabase_js": static("tienda/vendor/supabase-js.mjs"),
        "sesion_url": reverse("panel:sesion"),
        "panel_url": reverse("panel:inicio"),
        "tienda_url": reverse("ventas:catalogo"),
        "salir": request.GET.get("salir") == "1",
        "admin": request.GET.get("admin") == "true",
    }
    return render(request, "ventas/tienda/acceso.html", context, status=200 if key else 503)
