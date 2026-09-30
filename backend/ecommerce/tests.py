"""Tests for the EBAC M14 practice: bulk_create, the slug signal and the fixture.

They run on SQLite through config.settings_test, not on the shared Postgres.
"""

import json
import tempfile
from decimal import Decimal
from io import StringIO
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone

from ecommerce.models import Product
from ecommerce.sample_data import build_sample_products

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "products" / "500Products.json"


def run_create_test_products(*args: str) -> str:
    """Run the management command and return what it printed."""
    out = StringIO()
    call_command("create_test_products", *args, stdout=out)
    return out.getvalue()


def count_inserts(queries: CaptureQueriesContext) -> int:
    """Count the INSERT statements a block of code sent to the database."""
    statements = [query["sql"] for query in queries.captured_queries]
    return sum(1 for sql in statements if sql.lstrip().upper().startswith("INSERT"))


class BuildSampleProductsTests(SimpleTestCase):
    def test_products_are_built_in_order_with_explicit_slugs(self):
        products = build_sample_products(12)

        first = products[0]
        self.assertEqual(first.name, "Arrachera de prueba 001")
        self.assertEqual(first.slug, "arrachera-de-prueba-001")
        self.assertEqual(first.price, Decimal("96.50"))
        self.assertEqual(first.stock, 1)
        # The accent is dropped from the slug, and the ten cuts repeat.
        self.assertEqual(products[4].slug, "picana-de-prueba-005")
        self.assertEqual(products[10].name, "Arrachera de prueba 011")

    def test_the_same_call_always_yields_the_same_data(self):
        def snapshot():
            return [(p.name, p.slug, p.price, p.stock) for p in build_sample_products(25)]

        self.assertEqual(snapshot(), snapshot())


class CreateTestProductsCommandTests(TestCase):
    def test_creates_500_products_with_unique_slugs_and_decimal_prices(self):
        run_create_test_products()

        products = list(Product.objects.all())
        self.assertEqual(len(products), 500)
        slugs = [product.slug for product in products]
        self.assertTrue(all(slugs))
        self.assertEqual(len(set(slugs)), 500)
        for product in products:
            self.assertIsInstance(product.price, Decimal)
            self.assertGreaterEqual(product.price, Decimal("0.01"))

    def test_inserts_in_batches_instead_of_one_query_per_product(self):
        with CaptureQueriesContext(connection) as queries:
            run_create_test_products()

        # 500 products in batches of 100 are 5 INSERTs. A loop of save() calls
        # would have sent 500.
        self.assertEqual(count_inserts(queries), 5)

    def test_reports_what_it_created(self):
        output = run_create_test_products("--count", "30", "--batch-size", "10")

        self.assertIn("Se crearon 30 productos de prueba (lotes de 10).", output)
        self.assertIn("Total de productos en la base de datos: 30", output)

    def test_count_and_batch_size_options_change_the_insert_plan(self):
        with CaptureQueriesContext(connection) as queries:
            run_create_test_products("--count", "30", "--batch-size", "10")

        self.assertEqual(Product.objects.count(), 30)
        self.assertEqual(count_inserts(queries), 3)

    def test_second_run_is_refused_and_inserts_nothing(self):
        run_create_test_products()

        with self.assertRaisesMessage(CommandError, "Ya existen 500 productos"):
            run_create_test_products()
        self.assertEqual(Product.objects.count(), 500)

    def test_a_partial_overlap_is_refused_before_inserting_anything(self):
        run_create_test_products("--count", "10")

        # Products 1-10 exist, so a run for 20 must not add 11-20 either.
        with self.assertRaisesMessage(CommandError, "Ya existen 10 productos"):
            run_create_test_products("--count", "20")
        self.assertEqual(Product.objects.count(), 10)

    def test_rejects_a_count_below_one(self):
        with self.assertRaisesMessage(CommandError, "--count"):
            run_create_test_products("--count", "0")
        self.assertEqual(Product.objects.count(), 0)

    def test_rejects_a_batch_size_below_one(self):
        with self.assertRaisesMessage(CommandError, "--batch-size"):
            run_create_test_products("--batch-size", "0")
        self.assertEqual(Product.objects.count(), 0)


class ProductSlugSignalTests(TestCase):
    def test_save_fills_an_empty_slug_from_the_name(self):
        product = Product.objects.create(name="Arrachera Marinada", price=Decimal("189.00"))

        self.assertEqual(product.slug, "arrachera-marinada")

    def test_duplicate_names_get_a_numeric_suffix(self):
        slugs = [
            Product.objects.create(name="Arrachera", price=Decimal("189.00")).slug for _ in range(3)
        ]

        self.assertEqual(slugs, ["arrachera", "arrachera-2", "arrachera-3"])

    def test_an_explicit_slug_is_kept(self):
        product = Product.objects.create(name="Arrachera", slug="mi-slug", price=Decimal("189.00"))

        self.assertEqual(product.slug, "mi-slug")

    def test_a_blank_slug_does_not_clash_with_its_own_row(self):
        product = Product.objects.create(name="Tocino", price=Decimal("120.00"))

        # The row already holds "tocino"; excluding it keeps the slug free.
        product.slug = ""
        product.save()

        self.assertEqual(product.slug, "tocino")

    def test_bulk_create_skips_the_signal(self):
        Product.objects.bulk_create([Product(name="Sin slug", price=Decimal("10.00"))])

        self.assertEqual(Product.objects.get().slug, "")

    def test_raw_saves_leave_the_slug_alone(self):
        # loaddata saves with raw=True. The receiver must return early there:
        # the fixture already carries the slug, and a raw save must not query.
        now = timezone.now()
        product = Product(name="Raw", price=Decimal("10.00"), created_at=now, updated_at=now)

        product.save_base(raw=True)

        self.assertEqual(Product.objects.get(name="Raw").slug, "")


class ProductAdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.superuser = get_user_model().objects.create_superuser("admin")

    def setUp(self):
        self.client.force_login(self.superuser)

    def test_changelist_shows_50_products_per_page(self):
        Product.objects.bulk_create(build_sample_products(60))

        response = self.client.get(reverse("admin:ecommerce_product_changelist"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context["cl"].result_list), 50)

    def test_search_finds_a_product_by_slug(self):
        Product.objects.bulk_create(build_sample_products(60))

        response = self.client.get(
            reverse("admin:ecommerce_product_changelist"), {"q": "arrachera-de-prueba-001"}
        )

        self.assertEqual(response.context["cl"].result_count, 1)

    def test_add_form_leaves_the_slug_to_the_signal(self):
        # The slug is read-only in the admin, so it is not in the form. Two
        # products with the same name only save because the signal fills it.
        url = reverse("admin:ecommerce_product_add")
        form = {"name": "Arrachera", "description": "", "price": "189.00", "stock": 5}

        self.client.post(url, form)
        self.client.post(url, form)

        slugs = Product.objects.order_by("pk").values_list("slug", flat=True)
        self.assertEqual(list(slugs), ["arrachera", "arrachera-2"])


class FixtureRoundTripTests(TestCase):
    def test_dump_delete_and_load_restores_the_same_products(self):
        run_create_test_products()
        before = list(Product.objects.order_by("pk").values_list("pk", "slug", "price"))

        with tempfile.TemporaryDirectory() as tmp:
            fixture = Path(tmp) / "500Products.json"
            call_command(
                "dumpdata",
                "ecommerce",
                indent=4,
                format="json",
                output=str(fixture),
                stdout=StringIO(),
            )

            Product.objects.all().delete()
            self.assertEqual(Product.objects.count(), 0)

            call_command("loaddata", str(fixture), verbosity=0)

        after = list(Product.objects.order_by("pk").values_list("pk", "slug", "price"))
        self.assertEqual(len(after), 500)
        self.assertEqual(after, before)


class CommittedFixtureTests(TestCase):
    """The 500Products.json file that ships with the practice."""

    @classmethod
    def setUpTestData(cls):
        cls.objects = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

    def test_holds_500_products_with_unique_pks_and_slugs(self):
        self.assertEqual(len(self.objects), 500)
        self.assertEqual({obj["model"] for obj in self.objects}, {"ecommerce.product"})
        self.assertEqual(len({obj["pk"] for obj in self.objects}), 500)
        self.assertEqual(len({obj["fields"]["slug"] for obj in self.objects}), 500)

    def test_loaddata_installs_the_500_products(self):
        self.assertEqual(Product.objects.count(), 0)

        call_command("loaddata", str(FIXTURE_PATH), verbosity=0)

        self.assertEqual(Product.objects.count(), 500)
