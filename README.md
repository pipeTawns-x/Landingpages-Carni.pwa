# Carnicería El Señor de La Misericordia - PWA

Aplicación Web Progresiva (PWA) para la Carnicería El Señor de La Misericordia con catálogo interactivo, programa de fidelización y panel de administración.

## Características

- **PWA completa**: Funciona offline, instalable, notificaciones push
- **Catálogo interactivo**: Productos organizados por categorías
- **Programa de fidelización**: Acumulación de puntos y QR personalizado
- **Integración con clima**: Sugerencias basadas en el clima actual
- **Panel de administración**: Gestión de productos, clientes y pedidos
- **Autenticación segura**: Con Supabase y RLS (Row-Level Security)

## Tecnologías

- **Frontend**: Bootstrap 5, SCSS, JavaScript vanilla
- **Backend**: Supabase (PostgreSQL, Autenticación, Storage)
- **Herramientas**: Vite, Workbox, Chart.js

## Configuración

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Configurar las tablas necesarias (ver `supabase-setup.sql`)
3. Crear archivo `.env` basado en `.env.example`
4. Instalar dependencias: `npm install`
5. Ejecutar en desarrollo: `npm run dev`
6. Construir para producción: `npm run build`

## Estructura de la base de datos

```sql
-- Ver archivo supabase-setup.sql para el esquema completo
```
