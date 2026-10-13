# Kit del panel: convenciones y cómo lo aplica Django

El panel lo sirve Django (decisión del 2026-10-06; contrato en `docs/CONTRATO_PANEL_DJANGO.md` de `practicas-ebac`). El rediseño entrega HTML y CSS planos, sin JavaScript, y marca lo que Django llena. El backend mueve el archivo con `git mv`, quita las marcas y las cambia por etiquetas de plantilla.

## Qué hay

| Archivo | Qué es | Destino en Django |
|---|---|---|
| `dashboar.html` (raíz) | el marco del panel (barra lateral, pestañas, barra superior, `<main>`) y el contenido de Inicio | `panel/base.html` (todo lo que queda fuera de `django:block contenido`) y `panel/inicio.html` (lo que queda dentro) |
| `src/styles/panel.css` | entrada de Tailwind v4 del panel: `tokens.css`, fuentes autoalojadas y la base (foco de arena) | la compila la canalización de Tailwind de Django; en Vite se vincula con `<link rel="stylesheet" href="/src/styles/panel.css">` |
| `kit/mas.html` | la página "Más" de móvil: Clientes, Publicidad, Ajustes y Cerrar sesión, cada una en una fila de 56 px | `panel/mas.html` (`/panel/mas/`, `panel:mas`) |

`mas.html` no es un documento completo: se inserta en el marco. Los íconos van en línea (cada `<svg>` lleva su `<path>`, trazo 1.8 y `currentColor`), así que ningún bloque depende de un sprite.

## Reglas del HTML del panel

- Sin `<script>`, sin controladores en línea, sin CDN, sin `innerHTML`. Lo interactivo es un enlace o un formulario.
- Estilos solo con clases de Tailwind que salen de `tokens.css`: `text-meta|ui|lead|titulo|seccion`, `rounded-control|card|dialog|sheet`, `bg-surface-*`, `border-border` (solo líneas decorativas), `border-border-control` (bordes de controles), `text-red-text`, `text-sand`. Nada de `text-[..px]`, `rounded-md`, `uppercase` ni `backdrop-blur`.
- Todo control mide 44 x 44 px o más, con el anillo de foco de arena (regla global en `panel.css`).
- Enlaces solo a la tabla de rutas del contrato. Salir es un `<form method="post" action="/panel/salir/">` con `<!-- django:csrf -->`.
- El estado activo de la navegación lo pinta el atributo `aria-current`: las clases usan `aria-[current]:`. Django solo agrega o quita el atributo.
- Lo que la base de datos no puede dar no se dibuja. Si la rama que no se dibuja ya tiene diseño, vive dentro de un `<template>` inerte (ver abajo).

## Marcas

El contrato (§3) define `django:for` y `data-dj`. Este kit agrega las demás; el backend debería anotarlas en el registro de cambios del contrato.

| Marca | Significado |
|---|---|
| `data-dj="obj.campo"` | el texto del elemento es `{{ obj.campo }}`. El contenido de ejemplo es real o, si no hay datos, un texto de relleno evidente |
| `<!-- django:for x in y -->` ... `<!-- django:empty -->` ... `<!-- django:endfor -->` | `{% for %}`. El primer elemento es el cuerpo del ciclo. Los hermanos con `data-dj-ejemplo` solo sirven para ver la vista previa: se borran |
| `<!-- django:if cond -->` / `django:else` / `django:endif` | `{% if %}` |
| `<!-- django:block nombre -->` ... `<!-- django:endblock -->` | `{% block %}`. Bloques del marco: `title` (envuelve el elemento `<title>` completo), `titulo` (el `<h1>`), `accion` (botón de la barra superior) y `contenido` |
| `<!-- django:extends x -->`, `<!-- django:include x -->` | `{% extends %}`, `{% include %}` |
| `<!-- django:active nombre -->` | va antes de un enlace de navegación: lleva `aria-current="page"` cuando la vista actual es `nombre`, y su `href` es `{% url 'nombre' %}`. `inventory:*` significa cualquier ruta del espacio `inventory` (el `href` es `inventory:list`). La pestaña "Más" lleva `aria-current="page"` en `panel:mas` y `aria-current="true"` en `panel:ads` y `settings:index`, que viven dentro de Más |
| `<!-- django:url nombre args -->` | el `href` del enlace que sigue es `{% url 'nombre' args %}` |
| `<!-- django:csrf -->` | `{% csrf_token %}` |
| `<!-- django:static ruta -->` | el `href` del elemento que sigue es `{% static 'ruta' %}`; para `panel.css`, la hoja que compile Django |
| `<template data-dj-rama="...">` | diseño de una rama que la vista previa estática no dibuja (filas de pedidos, estado vacío de stock, parcial de mensajes). Django quita la etiqueta `<template>` y deja lo que hay dentro |

## Datos de Inicio (nombres de contexto)

Son una propuesta del rediseño para que el backend los use o los corrija. Los datos de ejemplo son del catálogo real (53 productos, 9 categorías).

| Nombre | Qué es | Estado hoy |
|---|---|---|
| `today` | fecha de hoy, por ejemplo "Miércoles 7 de octubre" | sale de Django |
| `kpis.active_products`, `kpis.total_products`, `kpis.categories` | productos con `is_active`, productos y categorías | existe: 53, 53 y 9 |
| `low_stock_products`, `low_stock_count`, `low_stock_threshold` | los productos con `stock <= umbral`, ordenados por `stock, name`, con `select_related("category")`; `low_stock_count` cuenta todos, la lista muestra 5 | existe. Con umbral 15 salen 5: ids 42, 45, 41, 43 y 7 |
| `kpis.sales_today`, `kpis.orders_today`, `kpis.average_ticket` | suma de `orders.total`, conteo y promedio de hoy | `orders` tiene 0 filas: salen `$0.00`, `0` y "Sin datos" (el promedio es `None` sin pedidos) |
| `recent_orders` | los 5 pedidos más recientes: `folio`, `customer_name`, `time`, `delivery_label`, `total`, `status_label` | 0 filas: se dibuja el estado vacío; la tabla está en un `<template>` |
| `sales_by_day` | ventas de los últimos 14 días | no hay diseño de la gráfica todavía (ver abajo) |

## Qué no se dibuja y por qué

- Variación contra el periodo anterior, minigráficas y selector de periodo (Hoy, 7 días, 30 días) de Claude Design 1.1: la base no los puede dar sin pedidos. Si el backend los implementa, el rediseño entrega el bloque.
- Barras de "Ventas por día": solo hay estado vacío. Con pedidos, la altura de cada barra no se puede escribir con una clase fija; hay que decidir cómo pasarla sin estilos en línea (si el CSP de `panel/base.html` los bloquea) antes de diseñarla.
- Insignia de pedidos pendientes en la navegación, carritos abiertos y el horario "abierto hasta las 17:00": no hay dato.
- Chatbot: no existe en la tabla de rutas.

## Puntos abiertos para el backend

1. **Cliente del pedido**: el rol `django` solo lee `profiles.id` y `profiles.role`. Sin permiso sobre el nombre, `order.customer_name` no se puede llenar.
2. **Folio**: `orders.id` es un UUID. Hace falta un número consecutivo o una forma corta (por ejemplo, los primeros 6 caracteres) para `order.folio`.
3. **Umbral de stock bajo**: 15 es un valor de ejemplo que hace coincidir la lista con el diseño (5 productos). Lo decide el dueño y debe vivir en un solo lugar.
4. **`panel:inicio` hoy redirige a `inventory:list`**; esta página es la que debe servirse en `/panel/`.
5. **Enlace de salto** ("Saltar al contenido") no está: la tabla de rutas no admite anclas. `panel/base.html` puede agregarlo con `id="contenido"` en `<main>`.
6. Clientes aparece en las pestañas y también en Más, como pidió el encargo. Si se prefiere sin repetir, se quita la fila de `mas.html`.

## Cómo se ve

Con el servidor de desarrollo en `http://localhost:3002/dashboar.html`. Capturas de la unidad en `docs/design/rediseno/capturas-r4/f2-*.jpg`. Comprobación del build: `docker exec carni-landing-dev npm run build` y `docker exec carni-landing-dev npm run ts:check`.
