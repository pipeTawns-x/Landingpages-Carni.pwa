from django.contrib import admin

from inventory.models import Category, CutSpec, Product


class CutSpecInline(admin.StackedInline):
    model = CutSpec
    extra = 0
    can_delete = False


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("order", "name")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price_per_kg", "stock", "is_active")
    search_fields = ("name", "description")
    list_filter = ("category", "is_active")
    inlines = (CutSpecInline,)
