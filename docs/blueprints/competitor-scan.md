# Competitor Scan — Premium Butcher & Meat E-commerce

What this is: a grounded scan of direct competitors (premium butcher / meat e-commerce, prioritizing LATAM and México) to inform Carni-mvp's UX, pricing display, checkout flow, and loyalty design. Every claim below is tied to a real URL fetched during research. Anything that could not be confirmed from the public page is flagged as a FOLLOW-UP that needs deeper scraping (Playwright/Apify) — which is NOT authorized this session.

## Quick path

1. Read the per-competitor cards for UX, pricing, checkout, and loyalty patterns.
2. Read "Cross-competitor patterns" for the synthesized takeaways.
3. Read "Implications for Carni-mvp" to see how each pattern maps to our trifásico cart and Track Score.
4. Action the "Follow-ups" list once Playwright/Apify are authorized.

## Scope and method

- Research method: WebSearch + WebFetch only (Playwright and Apify MCP NOT authorized this session).
- Region priority: México first, then broader LATAM (Argentine-style cuts sold in MX), then US benchmarks for loyalty maturity.
- What WebFetch can and cannot see: it reads the rendered/markdown text of a page. Sites that hide their catalog behind WhatsApp ordering, JS-only carts, or login walls return little — those are explicitly flagged as follow-ups.
- Date of scan: 2026-06-15.

## Competitor cards

### 1. Carnicero MX — "La Cuchilla del Carnicero" (México, CDMX) — boutique premium

URL: https://carnicero.mx/

| Dimension | Finding |
|-----------|---------|
| Positioning | Boutique premium, Sonora + imported beef, vacuum-packed frozen for freshness |
| Pricing display | Mixed: **per kg** and **per piece (aprox.)**. Examples: "ARRACHERA CHOICE PORCIONADA (IMPORTADA) 1 KG — $499.00"; "BACK RIB 1.5 KG (aprox. por pieza) — $342.00"; packages $1,250–$2,450 |
| Product grid | Carousel grids with image + title + price + add-to-cart; hierarchical menu (Products: Res/Embutidos, Salsas/Sazonadores; Packages: All Occasions, Corporate; Blog, Contact) |
| Checkout flow | Explicit 3 steps: 1) ELIGE (select), 2) Haz tu pedido (payment method + delivery address), 3) CONFIRMA (receive in 24–72h). Delivery limited to CDMX + conurbano; order windows Mon–Thu 10–18h, Fri 10–15h |
| Loyalty / fidelización | None found. Only newsletter signup with promo incentive |
| Extra channels | WhatsApp ordering via two phone numbers |

Why it matters: validates the "approx. per piece" pattern for irregular cuts — directly relevant to our `peso_promedio` / por-pieza cart mode. Their explicit 3-step checkout is the simplest version of what our trifásico flow extends.

### 2. ButcherBox (US) — subscription benchmark + mature loyalty

URLs: https://www.butcherbox.com/ · https://www.butcherbox.com/loyalty-program-terms

| Dimension | Finding |
|-----------|---------|
| Positioning | Subscription meat boxes (grass-fed beef, free-range chicken, heritage pork) |
| Pricing display | **Per pound** ($8.52–$15.23/lb) with explicit value framing: "Up to 15% savings vs. grocery"; side-by-side comparison vs. GoodChop, Good Ranchers, Omaha Steaks |
| Checkout flow | 3 steps: 1) Pick your plan (Essentials = 6 products; Signature = 6/9/12), 2) Build your box (choose cuts), 3) Get it delivered (1–3 days, free shipping). Editable up until the night before billing |
| Loyalty / fidelización | **Sizzle Society** rewards program — the most detailed found |
| — earning | 2 points per $1 spent on subscription purchases; points post within 24h of shipment |
| — redemption | Min 1,000 points → $10 credit toward a future subscription order |
| — tiers | "Sizzle Society tiers" based on number of subscription orders in a rolling 12-month period; tier benefits at ButcherBox's discretion |
| — decay rules | Points expire if no purchase in the rolling 6 months; tier status lost without purchase in rolling 6 months; cancel = forfeit all points + tiers |
| — restrictions | No cash/gift-card conversion; non-transferable |

Why it matters: this is the closest real-world analog to our Track Score / Fidelización. The earn-rate (points per $ spent), the min-threshold redemption, the rolling-window tier decay, and the "cancel = forfeit" rule are all concrete design references for `track_score`, `tier_settings`, and level thresholds. Note: ButcherBox is subscription-only; Carni-mvp is transactional + tips-based, so we adapt, not copy.

### 3. Carnicox (México, CDMX) — fast-delivery grid commerce

URL: https://www.carnicox.com.mx/

| Dimension | Finding |
|-----------|---------|
| Positioning | Fresh premium beef, fast same-city delivery |
| Pricing display | **Per kg**. Example: "Molida de res — Precio unitario $242/kg". No visible weight selector in fetched markup (FOLLOW-UP) |
| Product grid | Product cards (image + name + price). Categories: Cortes, Cocina rápido, Res, Cerdo, Pollo, Mariscos, Cordero, Cremería, Extras, Verduras. Featured rails: Más Vendidos, Productos Nuevos, Temporada navideña |
| Checkout flow | Cart present ("Su carrito actualmente está vacío"); "Comprar ahora" CTA. Steps not visible in markup (FOLLOW-UP) |
| Payment methods | American Express, Mastercard, PayPal, Visa |
| Loyalty / fidelización | None. Newsletter only |
| Shipping | "Envíos rápidos: en 40 minutos en Lomas Estrella y mismo día en toda la ciudad" |

Why it matters: closest direct format match to our catalog (`products.html` grid, per-kg pricing, category chips). The "40-minute / same-day" speed promise is a UX trust lever we can mirror in our delivery messaging. Their PayPal + cards mix aligns with our Stripe/Apple Pay/Google Pay plan.

### 4. La Carnicería Virtual (LATAM/Argentine cuts sold in MX) — quality-tier merchandising

URL: https://lacarniceriavirtual.com/

| Dimension | Finding |
|-----------|---------|
| Positioning | Argentine-style premium cuts, cold-chain guaranteed |
| Pricing display | **Per piece with weight in title** (fixed-price packs). Examples: "ENTRAÑA PRIME TIPO ARGENTINA 800 GR. — $978"; "CHORIZO BOMBÓN 1 KG. — $204" |
| Product grid | Hierarchical: quality tiers (Prime, Angus Choice, Pequeños Ranchos, Kosher) + meat types (Res y parrilla, Aves/cerdo, Pescados y mariscos) + special rails (Comidas Artesanales, Vinos y Gourmet, Lanzamientos) |
| Checkout flow | Free-shipping threshold messaging ("Te falta $3,000 para el envío gratis"); cold-chain emphasis |
| Payment methods | American Express, Apple Pay, Google Pay, Maestro, Mastercard, PayPal, Shop Pay, Visa |
| Loyalty / fidelización | None visible on homepage (FOLLOW-UP to confirm account area) |
| Social proof | 2,569 reviews surfaced prominently |

Why it matters: two strong patterns — (a) **quality tiers as a top-level merchandising axis** (Prime/Choice/etc.), which we can map to badges like our `Don Carlos Recomienda`; (b) **free-shipping progress messaging** ("te falta $X"), a proven nudge we can reuse in the cart toward delivery thresholds. Apple Pay + Google Pay confirm our checkout payment-method plan is market-standard.

### 5. Carnes San Francisco (México) — relationship/WhatsApp-driven

URL: https://www.carnessanfrancisco.com.mx/

| Dimension | Finding |
|-----------|---------|
| Positioning | Distributor of fine cuts, prime Sonora beef, seafood, gourmet; serves menudeo + mayoreo + businesses |
| Pricing display | Not visible — catalog not exposed in fetched markup (FOLLOW-UP) |
| Product grid | Categories referenced (Carne de Res, Productos del Mar, Embutidos y Quesos, Gourmet) but no grid in markup |
| Checkout flow | Primary CTA "REALIZA TÚ PEDIDO" routes to **WhatsApp** — order placement is conversational, not a standard cart |
| Loyalty / fidelización | None described; serves wholesale/business segments (potential B2B account model — unconfirmed) |
| Channels | WhatsApp + phone + email, relationship-driven sales |

Why it matters: confirms that **WhatsApp ordering is a first-class channel** in the MX butcher market (aligns with our planned WhatsApp bot). But it also means their pricing/loyalty cannot be assessed without deeper scraping — flagged below.

## Cross-competitor patterns

| Pattern | Who does it | Takeaway for us |
|---------|-------------|-----------------|
| Pricing per kg | Carnicox, Carnicero (partly) | Default unit for fresh cuts; matches our `price_per_kg` |
| Pricing per piece / pack | La Carnicería Virtual, Carnicero ("aprox. por pieza") | Validates our por-pieza mode using `peso_promedio` |
| Per-lb shown alongside | ButcherBox (US) | We already carry `price_per_lb` — keep as secondary label |
| 3-step checkout | Carnicero, ButcherBox | Keep checkout to ~3 visible steps even with trifásico complexity |
| Free-shipping progress nudge | La Carnicería Virtual | Add "te falta $X para envío gratis" nudge to cart |
| Quality tiers as merchandising | La Carnicería Virtual | Reinforce badges (`Don Carlos Recomienda`, `Oferta Especial`) |
| Apple Pay + Google Pay | La Carnicería Virtual | Confirms our unified Stripe + Apple/Google Pay plan |
| WhatsApp as order channel | Carnes San Francisco, Carnicero | Validates our WhatsApp bot direction |
| Mature loyalty (points + tiers + decay) | ButcherBox only | Strongest reference for Track Score; nobody in MX sample has it = **differentiation opportunity** |
| Social proof (review counts) | La Carnicería Virtual | Supports our photo-review → bonus-points loop |

## Implications for Carni-mvp

- Pricing display: keep per-kg as default, per-piece (aprox.) for irregular cuts, per-lb as a secondary label. This exact mix is already validated across the MX sample and matches our `products.database.ts` fields.
- Loyalty is a moat: none of the México competitors scanned run a real points/tier program. ButcherBox proves the mechanics work. Our Track Score (volume + social proof + generosity) would be a genuine differentiator in the local market — prioritize it.
- Checkout discipline: competitors keep checkout to ~3 visible steps. Our trifásico cart + tip selector + Efectivo/Tarjeta bifurcation must collapse into a similarly shallow visible flow, not balloon into a 6-screen wizard.
- Cart nudges: adopt the free-shipping-progress nudge ("te falta $X") — cheap to build, proven conversion lever.
- WhatsApp channel is expected, not novel: in this market customers already order via WhatsApp. Our bot is table-stakes parity, not a differentiator on its own — the differentiator is tying it to Kanban + Track Score.

## Follow-ups (need Playwright/Apify — NOT authorized this session)

These could not be confirmed from public markup via WebFetch and require an authorized headless browser or scraper:

1. **Carnicox checkout steps + weight selector** — confirm whether they offer a per-kg slider/weight picker and the full checkout step sequence. FOLLOW-UP (needs Playwright/Apify).
2. **Carnes San Francisco full catalog + pricing + any B2B/mayoreo account program** — catalog is behind WhatsApp; needs interactive scraping. FOLLOW-UP (needs Playwright/Apify).
3. **La Carnicería Virtual account area** — confirm whether a loyalty/points or subscription program exists once logged in. FOLLOW-UP (needs Playwright/Apify, possibly authenticated).
4. **Carnicero MX cart/checkout interaction** — confirm tip option (none observed) and exact payment methods at checkout. FOLLOW-UP (needs Playwright/Apify).
5. **Live price benchmarking table** (per-kg by cut: arrachera, ribeye, t-bone, molida) across all MX competitors for competitive pricing of our catalog. Needs repeatable scraping. FOLLOW-UP (needs Playwright/Apify). NOTE: the previously leaked Apify key must be rotated and supplied via env var before any Apify run.

## Sources

- https://carnicero.mx/
- https://www.butcherbox.com/
- https://www.butcherbox.com/loyalty-program-terms
- https://www.carnicox.com.mx/
- https://lacarniceriavirtual.com/
- https://www.carnessanfrancisco.com.mx/
