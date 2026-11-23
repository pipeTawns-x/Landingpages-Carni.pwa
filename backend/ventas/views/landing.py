"""The store's landing page: the real index.html, painted by Django (ventas:landing, /).

The template (ventas/index.html) keeps the design, the texts and the sections of index.html. The
two parts that were React islands reading Supabase from the browser are painted here instead, from
the real catalogue (`ventas.catalog`): the nine category tiles and the showcase. Nothing private
reaches the template (no cost, no inactive product). The reviews stay an island of the page, as
index.html mounts them, because their texts live in src/data/resenas.ts. The FAQ is the only
section index.html did not have: the menus and the footers of the other pages link to it.
"""

from django.shortcuts import render
from django.views.decorators.http import require_safe

from inventory.models import Category, store_image_url
from ventas import catalog
from ventas.views.comun import moved_to

index_html = moved_to("ventas:landing")

# What the database does not carry, per category: the icon and the line of its tile. They are the
# texts of src/components/CategoryCard/CategoryCard.tsx, kept word for word (keyed by slug, which
# survives a rename of the category in the panel).
CATEGORY_PRESENTATION = {
    "carnes-rojas": ("bi-fire", "Selección premium para parrilla y asados"),
    "cortes-especiales": ("bi-star-fill", "Cortes exclusivos y gourmet"),
    "cerdo": ("bi-egg-fried", "Chuletas, costillas y carnitas"),
    "pollo": ("bi-egg", "Fresco del día, en todas sus piezas"),
    "embutidos": ("bi-link", "Salchichas, longaniza y tocino"),
    "preparadas": ("bi-basket", "Chorizos y carnes ya sazonadas"),
    "ofertas": ("bi-tag-fill", "Paquetes y precios de temporada"),
    "merch": ("bi-bag-fill", "Gorras, cuchillos y accesorios"),
    "otros": ("bi-box-seam", "Carbón, hielo y lo que falte para el asador"),
}
FALLBACK_PRESENTATION = ("bi-shop", "Productos de la carnicería")
FALLBACK_PHOTO = "/img/products/otrosproductos.webp"

# The showcase of src/components/Showcase/Showcase.tsx: a carousel of six cuts and four cards under
# it. Only the categories sold by weight qualify, because the cards print "/ kg": merch carries a
# price per piece in the same column and `ofertas` are whole packages.
SELLABLE_BY_WEIGHT = frozenset({"cortes-especiales", "carnes-rojas", "cerdo", "pollo"})
SLIDE_COUNT = 6
CARD_COUNT = 4

# The three questions the business can answer today. Two more of the design (weight policy and
# payment) are not published until the butcher shop validates them: an answer it cannot keep is
# worse than no question. The minimum of the first answer is enforced by the store's RPC
# (`below_minimum_order` in ventas/domain.py): this text must follow it.
FAQ = (
    (
        "¿Cuál es el pedido mínimo?",
        "Para entrega a domicilio, $150. Si pasas a recoger a la tienda no hay mínimo.",
    ),
    (
        "¿A qué zonas entregan?",
        "A zonas participantes de San Luis Potosí. Escríbenos o llámanos con tu colonia y te "
        "confirmamos si llegamos.",
    ),
    (
        "¿Puedo pedir por precio en vez de por peso?",
        "Sí. En cada corte eliges por peso, por precio o por pieza, y el grosor que quieres.",
    ),
)


def _bento(categorias):
    """The tiles of the bento: every active category, in its order, with its icon and its photo.

    `posicion` is the tile's number in the grid (`category-card-N` in css/pages/_bento-main.scss).
    It comes from the order column, so reordering the categories in the panel moves the tile. A
    zero (the column's default) means "not placed yet": the tile takes its position in the list.
    """
    tiles = []
    for index, categoria in enumerate(categorias, start=1):
        icono, descripcion = CATEGORY_PRESENTATION.get(categoria.slug, FALLBACK_PRESENTATION)
        tiles.append(
            {
                "categoria": categoria,
                "posicion": categoria.order or index,
                "icono": icono,
                "descripcion": descripcion,
                "foto": store_image_url(categoria.image_url) or FALLBACK_PHOTO,
            }
        )
    return tiles


def _showcase():
    """The slides and the cards: the dearest photographed cuts sold by weight, slides first."""
    candidates = sorted(
        (
            product
            for product in catalog.active_products()
            if product.image_src and product.category.slug in SELLABLE_BY_WEIGHT
        ),
        key=lambda product: product.price_per_kg,
        reverse=True,
    )
    return candidates[:SLIDE_COUNT], candidates[SLIDE_COUNT : SLIDE_COUNT + CARD_COUNT]


@require_safe
def landing(request):
    """The landing page of the store."""
    diapositivas, fichas = _showcase()
    context = {
        "bento": _bento(Category.objects.filter(is_active=True).order_by("order", "name")),
        "diapositivas": diapositivas,
        "fichas": fichas,
        "preguntas": FAQ,
    }
    return render(request, "ventas/index.html", context)


@require_safe
def privacidad(request):
    """The privacy notice of the store (ventas:privacidad, /privacidad/): static text, no data."""
    return render(request, "ventas/tienda/privacidad.html")
