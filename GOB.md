# 🤖 GOB.md - Guía Operativa Integral para Agentes IA

## Carnicería El Señor de La Misericordia - E-commerce PWA

[![Estado](https://img.shields.io/badge/Estado-Producción-green)](https://github.com)
[![Version](https://img.shields.io/badge/GOB.md-v8.0-blue)](https://github.com)
[![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20SCSS%207--1%20%7C%20Supabase-green)](https://github.com)
[![Mobile--First](https://img.shields.io/badge/Mobile--First-320px%E2%86%92768px%E2%86%921024px-brightgreen)](https://github.com)
[![Seguridad](https://img.shields.io/badge/Seguridad-OWASP%20Top%2010-red)](https://owasp.org)

---

### 📖 Índice Rápido

1. [Contexto Completo del Proyecto](#contexto-completo)
2. [⛔ Prohibiciones Explícitas](#prohibiciones-explícitas)
3. [🚨 Errores Anteriores & Soluciones](#errores-anteriores)
4. [✅ Checklist Pre-Commit](#checklist-pre-commit)
5. [🏗️ Estructura del Proyecto](#estructura-del-proyecto)
6. [🎯 Flujo Correcto de Mejoras](#flujo-correcto)
7. [🤖 Prompts Específicos](#prompts-específicos)
8. [📝 Historial de Prompts y Mejoras](#historial-de-prompts)
9. [🔍 Validación & Testing](#validación--testing)

---

### <a name="contexto-completo"></a>📋 Contexto Completo del Proyecto (LEER SIEMPRE ANTES DE MODIFICAR)

**PROYECTO**: E-commerce PWA carnicería local con enfoque mobile-first, seguridad OWASP, offline support y fidelización.

| Aspecto                    | Detalles                                                     |
| -------------------------- | ------------------------------------------------------------ |
| **Framework Principal**    | Vanilla JavaScript (ES6+), Bootstrap 5, SCSS 7-1 Pattern     |
| **Backend**                | Supabase (PostgreSQL + RLS + Autenticación)                  |
| **HTTP Client**            | Axios (async/await, error handling robusto)                  |
| **Visualización de Datos** | Chart.js (BI admin dashboard)                                |
| **Tipografía**             | Melvis One (títulos audaces), Roboto (body fluido)           |
| **Colores**                | Variables `$` en abstracts/\_variables.scss (NO hardcode)    |
| **Breakpoints**            | Mobile 320px → Tablet 768px → Desktop 1024px+                |
| **Carrito**                | Modal reutilizable (components/\_modals.scss + core/cart.js) |
| **Seguridad**              | OWASP validaciones, tokens, RLS Supabase, sanitización       |
| **Performance**            | Lighthouse >95, lazy-load, offline service worker            |

#### **Estructura de Carpetas (RESPETAR TOTALMENTE)**

```
Carni-mvp/
├── css/ ← SOLO SCSS files (subcarpetas 7-1 Pattern)
│   ├── abstracts/
│   │   ├── _variables.scss (colores, breakpoints, espacios)
│   │   ├── _mixins.scss (lógica reutilizable)
│   │   ├── _functions.scss (cálculos dinámicos)
│   │   ├── _bem-utilities.scss (utilidades BEM obligatorias)
│   │   └── _placeholders.scss (extends reutilizables)
│   ├── base/ (reset, tipografía, utilidades)
│   ├── layout/ (header, footer, sidebar, auth-layout)
│   ├── components/ ← AQUÍ: _navigation.scss, _forms.scss, _modals.scss
│   ├── pages/ (estilos por página)
│   ├── themes/ (dark mode, brand colors)
│   └── vendors/ (bootstrap overrides, librerías externas)
│
├── js/
│   ├── app.js (punto entrada, inicialización PWA)
│   └── modules/
│       ├── core/ (lógica negocio: api.js, auth.js, cart.js, productos.js)
│       ├── pages/ (por vista: catalog.js, checkout.js, dashboard.js)
│       ├── ui/ (componentes: header.js, notifications.js, ui.js)
│       └── utils/ (helpers: offline.js, service-worker.js, weather.js)
│
├── tagsCore/ (HTML pages)
│   ├── index.html (landing page)
│   ├── products.html (catálogo dinámico Axios)
│   ├── offline.html (PWA offline page)
│   ├── admin/ (dashboard, login, register)
│   └── user/ (login, register, perfil)
│
├── img/ (recursos multimedia)
├── GOB.md ← Esta guía (agent.md)
└── README.md ← Para desarrolladores
```

#### **Carrito: MODAL Reutilizable (NO página independiente)**

- Ubicación: `components/_modals.scss` + `js/modules/core/cart.js`
- Referencia: https://pipetawns-x.github.io/e-comerce/
- CodePen: https://codepen.io/pipeTawns-x/pen/dPGYMxJ
- Features: personalización peso/piezas/grosor, ticket, delivery options, localStorage + Supabase sync
- **Funcionalidades implementadas**:
  - ✅ Agregar productos con modal automático
  - ✅ Modificar peso/piezas/grosor en tiempo real
  - ✅ Eliminar productos individuales
  - ✅ Calcular totales dinámicos
  - ✅ Selector de tipo de entrega (Recoger/Delivery)
  - ✅ Generar ticket de compra
  - ✅ Vaciar carrito completo
  - ✅ Persistencia en localStorage
  - ✅ Bug corregido: web no se deshabilita al cerrar modal

#### **Products.html: Carga Dinámica Axios**

- Fetch Supabase: categorías completas sin fallos
- Placeholders "Próximamente": 3 tarjetas nuevas (merchandising, frutas-verduras, otros)
- Fallback localStorage si conexión falla
- Imágenes: lazy-load, padding uniforme, imagen central
- **9 Categorías establecidas**: res, cerdo, pollo, embutidos, preparadas, premium, merch, otros, ofertas

---

### <a name="prohibiciones-explícitas"></a>⛔ PROHIBICIONES EXPLÍCITAS (NO VIOLARLAS)

| #      | ❌ PROHIBICIÓN                                                   | 🎯 RAZÓN                                        | ✅ HACER EN SU LUGAR                                                                             |
| ------ | ---------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **1**  | Crear archivos `.css` puro                                       | Rompe patrón 7-1 SCSS modular                   | TODO en `.scss` dentro de estructura (abstracts/base/layout/components/pages/themes/vendors)     |
| **2**  | Eliminar elementos HTML existentes (footer, secciones, contacto) | Pérdida funcionalidad, ruptura UX               | SOLO modificar o AGREGAR dentro estructura. Si dudas: PREGUNTAR                                  |
| **3**  | Crear HTML nuevo sin analizar existente                          | Duplicación, conflictos, desalineación diseño   | LEER archivo HTML completo ANTES de tocar. Usar estructura existente                             |
| **4**  | Usar estilos `style=` inline en HTML                             | Violación BEM, peso HTML, difícil override CSS  | TODO en `.scss` con clases BEM: `.elemento { }`, `.elemento__parte { }`, `.elemento--estado { }` |
| **5**  | Duplicar elementos (carousel, buttons, secciones)                | Redundancia, conflictos, mantenibilidad         | Verificar SIEMPRE: ¿Esto YA existe? Si sí → modificar, no crear nuevo                            |
| **6**  | Ignorar mobile-first (320px primero)                             | Layout roto móviles, UX pésima                  | Mobile (320px) → Tablet (768px) → Desktop (1024px+) con `@media` y breakpoints variables         |
| **7**  | No usar variables SCSS (`$color`, `$breakpoint`)                 | Inconsistencia visual, mantenimiento imposible  | Importar `abstracts/_variables.scss` y usar `@include respond-to()` mixin                        |
| **8**  | Olvidar seguridad OWASP                                          | Vulnerabilidades A01-A10, tokenización débil    | Validación regex, sanitización, tokens, RLS Supabase, NO almacenar tarjetas sensibles            |
| **9**  | No compilar SCSS o ignorar errores                               | CSS roto, layout breaks, console errors         | `npm run scss:watch` + verificar output + abrir navegador DevTools                               |
| **10** | No actualizar GOB.md/README.md después cambios                   | Futuras iteraciones sin contexto, alucinaciones | DESPUÉS de CADA mejora: actualizar MD con cambios, contexto nuevo, checklist                     |

**CUMPLIMIENTO**: Si violas estas 10 prohibiciones, el proyecto entra en estado inestable. Todas OBLIGATORIAS.

---

### <a name="historial-de-prompts"></a>📝 Historial de Prompts y Mejoras Implementadas

#### **Sesión 1: Mejoras Responsive y Bento Grid (2026-01-08)**

**Prompt Principal**:
> "en mi proyecto Carni-mvp Pedes ver un gran avace en el tema responsive en celulares con una buena estructura de la web y buen mas cosas que realice con otro editor vscode pero aunque son buenos hay ciertos fallos 1- espacio entre el header y el titulo esto se tiene que arreglar ajustando esto para eliminar ese espacio sin romper nada ni moverle nada al diseño de cards responsive 2-Fallos con el responsive en la ide de unas card principales a forma de bento grid..."

**Mejoras Implementadas**:
1. ✅ **Eliminación de espacio header-título**: Ajustado `padding-top` en `_header.scss` y `_home.scss`
2. ✅ **Bento Grid rediseñado**: Implementado diseño exacto de CSS Grid Generator (4 columnas x 6 filas)
3. ✅ **Espacios en blanco desktop eliminados**: Ajustado padding y gaps del grid

**Archivos Modificados**:
- `css/pages/_bento-main.scss` - Grid rediseñado con 9 espacios
- `css/layout/_header.scss` - Eliminado padding-top
- `css/pages/_home.scss` - Ajustado padding hero-section

**Tecnologías Utilizadas**:
- CSS Grid Generator (https://cssgridgenerator.io/)
- Live Sass Compiler

---

#### **Sesión 2: Web de Productos Completa (2026-01-09)**

**Prompt Principal**:
> "ahora empezaremos con las mejoras a la web de productos o web tipo e-comerce para esto tengo un diseño basico en scalidraw... quiero que el header sea identico al de la web principal con su img de la web los iconos los mismos por cierto y funcionales un icono de buqueda, carrito, el del usuario y el hamburguer igual de responsivo y eficiente..."

**Mejoras Implementadas**:
1. ✅ **Header idéntico**: Copiado header completo de `index.html` a `products.html`
2. ✅ **Mini-header**: Agregado solo en `products.html` con mensaje de envío gratis
3. ✅ **9 Categorías establecidas**: res, cerdo, pollo, embutidos, preparadas, premium, merch, otros, ofertas
4. ✅ **Menú horizontal scrollable**: Con botones rojos de flecha para navegación
5. ✅ **Cards de productos**: Diseño consistente (imagen, título, botón)
6. ✅ **Eliminación de pestañas redundantes**: Carrito y Registro removidos (funcionalidad en iconos)
7. ✅ **Footer agregado**: Mismo footer de `index.html`
8. ✅ **Comunicación entre páginas**: Enlaces con parámetros URL (`?categoria=xxx`)

**Archivos Modificados**:
- `tagsCore/products.html` - Rediseño completo
- `css/pages/_productos.scss` - Estilos para categorías y cards
- `js/modules/core/productos.js` - Scroll buttons
- `js/modules/pages/catalog.js` - Lógica de productos (luego movida inline)
- `js/modules/utils/base_dinamica.js` - Productos completados

**Referencias Utilizadas**:
- CodePen: https://codepen.io/pipeTawns-x/pen/dPGYMxJ
- E-commerce referencia: https://pipetawns-x.github.io/e-comerce/

---

#### **Sesión 3: Carrito Funcional Completo (2026-01-09)**

**Prompt Principal**:
> "recordando el codepen este contaba con 3 pestañas categorias, carrito y registro... el icono de Carrito que sirve como modal pero no tiene funcionalidades como las que si tenia la pestaña del carrito... deberas de entregar el carrito funcional en forma de modal cada que yo quiera a gregar algo el modal se desplegara con las funcionalidades para que el usuario pueda realiar sus compras"

**Mejoras Implementadas**:
1. ✅ **Carrito reescrito completamente**: Basado en funcionalidades del CodePen
2. ✅ **Modal automático**: Se abre al agregar productos
3. ✅ **Funcionalidades completas**:
   - Modificar peso/piezas/grosor en tiempo real
   - Eliminar productos individuales
   - Calcular totales dinámicos
   - Selector de tipo de entrega
   - Generar ticket
   - Vaciar carrito
4. ✅ **Bug corregido**: Web no se deshabilita al cerrar modal
5. ✅ **Persistencia**: localStorage con eventos personalizados
6. ✅ **Código humanizado**: Comentarios JSDoc, nombres descriptivos

**Archivos Modificados**:
- `js/modules/core/cart.js` - Reescrito completamente con documentación
- `tagsCore/products.html` - Modal actualizado
- `tagsCore/index.html` - Modal actualizado

**Funcionalidades del CodePen Implementadas**:
- ✅ Lista de productos con imagen, nombre, precio
- ✅ Controles dinámicos (peso/piezas/grosor según tipo)
- ✅ Botón eliminar por producto
- ✅ Subtotal y total calculados automáticamente
- ✅ Selector de tipo de entrega (Recoger/Delivery)
- ✅ Botón "Generar Ticket"
- ✅ Botón "Vaciar" carrito
- ✅ Actualización en tiempo real

---

### <a name="errores-anteriores"></a>🚨 Errores Anteriores & Cómo Evitarlos (LECCIONES APRENDIDAS)

| Episodio    | Error                                       | Causa Raíz                      | Consecuencia                                         | Prevención                                                                |
| ----------- | ------------------------------------------- | ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| **Chat 1**  | ✗ Crear `bento-maxima.css` CSS puro         | Desconocimiento arquitectura    | Ruptura 7-1, duplicación estilos, imposible mantener | ✓ Leer estructura ANTES. Validar: ¿Este archivo va en css/subcarpeta/?    |
| **Chat 2**  | ✗ Eliminar footer + contacto sin avisar     | Falta contexto completo         | Pérdida contenido, queja usuario inmediata           | ✓ PROHIBICIÓN #2: NUNCA eliminar sin aprobación EXPLÍCITA                 |
| **Chat 3**  | ✗ Duplicar carousel 2 veces en HTML         | Múltiples edits sin sync        | Redundancia, conflictos, peso HTML                   | ✓ Buscar SIEMPRE: ¿Existe `carousel` en HTML? Si sí → modificar, NO crear |
| **Chat 4**  | ✗ No compilar SCSS, generar CSS roto        | Saltar paso build process       | Layout breaks, console errors, offline               | ✓ `npm run scss:watch` SIEMPRE. Ver output compilación. Browser DevTools  |
| **Chat 5**  | ✗ Usar estilos inline `style=` en HTML      | Rapidez vs. buena práctica      | BEM violado, peso HTML, override imposible           | ✓ PROHIBICIÓN #4: TODO en .scss clases BEM                                |
| **Chat 6**  | ✗ No actualizar MD después cambios          | Nuevo agente lee contexto viejo | Alucinaciones, futuras mejoras rompen                | ✓ PROHIBICIÓN #10: Actualizar GOB.md + README.md post-cambio              |
| **Chat 7**  | ✗ Ignorar mobile 320px responsive           | Desktop-first mentality         | UX móvil rota, cliente enfadado                      | ✓ Mobile-first SIEMPRE: testear 320px PRIMERO en DevTools                 |
| **Chat 8**  | ✗ Crear HTML nuevo (index.html 2da versión) | No leer HTML existente          | Desalineación design, conflictos                     | ✓ LEER archivo completo ANTES. Usar estructura existente                  |
| **Chat 9**  | ✗ Hardcode colores #abcdef en CSS           | Olvidar variables.scss          | Inconsistencia visual, mantenimiento difícil         | ✓ Importar `abstracts/_variables.scss`. Usar `$color-primario` en .scss   |
| **Chat 10** | ✗ No validar seguridad OWASP                | Desconocimiento requerimientos  | Vulnerabilidades, tokenización débil                 | ✓ Checklist #8: Validación regex, sanitización, tokens, RLS               |
| **Chat 11** | ✗ Modal deshabilita web al cerrar           | Bootstrap no restaura body      | Usuario no puede usar web después de cerrar modal   | ✓ Event listener `hidden.bs.modal` restaurar body.style y clases          |

**LECCIÓN CLAVE**: Cada error previene siguiente. Si rompes patrón una vez → futuro caos. Disciplina TOTAL.

---

### <a name="checklist-pre-commit"></a>✅ CHECKLIST PRE-COMMIT (VERIFICAR ANTES DE CUALQUIER CAMBIO)

**ANTES DE ESCRIBIR CÓDIGO:**

- [ ] ¿Leí GOB.md COMPLETO (incluyendo este checklist)?
- [ ] ¿Leí README.md para contexto developer?
- [ ] ¿Leí archivo existente que voy a modificar (HTML/SCSS/JS)?
- [ ] ¿Sé EXACTAMENTE dónde va el código (archivo/carpeta completa)?

**DURANTE CÓDIGO:**

- [ ] ¿Es SCSS (no CSS puro) en ubicación correcta 7-1?
- [ ] ¿Importé variables de `abstracts/_variables.scss`?
- [ ] ¿Usé breakpoints mixin `@include respond-to()` (mobile-first)?
- [ ] ¿Seguí BEM: `.elemento`, `.elemento__parte`, `.elemento--estado`?
- [ ] ¿NO hay estilos inline `style=` en HTML?
- [ ] ¿Validé seguridad OWASP (regex, sanitización, tokens)?
- [ ] ¿El código es modular (reutilizable, sin duplicación)?
- [ ] ¿Agregué comentarios JSDoc para funciones importantes?

**DESPUÉS DE CÓDIGO:**

- [ ] ¿Compiló SCSS sin errores (`npm run scss:watch`)?
- [ ] ¿Abro navegador y veo cambios correcto (sin console errors)?
- [ ] ¿Testé mobile 320px, tablet 768px, desktop 1024px?
- [ ] ¿NO hay elementos duplicados en HTML?
- [ ] ¿NO eliminé contenido existente (footer, secciones, etc.)?
- [ ] ¿Funcionan interacciones (clicks, modales, forms)?
- [ ] ¿Lighthouse score >95 (performance)?
- [ ] ¿Service worker registrado y offline funciona?

**DOCUMENTACIÓN:**

- [ ] ¿Actualicé GOB.md con cambios realizados?
- [ ] ¿Actualicé README.md si aplica (nuevas features)?
- [ ] ¿Agregué explicación CLARA de qué cambió y POR QUÉ?

**FINAL:**

- [ ] ¿Commit atómico (1 cambio = 1 commit)?
- [ ] ¿Mensaje commit CLARO: `[componente] descripción cambio`?
- [ ] ✅ **LISTO PARA PUSH** (proyecto en estado estable)

---

### <a name="estructura-del-proyecto"></a>🏗️ Estructura Detallada: Dónde Tocar, Dónde NO Tocar

#### **CSS/SCSS (7-1 Pattern Strict)**

```scss
// abstracts/_variables.scss ← AQUÍ: colores, breakpoints, espacios
$color-primario: #363432;
$color-gold: #e4d1b0;
$breakpoint-mobile: 320px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;

// abstracts/_mixins.scss ← AQUÍ: lógica reutilizable
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

// components/_navigation.scss ← AQUÍ: menús, tabs, breadcrumbs
.main-nav {
  display: flex;
  gap: 1rem;
  @include respond-to("tablet") {
    gap: 2rem;
  }
}

// components/_forms.scss ← AQUÍ: login, register, checkout, contacto
.form-group {
  margin-bottom: 1rem;
  label {
    font-weight: 600;
  }
}

// components/_modals.scss ← AQUÍ: carrito modal reutilizable
.modal-cart {
  position: fixed;
  z-index: 1050;
  @include respond-to("tablet") {
    width: 50%;
  }
}
```

#### **JavaScript/Modules (Estructura Strict)**

```js
// js/modules/core/cart.js ← Lógica carrito (modal reutilizable)
/**
 * Sistema de Carrito de Compras
 * Gestiona agregar, modificar, eliminar productos
 * @author pipeTawns-x
 */
(function(){
  function loadCart(){ /* ... */ }
  function saveCart(cart){ /* ... */ }
  function renderCartModal(){ /* ... */ }
  window.CarniCart = { addItem, renderCartModal, updateBadge };
})();

// js/modules/pages/catalog.js ← Vista products.html
class CatalogPage {
  async loadProducts() {
    try {
      const response = await axios.get(`${API_URL}/products`);
      // renderizar productos
    } catch (error) {
      /* error handling */
    }
  }
}

// js/modules/ui/header.js ← Componente header reutilizable
class Header {
  initNavigation() {
    /* setup menús */
  }
  initCart() {
    /* setup carrito modal */
  }
}

// js/app.js ← PUNTO ENTRADA (inicializa todo)
document.addEventListener("DOMContentLoaded", () => {
  const header = new Header();
  const cart = new ShoppingCart();
  header.initCart(); // pasar referencia carrito
});
```

#### **HTML (Estructura Existente, RESPETAR)**

```html
<!-- tagsCore/index.html ← Landing page, NO tocar sin análisis -->
<!-- tagsCore/products.html ← Catálogo dinámico Axios, NO duplicar -->
<!-- tagsCore/offline.html ← PWA offline, SOLO si mejoras PWA -->
<!-- tagsCore/admin/dashboard.html ← Admin seguro RLS, NO editar usuarios -->
<!-- tagsCore/user/login.html ← Auth OWASP, NO debilitar validaciones -->
```

---

### <a name="flujo-correcto"></a>🎯 Flujo Correcto de Mejoras (SIEMPRE SEGUIR)

```mermaid
graph TD
    A["1. 📖 LEER<br/>GOB.md + README.md<br/>+ archivo a modificar"] --> B["2. 📋 ANALIZAR<br/>¿Existe?<br/>¿Rompe mobile?<br/>¿Seguridad OWASP?"]
    B --> C["3. ✏️ MODIFICAR<br/>Cambios atómicos<br/>Usar variables $<br/>BEM strict<br/>Compilar SCSS"]
    C --> D["4. 🧪 TESTEAR<br/>Mobile 320px<br/>Tablet 768px<br/>Desktop 1024px<br/>DevTools console"]
    D --> E["5. 📚 DOCUMENTAR<br/>Actualizar GOB.md<br/>Actualizar README.md<br/>Explicar cambios"]
    E --> F["6. ✅ COMMIT<br/>Mensaje atómico<br/>Push repositorio<br/>Estado ESTABLE"]
```

**Tiempo estimado por mejora**: 30-45 min (incluyendo testing + documentación).

---

### <a name="prompts-específicos"></a>🤖 Prompts Específicos Adaptados al Proyecto (COPIAR Y USAR)

#### **Prompt 1: Agregar Feature sin Romper**

```
Actúa como experto PWA senior. Voy a agregar [FEATURE] al proyecto Carnicería.

CONTEXTO PROYECTO:
- Base: Vanilla JS + SCSS 7-1 Pattern + Bootstrap 5 + Supabase
- Estructura: css/abstracts/base/layout/components/pages/themes/vendors
- js/modules/core (lógica), pages (vista), ui (componentes), utils (helpers)
- Mobile-first: 320px → 768px → 1024px con @include respond-to()
- Seguridad: OWASP validaciones, tokens, RLS Supabase
- Carrito: Modal reutilizable components/_modals.scss + core/cart.js
- Tipografía: Melvis One (títulos), Roboto (body)

IMPLEMENTA [FEATURE] EN:
- Archivo SCSS exacto: [PATH completo]
- Archivo JS exacto: [PATH completo]
- Validación mobile/tablet/desktop

RESTRICCIONES:
- NO crear CSS puro (solo SCSS)
- NO eliminar contenido existente
- NO usar estilos inline (style=)
- NO duplicar elementos
- Usar variables abstracts/_variables.scss
- Validar OWASP si aplica

OUTPUT:
1. Código COMPLETO archivos
2. Diff git
3. Explicación detallada
4. Validación: mobile/tablet/desktop/console
5. Actualizar GOB.md post-cambio

Repite este contexto para evitar alucinaciones.
```

#### **Prompt 2: Arreglar Bug sin Romper**

```
Proyecto carnicería tiene BUG: [DESCRIPCIÓN BUG].

CONTEXTO:
[COPIAR contexto completo del Prompt 1]

EL BUG OCURRE EN: [archivo.scss / archivo.js / archivo.html]
SÍNTOMA: [qué se ve/no se ve]
ESPERADO: [cómo debería verse]

INVESTIGAR:
1. ¿Qué código actual causa bug?
2. ¿Qué variables/mixins debo usar?
3. ¿Rompe mobile/seguridad/performance?

ARREGLAR SIN:
- Crear archivos nuevos (modificar existentes)
- Eliminar contenido
- Usar CSS puro o estilos inline
- Romper mobile-first

OUTPUT: [Mismo que Prompt 1]
```

#### **Prompt 3: Mejorar Performance**

```
Mejorar performance/Lighthouse proyecto carnicería.

CONTEXTO: [COPIAR contexto Prompt 1]

ENFOCARSE EN:
- Lazy-load imágenes (IntersectionObserver)
- Caching inteligente service-worker.js
- Async/await Axios (NO bloquear UI)
- Minificar assets
- Compilar SCSS eficiente (no bloat)

VALIDAR:
- Lighthouse >95 (antes/después)
- Offline funciona
- NO console errors

OUTPUT: [Mismo que Prompt 1]
```

---

### <a name="validación--testing"></a>🔍 Validación & Testing (HACER ANTES DE COMMIT)

#### **Testing Manual (DevTools)**

```javascript
// Abrir navegador F12
// Console tab: ¿Sin errores rojos?
// Network tab: ¿Cargas correctas? (no 404s)
// Application tab: ¿Service worker registrado? ¿Cache offline?
// Responsive Design: testear 320px, 768px, 1024px

// Test específicos:
- Click botones → funcionan?
- Modal carrito abre/cierra?
- Form valida/envía?
- Imágenes cargan lazy?
- Menú mobile expande/colapsa?
```

#### **Testing Automated (Scripts)**

```bash
# Compilar SCSS (buscar errores)
npm run scss:watch

# Lighthouse score (performance)
lighthouse https://localhost:3000 --view

# Validar HTML5
npm run validate:html

# ESLint JavaScript (si existe)
npm run lint
```

#### **Validación Seguridad OWASP**

```javascript
// ✅ Validar regex entrada usuario (formularios)
const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarNombre = (nombre) => /^[A-Za-záéíóúñÁÉÍÓÚÑ\s]{2,50}$/.test(nombre);
const validarTelefono = (tel) => /^[0-9]{10}$/.test(tel);

// ✅ Sanitizar HTML (evitar XSS)
const sanitize = (str) => str.replace(/[<>]/g, "");

// ✅ Tokens (NO guardar tarjetas)
const payment = { token: "stripe_tok_...", amount: 100 }; // ✓ correcto
const payment = { card: "4111...", cvv: "123" }; // ✗ NUNCA

// ✅ RLS Supabase (servidor valida acceso)
const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("public", true) // filtro servidor
  .or("user_id.eq.${userId}"); // RLS policy
```

---

### 🔗 Referencias & Recursos

| Recurso                | Enlace                                     | Uso                            |
| ---------------------- | ------------------------------------------ | ------------------------------ |
| **Carrito Referencia** | https://pipetawns-x.github.io/e-comerce/   | Features exactas implementar   |
| **Carrito CodePen**    | https://codepen.io/pipeTawns-x/pen/dPGYMxJ | Interacciones, personalización |
| **OWASP Top 10**       | https://owasp.org/www-project-top-ten/     | Validaciones seguridad         |
| **SCSS 7-1 Pattern**   | https://sass-guidelin.es/#architecture     | Documentación arquitectura     |
| **BEM Methodology**    | https://bem.info/en/                       | Nomenclatura CSS               |
| **Supabase Docs**      | https://supabase.com/docs                  | Backend RLS, Auth, APIs        |
| **Bootstrap 5**        | https://getbootstrap.com/docs/             | Componentes UI base            |

---

### 📊 Resumen Contexto INMUTABLE (APLICAR SIEMPRE)

```markdown
✅ PROYECTO ESTABLE SI:

- css/ = SCSS 7-1 (abstracts/base/layout/components/pages/themes/vendors)
- js/modules = core/pages/ui/utils separado por responsabilidad
- HTML respeta estructura (no duplica, no elimina)
- Mobile-first 320px → 768px → 1024px validado
- OWASP validaciones en formularios
- Carrito = modal reutilizable (NO página independiente)
- Products = carga dinámica Axios sin fallos
- GOB.md + README.md actualizados post-cambio
- NO romper commits anteriores (atómicos)
- Performance Lighthouse >95
- Código humanizado con comentarios JSDoc

❌ PROYECTO EN RIESGO SI:

- Crear CSS puro (solo SCSS)
- Eliminar contenido sin aprobación
- Estilos inline en HTML
- Duplicar elementos
- Ignorar mobile-first
- Olvidar OWASP seguridad
- No compilar SCSS
- No actualizar MD
- Código sin comentarios ni documentación
```

---

---

### 📝 Cambios Recientes (2026-01-09)

#### **Corrección Final: Bug Modal y Sincronización Carrito**

**Problema Reportado**:
1. Al cerrar el modal del carrito en `index.html`, la web quedaba deshabilitada hasta hacer refresh
2. El carrito no mostraba información en `products.html`

**Solución Implementada**:
1. ✅ **Función `restoreBodyAfterModal()` robusta**: Restaura el body múltiples veces para asegurar funcionalidad
2. ✅ **Múltiples event listeners**: `hidden.bs.modal`, `hide.bs.modal`, y listener en `window.load`
3. ✅ **Intervalo de limpieza**: Verifica cada 500ms si hay estados residuales y los limpia
4. ✅ **Script `cart.js` agregado a `index.html`**: El carrito ahora funciona en ambas páginas
5. ✅ **Sincronización entre páginas**: Event listeners para `storage` y `cart:updated` para sincronizar badge
6. ✅ **Backdrop cambiado de `static` a `true`**: Permite cerrar el modal haciendo clic fuera

**Archivos Modificados**:
- `js/modules/core/cart.js` - Función `restoreBodyAfterModal()` y múltiples listeners
- `tagsCore/index.html` - Script `cart.js` agregado, backdrop cambiado
- `tagsCore/products.html` - Backdrop cambiado

**Funcionalidades Corregidas**:
- ✅ Modal se cierra correctamente sin deshabilitar la web
- ✅ Carrito funciona en `index.html` y `products.html`
- ✅ Badge se actualiza en ambas páginas
- ✅ Sincronización entre páginas mediante localStorage events

---

---

### 📝 Corrección Final: Fallo Total en Products.html (2026-01-09)

**Problema Reportado**: "tengo un fallo total en la web de productos a la hora de visualizarla en el navegador"

**Causa Identificada**:
1. Import estático de módulo puede fallar en algunos navegadores (CORS)
2. Falta de manejo de errores robusto
3. JSON.stringify puede fallar con caracteres especiales

**Solución Implementada**:
1. ✅ **Import dinámico con await**: Cambiado de `import` estático a `await import()` para mejor compatibilidad
2. ✅ **Manejo de errores robusto**: Try-catch en importación y funciones críticas
3. ✅ **Escape de caracteres**: Escapado de comillas en JSON para evitar errores de parsing
4. ✅ **Validación de datos**: Verificación de producto válido antes de agregar al carrito
5. ✅ **Múltiples intentos de inicialización**: Timeouts y verificaciones para asegurar que el DOM esté listo
6. ✅ **ProductosManager mejorado**: Export default y mejor manejo de scroll buttons

**Archivos Modificados**:
- `tagsCore/products.html` - Script inline mejorado con import dinámico y manejo de errores
- `js/modules/core/productos.js` - Export default agregado y mejor manejo de eventos

**Mejoras Adicionales**:
- ✅ Actualización de URL sin recargar página al cambiar categoría
- ✅ Mejor feedback visual en botones de categoría (btn-primary cuando activo)
- ✅ Validación de producto antes de agregar al carrito
- ✅ Mensajes de error más descriptivos

---

---

### 📝 Configuración Supabase (2026-01-09)

**Integración Completada**:
1. ✅ **Credenciales configuradas**: 
   - URL: `https://wlikxgklwutxxazbhmkv.supabase.co`
   - Key: Configurada en `.env.local` y como fallback en `supabase.js`
2. ✅ **Archivo `.env.local` creado**: Variables de entorno para desarrollo
3. ✅ **`supabase.js` actualizado**: Valores por defecto para desarrollo sin servidor
4. ✅ **`vite.config.js` creado**: Configuración del servidor de desarrollo (puerto 3002)
5. ✅ **Servidor Go Live activo**: Puerto 3002 funcionando

**Archivos Modificados**:
- `.env.local` - Credenciales de Supabase (no versionado en Git)
- `js/modules/supabase.js` - Valores por defecto agregados
- `vite.config.js` - Configuración del servidor creada
- `test-supabase.html` - Página de prueba de conexión creada

**Cómo Probar**:
1. Abre `http://127.0.0.1:3002/test-supabase.html` en el navegador
2. O verifica en la consola del navegador: `✅ Supabase configurado`
3. Las credenciales están disponibles tanto en `.env.local` como en el código (fallback)

**Notas de Seguridad**:
- `.env.local` está en `.gitignore` (no se sube a Git)
- Las credenciales en `supabase.js` son solo para desarrollo local
- En producción, usar solo variables de entorno

---

---

### 📝 Eliminación de Recursividad y Configuración Vite (2026-01-09)

**Cambios Realizados**:
1. ✅ **Eliminado menú dropdown duplicado**: Removido el dropdown de "Productos" del header en `index.html` y `products.html` para evitar recursividad
2. ✅ **Reemplazado por enlace simple**: El menú ahora tiene un enlace directo a `products.html` en lugar del dropdown
3. ✅ **Menú hamburger intacto**: Todas las categorías siguen disponibles en el menú hamburger móvil
4. ✅ **Vite configurado**: `vite.config.js` actualizado para servir correctamente desde `tagsCore/`
5. ✅ **Servidor Vite activo**: Puerto 3002 configurado y funcionando

**Archivos Modificados**:
- `tagsCore/index.html` - Dropdown eliminado, enlace simple agregado
- `tagsCore/products.html` - Dropdown eliminado, enlace simple agregado
- `vite.config.js` - Configuración mejorada con auto-open y CORS

**Resultado**:
- ✅ Sin recursividad: Un solo menú de categorías (hamburger)
- ✅ Navegación simplificada: Enlace directo a productos
- ✅ Servidor Vite funcionando: Módulos ES6 cargando correctamente
- ✅ Sin errores de CORS: Todo funcionando con servidor local

---

**📅 Última Actualización**: 9 de enero 2026  
**📌 Versión**: GOB.md v8.4 - Recursividad Eliminada + Vite Configurado  
**✅ Estado**: LISTO PARA PRODUCCIÓN - 100% FUNCIONAL SIN RECURSIVIDAD
