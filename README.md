# 🥩 Carnicería El Señor de La Misericordia

**Proyecto desarrollado en colaboración humano-IA, siguiendo reglas de agents.md, código limpio y estructura profesional.**

## E-commerce PWA - Plataforma de Ventas Online

**Este proyecto integra trabajo de desarrolladores y agentes IA, asegurando que el resultado sea profesional, seguro, responsivo y maximalista.**

[![Licencia](https://img.shields.io/badge/Licencia-MIT-green)](LICENSE)
[![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20SCSS%20%7C%20Supabase-blue)](https://github.com)
[![PWA](https://img.shields.io/badge/PWA-Enabled-brightgreen)](https://github.com)
[![Mobile-First](https://img.shields.io/badge/Responsive-Mobile%20First-orange)](https://github.com)

---

## 📋 Descripción

Plataforma e-commerce para carnicería local con las siguientes características:

- 🛒 **Catálogo de productos** con 9 categorías
- 🛍️ **Carrito de compras** interactivo con modal
- 👤 **Sistema de autenticación** con efecto sliding panel
- 🎯 **Programa de fidelización** con puntos y QR
- 📱 **PWA** con soporte offline
- 🚚 **Opciones de entrega** (Recoger en tienda / Delivery)
- 📊 **Dashboard administrativo** para gestión

---

## 🤖 Colaboración Humano-IA y agents.md

- El desarrollo y la documentación siguen las mejores prácticas de [agents.md](https://agents.md/) y colaboración humano-IA.
- La IA debe actuar como asistente experto, nunca como reemplazo del criterio humano. Si el resultado no es exactamente lo que el desarrollador espera, la IA debe pedir contexto claro y revisar los chats y comentarios en los editores de código.
- El código y la documentación deben ser claros, legibles y útiles tanto para desarrolladores humanos como para agentes automáticos (IA, MCP, etc.).
- El trabajo generado debe ser indistinguible de un desarrollo profesional humano, evitando resultados genéricos o poco cuidados.
- Toda mejora debe mantener y mejorar la responsividad, la seguridad (OWASP), la funcionalidad y el estilo maximalista.
- La IA debe verificar la estructura actual del proyecto y asegurarse de que los archivos estén completos y bien documentados antes de entregar cualquier resultado.
- Si falta contexto, la IA debe solicitarlo explícitamente antes de continuar.

### Requisitos previos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/carni-mvp.git
cd carni-mvp

# Instalar dependencias
npm install

# Compilar SCSS
npx sass css/styles.scss css/styles.css

# Iniciar servidor de desarrollo
npx vite --port 3002
```

### Acceder a la aplicación

- **Landing page**: http://localhost:3002/tagsCore/index.html
- **Productos**: http://localhost:3002/tagsCore/products.html
- **Login/Registro**: http://localhost:3002/tagsCore/user/accessweb.html
- **Admin**: http://localhost:3002/tagsCore/admin/dashboar.html

---

## 🏗️ Arquitectura del Proyecto

Este proyecto implementa **Screaming Architecture**, donde la estructura grita el propósito del negocio:

```
Carni-mvp/
├── tagsCore/              # Vistas del negocio
│   ├── index.html         # Home/Landing
│   ├── products.html      # Catálogo
│   ├── user/accessweb.html    # Autenticación
│   └── admin/dashboar.html    # Administración
│
├── css/                   # SCSS 7-1 Pattern
│   ├── abstracts/         # Variables, mixins, funciones
│   ├── base/              # Reset, tipografía
│   ├── components/        # Botones, cards, modales
│   ├── layout/            # Header, footer, sidebar
│   ├── pages/             # Estilos por página
│   └── themes/            # Temas (dark mode)
│
├── js/modules/            # JavaScript ES6
│   ├── core/              # Lógica de negocio
│   ├── pages/             # Controladores por vista
│   ├── ui/                # Componentes de interfaz
│   └── utils/             # Utilidades
│
└── img/                   # Recursos gráficos
    ├── recursos_web/      # Logos, imágenes auth
    ├── products/          # Imágenes productos
    └── carrusel_products/ # Carrusel
```

---

## 🛠️ Stack Tecnológico

| Tecnología                  | Uso                                   |
| --------------------------- | ------------------------------------- |
| **Vanilla JavaScript ES6+** | Lógica de aplicación                  |
| **SCSS 7-1 Pattern**        | Estilos organizados                   |
| **Bootstrap 5**             | Grid y componentes base               |
| **Supabase**                | Backend (PostgreSQL + Auth + Storage) |
| **Axios**                   | Cliente HTTP                          |
| **Vite**                    | Bundler y servidor de desarrollo      |
| **Font Awesome**            | Iconografía                           |

---

## 📱 Características Responsive

El proyecto sigue enfoque **Mobile-First**:

| Breakpoint | Dispositivo   | Características                                   |
| ---------- | ------------- | ------------------------------------------------- |
| 320px      | Móvil pequeño | Layout vertical, drawer, imágenes ocultas en auth |
| 570px      | Móvil grande  | Layout vertical mejorado                          |
| 768px      | Tablet        | Grid de 2 columnas                                |
| 870px      | Tablet grande | Sliding panel horizontal en auth                  |
| 1024px+    | Desktop       | Layout completo, grid de 4 columnas               |

---

## 🔐 Sistema de Autenticación

### Vista Unificada (accessweb.html)

Login y registro en una sola página con efecto **sliding panel**:

- Panel rojo animado que se desliza entre modos
- Formularios con validación frontend
- Integración con Supabase Auth
- Soporte para OAuth (Google, Facebook)

### Flujo de autenticación

```
Usuario → accessweb.html → Supabase Auth → Redirección
                                              ├── Usuario → index.html
                                              └── Admin → admin/dashboar.html
```

---

## 🛒 Carrito de Compras

### Funcionalidades

- ✅ Agregar productos con modal automático
- ✅ Modificar cantidad/peso en tiempo real
- ✅ Eliminar productos individuales
- ✅ Cálculo de totales dinámico
- ✅ Selector de entrega (Recoger/Delivery)
- ✅ Generación de ticket
- ✅ Persistencia en localStorage
- ✅ Sincronización con Supabase

### Uso

```javascript
// Agregar producto
CarniCart.addItem({
  id: "prod-001",
  name: "Arrachera Premium",
  price: 289,
  quantity: 1,
  image: "img/products/arrachera.png",
});

// Obtener total
const total = CarniCart.getTotal();

// Vaciar carrito
CarniCart.clear();
```

---

## 🎨 Guía de Estilos

### Colores

```scss
$color-primary: #d9534f; // Rojo carnicería
$color-accent: #ff6d00; // Naranja
$color-bg-dark: #363432; // Fondo oscuro
$color-text-dark: #212121; // Texto principal
```

### Tipografía

- **Títulos**: Poppins (600-700)
- **Body**: Roboto (400-500)
- **Formularios**: Poppins (500)

### Componentes BEM

```scss
.auth-container {
} // Bloque
.auth-container__form {
} // Elemento
.auth-container--active {
} // Modificador
```

---

## 📂 Estructura de Archivos Detallada

### CSS (SCSS 7-1 Pattern)

```
css/
├── styles.scss              # Archivo principal (imports)
├── abstracts/
│   ├── _variables.scss      # Colores, breakpoints, espacios
│   ├── _mixins.scss         # Mixins reutilizables
│   ├── _functions.scss      # Funciones SCSS
│   └── _bem-utilities.scss  # Utilidades BEM
├── base/
│   ├── _reset.scss          # CSS reset
│   ├── _typography.scss     # Estilos de tipografía
│   └── _utilities.scss      # Clases de utilidad
├── components/
│   ├── _buttons.scss        # Estilos de botones
│   ├── _cards.scss          # Tarjetas de producto
│   ├── _forms.scss          # Formularios
│   └── _modals.scss         # Modales (carrito)
├── layout/
│   ├── _header.scss         # Header principal
│   ├── _footer.scss         # Footer
│   └── _auth-layout.scss    # Layout de autenticación
├── pages/
│   ├── _access.scss         # Página de login/registro
│   ├── _home.scss           # Página principal
│   └── _productos.scss      # Página de productos
└── themes/
    └── _dark-mode.scss      # Tema oscuro
```

### JavaScript (Módulos ES6)

```
js/modules/
├── supabase.js              # Cliente Supabase
├── core/
│   ├── auth.js              # Autenticación + sliding panel
│   ├── cart.js              # Carrito de compras
│   ├── productos.js         # Gestión de productos
│   ├── delivery.js          # Opciones de entrega
│   └── loyalty.js           # Programa de fidelización
├── pages/
│   ├── catalog.js           # Lógica del catálogo
│   ├── dashboard.js         # Dashboard admin
│   └── checkout.js          # Proceso de compra
├── ui/
│   ├── header.js            # Header + drawer móvil
│   ├── notifications.js     # Sistema de notificaciones
│   └── search.js            # Búsqueda de productos
└── utils/
    ├── offline.js           # Manejo de modo offline
    └── service-worker.js    # Service worker PWA
```

---

## 🔧 Comandos de Desarrollo

```bash
# Compilar SCSS (una vez)
npx sass css/styles.scss css/styles.css --no-source-map

# Compilar SCSS (watch mode)
npx sass css/styles.scss css/styles.css --watch

# Servidor de desarrollo
npx vite --port 3002

# Build para producción
npx vite build
```

---

## 🌐 Configuración Supabase

### Variables de entorno

Crear archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### Tablas requeridas

```sql
-- Usuarios (manejado por Supabase Auth)

-- Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  newsletter BOOLEAN DEFAULT false,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Programa de fidelidad
CREATE TABLE loyalty_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  points INTEGER DEFAULT 0,
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 Reglas para Archivos Markdown

- Todo archivo `.md` debe tener un título claro, tabla de contenido si es extenso, y secciones bien delimitadas.
- La documentación debe ser legible, profesional y útil tanto para humanos como para agentes IA.
- Incluye ejemplos de uso, fragmentos de código y referencias a recursos externos relevantes (como agents.md).
- Actualiza los archivos markdown cada vez que se realice una mejora relevante en el código o la estructura.
- Los archivos deben reflejar fielmente la estructura y el contexto actual del proyecto.
- Si la IA genera o modifica un archivo markdown, debe verificar que el resultado sea exactamente lo que el desarrollador espera y, si no, pedir contexto adicional.

- **GOB.md**: Guía operativa para agentes IA (reglas, prohibiciones, checklist)
- **manifest.json**: Configuración PWA
- **netlify.toml**: Configuración de deploy en Netlify

---

## 🤝 Contribución

### Conductas para Código Limpio y Estructurado

- Escribe código modular, reutilizable y bien comentado.
- Usa nombres descriptivos para variables, funciones y archivos.
- Mantén la coherencia en la estructura de carpetas y archivos según Screaming Architecture.
- Elimina código muerto o no utilizado.
- Documenta funciones, módulos y componentes con comentarios claros y útiles.
- Usa linters y formateadores automáticos para mantener el estilo.
- Revisa y prueba el código en todos los breakpoints y navegadores soportados.

1. Lee `GOB.md` antes de hacer cambios
2. Sigue la estructura de Screaming Architecture
3. Usa SCSS 7-1 Pattern (no CSS puro)
4. Aplica metodología BEM
5. Respeta enfoque Mobile-First
6. Actualiza documentación si es necesario

---

---

**Referencia:**

- [agents.md](https://agents.md/)
- [Video: Cómo colaborar con IA](https://youtu.be/3spCFnMSGIY?si=kKzg-QJXeTrymyY8)

---

## 📄 Licencia

MIT License - Ver archivo [LICENSE](LICENSE)

---

## 👥 Contacto

- **Negocio**: Carnicería El Señor de La Misericordia
- **Ubicación**: San Luis Potosí, México
- **Teléfono**: +52 444 271 5470
- **Email**: contacto@carniceriasenmisericordia.com

---

**Desarrollado con ❤️ para la comunidad de San Luis Potosí**

**Última actualización:** 19 de enero 2026
