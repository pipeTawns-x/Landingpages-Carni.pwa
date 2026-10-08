# Carni-mvp backend

Django backend for Carni-mvp: server-side panel and future API. It shares the
same Postgres instance as Supabase (Django-owned tables live in the `django`
schema; existing tables in `public` remain owned by `supabase/migrations`).

## Requirements

- [uv](https://docs.astral.sh/uv/) 0.8+
- Python 3.12 (managed by uv via `.python-version`)
- Local Supabase running (`supabase start` from the repo root)

## Setup

```bash
cd backend
uv sync
```

## Environment variables

`backend/.env` is private and not versioned. Create it yourself; each variable is
documented with a comment inside the file. Generate `DJANGO_SECRET_KEY` per
environment with:

```bash
uv run python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
```

`POSTGRES_*` values match your local Supabase instance; get them with
`supabase status` (default local port `54322`).

| Variable | Description |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django secret key. Required, no default. |
| `DJANGO_DEBUG` | `True`/`False`. |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hosts. |
| `POSTGRES_DB` | Database name. |
| `POSTGRES_USER` | Database user. |
| `POSTGRES_PASSWORD` | Database password. |
| `POSTGRES_HOST` | Database host. |
| `POSTGRES_PORT` | Database port. |
| `SUPABASE_URL` | URL of the Supabase project (`http://127.0.0.1:54321` locally). `<SUPABASE_URL>/auth/v1` is the issuer a panel token must carry. Required. |
| `SUPABASE_JWKS_URL` | Production: where the project publishes its signing keys, `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`. When it is set, tokens are checked against those keys and `SUPABASE_JWT_SECRET` is ignored. |
| `SUPABASE_JWT_SECRET` | The local Supabase signs with this shared secret (HS256); `supabase status -o env` prints it as `JWT_SECRET`. Used only when `SUPABASE_JWKS_URL` is empty. One of the two is required. |
| `STORE_ORIGIN` | Origin of the store (`http://localhost:3002` locally). The panel sends people there to sign in and after signing out. Required. |
| `PANEL_ALLOWED_ORIGINS` | Comma-separated origins that may post a token to `/panel/sesion/` (`http://localhost:3002` locally). Required. |
| `PANEL_TOKEN_MAX_AGE_SECONDS` | The oldest a token may be, counted from when Supabase issued it, when it is handed over (`300` is five minutes). Required. |
| `DJANGO_COOKIE_SECURE` | `True`/`False`. Marks the session and CSRF cookies `Secure`. Optional: on whenever `DJANGO_DEBUG` is off. |
| `DJANGO_COOKIE_HTTPONLY` | `True`/`False`. Hides the session cookie from JavaScript. Optional: `True`. |
| `DJANGO_COOKIE_SAMESITE` | `Lax` or `None` (which needs `Secure`). Optional: `Lax`. `Strict` is refused because it would break the panel handoff. |

Django refuses to start when a required variable is missing or has a value it
cannot use, naming it. The test settings supply their own values for the
`SUPABASE_*`, `STORE_ORIGIN`, `PANEL_*` and `DJANGO_COOKIE_*` variables, so the
tests never depend on what `backend/.env` holds.

## Common commands

```bash
uv run python manage.py check
uv run python manage.py runserver
uv run python manage.py test
uv run ruff check .
uv run ruff format .
scripts/build_panel_css.sh --check   # the panel stylesheet is up to date (needs Docker)
```

`manage.py test` runs on an in-memory SQLite database (see "Tests" below). The
panel stylesheet is built by a script, not by `manage.py`: see "Panel stylesheet".

## Inventory panel

The `inventory` app is the products section of the panel. Its five views are
wrapped in `panel_admin_required`, so only an admin whose session the Supabase
handoff opened gets in (see "Panel session handoff"). There is no Django login
for them: an admin signs in at the store and the store hands the session over,
and `/admin/login/` opens the Django admin site only.

| Route | Name | View |
| --- | --- | --- |
| `/panel/productos/` | `inventory:list` | `product_list` |
| `/panel/productos/<id>/` | `inventory:detail` | `product_detail` |
| `/panel/productos/nuevo/` | `inventory:create` | `product_create` |
| `/panel/productos/<id>/editar/` | `inventory:update` | `product_update` |
| `/panel/productos/<id>/eliminar/` | `inventory:delete` | `product_delete` |

The routes are mounted from `config/urls.py` and not from `panel/urls.py`: an
include inside the `panel` namespace would rename them `panel:inventory:*`, and
the contract (`docs/CONTRATO_PANEL_DJANGO.md`) names them `inventory:*`. They
used to live at `/inventario/`; that address no longer exists and does not
redirect, because the old page is now this one.

`Category` and `Product` mirror the Supabase-owned tables with
`managed = False`, and so do `OrderItem` and `Favorite`, which are read-only
(`save()`, `delete()` and every queryset write raise `ReadOnlyModelError`)
because the panel only counts the rows that point at a product. `CutSpec` is the
only Django-managed table and stores the data the storefront still lacks:
average weight per piece, thickness range, supplier and presentation.

Behaviour worth knowing before touching it:

- The rules below (price confirmation, delete or deactivate, when a cut spec is
  stored) live in `inventory/services.py`. The views only turn what a service
  returns into pages and messages.
- `price_per_lb` is always derived from `price_per_kg`, so it is not editable.
- Changing a price or a minimum quantity shows a before/after confirmation
  before saving.
- Deleting a product that appears in orders deactivates it instead, because
  `order_items.product_id` is `ON DELETE RESTRICT`. An order that arrives
  between the count and the delete is handled the same way: the delete runs in
  a savepoint, and when the database refuses it the product is deactivated
  instead of failing with a server error. When a delete does go through, the
  panel reports how many favorite lists lost the product (`favorites.product_id`
  cascades).
- The Django admin (`inventory/admin.py`) applies the same rules through the
  services. `price_per_lb` is shown read-only. A product whose price or minimum
  quantity changes is not saved until the "Confirmar cambio de precio o
  cantidad mínima" box is ticked (a new product needs none). Deleting products,
  one by one or with the bulk action, deactivates those that have orders and
  shows a warning that names them. Django still adds its own "deleted
  successfully" message and logs a deletion for them, because both come from
  the admin itself and not from `delete_model` or `delete_queryset`.
- The list (`templates/inventory/product_list.html`) is the redesign's
  `admin-products.html`, moved here with `git mv`. It is paginated, 20 per page
  (`PRODUCTS_PER_PAGE` in `inventory/views.py`, using `Paginator.get_page`), with
  a previous and a next control that stay in place, switched off, where there is
  no page to go to. `{% querystring %}` keeps `q` and `category` in the links
  (and drops `page` when the filter changes). A page that is zero, negative or
  past the end falls back to the last page, and a non-numeric one to the first.
- The category chips are links to `?category=<id>` and count every product of
  the category, whatever the search says (`product_count`, an annotation of
  `categories`); "Todas" counts them all (`total_products`). The chip of the
  category being filtered carries `aria-current="true"`, and "Todas" does when
  there is none: that is the `django:active` mark of the chips.
- `Product.unit_label` says what a price is for: "paquete" for a name that
  starts with "Paquete " unless it says "por kilo" (the rule of `unidadDe` in the
  store), "pieza" for the Merch and Otros categories and "kg" for the rest. It is
  PROVISIONAL, pending Eduardo, and `unit_label_for()` in `inventory/models.py`
  is the only place to change it; a `unit` column on `products` (backlog) would
  replace it. Prices over a thousand are grouped (`$1,599.00`).
- The detail (`templates/inventory/product_detail.html`) is the redesign's
  `kit/productos/detalle.html` (`pruebas` `ab47cbb8`). The price shows with its
  unit and the price per pound only when the price is by the kilo. Eliminar and
  desactivar are one route (`inventory:delete`): that page says which of the two
  will happen, and the button of the detail names both.
- `Product.image_src` is the picture as an address the panel can load.
  `image_url` is a path of the store (`/img/products/tomahawk.webp`), which Django
  does not serve, so `store_image_url()` joins it to `STORE_ORIGIN`. An absolute
  http(s) address is kept and anything else (`javascript:`, `data:`) is no
  picture at all.
- `price_per_lb_for()` in `inventory/models.py` holds the price-per-lb formula
  that `Product.save()` uses. Code that creates products with `bulk_create()`
  skips `save()`, so it has to call the function itself.

### EBAC practice M13 — where each requirement lives

| Requirement | File |
| --- | --- |
| New attributes on the product model | `inventory/models.py` (`CutSpec`: weight per piece, thickness min/max/default, supplier, presentation, notes) |
| Migrations created and applied | `inventory/migrations/0001_initial.py` (only `CutSpec`; the mirrored tables emit no DDL) and `0002_favorite_orderitem.py` (state only: the two read-only mirrors, no DDL) |
| Admin registration | `inventory/admin.py` (product with the spec as an inline, plus the panel's rules through `inventory/services.py`) |
| list-view | `inventory/views.py::product_list` + `templates/inventory/product_list.html` |
| detail-view | `inventory/views.py::product_detail` + `templates/inventory/product_detail.html` |
| create-view | `inventory/views.py::product_create` + `templates/inventory/product_form.html` |
| update-view | `inventory/views.py::product_update` + `product_form.html`, `product_confirm_price_change.html` |
| delete-view | `inventory/views.py::product_delete` + `templates/inventory/product_confirm_delete.html` |
| URLs | `inventory/urls.py` (namespace `inventory`), mounted in `config/urls.py` at `/panel/productos/` |
| Forms | `inventory/forms.py` (`ProductForm`, `CutSpecForm`) |
| Search and protection | `Q` filter in `product_list`; `panel_admin_required` on the five views (it replaced `login_required` and `LOGIN_URL` when the views moved under `/panel/productos/`) |

### EBAC practice M14 — Django Models & Admin

The assigned practice (500 bulk-created products, fixture, admin) lives in the
course-only app `ecommerce/`: see [`ecommerce/README.md`](ecommerce/README.md).
Its adaptation to the store is the paginated product list and the test suite
described in "Tests".

## Panel session handoff

The panel is served by Django, but nobody signs in to Django: an admin signs in
to Supabase at the store and the store hands the session over (see
`docs/CONTRATO_PANEL_DJANGO.md`, section 5b). The `panel` app owns that.

| Route | Name | What it does |
| --- | --- | --- |
| `POST /panel/sesion/` | `panel:sesion` | Takes the Supabase access token from the body, checks it and opens a Django session. |
| `GET /panel/acceso/` | `panel:acceso` | Where anonymous visitors land: sends them to the store login. |
| `POST /panel/salir/` | `panel:salir` | Ends the session and sends the person to the store login. Works for any session, behind Django's CSRF check. |
| `GET /panel/` | `panel:inicio` | Landing page, admins only. Until the dashboard exists it forwards to the products. |
| `GET /panel/mas/` | `panel:mas` | The "Más" page of the phone layout: Clientes, Publicidad, Ajustes and the sign-out. Admins only. |

`/panel/sesion/` checks the following, in this order. Whatever fails, the
browser gets the same plain 403 and the reason (never the token) goes to the
server log under the `panel` logger.

1. The `Origin` header is one of `PANEL_ALLOWED_ORIGINS`. A missing or `null`
   origin is refused.
2. The token comes in the body of the POST. One in the URL is refused.
3. The signature, checked with the keys the project publishes
   (`SUPABASE_JWKS_URL`) or with the shared secret (`SUPABASE_JWT_SECRET`):
   never both, and never the one the token asks for, so a token signed with the
   other kind of key is refused. Then the expiry, `aud = authenticated`, the
   issuer, and an age under `PANEL_TOKEN_MAX_AGE_SECONDS`.
4. `public.profiles.role = 'admin'` for the user the token names.
5. The Django user for that Supabase user is active.

Then Django logs that user in and redirects to `/panel/`.

Behaviour worth knowing before touching it:

- The Django user is created on the first handoff. Its username is the Supabase
  user id, its password is unusable (Django never stores or checks one) and it
  is neither staff nor superuser, so it does not reach `/admin/`. Panel access
  can be revoked from Django by deactivating that user.
- `panel/access.py` marks the session the handoff opens, and
  `panel_admin_required` only lets a session with that mark in. A Django user
  made some other way (`createsuperuser`, the admin site) is not a panel admin.
  The decorator also reads `profiles.role` on every request, so demoting an
  admin in Supabase ends their panel access on the next click, and it closes
  that session instead of leaving it open. A test fails when a route mounted
  under `/panel/` is neither guarded nor listed as public; it walks the root
  URLconf, so it covers the products (`/panel/productos/`) as well as the routes
  of the `panel` app.
- `panel:salir` is the one panel route that is not behind the decorator, so that
  an admin whose role was just revoked can still sign out. It ends the Django
  session only: the Supabase one lives in the store's browser storage, so the
  store has to sign out of Supabase as well.
- The view is `csrf_exempt` because the form that posts to it lives on the
  store, another origin, which cannot read Django's CSRF token. The origin
  allow-list and the token itself stand in for it.
- With `Referrer-Policy: no-referrer` (or `same-origin` for a cross-origin POST)
  browsers send `Origin: null` on form POSTs. So the store page that posts the
  token has to keep a policy that leaves the origin in (`strict-origin`, or the
  `strict-origin-when-cross-origin` that `netlify.toml` sends today), or every
  handoff is refused. The same applies to Django itself: its answers send
  `Referrer-Policy: same-origin`, not `no-referrer`, because `Origin: null` on
  the panel's own POSTs fails Django's CSRF check (a null origin is refused) and
  the logout, the product forms and the admin would stop working.
- The session cookie is `HttpOnly` and `SameSite=Lax`, lasts eight hours without
  sliding, and is `Secure` whenever `DJANGO_DEBUG` is off. There is no
  Content-Security-Policy yet: it arrives with `panel/base.html`, whose scripts
  and styles decide what it has to allow.
- `Profile` (`panel/models.py`) is a read-only mirror of `public.profiles`
  with only `id` and `role`, the columns the `django` Postgres role may read
  (`supabase/migrations/20261007042348_grant_django_profiles_select.sql`, which
  also hides every non-admin row from that role). Apply the migration with
  `supabase migration up`; never with `db reset`, which wipes the local data.
- Local values for `backend/.env`: `SUPABASE_URL=http://127.0.0.1:54321`,
  `SUPABASE_JWT_SECRET=<JWT_SECRET from supabase status -o env>`,
  `STORE_ORIGIN=http://localhost:3002`,
  `PANEL_ALLOWED_ORIGINS=http://localhost:3002` and
  `PANEL_TOKEN_MAX_AGE_SECONDS=300`.

## Panel frame

Every page of the panel extends `templates/panel/base.html`: the sidebar from
1024 px, the tab bar below it, the top bar and `<main>`. It is `dashboar.html` as
the redesign delivered it (`pruebas` `3254d3b4`), moved here with `git mv`; the
Inicio content that file also held is `panel/inicio.html`. The store's root no
longer has a `dashboar.html`.

| Block | What a page puts in it |
| --- | --- |
| `title` | The whole `<title>` element. |
| `titulo` | The text of the `<h1>` in the top bar. |
| `accion` | The button on the right of the top bar, when the page has one. |
| `contenido` | The page itself. |

- No JavaScript and no inline styles anywhere in the panel: a link or a form is
  all the interaction there is. A test fails when a panel page gets a `<script>`,
  a `<style>` or a `style=` attribute.
- The current entry of both navigations gets `aria-current`. It is read from
  `request.resolver_match`: `view_name` is `namespace:name` and `section` is the
  namespace, so every route of the `inventory` namespace marks Productos. "Más"
  is `page` on `panel:mas` and `true` on `panel:ads` and `settings:index`, which
  live inside it on the phone. `panel/test_frame.py` pins the whole table.
- Pedidos, Clientes, Publicidad and Ajustes have no route yet (backlog), so the
  frame links them by their path from the contract and they answer 404 today.
  `PENDING_PATHS` in `panel/test_frame.py` lists them; the day one of them
  resolves, that test fails and the literal link becomes a url tag in
  `panel/base.html` and `panel/mas.html`.
- `store_origin` (`panel/context_processors.py`) is `STORE_ORIGIN`. The logo and
  the product pictures are files of the store, not of Django, so a template links
  them as `{{ store_origin }}/img/...`.
- `panel/messages.html` draws the messages the previous request queued: a check
  for success, a sand triangle for a warning and a red one for an error.
- A stylesheet class that only appears in Python (a form widget's `attrs`) is not
  seen by Tailwind: see "Things to know" below.

## Panel stylesheet (Tailwind v4)

The panel is styled with Tailwind v4 from the same design tokens as the store.
Django has no Node, so one script compiles the stylesheet inside Docker and the
result is committed.

| Path | What it is |
| --- | --- |
| `assets/tokens.css` | Byte-identical copy of `src/styles/tokens.css` on `pruebas` (contract S1): the one `@theme` that the store and the panel share. Never edited here. |
| `assets/panel.css` | The Tailwind entry: imports Tailwind and the tokens, scans `templates/` for classes and declares the `@font-face` rules. Sources only. |
| `static/panel/panel.css` | The compiled, minified output. Built by the script, committed, and served by `staticfiles` as `panel/panel.css`. |
| `static/panel/fonts/` | The self-hosted woff2 files, each with its SIL OFL license next to it. |
| `scripts/build_panel_css.sh` | Drift check, build and `--check`. |

`STATICFILES_DIRS` is `[BASE_DIR / "static"]`. `assets/` is left out on purpose,
so `collectstatic` and `runserver` never publish the sources. `panel/base.html`
links the stylesheet with `{% static 'panel/panel.css' %}`.

`assets/panel.css` also carries the base layer of the panel pages (page
background and type, the heading font, the selection colour and the sand focus
ring). It is the one in `src/styles/panel.css` on `pruebas`, copied here because
that file gets its fonts from npm packages Django does not have: the
`@font-face` rules replace those imports. When the redesign changes its base
layer, it says so like it does for `tokens.css` (Engram `frontend/entrega/tokens`)
and the block here follows.

### Build and check

Run it from any directory, with Docker running and access to the npm registry
(the CLI is installed on every run; nothing runs `npm` on the host):

```bash
backend/scripts/build_panel_css.sh                  # drift check, then build
backend/scripts/build_panel_css.sh --check          # fail when the committed CSS is stale
backend/scripts/build_panel_css.sh --sync-tokens    # take tokens.css from origin/pruebas, then build
```

Every run starts with `git fetch origin pruebas` (skip it with
`PANEL_CSS_NO_FETCH=1` when offline) and a drift check. It fails when:

- the sha256 of `assets/tokens.css` differs from `src/styles/tokens.css` on
  `origin/pruebas`;
- the Tailwind version pinned at the top of the script, or one of the two font
  versions, differs from what `package-lock.json` locks on `origin/pruebas`: the
  panel has to compile with the store's Tailwind and ship the store's font files.

Then it compiles into a temp directory. A plain run copies the result over
`static/panel/panel.css`; `--check` changes nothing and fails when the committed
file is not what the sources build. The output is byte-identical across runs and
between `linux/arm64` and `linux/amd64`, so the check also holds on other
machines and CI. The CLI's own dependencies are not locked, but the two that
decide the output (`@tailwindcss/oxide` and `lightningcss`) are pinned by
Tailwind itself.

The Docker command it runs, so a failure can be reproduced by hand:

```bash
docker compose -f .devcontainer/docker-compose.yml run --rm -T \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
  -v "$OUT_DIR:/out" --workdir /tmp \
  app sh -euc "$CONTAINER_SCRIPT" sh 4.3.3
```

`$OUT_DIR` is an empty temp directory that receives `panel.css`, and
`$CONTAINER_SCRIPT` is the script's own text (the heredoc at the top of
`build_panel_css.sh`). Inside the container it copies `backend/` (without
`.venv`, `.env` and the caches) to `/tmp`, installs `tailwindcss@4.3.3` and
`@tailwindcss/cli@4.3.3` there with install scripts off, and compiles
`assets/panel.css` with `--minify`. The copy exists because the CLI looks for
`tailwindcss` from the folder of the CSS file it compiles, and the repo has no
`node_modules`. The first run builds the `.devcontainer` image if it is missing.

### When the redesign changes the tokens

`src/styles/tokens.css` belongs to the redesign. The backend never edits its
copy; it resyncs it:

1. `backend/scripts/build_panel_css.sh --sync-tokens` fetches `origin/pruebas`,
   copies the file byte for byte and rebuilds.
2. `uv run python manage.py test panel.test_stylesheet` (from `backend/`).
3. Commit `assets/tokens.css` and `static/panel/panel.css` together.

Until that is done, every run of the script reports the drift and `--check`
fails. The same applies to a Tailwind or font version the store bumps: the
script says which pin moved.

### Fonts

| Family | Package | Files |
| --- | --- | --- |
| `Geist Variable` (`wght` axis) | `@fontsource-variable/geist` 5.3.0 | `static/panel/fonts/geist/geist-latin-wght-normal.woff2` and `LICENSE` |
| `Fraunces Variable` (`opsz` and `wght` axes) | `@fontsource-variable/fraunces` 5.3.0, `opsz.css` | `static/panel/fonts/fraunces/fraunces-latin-opsz-normal.woff2` and `LICENSE` |

They are the packages, versions and axes that `src/styles/fuentes.ts` imports in
the store. The woff2 files and the licenses come from the npm tarballs
(`npm pack @fontsource-variable/<name>@<version>`, run in the same Docker
service), after checking each tarball's sha512 against the `integrity` that the
store's `package-lock.json` records. The `@font-face` blocks in
`assets/panel.css` are Fontsource's own, with `font-display: swap` and the
`unicode-range` of the `latin` subset, and only their `url()` changed. That
subset covers Spanish; a character outside it falls back to the system font. To
add a subset (for example `latin-ext`) or to refresh the files after the script
reports a font drift, copy the file and the new `@font-face` block from the same
package version and rebuild.

### Things to know

- `assets/panel.css` imports the tokens with `theme(static)`, so the build emits
  every token as a custom property on `:root`, not only the ones a utility uses.
  A template can read `var(--color-sand)` from its own CSS.
- Tailwind only scans `templates/`. A class that lives anywhere else (a form
  widget's `attrs`, a message tag in Python, a template inside an app) is not
  seen; add an `@source` line to `assets/panel.css` for it.
- The `url()` paths in `assets/panel.css` are relative to the compiled file
  (`static/panel/`), not to the source.
- Do not edit `static/panel/panel.css` by hand: `--check` fails and the next
  build overwrites it.
- The M13 templates define their own `--color-*` custom properties in an inline
  `<style>`, with names that collide with the tokens. Do not link `panel.css`
  from them; `panel/base.html` replaces them (B15). Meanwhile Tailwind also emits
  a few utilities for plain words it finds in them (`block`, `table`, `border`).

## Tests

```bash
uv run python manage.py test
```

`manage.py test` uses `config/settings_test.py` (an in-memory SQLite database),
even when `DJANGO_SETTINGS_MODULE` is exported in your shell. Only an explicit
`--settings X` or `--settings=X` overrides it; do not point it at
`config.settings`, because the `django` role cannot create a test database in
Postgres. `Category`, `Product`, `OrderItem`, `Favorite` and `Profile` are
unmanaged mirrors of Supabase tables, so `config/test_runner.py` sets
`managed = True` on them only while the tests run, which makes Django create
their tables in the test database. The test settings import the regular ones, so
the Django secret key and the `POSTGRES_*` variables of `backend/.env` must be
set even though the tests run on SQLite.

`panel/tests.py` covers the token check (in both key modes), the handoff, the
access bridge, the guard of the panel views, the logout and the cookie flags and
headers, and `config/tests.py` the parsers of the environment variables. The test settings set the panel's
configuration themselves, with a signing secret that is random on every run.

`inventory/tests.py` covers `price_per_lb_for()`, the unit of a price, the
pagination and the list page (rows, chips, search, empty state and a query count
that does not grow with the products), the detail page, the picture address, the
panel views and their routes, the
rules in `inventory/services.py`, the read-only mirrors and the product admin
(through the test client, as a superuser). The
panel views are tested signed in the way a real admin signs in, through the
handoff (`sign_in_as_panel_admin` in `panel/tests.py`), so the guard is never
skipped. Those mirrors refuse writes from Django, so the tests add their rows
with raw SQL, the way Supabase does. It starts from the fixture
`inventory/fixtures/categories.json`, the 9 real categories dumped with
`dumpdata inventory.Category`. The `config.E001` system check only runs against
Postgres; other databases have no `django` schema to verify.

`panel/test_frame.py` covers the frame: the Más page through the panel admin
session, which entry of both navigations is current for every route of the
contract, the links the frame still owes to missing routes, the messages partial
and the `store_origin` context processor.

`panel/test_stylesheet.py` covers the static files of the panel: the finders
serve the stylesheet, both woff2 files and their licenses, and do not serve the
Tailwind sources in `assets/`; the compiled CSS declares every custom property of
`assets/tokens.css` (and the same colours and font stacks), both `@font-face`
families with `font-display: swap`, no `@import` and no remote URL, and every
`url()` in it is a file the finders serve. It needs no Docker. Whether the CSS is
up to date with its sources is `build_panel_css.sh --check`, not a test.

## Warning

**Do not run `manage.py migrate`** unless the `django` schema and the Django
database role exist in Supabase (they are created by
`supabase/migrations/20260918235409_django_schema_role.sql`). Running migrate
without that schema would create Django's tables in `public`, colliding with
Supabase-owned tables. The system check `config.E001` stops that.
