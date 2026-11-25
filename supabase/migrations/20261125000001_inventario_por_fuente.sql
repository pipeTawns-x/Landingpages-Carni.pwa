-- =============================================================================================
-- 20261125000001_inventario_por_fuente.sql  (T7b and T7c of odd/tasks/rediseno-moderno.md)
--
-- WRITTEN FOR REVIEW. NOT APPLIED. Eduardo applies it; no agent runs it against a database.
--
-- What it fixes (S14.1-3, L25): the stock lives per sellable product only, so a pierna de puerco of
-- 10 kg must be split into bistec, molida and milanesa the day it arrives. Evidence:
--   - set_order_status takes each line from its own product (20261119000003_lote_al_confirmar.sql:209-224);
--   - stock_movements has no shrink nor count reason (20261119000002_despiece.sql:15-18);
--   - purchase_lots has no supplier (20261113000001_comercio_v1_esquema.sql:211-222).
--
-- What it adds:
--   1. products.source_product_id: the source a sellable product takes its kilos from (one level).
--   2. purchase_lots.supplier, product_cut_specs.piece_tolerance_kg.
--   3. stock_movements: reasons 'shrink' and 'count', shrink_kind, via_product_id.
--   4. inventory_settings (thresholds 2 % / 5 %, yield_informative off: assumption A3) and stock_counts.
--   5. set_order_status: own stock first, then the source, EXACTLY the grams sold; a piece sold from a
--      source takes pieces x avg_piece_weight_kg. Locks every product it touches by ascending id.
--   6. register_source_entry, cut_source, record_shrink, record_stock_count.
--   7. Panel reads: panel_source_stock, panel_stock_counts, panel_source_reconciliation(date).
--
-- What breaks when applied: nothing existing changes shape. Products without a source behave as
-- before (same checks, same movements). set_order_status gains the source path; its signature,
-- errors and return value are unchanged.
--
-- Lock level: the ALTER TABLEs take ACCESS EXCLUSIVE on products, purchase_lots, stock_movements and
-- product_cut_specs for the length of a catalog change (nullable columns, no rewrite); the CHECK on
-- stock_movements scans the table once. Run it outside opening hours.
--
-- Contract: docs/contratos/inventario-por-fuente.md. Test: supabase/tests/inventario_por_fuente.sql.
-- =============================================================================================

-- 1. Source of a product -----------------------------------------------------------------------
ALTER TABLE public.products
    ADD COLUMN source_product_id integer REFERENCES public.products (id) ON DELETE RESTRICT,
    ADD CONSTRAINT products_source_not_self CHECK (source_product_id IS NULL OR source_product_id <> id);
CREATE INDEX idx_products_source ON public.products (source_product_id) WHERE source_product_id IS NOT NULL;

-- A source is one level deep: the source has no source, and a product that is a source gets none.
CREATE FUNCTION public._check_source_link() RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
    IF NEW.source_product_id IS NULL THEN
        RETURN NEW;
    END IF;
    IF EXISTS (SELECT 1 FROM public.products s
               WHERE s.id = NEW.source_product_id AND s.source_product_id IS NOT NULL)
       OR EXISTS (SELECT 1 FROM public.products c WHERE c.source_product_id = NEW.id) THEN
        RAISE EXCEPTION 'source_cycle: a source is a product without a source';
    END IF;
    IF EXISTS (SELECT 1 FROM public.products s
               WHERE s.id = NEW.source_product_id AND s.stock_unit <> 'kg') THEN
        RAISE EXCEPTION 'source_cycle: a source holds its stock in kg';
    END IF;
    RETURN NEW;
END
$$;
CREATE TRIGGER products_check_source_link
    BEFORE INSERT OR UPDATE OF source_product_id ON public.products
    FOR EACH ROW EXECUTE FUNCTION public._check_source_link();

-- 2. Supplier and piece tolerance --------------------------------------------------------------
ALTER TABLE public.purchase_lots
    ADD COLUMN supplier text CHECK (char_length(supplier) <= 120);
ALTER TABLE public.product_cut_specs
    ADD COLUMN piece_tolerance_kg numeric(6,3) CHECK (piece_tolerance_kg IS NULL OR piece_tolerance_kg >= 0);

-- 3. Movements: shrink and count ----------------------------------------------------------------
ALTER TABLE public.stock_movements
    ADD COLUMN via_product_id integer REFERENCES public.products (id) ON DELETE RESTRICT,
    ADD COLUMN shrink_kind text CHECK (shrink_kind IN ('trim', 'drying', 'expiry')),
    DROP CONSTRAINT stock_movements_reason_check,
    ADD CONSTRAINT stock_movements_reason_check
        CHECK (reason IN ('purchase', 'sale', 'cancel', 'adjustment', 'cut', 'shrink', 'count')),
    ADD CONSTRAINT stock_movements_shrink_kind_check
        CHECK ((reason = 'shrink') = (shrink_kind IS NOT NULL)),
    ADD CONSTRAINT stock_movements_shrink_note_check
        CHECK (reason <> 'shrink' OR (note IS NOT NULL AND btrim(note) <> '' AND staff_ref IS NOT NULL));
CREATE INDEX idx_stock_movements_via ON public.stock_movements (via_product_id, created_at)
    WHERE via_product_id IS NOT NULL;

-- 4. Settings and counts -----------------------------------------------------------------------
CREATE TABLE public.inventory_settings (
    id                boolean      PRIMARY KEY DEFAULT true CHECK (id),
    alert_pct         numeric(5,2) NOT NULL DEFAULT 2 CHECK (alert_pct >= 0),
    note_required_pct numeric(5,2) NOT NULL DEFAULT 5 CHECK (note_required_pct >= alert_pct),
    yield_informative boolean      NOT NULL DEFAULT false,
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    updated_by        text         CHECK (char_length(updated_by) <= 100)
);
INSERT INTO public.inventory_settings (id) VALUES (true);

CREATE TABLE public.stock_counts (
    id           bigserial     PRIMARY KEY,
    product_id   integer       NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
    system_qty   numeric(10,3) NOT NULL CHECK (system_qty >= 0),
    counted_qty  numeric(10,3) NOT NULL CHECK (counted_qty >= 0),
    variance_qty numeric(10,3) GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
    variance_pct numeric(7,2)  GENERATED ALWAYS AS (
                     CASE WHEN system_qty > 0
                          THEN round((counted_qty - system_qty) * 100 / system_qty, 2) END) STORED,
    note         text          CHECK (char_length(note) <= 500),
    staff_ref    text          NOT NULL CHECK (char_length(staff_ref) BETWEEN 1 AND 100),
    counted_at   timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_counts_product ON public.stock_counts (product_id, counted_at);

ALTER TABLE public.inventory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_counts       ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.inventory_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.stock_counts       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.stock_counts_id_seq FROM PUBLIC, anon, authenticated;
-- Django reads both and edits the thresholds; counts are written only by record_stock_count.
GRANT SELECT, UPDATE ON TABLE public.inventory_settings TO django;
GRANT SELECT ON TABLE public.stock_counts TO django;
CREATE POLICY inventory_settings_django ON public.inventory_settings
    FOR ALL TO django USING (true) WITH CHECK (true);
CREATE POLICY stock_counts_django_select ON public.stock_counts
    FOR SELECT TO django USING (true);

-- 5. set_order_status: own stock first, then the source ----------------------------------------
CREATE OR REPLACE FUNCTION public.set_order_status(
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
    v_own     numeric;
    v_rest    numeric;
    v_rest_kg numeric;
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
        -- Lock the products of the order and their sources together, always by ascending id.
        PERFORM 1
        FROM public.products p
        WHERE p.id IN (SELECT oi.product_id FROM public.order_items oi WHERE oi.order_id = p_order_id)
           OR p.id IN (SELECT x.source_product_id FROM public.products x
                       JOIN public.order_items oi ON oi.product_id = x.id
                       WHERE oi.order_id = p_order_id AND x.source_product_id IS NOT NULL)
        ORDER BY p.id
        FOR UPDATE;

        FOR v_row IN
            SELECT oi.product_id AS pid, p.name AS pname, p.stock AS stock, p.track_stock,
                   p.stock_unit, p.source_product_id AS src, cs.avg_piece_weight_kg AS piece_kg,
                   sum(CASE WHEN p.stock_unit = 'piece' THEN coalesce(oi.pieces, 0)::numeric
                            ELSE oi.quantity_kg END) AS need
            FROM public.order_items oi
            JOIN public.products p ON p.id = oi.product_id
            LEFT JOIN public.product_cut_specs cs ON cs.product_id = p.id
            WHERE oi.order_id = p_order_id AND (p.track_stock OR p.source_product_id IS NOT NULL)
            GROUP BY oi.product_id, p.name, p.stock, p.track_stock, p.stock_unit,
                     p.source_product_id, cs.avg_piece_weight_kg
            ORDER BY oi.product_id
        LOOP
            CONTINUE WHEN v_row.need <= 0;
            v_own := CASE WHEN v_row.track_stock THEN least(greatest(v_row.stock, 0), v_row.need) ELSE 0 END;
            v_rest := v_row.need - v_own;
            IF v_rest > 0 AND v_row.src IS NULL THEN
                RAISE EXCEPTION 'insufficient_stock: % needs %, only % in stock',
                    v_row.pname, v_row.need, v_row.stock;
            END IF;
            IF v_own > 0 THEN
                UPDATE public.products SET stock = stock - v_own WHERE id = v_row.pid;
                INSERT INTO public.stock_movements (product_id, delta, reason, order_id, staff_ref)
                VALUES (v_row.pid, -v_own, 'sale', p_order_id, left(p_actor, 100));
            END IF;
            IF v_rest > 0 THEN
                IF v_row.stock_unit = 'piece' AND v_row.piece_kg IS NULL THEN
                    RAISE EXCEPTION 'insufficient_stock: % has no standard piece weight', v_row.pname;
                END IF;
                -- Exactly the grams sold (L25): no yield factor enters the deduction.
                v_rest_kg := round(CASE WHEN v_row.stock_unit = 'piece'
                                        THEN v_rest * v_row.piece_kg ELSE v_rest END, 3);
                UPDATE public.products SET stock = stock - v_rest_kg
                 WHERE id = v_row.src AND stock >= v_rest_kg;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'insufficient_stock: % needs % kg from its source', v_row.pname, v_rest_kg;
                END IF;
                INSERT INTO public.stock_movements
                    (product_id, delta, reason, order_id, staff_ref, via_product_id)
                VALUES (v_row.src, -v_rest_kg, 'sale', p_order_id, left(p_actor, 100), v_row.pid);
            END IF;
        END LOOP;

        PERFORM public._take_order_lots(p_order_id);

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

        -- What a sale took from a source goes back to that source, still tagged with the product.
        FOR v_row IN
            SELECT m.product_id AS pid, m.via_product_id AS via, -sum(m.delta) AS qty
            FROM public.stock_movements m
            WHERE m.order_id = p_order_id AND m.reason IN ('sale', 'cancel')
            GROUP BY m.product_id, m.via_product_id
            HAVING sum(m.delta) < 0
            ORDER BY m.product_id, m.via_product_id
        LOOP
            UPDATE public.products SET stock = stock + v_row.qty WHERE id = v_row.pid;
            INSERT INTO public.stock_movements (product_id, delta, reason, order_id, staff_ref, via_product_id)
            VALUES (v_row.pid, v_row.qty, 'cancel', p_order_id, left(p_actor, 100), v_row.via);
        END LOOP;

        PERFORM public._return_order_lots(p_order_id);
    END IF;

    UPDATE public.orders SET status = p_new_status WHERE id = p_order_id;
    INSERT INTO public.order_status_log (order_id, from_status, to_status, actor)
    VALUES (p_order_id, v_from, p_new_status, left(p_actor, 100));

    RETURN p_new_status;
END;
$$;

-- 6. Entry, explicit cut, shrink and count -------------------------------------------------------
-- S14.1: the piece enters the source with its cost and supplier; the date is created_at.
CREATE FUNCTION public.register_source_entry(
    p_product_id integer,
    p_qty        numeric,
    p_total_cost numeric,
    p_supplier   text,
    p_note       text DEFAULT NULL,
    p_staff_ref  text DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_lot bigint;
BEGIN
    IF char_length(p_supplier) > 120 THEN
        RAISE EXCEPTION 'invalid_supplier: at most 120 characters';
    END IF;
    v_lot := public.register_purchase(p_product_id, p_qty, p_total_cost, p_note, p_staff_ref);
    UPDATE public.purchase_lots SET supplier = nullif(btrim(p_supplier), '') WHERE id = v_lot;
    RETURN v_lot;
END
$$;

-- S14.2: the optional explicit cut of a kg source; cut_lot does the same for piece lots.
CREATE FUNCTION public.cut_source(
    p_source_id integer,
    p_outputs   jsonb,          -- [{"product_id": 7, "kg": "3.000"}, ...]
    p_note      text DEFAULT NULL,
    p_staff_ref text DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_src   record;
    v_item  jsonb;
    v_pid   integer;
    v_kg    numeric;
    v_total numeric := 0;
BEGIN
    IF char_length(p_note) > 500 OR char_length(p_staff_ref) > 100 THEN
        RAISE EXCEPTION 'note_too_long: note at most 500, staff_ref at most 100 characters';
    END IF;
    IF p_outputs IS NULL OR jsonb_typeof(p_outputs) <> 'array' OR jsonb_array_length(p_outputs) = 0 THEN
        RAISE EXCEPTION 'invalid_amount: at least one output';
    END IF;
    -- Lock the source and every output by ascending id before reading any stock.
    PERFORM 1 FROM public.products p
    WHERE p.id = p_source_id
       OR p.id IN (SELECT (e->>'product_id')::integer FROM jsonb_array_elements(p_outputs) e)
    ORDER BY p.id
    FOR UPDATE;

    SELECT p.id, p.stock, p.stock_unit INTO v_src FROM public.products p WHERE p.id = p_source_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_source_id::text, 'NULL');
    END IF;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_outputs) LOOP
        v_pid := (v_item->>'product_id')::integer;
        v_kg := round((v_item->>'kg')::numeric, 3);
        IF v_kg IS NULL OR v_kg <= 0 THEN
            RAISE EXCEPTION 'invalid_amount: every output takes more than zero';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.products p
                       WHERE p.id = v_pid AND p.source_product_id = p_source_id AND p.stock_unit = 'kg') THEN
            RAISE EXCEPTION 'source_cycle: product % is not a kg product of source %', v_pid, p_source_id;
        END IF;
        v_total := v_total + v_kg;
    END LOOP;
    IF v_total > v_src.stock THEN
        RAISE EXCEPTION 'insufficient_stock: cuts % kg of %', v_total, v_src.stock;
    END IF;

    UPDATE public.products SET stock = stock - v_total WHERE id = p_source_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_outputs) LOOP
        v_pid := (v_item->>'product_id')::integer;
        v_kg := round((v_item->>'kg')::numeric, 3);
        UPDATE public.products SET stock = stock + v_kg, track_stock = true WHERE id = v_pid;
        INSERT INTO public.stock_movements (product_id, delta, reason, staff_ref, note, via_product_id)
        VALUES (p_source_id, -v_kg, 'cut', p_staff_ref, p_note, v_pid),
               (v_pid, v_kg, 'cut', p_staff_ref, p_note, NULL);
    END LOOP;
    RETURN v_src.stock - v_total;
END
$$;

-- S14.3: shrink with its kind, note and actor; the stock never goes below zero.
CREATE FUNCTION public.record_shrink(
    p_product_id integer,
    p_kg         numeric,
    p_kind       text,
    p_note       text,
    p_staff_ref  text
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_stock numeric;
    v_kg    numeric := round(p_kg, 3);
BEGIN
    IF p_kind IS NULL OR p_kind NOT IN ('trim', 'drying', 'expiry') THEN
        RAISE EXCEPTION 'invalid_shrink_kind: trim, drying or expiry';
    END IF;
    IF p_note IS NULL OR btrim(p_note) = '' OR char_length(p_note) > 500
       OR p_staff_ref IS NULL OR btrim(p_staff_ref) = '' OR char_length(p_staff_ref) > 100 THEN
        RAISE EXCEPTION 'note_required: a shrink carries a note and who recorded it';
    END IF;
    IF v_kg IS NULL OR v_kg <= 0 THEN
        RAISE EXCEPTION 'invalid_amount: a shrink is more than zero';
    END IF;
    SELECT p.stock INTO v_stock FROM public.products p WHERE p.id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
    END IF;
    IF v_kg > v_stock THEN
        RAISE EXCEPTION 'insufficient_stock: the stock never goes below zero';
    END IF;
    UPDATE public.products SET stock = stock - v_kg WHERE id = p_product_id;
    INSERT INTO public.stock_movements (product_id, delta, reason, shrink_kind, note, staff_ref)
    VALUES (p_product_id, -v_kg, 'shrink', p_kind, btrim(p_note), btrim(p_staff_ref));
    RETURN v_stock - v_kg;
END
$$;

-- S14.3: weekly count against the system, with the configured thresholds.
CREATE FUNCTION public.record_stock_count(
    p_product_id integer,
    p_counted    numeric,
    p_note       text,
    p_staff_ref  text
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_stock   numeric;
    v_counted numeric := round(p_counted, 3);
    v_set     record;
    v_pct     numeric;
    v_id      bigint;
BEGIN
    IF v_counted IS NULL OR v_counted < 0 OR v_counted > 1000000 THEN
        RAISE EXCEPTION 'invalid_amount: a count is zero or more';
    END IF;
    IF p_staff_ref IS NULL OR btrim(p_staff_ref) = '' OR char_length(p_staff_ref) > 100
       OR char_length(p_note) > 500 THEN
        RAISE EXCEPTION 'invalid_staff_ref: who counted, at most 100 characters';
    END IF;
    SELECT p.stock INTO v_stock FROM public.products p WHERE p.id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
    END IF;
    SELECT s.alert_pct, s.note_required_pct INTO v_set FROM public.inventory_settings s;
    v_pct := CASE WHEN v_stock > 0 THEN abs(v_counted - v_stock) * 100 / v_stock END;
    IF ((v_pct IS NULL AND v_counted <> v_stock) OR v_pct > v_set.note_required_pct)
       AND (p_note IS NULL OR btrim(p_note) = '') THEN
        RAISE EXCEPTION 'note_required: explain a variance above % %%', v_set.note_required_pct;
    END IF;

    INSERT INTO public.stock_counts (product_id, system_qty, counted_qty, note, staff_ref)
    VALUES (p_product_id, greatest(v_stock, 0), v_counted, nullif(btrim(p_note), ''), btrim(p_staff_ref))
    RETURNING id INTO v_id;
    IF v_counted <> v_stock THEN
        UPDATE public.products SET stock = v_counted, track_stock = true WHERE id = p_product_id;
        INSERT INTO public.stock_movements (product_id, delta, reason, note, staff_ref)
        VALUES (p_product_id, v_counted - v_stock, 'count', nullif(btrim(p_note), ''), btrim(p_staff_ref));
    END IF;
    RETURN v_id;
END
$$;

-- 7. Panel reads -----------------------------------------------------------------------------------
CREATE VIEW public.panel_source_stock AS
SELECT s.id AS source_id, s.name AS source_name, s.stock::text AS stock_kg,
       (SELECT coalesce(jsonb_agg(jsonb_build_object(
                    'product_id', c.id, 'name', c.name, 'own_stock', c.stock::text,
                    'stock_unit', c.stock_unit) ORDER BY c.name), '[]'::jsonb)
          FROM public.products c WHERE c.source_product_id = s.id) AS sellable,
       (SELECT max(l.created_at) FROM public.purchase_lots l WHERE l.product_id = s.id) AS last_entry_at
FROM public.products s
WHERE EXISTS (SELECT 1 FROM public.products c WHERE c.source_product_id = s.id);

CREATE VIEW public.panel_stock_counts AS
SELECT k.id, k.product_id, p.name, k.system_qty::text AS system_qty, k.counted_qty::text AS counted_qty,
       k.variance_qty::text AS variance_qty, k.variance_pct::text AS variance_pct,
       (k.variance_pct IS NULL AND k.variance_qty <> 0 OR abs(k.variance_pct) > s.alert_pct) AS alert,
       k.note, k.staff_ref, k.counted_at
FROM public.stock_counts k
JOIN public.products p ON p.id = k.product_id
CROSS JOIN public.inventory_settings s
WHERE k.counted_at >= now() - interval '8 weeks';

-- One row per source for a day in America/Mexico_City: sold by product, what the source lost,
-- its shrink, and what nothing explains (difference = drop - sold - shrink).
CREATE FUNCTION public.panel_source_reconciliation(p_day date) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    WITH bounds AS (
        SELECT (p_day::timestamp AT TIME ZONE 'America/Mexico_City') AS lo,
               ((p_day + 1)::timestamp AT TIME ZONE 'America/Mexico_City') AS hi
    ), moves AS (
        SELECT m.* FROM public.stock_movements m, bounds b
        WHERE m.created_at >= b.lo AND m.created_at < b.hi
    ), per_source AS (
        SELECT s.id, s.name,
               coalesce((SELECT -sum(m.delta) FROM moves m
                         WHERE m.product_id = s.id AND m.delta < 0 AND m.reason <> 'cut'), 0) AS drop_kg,
               coalesce((SELECT -sum(m.delta) FROM moves m
                         WHERE m.product_id = s.id AND m.reason = 'shrink'), 0) AS shrink_kg,
               (SELECT coalesce(jsonb_agg(jsonb_build_object('product_id', x.via, 'name', x.name,
                                                             'kg', x.kg::text) ORDER BY x.name), '[]'::jsonb)
                  FROM (SELECT m.via_product_id AS via, c.name, -sum(m.delta) AS kg
                          FROM moves m JOIN public.products c ON c.id = m.via_product_id
                         WHERE m.product_id = s.id AND m.reason IN ('sale', 'cancel')
                         GROUP BY m.via_product_id, c.name) x) AS sold,
               coalesce((SELECT -sum(m.delta) FROM moves m
                         WHERE m.product_id = s.id AND m.reason IN ('sale', 'cancel')
                           AND m.via_product_id IS NOT NULL), 0) AS sold_kg
        FROM public.products s
        WHERE EXISTS (SELECT 1 FROM public.products c WHERE c.source_product_id = s.id)
    )
    SELECT coalesce(jsonb_agg(jsonb_build_object(
               'source_id', id, 'source_name', name, 'sold', sold,
               'sold_kg', sold_kg::text, 'source_drop_kg', drop_kg::text, 'shrink_kg', shrink_kg::text,
               'difference_kg', (drop_kg - sold_kg - shrink_kg)::text,
               'shrink_pct', CASE WHEN sold_kg + shrink_kg > 0
                                  THEN round(shrink_kg * 100 / (sold_kg + shrink_kg), 2)::text
                                  ELSE '0.00' END) ORDER BY name), '[]'::jsonb)
    FROM per_source;
$$;

-- 8. Who may call what ------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public._check_source_link() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.register_source_entry(integer, numeric, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cut_source(integer, jsonb, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_shrink(integer, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_stock_count(integer, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.panel_source_reconciliation(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_source_entry(integer, numeric, numeric, text, text, text) TO django;
GRANT EXECUTE ON FUNCTION public.cut_source(integer, jsonb, text, text) TO django;
GRANT EXECUTE ON FUNCTION public.record_shrink(integer, numeric, text, text, text) TO django;
GRANT EXECUTE ON FUNCTION public.record_stock_count(integer, numeric, text, text) TO django;
GRANT EXECUTE ON FUNCTION public.panel_source_reconciliation(date) TO django;
REVOKE ALL ON public.panel_source_stock FROM PUBLIC, anon, authenticated, django;
REVOKE ALL ON public.panel_stock_counts FROM PUBLIC, anon, authenticated, django;
GRANT SELECT ON public.panel_source_stock TO django;
GRANT SELECT ON public.panel_stock_counts TO django;

-- DOWN
-- Reverse order. Refuses while any row uses what it removes: those rows are stock history.
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM public.stock_movements WHERE reason IN ('shrink', 'count') OR via_product_id IS NOT NULL)
--        OR EXISTS (SELECT 1 FROM public.stock_counts)
--        OR EXISTS (SELECT 1 FROM public.products WHERE source_product_id IS NOT NULL) THEN
--         RAISE EXCEPTION 'inventory by source has history: export it before reverting';
--     END IF;
-- END $$;
-- DROP FUNCTION public.panel_source_reconciliation(date);
-- DROP VIEW public.panel_stock_counts;
-- DROP VIEW public.panel_source_stock;
-- DROP FUNCTION public.record_stock_count(integer, numeric, text, text);
-- DROP FUNCTION public.record_shrink(integer, numeric, text, text, text);
-- DROP FUNCTION public.cut_source(integer, jsonb, text, text);
-- DROP FUNCTION public.register_source_entry(integer, numeric, numeric, text, text, text);
-- Then restore set_order_status from 20261119000003_lote_al_confirmar.sql:151-277, unchanged.
-- DROP TABLE public.stock_counts;
-- DROP TABLE public.inventory_settings;
-- DROP INDEX public.idx_stock_movements_via;
-- ALTER TABLE public.stock_movements
--     DROP CONSTRAINT stock_movements_shrink_note_check,
--     DROP CONSTRAINT stock_movements_shrink_kind_check,
--     DROP CONSTRAINT stock_movements_reason_check,
--     ADD CONSTRAINT stock_movements_reason_check
--         CHECK (reason IN ('purchase', 'sale', 'cancel', 'adjustment', 'cut')),
--     DROP COLUMN shrink_kind,
--     DROP COLUMN via_product_id;
-- ALTER TABLE public.product_cut_specs DROP COLUMN piece_tolerance_kg;
-- ALTER TABLE public.purchase_lots DROP COLUMN supplier;
-- DROP TRIGGER products_check_source_link ON public.products;
-- DROP FUNCTION public._check_source_link();
-- DROP INDEX public.idx_products_source;
-- ALTER TABLE public.products DROP CONSTRAINT products_source_not_self, DROP COLUMN source_product_id;
