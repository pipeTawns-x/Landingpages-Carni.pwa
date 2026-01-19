# 🥩 Carnicería El Señor de La Misericordia - E-commerce PWA

> **Plataforma de comercio electrónico moderna para carnicería local con arquitectura modular, seguridad OWASP y experiencia mobile-first offline-capable.**

[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-blue?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Architecture](https://img.shields.io/badge/Architecture-SCSS%207--1%20%2B%20Vanilla%20JS%20Modules-green?style=flat-square)](https://sass-guidelin.es)
[![Mobile--First](https://img.shields.io/badge/Mobile--First-320px%E2%86%92768px%E2%86%921024px-brightgreen?style=flat-square)](https://web.dev/mobile-first)
[![Security](https://img.shields.io/badge/Security-OWASP%20Top%2010-red?style=flat-square)](https://owasp.org)
[![Backend](https://img.shields.io/badge/Backend-Supabase%20%7C%20PostgreSQL-purple?style=flat-square)](https://supabase.com)
[![Performance](https://img.shields.io/badge/Performance-Lighthouse%20%3E95-yellow?style=flat-square)](https://web.dev/lighthouse)

---

## 🚀 Inicio Rápido (3 Pasos)

```bash
# 1️⃣ Clonar repositorio
git clone [repository-url]
cd Carni-mvp

# 2️⃣ Instalar dependencias
npm install

# 3️⃣ Desarrollo local
npm run dev
# Abre http://127.0.0.1:3002/tagsCore/index.html
# O usa "Go Live" en VS Code (puerto 3002)
```

**Nota**: El proyecto está configurado con Supabase. Las credenciales están en `.env.local` (ver sección [Configuración de Supabase](#-configuración-de-supabase)).

---

## 📋 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido-3-pasos)
- [✨ Características Principales](#-características-principales)
- [🏗️ Arquitectura del Proyecto](#️-arquitectura-del-proyecto)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📁 Estructura de Carpetas](#-estructura-de-carpetas)
- [💻 Documentación del Código](#-documentación-del-código)
- [🔒 Seguridad Implementada](#-seguridad-implementada)
- [⚙️ Configuración & Scripts](#️-configuración--scripts)
- [📱 Mobile-First Responsiveness](#-mobile-first-responsiveness)
- [📝 Historial de Desarrollo](#-historial-de-desarrollo)
- [🤖 Para Desarrolladores & Agentes IA](#-para-desarrolladores--agentes-ia)
- [👥 Equipo de Desarrollo](#-equipo-de-desarrollo)

---

## ✨ Características Principales

| Módulo                            | Estado      | Descripción                                                                     |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| **🛍️ Catálogo Mobile-First**      | ✅ Completo | Navegación táctil, búsqueda real-time, 9 categorías + placeholders hype         |
| **🛒 Carrito Modal Reutilizable** | ✅ Completo | Personalización peso/piezas, ticket, delivery options, localStorage + Supabase  |
| **📦 Gestión de Pedidos**         | ✅ Completo | Cálculos automáticos, confirmación ticket, tracking delivery                    |
| **💎 Programa Fidelización**      | ✅ Completo | Acumulación puntos, niveles (Bronce/Plata/Oro), descuentos automáticos          |
| **👨‍💼 Admin Dashboard**            | ✅ Completo | Chart.js métricas ventas, gestión inventario, reportes BI                       |
| **🔐 Autenticación Segura**       | ✅ Completo | OWASP validaciones, OTP, RLS Supabase, tokens seguros                           |
| **📲 PWA Offline**                | ✅ Completo | Service Worker, caching inteligente, modo offline funcional                     |
| **🎨 Diseño Premium**             | ✅ Completo | Melvis One (títulos), Roboto (body), transiciones suaves, bento grid responsive |

---

## 🏗️ Arquitectura del Proyecto

### Patrón 7-1 SCSS + Vanilla JS Modular

```
Frontend (Cliente)
    ↓
[SCSS 7-1 Pattern] ← Estilos modulares, variables, mixins
    ↓
[Vanilla JS Modules] ← core (lógica), pages (vistas), ui (componentes)
    ↓
[Bootstrap 5 Grid] ← Componentes base responsivos
    ↓
[Supabase Backend] ← PostgreSQL, RLS, autenticación
    ↓
[External APIs] ← Axios: pagos, clima, delivery
```

**Principios Clave**:

- ✅ **Mobile-First** (320px → 768px → 1024px)
- ✅ **OWASP Seguridad** (validaciones, tokens, sanitización)
- ✅ **BEM Nomenclatura** (`.elemento__parte--estado`)
- ✅ **Modular Reutilizable** (sin duplicación)
- ✅ **Offline-Capable** (Service Worker + caching)
- ✅ **Código Humanizado** (comentarios JSDoc, nombres descriptivos)

---

## 🛠️ Stack Tecnológico

| Capa              | Tecnología              | Versión      | Propósito                                 |
| ----------------- | ----------------------- | ------------ | ----------------------------------------- |
| **Frontend**      | Vanilla JavaScript ES6+ | Latest       | Lógica modular sin frameworks pesados     |
| **Estilos**       | SCSS 7-1 Pattern        | 1.69+        | Arquitectura escalable, variables, mixins |
| **Componentes**   | Bootstrap 5             | 5.3.7        | Grid responsivo, componentes UI base      |
| **Backend**       | Supabase (PostgreSQL)   | Latest       | BaaS, autenticación, RLS, real-time       |
| **HTTP Client**   | Axios                   | 1.6+         | Requests async, error handling robusto    |
| **Visualización** | Chart.js                | 4.4+         | Gráficos BI (ventas, engagement, stock)   |
| **Iconos**        | Bootstrap Icons         | 1.10+        | Iconografía consistente                   |
| **Tipografía**    | Melvis One, Roboto      | Google Fonts | Títulos audaces, body fluido              |

---

## 📁 Estructura de Carpetas

```
Carni-mvp/
├── 🎨 css/ ← SCSS 7-1 Pattern (SOLO .scss, NO .css puro)
│   ├── abstracts/ (variables, mixins, functions)
│   │   ├── _variables.scss (colores, breakpoints, espacios)
│   │   ├── _mixins.scss (@include respond-to, utilidades)
│   │   ├── _functions.scss (cálculos dinámicos)
│   │   ├── _bem-utilities.scss (nomenclatura BEM)
│   │   └── _placeholders.scss (extends reutilizables)
│   ├── base/ (reset, tipografía, base)
│   ├── layout/ (header, footer, sidebar, auth-layout)
│   ├── components/ ← AQUÍ: _navigation.scss, _forms.scss, _modals.scss
│   ├── pages/ (estilos por página)
│   ├── themes/ (dark mode, brand colors)
│   ├── vendors/ (bootstrap overrides, librerías externas)
│   ├── styles.scss (orquestación imports)
│   └── styles.css (compilado, NO editar)
│
├── 🎯 js/
│   ├── app.js (punto entrada, inicialización)
│   └── modules/
│       ├── core/ (lógica negocio)
│       │   ├── api.js (Axios Supabase)
│       │   ├── auth.js (autenticación + OTP)
│       │   ├── cart.js (carrito modal) ⭐ DOCUMENTADO
│       │   ├── productos.js (gestión catálogo)
│       │   ├── delivery.js (cálculo rutas)
│       │   ├── loyalty.js (fidelización)
│       │   └── search.js (búsqueda indexada)
│       ├── pages/ (por vista)
│       │   ├── catalog.js (products.html)
│       │   ├── checkout.js (finalizacion)
│       │   ├── dashboard.js (admin BI)
│       │   └── premium.js (área premium)
│       ├── ui/ (componentes reutilizables)
│       │   ├── header.js (navegación)
│       │   ├── notifications.js (alertas)
│       │   └── ui.js (helpers UI)
│       └── utils/ (helpers sistema)
│           ├── offline.js (estado offline)
│           ├── service-worker.js (PWA caching)
│           ├── base_dinamica.js (datos productos)
│           └── weather.js (API clima)
│
├── 📄 tagsCore/ (HTML pages)
│   ├── index.html (landing, SEO optimizado)
│   ├── products.html (catálogo dinámico)
│   ├── offline.html (PWA offline)
│   ├── admin/
│   │   └── dashboar.html (métricas - NO login/register público)
│   └── user/
│       ├── accessweb.html (login/registro unificado con sliding effect)
│       └── profile.html (perfil usuario)
│
├── 🖼️ img/ (recursos multimedia)
│   ├── products/ (9 categorías)
│   └── carrusel_products/ (cortes premium)
│
├── 🔧 Configuración
│   ├── manifest.json (PWA config)
│   ├── netlify.toml (deployment)
│   ├── package.json (dependencias)
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── .env (variables entorno)
│   └── .gitignore
│
├── 📚 Documentación
│   ├── README.md (este archivo, para developers)
│   └── GOB.md (para agentes IA)
│
└── 🚀 dist/ (build producción)
```

---

## 💻 Documentación del Código

### 🛒 Sistema de Carrito (`js/modules/core/cart.js`)

El módulo de carrito es uno de los componentes más importantes del proyecto. Gestiona todo el flujo de compra del usuario.

#### **Arquitectura**

```javascript
/**
 * Sistema de Carrito de Compras - IIFE Pattern
 * Encapsula toda la lógica del carrito sin contaminar el scope global
 */
(function () {
  // Constantes y funciones privadas
  const LS_KEY = "carni_cart_v1";

  // API pública expuesta
  window.CarniCart = {
    addItem,
    renderCartModal,
    updateBadge,
    loadCart,
    saveCart,
  };
})();
```

#### **Funciones Principales**

##### `loadCart()`

```javascript
/**
 * Carga el carrito desde localStorage
 * @returns {Array} Array de productos en el carrito
 */
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch (e) {
    console.warn("Error al cargar carrito desde localStorage:", e);
    return [];
  }
}
```

**Uso**: Se llama automáticamente al renderizar el modal o actualizar el badge.

##### `saveCart(cart)`

```javascript
/**
 * Guarda el carrito en localStorage y dispara evento de actualización
 * @param {Array} cart - Array de productos a guardar
 */
function saveCart(cart) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cart));
    window.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: { count: (cart || []).length },
      })
    );
  } catch (e) {
    console.error("Error al guardar carrito en localStorage:", e);
  }
}
```

**Eventos**: Dispara `cart:updated` para notificar cambios a otros módulos.

##### `addItem(item)`

```javascript
/**
 * Agrega un producto al carrito y abre el modal automáticamente
 * @param {Object} item - Objeto del producto a agregar
 * @param {string} item.id - ID único del producto
 * @param {string} item.name - Nombre del producto
 * @param {number} item.price - Precio unitario
 * @param {string} item.tipo - Tipo: 'kg', 'corte', 'unidad', 'paquete'
 */
function addItem(item) {
  const cart = loadCart();
  cart.push(item);
  saveCart(cart);
  updateBadge();

  // Abrir modal automáticamente después de agregar
  setTimeout(() => {
    const cartModalEl = document.getElementById("cartModal");
    if (cartModalEl && typeof bootstrap !== "undefined") {
      const cartModal = bootstrap.Modal.getOrCreateInstance(cartModalEl);
      cartModal.show();
    }
  }, 100);
}
```

**Características**:

- Agrega producto al array del carrito
- Guarda en localStorage
- Actualiza badge del contador
- Abre modal automáticamente (UX mejorada)

##### `renderCartModal()`

```javascript
/**
 * Renderiza el contenido del modal del carrito
 * Genera la interfaz completa con productos, controles y resumen
 */
function renderCartModal() {
  // 1. Cargar carrito
  // 2. Validar contenedor
  // 3. Mostrar mensaje vacío si no hay productos
  // 4. Renderizar cada producto con controles dinámicos
  // 5. Calcular subtotal y total
  // 6. Bind event listeners para controles
}
```

**Controles Dinámicos**:

- **Peso (kg)**: Para productos `tipo === 'kg' || tipo === 'corte'`
- **Piezas**: Para productos `tipo === 'unidad' || tipo === 'paquete'`
- **Grosor (pulgadas)**: Slider para productos `tipo === 'corte'`

**Cálculos**:

- Para cortes premium: `peso = basePeso * grosor`
- Total item: `precio * cantidad`
- Subtotal: Suma de todos los items
- Total: Subtotal + costo de entrega

##### `updateBadge()`

```javascript
/**
 * Actualiza el badge del contador de productos en el header
 * Calcula el total de items considerando piezas para productos por unidad
 */
function updateBadge() {
  const cart = loadCart();
  const badgeEls = document.querySelectorAll(
    ".cart-counter, .main-header__cart-count"
  );

  badgeEls.forEach((badge) => {
    const totalItems = cart.reduce((sum, item) => {
      if (item.tipo === "unidad" || item.tipo === "paquete") {
        return sum + (item.piezas || 1);
      }
      return sum + 1;
    }, 0);
    badge.textContent = totalItems;
  });
}
```

#### **Event Listeners**

##### Modal Bootstrap

```javascript
// Renderizar cuando se abre
modalEl.addEventListener("shown.bs.modal", () => {
  renderCartModal();
});

// CORRECCIÓN DE BUG: Restaurar funcionalidad del body al cerrar
modalEl.addEventListener("hidden.bs.modal", () => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.classList.remove("modal-open");
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) backdrop.remove();
});
```

**Bug Corregido**: Bootstrap agrega clases y estilos que bloquean el scroll. Este listener los restaura correctamente.

#### **Estructura de Datos del Carrito**

```javascript
const item = {
  id: "bisteck_res", // ID único del producto
  name: "Bisteck de Res", // Nombre para mostrar
  price: 180, // Precio unitario
  img: "../img/products/res.png", // Ruta de imagen
  categoria: "res", // Categoría del producto
  tipo: "kg", // 'kg', 'corte', 'unidad', 'paquete'
  peso: 1, // Peso en kg (si aplica)
  piezas: 1, // Cantidad de piezas (si aplica)
  grosor: 1.25, // Grosor en pulgadas (solo cortes)
  basePeso: 0.3, // Peso base para cortes premium
};
```

---

### 📦 Gestión de Productos (`js/modules/utils/base_dinamica.js`)

Contiene la base de datos de productos organizada por categorías.

#### **Estructura de Producto**

```javascript
const productos = {
  res: [
    {
      id: "bisteck_res",
      nombre: "Bisteck de Res",
      precioPorKg: 180,
      categoria: "res",
      tipo: "kg",
      imagen: "img/products/res.png",
    },
  ],
  // ... otras categorías
};
```

#### **9 Categorías Establecidas**

1. **res** - Cortes de res
2. **cerdo** - Cortes de cerdo
3. **pollo** - Productos de pollo
4. **embutidos** - Jamón, salchichas, chorizo
5. **preparadas** - Carnes preparadas y marinadas
6. **premium** - Cortes premium (con grosor personalizable)
7. **merch** - Merchandising (gorras, playeras, etc.)
8. **otros** - Otros productos
9. **ofertas** - Productos en oferta

---

### 🎨 Sistema de Estilos (SCSS 7-1 Pattern)

#### **Variables (`css/abstracts/_variables.scss`)**

```scss
// Colores principales
$color-primario: #363432;
$color-gold: #e4d1b0;
$color-danger: #dc3545;

// Breakpoints mobile-first
$breakpoint-mobile: 320px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;
```

#### **Mixins (`css/abstracts/_mixins.scss`)**

```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == "tablet" {
    @media (min-width: $breakpoint-tablet) {
      @content;
    }
  }
  @if $breakpoint == "desktop" {
    @media (min-width: $breakpoint-desktop) {
      @content;
    }
  }
}
```

**Uso**:

```scss
.producto-card {
  padding: 1rem;

  @include respond-to("tablet") {
    padding: 1.5rem;
  }

  @include respond-to("desktop") {
    padding: 2rem;
  }
}
```

---

## 🔒 Seguridad Implementada

### ✅ OWASP Top 10 Validaciones

| Vulnerabilidad                       | Validación                                    | Dónde                       |
| ------------------------------------ | --------------------------------------------- | --------------------------- |
| **A01: Injection**                   | Regex sanitización, prepared queries Supabase | js/modules/core/api.js      |
| **A02: Autenticación Débil**         | OTP, tokens JWT, RLS Supabase                 | auth.js + supabase config   |
| **A03: Broken Access Control**       | RLS roles (admin/premium/user), BAC           | dashboard.js + RLS policies |
| **A04: XML External Entities**       | No procesa XML externo                        | N/A (JSON solo)             |
| **A05: Broken Access Control**       | Validación frontend + backend RLS             | checkout.js + supabase      |
| **A06: Vulnerable Components**       | npm audit regular, librerías actualizadas     | package.json                |
| **A07: Auth & Session**              | Tokens seguros, logout, sesión expiración     | auth.js                     |
| **A08: Software & Data Integrity**   | Checksums, verificación integridad            | service-worker.js           |
| **A09: Logging & Monitoring**        | Logs auditables, errores registrados          | utils/admin-auth.js         |
| **A10: Server-Side Request Forgery** | Validación URLs, tokenización                 | api.js                      |

### 🔐 Validación Regex (Ejemplos)

```javascript
// ✅ Email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ✅ Teléfono (10 dígitos México)
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

// ✅ Nombre (solo letras y espacios)
const isValidName = (name) => /^[A-Za-záéíóúñÁÉÍÓÚÑ\s]{2,50}$/.test(name);

// ✅ Dirección (letras, números, caracteres básicos)
const isValidAddress = (addr) => /^(?=.*[0-9]).{10,100}$/.test(addr);
```

### 💳 Tokenización de Pagos

```javascript
// ✅ CORRECTO: Usar token, NO guardar tarjeta
const payment = {
  token: "stripe_tok_visa_...", // ✓ Token seguro
  amount: 999.99,
  currency: "MXN",
};

// ❌ INCORRECTO: NUNCA almacenar tarjeta
const payment = {
  cardNumber: "4111111111111111", // ✗ PROHIBIDO
  cvv: "123", // ✗ PROHIBIDO
  expiryDate: "12/25", // ✗ PROHIBIDO
};
```

---

## ⚙️ Configuración & Scripts

```bash
# Desarrollo local
npm run dev              # Servidor dev Vite
npm run scss:watch      # Compilación SCSS en tiempo real

# Producción
npm run build           # Build optimizado
npm run preview         # Vista previa build

# Testing & Validación
npm run lint            # ESLint (si existe)
npm run validate:html   # Validar HTML5
lighthouse ./           # Lighthouse score

# PWA
npm run service-worker  # Generar service worker
```

---

## 📱 Mobile-First Responsiveness

### Breakpoints Definidos

```scss
// abstracts/_variables.scss
$breakpoint-mobile: 320px; // iPhone SE, old android
$breakpoint-tablet: 768px; // iPad mini, tablets
$breakpoint-desktop: 1024px; // Desktop, laptops
$breakpoint-large: 1200px; // 4K, ultrawide

// Uso en componentes (mobile-first)
.producto-card {
  display: grid;
  grid-template-columns: 1fr; // Mobile: 1 columna

  @include respond-to("tablet") {
    grid-template-columns: repeat(2, 1fr); // Tablet: 2 columnas
  }

  @include respond-to("desktop") {
    grid-template-columns: repeat(3, 1fr); // Desktop: 3 columnas
  }
}
```

### Testing Responsive

```bash
# DevTools Responsive Design Mode (F12)
1. Abre navegador Dev Tools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Testea: 320px (mobile), 768px (tablet), 1024px (desktop)
4. Verifica: clicks, layouts, imágenes, modales
5. Console: ¿Sin errores rojos? ✅
```

---

## 📝 Historial de Desarrollo

### Sesión 1: Mejoras Responsive y Bento Grid (2026-01-08)

**Objetivo**: Corregir espacios en blanco y mejorar diseño responsive del bento grid.

**Cambios Implementados**:

- ✅ Eliminación de espacio entre header y título
- ✅ Bento grid rediseñado con CSS Grid Generator
- ✅ Espacios en blanco en desktop eliminados

**Archivos Modificados**:

- `css/pages/_bento-main.scss`
- `css/layout/_header.scss`
- `css/pages/_home.scss`

---

### Sesión 2: Web de Productos Completa (2026-01-09)

**Objetivo**: Crear página de productos completa con todas las funcionalidades del e-commerce.

**Cambios Implementados**:

- ✅ Header idéntico al principal
- ✅ Mini-header solo en products.html
- ✅ 9 categorías establecidas y completas
- ✅ Menú horizontal scrollable con botones
- ✅ Cards de productos consistentes
- ✅ Eliminación de pestañas redundantes
- ✅ Footer agregado
- ✅ Comunicación entre páginas con parámetros URL

**Archivos Modificados**:

- `tagsCore/products.html`
- `css/pages/_productos.scss`
- `js/modules/core/productos.js`
- `js/modules/utils/base_dinamica.js`

**Referencias**:

- CodePen: https://codepen.io/pipeTawns-x/pen/dPGYMxJ
- E-commerce: https://pipetawns-x.github.io/e-comerce/

---

### Sesión 3: Carrito Funcional Completo (2026-01-09)

**Objetivo**: Implementar carrito funcional completo con todas las funcionalidades del CodePen.

**Cambios Implementados**:

- ✅ Carrito reescrito completamente
- ✅ Modal automático al agregar productos
- ✅ Funcionalidades completas (modificar, eliminar, calcular)
- ✅ Bug corregido: web no se deshabilita al cerrar modal
- ✅ Código humanizado con comentarios JSDoc

**Archivos Modificados**:

- `js/modules/core/cart.js` (reescrito completamente)
- `tagsCore/products.html` (modal actualizado)
- `tagsCore/index.html` (modal actualizado)

**Funcionalidades Implementadas**:

- Agregar productos con modal automático
- Modificar peso/piezas/grosor en tiempo real
- Eliminar productos individuales
- Calcular totales dinámicos
- Selector de tipo de entrega
- Generar ticket de compra
- Vaciar carrito completo
- Persistencia en localStorage

---

## 🤖 Para Desarrolladores & Agentes IA

### 📖 Primero: Leer GOB.md

**GOB.md** es la guía completa para agentes IA:

- ✅ Prohibiciones explícitas (10 items)
- ✅ Errores anteriores & soluciones
- ✅ Checklist pre-commit
- ✅ Flujo correcto de mejoras
- ✅ Prompts específicos adaptados
- ✅ Historial de prompts y mejoras

**[👉 Leer GOB.md para trabajar con agentes IA](./GOB.md)**

### 🔄 Flujo Correcto de Cambios

```mermaid
1. 📖 LEER (GOB.md + archivo a modificar)
   ↓
2. 📋 ANALIZAR (¿existe? ¿rompe mobile? ¿OWASP?)
   ↓
3. ✏️ MODIFICAR (atómico, variables SCSS, BEM)
   ↓
4. 🧪 TESTEAR (mobile/tablet/desktop/console)
   ↓
5. 📚 DOCUMENTAR (GOB.md + README.md)
   ↓
6. ✅ COMMIT (mensaje claro, push)
```

---

## 👥 Equipo de Desarrollo

**Arquitecto Principal**: pipeTawns-x  
**Metodología**: Mobile First + Security by Design + BEM  
**Stack**: JavaScript Vanilla + SCSS 7-1 + Supabase  
**Estado**: ✅ **ARQUITECTURA FINAL IMPLEMENTADA**

---

## 📚 Recursos Adicionales

- **GOB.md**: Guía completa para agentes IA
- **CodePen Referencia**: https://codepen.io/pipeTawns-x/pen/dPGYMxJ
- **E-commerce Referencia**: https://pipetawns-x.github.io/e-comerce/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **SCSS 7-1 Pattern**: https://sass-guidelin.es/#architecture
- **BEM Methodology**: https://bem.info/en/

---

---

## 🐛 Correcciones de Bugs Recientes

### Bug: Modal Deshabilita Web (2026-01-09)

**Problema**: Al cerrar el modal del carrito, la web quedaba deshabilitada hasta hacer refresh.

**Solución**:

- Función `restoreBodyAfterModal()` que restaura el body múltiples veces
- Múltiples event listeners (`hidden.bs.modal`, `hide.bs.modal`, `window.load`)
- Intervalo de limpieza cada 500ms para estados residuales
- Backdrop cambiado de `static` a `true` para permitir cierre

### Bug: Carrito No Funciona en Index.html (2026-01-09)

**Problema**: El carrito no mostraba información en `index.html`.

**Solución**:

- Script `cart.js` agregado a `index.html`
- Sincronización entre páginas mediante `storage` events
- Badge actualizado automáticamente en ambas páginas

---

### Bug: Fallo Total en Products.html (2026-01-09)

**Problema**: La página de productos no se visualizaba correctamente en el navegador.

**Causa**:

- Import estático de módulo fallando (CORS o timing)
- Falta de manejo de errores
- JSON.stringify con caracteres especiales causando errores

**Solución**:

- Import dinámico con `await import()` para mejor compatibilidad
- Try-catch robusto en todas las funciones críticas
- Escape de caracteres especiales en JSON
- Validación de datos antes de procesar
- Múltiples intentos de inicialización

---

---

## 🔌 Configuración de Supabase

### Credenciales Configuradas

El proyecto está configurado con Supabase como backend. Las credenciales están configuradas en:

**Archivo `.env.local`** (no versionado):

```env
VITE_SUPABASE_URL=https://wlikxgklwutxxazbhmkv.supabase.co
VITE_SUPABASE_KEY=sb_publishable_cutr6jvyxlE6tikIfy20Vw_fa7eyeBO
```

**Fallback en `js/modules/supabase.js`**:

- Si las variables de entorno no están disponibles, usa valores por defecto
- Útil para desarrollo sin servidor o pruebas rápidas

### Pruebas de Conexión

Para probar la conexión con Supabase:

1. **Abrir página de prueba**:

   ```
   http://127.0.0.1:3002/test-supabase.html
   ```

2. **Verificar en consola del navegador**:

   - Deberías ver: `✅ Supabase configurado: { url: '...', keyPresent: true }`
   - Si hay errores, revisa las credenciales en Supabase Dashboard

3. **Verificar funcionalidades**:
   - Autenticación de usuarios
   - Consultas a base de datos (products, orders, profiles)
   - Storage de archivos
   - Real-time subscriptions

### Configuración del Servidor

**Vite Dev Server** (`vite.config.js`):

- Puerto: `3002`
- Host: `true` (accesible desde red local)
- Auto-open: `true`

**Iniciar servidor**:

```bash
npm run dev
# O usar "Go Live" en VS Code
```

**URLs de acceso**:

- Principal: `http://127.0.0.1:3002/tagsCore/index.html`
- Productos: `http://127.0.0.1:3002/tagsCore/products.html`
- Test Supabase: `http://127.0.0.1:3002/test-supabase.html`

### Seguridad

⚠️ **Importante**:

- `.env.local` está en `.gitignore` (no se sube a Git)
- Las credenciales en el código son solo para desarrollo
- En producción, usar solo variables de entorno del servidor
- Nunca commitear credenciales reales

---

---

### Mejoras de UI y Servidor (2026-01-09)

**Eliminación de Recursividad**:

- Removido menú dropdown duplicado de "Productos" del header
- Reemplazado por enlace simple para evitar duplicación con menú hamburger
- Todas las categorías siguen disponibles en el menú hamburger móvil

**Configuración Vite**:

- `vite.config.js` optimizado para servir desde `tagsCore/`
- Auto-open configurado para `index.html`
- CORS habilitado para desarrollo
- Puerto 3002 configurado

**Uso del Servidor**:

```bash
npm run dev
# Abre automáticamente: http://127.0.0.1:3002/tagsCore/index.html
```

---

**📅 Última Actualización**: 18 de enero 2026  
**📌 Versión**: README.md v3.0 - Sistema de Autenticación Unificado + Header Global Optimizado  
**✅ Estado**: LISTO PARA PRODUCCIÓN - 100% FUNCIONAL CON SLIDING EFFECT

---

## 🔐 Sistema de Autenticación Unificado (accessweb.html)

### Descripción General

El proyecto ha consolidado 4 páginas de autenticación en una sola página moderna con **efecto deslizante (sliding panel)** inspirado en las mejores prácticas de UX 2026.

**ANTES** (4 páginas):

- `tagsCore/user/login.html`
- `tagsCore/user/register.html`
- `tagsCore/admin/login.html` (ELIMINADO - riesgo seguridad)
- `tagsCore/admin/register.html` (ELIMINADO - riesgo seguridad)

**AHORA** (1 página unificada):

- `tagsCore/user/accessweb.html` - Login + Registro con sliding effect

### Características Principales

| Característica              | Descripción                                                    |
| --------------------------- | -------------------------------------------------------------- |
| **Sliding Panel Effect**    | Panel rojo deslizante que alterna entre login y registro       |
| **Responsive Total**        | Layout vertical en móvil (<870px), horizontal en desktop       |
| **Animaciones Suaves**      | Custom cubic-bezier, staggered animations, breathe effect      |
| **Imágenes Personalizadas** | `carniLogin.png` y `carniRegistro.png` con recorte inteligente |
| **Seguridad OWASP**         | Validaciones frontend, RLS backend, admin roles por Supabase   |
| **UX Premium**              | Transiciones fluidas, micro-interacciones en botones           |

### Arquitectura Técnica

#### Estructura DOM

```html
<div id="authContainer" class="auth-container">
  <div class="auth-form-box">
    <form class="auth-form--sign-in"><!-- Login --></form>
    <form class="auth-form--sign-up"><!-- Registro --></form>
  </div>
  <div class="auth-toggle-box">
    <div class="panel panel--left"><!-- Panel izquierdo --></div>
    <div class="panel panel--right"><!-- Panel derecho --></div>
  </div>
</div>
```

#### Lógica del Efecto Deslizante

```scss
// Estado inicial: Login visible
.auth-container {
  overflow: hidden; // CRÍTICO
}

// Estado activo: Registro visible
.auth-container.sign-up-mode {
  .auth-form-box {
    transform: translateX(-50%); // Mueve formularios
  }
  .auth-toggle-box {
    left: 0; // Panel rojo a la izquierda
  }
}
```

#### JavaScript (setupAuthToggle)

```javascript
function setupAuthToggle() {
  const container = document.getElementById("authContainer");
  const btnShowRegister = document.getElementById("btnShowRegister");
  const btnShowLogin = document.getElementById("btnShowLogin");

  // Validación exhaustiva
  if (!container || !btnShowRegister || !btnShowLogin) {
    console.error("❌ Elementos críticos no encontrados");
    return;
  }

  // Eventos
  btnShowRegister.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
  });

  btnShowLogin.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
  });
}
```

### IDs Críticos (NO MODIFICAR)

| ID                | Elemento               | Uso                         |
| ----------------- | ---------------------- | --------------------------- |
| `authContainer`   | Contenedor principal   | Toggle clase `sign-up-mode` |
| `btnShowRegister` | Botón "Crear cuenta"   | Activa modo registro        |
| `btnShowLogin`    | Botón "Iniciar sesión" | Activa modo login           |
| `loginForm`       | Formulario login       | Submit handler              |
| `registerForm`    | Formulario registro    | Submit handler              |

### Responsive Breakpoints

| Breakpoint      | Comportamiento                                    |
| --------------- | ------------------------------------------------- |
| **>870px**      | Layout horizontal, imágenes completas             |
| **570px-870px** | Imágenes reducidas con `clip-path`                |
| **<570px**      | Layout vertical, imágenes recortadas al carnicero |

### Imágenes Responsive

```scss
.panel .image {
  // Desktop: imagen completa
  @media (min-width: 871px) {
    max-width: 380px;
  }

  // Tablet: recorte intermedio
  @media (max-width: 870px) {
    max-width: 250px;
    clip-path: polygon(15% 10%, 85% 10%, 90% 70%, 10% 70%);
  }

  // Móvil: solo carnicero
  @media (max-width: 570px) {
    max-width: 180px;
    clip-path: polygon(20% 15%, 80% 15%, 85% 65%, 15% 65%);
  }
}
```

### Seguridad Implementada

1. **Validaciones Frontend**:

```javascript
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
const isValidPassword = (pass) => pass.length >= 8;
```

2. **Roles por Supabase**:

- ✅ Usuario común: Registro público desde `accessweb.html`
- ✅ Admin: Rol asignado MANUALMENTE en Supabase Dashboard
- ✅ Redirección automática según rol

3. **RLS (Row Level Security)**:

```sql
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

### Testing Checklist

- [ ] Efecto deslizante funciona (click en botones)
- [ ] Formularios envían a Supabase correctamente
- [ ] Validaciones frontend operativas
- [ ] Responsive en 320px, 768px, 1024px
- [ ] Console sin errores (DevTools F12)
- [ ] Imágenes cargan sin errores 404
- [ ] Redirección roles (admin → dashboard, user → index)
- [ ] OAuth funciona (Google, Facebook)

### Archivos Relacionados

- **HTML**: `tagsCore/user/accessweb.html`
- **SCSS**: `css/pages/_login.scss`, `css/layout/_auth-layout.scss`
- **JS**: `js/modules/core/auth.js` (función `setupAuthToggle`)
- **Imágenes**: `img/carniLogin.png`, `img/carniRegistro.png`

### Referencia de Diseño

- 🎥 **Video Codehal**: https://youtu.be/Z_AbWH-Vyl8
- 💡 **Concepto**: Sliding panel effect inspirado en diseños modernos
- 🎨 **Mejoras Grok**: Animaciones avanzadas, custom easing, staggered effects

---

## 🎨 Mejoras Globales del Header (Todas las Páginas)

### Iconos Redondos y Pequeños

**ANTES**: Iconos cuadrados/rectangulares, tamaño grande (`fs-4`)  
**AHORA**: Iconos redondos (`border-radius: 50%`), tamaño reducido (`40px`)

```html
<button class="header-icon-btn header-icon-btn--round" id="cartBtn">
  <i class="bi bi-cart3"></i>
  <span class="badge bg-danger rounded-pill">0</span>
</button>
```

```scss
.header-icon-btn--round {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
}
```

### Eliminación de Nav Links

**ANTES**: Links "Productos", "Sobre Nosotros", "Contacto" en header desktop  
**AHORA**: Links SOLO en `mobile-drawer` (hamburger)

**Beneficios**:

- ✅ Header minimalista
- ✅ Sin duplicación (header + drawer)
- ✅ Navegación unificada
- ✅ Menos código para mantener

### Barra de Búsqueda Selectiva

| Página           | Barra de Búsqueda | Funcionalidad            |
| ---------------- | ----------------- | ------------------------ |
| `index.html`     | ✅ Visible        | Redirige a products.html |
| `products.html`  | ✅ Visible        | Filtrado en tiempo real  |
| `accessweb.html` | ❌ Oculta         | No aplica                |
| `dashboar.html`  | ❌ Oculta         | No aplica                |

### Iconos Flotantes (accessweb.html)

Iconos posicionados al nivel del mini-header, lado izquierdo:

```scss
.main-header__icons-container--auth-level {
  position: fixed;
  top: 0;
  left: 1rem;
  z-index: 1036;
  background: rgba(217, 83, 79, 0.95);
  border-radius: 0 0 25px 25px;
  padding: 0.5rem 1rem;
}
```

### Resumen Visual

| Página           | Logo | Hamburger | Nav Links | Search | Carrito       | Usuario       |
| ---------------- | ---- | --------- | --------- | ------ | ------------- | ------------- |
| `index.html`     | ✅   | ✅        | ❌        | ✅     | ✅            | ✅            |
| `products.html`  | ✅   | ✅        | ❌        | ✅     | ✅            | ✅            |
| `accessweb.html` | ✅   | ✅        | ❌        | ❌     | ✅ (flotante) | ✅ (flotante) |
| `dashboar.html`  | ✅   | ✅        | ❌        | ❌     | ✅            | ❌            |

---
