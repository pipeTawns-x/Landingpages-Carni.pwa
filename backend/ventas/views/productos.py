"""The public catalogue (ventas:catalogo, /productos/): the store's products.html in Django.

The old address answers with a 301, so links, bookmarks and the service worker of the PWA land
on the new page.
"""

from django.shortcuts import render
from django.views.decorators.http import require_safe

from ventas import catalog, domain
from ventas.views.comun import listing, modes_of, moved_to

CATALOG_PER_PAGE = 24

products_html = moved_to("ventas:catalogo")


@require_safe
def catalogo(request):
    """The public catalogue with a form to add each product: the ways it can be sold come from
    `ventas.catalog`, the same source the counter sale uses. Reads only; no database function."""
    context = listing(request, CATALOG_PER_PAGE)
    for product in context["page_obj"]:
        product.modes = modes_of(product)
        product.asks_thickness = catalog.asks_thickness(product)
    context["units"] = domain.UNITS
    return render(request, "ventas/tienda/productos.html", context)
