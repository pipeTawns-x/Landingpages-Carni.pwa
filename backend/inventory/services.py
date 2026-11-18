"""Business rules for the product catalogue.

The staff views and the Django admin call these functions, so each rule is
written once and cannot drift between the two. Nothing here knows about HTTP:
callers pass values and model instances, and decide how to show the result.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import NamedTuple

from django.db import IntegrityError, transaction

from inventory import storage
from inventory.forms import CutSpecForm, ProductForm
from inventory.models import CutSpec, Favorite, OrderItem, Product, StoreCutSpec


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
    # The unit the price is for: kilo, piece or package. The same number means another price
    # when the unit changes, so a new unit is confirmed like a new price.
    old_price_unit: str = ""
    new_price_unit: str = ""

    @property
    def price_changed(self) -> bool:
        return self.new_price_per_kg != self.old_price_per_kg

    @property
    def min_quantity_changed(self) -> bool:
        return self.new_min_quantity_kg != self.old_min_quantity_kg

    @property
    def unit_changed(self) -> bool:
        return self.new_price_unit != self.old_price_unit

    @property
    def needs_confirmation(self) -> bool:
        return self.price_changed or self.min_quantity_changed or self.unit_changed


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


def _deactivate(product: Product) -> DeleteOutcome:
    """Hide a product from the shop by turning `is_active` off."""
    product.is_active = False
    # Write only that column: a full save would put back every other value
    # as it was read, and overwrite whatever changed in the meantime.
    product.save(update_fields=["is_active"])
    return DeleteOutcome(deactivated=True)


def delete_or_deactivate(product: Product) -> DeleteOutcome:
    """Delete a product, unless it has order history: then deactivate it instead.

    The database refuses to delete a product that an order item points at, and
    an order is history worth keeping, so that product is hidden from the shop
    by turning `is_active` off.

    Counting the references and deleting are two separate statements, so a
    customer can place an order for the product between them. The database
    still refuses the delete then (`ON DELETE RESTRICT`), and that refusal is
    handled as the same case as an order that was already there: the product is
    deactivated instead of the panel failing with a server error.
    """
    references = find_references(product)

    if references.orders:
        return _deactivate(product)

    try:
        # A savepoint, not just a try/except: on Postgres a statement that
        # fails poisons the surrounding transaction, so without it the
        # fallback below could not run its own UPDATE.
        with transaction.atomic():
            product.delete()
    except IntegrityError:
        return _deactivate(product)

    return DeleteOutcome(deactivated=False, favorites_removed=references.favorites)


def save_product(product_form: ProductForm, spec_form: CutSpecForm) -> Product:
    """Save a validated product form and, when it applies, its cut spec and its photo.

    The spec table stays clean: a spec is stored only if it already exists or
    if staff filled in at least one of its fields. A zero counts as filled in.

    A photo is uploaded after the product row exists (its id is part of the object path) and its
    public URL replaces `image_url`. Everything runs in one transaction: if Storage fails the
    `storage.StorageError` propagates and no product, spec or URL is left behind. Without a photo
    the stored image is untouched.
    """
    photo = product_form.cleaned_data.get("photo")
    with transaction.atomic():
        product = product_form.save()
        spec = spec_form.save(commit=False)

        if spec.pk or spec_form.has_spec_data():
            spec.product = product
            spec.save()
        sync_store_spec(product, by_piece=spec_form.cleaned_data.get("sells_by_piece", False))

        if photo:
            product.image_url = storage.upload_product_image(photo, product.pk)
            product.save(update_fields=["image_url"])

    return product


def _weight_or_none(value):
    """A weight of zero means "no weight", as in the store's table."""
    return value if value else None


def sync_store_spec(product: Product, by_piece: bool | None = None) -> None:
    """Copy the cut spec of `product` to the store and set how the store may sell it.

    `quote_cart` reads `product_cut_specs` and accepts "pieces" only when `sale_modes` lists it.
    A product priced per kilo sells by pieces when the owner said so (`by_piece`, the switch of
    the product form; None keeps what it was) and a piece has a weight; one priced per piece or
    package always sells by pieces (`Product.save` keeps that). Without a spec, nothing is copied.
    """
    spec = CutSpec.objects.filter(product=product).first()
    if spec is not None:
        StoreCutSpec.objects.update_or_create(
            product=product,
            defaults={
                "avg_piece_weight_kg": _weight_or_none(spec.avg_piece_weight_kg),
                "thickness_min_in": _weight_or_none(spec.thickness_min_in),
                "thickness_max_in": _weight_or_none(spec.thickness_max_in),
                "thickness_default_in": _weight_or_none(spec.thickness_default_in),
            },
        )
    if product.price_unit != Product.PriceUnit.KG:
        return
    if by_piece is None:
        by_piece = "pieces" in (product.sale_modes or [])
    has_weight = spec is not None and bool(spec.avg_piece_weight_kg)
    modes = ["money", "weight", "pieces"] if by_piece and has_weight else ["money", "weight"]
    if product.sale_modes != modes:
        product.sale_modes = modes
        product.save(update_fields=["sale_modes"])
