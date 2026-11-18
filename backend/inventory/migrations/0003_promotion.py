# The mirror of `product_promotions`, which Supabase owns: managed=False, so this migration
# creates nothing in production. The test runner turns it on to build the table in SQLite.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("inventory", "0002_favorite_orderitem")]

    operations = [
        migrations.CreateModel(
            name="Promotion",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                (
                    "kind",
                    models.TextField(
                        choices=[
                            ("percent", "Porcentaje"),
                            ("amount_off", "Monto menos"),
                            ("fixed_price", "Precio fijo"),
                        ]
                    ),
                ),
                ("value", models.DecimalField(decimal_places=2, max_digits=12)),
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField()),
                ("is_active", models.BooleanField(default=True)),
                (
                    "product",
                    models.ForeignKey(
                        db_column="product_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="promotions",
                        to="inventory.product",
                    ),
                ),
            ],
            options={
                "verbose_name": "descuento",
                "verbose_name_plural": "descuentos",
                "db_table": "product_promotions",
                "managed": False,
            },
        ),
    ]
