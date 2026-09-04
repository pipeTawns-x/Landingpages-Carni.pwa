# Agentic Stack — Orchestrator, Agents, Skills, MCP Inventory

Source: engram observation #425 (`carni/agentic-delivery-blueprint`).

This is the inventory of agentic tooling already in place for Carni-mvp, plus what's still missing. Read this before adding any new agent, skill, or MCP server — most needs map to something that already exists.

## In-repo agentic layer (`agents/`)

- **Orchestrator**: `agents/orchestrator/carni-orchestrator.agent.md` — local coordinator
- **Agents (3)**: `ai-engineer`, `devops-captain`, `security-guardian`
- **Subagents (3)**: `carni-docs-curator`, `carni-frontend-specialist`, `carni-node-backend-planner`
- **Skills (9)**: `analytics-tracking-dashboard`, `api-design-dashboard-safe`, `carni-frontend-guardrails`, `carni-node-ebac`, `carni-release-check`, `ci-security-and-governance`, `devops-docker-dashboard`, `n8n-workflow-method-local`, `supabase-postgres-vesta-style`
- **Workflows (1)**: `local-agentic-flow.md`
- **Special**: `STITCH_REDESIGN_PROMPT.md` — full visual redesign spec (see [[architecture]])

## Global skills already installed (`~/.claude/skills`)

`buildads-wizard`, `carni-auth`, `carni-stripe`, `carni-supabase`, `cult-ui`, `hallmark`, `graphify`, `hyperframes`, `markitdown`, `open-design`, `browser-harness`, `skill-creator`, `prompt-master`, `impeccable`, `ui-ux-pro-max`, `awesome-design-md`, `the-architect`, plus 20+ more.

## MCP servers in `.mcp.json`

- **supabase** (HTTP) — pinned to project `wlikxgklwutxxazbhmkv`. **Blocked on OAuth approval** (owner action required in Claude Code TUI).
- **playwright** (stdio, vision caps) — ready to use for visual regression / screenshot-diff after SCSS changes.

## What is missing

- `productads-autonomo` skill (planned, not created) — pattern: stock monitor → BuildAds proposal → HITL authorize → publish
- `ebac-workflow` skill (planned, not created) — pattern: isolate practice work on `practicas-ebac` branch, never touch main, HITL before merge
- `silver-security` skill (planned, not created) — combines GGA pre-commit hook guidance + agentshield patterns (secret scanning, RLS audit, supply-chain defense) — see [[security]]
- `n8n` MCP server (not in `.mcp.json` yet) — owner must confirm exact npm package
- `stitch-mcp` (not in `.mcp.json`) — owner must add for Figma/Stitch mockup generation
- Kanban board module in `src/`
- Track Score / Fidelización React module
- WhatsApp bot n8n workflows
- Apify MCP — not connected. No longer blocked: the leaked keys were rotated 2026-08-25. Connecting it needs the owner to supply `APIFY_TOKEN` through the environment at run time. See [[security]].

## Resource-to-action mapping

### UI/Design libs → reference skills, NOT a new framework

- **cult-ui**: copy-paste pattern source for Kanban cards, BuildAds wizard steps, Track Score tier cards.
- **hallmark**: run before each UI sprint to prevent generic AI aesthetics; enforces a 20-theme gate on the bento redesign.
- **ui-ux-pro-max**: component audits during redesign phases.
- **impeccable**: polish pass after each feature ship.
- **awesome-design-md**: reference for design-doc writing, not a runtime dependency.

### Design/Redesign — SCSS in place, no new framework

- `agents/STITCH_REDESIGN_PROMPT.md` is the visual spec already in the repo.
- **open-design**: use CLI/MCP to generate bento grid prototypes as HTML/CSS snippets, then port into `css/pages/_bento-main.scss` and `_home.scss`.
- **Pencil MCP**: screenshot existing pages → `batch_design` against the STITCH spec → export reference images for SCSS implementation. Pencil output is reference only, never final code.

### Orchestration

- **agent-teams-lite**: already active via global CLAUDE.md — orchestrator/sub-agent delegation model is live.
- **archon**: installed — use for deterministic plan→implement→validate→PR cycles on large features (Kanban, Track Score).
- **crewai**: not installed, lower priority (agent-teams-lite covers the use case without a Python dependency).
- **gbrain**: not installed — `bun install -g github:garrytan/gbrain` — use for multi-agent plan visualization once Kanban/BuildAds are deeper. See [[roadmap]] Phase 1.

### Brain vault

- **graphify**: generate a knowledge graph from the repo, export to this vault. Run after each major phase to keep context fresh. Status: see `graph/README.md` (PENDING in this environment).
- **obsidian-git**: optional, not in `.mcp.json`. If the owner uses Obsidian, add it to auto-sync graphify output.

### Video resources

Deferred, non-blocking. See [[index]] → Video / source notes, and individual notes under `videos/`. As of this vault build, all 8 YouTube transcripts are PENDING (YouTube blocked the transcript API with HTTP 429 from this environment).

## Blockers requiring owner action

1. **Supabase MCP OAuth** — open Claude Code TUI → accept the browser popup. Blocking all DB-touching work.
2. ~~**Apify leaked key rotation**~~ — **DONE 2026-08-25.** Both leaked keys rotated by the owner; the live one never enters the repo. See [[security]].
3. **n8n MCP package** — owner must confirm exact npm package name/version. Needed for the WhatsApp bot phase.
4. **stitch-mcp** — owner must add to `.mcp.json`. Needed for bento-redesign mockup generation.
5. **gbrain install** — `bun install -g github:garrytan/gbrain` (owner already authorized).
6. **Predis.ai prod key** — needed for BuildAds creatives (placeholder in code).
7. **ElevenLabs prod key** — needed for "Don Carlos" voice (placeholder in code).
8. **YouTube transcripts** — markitdown must be re-run on each `youtu.be` link once the 429 rate-limit clears or from a different network. Deferred, not blocking.

See [[roadmap]] for how these blockers gate each phase.
