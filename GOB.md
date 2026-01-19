# 🤖 GOB.md - Guía Operativa para Agentes IA

## Carnicería El Señor de La Misericordia - E-commerce PWA

[![Estado](https://img.shields.io/badge/Estado-Producción-green)](https://github.com)
[![Version](https://img.shields.io/badge/GOB.md-v9.0-blue)](https://github.com)
[![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20SCSS%207--1%20%7C%20Supabase-green)](https://github.com)
[![Mobile-First](https://img.shields.io/badge/Mobile--First-320px→768px→1024px-brightgreen)](https://github.com)
[![Arquitectura](https://img.shields.io/badge/Arquitectura-Screaming%20Architecture-purple)](https://blog.cleancoder.com)

---

## 📖 Índice

1. [Contexto del Proyecto](#contexto-del-proyecto)
2. [Arquitectura Screaming Architecture](#arquitectura-screaming-architecture)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Reglas para Agentes IA](#reglas-para-agentes-ia)
5. [Prohibiciones Explícitas](#prohibiciones-explícitas)
6. [Guía de Estilos](#guía-de-estilos)
7. [Seguridad OWASP](#seguridad-owasp)
8. [Componentes Principales](#componentes-principales)
9. [Checklist Pre-Commit](#checklist-pre-commit)

---

## Contexto del Proyecto

**Proyecto**: E-commerce PWA para carnicería local con enfoque mobile-first, seguridad OWASP, soporte offline y programa de fidelización.

| Aspecto | Detalles |
|---------|----------|
| **Framework** | Vanilla JavaScript (ES6+), Bootstrap 5, SCSS 7-1 Pattern |
| **Backend** | Supabase (PostgreSQL + RLS + Autenticación) |
| **HTTP Client** | Axios (async/await) |
| **Tipografía** | Poppins (formularios), Roboto (body) |
| **Colores** | Variables en `abstracts/_variables.scss` |
| **Breakpoints** | Mobile 320px → Tablet 768px → Desktop 1024px+ |
| **Carrito** | Modal reutilizable en `components/_modals.scss` + `core/cart.js` |
| **Seguridad** | OWASP validaciones, tokens, RLS Supabase |

---

## Arquitectura Screaming Architecture

### Principios Aplicados

La estructura del proyecto "grita" su propósito de negocio:

```
📁 tagsCore/           → Vistas del negocio (Home, Productos, Auth, Admin)
📁 js/modules/core/    → Lógica de negocio (auth, cart, productos)
📁 js/modules/pages/   → Controladores por vista
📁 js/modules/ui/      → Componentes de interfaz
📁 css/pages/          → Estilos por dominio
```

### Beneficios

- ✅ Onboarding rápido: estructura autoexplicativa
- ✅ Mantenimiento seguro: cambios aislados por dominio
- ✅ Escalabilidad: cada feature crece independiente
- ✅ Testing sencillo: módulos desacoplados

---

## Estructura del Proyecto

```
Carni-mvp/
│
├── 📄 GOB.md                    # Esta guía operativa
├── 📄 README.md                 # Documentación para desarrolladores
├── 📄 manifest.json             # Configuración PWA
├── 📄 netlify.toml              # Configuración deploy
├── 📄 package.json              # Dependencias npm
├── 📄 vite.config.js            # Configuración Vite
│
├── 📁 tagsCore/                 # VISTAS PRINCIPALES
│   ├── 📄 index.html            # Landing page
│   ├── 📄 products.html         # Catálogo de productos
│   ├── 📄 offline.html          # Página offline PWA
│   ├── 📁 admin/
│   │   └── 📄 dashboar.html     # Dashboard administrador
│   └── 📁 user/
│       └── 📄 accessweb.html    # Login/Registro unificado
│
├── 📁 css/                      # ESTILOS SCSS 7-1 PATTERN
│   ├── 📄 styles.scss           # Archivo principal
│   ├── 📄 styles.css            # CSS compilado
│   ├── 📁 abstracts/            # Variables, mixins, funciones
│   ├── 📁 base/                 # Reset, tipografía, utilidades
│   ├── 📁 components/           # Botones, cards, modales, formularios
│   ├── 📁 layout/               # Header, footer, sidebar
│   ├── 📁 pages/                # Estilos por página (_access.scss, _home.scss)
│   ├── 📁 themes/               # Temas (dark mode)
│   └── 📁 vendors/              # Bootstrap overrides
│
├── 📁 js/modules/               # LÓGICA JAVASCRIPT ES6
│   ├── 📄 supabase.js           # Cliente Supabase
│   ├── 📁 core/                 # Lógica de negocio
│   │   ├── 📄 auth.js           # Autenticación + sliding panel
│   │   ├── 📄 cart.js           # Carrito de compras
│   │   ├── 📄 productos.js      # Gestión de productos
│   │   ├── 📄 delivery.js       # Opciones de entrega
│   │   ├── 📄 loyalty.js        # Programa de fidelización
│   │   └── 📄 search.js         # Búsqueda de productos
│   ├── 📁 pages/                # Controladores por página
│   │   ├── 📄 catalog.js
│   │   ├── 📄 dashboard.js
│   │   └── 📄 checkout.js
│   ├── 📁 ui/                   # Componentes UI
│   │   ├── 📄 header.js         # Header + drawer móvil
│   │   ├── 📄 notifications.js
│   │   └── 📄 search.js
│   └── 📁 utils/                # Utilidades
│       ├── 📄 offline.js
│       └── 📄 service-worker.js
│
└── 📁 img/                      # RECURSOS GRÁFICOS
    ├── 📁 recursos_web/         # Logos e imágenes de auth
    │   ├── 📄 carniLogin.png
    │   ├── 📄 carniRegistro.png
    │   └── 📄 logo-user.png
    ├── 📁 products/             # Imágenes de productos
    └── 📁 carrusel_products/    # Imágenes del carrusel
```

---

## Reglas para Agentes IA

### 1. Antes de Crear Archivos

```bash
# Verificar si ya existe
grep -r "nombre-archivo" . --include="*.html" --include="*.js" --include="*.scss"

# Identificar dominio según Screaming Architecture
# ¿Es Auth? → js/modules/core/auth.js, css/pages/_access.scss
# ¿Es UI? → js/modules/ui/, css/components/
# ¿Es página? → tagsCore/, js/modules/pages/, css/pages/
```

### 2. Antes de Renombrar Archivos

```bash
# OBLIGATORIO: Buscar TODAS las referencias
grep -r "nombre-antiguo" tagsCore/ --include="*.html"
grep -r "nombre-antiguo" js/ --include="*.js"
grep -r "nombre-antiguo" css/ --include="*.scss"

# Actualizar TODAS las referencias encontradas
# Compilar SCSS después del cambio
# Verificar en navegador sin errores 404
```

### 3. Nomenclatura Obligatoria

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| SCSS | `_nombre-dominio.scss` | `_access.scss`, `_home.scss` |
| JS módulos | `nombreDominio.js` | `auth.js`, `cart.js` |
| HTML | `nombre-dominio.html` | `accessweb.html`, `products.html` |
| Imágenes | `nombreDescriptivo.png` | `carniLogin.png` |

### 4. Mobile-First Obligatorio

```scss
// ✅ CORRECTO
.elemento {
  padding: 1rem;                    // Mobile (320px)
  
  @media (min-width: 768px) {
    padding: 2rem;                  // Tablet
  }
  
  @media (min-width: 1024px) {
    padding: 3rem;                  // Desktop
  }
}

// ❌ INCORRECTO - Desktop first
.elemento {
  padding: 3rem;
  @media (max-width: 768px) { padding: 1rem; }
}
```

### 5. Variables SCSS Obligatorias

```scss
// ✅ CORRECTO - Usar variables
.boton {
  background: $color-primary;
  color: $color-text-light;
  border-radius: $border-radius-pill;
}

// ❌ INCORRECTO - Hardcode
.boton {
  background: #d9534f;
  color: #fff;
}
```

---

## Prohibiciones Explícitas

| # | Prohibición | Razón | Hacer en su lugar |
|---|-------------|-------|-------------------|
| 1 | Crear archivos `.css` puro | Rompe patrón 7-1 | Todo en `.scss` |
| 2 | Eliminar elementos HTML sin verificar | Pérdida de funcionalidad | Buscar dependencias primero |
| 3 | Usar `style=""` inline | Violación BEM | Usar clases SCSS |
| 4 | Duplicar elementos existentes | Redundancia | Verificar si existe |
| 5 | Ignorar mobile-first | UX rota en móviles | Siempre 320px primero |
| 6 | Hardcode de colores/tamaños | Inconsistencia | Usar `_variables.scss` |
| 7 | No compilar SCSS | CSS roto | `npx sass css/styles.scss css/styles.css` |
| 8 | No actualizar documentación | Contexto perdido | Actualizar GOB.md y README.md |
| 9 | Renombrar sin buscar referencias | Links rotos | `grep -r` obligatorio |
| 10 | Crear fuera de estructura | Arquitectura inconsistente | Respetar Screaming Architecture |

---

## Guía de Estilos

### Colores del Proyecto

```scss
// abstracts/_variables.scss
$color-primary: #d9534f;        // Rojo carnicería
$color-primary-dark: #c9302c;   // Rojo oscuro (hover)
$color-accent: #ff6d00;         // Naranja (acentos)
$color-text-dark: #212121;      // Texto principal
$color-text-light: #ffffff;     // Texto sobre fondos oscuros
$color-bg-light: #f5f5f5;       // Fondo claro
$color-bg-dark: #363432;        // Fondo oscuro (footer)
```

### Breakpoints

```scss
$breakpoint-mobile: 320px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;
$breakpoint-wide: 1200px;
```

### Metodología BEM

```scss
// Bloque
.auth-container { }

// Elemento
.auth-container__form { }
.auth-container__title { }

// Modificador
.auth-container--sign-up-mode { }
.btn--transparent { }
```

---

## Seguridad OWASP

### Validación Frontend

```javascript
// Validaciones obligatorias antes de enviar a backend
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
const isValidPassword = (pass) => pass.length >= 8;

// Sanitización anti-XSS
function sanitizeInput(str) {
  return str.replace(/[<>\"\']/g, '').trim();
}
```

### Reglas de Seguridad

1. **No exponer datos sensibles** en frontend
2. **Validar en frontend Y backend** (doble validación)
3. **Usar RLS de Supabase** para control de acceso
4. **No almacenar contraseñas** en localStorage
5. **Tokens de sesión** manejados por Supabase Auth

---

## Componentes Principales

### 1. Sistema de Autenticación (accessweb.html)

**Archivos involucrados:**
- `tagsCore/user/accessweb.html` - Vista HTML
- `css/pages/_access.scss` - Estilos con sliding panel
- `js/modules/core/auth.js` - Lógica de autenticación

**IDs críticos (NO MODIFICAR):**
- `authContainer` - Contenedor principal
- `btnShowRegister` - Botón para mostrar registro
- `btnShowLogin` - Botón para mostrar login
- `loginForm` - Formulario de login
- `registerForm` - Formulario de registro

**Efecto sliding panel:**
```javascript
// Activar modo registro
container.classList.add('sign-up-mode');

// Volver a modo login
container.classList.remove('sign-up-mode');
```

### 2. Carrito de Compras

**Archivos involucrados:**
- `css/components/_modals.scss` - Estilos del modal
- `js/modules/core/cart.js` - Lógica completa

**Funcionalidades:**
- ✅ Agregar/modificar/eliminar productos
- ✅ Cálculo de totales dinámico
- ✅ Selector de entrega (Recoger/Delivery)
- ✅ Persistencia en localStorage
- ✅ Sincronización con Supabase

### 3. Header Responsive

**Archivos involucrados:**
- `css/layout/_header.scss` - Estilos
- `js/modules/ui/header.js` - Lógica del drawer

**Características:**
- Logo centrado
- Iconos redondos (carrito, usuario)
- Drawer móvil con categorías
- Barra de búsqueda (solo en index y products)

---

## Checklist Pre-Commit

### Antes de escribir código

- [ ] Leí GOB.md completo
- [ ] Identifiqué archivo correcto según estructura
- [ ] Verifiqué que no existe duplicado

### Durante el código

- [ ] Usé SCSS (no CSS puro)
- [ ] Importé variables de `abstracts/_variables.scss`
- [ ] Apliqué mobile-first (320px → 768px → 1024px)
- [ ] Seguí BEM para clases CSS
- [ ] No usé estilos inline
- [ ] Validé seguridad OWASP si aplica

### Después del código

- [ ] Compilé SCSS sin errores
- [ ] Probé en navegador (sin errores en consola)
- [ ] Testeé responsive: 320px, 768px, 1024px
- [ ] Verifiqué que no rompí funcionalidades existentes
- [ ] Actualicé documentación si aplica

---

## Comandos Útiles

```bash
# Compilar SCSS
npx sass css/styles.scss css/styles.css --no-source-map

# Compilar con watch
npx sass css/styles.scss css/styles.css --watch

# Buscar referencias antes de renombrar
grep -r "nombre-archivo" . --include="*.html" --include="*.js" --include="*.scss"

# Iniciar servidor de desarrollo
npx vite --port 3002
```

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| v9.0 | 2026-01-19 | Screaming Architecture, reglas IA, limpieza duplicados |
| v8.4 | 2026-01-09 | Auth unificado, header mejorado |
| v8.0 | 2026-01-08 | Bento grid, productos, carrito funcional |

---

**Última actualización**: 19 de enero 2026  
**Versión**: GOB.md v9.0  
**Estado**: ✅ PRODUCCIÓN - Estructura limpia
