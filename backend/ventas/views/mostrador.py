"""The sale at the counter of the panel (/panel/ventas/): list, cart, process, order detail.

M16 asks for a `ventas` app whose views list the products, add them to a cart and process the
order. Here those three steps work on the real catalogue: every number comes from the Postgres
functions of the store (`ventas.services`), the cart in the session holds only what the staff
asked for, and an order is born in the database, never written by Django.

Every panel route is wrapped in `panel_admin_required` first and then in the check of its HTTP
method, so a visitor without a panel session is sent to the access bridge whatever the method.
"""

from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST, require_safe

from panel.access import PANEL_SESSION_KEY, panel_admin_required
from ventas import cart, catalog, domain, services
from ventas.forms import CartLineForm, OrderForm
from ventas.models import PanelOrder
from ventas.views.comun import currency_of, listing, modes_of, quote_rows, with_labels

SALE_PER_PAGE = 30


def _sale_context(request, currency, order_form=None):
    lines = cart.lines(request.session)
    rows, quote, currency, blocked = quote_rows(request, lines, currency)
    products = {
        product.pk: product
        for product in catalog.active_products().filter(
            pk__in=[r["line"]["product_id"] for r in rows]
        )
    }
    for row in rows:
        product = products.get(row["line"]["product_id"])
        row["product"] = product
        row["modes"] = modes_of(product) if product else []
        row["unit_choices"] = domain.UNITS
        row["warnings"] = [
            domain.WARNING_MESSAGES.get(code, code)
            for code in getattr(row.get("quote"), "warnings", [])
        ]
    context = listing(request, SALE_PER_PAGE)
    for product in context["page_obj"]:
        product.modes = modes_of(product)
        product.asks_thickness = catalog.asks_thickness(product)
    context.update(
        rows=rows,
        quote=quote,
        currency=currency,
        blocked=blocked,
        order_form=order_form or OrderForm(initial={"currency": currency}),
        units=domain.UNITS,
        delivery_labels=domain.DELIVERY_LABELS,
        channel_choices=[(c, domain.CHANNEL_LABELS[c]) for c in domain.STAFF_CHANNELS],
        payment_labels=domain.PAYMENT_LABELS,
        other_currency="MXN" if currency == "USD" else "USD",
    )
    return context


@panel_admin_required
@require_safe
def nueva(request):
    currency = currency_of(request.GET.get("currency"))
    return render(request, "ventas/ventas.html", _sale_context(request, currency))


def _save_line(request, product, success_text):
    """Validate the form, ask the store whether the line can be sold, and keep it."""
    form = CartLineForm(request.POST)
    if not form.is_valid():
        messages.error(request, form.first_error())
        return False
    line = form.line_for(product.pk)
    held = cart.lines(request.session)
    if cart.get(request.session, product.pk) is None and len(held) >= cart.MAX_LINES:
        messages.error(request, domain.ERROR_MESSAGES["too_many_lines"])
        return False
    try:
        services.get_gateway().quote_cart([line], domain.DEFAULT_CURRENCY)
    except services.GatewayError as error:
        messages.error(request, domain.message_for(error.code))
        return False
    except services.GatewayUnavailable:
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
        return False
    cart.put(request.session, line)
    messages.success(request, success_text.format(name=product.name))
    return True


@panel_admin_required
@require_POST
def carrito_agregar(request, pk):
    product = get_object_or_404(catalog.active_products(), pk=pk)
    _save_line(request, product, "{name} se agregó al carrito.")
    return redirect("ventas:nueva")


@panel_admin_required
@require_POST
def carrito_actualizar(request, pk):
    if cart.get(request.session, pk) is None:
        messages.warning(request, "Ese producto ya no estaba en el carrito.")
        return redirect("ventas:nueva")
    product = get_object_or_404(catalog.active_products(), pk=pk)
    _save_line(request, product, "Se actualizó {name}.")
    return redirect("ventas:nueva")


@panel_admin_required
@require_POST
def carrito_quitar(request, pk):
    if cart.remove(request.session, pk):
        messages.success(request, "Se quitó la línea del carrito.")
    else:
        messages.warning(request, "Ese producto ya no estaba en el carrito.")
    return redirect("ventas:nueva")


@panel_admin_required
@require_POST
def procesar(request):
    lines = cart.lines(request.session)
    if not lines:
        messages.error(request, "El carrito está vacío: agrega productos antes de procesar.")
        return redirect("ventas:nueva")

    form = OrderForm(request.POST)
    if form.is_valid():
        try:
            order_id = services.get_gateway().create_order_staff(
                items=lines,
                staff_ref=request.session.get(PANEL_SESSION_KEY),
                **form.order_values(),
            )
        except services.GatewayError as error:
            messages.error(request, domain.message_for(error.code))
        except services.GatewayUnavailable:
            messages.error(request, domain.UNAVAILABLE_MESSAGE)
        else:
            cart.clear(request.session)
            messages.success(request, "Pedido registrado.")
            return redirect("ventas:pedido_detalle", pk=order_id)

    currency = currency_of(form.data.get("currency"))
    return render(request, "ventas/ventas.html", _sale_context(request, currency, form))


@panel_admin_required
@require_safe
def pedido_detalle(request, pk):
    order = with_labels(get_object_or_404(PanelOrder, pk=pk))
    address = order.delivery_address if isinstance(order.delivery_address, dict) else {}
    context = {
        "order": order,
        "status_label": domain.STATUS_LABELS.get(order.status, order.status),
        "channel_label": domain.CHANNEL_LABELS.get(order.channel, order.channel),
        "payment_label": domain.PAYMENT_LABELS.get(order.payment_method or "", "Sin indicar"),
        "delivery_label": domain.DELIVERY_LABELS.get(order.delivery_type, order.delivery_type),
        "address": address.get("address", ""),
    }
    return render(request, "ventas/pedido_detalle.html", context)
