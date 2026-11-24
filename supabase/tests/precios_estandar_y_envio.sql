-- precios_estandar_y_envio (migration 20261124000001_precios_estandar_y_envio.sql): standard sizes per
-- product and delivery zones by distance (S13, T7a of odd/tasks/rediseno-moderno.md).
--
-- WRITTEN, NOT RUN. Nobody has applied the migration or run this file against any database, so no
-- assertion below has been observed passing or failing. Eduardo runs it, on the work database only
-- (comercio_v1_test, see correr.sh) and never on the shared or the remote project.
--
-- Covers, as supabase_admin (fixtures), anon, a signed-in customer who is not an admin, an admin
-- and the django role:
--   * the shape of both tables (types, defaults), RLS enabled, the three policies each;
--   * the table and sequence privileges of every role;
--   * what each role sees and what each may write (anon: nothing; customer: active rows only and
--     no write; admin and django: everything);
--   * every constraint: unique (product, grams), grams range, the four rounding steps, zone range,
--     negative start or fee, a NaN start, end or fee, the name length, the exclusion of overlapping
--     active zones (touching at the border is fine, an inactive zone may overlap), the foreign key
--     and its ON DELETE CASCADE;
--   * the writes that fail quietly or loudly: a customer's UPDATE and DELETE touch 0 rows without
--     an error, anon's get 42501, and `nextval` of both identity sequences is 42501 for anon and
--     allowed for a customer and for django.
--
-- Needs the helpers of ayudas.sql, the comercio-v1 migrations and this migration. Products
-- (ids 9000+): 9501 Rib Eye CAB 779/kg sold by pieces, 9503 a throwaway product for the cascade.
--
-- Wiring with correr.sh: the file is named after the migration without its timestamp, which is
-- how `prueba_de` finds it, and the migration ends with a `-- DOWN` block (the two DROP TABLE,
-- delivery_zones first), which is what the runner proves (apply, revert, apply).

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_user('00000000-0000-0000-0000-0000000000e1', 'Duena', true);
SELECT t.mk_user('00000000-0000-0000-0000-0000000000e2', 'Cliente Ajeno');
SELECT t.mk_product(9501, 'Rib Eye CAB', 779, 'kg', ARRAY['money', 'weight', 'pieces']);

-- One active and one inactive size; one active and one inactive zone.
INSERT INTO public.product_sizes (product_id, grams, is_active)
VALUES (9501, 340, true), (9501, 500, false);
INSERT INTO public.delivery_zones (name, from_km, to_km, fee, is_active)
VALUES ('Zona 1', 0, 5.5, 50, true), ('Zona inactiva', 5.5, 11, 90, false);

-- ================================================================ shape
SELECT is(t.col('product_sizes', 'product_id'), 'integer|NOT NULL|', 'product_sizes.product_id is integer NOT NULL');
SELECT is(t.col('product_sizes', 'grams'), 'integer|NOT NULL|', 'product_sizes.grams is integer NOT NULL');
SELECT is(t.col('product_sizes', 'rounding_step'), 'numeric(4,2)|NOT NULL|1.00', 'product_sizes.rounding_step is numeric(4,2) and defaults to 1.00');
SELECT is(t.col('product_sizes', 'is_active'), 'boolean|NOT NULL|true', 'product_sizes.is_active defaults to true');
SELECT is(t.col('product_sizes', 'created_at'), 'timestamp with time zone|NOT NULL|now()', 'product_sizes.created_at is timestamptz and defaults to now()');
SELECT is(t.col('delivery_zones', 'from_km'), 'numeric(5,2)|NOT NULL|', 'delivery_zones.from_km is numeric(5,2) NOT NULL');
SELECT is(t.col('delivery_zones', 'to_km'), 'numeric(5,2)|NOT NULL|', 'delivery_zones.to_km is numeric(5,2) NOT NULL');
SELECT is(t.col('delivery_zones', 'fee'), 'numeric(10,2)|NOT NULL|', 'delivery_zones.fee is numeric(10,2) NOT NULL: money is never a float');
SELECT is(t.col('delivery_zones', 'is_active'), 'boolean|NOT NULL|true', 'delivery_zones.is_active defaults to true');

-- ================================================================ RLS is on, with its policies
SELECT is((SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = 'public.product_sizes'::regclass), true, 'product_sizes has RLS enabled');
SELECT is((SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = 'public.delivery_zones'::regclass), true, 'delivery_zones has RLS enabled');
SELECT is((SELECT array_agg(p.policyname::text ORDER BY p.policyname) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'product_sizes'),
          ARRAY['product_sizes_admin_all', 'product_sizes_django_all', 'product_sizes_select_active'], 'product_sizes has its three policies');
SELECT is((SELECT array_agg(p.policyname::text ORDER BY p.policyname) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'delivery_zones'),
          ARRAY['delivery_zones_admin_all', 'delivery_zones_django_all', 'delivery_zones_select_active'], 'delivery_zones has its three policies');

-- ================================================================ privileges
SELECT is(t.privs('anon', 'product_sizes'), 'SELECT', 'anon only reads product_sizes');
SELECT is(t.privs('anon', 'delivery_zones'), 'SELECT', 'anon only reads delivery_zones');
SELECT is(t.privs('authenticated', 'product_sizes'), 'SELECT,INSERT,UPDATE,DELETE', 'authenticated holds the four DML privileges on product_sizes (the policy gates them)');
SELECT is(t.privs('authenticated', 'delivery_zones'), 'SELECT,INSERT,UPDATE,DELETE', 'authenticated holds the four DML privileges on delivery_zones (the policy gates them)');
SELECT is(t.privs('django', 'product_sizes'), 'SELECT,INSERT,UPDATE,DELETE', 'django has the four DML privileges on product_sizes and no TRUNCATE');
SELECT is(t.privs('django', 'delivery_zones'), 'SELECT,INSERT,UPDATE,DELETE', 'django has the four DML privileges on delivery_zones and no TRUNCATE');
SELECT is(t.seq_privs('anon', 'product_sizes_id_seq'), '', 'anon has nothing on the product_sizes sequence');
SELECT is(t.seq_privs('anon', 'delivery_zones_id_seq'), '', 'anon has nothing on the delivery_zones sequence');
SELECT is(t.seq_privs('authenticated', 'product_sizes_id_seq'), 'USAGE,SELECT', 'authenticated may use the product_sizes sequence');
SELECT is(t.seq_privs('django', 'delivery_zones_id_seq'), 'USAGE,SELECT', 'django may use the delivery_zones sequence');

-- ================================================================ anon: reads the active rows, writes nothing
SELECT t.as_anon();
SELECT is(t.n('product_sizes'), 1::bigint, 'anon sees only the active size');
SELECT is(t.n('delivery_zones'), 1::bigint, 'anon sees only the active zone');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams) VALUES (9501, 700)$$), '42501', 'anon cannot insert a size');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('X', 11, 16, 160)$$), '42501', 'anon cannot insert a zone');
SELECT is(t.code($$UPDATE public.product_sizes SET grams = 1$$), '42501', 'anon cannot update a size');
SELECT is(t.code($$DELETE FROM public.delivery_zones$$), '42501', 'anon cannot delete a zone');
SELECT is(t.code($$UPDATE public.delivery_zones SET fee = 1$$), '42501', 'anon cannot update a zone');
SELECT is(t.code($$DELETE FROM public.product_sizes$$), '42501', 'anon cannot delete a size');
-- The identity sequences carry no privilege for anon (F-28): `nextval` needs USAGE.
SELECT is(t.code($$SELECT nextval('public.product_sizes_id_seq')$$), '42501', 'anon cannot advance the product_sizes sequence');
SELECT is(t.code($$SELECT nextval('public.delivery_zones_id_seq')$$), '42501', 'anon cannot advance the delivery_zones sequence');
SELECT t.reset();

-- ================================================================ another user (signed in, not an admin)
SELECT t.as_user('00000000-0000-0000-0000-0000000000e2');
SELECT is(t.n('product_sizes'), 1::bigint, 'a customer sees only the active size');
SELECT is(t.n('delivery_zones'), 1::bigint, 'a customer sees only the active zone');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams) VALUES (9501, 700)$$), '42501', 'a customer cannot insert a size (row-level security)');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('X', 11, 16, 160)$$), '42501', 'a customer cannot insert a zone (row-level security)');
-- UPDATE and DELETE are not errors under RLS: the rows are simply not there for the customer.
WITH u AS (UPDATE public.product_sizes SET grams = 999 WHERE product_id = 9501 RETURNING 1) SELECT count(*) AS n FROM u \gset ajeno_upd_
WITH d AS (DELETE FROM public.delivery_zones RETURNING 1) SELECT count(*) AS n FROM d \gset ajeno_del_
-- The crossed pair: UPDATE of a zone and DELETE of a size, each also 0 rows and no error.
WITH u AS (UPDATE public.delivery_zones SET fee = 1 RETURNING 1) SELECT count(*) AS n FROM u \gset ajeno_zupd_
WITH d AS (DELETE FROM public.product_sizes RETURNING 1) SELECT count(*) AS n FROM d \gset ajeno_sdel_
-- A customer holds USAGE on the identity sequences (the grant), so this does not fail.
SELECT is(t.code($$SELECT nextval('public.product_sizes_id_seq')$$), '', 'a customer may advance the product_sizes sequence (USAGE is granted)');
SELECT is(t.code($$SELECT nextval('public.delivery_zones_id_seq')$$), '', 'a customer may advance the delivery_zones sequence (USAGE is granted)');
SELECT t.reset();
SELECT is(:ajeno_upd_n::bigint, 0::bigint, 'a customer updates no size');
SELECT is(:ajeno_del_n::bigint, 0::bigint, 'a customer deletes no zone');
SELECT is(:ajeno_zupd_n::bigint, 0::bigint, 'a customer updates no zone');
SELECT is(:ajeno_sdel_n::bigint, 0::bigint, 'a customer deletes no size');
SELECT is((SELECT count(*) FROM public.product_sizes WHERE grams = 999), 0::bigint, 'the customer update changed nothing');
SELECT is((SELECT count(*) FROM public.delivery_zones), 2::bigint, 'the customer delete removed nothing');
SELECT is((SELECT count(*) FROM public.delivery_zones WHERE fee = 1), 0::bigint, 'the customer zone update changed nothing');
SELECT is((SELECT count(*) FROM public.product_sizes), 2::bigint, 'the customer size delete removed nothing');

-- ================================================================ an admin: reads and writes everything
SELECT t.as_user('00000000-0000-0000-0000-0000000000e1');
SELECT is(t.n('product_sizes'), 2::bigint, 'an admin also sees the inactive size');
SELECT is(t.n('delivery_zones'), 2::bigint, 'an admin also sees the inactive zone');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams) VALUES (9501, 700)$$), '', 'an admin can insert a size');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('Zona 3', 11, 16, 160)$$), '', 'an admin can insert a zone');
WITH u AS (UPDATE public.product_sizes SET is_active = true WHERE product_id = 9501 AND grams = 500 RETURNING 1) SELECT count(*) AS n FROM u \gset admin_upd_
WITH d AS (DELETE FROM public.delivery_zones WHERE name = 'Zona 3' RETURNING 1) SELECT count(*) AS n FROM d \gset admin_del_
SELECT t.reset();
SELECT is(:admin_upd_n::bigint, 1::bigint, 'an admin can update a size');
SELECT is(:admin_del_n::bigint, 1::bigint, 'an admin can delete a zone');
SELECT is((SELECT rounding_step FROM public.product_sizes WHERE product_id = 9501 AND grams = 700), 1.00::numeric(4,2), 'a size inserted without a step rounds to the peso');
SELECT is((SELECT is_active FROM public.product_sizes WHERE product_id = 9501 AND grams = 700), true, 'a size inserted without is_active is active');

-- ================================================================ django: everything
SELECT t.as_django();
SELECT is(t.n('product_sizes'), 3::bigint, 'django sees every size');
SELECT is(t.n('delivery_zones'), 2::bigint, 'django sees every zone');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('Zona 2', 5.5, 11, 90)$$), '', 'django inserts a zone that only touches the border of another (0-5.5 and 5.5-11)');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee, is_active) VALUES ('Vieja', 1, 3, 40, false)$$), '', 'an inactive zone may overlap an active one');
SELECT is(t.code($$UPDATE public.product_sizes SET rounding_step = 0.50 WHERE grams = 340$$), '', 'django updates a size');
SELECT is(t.code($$DELETE FROM public.product_sizes WHERE grams = 700$$), '', 'django deletes a size');
SELECT is(t.code($$SELECT nextval('public.product_sizes_id_seq')$$), '', 'django may advance the product_sizes sequence');
SELECT is(t.code($$SELECT nextval('public.delivery_zones_id_seq')$$), '', 'django may advance the delivery_zones sequence');
SELECT t.reset();

-- ================================================================ constraints (as django, which has the grants)
SELECT t.as_django();
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams) VALUES (9501, 340)$$), '23505', 'a product has one size of each weight');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams) VALUES (9501, 0)$$), '23514', 'a size of 0 g is refused');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams) VALUES (9501, 50001)$$), '23514', 'a size above 50000 g is refused');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams, rounding_step) VALUES (9501, 900, 0.25)$$), '23514', 'a rounding step of 0.25 is not one of the four');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams, rounding_step) VALUES (9501, 901, 0.01)$$), '', 'the step 0.01 is allowed');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams, rounding_step) VALUES (9501, 902, 0.10)$$), '', 'the step 0.10 is allowed');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams, rounding_step) VALUES (9501, 903, 0.50)$$), '', 'the step 0.50 is allowed');
SELECT is(t.code($$INSERT INTO public.product_sizes (product_id, grams) VALUES (9999999, 340)$$), '23503', 'a size needs an existing product');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('Se traslapa', 5, 8, 100)$$), '23P01', 'two active zones cannot overlap');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('Vacia', 8, 8, 100)$$), '23514', 'a zone must end after it starts');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('Negativa', -1, 3, 100)$$), '23514', 'a zone cannot start below 0 km');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('Gratis negativa', 20, 25, -0.01)$$), '23514', 'a fee cannot be negative');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('Gratis', 30, 35, 0)$$), '', 'a free zone is allowed');
-- NaN is equal to NaN and above every number in numeric, so `>= 0` and `> from_km` alone let it in (F-31).
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('NaN fee', 50, 55, 'NaN')$$), '23514', 'a NaN fee is refused');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('NaN from', 'NaN', 60, 10)$$), '23514', 'a NaN start is refused');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('NaN to', 60, 'NaN', 10)$$), '23514', 'a NaN end is refused');
SELECT is(t.code($$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES ('', 40, 45, 10)$$), '23514', 'a zone needs a name');
SELECT is(t.code(format($f$INSERT INTO public.delivery_zones (name, from_km, to_km, fee) VALUES (%L, 40, 45, 10)$f$, repeat('x', 61))), '23514', 'a zone name has at most 60 characters');
SELECT t.reset();

-- ================================================================ a product's sizes go with it
SELECT t.mk_product(9503, 'Producto desechable', 100, 'kg', ARRAY['money', 'weight', 'pieces']);
INSERT INTO public.product_sizes (product_id, grams) VALUES (9503, 250);
SELECT is((SELECT count(*) FROM public.product_sizes WHERE product_id = 9503), 1::bigint, 'the throwaway product has its size');
DELETE FROM public.products WHERE id = 9503;
SELECT is((SELECT count(*) FROM public.product_sizes WHERE product_id = 9503), 0::bigint, 'deleting a product deletes its sizes (ON DELETE CASCADE)');

SELECT * FROM finish();
ROLLBACK;
