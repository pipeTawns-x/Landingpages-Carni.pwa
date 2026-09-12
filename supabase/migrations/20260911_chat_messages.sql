-- Migration: 20260911_chat_messages.sql
-- Descripcion: Tabla de mensajes del asistente virtual (chatbot M44) con RLS.
-- Creado: 2026-09-11
--
-- El widget flotante (js/modules/chatbot.js) inscribe cada mensaje de la
-- conversacion (usuario y asistente) con la llave anon, sin pedir auth:
-- cualquier visitante puede INSERTAR filas propias, nadie puede LEER.
-- La lectura queda restringida a administradores via is_admin(), la misma
-- convencion que ya usa el repo (202608250001), para las metricas del
-- dashboard que lleguen despues.
--
-- No se declaran GRANTs a mano: Supabase otorga por defecto los privilegios
-- de tabla a anon/authenticated/service_role en el esquema public. El control
-- real de acceso lo ponen las politicas RLS, igual que en el resto del repo.

-- ============================================
-- 1 · Tabla
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    role       text NOT NULL CHECK (role IN ('user', 'bot')),
    message    text NOT NULL,
    page_url   text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_messages IS
    'Mensajes del asistente virtual (widget flotante, practica M44).';

COMMENT ON COLUMN public.chat_messages.session_id IS
    'Sesion del navegador (localStorage carni_chat_session); agrupa la conversacion de un visitante.';

COMMENT ON COLUMN public.chat_messages.page_url IS
    'Pagina desde la que se envio el mensaje (location.pathname).';

-- ============================================
-- 2 · Indices para metricas del dashboard
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id   ON public.chat_messages (session_id);

-- ============================================
-- 3 · RLS
-- ============================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede registrar mensajes: el widget inserta con la
-- llave anon y no debe pedir auth. El INSERT no le da derecho a leer nada.
CREATE POLICY "chat_messages_insert_anon" ON public.chat_messages
    FOR INSERT
    WITH CHECK (true);

-- Sin SELECT publico: la lectura es solo para el dashboard de metricas, y
-- ahi el acceso es de administrador (misma convencion is_admin() del repo,
-- SECURITY DEFINER, sin recursion).
CREATE POLICY "chat_messages_select_admin" ON public.chat_messages
    FOR SELECT
    USING (public.is_admin());

-- ============================================
-- 4 · Comprobacion
-- ============================================
DO $$
DECLARE
    v_rls BOOLEAN;
    v_policies INTEGER;
BEGIN
    SELECT relrowsecurity INTO v_rls
    FROM pg_class
    WHERE oid = 'public.chat_messages'::regclass;

    IF NOT v_rls THEN
        RAISE EXCEPTION 'chat_messages quedo sin RLS habilitado';
    END IF;

    SELECT COUNT(*) INTO v_policies
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_messages';

    IF v_policies < 2 THEN
        RAISE EXCEPTION 'chat_messages esperaba al menos 2 politicas, tiene %', v_policies;
    END IF;

    RAISE NOTICE 'Listo: chat_messages creada con RLS y % politicas', v_policies;
END $$;