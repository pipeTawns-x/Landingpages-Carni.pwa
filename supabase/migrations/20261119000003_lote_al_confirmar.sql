-- Lote al confirmar: confirming an order takes its pieces out of the lots, and cancelling a
-- confirmed order puts them back (odd/tasks/carrito-trifasico.md, S4-S5, task T2).
--
-- The whole order is allocated at once per product with the same rule as the quote
-- (_lot_allocation): the oldest lot that covers every piece of that product, and only when no lot
-- covers it, the oldest lots first. Two lines of the same product are one need, so they come from
-- the same lot whenever one lot covers both.
--
-- The price stays the one quoted when the order was created. order_item_lots records the weight
-- of the pieces actually served, so the panel can see when a waiting order ended up served from
-- another lot.
--
-- Lock order, shared with cut_lot and register_lot: products by ascending id, then their lots.
-- set_order_status already locks the products of the order before calling _take_order_lots.

CREATE TABLE public.order_item_lots (
    id              bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_item_id   integer      NOT NULL REFERENCES public.order_items (id) ON DELETE CASCADE,
    lot_id          bigint       NOT NULL REFERENCES public.purchase_lots (id) ON DELETE RESTRICT,
    pieces          integer      NOT NULL CONSTRAINT order_item_lots_pieces_positive CHECK (pieces > 0),
    piece_weight_kg numeric(6,3) NOT NULL CONSTRAINT order_item_lots_weight_positive CHECK (piece_weight_kg > 0),
    returned        boolean      NOT NULL DEFAULT false,
    created_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_item_lots_item ON public.order_item_lots (order_item_id);
CREATE INDEX idx_order_item_lots_lot ON public.order_item_lots (lot_id);

-- Private data: django reads it for the panel; only the order functions write it.
ALTER TABLE public.order_item_lots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_item_lots FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.order_item_lots_id_seq FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.order_item_lots TO django;
CREATE POLICY order_item_lots_django_select ON public.order_item_lots
    FOR SELECT TO django USING (true);

-- panel_order_lots: which lots served each line of an order, for the order page of the panel.
-- line_no is the position of the line in panel_orders.lines (1-based, by order_items.id).
CREATE VIEW public.panel_order_lots AS
SELECT oi.order_id,
       (SELECT count(*) FROM public.order_items x WHERE x.order_id = oi.order_id AND x.id <= oi.id)::integer AS line_no,
       oi.product_id,
       p.name AS product_name,
       a.lot_id,
       a.pieces,
       a.piece_weight_kg,
       a.returned
FROM public.order_item_lots a
JOIN public.order_items oi ON oi.id = a.order_item_id
JOIN public.products p ON p.id = oi.product_id;
REVOKE ALL ON public.panel_order_lots FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.panel_order_lots TO django;

-- ---------------------------------------------------------------------------------------------
-- _take_order_lots: runs inside set_order_status when an order goes pending -> confirmed, after
-- the stock check passed. Pieces that no lot holds (stock counted without a lot) get no row.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public._take_order_lots(p_order_id uuid) RETURNS void
LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
    v_prod  record;
    v_line  record;
    v_alloc jsonb;
    v_lot   bigint;
    v_k     integer;   -- allocation entry being consumed
    v_free  integer;   -- pieces of that entry not given to a line yet
    v_need  integer;
    v_take  integer;
BEGIN
    FOR v_prod IN
        SELECT oi.product_id AS pid, sum(oi.pieces)::integer AS need
          FROM public.order_items oi
          JOIN public.products p ON p.id = oi.product_id
         WHERE oi.order_id = p_order_id
           AND oi.sale_mode = 'pieces' AND p.price_unit = 'kg' AND coalesce(oi.pieces, 0) > 0
         GROUP BY oi.product_id
         ORDER BY oi.product_id
    LOOP
        PERFORM 1
           FROM public.purchase_lots l
          WHERE l.product_id = v_prod.pid AND l.pieces_left > 0
          ORDER BY l.id
            FOR UPDATE;
        v_alloc := public._lot_allocation(v_prod.pid, v_prod.need);
        CONTINUE WHEN v_alloc IS NULL;

        -- Hand the allocation out to the lines of this product, in line order.
        v_k    := 0;
        v_free := (v_alloc -> 0 ->> 'pieces')::integer;
        FOR v_line IN
            SELECT oi.id, oi.pieces
              FROM public.order_items oi
             WHERE oi.order_id = p_order_id AND oi.product_id = v_prod.pid
               AND oi.sale_mode = 'pieces' AND coalesce(oi.pieces, 0) > 0
             ORDER BY oi.id
        LOOP
            v_need := v_line.pieces;
            WHILE v_need > 0 AND v_k < jsonb_array_length(v_alloc) LOOP
                v_lot := (v_alloc -> v_k ->> 'lot_id')::bigint;
                EXIT WHEN v_lot IS NULL;   -- the rest is stock without a lot
                v_take := least(v_need, v_free);
                INSERT INTO public.order_item_lots (order_item_id, lot_id, pieces, piece_weight_kg)
                VALUES (v_line.id, v_lot, v_take, (v_alloc -> v_k ->> 'piece_weight_kg')::numeric);
                UPDATE public.purchase_lots SET pieces_left = pieces_left - v_take WHERE id = v_lot;
                v_need := v_need - v_take;
                v_free := v_free - v_take;
                IF v_free = 0 THEN
                    v_k    := v_k + 1;
                    v_free := (v_alloc -> v_k ->> 'pieces')::integer;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- _return_order_lots: runs inside set_order_status when a confirmed order is cancelled. Every
-- piece goes back to the lot it came from; the rows stay, marked as returned.
-- ---------------------------------------------------------------------------------------------
CREATE FUNCTION public._return_order_lots(p_order_id uuid) RETURNS void
LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
    v_row record;
BEGIN
    FOR v_row IN
        SELECT a.lot_id, sum(a.pieces)::integer AS pieces
          FROM public.order_item_lots a
          JOIN public.order_items oi ON oi.id = a.order_item_id
         WHERE oi.order_id = p_order_id AND NOT a.returned
         GROUP BY a.lot_id
         ORDER BY a.lot_id
    LOOP
        UPDATE public.purchase_lots SET pieces_left = pieces_left + v_row.pieces WHERE id = v_row.lot_id;
    END LOOP;
    UPDATE public.order_item_lots a
       SET returned = true
      FROM public.order_items oi
     WHERE oi.id = a.order_item_id AND oi.order_id = p_order_id AND NOT a.returned;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._take_order_lots(uuid), public._return_order_lots(uuid)
    FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- set_order_status: same body as in 20261113000002, plus the two calls marked "Lots".
-- CREATE OR REPLACE keeps its privileges (django only).
-- ---------------------------------------------------------------------------------------------
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

        -- Lots: the pieces leave their lots, the whole order at once.
        PERFORM public._take_order_lots(p_order_id);

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

        -- Lots: every piece goes back to the lot it came from.
        PERFORM public._return_order_lots(p_order_id);
    END IF;

    UPDATE public.orders SET status = p_new_status WHERE id = p_order_id;
    INSERT INTO public.order_status_log (order_id, from_status, to_status, actor)
    VALUES (p_order_id, v_from, p_new_status, left(p_actor, 100));

    RETURN p_new_status;
END;
$$;

-- DOWN
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM public.order_item_lots) THEN
--         RAISE EXCEPTION 'order_item_lots has rows: these orders took pieces from their lots';
--     END IF;
-- END $$;
-- CREATE OR REPLACE FUNCTION public.set_order_status(
--     p_order_id   uuid,
--     p_new_status text,
--     p_actor      text DEFAULT NULL
-- ) RETURNS text
-- LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
-- AS $$
-- DECLARE
--     v_from    text;
--     v_allowed text[];
--     v_row     record;
-- BEGIN
--     IF p_new_status IS NULL
--        OR p_new_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') THEN
--         RAISE EXCEPTION 'invalid_status: %', coalesce(p_new_status, 'NULL');
--     END IF;
--
--     SELECT o.status INTO v_from FROM public.orders o WHERE o.id = p_order_id FOR UPDATE;
--     IF NOT FOUND THEN
--         RAISE EXCEPTION 'order_not_found: %', coalesce(p_order_id::text, 'NULL');
--     END IF;
--
--     v_allowed := CASE v_from
--         WHEN 'pending'   THEN ARRAY['confirmed', 'cancelled']
--         WHEN 'confirmed' THEN ARRAY['preparing', 'cancelled']
--         WHEN 'preparing' THEN ARRAY['ready', 'cancelled']
--         WHEN 'ready'     THEN ARRAY['delivered', 'cancelled']
--         ELSE ARRAY[]::text[]
--     END;
--     IF NOT (p_new_status = ANY (v_allowed)) THEN
--         RAISE EXCEPTION 'invalid_transition: % -> %', v_from, p_new_status;
--     END IF;
--
--     IF v_from = 'pending' AND p_new_status = 'confirmed' THEN
--         -- Bloqueo de los productos con seguimiento, siempre por id ascendente.
--         PERFORM 1
--         FROM public.products p
--         WHERE p.track_stock
--           AND p.id IN (SELECT oi.product_id FROM public.order_items oi WHERE oi.order_id = p_order_id)
--         ORDER BY p.id
--         FOR UPDATE;
--
--         FOR v_row IN
--             SELECT oi.product_id AS pid, p.name AS pname, p.stock AS stock,
--                    sum(CASE WHEN p.stock_unit = 'piece' THEN coalesce(oi.pieces, 0)::numeric
--                             ELSE oi.quantity_kg END) AS need
--             FROM public.order_items oi
--             JOIN public.products p ON p.id = oi.product_id
--             WHERE oi.order_id = p_order_id AND p.track_stock
--             GROUP BY oi.product_id, p.name, p.stock
--             ORDER BY oi.product_id
--         LOOP
--             IF v_row.need > v_row.stock THEN
--                 RAISE EXCEPTION 'insufficient_stock: % needs %, only % in stock',
--                     v_row.pname, v_row.need, v_row.stock;
--             END IF;
--         END LOOP;
--
--         FOR v_row IN
--             SELECT oi.product_id AS pid,
--                    sum(CASE WHEN p.stock_unit = 'piece' THEN coalesce(oi.pieces, 0)::numeric
--                             ELSE oi.quantity_kg END) AS need
--             FROM public.order_items oi
--             JOIN public.products p ON p.id = oi.product_id
--             WHERE oi.order_id = p_order_id AND p.track_stock
--             GROUP BY oi.product_id
--             ORDER BY oi.product_id
--         LOOP
--             IF v_row.need > 0 THEN
--                 UPDATE public.products SET stock = stock - v_row.need WHERE id = v_row.pid;
--                 INSERT INTO public.stock_movements (product_id, delta, reason, order_id, staff_ref)
--                 VALUES (v_row.pid, -v_row.need, 'sale', p_order_id, left(p_actor, 100));
--             END IF;
--         END LOOP;
--
--         -- Costo congelado: kilos con rendimiento, o piezas. Sin costo capturado no hay fila.
--         INSERT INTO public.order_item_costs
--             (order_item_id, cost_per_kg_frozen, cost_per_piece_frozen, yield_pct_frozen, total_cost_frozen)
--         SELECT oi.id,
--                CASE WHEN p.price_unit =  'kg' THEN pc.cost_per_kg END,
--                CASE WHEN p.price_unit <> 'kg' THEN pc.cost_per_piece END,
--                CASE WHEN p.price_unit =  'kg' THEN pc.yield_pct END,
--                CASE WHEN p.price_unit = 'kg'
--                     THEN round(oi.quantity_kg * pc.cost_per_kg / (pc.yield_pct / 100), 2)
--                     ELSE round(coalesce(oi.pieces, 0) * pc.cost_per_piece, 2) END
--         FROM public.order_items oi
--         JOIN public.products p ON p.id = oi.product_id
--         JOIN public.product_costs pc ON pc.product_id = oi.product_id
--         WHERE oi.order_id = p_order_id
--           AND ((p.price_unit = 'kg' AND pc.cost_per_kg IS NOT NULL)
--                OR (p.price_unit <> 'kg' AND pc.cost_per_piece IS NOT NULL))
--         ON CONFLICT (order_item_id) DO NOTHING;
--
--     ELSIF p_new_status = 'cancelled' AND v_from <> 'pending' THEN
--         PERFORM 1
--         FROM public.products p
--         WHERE p.id IN (SELECT m.product_id FROM public.stock_movements m WHERE m.order_id = p_order_id)
--         ORDER BY p.id
--         FOR UPDATE;
--
--         FOR v_row IN
--             SELECT m.product_id AS pid, -sum(m.delta) AS qty
--             FROM public.stock_movements m
--             WHERE m.order_id = p_order_id AND m.reason IN ('sale', 'cancel')
--             GROUP BY m.product_id
--             HAVING sum(m.delta) < 0
--             ORDER BY m.product_id
--         LOOP
--             UPDATE public.products SET stock = stock + v_row.qty WHERE id = v_row.pid;
--             INSERT INTO public.stock_movements (product_id, delta, reason, order_id, staff_ref)
--             VALUES (v_row.pid, v_row.qty, 'cancel', p_order_id, left(p_actor, 100));
--         END LOOP;
--     END IF;
--
--     UPDATE public.orders SET status = p_new_status WHERE id = p_order_id;
--     INSERT INTO public.order_status_log (order_id, from_status, to_status, actor)
--     VALUES (p_order_id, v_from, p_new_status, left(p_actor, 100));
--
--     RETURN p_new_status;
-- END;
-- $$;
-- DROP FUNCTION public._return_order_lots(uuid);
-- DROP FUNCTION public._take_order_lots(uuid);
-- DROP VIEW public.panel_order_lots;
-- DROP TABLE public.order_item_lots;
