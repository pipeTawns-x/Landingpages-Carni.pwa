"""Django admin for the inventory app.

The product admin applies the same rules as the staff panel by calling
`inventory.services`: a changed price or minimum quantity has to be confirmed,
`price_per_lb` is derived and never edited, and a product with orders is
deactivated instead of deleted.
"""

from django import forms
from django.contrib import admin, messages
from django.core.exceptions import ValidationError

from inventory import services
from inventory.models import Category, CutSpec, Product


class CutSpecInline(admin.StackedInline):
    model = CutSpec
    extra = 0
    can_delete = False


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("order", "name")


class ProductAdminForm(forms.ModelForm):
    """Product form of the admin, which refuses an unconfirmed price or minimum change.

    The staff panel stops at a confirmation page; the admin has no such step, so
    the same confirmation is a checkbox that has to be ticked.
    """

    confirm_price_change = forms.BooleanField(
        required=False,
        label="Confirmar cambio de precio o cantidad mínima",
        help_text=(
            "Márcala solo si cambias el precio por kg o la cantidad mínima: "
            "sin esto, ese cambio no se guarda."
        ),
    )

    def clean(self) -> dict[str, object]:
        cleaned_data = super().clean()
        price_per_kg = cleaned_data.get("price_per_kg")
        min_quantity_kg = cleaned_data.get("min_quantity_kg")

        # A new product has nothing to compare with, and a field that failed its
        # own validation already shows its own error.
        if self.instance.pk is None or price_per_kg is None or min_quantity_kg is None:
            return cleaned_data

        # The instance still holds the stored values here: a ModelForm copies the
        # submitted ones onto it only after clean() has run.
        change = services.PriceChange(
            old_price_per_kg=self.instance.price_per_kg,
            new_price_per_kg=price_per_kg,
            old_min_quantity_kg=self.instance.min_quantity_kg,
            new_min_quantity_kg=min_quantity_kg,
        )
        if change.needs_confirmation and not cleaned_data.get("confirm_price_change"):
            label = self.fields["confirm_price_change"].label
            raise ValidationError(
                {
                    "confirm_price_change": (
                        f"Este cambio necesita confirmación: {self._describe(change)}. "
                        f"Marca la casilla «{label}» para guardarlo."
                    )
                }
            )
        return cleaned_data

    @staticmethod
    def _describe(change: services.PriceChange) -> str:
        parts = []
        if change.price_changed:
            parts.append(
                f"el precio por kg pasa de ${change.old_price_per_kg} a ${change.new_price_per_kg}"
            )
        if change.min_quantity_changed:
            parts.append(
                f"la cantidad mínima pasa de {change.old_min_quantity_kg} kg "
                f"a {change.new_min_quantity_kg} kg"
            )
        return " y ".join(parts)


def _deactivated_notice(names: list[str]) -> str:
    """Say which products were deactivated instead of deleted, and why."""
    if len(names) == 1:
        return (
            f'"{names[0]}" tiene pedidos registrados, así que se desactivó '
            "en lugar de eliminarse para conservar el historial."
        )
    listed = ", ".join(f'"{name}"' for name in names)
    return (
        f"{listed} tienen pedidos registrados, así que se desactivaron "
        "en lugar de eliminarse para conservar el historial."
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ("name", "category", "price_per_kg", "stock", "is_active")
    search_fields = ("name", "description")
    list_filter = ("category", "is_active")
    # Product.save() derives price_per_lb from price_per_kg on every save, so the
    # admin shows it but never lets anyone type it.
    readonly_fields = ("price_per_lb",)
    fields = (
        "name",
        "category",
        "description",
        "price_per_kg",
        "price_per_lb",
        "min_quantity_kg",
        "confirm_price_change",
        "stock",
        "is_active",
        "image_url",
        "metadata",
    )
    inlines = (CutSpecInline,)

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        if obj is None:
            # A new product has no stored price to compare with: nothing to confirm.
            return [name for name in fields if name != "confirm_price_change"]
        return fields

    def delete_model(self, request, obj):
        """Delete the product, or deactivate it when it has orders, and say which."""
        if services.delete_or_deactivate(obj).deactivated:
            self.message_user(request, _deactivated_notice([obj.name]), messages.WARNING)

    def delete_queryset(self, request, queryset):
        """Apply `delete_model`'s rule to every selected product and name the deactivated ones."""
        deactivated = [
            product.name
            for product in queryset
            if services.delete_or_deactivate(product).deactivated
        ]
        if deactivated:
            self.message_user(request, _deactivated_notice(deactivated), messages.WARNING)
