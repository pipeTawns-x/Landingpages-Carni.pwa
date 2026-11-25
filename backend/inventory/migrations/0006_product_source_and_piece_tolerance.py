# Two columns of tables that Supabase owns (supabase/migrations/20261125000001): managed=False, so
# this migration changes nothing in production. The test runner builds them in SQLite.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("inventory", "0005_storecutspec")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="source_product",
            field=models.ForeignKey(
                blank=True,
                db_column="source_product_id",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sellables",
                to="inventory.product",
                verbose_name="fuente",
            ),
        ),
        migrations.AddField(
            model_name="storecutspec",
            name="piece_tolerance_kg",
            field=models.DecimalField(decimal_places=3, max_digits=6, null=True),
        ),
    ]
