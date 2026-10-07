"""Views of the panel shell: the Supabase handoff, the access bridge and the landing page."""

import logging

from django.conf import settings
from django.http import HttpResponseForbidden
from django.shortcuts import redirect
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.debug import sensitive_post_parameters
from django.views.decorators.http import require_POST, require_safe

from panel import supabase_auth
from panel.access import (
    get_or_create_panel_user,
    is_panel_admin,
    open_panel_session,
    panel_admin_required,
)
from panel.models import Profile

logger = logging.getLogger(__name__)

# The only field of the handoff form. It travels in the body of the POST: a
# token in a URL ends up in logs, browser history and Referer headers.
TOKEN_FIELD = "access_token"


def _refuse(reason: str, detail: str = "") -> HttpResponseForbidden:
    """Refuse a handoff without telling the browser why.

    The reason goes to the server log so that whoever runs the panel can find
    it; the response is the same for every reason, so it says nothing about what
    was wrong (an expired token, a customer account, a wrong origin...).
    """
    logger.warning("Panel handoff refused: %s%s.", reason, f" ({detail})" if detail else "")
    return HttpResponseForbidden(
        "No se pudo abrir la sesión del panel.", content_type="text/plain; charset=utf-8"
    )


# This view is the sign-in itself, so it cannot ask for a signed-in user or for
# Django's CSRF token: the form that posts to it lives on the store, another
# origin, which has no way to read a token from Django. What stands in for them:
# the origin must be on PANEL_ALLOWED_ORIGINS, and the body must carry a Supabase
# access token that passes every check. A forged request has neither.
@csrf_exempt
@require_POST
@sensitive_post_parameters(TOKEN_FIELD)
@never_cache
def sesion(request):
    """Open a panel session from the Supabase access token the store posts.

    Verifies the token, requires `profiles.role = 'admin'` for its user, maps
    that user to a Django one and logs it in. Every refusal answers the same
    403; the reason is only logged.
    """
    origin = request.headers.get("Origin")
    if origin not in settings.PANEL_ALLOWED_ORIGINS:
        return _refuse("origin", f"origin {(origin or '')[:100]!r}")

    if TOKEN_FIELD in request.GET:
        return _refuse("token_in_url")

    try:
        verified = supabase_auth.verify_access_token(request.POST.get(TOKEN_FIELD, ""))
    except supabase_auth.TokenRejected as rejection:
        return _refuse(rejection.reason)

    if not Profile.is_admin(verified.user_id):
        return _refuse("not_admin")

    user = get_or_create_panel_user(verified)
    if not user.is_active:
        # Panel access can also be revoked from here, by deactivating the user.
        return _refuse("inactive_user")

    open_panel_session(request, user)
    logger.info("Panel session opened for Supabase user %s.", verified.user_id)
    return redirect("panel:inicio")


@require_safe
def acceso(request):
    """The bridge anonymous visitors land on: the sign-in lives in the store.

    Whoever is already a panel admin goes straight in. Everyone else is sent to
    the store login, which hands the session over once Supabase has signed them
    in.
    """
    if is_panel_admin(request):
        return redirect("panel:inicio")
    return redirect(settings.STORE_LOGIN_URL)


@panel_admin_required
def inicio(request):
    """Landing page of the panel.

    The dashboard is not served from here yet (it arrives with `panel/base.html`),
    so for now the panel opens on the only section that exists: the products.
    """
    return redirect("inventory:list")
