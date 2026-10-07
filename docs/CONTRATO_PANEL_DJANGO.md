# Contrato del panel Django: backend ↔ rediseño

Lo leen los dos agentes antes de cada paso. Si algo contradice este archivo, este archivo manda. Cada cambio se registra con fecha en el *changelog* del final.

Decisión de fondo: `docs/DECISION_PANEL_DJANGO_2026-10-06.md`.

## 1. Tabla única de rutas y nombres

| Sección | Archivo de hoy | Plantilla Django (destino del `git mv`) | Ruta | Nombre |
|---|---|---|---|---|
| Tienda · landing | `index.html` | (sigue estática) | `/index.html` | — |
| Tienda · catálogo | `products.html` | (sigue estática) | `/products.html` | — |
| Tienda · acceso | `accessweb.html` | (sigue estática) | `/accessweb.html` | — |
| Perfil del cliente (NUEVO) | — | se decide antes de construirlo | propuesta `/cuenta/` | `cuenta:inicio` |
| Panel · marco | `dashboar.html` (marco) | `panel/base.html` | — | — |
| Panel · Inicio | `dashboar.html` (contenido) | `panel/inicio.html` | `/panel/` | `panel:inicio` |
| Productos · lista | `admin-products.html` | `inventory/product_list.html` | `/panel/productos/` | `inventory:list` |
| Productos · detalle | `kit/productos/detalle` | `inventory/product_detail.html` | `/panel/productos/<id>/` | `inventory:detail` |
| Productos · alta | `kit/productos/form` | `inventory/product_form.html` | `/panel/productos/nuevo/` | `inventory:create` |
| Productos · edición y confirmar precio | `kit/productos/form`, `confirm-precio` | `inventory/product_form.html`, `product_confirm_price_change.html` | `/panel/productos/<id>/editar/` | `inventory:update` |
| Productos · desactivar o borrar | `kit/productos/confirm-desactivar` | `inventory/product_confirm_delete.html` | `/panel/productos/<id>/eliminar/` | `inventory:delete` |
| Pedidos | `admin-orders.html` | `orders/order_board.html` | `/panel/pedidos/` | `orders:board` |
| Clientes | `admin-customers.html` | `customers/customer_list.html` | `/panel/clientes/` | `customers:list` |
| Ajustes | diseño 26/48 | `store_settings/index.html` | `/panel/ajustes/` | `settings:index` |
| BuildAds / ProductAds | isla en `dashboar.html` | `panel/publicidad.html` + isla | `/panel/publicidad/` | `panel:ads` |
| Más (móvil) | — | `panel/mas.html` | `/panel/mas/` | `panel:mas` |
| Puente de acceso | — | `panel/acceso.html` | `/panel/acceso/` | `panel:acceso` |
| Traspaso de sesión (POST) | — | — | `/panel/sesion/` | `panel:sesion` |
| Salir (POST) | — | — | `/panel/salir/` | `panel:salir` |

Las rutas de Productos ya existen en Django como `inventory:*`. Se montan bajo `/panel/productos/`, y `/inventario/` deja de existir como panel aparte. Ninguno de los dos agentes inventa rutas fuera de esta tabla.

## 2. Dueños de archivos (un escritor por ruta)

| Rutas | Dueño |
|---|---|
| `backend/**`, `docs/DECISION_PANEL_*`, `docs/CONTRATO_PANEL_DJANGO.md`, `docs/LOOP_BACKEND_PANEL.md`, `docs/PANEL_DJANGO_ESTADO.md`, entregas EBAC | backend |
| `src/**`, `*.html` de la raíz (hasta que el backend los mueva), `js/**`, `css/**`, configuración de Vite, `package*.json`, `DESIGN.md`, `netlify.toml`, `docs/design/**` | rediseño |
| `supabase/migrations/**` | las escribe el backend y se anuncian; aprueba Eduardo; ningún agente aplica nada en producción |

- Cuando el backend mueve un archivo del panel a `backend/templates/`, ese archivo pasa a ser del backend.
- Los cambios de diseño posteriores llegan como bloque de HTML del kit (`docs/design/rediseno/panel/kit/`), que el backend aplica.

## 3. Cómo se marca el HTML del panel para Django

El rediseño marca lo que Django va a llenar, para que el backend lo convierta sin adivinar:

```html
<!-- django:for product in page_obj -->
<tr>
  <td data-dj="product.name">Rib Eye</td>
  <td data-dj="product.category.name">Cortes Especiales</td>
  <td data-dj="product.price_per_kg">$549.00</td>
</tr>
<!-- django:endfor -->
```

Los datos de ejemplo son los reales: 53 productos y 9 categorías.

## 4. Puntos de sincronización

La sincronización se hace solo con commits empujados, que el otro lee con `git show <rama>:<ruta>`. Nunca hay checkout ni stash en el árbol del otro.

| Punto | Quién entrega a quién | Qué entrega | Qué desbloquea |
|---|---|---|---|
| S0 | backend ↔ rediseño | este contrato y la decisión; MAPA corregido | todo |
| S1 | rediseño → backend | `src/styles/tokens.css` (`@theme` exportable) | pipeline de Tailwind en Django |
| S2 | rediseño → backend | `dashboar.html` rediseñado (marco del panel) | `panel/base.html` |
| S3 | rediseño → backend | `admin-products.html` rediseñado y el kit de Productos | lista, detalle, formulario y confirmaciones |
| S4 | backend → rediseño | `/panel/sesion/` y `/panel/salir/` funcionando | `handoffToPanel()` en `accessweb.html` |
| S5 | rediseño → backend | islas React con `MANIFEST.json` | vista previa de la Tarjeta |
| S6 | Eduardo | paridad firmada | retiro de lo que quede sin uso |

## 5. Mensajes entre agentes (Engram, proyecto `carni-mvp`)

| Tema | Quién escribe | Para qué |
|---|---|---|
| `contrato/pedido/<pagina>` | backend | pide una página |
| `frontend/entrega/<pagina>` | rediseño | entrega, con el sha empujado |
| `revision/frontend-a-backend/*` y `revision/backend-a-frontend/*` | cada lado | lo que el otro rompió o le falta |
| `panel-django/decision` y `panel-django/contrato` | — | decisiones y cambios a este contrato |

- El orquestador lee los dos lados y deja su retroalimentación en `revision/*`.
- Engram está partido en `carni-mvp` y `Landingpages-Carni.pwa`: busca en los dos hasta que Eduardo lo unifique.

## 6. Configuración

| Lado | Variable | Para qué |
|---|---|---|
| Django (`backend/.env`, documentado en comentarios) | `SUPABASE_URL` | proyecto de Supabase |
| Django | `SUPABASE_JWT_SECRET` | solo si el proyecto firma los tokens con HS256 |
| Django | `STORE_ORIGIN` | origen de la tienda |
| Django | `PANEL_ALLOWED_ORIGINS` | orígenes desde los que se acepta el traspaso |
| Django | `PANEL_TOKEN_MAX_AGE_SECONDS` | vida máxima del token en el traspaso |
| Tienda | `VITE_PANEL_URL` | sin ella, la tienda se comporta como hoy |

En local: Django en `localhost:8000`, la tienda en `localhost:3002` y Supabase en `127.0.0.1:54321` / `54322`.

## 7. Ramas

- Flujo: `practicas-ebac` (backend + material del curso) → solo commits de producto → `pruebas` (integración) → `main` (producción, sin material del curso ni `.env`).
- Cada entrega separa los commits de producto de los commits de curso.

## Changelog

- 2026-10-06: versión inicial (backend).
