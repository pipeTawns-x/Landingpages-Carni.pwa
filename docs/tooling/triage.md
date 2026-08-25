# Tooling Triage — Carni-mvp Foundation Phase

This document triages every external resource identified in the PHASE 2 list (engram #427) for Carni-mvp ("Carnicería El Señor de La Misericordia"). It records the recommended action for each tool, its current install state, and a one-line rationale.

**Stack constraint**: React 18 + Vite 7 + TypeScript + Express 5 + SCSS 7-1. No Next.js, no Tailwind, no Storybook. No new runtime dependencies are added here — this is a planning document only.

**Action codes**

| Code | Meaning |
|------|---------|
| `[MCP]` | Connect as an MCP server |
| `[SKILL]` | Install / use as a skill in `~/.claude/skills` |
| `[REF]` | Reference / research only — no installation |
| `[CREATE]` | Build our own using `skill-creator` |
| `[BUILTIN]` | Replace with an official Claude command or built-in skill |

**Installed? key**

- **Installed** — directory confirmed under `~/.claude/skills` or `~/.config/opencode/skills`
- **In registry** — entry exists in `.atl/skill-registry.md`
- **Missing** — not found in either location
- **UNKNOWN — verify** — could not confirm without auth/network access

---

## Orchestration

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `Gentleman-Programming/agent-teams-lite` | `[SKILL]` | **Installed** (registry: `archon`-adjacent; the orchestrator CLAUDE.md already loads it) | Core multi-agent orchestration layer already wired into the Claude Code harness. |
| `gentle-ai` | `[SKILL]` | **Installed** (`~/.config/opencode/skills/gentle-ai`) | Canonical SDD workflow engine; all sdd-* agents depend on it. |
| `Gentleman-Skills` | `[SKILL]` | **Installed** (skills are present across `~/.claude/skills`) | Umbrella skill collection; individual skills already extracted and installed. |
| `Alan-TheGentleman` | `[REF]` | **Missing** | Persona / reference archetype; no install needed — consulted for tone and philosophy only. |
| `Fission-AI/OpenSpec` | `[SKILL]` | **Installed** (`openspec` in `~/.claude/skills`) | Spec-driven development; used for proposals/specs/design docs. |
| `github/spec-kit` | `[SKILL]` | **Installed** (`spec-kit` in `~/.claude/skills`) | Makes specs executable; complements OpenSpec for implementation. |
| `coleam00/Archon` | `[SKILL]` | **Installed** (`archon` in `~/.claude/skills`) | YAML workflow engine for deterministic plan→implement→validate cycles. |
| `gsd-build/get-shit-done` | `[SKILL]` | **Missing** | Opinionated execution framework; install to enforce delivery rhythm. |
| `BloopAI/vibe-kanban` | `[REF]` | **Missing** | Visual kanban for AI tasks; reference only — no runtime required. |
| `msitarzewski/agency-agents` | `[REF]` | **Missing** | Multi-agent pattern library; useful as conceptual reference during blueprint phase. |
| `EvoMap/evolver` | `[REF]` | **Missing** | Evolutionary architecture patterns; reference for long-term refactor planning. |

---

## Brain / Memory

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `Gentleman-Programming/engram` | `[MCP]` | **Installed** (active MCP — used in this session) | Persistent cross-session memory; already connected and authoritative. |
| `safishamsi/graphify` | `[SKILL]` | **Installed** (`graphify` in `~/.claude/skills` and registry) | Converts repo to interactive knowledge graph; key for brain phase (docs/brain/graph/). |
| `Vinzent03/obsidian-git` | `[REF]` | **Missing** | Git sync plugin for Obsidian vault; reference for docs/brain/ setup, no install in Claude. |
| `kepano/obsidian-skills` | `[SKILL]` | **Missing** | Obsidian templating skills; needed when building the docs/brain/ vault structure. |
| `garrytan/gbrain` | `[SKILL]` | **Missing** | CLI brain/memory layer on top of Obsidian; install once vault is created. |
| `garrytan/gstack` | `[REF]` | **Missing** | Stack-snapshot tool; reference for architecture snapshots — no Claude integration needed. |

---

## Security

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `gentleman-guardian-angel` | `[SKILL]` | **Missing** | Guardian-angel security skill; needed before any production deploy. |
| `affaan-m/agentshield` | `[SKILL]` | **Missing** | Prompt-injection and agent safety guardrails; high priority for agentic workloads. |
| `snyk/agent-scan` | `[SKILL]` | **Missing** | Vulnerability scanning during CI/CD; install alongside supply-chain-defense skill. |
| `affaan-m/ECC` | `[REF]` | **Missing** | Elliptic-curve cryptography reference; consulted for auth/payment security design only. |

---

## UI / Design

Stack constraint: keep bento + maximalism aesthetic; no new CSS framework.

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `nolly-studio/cult-ui` | `[SKILL]` | **Installed** (`cult-ui` in `~/.claude/skills` and registry) | 92+ agent-ready React components; directly usable with our React 18 + SCSS stack. |
| `nutlope/hallmark` | `[SKILL]` | **Installed** (`hallmark` in `~/.claude/skills` and registry) | Anti-slop UI gate; runs 57 design checks to keep output distinctive. |
| `nextlevelbuilder/ui-ux-pro-max-skill` | `[SKILL]` | **Installed** (`ui-ux-pro-max` in registry; `claude-webkit/ui-ux-pro-max`) | Full UX audit and redesign skill. |
| `pbakaus/impeccable` | `[SKILL]` | **Installed** (`impeccable` in `~/.claude/skills` and registry) | Design quality enforcement; complements hallmark. |
| `VoltAgent/awesome-design-md` | `[REF]` | **Installed** (`awesome-design-md` in `~/.claude/skills` and registry) | Curated design reference collection; loaded as REF, no active invocation needed. |
| `Hainrixz/claude-webkit` | `[SKILL]` | **Installed** (`claude-webkit` umbrella in `~/.claude/skills`) | Multi-skill webkit bundle: building-components, frontend-design, playwright-cli, etc. |
| `Hainrixz/the-architect` | `[SKILL]` | **Installed** (`the-architect` in `~/.claude/skills` and registry) | Architecture decision and design skill. |
| `refactoring.guru/es/design-patterns` | `[REF]` | **Missing** | Spanish design patterns reference; consult during component architecture decisions. |
| `open-design.ai` / `nexu-io/open-design` | `[MCP]` | **Installed** (`open-design` skill in `~/.claude/skills` and registry) | AI design platform; skill installed — MCP server connection still needs owner auth. |
| `davideast/stitch-mcp` | `[MCP]` | **UNKNOWN — verify** | Design-to-code MCP bridge; MCP connection status unconfirmed — needs `claude mcp list` check. |
| `anil-matcha/open-generative-ai` | `[REF]` | **Missing** | Generative AI design reference gallery; consult during creative direction only. |
| `Hainrixz/tododeia-animaciones` | `[SKILL]` | **Missing** | Animation skill for bento/maximalism UI; install for micro-interaction work. |

---

## Marketing / Ads

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `Hainrixz/claude-ads` | `[SKILL]` | **Missing** | Ad-copy generation skill; core to BuildAds module workflow. |
| `coreyhaines31/marketingskills` | `[SKILL]` | **Missing** | Marketing strategy and copy skills; supplements claude-ads for campaign planning. |
| `skills-sh/claude-seo` / `Hainrixz/claude-seo-ai` | `[SKILL]` | **Missing** | SEO audit and optimization skill; needed for organic discovery of the butcher PWA. |
| `Hainrixz/agente-pagokit` | `[SKILL]` | **Installed** (`agente-pagokit` in `~/.claude/skills` and registry) | Payment gateway integration skill (Clip, Conekta, MercadoPago); active and required. |
| `Hainrixz/humanizalo` | `[SKILL]` | **Installed** (`humanizer` under `claude-webkit` in registry) | Humanizes AI copy; already available via claude-webkit bundle. |
| `Hainrixz/construyeconia` | `[REF]` | **Missing** | Build-with-community framework; reference for affiliate / loyalty program design only. |

---

## Media / Voice / Video

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `Hainrixz/claude-banana` | `[SKILL]` | **Installed** (`claude-banana` in `~/.claude/skills` and registry) | Image prompt engineering skill; used for product and ad creative generation. |
| `heygen-com/hyperframes` | `[SKILL]` | **Installed** (`hyperframes` in `~/.claude/skills` and registry) | Headless Chrome + FFmpeg video renderer; key for ProductAds video pipeline. |
| `microsoft/VibeVoice` | `[REF]` | **Missing** | Voice UI reference; consult for WhatsApp voice note / ElevenLabs integration design. |
| `jordanrendric/claude-video-vision` | `[SKILL]` | **Missing** | Video transcription and analysis skill; needed for brain/videos/ phase (YouTube transcripts). |
| `Hainrixz/editor-pro-max` | `[SKILL]` | **Missing** | Advanced media editing skill; install for post-production on ad video assets. |

---

## WhatsApp

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `Hainrixz/whatsapp-agentkit` | `[SKILL]` | **Missing** | WhatsApp agent orchestration skill; required for customer notification and order flow. |
| `rmyndharis/OpenWA` | `[REF]` | **Missing** | Open WhatsApp Web API reference; review licensing and ToS before integration. |
| `czlonkowski/n8n-mcp` | `[MCP]` | **UNKNOWN — verify** | n8n workflow automation MCP; listed in PHASE 1 for connection — verify with `claude mcp list`. |

---

## Context / Quality

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `drona23/claude-token-efficient` | `[SKILL]` | **Missing** | Token optimization patterns; install to reduce cost on long agentic sessions. |
| `mksglu/context-mode` | `[SKILL]` | **Missing** | Context window management skill; pairs with token-efficient for deep research runs. |
| `juliusbrussee/caveman` | `[REF]` | **Missing** | Minimal-context reasoning framework; reference for prompt architecture decisions. |
| `rtk-ai/rtk` | `[REF]` | **Missing** | AI toolkit reference; consult for general agent patterns. |
| `tirth8205/code-review-graph` | `[SKILL]` | **Missing** | Graph-based code review skill; install to visualize review coverage across PRs. |
| `shanraisshan/claude-code-best-practice` | `[REF]` | **Missing** | Claude Code usage best practices guide; consult during session design and hook setup. |
| `Hainrixz/abogado-del-diablo` | `[SKILL]` | **Installed** (`abogado-del-diablo` in `~/.claude/skills` and registry) | Devil's advocate review skill; challenges decisions before committing to them. |
| `nidhinjs/prompt-master` | `[SKILL]` | **Installed** (`prompt-master` in `~/.claude/skills` and registry) | Prompt engineering skill; transforms vague requests into precise, load-bearing prompts. |
| `yusufkaraaslan/Skill_Seekers` | `[SKILL]` | **Missing** | Skill discovery and recommendation tool; install to surface relevant skills at session start. |
| `multica-ai/andrej-karpathy-skills` | `[REF]` | **Missing** | Karpathy-inspired AI education reference; consult for fundamentals-first teaching content. |
| `multica-ai/multica` | `[REF]` | **Missing** | Multi-context agent reference; review for parallel sub-agent patterns. |
| `nowork-studio/NotFair` | `[REF]` | **Missing** | Creative AI tooling reference; consult for non-conventional UX/copy approaches. |
| `obra/superpowers` | `[SKILL]` | **Missing** | Agent superpowers skill collection; install after core skills are stable. |

---

## Official

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `anthropics/skills` | `[SKILL]` | **Installed** (core SDD skills sourced from here; `sdd-*` in both skill dirs) | Anthropic's official skill collection; already installed via gentle-ai. |
| `anthropics/claude-cookbooks` | `[REF]` | **Missing** | Official Claude pattern cookbook; reference for advanced tool use and caching patterns. |
| `anthropics/claude-quickstarts` | `[REF]` | **Missing** | Official quickstart templates; reference for MCP setup and agent bootstrap. |
| `anthropics/anthropic-sdk-typescript` | `[REF]` | **Missing** | TypeScript SDK reference; consult when integrating Claude API directly in Express backend. |
| `Hainrixz/aprende-skill` | `[SKILL]` | **Missing** | Learning/teaching skill; install for onboarding documentation and educational content. |

---

## AI Frameworks (reference only — no extra runtime)

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `google/adk-python` | `[REF]` | **Missing** | Google Agent Development Kit; reference for multi-agent patterns — no Python runtime added. |
| `langchain-ai/langchain` | `[REF]` | **Missing** | LangChain reference; consult for chain/tool patterns — not added to stack. |
| `run-llama/llama_index` | `[REF]` | **Missing** | LlamaIndex reference; consult for RAG/retrieval patterns — not added to stack. |
| `crewAIInc/crewAI` | `[REF]` | **Missing** | CrewAI reference; consult for role-based agent crew patterns — not added to stack. |

---

## Scraping / Research

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `ScrapeGraphAI/Scrapegraph-ai` | `[MCP]` | **UNKNOWN — verify** | AI-powered scraping; MCP server requires install + API key via env var — verify connection. |
| `Apify` | `[MCP]` | **Not connected** | Web scraping and research platform. Keys rotated 2026-08-25; no longer blocked. To connect, the owner supplies `APIFY_TOKEN` through the environment at run time — never into a file. |

---

## Create Our Own

| Resource | Action | Installed? | Rationale |
|----------|--------|-----------|-----------|
| `productads-autonomo` | `[CREATE]` | **Missing** | Autonomous ad production skill; build with `skill-creator` to orchestrate Groq + ElevenLabs + Predis pipeline. |
| `ebac-workflow` | `[CREATE]` | **Missing** | EBAC practice delivery workflow; build with `skill-creator` to standardize React/TS exercise submissions. |
| `silver-security` | `[CREATE]` | **Missing** | Carni-specific security playbook skill; build with `skill-creator` — combines guardian-angel + agentshield patterns tuned for this stack. |

---

## Summary

### Counts by action code

| Action | Count |
|--------|-------|
| `[SKILL]` | 32 |
| `[REF]` | 22 |
| `[MCP]` | 7 |
| `[CREATE]` | 3 |
| **Total** | **64** |

### Installed state summary

| State | Count |
|-------|-------|
| Installed | 22 |
| UNKNOWN — verify | 4 |
| Missing | 38 |

---

### MISSING — needs install or creation

Skills to install (copy to `~/.claude/skills/` or via `gentle-ai skill install`):

1. `gsd-build/get-shit-done` — execution rhythm enforcement
2. `kepano/obsidian-skills` — Obsidian vault templating
3. `garrytan/gbrain` — CLI brain layer
4. `gentleman-guardian-angel` — security guardrails
5. `affaan-m/agentshield` — prompt-injection protection
6. `snyk/agent-scan` — vulnerability scanning
7. `Hainrixz/tododeia-animaciones` — animation skill for bento UI
8. `Hainrixz/claude-ads` — ad-copy generation (BuildAds core)
9. `coreyhaines31/marketingskills` — campaign planning
10. `skills-sh/claude-seo` / `Hainrixz/claude-seo-ai` — SEO optimization
11. `Hainrixz/construyeconia` → reclassified [REF]; track separately
12. `jordanrendric/claude-video-vision` — YouTube transcript ingestion
13. `Hainrixz/editor-pro-max` — ad video post-production
14. `Hainrixz/whatsapp-agentkit` — WhatsApp order notifications
15. `drona23/claude-token-efficient` — token cost control
16. `mksglu/context-mode` — context window management
17. `tirth8205/code-review-graph` — graph-based review coverage
18. `yusufkaraaslan/Skill_Seekers` — skill discovery at session start
19. `obra/superpowers` — expanded agent capability set
20. `Hainrixz/aprende-skill` — onboarding/teaching content

Skills to create with `skill-creator`:

1. **`productads-autonomo`** — autonomous ad production orchestrator (Groq + ElevenLabs + Predis)
2. **`ebac-workflow`** — EBAC practice delivery workflow
3. **`silver-security`** — Carni-specific security playbook

MCP servers to connect (status unknown):

- `ScrapeGraphAI/Scrapegraph-ai` — needs install + API key
- `Apify` — keys rotated 2026-08-25. Needs the owner to supply `APIFY_TOKEN` via the environment when connecting.
- `czlonkowski/n8n-mcp` — verify with `claude mcp list`
- `davideast/stitch-mcp` — verify with `claude mcp list`

---

### Blockers needing the owner

| Blocker | Detail |
|---------|--------|
| ~~**Apify key rotation**~~ | **RESUELTO 2026-08-25.** Las dos llaves filtradas fueron rotadas por el dueño y están muertas. La vigente no vive en el repo y se aporta por variable de entorno al conectar. Ver `docs/brain/security.md`. |
| **MCP auth — open-design** | `open-design` skill is installed but the MCP server (`nexu-io/open-design`) needs OAuth / API key authorization from the owner. |
| **MCP auth — Scrapegraph-ai** | Requires an API key; owner must supply via env var before the MCP can be connected. |
| **MCP status check** | Run `claude mcp list` to confirm whether `n8n-mcp`, `stitch-mcp`, and `playwright` are connected or need re-auth. |
| **Missing skills — owner decision** | Skills marked Missing under Marketing/Ads, Context/Quality, and Media/Voice/Video need owner confirmation before install (some may require paid API keys: ElevenLabs, Predis, HeyGen). |
| **`garrytan/gbrain` / `kepano/obsidian-skills`** | Depend on an Obsidian vault at `docs/brain/`; vault must be created (PHASE 4) before these are useful. |
