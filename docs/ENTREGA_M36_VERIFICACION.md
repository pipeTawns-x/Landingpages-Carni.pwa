# Entrega m36 — Accesibilidad (Carni-mvp)

- **Fecha:** 2026-09-10
- **Rama:** `practicas-ebac`
- **Commit base:** `333875ac refactor(carrito): un solo escritor sobre la llave del pedido`
- **Blueprint ejecutado:** `docs/blueprints/ACCESIBILIDAD_M36_BLUEPRINT.md` (v2)
- **Contrato:** sección 11 del blueprint (implementador) + reglas locales `AGENTS.md`

---

## 1. `npm test` — compuerta 8.2 (29 verdes, dentro de Docker/.devcontainer)

Comando: `docker compose -f .devcontainer/docker-compose.yml run --rm --no-deps app sh -lc 'cd /workspace && npm test'`

```
> carni-node-practice@1.0.0 test
> NODE_OPTIONS=--experimental-vm-modules jest

PASS node tests/functions.test.js
PASS react src/components/OrderList/__tests__/OrderList.test.tsx
PASS react src/components/ProductCard/__tests__/ProductCard.test.tsx
PASS react src/components/CartPanel/__tests__/CartPanel.test.tsx

Test Suites: 4 passed, 4 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        3.368 s
Ran all test suites in 2 projects.
```

**Nota de infraestructura (corregido, causa preexistente a m36):** la compuerta exigía 29 verdes y el entorno no los daba por dos fallas de toolchain, ninguna relacionada con HTML/SCSS de m36:

1. **Jest 30 + resolver nativo unrs (issue upstream [jestjs/jest#15724](https://github.com/jestjs/jest/issues/15724)):** el devcontainer es Linux/arm64 y `node_modules` solo tenía el binding de macOS (`@unrs/resolver-binding-darwin-arm64`); faltaba el binding de la plataforma del contenedor. Fix: se agregó `@unrs/resolver-binding-linux-arm64-gnu@^1.12.2` como devDependency (recomendación del issue upstream). Sin esto, `npm test` abortaba con `Module .../jest-circus/build/runner.js in the testRunner option was not found`.
2. **Jest 30 + suite m33 (ESM en paquete CommonJS):** `CjsParseError: Cannot use import statement outside a module` en `tests/functions.test.js`. Fix: el proyecto `node` de `jest.config.js` usa ahora el mismo transform Babel (`transformarTsx`, preset-env) que ya usa el proyecto `react`; compila el ESM a require.

Ambos fixes van en su propio commit de tooling (sección 6), documentados para que un `npm ci` en cualquier entorno (incluido el de un corrector) produzca los 29 verdes.

---

## 2. Script de contraste — compuerta 8.3 (13 pares: 5 corregidos + 8 de control)

Script íntegro de la sección 8.3 del blueprint (fórmula WCAG `(L1+0.05)/(L2+0.05)`), ejecutado en la raíz:

```
PASS WhatsApp btn (fix)                  6.15
PASS cards charcoal (fix)                7.49
PASS products copyright (fix)            5.52
PASS auth placeholder (fix)              6.42
PASS dashboar loading (fix)              8.08
PASS index copyright (PASS, sin fix)     6.63
PASS headings beige                     12.63
PASS texto principal                    17.32
PASS blanco/rojo primario                4.83
PASS bg-primary admin                    4.50
PASS bg-success admin                    4.53
PASS bg-warning admin                    9.46
PASS label auth sobre fondo blanco      12.63
```

**13/13 PASS.** Pares suplementarios de las desviaciones documentadas (la página de auth es DARK en vivo, no blanca como asumía el blueprint):

```
PASS label auth REAL (var(--carni-text) sobre charcoal)   17.32
PASS placeholder REAL en dark (--carni-text-muted overlay)  7.49
```

Verificación runtime adicional (probe con `getComputedStyle` sobre `localhost:3002`, misma origin): label auth `rgb(245,245,245)` (17.32:1), placeholder auth `rgb(163,163,163)` (8.08:1), botón WhatsApp `rgb(11,61,46)` (#0B3D2E, 6.15:1), cards `rgb(163,163,163)` (7.49:1), copyright products `rgb(173,173,173)` (#ADADAD, 5.52:1), fragmento `lang="en"` `rgb(204,204,204)` (9.85:1).

---

## 3. Greps de estructura y alts — compuerta 8.4

```
index: 1
products: 1
accessweb: 1
dashboar: 1
---
index en: 1 | products en: 1
---
alt vacias estático: index=0 products=0 accessweb=0 dashboar=0
---
role=banner restantes: 0
aria-label Close restantes: 0
```

- **h1:** 1 y solo 1 por página (4/4), siempre como primer elemento tras `<body>` con `class="visually-hidden"`.
- **lang:** documento en `es` (4 páginas) + 1 fragmento `lang="en"` en index y products.
- **alt descriptivos (lista explícita del requisito 4, líneas post-edición):**
  - `index.html:84` — `alt="Carnicería El Señor de La Misericordia"` (logo principal)
  - `products.html:110` — `alt="Carnicería El Señor de La Misericordia"`
  - `accessweb.html:258` — `alt="Carnicero dando la bienvenida"` (login)
  - `accessweb.html:269` — `alt="Carnicero cortando carne premium"` (registro)
  - `dashboar.html:31` — `alt="Admin Logo"`
- **alt vacías:** 0 en HTML estático (las decorativas con `alt=""` viven en React y no se tocaron: `BannerEditorial.tsx:37`, `OrderList.tsx:49`, `Lupa.tsx:535/558`).
- **Labels:** 7 con `class="auth-field-label"` + `for` en `accessweb.html` (líneas 118, 124, 167, 173, 182, 194, 200).

---

## 4. WAVE — compuerta 8.5 (manual)

`wave.webaim.org` no alcanza `localhost`. Configurado como **paso manual con la extensión WAVE del navegador del host**, umbral **0 errores** (contraste, label, button-name, redundant-role, heading order) en las 4 páginas del server local activo (`curl -sI http://localhost:3002/index.html` → `HTTP/1.1 200 OK`):

1. `http://localhost:3002/index.html`
2. `http://localhost:3002/products.html`
3. `http://localhost:3002/accessweb.html`
4. `http://localhost:3002/dashboar.html`

Hasta la corrida manual, la evidencia DOM-level que respalda cada categoría:

| Categoría WAVE | Evidencia en el repo |
|---|---|
| Contrast | 13/13 pares del script (sección 2) + probe runtime |
| Label | 7 labels visibles con `for`; clic en label enfoca su input |
| Button-name | 16 controles sin nombre nombrados con `aria-label`: 3 sociales index + 3 productos + 3 accessweb + sidebarToggle + notificationsDropdown + 5 botones "Ver pedido ORD-100x" (dashboar); iconos decorativos con `<i aria-hidden="true">` |
| Redundant-role | 3× `role="banner"` eliminadas; `role="alert"` y `role="status"` conservados |
| Heading order | h1 único por página; dashboar h1→h2→h3 sin saltos (`h4`→`div.h4`, `h6`→`h3.h6`) |

Los "alerts" de dead links (`href="#"`) en iconos sociales son preexistentes y quedan documentados como aceptados (fuera de alcance; los `aria-label` resuelven la parte accesible).

---

## 5. Screenshots pre/post

`docs/screenshots-m36/` (capturados con Brave headless en el host sobre `localhost:3002`; el dashboard con `--disable-javascript` porque `admin-auth.js` redirige a `accessweb.html?admin=true` sin sesión — verificación estática honesta):

| Vista | Pre | Post |
|---|---|---|
| index — botón WhatsApp | `docs/screenshots-m36/index-whatsapp-pre.png` | `docs/screenshots-m36/index-whatsapp-post.png` |
| index — tarjetas | `docs/screenshots-m36/index-tarjetas-pre.png` | `docs/screenshots-m36/index-tarjetas-post.png` |
| products — footer | `docs/screenshots-m36/products-footer-pre.png` | `docs/screenshots-m36/products-footer-post.png` |
| accessweb — form con labels | `docs/screenshots-m36/accessweb-form-pre.png` | `docs/screenshots-m36/accessweb-form-post.png` |
| dashboar — sidebar + tarjeta | `docs/screenshots-m36/dashboar-sidebar-pre.png` | `docs/screenshots-m36/dashboar-sidebar-post.png` |

---

## 6. Commits y estado final

3 commits conventional commits (bilingües, `--no-verify`, sin "Co-Authored-By") según sección 7 del blueprint, adaptados a la realidad de los edits inline (ver desviaciones):

1. `feat(a11y): semántica, labels, lang, ARIA y contraste inline / semantics, labels, lang, ARIA and inline contrast` — `index.html`, `products.html`, `accessweb.html`, `dashboar.html`, `css/pages/_access.scss`, `css/styles.css`
2. `build(test): compuerta npm test en devcontainer / test gate fix in devcontainer` — `package.json`, `package-lock.json`, `jest.config.js`
3. `docs(a11y): blueprint, reporte de verificación y screenshots / blueprint, verification report and screenshots` — `docs/blueprints/ACCESIBILIDAD_M36_BLUEPRINT.md`, `docs/ENTREGA_M36_VERIFICACION.md`, `docs/screenshots-m36/`

`git log --oneline -3` y `git status --short` post-push: se verifican en la respuesta de entrega (el commit 3, que contiene este reporte, no puede citar su propio hash).

---

## Desviaciones documentadas (vs blueprint v2)

1. **Página auth DARK en vivo** (contenedor `rgb(17,17,17)` = #111 charcoal, input `#050505`), no blanca como asumía el blueprint. Los labels usan `var(--carni-text)` `#F5F5F5` = **17.32:1** sobre charcoal (el `#333` del blueprint daría 1.19:1 FAIL en ese fondo). Se agregó `display: block` a `.auth-field-label` para que el margin del blueprint funcione en un elemento de bloque.
2. **Placeholder auth:** el fix base `#999` → `#595959` se aplicó (endurece la variante clara). En la página real el dark override (`_dark-mode.scss:126-128`, `--carni-text-muted` = `#A3A3A3`) ya entregaba **8.08:1**.
3. **"Cargando estadísticas…" (dashboar):** la regla propuesta en `_admin.scss` quedó **inerte** (`.dark-premium .text-muted` con `!important` gana por especificidad (0,2,0) y orden de import); el estado actual ya pasa a **8.08:1**. `css/pages/_admin.scss` **no se modificó**.
4. **Commits:** los fixes de contraste son inline dentro de los mismos archivos de estructura (índice/products), por lo que separarlos por archivo requeriría `git add -p` (interactivo, prohibido por la herramienta). El commit 1 agrupa la práctica a11y completa y el fix de toolchain de tests va en su propio commit temático (2).
5. **WAVE:** compuerta configurada como manual con extensión del host; evidencia DOM-level documentada en la sección 4 como respaldo verificado.

## Hallazgos preexistentes (anotados, NO corregidos — contrato sección 11)

- **accessweb en vivo (dark):** `.checkbox-label`, `.field-hint`, `.form-subtitle` = `#666` sobre charcoal #111 = **3.29:1** FAIL texto normal. Fuera de los 5 fixes del blueprint; no se arregla lo que el plan no pide.
- **Bug de naming `--carni-gold`** (es beige, no dorado): deuda documentada, no corregida (cambiaría 22 usos).
- **Dead links `href="#"`** en iconos sociales: preexistente, aceptado en sección 10 del blueprint.