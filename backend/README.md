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
```

`manage.py test` runs on an in-memory SQLite database (see "Tests" below).

## Inventory panel

The `inventory` app is the staff panel for the catalog, served at
`/inventario/` and protected with `login_required` (sign in through
`/admin/login/`). `Category` and `Product` mirror the Supabase-owned tables
with `managed = False`, and so do `OrderItem` and `Favorite`, which are
read-only (`save()`, `delete()` and every queryset write raise
`ReadOnlyModelError`) because the panel only counts the rows that point at a
product. `CutSpec` is the only Django-managed table and stores the data the
storefront still lacks: average weight per piece, thickness range, supplier and
presentation.

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
- The list is paginated, 25 per page (`PRODUCTS_PER_PAGE` in
  `inventory/views.py`, using `Paginator.get_page`). `{% querystring %}` keeps
  `q` and `category` in the page links. A page that is zero, negative or past
  the end falls back to the last page, and a non-numeric one to the first.
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
| URLs | `inventory/urls.py` (namespace `inventory`), mounted in `config/urls.py` |
| Forms | `inventory/forms.py` (`ProductForm`, `CutSpecForm`) |
| Search and protection | `Q` filter in `product_list`; `login_required` on the five views, `LOGIN_URL` in `config/settings.py` |

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
  that session instead of leaving it open. A test fails when a panel route is
  neither guarded nor listed as public. The inventory views still use
  `login_required` (any Django user) until they are mounted under
  `/panel/productos/`; that move is where they should switch to this decorator.
- `panel:salir` is the one panel route that is not behind the decorator, so that
  an admin whose role was just revoked can still sign out. It ends the Django
  session only: the Supabase one lives in the store's browser storage, so the
  store has to sign out of Supabase as well.
- The view is `csrf_exempt` because the form that posts to it lives on the
  store, another origin, which cannot read Django's CSRF token. The origin
  allow-list and the token itself stand in for it.
- With `Referrer-Policy: no-referrer` (or `same-origin` for a cross-origin POST)
  browsers send `Origin: null` on form POSTs. So the store page that posts the
  token must send `strict-origin`, which hides the path and keeps the origin, or
  every handoff is refused. The same applies to Django itself: its answers send
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

`inventory/tests.py` covers `price_per_lb_for()`, the pagination, the staff
views, the rules in `inventory/services.py`, the read-only mirrors and the
product admin (through the test client, as a superuser). Those mirrors refuse
writes from Django, so the tests add their rows with raw SQL, the way Supabase
does. It starts from the fixture
`inventory/fixtures/categories.json`, the 9 real categories dumped with
`dumpdata inventory.Category`. The `config.E001` system check only runs against
Postgres; other databases have no `django` schema to verify.

## Warning

**Do not run `manage.py migrate`** unless the `django` schema and the Django
database role exist in Supabase (they are created by
`supabase/migrations/20260918235409_django_schema_role.sql`). Running migrate
without that schema would create Django's tables in `public`, colliding with
Supabase-owned tables. The system check `config.E001` stops that.
