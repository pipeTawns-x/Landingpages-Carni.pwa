"""Settings for the local preview: the real pages on synthetic data, on this machine only.

They build on config.settings_test, which already replaces every Supabase value with a fake one
before the regular settings are imported, and add what a browser needs: DEBUG, the loopback hosts,
a SQLite file that survives between runs, and the routes of config.urls_preview. Nothing here
reaches Supabase, Render or backend/.env.

They refuse to load on Render (which sets RENDER in the environment of every service) and with a
database file that is not an absolute path outside the repository.
"""

import importlib
import os
import secrets
import tempfile
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

REPO_ROOT = Path(__file__).resolve().parents[2]

if "RENDER" in os.environ:
    raise ImproperlyConfigured(
        "The preview settings refuse to load where RENDER is set: they are for this machine only."
    )


def preview_database_path(raw: str) -> Path:
    """Return the SQLite file of the preview, refusing one that is not a file outside the repo."""
    path = Path(raw)
    if raw == ":memory:" or not path.is_absolute():
        raise ImproperlyConfigured(f"CARNI_PREVIEW_DB must be an absolute file path, not {raw!r}.")
    if path.resolve().is_relative_to(REPO_ROOT.resolve()):
        raise ImproperlyConfigured(
            f"CARNI_PREVIEW_DB must be outside the repository ({REPO_ROOT}), not {raw!r}."
        )
    return path


PREVIEW_DB = preview_database_path(
    os.environ.get("CARNI_PREVIEW_DB")
    or str(Path(tempfile.gettempdir()) / "carni-preview" / "preview.sqlite3")
)


def private_directory(directory: Path) -> None:
    """Create the database directory for this user only (0o700), refusing anyone else's."""
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    info = directory.stat()
    if info.st_uid != os.getuid():
        raise ImproperlyConfigured(
            f"The preview database directory {directory} is owned by another user."
        )
    if info.st_mode & 0o077:
        raise ImproperlyConfigured(
            f"The preview database directory {directory} must be 0o700, "
            f"not {oct(info.st_mode & 0o777)}."
        )


private_directory(PREVIEW_DB.parent)

# backend/.env is never read: python-dotenv skips load_dotenv() while this is set.
os.environ["PYTHON_DOTENV_DISABLED"] = "1"
# The regular settings require these. None of them reaches a real service: the database is the
# SQLite file above, and config.settings_test overwrites every Supabase value.
# The secret is random on every start and never comes from the shell, so a reload of runserver
# ends the sessions it signed: open the invite link again.
os.environ["DJANGO_SECRET_KEY"] = secrets.token_urlsafe(48)
for name in ("POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_HOST"):
    os.environ[name] = "preview-unused"
os.environ["POSTGRES_PORT"] = "5432"
os.environ["DJANGO_DEBUG"] = "True"
os.environ["DJANGO_ALLOWED_HOSTS"] = ""

from .settings_test import *  # noqa: E402, F403

# Already loaded by config.settings_test, after it set the fake values the regular settings read.
base = importlib.import_module("config.settings")

CARNI_PREVIEW = True
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
ROOT_URLCONF = "config.urls_preview"
# The barrier is runserver bound to 127.0.0.1 plus this middleware, which answers 404 to any
# request that does not come from loopback; ALLOWED_HOSTS only checks a header the client writes.
MIDDLEWARE = ["config.urls_preview.LoopbackOnlyMiddleware", *MIDDLEWARE]  # noqa: F405

# The store is the preview itself, so the CSP names no other origin.
STORE_ORIGIN = "http://127.0.0.1:8000"
PANEL_ALLOWED_ORIGINS = [STORE_ORIGIN, "http://localhost:8000"]

# The preview is opened with a review invite (scripts/preview.sh prints it).
REVIEW_INVITES_ENABLED = True
# Cookies of their own, so the preview does not overwrite those of another Django on 127.0.0.1.
SESSION_COOKIE_NAME = "carni_preview_sessionid"
CSRF_COOKIE_NAME = "carni_preview_csrftoken"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": PREVIEW_DB,
    }
}

# The test settings silence the log; the preview shows it in the terminal again.
LOGGING = base.LOGGING
