--------------------------------------------------------------------------------
LANDINGPAGES-CARNI.PWA
Carnicería El Señor de La Misericordia - E-commerce y PWA
Aplicación Web Progresiva (PWA) de doble enfoque: una Landing Page principal (index.html) y una Web Secundaria de E-commerce (products.html) optimizada para pedidos personalizados, ciberseguridad y experiencia Mobile First [Contexto, 6, 7].
El proyecto se encuentra en una fase de migración a una arquitectura modular estricta para garantizar escalabilidad, rendimiento y facilidad de mantenimiento.
---

---

🎯 Metas del Producto Mínimo Viable (MVP)
El objetivo principal es implementar la lógica de carrito y pedidos avanzados (como se ve en el CodePen de origen) y transformar su interfaz de pestañas internas a un flujo moderno, responsivo y modular [Contexto].

1. Estrategia de la Web de Productos (products.html)
   La página products.html (Web Secundaria) dejará de ser una página de pestañas monolíticas y se convertirá en un E-commerce dedicado y accesible.
   Característica
   Base Anterior (CodePen Tabs)
   Mejora Implementada (MVP)
   Módulos Impactados
   Navegación Principal
   Pestañas internas: Categorías, Carrito, Registro.
   Eliminación de pestañas. El header debe ser ligero y solo incluir iconos de búsqueda, Carrito y Navegación Móvil [Contexto].
   \_header.scss, header.js
   Catálogo/Categorías
   Tablero horizontal con botones de categoría.
   Para Mobile First: La navegación de categorías (Res, Pollo, Cerdo, Embutidos, Premium, Preparadas) se moverá a un Menú Hamburger (Sidebar) [Contexto, 2].
   \_sidebar.scss, catalog.js
   Flujo de Carrito
   Contenido visible en la pestaña "Carrito".
   El carrito (carritoItems) se integra como un Modal lateral o Off-Canvas que se activa al hacer clic en el icono de Carrito en el Header [Contexto, 12].
   \_modals.scss, cart.js
   Personalización de Producto
   Modal para definir peso/corte/piezas.
   Se mantiene y se robustece. Esta lógica avanzada es clave del MVP (ej. Cálculo de precio por peso, precio por monto, o por pieza; grosor de corte para Premium).
   productos.js, ui.js
2. Integración Landing Page ↔ E-commerce
   La navegación debe permitir que los usuarios lleguen al catálogo de productos (products.html) de dos maneras [Contexto]:
3. Búsqueda Directa: Indexación SEO para búsquedas como "Carniceria el señor de la misericordia Productos" [Contexto].
4. Redirección con Contexto: Desde la Landing Page (index.html), al seleccionar una categoría específica (ej. "Premium"), el usuario será redireccionado directamente al contenedor de productos de esa categoría (#premium dentro de products.html) y se activará su vista, mejorando la usabilidad [Contexto, 107].
5. Flujo de Pedido (Checkout) y Fidelización
   El proceso de confirmación de pedido debe ser flexible, integrando el Sistema de Fidelización solo para usuarios registrados. La lógica del tab de Registro del CodePen se separa y se vuelve más robusta.
   Escenario
   Resultado Requerido
   Base de Ciberseguridad
   Registro de Usuario y Fidelización
   El usuario accede a la página register.html o se registra en el flujo de checkout. El registro se refuerza con la verificación de código OTP por teléfono y se garantiza la robustez en ciberseguridad (hashing, prevención de fuerza bruta, Control de Acceso Riguroso - BAC) [Contexto, 328].
   Módulos: js/modules/core/auth.js, js/modules/pages/checkout.js.
   Orden Básica (Invitado)
   El usuario puede generar una orden sin necesidad de registro completo/login. Se requiere información mínima (Nombre, Teléfono y Dirección/Hora de Recogida) para completar el pedido, como se manejaba en la base del CodePen. No activa el sistema de fidelización.
   Módulos: js/modules/pages/checkout.js. Validación rigurosa de nombre (solo letras), teléfono (10 dígitos) y dirección (contiene número).

---

📂 Arquitectura Modular y Rutas Detalladas
La arquitectura sigue un modelo modular estricto separando las responsabilidades de lógica de negocio (Core), Interfaz (UI) y Vistas de Página (Pages).

1. Estructura de Directorios
   LANDINGPAGES-CARNI.PWA/
   ├── dist/ # Salida de Distribución (Generada por Bundler/Vite) [69]
   │ ├── css/
   │ │ └── main.css # CSS compilado de SCSS [66]
   │ └── js/
   │ └── bundle.js # JS compilado y modularizado [69]
   │
   ├── img/ # Archivos de Imagen, Iconos y Assets [69]
   ├── scss/ # Archivos Fuente SCSS (Patrón 7-1) [67, 70]
   ├── js/ # Archivos Fuente JavaScript [69]
   ├── index.html # Landing Page Principal (ESTABLE) [32]
   ├── products.html # Web Secundaria E-commerce / Catálogo (MODIFICADO) [32]
   ├── login.html # Flujo de inicio de sesión seguro [71]
   ├── register.html # Flujo de registro de cliente (MODIFICADO) [71]
   ├── premium.html # Ruta de Fidelización (Requiere Control de Acceso Riguroso) [32]
   ├── manifest.json # Configuración PWA [71, 72]
   ├── package.json # Dependencias y Scripts
   └── README.md
2. Rutas Modulares JS (Lógica y Funcionalidad)
   Ruta Confirmada
   Propósito Principal
   Comentarios
   js/app.js
   Punto de entrada principal para el bundler.
   Inicializa listeners globales y el Service Worker.
   js/modules/core/api.js
   Manejo de llamadas a Supabase/API.
   Encapsula la comunicación con el Backend.
   js/modules/core/auth.js
   Lógica de autenticación y seguridad.
   Controla Login/Registro, gestión de tokens y seguridad de acceso.
   js/modules/core/cart.js
   Lógica de negocio del Carrito.
   Maneja adición/eliminación de ítems, cálculo de subtotales y totales.
   js/modules/core/loyalty.js
   Programa de Fidelización.
   Gestión de puntos, estatus Premium y funcionalidades asociadas.
   js/modules/core/productos.js
   Gestión de datos de productos.
   Procesa la base de datos de productos (similar al const productos del CodePen) y aplica filtros.
   js/modules/ui/header.js
   Control del Header.
   Maneja el estado de los iconos (Carrito/Hamburguer) y redirecciones.
   js/modules/ui/notifications.js
   Manejo de notificaciones.
   Notificaciones push PWA y alertas internas (ej. Producto añadido al carrito).
   js/modules/pages/catalog.js
   Lógica de la vista de Productos.
   Carga dinámica de la cuadrícula de productos, interacción con el Modal de Personalización.
   js/modules/pages/checkout.js
   Lógica de finalización de Pedido/Registro.
   Implementa la validación de campos del CodePen (nombre, teléfono, dirección) y el flujo de OTP.
   js/modules/utils/dom-utils.js
   Utilidades de manipulación del DOM.
   Funciones de ayuda genéricas (antes llamado base_dinamica.js).
   js/modules/utils/service_worker.js
   Lógica del Service Worker.
   Para funcionalidad offline y caché de la PWA.
3. Rutas Modulares SCSS (Estilos)
   La estructura de estilos garantiza la adherencia a BEM y Mobile First [Contexto].
   Ruta Confirmada
   Propósito Principal
   Comentarios
   scss/abstracts/\_variables.scss
   Variables globales.
   Colores, tipografía y breakpoints (clave para Mobile First).
   scss/abstracts/\_bem-utilities.scss
   Utilidades para BEM.
   Mixins que fuerzan el cumplimiento de la metodología BEM.
   scss/base/\_reset.scss
   Normalize o Reset CSS.
   Asegura consistencia entre navegadores.
   scss/components/\_cards.scss
   Estilos para las tarjetas de producto.
   Estilización de .producto-card (visto en CodePen) y optimización visual de precios.
   scss/components/\_modals.scss
   Estilos de Modales y el Off-Canvas del Carrito.
   Controla el diseño del productoModal y el nuevo modal del carrito.
   scss/layout/\_header.scss
   Estilos del Encabezado.
   Optimización para Mobile, incluyendo los nuevos iconos de Carrito/Hamburger.
   scss/layout/\_sidebar.scss
   Estilos del Menú Hamburger.
   Aloja la navegación de categorías en dispositivos móviles.
   scss/pages/\_catalog.scss
   Estilos específicos para la vista de Catálogo.
   Controla la visualización de los productos.
   scss/pages/\_cart.scss
   Estilos de la interfaz del Carrito.
   Controla carrito-item y carrito-total.
   scss/pages/\_login.scss / \_admin.scss
   Estilos de Autenticación y Administración.
   Refuerza el diseño de formularios seguros y acceso a panel.
   scss/main.scss
   Archivo Maestro.
   Importa todos los módulos en el orden correcto.

---

🎨 Recomendación de Integración de Diseño (Templates)
Dado el énfasis en el E-commerce de productos alimenticios (products.html) y la necesidad de mantener un diseño limpio y moderno (Mobile First, PWA), se recomienda integrar elementos de los siguientes temas de Bootstrap:

1. Enfoque E-commerce: El template Foodmart o Fruitables ofrece un diseño fresco con colores brillantes y un enfoque directo en el producto, ideal para la web secundaria.
2. Enfoque de Componentes y Navegación: El diseño debe ser limpio y orientado a resultados, similar a Spectra o Codecraft (con amplio espacio en blanco), utilizando la paleta de colores roja de la carnicería.
   Integración de Componentes Clave:
   • Tarjetas de Producto (Cards): Utilizar un diseño de tarjeta (.producto-card) que destaque la información de precios (por kg, por pieza) de manera clara, con una animación sutil al pasar el mouse (como sugiere Spectra o Stride) para indicar que son interactivos.
   • Modal de Personalización: El modal de detalles del producto debe ser visualmente prominente, utilizando los Custom Forms de Bootstrap para los radios de tipoPedido y el Range Slider para el grosor de corte, asegurando una UX fluida en móvil.
   • Navegación Móvil: El menú Hamburger debe ser claro y funcional, siguiendo el diseño responsivo detallado en \_sidebar.scss para facilitar la selección de categorías rápidamente, un requerimiento clave para la navegabilidad Mobile First.

---

🔒 Ciberseguridad y Validación (Foco en Checkout)
Se mantiene el compromiso de robustecer la seguridad, especialmente en los puntos críticos de login y registro. El enfoque debe ser Seguridad por Diseño.

1. Validación Frontend Reforzada: La validación de datos críticos (nombre: solo letras, teléfono: 10 dígitos, dirección: al menos un número) se migra al módulo js/modules/pages/checkout.js para su manejo, ofreciendo una experiencia de usuario clara con mensajes de error inmediatos.
2. Verificación OTP (One-Time Password): El proceso de verificación por código (simulado en el CodePen) es esencial. En la implementación real con Supabase, este proceso debe ser robusto y rápido, migrado completamente al módulo auth.js.
3. Control de Acceso (BAC): Es fundamental asegurar que la ruta premium.html (Fidelización) aplique un Control de Acceso Riguroso (BAC) del lado del servidor/Supabase (RLS), previniendo el Broken Access Control (vulnerabilidad crítica).

---

🛠️ Configuración del Proyecto y Tareas de Desarrollo
Para poner en marcha el desarrollo, se requiere:
Requisitos Previos
• Node.js (LTS) y NPM.
• Un proyecto configurado en Supabase con los endpoints de autenticación.
• Configurar las reglas de RLS (Row-Level Security) en Supabase.
Puesta en Marcha

1. Clonar y Dependencias:
2. Variables de Entorno: Crear el archivo .env basado en .env.example y configurar las claves de Supabase.
3. Ejecución en Desarrollo (Vite):
4. Compilación de Estilos (SCSS): Es obligatorio el uso de un compilador (como Vite o Live Sass Compiler) para generar dist/css/main.css desde los archivos fuente en la carpeta scss/.
5. Compilación de Lógica (Módulos JS): Se utiliza un bundler (Vite) para resolver la arquitectura modular en js/modules/ y empaquetarla en dist/js/bundle.js.

---

Hecho por pipeTawns-x | Arquitectura Modular PWA
