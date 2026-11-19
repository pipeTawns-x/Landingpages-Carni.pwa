-- lotes_por_pieza: a lot weighed by the piece (odd/tasks/carrito-trifasico.md, S3-S5).
--
-- Every week a bag arrives (say 20 chickens). One is weighed and that weight becomes the
-- standard weight of every piece of the lot. The price of a piece is that weight times the
-- price per kilo of the product: at $75/kg a 1.5 kg chicken is $112.50 and a 2.5 kg one $187.50.
--
-- A line sold by the piece is served whole from ONE lot: the oldest lot that covers it. Only
-- when no single lot covers it are lots mixed (oldest first) and the line warns 'mixed_lots'.
-- Pieces nobody holds are priced with the newest lot and the usual 'low_stock' warning shows.
--
-- Products without piece lots keep the cut-spec average, exactly as before. quote_cart is not
-- touched: it calls quote_line. Quoting never writes; the order slice decrements the lots.
--
--   register_lot ...... django only (the panel: "registrar lote")
--   _lot_allocation ... nobody; quote_line calls it as its owner
-- Test: supabase/tests/lotes_por_pieza.sql.

ALTER TABLE public.purchase_lots
    ADD COLUMN piece_weight_kg numeric(6,3),
    ADD COLUMN pieces_left     integer,
    ADD COLUMN source_lot_id   bigint REFERENCES public.purchase_lots (id) ON DELETE RESTRICT,
    ADD COLUMN price_per_kg    numeric(10,2),
    ADD CONSTRAINT purchase_lots_piece_weight_positive CHECK (piece_weight_kg IS NULL OR piece_weight_kg > 0),
    ADD CONSTRAINT purchase_lots_pieces_left_non_negative CHECK (pieces_left IS NULL OR pieces_left >= 0),
    ADD CONSTRAINT purchase_lots_piece_lot_complete CHECK ((piece_weight_kg IS NULL) = (pieces_left IS NULL));
COMMENT ON COLUMN public.purchase_lots.piece_weight_kg IS
    'Standard weight of one piece of this lot (one piece weighed when the bag arrived). NULL: not a piece lot.';
COMMENT ON COLUMN public.purchase_lots.pieces_left IS
    'Pieces of this lot not sold or cut yet. NULL: not a piece lot.';
COMMENT ON COLUMN public.purchase_lots.price_per_kg IS
    'Price per kilo of the product the day the lot came, for the record. Quotes use the current price.';
COMMENT ON COLUMN public.purchase_lots.source_lot_id IS
    'The lot these pieces were cut from (despiece). NULL: bought from a supplier.';
CREATE INDEX idx_purchase_lots_open_pieces ON public.purchase_lots (product_id, created_at, id)
    WHERE pieces_left > 0;

-- ---------------------------------------------------------------------------------------------
-- _lot_allocation: which lots serve p_pieces of a product. NULL when the product has no piece
-- lot with pieces left. Otherwise a jsonb array of {lot_id, pieces, piece_weight_kg}:
--   one entry  .... the oldest lot that covers the whole line;
--   several ....... no lot covers it alone: oldest first, and a last entry with lot_id null for
--                   the pieces nobody holds, at the weight of the newest lot.
CREATE FUNCTION public._lot_allocation(p_product_id integer, p_pieces integer)
RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path = ''
AS $$
DECLARE
    v_lot    record;
    v_left   integer := p_pieces;
    v_take   integer;
    v_newest numeric;
    v_out    jsonb := '[]'::jsonb;
BEGIN
    IF p_pieces IS NULL OR p_pieces <= 0 THEN
        RETURN NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.purchase_lots l
                    WHERE l.product_id = p_product_id AND l.pieces_left > 0) THEN
        RETURN NULL;
    END IF;

    SELECT l.id, l.piece_weight_kg
      INTO v_lot
      FROM public.purchase_lots l
     WHERE l.product_id = p_product_id AND l.pieces_left >= p_pieces
     ORDER BY l.created_at, l.id
     LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_array(jsonb_build_object(
            'lot_id', v_lot.id, 'pieces', p_pieces, 'piece_weight_kg', v_lot.piece_weight_kg));
    END IF;

    FOR v_lot IN
        SELECT l.id, l.piece_weight_kg, l.pieces_left
          FROM public.purchase_lots l
         WHERE l.product_id = p_product_id AND l.pieces_left > 0
         ORDER BY l.created_at, l.id
    LOOP
        v_take := least(v_left, v_lot.pieces_left);
        v_out := v_out || jsonb_build_array(jsonb_build_object(
            'lot_id', v_lot.id, 'pieces', v_take, 'piece_weight_kg', v_lot.piece_weight_kg));
        v_left := v_left - v_take;
        v_newest := v_lot.piece_weight_kg;
        EXIT WHEN v_left = 0;
    END LOOP;
    IF v_left > 0 THEN
        v_out := v_out || jsonb_build_array(jsonb_build_object(
            'lot_id', NULL, 'pieces', v_left, 'piece_weight_kg', v_newest));
    END IF;
    RETURN v_out;
END
$$;

-- ---------------------------------------------------------------------------------------------
-- register_lot: a bag that arrives, counted by the piece, with the weight of one piece.
-- Same bookkeeping as register_purchase (lot, cost, stock, movement), measured in pieces.
-- The stock grows by the pieces when the product counts pieces, by their kilos otherwise.
CREATE FUNCTION public.register_lot(
    p_product_id      integer,
    p_pieces          numeric,
    p_piece_weight_kg numeric,
    p_total_cost      numeric,
    p_note            text DEFAULT NULL,
    p_staff_ref       text DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_p   record;
    v_kg  numeric;
    v_qty numeric;
    v_lot bigint;
BEGIN
    SELECT p.id, p.price_per_kg, p.price_unit, p.stock_unit, p.sale_modes
      INTO v_p
      FROM public.products p
     WHERE p.id = p_product_id
       FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
    END IF;
    IF v_p.price_unit <> 'kg' OR NOT ('pieces' = ANY (v_p.sale_modes)) THEN
        RAISE EXCEPTION 'sale_mode_not_allowed: a piece lot needs a product priced per kilo and sold by the piece';
    END IF;
    IF p_pieces IS NULL OR p_pieces = 'NaN'::numeric OR p_pieces <= 0 OR p_pieces > 10000
       OR p_pieces <> trunc(p_pieces) THEN
        RAISE EXCEPTION 'invalid_amount: the pieces are a whole number between 1 and 10000';
    END IF;
    IF p_piece_weight_kg IS NULL OR p_piece_weight_kg = 'NaN'::numeric
       OR round(p_piece_weight_kg, 3) <= 0 OR p_piece_weight_kg >= 100 THEN
        RAISE EXCEPTION 'invalid_amount: one piece weighs more than 0 and less than 100 kg';
    END IF;
    IF p_total_cost IS NULL OR p_total_cost = 'NaN'::numeric OR p_total_cost < 0 THEN
        RAISE EXCEPTION 'invalid_amount: the total cost must be zero or more';
    END IF;
    IF char_length(p_note) > 500 THEN
        RAISE EXCEPTION 'note_too_long: at most 500 characters';
    END IF;
    IF char_length(p_staff_ref) > 100 THEN
        RAISE EXCEPTION 'invalid_staff_ref: at most 100 characters';
    END IF;

    v_kg  := p_pieces * round(p_piece_weight_kg, 3);
    v_qty := CASE v_p.stock_unit WHEN 'piece' THEN p_pieces ELSE trunc(v_kg, 3) END;

    INSERT INTO public.purchase_lots
        (product_id, qty, total_cost, unit_cost, expected_revenue, note, staff_ref,
         piece_weight_kg, pieces_left, price_per_kg)
    VALUES
        (v_p.id, v_qty, p_total_cost, round(p_total_cost / v_qty, 4),
         round(v_kg * v_p.price_per_kg, 2), p_note, p_staff_ref,
         round(p_piece_weight_kg, 3), p_pieces::integer, v_p.price_per_kg)
    RETURNING id INTO v_lot;

    INSERT INTO public.product_costs (product_id, cost_per_kg, yield_pct, updated_at, updated_by)
    VALUES (v_p.id, round(p_total_cost / v_kg, 4), 100, now(), p_staff_ref)
    ON CONFLICT (product_id) DO UPDATE
       SET cost_per_kg = EXCLUDED.cost_per_kg, updated_at = now(), updated_by = EXCLUDED.updated_by;

    UPDATE public.products SET stock = stock + v_qty, track_stock = true WHERE id = v_p.id;
    INSERT INTO public.stock_movements (product_id, delta, reason, lot_id, staff_ref)
    VALUES (v_p.id, v_qty, 'purchase', v_lot, p_staff_ref);
    RETURN v_lot;
END
$$;

-- ---------------------------------------------------------------------------------------------
-- quote_line: the same function; only the branch "by the piece, priced per kilo" changes.
CREATE OR REPLACE FUNCTION public.quote_line(
    p_product_id   integer,
    p_mode         text,
    p_amount       numeric,
    p_unit         text    DEFAULT NULL,
    p_thickness_in numeric DEFAULT NULL,
    p_currency     text    DEFAULT 'MXN'
) RETURNS TABLE (
    product_id     integer,
    sale_mode      text,
    quantity_kg    numeric,
    pieces         integer,
    unit_price     numeric,
    line_total_mxn numeric,
    discount_mxn   numeric,
    line_total_usd numeric,
    warnings       text[]
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_p      record;
    v_spec   record;
    v_promo  record;
    v_fx     record;
    v_price  numeric;
    v_factor numeric;
    v_kg     numeric;   -- kilos exactos; NULL en una linea por pieza o paquete
    v_total  numeric;
    v_usd    numeric;
    v_need   numeric;
    v_alloc  jsonb;     -- lots that serve a line by the piece (NULL: the product has none)
    v_has_spec boolean;
BEGIN
    IF p_currency IS NULL OR p_currency NOT IN ('MXN', 'USD') THEN
        RAISE EXCEPTION 'invalid_currency: %', coalesce(p_currency, 'NULL');
    END IF;

    SELECT p.id, p.name, p.price_per_kg, p.price_unit, p.sale_modes, p.stock, p.stock_unit,
           p.track_stock, p.min_quantity_kg
    INTO v_p
    FROM public.products p
    WHERE p.id = p_product_id AND p.is_active;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
    END IF;

    IF p_mode IS NULL OR p_mode NOT IN ('money', 'weight', 'pieces') OR NOT (p_mode = ANY (v_p.sale_modes)) THEN
        RAISE EXCEPTION 'sale_mode_not_allowed: % is not sold by %', v_p.name, coalesce(p_mode, 'NULL');
    END IF;
    IF p_amount IS NULL OR p_amount = 'NaN'::numeric OR p_amount <= 0 THEN
        RAISE EXCEPTION 'invalid_amount: the amount must be greater than zero';
    END IF;

    SELECT f.rate, f.house_rate, f.fetched_on, f.status
    INTO v_fx
    FROM public.current_fx f;
    IF p_currency = 'USD' AND v_fx.status IS DISTINCT FROM 'ok' THEN
        RAISE EXCEPTION 'fx_unavailable: there is no exchange rate from the last 4 days';
    END IF;

    -- Precio: el de la promocion vigente si hay una, sin pasar nunca del precio de lista.
    v_price := v_p.price_per_kg;
    SELECT pr.kind, pr.value
    INTO v_promo
    FROM public.product_promotions pr
    WHERE pr.product_id = v_p.id AND pr.is_active AND pr.starts_at <= now() AND now() < pr.ends_at
    ORDER BY pr.starts_at DESC
    LIMIT 1;
    IF FOUND THEN
        v_price := CASE v_promo.kind
            WHEN 'percent'     THEN round(v_p.price_per_kg * (1 - v_promo.value / 100), 2)
            WHEN 'amount_off'  THEN v_p.price_per_kg - v_promo.value
            WHEN 'fixed_price' THEN least(v_promo.value, v_p.price_per_kg)
        END;
        v_price := greatest(v_price, 0.01);
    END IF;

    warnings := ARRAY[]::text[];
    pieces := NULL;

    IF p_mode = 'weight' THEN
        v_factor := CASE coalesce(p_unit, 'kg') WHEN 'kg' THEN 1 WHEN 'g' THEN 0.001 WHEN 'lb' THEN 0.45359237 END;
        IF v_factor IS NULL THEN
            RAISE EXCEPTION 'invalid_amount: unknown unit %', p_unit;
        END IF;
        v_kg := p_amount * v_factor;
        IF v_kg > 1000 THEN
            RAISE EXCEPTION 'invalid_amount: at most 1000 kg per line';
        END IF;
        v_total := v_kg * v_price;
        IF p_thickness_in IS NOT NULL THEN
            warnings := array_append(warnings, 'thickness_ignored');
        END IF;

    ELSIF p_mode = 'money' THEN
        IF p_amount > 1000000 THEN
            RAISE EXCEPTION 'invalid_amount: at most 1,000,000 per line';
        END IF;
        IF p_currency = 'USD' THEN
            -- Se cobra lo que el cliente pidio en dolares; los pesos salen de la tasa de la casa.
            v_usd   := round(p_amount, 2);
            v_total := round(v_usd * v_fx.house_rate, 2);
        ELSE
            v_total := round(p_amount, 2);
        END IF;
        v_kg := v_total / v_price;
        IF p_thickness_in IS NOT NULL THEN
            warnings := array_append(warnings, 'thickness_ignored');
        END IF;

    ELSE -- pieces
        IF p_amount <> trunc(p_amount) THEN
            RAISE EXCEPTION 'invalid_amount: pieces must be a whole number';
        END IF;
        IF p_amount > 10000 THEN
            RAISE EXCEPTION 'invalid_amount: at most 10000 pieces per line';
        END IF;
        pieces := p_amount::integer;
        IF v_p.price_unit = 'kg' THEN
            -- The weight of a piece comes from its lot when the product has piece lots
            -- (register_lot); otherwise from the average of the cut spec, as before.
            v_alloc := public._lot_allocation(v_p.id, pieces);
            SELECT s.avg_piece_weight_kg, s.thickness_min_in, s.thickness_max_in, s.thickness_default_in
            INTO v_spec
            FROM public.product_cut_specs s
            WHERE s.product_id = v_p.id;
            v_has_spec := FOUND;
            IF v_has_spec THEN
                v_has_spec := coalesce(v_spec.avg_piece_weight_kg, 0) > 0;
            END IF;
            IF v_alloc IS NULL AND NOT v_has_spec THEN
                RAISE EXCEPTION 'sale_mode_not_allowed: % has no weight per piece', v_p.name;
            END IF;
            v_factor := 1;
            IF p_thickness_in IS NOT NULL THEN
                IF p_thickness_in <= 0 THEN
                    RAISE EXCEPTION 'invalid_amount: the thickness must be greater than zero';
                END IF;
                IF NOT v_has_spec OR v_spec.thickness_default_in IS NULL THEN
                    warnings := array_append(warnings, 'thickness_ignored');
                ELSE
                    IF (v_spec.thickness_min_in IS NOT NULL AND p_thickness_in < v_spec.thickness_min_in)
                       OR (v_spec.thickness_max_in IS NOT NULL AND p_thickness_in > v_spec.thickness_max_in) THEN
                        RAISE EXCEPTION 'invalid_amount: the thickness is outside the range of this cut';
                    END IF;
                    v_factor := p_thickness_in / v_spec.thickness_default_in;
                END IF;
            END IF;
            IF v_alloc IS NULL THEN
                v_kg := pieces * v_spec.avg_piece_weight_kg * v_factor;
            ELSE
                SELECT sum((a ->> 'pieces')::numeric * (a ->> 'piece_weight_kg')::numeric)
                  INTO v_kg
                  FROM jsonb_array_elements(v_alloc) AS a;
                v_kg := v_kg * v_factor;
                -- Mixed means two real lots; pieces nobody holds are not a lot.
                IF (SELECT count(*) FROM jsonb_array_elements(v_alloc) AS a
                     WHERE a ->> 'lot_id' IS NOT NULL) > 1 THEN
                    warnings := array_append(warnings, 'mixed_lots');
                END IF;
            END IF;
            IF v_kg > 1000 THEN
                RAISE EXCEPTION 'invalid_amount: at most 1000 kg per line';
            END IF;
            v_total := v_kg * v_price;
        ELSE
            -- Mercancia o paquete: el precio es por pieza y no hay kilos.
            v_kg    := NULL;
            v_total := pieces * v_price;
            IF p_thickness_in IS NOT NULL THEN
                warnings := array_append(warnings, 'thickness_ignored');
            END IF;
        END IF;
    END IF;

    product_id     := v_p.id;
    sale_mode      := p_mode;
    unit_price     := v_price::numeric(10,2);
    quantity_kg    := round(coalesce(v_kg, 0), 3)::numeric(10,3);
    line_total_mxn := round(v_total, 2)::numeric(12,2);
    IF line_total_mxn <= 0 OR (v_p.price_unit = 'kg' AND quantity_kg <= 0) THEN
        RAISE EXCEPTION 'invalid_amount: the quantity rounds down to nothing';
    END IF;
    discount_mxn := round(coalesce(v_kg, pieces::numeric) * (v_p.price_per_kg - v_price), 2)::numeric(12,2);

    IF v_fx.status = 'ok' THEN
        IF p_mode = 'money' AND p_currency = 'USD' THEN
            line_total_usd := v_usd::numeric(12,2);
        ELSE
            line_total_usd := (ceil(line_total_mxn / v_fx.house_rate * 100) / 100)::numeric(12,2);
        END IF;
    ELSE
        line_total_usd := NULL;
    END IF;

    IF v_p.track_stock THEN
        v_need := CASE v_p.stock_unit WHEN 'piece' THEN pieces::numeric ELSE v_kg END;
        IF v_need IS NOT NULL AND v_need > v_p.stock THEN
            warnings := array_append(warnings, 'low_stock');
        END IF;
    END IF;
    IF p_mode IN ('money', 'weight') AND quantity_kg < v_p.min_quantity_kg THEN
        warnings := array_append(warnings, 'below_minimum_quantity');
    END IF;

    RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._lot_allocation(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.register_lot(integer, numeric, numeric, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_lot(integer, numeric, numeric, numeric, text, text) TO django;

-- =============================================================================================
-- Reversa. Each line starts with "-- ": correr.sh strips it and runs it. It restores quote_line
-- exactly as 20261113000002 left it (CREATE OR REPLACE keeps its grants).
-- DOWN
-- DROP FUNCTION public.register_lot(integer, numeric, numeric, numeric, text, text);
-- CREATE OR REPLACE FUNCTION public.quote_line(
--     p_product_id   integer,
--     p_mode         text,
--     p_amount       numeric,
--     p_unit         text    DEFAULT NULL,
--     p_thickness_in numeric DEFAULT NULL,
--     p_currency     text    DEFAULT 'MXN'
-- ) RETURNS TABLE (
--     product_id     integer,
--     sale_mode      text,
--     quantity_kg    numeric,
--     pieces         integer,
--     unit_price     numeric,
--     line_total_mxn numeric,
--     discount_mxn   numeric,
--     line_total_usd numeric,
--     warnings       text[]
-- )
-- LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
-- AS $$
-- DECLARE
--     v_p      record;
--     v_spec   record;
--     v_promo  record;
--     v_fx     record;
--     v_price  numeric;
--     v_factor numeric;
--     v_kg     numeric;   -- kilos exactos; NULL en una linea por pieza o paquete
--     v_total  numeric;
--     v_usd    numeric;
--     v_need   numeric;
-- BEGIN
--     IF p_currency IS NULL OR p_currency NOT IN ('MXN', 'USD') THEN
--         RAISE EXCEPTION 'invalid_currency: %', coalesce(p_currency, 'NULL');
--     END IF;
--
--     SELECT p.id, p.name, p.price_per_kg, p.price_unit, p.sale_modes, p.stock, p.stock_unit,
--            p.track_stock, p.min_quantity_kg
--     INTO v_p
--     FROM public.products p
--     WHERE p.id = p_product_id AND p.is_active;
--     IF NOT FOUND THEN
--         RAISE EXCEPTION 'product_not_found: %', coalesce(p_product_id::text, 'NULL');
--     END IF;
--
--     IF p_mode IS NULL OR p_mode NOT IN ('money', 'weight', 'pieces') OR NOT (p_mode = ANY (v_p.sale_modes)) THEN
--         RAISE EXCEPTION 'sale_mode_not_allowed: % is not sold by %', v_p.name, coalesce(p_mode, 'NULL');
--     END IF;
--     IF p_amount IS NULL OR p_amount = 'NaN'::numeric OR p_amount <= 0 THEN
--         RAISE EXCEPTION 'invalid_amount: the amount must be greater than zero';
--     END IF;
--
--     SELECT f.rate, f.house_rate, f.fetched_on, f.status
--     INTO v_fx
--     FROM public.current_fx f;
--     IF p_currency = 'USD' AND v_fx.status IS DISTINCT FROM 'ok' THEN
--         RAISE EXCEPTION 'fx_unavailable: there is no exchange rate from the last 4 days';
--     END IF;
--
--     -- Precio: el de la promocion vigente si hay una, sin pasar nunca del precio de lista.
--     v_price := v_p.price_per_kg;
--     SELECT pr.kind, pr.value
--     INTO v_promo
--     FROM public.product_promotions pr
--     WHERE pr.product_id = v_p.id AND pr.is_active AND pr.starts_at <= now() AND now() < pr.ends_at
--     ORDER BY pr.starts_at DESC
--     LIMIT 1;
--     IF FOUND THEN
--         v_price := CASE v_promo.kind
--             WHEN 'percent'     THEN round(v_p.price_per_kg * (1 - v_promo.value / 100), 2)
--             WHEN 'amount_off'  THEN v_p.price_per_kg - v_promo.value
--             WHEN 'fixed_price' THEN least(v_promo.value, v_p.price_per_kg)
--         END;
--         v_price := greatest(v_price, 0.01);
--     END IF;
--
--     warnings := ARRAY[]::text[];
--     pieces := NULL;
--
--     IF p_mode = 'weight' THEN
--         v_factor := CASE coalesce(p_unit, 'kg') WHEN 'kg' THEN 1 WHEN 'g' THEN 0.001 WHEN 'lb' THEN 0.45359237 END;
--         IF v_factor IS NULL THEN
--             RAISE EXCEPTION 'invalid_amount: unknown unit %', p_unit;
--         END IF;
--         v_kg := p_amount * v_factor;
--         IF v_kg > 1000 THEN
--             RAISE EXCEPTION 'invalid_amount: at most 1000 kg per line';
--         END IF;
--         v_total := v_kg * v_price;
--         IF p_thickness_in IS NOT NULL THEN
--             warnings := array_append(warnings, 'thickness_ignored');
--         END IF;
--
--     ELSIF p_mode = 'money' THEN
--         IF p_amount > 1000000 THEN
--             RAISE EXCEPTION 'invalid_amount: at most 1,000,000 per line';
--         END IF;
--         IF p_currency = 'USD' THEN
--             -- Se cobra lo que el cliente pidio en dolares; los pesos salen de la tasa de la casa.
--             v_usd   := round(p_amount, 2);
--             v_total := round(v_usd * v_fx.house_rate, 2);
--         ELSE
--             v_total := round(p_amount, 2);
--         END IF;
--         v_kg := v_total / v_price;
--         IF p_thickness_in IS NOT NULL THEN
--             warnings := array_append(warnings, 'thickness_ignored');
--         END IF;
--
--     ELSE -- pieces
--         IF p_amount <> trunc(p_amount) THEN
--             RAISE EXCEPTION 'invalid_amount: pieces must be a whole number';
--         END IF;
--         IF p_amount > 10000 THEN
--             RAISE EXCEPTION 'invalid_amount: at most 10000 pieces per line';
--         END IF;
--         pieces := p_amount::integer;
--         IF v_p.price_unit = 'kg' THEN
--             SELECT s.avg_piece_weight_kg, s.thickness_min_in, s.thickness_max_in, s.thickness_default_in
--             INTO v_spec
--             FROM public.product_cut_specs s
--             WHERE s.product_id = v_p.id;
--             IF NOT FOUND OR v_spec.avg_piece_weight_kg IS NULL OR v_spec.avg_piece_weight_kg <= 0 THEN
--                 RAISE EXCEPTION 'sale_mode_not_allowed: % has no weight per piece', v_p.name;
--             END IF;
--             v_factor := 1;
--             IF p_thickness_in IS NOT NULL THEN
--                 IF p_thickness_in <= 0 THEN
--                     RAISE EXCEPTION 'invalid_amount: the thickness must be greater than zero';
--                 END IF;
--                 IF v_spec.thickness_default_in IS NULL THEN
--                     warnings := array_append(warnings, 'thickness_ignored');
--                 ELSE
--                     IF (v_spec.thickness_min_in IS NOT NULL AND p_thickness_in < v_spec.thickness_min_in)
--                        OR (v_spec.thickness_max_in IS NOT NULL AND p_thickness_in > v_spec.thickness_max_in) THEN
--                         RAISE EXCEPTION 'invalid_amount: the thickness is outside the range of this cut';
--                     END IF;
--                     v_factor := p_thickness_in / v_spec.thickness_default_in;
--                 END IF;
--             END IF;
--             v_kg := pieces * v_spec.avg_piece_weight_kg * v_factor;
--             IF v_kg > 1000 THEN
--                 RAISE EXCEPTION 'invalid_amount: at most 1000 kg per line';
--             END IF;
--             v_total := v_kg * v_price;
--         ELSE
--             -- Mercancia o paquete: el precio es por pieza y no hay kilos.
--             v_kg    := NULL;
--             v_total := pieces * v_price;
--             IF p_thickness_in IS NOT NULL THEN
--                 warnings := array_append(warnings, 'thickness_ignored');
--             END IF;
--         END IF;
--     END IF;
--
--     product_id     := v_p.id;
--     sale_mode      := p_mode;
--     unit_price     := v_price::numeric(10,2);
--     quantity_kg    := round(coalesce(v_kg, 0), 3)::numeric(10,3);
--     line_total_mxn := round(v_total, 2)::numeric(12,2);
--     IF line_total_mxn <= 0 OR (v_p.price_unit = 'kg' AND quantity_kg <= 0) THEN
--         RAISE EXCEPTION 'invalid_amount: the quantity rounds down to nothing';
--     END IF;
--     discount_mxn := round(coalesce(v_kg, pieces::numeric) * (v_p.price_per_kg - v_price), 2)::numeric(12,2);
--
--     IF v_fx.status = 'ok' THEN
--         IF p_mode = 'money' AND p_currency = 'USD' THEN
--             line_total_usd := v_usd::numeric(12,2);
--         ELSE
--             line_total_usd := (ceil(line_total_mxn / v_fx.house_rate * 100) / 100)::numeric(12,2);
--         END IF;
--     ELSE
--         line_total_usd := NULL;
--     END IF;
--
--     IF v_p.track_stock THEN
--         v_need := CASE v_p.stock_unit WHEN 'piece' THEN pieces::numeric ELSE v_kg END;
--         IF v_need IS NOT NULL AND v_need > v_p.stock THEN
--             warnings := array_append(warnings, 'low_stock');
--         END IF;
--     END IF;
--     IF p_mode IN ('money', 'weight') AND quantity_kg < v_p.min_quantity_kg THEN
--         warnings := array_append(warnings, 'below_minimum_quantity');
--     END IF;
--
--     RETURN NEXT;
-- END;
-- $$;
-- DROP FUNCTION public._lot_allocation(integer, integer);
-- DROP INDEX public.idx_purchase_lots_open_pieces;
-- ALTER TABLE public.purchase_lots
--     DROP CONSTRAINT purchase_lots_piece_lot_complete,
--     DROP CONSTRAINT purchase_lots_pieces_left_non_negative,
--     DROP CONSTRAINT purchase_lots_piece_weight_positive,
--     DROP COLUMN price_per_kg,
--     DROP COLUMN source_lot_id,
--     DROP COLUMN pieces_left,
--     DROP COLUMN piece_weight_kg;
