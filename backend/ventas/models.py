"""Mirrors of the Supabase objects that the sales pages read.

`panel_orders` is a view of the store (SECURITY DEFINER, `SELECT` only for the `django` role)
that joins an order with its lines and with the name to show for the customer. Django reads it
and never writes it: an order is born and changes through the Postgres functions (see
`ventas.services`), so a write from Django is refused here the way `inventory.ReadOnlyModel`
refuses it for every mirror.

`ProductSize` and `DeliveryZone` are the two tables of the standard prices (S13, T7a): the sizes
a product is sold in, and the delivery fee by distance. The owner will edit both from the panel
(the screen is the second half of T7a and does not exist yet), and the migration
supabase/migrations/20261124000001 gives the `django` role the right to write them once it is
applied, which it is not yet. Like every table of `public` they are unmanaged: Django never emits
DDL for them, and the CHECKs below only exist so that the tests, which build the tables on
SQLite, refuse what Postgres refuses.
"""

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, F, Q, UniqueConstraint

from inventory.models import Product, ReadOnlyModel
from inventory.pricing import (
    DEFAULT_ROUNDING_STEP,
    MAX_SIZE_GRAMS,
    ROUNDING_STEPS,
    sells_pieces_by_kg,
)


class PanelOrder(ReadOnlyModel):
    """One order as the panel shows it, with its lines already aggregated in `lines`.

    `lines` is a list of `{product_id, product_name, sale_mode, quantity_kg, pieces,
    unit_price, discount, subtotal, note}` with the money and the kilos as text.
    """

    order_id = models.UUIDField(primary_key=True)
    status = models.TextField()
    channel = models.TextField()
    # The name to show: the one typed at the counter, or the full name of the web customer.
    customer_name = models.TextField(null=True, blank=True)  # noqa: DJ001
    customer_phone = models.TextField(null=True, blank=True)  # noqa: DJ001
    delivery_type = models.TextField()
    delivery_address = models.JSONField(default=dict, blank=True, null=True)
    notes = models.TextField(null=True, blank=True)  # noqa: DJ001
    payment_method = models.TextField(null=True, blank=True)  # noqa: DJ001
    currency = models.TextField()
    total_mxn = models.DecimalField(max_digits=10, decimal_places=2)
    total_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    fx_rate_used = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    staff_ref = models.TextField(null=True, blank=True)  # noqa: DJ001
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(null=True, blank=True)
    lines = models.JSONField(default=list)

    class Meta:
        managed = False
        db_table = "panel_orders"
        ordering = ["-created_at"]
        verbose_name = "pedido"
        verbose_name_plural = "pedidos"

    def __str__(self) -> str:
        return f"order {self.pk} ({self.status})"

    @property
    def short_id(self) -> str:
        """The first eight characters of the id: what the staff says out loud."""
        return str(self.pk)[:8]


ROUNDING_STEP_LABELS = {
    Decimal("0.01"): "Al centavo",
    Decimal("0.10"): "A 10 centavos",
    Decimal("0.50"): "A 50 centavos",
    Decimal("1.00"): "Al peso",
}


class ProductSize(models.Model):
    """A standard weight a product is sold in: "340 g costs $265" (Eduardo, 2026-11-23).

    Only the weight is stored. The price is `weight x price per kilo`, rounded half up to
    `rounding_step`, so changing the price per kilo of the product reprices every size and no
    price can go stale (see `inventory.pricing.size_price`). A product has one size per weight.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="sizes",
        db_column="product_id",
        verbose_name="producto",
    )
    grams = models.IntegerField(verbose_name="gramaje (g)")
    rounding_step = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=DEFAULT_ROUNDING_STEP,
        choices=list(ROUNDING_STEP_LABELS.items()),
        verbose_name="redondeo del precio",
        help_text="Al peso: 340 g a $779/kg cuestan $265 y no $264.86.",
    )
    is_active = models.BooleanField(default=True, verbose_name="activo")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado el")

    class Meta:
        managed = False
        db_table = "product_sizes"
        ordering = ["product_id", "grams"]
        verbose_name = "tamaño estándar"
        verbose_name_plural = "tamaños estándar"
        constraints = [
            UniqueConstraint(fields=["product", "grams"], name="product_sizes_product_grams_key"),
            CheckConstraint(
                condition=Q(grams__gte=1, grams__lte=MAX_SIZE_GRAMS),
                name="product_sizes_grams_range",
            ),
            CheckConstraint(
                condition=Q(rounding_step__in=list(ROUNDING_STEPS)),
                name="product_sizes_rounding_step_allowed",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.grams} g · producto {self.product_id}"

    def clean(self) -> None:
        super().clean()
        if self.product_id is None:
            return
        if self.product.price_unit != Product.PriceUnit.KG:
            raise ValidationError(
                {"product": "Solo los productos con precio por kilo tienen tamaños estándar."}
            )
        if not sells_pieces_by_kg(self.product):
            raise ValidationError(
                {"product": "Activa la venta por pieza de este producto antes de darle tamaños."}
            )


class DeliveryZone(models.Model):
    """A ring of distance around the shop with its delivery fee (Carnívoros: $50 up to 5.5 km).

    The zone covers `from_km < distance <= to_km`; the first one, from 0, also covers a distance
    of exactly 0. The upper edge being inclusive is an assumption (nobody published it). Beyond
    the last active zone there is no delivery to the door. The fee does not depend on the order.
    """

    name = models.CharField(max_length=60, verbose_name="nombre")
    from_km = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="desde (km)")
    to_km = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="hasta (km)")
    fee = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="costo de envío")
    is_active = models.BooleanField(default=True, verbose_name="activa")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creada el")

    class Meta:
        managed = False
        db_table = "delivery_zones"
        ordering = ["from_km", "id"]
        verbose_name = "zona de envío"
        verbose_name_plural = "zonas de envío"
        constraints = [
            CheckConstraint(condition=Q(from_km__gte=0), name="delivery_zones_from_km_not_neg"),
            CheckConstraint(condition=Q(to_km__gt=F("from_km")), name="delivery_zones_range"),
            CheckConstraint(condition=Q(fee__gte=0), name="delivery_zones_fee_not_negative"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.from_km}-{self.to_km} km): ${self.fee}"

    def clean(self) -> None:
        """Postgres refuses two active zones that overlap (an exclusion constraint); say why."""
        super().clean()
        if not self.is_active or self.from_km is None or self.to_km is None:
            return
        bounds = (self.from_km, self.to_km)
        if any(isinstance(km, Decimal) and not km.is_finite() for km in bounds):
            return  # `clean_fields` already reported it; do not query with a NaN or an Infinity
        overlapping = (
            DeliveryZone.objects.filter(
                is_active=True, from_km__lt=self.to_km, to_km__gt=self.from_km
            )
            .exclude(pk=self.pk)
            .first()
        )
        if overlapping is not None:
            raise ValidationError(
                f"Esta zona se traslapa con «{overlapping.name}» "
                f"({overlapping.from_km}-{overlapping.to_km} km)."
            )
