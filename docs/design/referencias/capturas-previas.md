# Visual Reference Catalog — Carni-mvp Design Prep

Sources found: Google Stitch mockups (Eduardo-generated, on-brand), one unrelated "Feretería" hardware-store demo (UX-pattern reference only), and ~49 loose screenshots mixing SaleAds, one "Kemi" admin template, an already-built Figma Make "Carni-MVP" dashboard prototype, dev-environment captures, and today's real production pages.

## stitch-paneles/ — admin/ops mockups, on-brand dark + red

### checkoutstitch.png
→ Right-side checkout drawer over a blurred product photo · Delivery/Pickup tabs, 3 line items with qty steppers, subtotal/total block, "Earn 30 points" note, full-width WhatsApp CTA · near-black bg, red #DC2626 CTA, gold loyalty text · take: the WhatsApp-native CTA and stepper-in-drawer pattern; drop: the wagyu/luxury pricing tier.

### dashboardstitch.png
→ Full admin shell: icon sidebar (Dashboard active, Inventory, Orders, Loyalty, Analytics, Reports) + red "New Entry" · 2-card hero row (revenue chart, regional dot-map) then 3-column row (cut progress bars, live-order status list, promo list) · near-black/dark-gray cards, red+gold accents, giant ghost-logo watermark · take: sidebar shell + color-coded order list; drop: the watermark and the unsourced regional map.

### paneladsstitch.png
→ 3-column AI ad manager: content calendar + campaign cards, center AI chat with generated copy/IG preview and prompt bar, right "AI Configuration" panel with model dropdown and per-channel toggles · same palette · take: direct blueprint for BuildAds (chat brief + channel toggles + copy preview, one screen); drop: exposing the model picker to end users.

### panelinventariostitch.png
→ Cramped inventory screen: stock/units stat pills + product list + "Product Tracer" detail panel with a weight slider and vertical traceability timeline (verification/shipping/processing) · same palette · take: the traceability timeline for premium cuts; drop: the overcrowded composition itself.

## stitch-landing/ — storefront + loyalty mockups

### catalogomaestrostitch.png
→ Storefront catalog: left filter sidebar (category checkboxes, price slider) + asymmetric bento grid mixing a hero product card, a countdown-timer promo, a no-price content card, and a merch item · take: the bento mix of products+content+promo in one grid; drop: the countdown timer (conflicts with the near-zero-motion rule).

### landingpagestitch.png
→ Hero landing: "El Arte de la Carne" headline + red CTA + product photo, "The Collections" 3-tile section, bottom gradient "Join the Mercy Club" loyalty banner · take: the loyalty banner as a recurring site-wide unit; drop: the English copy.

### paletastitch.png
→ Design-token sheet, not a screen: Primary #DC2626, Secondary #E4D1B0, Tertiary #F59E0B, Neutral #050505; type specimens (Plus Jakarta Sans headline, Inter body/label); button variants (Primary/Secondary/Inverted/Outlined); icon-button and tag-chip examples · take: everything — this is the token source of truth; drop: nothing, just confirm it matches what's already shipped in code.

### (unnamed file, "  .png")
→ "Bienvenido al Club Misericordia" loyalty screen: points card with progress bar + tier name ("Obsidian Edition"), red "Your Butcher Selection" card, recent-activity list · take: the tier-card + points-progress layout for Track Score.

## vistas-productos/, vistas-compras/, and 4 root files — NOT Carni or SaleAds

All 12 files below are screenshots of one unrelated, light-themed hardware-store demo ("Feretería", localhost:5173, tools priced in Quetzales). Kept, it appears, purely as a CRUD/UX-pattern reference — none of them are Carni or SaleAds despite the folder names.

### vistaagregarproductodetalle.png
→ Add-product form: name/category/stock, 3 price fields, feature bullets, status checkboxes, description · take: the field-grouping skeleton only; drop: white theme, yellow branding.

### vistaagregarproductomedia.png
→ Same form scrolled up: 4-slot media uploader (1 principal + 3 optional) + inline "add category" row · take: the principal/optional media-slot pattern.

### vistawebcomercio.png
→ Storefront home: search+nav header, 3-banner hero, "Featured Products" 4-card grid with ratings and delivery badges, floating WhatsApp bubble · take: the floating WhatsApp bubble as a global element.

### vistawebproductos.png
→ Same storefront scrolled further; near-duplicate of the above, no new pattern.

### vistacompras.png
→ "Purchases" module: inline quick-entry form above a history table with a bold totals footer · take: the inline-form-above-history-table pattern for ops logs.

### vistadetallepedido.png
→ Order-detail modal: customer + delivery-address cards, line-item table, subtotal/shipping/total, print/close actions · take: use this modal structure directly for Carni's order detail; note it lacks full address fields.

### vistapedidos.png
→ Orders table with an inline colored status dropdown per row (delivered/shipped) + search/filter/refresh row · take: the inline status-change dropdown, faster than kanban for a small team.

### vistaventas.png
→ "Sales" module: same quick-entry-plus-history pattern, with an auto-calculated price field · take: the auto-priced quick-sale row for counter sales.

### vistaadmincatalogo.png
→ "Manage Catalog": stat pill + refresh button above a product table with inline Stock/Offer toggle switches and edit/delete icons · take: inline toggles beat a separate edit screen for simple flags.

### vistaagregarproducto.png
→ Near-duplicate of vistaagregarproductomedia.png (same form, empty media slots) · no new pattern.

### vistacarrito.png
→ Full-page cart, not a drawer: cart table, "Order Summary" card with address block, dark "Confirm Order" button, WhatsApp bubble · take: decide once between drawer (Stitch) vs. full-page (this) cart — don't ship both.

### vistaproductodetalle.png
→ Product detail: thumbnail rail, large image, rating, bold price, qty stepper, 3 trust badges (shipping/secure payment/trusted seller), "added to cart" toast · take: the trust-badge row and toast confirmation — Carni's PDP has neither today.

## Root: mobileauthstitch.png — genuinely on-brand

### mobileauthstitch.png
→ Two mobile mockups: login (cream card, waving butcher mascot, email/password, red "Entrar a la Carnicería", social icons) and register (red/orange card, larger mascot, form split into "Datos esenciales" vs. optional "Datos de entrega") · take: the mascot, the essential-vs-optional field grouping, and the two-tone login/register states; drop: nothing — closest thing to a finished mobile spec in this folder.

## The ~49 loose screenshots (sampled 15, spread across all 4 dates present)

Not uniformly SaleAds as assumed. The sample breaks down as: **6 from SaleADS.Ai** (by Digital Seeds LLC) — an AI ad-campaign SaaS: pick channel (Instagram/WhatsApp/TikTok/Google Ads/Web) → objective (Sell/Awareness/Growth) → budget/location/language → AI-generate creative images from a character + prompt → pick ad account → manage campaigns as resumable cards in "Mis estrategias." **1 from an unrelated "Kemi" admin template** (kemi-brown.vercel.app). **3 from an already-built Figma Make prototype literally titled "Dashboard-Redesign-for-Carni-MVP"** — a working dashboard (KPI cards, on-brand bar+donut charts, orders table), a BuildAds empty state, and a product modal with tiered pricing, plus a visible sidebar of written design decisions. **2 are dev-environment/terminal captures** (not design references). **3 are today's real, shipped Carni-mvp pages** (index.html, accessweb.html) — ground truth for what already exists.

Patterns worth stealing:
1. Campaign-card list (thumbnail strip + status pill + detail rows + resume action) — *2026-04-16 11.46.39am*.
2. Sequential wizard: channel → objective → budget/location/language → AI image gen → account select, matching Carni's own 6-step BuildAds plan — *11.42.48am, 11.43.23am, 11.44.03am, 11.44.44am*.
3. Purple-to-orange gradient reserved only for AI-action surfaces, kept separate from the red commerce accent — *11.42.48am, 2.42.57pm*.
4. KPI card row (icon badge + delta% + big number) plus on-brand red/orange donut and bar charts, already working for Carni — *2.42.28pm*.
5. Tiered pricing block in the product modal (Principiante/Regular/Premium/VIP + live struck-through price preview) — a real mechanism for Track Score tiers — *2.48.00pm*.
6. Inline Stock/Offer toggle switches in the admin table row, no modal needed — *2.58.22am (Kemi)*.
7. Richer admin IA than Carni ships today: Clientes, Cupones, Vendedores, Reportes, Backups, Logs as first-class nav items — *2.58.22am (Kemi)*.
8. BuildAds empty state: icon + one-line promise + single gradient CTA, no clutter — *2.42.57pm*.

Contradicts the decided direction (dark, restrained, near-zero motion): the Figma Make spec panel explicitly calls for hover microanimations via Motion/React, transition-heavy cards, and a floating chatbot with a glow shadow (*2.42.28pm*); SaleAds' gradient-and-glow CTAs lean maximalist if copied literally (*11.42.48am*); and the catalog countdown timer (`catalogomaestrostitch.png`) is a motion/urgency device worth dropping for the same reason.

## Five images the design agent must look at first

1. **paletastitch.png** — the literal token source (colors, type, button variants); everything else derives from it.
2. **Captura de pantalla 2026-04-16 a la(s) 2.42.28 p.m..png** — an already-built, Carni-branded dashboard (Figma Make) with real KPI/chart/table content and a written component spec in-frame.
3. **mobileauthstitch.png** — the most finished, on-brand flow: mascot, correct field grouping, two-tone states.
4. **paneladsstitch.png** — the direct blueprint for BuildAds' chat+toggles+preview layout.
5. **Captura de pantalla 2026-06-10 a la(s) 1.46.18 p.m..png** — today's real production home page, so the design pass starts from actual baseline, not assumption.
