"""Give the catalogue the piece weights the previous cart of the store used.

The old cart (src/pages/ProductoDetalle.tsx on `frontend`, PESO_POR_PIEZA_SUGERIDO and
porFamilia) knew what a piece of each cut weighs, so customers could ask for "3 bistecs". This
command writes those weights to the cut spec of each product priced per kilo that has none yet,
with the default thickness of that cart (1.25 in), and syncs them to the store. A weight the
owner already set is kept. Running it twice changes nothing.
"""

import re
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from inventory.models import CutSpec, Product
from inventory.services import sync_store_spec

DEFAULT_THICKNESS_IN = Decimal("1.25")

# By exact name (lower case), as the old cart had them.
BY_NAME = {
    "bravette steak": "0.3",
    "filete mignon": "0.25",
    "filet mignon": "0.25",
    "flank steak": "0.4",
    "new york strip": "0.35",
    "porterhouse": "0.5",
    "rib eye": "0.4",
    "ribeye": "0.4",
    "skirt steak": "0.3",
    "tomahawk": "0.8",
    "top sirloin": "0.35",
    "arrachera": "0.35",
}

# By family, first match wins, in the order of the old cart.
BY_FAMILY = (
    (r"bistec|bisteck|milanesa", "0.12"),
    (r"pierna y muslo|pierna con muslo|pierna", "0.35"),
    (r"media pechuga", "0.3"),
    (r"pechuga", "0.55"),
    (r"muslo", "0.18"),
    (r"\bala|alita", "0.09"),
    (r"chorizo|longaniza", "0.25"),
    (r"salchicha", "0.06"),
    (r"chuleta", "0.22"),
    (r"costilla", "0.4"),
)


def piece_weight_for(name: str) -> Decimal | None:
    """The weight of a piece of the product named `name`, or None when the old cart had none."""
    key = name.strip().lower()
    if key in BY_NAME:
        return Decimal(BY_NAME[key])
    for pattern, weight in BY_FAMILY:
        if re.search(pattern, key):
            return Decimal(weight)
    return None


class Command(BaseCommand):
    help = "Carga los pesos por pieza del carrito anterior en los productos que no tienen uno."

    def handle(self, *args, **options):
        updated = 0
        products = Product.objects.filter(price_unit=Product.PriceUnit.KG).order_by("pk")
        for product in products:
            weight = piece_weight_for(product.name)
            if weight is None:
                continue
            with transaction.atomic():
                spec = CutSpec.objects.filter(product=product).first()
                if spec is not None and spec.avg_piece_weight_kg:
                    continue
                if spec is None:
                    spec = CutSpec(product=product)
                spec.avg_piece_weight_kg = weight
                if not spec.thickness_default_in:
                    spec.thickness_default_in = DEFAULT_THICKNESS_IN
                spec.save()
                sync_store_spec(product)
                updated += 1
        self.stdout.write(f"{updated} productos con peso por pieza.")
