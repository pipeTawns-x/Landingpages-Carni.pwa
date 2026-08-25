# Knowledge Graph — Status

Status: **PENDING** — not runnable in this environment.

`graphify` (PyPI package `graphifyy`) is documented as installed per the [[../agentic-stack|agentic-stack]] inventory and `~/.claude/skills/graphify/SKILL.md`, but it is not actually present on this machine: `pip show graphifyy` returns "Package(s) not found" and the `graphify` CLI is not on PATH.

## Exact command to run once installed

```bash
pip install graphifyy
graphify install
# from repo root:
graphify .
```

This should populate this `graph/` directory (or `~/.graphify/graph.json` per the skill's documented output) with:

- Interactive HTML graph with search and filter
- Structured markdown report (high-degree concepts, unexpected connections)
- Persistent JSON graph, reused on future queries

## Recommended scope for first run

Per [[../roadmap|roadmap]] Phase 8, run graphify after Phases 2–7 are further along so the graph reflects real module structure (Kanban, BuildAds, Track Score) rather than just the current scaffold. A first/lightweight run now is still valid to validate the tool works — owner's call.

See [[../agentic-stack|agentic-stack]] for the skill description and when-to-use guidance already documented for graphify.
