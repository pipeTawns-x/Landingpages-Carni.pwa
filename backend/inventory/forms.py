"""Forms for the inventory app.

The panel draws these forms with the controls of the redesign (kit/productos/form.html), so every
widget carries the Tailwind classes of its control. They live here and not in a template because
Django is the one that draws a widget; `assets/panel.css` lists this file with `@source`, which is
how Tailwind finds them. A class that is not in the redesign's kit does not belong here.
"""

from decimal import Decimal

from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator

from inventory import storage
from inventory.models import CutSpec, Product, price_per_kg_from

# The shell of every control of the panel: 48 px tall, the control radius, the border of a control
# (never the decorative one), and text that is larger on a phone so the browser does not zoom.
CONTROL = (
    "h-12 w-full rounded-control border border-border-control bg-surface-1 text-lead text-text "
    "placeholder:text-text-muted aria-invalid:border-danger lg:text-ui"
)
TEXT = f"{CONTROL} px-4"
# Numbers keep their digits aligned. A "$" sits in the left padding of the price, and the unit of
# the others ("kg", "in") in the right one.
NUMBER = f"{CONTROL} pl-4 pr-4 tabular-nums"
NUMBER_WITH_CURRENCY = f"{CONTROL} pl-8 pr-4 tabular-nums"
NUMBER_WITH_UNIT = f"{CONTROL} pl-4 pr-11 tabular-nums"
# The arrow of a select is an icon over the right padding, so the native one goes.
SELECT = f"{CONTROL} appearance-none pr-11 pl-4"
TEXTAREA = (
    "w-full rounded-control border border-border-control bg-surface-1 px-4 py-3 text-lead "
    "text-text placeholder:text-text-muted aria-invalid:border-danger lg:text-ui"
)
# The on/off switch is a checkbox spread over its whole label, and the track and the knob are the
# span that follows it (see product_form.html).
SWITCH = (
    "peer absolute inset-0 size-full cursor-pointer appearance-none rounded-control "
    "focus-visible:outline-none"
)


class ProductForm(forms.ModelForm):
    """Product data entered by staff.

    `price_per_lb` is intentionally excluded: `Product.save()` derives it
    from `price_per_kg` on every save, so it must never be user-editable.
    """

    class Meta:
        model = Product
        fields = [
            "name",
            "category",
            "description",
            "price_unit",
            "price_per_kg",
            "min_quantity_kg",
            "stock",
            "is_active",
            "image_url",
        ]
        # `name` and `image_url` are TextFields, which Django draws as a <textarea> unless told
        # otherwise. `image_url` is not a URLInput: it holds a path of the store (/img/products/...)
        # and type="url" refuses a relative one.
        widgets = {
            "name": forms.TextInput(attrs={"class": TEXT}),
            "category": forms.Select(attrs={"class": SELECT}),
            "description": forms.Textarea(attrs={"class": TEXTAREA, "rows": 3}),
            "price_per_kg": forms.NumberInput(
                attrs={
                    "class": NUMBER_WITH_CURRENCY,
                    "min": "0.01",
                    "aria-describedby": "help-price_per_kg",
                }
            ),
            "price_unit": forms.Select(attrs={"class": SELECT}),
            "min_quantity_kg": forms.NumberInput(
                attrs={
                    "class": NUMBER_WITH_UNIT,
                    "min": "0",
                    "aria-describedby": "help-min_quantity_kg",
                }
            ),
            "stock": forms.NumberInput(
                attrs={
                    "class": NUMBER,
                    "min": "0",
                    "step": "0.001",
                    "aria-describedby": "help-stock",
                }
            ),
            "is_active": forms.CheckboxInput(attrs={"class": SWITCH}),
            "image_url": forms.TextInput(
                attrs={
                    "class": TEXT,
                    "inputmode": "url",
                    "autocapitalize": "none",
                    "spellcheck": "false",
                    "aria-describedby": "help-image_url",
                }
            ),
        }

    # What the number typed in the price box is "per". Only a kilo product has the three.
    PRICE_ENTRY_CHOICES = [("kg", "por kilo"), ("lb", "por libra"), ("g100", "por 100 g")]

    price_entry_unit = forms.ChoiceField(
        choices=PRICE_ENTRY_CHOICES,
        required=False,
        initial="kg",
        label="Precio escrito",
        widget=forms.Select(attrs={"class": SELECT}),
    )

    # The photo is not a model field: `clean_photo` turns it into a `storage.ProductImage` and
    # `services.save_product` uploads it and writes the public URL into `image_url`.
    photo = forms.FileField(
        required=False,
        label="Foto del producto",
        widget=forms.FileInput(
            attrs={
                "class": "w-full text-ui",
                "accept": "image/jpeg,image/png,image/webp",
                "aria-describedby": "help-photo",
            }
        ),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # The blank option of the select is the prompt of the design, not Django's dashes.
        self.fields["category"].empty_label = "Elige una categoría"
        # The price is the one thing a wrong value costs money on, so its messages are explicit.
        price = self.fields["price_per_kg"]
        price.label = "Precio"
        price.validators = [
            MinValueValidator(Decimal("0.01"), message="El precio debe ser mayor que cero.")
        ]
        price.error_messages["required"] = "Escribe el precio del producto."
        price.error_messages["invalid"] = "Escribe el precio como un número, por ejemplo 189.50."
        self.fields["price_unit"].label = "El precio es"
        # A post that leaves the unit out keeps the one the product has (kg for a new one).
        self.fields["price_unit"].required = False
        # The stock is stored with three decimals: show 15 and 7.5, not 15.000 and 7.500.
        stock = self.initial.get("stock")
        if isinstance(stock, Decimal):
            self.initial["stock"] = format(stock.normalize(), "f")

    def clean_photo(self):
        """Accept a JPEG, PNG or WebP by its bytes (never by its name), up to 5 MB.

        Returns a `storage.ProductImage`, or None when no file was sent. Without the server key
        the photo is refused here, so the rest of the form still saves.
        """
        upload = self.cleaned_data.get("photo")
        if not upload:
            return None
        if not storage.storage_configured():
            raise ValidationError(
                "La carga de fotos no está configurada: falta SUPABASE_SERVICE_ROLE_KEY en el "
                "servidor. El resto del producto se puede guardar sin foto."
            )
        if upload.size > storage.MAX_BYTES:
            raise ValidationError(storage.REJECTED_SIZE)
        try:
            return storage.inspect_image(upload.read())
        except storage.ImageRejected as error:
            raise ValidationError(str(error)) from error

    def clean_price_unit(self):
        return self.cleaned_data["price_unit"] or self.instance.price_unit

    def clean(self):
        """Turn the price the admin typed into the price per kilo the store keeps.

        The per-pound and per-100-g entry only makes sense for a product priced per kilo; for a
        piece or a package the number is the price of that piece or package, whatever the entry
        unit says. Nothing here lets a price through that the field refused.
        """
        cleaned = super().clean()
        price = cleaned.get("price_per_kg")
        if price is not None:
            unit = cleaned.get("price_entry_unit") or "kg"
            if cleaned.get("price_unit") != Product.PriceUnit.KG:
                unit = "kg"
            cleaned["price_per_kg"] = price_per_kg_from(price, unit)
        return cleaned


class CutSpecForm(forms.ModelForm):
    """Optional cut/packaging specification for a product, and whether it sells by pieces.

    All fields are optional so a product can be created or edited without a
    spec. When any field is filled in, `CutSpec.clean()` (thickness range
    validation) still runs through the ModelForm's `_post_clean` step.

    `sells_by_piece` is the owner's own choice (Eduardo, 2026-11-18: "no asumas"): a weight of a
    piece alone never makes the store sell a product by pieces. Turning it on needs that weight,
    because the store estimates the kilos of an order by pieces from it.
    """

    sells_by_piece = forms.BooleanField(
        required=False,
        label="Se vende por pieza",
        widget=forms.CheckboxInput(attrs={"class": "size-5 accent-sand"}),
    )

    class Meta:
        model = CutSpec
        fields = [
            "avg_piece_weight_kg",
            "thickness_min_in",
            "thickness_max_in",
            "thickness_default_in",
            "supplier",
            "presentation",
            "notes",
        ]
        widgets = {
            "avg_piece_weight_kg": forms.NumberInput(
                attrs={
                    "class": NUMBER_WITH_UNIT,
                    "min": "0",
                    "aria-describedby": "help-avg_piece_weight_kg",
                }
            ),
            "thickness_min_in": forms.NumberInput(attrs={"class": NUMBER_WITH_UNIT, "min": "0"}),
            "thickness_max_in": forms.NumberInput(attrs={"class": NUMBER_WITH_UNIT, "min": "0"}),
            "thickness_default_in": forms.NumberInput(
                attrs={"class": NUMBER_WITH_UNIT, "min": "0"}
            ),
            "supplier": forms.TextInput(attrs={"class": TEXT}),
            "presentation": forms.Select(attrs={"class": SELECT}),
            "notes": forms.Textarea(attrs={"class": TEXTAREA, "rows": 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # "Sin definir" is how the design calls the blank choice.
        self.fields["presentation"].choices = [("", "Sin definir"), *CutSpec.Presentation.choices]
        if self.instance.product_id and not self.is_bound:
            self.initial["sells_by_piece"] = "pieces" in (self.instance.product.sale_modes or [])

    def clean(self):
        data = super().clean()
        if data.get("sells_by_piece") and not data.get("avg_piece_weight_kg"):
            self.add_error(
                "avg_piece_weight_kg", "Para venderlo por pieza escribe cuánto pesa una pieza."
            )
        return data

    def has_spec_data(self):
        """True when a field of the spec itself was filled in (a zero counts as filled in)."""
        return any(
            self.cleaned_data.get(name) not in (None, "", [])
            for name in self._meta.fields
        )
