# Glossary — Carni-mvp Domain Terms

Definitions for terms used throughout [[vision]], [[roadmap]], and [[agentic-stack]]. Linked liberally — when in doubt about a term, come back here.

## BuildAds

The 6-step ad-campaign creation wizard inside Carni-mvp. Lets the butcher shop generate and launch ad campaigns (IG, WhatsApp, TikTok, Google, Web) using AI for copy (Groq), creatives (Predis.ai / Open Generative AI), and voice (ElevenLabs). Includes an "ADN de Marca" extraction step that derives brand-identity variables from the shop's existing social content. Every campaign requires [[glossary#hitl|HITL]] authorization before publishing. See [[vision#buildads--6-step-wizard]] and [[roadmap]] Phase 5.

## SaleAds

A BuildAds campaign objective focused on driving direct sales (vs. Awareness or Growth objectives). Selected in BuildAds Step 1 ("Platform & Objective").

## ProductAds

Campaigns scoped to a specific product or set of products, typically triggered by the stock-monitoring worker agents described in [[vision#stock--buildads-connection]] (e.g. excess picaña → flash-sale campaign for that product). Related to the planned `productads-autonomo` skill — see [[agentic-stack]].

## Track Score

The loyalty/fidelización scoring system. Computes a numeric score per customer from purchase volume, social proof (photo reviews), and generosity (tips). Drives the customer's `level` (Principiante → Regular → Premium → VIP) and unlocks tier benefits. See [[vision#track-score--fidelización]].

## Tip Out

The automatic 6–8% retention applied to all customer tips, redistributed to support staff (cleaning, kitchen) who don't receive tips directly. Calculated at order close when the butcher reports `ENTREGADO + [amount]` via WhatsApp. See [[vision#whatsapp-bot-n8n--supabase]].

## Pedido Trifásico

The three-mode cart/order system implemented in `useCart.ts` (see [[architecture]]). The same product can be ordered:

1. **Por Peso** — by weight (kg × price/kg)
2. **Por Precio** — by budget (user picks a price, system computes equivalent weight)
3. **Por Pieza** — by piece/unit (estimated via `peso_promedio`, adjusted after real weighing)

See [[vision#webcommerce--pedido-trifásico]].

## Kanban (Order Management Board)

The 5-column order-tracking board (Recibidos → En Espera → Preparando → Listos → En Camino/Entregados) used by butchers/admins to manage live orders. Syncs in real time via Supabase Realtime and can be driven by WhatsApp bot commands via n8n. See [[vision#kanban-board-order-management]] and [[roadmap]] Phase 4.

## HITL (Human-In-The-Loop)

The mandatory human-approval gate before any AI-generated action goes live — most importantly before BuildAds campaigns publish to external platforms (Meta/TikTok/WhatsApp) or before code from a practice branch merges to main. Never skip this gate. See [[security]] for the hard-rule framing and [[agentic-stack]] for the `ebac-workflow` and `productads-autonomo` skills that depend on it.
