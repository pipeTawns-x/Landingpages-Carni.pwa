-- Scaffold of a Supabase project: just what the 9 base migrations expect to find.
--
-- Run as supabase_admin on a brand-new database (comercio_v1_test), before the
-- base migrations. correr.sh is the only caller. It never runs against `postgres`.
--
-- Why it exists: a new database in the local cluster has none of the pieces the
-- Supabase stack installs in `postgres` (auth schema, extensions schema, default
-- privileges). They are per database, so they are rebuilt here from what the
-- local container really has (read from pg_default_acl, pg_namespace and
-- auth.uid() in the development database).

-- Extensions live in their own schema, as in a real project. pgTAP is only for tests.
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION postgres;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role, django;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- auth: users table and auth.uid(), same body as the real one.
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_admin;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, supabase_auth_admin, postgres;
GRANT CREATE ON SCHEMA auth TO supabase_auth_admin;

CREATE TABLE auth.users (
    id                 uuid PRIMARY KEY,
    email              text,
    raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE auth.users OWNER TO supabase_auth_admin;
-- In a real project postgres owns nothing in auth but holds every privilege on it.
GRANT ALL ON TABLE auth.users TO postgres;

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
AS $$
    select coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;
ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

-- Default privileges Supabase gives to what postgres creates in public (pg_default_acl).
-- This is why every new table and function is open to anon and authenticated until
-- a migration revokes it.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
