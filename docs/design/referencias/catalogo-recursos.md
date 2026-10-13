# Carni-mvp — Design Resource Catalog

Every link below was opened via WebFetch/curl (no browser automation, no login). Verified 2026-09-22. Target stack: React + Tailwind v4 storefront, Django templates (same Tailwind) for admin.

## Admin / dashboard templates

| Resource | What it really is | License / cost | Carni surface it serves | What to take | What to drop |
|---|---|---|---|---|---|
| [Berry Django React](https://codedthemes.com/item/berry-django-react-free-admin-template/) | Free admin UI — a **React SPA** that calls a Django API, not server-rendered templates | MIT, "Free Forever" + paid Pro | Admin dashboard | IA/nav structure as inspiration | The code — wrong render model for Django templates |
| [Tailwindadmin](https://tailwind-admin.com/) | Shadcn-based admin template; React 19/Next/Vue/Angular; Tailwind v4.2.4, Shadcn UI v3.2.1 | Open source (exact license not stated) + paid Pro | Admin dashboard, if React | Tailwind v4 class patterns, component range | Framework lock-in, no plain-HTML output |
| [Nordic-Store](https://github.com/tailwindtoolbox/Nordic-Store) | Static HTML e-commerce listing page (2018-19). Verified via raw README + index.html: loads `tailwindcss@2.2.19` from unpkg | MIT | Storefront catalog | Grid/spacing rhythm for a minimalist product grid | The file itself — Tailwind v2, no JIT, pre-v4 syntax |
| [FlyonUI Figma preview](https://www.figma.com/design/HEtwM2sKDNCiYDnFauKQbF/flyonui-figma-live-preview) | UNVERIFIED — Figma's app shell is client-rendered; WebFetch returned only the string "Figma" | — | — | — | — |
| FlyonUI, from [flyonui.com](https://flyonui.com) | Open-source Tailwind CSS library: semantic classes + JS plugins, 80+ components, explicit HTML/React/Vue/Next/Nuxt/Angular/Svelte support | MIT + paid Pro blocks | Storefront **and** Django admin | Semantic classes drop into plain Django templates, no JS runtime required | Pro blocks, until proven necessary |

## HorizonX explore pages (horizonx.so — paid membership site)

All eight require a HorizonX subscription; membership bundles a commercial license. Only two ship as real code.

| Resource | What it really is | License / cost | Carni surface it serves | What to take | What to drop |
|---|---|---|---|---|---|
| [Verdara Dashboard](https://horizonx.so/explore/verdara-dashboard) | **Coded**: single-file static HTML/CSS/JS, no dependencies — circular-impact analytics dashboard | Paid, HorizonX membership | Ops/sales analytics dashboard | KPI-card + CSV-export pattern | Petroleum/seafoam palette (off-brand) |
| [ORBE Eyewear](https://horizonx.so/explore/orbe-eyewear) | **Coded**: HTML/CSS/vanilla JS + GSAP 3.13, editorial eyewear landing | Paid, HorizonX membership | Storefront landing/hero | Scroll-lit hero structure, reduced-motion handling | Matte-black austerity — too cold for a butcher-shop brand |
| [Ecommerce Components](https://horizonx.so/explore/ecommerce-components) | Figma-only kit: gallery, cart, payment confirm, courier tracking, loyalty, reviews | Paid, HorizonX membership | Cart / order-tracking flow | Post-purchase IA (maps to WhatsApp order updates) | Whole kit — no code ships |
| [Product Card Components](https://horizonx.so/explore/product-card-components) | Figma-only, light/dark product cards with badges, swatches, spec rows | Paid, HorizonX membership | Catalog cards | Auto-layout card anatomy | Buying access just for this |
| [Map & Filter Components](https://horizonx.so/explore/map-filter-components) | Figma-only, property-search map + refine-search filter panel | Paid, HorizonX membership | Catalog/delivery-zone filters | Range-slider filter panel idea | Real-estate map framing, irrelevant here |
| [Delivery App Cards](https://horizonx.so/explore/delivery-app-cards) | Figma-only, 4-state parcel tracking card | Paid, HorizonX membership | Kanban order-status card (PedidosPage) | 4-state status-card concept | Courier-call action — Carni has no courier role |
| [Payment Components](https://horizonx.so/explore/payment-components) | Figma-only, dark checkout/billing kit | Paid, HorizonX membership | Stripe checkout | Auto-layout totals/invoice rows | Buying the full kit for this alone |
| [Profile Card Components](https://horizonx.so/explore/profile-card-components) | Figma-only, creative-profile card | Paid, HorizonX membership | User/affiliate profile | Stat-row + skill-chip anatomy | Whole kit — no code ships |

## Refero style DNA (`styles.refero.design/style/<id>`)

| Resource | What it really is | License / cost | Carni surface it serves | What to take | What to drop |
|---|---|---|---|---|---|
| [f212ff99…](https://styles.refero.design/style/f212ff99-24fa-4646-a0f2-46a815736ecd) — Shopify | Dark, mint `#36f4a4` on near-black; Neue Haas Grotesk + Inter | Reference only, free to view | Storefront chrome | Restrained accent-on-dark, pill buttons — close to Carni's red-on-black already | — |
| [cef25151…](https://styles.refero.design/style/cef25151-078c-4631-8f02-4f204f071b8b) — entire studios | Light, bone `#e7ecea`/ink; Space Mono only | Reference only, free | — | — | Monospace-only editorial tone, wrong mood for a butcher shop |
| [d75a643b…](https://styles.refero.design/style/d75a643b-a518-4550-b430-679cd989a447) — Freitag | Light, black/white/`#ffdd00`; Akkurat | Reference only, free | Catalog grid | Ruled-grid product matrix for a cuts catalog | Colorless-chrome rule, if brand needs more warmth |
| [d91841cf…](https://styles.refero.design/style/d91841cf-c717-43ef-97a2-400778fa6e1a) — Sweetgreen (recipe pair) | Light, forest `#00473c` + lime `#e6ff55`; SweetSans + Grenette | Reference only, free | Recipe/menu section | "Food is the card" — overhead-photo product cards | — |
| [b753dfda…](https://styles.refero.design/style/b753dfda-cbe1-41e4-b341-b98d69c8422f) — Amrit Palace (recipe pair) | Light, parchment `#d8cbb8` + saffron `#d49653`; TT Ramillas + Satoshi | Reference only, free | Recipe/menu section | Warm serif headings, editorial menu-item layout | Fine-dining formality if it reads too upscale |
| [108e2695…](https://styles.refero.design/style/108e2695-6970-47d5-b5b0-eea8fc34e048) — Dovetail | Dark, indigo `#6798ff`; Inter + JetBrains Mono | Reference only, free | Admin dashboard | Luminance-stacked dark surfaces, mono labels for data | — |
| [77b723ca…](https://styles.refero.design/style/77b723ca-9583-4349-9b5e-2ef8b4fde002) — Basedash | Dark, lavender/mint accents; Inter + serif Alpha Lyrae | Reference only, free | Admin dashboard | White-pill CTA on black, serif for headlines | — |
| [48971df7…](https://styles.refero.design/style/48971df7-919d-453c-9d0b-4600cd24c583) — Trunk | Dark, green `#22c550`; "Neue"/Inter | Reference only, free | Admin dashboard | Single accent reserved for success states only | — |
| [caf8d2ef…](https://styles.refero.design/style/caf8d2ef-4173-4431-9d26-05be0272e9f8) — Uber | Light, black/white, teal `#9dcdd6`; UberMove | Reference only, free | Delivery/order tracking | Flat hairline cards, no shadows, transit-kiosk clarity | Full monochrome restraint, if too cold |
| [52a007ed…](https://styles.refero.design/style/52a007ed-ad1b-46a6-bd44-b76f91df6d0c) — ChatGPT (BuildAds ref) | Light, grayscale `#0d0d0d`/white; system font stack | Reference only, free | BuildAds/ProductAds wizard | Two-column chat layout, weight-only hierarchy | Zero-accent palette — wizard likely needs a brand accent |

## MotionSites prompts (motionsites.ai)

Not code or assets — **paid AI prompts** for Lovable/Bolt/Cursor/Claude to generate throwaway sites. Each URL opened fine, but returns gallery marketing copy and a like-count, not a real spec.

| Resource | What it really is | License / cost | Carni surface it serves | What to take | What to drop |
|---|---|---|---|---|---|
| [deepthink](https://motionsites.ai/?prompt=deepthink) | "AI Assistant" prompt, 39 likes | Freemium site, prompts paid past a free quota | BuildAds wizard mood | General inspiration only | The prompt itself — not Carni-specific |
| [futuristic-eyewear](https://motionsites.ai/?prompt=futuristic-eyewear) | Ecommerce template prompt | Freemium/paid | — | — | Off-topic (eyewear, not butchery) |
| [vertex](https://motionsites.ai/?prompt=vertex) | Ecommerce template prompt, 82 likes | Freemium/paid | — | — | Too generic to act on from text alone |
| [beauty-products](https://motionsites.ai/?prompt=beauty-products) | Animated product-demo prompt, 34 likes | Freemium/paid | — | — | Off-topic |
| [nexora-hero](https://motionsites.ai/?prompt=nexora-hero) | SaaS hero prompt, 306 likes, animated | Freemium/paid | BuildAds landing hero | General inspiration only | The prompt itself |

## Adopt

For the React + Tailwind v4 storefront: **FlyonUI** as the component base — MIT, framework-agnostic, built on Tailwind utility classes, no React lock-in, adds a Tailwind plugin plus small optional JS (accordion/modal helpers) rather than a whole framework like Tailwindadmin's Shadcn stack. Pair it with **Shopify**'s Refero DNA (dark, restrained mint-on-black — close to Carni's existing red-on-black) for storefront chrome, and **Sweetgreen**/**Amrit Palace** for the recipe/menu section. For the ops dashboard, borrow Verdara's KPI/CSV pattern and the **Dovetail**/**Basedash** dark-SaaS DNA.

## Django admin

Truly server-rendered-friendly: **FlyonUI** (explicit plain-HTML support) and **Nordic-Store**'s markup pattern (plain HTML, zero JS framework — rebuild the classes, don't import its Tailwind v2 CDN link). **React-only dressed as "admin template"**: Berry Django React (Django is just the API; the UI is a React SPA), Tailwindadmin (React/Next/Vue/Angular only, no server-rendered path), and both coded HorizonX pieces (Verdara, ORBE — static files, but built as marketing pages, not CRUD screens).

## Rejected

- **Nordic-Store code** — Tailwind v2.2.19 via CDN, no JIT/v4 syntax; keep the pattern, not the file.
- **Berry Django React as a Django-template source** — it's a React SPA; adopting it means adopting React for admin.
- **Tailwindadmin** — no plain-HTML/Django path, pure JS-framework product.
- **6 Figma-only HorizonX kits** — good design, but paid-membership-gated with zero shippable code.
- **FlyonUI Figma live-preview link** — client-rendered app shell, unreadable without a Figma login.
- **entire studios / Uber Refero styles** — well-made but off-tone for a warm butcher-shop brand.
- **MotionSites** — sells prompts, not assets; relevant only if Carni starts generating disposable AI-built pages.
