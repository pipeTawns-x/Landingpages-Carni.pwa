"""Signals for the ecommerce practice app."""

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify

from ecommerce.models import Product


def _unique_slug(name: str, exclude_pk: int | None) -> str:
    """Return a slug for `name` that no other product uses yet.

    The first free candidate wins: `name`, then `name-2`, `name-3`, and so on.
    The base is trimmed so the suffix never pushes the slug past the column
    length.
    """
    max_length = Product._meta.get_field("slug").max_length
    base = slugify(name) or "producto"
    others = Product.objects.all()
    if exclude_pk is not None:
        others = others.exclude(pk=exclude_pk)

    candidate = base[:max_length]
    suffix = 2
    while others.filter(slug=candidate).exists():
        tail = f"-{suffix}"
        candidate = f"{base[: max_length - len(tail)]}{tail}"
        suffix += 1
    return candidate


@receiver(pre_save, sender=Product)
def fill_product_slug(sender, instance, **kwargs):
    """Fill an empty slug from the name before the product is saved.

    Raw saves (fixture loading) are skipped: the fixture already carries its
    slugs, and Django's docs say a raw save must not query the database.
    """
    if kwargs.get("raw"):
        return
    if not instance.slug:
        instance.slug = _unique_slug(instance.name, instance.pk)
