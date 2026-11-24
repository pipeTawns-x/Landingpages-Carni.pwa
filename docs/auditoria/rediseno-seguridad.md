# Auditoría de seguridad del rediseño (TA), rebanada 1

Auditor: teammate `auditor` (rol security-guardian). Fecha: 2026-11-23. Rama `claude/stack-carney-mvp-244236`, HEAD `0e91976c`.
Specs cubiertas: S2 (Django sirve las páginas), S6 (productos, carrito, cotizador) y S7 (componentes compartidos: header, carrito, CSP), según `odd/tasks/rediseno-moderno.md`.
Alcance de la rebanada 1: los commits `cefc87fa` (T3 A, `/` servida por Django) y `11ff7c41` (T3 B, movimiento con scroll) y el código público de la tienda sobre el que se apoyan. Se audita **HEAD**, no el árbol de trabajo sin commitear de los teammates (en el momento de la auditoría `backend-datos` tenía cambios sin commitear en `ventas/views/carrito.py`, `comun.py`, `productos.py`, `catalog.py`, `domain.py` y `context_processors.py`; `frontend` tenía `ventas/templates/ventas/productos.html` sin seguimiento). Las líneas citadas son de HEAD.
Corrección de ruta: la CSP no vive en `backend/ventas/middleware.py` (no existe) sino en `backend/config/middleware.py:35-54`.

Este informe no modifica código. Los hallazgos van al dueño por mensaje con el mismo archivo:línea. Convención: **confirmado** = reproducido con una prueba, un comando o la lectura exacta del código; **por validar** = hipótesis con base en el código cuyo dato decisivo está fuera del repositorio, sin severidad hasta que se valide.

## 1. Hallazgos

| id | severidad | estado | archivo:línea (HEAD) | dueño | resumen |
|---|---|---|---|---|---|
| F-01 | media | confirmado en HEAD; **corregido en el árbol sin commit** (sección 6) | `backend/ventas/views/carrito.py:263-274` | backend-datos | El respaldo `create_order_staff` del pedido de invitado quita el tope de 3 pendientes por teléfono y la validación de 7 dígitos |
| F-02 | media | confirmado en HEAD; **corregido en el árbol sin commit** (sección 6) | `backend/ventas/views/carrito.py:177`, `:184`, `:194` | backend-datos | `agregar`, `actualizar` y `quitar` no tienen límite y cada POST hace una llamada RPC y escribe una sesión |
| F-03 | baja | confirmado | `backend/config/settings.py` (sin `SESSION_ENGINE`), `render.yaml:31` | main | Nada ejecuta `clearsessions`: la tabla de sesiones solo crece |
| F-04 | sin severidad | por validar | `backend/ventas/throttle.py:13-20`, `settings.py:343-349` | backend-datos | Con más de un salto de proxy, todos los clientes comparten contador de límite |
| F-05 | baja | confirmado | `.gitignore:12-23` | main | `.env.*` y `secrets/` no están ignorados, contra la regla global 4 |
| F-06 | baja | confirmado | `backend/static/tienda/vendor/supabase-js.mjs`, `backend/README.md:343-349`, `backend/ventas/tests/test_acceso.py:213,226` | frontend | El módulo que maneja la contraseña es un binario minificado sin hash registrado ni prueba de contenido |
| F-07 | sin severidad | por validar (aviso previo a T4b) | `js/modules/core/cart.js:228-262`, `src/entry/products.tsx` | frontend | El carrito heredado arma HTML con datos sin escapar y atributos en línea que la CSP bloquea; calcula totales en el navegador |
| F-08 | baja | confirmado | `supabase/migrations/20260911_chat_messages.sql` (política `chat_messages_insert_anon`) | backend-datos | Inserción anónima con `WITH CHECK (true)` y sin tope de longitud |
| F-09 | sin severidad | por validar | `backend/config/urls.py:22`, `backend/panel/access.py:51` | main | `/admin/login/` es público y sin bloqueo por intentos; depende de si existe un superusuario con contraseña |
| F-10 | baja (alcance) | confirmado | `package.json:32,37,38`, `package-lock.json` | main | `npm audit --omit=dev`: 9 vulnerabilidades (1 crítica, 5 altas, 3 moderadas); fuera del camino de Django salvo axios; plazo ASVS 15.1.1 vencido |
| F-11 | baja | confirmado | `server/app.ts:11-16`, `server/routes/buildads.ts:7-15,34` | main | Servidor Node de desarrollo: API de BuildAds sin autenticación y `express.static` sobre la raíz del repo |
| F-12 | info | confirmado | `backend/config/settings.py:221`, `backend/inventory/storage.py:130-140` | backend-datos | La clave `service_role` vive en el entorno del proceso de Django (solo para fotos) |
| F-13 | info | confirmado | `backend/pyproject.toml:6` | backend-datos | El límite inferior `django>=5.2,<5.3` no se subió a `>=5.2.19`; el lock sí está en 5.2.19 |
| F-14 | info | confirmado | `backend/templates/base.html:7`, `backend/ventas/templates/ventas/tienda/landing.html:11`, `backend/static/tienda/vendor/gsap/` | main (T8) | Superficie muerta de la tienda paralela que WhiteNoise sigue sirviendo |
| F-15 | info | confirmado | `backend/config/middleware.py:39-51` | main | La CSP no tiene `report-to`: una violación en producción no se ve |
| F-16 | sin severidad | por validar | `supabase/migrations/202604100002_rls_policies.sql:23-26` | backend-datos | `profiles_insert_own` no fija `role = 'customer'`; hoy lo cubre el disparador de alta |
| F-17 | baja | confirmado; **IPv6 corregido en el árbol (verificado)**, caché de 300 entradas pendiente del lead | `backend/ventas/throttle.py:13-35`, `backend/config/settings.py` (sin `CACHES`) | backend-datos / main | Los límites por IP usan la dirección completa (un /64 de IPv6 da 2^64 llaves) y viven en una caché `LocMemCache` de 300 entradas que se vacía con ruido de llaves |
| F-18 | info | confirmado; **corregido en el árbol (verificado)** | `backend/ventas/forms.py:59-61`, `backend/ventas/views/carrito.py` (`StoreOrderForm`) | backend-datos | El formulario del pedido acepta "-------" como teléfono; solo el SQL lo rechaza |
| F-19 | baja | confirmado; `backend-datos` propone aceptarlo (decisión del lead o de Eduardo) | `backend/ventas/views/productos.py` (`cotizar`, campo `avisos`), `supabase/migrations/20261113000002_comercio_v1_cotizacion_y_pedidos.sql:205-209` | backend-datos | La cotización pública ahora devuelve `low_stock`, que depende de la cantidad pedida: sirve para calcular el stock exacto |
| F-20 | info | confirmado; **contrato y 3 pruebas añadidos (verificado)** | `backend/ventas/views/carrito.py` (escrituras en modo JSON), `docs/datos/contrato-productos.md:19-33` | backend-datos / frontend | La cookie CSRF solo existe en páginas que pintan un token; el 403 de CSRF es HTML |

### F-01 (media, confirmado): el respaldo del pedido de invitado pierde controles
- Código: `carrito.py:263-274` captura `GatewayFunctionMissing` de `create_order_web` y llama `create_order_staff(items=lines, staff_ref=None, channel="whatsapp", **values)`. El registro es un `logger.warning` (`:266-271`).
- SQL: `create_order_staff` (`supabase/migrations/20261113000002_comercio_v1_cotizacion_y_pedidos.sql:456-495`) no cuenta pendientes y del teléfono solo valida `char_length(v_phone) > 20` (`:482`). `create_order_web` (`20261117000002_create_order_web.sql:62-80`) exige teléfono (`:62`), 7 dígitos (`:66-68`) y no más de 3 pendientes por los mismos dígitos (`:73-80`, con bloqueo advisory).
- Privilegio: **ninguna escalada en la base**. Las dos funciones son `SECURITY DEFINER`, las ejecuta el mismo rol `django` (`20261117000002:92-93`, `20261113000002:658-667`) y comparten `_create_order`. Cambia el control: el pedido nace con canal `whatsapp` y `staff_ref` NULL, es decir, un pedido anónimo de la web se ve como uno del personal.
- Escenario: una base sin la migración `20261117000002` (restaurada de un respaldo, base nueva de una rama, la demo de Render con su propio proyecto, `render.yaml:9`) deja a un anónimo crear pedidos pendientes sin tope por teléfono. Solo lo frena el límite de 5 intentos por hora por IP y por sesión (`settings.py:343-348`, `carrito.py:242-253`). El regex `forms.py:59-61` (`^\+?[0-9 ()\-]{7,20}$`) acepta "-------", que solo `create_order_web` rechaza. Un pedido pendiente no descuenta stock (el stock se mueve en `set_order_status`), así que el daño es ruido en el tablero, tiempo del personal y estadísticas del canal WhatsApp contaminadas.
- Arreglo: fallar cerrado (que `GatewayFunctionMissing` termine en `GatewayUnavailable` y el mensaje de tienda no disponible) o replicar en Python el tope y los 7 dígitos antes del respaldo; una prueba que ejerza el respaldo con 3 pendientes; una comprobación de arranque o de salud que verifique que existe `create_order_web`.

### F-02 (media, confirmado): escrituras públicas del carrito sin límite
- `agregar` (`carrito.py:177`), `actualizar` (`:184`) y `quitar` (`:194`) no llaman a `throttle`. `agregar` y `actualizar` pasan por `_save_line` (`:159-173`) y `_quote_ok` (`:146-156`), o sea una llamada RPC `quote_cart` por POST, más la escritura de la sesión del carrito. Tienen límite solo `cotizar` (`productos.py:94`, 90 por minuto), `buscar` (`productos.py:126`, 120 por minuto) y `pedido` (`carrito.py:242`).
- Escenario: un script pide una página (recibe cookie y token CSRF: sin problema, es público) y repite `POST /carrito/agregar/<pk>/` con cookie nueva en cada vuelta. Cada vuelta es una consulta a la base y una fila nueva en `django_session`. La demo corre con un solo trabajador síncrono (`render.yaml:31`, `--workers 1`), así que saturarlo degrada toda la tienda; la base es de capa gratuita.
- Estado en el árbol de trabajo: `backend-datos` ya agregó `CART_WRITES_PER_MINUTE = 60` en `carrito.py`, todavía sin uso. Pendiente de cablear y probar.
- Arreglo: `throttle.too_many(request, "carrito", CART_WRITES_PER_MINUTE)` en las tres vistas, respuesta 429 y prueba. Las páginas de lectura (`/`, `/productos/`) tampoco tienen límite pero su costo es menor; es una decisión de capacidad, no un hallazgo.

### F-03 (baja, confirmado): sesiones que nunca se purgan
- `grep -rn clearsessions` sobre el repo: sin resultados. `SESSION_ENGINE` es la base de datos (`django.contrib.sessions.backends.db`, impreso con la configuración tipo producción). Con F-02, las filas de `django_session` crecen sin tope aunque expiren (`SESSION_COOKIE_AGE` 8 h, `settings.py:286`).
- Arreglo: `manage.py clearsessions` en el comando de arranque (`render.yaml:31`) o en el script de build (`scripts/render_build.sh`), o un cron de la plataforma.

### F-04 (por validar): IP del cliente detrás de más de un proxy
- `throttle.client_ip` (`throttle.py:13-20`) usa la **última** entrada de `X-Forwarded-For` cuando `DJANGO_BEHIND_PROXY` está activo (`settings.py:349`). Es correcto con exactamente un proxy. Si hay otro salto delante (por ejemplo un CDN delante de la plataforma), esa última entrada es la del intermediario: todos los clientes comparten contador y el pedido número 6 de la hora, de cualquiera, recibe 429 (`CHECKOUT_THROTTLE_LIMIT=5`, `settings.py:343-348`); `cotizar` y `buscar` se comparten igual.
- Dato que falta: cuántos saltos agrega el despliegue real. No se sondea el despliegue (regla de la auditoría). Plan: en la demo, registrar una sola vez el `X-Forwarded-For` de una petición propia, o leer la documentación de la plataforma. Arreglo: número de saltos confiables configurable y tomar `entradas[-saltos]`.

### F-05 (baja, confirmado): `.gitignore` incompleto frente a la regla global 4
- `.gitignore:12-23` cubre `.env`, `.env.local`, `.env.*.local`, `.env.bak-*` y `.env.example`; `backend/.gitignore:1` cubre `.env`. Prueba: `git check-ignore -v .env.production .env.staging secrets/x.txt` termina con código 1 y sin salida: ninguno está ignorado. Un `.env.production` se puede commitear por accidente.
- Arreglo: agregar `.env.*` y `secrets/` (la regla global pide `.env`, `.env.*`, `*.pem`, `*.key` y `secrets/`; `*.pem` y `*.key` ya están en `:76-77`).

### F-06 (baja, confirmado): módulo de la pantalla de contraseñas sin verificación de contenido
- `acceso.js:102` carga con `import()` el archivo `static/tienda/vendor/supabase-js.mjs` (189 KB minificados, sin cabecera ni licencia). `backend/README.md:343-349` documenta la procedencia (esbuild 0.27.7 desde `@supabase/supabase-js@2.103.0`, construido con `--ignore-scripts`) y la cadena "2.103.0" dentro del archivo coincide con `package-lock.json:5342`. Ninguna prueba compara el contenido: `test_acceso.py:213` y `:226` solo comprueban que existe y que se importa.
- sha256 actual: `55204258e5c6d08794e6dba3cbd831c23b9c8c2bcb1f57923f2a82c909abfa07`.
- Escenario: un cambio malicioso o accidental del archivo (minificado, ilegible en una revisión) vería correos y contraseñas. Está en git, así que el cambio sería visible en el diff, pero no revisable. No se reconstruyó el módulo (exigiría instalar paquetes).
- Arreglo: guardar el hash junto al comando de reconstrucción y una prueba que lo compare, o producirlo como entrada del build de Vite desde el lock (lo natural en T5).

### F-07 (por validar, aviso previo a T4b): el carrito heredado en la entrada de productos
- `src/entry/products.tsx` importa `js/modules/core/cart.js`. Ahí `row.innerHTML = ...` (`cart.js:228-262`) interpola `${it.name}` y `${it.img}` sin escapar y lleva `style="..."` y `onerror="..."` en línea. La CSP (`config/middleware.py:39-51`) no admite `'unsafe-inline'`: los atributos se bloquean (se rompe el diseño) y el nombre inyecta HTML, no script. Los totales se calculan en el navegador (`normalized.itemTotal`), contra la regla de que el precio sale del servidor (Engram #1091, punto 16a).
- Hoy no se sirve: la entrada solo la usa `backend/ventas/templates/ventas/productos.html:30`, que no está commiteada. Se revisa cuando `frontend` entregue T4b.
- Arreglo: que `/productos/` use el carrito de Django (`ventas.cart` y `quote_cart`); donde se conserve JS, `createElement` y `textContent` y clases en lugar de `style` y `onerror`.

### F-08 (baja, confirmado): `chat_messages` acepta inserciones anónimas sin tope
- `supabase/migrations/20260911_chat_messages.sql`: `CREATE POLICY "chat_messages_insert_anon" ... FOR INSERT WITH CHECK (true)`; `message`, `session_id` y `page_url` son `text` sin límite. El widget del chat se carga también en la landing de Django (`src/landing/server-store.tsx:129` importa `js/modules/chatbot.js`, que escribe con la llave publicable en `chatbot.js:151-163`). La llave publicable es pública por diseño; cualquiera puede insertar filas de tamaño arbitrario por la REST de Supabase (crecimiento de almacenamiento en capa gratuita). La lectura sí está limitada al administrador (`chat_messages_select_admin`, `public.is_admin()`), así que no hay fuga.
- El bundle commiteado se construyó sin `VITE_SUPABASE_*` (solo aparecen los nombres, ningún valor), por lo que en esa build el widget no persiste (`chatbot.js:149` sale temprano). El riesgo es por la API directa y por una futura reconstrucción con `.env`.
- Arreglo: migración nueva (solo escrita para revisión) con `CHECK (char_length(message) <= 1000 AND char_length(session_id) <= 64 AND char_length(page_url) <= 200)`; a mediano plazo, escribir por Django con límite.

### F-09 (por validar): `/admin/` público sin bloqueo por intentos
- `config/urls.py:22` publica `admin.site`. No hay `django-axes` ni límite en el login (`grep` de `axes|ratelimit` en `pyproject.toml` y `settings.py`: nada). Los usuarios del panel nacen con contraseña inutilizable (`panel/access.py:51`, `set_unusable_password`), así que el login solo sirve a un superusuario creado a mano. El roadmap pide "Max Retry and jail features in login" (`best-practices.md:100`).
- Dato que falta: si en la base real existe un superusuario con contraseña utilizable. Arreglo: desactivar `/admin/` en producción con una variable de entorno, o agregar bloqueo por intentos.

### F-10 (baja por alcance, confirmado): deuda de dependencias npm
`docker run ... npm audit --omit=dev --json`: **9** (1 crítica, 5 altas, 3 moderadas), las mismas de L8 y de Engram #1091 punto 12.

| paquete | severidad | directo | alcance en producción de Django |
|---|---|---|---|
| proxy-addr (≤2.0.7) | crítica | no | no: cadena de `express` en `server/app.ts` (solo `npm run api:dev`, `package.json:16`) |
| axios (1.0.0-1.19.0) | alta | sí (`package.json:32`) | **sí, en el navegador**: `backend/static/vite/assets/globalStyles-Cc1az5Oc.js` contiene `AxiosError`; lo usa `src/redux/slices/busquedaSlice.ts:17,186`. Los avisos son de adaptador de Node, `NO_PROXY` y contaminación de prototipos: alcance bajo en el navegador |
| body-parser, ws, form-data, ip-address | alta | no | no: cadena de `express`/dev |
| express-rate-limit | moderada | sí (`package.json:38`) | no: solo `server/routes/buildads.ts` |
| follow-redirects, qs | moderada | no | no |

`render.yaml` despliega solo Django, así que el camino de producción no incluye la cadena de `express`. El plazo de OWASP ASVS 15.1.1 (crítico y alto en 7 días) venció: el hallazgo viene del 2026-11-03. Arreglo: previsualizar sin `--force` (axios 1.20.0, proxy-addr 2.0.8, ws 8.21.0, etc., según #1091 punto 12) y probar cada salto en Docker. Python: `backend/uv.lock` fija Django **5.2.19** (commit `5af793fb`), psycopg 3.3.5, PyJWT 2.15.1, cryptography 50.0.2, gunicorn 26.2.0, whitenoise 6.12.0: sin hallazgos conocidos en #1570. No se corrió un escáner de Python con red (ver sección 4).

### F-11 (baja, confirmado): servidor Node de desarrollo
- `server/app.ts:11-16`: `app.use('/api/buildads', ...)` y `app.use(express.static(workspaceRoot))` con `workspaceRoot` igual a la **raíz del repo** (`:5-8`); `app.listen(port)` escucha en todas las interfaces. Las rutas `/predis` y `/elevenlabs` (`server/routes/buildads.ts:17,83`) no tienen autenticación; solo un límite de 20 por minuto por IP (`:7-15`), y reenvían a APIs de terceros con claves del servidor (`process.env.PREDIS_API_KEY`, `:34`). Mientras corre `npm run api:dev` en una red compartida, cualquiera lee fuentes, migraciones y código del backend (los archivos con punto, como `.env`, los ignora `express.static` por defecto según la documentación de serve-static; no se verificó en esta sesión) y gasta cuota de pago.
- No se despliega (`render.yaml`). El navegador llama a esas rutas desde `src/modules/buildads/BuildAdsOrchestrator.tsx:39-48` con POST sin cabecera CSRF; Django no tiene esas rutas (la página `/panel/buildads/` es solo lectura, `panel/views.py:294`). Es una decisión para T7: cuando BuildAds pase a Django hará falta `@panel_admin_required`, CSRF, límite y la aprobación de Eduardo para enviar datos a terceros (Predis, ElevenLabs).
- Arreglo: `express.static` solo sobre una carpeta pública, escuchar en `127.0.0.1`, autenticación antes de gastar cuota.

### F-12 (info, confirmado): `service_role` en el proceso de Django
- `settings.py:221` lee `SUPABASE_SERVICE_ROLE_KEY` (opcional; `render.yaml:70` la declara). Solo la usa `inventory/storage.py:130-140` para subir fotos. La regla de AGENTS.md ("nunca `service_role` fuera del entorno local") se cumple en la conexión de Postgres (`POSTGRES_USER` es `django.<ref>`, `backend/README.md:536`), pero la clave existe en el entorno del mismo proceso: un RCE o una lectura del entorno en Django daría control total del proyecto de Supabase, con RLS omitida. No hay vía de explotación en esta rebanada; es concentración de privilegio. Alternativa: subir con URL firmada generada por una función mínima, o un rol de almacenamiento dedicado.

### F-13 (info, confirmado)
`backend/pyproject.toml:6` conserva `django>=5.2,<5.3`. El lock está en 5.2.19, que es la versión de seguridad del 2026-11-03, pero una instalación sin lock podría resolver una versión anterior. Subir el límite a `>=5.2.19` (Engram #1091 punto 14).

### F-14 (info, confirmado): superficie muerta de la tienda paralela
`backend/templates/base.html:7` lleva un `<style>` en línea (la CSP lo bloquearía; nadie extiende esa plantilla), y `ventas/tienda/landing.html:11` y `static/tienda/vendor/gsap/gsap.min.js` quedaron sin uso desde T3. `/static/tienda/**` sigue publicado por WhiteNoise. T8 los borra; hasta entonces son superficie sin dueño.

### F-15 (info, confirmado): sin informe de violaciones de CSP
`config/middleware.py:39-51` no define `report-to` ni `Reporting-Endpoints`. La guía de `modern-web-guidance` (id `security`, fase 2) recomienda el reporte para ver regresiones de CSP (por ejemplo un `onerror` en línea nuevo) antes de que las vean los clientes. Se leyó la guía solo por coincidencias de `grep` (ver sección 4).

### F-16 (por validar): `profiles_insert_own` sin `role = 'customer'`
`202604100002_rls_policies.sql:23-26`: `WITH CHECK (auth.uid() = id)` no fija `role` ni `points`. El disparador `protect_profile_system_fields` (`202604100003_functions.sql:53-75`) es solo `BEFORE UPDATE`, y `handle_new_user` (`:8-35`) crea el perfil al alta con rol `customer`. Si existiera un usuario de `auth.users` sin fila en `profiles` (alta fallida, fila borrada a mano), un cliente podría insertar su propio perfil con `role = 'admin'`, y `Profile.is_admin` de Django (`panel/views.py:87`) le daría el panel. Dato que falta: ese estado en la base real (solo lectura, sin acceso en esta sesión). Arreglo: `WITH CHECK (auth.uid() = id AND role = 'customer' AND points = 0)`.

## 2. Revisado y limpio (con evidencia)

| control | resultado | evidencia |
|---|---|---|
| CSP `'self'` en vigor | limpio | `backend/config/middleware.py:35-54`; el middleware es el primero de `MIDDLEWARE` (`settings.py:76`). Cabecera real de `GET /` con el cliente de pruebas: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: <supabase>; font-src 'self'; media-src 'self'; connect-src 'self' <supabase>; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Solo `/admin/` admite estilos en línea (`:38`) |
| Plantilla de la landing sin estilos, scripts ni manejadores en línea ni CDN | limpio | `grep -nE "style=|<script|on[a-z]+=\"|https?://"` sobre `ventas/templates/ventas/index.html`: solo el bloque de datos `application/ld+json` (`:28-45`, no se ejecuta, sin interpolación), `meta og:*`/`canonical` y los enlaces `noopener` a mapa y redes. Todas las etiquetas `<script src>` de las plantillas de la tienda usan `{% static %}` (mismo origen) |
| `|safe`, `mark_safe`, `autoescape off`, `format_html` | limpio | `grep` sobre `backend` y `src`: un solo `mark_safe` en `ventas/templatetags/vite.py:85`, sobre salida de `format_html` y `format_html_join` con URL de `static()` y entrada literal de la plantilla; ningún `|safe` en plantillas |
| JSON-LD con datos de usuario | limpio | `index.html:28-45` es estático |
| `store_image_url` | limpio | `inventory/models.py:90-109` rechaza `javascript:`, `data:`, `//host` y `..`; pruebas `inventory/tests.py:1295`, `:1435-1441`; además `img-src` de la CSP bloquea hosts ajenos |
| CSRF en formularios | limpio salvo F-06/acceso | script de análisis sobre todas las plantillas: 24 formularios `method="post"`, 22 con `csrf_token`; los 2 sin token son `ventas/tienda/acceso.html:45` y `:64`, ocultos hasta que el script los muestra; un POST nativo a `/acceso/` devuelve 403 (prueba con `enforce_csrf_checks`) |
| CSRF en las cuatro rutas públicas de escritura | limpio | `test_public_cart.py:430-440` (`test_csrf_is_enforced_on_every_form`); mi sonda: `POST` sin token a `/carrito/agregar/1/`, `/actualizar/1/`, `/quitar/1/` y `/pedido/` → 403 en las cuatro |
| `csrf_exempt` | limpio, uno por diseño | solo `panel/views.py:64` (entrega de sesión). Compensa con `Origin` en `PANEL_ALLOWED_ORIGINS` (`:75-77`), token de Supabase verificado (firma, expiración, audiencia, emisor) y rol admin en `profiles` (`:87`). Sonda: sin `Origin` → 403, `Origin` ajeno → 403, GET → 405 |
| `fetch` del frontend | limpio salvo F-11 | POST: `acceso.js:141` (a la vista anterior, mismo origen), `chatbot.js:151` (a Supabase, llave publicable), `BuildAdsOrchestrator.tsx:39-48` (F-11). GET: `producto.js:59`, `tienda.js:115` |
| Validación en el servidor | limpio | `forms.py` y `StoreOrderForm` (`carrito.py:64-120`) no tienen campo de precio ni de estado; todo número sale de `quote_cart`; el SQL revalida (`_create_order`, `20261113000002:319-414`). Sin SQL concatenado: `services.py:170-176` usa parámetros |
| Excepción del pedido de invitado (AGENTS.md) | cumple, con F-01 y F-02 | CSRF `test_public_cart.py:430`; tope de 3 por teléfono en SQL `20261117000002:73-80` y su mensaje `carrito.py:43-46`; límite de intentos `carrito.py:242-253`; la página de confirmación solo lee el pedido de la sesión (`carrito.py:306-325`), sin IDOR |
| Redirecciones 301 (`/index.html`, `/products.html`, `/accessweb.html`) | limpio | `ventas/views/comun.py:34-45`: el destino es `reverse()` y la consulta se reescribe con `urlencode()`. Sondas: `/accessweb.html?next=//evil.com` → `/acceso/?next=%2F%2Fevil.com`; `/products.html?q=%0d%0aSet-Cookie:x=1` → consulta codificada, sin inyección; `//evil.com/index.html` → `/` |
| `next` del carrito | limpio | `carrito.py:138-143` (`url_has_allowed_host_and_scheme`); sonda con `https://evil.example/x`, `//evil.example/x`, `/\evil.example` y `javascript:alert(1)` → siempre `/productos/` |
| Cabeceras de seguridad | limpio | respuesta real: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy` sin sensores ni cámara, `Cross-Origin-Resource-Policy: same-origin`, `Cross-Origin-Opener-Policy: same-origin`. Roadmap `best-practices.md:142-144` |
| Cookies, HSTS, depuración (configuración tipo producción, valores sintéticos) | limpio | `DEBUG=False` por defecto (`settings.py:51`); `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` verdaderas; `SESSION_COOKIE_HTTPONLY=True`; `SameSite=Lax`; `SECURE_HSTS_SECONDS=31536000` con subdominios; `SECURE_SSL_REDIRECT=True` detrás de proxy; `ALLOWED_HOSTS` vacío falla cerrado (`settings.py:53-55`); `SECRET_KEY` obligatoria (`:48`). `manage.py check --deploy` → solo `security.W021` (precarga de HSTS), decisión documentada |
| Secretos en el bundle y en `src/**` | limpio | en `backend/static/vite/**`: 0 coincidencias de `service_role`, `sb_secret_`, `sk_live_`, `AKIA…`, claves privadas; 0 tokens con forma de JWT; 0 `sb_publishable_`; 0 archivos `.map`. Los nombres `VITE_SUPABASE_URL/ANON_KEY/KEY` aparecen solo como texto, sin valor (la build no recibió esas variables). Solo variables publicables en `src/**`: `VITE_PANEL_URL`, `VITE_SUPABASE_*`, `VITE_VAPID_PUBLIC_KEY` |
| gitleaks | limpio | `gitleaks git --redact --no-banner .` → "374 commits scanned … no leaks found"; `gitleaks dir backend/static --redact` → "no leaks found". `git ls-files` no lista ningún `.env*`, `.pem` ni `.key`. El README ya no lleva la llave publicable (`git grep sb_publishable_` fuera de pruebas: 0), cerrando #1159 |
| Autorización del panel | limpio | todas las vistas del panel, de inventario, del mostrador y del tablero llevan `@panel_admin_required` (`panel/views.py:259,269,292,299,338,385`; `views_compras.py:344`; `views_descuentos.py:132`; `inventory/views.py:47,86,94,121,204`; `ventas/views/mostrador.py:62-168`; `tablero.py:73,92`). El decorador revalida el rol en la base en cada petición (`panel/access.py:118-140`). Sondas: `/panel/` anónimo → 302 `/panel/acceso/`; `/admin/` anónimo → 302 al login |
| Pedido por UUID | limpio | `urls.py:40` usa `<uuid:pk>`; `roadmap best-practices.md:133` |
| CORS | limpio | `grep -rniE "corsheaders|CORS_ALLOW|Access-Control-Allow" backend`: 0 |
| Pruebas de seguridad de Django | limpio | `manage.py test config.test_security_headers config.test_request_size ventas.tests.test_public_cart ventas.tests.test_landing config.test_deploy --settings=config.settings_test` → **152 pruebas, OK** |
| Canal Supabase y rol de la base | limpio con F-08, F-12, F-16 | costos en `product_costs`, sin acceso para `anon` (`20261113000001:126-150`); inserción y actualización directa de pedidos cerradas (`20261118000001:14-20`); `orders` y `order_items` solo `SELECT` por dueño (los invitados tienen `user_id` NULL: ninguna política anónima los expone); `create_order_web` revocada a PUBLIC, `anon` y `authenticated` (`20261117000002:90-93`); `role` y `points` protegidos por disparador (`202604100003:53-75`); RPC `add_points` (`202604100003:126-132`) y `update_order_status` (versión vigente `20261113000002:629-634`, `is_admin()`) solo para administradores; rol `django` NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT (`20260918235409:20`), privilegios por tabla, `SELECT (id, role)` en `profiles` (`20261007042348:20`), sin BYPASSRLS; en producción `POSTGRES_USER` es `django.<ref>` (`backend/README.md:536`) |
| Registro de eventos | limpio | `settings.py:362-388` registra solo errores y filtra el token de invitación; el registro de acceso de gunicorn va a `/dev/null` (`render.yaml:31`) |

## 3. Diagrama anotado con patrones

Patrones que el código usa de verdad (rama `claude/stack-carney-mvp-244236`, HEAD `0e91976c`); lo demás se rotula como analogía. Referencia: `~/agentic-global/claude/fichas/refactoring-guru.md`, sección "Patrones aplicados a Carni-mvp".

```mermaid
flowchart LR
  B[Navegador] -->|HTTPS| MW
  subgraph MW[Cadena de middleware: Chain of Responsibility  settings.py:73-91]
    direction TB
    M1[SecurityHeaders: CSP, CORP, Permissions-Policy  middleware.py:73] --> M2[SecurityMiddleware: HSTS, redirect] --> M3[WhiteNoise] --> M4[RequestBodyLimit 413  middleware.py:8] --> M5[Session / CSRF / Auth / XFrame]
  end
  MW --> D{{panel_admin_required: Decorator  access.py:118-140}}
  MW --> V[Vistas publicas ventas/views: landing, productos, carrito]
  D --> VP[Vistas del panel]
  V --> G[PostgresGateway: Facade, Singleton  services.py:167, 414-419]
  VP --> G
  V --> C[PublicSlot: Adapter  cart.py:86]
  G -->|parametros, nunca SQL concatenado| DB[(Postgres: rol django, funciones SECURITY DEFINER, RLS)]
  B -->|llave publicable, solo lectura RLS| SB[(Supabase: Auth, REST, Storage)]
  B -->|POST token  csrf_exempt + Origin  panel/views.py:64-97| H[Entrega de sesion]
  V -. fallo abierto F-01 .-> G
  classDef risk stroke:#c0392b,stroke-width:2px;
  class G risk;
```

- Chain of Responsibility (del framework): `backend/config/settings.py:73-91`, `config/middleware.py:8` (corta con 413) y `:73`.
- Decorator: `panel/access.py:118-140`, apilado sobre `require_safe`/`require_POST` en `ventas/views/mostrador.py:62-63` y `tablero.py:73-74`.
- Facade y Singleton: `ventas/services.py:167` (`PostgresGateway`) y `:414-419` (`get_gateway`).
- Adapter: `ventas/cart.py:86` (`PublicSlot`).
- Fail-fast: `settings.py:34-48` (`require_env`) y `ventas/templatetags/vite.py:35,75`.
- Analogía, no patrón: el respaldo de `carrito.py:263-274` recuerda a una cadena de alternativas, pero cambia de garantías al cambiar de función (F-01).
- **Archify**: no se generó el HTML porque la superficie de edición de este teammate es solo este archivo. La skill existe en el árbol (`.claude/skills/archify`); si el lead quiere el HTML, se pide a quien tenga la superficie, con este diagrama como entrada.

## 4. Lo que no se pudo verificar

- **Supabase MCP**: `ToolSearch("supabase get_advisors list_tables list_projects")` → "No matching deferred tools found". Sin `get_advisors` ni `list_tables`, el estado vivo de RLS y de los privilegios no se comprobó; se leyó lo escrito en `supabase/migrations/*.sql`. Tampoco se sabe qué migraciones están aplicadas en cada base (importa para F-01 y F-16).
- **Valores del entorno** (`POSTGRES_USER` real, largo de `SUPABASE_JWT_SECRET`, `STORE_ORIGIN`): no se leyó ningún `.env` (regla). Se evaluó la configuración con valores sintéticos.
- **Despliegue real**: cabecera `X-Forwarded-For` y `Server: gunicorn` detrás de la plataforma (F-04, huella de servidor del roadmap `best-practices.md:145`); no se sondea.
- **Navegador**: las cabeceras y los redireccionamientos se comprobaron con el cliente de pruebas de Django; las violaciones de CSP en ejecución se tomaron de L11 y L12 sin repetirlas.
- **`supply-chain-risk-auditor`**: se cargó la skill, pero su colector hace varias consultas de red por dependencia y se ejecuta con `uv run` (resuelve dependencias del script): choca con "no instalar nada". Se usó `npm audit` en Docker (envía nombres y versiones al registro) y la lectura de `uv.lock`; no hay escaneo de Python con red ni medición de mantenedores. `npm audit` sin `--omit=dev` (Vite y herramientas de build) no se corrió.
- **Reproducibilidad del módulo vendorizado** (F-06): exigiría instalar `esbuild` y `@supabase/supabase-js`.
- **`.mcp.json`** (Engram #1091 punto 13): no existe en el worktree; no se pudo comprobar el pin de `@playwright/mcp`.
- **`mwg`**: la guía `security` (392 líneas) se leyó solo por coincidencias de `grep`, no completa.
- **`security-review`** (comando integrado de Claude Code): un subagente no puede invocarlo. Ver "Needs skill" en el mensaje al lead.
- Fuera de esta rebanada: T4a en el árbol de trabajo, `productos.html` y todo lo que `frontend` y `backend-datos` entreguen después.

## 5. Notas de método

- Sondas ejecutadas con el cliente de pruebas de Django, base SQLite en memoria y datos sintéticos (`ventas.tests.support.make_store`); la sonda vive en el directorio temporal de la sesión, no en el repo. Ninguna escritura a una base real.
- Evidencia de procedencia: scouts de Haiku de esta sesión (roadmap-scout, youtube-scout) citados en el recibo del mensaje final.

## 6. Rebanada 2: T4a de `backend-datos` (sin commitear, árbol sobre HEAD `137304cd`)

Alcance: `git diff -- backend/ventas` (`views/carrito.py`, `views/comun.py`, `views/productos.py`, `catalog.py`, `domain.py`, `context_processors.py`, `tests/test_public_cart.py`), los archivos nuevos `tests/test_contract_carrito.py` y `tests/test_contract_productos.py`, y `docs/datos/contrato-productos.md`. Las líneas son del árbol de trabajo (no hay commit que citar). No se revisó el trabajo de `frontend` que también está en el árbol (`productos.html`, `src/entry/products.tsx`, bundle regenerado): va en su rebanada.
Verificación: `manage.py test ventas.tests.test_contract_carrito ventas.tests.test_contract_productos ventas.tests.test_public_cart ventas.tests.test_sale ventas.tests.test_catalog ventas.tests.test_producto config.test_security_headers --settings=config.settings_test` → **214 pruebas, OK**. Más una sonda propia (cliente de pruebas, SQLite en memoria, `FakeGateway`, datos sintéticos).

| punto | veredicto | evidencia |
|---|---|---|
| a) Modo JSON por `Accept` y CSRF | **limpio, confirmado** | `CsrfViewMiddleware` corre antes de la vista (`settings.py:87`) y no hay `csrf_exempt`. Sonda con `enforce_csrf_checks`: las tres rutas (`agregar`, `actualizar`, `quitar`) sin token → 403 con `Accept: application/json`, `*/*`, `application/json, text/html` y `text/html`, y con cuerpo `application/json` sin token → 403; con token (`X-CSRFToken`) → 200 JSON con `carrito` sin precio; con token válido y `Origin: https://evil.example` → 403. La prueba `test_contract_carrito.py:161-171` cubre solo el caso negativo: conviene agregar el positivo con token y el de `Origin` ajeno (sin bloqueo) |
| b) Límite `CART_WRITES_PER_MINUTE = 60` | **correcto; con dos advertencias de despliegue (F-04, F-17)** | `carrito.py:58` y `_over_the_limit` en `:204`; va antes de la consulta y de la cotización; un 405 no lo gasta (`require_POST` por fuera). Sonda: 429 en la petición 61, con `CHECKOUT_TRUST_FORWARDED_FOR` falso y verdadero; rotar las entradas del cliente en `X-Forwarded-For` **no** lo esquiva (solo cuenta la última). Dos escenarios: (1) con la bandera verdadera y la aplicación alcanzable sin un proxy que agregue su entrada, una sola entrada falsa lo anula por completo (sonda: 0 respuestas 429 en 70 peticiones); es el supuesto que `settings.py:295-303` documenta, y `render.yaml:38` activa la bandera. (2) Sin la bandera detrás de un proxy, `REMOTE_ADDR` es la IP del proxy y todos los visitantes comparten el cupo de 60 por minuto (más el de cotizar 90, buscar 120 y pedido 5 por hora): las escrituras fallan antes por CSRF (`settings.py:298-303`), pero buscar y cotizar se compartirían sin ruido. Con dos saltos de proxy ocurre lo mismo (F-04, por validar). Los contadores están en la caché del proceso, con un solo trabajador (`render.yaml:31`) |
| c) 404 JSON de `cotizar` | **limpio, confirmado** | `productos.py` usa la misma condición que la página pública (`active_products().filter(pk=pk)`): producto inexistente, inactivo o de categoría inactiva dan la misma oración (`domain.py:49`, "Un producto del carrito ya no está disponible."). Sonda: `/productos/99999999/cotizar/` → 404 JSON; `/productos/99999999/` → 404 HTML; no se distingue inactivo de inexistente. El límite se revisa antes de buscar el producto. Distinto asunto: F-19 |
| d) 403 de CSRF en HTML | **no es un problema de seguridad; F-20 de contrato** | Sonda: 403, `text/html`, 1429 bytes, sin razón del fallo (DEBUG falso). Un cliente JSON que llame `response.json()` sin mirar `response.ok` falla con un error de análisis, no con un fallo de seguridad; `docs/datos/contrato-productos.md:21` ya lo documenta. Sugerencia opcional (configuración, fuera de `backend-datos`): `CSRF_FAILURE_VIEW` que responda JSON cuando `Accept` lo pida. Aparte: la cookie `csrftoken` solo se emite en páginas que pintan un token (la ficha de producto la emite; `/` no): una página sin formulario no puede escribir en modo JSON (cierra en 403, sin riesgo) |
| e) Topes de `category` (9 dígitos) y `q` (80) | **limpio, sin evasión; `mostrador.nueva` intacto** | Sonda sobre `/productos/`: `category=1234567890` se ignora; `999999999` se aplica; dígitos unicode ("٣", "１") se normalizan a `3` y `1`; `²`, `-1` y 10 ceros se ignoran sin 500; `q` de 5000 caracteres → 80; `q=%_%_` escapado por el ORM; `page` enorme o negativa → 200; `/buscar/?q=` de 5000 → 200. `test_sale.py` y `test_catalog.py` pasan (214 en total); `mostrador.nueva` comparte `listing()` y la regresión del panel está cubierta |
| `next` en `actualizar` y `quitar` (nuevo) | **limpio, confirmado** | Sonda con `https://evil.example/x`, `//evil.example/x`, `/\evil.example` y `javascript:alert(1)` → siempre `/productos/` o `/carrito/`; `/productos/?page=2` se respeta |
| f) F-01, respaldo a `create_order_staff` | **corregido, falla cerrado; verificado** | `carrito.py` (`_place_order`): ya no llama a `create_order_staff`; `GatewayFunctionMissing` se captura antes que `GatewayUnavailable` (orden correcto), el pedido se rechaza con `domain.UNAVAILABLE_MESSAGE`, el carrito queda intacto y el error del registro nombra la migración `20261117000002_create_order_web.sql` sin datos del cliente. Pruebas `test_public_cart.py` `MissingFunctionTests` (3: rechazo con error nombrando la migración, nunca llama a `create_order_staff` ni con teléfono "-------", y otra función faltante da el mismo rechazo), y las dos que fijaban "se guarda como whatsapp" se reescribieron. Pendiente fuera de su superficie: comprobación de arranque de que existe `create_order_web` (decisión del lead). Residual F-18 |
| F-02, límite de escrituras | **corregido; verificado** | `WriteLimitTests` en `test_contract_carrito.py:305-351` (5 pruebas) pasan; la sonda reproduce 429 en la petición 61 |

### F-17 (baja, confirmado en código y sonda; alcance por validar): los límites por IP se pueden esquivar o vaciar
- `throttle.client_ip` (`throttle.py:13-20`) devuelve la dirección completa. Una sola persona con un bloque IPv6 /64 tiene 2^64 llaves distintas: sonda con 80 direcciones de un /64, 0 respuestas 429 (el límite de 60 por minuto no actúa). Aplica a todos los límites (pedido 5 por hora, carrito 60, cotizar 90, buscar 120). Falta saber si el borde de la plataforma entrega direcciones IPv6 al proceso.
- No hay `CACHES` en `settings.py`: se usa `LocMemCache`, con `MAX_ENTRIES = 300` y `CULL_FREQUENCY = 3` (sonda: `max_entries= 300 cull= 3`). Al pasar de 300 llaves se descarta una tercera parte de las menos recientes. Sonda: un cliente con 58 de 60 escrituras, luego 400 llaves de otras IP, y sus siguientes 10 escrituras no recibieron ningún 429 (el contador se perdió). Cada IP distinta agrega llaves, así que una botnet o un /64 pueden reiniciar los contadores de los demás, incluido el del pedido (5 por hora), que es el control compensatorio de la excepción del pedido de invitado. Un atacante solo con IPv4 no llega a 300 llaves por hora (el pedido se limita a 5 por hora por IP).
- Arreglo: llave por /64 para IPv6 en `client_ip`; `CACHES` con `MAX_ENTRIES` mayor, o una caché compartida si hay más de un trabajador (`config/settings.py`: superficie del lead). Impacto acotado: pedidos pendientes de spam (no reservan stock) y nada más.

### F-18 (info, confirmado): teléfono "-------" pasa el formulario
`forms.py:59-61` (`^\+?[0-9 ()\-]{7,20}$`) acepta siete guiones. Con F-01 corregido, solo `create_order_web` lo rechaza (`invalid_customer_phone`, `20261117000002:66-68`), así que cuesta una llamada RPC y un mensaje del SQL. Arreglo: exigir al menos 7 dígitos en el formulario (defensa en profundidad y una consulta menos).

### F-19 (baja, confirmado): la cotización pública revela el stock
- `productos.py` (`cotizar`) devuelve ahora `avisos`, que incluye "Poco stock: puede que no alcance." La advertencia `low_stock` sale cuando la cantidad pedida supera el stock de un producto con seguimiento (`20261113000002:205-209`). Con 90 cotizaciones por minuto, un anónimo hace una búsqueda binaria de la existencia exacta de cada producto con pocas peticiones. El contrato dice que la cifra no se imprime (`contrato-productos.md:72`).
- No es nuevo del todo: la página del carrito ya pinta `row.warnings` (`carrito.py`, `_cart_context`), así que añadir una línea y mirar el carrito da el mismo dato, más lento. La ruta nueva lo hace barato.
- Decisión de producto: o se acepta ("poco stock" es un dato para el cliente) o se quita `low_stock` de `avisos` de la ruta pública, o el SQL avisa con un umbral fijo y no con la cantidad pedida.

### F-20 (info, confirmado): contrato de CSRF para los clientes JSON
La cookie `csrftoken` solo se emite en respuestas que pintan un token. La ficha de producto lo hace; `/` no (`Set-Cookie: None` en la sonda de la rebanada 1), así que un cajón con borrado desde la landing no puede escribir en modo JSON hasta que la página incluya un token (`{% csrf_token %}` en un formulario, o `ensure_csrf_cookie`). Cierra en 403, sin riesgo; hay que avisarlo en el contrato y probarlo en T4b/T6.

### Veredicto para `main`
El corte de T4a **se puede commitear**: no hay bloqueante. El modo JSON no cambia la regla de CSRF, el límite de escrituras funciona, F-01 y F-02 quedan corregidos y probados, y los topes de `category` y `q` no tienen evasión. No bloquean pero conviene atenderlos en la misma pasada o en la siguiente: una prueba del caso positivo de CSRF en JSON y del `Origin` ajeno, el teléfono con 7 dígitos en el formulario (F-18), la decisión sobre `low_stock` en la cotización pública (F-19) y, de la superficie del lead, la caché y el IPv6 de los límites (F-17) y los saltos de proxy (F-04).

### Seguimiento: correcciones de `backend-datos` verificadas (mismo árbol, sin commit)
- **F-18 cerrado.** `forms.py` agrega `store_phone_validator` (7 dígitos ASCII, `STORE_PHONE_MIN_DIGITS`), solo para el pedido de invitado; el mostrador conserva su regla. `CheckoutPhoneTests` (`test_contract_carrito.py:352`) comprueba que "-------" y "(((((((" no llegan al gateway.
- **F-17, parte IPv6, cerrada.** `throttle._key_of` cuenta IPv6 por /64, IPv4 en IPv6 como IPv4 y deja intacto lo que no es dirección; se aplica a `REMOTE_ADDR` y a la última entrada de `X-Forwarded-For`. Mi sonda repetida: 80 escrituras desde 80 direcciones de un /64 ahora dan **20 respuestas 429** (antes 0). Quedan abiertas la parte de la caché `LocMemCache` de 300 entradas (`config/settings.py`, del lead) y la comprobación de si el borde de la plataforma entrega IPv6.
- **F-20 cerrado.** Contrato actualizado y 3 pruebas: la cookie `csrftoken` y el campo oculto salen en el catálogo y en la ficha con el carrito vacío (`test_contract_carrito.py:324`), un POST JSON con el token de la cookie en la cabecera da 200 (`:331`) y el mismo token desde un `Origin` ajeno da 403 (`:345`). Era la brecha de pruebas que señalé.
- **F-19 sigue abierto como decisión.** `backend-datos` recomienda aceptarlo porque comercio-v1 pide mostrar "quedan N piezas". Si se acepta, la cifra es pública por diseño y `contrato-productos.md:72` ("no imprimas la cifra") queda en contradicción: hay que alinear uno de los dos.
- Verificación: `manage.py test ventas.tests.test_contract_throttle ventas.tests.test_contract_carrito ventas.tests.test_contract_productos ventas.tests.test_public_cart ventas.tests.test_sale ventas.tests.test_catalog ventas.tests.test_producto config.test_security_headers --settings=config.settings_test` → **228 pruebas, OK**.
- Pendiente para la siguiente rebanada, a pedido de `backend-datos`: las páginas `catalogo` y `producto` ya pintan `ventas/productos.html` de `frontend`; se auditan con CSP, `data-csrf`, el `next` de los formularios del cajón (`#bolsa`) y el escapado de nombres y notas (F-07 incluido).

## 7. Rebanada 3: T4b rebanada 1, commits `567aac5c` y `49a602dd` (2026-11-23, HEAD `a9267f0a`)

Auditor: teammate `auditor`. Specs cubiertas: S2, S6, S7, S11 y S12 (estas dos solo como criterio de entrada para T9 y T10, sin código que revisar todavía). Se audita **HEAD** (árbol de trabajo igual a HEAD para el código; solo `.atl/skill-registry.md` y archivos sin seguimiento ajenos). Las líneas son de HEAD. Las sondas viven en el directorio temporal de la sesión, no en el repo; datos sintéticos, SQLite en memoria, ninguna base real.

### Veredicto por commit
| commit | veredicto | motivo |
|---|---|---|
| `567aac5c` (plantilla `productos.html`, parciales, isla) | **se puede commitear** (ya está commiteado; sin hallazgo bloqueante) | Sin `<script>` en línea, sin `style=`, sin manejadores `on*=`, sin CDN y sin `\|safe` (`grep` sobre `productos.html` y `parciales/*.html`: solo `<a href="https://…">` de redes del negocio, que la CSP no restringe). El único `<script>` es `type="module" src="/static/vite/assets/products-V8_vDlyd.js"`. Los bundles nuevos no contienen `sb_publishable_`, `service_role`, `sb_secret_`, `sk_live_`, `sk_test_`, `AKIA…` ni `-----BEGIN` (`grep -rlE` sobre `backend/static/vite`: sin archivos). |
| `49a602dd` (rutas, F-17, F-18, F-20) | **se puede commitear** (ya está commiteado; sin hallazgo bloqueante) | F-17 (/64 de IPv6), F-18 (7 dígitos) y F-20 (cookie CSRF en todas las páginas de productos) verificados cerrados con prueba. Los hallazgos nuevos F-21 y F-22 son anteriores a estos commits (`eea1d2a0`, `97419f5c`) y ninguno es explotable sin un token válido o sin salir en un 500 sin datos. |

### Hallazgos nuevos
| id | severidad | estado | archivo:línea (HEAD) | dueño | resumen |
|---|---|---|---|---|---|
| F-21 | baja | confirmado con sonda | `backend/ventas/views/carrito.py:144-149`, `:199` | backend-datos | `next=productos` (ruta relativa sin `/` ni `.`) pasa `url_has_allowed_host_and_scheme` y `redirect()` lo trata como nombre de URL: `NoReverseMatch`, 500 |
| F-22 | baja | confirmado en el controlador; no reproducido contra una base | `backend/ventas/views/comun.py:22`, `backend/ventas/catalog.py:63`, `backend/ventas/views/productos.py:141-146` | backend-datos | `q` con el byte NUL (`?q=%00`) llega a `icontains`; psycopg lo rechaza y la página responde 500 |
| F-23 | info | confirmado | `backend/ventas/templates/ventas/parciales/_bolsa.html:11-12`, `src/products/configurador.ts:111-115` | frontend | El comentario dice que los scripts envían el token en `X-CSRFToken`; ningún script lee `[data-csrf]`. Hoy solo sirve para que Django emita la cookie |
| F-24 | baja | confirmado | `backend/ventas/tests/test_catalog.py:49`, `:107-111`; `test_products_page.py:51`, `:169`, `:468-469` | backend-datos | `test_the_cost_never_shows_up` es débil: no ejerce el costo real y su regex puede dar falsos positivos |
| F-25 | info | confirmado | `docs/PENDIENTES.md` (P-47), Engram #3360, `odd/tasks/rediseno-moderno.md` L17 | lead | Evidencia vieja en P-47 y huecos del recibo de recursos de estos commits |

### F-21 (baja, confirmado): `next` relativo sin barra rompe el redirect
- `_safe_next` (`carrito.py:144-149`) acepta lo que `url_has_allowed_host_and_scheme` acepta, y una ruta como `productos` no tiene esquema ni host. `_answer` hace `redirect(target)` (`:199`); `redirect` intenta `reverse("productos")` primero, y como el texto no tiene `/` ni `.` lanza `NoReverseMatch`.
- Sonda (cliente de pruebas, `agregar` y `quitar`): `next='productos'` → `NoReverseMatch` (500 con `DEBUG` falso). Los demás valores salen bien: `'ventas:catalogo'` → `/productos/` (el esquema `ventas` lo rechaza), `'https://evil.example/x'`, `'//evil.example'`, `'/\\evil.example'` y `''` → `/productos/`; `'x.y'` → `Location: x.y` (relativo al mismo origen, sin salto a otro sitio).
- Alcance: exige un token CSRF válido, así que lo provoca el propio visitante; no hay redirección abierta ni fuga. Es robustez (OWASP A10:2025, manejo de condiciones excepcionales) y ruido de errores 500 en el registro.
- Arreglo: aceptar solo destinos que empiecen con `/` y no con `//` (`target.startswith("/") and not target.startswith("//")` además de la comprobación actual), y una prueba en `NextAfterWriteTests` (`test_contract_carrito.py:257`) con `next="productos"`.

### F-22 (baja, confirmado en el controlador): byte NUL en la búsqueda
- `listing` recorta `q` a 80 caracteres pero no quita `\x00` (`comun.py:22`); `filtered` lo usa en `icontains` (`catalog.py:63`) y `buscar` hace lo mismo (`productos.py:141-146`). Django 5.2.19 con psycopg 3.3.5 enlaza los parámetros del lado del cliente: `Transformer().as_literal("a\x00b")` → `DataError: PostgreSQL text fields cannot contain NUL (0x00) bytes`, que Django traduce a `django.db.utils.DataError` sin captura: `GET /productos/?q=%00` y `GET /productos/buscar/?q=%00%00` darían 500 en Postgres.
- La base de pruebas es SQLite y acepta el NUL (sonda: 200 y 200), así que ninguna prueba actual lo detecta; por eso es "confirmado en el controlador" y no "confirmado". `mostrador.nueva` del panel comparte `listing()`. Los formularios (`CartLineForm`, `StoreOrderForm`) no tienen el problema: `CharField` de Django rechaza NUL.
- Arreglo: `query.replace("\x00", "")` dentro de `listing` y de `buscar`, y una prueba que simule `filtered` (con `mock`) y compruebe que nunca recibe NUL, porque SQLite no fallará.

### F-23 (info): el token `data-csrf` no lo usa ningún script
`_bolsa.html:11-12` dice "The token the scripts send in X-CSRFToken". `grep -rn "data-csrf" src js backend/ventas` solo encuentra la plantilla y `test_products_page.py:372`. La isla no hace ninguna escritura por `fetch`: el único `fetch` es un GET (`configurador.ts:111`, `Accept: application/json`, cotización sin efectos, `@never_cache`, `@require_safe`, límite de 90 por minuto en `productos.py:90-101`). El input sirve hoy para que Django emita la cookie (F-20, probado en `test_contract_carrito.py:397`). Cuando el cajón escriba por JSON (T6), tendrá que leerlo y enviar `X-CSRFToken`, y tratar el 403 de CSRF, que es HTML (`response.json()` se llama antes de mirar `ok`, `configurador.ts:115`; hoy cae en el `catch` y muestra "no pudimos calcularlo"). Dueño: `frontend`, al escribir el cajón; mientras tanto, corregir el comentario para que no afirme algo que no existe.

### F-24 (baja, confirmado): `test_the_cost_never_shows_up` no protege el costo real
1. El costo privado vive en `product_costs` (`inventory/models.py:517-545`, `related_name="cost"`), pero el ejemplo lo pone en `Product.metadata` (`test_catalog.py:49`, `test_products_page.py:51`). Ninguna prueba de `backend/ventas` crea un `ProductCost` (`grep -rn ProductCost backend` → solo `panel/` e `inventory/`). Si alguien escribe `{{ producto.cost.cost_per_kg }}` en una plantilla, el ejemplo no tiene fila y el campo sale vacío: la prueba pasa.
2. `re.search(r"cost", html, re.I)` (`test_catalog.py:111`) es una trampa de falsos positivos: "Costilla" y "costal" contienen "cost", y una carnicería vende costilla. La primera vez que el catálogo tenga una "Costilla de res" la prueba fallará sin que haya fuga alguna, y quien la repare la debilitará.
3. Solo cubre el HTML del catálogo; la ficha (`test_products_page.py:468-469`, con el mismo ejemplo) y no el cajón, `cotizar` ni `buscar`.
- Comportamiento real (sonda con una fila `ProductCost` de 777.7777 por kilo y 888.8888 por pieza sobre un producto visible): ni catálogo, ni ficha, ni `cotizar`, ni `buscar` contienen "777.7", "888.8" ni la palabra "cost". El código está bien; la prueba es la débil.
- Prueba propuesta (para `backend-datos`): crear la fila `ProductCost` con valores distintivos y el mismo valor en `metadata`; pedir catálogo, ficha, cajón (con el producto en el carrito), `cotizar` y `buscar`; comprobar que no aparecen los números (con `777.78` y `777,78`) ni las claves `cost_per_kg`, `cost_per_piece`, `yield_pct`, `costo`; y agregar un producto "Costilla de res" para fijar que el nombre no dispara la prueba.

### F-25 (info): documentación y recibo de recursos
- `docs/PENDIENTES.md` P-47 cita `throttle.py:13-20`; en HEAD `client_ip` está en `throttle.py:33-40` (el recorte de IPv6 movió las líneas).
- El recibo de los 7 ítems de estos commits está en Engram #3359 y #3360 (topic `carni-mvp/resource-receipts/2026-11-23-t4-cierre`), no en el Log de `odd/tasks/rediseno-moderno.md` (L17 solo lo resume). Los commits son anteriores al candado de L18, así que no se rechaza; desde L18 la tabla va en el Log.
- Ítem 2 (REA): el recibo dice "BLOQUEADO" sin el texto exacto del error (el aviso de sesión solo dice "configured but failed to connect"). Por L14 es un bloqueo y no un "parcial", pero L18 dice que `mcp__rea__*` figura disponible: hay que intentar la conexión y pegar el error literal.
- Ítem 4 (patrones y diagramas): el recibo dice que el Archify HTML de T4 "queda pendiente"; la skill existe en `.claude/skills/archify` y `docs/diagramas/` no tiene el diagrama de T4. Con el candado de L18 ese ítem está **parcial** (hay Mermaid en `contrato-productos.md` §10 y en la sección 3 de este informe) y necesita el HTML o el OK explícito de Eduardo.

### Lo que sigue abierto (estado en HEAD)
| id | estado | evidencia | qué falta |
|---|---|---|---|
| F-04 / P-47 | abierto, por validar; el código no cambió | `throttle.py:33-40` toma la última entrada de `X-Forwarded-For`; `render.yaml:38` activa `DJANGO_BEHIND_PROXY`; `settings.py:341-342` | El dato de cuántos saltos agrega Render, que Eduardo confirma. **Debe cerrarse antes de T9**: el límite de pedidos (5 por hora) y el de escrituras se comparten entre todos si hay un salto más, y el pago y su webhook no pueden depender de un contador por IP |
| F-08 / P-44 | abierto | `supabase/migrations/20260911_chat_messages.sql:50-52` (`WITH CHECK (true)`); el chat ahora también carga en `/productos/` (`server-products.ts:19`) y en la landing (`server-store.tsx:129`) | Migración con topes de largo (solo escrita para revisión) o escritura por Django. Hoy el bundle no lleva `VITE_SUPABASE_*` (0 coincidencias de `sb_publishable_`), así que el widget no persiste en esa build; el riesgo es la API REST directa. El render del chat usa `textContent` (`chatbot.js:179`, `:221`): sin XSS |
| F-07 | **cerrado para `/productos/`** | `src/entry/products.tsx:25-29` y `server-products.ts:15-26` no importan `js/modules/core/cart.js`; `innerHTML` en los tres chunks de productos: 0 coincidencias; el carrito es el de la sesión de Django | El código heredado (`cart.js:228-262`) sigue en el repo y en `legacy-products` solo para el servidor de Vite; no se ejecuta desde Django |
| F-17 | cerrado en dos partes | `throttle.py:15-30` (/64), `settings.py:355-361` (`MAX_ENTRIES` 10 000), `config/test_cache.py`, `test_contract_throttle.py` | Sigue siendo una caché por proceso con un trabajador (`render.yaml:31`); con más trabajadores hace falta una caché compartida. Para vaciar 10 000 llaves hacen falta unas 10 000 IP: impráctico |
| F-18 | cerrado | `forms.py` `store_phone_validator`; `test_contract_carrito.py:425-468` | — |
| F-20 | cerrado | `_bolsa.html:12` pinta el token en toda página de productos, carrito vacío incluido; `test_contract_carrito.py:397` | La landing (`/`) no emite la cookie: bien mientras no escriba por JSON (F-23) |
| P-43 | abierto | sonda A: `GET /productos/` y la ficha emiten solo `csrftoken`, no `sessionid` | `clearsessions`; las páginas de lectura no crean sesiones, las escrituras sí |
| P-45, P-46, P-48 | sin cambio | `git diff --stat 4f1e0c86~3..HEAD -- backend/config supabase package.json package-lock.json backend/pyproject.toml backend/uv.lock .npmrc` → vacío | Los commits no tocan configuración, migraciones ni dependencias; los plazos de ASVS 15.1.1 de P-45 siguen vencidos |

### Controles revisados y limpios (rebanada 3)
| control | resultado | evidencia |
|---|---|---|
| CSP `'self'` en las dos páginas | limpio | sonda A: cabecera de `GET /productos/` y de la ficha idéntica a la de la sección 2 (`config/middleware.py:35-54`); sin `unsafe-inline` fuera de `/admin/` |
| Escapado de nombres, descripción, categoría, nota y `q` | limpio | sonda B: nombre y descripción con `<img src=x onerror=alert(1)>"'><script>alert(2)</script>`, categoría y nota igual, `q` igual: 0 fragmentos crudos en el catálogo y en la ficha; `meta description` y `value=""` escapados por el autoescape |
| Cajón (`_bolsa.html`) | limpio | `next` es `request.get_full_path` más `#bolsa` y la vista lo revalida (`carrito.py:144-149`); el borrado es un POST con `{% csrf_token %}` (`_bolsa.html:35`); sin precios |
| Paginación (`_catalogo.html:43,45`) | limpio | `q` con `urlencode`, `category` solo dígitos (`catalog.py:56-66`, tope de 9) |
| Validación en el servidor del cotizador y del carrito | limpio | `CartLineForm` (`forms.py:19-26`): `amount` 10 dígitos y 3 decimales, `thickness_in` 4 y 2, `note` 200, `mode` y `unit` por lista; sin campo de precio; `StoreOrderForm` (`carrito.py:70-112`) con largos; el precio sale de `quote_cart`; `cotizar` es `require_safe`, `never_cache`, 404 en JSON idéntico para inactivo e inexistente |
| CSRF en todo `fetch` | limpio | un solo `fetch` hacia Django (`configurador.ts:111`, GET); el POST de `chatbot.js:151` va a Supabase con la llave publicable y sin cookie de sesión, así que CSRF no aplica (su riesgo es F-08). Escrituras de Django: `agregar`, `actualizar`, `quitar` y `pedido` bajo `CsrfViewMiddleware` sin `csrf_exempt`; 403 sin token en modo JSON (`test_contract_carrito.py:164`) |
| Caso positivo de CSRF en JSON con `Origin` ajeno | **ya existe** (el pendiente de L16 y L17 está cumplido) | `test_contract_carrito.py:404` (token de la cookie en `X-CSRFToken` → 200) y `:412` (mismo token con `Origin: https://evil.example` → 403, carrito vacío), dentro de `CsrfForScriptsTests` (`:381`) |
| Límites por IP | limpio | sonda E: 95 `cotizar` de un cliente → 90 con 200 y 5 con 429, el primero en la 91; `test_contract_carrito.py:469-526` (`WriteLimitTests`) |
| Costo privado | limpio en comportamiento; prueba débil (F-24) | sonda C |
| Métodos y producto inexistente | limpio | sonda G: `POST /productos/` → 405; ficha de un producto que no existe → 404 |

### Diagrama anotado con patrones (rebanada 3)
Patrones que el código usa de verdad en HEAD; lo demás es analogía. Referencia: `~/agentic-global/claude/fichas/refactoring-guru.md`, sección "Patrones aplicados a Carni-mvp".
```mermaid
flowchart LR
  B[Navegador: /productos/ y ficha] -->|GET| V[productos.catalogo y producto: require_safe]
  V --> L[listing / filtered: query sin NUL pendiente F-22]
  V --> T[productos.html: Template Method con parciales]
  T --> I[Isla: products.tsx -> server-products.ts: Facade y Strangler]
  I -->|GET JSON Accept| Q[cotizar: never_cache, limite 90/min]
  B -->|POST + CSRF| W[carrito.agregar/actualizar/quitar: limite 60/min]
  W --> N[_safe_next: F-21]
  Q --> G[PostgresGateway: Facade, Singleton  services.py:167]
  W --> G
  G --> DB[(Postgres: rol django, RLS)]
  I -->|POST llave publicable| SB[(Supabase chat_messages: F-08)]
```
- Template Method (de Django): `productos.html` con `{% include %}` de `parciales/` (`productos.html:39-64`).
- Facade: `src/products/server-products.ts:15-26` (una función que monta cuatro comportamientos) y `ventas/services.py:167` (`PostgresGateway`).
- Strangler (en sentido amplio): `src/entry/products.tsx:25-29` ramifica por `data-server-store` y deja la isla heredada en su propio chunk.
- Decorator: `@require_safe`, `@never_cache`, `@cache_control` apilados en `productos.py:42,88-89,131-132`.
- Analogía, no patrón: `_safe_next` recuerda a una lista blanca (Guard), pero no es una clase ni un objeto.
- **Archify**: la skill existe en `.claude/skills/archify`; no se generó el HTML por la superficie de escritura de este teammate (solo este archivo). Lo debe generar quien tenga la superficie, con este Mermaid como entrada (ver F-25, ítem 4).

### Lo que no se verificó en esta rebanada
- Navegador real: la CSP en ejecución, el LCP y el CLS se toman del recibo #3360 (Brave a 375, 768 y 1440 px, 0 violaciones); no se repitieron.
- Base de datos viva: F-22 contra Postgres, el estado de RLS y la migración `20261117000002` (el MCP de Supabase dio timeout en el recibo #3360). Ninguna escritura a una base real.
- Despliegue real: `X-Forwarded-For` de Render (F-04); no se sondea.
- `supply-chain-risk-auditor`: se cargó, pero los commits no tocan `package.json`, `package-lock.json`, `pyproject.toml`, `uv.lock` ni `.npmrc` (diff vacío), así que no hay dependencia nueva que medir.
- `security-review` (comando integrado de Claude Code): un subagente no puede invocarlo; queda para el lead (ver "Needs skill" en el mensaje).

### Pruebas y escaneos de esta rebanada
- `dj.sh ventas.tests.test_products_page ventas.tests.test_contract_carrito ventas.tests.test_contract_productos ventas.tests.test_contract_throttle ventas.tests.test_public_cart ventas.tests.test_catalog ventas.tests.test_producto ventas.tests.test_header ventas.tests.test_styles config.test_security_headers config.test_cache config.test_request_size` → **261 pruebas, OK** (2.9 s).
- Sondas propias (`probe_t4b.py`, fuera del repo): 8 sondas A a G; dos hallazgos (D, F).
- `gitleaks git --redact --no-banner --log-opts="4f1e0c86~3..HEAD"` (gitleaks 8.30.1) → "4 commits scanned … no leaks found".

## 8. Seguimiento de la rebanada 3: `unsafe-inline` en la CSP (2026-11-23)

Origen: aviso del lead, que cita la guía de Todo de IA `protege-tu-app` ("el CSP de Carni permite `unsafe-inline`"). Se verificó contra el código y contra la cabecera real. La guía no se tomó como prueba.

| id | severidad | estado | archivo:línea (HEAD) | dueño | resumen |
|---|---|---|---|---|---|
| F-26 | baja | confirmado; **la afirmación de la guía es parcialmente falsa** | `backend/config/middleware.py:38`, `backend/config/test_security_headers.py:90-95` | main (config del lead) | `'unsafe-inline'` existe solo en `style-src` y solo para rutas bajo `/admin/`. `script-src` es `'self'` en todas partes: ni `unsafe-inline` ni `unsafe-eval` |

### F-26 (baja, confirmado): la excepción de estilos en línea de `/admin/`
- Código: `middleware.py:38` pone `'self' 'unsafe-inline'` en `style-src` solo si `path.startswith(reverse("admin:index"))`; `:41` fija `script-src 'self'` sin condición. `grep -rn "unsafe-inline\|unsafe-eval"` sobre `backend` (sin `static/vite`) → solo `middleware.py:38` y las pruebas. La prueba `test_the_admin_keeps_its_inline_styles_and_nothing_more` (`test_security_headers.py:90-95`) fija ambos valores.
- Cabecera real (cliente de pruebas, ajustes sintéticos), `style-src` y `script-src` por ruta: `/`, `/productos/`, `/acceso/`, `/carrito/`, `/panel/` y `/panel/acceso/` → `'self'` y `'self'`; `/admin/` y `/admin/login/` → `'self' 'unsafe-inline'` y `'self'`; `/Admin/login/` (404) y cualquier otra ruta → `'self'`. Ninguna respuesta lleva `unsafe-eval`. Ninguna vista fija su propia CSP (`grep` de `Content-Security-Policy`: solo el middleware y pruebas).
- Plantillas: las únicas marcas en línea que quedan son el `<style>` de `backend/templates/base.html:7`, que nadie extiende (F-14); `ventas/templates` y `panel/templates` no tienen `<script>` en línea, `style=` ni manejadores.
- Impacto: los estilos en línea permiten inyección de CSS (lectura de atributos con selectores, redibujado de la interfaz) solo si hubiera una inyección de HTML dentro del admin, que Django autoescapa; no habilitan ejecución de scripts. Se alcanza únicamente en `/admin/`, que hoy es público y sin bloqueo por intentos (F-09). Por eso baja.
- Arreglo propuesto (decisión del lead): el de F-09 (apagar `/admin/` en producción con una variable de entorno) elimina la excepción entera; después se borra la rama de `middleware.py:38` y se cambia la prueba `:90-95` para exigir `style-src 'self'` en todas las rutas. Mientras tanto, la excepción está documentada en el docstring (`middleware.py:76-79`).
- Nota de riesgo futuro: el middleware usa `setdefault` (`middleware.py:91`), así que una vista que fije su propia CSP la reemplaza sin aviso. Hoy ninguna lo hace.
- Nota para T9, **por validar en navegador**: `form-action 'self'` (`middleware.py:50`) puede bloquear, en Chromium, el redirect de un formulario POST hacia `checkout.stripe.com`. Dos caminos que no aflojan `script-src`: arrancar Stripe Checkout por una petición JSON y navegar con `window.location` (la navegación no la restringe `form-action`), o agregar el host de Checkout a `form-action`. No se debe agregar `js.stripe.com` a `script-src` si se usa Checkout alojado.

### Handoff de recursos recibido (ítems 5 y 7 del recibo)
- roadmap.sh: `cyber-security` (OWASP Top 10, CSRF, hashing) y `api-design` (API Security, Idempotency); checklist de `best-practices.md:91-160`. Contraste con el código: límites por IP `throttle.py:33-55`; `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` en la respuesta real (sección 2 y `test_security_headers.py:105`); `DEBUG` apagado por defecto (`settings.py:51`); registro sin datos del cliente (`carrito.py:338-342`, `settings.py:362-388`); bloqueo de reintentos del inicio de sesión: sin él en `/admin/login/` (F-09), el acceso de clientes es de Supabase Auth. Idempotencia: sin superficie todavía; es requisito del webhook de T9. Referencia: https://docs.djangoproject.com/en/6.0/ref/csrf/ (el repo usa Django 5.2.19; la regla de `Origin` y del token es la misma) y https://owasp.org/www-project-top-ten/.
- Videos: https://youtu.be/3spCFnMSGIY?t=7880 (auditar el login que genera la IA) y https://youtu.be/0DhghJpWwVQ?t=646 (probar primero auth, tokens y conexiones). Se citan por el handoff del scout; el auditor no abrió los videos.
