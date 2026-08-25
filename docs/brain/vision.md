# Vision — Carni-mvp 2026

Source: engram observation #414 (`carni/full-vision-2026`).

Full product vision for Carni-mvp as specified by the owner across multiple sessions. This is the single source of truth for "what we are building" — context loss between sessions was a recurring pain point, hence this note.

See [[glossary]] for term definitions used throughout this note.

## WebCommerce — Pedido Trifásico

The cart (`useCart.ts`) handles 3 input modes for the same product:

1. **Por Peso** — kg × price_per_kg
2. **Por Precio** — user sets a budget (e.g. $200 MXN) → system calculates equivalent weight
3. **Por Pieza** — uses `peso_promedio` for an estimated subtotal, adjusted after real weighing

### Checkout bifurcation

- **Tarjeta** (Stripe/Apple Pay/Google Pay): prepaid, status = `paid_pending_preparation`
- **Efectivo**: order frozen until weighing, status = `cash_pending_preparation`

An embedded tip selector appears BEFORE the final charge: 8%, 10%, 15%, or a free amount.

**Tip Out**: 6–8% automatic retention from all tips, redistributed to support staff (cleaning, kitchen).

See [[architecture]] for where `useCart.ts` lives and [[roadmap]] Phase 3 for delivery sequencing.

## Track Score / Fidelización

Levels: Principiante → Regular → Premium → VIP

### Score algorithm

- **Volume**: 1 point per $10 MXN spent
- **Social Proof**: bonus points for photo reviews linked to real purchases
- **Generosity**: tips above a threshold trigger a Flash Offer for the next day (auto-generated via [[glossary#buildads|BuildAds]])

### Data model

- `profiles` table columns: `track_score` (int8), `level` (enum), `generosity_points` (int8), `total_spent` (decimal), `last_flash_offer_at`
- `tier_settings` table: configurable thresholds per level (`min_points`, `min_spending`, `discount_pct`, `priority_queue`)

### VIP benefits

10% discount over $10k MXN, early access to flash offers, priority in [[glossary#kanban|Kanban]], purple crown badge.

See [[roadmap]] Phase 6.

## Kanban Board (Order Management)

5 columns: Recibidos (yellow) → En Espera → Preparando (orange) → Listos (blue) → En Camino/Entregados (green)

Order card contains:

- Order ID (large, bold, e.g. `#1245`)
- Delivery type badge: 🚚 Delivery or 📦 Pickup
- Customer: name, phone, avatar
- Products via emojis: 🥩🍗🌭
- Timer: turns red after 30 min without completion
- Assigned butcher avatar
- Action buttons: "Tomar" (self-assign) or "Ver" (open detail)

Toggle between List and Kanban view. Drag & drop between columns. Real-time sync via Supabase Realtime + WhatsApp commands via n8n.

See [[roadmap]] Phase 4, [[agentic-stack]] for cult-ui pattern reuse.

## BuildAds — 6-Step Wizard

1. **Platform & Objective**: IG, WhatsApp, TikTok, Google, Web + goal (Sell/Awareness/Growth)
2. **Campaign config**: geo, budget ($4/$10/$20 USD), language
3. **Loading**: AI agents processing (animated)
4. **Strategy preview**: audience, formats (Reels/Stories/Feed), projected spend
5. **Creative choice**: "Crear con IA" (Open Generative) or "Subir archivos"
6. **Generate + Launch**: prompt, quality (Pro/Ultra), quantity, grid preview, Authorize button

**ADN de Marca** extraction: analyzes social feeds, audio samples, and descriptive text to create brand-identity variables used in AI generation.

**Authorization loop** ([[glossary#hitl|HITL]]): AI proactively proposes campaigns based on stock levels (e.g. excess picaña) → admin reviews → one-click Authorize → injects into `promotions` table AND publishes to Meta/TikTok/WhatsApp.

See [[roadmap]] Phase 5.

## WhatsApp Bot (n8n + Supabase)

Flow:

1. Client places order in the PWA.
2. Agent sends a structured WhatsApp message to the assigned butcher: "Nueva Orden #1234: 1kg Arrachera (Corte grueso), 500g Pollo (Limpio de nervio)".
3. Butcher replies with keywords:
   - `PREPARANDO` → status = `en_preparacion`, notify client + update Kanban
   - `LISTO` → recalculate final total based on real weight, send payment link with tip selector
   - `ENTREGADO + [amount]` (e.g. "ENTREGADO + 40") → close order, log tip to `tips_ledger`, calculate tip-out

Dashboard tracks timestamps for dispatch-speed metrics. Honesty ranking: reported tips vs. customer star ratings feed a monthly incentive leaderboard.

See [[roadmap]] Phase 7.

## Stock → BuildAds Connection

Worker agents monitor the `products` table 24/7:

- Excess stock detected → BuildAds proposes a flash-sale campaign
- Low stock → suggest pausing campaigns for that product
- High-tip customer detected → cross-reference with good-stock products → send a personalized flash offer the next day

Post-authorization sync:

- **Internal**: write to `promotions` table → Netflix-style banner updates automatically in the PWA
- **External**: push to Meta Ads, TikTok Ads, WhatsApp broadcast

## External APIs in use

| API | Purpose |
|---|---|
| Open-Meteo (free) | Weather for delivery planning and promotion activation |
| OpenFoodFacts | Product data enrichment and nutritional info |
| IPWhois | Client location validation for delivery coverage in SLP |
| Sent.dm | WhatsApp/SMS notifications |
| Stripe + Apple Pay + Google Pay | Unified checkout |
| Predis.ai | Visual creative generation (placeholder, needs prod key — see [[security]]) |
| ElevenLabs | "Don Carlos" voice (placeholder, needs prod key — see [[security]]) |
| Groq LLaMA 3.1 70b | Campaign copy and strategy |
| Open Generative AI | Image generation for BuildAds (Pro and Ultra models) |

## Infrastructure

Mac Mini (Open Cloud) runs: n8n workflows, local AI models, WhatsApp bot. All sensitive logic runs server-side via Supabase Edge Functions or local Express. Supply Chain Defense: pnpm, `ignore-scripts=true`, 3-day cooldown for new packages — see [[security]].
