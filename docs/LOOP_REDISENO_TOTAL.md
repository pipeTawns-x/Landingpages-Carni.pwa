# LOOP-REDISENO-TOTAL · agente del rediseño (React + Tailwind) · rama pruebas

- Trabajas en `~/Desktop/Carni-mvp-pruebas`, rama `pruebas`. No cambies de rama.
- Solo existen tres ramas: `practicas-ebac`, `pruebas` y `main`. No crees ramas ni PR sin que Eduardo lo pida.
- `~/Desktop/Carni-mvp` (`practicas-ebac`) es del backend: solo lo lees, después de `git -C ~/Desktop/Carni-mvp fetch origin`, con `git -C ~/Desktop/Carni-mvp show origin/practicas-ebac:<ruta>`. Usa siempre `origin/...`: la rama local de ese checkout va atrasada.
- Este loop vive en `origin/practicas-ebac:docs/LOOP_REDISENO_TOTAL.md`. En F0 lo copias a tu rama.

## 1. Propósito y alcance

Entregar el REDISEÑO DE TODO EL PROYECTO hecho en Claude Design. Se mejoran EN EL LUGAR los archivos que ya existen; nunca páginas paralelas ni proyectos nuevos.

- **Tienda** (estática, Vite + React + Tailwind, sobre Supabase):
  - `index.html` → Landing.
  - `products.html` → Catálogo y ficha, más Compra (carrito, checkout y estado del pedido).
  - `accessweb.html` → Inicio de sesión del cliente.
- **Panel administrativo:** lo SIRVE DJANGO (decisión de Eduardo del 2026-10-06).
  - Mejoras `dashboar.html` y `admin-products.html` (después `admin-orders.html` y `admin-customers.html`) hasta que tengan el rediseño.
  - Ese HTML es el que Django responde: el backend lo mueve a sus plantillas (`git mv`) y le pone datos reales.
  - En el panel no haces fetch a Supabase ni un shell de React aparte.
- **Lo ÚNICO nuevo:** el Perfil del cliente (con su tarjeta afiliada, pedidos, favoritos, nivel y afiliados), según el diseño "Perfil del cliente".
  - El nombre y quién lo sirve se fijan en el contrato con Eduardo antes de construirlo (propuesta: `/cuenta/`, servido por Django).
  - Mientras tanto, diseña su HTML con marcas `data-dj`.
- **QUÉ NO HACES:**
  - páginas paralelas;
  - plantillas de Django (`backend/**` es del backend);
  - migraciones aplicadas;
  - rutas inventadas.
- **PRIORIDAD:** prioridad no es exclusión; al final TODO queda rediseñado.
  1. F0–F1.
  2. Productos del panel (lo necesita la entrega M14).
  3. La tienda según tu MAPA (index → products → accessweb).
  4. Perfil del cliente.
  5. El resto del panel.
  6. PWA y retiro de Bootstrap/SCSS (con OK de Eduardo).

## 2. Contexto: memoria primero, después verificar

1. **Engram.** Busca en los dos proyectos, `carni-mvp` y `Landingpages-Carni.pwa`.
   - `mem_search` NO encuentra por `topic_key`. Busca con palabras del título: "Admin panel served by Django", "Panel contract", "contrato panel Django", "frontend backend gaps".
   - Para claves exactas: `sqlite3 -readonly ~/.engram/engram.db "SELECT id, project, title FROM observations WHERE topic_key LIKE 'panel-django/%' OR topic_key LIKE 'revision/%';"`
2. **Contexto del otro agente, antes de CADA paso.** Revisa lo último que hizo el backend antes de escribir:
   - `sqlite3 -readonly ~/.engram/engram.db "SELECT id, project, title FROM observations WHERE topic_key LIKE 'panel-django/%' OR topic_key LIKE 'contrato/%' OR topic_key LIKE 'revision/backend-a-frontend/%' ORDER BY id DESC LIMIT 15;"`
   - `git -C ~/Desktop/Carni-mvp fetch origin` y `git -C ~/Desktop/Carni-mvp show origin/practicas-ebac:docs/PANEL_DJANGO_ESTADO.md`.
   - Si el backend cambió el contrato o pidió una página, ajusta el paso antes de tocar código.
3. **Verifica en el repo lo que recuerdes** y repórtalo así: "recordaba X; verifiqué Y". Nunca digas "no existe" sin buscar en Engram y en git.
4. **Documentos del backend:** `origin/practicas-ebac:docs/` → `CONTRATO_PANEL_DJANGO.md` (rutas, dueños, sincronización y seguridad del traspaso en §5b), `DECISION_PANEL_DJANGO_2026-10-06.md`, `PANEL_DJANGO_ESTADO.md`.
5. **Diseño:** ya está en tu rama, en `docs/design/claude-design-1.1/`: 16 pantallas `.dc.html`, `LEEME.md` y `github.md`. Es idéntico a `Caarni1.zip`.
6. **M14:** el código EXISTE en `origin/practicas-ebac`, en `backend/ecommerce/` y en la paginación de `inventory` (commits `4ed789e4` y `2e222757`).
   - **La M14 NO está entregada en el LMS.** Se entrega cuando Django sirva el panel rediseñado (B5 del backend), con capturas de ese panel.
   - `HANDOFF-BACKEND.md` §8 (commit `69b2f231`), la nota #652 y tu nota que dice "M14 entregada 30-sep" están mal: corrígelos en F0.
7. **Tu MAPA, ESTADO y `gates.sh`:**
   - MAPA §4.2–4.5 y ESTADO #12 / 06-plano §5.4 ("panel en React, Django aparte") quedan SUPERADOS.
   - El trabajo sin commitear de tu árbol (Lupa/Hoja, `jest.config.js`, `supabase.ts`, `products.tsx`, `busquedaSlice`, `Carcasa`, `Encabezado`) se termina como su propio slice o se anota en ESTADO.

## 3. Reglas duras

- Un archivo por commit, con commit convencional bilingüe ("tipo(ámbito): English / español") y sin atribución a IA. `git add` con rutas exactas.
- **GGA solo revisa `*.ts`, `*.tsx`, `*.js`, `*.jsx` y `*.py`.**
  - Los commits de HTML, CSS y documentos no lo activan.
  - Eduardo ya decidió dos cosas, y las dos van en F0:
    - **La enmienda de `AGENTS.md`** (Tailwind v4 en las páginas migradas y en el panel). Copia el texto idéntico desde `git show origin/practicas-ebac:AGENTS.md`: es la viñeta que sigue a "Ningun otro directorio contiene SCSS" y la línea de Tailwind en "Contexto Visual y Producto".
    - **GGA gratis.** Tu `.gga` lleva `PROVIDER="opencode:opencode/mimo-v2.6-flash-free"` y `export OPENCODE_CONFIG_CONTENT='{"snapshot":false}'`. Cópialos desde `git show origin/practicas-ebac:.gga`. Sin esa segunda línea, el snapshot de OpenCode mete y saca archivos del commit que GGA está revisando.
  - Nunca `--no-verify`. Si GGA responde ambiguo (sin la línea `STATUS:`), reintenta el commit una vez. Si vuelve a pasar, escribe BLOQUEADO y sigue con los pasos de HTML/CSS.
- npm solo en Docker. Nada de CDN, ni `innerHTML` con datos. Solo tokens del `@theme`.
- Conserva del primer diseño lo que Eduardo pidió mantener (por ejemplo, el encabezado). Anota cada excepción frente a Claude Design en ESTADO.
- Datos de ejemplo reales: 53 productos y 9 categorías.
- En el HTML del panel y del perfil, marca lo que Django va a llenar:
  - los ciclos con `<!-- django:for x in y -->` … `<!-- django:endfor -->`;
  - cada dato con `data-dj="obj.campo"`.
- Rutas: SOLO las de la tabla de la §10 (es la misma del contrato).
- `VITE_PANEL_URL` se suma a la lista permitida de G6 en `gates.sh`, en el mismo commit que la introduce.
- El traspaso de sesión cumple la §5b del contrato y pasa revisión de seguridad antes de F4.
- **Variables de entorno:** no crees ningún archivo de entorno nuevo.
  - Las del proyecto viven en el `.env` de la raíz y en `backend/.env`, los dos en `.gitignore`, ordenados por secciones.
  - Las llaves de proveedores de IA viven en `~/.omniroute/.env`, fuera del repo. Nunca las copies al proyecto.
- **Cada instrucción de Eduardo va a Engram en el momento**, con un título buscable ("Eduardo: …"). El grafo de graphify se actualiza solo en cada commit (hook).
- **Modelos:** OpenCode ya tiene un modelo por fase en `~/.config/opencode/opencode.json`:
  - pensar (propose, design, verify): `nemotron-3-ultra-free`;
  - código (orquestador, spec, tasks, apply): `big-pickle`;
  - leer mucho (explore): `gemini-3.5-flash-lite`;
  - lo liviano: `mimo-v2.6-flash-free`.
  - Groq no sirve para agentes: su tier gratis acepta 8000 tokens por minuto y un pedido de OpenCode ya supera eso.

## 4. Equipo (subagentes; un escritor por archivo; tú eres el único que commitea)

| Rol | Archivos |
|---|---|
| Componentes compartidos | `src/ui/*`, tokens, Encabezado, Pie, Tarjeta |
| Landing | `index.html` |
| Web commerce | `products.html`, carrito y checkout |
| Acceso | `accessweb.html` |
| Perfil del cliente | lo que fije el contrato |
| Panel (HTML para Django) | `dashboar.html`, `admin-*.html`, `docs/design/rediseno/panel/kit/` |
| Revisor | contexto fresco |
| Auditor visual | capturas a 390 y 1440 |

- Trabajo en paralelo solo sobre archivos disjuntos.
- Después de 2 fallos seguidos, escala a Eduardo.

## 5. Pasos (cada uno: gates → revisión → commit → push → línea en ESTADO → nota en Engram con el sha)

- **F0.**
  - Revisa el contexto del backend (§2.2).
  - Aplica en `pruebas` la enmienda de `AGENTS.md` y el `.gga` copiados de `origin/practicas-ebac` (§3). Va un archivo por commit.
  - Corrige `HANDOFF-BACKEND.md` §8 y tu nota de Engram: la M14 NO está entregada.
  - Termina tu trabajo sin commitear como su propio slice, o anótalo en ESTADO.
  - Anota la decisión en MAPA y ESTADO.
  - Copia este loop a `docs/design/rediseno/LOOP-REDISENO-TOTAL.md`.
  - Crea la tabla de COBERTURA (§9).
  - Proponle a Eduardo borrar `panel.html`, `landing.html` y `catalogo.html`, que son páginas paralelas. No las borres sin su OK.
- **F1.** Mueve `@theme` y `@custom-variant` a `src/styles/tokens.css`, sin `@import "tailwindcss"`.
  - `tailwind.css` lo importa.
  - Concilia `DESIGN.md` con el CSS real.
  - Se acepta si el hash del CSS de la tienda no cambia. Esto destraba al backend (S1).
- **F2.** `dashboar.html` rediseñado en el lugar (el marco del panel). Destraba S2.
  - AdminNav de 248 px; barra superior con 5 pestañas en 390; "Más" como página.
  - Fuera Bootstrap, jQuery y DataTables.
  - Enlaces a `/panel/...`.
- **F3.** `admin-products.html` rediseñado en el lugar: la lista (pantallas 22 y 28). Destraba S3; es la prioridad M14.
  - Detalle (29), formulario con `<fieldset>` (23 y 30, la libra en solo lectura) y confirmaciones (24, 31 y 32).
  - Todo como bloques en `docs/design/rediseno/panel/kit/productos/`.
- **F4.** La tienda según tu MAPA: index (1.x), products (2.x) y accessweb (3.x).
  - Cuando el backend publique `/panel/sesion/` (S4): `handoffToPanel()` con POST del token, solo en el cuerpo, si `VITE_PANEL_URL` está definida. Cumple la §5b del contrato y G6.
  - "Cerrar sesión" real, con `signOut`, una página por commit.
- **F5.** Perfil del cliente (NUEVO): primero el contrato, después su HTML con `data-dj`.
- **F6.** Islas React para Django: la primera es la vista previa de la Tarjeta.
  - Bundle propio, props por `<script type="application/json">`.
  - `MANIFEST.json` con sha256. Sin `eval` ni inline. Destraba S5.
- **F7.** El resto del panel en el lugar: Inicio (20), Pedidos (21, kanban como isla), Clientes (25), Ajustes (26/48) y BuildAds/ProductAds (42).
- **F8.** Cuando el backend mueva cada archivo a Django, actualiza en la tienda los enlaces y las salidas del login hacia `/panel/...`.
- **F9.** PWA y retiro de Bootstrap/SCSS/styled-components, con OK de Eduardo.
- **F10** (recurrente). Auditoría visual de las páginas que sirve Django. Las diferencias van a Engram, en `revision/frontend-a-backend/<tema>`.

## 6. Gates

- `ts:check`, Jest y build dentro del contenedor.
- `gates.sh`.
- Capturas a 390 y 1440: sin scroll horizontal, objetivos de toque de 44 px o más, foco visible y 0 errores de consola.
- Ningún enlace fuera de la tabla de rutas.

## 7. Auditor después de cada commit

- ¿Es un solo archivo?
- ¿Mejoró un archivo existente en vez de crear uno paralelo (salvo el perfil)?
- ¿Usa solo tokens y solo rutas de la tabla?
- ¿Tiene las marcas `django:` y `data-dj`?
- ¿El mensaje es bilingüe?
- ¿Se actualizó la COBERTURA?

## 8. Guardar y retomar · coordinación

- Antes de cada paso, revisa el contexto del backend (§2.2). Al terminarlo, deja el tuyo en Engram para que el backend lo lea.
- Una línea por paso en ESTADO y una nota en Engram, con títulos buscables, por ejemplo "Rediseño: entrega de admin-products".
- El backend pide páginas en `contrato/pedido/<pagina>`. Tú entregas en `frontend/entrega/<pagina>` con el sha empujado.
- Los avances del backend están en `git show origin/practicas-ebac:docs/PANEL_DJANGO_ESTADO.md`.
- Lo que el otro rompa va a `revision/frontend-a-backend/<tema>`.

## 9. COBERTURA: el loop termina solo cuando TODO dice HECHO

Por cada pantalla: pantalla → archivo → estado → sha → captura 390/1440.

- Componentes
- Encabezado
- Pie
- Tarjeta
- Cierre
- Landing
- Catálogo y ficha
- Compra
- Inicio de sesión del cliente
- Perfil del cliente (nuevo)
- AdminNav
- Panel administrativo (Inicio y Pedidos)
- Productos, clientes y ajustes
- Inventario Django (unido a Productos)
- BuildAds y ProductAds

## 10. Rutas y nombres (las mismas del contrato)

| Sección | Archivo de hoy | Ruta | Nombre |
|---|---|---|---|
| Tienda (sin cambios) | `index.html`, `products.html`, `accessweb.html` | igual | — |
| Perfil del cliente (NUEVO) | lo fija el contrato | `/cuenta/` (propuesta) | `cuenta:inicio` |
| Panel · marco | `dashboar.html` (marco) | plantilla base | — |
| Panel · Inicio | `dashboar.html` (contenido) | `/panel/` | `panel:inicio` |
| Productos | `admin-products.html` y `kit/productos/*` | `/panel/productos/` (`<id>/`, `nuevo/`, `<id>/editar/`, `<id>/eliminar/`) | `inventory:list`, `inventory:detail`, `inventory:create`, `inventory:update`, `inventory:delete` |
| Pedidos | `admin-orders.html` | `/panel/pedidos/` | `orders:board` |
| Clientes | `admin-customers.html` | `/panel/clientes/` | `customers:list` |
| Ajustes | diseño 26/48 | `/panel/ajustes/` | `settings:index` |
| BuildAds/ProductAds | isla en `dashboar.html` | `/panel/publicidad/` | `panel:ads` |
| Más · acceso · sesión · salir | — | `/panel/mas/`, `/panel/acceso/`, `/panel/sesion/` (POST), `/panel/salir/` (POST) | `panel:mas`, `panel:acceso`, `panel:sesion`, `panel:salir` |

## 11. Notas de revisión (qué corregir dentro de los pasos)

- Los tokens no son exportables (F1).
- `DESIGN.md` contradice el CSS construido.
- `panel.html`, `landing.html` y `catalogo.html` son páginas paralelas.
- Las islas del admin (InventoryStudio, OrdersStudio, CustomersStudio y DashboardStudio) son anuncios sin datos.
- El CSP de Netlify bloquea jQuery y DataTables en `dashboar.html`.
- Huecos del diseño:
  - el hamburguesa de 390 no tiene cajón: usa "Más" como página;
  - las confirmaciones solo cierran con "Cancelar";
  - "carritos abiertos" no tiene datos: no lo pintes;
  - la pantalla 33 asume contraseñas de Django: se reemplaza por el traspaso de Supabase.

## 12. Mensaje de arranque

No preguntes nada que no sea una decisión de Eduardo. Si algo bloquea, escribe BLOQUEADO en ESTADO y sigue con el siguiente paso independiente. No pares hasta que la COBERTURA (§9) diga HECHO en todo. Empieza por F0.
