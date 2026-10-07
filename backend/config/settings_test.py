"""Settings for `manage.py test`.

The real settings point at the shared local Supabase Postgres, and the tests
must not touch it. Django cannot build a test database there (the `django`
role is NOCREATEDB), and the catalog tables are unmanaged mirrors of tables
that Supabase owns. So `manage.py test` selects these settings, which run the
tests on an in-memory SQLite database that Django creates and throws away on
its own.
"""

import os
import secrets

# The panel's configuration is required by the regular settings, which read it
# from the environment while they are imported. The tests set their own values
# first, so they never depend on backend/.env or on the shell they run from.
# The signing secret is random on every run: nothing here can be mistaken for a
# real one, and no test can rely on a value it did not read from the settings.
os.environ["SUPABASE_URL"] = "http://supabase.test"
os.environ["SUPABASE_JWKS_URL"] = ""
os.environ["SUPABASE_JWT_SECRET"] = secrets.token_urlsafe(48)
os.environ["STORE_ORIGIN"] = "http://store.test"
os.environ["PANEL_ALLOWED_ORIGINS"] = "http://store.test"
os.environ["PANEL_TOKEN_MAX_AGE_SECONDS"] = "300"

from .settings import *  # noqa: E402, F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Build the inventory and panel tables straight from the models instead of
# running their migrations: the mirrored tables are unmanaged, so the
# migrations never create them, and the tests need them to exist.
MIGRATION_MODULES = {"inventory": None, "panel": None}

TEST_RUNNER = "config.test_runner.UnmanagedModelsTestRunner"

# MD5 is insecure and fast, which is what a throwaway test database wants.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Tests that look at the log do it with assertLogs; everything else stays quiet.
LOGGING = {**LOGGING, "handlers": {"console": {"class": "logging.NullHandler"}}}  # noqa: F405
