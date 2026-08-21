# Pendientes — Carni-mvp

**Fuente única de verdad.** Si un pendiente está aquí y también en otro documento, este manda y el otro se corrige.

Los blueprints guardan **decisiones** (por qué se hizo algo). Este archivo guarda **deuda** (qué falta). No se mezclan.

Estados: `abierto` · `en curso` · `cerrado` · `congelado`

Última revisión: 2026-08-20

---

## 🔴 Seguridad — bloquean el merge a `main`

### P-01 · El precio del pedido lo pone el cliente
**Estado:** abierto · **Evidencia:** `supabase/migrations/202604100003_functions.sql:265`

`create_order_with_items()` calcula `v_line_total` con el `unit_price` que viene en el JSONB del cliente. No hay `JOIN` contra `products.price_per_kg`. `order_items` (schema líneas 70-77) tampoco tiene `CHECK (> 0)` en `quantity_kg` ni en `unit_price`.

Cualquiera puede comprar un corte de $399 en $1 desde la consola del navegador.

**Arreglo:** que la función lea el precio de `products` y ignore el que manda el cliente. Agregar los `CHECK`.

### P-02 · Llave de Apify filtrada sin rotar
**Estado:** abierto · **Evidencia:** `docs/tooling/triage.md:172`

`apify_api_jkZn...` está expuesta. **No usarla.** Rotar antes de conectar cualquier MCP de Apify.

### P-03 · Dos huecos en `server/routes/buildads.ts`
**Estado:** congelado con el módulo · **Evidencia:** `server/routes/buildads.ts`

`voice_id` sin validar se concatena a una ruta, con la API key adjunta. Y los errores del servicio externo se reenvían crudos al navegador.

Congelado porque BuildAds lo está. **Se descongela junto con el módulo, no después.**

---

## 🟠 Despliegue — el sitio público no muestra tu trabajo

### P-04 · GitHub Pages publica el repo crudo, no el build
**Estado:** abierto

Por eso el sitio en vivo sirve `.png` en vez de `.webp` y dice "Selección Premium". React **nunca ha corrido** en el sitio público.

### P-05 · Rutas absolutas que rompen bajo subcarpeta
**Estado:** abierto · **Evidencia:** `index.html:552`, `js/modules/core/api.js:8`

`/src/entry/home.tsx` y `/js/modules/utils/service-worker.js` apuntan a la raíz del dominio, pero el sitio vive en `/Landingpages-Carni.pwa/`. Además un `.tsx` crudo no lo ejecuta ningún navegador.

### P-06 · `publicDir: 'img'` deja el build sin imágenes
**Estado:** abierto · **Evidencia:** `vite.config.js:38`

Vite copia `img/*` a la raíz de `dist/`, así que `dist/img` no existe y las rutas `/img/products/…` fallan.
**Ojo:** `publicDir: false` NO es el arreglo — desactiva la copia entera. Mover a `public/img/` y usar `publicDir: 'public'`.

---

## 🟠 Migración a React — landing

### P-07 · El bento de categorías es HTML escrito a mano
**Estado:** abierto · **Evidencia:** `index.html:225-345`

Nueve `<article class="category-card">` con nombres e imágenes fijos. No leen ningún dato, por eso siguen diciendo "Selección Premium".

### P-08 · React se monta al final de la landing
**Estado:** abierto · **Evidencia:** `index.html:455`

`#homeReactRoot` va después de Sobre Nosotros y Contacto. Lo mejor de la página está debajo de lo peor.

### P-09 · Las tarjetas del bento parpadean al pasar el cursor
**Estado:** abierto · **Evidencia:** `css/pages/_bento-main.scss:159-160`

`&:hover { transform: translateY(-6px) }` mueve la tarjeta fuera del cursor: se acaba el hover, vuelve a bajar, empieza el hover. Bucle.

**Arreglo:** el `:hover` se queda en `.category-card`; el `translateY` se aplica a un hijo interior, para que el área sensible no cambie de lugar.

### P-10 · Modal de corte premium huérfano
**Estado:** abierto · **Evidencia:** `products.html:415`

`openPremiumOrderModal()` está definida y nadie la llama — el renderizador vanilla que la invocaba se fue con la migración. Hoy no hay forma de configurar un corte premium.

---

## 🟡 Calidad — hallazgos de GGA ya triageados

### P-11 · `formatPrice` duplicado tres veces
`CartPanel.tsx:14` · `OrderList.tsx:22` · `ProductCard.tsx:11` → extraer a un módulo común.

### P-12 · Dos textos de respaldo para la misma categoría
`shared.tsx:89` devuelve `'Selección Carni'`; `ProductCard.tsx:87` devuelve `'Corte especial'`. Dejar uno.

### P-13 · Decisión contradictoria del tamaño de tarjeta
`ProductList.tsx:32-35` fija todo en `"medium"`; `home.tsx:74` varía por índice. Definir quién manda.

---

## 🔵 Diseño — mejoras planeadas

### P-14 · Video de fondo generado con IA
**Estado:** abierto · **Referencia:** `docs/blueprints/direccion-rediseno-2026.md:166`

Higgsfield para el hero de landing y login. Nunca se probó. Mismo motor que necesitará BuildAds.

### P-15 · Micro-interacciones y animación por scroll
**Estado:** abierto

*Scroll-driven animations*, *sticky sections*, *parallax*, *staggered reveals*. Skill `tododeia-animaciones` sin instalar.
**Depende de P-07:** animar el bento antes de migrarlo es trabajo que se tira.

### P-16 · Escalas de 10 tonos por color
**Estado:** abierto · **Referencia:** `docs/blueprints/direccion-rediseno-2026.md:38`

Hoy hay un hex por rol. Se generan con `color.scale()` de Sass o `color-mix()` nativo.

---

## ⚪ Congelado por decisión del 2026-08-13

Fidelización · Afiliados · BuildAds · ProductAds

Congelado hasta que el dueño de la carnicería entregue márgenes reales. **Congelado no es pendiente**: no se trabaja, no se planea y no cuenta como deuda. Ver `docs/DECISION_ALCANCE_2026-08-13.md`.

---

## Orden de ataque

```
TANDA 0   P-01, P-02              seguridad, antes de mergear a main
TANDA 1   P-04, P-05, P-06        el sitio público muestra tu trabajo
          P-07, P-08, P-09        la landing deja de mentir
TANDA 2   P-14, P-16              diseño sobre lo ya migrado
TANDA 3   drawer, header, formularios de accessweb.html
TANDA 4   P-10, motor del carrito
```

`P-11`, `P-12`, `P-13` se resuelven de paso cuando se toque cada archivo. No merecen tanda propia.
