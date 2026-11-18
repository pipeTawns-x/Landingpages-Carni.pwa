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
        "categorias": Category.objects.filter(is_active=True).order_by("order", "name"),
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
