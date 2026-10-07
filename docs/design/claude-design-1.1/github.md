repo: pipeTawns-x/Landingpages-Carni.pwa
branch: pruebas
path: docs/design

## Last sync
date: 2026-09-29T07:26:37Z
### Updated in this project
- Loop final v2.1, pasada 1 (en curso): Índice, logotipo y monograma, enlaces reales, Mis datos, Ajustes de tienda y zonas, paquetes, Catálogo de la semana
- Fuente de datos: docs/design/datos/catalogo-real.md

## Previous sync
date: 2026-09-22T23:02:02Z

### Updated in this project
- Brief de 42 pantallas: bloques 1 a 5 cerrados con su reporte; bloque 6a (inicio del panel y tablero de pedidos) escrito.
- Componentes compartidos: Tarjeta, Encabezado, Pie y AdminNav; todas las pantallas los importan.
- Datos reales tomados del repo: catálogo y precios (cargar-catalogo-y-admin.sql), reseñas (src/data/resenas.ts), horario, dirección y teléfono (index.html, js/modules/chatbot.js).
- Copiadas 33 fotos de producto y el póster del video; rib-eye.webp del repo es un T-bone (anotado como pendiente).

## Screen map
| Pantalla en el proyecto | Archivos del repo |
| --- | --- |
| Bloque 1 · componentes globales | docs/design/direccion-visual.md · capturas 02, 03, 05, 09, 16 · js/modules/chatbot.js |
| Tarjeta / Encabezado / Pie | docs/cargar-catalogo-y-admin.sql · public/img/products/* |
| Bloque 2 · landing | index.html · src/data/resenas.ts · src/components/Testimonios/* · capturas 01, 06–10, 36 · public/img/Videos/VideoCarniwebP01-poster.jpg |
| Bloque 3 · catálogo y ficha | docs/cargar-catalogo-y-admin.sql · capturas 11–15, 17–22 |
| Bloque 4 · acceso | capturas 23–25, 39 |
| Bloque 5 · compra | docs/brain/glossary.md (estados del pedido) · capturas 04, 09 |
| Bloque 6a · panel inicio y pedidos | capturas 26–29, 33 · docs/brain/vision.md (Kanban) |

## Sync history
- 2026-09-22T09:30:21Z — branch pruebas: G0 completo (tokens, tarjeta única, controles) y tabla de autorrevisión.
- 2026-09-21T23:15:23Z — branch pruebas: leídos spec v1.4 y loop-mejoras; construido G0.1 con tres especímenes tipográficos; copiadas 2 capturas y 3 fotos de producto.
- 2026-09-17T07:40:00Z — branch main: auditoría as-is, DESIGN.md y tabla de 17 inconsistencias.
