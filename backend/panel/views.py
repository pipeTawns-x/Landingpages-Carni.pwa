"""Views of the panel shell: the Supabase handoff, the review invite, the way out, the bridge
and the landing page."""

import logging

from django.conf import settings
from django.contrib.auth import logout
from django.db import transaction
from django.http import Http404, HttpResponseForbidden
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.cache import add_never_cache_headers
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.debug import sensitive_post_parameters
from django.views.decorators.http import require_http_methods, require_POST, require_safe

from panel import supabase_auth
from panel.access import (
    PANEL_SESSION_KEY,
    get_or_create_panel_user,
    get_or_create_panel_user_by_id,
    is_panel_admin,
    open_panel_session,
    panel_admin_required,
)
from panel.models import Profile, ReviewInvite, is_valid_landing_path

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


def _mark_private(response):
    """Keep a response that belongs to an invite link out of caches, search engines and Referers.

    The link is the secret, and it is in the address of the page. `Referrer-Policy` is
    `strict-origin`, which sends the origin and never the path, so the token does not travel
    in a `Referer` header to the page that follows or to anything this one loads. It is not
    `no-referrer`, although that would keep even the origin back: with `no-referrer` a browser
    sends `Origin: null` on the form POST, Django refuses a null origin, and the button would
    never work (see "Panel session handoff" in backend/README.md).
    """
    response["Referrer-Policy"] = "strict-origin"
    response["X-Robots-Tag"] = "noindex, nofollow"
    add_never_cache_headers(response)
    return response


def _refuse_invite(request, reason, invite=None):
    """Answer a link that cannot be used: one page, one status, whatever the reason was.

    As with the handoff, the reason goes to the server log (never the token) and the browser
    cannot tell an unknown link from an expired, a revoked or a used up one.
    """
    detail = f" (invite {invite.pk})" if invite is not None else ""
    logger.warning("Review invite refused: %s%s.", reason, detail)
    return render(request, "panel/invitado_invalido.html", status=404)


def _show_invite(request, token):
    """Show the page that asks for a click. Nothing is opened, counted or created here."""
    invite = ReviewInvite.find(token)
    reason = "unknown" if invite is None else invite.refusal_reason()
    if reason:
        return _refuse_invite(request, reason, invite)
    return render(request, "panel/invitado.html", {"invite": invite})


def _redeem_invite(request, token):
    """Use the link: count the use and open the panel session of the user it is for.

    Everything happens in one transaction with the invite row locked, so the last use of a
    link goes to one person even when two click at once, and a failure while opening the
    session does not burn a use.
    """
    with transaction.atomic():
        invite = ReviewInvite.find(token, for_update=True)
        reason = "unknown" if invite is None else invite.refusal_reason()
        if reason:
            return _refuse_invite(request, reason, invite)

        user = get_or_create_panel_user_by_id(invite.supabase_user_id)
        if not user.is_active:
            # Panel access can be revoked by deactivating the user, link or no link.
            return _refuse_invite(request, "inactive_user", invite)

        invite.record_use()
        # Nothing the browser carried survives: not even a session of this same user, whose
        # key `login()` would keep. So whoever planted a key cannot keep it.
        request.session.flush()
        open_panel_session(request, user)

        # The model refuses a landing path that leaves the site, but a row can come from
        # elsewhere (SQL, bulk_create), so the redirect checks it again.
        landing = invite.landing_path
        if not is_valid_landing_path(landing):
            landing = reverse("panel:inicio")

    logger.info(
        "Review invite %s opened a panel session for Supabase user %s.",
        invite.pk,
        invite.supabase_user_id,
    )
    return redirect(landing)


# Like `sesion`, this view is a way in, so it cannot ask for a signed-in user. What stands in
# for one: a token that is looked up by its hash and that expires, can be revoked and can run
# out of uses; Django's CSRF check on the POST; and the server-side validation of every step
# (the page that asks for the click never changes anything). It answers 404 unless the
# environment turns it on.
@require_http_methods(["GET", "HEAD", "POST"])
def invitado(request, token):
    """The review invite: a link that opens the panel for a reviewer who has no password.

    A GET only shows a page with a button, and never opens a session: a chat or a mail
    scanner that opens the link for a preview must not be able to use it. The POST behind
    the button, which carries Django's CSRF token, validates the link again, counts the use
    and opens the same session the Supabase handoff opens. From then on the panel works as
    for any admin, reading the role of that user on every request.

    With `REVIEW_INVITES_ENABLED` off, the route answers 404 as if it did not exist.
    """
    if not settings.REVIEW_INVITES_ENABLED:
        raise Http404("Review invites are off.")

    handler = _redeem_invite if request.method == "POST" else _show_invite
    return _mark_private(handler(request, token))


# Not behind `panel_admin_required` on purpose: whoever has a session has to be
# able to end it, including an admin whose role was just taken away. A POST with
# Django's CSRF check, so another site cannot sign anyone out.
@require_POST
def salir(request):
    """End the session and send the person to the store login.

    This closes the Django session only. The Supabase one lives in the store's
    browser storage, so the store has to sign out of Supabase as well.
    """
    supabase_user_id = request.session.get(PANEL_SESSION_KEY)
    logout(request)
    if supabase_user_id:
        logger.info("Panel session closed for Supabase user %s.", supabase_user_id)
    return redirect(settings.STORE_LOGIN_URL)


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


@panel_admin_required
@require_safe
def mas(request):
    """The "Más" page of the phone layout: the sections that do not fit in the tab bar.

    The tab bar has room for five entries, so Clientes, Publicidad, Ajustes and the
    sign-out live on a page of their own instead of in a drawer.
    """
    return render(request, "panel/mas.html")
