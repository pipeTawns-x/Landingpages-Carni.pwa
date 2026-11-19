-- lote_al_confirmar (migration 20261119000003_lote_al_confirmar.sql): confirming an order takes
-- its pieces out of the lots, and cancelling a confirmed order puts them back.
--
-- Rule (odd/tasks/carrito-trifasico.md, S4-S5): an order is served from ONE lot, the oldest one
-- that covers it; only when no single lot covers it are lots mixed, oldest first. The whole order
-- is allocated at once per product, so two lines of the same product are one need.
-- The price stays the one quoted when the order was created; the allocation records the weight
-- of the pieces actually served, so the panel can see when it changed.
--
-- Products (ids 9600+): 9601 pollo entero (kg price, stock in pieces, sold by the piece),
-- 9602 pierna (kg price, stock in kilos, sold by the piece), 9603 bistec (cut spec, no lots).

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_product(9601, 'Pollo entero C', 75, 'kg', ARRAY['pieces'], 0, false, 'piece');
SELECT t.mk_product(9602, 'Pierna C', 90, 'kg', ARRAY['pieces'], 0, false, 'kg');
SELECT t.mk_product(9603, 'Bistec C', 200, 'kg', ARRAY['money', 'weight', 'pieces'], 10, true, 'kg');
SELECT t.mk_cutspec(9603, 0.150);

-- Names for the lots, so the expectations read like the shop talks: A is the old bag.
CREATE TABLE t.lot_name (id bigint PRIMARY KEY, name text NOT NULL);

CREATE FUNCTION t.lot(p_product int, p_pieces int, p_weight numeric, p_name text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v_id bigint;
BEGIN
    PERFORM t.as_django();
    v_id := public.register_lot(p_product, p_pieces, p_weight, 0, NULL, 'tester');
    PERFORM t.reset();
    INSERT INTO t.lot_name VALUES (v_id, p_name);
END $$;

-- A pending staff order. p_lines is '[[product, pieces], ...]'.
CREATE FUNCTION t.order(p_lines jsonb) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
    v_items jsonb := '[]'::jsonb;
    v_line  jsonb;
    v_id    uuid;
BEGIN
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
        v_items := v_items || jsonb_build_object('product_id', v_line ->> 0, 'mode', 'pieces',
                                                 'amount', v_line ->> 1);
    END LOOP;
    PERFORM t.as_django();
    v_id := public.create_order_staff(v_items, 'Cliente de lotes');
    PERFORM t.reset();
    RETURN v_id;
END $$;

-- Moves an order as django: '' or the error code.
CREATE FUNCTION t.move(p_order uuid, p_status text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v_code text;
BEGIN
    PERFORM t.as_django();
    v_code := t.code(format('SELECT public.set_order_status(%L, %L, %L)', p_order, p_status, 'tester'));
    PERFORM t.reset();
    RETURN v_code;
END $$;

-- Which lots served each line, in line order: 'A×2 | B×1 + C×3'.
CREATE FUNCTION t.served(p_order uuid) RETURNS text LANGUAGE sql AS $$
    SELECT coalesce(string_agg(s.x, ' | ' ORDER BY s.item), '')
    FROM (SELECT oi.id AS item, string_agg(n.name || '×' || a.pieces, ' + ' ORDER BY a.id) AS x
            FROM public.order_items oi
            JOIN public.order_item_lots a ON a.order_item_id = oi.id
            JOIN t.lot_name n ON n.id = a.lot_id
           WHERE oi.order_id = p_order
           GROUP BY oi.id) s
$$;

-- Pieces left in the named lots of a product: 'A=3 B=20'.
CREATE FUNCTION t.left(p_product int) RETURNS text LANGUAGE sql AS $$
    SELECT string_agg(n.name || '=' || l.pieces_left, ' ' ORDER BY l.id)
    FROM public.purchase_lots l JOIN t.lot_name n ON n.id = l.id
    WHERE l.product_id = p_product
$$;

-- ---------------------------------------------------------------- shape and privileges
SELECT is(t.col('order_item_lots', 'order_item_id'), 'integer|NOT NULL|', 'an allocation belongs to an order line');
SELECT is(t.col('order_item_lots', 'lot_id'), 'bigint|NOT NULL|', 'and to the lot that served it');
SELECT is(t.col('order_item_lots', 'pieces'), 'integer|NOT NULL|', 'it counts whole pieces');
SELECT is(t.col('order_item_lots', 'piece_weight_kg'), 'numeric(6,3)|NOT NULL|', 'it keeps the weight of the pieces served');
SELECT is(t.col('order_item_lots', 'returned'), 'boolean|NOT NULL|false', 'and whether a cancel put them back');
SELECT ok((SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = 'public.order_item_lots'::regclass), 'RLS is on');
SELECT ok(NOT has_table_privilege(r, 'public.order_item_lots', 'SELECT'), r || ' cannot read the allocations')
  FROM unnest(ARRAY['anon', 'authenticated']) AS r;
SELECT ok(has_table_privilege('django', 'public.order_item_lots', 'SELECT'), 'django reads the allocations');
SELECT ok(NOT has_table_privilege('django', 'public.order_item_lots', 'INSERT'), 'django does not write them directly');
SELECT ok(NOT t.can_exec(r, f), r || ' cannot call ' || f)
  FROM unnest(ARRAY['anon', 'authenticated', 'django', 'service_role']) AS r,
       unnest(ARRAY['_take_order_lots(uuid)', '_return_order_lots(uuid)']) AS f;

-- ---------------------------------------------------------------- one lot per order
SELECT t.lot(9601, 3, 1.5, 'A');
SELECT t.lot(9601, 20, 2.5, 'B');

SELECT t.order('[[9601, 2]]') AS o1 \gset
SELECT is(t.served(:'o1'), '', 'a pending order takes nothing from the lots');
SELECT is(t.left(9601), 'A=3 B=20', 'the lots are untouched while the order waits');
SELECT is(t.move(:'o1', 'confirmed'), '', 'the order is confirmed');
SELECT is(t.served(:'o1'), 'A×2', 'two chickens come from the old bag, which covers them');
SELECT is(t.left(9601), 'A=1 B=20', 'the old bag keeps 1');
SELECT is((SELECT a.piece_weight_kg FROM public.order_item_lots a JOIN public.order_items oi ON oi.id = a.order_item_id
            WHERE oi.order_id = :'o1'), 1.500::numeric(6,3), 'the allocation records 1.5 kg a piece');
SELECT is((SELECT stock FROM public.products WHERE id = 9601), 21.000::numeric, 'stock still goes down by 2');

SELECT t.order('[[9601, 4]]') AS o2 \gset
SELECT is(t.move(:'o2', 'confirmed'), '', 'an order of 4 is confirmed');
SELECT is(t.served(:'o2'), 'B×4', 'Eduardo''s rule: the old bag has 1, so all 4 come from the new bag');
SELECT is(t.left(9601), 'A=1 B=16', 'the old bag is untouched');

-- ---------------------------------------------------------------- the whole order at once
SELECT t.order('[[9601, 1], [9601, 1]]') AS o3 \gset
SELECT is(t.move(:'o3', 'confirmed'), '', 'two lines of one chicken each are confirmed');
SELECT is(t.served(:'o3'), 'B×1 | B×1', 'together they need 2, which only the new bag covers: no mixed sizes');
SELECT is(t.left(9601), 'A=1 B=14', 'the old bag still keeps its one chicken');

-- ---------------------------------------------------------------- mixing only when no lot covers it
SELECT t.order('[[9601, 15]]') AS o4 \gset
SELECT is(t.move(:'o4', 'confirmed'), '', 'an order of 15 is confirmed');
SELECT is(t.served(:'o4'), 'A×1 + B×14', 'no lot covers 15, so the oldest go first');
SELECT is(t.left(9601), 'A=0 B=0', 'both bags are empty');
SELECT is((SELECT stock FROM public.products WHERE id = 9601), 0.000::numeric, 'and so is the stock');

SELECT t.lot(9601, 4, 2.0, 'D');
SELECT t.lot(9601, 5, 2.2, 'E');
SELECT t.order('[[9601, 2], [9601, 5]]') AS o5 \gset
SELECT is(t.move(:'o5', 'confirmed'), '', 'an order of 2 + 5 is confirmed');
SELECT is(t.served(:'o5'), 'D×2 | D×2 + E×3', 'no lot covers 7: D gives its 4 first, E the other 3, line by line');
SELECT is(t.left(9601), 'A=0 B=0 D=0 E=2', 'E keeps 2');

-- ---------------------------------------------------------------- cancelling puts the pieces back
SELECT is(t.move(:'o5', 'cancelled'), '', 'the confirmed order is cancelled');
SELECT is(t.left(9601), 'A=0 B=0 D=4 E=5', 'every piece goes back to the lot it came from');
SELECT is((SELECT bool_and(a.returned) FROM public.order_item_lots a JOIN public.order_items oi ON oi.id = a.order_item_id
            WHERE oi.order_id = :'o5'), true, 'the allocation is kept and marked as returned');
SELECT is((SELECT stock FROM public.products WHERE id = 9601), 9.000::numeric, 'the stock comes back too');

SELECT t.order('[[9601, 1]]') AS o6 \gset
SELECT is(t.move(:'o6', 'cancelled'), '', 'a pending order is cancelled');
SELECT is(t.left(9601), 'A=0 B=0 D=4 E=5', 'it had taken nothing, so nothing moves');

-- ---------------------------------------------------------------- the quoted price stays
SELECT t.order('[[9601, 4]]') AS p1 \gset
SELECT t.order('[[9601, 4]]') AS p2 \gset
SELECT is((SELECT subtotal FROM public.order_items WHERE order_id = :'p2'), 600.00::numeric,
          'both waiting orders were quoted from D: 4 x 2.0 kg x $75 = $600');
SELECT is(t.move(:'p1', 'confirmed'), '', 'the first one is confirmed');
SELECT is(t.served(:'p1'), 'D×4', 'and takes D');
SELECT is(t.move(:'p2', 'confirmed'), '', 'the second one is confirmed');
SELECT is(t.served(:'p2'), 'E×4', 'D is gone, so it is served from E');
SELECT is((SELECT subtotal FROM public.order_items WHERE order_id = :'p2'), 600.00::numeric,
          'the customer pays what was quoted');
SELECT is((SELECT a.piece_weight_kg FROM public.order_item_lots a JOIN public.order_items oi ON oi.id = a.order_item_id
            WHERE oi.order_id = :'p2'), 2.200::numeric(6,3), 'the allocation shows the pieces weigh 2.2 kg, not 2.0');

-- ---------------------------------------------------------------- what the panel reads
SELECT is((SELECT string_agg(column_name::text, ',' ORDER BY ordinal_position) FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'panel_order_lots'),
          'order_id,line_no,product_id,product_name,lot_id,pieces,piece_weight_kg,returned',
          'panel_order_lots has the agreed columns, in order');
SELECT is((SELECT string_agg(v.line_no || ':' || n.name || '×' || v.pieces || '@' || v.piece_weight_kg || ':' || v.returned,
                             ' ' ORDER BY v.line_no, v.lot_id)
             FROM public.panel_order_lots v JOIN t.lot_name n ON n.id = v.lot_id WHERE v.order_id = :'o5'),
          '1:D×2@2.000:true 2:D×2@2.000:true 2:E×3@2.200:true',
          'the panel sees each line with its lots, weights and that they were returned');
SELECT is((SELECT v.product_name FROM public.panel_order_lots v WHERE v.order_id = :'p2'), 'Pollo entero C',
          'with the product name');
SELECT ok(has_table_privilege('django', 'public.panel_order_lots', 'SELECT'), 'django reads panel_order_lots');
SELECT ok(NOT has_table_privilege(r, 'public.panel_order_lots', 'SELECT'), r || ' cannot read panel_order_lots')
  FROM unnest(ARRAY['anon', 'authenticated']) AS r;
SELECT t.as_django();
SELECT ok((SELECT count(*) FROM public.panel_order_lots) > 0, 'as django the view returns rows');
SELECT t.reset();

-- ---------------------------------------------------------------- stock that is not in any lot
UPDATE public.products SET stock = stock + 5 WHERE id = 9601;
SELECT t.order('[[9601, 3]]') AS o7 \gset
SELECT is(t.move(:'o7', 'confirmed'), '', 'an order larger than every lot still confirms when the stock covers it');
SELECT is(t.served(:'o7'), 'E×1', 'the lots give what they have; the rest is stock counted without a lot');
SELECT is(t.left(9601), 'A=0 B=0 D=0 E=0', 'no lot goes below zero');

-- ---------------------------------------------------------------- products without lots and kilo stock
SELECT t.order('[[9603, 2]]') AS o8 \gset
SELECT is(t.move(:'o8', 'confirmed'), '', 'a cut without lots is confirmed as before');
SELECT is((SELECT count(*) FROM public.order_item_lots a JOIN public.order_items oi ON oi.id = a.order_item_id
            WHERE oi.order_id = :'o8'), 0::bigint, 'and takes no lot');
SELECT is((SELECT stock FROM public.products WHERE id = 9603), 9.700::numeric, 'its stock goes down by 2 x 0.150 kg');

SELECT t.lot(9602, 6, 0.3, 'P');
SELECT t.order('[[9602, 2]]') AS o9 \gset
SELECT is(t.move(:'o9', 'confirmed'), '', 'two legs counted in kilos are confirmed');
SELECT is(t.served(:'o9'), 'P×2', 'they come from the leg lot');
SELECT is(t.left(9602), 'P=4', 'the lot keeps 4 pieces');
SELECT is((SELECT stock FROM public.products WHERE id = 9602), 1.200::numeric, 'and the stock 1.8 - 0.6 kg');

SELECT t.order('[[9602, 5]]') AS o10 \gset
SELECT is(t.move(:'o10', 'confirmed'), 'insufficient_stock', '5 legs weigh 1.5 kg and only 1.2 are left');
SELECT is(t.left(9602), 'P=4', 'a refused confirm leaves the lot as it was');
SELECT is(t.served(:'o10'), '', 'and records no allocation');

SELECT * FROM finish();
ROLLBACK;
