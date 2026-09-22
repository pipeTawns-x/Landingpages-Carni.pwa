# Visual Reference Catalog — Carni-mvp Design Prep

Sources: Google Stitch mockups (on-brand), one unrelated "Feretería" hardware-store demo (pattern reference only), and ~49 loose screenshots mixing SaleAds, a "Kemi" admin template, an already-built Figma Make "Carni-MVP" dashboard, dev-environment captures, and today's real production pages.

## stitch-paneles/ — admin/ops mockups (on-brand)

### checkoutstitch.png
→ Right-side checkout drawer over a blurred product photo · Delivery/Pickup tabs, 3 line items with qty steppers, subtotal/total, loyalty note, full-width WhatsApp CTA · near-black, red #DC2626, gold loyalty text · take: WhatsApp CTA + stepper-in-drawer; drop: wagyu/luxury pricing.

### dashboardstitch.png
→ Icon sidebar (Dashboard, Inventory, Orders, Loyalty, Analytics, Reports) + red "New Entry" · 2-card hero row (revenue chart, regional map), then 3-column row (cut progress bars, live-order list, promo list) · near-black cards, red+gold, ghost-logo watermark · take: sidebar + color-coded order list; drop: watermark, unsourced map.

### paneladsstitch.png
→ 3-column AI ad manager: calendar + campaign cards, center AI chat with generated copy/IG preview, right "AI Configuration" (model dropdown, channel toggles) · same palette · take: BuildAds blueprint — chat + toggles + copy preview in one screen; drop: exposing model picker to users.

### panelinventariostitch.png
→ Cramped inventory screen: stock/units pills + product list + "Product Tracer" panel with a weight slider and vertical traceability timeline · same palette · take: the traceability timeline for premium cuts; drop: the overcrowded composition.

## stitch-landing/ — storefront + loyalty mockups

### catalogomaestrostitch.png
→ Left filter sidebar (category checkboxes, price slider) + asymmetric bento grid: hero product card, countdown-timer promo, no-price content card, merch item · take: the products+content+promo bento mix; drop: the countdown timer (conflicts with near-zero-motion).

### landingpagestitch.png
→ Hero: "El Arte de la Carne" headline + red CTA + product photo, "The Collections" 3-tile section, bottom gradient "Join the Mercy Club" loyalty banner · take: loyalty banner as a recurring site-wide unit; drop: English copy.

### paletastitch.png
→ Design-token sheet, not a screen: Primary #DC2626, Secondary #E4D1B0, Tertiary #F59E0B, Neutral #050505; type specimens (Plus Jakarta Sans headline, Inter body/label); button variants (Primary/Secondary/Inverted/Outlined) · take: everything, the token source of truth; drop: nothing — just confirm it matches shipped code.

### (unnamed file, "  .png")
→ "Bienvenido al Club Misericordia": points card with progress bar + tier name ("Obsidian Edition"), red "Your Butcher Selection" card, recent-activity list · take: tier-card + points-progress layout for Track Score.

## vistas-productos/, vistas-compras/, 4 root files — NOT Carni or SaleAds

All 12 files below are one unrelated, light-themed hardware-store demo ("Feretería", localhost:5173, tools priced in Quetzales) — kept as a CRUD/UX-pattern reference only; none are Carni or SaleAds despite the folder names.

### vistaagregarproductodetalle.png
→ Add-product form: name/category/stock, 3 price fields, feature bullets, status checkboxes, description · take: the field-grouping skeleton only; drop: white theme, yellow branding.

### vistaagregarproductomedia.png
→ Same form scrolled up: 4-slot media uploader (1 principal + 3 optional) + inline "add category" row · take: principal/optional media-slot pattern.

### vistawebcomercio.png
→ Storefront home: search+nav header, 3-banner hero, "Featured Products" 4-card grid with ratings and delivery badges, floating WhatsApp bubble · take: the bubble as a global element.

### vistawebproductos.png
→ Same storefront scrolled further; near-duplicate of the above, no new pattern.

### vistacompras.png
→ "Purchases" module: inline quick-entry form above a history table with a bold totals footer · take: form-above-history-table pattern for ops logs.

### vistadetallepedido.png
→ Order-detail modal: customer + delivery cards, line-item table, subtotal/shipping/total, print/close actions · take: use this modal directly for Carni's order detail; note it lacks full address fields.

### vistapedidos.png
→ Orders table with inline colored status dropdown per row (delivered/shipped) + search/filter/refresh row · take: inline status-change dropdown, faster than kanban for a small team.

### vistaventas.png
→ "Sales" module: same quick-entry-plus-history pattern, auto-calculated price field · take: auto-priced quick-sale row for counter sales.

### vistaadmincatalogo.png
→ "Manage Catalog": stat pill + refresh button above a product table with inline Stock/Offer toggles and edit/delete icons · take: inline toggles beat a separate screen for simple flags.

### vistaagregarproducto.png
→ Near-duplicate of vistaagregarproductomedia.png (same form, empty media slots) · no new pattern.

### vistacarrito.png
→ Full-page cart (not a drawer): cart table, "Order Summary" card with address block, dark "Confirm Order" button, WhatsApp bubble · take: pick drawer (Stitch) or full-page (this), not both.

### vistaproductodetalle.png
→ Product detail: thumbnail rail, large image, rating, bold price, qty stepper, 3 trust badges, "added to cart" toast · take: trust badges + toast confirmation — Carni's PDP has neither today.

## Root: mobileauthstitch.png — genuinely on-brand

### mobileauthstitch.png
→ Two mobile mockups: login (cream card, mascot, email/password, red "Entrar a la Carnicería", social icons) and register (red/orange card, larger mascot, fields split "Datos esenciales" vs. optional "Datos de entrega") · take: mascot, essential-vs-optional grouping, two-tone states; drop: nothing — the most finished mobile spec here.

## The ~49 loose screenshots (15 sampled across all 4 dates)

Not uniformly SaleAds as assumed. Breakdown: **6 SaleADS.Ai** — an AI ad-campaign SaaS: channel (Instagram/WhatsApp/TikTok/Google Ads/Web) → objective → budget/location/language → AI-generated creative from a prompt → ad account → campaigns as resumable cards in "Mis estrategias." **1 unrelated "Kemi" admin template**. **3 from an already-built Figma Make prototype titled "Dashboard-Redesign-for-Carni-MVP"** — a working dashboard (KPIs, on-brand charts, orders table), a BuildAds empty state, and a product modal with tiered pricing, plus a written design-decisions sidebar. **2 dev-environment captures** (not design references). **3 are today's real, shipped Carni-mvp pages** — ground truth for what exists.

Patterns worth stealing:
1. Campaign-card list (thumbnail strip + status pill + detail rows + resume action) — *11.46.39am*.
2. Sequential wizard (channel → objective → budget/location/language → AI image gen → account select) matches Carni's 6-step BuildAds plan — *11.42.48am, 11.43.23am, 11.44.03am, 11.44.44am*.
3. Purple-to-orange gradient reserved for AI-action surfaces only, separate from the red commerce accent — *11.42.48am, 2.42.57pm*.
4. KPI card row (icon badge + delta% + big number) plus on-brand red/orange donut and bar charts — *2.42.28pm*.
5. Tiered pricing in the product modal (Principiante/Regular/Premium/VIP + live struck-through price preview) — a mechanism for Track Score tiers — *2.48.00pm*.
6. Inline Stock/Offer toggles in the admin table row, no modal needed — *2.58.22am (Kemi)*.
7. Richer admin IA than Carni ships today: Clientes, Cupones, Vendedores, Reportes, Backups, Logs as nav items — *2.58.22am (Kemi)*.
8. BuildAds empty state: icon + one-line promise + single gradient CTA, no clutter — *2.42.57pm*.

Contradicts the decided direction (dark, restrained, near-zero motion): the Figma Make spec calls for hover microanimations, transition-heavy cards, and a floating chatbot with a glow shadow (*2.42.28pm*); SaleAds' gradient-and-glow CTAs lean maximalist if copied literally (*11.42.48am*); the catalog countdown timer is the same risk.

## Five images the design agent must look at first

1. **paletastitch.png** — the literal token source (colors, type, button variants); everything else derives from it.
2. **Captura de pantalla 2026-04-16 a la(s) 2.42.28 p.m..png** — an already-built, Carni-branded dashboard (Figma Make) with real KPI/chart/table content and a written component spec.
3. **mobileauthstitch.png** — the most finished, on-brand flow: mascot, correct field grouping, two-tone states.
4. **paneladsstitch.png** — the direct blueprint for BuildAds' chat+toggles+preview layout.
5. **Captura de pantalla 2026-06-10 a la(s) 1.46.18 p.m..png** — today's real production home page; design should start from actual baseline, not assumption.
