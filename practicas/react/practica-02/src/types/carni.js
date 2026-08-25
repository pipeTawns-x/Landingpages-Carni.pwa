// Domain types for Carni-mvp — used by Practice 02
// These match the real Supabase schema in src/types/database.ts

export const ORDER_STATUS = {
  RECEIVED: 'received',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
};

// Seed products from supabase/seed.sql (real product_ids 1-14)
export const SEED_PRODUCTS = [
  { id: 1, nombre: 'Rib Eye Premium', precio_kg: 550, stock: 12, categoria: 'Res', estado: 'active' },
  { id: 2, nombre: 'Picaña', precio_kg: 320, stock: 8, categoria: 'Res', estado: 'active' },
  { id: 3, nombre: 'Arrachera Marinada', precio_kg: 280, stock: 5, categoria: 'Res', estado: 'low_stock' },
  { id: 4, nombre: 'Costilla de Res', precio_kg: 190, stock: 20, categoria: 'Res', estado: 'active' },
  { id: 5, nombre: 'Filete de Res', precio_kg: 480, stock: 7, categoria: 'Res', estado: 'active' },
  { id: 6, nombre: 'Pechuga de Pollo', precio_kg: 95, stock: 30, categoria: 'Pollo', estado: 'active' },
  { id: 7, nombre: 'Pierna con Muslo', precio_kg: 75, stock: 25, categoria: 'Pollo', estado: 'active' },
  { id: 8, nombre: 'Pollo Entero', precio_kg: 65, stock: 15, categoria: 'Pollo', estado: 'active' },
  { id: 9, nombre: 'Lomo de Cerdo', precio_kg: 165, stock: 18, categoria: 'Cerdo', estado: 'active' },
  { id: 10, nombre: 'Costilla de Cerdo', precio_kg: 140, stock: 12, categoria: 'Cerdo', estado: 'active' },
  { id: 11, nombre: 'Chorizo Artesanal', precio_kg: 210, stock: 9, categoria: 'Embutidos', estado: 'active' },
  { id: 12, nombre: 'Salchicha Premium', precio_kg: 180, stock: 6, categoria: 'Embutidos', estado: 'low_stock' },
  { id: 13, nombre: 'Milanesa de Res', precio_kg: 240, stock: 14, categoria: 'Res', estado: 'active' },
  { id: 14, nombre: 'Molida 80/20', precio_kg: 155, stock: 22, categoria: 'Res', estado: 'active' },
];
