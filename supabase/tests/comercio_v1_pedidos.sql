-- A2: create_order_v2, create_order_staff, set_order_status and update_order_status
-- (migration 20261113000002_comercio_v1_cotizacion_y_pedidos.sql).
--
-- Covers: who may call what, what an order stores, every limit of create_order_v2, the staff
-- order, the 36 status transitions of the shared JSON, the 6 stock cases of the JSON, stock
-- movements, frozen costs, the legacy wrapper update_order_status, and the invariant that a
-- rejected call changes no data.
--
-- Users: admin ...a1, customers ...c1 and ...c2. Products (ids 9000+): 9001 bistec (200/kg, money
-- weight pieces, 0.150 kg per piece, thickness 0.50-2.00 default 1.00), 9002 molida (140/kg,
-- minimum 0.250 kg), 9003 camiseta (250/piece).

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_user('00000000-0000-0000-0000-0000000000a1', 'Admin Test', true);
SELECT t.mk_user('00000000-0000-0000-0000-0000000000c1', 'Cliente Uno');
SELECT t.mk_user('00000000-0000-0000-0000-0000000000c2', 'Cliente Dos');
SELECT t.set_fx(0);
SELECT t.mk_product(9001, 'Bistec', 200, 'kg', ARRAY['money', 'weight', 'pieces']);
SELECT t.mk_cutspec(9001, 0.150, 0.50, 2.00, 1.00);
SELECT t.mk_product(9002, 'Molida', 140, 'kg', ARRAY['money', 'weight'], 0, false, 'kg', 0.250);
SELECT t.mk_product(9003, 'Camiseta', 250, 'piece', ARRAY['pieces'], 0, false, 'piece');

\set one '[{"product_id": 9001, "mode": "money", "amount": "100"}]'
\set cart_mix '[{"product_id": 9001, "mode": "weight", "amount": "1", "unit": "kg", "unit_price": "1"}, {"product_id": 9001, "mode": "pieces", "amount": "2", "thickness_in": "2", "note": "sin grasa"}, {"product_id": 9003, "mode": "pieces", "amount": "2"}]'

-- Everything an order test needs to compare: counts and total stock, read as the superuser.
CREATE FUNCTION t.fp() RETURNS text LANGUAGE sql AS $$
    SELECT concat_ws('|',
        (SELECT count(*) FROM public.orders),
        (SELECT count(*) FROM public.order_items),
        (SELECT count(*) FROM public.order_status_log),
        (SELECT count(*) FROM public.stock_movements),
        (SELECT count(*) FROM public.order_item_costs),
        (SELECT coalesce(sum(stock), 0) FROM public.products))
$$;

-- A staff-channel order in a given status with one kilo of bistec, built as the superuser.
CREATE FUNCTION t.mk_order(p_status text DEFAULT 'pending') RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
    v uuid := gen_random_uuid();
BEGIN
    INSERT INTO public.orders (id, total, delivery_type, status, channel, customer_name)
    VALUES (v, 200, 'pickup', p_status, 'mostrador', 'Test');
    INSERT INTO public.order_items (order_id, product_id, quantity_kg, unit_price, subtotal, sale_mode)
    VALUES (v, 9001, 1, 200, 200, 'weight');
    RETURN v;
END $$;

-- Moves a fresh order from one status to another as django: 'ok:<status>' or the error code.
CREATE FUNCTION t.try_transition(p_from text, p_to text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v_id   uuid := t.mk_order(p_from);
    v_code text;
BEGIN
    PERFORM t.as_django();
    v_code := t.code(format('SELECT public.set_order_status(%L, %L, %L)', v_id, p_to, 'tester'));
    PERFORM t.reset();
    IF v_code = '' THEN
        RETURN 'ok:' || (SELECT status FROM public.orders WHERE id = v_id);
    END IF;
    RETURN v_code;
END $$;

-- One stock case of the shared JSON: product, order, then the steps the case names.
CREATE FUNCTION t.stock_case(c jsonb, n int) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    v_pid   int := 9100 + n;
    v_piece boolean := coalesce((c ->> 'stock_unit') = 'piece', false);
    v_item  jsonb;
    v_order uuid;
    v_obs   jsonb := '{}'::jsonb;
    v_code  text;
BEGIN
    PERFORM t.mk_product(v_pid, 'Stock ' || (c ->> 'id'), 10,
        CASE WHEN v_piece THEN 'piece' ELSE 'kg' END,
        CASE WHEN v_piece THEN ARRAY['pieces'] ELSE ARRAY['money', 'weight'] END,
        (c ->> 'stock_inicial')::numeric, coalesce((c ->> 'track_stock')::boolean, true),
        CASE WHEN v_piece THEN 'piece' ELSE 'kg' END);
    v_item := CASE WHEN (c -> 'pedido') ? 'pieces'
        THEN jsonb_build_object('product_id', v_pid, 'mode', 'pieces', 'amount', c #>> '{pedido,pieces}')
        ELSE jsonb_build_object('product_id', v_pid, 'mode', 'weight', 'amount', c #>> '{pedido,quantity_kg}', 'unit', 'kg')
    END;
    PERFORM t.as_django();
    v_order := public.create_order_staff(jsonb_build_array(v_item), 'Cliente de stock');
    PERFORM t.reset();
    IF c ? 'al_crear' THEN
        v_obs := v_obs || jsonb_build_object('al_crear', (SELECT stock::text FROM public.products WHERE id = v_pid));
    END IF;
    IF c ? 'al_confirmar' OR c ? 'al_confirmar_error' OR c ? 'al_cancelar' THEN
        PERFORM t.as_django();
        v_code := t.code(format('SELECT public.set_order_status(%L, %L, %L)', v_order, 'confirmed', 'tester'));
        PERFORM t.reset();
        IF c ? 'al_confirmar_error' THEN
            v_obs := v_obs || jsonb_build_object('al_confirmar_error', v_code);
        END IF;
        IF c ? 'al_confirmar' THEN
            v_obs := v_obs || jsonb_build_object('al_confirmar', (SELECT stock::text FROM public.products WHERE id = v_pid));
        END IF;
    END IF;
    IF c ? 'al_cancelar' OR c ? 'al_cancelar_desde_pending' THEN
        PERFORM t.as_django();
        PERFORM public.set_order_status(v_order, 'cancelled', 'tester');
        PERFORM t.reset();
        v_obs := v_obs || jsonb_build_object(
            CASE WHEN c ? 'al_cancelar' THEN 'al_cancelar' ELSE 'al_cancelar_desde_pending' END,
            (SELECT stock::text FROM public.products WHERE id = v_pid));
    END IF;
    IF c ? 'estado_final' THEN
        v_obs := v_obs || jsonb_build_object('estado_final', (SELECT status FROM public.orders WHERE id = v_order));
    END IF;
    RETURN v_obs;
END $$;

-- ================================================================ who may call what
SELECT is(t.can_exec('anon', 'create_order_v2(jsonb,text,jsonb,text,text)'), false, 'anon cannot create_order_v2');
SELECT is(t.can_exec('authenticated', 'create_order_v2(jsonb,text,jsonb,text,text)'), true, 'authenticated can create_order_v2');
SELECT is(t.can_exec('django', 'create_order_v2(jsonb,text,jsonb,text,text)'), false, 'django cannot create_order_v2');
SELECT is(t.can_exec(r, 'create_order_staff(jsonb,text,text,text,jsonb,text,text,text,text,text)'), r = 'django',
          r || ': create_order_staff is for django only')
FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r;
SELECT is(t.can_exec(r, 'set_order_status(uuid,text,text)'), r = 'django',
          r || ': set_order_status is for django only')
FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r;
SELECT is(t.can_exec(r, '_create_order(uuid,text,text,text,text,text,text,jsonb,text,jsonb,text,text)'), false,
          r || ' cannot call the internal _create_order')
FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r;
SELECT is(t.can_exec('authenticated', 'update_order_status(uuid,text)'), true, 'authenticated keeps update_order_status');
SELECT is(t.can_exec('django', 'update_order_status(uuid,text)'), true, 'django keeps update_order_status');
SELECT is((SELECT p.prosecdef AND p.proconfig = ARRAY['search_path=""'] FROM pg_proc p WHERE p.oid = f::regprocedure), true,
          f || ' is SECURITY DEFINER with an empty search_path')
FROM unnest(ARRAY['public.create_order_v2(jsonb,text,jsonb,text,text)',
                  'public.create_order_staff(jsonb,text,text,text,jsonb,text,text,text,text,text)',
                  'public.set_order_status(uuid,text,text)',
                  'public._create_order(uuid,text,text,text,text,text,text,jsonb,text,jsonb,text,text)',
                  'public.update_order_status(uuid,text)']) AS f;

SELECT t.as_anon();
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), '42501', 'anon is refused on create_order_v2');
SELECT is(t.code(format('SELECT public.set_order_status(%L, ''confirmed'')', gen_random_uuid())), '42501', 'anon is refused on set_order_status');
SELECT t.reset();
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'')', :'one')), '42501', 'a customer is refused on create_order_staff');
SELECT is(t.code(format('SELECT public.set_order_status(%L, ''confirmed'')', gen_random_uuid())), '42501', 'a customer is refused on set_order_status');
SELECT t.reset();
SELECT t.as_user('00000000-0000-0000-0000-0000000000a1');
SELECT is(t.code(format('SELECT public.set_order_status(%L, ''confirmed'')', gen_random_uuid())), '42501',
          'even an admin session cannot call set_order_status: only django and the wrapper do');
SELECT t.reset();
SELECT t.as_django();
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), '42501', 'django is refused on create_order_v2');
SELECT t.reset();
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), 'not_authenticated',
          'a call with no session at all is not_authenticated');

-- ================================================================ create_order_v2: what it stores
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT public.create_order_v2(:'cart_mix', 'pickup', '{}'::jsonb, 'Pasa por ella mi hermano', 'MXN') AS oid \gset
SELECT t.reset();

SELECT is((SELECT ARRAY[o.channel, o.currency, o.status, o.delivery_type, o.notes]
           FROM public.orders o WHERE o.id = :'oid'),
          ARRAY['web', 'MXN', 'pending', 'pickup', 'Pasa por ella mi hermano'],
          'the order is a pending web order in MXN with its notes');
SELECT is((SELECT o.user_id FROM public.orders o WHERE o.id = :'oid'), '00000000-0000-0000-0000-0000000000c1'::uuid,
          'the order belongs to auth.uid()');
SELECT is((SELECT o.total FROM public.orders o WHERE o.id = :'oid'), 820.00::numeric,
          'the total is the sum of the server prices: 200 + 120 + 500');
SELECT is((SELECT ARRAY[o.fx_rate_used::text, o.total_usd::text] FROM public.orders o WHERE o.id = :'oid'),
          ARRAY[NULL, NULL]::text[], 'an MXN order stores no rate and no dollars');
SELECT is((SELECT count(*) FROM public.order_items i WHERE i.order_id = :'oid'), 3::bigint, 'one item per line');
SELECT is((SELECT ARRAY[i.quantity_kg::text, i.unit_price::text, i.subtotal::text, i.sale_mode, i.pieces::text, i.discount::text, i.note]
           FROM public.order_items i WHERE i.order_id = :'oid' ORDER BY i.id LIMIT 1),
          ARRAY['1.000', '200.00', '200.00', 'weight', NULL, '0.00', NULL],
          'line 1: weight, price from the server although the browser sent unit_price 1');
SELECT is((SELECT ARRAY[i.quantity_kg::text, i.unit_price::text, i.subtotal::text, i.sale_mode, i.pieces::text, i.discount::text, i.note]
           FROM public.order_items i WHERE i.order_id = :'oid' ORDER BY i.id OFFSET 1 LIMIT 1),
          ARRAY['0.600', '200.00', '120.00', 'pieces', '2', '0.00', 'grosor 2 in; sin grasa'],
          'line 2: pieces by thickness, the thickness travels in the note');
SELECT is((SELECT ARRAY[i.quantity_kg::text, i.unit_price::text, i.subtotal::text, i.sale_mode, i.pieces::text, i.discount::text, i.note]
           FROM public.order_items i WHERE i.order_id = :'oid' ORDER BY i.id OFFSET 2 LIMIT 1),
          ARRAY['0.000', '250.00', '500.00', 'pieces', '2', '0.00', NULL],
          'line 3: piece-priced merchandise has quantity_kg 0.000');
SELECT is((SELECT ARRAY[l.from_status, l.to_status, l.actor] FROM public.order_status_log l WHERE l.order_id = :'oid'),
          ARRAY[NULL, 'pending', '00000000-0000-0000-0000-0000000000c1'],
          'the status log starts with NULL -> pending by the customer');
SELECT is((SELECT count(*) FROM public.order_status_log l WHERE l.order_id = :'oid'), 1::bigint, 'and holds only that row');
SELECT is((SELECT count(*) FROM public.stock_movements), 0::bigint, 'creating an order moves no stock');

-- a promotion is part of the order
INSERT INTO public.product_promotions (product_id, kind, value, starts_at, ends_at)
VALUES (9001, 'percent', 10, now() - interval '1 day', now() + interval '1 day');
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT public.create_order_v2('[{"product_id": 9001, "mode": "weight", "amount": "2", "unit": "kg"}]', 'pickup') AS oid_promo \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[i.unit_price::text, i.subtotal::text, i.discount::text] FROM public.order_items i WHERE i.order_id = :'oid_promo'),
          ARRAY['180.00', '360.00', '40.00'], 'the order keeps the promotion price and its discount');
SELECT is((SELECT o.total FROM public.orders o WHERE o.id = :'oid_promo'), 360.00::numeric, 'and the total with it');
DELETE FROM public.product_promotions WHERE product_id = 9001;

-- USD: the house rate and the dollars are stored
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT public.create_order_v2('[{"product_id": 9001, "mode": "money", "amount": "10"}, {"product_id": 9001, "mode": "weight", "amount": "1", "unit": "kg"}]',
                              'pickup', '{}'::jsonb, NULL, 'USD') AS oid_usd \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[o.currency, o.fx_rate_used::text, o.total::text, o.total_usd::text] FROM public.orders o WHERE o.id = :'oid_usd'),
          ARRAY['USD', '18.2378', '382.38', (10.00 + ceil(200 / 18.2378 * 100) / 100)::numeric(12,2)::text],
          'a USD order stores the house rate, the pesos and the dollars charged');

-- ================================================================ create_order_v2: limits and errors
-- Customer 1 holds three pending orders now; the checks below create more, so close them first.
UPDATE public.orders SET status = 'delivered' WHERE user_id = '00000000-0000-0000-0000-0000000000c1';
SELECT t.fp() AS fp0 \gset
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code($$SELECT public.create_order_v2('[]', 'pickup')$$), 'invalid_items', 'an empty cart');
SELECT is(t.code($$SELECT public.create_order_v2(NULL, 'pickup')$$), 'invalid_items', 'a NULL cart');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''drone'')', :'one')), 'invalid_delivery_type', 'an unknown delivery type');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, NULL)', :'one')), 'invalid_delivery_type', 'a NULL delivery type');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'', ''{}'', NULL, ''EUR'')', :'one')), 'invalid_currency', 'an unknown currency');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'', ''[]'')', :'one')), 'invalid_address', 'an address that is not an object');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'', %L)', :'one', jsonb_build_object('address', repeat('x', 2000)))),
          'address_too_long', 'an address over 2000 characters');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'', ''{}'', %L)', :'one', repeat('n', 501))),
          'notes_too_long', 'notes over 500 characters');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')',
              (SELECT jsonb_agg('{"product_id": 9001, "mode": "money", "amount": "100"}'::jsonb) FROM generate_series(1, 51)))),
          'too_many_lines', 'fifty-one lines');
SELECT is(t.code($$SELECT public.create_order_v2('[{"product_id": 9001, "mode": "weight", "amount": "1", "unit": "kg"}, {"product_id": 9003, "mode": "weight", "amount": "1"}]', 'pickup')$$),
          'sale_mode_not_allowed', 'a line the product does not allow rejects the whole order');
SELECT is(t.msg($$SELECT public.create_order_v2('[{"product_id": 9001, "mode": "weight", "amount": "1", "unit": "kg"}, {"product_id": 9003, "mode": "weight", "amount": "1"}]', 'pickup')$$)
          LIKE 'sale_mode_not_allowed: line 2 %', true, 'and names the line');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''delivery'')', :'one')), 'below_minimum_order',
          'delivery below the 150 minimum of store_settings');
SELECT is(t.code($$SELECT public.create_order_v2('[{"product_id": 9002, "mode": "weight", "amount": "200", "unit": "g"}]', 'pickup')$$),
          'below_minimum_quantity', 'a line under the minimum quantity of the product');
SELECT is(t.code($$SELECT public.create_order_v2('[{"product_id": 9002, "mode": "money", "amount": "28"}]', 'pickup')$$),
          'below_minimum_quantity', 'the minimum counts money lines too');
SELECT t.reset();
SELECT t.set_fx(5);
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'', ''{}'', NULL, ''USD'')', :'one')), 'fx_unavailable',
          'USD with a stale rate');
SELECT t.reset();
SELECT t.set_fx(0);
SELECT is(t.fp(), :'fp0', 'every rejected call above changed no data');

SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''delivery'', %L)', '[{"product_id": 9001, "mode": "weight", "amount": "1", "unit": "kg"}]',
                        '{"address": "Av. Carranza 100, San Luis Potosi"}')), '', 'delivery at or above the minimum with an address');
SELECT public.create_order_v2(:'one', 'pickup', NULL) AS oid_null \gset
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'', ''{}'', %L)', :'one', repeat('n', 500))), '', 'notes of exactly 500 characters');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'', %L)', :'one', jsonb_build_object('address', repeat('x', 1980)))), '',
          'an address that is 2000 characters of JSON');
SELECT t.reset();
UPDATE public.orders SET status = 'delivered' WHERE user_id = '00000000-0000-0000-0000-0000000000c1';
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code($$SELECT public.create_order_v2('[{"product_id": 9002, "mode": "weight", "amount": "250", "unit": "g"}]', 'pickup')$$), '',
          'exactly the minimum quantity');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')',
              (SELECT jsonb_agg('{"product_id": 9001, "mode": "money", "amount": "100"}'::jsonb) FROM generate_series(1, 50)))), '',
          'fifty lines');
SELECT t.reset();
SELECT is((SELECT o.delivery_address::text FROM public.orders o WHERE o.id = :'oid_null'), '{}', 'a NULL address is stored as {}');

-- store minimum for pickup comes from store_settings too
UPDATE public.store_settings SET min_order_pickup = 200 WHERE id = 1;
SELECT t.as_user('00000000-0000-0000-0000-0000000000c2');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), 'below_minimum_order', 'a pickup minimum of 200 rejects 100');
SELECT is(t.code($$SELECT public.create_order_v2('[{"product_id": 9001, "mode": "money", "amount": "200"}]', 'pickup')$$), '', 'and accepts exactly 200');
SELECT t.reset();
UPDATE public.store_settings SET min_order_pickup = 0 WHERE id = 1;

-- no more than 5 pending orders per customer
SELECT t.as_user('00000000-0000-0000-0000-0000000000c2');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), '', 'pending order ' || n || ' of customer 2')
FROM generate_series(2, 5) AS n;
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), 'too_many_pending', 'the sixth pending order is refused');
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.orders WHERE user_id = '00000000-0000-0000-0000-0000000000c2' AND status = 'pending'), 5::bigint,
          'customer 2 holds exactly five pending orders');
SELECT (SELECT id FROM public.orders WHERE user_id = '00000000-0000-0000-0000-0000000000c2' ORDER BY id LIMIT 1) AS c2_first \gset
SELECT t.as_django();
SELECT is(public.set_order_status(:'c2_first', 'cancelled', 'tester'), 'cancelled', 'django cancels one of them');
SELECT t.reset();
SELECT t.as_user('00000000-0000-0000-0000-0000000000c2');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), '', 'a cancelled order frees one place');
SELECT t.reset();
SELECT t.as_user('00000000-0000-0000-0000-0000000000a1');
SELECT is(t.code(format('SELECT public.create_order_v2(%L, ''pickup'')', :'one')), '', 'the limit is per customer: another user is not affected');
SELECT t.reset();

-- ================================================================ create_order_staff
SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9001, "mode": "weight", "amount": "2", "unit": "kg"}]',
                                 'Doña Mary', '4441234567', 'pickup', '{}'::jsonb, 'Sin hueso', 'mostrador', 'MXN',
                                 'efectivo', 'staff-uuid-1') AS sid \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[o.channel, o.customer_name, o.customer_phone, o.payment_method, o.staff_ref, o.status, o.currency, o.notes]
           FROM public.orders o WHERE o.id = :'sid'),
          ARRAY['mostrador', 'Doña Mary', '4441234567', 'efectivo', 'staff-uuid-1', 'pending', 'MXN', 'Sin hueso'],
          'a counter order keeps who bought, how they pay and who sold');
SELECT is((SELECT o.user_id FROM public.orders o WHERE o.id = :'sid'), NULL::uuid, 'a staff order has no user');
SELECT is((SELECT o.total FROM public.orders o WHERE o.id = :'sid'), 400.00::numeric, 'priced by the server: 2 kg * 200');
SELECT is((SELECT ARRAY[l.from_status, l.to_status, l.actor] FROM public.order_status_log l WHERE l.order_id = :'sid'),
          ARRAY[NULL, 'pending', 'staff-uuid-1'], 'the log actor is the staff reference');

SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9001, "mode": "weight", "amount": "1", "unit": "kg"}]', 'Don Beto', '  ', 'delivery',
                                 '{"address": "Av. Carranza 100"}'::jsonb, '', 'whatsapp', 'MXN', '', NULL) AS sid2 \gset
SELECT public.create_order_staff('[{"product_id": 9001, "mode": "money", "amount": "100"}]', '  Ana  ') AS sid3 \gset
SELECT public.create_order_staff('[{"product_id": 9001, "mode": "money", "amount": "10"}]', 'Cliente USD', NULL, 'pickup',
                                 '{}'::jsonb, NULL, 'mostrador', 'USD', 'tarjeta', 'staff-uuid-1') AS sid4 \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[o.channel, o.delivery_type, o.delivery_address ->> 'address', o.customer_phone, o.notes, o.payment_method, o.staff_ref]
           FROM public.orders o WHERE o.id = :'sid2'),
          ARRAY['whatsapp', 'delivery', 'Av. Carranza 100', NULL, NULL, NULL, NULL],
          'a WhatsApp delivery order; blank phone, notes and payment are stored as NULL');
SELECT is((SELECT ARRAY[o.channel, o.delivery_type, o.customer_name, o.currency] FROM public.orders o WHERE o.id = :'sid3'),
          ARRAY['mostrador', 'pickup', 'Ana', 'MXN'], 'the defaults: mostrador, pickup, MXN, and the name is trimmed');
SELECT is((SELECT ARRAY[o.currency, o.fx_rate_used::text, o.total::text, o.total_usd::text, o.payment_method] FROM public.orders o WHERE o.id = :'sid4'),
          ARRAY['USD', '18.2378', '182.38', '10.00', 'tarjeta'], 'a staff USD order stores the house rate and the dollars');
SELECT is((SELECT l.actor FROM public.order_status_log l WHERE l.order_id = :'sid3'), NULL, 'with no staff reference the log actor is NULL');

SELECT t.fp() AS fp1 \gset
SELECT t.as_django();
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', NULL, ''pickup'', ''{}'', NULL, ''web'')', :'one')), 'invalid_channel', 'channel web is not a staff channel');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', NULL, ''pickup'', ''{}'', NULL, NULL)', :'one')), 'invalid_channel', 'a NULL channel');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, NULL)', :'one')), 'invalid_customer_name', 'a NULL name');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''   '')', :'one')), 'invalid_customer_name', 'a blank name');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, %L)', :'one', repeat('n', 121))), 'invalid_customer_name', 'a name of 121 characters');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', %L)', :'one', repeat('9', 21))), 'invalid_customer_phone', 'a phone of 21 characters');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', NULL, ''pickup'', ''{}'', NULL, ''mostrador'', ''MXN'', ''cheque'')', :'one')),
          'invalid_payment_method', 'an unknown payment method');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', NULL, ''pickup'', ''{}'', NULL, ''mostrador'', ''MXN'', NULL, %L)', :'one', repeat('s', 101))),
          'invalid_staff_ref', 'a staff reference of 101 characters');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', NULL, ''drone'')', :'one')), 'invalid_delivery_type', 'the order rules apply: delivery type');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', NULL, ''delivery'')', :'one')), 'below_minimum_order', 'the order rules apply: minimum for delivery');
SELECT is(t.code('SELECT public.create_order_staff(''[]'', ''X'')'), 'invalid_items', 'the order rules apply: empty cart');
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''X'', NULL, ''pickup'', ''{}'', NULL, ''mostrador'', ''EUR'')', :'one')), 'invalid_currency', 'the order rules apply: currency');
SELECT t.reset();
SELECT is(t.fp(), :'fp1', 'every rejected staff call changed no data');

SELECT t.as_django();
SELECT is(t.code(format('SELECT public.create_order_staff(%L, ''Mucho'') FROM generate_series(1, 8)', :'one')), '',
          'staff orders have no limit of pending orders');
SELECT t.reset();

-- ================================================================ set_order_status: errors
SELECT t.mk_order() AS e1 \gset
SELECT t.as_django();
SELECT is(t.code(format('SELECT public.set_order_status(%L, ''bogus'')', :'e1')), 'invalid_status', 'an unknown status');
SELECT is(t.code(format('SELECT public.set_order_status(%L, NULL)', :'e1')), 'invalid_status', 'a NULL status');
SELECT is(t.code(format('SELECT public.set_order_status(%L, ''confirmed'')', gen_random_uuid())), 'order_not_found', 'an unknown order');
SELECT is(t.code('SELECT public.set_order_status(NULL, ''confirmed'')'), 'order_not_found', 'a NULL order');
SELECT t.reset();

-- ================================================================ the 36 transitions
SELECT is(t.try_transition(f, tt),
          CASE WHEN tt IN (SELECT jsonb_array_elements_text(current_setting('casos.json')::jsonb #> ARRAY['transiciones', 'permitidas', f]))
               THEN 'ok:' || tt ELSE 'invalid_transition' END,
          f || ' -> ' || tt)
FROM unnest(ARRAY['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']) AS f,
     unnest(ARRAY['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']) AS tt;
SELECT is(t.try_transition(current_setting('casos.json')::jsonb #>> '{transiciones,ejemplo_rechazado,de}',
                           current_setting('casos.json')::jsonb #>> '{transiciones,ejemplo_rechazado,a}'),
          current_setting('casos.json')::jsonb #>> '{transiciones,ejemplo_rechazado,error}',
          'the rejected example of the JSON');
SELECT is(t.msg(format('SELECT public.set_order_status(%L, ''delivered'', ''x'')', t.mk_order('pending')))
          LIKE 'invalid_transition: pending -> delivered%', true, 'the message names both statuses');

-- ================================================================ the log of transitions
SELECT t.mk_order() AS lid \gset
SELECT t.as_django();
SELECT is(public.set_order_status(:'lid', 'confirmed', 'staff-uuid-2'), 'confirmed', 'set_order_status returns the new status');
SELECT public.set_order_status(:'lid', 'preparing', 'staff-uuid-2');
SELECT is(t.code(format('SELECT public.set_order_status(%L, ''delivered'', ''staff-uuid-2'')', :'lid')), 'invalid_transition', 'a rejected move');
SELECT t.reset();
SELECT is((SELECT array_agg(l.from_status || '>' || l.to_status || '@' || l.actor ORDER BY l.id) FROM public.order_status_log l WHERE l.order_id = :'lid'),
          ARRAY['pending>confirmed@staff-uuid-2', 'confirmed>preparing@staff-uuid-2'],
          'every successful move is logged with its actor and a rejected one is not');
SELECT is((SELECT status FROM public.orders WHERE id = :'lid'), 'preparing', 'and the order stays where the last good move left it');

-- ================================================================ the 6 stock cases of the JSON
SELECT is(t.stock_case(c, n::int),
          c - 'id' - 'stock_unit' - 'stock_inicial' - 'pedido' - 'track_stock',
          'stock case ' || (c ->> 'id'))
FROM jsonb_array_elements(current_setting('casos.json')::jsonb -> 'stock') WITH ORDINALITY AS e(c, n);

-- ================================================================ stock: beyond the JSON
INSERT INTO public.products (id, category_id, name, price_per_kg, price_per_lb, stock, is_active, track_stock, stock_unit, price_unit, sale_modes)
SELECT 9201, id, 'Tracked A', 10, 4.54, 2.500, true, true, 'kg', 'kg', ARRAY['money', 'weight'] FROM public.categories WHERE slug = 'carnes-rojas';
INSERT INTO public.products (id, category_id, name, price_per_kg, price_per_lb, stock, is_active, track_stock, stock_unit, price_unit, sale_modes)
SELECT 9202, id, 'Tracked B', 10, 4.54, 1.000, true, true, 'kg', 'kg', ARRAY['money', 'weight'] FROM public.categories WHERE slug = 'carnes-rojas';
INSERT INTO public.products (id, category_id, name, price_per_kg, price_per_lb, stock, is_active, track_stock, stock_unit, price_unit, sale_modes)
SELECT 9203, id, 'Untracked C', 10, 4.54, 0, true, false, 'kg', 'kg', ARRAY['money', 'weight'] FROM public.categories WHERE slug = 'carnes-rojas';

-- two lines of the same product are one deduction of the sum, in one movement
SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9201, "mode": "weight", "amount": "1", "unit": "kg"}, {"product_id": 9201, "mode": "weight", "amount": "1", "unit": "kg"}, {"product_id": 9203, "mode": "weight", "amount": "1", "unit": "kg"}]', 'Grouped') AS g1 \gset
SELECT public.set_order_status(:'g1', 'confirmed', 'staff-uuid-3');
SELECT t.reset();
SELECT is((SELECT stock::text FROM public.products WHERE id = 9201), '0.500', 'two lines of one product deduct their sum: 2.500 - 2.000');
SELECT is((SELECT stock::text FROM public.products WHERE id = 9203), '0.000', 'a product without tracking keeps its stock');
SELECT is((SELECT array_agg(m.product_id || ':' || m.delta || ':' || m.reason || ':' || m.staff_ref ORDER BY m.product_id) FROM public.stock_movements m WHERE m.order_id = :'g1'),
          ARRAY['9201:-2.000:sale:staff-uuid-3'], 'one sale movement per tracked product, negative, with the order and the actor');

-- one short product aborts the whole confirmation: the other product is not touched either
SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9201, "mode": "weight", "amount": "0.4", "unit": "kg"}, {"product_id": 9202, "mode": "weight", "amount": "1.5", "unit": "kg"}]', 'Atomic') AS a1 \gset
SELECT t.reset();
SELECT t.fp() AS fp2 \gset
SELECT t.as_django();
SELECT is(t.code(format('SELECT public.set_order_status(%L, ''confirmed'', ''x'')', :'a1')), 'insufficient_stock', 'the second product is short');
SELECT is(t.msg(format('SELECT public.set_order_status(%L, ''confirmed'', ''x'')', :'a1')) LIKE 'insufficient_stock: Tracked B needs 1.500, only 1.000 in stock', true,
          'the message names the product, what it needs and what there is');
SELECT t.reset();
SELECT is(t.fp(), :'fp2', 'nothing changed: not the stock of either product, not the status log, not a movement');
SELECT is((SELECT status FROM public.orders WHERE id = :'a1'), 'pending', 'and the order is still pending');
SELECT is((SELECT stock::text FROM public.products WHERE id = 9201), '0.500', 'the product that had enough was not deducted');

-- cancel from every status after confirmed restores exactly what was sold
SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9202, "mode": "weight", "amount": "0.25", "unit": "kg"}]', 'Cancel ' || s) AS x
FROM unnest(ARRAY['confirmed', 'preparing', 'ready']) AS s;
SELECT t.reset();
SELECT t.as_django();
SELECT public.set_order_status(o.id, 'confirmed', 'a') FROM public.orders o WHERE o.customer_name LIKE 'Cancel %';
SELECT public.set_order_status(o.id, 'preparing', 'a') FROM public.orders o WHERE o.customer_name IN ('Cancel preparing', 'Cancel ready');
SELECT public.set_order_status(o.id, 'ready', 'a') FROM public.orders o WHERE o.customer_name = 'Cancel ready';
SELECT t.reset();
SELECT is((SELECT stock::text FROM public.products WHERE id = 9202), '0.250', 'three confirmed orders of 0.25 kg took 0.75 of 1.000');
SELECT t.as_django();
SELECT public.set_order_status(o.id, 'cancelled', 'b') FROM public.orders o WHERE o.customer_name LIKE 'Cancel %';
SELECT t.reset();
SELECT is((SELECT stock::text FROM public.products WHERE id = 9202), '1.000', 'cancelling from confirmed, preparing and ready restored all 0.75');
SELECT is((SELECT count(*) FROM public.stock_movements m JOIN public.orders o ON o.id = m.order_id
           WHERE o.customer_name LIKE 'Cancel %' AND m.reason = 'cancel' AND m.delta = 0.250 AND m.staff_ref = 'b'), 3::bigint,
          'each cancellation wrote one positive cancel movement with the actor');

-- cancelling a pending order writes no movement
SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9202, "mode": "weight", "amount": "0.25", "unit": "kg"}]', 'Pending cancel') AS pc \gset
SELECT public.set_order_status(:'pc', 'cancelled', 'c');
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.stock_movements WHERE order_id = :'pc'), 0::bigint, 'cancelling a pending order moves no stock');

-- ================================================================ frozen costs
INSERT INTO public.product_costs (product_id, cost_per_kg, yield_pct) VALUES (9001, 120, 80);
INSERT INTO public.product_costs (product_id, cost_per_piece) VALUES (9003, 100);
SELECT t.as_django();
SELECT public.create_order_staff('[{"product_id": 9001, "mode": "weight", "amount": "2", "unit": "kg"}, {"product_id": 9003, "mode": "pieces", "amount": "2"}, {"product_id": 9002, "mode": "weight", "amount": "1", "unit": "kg"}]', 'Costs') AS cc \gset
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.order_item_costs c JOIN public.order_items i ON i.id = c.order_item_id WHERE i.order_id = :'cc'), 0::bigint,
          'no cost is frozen while the order is pending');
SELECT t.as_django();
SELECT public.set_order_status(:'cc', 'confirmed', 'd');
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.order_item_costs c JOIN public.order_items i ON i.id = c.order_item_id WHERE i.order_id = :'cc'), 2::bigint,
          'confirming freezes a cost for each item that has one: the product without cost gets no row');
SELECT is((SELECT ARRAY[c.cost_per_kg_frozen::text, c.cost_per_piece_frozen::text, c.yield_pct_frozen::text, c.total_cost_frozen::text]
           FROM public.order_item_costs c JOIN public.order_items i ON i.id = c.order_item_id
           WHERE i.order_id = :'cc' AND i.product_id = 9001),
          ARRAY['120.0000', NULL, '80.00', '300.00'], 'a kg line freezes cost, yield and 2 kg * 120 / 0.80 = 300.00');
SELECT is((SELECT ARRAY[c.cost_per_kg_frozen::text, c.cost_per_piece_frozen::text, c.yield_pct_frozen::text, c.total_cost_frozen::text]
           FROM public.order_item_costs c JOIN public.order_items i ON i.id = c.order_item_id
           WHERE i.order_id = :'cc' AND i.product_id = 9003),
          ARRAY[NULL, '100.0000', NULL, '200.00'], 'a piece line freezes 2 pieces * 100 = 200.00');
UPDATE public.product_costs SET cost_per_kg = 999 WHERE product_id = 9001;
SELECT is((SELECT c.total_cost_frozen::text FROM public.order_item_costs c JOIN public.order_items i ON i.id = c.order_item_id
           WHERE i.order_id = :'cc' AND i.product_id = 9001), '300.00', 'a later change of the cost does not touch the frozen one');
SELECT t.as_django();
SELECT public.set_order_status(:'cc', 'preparing', 'd');
SELECT public.set_order_status(:'cc', 'cancelled', 'd');
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.order_item_costs c JOIN public.order_items i ON i.id = c.order_item_id WHERE i.order_id = :'cc'), 2::bigint,
          'cancelling keeps the frozen costs: they are history');

-- ================================================================ update_order_status wrapper
SELECT t.mk_order() AS w1 \gset
SELECT t.as_user('00000000-0000-0000-0000-0000000000a1');
SELECT is(t.code(format('SELECT public.update_order_status(%L, ''confirmed'')', :'w1')), '', 'an admin moves an order through the wrapper');
SELECT is(t.code(format('SELECT public.update_order_status(%L, ''delivered'')', :'w1')), 'invalid_transition',
          'the wrapper enforces the transition map');
SELECT is(t.msg(format('SELECT public.update_order_status(%L, ''bogus'')', :'w1')), 'Invalid status', 'the legacy message for a bad status');
SELECT is(t.msg(format('SELECT public.update_order_status(%L, ''confirmed'')', gen_random_uuid())), 'Order not found', 'the legacy message for an unknown order');
SELECT t.reset();
SELECT is((SELECT l.actor FROM public.order_status_log l WHERE l.order_id = :'w1' AND l.to_status = 'confirmed'),
          '00000000-0000-0000-0000-0000000000a1', 'the log actor is the admin auth.uid()');
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.msg(format('SELECT public.update_order_status(%L, ''cancelled'')', :'w1')), 'Only admins can update order status',
          'a customer cannot use the wrapper');
SELECT t.reset();
SELECT is((SELECT status FROM public.orders WHERE id = :'w1'), 'confirmed', 'and the order was not touched');

SELECT * FROM finish();
ROLLBACK;
