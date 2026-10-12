"""Tests for the EBAC M15 practice: ProtectedListView and the command that gives it data.

They run on SQLite through config.settings_test, like the rest of the suite.
"""

import re
import uuid
from datetime import timedelta
from decimal import Decimal
from io import StringIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.views.generic import ListView

from ecommerce.admin import ProductAdmin
from ecommerce.models import Product
from ecommerce.sample_data import build_sample_products
from ecommerce.views import ProtectedListView
from panel.access import get_or_create_panel_user
from panel.supabase_auth import VerifiedToken
from panel.test_stylesheet import undefined_classes
from panel.tests import sign_in_as_panel_admin


def make_products(owner, count, label):
    """Save `count` products of `owner` in one query: "<label> 001", "<label> 002"..."""
    return Product.objects.bulk_create(
        Product(
            name=f"{label} {number:03d}",
            slug=f"{label.lower()}-{number:03d}",
            price=Decimal("10.00"),
            owner=owner,
        )
        for number in range(1, count + 1)
    )


def run_assign(*args):
    """Run assign_sample_products and return what it printed."""
    out = StringIO()
    call_command("assign_sample_products", *args, stdout=out)
    return out.getvalue()


class ProductOwnerTests(TestCase):
    def test_a_product_may_have_no_owner(self):
        product = Product.objects.create(name="Arrachera", price=Decimal("10.00"))

        self.assertIsNone(product.owner)

    def test_the_products_of_a_user_are_reached_through_sample_products(self):
        alice = get_user_model().objects.create_user("alice")
        make_products(alice, 3, "Alice")
        make_products(None, 2, "Nadie")

        self.assertEqual(alice.sample_products.count(), 3)

    def test_deleting_the_user_keeps_the_product_and_clears_the_owner(self):
        alice = get_user_model().objects.create_user("alice")
        (product,) = make_products(alice, 1, "Alice")

        alice.delete()

        product.refresh_from_db()
        self.assertIsNone(product.owner)


class ProtectedListViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.alice = user_model.objects.create_user("alice")
        cls.bob = user_model.objects.create_user("bob")
        make_products(cls.alice, 3, "Alice")
        make_products(cls.bob, 2, "Bob")
        make_products(None, 4, "Nadie")

    def setUp(self):
        self.url = reverse("ecommerce:my-products")

    def names_seen_by(self, user):
        self.client.force_login(user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        return [product.name for product in response.context["products"]]

    def test_it_is_served_at_my_products(self):
        self.assertEqual(self.url, "/my-products/")

    def test_the_login_mixin_comes_first_so_its_check_runs_before_the_list(self):
        # The order of the bases is the order of dispatch(): with ListView first, the mixin's
        # check would never run and an anonymous visitor would get the list.
        self.assertIs(ProtectedListView.__bases__[0], LoginRequiredMixin)
        self.assertTrue(issubclass(ProtectedListView, ListView))

    def test_an_anonymous_visitor_is_sent_to_the_access_bridge(self):
        response = self.client.get(self.url)

        self.assertEqual(settings.LOGIN_URL, "panel:acceso")
        self.assertRedirects(
            response, f"{reverse('panel:acceso')}?next=/my-products/", fetch_redirect_response=False
        )

    def test_each_user_sees_only_their_own_products(self):
        self.assertEqual(self.names_seen_by(self.alice), ["Alice 001", "Alice 002", "Alice 003"])
        self.assertEqual(self.names_seen_by(self.bob), ["Bob 001", "Bob 002"])

    def test_the_page_of_one_user_does_not_mention_the_products_of_another(self):
        self.client.force_login(self.bob)

        response = self.client.get(self.url)

        self.assertContains(response, "Bob 001")
        self.assertNotContains(response, "Alice 00")

    def test_products_without_an_owner_appear_for_nobody(self):
        for user in (self.alice, self.bob):
            with self.subTest(user=user.username):
                names = self.names_seen_by(user)
                self.assertFalse([name for name in names if name.startswith("Nadie")])

    def test_a_user_without_products_sees_the_empty_state(self):
        carol = get_user_model().objects.create_user("carol")
        self.client.force_login(carol)

        response = self.client.get(self.url)

        self.assertEqual(list(response.context["products"]), [])
        self.assertContains(response, "Aún no tienes productos asignados")
        self.assertNotContains(response, "<table")

    def test_page_one_holds_50_of_60_and_page_two_the_other_10(self):
        carol = get_user_model().objects.create_user("carol")
        make_products(carol, 60, "Carol")
        self.client.force_login(carol)

        first = self.client.get(self.url)
        second = self.client.get(self.url, {"page": 2})

        self.assertEqual(len(first.context["products"]), 50)
        self.assertEqual(len(second.context["products"]), 10)
        self.assertTrue(first.context["is_paginated"])
        self.assertEqual(first.context["paginator"].num_pages, 2)
        # Nothing repeats and nothing is lost between the two pages.
        names = [p.name for p in first.context["products"]]
        names += [p.name for p in second.context["products"]]
        self.assertEqual(names, [f"Carol {number:03d}" for number in range(1, 61)])

    def test_a_page_that_does_not_exist_is_a_404_unlike_the_product_list_of_the_panel(self):
        # ListView asks the paginator for the page with page(), which raises. The panel's
        # function view uses get_page(), which falls back to the last page instead.
        self.client.force_login(self.alice)

        for page in ("2", "0", "many"):
            with self.subTest(page=page):
                self.assertEqual(self.client.get(self.url, {"page": page}).status_code, 404)
        self.assertEqual(self.client.get(self.url, {"page": "last"}).status_code, 200)

    def test_the_pages_link_to_each_other_and_say_which_products_they_show(self):
        carol = get_user_model().objects.create_user("carol")
        make_products(carol, 60, "Carol")
        self.client.force_login(carol)

        first = self.client.get(self.url)
        second = self.client.get(self.url, {"page": 2})

        self.assertContains(first, 'href="?page=2"')
        self.assertContains(second, 'href="?page=1"')
        self.assertContains(first, "Mostrando 1–50 de 60 productos")
        self.assertContains(second, "Mostrando 51–60 de 60 productos")


class MyProductsPageTests(TestCase):
    """What the page shows: the frame, each product's data and the way back to the catalog."""

    @classmethod
    def setUpTestData(cls):
        cls.alice = get_user_model().objects.create_user("alice")
        Product.objects.create(
            name="Arrachera marinada",
            price=Decimal("1599.00"),
            stock=7,
            is_active=False,
            owner=cls.alice,
        )
        Product.objects.create(name="Chorizo", price=Decimal("89.50"), stock=0, owner=cls.alice)

    def setUp(self):
        self.client.force_login(self.alice)
        self.response = self.client.get(reverse("ecommerce:my-products"))

    def test_it_is_a_page_of_the_panel_frame(self):
        self.assertTemplateUsed(self.response, "ecommerce/my_products.html")
        self.assertTemplateUsed(self.response, "panel/base.html")
        self.assertContains(
            self.response, "<title>Mis productos · Panel · Carnicería El Señor de La Misericordia"
        )
        html = self.response.content.decode()
        headings = re.findall(r"<h1[^>]*>(.*?)</h1>", html, flags=re.DOTALL)
        self.assertEqual([heading.strip() for heading in headings], ["Mis productos"])

    def test_each_product_shows_its_name_price_stock_and_whether_it_is_active(self):
        self.assertContains(self.response, "Arrachera marinada")
        self.assertContains(self.response, "$1,599.00")
        self.assertContains(self.response, "Inactivo")
        self.assertContains(self.response, "Chorizo")
        self.assertContains(self.response, "$89.50")
        self.assertContains(self.response, "Activo")

    def test_it_links_back_to_the_catalog_of_the_panel(self):
        self.assertContains(self.response, 'href="/panel/productos/"')

    def test_the_page_has_no_script_no_inline_style_and_no_inline_handler(self):
        html = self.response.content.decode()

        for forbidden in ("<script", "<style", " style=", " onclick=", " onchange=", "javascript:"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, html)

    def test_it_uses_only_classes_the_committed_stylesheet_defines(self):
        self.assertEqual(undefined_classes("ecommerce/my_products.html"), [])

    def test_a_post_is_refused(self):
        self.assertEqual(self.client.post(reverse("ecommerce:my-products")).status_code, 405)


class ProductAdminOwnerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.superuser = user_model.objects.create_superuser("admin")
        cls.alice = user_model.objects.create_user("alice")
        make_products(cls.alice, 3, "Alice")
        make_products(None, 2, "Nadie")

    def setUp(self):
        self.client.force_login(self.superuser)

    def test_the_owner_is_a_column_and_a_filter(self):
        self.assertIn("owner", ProductAdmin.list_display)
        self.assertIn("owner", ProductAdmin.list_filter)

    def test_the_changelist_can_be_filtered_by_owner(self):
        url = reverse("admin:ecommerce_product_changelist")

        response = self.client.get(url, {"owner__id__exact": self.alice.pk})

        self.assertEqual(response.context["cl"].result_count, 3)
        owners = {product.owner for product in response.context["cl"].result_list}
        self.assertEqual(owners, {self.alice})

    def test_the_add_form_offers_the_owner_and_does_not_require_it(self):
        url = reverse("admin:ecommerce_product_add")
        form = {"name": "Tocino", "description": "", "price": "120.00", "stock": 5}

        self.assertContains(self.client.get(url), 'name="owner"')
        self.client.post(url, form)

        self.assertIsNone(Product.objects.get(name="Tocino").owner)


class AssignSampleProductsCommandTests(TestCase):
    def setUp(self):
        self.supabase_id = uuid.uuid4()
        Product.objects.bulk_create(build_sample_products(10))

    def owned_pks(self):
        owned = Product.objects.filter(owner__username=str(self.supabase_id))
        return list(owned.order_by("pk").values_list("pk", flat=True))

    def all_pks(self):
        return list(Product.objects.order_by("pk").values_list("pk", flat=True))

    def test_it_assigns_the_requested_number_of_unowned_products(self):
        run_assign("--supabase-user", str(self.supabase_id), "--count", "4")

        self.assertEqual(len(self.owned_pks()), 4)
        self.assertEqual(Product.objects.filter(owner__isnull=True).count(), 6)

    def test_it_takes_the_products_in_primary_key_order(self):
        run_assign("--supabase-user", str(self.supabase_id), "--count", "4")

        self.assertEqual(self.owned_pks(), self.all_pks()[:4])

    def test_it_prints_how_many_it_assigned(self):
        output = run_assign("--supabase-user", str(self.supabase_id), "--count", "4")

        self.assertIn(f"Productos asignados a {self.supabase_id}: 4", output)

    def test_it_never_takes_a_product_somebody_else_already_owns(self):
        other = get_user_model().objects.create_user("other")
        everything = self.all_pks()
        Product.objects.filter(pk__in=everything[:3]).update(owner=other)

        run_assign("--supabase-user", str(self.supabase_id), "--count", "2")

        self.assertEqual(self.owned_pks(), everything[3:5])
        self.assertEqual(Product.objects.filter(owner=other).count(), 3)

    def test_a_second_run_continues_with_the_next_unowned_products(self):
        run_assign("--supabase-user", str(self.supabase_id), "--count", "3")
        run_assign("--supabase-user", str(self.supabase_id), "--count", "3")

        self.assertEqual(self.owned_pks(), self.all_pks()[:6])

    def test_it_assigns_what_there_is_and_says_so_when_there_are_fewer(self):
        output = run_assign("--supabase-user", str(self.supabase_id), "--count", "25")

        self.assertEqual(len(self.owned_pks()), 10)
        self.assertIn(f"Productos asignados a {self.supabase_id}: 10", output)
        self.assertIn("Pediste 25, pero solo había 10 productos sin dueño", output)

    def test_with_nothing_left_it_assigns_zero_and_still_succeeds(self):
        run_assign("--supabase-user", str(self.supabase_id), "--count", "10")

        output = run_assign("--supabase-user", str(uuid.uuid4()), "--count", "3")

        self.assertIn(": 0", output)
        self.assertIn("Pediste 3, pero solo había 0 productos sin dueño", output)

    def test_the_assignment_counts_as_a_change_of_the_product(self):
        long_ago = timezone.now() - timedelta(days=30)
        Product.objects.update(updated_at=long_ago)

        run_assign("--supabase-user", str(self.supabase_id), "--count", "2")

        assigned = Product.objects.filter(owner__isnull=False)
        self.assertEqual(assigned.count(), 2)
        self.assertTrue(all(product.updated_at > long_ago for product in assigned))
        untouched = Product.objects.filter(owner__isnull=True)
        self.assertTrue(all(product.updated_at == long_ago for product in untouched))

    def test_the_user_is_made_the_way_the_panel_makes_it(self):
        run_assign("--supabase-user", str(self.supabase_id), "--count", "1")

        user = get_user_model().objects.get(username=str(self.supabase_id))
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_a_user_that_a_handoff_already_made_is_reused_and_keeps_its_email(self):
        existing = get_or_create_panel_user(
            VerifiedToken(user_id=self.supabase_id, email="admin@example.test")
        )

        run_assign("--supabase-user", str(self.supabase_id), "--count", "2")

        self.assertEqual(get_user_model().objects.count(), 1)
        existing.refresh_from_db()
        self.assertEqual(existing.email, "admin@example.test")
        self.assertEqual(Product.objects.filter(owner=existing).count(), 2)

    def test_the_uuid_may_be_written_in_any_of_its_usual_forms(self):
        run_assign("--supabase-user", self.supabase_id.hex.upper(), "--count", "2")

        self.assertEqual(len(self.owned_pks()), 2)
        self.assertEqual(get_user_model().objects.get().username, str(self.supabase_id))

    def test_a_value_that_is_not_a_uuid_is_refused_without_changing_anything(self):
        with self.assertRaisesMessage(CommandError, "no es un UUID válido"):
            run_assign("--supabase-user", "not-a-uuid", "--count", "2")

        self.assertEqual(get_user_model().objects.count(), 0)
        self.assertEqual(Product.objects.filter(owner__isnull=True).count(), 10)

    def test_a_count_below_one_is_refused_without_creating_the_user(self):
        for count in ("0", "-3"):
            with self.subTest(count=count), self.assertRaisesMessage(CommandError, "--count"):
                run_assign("--supabase-user", str(self.supabase_id), "--count", count)

        self.assertEqual(get_user_model().objects.count(), 0)
        self.assertEqual(Product.objects.filter(owner__isnull=True).count(), 10)

    def test_a_count_that_is_not_a_number_is_refused(self):
        with self.assertRaisesMessage(CommandError, "--count"):
            run_assign("--supabase-user", str(self.supabase_id), "--count", "many")

    def test_both_options_are_required(self):
        for args in ((), ("--count", "3"), ("--supabase-user", str(self.supabase_id))):
            with self.subTest(args=args), self.assertRaisesMessage(CommandError, "required"):
                run_assign(*args)


class MyProductsEndToEndTests(TestCase):
    """An admin who came in through the handoff gets the products the command assigned."""

    def test_the_handed_off_admin_sees_exactly_the_assigned_products(self):
        Product.objects.bulk_create(build_sample_products(8))
        admin_id = sign_in_as_panel_admin(self.client)

        run_assign("--supabase-user", str(admin_id), "--count", "3")
        response = self.client.get(reverse("ecommerce:my-products"))

        self.assertEqual(response.status_code, 200)
        assigned = Product.objects.filter(owner__username=str(admin_id))
        self.assertEqual(assigned.count(), 3)
        shown = {product.name for product in response.context["products"]}
        self.assertEqual(shown, {product.name for product in assigned})

    def test_after_signing_out_the_page_asks_for_the_login_again(self):
        sign_in_as_panel_admin(self.client)
        self.client.post(reverse("panel:salir"))

        response = self.client.get(reverse("ecommerce:my-products"))

        self.assertRedirects(
            response,
            f"{reverse('panel:acceso')}?next=/my-products/",
            fetch_redirect_response=False,
        )


class AccessBridgeIgnoresNextTests(TestCase):
    """The bridge is the LOGIN_URL, and it does not read `?next=`: the README says so."""

    def test_the_bridge_sends_an_anonymous_visitor_to_the_store_login_whatever_next_says(self):
        response = self.client.get(reverse("panel:acceso"), {"next": "/my-products/"})

        self.assertRedirects(response, settings.STORE_LOGIN_URL, fetch_redirect_response=False)
