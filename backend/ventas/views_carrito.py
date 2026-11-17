"""The cart and the order of the public store: pick products, review the quote, place the order.

It is the M16 flow for the customer (list products, add them to a cart, process the order), on
the same pieces as the counter sale of the panel: the session cart holds only what was asked
(never a price), every number comes from `quote_cart`, and an order is born in the database.

The cart lives under its own session key, apart from the counter cart of the panel, so a staff
member selling at the counter and a customer browsing the store never share lines. Every page
works with plain forms; `static/tienda/carrito.js` only enhances the cart page.

The order is placed with `create_order_staff`, the only order function the `django` role may run
today. `create_order_v2` (channel `web`) answers to `auth.uid()` and is granted to the browser
role `authenticated` only, and the table ties `web` to a `user_id`. Until a function for the
store exists, `STORE_CHANNEL` is the channel the order is saved under, and the notes say where
it came from. When that function exists, only `_place_order` changes.
"""

from django import forms
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST, require_safe

from ventas import cart, catalog, domain, services, views
from ventas.forms import CartLineForm, phone_validator
from ventas.models import PanelOrder

PUBLIC_CART_KEY = "tienda_cart"
LAST_ORDER_KEY = "tienda_ultimo_pedido"
# `create_order_staff` accepts `mostrador` and `whatsapp` only: see the module docstring.
STORE_CHANNEL = "whatsapp"
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
            "channel": STORE_CHANNEL,
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


def _place_order(request, lines, form):
    """Create the order in the database. Return its id, or None after queuing the reason."""
    try:
        return services.get_gateway().create_order_staff(
            items=lines, staff_ref=None, **form.order_values()
        )
    except services.GatewayError as error:
        messages.error(request, domain.message_for(error.code))
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
