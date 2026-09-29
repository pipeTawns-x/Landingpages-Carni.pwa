# 02 · Sitio actual: mapa del código antes de construir el rediseño

Fecha: 2026-09-30 · Rama `pruebas` (worktree `~/Desktop/Carni-mvp-pruebas`) · Solo lectura: no se editó código, no se ejecutó npm en el host.

## 0. Resumen

- El sitio actual funciona con **cuatro documentos HTML raíz** (más tres de admin y `offline.html`) que montan islas de React sobre un marco de Bootstrap + SCSS 7-1. No hay SPA: solo `products.html` usa `HashRouter` (`src/entry/products.tsx:453-464`).
- El **prototipo Tailwind v4** (`landing.html`, sin commitear) cubre una landing de 11 secciones, pero se hizo con un diseño anterior: el orden de secciones, el encabezado, dos datos de contenido y las redes ya no coinciden con Diseño1.1 (sección 2).
- El **efecto del encabezado que Eduardo quiere de vuelta** existe y está documentado en `css/layout/_header.scss:65-98` (transparente sobre el video, fondo sólido al pasar el cursor). El prototipo no lo tiene (sección 3).
- Hay tres bloqueos concretos para verificar en Brave: (a) el contenedor `carni-landing-dev` está detenido, (b) el worktree `pruebas` no tiene `.env`, y el `.env` del checkout principal apunta a `host.docker.internal`, que el navegador del host no resuelve, (c) `supabase.js` lanza al importarse si faltan las variables (sección 5).
- El hook de commit falla con "No provider configured" por una causa medida: gga corre bajo bash 3.2.57 y no logra leer `.gga` (sección 7).

## 1. Mapa del worktree

Raíz: `index.html`, `products.html`, `accessweb.html`, `dashboar.html`, `admin-products.html`, `admin-customers.html`, `admin-orders.html`, `offline.html`, `landing.html` (nuevo, sin commitear), `manifest.json`, `netlify.toml`, `vite.config.js`, `jest.config.js`, `tsconfig.json`, `DESIGN.md`, `app.js` (práctica EBAC Node, aislada), `.devcontainer/`, `.gga`, `.github/workflows/{ci,deploy-pages}.yml`.

| Carpeta | Qué hay | Estado |
|---|---|---|
| `css/` | SCSS 7-1 (`abstracts`, `base`, `layout`, `pages`, `components`, `themes`, `vendors`); compila a `css/styles.css` (versionado) | vivo; alimenta los HTML viejos |
| `js/modules/` | `core/` (auth, cart, delivery, loyalty, quote), `pages/` (admin, dashboard, chart-config), `ui/` (header, hero-video, scroll-reveal, weather, notifications), `utils/`, `chatbot.js`, `supabase.js`, `app.js` | JS vanilla vivo; `checkout.js` está vacío (0 líneas) |
| `src/entry/` | un punto de entrada por HTML: `home`, `products`, `auth`, `dashboard`, `admin-*`, `offline`, `shared`, y `landing` (nuevo) | React montado como islas |
| `src/components/` | `CartPanel`, `Lupa`, `ProductCard`, `ProductList`, `CategoryCard`, `OrderList`, `Showcase`, `Relacionados`, `BannerEditorial`, `CarrilCategorias`, `Testimonios`, `BentoGrid` | styled-components (`styles.ts`), no SCSS co-locado |
| `src/pages/` | `ProductoDetalle.tsx` (581 líneas), `Carrito.tsx` (208) | rutas del `HashRouter` de products |
| `src/redux/` | `store.ts` + `carritoSlice`, `busquedaSlice` | estado del pedido; persiste en `localStorage` clave `carni_cart_v1` y evento `cart:updated` |
| `src/data/`, `hooks/`, `lib/`, `types/`, `theme/` | `seedProducts.ts` (33 productos), `resenas.ts`; `usePedido`, `useSupabaseQuery`, `useUnidadInteligente`; `formatearPrecio`, `lineaPedido`, `pedidoStorage`; `database.ts`; `carniTheme.ts` | reutilizable |
| `src/modules/buildads/` | `BuildAdsOrchestrator.tsx` (panel de anuncios) | vivo en el dashboard |
| `server/` | `app.ts` (Express, puerto 3100) + `routes/buildads.ts` (Predis, ElevenLabs) | solo para BuildAds |
| `src/styles/` | `redesign.css` (1715 líneas, tracked), `globalStyles.ts`, `tailwind.css` (nuevo) | ver sección 2 |

Config: Vite 7.3 con `@vitejs/plugin-react` y (nuevo) `@tailwindcss/vite`; alias `@`→`js`, `@css`→`css`, `@src`→`src` (`vite.config.js:19-25`); `publicDir: 'public'` (no cambiarlo, hay un comentario largo con el incidente P-06). Jest 30 con dos proyectos (`node` para `js/**/*.test.js`, `react`/jsdom para `src/**/__tests__/**/*.test.tsx`) y Babel en línea (`jest.config.js`). `tsconfig` estricto, `jsx: react-jsx`, solo alias `@src/*`.

### Trabajo sin commitear (`git status --short`)

- Modificados: `.atl/skill-registry.md`, `docs/design/loop-final.md`, `docs/design/loop-v3.md`, `package.json` (+`@tailwindcss/vite ^4.3.3`, +`tailwindcss ^4.3.3`), `package-lock.json` (+590 líneas; ya trae los bindings x64 de Linux, así que `npm ci` en CI no se rompe), `vite.config.js` (plugin Tailwind y entrada `landing`).
- Sin seguimiento: `landing.html`, `src/entry/landing.tsx`, `src/landing/` (14 archivos), `src/ui/` (5), `src/styles/tailwind.css`, `docs/design/mockups/`, `docs/design/verificacion/export-diseño1.1.md`.

## 2. El prototipo Tailwind v4: qué cubre y qué quedó viejo

**Cubre** (3845 líneas incluyendo `redesign.css`; el prototipo en sí son unas 2100):

- `landing.html` (27 líneas): Fraunces + Geist desde Google Fonts, `#landing-root`, entrada `src/entry/landing.tsx` que monta Redux + `Landing` y reutiliza `montarLupa()` y `montarCarrito()` por ids `#searchBtn` / `#cartBtn`.
- `src/styles/tailwind.css`: `@import "tailwindcss"` + `@theme` con los tokens de `DESIGN.md` (`--color-bg #0b0b0c`, `surface-1/2/3`, `red #dc2626`, `sand #e4d1b0`, `gold #f59e0b`, fuentes `display`/`sans`, `radius-card`, `radius-pill`) y los keyframes del giro de reseñas.
- `src/ui/`: `Encabezado`, `Pie`, `Tarjeta` (variantes normal/agotado/oferta/chica, unidad kg/pieza/paquete), `iconos.tsx` (16 íconos SVG), `assetUrl.ts`.
- `src/landing/Landing.tsx` monta: Portada, DatosRapidos, BentoCategorias, Destacado (Filete Mignon), MasPedidos, Opiniones, PreguntasFrecuentes, Ofertas, Nosotros, Horario, ContactoDirecto + Pie.
- `src/landing/useCatalogoVivo.ts`: importa `@src/entry/shared` con `import()` dinámico para sobrevivir a la excepción de `supabase.js` (`useCatalogoVivo.ts:55`).
- Aislamiento: Tailwind solo entra por `landing.tsx`; el preflight no toca los HTML viejos.

**Viejo frente a Diseño1.1** (`docs/design/rediseno/ESTADO.md` + `export-diseño1.1.md`):

| Punto | Prototipo | Diseño1.1 | Evidencia |
|---|---|---|---|
| Orden de secciones | Portada, datos, bento, destacado, más pedidos, **opiniones**, FAQ, ofertas, nosotros, horario, contacto | Portada, mostrador, carrusel Filete Mignon, lo que se lleva la gente, **ofertas, preguntas frecuentes**, carnicería de familia, horarios y puntaje, contacto y dirección, **comentarios**, pie | `Landing.tsx:39-52` vs ESTADO.md l.11 |
| Encabezado | Opaco `bg-bg`, cambia a `bg-surface-1` al bajar 8 px, sin hover, sin video detrás | Transparente sobre el video; al pasar el cursor el fondo cambia y se mezcla | `Encabezado.tsx:44-52` |
| Portada móvil | Video en tarjeta redondeada de 320 px de alto, texto debajo | 16:9 tipo YouTube, texto como fondo del video, ajustado al bloque | `Portada.tsx:45` |
| Video | `public/img/Videos/VideoCarniwebP01.*` (el viejo) | `portada-carne.mp4/.webm/-poster` (solo existe en `docs/design/assets/video/`, aún no en `public/`) | `Portada.tsx:55-60` |
| Redes | `FACEBOOK_URL = ''`, `INSTAGRAM_URL = ''` (el Pie las oculta) | enlaces reales de Facebook e Instagram (criterio "Facebook real >=2") | `datos.ts:334-335`, `Pie.tsx:50-61` |
| Contenido prohibido | `Paquete Carnitas por Kilo` sigue en `datos.ts:242` | criterio del export: 0 apariciones | `datos.ts:242` |
| Logo | wordmark en texto "CARNICERÍA / EL SEÑOR DE LA MISERICORDIA" | logo tipográfico (correcto) + monograma en el diseño | `Encabezado.tsx:73-88` |
| Chatbot | **No se renderiza** (decisión documentada en `Landing.tsx:17-33`) | asistente cuidado, sin inventar respuestas | `Landing.tsx` |
| Hamburguesa | `#menuToggle` cableado pero sin cajón: no hace nada | menú con misma edición y X | `Encabezado.tsx:54-66`, `landing.html:19-24` |
| Tokens | tipografía escrita en px por componente, no en escala | la escala de DESIGN.md | `tailwind.css:11-20` |

Lo que sigue sirviendo casi tal cual: `Tarjeta` (regla de precio por libra ×0.4536, enlace a ficha real), `iconos.tsx`, `assetUrl.ts`, `useCatalogoVivo` (patrón de import dinámico), `Horario`, `PreguntasFrecuentes`, `Pie` (con sus enlaces reales), el `@theme`.

## 3. El efecto viejo del encabezado (citas exactas)

Es el commit `ba9e3627` (2026-08-31, "barra pegada que va de transparente a negro"). Antes de él la barra era `rgba(52,58,64,.98)` fija.

**CSS: `css/layout/_header.scss`**

- `:7-26` `.main-header`: `position: sticky; top: 0;` `background: rgba(0,0,0,0.85)`, `transition: transform .25s, opacity .25s, background-color .3s ease`, `backdrop-filter: none` (a propósito: el comentario dice que en `sticky` re-muestrea lo de atrás y parpadea).
- `:65-71` `.dark-premium .main-header.main-header--over-media, .main-header.main-header--over-media { background: transparent; box-shadow: none; ... }` — **el estado "mezclado con el video"**. Se encadenan dos clases (especificidad 0,3,0) para ganarle a `.dark-premium .main-header` de `themes/_dark-mode.scss`, que se importa después.
- `:75-87` `&::before`: velo `linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,.28) 55%, rgba(0,0,0,0) 100%)`, `pointer-events: none`, `transition: opacity .3s`. Protege el logo blanco sobre tomas claras.
- `:89-97` **el efecto de hover**: `&:hover, &:focus-within { background: rgba(0,0,0,0.92); &::before { opacity: 0; } }` (el fondo pasa a casi sólido y el velo se apaga; `focus-within` lo hace accesible por teclado).
- `:105-126` `:root { --header-height: 56px }` (64 a `min-width:768px`, 72 a `992px`) y `.home-hero-video { position: relative; z-index: 1; margin-top: calc(-1 * var(--header-height)); }`: el video **sube por debajo** del encabezado sticky; sin ese margen negativo no hay nada que mezclar.
- `:147-165` estado sólido (al bajar): `.main-header.main-header--solid { background: #0a0a0a; box-shadow: 0 1px 0 rgba(255,255,255,.08), 0 8px 24px rgba(0,0,0,.55); transition: background .32s, box-shadow .32s; &::before { content: none } }`.
- `:169-185` `prefers-reduced-motion`: se quita la transición, el color cambia igual.

**Marcado**: `index.html:60` `<header class="main-header main-header--over-media" id="mainHeader">`; el hero es `index.html:163-182` (`<section class="... home-hero-video ...">` con `<video class="home-hero-video__media" autoplay muted loop playsinline preload="metadata" poster=...>` y `.home-hero-video__overlay`).

**Estilos del hero**: `css/pages/_home.scss:938-991`: `aspect-ratio: 16 / 9` con `width: 100%` en móvil (`:952-954`), `min-height: clamp(420px, 62vh, 640px)` desde 768 px (`:962-965`), `object-fit: contain` en móvil y `cover` desde 768 (`:977-982`), overlay `linear-gradient(180deg, rgba(9,9,9,.45), rgba(9,9,9,.25) 45%, rgba(9,9,9,.7))` (`:989`). Esto ya es el "tamaño YouTube 16:9" que Eduardo pide en móvil.

**JS que alterna las clases**: `src/entry/home.tsx:192-270` (`gobernarEncabezado`): `solido(si)` alterna `main-header--solid` / `main-header--over-media`; un `IntersectionObserver` sobre un centinela de 1 px hermano del hero con `rootMargin: '-56px 0px 0px 0px'` (`:242`) y un listener de `scroll` redundante que compara `getBoundingClientRect().top <= 56` (`:258-267`). Versión anterior, archivada: `docs/archivo/js-retirado/header-scroll.js:16-68` (punto de cambio = alto del hero − 80 px). `js/modules/ui/header.js:9-24` documenta que ya no toca el estado del encabezado.

**Lo que hay que trasladar a React + Tailwind** (y lo que no): el hover del viejo no es un desenfoque sino un cambio de fondo a `rgba(0,0,0,.92)` con velo que se apaga. Para móvil (sin hover) el equivalente es `:focus-within` más el estado sólido al bajar. El prototipo actual no puede recibirlo sin cambios porque su video vive en una tarjeta con padding, no debajo del encabezado.

## 4. Piezas del sitio viejo (referencia para replicar o rehacer)

| Pieza | Dónde vive hoy | Cierre (X) |
|---|---|---|
| **Chatbot** | Vanilla: `js/modules/chatbot.js` (305 líneas) + `css/components/_chatbot.scss` (308); marcado en `index.html:425-459`, `products.html`, `accessweb.html`. Respuestas por palabra clave (`responses`, `chatbot.js:36`), historial en `localStorage` (`carni_chat_history`, `carni_chat_session`), inserta cada mensaje en `public.chat_messages` por REST "fire-and-forget" (`:143-166`). Su CSS depende de `--carni-gold` y del keyframe `pulse-ring` de `styles.scss` (por eso el prototipo lo omitió). **No existe versión React.** | `#chatClose` (`index.html:442`, `aria-label="Cerrar asistente virtual"`) y Escape (`chatbot.js:290`) |
| **Cajón del carrito** | React: `src/components/CartPanel/CartPanel.tsx` (194 líneas) + `montar.tsx`, montado en cada página por `montarCarrito()`. Deliberadamente no es un diálogo: sin fondo oscuro ni trampa de foco (`CartPanel.tsx:50`). `index.html:374-399` aún trae un modal Bootstrap `#cartModal` y `#loyaltyModal` heredados. | Botón `aria-label="Cerrar el pedido"` (`:113`), Escape (`:64`), y cierra al salir (`:175`) |
| **Hamburguesa / menú lateral** | Vanilla: `#menuToggle`, `#mobileDrawer`, `#drawerOverlay`, `#drawerClose` (`index.html:68,111-150`); lógica en `js/modules/ui/header.js:50-107` (abrir, cerrar por overlay, por enlace, por Escape, bloquea el scroll del body) | `#drawerClose` `aria-label="Cerrar menú"` (`index.html:121`) + overlay + Escape |
| **Tarjeta de producto** | React `src/components/ProductCard/ProductCard.tsx` (175 líneas, styled-components) + reglas en `redesign.css` y `css/pages/_productos.scss`; no agrega al carrito directo: enlaza a la ficha `#/producto/:id`. Existen **dos** tarjetas: esta y `src/ui/Tarjeta.tsx` (prototipo). | n/a |
| **Login / registro (slide)** | `accessweb.html:109-273`: `.auth-container#authContainer`, dos formularios (`#loginForm`, `#registerForm`) y dos paneles con imagen; el deslizamiento es la clase `sign-up-mode` (CSS en `css/pages/_access.scss:284-288,843`) que alterna un `<script>` inline (`accessweb.html:329-363`) con `#btnShowRegister`, `#btnShowLogin`, `#mobileShowRegister`, `#mobileShowLogin`. La lógica de Supabase está en `js/modules/core/auth.js` (`signInWithPassword` `:196`, `signUp` `:312`, OAuth `:349`,`:368`); en `src/entry/auth.tsx` solo hay una franja editorial y el montaje de Lupa/Carrito. No es un modal: no hay X. | no aplica (página completa), pero conviene que el diseño nuevo lo diga |
| **Lupa (búsqueda)** | React: `src/components/Lupa/Lupa.tsx` (581 líneas): `role="dialog" aria-modal="true"` (`:405-406`), trampa de foco y devolución de foco (`:261-321`), Escape (`:286`), botón de esquina "Cerrar la búsqueda" (`:412`). Se abre desde `#searchBtn` / `.header-search`. Consulta Supabase con `.ilike` parametrizado, mínimo 2 caracteres. | X en esquina + Escape + fondo |
| **Dashboard** | `dashboar.html` (280 líneas): sidebar Bootstrap `.admin-sidebar`, navbar con `#sidebarToggle`, dos dropdowns, `#buildAdsReactRoot` (BuildAds React), gráficas Chart.js, tabla DataTables. Guarda de sesión: `verifyAdminSession()` en `<head>` (`dashboar.html:18-22`, `js/modules/utils/admin-auth.js`). Datos de gráficas: `chart-config.js` (224 líneas). | **Falla real**: el sidebar solo se cierra con el mismo botón hamburguesa (`dashboar.html:274-276`, clase `.show` de `_admin.scss:126`), sin X ni overlay. Los dropdowns cierran con clic fuera (Bootstrap). |

Defectos de seguridad/UX ya visibles en el dashboard viejo (relevantes para "Panel: seguro"):

1. "Cerrar sesión" es `<a href="index.html">` (`dashboar.html:98`): navega, **no llama a `signOut()`**; ningún script de esa página lo hace (`rg signOut` en `admin.js`/`dashboard.js` da 0). La sesión de Supabase sigue viva.
2. La puerta de admin es solo del cliente (`profiles.role === 'admin'`, `admin-auth.js:36-40` y `:63-67`). La protección real tiene que estar en RLS; hay que verificarlo con el agente de backend.
3. `adminLoginForm` lee un campo `adminToken` que nunca se usa (`admin-auth.js:13`), y muestra `alert()` con `error.message` del servidor (`:29`).
4. Enlaces `href="#"` muertos en "Perfil", "Configuración", "Ver todas" y notificaciones con "3 nuevas" fijo (`dashboar.html:74-96`).
5. jQuery y DataTables se cargan de `code.jquery.com` y `cdn.datatables.net` sin `integrity` en DataTables; el CSP de producción no los permite (sección 8).

## 5. Capa de datos

- **Cliente**: `js/modules/supabase.js` importa `createClient` desde `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm` (`:2`), **no** del paquete npm que sí está en `dependencies` (versión flotante `@2`, dependencia de red en tiempo de carga). Lee `import.meta.env.VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY || VITE_SUPABASE_KEY` (`:4-7`).
- **El bug conocido**: `supabase.js:10-14` hace `throw new Error('Supabase configuration missing...')` en el nivel superior del módulo si falta alguna variable. Quien lo importe de forma estática se lleva el bundle entero. `src/entry/shared.tsx:2` lo importa estáticamente y **todas** las entradas React importan `./shared` (`home`, `products`, `auth`, `dashboard`, `admin-*`, `offline`), por eso una página sin `.env` queda en blanco. El prototipo lo esquivó con `import()` dinámico (`useCatalogoVivo.ts:55-65`). `js/modules/core/auth.js` y `utils/admin-auth.js` lo importan de forma estática; `core/cart.js` lo carga con `import()` dinámico (`cart.js:31`).
- **Variables (solo nombres)** que el código lee: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_KEY` (alias), `VITE_VAPID_PUBLIC_KEY` (con un valor de relleno `'your-vapid-key'` en `notifications.js:50`), `VITE_APP_VERSION` (netlify.toml). Servidor Express: `PORT`, `PREDIS_API_KEY`, `ELEVENLABS_API_KEY`. El `.env` del checkout principal define `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `GROQ_API_KEY`. `.env`, `.env.local`, `.env.*.local` están en `.gitignore`.
- **Productos**: `getProducts()` (`supabase.js:79`) trae `products` con `categories(name, slug)`, `is_active = true`, `stock > 0` por defecto; `getCategories()` (`:143`) ordena por `"order"`. `fetchProducts()` / `fetchCategories()` (`shared.tsx:123`, `:74`) corren la consulta contra un temporizador de `PRODUCTS_TIMEOUT_MS = 2000` (`shared.tsx:28`) y, si gana el temporizador o falla, devuelven `SEED_PRODUCTS` (33 productos, transcritos de `supabase/seed.sql`) o `FALLBACK_CATEGORIES` (9). `live: boolean` indica el origen.
- **Conexión real hoy**: en el `.env` del checkout principal `VITE_SUPABASE_URL` contiene `host.docker.internal` (comprobado sin imprimir el valor). El navegador del host **no resuelve** ese nombre (`dscacheutil` sin resultado). Consecuencia: en Brave todas las lecturas fallan y el sitio muestra siempre el seed tras 2 s. El Supabase local sí está arriba (Kong en `localhost:54321`, base en `54322`, Studio en `54323`). Para datos vivos en Brave la URL pública tendría que ser `http://localhost:54321`; eso cambia el contrato de entorno y requiere aprobación (AGENTS.md, Human In The Loop).
- **El seed no coincide con el diseño**: `seedProducts.ts:28` trae "Picaña" (id 13) y el export exige 0 apariciones visibles de "picaña"; `datos.ts` (landing) depende de nueve nombres que no están en el seed pero sí en la base local (`useCatalogoVivo.ts:18-30`). Quien construya el catálogo debe decidir cuál es la fuente de verdad del contenido.
- **Carrito**: `carritoSlice` + `usePedido` + `pedidoStorage`. Contrato entre páginas: `localStorage['carni_cart_v1']` y evento `cart:updated` (compartido con `js/modules/core/cart.js`). Cualquier página nueva debe respetarlo o el carrito se pierde al saltar entre documentos.
- **Pedidos**: `createOrder()` llama al RPC `create_order_with_items` (`supabase.js:230`); el comentario en `:233-235` cuenta que estuvo roto meses por el nombre de un parámetro. No hay pasarela de pago en el repo.

## 6. Docker (solo inspección; no se arrancó nada)

Archivos: `.devcontainer/Dockerfile` (`mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm`, `CMD sleep infinity`, expone 3000/3002/4173), `.devcontainer/docker-compose.yml` (servicio `app`, bind `..:/workspace`, puertos `3000:3000`, `3002:3002`, `4173:4173`), `.devcontainer/devcontainer.json` (`postCreateCommand: npm install`). `docker compose config` resuelve sin errores.

Contenedor **`carni-landing-dev`** (existe): imagen `devcontainer-app:latest` (2.07 GB), `Cmd: npm run dev`, bind `~/Desktop/Carni-mvp-pruebas` → `/workspace`, puertos 3000/3002/4173 publicados, **Exited (1)** desde 2026-09-27. Los logs muestran que Vite 7.3.2 llegó a "ready in 345 ms" en `:3002` y que la salida con código 1 fue un `SIGTERM` (lo detuvieron), no un fallo. Hay un `Error: spawn xdg-open ENOENT` inofensivo: `vite.config.js:15` tiene `open: '/index.html'` y el contenedor no tiene navegador. No tiene ninguna variable `VITE_*` en su entorno. Ahora mismo **nada escucha en `localhost:3002`**.

`node_modules/` del worktree tiene bindings **Linux arm64** (`@rollup/rollup-linux-arm64-gnu`, `@esbuild/linux-arm64`, `@tailwindcss/oxide-linux-arm64-gnu`): se instaló dentro de Docker. Un `npm install` en el host los pisaría con binarios de macOS y rompería el contenedor. Por eso npm siempre en Docker.

Comandos (desde cualquier carpeta; usan la ruta absoluta del worktree):

```bash
WT=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas

# Servidor de desarrollo (reutiliza el contenedor existente; ejecuta `npm run dev`)
docker start carni-landing-dev
curl -sI http://localhost:3002/landing.html | head -1      # verificar 200

# Con el contenedor arriba, el resto se ejecuta dentro de él
docker exec carni-landing-dev npm run ts:check              # tsc --noEmit
docker exec carni-landing-dev npm test                      # jest (NODE_OPTIONS ya va en el script)
docker exec carni-landing-dev npm run build                 # vite build -> dist/

# Sin contenedor de dev: uno desechable con el mismo volumen
docker run --rm -v "$WT":/workspace -w /workspace devcontainer-app npm run build
docker run --rm -v "$WT":/workspace -w /workspace devcontainer-app npm test
docker run --rm -v "$WT":/workspace -w /workspace devcontainer-app npm run ts:check

# Vista previa del build (puerto 4173)
docker exec -d carni-landing-dev npm run preview            # http://localhost:4173/

# Ver registros / detener
docker logs --tail 40 carni-landing-dev
docker stop carni-landing-dev
```

**Puerto para Brave**: `http://localhost:3002/landing.html` (prototipo actual); el rediseño se abrirá en `http://localhost:3002/` + la ruta que se defina. `index.html` sigue siendo el sitio viejo. Vite escucha en `0.0.0.0` y Docker publica `3002`, así que también sirve `http://<IP-de-la-Mac>:3002/` desde el teléfono en la misma red.

Nota de `AGENTS.md`: el servidor de desarrollo debe levantarse desacoplado de la sesión. Con Docker eso ya se cumple (`docker start` no es hijo de la sesión de Claude). Pendiente para datos vivos: sección 5.

## 7. Puertas de calidad

**Pruebas (Jest)**: 4 archivos, 29 casos contados con `rg` (no se ejecutaron): `CartPanel.test.tsx` (4), `ProductCard.test.tsx` (7), `OrderList.test.tsx` (2), `js/modules/core/__tests__/quote.test.js` (16). No existe `tests/` en la raíz (el proyecto `node` del `jest.config.js` apunta a `tests/**` que hoy no existe; solo recoge `js/**`). No hay pruebas para `Lupa`, `ProductoDetalle`, `Carrito`, `Encabezado`, `Tarjeta` ni nada de `src/landing/`. **Último resultado conocido: no hay registro** en `docs/` ni en engram (`mem_search` sin resultados); hay que correrlas en Docker para saberlo. `collectCoverageFrom` solo lista 3 componentes.

**Tipos**: `npm run ts:check` (`tsc --noEmit`), TypeScript ^6, `strict`. Sin registro de última corrida.

**ESLint / Prettier**: **no existen** (ni configuración ni dependencias en `package.json`). Tampoco `.editorconfig` ni stylelint.

**CI** (`.github/workflows/ci.yml`): Node 20.19.0 → `npm ci` → `node --check app.js` → `npm run build` → comprueba que existan `dist/{index,products,accessweb,dashboar,offline}.html`. **No corre pruebas ni `ts:check`, no escanea secretos** (AGENTS.md dice que el escaneo debe estar en CI), y no verifica `landing.html`. `deploy-pages.yml` publica en GitHub Pages con una base distinta (`/Landingpages-Carni.pwa/`); por eso todo asset dinámico debe pasar por `assetUrl()`.

**GGA (pre-commit)**: el hook es `~/Desktop/Carni-mvp/.git/hooks/pre-commit` → `gga run || exit 1` (compartido por todos los worktrees; `core.hooksPath` sin definir). `.gga` está versionado en `pruebas` con `PROVIDER="claude"`, `FILE_PATTERNS="*.ts,*.tsx,*.js,*.jsx"`, `EXCLUDE_PATTERNS` de pruebas y `d.ts`, `RULES_FILE="AGENTS.md"`, `STRICT_MODE="true"`, `TIMEOUT="300"`. Existe además `~/.config/gga/config` con `PROVIDER="claude"`.

**Causa medida del "No provider configured"** (gga v2.10.1, `bin/gga:268-300` y `:788`): `load_config` hace `source <(sed ... "$config" | tr -d '\r')`. El script arranca con `#!/usr/bin/env bash`, y con el PATH de un hook o de un agente (`/usr/bin` antes que `/opt/homebrew/bin`) resuelve a **bash 3.2.57** del sistema. Con bash 3.2, `source <(...)` **no ejecuta nada si el contenido empieza con líneas de comentario** (probado: `source <(printf "# c\n# d\nPROVIDER=x")` deja `PROVIDER` vacío; `eval "$(cat .gga)"` sí lo lee). Ambos archivos de configuración empiezan con comentarios, así que `gga config` muestra `PROVIDER: Not configured` y `FILE_PATTERNS: *` (valores por defecto). Verificado como solución sin tocar nada:

- `/opt/homebrew/bin/bash /opt/homebrew/bin/gga config` → `PROVIDER: claude` y los patrones de `.gga` (bash 5.3.20 instalado).
- `GGA_PROVIDER=claude gga config` → `PROVIDER: claude` (pero con bash 3.2 seguirían sin cargar `FILE_PATTERNS`/`EXCLUDE_PATTERNS`, y revisaría todos los archivos, incluidos docs y pruebas).

Recomendación para los commits de código: anteponer `/opt/homebrew/bin` al PATH (`PATH=/opt/homebrew/bin:$PATH git commit ...`) para que `env bash` sea 5.x. Arreglo de fondo (fuera de este alcance y con aprobación): que el hook fije `#!/opt/homebrew/bin/bash` o que se actualice gga. Además, en la shell interactiva de Eduardo `gga` es un **alias de `git gui citool --amend`**, así que escribir `gga` a mano no ejecuta la herramienta; hay que usar `/opt/homebrew/bin/gga`. Un commit solo de documentación no dispara la revisión de IA porque `FILE_PATTERNS` no incluye `.md`.

## 8. Otros riesgos del código actual que afectan al rediseño

- **CSP de producción** (`netlify.toml:33-46`): `script-src` solo permite `cdn.jsdelivr.net` y `unpkg.com`; `style-src` solo `fonts.googleapis.com` + jsdelivr; `img-src` sin `*.supabase.co`. Bloquearía en producción: Font Awesome (`kit.fontawesome.com` en `accessweb.html:17`), jQuery (`code.jquery.com`) y DataTables (`cdn.datatables.net`) del panel, e imágenes de Storage de Supabase si `image_url` fuera absoluta. Fraunces/Geist sí caben (`fonts.googleapis.com` + `fonts.gstatic.com`); el video propio también (`default-src 'self'`). Antes de publicar el rediseño hay que revisar el CSP con las dependencias finales. `'unsafe-inline'` y `'unsafe-eval'` en `script-src` debilitan el CSP.
- **Tres paletas rojas/crema a la vez**: `carniTheme.ts` y `@theme` usan `#dc2626`; `redesign.css` usa `--redesign-*` y la ficha `--acento: #c8302f` (`redesign.css:879-883`). El rediseño debe converger en una sola fuente (`@theme`).
- **Dos capas de estilos en React**: styled-components (congelado desde 2025; el repo tiene `docs/MIGRACION_TAILWIND.md` con el plan de retirarlo por componente) y Tailwind. El enunciado de EBAC pide styled-components por nombre; eso es del curso y no debe entrar en `main` como deuda (memoria: "curso vs producto").
- **Divergencia con `AGENTS.md`**: la regla dice que cada componente React lleva `styles.scss` co-locado; en esta rama los componentes usan `styles.ts` de styled-components y no existe ningún SCSS bajo `src/`.
- **`server/app.ts`**: `express.static(workspaceRoot)` sirve toda la raíz del repo (`package.json`, fuentes) en el puerto 3100; las rutas `/api/buildads` no tienen autenticación (solo `express-rate-limit` y `express-validator`) y consumen Predis/ElevenLabs. Es local, pero no debe desplegarse tal cual.
- **Assets nuevos sin copiar**: el video de portada y la mascota del acceso están en `docs/design/assets/`, no en `public/`. Mover o copiar assets públicos pide aprobación (AGENTS.md).
- **Entrada `landing.html`** ya está en `vite.config.js` (`rollupOptions.input.landing`), pero no en la verificación de CI.

## 9. Estructura recomendada dentro de `src/` (≤25 líneas)

Principio: no romper lo que funciona. Se conservan los cuatro HTML raíz como cáscaras finas (una `<div id="root">` y un script), sin renombrarlos; `landing.html` pasa a ser el nuevo `index.html` solo cuando Eduardo lo apruebe.

```
src/
  entry/        una entrada por HTML raíz (home, products, auth, dashboard, admin-*): solo monta <Shell><Page/></Shell>
  shell/        Encabezado (modo sobre-video: transparente, hover/focus-within -> rgba(0,0,0,.92), sólido al bajar), Pie,
                MenuLateral (hamburguesa), Lupa, CarritoCajon, Asistente (chatbot nuevo, sin respuestas inventadas)
  ui/           primitivas Tailwind sin lógica: Boton, Campo, Chip, Tarjeta (UNA sola tarjeta de producto), Hoja (Sheet con X,
                Escape, trampa de foco, bloqueo de scroll: la usan menú, carrito, lupa, asistente y sidebar del panel), iconos
  pages/        Landing/, Catalogo/, Ficha/ (mover ProductoDetalle), Carrito/, Acceso/ (slide + mascota), Panel/ (dashboard + admin-*)
  features/     landing/ (secciones en el orden de Diseño1.1), catalogo/, carrito/ (slice + usePedido), acceso/, panel/, asistente/
  data/         supabase.ts (cliente perezoso: no lanza al importar), catalogo.ts (fetchProducts/fetchCategories + timeout + seed),
                seedProducts.ts, contenido.ts (ex landing/datos.ts sin "Paquete Carnitas por Kilo", con redes reales)
  styles/       tailwind.css con un solo @theme (tokens de DESIGN.md); se retiran redesign.css y styled-components página por página
  redux/ hooks/ lib/ types/   se conservan (carni_cart_v1 + evento cart:updated es contrato entre páginas)
```

Reutilizar: `Tarjeta`, `iconos`, `assetUrl`, `useCatalogoVivo`, `PreguntasFrecuentes`, `Horario`, `Pie`, `@theme`, `carritoSlice`/`usePedido`/`pedidoStorage`, la lógica de foco y Escape de `Lupa` y `CartPanel`, `fetchProducts` con su temporizador, `seedProducts`, y las 29 pruebas (portándolas al nuevo `Hoja`/`Tarjeta`). Descartar: el `Encabezado` opaco, el orden de secciones del prototipo, `redesign.css`, la doble tarjeta y el `throw` a nivel de módulo de `supabase.js` (sustituir por un cliente creado al primer uso y por el paquete npm en vez de jsdelivr).

Orden sugerido de construcción (cada paso verificable en Brave y con captura a 390 y 1440): 1) `shell` + `Hoja` + `Encabezado` sobre video, 2) Landing con el orden nuevo, 3) Catálogo, ficha y carrito con la misma `Tarjeta`, 4) Acceso, 5) Asistente, 6) Panel con X en todo panel y `signOut()` real.

## 10. Preguntas que solo Eduardo puede responder

1. ¿Autoriza copiar el `.env` del checkout principal a `Carni-mvp-pruebas` (está en `.gitignore`) y cambiar `VITE_SUPABASE_URL` a `http://localhost:54321` solo en esa copia, para que Brave lea datos vivos? Sin eso el rediseño mostrará siempre el seed.
2. ¿`landing.html` reemplaza a `index.html` al final, o el rediseño convive en otra ruta hasta el corte? (AGENTS.md prohíbe renombrar rutas públicas sin aprobación.)
3. ¿Se acepta mover/copiar a `public/` el video de portada y la mascota de `docs/design/assets/`?
4. ¿"Picaña" y los nueve nombres de la landing que no están en el seed se corrigen en la base o en el seed? El diseño exige que "picaña" no se vea.
5. ¿El commit de código debe pasar por GGA con bash 5 (`PATH=/opt/homebrew/bin:$PATH`), o se autoriza arreglar el shebang del hook?
