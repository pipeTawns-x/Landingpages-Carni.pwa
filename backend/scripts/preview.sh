#!/usr/bin/env bash
# Seed the local preview, print a review invite for the synthetic admin, and serve it on
# http://127.0.0.1:${CARNI_PREVIEW_PORT:-8000} in the foreground.
#
# The preview runs the real pages on a synthetic SQLite database outside the repository
# (config.settings_preview). It never reads backend/.env and never reaches Supabase or Render.
# Open the printed /panel/invitado/... link and press the button to enter the panel.
#
#   backend/scripts/preview.sh
#   PYTHON=/path/to/.venv/bin/python backend/scripts/preview.sh
#   CARNI_PREVIEW_PORT=8010 CARNI_PREVIEW_DB=/tmp/other/preview.sqlite3 backend/scripts/preview.sh
set -euo pipefail

backend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python="${PYTHON:-$backend_dir/.venv/bin/python}"
port="${CARNI_PREVIEW_PORT:-8000}"
# The Supabase id of the synthetic admin: PREVIEW_ADMIN_ID in panel/management/commands/preview_seed.py.
admin_id="00000000-0000-4000-8000-0000000000ad"

if [[ ! -x "$python" ]]; then
  echo "No Python at $python. Set PYTHON to the interpreter of the backend virtualenv." >&2
  exit 1
fi
if [[ ! "$port" =~ ^[0-9]{4,5}$ ]]; then
  echo "CARNI_PREVIEW_PORT must be a port number, not $port." >&2
  exit 1
fi

cd "$backend_dir"
"$python" manage.py preview_seed --settings=config.settings_preview
"$python" manage.py issue_review_invite --settings=config.settings_preview \
  --supabase-user "$admin_id" --label "Local preview" --days 1 \
  --base-url "http://127.0.0.1:$port"
exec "$python" manage.py runserver "127.0.0.1:$port" --settings=config.settings_preview
