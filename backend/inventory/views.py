"""Function-based views for the inventory app.

Implements the EBAC M13 "Django Views" practice: five FBVs (list, detail,
create, update, delete) backed by ModelForms, `get_object_or_404`,
`django.contrib.messages`, and POST-redirect-GET.
"""

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import connection
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

from inventory.forms import CutSpecForm, ProductForm
from inventory.models import Category, CutSpec, Product


@login_required
def product_list(request):
    """List products, with optional free-text search and category filter."""
    query = request.GET.get("q", "").strip()
    category_id = request.GET.get("category", "").strip()

    products = Product.objects.select_related("category")

    if query:
        products = products.filter(Q(name__icontains=query) | Q(description__icontains=query))

    # A hand-edited or stale query string must not break the list: a category
    # that is not a number is ignored instead of raising ValueError.
    if category_id.isdigit():
        products = products.filter(category_id=int(category_id))
    else:
        category_id = ""

    context = {
        "products": products,
        "categories": Category.objects.all(),
        "query": query,
        "selected_category": category_id,
    }
    return render(request, "inventory/product_list.html", context)


def _product_references(product_id: int) -> tuple[int, int]:
    """Return how many order items and favorites point at a product.

    Neither table has a Django model (both belong to Supabase), so this is a
    parameterised raw query. `order_items.product_id` is ON DELETE RESTRICT
    and `favorites.product_id` is ON DELETE CASCADE, so the first number
    blocks a delete and the second one warns about what it drags along.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT "
            "(SELECT count(*) FROM public.order_items WHERE product_id = %s), "
            "(SELECT count(*) FROM public.favorites WHERE product_id = %s)",
            [product_id, product_id],
        )
        orders, favorites = cursor.fetchone()
    return orders, favorites


@login_required
def product_detail(request, product_id):
    """Show a single product and its cut spec, if it has one."""
    product = get_object_or_404(Product.objects.select_related("category"), pk=product_id)
    spec = CutSpec.objects.filter(product=product).first()
    return render(request, "inventory/product_detail.html", {"product": product, "spec": spec})


def _spec_form_has_data(spec_form: CutSpecForm) -> bool:
    """Return True if the staff member filled in at least one spec field."""
    return any(value not in (None, "", []) for value in spec_form.cleaned_data.values())


@login_required
def product_create(request):
    """Create a product and, optionally, its cut spec."""
    if request.method == "POST":
        product_form = ProductForm(request.POST)
        spec_form = CutSpecForm(request.POST)

        if product_form.is_valid() and spec_form.is_valid():
            product = product_form.save()

            if _spec_form_has_data(spec_form):
                spec = spec_form.save(commit=False)
                spec.product = product
                spec.save()

            messages.success(request, f'Producto "{product.name}" creado correctamente.')
            return redirect("inventory:detail", product_id=product.id)
    else:
        product_form = ProductForm()
        spec_form = CutSpecForm()

    context = {
        "product_form": product_form,
        "spec_form": spec_form,
        "is_update": False,
    }
    return render(request, "inventory/product_form.html", context)


@login_required
def product_update(request, product_id):
    """Update a product and its cut spec.

    If `price_per_kg` or `min_quantity_kg` changes, the change is not saved
    immediately: a confirmation page shows the before/after values and the
    save only happens once the user resubmits with `confirm=1`.
    """
    product = get_object_or_404(Product, pk=product_id)
    try:
        spec = product.spec
    except CutSpec.DoesNotExist:
        # Unsaved instance on purpose: a GET must never write to the database.
        # The row is created only when the form is submitted with data.
        spec = CutSpec(product=product)

    old_price_per_kg = product.price_per_kg
    old_min_quantity_kg = product.min_quantity_kg

    if request.method == "POST":
        product_form = ProductForm(request.POST, instance=product)
        spec_form = CutSpecForm(request.POST, instance=spec)

        if product_form.is_valid() and spec_form.is_valid():
            new_price_per_kg = product_form.cleaned_data["price_per_kg"]
            new_min_quantity_kg = product_form.cleaned_data["min_quantity_kg"]
            price_changed = new_price_per_kg != old_price_per_kg
            min_quantity_changed = new_min_quantity_kg != old_min_quantity_kg
            needs_confirmation = price_changed or min_quantity_changed

            if needs_confirmation and request.POST.get("confirm") != "1":
                hidden_fields = {
                    key: value
                    for key, value in request.POST.items()
                    if key not in ("csrfmiddlewaretoken", "confirm")
                }
                context = {
                    "product": product,
                    "price_changed": price_changed,
                    "min_quantity_changed": min_quantity_changed,
                    "old_price_per_kg": old_price_per_kg,
                    "new_price_per_kg": new_price_per_kg,
                    "old_min_quantity_kg": old_min_quantity_kg,
                    "new_min_quantity_kg": new_min_quantity_kg,
                    "hidden_fields": hidden_fields,
                }
                return render(request, "inventory/product_confirm_price_change.html", context)

            product = product_form.save()
            spec_instance = spec_form.save(commit=False)
            # Keep the table clean: only store a spec that already exists or
            # that the user actually filled in.
            spec_has_data = any(spec_form.cleaned_data.get(name) for name in spec_form.fields)
            if spec_instance.pk or spec_has_data:
                spec_instance.product = product
                spec_instance.save()
            messages.success(request, f'Producto "{product.name}" actualizado correctamente.')
            return redirect("inventory:detail", product_id=product.id)
    else:
        product_form = ProductForm(instance=product)
        spec_form = CutSpecForm(instance=spec)

    context = {
        "product_form": product_form,
        "spec_form": spec_form,
        "is_update": True,
        "product": product,
    }
    return render(request, "inventory/product_form.html", context)


@login_required
def product_delete(request, product_id):
    """Delete a product, unless it has order history — then deactivate it.

    `order_items` has no Django model (it belongs to Supabase), so the
    check is a parameterised raw query through `django.db.connection`.
    """
    product = get_object_or_404(Product, pk=product_id)
    order_count, favorite_count = _product_references(product.id)

    if request.method == "POST":
        if order_count:
            product.is_active = False
            product.save()
            messages.warning(
                request,
                f'"{product.name}" tiene pedidos registrados, así que se desactivó '
                "en lugar de eliminarse para conservar el historial.",
            )
        else:
            product.delete()
            success = f'"{product.name}" se eliminó correctamente.'
            if favorite_count:
                # favorites.product_id cascades in the database, so those rows
                # disappear with the product. Say it instead of hiding it.
                success += (
                    f" También se quitó de {favorite_count} "
                    f"lista{'s' if favorite_count != 1 else ''} de favoritos."
                )
            messages.success(request, success)

        return redirect("inventory:list")

    context = {
        "product": product,
        "order_count": order_count,
        "favorite_count": favorite_count,
    }
    return render(request, "inventory/product_confirm_delete.html", context)
