# ecommerce — EBAC practice M14 (Django Models & Admin)

The assignment: create 500 sample products in bulk with a loop, dump them to a
fixture, delete the whole queryset and load them back from the fixture.

`ecommerce` is a course-only app with a standalone `Product` model. Its table,
`django.ecommerce_product`, is Django-owned and unrelated to the Supabase
catalog. The store-side changes that came with the practice live in `inventory/`
and are described in [`../README.md`](../README.md). Paths below are relative to
`backend/`, where every command runs.

## Where each requirement lives

| Requirement | File |
| --- | --- |
| 500 products created with a loop | `ecommerce/sample_data.py::build_sample_products` (deterministic names, slugs and prices; explicit slugs) |
| `bulk_create` in batches | `ecommerce/management/commands/create_test_products.py` (`--count` 500, `--batch-size` 100) |
| Fixture | `ecommerce/fixtures/products/500Products.json` (500 objects) |
| Delete the whole queryset | `Product.objects.all().delete()` (see the commands below) |
| Reload with `loaddata` | the same fixture file |
| Admin registration | `ecommerce/admin.py` (list, filter, search, read-only slug and timestamps) |
| Abstract model | `ecommerce/models.py::TimeStampedModel` (`created_at`, `updated_at`), inherited by `Product` |
| Slug generated on save | `ecommerce/signals.py` (`pre_save` receiver; `-2`, `-3`... suffix on duplicates) |
| Migration | `ecommerce/migrations/0001_initial.py` |
| Tests | `ecommerce/tests.py` (`uv run python manage.py test ecommerce`) |

## Commands

In the order of the assignment (run from `backend/`):

```bash
uv run python manage.py migrate ecommerce
uv run python manage.py create_test_products
mkdir -p ecommerce/fixtures/products
uv run python manage.py dumpdata ecommerce --indent 4 --format json > ecommerce/fixtures/products/500Products.json
uv run python manage.py shell -v 0 -c "from ecommerce.models import Product; print(Product.objects.all().delete())"
uv run python manage.py loaddata ecommerce/fixtures/products/500Products.json
```

## Things worth knowing

- Always run `migrate` with the app label. `migrate ecommerce` creates only the
  practice table; see the warning at the end of `../README.md` for a bare
  `migrate`.
- `bulk_create()` does not call `save()` and sends no `pre_save`, so the slug
  signal never runs for the bulk-created products. `sample_data.py` sets every
  slug itself.
- `create_test_products` refuses to run when any slug it would create already
  exists, so a second run never inserts a partial batch. Delete the products
  first (the fifth command above).
- `loaddata` saves rows as they are in the file (`raw=True`): the slug signal
  returns early, and `created_at` and `updated_at` keep the timestamps stored in
  the fixture.
- The names, slugs and prices are deterministic, but the primary keys and the
  timestamps are not: regenerating the fixture produces new ones.

## Removing this app

`ecommerce/` is course material and does not go to `main`. To remove it:

1. Drop its table from any database that has it, while the app is still
   installed: `uv run python manage.py migrate ecommerce zero`.
2. Delete `backend/ecommerce/` (this file goes with it).
3. Delete the `"ecommerce.apps.EcommerceConfig"` entry, and the comment above
   it, from `INSTALLED_APPS` in `config/settings.py`.
4. Delete the "EBAC practice M14 — Django Models & Admin" subsection from
   `backend/README.md`. Its "Tests" section and the inventory notes stay: they
   document the store, not the course.

The `inventory/` changes stay: they are the part of the practice meant for
`main`.
