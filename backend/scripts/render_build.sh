#!/usr/bin/env bash
# Build step of the Render web service (render.yaml at the root of the repo).
#
# Render runs it from backend/ (`rootDir: backend`), with the environment variables of the
# service already set, and the start command then uses what it leaves behind: the virtual
# environment in backend/.venv and the static files in backend/staticfiles. See "Despliegue del
# entorno de revisión (demo)" in backend/README.md.

set -euo pipefail

# Render adds uv by itself when the root of the service has a uv.lock. If it did not (a runtime
# change, an older service), install the version that was used to write the lock file.
UV_FALLBACK_VERSION="0.8.13"
if ! command -v uv >/dev/null 2>&1; then
  python -m pip install --quiet "uv==${UV_FALLBACK_VERSION}"
fi

# The locked dependencies without the dev group: ruff has no place on a server.
uv sync --frozen --no-dev

# Every static file to staticfiles/, with a hash in its name and compressed, for WhiteNoise.
uv run --frozen --no-dev python manage.py collectstatic --noinput

# Migrate by app label, one app at a time, and never everything at once: Django owns only some of
# the tables in the shared database (the rest belong to supabase/migrations), and the rule of the
# project is to name what is migrated. `contenttypes` and `auth` go first because the others
# depend on them. These labels have to stay the apps that have migrations: a test compares them.
for app in contenttypes auth admin sessions inventory ecommerce panel; do
  uv run --frozen --no-dev python manage.py migrate "$app" --noinput
done
