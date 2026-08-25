-- ============================================================================
-- QUÉ RESUELVE
--   1. El total del pedido se calculaba con el precio que enviaba el navegador.
--      Un cliente podía pedir un corte de $399 y pagarlo a $1 cambiando un
--      valor desde la consola. A partir de aquí el precio sale de products.
--   2. No existía mínimo de compra. Se podía pedir 3 gramos de bistec, que
--      físicamente no se puede cortar, ni un pedido de $30 a domicilio, que
--      cuesta más en repartidor de lo que deja.
--
-- EVIDENCIA DEL DEFECTO 1
--   202604100003_functions.sql:265
--     v_line_total := (v_item->>'quantity_kg')::DECIMAL(10,3)
--                   * (v_item->>'unit_price')::DECIMAL(10,2);
--   La función completa (líneas 244-291) no menciona products ni una sola vez.
--   order_items (202604100001_initial_schema.sql:74-75) no tiene CHECK > 0.
--
-- QUÉ SE ROMPE AL APLICAR
--   Nada del lado del cliente. p_items sigue siendo JSONB y js/modules/core/
--   cart.js:434 puede seguir enviando unit_price: la función deja de leerlo.
--   La firma de la función no cambia.
--
--   ATENCIÓN: js/modules/supabase.js:205 envía el parámetro `p_address`, pero
--   la función siempre se ha llamado `p_delivery_address`. Esa llamada RPC
--   falla hoy, antes y después de esta migración. Se arregla del lado del
--   cliente, no aquí.
--
-- LOS DOS MÍNIMOS
--   Por producto → products.min_quantity_kg   (el límite es el cuchillo)
--   Por pedido   → store_settings             (el límite es el repartidor)
--   Los dos son editables desde el dashboard. Ningún número vive en el código.
-- ============================================================================


-- ============================================================================
-- 1. Mínimo por producto
--
--    Va por peso y no por pesos, porque el límite real es físico: no se puede
--    cortar menos de cierto gramaje. El mínimo en dinero sale solo y siempre
--    es el correcto para ese producto — un cuarto de kilo de arrachera son
--    $72 y de pollo son $22.
-- ============================================================================

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS min_quantity_kg DECIMAL(10,3) NOT NULL DEFAULT 0;

ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_min_quantity_no_negativa;

ALTER TABLE public.products
    ADD CONSTRAINT products_min_quantity_no_negativa CHECK (min_quantity_kg >= 0);

COMMENT ON COLUMN public.products.min_quantity_kg IS
    'Cantidad mínima vendible. 0 = sin mínimo. Editable desde el dashboard.';

-- Arranque razonable: un cuarto de kilo en lo que se vende al peso.
-- Merch y otros quedan en 0 porque se venden por pieza, no por kilo.
UPDATE public.products p
SET min_quantity_kg = 0.250
FROM public.categories c
WHERE p.category_id = c.id
  AND c.slug IN ('carnes-rojas', 'cerdo', 'pollo', 'cortes-especiales',
                 'embutidos', 'preparadas', 'ofertas')
  AND p.min_quantity_kg = 0;


-- ============================================================================
-- 2. Mínimo por pedido — configurable por el dueño
--
--    Tabla de una sola fila. El CHECK (id = 1) impide que se creen varias
--    configuraciones y nadie sepa cuál manda.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
    id                 INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    min_order_pickup   DECIMAL(10,2) NOT NULL DEFAULT 0
                       CHECK (min_order_pickup   >= 0),
    min_order_delivery DECIMAL(10,2) NOT NULL DEFAULT 150
                       CHECK (min_order_delivery >= 0),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by         UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.store_settings IS
    'Parámetros de negocio editables desde el dashboard. Una sola fila.';
COMMENT ON COLUMN public.store_settings.min_order_pickup IS
    'Mínimo para recoger en tienda. 0 = sin mínimo.';
COMMENT ON COLUMN public.store_settings.min_order_delivery IS
    'Mínimo para entrega a domicilio. Cubre el costo del repartidor.';

INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- El catálogo necesita leer el mínimo para mostrar "te faltan $X".
DROP POLICY IF EXISTS "store_settings_select_public" ON public.store_settings;
CREATE POLICY "store_settings_select_public" ON public.store_settings
    FOR SELECT USING (true);

-- Escribir es solo del dueño.
DROP POLICY IF EXISTS "store_settings_admin_only" ON public.store_settings;
CREATE POLICY "store_settings_admin_only" ON public.store_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin')
    );

-- Deja rastro de quién cambió el mínimo y cuándo.
CREATE OR REPLACE FUNCTION public.marcar_store_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := now();
    NEW.updated_by := auth.uid();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_settings_audit ON public.store_settings;
CREATE TRIGGER store_settings_audit
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE FUNCTION public.marcar_store_settings();


-- ============================================================================
-- 3. El precio sale de la base, y se respetan los dos mínimos
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_delivery_type TEXT,
    p_delivery_address JSONB,
    p_notes TEXT,
    p_items JSONB   -- [{product_id, quantity_kg}] · unit_price se ignora si viene
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order_id   UUID;
    v_item       JSONB;
    v_product    public.products%ROWTYPE;
    v_qty        DECIMAL(10,3);
    v_line_total DECIMAL(10,2);
    v_subtotal   DECIMAL(10,2) := 0;
    v_minimo     DECIMAL(10,2);
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Se requiere sesion iniciada para crear un pedido';
    END IF;

    IF p_delivery_type NOT IN ('pickup', 'delivery') THEN
        RAISE EXCEPTION 'Tipo de entrega invalido: %', p_delivery_type;
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El pedido no tiene articulos';
    END IF;

    -- El pedido se crea en cero y se actualiza al final, para que el total
    -- guardado sea siempre la suma de las lineas realmente insertadas.
    -- Si algo falla mas abajo, RAISE EXCEPTION revierte todo, incluido esto.
    INSERT INTO public.orders (user_id, total, delivery_type, delivery_address, notes)
    VALUES (auth.uid(), 0, p_delivery_type, p_delivery_address, p_notes)
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- FOR UPDATE bloquea la fila hasta que termine la transaccion, para que
        -- dos pedidos simultaneos no vendan el mismo ultimo kilo.
        SELECT * INTO v_product
        FROM public.products
        WHERE id = (v_item->>'product_id')::INTEGER
          AND is_active = true
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto % no existe o no esta disponible',
                v_item->>'product_id';
        END IF;

        v_qty := (v_item->>'quantity_kg')::DECIMAL(10,3);

        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'Cantidad invalida para %: %', v_product.name, v_qty;
        END IF;

        -- Minimo por producto: el limite del cuchillo.
        IF v_qty < v_product.min_quantity_kg THEN
            RAISE EXCEPTION 'La cantidad minima de % es % kg, se pidieron % kg',
                v_product.name, v_product.min_quantity_kg, v_qty;
        END IF;

        IF v_product.stock < v_qty THEN
            RAISE EXCEPTION 'Sin existencias suficientes de %: hay %, se piden %',
                v_product.name, v_product.stock, v_qty;
        END IF;

        -- Aqui esta el arreglo del precio: viene de v_product, no de v_item.
        -- Lo que el navegador haya mandado en unit_price no se lee.
        v_line_total := ROUND(v_qty * v_product.price_per_kg, 2);
        v_subtotal   := v_subtotal + v_line_total;

        INSERT INTO public.order_items
            (order_id, product_id, quantity_kg, unit_price, subtotal)
        VALUES
            (v_order_id, v_product.id, v_qty, v_product.price_per_kg, v_line_total);
    END LOOP;

    -- Minimo por pedido: el limite del repartidor. Sale de la tabla de
    -- configuracion, asi que el dueno lo cambia sin tocar codigo.
    SELECT CASE WHEN p_delivery_type = 'delivery'
                THEN min_order_delivery
                ELSE min_order_pickup END
    INTO v_minimo
    FROM public.store_settings
    WHERE id = 1;

    IF v_minimo IS NOT NULL AND v_subtotal < v_minimo THEN
        RAISE EXCEPTION 'El pedido minimo para % es $%, tu pedido suma $%',
            p_delivery_type, v_minimo, v_subtotal;
    END IF;

    UPDATE public.orders SET total = v_subtotal WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$;


-- ============================================================================
-- 4. Candados en la tabla, por si algo se cuela por otra via
-- ============================================================================

ALTER TABLE public.order_items
    DROP CONSTRAINT IF EXISTS order_items_qty_positiva,
    DROP CONSTRAINT IF EXISTS order_items_precio_positivo,
    DROP CONSTRAINT IF EXISTS order_items_subtotal_positivo;

ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_qty_positiva      CHECK (quantity_kg > 0),
    ADD CONSTRAINT order_items_precio_positivo   CHECK (unit_price  > 0),
    ADD CONSTRAINT order_items_subtotal_positivo CHECK (subtotal    > 0);


-- ============================================================================
-- 5. search_path en las funciones SECURITY DEFINER que no lo tenian
--
--    La doc de Supabase es explicita: "If you ever use security definer, you
--    must set the search_path". Sin el, un atacante puede crear una tabla
--    propia con el mismo nombre en un esquema que controle y hacer que la
--    funcion escriba ahi con los privilegios de su dueno, saltandose RLS.
--
--    handle_new_user y protect_profile_system_fields ya lo tenian.
-- ============================================================================

ALTER FUNCTION public.get_user_favorites()           SET search_path = '';
ALTER FUNCTION public.add_to_favorites(INTEGER)      SET search_path = '';
ALTER FUNCTION public.remove_from_favorites(INTEGER) SET search_path = '';
ALTER FUNCTION public.cancel_order(UUID)             SET search_path = '';
