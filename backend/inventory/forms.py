"""Forms for the inventory app.

The panel draws these forms with the controls of the redesign (kit/productos/form.html), so every
widget carries the Tailwind classes of its control. They live here and not in a template because
Django is the one that draws a widget; `assets/panel.css` lists this file with `@source`, which is
how Tailwind finds them. A class that is not in the redesign's kit does not belong here.
"""

from django import forms

from inventory.models import CutSpec, Product

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
            "min_quantity_kg": forms.NumberInput(
                attrs={
                    "class": NUMBER_WITH_UNIT,
                    "min": "0",
                    "aria-describedby": "help-min_quantity_kg",
                }
            ),
            "stock": forms.NumberInput(
                attrs={"class": NUMBER, "min": "0", "step": "1", "aria-describedby": "help-stock"}
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # The blank option of the select is the prompt of the design, not Django's dashes.
        self.fields["category"].empty_label = "Elige una categoría"


class CutSpecForm(forms.ModelForm):
    """Optional cut/packaging specification for a product.

    All fields are optional so a product can be created or edited without a
    spec. When any field is filled in, `CutSpec.clean()` (thickness range
    validation) still runs through the ModelForm's `_post_clean` step.
    """

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
