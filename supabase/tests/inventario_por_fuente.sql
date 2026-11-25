-- inventario_por_fuente (migration 20261125000001_inventario_por_fuente.sql). WRITTEN, NOT RUN.
--
-- Rules (odd/tasks/rediseno-moderno.md, S14.1-3 and S14.6, decisions of L25), with Eduardo's
-- examples: "el lunes llega una pierna de puerco de 10 kg, con costo/kg, proveedor y fecha";
-- "3 kg a molida y 3 kg a molida mixta"; a sale deducts exactly the grams sold; by piece,
-- pieces x standard weight ("100 g ±5 g"); the source never goes below zero.
--
-- Products (ids 9600+): 9601 pierna de puerco (source, kg), 9602 bistec de pierna (kg, source
-- 9601), 9603 molida (kg, source 9601), 9604 molida mixta (kg, source 9601), 9605 milanesa
-- (priced per piece, source 9601, 0.100 kg a piece), 9606 rib eye (kg, no source, own stock 2 kg).

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_product(9601, 'Pierna de puerco F', 150, 'kg', ARRAY['money','weight'], 0, true);
SELECT t.mk_product(9602, 'Bistec de pierna F', 190);
SELECT t.mk_product(9603, 'Molida F', 170);
SELECT t.mk_product(9604, 'Molida mixta F', 160);
SELECT t.mk_product(9605, 'Milanesa F', 20, 'piece', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9606, 'Rib eye F', 800, 'kg', ARRAY['money','weight'], 2, true);
SELECT t.mk_cutspec(9605, 0.100);
UPDATE public.product_cut_specs SET piece_tolerance_kg = 0.005 WHERE product_id = 9605;
UPDATE public.products SET source_product_id = 9601 WHERE id IN (9602, 9603, 9604, 9605);

CREATE FUNCTION t.stock(p_id int) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT stock FROM public.products WHERE id = p_id
$$;
-- An order placed as django: items as [[product_id, mode, amount], ...].
CREATE FUNCTION t.order_of(p_lines jsonb) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
    v_items jsonb := '[]'::jsonb;
    v_line  jsonb;
    v_id    uuid;
BEGIN
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
        v_items := v_items || jsonb_build_object('product_id', v_line ->> 0, 'mode', v_line ->> 1,
                                                 'amount', v_line ->> 2);
    END LOOP;
    PERFORM t.as_django();
    v_id := public.create_order_staff(v_items, 'Cliente de fuentes');
    PERFORM t.reset();
    RETURN v_id;
END $$;
CREATE FUNCTION t.move(p_order uuid, p_status text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v_code text;
BEGIN
    PERFORM t.as_django();
    v_code := t.code(format('SELECT public.set_order_status(%L, %L, %L)', p_order, p_status, 'tester'));
    PERFORM t.reset();
    RETURN v_code;
END $$;

-- ---------------------------------------------------------------- shape and privileges
SELECT is(t.col('products', 'source_product_id'), 'integer', 'products.source_product_id exists');
SELECT is(t.col('purchase_lots', 'supplier'), 'text', 'purchase_lots.supplier exists');
SELECT ok(NOT t.can_exec('anon', 'public.record_shrink(integer, numeric, text, text, text)'),
          'anon cannot record shrink');
SELECT ok(NOT t.can_exec('authenticated', 'public.cut_source(integer, jsonb, text, text)'),
          'a signed-in customer cannot cut a source');
SELECT ok(t.can_exec('django', 'public.record_stock_count(integer, numeric, text, text)'),
          'django records counts');
SELECT is(t.privs('anon', 'stock_counts'), '', 'anon reads no counts');
SELECT is(t.code($$UPDATE public.products SET source_product_id = 9602 WHERE id = 9603$$),
          'P0001', 'a source cannot have a source (one level)');
SELECT is(t.code($$UPDATE public.products SET source_product_id = 9606 WHERE id = 9606$$),
          '23514', 'a product cannot be its own source');

-- ---------------------------------------------------------------- S14.1 entry of the pierna
SELECT t.as_django();
SELECT ok(public.register_source_entry(9601, 10, 1200, 'Proveedor Prueba', 'lunes') > 0,
          'the 10 kg pierna enters with cost and supplier');
SELECT t.reset();
SELECT is(t.stock(9601), 10.000::numeric, 'the 10 kg stay on the source, unsplit');
SELECT is((SELECT supplier FROM public.purchase_lots WHERE product_id = 9601), 'Proveedor Prueba',
          'the lot remembers its supplier');

-- ---------------------------------------------------------------- S14.2 deferred split
SELECT is(t.move(t.order_of('[[9602, "weight", "1"]]'), 'confirmed'), '',
          'a sale of 1 kg of bistec is confirmed');
SELECT is(t.stock(9601), 9.000::numeric, 'it takes exactly 1 kg from the pierna');
SELECT is((SELECT via_product_id FROM public.stock_movements
           WHERE product_id = 9601 AND reason = 'sale'), 9602,
          'the source movement names the product sold');

SELECT is(t.move(t.order_of('[[9605, "pieces", "3"]]'), 'confirmed'), '',
          'three milanesas are confirmed');
SELECT is(t.stock(9601), 8.700::numeric, 'they take 3 x 0.100 kg from the pierna');

-- ---------------------------------------------------------------- S14.2 explicit cut
SELECT t.as_django();
SELECT is(public.cut_source(9601, '[{"product_id": 9603, "kg": "3"}, {"product_id": 9604, "kg": "3"}]',
                            'ya cortado', 'carnicero'),
          2.700::numeric, '3 kg to molida and 3 kg to molida mixta leave 2.7 kg');
SELECT is(t.code($$SELECT public.cut_source(9601, '[{"product_id": 9603, "kg": "5"}]')$$),
          'P0001', 'a cut above the source is refused');
SELECT t.reset();
SELECT is(t.stock(9603), 3.000::numeric, 'molida holds its 3 kg');

SELECT is(t.move(t.order_of('[[9603, "weight", "4"]]'), 'confirmed'), '',
          '4 kg of molida: 3 from its own stock, 1 from the pierna');
SELECT is(t.stock(9603), 0.000::numeric, 'molida used its own 3 kg first');
SELECT is(t.stock(9601), 1.700::numeric, 'and the pierna gave the last kilo');

SELECT is(t.move(t.order_of('[[9602, "weight", "2"]]'), 'confirmed'), 'P0001',
          'a sale above own stock plus source is refused');
SELECT is(t.stock(9601), 1.700::numeric, 'and the pierna never goes negative');
SELECT is(t.move(t.order_of('[[9606, "weight", "3"]]'), 'confirmed'), 'P0001',
          'a product without a source keeps the old rule: only its own stock');

-- Cancel: the kilos go back to the source they came from.
CREATE TEMP TABLE cancel_me AS SELECT t.order_of('[[9602, "weight", "1"]]') AS id;
SELECT is(t.move((SELECT id FROM cancel_me), 'confirmed'), '', 'another kilo of bistec');
SELECT is(t.move((SELECT id FROM cancel_me), 'cancelled'), '', 'and it is cancelled');
SELECT is(t.stock(9601), 1.700::numeric, 'the kilo is back on the pierna');

-- ---------------------------------------------------------------- S14.3 shrink and count
SELECT t.as_django();
SELECT is(t.code($$SELECT public.record_shrink(9601, 0.2, 'stolen', 'x', 'carnicero')$$), 'P0001',
          'an unknown shrink kind is refused');
SELECT is(t.code($$SELECT public.record_shrink(9601, 0.2, 'drying', ' ', 'carnicero')$$), 'P0001',
          'a shrink without a note is refused');
SELECT is(public.record_shrink(9601, 0.2, 'drying', 'oreo 24 h', 'carnicero'), 1.500::numeric,
          'drying of 200 g lowers the pierna');
SELECT is(t.code($$SELECT public.record_shrink(9601, 5, 'expiry', 'caducó', 'carnicero')$$), 'P0001',
          'a shrink never leaves the stock below zero');
SELECT is(t.code($$SELECT public.record_stock_count(9601, 1.4, '', 'carnicero')$$), 'P0001',
          'a count 6.67 % off without a note is refused (above 5 %)');
SELECT ok(public.record_stock_count(9601, 1.4, 'merma no explicada', 'carnicero') > 0,
          'with a note it is recorded');
SELECT t.reset();
SELECT is(t.stock(9601), 1.400::numeric, 'the stock becomes what was counted');
SELECT is((SELECT variance_pct FROM public.stock_counts WHERE product_id = 9601), -6.67::numeric,
          'the count keeps the variance percentage');

SELECT t.as_django();
SELECT ok(jsonb_array_length(public.panel_source_reconciliation(
              (now() AT TIME ZONE 'America/Mexico_City')::date)) >= 1,
          'the reconciliation of today has a row for the pierna');
SELECT t.reset();

SELECT * FROM finish();
ROLLBACK;
