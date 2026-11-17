"""Inventory models.

`Category` and `Product` are unmanaged mirrors of the Supabase-owned tables
`public.categories` and `public.products` (Django must never emit DDL for
them). `OrderItem` and `Favorite` mirror `public.order_items` and
`public.favorites` the same way, but read-only: the panel only counts the rows
that point at a product. `CutSpec` is the only Django-managed table in this app
and lives in the `django` schema, linked to `Product` without a DB-level
foreign key (`db_constraint=False`) so Django cannot alter a Supabase-owned
table.
"""

import json
from decimal import ROUND_HALF_UP, Decimal
from typing import NoReturn
from urllib.parse import urlsplit

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import CheckConstraint, F, Q

# 1 lb weighs 0.4536 kg, so price-per-lb is price-per-kg scaled by this factor.
KG_TO_LB_PRICE_FACTOR = Decimal("0.4536")


def price_per_lb_for(price_per_kg: Decimal) -> Decimal:
    """Convert a price per kg to a price per lb, rounded half up to cents."""
    return (price_per_kg * KG_TO_LB_PRICE_FACTOR).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# 1 lb is exactly 0.45359237 kg. The price the admin types per pound or per 100 g is converted
# to a price per kilo (the only one the store keeps) with these, rounded half up to cents.
POUND_IN_KG = Decimal("0.45359237")
CENTS = Decimal("0.01")


def price_per_kg_from(price: Decimal, unit: str) -> Decimal:
    """Convert a price typed per kilo ("kg"), per pound ("lb") or per 100 g ("g100") to per kilo."""
    if unit == "kg":
        converted = price
    elif unit == "lb":
        converted = price / POUND_IN_KG
    elif unit == "g100":
        converted = price * 10
    else:
        raise ValueError(f"Unknown price entry unit: {unit!r}")
    return converted.quantize(CENTS, rounding=ROUND_HALF_UP)


def price_equivalents(price_per_kg: Decimal) -> dict[str, Decimal]:
    """The same price per kilo, per pound and per 100 g, rounded half up to cents."""
    return {
        "kg": price_per_kg.quantize(CENTS, rounding=ROUND_HALF_UP),
        "lb": (price_per_kg * POUND_IN_KG).quantize(CENTS, rounding=ROUND_HALF_UP),
        "g100": (price_per_kg / 10).quantize(CENTS, rounding=ROUND_HALF_UP),
    }


class TextArrayField(models.Field):
    """A `text[]` column (`products.sale_modes`) that also works on the SQLite of the tests.

    PostgreSQL gets and gives a real list. Any other backend keeps the list as JSON text, which
    is only there so the test database can hold the mirror: the table is Supabase's. An
    `ArrayField` would not do, because it is PostgreSQL only and the tests run on SQLite.
    """

    def db_type(self, connection):
        return "text[]" if connection.vendor == "postgresql" else "text"

    def from_db_value(self, value, expression, connection):
        if isinstance(value, str):
            return json.loads(value)
        return value

    def to_python(self, value):
        return json.loads(value) if isinstance(value, str) else value

    def get_db_prep_value(self, value, connection, prepared=False):
        if value is None:
            return None
        if connection.vendor == "postgresql":
            return list(value)
        return json.dumps(list(value))


def default_sale_modes() -> list[str]:
    """The default of `products.sale_modes` in the table: money and weight."""
    return ["money", "weight"]


def store_image_url(image_url: str | None) -> str:
    """Return the address a page can load a product picture from, or "" when it has none.

    Django is the store: it serves the store's public/ folder at the root (WHITENOISE_ROOT), so a
    path such as `/img/products/tomahawk.webp` is a path of this same site and is returned as a
    root-relative path. An absolute http(s) address is kept as it is. Anything else
    (`javascript:`, `data:`, a protocol-relative `//host`, a path that climbs with `..`) is not a
    picture a page will point an <img> at.
    """
    if not image_url or not image_url.strip():
        return ""
    address = image_url.strip()
    scheme = urlsplit(address).scheme
    if scheme in {"http", "https"}:
        return address
    if scheme or address.startswith("//") or ".." in address.split("/"):
        return ""
    return "/" + address.lstrip("/")


class Category(models.Model):
    """Product category. Owned by Supabase; Django only reads/writes rows."""

    name = models.TextField(verbose_name="nombre")
    slug = models.TextField(verbose_name="slug")
    # Nullable text mirrors a real Supabase column; not our schema to redesign.
    image_url = models.TextField(  # noqa: DJ001
        null=True, blank=True, verbose_name="URL de imagen"
    )
    is_active = models.BooleanField(default=True, verbose_name="activa")
    order = models.IntegerField(default=0, db_column="order", verbose_name="orden")

    class Meta:
        managed = False
        db_table = "categories"
        ordering = ["order", "name"]
        verbose_name = "categoría"
        verbose_name_plural = "categorías"

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    """Sellable product. Owned by Supabase; Django only reads/writes rows."""

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="categoría",
    )
    name = models.TextField(verbose_name="nombre")
    # Nullable text mirrors a real Supabase column; not our schema to redesign.
    description = models.TextField(  # noqa: DJ001
        null=True, blank=True, verbose_name="descripción"
    )
    # `products` belongs to Supabase and has no CHECK constraints for these
    # numbers, so the validation has to live in the application.
    price_per_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name="precio por kg",
    )
    price_per_lb = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        editable=False,
        verbose_name="precio por lb",
        help_text="Calculado automáticamente a partir del precio por kg.",
    )
    # Nullable text mirrors a real Supabase column; not our schema to redesign.
    image_url = models.TextField(  # noqa: DJ001
        null=True, blank=True, verbose_name="URL de imagen"
    )
    # numeric(10,3) in the store since comercio-v1 A1: kilos with grams, or whole pieces.
    stock = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="inventario",
    )
    is_active = models.BooleanField(default=True, verbose_name="activo")
    created_at = models.DateTimeField(auto_now_add=True, null=True, verbose_name="creado el")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="metadatos")
    min_quantity_kg = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name="cantidad mínima (kg)",
    )

    class PriceUnit(models.TextChoices):
        """What `price_per_kg` is the price of. The values are those of the table's CHECK."""

        KG = "kg", "Por kilo"
        PIECE = "piece", "Por pieza"
        PACKAGE = "package", "Por paquete"

    price_unit = models.TextField(
        choices=PriceUnit.choices,
        default=PriceUnit.KG,
        verbose_name="unidad del precio",
    )
    # Not editable: the table ties them to `price_unit` with CHECKs, and `save()` keeps them in
    # step. They are mirrored so that the one UPDATE that changes the unit also changes them.
    stock_unit = models.TextField(default="kg", editable=False)
    sale_modes = TextArrayField(default=default_sale_modes, editable=False)

    class Meta:
        managed = False
        db_table = "products"
        ordering = ["name"]
        verbose_name = "producto"
        verbose_name_plural = "productos"

    def __str__(self) -> str:
        return self.name

    def save(self, *args: object, **kwargs: object) -> None:
        """Keep price_per_lb, stock_unit and sale_modes consistent on every save.

        The table refuses a product priced per piece or package unless it is counted in pieces
        and sold only in pieces (supabase/migrations/20261113000001, lines 107-110), so the same
        rule that migration applied to the old rows applies here: a unit other than kg means
        stock_unit "piece" and sale_modes ["pieces"]. Going back to kg undoes only that state.
        """
        self.price_per_lb = price_per_lb_for(self.price_per_kg)
        if self.price_unit != self.PriceUnit.KG:
            self.stock_unit = "piece"
            self.sale_modes = ["pieces"]
        elif self.stock_unit == "piece" or self.sale_modes == ["pieces"]:
            self.stock_unit = "kg"
            self.sale_modes = default_sale_modes()
        super().save(*args, **kwargs)

    @property
    def stock_display(self) -> str:
        """The stock without trailing zeros: 80 and 7.5, not 80.000 and 7.500."""
        return format(Decimal(self.stock).normalize(), "f")

    @property
    def unit_label(self) -> str:
        """The unit the price is for, read from `price_unit`: "kg", "pieza" or "paquete"."""
        return {"piece": "pieza", "package": "paquete"}.get(self.price_unit, "kg")

    @property
    def price_equivalents(self) -> dict[str, Decimal]:
        """The saved price per kilo, per pound and per 100 g (see `price_equivalents`).

        The pound is the stored `price_per_lb`, the one the store shows, so that the panel and the
        shop never differ by a cent; it is derived with `KG_TO_LB_PRICE_FACTOR`.
        """
        return {**price_equivalents(self.price_per_kg), "lb": self.price_per_lb}

    @property
    def image_src(self) -> str:
        """The picture as an address the panel can load, or "" when there is none."""
        return store_image_url(self.image_url)


class ReadOnlyModelError(Exception):
    """Raised when code tries to write to a table that only Supabase may change."""


def _refuse_write(model: type[models.Model]) -> NoReturn:
    raise ReadOnlyModelError(f"{model.__name__} is read-only: its table belongs to Supabase.")


class ReadOnlyQuerySet(models.QuerySet):
    """QuerySet that refuses every write, so a mirror cannot be changed by accident."""

    def _refuse(self, *args: object, **kwargs: object) -> NoReturn:
        _refuse_write(self.model)

    create = bulk_create = bulk_update = get_or_create = update_or_create = _refuse
    update = delete = _refuse


class ReadOnlyModel(models.Model):
    """Base class for mirrors of Supabase tables that Django may read but never write.

    The `django` Postgres role only has SELECT on them, so a write would fail in
    production anyway. Refusing it in Python gives a clear message and also
    makes the tests catch it, because SQLite has no roles.
    """

    objects = ReadOnlyQuerySet.as_manager()

    class Meta:
        abstract = True

    def save(self, *args: object, **kwargs: object) -> NoReturn:
        _refuse_write(type(self))

    def delete(self, *args: object, **kwargs: object) -> NoReturn:
        _refuse_write(type(self))


class OrderItem(ReadOnlyModel):
    """One line of an order. Owned by Supabase; the panel only counts them per product.

    Only the columns the reference check needs are mapped. `product_id` is a
    plain integer and not a ForeignKey on purpose: a relation would hook this
    table into Django's delete collector and into the admin's delete
    confirmation, and the database already enforces `ON DELETE RESTRICT`.
    """

    id = models.AutoField(primary_key=True)
    product_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = "order_items"
        verbose_name = "ítem de pedido"
        verbose_name_plural = "ítems de pedido"

    def __str__(self) -> str:
        return f"order item {self.pk}"


class Favorite(ReadOnlyModel):
    """A product a customer saved. Owned by Supabase; the panel only counts them.

    The table has no `id`: its primary key is the pair (user_id, product_id).
    `product_id` is a plain integer for the same reason as in `OrderItem`. The
    database cascades the delete of a product to its favorites, and Django must
    not try to do it as well: the `django` role has no DELETE on this table.
    """

    pk = models.CompositePrimaryKey("user_id", "product_id")
    user_id = models.UUIDField()
    product_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = "favorites"
        verbose_name = "favorito"
        verbose_name_plural = "favoritos"

    def __str__(self) -> str:
        return f"favorite of user {self.user_id} (product {self.product_id})"


class CutSpec(models.Model):
    """Cut/packaging specification for a product.

    Django-managed table (its own, in the `django` schema). Linked to
    `Product` via a OneToOneField with `db_constraint=False`: the relation
    is enforced at the application level only, never as a DB foreign key
    against the Supabase-owned `products` table.
    """

    class Presentation(models.TextChoices):
        PIECE = "piece", "Pieza"
        PACKAGE = "package", "Paquete"

    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=False,
        related_name="spec",
        db_constraint=False,
        verbose_name="producto",
    )
    avg_piece_weight_kg = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="peso promedio por pieza (kg)",
        help_text="P-20: habilita el modo de carrito por piezas.",
    )
    thickness_min_in = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="grosor mínimo (in)",
    )
    thickness_max_in = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="grosor máximo (in)",
    )
    thickness_default_in = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="grosor por defecto (in)",
    )
    supplier = models.CharField(max_length=120, blank=True, verbose_name="proveedor")
    presentation = models.CharField(
        max_length=20,
        choices=Presentation.choices,
        blank=True,
        verbose_name="presentación",
    )
    notes = models.TextField(blank=True, verbose_name="notas")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado el")

    class Meta:
        verbose_name = "especificación de corte"
        verbose_name_plural = "especificaciones de corte"
        constraints = [
            CheckConstraint(
                condition=(
                    Q(thickness_min_in__isnull=True)
                    | Q(thickness_max_in__isnull=True)
                    | Q(thickness_min_in__lte=F("thickness_max_in"))
                ),
                name="cutspec_thickness_min_lte_max",
            ),
            CheckConstraint(
                condition=(
                    Q(thickness_default_in__isnull=True)
                    | Q(thickness_min_in__isnull=True)
                    | Q(thickness_default_in__gte=F("thickness_min_in"))
                ),
                name="cutspec_thickness_default_gte_min",
            ),
            CheckConstraint(
                condition=(
                    Q(thickness_default_in__isnull=True)
                    | Q(thickness_max_in__isnull=True)
                    | Q(thickness_default_in__lte=F("thickness_max_in"))
                ),
                name="cutspec_thickness_default_lte_max",
            ),
            CheckConstraint(
                condition=Q(avg_piece_weight_kg__isnull=True) | Q(avg_piece_weight_kg__gte=0),
                name="cutspec_avg_piece_weight_non_negative",
            ),
            CheckConstraint(
                condition=Q(thickness_min_in__isnull=True) | Q(thickness_min_in__gte=0),
                name="cutspec_thickness_min_non_negative",
            ),
            CheckConstraint(
                condition=Q(thickness_max_in__isnull=True) | Q(thickness_max_in__gte=0),
                name="cutspec_thickness_max_non_negative",
            ),
            CheckConstraint(
                condition=Q(thickness_default_in__isnull=True) | Q(thickness_default_in__gte=0),
                name="cutspec_thickness_default_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return f"Especificación de {self.product.name}"

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        has_min = self.thickness_min_in is not None
        has_max = self.thickness_max_in is not None

        if has_min and has_max and self.thickness_min_in > self.thickness_max_in:
            errors["thickness_min_in"] = "El grosor mínimo no puede ser mayor que el grosor máximo."

        if self.thickness_default_in is not None:
            if has_min and self.thickness_default_in < self.thickness_min_in:
                errors["thickness_default_in"] = (
                    "El grosor por defecto no puede ser menor que el grosor mínimo."
                )
            if has_max and self.thickness_default_in > self.thickness_max_in:
                errors["thickness_default_in"] = (
                    "El grosor por defecto no puede ser mayor que el grosor máximo."
                )

        if errors:
            raise ValidationError(errors)
