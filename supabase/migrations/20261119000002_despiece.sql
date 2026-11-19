-- despiece: cut pieces of a lot into other products (odd/tasks/carrito-trifasico.md, S11-S12).
--
-- From the panel, pieces of a piece lot leave their product and become new piece lots of
-- other products, each with its own weight per piece. Eduardo's example: 3 chickens of last
-- week's lot become 3 breasts for "pechuga para bistec", 6 legs for "piernas" and 6 wings for
-- "alitas adobadas". The new lots point at the lot they came from (source_lot_id), take the
-- cost of the pieces they came from (shared by weight, to the cent) and are sold by the
-- piece with the rule of one lot per line (S5), like any other piece lot.
--
--   cut_lot ........ django only (the panel: "despiece")
--   panel_open_lots  SELECT for django only (lots with pieces left and the price of one piece)
-- Movements of a cut are recorded with the new reason 'cut': out of the source, into each lot.
-- Test: supabase/tests/despiece.sql.

ALTER TABLE public.stock_movements
    DROP CONSTRAINT stock_movements_reason_check,
    ADD CONSTRAINT stock_movements_reason_check
        CHECK (reason IN ('purchase', 'sale', 'cancel', 'adjustment', 'cut'));

-- ---------------------------------------------------------------------------------------------
-- cut_lot: p_pieces pieces of lot p_source_lot_id become the lots of p_outputs, a jsonb array
-- of {product_id, pieces, piece_weight_kg}. Returns the ids of the new lots, in that order.
CREATE FUNCTION public.cut_lot(
    p_source_lot_id bigint,
    p_pieces        numeric,
    p_outputs       jsonb,
    p_note          text DEFAULT NULL,
    p_staff_ref     text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_src      record;
    v_sp       record;
    v_out      record;
    v_n        integer;
    i          integer;
    v_item     jsonb;
    v_pid      integer;
    v_pieces   numeric;
    v_weight   numeric;
    v_take     numeric;    -- what leaves the source product, in its stock unit
    v_cost     numeric;    -- cost of the pieces that leave
    v_kg_total numeric := 0;
    v_cost_acc numeric := 0;
    v_lot_cost numeric;
    v_qty      numeric;
    v_lot      bigint;
    v_ids      jsonb := '[]'::jsonb;
    v_pids     integer[] := ARRAY[]::integer[];
BEGIN
    IF char_length(p_note) > 500 THEN
        RAISE EXCEPTION 'note_too_long: at most 500 characters';
    END IF;
    IF char_length(p_staff_ref) > 100 THEN
        RAISE EXCEPTION 'invalid_staff_ref: at most 100 characters';
    END IF;

    SELECT l.id, l.product_id, l.unit_cost, l.piece_weight_kg, l.pieces_left
      INTO v_src
      FROM public.purchase_lots l
     WHERE l.id = p_source_lot_id AND l.piece_weight_kg IS NOT NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'lot_not_found: %', coalesce(p_source_lot_id::text, 'NULL');
    END IF;
    IF p_pieces IS NULL OR p_pieces = 'NaN'::numeric OR p_pieces <= 0 OR p_pieces <> trunc(p_pieces) THEN
        RAISE EXCEPTION 'invalid_amount: the pieces to cut are a whole number above zero';
    END IF;
    -- pieces_left is checked after the lock: a cancel running now can still raise it.
    IF p_outputs IS NULL OR jsonb_typeof(p_outputs) <> 'array' OR jsonb_array_length(p_outputs) = 0 THEN
        RAISE EXCEPTION 'invalid_items: a cut produces at least one product';
    END IF;
    v_n := jsonb_array_length(p_outputs);
    IF v_n > 20 THEN
        RAISE EXCEPTION 'invalid_items: at most 20 products per cut';
    END IF;

    -- Validate every output and add up its kilos before anything is written.
    FOR i IN 0 .. v_n - 1 LOOP
        v_item := p_outputs -> i;
        IF jsonb_typeof(v_item) <> 'object' THEN
            RAISE EXCEPTION 'invalid_items: output % is not an object', i + 1;
        END IF;
        BEGIN
            v_pid    := (v_item ->> 'product_id')::integer;
            v_pieces := (v_item ->> 'pieces')::numeric;
            v_weight := (v_item ->> 'piece_weight_kg')::numeric;
        EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
            RAISE EXCEPTION 'invalid_items: output % has a value that is not a valid number', i + 1;
        END;
        v_pids := v_pids || v_pid;
        IF v_pid = v_src.product_id THEN
            RAISE EXCEPTION 'invalid_items: a lot is not cut into its own product';
        END IF;
        SELECT p.id, p.price_unit, p.sale_modes INTO v_out FROM public.products p WHERE p.id = v_pid;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'product_not_found: %', coalesce(v_pid::text, 'NULL');
        END IF;
        IF v_out.price_unit <> 'kg' OR NOT ('pieces' = ANY (v_out.sale_modes)) THEN
            RAISE EXCEPTION 'sale_mode_not_allowed: output % must be priced per kilo and sold by the piece', i + 1;
        END IF;
        IF v_pieces IS NULL OR v_pieces = 'NaN'::numeric OR v_pieces <= 0 OR v_pieces > 10000
           OR v_pieces <> trunc(v_pieces) THEN
            RAISE EXCEPTION 'invalid_amount: output % needs a whole number of pieces', i + 1;
        END IF;
        IF v_weight IS NULL OR v_weight = 'NaN'::numeric OR round(v_weight, 3) <= 0 OR v_weight >= 100 THEN
            RAISE EXCEPTION 'invalid_amount: one piece of output % weighs more than 0 and less than 100 kg', i + 1;
        END IF;
        v_kg_total := v_kg_total + v_pieces * round(v_weight, 3);
    END LOOP;

    -- Lock order shared with set_order_status: every product by ascending id, then the lot.
    PERFORM 1 FROM public.products p WHERE p.id = ANY (v_pids || v_src.product_id) ORDER BY p.id FOR UPDATE;
    SELECT l.pieces_left INTO v_src.pieces_left FROM public.purchase_lots l WHERE l.id = v_src.id FOR UPDATE;
    IF p_pieces > v_src.pieces_left THEN
        RAISE EXCEPTION 'insufficient_stock: the lot has % pieces left', v_src.pieces_left;
    END IF;

    -- The pieces leave the source lot and its product.
    SELECT p.id, p.stock, p.stock_unit INTO v_sp FROM public.products p WHERE p.id = v_src.product_id FOR UPDATE;
    v_take := CASE v_sp.stock_unit WHEN 'piece' THEN p_pieces ELSE round(p_pieces * v_src.piece_weight_kg, 3) END;
    IF v_take > v_sp.stock THEN
        RAISE EXCEPTION 'insufficient_stock: the product has % in stock', v_sp.stock;
    END IF;
    v_cost := round(v_src.unit_cost * v_take, 2);
    UPDATE public.purchase_lots SET pieces_left = pieces_left - p_pieces::integer WHERE id = v_src.id;
    UPDATE public.products SET stock = stock - v_take WHERE id = v_sp.id;
    INSERT INTO public.stock_movements (product_id, delta, reason, lot_id, staff_ref, note)
    VALUES (v_sp.id, -v_take, 'cut', v_src.id, p_staff_ref, p_note);

    -- Each output becomes a piece lot; the cost is shared by kilos and the last one takes the
    -- cents left so that the new lots add up to the cost of what left.
    FOR i IN 0 .. v_n - 1 LOOP
        v_item   := p_outputs -> i;
        v_pid    := (v_item ->> 'product_id')::integer;
        v_pieces := (v_item ->> 'pieces')::numeric;
        v_weight := round((v_item ->> 'piece_weight_kg')::numeric, 3);
        SELECT p.id, p.price_per_kg, p.stock_unit INTO v_out FROM public.products p WHERE p.id = v_pid FOR UPDATE;
        IF i = v_n - 1 THEN
            v_lot_cost := v_cost - v_cost_acc;
        ELSE
            v_lot_cost := round(v_cost * v_pieces * v_weight / v_kg_total, 2);
        END IF;
        v_cost_acc := v_cost_acc + v_lot_cost;
        v_qty := CASE v_out.stock_unit WHEN 'piece' THEN v_pieces ELSE trunc(v_pieces * v_weight, 3) END;

        INSERT INTO public.purchase_lots
            (product_id, qty, total_cost, unit_cost, expected_revenue, note, staff_ref,
             piece_weight_kg, pieces_left, source_lot_id, price_per_kg)
        VALUES
            (v_out.id, v_qty, v_lot_cost, round(v_lot_cost / v_qty, 4),
             round(v_pieces * v_weight * v_out.price_per_kg, 2), p_note, p_staff_ref,
             v_weight, v_pieces::integer, v_src.id, v_out.price_per_kg)
        RETURNING id INTO v_lot;

        UPDATE public.products SET stock = stock + v_qty, track_stock = true WHERE id = v_out.id;
        INSERT INTO public.stock_movements (product_id, delta, reason, lot_id, staff_ref, note)
        VALUES (v_out.id, v_qty, 'cut', v_lot, p_staff_ref, p_note);
        v_ids := v_ids || to_jsonb(v_lot);
    END LOOP;
    RETURN v_ids;
END
$$;

REVOKE EXECUTE ON FUNCTION public.cut_lot(bigint, numeric, jsonb, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cut_lot(bigint, numeric, jsonb, text, text) TO django;

-- ---------------------------------------------------------------------------------------------
-- panel_open_lots: the piece lots that still have pieces, oldest first per product, with what
-- one piece costs today (its weight times the price per kilo). For the panel list of lots and
-- the "despiece" picker. SELECT only for django.
CREATE VIEW public.panel_open_lots AS
SELECT l.id AS lot_id,
       l.product_id,
       p.name AS product_name,
       l.piece_weight_kg,
       l.pieces_left,
       round(l.piece_weight_kg * p.price_per_kg, 2)::numeric(12,2) AS price_per_piece,
       l.source_lot_id,
       l.created_at
FROM public.purchase_lots l
JOIN public.products p ON p.id = l.product_id
WHERE l.pieces_left > 0;

REVOKE ALL ON public.panel_open_lots FROM PUBLIC, anon, authenticated, django;
GRANT SELECT ON public.panel_open_lots TO django;

-- =============================================================================================
-- Reversa. Each line starts with "-- ": correr.sh strips it and runs it. Movements of a cut
-- cannot stay once the reason is gone, so the reversa refuses while any exists.
-- DOWN
-- DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.stock_movements WHERE reason = 'cut') THEN RAISE EXCEPTION 'cut movements exist: revert them first'; END IF; END $$;
-- DROP VIEW public.panel_open_lots;
-- DROP FUNCTION public.cut_lot(bigint, numeric, jsonb, text, text);
-- ALTER TABLE public.stock_movements
--     DROP CONSTRAINT stock_movements_reason_check,
--     ADD CONSTRAINT stock_movements_reason_check
--         CHECK (reason IN ('purchase', 'sale', 'cancel', 'adjustment'));
