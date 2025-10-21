# 🥩 Carnicería El Señor de La Misericordia - E-commerce PWA

### Arquitectura Modular Mobile First

[![PWA Status](https://img.shields.io/badge/PWA-Ready_for_Offline-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) [1, 2]
[![Arquitectura](https://img.shields.io/badge/Architecture-Modular_SCSS_%2F_JS_Modules-green.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-JS_Vanilla_%7C_Bootstrap_5-informational.svg)](https://getbootstrap.com/) [3]
[![Seguridad](https://img.shields.io/badge/Security-OWASP_A01_%7C_RLS-red.svg)](https://owasp.org/www-project-top-ten/) [2, 4]

Una **Aplicación Web Progresiva (PWA)** moderna y de alto rendimiento que transforma el catálogo de la Carnicería El Señor de La Misericordia en una experiencia de e-commerce optimizada para pedidos personalizados y móviles [1]. Este proyecto se enfoca en la **migración modular** del código legado (monolítico) a una estructura escalable y de alta mantenibilidad [5].

## 🚀 Características Clave

El proyecto abarca la funcionalidad completa de un e-commerce con enfoque en la experiencia del usuario y la robustez del sistema [6].

- **PWA Completa:** Soporte para funcionamiento _offline_ y capacidades de instalación en dispositivos (manifest.json) [2, 7].
- **Catálogo Interactivo:** Productos organizados por categorías y con opciones de personalización avanzada de pedidos (peso, corte, grosor) [2, 8].
- **Diseño Mobile First (MVP):** Refactorización del diseño de pestañas internas a un **Header ligero**, **Menú Hamburger** para navegación de categorías (`_sidebar.scss`) y **Modal Off-Canvas** para el Carrito (`_modals.scss`) [8].
- **Programa de Fidelización:** Soporte para acumulación de puntos y acceso a rutas restringidas (`premium.html`) [2, 9, 10].
- **Seguridad:** Autenticación robusta basada en **Supabase** y control de acceso a nivel de fila (**RLS**) [6].
- **Integración Inteligente:** Funcionalidad para sugerencias basadas en el clima actual (futura implementación) [6].

## 💻 Tecnologías Utilizadas

Este proyecto sigue una arquitectura ligera y moderna, priorizando el rendimiento del lado del cliente.

| Componente        | Tecnología                       | Notas de Arquitectura                                                                                                                                        |
| :---------------- | :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Core** | **JavaScript Vanilla** [3]       | Lógica de negocio 100% modularizada [5].                                                                                                                     |
| **Estilos**       | **SCSS** [3]                     | Implementación estricta de la metodología **BEM** [11].                                                                                                      |
| **Framework CSS** | **Bootstrap 5** [3]              | Utilizado como base de componentes, con overrides en `scss/vendors/` [12, 13]. (Inspiración en diseños como Spectra o Codecraft para un layout limpio) [14]. |
| **Backend/DB**    | **Supabase** (PostgreSQL) [15]   | Manejo de autenticación, _storage_ y seguridad a nivel de base de datos.                                                                                     |
| **Herramientas**  | **Vite, Workbox, Chart.js** [15] | Bundling rápido, funcionalidad offline y visualización de datos (Admin Panel) [15].                                                                          |
| **API/HTTP**      | **Axios** (Recomendado)          | Se recomienda su uso para encapsular la comunicación con Supabase dentro del módulo `js/modules/core/api.js`.                                                |

## 📁 Estructura Modular del Proyecto

El proyecto está en proceso de migración de `script.js` y `style.css` [10] a la siguiente estructura modular estándar (Patrón 7-1 en SCSS) [5, 16]:

LANDINGPAGES-CARNI.PWA/ ├── 📁 css/ # Archivos CSS compilados │ └── main.css # Salida principal de SCSS │ ├── 🎨 scss/ # Fuentes SCSS (Estructura 7-1) │ ├── 📁 abstracts/ # Variables (\_variables.scss), Mixins y soporte BEM │ ├── 📁 base/ # Reset, Tipografía y Utilidades │ ├── 📁 components/ # Componentes reutilizables (\_cards.scss, \_modals.scss) │ ├── 📁 layout/ # Estructura principal (\_header.scss, \_sidebar.scss) │ ├── 📁 pages/ # Estilos específicos por vista (\_catalog.scss, \_cart.scss) │ ├── 📁 vendors/ # Integración y overrides de Bootstrap │ └── 🎯 main.scss # Archivo de importación maestro │ ├── ⚙️ js/ │ ├── app.js # Punto de entrada y orquestación │ └── 📁 modules/ │ ├── 📁 core/ # Lógica de Negocio │ │ ├── api.js # Capa de API y peticiones HTTP │ │ └── cart.js # Motor avanzado de gestión de carrito │ ├── 📁 pages/ # Lógica específica de la vista │ │ ├── catalog.js # Interacciones en products.html │ │ └── checkout.js # Lógica de registro y validaciones críticas │ └── 📁 utils/ # Helpers (ej. service_worker.js para PWA) │ └── 🌐 Páginas HTML ├── index.html # Landing Page (Referencia estable) ├── products.html # Vista Crítica del E-commerce (MODIFICADO) └── premium.html # Área de Fidelización (Acceso Restringido - BAC)

## 🛡️ Estándares de Ciberseguridad y Calidad

El código debe adherirse a los principios de **Security by Design** [24] y **TDD** (Desarrollo Guiado por Pruebas) [25].

### A. Estándares de Código

1.  **Metodología BEM (Bloque-Elemento-Modificador):** Es **obligatorio** en todos los archivos SCSS/CSS [11]. Ejemplos de clases: `.carrito-item-info`, `.ejemplos-direccion` [11].
2.  **Documentación JSDoc:** Toda función o módulo nuevo debe incluir documentación **JSDoc completa** [5, 26].
3.  **Filosofía DRY:** Evitar código duplicado, extrayendo lógica común a módulos de utilidad (`js/modules/utils/dom-utils.js`) [27, 28].

### B. Validaciones de Seguridad Críticas

La validación del lado del cliente (y se asume la validación del lado del servidor) debe ser estricta para mitigar la inyección de datos inseguros (OWASP A03:2021) [4].

| Campo             | Restricción                                                     | Patrón/Lógica                                                                   | Fuente en Código Monolítico              |
| :---------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------------------------------------- |
| **Nombre**        | Solo letras y espacios.                                         | Patrón Regex: `[A-Za-záéíóúñÁÉÍÓÚÑ\s]+` [5, 29].                                | `script.js` -> `validarNombre()` [29]    |
| **Teléfono**      | Exactamente 10 dígitos.                                         | Patrón: `{10}` [5, 30].                                                         | `script.js` -> `validarTelefono()` [30]  |
| **Dirección**     | Debe contener al menos un número (para la numeración de calle). | Lógica: `/\d/` [5, 31].                                                         | `script.js` -> `validarDireccion()` [31] |
| **Autenticación** | Requiere OTP.                                                   | Implementación de verificación de código **OTP** por teléfono simulada [4, 32]. |

### C. Control de Acceso

- **Rutas Restringidas:** La página `premium.html` está marcada como **Backlog** y debe requerir un **Control de Acceso Riguroso (BAC)** del lado del servidor (utilizando RLS de Supabase) para evitar el acceso directo no autorizado [4, 10].

## ⚙️ Configuración del Entorno

Siga estos pasos para configurar el entorno de desarrollo y comenzar a trabajar en la refactorización [3]:

### 📋 Prerrequisitos

- Node.js (versión LTS)
- NPM o Yarn
- Configuración de proyecto **Supabase** (ver `supabase-setup.sql` para esquema de tablas) [3].

### ⚡ Inicio Rápido

1. Crear un proyecto en Supabase [15].
2. Configurar las tablas necesarias (ver `supabase-setup.sql`) [3].
3. Crear archivo `.env` basado en `.env.example` [3].
4. Instalar dependencias:
   ````bash
   npm install
   ``` [3]
   ````
5. Ejecutar en desarrollo (usando Vite):
   ````bash
   npm run dev
   ``` [3]
   ````
6. Construir para producción:
   ````bash
   npm run build
   ``` [3]
   ````

## 📝 Guía para Desarrolladores

Si utiliza agentes de IA, considere el archivo de contexto `GOB.md` (o `AGENTS.md`) como la fuente de verdad para el comportamiento del agente [33-35].

**Flujo de Trabajo TDD:** Las nuevas funcionalidades deben ser definidas usando criterios de aceptación estilo **Gherkin** (`Given-When-Then`) antes de escribir el código [36].
le falta quiero que la ruta modular se vea completa como PWA E-commerce Carnicería: Arquitectura Mobile First

🥩 Carnicería El Señor de La Misericordia - E-commerce PWA
Arquitectura Modular Mobile First: Fuente de Verdad para Desarrolladores

Este es el repositorio de la Aplicación Web Progresiva (PWA) de e-commerce de la Carnicería El Señor de La Misericordia. El proyecto se encuentra en una fase crítica de migración y refactorización de código monolítico (script.js, style.css) a una arquitectura modular escalable, orientada a un diseño Mobile First.
La autenticación se maneja con Supabase y RLS (Row-Level Security), y la comunicación API debe priorizar llamadas HTTP modernas, idealmente usando Axios (o fetch) encapsuladas.
🎯 Objetivo de Migración y Características
El objetivo principal es eliminar la dependencia de los archivos monolíticos (como las pestañas internas en products.html) y trasladar la lógica de negocio a un sistema de módulos [14, 8 orientada a un diseño Mobile First.
La autenticación se maneja con Supabase y RLS (Row-Level Security), y la comunicación API debe priorizar llamadas HTTP modernas, idealmente usando Axios (o fetch) encapsuladas.
🎯 Objetivo de Migración y Características
El objetivo principal es eliminar la dependencia de los archivos monolíticos (como las pestañas internas en products.html) y trasladar la lógica de negocio a un sistema de módulos.
Característica
Estado Anterior (Monolítico)
Nueva Implementación (Modular)
Página Focal
products.html con pestañas de Catálogo, Carrito, Registro.
Diseño Mobile First con Off-Canvas para Carrito y Sidebar para categorías.
Lógica
Toda la lógica en script.js.
Modularización estricta en js/modules/ (Core, UI, Pages) con JSDoc obligatorio.
Estilos
style.css.
SCSS modular (Patrón 7-1) y adhesión estricta a la metodología BEM.
Seguridad
Validación básica de formularios.
Validación reforzada de Inputs Críticos y Control de Acceso Riguroso (BAC) para premium.html.
Interacciones
Lógica de cálculo en el DOM.
Lógica de pedido avanzada (peso/corte/piezas) encapsulada en cart.js y productos.js.
📁 Arquitectura Modular PWA (Ruta Completa)
Esta estructura representa la arquitectura final de producción y es la Fuente de Verdad para la refactorización.
LANDINGPAGES-CARNI.PWA/
├── 📁 dist/ # 📦 Archivos de distribución (Producción) [14]
│ ├── 📁 css/
│ │ └── main.css # Salida final de la compilación SCSS [14].
│ └── 📁 js/
│ └── bundle.js # Salida de la compilación de módulos JS (via Vite) [14].
│
├── ⚙️ js/
│ ├── app.js # Punto de entrada principal (Inicialización de la PWA/Módulos) [15].
│ └── 📁 modules/ # Módulos JavaScript organizados por responsabilidad [14].
│ ├── 📁 core/ # 🧠 Lógica de Negocio y Datos (Responsabilidad Única) [5].
│ │ ├── api.js # Abstracción de llamadas HTTP (Axios) a Supabase/APIs externas [5, 16].
│ │ ├── auth.js # Autenticación, gestión de tokens y flujo de OTP [5, 17].
│ │ ├── cart.js # Motor central del carrito, cálculos y estado [5, 17].
│ │ ├── loyalty.js # Lógica del programa de fidelización (puntos, estatus Premium) [5].
│ │ ├── productos.js # Gestión de datos del catálogo, filtros y personalización de cortes [5].
│ │ └── search.js # Lógica de búsqueda optimizada [5].
│ ├── 📁 pages/ # 🌐 Lógica de Scripts específicos de cada vista [5].
│ │ ├── admin.js # Interacción para el Panel de Administración [15].
│ │ ├── catalog.js # Lógica de la vista principal de `products.html` [15].
│ │ ├── dashboard.js # Lógica del dashboard de usuario (historial de pedidos) [15].
│ │ └── checkout.js # Flujo de registro y validaciones de envío [17].
│ ├── 📁 ui/ # 🎨 Lógica de Componentes de Interfaz y widgets [5].
│ │ ├── header.js # Control de navegación, menú Hamburger [5].
│ │ ├── notifications.js # Sistema de alertas y mensajes de usuario [5].
│ │ └── weather.js # Lógica para integración con clima (sugerencias) [5].
│ └── 📁 utils/ # 🛠 Funciones de ayuda reutilizables (DRY) [15].
│ ├── dom-utils.js # Utilidades para manipulación del DOM (antes base_dinamica.js) [15].
│ └── service_worker.js # Gestión del Service Worker para funcionalidad PWA Offline [15].
│
├── 🎨 scss/ # Fuentes de Estilos SCSS (Patrón Arquitectónico 7-1) [15].
│ ├── 📁 abstracts/ # Herramientas: variables, mixins, placeholders [15].
│ │ ├── \_bem-utilities.scss # Mixins para forzar la nomenclatura BEM [18].
│ │ ├── \_variables.scss # Paleta de colores, tipografía, breakpoints [15].
│ │ └── \_mixins.scss # Funciones reutilizables de CSS [15].
│ ├── 📁 base/ # Estilos base: Reset, Tipografía y Utilidades [15].
│ │ ├── \_reset.scss # Normalize o Reset CSS [19].
│ │ ├── \_typography.scss # Declaración de fuentes y estilos de texto [19].
│ │ └── \_utilities.scss # Clases helper (margen, padding, etc.) [19].
│ ├── 📁 components/ # Componentes reutilizables a nivel de UI [19].
│ │ ├── \_alerts.scss # Estilos para alertas y mensajes [19].
│ │ ├── \_cards.scss # Estilos para `.producto-card` [19].
│ │ └── \_modals.scss # Estilos para modales y Off-Canvas del Carrito [19].
│ ├── 📁 layout/ # Estructura del sitio: Header, Footer, Grid [19].
│ │ ├── \_header.scss # Estilos del encabezado principal [19].
│ │ ├── \_sidebar.scss # Estilos para el menú lateral/hamburger móvil [19].
│ │ ├── \_forms.scss # Estilos globales para formularios [19].
│ │ └── \_grid.scss # Sistema de layout responsivo (ej. CSS Grid) [19].
│ ├── 📁 pages/ # Estilos específicos de cada vista [19].
│ │ ├── \_admin.scss # Estilos exclusivos del panel de administración [20].
│ │ ├── \_catalog.scss # Estilos de la grilla de productos [20].
│ │ ├── \_cart.scss # Estilos específicos para la vista de carrito [20].
│ │ └── \_login.scss # Estilos para las páginas de autenticación [20].
│ ├── 📁 themes/ # Temas, como Dark Mode [13].
│ │ └── \_dark-mode.scss # Soporte para tema oscuro [20].
│ ├── 📁 vendors/ # Estilos de librerías de terceros [13].
│ │ └── \_bootstrap.scss # Integración y overrides de Bootstrap [13].
│ └── 🎯 main.scss # Archivo principal de compilación (importa todo) [13].
│
└── 🌐 Páginas HTML (Vistas)
├── index.html # Landing Page [8].
├── products.html # Vista de Catálogo (Focal, debe ser Mobile First) [8].
└── premium.html # Ruta Restringida (BACKLOG - Requiere BAC) [3].
🔒 Seguridad y Estándares de Calidad
El PM/Arquitecto experto requiere la adhesión a las siguientes restricciones de diseño (Hard Constraints):
A. Ciberseguridad y Validación (OWASP)

1. Control de Acceso Roto (BAC): La página premium.html es una ruta crítica y requiere verificación de roles en el lado del servidor, asumiendo la implementación de RLS en Supabase para proteger los datos.
2. Validación de Inputs Críticos: La validación en checkout.js (o en script.js durante la refactorización) es crucial.
   ◦ Nombre: Solo letras y espacios. Patrón Regex: ^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$.
    ◦ Teléfono: Exactamente 10 dígitos. Patrón: ^{10}$.
   ◦ Dirección: Debe contener al menos un número (para la numeración de calle). Lógica de verificación: /\d/.
3. Prevención de Inyección: Utilizar siempre consultas parametrizadas en la capa API (api.js) para evitar la Inyección SQL (A03:2021).
4. Autenticación: El proceso de registro simula el envío y verificación de un código OTP (One-Time Password) por teléfono.
   B. Estándares de Desarrollo
   • BEM Obligatorio: Toda clase CSS/SCSS nueva o refactorizada debe seguir la metodología BEM (ej. .carrito-item, .ejemplos-direccion).
   • JSDoc: La documentación JSDoc es obligatoria para todas las funciones y módulos para mejorar la legibilidad y la mantenibilidad.
   • Metodología: El desarrollo de nuevas funcionalidades se guía por TDD (Test-Driven Development), utilizando Gherkin (Given-When-Then) para los criterios de aceptación.
   🛠 Configuración y Scripts
   Para comenzar a trabajar en la refactorización modular:
5. Crear un proyecto en Supabase.
6. Configurar las tablas necesarias (ver supabase-setup.sql).
7. Instalar dependencias: npm install.
8. Ejecutar en desarrollo: npm run dev.
9. Construir para producción: npm run build.
10. Asegurar que el compilador SCSS (ej. Live Sass Compiler o Vite) esté monitoreando los archivos en scss/ para generar la salida dist/css/main.css
