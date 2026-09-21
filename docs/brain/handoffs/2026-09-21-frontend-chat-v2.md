# Frontend design chat context — handoff v2 (2026-09-21)

Snapshot of the "Frontend + Carni-mvp" design session (OpenCode, `gentle-orchestrator`), handed to the backend chat ("Claudia") so she can review, audit and give feedback on what was done without her this week. Supersedes the v1 handoff from 2026-09-16 (`handoff/chat-backend-desde-frontend` #652).

Related notes: [[architecture]], [[roadmap]], [[index]], `docs/design/spec-rediseno-v1.md`.

## Why the handoff

- Eduardo resumes the week with the backend chat (Claudia, Claude Code). She must see what the design chat worked on, verify it, and correct anything that goes against the shared contract.
- Design work continues in OpenCode on the `pruebas` worktree. The backend chat continues on `~/Desktop/Carni-mvp` (`practicas-ebac`). Neither chat touches the other's branch.

## Where the work lives

| Item | Path | State |
|---|---|---|
| Design worktree (branch `pruebas`) | `~/Desktop/Carni-mvp-pruebas` | HEAD `38527865` |
| Redesign spec and loop (v1.3) | `docs/design/spec-rediseno-v1.md` | uncommitted |
| Current-design captures (59 PNG) + index | `docs/design/capturas-actuales/README.md` | uncommitted |
| Desktop / mobile board | `docs/design/capturas-actuales/tablero.html` | uncommitted |
| OCR audit of captures (59/59) | `/tmp/carni-ocr/*.txt` + Engram `design/capturas-audit` | done 2026-09-21 |
| OpenPencil canvas file (validated) | `docs/design/pencil/carni-mvp.op` | uncommitted |
| Graphify graph + report | `graphify-out/` (777 nodes, 999 edges, 173 communities) | done 2026-09-21 |

## What happened this week (design chat)

1. **Spec v1.3 approved** — the loop source of truth: phases F0.1–F7.1 with stable criterion IDs, canvas layout (Antes | Escritorio 1440 | Móvil 390), motion as state strips, loop protocol (restate → build → self-review → fix max 2 rounds → report `ID | criterion | PASS/FAIL | evidence` → stop).
2. **Captures audited with OCR** (59/59 files) because the orchestrator model has no vision and SDD sub-agents failed with HTTP 500 on images. Real text evidence extracted, see Engram `design/capturas-audit`.
3. **Defects confirmed with OCR evidence:**
   - Spec §4.3: search overlay shows Merch with broken images (Taza de Cerámica MXN 180, Delantal MXN 350, Playera Premium MXN 450, Playera Básica MXN 300, Gorra MXN 250, "Promoción Martes" MXN 144/kg).
   - Spec §4.5: login placeholders without accents ("Correo electrónico" / "Contraseña" corrupt).
   - Search placeholder truncated: "Buscar cortes y produc...".
   - Admin dashboards mix Bootstrap white tables with dark cards and decorative ribbons ("Dashboard Matrix", "Agencia IA 360°", "Brief creativo").
4. **Redesign NOT started yet.** Still in Phase 0 preparation: design-brief questions pending, F0.1 type choice pending. The OpenPencil MCP bridge is blocked (see below).

## Decisions (unchanged from v1 + new)

- Stop replicating the current site in a design tool. The as-is reference is the captures board. Work phase by phase from the spec.
- Canvas layout per phase: rows per surface; columns Antes | Escritorio 1440 | Móvil 390.
- Phase 0 starts with three type specimens and stops for Eduardo's choice: Fraunces + Geist, Instrument Serif + Instrument Sans, Bricolage Grotesque + Geist.
- The product card of `products.html` is the single card for every product section. The category bento stays a bento on mobile (2 columns with a 2×2 hero tile).
- The search overlay becomes dark (one surface above the page), Louis Vuitton structure adapted, never white.
- Password recovery uses a 6-digit email code (Supabase OTP), not a link.
- Secrets: API keys never go in prompts, logs or chat. The agent writes a script with an empty placeholder and Eduardo fills the key by hand.
- Shared contract with the backend chat: `supabase/migrations/` and `DESIGN.md` (one Tailwind, one DESIGN.md for store and Django panel). Django panel (M13) uses the same tokens; backend must not create its own.

## Verified facts (unchanged from v1)

- "Melvis One" does not exist on Google Fonts (HTTP 400); headings fall back to Georgia.
- Two different colors share the name gold: `$carni-gold: #F59E0B` (`css/abstracts/_variables.scss`) and `--carni-gold: #E4D1B0` (`css/themes/_dark-mode.scss`).
- `.btn-maximalista` exists only as `.dark-premium.auth-page .btn-maximalista`, so the login button looks rectangular.
- Order statuses in the database: pending, confirmed, preparing, ready, delivered, cancelled.
- `store_settings.min_order_delivery` defaults to 150 and `min_order_pickup` to 0; both editable from the dashboard.
- Admin pages are public static HTML behind a JavaScript redirect; data is protected by RLS (`is_admin()`), verified in migrations only.
- "Cerrar sesión" in `dashboar.html` is a plain link and `logout()` in `js/modules/core/auth.js` has no callers: the session is not closed.
- On the live site at 390 px the search icon opens the search overlay correctly.

## Current blocker (OpenPencil MCP)

- `/Applications/OpenPencil.app` is **0.15.1 (openpencil.dev)** — a Figma replacement WITHOUT the agent MCP bridge. It never publishes the live MCP port.
- The app used in the Gentleman Programming video is **ZSeven-W/openpencil 0.8.4** (native AI; GitHub release "The Relay Works, and Agents Can Reach..."). Its dmg was downloaded and mounted this week.
- Eduardo rejected automatic replacement of the app and said he installed it himself, but `/Applications` still reports 0.15.1. **Verify the version with Eduardo before trusting the MCP.**
- CLI `op` 0.8.4 lives at `~/.local/bin/op-new/op` (the brew tap one is 0.8.2).
- `.op` files MUST include `"version":"1"` (string) or the CLI rejects them.
- Resume: `~/.local/bin/op-new/op start --file docs/design/pencil/carni-mvp.op --port 3100` then check `op status` -> `{"running":true}` and `op tools`.
- Fallback that keeps working without the app: OCR is reproducible; the `.op` format is JSON/YAML and the CLI may write frames offline (to explore).

## Design pipeline queued (Eduardo's order)

1. Design-brief questions (5 asked, pending answers).
2. Devil's advocate (abogado del diablo) questions the answers.
3. Back to gentle/orchestrator.
4. Architect (the-architect) designs the base.
5. Base design in OpenPencil: landing, products, accessweb, dashboard admin — desktop 1440 + mobile 390 side by side, ordered in the canvas.
6. Improvements: search (lupa), hamburger menu, cart (carrito), landing more dynamic/modern.
7. Deliver: link open in OpenPencil + full explanation (what improved, how, which components).
8. Design skills available: ui-ux-pro-max, impeccable, web-design-guidelines, design-taste-frontend, hallmark, redesign-existing-projects.

## Engram keys (project `carni-mvp` / `Landingpages-Carni.pwa`)

| Topic key | Content |
|---|---|
| `handoff/chat-backend-desde-frontend` | This handoff (v2, #new) |
| `design/capturas-audit` | OCR audit of the 59 captures (2026-09-21) |
| `design/spec-rediseno-loop` | Spec and phases |
| `design/metodo-loop-claude-design` | Loop method from Eduardo's loop.pdf |
| `design/flujo-por-componente-con-verificacion` | Per-component loop decision |
| `design/capturas-actuales-y-setup-claude-design` | Captures and Claude Design setup facts |
| `auth/logout-dashboard-no-cierra-sesion` | Logout defect |
| `research/motionsites-oyla`, `research/ui-template-sources` | Research outputs |

## Ask Claudia (retro/audit request)

Audit this design work before the redesign starts. Specific review points:

1. Does the spec v1.3 conflict with the backend contract (`supabase/migrations/`, DESIGN.md, M13 Django scope)?
2. Which design criteria would break the current data model or admin flows as implemented today (orders, store_settings, RLS)?
3. Are there missing business rules that the redesign criteria would visually promise but the backend cannot deliver yet?
4. Anything in the captures audit (Engram `design/capturas-audit`) that contradicts what the backend chat knows about the current implementation?