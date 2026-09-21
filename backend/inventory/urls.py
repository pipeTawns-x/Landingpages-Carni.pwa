"""URL routes for the inventory app."""

from django.urls import path

from inventory import views

app_name = "inventory"

urlpatterns = [
    path("", views.product_list, name="list"),
    path("<int:product_id>/", views.product_detail, name="detail"),
    path("nuevo/", views.product_create, name="create"),
    path("<int:product_id>/editar/", views.product_update, name="update"),
    path("<int:product_id>/eliminar/", views.product_delete, name="delete"),
]
