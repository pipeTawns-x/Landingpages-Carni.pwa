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

## Warning

**Do not run `manage.py migrate`** until the `django` schema and the Django
database role exist in Supabase (created in a later step). Running migrate
before that schema exists would create Django's tables in `public`, colliding
with Supabase-owned tables.
