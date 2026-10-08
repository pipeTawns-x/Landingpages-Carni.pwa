"""Function-based views for the inventory app.

Implements the EBAC M13 "Django Views" practice: five FBVs (list, detail,
create, update, delete) backed by ModelForms, `get_object_or_404`,
`django.contrib.messages`, and POST-redirect-GET. The business rules (price
confirmation, delete or deactivate, when a cut spec is stored) live in
`inventory.services`; the views only translate them into pages and messages.

They are the products section of the panel, mounted at `/panel/productos/`, and
every one is wrapped in `panel_admin_required`: only an admin whose session a
Supabase handoff opened gets in, not just any Django user.
"""

from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render

from inventory import services
from inventory.forms import CutSpecForm, ProductForm
from inventory.models import Category, CutSpec, Product
from panel.access import panel_admin_required

PRODUCTS_PER_PAGE = 20


@panel_admin_required
def product_list(request):
    """List products, paginated, with optional free-text search and category filter."""
    query = request.GET.get("q", "").strip()
    category_id = request.GET.get("category", "").strip()

    # The pk breaks ties between products with the same name, so a product
    # cannot appear on two pages (or on none) when the list is paginated.
    products = Product.objects.select_related("category").order_by("name", "pk")

    if query:
        products = products.filter(Q(name__icontains=query) | Q(description__icontains=query))

    # A hand-edited or stale query string must not break the list: a category
    # that is not a number is ignored instead of raising ValueError. It has to
    # be isdecimal(), not isdigit(): "²" passes isdigit() but int("²") raises.
    if category_id.isdecimal():
        products = products.filter(category_id=int(category_id))
    else:
        category_id = ""

    # get_page() never raises: a non-numeric page falls back to the first one
    # and a page below 1 or past the end to the last, so a stale link still
    # shows a list.
    paginator = Paginator(products, PRODUCTS_PER_PAGE)
    page_obj = paginator.get_page(request.GET.get("page"))

    context = {
        "products": page_obj,
        "page_obj": page_obj,
        # The chips count every product of a category, whatever the search says.
        "categories": Category.objects.annotate(product_count=Count("products")),
        "total_products": Product.objects.count(),
        "query": query,
        "selected_category": category_id,
    }
    return render(request, "inventory/product_list.html", context)


@panel_admin_required
def product_detail(request, product_id):
    """Show a single product and its cut spec, if it has one."""
    product = get_object_or_404(Product.objects.select_related("category"), pk=product_id)
    spec = CutSpec.objects.filter(product=product).first()
    return render(request, "inventory/product_detail.html", {"product": product, "spec": spec})


@panel_admin_required
def product_create(request):
    """Create a product and, optionally, its cut spec."""
    if request.method == "POST":
        product_form = ProductForm(request.POST)
        spec_form = CutSpecForm(request.POST)

        if product_form.is_valid() and spec_form.is_valid():
            product = services.save_product(product_form, spec_form)
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


@panel_admin_required
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

    # Read the stored values before the forms are built: validating a
    # ModelForm overwrites the instance in place, so afterwards the "old"
    # values would already be the new ones.
    old_price_per_kg = product.price_per_kg
    old_min_quantity_kg = product.min_quantity_kg

    if request.method == "POST":
        product_form = ProductForm(request.POST, instance=product)
        spec_form = CutSpecForm(request.POST, instance=spec)

        if product_form.is_valid() and spec_form.is_valid():
            change = services.PriceChange(
                old_price_per_kg=old_price_per_kg,
                new_price_per_kg=product_form.cleaned_data["price_per_kg"],
                old_min_quantity_kg=old_min_quantity_kg,
                new_min_quantity_kg=product_form.cleaned_data["min_quantity_kg"],
            )

            if change.needs_confirmation and request.POST.get("confirm") != "1":
                hidden_fields = {
                    key: value
                    for key, value in request.POST.items()
                    if key not in ("csrfmiddlewaretoken", "confirm")
                }
                context = {
                    "product": product,
                    "price_changed": change.price_changed,
                    "min_quantity_changed": change.min_quantity_changed,
                    "old_price_per_kg": change.old_price_per_kg,
                    "new_price_per_kg": change.new_price_per_kg,
                    "old_min_quantity_kg": change.old_min_quantity_kg,
                    "new_min_quantity_kg": change.new_min_quantity_kg,
                    "hidden_fields": hidden_fields,
                }
                return render(request, "inventory/product_confirm_price_change.html", context)

            product = services.save_product(product_form, spec_form)
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


@panel_admin_required
def product_delete(request, product_id):
    """Delete a product, unless it has order history — then deactivate it.

    `services.delete_or_deactivate` decides which of the two happens; this
    view only words the result.
    """
    product = get_object_or_404(Product, pk=product_id)

    if request.method == "POST":
        outcome = services.delete_or_deactivate(product)

        if outcome.deactivated:
            messages.warning(
                request,
                f'"{product.name}" tiene pedidos registrados, así que se desactivó '
                "en lugar de eliminarse para conservar el historial.",
            )
        else:
            success = f'"{product.name}" se eliminó correctamente.'
            if outcome.favorites_removed:
                # favorites.product_id cascades in the database, so those rows
                # disappear with the product. Say it instead of hiding it.
                success += (
                    f" También se quitó de {outcome.favorites_removed} "
                    f"lista{'s' if outcome.favorites_removed != 1 else ''} de favoritos."
                )
            messages.success(request, success)

        return redirect("inventory:list")

    references = services.find_references(product)
    context = {
        "product": product,
        "order_count": references.orders,
        "favorite_count": references.favorites,
    }
    return render(request, "inventory/product_confirm_delete.html", context)
