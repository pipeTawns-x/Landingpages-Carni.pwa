-- A1: comercio-v1 schema (migration 20261113000001_comercio_v1_esquema.sql).
--
-- What this file proves:
--   * the new columns, defaults and CHECK constraints of products, orders and order_items;
--   * the backfill rule of price_unit / stock_unit / sale_modes and of product_cut_specs;
--   * every new table has RLS on and the exact privileges of each role;
--   * private data (costs, lots, movements, logs) is invisible to customers and anon;
--   * the price_history trigger, the promotion overlap rule and the current_fx view;
--   * the legacy create_order_with_items still works for a customer.
--
-- Users: admin ...a1, customers ...c1 and ...c2. Seed ids used: 1 Bistec de Res (kg),
-- 2 Molida de Res Especial (kg), 41 Paquete Asador (package), 43 Paquete Carnitas por
-- Kilo (kg), 44 Gorra Bordada (piece).

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_user('00000000-0000-0000-0000-0000000000a1', 'Admin Test', true);
SELECT t.mk_user('00000000-0000-0000-0000-0000000000c1', 'Cliente Uno');
SELECT t.mk_user('00000000-0000-0000-0000-0000000000c2', 'Cliente Dos');

-- =========================================================== products: shape
SELECT is(t.col('products', 'stock'), 'numeric(10,3)|NOT NULL|0',
          'products.stock is numeric(10,3) NOT NULL DEFAULT 0');
SELECT is(t.col('products', 'stock_unit'), 'text|NOT NULL|''kg''::text',
          'products.stock_unit is text NOT NULL DEFAULT kg');
SELECT is(t.col('products', 'track_stock'), 'boolean|NOT NULL|false',
          'products.track_stock is boolean NOT NULL DEFAULT false');
SELECT is(t.col('products', 'price_unit'), 'text|NOT NULL|''kg''::text',
          'products.price_unit is text NOT NULL DEFAULT kg');
SELECT is(t.col('products', 'sale_modes'), 'text[]|NOT NULL|''{money,weight}''::text[]',
          'products.sale_modes is text[] NOT NULL DEFAULT {money,weight}');

-- ====================================================== products: the backfill
SELECT is((SELECT price_unit FROM public.products WHERE name = 'Bistec de Res'), 'kg',
          'a meat product is priced per kg');
SELECT is((SELECT price_unit FROM public.products WHERE id = 41), 'package',
          'Paquete Asador is priced per package');
SELECT is((SELECT price_unit FROM public.products WHERE id = 43), 'kg',
          'Paquete Carnitas por Kilo is priced per kg: the name says por kilo');
SELECT is((SELECT price_unit FROM public.products WHERE id = 44), 'piece',
          'a merch product is priced per piece');
SELECT is((SELECT price_unit FROM public.products WHERE id = 49), 'piece',
          'an otros product is priced per piece');
SELECT is((SELECT count(*) FROM public.products WHERE price_unit = 'package'), 2::bigint,
          'two package products');
SELECT is((SELECT count(*) FROM public.products WHERE price_unit = 'piece'), 10::bigint,
          'ten piece products: 5 merch + 5 otros');
SELECT is((SELECT count(*) FROM public.products WHERE price_unit = 'kg'), 41::bigint,
          'the other 41 products stay per kg');
SELECT is((SELECT count(*) FROM public.products WHERE stock_unit = 'piece'), 12::bigint,
          'stock_unit is piece exactly where price_unit is not kg');
SELECT is((SELECT sale_modes FROM public.products WHERE name = 'Bistec de Res'),
          ARRAY['money', 'weight', 'pieces'],
          'a kg product with a piece weight is sold by money, weight and pieces');
SELECT is((SELECT sale_modes FROM public.products WHERE name = 'Molida de Res Especial'),
          ARRAY['money', 'weight'],
          'a cut spec without a piece weight does not enable pieces');
SELECT is((SELECT sale_modes FROM public.products p JOIN public.categories c ON c.id = p.category_id
           WHERE c.slug = 'cerdo' ORDER BY p.id LIMIT 1),
          ARRAY['money', 'weight'],
          'a zero piece weight means no piece weight');
SELECT is((SELECT sale_modes FROM public.products WHERE id = 44), ARRAY['pieces'],
          'a piece product is sold only by pieces');
SELECT is((SELECT sale_modes FROM public.products WHERE id = 41), ARRAY['pieces'],
          'a package product is sold only by pieces');
SELECT is((SELECT count(*) FROM public.products WHERE track_stock), 0::bigint,
          'nothing is tracked right after the migration');
SELECT is((SELECT count(*) FROM public.products WHERE stock <> round(stock)), 0::bigint,
          'the integer seed stock keeps its value as numeric');

-- ======================================================== products: constraints
SELECT is(t.code($$UPDATE public.products SET stock = -1 WHERE id = 1$$), '23514',
          'negative stock is rejected');
SELECT is(t.code($$UPDATE public.products SET stock_unit = 'box' WHERE id = 1$$), '23514',
          'unknown stock_unit is rejected');
SELECT is(t.code($$UPDATE public.products SET price_unit = 'bag' WHERE id = 1$$), '23514',
          'unknown price_unit is rejected');
SELECT is(t.code($$UPDATE public.products SET sale_modes = '{}' WHERE id = 1$$), '23514',
          'empty sale_modes is rejected');
SELECT is(t.code($$UPDATE public.products SET sale_modes = '{money,foo}' WHERE id = 1$$), '23514',
          'unknown sale mode is rejected');
SELECT is(t.code($$UPDATE public.products SET price_unit = 'piece' WHERE id = 1$$), '23514',
          'price_unit piece needs sale_modes = {pieces}');
SELECT is(t.code($$UPDATE public.products SET stock_unit = 'piece' WHERE id = 1$$), '23514',
          'stock_unit piece needs sale_modes = {pieces}');
SELECT is(t.code($$UPDATE public.products SET price_unit = 'package', sale_modes = '{pieces}', stock_unit = 'piece' WHERE id = 7$$), '',
          'a coherent package product is accepted');
SELECT is(t.code($$UPDATE public.products SET stock = 12.345 WHERE id = 2$$), '',
          'stock takes three decimals');
SELECT ok(EXISTS (SELECT 1 FROM pg_indexes
                  WHERE schemaname = 'public' AND tablename = 'order_items'
                    AND indexname = 'idx_order_items_product'),
          'order_items(product_id) is indexed (the FK is RESTRICT)');

-- ====================================================== product_cut_specs
SELECT has_table('public', 'product_cut_specs', 'product_cut_specs exists');
SELECT is((SELECT count(*) FROM public.product_cut_specs), 3::bigint,
          'the three Django cut specs were copied');
SELECT is((SELECT avg_piece_weight_kg FROM public.product_cut_specs s
           JOIN public.products p ON p.id = s.product_id WHERE p.name = 'Bistec de Res'),
          0.150::numeric, 'the piece weight was copied');
SELECT is((SELECT ARRAY[thickness_min_in, thickness_max_in, thickness_default_in] FROM public.product_cut_specs s
           JOIN public.products p ON p.id = s.product_id WHERE p.name = 'Bistec de Res'),
          ARRAY[0.50, 2.00, 1.00]::numeric[], 'the thickness range was copied');
SELECT is((SELECT avg_piece_weight_kg FROM public.product_cut_specs s
           JOIN public.products p ON p.id = s.product_id WHERE p.name = 'Molida de Res Especial'),
          NULL::numeric, 'a missing piece weight stays NULL');
SELECT is((SELECT avg_piece_weight_kg FROM public.product_cut_specs s
           JOIN public.products p ON p.id = s.product_id
           JOIN public.categories c ON c.id = p.category_id
           WHERE c.slug = 'cerdo' ORDER BY p.id LIMIT 1),
          NULL::numeric, 'a zero piece weight becomes NULL');
SELECT is(t.code($$INSERT INTO public.product_cut_specs (product_id, avg_piece_weight_kg) VALUES (3, 0)$$), '23514',
          'a piece weight of zero is rejected');
SELECT is(t.code($$INSERT INTO public.product_cut_specs (product_id, thickness_min_in, thickness_max_in) VALUES (3, 3, 2)$$), '23514',
          'thickness min above max is rejected');
SELECT is(t.code($$INSERT INTO public.product_cut_specs (product_id, thickness_min_in, thickness_max_in, thickness_default_in) VALUES (3, 1, 2, 3)$$), '23514',
          'a default thickness outside the range is rejected');
SELECT is(t.code($$INSERT INTO public.product_cut_specs (product_id, thickness_default_in) VALUES (3, 0)$$), '23514',
          'a zero default thickness is rejected');
SELECT is(t.code($$INSERT INTO public.product_cut_specs (product_id) VALUES (999999)$$), '23503',
          'a cut spec needs an existing product');

-- ================================================================ fixtures
-- One order of each customer, one item, and one row in every private table.
INSERT INTO public.orders (id, user_id, total, delivery_type)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 100, 'pickup'),
       ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c2', 100, 'pickup');
INSERT INTO public.order_items (id, order_id, product_id, quantity_kg, unit_price, subtotal)
VALUES (900001, 'aaaaaaaa-0000-0000-0000-000000000001', 1, 0.500, 200, 100);
INSERT INTO public.product_costs (product_id, cost_per_kg, updated_at)
VALUES (1, 120, now() - interval '1 day');
INSERT INTO public.order_item_costs (order_item_id, cost_per_kg_frozen, cost_per_piece_frozen, yield_pct_frozen, total_cost_frozen)
VALUES (900001, 120, NULL, 100, 60);
INSERT INTO public.purchase_lots (id, product_id, qty, total_cost, unit_cost, expected_revenue)
VALUES (900001, 1, 10, 1200, 120, 2890);
INSERT INTO public.stock_movements (product_id, delta, reason, lot_id)
VALUES (1, 10, 'purchase', 900001);
INSERT INTO public.order_status_log (order_id, from_status, to_status, actor)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', NULL, 'pending', 'fixture');
INSERT INTO public.fx_rates (rate, buffer_pct, source, fetched_on)
VALUES (18.61, 2.00, 'manual', (now() AT TIME ZONE 'America/Mexico_City')::date);
-- price_history is written by the trigger, never by hand.
UPDATE public.products SET price_per_kg = 205 WHERE id = 1;

-- ========================================================== RLS and privileges
SELECT is((SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || n)::regclass), true,
          'RLS is on for ' || n)
FROM unnest(ARRAY['product_cut_specs', 'product_costs', 'order_item_costs', 'purchase_lots',
                  'stock_movements', 'order_status_log', 'price_history', 'product_promotions',
                  'fx_rates']) AS n;

SELECT is(t.privs('anon', n), '', 'anon holds no privilege on ' || n)
FROM unnest(ARRAY['product_costs', 'order_item_costs', 'purchase_lots', 'stock_movements',
                  'order_status_log', 'price_history', 'fx_rates']) AS n;
SELECT is(t.privs('authenticated', n), 'SELECT', 'authenticated only reads ' || n)
FROM unnest(ARRAY['order_item_costs', 'purchase_lots', 'stock_movements',
                  'order_status_log', 'price_history']) AS n;
SELECT is(t.privs('django', n), 'SELECT', 'django only reads ' || n)
FROM unnest(ARRAY['order_item_costs', 'purchase_lots', 'stock_movements',
                  'order_status_log', 'price_history', 'fx_rates']) AS n;
SELECT is(t.privs('authenticated', 'product_costs'), 'SELECT,INSERT,UPDATE,DELETE',
          'authenticated may write product_costs (RLS keeps it to admins)');
SELECT is(t.privs('django', 'product_costs'), 'SELECT,INSERT,UPDATE',
          'django reads, inserts and updates product_costs but cannot delete');
SELECT is(t.privs('authenticated', 'fx_rates'), '', 'authenticated holds nothing on fx_rates');
SELECT is(t.privs('anon', 'product_cut_specs'), 'SELECT', 'anon reads product_cut_specs');
SELECT is(t.privs('authenticated', 'product_cut_specs'), 'SELECT', 'authenticated reads product_cut_specs');
SELECT is(t.privs('django', 'product_cut_specs'), 'SELECT,INSERT,UPDATE,DELETE', 'django keeps product_cut_specs');
SELECT is(t.privs('anon', 'product_promotions'), 'SELECT', 'anon reads product_promotions');
SELECT is(t.privs('authenticated', 'product_promotions'), 'SELECT,INSERT,UPDATE,DELETE',
          'authenticated may write product_promotions (RLS keeps it to admins)');
SELECT is(t.privs('django', 'product_promotions'), 'SELECT,INSERT,UPDATE,DELETE', 'django keeps product_promotions');
SELECT is(t.privs('anon', 'current_fx'), 'SELECT', 'anon reads current_fx');
SELECT is(t.privs('authenticated', 'current_fx'), 'SELECT', 'authenticated reads current_fx');
SELECT is(t.privs('django', 'current_fx'), 'SELECT', 'django reads current_fx');
SELECT is(t.privs('django', 'orders'), 'SELECT', 'django reads orders and nothing else');

SELECT is(t.seq_privs(r, s), '', r || ' holds nothing on ' || s)
FROM unnest(ARRAY['anon', 'authenticated']) AS r,
     unnest(ARRAY['fx_rates_id_seq', 'price_history_id_seq', 'purchase_lots_id_seq',
                  'stock_movements_id_seq', 'order_status_log_id_seq']) AS s;
SELECT is(t.seq_privs('anon', 'product_promotions_id_seq'), '', 'anon holds nothing on product_promotions_id_seq');
SELECT is(t.seq_privs('authenticated', 'product_promotions_id_seq'), 'USAGE,SELECT',
          'an admin inserts promotions through authenticated: it needs the sequence');
SELECT is(t.seq_privs('django', 'product_promotions_id_seq'), 'USAGE,SELECT',
          'django may insert promotions: it needs the sequence');
SELECT is(t.seq_privs('django', 'purchase_lots_id_seq'), '', 'django cannot draw lot ids by hand');

-- ---- anon
SELECT t.as_anon();
SELECT is(t.code(format('SELECT t.n(%L)', n)), '42501', 'anon is refused on ' || n)
FROM unnest(ARRAY['product_costs', 'order_item_costs', 'purchase_lots', 'stock_movements',
                  'order_status_log', 'price_history', 'fx_rates']) AS n;
SELECT is(t.n('product_cut_specs'), 3::bigint, 'anon reads the cut specs');
SELECT is(t.code($$INSERT INTO public.product_cut_specs (product_id, avg_piece_weight_kg) VALUES (3, 0.2)$$), '42501',
          'anon cannot insert a cut spec');
SELECT is(t.code($$UPDATE public.product_cut_specs SET avg_piece_weight_kg = 9$$), '42501',
          'anon cannot update a cut spec');
SELECT t.reset();

-- ---- customer c1 (not an admin)
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.n(n), 0::bigint, 'a customer sees no row of ' || n)
FROM unnest(ARRAY['product_costs', 'order_item_costs', 'purchase_lots', 'stock_movements',
                  'order_status_log', 'price_history']) AS n;
SELECT is(t.code('SELECT t.n(''fx_rates'')'), '42501', 'a customer cannot read fx_rates');
SELECT is(t.n('product_cut_specs'), 3::bigint, 'a customer reads the cut specs');
SELECT is(t.n('orders'), 1::bigint, 'a customer sees only their own order');
SELECT is(t.code($$INSERT INTO public.product_costs (product_id, cost_per_kg) VALUES (2, 100)$$), '42501',
          'a customer cannot insert a cost');
SELECT is(t.code($$UPDATE public.product_costs SET cost_per_kg = 1$$), '',
          'a customer update of costs touches nothing: RLS hides every row');
SELECT is((SELECT cost_per_kg FROM public.product_costs WHERE product_id = 1), NULL::numeric,
          'the customer still cannot read the cost');
SELECT t.reset();
SELECT is((SELECT cost_per_kg FROM public.product_costs WHERE product_id = 1), 120.0000::numeric,
          'the customer update changed nothing');

-- ---- admin
SELECT t.as_user('00000000-0000-0000-0000-0000000000a1');
SELECT ok(t.n(n) > 0, 'an admin sees the rows of ' || n)
FROM unnest(ARRAY['product_costs', 'order_item_costs', 'purchase_lots', 'stock_movements',
                  'order_status_log', 'price_history']) AS n;
SELECT is(t.n('orders'), 2::bigint, 'an admin sees every order');
SELECT is(t.code($$INSERT INTO public.product_costs (product_id, cost_per_kg, yield_pct) VALUES (2, 100, 85)$$), '',
          'an admin inserts a cost');
SELECT is(t.code($$UPDATE public.product_costs SET cost_per_kg = 101 WHERE product_id = 2$$), '',
          'an admin updates a cost');
SELECT is(t.code($$DELETE FROM public.product_costs WHERE product_id = 2$$), '',
          'an admin deletes a cost');
SELECT is(t.code($$INSERT INTO public.purchase_lots (product_id, qty, total_cost, unit_cost, expected_revenue) VALUES (1, 1, 1, 1, 1)$$), '42501',
          'an admin cannot write a lot directly: only register_purchase does');
SELECT is(t.code($$INSERT INTO public.stock_movements (product_id, delta, reason) VALUES (1, 1, 'adjustment')$$), '42501',
          'an admin cannot write a stock movement directly');
SELECT is(t.code($$INSERT INTO public.order_status_log (order_id, to_status) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'confirmed')$$), '42501',
          'an admin cannot write the status log directly');
SELECT is(t.code($$INSERT INTO public.price_history (product_id, price_per_kg, origin) VALUES (1, 1, 'owner')$$), '42501',
          'an admin cannot write the price history directly');
SELECT is(t.code($$INSERT INTO public.fx_rates (rate, source, fetched_on) VALUES (1, 'manual', current_date)$$), '42501',
          'an admin cannot write fx_rates directly');
SELECT t.reset();

-- ---- django
SELECT t.as_django();
SELECT ok(t.n(n) > 0, 'django sees the rows of ' || n)
FROM unnest(ARRAY['product_costs', 'order_item_costs', 'purchase_lots', 'stock_movements',
                  'order_status_log', 'price_history', 'fx_rates']) AS n;
SELECT is(t.n('orders'), 2::bigint, 'django reads every order');
SELECT is(t.n('order_items'), 1::bigint, 'django reads the order items');
SELECT is(t.code($$INSERT INTO public.product_costs (product_id, cost_per_kg) VALUES (3, 150)$$), '',
          'django inserts a cost');
SELECT is(t.code($$UPDATE public.product_costs SET cost_per_kg = 151 WHERE product_id = 3$$), '',
          'django updates a cost');
SELECT is(t.code($$DELETE FROM public.product_costs WHERE product_id = 3$$), '42501',
          'django cannot delete a cost');
SELECT is(t.code($$INSERT INTO public.product_cut_specs (product_id, avg_piece_weight_kg) VALUES (3, 0.2)$$), '',
          'django inserts a cut spec');
SELECT is(t.code($$UPDATE public.product_cut_specs SET avg_piece_weight_kg = 0.3 WHERE product_id = 3$$), '',
          'django updates a cut spec');
SELECT is(t.code($$DELETE FROM public.product_cut_specs WHERE product_id = 3$$), '',
          'django deletes a cut spec');
SELECT is(t.code($$INSERT INTO public.purchase_lots (product_id, qty, total_cost, unit_cost, expected_revenue) VALUES (1, 1, 1, 1, 1)$$), '42501',
          'django cannot write a lot directly');
SELECT is(t.code($$INSERT INTO public.fx_rates (rate, source, fetched_on) VALUES (1, 'manual', current_date)$$), '42501',
          'django cannot write fx_rates directly');
SELECT is(t.code($$UPDATE public.orders SET status = 'cancelled'$$), '42501',
          'django cannot update orders');
SELECT t.reset();

-- ============================================================ product_costs
SELECT is(t.col('product_costs', 'yield_pct'), 'numeric(5,2)|NOT NULL|100',
          'product_costs.yield_pct is numeric(5,2) NOT NULL DEFAULT 100');
SELECT is(t.col('product_costs', 'cost_per_kg'), 'numeric(12,4)|NULL|', 'cost_per_kg is numeric(12,4)');
SELECT is(t.col('product_costs', 'cost_per_piece'), 'numeric(12,4)|NULL|', 'cost_per_piece is numeric(12,4)');
SELECT is(t.col('product_costs', 'updated_by'), 'text|NULL|', 'updated_by is text');
SELECT is(t.code($$INSERT INTO public.product_costs (product_id, yield_pct) VALUES (4, 0)$$), '23514',
          'a yield of 0 is rejected');
SELECT is(t.code($$INSERT INTO public.product_costs (product_id, yield_pct) VALUES (4, 100.01)$$), '23514',
          'a yield above 100 is rejected');
SELECT is(t.code($$INSERT INTO public.product_costs (product_id, yield_pct) VALUES (4, 85.5)$$), '',
          'a yield of 85.5 is accepted');
UPDATE public.product_costs SET cost_per_kg = 130 WHERE product_id = 1;
SELECT is((SELECT updated_at FROM public.product_costs WHERE product_id = 1), now(),
          'the trigger refreshes updated_at');

-- ====================================================== price_history trigger
SELECT is((SELECT count(*) FROM public.price_history WHERE product_id = 1), 1::bigint,
          'a price change writes one history row');
SELECT is((SELECT price_per_kg FROM public.price_history WHERE product_id = 1), 205.00::numeric,
          'the row holds the new price per kg');
SELECT is((SELECT price_per_piece FROM public.price_history WHERE product_id = 1), NULL::numeric,
          'a kg product leaves price_per_piece NULL');
SELECT is((SELECT origin FROM public.price_history WHERE product_id = 1), 'owner',
          'the origin of a price change is owner');
UPDATE public.products SET price_per_kg = 205 WHERE id = 1;
UPDATE public.products SET name = name WHERE id = 1;
SELECT is((SELECT count(*) FROM public.price_history WHERE product_id = 1), 1::bigint,
          'the same price, or another column, writes nothing');
UPDATE public.products SET price_per_kg = 255 WHERE id = 44;
SELECT is((SELECT price_per_piece FROM public.price_history WHERE product_id = 44), 255.00::numeric,
          'a piece product stores price_per_piece');
SELECT is((SELECT price_per_kg FROM public.price_history WHERE product_id = 44), NULL::numeric,
          'a piece product leaves price_per_kg NULL');
SELECT t.as_user('00000000-0000-0000-0000-0000000000a1');
SELECT is(t.code($$UPDATE public.products SET price_per_kg = 210 WHERE id = 1$$), '',
          'an admin changes a price through RLS: the trigger writes the history as definer');
SELECT t.reset();
SELECT is((SELECT changed_by FROM public.price_history WHERE product_id = 1 ORDER BY id DESC LIMIT 1),
          '00000000-0000-0000-0000-0000000000a1'::uuid, 'changed_by is the admin who changed it');
SELECT is((SELECT count(*) FROM public.price_history WHERE product_id = 1), 2::bigint,
          'the admin change added the second row');
SELECT is(t.can_exec('anon', 'log_price_change()'), false, 'anon cannot execute the trigger function');
SELECT is(t.can_exec('authenticated', 'log_price_change()'), false, 'authenticated cannot execute the trigger function');

-- ========================================================= product_promotions
DELETE FROM public.product_promotions;
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at, is_active) VALUES
  (4, 'percent',     10, now() - interval '1 day',  now() + interval '1 day',  true),   -- current
  (4, 'percent',     15, now() + interval '2 days', now() + interval '3 days', true),   -- future
  (4, 'percent',     20, now() - interval '3 days', now() - interval '2 days', true),   -- expired
  (4, 'amount_off',   5, now() - interval '1 day',  now() + interval '1 day',  false);  -- off
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (4, 'percent', 5, now(), now() + interval '2 days')$$), '23P01',
          'two active promotions of one product cannot overlap');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at, is_active) VALUES (4, 'percent', 5, now(), now() + interval '2 days', false)$$), '',
          'an inactive promotion may overlap');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (5, 'percent', 5, now() - interval '1 day', now() + interval '1 day')$$), '',
          'the same window on another product is fine');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at)
                   SELECT 4, 'fixed_price', 100, ends_at, ends_at + interval '1 day'
                   FROM public.product_promotions WHERE kind = 'percent' AND value = 10 AND product_id = 4$$), '',
          'a promotion that starts when the previous one ends does not overlap');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'percent', 5, now() + interval '1 day', now())$$), '23514',
          'ends_at must be after starts_at');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'percent', 0, now(), now() + interval '1 day')$$), '23514',
          'a promotion value of 0 is rejected');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'percent', 100, now(), now() + interval '1 day')$$), '23514',
          'a 100 percent promotion is rejected');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'bogus', 5, now(), now() + interval '1 day')$$), '23514',
          'an unknown promotion kind is rejected');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'amount_off', 150, now(), now() + interval '1 day')$$), '',
          'amount_off may exceed 100: it is pesos, not a percentage');

-- Back to the clean four-row fixture for the visibility checks.
DELETE FROM public.product_promotions;
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at, is_active) VALUES
  (4, 'percent',     10, now() - interval '1 day',  now() + interval '1 day',  true),
  (4, 'percent',     15, now() + interval '2 days', now() + interval '3 days', true),
  (4, 'percent',     20, now() - interval '3 days', now() - interval '2 days', true),
  (4, 'amount_off',   5, now() - interval '1 day',  now() + interval '1 day',  false);

SELECT t.as_anon();
SELECT is(t.n('product_promotions'), 1::bigint, 'anon sees only the promotion in force');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'percent', 5, now(), now() + interval '1 day')$$), '42501',
          'anon cannot insert a promotion');
SELECT t.reset();
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.n('product_promotions'), 1::bigint, 'a customer sees only the promotion in force');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'percent', 5, now(), now() + interval '1 day')$$), '42501',
          'a customer cannot insert a promotion');
SELECT t.reset();
SELECT t.as_user('00000000-0000-0000-0000-0000000000a1');
SELECT is(t.n('product_promotions'), 4::bigint, 'an admin sees every promotion');
SELECT is(t.code($$INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at) VALUES (6, 'percent', 5, now(), now() + interval '1 day')$$), '',
          'an admin inserts a promotion');
SELECT t.reset();
SELECT t.as_django();
SELECT is(t.n('product_promotions'), 5::bigint, 'django sees every promotion');
SELECT is(t.code($$UPDATE public.product_promotions SET is_active = false WHERE product_id = 6$$), '',
          'django updates a promotion');
SELECT t.reset();

-- ================================================================ fx_rates
SELECT is(t.col('fx_rates', 'buffer_pct'), 'numeric(5,2)|NOT NULL|2.00', 'fx_rates.buffer_pct defaults to 2.00');
DELETE FROM public.fx_rates;
SELECT is((SELECT count(*) FROM public.current_fx), 1::bigint, 'current_fx always returns one row');
SELECT is((SELECT status FROM public.current_fx), 'missing', 'no rate at all: status missing');
SELECT is((SELECT rate FROM public.current_fx), NULL::numeric, 'status missing carries no rate');
SELECT t.set_fx(0);
SELECT is((SELECT status FROM public.current_fx), 'ok', 'a rate of today is ok');
SELECT is((SELECT house_rate FROM public.current_fx), 18.2378::numeric,
          'house_rate = round(18.61 * 0.98, 4)');
SELECT is((SELECT ARRAY[rate, buffer_pct]::numeric[] FROM public.current_fx), ARRAY[18.6100, 2.00]::numeric[],
          'current_fx exposes the rate and the buffer');
SELECT t.set_fx(4);
SELECT is((SELECT status FROM public.current_fx), 'ok', 'a rate of 4 days is still ok');
SELECT t.set_fx(5);
SELECT is((SELECT status FROM public.current_fx), 'stale', 'a rate of 5 days is stale');
SELECT t.set_fx(0, 20, 0);
SELECT is((SELECT house_rate FROM public.current_fx), 20.0000::numeric, 'a buffer of 0 leaves the rate as is');
DELETE FROM public.fx_rates;
INSERT INTO public.fx_rates (rate, source, fetched_on) VALUES
  (18.00, 'manual',  (now() AT TIME ZONE 'America/Mexico_City')::date - 3),
  (19.00, 'banxico', (now() AT TIME ZONE 'America/Mexico_City')::date - 1);
SELECT is((SELECT rate FROM public.current_fx), 19.0000::numeric, 'the latest fetched_on wins');
INSERT INTO public.fx_rates (rate, source, fetched_on)
VALUES (20.00, 'manual', (now() AT TIME ZONE 'America/Mexico_City')::date - 1);
SELECT is((SELECT rate FROM public.current_fx), 20.0000::numeric, 'on the same day a manual rate wins over Banxico');
SELECT is(t.code($$INSERT INTO public.fx_rates (rate, source, fetched_on) VALUES (21, 'manual', (now() AT TIME ZONE 'America/Mexico_City')::date - 1)$$), '23505',
          'one rate per (fetched_on, source)');
SELECT is(t.code($$INSERT INTO public.fx_rates (rate, source, fetched_on) VALUES (0, 'manual', current_date - 9)$$), '23514', 'a rate of 0 is rejected');
SELECT is(t.code($$INSERT INTO public.fx_rates (rate, buffer_pct, source, fetched_on) VALUES (18, -1, 'manual', current_date - 9)$$), '23514', 'a negative buffer is rejected');
SELECT is(t.code($$INSERT INTO public.fx_rates (rate, buffer_pct, source, fetched_on) VALUES (18, 100, 'manual', current_date - 9)$$), '23514', 'a buffer of 100 is rejected');
SELECT is(t.code($$INSERT INTO public.fx_rates (rate, source, fetched_on) VALUES (18, 'oracle', current_date - 9)$$), '23514', 'an unknown source is rejected');
SELECT t.set_fx(0);
SELECT t.as_anon();
SELECT is((SELECT status FROM public.current_fx), 'ok', 'anon reads current_fx');
SELECT t.reset();
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is((SELECT house_rate FROM public.current_fx), 18.2378::numeric, 'a customer reads current_fx');
SELECT t.reset();
SELECT t.as_django();
SELECT is((SELECT house_rate FROM public.current_fx), 18.2378::numeric, 'django reads current_fx');
SELECT t.reset();

-- ================================================================== orders
SELECT is(t.col('orders', 'user_id'), 'uuid|NULL|', 'orders.user_id accepts NULL');
SELECT is(t.col('orders', 'channel'), 'text|NOT NULL|''web''::text', 'orders.channel defaults to web');
SELECT is(t.col('orders', 'currency'), 'text|NOT NULL|''MXN''::text', 'orders.currency defaults to MXN');
SELECT is(t.col('orders', 'customer_name'), 'text|NULL|', 'orders.customer_name is text');
SELECT is(t.col('orders', 'customer_phone'), 'text|NULL|', 'orders.customer_phone is text');
SELECT is(t.col('orders', 'staff_ref'), 'text|NULL|', 'orders.staff_ref is text');
SELECT is(t.col('orders', 'payment_method'), 'text|NULL|', 'orders.payment_method is text');
SELECT is(t.col('orders', 'fx_rate_used'), 'numeric(12,4)|NULL|', 'orders.fx_rate_used is numeric(12,4)');
SELECT is(t.col('orders', 'total_usd'), 'numeric(12,2)|NULL|', 'orders.total_usd is numeric(12,2)');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type) VALUES (10, 'pickup')$$), '23514',
          'a web order needs a user');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel) VALUES (10, 'pickup', 'mostrador')$$), '23514',
          'a counter order needs a customer name');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name) VALUES (10, 'pickup', 'mostrador', '   ')$$), '23514',
          'a blank customer name does not count');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name) VALUES (10, 'pickup', 'mostrador', 'Doña Mary')$$), '',
          'a counter order without a user is accepted');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, customer_phone, payment_method) VALUES (10, 'pickup', 'whatsapp', 'Don Beto', '4441234567', 'transferencia')$$), '',
          'a WhatsApp order with phone and payment is accepted');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name) VALUES (10, 'pickup', 'drone', 'X')$$), '23514', 'an unknown channel is rejected');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, payment_method) VALUES (10, 'pickup', 'mostrador', 'X', 'cheque')$$), '23514', 'an unknown payment method is rejected');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, currency) VALUES (10, 'pickup', 'mostrador', 'X', 'EUR')$$), '23514', 'an unknown currency is rejected');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, currency) VALUES (10, 'pickup', 'mostrador', 'X', 'USD')$$), '23514',
          'a USD order needs the rate used');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, currency, fx_rate_used) VALUES (10, 'pickup', 'mostrador', 'X', 'USD', 18.2378)$$), '23514',
          'a USD order needs total_usd');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, currency, total_usd) VALUES (10, 'pickup', 'mostrador', 'X', 'USD', 0.55)$$), '23514',
          'a USD order with total_usd but no rate is rejected');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, currency, fx_rate_used, total_usd) VALUES (10, 'pickup', 'mostrador', 'X', 'MXN', 0, 0.55)$$), '23514',
          'a rate of zero is rejected whatever the currency');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, currency, fx_rate_used, total_usd) VALUES (10, 'pickup', 'mostrador', 'X', 'USD', 18.2378, 0.55)$$), '',
          'a complete USD order is accepted');
SELECT is(t.code(format($$INSERT INTO public.orders (total, delivery_type, channel, customer_name) VALUES (10, 'pickup', 'mostrador', %L)$$, repeat('n', 121))), '23514',
          'a customer name of 121 characters is rejected');
SELECT is(t.code(format($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, customer_phone) VALUES (10, 'pickup', 'mostrador', 'X', %L)$$, repeat('9', 21))), '23514',
          'a phone of 21 characters is rejected');

-- ============================================================== order_items
SELECT is(t.col('order_items', 'sale_mode'), 'text|NULL|', 'order_items.sale_mode is text');
SELECT is(t.col('order_items', 'pieces'), 'integer|NULL|', 'order_items.pieces is integer');
SELECT is(t.col('order_items', 'discount'), 'numeric(10,2)|NOT NULL|0', 'order_items.discount defaults to 0');
SELECT is(t.col('order_items', 'note'), 'text|NULL|', 'order_items.note is text');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, sale_mode, pieces) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 44, 0, 250, 500, 'pieces', 2)$$), '',
          'a piece line with quantity_kg 0 is accepted');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 44, 0, 250, 500)$$), '23514',
          'quantity_kg 0 without pieces is rejected');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, pieces) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 44, 0, 250, 500, 0)$$), '23514',
          'pieces 0 is rejected');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, pieces) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 44, -1, 250, 500, 2)$$), '23514',
          'a negative quantity_kg is rejected');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, sale_mode) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 1, 1, 200, 200, 'barter')$$), '23514',
          'an unknown sale_mode is rejected');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, discount) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 1, 1, 200, 200, -1)$$), '23514',
          'a negative discount is rejected');
SELECT is(t.code(format($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, note) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 1, 1, 200, 200, %L)$$, repeat('n', 201))), '23514',
          'a note of 201 characters is rejected');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 1, 1, 0, 200)$$), '23514',
          'a zero unit price is still rejected');
SELECT is(t.code($$INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 1, 1, 200, 0)$$), '23514',
          'a zero subtotal is still rejected');

-- ======================================================== RESTRICT on products
INSERT INTO public.purchase_lots (id, product_id, qty, total_cost, unit_cost, expected_revenue)
VALUES (900002, 5, 1, 1, 1, 1);
INSERT INTO public.stock_movements (product_id, delta, reason) VALUES (6, 1, 'adjustment');
SELECT is(t.code($$DELETE FROM public.products WHERE id = 5$$), '23503', 'a product with a purchase lot cannot be deleted');
SELECT is(t.code($$DELETE FROM public.products WHERE id = 6$$), '23503', 'a product with stock movements cannot be deleted');
DELETE FROM public.purchase_lots WHERE id = 900001;
SELECT is((SELECT lot_id FROM public.stock_movements WHERE product_id = 1 AND reason = 'purchase'), NULL::bigint,
          'deleting a lot keeps the movement and clears lot_id');
DELETE FROM public.orders WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
SELECT is((SELECT count(*) FROM public.order_status_log WHERE order_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0::bigint,
          'deleting an order deletes its status log');
SELECT is((SELECT count(*) FROM public.order_item_costs WHERE order_item_id = 900001), 0::bigint,
          'deleting an order deletes the frozen costs of its items');

-- ============================================= the legacy RPC keeps working
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code($$SELECT public.create_order_with_items('pickup', '{}'::jsonb, NULL, '[{"product_id": 1, "quantity_kg": 5}]'::jsonb)$$), '',
          'the legacy create_order_with_items still creates an order for a customer');
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.orders
           WHERE user_id = '00000000-0000-0000-0000-0000000000c1' AND channel = 'web' AND currency = 'MXN'
             AND total = (SELECT round(5 * price_per_kg, 2) FROM public.products WHERE id = 1)
             AND customer_name IS NULL AND fx_rate_used IS NULL), 1::bigint,
          'the legacy order is a web order in MXN, priced by the server');
SELECT is((SELECT count(*) FROM public.order_items i JOIN public.orders o ON o.id = i.order_id
           WHERE o.user_id = '00000000-0000-0000-0000-0000000000c1' AND i.sale_mode IS NULL
             AND i.pieces IS NULL AND i.discount = 0 AND i.note IS NULL AND i.quantity_kg = 5.000), 1::bigint,
          'the legacy item leaves the new columns at their defaults');

SELECT * FROM finish();
ROLLBACK;
