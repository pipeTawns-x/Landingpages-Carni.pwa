"""The dashboard of the panel: the home with the metrics (panel:inicio) and the orders board.

The metrics come from `panel_kpis`, one Postgres function; the board moves an order with
`set_order_status`. Django reads the orders, never writes them.
"""

import datetime
from decimal import Decimal

from django.contrib import messages
from django.db import DatabaseError
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST, require_safe

from panel.access import PANEL_SESSION_KEY, panel_admin_required
from ventas import domain, services
from ventas.models import PanelOrder
from ventas.views.comun import with_labels

WEEKDAYS = ("lun", "mar", "mié", "jue", "vie", "sáb", "dom")
RECENT_ORDERS = 6
CLOSED_ON_BOARD = 20


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


def home(request):
    """The home of the panel. Called by `panel.views.inicio`, which guards it."""
    metrics = None
    try:
        metrics = _home_metrics(services.get_gateway().panel_kpis())
    except (services.GatewayError, services.GatewayUnavailable, KeyError, ValueError):
        metrics = None
    try:
        recent = [with_labels(order) for order in PanelOrder.objects.all()[:RECENT_ORDERS]]
    except DatabaseError:
        recent = None
    context = {"metrics": metrics, "recent": recent}
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
