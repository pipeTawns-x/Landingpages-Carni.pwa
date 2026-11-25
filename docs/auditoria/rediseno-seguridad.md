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
- Videos: https://youtu.be/3spCFnMSGIY?t=7880 (un login generado por IA que sale con `admin` y una contraseña por defecto; el minuto de la auditoría como agente aparte es 2:03:36, https://youtu.be/3spCFnMSGIY?t=7416, verificado con `transcript`) y https://youtu.be/0DhghJpWwVQ?t=646 (probar primero auth, tokens y conexiones). Se citan por el handoff del scout; el auditor no abrió los videos.

## 9. Rebanada 4: T7a primera mitad, precios estándar y envío por zonas (2026-11-23, sin commitear, sobre HEAD `b096521d`)

Auditor: teammate `auditor`. Specs: S13 (y, como criterio de entrada, S11 y S12). Riesgo declarado: ítem 1 (migración, solo tablas nuevas, no aplicada) e ítem 2 (RLS y GRANT).
Alcance (todo sin commitear): `supabase/migrations/20261124000001_precios_estandar_y_envio.sql`, `backend/inventory/pricing.py`, `backend/ventas/shipping.py`, `backend/ventas/models.py` (espejos `ProductSize` y `DeliveryZone`, `managed = False`), `backend/panel/views_compras.py` (`piece_price` se importa ahora de `inventory.pricing`), `docs/contratos/precios-y-envio.md` y las pruebas nuevas. Las líneas son del árbol de trabajo.
**No se corrió ninguna prueba de RLS contra una base**: el `postgres` local no arranca (`postgres --version` → `dyld: Library not loaded: libicui18n.73.dylib`, falta ICU para `postgresql@14`) y no hay imagen de Postgres en Docker. Lo que sigue de las políticas es lectura de la migración contra el precedente, no ejecución.

### Veredicto
- **Migración: se puede commitear, en commit aparte y primero** (Riesgo 1 y 2: según el flujo ODD, una unidad con un ítem de alto riesgo lleva su propio commit para que la revisión nativa la tome sola), **con una condición**: corregir la afirmación "probado" de F-27 antes del commit. Mientras no esté aplicada en ninguna base, editar el SQL no cuesta nada; después costaría una migración nueva, así que conviene meter también F-28 y F-31 en el mismo commit.
- **Código Python, espejos, documento y pruebas: se pueden commitear** en un segundo commit, sin bloqueo. F-29 y F-30 son de baja gravedad y se arreglan con una prueba en rojo antes; pueden entrar antes de T9 y no hace falta frenar el commit.
- Ninguna ruta lee todavía estas tablas ni llama a `close_price`: lo único que ejecuta el sitio hoy es `piece_price` (misma fórmula que antes: peso por precio por kilo, al centavo, mitad hacia arriba; `views_compras.py:21`, y `panel.test_compras` pasa).

### Hallazgos nuevos
| id | severidad | estado | archivo:línea | dueño | resumen |
|---|---|---|---|---|---|
| F-27 | baja (condición del commit) | confirmado | `supabase/migrations/20261124000001_precios_estandar_y_envio.sql:30-31`, `docs/contratos/precios-y-envio.md:162` | backend-datos | La migración dice "probado como dueño, como otro usuario y como anon"; el contrato dice "escritas, no corridas". Es una afirmación de verificación que no es cierta |
| F-28 | baja | confirmado por comparación con el precedente; sin base para ejecutarlo | `migración:61-64`, `:99-102`; precedente `20261113000001_comercio_v1_esquema.sql:366-369` y `20261119000003_lote_al_confirmar.sql:31` | backend-datos | Se revoca la tabla pero no la secuencia: `product_sizes_id_seq` y `delivery_zones_id_seq` conservan los privilegios por defecto de `anon` |
| F-29 | baja | confirmado con sonda | `backend/inventory/pricing.py:51-53`, `:177`, `:190` | backend-datos | `\d` acepta dígitos Unicode: `"٥٠٠"` y `"５００"` se aceptan como 500 g, contra el "parseo estricto" del contrato |
| F-30 | baja | confirmado con sonda | `backend/inventory/pricing.py:325`, `:388` | backend-datos | `_close_standard_size` y `size_listing` no comprueban que el tamaño sea del producto: confían en que el llamador pase solo `product.sizes` |
| F-31 | baja | confirmado con sonda en Python; sin reproducir en Postgres | `migración:87-89`, `backend/ventas/shipping.py:40`, `:49`, `:59` | backend-datos | Un `NaN` en `fee`, `from_km` o `to_km` pasa los CHECK de Postgres (en `numeric`, `NaN` es mayor que todo número); `delivery_quote` devuelve `"fee": "NaN"` y un `to_km` `NaN` lanza `InvalidOperation` (500). Además `fee` no tiene tope |
| F-32 | info (requisito de T9) | confirmado con sonda | `backend/inventory/pricing.py:44-49`, `:366`, `:392-401` | backend-datos | Sin tope de total ni de peso por línea de piezas ni mínimo; las advertencias de existencias no bloquean |
| F-33 | info | confirmado por lectura | `migración:65-66`, `:103-104`; `202604100002_rls_policies.sql:83-85` | backend-datos | `anon` lee los tamaños activos de productos desactivados (respuesta a la pregunta del lead: no es sensible) |

### (a) Políticas y GRANT: ninguna política permisiva abre de más
Las dos tablas tienen el mismo molde del precedente `product_promotions` (`20261113000001:397-408`). Combinadas con OR (todas son permisivas):

| rol | SELECT | INSERT, UPDATE, DELETE | por qué |
|---|---|---|---|
| `anon` | solo `is_active` (`migración:65-66`) | sin GRANT (`:62`, `:100` dan solo SELECT) | aplica una sola política; la de administrador es `TO authenticated` y la de `django` es `TO django` |
| `authenticated` sin admin | `is_active OR is_admin()` = solo lo activo | rechazado | las escrituras solo las cubre `*_admin_all` (`:67-69`, `:105-107`), y la política `FOR SELECT` no tiene `WITH CHECK` ni cubre escritura |
| `authenticated` admin | todo | todo (`USING` y `WITH CHECK` con `is_admin()`) | `(SELECT public.is_admin())` se evalúa una vez por consulta; la función es `SECURITY DEFINER` con `search_path = ''` (`202608250001_arreglar_recursion_rls.sql:44-49`) |
| `django` | todo | todo, sin `TRUNCATE` (`:63`, `:101`) | rol aparte, `NOINHERIT` |
| `PUBLIC` | nada | nada | `REVOKE ALL ... FROM PUBLIC, anon, authenticated` en `:61` y `:99`, que además quita `TRUNCATE`, `REFERENCES` y `TRIGGER` (`TRUNCATE` se salta RLS) |

Ninguna suma de políticas da más de lo anotado. Dos precisiones: un `UPDATE` o `DELETE` de un usuario no admin no da error, afecta 0 filas (solo el `INSERT` falla con "viola la política"); y la prueba del contrato solo ejerce el `INSERT` de un no admin (ver abajo).

### (b) El residual de `anon` y los tamaños de productos desactivados
No es sensible. `anon` ve `product_id`, `grams` y `rounding_step` de un tamaño activo cuyo producto está desactivado; el producto en sí no (`products_select_public USING (is_active = true)`, `202604100002:83-85`), y el precio no se guarda (sale de un $/kg que `anon` no puede leer del producto oculto). Lo único que se aprende es que existe un id y unos gramos. Queda como F-33, info: con ids secuenciales sirve de sonda de existencia para un producto que aún no se lanza. Arreglo opcional, una línea: `USING (is_active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id))`; la subconsulta respeta el RLS del que consulta, así que `anon` solo cuenta los productos que ya ve.

### (c) Ningún precio ni total del cliente se acepta; flotantes y booleanos se rechazan
Lista permitida: `_ALLOWED_FIELDS` (`pricing.py:57-61`), más `mode` y `product_id`; lo demás sale con `invalid_items` (`:205-207`). Sonda (Python puro, sin base), todas rechazadas: `total`, `unit_price`, `price_per_kg`, `currency`, `rounding_step`, `discount` en una línea de piezas; `total` en una de dinero; `product_id` como texto `"7"`; `grams` o `amount` como flotante, booleano, `None`, lista, `Decimal`, `"1e3"`, `" 5"`, `"5\n"`, `"-5"`, `"NaN"`, `"Infinity"`; `amount` de 0 o mayor de 1 000 000; tres decimales de más; `size_id` junto con `piece_weight_kg`. `_whole_number` (`:172-182`) y `_decimal_text` (`:185-192`) usan `fullmatch`, así que el salto de línea final no pasa. Únicas fugas: F-29 y F-30. En modo dinero el `amount` del cliente **es** el total por diseño (`pricing.py:280`); está acotado a (0, 1 000 000] y a dos decimales, y el peso se calcula en el servidor.

### (d) `EXCLUDE USING gist` y los CHECK
- La exclusión `numrange(from_km, to_km, '(]') WITH &&` con `WHERE (is_active)` (`migración:90-92`) es correcta: `&&` sobre `numrange` es nativo, no pide `btree_gist`; `(0, 5.5]` y `(5.5, 11]` no se traslapan; reactivar una zona que choca falla. Cubre la condición de carrera que el `clean()` de `ventas/models.py` no puede cubrir solo.
- `product_sizes`: `grams BETWEEN 1 AND 50000`, paso en `{0.01, 0.10, 0.50, 1.00}` (rechaza `NaN`: no es igual a ninguno) y `UNIQUE (product_id, grams)` (`:48-50`). Correctos.
- `delivery_zones`: `from_km >= 0`, `to_km > from_km`, `fee >= 0` (`:87-89`). **Hueco: `NaN` cumple las tres** (F-31).

### (e) El cliente no puede mandar `rounding_step`
Confirmado. `rounding_step` no está en `_ALLOWED_FIELDS`; sonda: línea de piezas con `rounding_step` → `invalid_items`. El paso sale de la fila `ProductSize` (`pricing.py:328`) y `size_price` lo exige en `ROUNDING_STEPS` (`:153`). En la base lo fija el CHECK `:49`.

### F-27 (baja, condición del commit): una frase que dice "probado" y no lo está
`migración:30-31`: "Acceso (RLS activo en las dos; probado como dueño, como otro usuario y como anon: ver docs/contratos/precios-y-envio.md, seccion 'Pruebas de RLS')". El contrato (`:162`) titula esa sección "escritas, no corridas", y esta auditoría tampoco pudo correrlas (arriba). Eduardo lee este archivo para aprobar la migración, y "probado" invita a saltarse la prueba. Arreglo: "escritas para correrse, no corridas" y enlazar la sección; cambiar la frase cuando se corran de verdad.

### F-28 (baja): las secuencias conservan privilegios de `anon`
`migración:61` y `:99` hacen `REVOKE ALL ON TABLE`, pero las secuencias de identidad (`GENERATED BY DEFAULT AS IDENTITY`) se crean con los privilegios por defecto del esquema. El precedente sí las revoca antes de conceder (`20261113000001:366-369`, incluida `product_promotions_id_seq`; `20261119000003:31`). No es alcanzable por la API de PostgREST (no expone secuencias ni `nextval`), así que es defensa en profundidad y coherencia con el precedente. Arreglo: antes de `:64` y `:102`, `REVOKE ALL ON SEQUENCE public.product_sizes_id_seq, public.delivery_zones_id_seq FROM PUBLIC, anon, authenticated;`. No pude comprobar los privilegios por defecto de la base real (sin acceso).

### F-29 (baja): dígitos Unicode en el parseo "estricto"
`_MONEY_TEXT`, `_WEIGHT_TEXT` y `_DIGITS_TEXT` (`pricing.py:51-53`) usan `\d`, que en Python acepta cualquier dígito Unicode. Sonda: `grams="٥٠٠"` (árabe-índico) y `"５００"` (ancho completo) → total 389.50 y 0.500 kg; `amount="٢٠٠.٥٠"` → 200.50; `quantity="５"` → 5 piezas. No cambia el precio (se normalizan bien), pero el contrato promete "dígitos planos" y la función SQL `quote_line` rechazaría el mismo texto: dos capas que parsean distinto. Arreglo: `re.ASCII` o `[0-9]` en los tres patrones, y una prueba con `"٥٠٠"` y `"５００"`.

### F-30 (baja): el tamaño no se ata al producto
`_close_standard_size` (`pricing.py:325`) busca `s.id == size_id and s.is_active` en la lista `sizes` que le da el llamador, y `size_listing` (`:388`) pinta todos los activos de esa lista; ninguno exige `s.product_id == product.id`. Sonda: con `sizes=[propio, de_otro_producto]` y `size_id` del otro, la línea se acepta y cobra 50 g × $779 = $38.95. No hay pérdida (el precio por kilo es el del producto) pero se rompe "ese tamaño no se ofrece". Hoy no hay llamador; T9 debe pasar `product.sizes.filter(is_active=True)`. Arreglo en la función, para no depender del llamador: agregar `and s.product_id == product.id` y una prueba con un tamaño de otro producto.

### F-31 (baja): `NaN` en las zonas de envío
En Postgres `numeric` acepta `NaN` y lo ordena por encima de todo número, así que `CHECK (fee >= 0)`, `CHECK (to_km > from_km)` y `CHECK (from_km >= 0)` lo dejan pasar (por la documentación; no pude reproducirlo sin base). Quién lo escribe es el administrador (política `admin_all`) o `django`, pero un valor así llega a `shipping.py`. Sonda con zonas `NaN`: `delivery_fee` devuelve `NaN` (y `delivery_quote` imprimiría `"fee": "NaN"`); un `to_km` `NaN` lanza `InvalidOperation` en `zone_for_distance` (`shipping.py:40`), es decir un 500 para toda consulta de envío. `order_total` rechaza una cuota `NaN` (`pricing.py:399`), así que no se cobra mal. `fee` no tiene tope (un error de tecleo de $1 000 000). Arreglo en la migración: `CHECK (fee BETWEEN 0 AND 99999.99)` y `CHECK (from_km BETWEEN 0 AND 1000)` y `CHECK (to_km BETWEEN 0 AND 1000)` (un `BETWEEN` rechaza `NaN`); en `shipping.py`, descartar las zonas con valores no finitos. Los espejos de Django que usan SQLite no modelan `NaN`: la prueba de la migración debe ser SQL.

### F-32 (info, requisito de entrada de T9): sin tope de total ni de peso, y las advertencias no bloquean
Sonda con `close_price`: una línea de piezas enteras con 10 000 piezas y 1 en el estante se **acepta** con la advertencia `low_stock` (`pricing.py:366`) por 73 000 kg y $56 867 000.00; 10 000 piezas de 340 g → $2 650 000.00; modo dinero acepta $0.39. El SQL de la tienda tiene los mismos límites por línea (`20261113000002:124`, `:143-144`), así que el espejo es fiel; pero T9 cobra de verdad, y Stripe rechaza importes menores al mínimo de la moneda y mayores a su tope. T9 debe: poner un mínimo y un máximo de total, un tope de peso por línea de piezas (hoy solo existe en modo dinero, `:269-270`), y decidir si `low_stock` bloquea el pago o se reserva existencia.

### F-33 (info): `anon` lee tamaños de productos desactivados
Ver (b). No sensible; cierre opcional con una línea.

### (f) Qué debe poner T9 en la vista que reciba las líneas
1. `@require_POST` y **sin** `csrf_exempt`: la única vista exenta de T9 será el webhook, protegido por la firma. La página que ofrece pagar debe pintar un token (patrón de `_bolsa.html:12`, F-20) y el script debe mandarlo en `X-CSRFToken`; un 403 de CSRF llega en HTML (F-23).
2. Límite de intentos antes de leer la base: `throttle.too_many(request, "pago", N)` más el contador por sesión y por IP de `carrito.py:314-325` y el tope de 3 pedidos pendientes por teléfono. Crear sesiones de Stripe gasta cuota de su API. Cerrar F-04 primero: con un salto más de proxy todos comparten contador.
3. Acotar el arreglo de líneas a `MAX_ORDER_LINES` (50) **antes** de consultar productos, y cargar productos y tamaños en bloque (`in_bulk`), no una consulta por línea. `config.middleware` ya corta cuerpos grandes con 413.
4. Pasar a `close_price` solo `mode`, `product_id` y los campos permitidos del modo; nunca `price_per_kg`, `currency`, `delivery_fee`, `km` ni `total` de la petición. La distancia la mide el servidor (T10) y la cuota sale de `delivery_fee(zonas, km)`.
5. Calcular el total en el servidor, **guardarlo en el pedido antes** de crear la sesión de Checkout, mandar a Stripe el importe en centavos enteros desde ese valor guardado, y en el webhook comparar `amount_total` y moneda con lo guardado, sin confiar en parámetros de retorno; idempotencia por id de evento y por estado del pedido; clave de idempotencia al crear la sesión (id del pedido).
6. Mínimo y máximo de total, tope de peso por línea y política de `low_stock` (F-32).
7. Arrancar Checkout con una petición JSON y navegar con `window.location` (nota de F-26 sobre `form-action 'self'`).
8. Errores genéricos al cliente y registro sin datos personales (`carrito.py:338-342` es el modelo).

### Pruebas de RLS: qué agregar al guion del contrato (para quien las corra)
Las del contrato (`precios-y-envio.md:162-212`) cubren bien `SELECT` de `anon`, `INSERT` de un no admin, el administrador, `django` y los cinco CHECK. Faltan: `UPDATE` y `DELETE` de un `authenticated` no admin (esperado: 0 filas, sin error) y de `anon` (esperado: `permission denied`); `SELECT nextval('public.product_sizes_id_seq')` como `anon` (esperado: `permission denied`, solo tras el arreglo de F-28); `INSERT` con `fee = 'NaN'`, `to_km = 'NaN'` (esperado: violación de CHECK, solo tras F-31); y la lectura de `anon` sobre el tamaño de un producto desactivado (esperado hoy: 1 fila; 0 tras el arreglo opcional de F-33). Para correrlas: `brew reinstall postgresql@14` (arregla el ICU que falta; requiere red, lo ejecuta Eduardo) o una base de pruebas de Supabase local; nunca con datos de clientes.

### Diagrama anotado con patrones (rebanada 4)
```mermaid
flowchart LR
  C[Cliente: linea con mode + campos permitidos] --> S{{T9: POST, CSRF, limite, tope de lineas}}
  S --> A[close_price: Facade sobre tres cierres  pricing.py:232-255]
  A --> G[_check_line_shape: lista permitida, fail-fast  pricing.py:199-210]
  A --> V[ClosedPrice: Value Object inmutable  pricing.py:81-94]
  Z[delivery_fee: busca la zona  shipping.py:46-49] --> T[order_total: suma en el servidor  pricing.py:392-401]
  V --> T
  DB[(product_sizes, delivery_zones: RLS, tres politicas permisivas OR)] -. F-28, F-31, F-33 .-> A
```
- Value Object: `ClosedPrice` (`@dataclass(frozen=True)`, `pricing.py:81-94`) y `PieceVariant` (`:73-78`).
- Fail-fast / guard clauses: `_check_line_shape` y los `raise PricingError` (`pricing.py:199-210`, `:395-400`).
- Facade, en sentido amplio: `close_price` es la única puerta a los tres cierres (`:248-255`).
- Analogía, no patrón: el `if mode == ...` de `close_price` recuerda a Strategy, pero es una cadena de ramas, no objetos intercambiables.
- Archify: `docs/diagramas/t7a-precios-er.html` existe (lo generó el dueño); no lo abrí ni lo validé.

### Pruebas y escaneos de esta rebanada
- `dj.sh inventory.test_pricing ventas.tests.test_shipping ventas.tests.test_contract_precios panel.test_compras` → **128 pruebas, OK** (0.46 s): las 78 nuevas más las 50 de `panel.test_compras`.
- Sonda propia `probe_t7a.py` (fuera del repo; funciones puras, sin base): 45 casos, 3 aceptaciones que no debían (F-29, F-30, F-32), 2 fallos de `NaN` (F-31).
- `gitleaks dir --redact --no-banner` sobre la migración, `backend/inventory`, `backend/ventas` y `docs/contratos` → "no leaks found" en las cuatro. (El árbol no está commiteado, así que `gitleaks git` no aplica; escanear de nuevo con `--staged` antes de cada commit.)
- **No corrido**: RLS contra una base (sin Postgres funcional), el build, Jest y `node --test`.

### Recibo de recursos de esta revisión (7 ítems MANDATORY del kit)
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado; la parte de RLS es lectura, no ejecución | `dj.sh` 128 OK; `probe_t7a.py` 45 casos; `gitleaks dir --redact` en 4 rutas, "no leaks found"; skill `security-and-hardening` (frontera cliente → `close_price`, STRIDE sobre las dos tablas); OWASP A01 (control de acceso por rol), A04 (diseño: el precio sale del servidor) y A05 (CHECK y GRANT); Engram #1159 y #1570 leídos en la rebanada 3. Las pruebas de RLS y de pgTAP no se corrieron (sin Postgres funcional) |
| 2 | REA | no usado | Este agente no tiene herramientas `mcp__rea__*`; no hay objetivo de ingeniería inversa en la rebanada |
| 3 | Diseño y animación | no usado | Revisión de datos y SQL, sin UI |
| 4 | Patrones y diagramas | parcial | Mermaid de esta sección con archivo:línea; el Archify `docs/diagramas/t7a-precios-er.html` existe (del dueño) y no lo abrí ni lo validé |
| 5 | roadmap.sh | usado por referencia | Checklist de API Security `best-practices.md:111` (límites), `:123-139` (entradas y procesamiento) y `:148` (códigos de respuesta), leída en la rebanada 3; no corrí un comando nuevo en esta |
| 6 | Big School | usado | `temario.md:201` (seguridad por diseño, pp. 15-16): validación y precio en el servidor, RLS; TDD (p. 9): pruebas propuestas en rojo para F-29, F-30 y F-31 |
| 7 | Videos | no usado en esta rebanada | Sin scout; los enlaces vigentes son los de la sección 8 (citados, no abiertos) |
Por la regla de L18, "no usado" o "parcial" sin el OK de Eduardo rechaza la rebanada: afecta a los ítems 2, 3, 4 y 7. Needs skill: security-review - diff de T7a. Needs scout: youtube-scout - validación estricta de entradas y precios calculados en el servidor.

### Recheck de F-27 a F-31 (2026-11-24, sobre HEAD `1c7e4205`, T7a sin commitear)
Alcance: solo los seis hallazgos arreglados por `backend-datos`; sin barrido nuevo. Un hallazgo nuevo cuenta solo si lo introduce el arreglo: **no encontré ninguno**. Las líneas son del árbol de trabajo.
**Sigue sin correrse ninguna prueba de RLS contra una base** (sin Postgres funcional en esta máquina). Lo que digo de la migración y de las 83 aserciones de `supabase/tests/precios_estandar_y_envio.sql` es lectura contra el precedente y rastreo a mano de los conteos, no ejecución.

| id | veredicto | evidencia (archivo:línea) | sonda |
|---|---|---|---|
| F-27 | **cerrado** | `migración:30-33` dice "ESCRITAS PARA CORRERSE, NO CORRIDAS", apunta a `supabase/tests/precios_estandar_y_envio.sql` (cabecera `:4`: "WRITTEN, NOT RUN") y a `docs/contratos/precios-y-envio.md` sección 5, cuyo título existe en `:171` ("Pruebas de RLS (escritas, no corridas)") | `grep -i 'probad\|verificad\|tested\|verified'` sobre migración, prueba SQL y contrato: 0 resultados. Ya no afirma nada que no se haya hecho |
| F-28 | **cerrado** (por lectura) | `migración:68` `REVOKE ALL ON SEQUENCE public.product_sizes_id_seq FROM PUBLIC, anon, authenticated;` y **después** `:69` `GRANT USAGE, SELECT ... TO authenticated, django`; igual para la otra tabla en `:110` y `:111`. Misma forma y mismo orden que el precedente: `20261113000001:366-369` (REVOKE) y `:399` (`GRANT USAGE, SELECT ON SEQUENCE public.product_promotions_id_seq TO authenticated, django`), y `20261119000003:31` | Resultado esperado: `anon` sin ningún privilegio en las dos secuencias; `authenticated` y `django` conservan `USAGE, SELECT`; las dos tablas siguen igual. Lo fijan `tests:68-71`, `:84-85` (`nextval` de `anon` = `42501`), `:101-102`, `:135-136`; el helper `t.seq_privs` ya existe en `ayudas.sql:167` y `t.code` en `:47`. No corrido |
| F-29 | **cerrado** | `pricing.py:51-55`: los tres patrones usan `[0-9]` y se aplican con `fullmatch` (`:179`, `:192`); pruebas de regresión en `test_pricing.py:406-407` (árabe-índico y ancho completo) | `probe_t7a_recheck.py`: 9 variantes (árabe-índico, ancho completo, árabe-índico extendido, devanagari, dígitos matemáticos en negrita, superíndice, salto de línea final, espacio inicial, NBSP) x 4 campos (`grams`, `amount`, `quantity`, `piece_weight_kg`) = 36, más 4 decimales mixtos (`"٢٠٠.٥٠"`, `"200.５０"`, `"٧.٣"`, `"7.３"`): **40 rechazados** con `invalid_amount`. 6 controles ASCII siguen aceptados (500 g = $389.50, $200.50, tamaño 340 g x2 = $530.00, pieza de 7.3 kg = $5686.70) |
| F-30 | **cerrado** | `pricing.py:327-330` (`s.id == size_id and s.product_id == product.id and s.is_active`) y `:394` (`size_listing` filtra `s.product_id == product.id`); pruebas `test_pricing.py:181-187` y `:511-512` | Rechazados con `sale_mode_not_allowed`: tamaño de otro producto con las dos listas, solo ese, mismo id de otro producto, `product_id` `"7"` como texto. Control: el tamaño propio da $265.00. `size_listing([propio, ajeno])` = `[1]`; `size_listing([ajeno])` = `[]` |
| F-31 | **cerrado**, con una decisión de producto abierta (abajo) | `migración:92-96`: los tres CHECK llevan `AND <col> <> 'NaN'::numeric`; `shipping.py:33-42` (`_is_usable`, usado en `:51`) descarta zonas inactivas o con valores no finitos; `models.py:178-180` (`DeliveryZone.clean()`) no consulta con una cota no finita; pruebas `test_shipping.py:82-96` y `:181-185`; SQL `tests:155-157` (`'NaN'` en `fee`, `from_km` y `to_km` -> `23514`) | Seis valores malos (`fee` NaN, `to_km` NaN, `from_km` NaN, `to_km` Infinity, `fee` sNaN, `fee` -Infinity) en cinco situaciones cada uno (zona mala antes y después de la buena, cotización con tres zonas, solo la mala a 12 km y a 0 km): ninguna imprime `NaN` ni `Infinity`, ninguna lanza, la zona buena sigue sirviendo ($50 a 3 km, $90 a 8 km) y la mala sola da `deliverable: False`, `out_of_range`. `clean_fields()` rechaza NaN e Infinity en `fee`, `from_km` y `to_km`; `clean()` con cota NaN o Infinity devuelve sin consultar |

Notas del recheck:
- **F-31, `clean()` con `fee` NaN y cotas finitas**: sí consulta el traslape (la guarda mira solo las cotas porque la consulta solo usa cotas). En mi sonda dio `no such table: delivery_zones` porque la tabla es `managed = False` y no existe en esa sonda; le pasaría igual a una zona finita. Es un artefacto de la sonda, no un hallazgo; el NaN del `fee` ya lo reporta `clean_fields()`.
- **Infinity en Postgres**: por la documentación (PostgreSQL 14 en adelante), `numeric(5,2)` y `numeric(10,2)` no admiten infinito (error de desbordamiento); el único vector era `NaN`. No lo ejecuté. El código Python descarta ambos igualmente.
- **Tope de `fee` (decisión de producto, no bloquea)**: la sugerencia de F-31 de acotar `fee` con `BETWEEN` no se adoptó; quedó como `precios-y-envio.md:265` (sección 8, punto 7). Es coherente: lo que era vulnerable era el `NaN`. Mientras la migración no esté aplicada, agregar el tope no cuesta nada; una vez aplicada costaría una migración nueva. Eduardo decide antes de aplicarla.
- **F-32**: bien escrito para T9 en `precios-y-envio.md:151-155` (sección 4, punto 6): pide mínimo y máximo del total, tope de peso por línea de piezas y política de `low_stock`, acota a `MAX_ORDER_LINES` antes de consultar productos, y remite al detalle por vista de la sección 9 (f) de este documento y al punto 8 de la sección 8 (`:266`). Verifiqué con sonda las cifras que cita: modo dinero acepta `0.39` (total 0.39, 0.001 kg); 10 000 x 340 g = $2 650 000.00 y 3 400 kg con `low_stock`; 10 000 x 7.3 kg con 1 en el estante = $56 867 000.00 y 73 000 kg con `low_stock`; el tope de 1000 kg del modo dinero está en `pricing.py:271-272`. Sugerencia (no bloquea): la fila de T9 en `odd/tasks/rediseno-moderno.md:49` no nombra F-32; agregar "requisitos de entrada: `precios-y-envio.md` sección 4, punto 6" para que quien tome T9 lo lea.
- **F-33** se deja como estaba (`precios-y-envio.md:169`, "Residual conocido"; no sensible).
- **Las 83 aserciones SQL**: las leí todas y rastreé a mano los conteos por rol (anon 1 y 1; cliente ajeno 1 y 1, y 0 filas sin error en UPDATE y DELETE, `:95-99` y `:104-111`; administrador 2 y 2; `django` 3 tamaños y 2 zonas tras las escrituras del administrador, `:129-130`), los códigos (`42501` para `anon`, `23514` para los CHECK, `23505`, `23503`, `23P01`) y la sintaxis de `\gset`: son coherentes con la migración. Eso no sustituye correrlas.
- Observación sin costo, no es hallazgo (existía antes del arreglo y sigue el precedente `product_promotions`): `authenticated` sin rol de administrador conserva `USAGE` de las dos secuencias (`:69`, `:111`); PostgREST no expone `nextval`, así que no es alcanzable por la API. Si se quiere mínimo privilegio, se podría dejar solo a `django`; no lo pido.

Pruebas y escaneos del recheck:
- `dj.sh inventory.test_pricing ventas.tests.test_shipping ventas.tests.test_contract_precios panel.test_compras` -> **135 pruebas, OK** (0.479 s).
- Sondas propias (fuera del repo, en el scratchpad de la sesión): `probe_t7a_recheck.py` (40 rechazos de dígitos, 5 casos de F-30, 30 casos de zonas, 4 casos de Django) y `probe_f32.py` (3 cifras). Único "crash" de la sonda: el artefacto de `no such table` descrito arriba.
- `gitleaks dir <ruta> --redact --no-banner`, una ruta a la vez: la migración, `supabase/tests/precios_estandar_y_envio.sql`, `backend/inventory`, `backend/ventas` y `docs/contratos` -> "no leaks found" en las cinco.
- **No corrido**: RLS contra una base, `pgTAP`/`correr.sh` (el `down_sql` lo leí: solo `DROP TABLE public.delivery_zones;` y `DROP TABLE public.product_sizes;`, en ese orden; el orden no importa porque ninguna de las dos tablas referencia a la otra; no lo ejecuté), Jest, `node --test` y el build.

**Veredicto final del recheck.** F-27, F-28, F-29, F-30 y F-31 están cerrados; F-32 está bien escrito como requisito de entrada de T9; F-33 se deja. **Sí se pueden commitear**, sin bloqueos, en el orden ya decidido:
1. **Commit 1 (primero y aparte, Riesgo 1 y 2):** `supabase/migrations/20261124000001_precios_estandar_y_envio.sql` y su prueba `supabase/tests/precios_estandar_y_envio.sql` (la prueba se encuentra por el nombre de la migración, `correr.sh`). El mensaje no debe decir que la RLS está verificada: está escrita, no corrida.
2. **Commit 2:** `backend/inventory/pricing.py` y `test_pricing.py`, `backend/ventas/shipping.py`, `backend/ventas/models.py` (espejos), `backend/panel/views_compras.py`, `backend/ventas/tests/test_shipping.py`, `backend/ventas/tests/test_contract_precios.py`, `docs/contratos/precios-y-envio.md`. En el árbol hay además cambios que no son de T7a (`backend/ventas/views/acceso.py`, `_cabecera.html`, `test_acceso*.py`, `test_header.py`, `test_styles.py`, `test_catalog.py`, `src/entry/auth.tsx`, los assets de `backend/static/vite/`): no deben entrar en estos dos commits.
3. Antes de cada commit: `gitleaks git --redact --no-banner` (o `dir` sobre lo preparado) y la skill `security-review` sobre el diff, que corre el lead (este agente no puede invocarla). Pendiente de Eduardo, sin bloquear el commit: el tope de `fee` antes de aplicar la migración, y correr la prueba SQL cuando haya Postgres (`brew reinstall postgresql@14` lo ejecuta él).
Riesgo de este recheck: `Risk: none` (solo texto en este documento).

#### Recibo de recursos del recheck (7 ítems MANDATORY del kit)
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | `dj.sh` 135 OK; `probe_t7a_recheck.py`; `gitleaks dir` en 5 rutas, sin hallazgos; skill `security-and-hardening` (`SKILL.md:21-40` modelo de amenazas, `:44-46` y `:102-104` validar en el borde con lista permitida); reglas globales sección 4; Engram #1097 (reglas), #1627 (OWASP por proyecto), #3370 (recibo del lead). `supply-chain-risk-auditor`: no aplica, la rebanada no cambia dependencias. `security-review`: lo corre el lead sobre el diff |
| 2 | REA | no aplica | Eduardo lo limita a S10 y al panel (encargo del lead); este agente no tiene herramientas `mcp__rea__*` |
| 3 | Diseño y animación | no aplica | Recheck de datos, SQL y funciones puras; sin interfaz |
| 4 | Patrones y diagramas | parcial | `refactoring-guru.md:58` leído. Los arreglos usan guard clauses y fail-fast (`pricing.py:179`, `:192`, `:327-331`; `shipping.py:33-42` como filtro), sin patrón nuevo; el Mermaid de esta sección 9 sigue vigente (los arreglos no agregan componentes). No abrí el Archify `docs/diagramas/t7a-precios-er.html` |
| 5 | roadmap.sh | usado por referencia | `best-practices.md:111` (limitar peticiones), `:123-126` (entradas) y `:148` (códigos de respuesta); no corrí `roadmap_search.py` de nuevo |
| 6 | Big School | usado | `temario.md:201` (seguridad por diseño, pp. 15-16: validar y autorizar en el servidor) y `:198` (TDD, p. 9): las sondas son la verificación independiente de los arreglos que `backend-datos` hizo con rojo antes de verde |
| 7 | Videos | parcial | Citados del handoff, no abiertos por mí: https://youtu.be/0DhghJpWwVQ?t=646 (probar primero auth, tokens y conexiones) y https://youtu.be/3spCFnMSGIY?t=4926 (minutos verificados por el lead con `transcript`) |

## 10. Rebanada 5: T5, página de acceso `/acceso/` (2026-11-24, en el índice, sin commitear, sobre HEAD `56919839`)

Auditor: teammate `auditor`. Specs: S2 y S4. Riesgo declarado: ítem 2 (auth; la lógica de Supabase no cambia). Criterio: el de la skill `security-review` (solo confianza alta con impacto real; sin DoS ni límites de tasa; sin riesgos teóricos). Revisé el **índice** (`git diff --cached`) y comprobé que el árbol de trabajo es idéntico a él en las rutas de T5 (`git diff --stat` sin staged: vacío). Las líneas son del árbol.
Alcance leído: `backend/ventas/templates/ventas/acceso.html` (nuevo), `backend/ventas/views/acceso.py`, `parciales/_cabecera.html`, `src/entry/auth.tsx`, `src/acceso/server-acceso.ts`, `src/acceso/legacy-acceso.tsx`, `src/acceso/styles.d.ts`, `css/components/acceso-page.css` (solo `url()`, `@import` y `[hidden]`), los cambios de `test_acceso.py`, `test_header.py`, `test_styles.py`, `test_catalog.py`, el `test_acceso_page.py` nuevo (sus pruebas de seguridad) y `backend/static/tienda/acceso.js` (sin diff contra HEAD: `git diff HEAD --stat` vacío para él y para `vendor/`).

### Veredicto
- **T5 se puede commitear, sin bloqueos y sin condiciones.** No encontré ninguna vulnerabilidad de confianza alta introducida por T5. Los tres hallazgos de abajo (F-34 a F-36) son de gravedad info o baja y ninguno es una regresión de T5: F-34 vive en el `acceso.js` que T5 no tocó, F-35 en la vista y su prueba (anteriores a T5, que solo cambió el nombre de la plantilla) y F-36 es una prueba que falta. Se pueden cerrar en T8 o en una rebanada propia.
- Tres decisiones para Eduardo (D-1 a D-3) son comportamientos que ya tenía la página vieja y que `acceso.js` sigue teniendo: se separan de T5 a propósito.

### Hallazgos nuevos
| id | severidad | estado | archivo:línea | dueño | resumen |
|---|---|---|---|---|---|
| F-34 | info (no regresión de T5) | confirmado con sonda | `backend/static/tienda/acceso.js:244-252` frente a `acceso.html:12-14` | T8 (quien mude `acceso.js`) | Si `supabase-js` no carga, la rama de error hace `raiz.hidden = false` **sin** haber puesto los manejadores de `submit`: los dos formularios quedan visibles y un Enter hace un POST nativo del correo y la contraseña a `/acceso/`. La plantilla dice (`:12-14`) que `#acceso` sigue oculto justo para que eso no pase. Impacto real: ninguno de fuga (mismo origen, `form-action 'self'`, el POST llega a `CsrfViewMiddleware` y recibe **403** sin eco de la contraseña, ver la sonda; el aviso de CSRF de Django, `django/middleware/csrf.py:211-214`, escribe solo `"Forbidden (%s): %s"` con el motivo y la ruta, nunca el cuerpo; el `LOGGING` del proyecto, `settings.py:374-399`, solo agrega un formateador `plain`); el efecto es una página 403 confusa. Arreglo: en esa rama no destapar `#acceso`, o poner `evento.preventDefault()` en ambos formularios antes del `await`. Misma conducta tenía la página vieja (mismos `method="post"`, ver abajo) |
| F-35 | baja (defensa en profundidad, no bloquea) | confirmado por lectura | `backend/ventas/views/acceso.py:27-37`, `acceso.html:64`, `backend/config/settings.py:215` y `:221`, `backend/ventas/tests/test_acceso.py:185-191` | backend-datos o lead | La vista imprime en `data-supabase-key` lo que haya en `SUPABASE_PUBLISHABLE_KEY` sin mirar su forma. `settings.py:221` guarda a dos líneas la llave de servicio; pegar esa llave en la variable equivocada la publicaría en el HTML de todos (se saltaría RLS). La prueba `:185-191` busca `SECRET_KEY`, `SUPABASE_JWT_SECRET` y el texto `service_role`, pero no `settings.SUPABASE_SERVICE_ROLE_KEY` ni el prefijo `sb_secret_`. Es un error de operador, no un fallo del código de T5; ya existía antes. Arreglo: tratar como "no configurada" (503) una llave que empiece por `sb_secret_` o sea igual a `SUPABASE_SERVICE_ROLE_KEY`, y una prueba para cada caso |
| F-36 | info (prueba que falta) | confirmado | `backend/ventas/tests/test_acceso_page.py:191-195` | frontend | El código no refleja `?salir` ni `?admin` (solo dos booleanos, `acceso.py:34-35`, que eligen un texto fijo, `acceso.html:70`), pero ninguna prueba lo fija con un valor hostil. Una prueba de una línea: `?salir=<script>alert(7)</script>ZQX&admin=<script>...` y `assertNotIn("ZQX", html)`. Mi sonda lo confirma hoy (abajo) |

### Decisiones de Eduardo (no son regresión de T5: son de `acceso.js`, sin diff contra HEAD)
- **D-1, el registro revela si un correo ya existe** (`acceso.js:25-26`, `:226-228`). Con confirmación de correo activa, Supabase contesta de forma ofuscada (usuario sin `identities`) justo para no revelarlo; el script lo convierte en "Ese correo ya tiene una cuenta. Inicia sesión.". Es enumeración de cuentas (OWASP A07). Costo del arreglo: un mensaje igual en los dos casos ("Si el correo es nuevo, te enviamos un mensaje para confirmarlo"), a cambio de que la persona que ya tiene cuenta no sepa por qué no le llega nada. El login sí es genérico (`acceso.js:23`, "Correo o contraseña incorrectos."). `email_not_confirmed` (`:24`) distingue una cuenta sin confirmar; no verifiqué si Supabase lo devuelve solo con la contraseña correcta.
- **D-2, la sesión de Supabase vive en `localStorage`** (`acceso.js:104`, `persistSession: true`). La skill `security-and-hardening` ("Never store sessions in client-accessible storage") lo desaconseja: un XSS se llevaría el token de refresco. Lo que lo compensa hoy y lo verifiqué: CSP con `script-src 'self'` y sin `unsafe-inline` (`config/middleware.py:36-55`, sonda abajo), ningún `innerHTML` en `acceso.js` (prueba `test_acceso.py:229-234`) y ningún `|safe` ni `on*=`. La alternativa (sesión en cookie `HttpOnly` que ponga Django, como ya hace el panel con `panel:sesion`) es trabajo de T8/T9, no de T5.
- **D-3, límite de intentos, política de contraseñas y confirmación de correo** son ajustes de Supabase Auth, no del repo. El cliente solo exige 8 caracteres (`acceso.js:205`) y no es frontera de seguridad. Mi baseline (`RESOURCE-CONTRACT.md` sección 4: contraseñas fuertes y límite de intentos fallidos; roadmap.sh `best-practices.md:100`, "Max Retry y jail en el login") **no se puede comprobar desde el código**. Eduardo lo revisa en los ajustes de Authentication del proyecto, o autoriza a un agente a leer los asesores de Supabase; **yo no lo hice**: es una operación remota sin autorización.

### Controles revisados y limpios
1. **Los formularios no mandan contraseña solos**: `acceso.html:72` y `:87` llevan `method="post"` y `action="{% url 'ventas:acceso' %}"` (nunca GET, así que la contraseña no viaja en la URL, el historial ni el `Referer`); la vista es `@require_safe` (`acceso.py:16`). Sonda: POST con el cliente de pruebas, **405** (`Allow: GET, HEAD`); con `enforce_csrf_checks=True`, **403** (el middleware responde antes que la vista) y la contraseña no vuelve en el cuerpo. La prueba del 405 ya existía (`test_acceso.py:107-116`). Sin JS no viaja nada: `#acceso` es `hidden` (`:62`), el CSS lo respeta (`acceso-page.css:136-138` y `:405-407`) y hay un `<noscript>` (`:58-60`). Matiz para el lead: en un navegador real la respuesta es 403, no 405; los dos son "no".
2. **CSP `'self'`**: en la plantilla solo hay un `<script type="module" src>` externo (`:31`) más la entrada de Vite (`:30`); cero `<style>`, cero `style=`, cero `on*=`, cero `|safe`/`mark_safe`, cero `target=`, cero `http(s)://` y cero CDN (mi `grep` sobre las líneas 20 en adelante). El pie compartido (`_pie.html:14-16`, sin cambios de T5) sí tiene `target="_blank"`, pero con `rel="noopener noreferrer"` y enlaces que son constantes del repo (`ventas/negocio.py:17`, `:21`, `:22`). La respuesta lleva `script-src 'self'`, `style-src 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `connect-src 'self' <supabase>` y ningún `unsafe-inline` (sonda). La prueba `test_acceso_page.py:242-257` lo fija.
3. **Solo la llave publicable llega al HTML**: `data-supabase-key` (`:64`) viene de `SUPABASE_PUBLISHABLE_KEY`; la sonda con una llave sintética la ve en el HTML y no ve la de servicio. Ver F-35 para lo que falta. `@never_cache` (`acceso.py:15`): `Cache-Control: no-store, private` (sonda).
4. **`?salir` y `?admin` no se reflejan**: sonda con `<script>alert(7)</script>ZQX` en los dos: 200, el marcador no aparece en el cuerpo y no hay `alert(7)`; con `salir=1` sale el texto fijo "Cerraste tu sesión." (la rama `elif` hace que `salir` gane a `admin`, `acceso.html:70`; es de diseño). `{{ negocio.nombre }}` (`:26`, `:27`) pasa por el autoescape.
5. **`server-acceso.ts`**: sin `.value`, sin `fetch`, sin `localStorage`/`sessionStorage`, sin `innerHTML` (`:1-40`); solo cambia `type` y `aria-label` de los botones de ver contraseña (`:22-28`). El chunk construido (`server-acceso-CODRFmd1.js`, 705 bytes) coincide con la fuente y no contiene `fetch(`, `XMLHttpRequest`, `eval(`, `innerHTML`, `sendBeacon` ni URL alguna; igual los otros tres chunks nuevos (`legacy-acceso`, `auth`, `menu-drawer`, 838 a 1 248 bytes). `legacy-acceso.tsx:1-42` es el código viejo movido tal cual: texto fijo en React, sin `dangerouslySetInnerHTML`; solo corre si el `<body>` no trae `data-server-store` (`auth.tsx:19-23`), es decir, en el `accessweb.html` de la raíz, que Django ya redirige con 301.
6. **Bundles**: `grep -rlE "service_role|sb_secret_|sk_live_|sk_test_|AKIA[0-9A-Z]{12}|-----BEGIN" backend/static/vite` -> vacío. `sb_publishable_` -> 0 coincidencias. Los chunks `shared-CqOXKDrN.js` y `chatbot-BD-E1OUE.js` nombran `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, pero están commiteados desde antes (no son de T5) y no llevan valor (el mensaje "Supabase configuration missing" lo confirma).
7. **Dependencias**: `git diff --cached --stat -- package.json package-lock.json backend/pyproject.toml backend/uv.lock .npmrc` -> vacío. `backend/uv.lock` ya fija django 5.2.19 (ítem 14 de #1091 cerrado en esta rama); la deuda del lock de npm (#1091 ítem 12: axios 1.15.0 y proxy-addr 2.0.7) no es de T5 y **no la volví a medir**.
8. **`autocomplete`, `spellcheck`, `aria-describedby`**: `username` en el correo del ingreso y del registro (`:76`, `:97`) es la pista estándar para que el gestor de contraseñas guarde el par; no abre nada. `spellcheck="false" autocapitalize="none" autocorrect="off"` en las tres contraseñas (`:80`, `:105`, `:109`) **cierra** una fuga: cuando el botón ojo pasa el campo a `type="text"`, sin `spellcheck="false"` algunos navegadores mandan el texto al corrector. `aria-describedby` apunta a `ingresar-error` y `registro-error`, que existen (`:82`, `:114`) y están fijados por `test_acceso_page.py:211-222`. Ninguno de los tres es entrada de datos ni cambia a dónde viaja algo.
9. **Credenciales por defecto** (el caso de `admin`/`123456` del video, `3spCFnMSGIY` 2:11:20 y 2:12:05): `grep` por `admin123`, `123456`, `password = "..."`, `passwd` y `secret` sobre la plantilla, los `.ts/.tsx` y el CSS -> sin coincidencias.
10. **CSS**: `acceso-page.css` no tiene `url(` ni `@import`; el CSS construido (`auth-D3ybOBvO.css`) solo trae `data:image/svg+xml` (los `http://www.w3.org/2000/svg` son el namespace del SVG, no se descargan) y la fuente de Bootstrap Icons en `/static/vite/assets/`, ambos permitidos por `img-src 'self' data:` y `font-src 'self'`.
11. **Pruebas: ninguna aserción de seguridad se debilitó.** `test_acceso.py` tenía 21 pruebas en HEAD y tiene 21 en el índice. Cambios: el nombre de la plantilla; `autocomplete` `email` -> `username`; "todo `<script>` empieza por `/static/tienda/`" pasó a dos expresiones regulares exactas (`sources[0]` es `acceso(.hash).js` y `sources[1]` es `auth-*.js`, más "solo uno de `/static/tienda/`"), con `assertNotIn("<style")` y "ningún atributo `style`" intactos; "solo el script de cabecera" pasó a "solo la entrada de Vite" cuando falta la llave (503). `test_header.py` quitó `ventas:acceso` de `PAGES` porque su cobertura se movió a `AccesoHeaderTests` (`test_acceso_page.py:350-446`, 9 pruebas: mismos controles en el mismo orden, paneles, búsqueda GET, pie, script de cabecera). `test_styles.py` agregó `acceso.html` a las plantillas de Vite (así sale de la regla de Tailwind del panel). `test_catalog.py` cambió una plantilla esperada (el nombre de la prueba sigue diciendo "store frame": cosmético).
12. **Lo que ya tenía la página vieja** (para separar regresión de herencia): `git show HEAD:.../ventas/tienda/acceso.html` ya traía `method="post"` y `action` iguales (`:45`, `:64`) y los mismos `name`; T5 no abre nada nuevo y agrega `spellcheck`/`autocapitalize` y la guarda de `sin_bolsa`.
13. **`sin_bolsa`** (`_cabecera.html:29`): solo quita `aria-controls="bolsa"` cuando la página no tiene el cajón; es una variable booleana de la plantilla, no entra del cliente.
14. **`acceso.js` conserva su contrato con la plantilla** (leído línea a línea): los ids `acceso`, `acceso-aviso`, `form-ingresar`, `form-registro`; `[data-error]` (uno por formulario), `[data-accion]`, `button[type="submit"]`, el primer `input` de cada formulario; los `data-supabase-url/-key/-js`, `data-sesion-url`, `data-panel-url`, `data-tienda-url`, `data-modo`; y los `name` `email`, `password`, `full_name`, `phone`, `password_confirm`, `terms`, `newsletter`. Todos están en `acceso.html:62-117`.

### Diagrama anotado con patrones (rebanada 5)
`archify` está instalado (`~/.agents/skills/archify`) pero este agente no tiene la herramienta Skill: lo doy como Mermaid. El Archify del dueño (`docs/diagramas/t5-acceso.html`, 760 KB) **no lo abrí**; solo busqué en él referencias remotas: 0 `src`/`href` externos, 3 `<script` en línea, y `docs/` no está en `STATICFILES_DIRS` (`settings.py:175`, solo `backend/static`), así que Django no lo sirve.
```mermaid
flowchart LR
  B["Navegador"] -->|"GET /acceso/ (CSP self, no-store)"| V["acceso.py:15-37 Decorator never_cache + require_safe"]
  V -->|"render"| T["acceso.html:40,137-138 composicion de parciales (analogia de Composite)"]
  T -->|"vite_asset auth.tsx"| E["auth.tsx:19-23 Strangler: server-acceso o legacy-acceso"]
  E -->|"initServerAcceso"| F["server-acceso.ts:32-40 Facade: cabecera, buscador, cajon, ojos"]
  T -->|"script modulo acceso.js"| S["acceso.js:57-64 data-modo = State por atributo (analogia)"]
  S -->|"signInWithPassword / signUp, llave publicable"| SB[("Supabase Auth")]
  S -.->|"persistSession (D-2): localStorage"| LS[("localStorage")]
  S -->|"POST token solo admin, mismo origen"| P["panel:sesion"]
  B -.->|"sin JS: #acceso hidden + noscript; POST nativo = 405/403"| V
```
Patrones que el código **sí** usa, con `rama:archivo:línea` (rama `claude/stack-carney-mvp-244236`): **Decorator** de función (`backend/ventas/views/acceso.py:15-16`, mismo patrón que la ficha da para `panel/views.py:64-68`); **Facade** acotado (`src/acceso/server-acceso.ts:32-40`: una llamada oculta cuatro conexiones). **Analogías, no el patrón**: Strangler (`src/entry/auth.tsx:19-23`; es un patrón de migración, no de GoF: la página vieja y la nueva conviven y cada una carga su propio chunk); State por atributo (`acceso.js:57-64` y `acceso-page.css:160-161`: `data-modo` decide qué formulario se ve); composición de parciales (`acceso.html:40`, `:137-138`). **No hay Template Method**: la página vieja era `extends ventas/tienda/base.html` y la nueva es una plantilla propia con `include`; si T4d lo anota para productos, aquí no aplica.

### Lo que no se pudo verificar
- **Configuración de Supabase Auth** (límite de intentos, longitud y fortaleza de la contraseña, protección contra contraseñas filtradas, confirmación de correo) y la **RLS de `profiles`** que lee `esAdmin` (`acceso.js:127-130`): es remoto y no tengo autorización; D-3.
- **Que los bundles salgan de esta fuente**: no reconstruí (`npm` solo corre en Docker). Comprobé que los cuatro chunks nuevos coinciden con la fuente y no traen sumideros, no que el build sea reproducible; el lead dijo que `build:django` no deja diff.
- **Jest, `node --test` y `tsc`**: no los corrí; el lead reportó 279/279, 40/40 y 0. **`tests/visual/acceso-page.test.cjs`**: lo leí por red y entorno (solo `node:*`, sin `.env` ni red) y no lo ejecuté.
- **Un navegador real**: la sonda usa el cliente de pruebas de Django; el 403 de CSRF y la CSP las vi en cabeceras, no pintadas.
- **`security-review`** (comando integrado): un subagente no puede invocarlo. Needs skill: security-review - `git diff --cached` de T5 acotado a las rutas de arriba (sin los bundles ni el diagrama).

### Pruebas y escaneos de esta rebanada
- `dj.sh ventas.tests.test_acceso ventas.tests.test_acceso_page ventas.tests.test_header ventas.tests.test_styles ventas.tests.test_catalog` -> **109 pruebas, OK** (0.380 s).
- Sonda propia (fuera del repo, en el scratchpad de la sesión: `probe_t5/probe_t5.py`, una prueba con el cliente de Django y `override_settings` de una llave sintética): reflejo `?salir`/`?admin` con `<script>`, POST (405 y 403 con CSRF forzado, sin eco), cabeceras (`no-store`, `script-src 'self'`, sin `unsafe-inline`) y llave publicable en el HTML. Sin `.env`, sin base real.
- `gitleaks git --staged --redact --no-banner` -> "no leaks found" (1.44 MB escaneados).
- `grep` de secretos y de `sb_publishable_` sobre `backend/static/vite`; `grep` de `url(`, `@import` y de sumideros (`fetch`, `eval`, `innerHTML`, `localStorage`, `sendBeacon`) en el CSS y los chunks nuevos; `git diff --cached --stat` de los manifiestos de dependencias -> vacío.
- Transcripciones leídas con los minutos pedidos: `0DhghJpWwVQ` en 0:10:46 ("lo más importante siempre es todo lo relacionado con autenticación, tokens, conexiones con otras bases de datos... muy bien testeado") y `3spCFnMSGIY` en 2:11:20 y 2:12:05 (el login generado con un prompt simple y la variable `password` con `admin123456`). El video **no** dice "auditar antes de subir"; lo que se aplicó aquí es solo la comprobación de credenciales por defecto (punto 9).
Riesgo de esta revisión: `Risk: none` (solo texto en este documento).

### Recibo de recursos de esta revisión (7 ítems MANDATORY del kit)
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | Kit y `RESOURCE-CONTRACT.md` sección 4 leídos; skill `security-and-hardening` (`SKILL.md:21-40` modelo de amenazas, `:44-46` y `:72` sesión en almacenamiento del cliente, `:94-98` cabeceras y CSP desde `default-src 'self'`); OWASP A01 (la vista solo lee, el POST se rechaza), A03 (autoescape, sin `|safe`, sin sumideros), A05 (CSP, cabeceras, `no-store`) y A07 (D-1 y D-2); Engram #1091 y #1159 leídos en esta revisión (la llave publicable en el README ya estaba anotada; esta rebanada no la agrega: `gitleaks --staged` limpio); #1161 y #1570 **no los releí** (los citó la rebanada 3); `supply-chain-risk-auditor` leída, **no ejecutada**: T5 no toca manifiestos (diff vacío) y el colector hace red; `security-review`: pendiente del lead (arriba) |
| 2 | REA | no aplica | Eduardo lo limita a S10 y al panel (encargo del lead); este agente no tiene herramientas `mcp__rea__*` |
| 3 | Diseño y animación | no aplica | Revisión de seguridad: del CSS solo leí `url()`, `@import` y `[hidden]`; el juicio de diseño es de `frontend-revision` |
| 4 | Patrones y diagramas | parcial | Ficha `refactoring-guru.md:58` leída; Mermaid anotado arriba con Decorator y Facade confirmados y tres analogías rotuladas; el Archify `t5-acceso.html` no lo abrí (solo `grep` de referencias remotas) y no pude invocar la skill `archify` sin la herramienta Skill |
| 5 | roadmap.sh | usado | `roadmap_search.py outline cyber-security` corrido (6 temas, 295 subtemas); `best-practices.md:100` (Max Retry y jail en el login -> D-3), `:111` (límites), `:142-147` (cabeceras y no devolver datos sensibles) y `:148` (códigos de respuesta -> 405/403 de la sonda) |
| 6 | Big School | usado | `temario.md:201` (seguridad por diseño, pp. 15-16: contraseñas fuertes y límite de intentos -> D-3; autorización en el servidor -> punto 1) y `:198` (TDD, p. 9): F-35 y F-36 vienen con la prueba que los fija |
| 7 | Videos | usado | Minutos verificados en `~/agentic-global/claude/raw/transcripts/` (`0DhghJpWwVQ.ts.txt` en [0:10:46], `3spCFnMSGIY.ts.txt` en [2:11:20] y [2:12:05]); enlaces: https://youtu.be/0DhghJpWwVQ?t=646 y https://youtu.be/3spCFnMSGIY?t=7880. No usé `youtube-scout` |
Por la regla de L18, "no usado" o "parcial" sin el OK de Eduardo rechaza la rebanada: aquí afecta al ítem 4 (el Archify del dueño no lo abrí). Needs skill: security-review - `git diff --cached` de T5 acotado a las rutas de arriba.

## 11. Rebanada 6: TP, vista previa con datos sintéticos (2026-11-24, sin seguimiento, sobre HEAD `56919839`)

Alcance: solo los archivos de TP (`backend/config/settings_preview.py`, `backend/config/urls_preview.py`, `backend/config/test_preview.py`, `backend/panel/management/commands/preview_seed.py`, `backend/panel/test_preview_seed.py`, `backend/scripts/preview.sh` y la sección "Local preview with synthetic data" de `backend/README.md`). El resto del árbol es trabajo en curso de `frontend` y no entra.

### Veredicto
- **TP se puede commitear desde el punto de vista de seguridad: no hay hallazgos bloqueantes.** Ninguna guardia deja datos reales ni llaves reales al alcance: la base es SQLite fuera del repo, `backend/.env` no se carga, y cada valor de Supabase, Postgres y `SECRET_KEY` se sobrescribe antes de importar `config.settings`. El peor caso de mala configuración (F-37) da un administrador **sintético** sobre datos **sintéticos**.
- Recomiendo cerrar F-37 y F-38 (bajas, pocas líneas cada una) en el mismo commit o justo después; F-39 a F-42 son pruebas que faltan o notas.
- **El candado de L18 no está cerrado** (ver "Estado del candado"): no lo decido yo.

### Hallazgos
| ID | Gravedad | Estado | Dónde | Dueño | Resumen |
|---|---|---|---|---|---|
| F-37 | baja | confirmado por lectura | `settings_preview.py:22`, `:67`; `README.md` (sección nueva, viñeta de `ALLOWED_HOSTS`) | backend-datos | La única barrera de red es el `127.0.0.1` de `scripts/preview.sh:23`. La guardia de `RENDER` solo cubre Render, y `ALLOWED_HOSTS` no es una barrera de red: valida la cabecera `Host`, que manda el cliente |
| F-38 | baja | confirmado por lectura | `urls_preview.py:136-143` | backend-datos | Entrada por GET sin comprobar el origen: login CSRF desde cualquier página, y la cookie `sessionid` de `127.0.0.1` se comparte entre puertos |
| F-39 | baja (prueba que falta) | confirmado con mutante | `settings_preview.py:47`; `test_preview.py:122-135` | backend-datos | Ninguna prueba fija que no se lee `backend/.env`: quitar la línea 47 deja las 26 pruebas en verde |
| F-40 | info (prueba que falta) | confirmado con mutantes | `preview_seed.py:226`; `urls_preview.py:146` | backend-datos | La guardia de SQLite de la siembra y la condición del cambio de gateway tampoco están fijadas: los dos mutantes pasan 26/26 |
| F-41 | info | confirmado por lectura | `settings_preview.py:42-44` | backend-datos | En Linux, `/tmp/carni-preview` se crea `755` y la base `644`, y se acepta un directorio que ya exista con otro dueño. En macOS no aplica: `$TMPDIR` es `700` y por usuario |
| F-42 | info | confirmado por lectura | `settings_preview.py:50-53` | backend-datos | El comentario dice que el secreto "never comes from the shell", pero `setdefault` acepta `CARNI_PREVIEW_SECRET_KEY` del shell |

#### F-37 (baja): fuera de Render, la vista previa solo es local por el bind
- **Qué pasa.** `settings_preview.py:22` rechaza `RENDER`. Si alguien pone `DJANGO_SETTINGS_MODULE=config.settings_preview` en otro proveedor (Fly, Railway, Heroku, un contenedor con `gunicorn --bind 0.0.0.0`, el mismo arranque de `render.yaml:31`) o corre `runserver 0.0.0.0:8000` en una red compartida, los ajustes cargan. `ALLOWED_HOSTS = ["127.0.0.1", "localhost"]` (`:67`) no lo impide: protege contra DNS rebinding, pero un atacante en la red manda la cabecera que quiera.
- **Cómo se reproduce (descrito, no ejecutado fuera de loopback).** Con el servidor en `0.0.0.0:8000`: `curl -i -H 'Host: localhost' http://<ip-de-la-máquina>:8000/preview/enter/` -> 302 a `/panel/` con `sessionid`, y con DEBUG en `True` las páginas de error muestran trazas y rutas. En vivo comprobé lo que sí protege: el servidor del lead escucha solo en `127.0.0.1:8000` (`lsof`) y `curl -H 'Host: evil.example' http://127.0.0.1:8000/` -> **400**.
- **Impacto.** Administrador sintético sobre la SQLite sintética y DEBUG expuesto; sin datos ni llaves reales, porque todo lo sensible se sobrescribe (`settings_test.py:19-23`, `settings_preview.py:52-58`, `:70-75`).
- **Corrección propuesta.** Una guardia positiva en vez de una lista de proveedores: un middleware solo de `settings_preview` que responda 404 cuando `ipaddress.ip_address(request.META["REMOTE_ADDR"]).is_loopback` sea falso, con su prueba (`self.client.get("/preview/enter/", REMOTE_ADDR="203.0.113.5")` -> 404 y sin `panel_supabase_user_id` en la sesión). En el README, la viñeta debe decir que la barrera es el bind `127.0.0.1` más esa comprobación, no `ALLOWED_HOSTS`.

#### F-38 (baja): login CSRF por GET y cookies compartidas entre puertos
- **Qué pasa.** `enter` (`urls_preview.py:136-143`) abre una sesión de administrador con un GET sin comprobar de dónde viene. Una página cualquiera que el desarrollador visite puede navegar en primer plano a `http://127.0.0.1:8000/preview/enter/` (las navegaciones de primer nivel no las frena Private Network Access) y deja al navegador con la sesión sintética. Las cookies no se separan por puerto: `sessionid` y `csrftoken` de `127.0.0.1:8000` pisan las de otro Django local en `127.0.0.1` (por ejemplo, el de `rama-backend` con la base local), que cierra esa sesión.
- **Impacto.** Molestia en el entorno de desarrollo; no hay escalada, porque cada base tiene sus propias sesiones y la firma usa otro secreto.
- **Corrección propuesta.** (a) En `enter`, aceptar solo `Sec-Fetch-Site` igual a `none` o `same-origin` (escribir la URL o un marcador da `none`; Brave lo envía) y responder 403 en otro caso, con prueba (`HTTP_SEC_FETCH_SITE="cross-site"` -> 403). (b) En `settings_preview.py`, `SESSION_COOKIE_NAME = "carni_preview_sessionid"` y `CSRF_COOKIE_NAME = "carni_preview_csrftoken"`, con prueba en el informe del proceso hijo.

#### F-39 (baja, prueba que falta): `PYTHON_DOTENV_DISABLED` sin prueba
- **Lo verificado.** `python-dotenv` 1.2.3 (`pyproject.toml` exige `>=1.2.3`) respeta la variable: `dotenv/main.py:22-29` y `:415-421` del venv de `rama-backend`; `settings_preview.py:47` la pone antes de `from .settings_test import *` (`:60`), que es lo que llega a `load_dotenv(BASE_DIR / ".env")` en `settings.py:31`. Lo que no se sobrescribe y sí podría venir de `.env` o del shell son ajustes no secretos (`DJANGO_SSL_REDIRECT`, `MAX_REQUEST_BODY_BYTES`, `CHECKOUT_THROTTLE_*`); no hay otras lecturas de `os.environ` en `backend/` fuera de los ajustes y `manage.py`.
- **Reproducción.** Copia del backend en el scratchpad, borrada la línea 47 -> `Ran 26 tests ... OK`.
- **Corrección propuesta.** En el `REPORT` del proceso hijo (`test_preview.py:27-44`), añadir `"dotenv_loads": __import__("dotenv").load_dotenv(stream=__import__("io").StringIO("CARNI_DOTENV_PROBE=1"))` y afirmar `False` (la API pública devuelve `False` cuando la carga está desactivada).

#### F-40 (info, pruebas que faltan): otras dos guardias sin fijar
- `preview_seed.py:226`, `connection.vendor != "sqlite"`: quitada, 26/26 en verde. Prueba: `@override_settings(CARNI_PREVIEW=True)` con `mock.patch.object(connection, "vendor", "postgresql")` -> `CommandError` y `Product.objects.count() == 0`.
- `urls_preview.py:146`, la condición del cambio de gateway: con `if True:`, 26/26 en verde; en una corrida completa, importar `config.urls_preview` dejaría `services._gateway` como `PreviewGateway` para el resto de la suite. Prueba: tras importar `config.urls_preview` con `settings_test`, `assertNotIsInstance(services._gateway, PreviewGateway)`.
- Sobre la pregunta 3: fuera de la vista previa el doble no se activa. `config.urls` no importa `urls_preview`, `ROOT_URLCONF` solo apunta ahí desde `settings_preview.py:68` y desde `override_settings` en pruebas, y `FakeGateway` solo se importa en pruebas y en `urls_preview.py:28`. Lo único que se cuela es acoplamiento: `ventas/tests/support.py` importa `django.test` y `panel.tests` y lee `supabase/tests/cotizacion-casos.json` al importarse, así que la vista previa depende de archivos de pruebas (no es un riesgo de seguridad).

#### F-41 (info): directorio por defecto en un `/tmp` compartido
- En Linux, `tempfile.gettempdir()` es `/tmp` (`1777`). `mkdir(parents=True, exist_ok=True)` (`:44`) acepta un `/tmp/carni-preview` creado antes por otro usuario, y la base queda `644`: otro usuario local puede leer la tabla de sesiones. En esta Mac: `$TMPDIR` `700`, `carni-preview` `755`, `preview.sqlite3` `644`, sin exposición.
- **Corrección propuesta.** `mkdir(mode=0o700)` y rechazar el directorio si `stat().st_uid != os.getuid()`.

#### F-42 (info): comentario inexacto sobre el secreto
- `settings_preview.py:50-51` dice que el secreto nunca viene del shell; `:52` usa `setdefault`, así que un `CARNI_PREVIEW_SECRET_KEY` exportado gana. Sin impacto (firma sesiones de datos sintéticos). Corregir el comentario o fijar el valor del shell como "solo para el autoreloader" en el texto.

### Respuesta a cada pregunta del encargo
1. **Alcance fuera de la máquina:** solo si alguien cambia el bind; entonces `ALLOWED_HOSTS` no lo frena (F-37). La guardia de `RENDER` está probada (`test_preview.py:73-77`), la base fuera del repo y las rutas relativas o `:memory:` también (`:79-105`), y el 404 sin la bandera (`:178-183`) y con las rutas reales (`:139-146`).
2. **`.env` y llaves reales:** verificado que no se cargan (F-39 da el detalle); falta la prueba.
3. **`FakeGateway` y `services._gateway`:** no se activan fuera de la vista previa (F-40).
4. **Login CSRF por GET en loopback:** importa poco, pero se corrige barato (F-38).
5. **Datos sembrados:** sintéticos. Nombres con sufijo "Test", teléfonos `+52 444 000 01xx`, "Calle Ficticia 123", `admin@preview.test` (TLD reservado), UUID fijos inventados; `gitleaks dir --redact` sin fugas en los 7 archivos. No comprobé la serie `444 000` contra el plan de numeración del IFT. La prueba de `test_preview_seed.py:83-89` fija solo el prefijo del teléfono, no los nombres.
6. **¿Las pruebas fijan cada guardia?** `RENDER`, ruta de la base, hosts, DEBUG y bandera, secretos del shell, POST 405 y 404 sin bandera, sí. Sin fijar: `.env` (F-39), SQLite de la siembra y condición del gateway (F-40). Mutantes en `scratchpad/auditor-tp/m1..m3`, los tres 26/26 en verde.
7. **Candado:** abajo.

Nota funcional, no de seguridad: `PreviewGateway` no aplica los descuentos sembrados (decisión abierta de L26). Si una vista se aprueba sobre la vista previa, los totales con descuento no son los de producción.

### Estado del candado (L18, recibo de TP en L26)
- **Ítem 2 (REA): "no aplica", requiere el OK de Eduardo.** Sin ese OK, por L18, el candado no se cierra.
- **Ítem 3 (Diseño): "no aplica", requiere el OK de Eduardo.** Igual.
- **Ítem 4 (Patrones y diagramas): L26 lo da como pendiente.** En disco ya existe `docs/diagramas/tp-vista-previa.html` (sin seguimiento, 18:10) con referencias a `settings_preview.py:22`, `:28`, `:47`, `:60`, `urls_preview.py:33`, `:137` y `access.py:69`, `:118`; no lo abrí ni validé sus patrones. Lo cierra el lead al comprobarlo.
- No decido ninguno de los tres.
- **Actualización (2026-11-25, L27).** Eduardo dio su OK: "en TP, que es solo la vista previa, REA y diseño no aplican, con mi OK. Commitea TP en cuanto pase el auditor." Con eso, los ítems 2 y 3 quedan cerrados. Ítem 4: `docs/diagramas/tp-vista-previa.html` existe (760 475 bytes, 2026-11-24 18:10, sin seguimiento). Lo leí por su texto, no en el navegador. Anota "Settings inheritance" (`settings_preview.py:60`), "Test double as gateway" (`urls_preview.py:33, 147`), "Idempotent seed by natural keys" (`preview_seed.py:103`), "Decorator guard reused" (`access.py:69, 118`) y las guardias `:22`, `:28`, `:47` y `preview_seed.py:226`. Una imprecisión menor: `access.py:69` es `open_panel_session`, una función normal; el decorador es `:118`. **Veredicto final: TP pasa. La única condición del commit es que `docs/diagramas/tp-vista-previa.html` entre en el mismo commit**, porque hoy está sin seguimiento. F-37 y F-38 siguen recomendados, no bloquean.

### Patrones (Mermaid; la skill `archify` no está disponible en este agente)
```mermaid
flowchart LR
  B["Navegador (Brave)"] -->|"GET /preview/enter/ (Decorator @require_GET, urls_preview.py:136)"| E["enter() urls_preview.py:137-143"]
  E -->|"guard CARNI_PREVIEW :139-140"| A["open_panel_session access.py:69"]
  A --> P["vistas del panel: Proxy de protección / Decorator access.py:118-140"]
  P --> S["services.get_gateway() Singleton services.py:414-419"]
  S -->|"sustituido en :146-147"| G["PreviewGateway (subclase de FakeGateway) urls_preview.py:33"]
  G --> D[("SQLite en $TMPDIR, settings_preview.py:40-44, :70-75")]
  C["settings_preview.py:22 RENDER; :47 dotenv off; :52-58 secretos falsos"] -.->|"from .settings_test import *  :60"| T["settings_test.py:19-23 Supabase falso"]
```
Confirmados: **Singleton** (`services.py:411-419`, la vista previa reemplaza la instancia única en `urls_preview.py:146-147`), **Decorator** (`@require_GET`, `urls_preview.py:136`) y **Proxy de protección** de la ficha (`access.py:118-140`), que la vista previa no esquiva: la entrada solo crea la sesión y cada vista sigue pasando por `is_panel_admin`. `PreviewGateway` sustituye al **Facade** `PostgresGateway` (ficha, `services.py:167`) con la misma interfaz; llamarlo Strategy sería **solo una analogía**: no se elige en tiempo de ejecución, se reemplaza por configuración. La herencia de ajustes por `import *` es una capa de configuración, no un patrón GoF.

### Pruebas y escaneos de esta revisión
- `manage.py test config.test_preview panel.test_preview_seed --settings=config.settings_test` (venv de `rama-backend`, valores ficticios en la línea de comando) -> **Ran 26 tests, OK** (2.8 s).
- Tres mutantes sobre una copia del backend en el scratchpad (`auditor-tp/m1`: sin la línea 47; `m2`: sin `connection.vendor`; `m3`: `if True:` en `urls_preview.py:146`) -> los tres **Ran 26 tests, OK**.
- `gitleaks dir <archivo> --redact` en los 7 archivos -> "no leaks found" en cada uno.
- En vivo, solo lectura: `lsof` -> escucha en `127.0.0.1:8000`; `curl -H 'Host: evil.example' http://127.0.0.1:8000/` -> 400; `curl http://127.0.0.1:8000/` -> 200. No llamé a `/preview/enter/` para no escribir sesiones.
- No corrí la suite completa (roja por el RED de `frontend`), ni `ruff`, ni semgrep o trivy (`cyber-neo` no está instalado, la skill lo dice en `SKILL.md:14-17`).
- Ningún `.env` leído; `backend/.env` no existe en este worktree (comprobado con `test -e`, sin abrirlo).
Riesgo de esta revisión: `Risk: none` (solo texto en este documento).

### Recibo de recursos de esta revisión (7 ítems MANDATORY del kit)
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | Kit y `RESOURCE-CONTRACT.md` sección 4 leídos (control de acceso en el servidor, seguridad por defecto); `security-and-hardening` (`SKILL.md:21-36`, modelo de amenazas: elevación de privilegios -> F-37 y F-38; `:117`, objetivo bajo raíz permitida con prueba de dueño -> F-41); `cyber-neo-auditoria` leída (no instalada: solo gitleaks); OWASP A01 (F-37, F-38), A05 (DEBUG y cookies), A07 (login CSRF); `gitleaks` 7/7 limpio. Engram #1161, #1570, #1159 y #1091 **no releídos** en esta revisión (los citan las secciones 7 y 10; TP no toca dependencias ni el README raíz). `supply-chain-risk-auditor`: no ejecutada, TP no cambia manifiestos (`git status` sin `pyproject.toml` ni `uv.lock`). `security-review`: pendiente del lead (abajo) |
| 2 | REA | no aplica | Infraestructura local sin flujo de competencia que estudiar; requiere el OK de Eduardo (igual que el recibo de TP) |
| 3 | Diseño y animación | no aplica | TP no cambia interfaz; requiere el OK de Eduardo |
| 4 | Patrones y diagramas | parcial | Ficha `refactoring-guru.md:58-75` leída; Mermaid anotado arriba con patrones confirmados y una analogía rotulada; el Archify `tp-vista-previa.html` no lo abrí |
| 5 | roadmap.sh | usado | `best-practices.md:138` ("debug mode is off in production" -> F-37: DEBUG en `True` es aceptable solo si el bind es loopback) y `:120` (estado contra CSRF -> F-38) |
| 6 | Big School | usado | `temario.md:201` (seguridad por diseño, pp. 15-16: páginas internas sin sesión = control de acceso roto -> la entrada debe quedar acotada a loopback, F-37) y `:198` (TDD, p. 9 -> F-39 y F-40 vienen con la prueba que los fija) |
| 7 | Videos | no usado | No consulté `youtube-scout` ni transcripciones en esta revisión; el recibo de TP (L26) ya cita https://youtu.be/0DhghJpWwVQ?t=646. Requiere el OK de Eduardo o un paso de `youtube-scout` |
Por la regla de L18, los ítems 2, 3, 4 (parcial) y 7 de esta revisión dejan el candado abierto hasta el OK de Eduardo. Needs skill: security-review - diff de los 7 archivos de TP (sin `frontend`). Engram: búsquedas `carni-mvp` y global sin resultados para la vista previa.

## 12. Rebanada 7: T7b y T7c, inventario por fuente (2026-11-25, sin seguimiento, sobre HEAD `5842d5bd`; verificador independiente, Risk items 1 y 4)

Alcance: `supabase/migrations/20261125000001_inventario_por_fuente.sql` (escrita, NO aplicada), `supabase/tests/inventario_por_fuente.sql`, `backend/inventory/sources.py`, los cambios de `backend/inventory/models.py` y `pricing.py`, `backend/inventory/migrations/0006_product_source_and_piece_tolerance.py`, las tres pruebas nuevas de `inventory` y `docs/contratos/inventario-por-fuente.md`. `git status` no muestra cambios en `panel/views_compras.py`, `ventas/cart.py` ni `ventas/models.py`, así que no hay nada que revisar ahí. Lo de `frontend` y lo de TP quedan fuera.

### Veredicto
- **T7b y T7c se pueden commitear como "migración escrita, no aplicada": no hay hallazgos bloqueantes para el commit.**
- **Condición para APLICAR la migración (no para el commit):** antes, `supabase/tests/inventario_por_fuente.sql` tiene que correr en verde contra Postgres, con las aserciones de F-45 añadidas. Conviene cerrar F-44 antes de aplicarla. El SQL es lo único que hace cumplir las reglas en producción, y aquí no se pudo ejecutar (F-43).

### Respuestas
1. **Comportamiento anterior (lectura línea a línea contra `20261119000003_lote_al_confirmar.sql:184-269`).** Los productos sin fuente conservan las mismas comprobaciones, el mismo mensaje `insufficient_stock: % needs %, only % in stock` y los mismos movimientos `sale` (migración `:184-194`). El filtro sigue siendo `track_stock` cuando no hay fuente (`:178`). Los lotes por pieza siguen pasando por `_take_order_lots` sin cambios (`:213`), y el costo congelado es idéntico (`:215-230`). Antes se validaba todo y luego se descontaba; ahora se valida y descuenta fila a fila. Como cualquier `RAISE` revierte la función entera, el efecto neto es el mismo.
   - **Gramos exactos (S14.4 a S14.6).** Primero el stock propio (`least(greatest(stock,0), need)`, `:184`); el resto sale de la fuente. En kg, `quantity_kg`; por pieza, `piezas x avg_piece_weight_kg` redondeado a 3 decimales (`:200-201`). El factor de rendimiento no entra.
   - **Nunca negativo.** `UPDATE ... WHERE stock >= v_rest_kg` con `IF NOT FOUND` (`:202-206`), además de `products_stock_non_negative` (`20261113000001:114`).
   - **Cancelación.** Agrupa por `(product_id, via_product_id)` y devuelve lo mismo a la misma fila (`:240-251`). Los movimientos anteriores a la migración tienen `via` nulo y se devuelven como antes.
2. **Orden de bloqueo: no encontré ningún deadlock posible.** Todas las rutas toman los bloqueos en este orden: la fila de `orders` (`:143`), luego los productos y sus fuentes en una sola sentencia ordenada por id (`:161-168`), luego `purchase_lots` (`_take_order_lots`, `lote_al_confirmar:80-83`). `cut_lot` sigue el mismo orden, productos y después lote (`despiece:113-114`); `cut_source` también ordena por id (`:311-315`); `record_shrink` y `record_stock_count` bloquean una sola fila. No hay inversión productos/lotes. No hay Postgres para provocarlo en vivo. El único hueco de concurrencia está en el trigger de la fuente (F-44).
3. **Funciones y permisos.** Las seis funciones nuevas son `SECURITY DEFINER` con `search_path = ''`. Se revoca `EXECUTE` a `PUBLIC`, `anon` y `authenticated` y se concede a `django` (`:495-505`). `set_order_status` usa `CREATE OR REPLACE`, que conserva su ACL. RLS activado en `inventory_settings` y `stock_counts`, con políticas solo para `django` (`:109-120`). Se revoca la secuencia `stock_counts_id_seq` (`:113`): la lección de F-28 está aplicada. Las dos vistas se revocan y solo `django` lee (`:506-509`).
4. **Entradas (por lectura, sin ejecutar el SQL).** En Postgres, `NaN` es mayor que cualquier número: `record_shrink` y `cut_source` lo rechazan con `insufficient_stock` (`:378`, `:333`), y `record_stock_count` lo rechaza por el tope `> 1000000` (`:404`). Los negativos y el cero se rechazan. `piece_tolerance_kg >= 0` (`:67`). Del lado de Python, ver F-47.
5. **Pruebas.**
   - `manage.py test inventory` -> **Ran 343 tests, OK**.
   - **8 mutantes de Python, 8 muertos:** propio negativo, `>` por `>=` en la fuente, umbral de nota, merma sobre el stock, fuente de sí misma, `x quantity` de la pieza, `<=` de la tolerancia y la condición de pieza fija.
   - Pero esas pruebas fijan el espejo en Python, no el SQL (F-43). Las 37 aserciones del SQL las leí, no las corrí: cubren los ejemplos literales (10 -> 9 -> 8.700 -> cortes de 3 + 3 -> 1.700, nunca negativo, cancelación de 1 kg, merma, conteo -6.67 %) y los permisos de `anon` y `authenticated` sobre dos funciones. Lo que falta está en F-45.
6. **Candado:** abajo.

### Hallazgos
| ID | Gravedad | Estado | Dónde | Dueño | Resumen |
|---|---|---|---|---|---|
| F-43 | media (verificación) | confirmado | `backend/inventory/sources.py` (sin llamadas fuera de pruebas: `grep` vacío); migración `:416-417` frente a `sources.py:175-177` | backend-datos | Las reglas viven en dos sitios. Solo el SQL corre en producción, y no se ha ejecutado. Ya hay una diferencia: el SQL compara el porcentaje sin redondear y Python lo redondea a centésimas, así que con 5.004 % el SQL exige nota y Python no |
| F-44 | baja | por lectura | migración `:40-61` | backend-datos | El trigger de un solo nivel tiene una carrera en READ COMMITTED: si una transacción hace `A.source = S` y otra hace `S.source = B` a la vez, las dos pasan y queda una cadena de dos niveles (el bloqueo de clave foránea es `KEY SHARE` y no choca con ese `UPDATE`). Además no se dispara con `UPDATE OF stock_unit`: una fuente puede pasar a `piece` con hijos colgando |
| F-45 | baja (pruebas que faltan) | por lectura | `supabase/tests/inventario_por_fuente.sql` | backend-datos | Faltan: cancelar la venta por pieza desde la fuente (9605) y la mixta propio + fuente (9603); un producto sin fuente que confirma y cancela en verde en este archivo; `relrowsecurity` de las dos tablas; privilegios de `stock_counts_id_seq` e `inventory_settings` para `anon` y `authenticated` (F-28); que `django` no pueda hacer `INSERT` directo en `stock_counts`. Usa `no_plan()`, así que nadie fija el "37": usar `plan(n)` |
| F-46 | info (requisito de T9) | confirmado | `pricing.py:264` (antes de `_check_product_sells`, `:265`) | backend-datos | La ruta de pieza fija se salta `sale_modes` y el aviso `low_stock`. Hoy `close_price` no tiene ninguna llamada en producción; cuando T9 lo conecte, que compruebe `"pieces" in sale_modes` y el stock en piezas |
| F-47 | info | sonda | `sources.py:69-70`, `pricing.py:280` | backend-datos | Con `NaN` o `Infinity`, el espejo lanza `decimal.InvalidOperation` en lugar de `InventoryError`, acepta dígitos Unicode (`Decimal('٣')` = 3) y una tolerancia negativa (devuelve `False`). Solo importa si una vista llega a pasarle texto del usuario: parsear antes con el analizador ASCII de F-29 y F-31 |
| F-48 | info | por lectura | migración `:184`, `:183` | backend-datos | `least()` ignora `NULL`: una `need` nula descontaría todo el stock propio. Hoy no puede pasar, porque `order_items.quantity_kg` es `NOT NULL` (`202604100001_initial_schema.sql:74`) y las piezas van con `coalesce`. Defensa barata: `coalesce(need, 0)` |
| F-49 | info | por lectura | migración `:84-91`, `:115-118` | backend-datos | `django` puede subir `note_required_pct` hasta 999.99 (anula la nota obligatoria) y nada audita quién lo hizo: `updated_by` y `updated_at` no los fija un trigger. Que la vista de ajustes de T7d escriba quién lo cambió, o un trigger |

**Correcciones propuestas.**
- F-44: al inicio del trigger, `PERFORM pg_advisory_xact_lock(hashtext('public.products.source_link'))`; ampliar el trigger a `UPDATE OF source_product_id, stock_unit`, con un caso que rechace `stock_unit <> 'kg'` cuando hay hijos; y su aserción.
- F-43: correr el archivo SQL antes de aplicar la migración, añadir un caso de 5.004 % que fije qué regla manda y alinear Python con ella (o documentar que Python solo es una vista previa del cálculo).

### Estado del candado (recibo de T7b y T7c en L28)
- **1 Seguridad:** esta sección es la revisión del auditor. `gitleaks dir --redact` -> "no leaks found" en los 10 archivos (migración, prueba SQL, `sources.py`, `pricing.py`, `models.py`, migración 0006, tres pruebas, contrato). Sigue pendiente `security-review` (lo corre el lead).
- **2 REA:** citan #3387 y "hueco honesto" (los competidores no publican su inventario). No es un estudio de esta rebanada; si cuenta como usado o necesita el OK de Eduardo, lo decide él.
- **3 Diseño:** `data-architect` por el ítem 3 del kit ("data model through data-architect"). Coincide con el kit.
- **4 Diagrama:** `docs/diagramas/t7b-inventario-fuente.html` existe (767 680 bytes, 2026-11-24 18:19, sin seguimiento) y menciona "Singleton" y "pattern". No lo abrí ni validé sus patrones. Tiene que entrar en el mismo commit.
- **5 roadmap.sh y 6 Big School:** citados; no los verifiqué.
- **7 Videos:** `https://youtu.be/Umwj8gI7-pk?t=0` dice "minuto verificado", pero `t=0` es el inicio del video. Hace falta el minuto real o quitar "verificado".

### Patrones (Mermaid; sin `archify` en este agente)
```mermaid
flowchart LR
  O["set_order_status (SECURITY DEFINER) :123"] -->|"1 FOR UPDATE orders :143"| L1["2 productos + fuentes por id :161-168"]
  L1 --> OWN["stock propio :190-194"]
  L1 --> SRC["fuente: UPDATE ... WHERE stock >= kg :202-206, via_product_id :209"]
  L1 --> LOTS["3 _take_order_lots: purchase_lots :213"]
  CS["cut_source :289 (mismo orden)"] --> L1
  PY["inventory/sources.py (espejo puro, sin llamadas en producción)"] -. "F-43: deriva" .-> O
```
Confirmados: el `PostgresGateway` de `services.py:167`, que llama a estas funciones, es el **Facade** de la ficha. El orden de bloqueo canónico no es un patrón GoF: es una disciplina de concurrencia. `sources.py` son **funciones puras** (núcleo funcional), no Strategy; llamarlo así sería solo una analogía.

### Pruebas y escaneos de esta revisión
- `manage.py test inventory --settings=config.settings_test` -> **Ran 343 tests, OK** (2.25 s).
- Mutantes sobre una copia en el scratchpad (`auditor-t7b/`, script `mut_t7b.py`): 8/8 con `FAILED`.
- Sonda de entradas (`NaN`, `Infinity`, dígito árabe, tolerancia negativa) sobre `sources.py` y `StandardPiece`: resultados en F-47.
- El SQL no se ejecutó (no hay Postgres local); todo lo de SQL es lectura.
- Ningún `.env` leído.
Riesgo de esta revisión: `Risk: none` (solo texto en este documento).

### Recibo de recursos de esta revisión
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | `security-and-hardening` (modelo de amenazas, privilegio mínimo -> pregunta 3); OWASP A01 (grants y RLS) y A04 (diseño: dos fuentes de verdad, F-43); gitleaks 10/10; Engram #1161, #1570, #1159 y #1091 no releídos (esta rebanada no toca dependencias); `security-review` pendiente del lead |
| 2 | REA | no aplica | revisión de seguridad de SQL |
| 3 | Diseño | no aplica | sin interfaz |
| 4 | Patrones y diagramas | parcial | Mermaid arriba; el Archify del dueño no lo abrí |
| 5 | roadmap.sh | no usado | sin consulta nueva en esta revisión |
| 6 | Big School | usado | `temario.md:198` (TDD, p. 9: mutantes y pruebas que faltan, F-45) |
| 7 | Videos | no usado | sin consulta |
Needs skill: security-review - diff de los archivos de T7b y T7c listados arriba.

## 13. Rebanada 8: T7d rebanada 1, marco del panel e Inicio (2026-11-25, sin commitear, sobre HEAD `ebf18c64`; revisión del `auditor-2`)

Alcance: `backend/panel/views.py`, `panel/urls.py`, `panel/metrics.py` (nuevo), `ventas/views/tablero.py`, `ventas/templates/ventas/inicio.html`, `templates/panel/base.html`, `templates/panel/mas.html`, `templates/panel/parciales/` (nuevos: `inicio_semanas.html`, `inicio_margen.html`, `inicio_stock.html`), las cuatro pruebas de `panel/` y `docs/diagramas/t7d-panel-inicio.html`. Lo de `inventory/` y `supabase/` es de T7b (sección 12) y no entra.

### Veredicto
**Se puede commitear.** Sin hallazgos bloqueantes: ningún texto de la base llega sin escapar, las dos rutas nuevas y el Inicio siguen detrás de `panel_admin_required`, no hay estilo ni script en línea ni recurso externo, y `metrics.py` es de solo lectura con `Decimal` de punta a punta. Un mutante sobrevive (F-50): se corrige con una prueba, sin tocar el código de producción. El commit depende además del candado (abajo), que decide Eduardo.

### Respuestas
1. **Escape.** `grep` de `|safe`, `mark_safe`, `format_html`, `autoescape`, ` style=`, `<script` y `on*=` en los archivos del alcance: 0 coincidencias. Los nombres de producto salen solo como `{{ row.name }}` en `inicio_margen.html:17` e `inicio_stock.html:16`, con el escape automático. El SVG (`inicio_semanas.html:13-23`) no lleva ningún texto de la base: solo números calculados en `tablero.py:68-89`, fechas con `|date` y `Decimal`. Prueba que lo fija: `test_inicio.py:199` (`<b>x</b>` sale como `&lt;b&gt;`).
2. **Rutas y métodos.** `entregas` y `inventario` (`panel/views.py:310-322`) llevan `@panel_admin_required` y `@require_safe`; `test_secciones.py` comprueba GET 200, POST 405 y anónimo redirigido a `panel:acceso`. `inicio` (`views.py:259-260`) queda como en HEAD: guardado y sin `require_safe` (F-51). Las pruebas generales `panel/tests.py:845` y `ventas/tests/test_access.py:54` exigen el guardia en toda ruta del panel. **Costo y margen:** solo los pinta `inicio_margen.html`, dentro de `/panel/`, y hoy solo entra quien pasa `is_panel_admin` (`access.py:118-141`); no hay otro rol en el panel todavía (F-52).
3. **CSP `'self'`.** Sin `<style>`, `style=`, `<script>`, manejadores `on*` ni URL externas en el alcance. Los atributos de presentación del SVG (`fill-opacity`, `font-size`, `text-anchor`) no son estilos en línea para la CSP. Prueba: `test_inicio.py:190`. El autor midió 0 violaciones en Brave (L29); no lo repetí.
4. **`metrics.py`.** Solo lecturas: `values_list` sobre `panel_orders`, `select_related("cost")` para el margen, un `count()` y una consulta de stock bajo: cuatro consultas fijas, sin N+1. Dinero en `Decimal` con `quantize(ROUND_HALF_UP)`; el único `float` es la geometría del SVG (`tablero.py:76`), no un monto. La tienda es una sola: no hay datos "de otros" que filtrar, y los permisos del rol `django` ya cubren las tres tablas (`GRANT SELECT` en `20261113000001_comercio_v1_esquema.sql:144`, `20260918235409_django_schema_role.sql:32`, `20261113000003_comercio_v1_panel.sql:343`; RLS de `product_costs` con política para `django`, `esquema.sql:141-148`).
5. **Pruebas.** Ver mutantes abajo: 16 de 17 muertos.

### Hallazgos
- **F-50 (baja), la caída por bloques del Inicio no tiene prueba.** `backend/ventas/views/tablero.py:120-123`. Reproducción: cambiar el segundo `except DatabaseError:` (línea 122) por `except ZeroDivisionError:` deja las 924 pruebas en OK. Si `product_costs` o `panel_orders` fallan, el Inicio entero respondería 500 en lugar de "No se pudieron cargar las tendencias" y sin perder las métricas de `panel_kpis`. Corrección: una prueba en `panel/test_inicio.py` que parchee `panel.metrics.weekly_sales` (o `price_margins`) para lanzar `DatabaseError` y compruebe 200, el aviso de tendencias y que los cuatro mosaicos de `panel_kpis` siguen ahí.
- **F-51 (info), `/panel/` responde 200 a un POST.** `backend/panel/views.py:259-260`; viene de HEAD y `test_inicio.py:74` lo fija a propósito ("los mismos métodos que en HEAD", L29). No escribe nada y el middleware CSRF rechaza un POST sin token, así que no es explotable. Si se quiere `require_safe`, es un cambio de comportamiento aparte que decide el lead.
- **F-52 (info), requisito para los roles de colaboradores (S16, siguiente entrega).** El margen y el costo por kilo (`inicio_margen.html`, `metrics.price_margins`) son secreto del negocio. Hoy los protege que el panel es solo de administradores; cuando entren los roles, ese bloque y toda lectura de `product_costs` necesitan su propio permiso, con prueba de que un colaborador no los ve.
- **F-53 (info), código muerto en el rendimiento.** `backend/panel/metrics.py:72-74`: `yield_pct or Decimal("100")` convierte un 0 en 100 %, y `if yield_share <= 0` nunca se cumple con 0. No hay daño: la base lo impide (`CHECK (yield_pct > 0 AND yield_pct <= 100)`, `esquema.sql:132`). Corrección opcional: quitar el `or` y la rama, o dejar un comentario que cite el CHECK.
- **F-54 (info), el SVG depende del separador decimal del idioma.** Los `x`, `y`, `width` y `height` salen de `float` pasados por la localización de Django. Con `LANGUAGE_CODE = "es-mx"` (`config/settings.py:157`) el separador es `.` y funciona; con `es` sería `,` y el dibujo se rompería sin error. Corrección: envolver el `<svg>` en `{% localize off %}`.
- **F-55 (info), línea de riesgo.** L29 dice `Risk: none`. La rebanada agrega dos rutas guardadas y muestra costos en el panel; para mí cae en el ítem 2 (permisos y guardias) de forma acotada, y esta sección hace de verificación independiente. No cambia el veredicto.

### Mutantes (copia en el scratchpad, `auditor2-t7d/repo`, sin `.git` ni `.env`; script `auditor2-t7d/mut.py`)
Línea base de la copia: 924 pruebas OK. Muertos (16): quitar el guardia de `entregas`, `require_safe` de `inventario` o el guardia de `inicio`; contar los cancelados; día UTC en lugar de local; costo sin rendimiento; margen en orden inverso; productos inactivos en el margen o en el stock bajo; `<=` por `<` en el umbral; `is_out` con `<`; `|safe` en el nombre del margen y en el del stock; `style=` en el SVG; barras sin escala; ventana de 7 semanas. **Sobrevive (1):** `no-db-fallback` (F-50).

### Pruebas y escaneos de esta revisión
- `manage.py test panel ventas --settings=config.settings_test` -> **Ran 924 tests, OK** (5.3 s), en el worktree.
- `ruff check backend/panel backend/ventas/views` -> "All checks passed!".
- `gitleaks dir --redact` -> "no leaks found" en los 13 caminos del alcance.
- Diagrama: `docs/diagramas/t7d-panel-inicio.html` (4.9 KB), 0 rutas absolutas; sus citas `views.py:259-260`, `access.py:118`, `tablero.py:42` y `tablero.py:105` coinciden con el disco.
- Ningún `.env` leído; la vista previa del lead (127.0.0.1:8000) no se tocó.

### Estado del candado (recibo de T7d rebanada 1 en L29, tal cual)
- **1 Seguridad:** "revisión del `auditor-2` y pase de `security-review` (`revisor-seguridad`), en curso". La revisión del `auditor-2` es esta sección. `security-review` sigue pendiente.
- **2 REA:** "#3387 (L27); los paneles de la competencia son privados, así que las referencias del panel son las de diseño". No es un estudio nuevo de esta rebanada; si cuenta como usado, lo decide Eduardo.
- **3 Diseño:** "las 8 skills de arriba, con capturas y medidas en Brave". No lo verifiqué; L29 anota que axe y pa11y no se corrieron.
- **4 Diagrama:** "`docs/diagramas/t7d-panel-inicio.html` (patrones con archivo:línea, sin rutas absolutas; `finalize` pendiente)". Confirmado: existe, sin rutas absolutas y con citas correctas. `finalize` sigue pendiente. Sus dos patrones: **Decorator** (`panel_admin_required`, `access.py:118`) es real; **Template Method** está rotulado como "herencia de plantillas de Django", que es una analogía y así debe leerse.
- **5 roadmap.sh, 6 Big School, 7 Videos:** citados en L29 (`bi-analyst` y `frontend`; TDD p. 9; `?t=4926` y `?t=646`); no los verifiqué.

### Patrones (Mermaid; `archify` no está en este agente)
```mermaid
flowchart LR
  B["Navegador (admin)"] --> G["panel_admin_required access.py:118 (Decorator)"]
  G --> I["panel.views.inicio views.py:259-260"]
  I --> H["tablero.home tablero.py:105"]
  H --> K["panel_kpis vía gateway (Facade, services.py:167)"]
  H --> T["_trends tablero.py:92 -> panel.metrics (solo lectura)"]
  T --> DB[("panel_orders, products, product_costs (ORM)")]
  H --> P["ventas/inicio.html extiende panel/base.html (herencia de plantillas; Template Method solo como analogía)"]
  H -. "F-50: except DatabaseError sin prueba :122" .-> T
```

### Recibo de recursos de esta revisión
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | `security-and-hardening` (privilegio mínimo -> F-52; datos de la base como no confiables -> pregunta 1); OWASP A01 (guardias) y A03 (inyección en plantillas); 17 mutantes; gitleaks 13/13; Engram #1161, #1570, #1159 y #1091 no releídos (la rebanada no toca dependencias ni secretos); `security-review` pendiente del lead |
| 2 | REA | no aplica | revisión de seguridad |
| 3 | Diseño | no aplica | no se evalúa diseño aquí |
| 4 | Patrones y diagramas | usado | Mermaid arriba; citas del diagrama del autor comprobadas |
| 5 | roadmap.sh | no usado | sin consulta nueva |
| 6 | Big School | usado | TDD p. 9 (mutantes, F-50) |
| 7 | Videos | no usado | sin consulta |
Needs skill: security-review - diff de los archivos de T7d rebanada 1 listados arriba.

## 14. Rebanada 9: TF1, la vista previa con el catálogo real (2026-11-25, sin commitear, sobre HEAD `ebf18c64`; revisión del `auditor-3`)

Alcance: `backend/panel/preview_catalog.py` y `backend/panel/test_preview_catalog.py` (nuevos), y los cambios de `backend/panel/management/commands/preview_seed.py`, `backend/panel/test_preview_seed.py`, `backend/README.md`, `supabase/seed.sql` y `backend/config/urls_preview.py`. Este último es el delta que quita los lotes de 1.8 kg; ya estaba en el árbol al revisar y entra aquí. Lo demás que aparece modificado (T7b, T7c y T7d) no entra. Informe del autor: `scratchpad/tf1/backend-datos-3.md`.

### Veredicto
- **TF1 se puede commitear desde el punto de vista de seguridad: no hay hallazgos bloqueantes.** Las guardias de TP siguen iguales y probadas. El lector de `seed.sql` es de solo lectura, con ruta fija, y no ejecuta SQL. No hay variable de entorno nueva. Los únicos datos personales siguen siendo los sintéticos de TP.
- **S17, comprobado contra mi propia lectura de `seed.sql`, no contra el autor.** La base sembrada tiene los 53 productos de `seed.sql`, ni uno más. Ninguno de los 10 nombres inventados de HEAD aparece en la base ni en las páginas.
- Recomiendo cerrar F-56 (baja, pocas líneas) antes del commit o justo después. F-57 a F-60 son pruebas que faltan, notas y pendientes de otra superficie.

### Respuestas
1. **Guardias de TP.** `git diff --quiet HEAD -- backend/config/settings_preview.py backend/config/test_preview.py backend/scripts/preview.sh` no muestra cambios en ninguno de los tres. Siguen las guardias de `RENDER` (`settings_preview.py:22`), la ruta absoluta fuera del repo (`:28-37`), el directorio `0o700` con dueño (`:46-61`), `PYTHON_DOTENV_DISABLED` (`:64`), el secreto aleatorio (`:69`), el middleware de loopback primero (`:87`), las cookies propias (`:96-97`) y la invitación con POST y CSRF. La guardia de la siembra se movió de la línea 227 a `preview_seed.py:207` y ahora va **antes** de `load_catalog()` (`:211`), así que sin los ajustes de la vista previa ni siquiera se lee `seed.sql`. Prueba: el mutante `sqlite-guard-off` muere (abajo).
2. **El lector (`preview_catalog.py`).** La ruta es fija, derivada de `__file__` (`:24-26`), sin argumento de línea de comandos ni variable de entorno: `grep` de `environ|getenv|argv|execute|cursor|eval|exec(|subprocess` en `preview_catalog.py` da 0 coincidencias. El único `cursor.execute` de `preview_seed.py:196` es el `INSERT` parametrizado del administrador, que ya estaba en HEAD. Los valores se escriben por el ORM (`update_or_create`, `:107` y `:119`), así que no hay inyección. Los nombres salen con el escape automático, y una `image_url` como `javascript:` la neutraliza `store_image_url` (`inventory/models.py:92-110`) al pintarla, igual que en producción. Sondas (`scratchpad/auditoria/sonda_parser.py`, salida en `sonda_parser.txt`):
   - Rechaza con `SeedFormatError`: una cadena sin cerrar, `random()`, `2.89e2`, un número negativo y un archivo truncado.
   - Acepta bien: un `--` dentro de una cadena y 1 MB de comentario (0.00 s).
   - Acepta y no debería: dos casos, F-56 y F-58.
3. **Datos personales.** Clientes y pedidos son los de TP: nombres con "Test", `+52 444 000 01xx` y "Calle Ficticia 123" (`preview_seed.py:53-70`). `gitleaks dir --redact` dio "no leaks found" en los 7 archivos del alcance.
4. **Ningún producto inventado (S17).** Mi lectura independiente (`scratchpad/auditoria/verdad_seed.py` y `verdad_seed2.py`, con expresiones regulares propias) encuentra 53 productos. Las líneas de los 8 pedidos solo nombran productos reales, por peso y a su precio real (`preview_seed.py:53-70`), todas por encima de su mínimo.
   - **El delta de `seed.sql` solo agrega la unidad.** Los 7 valores anteriores de las 53 filas (slug, nombre, descripción, precio, imagen, stock y mínimo) son idénticos a los de `git show HEAD:supabase/seed.sql` (`assert` en `verdad_seed2.py`).
   - **La unidad sigue la regla de la migración** (`20261113000001_comercio_v1_esquema.sql:91-99`): 0 diferencias. Quedan 41 `kg`, 10 `piece` y 2 `package`.
   - **Mínimos y nombres:** los 12 productos que no son por kilo tienen mínimo 0, y no hay nombres duplicados.
5. **`supabase db reset` (por lectura; no hay Postgres, sigue como NEEDS-LIVE).** Creo que pasa, aunque no lo ejecuté:
   - **Columnas:** la migración `20261113000001:76-80` crea `price_unit text`, `stock_unit text` y `sale_modes text[]`. El `seed.sql` corre después de todas las migraciones.
   - **Tipos:** `'kg'` en el `VALUES` resuelve a `text`, y los dos `CASE` dan `text` y `text[]` (`ARRAY['money', 'weight']` y `ARRAY['pieces']`).
   - **CHECK** (`:114-123`): `price_unit_check` (41/10/2 dentro de kg, piece y package), `stock_unit_check` (kg o piece), `sale_modes_check` (subconjunto y cardinalidad 1 o más), `piece_price_needs_pieces` y `piece_stock_needs_pieces`. Lo que no es kg lleva `{pieces}` y `stock_unit = piece`, y lo kg lleva `{money,weight}`. También cumple `stock >= 0` y `min_quantity_kg >= 0` (`202608210001_precio_server_side.sql:50`).
   - **Disparadores:** `products_check_source_link` (`20261125000001:40-61`) sale enseguida porque `source_product_id` es nulo, y `products_log_price_change` es `AFTER UPDATE` (`20261113000001:289`).
   - **Verificaciones:** el bloque `DO $$` no cambia.
   - **Ninguna prueba ejecuta este SQL (ítem 6 de riesgo).** La consulta de `group by` que propone el autor es la comprobación correcta, y Eduardo la tiene que correr en su pila local.
6. **El rojo fue real, en las dos tandas.** Probado en exportaciones limpias de HEAD (`git archive HEAD | tar -x`) dentro de `scratchpad/auditoria/`:
   - **Tanda 1** (`red1.kyvo`): HEAD más **solo** `test_preview_catalog.py` da `Ran 29 tests`, `FAILED (failures=84, errors=10)` (`red1.txt`). Las fallas del contrato son aserciones, no importaciones. Por ejemplo: `test_database_products_are_exactly_the_seed_sql_catalogue`, `test_no_invented_name_is_in_the_database`, `/productos/` en 10 y 1 subpruebas, y el panel en 10 + 1 + 1 + 1 + 1. Los 10 errores son las pruebas del lector (no existe el módulo) y una búsqueda por nombre real.
   - **Tanda 2** (`red2.0SCl`): el código de TF1 con el `seed.sql` de HEAD da `Ran 35 tests`, `FAILED (failures=53, errors=17)` (`red2.txt`). Las 53 fallas son de `test_every_seed_sql_row_writes_the_unit_the_schema_rule_gives_it`, una por fila. Los 17 errores son el lector que rechaza el formato viejo ("Unexpected product columns"), y es lo esperado.
   - **Mis cifras no coinciden con las del autor**, que reporta 33 fallas y luego 67 más 2 errores. Él corrió conjuntos distintos (una versión anterior del lector y otras etiquetas). El sentido sí coincide: la prueba nueva falla contra la siembra de HEAD y contra el `seed.sql` de HEAD.
7. **Verde.** Corrí dos suites, una en el árbol y otra en una exportación limpia:
   - En el árbol, `manage.py test panel.test_preview_catalog panel.test_preview_seed config.test_preview` da **Ran 74 tests, OK**.
   - En una exportación limpia de HEAD más los 7 archivos de TF1 (`green.fuU4`), la suite completa da **Ran 1344 tests, OK** (14.7 s). Esa salida está en `green-full.txt`.
   - `ruff check` sobre los 5 archivos Python da "All checks passed!".
8. **Supuesto A7, lo que sigue siendo sintético** (comprobado en el código):
   - 4 zonas de entrega (`preview_seed.py`, `ZONES`).
   - 8 pedidos.
   - El perfil del administrador.
   - El tipo de cambio 18.50 (`urls_preview.py:26`).
   - Las compras de `/panel/compras/`: una por producto kg, con costo de 0.6 × el precio, y la página muestra 20.
   
   Los lotes abiertos quedan en 0: el delta quita `open_lots` y `_synthetic_open_lots`, y `test_no_lot_is_invented_seed_sql_has_no_lots_nor_piece_weights` lo fija (el mutante `lots-back` muere). Descuentos, tallas y pesos por pieza quedan en 0 (`test_nothing_that_changes_how_a_product_looks_is_invented`). **Lo que Eduardo debe confirmar por A7:** los costos al 60 % de `/panel/compras/`.

### Hallazgos
| ID | Gravedad | Estado | Dónde | Dueño | Resumen |
|---|---|---|---|---|---|
| F-56 | baja | confirmado con sonda | `backend/panel/preview_catalog.py:149-186` (frente a su docstring `:3-8`); `backend/panel/test_preview_catalog.py:73`, `:83` | backend-datos-3 | El lector acepta en silencio cualquier sentencia después de los dos `INSERT`. `seed.sql` con un `UPDATE products SET price_per_kg = 1 ...` o un segundo `INSERT INTO products` añadido al final da "ACCEPTED (53 products) price=289.00": la vista previa mostraría 289 y `supabase db reset` mostraría 1. Las pruebas de contrato leen solo hasta `DO $$`, así que tampoco lo ven. Es justo la divergencia de dos fuentes que S17 prohíbe, y contradice "raises `SeedFormatError` on anything else" |
| F-57 | info (pruebas que faltan) | confirmado con mutantes | `preview_seed.py:124`, `:127`, `:128` (descripción, stock, mínimo); `:91-94` (categorías en `refuse_foreign_products`); `test_preview_catalog.py:110-114` | backend-datos-3 | Sobreviven 4 de 15 mutantes: una descripción inventada ("(synthetic preview data)", la de HEAD), `stock` = 1, `min_quantity_kg` sin escribir y la mitad de categorías de la guardia de productos ajenos. Las tres primeras se ven en `/productos/<id>/` y en el carrito (el mínimo decide cuánto se puede pedir) |
| F-58 | info | sonda | `preview_catalog.py:49` (`\d`) | backend-datos-3 | `\d` acepta dígitos Unicode: un precio escrito con dígitos arábigos-índicos (`٢٨٩.00`) se lee como 289.00, mientras que Postgres rechazaría ese literal. Es la misma lección que F-47. Corrección: `[0-9]` o `re.ASCII` |
| F-59 | info (pendiente de S17 en el frontend) | confirmado por lectura | `src/data/semillaCatalogo.json`; `src/data/catalogo.ts:1`, `:69`, `:88`, `:116-117`, `:185-189`; `src/ui/presentacionProducto.ts:110-112`; `src/ui/Tarjeta.tsx:92`; `src/ui/CarruselCortes.tsx:42` | frontend | Quedan dos copias fuera de `seed.sql`. (a) **El catálogo:** `semillaCatalogo.json` (53 filas). Hoy coincide en nombre, categoría, precio e imagen con `seed.sql` (comprobado con un script), pero no trae la unidad. `cargarCatalogo()` lo usa cuando Supabase no responde en 2500 ms, y lo leen `useCatalogo` en `src/landing/Landing.tsx:27`, `src/ui/MenuHoja.tsx:62` y `src/ui/InsigniaDatos.tsx:4`. (b) **La regla de unidad:** `unidadDe(nombre)` solo distingue `kg` y `paquete` por el nombre, e ignora merch y otros. Además, `COLUMNAS_PRODUCTO` no pide `price_unit`. Después de TF1, la Gorra Bordada es `piece` en la base y sigue saliendo "/ kg" en `Tarjeta` y `CarruselCortes` |
| F-60 | info (documentación) | confirmado por lectura | `docs/diagramas/tp-vista-previa.html` (4 apariciones de `preview_seed.py:226`); `backend/README.md:124` | backend-datos-3 / diagramador-tp | El diagrama de TP cita líneas viejas y no dice de dónde salen los productos (el autor da el texto exacto en su informe). El README habla de "purchases and lots" inventados, y lotes ya no hay |

**Correcciones propuestas.**
- F-56: después del alias, exigir que el resto del texto sin comentarios sea exactamente el bloque `DO $$ ... END $$;` conocido, o rechazar cualquier palabra `INSERT`, `UPDATE`, `DELETE`, `ALTER` o `COPY` fuera de los dos tramos leídos. Una prueba que lo fije: `parse_seed(base + "\nUPDATE products SET price_per_kg = 1;\n")` debe lanzar `SeedFormatError`. Y en el contrato, leer el bloque de productos hasta `) AS v(` y comprobar que no hay otro `INSERT INTO products` ni ningún `UPDATE products` en todo el archivo.
- F-57: en `database_products()`, sumar `description`, `stock` y `min_quantity_kg` (y en `seed_sql_products()`, los mismos grupos que ya captura `PRODUCT_ROW`). Agregar una prueba que cree `Category(pk=1, slug="otra")` y espere `CommandError` sin escribir nada.

### Mutantes (exportación limpia `scratchpad/auditoria/green.fuU4`, script `mut_tf1.py`, salida `mut_tf1.txt`)
Línea base: 74 pruebas en OK.
- **Muertos (11):** la comprobación de unidad, la del `SELECT`, la del alias, la del fixture y la de la categoría del lector; `price_unit` sin escribir (15 fallas); imagen vacía (108); la guardia de productos ajenos apagada; el precio de la línea +1 (11); la guardia de SQLite; los lotes de 1.8 kg de vuelta.
- **Sobreviven (4):** `desc-invented`, `stock-invented`, `min-dropped` y `refuse-categories-off` (F-57).

### Estado del candado (recibo de la ronda en L31, para TF1)
- **1 Seguridad:** esta sección es la revisión del `auditor-3`, y `gitleaks` da 7/7 limpio. Siguen pendientes GGA en el commit y `security-review`, que corre el lead. Engram #1159, #1161, #1570 y #1091: los cito según el resumen del lead del 2026-11-25, no los releí. TF1 no toca `pyproject.toml`, `uv.lock`, `package.json` ni `package-lock.json` (`git status` del alcance), así que no se ejecutó `supply-chain-risk-auditor`.
- **2 REA:** "no aplica, requiere el OK de Eduardo" (L31). No lo decido yo, y sin ese OK el ítem queda abierto.
- **3 Diseño:** "no aplica, requiere el OK de Eduardo" (L31). Igual.
- **4 Patrones y diagramas: abierto.** `docs/diagramas/tp-vista-previa.html` no está actualizado (F-60), y el autor deja la regeneración a `diagramador-tp`. Para TF1, L31 pide actualizarlo porque el nodo de la siembra ahora describe el origen de los productos. Mermaid abajo.
- **5 roadmap.sh:** cubierto. El autor cita `roadmaps/django/content/fixtures@3CnuISrkDffQgys-x0AP4.md`, y el archivo existe (comprobado con `ls`). La decisión de usar `categories.json` como comprobación cruzada y no con `loaddata` es coherente con S17.
- **6 Big School:** cubierto. TDD, p. 9 (`temario.md:198`): comprobé el rojo de las dos tandas en exportaciones limpias (respuesta 6).
- **7 Videos: sin evidencia en el informe de TF1.** L31 asigna `scout-youtube-3`. No vi su salida, así que el ítem queda abierto hasta que el lead la adjunte o Eduardo dé su OK.

### Patrones (Mermaid; la skill `archify` no está en este agente)
```mermaid
flowchart LR
  SQL[("supabase/seed.sql (53 productos, 9 categorías)")] -->|"ruta fija preview_catalog.py:25"| P["parse_seed :149 (lector acotado, SeedFormatError :55)"]
  FX["inventory/fixtures/categories.json"] -->|"comprobación cruzada load_catalog :193-208"| P
  P --> H["Command.handle preview_seed.py:206 (Template Method de BaseCommand)"]
  H -->|"guardia CARNI_PREVIEW + SQLite :207"| R["refuse_foreign_products :87"]
  R --> C["seed_catalog :102, update_or_create por id :107, :119"]
  C --> DB[("SQLite de la vista previa")]
  DB --> G["PreviewGateway urls_preview.py:29 (sustituye al Facade PostgresGateway, services.py:167)"]
  G --> V["/productos/ y /panel/"]
  P -. "F-56: no rechaza sentencias extra" .-> SQL
```
**Confirmados:**
- **Template Method:** `BaseCommand.execute` es el algoritmo fijo y `handle` es el paso que llena la subclase (`preview_seed.py:203`, `:206`).
- **Facade, el `PostgresGateway`:** `services.py:167`. Su instancia vive en `_gateway` (`:411`), detrás de `get_gateway()` (`:414`), y la vista previa la reemplaza con la misma interfaz.

**Analogías, no patrones del código:**
- **El reemplazo como Strategy:** el autor lo llama así, pero lo sigo leyendo como en la sección 11. Se cambia por configuración, no en tiempo de ejecución.
- **El lector como Adapter:** tampoco lo es. Es un traductor de formato con validación estricta.

### Pruebas y escaneos de esta revisión
- **Pruebas:**
  - En el árbol: `manage.py test panel.test_preview_catalog panel.test_preview_seed config.test_preview` da **Ran 74 tests, OK**.
  - En la exportación limpia con TF1: la suite completa da **Ran 1344 tests, OK**.
  - Rojo: tanda 1 con `failures=84, errors=10`, tanda 2 con `failures=53, errors=17`.
  - Mutantes: 11 de 15 muertos.
- **Sondas del lector:** 12 casos en `sonda_parser.txt`. La lectura independiente de `seed.sql` (contra HEAD y la regla de la migración) está en `verdad_seed2.py`.
- **Escaneos:** `gitleaks dir --redact` da 7/7 "no leaks found", y `ruff check` da "All checks passed!".
- **No ejecutado:** el SQL (no hay Postgres) ni las pruebas del frontend.
- **Seguridad del proceso:** ningún `.env` leído, y la vista previa viva (127.0.0.1:8000) no se tocó.
- **Scratch:** todo queda en `/private/tmp/claude-501/-Users-felipeeduardotorresaguilar-Desktop-Carni-mvp/c2a785f1-cb79-4db1-b700-d25bfefbfb85/scratchpad/auditoria/` (`red1.kyvo/`, `red2.0SCl/`, `green.fuU4/`, `seed.head.sql` y los `.txt` y `.py` citados). No lo borro.

Riesgo de esta revisión: `Risk: none` (solo texto en este documento). Sobre TF1: el autor declara `Risk: none` en datos de producción, pero `supabase/seed.sql` es un archivo que otros consumen y ningún test ejecuta. Para mí cae en los ítems 3 y 6, de forma acotada, y esta sección hace de verificación independiente. No cambia el veredicto.

### Recibo de recursos de esta revisión
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | `security-and-hardening` leída (`SKILL.md:21-36`: modelo de amenazas, con el límite de confianza en `seed.sql` -> sondas y F-56; integridad -> F-58). OWASP A03 (inyección: valores por el ORM, `cursor.execute` parametrizado `preview_seed.py:196`) y A04 (diseño: dos fuentes, F-56 y F-59). gitleaks 7/7. `supply-chain-risk-auditor` leída, no ejecutada: sin cambios de manifiestos. Engram #1159, #1161, #1570 y #1091 según el resumen del lead, no releídos. `security-review` pendiente del lead |
| 2 | REA | no aplica | revisión de seguridad de datos propios |
| 3 | Diseño | no aplica | sin interfaz |
| 4 | Patrones y diagramas | parcial | Mermaid arriba con patrones confirmados y analogías rotuladas; el Archify de TP está desactualizado (F-60) |
| 5 | roadmap.sh | usado | `roadmaps/django/content/fixtures@3CnuISrkDffQgys-x0AP4.md` (comprobé que existe y su relación con la decisión del fixture) |
| 6 | Big School | usado | `temario.md:198` (TDD, p. 9: rojo comprobado en dos exportaciones limpias; mutantes -> F-57) |
| 7 | Videos | no usado | sin consulta en esta revisión |

Needs skill: security-review - diff de TF1: `backend/panel/preview_catalog.py`, `backend/panel/test_preview_catalog.py`, `backend/panel/management/commands/preview_seed.py`, `backend/panel/test_preview_seed.py`, `backend/config/urls_preview.py`, `backend/README.md`, `supabase/seed.sql`.

### 14.1 Recheck de la corrección de TF1 (2026-11-25, limitado a F-56, F-57, F-58 y la parte del README de F-60)

Archivos que cambiaron desde la revisión de la sección 14 (`cmp` contra `scratchpad/auditoria/green.fuU4`): `backend/panel/preview_catalog.py`, `backend/panel/test_preview_catalog.py`, `backend/panel/test_preview_seed.py` y `backend/README.md`. `seed.sql`, `preview_seed.py` y `urls_preview.py` no cambiaron.

| ID | Estado | Evidencia |
|---|---|---|
| F-56 | **cerrado** para lo reportado; queda un residuo, F-61 (info) | `WRITE_STATEMENT` (`preview_catalog.py:55-59`) y `_refuse_other_writes` (`:156`, llamada en `:199`) revisan el texto fuera de los dos `INSERT` leídos, también dentro de `DO`. Mis sondas (`scratchpad/auditoria/sonda_f56.py`, salida `sonda_f56.txt`) dan **refused** para un `UPDATE` al final, un segundo `INSERT`, `UPDATE public.products`, `update` en minúsculas, `DELETE FROM ONLY`, un `UPDATE` dentro de `DO` y un `INSERT` señuelo dentro de `/* */`. Un `UPDATE orders` se sigue aceptando, como debe. Pruebas que lo fijan: `test_preview_catalog.py:295` (8 sentencias, antes y después: 16 subpruebas), `:313` (las lecturas del bloque `DO` siguen aceptadas) y `:151`, que revisa todo el `seed.sql` real y ya no se queda en `DO $$`. **Rojo real:** las pruebas corregidas contra el lector de la sección 14 dan `Ran 33 tests, FAILED (failures=17)`: 16 de `test_it_refuses_any_other_statement_that_writes_the_catalogue` y 1 de F-58 (`red-f56.txt`) |
| F-57 | **cerrado** | `database_products()` (`test_preview_catalog.py:123`) y su lectura independiente ahora incluyen descripción, stock y mínimo, y hay una prueba nueva para la categoría ajena (`test_preview_seed.py:162`). Mis 15 mutantes sobre el código corregido (`green2.7lW6`, salida `mut_tf1_recheck.txt`): **15 de 15 muertos**, incluidos los 4 que antes sobrevivían (`desc-invented`, `stock-invented`, `min-dropped` y `refuse-categories-off`) |
| F-58 | **cerrado** | `TOKEN` usa `[0-9]` (`preview_catalog.py:50`). Sonda con dígitos arábigos-índicos: "refused: Unexpected value in a VALUES row: '٢'". Prueba: `test_preview_catalog.py:320`, que falla contra el lector anterior |
| F-60 (README) | **cerrado** | `backend/README.md:124-126` ahora dice que las compras se inventan a partir de los productos por kilo y que "there are no open lots". En `:130-131` agrega el rechazo de las escrituras fuera de los dos `INSERT`. La parte del diagrama de F-60 sigue abierta y la cierra `diagramador-tf1` (ítem 4) |

**F-61 (info, nuevo; queda como seguimiento y no abre otra corrección).** `WRITE_STATEMENT` es una lista de lo prohibido, y algunas formas de escribir el catálogo la esquivan. Mis sondas aceptan:
- `UPDATE "products" ...` y `UPDATE public."products" ...` (identificador entre comillas);
- `UPDATE /* x */ products ...` (comentario de bloque en medio);
- un vaciado de la tabla con `TRUNCATE` después de los `INSERT`;
- `MERGE INTO products ...`;
- SQL dinámico armado con concatenación dentro de `DO` (`EXECUTE 'UPD' || 'ATE products ...'`).

Ninguna aparece hoy en `seed.sql`, que vive en el repo y pasa por revisión. El riesgo es que una edición futura vuelva a separar la vista previa de lo que construye `supabase db reset`.

Corrección propuesta, para una tanda futura: una lista de lo permitido en lugar de una de lo prohibido. Fuera de los dos `INSERT`, el texto sin comentarios (los de bloque incluidos) solo puede ser el vaciado inicial y el bloque `DO $$ ... END $$;` de verificaciones. Se puede comparar contra su texto normalizado o su hash, de modo que cualquier otra sentencia lance `SeedFormatError`.

**Pruebas de este recheck**
- En la exportación limpia de HEAD más los 7 archivos corregidos (`scratchpad/auditoria/green2.7lW6`):
  - suite completa: **Ran 1349 tests, OK** (13.9 s), salida en `green2-full.txt`;
  - los tres módulos de la vista previa: **Ran 79 tests, OK**;
  - `ruff check`: "All checks passed!".
- Las "129 enfocadas" del autor salen de etiquetas distintas a las mías; no lo comprobé.
- `gitleaks dir --redact` da "no leaks found" en los 4 archivos que cambiaron.
- Ningún `.env` leído.

**Candado de TF1 después del recheck**
- **Ítem 7 (Videos):** queda cubierto con la evidencia del lead para el recibo de L32. Verifiqué dos citas contra la transcripción local `~/agentic-global/claude/raw/transcripts/3spCFnMSGIY.txt`:
  - línea 122, [1:32:59]: "esta tabla no existe, estos campos no existen";
  - línea 126, [1:36:01]: "Otra cosa importante aquí también es las fuentes de verdad".
  
  La tercera (`?t=4926`) la cito como verificada en L21, no por mí.
- **Ítem 1:** siguen pendientes GGA en el commit y `security-review` sobre el diff final, que corre un revisor aparte.
- **Ítems 2 y 3:** "no aplica", requieren el OK de Eduardo.
- **Ítem 4:** abierto hasta que termine `diagramador-tf1`.
- **Ítems 5 y 6:** sin cambios, cubiertos.

Riesgo de este recheck: `Risk: none` (solo texto en este documento).

**Actualización: ítem 4 y comentarios de TP (2026-11-25).**
- **Ítem 4, cerrado.** `docs/diagramas/tp-vista-previa.html` (784 520 bytes, 09:50) tiene 0 rutas absolutas (`grep -c "/Users/"` = 0) y `gitleaks` lo da limpio.
  - **Citas:** extraje sus 51 citas distintas `archivo:línea` y comparé cada una con el disco. Todas apuntan a lo que el diagrama nombra:
    - la siembra: `preview_seed.py` `:87` `refuse_foreign_products`, `:102` `seed_catalog`, `:107`/`:119` `update_or_create`, `:150` `seed_orders`, `:203`/`:206` `Command`/`handle` y `:207`/`:213` las guardias;
    - el lector: `preview_catalog.py` `:26` `SEED_SQL`, `:55` `WRITE_STATEMENT`, `:62` `SeedFormatError`, `:156` `_refuse_other_writes`, `:171` `parse_seed`, `:218` `load_catalog` y `:231` el cruce con el fixture;
    - el gateway y el middleware: `urls_preview.py` `:29` `PreviewGateway`, `:42` `quote_cart`, `:61` `_synthetic_purchases`, `:125`/`:136` `LoopbackOnlyMiddleware` y `:141` `install_preview_gateway`;
    - los ajustes: `settings_preview.py` `:22`, `:28`, `:46`, `:64`, `:69` y `:76`;
    - el resto: `ventas/services.py:414` `get_gateway`, `panel/access.py:118`, `panel/models.py:87` y `:177`, `ventas/catalog.py:47`, `ventas/views/productos.py:43` y `:113`, `preview.sh:13`, `:31` y `:32`, y `seed.sql:38` y `:57`.
  - **Las de `panel/views.py`** (`:127`, `:136`, `:143`, `:151`, `:162` y `:179`) coinciden en el árbol y en `HEAD`. Esto importa porque `views.py` tiene cambios de T7d sin commitear que no entran en TF1.
  - **Dos matices, sin efecto sobre el cierre:**
    - (1) "Synthetic lots from the real kg products" (`urls_preview.py:61`) se refiere a los lotes de **compra** de `/panel/compras/`, no a lotes abiertos, que ya no hay. La palabra puede confundir.
    - (2) El diagrama rotula **Strategy** el reemplazo de `PostgresGateway` por `PreviewGateway`. Yo lo leo como el Facade de `services.py:167` sustituido por configuración (secciones 11 y 14). Es una diferencia de nombre: la evidencia `archivo:línea` es correcta.
  - **El "finalize en verde con Brave, 0 diagnósticos"** lo reporta `diagramador-tf1`; no lo repetí.
- **Comentarios de TP: no tocan ninguna guardia.** `git diff -U0` de `backend/config/settings_preview.py` y `backend/scripts/preview.sh` solo cambia líneas de docstring y de comentario: el filtro de líneas que no empiezan por `#` ni `"""` da 0. `bash -n` pasa.
  - **Guardias en su sitio:** `RENDER` (`:22`), la ruta (`:28`), el directorio `0o700` (`:46`), `PYTHON_DOTENV_DISABLED` (`:64`), el secreto aleatorio (`:69`), el `127.0.0.1` de `preview.sh` y `set -euo pipefail` (`:13`).
  - **Pruebas:** `config.test_preview`, `panel.test_preview_seed` y `panel.test_preview_catalog` dan **Ran 79 tests, OK**.
- **Candado de TF1 tras esta actualización:**
  - 4, 5, 6 y 7: cubiertos.
  - 1: siguen pendientes GGA en el commit y `security-review` sobre el diff final.
  - 2 y 3: "no aplica", requieren el OK de Eduardo.

## 15. Rebanada 10: T7m, maqueta navegable del panel, versión 1 (2026-11-25, sin seguimiento; revisión del `auditor-3`)

Alcance: `docs/design/maquetas/panel/` completo:
- `index.html`;
- `css/panel.css` y `css/fonts.css`;
- `js/app.js`, `catalog.js`, `data.js`, `fire.js`, `icons.js` y `productos.js`;
- `img/` (36 webp) y `fonts/` (2 woff2), cada uno con su licencia.

Es una maqueta de diseño que se abre por `file://`, no código de producto. Informe del autor: `scratchpad/t7m/frontend-3.md`.

**Versión revisada.** Mientras revisaba, la carpeta siguió cambiando: `app.js` y `productos.js` a las 09:49, y `catalog.js` a las 09:47. Por eso esta sección vale para la instantánea `scratchpad/auditoria/t7m-v1/panel/` de las 09:51, con los SHA-256 de los HTML, CSS y JS en `t7m-v1/sha256.txt`. Volví a correr todos los escaneos sobre esa copia. El delta de la iteración de diseño irá en 15.1.

### Veredicto
**La maqueta se puede abrir para Eduardo y entrar al repo como documento de diseño: no hay hallazgos bloqueantes.** No hace peticiones externas, no trae secretos ni datos reales de clientes, y no usa servidor. Tiene respaldo sin WebGL y respeta `prefers-reduced-motion`. Su catálogo coincide campo por campo con `supabase/seed.sql`. Los hallazgos son notas para la implementación (F-63) y dos avisos (F-62, F-64).

### Respuestas
1. **Sin peticiones externas.**
   - **URLs:** `grep` de `https?://` en `index.html`, `css/panel.css` y `js/*.js` solo encuentra el espacio de nombres `http://www.w3.org/2000/svg` (`app.js:5`, `icons.js:3`), que no es una petición. `css/fonts.css` tiene 0 URLs `http`, solo 2 `url(data:font/woff2;base64,...)`.
   - **Red y almacenamiento:** 0 coincidencias de `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `import(`, `new Worker`, `localStorage`, `sessionStorage` y `document.cookie` en los 7 archivos.
   - **Scripts:** los seis `<script>` llevan `src` local (`index.html:375-380`). `fire.js` no carga texturas: 0 coincidencias de `texImage2D`, `new Image` y `createImageBitmap`.
   - **CSP:** la meta de `index.html:6` es `default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; font-src 'self' data:`, así que el navegador bloquearía cualquier origen externo. Los informes del autor (`scratchpad/t7m/final/*-report.json`) registran `console: []` y `exceptions: []` en las 7 corridas, y una violación de CSP habría aparecido como error en consola. No hice una corrida propia con registro de red: la conclusión es por lectura más esos informes.
   - **Imágenes:** las 36 de `img/` son byte a byte las de `public/img/products/` (`cmp`, 0 diferencias).
2. **Secretos y datos personales.**
   - `gitleaks dir docs/design/maquetas/panel --redact` da "no leaks found" (2.01 MB escaneados).
   - Los clientes de `js/data.js:32-38` no tienen teléfono, correo ni dirección: solo nombre. Ninguno de los cuatro que busqué aparece en otra parte del repo (`grep -rl` vacío), y la interfaz los rotula como "Pedidos de muestra" (`index.html:37`, `:50`). Ver F-62.
3. **Servidor.** No hay: se abre por `file://` y no existe ningún script de servidor en la carpeta. No aplica el requisito de `127.0.0.1`.
4. **Respaldo sin WebGL y movimiento reducido.**
   - **Sin WebGL:** `fire.js:15` (sin contexto), `:66` (error al compilar) y `:121` (`webglcontextlost`) pasan a `fire--static`. El anillo CSS de respaldo está en `panel.css:119`.
   - **Movimiento reducido:** `fire.js:80` usa `matchMedia("(prefers-reduced-motion: reduce)")` y pinta un solo cuadro. `panel.css:236`, `:237`, `:288` y `:291` cubren la entrada y los diálogos.
   - **Ahorro:** el fuego se pausa con `IntersectionObserver` (`fire.js:117`) y `visibilitychange` (`:118`).
   - **Evidencia del autor**, comprobada en sus JSON: `C-nowebgl-report.json` da `"a0": "hero fire--static"` y 0 errores en 1440 y 390, y `B-reduced-report.json` da 0 errores.
5. **`js/catalog.js` contra `supabase/seed.sql` del árbol** (mi lectura independiente, `scratchpad/auditoria/verdad_catalog_js.py`, salida en `verdad_catalog_js.txt`):
   - 53 de 53 productos con los mismos nombres;
   - 0 diferencias en categoría, descripción, precio, imagen, stock, mínimo, unidad y modos de venta (`kg` da `money, weight`; `piece` y `package` dan `pieces`, la regla de `seed.sql:72-73`);
   - las 9 categorías iguales (nombre, slug, imagen y orden);
   - cada campo `line` apunta a la línea de `seed.sql` que contiene ese nombre (0 fallos);
   - ids de 1 a 53 en el orden de `seed.sql`.
   
   La comprobación la corrí sobre el `catalog.js` de las 09:47, el último en disco a las 09:51.

### Hallazgos
| ID | Gravedad | Estado | Dónde | Dueño | Resumen |
|---|---|---|---|---|---|
| F-62 | info | confirmado por lectura | `docs/design/maquetas/panel/js/data.js:32-38` | frontend-3 | Los 24 clientes de muestra tienen nombres creíbles de personas y negocios de San Luis Potosí ("Restaurante La Huasteca", "Taquería El Güero"), sin la marca de sintético que usa la vista previa ("Test", `+52 444 000 01xx`, `preview_seed.py:53-70`). No llevan teléfono ni dirección, y la pantalla dice "Pedidos de muestra". Aun así, un nombre de negocio puede coincidir con uno real de la ciudad, y en una captura que circule parecerían clientes reales. Corrección: nombres que no puedan confundirse con reales (por ejemplo, con el sufijo "(muestra)") |
| F-63 | info (notas para la implementación con CSP `'self'`) | confirmado por lectura | ver la lista de abajo | frontend (T7d) | La maqueta cumple su propia CSP sin `unsafe-inline`: 0 `<style>`, `style=`, `on*=` y `<script>` en línea en `index.html`. Hay cinco patrones que deben cambiar o mantenerse al pasar a Django (lista abajo) |
| F-64 | info (requisito de implementación) | confirmado por lectura | `js/data.js:12` (`COST_RATIO`); vistas de margen y ganancia de `app.js` | frontend (T7d) | La maqueta muestra costo, margen y ganancia con proporciones de muestra. Al implementarlo con datos reales aplica F-52: el costo es secreto del negocio, y cuando entren los roles de colaboradores (S16) necesita su propio permiso, con una prueba de que un colaborador no lo ve |

**F-63, patrones y qué hacer al implementar:**
- **(a) Sprite de íconos.** `icons.js:3` mete en el DOM, con `innerHTML`, un SVG que es una cadena fija, sin datos del usuario, así que hoy no hay inyección. En Django conviene servir el sprite como un archivo `.svg` estático y usar `<use href="/static/.../icons.svg#i-...">`, o incluirlo en la plantilla. Así no queda ningún `innerHTML` y el panel queda listo para Trusted Types.
- **(b) Estilos desde JS.** `app.js:46` (posición del tooltip), `:480` y `productos.js:226` (`transform` de las barras) escriben estilos por CSSOM (`el.style.x = ...`). CSP `style-src 'self'` lo permite, porque CSSOM no lo regula. Al pasarlo a plantillas, **no** convertirlo en atributos `style=""`: eso exigiría `unsafe-inline` (ver la sección 8). Mantenerlo por CSSOM o usar atributos de SVG.
- **(c) La política misma.** La meta amplía `img-src` con `data:` y `blob:`, y `font-src` con `data:` (`fonts.css` incrusta 128 KB en base64 que duplican `fonts/*.woff2`). En el panel real hay que servir los `.woff2` como archivos estáticos y quitar `data:` de `font-src`. Tampoco hace falta `blob:` en `img-src`: el CSV usa `blob:` en un `<a download>`, que no es una imagen. Además, sumar `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` y, en cabecera, `frame-ancestors 'none'`. Una meta no puede fijar este último.
- **(d) Exportación CSV.** `app.js:521` pone comillas a las celdas, pero no neutraliza fórmulas. Hoy solo exporta fechas, números y la etiqueta de la serie. Si la implementación exporta nombres de productos o de clientes, cualquier celda que empiece con `=`, `+`, `-` o `@` debe llevar `'` delante (OWASP, CSV injection), con una prueba.
- **(e) Lo que hay que conservar.**
  - Todo el DOM se arma con `textContent` y `createElement` (`app.js:25-26`). En Django eso equivale al escape automático, sin `|safe`.
  - El parámetro `q` de la ruta por hash solo llega a `input.value` (`productos.js:339`), así que es seguro. En el panel real, el filtro se valida en el servidor.
  - El editor de producto (`index.html:212`, `<form ... novalidate>`) no envía nada en la maqueta. Implementado, necesita CSRF, validación en el servidor y `panel_admin_required`.

**Notas de proceso (no son de seguridad).**
- `catalog.js` es una copia del catálogo **generada** desde `seed.sql`, y su generador vive en el scratch del autor (`scratchpad/t7m/tools/gen_catalog.py`), no en el repo. Para una maqueta de diseño es aceptable, pero con el tiempo se desfasará. La implementación (S17) debe leer los productos de la base, nunca de `catalog.js`.
- La carpeta suma 1.7 MB de imágenes que ya están en `public/img/products/`. Si entra al repo, conviene apuntar a `../../../../public/img/products/` y no duplicarlas, siempre que la CSP de `file://` lo permita. Eso lo decide quien haga el commit.

### Estado del candado de T7m (7 ítems del kit)
- **1 Seguridad:** cubierto por esta sección; `gitleaks` limpio. La maqueta no cambia código de producto ni dependencias: no trae `package.json`, lucide va como sprite SVG con su licencia ISC (`js/LICENSE-lucide`) y las fuentes van con su OFL (`fonts/LICENSE-*`). Por eso no se ejecutó `supply-chain-risk-auditor`. GGA corre en el commit. Si `security-review` aplica a un documento de diseño, lo decide el lead.
- **2 REA:** "no aplica, requiere el OK de Eduardo" (L31: T7m estudia páginas públicas de diseño, no flujos de la competencia). Abierto hasta ese OK.
- **3 Diseño: parcial, con decisiones de Eduardo pendientes.**
  - **Usadas:** el informe nombra 9 skills invocadas, cada una con lo que cambió en la maqueta: `design-references`, `modern-web-guidance`, `high-end-visual-design`, `design-taste-frontend`, `ui-ux-pro-max`, `dataviz`, `animate` + `emil-design-eng`, `impeccable` y `hallmark`. Están en `frontend-3.md:29-38`. Esa evidencia es del autor; no repetí sus invocaciones.
  - **Del kit, marcadas "no usada" con razón, para el OK de Eduardo:** `gsap-*`, `awwwards-animations`, `animated-component-libraries`, `apple-design` y `awesome-design-md` (`frontend-3.md:39`). Por la regla del kit, sin ese OK el ítem no se cierra.
  - **Huecos que el propio informe declara:** no estudió Kemi Ferretería (`frontend-3.md:50`), y S18 pide superarla. Tampoco cita `postmortem-carni-diseno.md`, que el recibo de L31 lista para T7m (`grep` vacío en el informe). Ambos van al lead.
- **4 Patrones y diagramas: no aplica a la maqueta según L31** ("la maqueta no es código y su diagrama llega con la implementación"). Queda pendiente para T7d.
- **5 roadmap.sh: cubierto (actualizado con las rutas que dio el lead).** Los 10 archivos existen en `~/Desktop/recursos-agentes/kamranahmedse/developer-roadmap/roadmaps/` (`ls` y su título):
  - de `bi-analyst/content/`: `dashboard-design@KXhNou5nlekbSTfLYPs_8.md`, `metrics-and-kpis@c0ywBrs9u7MciWAXSgVVg.md`, `lineplot@BVDaFmDat48nN3hj5NE71.md`, `heatmap@SNkYi2VZsCRG31v63v8_x.md` y `misleading-charts@qGVDuU9RA9Y5g5vlPd-xq.md`;
  - de `design-system/content/`: `input-switch@NISeaJUlDtQ0kSuyxmrOT.md`, `modal@IjNitkG25vNo30rB4ckNV.md`, `tabs@1vYR1EMyZhJA-znxnFBBb.md`, `dark-mode@kxUnqpydDwB73IwrCPZM0.md` y `buttons@s6oqvHgwK4Cwyx-JENBbY.md`.
  
  La sección "Frontend Performance Best Practices (40 items)" está en `~/agentic-global/shared/skills/roadmap-sh/references/best-practices.md:235`. La "Ronda 2" del informe del autor (`frontend-3.md`, "Checklist de roadmap.sh (por número)") aplica cada uno por número con su cambio en la maqueta. Ejemplos: meta por KPI (2), eje Y desde $0 (5) y switch con estado en texto (6). Comprobé que las rutas existen y que el informe las aplica; no volví a evaluar cada punto en la maqueta.
- **6 Big School: cubierto (evidencia del lead).** `~/agentic-global/shared/skills/desarrollo-con-ia-criterio/references/temario.md:199` (pp. 11-12) dice: "fuentes de verdad ('la base está en /context/database.sql')… Sin él, la IA inventa tablas y estilo". Se aplica en que `js/catalog.js` se genera desde `supabase/seed.sql`, y yo lo verifiqué con 53 de 53 productos y 0 diferencias (respuesta 5).
- **Actualización del ítem 3 (evidencia del lead).** La "Ronda 2" del informe sí estudia Kemi (captura 2.58.22 a.m.: precio tachado y estado del switch en texto) y el Figma Make (2.42.28 p.m. y 2.48.00 p.m.: precio de compra con margen). Siguen pendientes:
  - el OK de Eduardo para las 5 skills marcadas "no usada";
  - el estudio de las `vista*.png` y la cita de `postmortem-carni-diseno.md`, que el lead asigna a `frontend-4` junto con la corrección de F-62.
  
  Lo reviso en 15.1. El campo nuevo "Precio de compra" de la Ronda 2 cae dentro de F-64.
- **7 Videos: cubierto.** Verifiqué las tres citas contra las transcripciones locales:
  - `https://youtu.be/3vOqsRTmRaE?t=762`: `3vOqsRTmRaE.ts.txt:17`, [0:12:42], "variables del design system, patrón container presentacional … requerimientos no funcionales, tiene que tener accesibilidad".
  - `?t=1383`: `:30`, [0:23:03], "estábamos utilizando grafana y estábamos viendo todos los estatus".
  - `https://youtu.be/Qik3jCutIrI?t=3545`: `Qik3jCutIrI.ts.txt:78`, [0:59:05], "lo primero que haces es recoger requerimientos, hablar con el cliente, entender sus necesidades, definir qué es lo que tienes que construir".
  
  Los tres empiezan en el segundo exacto que se cita.

### Patrones
La maqueta no es código de producto y L31 deja su diagrama para la implementación. Lo que la maqueta sí usa, sin rotularlo como patrón GoF:
- **Módulos IIFE** que publican un único objeto en `window`: `CARNI_CATALOG` en `catalog.js:5` y `CARNI_PRODUCTS` en `productos.js:336`.
- **Ruteo por hash** (`app.js:91-105`).

Ninguno es un patrón del catálogo de refactoring.guru. Llamar Facade al objeto global sería solo una analogía.

### Pruebas y escaneos de esta revisión
- Escaneos estáticos sobre la instantánea `t7m-v1` (09:51): URLs, red, sumideros de código (`eval`, `innerHTML` y similares), código en línea y estilos por JS. Resultados arriba.
- `gitleaks dir --redact`: "no leaks found".
- Catálogo: `verdad_catalog_js.py`, con 0 diferencias.
- Imágenes: `cmp` contra `public/img/products/`, con 0 diferencias.
- **No ejecutado:** una corrida propia en Brave con registro de red, y lectores de pantalla.
- Ningún `.env` leído.

Riesgo de esta revisión: `Risk: none` (solo texto en este documento).

### Recibo de recursos de esta revisión
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | `security-and-hardening` (datos no confiables -> sumideros del DOM, F-63 (a) y (e)); OWASP A03 (XSS: `textContent`, sin `innerHTML` con datos), A05 (CSP, F-63 (c)) y CSV injection (F-63 (d)); gitleaks limpio |
| 2 | REA | no aplica | revisión de seguridad de una maqueta |
| 3 | Diseño | no aplica | no evalúo el diseño; solo listo la evidencia del autor para el candado |
| 4 | Patrones y diagramas | parcial | sin diagrama, por L31; patrones observados arriba, sin forzar GoF |
| 5 | roadmap.sh | no usado | sin consulta propia |
| 6 | Big School | no usado | sin consulta propia |
| 7 | Videos | usado | 3 citas del lead verificadas contra `~/agentic-global/claude/raw/transcripts/` (arriba) |

### 15.1 Delta de T7m: rondas 2 y 3 (2026-11-25, contra la instantánea v1 de las 09:51)

**Qué cambió.** Comparé los SHA-256 actuales (`scratchpad/auditoria/t7m-v2-sha.txt`) con `t7m-v1/sha256.txt`:
- cambiaron 4 archivos: `index.html`, `css/panel.css`, `js/data.js` y `js/productos.js`;
- quedaron iguales `js/app.js`, `js/catalog.js`, `js/fire.js`, `js/icons.js` y `css/fonts.css`;
- `diff -rq` no muestra cambios en `img/` ni en `fonts/`.

**Veredicto: la maqueta pasa. Se puede commitear y abrir para Eduardo.** F-62 queda cerrado y no hay hallazgos nuevos.

**Comprobaciones del delta:**
- **Sin peticiones externas nuevas.**
  - **URLs:** `grep` de `https?://` en los HTML, CSS y JS solo encuentra el espacio de nombres SVG.
  - **El motivo "picado de lámina":** son dos `mask: url("data:image/svg+xml,...")` en `panel.css:508-509`. Los decodifiqué: un SVG de 114 caracteres con un solo `<path>`, sin `href`, `<image>`, `<script>`, `<foreignObject>` ni manejadores `on*`. Los otros dos `url()` son referencias internas a gradientes (`#flowFill` y `#sparkFill`).
  - **Red y almacenamiento:** 0 coincidencias de `fetch`, XHR, WebSocket, `sendBeacon`, `import(`, Worker, almacenamiento o cookies.
  - **CSP:** la meta de `index.html:6` no cambió (`diff` contra v1).
  - **Scripts:** los seis llevan `src` local, ahora con `defer` (`index.html:400-405`). En `index.html` siguen 0 `<style>`, `style=`, `on*=` y scripts en línea. El único `innerHTML` sigue siendo el sprite fijo de `icons.js:3`.
  - **Escaneo de secretos:** `gitleaks dir docs/design/maquetas/panel --redact` da "no leaks found".
- **F-62: cerrado.** `js/data.js:32-40` trae 24 clientes visiblemente ficticios: nombre de pila más "Ejemplo" o "Muestra", y también "Taquería de Muestra" y "Restaurante de Ejemplo". No tienen teléfono ni dirección. `grep` de los nombres anteriores ("Huasteca", "Güero", "Don Chuy", "Martínez", "Hernández") en `js/` e `index.html` no encuentra nada.
- **`js/catalog.js` sigue igual que `seed.sql`.** El hash no cambió, y mi lectura independiente (`verdad_catalog_js.py`, contra el `seed.sql` actual, que desde la sección 16 solo cambió el factor de libra) da:
  - 53 de 53 productos;
  - 0 diferencias de campo;
  - 9 categorías iguales;
  - las referencias de línea correctas.
  
  `catalog.js` no guarda `price_per_lb`, y la maqueta no calcula libras (`grep` de `0.4536`, `0.45359` y `2.2046` vacío).
- **El código nuevo de `productos.js`** (orden con `aria-sort`, "Precio oferta" y SKU de maqueta) arma el DOM con `el(...)` y `textContent`, y escribe atributos fijos (`aria-sort`, `title` y `data-label`). No agrega sumideros: `grep` de `innerHTML`, `insertAdjacentHTML`, `eval` y `new Function` vacío.
  - El SKU es derivado y está rotulado "SKU de maqueta". La columna no existe en `seed.sql`, así que si se implementa necesita su propia decisión de esquema.
  - `productos.js:282` sigue escribiendo estilos por CSSOM, como en F-63 (b).

**Notas para la implementación (amplían F-63 (c)).** El motivo va como máscara con `data:` y por eso necesita `img-src data:`. En el panel real conviene un `.svg` estático en `/static/` para no ampliar la CSP.

**Candado de T7m después del delta:**
- **3 Diseño: queda abierto solo por el OK de Eduardo.**
  - **Estudio de las `vista*.png`:** cubierto. Los archivos existen: `~/Desktop/img/vistaadmincatalogo.png` (156 167 bytes), `~/Desktop/img/vistaagregarproducto.png` (189 098) y `~/Desktop/img/vistas-productos/vistaagregarproducto{detalle,media}.png`. El informe dice qué tomó de cada uno ("Ronda 3", 1d).
  - **`postmortem-carni-diseno.md`:** cubierto. Comprobé las líneas que cita: `:57` (E16, gráficas del panel), `:58` (E17, tabla con orden, búsqueda y paginación), `:100` (causa 1, sin ver el movimiento), `:101` (causa 2, "Near-zero motion"), `:102` (causa 3, sin inventario de comportamientos) y `:107` (causa 8, panel en HTML plano). El propio informe marca como no atendidas L102 y L103/L92, que pide migrar en el lugar, en `backend/templates/panel/`: quedan como requisito para T7d.
  - **Las 5 skills marcadas "no usada"** (`gsap-*`, `awwwards-animations`, `animated-component-libraries`, `apple-design` y `awesome-design-md`) siguen esperando el OK de Eduardo.
- **2 REA:** "no aplica, requiere el OK de Eduardo".
- **4 Patrones y diagramas:** no aplica a la maqueta según L31; llega con T7d.
- **5 roadmap.sh, 6 Big School y 7 Videos:** cubiertos (sección 15, actualizada).
- **1 Seguridad:** cubierto por esta sección y la 15.

**Pruebas y escaneos de este delta:** hashes y `diff` contra v1, los escaneos estáticos repetidos, la decodificación de los `data:` de `panel.css`, `verdad_catalog_js.py` y `gitleaks`. Las capturas del autor en `scratchpad/t7m/r3/` no las revisé. Ningún `.env` leído.

Riesgo de este delta: `Risk: none` (solo texto en este documento).

## 16. Rebanada 11: T7b y T7c, corrección de los 8 puntos de GGA (L30) (2026-11-25, sin commitear, sobre HEAD `2498696d`; verificador independiente, Risk ítems 2 y 3)

Alcance: los 13 archivos del informe `scratchpad/t7b/backend-datos-4.md`:
- `backend/inventory/models.py`, `pricing.py`, `sources.py`, `tests.py`, `test_reconciliation.py`, `test_sale_modes.py`, `test_sources.py` y `migrations/0006_product_source_and_piece_tolerance.py`;
- `docs/contratos/inventario-por-fuente.md`;
- el literal del factor de libra en `supabase/seed.sql`, `backend/panel/preview_catalog.py`, `backend/panel/test_preview_catalog.py` y `supabase/tests/ayudas.sql`.

La sección 12 ya revisó el SQL y la lógica (F-43 a F-49); aquí reviso el delta de la corrección.

### Veredicto
- **El commit local se puede hacer: no hay hallazgos que lo bloqueen.** Los tres puntos pedidos quedan bien y cada arreglo tiene una prueba que se pone roja si se revierte (12 de 12 mutantes muertos). TF1 no se rompe.
- **Pero el push sí queda condicionado (F-65, alta para el despliegue).** Este código hace que cada consulta de `Product` y `StoreCutSpec` lea columnas que solo existen después de aplicar `supabase/migrations/20261125000001_inventario_por_fuente.sql`. Render despliega solo con cada commit que llega a `practicas-ebac`. Por eso no se empuja hasta aplicar esa migración en el Supabase de la demo, y por la sección 12 aplicarla exige antes la prueba SQL en verde con F-45.

### Respuestas
1. **`store_image_url`** (`backend/inventory/models.py:92-114`; arreglo en `:109`). Sonda propia con 34 direcciones (`scratchpad/auditoria/sonda_img.py`, salida `sonda_img.txt`):
   - **Rechaza** (devuelve `""`): `/\evil.com`, `img\..\x`, `\\evil.com/x`, `//evil.com/x`, `///evil.com/x`, `java\tscript:`, `\x00javascript:`, `javascript:` (también en mayúsculas y con espacio delante), `data:`, `vbscript:`, `blob:`, `filesystem:`, `/img/../admin` y `/img/\x7f`.
   - **Normaliza:** `/img/x\r\n` queda en `/img/x`, porque `strip()` corre antes de la comprobación.
   - **Deja pasar, y no importa:** las direcciones absolutas `http(s)` vuelven tal cual (`:106-107`), incluso con tabulador (`ht\ttp://evil.com`) o con barras invertidas (`https:\\evil.com`). La política ya acepta cualquier host `http(s)`, así que eso no abre nada nuevo.
   - **Deja pasar, y sí debería rechazar:** los segmentos `..` codificados (F-66).
   
   Prueba que lo fija: `StoreImageUrlTests` (`backend/inventory/tests.py:1293`). El mutante que quita `:109` da 7 fallas.
2. **Un solo factor de libra** (`POUND_IN_KG = Decimal("0.45359237")`, `models.py:29`; se elimina `KG_TO_LB_PRICE_FACTOR`).
   - **Mismo valor en todo lo que fija precios:** `grep` en todo el repo encuentra `0.45359237` en `seed.sql:66`, `preview_catalog.py:43`, `test_preview_catalog.py:207`, `ayudas.sql:120`, el SQL de cobro (`20261113000002_comercio_v1_cotizacion_y_pedidos.sql:110` y `20261119000001_lotes_por_pieza.sql:251`) y `supabase/tests/cotizacion-casos.json:4`. Ya no queda ningún `0.4536` en código de backend ni en SQL de `supabase/`.
   - **Los diffs solo cambian el factor:** `git diff -U0` de `seed.sql`, `ayudas.sql`, `preview_catalog.py` y `test_preview_catalog.py` toca solo ese literal (y las dos líneas de comentario de `seed.sql:17-18`).
   - **TF1 no se rompe:** el lector exige el mismo `SELECT` que `seed.sql`. Los mutantes que devuelven `0.4536` en `seed.sql` o en el lector mueren (18 y 21 errores), y la suite completa pasa.
   - **Cero contra cero:** la migración Django `0006` solo cambia el estado de dos modelos `managed=False` (`AddField`, sin `RunSQL`), y `makemigrations --check` da "No changes detected".
   - **Datos guardados:** 12 de las 53 filas de `seed.sql` bajan 1 centavo de `price_per_lb` (lista en el informe del autor). En producción, cada fila cambia la próxima vez que se guarda: no hay migración de datos, y desde ese guardado el precio por libra que se ve es el que se cobra.
   - Las copias que quedan fuera de este alcance están en F-67.
3. **Decimal finito.**
   - **`sources._decimal`** (`backend/inventory/sources.py:71-74`) exige `isinstance(value, Decimal)` y `is_finite()`. Todas las entradas públicas pasan por él o por `_kg` (`:78`): `deduction_kg`, `grams_for_amount` (`:101`), `mxn_for_usd` (`:108`), `draw_stock` (`:115-124`), `cut_source` (`:129-134`), `apply_shrink` (`:149-154`), `reconcile` (`:161-171`) y `count_variance` (`:184-187`).
   - **`StandardPiece`** (`backend/inventory/pricing.py:280-304`) exige en `__post_init__` un peso finito mayor que cero y una tolerancia finita de cero o más, y `accepts` exige un `Decimal` finito.
   - **Lo que no cubre:** un `Decimal` construido desde texto con dígitos Unicode (F-47) sigue siendo responsabilidad del analizador ASCII de la vista, como dice el docstring (`:283-284`).
   - **Pruebas:** `DecimalOnlyTests` (`test_sources.py:89`) y las de `StandardPiece`. Los mutantes "acepta NaN", "acepta float", "tolerancia negativa", "peso cero" y "`accepts` con NaN" mueren.
4. **El rojo fue real (comprobado por reversión).** Sobre una exportación limpia de HEAD `2498696d` con los 13 archivos (`scratchpad/auditoria/t7bfix.1bxU`), devolví cada arreglo a su comportamiento anterior y corrí `inventory panel.test_preview_catalog panel.test_preview_seed` (script `mut_t7bfix.py`, salida `mut_t7bfix.txt`). **12 de 12 mueren:**

   | Arreglo revertido | Resultado |
   |---|---|
   | barra invertida y control | 7 fallas |
   | factor `0.4536` | 11 fallas |
   | descuento con `HALF_EVEN` | 1 falla |
   | precio por pieza con `HALF_EVEN` | 1 falla |
   | `_decimal` sin `is_finite` | 1 falla y 11 errores |
   | `_decimal` sin `isinstance` | 12 errores |
   | tolerancia negativa | 1 falla |
   | peso cero | 1 falla |
   | `accepts` con NaN | 2 errores |
   | leyenda siempre | 1 falla |
   | factor viejo en `seed.sql` | 18 errores |
   | factor viejo en el lector | 21 errores |
   
   No repetí el rojo del autor tal cual (sus "7 subtests", "3 fallas" y demás): revertir cada arreglo da la misma prueba con menos dependencia del orden en que trabajó.
5. **Verde.** En esa exportación, la suite completa da **Ran 1405 tests, OK** (14.5 s), salida en `t7bfix-full.txt`.
   - `ruff check inventory panel/preview_catalog.py panel/test_preview_catalog.py` da "All checks passed!".
   - `gitleaks dir --redact` da "no leaks found" en los 11 archivos de código, contrato y SQL.

### Hallazgos
| ID | Gravedad | Estado | Dónde | Dueño | Resumen |
|---|---|---|---|---|---|
| F-65 | **alta para el despliegue** (no bloquea el commit local) | confirmado: SQL generado y lectura | `backend/inventory/models.py:209` (`source_product`), `:582` (`piece_tolerance_kg`); `render.yaml:21-23`; `backend/scripts/render_build.sh:28-30` | lead / Eduardo | `str(Product.objects.all().query)` incluye `"products"."source_product_id"`, y la consulta de `StoreCutSpec` incluye `piece_tolerance_kg`. Esas columnas solo existen después de `20261125000001_inventario_por_fuente.sql`, que está commiteada pero **no aplicada**. Render despliega `practicas-ebac` con `autoDeployTrigger: commit`, y el build solo corre `migrate` de Django, que para estos modelos no emite SQL. Si el commit llega al remoto antes de aplicar la migración en el Supabase de la demo, la tienda y el panel fallan con "column does not exist" en cada lista de productos. Condición: el orden es aplicar la migración (con la prueba SQL en verde y F-45, sección 12), después hacer push. Otra opción es no empujar hasta entonces. Que el orden quede escrito en `odd/tasks/rediseno-moderno.md` |
| F-66 | info | sonda | `backend/inventory/models.py:110` | backend-datos-4 | `".." in address.split("/")` no ve los segmentos codificados: `/img/%2e%2e/%2e%2e/panel/` (también `%2E%2e` y `.%2e`) vuelve tal cual, y el navegador lo resuelve a `/panel/`. El impacto es bajo: es un GET del mismo origen desde un `<img>`, y las vistas GET no escriben. Aun así contradice el docstring ("a path that climbs with `..`"). Corrección: rechazar `%` en las rutas relativas (ninguna imagen real lo usa) o comprobar los segmentos sobre `unquote(address)`, con su prueba |
| F-67 | info (seguimiento) | confirmado con `grep` | `backend/inventory/models.py:29`; `ventas/tests/support.py:35`; `supabase/migrations/20261113000002…:110`; fuera de alcance: `docs/cargar-catalogo-y-admin.sql:59`, `js/modules/core/quote.js:24`, `src/hooks/useUnidadInteligente.ts:50`, `:116`, `js/modules/core/__tests__/quote.test.js:34` | backend-datos-4; frontend; docs | (a) "Un solo factor" es una convención repetida en 7 sitios, y ninguna prueba compara `POUND_IN_KG` con `cotizacion-casos.json` (`meta.lb_kg`, que el doble ya lee en `support.py:35`) ni con el texto de la migración de cobro. Si alguien cambia uno, los demás no se enteran. Prueba propuesta: `POUND_IN_KG == Decimal(CASES["meta"]["lb_kg"])`. (b) Quedan aproximaciones fuera de esta rebanada: `docs/cargar-catalogo-y-admin.sql:59` (`0.4536`; es un script de carga del catálogo que se puede correr, y además es otra copia del catálogo, S17), y `2.20462` en `js/modules/core/quote.js:24` y en `src/hooks/useUnidadInteligente.ts`, cuyo inverso exacto es 2.2046226 |

### Estado del candado (recibo de T7b y T7c en L28, para este delta)
- **1 Seguridad:** cubierto por esta sección (verificador independiente para los ítems 2 y 3), con `gitleaks` limpio. Siguen pendientes GGA en el commit y `security-review`. La rebanada no cambia manifiestos, así que no se ejecutó `supply-chain-risk-auditor`.
- **2 REA y 3 Diseño:** como en la sección 12 (sin cambios por esta corrección).
- **4 Diagrama:** según el autor, `docs/diagramas/t7b-inventario-fuente.html` no cita archivos `.py`, así que no quedan citas viejas. No lo abrí.
- **5, 6 y 7:** sin evidencia nueva en el informe de este delta. Siguen como en L28 y en la sección 12, donde el minuto del video (`?t=0`) quedó observado.

### Patrones (Mermaid; sin `archify` en este agente)
```mermaid
flowchart LR
  V["vista (futura T9/T7d): analizador ASCII"] --> SP["StandardPiece pricing.py:280 (__post_init__ :290, accepts :296)"]
  V --> SRC["sources.py: _decimal :71 -> funciones puras"]
  M["models.POUND_IN_KG :29"] --> LB["price_per_lb_for :33 (Product.save)"]
  SEED[("seed.sql:66 ROUND(x*0.45359237)")] -->|"mismo SELECT"| PC["preview_catalog.py:43"]
  Q[("SQL de cobro 20261113000002:110")] -. "F-67: sin prueba que una los literales" .- M
  P["Product (managed=False) :209 source_product"] -. "F-65: columna de 20261125000001, no aplicada" .-> DB[("Supabase de la demo")]
```
Confirmado: `sources.py` y `StandardPiece` son **funciones puras y un objeto de valor** con validación al construirse. Eso es una técnica, no un patrón de refactoring.guru (como dijo la sección 12, llamarlos Strategy sería solo una analogía).

### Pruebas y escaneos de esta revisión
- **Pruebas:** suite completa en la exportación limpia con 1405 en OK, 12 de 12 mutantes muertos y `makemigrations --check` sin cambios.
- **Sondas:** 34 direcciones de imagen.
- **Lectura:** `grep` del factor en todo el repo y el SQL generado de `Product` y `StoreCutSpec`.
- **Escaneos:** `ruff` y `gitleaks` limpios.
- **No ejecutado:** `ayudas.sql` (no hay Postgres).
- Ningún `.env` leído.
- **Scratch:** `scratchpad/auditoria/` (`t7bfix.1bxU/`, `mut_t7bfix.py` y `.txt`, `sonda_img.py` y `.txt`, `t7bfix-full.txt`).

Riesgo de esta revisión: `Risk: none` (solo texto en este documento).

### Recibo de recursos de esta revisión
| # | ítem | estado | evidencia |
|---|---|---|---|
| 1 | Seguridad | usado | `security-and-hardening` (entradas no confiables -> sonda de URL, F-66; validación de tipos -> Decimal finito); OWASP A03 (URL en `<img>`) y A05 (orden de despliegue, F-65); gitleaks limpio; `security-review` pendiente del lead |
| 2 | REA | no aplica | revisión de seguridad |
| 3 | Diseño | no aplica | sin interfaz |
| 4 | Patrones y diagramas | usado | Mermaid arriba, con la técnica rotulada sin forzar GoF |
| 5 | roadmap.sh | no usado | sin consulta nueva |
| 6 | Big School | usado | TDD p. 9 (`temario.md:198`): el rojo comprobado por reversión de cada arreglo |
| 7 | Videos | no usado | sin consulta |

Needs skill: security-review - diff de los 13 archivos de la corrección de T7b y T7c listados arriba.

### 16.1 Recheck de F-66 (2026-11-25, limitado a F-66)

Cambiaron dos archivos desde la sección 16 (`cmp` contra `scratchpad/auditoria/t7bfix.1bxU`): `backend/inventory/models.py` y `backend/inventory/tests.py`. Los otros 11 son idénticos.

| ID | Estado | Evidencia |
|---|---|---|
| F-66 | **cerrado** | Ver los cinco puntos debajo de la tabla |

**Evidencia de F-66:**
- **El arreglo.** `models.py:110` rechaza `%` en las rutas locales, junto con `\` y los caracteres de control, sin decodificar. El docstring lo explica (`:101-103`).
- **Mi sonda repetida** (`sonda_img.py`, salida `sonda_img2.txt`). Ahora rechaza `/img/%2e%2e/%2e%2e/panel/`, `/img/%2E%2e/x`, `/img/.%2e/x`, `/%5cevil.com`, `/img/%0aevil` y `%2F%2Fevil.com`. Los casos que ya se rechazaban antes siguen rechazados.
- **La prueba que lo fija.** `test_a_percent_encoded_path_is_refused` (`tests.py:1343`), con 6 subpruebas: `%2e%2e`, `%2E%2E`, `%2f`, `%5c`, `%00` y la doble codificación `%252e`. El mutante que quita `%` del conjunto da `Ran 363 tests, FAILED (failures=6)` en `inventory`, así que el rojo es real.
- **No rompe imágenes reales.**
  - **`seed.sql`:** sus 4 `%` son marcadores de `RAISE` del bloque `DO` (`:315`, `:320`, `:325`, `:328`), ninguno está en una imagen.
  - **`public/img`:** `find public/img -type f` no encuentra ningún nombre con `%`, espacio ni carácter fuera de ASCII.
  - **Otros datos del repo:** `grep` de rutas `/img/` con `%` en `supabase/`, `src/data/` y `backend/` (sin pruebas) no encuentra nada.
  - **Subidas:** las imágenes subidas son URLs `https` con nombre `uuid4().hex` (`backend/inventory/storage.py:142` y `:176`), y salen por la rama `http(s)` (`models.py:107-108`) antes de esta regla.
- **Suite y escaneos.** En la exportación limpia (HEAD `2498696d` más los 13 archivos), la suite completa da **Ran 1406 tests, OK** (salida en `t7bfix-full2.txt`), y `ruff check inventory` da "All checks passed!".

**Lo que sigue abierto:**
- **F-65 y F-67:** abiertos. El lead los registra como pendientes en el documento de feature.
- **Push:** la condición de F-65 se mantiene. No hay push hasta aplicar `20261125000001` en el Supabase de la demo, con la prueba SQL en verde.

Riesgo de este recheck: `Risk: none` (solo texto en este documento).
