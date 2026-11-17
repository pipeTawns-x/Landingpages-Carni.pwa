-- create_order_web (migration 20261117000002_create_order_web.sql): the guest order of the public
-- store, run by Django.
--
-- Covers: who may call it, what a guest order stores (channel web, no user, trimmed name and
-- phone, server-computed total, USD handling, log actor), every validation, the rule of 3 pending
-- orders per phone (digits only, other phones unaffected), the relaxed CHECK orders_web_requires_user
-- and that a rejected call changes no data.
--
-- Needs the helpers of ayudas.sql and the comercio-v1 migrations 1-3, then this migration. The
-- `correr.sh` of this folder only globs comercio_v1_*.sql, so it does not run this file by itself.
-- Products (ids 9000+): 9001 bistec 200/kg.

BEGIN;
SELECT * FROM no_plan();

SELECT t.mk_user('00000000-0000-0000-0000-0000000000c1', 'Cliente Uno');
SELECT t.set_fx(0);
SELECT t.mk_product(9001, 'Bistec', 200, 'kg', ARRAY['money', 'weight']);

\set one '[{"product_id": 9001, "mode": "money", "amount": "100"}]'

CREATE FUNCTION t.fp() RETURNS text LANGUAGE sql AS $$
    SELECT concat_ws('|',
        (SELECT count(*) FROM public.orders),
        (SELECT count(*) FROM public.order_items),
        (SELECT count(*) FROM public.order_status_log))
$$;

-- ================================================================ grants
SELECT is(t.can_exec(r, 'create_order_web(jsonb,text,text,text,jsonb,text,text,text)'), r = 'django',
          r || ': create_order_web is for django only')
FROM unnest(ARRAY['anon', 'authenticated', 'django']) AS r;
SELECT is((SELECT p.prosecdef FROM pg_proc p WHERE p.oid = 'public.create_order_web(jsonb,text,text,text,jsonb,text,text,text)'::regprocedure),
          true, 'create_order_web is SECURITY DEFINER');
SELECT is((SELECT p.proconfig FROM pg_proc p WHERE p.oid = 'public.create_order_web(jsonb,text,text,text,jsonb,text,text,text)'::regprocedure),
          ARRAY['search_path=""'], 'with an empty search_path');
SELECT t.as_anon();
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', ''4441234567'')', :'one')), '42501', 'anon is refused');
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', ''4441234567'')', :'one')), '42501', 'a signed-in customer is refused');
SELECT t.reset();

-- ================================================================ a guest order
SELECT t.as_django();
SELECT public.create_order_web('[{"product_id": 9001, "mode": "weight", "amount": "2", "unit": "kg"}]',
                               '  Ana Pérez  ', ' 444 123 4567 ', 'delivery', '{"address": "Calle 1"}'::jsonb,
                               '[Tienda en línea] sin grasa', 'MXN', 'efectivo') AS wid \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[o.channel, o.customer_name, o.customer_phone, o.payment_method, o.status, o.currency, o.delivery_type, o.notes]
           FROM public.orders o WHERE o.id = :'wid'),
          ARRAY['web', 'Ana Pérez', '444 123 4567', 'efectivo', 'pending', 'MXN', 'delivery', '[Tienda en línea] sin grasa'],
          'a guest order is channel web, pending, with trimmed name and phone');
SELECT is((SELECT o.user_id FROM public.orders o WHERE o.id = :'wid'), NULL::uuid, 'a guest order has no user');
SELECT is((SELECT o.staff_ref FROM public.orders o WHERE o.id = :'wid'), NULL, 'and no staff reference');
SELECT is((SELECT o.total FROM public.orders o WHERE o.id = :'wid'), 400.00::numeric, 'priced by the server: 2 kg * 200');
SELECT is((SELECT o.delivery_address ->> 'address' FROM public.orders o WHERE o.id = :'wid'), 'Calle 1', 'the address is kept');
SELECT is((SELECT count(*) FROM public.order_items i WHERE i.order_id = :'wid'), 1::bigint, 'one line stored');
SELECT is((SELECT ARRAY[l.from_status, l.to_status, l.actor] FROM public.order_status_log l WHERE l.order_id = :'wid'),
          ARRAY[NULL, 'pending', 'web:invitado'], 'the log says a guest of the web placed it');

SELECT t.as_django();
SELECT public.create_order_web('[{"product_id": 9001, "mode": "money", "amount": "10"}]',
                               'Cliente USD', '5551230000', 'pickup', '{}'::jsonb, NULL, 'USD') AS uid \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[o.currency, o.fx_rate_used::text, o.total::text, o.total_usd::text, o.payment_method]
           FROM public.orders o WHERE o.id = :'uid'),
          ARRAY['USD', '18.2378', '182.38', '10.00', NULL], 'a guest USD order stores the house rate and the dollars, like the staff one');

-- ================================================================ validations
SELECT t.fp() AS fp1 \gset
SELECT t.as_django();
SELECT is(t.code(format('SELECT public.create_order_web(%L, NULL, ''4441234567'')', :'one')), 'invalid_customer_name', 'a NULL name');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''   '', ''4441234567'')', :'one')), 'invalid_customer_name', 'a blank name');
SELECT is(t.code(format('SELECT public.create_order_web(%L, %L, ''4441234567'')', :'one', repeat('a', 121))), 'invalid_customer_name', 'a name over 120 characters');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', NULL)', :'one')), 'invalid_customer_phone', 'a NULL phone');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', ''  '')', :'one')), 'invalid_customer_phone', 'a blank phone');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', ''12345'')', :'one')), 'invalid_customer_phone', 'a phone with fewer than 7 digits');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', %L)', :'one', repeat('1', 21))), 'invalid_customer_phone', 'a phone over 20 characters');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', ''4441234567'', ''pickup'', ''{}'', NULL, ''MXN'', ''bitcoin'')', :'one')), 'invalid_payment_method', 'a payment method outside the list');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', ''4441234567'', ''teleport'')', :'one')), 'invalid_delivery_type', 'a delivery type outside the list');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Ana'', ''4441234567'', ''pickup'', ''{}'', NULL, ''EUR'')', :'one')), 'invalid_currency', 'a currency outside the list');
SELECT is(t.code('SELECT public.create_order_web(''[]'', ''Ana'', ''4441234567'')'), 'invalid_items', 'an empty cart');
SELECT is(t.code('SELECT public.create_order_web(''[{"product_id": 999999, "mode": "money", "amount": "10"}]'', ''Ana'', ''4441234567'')'),
          'product_not_found', 'a product that does not exist');
SELECT t.reset();
SELECT is(t.fp(), :'fp1', 'every rejected call changed no data');

-- ================================================================ 3 pending per phone
SELECT t.as_django();
SELECT public.create_order_web(:'one', 'Beto', '777 000 1111');
SELECT public.create_order_web(:'one', 'Beto', '7770001111');
SELECT public.create_order_web(:'one', 'Beto', '+777-000-1111');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Beto'', ''(777) 000 1111'')', :'one')), 'too_many_pending',
          'the fourth pending order of the same phone is refused, whatever its formatting');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Otro'', ''7770002222'')', :'one')), '', 'another phone is not affected');
SELECT t.reset();
SELECT is((SELECT count(*) FROM public.orders WHERE regexp_replace(customer_phone, '\D', '', 'g') = '7770001111'), 3::bigint,
          'the refused order was not stored');

-- A confirmed order does not count as pending: moving one frees a place.
SELECT o.id AS first_id FROM public.orders o
WHERE regexp_replace(o.customer_phone, '\D', '', 'g') = '7770001111' ORDER BY o.created_at, o.id LIMIT 1 \gset
SELECT t.as_django();
SELECT public.set_order_status(:'first_id', 'cancelled', 'tester');
SELECT is(t.code(format('SELECT public.create_order_web(%L, ''Beto'', ''7770001111'')', :'one')), '', 'a cancelled order frees a place');
SELECT t.reset();

-- ================================================================ the CHECK
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name)
                   VALUES (10, 'pickup', 'web', 'Sin telefono')$$), '23514', 'a web order with no user and no phone is refused by the table');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, customer_phone)
                   VALUES (10, 'pickup', 'web', 'Sin telefono', '   ')$$), '23514', 'a blank phone does not count');
SELECT is(t.code($$INSERT INTO public.orders (total, delivery_type, channel, customer_name, customer_phone)
                   VALUES (10, 'pickup', 'web', 'Invitado', '4441234567')$$), '', 'a web order with a phone and no user is allowed');
SELECT is(t.code($$INSERT INTO public.orders (user_id, total, delivery_type, channel)
                   VALUES ('00000000-0000-0000-0000-0000000000c1', 10, 'pickup', 'web')$$), '', 'a web order with a user and no phone is still allowed');

-- create_order_v2 keeps working for a signed-in customer.
SELECT t.as_user('00000000-0000-0000-0000-0000000000c1');
SELECT public.create_order_v2(:'one', 'pickup') AS vid \gset
SELECT t.reset();
SELECT is((SELECT ARRAY[o.channel, o.user_id::text] FROM public.orders o WHERE o.id = :'vid'),
          ARRAY['web', '00000000-0000-0000-0000-0000000000c1'], 'create_order_v2 still stores a web order with its user');

SELECT * FROM finish();
ROLLBACK;
