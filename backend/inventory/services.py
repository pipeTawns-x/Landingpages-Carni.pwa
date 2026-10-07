"""Business rules for the product catalogue.

The staff views and the Django admin call these functions, so each rule is
written once and cannot drift between the two. Nothing here knows about HTTP:
callers pass values and model instances, and decide how to show the result.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import NamedTuple

from inventory.forms import CutSpecForm, ProductForm
from inventory.models import Favorite, OrderItem, Product


@dataclass(frozen=True)
class PriceChange:
    """Before and after of the two product fields that need an explicit confirmation.

    A price or a minimum quantity that changes unnoticed ends up in customers'
    carts, so an edit that touches either one must be confirmed before it is
    saved. Callers read the old values *before* validating a ModelForm, because
    validation overwrites the instance in place.
    """

    old_price_per_kg: Decimal
    new_price_per_kg: Decimal
    old_min_quantity_kg: Decimal
    new_min_quantity_kg: Decimal

    @property
    def price_changed(self) -> bool:
        return self.new_price_per_kg != self.old_price_per_kg

    @property
    def min_quantity_changed(self) -> bool:
        return self.new_min_quantity_kg != self.old_min_quantity_kg

    @property
    def needs_confirmation(self) -> bool:
        return self.price_changed or self.min_quantity_changed


class ProductReferences(NamedTuple):
    """How many Supabase rows point at a product."""

    orders: int
    favorites: int


def find_references(product: Product) -> ProductReferences:
    """Count the order items and the favorites that point at a product.

    `order_items.product_id` is ON DELETE RESTRICT and `favorites.product_id`
    is ON DELETE CASCADE, so the first number blocks a delete and the second
    one warns about what it drags along.
    """
    return ProductReferences(
        orders=OrderItem.objects.filter(product_id=product.pk).count(),
        favorites=Favorite.objects.filter(product_id=product.pk).count(),
    )


@dataclass(frozen=True)
class DeleteOutcome:
    """What `delete_or_deactivate` did to a product."""

    deactivated: bool
    # Favorites that went away with a deleted product. Always 0 when the
    # product was only deactivated, because then nothing was removed.
    favorites_removed: int = 0


def delete_or_deactivate(product: Product) -> DeleteOutcome:
    """Delete a product, unless it has order history: then deactivate it instead.

    The database refuses to delete a product that an order item points at, and
    an order is history worth keeping, so that product is hidden from the shop
    by turning `is_active` off.
    """
    references = find_references(product)

    if references.orders:
        product.is_active = False
        # Write only that column: a full save would put back every other value
        # as it was read, and overwrite whatever changed in the meantime.
        product.save(update_fields=["is_active"])
        return DeleteOutcome(deactivated=True)

    product.delete()
    return DeleteOutcome(deactivated=False, favorites_removed=references.favorites)


def _spec_form_has_data(spec_form: CutSpecForm) -> bool:
    """Return True if the staff member filled in at least one spec field."""
    return any(value not in (None, "", []) for value in spec_form.cleaned_data.values())


def save_product(product_form: ProductForm, spec_form: CutSpecForm) -> Product:
    """Save a validated product form and, when it applies, its cut spec.

    The spec table stays clean: a spec is stored only if it already exists or
    if staff filled in at least one of its fields. A zero counts as filled in.
    """
    product = product_form.save()
    spec = spec_form.save(commit=False)

    if spec.pk or _spec_form_has_data(spec_form):
        spec.product = product
        spec.save()

    return product
