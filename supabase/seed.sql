-- =============================================================================
-- Seed Data — Carnicería El Señor de La Misericordia
-- Categorías + Productos reales con precios actuales
--
-- IMAGES: every image_url below resolves to a file that exists on disk.
-- The previous revision pointed at thirteen .webp files that were never in the
-- repository (arrachera.webp, ribeye.webp, t-bone.webp, …), so every product
-- image 404'd and the catalogue fell back to a single shared photo.
--
-- Prices and stock are unchanged. Products still waiting on a photo of their
-- own use their category's generic image; each one is listed in
-- img/products/PENDIENTES.md rather than hidden behind a lookalike.
-- =============================================================================

-- Categorías
INSERT INTO categories (name, slug, image_url, is_active, "order") VALUES
  ('Carnes Rojas',     'carnes-rojas',     '/img/products/res.webp',        true, 1),
  ('Cerdo',            'cerdo',            '/img/products/cerdo.webp',      true, 2),
  ('Pollo',            'pollo',            '/img/products/pollo.webp',      true, 3),
  ('Embutidos',        'embutidos',        '/img/products/embutidos.webp',  true, 4),
  ('Cortes Especiales','cortes-especiales','/img/products/premium.webp',    true, 5),
  ('Preparadas',       'preparadas',       '/img/products/preparadas.webp', true, 6),
  ('Otros Productos',  'otros',            '/img/products/otrosproductos.webp', true, 7),
  ('Ofertas Especiales','ofertas',         '/img/products/premium.webp',    true, 8),
  ('Merchandising',    'merch',            '/img/products/merch.webp',      true, 9);

-- Productos — Carnes Rojas (category_id = 1)
-- skirt_steak, rib-eye and flak_steak are the actual cut in each photo.
-- porterhouse stands in for the T-Bone (same primal, near-identical on camera).
-- Short Rib has no matching cut photo and falls back to the category image.
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (1, 'Arrachera',       'Corte premium para asar, suave y jugoso',      289.00, 131.09, '/img/products/skirt_steak.webp',     50, true),
  (1, 'Ribeye',          'Corte grueso con marmoleo perfecto',           399.00, 181.00, '/img/products/rib-eye.webp',         30, true),
  (1, 'T-Bone',          'Corte doble con filete y New York',            349.00, 158.30, '/img/products/porterhouse.webp',     25, true),
  (1, 'Short Rib',       'Costilla corta ideal para BBQ y ahumado',      279.00, 126.55, '/img/products/res.webp',             40, true),
  (1, 'Diezmillo',       'Corte económico para guisos y bisteces',       169.00,  76.66, '/img/products/flak_steak.webp',      60, true);

-- Productos — Cerdo (category_id = 2)
-- Both are on the generic pork image until their own photos exist.
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (2, 'Bisteck de Cerdo','Láminas delgadas perfectas para freír',        130.00,  58.97, '/img/products/cerdo.webp',           45, true),
  (2, 'Molida de Cerdo', 'Carne molida fresca para hamburguesas',        135.00,  61.24, '/img/products/cerdo.webp',           40, true);

-- Productos — Pollo (category_id = 3)
-- Both are on the generic poultry image until their own photos exist.
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (3, 'Pollo Entero',    'Pollo fresco entero listo para preparar',       85.00,  38.56, '/img/products/pollo.webp',           70, true),
  (3, 'Pechuga de Pollo','Pechuga sin hueso ni piel',                    120.00,  54.43, '/img/products/pollo.webp',           55, true);

-- Productos — Embutidos (category_id = 4)
-- Both are on the generic charcuterie image until their own photos exist.
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (4, 'Chorizo',         'Chorizo artesanal estilo San Luis',            180.00,  81.65, '/img/products/embutidos.webp',       50, true),
  (4, 'Longaniza',       'Longaniza casera con especias tradicionales',  160.00,  72.57, '/img/products/embutidos.webp',       45, true);

-- Productos — Cortes Especiales (category_id = 5)
-- Both photos are the actual cut. Picaña is the top sirloin cap.
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (5, 'Tomahawk',        'Ribeye con hueso largo, presentación espectacular', 520.00, 235.87, '/img/products/tomahawk.webp',  15, true),
  (5, 'Picaña',          'Corte brasileño con capa de grasa perfecta',       350.00, 158.76, '/img/products/top_sirloin.webp', 20, true);

-- =============================================================================
-- Categorías migradas desde el catálogo vanilla (js/modules/utils/base_dinamica.js)
--
-- PRECIOS: copiados uno a uno del catálogo vanilla, sin modificar.
-- STOCK: el catálogo vanilla NO llevaba stock. Los valores de abajo son
--   PROVISIONALES y existen solo para que el producto aparezca (la consulta
--   filtra por stock > 0). Están listados en img/products/PENDIENTES.md
--   esperando las cantidades reales del dueño.
-- UNIDAD: merch se vende por pieza y ofertas por paquete, no por kilo. El
--   esquema solo tiene price_per_kg, así que el precio va ahí y la unidad se
--   deriva del slug de la categoría en el front (ver src/components/ProductCard).
--   price_per_lb queda NULL en esos casos porque no aplica.
-- FOTOS: ninguna de estas cuatro categorías tiene fotos por producto. Cada
--   producto usa la genérica de su categoría, como estaba en el vanilla, y
--   queda anotado en PENDIENTES.md. No se inventó ninguna imagen.
-- =============================================================================

-- Productos — Preparadas (category_id = 6)
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (6, 'Arrachera Marinada de Res',   'Arrachera marinada en casa, lista para la parrilla',    280.00, 127.00, '/img/products/preparadas.webp', 30, true),
  (6, 'Carne de Pastor',             'Carne adobada al estilo pastor, lista para el trompo',  220.00,  99.79, '/img/products/preparadas.webp', 35, true),
  (6, 'Preparado de Alambre',        'Mezcla lista para alambre con verduras y tocino',       240.00, 108.86, '/img/products/preparadas.webp', 25, true),
  (6, 'Alitas Adobadas',             'Alitas de pollo en adobo de la casa',                   180.00,  81.65, '/img/products/preparadas.webp', 40, true),
  (6, 'Filete de Pollo Empanizado',  'Filete de pollo empanizado listo para freír',           160.00,  72.57, '/img/products/preparadas.webp', 40, true),
  (6, 'Milaneza Empanizada',         'Milanesa empanizada lista para cocinar',                200.00,  90.72, '/img/products/preparadas.webp', 35, true),
  (6, 'Milaneza Premium (100% res)', 'Milanesa de res pura, empanizado artesanal',            320.00, 145.15, '/img/products/preparadas.webp', 20, true);

-- Productos — Otros Productos (category_id = 7)
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (7, 'Huevo de Campo',   'Huevo fresco de rancho, sin jaula',              80.00, 36.29, '/img/products/otrosproductos.webp', 60, true),
  (7, 'Queso Fresco',     'Queso fresco del día, elaboración regional',    120.00, 54.43, '/img/products/otrosproductos.webp', 40, true),
  (7, 'Chorizo Verde',    'Chorizo verde estilo potosino con especias',    140.00, 63.50, '/img/products/otrosproductos.webp', 35, true),
  (7, 'Manteca de Cerdo', 'Manteca de cerdo natural para cocinar',          90.00, 40.82, '/img/products/otrosproductos.webp', 45, true);

-- Productos — Ofertas Especiales (category_id = 8)
-- Los tres paquetes se venden por paquete completo, no por kilo.
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (8, 'Paquete Familiar de Res',           'Surtido de cortes de res para toda la familia',      1200.00, NULL,  '/img/products/premium.webp', 15, true),
  (8, 'Paquete Parrilla Completo',         'Todo lo necesario para una parrillada completa',     1500.00, NULL,  '/img/products/premium.webp', 12, true),
  (8, 'Combo Premium',                     'Selección de cortes premium en un solo paquete',     2000.00, NULL,  '/img/products/premium.webp', 10, true),
  (8, 'Promoción Martes (20% descuento)',  'Corte del día con 20% de descuento, solo martes',     144.00, 65.29, '/img/products/premium.webp', 25, true);

-- Productos — Merchandising (category_id = 9)
-- Todo el merchandising se vende por pieza, no por kilo.
INSERT INTO products (category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active) VALUES
  (9, 'Gorra con Logo',       'Gorra bordada con el logo de la carnicería',  250.00, NULL, '/img/products/merch.webp', 25, true),
  (9, 'Playera Básica',       'Playera de algodón con logo estampado',       300.00, NULL, '/img/products/merch.webp', 30, true),
  (9, 'Playera Premium',      'Playera premium de algodón peinado',          450.00, NULL, '/img/products/merch.webp', 20, true),
  (9, 'Delantal de Cocinero', 'Delantal de lona resistente para asador',     350.00, NULL, '/img/products/merch.webp', 18, true),
  (9, 'Taza de Cerámica',     'Taza de cerámica con el logo de la casa',     180.00, NULL, '/img/products/merch.webp', 35, true);
