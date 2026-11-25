-- Test helpers. They exist only in comercio_v1_test: correr.sh installs them (as
-- supabase_admin) after the migrations, and never as part of a migration.
--
-- Pattern used by the tests:
--   * fixtures are built as supabase_admin (superuser: no RLS, no GRANT in the way);
--   * the behaviour under test runs under SET LOCAL ROLE through t.as_*();
--   * a rejected call is captured with t.code(), which runs it in a sub-transaction
--     so the failed statement leaves no trace, and returns the business code
--     ("insufficient_stock") or the SQLSTATE ("42501");
--   * every test file is BEGIN ... ROLLBACK, so nothing survives a file.

DROP SCHEMA IF EXISTS t CASCADE;
CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO PUBLIC;

-- ---------------------------------------------------------------- roles
-- SET LOCAL ROLE lasts until the end of the transaction. It is checked against the
-- session user (a superuser), so it also works while another test role is active.
CREATE FUNCTION t.as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', '', true);
    SET LOCAL ROLE anon;
END $$;

CREATE FUNCTION t.as_user(p_uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.jwt.claims',
        jsonb_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
END $$;

CREATE FUNCTION t.as_django() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', '', true);
    SET LOCAL ROLE django;
END $$;

CREATE FUNCTION t.reset() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- ---------------------------------------------------------------- errors
-- '' when the statement succeeds; the business code for RAISE EXCEPTION '<code>: ...';
-- the SQLSTATE for anything else (42501 permission, 23514 check, 23505 unique ...).
CREATE FUNCTION t.code(p_sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v_state text;
    v_msg   text;
BEGIN
    EXECUTE p_sql;
    RETURN '';
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_msg = MESSAGE_TEXT;
    IF v_state = 'P0001' THEN
        RETURN split_part(v_msg, ':', 1);
    END IF;
    RETURN v_state;
END $$;

-- Full message of the failure, for tests that check the detail after the code.
CREATE FUNCTION t.msg(p_sql text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE p_sql;
    RETURN '';
EXCEPTION WHEN OTHERS THEN
    RETURN SQLERRM;
END $$;

-- ---------------------------------------------------------------- shapes
-- 'numeric(10,3)|NOT NULL|0' : type, nullability and default of a public column.
-- NULL when the column does not exist.
CREATE FUNCTION t.col(p_table text, p_col text) RETURNS text LANGUAGE sql STABLE AS $$
    SELECT format_type(a.atttypid, a.atttypmod)
           || '|' || CASE WHEN a.attnotnull THEN 'NOT NULL' ELSE 'NULL' END
           || '|' || coalesce(pg_get_expr(d.adbin, d.adrelid), '')
    FROM pg_attribute a
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = ('public.' || p_table)::regclass
      AND a.attname = p_col
      AND NOT a.attisdropped
$$;

-- Does a function of public hold EXECUTE for a role?  t.can('anon', 'quote_line(integer,text,numeric,text,numeric,text)')
CREATE FUNCTION t.can_exec(p_role text, p_sig text) RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT has_function_privilege(p_role, ('public.' || p_sig)::regprocedure, 'EXECUTE')
$$;

-- ---------------------------------------------------------------- fixtures
-- A customer or an admin. The auth.users trigger creates the profile.
CREATE FUNCTION t.mk_user(p_id uuid, p_name text, p_admin boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (p_id, p_name || '@test.local', jsonb_build_object('full_name', p_name));
    IF p_admin THEN
        UPDATE public.profiles SET role = 'admin' WHERE id = p_id;
    END IF;
    RETURN p_id;
END $$;

-- A product with explicit id (ids 9000+ never collide with the seed).
CREATE FUNCTION t.mk_product(
    p_id int, p_name text, p_price numeric,
    p_price_unit text DEFAULT 'kg',
    p_modes text[] DEFAULT ARRAY['money','weight'],
    p_stock numeric DEFAULT 0,
    p_track boolean DEFAULT false,
    p_stock_unit text DEFAULT 'kg',
    p_min_kg numeric DEFAULT 0,
    p_category text DEFAULT 'carnes-rojas'
) RETURNS int LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO public.products
        (id, category_id, name, price_per_kg, price_per_lb, stock, min_quantity_kg, is_active,
         price_unit, sale_modes, stock_unit, track_stock)
    VALUES
        (p_id, (SELECT id FROM public.categories WHERE slug = p_category), p_name,
         p_price, round(p_price * 0.45359237, 2), p_stock, p_min_kg, true,
         p_price_unit, p_modes, p_stock_unit, p_track);
    RETURN p_id;
END $$;

CREATE FUNCTION t.mk_cutspec(
    p_product int, p_avg numeric, p_min numeric DEFAULT NULL, p_max numeric DEFAULT NULL,
    p_default numeric DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO public.product_cut_specs
        (product_id, avg_piece_weight_kg, thickness_min_in, thickness_max_in, thickness_default_in)
    VALUES (p_product, p_avg, p_min, p_max, p_default);
END $$;

-- The only exchange rate in the table, p_age_days old (Mexico City date).
CREATE FUNCTION t.set_fx(
    p_age_days int, p_rate numeric DEFAULT 18.61, p_buffer numeric DEFAULT 2.00,
    p_source text DEFAULT 'manual'
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM public.fx_rates;
    INSERT INTO public.fx_rates (rate, buffer_pct, source, fetched_on)
    VALUES (p_rate, p_buffer, p_source,
            (now() AT TIME ZONE 'America/Mexico_City')::date - p_age_days);
END $$;

-- ---------------------------------------------------------------- probes
-- Rows a role really sees in a public table or view (RLS applies). Raises 42501 when
-- the role holds no SELECT on it, which t.code() turns into '42501'.
CREATE FUNCTION t.n(p_table text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE
    v bigint;
BEGIN
    EXECUTE format('SELECT count(*) FROM public.%I', p_table) INTO v;
    RETURN v;
END $$;

-- The table privileges a role holds, in a fixed order: 'SELECT,INSERT'. '' for none.
CREATE FUNCTION t.privs(p_role text, p_table text) RETURNS text LANGUAGE sql STABLE AS $$
    SELECT coalesce(string_agg(v.p, ',' ORDER BY v.ord), '')
    FROM (VALUES (1, 'SELECT'), (2, 'INSERT'), (3, 'UPDATE'), (4, 'DELETE'),
                 (5, 'TRUNCATE'), (6, 'REFERENCES'), (7, 'TRIGGER')) AS v(ord, p)
    WHERE has_table_privilege(p_role, 'public.' || p_table, v.p)
$$;

-- The sequence privileges a role holds: 'USAGE,SELECT,UPDATE' or a subset. '' for none.
CREATE FUNCTION t.seq_privs(p_role text, p_seq text) RETURNS text LANGUAGE sql STABLE AS $$
    SELECT coalesce(string_agg(v.p, ',' ORDER BY v.ord), '')
    FROM (VALUES (1, 'USAGE'), (2, 'SELECT'), (3, 'UPDATE')) AS v(ord, p)
    WHERE has_sequence_privilege(p_role, 'public.' || p_seq, v.p)
$$;
