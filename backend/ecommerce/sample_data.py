"""Deterministic sample data for the M14 practice.

There is no randomness on purpose: the same call always yields the same names,
slugs and prices. Primary keys and timestamps are not covered by that promise:
the database assigns the keys and the rows get their timestamps when they are
saved, so both change every time the fixture is regenerated.
"""

from decimal import Decimal

from django.utils.text import slugify

from ecommerce.models import Product

CUTS = (
    "Arrachera",
    "Rib Eye",
    "New York",
    "Costilla cargada",
    "Picaña",
    "Chuleta de cerdo",
    "Pechuga de pollo",
    "Molida de res",
    "Chorizo",
    "Tocino",
)

BASE_PRICE = Decimal("89.00")
PRICE_STEP = Decimal("7.50")


def build_sample_products(count: int) -> list[Product]:
    """Return `count` unsaved products, numbered from 1 and built in a loop."""
    products = []
    for i in range(1, count + 1):
        cut = CUTS[(i - 1) % len(CUTS)]
        name = f"{cut} de prueba {i:03d}"
        products.append(
            Product(
                name=name,
                # bulk_create() never calls save() nor sends pre_save, so the
                # signal that normally fills the slug does not run: set it here.
                slug=slugify(name),
                description=f"Producto de prueba #{i} generado con bulk_create.",
                price=BASE_PRICE + Decimal(i % 50) * PRICE_STEP,
                stock=i % 40,
            )
        )
    return products
