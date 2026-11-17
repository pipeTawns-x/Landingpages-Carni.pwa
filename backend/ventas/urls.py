"""The routes of `ventas`: the public catalogue and the sale at the counter of the panel."""

from django.urls import path

from ventas import views, views_acceso, views_carrito, views_landing

app_name = "ventas"

urlpatterns = [
    # The store's products.html, migrated into Django. The old address answers with a 301 so
    # links, bookmarks and the service worker of the PWA land on the new page.
    path("productos/", views_carrito.catalogo, name="catalogo"),
    path("products.html", views.products_html, name="products_html"),
    path("", views_landing.landing, name="landing"),
    path("index.html", views.index_html, name="index_html"),
    path("acceso/", views_acceso.acceso, name="acceso"),
    path("accessweb.html", views.accessweb_html, name="accessweb_html"),
    # The cart and the order of the customer: plain forms, POST/redirect/GET.
    path("carrito/", views_carrito.carrito, name="carrito"),
    path("carrito/agregar/<int:pk>/", views_carrito.agregar, name="tienda_agregar"),
    path("carrito/actualizar/<int:pk>/", views_carrito.actualizar, name="tienda_actualizar"),
    path("carrito/quitar/<int:pk>/", views_carrito.quitar, name="tienda_quitar"),
    path("carrito/pedido/", views_carrito.pedido, name="tienda_pedido"),
    path("pedido/confirmado/", views_carrito.confirmado, name="pedido_confirmado"),
    path("panel/ventas/nueva/", views.nueva, name="nueva"),
    path("panel/ventas/carrito/agregar/<int:pk>/", views.carrito_agregar, name="carrito_agregar"),
    path(
        "panel/ventas/carrito/actualizar/<int:pk>/",
        views.carrito_actualizar,
        name="carrito_actualizar",
    ),
    path("panel/ventas/carrito/quitar/<int:pk>/", views.carrito_quitar, name="carrito_quitar"),
    path("panel/ventas/procesar/", views.procesar, name="procesar"),
    path("panel/ventas/pedidos/<uuid:pk>/", views.pedido_detalle, name="pedido_detalle"),
]
