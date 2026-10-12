"""Views for the EBAC M15 "Django Class-based Views" practice.

A class-based view is a class instead of a function. Django turns it into a view
with `as_view()`, and the request goes through `dispatch()`, which picks the
method that answers it (`get()` for a GET). Behaviour is added by inheriting:
`ListView` brings the list and the pagination, `LoginRequiredMixin` brings the
login check.
"""

from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView

from ecommerce.models import Product


class ProtectedListView(LoginRequiredMixin, ListView):
    """The sample products that belong to the user making the request, and nobody else's.

    `LoginRequiredMixin` goes first on purpose. Python looks methods up from left
    to right along the bases (the MRO), so its `dispatch()` runs before the one
    of `ListView`: an anonymous visitor is redirected to `settings.LOGIN_URL`
    before any product is read. With the bases the other way round, `ListView`
    would answer and the check would never run.
    """

    model = Product
    template_name = "ecommerce/my_products.html"
    context_object_name = "products"
    paginate_by = 50
    # The name alone does not break ties between products that share it, and a
    # list that is split into pages must not repeat or skip any: the pk settles it.
    ordering = ("name", "pk")

    def get_queryset(self):
        """Narrow the products to the ones the signed-in user owns.

        `self.request.user` is never anonymous here: the mixin has already sent
        those away. A product with no owner matches no user, so it appears for
        nobody.
        """
        return super().get_queryset().filter(owner=self.request.user)
