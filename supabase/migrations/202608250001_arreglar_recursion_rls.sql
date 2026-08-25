-- Migration: 202608250001_arreglar_recursion_rls.sql
-- Descripcion: Elimina la recursion infinita en las politicas RLS de profiles.
-- Creado: 2026-08-25
--
-- EL PROBLEMA
-- -----------
-- Leer el catalogo desde el navegador devolvia:
--     42P17  infinite recursion detected in policy for relation "profiles"
--
-- La cadena era esta. La politica products_admin_only se declaro FOR ALL, y
-- FOR ALL incluye SELECT. Asi que cualquier lectura de products evaluaba su
-- clausula USING, que dice:
--
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--
-- Eso obliga a leer profiles. Y profiles tiene profiles_admin_read_all, que
-- para decidir si puedes leer profiles... vuelve a leer profiles. Postgres
-- detecta el ciclo y aborta con 42P17.
--
-- Nunca se habia visto porque el navegador jamas habia hablado con la base:
-- VITE_SUPABASE_URL apuntaba a host.docker.internal. Y en el SQL Editor no
-- aparece porque ahi las consultas corren como postgres, que tiene BYPASSRLS.
--
-- EL ARREGLO, EN DOS PARTES
-- -------------------------
-- 1. is_admin() pasa a ser SECURITY DEFINER. Corre con los permisos de quien
--    la creo, no de quien la llama, y por lo tanto lee profiles sin pasar por
--    RLS. Se acabo el ciclo. SET search_path = '' es obligatorio aqui: sin el,
--    alguien podria crear un esquema propio con una tabla profiles falsa y
--    hacer que la funcion privilegiada la lea.
--
-- 2. Las politicas de administrador dejan de ser FOR ALL y se declaran solo
--    sobre INSERT, UPDATE y DELETE. Una lectura publica del catalogo no tiene
--    por que mirar profiles. Ademas de quitar la recursion, ahorra una consulta
--    por cada producto leido.
--
-- Lo que NO cambia: quien puede hacer que. Las reglas son las mismas, escritas
-- de forma que no se muerdan la cola.

-- ============================================
-- 1 · Las funciones dejan de pasar por RLS
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
    );
$$;

COMMENT ON FUNCTION public.is_admin() IS
    'Dice si quien llama es administrador. SECURITY DEFINER a proposito: lee '
    'profiles sin pasar por RLS, que es lo que rompe la recursion. Solo '
    'devuelve un booleano sobre el propio llamante, no expone datos de nadie.';

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role::TEXT
    FROM public.profiles
    WHERE id = (SELECT auth.uid());
$$;

-- ============================================
-- 2 · PROFILES — el origen del ciclo
-- ============================================

DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles
    FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all" ON public.profiles
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================
-- 3 · CATEGORIES — leer nunca toca profiles
-- ============================================

DROP POLICY IF EXISTS "categories_admin_only" ON public.categories;

CREATE POLICY "categories_admin_insert" ON public.categories
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_update" ON public.categories
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_delete" ON public.categories
    FOR DELETE USING (public.is_admin());

-- ============================================
-- 4 · PRODUCTS — la que rompia el catalogo
-- ============================================

DROP POLICY IF EXISTS "products_admin_only" ON public.products;

CREATE POLICY "products_admin_insert" ON public.products
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_update" ON public.products
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_delete" ON public.products
    FOR DELETE USING (public.is_admin());

-- ============================================
-- 5 · ORDERS y ORDER_ITEMS
-- ============================================

DROP POLICY IF EXISTS "orders_admin_read_all" ON public.orders;
CREATE POLICY "orders_admin_read_all" ON public.orders
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_update_status" ON public.orders;
CREATE POLICY "orders_admin_update_status" ON public.orders
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_read_all" ON public.order_items;
CREATE POLICY "order_items_admin_read_all" ON public.order_items
    FOR SELECT USING (public.is_admin());

-- ============================================
-- 6 · PROMOTIONS
-- ============================================

DROP POLICY IF EXISTS "promotions_admin_only" ON public.promotions;

CREATE POLICY "promotions_admin_insert" ON public.promotions
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "promotions_admin_update" ON public.promotions
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "promotions_admin_delete" ON public.promotions
    FOR DELETE USING (public.is_admin());

-- ============================================
-- 7 · STORE_SETTINGS — los minimos de compra
-- ============================================

DROP POLICY IF EXISTS "store_settings_admin_only" ON public.store_settings;

CREATE POLICY "store_settings_admin_insert" ON public.store_settings
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "store_settings_admin_update" ON public.store_settings
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "store_settings_admin_delete" ON public.store_settings
    FOR DELETE USING (public.is_admin());

-- ============================================
-- 8 · Comprobacion
-- ============================================

DO $$
DECLARE
    v_restantes INTEGER;
    v_definer   BOOLEAN;
BEGIN
    -- Ninguna politica debe seguir consultando profiles a mano.
    SELECT COUNT(*) INTO v_restantes
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%FROM profiles%' OR qual LIKE '%FROM public.profiles%'
        OR with_check LIKE '%FROM profiles%' OR with_check LIKE '%FROM public.profiles%');

    IF v_restantes > 0 THEN
        RAISE EXCEPTION 'Quedan % politicas leyendo profiles en linea. La recursion sigue viva.', v_restantes;
    END IF;

    SELECT prosecdef INTO v_definer
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin';

    IF NOT v_definer THEN
        RAISE EXCEPTION 'is_admin() no quedo como SECURITY DEFINER';
    END IF;

    RAISE NOTICE 'Listo: recursion eliminada, is_admin() es SECURITY DEFINER';
END $$;
