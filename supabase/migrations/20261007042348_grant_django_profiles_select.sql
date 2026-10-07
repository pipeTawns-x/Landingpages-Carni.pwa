-- Migration: 20261007042348_grant_django_profiles_select.sql
-- Description: Read-only access to two columns of public.profiles for the
-- `django` role, and only to the rows of admins.
--
-- Why: the panel session handoff (docs/CONTRATO_PANEL_DJANGO.md, section 5b)
-- verifies a Supabase access token and then asks a single question: is this
-- user an admin? The answer is profiles.role. Django reads `id` and `role`
-- and nothing else on purpose: full_name, phone, address and points are
-- personal data the panel has no use for at this point. Read-only as well:
-- Django never writes to profiles, and an admin is promoted from Supabase.
--
-- The policy shows Django admin rows only. The handoff asks "is this id an
-- admin?", so a customer's row can stay invisible to Django altogether. A
-- future panel page that needs more (a customer list, say) adds its own grant
-- in its own migration instead of widening this one.
--
-- Shared contract: supabase/migrations belongs to both the frontend and the
-- backend sessions. Announced before being committed.

GRANT SELECT (id, role) ON public.profiles TO django;

-- RLS stays enabled on profiles; the django role reads through a policy,
-- never around it.
CREATE POLICY "profiles_django_role_select" ON public.profiles
    FOR SELECT
    TO django
    USING (role = 'admin');
