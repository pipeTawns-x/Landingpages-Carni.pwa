"""Tests for the inventory app: the price helper and the paginated product list.

They run on SQLite through config.settings_test. `Category` and `Product` are
unmanaged mirrors of Supabase tables, so config.test_runner builds their tables
for the test database.
"""

from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from inventory.models import Category, Product, price_per_lb_for


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
