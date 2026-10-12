"""URL routes of the ecommerce practice app, mounted at the root by config/urls.py."""

from django.urls import path

from ecommerce import views

app_name = "ecommerce"

urlpatterns = [
    path("my-products/", views.ProtectedListView.as_view(), name="my-products"),
]
