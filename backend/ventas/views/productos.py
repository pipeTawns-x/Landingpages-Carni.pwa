"""The public catalogue (ventas:catalogo, /productos/) and the page of each product.

The catalogue is the store's products.html in Django; its old address answers with a 301, so
links, bookmarks and the service worker of the PWA land on the new page. Each card opens the page
of its product, where the customer configures the order the way the CodePen dPGYMxJ asked for
(Engram #541): by weight, by money or by pieces, the thickness of the cut and free notes. The
live summary asks the store (`quote_cart`) for the number; the browser never computes a price.
"""

from decimal import Decimal

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views.decorators.cache import cache_control, never_cache
from django.views.decorators.http import require_safe

from ventas import catalog, domain, services, throttle
from ventas.forms import CartLineForm
from ventas.views.carrito import line_data
from ventas.views.comun import currency_of, listing, modes_of, moved_to

# One template with two modes: the catalogue when the context has no `product`, the page of a
# product when it has one.
PRODUCTS_TEMPLATE = "ventas/productos.html"
CATALOG_PER_PAGE = 24
SEARCH_RESULTS = 8
SEARCH_MIN_LENGTH = 2
# The order the configuration lists the ways of selling, the one of the CodePen.
MODE_ORDER = ("weight", "money", "pieces")
# The thickness slider when the panel gave no range: the one of the CodePen.
THICKNESS_DEFAULTS = {"min": Decimal("0.50"), "max": Decimal("3.00"), "default": Decimal("1.25")}
THICKNESS_STEP = "0.25"
# Live quotes and searches per client address and minute: a person typing never reaches them, a
# script does.
QUOTES_PER_MINUTE = 90
SEARCHES_PER_MINUTE = 120

products_html = moved_to("ventas:catalogo")


@require_safe
def catalogo(request):
    """The public catalogue: each card opens the configuration of its product. Reads only."""
    context = listing(request, CATALOG_PER_PAGE)
    return render(request, PRODUCTS_TEMPLATE, context)


def _thickness(product):
    spec = catalog.spec_of(product)

    def pick(field, key):
        value = getattr(spec, field, None) if spec is not None else None
        return value if value else THICKNESS_DEFAULTS[key]

    low, high = pick("thickness_min_in", "min"), pick("thickness_max_in", "max")
    marks, mark = [], low
    while mark <= high:
        marks.append(mark)
        mark += Decimal("0.5")
    return {
        "min": low,
        "max": high,
        "default": pick("thickness_default_in", "default"),
        "step": THICKNESS_STEP,
        "marcas": marks,
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
    return render(request, PRODUCTS_TEMPLATE, context)


@never_cache
@require_safe
def cotizar(request, pk):
    """The live summary of the configuration: what the store charges for that one line, as JSON.

    It changes nothing (no cart, no order) and is never cached: prices and the exchange rate move.
    The limit per client is checked before anything is read. A line the form refuses, or the
    store refuses, is a 400 with the reason in words; a product that is not sold is a 404 in
    JSON too, so the script reads one shape; without the store, a 503.

    `currency` (MXN, or USD to read a money amount as dollars) goes to the store as is; the answer
    carries the dollars when the store has a valid rate, and the warnings as sentences.
    """
    if throttle.too_many(request, "cotizar", QUOTES_PER_MINUTE):
        return JsonResponse({"error": domain.TOO_MANY_REQUESTS_MESSAGE}, status=429)
    product = catalog.active_products().filter(pk=pk).first()
    if product is None:
        return JsonResponse({"error": domain.ERROR_MESSAGES["product_not_found"]}, status=404)
    form = CartLineForm(line_data(request.GET))
    if not form.is_valid():
        error = next(iter(form.errors.values()))[0]
        return JsonResponse({"error": error}, status=400)
    line = form.line_for(product.pk)
    currency = currency_of(request.GET.get("currency"))
    try:
        quoted = services.get_gateway().quote_cart([line], currency).lines[0]
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
            "moneda": currency,
            "total_usd": None if quoted.line_total_usd is None else f"{quoted.line_total_usd:.2f}",
            "avisos": [domain.WARNING_MESSAGES.get(code, code) for code in quoted.warnings],
        }
    )


@cache_control(private=True, max_age=30)
@require_safe
def buscar(request):
    """The live search of the header: up to eight active products whose name matches, as JSON.

    The search form itself is a plain GET to the catalogue, so this only speeds it up. Limited
    per client; the browser may keep an answer for 30 seconds, no shared cache may.
    """
    if throttle.too_many(request, "buscar", SEARCHES_PER_MINUTE):
        return JsonResponse({"resultados": [], "error": "Demasiadas búsquedas."}, status=429)
    query = request.GET.get("q", "").strip()
    if len(query) < SEARCH_MIN_LENGTH:
        return JsonResponse({"resultados": []})
    products, _ = catalog.filtered(
        catalog.active_products(), query[: catalog.SEARCH_MAX_LENGTH], ""
    )
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
