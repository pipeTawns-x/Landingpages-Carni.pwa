# 🎨 PROMPT MAESTRO PARA STITCH — Carni-mvp Rediseño

> Documento para usar directamente en **Google Stitch** o **Copilot/Claude**.

---

## CONTEXTO DEL PROYECTO

**Proyecto**: Carni-mvp — E-commerce + Dashboard Admin para Carnicería El Señor de La Misericordia

**Screenshot de referencia**: `img/recursos_web/carniLogin.png`, `img/recursos_web/carniRegistro.png`

**Stack actual**: Vanilla JS + SCSS 7-1 + Bootstrap 5 + Vite

**Stack objetivo**: Tailwind CSS CDN + Alpine.js + Chart.js

---

## ACTUALIZACION ESTRICTA ABRIL 2026

Este prompt ya no debe interpretarse como una simple guia estetica. A partir de ahora el objetivo obligatorio es producir una mejora real del producto, manteniendo el sitio funcional y preparando una base visual compatible con una web moderna, funcional y segura.

### Fallos anteriores que NO se pueden repetir

- No trabajar solo la landing o el index.
- No limitarse a cambiar colores y venderlo como rediseño.
- No romper rutas, enlaces ni carga de paginas secundarias.
- No empeorar `accessweb.html`, `products.html`, `dashboar.html` o las paginas admin.
- No dejar layouts flojos, vacios o con padding pobre.
- No hacer un bento grid improvisado; debe sentirse intencional, moderno y mejor resuelto que el actual.
- No mezclar estilos inconsistentes entre ecommerce, auth y paneles.

### Alcance obligatorio

Toda propuesta o implementacion de rediseño debe cubrir, como minimo:

- `index.html`
- `products.html`
- `accessweb.html`
- `dashboar.html`
- `admin-products.html`
- `admin-customers.html`
- `admin-orders.html`

Si una iteracion mejora solo una pagina y deja el resto roto, inconsistente o sin revisar, el resultado se considera fallido.

### Guardrails de no regresion

- Mantener la navegacion existente y validar que las rutas principales sigan cargando.
- No introducir cambios que dificulten una futura proteccion de rutas por JWT y roles.
- Mantener separadas las zonas publicas, autenticadas y admin.
- Priorizar UX, legibilidad, spacing, padding y composicion antes que efectos decorativos.
- Usar las referencias visuales del workspace como inspiracion, no como copia literal.

### Direccion de seguridad a respetar

El rediseño no implementa por si solo la seguridad backend, pero debe respetar esta evolucion del proyecto:

- rutas con validacion de JWT desde `Authorization`
- `401 Unauthorized` si el token falta o es invalido
- `403 Forbidden` en rutas solo admin cuando el rol no corresponde
- compatibilidad con middleware de proteccion sin rehacer flujos o navegacion

### Resultado esperado actual

El trabajo debe dejar al proyecto mas cerca de una web moderna, funcional y segura:

- rediseño integral, no superficial
- mejor composicion visual
- mejor padding y espaciado
- bento grid mas fuerte y mas contemporaneo
- consistencia entre landing, productos, auth y paneles
- cero regressions en rutas o paginas

### Coordinacion entre capas agenticas

Este proyecto opera con dos capas de instrucciones y ambas deben colaborar, no competir:

- **Capa global `stack-ia/gentle-ai`**: define las reglas base de orquestacion, persistencia, rigor, seguridad operativa y flujo general de trabajo.
- **Capa local `Carni-mvp`**: agrega contexto del producto, estructura real del repo, alcance funcional, guardrails visuales y restricciones del negocio.

### Regla de precedencia

- Si hay conflicto entre instrucciones globales y locales, prevalece la capa global.
- La capa local no reemplaza la global; la complementa con contexto especifico del proyecto.
- No ignores ninguna de las dos capas: usa la global para metodo y la local para aterrizar decisiones en este repo.

### Forma correcta de usar ambas capas

- Usa la capa global para mantener disciplina de ejecucion, no-regression, memoria, verificacion y prudencia tecnica.
- Usa la capa local para entender que archivos tocar, que paginas existen, que rutas no deben romperse y cual es el resultado esperado del producto.
- Usa el README actualizado como fuente de verdad sobre el liston actual del proyecto: web moderna, funcional y segura.
- Usa `agents/AGENTS.md` y este prompt para el contexto de rediseño visual, alcance real y restricciones del repo.

### Optimo desempeno entre capas

Para obtener el mejor resultado, trabaja asi:

1. Primero lee la capa global y respetala como marco operativo.
2. Luego lee la capa local del repo y el README para obtener el contexto real de Carni-mvp.
3. Despues audita el sitio completo antes de editar.
4. Implementa cambios minimizando conflicto entre decisiones visuales, estructura actual y evolucion futura del producto.
5. Verifica que el resultado final cumpla tanto con el rigor de la capa global como con los objetivos del repo.

### Que NO hacer entre capas

- No interpretar la capa local como permiso para romper reglas globales.
- No aplicar reglas globales de forma tan abstracta que ignores el estado real del repo.
- No improvisar reescrituras grandes del stack sin que el repo las soporte.
- No hacer rediseños visuales que desconozcan la estructura funcional existente.
- No duplicar instrucciones ni mezclar criterios contradictorios si la capa global ya resolvio la precedencia.

---

## ESTILO VISUAL: Maximalismo Mexicano Equilibrado

### Paleta de Colores

| Color           | Hex       | Uso                        |
| --------------- | --------- | -------------------------- |
| Rojo Carnicería | `#DC2626` | CTAs, hero, primario       |
| Verde Success   | `#059669` | Badges, validaciones       |
| Blanco          | `#FFFFFF` | Fondos principales         |
| Beige Cálido    | `#E4D1B0` | Fondos secundarios         |
| Marrón Oscuro   | `#363432` | Footer, sidebar, texto     |
| Oro Acento      | `#F59E0B` | Hover, highlights, premium |

### Tipografía

- **Títulos**: Poppins Bold (wght@600-700), casual no formal
- **Body**: Inter o Roboto (wght@400-500)
- **Formularios**: Poppins (wght@500)

### Espaciado y Bordes

- Espaciado generoso (padding: 1rem mobile, 2-3rem desktop)
- Border-radius: 12-16px en cards
- Sombras suaves: `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`
- Cards con hover: `transform: scale(1.03)`

### Animaciones

- **AOS** (Animate On Scroll): `fade-up`, `fade-in`
- Transiciones: `300ms ease-out`
- Hover effects suaves en todos los elementos interactivos

---

## ESTRUCTURA DE PÁGINAS

### 1. LANDING PAGE (`index.html`)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (sticky): Logo + Nav + Carrito icon + Usuario    │
├─────────────────────────────────────────────────────────┤
│  HERO (full-width):                                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Gradiente rojo #DC2626 → marrón #363432           │ │
│  │  ┌──────────────────┐  ┌───────────────────────┐  │ │
│  │  │  Título H1       │  │  Chef cartoon         │  │ │
│  │  │  "Cortes Premium  │  │  (carni.png)          │  │ │
│  │  │   a Tu Puerta"   │  │                       │  │ │
│  │  │                   │  │                       │  │ │
│  │  │  [Ver Productos] │  └───────────────────────┘  │ │
│  │  │  [Fidelidad]     │                              │ │
│  │  │                   │                              │ │
│  │  │  🛵 Delivery     │                              │ │
│  │  │   Gratis Badge   │                              │ │
│  │  └──────────────────┘                              │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  CATEGORÍAS (bento grid 3x3):                           │
│  ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │ Res │ │Cerdo│ │Pollo│  Hover: zoom 1.03 + overlay   │
│  └─────┘ └─────┘ └─────┘                               │
│  ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │Embut│ │Prep │ │Prem │  Imagen + nombre + precio     │
│  └─────┘ └─────┘ └─────┘                               │
│  ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │Merch│ │Otros│ │Ofer │  Badge "20% OFF" en ofertas    │
│  └─────┘ └─────┘ └─────┘                               │
├─────────────────────────────────────────────────────────┤
│  SOBRE NOSOTROS (split 50/50):                          │
│  ┌──────────────────┬──────────────────────────────┐   │
│  │  Imagen carnicería│  Historia + valores +       │   │
│  │  (hero Interior)  │  tradición mexicana         │   │
│  └──────────────────┴──────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  TESTIMONIOS (carousel horizontal):                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ "Los mejores cortes..." - Juan ★★★★★            │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  FOOTER (3 columnas):                                  │
│  ┌──────────┬─────────────────┬────────────────────┐  │
│  │ Marca    │ Links           │ Contacto           │  │
│  │ Logo     │ • Productos     │ • Tel: 4442715470  │  │
│  │ Slogan   │ • Delivery      │ • Email            │  │
│  │          │ • Fideliidad    │ • Ubicación        │  │
│  └──────────┴─────────────────┴────────────────────┘  │
│  Redes sociales: FB, IG, WhatsApp                      │
└─────────────────────────────────────────────────────────┘
```

### 2. PÁGINA PRODUCTOS (`products.html`)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (sticky): Logo + Búsqueda + Carrito (badge 3)  │
├─────────────────────────────────────────────────────────┤
│  BREADCRUMB: Inicio > Productos > [Categoría activa]  │
├─────────────────────────────────────────────────────────┤
│  FILTRO CATEGORÍAS (scroll horizontal chips):           │
│  [Todo] [Res] [Cerdo] [Pollo] [Embutidos] [Preparadas]│
│  [Premium] [Merch] [Otros] [Ofertas]                  │
│  └─ Active: background #DC2626, text white            │
├─────────────────────────────────────────────────────────┤
│  GRID PRODUCTOS (4 cols desktop / 2 mobile):           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │  img    │ │  img    │ │  img    │ │  img    │      │
│  │ (200px) │ │         │ │         │ │         │      │
│  │─────────│ │─────────│ │─────────│ │─────────│      │
│  │ Arrachera│ │Ribeye   │ │Tbone    │ │Shortrib │      │
│  │ $289/kg │ │$399/kg │ │$349/kg │ │$279/kg │      │
│  │ $131/lb │ │$181/lb │ │$158/lb │ │$126/lb │      │
│  │─────────│ │─────────│ │─────────│ │─────────│      │
│  │ [slider]│ │ [slider]│ │ [slider]│ │ [slider]│      │
│  │ 1.0 kg ▼│ │ 1.0 kg ▼│ │ 1.0 kg ▼│ │ 1.0 kg ▼│      │
│  │─────────│ │─────────│ │─────────│ │─────────│      │
│  │[🛒 Cart]│ │[🛒 Cart]│ │[🛒 Cart]│ │[🛒 Cart]│      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
├─────────────────────────────────────────────────────────┤
│  CARACTERÍSTICAS PRODUCTO (modal al click):             │
│  - Imagen ampliada                                     │
│  - Descripción completa                                │
│  - Selector peso/cantidad                              │
│  - Botón agregar                                       │
├─────────────────────────────────────────────────────────┤
│  CARRITO MODAL (slide-in derecha):                     │
│  ┌──────────────────────────────────┐                 │
│  │  🛒 Tu Carrito (3 items)    [X]  │                 │
│  │  ────────────────────────────────│                 │
│  │  ┌────┬──────────┬────┬────────┐ │                 │
│  │  │img │Arrachera │ +/-│ $289   │ │                 │
│  │  │    │1.5 kg    │ 2  │ $433.50│ │                 │
│  │  └────┴──────────┴────┴────────┘ │                 │
│  │  ────────────────────────────────│                 │
│  │  Subtotal: $722.50               │                 │
│  │  ────────────────────────────────│                 │
│  │  Delivery:                       │                 │
│  │  ○ Recoger en tienda (GRATIS)   │                 │
│  │  ○ Envío a domicilio ($50)      │                 │
│  │  ────────────────────────────────│                 │
│  │  TOTAL: $772.50                  │                 │
│  │  ────────────────────────────────│                 │
│  │  [  Generar Pedido  ] (rojo)    │                 │
│  │  [Enviar por WhatsApp] (verde)  │                 │
│  └──────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### 3. AUTH PAGE (`accessweb.html`)

```
┌────────────────────────────┬─────────────────────────────────┐
│  SPLIT LAYOUT (50/50):     │                                 │
│                            │                                 │
│  ┌──────────────────────┐ │  ┌───────────────────────────┐  │
│  │  LOGIN / REGISTER    │ │  │                           │  │
│  │  ┌────────────────┐  │ │  │   Ilustración Chef        │  │
│  │  │ [Login][Reg]   │  │ │  │   (carniLogin.png o      │  │
│  │  └────────────────┘  │ │  │    carniRegistro.png)     │  │
│  │                      │ │  │                           │  │
│  │  ┌────────────────┐  │ │  │                           │  │
│  │  │ Email          │  │ │  │                           │  │
│  │  └────────────────┘  │ │  │                           │  │
│  │  ┌────────────────┐  │ │  │                           │  │
│  │  │ Password      │  │ │  │                           │  │
│  │  └────────────────┘  │ │  │                           │  │
│  │  ☐ Recuérdame        │ │  │                           │  │
│  │  ¿Olvidaste?         │ │  │                           │  │
│  │                      │ │  │                           │  │
│  │  [ENTRAR A LA        │ │  │                           │  │
│  │   CARNICERÍA]        │ │  │                           │  │
│  │                      │ │  └───────────────────────────┘  │
│  │  ──── o ────         │ │                                 │
│  │  [Google] [Facebook] │ │                                 │
│  │                      │ │                                 │
│  │  ¿No tienes cuenta?  │ │                                 │
│  │  Regístrate →        │ │                                 │
│  └──────────────────────┘ │                                 │
│                            │                                 │
│  SLIDING PANEL ANIMATION: │                                 │
│  El panel rojo se desliza │                                 │
│  entre login y registro   │                                 │
└────────────────────────────┴─────────────────────────────────┘

MODO REGISTRO (panel deslizado):
┌────────────────────────────┬─────────────────────────────────┐
│  ┌──────────────────────┐  │                                 │
│  │  Nombre completo     │  │                                 │
│  │  Email               │  │                                 │
│  │  Tel (10 dígitos)    │  │                                 │
│  │  Calle y número      │  │                                 │
│  │  Colonia             │  │                                 │
│  │  CP + Referencias    │  │                                 │
│  │  Password           │  │                                 │
│  │  Confirmar pass      │  │                                 │
│  │  ☐ Términos         │  │                                 │
│  │  ☐ Newsletter       │  │                                 │
│  │                      │  │                                 │
│  │  [CREAR MI CUENTA]   │  │                                 │
│  │                      │  │                                 │
│  │  ¿Ya tienes cuenta?  │  │                                 │
│  │  Inicia sesión →     │  │                                 │
│  └──────────────────────┘  │                                 │
└────────────────────────────┴─────────────────────────────────┘
```

### 4. DASHBOARD ADMIN (`dashboar.html`)

```
┌─────────────┬─────────────────────────────────────────────┐
│  SIDEBAR    │  TOP BAR: 🔍 Buscar...  🔔(3)  👤 Perfil   │
│  (dark)     ├─────────────────────────────────────────────┤
│             │  DASHBOARD OVERVIEW                          │
│  🏠 Home    │  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ │
│             │  │Ventas  │ │Pedidos │ │Clientes│ │Puntos │ │
│  📦 Prods   │  │ $24,500│ │   8    │ │  12    │ │1,256  │ │
│             │  │ ↑12%   │ │ Activos│ │ Nuevos │ │Fidel. │ │
│  📋 Pedidos │  └────────┘ └────────┘ └────────┘ └───────┘ │
│   (badge 3)│                                               │
│             │  GRÁFICAS:                                   │
│  👥 Clientes│  ┌────────────────────────────────────────┐ │
│             │  │  Ventas últimos 30 días (línea)        │ │
│  🎁 Promos  │  │  ████                                 │ │
│             │  │      ████                              │ │
│  📢 Campañas│  │          ████                          │ │
│             │  │              ████                      │ │
│  🤖 Bots    │  └────────────────────────────────────────┘ │
│             │  ┌──────────────────┐                     │
│  📈 Reportes│  │Top 5 Productos    │                     │
│             │  │   (dona)          │                     │
│  ⚙️ Config │  └──────────────────┘                     │
│             ├─────────────────────────────────────────────┤
│             │  ÚLTIMOS PEDIDOS                             │
│             │  ┌────────────────────────────────────────┐ │
│             │  │ ID │Cliente│Items │Total│Status│Acciones││
│             │  │ 001│ Juan  │Asado │$450 │🟡 Pen │[📤Telegram]││
│             │  │ 002│ María │Tbone │$620 │🟢 Val │[✓Listo] ││
│             │  │ 003│ Pedro │Ribeye│$780 │🔴 Can │[🗑️]    ││
│             │  └────────────────────────────────────────┘ │
└─────────────┴─────────────────────────────────────────────┘

MÓDULOS ADICIONALES (tabs o secciones):

GESTIÓN PEDIDOS:
- Filtros: estado, canal (web/whatsapp), fecha
- Acciones: Enviar Ticket Telegram, Marcar Completado
- Anti-spam: badge si >3 pedidos/hora

PROMOS/DESCUENTOS:
- Cards promos activas con toggle on/off
- Form crear: nombre, % desc, código, fechas, productos
- Preview cupón generado

CAMPañAS META ADS:
- Cards por canal: IG Feed, IG Stories, FB Posts, FB Stories
- Preview placeholder img/video
- Botón "Programar Envío"
- Stats: alcance estimado, costo

BOT WHATSAPP:
- Chat feed simulado
- Stats: mensajes hoy, conversiones, tiempo respuesta
- Toggle activar/desactivar
- Botón broadcast

REPORTES:
- Selector período + exportar CSV/PDF
- Gráficas: ventas vs gastos, por categoría
- KPIs: ticket promedio, frecuencia compra
```

---

## RESPONSIVE BREAKPOINTS

| Breakpoint  | Layout Adaptación                               |
| ----------- | ----------------------------------------------- |
| **320px**   | Stack vertical, drawer categorías, hero stacked |
| **570px**   | Grid 2 columnas productos, más spacing          |
| **768px**   | Grid 3 columnas, sidebar visible en admin       |
| **870px**   | Split layout auth disponible                    |
| **1024px+** | Grid 4 columnas, layout completo                |

---

## ASSETS DISPONIBLES

| Asset         | Ruta                                 | Uso               |
| ------------- | ------------------------------------ | ----------------- |
| Chef Login    | `img/recursos_web/carniLogin.png`    | Auth lado derecho |
| Chef Registro | `img/recursos_web/carniRegistro.png` | Auth registro     |
| Logo          | `img/recursos_web/logo-user.png`     | Header            |
| Productos     | `img/products/*.png`                 | Cards producto    |
| Carrusel      | `img/carrusel_products/*.png`        | Hero carousel     |

---

## OUTPUT ESPERADO

### Para Stitch:

1. **ZIP descargable** con:
   - `index.html` (landing completa)
   - `products.html` (catálogo funcional)
   - `accessweb.html` (auth con sliding)
   - `dashboar.html` (admin con gráficas)
   - `styles.css` (global)
   - `app.js` (lógica Alpine.js)

2. **Código embebido** para copiar directo

3. **Preview responsive** validado en 3 breakpoints

### Para Copilot/Claude:

Código completo listo para integrar en el repo actual

---

## CHAIN-OF-THOUGHT

```
1. Wireframe landing (hero + categorías + footer)
   ↓
2. Auth flow (sliding panel + validación)
   ↓
3. Catálogo (grid + filtros + carrito modal)
   ↓
4. Dashboard módulos (sidebar + stats + gráficas)
   ↓
5. Integrar gráficos/bots (Chart.js, table)
   ↓
6. Polish maximalismo mexicano
   ↓
7. Tests manuales (responsive, forms)
```

---

## VALIDATION CHECKLIST

- [ ] Mobile-first probado en 320px
- [ ] Desktop probado en 1024px+
- [ ] Forms con validación inline
- [ ] Carrito modal funcional (slide-in)
- [ ] Sidebar admin colapsable
- [ ] Gráficas Chart.js con sample data
- [ ] No broken image links
- [ ] AOS animations suaves
- [ ] Dark mode toggle (si se incluye)

---

**Prompt version**: v1.0
**Fecha**: 2026-04-07
**Proyecto**: Carni-mvp
**Para**: Google Stitch / Copilot / Claude
