-- Migration: 20260921112941_grant_django_favorites_select.sql
-- Description: Read-only access to public.favorites for the `django` role.
--
-- Why: favorites.product_id references products.id ON DELETE CASCADE, so
-- deleting a product silently removes it from customers' favorite lists. The
-- inventory panel counts those rows to warn the staff member before deleting,
-- and to report how many were removed afterwards. Read-only on purpose: the
-- panel never writes to favorites.
--
-- Shared contract: supabase/migrations belongs to both the frontend and the
-- backend sessions. Announced before being committed.

GRANT SELECT ON public.favorites TO django;

-- RLS stays enabled on favorites; the django role reads through a policy,
-- never around it.
CREATE POLICY "favorites_django_role_select" ON public.favorites
    FOR SELECT
    TO django
    USING (true);
