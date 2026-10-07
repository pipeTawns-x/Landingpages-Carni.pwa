"""Tests for the inventory app: the price helper and the paginated product list.

They run on SQLite through config.settings_test. `Category` and `Product` are
unmanaged mirrors of Supabase tables, so config.test_runner builds their tables
for the test database.
"""

from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from inventory.models import Category, CutSpec, Product, price_per_lb_for


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
