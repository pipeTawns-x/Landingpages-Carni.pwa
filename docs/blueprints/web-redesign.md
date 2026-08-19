# Web Redesign Direction — Bento + Mexican Maximalism, SCSS Only

What this is: the modern web direction for Carni-mvp that KEEPS the existing bento + maximalism aesthetic, stays SCSS-only (7-1 architecture), and adds NO new framework and NO new routes. It builds on `agents/STITCH_REDESIGN_PROMPT.md` and maps every recommendation to real SCSS files and the 7 HTML entrypoints. This is a blueprint — no code is written here.

## Quick path

1. Read "Constraint correction" first — it resolves a contradiction in the STITCH prompt.
2. Read "Design tokens to keep" for the locked palette/type/spacing.
3. Use the "Per-page redesign map" to know which SCSS file owns each change.
4. Apply "Responsive targets" (320 / 768 / 1024) as the acceptance grid.
5. Validate against the "Redesign checklist."

## Constraint correction (read this first)

`agents/STITCH_REDESIGN_PROMPT.md` states a "Stack objetivo: Tailwind CSS CDN + Alpine.js + Chart.js". This CONTRADICTS the project's hard rules and the confirmed stack (React 18 + Vite 7 + TypeScript + Express + SCSS 7-1; NO Tailwind, NO new framework).

Resolution: we take the STITCH prompt's **visual direction, wireframes, palette, and page scope** as authoritative, and we DISCARD its stack target. All redesign work lands in the existing SCSS 7-1 files. Charts, if needed, are an optional in-place addition decided per-feature later — not part of this redesign blueprint, and not a framework migration.

The STITCH prompt's own April 2026 update reinforces this: keep the site functional, do not break routes, cover ALL pages (not just the landing), no superficial color-only changes, stronger and more intentional bento grid.

## Design tokens to keep (locked)

These already exist in `css/abstracts/_variables.scss` — the redesign keeps them, it does not invent new ones.

| Token | Value | Role |
|-------|-------|------|
| `$carni-red` | `#DC2626` | CTAs, hero, primary |
| `$carni-green` | `#059669` | Success badges, WhatsApp CTA |
| `$carni-beige` | `#E4D1B0` | Secondary surfaces |
| `$carni-brown` | `#363432` | Footer, sidebar, strong text |
| `$carni-gold` | `#F59E0B` | Hover, highlights, premium/VIP |
| `$carni-white` | `#FFFFFF` | Main surfaces |
| Dark surfaces | `--carni-dark #050505`, `--carni-charcoal #111111`, `--carni-gray #181818` | Bento card backgrounds (maximalist dark premium) |
| Radius | `12–16px` cards (`$border-radius-lg: 0.75rem`) | Rounded bento cards |
| Shadows | `$shadow-md`, `$shadow-lg`, `$shadow-xl` | Elevation on hover |
| Type | Poppins 600–700 (titles), Inter/Roboto 400–500 (body) | Casual-premium hierarchy |

Maximalism discipline: bold red/gold accents and dark premium cards are the maximalism. Keep it intentional — generous spacing, strong type hierarchy, layered depth — NOT visual noise. Apply the existing `transition: transform 0.28s ease` hover-lift pattern consistently.

## Existing breakpoints (use these, do not add new ones)

From `_variables.scss`: `$breakpoint-sm: 576px`, `$breakpoint-md: 768px`, `$breakpoint-auth: 870px`, `$breakpoint-lg: 992px`, `$breakpoint-xl: 1200px`. The required acceptance targets are **320 / 768 / 1024**, which sit inside this existing scale (320 = base mobile-first, 768 = md, 1024 ≈ between lg and xl — treat as the desktop bento activation point, matching the current `@media (min-width: 1024px)` bento rules in `_bento-main.scss`).

## Page ↔ entrypoint ↔ SCSS map

The 7 user-facing HTML entrypoints (plus `offline.html` and `ebac-react.html` which are out of redesign scope) and their owning SCSS page partials:

| HTML entrypoint | React entry | Primary SCSS page file | Supporting SCSS |
|-----------------|-------------|------------------------|-----------------|
| `index.html` | `src/entry/home.tsx` | `css/pages/_home.scss`, `css/pages/_bento-main.scss` | `_header.scss`, `_footer.scss`, `_carousel.scss`, `_cards.scss` |
| `products.html` | `src/entry/products.tsx` | `css/pages/_catalog.scss`, `css/pages/_productos.scss`, `css/pages/_cart.scss` | `_cards.scss`, `_modals.scss`, `_badges.scss`, `_forms.scss` |
| `accessweb.html` | `src/entry/auth.tsx` | `css/pages/_access.scss` | `_auth-layout.scss`, `_forms.scss`, `_buttons.scss` |
| `dashboar.html` | `src/entry/dashboard.tsx` | `css/pages/_dashboard.scss` | `_dashboard-layout.scss`, `_sidebar.scss`, `_cards.scss`, `_badges.scss` |
| `admin-products.html` | `src/entry/admin-products.tsx` | `css/pages/_admin.scss` | `_dashboard-layout.scss`, `_sidebar.scss`, `_cards.scss`, `_modals.scss`, `_forms.scss` |
| `admin-customers.html` | `src/entry/admin-customers.tsx` | `css/pages/_admin.scss` | same as above |
| `admin-orders.html` | `src/entry/admin-orders.tsx` | `css/pages/_admin.scss` | same as above |

## Per-page redesign map

### index.html — Landing (`_home.scss` + `_bento-main.scss`)

- Hero: full-width red→brown gradient (`$carni-red` → `$carni-brown`), H1 + chef image split, primary CTA "Ver Productos" + secondary "Fidelidad", delivery badge. Owns: `_home.scss`.
- Categories bento: the existing 4×6 desktop bento grid in `_bento-main.scss` is already strong — keep the asymmetric span layout (cards 1–9). Refinements: tighten gaps consistently (already `16px` desktop), ensure every card has image + title + desc + CTA, add `Oferta` badge slot via `_badges.scss`.
- Sections below: About (50/50 split), testimonials carousel (`_carousel.scss`), 3-column footer (`_footer.scss`).
- Bento integrity: do NOT improvise the grid — the current `category-card-1..9` span map is intentional; keep it and improve padding/typography only.

### products.html — Catalog + Cart (`_catalog.scss`, `_productos.scss`, `_cart.scss`)

- Sticky header with search + cart badge; breadcrumb; horizontal scroll category chips (active = `$carni-red` bg, white text).
- Product grid: 4 cols desktop / 2 cols mobile. Cards show image, name, **per-kg price (primary) + per-lb (secondary)**, weight/quantity selector, add-to-cart. Maps to competitor-validated pricing display (see `competitor-scan.md`).
- Cart drawer (`_cart.scss`): slide-in right. Must visually support the trifásico modes (por peso / por precio / por pieza) and the free-shipping-progress nudge ("te falta $X"). Tip selector and Efectivo/Tarjeta bifurcation are scoped in `module-scopes.md` (payments) — here we only reserve the layout slots.
- Product detail modal (`_modals.scss`): enlarged image, full description, weight/quantity selector, add button.

### accessweb.html — Auth (`_access.scss` + `_auth-layout.scss`)

- 50/50 split layout: form panel + chef illustration (`img/recursos_web/carniLogin.png` / `carniRegistro.png`).
- Sliding panel animation between login and register (keep, it's a signature interaction).
- Register form fields per STITCH spec (name, email, phone, address, colonia, CP, password). Keep public/auth/admin zones visually separate (supports future JWT route protection).
- Split layout activates at `$breakpoint-auth: 870px`; below that, stack vertically (320px target).

### dashboar.html — Admin dashboard (`_dashboard.scss` + `_dashboard-layout.scss` + `_sidebar.scss`)

- Dark collapsible sidebar; top bar (search, notifications, profile).
- KPI stat cards row (Ventas, Pedidos, Clientes, Puntos/Fidelización) — reuse `_cards.scss` + `_badges.scss`.
- Chart area + recent-orders table. (Chart library is a later per-feature decision, NOT this blueprint.)
- Sidebar collapses below 768px; full layout at 1024px+.

### admin-*.html — Admin panels (`_admin.scss` shared)

- `admin-products.html`, `admin-customers.html`, `admin-orders.html` share `_admin.scss` + dashboard layout/sidebar.
- Consistent table + filter + modal patterns across all three. Keep them visually identical in chrome so admins context-switch cheaply.
- Reuse `_modals.scss` for create/edit forms, `_forms.scss` for inputs, `_badges.scss` for status pills.

## Responsive targets (acceptance grid)

| Target | Landing | Catalog | Auth | Dashboard/Admin |
|--------|---------|---------|------|-----------------|
| **320px** | Hero stacked, bento single column, drawer categories | 1-col cards (or 2 tight), cart full-width drawer | Single-column form, illustration hidden/below | Sidebar off-canvas, KPI cards stacked, table horizontal-scroll |
| **768px** | Bento 2 cols, hero side-by-side begins | 2–3 col grid, chips inline | Form widening, split begins near 870 | Sidebar visible, KPI cards 2×2 |
| **1024px** | Full 4×6 asymmetric bento (existing `_bento-main.scss` rules) | 4-col grid, persistent filters | Full 50/50 split with illustration | Full layout, KPI row of 4, charts + table side context |

Mobile-first is mandatory: base styles target 320px, breakpoints add up from there (matches the existing `_bento-main.scss` approach).

## Non-regression guardrails

- Keep existing navigation and routes working — no broken links across the 7 pages.
- Do not change `src/entry/*.tsx` mounting structure; redesign is SCSS + markup-class level.
- Keep public / authenticated / admin zones visually and structurally separate (forward-compatible with JWT + role protection).
- No new SCSS page partials unless a genuinely new page is added — extend the existing partials listed above.
- Prioritize UX, spacing, padding, and composition before decorative effects.

## Redesign checklist

- [ ] All 7 pages covered (no page left inconsistent or broken)
- [ ] Palette/type/spacing pulled from existing `_variables.scss` (no new ad-hoc tokens)
- [ ] Bento grid kept intentional (existing `category-card-1..9` span map preserved/improved, not reinvented)
- [ ] Per-kg primary + per-lb secondary pricing on catalog cards
- [ ] Cart drawer reserves slots for trifásico modes + free-shipping nudge + tip selector
- [ ] Auth sliding panel preserved; zones separated
- [ ] Admin pages share consistent chrome via `_admin.scss`
- [ ] Validated at 320 / 768 / 1024
- [ ] No new framework, no Tailwind, no new routes
- [ ] No `src/entry/*.tsx` mount changes

## Next step

Pair this with `competitor-scan.md` (pricing + cart-nudge patterns) and `module-scopes.md` (where cart/tip/payment logic lives) before any SCSS implementation sprint. Implementation should be delegated as a separate, screenshot-validated task (320/768/1024) — out of scope for this blueprint.
