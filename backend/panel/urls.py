"""URL routes of the panel shell, mounted at /panel/."""

from django.urls import path

from panel import views, views_compras, views_descuentos

app_name = "panel"

urlpatterns = [
    path("", views.inicio, name="inicio"),
    path("acceso/", views.acceso, name="acceso"),
    path("sesion/", views.sesion, name="sesion"),
    path("salir/", views.salir, name="salir"),
    path("mas/", views.mas, name="mas"),
    path("entregas/", views.entregas, name="entregas"),
    path("inventario/", views.inventario, name="inventario"),
    path("clientes/", views.clientes, name="clientes"),
    path("compras/", views_compras.compras, name="compras"),
    path("descuentos/", views_descuentos.descuentos, name="descuentos"),
    path("ajustes/", views.ajustes, name="ajustes"),
    path("buildads/", views.buildads, name="buildads"),
    path("productads/", views.productads, name="productads"),
    path("invitado/<str:token>/", views.invitado, name="invitado"),
    path("invitado/<str:token>", views.invitado_sin_barra, name="invitado_sin_barra"),
]
