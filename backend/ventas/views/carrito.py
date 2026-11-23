"""The cart and the order of the public store: pick products, review the quote, place the order.

It is the M16 flow for the customer (list products, add them to a cart, process the order), on
the same pieces as the counter sale of the panel: the session cart holds only what was asked
(never a price), every number comes from `quote_cart`, and an order is born in the database.

The cart lives under its own session key, apart from the counter cart of the panel, so a staff
member selling at the counter and a customer browsing the store never share lines. Every page
works with plain forms (POST, redirect, GET); `static/tienda/carrito.js` only enhances the cart
page. A script that sends `Accept: application/json` gets the same writes as JSON instead of the
redirect (docs/datos/contrato-productos.md, section 5), under the same CSRF rule and the same
limit of writes per client. The catalogue that feeds it is `ventas.views.productos`.

The order is placed with `create_order_web` (channel `web`, no user, the rule of three pending
orders per phone and the seven digits of the phone), the one function of the store for a
customer without a session. Until the migration that creates it is applied the store refuses the
order and logs an error that names the migration: `create_order_staff` has none of those checks
and would file the guest order as one of the staff, so it never takes its place. Anonymous
checkout is throttled per client IP and per session (`CHECKOUT_THROTTLE_*` in settings).
"""

import logging

from django import forms
from django.conf import settings
from django.contrib import messages
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST, require_safe

from ventas import cart, catalog, domain, services, throttle
from ventas.context_processors import bag_payload
from ventas.forms import CartLineForm, store_phone_validator
from ventas.models import PanelOrder
from ventas.throttle import client_ip
from ventas.views.comun import currency_of, modes_of, quote_rows, wants_json

logger = logging.getLogger("ventas.checkout")

PUBLIC_CART_KEY = cart.PUBLIC_SESSION_KEY
LAST_ORDER_KEY = "tienda_ultimo_pedido"
STORE_CHANNEL = "web"
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
# Writes to the cart (add, update, remove) per client address and minute. Each one asks the
# store for a quote, so a script must not be able to hammer the database through them.
CART_WRITES_PER_MINUTE = 60
STORE_NOTE = "[Tienda en línea]"
NOTES_MAX = 450  # a margin under the 500 of the database once the marker above is prepended


def _slot(request):
    return cart.PublicSlot(request.session)


def public_lines(request):
    return cart.public_lines(request.session)


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
        validators=[store_phone_validator],
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


def line_data(post):
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


def _refusal(line):
    """Ask the store whether the line can be sold: (status, sentence) if not, else None."""
    try:
        services.get_gateway().quote_cart([line], domain.DEFAULT_CURRENCY)
    except services.GatewayError as error:
        return 400, domain.message_for(error.code)
    except services.GatewayUnavailable:
        return 503, domain.UNAVAILABLE_MESSAGE
    return None


def _save_line(request, product, success_text):
    """Check the line, ask the store, keep it. Return the (status, sentence) of the outcome."""
    form = CartLineForm(line_data(request.POST))
    if not form.is_valid():
        return 400, form.first_error()
    line = form.line_for(product.pk)
    slot = _slot(request)
    if cart.get(slot, product.pk) is None and len(cart.lines(slot)) >= cart.MAX_LINES:
        return 409, domain.ERROR_MESSAGES["too_many_lines"]
    refusal = _refusal(line)
    if refusal is not None:
        return refusal
    cart.put(slot, line)
    return 200, success_text.format(name=product.name)


def _answer(request, status, text, target, level=None):
    """Say how a write of the cart ended, the way the client asked for it.

    A script that sent `Accept: application/json` gets JSON and the same status; the cart is read
    only when the write worked, so a refusal costs no query (the database may be what failed). A
    form gets the message in the session and a redirect to `target`, as it always had.
    """
    if wants_json(request):
        if status == 200:
            body = {"ok": True, "mensaje": text, "carrito": bag_payload(request)}
        else:
            body = {"ok": False, "error": text}
        return JsonResponse(body, status=status)
    if level == "warning":
        show = messages.warning
    elif status == 200:
        show = messages.success
    else:
        show = messages.error
    show(request, text)
    return redirect(target)


def _over_the_limit(request):
    return throttle.too_many(request, "carrito", CART_WRITES_PER_MINUTE)


def _not_in_the_cart(request, target):
    return _answer(request, 404, "Ese producto ya no estaba en tu carrito.", target, "warning")


def _product_gone(request, target):
    """A product that is not sold (anymore): a 404 page for a form, a 404 in JSON for a script."""
    if not wants_json(request):
        raise Http404
    return _answer(request, 404, domain.ERROR_MESSAGES["product_not_found"], target)


@require_POST
def agregar(request, pk):
    target = _safe_next(request, "ventas:catalogo")
    if _over_the_limit(request):
        return _answer(request, 429, domain.TOO_MANY_REQUESTS_MESSAGE, target)
    product = catalog.active_products().filter(pk=pk).first()
    if product is None:
        return _product_gone(request, target)
    status, text = _save_line(request, product, "{name} se agregó a tu carrito.")
    return _answer(request, status, text, target)


@require_POST
def actualizar(request, pk):
    target = _safe_next(request, "ventas:carrito")
    if _over_the_limit(request):
        return _answer(request, 429, domain.TOO_MANY_REQUESTS_MESSAGE, target)
    if cart.get(_slot(request), pk) is None:
        return _not_in_the_cart(request, target)
    product = catalog.active_products().filter(pk=pk).first()
    if product is None:
        return _product_gone(request, target)
    status, text = _save_line(request, product, "Se actualizó {name}.")
    return _answer(request, status, text, target)


@require_POST
def quitar(request, pk):
    target = _safe_next(request, "ventas:carrito")
    if _over_the_limit(request):
        return _answer(request, 429, domain.TOO_MANY_REQUESTS_MESSAGE, target)
    if not cart.remove(_slot(request), pk):
        return _not_in_the_cart(request, target)
    return _answer(request, 200, "Se quitó el producto de tu carrito.", target)


def _cart_context(request, currency, order_form=None, ask_store=True):
    """What the cart page shows. Its quote is the one call to the database of the page, so it
    spends the budget of the client like a write does (`CART_WRITES_PER_MINUTE`).

    Over the budget, or when the caller says `ask_store=False` (a checkout that was refused
    already), the lines are listed with no quote and the order button blocked: the page answers
    without reaching the database. An empty cart asks nothing and spends nothing.
    """
    lines = public_lines(request)
    over_the_limit = bool(lines) and ask_store and _over_the_limit(request)
    if over_the_limit:
        messages.error(request, domain.TOO_MANY_REQUESTS_MESSAGE)
    if lines and ask_store and not over_the_limit:
        rows, quote, currency, blocked = quote_rows(request, lines, currency)
    else:
        rows, quote, blocked = [{"line": line} for line in lines], None, True
    products = {
        product.pk: product
        for product in catalog.active_products().filter(
            pk__in=[line["product_id"] for line in lines]
        )
    }
    for row in rows:
        product = products.get(row["line"]["product_id"])
        row["product"] = product
        row["modes"] = modes_of(product) if product else []
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
        "over_the_limit": over_the_limit,
    }


def _cart_page(request, context, status=None):
    """Draw the cart page: a 429 when the client is over its budget, `status` if given."""
    if status is None:
        status = 429 if context["over_the_limit"] else 200
    return render(request, "ventas/tienda/carrito.html", context, status=status)


@require_safe
def carrito(request):
    currency = currency_of(request.GET.get("currency"))
    return _cart_page(request, _cart_context(request, currency))


def _throttled(request):
    """Count this attempt against the IP and the session; True when either is over the limit.

    The cache increments are atomic and the window is fixed when a counter is created, so a
    blocked client cannot keep its window open by insisting.
    """
    keys = [f"checkout-throttle:ip:{client_ip(request)}"]
    if request.session.session_key:
        keys.append(f"checkout-throttle:session:{request.session.session_key}")
    window = settings.CHECKOUT_THROTTLE_WINDOW_SECONDS
    counts = [throttle.count(key, window) for key in keys]
    return any(n > settings.CHECKOUT_THROTTLE_LIMIT for n in counts)


def _place_order(request, lines, form):
    """Create the order in the database. Return its id, or None after queuing the reason."""
    gateway = services.get_gateway()
    values = form.order_values()
    try:
        return gateway.create_order_web(items=lines, **values)
    except services.GatewayError as error:
        messages.error(request, STORE_MESSAGES.get(error.code) or domain.message_for(error.code))
    except services.GatewayFunctionMissing as missing:
        # Fail closed: no other function may take its place (see the module docstring).
        logger.error(
            "The database lacks %s, so the order is refused (create_order_web comes from the "
            "migration 20261117000002_create_order_web.sql)",
            missing.function,
        )
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
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
            currency = currency_of(form.cleaned_data["currency"])
            context = _cart_context(request, currency, form, ask_store=False)
            return _cart_page(request, context, status=429)
        order_id = _place_order(request, lines, form)
        if order_id is not None:
            cart.clear(_slot(request))
            request.session[LAST_ORDER_KEY] = str(order_id)
            return redirect("ventas:pedido_confirmado")

    currency = currency_of(form.data.get("currency"))
    return _cart_page(request, _cart_context(request, currency, form))


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
