#!/usr/bin/env bash
# Sets (or resets) the password for the PostgreSQL role `django`.
#
# The password is read from backend/.env (POSTGRES_PASSWORD) and applied to
# the local Supabase Postgres instance as the superuser (`postgres`). The
# value is never printed, stored in history, or written anywhere else.
#
# Usage:
#   backend/scripts/set_django_role_password.sh
#
# Requires the local Supabase stack to be running (supabase start).

set -euo pipefail

ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "backend/.env not found at $ENV_FILE" >&2
  exit 1
fi

NEW_PASSWORD="$(sed -n 's/^POSTGRES_PASSWORD=//p' "$ENV_FILE" | head -n1)"

if [[ -z "$NEW_PASSWORD" ]]; then
  echo "POSTGRES_PASSWORD is empty in backend/.env" >&2
  exit 1
fi

# Local Supabase default superuser. The role `django` never uses this
# credential; it connects with its own role and password from .env.
export PGPASSWORD="${SUPABASE_DB_PASSWORD:-postgres}"

psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "ALTER ROLE django LOGIN PASSWORD '${NEW_PASSWORD}';" >/dev/null

unset PGPASSWORD

echo "Password for role 'django' updated (value not printed)."