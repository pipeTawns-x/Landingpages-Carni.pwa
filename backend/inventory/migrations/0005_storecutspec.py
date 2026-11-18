# The mirror of `product_cut_specs`, which Supabase owns: managed=False, so this migration creates
# nothing in production. The test runner turns it on to build the table in SQLite.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("inventory", "0004_productcost")]

    operations = [
        migrations.CreateModel(
            name="StoreCutSpec",
            fields=[
                (
                    "product",
                    models.OneToOneField(
                        db_column="product_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="store_spec",
                        serialize=False,
                        to="inventory.product",
                    ),
                ),
                (
                    "avg_piece_weight_kg",
                    models.DecimalField(decimal_places=3, max_digits=6, null=True),
                ),
                ("thickness_min_in", models.DecimalField(decimal_places=2, max_digits=4, null=True)),
                ("thickness_max_in", models.DecimalField(decimal_places=2, max_digits=4, null=True)),
                (
                    "thickness_default_in",
                    models.DecimalField(decimal_places=2, max_digits=4, null=True),
                ),
            ],
            options={
                "verbose_name": "especificación de corte de la tienda",
                "verbose_name_plural": "especificaciones de corte de la tienda",
                "db_table": "product_cut_specs",
                "managed": False,
            },
        ),
    ]
