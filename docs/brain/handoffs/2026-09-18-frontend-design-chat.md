# Frontend design chat context — 2026-09-18

Snapshot of the "Frontend + Carni-mvp" Claude Code session (redesign + Tailwind v4 migration), handed to OpenCode with the Pencil MCP. Related notes: [[architecture]], [[roadmap]], [[index]].

## Why the handoff

- Claude usage is almost exhausted (about 90 % weekly, 75 % of the 5-hour window). Design work continues in OpenCode with the Pencil MCP (OpenPencil).
- The order of work does not change: design first, then React + Tailwind v4 code, then backend.

## Where the work lives

| Item | Path | State |
|---|---|---|
| Design worktree (branch `pruebas`) | `~/Desktop/Carni-mvp-pruebas` | created 2026-09-17 |
| Current-design captures (59 PNG) + index | `docs/design/capturas-actuales/README.md` | uncommitted |
| Desktop / mobile board | `docs/design/capturas-actuales/tablero.html` | uncommitted |
| Redesign spec and loop (v1.3) | `docs/design/spec-rediseno-v1.md` | uncommitted |

- The shared folder `~/Desktop/Carni-mvp` stays on `practicas-ebac` (backend chat). Never switch its branch.
- Shared contract with the backend chat: `supabase/migrations/` and `DESIGN.md` (one Tailwind, one DESIGN.md for store and Django panel).

## Decisions

- Stop replicating the current site in a design tool. The as-is reference is the captures board. Work phase by phase from the spec.
- Every phase runs as a loop: restate criteria and rubric, build, self-review with screenshots, fix (max two rounds), report `ID | criterion | PASS/FAIL | evidence`, stop. Then an independent verifier checks each criterion and reports N/M to Eduardo.
- Canvas layout per phase: rows per surface; columns Antes | Escritorio 1440 | Móvil 390.
- Phase 0 starts with three type specimens and stops for Eduardo's choice: Fraunces + Geist, Instrument Serif + Instrument Sans, Bricolage Grotesque + Geist.
- The product card of `products.html` is the single card for every product section. The category bento stays a bento on mobile (2 columns with a 2×2 hero tile).
- The search overlay becomes dark (one surface above the page), Louis Vuitton structure adapted, never white.
- Password recovery uses a 6-digit email code (Supabase OTP), not a link.
- Secrets: API keys never go in prompts, logs or chat. The agent writes a script with an empty placeholder and Eduardo fills the key by hand (practice from the Gentleman Programming video).

## Verified facts

- "Melvis One" does not exist on Google Fonts (HTTP 400); headings fall back to Georgia. Poppins and Space Grotesk are on the overused-font list of the hallmark skill.
- Two different colors share the name gold: `$carni-gold: #F59E0B` (`css/abstracts/_variables.scss`) and `--carni-gold: #E4D1B0` (`css/themes/_dark-mode.scss`).
- `.btn-maximalista` exists only as `.dark-premium.auth-page .btn-maximalista` (background and color), so the login button looks rectangular.
- Order statuses in the database: pending, confirmed, preparing, ready, delivered, cancelled.
- `store_settings.min_order_delivery` defaults to 150 and `min_order_pickup` to 0; both editable from the dashboard.
- Admin pages are public static HTML behind a JavaScript redirect; data is protected by RLS (`is_admin()`), verified in migrations only. Demo orders (Juan Pérez, ORD-1001) are hardcoded in the HTML.
- "Cerrar sesión" in `dashboar.html` is a plain link and `logout()` in `js/modules/core/auth.js` has no callers: the session is not closed.
- On the live site at 390 px the search icon opens the search overlay correctly (a claim that it opened the cart came from a local build).

## Research results

- 42 Facebook reels reviewed visually (no audio transcription: no whisper on this machine). Their structure is written into the spec criteria; reel IDs are in the spec appendix.
- motionsites.ai "oyla" is an AI-generated preview video, not a coded site.
- prebuiltui.com: free copy-paste Tailwind components. `unfoldadmin/django-unfold`: MIT Tailwind theme for the Django admin. HorizonX: paid, inspiration only. styles.refero.design: typography and mood references.

## Next steps

1. OpenCode opens in `~/Desktop/Carni-mvp-pruebas` (branch `pruebas`).
2. Install or update OpenPencil (https://github.com/ZSeven-W/openpencil) and its MCP using the investigador skill; study the Engram video https://www.youtube.com/watch?v=4zjZDBVrK6E.
3. Run Phase 0 of the spec in Pencil; stop at the type specimens for Eduardo's choice.
4. Commit the design folder on `pruebas` only when Eduardo approves.

## Engram keys (project `carni-mvp`)

| Topic key | Content |
|---|---|
| `handoff/opencode-diseno-pencil` | This handoff |
| `design/spec-rediseno-loop` | Spec and phases |
| `design/metodo-loop-claude-design` | Loop method from Eduardo's loop.pdf |
| `design/flujo-por-componente-con-verificacion` | Per-component loop decision |
| `design/auditoria-claude-design-vuelta1-verificada` | Claude Design round 1 and security answers |
| `design/capturas-actuales-y-setup-claude-design` | Captures and Claude Design setup facts |
| `handoff/chat-backend-desde-frontend` | What the backend chat must know |
| `auth/logout-dashboard-no-cierra-sesion` | Logout defect |
| `research/motionsites-oyla`, `research/ui-template-sources` | Research outputs |
