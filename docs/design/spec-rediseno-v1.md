# Carni redesign — spec v1.4 (loop source of truth)

Owner: Eduardo · Verifier: Claude Code · Designer: OpenCode + Pencil MCP (Claude Design when quota allows) · 2026-09-18
v1.4 (2026-09-21): audited against the real schema and code. Changes: unit rules, design-ahead list,
DESIGN.md ownership (F0.6), admin-shell sequencing, OCR evidence path.

This file is the **spec** of the design loop. The design agent builds only what a phase lists,
reviews its own output against that phase's numbered criteria, fixes what fails, and stops.
An independent verifier then checks every criterion and reports N/M to Eduardo.

## 1. Objective

Improve the current Carni design (online butcher shop "Carnicería El Señor de La Misericordia",
San Luis Potosí, Mexico) so it looks premium, coherent and hand-crafted, **not AI-generated**.
Improve what exists; do not replace the brand. All surfaces: store, product page, access,
checkout, admin.

**Non-goals:** code, new copy language, business rules not listed in section 5.

## 2. Inputs

| Input | Use |
|---|---|
| Uploaded current captures (`NN-*.png`, `D-*`, `M-*`) | **Mandatory "before" reference.** Keep layout intent and content; improve execution. |
| OCR of those captures (`docs/design/capturas-actuales/ocr/`, 59 files + README) | Text evidence for the defects in section 4. |
| This spec | Scope, criteria and references. Wins over any other source. |
| Repo (`~/Desktop/Carni-mvp-pruebas`, branch `pruebas`) | Read only if a criterion needs a real value. |

## 3. What already works (keep)

- Near-black background with one red accent. Premium, butcher-steakhouse mood.
- Hero video on the landing.
- Category **bento** concept on the landing.
- Product modes **Por peso / Por precio / Por pieza**, thickness slider, price per kg and per lb.
- "Catálogo maestro" editorial header on products.
- Floating assistant bubble on public pages.
- Reviews block on the landing (4.7 rating) and an "Ofertas" category: they evolve into the testimonials and offers sections.
- Spanish UI copy: keep it verbatim unless a criterion says otherwise.

## 4. Known defects (must be gone after the redesign)

1. Four typefaces; "Melvis One" does not exist on Google Fonts (falls back to Georgia); Poppins and Space Grotesk are generic.
2. Several product-card styles across sections.
3. Search overlay is white on a black site; red rectangle inside a pill field; it duplicated itself in the past.
   (The Merch results are correct data, and the broken images there are a code bug — `Lupa.tsx` skips `assetUrl()`, see PENDIENTES P-41 — not something the redesign fixes.
   The rotating placeholder "Búsqueda de un corte / una promoción" is intentional, `Lupa.tsx:47`.)
4. Amber active item in the mobile menu.
5. Inputs with a light block on the left; placeholders without accents ("Contrasena", "Correo electronico").
6. Rectangular "ENTRAR A LA CARNICERÍA" button next to pill buttons; empty social-login circles.
7. Bento collapses into plain stacked cards on mobile; uneven heights; titles over photos with poor contrast.
8. Admin mixes white Bootstrap tables, dark cards and decorative "ribbons"; unusable at 390 px.
9. Cart looks square and static, especially on mobile.

## 5. Business facts (use these, invent nothing else)

- Order statuses (database): Pendiente, Confirmado, Preparando, Listo, Entregado, Cancelado. Same labels for admin and customer.
- Delivery methods: entrega a domicilio and recoger en tienda. Minimum order for delivery: **$150 MXN** by default; minimum for pickup: **$0** by default. Both are editable by the admin.
- Customers pay by card with Stripe. WhatsApp is only for staff logistics, not a customer payment method.
- Password recovery uses a **6-digit code sent by email** (approved by Eduardo), not a link.
- **Selling unit is not always kg/lb.** It is derived from the category plus a convention (`products.price_per_lb = 0`),
  as implemented in `src/entry/products.tsx:211` and `src/components/Lupa/Lupa.tsx`:
  meat categories -> `/ kg` (with the per-lb price as secondary); `merch` -> `/ pieza`; `ofertas` without a per-lb price -> `/ paquete`.
  Any card, search result or cart line must render the unit that applies, never a fixed "kg + lb" pair.
- No cost price exists in the data. There is no discount, offer-price or offer-date column: today an offer is a product row
  inside the `ofertas` category (e.g. "Promoción Martes").
- `orders` stores `quantity_kg` only, has no payment column, no delivery fee and no human-readable order number
  (`orders.id` is a UUID). `orders.user_id` is NOT NULL and `create_order_with_items` rejects anonymous orders:
  checkout requires a signed-in customer.

## 5.1 Design-ahead (drawn now, no backend yet)

These criteria are allowed, but they are promises: nothing behind them exists today. Each frame that shows one
carries a small canvas note `DESIGN-AHEAD: <what is missing>` so nobody reads it as shippable.

| Criterion | What is missing today |
|---|---|
| F5.1 card payment | No Stripe anywhere in `src/` or `js/`, no payment column in `orders` |
| F5.1 order number | `orders.id` is a UUID; a readable number needs a new column or a derived code |
| F5.1 delivery fee line | No delivery-fee field exists; do not draw a fee row |
| F3.4 "Por pieza" for meat | No average weight per piece (pending P-20); `order_items` only stores `quantity_kg` |
| F0.3 offer variant, F2.6 offers | No discount or offer-date column; today an offer is a product row |
| F4.3 6-digit recovery | Supported by Supabase Auth but not implemented; the current link is decorative |
| F1.10 delivery minimum | Enforced server-side, but no frontend code reads `store_settings` yet: read the value, never hardcode $150 |

## 6. Global design rules

- **Colors:** near-black background; 2–3 dark surface layers; one red `#DC2626` for primary actions, active states and focus (retire `#c8302f`); sand `#E4D1B0` for subtle accents; gold `#F59E0B` only for stars and badges, never for active states; green `#059669` only for success.
- **Type:** exactly two families, chosen in Phase 0.
- **One card, one button set, one input style, one outline icon set** across all pages.
- **Mobile first:** 390 px first, then 1440 px. Touch targets ≥ 44 px.
- **Craft checks (observable):** no gradients except photo scrims; no glassmorphism; no emoji icons; spacing on a 4 px grid; text on photos always has a scrim; no default Bootstrap look (grey tables, blue links, square buttons).
- **Accessibility:** WCAG AA contrast; visible focus ring.

## 7. How motion is shown (static canvas)

The canvas cannot play motion, so every animation is shown as a **state strip**: 3 frames
(start, middle, end) next to each other, plus an annotation with duration, easing and the
reduced-motion fallback. A criterion about motion passes when the strip and the annotation exist
and match.

## 8. Canvas presentation (every phase)

One page per phase, named `Fase N — <name>`. One **row** per surface or state, three columns:

| Antes (current capture, small) | Escritorio 1440 | Móvil 390 |
|---|---|---|

Label every frame `surface · state · width`. Rows follow the criteria order. The self-review
table (section 10) goes at the end of the page.

## 9. Phases and acceptance criteria

Criterion IDs are stable from v1.1 on. The verifier reports by ID.
From Phase 1 on, **X.0 is implicit in every phase: all cards, buttons, inputs, chips and icons are the Phase 0 components, unchanged except for documented variants.**

### Phase 0 — Foundations

Upload: `12-products-grid-desktop.png`, `38-products-full-390-part01.png`, `07-index-featured-product-desktop.png`, `08-index-reviews-desktop.png`, `18-product-detail-recommendations-desktop.png`, `23-accessweb-login-desktop.png`.

- **F0.1 Type specimens (checkpoint).** Three pairings on the same set (H1, H2, body, small label, price, button, one product card), desktop and mobile: A) Fraunces + Geist · B) Instrument Serif + Instrument Sans · C) Bricolage Grotesque + Geist. **Stop after F0.1 and wait for Eduardo's choice.**
- **F0.2 Token sheet:** colors (bg, surface-1/2/3, text, text-muted, border, red, red-hover, sand, gold, success, danger) with contrast ratios; type scale for 390 and 1440; spacing (4 px base); radius scale; dark-UI elevation.
- **F0.3 Unified product card**, derived from the current catalog card (image, stock badge, category label, name, short description, price block, "Agregar" button). The price block is **unit-aware** (section 5): `$X / kg` with `$Y / lb` as secondary for meat, `$X / pieza` for merch, `$X / paquete` for package offers — never a hardcoded kg+lb pair. Variants side by side: default, hover (desktop), pressed, out of stock, compact (search results and carousels), and an offer variant marked **design-ahead** (section 5.1).
- **F0.4 Controls:** primary pill button (red), secondary (outline), ghost, icon button; input (single-tone dark field, label above, red focus ring, error with message, disabled); filter chip (default, active); qty stepper (default, at max).
- **F0.5 Copy:** the controls show "Contraseña" and "Correo electrónico" with accents.
- **F0.6 DESIGN.md (contract deliverable).** When F0.2–F0.5 pass, the design agent writes `DESIGN.md` at the repo root
  in the google-labs-code/design.md format (YAML front matter: name, description, colors, typography, rounded, spacing,
  components; then Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts),
  matching the token sheet exactly, plus the Tailwind v4 `@theme` block derived from it. This is the shared contract with
  the backend session: the store and the Django panel use this file and no other tokens. Phases 1–7 may not start until it exists.

### Phase 1a — Header and navigation

Upload: `02-index-menu-drawer-desktop.png`, `37-index-menu-open-390.png`, `01-index-hero-desktop.png`.

- **F1.1** Mobile drawer from the left, full height, rounded inner edge, close button ≥ 44 px, categories as filter chips, the two CTAs ("Ver productos", "Mi carrito") with Phase 0 buttons. Opening shown as a state strip (section 7).
- **F1.2** Active item in red (bar or text), never amber. The same active style on desktop.
- **F1.3** Desktop ≥ 1024 px: primary links inline in one header bar; the drawer holds only secondary content. The same header is used on every page.

### Phase 1b — Search overlay (lupa)

Upload: `03-index-search-overlay-desktop.png`, `M-index-search-open-390.png`.
Structure reference (context, not a criterion; Louis Vuitton search adapted to a dark brand): centered pill field, trending terms as plain text links under it, product suggestions below.

- **F1.4** Dark overlay one surface level above the page, not white. Mobile: full screen. Desktop: top sheet with max width.
- **F1.5** One centered pill input, no icon inside, focus shown on the pill itself. One annotated frame shows the header with the overlay closed and open side by side: the search icon is in the same position in both.
- **F1.6** Empty state: trending searches as text links, recent searches with "Borrar", and product suggestions in **two columns** using the compact card with meat photos (no broken images, no Merch unless searched).
- **F1.7** Typing state with live results; no-results state with a helpful message and trending links.

### Phase 1c — Cart and assistant

Upload: `04-index-cart-drawer-desktop.png`, `M-index-cart-open-390.png`, `16-products-chat-open-desktop.png`.
Structure reference (context, not a criterion): line items with thumbnail, name, variant, qty stepper and price; a summary box with subtotal, total and one primary CTA; a progress line toward a delivery minimum.

- **F1.8** Mobile: bottom sheet with rounded top corners (radius ≥ 24 px), drag handle, max 90 % height. Desktop: right drawer ~420 px with rounded left corners.
- **F1.9** Line item: thumbnail, name, chosen mode and amount (e.g. "Por peso · 1 kg"), qty stepper, line price, remove action.
- **F1.10** Delivery minimum: "Te faltan $X para entrega a domicilio" with a progress bar toward $150 and a note "Recoger en tienda: sin mínimo"; when reached, a success message in green.
- **F1.11** States: empty (message + CTA to the catalog) and with items (subtotal, total, CTA "Continuar con el pedido"); the disabled CTA look appears only when empty.
- **F1.12** Assistant bubble and panel restyled with Phase 0 tokens: clear title, rounded panel, Phase 0 input.

### Phase 2 — Landing (`index.html`)

Upload: `01`, `06`, `07`, `08`, `09`, `10`, `36-index-full-390-part01..03`, `D-index-full-1440.png`.

- **F2.1** Hero keeps the video (shown as a poster frame); headline in the display face, one primary CTA, scrim for legibility.
- **F2.2** Bento survives on mobile: 2-column grid with one 2×2 hero tile and 1×1 tiles; equal row heights; category name on a solid scrim; no truncated text. Desktop bento uses the same tiles.
- **F2.3** Featured product and "Lo que se lleva la gente" use the unified card.
- **F2.4** Testimonials (evolves the current reviews block): two rows of cards moving in opposite directions, shown as a state strip; static grid under reduced motion. Card: initials or avatar, name, gold stars, quote.
- **F2.5** New FAQ section (requested by Eduardo): accordion with one item open, chevron rotated on the open item, 5 placeholder questions on delivery, cuts, payment, orders and pickup.
- **F2.6** Offers section (evolves the "Ofertas" category): banner or cards with the on-offer card variant.
- **F2.7** About, opening hours, contact and footer with tokens; one footer for every public page.

### Phase 3a — Catalog (`products.html`)

Upload: `11`, `12`, `13`, `14`, `38-products-full-390-part01..03`, `D-products-full-1440.png`.

- **F3.1** Scroll "edit" sequence as a vertical storyboard: opening video (someone cutting meat, poster frame) → catalog header + filter chips → product grid (unified cards) → second video edit (a hand turning a cut, poster frame) → reviews / product descriptions → footer. Annotation: mobile uses posters and short loops; reduced motion shows posters only.
- **F3.2** Filter chips shown sticky under the header in a scrolled frame; active chip red.

### Phase 3b — Product page

Upload: `17`, `18`, `19`, `20`, `21`, `22`, `D-product-detail-full-1440.png`, `M-product-detail-full-390.png`.

- **F3.3** Gallery with three rounded images, less linear than today (desktop: one large + two stacked; mobile: swipeable carousel with dots).
- **F3.4** Mode selector Por peso / Por precio / Por pieza as a segmented control; thickness slider restyled; stepper shown at max stock with "+" disabled and hint "Stock disponible: X".
- **F3.5** Breadcrumb; mobile sticky bar "Agregar al pedido" with the live total.
- **F3.6** Recommendations with the unified card; loading skeleton matching the final layout.

### Phase 4 — Access (`accessweb.html`) and offline

Upload: `05`, `23`, `24`, `25`, `39-accessweb-full-390.png`, `D-accessweb-full-1440.png`, `40`, `41`.

- **F4.1** Login and register keep the sliding-panel idea (state strip); Phase 0 inputs and buttons; social buttons with Google and Facebook icons.
- **F4.2** Frames showing: an input in error state as it looks after leaving the field (inline message visible), an error toast, and the submit button in loading state ("Verificando…").
- **F4.3** Password recovery with a 6-digit code: request screen → "Revisa tu correo" → code entry (6 boxes, resend countdown) → new password with strength meter → success. Plus a branded email mock showing the code.
- **F4.4** Offline page with tokens.

### Phase 5 — New views

- **F5.1** Checkout: delivery method toggle (A domicilio / Recoger en tienda), delivery-minimum message, order summary, customer data, address in a modal, card payment with Stripe, primary CTA; success state with order number.
- **F5.2** Customer order status: Pendiente → Confirmado → Preparando → Listo → Entregado, plus a Cancelado state.

### Phase 6 — Admin panel

> **Sequencing note (resolved 2026-09-21).** M13 is at step 2 of 3: the Django project is scaffolded and its schema and
> Postgres role exist under RLS (`2aa59f32`, `e5a1cf49`), but there is no `inventory` app, no views and no templates yet
> (`backend/templates/` is empty). So the admin shell does NOT need to move earlier. The only dependency is **F0.6**:
> `DESIGN.md` plus the Tailwind `@theme` block must exist before the M13 templates are written, so they are built with the
> final tokens. If step 3 arrives first, those templates ship with semantic HTML and **no custom CSS** — never invented
> tokens — and Phase 6 restyles them without touching their structure.

Upload: `26`–`35`, plus Eduardo's Figma captures of dashboard, products and customers.

- **F6.1** Shell: collapsible sidebar with icon tooltips, one header, dark surfaces; no white tables; "ribbons" removed or turned into useful summaries.
- **F6.2** Dashboard: KPI cards (sales, orders, average ticket, low stock), sales chart, top products, recent orders.
- **F6.3** Products: list with search and filters; edit in tabs (Info, Imágenes, Precios, Oferta); invalid price state (empty or zero) with inline error; delete with a confirmation dialog.
- **F6.4** Orders: the six statuses from section 5 as a board or table with status badges.
- **F6.5** Customers directory with KPIs. Settings/prices panel: price per kg and per lb, minimum order for delivery and for pickup.
- **F6.6** "Salir" with a confirmation dialog and a signed-out screen.
- **F6.7** Mobile 390: tables become stacked cards; sidebar becomes a drawer.
- The same tokens must work later for Django admin templates.

### Phase 7 — Consistency pass

- **F7.1** One page with every card, button, input, chip and icon instance used in Phases 1–6, side by side with the Phase 0 originals. Any undocumented difference is a FAIL and gets fixed in its phase.

### Backlog (not now)

User profile (orders, addresses, favorites) and a fitness module for runners: calorie and protein counter per purchase, recipes.

## 10. Loop protocol (the design agent runs this in each phase)

1. **Restate** the phase criteria as a checklist. Write the scoring rubric before building: criteria met (50), consistency with Phase 0 components (20), mobile-first quality (15), craft checks from section 6 (15).
2. **Build** exactly those criteria. No extra sections, pages or features.
3. **Review:** screenshot every frame and check each criterion, plus X.0 (components match Phase 0). Mark PASS or FAIL with evidence: frame name and what is visible.
4. **Fix** every FAIL, then review again. **Maximum two fix rounds per phase.**
5. **Report** at the end of the page: `ID | criterion | PASS/FAIL | evidence`, the score after each round, and open items. Then **stop and wait** for Eduardo.

## Appendix — traceability (for Eduardo and the verifier; not design input)

Facebook reels reviewed on 2026-09-18 and turned into the text of the criteria above:
search 2251688882269212 · cart 3134649320062577, 4365429383715432 · card hover 1378908083626142 · active nav 870823415425385 ·
testimonials 1323993646353345 · FAQ 1023027813455228 · offers 2071934860373333, 1503699587903836, 2538412986585094 ·
recovery 1783172146019710 · login validation 913150627948620 · Google login 1733537301328970 · checkout 2098637584335076 ·
stock stepper 1665367344730411 · breadcrumb 1447662564075424 · variant gallery 1427032556116063 ·
admin 1379994174186688, 1353897403372474, 2000820313868176, 2070517636881659, 1354178782958180, 2256344458445100, 4310814862562074 ·
component library decision for the code phase (shadcn/ui, not in scope of this spec) 2602190353534861.
Web sources: prebuiltui.com (free Tailwind components), github.com/unfoldadmin/django-unfold (MIT), styles.refero.design (SVZ mood), motionsites.ai ("Wealthcore", "Fitness Dashboard").
