-- Migration: 003_functions.sql
-- Description: RPC functions for Carni-mvp
-- Created: 2026-04-10

-- ============================================
-- Auth trigger: create profile for new auth users
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role, points)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
            split_part(COALESCE(NEW.email, ''), '@', 1)
        ),
        NULLIF(NEW.raw_user_meta_data->>'phone', ''),
        'customer',
        0
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name, phone, role, points)
SELECT
    users.id,
    COALESCE(
        NULLIF(users.raw_user_meta_data->>'full_name', ''),
        split_part(COALESCE(users.email, ''), '@', 1)
    ),
    NULLIF(users.raw_user_meta_data->>'phone', ''),
    'customer',
    0
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Trigger: prevent customers from changing role/points directly
-- ============================================
CREATE OR REPLACE FUNCTION public.protect_profile_system_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NULL OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    ) THEN
        RETURN NEW;
    END IF;

    NEW.role := OLD.role;
    NEW.points := OLD.points;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_system_fields ON public.profiles;
CREATE TRIGGER protect_profile_system_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_system_fields();

-- ============================================
-- RPC: apply_promotion
-- Apply a promotion code and calculate discount
-- ============================================
CREATE OR REPLACE FUNCTION apply_promotion(
    p_code TEXT,
    p_subtotal DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_discount DECIMAL(10,2) := 0;
    v_promotion RECORD;
BEGIN
    -- Find valid promotion
    SELECT * INTO v_promotion
    FROM promotions
    WHERE code = p_code
      AND is_active = true
      AND valid_from <= CURRENT_DATE
      AND valid_until >= CURRENT_DATE;
    
    -- If no promotion found, return 0
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Check minimum purchase
    IF p_subtotal < v_promotion.min_purchase THEN
        RETURN 0;
    END IF;
    
    -- Calculate discount
    v_discount := (p_subtotal * v_promotion.discount_percent) / 100;
    
    RETURN v_discount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- RPC: add_points
-- Add points to user profile (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION add_points(
    p_user_id UUID,
    p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can add points';
    END IF;
    
    -- Validate points
    IF p_points <= 0 THEN
        RAISE EXCEPTION 'Points must be positive';
    END IF;
    
    -- Add points to user
    UPDATE profiles
    SET points = points + p_points,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: update_order_status
-- Update order status (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_status TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update order status';
    END IF;
    
    -- Validate status
    IF p_status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;
    
    -- Update order status
    UPDATE orders
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Check if order exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: get_user_favorites
-- Get all favorites for current user
-- ============================================
CREATE OR REPLACE FUNCTION get_user_favorites()
RETURNS TABLE (
    product_id INTEGER,
    product_name TEXT,
    product_price DECIMAL(10,2),
    product_image TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.product_id,
        p.name,
        p.price_per_kg,
        p.image_url,
        f.created_at
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: add_to_favorites
-- Add product to favorites
-- ============================================
CREATE OR REPLACE FUNCTION add_to_favorites(
    p_product_id INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO favorites (user_id, product_id)
    VALUES (auth.uid(), p_product_id)
    ON CONFLICT (user_id, product_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: remove_from_favorites
-- Remove product from favorites
-- ============================================
CREATE OR REPLACE FUNCTION remove_from_favorites(
    p_product_id INTEGER
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM favorites
    WHERE user_id = auth.uid()
      AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: create_order_with_items
-- Create order with items in single transaction
-- ============================================
CREATE OR REPLACE FUNCTION create_order_with_items(
    p_delivery_type TEXT,
    p_delivery_address JSONB,
    p_notes TEXT,
    p_items JSONB  -- Array of {product_id, quantity_kg, unit_price}
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_subtotal DECIMAL(10,2) := 0;
    v_line_total DECIMAL(10,2);
BEGIN
    -- Validate delivery type
    IF p_delivery_type NOT IN ('pickup', 'delivery') THEN
        RAISE EXCEPTION 'Invalid delivery type';
    END IF;
    
    -- Calculate total and validate items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_line_total := (v_item->>'quantity_kg')::DECIMAL(10,3) * (v_item->>'unit_price')::DECIMAL(10,2);
        v_subtotal := v_subtotal + v_line_total;
    END LOOP;
    
    -- Create order
    INSERT INTO orders (user_id, total, delivery_type, delivery_address, notes)
    VALUES (auth.uid(), v_subtotal, p_delivery_type, p_delivery_address, p_notes)
    RETURNING id INTO v_order_id;
    
    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_line_total := (v_item->>'quantity_kg')::DECIMAL(10,3) * (v_item->>'unit_price')::DECIMAL(10,2);
        
        INSERT INTO order_items (order_id, product_id, quantity_kg, unit_price, subtotal)
        VALUES (
            v_order_id,
            (v_item->>'product_id')::INTEGER,
            (v_item->>'quantity_kg')::DECIMAL(10,3),
            (v_item->>'unit_price')::DECIMAL(10,2),
            v_line_total
        );
    END LOOP;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: cancel_order
-- Cancel own pending order
-- ============================================
CREATE OR REPLACE FUNCTION cancel_order(
    p_order_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Can only cancel own pending orders
    UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id
      AND user_id = auth.uid()
      AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot cancel order. It may not exist or status is not pending.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant execute permissions to authenticated role
-- ============================================
GRANT EXECUTE ON FUNCTION apply_promotion(TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION add_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_favorites() TO authenticated;
GRANT EXECUTE ON FUNCTION add_to_favorites(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_favorites(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_items(TEXT, JSONB, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_order(UUID) TO authenticated;