-- Migration: 20260918235409_django_schema_role.sql
-- Description: Django workspace in the shared Postgres: own schema, own role (no
-- password here), minimal grants, and RLS policies so Django goes through RLS
-- instead of bypassing it. The role password is set by a local script that reads
-- backend/.env (never committed, never printed).
--
-- Shared contract: supabase/migrations belongs to both the frontend and the
-- backend sessions. Any change here was announced before being committed.

-- ============================================
-- 1. Schema owned by Django
-- ============================================
CREATE SCHEMA django;

-- ============================================
-- 2. Role for Django (LOGIN enabled by the password script, never here)
-- ============================================
-- The password is set later with: ALTER ROLE django LOGIN PASSWORD '...'
-- by backend/scripts/set_django_role_password.sh (reads backend/.env).
CREATE ROLE django NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

-- ============================================
-- 3. Grants
-- ============================================
-- On the django schema: Django creates its own tables there.
GRANT USAGE, CREATE ON SCHEMA django TO django;

-- USAGE on public is required to reach the shared tables below.
GRANT USAGE ON SCHEMA public TO django;

-- Shared inventory tables: full CRUD for the Django admin panel.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO django;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO django;

-- Sequences used by the SERIAL columns above.
GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq TO django;
GRANT USAGE, SELECT ON SEQUENCE public.categories_id_seq TO django;

-- order_items is read-only for Django: it checks references before deleting.
GRANT SELECT ON public.order_items TO django;

-- ============================================
-- 4. RLS policies TO the django role (no BYPASSRLS)
-- ============================================
-- RLS stays enabled on these tables (set in 202604100002_rls_policies.sql).
-- The django role is the server-side application role, so its policies grant
-- full access to these shared tables through RLS, never around it.

CREATE POLICY "products_django_role_all" ON public.products
    FOR ALL
    TO django
    USING (true)
    WITH CHECK (true);

CREATE POLICY "categories_django_role_all" ON public.categories
    FOR ALL
    TO django
    USING (true)
    WITH CHECK (true);

CREATE POLICY "order_items_django_role_select" ON public.order_items
    FOR SELECT
    TO django
    USING (true);