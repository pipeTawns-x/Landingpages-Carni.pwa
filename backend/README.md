# Carni-mvp backend

Django backend for Carni-mvp: server-side panel and future API. It shares the
same Postgres instance as Supabase (Django-owned tables live in the `django`
schema; existing tables in `public` remain owned by `supabase/migrations`).

## Requirements

- [uv](https://docs.astral.sh/uv/) 0.8+
- Python 3.12 (managed by uv via `.python-version`)
- Local Supabase running (`supabase start` from the repo root)

## Setup

```bash
cd backend
uv sync
```

## Environment variables

`backend/.env` is private and not versioned. Create it yourself; each variable is
documented with a comment inside the file. Generate `DJANGO_SECRET_KEY` per
environment with:

```bash
uv run python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"
```

`POSTGRES_*` values match your local Supabase instance; get them with
`supabase status` (default local port `54322`).

| Variable | Description |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django secret key. Required, no default. |
| `DJANGO_DEBUG` | `True`/`False`. |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hosts. |
| `POSTGRES_DB` | Database name. |
| `POSTGRES_USER` | Database user. |
| `POSTGRES_PASSWORD` | Database password. |
| `POSTGRES_HOST` | Database host. |
| `POSTGRES_PORT` | Database port. |
| `SUPABASE_URL` | URL of the Supabase project (`http://127.0.0.1:54321` locally). `<SUPABASE_URL>/auth/v1` is the issuer a panel token must carry. Required. |
| `SUPABASE_JWKS_URL` | Where the project publishes its signing keys, `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`, locally and in production. When it is set, tokens are checked against those keys and `SUPABASE_JWT_SECRET` is ignored. The local Supabase CLI (v2.84) signs user tokens with ES256 and publishes the key there, so local needs it too. |
| `SUPABASE_JWT_SECRET` | Shared HS256 secret, for a Supabase project that still signs with it; `supabase status -o env` prints it as `JWT_SECRET`. Used only when `SUPABASE_JWKS_URL` is empty: a real local token is refused with `algorithm` in that mode. One of the two is required. |
| `STORE_ORIGIN` | Origin of the store (`http://localhost:3002` locally). The panel sends people there to sign in and after signing out. Required. |
| `PANEL_ALLOWED_ORIGINS` | Comma-separated origins that may post a token to `/panel/sesion/` (`http://localhost:3002` locally). Required. |
| `PANEL_TOKEN_MAX_AGE_SECONDS` | The oldest a token may be, counted from when Supabase issued it, when it is handed over (`300` is five minutes). Required. |
| `DJANGO_COOKIE_SECURE` | `True`/`False`. Marks the session and CSRF cookies `Secure`. Optional: on whenever `DJANGO_DEBUG` is off. |
| `DJANGO_COOKIE_HTTPONLY` | `True`/`False`. Hides the session cookie from JavaScript. Optional: `True`. |
| `DJANGO_COOKIE_SAMESITE` | `Lax` or `None` (which needs `Secure`). Optional: `Lax`. `Strict` is refused because it would break the panel handoff. |
| `DJANGO_BEHIND_PROXY` | `True`/`False`. Trust the `X-Forwarded-Proto` header that a proxy sets (`SECURE_PROXY_SSL_HEADER`). Optional: off. Turn it on only behind a proxy that ends TLS, such as Render: see "Despliegue del entorno de revisión (demo)". |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Comma-separated origins, besides the host itself, that may post a form (`CSRF_TRUSTED_ORIGINS`). Optional: none. |
| `REVIEW_INVITES_ENABLED` | `True`/`False`. Turns on the review invite links (`/panel/invitado/<token>/`), which open the panel without signing in at the store. Optional: off, and every request to the route answers 404, whatever its method. Only for a deployment with fake data: see "Enlaces de invitado para revisión". |

Django refuses to start when a required variable is missing or has a value it
cannot use, naming it. The test settings supply their own values for the
`SUPABASE_*`, `STORE_ORIGIN`, `PANEL_*` and `DJANGO_COOKIE_*` variables and leave
`REVIEW_INVITES_ENABLED`, `DJANGO_BEHIND_PROXY` and `DJANGO_CSRF_TRUSTED_ORIGINS` unset,
so the tests never depend on what `backend/.env` holds.

## Common commands

```bash
uv run python manage.py check
uv run python manage.py runserver
uv run python manage.py test
uv run ruff check .
uv run ruff format .
scripts/build_panel_css.sh --check   # the panel stylesheet is up to date (needs Docker)
```

`manage.py test` runs on an in-memory SQLite database (see "Tests" below). The
panel stylesheet is built by a script, not by `manage.py`: see "Panel stylesheet".

## Inventory panel

The `inventory` app is the products section of the panel. Its five views are
wrapped in `panel_admin_required`, so only an admin whose session the Supabase
handoff opened gets in (see "Panel session handoff"). There is no Django login
for them: an admin signs in at the store and the store hands the session over,
and `/admin/login/` opens the Django admin site only.

| Route | Name | View |
| --- | --- | --- |
| `/panel/productos/` | `inventory:list` | `product_list` |
| `/panel/productos/<id>/` | `inventory:detail` | `product_detail` |
| `/panel/productos/nuevo/` | `inventory:create` | `product_create` |
| `/panel/productos/<id>/editar/` | `inventory:update` | `product_update` |
| `/panel/productos/<id>/eliminar/` | `inventory:delete` | `product_delete` |

The routes are mounted from `config/urls.py` and not from `panel/urls.py`: an
include inside the `panel` namespace would rename them `panel:inventory:*`, and
the contract (`docs/CONTRATO_PANEL_DJANGO.md`) names them `inventory:*`. They
used to live at `/inventario/`; that address no longer exists and does not
redirect, because the old page is now this one.

`Category` and `Product` mirror the Supabase-owned tables with
`managed = False`, and so do `OrderItem` and `Favorite`, which are read-only
(`save()`, `delete()` and every queryset write raise `ReadOnlyModelError`)
because the panel only counts the rows that point at a product. `CutSpec` is the
only Django-managed table and stores the data the storefront still lacks:
average weight per piece, thickness range, supplier and presentation.

Behaviour worth knowing before touching it:

- The rules below (price confirmation, delete or deactivate, when a cut spec is
  stored) live in `inventory/services.py`. The views only turn what a service
  returns into pages and messages.
- `price_per_lb` is always derived from `price_per_kg`, so it is not editable.
- Changing a price or a minimum quantity shows a before/after confirmation
  before saving.
- Deleting a product that appears in orders deactivates it instead, because
  `order_items.product_id` is `ON DELETE RESTRICT`. An order that arrives
  between the count and the delete is handled the same way: the delete runs in
  a savepoint, and when the database refuses it the product is deactivated
  instead of failing with a server error. When a delete does go through, the
  panel reports how many favorite lists lost the product (`favorites.product_id`
  cascades).
- The Django admin (`inventory/admin.py`) applies the same rules through the
  services. `price_per_lb` is shown read-only. A product whose price or minimum
  quantity changes is not saved until the "Confirmar cambio de precio o
  cantidad mínima" box is ticked (a new product needs none). Deleting products,
  one by one or with the bulk action, deactivates those that have orders and
  shows a warning that names them. Django still adds its own "deleted
  successfully" message and logs a deletion for them, because both come from
  the admin itself and not from `delete_model` or `delete_queryset`.
- The list (`templates/inventory/product_list.html`) is the redesign's
  `admin-products.html`, moved here with `git mv`. It is paginated, 20 per page
  (`PRODUCTS_PER_PAGE` in `inventory/views.py`, using `Paginator.get_page`), with
  a previous and a next control that stay in place, switched off, where there is
  no page to go to. `{% querystring %}` keeps `q` and `category` in the links
  (and drops `page` when the filter changes). A page that is zero, negative or
  past the end falls back to the last page, and a non-numeric one to the first.
- The category chips are links to `?category=<id>` and count every product of
  the category, whatever the search says (`product_count`, an annotation of
  `categories`); "Todas" counts them all (`total_products`). The chip of the
  category being filtered carries `aria-current="true"`, and "Todas" does when
  there is none: that is the `django:active` mark of the chips.
- `Product.unit_label` says what a price is for: "paquete" for a name that
  starts with "Paquete " unless it says "por kilo" (the rule of `unidadDe` in the
  store), "pieza" for the Merch and Otros categories and "kg" for the rest. It is
  PROVISIONAL, pending Eduardo, and `unit_label_for()` in `inventory/models.py`
  is the only place to change it; a `unit` column on `products` (backlog) would
  replace it. Prices over a thousand are grouped (`$1,599.00`).
- The detail (`templates/inventory/product_detail.html`) is the redesign's
  `kit/productos/detalle.html` (`pruebas` `ab47cbb8`). The price shows with its
  unit and the price per pound only when the price is by the kilo. Eliminar and
  desactivar are one route (`inventory:delete`): that page says which of the two
  will happen, and the button of the detail names both.
- The form (`templates/inventory/product_form.html`, create and edit) is the
  redesign's `kit/productos/form.html` (`pruebas` `2d7cf5d3`), with fieldsets in
  place of tabs. Django draws every control, and `inventory/forms.py` gives each
  widget the Tailwind classes of its control (the wrappers around them, the "$"
  and the unit, are in the template). `name` and `image_url` are text inputs:
  they are `TextField`s, which Django would draw as a `<textarea>`, and
  `image_url` cannot be a `URLInput` because it holds a relative path.
  `price_per_lb` is shown as text. The error of each field is drawn by
  `inventory/_field_error.html` and the alert at the top also says the errors that
  belong to no field.
- "Confirmar cambio de precio o cantidad mínima" is not a field of the form: it is
  a checkbox (`confirm=1`) that only exists when editing. It is a shortcut,
  because without it a change of the price or of the minimum quantity stops at the
  confirmation page.
- `Product.image_src` is the picture as an address the panel can load.
  `image_url` is a path of the store (`/img/products/tomahawk.webp`), which Django
  does not serve, so `store_image_url()` joins it to `STORE_ORIGIN`. An absolute
  http(s) address is kept and anything else (`javascript:`, `data:`) is no
  picture at all.
- `price_per_lb_for()` in `inventory/models.py` holds the price-per-lb formula
  that `Product.save()` uses. Code that creates products with `bulk_create()`
  skips `save()`, so it has to call the function itself.

### EBAC practice M13 — where each requirement lives

| Requirement | File |
| --- | --- |
| New attributes on the product model | `inventory/models.py` (`CutSpec`: weight per piece, thickness min/max/default, supplier, presentation, notes) |
| Migrations created and applied | `inventory/migrations/0001_initial.py` (only `CutSpec`; the mirrored tables emit no DDL) and `0002_favorite_orderitem.py` (state only: the two read-only mirrors, no DDL) |
| Admin registration | `inventory/admin.py` (product with the spec as an inline, plus the panel's rules through `inventory/services.py`) |
| list-view | `inventory/views.py::product_list` + `templates/inventory/product_list.html` |
| detail-view | `inventory/views.py::product_detail` + `templates/inventory/product_detail.html` |
| create-view | `inventory/views.py::product_create` + `templates/inventory/product_form.html` |
| update-view | `inventory/views.py::product_update` + `product_form.html`, `product_confirm_price_change.html` |
| delete-view | `inventory/views.py::product_delete` + `templates/inventory/product_confirm_delete.html` |
| URLs | `inventory/urls.py` (namespace `inventory`), mounted in `config/urls.py` at `/panel/productos/` |
| Forms | `inventory/forms.py` (`ProductForm`, `CutSpecForm`) |
| Search and protection | `Q` filter in `product_list`; `panel_admin_required` on the five views (it replaced `login_required` and `LOGIN_URL` when the views moved under `/panel/productos/`) |

### EBAC practice M14 — Django Models & Admin

The assigned practice (500 bulk-created products, fixture, admin) lives in the
course-only app `ecommerce/`: see [`ecommerce/README.md`](ecommerce/README.md).
Its adaptation to the store is the paginated product list and the test suite
described in "Tests".

### EBAC practice M15 — Django Class-based Views

`ProtectedListView`, a `ListView` behind `LoginRequiredMixin`, lists the sample
products of the signed-in user at `/my-products/`. It lives in the same course-only
app, `ecommerce/`: see the "Práctica M15" section of
[`ecommerce/README.md`](ecommerce/README.md). An anonymous visitor goes to
`LOGIN_URL`, which is the panel's access bridge (`panel:acceso`), so Django never asks
for a password. The bridge ignores the `?next=` that Django adds, and the view
requires a login but not the admin role.

## Panel session handoff

The panel is served by Django, but nobody signs in to Django: an admin signs in
to Supabase at the store and the store hands the session over (see
`docs/CONTRATO_PANEL_DJANGO.md`, section 5b). The `panel` app owns that.

| Route | Name | What it does |
| --- | --- | --- |
| `POST /panel/sesion/` | `panel:sesion` | Takes the Supabase access token from the body, checks it and opens a Django session. |
| `GET /panel/acceso/` | `panel:acceso` | Where anonymous visitors land: sends them to the store login. |
| `POST /panel/salir/` | `panel:salir` | Ends the session and sends the person to the store login. Works for any session, behind Django's CSRF check. |
| `GET /panel/` | `panel:inicio` | Landing page, admins only. Until the dashboard exists it forwards to the products. |
| `GET /panel/mas/` | `panel:mas` | The "Más" page of the phone layout: Clientes, Publicidad, Ajustes and the sign-out. Admins only. |
| `GET`, `POST /panel/invitado/<token>/` | `panel:invitado` | A review invite link: the GET shows a button and the POST opens the session. A 404 for every method, and for the link without its closing slash, unless `REVIEW_INVITES_ENABLED` is on. See "Enlaces de invitado para revisión". |

`/panel/sesion/` checks the following, in this order. Whatever fails, the
browser gets the same plain 403 and the reason (never the token) goes to the
server log under the `panel` logger.

1. The `Origin` header is one of `PANEL_ALLOWED_ORIGINS`. A missing or `null`
   origin is refused.
2. The token comes in the body of the POST. One in the URL is refused.
3. The signature, checked with the keys the project publishes
   (`SUPABASE_JWKS_URL`) or with the shared secret (`SUPABASE_JWT_SECRET`):
   never both, and never the one the token asks for, so a token signed with the
   other kind of key is refused. Then the expiry, `aud = authenticated`, the
   issuer, and an age under `PANEL_TOKEN_MAX_AGE_SECONDS`.
4. `public.profiles.role = 'admin'` for the user the token names.
5. The Django user for that Supabase user is active.

Then Django logs that user in and redirects to `/panel/`.

Behaviour worth knowing before touching it:

- The Django user is created on the first handoff. Its username is the Supabase
  user id, its password is unusable (Django never stores or checks one) and it
  is neither staff nor superuser, so it does not reach `/admin/`. Panel access
  can be revoked from Django by deactivating that user.
- `panel/access.py` marks the session the handoff opens, and
  `panel_admin_required` only lets a session with that mark in. A Django user
  made some other way (`createsuperuser`, the admin site) is not a panel admin.
  The decorator also reads `profiles.role` on every request, so demoting an
  admin in Supabase ends their panel access on the next click, and it closes
  that session instead of leaving it open. A test fails when a route mounted
  under `/panel/` is neither guarded nor listed as public; it walks the root
  URLconf, so it covers the products (`/panel/productos/`) as well as the routes
  of the `panel` app.
- `panel:salir` is the one panel route that is not behind the decorator, so that
  an admin whose role was just revoked can still sign out. It ends the Django
  session only: the Supabase one lives in the store's browser storage, so the
  store has to sign out of Supabase as well.
- The view is `csrf_exempt` because the form that posts to it lives on the
  store, another origin, which cannot read Django's CSRF token. The origin
  allow-list and the token itself stand in for it.
- With `Referrer-Policy: no-referrer` (or `same-origin` for a cross-origin POST)
  browsers send `Origin: null` on form POSTs. So the store page that posts the
  token has to keep a policy that leaves the origin in (`strict-origin`, or the
  `strict-origin-when-cross-origin` that `netlify.toml` sends today), or every
  handoff is refused. The same applies to Django itself: its answers send
  `Referrer-Policy: same-origin`, not `no-referrer`, because `Origin: null` on
  the panel's own POSTs fails Django's CSRF check (a null origin is refused) and
  the logout, the product forms and the admin would stop working.
- The session cookie is `HttpOnly` and `SameSite=Lax`, lasts eight hours without
  sliding, and is `Secure` whenever `DJANGO_DEBUG` is off. There is no
  Content-Security-Policy yet: it arrives with `panel/base.html`, whose scripts
  and styles decide what it has to allow.
- `Profile` (`panel/models.py`) is a read-only mirror of `public.profiles`
  with only `id` and `role`, the columns the `django` Postgres role may read
  (`supabase/migrations/20261007042348_grant_django_profiles_select.sql`, which
  also hides every non-admin row from that role). Apply the migration with
  `supabase migration up`; never with `db reset`, which wipes the local data.
- Local values for `backend/.env`: `SUPABASE_URL=http://127.0.0.1:54321`,
  `SUPABASE_JWKS_URL=http://127.0.0.1:54321/auth/v1/.well-known/jwks.json`,
  `STORE_ORIGIN=http://localhost:3002`,
  `PANEL_ALLOWED_ORIGINS=http://localhost:3002` and
  `PANEL_TOKEN_MAX_AGE_SECONDS=300`.

## Enlaces de invitado para revisión

Un profesor de EBAC tiene que poder revisar el panel desplegado, y el panel solo se abre
con el traspaso: alguien inicia sesión como administrador en la tienda. Darle a un
revisor esa contraseña es dar la llave de todo. Un enlace de invitado resuelve otra cosa:
abre **la misma sesión de panel que abre el traspaso**, para un usuario de Supabase
concreto, sin contraseña y sin tocar datos reales, porque se usa en un entorno de
demostración aparte (un proyecto de Supabase con datos falsos).

Está **apagado** salvo que `REVIEW_INVITES_ENABLED` lo encienda. Apagado, la ruta
`/panel/invitado/<token>/` responde 404 como si no existiera, y eso vale para **todo**:
cualquier método (`GET`, `POST`, `PUT`, `OPTIONS`...) y también el enlace sin la barra final,
que Django, por su cuenta, redirigiría con un 301 a la versión con barra. Un 405 o un 301
dirían que la ruta existe, así que la bandera se comprueba antes que el método y la ruta sin
barra tiene vista propia (`invitado_sin_barra`). Se enciende solo en el entorno de
demostración: una invitación da permisos de administrador del panel, y en un entorno con
datos reales eso sería abrir una puerta que nadie pidió.

### El riesgo: un enlace es una llave al portador

Quien tiene el enlace entra, y no hay una segunda comprobación. Todo el diseño sale de
aceptar eso y de reducir lo que se puede perder con un enlace filtrado.

El enlace **no está firmado**. No lleva ninguna firma que verificar ni datos dentro: el token
es un nombre largo y aleatorio, opaco, y el servidor solo lo busca en la base por su SHA-256.
Por eso no hay clave que proteger ni que rotar, y por eso la única autoridad es la fila de la
base: allí es donde el enlace vence, se revoca y se agota.

| Decisión | Por qué |
| --- | --- |
| El token son 32 bytes aleatorios (`secrets.token_urlsafe(32)`, 256 bits) | No se puede adivinar ni probar uno por uno. |
| La base guarda solo su SHA-256 (`token_hash`, único) | Quien lea la tabla (una copia de seguridad, un volcado de SQL, el admin) no puede reconstruir un enlace que funcione. Un hash simple basta porque el token ya es aleatorio: un hash lento sirve contra contraseñas que una persona eligió, y aquí no hay nada que adivinar. |
| El token se muestra una sola vez | El comando lo imprime al emitirlo y no hay forma de recuperarlo. Si se pierde, se emite otro. |
| Vence (`expires_at`, de 1 a 90 días) | Un enlace que se filtra deja de servir por sí solo. |
| Se revoca (`revoked_at`) | Un enlace filtrado se mata sin esperar a que venza: acción «Revocar» del admin. |
| Puede tener un límite de usos (`max_uses`) | Un enlace de un solo uso no sirve a quien lo encuentre después. |
| La sesión dura lo de siempre (8 horas) y el panel lee el rol del usuario en cada petición | Quitarle el rol de administrador en Supabase corta el acceso aunque el enlace siga vivo. |
| La sesión recuerda qué invitación la abrió (`panel_invite_id`) y `is_panel_admin` comprueba en cada petición que esa invitación siga viva (no revocada, no vencida) | Revocar o vencer un enlace cierra también las sesiones que ya había abierto, en su siguiente clic, y no solo impide usos nuevos. Sin esto, un enlace filtrado y revocado dejaba dentro a quien ya había entrado hasta 8 horas. Agotar los usos no cierra nada: el último uso es el que abrió esa sesión. Una sesión del traspaso de Supabase no lleva esa marca y se comporta como siempre. |

### Por qué la página usa POST

Un GET tiene que ser seguro, es decir, no cambiar nada: los chats, los clientes de correo
y los antivirus abren los enlaces por su cuenta para hacer una vista previa. Si el GET
abriera la sesión, un bot la gastaría antes que la persona, y con `--max-uses 1` el
profesor se encontraría un enlace usado. Por eso `GET /panel/invitado/<token>/` solo
muestra una página con un botón («Entrar al panel»), sin abrir sesión ni contar nada, y
es el `POST` que manda el botón, con el token CSRF de Django, el que entra.

Ese POST, en este orden y dentro de una transacción con la fila de la invitación
bloqueada (`select_for_update`, para que dos clics a la vez no se lleven el mismo último
uso):

1. Vuelve a validar el enlace: que exista, que no haya vencido, que no esté revocado y
   que le queden usos.
2. Comprueba que el usuario sea administrador **ahora mismo** en Supabase
   (`profiles.role = 'admin'`, la misma consulta del traspaso). Si lo degradaron después de
   emitir la invitación, se rechaza aquí: sin gastar el uso, sin crear el usuario de Django y
   sin abrir sesión.
3. Obtiene o crea el usuario de Django con la misma regla del traspaso
   (`get_or_create_panel_user_by_id`: el `username` es el id de Supabase, la contraseña
   es inutilizable y no es staff). Si ese usuario está desactivado en Django, se rechaza.
4. Cuenta el uso (`use_count`, `last_used_at`).
5. Vacía la sesión que traía el navegador (`session.flush()`) y abre la del panel
   (`open_panel_session`), que además guarda el id de la invitación en la sesión. Así la
   clave de sesión siempre es nueva, también cuando el navegador ya traía una sesión de ese
   mismo usuario, que `login()` por sí solo conservaría: quien haya plantado esa clave no la
   conserva (fijación de sesión).
6. Redirige a `landing_path`, que se vuelve a validar (debe ser una ruta de este sitio:
   empezar con una sola `/` y no llevar `\`, espacios ni caracteres de control, de modo
   que `//evil.example` y `https://evil.example` no se aceptan nunca).

Si algo falla al abrir la sesión, la transacción se deshace y no se gasta el uso.

### Una sola respuesta para todo lo que no sirve

Un token desconocido, vencido, revocado, agotado, de un usuario desactivado o de uno que ya
no es administrador reciben la misma página («Enlace no válido o vencido»), con el mismo
estado (404), el mismo cuerpo y las mismas cabeceras, tanto en el GET como en el POST. Con una
salvedad: el GET solo comprueba el enlace en sí (que exista, no haya vencido, no esté revocado
y le queden usos), así que lo de «ya no es administrador» se rechaza al pulsar el botón, que es
cuando algo se gasta. La razón concreta se escribe en el log del logger `panel` (nunca el
token) y el navegador no la ve, así que la respuesta no sirve para averiguar si un token
existió alguna vez.

### Cabeceras

La página lleva `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow` (más el
`<meta name="robots">`) y `Referrer-Policy: strict-origin`. No es `no-referrer`, aunque
sea lo que se esperaría para una página con un secreto en la dirección: con `no-referrer`
el navegador manda `Origin: null` en el POST del formulario, la comprobación CSRF de
Django rechaza un origen nulo (ver "Panel session handoff") y el botón nunca
funcionaría. Una prueba fija las dos cosas. `strict-origin` cumple el mismo propósito:
manda solo el origen y nunca la ruta, así que el token no viaja en `Referer` a la página
que sigue ni a nada que esta cargue.

### Cómo se usa

Desde `backend/`, en el entorno donde corre el panel y con `REVIEW_INVITES_ENABLED=true`:

```bash
uv run python manage.py issue_review_invite \
  --supabase-user <uuid> --label "Profesora M15" --days 7 \
  --max-uses 5 --landing /my-products/ --base-url https://carni-demo.onrender.com
```

| Opción | Qué hace |
| --- | --- |
| `--supabase-user` | UUID del usuario de Supabase con el que entra la persona. Debe ser administrador en esa base (`profiles.role = 'admin'`): si no, el comando se niega, porque el panel cerraría la sesión en el acto. |
| `--label` | Para quién es el enlace. Se ve en el admin y en la página de confirmación. |
| `--days` | Vigencia, de 1 a 90 días. |
| `--max-uses` | Opcional. Cuántas veces se puede usar; sin ella, sin límite. |
| `--landing` | Opcional. A dónde va la persona al entrar (`/panel/` por defecto). Una ruta de este sitio. |
| `--base-url` | Origen público del panel. Debe ser `https`; `http` solo para `localhost`, porque el enlace es una llave y no debe viajar sin cifrar. |

El comando imprime el enlace completo **una vez** (y avisa si `REVIEW_INVITES_ENABLED`
está apagado, porque entonces el enlace respondería 404). Para revocarlo: `/admin/` →
«Invitaciones de revisión» → seleccionar → «Revocar las invitaciones seleccionadas». Revocar
(igual que dejar que venza) cierra también las sesiones que ese enlace ya había abierto, en su
siguiente clic. El admin lista la etiqueta, el usuario, el vencimiento, si está revocada, los usos y el
último uso; nunca muestra el token ni su huella, y no permite crear invitaciones desde
ahí, porque un formulario no puede mostrar el enlace una sola vez.

### Lo que este diseño no resuelve

- El token va en la dirección. Queda en el historial del navegador de quien lo abre y, si
  el servidor o un proxy guardan las rutas de cada petición, en esos registros. Por eso
  `gunicorn` no se arranca con registro de accesos en la demostración. Lo que limita el
  daño es el vencimiento, la revocación y el límite de usos.
- Quien reenvía el enlace da acceso: es una llave al portador.
- No hay límite de intentos por IP. Con 256 bits de token no hace falta.
- `/my-products/` (práctica M15) solo pide haber iniciado sesión, y la sesión de una
  invitación lo cumple, sea o no administrador el usuario. Como esa vista no pasa por
  `panel_admin_required`, una sesión cuya invitación ya se revocó o venció sigue entrando ahí
  hasta que toque una página del panel, que es la petición que la cierra.

## Despliegue del entorno de revisión (demo)

El demo es este backend desplegado en un servicio web **gratuito de Render** (`render.yaml`
en la raíz del repo, rama `practicas-ebac`) y conectado a un **proyecto de Supabase aparte,
con datos falsos**. Existe para que quienes revisan las prácticas de EBAC abran el panel
con un enlace de invitado (ver "Enlaces de invitado para revisión") sin tocar datos reales.
Por eso nunca debe compartir proyecto de Supabase con la tienda de verdad: una invitación
abre el panel como administrador, con permiso para escribir.

### Antes del primer despliegue (fuera del repo)

1. Crea el proyecto de Supabase del demo y aplica `supabase/migrations` (crean el esquema
   `django`, el rol `django` y sus permisos): con la CLI, `supabase link` y
   `supabase db push`. Nunca `db reset`.
2. Ponle contraseña al rol `django` en el editor SQL del proyecto:
   `ALTER ROLE django WITH LOGIN PASSWORD '<contraseña nueva>';`. Es la que irá en
   `POSTGRES_PASSWORD`. (`scripts/set_django_role_password.sh` es para la base local: lee
   `backend/.env`.)
3. Crea en Supabase Auth un usuario de prueba y deja su perfil con `role = 'admin'`: es el
   que recibirá `--supabase-user` al emitir invitaciones.
4. Carga los datos falsos que el demo necesite.

### Variables de entorno

`render.yaml` declara cada variable por su nombre. Las que no son secretas ni dependen del
entorno llevan su valor en el archivo; todas las demás llevan `sync: false`, así que **los
valores los escribe el dueño en el Dashboard de Render** y ni el repo ni este README llevan
ninguno. `REVIEW_INVITES_ENABLED` es la excepción que lo explica: no es un secreto ni depende
del entorno, pero lleva `sync: false` a propósito, para que encender los enlaces sea un acto
del dueño y no algo que el archivo decide por él. Render pide esos valores solo al crear el Blueprint y después ignora el archivo para
ellas: se cambian en la pestaña Environment del servicio.

| Variable | Valor |
| --- | --- |
| `PYTHON_VERSION` | `3.12.11`, el de `backend/.python-version`. Render exige la versión completa y la variable manda sobre `.python-version`; su documentación habla de ese archivo en la raíz del repo y no dice si lo lee dentro de `rootDir`, así que no se depende de él. |
| `UV_PYTHON_PREFERENCE` | `only-system`: `uv` usa el Python que Render instala y, si no lo encuentra, el build falla en voz alta en lugar de descargar por su cuenta otro intérprete que quizá no llegue intacto al arranque. |
| `DJANGO_BEHIND_PROXY` | `true`: ver "Detrás del proxy de Render". |
| `PGSSLMODE` | `require`: la conexión a Postgres tiene que ir cifrada con TLS, o no se establece. Ver "La base de datos". |
| `PANEL_TOKEN_MAX_AGE_SECONDS` | `300`, como en local. |
| `REVIEW_INVITES_ENABLED` | `true`, que escribes tú en el Dashboard cuando quieras enlaces de invitado. Apagado (o sin escribir), la ruta responde 404 a todo. Si lo apagas en una emergencia, la próxima sincronización del Blueprint no lo vuelve a encender, porque el archivo no lleva valor. |
| `DJANGO_SECRET_KEY` | Una clave nueva para este entorno, con el comando de "Environment variables". |
| `DJANGO_ALLOWED_HOSTS` | El hostname `*.onrender.com` del servicio, que Render muestra al crearlo. Hasta ponerlo, Django responde 400 a todo. |
| `POSTGRES_DB` | `postgres`. |
| `POSTGRES_USER` | `django.<project_ref>`: el rol `django` más la referencia del proyecto (ver abajo). |
| `POSTGRES_PASSWORD` | La contraseña que le pusiste al rol `django`. |
| `POSTGRES_HOST` | El host del pooler en modo sesión: panel **Connect** del proyecto, `aws-…-<región>.pooler.supabase.com`. |
| `POSTGRES_PORT` | `5432`. |
| `SUPABASE_URL` | La URL del proyecto, `https://<project_ref>.supabase.co`. |
| `SUPABASE_JWKS_URL` | `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`. |
| `STORE_ORIGIN` | El origen de la tienda del demo, donde un administrador inicia sesión. |
| `PANEL_ALLOWED_ORIGINS` | Ese mismo origen. |

No están en `render.yaml`, y casi nunca hacen falta: `DJANGO_CSRF_TRUSTED_ORIGINS` (otro
dominio que publique formularios, o el origen https del servicio si el proxy no manda
`X-Forwarded-Proto`), `SUPABASE_JWT_SECRET` (solo si el proyecto todavía firma
con HS256 en lugar de publicar sus llaves) y `DJANGO_DEBUG`, que no se enciende nunca fuera
de local. Una prueba (`config/test_deploy.py`) falla si una variable que los settings exigen
falta en `render.yaml`, si una variable distinta de las cinco primeras de la tabla lleva su
valor escrito en el archivo (`REVIEW_INVITES_ENABLED` incluida) o si `PYTHON_VERSION` no
coincide con `.python-version`.

### La base de datos: el pooler de Supabase, no la conexión directa

Esto se comprobó contra la documentación vigente de Supabase:

- La conexión directa (`db.<project_ref>.supabase.co:5432`) usa **IPv6** por defecto; solo
  tiene IPv4 con el complemento de pago.
- La propia documentación de Supabase lista a **Render** entre las plataformas que solo
  aceptan IPv4. Un servicio de Render no puede usar la conexión directa.
- El pooler compartido (Supavisor) es IPv4 y tiene dos modos: **sesión** en el puerto `5432`
  y transacción en el `6543`. La documentación recomienda el de sesión para clientes
  persistentes en redes solo IPv4, que es el caso de Django. El usuario lleva la referencia
  del proyecto: `postgres.<project_ref>` para el rol `postgres`, y `<rol>.<project_ref>` para
  otro, así que aquí es `django.<project_ref>`.

La conexión va por **TLS**: `render.yaml` define `PGSSLMODE=require`. `libpq` (el cliente de
Postgres que usa `psycopg`) lee esa variable cuando la conexión no trae un `sslmode` propio, y
`config/settings.py` no pone ninguno (una prueba lo vigila: el suyo ganaría sobre la variable).
Se comprobó que `psycopg` la toma como valor por defecto de `sslmode`. Sin ella el valor por
defecto es `prefer`: prueba con TLS, pero acepta seguir sin cifrar si no se logra, y entonces la
contraseña del rol `django` y los datos viajarían en claro entre Render y el pooler. `require`
cifra el canal, pero no comprueba quién está al otro lado: eso lo haría `verify-full` con el
certificado raíz de Supabase, y queda fuera de este demo.

Lo que **no** se pudo comprobar: `config/settings.py` manda a Postgres la opción de arranque
`options=-c search_path=django,public`, y la documentación de Supavisor solo describe
`options=reference=<tenant>`; no encontré que diga que reenvía `-c search_path`. (El
repositorio de Supavisor tiene trabajo reciente sobre validar sus opciones de arranque, el PR
#1201, y ahí una opción inválida se avisa con un NOTICE y no se rechaza.) Compruébalo con el
pooler real, desde tu máquina:

```bash
psql "postgresql://django.<project_ref>:<contraseña>@<host del pooler>:5432/postgres" \
  -c "SHOW search_path;"
```

Si no dice `django, public`, deja el orden fijo en el propio rol, desde el editor SQL del
proyecto:

```sql
ALTER ROLE django SET search_path = django, public;
```

PostgreSQL aplica esa configuración al inicio de cada sesión nueva del rol (documentación de
`ALTER ROLE`), y no depende de que el pooler reenvíe nada. Como el rol y el esquema se llaman
igual, el `search_path` por defecto (`"$user", public`) debería resolver ya a
`django, public`; el comando de arriba lo confirma.

### Qué hace el Blueprint y el build

`render.yaml` define un servicio `web` con `runtime: python`, `plan: free`, `rootDir: backend`
y `branch: practicas-ebac`, y con `autoDeployTrigger: commit`: cada commit a esa rama vuelve
a desplegar el demo. Los comandos:

| | Comando |
| --- | --- |
| Build | `bash scripts/render_build.sh` |
| Start | `uv run --frozen --no-dev gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |

`scripts/render_build.sh` corre con `backend/` como directorio y hace, en este orden:

1. Usa `uv` (Render lo agrega si la raíz del servicio tiene `uv.lock`; si no, lo instala con
   `pip` en la versión que escribió el lock) y corre `uv sync --frozen --no-dev`: las
   dependencias exactas del lock, sin `ruff`.
2. `collectstatic --noinput`: copia cada archivo estático a `staticfiles/` con un hash en el
   nombre y una copia comprimida. WhiteNoise los sirve desde el propio proceso de Django,
   con una caché que no vence porque el hash cambia con el contenido; no hace falta otro
   servidor. `staticfiles/` no se versiona.
3. `migrate` **por etiqueta, una app a la vez**: `contenttypes`, `auth`, `admin`, `sessions`,
   `inventory`, `ecommerce` y `panel`, nunca un `migrate` sin etiqueta. Django es dueño de
   unas pocas tablas de la base compartida y la regla del proyecto es nombrar lo que se
   migra. Una prueba compara esa lista con las apps que tienen migraciones, para que una
   app nueva no se quede fuera. `migrate` corre antes el chequeo `config.E001`: si el
   esquema `django` no existe, el build se detiene con un mensaje claro y no crea tablas
   en `public`.

El arranque usa `--frozen --no-dev` para que `uv run` no busque herramientas de desarrollo ni
un lock nuevo cada vez que el servicio despierta, y `--bind 0.0.0.0:$PORT` porque Render
define el puerto en `PORT` y enruta a él. No se enciende el registro de accesos de `gunicorn`
(`--access-logfile`): cada línea llevaría la ruta de la petición, y la de una invitación
lleva su token.

Con `DEBUG` apagado, Django no escribe en consola el error de una petición que falla; lo
manda por correo a `ADMINS`, que aquí no existe. En un host cuyo único rastro es la salida
del proceso eso dejaría las fallas sin explicación, así que `config/settings.py` envía los
errores del logger `django.request` a la consola. Solo errores: un 404 se registra como aviso
con su ruta, y la de una invitación lleva el token.

Un error 500 sí lleva la ruta (`Internal Server Error: /panel/invitado/<token>/`), así que el
handler de consola tiene un filtro (`config/logging_filters.py`, `RedactInviteToken`) que
reescribe `/panel/invitado/<lo que sea>` como `/panel/invitado/<redacted>` en el mensaje del
registro. Reescribe el mensaje, no el texto del traceback, que lleva líneas de código y el mensaje
de la excepción y no la ruta de la petición. Una prueba usa el `LOGGING` real, provoca un 500 en
esa ruta y comprueba que el token no sale.

### Detrás del proxy de Render

Render termina TLS en su balanceador y le habla al servicio por http (y manda a https las
peticiones http), según su documentación. Lo habitual es que ese proxy ponga
`X-Forwarded-Proto: https`; la documentación de referencia de Render no la nombra, y eso
quedó sin comprobar (ver al final). `gunicorn` solo cree esa cabecera si quien se conecta
está en `--forwarded-allow-ips` (por defecto, `127.0.0.1`), y el proxy de Render, que es otra
máquina, no lo está. Sin más, Django ve todas las peticiones como http, y su comprobación
CSRF, que compara el `Origin` del formulario (https) con el esquema de la petición, rechaza
todos los POST. `DJANGO_BEHIND_PROXY=true` activa `SECURE_PROXY_SSL_HEADER`, que le dice a
Django que crea esa cabecera aunque `gunicorn` no. Se comprobó con `gunicorn` real y un
cliente que este no considera de confianza: el mismo POST con `Origin: https://…` da 403 sin
la variable y 302 con ella.

Está apagada por defecto porque Django cree lo que diga esa cabecera: solo es seguro cuando un
proxy la pone y el cliente no puede, y con la app alcanzable de otra forma cualquiera podría
mandarla. Una prueba (`config/test_deploy.py`) fija las dos mitades.

### Archivos estáticos en local

Con `DJANGO_DEBUG=True`, `runserver` sirve los archivos desde donde están y no hace falta nada.
Con `DJANGO_DEBUG=False`, el almacenamiento con hash exige que antes corra
`uv run python manage.py collectstatic`. Los tests no lo necesitan: `config/settings_test.py`
usa el almacenamiento simple y deja fuera a WhiteNoise.

### Límites del plan gratuito (según la documentación de Render)

- El servicio se **duerme tras 15 minutos sin tráfico** y despertarlo tarda alrededor de un
  minuto: la primera visita de quien revisa es lenta.
- Cada workspace tiene 750 horas de instancia gratuitas al mes.
- **No hay Shell ni SSH** en un servicio gratuito. Por eso las invitaciones se emiten desde tu
  máquina, contra la base del demo, con las variables del demo exportadas en tu terminal (no
  las pegues en `backend/.env`):

  ```bash
  uv run python manage.py issue_review_invite --supabase-user <uuid> \
    --label "Profesora M15" --days 7 --base-url https://<servicio>.onrender.com
  ```

- El sistema de archivos es efímero y no hay disco persistente: nada se guarda en disco. Las
  sesiones y las invitaciones viven en Postgres.

### Primer despliegue

1. En Render: New → Blueprint → conecta el repo y elige `practicas-ebac`. Render lee
   `render.yaml` y pide los valores de las variables con `sync: false`; en
   `REVIEW_INVITES_ENABLED` escribe `true`, o los enlaces responderán 404.
2. Cuando exista el servicio, copia su hostname `*.onrender.com` a `DJANGO_ALLOWED_HOSTS` y
   vuelve a desplegar.
3. Emite una invitación (arriba), ábrela, pulsa «Entrar al panel».
4. Para revocarla: `/admin/` del demo → «Invitaciones de revisión» (el admin de Django pide
   un superusuario con contraseña, que se crea con `createsuperuser` y las variables del demo
   en tu terminal), o, sin admin, desde el editor SQL de Supabase:
   `UPDATE django.panel_reviewinvite SET revoked_at = now() WHERE id = <id>;`.

### Lo que no se pudo comprobar

- Que `uv run` funcione como comando de arranque en Render: su documentación describe `uv` para
  el build y no menciona `uv run` al arrancar. Si falla, usa
  `.venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`.
- Que Render ponga su Python en el `PATH` que ve `uv` (lo que `UV_PYTHON_PREFERENCE=only-system`
  necesita) y que `.venv/` llegue intacto del build al arranque.
- Que el proxy de Render mande `X-Forwarded-Proto: https` en cada petición. Si no lo hiciera,
  el síntoma sería un 403 de CSRF en todos los POST, y la salida es
  `DJANGO_CSRF_TRUSTED_ORIGINS=https://<hostname del servicio>`: con el origen en esa lista, la
  comprobación no depende del esquema que Django crea ver.
- Lo del pooler y `options`, arriba.
- Que el pooler de Supabase acepte la conexión con `PGSSLMODE=require`. Lo esperable es que sí,
  pero no se probó contra el real. Si no, el síntoma sería un error de conexión en el build
  (el `migrate`) y lo confirma el mismo `psql` de arriba con `?sslmode=require` en la URL.
- Un despliegue real: todo lo demás se comprobó en local (`collectstatic` con las
  configuraciones reales, `gunicorn` sirviendo los archivos con caché inmutable) y con las
  pruebas, no en Render.

## Panel frame

Every page of the panel extends `templates/panel/base.html`: the sidebar from
1024 px, the tab bar below it, the top bar and `<main>`. It is `dashboar.html` as
the redesign delivered it (`pruebas` `3254d3b4`), moved here with `git mv`; the
Inicio content that file also held is `panel/inicio.html`. The store's root no
longer has a `dashboar.html`.

| Block | What a page puts in it |
| --- | --- |
| `title` | The whole `<title>` element. |
| `titulo` | The text of the `<h1>` in the top bar. |
| `accion` | The button on the right of the top bar, when the page has one. |
| `contenido` | The page itself. |

- No JavaScript and no inline styles anywhere in the panel: a link or a form is
  all the interaction there is. A test fails when a panel page gets a `<script>`,
  a `<style>` or a `style=` attribute.
- The current entry of both navigations gets `aria-current`. It is read from
  `request.resolver_match`: `view_name` is `namespace:name` and `section` is the
  namespace, so every route of the `inventory` namespace marks Productos. "Más"
  is `page` on `panel:mas` and `true` on `panel:ads` and `settings:index`, which
  live inside it on the phone. `panel/test_frame.py` pins the whole table.
- Pedidos, Clientes, Publicidad and Ajustes have no route yet (backlog), so the
  frame links them by their path from the contract and they answer 404 today.
  `PENDING_PATHS` in `panel/test_frame.py` lists them; the day one of them
  resolves, that test fails and the literal link becomes a url tag in
  `panel/base.html` and `panel/mas.html`.
- `store_origin` (`panel/context_processors.py`) is `STORE_ORIGIN`. The logo and
  the product pictures are files of the store, not of Django, so a template links
  them as `{{ store_origin }}/img/...`.
- `panel/messages.html` draws the messages the previous request queued: a check
  for success, a sand triangle for a warning and a red one for an error.
- A stylesheet class that only appears in Python (a form widget's `attrs`) is not
  seen by Tailwind: see "Things to know" below.

## Panel stylesheet (Tailwind v4)

The panel is styled with Tailwind v4 from the same design tokens as the store.
Django has no Node, so one script compiles the stylesheet inside Docker and the
result is committed.

| Path | What it is |
| --- | --- |
| `assets/tokens.css` | Byte-identical copy of `src/styles/tokens.css` on `pruebas` (contract S1): the one `@theme` that the store and the panel share. Never edited here. |
| `assets/panel.css` | The Tailwind entry: imports Tailwind and the tokens, scans `templates/` for classes and declares the `@font-face` rules. Sources only. |
| `static/panel/panel.css` | The compiled, minified output. Built by the script, committed, and served by `staticfiles` as `panel/panel.css`. |
| `static/panel/fonts/` | The self-hosted woff2 files, each with its SIL OFL license next to it. |
| `scripts/build_panel_css.sh` | Drift check, build and `--check`. |

`STATICFILES_DIRS` is `[BASE_DIR / "static"]`. `assets/` is left out on purpose,
so `collectstatic` and `runserver` never publish the sources. `panel/base.html`
links the stylesheet with `{% static 'panel/panel.css' %}`.

`assets/panel.css` also carries the base layer of the panel pages (page
background and type, the heading font, the selection colour and the sand focus
ring). It is the one in `src/styles/panel.css` on `pruebas`, copied here because
that file gets its fonts from npm packages Django does not have: the
`@font-face` rules replace those imports. When the redesign changes its base
layer, it says so like it does for `tokens.css` (Engram `frontend/entrega/tokens`)
and the block here follows.

### Build and check

Run it from any directory, with Docker running and access to the npm registry
(the CLI is installed on every run; nothing runs `npm` on the host):

```bash
backend/scripts/build_panel_css.sh                  # drift check, then build
backend/scripts/build_panel_css.sh --check          # fail when the committed CSS is stale
backend/scripts/build_panel_css.sh --sync-tokens    # take tokens.css from origin/pruebas, then build
```

Every run starts with `git fetch origin pruebas` (skip it with
`PANEL_CSS_NO_FETCH=1` when offline) and a drift check. It fails when:

- the sha256 of `assets/tokens.css` differs from `src/styles/tokens.css` on
  `origin/pruebas`;
- the Tailwind version pinned at the top of the script, or one of the two font
  versions, differs from what `package-lock.json` locks on `origin/pruebas`: the
  panel has to compile with the store's Tailwind and ship the store's font files.

Then it compiles into a temp directory. A plain run copies the result over
`static/panel/panel.css`; `--check` changes nothing and fails when the committed
file is not what the sources build. The output is byte-identical across runs and
between `linux/arm64` and `linux/amd64`, so the check also holds on other
machines and CI. The CLI's own dependencies are not locked, but the two that
decide the output (`@tailwindcss/oxide` and `lightningcss`) are pinned by
Tailwind itself.

The Docker command it runs, so a failure can be reproduced by hand:

```bash
docker compose -f .devcontainer/docker-compose.yml run --rm -T \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
  -v "$OUT_DIR:/out" --workdir /tmp \
  app sh -euc "$CONTAINER_SCRIPT" sh 4.3.3
```

`$OUT_DIR` is an empty temp directory that receives `panel.css`, and
`$CONTAINER_SCRIPT` is the script's own text (the heredoc at the top of
`build_panel_css.sh`). Inside the container it copies `backend/` (without
`.venv`, `.env` and the caches) to `/tmp`, installs `tailwindcss@4.3.3` and
`@tailwindcss/cli@4.3.3` there with install scripts off, and compiles
`assets/panel.css` with `--minify`. The copy exists because the CLI looks for
`tailwindcss` from the folder of the CSS file it compiles, and the repo has no
`node_modules`. The first run builds the `.devcontainer` image if it is missing.

### When the redesign changes the tokens

`src/styles/tokens.css` belongs to the redesign. The backend never edits its
copy; it resyncs it:

1. `backend/scripts/build_panel_css.sh --sync-tokens` fetches `origin/pruebas`,
   copies the file byte for byte and rebuilds.
2. `uv run python manage.py test panel.test_stylesheet` (from `backend/`).
3. Commit `assets/tokens.css` and `static/panel/panel.css` together.

Until that is done, every run of the script reports the drift and `--check`
fails. The same applies to a Tailwind or font version the store bumps: the
script says which pin moved.

### Fonts

| Family | Package | Files |
| --- | --- | --- |
| `Geist Variable` (`wght` axis) | `@fontsource-variable/geist` 5.3.0 | `static/panel/fonts/geist/geist-latin-wght-normal.woff2` and `LICENSE` |
| `Fraunces Variable` (`opsz` and `wght` axes) | `@fontsource-variable/fraunces` 5.3.0, `opsz.css` | `static/panel/fonts/fraunces/fraunces-latin-opsz-normal.woff2` and `LICENSE` |

They are the packages, versions and axes that `src/styles/fuentes.ts` imports in
the store. The woff2 files and the licenses come from the npm tarballs
(`npm pack @fontsource-variable/<name>@<version>`, run in the same Docker
service), after checking each tarball's sha512 against the `integrity` that the
store's `package-lock.json` records. The `@font-face` blocks in
`assets/panel.css` are Fontsource's own, with `font-display: swap` and the
`unicode-range` of the `latin` subset, and only their `url()` changed. That
subset covers Spanish; a character outside it falls back to the system font. To
add a subset (for example `latin-ext`) or to refresh the files after the script
reports a font drift, copy the file and the new `@font-face` block from the same
package version and rebuild.

### Things to know

- `assets/panel.css` imports the tokens with `theme(static)`, so the build emits
  every token as a custom property on `:root`, not only the ones a utility uses.
  A template can read `var(--color-sand)` from its own CSS.
- Tailwind only scans `templates/` and the files `assets/panel.css` lists with
  `@source`. A class that lives anywhere else (a message tag in Python, a template
  inside an app) is not seen: add its file there. `inventory/forms.py` is already
  listed, because the classes of the product form's controls live in it.
- The `url()` paths in `assets/panel.css` are relative to the compiled file
  (`static/panel/`), not to the source.
- Do not edit `static/panel/panel.css` by hand: `--check` fails and the next
  build overwrites it.
- The M13 templates define their own `--color-*` custom properties in an inline
  `<style>`, with names that collide with the tokens. Do not link `panel.css`
  from them; `panel/base.html` replaces them (B15). Meanwhile Tailwind also emits
  a few utilities for plain words it finds in them (`block`, `table`, `border`).

## Tests

```bash
uv run python manage.py test
```

`manage.py test` uses `config/settings_test.py` (an in-memory SQLite database),
even when `DJANGO_SETTINGS_MODULE` is exported in your shell. Only an explicit
`--settings X` or `--settings=X` overrides it; do not point it at
`config.settings`, because the `django` role cannot create a test database in
Postgres. `Category`, `Product`, `OrderItem`, `Favorite` and `Profile` are
unmanaged mirrors of Supabase tables, so `config/test_runner.py` sets
`managed = True` on them only while the tests run, which makes Django create
their tables in the test database. The test settings import the regular ones, so
the Django secret key and the `POSTGRES_*` variables of `backend/.env` must be
set even though the tests run on SQLite.

`panel/tests.py` covers the token check (in both key modes), the handoff, the
access bridge, the guard of the panel views, the logout and the cookie flags and
headers, and `config/tests.py` the parsers of the environment variables. The test settings set the panel's
configuration themselves, with a signing secret that is random on every run.

`inventory/tests.py` covers `price_per_lb_for()`, the unit of a price, the
pagination and the list page (rows, chips, search, empty state and a query count
that does not grow with the products), the detail page, the picture address, the
form page (controls, required marks, errors and what comes back), the panel
views and their routes, the
rules in `inventory/services.py`, the read-only mirrors and the product admin
(through the test client, as a superuser). The
panel views are tested signed in the way a real admin signs in, through the
handoff (`sign_in_as_panel_admin` in `panel/tests.py`), so the guard is never
skipped. Those mirrors refuse writes from Django, so the tests add their rows
with raw SQL, the way Supabase does. It starts from the fixture
`inventory/fixtures/categories.json`, the 9 real categories dumped with
`dumpdata inventory.Category`. The `config.E001` system check only runs against
Postgres; other databases have no `django` schema to verify.

`config/test_deploy.py` covers the deployment: the settings that read the environment
(`DJANGO_BEHIND_PROXY`, `DJANGO_CSRF_TRUSTED_ORIGINS`, imported in a fresh interpreter), why
the proxy header matters for the CSRF check, WhiteNoise's place in the middleware, the logging
of server errors (and that the real `LOGGING` keeps an invite token out of the console), and
`render.yaml` and `scripts/render_build.sh` against the code they configure (the variables the
settings require, the plain values it may hold, `PGSSLMODE`, the owner's switch for the invites,
the apps that have migrations).

`panel/test_invites.py` covers the review invites: the model (only the hash is stored,
the ways a link stops working, the landing path rules), the flag (every method and the link
without its slash answer 404 when it is off), the confirmation page and its headers, the
redemption (the session of the handoff, key rotation, the role still read on every request,
a target who is no longer an admin refused without using anything up, one use at a time, CSRF,
nothing used up when the session fails), the lifetime of the session an invite opened (revoking
or expiring the invite ends it), the one page every refusal gets, the admin and the command.

`panel/test_frame.py` covers the frame: the Más page through the panel admin
session, which entry of both navigations is current for every route of the
contract, the links the frame still owes to missing routes, the messages partial
and the `store_origin` context processor.

`panel/test_stylesheet.py` covers the static files of the panel: the finders
serve the stylesheet, both woff2 files and their licenses, and do not serve the
Tailwind sources in `assets/`; the compiled CSS declares every custom property of
`assets/tokens.css` (and the same colours and font stacks), both `@font-face`
families with `font-display: swap`, no `@import` and no remote URL, and every
`url()` in it is a file the finders serve. It needs no Docker. Whether the CSS is
up to date with its sources is `build_panel_css.sh --check`, not a test.

## Warning

**Do not run `manage.py migrate`** unless the `django` schema and the Django
database role exist in Supabase (they are created by
`supabase/migrations/20260918235409_django_schema_role.sql`). Running migrate
without that schema would create Django's tables in `public`, colliding with
Supabase-owned tables. The system check `config.E001` stops that.
