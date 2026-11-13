#!/usr/bin/env bash
# Rebuilds the work database, applies the 5 comercio-v1 migrations in order, proves
# every -- DOWN block (apply, revert, apply) and runs every SQL test.
#
# Last line of the output:   TOTAL: N pruebas, F fallas
# Exit code is non-zero when F > 0.
#
# Work database: comercio_v1_test, inside the local container. The development
# database (`postgres`) and the remote project are never touched: every connection
# below names $DB explicitly, and the only statements that leave it are
# DROP/CREATE DATABASE, which run against template1.
#
# Subcommands for the build loop (same helpers, one step at a time):
#   correr.sh base            rebuild up to the 9 base migrations + seed + Django fixtures
#   correr.sh up N            apply comercio-v1 migration N (1-5)
#   correr.sh down N          run the DOWN block of comercio-v1 migration N
#   correr.sh prueba NOMBRE   run supabase/tests/comercio_v1_NOMBRE.sql
#   correr.sh                 everything, from scratch
#
# Pruebas run as supabase_admin (superuser): postgres cannot SET ROLE django nor
# create pgTAP. Migrations run as postgres, the role that applies them for real.

set -u
set -o pipefail

CONTAINER="supabase_db_Carni-mvp"
DB="comercio_v1_test"
AQUI="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$AQUI/../.." && pwd)"
MIG="$REPO/supabase/migrations"
TMP="$(mktemp -d)"

TOTAL=0
FALLAS=0

# Admin (superuser) goes through TCP loopback; postgres through the socket.
adm() { docker exec -i "$CONTAINER" psql -X -q -h 127.0.0.1 -U supabase_admin -v ON_ERROR_STOP=1 "$@"; }
pgu() { docker exec -i "$CONTAINER" psql -X -q -U postgres -v ON_ERROR_STOP=1 "$@"; }

# One TAP-style line per check done by this script itself, counted in the total.
paso() { # $1 = exit code, $2 = description
  TOTAL=$((TOTAL + 1))
  if [ "$1" -eq 0 ]; then
    echo "ok $TOTAL - $2"
  else
    FALLAS=$((FALLAS + 1))
    echo "not ok $TOTAL - $2"
  fi
}

# The 9 migrations that exist before comercio-v1, and the comercio-v1 ones.
base_migrations() { ls "$MIG"/*.sql | grep -v '/2026111300000[0-9]_'; }
migracion() { ls "$MIG"/2026111300000"$1"_*.sql 2>/dev/null | head -1; }

# The DOWN block is the commented tail of each migration: strip the leading "-- ".
down_sql() { sed -n '/^-- DOWN/,$p' "$1" | sed '1d' | sed -E 's/^-- ?//'; }

crear_base() {
  [ "$DB" = "comercio_v1_test" ] || { echo "refusing to touch database $DB" >&2; return 2; }
  adm -d template1 -c "DROP DATABASE IF EXISTS $DB WITH (FORCE)" -c "CREATE DATABASE $DB OWNER postgres" || return 1
  adm -d "$DB" -f - < "$AQUI/andamio/00_proyecto.sql" || return 1
}

aplicar_base() {
  local f
  for f in $(base_migrations); do
    # The role django already exists in the cluster (roles are not per database).
    sed 's/^CREATE ROLE django NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;$/-- (role django already exists in the cluster)/' "$f" \
      | pgu -1 -d "$DB" -f - || { echo "base migration failed: $(basename "$f")" >&2; return 1; }
  done
  pgu -1 -d "$DB" -f - < "$REPO/supabase/seed.sql" > /dev/null || return 1
  adm -d "$DB" -f - < "$AQUI/andamio/10_django.sql" || return 1
}

subir() { # $1 = migration number
  local f; f="$(migracion "$1")"
  [ -n "$f" ] || { echo "no migration file for number $1" >&2; return 1; }
  pgu -1 -d "$DB" -f - < "$f"
}

bajar() { # $1 = migration number
  local f; f="$(migracion "$1")"
  [ -n "$f" ] || { echo "no migration file for number $1" >&2; return 1; }
  down_sql "$f" | pgu -1 -d "$DB" -f -
}

volcar() { docker exec "$CONTAINER" pg_dump -U postgres -d "$DB" --schema-only | sed -E '/^\\(un)?restrict /d'; }

# Fingerprint of the base data, to prove a DOWN does not lose it.
huella() {
  pgu -At -d "$DB" -c "select md5(coalesce(string_agg(c::text, '|' order by id), '')) from public.categories c" \
                   -c "select md5(coalesce(string_agg(p::text, '|' order by id), '')) from public.products p"
}

instalar_ayudas() { adm -d "$DB" -f - < "$AQUI/ayudas.sql"; }

# Runs one test file inside its own psql session and counts the TAP lines.
correr_prueba() { # $1 = path of the test file
  local f="$1" nombre salida oks fails rc
  nombre="$(basename "$f" .sql)"
  salida="$TMP/$nombre.out"
  {
    printf '\\set ON_ERROR_STOP on\n'
    # The shared cases travel in a session setting; tests read current_setting('casos.json').
    printf 'DO $x$ BEGIN PERFORM set_config('"'"'casos.json'"'"', $casos$'
    cat "$AQUI/cotizacion-casos.json"
    printf '$casos$, false); END $x$;\n'
    cat "$f"
  } | adm -At -d "$DB" -f - > "$salida" 2> "$salida.err"
  rc=$?
  oks=$(grep -c '^ok ' "$salida")
  fails=$(grep -c '^not ok ' "$salida")
  if [ "$rc" -ne 0 ]; then
    fails=$((fails + 1))
    echo "-- $nombre: psql stopped (exit $rc); last stderr lines:"
    tail -n 5 "$salida.err" | sed 's/^/--   /'
  fi
  if [ "$fails" -gt 0 ]; then
    grep -A4 '^not ok ' "$salida" | sed 's/^/--   /'
  fi
  echo "-- $nombre: $oks ok, $fails fallas"
  TOTAL=$((TOTAL + oks + fails))
  FALLAS=$((FALLAS + fails))
}

resumen() {
  echo "-- salidas completas en $TMP"
  echo "TOTAL: $TOTAL pruebas, $FALLAS fallas"
  [ "$FALLAS" -eq 0 ]
}

cmd="${1:-todo}"
case "$cmd" in
  base)
    crear_base && aplicar_base && echo "base lista en $DB"
    ;;
  up)
    subir "${2:?number 1-5}" && echo "migration $2 applied"
    ;;
  down)
    bajar "${2:?number 1-5}" && echo "migration $2 reverted"
    ;;
  prueba)
    instalar_ayudas || exit 1
    correr_prueba "$AQUI/comercio_v1_${2:?name}.sql"
    resumen
    ;;
  todo)
    crear_base;      paso $? "work database $DB recreated"
    aplicar_base;    paso $? "9 base migrations + seed + Django fixtures applied"
    volcar > "$TMP/base.schema";  huella > "$TMP/base.huella"

    for n in 1 2 3 4 5; do
      subir "$n";    paso $? "migration $n applies on top of the previous ones"
    done
    for n in 5 4 3 2 1; do
      bajar "$n";    paso $? "DOWN of migration $n runs"
    done
    volcar > "$TMP/revertida.schema"
    diff "$TMP/base.schema" "$TMP/revertida.schema" > "$TMP/revertida.diff"
    paso $? "after the 5 DOWN blocks the schema is identical to the base (diff in $TMP/revertida.diff)"
    [ -s "$TMP/revertida.diff" ] && head -n 40 "$TMP/revertida.diff" | sed 's/^/--   /'
    huella > "$TMP/revertida.huella"
    cmp -s "$TMP/base.huella" "$TMP/revertida.huella"
    paso $? "after the 5 DOWN blocks categories and products hold the same data"
    for n in 1 2 3 4 5; do
      subir "$n";    paso $? "migration $n applies again after the revert"
    done

    instalar_ayudas; paso $? "test helpers installed"
    for f in "$AQUI"/comercio_v1_*.sql; do
      [ -e "$f" ] && correr_prueba "$f"
    done
    resumen
    ;;
  *)
    echo "usage: correr.sh [base | up N | down N | prueba NOMBRE]" >&2
    exit 2
    ;;
esac
