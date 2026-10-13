# Flujos y pantallas — mapa para diseño (Carni-mvp)

Fecha: 2026-09-21. Fuentes: `docs/blueprints/`, `docs/design/spec-rediseno-v1.md` §5,
`supabase/migrations/*.sql`, engram `carni-mvp`. El schema manda sobre cualquier documento
cuando difieren.

Convención, igual que `spec-rediseno-v1.md`: **EXISTS** (tabla/función real, citada) o
**DESIGN-AHEAD** (se dibuja, pero no hay nada detrás — anotar en el frame qué falta).

---

## A. Cliente (usuario común)

### 1. Descubrimiento

| Pantalla | Qué ve / decide | Estados | Datos hoy |
|---|---|---|---|
| Landing `index.html` | Hero (video), bento de 9 categorías, destacados, testimonios, FAQ, ofertas | loading, imagen rota, sin scroll issues | `categories` EXISTS. Ofertas = fila de producto en categoría `ofertas`; no hay tabla de descuento — DESIGN-AHEAD (F2.6) |
| Buscador (overlay) | Pill centrado, tendencias, sugerencias en 2 columnas | vacío, escribiendo (resultados live), sin resultados | Lee `products`/`categories` EXISTS. Tendencias/recientes no tienen tabla — origen no confirmado |

### 2. Catálogo y producto

| Pantalla | Qué ve / decide | Estados | Datos hoy |
|---|---|---|---|
| Catálogo `products.html` | Grid filtrable por chips de categoría, tarjeta con precio por unidad correcta (`/kg`, `/pieza`, `/paquete`) | loading skeleton, vacío por categoría, error | `products`+`categories` EXISTS; filtro `?categoria=` ya funciona hoy |
| Detalle de producto | Selector **Por Peso / Por Precio / Por Pieza**, slider de grosor, galería, recomendaciones | stock disponible, al máximo (stepper "+" disabled), sin stock | `products.price_per_kg/price_per_lb/stock/min_quantity_kg` EXISTS. "Por Pieza" en carne: DESIGN-AHEAD, falta peso promedio por pieza (`order_items` solo guarda `quantity_kg`) |

### 3. Carrito (drawer lateral)

| Pantalla | Qué ve / decide | Estados | Datos hoy |
|---|---|---|---|
| Carrito | Línea con miniatura/modo/cantidad, subtotal, total, barra de progreso al mínimo de envío | vacío + CTA catálogo, con artículos, mínimo alcanzado (verde) | Mínimo real vive en `store_settings.min_order_delivery` ($150 default) / `min_order_pickup` ($0 default) EXISTS server-side; el frontend aún no lo lee — DESIGN-AHEAD (F1.10), nunca hardcodear $150 |

### 4. Checkout

| Pantalla | Qué ve / decide | Estados | Datos hoy |
|---|---|---|---|
| Checkout | Toggle Domicilio/Recoger, mensaje de mínimo, resumen, datos del cliente, dirección en modal, pago con tarjeta | validando, mínimo no alcanzado, error de tarjeta, cargando, éxito con número de pedido | `create_order_with_items()` ya valida precio contra `products` y el mínimo contra `store_settings` server-side — EXISTS y blindado. Pago con Stripe: **no existe** ninguna integración ni columna de pago en `orders` — DESIGN-AHEAD (F5.1). Número de pedido legible: `orders.id` es UUID — DESIGN-AHEAD. Propina / tip-out: no hay `tips_ledger` — DESIGN-AHEAD |

### 5. Seguimiento de pedido

| Pantalla | Qué ve / decide | Estados | Datos hoy |
|---|---|---|---|
| Estado del pedido | Línea de progreso: Pendiente → Confirmado → Preparando → Listo → Entregado, más Cancelado aparte | uno por cada uno de los 6 estados | `orders.status` CHECK limita exactamente a estos 6 valores EXISTS; cambia vía `update_order_status()` (admin-only) |

### 6. Perfil

> **Flag de alcance**: `spec-rediseno-v1.md` §9 lista "User profile (orders, addresses, favorites)"
> bajo **Backlog (not now)** — fuera de las fases 0–7 planeadas. Se documenta porque este brief lo
> pide; confirmar con Eduardo si entra en esta ronda o queda para después.

| Pantalla | Qué ve / decide | Estados | Datos hoy |
|---|---|---|---|
| Mis pedidos | Historial propio, filtro por estado | vacío, con historial | `orders` filtrado por `user_id` (RLS) EXISTS |
| Direcciones | El brief pide plural; hoy no hay lista | — | `profiles.address` es **un solo** JSONB; `orders.delivery_address` es una foto por pedido, no una libreta de direcciones — DESIGN-AHEAD |
| Favoritos | Grid de guardados, quitar | vacío, con favoritos | `favorites` + RPCs `get_user_favorites`/`add_to_favorites`/`remove_from_favorites` EXISTS |

### 7. Fidelización y afiliados

Todo lo numérico aquí es mock: el blueprint lo dice explícito ("números mock defendibles, no
decisiones tomadas", §8). Solo el contador crudo de puntos existe hoy.

| Pantalla | Qué ve / decide | Estados | Datos hoy |
|---|---|---|---|
| Mi nivel (Track Score) | Barra de progreso, nivel actual, beneficios | bloqueado (Principiante) / desbloqueado por nivel | Solo `profiles.points` (entero) + `add_points()` admin-only EXISTS. `nivel`, ventana móvil de 6 meses, `points_ledger`, `tier_settings`: nada existe — DESIGN-AHEAD |
| Mi link de afiliado | QR + link, contador de referidos | se libera solo al llegar a nivel Regular | `affiliates`, `referrals`, `profiles.referral_code` no existen — DESIGN-AHEAD |

---

## B. Admin

### 1. Catálogo e inventario (`admin-products.html`)

| Qué ve / decide | Estados | Datos hoy |
|---|---|---|
| Tabla con búsqueda/filtro; stock y oferta como **interruptor en la fila**; editar en tabs (Info, Imágenes, Precios, Oferta); borrar con confirmación (nunca DELETE real, usa `is_active`) | vacío, precio inválido (0 o vacío) inline, alerta de stock bajo | `products`+`categories` EXISTS. Tab "Oferta": no hay columna de descuento — DESIGN-AHEAD (F0.3/F2.6). `cost_per_kg` para margen: no existe — DESIGN-AHEAD (hallazgo principal de `dashboard-admin-referencia.md`, bloquea fidelización desde agosto). Umbral de stock bajo: no existe campo — DESIGN-AHEAD |

### 2. Precios y mínimos

| Qué ve / decide | Estados | Datos hoy |
|---|---|---|
| Precio por kg/lb por producto (en edición); panel de mínimos de pedido (delivery/pickup) | guardado con bitácora de quién/cuándo | `products.price_per_kg/price_per_lb` + `store_settings.min_order_delivery/pickup` EXISTS; bitácora ya existe vía `store_settings.updated_by/updated_at` (trigger) |

### 3. Pedidos (`admin-orders.html`)

| Qué ve / decide | Estados | Datos hoy |
|---|---|---|
| Board o tabla con los 6 estados como badges; cambiar estado en la fila; detalle con ticket imprimible | uno por estado, filtro por estado | `orders`+`order_items`+`update_order_status()` EXISTS. Kanban con drag-and-drop y Supabase Realtime: "planned module, not yet built" (`module-scopes.md`) — DESIGN-AHEAD |

### 4. Clientes (`admin-customers.html`)

| Qué ve / decide | Estados | Datos hoy |
|---|---|---|
| Directorio con KPIs | vacío, con clientes | `profiles` EXISTS para el listado. La tarjeta **"Afiliados: 42" es hoy un valor escrito a mano**, sin backend — no es design-ahead, es dato falso ya en pantalla (confirmado en `dashboard-admin.md` §9) |

### 5. Fidelización (parámetros)

| Qué ve / decide | Estados | Datos hoy |
|---|---|---|
| `Configuración → Fidelización`: motor de puntos, tabla editable de niveles, afiliados (recompensas/topes), canal (descuento web + tope de apilado) | cada cambio pide confirmación y muestra impacto estimado | 100% DESIGN-AHEAD: `tier_settings`/`loyalty_settings` no existen. Los invariantes (I1–I8 del blueprint, p. ej. puntos calculados server-side, tope de apilado) **no van en esta pantalla** — son código, no configuración |

### 6. FROZEN — no diseñar

**BuildAds** (wizard de 6 pasos) y **ProductAds** (motor autónomo) están **congelados** por
`docs/DECISION_ALCANCE_2026-08-13.md`: BuildAds espera presupuesto publicitario real y llaves de
Predis/ElevenLabs; ProductAds espera fotos de producto de calidad. Ninguna UI se diseña todavía.
**SaleAds** (banners de oferta) no está congelado pero es scope nuevo — sin UI construida.

---

## Contradicciones y huecos (blueprint vs. schema)

- **Roles**: los blueprints de negocio describen 4 roles operativos (Dueño, Administrativos,
  Carniceros, Repartidores). El schema real solo permite `profiles.role IN ('customer','admin')`
  (CHECK, `202604100001_initial_schema.sql`) — no hay carnicero/repartidor en base de datos hoy.
- **`promotions` ya existe** desde la migración inicial (`code`, `discount_percent`, `min_purchase`,
  `valid_from/until`) con `apply_promotion()` funcional — pero ningún blueprint ni criterio de
  `spec-rediseno-v1.md` dibuja un campo de "código de promoción" en el checkout. Además
  `module-scopes.md` redefine `promotions` con columnas distintas (`title`, `product_id`, `source`)
  como si fuera tabla nueva para SaleAds, sin notar que ya existe con otra forma.
- **Perfil** (pedidos/direcciones/favoritos), pedido en este brief, está en
  `spec-rediseno-v1.md` §9 bajo **Backlog (not now)** — confirmar si entra en esta ronda.
- **Fidelización**: `vision.md` dice "1 punto por $10 MXN"; el código (`loyalty.js`) usa $100 por
  punto — 10× de diferencia, contradicción ya señalada por el propio blueprint (§3.1), sin corregir.
- **"Afiliados: 42"** en `admin-customers.html` es un número hardcodeado sin tabla detrás.

---

## Resumen de sesión (engram)

Guardado bajo `topic_key: design/flujos-y-pantallas`, project `carni-mvp`.
