# PROMPT MAESTRO PARA COPILOT — Carni-mvp Landing + Webcommerce

> Copia y pega este prompt completo en Copilot (Claude Opus 4.6)

---

## CONTEXTO DEL PROYECTO

**Nombre**: Carni-mvp
**Cliente**: Carnicería El Señor de La Misericordia
**Ubicación**: Agua Marina 110, Manuel J. Othon, San Luis Potosí, S.L.P. 78150
**Teléfono**: 444-271-5470
**Tipo**: E-commerce de carnes premium con delivery en SLP

---

## ASSETS DISPONIBLES

| Asset | Ruta | Descripción |
|-------|------|-------------|
| Logo | `img/recursos_web/logo-user.png` | Logo carnicería |
| Don Carlos Login | `img/recursos_web/carniLogin.png` | Mascote login |
| Don Carlos Registro | `img/recursos_web/carniRegistro.png` | Mascote registro |
| Banner Hero | `img/recursos_web/banercarnimvp.png` | Banner principal |
| Productos | `img/products/*.png` | 18 imágenes (arrachera, ribeye, etc.) |

---

## PALETA DE COLORES (ADN FIJO)

| Color | Hex | Uso |
|-------|-----|-----|
| Rojo Carnicería | `#DC2626` | CTAs, hero, primario |
| Beige Cálido | `#E4D1B0` | Fondos secundarios |
| Oro | `#F59E0B` | Hover, highlights, premium |
| Marrón Oscuro | `#363432` | Footer, sidebar, texto |
| Blanco | `#FFFFFF` | Cards, contenido |
| Verde Success | `#059669` | Confirmaciones, badges |

---

## TIPOGRAFÍA

- **Títulos**: Poppins Bold (wght@600-700)
- **Body**: Inter (wght@400-500)
- **Precios**: Poppins SemiBold

---

## PRODUCTOS REALES

| Producto | Precio | Categoría |
|----------|--------|-----------|
| Arrachera | $289/kg | RES |
| Ribeye | $399/kg | RES |
| T-Bone | $349/kg | RES |
| Short Rib | $279/kg | RES |
| Bisteck Cerdo | $130/kg | CERDO |
| Molida Cerdo | $135/kg | CERDO |
| Pollo Entero | $85/kg | POLLO |
| Chorizo | $180/kg | EMBUTIDOS |

**Categorías**: RES, CERDO, POLLO, EMBUTIDOS, PREPARADAS, PREMIUM, MERCH, OTROS, OFERTAS

---

## PÁGINAS A GENERAR

### 1. LANDING PAGE (index.html)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (sticky):                                           │
│ [Logo]        Inicio | Productos |Nosotros | Contacto  [🛒]│
├─────────────────────────────────────────────────────────────┤
│ HERO (full-width):                                         │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Gradiente: #DC2626 → #363432                           ││
│ │                                                         ││
│ │ ┌───────────────────────┐  ┌────────────────────────┐ ││
│ │ │ 🥩 Cortes Premium     │  │ [Banner carni]        │ ││
│ │ │   a Tu Puerta        │  │                        │ ││
│ │ │                       │  │                        │ ││
│ │ │ [Ver Productos]       │  │                        │ ││
│ │ │ [Programa Fidelidad]  │  └────────────────────────┘ ││
│ │ │                       │                              ││
│ │ │ 🛵 Delivery Gratis    │                              ││
│ │ │   en SLP +$500       │                              ││
│ │ └───────────────────────┘                              ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ CATEGORÍAS (Bento Grid 3x3):                              │
│ ┌───────┐ ┌───────┐ ┌───────┐                           │
│ │  RES  │ │ CERDO │ │ POLLO │  Hover: scale(1.03)       │
│ │  img  │ │  img  │ │  img  │  + overlay con nombre      │
│ │$289/kg│ │$130/kg│ │ $85/kg│                           │
│ └───────┘ └───────┘ └───────┘                           │
│ ┌───────┐ ┌───────┐ ┌───────┐                           │
│ │EMBUT. │ │PREP.  │ │PREMIUM│                           │
│ └───────┘ └───────┘ └───────┘                           │
│ ┌───────┐ ┌───────┐ ┌───────┐                           │
│ │ MERCH │ │ OTROS │ │OFERTAS│  Badge "20% OFF"           │
│ └───────┘ └───────┘ └───────┘                           │
├─────────────────────────────────────────────────────────────┤
│ PRODUCTOS DESTACADOS (carousel o grid):                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │Arrachera│ │ Ribeye  │ │ T-Bone  │ │Short Rib│        │
│ │ $289/kg │ │ $399/kg │ │ $349/kg │ │ $279/kg │        │
│ │ [Añadir]│ │ [Añadir]│ │ [Añadir]│ │ [Añadir]│        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────────┤
│ SOBRE NOSOTROS (split 50/50):                             │
│ ┌──────────────────┬────────────────────────────────────┐ │
│ │ [Imagen          │ "Desde 1985 delivering tradición  │ │
│ │  carnicería]    │  mexicana a tu mesa. Calidad,    │ │
│ │                  │  frescura y servicio excepcional." │ │
│ │                  │                                    │ │
│ │                  │ ✓ Cortes premium                   │ │
│ │                  │ ✓ Delivery en SLP                  │ │
│ │                  │ ✓ Programa de puntos               │ │
│ └──────────────────┴────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ TESTIMONIOS:                                              │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ⭐⭐⭐⭐⭐ "Los mejores cortes de SLP" - María G.   │  │
│ └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ FOOTER (3 columnas):                                      │
│ ┌───────────┬──────────────────┬─────────────────────┐   │
│ │ Logo      │ Navegación       │ Contacto            │   │
│ │ Slogan    │ • Inicio         │ 📍 Agua Marina 110  │   │
│ │           │ • Productos      │ 📞 444-271-5470    │   │
│ │           │ • Nosotros       │ 📧 info@carnicería  │   │
│ │           │ • Fidelidad      │                     │   │
│ │[FB][IG][WA]│                │ Horarios:            │   │
│ │           │                 │ L-S 8am-5pm          │   │
│ └───────────┴──────────────────┴─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. CATÁLOGO (products.html)

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (sticky): [Logo] [🔍 Buscar] [🛒 3] [👤]         │
├─────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Inicio > Productos > [Categoría]              │
├─────────────────────────────────────────────────────────────┤
│ FILTROS (chips horizontales, scroll en mobile):            │
│ [Todo] [RES] [CERDO] [POLLO] [EMBUTIDOS] [PREMIUM]      │
│ Active: bg-#DC2626, text-white                            │
├─────────────────────────────────────────────────────────────┤
│ GRID PRODUCTOS (4 cols desktop / 2 mobile):               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ img     │ │ img     │ │ img     │ │ img     │        │
│ │(200px)  │ │         │ │         │ │         │        │
│ │─────────│ │─────────│ │─────────│ │─────────│        │
│ │Arrachera│ │ Ribeye  │ │ T-Bone  │ │Bisteck  │        │
│ │ $289/kg │ │ $399/kg │ │ $349/kg │ │ $130/kg │        │
│ │─────────│ │─────────│ │─────────│ │─────────│        │
│ │[slider] │ │[slider] │ │[slider] │ │[slider] │        │
│ │ 1.0 kg▼│ │ 1.0 kg▼│ │ 1.0 kg▼│ │ 1.0 kg▼│        │
│ │─────────│ │─────────│ │─────────│ │─────────│        │
│ │[🛒 Cart]│ │[🛒 Cart]│ │[🛒 Cart]│ │[🛒 Cart]│        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────────┤
│ MODAL QUICK VIEW (al click):                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [X]                                                   │   │
│ │ ┌───────────────────┐                                │   │
│ │ │   [Imagen grande] │ "Arrachera Premium"           │   │
│ │ │                   │ "Corte tradicional mexicano"   │   │
│ │ │                   │                                │   │
│ │ └───────────────────┘ $289/kg                        │   │
│ │                                                         │   │
│ │ Cantidad: [ - ] 1.0 kg [ + ]                          │   │
│ │                                                         │   │
│ │ Subtotal: $289.00                                      │   │
│ │                                                         │   │
│ │ [      Añadir al Carrito      ] (rojo)               │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ CARRITO MODAL (slide-in derecha):                        │
│ ┌──────────────────────────────────┐                     │
│ │ 🛒 Tu Carrito (3 items)    [X]  │                     │
│ │ ────────────────────────────────│                     │
│ │ Arrachera    1.5kg    $433.50   │                     │
│ │ Ribeye       0.5kg    $199.50   │                     │
│ │ ────────────────────────────────│                     │
│ │ Subtotal: $633.00               │                     │
│ │ ────────────────────────────────│                     │
│ │ Delivery: ○ Recoger (GRATIS)   │                     │
│ │           ○ Envío ($50)        │                     │
│ │ ────────────────────────────────│                     │
│ │ TOTAL: $633.00 / $683.00        │                     │
│ │ ────────────────────────────────│                     │
│ │ [   Generar Pedido   ] (rojo)  │                     │
│ │ [Enviar por WhatsApp] (verde)  │                     │
│ └──────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### 3. AUTH (accessweb.html)

```
┌────────────────────────────┬─────────────────────────────────┐
│ SPLIT LAYOUT (870px+):    │                                 │
│                            │                                 │
│  ┌──────────────────────┐ │  ┌───────────────────────────┐  │
│  │ [carniLogin.png]    │ │  │                           │  │
│  │   Don Carlos         │ │  │   NO MOVER ESTA IMAGEN   │  │
│  │   (mascote)          │ │  │   Es el mascote oficial  │  │
│  │                      │ │  │                           │  │
│  │  ┌────────────────┐  │ │  └───────────────────────────┘  │
│  │  │ [Login][Reg]   │  │ │                                 │
│  │  └────────────────┘  │ │                                 │
│  │                      │ │                                 │
│  │  ┌────────────────┐  │ │                                 │
│  │  │ correo@ejemplo │  │ │                                 │
│  │  └────────────────┘  │ │                                 │
│  │  ┌────────────────┐  │ │                                 │
│  │  │ ************   │  │ │                                 │
│  │  └────────────────┘  │ │                                 │
│  │  ☐ Recuérdame        │ │                                 │
│  │  ¿Olvidaste?         │ │                                 │
│  │                      │ │                                 │
│  │  [ENTRAR A LA        │ │                                 │
│  │   CARNICERÍA]        │ │                                 │
│  │                      │ │                                 │
│  │  ─── o ────         │ │                                 │
│  │  [Google] [Facebook] │ │                                 │
│  │                      │ │                                 │
│  │  ¿No tienes cuenta?  │ │                                 │
│  │  Regístrate →        │ │                                 │
│  └──────────────────────┘ │                                 │
└────────────────────────────┴─────────────────────────────────┘

MODO REGISTRO (panel deslizado):
┌────────────────────────────┬─────────────────────────────────┐
│  ┌──────────────────────┐  │                                 │
│  │  [carniRegistro.png] │  │                                 │
│  │   Don Carlos         │  │                                 │
│  │                      │  │                                 │
│  │  Nombre completo     │  │                                 │
│  │  Correo electrónico  │  │                                 │
│  │  Teléfono (10 dígitos)│                                 │
│  │  Contraseña         │  │                                 │
│  │  Confirmar          │  │                                 │
│  │  ☐ Términos         │  │                                 │
│  │                      │  │                                 │
│  │  [CREAR MI CUENTA]   │  │                                 │
│  │                      │  │                                 │
│  │  ¿Ya tienes cuenta?  │  │                                 │
│  │  Inicia sesión →     │  │                                 │
│  └──────────────────────┘  │                                 │
└────────────────────────────┴─────────────────────────────────┘
```

### 4. DASHBOARD ADMIN (dashboar.html)

```
┌──────────────┬──────────────────────────────────────────────┐
│ SIDEBAR      │  TOP BAR: 🔍 Buscar...  🔔(3)  👤 Admin    │
│ (#363432)    ├──────────────────────────────────────────────┤
│              │                                              │
│  🏠 Dashboard│  DASHBOARD                                  │
│              │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐│
│  📦 Productos│  │Ventas  │ │Pedidos │ │Clientes│ │Puntos││
│              │  │$24,500 │ │   8    │ │  12    │ │1,256 ││
│  📋 Pedidos  │  │ ↑12%   │ │ Activos│ │ Nuevos │ │Fidel.││
│   (badge 3)  │  └────────┘ └────────┘ └────────┘ └──────┘│
│              │                                              │
│  👥 Clientes │  GRÁFICAS:                                  │
│              │  ┌──────────────────────────────────────┐   ││
│  🎁 Promos  │  │ Ventas 30 días (línea)              │   ││
│              │  │ ████                                │   ││
│  📢 Campañas│  │      ████                           │   ││
│              │  │          ████                       │   ││
│  🤖 Bots    │  └──────────────────────────────────────┘   ││
│              │  ┌─────────────────┐                     ││
│  📈 Reportes│  │Top 5 Productos  │                     ││
│              │  │   (dona)        │                     ││
│  ⚙️ Config  │  └─────────────────┘                     ││
│              ├──────────────────────────────────────────────┤
│              │  ÚLTIMOS PEDIDOS                           │
│              │  ┌──────────────────────────────────────┐   │
│              │  │ ID│Cliente│Items│Total│Status│Acción│  │
│              │  │001│ Juan  │Asado│$450 │🟡 Pen│[Telegram]││
│              │  │002│ María │Tbone│$620 │🟢 Val│[Listo] ││
│              │  │003│ Pedro │Ribey│$780 │🔴 Can│[Borrar]││
│              │  └──────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────┘
```

---

## SEO REQUERIDO (todas las páginas)

### Meta tags index.html:
```html
<title>Cortes Premium a Tu Puerta | Carnicería El Señor de La Misericordia - SLP</title>
<meta name="description" content="🥩 Carnicería premium en San Luis Potosí. Arrachera $289/kg, Ribeye $399/kg, T-Bone $349/kg. Delivery gratis en pedidos +$500. Tel: 444-271-5470">
<meta name="keywords" content="carnicería, carne fresca, cortes premium, arrachera, ribeye, San Luis Potosí, delivery, carnicería SLP">
```

### Schema.org LocalBusiness:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Carnicería El Señor de La Misericordia",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Agua Marina 110, Manuel J. Othon",
    "addressLocality": "San Luis Potosí",
    "addressRegion": "S.L.P.",
    "postalCode": "78150",
    "addressCountry": "MX"
  },
  "telephone": "+524442715470",
  "priceRange": "$$$",
  "openingHours": "Mo-Sa 08:00-17:00"
}
</script>
```

### Open Graph:
```html
<meta property="og:title" content="Cortes Premium a Tu Puerta | Carnicería El Señor de La Misericordia">
<meta property="og:description" content="Los mejores cortes de carne fresca delivering a San Luis Potosí.">
<meta property="og:image" content="img/recursos_web/logo-user.png">
<meta property="og:type" content="business.business">
```

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Layout |
|------------|--------|
| 320px | Mobile pequeño, stack vertical |
| 570px | Mobile grande, 2 cols grid |
| 768px | Tablet, sidebar visible |
| 870px | Split layout auth disponible |
| 1024px+ | Desktop completo, 4 cols grid |

---

## DISEÑO REGLAS

- **Cards**: border-radius: 12-16px, box-shadow suave
- **Hover**: scale(1.03), transición 300ms
- **Botón primario**: bg-#DC2626, text-white, padding 12px 24px
- **Botón secundario**: bg-#F59E0B, text-#363432
- **Iconos**: Bootstrap Icons o Lucide
- **Animaciones**: AOS (fade-up, fade-in)

---

## LO QUE NO DEBES HACER

❌ NO agregar elementos de tracking de delivery
❌ NO agregar sistemas de reseñas con estrellas en admin
❌ NO cambiar los logos o imágenes de Don Carlos
❌ NO usar colores pastel o neón
❌ NO agregar animaciones 3D o parallax
❌ NO inventar productos o precios

---

## STACK DESTINO

- HTML5 semántico
- CSS: SCSS 7-1 o Tailwind CDN
- JS: Vanilla o Alpine.js
- Fonts: Poppins + Inter (Google Fonts)
- Icons: Bootstrap Icons
- No requiere build tools para prototipado

---

## SALIDA ESPERADA

1. **index.html** - Landing page completa con SEO
2. **products.html** - Catálogo con filtros y carrito
3. **accessweb.html** - Login/registro con Don Carlos
4. **dashboar.html** - Dashboard admin con sidebar

Cada archivo debe:
- Ser standalone (CSS inline o CDN)
- Funcionar al abrir directamente en navegador
- Ser responsive en todos los breakpoints
- Tener SEO básico

---

## FORMATO DE ENTREGA

Genera los archivos HTML con:
- CSS embebido en `<style>`
- JS embebido en `<script>`
- CDN para dependencias (Tailwind, Alpine, Bootstrap, Fonts)

Esto permite abrir directamente sin servidor.
