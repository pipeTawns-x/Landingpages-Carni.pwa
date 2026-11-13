"""Mirrors of the Supabase views that the sales pages read.

`panel_orders` is a view of the store (SECURITY DEFINER, `SELECT` only for the `django` role)
that joins an order with its lines and with the name to show for the customer. Django reads it
and never writes it: an order is born and changes through the Postgres functions (see
`ventas.services`), so a write from Django is refused here the way `inventory.ReadOnlyModel`
refuses it for every mirror.
"""

from django.db import models

from inventory.models import ReadOnlyModel


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
