"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # The products are a section of the panel, not a panel of their own. They are
    # mounted here and not from panel/urls.py on purpose: an include inside the
    # `panel` namespace would rename their routes to `panel:inventory:*`, and the
    # contract (docs/CONTRATO_PANEL_DJANGO.md) names them `inventory:*`.
    path("panel/productos/", include("inventory.urls")),
    path("panel/", include("panel.urls")),
]
