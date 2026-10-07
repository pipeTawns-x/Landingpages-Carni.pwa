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

## Tests

```bash
uv run python manage.py test
```

`manage.py test` uses `config/settings_test.py` (an in-memory SQLite database),
even when `DJANGO_SETTINGS_MODULE` is exported in your shell. Only an explicit
`--settings X` or `--settings=X` overrides it; do not point it at
`config.settings`, because the `django` role cannot create a test database in
Postgres. `Category`, `Product`, `OrderItem` and `Favorite` are unmanaged
mirrors of Supabase tables, so `config/test_runner.py` sets `managed = True` on
them only while the tests run, which makes Django create their tables in the
test database. The test settings import the regular ones, so the required
variables (`backend/.env`) must be set even though the tests run on SQLite.

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
