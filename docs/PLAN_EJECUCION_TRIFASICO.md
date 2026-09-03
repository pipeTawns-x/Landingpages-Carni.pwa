# Plan de ejecución · Carrito trifásico, ficha de producto y lupa sin salto

**Proyecto:** Carni-mvp · **Rama:** `main` · **Plazo:** 2 días
**Escrito el 2026-09-02.** Extiende `docs/LOOP_CARRITO_TRIFASICO.md` y
`docs/CONTEXTO_TRIFASICO_2026-09-02.md`. No los reemplaza.

Este plan pasó por un lazo de abogado del diablo de tres pasadas: 6 exploradores
midieron el terreno, 5 lentes adversariales produjeron 25 objeciones, y 13 se
verificaron a ciegas contra el repositorio antes de que la sesión alcanzara su
límite. **Ninguna objeción murió: 4 salieron CONFIRMADAS y 9 PARCIALES.**
Las 12 sin verificar están marcadas como tales.

---

## 0 · Lo que se midió y desmiente al borrador

Un borrador anterior de este mismo plan **inventó el puerto 5199** y colgó de él
todas sus verificaciones. Se deja escrito porque es exactamente el fallo que
este proyecto viene arrastrando: una afirmación que suena bien y nadie abrió.

| Afirmación del borrador | Realidad medida | Evidencia |
|---|---|---|
| El servidor sirve en `:5199` | **`:3002`** | `vite.config.js:9`, `package.json:8`, `lsof` |
| `useCart.ts` es el hook del carrito | **Cero imports. Código muerto.** | búsqueda exhaustiva en `.ts/.tsx/.js/.jsx/.html` |
| React tira nueve campos del carrito | **Los ocho sobreviven.** El comentario está en pasado | `products.tsx:96`, medido sembrando y recargando |

### El hallazgo que gobierna todo el bloque 1

`isPremiumCutItem()` (`js/modules/core/cart.js:84`) exige `categoria === 'premium'`.
**En Supabase no existe ninguna categoría con ese slug.** Consultado en vivo:

```
carnes-rojas · cortes-especiales · cerdo · pollo · embutidos
preparadas · ofertas · merch · otros
```

`categorySlugOf()` devuelve el slug real → `syncLegacyCart` escribe
`categoria: 'cortes-especiales'` → **`quotePremium()` nunca se ejecuta para nada
que React agregue.** Todo el motor de tres modos —`orderMode`, `requestedPieces`,
`requestedBudget`, `getPremiumUnitWeight`, el grosor— **es código inalcanzable
con datos reales**. La prueba de los $1123.20 → $468.00 solo funcionó porque se
sembró `categoria: 'premium'` a mano.

El vocabulario `'premium'` viene de catálogos escritos a mano que sobrevivieron
a la migración a Supabase: `js/modules/utils/base_dinamica.js:214+` y
`js/modules/pages/catalog.js:112`, que declara `['res','cerdo',…,'premium',…]`.
**Ni `res` ni `premium` existen en la base.**

### Esquema real de `products` — 12 columnas, ni una más

```
id · category_id · name · description · price_per_kg · price_per_lb
image_url · stock · is_active · created_at · metadata · min_quantity_kg
```

- `price_per_lb` **ya viene calculado** (289 → 131.09). No hay que convertir el precio.
- `metadata` es JSONB, **vacío en todos los productos, sin una sola línea que lo lea**.
  Es la única válvula de escape ya presente en el esquema.
- **No existe** peso por pieza (P-19) ni nada de grosor o tipo de corte (P-20).
- `is_promoted` y `badge` están en el tipo TS y los leen dos componentes, pero
  **no son columnas**: con datos vivos valen siempre `undefined`.

### `order_items` no puede guardar el modo

```sql
-- 202604100001_initial_schema.sql:70-77
id · order_id · product_id · quantity_kg · unit_price · subtotal
```

**No hay dónde persistir `orderMode`, piezas pedidas ni grosor.** Se puede
construir la interfaz trifásica completa y el pedido que le llega al carnicero
sigue siendo un número en kilos. La RPC acepta `[{product_id, quantity_kg}]`.

### El bloque 1b ya está hecho

`202608210001_precio_server_side.sql:204` recalcula
`v_line_total := ROUND(v_qty * v_product.price_per_kg, 2)` leyendo la fila de
`products` con `SELECT … FOR UPDATE`. **El precio ya no se confía desde el
navegador.** El bloque 1b se reduce a verificarlo y documentarlo.

---

## 1 · Cómo se verifica

Todo se ejecuta desde la raíz del repositorio.

```bash
npm run dev        # http://localhost:3002   ← medido, no supuesto
```

**CAPTURA(ancho, url, nombre)** significa: emular el viewport a `ancho × 812`,
navegar, esperar a que la red se calme, capturar. Anchos obligatorios: **375**
(manda), 768 y 1440. Cuando la tarea afecta al panel del carrito abierto, se
verifica **abierto y cerrado** en cada ancho.

**TSC** = `npx tsc --noEmit`, código de salida 0.

**BUILD-DUAL** = los dos destinos, ambos en 0:

```bash
npm run build
npm run build -- --base=/Landingpages-Carni.pwa/
```

**Antes de cada commit**, sin excepción:

```bash
git diff --cached --name-only
```

`server/routes/buildads.ts` no puede aparecer nunca. Está congelado por
`docs/DECISION_ALCANCE_2026-08-13.md`.

---

## 2 · Tabla de tareas

### Bloque 0 — Asegurar lo que ya existe

| ID | Descripción | Dueño | Archivos en exclusiva | Depende | Verificación |
|---|---|---|---|---|---|
| **T1** | Commitear los 4 archivos sin commitear tal como están, **antes de que nadie los toque**. Es el bloque 2 empezado y hoy vive solo en disco. | orquestador | `cart.js`, `products.html`, `products.tsx`, `CartPanel/styles.css` | — | `git status --porcelain` sin esos 4. `git diff --cached --name-only` mostró 4 rutas, nunca `buildads.ts`. BUILD-DUAL. |
| **T2** | Borrar código muerto **verificado**: `js/modules/core/search.js`, `src/hooks/useCart.ts`, `js/modules/utils/base_dinamica.js`, `js/modules/pages/catalog.js`. Commit solo de borrados. | frontend | los 4 borrados | T1 | `rg -l 'core/search\|useCart\|base_dinamica\|pages/catalog' --glob '!node_modules' --glob '!docs' --glob '!dist'` sin salida. BUILD-DUAL. |

### Bloque 1a — El contrato

| ID | Descripción | Dueño | Archivos en exclusiva | Depende | Verificación |
|---|---|---|---|---|---|
| **T3** | `src/types/catalog.ts`: `ProductRow` espejo exacto de las 12 columnas + `ProductView` con lo derivado (`unit`, `isPremium`, `categorySlug`). Ni una columna inventada. Mover ahí `is_promoted`/`badge` como derivados opcionales. | frontend | `src/types/catalog.ts` (nuevo) | T2 | `ProductRow` tiene 12 campos, contados contra `202604100001_initial_schema.sql:38-50`. TSC. |
| **T4** | **Reconciliar el vocabulario de categoría.** Una sola función `esCortePremium(slug)` que compara contra `'cortes-especiales'`. `isPremiumCutItem()` deja de exigir `'premium'`. | frontend | `js/modules/core/cart.js`, `src/lib/premium.ts` (nuevo) | T3 | Sembrar en `localStorage` un item con `categoria:'cortes-especiales'`, recargar `products.html`, y comprobar en consola que `quotePremium` corre. **Antes del cambio no corre: esa es la prueba.** |
| **T5** | `src/types/cart.ts`: `CartLine` discriminada por `orderMode`. Una línea `pieces` **no puede** llevar `peso`; una `weight` no puede llevar `piezas`. | frontend | `src/types/cart.ts` (nuevo) | T3 | Prueba negativa: escribir `const malo: CartLine = {orderMode:'pieces', requestedPieces:3, peso:1}` y comprobar que **TSC falla**; luego borrarlo. Es la única prueba de que el contrato cierra el hueco de los $655.20. |
| **T6** | Migración de `localStorage`: leer el formato viejo, validar forma y rangos, descartar lo corrupto **con aviso y sin reventar**. Nunca borrar el carrito de un cliente. | frontend | `src/lib/cartStorage.ts` (nuevo) | T5 | Sembrar tres cargas: válida, corrupta (`"{{{"`), y con `piezas:-3`. Recargar. La válida sobrevive, las otras dos se descartan y la página pinta. |
| **T7** | **1b:** verificar que el recálculo server-side sigue vivo y documentarlo. **No escribir SQL nuevo.** | guardian-de-datos | `docs/` | — | Leer `202608210001_precio_server_side.sql:174-204`. Confirmar `FOR UPDATE` y que el total sale de `products.price_per_kg`. |

### Bloque 2 — Un carrito en las tres páginas

| ID | Descripción | Dueño | Archivos en exclusiva | Depende | Verificación |
|---|---|---|---|---|---|
| **T8** | Cablear `#cartBtn` en `index.html`. **Hoy está muerto**: no tiene `data-bs-toggle` ni nadie lo escucha. | frontend | `index.html` | T1 | `index.html:89` — clic en el carrito a 375px abre el panel. CAPTURA(375). |
| **T9** | Migrar `accessweb.html` del modal al panel: quitar `data-bs-toggle`/`#cartModal`, montar `CartPanel`. | frontend | `accessweb.html` | T8 | `rg -c 'cartModal' accessweb.html` → 0. Agregar en la landing, abrir accessweb, **el artículo está ahí**. CAPTURA(375, abierto y cerrado). |
| **T10** | **El carrito deja de secuestrar la página.** Hay **cuatro** escritores de `body.style.overflow`: `products.tsx`, el CSS generado de CartPanel, y `js/modules/ui/header.js:61` —que está en las tres páginas y no estaba en ningún mapa—. Unificar en uno. | frontend | `header.js`, `CartPanel/styles.scss` | T9 | A 1440 con el panel abierto: rueda de 600px y `window.scrollY` **cambia**. A 375 no cambia. |

### Bloque 3 — Trifásico y ficha de producto

| ID | Descripción | Dueño | Archivos en exclusiva | Depende | Verificación |
|---|---|---|---|---|---|
| **T11** | Instalar `react-router-dom@7.18.3`. Montar `<BrowserRouter basename={import.meta.env.BASE_URL}>` **solo dentro de la isla de productos**. | frontend | `package.json`, `src/entry/products.tsx` | T5 | BUILD-DUAL. Servir el build de Pages **bajo su subruta real** y comprobar que `/producto/1` resuelve. Si falla, bajar a `6.30.1`. |
| **T12** | `useSupabaseQuery(tabla, opciones)` — el custom hook con `{ datos, isLoading, error, reintentar }`. **Este es el requisito 1 de EBAC.** | frontend | `src/hooks/useSupabaseQuery.ts` (nuevo) | T3 | Con la red estrangulada a 3G lento se ve el estado de carga. Cortando la red se ve el de error. `reintentar()` vuelve a pedir. |
| **T13** | Ruta `/producto/:id` con `useParams`. Pestañas Peso · Precio · Pieza, 44px mínimo. Grosor **dentro** del modo, solo si el corte lo admite. | frontend | `src/pages/ProductoDetalle.tsx` (nuevo) | T11, T12 | CAPTURA(375, 768, 1440). Las pestañas miden ≥44px. |
| **T14** | `<Link>` al detalle desde la tarjeta del bento y desde la lista. **Al bento no se le toca nada más.** | frontend | `CategoryCard.tsx`, `ProductCard.tsx` | T13 | `git diff --stat css/pages/_bento-main.scss` **vacío**. Clic navega sin recargar. |
| **T15** | Carril horizontal para las cápsulas de categoría, con flechas en escritorio y arrastre en móvil. La activa visible al entrar. | frontend | el SCSS del catálogo | T1 | CAPTURA(375, 768, **1446**). Una sola fila. Sin empalmar con lo de abajo. |

---

## 3 · Grafo de dependencias

```
T1 ─┬─ T2 ── T3 ─┬─ T4
    │            ├─ T5 ─┬─ T6
    │            │      └─ T11 ─┐
    │            └─ (T12) ──────┴─ T13 ── T14
    ├─ T8 ── T9 ── T10
    └─ T15                          T7  (independiente, en paralelo)
```

**En paralelo, sin colisión:** T7 con cualquier cosa · T15 con la cadena T3→T5 ·
T8→T9→T10 con T3→T5 (archivos distintos).
**En serie obligatoria:** todo lo que toca `cart.js` y todo lo que toca
`products.tsx`.

---

## 4 · Mapa de colisiones

| Archivo | Tareas | Cómo se serializa |
|---|---|---|
| `js/modules/core/cart.js` | T1, T4 | T1 commitea el estado actual. **Nadie lo toca hasta que T1 esté commiteada.** |
| `src/entry/products.tsx` | T1, T11 | Igual. T11 extiende, jamás reescribe. |
| `index.html` | T8, T14 | T8 primero, T14 después. |
| `accessweb.html` | T9, y el bloque 5 | El bloque 5 espera a que T9 cierre. |
| `src/components/CartPanel/styles.css` | T1, T10 | **Trampa medida:** `npm run css:components` compila `sass src/components:src/components` — **todo el directorio** (`package.json:11`). Cualquier agente que lo corra **destruye las 10 líneas sin commitear**. Por eso T1 va primero y es innegociable. |
| `src/styles/redesign.css` | ninguna directa | **Lo importan siete entrypoints**, incluidos los tres de admin. Tocarlo alcanza páginas que nadie está mirando. |

---

## 5 · Lo que NO entra en dos días

Dicho por adelantado, con criterio.

| Se corta | Por qué |
|---|---|
| **Bloque 8 · Paquetes y Ofertas** | Toca esquema de base **y** panel de administración. Es lo más caro de todo y lo único que no califica EBAC. |
| **Bloque 6 · Estética de Don Carlos** | El propio brief lo declara prescindible. Además la biblioteca de animación está sin confirmar. |
| **Persistir el modo de compra en el pedido** | `order_items` no tiene columnas para `orderMode`, piezas ni grosor. Añadirlas es una migración con RLS que un humano tiene que leer. **La interfaz trifásica se entrega; el pedido sigue viajando en kilos.** Hay que decírselo a Eduardo, no descubrirlo después. |
| **Modo "por pieza" en la mayoría del catálogo** | No hay peso por pieza en la base (P-19). Solo se ofrece donde `metadata` lo tenga cargado, que hoy es **ningún producto**. |
| **Tabla de grosores como dato obligatorio** | Entra como **valor por defecto editable desde el panel**, nunca como medida forzada. Pollo, cerdo y embutidos **se dejan vacíos**: no se inventan. |
| **Vinculación de varias identidades OAuth** | Tiene un riesgo real de secuestro de cuenta por correo coincidente. Se investiga, no se improvisa. |

---

## 6 · Puntos de parada

| Parada | Antes de | La decisión |
|---|---|---|
| **A** | T4 | ¿`cortes-especiales` es el criterio de premium, o hace falta una marca propia en `metadata`? **Cambia el modelo de datos.** |
| **B** | T10 | Con el panel abierto en escritorio, ¿scroll libre? ¿Y en móvil, bloqueado? |
| **C** | T11 | Si el `basename` de v7 falla bajo Pages: ¿bajamos a 6.30.1 o se revierte el router? |
| **D** | T13 | Sin peso por pieza en la base, ¿el modo pieza se oculta, o se muestra deshabilitado con su porqué? |
| **E** | cierre | La tabla de grosores **necesita la validación de la dueña del negocio**. Salió de una respuesta generada por IA. |

---

## 7 · Supuestos sin medir — la parte que más importa

Marcados a propósito. Cada uno con el comando que lo resuelve.

| # | Supuesto | Cómo se mide |
|---|---|---|
| S1 | El `basename` de React Router v7 funciona bajo `/Landingpages-Carni.pwa/` | Instalar, `npm run build -- --base=…`, servir `dist/` bajo esa subruta y abrir `/producto/1` |
| S2 | Los 53 productos del seed son los que hay en producción | `curl` a `/rest/v1/products?select=count` |
| S3 | `guardian-de-datos` puede entregar SQL, pero **no aplicarlo** — no tiene Bash y el MCP de Supabase es `read_only=true` | Verificado PARCIAL. Cualquier migración la aplica Eduardo |
| S4 | `seedProducts.ts` dice tener 33 productos; el seed tiene 53, con nombres que no coinciden | `rg -c "^\s*\{ id:" src/data/seedProducts.ts` contra el `VALUES` del seed |
| S5 | 12 objeciones del abogado del diablo **nunca se verificaron** (límite de sesión) | Reanudar el lazo desde su `runId` |
| S6 | El único `<input>` en `src/**/*.tsx` está en BuildAds, que está congelado | El requisito EBAC "formulario controlado" **no tiene hoy dónde vivir**: lo crea T13 o la lupa del bloque 4 |

---

## 8 · Los ocho requisitos de EBAC, con dueño

Tres no tenían dónde vivir. Aquí quedan asignados.

| Requisito | Tarea | Archivo |
|---|---|---|
| Custom hook con carga/éxito/error | **T12** | `src/hooks/useSupabaseQuery.ts` |
| Petición GET a una API | T12 | `supabase.from('products').select()` |
| Formulario controlado | T13 / bloque 4 | las entradas de modo, y la lupa |
| Condicional cargando · error · vacío | T12, T13 | y los tres modos de compra |
| Botón de reintentar | **T12** | `reintentar()` del hook |
| Dos rutas con React Router | T11, T13 | `/productos` y `/producto/:id` |
| `useParams` | T13 | `ProductoDetalle.tsx` |
| `<Link>` en cada elemento | **T14** | `CategoryCard.tsx`, `ProductCard.tsx` |
