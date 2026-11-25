"""Fill the preview database with the real catalogue and synthetic orders.

    manage.py preview_seed --settings=config.settings_preview

It runs only with the preview settings (they set CARNI_PREVIEW) on SQLite. It creates the tables
first, the managed ones with `migrate` and the unmanaged mirrors of the Supabase tables straight
from their models, then writes:

- the categories and products of `supabase/seed.sql`, read by `panel.preview_catalog` (one source
  of products, S17), each with the unit seed.sql gives it: by kilo (sold by money and weight), by
  piece or by package (both sold by pieces);
- delivery zones, orders in every status and the profile of the synthetic admin. Only the
  customers and their orders are invented; their lines name real products at their real price.

Nothing else that changes how a product looks (discounts, standard sizes, piece weights) is
seeded. Every row has a fixed key: a second run updates the catalogue and the zones and leaves the
orders it already wrote as they are. A database that holds products seed.sql does not know (an
older preview) is refused: delete the preview database file and run again.

Every person and phone number is invented; nothing comes from Supabase.
"""

import uuid
from datetime import timedelta
from decimal import Decimal

from django.apps import apps
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, models, transaction
from django.utils import timezone

from inventory.models import Category, Product
from panel.models import Profile
from panel.preview_catalog import load_catalog
from ventas.models import DeliveryZone, PanelOrder

# The Supabase user id of the synthetic admin the preview entry signs in.
PREVIEW_ADMIN_ID = uuid.UUID("00000000-0000-4000-8000-0000000000ad")
# Orders get ids derived from their key, so a second run finds the ones the first one wrote.
ORDER_NAMESPACE = uuid.UUID("6f1c3c1e-9a3b-4b7a-9d0e-5c0a7e1f2b3c")

# (name, from km, to km, fee)
ZONES = [
    ("Centro", "0", "3", "50.00"),
    ("Cercana", "3", "6", "90.00"),
    ("Media", "6", "10", "160.00"),
    ("Lejana", "10", "15", "210.00"),
]

# (key, status, days ago, customer, phone, delivery type, [(product of seed.sql, kilos)])
ORDERS = [
    ("o1", "pending", 0, "Lucía Ramírez Test", "+52 444 000 0101", "delivery",
     [("Bistec de Res", "1.000")]),
    ("o2", "pending", 0, "Mateo Ortega Test", "+52 444 000 0102", "pickup",
     [("Arrachera", "0.750")]),
    ("o3", "confirmed", 1, "Sofía Torres Test", "+52 444 000 0103", "delivery",
     [("Molida de Res Especial", "2.000"), ("Pollo Entero", "1.800")]),
    ("o4", "preparing", 1, "Diego Herrera Test", "+52 444 000 0104", "pickup",
     [("Rib Eye", "0.600")]),
    ("o5", "ready", 2, "Valeria Cruz Test", "+52 444 000 0105", "delivery",
     [("Chorizo Rojo", "0.500"), ("Pierna y Muslo", "1.500")]),
    ("o6", "delivered", 3, "Lucía Ramírez Test", "+52 444 000 0101", "delivery",
     [("Pierna de Cerdo sin Hueso", "3.000")]),
    ("o7", "delivered", 5, "Andrés Molina Test", "+52 444 000 0106", "pickup",
     [("Bistec de Res", "0.500"), ("Costilla de Cerdo", "1.000")]),
    ("o8", "cancelled", 6, "Mateo Ortega Test", "+52 444 000 0102", "pickup",
     [("Chuleta de Cerdo", "1.000")]),
]  # fmt: skip


def ensure_tables():
    """Create the tables that are missing: managed ones by `migrate`, mirrors from their models."""
    all_models = apps.get_models()
    existing = set(connection.introspection.table_names())
    if any(m._meta.managed and m._meta.db_table not in existing for m in all_models):
        call_command("migrate", run_syncdb=True, interactive=False, verbosity=0)
        existing = set(connection.introspection.table_names())
    missing = [m for m in all_models if not m._meta.managed and m._meta.db_table not in existing]
    if missing:
        with connection.schema_editor() as editor:
            for model in missing:
                editor.create_model(model)


def refuse_foreign_products(catalog):
    """Stop when the database already holds products or categories seed.sql does not have."""
    names = {product.name for product in catalog.products}
    foreign = sorted(set(Product.objects.values_list("name", flat=True)) - names)
    expected = {position: c.slug for position, c in enumerate(catalog.categories, start=1)}
    foreign += sorted(
        slug for pk, slug in Category.objects.values_list("pk", "slug") if expected.get(pk) != slug
    )
    if foreign:
        raise CommandError(
            "The preview database holds rows that are not in supabase/seed.sql "
            f"({', '.join(foreign[:5])}). Delete the preview database file and run again."
        )


def seed_catalog(catalog):
    """Write the categories and products of seed.sql, with the ids seed.sql gives them."""
    categories = {}
    # seed.sql truncates with RESTART IDENTITY, so its rows take the ids 1, 2, ... in order.
    for pk, category in enumerate(catalog.categories, start=1):
        categories[category.slug], _ = Category.objects.update_or_create(
            pk=pk,
            defaults={
                "name": category.name,
                "slug": category.slug,
                "image_url": category.image_url,
                "is_active": category.is_active,
                "order": category.order,
            },
        )
    products = {}
    for pk, item in enumerate(catalog.products, start=1):
        products[item.name], _ = Product.objects.update_or_create(
            pk=pk,
            defaults={
                "category": categories[item.category_slug],
                "name": item.name,
                "description": item.description,
                "price_per_kg": item.price_per_kg,
                "image_url": item.image_url,
                "stock": item.stock,
                "min_quantity_kg": item.min_quantity_kg,
                "is_active": item.is_active,
                # save() derives stock_unit and sale_modes from it, as the SELECT of seed.sql.
                "price_unit": item.price_unit,
            },
        )
    return products


def seed_zones():
    for name, from_km, to_km, fee in ZONES:
        DeliveryZone.objects.update_or_create(
            name=name,
            defaults={
                "from_km": Decimal(from_km),
                "to_km": Decimal(to_km),
                "fee": Decimal(fee),
                "is_active": True,
            },
        )


def seed_orders(products, now):
    for key, status, days_ago, customer, phone, delivery, items in ORDERS:
        order_id = uuid.uuid5(ORDER_NAMESPACE, key)
        if PanelOrder.objects.filter(pk=order_id).exists():
            continue
        lines = []
        for name, kilos in items:
            product = products[name]
            subtotal = (Decimal(kilos) * product.price_per_kg).quantize(Decimal("0.01"))
            lines.append({
                "product_id": product.pk,
                "product_name": product.name,
                "sale_mode": "weight",
                "quantity_kg": kilos,
                "pieces": None,
                "unit_price": str(product.price_per_kg),
                "discount": "0.00",
                "subtotal": str(subtotal),
                "note": None,
            })  # fmt: skip
        created = now - timedelta(days=days_ago, hours=1)
        row = PanelOrder(
            order_id=order_id,
            status=status,
            channel="web",
            customer_name=customer,
            customer_phone=phone,
            delivery_type=delivery,
            delivery_address={"street": "Calle Ficticia 123", "zone": "Centro"}
            if delivery == "delivery"
            else {},
            notes="",
            payment_method="card",
            currency="MXN",
            total_mxn=sum(Decimal(line["subtotal"]) for line in lines),
            created_at=created,
            updated_at=created,
            lines=lines,
        )
        # The mirror refuses writes from Django on purpose; the preview database stands in for
        # the one that writes it in production.
        models.Model.save(row, force_insert=True)


def seed_admin():
    if not Profile.objects.filter(pk=PREVIEW_ADMIN_ID).exists():
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO profiles (id, role) VALUES (%s, %s)",
                [PREVIEW_ADMIN_ID.hex, Profile.ADMIN],
            )


class Command(BaseCommand):
    help = "Create the preview tables and fill them with the real catalogue (preview only)."

    def handle(self, *args, **options):
        if not getattr(settings, "CARNI_PREVIEW", False) or connection.vendor != "sqlite":
            raise CommandError(
                "preview_seed only runs with --settings=config.settings_preview on SQLite."
            )
        catalog = load_catalog()
        ensure_tables()
        refuse_foreign_products(catalog)
        now = timezone.now()
        with transaction.atomic():
            products = seed_catalog(catalog)
            seed_zones()
            seed_orders(products, now)
            seed_admin()
        if options["verbosity"]:
            self.stdout.write(
                f"Preview data ready: {Product.objects.count()} products from supabase/seed.sql, "
                f"{PanelOrder.objects.count()} orders."
            )
