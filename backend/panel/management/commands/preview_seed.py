"""Fill the preview database with a synthetic butcher shop.

    manage.py preview_seed --settings=config.settings_preview

It runs only with the preview settings (they set CARNI_PREVIEW) on SQLite. It creates the tables
first, the managed ones with `migrate` and the unmanaged mirrors of the Supabase tables straight
from their models, then writes the rows every page reads today: categories, products sold by kilo,
by piece and as merchandise, cut specs, dated discounts, standard sizes and delivery zones, orders
in every status, and the profile of the synthetic admin. Every row has a fixed key, so a second
run never adds rows: it updates the categories, products, cut specs, discounts, sizes and zones,
and leaves the orders it already wrote as they are.

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

from inventory.models import Category, CutSpec, Product, Promotion, StoreCutSpec
from panel.models import Profile
from ventas.models import DeliveryZone, PanelOrder, ProductSize

# The Supabase user id of the synthetic admin the preview entry signs in.
PREVIEW_ADMIN_ID = uuid.UUID("00000000-0000-4000-8000-0000000000ad")
# Orders get ids derived from their key, so a second run finds the ones the first one wrote.
ORDER_NAMESPACE = uuid.UUID("6f1c3c1e-9a3b-4b7a-9d0e-5c0a7e1f2b3c")

CATEGORIES = [
    ("Carnes Rojas", "carnes-rojas", 1),
    ("Cerdo", "cerdo", 2),
    ("Pollo", "pollo", 3),
    ("Preparadas", "preparadas", 4),
    ("Merch", "merch", 5),
]

# (name, category slug, price unit, price, stock, avg piece weight in kg or None)
PRODUCTS = [
    ("Bistec de res", "carnes-rojas", "kg", "289.00", "18.500", None),
    ("Molida de res", "carnes-rojas", "kg", "219.00", "12.000", None),
    ("Arrachera marinada", "carnes-rojas", "kg", "399.00", "6.250", None),
    ("Pierna de puerco", "cerdo", "kg", "149.00", "10.000", None),
    ("Molida mixta", "cerdo", "kg", "189.00", "4.000", None),
    ("Pollo entero", "pollo", "piece", "165.00", "14", "1.800"),
    ("Milanesa de res 100 g", "preparadas", "piece", "20.00", "60", "0.100"),
    ("Hamburguesa preparada", "preparadas", "piece", "65.00", "25", "0.180"),
    ("Delantal de la carnicería", "merch", "piece", "250.00", "12", None),
    ("Paquete parrillero", "merch", "package", "899.00", "5", None),
]

SIZES_GRAMS = [340, 500, 700]
SIZED_PRODUCTS = ["Bistec de res", "Arrachera marinada"]

# (name, from km, to km, fee)
ZONES = [
    ("Centro", "0", "3", "50.00"),
    ("Cercana", "3", "6", "90.00"),
    ("Media", "6", "10", "160.00"),
    ("Lejana", "10", "15", "210.00"),
]

# (key, status, days ago, customer, phone, delivery type, [(product, quantity kg, pieces)])
ORDERS = [
    ("o1", "pending", 0, "Lucía Ramírez Test", "+52 444 000 0101", "delivery",
     [("Bistec de res", "1.000", None)]),
    ("o2", "pending", 0, "Mateo Ortega Test", "+52 444 000 0102", "pickup",
     [("Milanesa de res 100 g", "0.600", 6)]),
    ("o3", "confirmed", 1, "Sofía Torres Test", "+52 444 000 0103", "delivery",
     [("Molida de res", "2.000", None), ("Pollo entero", "1.800", 1)]),
    ("o4", "preparing", 1, "Diego Herrera Test", "+52 444 000 0104", "pickup",
     [("Arrachera marinada", "1.500", None)]),
    ("o5", "ready", 2, "Valeria Cruz Test", "+52 444 000 0105", "delivery",
     [("Hamburguesa preparada", "0.720", 4)]),
    ("o6", "delivered", 3, "Lucía Ramírez Test", "+52 444 000 0101", "delivery",
     [("Pierna de puerco", "3.000", None)]),
    ("o7", "delivered", 5, "Andrés Molina Test", "+52 444 000 0106", "pickup",
     [("Bistec de res", "0.500", None), ("Delantal de la carnicería", "0.000", 1)]),
    ("o8", "cancelled", 6, "Mateo Ortega Test", "+52 444 000 0102", "pickup",
     [("Molida mixta", "1.000", None)]),
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


def seed_catalog():
    categories = {}
    for name, slug, order in CATEGORIES:
        categories[slug], _ = Category.objects.update_or_create(
            slug=slug, defaults={"name": name, "order": order, "is_active": True}
        )
    products = {}
    for name, slug, unit, price, stock, piece_kg in PRODUCTS:
        product, _ = Product.objects.update_or_create(
            name=name,
            defaults={
                "category": categories[slug],
                "description": f"{name} (synthetic preview data).",
                "price_per_kg": Decimal(price),
                "price_unit": unit,
                "stock": Decimal(stock),
                "is_active": True,
            },
        )
        products[name] = product
        if piece_kg is not None:
            weight = Decimal(piece_kg)
            CutSpec.objects.update_or_create(
                product=product, defaults={"avg_piece_weight_kg": weight, "presentation": "piece"}
            )
            StoreCutSpec.objects.update_or_create(
                product=product, defaults={"avg_piece_weight_kg": weight}
            )
    return products


def seed_prices(products, now):
    for name in SIZED_PRODUCTS:
        for grams in SIZES_GRAMS:
            ProductSize.objects.update_or_create(
                product=products[name], grams=grams, defaults={"is_active": True}
            )
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
    discounts = [
        ("Bistec de res", "percent", "10.00", -2, 5),
        ("Molida de res", "amount_off", "20.00", 7, 14),
    ]
    for name, kind, value, starts, ends in discounts:
        day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        Promotion.objects.update_or_create(
            product=products[name],
            kind=kind,
            defaults={
                "value": Decimal(value),
                "starts_at": day + timedelta(days=starts),
                "ends_at": day + timedelta(days=ends),
                "is_active": True,
            },
        )


def seed_orders(products, now):
    for key, status, days_ago, customer, phone, delivery, items in ORDERS:
        order_id = uuid.uuid5(ORDER_NAMESPACE, key)
        if PanelOrder.objects.filter(pk=order_id).exists():
            continue
        lines = []
        for name, kilos, pieces in items:
            product = products[name]
            amount = Decimal(pieces) if pieces and product.price_unit != "kg" else Decimal(kilos)
            subtotal = (amount * product.price_per_kg).quantize(Decimal("0.01"))
            lines.append({
                "product_id": product.pk,
                "product_name": name,
                "sale_mode": "pieces" if pieces else "weight",
                "quantity_kg": kilos,
                "pieces": pieces,
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
    help = "Create the preview tables and fill them with synthetic data (preview settings only)."

    def handle(self, *args, **options):
        if not getattr(settings, "CARNI_PREVIEW", False) or connection.vendor != "sqlite":
            raise CommandError(
                "preview_seed only runs with --settings=config.settings_preview on SQLite."
            )
        ensure_tables()
        now = timezone.now()
        with transaction.atomic():
            products = seed_catalog()
            seed_prices(products, now)
            seed_orders(products, now)
            seed_admin()
        if options["verbosity"]:
            self.stdout.write(
                f"Preview data ready: {Product.objects.count()} products, "
                f"{PanelOrder.objects.count()} orders, {Promotion.objects.count()} discounts."
            )
