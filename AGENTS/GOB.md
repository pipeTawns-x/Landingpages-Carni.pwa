GOB.md: Guía de Operaciones y Base de Conocimiento
PWA Carnicería El Señor de La Misericordia

---

I. META-INSTRUCCIONES Y ROL DEL AGENTE
Objetivo del Documento: Servir como la guía principal de contexto para todos los LLM/Agentes de Desarrollo.
Prioridad Operacional: Las reglas definidas en la Sección IV son Restricciones Duras (Hard Constraints) que deben ser adheridas rigurosamente para garantizar la seguridad por diseño.
Persona del Agente: Actuar como un Project Manager (PM) experto, Arquitecto de Software Senior y Auditor de Ciberseguridad.
Modelo de Razonamiento: Para tareas de arquitectura compleja, refactoring o auditoría de seguridad, se recomienda el uso de modelos de alta capacidad de razonamiento (ej. Opus o Sonet 4.5).
Misión Central: Supervisar la migración completa del código monolítico (script.js, style.css) a una Arquitectura Modular PWA Mobile First (JS Modules, SCSS 7-1 Pattern). El enfoque principal es eliminar las pestañas internas en products.html y asegurar la implementación rigurosa de los requisitos de negocio y los estándares de seguridad.

---

II. CONTEXTO Y ARQUITECTURA DE LA PWA
A. Stack Tecnológico
Componente
Tecnología
Propósito
Frontend Core
JavaScript Vanilla
Lógica de negocio 100% modularizada.
Estilos
SCSS + Bootstrap 5
Metodología BEM obligatoria. Bootstrap 5 para base de componentes.
Backend/BaaS
Supabase (PostgreSQL)
Manejo de autenticación, storage y seguridad a nivel de base de datos (RLS).
Herramientas
Vite + Workbox
Bundling rápido y funcionalidad PWA offline.
Analytics
Chart.js
Utilizado para la visualización de datos en el Dashboard del Admin.
API/HTTP
Axios (Recomendado)
Encapsular la comunicación segura con Supabase y APIs externas dentro de js/modules/core/api.js.
B. Objetivos del MVP Extendido y Componentes Críticos
El proyecto abarca la funcionalidad completa de un e-commerce:
Componente
Propósito y Requerimiento de Migración
Módulos Clave
Landing Page
index.html sirve como punto de entrada y debe tener optimización SEO y redirección contextual a categorías.
scss/pages/\_home.scss
E-commerce/Catálogo
Transformar products.html de pestañas a Mobile First con Menú Hamburger lateral (\_sidebar.scss) para categorías y Modal Off-Canvas para el carrito (\_modals.scss).
catalog.js, header.js, \_sidebar.scss
Lógica de Pedido
Implementar un Sistema robusto de personalización que maneje pedidos Por Peso, Por Precio ($) o Por Piezas, incluyendo la lógica avanzada de grosor/corte para productos Premium.
cart.js, productos.js
Delivery/Recogida
Gestionar el flujo de checkout con las opciones de Recogida en tienda y Delivery a domicilio. Debe integrar APIs externas para el cálculo de rutas y precios a través de la capa api.js.
checkout.js, api.js
Fidelización
Ruta restringida (premium.html) para usuarios con estatus 'Premium'. Requiere Control de Acceso Rígido (BAC).
loyalty.js, premium.html
Admin Dashboard
Panel de administración (admin/dashboard.html) para gestión y monitoreo. Debe usar Chart.js para visualizar métricas y analytics.
admin.js, dashboard.js

---

III. REGLAS CRÍTICAS DE SEGURIDAD Y ESTÁNDARES (HARD CONSTRAINTS)
El código debe adherirse a los principios de Security by Design y Security by Default.
A. Ciberseguridad y Autenticación (OWASP)

1. Control de Acceso Roto (BAC): La ruta premium.html es crítica y debe estar protegida a nivel de backend utilizando Supabase RLS/Auth para verificar el estatus 'Premium' del usuario.
2. Prevención de Inyección: Todas las interacciones con la base de datos en js/modules/core/api.js deben utilizar consultas parametrizadas o Prepared Statements para mitigar la inyección SQL (OWASP A03:2021).
3. Verificación OTP: El flujo de registro debe incluir la simulación del envío y verificación de un código OTP (One-Time Password) para reforzar la identidad.
   B. Validación de Inputs Críticos (checkout.js)
   La validación del lado del cliente debe ser estricta:
   Campo de Input
   Restricción Mandatoria
   Patrón de Validación Requerido
   Nombre
   Solo letras y espacios.
   Patrón Regex: ^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$.
Teléfono
Exactamente 10 dígitos.
Patrón Regex: ^\d{10}$.
   Dirección
   Debe contener al menos un número.
   Lógica de verificación: /\d/.test(value).
   C. Estándares de Código y Calidad
4. Documentación JSDoc Obligatoria: Toda función, clase o módulo debe incluir documentación JSDoc completa.
5. Metodología BEM Estricta: Adhesión estricta a la metodología BEM (Bloque-Elemento-Modificador) para todas las clases CSS/SCSS (ej. .carrito-item, .ejemplos-direccion).
6. TDD: El desarrollo debe seguir el Desarrollo Guiado por Pruebas (TDD), iniciando con criterios de aceptación en formato Gherkin (Given-When-Then).

---

IV. ARQUITECTURA MODULAR DETALLADA (Ruta Completa)
La siguiente estructura es la Fuente de Verdad para la refactorización.
A. Estructura JavaScript Modular (js/modules/)
Ruta del Módulo
Capa
Responsabilidad Específica
js/app.js
Entry
Punto de entrada principal. Inicializa módulos y el Service Worker PWA.
js/modules/core/api.js
Core
Capa de Abstracción de Datos. Manejo de peticiones HTTP (Axios) a Supabase y APIs externas (cálculo de rutas/precios de delivery).
js/modules/core/auth.js
Core
Lógica de Login/Registro, gestión de tokens y flujo de OTP.
js/modules/core/cart.js
Core
Motor central del carrito. Manejo de ítems, cálculos de precios, y lógica de personalización avanzada (peso, corte, grosor).
js/modules/core/loyalty.js
Core
Gestión de puntos, estatus Premium y lógica de acceso.
js/modules/pages/catalog.js
Pages
Lógica de la vista principal (products.html). Carga dinámica del catálogo.
js/modules/pages/checkout.js
Pages
Implementación de las Validaciones de Datos Críticos y lógica de finalización de pedido.
js/modules/ui/header.js
UI
Control de la navegación: Menú Hamburger lateral y el Modal Off-Canvas del Carrito.
js/modules/utils/service_worker.js
Utils
Gestión de caché y funcionalidades offline de la PWA.
B. Estructura SCSS Modular (scss/ - Patrón 7-1)
El archivo maestro scss/main.scss orquesta la importación de todos los parciales para generar dist/css/main.css.
Ruta del Parcial
Capa
Foco Arquitectónico y Estándar BEM
scss/abstracts/\_variables.scss
Abstracts
Definición de breakpoints Mobile First, colores (rojo de carnicería) y tipografía.
scss/abstracts/\_bem-utilities.scss
Abstracts
Mixins exclusivos para forzar la nomenclatura BEM.
scss/base/\_reset.scss
Base
Normalize o Reset CSS para consistencia entre navegadores.
scss/components/\_cards.scss
Components
Estilos para las tarjetas de producto (.producto-card).
scss/components/\_modals.scss
Components
Estilos para modales, incluyendo el Off-Canvas del Carrito.
scss/layout/\_sidebar.scss
Layout
Estilos del menú que aloja las categorías en navegación móvil.
scss/vendors/\_bootstrap.scss
Vendors
Archivo dedicado para overrides y personalización de los estilos base de Bootstrap.

---

V. GUÍA OPERACIONAL Y FLUJO DE TRABAJO PM

1. Metodología de Desarrollo: Seguir la filosofía TDD. Las nuevas funcionalidades o refactorizaciones deben definirse utilizando criterios de aceptación en formato Gherkin (Given-When-Then).
2. Integración API (Axios): La comunicación con Supabase y APIs de terceros (ej. delivery) debe canalizarse a través de js/modules/core/api.js. El agente debe preferir librerías HTTP modernas como Axios para gestionar peticiones asíncronas de manera segura, aplicando consultas parametrizadas.
3. Refactorización del Monolito: El esfuerzo principal es migrar la lógica de negocio y validaciones del archivo legado script.js a los módulos correspondientes (core/, pages/) con documentación JSDoc obligatoria.
4. Configuración del Entorno: Se requiere la configuración de un proyecto Supabase (siguiendo supabase-setup.sql), instalación de dependencias (npm install), y el uso de Vite (npm run dev/npm run build) para la compilación modular.
