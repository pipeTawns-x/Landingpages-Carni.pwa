"""Settings for `manage.py test`.

The real settings point at the shared local Supabase Postgres, and the tests
must not touch it. Django cannot build a test database there (the `django`
role is NOCREATEDB), and the catalog tables are unmanaged mirrors of tables
that Supabase owns. So `manage.py test` selects these settings, which run the
tests on an in-memory SQLite database that Django creates and throws away on
its own.
"""

from .settings import *  # noqa: F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Build the inventory tables straight from the models instead of running its
# migrations: the mirrored tables are unmanaged, so the migrations never
# create them, and the tests need them to exist.
MIGRATION_MODULES = {"inventory": None}

TEST_RUNNER = "config.test_runner.UnmanagedModelsTestRunner"

# MD5 is insecure and fast, which is what a throwaway test database wants.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
