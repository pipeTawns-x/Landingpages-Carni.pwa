# Traspaso del frente de diseño al agente de backend (2026-10-06)

Para el agente que trabaja Django y Supabase en `~/Desktop/Carni-mvp` (rama `practicas-ebac`). Está escrito para leerse en 3 minutos. Cada dato marca su fuente; **verifícalo antes de actuar** (los números salen de informes de agentes del 2026-09-30).

## 0 · Cómo leer esto sin cambiar de rama

`~/Desktop/Carni-mvp` se queda en `practicas-ebac`. El código del frente de diseño está en la rama `pruebas`. Se lee sin hacer checkout:

```bash
git -C ~/Desktop/Carni-mvp show pruebas:docs/design/rediseno/HANDOFF-BACKEND.md
git -C ~/Desktop/Carni-mvp show pruebas:<ruta>        # cualquier archivo
# o directo, solo lectura: ~/Desktop/Carni-mvp-pruebas/<ruta>
```

## 1 · Estado en una frase

El frente migra el sitio actual a React + Tailwind v4 **dentro de las mismas páginas** (`index.html`, `products.html`, `accessweb.html`, `dashboar.html`; la migración la conduce OpenCode con `LOOP-OPENCODE.md`). Hay hecho: carcasa (encabezado, menú, carrito), landing y Tarjeta de producto en `src/ui`, `src/landing`, `src/data`. **No supongas que existen `landing.html`, `catalogo.html` ni `panel.html`: son rutas paralelas que se van a borrar.**

## 2 · Dónde buscar (y qué NO leer)

| Necesitas | Lee |
|---|---|
| Qué se sabía del backend (Supabase, Django, riesgos, OpenCode) | `docs/design/rediseno/investigacion/03-backend-y-opencode.md` (19 KB) |
| Requisitos de seguridad del frontend y propuesta SQL | `docs/design/rediseno/06-plano.md` **solo §5** (usa `rg -n "^## 5"`; el archivo pesa 127 KB) |
| Qué dice la tienda hoy sobre productos y precios | `docs/design/datos/catalogo-real.md` |
| Qué usa el frontend de Supabase | `src/data/supabase.ts`, `src/data/catalogo.ts`, `src/data/useCatalogo.ts` y, en el sitio viejo, `js/modules/supabase.js`, `js/modules/core/api.js` |
| Estado y decisiones del rediseño | `docs/design/rediseno/ESTADO.md` (cuerpo corto arriba; la bitácora está abajo) |
| Memoria | Engram: `mem_search "handoff/chat-backend-desde-frontend"` en los proyectos `carni-mvp` **y** `Landingpages-Carni.pwa` (el proyecto se volvió a partir en dos) |

**No leas** (gastan tokens sin aportar al backend): `docs/design/claude-design-1.1/` (16 páginas de diseño, 880 KB), `docs/design/capturas-actuales/`, `docs/design/rediseno/capturas-r4/`, `docs/design/rediseno/investigacion/capturas-1.1/`, `docs/design/assets/` ni `docs/design/loop-*.md`. Usa `rg -n` con un patrón antes de abrir cualquier archivo grande.

## 3 · Lo que el frontend usa hoy de Supabase (comprobado con `rg`)

- RPC: `create_order_with_items`, `add_points`.
- Tablas: `profiles`, `orders`, `products`, `categories`, `favorites`, `cart_items`, `push_subscriptions`.
- Variables públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (respaldo viejo `VITE_SUPABASE_KEY`), `VITE_VAPID_PUBLIC_KEY`. El bundle no trae claves de servicio.
- Autenticación: solo Supabase Auth. **Clerk no se usa** (la skill `carni-auth` está desactualizada).
- El panel actual es 100 % Supabase: `supabase-js` con el JWT del usuario y RLS con `is_admin()`. La puerta de admin es solo de cliente (`js/modules/utils/admin-auth.js`, `verifyAdminSession`, líneas 53-69). Pendiente P-42 de `docs/PENDIENTES.md`: los enlaces "Salir" nunca llaman `signOut()`.
- Datos del catálogo hoy: 53 productos activos y 9 categorías; solo 9 productos tienen foto propia. `store_settings` (una fila): `min_order_pickup` 0 y `min_order_delivery` 150.

## 4 · Riesgos de seguridad que son del backend (de más a menos grave)

1. **ALTO · Los clientes escriben sus propios pedidos.** Las políticas `orders_insert_own`, `orders_update_own` y `order_items_insert_order` solo comprueban la propiedad; el rol `authenticated` tiene UPDATE sobre `orders.status` y `orders.total`. Se salta el RPC `create_order_with_items` (que fija el precio en el servidor). `orders` tiene 0 filas: corregirlo ahora es barato. `status` tiene CHECK; `total` no.
2. Advisors de Supabase (todas WARN): 4 funciones con `search_path` mutable; 10 funciones `SECURITY DEFINER` ejecutables por `anon` y `authenticated`; 8 tablas visibles en el esquema GraphQL; protección de contraseñas filtradas apagada. `anon` y `authenticated` tienen privilegios de tabla completos: RLS es la única barrera.
3. Producción (`wlikxgklwutxxazbhmkv`) tiene solo 5 migraciones (la última, `202608250001`). **No tiene** el esquema y rol `django` ni la tabla `chat_messages` (esas migraciones existen solo en local y en `practicas-ebac`/`pruebas`). Django no puede correr contra producción hoy.
4. Django: solo sirve `/admin/` y `/inventario/` renderizado en servidor, con `@login_required` a secas (sin `is_staff` ni permisos), usuarios propios de Django (no el JWT de Supabase), sin DRF/CORS/JWT, y `settings.py` sin ningún `SECURE_*`, cookie ni `CSRF_TRUSTED`. No está en `main`.
5. `netlify.toml` conserva `unsafe-inline` y `unsafe-eval` en `script-src`; `connect-src` solo permite Supabase y open-meteo (una API Django futura exige añadir su host). `server/app.ts` sirve toda la raíz del repo con `express.static` y solo `/api/buildads` tiene límite de peticiones, sin autenticación.

**Migración propuesta (NO escrita todavía; la carpeta `docs/design/rediseno/seguridad/` no existe).** Esquema de lo que debe cubrir: quitar a `authenticated` el INSERT/UPDATE directo en `orders` y `order_items` (todo pedido por `create_order_with_items`), `REVOKE UPDATE (status, total)`, `CHECK (total >= 0)`, `REVOKE EXECUTE ... FROM anon` en las `SECURITY DEFINER`, `search_path` fijo, y una prueba `BEGIN … ROLLBACK` en el Postgres local (`docker exec supabase_db_Carni-mvp psql -U postgres`, puerto 54322) antes de entregarla. **No se aplica a producción sin Eduardo**: `supabase/migrations` es contrato común entre los dos frentes.

## 5 · Lo que el diseño promete y marca "falta backend" (el frontend lo muestra rotulado)

- **Métricas del chatbot** (pantallas 43 a 45 del diseño): filtros Hoy / 7 días / 30 días y canal Web / WhatsApp; conversaciones, personas atendidas, resueltas por el asistente, pasadas a una persona, pedidos que empezaron en el chat, "me sirvió"; mensajes entrantes y salientes por día; temas más preguntados con conteo y tendencia; "Sin respuesta"; botón "Corregir" que guarda una respuesta aprobada (editar y apagar); teléfono del cliente enmascarado. Hoy el chat del sitio viejo (`js/modules/chatbot.js`, solo palabras clave) escribe en `public.chat_messages`; el asistente nuevo es guiado, sin campo libre y nunca inventa precios ni existencias.
- **Pago con tarjeta** por pasarela alojada (sin campos de tarjeta propios) y **anticipo del 50 % en paquetes** ("confirmar con el dueño"): cómo y cuándo se cobra no está decidido.
- **Zonas de entrega** (colonias que valida "Mis direcciones") y **Datos de la tienda y redes** editables desde Ajustes (teléfono, WhatsApp, correo, dirección, horario, Facebook, Instagram): hoy están fijos en el código; el frontend los lee de una constante y debería leerlos de `store_settings`.
- **Mínimo a domicilio**: hoy el frontend escribe $150 a mano en una respuesta de preguntas frecuentes; debe leerlo de `store_settings.min_order_delivery`.
- **Recuperar contraseña con código de 6 dígitos**: falta configurar la plantilla del correo en Supabase; el SMTP por defecto da 2 correos de autenticación por hora.
- **Catálogo de la semana** (BuildAds): hoja A4 y carrusel armados con las ofertas; sin endpoint.
- **Niveles 0 / 5 / 10 % y afiliados ($50 + $50)**: cifras por confirmar con el dueño.

## 6 · Deriva de datos que conviene corregir en la base

- El paquete se llama `Paquete Carnitas por Kilo`; la tienda lo muestra como "Paquete Carnitas" (no se vende por kilo).
- `products.price_per_kg` guarda también precio **por pieza o por paquete** en Merch, Otros y los paquetes de Ofertas. Falta una columna de unidad (confirmar con el dueño).
- Casi todas las fotos son una genérica por categoría (`/img/products/res.webp`, `pollo.webp`...). El frontend las rotula "Foto ilustrativa". El stock de la base es de ejemplo (8 a 150) y la tienda no muestra el número al cliente.
- Correo del sitio: los dos dominios que aparecían no tienen DNS; el frontend quitó el correo hasta que haya uno que funcione.

## 7 · Reglas comunes (contrato entre los dos frentes)

- `supabase/migrations` y `DESIGN.md` son contrato común. Un solo Tailwind y un solo `DESIGN.md` para la tienda y el panel. Nada de migraciones aplicadas sin que Eduardo las apruebe.
- Cada frente en su rama: frontend en `pruebas` (`~/Desktop/Carni-mvp-pruebas`), backend en `practicas-ebac` (`~/Desktop/Carni-mvp`). Nunca `checkout`, `switch`, `stash` ni `reset --hard` en el árbol del otro.
- Commits convencionales, bilingües (`tipo(ámbito): resumen en inglés / resumen en español`) y sin atribución a IA. Los commits del frente de diseño usan `--no-verify` porque el hook GGA llama a Claude y gasta los créditos de Eduardo.
- Engram: guarda con el proyecto **`carni-mvp` en minúsculas**. Guardar como `Carni-mvp` lo manda a otro cajón (OpenCode lo hizo y nadie lo encontró). Claves útiles: `handoff/chat-backend-desde-frontend`, `rediseno-mvp/progreso`.
- `npm`/`node` solo dentro de Docker (`docker exec carni-landing-dev …`, puerto 3002). Python con `uv`.

## 8 · Estado del frente de backend (corregido el 2026-10-07, verificado en `origin/practicas-ebac`)

**Corrección:** la versión anterior de esta sección decía que la M14 no existía. Era falso: yo había leído la rama local, que va atrasada, sin hacer `git fetch origin`. Se lee siempre con `git -C ~/Desktop/Carni-mvp fetch origin` y `git show origin/practicas-ebac:<ruta>`.

- **M13** (CRUD de inventario en Django): entregada el 2026-09-21 (`24725c6d`, PR #10 a #12).
- **M14** (modelos y admin con 500 productos): **existe y está entregada** el 2026-09-30.
  - `2e222757`: `backend/ecommerce/` con `models.py`, `admin.py`, la migración `0001_initial.py`, el comando `create_test_products.py` y `fixtures/products/500Products.json`.
  - `4ed789e4`: paginación del listado de `inventory` y pruebas sobre SQLite.
  - `6954d2ff`: documento de entrega, capturas y mensaje para el LMS.
  - El README de `backend/` indica que `POSTGRES_*` debe apuntar a la instancia **local** de Supabase (puerto 54322).
- **Documentos del panel servido por Django** (decisión de Eduardo del 2026-10-06), todos en `origin/practicas-ebac:docs/`: `CONTRATO_PANEL_DJANGO.md`, `DECISION_PANEL_DJANGO_2026-10-06.md`, `PANEL_DJANGO_ESTADO.md` y `LOOP_REDISENO_TOTAL.md`. **Este traspaso queda superado donde choque con ellos**, sobre todo en el panel: ya no es un shell React aparte, el HTML lo sirve Django.
- Pregunta abierta para Eduardo: dónde se alojará Django y cuándo pasa el backend a `main`.
