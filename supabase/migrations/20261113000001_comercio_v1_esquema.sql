-- comercio-v1 A1: esquema del comercio (ventas por dinero, peso o pieza; stock; costos;
-- promociones; tipo de cambio; pedidos de mostrador y de WhatsApp).
--
-- Construye sobre las 9 migraciones anteriores y no edita ninguna. Todo lo nuevo nace con RLS
-- y sin privilegios para anon: el default de Supabase da ALL a anon y authenticated, asi que
-- cada tabla hace REVOKE ALL y vuelve a dar solo lo que el contrato pide.
--
-- Quien escribe que:
--   * costos y precios congelados, lotes, movimientos de stock, bitacoras y tasas de cambio:
--     solo las RPC SECURITY DEFINER (A2/A3) y los triggers de aqui; las lee el administrador
--     (authenticated + is_admin()) y el rol django.
--   * product_cut_specs: un solo escritor, Django (D7). product_promotions: administrador y Django.
--
-- La reversa va al final, en el bloque comentado, y se prueba (aplicar, revertir, aplicar) con
-- supabase/tests/correr.sh. La reversa de stock redondea a entero y la de order_items vuelve a
-- exigir quantity_kg > 0: se niega a correr si ya hay lineas por pieza o usuarios sin cuenta.

-- ---------------------------------------------------------------------------------------------
-- 1. product_cut_specs: peso por pieza y grosor de cada producto (D7). Va antes que el relleno
--    de products porque sale_modes depende de que haya peso por pieza.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE public.product_cut_specs (
    product_id           integer      PRIMARY KEY REFERENCES public.products (id) ON DELETE CASCADE,
    avg_piece_weight_kg  numeric(6,3),
    thickness_min_in     numeric(4,2),
    thickness_max_in     numeric(4,2),
    thickness_default_in numeric(4,2),
    CONSTRAINT product_cut_specs_avg_positive CHECK (
        avg_piece_weight_kg IS NULL OR avg_piece_weight_kg > 0),
    CONSTRAINT product_cut_specs_thickness_positive CHECK (
        (thickness_min_in     IS NULL OR thickness_min_in     > 0)
        AND (thickness_max_in     IS NULL OR thickness_max_in     > 0)
        AND (thickness_default_in IS NULL OR thickness_default_in > 0)),
    CONSTRAINT product_cut_specs_thickness_range CHECK (
        (thickness_min_in IS NULL OR thickness_max_in IS NULL OR thickness_min_in <= thickness_max_in)
        AND (thickness_default_in IS NULL OR thickness_min_in IS NULL OR thickness_default_in >= thickness_min_in)
        AND (thickness_default_in IS NULL OR thickness_max_in IS NULL OR thickness_default_in <= thickness_max_in))
);

COMMENT ON TABLE public.product_cut_specs IS
    'Peso por pieza y grosor de un corte. Lectura publica; la mantiene Django al guardar CutSpec.';

-- Relleno desde la tabla de Django, si existe. Un peso de 0 significa "sin peso" (NULL) y el
-- tope de numeric(6,3) es 999.999. Un spec huerfano (producto borrado) se salta.
DO $$
BEGIN
    IF to_regclass('django.inventory_cutspec') IS NOT NULL THEN
        INSERT INTO public.product_cut_specs
            (product_id, avg_piece_weight_kg, thickness_min_in, thickness_max_in, thickness_default_in)
        SELECT c.product_id::integer,
               CASE WHEN c.avg_piece_weight_kg > 0 THEN least(c.avg_piece_weight_kg, 999.999) END,
               nullif(c.thickness_min_in, 0),
               nullif(c.thickness_max_in, 0),
               nullif(c.thickness_default_in, 0)
        FROM django.inventory_cutspec c
        WHERE EXISTS (SELECT 1 FROM public.products p WHERE p.id = c.product_id)
        ON CONFLICT (product_id) DO NOTHING;
    END IF;
END $$;

ALTER TABLE public.product_cut_specs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_cut_specs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.product_cut_specs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_cut_specs TO django;
CREATE POLICY product_cut_specs_select_public ON public.product_cut_specs
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY product_cut_specs_django_all ON public.product_cut_specs
    FOR ALL TO django USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------------------------
-- 2. products: stock con decimales, unidad de stock, seguimiento, unidad del precio y modos de
--    venta (D2, D7).
-- ---------------------------------------------------------------------------------------------
ALTER TABLE public.products
    ALTER COLUMN stock TYPE numeric(10,3) USING stock::numeric(10,3);
ALTER TABLE public.products
    ADD COLUMN stock_unit  text    NOT NULL DEFAULT 'kg',
    ADD COLUMN track_stock boolean NOT NULL DEFAULT false,
    ADD COLUMN price_unit  text    NOT NULL DEFAULT 'kg',
    ADD COLUMN sale_modes  text[]  NOT NULL DEFAULT '{money,weight}';

COMMENT ON COLUMN public.products.price_unit IS
    'De que es el precio guardado en price_per_kg: kg, piece o package.';
COMMENT ON COLUMN public.products.track_stock IS
    'Solo los productos con seguimiento se validan y descuentan al confirmar el pedido.';

-- Un stock negativo no puede existir con el CHECK de abajo: se deja en cero, no se frena el despliegue.
UPDATE public.products SET stock = 0 WHERE stock < 0;

-- Regla de backend/inventory/models.py (unit_label_for): "Paquete ..." es paquete salvo que diga
-- "por kilo"; merch y otros se venden por pieza; lo demas por kilo.
UPDATE public.products p
SET price_unit = CASE
        WHEN starts_with(p.name, 'Paquete ') AND position('por kilo' IN lower(p.name)) = 0 THEN 'package'
        WHEN c.slug IN ('merch', 'otros') THEN 'piece'
        ELSE 'kg'
    END
FROM public.categories c
WHERE c.id = p.category_id;

-- Lo que se vende por pieza o paquete se cuenta en piezas y solo admite pieces. Lo que se vende
-- por kilo admite dinero y peso, mas piezas si hay peso por pieza.
UPDATE public.products p
SET stock_unit = CASE WHEN p.price_unit <> 'kg' THEN 'piece' ELSE 'kg' END,
    sale_modes = CASE
        WHEN p.price_unit <> 'kg' THEN ARRAY['pieces']
        WHEN EXISTS (SELECT 1 FROM public.product_cut_specs s
                     WHERE s.product_id = p.id AND s.avg_piece_weight_kg > 0)
            THEN ARRAY['money', 'weight', 'pieces']
        ELSE ARRAY['money', 'weight']
    END;

ALTER TABLE public.products
    ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0),
    ADD CONSTRAINT products_stock_unit_check CHECK (stock_unit IN ('kg', 'piece')),
    ADD CONSTRAINT products_price_unit_check CHECK (price_unit IN ('kg', 'piece', 'package')),
    ADD CONSTRAINT products_sale_modes_check CHECK (
        cardinality(sale_modes) >= 1
        AND sale_modes <@ ARRAY['money', 'weight', 'pieces']),
    ADD CONSTRAINT products_piece_price_needs_pieces CHECK (
        price_unit = 'kg' OR sale_modes = ARRAY['pieces']),
    ADD CONSTRAINT products_piece_stock_needs_pieces CHECK (
        stock_unit <> 'piece' OR sale_modes = ARRAY['pieces']);

-- ---------------------------------------------------------------------------------------------
-- 3. product_costs: costo privado del producto, nunca dentro de products.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE public.product_costs (
    product_id     integer       PRIMARY KEY REFERENCES public.products (id) ON DELETE CASCADE,
    cost_per_kg    numeric(12,4) CHECK (cost_per_kg IS NULL OR cost_per_kg >= 0),
    cost_per_piece numeric(12,4) CHECK (cost_per_piece IS NULL OR cost_per_piece >= 0),
    yield_pct      numeric(5,2)  NOT NULL DEFAULT 100 CHECK (yield_pct > 0 AND yield_pct <= 100),
    updated_at     timestamptz   NOT NULL DEFAULT now(),
    updated_by     text          CHECK (char_length(updated_by) <= 100)
);

CREATE TRIGGER update_product_costs_updated_at
    BEFORE UPDATE ON public.product_costs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_costs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_costs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.product_costs TO django;
CREATE POLICY product_costs_admin_all ON public.product_costs
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY product_costs_django_all ON public.product_costs
    FOR ALL TO django USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------------------------
-- 4. orders y order_items: pedidos de mostrador y WhatsApp, moneda, piezas y descuento (D6).
-- ---------------------------------------------------------------------------------------------
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders
    ADD COLUMN channel        text          NOT NULL DEFAULT 'web',
    ADD COLUMN customer_name  text,
    ADD COLUMN customer_phone text,
    ADD COLUMN staff_ref      text,
    ADD COLUMN payment_method text,
    ADD COLUMN currency       text          NOT NULL DEFAULT 'MXN',
    ADD COLUMN fx_rate_used   numeric(12,4),
    ADD COLUMN total_usd      numeric(12,2);

ALTER TABLE public.orders
    ADD CONSTRAINT orders_channel_check CHECK (channel IN ('web', 'mostrador', 'whatsapp')),
    ADD CONSTRAINT orders_payment_method_check CHECK (
        payment_method IS NULL OR payment_method IN ('efectivo', 'transferencia', 'tarjeta')),
    ADD CONSTRAINT orders_currency_check CHECK (currency IN ('MXN', 'USD')),
    ADD CONSTRAINT orders_web_requires_user CHECK (channel <> 'web' OR user_id IS NOT NULL),
    ADD CONSTRAINT orders_staff_requires_name CHECK (
        channel = 'web' OR nullif(btrim(customer_name), '') IS NOT NULL),
    ADD CONSTRAINT orders_usd_requires_rate CHECK (
        currency <> 'USD'
        OR (fx_rate_used IS NOT NULL AND fx_rate_used > 0 AND total_usd IS NOT NULL)),
    ADD CONSTRAINT orders_fx_rate_positive CHECK (fx_rate_used IS NULL OR fx_rate_used > 0),
    ADD CONSTRAINT orders_total_usd_non_negative CHECK (total_usd IS NULL OR total_usd >= 0),
    ADD CONSTRAINT orders_customer_name_length CHECK (char_length(customer_name) <= 120),
    ADD CONSTRAINT orders_customer_phone_length CHECK (char_length(customer_phone) <= 20),
    ADD CONSTRAINT orders_staff_ref_length CHECK (char_length(staff_ref) <= 100);

-- El panel de Django lee los pedidos (hoy django no tiene ningun GRANT sobre orders).
GRANT SELECT ON TABLE public.orders TO django;
CREATE POLICY orders_django_role_select ON public.orders
    FOR SELECT TO django USING (true);

ALTER TABLE public.order_items
    ADD COLUMN sale_mode text,
    ADD COLUMN pieces    integer,
    ADD COLUMN discount  numeric(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN note      text;

-- Una linea por pieza de un producto con precio por pieza guarda quantity_kg = 0.
ALTER TABLE public.order_items DROP CONSTRAINT order_items_qty_positiva;
ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_qty_no_negativa CHECK (quantity_kg >= 0),
    ADD CONSTRAINT order_items_qty_o_piezas CHECK (quantity_kg > 0 OR coalesce(pieces, 0) > 0),
    ADD CONSTRAINT order_items_sale_mode_check CHECK (
        sale_mode IS NULL OR sale_mode IN ('money', 'weight', 'pieces')),
    ADD CONSTRAINT order_items_pieces_positive CHECK (pieces IS NULL OR pieces > 0),
    ADD CONSTRAINT order_items_discount_non_negative CHECK (discount >= 0),
    ADD CONSTRAINT order_items_note_length CHECK (char_length(note) <= 200);

-- La FK a products es RESTRICT: borrar un producto revisa esta columna.
CREATE INDEX idx_order_items_product ON public.order_items (product_id);

-- ---------------------------------------------------------------------------------------------
-- 5. Compras, movimientos de stock, costos congelados y bitacora de estados.
--    Solo las RPC SECURITY DEFINER escriben aqui; nadie recibe INSERT/UPDATE/DELETE.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE public.purchase_lots (
    id               bigserial     PRIMARY KEY,
    product_id       integer       NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
    qty              numeric(10,3) NOT NULL CHECK (qty > 0),
    total_cost       numeric(12,2) NOT NULL CHECK (total_cost >= 0),
    unit_cost        numeric(12,4) NOT NULL CHECK (unit_cost >= 0),
    expected_revenue numeric(12,2) NOT NULL CHECK (expected_revenue >= 0),
    note             text          CHECK (char_length(note) <= 500),
    staff_ref        text          CHECK (char_length(staff_ref) <= 100),
    created_at       timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchase_lots_product ON public.purchase_lots (product_id, created_at);

CREATE TABLE public.stock_movements (
    id         bigserial     PRIMARY KEY,
    product_id integer       NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
    delta      numeric(10,3) NOT NULL CHECK (delta <> 0),
    reason     text          NOT NULL CHECK (reason IN ('purchase', 'sale', 'cancel', 'adjustment')),
    order_id   uuid          REFERENCES public.orders (id) ON DELETE SET NULL,
    lot_id     bigint        REFERENCES public.purchase_lots (id) ON DELETE SET NULL,
    staff_ref  text          CHECK (char_length(staff_ref) <= 100),
    note       text          CHECK (char_length(note) <= 500),
    created_at timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_product ON public.stock_movements (product_id, created_at);
CREATE INDEX idx_stock_movements_order   ON public.stock_movements (order_id) WHERE order_id IS NOT NULL;

CREATE TABLE public.order_item_costs (
    order_item_id         integer       PRIMARY KEY REFERENCES public.order_items (id) ON DELETE CASCADE,
    cost_per_kg_frozen    numeric(12,4) CHECK (cost_per_kg_frozen IS NULL OR cost_per_kg_frozen >= 0),
    cost_per_piece_frozen numeric(12,4) CHECK (cost_per_piece_frozen IS NULL OR cost_per_piece_frozen >= 0),
    yield_pct_frozen      numeric(5,2)  CHECK (yield_pct_frozen IS NULL OR (yield_pct_frozen > 0 AND yield_pct_frozen <= 100)),
    total_cost_frozen     numeric(12,2) NOT NULL CHECK (total_cost_frozen >= 0)
);

CREATE TABLE public.order_status_log (
    id          bigserial   PRIMARY KEY,
    order_id    uuid        NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
    from_status text        CHECK (from_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    to_status   text        NOT NULL CHECK (to_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    actor       text        CHECK (char_length(actor) <= 100),
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_status_log_order ON public.order_status_log (order_id, created_at);

-- ---------------------------------------------------------------------------------------------
-- 6. price_history: cada cambio de precio de un producto, escrito por un trigger.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE public.price_history (
    id              serial        PRIMARY KEY,
    product_id      integer       NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
    price_per_kg    numeric(10,2),
    price_per_piece numeric(10,2),
    origin          text          NOT NULL DEFAULT 'owner' CHECK (origin IN ('owner', 'market_reference')),
    changed_by      uuid,
    changed_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT price_history_one_price CHECK ((price_per_kg IS NULL) <> (price_per_piece IS NULL))
);
CREATE INDEX idx_price_history_product ON public.price_history (product_id, changed_at DESC);

-- products.price_per_kg guarda el precio de la unidad que diga price_unit: si no es kg, el
-- historico lo anota como precio por pieza.
CREATE FUNCTION public.log_price_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NEW.price_unit = 'kg' THEN
        INSERT INTO public.price_history (product_id, price_per_kg, origin, changed_by)
        VALUES (NEW.id, NEW.price_per_kg, 'owner', auth.uid());
    ELSE
        INSERT INTO public.price_history (product_id, price_per_piece, origin, changed_by)
        VALUES (NEW.id, NEW.price_per_kg, 'owner', auth.uid());
    END IF;
    RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_price_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER products_log_price_change
    AFTER UPDATE OF price_per_kg ON public.products
    FOR EACH ROW
    WHEN (OLD.price_per_kg IS DISTINCT FROM NEW.price_per_kg)
    EXECUTE FUNCTION public.log_price_change();

-- ---------------------------------------------------------------------------------------------
-- 7. product_promotions: percent, amount_off o fixed_price, sin traslapes por producto.
--    El rango int4range(id, id, '[]') evita depender de btree_gist.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE public.product_promotions (
    id         serial        PRIMARY KEY,
    product_id integer       NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
    kind       text          NOT NULL CHECK (kind IN ('percent', 'amount_off', 'fixed_price')),
    value      numeric(12,2) NOT NULL CHECK (value > 0),
    starts_at  timestamptz   NOT NULL,
    ends_at    timestamptz   NOT NULL,
    is_active  boolean       NOT NULL DEFAULT true,
    CONSTRAINT product_promotions_percent_below_100 CHECK (kind <> 'percent' OR value < 100),
    CONSTRAINT product_promotions_window CHECK (ends_at > starts_at),
    CONSTRAINT product_promotions_no_overlap EXCLUDE USING gist (
        int4range(product_id, product_id, '[]') WITH &&,
        tstzrange(starts_at, ends_at) WITH &&
    ) WHERE (is_active)
);
CREATE INDEX idx_product_promotions_product ON public.product_promotions (product_id) WHERE is_active;

-- ---------------------------------------------------------------------------------------------
-- 8. fx_rates y la vista publica current_fx (D8).
-- ---------------------------------------------------------------------------------------------
CREATE TABLE public.fx_rates (
    id         serial        PRIMARY KEY,
    rate       numeric(12,4) NOT NULL CHECK (rate > 0),
    buffer_pct numeric(5,2)  NOT NULL DEFAULT 2.00 CHECK (buffer_pct >= 0 AND buffer_pct < 100),
    source     text          NOT NULL CHECK (source IN ('banxico', 'manual', 'fallback')),
    fetched_on date          NOT NULL,
    created_at timestamptz   NOT NULL DEFAULT now(),
    staff_ref  text          CHECK (char_length(staff_ref) <= 100),
    CONSTRAINT fx_rates_fetched_on_source_key UNIQUE (fetched_on, source)
);

-- La tasa vigente: la de fecha mas reciente; en un empate gana la manual, luego la mas nueva.
-- Una tasa de mas de 4 dias (fecha de Ciudad de Mexico) es 'stale' y apaga el cobro en dolares.
-- Sin ninguna fila devuelve una sola fila 'missing'. house_rate es la tasa de la casa.
-- La vista pertenece a postgres y lee fx_rates con sus permisos: anon no toca la tabla.
CREATE VIEW public.current_fx AS
SELECT r.rate,
       r.buffer_pct,
       round(r.rate * (1 - r.buffer_pct / 100), 4) AS house_rate,
       r.fetched_on,
       r.source,
       CASE WHEN (now() AT TIME ZONE 'America/Mexico_City')::date - r.fetched_on <= 4
            THEN 'ok' ELSE 'stale' END AS status
FROM (SELECT f.rate, f.buffer_pct, f.fetched_on, f.source
      FROM public.fx_rates f
      ORDER BY f.fetched_on DESC, (f.source = 'manual') DESC, f.created_at DESC, f.id DESC
      LIMIT 1) r
UNION ALL
SELECT NULL::numeric(12,4), NULL::numeric(5,2), NULL::numeric, NULL::date, NULL::text, 'missing'
WHERE NOT EXISTS (SELECT 1 FROM public.fx_rates);

-- ---------------------------------------------------------------------------------------------
-- 9. RLS y privilegios de las tablas nuevas. REVOKE ALL primero: el default de Supabase da ALL
--    a anon y authenticated sobre toda tabla y secuencia nueva.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE public.order_item_costs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_lots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates           ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.order_item_costs, public.purchase_lots, public.stock_movements,
                    public.order_status_log, public.price_history, public.product_promotions,
                    public.fx_rates, public.current_fx
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.purchase_lots_id_seq, public.stock_movements_id_seq,
                       public.order_status_log_id_seq, public.price_history_id_seq,
                       public.product_promotions_id_seq, public.fx_rates_id_seq
    FROM PUBLIC, anon, authenticated;

-- Datos privados: el administrador autenticado y django leen; nadie escribe directo.
GRANT SELECT ON TABLE public.order_item_costs, public.purchase_lots, public.stock_movements,
                      public.order_status_log, public.price_history
    TO authenticated, django;
CREATE POLICY order_item_costs_admin_select ON public.order_item_costs
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY order_item_costs_django_select ON public.order_item_costs
    FOR SELECT TO django USING (true);
CREATE POLICY purchase_lots_admin_select ON public.purchase_lots
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY purchase_lots_django_select ON public.purchase_lots
    FOR SELECT TO django USING (true);
CREATE POLICY stock_movements_admin_select ON public.stock_movements
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY stock_movements_django_select ON public.stock_movements
    FOR SELECT TO django USING (true);
CREATE POLICY order_status_log_admin_select ON public.order_status_log
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY order_status_log_django_select ON public.order_status_log
    FOR SELECT TO django USING (true);
CREATE POLICY price_history_admin_select ON public.price_history
    FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY price_history_django_select ON public.price_history
    FOR SELECT TO django USING (true);

-- Promociones: el publico lee las vigentes; el administrador y django las gestionan.
GRANT SELECT ON TABLE public.product_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_promotions TO authenticated, django;
GRANT USAGE, SELECT ON SEQUENCE public.product_promotions_id_seq TO authenticated, django;
CREATE POLICY product_promotions_select_active ON public.product_promotions
    FOR SELECT TO anon, authenticated
    USING (is_active AND starts_at <= now() AND now() < ends_at);
CREATE POLICY product_promotions_admin_all ON public.product_promotions
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY product_promotions_django_all ON public.product_promotions
    FOR ALL TO django USING (true) WITH CHECK (true);

-- Tasas: la tabla solo la lee django; escribe la RPC. La vista es publica.
GRANT SELECT ON TABLE public.fx_rates TO django;
CREATE POLICY fx_rates_django_select ON public.fx_rates
    FOR SELECT TO django USING (true);
GRANT SELECT ON TABLE public.current_fx TO anon, authenticated, django;

-- =============================================================================================
-- Reversa de A1. Cada linea empieza con "-- ": correr.sh le quita ese prefijo y la ejecuta.
-- DOWN
-- DROP VIEW public.current_fx;
-- DROP TRIGGER products_log_price_change ON public.products;
-- DROP FUNCTION public.log_price_change();
-- DROP TABLE public.fx_rates, public.product_promotions, public.price_history,
--            public.order_status_log, public.order_item_costs, public.stock_movements,
--            public.purchase_lots;
-- DROP INDEX public.idx_order_items_product;
-- ALTER TABLE public.order_items
--     DROP CONSTRAINT order_items_qty_no_negativa,
--     DROP CONSTRAINT order_items_qty_o_piezas,
--     DROP CONSTRAINT order_items_sale_mode_check,
--     DROP CONSTRAINT order_items_pieces_positive,
--     DROP CONSTRAINT order_items_discount_non_negative,
--     DROP CONSTRAINT order_items_note_length;
-- ALTER TABLE public.order_items
--     DROP COLUMN sale_mode, DROP COLUMN pieces, DROP COLUMN discount, DROP COLUMN note;
-- ALTER TABLE public.order_items ADD CONSTRAINT order_items_qty_positiva CHECK (quantity_kg > 0);
-- DROP POLICY orders_django_role_select ON public.orders;
-- REVOKE SELECT ON TABLE public.orders FROM django;
-- ALTER TABLE public.orders
--     DROP CONSTRAINT orders_channel_check,
--     DROP CONSTRAINT orders_payment_method_check,
--     DROP CONSTRAINT orders_currency_check,
--     DROP CONSTRAINT orders_web_requires_user,
--     DROP CONSTRAINT orders_staff_requires_name,
--     DROP CONSTRAINT orders_usd_requires_rate,
--     DROP CONSTRAINT orders_fx_rate_positive,
--     DROP CONSTRAINT orders_total_usd_non_negative,
--     DROP CONSTRAINT orders_customer_name_length,
--     DROP CONSTRAINT orders_customer_phone_length,
--     DROP CONSTRAINT orders_staff_ref_length;
-- ALTER TABLE public.orders
--     DROP COLUMN channel, DROP COLUMN customer_name, DROP COLUMN customer_phone,
--     DROP COLUMN staff_ref, DROP COLUMN payment_method, DROP COLUMN currency,
--     DROP COLUMN fx_rate_used, DROP COLUMN total_usd;
-- ALTER TABLE public.orders ALTER COLUMN user_id SET NOT NULL;
-- DROP TABLE public.product_costs;
-- ALTER TABLE public.products
--     DROP CONSTRAINT products_stock_non_negative,
--     DROP CONSTRAINT products_stock_unit_check,
--     DROP CONSTRAINT products_price_unit_check,
--     DROP CONSTRAINT products_sale_modes_check,
--     DROP CONSTRAINT products_piece_price_needs_pieces,
--     DROP CONSTRAINT products_piece_stock_needs_pieces;
-- ALTER TABLE public.products
--     DROP COLUMN stock_unit, DROP COLUMN track_stock, DROP COLUMN price_unit, DROP COLUMN sale_modes;
-- ALTER TABLE public.products ALTER COLUMN stock TYPE integer USING round(stock)::integer;
-- DROP TABLE public.product_cut_specs;
