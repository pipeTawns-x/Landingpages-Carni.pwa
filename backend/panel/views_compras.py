"""Compras y stock (/panel/compras/, panel:compras): what came in and what is on the shelf.

Four POST forms with Django's CSRF token share the page, told apart by `action`:
`purchase` calls `register_purchase` (the function applies the yield, the cost per kilo and the
stock), `lot` calls `register_lot` (a bag counted by the piece with the weight of one piece: each
piece costs that weight times the price per kilo) and `count` calls `adjust_stock` (a physical
count with its reason). `cut` calls `cut_lot` (despiece: pieces of a lot become lots of other
products, listed in the formset `salida`). Every action goes through the
gateway, then redirects (POST/redirect/GET). The lots come from `panel_purchase_performance`.
"""

from django import forms
from django.contrib import messages
from django.db import transaction
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from inventory.forms import NUMBER, SELECT, TEXT
from inventory.models import Product, ProductCost
from inventory.pricing import piece_price
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
    yield_pct = forms.DecimalField(
        label="Rendimiento del corte (%)",
        required=False,
        max_digits=5,
        decimal_places=2,
        help_text=(
            "Lo que queda para vender de cada kilo comprado. Vacío: se queda el que ya tenía."
        ),
        widget=forms.NumberInput(
            attrs={"class": NUMBER, "step": "any", "inputmode": "decimal", "min": "0", "max": "100"}
        ),
        error_messages={
            "invalid": "Escribe un número, por ejemplo 80.",
            "max_decimal_places": "Usa como máximo 2 decimales.",
            "max_digits": "El rendimiento va de más de 0 a 100 %.",
            "max_whole_digits": "El rendimiento va de más de 0 a 100 %.",
        },
    )
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

    def clean_yield_pct(self):
        value = self.cleaned_data["yield_pct"]
        if value is not None and not (0 < value <= 100):
            raise forms.ValidationError("El rendimiento va de más de 0 a 100 %.")
        return value

    def clean(self):
        data = super().clean()
        product = data.get("product")
        if data.get("yield_pct") is not None and product and product.price_unit != "kg":
            self.add_error("yield_pct", "El rendimiento solo aplica a productos por kilo.")
        return data

    def clean_total_cost(self):
        cost = self.cleaned_data["total_cost"]
        if cost < 0:
            raise forms.ValidationError("El costo no puede ser negativo.")
        return cost


class LotForm(forms.Form):
    """A bag counted by the piece: how many pieces came and what one weighed piece weighs.

    The weight becomes the standard weight of every piece of the lot, so one piece costs that
    weight times the price per kilo (odd/tasks/carrito-trifasico.md, S3-S4). The store checks
    every range again.
    """

    product = _product_field()
    pieces = forms.IntegerField(
        label="Piezas que llegaron",
        help_text="Por ejemplo 20 pollos de la bolsa.",
        widget=forms.NumberInput(
            attrs={"class": NUMBER, "step": "1", "inputmode": "numeric", "min": "1"}
        ),
        error_messages={
            "required": "Escribe cuántas piezas llegaron.",
            "invalid": "Las piezas son un número entero, por ejemplo 20.",
        },
    )
    piece_weight_kg = _amount_field(
        "Peso de una pieza (kg)", 3, "Pesa una sola pieza: ese peso vale para todo el lote."
    )
    total_cost = _amount_field("Costo total (MXN)", 2, "Lo que pagaste por todo el lote.")
    note = forms.CharField(
        label="Nota",
        required=False,
        max_length=500,
        widget=forms.TextInput(attrs={"class": TEXT, "maxlength": "500"}),
        error_messages={"max_length": "La nota es demasiado larga (máximo 500 caracteres)."},
    )

    def clean_pieces(self):
        pieces = self.cleaned_data["pieces"]
        if pieces <= 0:
            raise forms.ValidationError("Las piezas deben ser al menos 1.")
        return pieces

    def clean_piece_weight_kg(self):
        weight = self.cleaned_data["piece_weight_kg"]
        if weight <= 0:
            raise forms.ValidationError("El peso de la pieza debe ser mayor que cero.")
        return weight

    def clean_total_cost(self):
        cost = self.cleaned_data["total_cost"]
        if cost < 0:
            raise forms.ValidationError("El costo no puede ser negativo.")
        return cost

    def clean(self):
        data = super().clean()
        product = data.get("product")
        if product is None:
            return data
        error = _piece_lot_product_errors(product)
        if error:
            self.add_error("product", error)
        return data


def _piece_lot_product_errors(product):
    """Why a product cannot take a piece lot, or None when it can (same rule as `register_lot`)."""
    if product.price_unit != "kg":
        return "Solo los productos con precio por kilo se registran por lote de piezas."
    if "pieces" not in (product.sale_modes or []):
        return "Activa la venta por pieza de este producto antes de registrar un lote por pieza."
    return None


class CutForm(forms.Form):
    """Despiece: which lot and how many of its pieces are cut (the products go in `salida`)."""

    source_lot = forms.IntegerField(
        label="Lote que se despieza",
        min_value=1,
        widget=forms.NumberInput(attrs={"class": NUMBER, "step": "1", "inputmode": "numeric"}),
        error_messages={
            "required": "Elige el lote que se despieza.",
            "invalid": "Elige el lote que se despieza.",
            "min_value": "Elige el lote que se despieza.",
        },
    )
    pieces = forms.IntegerField(
        label="Piezas que se despiezan",
        widget=forms.NumberInput(
            attrs={"class": NUMBER, "step": "1", "inputmode": "numeric", "min": "1"}
        ),
        error_messages={
            "required": "Escribe cuántas piezas se despiezan.",
            "invalid": "Las piezas son un número entero, por ejemplo 3.",
        },
    )
    note = forms.CharField(
        label="Nota",
        required=False,
        max_length=500,
        widget=forms.TextInput(attrs={"class": TEXT, "maxlength": "500"}),
        error_messages={"max_length": "La nota es demasiado larga (máximo 500 caracteres)."},
    )

    def clean_pieces(self):
        pieces = self.cleaned_data["pieces"]
        if pieces <= 0:
            raise forms.ValidationError("Las piezas deben ser al menos 1.")
        return pieces


class CutOutputForm(forms.Form):
    """One product that comes out of the cut: how many pieces and what one weighs."""

    product = _product_field()
    pieces = forms.IntegerField(
        label="Piezas que salen",
        widget=forms.NumberInput(
            attrs={"class": NUMBER, "step": "1", "inputmode": "numeric", "min": "1"}
        ),
        error_messages={
            "required": "Escribe cuántas piezas salen.",
            "invalid": "Las piezas son un número entero, por ejemplo 6.",
        },
    )
    piece_weight_kg = _amount_field("Peso de una pieza (kg)", 3)

    def clean_pieces(self):
        pieces = self.cleaned_data["pieces"]
        if pieces <= 0:
            raise forms.ValidationError("Las piezas deben ser al menos 1.")
        return pieces

    def clean_piece_weight_kg(self):
        weight = self.cleaned_data["piece_weight_kg"]
        if weight <= 0:
            raise forms.ValidationError("El peso de la pieza debe ser mayor que cero.")
        return weight

    def clean(self):
        data = super().clean()
        product = data.get("product")
        if product is not None:
            error = _piece_lot_product_errors(product)
            if error:
                self.add_error("product", error)
        return data


class BaseCutOutputFormSet(forms.BaseFormSet):
    def clean(self):
        super().clean()
        if any(self.errors):
            return
        if not any(form.cleaned_data for form in self.forms):
            raise forms.ValidationError("Agrega al menos un producto que sale del despiece.")


CutOutputFormSet = forms.formset_factory(
    CutOutputForm, formset=BaseCutOutputFormSet, extra=3, max_num=20, validate_max=True
)


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


def _open_lots(request):
    try:
        return services.get_gateway().open_lots()
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
    if action not in (None, "purchase", "lot", "cut", "count"):
        return HttpResponseBadRequest("Acción desconocida.")
    purchase = PurchaseForm(request.POST if action == "purchase" else None, auto_id="compra_%s")
    lot = LotForm(request.POST if action == "lot" else None, auto_id="lote_%s")
    cut = CutForm(request.POST if action == "cut" else None, auto_id="despiece_%s")
    cut_outputs = CutOutputFormSet(request.POST if action == "cut" else None, prefix="salida")
    count = StockCountForm(request.POST if action == "count" else None, auto_id="conteo_%s")
    staff_ref = request.session.get(PANEL_SESSION_KEY)
    gateway = services.get_gateway()

    if action == "purchase" and purchase.is_valid():
        data = purchase.cleaned_data
        product = data["product"]
        yield_pct = data["yield_pct"]

        def register():
            # One transaction: when the store refuses the purchase, the new yield is not kept.
            with transaction.atomic():
                if yield_pct is not None:
                    ProductCost.objects.update_or_create(
                        product=product,
                        defaults={"yield_pct": yield_pct, "updated_by": staff_ref},
                    )
                gateway.register_purchase(
                    product.pk, data["qty"], data["total_cost"], data["note"] or None, staff_ref
                )

        detail = f" (rendimiento {yield_pct.normalize():f} %)" if yield_pct is not None else ""
        if _send(request, register, f"Compra registrada: {product.name}{detail}."):
            return redirect("panel:compras")
    if action == "lot" and lot.is_valid():
        data = lot.cleaned_data
        product = data["product"]
        weight = data["piece_weight_kg"]
        success = (
            f"Lote registrado: {product.name}, {data['pieces']} piezas de "
            f"{weight.normalize():f} kg. Cada pieza cuesta ${piece_price(product, weight)}."
        )
        if _send(
            request,
            lambda: gateway.register_lot(
                product.pk,
                data["pieces"],
                weight,
                data["total_cost"],
                data["note"] or None,
                staff_ref,
            ),
            success,
        ):
            return redirect("panel:compras")
    if action == "cut" and cut.is_valid() and cut_outputs.is_valid():
        data = cut.cleaned_data
        rows = [form.cleaned_data for form in cut_outputs.forms if form.cleaned_data]
        outputs = [
            {
                "product_id": row["product"].pk,
                "pieces": row["pieces"],
                "piece_weight_kg": f"{row['piece_weight_kg'].normalize():f}",
            }
            for row in rows
        ]
        names = ", ".join(f"{row['product'].name} ({row['pieces']})" for row in rows)
        success = (
            f"Despiece registrado: {data['pieces']} piezas del lote {data['source_lot']} "
            f"pasaron a {names}."
        )
        if _send(
            request,
            lambda: gateway.cut_lot(
                data["source_lot"], data["pieces"], outputs, data["note"] or None, staff_ref
            ),
            success,
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

    context = {
        "purchase": purchase,
        "lot": lot,
        "cut": cut,
        "cut_outputs": cut_outputs,
        "count": count,
        "lots": _recent_lots(request),
        "open_lots": _open_lots(request),
    }
    return render(request, "panel/compras.html", context)
