"""Routes of the local preview: the real ones, served on this machine only.

Only config.settings_preview points at this module. There is no entry of its own: the preview is
opened with a review invite (`issue_review_invite`, printed by scripts/preview.sh), whose GET only
shows a button and whose POST, with CSRF, opens the panel session. `LoopbackOnlyMiddleware` answers
404 to any request that does not come from this machine.

The Postgres functions of the store (quotes, metrics, lots, exchange rate) do not exist in SQLite.
With the preview settings `install_preview_gateway` puts `PreviewGateway` in their place: the double
the tests of `ventas` already use, fed from the preview database.
"""

from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.http import Http404
from django.utils import timezone

from config.urls import urlpatterns as real_urlpatterns
from inventory.models import Product, StoreCutSpec
from ventas import services
from ventas.models import PanelOrder
from ventas.tests.support import FakeGateway

EXCHANGE_RATE = {"rate": Decimal("18.50"), "buffer_pct": Decimal("2"), "age_days": 0}


class PreviewGateway(FakeGateway):
    """`FakeGateway` with the products, orders and lots of the preview database."""

    def __init__(self):
        super().__init__(products={}, fx=dict(EXCHANGE_RATE))

    def open_lots(self):
        return self._synthetic_open_lots()

    def recent_purchases(self, limit=20):
        return self._synthetic_purchases()[:limit]

    def quote_cart(self, items, currency="MXN"):
        self.products = self._catalog()
        return super().quote_cart(items, currency)

    @staticmethod
    def _catalog():
        weights = dict(StoreCutSpec.objects.values_list("product_id", "avg_piece_weight_kg"))
        return {
            product.pk: {
                "price_per_kg": product.price_per_kg,
                "price_unit": product.price_unit,
                "sale_modes": list(product.sale_modes),
                "avg_piece_weight_kg": weights.get(product.pk),
                "thickness_default_in": None,
            }
            for product in Product.objects.filter(is_active=True)
        }

    @staticmethod
    def _synthetic_open_lots():
        rows = []
        for lot_id, product in enumerate(Product.objects.exclude(price_unit="kg"), start=1):
            rows.append({
                "lot_id": lot_id,
                "product_id": product.pk,
                "product_name": product.name,
                "piece_weight_kg": Decimal("1.800"),
                "pieces_left": 8,
                "price_per_piece": product.price_per_kg,
                "source_lot_id": None,
                "created_at": timezone.now().isoformat(),
            })  # fmt: skip
        return rows

    @staticmethod
    def _synthetic_purchases():
        rows = []
        for lot_id, product in enumerate(Product.objects.filter(price_unit="kg"), start=1):
            qty = Decimal("10.000")
            cost = (product.price_per_kg * Decimal("0.6") * qty).quantize(Decimal("0.01"))
            revenue = (product.price_per_kg * qty).quantize(Decimal("0.01"))
            rows.append({
                "lot_id": lot_id,
                "product_name": product.name,
                "created_at": timezone.now() - timedelta(days=lot_id),
                "qty": qty,
                "total_cost": cost,
                "unit_cost": (cost / qty).quantize(Decimal("0.0001")),
                "expected_revenue": revenue,
                "expected_margin": revenue - cost,
                "expected_margin_pct": Decimal("40.00"),
                "sold_qty": Decimal("4.000"),
                "sold_revenue": (product.price_per_kg * 4).quantize(Decimal("0.01")),
            })  # fmt: skip
        return rows

    def panel_kpis(self):
        """The metrics of the panel home from the preview orders of the last 30 days (shape D4)."""
        today = timezone.localdate()
        since = timezone.now() - timedelta(days=30)
        orders = [
            order
            for order in PanelOrder.objects.filter(created_at__gte=since)
            if order.status != "cancelled"
        ]
        today_orders = [o for o in orders if timezone.localtime(o.created_at).date() == today]
        by_day = {today - timedelta(days=n): Decimal("0") for n in range(6, -1, -1)}
        by_product = {}
        for order in orders:
            day = timezone.localtime(order.created_at).date()
            if day in by_day:
                by_day[day] += order.total_mxn
            for line in order.lines:
                entry = by_product.setdefault(line["product_name"], [Decimal("0"), Decimal("0")])
                entry[0] += Decimal(line["subtotal"])
                entry[1] += Decimal(line["quantity_kg"])
        total = sum((order.total_mxn for order in orders), Decimal("0"))
        top = sorted(by_product.items(), key=lambda item: item[1][0], reverse=True)[:5]
        return {
            "ventas_hoy": {
                "total": str(sum((o.total_mxn for o in today_orders), Decimal("0"))),
                "pedidos": len(today_orders),
            },
            "pendientes": sum(1 for order in orders if order.status == "pending"),
            "ticket_promedio_30d": str((total / len(orders)).quantize(Decimal("0.01")))
            if orders
            else "0.00",
            "margen_30d": None,
            "top5": [
                {"producto": name, "ingreso": str(income), "kg": str(kilos)}
                for name, (income, kilos) in top
            ],
            "serie_7d": [{"dia": day.isoformat(), "total": str(t)} for day, t in by_day.items()],
        }


LOOPBACK = {"127.0.0.1", "::1"}


class LoopbackOnlyMiddleware:
    """Answer 404 to every request that does not come from this machine.

    The real barrier of the preview, with runserver bound to 127.0.0.1: ALLOWED_HOSTS only checks
    the Host header, which the client chooses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.META.get("REMOTE_ADDR") not in LOOPBACK:
            raise Http404
        return self.get_response(request)


def install_preview_gateway():
    """Put the double in place of the Postgres gateway, only under config.settings_preview."""
    if settings.SETTINGS_MODULE == "config.settings_preview":
        services._gateway = PreviewGateway()  # noqa: SLF001


install_preview_gateway()

urlpatterns = [*real_urlpatterns]
