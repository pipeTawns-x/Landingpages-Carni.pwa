"""Models for the EBAC M14 "Django Models & Admin" practice.

Course-only app: a standalone `Product` with no relation to the Supabase-owned
catalog in `inventory`. Its table is Django-owned (it lands in the `django`
schema), so migrations may create and change it freely. It is the only concrete
model here, which keeps `dumpdata ecommerce` limited to the sample products.
"""

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base that stamps when a row was created and last changed."""

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado el")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado el")

    class Meta:
        abstract = True


class Product(TimeStampedModel):
    """Sample product used to practice bulk_create, fixtures and the admin."""

    name = models.CharField(max_length=120, verbose_name="nombre")
    slug = models.SlugField(
        max_length=140,
        unique=True,
        blank=True,
        verbose_name="slug",
        help_text="Se genera automáticamente a partir del nombre.",
    )
    description = models.TextField(blank=True, verbose_name="descripción")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name="precio",
    )
    stock = models.PositiveIntegerField(default=0, verbose_name="inventario")
    is_active = models.BooleanField(default=True, verbose_name="activo")

    class Meta:
        ordering = ["name"]
        verbose_name = "producto"
        verbose_name_plural = "productos"

    def __str__(self) -> str:
        return self.name
