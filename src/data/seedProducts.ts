import type { Product } from '@src/types/database';

/**
 * The 33 products from supabase/seed.sql, transcribed verbatim.
 *
 * Prices, stock, descriptions and image paths are copied from the seed and must
 * stay in sync with it — do not edit values here, edit the seed and mirror it.
 *
 * Ids follow the seed's insertion order because the products table uses a serial
 * primary key and the seed defines no explicit ids.
 *
 * This exists so the catalogue renders when the Supabase instance is not
 * reachable. It is a display fallback only: nothing writes back through it.
 */
export const SEED_PRODUCTS: Product[] = [
  { id: 1, name: 'Arrachera', description: 'Corte premium para asar, suave y jugoso', price_per_kg: 289.0, price_per_lb: 131.09, image_url: '/img/products/skirt_steak.webp', stock: 50, is_active: true, category_id: 1, categories: { name: 'Carnes Rojas', slug: 'carnes-rojas' } },
  { id: 2, name: 'Ribeye', description: 'Corte grueso con marmoleo perfecto', price_per_kg: 399.0, price_per_lb: 181.0, image_url: '/img/products/rib-eye.webp', stock: 30, is_active: true, category_id: 1, categories: { name: 'Carnes Rojas', slug: 'carnes-rojas' } },
  { id: 3, name: 'T-Bone', description: 'Corte doble con filete y New York', price_per_kg: 349.0, price_per_lb: 158.3, image_url: '/img/products/porterhouse.webp', stock: 25, is_active: true, category_id: 1, categories: { name: 'Carnes Rojas', slug: 'carnes-rojas' } },
  { id: 4, name: 'Short Rib', description: 'Costilla corta ideal para BBQ y ahumado', price_per_kg: 279.0, price_per_lb: 126.55, image_url: '/img/products/res.webp', stock: 40, is_active: true, category_id: 1, categories: { name: 'Carnes Rojas', slug: 'carnes-rojas' } },
  { id: 5, name: 'Diezmillo', description: 'Corte económico para guisos y bisteces', price_per_kg: 169.0, price_per_lb: 76.66, image_url: '/img/products/flak_steak.webp', stock: 60, is_active: true, category_id: 1, categories: { name: 'Carnes Rojas', slug: 'carnes-rojas' } },
  { id: 6, name: 'Bisteck de Cerdo', description: 'Láminas delgadas perfectas para freír', price_per_kg: 130.0, price_per_lb: 58.97, image_url: '/img/products/cerdo.webp', stock: 45, is_active: true, category_id: 2, categories: { name: 'Cerdo', slug: 'cerdo' } },
  { id: 7, name: 'Molida de Cerdo', description: 'Carne molida fresca para hamburguesas', price_per_kg: 135.0, price_per_lb: 61.24, image_url: '/img/products/cerdo.webp', stock: 40, is_active: true, category_id: 2, categories: { name: 'Cerdo', slug: 'cerdo' } },
  { id: 8, name: 'Pollo Entero', description: 'Pollo fresco entero listo para preparar', price_per_kg: 85.0, price_per_lb: 38.56, image_url: '/img/products/pollo.webp', stock: 70, is_active: true, category_id: 3, categories: { name: 'Pollo', slug: 'pollo' } },
  { id: 9, name: 'Pechuga de Pollo', description: 'Pechuga sin hueso ni piel', price_per_kg: 120.0, price_per_lb: 54.43, image_url: '/img/products/pollo.webp', stock: 55, is_active: true, category_id: 3, categories: { name: 'Pollo', slug: 'pollo' } },
  { id: 10, name: 'Chorizo', description: 'Chorizo artesanal estilo San Luis', price_per_kg: 180.0, price_per_lb: 81.65, image_url: '/img/products/embutidos.webp', stock: 50, is_active: true, category_id: 4, categories: { name: 'Embutidos', slug: 'embutidos' } },
  { id: 11, name: 'Longaniza', description: 'Longaniza casera con especias tradicionales', price_per_kg: 160.0, price_per_lb: 72.57, image_url: '/img/products/embutidos.webp', stock: 45, is_active: true, category_id: 4, categories: { name: 'Embutidos', slug: 'embutidos' } },
  { id: 12, name: 'Tomahawk', description: 'Ribeye con hueso largo, presentación espectacular', price_per_kg: 520.0, price_per_lb: 235.87, image_url: '/img/products/tomahawk.webp', stock: 15, is_active: true, category_id: 5, categories: { name: 'Cortes Especiales', slug: 'cortes-especiales' } },
  { id: 13, name: 'Picaña', description: 'Corte brasileño con capa de grasa perfecta', price_per_kg: 350.0, price_per_lb: 158.76, image_url: '/img/products/top_sirloin.webp', stock: 20, is_active: true, category_id: 5, categories: { name: 'Cortes Especiales', slug: 'cortes-especiales' } },

  // Preparadas — migrated from the vanilla catalogue. Prices copied verbatim.
  { id: 14, name: 'Arrachera Marinada de Res', description: 'Arrachera marinada en casa, lista para la parrilla', price_per_kg: 280.0, price_per_lb: 127.0, image_url: '/img/products/preparadas.webp', stock: 30, is_active: true, category_id: 6, categories: { name: 'Preparadas', slug: 'preparadas' } },
  { id: 15, name: 'Carne de Pastor', description: 'Carne adobada al estilo pastor, lista para el trompo', price_per_kg: 220.0, price_per_lb: 99.79, image_url: '/img/products/preparadas.webp', stock: 35, is_active: true, category_id: 6, categories: { name: 'Preparadas', slug: 'preparadas' } },
  { id: 16, name: 'Preparado de Alambre', description: 'Mezcla lista para alambre con verduras y tocino', price_per_kg: 240.0, price_per_lb: 108.86, image_url: '/img/products/preparadas.webp', stock: 25, is_active: true, category_id: 6, categories: { name: 'Preparadas', slug: 'preparadas' } },
  { id: 17, name: 'Alitas Adobadas', description: 'Alitas de pollo en adobo de la casa', price_per_kg: 180.0, price_per_lb: 81.65, image_url: '/img/products/preparadas.webp', stock: 40, is_active: true, category_id: 6, categories: { name: 'Preparadas', slug: 'preparadas' } },
  { id: 18, name: 'Filete de Pollo Empanizado', description: 'Filete de pollo empanizado listo para freír', price_per_kg: 160.0, price_per_lb: 72.57, image_url: '/img/products/preparadas.webp', stock: 40, is_active: true, category_id: 6, categories: { name: 'Preparadas', slug: 'preparadas' } },
  { id: 19, name: 'Milaneza Empanizada', description: 'Milanesa empanizada lista para cocinar', price_per_kg: 200.0, price_per_lb: 90.72, image_url: '/img/products/preparadas.webp', stock: 35, is_active: true, category_id: 6, categories: { name: 'Preparadas', slug: 'preparadas' } },
  { id: 20, name: 'Milaneza Premium (100% res)', description: 'Milanesa de res pura, empanizado artesanal', price_per_kg: 320.0, price_per_lb: 145.15, image_url: '/img/products/preparadas.webp', stock: 20, is_active: true, category_id: 6, categories: { name: 'Preparadas', slug: 'preparadas' } },

  // Otros Productos
  { id: 21, name: 'Huevo de Campo', description: 'Huevo fresco de rancho, sin jaula', price_per_kg: 80.0, price_per_lb: 36.29, image_url: '/img/products/otrosproductos.webp', stock: 60, is_active: true, category_id: 7, categories: { name: 'Otros Productos', slug: 'otros' } },
  { id: 22, name: 'Queso Fresco', description: 'Queso fresco del día, elaboración regional', price_per_kg: 120.0, price_per_lb: 54.43, image_url: '/img/products/otrosproductos.webp', stock: 40, is_active: true, category_id: 7, categories: { name: 'Otros Productos', slug: 'otros' } },
  { id: 23, name: 'Chorizo Verde', description: 'Chorizo verde estilo potosino con especias', price_per_kg: 140.0, price_per_lb: 63.5, image_url: '/img/products/otrosproductos.webp', stock: 35, is_active: true, category_id: 7, categories: { name: 'Otros Productos', slug: 'otros' } },
  { id: 24, name: 'Manteca de Cerdo', description: 'Manteca de cerdo natural para cocinar', price_per_kg: 90.0, price_per_lb: 40.82, image_url: '/img/products/otrosproductos.webp', stock: 45, is_active: true, category_id: 7, categories: { name: 'Otros Productos', slug: 'otros' } },

  // Ofertas Especiales — the three bundles are sold per package, not per kilo.
  { id: 25, name: 'Paquete Familiar de Res', description: 'Surtido de cortes de res para toda la familia', price_per_kg: 1200.0, price_per_lb: null, image_url: '/img/products/premium.webp', stock: 15, is_active: true, category_id: 8, categories: { name: 'Ofertas Especiales', slug: 'ofertas' } },
  { id: 26, name: 'Paquete Parrilla Completo', description: 'Todo lo necesario para una parrillada completa', price_per_kg: 1500.0, price_per_lb: null, image_url: '/img/products/premium.webp', stock: 12, is_active: true, category_id: 8, categories: { name: 'Ofertas Especiales', slug: 'ofertas' } },
  { id: 27, name: 'Combo Premium', description: 'Selección de cortes premium en un solo paquete', price_per_kg: 2000.0, price_per_lb: null, image_url: '/img/products/premium.webp', stock: 10, is_active: true, category_id: 8, categories: { name: 'Ofertas Especiales', slug: 'ofertas' } },
  { id: 28, name: 'Promoción Martes (20% descuento)', description: 'Corte del día con 20% de descuento, solo martes', price_per_kg: 144.0, price_per_lb: 65.29, image_url: '/img/products/premium.webp', stock: 25, is_active: true, category_id: 8, categories: { name: 'Ofertas Especiales', slug: 'ofertas' } },

  // Merchandising — sold per piece, not per kilo.
  { id: 29, name: 'Gorra con Logo', description: 'Gorra bordada con el logo de la carnicería', price_per_kg: 250.0, price_per_lb: null, image_url: '/img/products/merch.webp', stock: 25, is_active: true, category_id: 9, categories: { name: 'Merchandising', slug: 'merch' } },
  { id: 30, name: 'Playera Básica', description: 'Playera de algodón con logo estampado', price_per_kg: 300.0, price_per_lb: null, image_url: '/img/products/merch.webp', stock: 30, is_active: true, category_id: 9, categories: { name: 'Merchandising', slug: 'merch' } },
  { id: 31, name: 'Playera Premium', description: 'Playera premium de algodón peinado', price_per_kg: 450.0, price_per_lb: null, image_url: '/img/products/merch.webp', stock: 20, is_active: true, category_id: 9, categories: { name: 'Merchandising', slug: 'merch' } },
  { id: 32, name: 'Delantal de Cocinero', description: 'Delantal de lona resistente para asador', price_per_kg: 350.0, price_per_lb: null, image_url: '/img/products/merch.webp', stock: 18, is_active: true, category_id: 9, categories: { name: 'Merchandising', slug: 'merch' } },
  { id: 33, name: 'Taza de Cerámica', description: 'Taza de cerámica con el logo de la casa', price_per_kg: 180.0, price_per_lb: null, image_url: '/img/products/merch.webp', stock: 35, is_active: true, category_id: 9, categories: { name: 'Merchandising', slug: 'merch' } }
];
