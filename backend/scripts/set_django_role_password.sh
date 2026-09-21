#!/usr/bin/env bash
# Sets (or resets) the password for the PostgreSQL role `django`.
#
# The password is read from backend/.env (POSTGRES_PASSWORD) and applied to
# the local Supabase Postgres instance as the superuser (`postgres`). The
# value is never printed, stored in history, or written anywhere else.
#
# It also never reaches the process list or the server log: the statement
# travels through stdin instead of `psql -c` (arguments are visible to any
# `ps` on the machine) and statement logging is turned off for this session
# before the ALTER ROLE runs.
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

# Single quotes inside the password are doubled, the way Postgres expects
# them inside a quoted literal.
ESCAPED_PASSWORD="${NEW_PASSWORD//\'/\'\'}"

psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 \
  --quiet --no-psqlrc --file - >/dev/null <<SQL
SET log_statement = 'none';
ALTER ROLE django LOGIN PASSWORD '${ESCAPED_PASSWORD}';
SQL

unset PGPASSWORD ESCAPED_PASSWORD NEW_PASSWORD

echo "Password for role 'django' updated (value not printed)."