-- comercio-v1 A3: compras, ajustes de stock, tipo de cambio, KPIs y vistas del panel.
--
-- Todo lo que el panel de Django escribe pasa por estas funciones (SECURITY DEFINER,
-- search_path vacio, solo el rol django puede ejecutarlas). Lo que lee pasa por dos vistas
-- (panel_orders, panel_purchase_performance) con SELECT solo para django.
-- Errores de negocio: RAISE EXCEPTION '<codigo>: <detalle>' (SQLSTATE P0001), como en A2.
-- Prueba: supabase/tests/comercio_v1_panel.sql.

-- ---------------------------------------------------------------------------------------------
-- register_purchase: una compra a proveedor. Suma al stock lo vendible (rendimiento de
-- product_costs si el precio es por kilo), crea el lote, actualiza el costo y deja el movimiento.
-- Lo vendible se trunca a 3 decimales: nunca se acredita mas de lo que se compro.
CREATE FUNCTION public.register_purchase(
    p_product_id integer,
    p_qty        numeric,
    p_total_cost numeric,
    p_note       text DEFAULT NULL,
    p_staff_ref  text DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_p        record;
    v_yield    numeric := 100;
    v_add      numeric;
    v_unit     numeric;
    v_lot      bigint;
BEGIN
    SELECT p.id, p.price_per_kg, p.price_unit, p.stock_unit
      INTO v_p
      FROM public.products p
     WHERE p.id = p_product_id
       FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
    END IF;
    IF p_qty IS NULL OR p_qty = 'NaN'::numeric OR p_qty <= 0 OR p_qty > 1000000 THEN
        RAISE EXCEPTION 'invalid_amount: the quantity must be between 0 and 1,000,000';
    END IF;
    IF p_total_cost IS NULL OR p_total_cost = 'NaN'::numeric OR p_total_cost < 0 THEN
        RAISE EXCEPTION 'invalid_amount: the total cost must be zero or more';
    END IF;
    IF v_p.stock_unit = 'piece' AND p_qty <> trunc(p_qty) THEN
        RAISE EXCEPTION 'invalid_amount: pieces are whole numbers';
    END IF;
    IF char_length(p_note) > 500 THEN
        RAISE EXCEPTION 'note_too_long: at most 500 characters';
    END IF;
    IF char_length(p_staff_ref) > 100 THEN
        RAISE EXCEPTION 'invalid_staff_ref: at most 100 characters';
    END IF;

    IF v_p.price_unit = 'kg' THEN
        SELECT coalesce(c.yield_pct, 100) INTO v_yield
          FROM public.product_costs c WHERE c.product_id = v_p.id;
        v_yield := coalesce(v_yield, 100);
    END IF;
    v_add := trunc(p_qty * v_yield / 100, 3);
    IF v_add <= 0 THEN
        RAISE EXCEPTION 'invalid_amount: the purchase adds nothing to the stock after the yield';
    END IF;
    v_unit := round(p_total_cost / p_qty, 4);

    INSERT INTO public.purchase_lots (product_id, qty, total_cost, unit_cost, expected_revenue, note, staff_ref)
    VALUES (v_p.id, p_qty, p_total_cost, v_unit, round(v_add * v_p.price_per_kg, 2), p_note, p_staff_ref)
    RETURNING id INTO v_lot;

    IF v_p.price_unit = 'kg' THEN
        INSERT INTO public.product_costs (product_id, cost_per_kg, yield_pct, updated_at, updated_by)
        VALUES (v_p.id, v_unit, 100, now(), p_staff_ref)
        ON CONFLICT (product_id) DO UPDATE
           SET cost_per_kg = EXCLUDED.cost_per_kg, updated_at = now(), updated_by = EXCLUDED.updated_by;
    ELSE
        INSERT INTO public.product_costs (product_id, cost_per_piece, yield_pct, updated_at, updated_by)
        VALUES (v_p.id, v_unit, 100, now(), p_staff_ref)
        ON CONFLICT (product_id) DO UPDATE
           SET cost_per_piece = EXCLUDED.cost_per_piece, updated_at = now(), updated_by = EXCLUDED.updated_by;
    END IF;

    UPDATE public.products SET stock = stock + v_add, track_stock = true WHERE id = v_p.id;
    INSERT INTO public.stock_movements (product_id, delta, reason, lot_id, staff_ref)
    VALUES (v_p.id, v_add, 'purchase', v_lot, p_staff_ref);
    RETURN v_lot;
END
$$;

-- ---------------------------------------------------------------------------------------------
-- adjust_stock: el conteo fisico. Fija el stock, deja el movimiento con la diferencia y la razon.
CREATE FUNCTION public.adjust_stock(
    p_product_id integer,
    p_new_stock  numeric,
    p_reason     text,
    p_staff_ref  text
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_p      record;
    v_new    numeric;
    v_reason text := btrim(p_reason);
    v_delta  numeric;
BEGIN
    SELECT p.id, p.stock, p.stock_unit
      INTO v_p
      FROM public.products p
     WHERE p.id = p_product_id
       FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
    END IF;
    IF p_new_stock IS NULL OR p_new_stock = 'NaN'::numeric OR p_new_stock < 0 OR p_new_stock > 1000000 THEN
        RAISE EXCEPTION 'invalid_amount: the stock must be zero or more';
    END IF;
    IF v_p.stock_unit = 'piece' AND p_new_stock <> trunc(p_new_stock) THEN
        RAISE EXCEPTION 'invalid_amount: pieces are whole numbers';
    END IF;
    IF v_reason IS NULL OR v_reason = '' OR char_length(v_reason) > 200 THEN
        RAISE EXCEPTION 'reason_required: a reason of at most 200 characters';
    END IF;
    IF char_length(p_staff_ref) > 100 THEN
        RAISE EXCEPTION 'invalid_staff_ref: at most 100 characters';
    END IF;

    v_new := round(p_new_stock, 3);
    v_delta := v_new - coalesce(v_p.stock, 0);
    UPDATE public.products SET stock = v_new, track_stock = true WHERE id = v_p.id;
    IF v_delta <> 0 THEN
        INSERT INTO public.stock_movements (product_id, delta, reason, staff_ref, note)
        VALUES (v_p.id, v_delta, 'adjustment', p_staff_ref, v_reason);
    END IF;
    RETURN v_new;
END
$$;

-- ---------------------------------------------------------------------------------------------
-- El margen de seguridad que se hereda: el de la tasa mas reciente, o 2.00 sin ninguna.
CREATE FUNCTION public._latest_fx_buffer() RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT coalesce((SELECT f.buffer_pct FROM public.fx_rates f
                     ORDER BY f.fetched_on DESC, f.created_at DESC, f.id DESC LIMIT 1), 2.00)
$$;

-- set_manual_fx_rate: la tasa que escribe la duena; una por dia de Ciudad de Mexico.
CREATE FUNCTION public.set_manual_fx_rate(
    p_rate       numeric,
    p_buffer_pct numeric DEFAULT NULL,
    p_staff_ref  text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_id integer;
BEGIN
    IF p_rate IS NULL OR p_rate = 'NaN'::numeric OR p_rate <= 0 OR p_rate > 1000 THEN
        RAISE EXCEPTION 'invalid_rate: the rate must be between 0 and 1000';
    END IF;
    IF p_buffer_pct IS NOT NULL AND (p_buffer_pct = 'NaN'::numeric OR p_buffer_pct < 0 OR p_buffer_pct >= 100) THEN
        RAISE EXCEPTION 'invalid_rate: the buffer must be between 0 and 100';
    END IF;
    IF char_length(p_staff_ref) > 100 THEN
        RAISE EXCEPTION 'invalid_staff_ref: at most 100 characters';
    END IF;

    INSERT INTO public.fx_rates (rate, buffer_pct, source, fetched_on, staff_ref)
    VALUES (p_rate, coalesce(p_buffer_pct, public._latest_fx_buffer()), 'manual',
            (now() AT TIME ZONE 'America/Mexico_City')::date, p_staff_ref)
    ON CONFLICT (fetched_on, source) DO UPDATE
       SET rate = EXCLUDED.rate,
           buffer_pct = coalesce(p_buffer_pct, public.fx_rates.buffer_pct),
           staff_ref = EXCLUDED.staff_ref,
           created_at = now()
    RETURNING id INTO v_id;
    RETURN v_id;
END
$$;

-- record_fx_rate: la tasa que trae un proceso (Banxico o la de respaldo) para un dia dado.
CREATE FUNCTION public.record_fx_rate(
    p_rate       numeric,
    p_source     text,
    p_fetched_on date
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_id integer;
BEGIN
    IF p_rate IS NULL OR p_rate = 'NaN'::numeric OR p_rate <= 0 OR p_rate > 1000 THEN
        RAISE EXCEPTION 'invalid_rate: the rate must be between 0 and 1000';
    END IF;
    IF p_source IS NULL OR p_source NOT IN ('banxico', 'manual', 'fallback') THEN
        RAISE EXCEPTION 'invalid_rate: unknown source %', coalesce(p_source, 'NULL');
    END IF;
    IF p_fetched_on IS NULL OR p_fetched_on > (now() AT TIME ZONE 'America/Mexico_City')::date THEN
        RAISE EXCEPTION 'invalid_rate: the date must be today or earlier';
    END IF;

    INSERT INTO public.fx_rates (rate, buffer_pct, source, fetched_on)
    VALUES (p_rate, public._latest_fx_buffer(), p_source, p_fetched_on)
    ON CONFLICT (fetched_on, source) DO UPDATE
       SET rate = EXCLUDED.rate, created_at = now()
    RETURNING id INTO v_id;
    RETURN v_id;
END
$$;

-- ---------------------------------------------------------------------------------------------
-- panel_kpis: los numeros del inicio del panel, forma D4. Dias de Ciudad de Mexico; los pedidos
-- cancelados no cuentan; la ventana de 30 dias es hoy-29..hoy. Dinero y kilos como texto.
CREATE FUNCTION public.panel_kpis() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
WITH hoy AS (
    SELECT (now() AT TIME ZONE 'America/Mexico_City')::date AS d
), vivos AS (
    SELECT o.id, o.total, o.status, (o.created_at AT TIME ZONE 'America/Mexico_City')::date AS dia
    FROM public.orders o
    WHERE o.status <> 'cancelled'
), mes AS (
    SELECT v.* FROM vivos v, hoy WHERE v.dia BETWEEN hoy.d - 29 AND hoy.d
), margen AS (
    SELECT sum(i.subtotal) AS ventas, sum(c.total_cost_frozen) AS costo
    FROM mes m
    JOIN public.order_items i ON i.order_id = m.id
    JOIN public.order_item_costs c ON c.order_item_id = i.id
    WHERE m.status IN ('confirmed', 'preparing', 'ready', 'delivered')
)
SELECT jsonb_build_object(
    'ventas_hoy', (SELECT jsonb_build_object(
                       'total', coalesce(sum(v.total), 0)::numeric(12,2)::text,
                       'pedidos', count(*))
                   FROM vivos v, hoy WHERE v.dia = hoy.d),
    'pendientes', (SELECT count(*) FROM public.orders o WHERE o.status IN ('pending', 'confirmed')),
    'ticket_promedio_30d', (SELECT coalesce(avg(m.total), 0)::numeric(12,2)::text FROM mes m),
    'margen_30d', (SELECT CASE WHEN g.ventas IS NULL OR g.ventas = 0 THEN NULL
                          ELSE jsonb_build_object(
                              'monto', (g.ventas - g.costo)::numeric(12,2)::text,
                              'pct', round((g.ventas - g.costo) / g.ventas * 100, 1)::text)
                          END
                   FROM margen g),
    'top5', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                         'producto', t.name,
                         'ingreso', t.ingreso::numeric(12,2)::text,
                         'kg', t.kg::numeric(10,3)::text) ORDER BY t.ingreso DESC, t.name), '[]'::jsonb)
             FROM (SELECT p.name, sum(i.subtotal) AS ingreso, sum(i.quantity_kg) AS kg
                   FROM mes m
                   JOIN public.order_items i ON i.order_id = m.id
                   JOIN public.products p ON p.id = i.product_id
                   GROUP BY p.id, p.name
                   ORDER BY ingreso DESC, p.name
                   LIMIT 5) t),
    'serie_7d', (SELECT jsonb_agg(jsonb_build_object(
                            'dia', to_char(s.dia, 'YYYY-MM-DD'),
                            'total', coalesce((SELECT sum(v.total) FROM vivos v WHERE v.dia = s.dia), 0)::numeric(12,2)::text)
                        ORDER BY s.dia)
                 FROM hoy, generate_series(hoy.d - 6, hoy.d, interval '1 day') AS g(ts),
                      LATERAL (SELECT g.ts::date AS dia) s)
)
$$;

-- ---------------------------------------------------------------------------------------------
-- panel_orders: un pedido como lo muestra el panel, con sus lineas ya agregadas.
-- El nombre y el telefono son los que escribio el mostrador o, si no hay, los del perfil.
CREATE VIEW public.panel_orders AS
SELECT o.id AS order_id,
       o.status,
       o.channel,
       coalesce(o.customer_name, pr.full_name) AS customer_name,
       coalesce(o.customer_phone, pr.phone) AS customer_phone,
       o.delivery_type,
       o.delivery_address,
       o.notes,
       o.payment_method,
       o.currency,
       o.total AS total_mxn,
       o.total_usd,
       o.fx_rate_used,
       o.staff_ref,
       o.created_at,
       o.updated_at,
       coalesce((SELECT jsonb_agg(jsonb_build_object(
                        'product_id', i.product_id,
                        'product_name', p.name,
                        'sale_mode', i.sale_mode,
                        'quantity_kg', i.quantity_kg::numeric(10,3)::text,
                        'pieces', i.pieces,
                        'unit_price', i.unit_price::numeric(10,2)::text,
                        'discount', i.discount::numeric(10,2)::text,
                        'subtotal', i.subtotal::numeric(10,2)::text,
                        'note', i.note) ORDER BY i.id)
                 FROM public.order_items i
                 JOIN public.products p ON p.id = i.product_id
                 WHERE i.order_id = o.id), '[]'::jsonb) AS lines
FROM public.orders o
LEFT JOIN public.profiles pr ON pr.id = o.user_id;

-- panel_purchase_performance: cada lote contra lo vendido de su producto desde que se compro
-- (pedidos confirmados en adelante; sin FIFO).
CREATE VIEW public.panel_purchase_performance AS
SELECT l.id AS lot_id,
       l.product_id,
       p.name AS product_name,
       l.created_at,
       l.qty,
       l.total_cost,
       l.unit_cost,
       l.expected_revenue,
       (l.expected_revenue - l.total_cost)::numeric(12,2) AS expected_margin,
       CASE WHEN l.expected_revenue = 0 THEN NULL
            ELSE round((l.expected_revenue - l.total_cost) / l.expected_revenue * 100, 1)
       END AS expected_margin_pct,
       coalesce(s.qty, 0)::numeric(10,3) AS sold_qty,
       coalesce(s.revenue, 0)::numeric(12,2) AS sold_revenue
FROM public.purchase_lots l
JOIN public.products p ON p.id = l.product_id
LEFT JOIN LATERAL (
    SELECT sum(CASE WHEN p.stock_unit = 'piece' THEN i.pieces::numeric ELSE i.quantity_kg END) AS qty,
           sum(i.subtotal) AS revenue
    FROM public.order_items i
    JOIN public.orders o ON o.id = i.order_id
    WHERE i.product_id = l.product_id
      AND o.status IN ('confirmed', 'preparing', 'ready', 'delivered')
      AND o.created_at >= l.created_at
) s ON true;

-- ---------------------------------------------------------------------------------------------
-- Permisos: solo django ejecuta y lee.
REVOKE EXECUTE ON FUNCTION public.register_purchase(integer, numeric, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(integer, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._latest_fx_buffer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_manual_fx_rate(numeric, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_fx_rate(numeric, text, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.panel_kpis() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_purchase(integer, numeric, numeric, text, text) TO django;
GRANT EXECUTE ON FUNCTION public.adjust_stock(integer, numeric, text, text) TO django;
GRANT EXECUTE ON FUNCTION public.set_manual_fx_rate(numeric, numeric, text) TO django;
GRANT EXECUTE ON FUNCTION public.record_fx_rate(numeric, text, date) TO django;
GRANT EXECUTE ON FUNCTION public.panel_kpis() TO django;

REVOKE ALL ON public.panel_orders FROM PUBLIC, anon, authenticated, django;
REVOKE ALL ON public.panel_purchase_performance FROM PUBLIC, anon, authenticated, django;
GRANT SELECT ON public.panel_orders TO django;
GRANT SELECT ON public.panel_purchase_performance TO django;

-- DOWN
-- DROP VIEW public.panel_purchase_performance;
-- DROP VIEW public.panel_orders;
-- DROP FUNCTION public.panel_kpis();
-- DROP FUNCTION public.record_fx_rate(numeric, text, date);
-- DROP FUNCTION public.set_manual_fx_rate(numeric, numeric, text);
-- DROP FUNCTION public._latest_fx_buffer();
-- DROP FUNCTION public.adjust_stock(integer, numeric, text, text);
-- DROP FUNCTION public.register_purchase(integer, numeric, numeric, text, text);
