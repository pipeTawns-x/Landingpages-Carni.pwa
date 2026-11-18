-- cerrar_pedidos_directos (migration 20261118000001_cerrar_pedidos_directos.sql): a signed-in
-- customer or a visitor can no longer write orders or order lines straight into the tables, nor
-- call the old functions that bypassed the quote; orders are born only in the functions of the
-- store (create_order_v2, create_order_staff, create_order_web).
--
-- Covers: the three policies are gone, anon and authenticated hold no INSERT, UPDATE or DELETE
-- on orders and order_items, they keep SELECT (their own orders, through RLS), the two old
-- functions are not executable by them, and the functions of the store still are for their roles.

BEGIN;
SELECT * FROM no_plan();

SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN ('orders_insert_own', 'orders_update_own', 'order_items_insert_order')),
  0, 'the policies that let a customer write orders are gone');

SELECT ok(NOT has_table_privilege(r, 'public.' || t, p), r || ' cannot ' || p || ' on ' || t)
  FROM unnest(ARRAY['anon', 'authenticated']) AS r,
       unnest(ARRAY['orders', 'order_items']) AS t,
       unnest(ARRAY['INSERT', 'UPDATE', 'DELETE']) AS p;

SELECT ok(has_table_privilege('authenticated', 'public.orders', 'SELECT'),
          'authenticated still reads (its own orders, through RLS)');

SELECT ok(NOT has_function_privilege(r, f, 'EXECUTE'), r || ' cannot run ' || f)
  FROM unnest(ARRAY['anon', 'authenticated']) AS r,
       unnest(ARRAY['public.create_order_with_items(text, jsonb, text, jsonb)',
                    'public.cancel_order(uuid)']) AS f;

SELECT ok(has_function_privilege('authenticated', 'public.create_order_v2(jsonb, text, jsonb, text, text)', 'EXECUTE'),
          'a signed-in customer still orders through create_order_v2');
SELECT ok(has_function_privilege('django', 'public.create_order_web(jsonb, text, text, text, jsonb, text, text, text)', 'EXECUTE'),
          'django still places the guest orders of the store');

-- A signed-in customer trying the old way is refused by the database itself.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
SELECT throws_ok(
  $$INSERT INTO public.orders (user_id, status, total) VALUES ('00000000-0000-0000-0000-0000000000c1', 'pending', 1)$$,
  '42501', NULL, 'a direct INSERT into orders is refused');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
