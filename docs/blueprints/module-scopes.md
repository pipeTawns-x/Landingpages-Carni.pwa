# Module Scopes — Carni-mvp

What this is: the definition and scope for each major Carni-mvp module. For EACH module: what it is, who uses it, what data it touches, which Supabase tables, and where it lives in the real stack (`src/modules/*`, `src/entry/*`, `server/routes/*`). This is scope and definition only — NO implementation, NO code. It grounds future SDD changes so each module maps to in-place work on the confirmed stack (React 18 + Vite 7 + TS + Express 5 + Supabase, SCSS 7-1).

## Quick path

1. Use the "Module index" table for a one-line view of each module.
2. Read the per-module section for full scope, data, tables, and file locations.
3. Treat "Supabase tables" as proposed schema scope — exact columns are confirmed in the SDD spec phase, not here.

## Stack anchors (where things live)

- React modules: `src/modules/<module>/` (only `src/modules/buildads/` exists today).
- Page mounts: `src/entry/<page>.tsx` (one per HTML entrypoint; `home`, `products`, `auth`, `dashboard`, `admin-products`, `admin-customers`, `admin-orders`, `offline`, `shared`).
- Server routes: `server/routes/<feature>.ts`, mounted in `server/app.ts` under `/api/*` (today only `/api/buildads`).
- Types: `src/types/database.ts` (existing: `Product`, `Campaign`, `MediaAsset`, `ScheduledPublication`, cart types, BuildAds request types).
- Supabase: `@supabase/supabase-js` client; tables below are scope proposals. All sensitive logic runs server-side (Express / Supabase Edge Functions). Keys come from env vars only — never hardcoded, never in a committed `.env.example`.

## Module index

| Module | What it is (one line) | Primary users | Lives in |
|--------|----------------------|---------------|----------|
| BuildAds | AI-assisted ad-campaign creation wizard (proposal → HITL authorize → publish) | Admin / marketing | `src/modules/buildads/`, `server/routes/buildads.ts` |
| SaleAds | Internal promotions/flash-offers surfaced in the PWA (Netflix-style banners) | Admin (create), customers (view) | `src/modules/saleads/` (new), `src/entry/home.tsx`/`products.tsx` |
| ProductAds | Autonomous stock-driven campaign proposals (worker agent loop) | System agent → admin (approve) | `server/routes/productads.ts` (new) + agent/worker |
| Admin panel | Back-office for products, customers, orders (+ dashboard) | Admin / staff | `src/entry/admin-*.tsx`, `dashboar.html` |
| Affiliate program | Referral/affiliate tracking and rewards | Customers (referrers), admin (manage) | `src/modules/affiliate/` (new), `server/routes/affiliate.ts` (new) |
| Secure login/register | Auth with JWT + role-based access | All users | `src/entry/auth.tsx`, `server/routes/auth.ts` (new) |
| Payments | Unified checkout (Stripe + Apple/Google Pay), tips, Efectivo/Tarjeta bifurcation | Customers | `src/hooks/useCart.ts`, `server/routes/payments.ts` (new) |

Legend: "(new)" = does not exist yet; scope only. Everything else has at least a scaffold in the repo today.

---

## BuildAds

- What it is: a 6-step wizard that helps an admin create an ad campaign with AI assistance — brief + objective + product selection, AI-generated creatives (Predis), AI copy (Groq), AI voice (ElevenLabs), then a human-in-the-loop Authorize step before publishing.
- Who uses it: admin / marketing staff. Not customer-facing.
- What data it touches: campaign briefs, generated media assets, scheduled publications, selected products and their stock.
- Supabase tables (scope): `campaigns` (matches `Campaign` type: product_id, title, objective, status draft/approved/active, brief, ia_switch_active, created_by), `media_assets` (matches `MediaAsset`: type, provider predis/elevenlabs/manual, content_url, copy_text, is_approved), `scheduled_publications` (matches `ScheduledPublication`: asset_id, platform web/meta/tiktok/whatsapp, scheduled_at, is_published), reads `products`.
- Where it lives (real stack): UI in `src/modules/buildads/BuildAdsOrchestrator.tsx` (exists, scaffolded). Server proxy in `server/routes/buildads.ts` (exists: `/api/buildads/predis`, `/api/buildads/elevenlabs`, with rate-limiting + validation + env-key fallbacks). Types in `src/types/database.ts` (exist). Mounted via the dashboard/admin entries.
- External providers (env-keyed, server-side): Predis (creatives), ElevenLabs (Don Carlos voice), Groq (copy). No keys hardcoded; routes already fall back to safe placeholders when keys are absent.

## SaleAds

- What it is: the INTERNAL promotions surface — flash offers and sale banners shown inside the PWA (the "Netflix-style banner" that updates automatically when a campaign/promotion is authorized). Distinct from BuildAds (which authors campaigns) and ProductAds (which proposes them autonomously). SaleAds is the customer-facing display + the admin's manual promotion management.
- Who uses it: admin creates/toggles promotions; customers see them on the home and catalog pages.
- What data it touches: active promotions, discount config, linked products, schedule windows.
- Supabase tables (scope): `promotions` (title, product_id/category, discount_pct, code, starts_at, ends_at, is_active, source: manual | buildads | productads), reads `products` and `campaigns` (to reflect authorized campaigns internally).
- Where it lives (real stack): new `src/modules/saleads/` for the banner/promotion components; surfaced in `src/entry/home.tsx` and `src/entry/products.tsx`; admin management under `src/entry/admin-products.tsx` (or a promotions tab). Server: extend Express with `server/routes/promotions.ts` (new) for write/toggle; reads can use the Supabase client directly with RLS.
- Relationship: BuildAds/ProductAds authorization writes to `promotions` → SaleAds renders it. Keep the write path server-side.

## ProductAds

- What it is: the AUTONOMOUS stock-driven proposal engine. A worker agent monitors stock 24/7 and proposes campaigns/flash sales (e.g., excess picaña → propose flash sale; low stock → suggest pausing). Output is a proposal that an admin authorizes (HITL); on authorize it flows into BuildAds publish path and `promotions`.
- Who uses it: runs as a system agent; output reviewed/approved by admin. Customers never interact with it directly.
- What data it touches: product stock levels, generated proposals, high-tip customer signals (cross-referenced with good-stock products for personalized offers).
- Supabase tables (scope): reads `products` (stock), reads `profiles`/`tips_ledger` (high-tip detection), writes `campaign_proposals` (product_id, reason: excess_stock | low_stock | high_tip_target, suggested_action, status pending/approved/rejected, created_at), promotes approved proposals into `campaigns`/`promotions`.
- Where it lives (real stack): server-side worker + `server/routes/productads.ts` (new) for listing/approving proposals; integrates with the existing BuildAds publish flow. The monitoring loop runs server-side (Express/Edge Function or the Mac Mini local agent per the vision), NOT in the browser.
- Note: a `productads-autonomo` skill is planned (not yet created) to encode this pattern.

## Admin panel

- What it is: the back-office. Dashboard overview (KPIs, charts, recent orders) plus management of products, customers, and orders. The Kanban order board is part of the broader admin surface (planned module, not yet built).
- Who uses it: admin and shop staff (butchers for order status).
- What data it touches: products, customers/profiles, orders, order items, promotions, KPIs (sales, order counts, loyalty points).
- Supabase tables (scope): `products`, `categories`, `profiles` (customers), `orders`, `order_items`, `promotions`; reads aggregates for KPIs.
- Where it lives (real stack): `dashboar.html` → `src/entry/dashboard.tsx`; `admin-products.html` → `src/entry/admin-products.tsx`; `admin-customers.html` → `src/entry/admin-customers.tsx`; `admin-orders.html` → `src/entry/admin-orders.tsx`. SCSS in `css/pages/_dashboard.scss` + `_admin.scss` + layout/sidebar partials. Server CRUD via Express routes (per resource) with admin-only protection (see Secure login/register).
- Scope boundary: this doc covers the admin panel as the management shell. The Kanban board (5 columns, drag-and-drop, Supabase Realtime) is a separate planned module that plugs into `src/entry/dashboard.tsx` — defined in the product vision, scoped in its own future SDD change.

## Affiliate program

- What it is: a referral/affiliate system where existing customers refer new customers and earn rewards (credit or loyalty points). Distinct from Track Score loyalty (which rewards a customer's own spend); affiliate rewards referral-driven acquisition.
- Who uses it: customers act as referrers (share a code/link); referred customers redeem; admin configures reward rules and monitors fraud.
- What data it touches: referral codes, referral events (who referred whom), reward payouts, links to orders and profiles.
- Supabase tables (scope): `affiliates` (profile_id, referral_code, status, total_referred, total_rewarded), `referrals` (referrer_id, referred_profile_id, first_order_id, reward_status pending/granted/void, created_at). Reads `profiles` and `orders` (to validate a qualifying first purchase). Possible write to loyalty (`profiles.track_score` / store credit) on qualification.
- Where it lives (real stack): new `src/modules/affiliate/` for the customer-facing referral UI (share code, see status); admin config under the admin panel. Server: `server/routes/affiliate.ts` (new) for code generation, attribution, and reward grant — all server-side to prevent self-referral/fraud. RLS so a customer sees only their own referrals.
- Anti-abuse note (scope flag): self-referral and reward farming must be guarded server-side; exact rules are a spec-phase decision.

## Secure login / register

- What it is: authentication and authorization — register, login, session, and role-based access (customer vs. admin/staff). Forward-compatible with the redesign's guardrails: JWT in `Authorization`, `401` when missing/invalid, `403` on admin-only routes for wrong role.
- Who uses it: all users (customers register/login; admins/staff get elevated roles).
- What data it touches: user credentials/sessions (via Supabase Auth), profile records, roles.
- Supabase tables (scope): Supabase Auth (`auth.users`) + `profiles` (id → auth user, name, phone, address fields per the register form, role: customer | staff | admin, plus loyalty columns owned by Track Score: track_score, level, generosity_points, total_spent). RLS policies enforce per-row ownership; admin role bypasses where appropriate.
- Where it lives (real stack): `accessweb.html` → `src/entry/auth.tsx` (login/register UI, sliding panel). SCSS in `css/pages/_access.scss` + `_auth-layout.scss`. Server: `server/routes/auth.ts` (new) or Supabase Auth directly + an Express middleware for JWT verification and role checks that protects admin routes. The `carni-auth` skill exists to guide this (Clerk + Supabase dual-auth pattern referenced in skills — auth provider choice is a spec-phase decision; keep zones separated regardless).
- Guardrail: public / authenticated / admin zones stay separated (matches the redesign non-regression rule). No secrets in client code.

## Payments

- What it is: the unified checkout for the trifásico cart. Handles the three input modes (por peso / por precio / por pieza), the tip selector before final charge, the tip-out retention, and the Efectivo vs. Tarjeta bifurcation.
- Who uses it: customers at checkout. Admin/staff see resulting orders in the admin panel/Kanban.
- What data it touches: cart contents, order + order items, payment intents/status, tips, tip-out.
- Supabase tables (scope): `orders` (profile_id, status: paid_pending_preparation | cash_pending_preparation | ... , payment_method card/cash, subtotal, tip_amount, total, delivery_type), `order_items` (order_id, product_id, order_mode weight/pieces/price, requested values, final weight/price after weighing), `tips_ledger` (order_id, tip_amount, tip_out_amount, recipient_pool), reads `products` for pricing. Writes to loyalty (`profiles.total_spent`, `track_score`) on order completion (Track Score consumes this).
- Where it lives (real stack): cart logic in `src/hooks/useCart.ts` (exists — 3-mode peso/precio/pieza). Checkout UI in `src/entry/products.tsx` + `css/pages/_cart.scss` (tip selector + bifurcation slots reserved per `web-redesign.md`). Server: `server/routes/payments.ts` (new) for Stripe payment intents, Apple/Google Pay, and webhooks — all server-side; secret keys via env vars only. The `carni-stripe` skill exists to guide Stripe v9 patterns.
- Bifurcation scope: Tarjeta = prepaid → `paid_pending_preparation`; Efectivo = order frozen until weighing → `cash_pending_preparation`, with final total recomputed after real weight. Tip selector (8/10/15% or free amount) appears BEFORE final charge; tip-out (6–8%) auto-retained to a support-staff pool.

---

## Cross-module data flow (scope view)

```
Auth/profiles ──> Payments (orders, order_items, tips_ledger) ──> Track Score (loyalty cols on profiles)
                                   │                                        │
                                   ▼                                        ▼
                              Admin panel / Kanban                    SaleAds (flash offers)
                                                                            ▲
ProductAds (stock + high-tip signals) ──> campaign_proposals ──> BuildAds (HITL authorize) ──> promotions/campaigns
                                                                                                      │
Affiliate (referrals) ──> rewards into profiles / store credit                                       ▼
                                                                                              SaleAds renders in PWA
```

## Notes and boundaries

- Track Score / Fidelización loyalty columns live on `profiles` and are written by Payments on order completion — fully specced in the product vision (engram #414); treated here as a consumer of Payments output, not redefined.
- Kanban board (order management, 5 columns, Supabase Realtime) and the WhatsApp bot (n8n) are part of the product vision but are separate planned modules; this doc references them where they connect (Admin panel, Payments) but does not re-scope them.
- All "(new)" routes and modules are scope proposals — exact table columns, RLS policies, and provider choices are confirmed in the SDD spec/design phases, not here.
- Security posture: every external provider key (Stripe, Predis, ElevenLabs, Groq, Apify) comes from env vars, server-side only. The previously leaked Apify key must be rotated before any use. No `.env.example`, no hardcoded secrets.
