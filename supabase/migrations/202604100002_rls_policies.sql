-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for Carni-mvp
-- Created: 2026-04-10

-- ============================================
-- Step 1: Enable RLS on all tables
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES Policies
-- ============================================

-- Anyone can read own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile if needed
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update own profile. Protected fields are enforced by trigger logic.
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_admin_read_all" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update any profile (including role and points)
CREATE POLICY "profiles_admin_update_all" ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- CATEGORIES Policies
-- ============================================

-- Anyone can read active categories
CREATE POLICY "categories_select_public" ON categories
    FOR SELECT
    USING (is_active = true);

-- Only admins can modify categories
CREATE POLICY "categories_admin_only" ON categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCTS Policies
-- ============================================

-- Anyone can read active products
CREATE POLICY "products_select_public" ON products
    FOR SELECT
    USING (is_active = true);

-- Only admins can modify products
CREATE POLICY "products_admin_only" ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- ORDERS Policies
-- ============================================

-- Users can read their own orders
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own orders only if pending
CREATE POLICY "orders_update_own" ON orders
    FOR UPDATE
    USING (
        user_id = auth.uid() 
        AND status = 'pending'
    )
    WITH CHECK (user_id = auth.uid());

-- Admins can read all orders
CREATE POLICY "orders_admin_read_all" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update any order status
CREATE POLICY "orders_admin_update_status" ON orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- ORDER_ITEMS Policies
-- ============================================

-- Users can read their own order items
CREATE POLICY "order_items_select_own" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Auto-insert: allow insert via order creation
CREATE POLICY "order_items_insert_order" ON order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Admins can read all order items
CREATE POLICY "order_items_admin_read_all" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- FAVORITES Policies
-- ============================================

-- Users can read their own favorites
CREATE POLICY "favorites_select_own" ON favorites
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own favorites
CREATE POLICY "favorites_insert_own" ON favorites
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own favorites
CREATE POLICY "favorites_delete_own" ON favorites
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- PROMOTIONS Policies
-- ============================================

-- Anyone can read active promotions (for applying codes)
CREATE POLICY "promotions_select_active" ON promotions
    FOR SELECT
    USING (is_active = true);

-- Only admins can modify promotions
CREATE POLICY "promotions_admin_only" ON promotions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- Audit: Create function to get current user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role::TEXT
    FROM profiles
    WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
$$ LANGUAGE SQL STABLE;