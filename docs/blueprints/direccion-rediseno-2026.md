# Dirección de rediseño — extraída del diseño de Eduardo

Fecha: 13 agosto 2026. Construido leyendo las pantallas que Eduardo diseñó y cruzándolas contra el código real del repo.

**Qué es esto**: la traducción de un diseño visual a decisiones implementables. Reemplaza a `web-redesign.md` como fuente operativa para las tres páginas del alcance actual; aquel sigue vigente para el resto del sitio.

---

## 1. Hallazgo: tres tipografías en conflicto

| Fuente | Qué declara | Estado |
|---|---|---|
| Diseño nuevo (Figma) | **Plus Jakarta Sans** (headline) · **Inter** (body y label) | lo que quieres |
| `css/abstracts/_typography.scss` línea 5 | `'Proseco', 'Inter', system-ui, ...` | lo que pide el SCSS |
| `index.html` línea 44 | Google Fonts: **Poppins** + **Space Grotesk** | lo que se carga |

**Nadie carga `Proseco` ni `Inter`.** El SCSS las pide, el HTML no las trae. El navegador cae al `system-ui` del fallback.

Consecuencia: tu sitio hoy no se ve con la tipografía que crees. Y como Poppins sí se carga pero nadie la declara en el SCSS, solo aplica donde esté escrita a mano.

**Decisión a tomar** (es tuya): adoptar Plus Jakarta Sans + Inter del diseño nuevo, y arreglar las tres fuentes de verdad para que digan lo mismo. Es una línea en el `<link>` y otra en `_typography.scss`.

---

## 2. Design system — confirmado contra el código

La paleta del diseño **coincide exacta** con `css/abstracts/_variables.scss`. Nada que migrar:

| Rol | Hex | Variable existente |
|---|---|---|
| Primary | `#DC2626` | `$carni-red` ✓ |
| Secondary | `#E4D1B0` | `$carni-beige` ✓ |
| Tertiary | `#F59E0B` | `$carni-gold` ✓ |
| Neutral | `#050505` | superficie oscura ✓ |
| — | `#363432` | `$carni-brown` |
| — | `#059669` | `$carni-green` |

El diseño usa además **escalas de 10 tonos** por color. Eso sí falta: hoy tienes un hex por rol. Se genera con `color.scale()` de Sass o con `color-mix()` de CSS nativo.

**Modo oscuro como base.** Todas las pantallas del catálogo, landing y dashboard son oscuras (`#050505` / `#111111`). Solo login y registro usan fondo claro (beige). Eso invierte lo que hay hoy y es la decisión estética más fuerte del diseño: la carne se ve mejor sobre negro.

---

## 3. Las pantallas, traducidas

### 3.1 Login y registro → `accessweb.html`

**Login (mobile)**
- Fondo `$carni-beige`, ilustración del carnicero saludando arriba
- Card blanca flotante con sombra, esquinas ~16px
- Título "¡BIENVENIDO DE VUELTA!" en rojo, mayúsculas
- Inputs con icono a la izquierda dentro del campo, borde suave, fondo blanco
- CTA rojo full-width: "ENTRAR A LA CARNICERÍA"
- "¿No tienes cuenta? **Regístrate**" con el link en rojo
- Tres botones sociales circulares: Google, Facebook, X

**Registro (mobile)**
- Header rojo sólido con el carnicero de brazos abiertos
- Card blanca que sube sobre el header
- Dos bloques separados: **Datos esenciales** y **Datos de entrega (Opcional)**
- El subtítulo "Puedes agregarlas ahora o más tarde" reduce fricción — buena decisión de UX
- Campos: email, teléfono (10 dígitos), contraseña, confirmar · nombre, calle y número, colonia + CP en fila de dos, referencias

**Lo que ya existe y encaja**: `img/recursos_web/carniLogin.png` y `carniRegistro.png` son esas ilustraciones. Pesan 1.7 y 1.8 MB — hay que convertirlas a WebP antes de usarlas.

**Lo que coincide con el schema**: el teléfono de 10 dígitos ya tiene su `CHECK (char_length(phone) = 10)` en `profiles`. Y `address JSONB` puede guardar calle, colonia, CP y referencias sin migración nueva.

### 3.2 Catálogo → `products.html`

- Fondo negro, sidebar de filtros a la izquierda (Res Premium, Cerdo, Aves) con checkboxes
- Título gigante "CATÁLOGO DE MAESTRO" en display, dos líneas
- **Grid bento asimétrico**: card principal grande (RIBEYE SIGNATURE) + cards menores
- Cada card: foto a sangre, nombre en display, precio en rojo grande, CTA "AGREGAR AL PEDIDO"
- Card de **OFERTAS DE TEMPORADA** con countdown en bloques `08 : 42 : 15`
- Bloque "CLUB MISERICORDIA" en el sidebar con CTA
- Mezcla productos con **merch** (delantal de cuero $2,700) — amplía ticket sin tocar inventario de carne

**Esto es exactamente el `_bento-main.scss` que ya tienes.** El mapa `category-card-1..9` se conserva; cambia la piel, no la estructura.

### 3.3 Carrito lateral → drawer en `products.html`

La pantalla "Your Selection" es la más valiosa de todas, porque **ya resuelve el pedido trifásico**:

```
Wagyu Ribeye A5        PREMIUM CUT · 200G/UNIT    [− 2.5 kg +]   $1,850
Artisan Smoked Bacon   HOUSE CURED · 500G/UNIT    [− 2 qty +]    $420
Short Rib Bone-In      PRIME SELECT · 1.2KG/UNIT  [− 1.2 kg +]   $680
```

Fíjate: **dos unidades distintas conviviendo en el mismo carrito** — `kg` y `qty`. Eso es el modo por peso y el modo por pieza, resueltos visualmente. Es la mejor prueba de que el diseño entendió el problema.

Otros elementos:
- Tabs **DELIVERY / PICKUP** arriba del carrito
- Subtotal · Delivery Fee $85 · **TOTAL TO PAY** grande
- **"EARN 30 POINTS"** al lado del total — la fidelización visible en el momento de comprar
- CTA verde/rojo: **"PLACE ORDER VIA WHATSAPP"**
- Nota al pie: "Orders are processed manually by our master butchers"

Esa nota es honesta y buena: administra la expectativa sin prometer automatización que no existe.

**Lo que falta en el schema para esto**: `products.peso_promedio` (para el modo por pieza) y el campo de unidad por producto. Ya está identificado en `PLAN_MVP_COMPLETO.md`.

### 3.4 Landing → `index.html`

- Hero oscuro, "EL ARTE DE LA CARNE" con "LA CARNE" en rojo
- Foto de corte a la derecha, CTA rojo
- Sección "THE COLLECTIONS" en grid
- Bloque final "JOIN THE MERCY CLUB" — captación al programa de puntos

### 3.5 Fuera del alcance actual, pero diseñado

Estas pantallas quedan guardadas para cuando se descongelen sus módulos:

| Pantalla | Módulo | Fase |
|---|---|---|
| Dashboard Matrix (financial pulse, mapa de SLP, live operations, Carlos AI) | Kanban + analytics | 4 |
| Ads Manager (agenda, omnichannel, generated copy, Instagram preview) | BuildAds | 5 |
| Inventory Atelier (product tracer, peso exacto con slider, traceability timeline) | Inventario admin | 4 |
| Club Misericordia (8,450 puntos, Master Butcher Selection) | Fidelización | 6 |

El "Inventory Atelier" merece una nota: tiene un **slider de peso exacto (42.85 KG)** y una línea de trazabilidad. Eso resuelve el ajuste post-pesaje del pedido trifásico, que era un hueco abierto en el plan.

---

## 4. Lo que el diseño confirma y lo que agrega

**Confirma decisiones ya tomadas:**
- Pedido trifásico (kg / qty conviviendo en el carrito)
- Delivery y pickup como modos separados
- Fidelización integrada al checkout ("EARN 30 POINTS")
- Bento asimétrico como estructura del catálogo
- La paleta completa

**Agrega cosas que no estaban en ningún plan:**
- **WhatsApp como CTA principal de pedido**, no como notificación posterior. Cambia el flujo: el pedido sale por WhatsApp en vez de por checkout con tarjeta
- **Merch** (delantal de cuero) en el catálogo — categoría nueva, no está en el seed
- **Countdown de ofertas de temporada** — necesita fecha de expiración en `promotions` (ya existe `valid_until`)
- **Escalas de 10 tonos** por color
- **Modo oscuro como base**, no como tema alternativo

Lo de WhatsApp vale una conversación: es más simple de implementar que Stripe y encaja con cómo compra la gente en SLP, pero significa que el cobro es manual y no hay prepago. Es una decisión de negocio, no de diseño.

---

## 5. Herramientas — lo que ya tienes vs. lo que falta

**Instaladas y sin usar** (verificado en `.atl/skill-registry.md`):

| Skill | Para qué en este rediseño |
|---|---|
| `ui-ux-pro-max` | criterio de diseñador: jerarquía, espaciado, escala tipográfica |
| `hallmark` | 57 gates anti-slop, para que no quede con cara de plantilla |
| `impeccable` | refuerzo de calidad visual |
| `cult-ui` | patrones de componentes React listos |
| `awesome-design-md` | referencia de diseño |
| `the-architect` | decisiones de arquitectura de componentes |
| `playwright-cli` | capturas a 320 / 768 / 1024 como evidencia |
| `claude-webkit` | bundle con frontend-design y building-components |

**Faltan, y son las que aportan al rediseño:**

| Recurso | Qué agrega |
|---|---|
| `Hainrixz/tododeia-animaciones` | micro-interacciones bento/maximalism |
| `hardikpandya/stop-slop` | segundo filtro anti-genérico, complementa hallmark |
| Higgsfield (MCP en tododeia) | video animado de fondo para landing y login |
| `davidkimai/Context-Engineering` | manejo de contexto en sesiones largas |

**Nota de método**: `ui-ux-pro-max` es la que el tutorial de Juanbertorello señalaba como diferencia entre "una web" y "un diseño". La tienes instalada desde hace meses y no se ha invocado ni una vez.

---

## 6. Prioridad real: las imágenes antes que las animaciones

Inventario verificado: **31 imágenes, todas PNG, cero WebP**.

```
carniRegistro.png   1.8 MB
carniLogin.png      1.7 MB
res.png             1.6 MB
logo-user.png       699 KB
```

Más `img/products/` e `img/carrusel_products/` con nueve cortes **duplicados** — unos 2.5 MB repetidos.

Un login que carga 1.7 MB en 4G no se siente premium, se siente roto. Ninguna animación compensa eso. WebP baja entre 60 y 80% sin diferencia visible.

**Orden correcto**: optimizar imágenes → aplicar el diseño → agregar movimiento. En ese orden, no al revés.

---

## 7. Plan para las tres páginas

```
0. Unificar tipografía          decidir Plus Jakarta Sans + Inter,
                                arreglar _typography.scss e index.html
1. Optimizar imágenes           31 PNG → WebP, deduplicar carpetas
2. Generar escalas de color     10 tonos por rol desde los hex existentes
3. Modo oscuro como base        _theme.scss pasa a ser la base, no alternativa
4. accessweb.html               login y registro según el diseño mobile
5. products.html                catálogo bento + drawer del carrito
6. index.html                   hero, colecciones, Mercy Club
7. Validar                      capturas a 320 / 768 / 1024 + hallmark
```

Los componentes de React de la práctica (`ProductList`, `OrderList`, `ProductCard`) alimentan el paso 5. No se escriben dos veces.

---

## 8. Lo que no verifiqué

- **No abrí el Figma.** Todo lo de este documento viene de las capturas que Eduardo compartió, no del archivo original.
- **No vi el video** `Grabación de pantalla 2026-06-10.mov` que adjuntó.
- **No revisé el resto de `_typography.scss`** más allá de la línea del `$font-body`; puede haber más declaraciones que contradigan.
- **No confirmé si `Proseco` es una fuente real** o un typo de otra cosa.
- **No probé** Higgsfield, stop-slop ni tododeia-animaciones.
- **No corrí nada**: ni build, ni Lighthouse, ni capturas.
- Las pantallas de dashboard, ads e inventario **no se analizaron a fondo** — quedan fuera del alcance actual.
