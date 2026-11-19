-- despiece (migration 20261119000002_despiece.sql): cut pieces of a lot into other products.
--
-- Rule (odd/tasks/carrito-trifasico.md, S11): from the panel, pieces of a lot leave that
-- product and become lots of other products, with their own weight per piece. Eduardo's
-- example with 3 chickens of the old lot: 3 breasts go to "pechuga para bistec", 6 legs with
-- thigh go to "piernas" by the piece, 6 wings go to "alitas adobadas". The new lots remember
-- the lot they were cut from, and the rule of one lot per line (S5) applies to them too.
--
-- Products (ids 9000+): 9501 pollo entero ($75/kg, stock in pieces), 9502 pechuga para bistec
-- ($160/kg), 9503 piernas ($90/kg), 9504 alitas adobadas ($120/kg), 9505 molida (kg, not sold
-- by the piece), 9506 camiseta (priced per piece), 9507 rib eye (kg, stock in kilos).

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_product(9501, 'Pollo entero D', 75, 'kg', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9502, 'Pechuga para bistec D', 160, 'kg', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9503, 'Piernas D', 90, 'kg', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9504, 'Alitas adobadas D', 120, 'kg', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9505, 'Molida D', 140);
SELECT t.mk_product(9506, 'Camiseta D', 250, 'piece', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9507, 'Rib eye D', 800, 'kg', ARRAY['money','weight','pieces']);

SELECT t.as_django();
SELECT public.register_lot(9501, 3, 1.5, 300, 'semana pasada');
SELECT public.register_lot(9507, 4, 0.5, 1200);
SELECT t.reset();

CREATE FUNCTION t.old_lot() RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT id FROM public.purchase_lots WHERE product_id = 9501 ORDER BY id LIMIT 1
$$;
CREATE FUNCTION t.fpd() RETURNS text LANGUAGE sql AS $$
    SELECT concat_ws('|',
        (SELECT count(*) FROM public.purchase_lots),
        (SELECT count(*) FROM public.stock_movements),
        (SELECT sum(pieces_left) FROM public.purchase_lots WHERE pieces_left IS NOT NULL),
        (SELECT sum(stock) FROM public.products WHERE id BETWEEN 9501 AND 9507))
$$;

-- ---------------------------------------------------------------- shape and privileges
SELECT ok(t.can_exec('django', 'cut_lot(bigint,numeric,jsonb,text,text)'), 'django cuts lots');
SELECT ok(NOT t.can_exec(r, 'cut_lot(bigint,numeric,jsonb,text,text)'), r || ' cannot cut lots')
  FROM unnest(ARRAY['anon', 'authenticated']) AS r;
SELECT is(t.code($$INSERT INTO public.stock_movements (product_id, delta, reason) VALUES (9501, 1, 'cut')$$), '',
          'a stock movement can say it came from a cut');

-- ---------------------------------------------------------------- rejections leave nothing
SELECT t.fpd() AS before \gset
SELECT t.as_django();
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 4, '[{"product_id":9503,"pieces":8,"piece_weight_kg":0.3}]')$$, t.old_lot())),
          'insufficient_stock', 'the lot has 3 chickens: 4 cannot be cut');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 0, '[{"product_id":9503,"pieces":2,"piece_weight_kg":0.3}]')$$, t.old_lot())),
          'invalid_amount', 'cutting zero chickens is rejected');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1.5, '[{"product_id":9503,"pieces":2,"piece_weight_kg":0.3}]')$$, t.old_lot())),
          'invalid_amount', 'half a chicken is not a piece count');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[]')$$, t.old_lot())),
          'invalid_items', 'a cut produces at least one product');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '{"product_id":9503}')$$, t.old_lot())),
          'invalid_items', 'the outputs are a list');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9501,"pieces":1,"piece_weight_kg":1}]')$$, t.old_lot())),
          'invalid_items', 'a lot is not cut into its own product');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9505,"pieces":1,"piece_weight_kg":1}]')$$, t.old_lot())),
          'sale_mode_not_allowed', 'the output must be sold by the piece');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9506,"pieces":1,"piece_weight_kg":1}]')$$, t.old_lot())),
          'sale_mode_not_allowed', 'the output must be priced per kilo');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":999999,"pieces":1,"piece_weight_kg":1}]')$$, t.old_lot())),
          'product_not_found', 'an unknown output product is rejected');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9503,"pieces":0,"piece_weight_kg":0.3}]')$$, t.old_lot())),
          'invalid_amount', 'an output of zero pieces is rejected');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9503,"pieces":2,"piece_weight_kg":0}]')$$, t.old_lot())),
          'invalid_amount', 'an output piece must weigh something');
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9503,"pieces":2}]')$$, t.old_lot())),
          'invalid_amount', 'an output without a weight is rejected');
SELECT is(t.code($$SELECT public.cut_lot(999999, 1, '[{"product_id":9503,"pieces":2,"piece_weight_kg":0.3}]')$$),
          'lot_not_found', 'an unknown lot is rejected');
SELECT t.reset();
SELECT is(t.fpd(), :'before', 'no rejected cut changed lots, movements, pieces or stock');

-- A lot bought by weight (no pieces) cannot be cut by the piece.
SELECT t.as_django();
SELECT public.register_purchase(9505, 10, 1000);
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9503,"pieces":1,"piece_weight_kg":0.3}]')$$,
                        (SELECT max(id) FROM public.purchase_lots WHERE product_id = 9505))),
          'lot_not_found', 'a lot without pieces is not a piece lot');
SELECT t.reset();

SELECT t.as_anon();
SELECT is(t.code(format($$SELECT public.cut_lot(%s, 1, '[{"product_id":9503,"pieces":2,"piece_weight_kg":0.3}]')$$, t.old_lot())),
          '42501', 'anon cannot cut a lot');
SELECT t.reset();

-- ---------------------------------------------------------------- Eduardo's cut
SELECT t.as_django();
SELECT is(jsonb_array_length(public.cut_lot(t.old_lot(), 3, '[
    {"product_id": 9502, "pieces": 3, "piece_weight_kg": 0.5},
    {"product_id": 9503, "pieces": 6, "piece_weight_kg": 0.3},
    {"product_id": 9504, "pieces": 6, "piece_weight_kg": 0.1}]'::jsonb, 'despiece del lote viejo', 'hermana')), 3,
    'the 3 old chickens become three new lots');
SELECT t.reset();

SELECT is((SELECT pieces_left FROM public.purchase_lots WHERE id = t.old_lot()), 0, 'the old lot has no chickens left');
SELECT is((SELECT stock FROM public.products WHERE id = 9501), 0.000::numeric, 'the chicken stock goes down by 3');
SELECT is((SELECT delta::text || '|' || reason FROM public.stock_movements
            WHERE product_id = 9501 AND lot_id = t.old_lot() AND reason = 'cut'), '-3.000|cut',
          'the chicken leaves with one cut movement');

SELECT results_eq(
    $$SELECT product_id, pieces_left, piece_weight_kg, qty, source_lot_id = t.old_lot()
        FROM public.purchase_lots WHERE source_lot_id IS NOT NULL ORDER BY product_id$$,
    $$VALUES (9502, 3, 0.500::numeric(6,3), 3.000::numeric(10,3), true),
             (9503, 6, 0.300::numeric(6,3), 6.000::numeric(10,3), true),
             (9504, 6, 0.100::numeric(6,3), 6.000::numeric(10,3), true)$$,
    'each product gets its own lot, by the piece, pointing at the old chicken lot');
SELECT is((SELECT array_agg(price_per_kg ORDER BY product_id)::text FROM public.purchase_lots WHERE source_lot_id = t.old_lot()),
          '{160.00,90.00,120.00}', 'each new lot keeps the price per kilo of its product that day');
SELECT is((SELECT sum(total_cost) FROM public.purchase_lots WHERE source_lot_id = t.old_lot()), 300.00::numeric,
          'the cost of the 3 chickens is shared among the new lots, to the cent');
SELECT results_eq(
    $$SELECT id, stock FROM public.products WHERE id IN (9502, 9503, 9504) ORDER BY id$$,
    $$VALUES (9502, 3.000::numeric), (9503, 6.000::numeric), (9504, 6.000::numeric)$$,
    'the stock of each product grows by its pieces');
SELECT is((SELECT count(*)::int FROM public.stock_movements m JOIN public.purchase_lots l ON l.id = m.lot_id
            WHERE l.source_lot_id = t.old_lot() AND m.reason = 'cut' AND m.delta > 0), 3,
          'one cut movement in for each new lot');
SELECT ok((SELECT bool_and(track_stock) FROM public.products WHERE id IN (9502, 9503, 9504)), 'the new products track stock');

-- The legs are sold by the piece from their own lot.
SELECT t.as_anon();
SELECT results_eq(
    $$SELECT quantity_kg, line_total_mxn, warnings FROM public.quote_line(9503, 'pieces', 2)$$,
    $$VALUES (0.600::numeric, 54.00::numeric, ARRAY[]::text[])$$,
    'two legs: 2 x 0.3 kg x 90 = 54.00');
SELECT t.reset();

-- A lot counted in kilos: the stock goes down by the kilos of the pieces cut.
SELECT t.as_django();
SELECT public.cut_lot((SELECT id FROM public.purchase_lots WHERE product_id = 9507 AND source_lot_id IS NULL),
                      1, '[{"product_id": 9503, "pieces": 2, "piece_weight_kg": 0.2}]'::jsonb);
SELECT t.reset();
SELECT is((SELECT stock FROM public.products WHERE id = 9507), 1.500::numeric, 'rib eye in kilos: 2.0 - 0.5 kg');
SELECT is((SELECT pieces_left FROM public.purchase_lots WHERE product_id = 9507 AND source_lot_id IS NULL), 3,
          'one of the 4 rib eyes was cut');

-- ---------------------------------------------------------------- panel_open_lots
SELECT ok(has_table_privilege('django', 'public.panel_open_lots', 'SELECT'), 'django reads the open lots');
SELECT ok(NOT has_table_privilege(r, 'public.panel_open_lots', 'SELECT'), r || ' cannot read the open lots')
  FROM unnest(ARRAY['anon', 'authenticated']) AS r;
SELECT t.as_django();
SELECT results_eq(
    $$SELECT product_name, pieces_left, piece_weight_kg, price_per_piece
        FROM public.panel_open_lots WHERE product_id IN (9501, 9503) ORDER BY lot_id$$,
    $$VALUES ('Piernas D'::text, 6, 0.300::numeric(6,3), 27.00::numeric(12,2)),
             ('Piernas D'::text, 2, 0.200::numeric(6,3), 18.00::numeric(12,2))$$,
    'the emptied chicken lot is gone; each leg lot shows its pieces and the price of one leg');
SELECT t.reset();

SELECT * FROM finish();
ROLLBACK;
