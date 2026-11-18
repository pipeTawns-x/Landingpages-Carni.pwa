# The mirror of `product_costs`, which Supabase owns: managed=False, so this migration creates
# nothing in production. The test runner turns it on to build the table in SQLite.
import decimal

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("inventory", "0003_promotion")]

    operations = [
        migrations.CreateModel(
            name="ProductCost",
            fields=[
                (
                    "product",
                    models.OneToOneField(
                        db_column="product_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="cost",
                        serialize=False,
                        to="inventory.product",
                    ),
                ),
                (
                    "cost_per_kg",
                    models.DecimalField(blank=True, decimal_places=4, max_digits=12, null=True),
                ),
                (
                    "cost_per_piece",
                    models.DecimalField(blank=True, decimal_places=4, max_digits=12, null=True),
                ),
                (
                    "yield_pct",
                    models.DecimalField(
                        decimal_places=2, default=decimal.Decimal("100"), max_digits=5
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("updated_by", models.TextField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "costo de producto",
                "verbose_name_plural": "costos de producto",
                "db_table": "product_costs",
                "managed": False,
            },
        ),
    ]
