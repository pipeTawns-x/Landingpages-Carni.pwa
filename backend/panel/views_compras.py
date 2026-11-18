"""Compras y stock (/panel/compras/, panel:compras): what came in and what is on the shelf.

Two POST forms with Django's CSRF token share the page, told apart by `action`:
`purchase` calls `register_purchase` (the function applies the yield, the cost per kilo and the
stock) and `count` calls `adjust_stock` (a physical count with its reason). Both go through the
gateway, then redirect (POST/redirect/GET). The lots come from `panel_purchase_performance`.
"""

from django import forms
from django.contrib import messages
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from inventory.forms import NUMBER, SELECT, TEXT
from inventory.models import Product
from panel.access import PANEL_SESSION_KEY, panel_admin_required
from ventas import domain, services

MAX_AMOUNT_DIGITS = 10


def _product_field():
    return forms.ModelChoiceField(
        label="Producto",
        queryset=Product.objects.order_by("name"),
        empty_label="Elige un producto",
        widget=forms.Select(attrs={"class": SELECT}),
        error_messages={
            "required": "Elige un producto.",
            "invalid_choice": "Ese producto ya no existe.",
        },
    )


def _amount_field(label, decimals, help_text=""):
    return forms.DecimalField(
        label=label,
        max_digits=MAX_AMOUNT_DIGITS,
        decimal_places=decimals,
        help_text=help_text,
        widget=forms.NumberInput(
            attrs={"class": NUMBER, "step": "any", "inputmode": "decimal", "min": "0"}
        ),
        error_messages={
            "required": "Este dato es obligatorio.",
            "invalid": "Escribe un número, por ejemplo 10.5.",
            "max_digits": "El número es demasiado grande.",
            "max_decimal_places": f"Usa como máximo {decimals} decimales.",
            "max_whole_digits": "El número es demasiado grande.",
        },
    )


class PurchaseForm(forms.Form):
    """A lot bought from a supplier. The store checks every range again."""

    product = _product_field()
    qty = _amount_field(
        "Cantidad comprada", 3, "En kilos, o en piezas si el producto es por pieza."
    )
    total_cost = _amount_field("Costo total (MXN)", 2, "Lo que pagaste por todo el lote.")
    note = forms.CharField(
        label="Nota",
        required=False,
        max_length=500,
        widget=forms.TextInput(attrs={"class": TEXT, "maxlength": "500"}),
        error_messages={"max_length": "La nota es demasiado larga (máximo 500 caracteres)."},
    )

    def clean_qty(self):
        qty = self.cleaned_data["qty"]
        if qty <= 0:
            raise forms.ValidationError("La cantidad debe ser mayor que cero.")
        return qty

    def clean_total_cost(self):
        cost = self.cleaned_data["total_cost"]
        if cost < 0:
            raise forms.ValidationError("El costo no puede ser negativo.")
        return cost


class StockCountForm(forms.Form):
    """A physical count: the stock there really is and why it differs."""

    product = _product_field()
    new_stock = _amount_field("Stock contado", 3, "Lo que hay en el refrigerador ahora.")
    reason = forms.CharField(
        label="Motivo",
        max_length=200,
        widget=forms.TextInput(attrs={"class": TEXT, "maxlength": "200"}),
        error_messages={
            "required": "Escribe por qué cambia el stock.",
            "max_length": "El motivo es demasiado largo (máximo 200 caracteres).",
        },
    )

    def clean_new_stock(self):
        stock = self.cleaned_data["new_stock"]
        if stock < 0:
            raise forms.ValidationError("El stock no puede ser negativo.")
        return stock


def _recent_lots(request):
    try:
        return services.get_gateway().recent_purchases()
    except services.GatewayError as error:
        messages.error(request, domain.message_for(error.code))
    except services.GatewayUnavailable:
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
    return []


def _send(request, call, success):
    """Run one write of the gateway; True when the store took it."""
    try:
        call()
    except services.GatewayError as error:
        messages.error(request, domain.message_for(error.code))
    except services.GatewayUnavailable:
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
    else:
        messages.success(request, success)
        return True
    return False


@panel_admin_required
@require_http_methods(["GET", "HEAD", "POST"])
def compras(request):
    action = request.POST.get("action") if request.method == "POST" else None
    if action not in (None, "purchase", "count"):
        return HttpResponseBadRequest("Acción desconocida.")
    purchase = PurchaseForm(request.POST if action == "purchase" else None, auto_id="compra_%s")
    count = StockCountForm(request.POST if action == "count" else None, auto_id="conteo_%s")
    staff_ref = request.session.get(PANEL_SESSION_KEY)
    gateway = services.get_gateway()

    if action == "purchase" and purchase.is_valid():
        data = purchase.cleaned_data
        product = data["product"]
        if _send(
            request,
            lambda: gateway.register_purchase(
                product.pk, data["qty"], data["total_cost"], data["note"] or None, staff_ref
            ),
            f"Compra registrada: {product.name}.",
        ):
            return redirect("panel:compras")
    if action == "count" and count.is_valid():
        data = count.cleaned_data
        product = data["product"]
        if _send(
            request,
            lambda: gateway.adjust_stock(
                product.pk, data["new_stock"], data["reason"].strip(), staff_ref
            ),
            f"Stock actualizado: {product.name}.",
        ):
            return redirect("panel:compras")

    context = {"purchase": purchase, "count": count, "lots": _recent_lots(request)}
    return render(request, "panel/compras.html", context)
