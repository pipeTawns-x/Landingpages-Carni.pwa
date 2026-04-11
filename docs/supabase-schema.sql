-- ============================================
-- SCHEMA COMPLETO SUPABASE - CARNICERÍA EL SEÑOR DE LA MISERICORDIA
-- ============================================

-- ============================================
-- 1. TABLAS BASE
-- ============================================

-- Tabla: profiles (extensión de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address JSONB DEFAULT '{}',
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: customers (legacy - mantengo para compatibilidad con frontend actual)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  newsletter BOOLEAN DEFAULT false,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: loyalty_program (legacy)
CREATE TABLE IF NOT EXISTS loyalty_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  qr_code TEXT UNIQUE,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_per_kg DECIMAL(10,2) NOT NULL,
  price_per_piece DECIMAL(10,2),
  image_url TEXT,
  stock INTEGER DEFAULT 100,
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'piece', 'pack')),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  delivery_type TEXT CHECK (delivery_type IN ('pickup', 'delivery')),
  delivery_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity_kg DECIMAL(6,2),
  quantity_pieces INTEGER,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Índices para loyalty_program
CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_program(user_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - PROFILES
-- ============================================

-- Anyone can view categories
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (is_active = true);

-- Users can view own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- POLÍTICAS RLS - PRODUCTS
-- ============================================

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Only admins can insert/update/delete products
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLÍTICAS RLS - CUSTOMERS
-- ============================================

-- Users can view own customer record
CREATE POLICY "Users can view own customer" ON customers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own customer record
CREATE POLICY "Users can insert own customer" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own customer record
CREATE POLICY "Users can update own customer" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - LOYALTY PROGRAM
-- ============================================

-- Users can view own loyalty record
CREATE POLICY "Users can view own loyalty" ON loyalty_program
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update own loyalty
CREATE POLICY "Users can update own loyalty" ON loyalty_program
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - ORDERS
-- ============================================

-- Users can view own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own order items
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Users can create orders (validated in application)
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update own order status (only pending)
CREATE POLICY "Users can update own pending orders" ON orders
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'pending'
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all orders
CREATE POLICY "Admins can manage orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert orders
CREATE POLICY "Admins can create orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLÍTICAS RLS - ORDER ITEMS
-- ============================================

-- Admins can manage all order items
CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      JOIN profiles ON orders.user_id = profiles.id
      WHERE orders.id = order_items.order_id 
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. FUNCIONES Y TRIGGERS
-- ============================================

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Insert into customers (legacy compatibility)
  INSERT INTO public.customers (user_id, name, email, phone, newsletter)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'newsletter')::boolean, false)
  );
  
  -- Insert into loyalty_program
  INSERT INTO public.loyalty_program (user_id, points, qr_code)
  VALUES (
    NEW.id,
    0,
    NEW.id::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar timestamp automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at automático
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_loyalty_updated_at
  BEFORE UPDATE ON loyalty_program
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. FUNCIÓN PARA DASHBOARD
-- ============================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  total_sales DECIMAL;
  total_orders INTEGER;
  total_customers INTEGER;
  total_points INTEGER;
  pending_orders INTEGER;
  revenue_today DECIMAL;
  top_products JSON;
BEGIN
  -- Ventas totales
  SELECT COALESCE(SUM(total), 0) INTO total_sales
  FROM orders WHERE status != 'cancelled';
  
  -- Total de pedidos
  SELECT COUNT(*) INTO total_orders FROM orders;
  
  -- Total de clientes
  SELECT COUNT(DISTINCT user_id) INTO total_customers
  FROM orders WHERE user_id IS NOT NULL;
  
  -- Total de puntos
  SELECT COALESCE(SUM(points), 0) INTO total_points FROM profiles;
  
  -- Pedidos pendientes
  SELECT COUNT(*) INTO pending_orders FROM orders WHERE status = 'pending';
  
  -- Ventas de hoy
  SELECT COALESCE(SUM(total), 0) INTO revenue_today
  FROM orders 
  WHERE created_at::date = CURRENT_DATE 
  AND status != 'cancelled';
  
  -- Top 5 productos
  SELECT json_agg(
    json_build_object(
      'name', product_name,
      'quantity', SUM(quantity_kg)
    )
  ) INTO top_products
  FROM order_items
  GROUP BY product_name
  ORDER BY SUM(quantity_kg) DESC
  LIMIT 5;
  
  RETURN json_build_object(
    'total_sales', total_sales,
    'total_orders', total_orders,
    'total_customers', total_customers,
    'total_points', total_points,
    'pending_orders', pending_orders,
    'revenue_today', revenue_today,
    'top_products', COALESCE(top_products, '[]')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. SEED DATA - CATEGORÍAS
-- ============================================

INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES
('Res', 'res', 'Cortes de res premium', 1, true),
('Cerdo', 'cerdo', 'Cortes de cerdo fresco', 2, true),
('Pollo', 'pollo', 'Pollo fresco de primera', 3, true),
('Embutidos', 'embutidos', 'Chorizo,Longaniza y más', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 7. SEED DATA - PRODUCTOS REALES
-- ============================================

-- RES
INSERT INTO products (category_id, name, description, price_per_kg, image_url, stock, is_active, is_featured) VALUES
((SELECT id FROM categories WHERE slug = 'res'), 'Arrachera', 'Corte premium ideal para asar', 289.00, '/img/products/res.png', 100, true, true),
((SELECT id FROM categories WHERE slug = 'res'), 'Ribeye', 'Corte marmoleado, muy tierno', 399.00, '/img/products/rib-eye.png', 80, true, true),
((SELECT id FROM categories WHERE slug = 'res'), 'T-Bone', 'Combina filete y New York', 349.00, '/img/products/porterhouse.png', 60, true, false),
((SELECT id FROM categories WHERE slug = 'res'), 'Short Rib', 'Costilla corta, perfecto para guisos', 279.00, '/img/products/bravette_steak.png', 70, true, false),
((SELECT id FROM categories WHERE slug = 'res'), 'Filet Mignon', 'El corte más tierno', 450.00, '/img/products/filet_mignon.png', 40, true, false),
((SELECT id FROM categories WHERE slug = 'res'), 'New York Strip', 'Corte magro y flavorful', 329.00, '/img/products/ney_york_steak.png', 50, true, false),
((SELECT id FROM categories WHERE slug = 'res'), 'Tomahawk', 'Rib eye con hueso largo', 489.00, '/img/products/tomahawk.png', 30, true, false),
((SELECT id FROM categories WHERE slug = 'res'), 'Top Sirloin', 'Corte versátil y económico', 259.00, '/img/products/top_sirloin.png', 90, true, false);

-- CERDO
INSERT INTO products (category_id, name, description, price_per_kg, image_url, stock, is_active) VALUES
((SELECT id FROM categories WHERE slug = 'cerdo'), 'Bisteck Cerdo', 'Corte popular para freír', 130.00, '/img/products/cerdo.png', 100, true),
((SELECT id FROM categories WHERE slug = 'cerdo'), 'Molida Cerdo', 'Ideal para hamburguesas y embutidos', 135.00, '/img/products/cerdo.png', 120, true),
((SELECT id FROM categories WHERE slug = 'cerdo'), 'Chuleta', 'Con hueso, perfecta para asar', 145.00, '/img/products/cerdo.png', 80, true),
((SELECT id FROM categories WHERE slug = 'cerdo'), 'Espaldilla', 'Para coeffto y slow cook', 125.00, '/img/products/cerdo.png', 70, true);

-- POLLO
INSERT INTO products (category_id, name, description, price_per_kg, image_url, stock, is_active) VALUES
((SELECT id FROM categories WHERE slug = 'pollo'), 'Pollo Entero', 'Fresco de calidad', 85.00, '/img/products/pollo.png', 150, true),
((SELECT id FROM categories WHERE slug = 'pollo'), 'Pechuga', 'Sin hueso ni piel', 115.00, '/img/products/pollo.png', 100, true),
((SELECT id FROM categories WHERE slug = 'pollo'), 'Muslo', 'Con piel y hueso', 95.00, '/img/products/pollo.png', 80, true),
((SELECT id FROM categories WHERE slug = 'pollo'), 'Alas', 'Para freír o BBQ', 90.00, '/img/products/pollo.png', 90, true);

-- EMBUTIDOS
INSERT INTO products (category_id, name, description, price_per_kg, image_url, stock, is_active, is_featured) VALUES
((SELECT id FROM categories WHERE slug = 'embutidos'), 'Chorizo', 'Auténtico chorizo casero', 180.00, '/img/products/embutidos.png', 60, true, true),
((SELECT id FROM categories WHERE slug = 'embutidos'), 'Longaniza', 'Fresca y sabrosa', 175.00, '/img/products/embutidos.png', 50, true, false),
((SELECT id FROM categories WHERE slug = 'embutidos'), 'Jamón', 'De pavo premium', 195.00, '/img/products/embutidos.png', 40, true, false),
((SELECT id FROM categories WHERE slug = 'embutidos'), 'Tocino', 'Ahumado tradicional', 210.00, '/img/products/embutidos.png', 35, true, false);

-- ============================================
-- 8. VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon
SELECT 'profiles' as table_name, count(*) as rows FROM profiles
UNION ALL
SELECT 'customers', count(*) FROM customers
UNION ALL
SELECT 'loyalty_program', count(*) FROM loyalty_program
UNION ALL
SELECT 'categories', count(*) FROM categories
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'order_items', count(*) FROM order_items;