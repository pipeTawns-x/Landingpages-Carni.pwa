"""Forms for the inventory app."""

from django import forms

from inventory.models import CutSpec, Product


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
        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
        }


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
            "notes": forms.Textarea(attrs={"rows": 3}),
        }
