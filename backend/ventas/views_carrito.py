"""The cart and the order of the public store: pick products, review the quote, place the order.

It is the M16 flow for the customer (list products, add them to a cart, process the order), on
the same pieces as the counter sale of the panel: the session cart holds only what was asked
(never a price), every number comes from `quote_cart`, and an order is born in the database.

The cart lives under its own session key, apart from the counter cart of the panel, so a staff
member selling at the counter and a customer browsing the store never share lines. Every page
works with plain forms; `static/tienda/carrito.js` only enhances the cart page.

The order is placed with `create_order_web` (channel `web`, no user, the rule of three pending
orders per phone), the one function of the store for a customer without a session. Until the
migration that creates it is applied, `create_order_staff` with the channel `whatsapp` takes its
place and a warning is logged, so the store keeps selling. Anonymous checkout is throttled per
client IP and per session (`CHECKOUT_THROTTLE_*` in settings).
"""

import logging

from django import forms
from django.conf import settings
from django.contrib import messages
from django.core.cache import cache
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST, require_safe

from ventas import cart, catalog, domain, services, views
from ventas.forms import CartLineForm, phone_validator
from ventas.models import PanelOrder

logger = logging.getLogger("ventas.checkout")

PUBLIC_CART_KEY = "tienda_cart"
LAST_ORDER_KEY = "tienda_ultimo_pedido"
STORE_CHANNEL = "web"
# Only for the fallback: `create_order_staff` accepts `mostrador` and `whatsapp` only.
FALLBACK_CHANNEL = "whatsapp"
# What a customer reads where `domain.ERROR_MESSAGES` is worded for the staff.
STORE_MESSAGES = {
    "too_many_pending": (
        "Este teléfono ya tiene 3 pedidos pendientes. Espera a que la carnicería los "
        "atienda o escríbenos por WhatsApp."
    ),
}
THROTTLED_MESSAGE = (
    "Hiciste demasiados intentos de pedido en poco tiempo. "
    "Espera un rato e inténtalo de nuevo, o escríbenos por WhatsApp."
)
STORE_NOTE = "[Tienda en línea]"
NOTES_MAX = 450  # what is left of the 500 of the database after the marker above


class _PublicSlot:
    """The session seen through the public key, so `ventas.cart` keeps one set of rules."""

    def __init__(self, session):
        self._session = session

    def get(self, key, default=None):
        return self._session.get(PUBLIC_CART_KEY, default)

    def __setitem__(self, key, value):
        self._session[PUBLIC_CART_KEY] = value

    def pop(self, key, default=None):
        return self._session.pop(PUBLIC_CART_KEY, default)


def _slot(request):
    return _PublicSlot(request.session)


def public_lines(request):
    return cart.lines(_slot(request))


class StoreOrderForm(forms.Form):
    """The data of the customer. No price, no channel and no status: the browser names none."""

    customer_name = forms.CharField(
        max_length=120,
        error_messages={
            "required": "Escribe tu nombre.",
            "max_length": "El nombre es demasiado largo.",
        },
    )
    customer_phone = forms.CharField(
        max_length=20,
        validators=[phone_validator],
        error_messages={
            "required": "Escribe tu teléfono para avisarte de tu pedido.",
            "max_length": "El teléfono es demasiado largo.",
        },
    )
    delivery_type = forms.ChoiceField(
        choices=list(domain.DELIVERY_LABELS.items()),
        error_messages={
            "required": "Elige si recoges o quieres envío.",
            "invalid_choice": "Elige si recoges o quieres envío.",
        },
    )
    delivery_address = forms.CharField(max_length=1000, required=False)
    payment_method = forms.ChoiceField(
        choices=list(domain.PAYMENT_LABELS.items()),
        required=False,
        error_messages={"invalid_choice": "Elige una forma de pago de la lista."},
    )
    notes = forms.CharField(
        max_length=NOTES_MAX,
        required=False,
        error_messages={"max_length": "Las notas son demasiado largas."},
    )
    currency = forms.ChoiceField(choices=list(domain.CURRENCY_LABELS.items()))

    def clean(self):
        data = super().clean()
        if data.get("delivery_type") == "delivery" and not data.get("delivery_address"):
            self.add_error("delivery_address", "Un envío necesita la dirección de entrega.")
        return data

    def order_values(self):
        data = self.cleaned_data
        delivery = data["delivery_type"] == "delivery"
        notes = f"{STORE_NOTE} {data['notes']}".strip()
        return {
            "customer_name": data["customer_name"],
            "customer_phone": data["customer_phone"],
            "delivery_type": data["delivery_type"],
            "delivery_address": {"address": data["delivery_address"]} if delivery else {},
            "notes": notes,
            "currency": data["currency"],
            "payment_method": data["payment_method"] or None,
        }


def _line_data(post):
    """The fields of the line form with the ones that do not apply to the mode dropped.

    The forms of the store show the weight unit and the thickness together, so a customer who
    picks "por dinero" still sends a unit; that is not an error, it is just not used.
    """
    data = post.copy()
    mode = data.get("mode")
    if mode != "weight":
        data["unit"] = ""
    if mode != "pieces":
        data["thickness_in"] = ""
    return data


def _safe_next(request, default):
    target = request.POST.get("next", "")
    allowed = url_has_allowed_host_and_scheme(
        target, allowed_hosts={request.get_host()}, require_https=request.is_secure()
    )
    return target if allowed else default


def _quote_ok(request, line):
    """Ask the store whether the line can be sold. Say why not and return False if it cannot."""
    try:
        services.get_gateway().quote_cart([line], domain.DEFAULT_CURRENCY)
    except services.GatewayError as error:
        messages.error(request, domain.message_for(error.code))
        return False
    except services.GatewayUnavailable:
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
        return False
    return True


def _save_line(request, product, success_text):
    form = CartLineForm(_line_data(request.POST))
    if not form.is_valid():
        messages.error(request, form.first_error())
        return False
    line = form.line_for(product.pk)
    slot = _slot(request)
    if cart.get(slot, product.pk) is None and len(cart.lines(slot)) >= cart.MAX_LINES:
        messages.error(request, domain.ERROR_MESSAGES["too_many_lines"])
        return False
    if not _quote_ok(request, line):
        return False
    cart.put(slot, line)
    messages.success(request, success_text.format(name=product.name))
    return True


@require_POST
def agregar(request, pk):
    product = get_object_or_404(catalog.active_products(), pk=pk)
    _save_line(request, product, "{name} se agregó a tu carrito.")
    return redirect(_safe_next(request, "ventas:catalogo"))


@require_POST
def actualizar(request, pk):
    if cart.get(_slot(request), pk) is None:
        messages.warning(request, "Ese producto ya no estaba en tu carrito.")
        return redirect("ventas:carrito")
    product = get_object_or_404(catalog.active_products(), pk=pk)
    _save_line(request, product, "Se actualizó {name}.")
    return redirect("ventas:carrito")


@require_POST
def quitar(request, pk):
    if cart.remove(_slot(request), pk):
        messages.success(request, "Se quitó el producto de tu carrito.")
    else:
        messages.warning(request, "Ese producto ya no estaba en tu carrito.")
    return redirect("ventas:carrito")


@require_safe
def catalogo(request):
    """The public catalogue with a form to add each product: the ways it can be sold come from
    `ventas.catalog`, the same source the counter sale uses. Reads only; no database function."""
    context = views._listing(request, views.CATALOG_PER_PAGE)
    for product in context["page_obj"]:
        product.modes = views._modes(product)
        product.asks_thickness = catalog.asks_thickness(product)
    context["units"] = domain.UNITS
    return render(request, "ventas/tienda/productos.html", context)


def _cart_context(request, currency, order_form=None):
    lines = public_lines(request)
    rows, quote, currency, blocked = views._quote(request, lines, currency)
    products = {
        product.pk: product
        for product in catalog.active_products().filter(
            pk__in=[line["product_id"] for line in lines]
        )
    }
    for row in rows:
        product = products.get(row["line"]["product_id"])
        row["product"] = product
        row["modes"] = views._modes(product) if product else []
        row["asks_thickness"] = bool(product) and catalog.asks_thickness(product)
        row["warnings"] = [
            domain.WARNING_MESSAGES.get(code, code)
            for code in getattr(row.get("quote"), "warnings", [])
        ]
        if product is None and "error" not in row:
            row["error"] = domain.ERROR_MESSAGES["product_not_found"]
            blocked = True
    return {
        "rows": rows,
        "quote": quote,
        "currency": currency,
        "other_currency": "MXN" if currency == "USD" else "USD",
        "blocked": blocked,
        "order_form": order_form or StoreOrderForm(initial={"currency": currency}),
        "units": domain.UNITS,
        "delivery_labels": domain.DELIVERY_LABELS,
        "payment_labels": domain.PAYMENT_LABELS,
    }


@require_safe
def carrito(request):
    currency = views._currency_of(request.GET.get("currency"))
    return render(request, "ventas/tienda/carrito.html", _cart_context(request, currency))


def _client_ip(request):
    """The address the throttle counts: the proxy's own entry behind one, else REMOTE_ADDR."""
    if settings.CHECKOUT_TRUST_FORWARDED_FOR:
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        last = forwarded.rsplit(",", 1)[-1].strip()
        if last:
            return last
    return request.META.get("REMOTE_ADDR", "")


def _throttled(request):
    """Count this attempt against the IP and the session; True when either is over the limit.

    The cache increments are atomic and the window is fixed when a counter is created, so a
    blocked client cannot keep its window open by insisting.
    """
    keys = [f"checkout-throttle:ip:{_client_ip(request)}"]
    if request.session.session_key:
        keys.append(f"checkout-throttle:session:{request.session.session_key}")
    over = False
    for key in keys:
        cache.add(key, 0, settings.CHECKOUT_THROTTLE_WINDOW_SECONDS)
        try:
            count = cache.incr(key)
        except ValueError:  # the counter expired between the two calls
            cache.set(key, 1, settings.CHECKOUT_THROTTLE_WINDOW_SECONDS)
            count = 1
        over = over or count > settings.CHECKOUT_THROTTLE_LIMIT
    return over


def _place_order(request, lines, form):
    """Create the order in the database. Return its id, or None after queuing the reason."""
    gateway = services.get_gateway()
    values = form.order_values()
    try:
        try:
            return gateway.create_order_web(items=lines, **values)
        except services.GatewayFunctionMissing as missing:
            if not missing.function.endswith("create_order_web"):
                raise
            logger.warning(
                "create_order_web is missing in the database (apply the migration "
                "20261117000002_create_order_web.sql): saving the order as %s through "
                "create_order_staff",
                FALLBACK_CHANNEL,
            )
            return gateway.create_order_staff(
                items=lines, staff_ref=None, channel=FALLBACK_CHANNEL, **values
            )
    except services.GatewayError as error:
        messages.error(request, STORE_MESSAGES.get(error.code) or domain.message_for(error.code))
    except services.GatewayUnavailable:
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
    return None


@require_POST
def pedido(request):
    lines = public_lines(request)
    if not lines:
        messages.error(request, "Tu carrito está vacío: agrega productos antes de pedir.")
        return redirect("ventas:carrito")

    form = StoreOrderForm(request.POST)
    if form.is_valid():
        if _throttled(request):
            messages.error(request, THROTTLED_MESSAGE)
            currency = views._currency_of(form.cleaned_data["currency"])
            context = _cart_context(request, currency, form)
            return render(request, "ventas/tienda/carrito.html", context, status=429)
        order_id = _place_order(request, lines, form)
        if order_id is not None:
            cart.clear(_slot(request))
            request.session[LAST_ORDER_KEY] = str(order_id)
            return redirect("ventas:pedido_confirmado")

    currency = views._currency_of(form.data.get("currency"))
    return render(request, "ventas/tienda/carrito.html", _cart_context(request, currency, form))


@require_safe
def confirmado(request):
    """The thank-you page: the short id and the total the database stored for the last order.

    It reads only the order this session just placed, never one named in the address, so nobody
    can read another customer's order by guessing it.
    """
    order = None
    try:
        order = PanelOrder.objects.filter(pk=request.session.get(LAST_ORDER_KEY)).first()
    except (ValueError, TypeError, forms.ValidationError):
        order = None
    if order is None:
        return redirect("ventas:catalogo")
    context = {
        "order": order,
        "short_id": str(order.pk)[:8],
        "delivery_label": domain.DELIVERY_LABELS.get(order.delivery_type, order.delivery_type),
    }
    return render(request, "ventas/tienda/pedido_confirmado.html", context)
