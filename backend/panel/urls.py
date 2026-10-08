"""URL routes of the panel shell, mounted at /panel/."""

from django.urls import path

from panel import views

app_name = "panel"

urlpatterns = [
    path("", views.inicio, name="inicio"),
    path("acceso/", views.acceso, name="acceso"),
    path("sesion/", views.sesion, name="sesion"),
    path("salir/", views.salir, name="salir"),
    path("mas/", views.mas, name="mas"),
]
