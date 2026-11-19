-- =============================================================================================
-- Cerrar la escritura directa de pedidos (auditoria de seguridad 2026-11-18, hallazgos 1 y 2).
--
-- Las politicas de 202604100002 dejaban a un cliente con sesion insertar y modificar sus pedidos
-- y las lineas de esos pedidos directamente en las tablas, con el total que quisiera, y las
-- funciones viejas create_order_with_items y cancel_order seguian ejecutables por authenticated.
-- Hoy un pedido nace solo en las funciones de la tienda, que cotizan en el servidor:
--   create_order_v2 (cliente con sesion), create_order_staff (mostrador), create_order_web (tienda
--   publica, via Django). Ninguna depende de estas politicas ni de estos privilegios: son
--   SECURITY DEFINER.
-- La lectura queda igual: cada cliente sigue viendo solo sus pedidos (orders_select_own).
-- =============================================================================================

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_order" ON public.order_items;

-- Todo menos la lectura: el default de Supabase da ALL (tambien TRUNCATE, REFERENCES y TRIGGER).
REVOKE ALL ON TABLE public.orders, public.order_items FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.orders, public.order_items TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_order_with_items(text, jsonb, text, jsonb)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid)
    FROM PUBLIC, anon, authenticated;

-- =============================================================================================
-- Reversa. Cada linea empieza con "-- ": correr.sh le quita ese prefijo y la ejecuta.
-- Devuelve exactamente lo que daban 202604100002, 202604100003 y los privilegios por defecto de
-- Supabase (EXECUTE para PUBLIC, anon y authenticated), en el mismo orden de la ACL.
-- DOWN
-- REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid) FROM service_role;
-- GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO PUBLIC, anon, authenticated, service_role;
-- REVOKE EXECUTE ON FUNCTION public.create_order_with_items(text, jsonb, text, jsonb) FROM service_role;
-- GRANT EXECUTE ON FUNCTION public.create_order_with_items(text, jsonb, text, jsonb) TO PUBLIC, anon, authenticated, service_role;
-- REVOKE ALL ON TABLE public.orders, public.order_items FROM anon, authenticated, service_role;
-- REVOKE ALL ON TABLE public.order_items FROM django;
-- GRANT ALL ON TABLE public.orders, public.order_items TO anon;
-- GRANT ALL ON TABLE public.orders, public.order_items TO authenticated;
-- GRANT ALL ON TABLE public.orders, public.order_items TO service_role;
-- GRANT SELECT ON TABLE public.order_items TO django;
-- CREATE POLICY "order_items_insert_order" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
-- CREATE POLICY "orders_update_own" ON public.orders FOR UPDATE USING (user_id = auth.uid() AND status = 'pending') WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
