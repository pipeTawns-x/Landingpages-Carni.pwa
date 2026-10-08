# Estado del panel Django (backend)

Se actualiza en cada slice. Se retoma en la primera que no esté HECHA.

| Slice | Qué | Estado | Sha | Espera |
|---|---|---|---|---|
| B0 | Decisión, contrato, loop y estado | HECHO | (este commit) | — |
| B1 | Bug: ficha con todos los valores en cero | HECHO | `8e750cc2` | — |
| B2 | `inventory/services.py` + mirrors `OrderItem` y `Favorite` | HECHO | `7aa61146` | — |
| B4 | Django Admin con las reglas del panel | HECHO | `df9428b6` | — |
| R | Carrera al borrar: un pedido nuevo desactiva el producto en vez de dar un 500 | HECHO | `61f891c7` | — |
| B8 | Traspaso Supabase → Django | HECHO | `877d2510`, migración `4e5d6137` | Variables nuevas en `backend/.env` (Eduardo) |
| B9 | Salida, permisos y endurecimiento | HECHO | `c3095506` | — |
| B6 | Tokens y Tailwind | HECHO | `0720d60b` | — |
| B7 | `panel/base.html` desde `dashboar.html` | HECHO | `df645294` | — |
| B10–B13 | Productos en el panel | ESPERA | | S3 |
| B14 | Rutas `/panel/productos/` | HECHO (se adelantó a B10–B13) | `6dc3429e` | — |
| B15 | Reemplazar el `base.html` claro de la M13 | PENDIENTE | | B7 y B10–B13 (el HTML rediseñado) |
| B3 | Historial de cambios (opcional) | PENDIENTE | | — |
| B5 | Entrega M14 | PENDIENTE | | B10 |
| B17 | M15 Django Templates | PENDIENTE | | Fase 2 |

## Bitácora

- 2026-10-06: plan aprobado por Eduardo. Diseño 1.1 traído desde pruebas@115490ea (`f4a21027`). La M14 no se manda al LMS hasta B5.
- 2026-10-06:
  - Todo lo de las ramas extra (`entrega-m14-django-models-admin` y `panel-django`) pasó directo a `practicas-ebac` (`6b720395`), y esas ramas se borraron. La M14 literal (`backend/ecommerce/`, `4ed789e4` y `2e222757`) ya está en `practicas-ebac`.
  - El contrato y el loop se corrigieron con la revisión del agente de rediseño.
  - B1 quedó empezado sin commitear en el worktree: pruebas y el arreglo en `inventory/views.py`. Se revisa y commitea cuando Eduardo dé la orden de seguir.
- 2026-10-07:
  - GGA revisa gratis: Gemini Flash-Lite con el revisor `gga-reviewer` y el snapshot de OpenCode apagado (`e77de1f3`, `7b513e8e`).
  - Los dos loops leen el contexto del otro agente en Engram antes de cada paso (`1869c669`, `541ddfeb`).
  - B1 hecho (`8e750cc2`): `product_update` guarda la ficha aunque todos sus valores sean cero, igual que `product_create`. Pasan 42 pruebas.
  - B2 hecho (`7aa61146`): `inventory/services.py` concentra la confirmación de precio, borrar o desactivar y cuándo se guarda la ficha; los mirrors `OrderItem` y `Favorite` (solo lectura, sin DDL: la migración `0002` es solo estado) reemplazan el SQL crudo. Pasan 81 pruebas.
  - B4 hecho (`df9428b6`): `ProductAdmin` aplica las reglas del panel con los servicios: `price_per_lb` solo lectura, casilla "Confirmar cambio de precio o cantidad mínima" que `ProductAdminForm` exige al cambiar el precio por kg o la cantidad mínima (no en productos nuevos), y `delete_model` y `delete_queryset` borran o desactivan y avisan cuáles se desactivaron. Django sigue mostrando su mensaje de eliminado y registra un borrado para esos productos, porque ambos salen del admin y no de esos dos métodos. Pasan 98 pruebas.
  - R hecho (`61f891c7`): `delete_or_deactivate` borra dentro de un savepoint. Si un pedido llega entre el conteo y el borrado y la base lo rechaza (`ON DELETE RESTRICT`), el producto se desactiva y el resultado lo dice, en vez de un `IntegrityError` (500). Pasan 102 pruebas.
  - B8 hecho (`877d2510`, migración `4e5d6137`): la app `panel` con `POST /panel/sesion/`. Verifica el origen, la firma (JWKS o HS256, un solo modo según la configuración), `exp`, `aud`, el emisor y la edad del token, exige `profiles.role = 'admin'` y abre la sesión de un usuario de Django sin contraseña y sin staff. `panel_admin_required` protege `/panel/` y manda al resto a `/panel/acceso/`, que lleva al login de la tienda. Pasan 202 pruebas, y el traspaso se comprobó de punta a punta en Chrome (tienda en otro puerto → `/panel/sesion/` → panel) con un token de prueba.
  - B8 pendiente de Eduardo: faltan en `backend/.env` las variables nuevas (los valores locales están en `backend/README.md`). Sin ellas Django no arranca: `SUPABASE_URL is not set`.
  - Contrato corregido: la página de la tienda que hace el traspaso no puede mandar `Referrer-Policy: no-referrer`, porque Chrome manda `Origin: null` y Django rechaza el traspaso; sirven `strict-origin` y el `strict-origin-when-cross-origin` que `netlify.toml` ya manda; lo que no hay que hacer es cambiarla a `no-referrer`.
  - B9 hecho (`c3095506`): `POST /panel/salir/` (con CSRF, fuera del guardia a propósito para que salga también un admin al que ya le quitaron el rol). `panel_admin_required` lee `profiles.role` en cada petición y cierra la sesión de quien dejó de ser admin, sin tocar la de un staff del admin de Django. Cookies `Secure`, `HttpOnly` y `SameSite` desde `.env` (`Strict` se rechaza al arrancar porque rompería el traspaso), sesión de 8 horas sin renovarse. Pasan 233 pruebas, y el traspaso y la salida se comprobaron de punta a punta en Chrome.
  - `Referrer-Policy` queda en `same-origin` y no en `no-referrer` (que pedía el encargo): en Chrome, `no-referrer` hace que el navegador mande `Origin: null` en todos los POST, también los del propio Django, y el CSRF de Django los rechaza; se rompían la salida, los formularios y el admin. Contrato corregido.
  - Sin CSP de Django todavía: el contrato no la pide (el CSP de §5b es el de Netlify) y la define `panel/base.html` (B7).
  - S4 queda listo del lado del backend (`/panel/sesion/` y `/panel/salir/`). Para probarlo contra Supabase hace falta aplicar la migración `4e5d6137` y agregar las variables a `backend/.env`.
  - B14 hecho (`6dc3429e`): las cinco vistas de `inventory` viven bajo `/panel/productos/` con los mismos nombres (`inventory:list`, `detail`, `create`, `update` y `delete`), y `/inventario/` ya no existe ni redirige. Pasaron de `login_required` a `panel_admin_required`: solo entra un admin del traspaso, con el rol leído en cada petición; el login del admin de Django ya no abre los productos, y `LOGIN_URL` se quitó porque nada lo usa. B14 se adelantó a B10–B13 porque las rutas no dependen del HTML rediseñado: siguen las plantillas claras de la M13 hasta B15. La prueba de rutas protegidas ahora recorre el URLconf raíz y cubre los productos. Pasan 239 pruebas, ruff limpio.
  - Migración `4e5d6137` aplicada en local con `supabase migration up --local` (nunca `db reset`). Gate SQL OK como rol `django`, dentro de una transacción con `ROLLBACK`:
    - solo ve la fila admin de prueba;
    - el cliente no aparece;
    - `full_name`, INSERT, UPDATE y DELETE dan `permission denied`.
  - Para el gate, `postgres` necesita `GRANT django TO postgres` dentro de la misma transacción. Por defecto tiene la membresía de creador de Postgres 16 (admin sí, `SET ROLE` no), y el `ROLLBACK` la deja como estaba. `supabase_admin` pide contraseña.
  - B6 hecho (`0720d60b`): Django tiene su hoja de Tailwind v4 compilada con los tokens de la tienda.
    - S1 llegó en `3e471379`, `7991d6af` y `3e5d1e79`. `backend/assets/tokens.css` es copia idéntica de `src/styles/tokens.css` en `pruebas` (sha256 `6847e086ea66e78e94ee4ca60890e721f693fa50f8ead7e416bd324743d5cd05`).
    - `backend/scripts/build_panel_css.sh` revisa la deriva (los tokens y las versiones fijadas de Tailwind y de las dos fuentes contra `origin/pruebas`), compila en Docker con la imagen de `.devcontainer` y tiene `--check` y `--sync-tokens`. El resultado, `backend/static/panel/panel.css`, va versionado y lo sirve `staticfiles` (`STATICFILES_DIRS`); `backend/assets/` no se publica.
    - Geist y Fraunces van autoalojadas (solo `latin`, con su licencia OFL junto a cada archivo), de los mismos paquetes y versiones que la tienda. La salida es idéntica byte a byte entre ejecuciones y entre `linux/arm64` y `linux/amd64`.
    - Pasan 247 pruebas, ruff limpio y `--check` en verde. En Chrome, las dos fuentes cargan desde el `staticfiles` de Django.
    - Ninguna plantilla la enlaza todavía: eso es B7 (espera a S2). Cuando el rediseño cambie `tokens.css` o suba una de esas versiones, el script falla hasta que el backend resincronice (`--sync-tokens`).
  - B7 hecho (`df645294`): llegó S2 (`dashboar.html` rediseñado, `pruebas` `3254d3b4`, marco del panel).
    - Pasó con `git mv` a `backend/templates/panel/base.html` y es el marco de toda página del panel (bloques `title`, `titulo`, `accion` y `contenido`). El contenido de Inicio de ese archivo no se sirve todavía: vuelve como `panel/inicio.html` en su propia slice.
    - `aria-current` sale de `request.resolver_match`: el espacio `inventory` marca Productos; Más es `page` en `panel:mas` y `true` en `panel:ads` y `settings:index`. Pedidos, Clientes, Publicidad y Ajustes no tienen ruta (backlog): el marco los enlaza con su ruta literal del contrato y hoy dan 404. `PENDING_PATHS` en `panel/test_frame.py` los lista y la prueba falla el día que una ruta exista.
    - `panel:mas` (`/panel/mas/`, solo GET, con guardia) sirve `panel/mas.html`, de `kit/mas.html`. `panel/messages.html` dibuja los mensajes. `store_origin` (procesador de contexto) expone `STORE_ORIGIN`: el logo y las fotos de los productos son de la tienda.
    - `assets/panel.css` lleva la capa base de `src/styles/panel.css` de `pruebas` (fondo, tipografía, foco de arena) y `static/panel/panel.css` se reconstruyó. Ya hay una plantilla que enlaza la hoja.
    - `dashboar.html` ya no existe en la raíz. Referencias cambiadas en el mismo commit: entrada de Vite, `dist/dashboar.html` del CI, tres redirecciones de `js/modules/core/auth.js` y una de `js/modules/utils/admin-auth.js` (un admin entra por `index.html` hasta que el traspaso a Django se conecte en la tienda, F4), el enlace Dashboard de las tres páginas admin viejas, y las listas de `AGENTS.md`, `README.md`, la skill y el agente de frontend y `docs/MIGRACION_TAILWIND.md`. Los documentos históricos conservan su texto. Quedan sin uso `src/entry/dashboard.tsx` y `js/modules/pages/dashboard.js` (retiro en S6).
    - El build de la tienda pasa en Docker antes y después (solo desaparece `dist/dashboar.html`). Pasan 273 pruebas, ruff limpio y `--check` en verde.
