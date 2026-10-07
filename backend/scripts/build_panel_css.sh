#!/usr/bin/env bash
# Builds the stylesheet of the panel that Django serves:
#
#   backend/assets/panel.css  --Tailwind v4-->  backend/static/panel/panel.css
#
# Tailwind runs inside Docker, in the repo's .devcontainer image (AGENTS.md: npm
# never runs on the host). The result is committed, because the Django runtime
# has no Node.
#
# Usage:
#   backend/scripts/build_panel_css.sh                  check the drift, then build
#   backend/scripts/build_panel_css.sh --check          check the drift, rebuild into a temp
#                                                       dir and fail when the committed CSS is
#                                                       stale; changes nothing in the repo
#   backend/scripts/build_panel_css.sh --sync-tokens    copy tokens.css from origin/pruebas,
#                                                       then build
#
# The drift check runs first, after `git fetch origin pruebas`, and fails when:
#   1. the sha256 of backend/assets/tokens.css differs from src/styles/tokens.css
#      on origin/pruebas (the store's tokens, contract S1), or
#   2. a version pinned below differs from the one origin/pruebas:package-lock.json
#      locks: the panel has to compile with the store's Tailwind and ship the
#      store's font files.
#
# Environment:
#   PANEL_CSS_NO_FETCH=1   skip the fetch and compare against the origin/pruebas
#                          the clone already has (offline work)
#
# Exit status: 0 ok, 1 drift or stale CSS or a failed step, 2 bad usage.

set -euo pipefail

# What the store locks. The Tailwind CLI must be the same version as the store's
# tailwindcss; the two font versions describe the woff2 files committed under
# backend/static/panel/fonts (see "Panel stylesheet" in backend/README.md).
TAILWIND_VERSION="4.3.3" # tailwindcss and @tailwindcss/cli
GEIST_VERSION="5.3.0"    # @fontsource-variable/geist
FRAUNCES_VERSION="5.3.0" # @fontsource-variable/fraunces

STORE_REF="origin/pruebas"
STORE_TOKENS_PATH="src/styles/tokens.css"
STORE_LOCK_PATH="package-lock.json"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(git -C "$BACKEND_DIR" rev-parse --show-toplevel)"
TOKENS_FILE="$BACKEND_DIR/assets/tokens.css"
CSS_OUT="$BACKEND_DIR/static/panel/panel.css"
COMPOSE_FILE="$REPO_ROOT/.devcontainer/docker-compose.yml"

# What runs inside the container. The tailwindcss CLI resolves `@import
# "tailwindcss"` from the folder of the CSS file it compiles, and the repo has no
# node_modules (the host never runs npm). So the tree is copied to /tmp, the two
# packages are installed at its root, and the CLI compiles the copy: panel.css
# finds tailwindcss above it and its `@source` paths resolve as they do in the
# repo. The copy leaves out the virtualenv, the secrets and the caches. Install
# scripts are off: the packages need none, and they are the only code that is
# downloaded.
IFS= read -r -d '' CONTAINER_SCRIPT <<'EOF' || true
set -eu
version="$1"
stage=/tmp/panel-css-stage
mkdir -p "$stage"
tar -C /workspace/backend --exclude=.venv --exclude=.env --exclude=staticfiles \
    --exclude=__pycache__ --exclude=.ruff_cache -cf - . | tar -C "$stage" -xf -
npm install --prefix "$stage" --no-save --no-audit --no-fund --ignore-scripts \
    --loglevel=error "tailwindcss@$version" "@tailwindcss/cli@$version" >&2
cd "$stage"
./node_modules/.bin/tailwindcss --input assets/panel.css --output /out/panel.css --minify >&2
EOF

usage() {
  sed -n '2,/^$/p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//' >&2
}

die() {
  echo "build_panel_css: $*" >&2
  exit 1
}

sha256_of_stdin() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | cut -d' ' -f1
  else
    shasum -a 256 | cut -d' ' -f1
  fi
}

# Updates origin/pruebas, which is where the store's tokens and lockfile are read.
fetch_store() {
  if [[ "${PANEL_CSS_NO_FETCH:-}" == "1" ]]; then
    echo "Fetch skipped (PANEL_CSS_NO_FETCH=1): comparing with $STORE_REF as the clone has it."
  else
    git -C "$REPO_ROOT" fetch --quiet origin pruebas ||
      die "could not fetch origin/pruebas. Offline? Set PANEL_CSS_NO_FETCH=1 to use the copy the clone already has."
  fi
  git -C "$REPO_ROOT" rev-parse --verify --quiet "$STORE_REF^{commit}" >/dev/null ||
    die "$STORE_REF does not exist in this clone. Run: git fetch origin pruebas"
}

# The version package-lock.json on origin/pruebas locks for an npm package, or
# nothing when the package is not in it.
lock_version() {
  git -C "$REPO_ROOT" show "$STORE_REF:$STORE_LOCK_PATH" |
    awk -v key="\"node_modules/$1\": {" '
      index($0, key) { found = 1; next }
      found && !done && $1 == "\"version\":" { gsub(/[",]/, "", $2); print $2; done = 1 }
      found && /^    }/ { found = 0 }
    '
}

sync_tokens() {
  local tmp="$TOKENS_FILE.sync"
  if ! git -C "$REPO_ROOT" show "$STORE_REF:$STORE_TOKENS_PATH" >"$tmp"; then
    rm -f "$tmp"
    die "could not read $STORE_TOKENS_PATH from $STORE_REF"
  fi
  mv "$tmp" "$TOKENS_FILE"
  echo "Copied $STORE_TOKENS_PATH from $STORE_REF to backend/assets/tokens.css."
}

# Fails when the backend has fallen behind the store: its tokens, its Tailwind or
# its fonts. Prints every difference before it stops.
check_drift() {
  local tokens_drift=0 pins_drift=0 backend_sha store_sha entry name pinned locked

  backend_sha="$(sha256_of_stdin <"$TOKENS_FILE")"
  store_sha="$(git -C "$REPO_ROOT" show "$STORE_REF:$STORE_TOKENS_PATH" | sha256_of_stdin)" ||
    die "could not read $STORE_TOKENS_PATH from $STORE_REF"
  if [[ "$backend_sha" == "$store_sha" ]]; then
    echo "ok     tokens.css is the one on $STORE_REF (sha256 $backend_sha)"
  else
    tokens_drift=1
    echo "DRIFT  tokens.css differs from $STORE_REF:$STORE_TOKENS_PATH" >&2
    echo "         backend copy  $backend_sha" >&2
    echo "         $STORE_REF  $store_sha" >&2
  fi

  for entry in \
    "tailwindcss:$TAILWIND_VERSION" \
    "@fontsource-variable/geist:$GEIST_VERSION" \
    "@fontsource-variable/fraunces:$FRAUNCES_VERSION"; do
    name="${entry%:*}"
    pinned="${entry##*:}"
    locked="$(lock_version "$name")" || die "could not read $STORE_LOCK_PATH from $STORE_REF"
    if [[ "$locked" == "$pinned" ]]; then
      echo "ok     $name $pinned is what $STORE_REF locks"
    else
      pins_drift=1
      echo "DRIFT  $name: $STORE_REF locks ${locked:-nothing}, this script pins $pinned" >&2
    fi
  done

  if [[ "$tokens_drift" -ne 0 ]]; then
    echo "       Resync the tokens with: backend/scripts/build_panel_css.sh --sync-tokens" >&2
  fi
  if [[ "$pins_drift" -ne 0 ]]; then
    echo "       Update the pin at the top of this script and, for a font, copy the new woff2" >&2
    echo "       file and license (backend/README.md, \"Panel stylesheet\"), then rebuild." >&2
  fi
  if [[ "$tokens_drift" -ne 0 || "$pins_drift" -ne 0 ]]; then
    exit 1
  fi
}

# Compiles backend/assets/panel.css inside Docker and leaves panel.css in $1.
compile_css() {
  local out_dir="$1"
  docker info >/dev/null 2>&1 || die "Docker is not running"
  docker compose -f "$COMPOSE_FILE" run --rm -T \
    --user "$(id -u):$(id -g)" \
    -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
    -v "$out_dir:/out" \
    --workdir /tmp \
    app sh -euc "$CONTAINER_SCRIPT" sh "$TAILWIND_VERSION" ||
    die "the Docker build failed"
  [[ -s "$out_dir/panel.css" ]] || die "the build produced no CSS"
}

mode="build"
case "${1:-}" in
  "") ;;
  --check) mode="check" ;;
  --sync-tokens) mode="sync" ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    usage
    exit 2
    ;;
esac
if [[ $# -gt 1 ]]; then
  usage
  exit 2
fi

fetch_store
if [[ "$mode" == "sync" ]]; then
  sync_tokens
fi
[[ -f "$TOKENS_FILE" ]] || die "backend/assets/tokens.css is missing; run --sync-tokens"
check_drift

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/panel-css.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT
echo "Compiling backend/assets/panel.css with tailwindcss@$TAILWIND_VERSION in Docker..."
compile_css "$work_dir"

if [[ "$mode" == "check" ]]; then
  if [[ -f "$CSS_OUT" ]] && cmp -s "$work_dir/panel.css" "$CSS_OUT"; then
    echo "ok     backend/static/panel/panel.css is up to date"
  else
    die "backend/static/panel/panel.css is stale: it is not what the sources build. Run backend/scripts/build_panel_css.sh and commit the result."
  fi
else
  mkdir -p "$(dirname "$CSS_OUT")"
  if [[ -f "$CSS_OUT" ]] && cmp -s "$work_dir/panel.css" "$CSS_OUT"; then
    echo "ok     backend/static/panel/panel.css was already up to date"
  else
    cp "$work_dir/panel.css" "$CSS_OUT"
    echo "built  backend/static/panel/panel.css ($(wc -c <"$CSS_OUT" | tr -d ' ') bytes)"
  fi
fi
