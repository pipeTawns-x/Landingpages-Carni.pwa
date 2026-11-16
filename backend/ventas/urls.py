"""The routes of `ventas`: the public catalogue and the sale at the counter of the panel."""

from django.urls import path

from ventas import views

app_name = "ventas"

urlpatterns = [
    path("tienda/", views.catalogo, name="catalogo"),
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
