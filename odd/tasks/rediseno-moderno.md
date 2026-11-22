# Rediseño moderno de Carni-mvp

Objetivo: migrar las páginas reales (index, products, accessweb) y el panel a plantillas de Django y modernizarlas en su lugar, al nivel de Horizon X y Motion Sites, mobile first, con Django + islas de React + Tailwind v4 + GSAP/ScrollTrigger + Motion.
Rama de trabajo: `backend`, que tiene Django, el panel y el JS/CSS; se trabaja desde el worktree `.claude/worktrees/stack-carney-mvp-244236` y se entrega con `git push origin HEAD:backend`. Pruebas: Django (`manage.py test --settings=config.settings_test`, 1025 en verde), Jest (239 en verde) y `node --test tests/visual/` (9 en verde).

## Specs

Citas literales de Eduardo, 2026-11-21.

- **S1** Mejorar el proyecto base, nunca uno paralelo: "Vamos a mejorar nuestro proyecto base integrando lo que nos dicen las prácticas o seguimos igual, creando nuevos proyectos aislados, generando ejercicios que no sirven".
- **S2** Las cuatro piezas pasan a Django: "En el paso 1 también te faltó la web products… También tienes que pasarla a una vista de Django. Plantillas. Igual conectando [Vite] con Django para que estas páginas carguen React, Tailwind, [GSAP] y Motion".
- **S3** Landing: "una landing con scroll de animación"; "La landing page, en este caso la index HTML, igual mejorarla… bien estructurada, bien animada, scroll driven, motion".
- **S4** Accessweb: "Access Web moderna sobre sus mismos archivos". La base es la mascota de Don Carlos (`37535551`). La referencia mobile first es `docs/design/referencias/accessweb-mobile-first-2026-11-21.png`: login y registro con Don Carlos sobre fondo naranja y la tarjeta blanca del formulario. "Igual esto es mejorable a nivel de… motion sites, animaciones de motion graphics, animaciones como [Refero], como V0… tanto como para móvil como para… una computadora".
- **S5** Panel: "Ya también empieza con el panel, es la funcionalidad completa… si bien también ya lo tenemos ahí, pero es muy básico… ya sabes los ejemplos, ya sabes referencias, ya sabes lo que tiene que venir en el panel".
- **S6** Productos: "teníamos nuestras vistas de los productos, configuración de los productos… ya tienes que mejorar… la página de configuración de productos, la web products, el carrito".
- **S7** Componentes coherentes: "el carrito, el header, el hamburger menu, igual que sea el mismo en todas las páginas, que sea coherente, el header bien hecho, los logos bien hechos, mejorar los logos… mejorar los diseños de la mascota, los diseños de la animación… haciendo la mobile first".
- **S8** Tienda paralela: "En la parte solo saco lo que sirvo como animación… ya las puedes borrar si ya las comiteaste". Antes de borrar, lo rescatable queda en Engram (#3328, topic `carni-mvp/tienda-paralela-rescate`). La lógica de `ventas/views/` (catálogo, cotizar, carrito, pedido) se conserva; solo se borra su capa visual.
- **S9** Recursos obligatorios: "Utiliza roadmap… REA… Grillhouse y Carnívoros… Big School… Videos igual". "Caarni1.zip"… "no es lo que buscábamos". Puede servir de base, pero no es el resultado.

## Cómo se logra

| Capa | Herramienta | Estado |
|---|---|---|
| Páginas | Plantillas de Django; las vistas de `ventas/views/` las pintan en las mismas rutas (`/`, `/productos/`, `/acceso/`) | Pendiente (T3-T5) |
| Puente | `{% vite_asset %}` (`backend/ventas/templatetags/vite.py`) lee `backend/static/vite/.vite/manifest.json` | Hecho (`78576637`, 5 pruebas) |
| Build | `vite.django.config.js` con `base: '/static/vite/'`, `manifest: true`, `outDir: backend/static/vite`, y el script `build:django`; la salida se versiona, igual que `static/panel/panel.css` | Pendiente (T2) |
| Sin CDN | La CSP de Django solo admite `'self'`. Bootstrap, Bootstrap Icons y Font Awesome se empaquetan con Vite o se reemplazan | Pendiente (T2) |
| Animación | GSAP + ScrollTrigger empaquetados; Motion en las islas; `prefers-reduced-motion` siempre | Pendiente |
| Calidad | LCP < 2.5 s, CLS < 0.1, imágenes con width y height, WebP/AVIF, CSRF en todo fetch, paginación y RBAC en el panel (roadmap.sh: `django`, `api-design`, `cyber-security`, `frontend`) | Regla |

## Tasks

| ID | Specs | Tarea | Ruta | Estado |
|---|---|---|---|---|
| T0 | — | Integrar `frontend` en `backend` y recuperar index, products, accessweb y sus entradas | inline | hecho (`c01cbc97`, `33ec0015`) |
| T1 | S2 | Etiqueta `{% vite_asset %}` con sus pruebas | inline | hecho (`78576637`) |
| T2 | S2 | Dependencias y build: instalar `gsap`, `motion`, `bootstrap` y `bootstrap-icons` con versión fija; `vite.django.config.js` y el script `build:django`; un entry por página en `js/entries/` | inline | **bloqueada**: ver L4 |
| T3 | S2, S3, S8 | `index.html` → plantilla de Django en `/`, con su diseño; después, la animación con scroll rescatada de la tienda (#3328) | inline | pendiente |
| T4 | S2, S6 | `products.html` → plantilla en `/productos/` con el catálogo real, el cotizador y el carrito | inline | pendiente |
| T5 | S2, S4 | `accessweb.html` → plantilla en `/acceso/`, mobile first según la referencia | inline | pendiente |
| T6 | S7 | Header, menú hamburguesa, logo, carrito y pie como parciales únicos de Django, compartidos por las cuatro páginas | inline | pendiente |
| T7 | S5, S6 | Panel completo: tablero con KPIs, pedidos, inventario y la configuración de productos, con las referencias del panel | inline | pendiente |
| T8 | S8 | Borrar la capa visual de la tienda paralela cuando T3-T5 la reemplacen | inline | pendiente |

## Log

- **L1 (2026-11-21):** el primer pedido de Eduardo: "deja todo listo, empecemos a desarrollar ya".
- **L2 (2026-11-21):** `backend` borró las páginas reales en `f4141530` (2026-11-17) y montó en su lugar una tienda paralela (`ventas/templates/ventas/tienda/`, `static/tienda/`). En `backend` ya existe Tailwind compilado y versionado para el panel (#798).
- **L3 (2026-11-21):** consulta de recursos. Roadmap.sh: performance, accesibilidad, CSRF, RBAC y paginación. Videos: tareas de unas 400 líneas, revisar la seguridad en una sesión nueva y correr las pruebas antes de confiar. Referencias por sección: `docs/design/claude-design-1.1/`, `~/agentic-global/claude/raw/diseno/{horizonx,motionsites}/`, Engram #2466, #2913, #703 y #1350. REA de la competencia: #3277, #3246, #3227 (Grill House es referencia funcional; su diseño no se copia).
- **L4 (2026-11-21), bloqueo de T2:** la regla del proyecto dice "npm solo en Docker". El devcontainer monta el repo completo, y `node_modules` es un enlace a una ruta de macOS (`.claude/worktrees/loop-carni/node_modules`) que no existe dentro del contenedor. Docker Desktop estaba apagado. Hay que montar un volumen con nombre en `/workspace/node_modules` dentro del contenedor (`.devcontainer/docker-compose.yml`), encender Docker y correr `npm install` ahí. Ese cambio toca dependencias, que es el riesgo 5: commit aparte.
