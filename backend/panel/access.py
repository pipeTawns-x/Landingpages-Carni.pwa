"""Who may use the panel: admins whose session was opened by a Supabase handoff.

Django keeps no passwords for the people who use the panel. A Supabase admin
signs in at the store, the store hands the token over, and `views.sesion` turns
it into a Django session through the functions below. Every panel view is then
wrapped in `panel_admin_required`, which only lets such a session in: a Django
user created some other way (the admin site, `createsuperuser`) has no marker in
its session and is not a panel admin, whatever its other permissions.
"""

import uuid
from functools import wraps

from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.hashers import make_password
from django.shortcuts import redirect

from panel.models import Profile
from panel.supabase_auth import VerifiedToken

# Written to the session by the handoff. Its value is the Supabase user id, the
# same text as the username of the Django user the session belongs to.
PANEL_SESSION_KEY = "panel_supabase_user_id"


def get_or_create_panel_user(verified: VerifiedToken):
    """Return the Django user that stands for a Supabase user, creating it on first use.

    The username is the Supabase user id: unique, it never changes, and it is
    what the session marker is compared with. The password is always unusable
    (nothing in Django can sign this user in, only the handoff opens a session)
    and the user is no staff and no superuser, so it does not reach the Django
    admin site. If a password was ever set on it, it is taken away again.
    """
    user_model = get_user_model()
    user, _created = user_model.objects.get_or_create(
        username=str(verified.user_id),
        defaults={"password": make_password(None), "email": verified.email},
    )

    changed = []
    if user.has_usable_password():
        user.set_unusable_password()
        changed.append("password")
    if verified.email and user.email != verified.email:
        user.email = verified.email
        changed.append("email")
    if changed:
        user.save(update_fields=changed)
    return user


def open_panel_session(request, user) -> None:
    """Log `user` in and mark the session as one that came from a Supabase handoff."""
    login(request, user)
    request.session[PANEL_SESSION_KEY] = user.get_username()


def is_panel_admin(request) -> bool:
    """Say whether the request carries a handoff session of someone who is still an admin.

    The session has to be one the handoff opened, for its own user, and that
    user has to be an admin in Supabase right now: the role is read on every
    request, so taking it away there ends the access at once and not when the
    session expires.
    """
    user = request.user
    if not (user.is_authenticated and user.is_active):
        return False

    marker = request.session.get(PANEL_SESSION_KEY)
    if marker != user.get_username():
        return False

    try:
        supabase_user_id = uuid.UUID(marker)
    except ValueError:
        return False
    return Profile.is_admin(supabase_user_id)


def panel_admin_required(view):
    """Send everyone but a handed-off admin to the access bridge instead of running `view`.

    A session that came from a handoff and no longer qualifies (the admin was
    demoted in Supabase, or deactivated here) is closed on the spot instead of
    being left open. A session that never came from one, such as a staff member
    of the Django admin site, is left alone: it is just not a panel session.

    The wrapper carries `panel_admin_required = True` so a test can tell which
    panel routes are guarded and fail when a new one is not.
    """

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not is_panel_admin(request):
            if PANEL_SESSION_KEY in request.session:
                logout(request)
            return redirect("panel:acceso")
        return view(request, *args, **kwargs)

    wrapper.panel_admin_required = True
    return wrapper
