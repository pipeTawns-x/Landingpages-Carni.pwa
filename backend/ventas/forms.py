"""The two forms of the sale at the counter: a line of the cart, and the order.

Neither has a price field. What the browser could send as a price is not a field, so it is never
read: the numbers come from the quote of the store.
"""

from decimal import Decimal

from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

from ventas import cart, domain


def _choices(labels):
    return list(labels.items())


class CartLineForm(forms.Form):
    mode = forms.ChoiceField(choices=_choices(domain.MODE_LABELS))
    amount = forms.DecimalField(max_digits=10, decimal_places=3, min_value=Decimal("0.001"))
    unit = forms.ChoiceField(choices=[(u, u) for u in domain.UNITS], required=False)
    thickness_in = forms.DecimalField(
        max_digits=4, decimal_places=2, min_value=Decimal("0.01"), required=False
    )
    note = forms.CharField(max_length=200, required=False)

    def clean(self):
        data = super().clean()
        mode, unit = data.get("mode"), data.get("unit")
        if mode == "weight" and not unit:
            self.add_error("unit", "Elige la unidad del peso.")
        if mode and mode != "weight" and unit:
            self.add_error("unit", "La unidad solo aplica a la venta por peso.")
        if mode and mode != "pieces" and data.get("thickness_in") is not None:
            self.add_error("thickness_in", "El grosor solo aplica a la venta por piezas.")
        amount = data.get("amount")
        if mode == "pieces" and amount is not None and amount != amount.to_integral_value():
            self.add_error("amount", "Las piezas van en números enteros.")
        return data

    def line_for(self, product_id):
        data = self.cleaned_data
        return cart.make_line(
            product_id,
            data["mode"],
            data["amount"],
            data["unit"],
            data["thickness_in"],
            data["note"],
        )

    def first_error(self):
        for errors in self.errors.values():
            return f"No se agregó la línea: {errors[0]}"
        return domain.GENERIC_REFUSAL


phone_validator = RegexValidator(
    r"^\+?[0-9 ()\-]{7,20}$", "Escribe el teléfono solo con números (puede llevar espacios)."
)
# `create_order_web` refuses a phone with fewer digits than this; the form of the store says so
# first, so a phone made of hyphens never reaches the database.
STORE_PHONE_MIN_DIGITS = 7


def store_phone_validator(value):
    """The phone of a guest order: the characters of `phone_validator` and seven digits at least.

    Only the public store uses it; the sale at the counter keeps the looser rule of the staff.
    """
    phone_validator(value)
    if sum(char in "0123456789" for char in value) < STORE_PHONE_MIN_DIGITS:
        raise ValidationError(f"Escribe tu teléfono con al menos {STORE_PHONE_MIN_DIGITS} dígitos.")


class OrderForm(forms.Form):
    customer_name = forms.CharField(max_length=120)
    customer_phone = forms.CharField(max_length=20, required=False, validators=[phone_validator])
    delivery_type = forms.ChoiceField(choices=_choices(domain.DELIVERY_LABELS))
    delivery_address = forms.CharField(max_length=2000, required=False)
    channel = forms.ChoiceField(
        choices=[(c, domain.CHANNEL_LABELS[c]) for c in domain.STAFF_CHANNELS]
    )
    payment_method = forms.ChoiceField(choices=_choices(domain.PAYMENT_LABELS), required=False)
    notes = forms.CharField(max_length=500, required=False)
    currency = forms.ChoiceField(choices=_choices(domain.CURRENCY_LABELS))

    def clean(self):
        data = super().clean()
        if data.get("delivery_type") == "delivery" and not data.get("delivery_address"):
            self.add_error("delivery_address", "Un envío necesita la dirección de entrega.")
        return data

    def order_values(self):
        """The values `create_order_staff` takes, apart from the items and the staff."""
        data = self.cleaned_data
        delivery = data["delivery_type"] == "delivery"
        return {
            "customer_name": data["customer_name"],
            "customer_phone": data["customer_phone"],
            "delivery_type": data["delivery_type"],
            "delivery_address": {"address": data["delivery_address"]} if delivery else {},
            "notes": data["notes"],
            "channel": data["channel"],
            "currency": data["currency"],
            "payment_method": data["payment_method"] or None,
        }
