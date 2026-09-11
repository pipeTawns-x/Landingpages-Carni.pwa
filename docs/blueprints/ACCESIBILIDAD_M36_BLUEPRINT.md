# Blueprint de Accesibilidad — Práctica m36 EBAC (v2, revisado por auditoría)

**Proyecto:** Carni-mvp — Carnicería El Señor de La Misericordia
**Rama:** `practicas-ebac`
**Fecha:** 2026-09-10 (v2 — incorpora auditoría Abogado del Diablo D1-D9, verificada contra el repo)
**Estado:** Plan aprobado para implementación por sub-agente (sdd-apply)
**Autocontenido:** Este documento NO requiere contexto previo. El implementador ejecuta la sección 11 (CLAUDE.md del objetivo) y nada más.

---

## 1. Resumen ejecutivo

Carni-mvp cumple con holgura el requisito estructural de la práctica m36 (4 páginas, decenas de imágenes, 2 formularios reales), pero reprobó la auditoría de accesibilidad en seis puntos concretos: **cero `<h1>` en las 4 páginas raíz** y jerarquía rota en el dashboard (`h4`→`h2`→`h6`), **7 inputs de login/registro sin `<label>`** (solo placeholder), **5 pares de color con contraste insuficiente** (botón WhatsApp 1.98:1, texto `#666` sobre charcoal 3.29:1, copyright de products 4.35:1 en texto 0.85rem, **placeholder de auth 2.61:1**, **texto "Cargando estadísticas…" del dashboard 4.35:1**), **cero fragmentos en otro idioma con `lang` propio** y **controles de icono sin nombre accesible** (botones de ojo del dashboard, hamburguesa de sidebar, iconos sociales). El plan corrige los seis frentes con SCSS 7-1 directo (sin migrar frameworks): `h1` visualmente ocultos, `h4`/`h6` del dashboard convertidos con utilidades Bootstrap (semántica corregida con **cero** cambio visual), labels visibles en el formulario de acceso, cinco ajustes quirúrgicos de color con ratios WCAG verificados por fórmula, un fragmento `lang="en"` en el footer y una auditoría ARIA que **quita** lo redundante (3× `role="banner"`) y **agrega** nombres accesibles donde faltan. El presupuesto es una práctica de 60 minutos: se entrega en **3 commits** conventional commits bilingües con un **reporte de verificación real** generado después de implementar (salidas de comandos + WAVE + screenshots). Sin tocar JS, rutas, manifest ni service worker.

---

## 2. Diagnóstico real del repo

Método: lectura directa de los 4 HTML raíz, SCSS 7-1, componentes React que montan headings/alts, manifest y service worker. Todas las rutas y líneas citadas fueron verificadas el 2026-09-10 (y re-verificadas en la revisión D1-D9).

### 2.1 Estado por requisito m36

| # | Requisito m36 | Estado real | Evidencia |
|---|---|---|---|
| 1 | 3+ imágenes, 2+ páginas, 1 formulario | ✅ CUMPLE con holgura | 4 páginas raíz; 3+ imágenes en cada una (logo + panel + productos React); 2 formularios reales en accessweb.html (login + registro). No hace falta agregar nada. |
| 2 | `lang` activo + fragmento en OTRO idioma con su `lang` | ⚠️ PARCIAL | `lang="es"` en index.html:2, products.html:2, accessweb.html:2, dashboar.html:2, offline.html:2. **CERO** fragmentos con `lang` distinto. Falta el fragmento bilingüe. |
| 3 | HTML semántico: header/nav/main/footer + jerarquía headings | ⚠️ PARCIAL | header/nav/main/footer presentes en las 4 páginas. **`grep -c "<h1"` = 0 en las 4** (solo offline.html:97 tiene h1). Jerarquía rota: index arranca en h2 (186, 210, 269) → h3 → h5 (322); products solo h2 React (src/entry/products.tsx:366) + h3; accessweb h2 (115, 160) + h3 (246, 257); **dashboar h4 (31) → h2 (109) → h6 (133, 146, 173)** — salto de niveles en ambos sentidos. El propio index documenta la decisión sin título: comentario líneas 159-161. |
| 4 | `img` con `alt` correctos | ✅ CUMPLE (se agrega compuerta de verificación en PASO 9) | Logos con alt descriptivo: index:83, products:109, accessweb:46, dashboar:30. Paneles de auth con alt descriptivo: accessweb:250, 261. Decorativas con `alt=""`: BannerEditorial.tsx:37, OrderList.tsx:49 (+`aria-hidden`), Lupa.tsx:535, 558. Video decorativo con `aria-hidden` y `tabindex="-1"`: index:175-176. |
| 5 | Formularios con `label` + `for` | ❌ NO CUMPLE | accessweb.html: **7 inputs sin label** — loginEmail (119), loginPassword (124), registerName (166), registerEmail (171), registerPhone (179), registerPassword (190), registerConfirmPassword (195) — solo placeholder + icono. Única excepción correcta: label+for del textarea delivery (209-210). Checkboxes con label implícito OK (130-133, 220-227). |
| 6 | Contraste WCAG (4.5:1 texto, 3:1 componentes) | ⚠️ PARCIAL — 5 fallas | Ver tabla completa en sección 5. Fallas: `#FFFFFF/#25D366` = **1.98** (index:292); `#666/#111111` = **3.29** (index:218, 222); `#999/#363432` = **4.35** en 0.85rem (products:236); **`#999/#f5f5f5` placeholder = 2.61** (_access.scss:465); **`#6C757D/#050505` "Cargando estadísticas…" = 4.35** (dashboar:124 sobre body dark _admin.scss:141). |
| 7 | 2 roles ARIA + 2 aria-labels correctos | ⚠️ PARCIAL — auditar y corregir | Roles útiles existentes: `role="alert"` (index:51, products:72, accessweb:31), `role="status"` en spinner (dashboar:121). aria-labels correctos existentes: menuToggle (index:67), cartBtn (index:89), "Entrar o registrarse" (index:93), drawerClose (index:120), Google/Facebook/Twitter (accessweb:141-149). **Problemas:** 3× `role="banner"` redundante (index:59, products:87, accessweb:37 — un `<header>` top-level ya es landmark banner); `aria-label="Close"` en inglés (index:377, 395); `aria-label="Presentación"` vago en sección sin heading (index:162); **sin nombre accesible**: sidebarToggle (dashboar:67), 5 botones de ojo (dashboar:196, 206, 216, 226, 236), iconos sociales (index:326-334, products:206-208, accessweb:280-282), botón de notificaciones cuyo nombre accesible sería "3" (dashboar:73-78). |
| 8 | Commit de GitHub que mencione accesibilidad | ⚠️ PENDIENTE | Plan de 3 commits en sección 7. |
| 9 | Entrega: link del repo | ⚠️ PENDIENTE | Se entrega el commit hash + URL del repo + reporte de verificación (sección 8.6). |

### 2.2 Hallazgos extra (no bloqueantes pero reales)

- **BUG de nomenclatura CSS:** `css/abstracts/_variables.scss:73` declara `--carni-gold: #{$carni-beige}` — la variable "gold" contiene beige `#E4D1B0`. El `--carni-amber` (línea 74) contiene el verdadero gold `#F59E0B`. Blast radius: 15 usos en scss + 7 en index.html (186, 210, 216, 269, 277, 290, 303). **NO es falla de accesibilidad** (beige sobre charcoal = 12.63:1, sección 5) y corregirlo cambiaría el color de todos los headings de sección → contradice el guardrail de dirección visual. **Decisión: se documenta como deuda técnica y NO se toca en esta práctica.**
- **El navbar del dashboard NO es azul Bootstrap:** `.admin-navbar` está sobrescrito en `_admin.scss:37-45` con `background-color: #111111`. Los botones `btn btn-primary` dentro sí son `#0d6efd` (4.50:1 con blanco, PASS). Dato necesario para no medir pares fantasma.
- **Drawer móvil bien manejado:** `js/modules/ui/header.js:58` y `:67` alternan `aria-hidden` del drawer al abrir/cerrar. PAS — no requiere fix.
- **Service worker:** registrado desde `js/modules/core/api.js:6-8` apuntando a `js/modules/utils/service-worker.js`; `manifest.json` usa `start_url: /index.html` e iconos `img/recursos_web/logo-user.png`. Ningún cambio de este plan toca rutas, manifest ni SW.
- **Tests:** 29 tests verdes. `npm test` = `NODE_OPTIONS=--experimental-vm-modules jest` (package.json:20), corre en Docker/.devcontainer (`.devcontainer/docker-compose.yml` mapea 3002:3002; `postCreateCommand: npm install`). `npx jest` en host NO funciona. Los tests de React están en `src/components/*/__tests__/*.test.tsx` y **ninguno referencia `role="banner"`** (verificado con grep) → quitar el role redundante es riesgo cero para los tests.
- **Dev server:** `npm run dev` = `vite --host 0.0.0.0 --port 3002` (package.json:8, vite.config.js:9). Se verifica con `curl -sI http://localhost:3002/index.html`.
- **El devcontainer NO tiene Chrome** (`FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm`) y `package.json` no declara lighthouse ni puppeteer → **Lighthouse NO puede correr en el entorno de build**. Compuerta de verificación = WAVE manual + script de contraste + `npm test` + greps (sección 8). No se prometen umbrales que el entorno no puede ejecutar.
- **Bootstrap 5.3.7** se carga por CDN en las 4 páginas → `.visually-hidden`, `.h4` y `.h6` (utilidades de heading) están disponibles sin escribir CSS.

### 2.3 Inventario de archivos que se tocarán

| Archivo | Cambio |
|---|---|
| `index.html` | h1 hidden, contraste (WhatsApp + tarjetas), fragmento `lang="en"`, auditoría ARIA |
| `products.html` | h1 hidden, contraste (copyright), fragmento `lang="en"`, auditoría ARIA |
| `accessweb.html` | h1 hidden, labels + for (7 inputs), auditoría ARIA |
| `dashboar.html` | h1 hidden, h4→div, h6→h3 (semántica sin cambio visual), aria-labels en controles de icono |
| `css/pages/_access.scss` | clase `.auth-field-label` + fix de color del placeholder (`#999`→`#595959`) |
| `css/pages/_home.scss` | color de texto del botón WhatsApp (`#0B3D2E`) — *la clase existe en `_home.scss:1154` pero el inline gana: se edita el inline explícitamente* |
| `css/pages/_admin.scss` OR dashboar.html | texto "Cargando estadísticas…": `text-muted` → `var(--carni-text-muted)` (decisión en PASO 6d) |
| `docs/blueprints/ACCESIBILIDAD_M36_BLUEPRINT.md` | este documento |
| `docs/ENTREGA_M36_VERIFICACION.md` | reporte de verificación REAL, generado DESPUÉS de implementar (sección 8.6) |

**NO se tocan:** `vite.config.js`, `server/routes/buildads.ts`, `netlify.toml`, `manifest.json`, service worker, `js/modules/**`, `src/entry/*.tsx`, `src/components/**` (los alts y headings React ya están correctos), `css/abstracts/_variables.scss`.

---

## 3. Arquitectura de la solución

**Decisión técnica: SCSS 7-1 directo + variables CSS existentes + utilidades Bootstrap. Sin tokens nuevos, sin Tailwind, sin migrar frameworks.**

Razonamiento:
1. El sistema de diseño ya existe y es sólido: `:root` en `_variables.scss:70-86` define la paleta oscura con contraste alto (beige 12.63:1, texto 17.32:1, muted 7.49:1). El problema de contraste no es la paleta, son **usos mal elegidos** (3 inline + 2 en SCSS de componentes). Se corrige el uso, no la paleta.
2. El único CSS nuevo es la clase `.auth-field-label` en `_access.scss` (co-locada con el componente que la usa — consistente con el patrón 7-1). Los otros 4 fixes de contraste son: 2 edits inline en HTML (WhatsApp, tarjetas), 1 edit inline (copyright products) y 2 edits en SCSS existente (placeholder en `_access.scss`, texto en `_admin.scss` o inline en dashboar).
3. Los `h1` van **visualmente ocultos con `.visually-hidden` de Bootstrap 5.3.7** (ya cargado por CDN). El caso especial es `dashboar.html`: la jerarquía h1→h4(31)→h2(109)→h6(133,146,173) viola heading-order. Fix con utilidades Bootstrap de heading: el `h4` del brand del sidebar pasa a `<div class="mb-0 h4">` y los `h6` de títulos de tarjetas pasan a `<h3 class="m-0 font-weight-bold text-primary h6">` — **semántica h1→h2→h3, apariencia idéntica** (`.h4`/`.h6` solo fijan font-size/weight).
4. Los labels de accessweb van **visibles** (no sr-only): el form ya tiene un label visible existente (textarea delivery, accessweb:209-210) y su contenedor `.auth-container` es blanco (`_access.scss:221`) — ocultar los demás sería inconsistente y el requisito m36 pide "label + for correctos", que un label visible demuestra sin discusión. El costo visual es ~20px por campo.
5. El fragmento en otro idioma va en el footer de index.html **y** products.html (footers en espejo entre páginas — misma decisión que el header, documentada en products.html:88-90). Texto corto, `lang="en"`, contenido real.
6. Auditoría ARIA con criterio "menos es más": se eliminan roles redundantes (`role="banner"` ×3, `aria-label` de sección decorativa) y se agregan nombres accesibles solo donde un control de icono no tiene texto. Los 2 roles oficiales de la práctica: `alert` (offline) y `status` (spinner admin). Los 2 aria-labels: los que ya existen (menú, carrito) más los agregados (sidebar, notificaciones, pedidos, sociales).

**Principios no negociables:**
- Accesibilidad primero, pero **sin cambiar la dirección visual** (maximalismo mexicano equilibrado): todos los fixes de color usan pares que ya existen en la paleta o en la marca; las conversiones de heading usan utilidades Bootstrap que preservan la apariencia.
- Ningún cambio de rutas, nombres de archivo ni contrato de entorno.
- Ningún cambio de JS → los 29 tests no pueden romperse por este plan (se corren igual para confirmar).
- `--carni-gold` (beige) NO se toca (sección 2.2).
- **Solo se declaran compuertas de verificación que el entorno puede ejecutar de verdad** (sin Lighthouse en un devcontainer sin Chrome).

---

## 4. Orden de build numerado

Presupuesto total: **60 minutos** (25 edición + 15 verificación + 15 commits/reporte/push). Cada paso indica: archivos, cambio exacto, criterio WCAG y verificación. **El implementador ejecuta en este orden y no saltea pasos.**

### PASO 1 — h1 en `index.html`
- **Archivos:** `index.html`
- **Cambio:** insertar inmediatamente después de `<body class="dark-premium">` (línea 49):
  ```html
  <h1 class="visually-hidden">Cortes premium a tu puerta — Carnicería El Señor de La Misericordia</h1>
  ```
- **Criterio:** WCAG 1.3.1 Info and Relationships; 2.4.6 Headings and Labels.
- **Verificación:** `grep -n "<h1" index.html` → 1 match; WAVE muestra el h1 en estructura.

### PASO 2 — h1 en `products.html`
- **Archivos:** `products.html`
- **Cambio:** insertar después de `<body class="dark-premium">` (línea 70):
  ```html
  <h1 class="visually-hidden">Productos — Carnicería El Señor de La Misericordia</h1>
  ```
- **Criterio:** 1.3.1; 2.4.6.
- **Verificación:** `grep -n "<h1" products.html` → 1 match. Jerarquía h1 → h2 (React, products.tsx:366) → h3 (cards).

### PASO 3 — h1 en `accessweb.html`
- **Archivos:** `accessweb.html`
- **Cambio:** insertar después de `<body class="auth-page dark-premium">` (línea 30):
  ```html
  <h1 class="visually-hidden">Acceso a tu cuenta — Carnicería El Señor de La Misericordia</h1>
  ```
- **Criterio:** 1.3.1; 2.4.6.
- **Verificación:** `grep -n "<h1" accessweb.html` → 1 match. Los `h2.title` (115, 160) quedan debajo del h1.

### PASO 4 — h1 + jerarquía completa en `dashboar.html`
- **Archivos:** `dashboar.html`
- **Cambios** (los tres en el mismo archivo, misma intención: estructura de headings):
  - 4a — Insertar después de `<body class="admin-dashboard dark-premium">` (línea 25):
    ```html
    <h1 class="visually-hidden">Panel de administración — Carnicería El Señor de La Misericordia</h1>
    ```
  - 4b — Línea 31: `<h4 class="mb-0">Panel de Administración</h4>` → `<div class="mb-0 h4">Panel de Administración</div>` (mismo tamaño/weight vía `.h4` de Bootstrap; deja de ser heading).
  - 4c — Líneas 133, 146, 173: `<h6 class="m-0 font-weight-bold text-primary">…</h6>` → `<h3 class="m-0 font-weight-bold text-primary h6">…</h3>` (semántica h3, apariencia h6 vía `.h6`).
  - Resultado: orden **h1(25) → h2(109) → h3(133,146,173)**, sin saltos.
- **Criterio:** 1.3.1; 2.4.6 (heading-order sin saltos: h4→h2→h6 era violación).
- **Verificación:** `grep -n "<h1\|<h2\|<h3\|<h6" dashboar.html`; WAVE panel Structure sobre `http://localhost:3002/dashboar.html` sin errores de heading order; screenshot del sidebar y de una tarjeta antes/después (debe ser idéntico).

### PASO 5 — Labels visibles + for + fix de placeholder en `accessweb.html` y `_access.scss`
- **Archivos:** `accessweb.html`, `css/pages/_access.scss`
- **Cambio HTML** (7 labels: 2 login + 5 registro — el textarea delivery ya tiene label correcto en 209-210):
  - Antes de la línea 118 (`.input-field` con `loginEmail`): `<label class="auth-field-label" for="loginEmail">Correo electrónico</label>`
  - Antes de la línea 122 (`loginPassword`): `<label class="auth-field-label" for="loginPassword">Contraseña</label>`
  - Antes de la línea 164 (`registerName`): `<label class="auth-field-label" for="registerName">Nombre completo</label>`
  - Antes de la línea 169 (`registerEmail`): `<label class="auth-field-label" for="registerEmail">Correo electrónico</label>`
  - Antes de la línea 177 (`registerPhone`): `<label class="auth-field-label" for="registerPhone">Teléfono</label>`
  - Antes de la línea 188 (`registerPassword`): `<label class="auth-field-label" for="registerPassword">Contraseña</label>`
  - Antes de la línea 193 (`registerConfirmPassword`): `<label class="auth-field-label" for="registerConfirmPassword">Confirmar contraseña</label>`
- **Cambio SCSS** en `css/pages/_access.scss` (junto al bloque `.input-field` que empieza en la línea 423):
  ```scss
  .auth-field-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: $color-text;          // #333 sobre .auth-container #fff = 12.63:1 PASS
    margin: 0.75rem 0 0.1rem 0.5rem;

    + .input-field {
      margin-top: 0.15rem;       // compensa el margin de 6px del input-field
    }
  }
  ```
- **Fix de placeholder (contraste, criterio 1.4.3):** en el bloque `input` (líneas 453-466), el `&::placeholder { color: #999; }` (línea 465) da **2.61:1** sobre el fondo `#f5f5f5` del input → cambiar a `color: #595959` (**6.42:1 PASS**). El placeholder es texto real para WCAG: desaparece al escribir pero mientras está visible debe cumplir 4.5:1.
- **Criterio:** WCAG 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value (el placeholder NO es label); 1.4.3 (placeholder).
- **Verificación:** WAVE en `http://localhost:3002/accessweb.html` sin errores de label; clic sobre cada label enfoca su input (7/7); script de contraste con el par `#595959/#f5f5f5` ≥ 4.5.

### PASO 6 — Contraste WCAG (5 fixes de color)
- **Archivos:** `index.html`, `products.html`, `css/pages/_access.scss` (ya en PASO 5), `css/pages/_admin.scss` o `dashboar.html`
- **6a — Botón WhatsApp (index:292), ratio actual 1.98:1 → FAIL:**
  - El inline `style="background: #25d366; color: white;"` **gana sobre la clase** `.contact-direct-card__button--whatsapp` (_home.scss:1154). Operación explícita: reemplazar el inline completo por:
    ```html
    style="background: #25d366; color: #0B3D2E;"
    ```
    (se elimina `color: white`; fondo `#25d366` de marca intacto; texto verde oscuro `#0B3D2E` = **6.15:1 PASS**).
  - Verificación: no solo el script de pares — abrir el botón en devtools y confirmar **estilo computado** `color: rgb(11, 61, 46)` y `background-color: rgb(37, 211, 102)`; screenshot del botón renderizado.
- **6b — Texto de las tarjetas "Quiénes Somos" sobre charcoal (index:218, 222), ratio actual 3.29:1 → FAIL:**
  - `color: #666` → `color: var(--carni-text-muted)` (#A3A3A3, _variables.scss:80) = **7.49:1 PASS**.
  - NOTA: la card "Ubicación" (líneas 229-242) es fondo blanco con `#666` → 5.74:1 PASS, **no tocar**.
- **6c — Copyright del footer de PRODUCTS (products:236), ratio actual 4.35:1 en texto 0.85rem → FAIL:**
  - El footer de products usa fondo inline `#363432` (línea 198); `color: #999` → `color: #ADADAD` = **5.52:1 PASS**.
  - **IMPORTANTE (corrección D1): el copyright de INDEX (index:364) NO se toca** — el footer de index usa `background: var(--carni-charcoal)` (#111111, línea 317) y `#999` sobre `#111111` = **6.63:1 PASS**.
- **6d — Texto "Cargando estadísticas…" del dashboard (dashboar:124), ratio actual 4.35:1 → FAIL:**
  - El body `dark-premium` (`_admin.scss:141`) es `#050505`; Bootstrap `.text-muted` (#6C757D) da 4.35:1 en texto normal. Fix por defecto **en `_admin.scss`** (para no tocar dashboar.html dos veces): agregar la regla `.admin-content .text-muted { color: var(--carni-text-muted); }` junto al bloque `body.dark-premium` (línea 141) = **8.08:1 PASS**. Alternativa inline en dashboar:124 (`style="color: var(--carni-text-muted);"`) si se prefiere no tocar SCSS — ambas válidas, anotar cuál se usó en el reporte.
- **Criterio:** WCAG 1.4.3 Contrast (Minimum): 4.5:1 texto normal; 3:1 componentes/UI.
- **Verificación:** script de contraste (sección 8.3) con los 5 pares corregidos ≥ 4.5; estilo computado del botón WhatsApp; screenshots index (tarjetas + WhatsApp) y products (footer) y dashboar (carga).

### PASO 7 — Fragmento en otro idioma con `lang` propio
- **Archivos:** `index.html`, `products.html` (footers en espejo)
- **Cambio:** en la columna "Empresa"/"Brand" del footer, después del párrafo "Productos cárnicos frescos de la más alta calidad..." (index:323-324, products:204), insertar:
  ```html
  <p lang="en" style="font-size: 0.9rem; color: #ccc; line-height: 1.6;">Premium cuts, delivered to your door — San Luis Potosí, México.</p>
  ```
  El `lang="en"` en el fragmento anula el `lang="es"` del documento SOLO para ese contenido (herencia de idioma).
- **Criterio:** WCAG 3.1.2 Language of Parts.
- **Verificación:** `grep -c 'lang="en"' index.html products.html` → 1 en cada uno; el resto del documento conserva `lang="es"`.

### PASO 8 — Auditoría ARIA: quitar redundancias, nombrar controles sin nombre
- **Archivos:** `index.html`, `products.html`, `accessweb.html`, `dashboar.html`
- **8a — Quitar `role="banner"` redundante** (index:59, products:87, accessweb:37): un `<header>` directo de `<body>` YA es landmark banner implícito. Riesgo cero: ningún test lo referencia (grep verificado).
- **8b — Quitar `aria-label="Presentación"`** de la sección hero (index:162): sección decorativa (video+logo); el h1 del PASO 1 ya titula la página.
- **8c — `aria-label="Close"` → `"Cerrar"`** (index:377, 395): el sitio es 100% español; un label en inglés rompe 3.1.1 para SR.
- **8d — Nombrar el toggle del sidebar (dashboar:67):** `<button class="btn btn-primary" id="sidebarToggle" aria-label="Alternar barra lateral">` + `<i class="bi bi-list" aria-hidden="true"></i>`.
- **8e — Nombrar el botón de notificaciones (dashboar:73-78):** `aria-label="Notificaciones: 3 nuevas"` en el button + `<span class="...badge..." aria-hidden="true">3</span>` (sin `aria-hidden`, el nombre accesible sería literalmente "3").
- **8f — Nombrar los 5 botones de ojo (dashboar:196, 206, 216, 226, 236):** `aria-label="Ver pedido ORD-1001"` (y ORD-1002…1005) + `<i aria-hidden="true">`. Los IDs son datos de muestra del propio HTML.
- **8g — Nombrar los iconos sociales sin texto:** index:326-334, products:206-208 y accessweb:280-282 → `aria-label="Facebook"`, `aria-label="Instagram"`, `aria-label="WhatsApp"` en los `<a href="#">` (con `<i aria-hidden="true">`).
- **Roles que se CONSERVAN como respuesta oficial a la práctica** (2 roles correctos y útiles): `role="alert"` (index:51, products:72, accessweb:31) y `role="status"` (dashboar:121). **Aria-labels oficiales** (2 correctos y útiles, preexistentes): `aria-label="Abrir menú de navegación"` (index:67) y `aria-label="Carrito"` (index:89) — los agregados en 8d-8g son evidencia de auditoría completa.
- **Criterio:** WCAG 4.1.2 Name, Role, Value; 1.3.1; 3.1.1.
- **Verificación:** WAVE en las 4 páginas sin errores de "button name"/"redundant role"; screenshots sin cambios visuales (todo semántico).

### PASO 9 — Verificación integral (después de los PASOS 1-8)
Comandos reales en sección 8. Umbrales: `npm test` 29/29, WAVE limpio (0 errores) en las 4 páginas, script de contraste con los 13 pares en verde, greps de h1/lang/alt correctos, screenshots pre/post.

### PASO 10 — Reporte de verificación real + commits + entrega
1. Generar `docs/ENTREGA_M36_VERIFICACION.md` (template en sección 8.6) con las salidas REALES de los comandos ejecutados.
2. 3 commits (sección 7), `--no-verify`, sin "Co-Authored-By".
3. Push a `practicas-ebac` (requiere aprobación humana, sección 10).

---

## 5. Paleta y contraste verificados

Ratios calculados con la fórmula WCAG `(L1+0.05)/(L2+0.05)` y luminancia relativa `0.2126R + 0.7152G + 0.0722B` (script Python; casos de control: `#333`/`#fff` = 12.63 y `#6C757D`/`#fff` = 4.69, ambos coinciden con valores publicados). Umbrales: 4.5:1 texto normal, 3:1 texto grande (≥24px o ≥18.66px bold) y componentes UI.

### 5.1 Estado actual real — pares que PASAN (13)

| Par (texto sobre fondo) | Ratio | Veredicto | Dónde vive |
|---|---|---|---|
| `#F5F5F5` (`--carni-text`) sobre `#111111` | **17.32** | ✅ PASS | _variables.scss:79 |
| `#E4D1B0` (`--carni-gold`=beige) sobre `#111111` | **12.63** | ✅ PASS | index:186, 210, 216, 269, 277, 290, 303 |
| `#E4D1B0` sobre `#050505` | **13.63** | ✅ PASS | hero/categorías |
| `#A3A3A3` (`--carni-text-muted`) sobre `#111111` | **7.49** | ✅ PASS | _variables.scss:80; index:278 |
| `#CCCCCC` sobre `#363432` | **7.72** | ✅ PASS | products:198-208 |
| `#E4D1B0` sobre `#363432` | **8.29** | ✅ PASS | index:322, products:203 |
| `#363432` sobre `#FFFFFF` | **12.40** | ✅ PASS | index:230 (card Ubicación) |
| `#333333` sobre `#FFFFFF` (label nuevo + fondo auth) | **12.63** | ✅ PASS | _access.scss:221 + PASO 5 |
| `#333333` sobre `#F5F5F5` (texto de input) | **11.59** | ✅ PASS | _access.scss:460 |
| `#666666` sobre `#FFFFFF` | **5.74** | ✅ PASS | index:232 (card Ubicación); _access.scss:506 (field-hint) |
| `#FFFFFF` sobre `#DC2626` (rojo primario) | **4.83** | ✅ PASS | _variables.scss:3; index:279 |
| `#FFFFFF` sobre `#D22222` / `#B71C1C` (gradiente horario) | **5.26 / 6.57** | ✅ PASS | index:248 |
| `#363432` sobre `#F59E0B` (email btn) | **5.77** | ✅ PASS | index:305 |
| `#FFFFFF` sobre `#198754` (bg-success admin) | **4.53** | ✅ PASS | dashboar:194 |
| `#FFFFFF` sobre `#0D6EFD` (bg-primary admin) | **4.50** | ✅ PASS | dashboar:65, 67, 73, 90 |
| `#212529` sobre `#FFC107` (bg-warning) | **9.46** | ✅ PASS | dashboar:204 |
| `#FFFFFF` sobre `#212529` (sidebar bg-dark) | **15.43** | ✅ PASS | dashboar:28 |
| `#212529` sobre `#FFFFFF` (tabla) | **15.43** | ✅ PASS | dashboar:177 |
| `#999999` sobre `#111111` (copyright de INDEX) | **6.63** | ✅ PASS | index:364 — **NO requiere fix** |
| `rgba(255,255,255,.8)`≈`#D7D6D6` sobre `#363432` (auth footer) | **~8.3** | ✅ PASS | _access.scss:915 |
| `rgba(255,255,255,.6)`≈`#B0AEAC` sobre `#363432` (auth bottom) | **~5.7** | ✅ PASS | _access.scss:933 |

### 5.2 Fallas detectadas y fix exacto (5)

| Par (texto sobre fondo) | Ratio actual | Veredicto | Fix propuesto | Ratio final |
|---|---|---|---|---|
| `#FFFFFF` sobre `#25D366` (botón WhatsApp, index:292) | **1.98** | ❌ FAIL | inline: `color: white` → `color: #0B3D2E` (fondo de marca intacto) | **6.15** ✅ |
| `#666666` sobre `#111111` (texto tarjetas charcoal, index:218, 222) | **3.29** | ❌ FAIL texto normal | → `var(--carni-text-muted)` = `#A3A3A3` | **7.49** ✅ |
| `#999999` sobre `#363432` (copyright products:236, 0.85rem) | **4.35** | ❌ FAIL texto pequeño | → `#ADADAD` | **5.52** ✅ |
| `#999999` sobre `#F5F5F5` (placeholder auth, _access.scss:465) | **2.61** | ❌ FAIL | → `#595959` | **6.42** ✅ |
| `#6C757D` sobre `#050505` ("Cargando estadísticas…", dashboar:124) | **4.35** | ❌ FAIL texto normal | → `var(--carni-text-muted)` = `#A3A3A3` | **8.08** ✅ |

Notas de diseño: la paleta general es sólida (20 pares PASS). Los 5 fixes no introducen colores nuevos: reutilizan la paleta existente o el verde oscuro de la marca WhatsApp. El `--carni-gold`=beige se mantiene (12.63:1) — bug de naming documentado, no corregido (sección 2.2). El navbar del dashboard es `#111111` por SCSS (`_admin.scss:37-45`), no el azul Bootstrap: medido contra el par correcto.

---

## 6. Checklist de cumplimiento m36

| Requisito del enunciado | Cambio planificado | Archivo(s) | Verificación |
|---|---|---|---|
| 1. Sitio con 3+ imágenes, 2+ páginas, 1 formulario | **Evaluación: YA CUMPLE.** Sin cambios. 4 páginas, 3+ imágenes por página, 2 formularios reales. | — | Inventario sección 2.1 |
| 2. `lang` activo + texto en otro idioma con su `lang` | `lang="es"` ya activo (4 páginas). Fragmento `lang="en"` en footer de index y products | `index.html`, `products.html` | `grep -c 'lang="en"'` = 1 por archivo; resto del doc sigue `es` |
| 3. HTML semántico + jerarquía de headings | 4× `<h1 class="visually-hidden">`; dashboar: h4→`div.h4`, h6→`h3.h6` (orden h1→h2→h3 sin saltos) | 4 HTML raíz | `grep -c "<h1"` = 1 por archivo; WAVE Structure sin errores de heading order en las 4 |
| 4. `img` con `alt` correctos | **Evaluación: YA CUMPLE.** Compuerta de verificación: grep + lista esperada de alts (PASO 9, sección 8.4) | — | Sección 8.4 |
| 5. Formularios con `label` + `for` | 7 labels visibles con `for` correcto en login/registro (textarea delivery ya lo tenía) | `accessweb.html`, `_access.scss` | WAVE sin errores de label; clic en label enfoca input (7/7); script contraste |
| 6. Contraste WCAG 4.5:1 | 5 fixes: WhatsApp 1.98→6.15, tarjetas 3.29→7.49, products copyright 4.35→5.52, placeholder 2.61→6.42, dashboar muted 4.35→8.08 | `index.html`, `products.html`, `_access.scss`, `_admin.scss`/`dashboar.html` | Script python (sección 8.3): 5 pares corregidos ≥ 4.5 + estilo computado WhatsApp |
| 7. 2 roles ARIA + 2 aria-labels correctos y útiles | Auditar y corregir: conservar `role="alert"` + `role="status"`; conservar y agregar aria-labels (menú, carrito, sidebar, notificaciones, pedidos, sociales); QUITAR 3× `role="banner"` redundante | 4 HTML raíz | WAVE en 4 páginas sin errores de button-name ni redundant-role |
| 8. Commit de GitHub que mencione accesibilidad | 3 commits conventional commits con `a11y:`/`accesibilidad` (sección 7) | — | `git log --oneline -3`; hash citado en la entrega |
| 9. Entrega: link del repo | Push a `practicas-ebac` + URL + reporte de verificación real | — | `git push origin practicas-ebac` exitoso; `docs/ENTREGA_M36_VERIFICACION.md` adjunto |

---

## 7. Plan de commits (compacto)

Convención del repo: conventional commits, un tema por commit, descripciones bilingües (español-inglés), `--no-verify`, sin "Co-Authored-By". **3 commits para una práctica de 60 minutos.** El requisito 8 del enunciado ("commit que mencione el cambio de accesibilidad") lo cumple el commit 1, y el commit 3 adjunta el reporte de verificación real.

| # | Comando | Contenido |
|---|---|---|
| 1 | `git add index.html products.html accessweb.html dashboar.html css/pages/_access.scss && git commit --no-verify -m "feat(a11y): semántica, labels y lang / semantics, labels and lang"` | h1 ×4 + jerarquía dashboar (h4→div, h6→h3) + 7 labels con for + `.auth-field-label` + placeholder `#595959` + fragmento `lang="en"`. Un solo tema: estructura accesible del documento. |
| 2 | `git add index.html products.html css/pages/_admin.scss && git commit --no-verify -m "fix(a11y): contraste WCAG en 5 pares / WCAG contrast on 5 color pairs"` | WhatsApp 6.15, tarjetas 7.49, products copyright 5.52, dashboar muted 8.08 (el placeholder ya entró con el SCSS del commit 1 por co-ubicación). Criterio 1.4.3. |
| 3 | `git add dashboar.html css/pages/_home.scss docs/blueprints/ACCESIBILIDAD_M36_BLUEPRINT.md docs/ENTREGA_M36_VERIFICACION.md && git commit --no-verify -m "refactor(a11y): auditoría ARIA, blueprint y reporte de verificación / ARIA audit, blueprint and verification report"` | Auditoría ARIA 8a-8g + blueprint v2 + **reporte de verificación generado DESPUÉS de implementar** (sección 8.6). Nota: si el fix 8d-8g quedó inline en dashboar.html, entra acá; si `_home.scss` no se tocó (fix inline), se omite del `git add`. |
| 4 | `git push origin practicas-ebac` | Entrega (requiere aprobación, sección 10). |

Regla de oro: **un tema por commit**. Como varios fixes de contraste son inline en archivos que ya entraron en el commit de estructura (index.html, products.html), esos archivos aparecen en los dos commits — es la naturaleza de los edits inline; se documenta en el reporte. Lo que NO se permite: archivos sueltos fuera de tema (check `git status` antes de cada commit) ni re-adds accidentales. El reporte de verificación se genera ANTES del commit 3 (PASO 10), nunca antes de implementar.

---

## 8. Verificación final

Todos los comandos se ejecutan desde la raíz del repo. **Ningún comando npm corre en el host** (regla local AGENTS.md). **El entorno no tiene Chrome ni Lighthouse** (devcontainer `javascript-node:1-20-bookworm`, package.json sin lighthouse) → las compuertas son: `npm test` + WAVE manual + script de contraste + greps + screenshots. Lighthouse queda como nota opcional solo si el operador lo corre desde un Chrome del host.

### 8.1 Servidor de desarrollo
```bash
curl -sI http://localhost:3002/index.html | head -1   # esperar: HTTP/1.1 200
# si no responde:
nohup npm run dev > /tmp/vite.log 2>&1 & echo $! > /tmp/vite.pid
sleep 4 && curl -sI http://localhost:3002/index.html | head -1
```

### 8.2 Tests (29 verdes, dentro de Docker/.devcontainer)
```bash
docker compose -f .devcontainer/docker-compose.yml run --rm dev npm test
# esperar: Tests: 29 passed, 29 total
```

### 8.3 Validación de contraste (script entregado — 13 pares: 5 corregidos + 8 de control PWA/páginas)
```bash
python3 - <<'EOF'
def lum(h):
    h=h.lstrip('#'); r,g,b=(int(h[i:i+2],16)/255 for i in (0,2,4))
    lin=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    r,g,b=map(lin,(r,g,b)); return 0.2126*r+0.7152*g+0.0722*b
def r(a,b):
    x,y=sorted((lum(a),lum(b)),reverse=True); return (x+0.05)/(y+0.05)
pairs = [
    ("#0B3D2E","#25D366","WhatsApp btn (fix)"),
    ("#A3A3A3","#111111","cards charcoal (fix)"),
    ("#ADADAD","#363432","products copyright (fix)"),
    ("#595959","#F5F5F5","auth placeholder (fix)"),
    ("#A3A3A3","#050505","dashboar loading (fix)"),
    # control: pares que DEBEN seguir pasando
    ("#999999","#111111","index copyright (PASS, sin fix)"),
    ("#E4D1B0","#111111","headings beige"),
    ("#F5F5F5","#111111","texto principal"),
    ("#FFFFFF","#DC2626","blanco/rojo primario"),
    ("#FFFFFF","#0D6EFD","bg-primary admin"),
    ("#FFFFFF","#198754","bg-success admin"),
    ("#212529","#FFC107","bg-warning admin"),
    ("#333333","#FFFFFF","label auth sobre fondo blanco"),
]
for fg,bg,label in pairs:
    ratio = r(fg,bg)
    ok = "PASS" if ratio >= 4.5 else "FAIL"
    print(f"{ok} {label:<34} {ratio:>5.2f}")
EOF
```
Salida esperada: los 13 con PASS (valores en sección 5).

### 8.4 Verificación de alts (compuerta del requisito 4) y estructura
```bash
# h1: 1 y solo 1 por página
for f in index products accessweb dashboar; do echo "$f: $(grep -c '<h1' $f.html)"; done
# esperado: 1 en cada una

# lang: el documento en es + 1 fragmento en
echo "index en: $(grep -c 'lang="en"' index.html) products en: $(grep -c 'lang="en"' products.html)"
# esperado: 1 y 1

# alts esperados (lista explícita del requisito 4):
# index:83 logo alt descriptivo; accessweb:250 y 261 alts de panel; dashboar:30 logo admin
# decorativas con alt="" (verificadas en React, sin cambios): BannerEditorial.tsx:37, OrderList.tsx:49, Lupa.tsx:535/558
grep -c 'alt=""' index.html products.html accessweb.html dashboar.html
# esperado: 0 en HTML estático (las alt="" viven en React, no en HTML)
```

### 8.5 WAVE (manual — compuerta principal de accesibilidad)
Subir a wave.webaim.org (o extensión del navegador del HOST) las 4 páginas con el server de 8.1 activo:
1. `http://localhost:3002/index.html`
2. `http://localhost:3002/products.html`
3. `http://localhost:3002/accessweb.html`
4. `http://localhost:3002/dashboar.html`

**Umbral: 0 errores (contraste, label, button-name, redundant-role, heading order)** en las 4. Los "alerts" de dead links (`href="#"`) en iconos sociales se documentan como preexistente y fuera de alcance (aprobado en sección 10). Guardar captura del panel WAVE de cada página en el reporte.

### 8.6 Reporte de verificación real (se genera DESPUÉS de implementar, antes del commit 3)
Crear `docs/ENTREGA_M36_VERIFICACION.md` con las salidas REALES de:
1. `npm test` completo (29 passed) — pegar salida.
2. Script de contraste 8.3 (13 pares) — pegar salida.
3. Greps de 8.4 — pegar salida.
4. Resultado WAVE por página (4 capturas o resumen) — 0 errores c/u.
5. Screenshots pre/post de: index (tarjetas + botón WhatsApp), products (footer), accessweb (form con labels), dashboar (sidebar + tarjeta) — con ruta relativa.
6. `git log --oneline -3` (los 3 commits) y `git status --short` (limpio).
Template: encabezado con fecha/rama/commit base, luego los 6 bloques con su salida cruda. **Este archivo es el artefacto que prueba el requisito 8-9 ante el LMS.**

### 8.7 Cierre
```bash
git log --oneline -3              # los 3 commits a11y
git status --short                # working tree limpio
```

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Layout del form de auth se rompe en móvil** por los labels (~20px por campo) | Media | Medio | Label `display:block` pequeño (0.85rem); form de una columna en móvil. Verificación manual a 375px antes del commit 1. |
| **Cambio visual del botón WhatsApp** (texto blanco → verde oscuro) | Alta (único cambio visible de color) | Bajo | Se conserva el fondo `#25d366` de marca; texto `#0B3D2E`. Screenshot pre/post + estilo computado en devtools (PASO 6a). |
| **Conversión h4→div / h6→h3 en dashboar cambie la apariencia** | Media | Bajo | Se usan utilidades `.h4`/`.h6` de Bootstrap 5.3 (solo font-size/weight): apariencia idéntica. Screenshot del sidebar y de una tarjeta pre/post. |
| **Quitar `role="banner"` percibido como "cambio sin pedir"** | Baja | Bajo | Semántico, cero impacto visual; ningún test lo referencia (grep verificado). Documentado como parte de la auditoría m36. |
| **Especificidad: el inline del botón WhatsApp gana sobre la clase** | Media | Medio | El PASO 6a edita el INLINE explícitamente (no la clase); verificación con estilo computado, no solo script de pares. |
| **Confundir los dos footers (index vs products)** al corregir el copyright | Media | Bajo | D1 documentado: index NO se toca (6.63 PASS), products SÍ (4.35→5.52). El script 8.3 valida cada par en su fondo real. |
| **Romper PWA / service worker** | Muy baja | Alto | No se tocan rutas, manifest ni SW. Verificación honesta (sin promesa de Lighthouse PWA): `git diff --stat` muestra `manifest.json` y `js/modules/utils/service-worker.js` intactos; `curl` a `/index.html` OK y la shell offline sigue cargando (prueba manual opcional). |
| **Tocar `vite.config.js`, `server/routes/buildads.ts` o `netlify.toml`** | Baja | Alto | Explícitamente fuera del plan (sección 2.3). El implementador los ignora. |
| **Fijar el bug de naming `--carni-gold`** (tentación) | Media | Medio | Prohibido en esta práctica: cambiaría el color de 22 usos (headings beige→ámbar). Deuda documentada en el commit 3. |
| **Tests rotos** | Muy baja | Alto | Cero cambios en JS/TSX. `npm test` (8.2) como compuerta antes del commit 3. |
| **Declarar compuertas que el entorno no puede ejecutar** (Lighthouse sin Chrome) | — | Reputacional | Se eliminó Lighthouse de las compuertas (D2): la verificación es WAVE manual + script + `npm test`, ejecutables de verdad. Lighthouse solo nota opcional si se corre desde Chrome del host. |
| **`href="#"` enlaces sociales/dead links** | No aplica (pre-existente) | Bajo | Fuera de alcance de la práctica (placeholder de contenido). Los `aria-label` (8g) resuelven la parte accesible; los alerts de WAVE por dead links se documentan como aceptados. |
| **Datos de muestra en dashboar (ORD-1001…)** | No aplica | Bajo | Los aria-label usan los mismos IDs de muestra del HTML; no se inventa información. |

---

## 10. Pasos que requieren aprobación humana (human-in-the-loop)

Compactado a lo realmente crítico para una práctica de 60 min. El implementador DEBE obtener OK explícito del dueño del repo en UNA sola tanda, antes de empezar:

1. **Cambios visibles en la UI** (única tanda de cambios visuales del plan): labels visibles en accessweb (~20px/campo), texto del botón WhatsApp (blanco→`#0B3D2E`), color del placeholder, color del "Cargando estadísticas…". Alternativa de rechazo a los labels: versión `visually-hidden` (cumple m36 igual, cero cambio visual) — **decisión por defecto del blueprint: visibles**.
2. **Eliminación de `role="banner"` (×3) y `aria-label="Presentación"`** — cambios semánticos que un auditor humano valida (verificado que ningún script/test depende de ellos; cortesía de gobernanza).
3. **El texto exacto del fragmento `lang="en"`** — copy nuevo en el footer: `"Premium cuts, delivered to your door — San Luis Potosí, México."` (aprobar o editar).
4. **`git push origin practicas-ebac`** — publicación de los 3 commits (convención REGLA_ENTREGAS_Y_RAMAS.md).

Los `aria-label` con IDs de muestra (ORD-1001…) se incorporan sin aprobación adicional (replican datos ficticios ya presentes en el HTML). Los PASOS 1-9 no requieren aprobación: son el trabajo planificado.

---

## 11. CLAUDE.md del objetivo (para el implementador)

```markdown
# CLAUDE.md — Implementación Blueprint Accesibilidad m36 (Carni-mvp) v2

Eres un sub-agente sdd-apply ejecutando docs/blueprints/ACCESIBILIDAD_M36_BLUEPRINT.md (v2)
en la rama practicas-ebac. Trabajo PLANIFICADO, no rediseño: no inventes expansiones.
Presupuesto: 60 minutos.

## Reglas duras
- Trabaja SOLO en: index.html, products.html, accessweb.html, dashboar.html,
  css/pages/_access.scss, css/pages/_admin.scss, css/pages/_home.scss (solo si el fix
  del botón WhatsApp se hace por clase — ver PASO 6a; por defecto es inline),
  docs/blueprints/ACCESIBILIDAD_M36_BLUEPRINT.md, docs/ENTREGA_M36_VERIFICACION.md.
- NO toques: vite.config.js, server/routes/buildads.ts, netlify.toml, manifest.json,
  js/**, src/** (alts y headings React YA están correctos), offline.html,
  css/abstracts/_variables.scss (el bug --carni-gold queda documentado, NO se corrige).
- NO corrijas nada fuera de los PASOS 1-8 de la sección 4. Problema nuevo detectado →
  anótalo en la respuesta, no lo arregles.
- NO ejecutes npm en el host: npm test corre dentro de .devcontainer (docker compose).
- NO prometas ni corras Lighthouse: el devcontainer no tiene Chrome. Compuertas = 8.2-8.5.

## Orden de ejecución (obligatorio)
1. PASO 1-4: h1 class="visually-hidden" como PRIMER elemento tras <body> en las 4 páginas.
   En dashboar además: h4→<div class="mb-0 h4"> (línea 31) y h6→<h3 class="m-0 font-weight-bold
   text-primary h6"> (líneas 133, 146, 173). Textos exactos en sección 4.
   Verifica: `grep -c "<h1" <archivo>` = 1; en dashboar el orden es h1→h2→h3.
2. PASO 5: 7 labels visibles con for= + .auth-field-label en _access.scss + placeholder
   #999→#595959 (línea 465). Cada for apunta a un id existente. Código en sección 4.
3. PASO 6: 5 fixes de contraste EXACTOS:
   - WhatsApp index:292: reemplaza TODO el inline por `style="background: #25d366; color: #0B3D2E;"`.
   - index:218,222: #666 → var(--carni-text-muted).
   - products:236: #999 → #ADADAD. (INDEX:364 NO SE TOCA — 6.63 PASS, ver D1.)
   - dashboar:124: fix por defecto en _admin.scss — agregar
     `.admin-content .text-muted { color: var(--carni-text-muted); }` junto a
     body.dark-premium (línea 141); alternativa inline documentada en PASO 6d.
   Usa el script de la sección 8.3: 13 pares, todos PASS.
4. PASO 7: fragmento lang="en" en footer de index.html y products.html (texto exacto en
   sección 4). No dupliques el fragmento.
5. PASO 8: auditoría ARIA 8a-8g en orden. Quita role="banner" SOLO de los 3 header
   señalados; "Close"→"Cerrar" (2 sitios); aria-labels en sidebarToggle, notificaciones
   (badge aria-hidden), 5 botones ojo, sociales (3 páginas, con <i aria-hidden="true">).
6. PASO 9: verificación completa (sección 8): npm test 29/29; script de contraste 13/13;
   greps (1 h1 por página, 1 lang="en" por footer, 0 alt="" en HTML estático); WAVE 0
   errores en las 4 páginas; screenshots pre/post.
7. PASO 10: SI y SOLO SI recibiste aprobación humana (sección 10):
   a. Genera docs/ENTREGA_M36_VERIFICACION.md con las salidas reales (template 8.6).
   b. 3 commits de la sección 7 con --no-verify, mensajes bilingües, sin Co-Authored-By,
      sin emojis, un archivo en un solo commit.
   c. git push origin practicas-ebac.

## Verificación mínima antes de reportar
- `git status --short` con SOLO los archivos de la sección 2.3 modificados.
- npm test en devcontainer: 29 passed.
- Script 8.3: 13/13 PASS (valores en sección 5).
- `grep -c "<h1"` = 1 por página; lang="en" = 1 en index y products; alt="" = 0 en HTML.
- WAVE: 0 errores en las 4 páginas.
- Screenshots antes/después de index (tarjetas, WhatsApp), products (footer),
  accessweb (form), dashboar (sidebar + tarjeta): sin regresiones salvo labels,
  texto del botón WhatsApp, placeholder y "Cargando estadísticas…".
- Estilo computado del botón WhatsApp: color rgb(11,61,46), background rgb(37,211,102).

## Si algo falla
- Dev server caído: nohup npm run dev (sección 8.1), leer /tmp/vite.log antes de reintentar.
- Test roto: DETENTE. Reporta; no "arregles" tests tocando lógica.
- Duda sobre un selector SCSS: grepealo antes de editar; si una clase no existe, deja el
  fix inline en el HTML y anótalo.
- WAVE devuelve alerts por href="#": documentar como preexistente aceptado, NO arreglar.
```