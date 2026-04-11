# Supabase Schema - Carnicería El Señor de la Misericordia

## Resumen Ejecutivo

Schema Supabase para Carni-mvp. Se gestiona 100% con Supabase CLI migrations:

```bash
supabase/migrations/
├── 202604100001_initial_schema.sql   # Tablas, índices, triggers
├── 202604100002_rls_policies.sql     # Row Level Security
└── 202604100003_functions.sql        # RPCs, auth trigger, protection trigger
```

**NO usar Dashboard SQL Editor**. Correr `supabase db reset` para aplicar todo.

---

## Tablas (7)

| Tabla         | PK              | Descripción                                                                              |
| ------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `profiles`    | UUID (auth.uid) | Perfil: full_name, phone, address (JSONB), role, points                                  |
| `categories`  | SERIAL          | Categorías: name, slug, image_url, is_active, order                                      |
| `products`    | SERIAL          | Productos: category_id (FK), price_per_kg, price_per_lb, stock, is_active, metadata      |
| `orders`      | UUID            | Pedidos: user_id (FK), total, status (6 estados), delivery_type, delivery_address, notes |
| `order_items` | SERIAL          | Líneas: order_id (FK), product_id (FK), quantity_kg, unit_price, subtotal                |
| `favorites`   | Composite       | user_id + product_id (PKs compuestas)                                                    |
| `promotions`  | SERIAL          | Códigos: code (unique), discount_percent, min_purchase, valid_from/until                 |

---

## RLS Policies

| Tabla       | Público         | Owner                                  | Admin              |
| ----------- | --------------- | -------------------------------------- | ------------------ |
| profiles    | —               | SELECT, INSERT, UPDATE own             | SELECT, UPDATE all |
| categories  | SELECT (active) | —                                      | ALL                |
| products    | SELECT (active) | —                                      | ALL                |
| orders      | —               | SELECT, INSERT own; UPDATE own pending | SELECT, UPDATE all |
| order_items | —               | SELECT, INSERT via own order           | SELECT all         |
| favorites   | —               | SELECT, INSERT, DELETE own             | —                  |
| promotions  | SELECT (active) | —                                      | ALL                |

Helper functions: `get_user_role()`, `is_admin()`

---

## RPC Functions (8)

| Función                                                         | Acceso | Descripción                             |
| --------------------------------------------------------------- | ------ | --------------------------------------- |
| `create_order_with_items(delivery_type, address, notes, items)` | auth   | Crea pedido + items en transacción      |
| `cancel_order(order_id)`                                        | auth   | Cancela pedido propio en status pending |
| `apply_promotion(code, subtotal)`                               | auth   | Calcula descuento de código válido      |
| `add_points(user_id, points)`                                   | admin  | Suma puntos a perfil                    |
| `update_order_status(order_id, status)`                         | admin  | Cambia status de pedido                 |
| `get_user_favorites()`                                          | auth   | Lista favoritos con datos de producto   |
| `add_to_favorites(product_id)`                                  | auth   | Agrega favorito (idempotente)           |
| `remove_from_favorites(product_id)`                             | auth   | Elimina favorito                        |

---

## Triggers

| Trigger                         | Tabla            | Descripción                                     |
| ------------------------------- | ---------------- | ----------------------------------------------- |
| `on_auth_user_created`          | auth.users       | Crea profile con role='customer' al registrarse |
| `protect_profile_system_fields` | profiles         | Impide que customers cambien role/points        |
| `update_updated_at_column`      | orders, profiles | Auto-actualiza timestamp                        |

---

## Queries correctas para Frontend

```javascript
// Productos activos con categoría
const { data } = await supabase
  .from("products")
  .select("*, categories(name, slug)")
  .eq("is_active", true)
  .order("name");

// Crear pedido (usa RPC transaccional)
const { data: orderId } = await supabase.rpc("create_order_with_items", {
  p_delivery_type: "pickup",
  p_delivery_address: null,
  p_notes: "Sin cebolla",
  p_items: [
    { product_id: 1, quantity_kg: 2.5, unit_price: 289.0 },
    { product_id: 4, quantity_kg: 1.0, unit_price: 279.0 },
  ],
});

// Pedidos del usuario
const { data } = await supabase
  .from("orders")
  .select("*, order_items(*)")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });

// Perfil
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();
```

---

## Seed Data

5 categorías + 14 productos reales en `supabase/seed.sql`:

| Categoría         | Productos                                       | Rango Precio |
| ----------------- | ----------------------------------------------- | ------------ |
| Carnes Rojas      | Arrachera, Ribeye, T-Bone, Short Rib, Diezmillo | $169-$399/kg |
| Cerdo             | Bisteck, Molida                                 | $130-$135/kg |
| Pollo             | Entero, Pechuga                                 | $85-$120/kg  |
| Embutidos         | Chorizo, Longaniza                              | $160-$180/kg |
| Cortes Especiales | Tomahawk, Picaña                                | $350-$520/kg |

---

## Setup

```bash
supabase start              # Levanta instancia local
supabase db reset           # Aplica migrations + seed
supabase status             # Muestra URLs y keys
```

---

**Última actualización**: Abril 2026
**Fuente de verdad**: `supabase/migrations/` (NO este documento)
