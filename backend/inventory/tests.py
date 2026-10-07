"""Tests for the inventory app: the price helper, the staff views, the services
that hold the catalogue rules and the read-only mirrors of Supabase tables.

They run on SQLite through config.settings_test. `Category`, `Product`,
`OrderItem` and `Favorite` are unmanaged mirrors of Supabase tables, so
config.test_runner builds their tables for the test database. The last two
refuse writes from Django, so the tests add their rows with raw SQL, the way
Supabase does in production.
"""

import uuid
from decimal import Decimal
from unittest import mock

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.messages import get_messages
from django.db import IntegrityError, connection
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from inventory import services
from inventory.forms import CutSpecForm, ProductForm
from inventory.models import (
    Category,
    CutSpec,
    Favorite,
    OrderItem,
    Product,
    ReadOnlyModelError,
    price_per_lb_for,
)


def make_product(name="Rib Eye", **fields):
    """Create a product in the first fixture category."""
    fields.setdefault("price_per_kg", Decimal("549.00"))
    return Product.objects.create(category=Category.objects.first(), name=name, **fields)


def levels_and_texts(response):
    """Return the (level, text) pairs of the messages the request queued."""
    return [(message.level_tag, str(message)) for message in get_messages(response.wsgi_request)]


def insert_order_item(product):
    """Add an order line the way Supabase does: the mirrors refuse writes from Django."""
    with connection.cursor() as cursor:
        cursor.execute("INSERT INTO order_items (product_id) VALUES (%s)", [product.pk])


def insert_favorite(product):
    """Add the product to a new customer's favorites, again with raw SQL."""
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO favorites (user_id, product_id) VALUES (%s, %s)",
            [uuid.uuid4().hex, product.pk],
        )


def refuse_delete_like_restrict():
    """Make `Product.delete()` fail the way `ON DELETE RESTRICT` does when an order shows up.

    The test database builds the mirrored tables without foreign keys, so the
    refusal Postgres gives a delete that races with a new order cannot happen
    for real here: it is raised by hand, which is what the service has to survive.
    """
    return mock.patch.object(
        Product, "delete", side_effect=IntegrityError("violates foreign key constraint")
    )


class PricePerLbForTests(SimpleTestCase):
    def test_converts_a_round_price(self):
        self.assertEqual(price_per_lb_for(Decimal("100.00")), Decimal("45.36"))

    def test_rounds_to_cents(self):
        # 549.00 * 0.4536 = 249.0264
        self.assertEqual(price_per_lb_for(Decimal("549.00")), Decimal("249.03"))

    def test_rounds_half_up_not_half_even(self):
        # 18.75 * 0.4536 is exactly 8.505: half up gives 8.51, half even 8.50.
        self.assertEqual(price_per_lb_for(Decimal("18.75")), Decimal("8.51"))

    def test_returns_a_decimal_with_two_places(self):
        result = price_per_lb_for(Decimal("100.00"))

        self.assertIsInstance(result, Decimal)
        self.assertEqual(result.as_tuple().exponent, -2)


class ProductSaveTests(TestCase):
    fixtures = ["categories.json"]

    def test_save_derives_price_per_lb_from_price_per_kg(self):
        product = Product.objects.create(
            category=Category.objects.first(),
            name="Rib Eye",
            price_per_kg=Decimal("549.00"),
        )

        product.refresh_from_db()
        self.assertEqual(product.price_per_lb, Decimal("249.03"))


class ProductUpdateSpecTests(TestCase):
    """The cut spec that the edit page creates, or deliberately leaves alone."""

    fixtures = ["categories.json"]

    @classmethod
    def setUpTestData(cls):
        cls.staff = get_user_model().objects.create_user("staff")
        cls.product = Product.objects.create(
            category=Category.objects.first(),
            name="Rib Eye",
            price_per_kg=Decimal("549.00"),
            stock=12,
        )

    def setUp(self):
        self.url = reverse("inventory:update", args=[self.product.pk])
        self.detail_url = reverse("inventory:detail", args=[self.product.pk])
        self.client.force_login(self.staff)

    def post_data(self, **spec_fields):
        """Return POST data that keeps the product as it is, plus the given spec fields.

        The price and the minimum quantity stay the same on purpose: a change
        in either one would stop at the confirmation page instead of saving.
        """
        return {
            "name": self.product.name,
            "category": self.product.category_id,
            "price_per_kg": str(self.product.price_per_kg),
            "min_quantity_kg": "0",
            "stock": str(self.product.stock),
            "is_active": "on",
            **spec_fields,
        }

    def test_a_spec_with_a_single_zero_value_is_saved(self):
        # Decimal("0") is falsy, so an any(values) check took a spec made of
        # zeros for an empty one and silently skipped it.
        response = self.client.post(self.url, self.post_data(avg_piece_weight_kg="0"))

        self.assertRedirects(response, self.detail_url)
        spec = CutSpec.objects.get(product=self.product)
        self.assertEqual(spec.avg_piece_weight_kg, Decimal("0"))

    def test_a_spec_where_every_number_is_zero_is_saved(self):
        spec_fields = {
            "avg_piece_weight_kg": "0",
            "thickness_min_in": "0",
            "thickness_max_in": "0",
            "thickness_default_in": "0",
        }

        response = self.client.post(self.url, self.post_data(**spec_fields))

        self.assertRedirects(response, self.detail_url)
        spec = CutSpec.objects.get(product=self.product)
        self.assertEqual(spec.thickness_max_in, Decimal("0"))

    def test_an_untouched_empty_spec_form_does_not_create_a_spec(self):
        response = self.client.post(self.url, self.post_data())

        self.assertRedirects(response, self.detail_url)
        self.assertFalse(CutSpec.objects.exists())

    def test_opening_the_edit_page_writes_nothing(self):
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(CutSpec.objects.exists())
        statements = [query["sql"].lstrip().upper() for query in queries.captured_queries]
        writes = [sql for sql in statements if sql.startswith(("INSERT", "UPDATE", "DELETE"))]
        self.assertEqual(writes, [])


class ProductCreateTests(TestCase):
    """The create page and the cut spec it stores only when staff filled one in."""

    fixtures = ["categories.json"]

    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.first()
        cls.staff = get_user_model().objects.create_user("staff")

    def setUp(self):
        self.url = reverse("inventory:create")
        self.client.force_login(self.staff)

    def post_data(self, **spec_fields):
        return {
            "name": "Arrachera",
            "category": self.category.pk,
            "price_per_kg": "320.00",
            "min_quantity_kg": "0",
            "stock": "5",
            "is_active": "on",
            **spec_fields,
        }

    def test_a_product_without_spec_data_is_created_without_a_spec(self):
        response = self.client.post(self.url, self.post_data())

        product = Product.objects.get(name="Arrachera")
        self.assertRedirects(response, reverse("inventory:detail", args=[product.pk]))
        self.assertEqual(product.price_per_lb, Decimal("145.15"))
        self.assertFalse(CutSpec.objects.exists())

    def test_a_product_with_a_spec_value_is_created_with_its_spec(self):
        self.client.post(self.url, self.post_data(supplier="Rancho Sur"))

        product = Product.objects.get(name="Arrachera")
        self.assertEqual(CutSpec.objects.get(product=product).supplier, "Rancho Sur")

    def test_a_spec_made_of_a_zero_is_created_too(self):
        self.client.post(self.url, self.post_data(avg_piece_weight_kg="0"))

        product = Product.objects.get(name="Arrachera")
        self.assertEqual(CutSpec.objects.get(product=product).avg_piece_weight_kg, Decimal("0"))

    def test_an_invalid_form_saves_nothing(self):
        response = self.client.post(self.url, self.post_data(price_per_kg="0"))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Product.objects.exists())


class ProductUpdateConfirmationTests(TestCase):
    """A new price or minimum quantity stops at a confirmation page before it is saved."""

    fixtures = ["categories.json"]

    @classmethod
    def setUpTestData(cls):
        cls.staff = get_user_model().objects.create_user("staff")
        cls.product = Product.objects.create(
            category=Category.objects.first(),
            name="Rib Eye",
            price_per_kg=Decimal("549.00"),
            stock=12,
        )

    def setUp(self):
        self.url = reverse("inventory:update", args=[self.product.pk])
        self.detail_url = reverse("inventory:detail", args=[self.product.pk])
        self.client.force_login(self.staff)

    def post_data(self, **overrides):
        """Return POST data that keeps the product as it is, except for the overrides."""
        return {
            "name": self.product.name,
            "category": self.product.category_id,
            "price_per_kg": "549.00",
            "min_quantity_kg": "0",
            "stock": str(self.product.stock),
            "is_active": "on",
            **overrides,
        }

    def stored_product(self):
        return Product.objects.get(pk=self.product.pk)

    def test_a_new_price_stops_at_the_confirmation_page(self):
        response = self.client.post(self.url, self.post_data(price_per_kg="600.00"))

        self.assertTemplateUsed(response, "inventory/product_confirm_price_change.html")
        self.assertTrue(response.context["price_changed"])
        self.assertFalse(response.context["min_quantity_changed"])
        self.assertEqual(response.context["old_price_per_kg"], Decimal("549.00"))
        self.assertEqual(response.context["new_price_per_kg"], Decimal("600.00"))
        self.assertEqual(self.stored_product().price_per_kg, Decimal("549.00"))

    def test_a_new_minimum_quantity_stops_at_the_confirmation_page(self):
        response = self.client.post(self.url, self.post_data(min_quantity_kg="0.250"))

        self.assertTemplateUsed(response, "inventory/product_confirm_price_change.html")
        self.assertFalse(response.context["price_changed"])
        self.assertTrue(response.context["min_quantity_changed"])
        self.assertEqual(response.context["old_min_quantity_kg"], Decimal("0"))
        self.assertEqual(response.context["new_min_quantity_kg"], Decimal("0.250"))
        self.assertEqual(self.stored_product().min_quantity_kg, Decimal("0"))

    def test_the_confirmation_page_carries_the_submitted_fields_forward(self):
        data = self.post_data(price_per_kg="600.00", csrfmiddlewaretoken="token", confirm="0")

        response = self.client.post(self.url, data)

        # The token and the confirm flag are rebuilt by the template, the rest
        # travels as hidden inputs so the second submit repeats the same edit.
        expected = {
            key: str(value)
            for key, value in data.items()
            if key not in ("csrfmiddlewaretoken", "confirm")
        }
        self.assertEqual(response.context["hidden_fields"], expected)

    def test_confirming_saves_the_change(self):
        response = self.client.post(self.url, self.post_data(price_per_kg="600.00", confirm="1"))

        self.assertRedirects(response, self.detail_url)
        stored = self.stored_product()
        self.assertEqual(stored.price_per_kg, Decimal("600.00"))
        self.assertEqual(stored.price_per_lb, Decimal("272.16"))
        messages = [str(message) for message in get_messages(response.wsgi_request)]
        self.assertEqual(messages, ['Producto "Rib Eye" actualizado correctamente.'])

    def test_changing_something_else_saves_without_confirmation(self):
        response = self.client.post(self.url, self.post_data(stock="20"))

        self.assertRedirects(response, self.detail_url)
        self.assertEqual(self.stored_product().stock, 20)

    def test_the_same_price_written_differently_is_not_a_change(self):
        # 549 and 549.00 are the same number, so nothing needs confirming.
        response = self.client.post(self.url, self.post_data(price_per_kg="549"))

        self.assertRedirects(response, self.detail_url)


class ProductDeleteViewTests(TestCase):
    """A product with orders is deactivated, any other one is deleted."""

    fixtures = ["categories.json"]

    @classmethod
    def setUpTestData(cls):
        cls.staff = get_user_model().objects.create_user("staff")

    def setUp(self):
        self.product = make_product()
        self.url = reverse("inventory:delete", args=[self.product.pk])
        self.list_url = reverse("inventory:list")
        self.client.force_login(self.staff)

    def test_the_confirmation_page_counts_the_orders_and_the_favorites(self):
        insert_order_item(self.product)
        insert_order_item(self.product)
        insert_favorite(self.product)

        response = self.client.get(self.url)

        self.assertEqual(response.context["order_count"], 2)
        self.assertEqual(response.context["favorite_count"], 1)
        self.assertContains(response, "no se va a eliminar")

    def test_the_confirmation_page_warns_about_the_favorites_that_will_go(self):
        insert_favorite(self.product)

        response = self.client.get(self.url)

        self.assertEqual(response.context["order_count"], 0)
        # The template wraps the line right after "lista", so match up to there.
        self.assertContains(response, "saldrá de 1 lista")
        self.assertNotContains(response, "listas")

    def test_a_product_without_orders_is_deleted(self):
        response = self.client.post(self.url)

        self.assertRedirects(response, self.list_url)
        self.assertFalse(Product.objects.filter(pk=self.product.pk).exists())
        self.assertEqual(
            levels_and_texts(response),
            [("success", '"Rib Eye" se eliminó correctamente.')],
        )

    def test_the_message_says_how_many_favorite_lists_lost_the_product(self):
        insert_favorite(self.product)
        insert_favorite(self.product)

        response = self.client.post(self.url)

        self.assertEqual(
            levels_and_texts(response),
            [
                (
                    "success",
                    '"Rib Eye" se eliminó correctamente. '
                    "También se quitó de 2 listas de favoritos.",
                )
            ],
        )

    def test_the_message_uses_the_singular_for_a_single_favorite_list(self):
        insert_favorite(self.product)

        response = self.client.post(self.url)

        self.assertEqual(
            levels_and_texts(response),
            [
                (
                    "success",
                    '"Rib Eye" se eliminó correctamente. También se quitó de 1 lista de favoritos.',
                )
            ],
        )

    def test_a_product_with_orders_is_deactivated_instead_of_deleted(self):
        insert_order_item(self.product)

        response = self.client.post(self.url)

        self.assertRedirects(response, self.list_url)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)
        self.assertEqual(
            levels_and_texts(response),
            [
                (
                    "warning",
                    '"Rib Eye" tiene pedidos registrados, así que se desactivó '
                    "en lugar de eliminarse para conservar el historial.",
                )
            ],
        )

    def test_an_order_that_arrives_during_the_delete_deactivates_the_product_without_a_500(self):
        with refuse_delete_like_restrict():
            response = self.client.post(self.url)

        self.assertRedirects(response, self.list_url)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)
        self.assertEqual(
            levels_and_texts(response),
            [
                (
                    "warning",
                    '"Rib Eye" tiene pedidos registrados, así que se desactivó '
                    "en lugar de eliminarse para conservar el historial.",
                )
            ],
        )

    def test_an_anonymous_user_cannot_delete_a_product(self):
        self.client.logout()

        response = self.client.post(self.url)

        self.assertRedirects(
            response,
            f"{settings.LOGIN_URL}?next={self.url}",
            fetch_redirect_response=False,
        )
        self.product.refresh_from_db()
        self.assertTrue(self.product.is_active)


class ProductListPaginationTests(TestCase):
    fixtures = ["categories.json"]

    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.first()
        products = []
        for i in range(1, 501):
            price_per_kg = Decimal("100.00") + i
            products.append(
                Product(
                    category=cls.category,
                    name=f"Producto {i:03d}",
                    price_per_kg=price_per_kg,
                    # bulk_create() skips save(), which is what normally
                    # derives price_per_lb, so it is computed here.
                    price_per_lb=price_per_lb_for(price_per_kg),
                    stock=i % 40,
                )
            )
        Product.objects.bulk_create(products)
        cls.staff = get_user_model().objects.create_user("staff")

    def setUp(self):
        self.url = reverse("inventory:list")
        self.client.force_login(self.staff)

    def test_anonymous_user_is_redirected_to_login(self):
        self.client.logout()

        response = self.client.get(self.url)

        self.assertRedirects(
            response,
            f"{settings.LOGIN_URL}?next={self.url}",
            fetch_redirect_response=False,
        )

    def test_first_page_has_25_of_500_products(self):
        response = self.client.get(self.url)

        page = response.context["page_obj"]
        self.assertEqual(len(response.context["products"]), 25)
        self.assertEqual(page.number, 1)
        self.assertEqual(page.paginator.count, 500)
        self.assertEqual(page.paginator.num_pages, 20)
        self.assertContains(response, "Producto 001")
        self.assertContains(response, "Producto 025")
        self.assertNotContains(response, "Producto 026")

    def test_shows_the_range_and_the_page_number(self):
        response = self.client.get(self.url, {"page": 2})

        self.assertContains(response, "Mostrando 26–50 de 500 productos")
        self.assertContains(response, "Página 2 de 20")

    def test_last_page_has_the_remaining_rows(self):
        response = self.client.get(self.url, {"page": 20})

        page = response.context["page_obj"]
        self.assertEqual(len(response.context["products"]), 25)
        self.assertEqual(page.number, 20)
        self.assertContains(response, "Producto 500")

    def test_a_page_out_of_range_falls_back_to_the_last_page(self):
        # Past the end, zero and negative all land on the last page.
        for page in ("999", "0", "-1"):
            with self.subTest(page=page):
                response = self.client.get(self.url, {"page": page})

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.context["page_obj"].number, 20)

    def test_a_non_numeric_page_falls_back_to_the_first_page(self):
        response = self.client.get(self.url, {"page": "abc"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["page_obj"].number, 1)

    def test_a_category_that_is_not_a_plain_number_is_ignored(self):
        # "²" passes str.isdigit() but int("²") raises ValueError, so the view
        # has to test with isdecimal(). Both values must show the whole list.
        for value in ("²", "abc"):
            with self.subTest(category=value):
                response = self.client.get(self.url, {"category": value})

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.context["selected_category"], "")
                self.assertEqual(response.context["page_obj"].paginator.count, 500)

    def test_navigation_links_only_appear_when_they_apply(self):
        first = self.client.get(self.url)
        self.assertNotContains(first, "Primera")
        self.assertNotContains(first, "Anterior")
        self.assertContains(first, "Siguiente")
        self.assertContains(first, "Última")

        middle = self.client.get(self.url, {"page": 2})
        for label in ("Primera", "Anterior", "Siguiente", "Última"):
            self.assertContains(middle, label)

        last = self.client.get(self.url, {"page": 20})
        self.assertContains(last, "Primera")
        self.assertContains(last, "Anterior")
        self.assertNotContains(last, "Siguiente")
        self.assertNotContains(last, "Última")

    def test_search_and_category_survive_a_page_change(self):
        params = {"q": "Producto", "category": self.category.pk, "page": 2}

        response = self.client.get(self.url, params)

        self.assertEqual(response.context["page_obj"].number, 2)
        # {% querystring %} keeps q and category and only swaps the page. The
        # ampersands are HTML-escaped by the template engine.
        base = f"?q=Producto&amp;category={self.category.pk}&amp;page="
        for target in (1, 3, 20):
            self.assertContains(response, f'href="{base}{target}"')

    def test_a_short_result_shows_the_summary_without_navigation_links(self):
        # "Producto 04" matches 040 to 049, so ten products fit on one page.
        response = self.client.get(self.url, {"q": "Producto 04"})

        self.assertContains(response, "Mostrando 1–10 de 10 productos")
        self.assertContains(response, "Página 1 de 1")
        for label in ("Primera", "Anterior", "Siguiente", "Última"):
            self.assertNotContains(response, label)

    def test_no_matches_shows_the_empty_state(self):
        response = self.client.get(self.url, {"q": "no existe"})

        self.assertContains(response, "No se encontraron productos")
        self.assertNotContains(response, "Mostrando")


class PriceChangeTests(SimpleTestCase):
    def change(self, **overrides):
        """Return a change that touches nothing, except for the overrides."""
        values = {
            "old_price_per_kg": Decimal("549.00"),
            "new_price_per_kg": Decimal("549.00"),
            "old_min_quantity_kg": Decimal("0.000"),
            "new_min_quantity_kg": Decimal("0.000"),
        }
        return services.PriceChange(**{**values, **overrides})

    def test_an_edit_that_changes_neither_field_needs_no_confirmation(self):
        change = self.change()

        self.assertFalse(change.price_changed)
        self.assertFalse(change.min_quantity_changed)
        self.assertFalse(change.needs_confirmation)

    def test_a_new_price_needs_confirmation(self):
        change = self.change(new_price_per_kg=Decimal("600.00"))

        self.assertTrue(change.price_changed)
        self.assertFalse(change.min_quantity_changed)
        self.assertTrue(change.needs_confirmation)

    def test_a_new_minimum_quantity_needs_confirmation(self):
        change = self.change(new_min_quantity_kg=Decimal("0.250"))

        self.assertFalse(change.price_changed)
        self.assertTrue(change.min_quantity_changed)
        self.assertTrue(change.needs_confirmation)

    def test_both_fields_can_change_at_once(self):
        change = self.change(
            new_price_per_kg=Decimal("600.00"), new_min_quantity_kg=Decimal("0.250")
        )

        self.assertTrue(change.price_changed)
        self.assertTrue(change.min_quantity_changed)
        self.assertTrue(change.needs_confirmation)

    def test_the_same_amount_with_other_trailing_zeros_is_not_a_change(self):
        change = self.change(new_price_per_kg=Decimal("549"), new_min_quantity_kg=Decimal("0"))

        self.assertFalse(change.needs_confirmation)


class FindReferencesTests(TestCase):
    fixtures = ["categories.json"]

    def test_a_product_nobody_points_at_has_no_references(self):
        references = services.find_references(make_product())

        self.assertEqual(references, services.ProductReferences(orders=0, favorites=0))

    def test_it_counts_the_order_items_and_the_favorites_of_the_product(self):
        product = make_product()
        insert_order_item(product)
        insert_order_item(product)
        insert_favorite(product)

        references = services.find_references(product)

        self.assertEqual(references.orders, 2)
        self.assertEqual(references.favorites, 1)

    def test_rows_that_point_at_another_product_are_not_counted(self):
        product = make_product()
        other = make_product("T-Bone")
        insert_order_item(other)
        insert_favorite(other)

        self.assertEqual(services.find_references(product), (0, 0))


class DeleteOrDeactivateTests(TestCase):
    fixtures = ["categories.json"]

    def test_a_product_without_references_is_deleted(self):
        product = make_product()
        product_id = product.pk

        outcome = services.delete_or_deactivate(product)

        self.assertFalse(outcome.deactivated)
        self.assertEqual(outcome.favorites_removed, 0)
        self.assertFalse(Product.objects.filter(pk=product_id).exists())

    def test_the_outcome_counts_the_favorites_that_went_with_a_deleted_product(self):
        product = make_product()
        insert_favorite(product)
        insert_favorite(product)
        product_id = product.pk

        outcome = services.delete_or_deactivate(product)

        self.assertFalse(outcome.deactivated)
        self.assertEqual(outcome.favorites_removed, 2)
        self.assertFalse(Product.objects.filter(pk=product_id).exists())

    def test_a_product_with_order_items_is_deactivated_instead_of_deleted(self):
        product = make_product()
        insert_order_item(product)

        outcome = services.delete_or_deactivate(product)

        self.assertTrue(outcome.deactivated)
        self.assertEqual(outcome.favorites_removed, 0)
        product.refresh_from_db()
        self.assertFalse(product.is_active)

    def test_orders_win_over_favorites(self):
        # The product is kept, so no favorite lost it and none is reported.
        product = make_product()
        insert_order_item(product)
        insert_favorite(product)

        outcome = services.delete_or_deactivate(product)

        self.assertEqual(outcome, services.DeleteOutcome(deactivated=True, favorites_removed=0))
        self.assertTrue(Product.objects.filter(pk=product.pk).exists())

    def test_deactivating_writes_only_the_is_active_column(self):
        product = make_product(stock=12)
        insert_order_item(product)
        # The stock changes after this copy of the product was read.
        Product.objects.filter(pk=product.pk).update(stock=99)

        services.delete_or_deactivate(product)

        stored = Product.objects.get(pk=product.pk)
        self.assertFalse(stored.is_active)
        self.assertEqual(stored.stock, 99)

    def test_an_order_that_appears_after_the_count_turns_the_delete_into_a_deactivation(self):
        # No order existed when the references were counted, so the delete is
        # attempted, and the database refuses it because one showed up meanwhile.
        product = make_product()

        with refuse_delete_like_restrict():
            outcome = services.delete_or_deactivate(product)

        self.assertEqual(outcome, services.DeleteOutcome(deactivated=True, favorites_removed=0))
        self.assertFalse(Product.objects.get(pk=product.pk).is_active)

    def test_the_deactivation_after_a_refused_delete_writes_only_the_is_active_column(self):
        product = make_product(stock=12)
        Product.objects.filter(pk=product.pk).update(stock=99)

        with refuse_delete_like_restrict():
            services.delete_or_deactivate(product)

        stored = Product.objects.get(pk=product.pk)
        self.assertFalse(stored.is_active)
        self.assertEqual(stored.stock, 99)

    def test_the_delete_runs_inside_a_savepoint_that_is_rolled_back_when_it_fails(self):
        # Without the savepoint, Postgres would refuse every later statement of
        # the surrounding transaction, including the deactivation itself.
        product = make_product()

        with CaptureQueriesContext(connection) as queries, refuse_delete_like_restrict():
            services.delete_or_deactivate(product)

        statements = [query["sql"] for query in queries.captured_queries]
        self.assertTrue(any(sql.startswith("SAVEPOINT") for sql in statements))
        self.assertTrue(any(sql.startswith("ROLLBACK TO SAVEPOINT") for sql in statements))


class SaveProductTests(TestCase):
    fixtures = ["categories.json"]

    def valid_forms(self, product=None, spec=None, **spec_fields):
        """Return validated product and spec forms for the same submitted data."""
        data = {
            "name": "Arrachera",
            "category": Category.objects.first().pk,
            "price_per_kg": "320.00",
            "min_quantity_kg": "0",
            "stock": "5",
            "is_active": "on",
            **spec_fields,
        }
        product_form = ProductForm(data, instance=product)
        spec_form = CutSpecForm(data, instance=spec)
        self.assertTrue(product_form.is_valid(), product_form.errors)
        self.assertTrue(spec_form.is_valid(), spec_form.errors)
        return product_form, spec_form

    def test_the_product_is_saved_with_its_price_per_lb_derived(self):
        product = services.save_product(*self.valid_forms())

        product.refresh_from_db()
        self.assertEqual(product.price_per_lb, Decimal("145.15"))

    def test_no_spec_is_stored_when_nothing_was_filled_in(self):
        services.save_product(*self.valid_forms())

        self.assertFalse(CutSpec.objects.exists())

    def test_a_spec_is_stored_when_a_field_was_filled_in(self):
        product = services.save_product(*self.valid_forms(supplier="Rancho Sur"))

        self.assertEqual(CutSpec.objects.get(product=product).supplier, "Rancho Sur")

    def test_a_zero_counts_as_filled_in(self):
        product = services.save_product(*self.valid_forms(avg_piece_weight_kg="0"))

        self.assertEqual(CutSpec.objects.get(product=product).avg_piece_weight_kg, Decimal("0"))

    def test_an_existing_spec_is_updated_even_when_every_field_is_cleared(self):
        product = make_product()
        spec = CutSpec.objects.create(product=product, supplier="Rancho Sur")

        services.save_product(*self.valid_forms(product=product, spec=spec))

        spec.refresh_from_db()
        self.assertEqual(spec.supplier, "")


class ReadOnlyMirrorTests(SimpleTestCase):
    """`OrderItem` and `Favorite` belong to Supabase, so Django must refuse to write to them.

    SimpleTestCase forbids database queries, which also proves that every
    refusal happens before anything is sent to the database.
    """

    mirrors = (OrderItem, Favorite)

    def test_an_instance_cannot_be_saved(self):
        for model in self.mirrors:
            with self.subTest(model=model.__name__), self.assertRaises(ReadOnlyModelError):
                model(product_id=1).save()

    def test_an_instance_cannot_be_deleted(self):
        for model in self.mirrors:
            with self.subTest(model=model.__name__), self.assertRaises(ReadOnlyModelError):
                model(product_id=1).delete()

    def test_a_queryset_refuses_every_kind_of_write(self):
        for model in self.mirrors:
            writes = {
                "create": lambda model=model: model.objects.create(product_id=1),
                "bulk_create": lambda model=model: model.objects.bulk_create([model(product_id=1)]),
                "bulk_update": lambda model=model: model.objects.bulk_update([], ["product_id"]),
                "get_or_create": lambda model=model: model.objects.get_or_create(product_id=1),
                "update_or_create": lambda model=model: model.objects.update_or_create(
                    product_id=1
                ),
                "update": lambda model=model: model.objects.filter(product_id=1).update(
                    product_id=2
                ),
                "delete": lambda model=model: model.objects.filter(product_id=1).delete(),
            }
            for name, write in writes.items():
                with (
                    self.subTest(model=model.__name__, write=name),
                    self.assertRaises(ReadOnlyModelError),
                ):
                    write()

    def test_the_error_names_the_model(self):
        with self.assertRaisesMessage(ReadOnlyModelError, "OrderItem is read-only"):
            OrderItem(product_id=1).save()


class ProductAdminTests(TestCase):
    """The admin applies the rules of the panel through the services."""

    fixtures = ["categories.json"]

    @classmethod
    def setUpTestData(cls):
        cls.superuser = get_user_model().objects.create_superuser("admin")

    def setUp(self):
        self.product = make_product(stock=12)
        self.change_url = reverse("admin:inventory_product_change", args=[self.product.pk])
        self.delete_url = reverse("admin:inventory_product_delete", args=[self.product.pk])
        self.add_url = reverse("admin:inventory_product_add")
        self.changelist_url = reverse("admin:inventory_product_changelist")
        self.client.force_login(self.superuser)

    def form_data(self, **overrides):
        """Return admin form data that keeps the product as it is, except for the overrides."""
        return {
            "name": self.product.name,
            "category": self.product.category_id,
            "description": "",
            "price_per_kg": "549.00",
            "min_quantity_kg": "0",
            "stock": "12",
            "is_active": "on",
            "image_url": "",
            "metadata": "{}",
            # Management form of the cut spec inline. No spec row is submitted.
            "spec-TOTAL_FORMS": "0",
            "spec-INITIAL_FORMS": "0",
            "spec-MIN_NUM_FORMS": "0",
            "spec-MAX_NUM_FORMS": "1",
            **overrides,
        }

    def stored_product(self):
        return Product.objects.get(pk=self.product.pk)

    def delete_selected(self, *products):
        """Run the admin's bulk "delete selected" action, already confirmed."""
        return self.client.post(
            self.changelist_url,
            {
                "action": "delete_selected",
                "_selected_action": [product.pk for product in products],
                "post": "yes",
            },
        )

    def warnings(self, response):
        return [text for level, text in levels_and_texts(response) if level == "warning"]

    # price_per_lb

    def test_price_per_lb_is_shown_but_cannot_be_edited(self):
        response = self.client.get(self.change_url)

        self.assertIn("price_per_lb", response.context["adminform"].readonly_fields)
        self.assertNotContains(response, 'name="price_per_lb"')
        self.assertContains(response, "249.03")

    def test_a_submitted_price_per_lb_is_ignored(self):
        response = self.client.post(self.change_url, self.form_data(price_per_lb="1.00"))

        self.assertRedirects(response, self.changelist_url)
        self.assertEqual(self.stored_product().price_per_lb, Decimal("249.03"))

    # confirmation of a price or minimum quantity change

    def test_a_new_price_needs_confirmation(self):
        response = self.client.post(self.change_url, self.form_data(price_per_kg="600.00"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.context["adminform"].form.errors["confirm_price_change"],
            [
                "Este cambio necesita confirmación: el precio por kg pasa de $549.00 a $600.00. "
                "Marca la casilla «Confirmar cambio de precio o cantidad mínima» para guardarlo."
            ],
        )
        self.assertEqual(self.stored_product().price_per_kg, Decimal("549.00"))

    def test_a_new_minimum_quantity_needs_confirmation(self):
        response = self.client.post(self.change_url, self.form_data(min_quantity_kg="0.250"))

        self.assertEqual(response.status_code, 200)
        errors = response.context["adminform"].form.errors["confirm_price_change"]
        self.assertIn("la cantidad mínima pasa de 0.000 kg a 0.250 kg", errors[0])
        self.assertEqual(self.stored_product().min_quantity_kg, Decimal("0"))

    def test_the_message_names_both_fields_when_both_change(self):
        data = self.form_data(price_per_kg="600.00", min_quantity_kg="0.250")

        response = self.client.post(self.change_url, data)

        message = response.context["adminform"].form.errors["confirm_price_change"][0]
        self.assertIn("el precio por kg pasa de $549.00 a $600.00 y la cantidad mínima", message)

    def test_confirming_saves_the_change_and_derives_price_per_lb(self):
        data = self.form_data(price_per_kg="600.00", confirm_price_change="on")

        response = self.client.post(self.change_url, data)

        self.assertRedirects(response, self.changelist_url)
        stored = self.stored_product()
        self.assertEqual(stored.price_per_kg, Decimal("600.00"))
        self.assertEqual(stored.price_per_lb, Decimal("272.16"))

    def test_confirming_saves_a_minimum_quantity_change(self):
        data = self.form_data(min_quantity_kg="0.250", confirm_price_change="on")

        response = self.client.post(self.change_url, data)

        self.assertRedirects(response, self.changelist_url)
        self.assertEqual(self.stored_product().min_quantity_kg, Decimal("0.250"))

    def test_a_change_to_another_field_needs_no_confirmation(self):
        response = self.client.post(self.change_url, self.form_data(stock="20"))

        self.assertRedirects(response, self.changelist_url)
        self.assertEqual(self.stored_product().stock, 20)

    def test_the_same_price_written_differently_needs_no_confirmation(self):
        response = self.client.post(self.change_url, self.form_data(price_per_kg="549"))

        self.assertRedirects(response, self.changelist_url)

    def test_an_invalid_price_shows_its_own_error_and_not_the_confirmation(self):
        response = self.client.post(self.change_url, self.form_data(price_per_kg="abc"))

        self.assertEqual(response.status_code, 200)
        errors = response.context["adminform"].form.errors
        self.assertIn("price_per_kg", errors)
        self.assertNotIn("confirm_price_change", errors)

    def test_the_change_page_has_the_confirmation_checkbox(self):
        response = self.client.get(self.change_url)

        self.assertContains(response, 'name="confirm_price_change"')

    def test_a_new_product_needs_no_confirmation_and_has_no_checkbox(self):
        self.assertNotContains(self.client.get(self.add_url), "confirm_price_change")

        data = self.form_data(name="Arrachera", price_per_kg="320.00")
        response = self.client.post(self.add_url, data)

        self.assertRedirects(response, self.changelist_url)
        self.assertEqual(Product.objects.get(name="Arrachera").price_per_lb, Decimal("145.15"))

    # delete or deactivate

    def test_deleting_a_product_without_orders_removes_it(self):
        response = self.client.post(self.delete_url, {"post": "yes"})

        self.assertRedirects(response, self.changelist_url)
        self.assertFalse(Product.objects.filter(pk=self.product.pk).exists())
        self.assertEqual(self.warnings(response), [])

    def test_deleting_a_product_with_orders_deactivates_it_and_says_so(self):
        insert_order_item(self.product)

        response = self.client.post(self.delete_url, {"post": "yes"})

        self.assertRedirects(response, self.changelist_url)
        self.assertFalse(self.stored_product().is_active)
        self.assertEqual(
            self.warnings(response),
            [
                '"Rib Eye" tiene pedidos registrados, así que se desactivó '
                "en lugar de eliminarse para conservar el historial."
            ],
        )

    def test_delete_selected_deactivates_only_the_products_with_orders(self):
        insert_order_item(self.product)
        without_orders = make_product("T-Bone")

        response = self.delete_selected(self.product, without_orders)

        self.assertRedirects(response, self.changelist_url)
        self.assertFalse(self.stored_product().is_active)
        self.assertFalse(Product.objects.filter(pk=without_orders.pk).exists())
        self.assertEqual(
            self.warnings(response),
            [
                '"Rib Eye" tiene pedidos registrados, así que se desactivó '
                "en lugar de eliminarse para conservar el historial."
            ],
        )

    def test_delete_selected_names_every_deactivated_product(self):
        other = make_product("T-Bone")
        insert_order_item(self.product)
        insert_order_item(other)

        response = self.delete_selected(self.product, other)

        self.assertEqual(
            self.warnings(response),
            [
                '"Rib Eye", "T-Bone" tienen pedidos registrados, así que se desactivaron '
                "en lugar de eliminarse para conservar el historial."
            ],
        )
        self.assertEqual(Product.objects.filter(is_active=False).count(), 2)

    def test_delete_selected_removes_products_without_orders_without_a_warning(self):
        other = make_product("T-Bone")

        response = self.delete_selected(self.product, other)

        self.assertRedirects(response, self.changelist_url)
        self.assertFalse(Product.objects.exists())
        self.assertEqual(self.warnings(response), [])
