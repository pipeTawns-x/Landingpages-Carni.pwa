"""What the sales pages know about a product before asking the store: how it can be sold.

The store decides the price and refuses a way of selling it does not allow (`quote_line`). This
module only decides which choices a form offers, so nobody is offered a choice the store would
refuse: a product priced per piece or package is sold by pieces; a product priced per kilo by
money and by weight, and also by pieces when the owner turned "Se vende por pieza" on in the
panel (`products.sale_modes` lists it) and its cut spec says what a piece weighs. The thickness
is only asked for when the spec has a default thickness to compare it with.
"""

from django.db.models import Q

from inventory.models import CutSpec, Product

MODES = ("money", "weight", "pieces")


def spec_of(product):
    """Return the cut spec of a product, or None."""
    try:
        return product.spec
    except CutSpec.DoesNotExist:
        return None


def sale_modes(product):
    """Return the ways the product can be sold, in the order the forms list them."""
    if product.unit_label != "kg":
        return ["pieces"]
    spec = spec_of(product)
    modes = ["money", "weight"]
    if "pieces" in (product.sale_modes or []) and spec is not None and spec.avg_piece_weight_kg:
        modes.append("pieces")
    return modes


def asks_thickness(product):
    spec = spec_of(product)
    return "pieces" in sale_modes(product) and spec is not None and bool(spec.thickness_default_in)


def active_products():
    """The products the store sells now: active, in an active category."""
    return (
        Product.objects.filter(is_active=True, category__is_active=True)
        .select_related("category", "spec")
        .order_by("name", "pk")
    )


def filtered(products, query, category_id):
    """Narrow `products` by free text (name or description) and by category.

    Return the queryset and the category id that was applied ("" when none or not a number).
    """
    if query:
        products = products.filter(Q(name__icontains=query) | Q(description__icontains=query))
    if category_id.isdecimal():
        return products.filter(category_id=int(category_id)), category_id
    return products, ""
