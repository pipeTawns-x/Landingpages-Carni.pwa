"""Inventory models.

`Category` and `Product` are unmanaged mirrors of the Supabase-owned tables
`public.categories` and `public.products` (Django must never emit DDL for
them). `CutSpec` is the only Django-managed table in this app and lives in
the `django` schema, linked to `Product` without a DB-level foreign key
(`db_constraint=False`) so Django cannot alter a Supabase-owned table.
"""

from decimal import ROUND_HALF_UP, Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import CheckConstraint, F, Q

# 1 lb weighs 0.4536 kg, so price-per-lb is price-per-kg scaled by this factor.
KG_TO_LB_PRICE_FACTOR = Decimal("0.4536")


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
    stock = models.IntegerField(
        default=0, validators=[MinValueValidator(0)], verbose_name="inventario"
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

    class Meta:
        managed = False
        db_table = "products"
        ordering = ["name"]
        verbose_name = "producto"
        verbose_name_plural = "productos"

    def __str__(self) -> str:
        return self.name

    def save(self, *args: object, **kwargs: object) -> None:
        """Keep price_per_lb consistent with price_per_kg on every save."""
        self.price_per_lb = (self.price_per_kg * KG_TO_LB_PRICE_FACTOR).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        super().save(*args, **kwargs)


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
