"""Django system checks for the Carni backend.

Registered from ``config/__init__.py`` (``config`` is a project package, not
an installed app, so Django would not auto-discover this module).
"""

from django.core.checks import Error, Tags, register
from django.db import connection


@register(Tags.database)
def check_django_schema_exists(app_configs=None, **kwargs):
    """Fail when the shared ``django`` schema is missing.

    The ``django`` schema is created by a Supabase migration (see
    ``supabase/migrations/20260918235409_django_schema_role.sql``). Django
    must never create its tables in the ``public`` schema, which belongs to
    Supabase. If the schema is gone, ``migrate`` would silently create Django
    tables in the wrong place, so this check stops that before it happens.
    """
    errors = []
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM information_schema.schemata WHERE schema_name = 'django'")
            schema_exists = cursor.fetchone() is not None
    except Exception:
        # The connection itself failed (DB down, wrong env, etc.). Let Django
        # surface that error normally instead of masking it with our check.
        return errors

    if not schema_exists:
        errors.append(
            Error(
                "The 'django' schema does not exist in the database.",
                hint=(
                    "Run the Supabase migration that creates it first: "
                    "`supabase migration up --local`. Django must never "
                    "create its tables in the 'public' schema, which belongs "
                    "to Supabase (see supabase/migrations)."
                ),
                id="config.E001",
            )
        )
    return errors
