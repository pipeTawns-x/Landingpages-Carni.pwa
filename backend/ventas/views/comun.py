"""What the pages of `ventas` share: the product listing, the quote of a cart and the 301s.

The store (productos, carrito) and the counter sale of the panel (mostrador) list the same
catalogue and quote with the same Postgres function (`quote_cart`), so the steps live here once.
"""

from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpResponsePermanentRedirect
from django.urls import reverse
from django.views.decorators.http import require_safe

from inventory.models import Category
from ventas import catalog, domain, services


def page_of(request, products, per_page):
    return Paginator(products, per_page).get_page(request.GET.get("page"))


def listing(request, per_page):
    query = request.GET.get("q", "").strip()
    products, category_id = catalog.filtered(
        catalog.active_products(), query, request.GET.get("category", "").strip()
    )
    return {
        "page_obj": page_of(request, products, per_page),
        "categories": Category.objects.filter(is_active=True).order_by("order", "name"),
        "query": query,
        "selected_category": category_id,
    }


def moved_to(name):
    """A view for an old static address of the store: a 301 to its Django page, query kept."""

    @require_safe
    def view(request):
        target = reverse(name)
        if request.GET:
            target = f"{target}?{request.GET.urlencode()}"
        return HttpResponsePermanentRedirect(target)

    view.__name__ = f"moved_to_{name.replace(':', '_')}"
    return view


def _quote_lines(gateway, lines, currency):
    """Quote each line alone, after the whole cart was refused, to mark the ones at fault."""
    rows, blocked = [], False
    for line in lines:
        try:
            rows.append({"line": line, "quote": gateway.quote_cart([line], currency).lines[0]})
        except services.GatewayError as error:
            rows.append({"line": line, "error": domain.message_for(error.code)})
            blocked = True
    return rows, blocked


def quote_rows(request, lines, currency):
    """Quote the cart. Return (rows, quote or None, currency used, blocked)."""
    if not lines:
        return [], None, currency, True
    gateway = services.get_gateway()
    try:
        try:
            quote = gateway.quote_cart(lines, currency)
        except services.GatewayError as error:
            if error.code == "fx_unavailable" and currency == "USD":
                messages.warning(request, domain.ERROR_MESSAGES["fx_unavailable"])
                currency = domain.DEFAULT_CURRENCY
                quote = gateway.quote_cart(lines, currency)
            else:
                raise
    except services.GatewayError:
        rows, _ = _quote_lines(gateway, lines, currency)
        return rows, None, currency, True
    except services.GatewayUnavailable:
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
        return [{"line": line} for line in lines], None, currency, True
    rows = [
        {"line": line, "quote": quoted} for line, quoted in zip(lines, quote.lines, strict=True)
    ]
    return rows, quote, currency, False


def modes_of(product):
    return [(mode, domain.MODE_LABELS[mode]) for mode in catalog.sale_modes(product)]


def currency_of(value):
    return value if value in domain.CURRENCY_LABELS else domain.DEFAULT_CURRENCY


def with_labels(order):
    order.status_label = domain.STATUS_LABELS.get(order.status, order.status)
    order.channel_label = domain.CHANNEL_LABELS.get(order.channel, order.channel)
    order.moves = [(to, domain.MOVE_LABELS[to]) for to in domain.TRANSITIONS.get(order.status, ())]
    return order
