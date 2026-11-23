"""Context every template receives from `ventas`."""

from django.urls import reverse
from django.utils.functional import SimpleLazyObject

from inventory.models import Category
from ventas import catalog
from ventas.cart import public_lines
from ventas.negocio import HORARIO, NEGOCIO


def negocio(request):
    """The business data for the header and the footer of the public pages."""
    return {"negocio": NEGOCIO, "horario": HORARIO}


def _amount_of(line):
    """How the customer asked for a line, in words: "0.5 kg", "$150", "4 piezas · 1.25 in"."""
    amount, mode = line["amount"], line["mode"]
    if mode == "money":
        return f"${amount}"
    if mode == "weight":
        return f"{amount} {line['unit'] or 'kg'}"
    pieces = "pieza" if amount == "1" else "piezas"
    thickness = f" · {line['thickness_in']} in" if line.get("thickness_in") else ""
    return f"{amount} {pieces}{thickness}"


def _bag(request):
    """The lines of the public cart with the name of each product, for the cart panel.

    No price: the prices are quoted by the store on the cart page. A product that left the
    catalogue drops out of the panel (the cart page explains it when the order is placed).
    """
    lines = public_lines(request.session)
    if not lines:
        return []
    products = catalog.active_products().in_bulk([line["product_id"] for line in lines])
    return [
        {
            "product": products[line["product_id"]],
            "amount": _amount_of(line),
            "note": line["note"],
        }
        for line in lines
        if line["product_id"] in products
    ]


def bag_payload(request):
    """The cart panel as the JSON of a cart write: the same lines as `bolsa`, no price.

    A script that adds a line without reloading draws the drawer from this, so what it shows is
    what the next page would print.
    """
    lines = _bag(request)
    return {
        "total_lineas": len(lines),
        "lineas": [
            {
                "producto_id": line["product"].pk,
                "nombre": line["product"].name,
                "url": reverse("ventas:producto", args=[line["product"].pk]),
                "imagen": line["product"].image_src,
                "cantidad": line["amount"],
                "nota": line["note"],
            }
            for line in lines
        ],
    }


def tienda(request):
    """The cart panel and the categories of the menu, read only when a template uses them."""
    return {
        "bolsa": SimpleLazyObject(lambda: _bag(request)),
        "menu_categorias": SimpleLazyObject(
            lambda: list(Category.objects.filter(is_active=True).order_by("order", "name"))
        ),
    }
