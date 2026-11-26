"""The dashboard of the panel: the home with the metrics (panel:inicio) and the orders board.

The metrics come from `panel_kpis`, one Postgres function, and from `panel.metrics` (the sales of
the last eight weeks, the margin of each product and the low stock), which reads the tables with
the ORM. The board moves an order with `set_order_status`. Django reads the orders, never writes
them.

The weekly chart is an SVG drawn on the server: the CSP of the panel admits no script and no
inline style, and the SVG presentation attributes (x, y, width, height) are allowed.
"""

import datetime
from decimal import Decimal

from django.contrib import messages
from django.db import DatabaseError
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect, render
from django.utils import timezone
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST, require_safe

from panel import metrics as panel_metrics
from panel.access import PANEL_SESSION_KEY, panel_admin_required
from ventas import domain, services
from ventas.models import PanelOrder
from ventas.views.comun import with_labels

WEEKDAYS = ("lun", "mar", "mié", "jue", "vie", "sáb", "dom")
RECENT_ORDERS = 6
CLOSED_ON_BOARD = 20

# Geometry of the weekly chart, in SVG units of its viewBox.
CHART = {"width": 320, "height": 160, "top": 8, "base": 136, "gap": 8}


def _scale(value, top):
    """A value as a step from 0 to 10 of the largest one, for the classes of the bars."""
    return 0 if top <= 0 else round(value / top * 10)


def _home_metrics(kpis):
    days = [(day, Decimal(day["total"])) for day in kpis.get("serie_7d") or []]
    best_day = max((total for _, total in days), default=Decimal(0))
    top = kpis.get("top5") or []
    best_product = max((Decimal(row["ingreso"]) for row in top), default=Decimal(0))
    return {
        "ventas_hoy": kpis["ventas_hoy"],
        "pendientes": kpis["pendientes"],
        "ticket": kpis["ticket_promedio_30d"],
        "margen": kpis.get("margen_30d"),
        "semana": [
            {
                "label": WEEKDAYS[datetime.date.fromisoformat(day["dia"]).weekday()],
                "dia": day["dia"],
                "total": day["total"],
                "bar_class": f"v-bar--{_scale(total, best_day)}",
            }
            for day, total in days
        ],
        "top5": [
            {**row, "width_class": f"v-w-{_scale(Decimal(row['ingreso']), best_product)}"}
            for row in top
        ],
    }


def _week_bars(weeks):
    """Place one bar per week, scaled to the best week, with its label under the baseline."""
    best = max((week["total"] for week in weeks), default=Decimal("0"))
    slot = CHART["width"] / len(weeks)
    plot_height = CHART["base"] - CHART["top"]
    bar_width = round(slot - CHART["gap"], 1)
    bars = []
    for index, week in enumerate(weeks):
        height = 0.0 if best <= 0 else round(float(week["total"] / best) * plot_height, 1)
        x = round(index * slot + CHART["gap"] / 2, 1)
        bars.append(
            {
                **week,
                "x": x,
                "y": round(CHART["base"] - height, 1),
                "width": bar_width,
                "height": height,
                "label_x": round(x + bar_width / 2, 1),
                "is_current": index == len(weeks) - 1,
            }
        )
    return bars


def _trends(today):
    """The numbers of `panel.metrics` for the home: weeks, margins and low stock."""
    weeks = panel_metrics.weekly_sales(today)
    return {
        "weeks": _week_bars(weeks),
        "weeks_total": sum((week["total"] for week in weeks), Decimal("0")),
        "margins": panel_metrics.price_margins(),
        "without_cost": panel_metrics.products_without_cost(),
        "low_stock": panel_metrics.low_stock(),
        "low_stock_threshold": panel_metrics.LOW_STOCK_THRESHOLD,
    }


def home(request):
    """The home of the panel. Called by `panel.views.inicio`, which guards it.

    Each block fails on its own: no metrics when `panel_kpis` fails, no orders when the mirror
    fails, no trends when the tables of `panel.metrics` fail.
    """
    metrics = None
    try:
        metrics = _home_metrics(services.get_gateway().panel_kpis())
    except (services.GatewayError, services.GatewayUnavailable, KeyError, ValueError):
        metrics = None
    try:
        recent = [with_labels(order) for order in PanelOrder.objects.all()[:RECENT_ORDERS]]
    except DatabaseError:
        recent = None
    try:
        trends = _trends(timezone.localdate())
    except DatabaseError:
        trends = None
    context = {"metrics": metrics, "recent": recent, "inicio": trends, "chart": CHART}
    return render(request, "ventas/inicio.html", context)


@panel_admin_required
@require_safe
def tablero(request):
    """The orders board: one column per status, the open ones complete, the closed ones recent."""
    columns = []
    for status in domain.STATUSES:
        orders = PanelOrder.objects.filter(status=status)
        if not domain.TRANSITIONS[status]:
            orders = orders[:CLOSED_ON_BOARD]
        columns.append(
            {
                "status": status,
                "label": domain.STATUS_LABELS[status],
                "orders": [with_labels(order) for order in orders],
            }
        )
    return render(request, "ventas/tablero.html", {"columns": columns})


@panel_admin_required
@require_POST
def pedido_mover(request, pk):
    status = request.POST.get("status", "")
    if status not in domain.STATUS_LABELS:
        return HttpResponseBadRequest("Estado no válido.")
    try:
        services.get_gateway().set_order_status(pk, status, request.session.get(PANEL_SESSION_KEY))
    except services.GatewayError as error:
        messages.error(request, domain.message_for(error.code))
    except services.GatewayUnavailable:
        messages.error(request, domain.UNAVAILABLE_MESSAGE)
    else:
        messages.success(request, f"Pedido {str(pk)[:8]}: {domain.STATUS_LABELS[status].lower()}.")
    target = request.POST.get("next", "")
    if url_has_allowed_host_and_scheme(
        target, allowed_hosts={request.get_host()}, require_https=request.is_secure()
    ):
        return redirect(target)
    return redirect("orders:board")
