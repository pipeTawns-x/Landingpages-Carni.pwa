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
uv run ruff check .
uv run ruff format .
```

## Inventory panel

The `inventory` app is the staff panel for the catalog, served at
`/inventario/` and protected with `login_required` (sign in through
`/admin/login/`). `Category` and `Product` mirror the Supabase-owned tables
with `managed = False`; `CutSpec` is the only Django-managed table and stores
the data the storefront still lacks: average weight per piece, thickness range,
supplier and presentation.

Behaviour worth knowing before touching it:

- `price_per_lb` is always derived from `price_per_kg`, so it is not editable.
- Changing a price or a minimum quantity shows a before/after confirmation
  before saving.
- Deleting a product that appears in orders deactivates it instead, because
  `order_items.product_id` is `ON DELETE RESTRICT`. When a delete does go
  through, the panel reports how many favorite lists lost the product
  (`favorites.product_id` cascades).

### EBAC practice M13 — where each requirement lives

| Requirement | File |
| --- | --- |
| New attributes on the product model | `inventory/models.py` (`CutSpec`: weight per piece, thickness min/max/default, supplier, presentation, notes) |
| Migrations created and applied | `inventory/migrations/0001_initial.py` (only `CutSpec`; the mirrored tables emit no DDL) |
| Admin registration | `inventory/admin.py` (product with the spec as an inline) |
| list-view | `inventory/views.py::product_list` + `templates/inventory/product_list.html` |
| detail-view | `inventory/views.py::product_detail` + `templates/inventory/product_detail.html` |
| create-view | `inventory/views.py::product_create` + `templates/inventory/product_form.html` |
| update-view | `inventory/views.py::product_update` + `product_form.html`, `product_confirm_price_change.html` |
| delete-view | `inventory/views.py::product_delete` + `templates/inventory/product_confirm_delete.html` |
| URLs | `inventory/urls.py` (namespace `inventory`), mounted in `config/urls.py` |
| Forms | `inventory/forms.py` (`ProductForm`, `CutSpecForm`) |
| Search and protection | `Q` filter in `product_list`; `login_required` on the five views, `LOGIN_URL` in `config/settings.py` |

## Warning

**Do not run `manage.py migrate`** unless the `django` schema and the Django
database role exist in Supabase (they are created by
`supabase/migrations/20260918235409_django_schema_role.sql`). Running migrate
without that schema would create Django's tables in `public`, colliding with
Supabase-owned tables. The system check `config.E001` stops that.
