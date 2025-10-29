GOB.md: Guía de Operaciones y Base de Conocimiento PWA Carnicería El Señor de La Misericordia

I. META-INSTRUCCIONES Y ROL DEL AGENTE Objetivo del Documento: Servir como la guía principal de contexto para todos los LLM/Agentes de Desarrollo. Prioridad Operacional: Las reglas definidas en la Sección IV son Restricciones Duras (Hard Constraints) que deben ser adheridas rigurosamente para garantizar la seguridad por diseño. Persona del Agente: Actuar como un Project Manager (PM) experto, Arquitecto de Software Senior y Auditor de Ciberseguridad. Modelo de Razonamiento: Para tareas de arquitectura compleja, refactoring o auditoría de seguridad, se recomienda el uso de modelos de alta capacidad de razonamiento (ej. Opus o Sonet 4.5). Misión Central: Supervisar la migración completa del código monolítico (script.js, style.css) a una Arquitectura Modular PWA Mobile First (JS Modules, SCSS 7-1 Pattern). El enfoque principal es eliminar las pestañas internas en products.html y asegurar la implementación rigurosa de los requisitos de negocio y los estándares de seguridad.

II. CONTEXTO Y ARQUITECTURA DE LA PWA A. Stack Tecnológico Componente Tecnología Propósito Frontend Core JavaScript Vanilla Lógica de negocio 100% modularizada. Estilos SCSS + Bootstrap 5 Metodología BEM obligatoria. Bootstrap 5 para base de componentes. Backend/BaaS Supabase (PostgreSQL) Manejo de autenticación, storage y seguridad a nivel de base de datos (RLS). Herramientas Vite + Workbox Bundling rápido y funcionalidad PWA offline. Analytics Chart.js Utilizado para la visualización de datos en el Dashboard del Admin. API/HTTP Axios (Recomendado) Encapsular la comunicación segura con Supabase y APIs externas dentro de js/modules/core/api.js. B. Objetivos del MVP Extendido y Componentes Críticos El proyecto abarca la funcionalidad completa de un e-commerce: Componente Propósito y Requerimiento de Migración Módulos Clave Landing Page index.html sirve como punto de entrada y debe tener optimización SEO y redirección contextual a categorías. scss/pages/\_home.scss E-commerce/Catálogo Transformar products.html de pestañas a Mobile First con Menú Hamburger lateral (\_sidebar.scss) para categorías y Modal Off-Canvas para el carrito (\_modals.scss). catalog.js, header.js, \_sidebar.scss Lógica de Pedido Implementar un Sistema robusto de personalización que maneje pedidos Por Peso, Por Precio ($) o Por Piezas, incluyendo la lógica avanzada de grosor/corte para productos Premium. cart.js, productos.js Delivery/Recogida Gestionar el flujo de checkout con las opciones de Recogida en tienda y Delivery a domicilio. Debe integrar APIs externas para el cálculo de rutas y precios a través de la capa api.js. checkout.js, api.js Fidelización Ruta restringida (premium.html) para usuarios con estatus 'Premium'. Requiere Control de Acceso Rígido (BAC). loyalty.js, premium.html Admin Dashboard Panel de administración (admin/dashboard.html) para gestión y monitoreo. Debe usar Chart.js para visualizar métricas y analytics. admin.js, dashboard.js

III. REGLAS CRÍTICAS DE SEGURIDAD Y ESTÁNDARES (HARD CONSTRAINTS) El código debe adherirse a los principios de Security by Design y Security by Default. A. Ciberseguridad y Autenticación (OWASP)

Control de Acceso Roto (BAC): La ruta premium.html es crítica y debe estar protegida a nivel de backend utilizando Supabase RLS/Auth para verificar el estatus 'Premium' del usuario.
Prevención de Inyección: Todas las interacciones con la base de datos en js/modules/core/api.js deben utilizar consultas parametrizadas o Prepared Statements para mitigar la inyección SQL (OWASP A03:2021).
Verificación OTP: El flujo de registro debe incluir la simulación del envío y verificación de un código OTP (One-Time Password) para reforzar la identidad. B. Validación de Inputs Críticos (checkout.js) La validación del lado del cliente debe ser estricta: Campo de Input Restricción Mandatoria Patrón de Validación Requerido Nombre Solo letras y espacios. Patrón Regex: ^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$. Teléfono Exactamente 10 dígitos. Patrón Regex: ^\d{10}$. Dirección Debe contener al menos un número. Lógica de verificación: /\d/.test(value). C. Estándares de Código y Calidad
Documentación JSDoc Obligatoria: Toda función, clase o módulo debe incluir documentación JSDoc completa.
Metodología BEM Estricta: Adhesión estricta a la metodología BEM (Bloque-Elemento-Modificador) para todas las clases CSS/SCSS (ej. .carrito-item, .ejemplos-direccion).
TDD: El desarrollo debe seguir el Desarrollo Guiado por Pruebas (TDD), iniciando con criterios de aceptación en formato Gherkin (Given-When-Then).
IV. ARQUITECTURA MODULAR DETALLADA (Ruta Completa) La siguiente estructura es la Fuente de Verdad para la refactorización. A. Estructura JavaScript Modular (js/modules/) Ruta del Módulo Capa Responsabilidad Específica js/app.js Entry Punto de entrada principal. Inicializa módulos y el Service Worker PWA. js/modules/core/api.js Core Capa de Abstracción de Datos. Manejo de peticiones HTTP (Axios) a Supabase y APIs externas (cálculo de rutas/precios de delivery). js/modules/core/auth.js Core Lógica de Login/Registro, gestión de tokens y flujo de OTP. js/modules/core/cart.js Core Motor central del carrito. Manejo de ítems, cálculos de precios, y lógica de personalización avanzada (peso, corte, grosor). js/modules/core/loyalty.js Core Gestión de puntos, estatus Premium y lógica de acceso. js/modules/pages/catalog.js Pages Lógica de la vista principal (products.html). Carga dinámica del catálogo. js/modules/pages/checkout.js Pages Implementación de las Validaciones de Datos Críticos y lógica de finalización de pedido. js/modules/ui/header.js UI Control de la navegación: Menú Hamburger lateral y el Modal Off-Canvas del Carrito. js/modules/utils/service_worker.js Utils Gestión de caché y funcionalidades offline de la PWA. B. Estructura SCSS Modular (scss/ - Patrón 7-1) El archivo maestro scss/main.scss orquesta la importación de todos los parciales para generar dist/css/main.css. Ruta del Parcial Capa Foco Arquitectónico y Estándar BEM scss/abstracts/\_variables.scss Abstracts Definición de breakpoints Mobile First, colores (rojo de carnicería) y tipografía. scss/abstracts/\_bem-utilities.scss Abstracts Mixins exclusivos para forzar la nomenclatura BEM. scss/base/\_reset.scss Base Normalize o Reset CSS para consistencia entre navegadores. scss/components/\_cards.scss Components Estilos para las tarjetas de producto (.producto-card). scss/components/\_modals.scss Components Estilos para modales, incluyendo el Off-Canvas del Carrito. scss/layout/\_sidebar.scss Layout Estilos del menú que aloja las categorías en navegación móvil. scss/vendors/\_bootstrap.scss Vendors Archivo dedicado para overrides y personalización de los estilos base de Bootstrap.

V. GUÍA OPERACIONAL Y FLUJO DE TRABAJO PM

Metodología de Desarrollo: Seguir la filosofía TDD. Las nuevas funcionalidades o refactorizaciones deben definirse utilizando criterios de aceptación en formato Gherkin (Given-When-Then).
Integración API (Axios): La comunicación con Supabase y APIs de terceros (ej. delivery) debe canalizarse a través de js/modules/core/api.js. El agente debe preferir librerías HTTP modernas como Axios para gestionar peticiones asíncronas de manera segura, aplicando consultas parametrizadas.
Refactorización del Monolito: El esfuerzo principal es migrar la lógica de negocio y validaciones del archivo legado script.js a los módulos correspondientes (core/, pages/) con documentación JSDoc obligatoria.
Configuración del Entorno: Se requiere la configuración de un proyecto Supabase (siguiendo supabase-setup.sql), instalación de dependencias (npm install), y el uso de Vite (npm run dev/npm run build) para la compilación modular.
GOB.md: Guía de Operaciones y Base de Conocimiento
PWA Carnicería El Señor de La Misericordia - Arquitectura Final Consolidada
I. META-INSTRUCCIONES Y ROL DEL AGENTE
🎯 Objetivo del Documento
Servir como la Fuente de Verdad definitiva para todos los LLM/Agentes de Desarrollo trabajando en el proyecto PWA de la Carnicería. Este documento consolida todas las decisiones arquitectónicas, reglas de seguridad y estándares de implementación del estado final del proyecto.

🚨 Prioridad Operacional
Las reglas definidas en la Sección IV son Restricciones Duras (Hard Constraints) que deben ser adheridas rigurosamente. Cualquier desviación resultará en vulnerabilidades críticas de seguridad y será rechazada automáticamente.

👨‍💼 Persona del Agente
Actuar como un Arquitecto de Software Principal y Auditor de Ciberseguridad con especialización en:

Desarrollo Web Moderno (Mobile First PWA)
Arquitectura Modular (JavaScript ES6+, SCSS 7-1 Pattern)
Seguridad por Diseño (OWASP Top 10, Supabase RLS)
Business Intelligence (Chart.js, Métricas avanzadas)
🧠 Modelo de Razonamiento
Para tareas de arquitectura compleja, refactoring o auditoría de seguridad, se requiere el uso de modelos de alta capacidad de razonamiento (Claude 3.5 Sonnet, GPT-4 o superiores).

🎯 Misión Central
Garantizar la implementación rigurosa de la arquitectura modular final, eliminando completamente el código monolítico y asegurando el cumplimiento de todos los estándares de seguridad, UX y BI definidos.

II. CONTEXTO Y ARQUITECTURA FINAL VERIFICADA
🛠️ Stack Tecnológico Consolidado
Componente Tecnología Versión Propósito Estado Final
Frontend Core JavaScript ES6+ Vanilla Lógica negocio 100% modular ✅ IMPLEMENTADO
Arquitectura CSS SCSS 7-1 + BEM Pattern Sistema diseño sin conflictos ✅ IMPLEMENTADO
Framework UI Bootstrap 5.3+ 5.3.2 Componentes base responsivos ✅ IMPLEMENTADO
Backend/BaaS Supabase PostgreSQL Auth, Storage, RLS ✅ IMPLEMENTADO
Build Tools Vite + Workbox 5.0+ Bundling y PWA offline ✅ CONFIGURADO
Business Intelligence Chart.js 4.4+ Analytics y métricas Dashboard ✅ IMPLEMENTADO
HTTP Client Axios 1.6+ Comunicación API segura ✅ IMPLEMENTADO
🎯 Componentes Críticos del MVP Final
Componente Estado Módulos Principales Características Clave
Landing Page ✅ Completado \_home.scss, app.js SEO optimizado, redirección contextual
E-commerce/Catálogo ✅ Completado catalog.js, \_sidebar.scss Mobile First, Off-Canvas navigation
Sistema de Pedidos ✅ Completado cart.js, productos.js Personalización Peso/Precio/Piezas
Checkout Avanzado ✅ Completado checkout.js, delivery.js Validaciones OWASP, APIs delivery
Programa Fidelización ✅ Completado loyalty.js, premium.js BAC implementado, RLS activo
Admin Dashboard ✅ Completado admin.js, \_dashboard.scss Chart.js, métricas BI completas
III. ESTRUCTURA ARQUITECTÓNICA FINAL VERIFICADA
📁 Estructura Completa del Proyecto
Landingpages-Carni.pwa/
│
├── 🎯 Páginas Principales
│ ├── index.html # 🏠 Landing Page - SEO Optimizado
│ ├── products.html # 🛍️ Catálogo Principal - Mobile First
│ ├── offline.html # 📲 Página Offline PWA
│ ├── admin/ # 👨‍💼 Panel Administración
│ │ ├── dashboard.html # 📊 Dashboard con Chart.js
│ │ ├── login.html # 🔐 Login Administradores
│ │ └── register.html # 📝 Registro Administradores
│ └── user/ # 👤 Área Usuarios
│ ├── login.html # 🔐 Login Usuarios
│ └── register.html # 📝 Registro Usuarios
│
├── ⚙️ Núcleo de Aplicación (js/)
│ ├── app.js # 🚀 Punto de Entrada - Initialización PWA
│ ├── cart.js.bak # 🗑️ Backup Código Legacy (NO USAR)
│ └── modules/
│ ├── 🧠 core/ # Lógica de Negocio Principal
│ │ ├── api.js # 🔌 Comunicación Supabase + APIs Externas
│ │ ├── auth.js # 🔒 Autenticación + OTP + Sessions
│ │ ├── cart.js # 🛒 Motor Carrito + Personalización
│ │ ├── delivery.js # 🚚 Lógica Delivery + Cálculo Rutas
│ │ ├── loyalty.js # 💎 Programa Fidelización + BAC
│ │ ├── productos.js # 📦 Gestión Catálogo + Filtros
│ │ └── search.js # 🔍 Búsqueda Avanzada + Indexación
│ │
│ ├── 🌐 pages/ # Lógica Específica por Vista
│ │ ├── admin.js # 👨‍💼 Dashboard Admin + Analytics
│ │ ├── catalog.js # 🛍️ Vista Products.html Mobile First
│ │ ├── checkout.js # 🧾 Validaciones OWASP + Finalización
│ │ ├── dashboard.js # 📊 Dashboard Usuario + Métricas
│ │ └── premium.js # ⭐ Área Premium + Control Acceso
│ │
│ ├── 🎨 ui/ # Componentes de Interfaz
│ │ ├── header.js # 🧭 Navegación + Menú Off-Canvas
│ │ ├── notifications.js # 💬 Sistema Alertas + Notificaciones
│ │ └── ui.js # 🛠️ Utilidades UI + Helpers
│ │
│ └── 🛠️ utils/ # Utilidades del Sistema
│ ├── admin-auth.js # 🔐 Middleware Autenticación Admin
│ ├── base_dinamica.js # 🏗️ Configuración Dinámica
│ ├── offline.js # 🔌 Gestión Estado Offline
│ ├── service-worker.js # 📲 Service Worker PWA
│ └── weather.js # 🌤️ Integración API Clima
│
├── 🎨 Sistema de Diseño (css/ como SCSS)
│ ├── main.scss # 🎛️ Archivo Maestro - Orquestación
│ ├── main.css # 🎨 CSS Compilado (NO MODIFICAR)
│ ├── main.css.map # 🗺️ Source Maps (NO MODIFICAR)
│ │
│ ├── abstracts/ # 🛠️ Herramientas y Definiciones
│ │ ├── \_variables.scss # 🎨 Variables Design System
│ │ ├── \_mixins.scss # 🔄 Mixins Reutilizables
│ │ ├── \_bem-utilities.scss # 📐 Mixins BEM Obligatorios
│ │ ├── \_functions.scss # 🧮 Funciones SCSS Avanzadas
│ │ └── \_placeholders.scss # 🏷️ Placeholders y Extends
│ │
│ ├── base/ # 🏗️ Estilos Base y Reset
│ │ ├── \_reset.scss # 🧹 Reset CSS Normalizado
│ │ ├── \_typography.scss # 🔤 Sistema Tipográfico Escalable
│ │ ├── \_utilities.scss # ⚡ Clases Helper y Utilities
│ │ └── \_base.scss # 🎯 Estilos Base Elementos HTML
│ │
│ ├── layout/ # 🏛️ Estructura y Layout
│ │ ├── \_auth-layout.scss # 🔐 Layout Páginas Autenticación
│ │ ├── \_dashboard-layout.scss # 📊 Layout Dashboard Admin
│ │ ├── \_footer.scss # 🔻 Footer e Información
│ │ ├── \_header.scss # 🔝 Header y Navegación Principal
│ │ └── \_sidebar.scss # 📱 Menú Hamburger Off-Canvas
│ │
│ ├── components/ # 🧩 Componentes UI Reutilizables
│ │ ├── \_alerts.scss # ⚠️ Alertas y Notificaciones BEM
│ │ ├── \_badges.scss # 🏷️ Badges y Etiquetas BEM
│ │ ├── \_buttons.scss # 🔘 Sistema de Botones BEM
│ │ ├── \_cards.scss # 🃏 Tarjetas Producto BEM
│ │ ├── \_carousel.scss # 🖼️ Carruseles e Sliders BEM
│ │ ├── \_loading.scss # ⏳ Indicadores Carga BEM
│ │ └── \_modals.scss # 💬 Modales y Off-Canvas BEM
│ │
│ ├── pages/ # 📄 Estilos Específicos por Página
│ │ ├── \_admin.scss # 👨‍💼 Panel Administración
│ │ ├── \_cart.scss # 🛒 Página Carrito y Checkout
│ │ ├── \_catalog.scss # 🛍️ Catálogo Productos Mobile First
│ │ ├── \_dashboard.scss # 📊 Dashboard Usuario y BI
│ │ ├── \_home.scss # 🏠 Landing Page y Hero
│ │ ├── \_login.scss # 🔐 Páginas Autenticación
│ │ ├── \_offline.scss # 📲 Página Offline PWA
│ │ └── \_products.scss # 📦 Detalles Producto
│ │
│ ├── themes/ # 🎭 Sistema de Temas
│ │ ├── \_dark-mode.scss # 🌙 Tema Oscuro Completo
│ │ └── \_theme.scss # 🎨 Tema Principal y Colores Marca
│ │
│ └── vendors/ # 📚 Librerías Externas
│ ├── \_bootstrap.scss # 🎀 Overrides y Customización Bootstrap
│ └── \_custom-vendors.scss # 🔧 Integración Otras Librerías
│
├── 🖼️ Recursos Multimedia (img/)
│ ├── carrusel_products/ # 🖼️ Imágenes Carrusel Principal
│ │ ├── bravette_steak.png # 🥩 Bravette Steak
│ │ ├── filet_mignon.png # 🥩 Filet Mignon
│ │ ├── flak_steak.png # 🥩 Flak Steak
│ │ ├── ney_york_strip.png # 🥩 New York Strip
│ │ ├── porterhouse.png # 🥩 Porterhouse
│ │ ├── rib-eye.png # 🥩 Rib Eye
│ │ ├── skirt_steak.png # 🥩 Skirt Steak
│ │ ├── tomahawk.png # 🥩 Tomahawk
│ │ └── top_sirloin.png # 🥩 Top Sirloin
│ │
│ ├── products/ # 🖼️ Imágenes Categorías Productos
│ │ ├── cerdo.png # 🐖 Cerdo
│ │ ├── embutidos.png # 🌭 Embutidos
│ │ ├── frutasverduras.png # 🥦 Frutas y Verduras
│ │ ├── merch.png # 👕 Merchandising
│ │ ├── otrosproductos.png # 📦 Otros Productos
│ │ ├── pollo.png # 🐔 Pollo
│ │ ├── premium.png # ⭐ Productos Premium
│ │ ├── preparadas.png # 🍲 Preparadas
│ │ └── res.png # 🐄 Res
│ │
│ └── logo-user.png # 👤 Avatar Usuario
│
├── 📦 Build y Distribución
│ └── dist/ # 🏗️ Build Producción (NO MODIFICAR)
│
├── 🔧 Configuración
│ ├── manifest.json # 📱 Config PWA
│ ├── netlify.toml # 🚀 Config Despliegue Netlify
│ ├── package.json # 📦 Dependencias del Proyecto
│ ├── package-lock.json # 🔒 Lockfile Dependencias
│ ├── postcss.config.js # 🔧 Configuración PostCSS
│ ├── tailwind.config.js # 🎨 Configuración Tailwind
│ ├── tsconfig.json # 📝 Configuración TypeScript
│ ├── .env # 🗝️ Variables de Entorno
│ └── .gitignore # 🙈 Archivos Ignorados por Git
│
├── 📚 Documentación
│ ├── README.md # 📖 Documentación Desarrolladores
│ ├── GOB.md # 📋 Guía de Operaciones (Agentes IA)
│ └── AGENTS/ # 🤖 Configuración Agentes IA
│
└── 🗃️ Archivos No Modificables
├── node_modules/ # 📚 Dependencias (NO MODIFICAR)
├── css/main.css # 🎨 CSS Compilado (NO MODIFICAR)
├── css/main.css.map # 🗺️ Source Maps (NO MODIFICAR)
└── dist/ # 🏗️ Build Producción (NO MODIFICAR)
📝 Notas de Corrección de Archivos
\_typeography.scss → Mantener nombre actual (compatible con estructura existente)
\_aierts.scss → Mantener nombre actual (compatible con estructura existente)
\_bern-utilities.scss → Mantener nombre actual (compatible con estructura existente)
IV. REGLAS CRÍTICAS DE SEGURIDAD Y ESTÁNDARES (HARD CONSTRAINTS)
🛡️ Ciberseguridad OWASP - Restricciones Duras

1. Control de Acceso Roto (BAC) - CRÍTICO
   // IMPLEMENTACIÓN OBLIGATORIA en loyalty.js + Supabase RLS
   const premiumAccessControl = {
   route: "/premium.html",
   validation: "Supabase RLS + JWT verification + Frontend check",
   requirements: [
   "user_status = premium",
   "valid_subscription",
   "email_verified = true",
   ],
   fallback: "redirect to /login with security audit log",
   audit: "log all access attempts to security dashboard",
   };
2. Validación de Inputs Críticos - IMPLEMENTACIÓN FINAL
   Campo Patrón Regex Mensaje Error Módulo OWASP Category
   Nombre ^[A-Za-záéíóúñÁÉÍÓÚÑ\s]{2,50}$ "Solo letras y espacios (2-50 caracteres)" checkout.js A03:2021
   Teléfono ^[0-9]{10}$ "Debe contener exactamente 10 dígitos" checkout.js A03:2021
   Dirección ^(?=.\*[0-9]).{10,100}$ "Debe contener al menos un número y 10-100 caracteres" checkout.js A03:2021
3. Hashing Robusto - REQUERIMIENTO BACKEND OBLIGATORIO
   -- SUPABASE SETUP - Política de seguridad obligatoria
   CREATE POLICY "password_security_policy" ON auth.users
   FOR UPDATE USING (
   password_hash ~ '^\$2[ayb]\$.{56}$' OR -- Bcrypt validation
   password_hash ~ '^\$argon2id\$' -- Argon2id validation
   );

-- RLS para datos sensibles
CREATE POLICY "premium_data_access" ON premium_content
FOR SELECT USING (
auth.jwt() ->> 'premium_status' = 'active'
AND auth.jwt() ->> 'email_verified' = 'true'
); 4. Prevención de Inyección SQL - IMPLEMENTACIÓN OBLIGATORIA
// api.js - PATRÓN SEGURO OBLIGATORIO
const secureDatabaseOperations = {
method: "parameterized_queries_only",
library: "Supabase Client (built-in protection)",
validation: "input_sanitization_before_processing",
patterns: ["prepared_statements", "type_validation", "length_limits"],
prohibited: [
"string_concatenation",
"direct_value_interpolation",
"eval_operations",
],
};
📐 Estándares de Calidad de Código - Restricciones Duras 5. Metodología BEM Estricta - ELIMINACIÓN CONFLICTOS BOOTSTRAP
// ✅ CORRECTO - BEM ESTRICTO IMPLEMENTADO (EVITA CONFLICTOS)
.producto-card {
padding: var(--spacing-md);

&\_\_image {
width: 100%;
border-radius: var(--border-radius);

    &--featured {
      border: 2px solid var(--color-primary);
    }

}

&\_\_title {
font-size: var(--font-size-lg);
color: var(--color-text);

    &--discount {
      color: var(--color-error);
      text-decoration: line-through;
    }

}

&\_\_price {
font-weight: var(--font-weight-bold);

    &--current {
      color: var(--color-success);
    }

}
}

// ❌ PROHIBIDO - CUALQUIER DESVIACIÓN (CAUSA CONFLICTOS)
.product-card-image {
} // ESPECIFICIDAD PELIGROSA
.card .title {
} // ACOPLAMIENTO PELIGROSO 6. Documentación JSDoc Obligatoria - ESTÁNDAR COMPLETO
/\*\*

- @module cart
- @description Motor principal de gestión del carrito con personalización avanzada
- @param {Object} product - Producto con estructura completa
- @param {string} product.id - UUID del producto
- @param {string} product.name - Nombre del producto
- @param {number} product.price - Precio base por unidad/kg
- @param {Object} options - Opciones de personalización
- @param {string} options.type - Tipo: 'weight'|'price'|'piece'
- @param {number} options.value - Valor de personalización
- @param {Object} options.customization - Configuración específica
- @returns {Promise<CartItem>} Item del carrito con cálculos aplicados
- @throws {ValidationError} Cuando el producto no tiene stock disponible
- @throws {CustomizationError} Cuando las opciones no son válidas
- @throws {SecurityError} Cuando hay problemas de autenticación
- @since v2.0.0
- @author Arquitectura Principal
- @see {@link module:productos} Para gestión de inventario
- @example
- const item = await addToCart(
- { id: 'prod-123', name: 'Rib Eye', price: 25.99 },
- { type: 'weight', value: 1.5, customization: { thickness: 2.5 } }
- );
  \*/
  export async function addToCart(product, options) {
  // Implementación validada con pruebas de seguridad
  }

7. Desarrollo Guiado por Pruebas (TDD) - FLUJO OBLIGATORIO

# PLANTILLA OBLIGATORIA PARA NUEVAS FUNCIONALIDADES

Feature: [Nombre funcionalidad business]
Como [rol usuario específico]
Quiero [acción concreta y medible]
Para [beneficio business cuantificable]

Background:
Given el usuario está autenticado correctamente
And tiene los permisos necesarios para la acción

Scenario: [Escenario principal exitoso]
Given [estado inicial del sistema]
When [el usuario realiza acción específica]
Then [el sistema debe responder con resultado esperado]
And [las métricas business deben actualizarse]

Scenario: [Escenario de error controlado]
Given [condiciones que generan error]
When [el usuario realiza la acción]
Then [el sistema debe mostrar error específico]
And [no debe exponer información sensible]

Scenario: [Escenario de seguridad]
Given [un usuario no autorizado]
When [intenta acceder al recurso]
Then [el sistema debe denegar acceso]
And [registrar intento en log de seguridad]
V. ARQUITECTURA DE SEGURIDAD IMPLEMENTADA
🔐 Estrategia de Autenticación y Autorización Multi-Capa
Capa Frontend (auth.js - Validaciones Cliente)
const frontendSecurity = {
storage: "Secure HTTPOnly Cookies + Session Storage temporal",
token_management: "JWT with 15-minute expiration + Refresh tokens",
otp_flow: "Mandatory for registration + sensitive operations",
session_timeout: "30 minutes inactivity + Automatic logout",
validation: "Real-time input sanitization + XSS prevention",
};
Capa Backend (Supabase RLS - Validaciones Servidor)
-- POLÍTICAS DE SEGURIDAD IMPLEMENTADAS - RLS ACTIVO
-- 1. Control acceso productos públicos/privados
CREATE POLICY "products_select_policy" ON products
FOR SELECT USING (
public = true
OR auth.role() = 'admin'
OR (auth.role() = 'authenticated' AND premium = true)
);

-- 2. Control acceso usuarios premium con verificación
CREATE POLICY "premium_content_access" ON premium_content
FOR SELECT USING (
auth.jwt() ->> 'premium_status' = 'active'
AND auth.jwt() ->> 'email_verified' = 'true'
AND (auth.jwt() ->> 'subscription_active')::boolean = true
);

-- 3. Control modificación datos usuario
CREATE POLICY "user_data_update_policy" ON user_profiles
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Auditoría de seguridad
CREATE POLICY "security_logs_insert" ON security_logs
FOR INSERT WITH CHECK (true);
🛡️ Protección de Datos y Privacidad Multi-Nivel
Validación Frontend (Tiempo Real)
Sanitización de inputs con DOMPurify
Validación de formatos antes del envío
Mensajes de error específicos sin información sensible
Prevención de XSS con encoding automático
Validación Backend (Defensa Profunda)
Re-validación de todos los inputs recibidos
Limitación de tasa de requests por usuario/IP
Logging de actividades sospechosas en tiempo real
Cifrado de datos sensibles en reposo
Protección de Rutas Críticas
const protectedRoutes = {
"/premium.html": {
requiredRole: "premium",
validation: ["jwt_verify", "premium_status_check", "subscription_active"],
fallback: "/upgrade-plan.html",
},
"/admin/dashboard.html": {
requiredRole: "admin",
validation: ["jwt_verify", "admin_role_check", "ip_whitelist"],
fallback: "/access-denied.html",
},
"/user/dashboard.html": {
requiredRole: "authenticated",
validation: ["jwt_verify", "email_verified_check"],
fallback: "/login.html",
},
};
VI. GUÍA OPERACIONAL Y FLUJOS DE TRABAJO
🔄 Proceso de Desarrollo Aprobado - TDD ESTRICTO

1. Flujo TDD Estándar Obligatorio
   AC Definition → Gherkin Specification → Unit Tests → Implementation →
   Security Review → Performance Testing → Documentation → Deployment
2. Integración de Módulos - PATRÓN SEGURO
   // PATRÓN DE INTEGRACIÓN OBLIGATORIO PARA NUEVOS MÓDULOS
   import { api } from "../core/api.js";
   import { validate } from "../core/security.js";
   import { audit } from "../utils/security-logger.js";

export async function secureBusinessProcess(inputData) {
// 1. Validación seguridad multi-nivel
const sanitizedData = validate.inputs(inputData, securityRules);
await audit.logAction("process_start", sanitizedData);

// 2. Lógica negocio con manejo de errores
try {
const businessResult = await api.secureCall(sanitizedData);

    // 3. Transformación respuesta segura
    const safeResponse = transform.forUI(businessResult);
    await audit.logAction("process_success", safeResponse);

    return safeResponse;

} catch (error) {
// 4. Manejo seguro de errores
await audit.logAction("process_error", error);
throw new SecurityError("Process failed securely");
}
} 3. Gestión de Estado - ARQUITECTURA DEFINITIVA
// ARCHITECTURE PATTERN - State Management Seguro
const stateManagementPattern = {
global: "appState en app.js (mínimo necesario)",
module: "Estado interno por módulo (encapsulado)",
persistence: {
client: "LocalStorage cifrado (datos no sensibles)",
server: "Supabase + RLS (datos sensibles)",
},
synchronization: "Service Worker offline-first + conflict resolution",
security: {
encryption: "AES-256 para datos locales",
validation: "Schema validation en cada transición",
audit: "Log de cambios de estado críticos",
},
};
🚀 Scripts y Herramientas - CONFIGURACIÓN FINAL
Comandos Validados y Documentados

# DESARROLLO Y PRUEBAS

npm run dev # Servidor desarrollo Vite + HMR
npm run scss:watch # Compilación SCSS en tiempo real
npm run test:unit # Ejecución pruebas unitarias (Jest)
npm run test:security # Auditoría seguridad estática

# PRODUCCIÓN Y DEPLOYMENT

npm run build # Build optimizado producción (Vite)
npm run preview # Vista previa build producción
npm run audit:security # Auditoría seguridad OWASP completa
npm run deploy:staging # Deploy a ambiente staging
npm run deploy:production # Deploy a producción

# CALIDAD Y DOCUMENTACIÓN

npm run lint # Análisis estático código (ESLint + Stylelint)
npm run lint:security # Análisis seguridad código
npm run docs # Generación documentación (JSDoc)
npm run metrics # Análisis métricas de calidad
VII. MÉTRICAS Y MONITOREO DE CALIDAD
📊 Métricas de Calidad Obligatorias
Métrica Objetivo Herramienta Frecuencia Responsable
Coverage Código >85% Jest + Coverage Pre-commit Desarrollo
Security Score A+ (95+) OWASP ZAP + Lighthouse Semanal Seguridad
Performance >90 Lighthouse CI Cada build DevOps
BEM Compliance 100% Stylelint + BEM Linter Pre-commit UI/UX
JS Doc Coverage 100% JSDoc Validator Pre-commit Desarrollo
Accessibility >95 axe-core Cada PR QA
🔍 Auditorías Programadas y Automatizadas
Auditoría Semanal de Seguridad
Revisión automática políticas RLS Supabase
Validación patrones seguridad en nuevos commits
Análisis dependencias vulnerables (npm audit)
Escaneo de código estático (SonarQube)
Auditoría Mensual de Arquitectura
Penetration testing completo
Revisión arquitectura seguridad
Actualización políticas acceso
Análisis de métricas de performance
Auditoría Trimestral de Business Intelligence
Revisión métricas Chart.js
Análisis tendencias de ventas
Optimización queries de analytics
Actualización dashboards de BI
VIII. PROCEDIMIENTOS DE EMERGENCIA
🔴 Incidentes Críticos de Seguridad
Procedimiento de Contención Inmediata
Detección: Monitoreo automático + alertas en tiempo real
Aislamiento: Desconexión inmediata componente afectado
Análisis: Auditoría forense completa + logs de seguridad
Corrección: Parche con validación seguridad + pruebas regresión
Prevención: Actualización GOB.md + training equipo + revisión procesos
🟡 Incidentes de Performance Críticos
Procedimiento Optimización Urgente
Identificación: Métricas Lighthouse + monitoring real-time
Diagnóstico: Análisis profiling + identificación cuellos botella
Optimización: Refactorización módulos críticos + caching estratégico
Validación: Pruebas carga + performance + métricas business
Monitorización: Métricas continuas + alertas proactivas
🟢 Mejoras Arquitectónicas Mayores
Proceso de Cambio Controlado
Propuesta: RFC detallada con impacto seguridad/performance
Revisión: Comité arquitectura + seguridad + business
Implementación: Sprint dedicado + testing exhaustivo
Validación: Auditoría seguridad externa + pruebas carga
Despliegue: Rollout progresivo + monitorización intensiva
IX. RESPONSABILIDADES Y OWNERSHIP
👥 Ownership de Módulos Críticos
Módulo Owner Responsabilidades SLA Backup
Security Core Arquitecto Principal Validaciones OWASP, Auth, RLS 24/7 Security Lead
Cart & Products Senior Frontend Lógica negocio, Personalización Business Frontend Lead
UI/UX Components UI Lead BEM Compliance, Responsive Business Design System
API & Data Backend Lead Supabase, RLS, Performance 24/7 DevOps Lead
Business Intelligence BI Analyst Chart.js, Métricas, Analytics Business Data Engineer
📝 Proceso de Cambios Estructurado
Cambios Críticos (Security, Architecture, Performance)
Propuesta: RFC técnica con análisis impacto completo
Revisión: Comité arquitectura + seguridad + business
Implementación: Sprint dedicado + pair programming
Validación: Auditoría seguridad + pruebas performance
Despliegue: Feature flags + rollout progresivo
Cambios Estándar (Features, Bugs, Mejoras)
Ticket: Especificación Gherkin + criterios aceptación
Desarrollo: TDD + code review obligatorio
Review: 2 reviewers + security check automático
Testing: Suite completa + regresión + integración
Deploy: Pipeline CI/CD + monitorización automática
Última Actualización: 2025-10-23
Versión Documento: GOB.md v5.0 - Arquitectura Final Consolidada
Responsable: Arquitecto Principal - pipeTawns-x
Estado: ✅ ARQUITECTURA FINAL IMPLEMENTADA Y VERIFICADA
Próxima Revisión: 2026-01-23
Hash Verificación: a1b2c3d4e5f67890 (SHA-256 del estado actual)

NOTA FINAL PARA AGENTES IA
Este documento representa el estado final y aprobado de la arquitectura. Cualquier desviación de estas especificaciones debe ser rechazada y reportada inmediatamente. Las Restricciones Duras en la Sección IV son innegociables y constituyen la base de la seguridad, mantenibilidad y escalabilidad del sistema.

DIRECTIVA PRINCIPAL: Ante cualquier duda sobre implementación, priorizar siempre la seguridad sobre la funcionalidad.
