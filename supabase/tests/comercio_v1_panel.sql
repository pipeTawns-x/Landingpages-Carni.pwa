-- A3: purchases, stock adjustments, exchange rate, KPIs and panel views
-- (migration 20261113000003_comercio_v1_panel.sql).
--
-- Covers register_purchase (stock, cost, expected revenue, yield), adjust_stock, the two
-- exchange-rate RPCs, panel_kpis (exact JSON shape, Mexico City day buckets, windows, margin),
-- the panel_orders and panel_purchase_performance views, and that only django reaches any of it.
--
-- Users: admin ...a1, customer ...c1. Products (ids 9000+): 9301 bistec (200/kg), 9302 chuleta
-- (kg, cost with yield 80), 9303 camiseta (250/piece, stock in pieces), 9311-9317 KPI products.

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_user('00000000-0000-0000-0000-0000000000a1', 'Admin Test', true);
SELECT t.mk_user('00000000-0000-0000-0000-0000000000c1', 'Cliente Uno');
SELECT t.mk_product(9301, 'Bistec A3', 200);
SELECT t.mk_product(9302, 'Chuleta A3', 100);
SELECT t.mk_product(9303, 'Camiseta A3', 250, 'piece', ARRAY['pieces'], 0, false, 'piece');

-- Counts and totals that no rejected call may change.
CREATE FUNCTION t.fp3() RETURNS text LANGUAGE sql AS $$
    SELECT concat_ws('|',
        (SELECT count(*) FROM public.purchase_lots),
        (SELECT count(*) FROM public.stock_movements),
        (SELECT count(*) FROM public.product_costs),
        (SELECT count(*) FROM public.fx_rates),
        (SELECT coalesce(sum(stock), 0) FROM public.products),
        (SELECT count(*) FROM public.products WHERE track_stock))
$$;

-- An order of one product at an exact moment, with an optional frozen cost.
CREATE FUNCTION t.kpi_order(p_created timestamptz, p_status text, p_total numeric, p_product int,
                            p_kg numeric, p_cost numeric DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
    v      uuid := gen_random_uuid();
    v_item int;
BEGIN
    INSERT INTO public.orders (id, total, delivery_type, status, channel, customer_name, created_at)
    VALUES (v, p_total, 'pickup', p_status, 'mostrador', 'K', p_created);
    INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, sale_mode)
    VALUES (v, p_product, p_kg, round(p_total / p_kg, 2), p_total, 'weight')
    RETURNING id INTO v_item;
    IF p_cost IS NOT NULL THEN
        INSERT INTO public.order_item_costs (order_item_id, cost_per_kg_frozen, yield_pct_frozen, total_cost_frozen)
        VALUES (v_item, round(p_cost / p_kg, 4), 100, p_cost);
    END IF;
    RETURN v;
END $$;

-- ================================================================ who may call what
SELECT is(t.can_exec(r, s), r = 'django', r || ' / ' || s || ': django only')
FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r,
     unnest(ARRAY['register_purchase(integer,numeric,numeric,text,text)',
                  'adjust_stock(integer,numeric,text,text)',
                  'set_manual_fx_rate(numeric,numeric,text)',
                  'record_fx_rate(numeric,text,date)',
                  'panel_kpis()']) AS s;
SELECT is((SELECT p.prosecdef AND p.proconfig = ARRAY['search_path=""'] FROM pg_proc p WHERE p.oid = ('public.' || f)::regprocedure), true,
          f || ' is SECURITY DEFINER with an empty search_path')
FROM unnest(ARRAY['register_purchase(integer,numeric,numeric,text,text)', 'adjust_stock(integer,numeric,text,text)',
                  'set_manual_fx_rate(numeric,numeric,text)', 'record_fx_rate(numeric,text,date)', 'panel_kpis()']) AS f;
SELECT is((SELECT prorettype::regtype::text FROM pg_proc WHERE oid = 'public.register_purchase(integer,numeric,numeric,text,text)'::regprocedure), 'bigint', 'register_purchase returns bigint');
SELECT is((SELECT prorettype::regtype::text FROM pg_proc WHERE oid = 'public.adjust_stock(integer,numeric,text,text)'::regprocedure), 'numeric', 'adjust_stock returns numeric');
SELECT is((SELECT prorettype::regtype::text FROM pg_proc WHERE oid = 'public.set_manual_fx_rate(numeric,numeric,text)'::regprocedure), 'integer', 'set_manual_fx_rate returns integer');
SELECT is((SELECT prorettype::regtype::text FROM pg_proc WHERE oid = 'public.record_fx_rate(numeric,text,date)'::regprocedure), 'integer', 'record_fx_rate returns integer');
SELECT is((SELECT prorettype::regtype::text FROM pg_proc WHERE oid = 'public.panel_kpis()'::regprocedure), 'jsonb', 'panel_kpis returns jsonb');

SELECT t.as_user('00000000-0000-0000-0000-0000000000a1');
SELECT is(t.code($$SELECT public.register_purchase(9301, 1, 1)$$), '42501', 'even an admin session cannot call register_purchase');
SELECT is(t.code($$SELECT public.panel_kpis()$$), '42501', 'even an admin session cannot call panel_kpis');
SELECT t.reset();

-- ================================================================ register_purchase
SELECT t.as_django();
SELECT public.register_purchase(9301, 10, 1200, 'Lote de la semana', 'staff-1') AS lot1 \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[l.product_id::text, l.qty::text, l.total_cost::text, l.unit_cost::text, l.expected_revenue::text, l.note, l.staff_ref]
           FROM public.purchase_lots l WHERE l.id = :'lot1'),
          ARRAY['9301', '10.000', '1200.00', '120.0000', '2000.00', 'Lote de la semana', 'staff-1'],
          'the lot keeps qty, total, unit cost and the revenue expected at the current price');
SELECT is((SELECT ARRAY[p.stock::text, p.track_stock::text] FROM public.products p WHERE p.id = 9301), ARRAY['10.000', 'true'],
          'the stock grows by the purchase and tracking turns on');
SELECT is((SELECT ARRAY[c.cost_per_kg::text, c.cost_per_piece::text, c.yield_pct::text, c.updated_by] FROM public.product_costs c WHERE c.product_id = 9301),
          ARRAY['120.0000', NULL, '100.00', 'staff-1'], 'the cost per kg is created with a yield of 100');
SELECT is((SELECT ARRAY[m.delta::text, m.reason, m.lot_id::text, m.staff_ref] FROM public.stock_movements m WHERE m.product_id = 9301),
          ARRAY['10.000', 'purchase', :'lot1', 'staff-1'], 'one purchase movement, positive, tied to the lot');

-- a yield below 100: the stock grows by what can be sold, the cost is per kilo bought
INSERT INTO public.product_costs (product_id, cost_per_kg, yield_pct, updated_at) VALUES (9302, 90, 80, now() - interval '1 day');
SELECT t.as_django();
SELECT public.register_purchase(9302, 10, 1200) AS lot2 \gset
SELECT t.reset();
SELECT is((SELECT p.stock::text FROM public.products p WHERE p.id = 9302), '8.000', 'a yield of 80 turns 10 kg bought into 8 kg for sale');
SELECT is((SELECT ARRAY[l.expected_revenue::text, l.unit_cost::text] FROM public.purchase_lots l WHERE l.id = :'lot2'),
          ARRAY['800.00', '120.0000'], 'expected revenue is 10 kg * 0.80 * 100 per kg');
SELECT is((SELECT ARRAY[c.cost_per_kg::text, c.yield_pct::text] FROM public.product_costs c WHERE c.product_id = 9302),
          ARRAY['120.0000', '80.00'], 'the latest cost replaces the old one and the yield is untouched');
SELECT is((SELECT c.updated_at > now() - interval '1 hour' FROM public.product_costs c WHERE c.product_id = 9302), true,
          'the cost row refreshes updated_at');
SELECT is((SELECT m.delta::text FROM public.stock_movements m WHERE m.lot_id = :'lot2'), '8.000', 'the movement is the sellable quantity');
SELECT is((SELECT m.staff_ref FROM public.stock_movements m WHERE m.lot_id = :'lot2'), NULL, 'with no staff reference the movement has none');

-- a second purchase accumulates
SELECT t.as_django();
SELECT public.register_purchase(9301, 5.5, 770) AS lot3 \gset
SELECT t.reset();
SELECT is((SELECT p.stock::text FROM public.products p WHERE p.id = 9301), '15.500', 'a second purchase adds to the stock');
SELECT is((SELECT c.cost_per_kg::text FROM public.product_costs c WHERE c.product_id = 9301), '140.0000', 'and the last cost per kilo wins: 770 / 5.5');
SELECT is((SELECT count(*) FROM public.purchase_lots WHERE product_id = 9301), 2::bigint, 'each purchase is its own lot');

-- pieces: no yield, whole numbers, cost per piece
SELECT t.as_django();
SELECT public.register_purchase(9303, 12, 600, NULL, 'staff-2') AS lot4 \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[p.stock::text, p.stock_unit] FROM public.products p WHERE p.id = 9303), ARRAY['12.000', 'piece'], 'twelve pieces bought');
SELECT is((SELECT ARRAY[c.cost_per_kg::text, c.cost_per_piece::text, c.yield_pct::text] FROM public.product_costs c WHERE c.product_id = 9303),
          ARRAY[NULL, '50.0000', '100.00'], 'a piece product stores cost_per_piece and no cost per kg');
SELECT is((SELECT l.expected_revenue::text FROM public.purchase_lots l WHERE l.id = :'lot4'), '3000.00', 'expected revenue is 12 * 250');

-- errors, and a rejected call changes nothing
SELECT t.fp3() AS fp0 \gset
SELECT t.as_django();
SELECT is(t.code($$SELECT public.register_purchase(999999, 1, 1)$$), 'product_not_found', 'an unknown product');
SELECT is(t.code($$SELECT public.register_purchase(NULL, 1, 1)$$), 'product_not_found', 'a NULL product');
SELECT is(t.code($$SELECT public.register_purchase(9301, 0, 1)$$), 'invalid_amount', 'a quantity of 0');
SELECT is(t.code($$SELECT public.register_purchase(9301, -1, 1)$$), 'invalid_amount', 'a negative quantity');
SELECT is(t.code($$SELECT public.register_purchase(9301, NULL, 1)$$), 'invalid_amount', 'a NULL quantity');
SELECT is(t.code($$SELECT public.register_purchase(9301, 'NaN'::numeric, 1)$$), 'invalid_amount', 'a NaN quantity');
SELECT is(t.code($$SELECT public.register_purchase(9301, 1, -1)$$), 'invalid_amount', 'a negative total cost');
SELECT is(t.code($$SELECT public.register_purchase(9301, 1, NULL)$$), 'invalid_amount', 'a NULL total cost');
SELECT is(t.code($$SELECT public.register_purchase(9301, 1000001, 1)$$), 'invalid_amount', 'a quantity above 1,000,000');
SELECT is(t.code($$SELECT public.register_purchase(9303, 1.5, 10)$$), 'invalid_amount', 'half a piece');
SELECT is(t.code($$SELECT public.register_purchase(9302, 0.001, 10)$$), 'invalid_amount', 'a purchase that adds nothing after the yield');
SELECT is(t.code(format('SELECT public.register_purchase(9301, 1, 1, %L)', repeat('n', 501))), 'note_too_long', 'a note of 501 characters');
SELECT is(t.code(format('SELECT public.register_purchase(9301, 1, 1, NULL, %L)', repeat('s', 101))), 'invalid_staff_ref', 'a staff reference of 101 characters');
SELECT t.reset();
SELECT is(t.fp3(), :'fp0', 'every rejected purchase changed no data');
SELECT t.as_django();
SELECT is(t.code($$SELECT public.register_purchase(9301, 1, 0)$$), '', 'a free purchase (total cost 0) is accepted');
SELECT t.reset();

-- ================================================================ adjust_stock
SELECT t.as_django();
SELECT is(public.adjust_stock(9301, 7.5, 'Conteo del lunes', 'staff-3'), 7.500::numeric, 'adjust_stock returns the new stock');
SELECT t.reset();
SELECT is((SELECT p.stock::text FROM public.products p WHERE p.id = 9301), '7.500', 'the stock is the counted one');
SELECT is((SELECT ARRAY[m.delta::text, m.reason, m.note, m.staff_ref, m.order_id::text, m.lot_id::text]
           FROM public.stock_movements m WHERE m.product_id = 9301 AND m.reason = 'adjustment'),
          ARRAY['-9.000', 'adjustment', 'Conteo del lunes', 'staff-3', NULL, NULL],
          'the movement is the difference (7.5 - 16.5) with the reason in note');
SELECT t.as_django();
SELECT is(public.adjust_stock(9301, 20, 'Llego mercancia', NULL), 20.000::numeric, 'adjusting up works');
SELECT t.reset();
SELECT is((SELECT m.delta::text FROM public.stock_movements m WHERE m.product_id = 9301 AND m.note = 'Llego mercancia'), '12.500', 'and writes a positive movement');
SELECT t.as_django();
SELECT is(public.adjust_stock(9301, 20, 'Mismo conteo', NULL), 20.000::numeric, 'adjusting to the same value is accepted');
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.stock_movements m WHERE m.note = 'Mismo conteo'), 0::bigint, 'and writes no movement');
UPDATE public.products SET track_stock = false WHERE id = 9302;
SELECT t.as_django();
SELECT public.adjust_stock(9302, 3, 'Primer conteo', 'staff-3');
SELECT t.reset();
SELECT is((SELECT p.track_stock FROM public.products p WHERE p.id = 9302), true, 'a first stock count turns tracking on');
SELECT t.fp3() AS fp1 \gset
SELECT t.as_django();
SELECT is(t.code($$SELECT public.adjust_stock(999999, 1, 'x', NULL)$$), 'product_not_found', 'an unknown product');
SELECT is(t.code($$SELECT public.adjust_stock(9301, -1, 'x', NULL)$$), 'invalid_amount', 'a negative stock');
SELECT is(t.code($$SELECT public.adjust_stock(9301, NULL, 'x', NULL)$$), 'invalid_amount', 'a NULL stock');
SELECT is(t.code($$SELECT public.adjust_stock(9303, 2.5, 'x', NULL)$$), 'invalid_amount', 'a fractional piece stock');
SELECT is(t.code($$SELECT public.adjust_stock(9301, 1, NULL, NULL)$$), 'reason_required', 'a NULL reason');
SELECT is(t.code($$SELECT public.adjust_stock(9301, 1, '   ', NULL)$$), 'reason_required', 'a blank reason');
SELECT is(t.code(format('SELECT public.adjust_stock(9301, 1, %L, NULL)', repeat('r', 201))), 'reason_required', 'a reason of 201 characters');
SELECT is(t.code(format('SELECT public.adjust_stock(9301, 1, ''x'', %L)', repeat('s', 101))), 'invalid_staff_ref', 'a staff reference of 101 characters');
SELECT t.reset();
SELECT is(t.fp3(), :'fp1', 'every rejected adjustment changed no data');

-- ================================================================ exchange rate RPCs
DELETE FROM public.fx_rates;
SELECT (now() AT TIME ZONE 'America/Mexico_City')::date AS today \gset
SELECT t.as_django();
SELECT public.set_manual_fx_rate(18.5) AS fx1 \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[f.rate::text, f.buffer_pct::text, f.source, f.fetched_on::text, f.staff_ref] FROM public.fx_rates f WHERE f.id = :'fx1'),
          ARRAY['18.5000', '2.00', 'manual', :'today', NULL], 'the first manual rate: buffer 2.00 by default, dated in Mexico City');
SELECT is((SELECT house_rate::text FROM public.current_fx), '18.1300', 'current_fx shows it with the house rate');
SELECT t.as_django();
SELECT is(public.set_manual_fx_rate(18.6, 3.5, 'staff-4'), :'fx1'::int, 'a second manual rate the same day updates the same row');
SELECT t.reset();
SELECT is((SELECT ARRAY[f.rate::text, f.buffer_pct::text, f.staff_ref] FROM public.fx_rates f WHERE f.id = :'fx1'),
          ARRAY['18.6000', '3.50', 'staff-4'], 'with the new rate, buffer and staff reference');
SELECT t.as_django();
SELECT public.set_manual_fx_rate(18.7);
SELECT t.reset();
SELECT is((SELECT ARRAY[f.rate::text, f.buffer_pct::text] FROM public.fx_rates f WHERE f.id = :'fx1'), ARRAY['18.7000', '3.50'],
          'a NULL buffer keeps the latest one');
SELECT t.as_django();
SELECT public.record_fx_rate(19.0, 'banxico', :'today'::date) AS fx2 \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[f.rate::text, f.buffer_pct::text, f.source] FROM public.fx_rates f WHERE f.id = :'fx2'), ARRAY['19.0000', '3.50', 'banxico'],
          'a Banxico rate of the same day is a new row with the latest buffer');
SELECT is((SELECT f.rate::text FROM public.current_fx f), '18.7000', 'and the manual rate still wins the day');
SELECT t.as_django();
SELECT is(public.record_fx_rate(19.1, 'banxico', :'today'::date), :'fx2'::int, 'the same source and day updates the row');
SELECT public.record_fx_rate(19.2, 'fallback', :'today'::date - 1);
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.fx_rates), 3::bigint, 'one row per (day, source)');
SELECT is((SELECT f.rate::text FROM public.fx_rates f WHERE f.id = :'fx2'), '19.1000', 'the Banxico row holds the new rate');
SELECT is((SELECT f.rate::text FROM public.current_fx f), '18.7000', 'an older day never beats today');
SELECT t.fp3() AS fp2 \gset
SELECT t.as_django();
SELECT is(t.code($$SELECT public.set_manual_fx_rate(0)$$), 'invalid_rate', 'a rate of 0');
SELECT is(t.code($$SELECT public.set_manual_fx_rate(-1)$$), 'invalid_rate', 'a negative rate');
SELECT is(t.code($$SELECT public.set_manual_fx_rate(NULL)$$), 'invalid_rate', 'a NULL rate');
SELECT is(t.code($$SELECT public.set_manual_fx_rate('NaN'::numeric)$$), 'invalid_rate', 'a NaN rate');
SELECT is(t.code($$SELECT public.set_manual_fx_rate(1001)$$), 'invalid_rate', 'a rate above 1000');
SELECT is(t.code($$SELECT public.set_manual_fx_rate(18, -1)$$), 'invalid_rate', 'a negative buffer');
SELECT is(t.code($$SELECT public.set_manual_fx_rate(18, 100)$$), 'invalid_rate', 'a buffer of 100');
SELECT is(t.code(format('SELECT public.set_manual_fx_rate(18, 2, %L)', repeat('s', 101))), 'invalid_staff_ref', 'a staff reference of 101 characters');
SELECT is(t.code($$SELECT public.record_fx_rate(0, 'banxico', current_date)$$), 'invalid_rate', 'record: a rate of 0');
SELECT is(t.code($$SELECT public.record_fx_rate(18, 'oracle', current_date)$$), 'invalid_rate', 'record: an unknown source');
SELECT is(t.code($$SELECT public.record_fx_rate(18, NULL, current_date)$$), 'invalid_rate', 'record: a NULL source');
SELECT is(t.code($$SELECT public.record_fx_rate(18, 'banxico', NULL)$$), 'invalid_rate', 'record: a NULL date');
SELECT is(t.code($$SELECT public.record_fx_rate(18, 'banxico', current_date + 3)$$), 'invalid_rate', 'record: a date in the future');
SELECT t.reset();
SELECT is(t.fp3(), :'fp2', 'every rejected rate changed no data');

-- ================================================================ panel_kpis: nothing yet
SELECT t.as_django();
SELECT public.panel_kpis() AS kpi_empty \gset
SELECT t.reset();
SELECT is(:'kpi_empty'::jsonb #> '{ventas_hoy}', '{"total": "0.00", "pedidos": 0}'::jsonb, 'no orders: ventas_hoy is zero');
SELECT is(:'kpi_empty'::jsonb -> 'pendientes', '0'::jsonb, 'no orders: pendientes is 0');
SELECT is(:'kpi_empty'::jsonb ->> 'ticket_promedio_30d', '0.00', 'no orders: the average ticket is 0.00');
SELECT is(:'kpi_empty'::jsonb -> 'margen_30d', 'null'::jsonb, 'no orders: margen_30d is null, not zero');
SELECT is(:'kpi_empty'::jsonb -> 'top5', '[]'::jsonb, 'no orders: top5 is an empty array');
SELECT is(jsonb_array_length(:'kpi_empty'::jsonb -> 'serie_7d'), 7, 'no orders: the series still has seven days');
SELECT is((SELECT bool_and(e ->> 'total' = '0.00') FROM jsonb_array_elements(:'kpi_empty'::jsonb -> 'serie_7d') e), true, 'all of them at 0.00');
SELECT is((SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(:'kpi_empty'::jsonb) k),
          ARRAY['margen_30d', 'pendientes', 'serie_7d', 'ticket_promedio_30d', 'top5', 'ventas_hoy'], 'exactly the six keys of D4');

-- ================================================================ panel_kpis: a month of orders
SELECT t.mk_product(9311 + n, 'KPI ' || chr(65 + n), 100) FROM generate_series(0, 6) AS n;
SELECT t.kpi_order(now(), 'pending',   100, 9311, 1.000);                          -- A today, pending
SELECT t.kpi_order(now(), 'confirmed', 300, 9312, 3.000, 180);                     -- B today, confirmed, cost 180
SELECT t.kpi_order(now(), 'preparing',  50, 9313, 0.500);                          -- C today, preparing
SELECT t.kpi_order(now(), 'cancelled', 500, 9311, 5.000, 250);                     -- A today, cancelled: out of everything
SELECT t.kpi_order(now() - interval '1 day',  'delivered', 200, 9314, 2.000, 100); -- D yesterday, cost 100
SELECT t.kpi_order(now() - interval '8 days', 'delivered', 1000, 9315, 10.000);    -- E 8 days ago, no cost
SELECT t.kpi_order(now() - interval '10 days', 'delivered', 20, 9317, 0.200);      -- G 10 days ago
SELECT t.kpi_order(now() - interval '40 days', 'delivered', 9999, 9316, 99.990, 1); -- F 40 days ago: outside 30 days
-- yesterday at 23:30 Mexico City is already the next day in UTC: it belongs to yesterday
SELECT t.kpi_order((((now() AT TIME ZONE 'America/Mexico_City')::date - 1)::timestamp + interval '23 hours 30 minutes')
                   AT TIME ZONE 'America/Mexico_City', 'delivered', 10, 9317, 0.100);
SELECT t.as_django();
SELECT public.panel_kpis() AS kpi \gset
SELECT t.reset();
SELECT is(:'kpi'::jsonb -> 'ventas_hoy', '{"total": "450.00", "pedidos": 3}'::jsonb, 'ventas_hoy: today, not cancelled (100 + 300 + 50)');
SELECT is(:'kpi'::jsonb -> 'pendientes', '2'::jsonb, 'pendientes: pending plus confirmed');
SELECT is(:'kpi'::jsonb ->> 'ticket_promedio_30d', '240.00', 'ticket: 1680 over 7 orders of the last 30 days, cancelled and 40-day-old left out');
SELECT is(:'kpi'::jsonb -> 'margen_30d', '{"monto": "220.00", "pct": "44.0"}'::jsonb,
          'margin: only items with a frozen cost in confirmed-or-later orders: (300 + 200) - (180 + 100)');
SELECT is(:'kpi'::jsonb -> 'top5',
          '[{"producto": "KPI E", "ingreso": "1000.00", "kg": "10.000"},
            {"producto": "KPI B", "ingreso": "300.00",  "kg": "3.000"},
            {"producto": "KPI D", "ingreso": "200.00",  "kg": "2.000"},
            {"producto": "KPI A", "ingreso": "100.00",  "kg": "1.000"},
            {"producto": "KPI C", "ingreso": "50.00",   "kg": "0.500"}]'::jsonb,
          'top5: the five best products of 30 days by revenue, in order, G left out and the cancelled order not counted');
SELECT is((SELECT array_agg(e ->> 'dia' ORDER BY e ->> 'dia') FROM jsonb_array_elements(:'kpi'::jsonb -> 'serie_7d') e),
          (SELECT array_agg((:'today'::date - 6 + n)::text ORDER BY n) FROM generate_series(0, 6) n),
          'serie_7d: seven consecutive Mexico City days ending today');
SELECT is((:'kpi'::jsonb -> 'serie_7d' -> 6) -> 'total', '"450.00"'::jsonb, 'serie_7d: today');
SELECT is((:'kpi'::jsonb -> 'serie_7d' -> 5) -> 'total', '"210.00"'::jsonb, 'serie_7d: yesterday, including the order of 23:30 local');
SELECT is((SELECT array_agg(e ->> 'total' ORDER BY ord) FROM jsonb_array_elements(:'kpi'::jsonb -> 'serie_7d') WITH ORDINALITY AS x(e, ord) WHERE ord <= 5),
          ARRAY['0.00', '0.00', '0.00', '0.00', '0.00'], 'serie_7d: days without orders are 0.00');
SELECT is(jsonb_typeof(:'kpi'::jsonb #> '{ventas_hoy,pedidos}'), 'number', 'pedidos is a JSON number');
SELECT is(jsonb_typeof(:'kpi'::jsonb -> 'pendientes'), 'number', 'pendientes is a JSON number');
SELECT is(jsonb_typeof(:'kpi'::jsonb -> 'ticket_promedio_30d'), 'string', 'money travels as a string');

-- ================================================================ panel_orders
SELECT t.set_fx(0);
UPDATE public.profiles SET phone = '4441112222' WHERE id = '00000000-0000-0000-0000-0000000000c1';
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT public.create_order_v2('[{"product_id": 9301, "mode": "weight", "amount": "1", "unit": "kg"}]', 'pickup') AS web_order \gset
SELECT t.reset();
SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9301, "mode": "weight", "amount": "2", "unit": "kg", "note": "sin hueso"}]',
                                 'Doña Mary', '4443334444', 'pickup', '{}'::jsonb, 'nota', 'mostrador', 'MXN', 'efectivo', 'staff-9') AS staff_order \gset
SELECT t.reset();
SELECT is((SELECT array_agg(column_name::text ORDER BY ordinal_position) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'panel_orders'),
          ARRAY['order_id', 'status', 'channel', 'customer_name', 'customer_phone', 'delivery_type', 'delivery_address', 'notes',
                'payment_method', 'currency', 'total_mxn', 'total_usd', 'fx_rate_used', 'staff_ref', 'created_at', 'updated_at', 'lines'],
          'panel_orders has the columns agreed with backend, in order');
SELECT is((SELECT ARRAY[p.customer_name, p.customer_phone, p.channel, p.status, p.total_mxn::text]
           FROM public.panel_orders p WHERE p.order_id = :'web_order'),
          ARRAY['Cliente Uno', '4441112222', 'web', 'pending', '200.00'], 'a web order shows the profile name and phone');
SELECT is((SELECT ARRAY[p.customer_name, p.customer_phone, p.channel, p.payment_method, p.staff_ref, p.notes, p.currency]
           FROM public.panel_orders p WHERE p.order_id = :'staff_order'),
          ARRAY['Doña Mary', '4443334444', 'mostrador', 'efectivo', 'staff-9', 'nota', 'MXN'], 'a counter order shows what the staff typed');
SELECT is((SELECT p.lines FROM public.panel_orders p WHERE p.order_id = :'staff_order'),
          '[{"note": "sin hueso", "pieces": null, "subtotal": "400.00", "discount": "0.00", "sale_mode": "weight",
             "unit_price": "200.00", "product_id": 9301, "quantity_kg": "2.000", "product_name": "Bistec A3"}]'::jsonb,
          'lines are a JSON array with the nine agreed keys, money and kilos as text');
SELECT is((SELECT p.lines FROM public.panel_orders p JOIN public.orders o ON o.id = p.order_id
           WHERE o.id = :'staff_order' AND jsonb_array_length(p.lines) = 1) IS NOT NULL, true, 'an order with items has a one-element lines array');
SELECT is((SELECT count(*) FROM public.panel_orders), (SELECT count(*) FROM public.orders), 'the view lists every order');
INSERT INTO public.orders (id, total, delivery_type, channel, customer_name) VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 1, 'pickup', 'mostrador', 'Sin lineas');
SELECT is((SELECT p.lines FROM public.panel_orders p WHERE p.order_id = 'bbbbbbbb-0000-0000-0000-000000000001'), '[]'::jsonb,
          'an order without items has an empty array, not NULL');
SELECT is(t.privs('django', 'panel_orders'), 'SELECT', 'django reads panel_orders');
SELECT is(t.privs('anon', 'panel_orders'), '', 'anon holds nothing on panel_orders');
SELECT is(t.privs('authenticated', 'panel_orders'), '', 'authenticated holds nothing on panel_orders');
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code($$SELECT t.n('panel_orders')$$), '42501', 'a customer cannot read panel_orders');
SELECT t.reset();
SELECT t.as_django();
SELECT ok(t.n('panel_orders') > 0, 'django sees the orders through the view');
SELECT t.reset();

-- ================================================================ panel_purchase_performance
DELETE FROM public.purchase_lots;
INSERT INTO public.purchase_lots (id, product_id, qty, total_cost, unit_cost, expected_revenue, created_at)
VALUES (9100, 9301, 10, 1200, 120, 2000, now() - interval '2 days');
INSERT INTO public.purchase_lots (id, product_id, qty, total_cost, unit_cost, expected_revenue, created_at)
VALUES (9101, 9302, 4, 400, 100, 0, now() - interval '2 days');
SELECT t.kpi_order(now() - interval '3 days', 'delivered', 200, 9301, 1.000);     -- before the lot: not counted
SELECT t.kpi_order(now() - interval '1 day',  'delivered', 400, 9301, 2.000);     -- after the lot: counted
SELECT t.kpi_order(now() - interval '1 day',  'cancelled', 600, 9301, 3.000);     -- cancelled: not counted
SELECT t.kpi_order(now() - interval '1 day',  'pending',   800, 9301, 4.000);     -- pending: not counted
SELECT is((SELECT array_agg(column_name::text ORDER BY ordinal_position) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'panel_purchase_performance'),
          ARRAY['lot_id', 'product_id', 'product_name', 'created_at', 'qty', 'total_cost', 'unit_cost', 'expected_revenue',
                'expected_margin', 'expected_margin_pct', 'sold_qty', 'sold_revenue'],
          'panel_purchase_performance has the documented columns');
SELECT is((SELECT ARRAY[v.product_name, v.expected_margin::text, v.expected_margin_pct::text, v.sold_qty::text, v.sold_revenue::text]
           FROM public.panel_purchase_performance v WHERE v.lot_id = 9100),
          ARRAY['Bistec A3', '800.00', '40.0', '2.000', '400.00'],
          'a lot: expected margin 2000 - 1200, and only confirmed-or-later sales after the purchase');
SELECT is((SELECT ARRAY[v.expected_margin_pct::text, v.sold_qty::text, v.sold_revenue::text]
           FROM public.panel_purchase_performance v WHERE v.lot_id = 9101),
          ARRAY[NULL, '0.000', '0.00'], 'a lot with no expected revenue has no margin percent, and no sales is zero not NULL');
SELECT is(t.privs('django', 'panel_purchase_performance'), 'SELECT', 'django reads panel_purchase_performance');
SELECT is(t.privs('anon', 'panel_purchase_performance'), '', 'anon holds nothing on panel_purchase_performance');
SELECT is(t.privs('authenticated', 'panel_purchase_performance'), '', 'authenticated holds nothing on panel_purchase_performance');

SELECT * FROM finish();
ROLLBACK;
