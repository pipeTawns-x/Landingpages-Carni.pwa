"""Descuentos (/panel/descuentos/, panel:descuentos): discounts by product and by dates.

The owner types whole days ("del 1 al 30") in the time of the store. They are stored as the
window `quote_cart` reads, `starts_at <= now() < ends_at`, from 00:00 of the first day to 00:00
of the day after the last, so the last day counts complete. Two POST actions with Django's CSRF
token: `create` writes a row of `product_promotions` and `off` switches one off (the row stays,
for the record). Both redirect (POST/redirect/GET).
"""

from datetime import datetime, time, timedelta
from decimal import Decimal

from django import forms
from django.contrib import messages
from django.db import IntegrityError, transaction
from django.http import HttpResponseBadRequest
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from inventory.forms import NUMBER, SELECT
from inventory.models import Product, Promotion
from panel.access import panel_admin_required

OVERLAP_MESSAGE = "Ya hay un descuento activo de este producto en esas fechas."
DATE = NUMBER.replace("tabular-nums", "")


def window_of(first_day, last_day):
    """The [start, end) instants of a range of whole days in the time zone of the store."""
    start = timezone.make_aware(datetime.combine(first_day, time.min))
    end = timezone.make_aware(datetime.combine(last_day + timedelta(days=1), time.min))
    return start, end


class PromotionForm(forms.Form):
    product = forms.ModelChoiceField(
        label="Producto",
        queryset=Product.objects.order_by("name"),
        empty_label="Elige un producto",
        widget=forms.Select(attrs={"class": SELECT}),
        error_messages={
            "required": "Elige un producto.",
            "invalid_choice": "Ese producto ya no existe.",
        },
    )
    kind = forms.ChoiceField(
        label="Tipo",
        choices=Promotion.Kind.choices,
        widget=forms.Select(attrs={"class": SELECT}),
        error_messages={"required": "Elige el tipo.", "invalid_choice": "Ese tipo no existe."},
    )
    value = forms.DecimalField(
        label="Valor",
        max_digits=12,
        decimal_places=2,
        help_text="Porcentaje (10 = 10 %), pesos menos por kilo, o el precio fijo por kilo.",
        widget=forms.NumberInput(
            attrs={"class": NUMBER, "step": "any", "inputmode": "decimal", "min": "0"}
        ),
        error_messages={
            "required": "Escribe el valor.",
            "invalid": "Escribe un número, por ejemplo 10.",
            "max_decimal_places": "Usa como máximo 2 decimales.",
            "max_digits": "El número es demasiado grande.",
            "max_whole_digits": "El número es demasiado grande.",
        },
    )
    starts_on = forms.DateField(
        label="Desde",
        widget=forms.DateInput(attrs={"class": DATE, "type": "date"}, format="%Y-%m-%d"),
        error_messages={"required": "Elige el primer día.", "invalid": "Fecha no válida."},
    )
    ends_on = forms.DateField(
        label="Hasta (incluido)",
        widget=forms.DateInput(attrs={"class": DATE, "type": "date"}, format="%Y-%m-%d"),
        error_messages={"required": "Elige el último día.", "invalid": "Fecha no válida."},
    )

    def clean_value(self):
        value = self.cleaned_data["value"]
        if value <= 0:
            raise forms.ValidationError("El valor debe ser mayor que cero.")
        return value

    def clean(self):
        data = super().clean()
        if data.get("kind") == Promotion.Kind.PERCENT and data.get("value", 0) >= 100:
            self.add_error("value", "El porcentaje debe ser menor que 100.")
        first, last = data.get("starts_on"), data.get("ends_on")
        if first and last and last < first:
            self.add_error("ends_on", "La fecha final no puede ser antes de la inicial.")
        if self.errors or not data.get("product"):
            return data
        start, end = window_of(first, last)
        overlaps = Promotion.objects.filter(
            product=data["product"], is_active=True, starts_at__lt=end, ends_at__gt=start
        ).exists()
        if overlaps:
            raise forms.ValidationError(OVERLAP_MESSAGE)
        data["window"] = (start, end)
        return data


def _state_of(promo, now):
    if not promo.is_active:
        return "Desactivado"
    if promo.ends_at <= now:
        return "Terminado"
    if promo.starts_at > now:
        return "Programado"
    return "Vigente"


def _rows():
    now = timezone.now()
    promos = Promotion.objects.select_related("product").order_by("-starts_at", "-id")[:100]
    return [
        {
            "promo": promo,
            "state": _state_of(promo, now),
            "last_day": timezone.localtime(promo.ends_at - timedelta(microseconds=1)).date(),
            "first_day": timezone.localtime(promo.starts_at).date(),
            "list_price": promo.product.price_per_kg,
            "price": promo.price_for(Decimal(promo.product.price_per_kg)),
            "unit": promo.product.unit_label,
        }
        for promo in promos
    ]


@panel_admin_required
@require_http_methods(["GET", "HEAD", "POST"])
def descuentos(request):
    action = request.POST.get("action") if request.method == "POST" else None
    if action not in (None, "create", "off"):
        return HttpResponseBadRequest("Acción desconocida.")

    if action == "off":
        raw_id = request.POST.get("promotion", "")
        promo = get_object_or_404(Promotion, pk=int(raw_id) if raw_id.isdigit() else 0)
        promo.is_active = False
        promo.save(update_fields=["is_active"])
        messages.success(request, f"Descuento desactivado: {promo.product.name}.")
        return redirect("panel:descuentos")

    form = PromotionForm(request.POST if action == "create" else None)
    if action == "create" and form.is_valid():
        data = form.cleaned_data
        start, end = data["window"]
        try:
            with transaction.atomic():
                Promotion.objects.create(
                    product=data["product"],
                    kind=data["kind"],
                    value=data["value"],
                    starts_at=start,
                    ends_at=end,
                )
        except IntegrityError:
            # Postgres has the last word on overlaps (another tab may have saved one first).
            form.add_error(None, OVERLAP_MESSAGE)
        else:
            messages.success(request, f"Descuento guardado: {data['product'].name}.")
            return redirect("panel:descuentos")

    return render(request, "panel/descuentos.html", {"form": form, "rows": _rows()})
