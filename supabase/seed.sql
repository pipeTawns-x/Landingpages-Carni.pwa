-- =============================================================================
-- Seed Data — Carnicería El Señor de La Misericordia
-- Categorías + Productos reales con precios actuales
-- =============================================================================

-- Categorías
INSERT INTO categories (name, slug, image_url, is_active, "order") VALUES
  ('Carnes Rojas',    'carnes-rojas',    '/img/products/arrachera.webp',      true, 1),
  ('Cerdo',           'cerdo',           '/img/products/bisteck-cerdo.webp',  true, 2),
  ('Pollo',           'pollo',           '/img/products/pollo-entero.webp',   true, 3),
  ('Embutidos',       'embutidos',       '/img/products/chorizo.webp',        true, 4),
  ('Cortes Especiales','cortes-especiales','/img/products/ribeye.webp',       true, 5);

-- Productos — Carnes Rojas (category_id = 1)
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (1, 'Arrachera',       'Corte premium para asar, suave y jugoso',      289.00, 131.09, '/img/products/arrachera.webp',       50, true),
  (1, 'Ribeye',          'Corte grueso con marmoleo perfecto',           399.00, 181.00, '/img/products/ribeye.webp',           30, true),
  (1, 'T-Bone',          'Corte doble con filete y New York',            349.00, 158.30, '/img/products/t-bone.webp',           25, true),
  (1, 'Short Rib',       'Costilla corta ideal para BBQ y ahumado',      279.00, 126.55, '/img/products/short-rib.webp',        40, true),
  (1, 'Diezmillo',       'Corte económico para guisos y bisteces',       169.00,  76.66, '/img/products/diezmillo.webp',        60, true);

-- Productos — Cerdo (category_id = 2)
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (2, 'Bisteck de Cerdo','Láminas delgadas perfectas para freír',        130.00,  58.97, '/img/products/bisteck-cerdo.webp',    45, true),
  (2, 'Molida de Cerdo', 'Carne molida fresca para hamburguesas',        135.00,  61.24, '/img/products/molida-cerdo.webp',     40, true);

-- Productos — Pollo (category_id = 3)
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (3, 'Pollo Entero',    'Pollo fresco entero listo para preparar',       85.00,  38.56, '/img/products/pollo-entero.webp',     70, true),
  (3, 'Pechuga de Pollo','Pechuga sin hueso ni piel',                    120.00,  54.43, '/img/products/pechuga-pollo.webp',    55, true);

-- Productos — Embutidos (category_id = 4)
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (4, 'Chorizo',         'Chorizo artesanal estilo San Luis',            180.00,  81.65, '/img/products/chorizo.webp',          50, true),
  (4, 'Longaniza',       'Longaniza casera con especias tradicionales',  160.00,  72.57, '/img/products/longaniza.webp',        45, true);

-- Productos — Cortes Especiales (category_id = 5)
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (5, 'Tomahawk',        'Ribeye con hueso largo, presentación espectacular', 520.00, 235.87, '/img/products/tomahawk.webp',   15, true),
  (5, 'Picaña',          'Corte brasileño con capa de grasa perfecta',       350.00, 158.76, '/img/products/picana.webp',      20, true);
