"""Create sample products in bulk for the EBAC M14 practice."""

from django.core.management.base import BaseCommand, CommandError

from ecommerce.models import Product
from ecommerce.sample_data import build_sample_products

# Slugs checked per query. SQLite caps a query at 999 parameters, so the
# existence check works in chunks instead of one huge IN list.
SLUG_LOOKUP_CHUNK = 500


class Command(BaseCommand):
    help = "Crea productos de prueba con bulk_create (500 por defecto)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=500,
            help="Cantidad de productos a crear (por defecto 500).",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Productos por INSERT (por defecto 100).",
        )

    def handle(self, *args, **options):
        count = options["count"]
        batch_size = options["batch_size"]
        if count < 1:
            raise CommandError("--count debe ser un entero mayor o igual a 1.")
        if batch_size < 1:
            raise CommandError("--batch-size debe ser un entero mayor o igual a 1.")

        products = build_sample_products(count)

        # Fail with a readable message instead of an IntegrityError halfway in.
        slugs = [product.slug for product in products]
        clashes = []
        for start in range(0, len(slugs), SLUG_LOOKUP_CHUNK):
            chunk = slugs[start : start + SLUG_LOOKUP_CHUNK]
            clashes.extend(Product.objects.filter(slug__in=chunk).values_list("slug", flat=True))
        if clashes:
            raise CommandError(
                f"Ya existen {len(clashes)} productos con los mismos slugs "
                f"(por ejemplo: {clashes[0]}). No se creó nada. "
                "Elimina primero los productos de prueba y vuelve a intentarlo."
            )

        # One INSERT per batch instead of one per product. bulk_create() runs
        # every batch inside a single transaction, so it inserts all or none.
        created = Product.objects.bulk_create(products, batch_size=batch_size)

        self.stdout.write(
            self.style.SUCCESS(
                f"Se crearon {len(created)} productos de prueba (lotes de {batch_size})."
            )
        )
        self.stdout.write(f"Total de productos en la base de datos: {Product.objects.count()}")
