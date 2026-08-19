# Handoff — Stack Connection Phase

**Created**: 2026-07-25 · **Owner decision**: execute in terminal, desktop session acts as QA.

This is the working order for connecting the full agentic stack to Carni-mvp. Read it top to bottom before acting. Do not improvise a different order — each step unblocks the next.

---

## 0. Load context first

```
mem_search(query: "handoff/terminal-stack-connect", project: "carni-mvp")
mem_search(query: "tools-status/triage-gap", project: "carni-mvp")
mem_search(query: "tools-status/stack-verified", project: "carni-mvp")
```

Then `mem_get_observation(id)` on each — search results are truncated.

Reference docs already in the repo:
- `docs/tooling/triage.md` — 64 resources with action codes
- `docs/brain/agentic-stack.md` — inventory of agents/skills/MCP
- `docs/index.md` — documentation map

---

## 1. Already done — do NOT redo

| Item | State | Evidence |
|---|---|---|
| Engram memory unification | **Done** | 405 observations + 111 sessions under `carni-mvp`; backup at `~/.engram-backup-20260725/` |
| 9 YouTube transcripts | **Downloaded** | 783 KB via yt-dlp; HTTP 429 no longer blocks |
| Graphify graph | **Built** | 831 nodes / 966 edges / 91 communities in `graphify-out/` |
| `.gitignore` | **Updated** | `graphify-out/` ignored |
| Apify key redaction | **Done** | 0 occurrences in engram or files; never in git history. Rotation still pending — see step 3 |
| Agentic layer audit | **Exists** | orchestrator + 3 agents + 3 subagents + 9 skills + 1 workflow under `agents/` |

Verify before assuming otherwise:

```bash
sqlite3 ~/.engram/engram.db "SELECT project, COUNT(*) FROM observations GROUP BY project ORDER BY 2 DESC;"
graphify query "BuildAds campaign flow" --budget 500
```

---

## 2. Hard guardrails

`bypass permissions` is ON. Nothing will stop a destructive action, so these are enforced by discipline:

1. **Do not push or merge `practicas-ebac`.** Commit `217cacd1` (React practice 1 & 2, 18 files, 949 lines) stays local until the research phase completes. This is an explicit owner decision.
2. **Do not modify product code** during this phase — no changes under `src/`, `server/`, `js/`, `css/`.
3. **Do not run `git push --force`, `git reset --hard`, or delete branches.**
4. **Do not `pip install` / `npm install -g` without stating the package and reason first.**
5. **One commit per work unit.** No mega-commits mixing tooling, docs, and config.
6. **Never commit a secret.** See step 3.

---

## 3. SECURITY — leaked Apify key

**Redaction is already done** (2026-07-25). Verified: zero occurrences of the full key in engram or in any file, and it never reached git history.

- `docs/tooling/triage.md` — literal replaced
- engram `#426`, `#427` — content redacted via SQL, FTS index rebuilt by trigger

**What remains is the owner's job and it is NOT optional:**

1. **Rotate the key** at `apify.com/account/integrations`. Redaction cleans up copies; it does not invalidate a key that already sat in plaintext. Only rotation does.
2. Put the **new** key in `.env` — already gitignored at `.gitignore:12`. Never in a tracked file.
3. Add only the variable *name* (`APIFY_TOKEN=`) to `.env.example`, never the value.

### Concept — a secret does not go in `.gitignore`

`.gitignore` excludes **files**, not strings. The key was a literal inside a documentation file that has 64 other useful rows; ignoring that file would discard the whole triage to hide 45 characters.

The correct pattern is always the same:

- **Secret values** live in `.env` → gitignored
- **Variable names** live in `.env.example` → tracked, so the team knows what to set
- **Documentation** references the variable name, never the value

Delegate any future secret handling to the `security-guardian` agent (`agents/agents/security-guardian.agent.md`), which already exists in this repo.

---

## 4. Authenticate Supabase MCP — read-only

**Decision: grant read-only scopes.** The default authorization URL requests `projects:write`, `database:write`, `edge_functions:write`, `environment:write` and `secrets:read`. This phase only needs to *read* the database to compare it against `docs/supabase-schema.sql`. Write access and secret reads are blast radius with no matching need — especially with `bypass permissions` ON.

Least privilege: grant what the task requires, not what the tool offers. Re-authorize with write scopes later, when a task actually writes.

### 4a. Pin read-only in config

Editing the URL once does not persist. Declare it in `.mcp.json` so it survives reconnects:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=wlikxgklwutxxazbhmkv&read_only=true"
    }
  }
}
```

### 4b. Restart and authorize

MCP config is read at startup. Restart Claude Code, then:

```
/mcp
```

Authorize `supabase` and `supabase-cloud`. Confirm the consent screen no longer lists `:write` scopes or `secrets:read` before approving.

If the browser errors on the `http://localhost:<port>/callback?code=...` redirect, copy the full URL from the address bar and complete it manually — that is a normal loopback-flow hiccup, not a failure.

### 4c. Leave `supabase-local` down

A third entry, `supabase-local` (`127.0.0.1:54321`), is refusing connections. That is the Supabase CLI dev stack, which runs on Docker — and Docker is intentionally out of scope this phase. Leave it down.

Three MCP entries for one service is config sprawl; each loads tool schemas every session. Clean that up after the stack is connected, not during.

### 4d. Verify

```bash
claude mcp list
```

Note: this runs in a separate process, so it reflects config, not necessarily the live session. Confirm inside the session too.

---

## 5. Close the triage gap

These 11 resources from the owner's master catalog are missing from `docs/tooling/triage.md`. Add a row for each with an action code (`[MCP]` / `[SKILL]` / `[REF]` / `[CREATE]`) and current install state.

| Resource | Note |
|---|---|
| `D4Vinci/Scrapling` | **Already installed** (pip, v0.4.9) — triage says nothing |
| `microsoft/playwright-mcp` | **Already connected** in `.mcp.json` — triage says nothing |
| `browser-harness.com` | **Already installed** as a skill — triage says nothing |
| `hardikpandya/stop-slop` | Code-quality filter |
| `davidkimai/Context-Engineering` | Context-window methodology |
| `remotion-dev/remotion` | Programmatic video (React) — relevant to Productads |
| `vercel-labs/agent-browser` | Headless browser for agents |
| `browser-use/bux` | Browser automation |
| `mixedbread-ai/mgrep` | Multimodal code search |
| `tododeia.com/community/higgsfield-mcp` | Higgsfield MCP |
| `bradautomates/claude-video` | Wrapper over yt-dlp + ffmpeg; adds frame extraction |

---

## 6. Correct stale entries

These documents claim things are missing that are already installed. Fix them against reality, do not trust the text:

- `docs/tooling/triage.md` — `graphify`, `playwright-mcp`, `browser-harness` are installed
- `docs/brain/agentic-stack.md` — graphify listed as PENDING; it is operational
- `docs/brain/graph/README.md` — says graph generation is PENDING; the graph exists in `graphify-out/`
- `~/.claude/skills/graphify/SKILL.md` — describes commands that no longer exist. Real API for v0.8.46:
  - `graphify update <path>` — rebuild from AST, no LLM, no tokens
  - `graphify query "<question>" --budget N` — BFS traversal with a token cap
  - `graphify affected "X"` — reverse impact analysis
  - `graphify explain "X"` / `graphify path "A" "B"`
  - Graph lives at `graphify-out/graph.json`, not `~/.graphify/`

---

## 7. Install the missing skills

From `docs/tooling/triage.md`, 20 resources are marked `[SKILL]` + Missing. Install them, then re-run the skill registry.

Priority order — highest project value first:

**Tier 1 (BuildAds / Productads core + UI motion)**
1. `emilkowalski/skills` — **new, not in the original catalog.** 7 animation/design skills from Emil Kowalski (Vercel, Linear; author of Sonner and Vaul): `emil-design-eng`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design`, `pick-ui-library`. Built specifically to stop AI from picking bad easings and motion. Install: `npx skills@latest add emilkowalski/skills`. Complements `hallmark` (anti-slop gate) and `impeccable` (polish pass); overlaps slightly with `Hainrixz/tododeia-animaciones` — evaluate both before keeping both.
2. `Hainrixz/claude-ads`
3. `coreyhaines31/marketingskills`
4. `Hainrixz/editor-pro-max`
5. `jordanrendric/claude-video-vision`

**Tier 2 (security — required before any deploy)**
5. `Gentleman-Programming/gentleman-guardian-angel`
6. `affaan-m/agentshield`
7. `snyk/agent-scan`

**Tier 3 (context economy)**
8. `drona23/claude-token-efficient`
9. `mksglu/context-mode`
10. `yusufkaraaslan/Skill_Seekers`

**Tier 4 (remaining)**
11. `gsd-build/get-shit-done`
12. `kepano/obsidian-skills`
13. `garrytan/gbrain` — owner already authorized: `bun install -g github:garrytan/gbrain`
14. `Hainrixz/tododeia-animaciones`
15. `skills-sh/claude-seo`
16. `Hainrixz/whatsapp-agentkit`
17. `tirth8205/code-review-graph`
18. `obra/superpowers`
19. `Hainrixz/aprende-skill`

After installing, refresh the index:

```
Skill(skill-registry)
```

---

## 8. Create the three project-specific skills

Use the `skill-creator` skill. Each one is defined in `docs/tooling/triage.md`:

1. **`productads-autonomo`** — stock monitor → BuildAds proposal → HITL authorize → publish
2. **`ebac-workflow`** — isolate practice work on `practicas-ebac`, never touch main, HITL before merge
3. **`silver-security`** — guardian-angel + agentshield patterns tuned to this stack (secret scanning, RLS audit, supply-chain defense)

---

## 9. Initialize OpenSpec

The `openspec` skill is installed but the repo has no `openspec/` directory. Initialize it so SDD artifacts have a file-based home alongside engram.

---

## 10. Process the video transcripts

9 transcripts, 783 KB total — roughly 200k tokens. **They do not fit in one context.** Process one per iteration and save each as an engram observation plus a note under `docs/brain/videos/`.

Order by value:

| # | Video | Why first |
|---|---|---|
| 1 | `x0YoHwt_1IY` — 2da Clase, Arquitectura de ARNESES (4h33) | New material: harness architecture + RDD |
| 2 | `uxdQGdTGf8I` — 1era Clase, Curso AI desde 0 (1h45) | Foundations for the above |
| 3 | `lqbZfBBcLUY` — Graphify + Claude Code | Directly applicable, graphify now live |
| 4 | `hY6TqQvlMRE` — Agent Loop Engineering | Short, high density |
| 5 | `eZkdvPMBwYI` — Code Review 4R + Skills | Feeds the review workflow |
| 6-9 | MoureDev course days | Broad, lower marginal value |

**The transcripts are already on disk** at `docs/brain/videos/transcripts/` (784 KB, gitignored as derived data). The reproducible fetch script lives beside them and *is* tracked: `docs/brain/videos/transcripts/grab.sh`. Re-run it only if the `.txt` files are missing. The working pipeline:

```bash
yt-dlp --skip-download --write-auto-subs --write-subs \
  --sub-langs "es.*" --sub-format json3 -o "%(id)s.%(ext)s" <URL>
```

Then flatten `events[].segs[].utf8` from the json3 file.

Note: `youtube-transcript-api` lists languages but fails to fetch (ParseError) — do not use it.

---

## 11. Commit the foundation docs

`main` carries roughly +1612 uncommitted lines: `docs/brain/`, `docs/blueprints/`, `docs/tooling/`, `docs/index.md`, plus modifications to `AGENTS.md`, `agents/AGENTS.md`, `docs/IMPLEMENTATION_PLAN.md`, `server/routes/buildads.ts`, `.atl/skill-registry.md`.

Split into reviewable work units — do not commit it as one blob. Confirm `server/routes/buildads.ts` is an intended change before including it; it is the only product file in the set.

---

## Report back

When the phase is done, save to engram under topic `handoff/terminal-stack-connect` with: what was installed, what failed, what is still blocked, and which commits were created.
