# Mapa de migración in situ (React + Tailwind v4)

Fecha: 2026-09-30 · Rama `pruebas` · HEAD verificado: `67754685` · Solo lectura sobre el repo; este archivo es el único entregable.

Corrección de rumbo de Eduardo: el rediseño es una **migración progresiva de las páginas de producción**, no un sitio paralelo. Las páginas de producción son `index.html`, `products.html`, `accessweb.html`, `dashboar.html` y `admin-*.html`. Este mapa permite terminar la migración página por página sin crear duplicados. Reutiliza `investigacion/02-sitio-actual.md` (no se rehizo) y se apoya en `ESTADO.md`.

Convenciones de evidencia: `archivo:línea` se comprobó con `rg` o lectura directa en `pruebas`. Lo que no se pudo comprobar está en la lista "No verificado" al final de la sección 5.

## 0. Hallazgos que cambian el plan

1. **El service worker no funciona hoy, ni en las páginas viejas.** `registerServiceWorker()` existe en `js/modules/core/api.js:5` y registra `/js/modules/utils/service-worker.js` (`api.js:8`), pero nadie la llama (`rg registerServiceWorker` solo da su definición) y `dist/` no contiene ningún service worker (Vite solo emite lo que se importa; `public/` solo tiene `img/`). Además, aun registrado, ese archivo quedaría con alcance `/js/modules/utils/`, no `/`. Lo que sí funciona de la PWA es `manifest.json`. `README.md:82` afirma "Funcional" y es falso. Consecuencia: "conservar el registro del service worker" no es un deber operativo de `index.html`; es una deuda que se paga en un paso propio (sección 4, paso 5) y no dentro del cambio de `index.html`.
2. **Tampoco existe analítica, sitemap ni robots.** `rg "gtag|googletagmanager|analytics"` en las cuatro páginas da 0; `fd` no encuentra `sitemap*`/`robots*` en el repo ni en `public/`. No se pierde nada al migrar, pero no hay que inventar que existían.
3. **Las tres entradas paralelas ya están commiteadas** (`42ce70c3`, `67754685`): `landing.html`, `catalogo.html`, `panel.html`, con sus puntos de entrada en `vite.config.js:40-42`. `catalogo.html` y `panel.html` son cascarones: `src/catalogo/Catalogo.tsx:1` dice "Esqueleto de U1" y `src/panel/Panel.tsx:1-3` devuelve "Panel en construcción". No hay nada que rescatar de ellos salvo la carcasa compartida.
4. **El contrato de URL divergió.** Lo nuevo enlaza `catalogo.html#categoria=<slug>` (`MenuHoja.tsx:88,100`, `Pie.tsx:44`, `Mostrador.tsx:38`, `Tarjeta.tsx:220`); lo vivo usa `products.html?categoria=<slug>` (`CategoryCard.tsx:97`, `products.html:158-166`, y `products.tsx:141-161,237` que lo interpretan). Hay que elegir uno antes de tocar `products.html` (recomendado: conservar `?categoria=`, que es el que ya usan el cajón y los enlaces existentes).
5. **Mezclar Bootstrap y el preflight de Tailwind en una misma página rompe estilos.** Hoy cada entrada importa su CSS (`landing.tsx:6` importa `tailwind.css`; `products.tsx:18`, `auth.tsx:6`, `dashboard.tsx:5` importan `redesign.css`). Una página se migra completa o no se migra: el paso de `products.html` incluye restilar `#/producto/:id` y `#/carrito` antes de quitar Bootstrap.
6. **AGENTS.md ya exige lo correcto**: `AGENTS.md:67` ("Mantener entrypoints HTML en raiz") y `:68` (revisar referencias antes de renombrar). Lo que choca con el rediseño es `AGENTS.md:75` ("Ningun otro directorio contiene SCSS") y `:130` ("Tailwind ... no estado actual"); la enmienda ya está propuesta en `ESTADO.md:123` y sigue pendiente de Eduardo (paso 0).

## 1. Inventario por página

### 1.1 Resumen

| Página | Bytes | `rollupOptions.input` | Manifest | SW | SEO / JSON-LD | Analítica | Pieza nueva existente |
|---|---|---|---|---|---|---|---|
| `index.html` | 25 163 | `home` (`vite.config.js:32`) | `:39` | no (sec. 0) | title `:8`, description `:9`, keywords `:10`, author `:11`, og:* `:12-16`, canonical `:17`, JSON-LD LocalBusiness `:20-37` | ninguna | `landing.html` + `src/entry/landing.tsx` + `src/landing/*` + `src/ui/*` |
| `products.html` | 15 810 | `products` (`:33`) | `:10` | no | title `:8`, description `:9`; sin og ni JSON-LD | ninguna | `catalogo.html` + `src/entry/catalogo.tsx` + `src/catalogo/Catalogo.tsx` (cascarón) |
| `accessweb.html` | 19 602 | `accessweb` (`:34`) | `:11` | no | title `:8`, description `:9`; `apple-touch-icon` `:27`; sin og ni JSON-LD | ninguna | ninguna (mascota ya en `public/img/mascota/`) |
| `dashboar.html` | 12 502 | `dashboar` (`:35`) | `:10` | no | title `:8`; `apple-touch-icon` `:17`; sin description; sin noindex | ninguna | `panel.html` + `src/entry/panel.tsx` + `src/panel/Panel.tsx` (cascarón) |
| `admin-products.html` | 5 402 | `adminProducts` (`:36`) | `:7` | no | title `:6` | ninguna | ninguna |
| `admin-customers.html` | 5 535 | `adminCustomers` (`:37`) | `:7` | no | title `:6` | ninguna | ninguna |
| `admin-orders.html` | 3 730 | `adminOrders` (`:38`) | `:7` | no | title `:6` | ninguna | ninguna |
| `offline.html` | ≈4 700 | `offline` (`:39`) | `:7` | es el destino previsto de `OFFLINE_URL` (`service-worker.js:2`), hoy inalcanzable | title `:6` | ninguna | ninguna |
| `landing.html` (duplicado) | 781 | `landing` (`:40`) | **sin manifest** | no | title/description solamente (`:8-9`); sin og, canonical, JSON-LD, apple-touch | ninguna | es la pieza nueva |
| `catalogo.html` (duplicado) | 691 | `catalogo` (`:41`) | sin manifest | no | title/description | ninguna | es la pieza nueva |
| `panel.html` (duplicado) | 668 | `panel` (`:42`) | sin manifest | no | `noindex` `:8` (conservar) | ninguna | es la pieza nueva |

`manifest.json`: `start_url: "/index.html"` (`:5`), colores `#363432` (`:7-8`), íconos `img/recursos_web/logo-user.png` (`:12,17`). Las páginas nuevas declaran `theme-color #0B0B0C` (`landing.html:6`): hay que alinear manifest, meta y fuentes en el mismo commit que cambie `index.html`.

### 1.2 `index.html` (landing)

- **Estilos**: Bootstrap 5.3.7 (`:40`), bootstrap-icons (`:41`), Google Fonts Poppins + Space Grotesk (`:44`), `css/styles.css` (`:45`).
- **Secciones** (en orden): alerta offline (`:52`), header `#mainHeader.main-header--over-media` (`:60-108`, con `#menuToggle :68`, `#searchBtn :73`, `#cartBtn :90`, cuenta → `accessweb.html :94-96`, clima `#weatherWidget :102-105`), drawer (`:111-150`, con botón "Club Misericordia" `data-loyalty-trigger :129`), hero de video (`:163-182`), categorías (`#categoriesReactRoot :191`), vitrina (`#showcaseReactRoot :199`), reseñas (`#resenasReactRoot :205`), `#sobre-nosotros` (`:208-266`, horario `:246-254`), `#contacto` (`:268-316`, teléfono `:280`, WhatsApp `:293`, correo `:306`), footer (`:318-371`), `#cartModal` Bootstrap heredado (`:374-392`), `#loyaltyModal` (`:393-402`), chatbot (`:425-459`).
- **Scripts**: Bootstrap bundle (`:406`), `header.js` (`:408`), `cart.js` (`:409`), `loyalty.js` (`:410`), `weather.js` (`:415`), `hero-video.js` (`:416`), `#headerScrollRoot :421`, `scroll-reveal.js` (`:422`), `src/entry/home.tsx` (`:423`), `chatbot.js` (`:459`).
- **Terceros**: cdn.jsdelivr.net (Bootstrap, iconos, `@supabase/supabase-js` ESM en `js/modules/supabase.js:2`), fonts.googleapis.com, api.open-meteo.com (`weather.js:7`), enlaces `wa.me` y `mailto:`.
- **JS detrás**: `js/modules/ui/header.js` (116), `core/cart.js` (711), `core/loyalty.js` (127), `ui/weather.js` (101), `ui/hero-video.js` (8), `ui/scroll-reveal.js` (24), `chatbot.js` (305); React: `src/entry/home.tsx` (289; `CategoryBento :25`, `gobernarEncabezado :192-270`, `montarLupa :283`, `montarCarrito :284`), `components/{CategoryCard,Showcase,Testimonios,CartPanel,Lupa}`, `data/resenas.ts`.
- **SCSS detrás**: `css/styles.scss:5-49` (cadena de `@import`), sobre todo `layout/_header.scss` (1096), `layout/_footer.scss`, `pages/_home.scss` (1216), `pages/_bento-main.scss`, `pages/_showcase.scss`, `components/_chatbot.scss` (308), `components/_modals.scss`.

### 1.3 `products.html` (catálogo)

- **Estilos**: Bootstrap (`:11`), iconos (`:12`), Melvis One (`:13`), `css/styles.css` (`:14`). `body.dark-premium :70`.
- **Script inline** `:16-58`: solo actúa bajo `file:`; sondea puertos locales (`:25-34`) y hace `location.replace` (`:52`). Es una comodidad de desarrollo, no de producto.
- **Secciones**: header `:88-131` (`#searchBtn :101`, `#cartBtn :116`, cuenta `:120-121`), drawer `:133-170` con chips `?categoria=` (`:158-166`), `main.products-main-layout :180` con breadcrumb `:184` y `#productsReactRoot :194`, footer `:199-~250`, chatbot `:279-~304`.
- **Scripts**: `header.js :59`, `cart.js :60`, `weather.js :67`, Bootstrap bundle `:261`, `src/entry/products.tsx :269`, `chatbot.js :305`.
- **JS/React detrás**: `src/entry/products.tsx` (480; `HashRouter :455-468` con rutas `/`, `/producto/:id`, `/carrito`), `pages/ProductoDetalle.tsx` (581), `pages/Carrito.tsx` (208), `components/{ProductList,ProductCard,Relacionados,CarrilCategorias,BannerEditorial,OrderList,CartPanel,Lupa}`, `core/premium-cuts.js` y `core/quote.js` (importados por `ProductoDetalle.tsx:5-6`), `entry/shared.tsx` (`fetchProducts :123`, `fetchCategories :74`).
- **SCSS detrás**: `pages/_productos.scss` (593), `pages/_catalog.scss` (55), `layout/_header.scss:899-910` (mini header solo de productos), `src/styles/redesign.css` (importado `products.tsx:18`).

### 1.4 `accessweb.html` (inicio de sesión y registro)

- **Estilos**: Bootstrap (`:12`), iconos (`:14`), **Font Awesome kit (script de tercero, `:17`)**, Poppins + Melvis (`:22`), `css/styles.css` (`:25`). `body.auth-page :30`.
- **Secciones**: header propio `:38-68` (búsqueda `products.html?search=true :50`, carrito `:55`, inicio `:59`), drawer `:70-106`, `main.auth-main :108` con `#authContainer :109`, `#loginForm :115`, `#registerForm :162`, franja editorial `#authExperienceRoot :277`, footer `:280`, chatbot `:374-400`.
- **Scripts**: Bootstrap `:321`, `header.js :323`, `cart.js :324`, `delivery.js :325`, `auth.js :326`, script inline del deslizamiento `sign-up-mode` `:329-363`, `src/entry/auth.tsx :364`, `chatbot.js :400`.
- **JS detrás**: `core/auth.js` (430; `signInWithPassword :196`, `signUp :312`, OAuth `:349,:368`, `logout :385`; los manejadores de los formularios viven dentro del módulo, los únicos exports son `appState`, `logout`, `checkAdminAuth`, `isAuthenticated`, `getCurrentUser`), `core/delivery.js` (107, solo lo carga esta página), `src/entry/auth.tsx` (38: franja de marketing + `montarLupa`/`montarCarrito`).
- **SCSS detrás**: `pages/_access.scss` (1221), `layout/_auth-layout.scss`.

### 1.5 `dashboar.html` (panel de administración)

- **Estilos**: Bootstrap con `integrity` (`:11`), iconos (`:12`), Font Awesome CSS (`:13`), DataTables CSS (`:14`), `css/styles.css` (`:15`). `body.admin-dashboard :25`.
- **Guardia de admin**: módulo en `<head>` (`:18-22`) que llama `verifyAdminSession()` (`js/modules/utils/admin-auth.js:53`; revisa `profiles.role === 'admin'` `:63-67`, y si falla hace `signOut` y redirige a `accessweb.html?admin=true` `:68-69`).
- **Secciones**: sidebar `.admin-sidebar :29-60` (enlaces `:36,41,46,51`; "Salir" → `index.html :56`), navbar con `#sidebarToggle :68`, dropdowns `:73-...` con "Cerrar sesión" = `<a href="index.html"> :98`, `#buildAdsReactRoot :107`, gráficas `#productsChart :151`, tabla `#recentOrdersTable :178`.
- **Scripts**: Bootstrap `:251`, Chart.js `:252`, jQuery `:253`, DataTables `:254-255`, `pages/admin.js :256`, init DataTables inline `:258-267` (idioma desde cdn.datatables.net `:263`), `chart-config.js` y toggle del sidebar `:268-278` (el toggle solo alterna `.show`, sin X ni overlay), `src/entry/dashboard.tsx :279`.
- **JS detrás**: `pages/admin.js` (128), `pages/dashboard.js` (317), `pages/chart-config.js` (224), `utils/admin-auth.js` (70), `src/modules/buildads/BuildAdsOrchestrator.tsx`, `entry/dashboard.tsx` (39).
- **SCSS detrás**: `pages/_admin.scss` (154; `.admin-sidebar.show :126` dentro de `@media (max-width: 991.98px) :116`), `pages/_dashboard.scss` (86), `layout/_dashboard-layout.scss`, `layout/_sidebar.scss`.
- **No hay `noindex`** (sí lo tiene el `panel.html` nuevo, `:8`; hay que conservarlo).

### 1.6 `admin-*.html` (una fila cada una)

| Página | Entrada React | Guardia | Enlaces del sidebar | Notas |
|---|---|---|---|---|
| `admin-products.html` | `src/entry/admin-products.tsx` (23) `:98` | módulo `:12` | `:26-30` ("Salir" → `index.html :30`, sin `signOut`) | Chart.js `:90` |
| `admin-customers.html` | `src/entry/admin-customers.tsx` (23) `:97` | módulo `:12` | `:26-30` | Chart.js `:89` |
| `admin-orders.html` | `src/entry/admin-orders.tsx` (23) `:66` | módulo `:12` | `:26-30` | sin Chart.js |

Las tres cargan `css/styles.css` (`:10`) y Bootstrap (`:8`).

### 1.7 Dependencias de terceros y CSP de producción (`netlify.toml:33-43`)

`script-src` solo permite `'self'`, jsdelivr y unpkg. Hoy **bloquearía**: `kit.fontawesome.com` (`accessweb.html:17`), `code.jquery.com` (`dashboar.html:253`), `cdn.datatables.net` (`dashboar.html:14,254-255,263`). `connect-src` permite el proyecto de Supabase y `api.open-meteo.com` (`:39`), por lo que el clima y los datos no se rompen. Las fuentes nuevas son autoalojadas (`src/styles/fuentes.ts`), no dependen de Google Fonts.

### 1.8 Piezas nuevas (lo que creó el prototipo)

- Entradas: `landing.html`, `catalogo.html`, `panel.html`; `src/entry/{landing,catalogo,panel}.tsx`.
- Carcasa compartida (buena): `src/ui/{Carcasa,Encabezado,MenuHoja,CarritoHoja,Hoja,Pie,Tarjeta,CarruselCortes,useCarrusel,Logotipo,InsigniaDatos,iconos,assetUrl,presentacionProducto}`.
- Landing: `src/landing/{Landing,Portada,Mostrador,Populares,Ofertas,PreguntasFrecuentes,Familia,HorariosPuntaje,Contacto,Comentarios,datos}`.
- Datos: `src/data/{catalogo,useCatalogo,supabase,negocio}.ts` y las semillas JSON.
- Estilos: `src/styles/tailwind.css` (`@theme`, `@source` `:22-24`) y `src/styles/fuentes.ts`.
- Pruebas: `src/ui/__tests__/{Hoja,Tarjeta,presentacionProducto}.test.tsx`.
- Cascarones sin contenido: `src/catalogo/Catalogo.tsx`, `src/panel/Panel.tsx`, `src/asistente/Asistente.tsx` (devuelve `null`, `:6-7`).

## 2. Duplicados y pérdidas (auditoría)

### 2a. Duplicados: qué debió reemplazar o extender cada pieza

| Pieza nueva | Archivo existente que debió reemplazar o extender |
|---|---|
| `landing.html` (+ `vite.config.js:40`, `src/entry/landing.tsx`) | `index.html` (input `home` `:32`) y `src/entry/home.tsx` |
| `catalogo.html` (+ `:41`, `src/entry/catalogo.tsx`, `src/catalogo/Catalogo.tsx`) | `products.html` y `src/entry/products.tsx` |
| `panel.html` (+ `:42`, `src/entry/panel.tsx`, `src/panel/Panel.tsx`) | `dashboar.html`, `src/entry/dashboard.tsx` y `js/modules/utils/admin-auth.js` |
| `src/ui/Encabezado.tsx` (228) | `.main-header` (`index.html:60-108`), `css/layout/_header.scss:7-185`, `gobernarEncabezado` (`home.tsx:192-270`). Reemplazo legítimo: debe quedar uno solo |
| `src/ui/MenuHoja.tsx` (134) | `#mobileDrawer` (`index.html:111-150`) y `header.js:50-107` |
| `src/ui/CarritoHoja.tsx` (125) | `src/components/CartPanel/CartPanel.tsx` (194) + `montar.tsx`. Debió extender `CartPanel` |
| `src/ui/Tarjeta.tsx` (291) | `src/components/ProductCard/ProductCard.tsx` (175): hoy hay **dos tarjetas de producto** |
| `src/ui/Pie.tsx` (105) | `<footer>` copiado a mano en `index.html:318-371`, `products.html:199`, `accessweb.html:280` |
| `src/landing/Portada.tsx` (187) | `index.html:163-182`, `hero-video.js` y `css/pages/_home.scss:938-991` |
| `src/landing/Mostrador.tsx` (49) | `CategoryBento` (`home.tsx:25`), `CategoryCard`, `BentoGrid.tsx` |
| `src/landing/Populares.tsx`, `Ofertas.tsx`, `src/ui/CarruselCortes.tsx` | `src/components/Showcase/Showcase.tsx` (`index.html:199`) |
| `src/landing/Comentarios.tsx` (146) | `src/components/Testimonios/*` y `src/data/resenas.ts` (`index.html:205`) |
| `src/landing/HorariosPuntaje.tsx`, `Familia.tsx` | `#sobre-nosotros` (`index.html:208-266`) |
| `src/landing/Contacto.tsx` (113) | `#contacto` (`index.html:268-316`) |
| `src/data/catalogo.ts` (194; `TIEMPO_MAXIMO_MS = 2500` `:52`), `useCatalogo.ts`, `semillaCatalogo.json`, `semillaCategorias.json` | `src/entry/shared.tsx` (`fetchProducts :123`, `fetchCategories :74`, temporizador de 2000 ms) y `src/data/seedProducts.ts`: **dos cargadores, dos semillas y dos tiempos de espera** |
| `src/data/supabase.ts` (cliente perezoso, no lanza) | `js/modules/supabase.js` (lanza al importarse `:10-14`; `shared.tsx:2` lo importa estático). Es el arreglo correcto, pero debió corregir `supabase.js` en su lugar. Además `busquedaSlice.ts:39-44` lee `VITE_SUPABASE_*` por su cuenta: tres lectores de la misma variable |
| `src/ui/assetUrl.ts` (36) | `assetUrl` de `src/entry/shared.tsx:19`: dos copias |
| `src/data/negocio.ts` (`NEGOCIO`, `HORARIO`) | datos hardcodeados en `index.html` (JSON-LD `:20-37`, dirección `:235`, horario `:253-254`, contactos `:280-306`, footer `:356`) y `chatbot.js:23` |
| `src/ui/Hoja.tsx` (`showModal` `:112`) | lógica de foco propia de `Lupa.tsx:261-321` y de `CartPanel.tsx`: tres implementaciones de "overlay accesible" |
| `src/asistente/Asistente.tsx` (cascarón) | `js/modules/chatbot.js` + `css/components/_chatbot.scss` + marcado en tres páginas (`index.html:425-459`, `products.html:279-~304`, `accessweb.html:374-400`) |
| Enlaces a `landing.html` y `catalogo.html` dentro de la carcasa | las rutas reales `index.html` y `products.html` (lista exacta en la sección 3.5) |
| Tercera paleta (`@theme`) junto a `carniTheme.ts` y `redesign.css` | `DESIGN.md`; debe quedar un solo origen de tokens (`@theme`) |

### 2b. Comportamientos del sitio viejo que la entrada nueva aún no tiene

| Comportamiento | Evidencia en el sitio viejo | Estado en lo nuevo |
|---|---|---|
| **Lupa (búsqueda)** | `Lupa.tsx` (581): diálogo `:405-406`, trampa de foco `:261-321`, Escape `:286`, X `:412`; disparador `#searchBtn` (`index.html:73`), montaje `home.tsx:283`, consulta `.ilike` con mínimo 2 caracteres | **Perdida.** `Encabezado.tsx:199` es un `<a href={hrefBuscar}>`; `Carcasa.tsx:50` apunta a `catalogo.html#buscar`, destino que no existe (`Catalogo.tsx` es un cascarón) |
| **Clima** | `index.html:102-105`, `weather.js:7` (Open-Meteo), también `products.html:67` | **Perdido.** 0 coincidencias de `weather|clima|open-meteo` en `src/ui` y `src/landing` |
| **Chatbot** | `index.html:425-459`, `chatbot.js` (llaves `carni_chat_history`/`carni_chat_session` `:19-20`, Escape `:290`, inserción en `public.chat_messages` `:143-166`), `role="log" aria-live` `index.html:447` | **Perdido.** `Asistente.tsx:6-7` devuelve `null`. Ojo: `chatbot.js:46` trae precios escritos a mano (arrachera, ribeye, T-bone); no portarlos (`ESTADO.md:81`, nunca precios inventados) |
| **Cajón del carrito** | `CartPanel.tsx` (X `:113`, Escape `:64`), `#cartModal` heredado `index.html:374-392`, `cart.js:24` (`carni_cart_v1`) | **Paridad parcial.** `CarritoHoja.tsx` existe y usa el mismo store; `store.ts:142` emite `cart:updated`, así que el contrato entre páginas se mantiene. Falta el modal de cortes premium y la cotización, que hoy viven en `cart.js` y `products.tsx:316` |
| **Acceso a la cuenta en el encabezado** | `index.html:94-96`, `products.html:120-121` (ícono → `accessweb.html`) | **Perdido.** `Encabezado.tsx:180-206` solo tiene menú, logo, búsqueda y carrito; `accessweb.html` solo se alcanza por `MenuHoja.tsx:123` |
| **Modal de inicio de sesión** | No existe en el sitio viejo: el acceso es una página completa con deslizamiento `sign-up-mode` (`accessweb.html:109-273`, script `:329-363`) | No aplica todavía (`accessweb.html` no se ha migrado). Conservar los ids del contrato `README.md:782-786` |
| **Club Misericordia (puntos de fidelidad)** | `index.html:129` (`data-loyalty-trigger`), `:393-402`, `loyalty.js:5-17,32` (lee puntos de Supabase) | **Perdido.** `MenuHoja.tsx:123` solo enlaza a `accessweb.html`; decisión de Eduardo: portar o retirar |
| **Efecto del encabezado sobre el video** | `_header.scss:65-98`, `home.tsx:192-270` | **Portado**, no perdido: `Encabezado.tsx:27-53,146-173` (centinela `#fin-portada`, hover/foco). Verificado en `ESTADO.md:140,143` |
| **Video con movimiento reducido** | `hero-video.js:5-7` | **Portado**: `Portada.tsx:21` |
| **PWA: manifest y colores** | `<link rel="manifest">` en 8 páginas (`index.html:39` etc.); `apple-touch-icon` en `accessweb.html:27`, `dashboar.html:17` | **Perdido en las entradas nuevas**: `landing.html`, `catalogo.html`, `panel.html` no declaran manifest ni apple-touch; `theme-color #0B0B0C` no coincide con `manifest.json:7-8` |
| **PWA: registro del service worker y página sin conexión** | `api.js:5-17`, `service-worker.js` completo, alerta `.offline-alert` `index.html:52` (`checkOnlineStatus` `api.js:20`, tampoco se invoca) | No aplica: **ya estaba muerto** (sec. 0). Se resuelve en el paso 5 |
| **SEO: meta, Open Graph, canonical** | `index.html:9-17` | **Perdido** en `landing.html` (solo title y description). La description vieja lleva precios (arrachera, ribeye, T-bone): usar la redacción sin precios |
| **Datos estructurados** | JSON-LD `LocalBusiness` `index.html:20-37` (dirección, teléfono, `openingHours`) | **Perdido.** 0 coincidencias de `ld+json` en `src/` y `landing.html` |
| **Analítica** | no existe | Nada que portar; si se quiere, es una función nueva (skill `analytics-tracking-dashboard`), no parte de la migración |
| **Scroll reveal** | `scroll-reveal.js` (24, respeta movimiento reducido), clases `.reveal` (`index.html:208,268,318`) | **Perdido**; decisión de diseño (la landing nueva trae su propio movimiento) |
| **Elementos pegajosos** | header `position: sticky` (`_header.scss:7-26`); mini header que se pliega en productos (`header.js:36-47`, `_header.scss:899-910`); breadcrumb `products.html:184` | El header nuevo es `fixed` (`Encabezado.tsx:168`); el mini header y el breadcrumb **no existen** en lo nuevo (afecta al paso de productos) |
| **Accesibilidad** | `role="alert"` `index.html:52`, `aria-hidden` del drawer `:112`, cierre por Escape y overlay (`header.js:87,103`) | Cubierta por `Hoja` (X, Escape, fondo, foco devuelto). **Ganancia**: enlace "Saltar al contenido" (`Carcasa.tsx:36-40`), que el sitio viejo no tiene |
| **Chips de categoría del cajón** | `products.html:158-166` (`?categoria=`) | Existen en `MenuHoja.tsx:100` pero con otro contrato (`catalogo.html#categoria=`) |
| **Contrato del carrito entre documentos** | `carni_cart_v1` + `cart:updated` (`cart.js:24,61`) | **Conservada**: `store.ts:142`, `usePedido.ts:116-134` |

Módulos huérfanos hoy (0 importadores según `rg`): `js/modules/utils/offline.js` (337), `js/modules/ui/notifications.js` (116), `js/modules/pages/checkout.js` (0 líneas). No se migran; borrarlos exige aprobación (AGENTS.md:115-121). `ui/ui.js` no apareció importado en la búsqueda; confirmar antes de borrar.

### 2c. Lo bueno de lo nuevo, que se conserva

- **`Hoja`** (`src/ui/Hoja.tsx`): `<dialog>` con `showModal()` (`:112`), X, Escape, clic en el fondo y foco devuelto; con prueba `Hoja.test.tsx`. Es la base única de overlays (menú, carrito, lupa, asistente, cajón del panel, confirmaciones).
- **`Encabezado`**: transparente sobre el video, vidrio por hover/foco, sólido tras `#fin-portada`, 56/72 px medidos.
- **`Tarjeta`** (+ `presentacionProducto.ts`, con pruebas): la tarjeta única (kg/pieza/paquete, enlace a la ficha real `products.html#/producto/:id`, `Tarjeta.tsx:43`).
- **`CarruselCortes` + `useCarrusel`**: carrusel con datos vivos y movimiento reducido.
- **Capa de datos**: `src/data/supabase.ts` (cliente perezoso, no rompe sin `.env`), `catalogo.ts` (vivo con respaldo de semilla y tiempo máximo), `negocio.ts` (datos del negocio en un solo lugar).
- **Tokens**: `@theme` de `tailwind.css` como única fuente; fuentes autoalojadas (`fuentes.ts`, 97 KB); reglas de movimiento reducido (`tailwind.css:141-170`).
- **`Pie`** con redes reales (`Pie.tsx:85,91`), **`Carcasa`** con la invariante de una sola superposición abierta (`Carcasa.tsx:24-32`), el enlace para saltar al contenido, el video de portada en 360/720 (`public/img/Videos/portada-carne-*`), `iconos.tsx`.
- **Contenido pendiente de validación del dueño** (se conserva, pero hay que confirmarlo): FAQ con pedido mínimo y zonas de entrega (`ESTADO.md:144`).

## 3. Referencias que vigilar si una ruta cambia

### 3.1 PWA, servidor y despliegue

| Dónde | Línea | Qué menciona |
|---|---|---|
| `manifest.json` | `:5` | `start_url: "/index.html"` (no hay `shortcuts` en el manifest actual) |
| `manifest.json` | `:7-8` | `background_color` y `theme_color` `#363432` |
| `js/modules/utils/service-worker.js` | `:2` | `OFFLINE_URL = '/offline.html'` |
| `js/modules/utils/service-worker.js` | `:5-8` | precache: `/`, `/index.html`, `/products.html`, `/accessweb.html`, `/offline.html` |
| `js/modules/utils/service-worker.js` | `:10-12` | precache de `/js/modules/core/cart.js`, `auth.js`, `ui/header.js` (archivos que Vite no sirve con esa ruta tras el build) |
| `js/modules/utils/service-worker.js` | `:56`, `:74-105`, `:117` | handler de `/rest/v1/` (red primero), caché primero para el resto, `data.url \|\| '/'` en notificaciones |
| `js/modules/core/api.js` | `:8` | ruta de registro `/js/modules/utils/service-worker.js` (nadie la llama) |
| `netlify.toml` | `:18-23` | respaldo SPA: `/*` → `/index.html` (200) |
| `netlify.toml` | `:33-43` | CSP (ver sección 1.7) |
| `.github/workflows/ci.yml` | `:34-38` | `test -f dist/{index,products,accessweb,dashboar,offline}.html` |
| `.github/workflows/deploy-pages.yml` | `:55` | `--base=/Landingpages-Carni.pwa/`: toda ruta debe ser relativa; lo absoluto (`/index.html`, `/accessweb.html`) ya falla bajo esa base |
| `server/app.ts` | `:22` | `sendFile(... 'index.html')` |
| `sitemap`, `robots` | n/a | no existen |

### 3.2 Vite, Tailwind y scripts

| Dónde | Línea | Qué menciona |
|---|---|---|
| `vite.config.js` | `:15` | `open: '/index.html'` |
| `vite.config.js` | `:32-42` | las 11 entradas; `:40-42` son `landing`, `catalogo`, `panel` |
| `vite.config.js` | `:7-10` | comentario que dice que Tailwind solo entra por `landing.tsx` |
| `src/styles/tailwind.css` | `:2-6`, `:22-24` | comentario y `@source "../../landing.html"`, `catalogo.html`, `panel.html` |
| `docs/design/rediseno/gates.sh` | `:16`, `:28` | sondeo `http://localhost:3002/$p.html` y lista `src/entry/landing.tsx`, `catalogo.tsx`, `panel.tsx` |
| `package.json` | `:8-21` | los scripts no nombran HTML (sin cambios) |

### 3.3 Enlaces entre páginas HTML (recuento con `rg -c`)

`accessweb.html` 20 (`:46,50,59,85-89,95-103,296-298`), `products.html` 24 (`:109,148-152,158-166,171,184,218-220`), `index.html` 17, `dashboar.html` 6 (`:36,41,46,51,56,98`), cada `admin-*.html` 5 (`:26-30`). El enlace de "Salir" de `dashboar.html:56` y `admin-*.html:30` apunta a `index.html`.

### 3.4 JS que navega a una página

| Dónde | Línea | Destino |
|---|---|---|
| `js/modules/pages/dashboard.js` | `:18`, `:240`, `:243`, `:246` | `/accessweb.html?redirectTo=`, `/products.html`, `/accessweb.html`, `/index.html#contacto` |
| `js/modules/utils/admin-auth.js` | `:47`, `:57`, `:69` | `dashboar.html`, `accessweb.html?admin=true` |
| `js/modules/core/auth.js` | `:217`, `:219`, `:335`, `:394`, `:406`, `:416`, `:421` | `dashboar.html`, `index.html`, `accessweb.html`, `accessweb.html?admin=true` |
| `js/modules/core/auth.js` | `:352`, `:371` | `redirectTo` de OAuth: `/dashboar.html` y `/index.html`. **Además deben figurar en la lista de redirecciones permitidas de Supabase Auth, que vive fuera del repo** |
| `js/modules/core/loyalty.js` | `:22-23` | `accessweb.html` |
| `src/components/Lupa/montar.tsx` | `:41` | `products.html#/producto/${id}` |
| `src/components/CartPanel/CartPanel.tsx` | `:42-44` | `endsWith('/products.html')`, `products.html#/carrito` |
| `src/entry/products.tsx` | `:386` | `history.replaceState(null, '', \`products.html${hash}\`)` |
| `src/components/CategoryCard/CategoryCard.tsx` | `:97` | `products.html?categoria=${slug}` |
| `src/components/Showcase/Showcase.tsx` | `:231`, `:279` | `products.html` |
| `src/ui/Tarjeta.tsx` | `:43` | `products.html#/producto/${id}` |
| `src/ui/CarritoHoja.tsx` | `:72`, `:118` | `products.html#/carrito`, `catalogo.html` |

### 3.5 Lo nuevo que apunta a las rutas paralelas (reescribir al migrar)

- `landing.html`: `Encabezado.tsx:191`, `MenuHoja.tsx:82,114,117`, `Pie.tsx:31,49`.
- `catalogo.html`: `Carcasa.tsx:50`, `MenuHoja.tsx:85,88,100`, `Pie.tsx:39,44`, `Portada.tsx:164`, `Mostrador.tsx:38`, `Populares.tsx:25`, `CarritoHoja.tsx:118`, `Tarjeta.tsx:220` (comentario).
- Pruebas: `src/ui/__tests__/Tarjeta.test.tsx:95,99,102,136,143` (afirman `products.html#/producto/14` y `catalogo.html#categoria=...`).

### 3.6 Documentación

`README.md:82` (afirma PWA funcional: corregir), `:100-107` (árbol), `:189`, `:221`, `:301`, `:525-532` (tabla de rutas), `:771`, `:782-786` (ids del contrato de acceso), `:824-826`; `AGENTS.md:67-68,88,95`; `docs/PENDIENTES.md` (6 menciones); `docs/design/rediseno/ESTADO.md:83` (decisión 9: rutas paralelas "hasta que Eduardo autorice"; ya superada por el encargo). Los documentos históricos (`docs/blueprints/*`, `docs/PLAN_EJECUCION_TRIFASICO.md`, `docs/CONTEXTO_2026-08-20.md`, `docs/design/capturas-actuales/*`) no se reescriben.

### 3.7 Comentarios y CSS (solo texto, sin efecto)

`css/layout/_header.scss:899,910`, `css/layout/_auth-layout.scss:2`, `css/pages/_home.scss:1`, `js/modules/chatbot.js:14,23`, `js/modules/core/quote.js:6`, varios comentarios en `src/entry/products.tsx`, `src/components/CartPanel/*`, `src/lib/pedidoStorage.ts:12`, `src/ui/assetUrl.ts:17`. `css/styles.css` está versionado (compilado): si se edita SCSS hay que recompilarlo dentro de Docker.

## 4. Orden de migración página por página (estrangulamiento)

**Reglas de ejecución** (de la skill `migracion-incremental` y de AGENTS.md): un commit = una rebanada; el commit nombra el archivo que reemplaza o extiende; los archivos borrados se listan en el cuerpo del commit; nada de `*.html` nuevos en la raíz ni entradas nuevas en `vite.config.js`; todo comando `npm` corre dentro de Docker (`docker exec carni-landing-dev npm ...`; tras editar desde el host, `docker restart carni-landing-dev` y esperar 8 s, `ESTADO.md:145`). Los commits de código van con `PATH=/opt/homebrew/bin:$PATH` y, si GGA falla por las reglas viejas de AGENTS.md, con `--no-verify` anotado en `ESTADO.md` (`:123`); como GGA queda fuera, la lista de la sección 5 es la compuerta humana. Sin atribución de IA en los mensajes (regla global de Eduardo). Mensaje: `tipo(ámbito): resumen en inglés / resumen en español`.

**Batería B** (criterios medibles; cada paso indica cuáles aplica, siempre a 390 y a 1440 px de ancho):

- B1. Sin desborde horizontal: `document.documentElement.scrollWidth === window.innerWidth`.
- B2. 0 errores de consola y 0 peticiones fallidas, con y sin `.env` (sin variables cae a la semilla, sin pantalla en blanco).
- B3. Cada superposición (menú, pedido, lupa, asistente, y las que se sumen): X visible con caja de al menos 44×44 y `aria-label`; cierra con Escape, con clic en el fondo y con la X; el foco vuelve al disparador; el fondo no hace scroll.
- B4. Encabezado: 56 px a 390 y 72 px a 1440; transparente sobre el video arriba de todo, `rgba(0,0,0,.92)` con hover o foco, sólido tras `#fin-portada`.
- B5. Objetivos táctiles primarios de al menos 44×44.
- B6. Con `prefers-reduced-motion: reduce` se detienen el video y el carrusel.
- B7. Dentro de Docker: `npm run ts:check`, `npm test` (38 o más en verde) y `npm run build` sin error; existe `dist/<página>.html`.
- B8. Las búsquedas de la sección 3 dan solo los resultados esperados para ese paso.
- B9. Contrato del carrito: agregar un producto en una página migrada y abrir una no migrada muestra la misma cuenta (`localStorage['carni_cart_v1']`, evento `cart:updated`).
- B10. Paridad de `<head>`: `rg -c 'rel="manifest"|name="description"'` y, en `index.html`, `rel="canonical"`, `og:title` y `application/ld+json` con el mismo contenido que antes.

---

### Paso 0 · Puertas y contrato (sin cambio visible)

- **Objetivo**: que el reemplazo quede autorizado y verificable antes de tocar una página.
- **Archivos** (existentes primero): `docs/design/rediseno/gates.sh` (añadir las comprobaciones anti-duplicado de la sección 5), `AGENTS.md` (enmienda de `ESTADO.md:123`: Tailwind v4 adoptado en las páginas migradas; `styles.scss` co-locado solo aplica a `src/components/`; las rutas `landing.html`, `catalogo.html`, `panel.html` son temporales), `docs/design/rediseno/ESTADO.md` (decisión 9 sustituida por esta migración). Requiere aprobación de Eduardo (AGENTS.md:115-121).
- **Portar**: nada. **Reutilizar**: `gates.sh`.
- **Aceptación**: `gates.sh` corre y reporta las tres entradas paralelas como deuda conocida; Eduardo aprobó la lista de borrados de los pasos 1 a 4.
- **Rollback**: `git revert` de este commit.
- **Commit**: `chore(gates): add anti-duplicate checks for the in-place migration / agrega compuertas anti-duplicado para la migración in situ`.

### Paso 1 · `index.html` (landing) in situ

Se divide en rebanadas. Las 1.1 a 1.5 portan a la carcasa compartida lo que la landing vieja hacía y la nueva no (sección 2b); se verifican mientras `landing.html` sigue existiendo como banco de pruebas temporal, sin desarrollar nada más en él. La 1.6 sustituye el contenido de `index.html`. La 1.7 borra lo paralelo.

**1.1 Lupa en la carcasa**
- **Objetivo**: recuperar la búsqueda sin reescribirla.
- **Editar** (existentes): `src/components/Lupa/Lupa.tsx` (renderizar dentro de `Hoja`, conservar consulta `.ilike`, mínimo 2 caracteres y `busquedaSlice`), `src/components/Lupa/montar.tsx`, `src/redux/slices/busquedaSlice.ts:39-44` (leer de `src/data/supabase.ts` en vez de `import.meta.env`), `src/ui/Encabezado.tsx:199` (botón en lugar de enlace, prop `alBuscar`), `src/ui/Carcasa.tsx` (añadir `'buscar'` a `Superposicion`, `:18`; quitar `hrefBuscar` `:50`).
- **Portar**: X (`Lupa.tsx:412`), Escape (`:286`), trampa y devolución de foco (`:261-321`, ahora las da `Hoja`), navegación a `products.html#/producto/:id` (`montar.tsx:41`). **Reutilizar**: `Hoja`, `obtenerSupabase()`.
- **Aceptación**: B1 a B3, B7; al escribir "arr" (mínimo 2) aparecen resultados y cada uno navega a la ficha; sin `.env` muestra el estado vacío, no rompe.
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(shell): move Lupa search onto Hoja in the shared shell / mueve la búsqueda Lupa a Hoja en la carcasa compartida`.

**1.2 Clima en el encabezado**
- **Objetivo**: recuperar la temperatura (`index.html:102-105`).
- **Archivos**: `src/ui/Encabezado.tsx` (zona derecha) y un componente `src/ui/Clima.tsx` que **porta** `js/modules/ui/weather.js:7-...` (mismo endpoint de Open-Meteo, ya permitido en `netlify.toml:39`; `weather.js` se borra en el paso 2, cuando `products.html` deje de cargarlo).
- **Aceptación**: B1, B2; sin red el widget se oculta sin desplazar el encabezado (56/72 px, B4); a 390 el icono y la temperatura caben sin romper la fila.
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(shell): port the weather widget to the new header / porta el clima al encabezado nuevo`.

**1.3 Asistente (chatbot)**
- **Objetivo**: sustituir `chatbot.js` en la carcasa, cuidado, sin inventar respuestas (`ESTADO.md:81`).
- **Archivos**: `src/asistente/Asistente.tsx` (existe como cascarón; se completa, más un módulo de respuestas guiadas dentro de esa misma carpeta), `src/ui/Carcasa.tsx` (ya lo monta, `:68`).
- **Portar** de `chatbot.js`: llaves `carni_chat_history` y `carni_chat_session` (`:19-20`), Escape (`:290`), `role="log"` y `aria-live` (`index.html:447`), X con `aria-label`. **Decidir con Eduardo** (deber no visual): la inserción en `public.chat_messages` (`chatbot.js:143-166`); por defecto se conserva vía `obtenerSupabase()`. **No portar** los precios escritos en `chatbot.js:46`. **Reutilizar**: `Hoja`, `NEGOCIO`/`HORARIO`/`whatsappConTexto` de `src/data/negocio.ts` (en lugar de `chatbot.js:23`).
- **Aceptación**: B3; los chips responden sin precios ni existencias; rótulo "Respuestas guiadas, no es una persona" visible; el historial persiste al recargar.
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(asistente): replace the vanilla chatbot with guided answers in the shell / reemplaza el chatbot vanilla con respuestas guiadas en la carcasa`.

**1.4 Club Misericordia (decisión de Eduardo)**
- **Objetivo**: decidir si el modal de puntos se porta o se retira (hoy el menú nuevo solo enlaza a `accessweb.html`, `MenuHoja.tsx:123`).
- **Archivos si se porta**: `src/ui/MenuHoja.tsx` y un contenido de `Hoja` que **porta** `js/modules/core/loyalty.js:5-47` (lectura de puntos en Supabase `:32`). Si se retira, se anota en el cuerpo del commit del paso 1.6 y en `ESTADO.md`.
- **Aceptación**: B3; un usuario sin sesión ve la invitación a registrarse; con sesión ve sus puntos.
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(shell): port Club Misericordia points sheet / porta la hoja de puntos de Club Misericordia`.

**1.5 Cuenta en el encabezado**
- **Objetivo**: recuperar el acceso de un toque a `accessweb.html` (`index.html:94-96`).
- **Archivos**: `src/ui/Encabezado.tsx` (`:180-206`, zona derecha).
- **Aceptación**: B4, B5 (44×44); a 390 caben menú, logo, búsqueda, carrito, cuenta y clima.
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(shell): add the account link to the header / agrega el enlace de cuenta al encabezado`.

**1.6 Sustituir `index.html` en su lugar**
- **Objetivo**: que `http://localhost:3002/index.html` muestre la landing nueva, conservando todos los deberes no visuales.
- **Archivos** (existentes primero): `index.html`, `src/entry/home.tsx`, `manifest.json`, `src/ui/{Encabezado,MenuHoja,Pie}.tsx` (reapuntar `landing.html` → `index.html`: `Encabezado.tsx:191`, `MenuHoja.tsx:82,114,117`, `Pie.tsx:31,49`).
- **Portar (no visual)**: en `index.html` se **conservan** `lang`, `viewport`, `theme-color` (actualizado a `#0B0B0C` junto con `manifest.json:7-8`), `title`, `description` (redacción nueva sin precios), `keywords`, `author`, `og:*`, `canonical`, el bloque JSON-LD `LocalBusiness` (`:20-37`, con los mismos datos de `NEGOCIO`/`HORARIO`), `<link rel="manifest">` (`:39`), `icon` y `apple-touch-icon`, y el `preload` del poster de la portada (de `landing.html:11`). Se **quitan** Bootstrap CSS y JS (`:40`, `:406-407`), bootstrap-icons (`:41`), Poppins/Space Grotesk (`:44`, las fuentes salen de `fuentes.ts`) y `css/styles.css` (`:45`). El cuerpo (`:51-459`) pasa a `<div id="raiz"></div>` más `<script type="module" src="/src/entry/home.tsx">`. `home.tsx` se reescribe con el contenido de `landing.tsx` (`Provider` + `Carcasa pagina="inicio" sobrePortada` + `Landing`); se elimina `gobernarEncabezado` (`:192-270`), que ya hace `Encabezado`.
- **Reutilizar**: toda la carcasa y `src/landing/*`. **Deberes diferidos de forma explícita**: registro del service worker y `.offline-alert` (paso 5), analítica (no existía).
- **Aceptación**: B1 a B10. Además: las 10 secciones en el orden fijado (portada, mostrador, carrusel, populares, ofertas, preguntas, familia, horarios, contacto, comentarios); caja de la portada de 219 px a 390 y 765 px a 1440×900; 0 peticiones `.mp4` antes de `load`; `rg -c 'application/ld\+json' dist/index.html` = 1; ninguna petición a `cdn.jsdelivr.net/npm/bootstrap`; el carrito conserva la cuenta al saltar a `products.html` (B9).
- **Rollback**: `git revert <sha>` restaura `index.html`, `home.tsx` y `manifest.json`; las rebanadas 1.1 a 1.5 quedan inofensivas.
- **Commit**: `feat(index): replace the landing in place with the React + Tailwind entry / migra index.html in situ a la entrada React + Tailwind`.

**1.7 Retirar lo paralelo de la landing (solo tras pasar la 1.6)**
- **Objetivo**: que exista una sola landing.
- **Borrar** (listar en el cuerpo del commit): `landing.html`, `src/entry/landing.tsx`; quitar `landing` de `vite.config.js:40`; ajustar `src/styles/tailwind.css:2-6,22` (`@source` de `index.html`); y los huérfanos que solo usaba `index.html` tras confirmar con `rg` 0 importadores: `js/modules/ui/scroll-reveal.js`, `js/modules/ui/hero-video.js`, `js/modules/core/loyalty.js` (si 1.4 se portó o se retiró), `src/components/{Showcase,Testimonios,CategoryCard}/` y `src/components/BentoGrid.tsx` (sin importadores hoy). No borrar `header.js`, `cart.js`, `weather.js` ni `chatbot.js`: siguen usándolos `products.html` y `accessweb.html`.
- **Actualizar** referencias (sección 3.2 y 3.6): `gates.sh`, `ESTADO.md`. Solo si la rama `pruebas` llegó a publicarse: redirección 301 de `/landing.html` a `/index.html` en `netlify.toml`.
- **Aceptación**: B7, B8 (`rg "landing\.html" --glob '!docs/**'` da 0); `dist/` ya no contiene `landing.html`; `ci.yml:34-38` sigue verde.
- **Rollback**: `git revert <sha>`.
- **Commit**: `chore(index): remove the parallel landing.html entry after parity / elimina la entrada paralela landing.html tras la paridad`.

### Paso 2 · `products.html` (catálogo)

Antes de empezar: `rg -n 'className="[^"]*\b(btn|container|row|col-|d-)' src/pages src/components` mide cuánto Bootstrap usan `ProductoDetalle.tsx`, `Carrito.tsx` y `OrderList`. Bootstrap se quita de `products.html` solo cuando las tres rutas del `HashRouter` estén restiladas.

**2.1 Reapuntar enlaces y fijar el contrato de URL**
- **Objetivo**: que la carcasa enlace a rutas reales y un solo formato de categoría (`products.html?categoria=<slug>`).
- **Archivos**: `Carcasa.tsx:50`, `Encabezado.tsx`, `MenuHoja.tsx:85,88,100`, `Pie.tsx:39,44`, `Portada.tsx:164`, `Mostrador.tsx:38`, `Populares.tsx:25`, `CarritoHoja.tsx:118`, `Tarjeta.tsx:220`, `src/ui/__tests__/Tarjeta.test.tsx:99,102,136,143`.
- **Aceptación**: B7, B8 (`rg "catalogo\.html" --glob '!docs/**'` solo devuelve `catalogo.html`, `vite.config.js`, `tailwind.css`, `gates.sh`); `products.html?categoria=res` filtra como antes.
- **Rollback**: `git revert <sha>`.
- **Commit**: `refactor(shell): point catalog links to products.html with the ?categoria contract / apunta los enlaces del catálogo a products.html con el contrato ?categoria`.

**2.2 Ficha y carrito restilados**
- **Objetivo**: que `#/producto/:id` y `#/carrito` ya no dependan de Bootstrap ni de `redesign.css`.
- **Archivos**: `src/pages/ProductoDetalle.tsx`, `src/pages/Carrito.tsx`, `src/components/OrderList/*`, `src/components/{Relacionados,BannerEditorial}/*`. Un commit por ruta.
- **Portar**: cotización de cortes premium (`quote.js`, `premium-cuts.js`, `ProductoDetalle.tsx:5-6`) y el modal premium que hoy persiste por `cart.js` (`products.tsx:316`), `createOrder()` (`supabase.js:230`). **Reutilizar**: `Tarjeta`, `Hoja`, `lineaPedido`, `formatearPrecio`.
- **Aceptación**: B1 a B3, B5, B9; `#/producto/14` y `#/carrito` funcionan con la semilla y con datos vivos; el flujo de pedido llega a `create_order_with_items`.
- **Rollback**: `git revert <sha>` por ruta.
- **Commits**: `feat(products): restyle the product detail route with Tailwind / restila la ruta de ficha de producto con Tailwind`; `feat(products): restyle the cart route with Tailwind / restila la ruta del carrito con Tailwind`.

**2.3 Lista con la Tarjeta única**
- **Objetivo**: una sola tarjeta de producto.
- **Archivos**: `src/components/ProductList/ProductList.tsx` (`:1` importa `ProductCard`; pasa a `Tarjeta`), `src/entry/products.tsx` (`CatalogExperience`, `CarrilCategorias`).
- **Aceptación**: B1, B5; la cantidad de tarjetas es igual a los productos activos de la fuente (vivo o semilla); `#buscar` del paso 1.1 abre la Lupa.
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(products): render the catalog with the single Tarjeta / pinta el catálogo con la Tarjeta única`.

**2.4 Sustituir el cuerpo de `products.html`**
- **Objetivo**: catálogo con la carcasa nueva en la misma ruta.
- **Archivos**: `products.html` (se conservan `manifest :10`, `theme-color`, `title :8`, `description :9`, `icon`; se quitan Bootstrap, iconos, Melvis, `css/styles.css`, los scripts `:59-67,261,305` y el marcado `:70-~304`; cuerpo = `#raiz` + `src/entry/products.tsx`), `src/entry/products.tsx` (envolver el `HashRouter`, `:455-468`, con `Carcasa pagina="catalogo"`; quitar `Lupa` y `CartPanel` propios, `:4,:7`, y `mountReactNode`), `src/ui/Carcasa.tsx`.
- **Portar**: breadcrumb (`products.html:184`) y mini header plegable (`header.js:36-47`) si el diseño los conserva (si no, anotarlo como retiro); chips `?categoria=` (ya en `MenuHoja`); el sondeo `file:` (`:16-58`) se retira explícitamente (era de desarrollo). **Borrar** ahora: `js/modules/ui/weather.js`.
- **Aceptación**: B1 a B10; `products.html?categoria=res`, `#/producto/14` y `#/carrito` funcionan; el carrito se comparte con `index.html` (B9).
- **Rollback**: `git revert <sha>` restaura la página vieja.
- **Commit**: `feat(products): replace the catalog page in place with the React + Tailwind shell / migra products.html in situ a la carcasa React + Tailwind`.

**2.5 Retirar lo paralelo del catálogo**
- **Borrar**: `catalogo.html`, `src/entry/catalogo.tsx`, `src/catalogo/`; quitar `catalogo` de `vite.config.js:41`; ajustar `tailwind.css:23`; los componentes sin importadores (`src/components/ProductCard/`, `CarrilCategorias`, tras `rg`). Redirección 301 de `/catalogo.html` a `/products.html` solo si `pruebas` se publicó.
- **Aceptación**: B7, B8 (`rg "catalogo\.html" --glob '!docs/**'` da 0).
- **Rollback**: `git revert <sha>`.
- **Commit**: `chore(products): remove the parallel catalogo.html entry / elimina la entrada paralela catalogo.html`.

### Paso 3 · `accessweb.html` (acceso y registro)

**3.1 Extraer la lógica de `auth.js` a funciones exportadas (sin cambio visible)**
- **Objetivo**: que React pueda llamar a inicio de sesión, registro y OAuth sin copiar la lógica.
- **Archivos**: `js/modules/core/auth.js` (hoy solo exporta `appState`, `logout`, `checkAdminAuth`, `isAuthenticated`, `getCurrentUser`; exportar los manejadores de `:196`, `:312`, `:349`, `:368`). Conservar los ids `#authContainer`, `#loginForm`, `#registerForm`, `#btnShowRegister`, `#btnShowLogin` mientras la página vieja exista (contrato `README.md:782-786`).
- **Aceptación**: B7; la página vieja sigue iniciando sesión igual.
- **Rollback**: `git revert <sha>`.
- **Commit**: `refactor(auth): export login, register and OAuth handlers / exporta los manejadores de inicio de sesión, registro y OAuth`.

**3.2 Sustituir el cuerpo de `accessweb.html`**
- **Archivos**: `accessweb.html` (conservar `manifest :11`, `apple-touch-icon :27`, `title`, `description`; quitar Bootstrap, **Font Awesome `:17`**, Poppins/Melvis, `css/styles.css`, scripts `:321-326`, script del deslizamiento `:329-363`, chatbot `:374-400`), `src/entry/auth.tsx` (sustituir la franja de marketing por el formulario con la mascota de `public/img/mascota/`, dentro de `Carcasa`), `src/ui/Carcasa.tsx` (admitir `pagina="acceso"`).
- **Portar**: deslizamiento `sign-up-mode` como estado de React (`accessweb.html:329-363`), redirecciones (`auth.js:217,219`, `?admin=true`, `?redirectTo=` de `dashboard.js:18`), OAuth (`:349,:368`) con `redirectTo` a `index.html`/`dashboar.html` (verificar la lista permitida de Supabase Auth). Errores en línea, no `alert()`.
- **Aceptación**: B1 a B3, B5, B8; usuario de prueba local entra y llega a `index.html`; usuario administrador llega a `dashboar.html`; contraseña incorrecta muestra el error en pantalla; el cambio entre "Ingresar" y "Registrarse" funciona con teclado a 390 y 1440.
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(accessweb): replace the auth page in place with the React + Tailwind shell / migra accessweb.html in situ a la carcasa React + Tailwind`.

**3.3 Retirar el JS y el CSS vanilla que ya no usa ninguna página pública**
- **Borrar** tras `rg` con 0 importadores (las tres páginas públicas ya migradas): `js/modules/ui/header.js`, `js/modules/core/cart.js` (antes, confirmar que el modal premium ya vive en React, paso 2.2), `js/modules/chatbot.js`, `css/components/_chatbot.scss`, `js/modules/core/delivery.js` (confirmar qué hace antes), `src/components/CartPanel/`, `src/components/Lupa/montar.tsx` si sobra.
- **Aceptación**: B7, B8; `dist/` sin esos archivos; las tres páginas públicas pasan B1 a B10.
- **Rollback**: `git revert <sha>`.
- **Commit**: `chore(shell): remove vanilla header, cart and chatbot modules / elimina los módulos vanilla de encabezado, carrito y chatbot`.

### Paso 4 · `dashboar.html` y `admin-*.html`

**4.1 Cierre de sesión real en las páginas actuales (arreglo de seguridad, sin cambio visual)**
- **Objetivo**: que "Cerrar sesión" y "Salir" llamen a `signOut()` (hoy son enlaces a `index.html`; `rg signOut` en `admin.js` y `dashboard.js` da 0).
- **Archivos**: `dashboar.html:56,98`, `admin-products.html:30`, `admin-customers.html:30`, `admin-orders.html:30` (enlace → botón que invoca `logout()` de `js/modules/core/auth.js:385` y luego navega a `index.html`).
- **Aceptación**: tras pulsar, `supabase.auth.getSession()` devuelve sin sesión y `dashboar.html` redirige a `accessweb.html?admin=true`.
- **Rollback**: `git revert <sha>`.
- **Commit**: `fix(dashboar): call signOut on the logout links / llama a signOut en los enlaces de cierre de sesión`.

**4.2 Carcasa del panel con cajón móvil y guardia de administrador**
- **Objetivo**: hamburguesa con cajón propio (`Hoja`) con X visible, Escape y toque en el fondo, más guardia que no muestra nada hasta confirmar el rol.
- **Archivos** (existentes primero): `dashboar.html`, `src/entry/dashboard.tsx` (monta la carcasa y conserva `BuildAdsOrchestrator`), `js/modules/utils/admin-auth.js` (reutilizar `verifyAdminSession :53`; quitar el campo `adminToken` sin uso `:13` y el `alert()` `:29`). El cajón y la navegación viven en un componente de panel que reemplaza el cascarón `src/panel/Panel.tsx` y se consume desde `dashboard.tsx`.
- **Portar**: enlaces `dashboar/admin-products/admin-customers/admin-orders` (`dashboar.html:36-51`), cierre de sesión (4.1), gráficas (`chart-config.js`), tabla de pedidos recientes (`#recentOrdersTable`), `BuildAdsOrchestrator`. Añadir `<meta name="robots" content="noindex">` (como `panel.html:8`) y `description`. Quitar los dropdowns con `href="#"` muertos (`dashboar.html:74-96`).
- **Aceptación**: B1 a B5; a 390 el cajón abre con la hamburguesa y cierra con X (≥44×44), Escape y fondo; sin sesión o sin rol admin no se renderiza el panel; con rol admin aparecen gráficas y tabla; la RLS de Supabase sigue siendo la protección real (la guardia del cliente es solo de experiencia).
- **Rollback**: `git revert <sha>`.
- **Commit**: `feat(dashboar): replace the admin dashboard in place with the React + Tailwind shell / migra dashboar.html in situ a la carcasa React + Tailwind`.

**4.3, 4.4 y 4.5 `admin-products.html`, `admin-customers.html`, `admin-orders.html` (un commit cada una)**
- **Archivos**: la página correspondiente y su `src/entry/admin-*.tsx`; usan la carcasa del panel del paso 4.2.
- **Aceptación**: B1 a B3, B5; la tabla o gráfica de cada página conserva sus datos.
- **Rollback**: `git revert <sha>`.
- **Commits**: `feat(admin-products): move the products admin page to the shared panel shell / mueve admin-products al panel compartido` (y análogos para `admin-customers` y `admin-orders`).

**4.6 Retirar lo paralelo del panel**
- **Borrar**: `panel.html`, `src/entry/panel.tsx`, `src/panel/Panel.tsx` (si el cascarón no se reutilizó), quitar `panel` de `vite.config.js:42` y `tailwind.css:24`, y los scripts de tercero que ya no se carguen (jQuery, DataTables, Font Awesome). Nota: jQuery, DataTables y Font Awesome están bloqueados por la CSP de producción (sección 1.7); al migrar la tabla a React el defecto desaparece.
- **Aceptación**: B7, B8 (`rg "panel\.html" --glob '!docs/**'` da 0).
- **Rollback**: `git revert <sha>`.
- **Commit**: `chore(dashboar): remove the parallel panel.html entry / elimina la entrada paralela panel.html`.

### Paso 5 · PWA: service worker y `offline.html`

- **Objetivo**: que el service worker exista de verdad, al final, para que su caché no fije HTML viejo durante la migración (la estrategia `service-worker.js:74-105` es caché primero).
- **Archivos** (existentes primero): `js/modules/utils/service-worker.js` (mover con `git mv` a `public/sw.js` para que Vite lo emita en la raíz y tenga alcance `/`; subir `CACHE_NAME :1`; quitar el precache de módulos que Vite no sirve `:10-12`; red primero para navegaciones), `js/modules/core/api.js` (corregir la ruta `:8` y llamarlo desde la carcasa o `shared`), `offline.html` (restilar), `manifest.json` (`start_url` se queda), `README.md:82` (dejar veraz).
- **Aceptación**: en `dist/` existe `sw.js`; `navigator.serviceWorker.getRegistration('/')` devuelve un registro activo con alcance `/`; en modo avión las páginas muestran `offline.html`; al publicar una versión nueva no se queda atascada la anterior.
- **Rollback**: `git revert <sha>`; además, si ya se registró, hay que desregistrarlo desde el navegador.
- **Commit**: `feat(pwa): register a root-scope service worker with offline fallback / registra un service worker de alcance raíz con página sin conexión`.

### Paso 6 · Retiro final de la capa vieja (requiere aprobación de Eduardo)

- **Objetivo**: quitar Bootstrap, SCSS 7-1 y styled-components cuando ninguna página los cargue.
- **Archivos**: `css/` y `css/styles.css` (compilado), `src/styles/redesign.css`, `globalStyles.ts`, `carniTheme.ts`, `src/entry/shared.tsx` (último consumidor: `dashboard.tsx`), `js/modules/supabase.js` (sustituido por `src/data/supabase.ts`), `js/modules/utils/offline.js`, `ui/notifications.js`, `pages/checkout.js`, dependencia `styled-components` y `sass` (`package.json:61`), scripts `css:components` (`:11-12`). Reescribir `AGENTS.md` y `README.md` con el estado real.
- **Aceptación**: `rg -L 'css/styles.css' *.html` lista todas las páginas (ninguna la carga); B7; `dist/` sin CSS de Bootstrap.
- **Rollback**: `git revert <sha>`.
- **Commit**: `chore(styles): retire Bootstrap, SCSS 7-1 and styled-components / retira Bootstrap, SCSS 7-1 y styled-components`.

### Tabla de borrados: qué archivo viejo muere y en qué paso

| Archivo viejo | Última página que lo usa | Se borra en |
|---|---|---|
| `js/modules/ui/scroll-reveal.js`, `ui/hero-video.js` | `index.html` | 1.7 |
| `js/modules/core/loyalty.js` | `index.html` | 1.7 |
| `src/components/{Showcase,Testimonios,CategoryCard}/`, `BentoGrid.tsx` | `index.html` (vía `home.tsx`) | 1.7 |
| `landing.html`, `src/entry/landing.tsx` | (paralelo) | 1.7 |
| `js/modules/ui/weather.js` | `index.html`, `products.html` | 2.4 |
| `src/components/ProductCard/`, `CarrilCategorias/` | `products.html` | 2.5 |
| `catalogo.html`, `src/entry/catalogo.tsx`, `src/catalogo/` | (paralelo) | 2.5 |
| `js/modules/ui/header.js`, `core/cart.js`, `chatbot.js`, `core/delivery.js`, `_chatbot.scss`, `src/components/CartPanel/` | `accessweb.html` | 3.3 |
| `panel.html`, `src/entry/panel.tsx`, `src/panel/Panel.tsx` | (paralelo) | 4.6 |
| `js/modules/utils/service-worker.js` (se mueve) | nadie (estaba muerto) | 5 |
| `css/`, `redesign.css`, `shared.tsx`, `supabase.js`, styled-components | `dashboar.html` y `admin-*` hasta el 4.5 | 6 |

## 5. Riesgos y reglas anti-duplicado

### 5.1 Lista de revisión para cada commit

Se ejecuta desde la raíz de `pruebas` (comandos de solo lectura salvo los de Docker):

1. **Ningún `*.html` nuevo en la raíz**: `git diff --name-status HEAD~1 | rg '^A\s+[^/]+\.html$'` no debe devolver nada.
2. **Ninguna entrada nueva en Vite**: `git diff -U0 HEAD~1 -- vite.config.js | rg '^\+.*resolve\(__dirname'` no debe devolver nada (solo se permiten líneas `-`).
3. **Cada archivo borrado o movido figura en el cuerpo del commit**: comparar `git diff --name-status HEAD~1 | rg '^(D|R)'` con el cuerpo de `git log -1`.
4. **El cuerpo nombra qué reemplaza o extiende** (`Replaces: ruta`); un componente nuevo sin ese renglón se rechaza. Antes de aprobar un archivo nuevo en `src/`: `fd -t f <nombre>` y `rg -n "<concepto>" src js` (por ejemplo `Tarjeta|ProductCard`, `cargarCatalogo|fetchProducts`, `createClient`).
5. **Una sola rebanada por commit**: `git show --stat` toca los archivos de una sola página, componente o comportamiento.
6. **Cada comportamiento portado está comprobado**: la tabla 2b se copia al cuerpo del commit con el resultado de cada fila afectada (portado, retirado con aprobación, o diferido al paso N).
7. **Paridad de `<head>` y de PWA**: `rg -L 'rel="manifest"' index.html products.html accessweb.html dashboar.html admin-*.html offline.html` no lista nada; `index.html` mantiene `description`, `canonical`, `og:*` y un único `application/ld+json` (`rg -c`).
8. **Sin referencias colgantes**: tras cualquier cambio de ruta, las búsquedas de la sección 3 para el nombre afectado solo dan resultados esperados. Comando base: `rg -n "landing\.html|catalogo\.html|panel\.html" --glob '!docs/**' .`, que debe ser 0 cuando termina el paso que retira esa entrada.
9. **Una sola de cada cosa**: tarjeta de producto (`src/components/ProductCard` desaparece en 2.5), cargador de catálogo (`rg -n "fetchProducts|cargarCatalogo" src`), cliente de Supabase y lectura de `VITE_SUPABASE_*` (`rg -n "createClient|VITE_SUPABASE" src js` en un único archivo al terminar el paso 6), `assetUrl` y sistema de superposiciones (`Hoja`).
10. **Ninguna superposición sin X**: prueba manual o de Playwright de la Batería B3 sobre toda superposición tocada.
11. **Contrato de URL intacto**: `products.html?categoria=<slug>`, `products.html#/producto/:id`, `products.html#/carrito`, `localStorage['carni_cart_v1']`, evento `cart:updated`, ids de acceso (`README.md:782-786`).
12. **Compuertas en Docker**: `docker exec carni-landing-dev npm run ts:check`, `npm test`, `npm run build`; `dist/` contiene las páginas esperadas y `ci.yml:34-38` sigue válido.
13. **Capturas a 390 y 1440** adjuntas en `capturas-r4/` y avance guardado en `ESTADO.md` y en Engram (proyecto `carni-mvp`).
14. **Mensaje de commit convencional y bilingüe**, sin atribución de IA, verificado con `git log -1` tras el commit.
15. **Rollback listo**: el commit se revierte solo con `git revert <sha>` sin tocar otro.
16. **Aprobación humana** (AGENTS.md:115-121) antes de borrar archivos fuera de lo pedido, renombrar rutas, cambiar el contrato de entorno o introducir una capa local nueva.

### 5.2 Riesgos

| Riesgo | Por qué importa | Mitigación |
|---|---|---|
| Activar el service worker a mitad de la migración | su caché primero (`service-worker.js:74-105`) fijaría HTML y JS viejos | registrarlo solo en el paso 5, con `CACHE_NAME` nuevo y red primero para navegaciones |
| Bootstrap y preflight de Tailwind en la misma página | estilos rotos | migrar cada página completa; en `products.html` restilar las tres rutas antes de quitar Bootstrap (paso 2.2 antes de 2.4) |
| Divergencia del contrato de URL | enlaces del cajón, de la landing y marcadores dejarían de filtrar | paso 2.1 antes de tocar `products.html` |
| Redirecciones de OAuth | `auth.js:352,371` necesitan estar en la lista de Supabase Auth, que no está en el repo | confirmar con Eduardo al llegar al paso 3 |
| Rutas absolutas bajo GitHub Pages | `deploy-pages.yml:55` usa base `/Landingpages-Carni.pwa/`; lo absoluto ya falla | en código nuevo usar rutas relativas (como ya hace la carcasa) |
| CSP de producción | `netlify.toml:35` bloquea Font Awesome, jQuery y DataTables | se elimina al migrar la tabla y quitar esos scripts (4.6); validar la CSP con las dependencias finales |
| `supabase.js` lanza al importarse (`:10-14`) | una entrada que importe `shared.tsx` queda en blanco sin `.env` | `home.tsx` deja de importarlo en 1.6; cada página migrada usa `src/data/supabase.ts`; retiro final en el paso 6 |
| Dos catálogos de semilla | `seedProducts.ts` (33, con "Picaña") frente a `semillaCatalogo.json` (53 según `ESTADO.md:137`) | una sola fuente al terminar el paso 2 |
| Contenido no validado por el dueño | FAQ con pedido mínimo y zonas (`ESTADO.md:144`); description vieja con precios | conservar la redacción sin precios; confirmar con Eduardo antes de publicar |
| GGA fuera de juego | los commits de código van con `--no-verify` (`ESTADO.md:123`) | esta lista es la compuerta; completar la enmienda de AGENTS.md en el paso 0 |
| `README.md:82` afirma una PWA funcional | documentación falsa (AGENTS.md exige documentar solo lo que existe) | corregir en el paso 5 (o antes, con una línea) |

### 5.3 No verificado en este mapa

- Qué fuente de datos lee `src/landing/Comentarios.tsx` (si `src/data/resenas.ts` o una propia).
- Si `src/landing/Contacto.tsx` muestra el correo de `index.html:306`.
- Cuánto Bootstrap usan `ProductoDetalle.tsx`, `Carrito.tsx` y `OrderList` (la comprobación va al inicio del paso 2).
- Qué hace `js/modules/core/delivery.js` y si `js/modules/ui/ui.js` está realmente sin uso.
- La lista de redirecciones permitidas de Supabase Auth y si la rama `pruebas` se publicó alguna vez (condiciona las redirecciones 301).
- Las líneas finales exactas de los bloques `products.html:~250`, `~304` y `index.html:~460` (se dan con `~`).
