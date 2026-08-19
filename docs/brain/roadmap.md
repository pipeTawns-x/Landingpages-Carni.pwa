# Roadmap — 8-Phase Sequenced Delivery Plan

Source: engram observation #425 (`carni/agentic-delivery-blueprint`).

This is the dependency-ordered plan for taking Carni-mvp from current state to full vision (see [[vision]]). Each phase lists its dependency and deliverable. Do not start a phase before its dependency is met.

## Phase 1 — UNBLOCK (lowest risk, highest leverage)

**Dependency**: owner actions only.

- [ ] Owner: approve Supabase MCP OAuth in Claude Code TUI
- [ ] Owner: rotate leaked Apify key before adding it anywhere (see [[security]])
- [ ] Fix broken main branch (`5a752b3e` regression) — surgical revert or cherry-pick onto a repair branch
- [ ] Run `/sdd-init` on Carni-mvp to cache stack + testing capabilities

**Deliverable**: stable main, Supabase MCP live, SDD initialized.

## Phase 2 — BENTO REDESIGN (in-place, SCSS only)

**Dependency**: Phase 1 main fix.

- Use `agents/STITCH_REDESIGN_PROMPT.md` + hallmark + playwright vision
- Target files: `css/pages/_bento-main.scss`, `_home.scss`, `_catalog.scss`, `_dashboard.scss`, `_access.scss`, `_admin.scss`
- Cover all 7 HTML pages (no new framework, no new routes)
- Validate with playwright screenshots at 320px, 768px, 1024px

**Deliverable**: redesign PR, zero regressions, hallmark gates passing.

## Phase 3 — CART + CHECKOUT (`useCart.ts` → UI)

**Dependency**: Phase 1 Supabase MCP.

- Wire `useCart.ts` 3-mode (peso/precio/pieza, see [[vision#webcommerce--pedido-trifásico]]) into `products.tsx` entry
- Add tip selector component before final charge
- Add Efectivo vs. Tarjeta checkout bifurcation
- Stripe integration via `carni-stripe` skill

**Deliverable**: working cart modal + checkout flow, Supabase `orders` table writing.

## Phase 4 — KANBAN BOARD (new module)

**Dependency**: Phase 3 orders table.

- New `src/modules/kanban/` — 5-column board (see [[vision#kanban-board-order-management]])
- Real-time via Supabase Realtime subscriptions
- Wire into `dashboar.html` via `src/entry/dashboard.tsx`
- Use cult-ui patterns for drag-and-drop cards (see [[agentic-stack]])

**Deliverable**: live Kanban for admin, order status sync.

## Phase 5 — BUILDADS WIZARD (complete the 6-step flow)

**Dependency**: Phase 1 Supabase MCP + working `BuildAdsOrchestrator.tsx` scaffold.

- Complete steps 1–6 UI in `src/modules/buildads/` (see [[vision#buildads--6-step-wizard]])
- Wire Groq (copy), Predis (creatives), ElevenLabs (voice)
- HITL authorize loop: `proposals` table → admin review → publish
- `buildads-wizard` skill guides implementation

**Deliverable**: working 6-step wizard, HITL authorize button live.

## Phase 6 — TRACK SCORE / FIDELIZACIÓN

**Dependency**: Phase 3 orders writing to Supabase.

- Add `track_score`, `level`, `generosity_points` columns via migration
- `tier_settings` table with configurable thresholds
- Score computation Edge Function or Express endpoint
- UI: tier badge + progress bar in header

**Deliverable**: loyalty system live, score updates on order completion.

## Phase 7 — WHATSAPP BOT (n8n)

**Dependency**: n8n MCP added + Phase 4 Kanban status columns.

- n8n workflows: order created → WhatsApp message → butcher reply parser
- Keywords: `PREPARANDO`, `LISTO`, `ENTREGADO + amount`
- Sync back to Kanban via Supabase
- `n8n-workflow-method-local` skill guides this

**Deliverable**: WhatsApp ↔ Kanban ↔ PWA loop working.

## Phase 8 — CREATE MISSING SKILLS + BRAIN VAULT

**Dependency**: Phases 2–7 informing skill content.

- Create `productads-autonomo`, `ebac-workflow`, `silver-security` via skill-creator
- Run graphify on the repo → export to this vault (`graph/`)
- Add gbrain once installed

**Deliverable**: 3 new skills committed to `~/.claude/skills`, graphify vault.

> Note: this current vault build (`docs/brain/`) is the FOUNDATION slice of Phase 8, done early because the owner explicitly requested the knowledge vault before further feature work. Graphify itself remains PENDING — see `graph/README.md`.

## Blockers requiring owner action

See [[agentic-stack]] → "Blockers requiring owner action" for the full list (Supabase OAuth, Apify key rotation, n8n MCP package, stitch-mcp, gbrain install, Predis/ElevenLabs prod keys, YouTube transcripts).
