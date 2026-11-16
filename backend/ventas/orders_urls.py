"""The orders section of the panel, mounted at /panel/pedidos/ under the `orders` namespace.

The frame of the panel marks its menu entry with the namespace `orders` (panel/base.html), so
the board has its own URL module even though its views live in `ventas`.
"""

from django.urls import path

from ventas import views

app_name = "orders"

urlpatterns = [
    path("", views.tablero, name="board"),
    path("<uuid:pk>/mover/", views.pedido_mover, name="mover"),
]
