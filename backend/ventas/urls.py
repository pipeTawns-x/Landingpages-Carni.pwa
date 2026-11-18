"""The routes of `ventas`: the public catalogue and the sale at the counter of the panel."""

from django.urls import path

from ventas.views import acceso, carrito, landing, mostrador, productos

app_name = "ventas"

urlpatterns = [
    # The store's products.html, migrated into Django. The old address answers with a 301 so
    # links, bookmarks and the service worker of the PWA land on the new page.
    path("productos/", productos.catalogo, name="catalogo"),
    path("products.html", productos.products_html, name="products_html"),
    path("", landing.landing, name="landing"),
    path("privacidad/", landing.privacidad, name="privacidad"),
    path("index.html", landing.index_html, name="index_html"),
    path("acceso/", acceso.acceso, name="acceso"),
    path("accessweb.html", acceso.accessweb_html, name="accessweb_html"),
    # The cart and the order of the customer: plain forms, POST/redirect/GET.
    path("carrito/", carrito.carrito, name="carrito"),
    path("carrito/agregar/<int:pk>/", carrito.agregar, name="tienda_agregar"),
    path("carrito/actualizar/<int:pk>/", carrito.actualizar, name="tienda_actualizar"),
    path("carrito/quitar/<int:pk>/", carrito.quitar, name="tienda_quitar"),
    path("carrito/pedido/", carrito.pedido, name="tienda_pedido"),
    path("pedido/confirmado/", carrito.confirmado, name="pedido_confirmado"),
    path("panel/ventas/nueva/", mostrador.nueva, name="nueva"),
    path(
        "panel/ventas/carrito/agregar/<int:pk>/", mostrador.carrito_agregar, name="carrito_agregar"
    ),
    path(
        "panel/ventas/carrito/actualizar/<int:pk>/",
        mostrador.carrito_actualizar,
        name="carrito_actualizar",
    ),
    path("panel/ventas/carrito/quitar/<int:pk>/", mostrador.carrito_quitar, name="carrito_quitar"),
    path("panel/ventas/procesar/", mostrador.procesar, name="procesar"),
    path("panel/ventas/pedidos/<uuid:pk>/", mostrador.pedido_detalle, name="pedido_detalle"),
]
