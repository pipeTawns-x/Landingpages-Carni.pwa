-- create_order_web: el pedido de un cliente sin sesion de la tienda publica.
--
-- Hasta hoy la tienda de Django guardaba sus pedidos con el canal `whatsapp` porque:
--   * create_order_v2 (canal web) usa auth.uid() y solo lo tiene el rol `authenticated`;
--   * create_order_staff es lo unico que el rol `django` puede correr y solo acepta
--     `mostrador` y `whatsapp`;
--   * la tabla amarra el canal `web` a un user_id (CHECK orders_web_requires_user).
--
-- Esta migracion agrega create_order_web, SECURITY DEFINER con search_path vacio, con EXECUTE solo
-- para `django`. Guarda un pedido invitado: canal 'web', sin user_id, nombre y telefono
-- obligatorios. Usa el mismo cuerpo (_create_order) que las otras dos: misma cotizacion
-- (quote_cart), mismas validaciones, totales calculados en el servidor y el mismo manejo de la
-- tasa de cambio. Regla anti abuso: el mismo telefono no puede tener 3 o mas pedidos pending; el
-- telefono se compara solo por sus digitos, para que "444 123 4567" y "4441234567" sean el mismo.
--
-- Codigos nuevos: ninguno. Se usan los existentes: invalid_customer_name,
-- invalid_customer_phone, invalid_payment_method, too_many_pending (mas los de _create_order).
--
-- El CHECK orders_web_requires_user se relaja: el canal web sigue pudiendo llevar user_id (los
-- pedidos de create_order_v2 no cambian) y ahora tambien vale sin user_id cuando hay telefono.
-- Los pedidos que ya existen cumplen el CHECK nuevo (todos los web tienen user_id).
--
-- La reversa va al final, en el bloque comentado.

-- ---------------------------------------------------------------------------------------------
-- El CHECK: web con usuario, o web sin usuario pero con telefono.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE public.orders DROP CONSTRAINT orders_web_requires_user;
ALTER TABLE public.orders
    ADD CONSTRAINT orders_web_requires_user CHECK (
        channel <> 'web'
        OR user_id IS NOT NULL
        OR nullif(btrim(customer_phone), '') IS NOT NULL);

-- ---------------------------------------------------------------------------------------------
-- create_order_web: pedido invitado de la tienda publica (rol django). Sin usuario.
-- El bloqueo advisory por telefono serializa los pedidos simultaneos del mismo numero, igual que
-- el FOR UPDATE del perfil serializa los de un cliente en create_order_v2.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public.create_order_web(
    p_items            jsonb,
    p_customer_name    text,
    p_customer_phone   text,
    p_delivery_type    text  DEFAULT 'pickup',
    p_delivery_address jsonb DEFAULT '{}'::jsonb,
    p_notes            text  DEFAULT NULL,
    p_currency         text  DEFAULT 'MXN',
    p_payment_method   text  DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_name    text := nullif(btrim(p_customer_name), '');
    v_phone   text := nullif(btrim(p_customer_phone), '');
    v_pay     text := nullif(btrim(p_payment_method), '');
    v_digits  text;
    v_pending integer;
BEGIN
    IF v_name IS NULL OR char_length(v_name) > 120 THEN
        RAISE EXCEPTION 'invalid_customer_name: the name is required and has at most 120 characters';
    END IF;
    IF v_phone IS NULL OR char_length(v_phone) > 20 THEN
        RAISE EXCEPTION 'invalid_customer_phone: the phone is required and has at most 20 characters';
    END IF;
    v_digits := regexp_replace(v_phone, '\D', '', 'g');
    IF char_length(v_digits) < 7 THEN
        RAISE EXCEPTION 'invalid_customer_phone: the phone needs at least 7 digits';
    END IF;
    IF v_pay IS NOT NULL AND v_pay NOT IN ('efectivo', 'transferencia', 'tarjeta') THEN
        RAISE EXCEPTION 'invalid_payment_method: %', v_pay;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('create_order_web:' || v_digits, 0));
    SELECT count(*) INTO v_pending
    FROM public.orders o
    WHERE o.status = 'pending'
      AND regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g') = v_digits;
    IF v_pending >= 3 THEN
        RAISE EXCEPTION 'too_many_pending: at most 3 pending orders for the same phone, it has %', v_pending;
    END IF;

    RETURN public._create_order(NULL, 'web', v_name, v_phone, NULL, v_pay, 'web:invitado',
                                p_items, p_delivery_type, p_delivery_address, p_notes, p_currency);
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- EXECUTE por firma: solo django. El default de Supabase da EXECUTE a PUBLIC, anon y authenticated.
-- ---------------------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.create_order_web(jsonb, text, text, text, jsonb, text, text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_web(jsonb, text, text, text, jsonb, text, text, text)
    TO django;

-- =============================================================================================
-- Reversa. Cada linea empieza con "-- ": correr.sh le quita ese prefijo y la ejecuta.
-- Los pedidos invitados que ya existan no caben en el CHECK anterior: pasan al canal whatsapp, que
-- es donde la tienda los guardaba antes de esta migracion. No se borra ninguno.
-- DOWN
-- DROP FUNCTION public.create_order_web(jsonb, text, text, text, jsonb, text, text, text);
-- UPDATE public.orders SET channel = 'whatsapp' WHERE channel = 'web' AND user_id IS NULL;
-- ALTER TABLE public.orders DROP CONSTRAINT orders_web_requires_user;
-- ALTER TABLE public.orders ADD CONSTRAINT orders_web_requires_user CHECK (channel <> 'web' OR user_id IS NOT NULL);
