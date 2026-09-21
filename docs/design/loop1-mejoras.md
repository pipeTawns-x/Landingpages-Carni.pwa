# Loop 1 — Improvements (search, cart, header, dashboard)

Companion to `spec-rediseno-v1.md` (v1.4). That file holds the global rules, the business facts,
the design-ahead list, the canvas layout and the loop protocol (§10). This file is the scope and the
criteria of the **first improvement round**. Same IDs discipline: the verifier reports by ID.

**What this round is NOT:** a redrawing of the current site. Each frame must be visibly better than
the capture next to it, and the reason must be nameable (contrast, hierarchy, rhythm, one affordance
instead of two, mobile reachability).

## 0. Before anything

- Read `spec-rediseno-v1.md` §5 (business facts), §5.1 (design-ahead), §6 (global rules), §10 (loop protocol).
- Phase 0 of the spec (tokens, type, unified card, controls) must be approved first. If it is not, do F0.1–F0.6
  before this round: everything here uses those components.

## 1. Canvas layout for this round

One page: `Loop 1 — Mejoras`. One row per criterion, three columns:

| Antes (uploaded capture) | Escritorio 1440 | Móvil 390 |
|---|---|---|

Every frame labelled `surface · state · width`. Motion as a 3-frame state strip with its annotation (spec §7).
At the end of the page: the self-review table `ID | criterion | PASS/FAIL | evidence` and the score.

## 2. Captures to upload (they live in `docs/design/capturas-actuales/`)

| Criterion group | Files |
|---|---|
| Search overlay | `03-index-search-overlay-desktop.png`, `M-index-search-open-390.png` |
| Cart | `04-index-cart-drawer-desktop.png`, `M-index-cart-open-390.png` |
| Header / hamburger | `02-index-menu-drawer-desktop.png`, `37-index-menu-open-390.png`, `01-index-hero-desktop.png` |
| Dashboard | `26-admin-dashboard-top-desktop.png`, `28-admin-dashboard-kpis-charts-desktop.png`, `29-admin-dashboard-orders-table-desktop.png`, `31-admin-products-desktop.png`, `33-admin-orders-desktop.png` |

The design tool cannot browse this folder: upload the files of the group being built, nothing else.

## 3. Criteria

### L1 — Search overlay ("lupa")

Today (verified 2026-09-21): white overlay on a black site; the page header with its own search pill stays
visible on top of it, so **two search affordances show at once**; suggestion images are broken (code bug P-41);
the chat bubble floats above the overlay (`.chat-widget` z-index 3000 vs `.lupa` 1080).

- **L1.1** The overlay is dark: one surface level above the page, never white. Mobile full screen, desktop a top sheet with a max width and the page dimmed underneath.
- **L1.2** **One search affordance at a time.** While the overlay is open, the header's search control is not visible (the overlay covers it or replaces it) and the floating chat bubble is hidden. Show this as a two-frame comparison: header closed / overlay open.
- **L1.3** One centered pill field, no icon inside it, focus shown on the pill itself (no inner rectangle). The close control is a single X at the top right, ≥ 44 px.
- **L1.4** Empty state, in this order: trending terms as plain text links; recent searches with a "Borrar" action; then suggestions under a section title ("Lo nuevo"), as a grid of the compact card from Phase 0, with real meat photography. The page behind is dimmed while the field is active (Baymard).
- **L1.5** Suggestion grid: 2 columns at 390, 4–6 at 1440, capped at **4–8 suggestions on mobile and 10 on desktop** (Baymard). Each card shows its correct unit (`/ kg`, `/ pieza`, `/ paquete`, spec §5) — never a kg+lb pair by default. Prices use tabular figures.
- **L1.6** Typing state: live results with a result count, and the **predicted part of the term in bold — not what the customer typed** (Baymard).
- **L1.6b** No-results state: no source documents a standard for this, so it is our decision — one short line plus the trending terms and the category chips, so the customer always has a next step. Mark the frame `DECISIÓN NUESTRA`.
- **L1.7** Opening motion as a state strip: the overlay enters, the page behind dims. Annotate duration, easing and the reduced-motion fallback.

### L2 — Cart

Today: square panel, old-looking, empty state with a dim red disabled button; nothing tells the customer about the delivery minimum.

- **L2.1** Mobile: bottom sheet, rounded top corners ≥ 24 px, drag handle, max 90 % height, primary action always reachable with the thumb. Desktop: right drawer ~420 px with rounded left corners.
- **L2.2** Line item: photo, name, chosen mode and amount ("Por peso · 1 kg"), qty stepper, line price, remove. Long names wrap to two lines maximum.
- **L2.3** Delivery minimum (real rule, spec §5): "Te faltan $X para entrega a domicilio" with a progress line toward the value read from `store_settings`, plus the note "Recoger en tienda: sin mínimo". Reached state in green.
- **L2.4** Empty state that is not a dead end: one line of copy plus a CTA to the catalog, and two or three suggested cuts using the compact card.
- **L2.5** Summary: subtotal, total, and a primary CTA "Continuar con el pedido". The disabled look appears only when the cart is empty. Prices and quantities use tabular figures so columns line up.
- **L2.6** Opening motion as a state strip, with its annotation.
- **L2.7** Adding a product is a **silent success**: the sheet opens and the counter increases. No congratulation toast.

### L3 — Header and hamburger

Today: the active item in the mobile drawer is amber, not red; the drawer looks static; the header is one more bar.

- **L3.1** Mobile drawer from the left, full height, rounded inner edge, close ≥ 44 px, categories as Phase 0 chips, staggered item entrance as a state strip.
- **L3.2** Active item marked with **color, weight or an underline — never a filled pill** (UXPin), in red, never amber, and the same treatment on desktop.
- **L3.3** Desktop ≥ 1024: primary links inline in a single header bar; the drawer keeps only secondary content. Same header on every public page, including a scrolled state.
- **L3.4** The header's three controls (menu, search, cart) are one consistent set: same icon family, same hit area, same active and focus treatment.

### L4 — Admin dashboard

Today: white Bootstrap tables inside a dark page, decorative "ribbons" ("Dashboard Matrix", "Agencia IA 360°") that carry no data, charts in a different visual language, unusable at 390 px.

- **L4.1** One dark surface system: no white tables, no Bootstrap defaults. Tables use the Phase 0 tokens (borders, not shadows; 4 px grid).
- **L4.2** The decorative ribbons are gone or replaced by a summary that states real numbers.
- **L4.3** KPI row: sales, orders, average ticket, low stock. Each card follows the same formula — label, value, delta, period, optional sparkline — with **borders instead of shadows**. No card without meaning.
- **L4.4** Recent orders table with the six real statuses (Pendiente, Confirmado, Preparando, Listo, Entregado, Cancelado). Six statuses sit at the ceiling of what color alone can separate (AdminLTE: 5–7 max, never hue-only), so **every chip pairs an icon with its label**; color is secondary: green for Entregado, red only for Cancelado, neutral for the rest. Row actions visible without hovering on touch.
- **L4.5** Sales chart in the same visual language as the cards (same grid, same type scale, no third-party default look).
- **L4.6** At 390 px: the sidebar becomes a drawer and every table becomes **stacked cards** (card-transform strategy), not a horizontal scroll. Secondary columns are dropped by priority, and the dropped ones appear inside the card.
- **L4.7** Sidebar: collapsed state with icon tooltips, "Salir" visually separated from navigation.

## 4. Definition of done for the round

- Every criterion PASS in the self-review table, or listed as an open item with its reason.
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
