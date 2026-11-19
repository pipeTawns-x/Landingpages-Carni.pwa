-- lotes_por_pieza (migration 20261119000001_lotes_por_pieza.sql): a lot weighed by the piece.
--
-- Rule (odd/tasks/carrito-trifasico.md, S3-S5): the price of a piece is the standard weight of
-- its lot times the price per kilo. Every line is served whole from ONE lot, the oldest one that
-- covers it; only when no single lot covers it are lots mixed, oldest first.
--
-- Eduardo's example: whole chicken at $75/kg. Last week's lot weighs 1.5 kg a chicken
-- ($112.50); this week's bag weighs 2.5 kg a chicken ($187.50).
--
-- Products (ids 9000+): 9401 pollo entero (kg price, stock in pieces, sold by the piece),
-- 9402 bistec (kg, sold by money and weight only), 9403 camiseta (price per piece),
-- 9404 rib eye with a cut spec and no lots (the old path), 9405 pierna with a cut spec AND lots.

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_product(9401, 'Pollo entero L', 75, 'kg', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9402, 'Bistec L', 200);
SELECT t.mk_product(9403, 'Camiseta L', 250, 'piece', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9404, 'Rib eye L', 800, 'kg', ARRAY['money','weight','pieces']);
SELECT t.mk_cutspec(9404, 0.400);
SELECT t.mk_product(9405, 'Pierna L', 90, 'kg', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_cutspec(9405, 0.300, 0.50, 2.00, 1.00);

-- ---------------------------------------------------------------- shape and privileges
SELECT is(t.col('purchase_lots', 'piece_weight_kg'), 'numeric(6,3)|NULL|', 'lots keep the standard weight of one piece');
SELECT is(t.col('purchase_lots', 'pieces_left'), 'integer|NULL|', 'lots keep how many pieces are left');
SELECT is(t.col('purchase_lots', 'source_lot_id'), 'bigint|NULL|', 'a lot can point at the lot it was cut from');

SELECT ok(t.can_exec('django', 'register_lot(integer,numeric,numeric,numeric,text,text)'), 'django registers lots');
SELECT ok(NOT t.can_exec(r, 'register_lot(integer,numeric,numeric,numeric,text,text)'), r || ' cannot register lots')
  FROM unnest(ARRAY['anon', 'authenticated']) AS r;
SELECT ok(NOT t.can_exec(r, '_lot_allocation(integer,integer)'), r || ' cannot call the allocation helper')
  FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r;
SELECT ok(t.can_exec('anon', 'quote_line(integer,text,numeric,text,numeric,text)'), 'anon still quotes');

-- ---------------------------------------------------------------- register_lot
SELECT t.as_django();
SELECT is(t.code($$SELECT public.register_lot(9401, 3, 1.5, 300, 'semana pasada', 'hermana')$$), '',
          'the old lot is registered: 3 chickens of 1.5 kg');
SELECT t.reset();

SELECT results_eq(
    $$SELECT piece_weight_kg, pieces_left, qty, total_cost, unit_cost, expected_revenue
        FROM public.purchase_lots WHERE product_id = 9401$$,
    $$VALUES (1.500::numeric(6,3), 3, 3.000::numeric(10,3), 300.00::numeric(12,2),
              100.0000::numeric(12,4), 337.50::numeric(12,2))$$,
    'the lot keeps 3 pieces of 1.5 kg; it is worth 3 x 1.5 x 75 = 337.50');
SELECT is((SELECT stock FROM public.products WHERE id = 9401), 3.000::numeric, 'stock in pieces goes up by 3');
SELECT ok((SELECT track_stock FROM public.products WHERE id = 9401), 'the product now tracks stock');
SELECT is((SELECT delta::text || '|' || reason FROM public.stock_movements WHERE product_id = 9401), '3.000|purchase',
          'one purchase movement of 3 pieces');
SELECT is((SELECT cost_per_kg FROM public.product_costs WHERE product_id = 9401), 66.6667::numeric(12,4),
          'the cost per kilo is 300 / (3 x 1.5)');

SELECT t.as_django();
SELECT is(t.code($$SELECT public.register_lot(9401, 20, 2.5, 3000, 'bolsa nueva', 'hermana')$$), '',
          'the new bag is registered: 20 chickens of 2.5 kg, weighing only one');
SELECT t.reset();
SELECT is((SELECT stock FROM public.products WHERE id = 9401), 23.000::numeric, 'stock is 3 + 20 pieces');

-- Rejections leave nothing behind.
SELECT t.as_django();
SELECT is(t.code($$SELECT public.register_lot(9401, 0, 1.5, 0)$$), 'invalid_amount', 'zero pieces is rejected');
SELECT is(t.code($$SELECT public.register_lot(9401, 2.5, 1.5, 0)$$), 'invalid_amount', 'half a chicken is not a piece count');
SELECT is(t.code($$SELECT public.register_lot(9401, 3, 0, 0)$$), 'invalid_amount', 'a piece must weigh something');
SELECT is(t.code($$SELECT public.register_lot(9401, 3, 100, 0)$$), 'invalid_amount', 'a piece of 100 kg is a typo');
SELECT is(t.code($$SELECT public.register_lot(9401, 3, 1.5, -1)$$), 'invalid_amount', 'a negative cost is rejected');
SELECT is(t.code($$SELECT public.register_lot(9403, 3, 1.5, 0)$$), 'sale_mode_not_allowed', 'a product priced per piece has no kilo price to multiply');
SELECT is(t.code($$SELECT public.register_lot(9402, 3, 1.5, 0)$$), 'sale_mode_not_allowed', 'a product not sold by the piece takes no piece lots');
SELECT is(t.code($$SELECT public.register_lot(999999, 3, 1.5, 0)$$), 'product_not_found', 'an unknown product is rejected');
SELECT t.reset();
SELECT is((SELECT count(*)::int FROM public.purchase_lots WHERE product_id IN (9401, 9402, 9403)), 2, 'rejected lots left no row');

SELECT t.as_anon();
SELECT is(t.code($$SELECT public.register_lot(9401, 3, 1.5, 0)$$), '42501', 'anon cannot register a lot');
SELECT t.reset();

-- ---------------------------------------------------------------- price from the lot
SELECT t.as_anon();
SELECT results_eq(
    $$SELECT quantity_kg, pieces, line_total_mxn, warnings FROM public.quote_line(9401, 'pieces', 2)$$,
    $$VALUES (3.000::numeric, 2, 225.00::numeric, ARRAY[]::text[])$$,
    '2 chickens come from the old lot: 2 x 1.5 kg x 75 = 225.00');
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn, warnings FROM public.quote_line(9401, 'pieces', 3)$$,
    $$VALUES (4.500::numeric, 337.50::numeric, ARRAY[]::text[])$$,
    '3 chickens still fit in the old lot: 3 x 112.50 = 337.50');
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn, warnings FROM public.quote_line(9401, 'pieces', 4)$$,
    $$VALUES (10.000::numeric, 750.00::numeric, ARRAY[]::text[])$$,
    '4 chickens do not fit in the old lot, so all 4 come from the new one: 4 x 187.50 = 750.00, never mixed');
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn FROM public.quote_line(9401, 'pieces', 1)$$,
    $$VALUES (1.500::numeric, 112.50::numeric)$$,
    'one chicken is $112.50 while the old lot lasts');
SELECT t.reset();

-- The allocation itself: one lot, the oldest that covers the line.
SELECT is(public._lot_allocation(9401, 3) -> 0 ->> 'pieces', '3', 'allocation of 3: one entry of 3 pieces');
SELECT is(jsonb_array_length(public._lot_allocation(9401, 4)), 1, 'allocation of 4: still a single lot');
SELECT is((public._lot_allocation(9401, 4) -> 0 ->> 'piece_weight_kg')::numeric, 2.5, 'allocation of 4: the 2.5 kg lot');
SELECT is(public._lot_allocation(9402, 1), NULL, 'a product without piece lots has no allocation');

-- No single lot covers the line: then, and only then, lots mix, oldest first.
-- 3 left in the old lot, 20 in the new one: 22 chickens = 3 x 1.5 + 19 x 2.5 kg.
SELECT t.as_anon();
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn, warnings FROM public.quote_line(9401, 'pieces', 22)$$,
    $$VALUES (52.000::numeric, 3900.00::numeric, ARRAY['mixed_lots']::text[])$$,
    '22 chickens: 3 x 112.50 + 19 x 187.50 = 3900.00, with the mixed_lots warning');
-- More than every lot holds: the rest is priced with the newest lot and the stock warning shows.
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn, warnings FROM public.quote_line(9401, 'pieces', 25)$$,
    $$VALUES (59.500::numeric, 4462.50::numeric, ARRAY['mixed_lots', 'low_stock']::text[])$$,
    '25 chickens with 23 in stock: 3 x 1.5 + 22 x 2.5 kg, mixed and low on stock');
SELECT t.reset();
SELECT is(jsonb_array_length(public._lot_allocation(9401, 25)), 3, 'the 2 pieces nobody has are their own entry');
SELECT is(public._lot_allocation(9401, 25) -> 2 ->> 'lot_id', NULL, 'and that entry belongs to no lot');

-- A lot with no pieces left is skipped.
UPDATE public.purchase_lots SET pieces_left = 0 WHERE product_id = 9401 AND piece_weight_kg = 1.5;
SELECT t.as_anon();
SELECT results_eq(
    $$SELECT line_total_mxn FROM public.quote_line(9401, 'pieces', 1)$$,
    $$VALUES (187.50::numeric)$$,
    'when the old lot runs out, the next chicken costs 187.50');
SELECT t.reset();

-- ---------------------------------------------------------------- the paths that did not change
-- A cut sold by the piece with a cut spec and no lots still uses the average weight.
SELECT t.as_anon();
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn FROM public.quote_line(9404, 'pieces', 2)$$,
    $$VALUES (0.800::numeric, 640.00::numeric)$$,
    'rib eye with no lots: 2 x 0.400 kg x 800, as before');
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn FROM public.quote_line(9404, 'weight', 1)$$,
    $$VALUES (1.000::numeric, 800.00::numeric)$$,
    'selling by weight is untouched');
SELECT is(t.code($$SELECT * FROM public.quote_line(9401, 'weight', 1)$$), 'sale_mode_not_allowed',
          'the chicken is still not sold by weight');
SELECT t.reset();

-- A product with lots AND a cut spec: the lot wins, and the thickness still scales it.
SELECT t.as_django();
SELECT public.register_lot(9405, 6, 0.350, 0);
SELECT t.reset();
SELECT t.as_anon();
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn FROM public.quote_line(9405, 'pieces', 2)$$,
    $$VALUES (0.700::numeric, 63.00::numeric)$$,
    'pierna: 2 x 0.350 kg of the lot x 90, not the 0.300 of the cut spec');
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn FROM public.quote_line(9405, 'pieces', 2, NULL, 2.00)$$,
    $$VALUES (1.400::numeric, 126.00::numeric)$$,
    'a double thickness doubles the lot weight');
SELECT t.reset();

-- A product with lots and no cut spec ignores a thickness instead of failing.
SELECT t.as_anon();
SELECT results_eq(
    $$SELECT line_total_mxn, warnings FROM public.quote_line(9401, 'pieces', 1, NULL, 1.5)$$,
    $$VALUES (187.50::numeric, ARRAY['thickness_ignored']::text[])$$,
    'a whole chicken has no thickness: it is ignored with a warning');
SELECT t.reset();

-- quote_cart carries the new warning through unchanged.
SELECT t.as_anon();
SELECT is(public.quote_cart('[{"product_id":9401,"mode":"pieces","amount":4}]'::jsonb) ->> 'total_mxn', '750.00',
          'the cart totals the chickens from the new lot');
SELECT t.reset();

SELECT * FROM finish();
ROLLBACK;
