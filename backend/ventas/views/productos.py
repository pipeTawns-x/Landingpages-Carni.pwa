"""The public catalogue (ventas:catalogo, /productos/) and the page of each product.

The catalogue is the store's products.html in Django; its old address answers with a 301, so
links, bookmarks and the service worker of the PWA land on the new page. Each card opens the page
of its product, where the customer configures the order the way the CodePen dPGYMxJ asked for
(Engram #541): by weight, by money or by pieces, the thickness of the cut and free notes. The
live summary asks the store (`quote_cart`) for the number; the browser never computes a price.
"""

from decimal import Decimal

from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views.decorators.http import require_safe

from ventas import catalog, domain, services
from ventas.forms import CartLineForm
from ventas.views.carrito import client_ip, line_data
from ventas.views.comun import listing, modes_of, moved_to

CATALOG_PER_PAGE = 24
SEARCH_RESULTS = 8
SEARCH_MIN_LENGTH = 2
# The order the configuration lists the ways of selling, the one of the CodePen.
MODE_ORDER = ("weight", "money", "pieces")
# The thickness slider when the panel gave no range: the one of the CodePen.
THICKNESS_DEFAULTS = {"min": Decimal("0.50"), "max": Decimal("3.00"), "default": Decimal("1.25")}
THICKNESS_STEP = "0.25"
# Live quotes per client address and minute: a person typing never reaches it, a script does.
QUOTES_PER_MINUTE = 90

products_html = moved_to("ventas:catalogo")


@require_safe
def catalogo(request):
    """The public catalogue: each card opens the configuration of its product. Reads only."""
    context = listing(request, CATALOG_PER_PAGE)
    return render(request, "ventas/tienda/productos.html", context)


def _thickness(product):
    spec = catalog.spec_of(product)

    def pick(field, key):
        value = getattr(spec, field, None) if spec is not None else None
        return value if value else THICKNESS_DEFAULTS[key]

    return {
        "min": pick("thickness_min_in", "min"),
        "max": pick("thickness_max_in", "max"),
        "default": pick("thickness_default_in", "default"),
        "step": THICKNESS_STEP,
    }


@require_safe
def producto(request, pk):
    """The page of a product with its configuration (ventas:producto, /productos/<id>/)."""
    product = get_object_or_404(catalog.active_products(), pk=pk)
    modes = dict(modes_of(product))
    context = {
        "product": product,
        "modes": [(mode, modes[mode]) for mode in MODE_ORDER if mode in modes],
        "units": domain.UNITS,
        "asks_thickness": catalog.asks_thickness(product),
        "thickness": _thickness(product),
        "relacionados": catalog.active_products()
        .filter(category=product.category)
        .exclude(pk=product.pk)[:4],
    }
    return render(request, "ventas/tienda/producto.html", context)


def _too_many_quotes(request):
    key = f"tienda:cotizar:{client_ip(request)}"
    cache.add(key, 0, timeout=60)
    try:
        return cache.incr(key) > QUOTES_PER_MINUTE
    except ValueError:  # the entry expired between add and incr
        return False


@require_safe
def cotizar(request, pk):
    """The live summary of the configuration: what the store charges for that one line, as JSON.

    It changes nothing (no cart, no order). A line the form refuses, or the store refuses, is a
    400 with the reason in words.
    """
    product = get_object_or_404(catalog.active_products(), pk=pk)
    if _too_many_quotes(request):
        return JsonResponse({"error": "Demasiadas consultas, espera un momento."}, status=429)
    form = CartLineForm(line_data(request.GET))
    if not form.is_valid():
        error = next(iter(form.errors.values()))[0]
        return JsonResponse({"error": error}, status=400)
    line = form.line_for(product.pk)
    try:
        quoted = services.get_gateway().quote_cart([line], domain.DEFAULT_CURRENCY).lines[0]
    except services.GatewayError as error:
        return JsonResponse({"error": domain.message_for(error.code)}, status=400)
    except services.GatewayUnavailable:
        return JsonResponse({"error": domain.UNAVAILABLE_MESSAGE}, status=503)
    return JsonResponse(
        {
            "total": f"{quoted.line_total_mxn:.2f}",
            "descuento": f"{quoted.discount_mxn:.2f}",
            "kg": f"{quoted.quantity_kg:.3f}",
            "piezas": quoted.pieces,
        }
    )


@require_safe
def buscar(request):
    """The live search of the header: up to eight active products whose name matches, as JSON.

    The search form itself is a plain GET to the catalogue, so this only speeds it up.
    """
    query = request.GET.get("q", "").strip()
    if len(query) < SEARCH_MIN_LENGTH:
        return JsonResponse({"resultados": []})
    products, _ = catalog.filtered(catalog.active_products(), query[:80], "")
    return JsonResponse(
        {
            "resultados": [
                {
                    "nombre": product.name,
                    "url": reverse("ventas:producto", args=[product.pk]),
                    "precio": f"{product.price_per_kg:.2f}",
                    "unidad": product.unit_label,
                    "imagen": product.image_src,
                }
                for product in products[:SEARCH_RESULTS]
            ]
        }
    )
