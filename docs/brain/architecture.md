# Architecture — Real Stack & Repo Layout

Source: engram observation #425 (`carni/agentic-delivery-blueprint`), verified directly against the repo at `/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp` on 2026-06-15.

This note exists because past sessions scaffolded parallel projects (Next.js/Tailwind/Storybook) instead of improving the real PWA. **This is the anti-drift anchor.** Read this before generating any new project structure.

## Stack confirmation

`package.json` confirms (NO Next.js, NO Tailwind, NO Storybook):

- `react ^18.3.1` + `react-dom ^18.3.1`
- `vite ^7.1.12` + `@vitejs/plugin-react ^4.7.0`
- `typescript ^6.0.2`
- `express ^5.1.0`
- `@supabase/supabase-js ^2.57.4`
- `tsx ^4.21.0` (server runner)

SCSS: 39 files in `css/` following 7-1 architecture (`abstracts`, `base`, `components`, `layout`, `pages`, `themes`, `vendors`).

React lives in `src/` as a Vite multi-entry app — one `.tsx` per HTML page via `src/entry/*.tsx`.

## Verified repo layout (top level)

```
Carni-mvp/
├── index.html, products.html, accessweb.html, dashboar.html, admin-*.html, ebac-react.html
├── app.js
├── agents/            — orchestrator, agents, subagents, skills, workflows (see [[agentic-stack]])
├── css/                — SCSS 7-1 (abstracts, base, components, layout, pages, themes, vendors)
├── docs/               — IMPLEMENTATION_PLAN.md, TASK_PLAN.md, supabase-schema.sql, this brain vault
├── js/, ts/            — vanilla JS/TS support files
├── img/, output/, dist/
├── migrations/, supabase/
├── server/             — Express backend
├── src/
│   ├── entry/          — Vite multi-entry points: admin-customers.tsx, admin-orders.tsx,
│   │                      admin-products.tsx, auth.tsx, dashboard.tsx, home.tsx,
│   │                      offline.tsx, products.tsx, shared.tsx
│   ├── modules/
│   │   └── buildads/   — BuildAdsOrchestrator.tsx (scaffolded, incomplete — see [[roadmap]] Phase 5)
│   ├── hooks/           — useCart.ts (3-mode: peso/precio/pieza, see [[vision]])
│   ├── types/           — database.ts (Supabase types)
│   ├── components/, styles/, App.css, App.js, main.jsx
├── ts/
├── manifest.json, offline.html  — PWA shell
├── netlify.toml
└── AGENTS.md
```

## Key files to know

| File | Purpose |
|---|---|
| `src/hooks/useCart.ts` | 3-mode cart logic (peso/precio/pieza) — see [[vision#webcommerce--pedido-trifásico]] |
| `src/modules/buildads/BuildAdsOrchestrator.tsx` | BuildAds wizard scaffold, incomplete |
| `src/types/database.ts` | Supabase-generated types |
| `agents/STITCH_REDESIGN_PROMPT.md` | Full visual redesign spec (palette, breakpoints, wireframes) |
| `docs/supabase-schema.sql` | Current DB schema |
| `docs/IMPLEMENTATION_PLAN.md`, `docs/TASK_PLAN.md` | Pre-existing planning docs |

## What's missing (as of this writing)

- Kanban board module in `src/` (only BuildAds scaffold exists)
- Track Score / Fidelización React module
- Cart checkout UI with tip selector (`useCart.ts` exists, UI missing)
- WhatsApp bot n8n workflows (not in repo)
- Stripe + Apple Pay implementation (skill exists, implementation missing)
- `productads-autonomo`, `ebac-workflow`, `silver-security` skills (planned, not created)

See [[roadmap]] for the sequencing of this work and [[agentic-stack]] for the tooling inventory.

## Known issue

Main branch was reported broken since commit `5a752b3e` ("feat(carni-pwa): integrate Phases 1-6 with known regressions"). Verify current branch state before building on top of main — see [[roadmap]] Phase 1.
