-- comercio-v1 A2: cotizacion y pedidos.
--
-- quote_line / quote_cart ponen el precio en el servidor: el navegador manda producto, modo y
-- cantidad, nunca un precio. create_order_v2 (cliente con sesion) y create_order_staff (panel de
-- Django) guardan exactamente lo cotizado. set_order_status es el unico punto que descuenta
-- stock (pending -> confirmed) y lo repone al cancelar un pedido ya confirmado.
--
-- Errores de negocio: RAISE EXCEPTION '<codigo>: <detalle>' (SQLSTATE P0001). El codigo es el
-- texto antes del primer ':'. Codigos: not_authenticated, invalid_items, too_many_lines,
-- invalid_currency, invalid_delivery_type, invalid_address, address_too_long, notes_too_long,
-- invalid_channel, invalid_customer_name, invalid_customer_phone, invalid_payment_method,
-- invalid_staff_ref, product_not_found, sale_mode_not_allowed, invalid_amount, fx_unavailable,
-- below_minimum_quantity, below_minimum_order, too_many_pending, invalid_status,
-- order_not_found, invalid_transition, insufficient_stock. Un error en la linea N de un carrito
-- dice '<codigo>: line N <detalle>'.
--
-- Funciones SECURITY DEFINER con search_path vacio y todo calificado. EXECUTE por firma:
--   quote_line, quote_cart ........ anon, authenticated, django
--   create_order_v2 ............... authenticated
--   create_order_staff ............ django
--   set_order_status .............. django
--   _create_order ................. nadie (la llaman las dos de arriba como dueño)
--   update_order_status ........... conserva sus grants; ahora exige is_admin() y usa el mapa.
--
-- La reversa va al final, en el bloque comentado.

-- ---------------------------------------------------------------------------------------------
-- quote_line: una linea cotizada. STABLE: no bloquea ni escribe (el stock solo avisa).
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public.quote_line(
    p_product_id   integer,
    p_mode         text,
    p_amount       numeric,
    p_unit         text    DEFAULT NULL,
    p_thickness_in numeric DEFAULT NULL,
    p_currency     text    DEFAULT 'MXN'
) RETURNS TABLE (
    product_id     integer,
    sale_mode      text,
    quantity_kg    numeric,
    pieces         integer,
    unit_price     numeric,
    line_total_mxn numeric,
    discount_mxn   numeric,
    line_total_usd numeric,
    warnings       text[]
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_p      record;
    v_spec   record;
    v_promo  record;
    v_fx     record;
    v_price  numeric;
    v_factor numeric;
    v_kg     numeric;   -- kilos exactos; NULL en una linea por pieza o paquete
    v_total  numeric;
    v_usd    numeric;
    v_need   numeric;
BEGIN
    IF p_currency IS NULL OR p_currency NOT IN ('MXN', 'USD') THEN
        RAISE EXCEPTION 'invalid_currency: %', coalesce(p_currency, 'NULL');
    END IF;

    SELECT p.id, p.name, p.price_per_kg, p.price_unit, p.sale_modes, p.stock, p.stock_unit,
           p.track_stock, p.min_quantity_kg
    INTO v_p
    FROM public.products p
    WHERE p.id = p_product_id AND p.is_active;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
    END IF;

    IF p_mode IS NULL OR p_mode NOT IN ('money', 'weight', 'pieces') OR NOT (p_mode = ANY (v_p.sale_modes)) THEN
        RAISE EXCEPTION 'sale_mode_not_allowed: % is not sold by %', v_p.name, coalesce(p_mode, 'NULL');
    END IF;
    IF p_amount IS NULL OR p_amount = 'NaN'::numeric OR p_amount <= 0 THEN
        RAISE EXCEPTION 'invalid_amount: the amount must be greater than zero';
    END IF;

    SELECT f.rate, f.house_rate, f.fetched_on, f.status
    INTO v_fx
    FROM public.current_fx f;
    IF p_currency = 'USD' AND v_fx.status IS DISTINCT FROM 'ok' THEN
        RAISE EXCEPTION 'fx_unavailable: there is no exchange rate from the last 4 days';
    END IF;

    -- Precio: el de la promocion vigente si hay una, sin pasar nunca del precio de lista.
    v_price := v_p.price_per_kg;
    SELECT pr.kind, pr.value
    INTO v_promo
    FROM public.product_promotions pr
    WHERE pr.product_id = v_p.id AND pr.is_active AND pr.starts_at <= now() AND now() < pr.ends_at
    ORDER BY pr.starts_at DESC
    LIMIT 1;
    IF FOUND THEN
        v_price := CASE v_promo.kind
            WHEN 'percent'     THEN round(v_p.price_per_kg * (1 - v_promo.value / 100), 2)
            WHEN 'amount_off'  THEN v_p.price_per_kg - v_promo.value
            WHEN 'fixed_price' THEN least(v_promo.value, v_p.price_per_kg)
        END;
        v_price := greatest(v_price, 0.01);
    END IF;

    warnings := ARRAY[]::text[];
    pieces := NULL;

    IF p_mode = 'weight' THEN
        v_factor := CASE coalesce(p_unit, 'kg') WHEN 'kg' THEN 1 WHEN 'g' THEN 0.001 WHEN 'lb' THEN 0.45359237 END;
        IF v_factor IS NULL THEN
            RAISE EXCEPTION 'invalid_amount: unknown unit %', p_unit;
        END IF;
        v_kg := p_amount * v_factor;
        IF v_kg > 1000 THEN
            RAISE EXCEPTION 'invalid_amount: at most 1000 kg per line';
        END IF;
        v_total := v_kg * v_price;
        IF p_thickness_in IS NOT NULL THEN
            warnings := array_append(warnings, 'thickness_ignored');
        END IF;

    ELSIF p_mode = 'money' THEN
        IF p_amount > 1000000 THEN
            RAISE EXCEPTION 'invalid_amount: at most 1,000,000 per line';
        END IF;
        IF p_currency = 'USD' THEN
            -- Se cobra lo que el cliente pidio en dolares; los pesos salen de la tasa de la casa.
            v_usd   := round(p_amount, 2);
            v_total := round(v_usd * v_fx.house_rate, 2);
        ELSE
            v_total := round(p_amount, 2);
        END IF;
        v_kg := v_total / v_price;
        IF p_thickness_in IS NOT NULL THEN
            warnings := array_append(warnings, 'thickness_ignored');
        END IF;

    ELSE -- pieces
        IF p_amount <> trunc(p_amount) THEN
            RAISE EXCEPTION 'invalid_amount: pieces must be a whole number';
        END IF;
        IF p_amount > 10000 THEN
            RAISE EXCEPTION 'invalid_amount: at most 10000 pieces per line';
        END IF;
        pieces := p_amount::integer;
        IF v_p.price_unit = 'kg' THEN
            SELECT s.avg_piece_weight_kg, s.thickness_min_in, s.thickness_max_in, s.thickness_default_in
            INTO v_spec
            FROM public.product_cut_specs s
            WHERE s.product_id = v_p.id;
            IF NOT FOUND OR v_spec.avg_piece_weight_kg IS NULL OR v_spec.avg_piece_weight_kg <= 0 THEN
                RAISE EXCEPTION 'sale_mode_not_allowed: % has no weight per piece', v_p.name;
            END IF;
            v_factor := 1;
            IF p_thickness_in IS NOT NULL THEN
                IF p_thickness_in <= 0 THEN
                    RAISE EXCEPTION 'invalid_amount: the thickness must be greater than zero';
                END IF;
                IF v_spec.thickness_default_in IS NULL THEN
                    warnings := array_append(warnings, 'thickness_ignored');
                ELSE
                    IF (v_spec.thickness_min_in IS NOT NULL AND p_thickness_in < v_spec.thickness_min_in)
                       OR (v_spec.thickness_max_in IS NOT NULL AND p_thickness_in > v_spec.thickness_max_in) THEN
                        RAISE EXCEPTION 'invalid_amount: the thickness is outside the range of this cut';
                    END IF;
                    v_factor := p_thickness_in / v_spec.thickness_default_in;
                END IF;
            END IF;
            v_kg := pieces * v_spec.avg_piece_weight_kg * v_factor;
            IF v_kg > 1000 THEN
                RAISE EXCEPTION 'invalid_amount: at most 1000 kg per line';
            END IF;
            v_total := v_kg * v_price;
        ELSE
            -- Mercancia o paquete: el precio es por pieza y no hay kilos.
            v_kg    := NULL;
            v_total := pieces * v_price;
            IF p_thickness_in IS NOT NULL THEN
                warnings := array_append(warnings, 'thickness_ignored');
            END IF;
        END IF;
    END IF;

    product_id     := v_p.id;
    sale_mode      := p_mode;
    unit_price     := v_price::numeric(10,2);
    quantity_kg    := round(coalesce(v_kg, 0), 3)::numeric(10,3);
    line_total_mxn := round(v_total, 2)::numeric(12,2);
    IF line_total_mxn <= 0 OR (v_p.price_unit = 'kg' AND quantity_kg <= 0) THEN
        RAISE EXCEPTION 'invalid_amount: the quantity rounds down to nothing';
    END IF;
    discount_mxn := round(coalesce(v_kg, pieces::numeric) * (v_p.price_per_kg - v_price), 2)::numeric(12,2);

    IF v_fx.status = 'ok' THEN
        IF p_mode = 'money' AND p_currency = 'USD' THEN
            line_total_usd := v_usd::numeric(12,2);
        ELSE
            line_total_usd := (ceil(line_total_mxn / v_fx.house_rate * 100) / 100)::numeric(12,2);
        END IF;
    ELSE
        line_total_usd := NULL;
    END IF;

    IF v_p.track_stock THEN
        v_need := CASE v_p.stock_unit WHEN 'piece' THEN pieces::numeric ELSE v_kg END;
        IF v_need IS NOT NULL AND v_need > v_p.stock THEN
            warnings := array_append(warnings, 'low_stock');
        END IF;
    END IF;
    IF p_mode IN ('money', 'weight') AND quantity_kg < v_p.min_quantity_kg THEN
        warnings := array_append(warnings, 'below_minimum_quantity');
    END IF;

    RETURN NEXT;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- quote_cart: el carrito completo. lines sale en el mismo orden que p_items y cada linea trae
-- exactamente 9 claves. total_usd no es la suma de line_total_usd: suma exacta de las lineas
-- de dinero en USD mas el techo (al centavo) de los pesos restantes.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public.quote_cart(p_items jsonb, p_currency text DEFAULT 'MXN')
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_n         integer;
    i           integer;
    v_item      jsonb;
    v_lines     jsonb := '[]'::jsonb;
    v_fx        record;
    q           record;
    v_code      text;
    v_detail    text;
    v_total_mxn numeric := 0;
    v_usd_exact numeric := 0;
    v_rest_mxn  numeric := 0;
    v_total_usd numeric;
BEGIN
    IF p_currency IS NULL OR p_currency NOT IN ('MXN', 'USD') THEN
        RAISE EXCEPTION 'invalid_currency: %', coalesce(p_currency, 'NULL');
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'invalid_items: the cart needs at least one line';
    END IF;
    v_n := jsonb_array_length(p_items);
    IF v_n > 50 THEN
        RAISE EXCEPTION 'too_many_lines: at most 50 lines, got %', v_n;
    END IF;

    SELECT f.rate, f.house_rate, f.fetched_on, f.status INTO v_fx FROM public.current_fx f;

    FOR i IN 0 .. v_n - 1 LOOP
        v_item := p_items -> i;
        BEGIN
            IF jsonb_typeof(v_item) <> 'object' THEN
                RAISE EXCEPTION 'invalid_items: the line is not an object';
            END IF;
            SELECT * INTO q
            FROM public.quote_line(
                (v_item ->> 'product_id')::integer,
                v_item ->> 'mode',
                (v_item ->> 'amount')::numeric,
                nullif(v_item ->> 'unit', ''),
                nullif(v_item ->> 'thickness_in', '')::numeric,
                p_currency);
        EXCEPTION
            WHEN invalid_text_representation OR numeric_value_out_of_range THEN
                RAISE EXCEPTION 'invalid_items: line % has a value that is not a valid number', i + 1;
            WHEN raise_exception THEN
                v_code   := split_part(SQLERRM, ':', 1);
                v_detail := btrim(substr(SQLERRM, length(v_code) + 2));
                RAISE EXCEPTION '%: line % %', v_code, i + 1, v_detail;
        END;

        v_lines := v_lines || jsonb_build_array(jsonb_build_object(
            'product_id',     q.product_id,
            'sale_mode',      q.sale_mode,
            'quantity_kg',    q.quantity_kg::text,
            'pieces',         q.pieces,
            'unit_price',     q.unit_price::text,
            'line_total_mxn', q.line_total_mxn::text,
            'discount_mxn',   q.discount_mxn::text,
            'line_total_usd', q.line_total_usd::text,
            'warnings',       to_jsonb(coalesce(q.warnings, ARRAY[]::text[]))));

        v_total_mxn := v_total_mxn + q.line_total_mxn;
        IF v_fx.status = 'ok' THEN
            IF q.sale_mode = 'money' AND p_currency = 'USD' THEN
                v_usd_exact := v_usd_exact + q.line_total_usd;
            ELSE
                v_rest_mxn := v_rest_mxn + q.line_total_mxn;
            END IF;
        END IF;
    END LOOP;

    IF v_fx.status = 'ok' THEN
        v_total_usd := (v_usd_exact + ceil(v_rest_mxn / v_fx.house_rate * 100) / 100)::numeric(12,2);
    END IF;

    RETURN jsonb_build_object(
        'lines',     v_lines,
        'total_mxn', v_total_mxn::numeric(12,2)::text,
        'total_usd', v_total_usd::text,
        'currency',  p_currency,
        'fx',        CASE WHEN v_fx.status = 'ok' THEN jsonb_build_object(
                         'rate',       v_fx.rate::text,
                         'house_rate', v_fx.house_rate::text,
                         'fetched_on', v_fx.fetched_on::text) END);
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- _create_order: el cuerpo comun de create_order_v2 y create_order_staff. No tiene EXECUTE para
-- nadie: solo la llaman esas dos funciones, que corren como su dueño. No descuenta stock.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public._create_order(
    p_user_id          uuid,
    p_channel          text,
    p_customer_name    text,
    p_customer_phone   text,
    p_staff_ref        text,
    p_payment_method   text,
    p_actor            text,
    p_items            jsonb,
    p_delivery_type    text,
    p_delivery_address jsonb,
    p_notes            text,
    p_currency         text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_quote    jsonb;
    v_line     jsonb;
    v_in       jsonb;
    v_order_id uuid;
    v_total    numeric;
    v_min      numeric;
    v_note     text;
    i          integer;
BEGIN
    IF p_delivery_type IS NULL OR p_delivery_type NOT IN ('pickup', 'delivery') THEN
        RAISE EXCEPTION 'invalid_delivery_type: %', coalesce(p_delivery_type, 'NULL');
    END IF;
    IF char_length(p_notes) > 500 THEN
        RAISE EXCEPTION 'notes_too_long: at most 500 characters, got %', char_length(p_notes);
    END IF;
    p_delivery_address := coalesce(p_delivery_address, '{}'::jsonb);
    IF jsonb_typeof(p_delivery_address) <> 'object' THEN
        RAISE EXCEPTION 'invalid_address: the address must be a JSON object';
    END IF;
    IF char_length(p_delivery_address::text) > 2000 THEN
        RAISE EXCEPTION 'address_too_long: at most 2000 characters';
    END IF;

    v_quote := public.quote_cart(p_items, p_currency);

    FOR i IN 0 .. jsonb_array_length(v_quote -> 'lines') - 1 LOOP
        IF ((v_quote -> 'lines' -> i) -> 'warnings') ? 'below_minimum_quantity' THEN
            RAISE EXCEPTION 'below_minimum_quantity: line % is under the minimum quantity of its product', i + 1;
        END IF;
    END LOOP;

    v_total := (v_quote ->> 'total_mxn')::numeric;
    SELECT CASE WHEN p_delivery_type = 'delivery' THEN s.min_order_delivery ELSE s.min_order_pickup END
    INTO v_min
    FROM public.store_settings s
    WHERE s.id = 1;
    IF v_min IS NOT NULL AND v_total < v_min THEN
        RAISE EXCEPTION 'below_minimum_order: the minimum for % is $%, the order adds up to $%',
            p_delivery_type, v_min, v_total;
    END IF;

    -- USD: se guarda la tasa de la casa que se uso y el total en dolares cotizado.
    INSERT INTO public.orders
        (user_id, total, delivery_type, delivery_address, notes, channel, customer_name,
         customer_phone, staff_ref, payment_method, currency, fx_rate_used, total_usd)
    VALUES
        (p_user_id, v_total, p_delivery_type, p_delivery_address, nullif(btrim(p_notes), ''),
         p_channel, p_customer_name, p_customer_phone, p_staff_ref, p_payment_method, p_currency,
         CASE WHEN p_currency = 'USD' THEN (v_quote #>> '{fx,house_rate}')::numeric END,
         CASE WHEN p_currency = 'USD' THEN (v_quote ->> 'total_usd')::numeric END)
    RETURNING id INTO v_order_id;

    FOR i IN 0 .. jsonb_array_length(v_quote -> 'lines') - 1 LOOP
        v_line := v_quote -> 'lines' -> i;
        v_in   := p_items -> i;
        v_note := nullif(btrim(v_in ->> 'note'), '');
        IF char_length(v_note) > 150 THEN
            RAISE EXCEPTION 'invalid_items: line % has a note longer than 150 characters', i + 1;
        END IF;
        -- El grosor no tiene columna: viaja al principio de la nota cuando de verdad se uso.
        IF nullif(v_in ->> 'thickness_in', '') IS NOT NULL
           AND NOT ((v_line -> 'warnings') ? 'thickness_ignored') THEN
            v_note := concat_ws('; ',
                'grosor ' || trim_scale((v_in ->> 'thickness_in')::numeric)::text || ' in', v_note);
        END IF;
        INSERT INTO public.order_items
            (order_id, product_id, quantity_kg, unit_price, subtotal, sale_mode, pieces, discount, note)
        VALUES
            (v_order_id, (v_line ->> 'product_id')::integer, (v_line ->> 'quantity_kg')::numeric,
             (v_line ->> 'unit_price')::numeric, (v_line ->> 'line_total_mxn')::numeric,
             v_line ->> 'sale_mode', (v_line ->> 'pieces')::integer,
             (v_line ->> 'discount_mxn')::numeric, v_note);
    END LOOP;

    INSERT INTO public.order_status_log (order_id, from_status, to_status, actor)
    VALUES (v_order_id, NULL, 'pending', left(p_actor, 100));

    RETURN v_order_id;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- create_order_v2: pedido de un cliente con sesion (auth.uid()). Maximo 5 pending por cliente;
-- el bloqueo FOR UPDATE del perfil serializa los pedidos simultaneos de la misma persona.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public.create_order_v2(
    p_items            jsonb,
    p_delivery_type    text,
    p_delivery_address jsonb DEFAULT '{}'::jsonb,
    p_notes            text  DEFAULT NULL,
    p_currency         text  DEFAULT 'MXN'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pending integer;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'not_authenticated: sign in to create an order';
    END IF;
    PERFORM 1 FROM public.profiles pr WHERE pr.id = v_uid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'not_authenticated: this user has no profile';
    END IF;
    SELECT count(*) INTO v_pending
    FROM public.orders o
    WHERE o.user_id = v_uid AND o.status = 'pending';
    IF v_pending >= 5 THEN
        RAISE EXCEPTION 'too_many_pending: at most 5 pending orders, you have %', v_pending;
    END IF;

    RETURN public._create_order(v_uid, 'web', NULL, NULL, NULL, NULL, v_uid::text,
                                p_items, p_delivery_type, p_delivery_address, p_notes, p_currency);
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- create_order_staff: venta de mostrador o WhatsApp desde el panel (rol django). Sin usuario.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public.create_order_staff(
    p_items            jsonb,
    p_customer_name    text,
    p_customer_phone   text  DEFAULT NULL,
    p_delivery_type    text  DEFAULT 'pickup',
    p_delivery_address jsonb DEFAULT '{}'::jsonb,
    p_notes            text  DEFAULT NULL,
    p_channel          text  DEFAULT 'mostrador',
    p_currency         text  DEFAULT 'MXN',
    p_payment_method   text  DEFAULT NULL,
    p_staff_ref        text  DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_name  text := nullif(btrim(p_customer_name), '');
    v_phone text := nullif(btrim(p_customer_phone), '');
    v_pay   text := nullif(btrim(p_payment_method), '');
    v_staff text := nullif(btrim(p_staff_ref), '');
BEGIN
    IF p_channel IS NULL OR p_channel NOT IN ('mostrador', 'whatsapp') THEN
        RAISE EXCEPTION 'invalid_channel: %', coalesce(p_channel, 'NULL');
    END IF;
    IF v_name IS NULL OR char_length(v_name) > 120 THEN
        RAISE EXCEPTION 'invalid_customer_name: the name is required and has at most 120 characters';
    END IF;
    IF char_length(v_phone) > 20 THEN
        RAISE EXCEPTION 'invalid_customer_phone: at most 20 characters';
    END IF;
    IF v_pay IS NOT NULL AND v_pay NOT IN ('efectivo', 'transferencia', 'tarjeta') THEN
        RAISE EXCEPTION 'invalid_payment_method: %', v_pay;
    END IF;
    IF char_length(v_staff) > 100 THEN
        RAISE EXCEPTION 'invalid_staff_ref: at most 100 characters';
    END IF;

    RETURN public._create_order(NULL, p_channel, v_name, v_phone, v_staff, v_pay, v_staff,
                                p_items, p_delivery_type, p_delivery_address, p_notes, p_currency);
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- set_order_status: cambia el estado con el mapa de transiciones. Es el unico punto que mueve
-- el stock: al confirmar descuenta (solo productos con track_stock; si falta uno, insufficient_stock
-- aborta todo y el pedido sigue pending) y congela el costo; al cancelar un pedido que ya no esta
-- pending repone exactamente lo que se registro como 'sale'.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public.set_order_status(
    p_order_id   uuid,
    p_new_status text,
    p_actor      text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_from    text;
    v_allowed text[];
    v_row     record;
BEGIN
    IF p_new_status IS NULL
       OR p_new_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') THEN
        RAISE EXCEPTION 'invalid_status: %', coalesce(p_new_status, 'NULL');
    END IF;

    SELECT o.status INTO v_from FROM public.orders o WHERE o.id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'order_not_found: %', coalesce(p_order_id::text, 'NULL');
    END IF;

    v_allowed := CASE v_from
        WHEN 'pending'   THEN ARRAY['confirmed', 'cancelled']
        WHEN 'confirmed' THEN ARRAY['preparing', 'cancelled']
        WHEN 'preparing' THEN ARRAY['ready', 'cancelled']
        WHEN 'ready'     THEN ARRAY['delivered', 'cancelled']
        ELSE ARRAY[]::text[]
    END;
    IF NOT (p_new_status = ANY (v_allowed)) THEN
        RAISE EXCEPTION 'invalid_transition: % -> %', v_from, p_new_status;
    END IF;

    IF v_from = 'pending' AND p_new_status = 'confirmed' THEN
        -- Bloqueo de los productos con seguimiento, siempre por id ascendente.
        PERFORM 1
        FROM public.products p
        WHERE p.track_stock
          AND p.id IN (SELECT oi.product_id FROM public.order_items oi WHERE oi.order_id = p_order_id)
        ORDER BY p.id
        FOR UPDATE;

        FOR v_row IN
            SELECT oi.product_id AS pid, p.name AS pname, p.stock AS stock,
                   sum(CASE WHEN p.stock_unit = 'piece' THEN coalesce(oi.pieces, 0)::numeric
                            ELSE oi.quantity_kg END) AS need
            FROM public.order_items oi
            JOIN public.products p ON p.id = oi.product_id
            WHERE oi.order_id = p_order_id AND p.track_stock
            GROUP BY oi.product_id, p.name, p.stock
            ORDER BY oi.product_id
        LOOP
            IF v_row.need > v_row.stock THEN
                RAISE EXCEPTION 'insufficient_stock: % needs %, only % in stock',
                    v_row.pname, v_row.need, v_row.stock;
            END IF;
        END LOOP;

        FOR v_row IN
            SELECT oi.product_id AS pid,
                   sum(CASE WHEN p.stock_unit = 'piece' THEN coalesce(oi.pieces, 0)::numeric
                            ELSE oi.quantity_kg END) AS need
            FROM public.order_items oi
            JOIN public.products p ON p.id = oi.product_id
            WHERE oi.order_id = p_order_id AND p.track_stock
            GROUP BY oi.product_id
            ORDER BY oi.product_id
        LOOP
            IF v_row.need > 0 THEN
                UPDATE public.products SET stock = stock - v_row.need WHERE id = v_row.pid;
                INSERT INTO public.stock_movements (product_id, delta, reason, order_id, staff_ref)
                VALUES (v_row.pid, -v_row.need, 'sale', p_order_id, left(p_actor, 100));
            END IF;
        END LOOP;

        -- Costo congelado: kilos con rendimiento, o piezas. Sin costo capturado no hay fila.
        INSERT INTO public.order_item_costs
            (order_item_id, cost_per_kg_frozen, cost_per_piece_frozen, yield_pct_frozen, total_cost_frozen)
        SELECT oi.id,
               CASE WHEN p.price_unit =  'kg' THEN pc.cost_per_kg END,
               CASE WHEN p.price_unit <> 'kg' THEN pc.cost_per_piece END,
               CASE WHEN p.price_unit =  'kg' THEN pc.yield_pct END,
               CASE WHEN p.price_unit = 'kg'
                    THEN round(oi.quantity_kg * pc.cost_per_kg / (pc.yield_pct / 100), 2)
                    ELSE round(coalesce(oi.pieces, 0) * pc.cost_per_piece, 2) END
        FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        JOIN public.product_costs pc ON pc.product_id = oi.product_id
        WHERE oi.order_id = p_order_id
          AND ((p.price_unit = 'kg' AND pc.cost_per_kg IS NOT NULL)
               OR (p.price_unit <> 'kg' AND pc.cost_per_piece IS NOT NULL))
        ON CONFLICT (order_item_id) DO NOTHING;

    ELSIF p_new_status = 'cancelled' AND v_from <> 'pending' THEN
        PERFORM 1
        FROM public.products p
        WHERE p.id IN (SELECT m.product_id FROM public.stock_movements m WHERE m.order_id = p_order_id)
        ORDER BY p.id
        FOR UPDATE;

        FOR v_row IN
            SELECT m.product_id AS pid, -sum(m.delta) AS qty
            FROM public.stock_movements m
            WHERE m.order_id = p_order_id AND m.reason IN ('sale', 'cancel')
            GROUP BY m.product_id
            HAVING sum(m.delta) < 0
            ORDER BY m.product_id
        LOOP
            UPDATE public.products SET stock = stock + v_row.qty WHERE id = v_row.pid;
            INSERT INTO public.stock_movements (product_id, delta, reason, order_id, staff_ref)
            VALUES (v_row.pid, v_row.qty, 'cancel', p_order_id, left(p_actor, 100));
        END LOOP;
    END IF;

    UPDATE public.orders SET status = p_new_status WHERE id = p_order_id;
    INSERT INTO public.order_status_log (order_id, from_status, to_status, actor)
    VALUES (p_order_id, v_from, p_new_status, left(p_actor, 100));

    RETURN p_new_status;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- update_order_status: la envoltura que usan las paginas de administracion. Mismos mensajes de
-- antes, pero ahora el cambio pasa por set_order_status (mapa de transiciones, stock, bitacora).
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can update order status';
    END IF;
    IF p_status IS NULL
       OR p_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id) THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    PERFORM public.set_order_status(p_order_id, p_status, auth.uid()::text);
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- EXECUTE por firma. El default de Supabase da EXECUTE a PUBLIC, anon y authenticated.
-- ---------------------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.quote_line(integer, text, numeric, text, numeric, text)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.quote_cart(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._create_order(uuid, text, text, text, text, text, text, jsonb, text, jsonb, text, text)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order_v2(jsonb, text, jsonb, text, text)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order_staff(jsonb, text, text, text, jsonb, text, text, text, text, text)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_order_status(uuid, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.quote_line(integer, text, numeric, text, numeric, text)
    TO anon, authenticated, django;
GRANT EXECUTE ON FUNCTION public.quote_cart(jsonb, text) TO anon, authenticated, django;
GRANT EXECUTE ON FUNCTION public.create_order_v2(jsonb, text, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_staff(jsonb, text, text, text, jsonb, text, text, text, text, text)
    TO django;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, text, text) TO django;

-- =============================================================================================
-- Reversa de A2. Cada linea empieza con "-- ": correr.sh le quita ese prefijo y la ejecuta.
-- DOWN
-- DROP FUNCTION public.set_order_status(uuid, text, text);
-- DROP FUNCTION public.create_order_staff(jsonb, text, text, text, jsonb, text, text, text, text, text);
-- DROP FUNCTION public.create_order_v2(jsonb, text, jsonb, text, text);
-- DROP FUNCTION public._create_order(uuid, text, text, text, text, text, text, jsonb, text, jsonb, text, text);
-- DROP FUNCTION public.quote_cart(jsonb, text);
-- DROP FUNCTION public.quote_line(integer, text, numeric, text, numeric, text);
-- CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_status text) RETURNS void LANGUAGE plpgsql AS $legacy$
-- BEGIN
--     -- Check if caller is admin
--     IF NOT EXISTS (
--         SELECT 1 FROM profiles
--         WHERE id = auth.uid() 
--         AND role = 'admin'
--     ) THEN
--         RAISE EXCEPTION 'Only admins can update order status';
--     END IF;
--     
--     -- Validate status
--     IF p_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') THEN
--         RAISE EXCEPTION 'Invalid status';
--     END IF;
--     
--     -- Update order status
--     UPDATE orders
--     SET status = p_status,
--         updated_at = NOW()
--     WHERE id = p_order_id;
--     
--     -- Check if order exists
--     IF NOT FOUND THEN
--         RAISE EXCEPTION 'Order not found';
--     END IF;
-- END;
-- $legacy$;
