-- A2: quote_line y quote_cart (migration 20261113000002_comercio_v1_cotizacion_y_pedidos.sql).
--
-- The 18 shared cases of supabase/tests/cotizacion-casos.json run one by one against
-- quote_line, called as anon (the public caller), with the products and the exchange rate the
-- JSON describes. The rest of the file covers what the cases do not name: validation limits,
-- warnings, promotions, USD, the shape of quote_cart and its errors.
--
-- Test products (ids 9000+, never in the seed): 9001 bistec (kg, money+weight+pieces, 0.150 kg
-- per piece, thickness 0.50-2.00 default 1.00), 9002 molida (kg, money+weight), 9003 camiseta
-- (piece), 9004 a kg product with a piece weight but no default thickness.

BEGIN;
SELECT * FROM no_plan();

-- ---------------------------------------------------------------- fixtures
DO $$
DECLARE
    j jsonb := current_setting('casos.json')::jsonb;
BEGIN
    PERFORM t.mk_product(9001, 'Bistec JSON', (j #>> '{productos,bistec,price_per_kg}')::numeric,
        j #>> '{productos,bistec,price_unit}',
        ARRAY(SELECT jsonb_array_elements_text(j #> '{productos,bistec,sale_modes}')));
    PERFORM t.mk_cutspec(9001, (j #>> '{productos,bistec,avg_piece_weight_kg}')::numeric, 0.50, 2.00,
        (j #>> '{productos,bistec,thickness_default_in}')::numeric);
    PERFORM t.mk_product(9002, 'Molida JSON', (j #>> '{productos,molida,price_per_kg}')::numeric,
        j #>> '{productos,molida,price_unit}',
        ARRAY(SELECT jsonb_array_elements_text(j #> '{productos,molida,sale_modes}')));
    PERFORM t.mk_product(9003, 'Camiseta JSON', (j #>> '{productos,camiseta,price_per_kg}')::numeric,
        j #>> '{productos,camiseta,price_unit}',
        ARRAY(SELECT jsonb_array_elements_text(j #> '{productos,camiseta,sale_modes}')),
        0, false, 'piece');
    PERFORM t.mk_product(9004, 'Chuleta sin grosor', 100, 'kg', ARRAY['money', 'weight', 'pieces']);
    PERFORM t.mk_cutspec(9004, 0.200);
END $$;

-- One call to quote_line as the current role, every column as JSON (numbers keep their scale).
CREATE FUNCTION t.ql(p_pid int, p_mode text, p_amount numeric, p_unit text DEFAULT NULL,
                     p_thick numeric DEFAULT NULL, p_cur text DEFAULT 'MXN') RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
    q record;
BEGIN
    SELECT * INTO q FROM public.quote_line(p_pid, p_mode, p_amount, p_unit, p_thick, p_cur);
    RETURN to_jsonb(q);
END $$;

-- One shared case: sets the fx and the promotion it names, quotes as anon, and returns either
-- the observed columns the case expects or {"error": code}.
CREATE FUNCTION t.run_case(c jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
    j     jsonb := current_setting('casos.json')::jsonb;
    v_pid int := CASE c ->> 'producto' WHEN 'bistec' THEN 9001 WHEN 'molida' THEN 9002 ELSE 9003 END;
    v_age int := coalesce((c #>> '{fx,dias_de_antiguedad}')::int, (j #>> '{fx,dias_de_antiguedad}')::int);
    q     record;
    v_out jsonb;
    v_err text;
BEGIN
    PERFORM t.set_fx(v_age, (j #>> '{fx,rate}')::numeric, (j #>> '{fx,buffer_pct}')::numeric);
    DELETE FROM public.product_promotions WHERE product_id = v_pid;
    IF c ? 'promo' THEN
        INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at)
        VALUES (v_pid, c #>> '{promo,kind}', (c #>> '{promo,value}')::numeric,
                now() - interval '1 hour', now() + interval '1 day');
    END IF;
    PERFORM t.as_anon();
    BEGIN
        SELECT * INTO q FROM public.quote_line(v_pid, c #>> '{entrada,mode}',
            (c #>> '{entrada,amount}')::numeric, c #>> '{entrada,unit}',
            (c #>> '{entrada,thickness_in}')::numeric, coalesce(c #>> '{entrada,currency}', 'MXN'));
    EXCEPTION WHEN raise_exception THEN
        v_err := split_part(SQLERRM, ':', 1);
    END;
    PERFORM t.reset();
    IF v_err IS NOT NULL THEN
        RETURN jsonb_build_object('error', v_err);
    END IF;
    v_out := jsonb_build_object('quantity_kg', q.quantity_kg::text, 'pieces', q.pieces,
        'unit_price', q.unit_price::text, 'line_total_mxn', q.line_total_mxn::text,
        'discount_mxn', q.discount_mxn::text);
    IF (c -> 'esperado') ? 'total_usd' THEN
        v_out := v_out || jsonb_build_object('total_usd', q.line_total_usd::text);
    END IF;
    RETURN v_out;
END $$;

-- ================================================ the 18 shared cases, one by one
SELECT is(t.run_case(c),
          CASE WHEN c ? 'error' THEN jsonb_build_object('error', c ->> 'error')
               ELSE (c -> 'esperado') - 'referencia_usd_tasa_pura' END,
          'case ' || (c ->> 'id'))
FROM jsonb_array_elements(current_setting('casos.json')::jsonb -> 'casos') AS c;

SELECT is(jsonb_array_length(current_setting('casos.json')::jsonb -> 'casos'), 18,
          'the JSON still holds 18 cases');

-- ================================================ quote_line: what the cases do not name
SELECT t.set_fx(0);
SELECT t.as_anon();

SELECT is((t.ql(9001, 'money', 100) ->> 'line_total_mxn'), '100.00',
          'p_unit, p_thickness_in and p_currency have defaults');
SELECT is(t.code($$SELECT * FROM public.quote_line(99999, 'money', 100)$$), 'product_not_found',
          'an unknown product');
SELECT is(t.code($$SELECT * FROM public.quote_line(NULL, 'money', 100)$$), 'product_not_found',
          'a NULL product');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'barter', 100)$$), 'sale_mode_not_allowed',
          'an unknown mode');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, NULL, 100)$$), 'sale_mode_not_allowed',
          'a NULL mode');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', 1, 'oz')$$), 'invalid_amount',
          'an unknown unit');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', NULL)$$), 'invalid_amount',
          'a NULL amount');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', 'NaN'::numeric)$$), 'invalid_amount',
          'a NaN amount');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'money', 100, NULL, NULL, 'EUR')$$), 'invalid_currency',
          'an unknown currency');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'money', 100, NULL, NULL, NULL)$$), 'invalid_currency',
          'a NULL currency');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', 1000)$$), '', '1000 kg is the largest weight line');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', 1001)$$), 'invalid_amount', '1001 kg is too much');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', 2000000, 'g')$$), 'invalid_amount',
          'the cap counts kilos, not the unit typed');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'money', 1000000)$$), '', '1,000,000 is the largest money line');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'money', 1000000.01)$$), 'invalid_amount', 'above 1,000,000 is too much');
SELECT is(t.code($$SELECT * FROM public.quote_line(9003, 'pieces', 10000)$$), '', '10000 pieces is the largest piece line');
SELECT is(t.code($$SELECT * FROM public.quote_line(9003, 'pieces', 10001)$$), 'invalid_amount', '10001 pieces is too much');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'pieces', 10000)$$), 'invalid_amount',
          'a piece line over 1000 kg is too much');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'money', 0.01)$$), 'invalid_amount',
          'a quantity that rounds to 0.000 kg is rejected');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', 0.0001)$$), 'invalid_amount',
          'a weight that rounds to 0.000 kg is rejected');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'pieces', 1, NULL, 3)$$), 'invalid_amount',
          'a thickness above the range is rejected');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'pieces', 1, NULL, 0.25)$$), 'invalid_amount',
          'a thickness below the range is rejected');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'pieces', 1, NULL, 0)$$), 'invalid_amount',
          'a zero thickness is rejected');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'pieces', 1, NULL, -1)$$), 'invalid_amount',
          'a negative thickness is rejected');

-- thickness: used, ignored, and the exact arithmetic
SELECT is((t.ql(9001, 'pieces', 2, NULL, 1.5) ->> 'quantity_kg'), '0.450', '2 pieces at 1.5 in = 2 * 0.150 * 1.5');
SELECT is((t.ql(9001, 'pieces', 2, NULL, 1.5) -> 'warnings'), '[]'::jsonb, 'a used thickness is not a warning');
SELECT is((t.ql(9004, 'pieces', 2, NULL, 1.5) ->> 'quantity_kg'), '0.400',
          'with no default thickness the factor is 1');
SELECT is((t.ql(9004, 'pieces', 2, NULL, 1.5) -> 'warnings'), '["thickness_ignored"]'::jsonb,
          'a thickness with no default thickness is ignored with a warning');
SELECT is((t.ql(9001, 'weight', 1, 'kg', 2) -> 'warnings'), '["thickness_ignored"]'::jsonb,
          'a thickness on a weight line is ignored with a warning');
SELECT is((t.ql(9001, 'money', 100, NULL, 2) -> 'warnings'), '["thickness_ignored"]'::jsonb,
          'a thickness on a money line is ignored with a warning');
SELECT is((t.ql(9003, 'pieces', 1, NULL, 2) -> 'warnings'), '["thickness_ignored"]'::jsonb,
          'a thickness on a piece-priced product is ignored with a warning');

-- piece weight times pieces: whole pieces only
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'pieces', 0.5)$$), 'invalid_amount', 'half a piece is rejected');
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'pieces', 2.0)$$), '', '2.0 pieces is a whole number');
SELECT is(t.code($$SELECT * FROM public.quote_line(9002, 'pieces', 1)$$), 'sale_mode_not_allowed',
          'a product without pieces mode rejects pieces');
SELECT is(t.code($$SELECT * FROM public.quote_line(9003, 'money', 100)$$), 'sale_mode_not_allowed',
          'a piece product rejects money');
SELECT is((t.ql(9003, 'pieces', 3) ->> 'quantity_kg'), '0.000', 'a piece line has quantity_kg 0.000');
SELECT is((t.ql(9003, 'pieces', 3) ->> 'pieces'), '3', 'a piece line reports its pieces');
SELECT is((t.ql(9001, 'weight', 1, 'kg') ->> 'pieces'), NULL, 'a weight line has no pieces');

-- result types come back with their scale
SELECT is((t.ql(9001, 'weight', 3, 'kg') ->> 'quantity_kg'), '3.000', 'quantity_kg has three decimals');
SELECT is((t.ql(9001, 'weight', 3, 'kg') ->> 'unit_price'), '200.00', 'unit_price has two decimals');
SELECT is((t.ql(9001, 'weight', 3, 'kg') ->> 'discount_mxn'), '0.00', 'discount_mxn has two decimals');

-- inactive products are not for sale
SELECT t.reset();
UPDATE public.products SET is_active = false WHERE id = 9002;
SELECT t.as_anon();
SELECT is(t.code($$SELECT * FROM public.quote_line(9002, 'money', 100)$$), 'product_not_found',
          'an inactive product is not found');
SELECT t.reset();
UPDATE public.products SET is_active = true WHERE id = 9002;
SELECT t.as_anon();

-- ================================================ promotions
SELECT t.reset();
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at, is_active) VALUES
  (9002, 'percent', 50, now() - interval '3 days', now() - interval '2 days', true),   -- expired
  (9002, 'percent', 50, now() + interval '2 days', now() + interval '3 days', true),   -- future
  (9002, 'percent', 50, now() - interval '1 day',  now() + interval '1 day',  false);  -- inactive
SELECT t.as_anon();
SELECT is((t.ql(9002, 'weight', 1, 'kg') ->> 'unit_price'), '140.00',
          'an expired, a future and an inactive promotion do not apply');
SELECT t.reset();
DELETE FROM public.product_promotions WHERE product_id = 9002;
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at)
VALUES (9002, 'fixed_price', 999, now() - interval '1 day', now() + interval '1 day');
SELECT t.as_anon();
SELECT is((t.ql(9002, 'weight', 1, 'kg') ->> 'unit_price'), '140.00',
          'a fixed price above the list price never raises the price');
SELECT t.reset();
DELETE FROM public.product_promotions WHERE product_id = 9002;
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at)
VALUES (9002, 'amount_off', 500, now() - interval '1 day', now() + interval '1 day');
SELECT t.as_anon();
SELECT is((t.ql(9002, 'weight', 1, 'kg') ->> 'unit_price'), '0.01',
          'an amount_off above the price leaves one cent, never zero or negative');
SELECT t.reset();
DELETE FROM public.product_promotions WHERE product_id = 9002;
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at)
VALUES (9002, 'percent', 10, now() - interval '1 day', now() + interval '1 day');
SELECT t.as_anon();
SELECT is((t.ql(9002, 'money', 126) ->> 'quantity_kg'), '1.000',
          'money with a promotion buys more kilos: 126 / 126.00');
SELECT is((t.ql(9002, 'money', 126) ->> 'discount_mxn'), '14.00',
          'the discount of a money line is the value of the extra kilos at list price');
SELECT is((t.ql(9002, 'weight', 2, 'kg') ->> 'discount_mxn'), '28.00', 'two kilos at 10 percent off save 28');
SELECT t.reset();
DELETE FROM public.product_promotions WHERE product_id = 9002;
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at)
VALUES (9003, 'percent', 20, now() - interval '1 day', now() + interval '1 day');
SELECT t.as_anon();
SELECT is((t.ql(9003, 'pieces', 2) ->> 'line_total_mxn'), '400.00', 'a promotion applies to piece-priced products');
SELECT is((t.ql(9003, 'pieces', 2) ->> 'discount_mxn'), '100.00', 'and its discount counts pieces');
SELECT t.reset();
DELETE FROM public.product_promotions WHERE product_id = 9003;

-- ================================================ warnings and stock
UPDATE public.products SET track_stock = true, stock = 1.000, min_quantity_kg = 0.250 WHERE id = 9002;
UPDATE public.products SET track_stock = true, stock = 3, stock_unit = 'piece' WHERE id = 9003;
SELECT t.as_anon();
SELECT is((t.ql(9002, 'weight', 1, 'kg') -> 'warnings'), '[]'::jsonb, 'exactly the stock left: no warning');
SELECT is((t.ql(9002, 'weight', 1001, 'g') -> 'warnings'), '["low_stock"]'::jsonb, '1.001 kg of 1.000 kg warns low_stock');
SELECT is(t.code($$SELECT * FROM public.quote_line(9002, 'weight', 1001, 'g')$$), '',
          'low stock warns but never blocks');
SELECT is((t.ql(9003, 'pieces', 3) -> 'warnings'), '[]'::jsonb, 'three pieces of three: no warning');
SELECT is((t.ql(9003, 'pieces', 4) -> 'warnings'), '["low_stock"]'::jsonb, 'four pieces of three warns low_stock');
SELECT is((t.ql(9002, 'weight', 200, 'g') -> 'warnings'), '["below_minimum_quantity"]'::jsonb,
          '0.200 kg under a minimum of 0.250 kg warns');
SELECT is((t.ql(9002, 'weight', 250, 'g') -> 'warnings'), '[]'::jsonb, 'exactly the minimum: no warning');
SELECT is((t.ql(9002, 'money', 28) -> 'warnings'), '["below_minimum_quantity"]'::jsonb,
          'a money line under the minimum warns too');
SELECT is((t.ql(9002, 'weight', 2, 'kg') -> 'warnings'), '["low_stock"]'::jsonb, 'two kilos of one warns');
SELECT is((t.ql(9002, 'weight', 100, 'g') -> 'warnings'), '["below_minimum_quantity"]'::jsonb,
          'a line short on the minimum but inside the stock warns only the minimum');
SELECT t.reset();
UPDATE public.products SET track_stock = false WHERE id IN (9002, 9003);
SELECT t.as_anon();
SELECT is((t.ql(9002, 'weight', 2, 'kg') -> 'warnings'), '[]'::jsonb, 'without tracking there is no low_stock');
SELECT t.reset();

-- ================================================ USD
SELECT t.set_fx(0);
SELECT t.as_anon();
SELECT is((t.ql(9001, 'weight', 1, 'kg', NULL, 'USD') ->> 'line_total_usd'),
          (ceil(200 / 18.2378 * 100) / 100)::numeric(12,2)::text,
          'a weight line charged in USD rounds the dollars up to the cent');
SELECT is((t.ql(9001, 'weight', 1, 'kg', NULL, 'USD') ->> 'line_total_mxn'), '200.00', 'its pesos are the list price');
SELECT is((t.ql(9001, 'money', 10.004, NULL, NULL, 'USD') ->> 'line_total_usd'), '10.00',
          'USD money is rounded to the cent and charged as asked');
SELECT is((t.ql(9001, 'money', 0.01, NULL, NULL, 'USD') ->> 'line_total_usd'), '0.01', 'one cent in USD still quotes');
SELECT t.reset();
SELECT t.set_fx(5);
SELECT t.as_anon();
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'weight', 1, 'kg', NULL, 'USD')$$), 'fx_unavailable',
          'USD with a stale rate is unavailable for any mode');
SELECT is((t.ql(9001, 'weight', 1, 'kg') ->> 'line_total_usd'), NULL, 'MXN with a stale rate has no USD figure');
SELECT is((t.ql(9001, 'weight', 1, 'kg') ->> 'line_total_mxn'), '200.00', 'and still quotes in pesos');
SELECT t.reset();
DELETE FROM public.fx_rates;
SELECT t.as_anon();
SELECT is(t.code($$SELECT * FROM public.quote_line(9001, 'money', 10, NULL, NULL, 'USD')$$), 'fx_unavailable',
          'USD with no rate at all is unavailable');
SELECT is((t.ql(9001, 'weight', 1, 'kg') ->> 'line_total_usd'), NULL, 'MXN with no rate has no USD figure');
SELECT t.reset();
SELECT t.set_fx(4);
SELECT t.as_anon();
SELECT is((t.ql(9001, 'money', 10, NULL, NULL, 'USD') ->> 'line_total_usd'), '10.00', 'a rate of 4 days still works');
SELECT t.reset();

-- ================================================ function attributes and grants
SELECT is((SELECT p.provolatile::text FROM pg_proc p WHERE p.oid = 'public.quote_line(integer,text,numeric,text,numeric,text)'::regprocedure),
          's', 'quote_line is STABLE');
SELECT is((SELECT p.prosecdef FROM pg_proc p WHERE p.oid = 'public.quote_line(integer,text,numeric,text,numeric,text)'::regprocedure),
          true, 'quote_line is SECURITY DEFINER');
SELECT is((SELECT p.proconfig FROM pg_proc p WHERE p.oid = 'public.quote_line(integer,text,numeric,text,numeric,text)'::regprocedure),
          ARRAY['search_path=""'], 'quote_line has an empty search_path');
SELECT is((SELECT p.provolatile::text FROM pg_proc p WHERE p.oid = 'public.quote_cart(jsonb,text)'::regprocedure),
          's', 'quote_cart is STABLE');
SELECT is((SELECT p.proconfig FROM pg_proc p WHERE p.oid = 'public.quote_cart(jsonb,text)'::regprocedure),
          ARRAY['search_path=""'], 'quote_cart has an empty search_path');
SELECT is(t.can_exec(r, 'quote_line(integer,text,numeric,text,numeric,text)'), true, r || ' can execute quote_line')
FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r;
SELECT is(t.can_exec(r, 'quote_cart(jsonb,text)'), true, r || ' can execute quote_cart')
FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r;
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is((t.ql(9001, 'weight', 1, 'kg') ->> 'line_total_mxn'), '200.00', 'a customer can quote');
SELECT t.reset();
SELECT t.as_django();
SELECT is((t.ql(9001, 'weight', 1, 'kg') ->> 'line_total_mxn'), '200.00', 'django can quote');
SELECT t.reset();

-- ================================================ quote_cart
SELECT t.set_fx(0);
SELECT t.as_anon();
SELECT is(jsonb_array_length(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"},
                                                   {"product_id": 9003, "mode": "pieces", "amount": "2"}]') -> 'lines'), 2,
          'one line per item');
SELECT is((SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(
              public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]') -> 'lines' -> 0) AS k),
          ARRAY['discount_mxn', 'line_total_mxn', 'line_total_usd', 'pieces', 'product_id',
                'quantity_kg', 'sale_mode', 'unit_price', 'warnings'],
          'a line has exactly the nine keys');
SELECT is((SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(
              public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]')) AS k),
          ARRAY['currency', 'fx', 'lines', 'total_mxn', 'total_usd'],
          'the cart has exactly lines, total_mxn, total_usd, currency and fx');
SELECT is(public.quote_cart('[{"product_id": 9003, "mode": "pieces", "amount": "2"},
                              {"product_id": 9001, "mode": "money", "amount": "100"}]') #>> '{lines,0,product_id}', '9003',
          'lines keep the order of p_items (first line)');
SELECT is(public.quote_cart('[{"product_id": 9003, "mode": "pieces", "amount": "2"},
                              {"product_id": 9001, "mode": "money", "amount": "100"}]') #>> '{lines,1,product_id}', '9001',
          'lines keep the order of p_items (second line)');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]') #> '{lines,0}',
          '{"pieces": null, "product_id": 9001, "sale_mode": "money", "unit_price": "200.00", "warnings": [],
            "quantity_kg": "0.500", "discount_mxn": "0.00", "line_total_mxn": "100.00", "line_total_usd": "5.49"}'::jsonb,
          'money and kilos travel as text, pieces as null, warnings as an array');
SELECT is(public.quote_cart('[{"product_id": 9003, "mode": "pieces", "amount": 2}]') #>> '{lines,0,pieces}', '2',
          'pieces travel as a JSON integer');
SELECT is(public.quote_cart('[{"product_id": "9001", "mode": "money", "amount": 100}]') #>> '{lines,0,line_total_mxn}', '100.00',
          'a product_id as text and an amount as a number are both accepted');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100", "unit_price": "1", "price": 1, "total": 1}]')
          #>> '{lines,0,unit_price}', '200.00', 'a price sent by the browser is never read');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"},
                              {"product_id": 9003, "mode": "pieces", "amount": "2"}]') ->> 'total_mxn', '600.00',
          'total_mxn adds the lines');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"},
                              {"product_id": 9003, "mode": "pieces", "amount": "2"}]') ->> 'total_usd',
          (ceil(600 / 18.2378 * 100) / 100)::numeric(12,2)::text,
          'total_usd rounds the whole cart up, not line by line');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]') ->> 'currency', 'MXN', 'the default currency is MXN');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]') -> 'fx',
          jsonb_build_object('rate', '18.6100', 'house_rate', '18.2378',
                             'fetched_on', (now() AT TIME ZONE 'America/Mexico_City')::date::text),
          'fx carries the rate, the house rate and the date');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "10"}]', 'USD') ->> 'total_usd', '10.00',
          'a USD money cart of 10 costs exactly 10.00 dollars');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "10"}]', 'USD') ->> 'total_mxn', '182.38',
          'and 182.38 pesos');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "10"}]', 'USD') #>> '{lines,0,line_total_usd}', '10.00',
          'its line is 10.00 dollars');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "10"},
                              {"product_id": 9001, "mode": "weight", "amount": "1", "unit": "kg"}]', 'USD') ->> 'total_usd',
          (10.00 + ceil(200 / 18.2378 * 100) / 100)::numeric(12,2)::text,
          'a mixed USD cart adds the exact dollars to the rounded-up rest');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "10"},
                              {"product_id": 9001, "mode": "money", "amount": "10"}]', 'USD') ->> 'total_usd', '20.00',
          'two USD money lines add without a cent of drift');
SELECT t.reset();

-- stale rate: pesos still work, dollars do not
SELECT t.set_fx(5);
SELECT t.as_anon();
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]') ->> 'total_usd', NULL,
          'a stale rate leaves total_usd null');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]') -> 'fx', 'null'::jsonb,
          'and fx null');
SELECT is(public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]') #>> '{lines,0,line_total_usd}', NULL,
          'and every line_total_usd null');
SELECT is(t.code($$SELECT public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "10"}]', 'USD')$$), 'fx_unavailable',
          'a USD cart with a stale rate is unavailable');
SELECT t.reset();
SELECT t.set_fx(0);

-- errors: the code first, then the line that failed
SELECT t.as_anon();
SELECT is(t.code($$SELECT public.quote_cart('[]')$$), 'invalid_items', 'an empty cart');
SELECT is(t.code($$SELECT public.quote_cart(NULL)$$), 'invalid_items', 'a NULL cart');
SELECT is(t.code($$SELECT public.quote_cart('{"product_id": 9001}')$$), 'invalid_items', 'a cart that is not an array');
SELECT is(t.code($$SELECT public.quote_cart('[1]')$$), 'invalid_items', 'a line that is not an object');
SELECT is(t.code($$SELECT public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"}]', 'EUR')$$), 'invalid_currency',
          'an unknown currency');
SELECT is(t.code($$SELECT public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "abc"}]')$$), 'invalid_items',
          'an amount that is not a number');
SELECT is(t.code($$SELECT public.quote_cart('[{"product_id": "x", "mode": "money", "amount": "1"}]')$$), 'invalid_items',
          'a product_id that is not a number');
SELECT is(t.code($$SELECT public.quote_cart('[{"mode": "money", "amount": "1"}]')$$), 'product_not_found',
          'a line without product_id');
SELECT is(t.code($$SELECT public.quote_cart('[{"product_id": 9001, "amount": "1"}]')$$), 'sale_mode_not_allowed',
          'a line without mode');
SELECT is(t.code($$SELECT public.quote_cart('[{"product_id": 9001, "mode": "money"}]')$$), 'invalid_amount',
          'a line without amount');
SELECT is(t.msg($$SELECT public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "100"},
                                              {"product_id": 9003, "mode": "weight", "amount": "1", "unit": "kg"}]')$$)
          LIKE 'sale_mode_not_allowed: line 2 %', true, 'the message of a failed line names line 2');
SELECT is(t.msg($$SELECT public.quote_cart('[{"product_id": 9001, "mode": "money", "amount": "abc"}]')$$)
          LIKE 'invalid_items: line 1 %', true, 'a malformed value names its line too');
SELECT is(t.code(format('SELECT public.quote_cart(%L)',
              (SELECT jsonb_agg('{"product_id": 9001, "mode": "money", "amount": "100"}'::jsonb) FROM generate_series(1, 50)))), '',
          'fifty lines are accepted');
SELECT is(t.code(format('SELECT public.quote_cart(%L)',
              (SELECT jsonb_agg('{"product_id": 9001, "mode": "money", "amount": "100"}'::jsonb) FROM generate_series(1, 51)))),
          'too_many_lines', 'fifty-one lines are too many');
SELECT t.reset();

-- A quote never writes: the order tables are untouched by everything above.
SELECT is((SELECT count(*) FROM public.orders), 0::bigint, 'quoting created no order');
SELECT is((SELECT count(*) FROM public.stock_movements), 0::bigint, 'and no stock movement');

SELECT * FROM finish();
ROLLBACK;
