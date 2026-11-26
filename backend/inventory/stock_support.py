"""Real products for the stock tests: names, units and numbers come from `supabase/seed.sql`.

S17 says the store has one source of products. The tests of the stock screen use it too, through
`panel.preview_catalog` (it reads seed.sql without running any SQL), so no product here is made up.
"""

from functools import cache

from inventory.models import Category, Product
from inventory.stock import Holding
from panel.preview_catalog import SeedProduct, load_catalog


@cache
def _catalogue() -> dict[str, SeedProduct]:
    return {item.name: item for item in load_catalog().products}


@cache
def _categories() -> dict[str, str]:
    return {category.slug: category.name for category in load_catalog().categories}


def real(name: str) -> SeedProduct:
    """The row of seed.sql with this name."""
    return _catalogue()[name]


def holding(product_id: int, name: str) -> Holding:
    """A real product as the stock rules see it, with the stock seed.sql gives it."""
    item = real(name)
    unit = "kg" if item.price_unit == "kg" else "piece"
    return Holding(product_id, name, unit, item.stock)


def create_product(name: str, **overrides) -> Product:
    """Insert a real product in the test database, with the price and the stock of seed.sql."""
    item = real(name)
    category, _ = Category.objects.get_or_create(
        slug=item.category_slug, defaults={"name": _categories()[item.category_slug]}
    )
    values = {
        "category": category,
        "name": item.name,
        "price_per_kg": item.price_per_kg,
        "price_unit": item.price_unit,
        "stock": item.stock,
        "image_url": item.image_url,
    }
    return Product.objects.create(**{**values, **overrides})
