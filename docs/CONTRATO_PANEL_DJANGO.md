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

- La sincronización se hace solo con commits empujados.
- Antes de leer, actualiza la copia remota con `git -C ~/Desktop/Carni-mvp fetch origin`. Después lee con `git -C ~/Desktop/Carni-mvp show origin/practicas-ebac:<ruta>` (o `origin/pruebas:<ruta>`).
- La rama local del checkout principal puede ir atrasada; usa siempre `origin/...`.
- Nunca hay checkout ni stash en el árbol del otro.

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
- `mem_search` NO encuentra por `topic_key` (las barras y los guiones rompen la búsqueda). Busca con palabras del título, por ejemplo "contrato panel Django" o "Admin panel served by Django". Para una clave exacta: `sqlite3 -readonly ~/.engram/engram.db "SELECT id, project, title FROM observations WHERE topic_key LIKE 'panel-django/%';"`
- Regla para los dos: primero la memoria (Engram y graphify), después comprobar en el repo. Se reporta "recordaba X; verifiqué Y", nunca "no existe" sin haber buscado en los dos lugares.

## 5b. Seguridad del traspaso (revisión obligatoria antes de F4/B8)

- El `access_token` viaja solo en el cuerpo de un POST y por HTTPS (en local, `http://localhost`). Nunca en la URL ni en la consola. Un token en la URL se rechaza.
- La página de la tienda que hace el traspaso NO puede mandar `Referrer-Policy: no-referrer` (ni `same-origin`): con esas políticas el navegador manda `Origin: null` en un POST de formulario a otro origen (comprobado en Chrome el 2026-10-07), y Django rechazaría todo traspaso legítimo. Debe mandar `strict-origin`, que solo deja salir el origen y no la ruta.
- Django exige que la cabecera `Origin` sea una de `PANEL_ALLOWED_ORIGINS`. Sin cabecera, o con `null`, rechaza. Sus propias respuestas mandan `Referrer-Policy: no-referrer`.
- Django verifica la firma contra las llaves de Supabase (JWKS, `SUPABASE_JWKS_URL`) o contra el secreto (HS256 en local, `SUPABASE_JWT_SECRET`): usa una sola, según la configuración, y el token no elige cuál. Verifica además la vigencia (`exp`), `aud = authenticated`, el emisor (`<SUPABASE_URL>/auth/v1`), que el token no sea más viejo que `PANEL_TOKEN_MAX_AGE_SECONDS` desde su `iat`, y que `profiles.role` sea `admin`.
- Por eso la tienda entrega un token recién emitido: si el admin ya llevaba tiempo firmado, llama `supabase.auth.refreshSession()` antes de enviarlo.
- `/panel/sesion/` no lleva el token CSRF de Django (el formulario vive en otro origen y no puede leerlo). Lo compensan el origen permitido y el token. Responde 302 a `/panel/` si todo sale bien, 403 siempre igual si algo falla (el motivo queda en el log del servidor, nunca el token) y 405 si no es POST.
- Django no escribe el token en logs.
- El host de Django entra en `form-action` del CSP de Netlify.
- Agregar `VITE_PANEL_URL` exige sumarla a la lista permitida de la compuerta G6 de `gates.sh` en el mismo commit.

## 6. Configuración

| Lado | Variable | Para qué |
|---|---|---|
| Django (`backend/.env`, documentado en comentarios) | `SUPABASE_URL` | proyecto de Supabase; de aquí sale el emisor `<SUPABASE_URL>/auth/v1` |
| Django | `SUPABASE_JWKS_URL` | producción: dónde publica el proyecto sus llaves (`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`); si está, se usa en lugar del secreto |
| Django | `SUPABASE_JWT_SECRET` | local: secreto HS256 (`JWT_SECRET` de `supabase status -o env`); solo cuenta si no hay `SUPABASE_JWKS_URL`. Tiene que haber uno de los dos |
| Django | `STORE_ORIGIN` | origen de la tienda; a su `/accessweb.html` manda Django a quien no ha iniciado sesión |
| Django | `PANEL_ALLOWED_ORIGINS` | orígenes desde los que se acepta el traspaso, separados por comas |
| Django | `PANEL_TOKEN_MAX_AGE_SECONDS` | edad máxima del token en el traspaso, contada desde su `iat` (300 en local) |
| Tienda | `VITE_PANEL_URL` | sin ella, la tienda se comporta como hoy |

En local: Django en `localhost:8000`, la tienda en `localhost:3002` y Supabase en `127.0.0.1:54321` / `54322`.

## 7. Ramas

- Flujo: `practicas-ebac` (backend + material del curso) → solo commits de producto → `pruebas` (integración) → `main` (producción, sin material del curso ni `.env`).
- Cada entrega separa los commits de producto de los commits de curso.

## Changelog

- 2026-10-06: versión inicial (backend).
- 2026-10-06: corregida tras la revisión del agente de rediseño. Los documentos ya están en `origin/practicas-ebac` (antes vivían en una rama extra, eliminada). Se agregan:
  - cómo buscar en Engram;
  - la lectura desde `origin/...`;
  - la seguridad del traspaso;
  - G6 para `VITE_PANEL_URL`.
  - El diseño son 16 pantallas `.dc.html` (`docs/design/claude-design-1.1/`).
- 2026-10-07 (B8): corregido §5b y completado §6 al implementar el traspaso.
  - La página de la tienda que hace el traspaso no puede mandar `Referrer-Policy: no-referrer`: el navegador manda `Origin: null` y Django rechaza el traspaso. Tiene que mandar `strict-origin`. Cambia lo que decía la versión anterior; avisado al agente de rediseño antes de S4.
  - Se agrega `SUPABASE_JWKS_URL`. `SUPABASE_JWT_SECRET` pasa a ser solo para local.
  - Se documentan la edad máxima del token (la tienda debe entregar uno recién emitido), el 302/403/405 de `/panel/sesion/` y que esa ruta va sin token CSRF.
