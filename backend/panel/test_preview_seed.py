"""Tests of the `preview_seed` command and of the pages it feeds in the preview."""

import io
import uuid
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
from unittest import mock
from urllib.parse import urlsplit

from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection, models
from django.test import SimpleTestCase, TestCase, override_settings
from django.utils import timezone

from config.urls_preview import PreviewGateway, install_preview_gateway
from inventory.models import Category, CutSpec, Product, Promotion
from panel.management.commands.preview_seed import PREVIEW_ADMIN_ID
from panel.models import Profile
from ventas import services
from ventas.models import DeliveryZone, PanelOrder, ProductSize

ORDER_STATUSES = {"pending", "confirmed", "preparing", "ready", "delivered", "cancelled"}

# Every page a person can open today with a GET, in the store and in the panel.
PAGES = [
    "/",
    "/productos/",
    "/acceso/",
    "/carrito/",
    "/panel/",
    "/panel/mas/",
    "/panel/clientes/",
    "/panel/compras/",
    "/panel/descuentos/",
    "/panel/ajustes/",
    "/panel/pedidos/",
    "/panel/productos/",
    "/panel/ventas/nueva/",
    "/panel/buildads/",
    "/panel/productads/",
]


def sign_in_preview_admin(client):
    """Enter as preview.sh says: an invite for the synthetic admin, then its POST."""
    out = io.StringIO()
    call_command(
        "issue_review_invite",
        "--supabase-user",
        str(PREVIEW_ADMIN_ID),
        "--label",
        "Local preview",
        "--days",
        "1",
        "--base-url",
        "http://127.0.0.1:8000",
        stdout=out,
    )
    link = next(line for line in out.getvalue().splitlines() if "/panel/invitado/" in line)
    response = client.post(urlsplit(link.strip()).path)
    if response.status_code != 302:
        raise AssertionError(f"The preview invite was refused ({response.status_code}).")


def seeded_counts():
    return {
        "categories": Category.objects.count(),
        "products": Product.objects.count(),
        "cut_specs": CutSpec.objects.count(),
        "promotions": Promotion.objects.count(),
        "sizes": ProductSize.objects.count(),
        "zones": DeliveryZone.objects.count(),
        "orders": PanelOrder.objects.count(),
        "profiles": Profile.objects.count(),
    }


class PreviewSeedGuardTests(TestCase):
    def test_command_refuses_to_run_without_the_preview_settings(self):
        with self.assertRaisesMessage(CommandError, "config.settings_preview"):
            call_command("preview_seed", verbosity=0)

        self.assertEqual(Product.objects.count(), 0)

    @override_settings(CARNI_PREVIEW=True)
    def test_command_refuses_a_database_that_is_not_sqlite(self):
        with (
            mock.patch.object(connection, "vendor", "postgresql"),
            self.assertRaisesMessage(CommandError, "SQLite"),
        ):
            call_command("preview_seed", verbosity=0)

        self.assertEqual(Product.objects.count(), 0)


class GatewaySwitchTests(SimpleTestCase):
    def setUp(self):
        saved = services._gateway  # noqa: SLF001
        self.addCleanup(setattr, services, "_gateway", saved)
        services._gateway = None  # noqa: SLF001

    def test_the_double_is_installed_with_the_preview_settings(self):
        with override_settings(SETTINGS_MODULE="config.settings_preview"):
            install_preview_gateway()

        self.assertIsInstance(services._gateway, PreviewGateway)  # noqa: SLF001

    def test_the_double_is_not_installed_with_other_settings(self):
        for module in ("config.settings", "config.settings_test"):
            with self.subTest(module=module), override_settings(SETTINGS_MODULE=module):
                install_preview_gateway()
                self.assertIsNone(services._gateway)  # noqa: SLF001


@override_settings(CARNI_PREVIEW=True)
class PreviewSeedDataTests(TestCase):
    def setUp(self):
        call_command("preview_seed", verbosity=0)

    def test_two_runs_leave_the_same_counts(self):
        first = seeded_counts()

        call_command("preview_seed", verbosity=0)

        self.assertEqual(seeded_counts(), first)

    def test_products_are_sold_by_kilo_by_piece_and_as_merchandise(self):
        units = set(Product.objects.values_list("price_unit", flat=True))

        self.assertEqual(units, {"kg", "piece", "package"})
        merchandise = Product.objects.filter(category__slug="merch")
        self.assertTrue(merchandise.exists())
        self.assertFalse(merchandise.filter(price_unit="kg").exists())

    def test_there_is_an_order_in_every_status(self):
        statuses = set(PanelOrder.objects.values_list("status", flat=True))

        self.assertEqual(statuses, ORDER_STATUSES)

    def test_customer_names_and_phones_are_synthetic(self):
        phones = set(PanelOrder.objects.values_list("customer_phone", flat=True))

        self.assertTrue(phones)
        for phone in phones:
            self.assertTrue(phone.startswith("+52 444 000"), phone)

    def test_discounts_sizes_and_zones_exist(self):
        self.assertTrue(Promotion.objects.filter(is_active=True).exists())
        self.assertEqual(
            sorted(set(ProductSize.objects.values_list("grams", flat=True))), [340, 500, 700]
        )
        self.assertEqual(
            sorted(DeliveryZone.objects.values_list("fee", flat=True)),
            [Decimal("50.00"), Decimal("90.00"), Decimal("160.00"), Decimal("210.00")],
        )

    def test_the_synthetic_admin_has_an_admin_profile(self):
        self.assertTrue(Profile.is_admin(PREVIEW_ADMIN_ID))


@override_settings(
    ROOT_URLCONF="config.urls_preview", CARNI_PREVIEW=True, REVIEW_INVITES_ENABLED=True
)
class PreviewPagesTests(TestCase):
    def setUp(self):
        call_command("preview_seed", verbosity=0)
        self.gateway = PreviewGateway()
        patcher = mock.patch("ventas.services.get_gateway", return_value=self.gateway)
        patcher.start()
        self.addCleanup(patcher.stop)
        sign_in_preview_admin(self.client)

    def test_each_page_answers_200_with_the_synthetic_admin(self):
        for page in PAGES:
            with self.subTest(page=page):
                self.assertEqual(self.client.get(page).status_code, 200)

    def test_panel_home_shows_the_pending_orders_of_the_seed(self):
        pending = PanelOrder.objects.filter(status="pending").count()

        response = self.client.get("/panel/")

        self.assertEqual(response.context["metrics"]["pendientes"], pending)

    def test_purchases_page_lists_the_synthetic_lots(self):
        response = self.client.get("/panel/compras/")

        self.assertTrue(response.context["lots"])


@override_settings(CARNI_PREVIEW=True)
class PreviewGatewayTests(TestCase):
    def setUp(self):
        call_command("preview_seed", verbosity=0)

    def test_quote_prices_a_seeded_kilo_product(self):
        product = Product.objects.filter(price_unit="kg").first()

        quote = PreviewGateway().quote_cart(
            [{"product_id": product.pk, "mode": "weight", "amount": "1", "unit": "kg"}]
        )

        self.assertEqual(quote.lines[0].unit_price, product.price_per_kg)
        self.assertEqual(quote.lines[0].line_total_mxn, product.price_per_kg)

    def test_the_30_day_metrics_leave_out_older_orders(self):
        before = PreviewGateway().panel_kpis()["ticket_promedio_30d"]
        old = PanelOrder(
            order_id=uuid.uuid4(),
            status="delivered",
            channel="web",
            delivery_type="pickup",
            currency="MXN",
            total_mxn=Decimal("10000.00"),
            created_at=timezone.now() - timedelta(days=31),
            lines=[],
        )
        models.Model.save(old, force_insert=True)

        self.assertEqual(PreviewGateway().panel_kpis()["ticket_promedio_30d"], before)

    def test_exchange_rate_is_available(self):
        self.assertEqual(PreviewGateway().current_fx()["status"], "ok")


class PreviewScriptTests(SimpleTestCase):
    def test_the_script_issues_the_invite_for_the_seeded_admin(self):
        script = (Path(__file__).resolve().parents[1] / "scripts" / "preview.sh").read_text()

        self.assertIn(f'admin_id="{PREVIEW_ADMIN_ID}"', script)
        self.assertIn("issue_review_invite", script)
        self.assertNotIn("/preview/enter/", script)
