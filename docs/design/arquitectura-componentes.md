# Component architecture — Carni-mvp redesign

Companion to `DESIGN.md` (tokens) and `direccion-visual.md` (numbers). Build-ordered: primitives,
global chrome, store assemblies, admin, cross-cutting states (`loop-mejoras.md` G0→G11). No app
code here.

## 1. Global component inventory

| # | Component | Reused in | Variants / states | Props (conceptual) | Stack |
|---|---|---|---|---|---|
| 1 | Button set | Header, cards, forms, checkout, admin | primary pill / secondary outline / ghost / icon (44px) | label, variant, disabled | Shared — React + Django |
| 2 | Input / field | Access forms, checkout, admin forms, settings | default / focus / error / disabled | label, placeholder, error | Shared — React + Django |
| 3 | Filter chip | Catalog, drawer categories, no-results | default / active | label, active | React only |
| 4 | Qty stepper | Cart line, product-page mode selector | default / at-max ("+" disabled) | value, min, max | React only |
| 5 | Product card | Catalog grid, landing featured, recommendations, search (compact) | default / hover / pressed / out-of-stock / compact / offer (`DESIGN-AHEAD`) | image, name, priceBlock, onAdd | React only |
| 6 | Price block | Inside the card everywhere, cart line, search, checkout | meat `/kg`+`/lb`; merch `/pieza`; offer `/paquete` — unit by category, never hardcoded | amount, unit | Shared rule — React + Django |
| 7 | Header | Every public page + scrolled state | desktop inline / mobile collapsed / scrolled | activeRoute, cartCount | React only |
| 8 | Nav drawer | Store mobile menu, admin sidebar at 390 | store: staggered + chips; admin: icon-tooltip collapse | items, activeItem | React (store) + Django (inventory shell, §2) |
| 9 | Search overlay | Header trigger, store only | empty / typing / no-results | query, results | React only |
| 10 | Sheet / drawer (primitive) | Cart, nav, search top sheet, admin sidebar | mobile bottom sheet / desktop right drawer / desktop top sheet | position, onClose | React (store) + Django (admin, §2) |
| 11 | Cart line | Cart only | default / long-name (2-line clamp) | name, stepper, linePrice | React only |
| 12 | Summary block | Cart, checkout | cart CTA disabled only when empty; checkout adds fields | subtotal, total, cta | React only |
| 13 | Promo-code field | Checkout only | default / applied (success) / invalid (error) | code, onApply, discountPercent | React only — real feature (`promotions` + `apply_promotion()`, spec §5) |
| 14 | Status chip | Admin tables/board, customer order status, profile | 6 fixed statuses, icon always paired with label | status, size | React (customer) + Django (admin) |
| 15 | Order timeline | Customer order status (`Estado del pedido`) | 5-step progress Pendiente→Entregado, plus Cancelado branch | currentStatus, steps | React only — composes Status chip #14; connector untokened, §4 |
| 16 | KPI card | Admin dashboard (`dashboard.tsx`), customers KPI row (`admin-customers.tsx`) | with / without 48px sparkline | label, value, delta | React only — no Django KPI template today (G10.5) |
| 17 | Data table (+390 card) | Orders, customers — React; products — Django (`inventory/product_list.html`) | desktop table / mobile card-transform | columns, rows | Shared — React + Django. 390 transform is pure CSS, §2 |
| 18 | Tabs | Admin product edit (Info, Imágenes, Precios, Oferta) | default / active | tabs, activeTab | Django only — needs no-JS fallback, §2 |
| 19 | Accordion | Landing FAQ | closed / open (chevron 200ms) | items, defaultOpenIndex | React only |
| 20 | Empty state | Cart, search, profile sections | per-surface copy + CTA | message, cta | Shared — React + Django |
| 21 | Error state | Access, checkout, admin price | inline / toast (store only) | message | React (+toast) + Django (inline only, §2) |
| 22 | Toast | Access error only | error only — success is always silent | message | React only (admin uses flash messages, §2) |
| 23 | Pagination | Admin lists (products, customers, orders) | default | page, totalPages | Django + React — no token in spec, §4 |
| 24 | Breadcrumb | Product page | default | path | React only — no token in spec, §4 |
| 25 | Avatar / profile shell | Customer profile (Mi cuenta, Pedidos, Direcciones, Favoritos) | desktop sidebar / mobile drawer | sections, user | React only — whole view is `DESIGN-AHEAD` (G9.3) |

## 2. What breaks without JavaScript (Django server-rendered)

`backend/templates/base.html` (branch `practicas-ebac`) ships zero `<script>` tags today, so:

- **Nav drawer (admin sidebar at 390)** — breaks: JS slide-in, staggered entrance. Fallback: a
  checkbox+label toggle (or native `<details>`) opens/closes instantly — matches the sheet's own
  reduced-motion fallback (50ms fade), so it stays on-spec.
- **Tabs (product edit)** — breaks: client-side switching. Fallback: server-rendered sub-views by
  query string (`?tab=precios`), active tab read from the request.
- **Toast** — breaks: transient JS popup. Fallback: Django's `messages.html` renders a static
  flash banner (`<ul class="messages">`) on the next response, styled with `danger`/`success`.
- **KPI sparkline / sales chart** — breaks: canvas and hover tooltips. Not a Django concern today
  (row 16); future fallback would be an inline SVG polyline, no interaction.
- **Live search/filter (admin lists)** — breaks: as-you-type refresh. Fallback: a plain
  `<form method="get">`, filters as query params, results on full page load.
- **Data table → 390 card-transform is NOT broken** — a CSS media query, no JavaScript needed.

## 3. Component library call

shadcn/ui (React/Radix) gives accessibility for free — focus trap, roving tabindex, keyboard
handling — but needs a full re-skin to Fraunces/Geist and near-black surfaces. Hand-rolled gives
total control with zero dependency risk, at the cost of rebuilding what Radix already solved.
Neither touches the admin: shadcn is React-only, so Django hand-rolls Tailwind partials regardless.

**Recommendation:** shadcn/ui for the store's structural primitives only — Button, Sheet/Dialog
(rows 1, 10) — re-themed via `@theme`. Hand-roll the rest: card, price block, stepper, chips,
order timeline (no library models a unit-aware price block), plus 100% of the Django admin.

## 4. Gaps — no token in `direccion-visual.md`

- **Pagination** — no size/radius spec; reuses chip metrics (32px, 999px) as a placeholder.
  `TODO(direccion-visual)`.
- **Breadcrumb** — no type/spacing spec; reuses the Label role (Geist 500, 12px).
  `TODO(direccion-visual)`.
- **Order timeline connector** — the line between status steps has no width, color or state.
  `TODO(direccion-visual)`.
