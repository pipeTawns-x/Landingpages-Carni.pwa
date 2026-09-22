# Improvement loop — every view, one run

Companion to `spec-rediseno-v1.md` (v1.4): that file holds the global rules, the business facts,
the design-ahead list and the canvas layout. This file is the **run order and the criteria for the whole
site**, designed to be executed in ONE continuous run with a single human stop. The verifier reports by ID.

Everything the design agent needs is in this repository, branch `pruebas`:

| What | Path |
|---|---|
| 59 current captures (desktop 1796 · mobile 390) | `docs/design/capturas-actuales/` |
| Desktop/mobile board of those captures | `docs/design/capturas-actuales/tablero.html` |
| OCR text of every capture | `docs/design/capturas-actuales/ocr/` |
| Global rules, business facts, design-ahead | `docs/design/spec-rediseno-v1.md` |
| References per surface | `docs/design/referencias/` |

**What this round is NOT:** a redrawing of the current site. Each frame must be visibly better than
the capture next to it, and the reason must be nameable (contrast, hierarchy, rhythm, one affordance
instead of two, mobile reachability).

## 0. How this run works

**Direction, decided — do not re-open it.** "Mostrador digital": restrained everywhere, warm in two places only (landing hero and
empty states). Near-zero motion, no scroll-driven video, no command palette. It is the only candidate that survives mid-range Android
over 4G and ports to server-rendered Django without JavaScript (`referencias/direcciones.md`, Direction 3). From Direction 1 it inherits
one thing: the crop-variation rule for repeated photography (G0.7).

**Type, decided — no specimen page.** Display: **Fraunces** (variable, optical size). UI, labels and every number: **Geist** (tabular
figures, so no third family). Two families, no exceptions.

**Component base:** FlyonUI (MIT, semantic Tailwind classes) is the base, because it is the only researched option that works in
React and in plain Django templates with one Tailwind. Berry Django React and Tailwindadmin are React-only despite their names
(`referencias/catalogo-recursos.md`).

**`direccion-visual.md` is binding**: tokens, type scale, character budgets for Spanish, component specs, motion budget and the ten
craft gates. Read it once before drawing and follow its numbers.

1. **Read per group, not everything up front.** `direccion-visual.md` at the start; then, per group, only the captures and spec
   sections that group names. Do not open the 59 captures or the whole OCR folder before drawing.
2. **Attach the design tool's own skills before building.** `Create design system` for G0, `Frontend design` for every screen group.
   They do not load by themselves.
3. **Seven blocks, delivered two frames at a time.** The run never stops for a human, but it saves as it goes: a page is
   never left half drawn.
   - **Block 1 — foundations and the landing, with every global piece:** G0 tokens, card and controls → G3 header,
     hamburger and side menu → G1 lupa → G2 carrito → G5 landing complete. These four pieces are global: they are drawn
     once here and reused unchanged everywhere else.
   - **Block 2 — web commerce:** G6 catálogo → G7 ficha de producto (configuración del corte).
   - **Block 3 — accessweb and buying:** G8 login, registro, recuperación con código y offline → G9 checkout, confirmación
     y estado del pedido.
   - **Block 4 — admin panel:** G4 dashboard → G10 productos, pedidos, clientes, ajustes y las cinco pantallas Django.
   - **Block 5 — customer profile, the whole view:** G9.3 the profile shell → G12 recetario y nutrición → G13 Track Score,
     descuentos y afiliados. Recipes, nutrition widgets, level and affiliate link all live INSIDE this profile: it is one
     coherent web for the ordinary customer, not four loose modules.
   - **Block 6 — the plus modules, design only:** G14 BuildAds and ProductAds.
   - **Block 7 — consistency:** G11.
   **Rhythm inside every block: one view at a time, and a view means its two frames — escritorio 1440 and móvil 390.**
   Finish the pair, write its row in the report table, then start the next pair. At the end of each block write a
   `Reporte bloque N` frame with that block's table and open items, then continue. If the run is interrupted, everything
   already reported must still stand on its own.
4. **Self-review inside each group:** build, screenshot your own frames, check every criterion, fix what fails, write the rows.
   **Two fix rounds maximum; a third failure is not retried** — mark it FAIL with one line saying why and move on. A silent skip is
   worse than a declared failure.
5. **A frame that is not clearly better than its capture is a FAIL**, even if it satisfies the letter of the criterion. Every row
   carries one line naming the improvement: contrast, hierarchy, rhythm, one affordance instead of two, reachability, density.
6. **Never redraw an approved group.** If a later group needs a change in an earlier component, note it in the report and keep going.
7. **Final report** at the end: `ID | criterion | PASS/FAIL | evidence` for every group, the score per block, and the open items.

## 1. Canvas layout

One page per group, named `G<n> — <name>`. One row per criterion, three columns:

| Antes (uploaded capture) | Escritorio 1440 | Móvil 390 |
|---|---|---|

Every frame labelled `surface · state · width`. Motion as a 3-frame state strip with its annotation (spec §7).
At the end of the page: the self-review table `ID | criterion | PASS/FAIL | evidence` and the score.

## 2. Captures per group (all inside `docs/design/capturas-actuales/`)

| Criterion group | Files |
|---|---|
| Search overlay | `03-index-search-overlay-desktop.png`, `M-index-search-open-390.png` |
| Cart | `04-index-cart-drawer-desktop.png`, `M-index-cart-open-390.png` |
| Header / hamburger | `02-index-menu-drawer-desktop.png`, `37-index-menu-open-390.png`, `01-index-hero-desktop.png` |
| Dashboard | `26-admin-dashboard-top-desktop.png`, `28-admin-dashboard-kpis-charts-desktop.png`, `29-admin-dashboard-orders-table-desktop.png`, `31-admin-products-desktop.png`, `33-admin-orders-desktop.png` |

| Landing | `01`, `06`, `07`, `08`, `09`, `10`, `36-index-full-390-part01..03`, `D-index-full-1440.png` |
| Catalog | `11`, `12`, `13`, `14`, `15`, `38-products-full-390-part01..10`, `D-products-full-1440.png` |
| Product page | `17`, `18`, `19`, `20`, `21`, `22`, `D-product-detail-full-1440.png`, `M-product-detail-full-390.png` |
| Access + offline | `05`, `23`, `24`, `25`, `39-accessweb-full-390.png`, `D-accessweb-full-1440.png`, `40`, `41` |
| Admin (rest) | `27`, `30`, `32`, `34`, `35` |

If the tool cannot read the repository folder, Eduardo drags the whole `capturas-actuales` folder into the project
**once**, at the start of the run. There are no further uploads.

## 2.1 Prior art in `~/Desktop/img` (catalogued in `referencias/capturas-previas.md`)

Eduardo's own folder. Look at these five first, in this order:

| File | Why |
|---|---|
| `stitch-landing/paletastitch.png` | **Stitch mockups are old and outdated — use them only for the token sheet and for layout hints, never as the look to reproduce.** The literal token sheet: #DC2626, #E4D1B0, #F59E0B, #050505. Colors confirm ours. **Its type (Plus Jakarta Sans + Inter) does not**: the decided pairing is Fraunces + Geist. |
| `Captura … 2026-04-16 a la(s) 2.42.28 p.m..png` | A Carni-branded dashboard already built in Figma Make, with real KPIs, charts, table and a written component spec. Closest thing to a finished admin. |
| `mobileauthstitch.png` | The most finished mobile flow: mascot, "Datos esenciales" vs optional delivery data, two-tone states. Feed it into G8. |
| `stitch-paneles/checkoutstitch.png` | Checkout as a drawer: delivery/pickup tabs, steppers, totals. Feed it into G9, but our payment is Stripe, not the WhatsApp CTA it shows. |
| `Captura … 2026-06-10 a la(s) 1.46.18 p.m..png` | Today's real shipped home page: the baseline to beat. |

Also usable: `stitch-paneles/dashboardstitch.png` (sidebar + colour-coded order list), `panelinventariostitch.png` (traceability timeline for premium cuts),
`stitch-landing/catalogomaestrostitch.png` (bento mixing products, content and promo), `landingpagestitch.png` (loyalty banner as a site-wide unit),
the unnamed "Club Misericordia" tier card (feed it into G13), and one SaleAds screen with tiered pricing (Principiante/Regular/Premium/VIP) that shows how a level changes the visible price.

**Two warnings from that folder:**
1. `vistas-productos/`, `vistas-compras/` and the four root `vista*.png` files are **not Carni and not SaleAds**: they are an unrelated light-themed hardware-store demo. Use them for CRUD patterns only (inline status dropdown per row, order-detail modal, quick-entry-above-history table, trust badges, add-to-cart toast) and never for looks.
2. Several of these references contradict the decided direction: hover microanimations, glow shadows, gradient CTAs and a catalog countdown timer. Take the structure, drop the effects. The BuildAds ads panel is a good blueprint but **BuildAds stays frozen** — do not design it in this run.

## 3. Criteria

### G0 — Foundations (the only stop)

- **G0.1** Three type options, each applied to **the same real screen already improved** — the catalog header plus a row of
  three product cards, desktop and mobile — so the choice is made on a working design, not on a specimen sheet:
  A) Fraunces + Geist · B) Instrument Serif + Instrument Sans · C) Bricolage Grotesque + Geist.
  Add your own one-line verdict per option and a recommendation. **Stop here and wait for the letter.**
- **G0.2** Token sheet: colors with contrast ratios, type scale for 390 and 1440, 4 px spacing, radii, dark elevation.
- **G0.3** Unified product card with a **unit-aware price block** (`/ kg` + lb secondary, `/ pieza`, `/ paquete` — spec §5). Variants: default, hover, pressed, out of stock, compact, offer (marked DESIGN-AHEAD).
- **G0.4** Controls: pill buttons (primary red, secondary outline, ghost, icon), input (single tone, label above, red focus ring, error, disabled), chips, qty stepper.
- **G0.5** Copy fixed: "Contraseña", "Correo electrónico" with accents.
- **G0.6** `DESIGN.md` content (google-labs-code format) plus the Tailwind v4 `@theme` block, written as a frame on the canvas so it can be copied into the repo.
- **G0.7** **Photography reality:** several products share the same category photo today (e.g. Bistec Adobado, Chorizo Rojo, Chorizo Verde, Pollo Marinado). The card must still read well when three neighbours share one image — differentiate by name, category label and cut detail, not by the photo alone.

### G1 — Search overlay ("lupa")

Today (verified 2026-09-21): white overlay on a black site; the page header with its own search pill stays
visible on top of it, so **two search affordances show at once**; suggestion images are broken (code bug P-41);
the chat bubble floats above the overlay (`.chat-widget` z-index 3000 vs `.lupa` 1080).

- **G1.1** The overlay is dark: one surface level above the page, never white. Mobile full screen, desktop a top sheet with a max width and the page dimmed underneath.
- **G1.2** **One search affordance at a time.** While the overlay is open, the header's search control is not visible (the overlay covers it or replaces it) and the floating chat bubble is hidden. Show this as a two-frame comparison: header closed / overlay open.
- **G1.3** One centered pill field, no icon inside it, focus shown on the pill itself (no inner rectangle). The close control is a single X at the top right, ≥ 44 px.
- **G1.4** Empty state, in this order: trending terms as plain text links; recent searches with a "Borrar" action; then suggestions under a section title ("Lo nuevo"), as a grid of the compact card from Phase 0, with real meat photography. The page behind is dimmed while the field is active (Baymard).
- **G1.5** Suggestion grid: 2 columns at 390, 4–6 at 1440, capped at **4–8 suggestions on mobile and 10 on desktop** (Baymard). Each card shows its correct unit (`/ kg`, `/ pieza`, `/ paquete`, spec §5) — never a kg+lb pair by default. Prices use tabular figures.
- **G1.6** Typing state: live results with a result count, and the **predicted part of the term in bold — not what the customer typed** (Baymard).
- **G1.6b** No-results state: no source documents a standard for this, so it is our decision — one short line plus the trending terms and the category chips, so the customer always has a next step. Mark the frame `DECISIÓN NUESTRA`.
- **G1.7** Opening motion as a state strip: the overlay enters, the page behind dims. Annotate duration, easing and the reduced-motion fallback.

### G2 — Cart

Today: square panel, old-looking, empty state with a dim red disabled button; nothing tells the customer about the delivery minimum.

- **G2.1** Mobile: bottom sheet, rounded top corners ≥ 24 px, drag handle, max 90 % height, primary action always reachable with the thumb. Desktop: right drawer ~420 px with rounded left corners.
- **G2.2** Line item: photo, name, chosen mode and amount ("Por peso · 1 kg"), qty stepper, line price, remove. Long names wrap to two lines maximum.
- **G2.3** Delivery minimum (real rule, spec §5): "Te faltan $X para entrega a domicilio" with a progress line toward the value read from `store_settings`, plus the note "Recoger en tienda: sin mínimo". Reached state in green.
- **G2.4** Empty state that is not a dead end: one line of copy plus a CTA to the catalog, and two or three suggested cuts using the compact card.
- **G2.5** Summary: subtotal, total, and a primary CTA "Continuar con el pedido". The disabled look appears only when the cart is empty. Prices and quantities use tabular figures so columns line up.
- **G2.6** Opening motion as a state strip, with its annotation.
- **G2.7** Adding a product is a **silent success**: the sheet opens and the counter increases. No congratulation toast.

### G3 — Header and hamburger

Today: the active item in the mobile drawer is amber, not red; the drawer looks static; the header is one more bar.

- **G3.1** Mobile drawer from the left, full height, rounded inner edge, close ≥ 44 px, categories as Phase 0 chips, staggered item entrance as a state strip.
- **G3.2** Active item marked with **color, weight or an underline — never a filled pill** (UXPin), in red, never amber, and the same treatment on desktop.
- **G3.3** Desktop ≥ 1024: primary links inline in a single header bar; the drawer keeps only secondary content. Same header on every public page, including a scrolled state.
- **G3.4** The header's three controls (menu, search, cart) are one consistent set: same icon family, same hit area, same active and focus treatment.

### G4 — Admin dashboard

References for this block, already researched: the Facebook reels catalogued in the spec appendix (admin shell in red and white,
sidebar tooltips, tabbed product edit, inline status per row, price guard, confirm dialog), the "Dashboard-Redesign-for-Carni-MVP"
Figma Make screens in `~/Desktop/img`, the hardware-store demo in that same folder — **it is a commerce admin like ours and its
patterns are meant to be adapted to the butcher shop**, not dismissed — and the OMS/Kanban material Eduardo gathered
(order board with drag-and-drop, status changed from the shop floor, real-time updates).

Today: white Bootstrap tables inside a dark page, decorative "ribbons" ("Dashboard Matrix", "Agencia IA 360°") that carry no data, charts in a different visual language, unusable at 390 px.

- **G4.1** One dark surface system: no white tables, no Bootstrap defaults. Tables use the Phase 0 tokens (borders, not shadows; 4 px grid).
- **G4.2** The decorative ribbons are gone or replaced by a summary that states real numbers.
- **G4.3** KPI row: sales, orders, average ticket, low stock. Each card follows the same formula — label, value, delta, period, optional sparkline — with **borders instead of shadows**. No card without meaning.
- **G4.4** Recent orders table with the six real statuses (Pendiente, Confirmado, Preparando, Listo, Entregado, Cancelado). Six statuses sit at the ceiling of what color alone can separate (AdminLTE: 5–7 max, never hue-only), so **every chip pairs an icon with its label**; color is secondary: green for Entregado, red only for Cancelado, neutral for the rest. Row actions visible without hovering on touch.
- **G4.5** Sales chart in the same visual language as the cards (same grid, same type scale, no third-party default look).
- **G4.6** At 390 px: the sidebar becomes a drawer and every table becomes **stacked cards** (card-transform strategy), not a horizontal scroll. Secondary columns are dropped by priority, and the dropped ones appear inside the card.
- **G4.7** Sidebar: collapsed state with icon tooltips, "Salir" visually separated from navigation.

### G5 — Landing (`index.html`)

- **G5.1** Hero keeps the video (poster frame), headline in the display face, one primary CTA, scrim for legibility.
- **G5.2** Category bento **stays a bento at 390**: 2 columns, one 2×2 hero tile, equal row heights, names on a solid scrim, no truncated text.
- **G5.3** Featured product and "Lo que se lleva la gente" use the unified card.
- **G5.4** Testimonials: two rows moving in opposite directions (state strip), static under reduced motion; card with initials, name, gold stars, quote.
- **G5.5** FAQ accordion, one item open, 5 placeholder questions (entrega, cortes, pago, pedidos, recoger).
- **G5.6** Offers section built from the offer card variant (DESIGN-AHEAD note).
- **G5.7** About, hours, contact and one footer reused by every public page.

### G6 — Catalog (`products.html`)

- **G6.1** Scroll storyboard: opening video (cutting meat, poster) → catalog header + chips → card grid → second video edit → reviews/descriptions → footer. Annotate posters and reduced motion.
- **G6.2** Filter chips sticky under the header in a scrolled frame; active chip red.
- **G6.3** The grid survives repeated photography (see G0.7): rhythm, spacing and labels carry the difference.

### G7 — Product page

- **G7.1** Gallery of three rounded images, less linear than today (desktop one large + two stacked; mobile carousel with dots).
- **G7.2** Mode selector Por peso / Por precio / Por pieza as a segmented control ("Por pieza" carries its DESIGN-AHEAD note), thickness slider restyled.
- **G7.3** Stepper at max stock with "+" disabled and the hint "Stock disponible: X".
- **G7.4** Breadcrumb, and a mobile sticky bar "Agregar al pedido" with the live total.
- **G7.5** Recommendations with the unified card; loading skeleton that matches the final layout.

### G8 — Access (`accessweb.html`) and offline

- **G8.1** Login and register keep the sliding-panel idea (state strip), Phase 0 inputs and buttons, real Google and Facebook icons.
- **G8.2** Frames for: input in error state with its inline message, error toast, submit in loading state.
- **G8.3** Password recovery with a 6-digit code: request → "Revisa tu correo" → six code boxes with resend countdown → new password with strength meter → success, plus a branded email mock.
- **G8.4** Offline page as a real view: icon, one line of copy, the two actions ("Reintentar", "Ver mi pedido"), what stays visible
  without connection, and the same page at 390.

### G9 — New views

- **G9.1** Checkout: delivery toggle (A domicilio / Recoger en tienda), minimum message, order summary, customer data, address modal, card payment, primary CTA, success state (order number carries its DESIGN-AHEAD note).
- **G9.2** Customer order status: Pendiente → Confirmado → Preparando → Listo → Entregado, plus Cancelado.
- **G9.3** **Customer profile — this view does not exist in the product yet and is designed anyway.** Shell with sidebar (Mi cuenta,
  Mis pedidos, Direcciones, Favoritos), orders list using the G4.4 chips, an empty state per section, and the same shell at 390 as a
  drawer. Only data that exists: orders, `orders.delivery_address`, `favorites`. Anything else carries a DESIGN-AHEAD note.

### G10 — Admin, the rest, including the Django panel

The backend session is building the Django inventory panel (M13) and will use these tokens; its templates have not been written yet.

- **G10.1** Products: list with search and filters, edit in tabs (Info, Imágenes, Precios, Oferta), invalid price state, delete confirmation dialog.
- **G10.1b** Categories and sections are **created, renamed, reordered and removed from the admin**. The shop is not only meat: fruit and
  vegetables, spices and chiles, merch and prepared food (enchiladas, flautas, litre tubs) all live as categories. No screen may hardcode
  the current nine categories, and the catalog must look right with four categories or with twenty.
- **G10.2** Orders: the six statuses as a board and as a table, with the icon+label chips from G4.4.
- **G10.3** Customers: KPI row (clientes activos, nuevos esta semana, afiliados), directory table with search, and the customer
  detail with order history using the G4.4 chips.
- **G10.2b** Orders board ready for the WhatsApp flow: each card shows the short command that advances it (`listo #104`),
  who changed the status and when, and a "pedido añadido" marker for orders merged later the same day.
  `DESIGN-AHEAD: integración WhatsApp + n8n pendiente` — design only, no automation exists yet.
- **G10.3b** Settings panel: price per kg and per lb, the two minimum-order values (delivery `$150`, pickup `$0`), each with its
  inline validation state and a saved confirmation. Values come from `store_settings`, never hardcoded.
- **G10.4** "Salir" with confirmation and a signed-out screen.
- **G10.5** **Django inventory screens, by their real template names** (they already exist in branch `practicas-ebac` under
  `backend/templates/`): `base.html` shell with `messages.html` (success, warning, error), `inventory/product_list.html` (search,
  empty state, error state), `inventory/product_detail.html`, `inventory/product_form.html` (create and edit, with field errors),
  `inventory/product_confirm_delete.html`, and `inventory/product_confirm_price_change.html` — the price-change confirmation nobody
  had designed — plus the Django login screen. All of them must be legible with plain HTML and CSS, no JavaScript.
- **G10.6** Everything at 390: sidebar as drawer, tables as stacked cards.

### G12 — Recipe book and nutrition widgets (new module, design-ahead)

Purpose Eduardo stated: keep people on the site before and after ordering. Recipes are Mexican, Argentinian and Spanish, tied to
what the shop sells (arrachera for carne asada, enchiladas potosinas, asado with chimichurri). Data comes from an external recipe
API that has not been chosen yet: every frame carries `DESIGN-AHEAD: external recipe API not chosen`.

- **G12.1** Recipe index: filter by dish type, by cut and by time; card with photo, title, time, difficulty and the cuts it needs.
- **G12.2** Recipe detail: ingredients with the shop's own products marked, steps, and one primary action "Agregar los cortes al pedido"
  that fills the cart with the products the recipe needs.
- **G12.3** Saved recipes in the customer profile, with an empty state.
- **G12.4** Nutrition widgets in the profile: calories and protein per order and per week, as two small cards. Plain numbers, no
  medical claims, no gamified rings.
- **G12.5** All of it at 390 first. Recipe photography is external: show the card working with a mediocre photo.

### G13 — Track Score, discounts and affiliates (new module, design-ahead)

Three levels to start, configurable by the admin: occasional buyer, frequent buyer, high-volume buyer (the taquería that spends a
lot in three visits a month). Today only `profiles.points` exists, so every frame carries its `DESIGN-AHEAD` note.

- **G13.1** Customer side: "Mi nivel" card with the current level, progress to the next one, and what the level gives. No invented numbers:
  use visible placeholders labelled as such.
- **G13.2** Customer side: affiliate panel with the link, its QR, referrals and rewards earned.
- **G13.3** Admin side: levels table — name, threshold, discount, what the level sees — each row editable, with a confirmation that
  shows before and after (the same pattern Django already uses for price changes).
- **G13.4** Admin side: discounts per customer, granted and revoked, with the reason and who did it.
- **G13.5** Admin side: affiliate rules — who qualifies, reward, caps.
- **G13.6** Promo codes (`promotions` exists): admin list and the checkout field, both with their invalid, expired and applied states.

### G14 — BuildAds and ProductAds (the plus modules, design only)

Eduardo's reference for these is SaleAds (screenshots in `~/Desktop/img`, catalogued in `referencias/capturas-previas.md`):
a campaign wizard (channel → objective → budget, location and language → AI-generated creative → ad account) and a
"Mis estrategias" list of resumable campaign cards. BuildAds is the assisted version with human approval; ProductAds is the
autonomous one. Neither has backend: every frame carries `DESIGN-AHEAD: módulo congelado, sin backend`.

- **G14.1** Entry point inside the admin, with an empty state that promises one thing and has a single primary action.
- **G14.2** Wizard, step by step: canal → objetivo → presupuesto, zona e idioma → creativo → cuenta. One decision per step,
  progress visible, back always available.
- **G14.3** Campaign list: cards with thumbnail strip, status chip, key rows and a resume action.
- **G14.4** Creative review: the generated copy and image next to an editable brief, with explicit human approval before publishing.
- **G14.5** ProductAds: the same surface in autonomous mode — what it decided, why, and the switch that stops it.
- **G14.6** The AI surfaces are the only place where a second accent is allowed, and it is still not a gradient: the red stays
  for commerce actions.

### G11 — Consistency pass

- **G11.1** One page with every card, button, input, chip and icon used in G1–G10 next to the G0 originals. Any undocumented difference is a FAIL and is fixed in its own group.

## 4. Definition of done for the run

- Every group has its page, and every criterion has a PASS or an open item with its reason.
- Each row shows the capture next to the new frames, and the improvement is nameable in one line.
- No new colors, fonts, icon sets or components outside Phase 0.
- Anything from spec §5.1 that appears carries its `DESIGN-AHEAD:` note.

## 5. References

Full research with URLs and licensing: `referencias/loop1-globales.md` and `referencias/loop1-admin.md`.
Short version, and what each one is for:

| Piece | Reference | What we take |
|---|---|---|
| Search overlay | Samsung, Speedo (via sparq.ai roundup) | The header is hidden or the page dimmed: never two search fields at once |
| Search overlay | Target, Princess Polly, Prada | Trending terms before typing; suggestion rows with section titles; live refresh per keystroke |
| Search overlay | Baymard autocomplete research | 4–8 suggestions on mobile / 10 on desktop, bold the predicted text, dim the page |
| Cart | SpaceNK, Huron, Spacegoods (CommerceGurus), Kettle & Fire, Primal Kitchen (Vervaunt) | Progress bar toward a threshold, quantity editing in the drawer, direct CTA |
| Header | UXPin mobile navigation | Active item by color, weight or underline, never a filled pill |
| Admin | django-unfold (MIT) | Structure our Django panel will inherit: sidebar, changelist filters, dark mode |
| Admin | TailAdmin and the dark Tailwind/React templates in `loop1-admin.md` | Dark admin density, chart and table treatment |
| Admin | Flowbite Kanban, shadcnuikit Kanban | Board / list / table toggle for orders |
| Admin | AdminLTE color guidance | 5–7 semantic colors maximum, never hue-only |
| Admin | dashboardcn (MIT), PanelUI | KPI card formula: value + delta + sparkline + period, borders over shadows |
| Craft gates | hallmark skill | Ten observable anti-slop rules listed in `loop1-globales.md` |

**Honest gaps, do not pretend otherwise:** no dark cart drawer was verified live (we build the pattern on our own palette);
Louis Vuitton's search was not fetched this round (the reference is Eduardo's own screenshots); Mobbin is auth-walled;
`prebuiltui.com/components/dashboard` 404s — the real path is `/search/dashboard-ui` and its content is weak for admin panels.

## 6. Anti-slop gates (must hold in every frame)

Taken from the hallmark skill: no AI-nav fingerprint (wordmark left, 4–5 links, CTA right, hairline border);
focus rings appear instantly, never animate in; nothing lives on hover alone; no bounce or elastic easing —
exponential ease-out only; clickable labels never wrap to two lines; one icon family across search, close, cart and menu;
no emoji as icons; add-to-cart is silent; numeric columns use tabular figures; two font families plus mono at most.
