"""The store's landing page: the static index.html, migrated into Django (ventas:landing, /).

The catalogue part reads the real active products and categories (`ventas.catalog`); nothing
private reaches the template (no cost, no inactive product). The texts that are not data of the
business (the FAQ and the reviews) live here, as they did in src/landing/datos.ts and
src/data/resenas.ts.
"""

from urllib.parse import urlsplit

from django.shortcuts import render
from django.views.decorators.http import require_safe

from inventory.models import Category
from ventas import catalog
from ventas.negocio import NEGOCIO

SHOWCASE_SIZE = 8
HEADLINE = "Carne fresca, cortada como la pides"

# The bento of the categories: a 6 x 6 grid on wide screens, nine tiles of nine different sizes
# (columns x rows), all in one section. The geometry lives in assets/tienda.css (.bento-a ...
# .bento-i); this table only says which category takes which slot and with which photo.
BENTO_SLOTS = {
    "a": {"cols": 3, "rows": 3},
    "b": {"cols": 2, "rows": 2},
    "c": {"cols": 1, "rows": 3},
    "d": {"cols": 2, "rows": 1},
    "e": {"cols": 2, "rows": 3},
    "f": {"cols": 1, "rows": 1},
    "g": {"cols": 1, "rows": 2},
    "h": {"cols": 3, "rows": 1},
    "i": {"cols": 3, "rows": 2},
}
BENTO_TILES = {
    "carnes-rojas": (
        "a",
        "res",
        "Bistec, diezmillo, molida y para caldo",
        "Bistec de res marmoleado sobre la tabla",
    ),
    "cortes-especiales": (
        "b",
        "tomahawk",
        "Tomahawk, rib eye, arrachera",
        "Corte grueso de res con pimienta",
    ),
    "pollo": (
        "c",
        "pollo",
        "Pechuga, pierna y muslo, alas",
        "Piernas de pollo crudas con especias",
    ),
    "embutidos": (
        "d",
        "embutidos",
        "Chorizo, longaniza y salchicha",
        "Chorizo y salchichas sobre tabla",
    ),
    "cerdo": ("e", "cerdo", "Chuleta, costilla, lomo y carnitas", "Chuletas de cerdo frescas"),
    "otros": ("f", "otrosproductos", "Carbón, hielo y más", "Productos para la carne asada"),
    "merch": ("g", "merch", "Gorra, delantal y hielera", "Artículos de la carnicería"),
    "ofertas": ("h", "premium", "Paquetes para 4 a 10 personas", "Paquete de cortes para asar"),
    "preparadas": ("i", "preparadas", "Adobados y marinados listos", "Carne adobada con especias"),
}


def _bento(categorias):
    """The tiles of the bento: every active category, the known ones in their slot first."""
    tiles = []
    for categoria in categorias:
        known = BENTO_TILES.get(categoria.slug)
        if known is None:
            # A category the table does not know yet still shows, after the nine, in a plain tile.
            known = ("x", "premium", "", categoria.name)
        slot, photo, description, alt = known
        tiles.append(
            {
                "categoria": categoria,
                "slot": slot,
                "foto": f"/img/products/{photo}-alto.webp",
                "descripcion": description,
                "alt": alt,
            }
        )
    return sorted(tiles, key=lambda tile: tile["slot"])


# The three questions the business can answer today. Two more of the design (weight policy and
# payment) are not published until the butcher shop validates them: an answer it cannot keep is
# worse than no question.
FAQ = (
    (
        "¿Cuál es el pedido mínimo?",
        "Para entrega a domicilio, $150. Si pasas a recoger a la tienda no hay mínimo.",
    ),
    (
        "¿A qué zonas entregan?",
        "A zonas participantes de San Luis Potosí. Cuando escribes tu dirección en el pedido te "
        "decimos si tu colonia está cubierta.",
    ),
    (
        "¿Puedo pedir por precio en vez de por peso?",
        "Sí. En cada corte eliges por peso, por precio o por pieza, y el grosor que quieres.",
    ),
)

# Real reviews of the shop's Google profile, read on 2026-09-03 (same texts as src/data/resenas.ts).
# The real average and the real count stay on screen, linked to the profile.
GOOGLE_PROFILE = (
    "https://www.google.com/maps/place/Carnicer%C3%ADa+El+Se%C3%B1or+de+La+Misericordia/"
    "@22.1649636,-101.002778,20.28z"
)
RATING = "4.7"
REVIEW_COUNT = 61
REVIEWS = (
    ("marco molina", "Excelente atención y precio. Se recomienda ampliamente."),
    (
        "Oscar Alcocer",
        "Excelente proveedor. Excelente trato de sus dueños. Excelentes recomendaciones!",
    ),
    (
        "Sandra Rodriguez",
        "Tienen muy buena calidad de carne y muy serviciales, la verdad siempre tienen fila pero "
        "atienden súper rápido",
    ),
    (
        "Ramon Lopez Medel",
        "Pequeña carnicería atendida por la familia, encuentras carne fresca de puerco, "
        "pollo y res",
    ),
    ("Rosy Reyna", "Excelente servicio y atención por parte del personal y sus propietarios"),
    ("Armando Viramontes", "Buena carne, buen precio y buena atención"),
)


def _showcase():
    """Up to eight active products, the ones with a photo first."""
    products = list(catalog.active_products())
    with_photo = [product for product in products if product.image_src]
    without_photo = [product for product in products if not product.image_src]
    return (with_photo + without_photo)[:SHOWCASE_SIZE]


@require_safe
def landing(request):
    """The landing page of the store."""
    instagram = urlsplit(NEGOCIO["instagram"]).path.strip("/")
    context = {
        "titular": HEADLINE.split(),
        "bento": _bento(Category.objects.filter(is_active=True).order_by("order", "name")),
        "productos": _showcase(),
        "preguntas": FAQ,
        "resenas": REVIEWS,
        "calificacion": RATING,
        "total_opiniones": REVIEW_COUNT,
        "perfil_google": GOOGLE_PROFILE,
        "instagram_usuario": f"@{instagram}",
    }
    return render(request, "ventas/tienda/landing.html", context)


@require_safe
def privacidad(request):
    """The privacy notice of the store (ventas:privacidad, /privacidad/): static text, no data."""
    return render(request, "ventas/tienda/privacidad.html")
