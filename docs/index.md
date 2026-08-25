# Carni-mvp Documentation Index

This is the map of all project documentation. Start here before searching the repo manually.

## Quick path

1. New to the repo? Read `README.md` (root) and `/AGENTS.md` (root) first.
2. Planning a change? Check `docs/TASK_PLAN.md` and `docs/IMPLEMENTATION_PLAN.md` for current state.
3. Need product/architecture context? Go to `docs/brain/index.md`.
4. Evaluating a tool/skill before installing? Check `docs/tooling/triage.md`.
5. Working on visual redesign or module scoping? See `docs/blueprints/`.

## Documentation map

| Area | Location | What it covers |
|------|----------|-----------------|
| Agent entry point | `/AGENTS.md` (root) | Canonical local agent rules, roles, skills, human-in-the-loop guardrails |
| Project overview | `/README.md` (root) | Full project README |
| Copilot/AI master prompt | `/PROMPT_COPILOT_MAESTRO.md` (root) | Long-form prompt reference for AI-assisted work |
| Implementation plan | `docs/IMPLEMENTATION_PLAN.md` | Active technical base, agentic layer, CI rules, asset structure |
| Task plan | `docs/TASK_PLAN.md` | Current objective, in-progress items, completed items, next cut |
| Supabase schema reference | `docs/SUPABASE_SCHEMA_README.md` + `docs/supabase-schema.sql` | Database schema documentation and raw SQL |
| Knowledge vault (brain) | `docs/brain/index.md` | Product vision, architecture, agentic stack, roadmap, glossary, security — foundation-phase knowledge, no features |
| Tooling triage | `docs/tooling/triage.md` | Action/install status for every external tool and skill considered for the project |
| Blueprints | `docs/blueprints/` | `competitor-scan.md`, `module-scopes.md`, `web-redesign.md` — planning blueprints, no implementation |

## Brain vault detail (`docs/brain/`)

- `index.md` — map of the vault
- `vision.md` — product vision (BuildAds, Kanban, Cart Trifasico, WhatsApp bot, Track Score)
- `architecture.md` — real stack confirmation and repo layout
- `agentic-stack.md` — orchestrator, agents, subagents, skills, MCP inventory
- `roadmap.md` — 8-phase sequenced delivery plan
- `glossary.md` — domain term definitions
- `security.md` — hard rules (no `.env.example`, pnpm + ignore-scripts, HITL before publish, RLS)
- `videos/` — external source notes (transcripts pending/retrieved)
- `graph/README.md` — knowledge-graph generation status (pending, graphify not installed in this environment)

## Agent system (`agents/`)

Local agentic layer for Carni-mvp, separate from the global `stack-ia` / `gentle-ai` orchestrator:

- `agents/orchestrator/` — local orchestrator
- `agents/agents/` — role agents (security, DevOps, AI engineer)
- `agents/subagents/` — domain implementation specialists
- `agents/skills/` — reusable local skills and guardrails
- `agents/workflows/` — documented local workflows
- `agents/STITCH_REDESIGN_PROMPT.md` — visual redesign reference prompt
- `agents/AGENTS.md` — pointer note only; canonical rules live in `/AGENTS.md` (root)

## Checklist

- [ ] Read `/AGENTS.md` before making structural changes
- [ ] Check `docs/brain/security.md` before touching env files or secrets
- [ ] Check `docs/tooling/triage.md` before installing any new tool or skill
- [ ] Update this index when new top-level docs are added

## Next step

If a doc you expected isn't listed here, it's either missing or misplaced — add it to this index or move it under `docs/` and update this map.
