# 03 - Backend (Django), OpenCode y seguridad del dashboard

Fecha de la investigación: 2026-09-29. Modo: solo lectura.
Fuentes: base de OpenCode (`~/.local/share/opencode/opencode.db`, `sqlite3 -readonly`), repo `~/Desktop/Carni-mvp` (rama `practicas-ebac`, leído con `git show`/`git log`), Engram (proyectos `carni-mvp` y `Carni-mvp`), Supabase de producción (`wlikxgklwutxxazbhmkv`, solo `SELECT`, advisors y listados). Ninguna llave se imprimió ni se guardó.

## Resumen en cinco líneas

1. El dashboard real de hoy es 100 % Supabase: HTML estático + `supabase-js` con el JWT del usuario, protegido por RLS (`is_admin()`). Django existe, pero solo como panel de inventario local (`/inventario/`), sin API y sin desplegar.
2. La base de producción no tiene el esquema ni el rol `django` (solo 5 migraciones, la última `202608250001`). Django solo corre contra el Supabase local (puerto 54322).
3. El React dashboard puede llamar hoy, con seguridad razonable, a PostgREST/RPC de Supabase. Todo lo demás (API de Django, auditoría, MFA, Track Score, afiliados, reportes) es "falta backend".
4. Hallazgo más serio: un cliente autenticado puede insertar y actualizar `orders`/`order_items` directo por PostgREST (precio, total y estado), saltándose `create_order_with_items`.
5. Ambos agentes quedaron a medias: el chat de backend (Claude Code) se perdió tras entregar la M13; OpenCode quedó bloqueado en la M14 por la cuota del modelo Gemini y no escribió nada de código.

---

## (a) Qué existe para el dashboard y el admin

### A.1 Panel actual en Supabase (lo que sirve la tienda hoy)

- Páginas: `dashboar.html`, `admin-products.html`, `admin-orders.html`, `admin-customers.html` (Vite, estáticas). El guardia es JavaScript en el navegador: `js/modules/utils/admin-auth.js` (`verifyAdminSession`, líneas 53-69) lee `profiles.role` y redirige a `accessweb.html?admin=true` si no es `admin`. El HTML en sí es público.
- Autenticación: solo Supabase Auth. Clerk no está en el código: aparece únicamente en `supabase/config.toml:343` (plantilla de proveedor de terceros, con el dominio de ejemplo) y en `docs/blueprints/module-scopes.md`; `package.json` no lo incluye. La skill `carni-auth` habla de "Clerk + Supabase dual auth" y está desactualizada respecto al código.
- Producción (proyecto `wlikxgklwutxxazbhmkv`, mismo dominio que la CSP de `netlify.toml:39`): 8 tablas con RLS activa (`profiles` 1 fila, `categories` 9, `products` 53, `orders` 0, `order_items` 0, `favorites` 0, `promotions` 0, `store_settings` 1). Hay 1 usuario en `auth.users` y es `admin`. No hay Edge Functions.
- Migraciones remotas: `202604100001`, `202604100002`, `202604100003`, `202608210001` (precio del lado servidor), `202608250001` (recursión de RLS). Nada posterior.
- RPC disponibles (`SECURITY DEFINER`, `search_path` vacío salvo indicación): `create_order_with_items`, `cancel_order`, `add_to_favorites`, `remove_from_favorites`, `get_user_favorites`, `is_admin`, `get_user_role`. Además `add_points`, `apply_promotion` y `update_order_status` (invoker, `search_path` mutable).
- `store_settings` es un singleton editable solo por admin, con trigger de auditoría (`store_settings_audit` rellena `updated_at` y `updated_by`). Es la única tabla con rastro de quién cambió qué.

### A.2 Django (chat de backend, rama `practicas-ebac`)

- Commits: `080923cf` (reglas GGA), `2aa59f32` (scaffold), `e5a1cf49` (esquema y rol `django`), `24725c6d` (CRUD de inventario, M13), `34b58369`/`f8a3dc7c`/`518ec664` (entrega y notas, PRs #10-#12). Cabeza de `origin/practicas-ebac` = `518ec664` (2026-09-21 21:13 -0600). `main` no contiene `backend/` (0 entradas en `git ls-tree main -- backend`).
- Stack real: Django 5.2.17, `psycopg`, `python-dotenv` (`backend/pyproject.toml`). No hay DRF, no hay `django-cors-headers`, no hay librería JWT.
- Rutas (`backend/config/urls.py`): `/admin/` (Django Admin) e `/inventario/` (cinco vistas de función con formularios y plantillas HTML del lado servidor). No existe ningún endpoint JSON que React pueda llamar.
- Modelos: `Category` y `Product` espejo con `managed=False` sobre las tablas de Supabase; `CutSpec` es la única tabla propia (esquema `django`). El precio por libra se deriva del precio por kilo; cambiar precio o cantidad mínima pide confirmación antes/después; borrar un producto con pedidos lo desactiva.
- Aislamiento en Postgres (`supabase/migrations/20260918235409_django_schema_role.sql`, `20260921112941_grant_django_favorites_select.sql`): esquema `django`, rol `django` sin `SUPERUSER`/`BYPASSRLS`, CRUD sobre `products`/`categories`, `SELECT` sobre `order_items` y `favorites`, con políticas RLS `TO django ... USING (true)`. Un chequeo del sistema (`config.E001`) impide que `migrate` cree tablas en `public` si falta el esquema.
- Estado de despliegue: solo local. No hay hosting definido (el handoff #641 sugiere Cloud Run u otro host de contenedores; GitHub Pages y Netlify no corren Django).
- Migración `20260911_chat_messages.sql` (chatbot) también existe solo en `practicas-ebac`; la tabla `chat_messages` no está en producción.

---

## (b) Qué puede llamar hoy el dashboard React y qué es "falta backend"

### Se puede llamar hoy (con el JWT del usuario admin, vía `supabase-js`)

| Necesidad del dashboard | Mecanismo | Respaldo en RLS |
| --- | --- | --- |
| Catálogo: leer, crear, editar, borrar productos y categorías | PostgREST `products`, `categories` | `*_admin_insert/update/delete` con `is_admin()` |
| Pedidos: listar todos, cambiar estado | PostgREST `orders`, `order_items`; RPC `update_order_status` | `orders_admin_read_all`, `orders_admin_update_status`, `order_items_admin_read_all` |
| Clientes: listar y editar perfiles | PostgREST `profiles` | `profiles_admin_read_all`, `profiles_admin_update_all` |
| Promociones | PostgREST `promotions` | `promotions_admin_*` |
| Parámetros de negocio (mínimos, etc.) | PostgREST `store_settings` | lectura pública, escritura admin, con auditoría de `updated_by` |
| Rol del usuario actual | RPC `get_user_role`, `is_admin` | devuelve `null`/`false` para anónimos |

### Falta backend (no existe o no está en producción)

- API de Django (DRF), verificación de JWT de Supabase por JWKS, CORS, throttling: nada de esto está construido (el plan aparece en el handoff #641 y en el diseño #646, pero el código actual usa el login propio de Django).
- Django en producción: sin hosting, sin esquema/rol `django` remoto, sin `main`.
- Especificaciones de corte (`CutSpec`: peso por pieza, grosor, proveedor, presentación): solo existen en el esquema `django` local.
- Auditoría de cambios de precio/mínimos (quién, antes, después, deshacer): solo hay `updated_by` en `store_settings`; el diseño prevé un trigger en Postgres y no se hizo.
- Verificación reforzada (MFA TOTP de Supabase, claim `aal2`) para cambios sensibles: no construida.
- Track Score, afiliados, historial, perfil ampliado, configuración de tienda: no hay tablas (`profiles` solo tiene `role` y `points`).
- Reportes y analítica (Pandas/Chart.js con datos reales): no existen; `orders` tiene 0 filas.
- Semilla de datos demo (500 productos, práctica M14): no implementada (ver sección e).
- Cierre de sesión real del admin (pendiente P-42).

Recomendación para la integración: el dashboard React debe hablar con Supabase (PostgREST/RPC) en la primera versión y tratar Django como un servicio posterior que se conecta detrás de una API con JWT. Si se agrega un host de Django, hay que sumarlo a `connect-src` de la CSP en `netlify.toml`, o el navegador bloqueará las llamadas.

---

## (c) Postura de seguridad y riesgos concretos

Severidades: ALTA = afecta dinero o toma de cuenta; MEDIA = debilita una capa; BAJA = defensa en profundidad.

### C.1 Riesgos (ordenados)

1. **ALTA - Integridad de pedidos por acceso directo a las tablas.** `precio_server_side` (`202608210001`) corrigió la RPC, pero las políticas siguen permitiendo escribir directo: `orders_insert_own` (solo `user_id = auth.uid()`), `orders_update_own` (pedido `pending`, solo `user_id = auth.uid()` en el `WITH CHECK`) y `order_items_insert_order` (solo que el pedido sea propio). Además `authenticated` tiene `UPDATE` sobre todas las columnas de `orders`, incluidas `status` y `total`. Un cliente podría fijar su propio total o estado, o insertar partidas con precio arbitrario, sin pasar por `create_order_with_items`. Derivado de las definiciones de las políticas y de `has_column_privilege`; no se probó con escrituras. Impacto para el dashboard: `orders.total` y `orders.status` no son confiables hasta cerrar esto. Hoy `orders` tiene 0 filas, así que es el momento barato para arreglarlo (quitar `INSERT`/`UPDATE` directos a `authenticated` y forzar las RPC, o restringir columnas con un trigger).
2. **MEDIA - El guardia del admin vive en el navegador y la sesión no se cierra.** `verifyAdminSession` solo redirige; el HTML es público. P-42 sigue abierto: los enlaces "Salir" son `<a href="index.html">` y nadie llama a `logout()`/`signOut()`, así que el token de Supabase sigue vivo (`docs/PENDIENTES.md`, P-42). En el rediseño hay que proteger las rutas admin en React y cerrar sesión con `supabase.auth.signOut()`; la seguridad real seguirá siendo RLS.
3. **MEDIA - CSP debilitada.** `netlify.toml:35` permite `script-src 'unsafe-inline' 'unsafe-eval'` más `cdn.jsdelivr.net` y `unpkg.com`. El token de sesión de `supabase-js` vive en el navegador; un XSS equivale a tomar la cuenta del admin. Con el build de React/Tailwind conviene quitar `unsafe-eval` y `unsafe-inline` de scripts. Los headers `X-Frame-Options: DENY` y `nosniff` sí están bien.
4. **MEDIA - Django con identidad propia y sin permisos finos.** Las cinco vistas usan solo `@login_required` (sin `is_staff` ni permisos), con `LOGIN_URL = "/admin/login/"`: cualquier usuario de Django puede editar precios. Además son usuarios distintos de los de Supabase, lo contrario del diseño "un solo sistema de usuarios" del handoff #641. Sin MFA ni auditoría. Sin ajustes de producción en `settings.py` (0 coincidencias de `SECURE_*`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `CSRF_TRUSTED_ORIGINS`, HSTS). Lo bueno: `DEBUG` es `False` por defecto, `SECRET_KEY` y `ALLOWED_HOSTS` salen del entorno, `CsrfViewMiddleware` y `XFrameOptionsMiddleware` están activos.
5. **BAJA/MEDIA - Advisors de Supabase (security), 6 tipos de aviso, todos nivel WARN:**
   - `function_search_path_mutable` (4): `update_updated_at_column`, `add_points`, `apply_promotion`, `update_order_status`. Además `protect_profile_system_fields` usa `search_path=public`.
   - `anon_security_definer_function_executable` y `authenticated_security_definer_function_executable` (10 funciones cada una, ambas listas visibles por `/rest/v1/rpc/...`): `add_to_favorites`, `cancel_order`, `create_order_with_items`, `get_user_favorites`, `get_user_role`, `handle_new_user`, `is_admin`, `marcar_store_settings`, `protect_profile_system_fields`, `remove_from_favorites`. `create_order_with_items` valida `auth.uid()` (verificado en su definición); no se revisó el cuerpo de las demás. Las de trigger (`handle_new_user`, `protect_profile_system_fields`, `marcar_store_settings`) no deberían ser llamables. Conviene `REVOKE EXECUTE ... FROM anon, public`.
   - `pg_graphql_anon_table_exposed` y `pg_graphql_authenticated_table_exposed` (8 tablas): el esquema GraphQL de las 8 tablas es visible con la llave pública.
   - `auth_leaked_password_protection`: desactivada.
6. **BAJA - Privilegios de tabla amplios.** `anon` y `authenticated` tienen `SELECT/INSERT/UPDATE/DELETE` en las 8 tablas (`has_table_privilege`); la única barrera es RLS. Las políticas revisadas para `anon` solo dejan leer catálogo, promociones activas y `store_settings`, así que hoy no hay fuga, pero es una capa menos.
7. **BAJA - Servidor Express congelado.** `server/app.ts:15` hace `express.static(workspaceRoot)` con `workspaceRoot` = raíz del repo: si ese servidor se ejecutara expuesto serviría `.env` y el código. Solo `/api/buildads` tiene `express-rate-limit`; no hay CORS ni helmet. P-03 (validación de `voice_id`, errores crudos) está congelado con BuildAds.
8. **BAJA - Llaves en el bundle.** Correcto: `src`, `js`, `dist` y `server` no contienen `service_role` ni `sb_secret_*`; el front solo lee `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (con respaldo legado `VITE_SUPABASE_KEY` en `js/modules/supabase.js:7`, `js/modules/chatbot.js:147` y `src/redux/slices/busquedaSlice.ts:44`) y `VITE_VAPID_PUBLIC_KEY` (pública por diseño). `PREDIS_API_KEY` y `ELEVENLABS_API_KEY` se leen solo con `process.env` en `server/routes/buildads.ts:34,99`. Dos nombres para la misma llave conviene unificarlos en el rediseño. Nota: `js/modules/supabase.js` lanza una excepción al cargar si faltan las variables VITE (mem #711), y deja en blanco la página que lo importe.

### C.2 Lo que está bien

- RLS activa en las 8 tablas; `is_admin()` con `search_path` vacío; `protect_profile_system_fields` impide que un usuario se auto-ascienda a admin o cambie `points`; políticas de pedidos por dueño; precio calculado en el servidor dentro de la RPC.
- Un solo admin en producción; sin Edge Functions que auditar.
- Llaves de Apify rotadas el 2026-08-25 (`docs/brain/security.md`).

### C.3 Acciones sugeridas antes de conectar el dashboard rediseñado

1. Cerrar el hueco de `orders`/`order_items` (riesgo 1) con una migración; anunciar antes de commitear (contrato compartido `supabase/migrations`).
2. Agregar `REVOKE EXECUTE ... FROM anon` a las funciones `SECURITY DEFINER` y fijar `search_path` en las cuatro mutables.
3. Activar la protección contra contraseñas filtradas en Supabase Auth.
4. Resolver P-42 en el dashboard nuevo y guardar rutas admin en React.
5. Endurecer la CSP al pasar a React + Tailwind.
6. Antes de exponer Django: permisos por vista (`is_staff` o grupos), ajustes `SECURE_*`/cookies, y decidir si valida el JWT de Supabase (JWKS) o mantiene su login.

---

## (d) Qué dijo Eduardo que se perdió o quedó sin terminar

Fuente: sesión de OpenCode `ses_f4c4fd07effef8I6Tz2NX6BJeR` ("Carni-mvp + backend"), mensaje del 2026-09-24 06:42 UTC, más Engram.

- Se borró la sesión de Claude Code donde estaba el trabajo del backend y las prácticas ("se borró, no sé cómo"). Lo último que recordaba: la M13 hecha, el mensaje de entrega para el LMS y su verificación.
- Según él, OpenCode le había pasado mensajes para el LMS sin haber entregado el trabajo de la práctica; Claude Code volvió y lo hizo y verificó. La revisión posterior de OpenCode confirmó que no hay commits de M14 ni M15 en ninguna rama, solo las notas de estudio (`518ec664`).
- Pidió comprobar qué quedó guardado en Engram y en graphify. Resultado de esta investigación:
  - La M13 sí quedó registrada (#690 entrega empujada; #700 enviada al LMS el 2026-09-21 21:15, estado "enviada al tutor").
  - El contrato de vuelta de OpenCode (`handoff/opencode-backend-vuelta`, #672) nunca se escribió: no aparece en ninguna búsqueda.
  - OpenCode guarda en el proyecto `Carni-mvp` (con mayúscula), no en `carni-mvp` (p. ej. #740, M14). Una búsqueda por `carni-mvp` no lo encuentra. Ojo: es el mismo problema de alias que la memoria ya daba por unificado el 2026-07-25.
- Sin terminar: tests del panel (el paso 8 del diseño: `backend/inventory/tests.py` es un stub de 26 bytes); audit log, MFA y permisos finos; Django fuera de `main` y de producción; `chat_messages` y el rol `django` sin aplicar en el proyecto remoto; M14 y M15.

---

## (e) Última tarea concreta de cada agente

### Chat de backend (Claude Code) - sesión perdida

- Última tarea: cierre de la práctica M13 (CRUD de inventario en Django). Trabajo real en `24725c6d` (2026-09-21 05:30 -0600), entrega en `34b58369` (PR #10, 17:17), documento con capturas `f8a3dc7c` (PR #11, 20:40) y notas de estudio `518ec664` (PR #12, 21:13). Enviada al LMS a las 21:15.
- Cómo retomarlo: partir de `origin/practicas-ebac`; leer `backend/README.md`, `supabase/migrations/2026091*` y las observaciones #641 (handoff), #646 (diseño), #672-#673 (traspaso a OpenCode). Nada quedó a medias en git.

### OpenCode - sesión `ses_f4c4fd07effef8I6Tz2NX6BJeR`, actualizada 2026-09-29 09:23:41 UTC

- Última tarea: implementar la práctica M14 (módulo "Django Models & Admin", lección `d705a8a6`): un comando de gestión `seed_demo_products` con subcomandos `create` (500 productos con `bulk_create`, `price_per_lb` calculado a mano porque `bulk_create` no llama a `save()`, `metadata={"is_demo": True}`), `dump` (fixture JSON solo de los demo), borrado y `loaddata`. La propuesta quedó en Engram como #740 (proyecto `Carni-mvp`). Cinco sub-agentes `sdd-apply` (08:29-09:19 UTC) fallaron por el modelo `google/gemini-3.8-flash` ("high demand", luego cuota diaria de 20 solicitudes agotada). A las 09:23 OpenCode estaba editando la config para cambiar el modelo del agente `sdd-apply` al modelo por defecto (`mimo-v2.6-flash-free`). No se verificó que la edición se guardara.
- Estado en disco: no existe `backend/inventory/management/` (solo `admin.py`, `apps.py`, `forms.py`, `migrations/`, `models.py`, `tests.py`, `urls.py`, `views.py`, todos del 2026-09-21). Nada de M14 está escrito ni confirmado.
- Cómo retomarlo: comprobar que la config de OpenCode ya apunta a un modelo con cuota; relanzar `sdd-apply` con el mismo encargo (repo `~/Desktop/Carni-mvp`, rama `practicas-ebac`, sin `manage.py migrate`, sin tocar los 53 productos reales, `uv run ruff check . && uv run ruff format --check .`). Precaución: el rol `django` tiene CRUD total sobre `products`; confirmar que `backend/.env` apunta al Supabase local (54322) antes de sembrar 500 filas.

### Chat de frontend (contexto)

- Última entrada de git en `pruebas`: `e8fafe95` (2026-09-29, loop final del rediseño). Última nota de traspaso al backend: #711 (2026-09-23, Tailwind v4 en `landing.html`; un solo `@theme` de `DESIGN.md` para tienda y panel Django).

---

## Preguntas que solo Eduardo puede responder

1. ¿El dashboard React nuevo debe hablar solo con Supabase en la primera versión, o esperas que ya use una API de Django?
2. ¿Autorizas una migración para cerrar el hueco de `orders`/`order_items` (INSERT/UPDATE directo) y otra para revocar `EXECUTE` a `anon`? Tocan el contrato compartido `supabase/migrations`.
3. ¿Dónde se va a alojar Django (Cloud Run u otro) y cuándo pasa a `main`?
4. ¿Se retoma la M14 con el modelo por defecto de OpenCode o prefieres que la haga Claude Code?
