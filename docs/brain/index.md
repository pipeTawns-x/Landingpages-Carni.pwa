# Carni-mvp Brain — Index

This is the knowledge vault for Carni-mvp ("Carnicería El Señor de La Misericordia", San Luis Potosí, México). It exists so that any future session — human or agent — has grounded context before building features.

Foundation phase rule: **this vault contains no features, only knowledge.**

## Map of content

- [[vision]] — full product vision: BuildAds, Kanban, Cart Trifásico, WhatsApp bot, Track Score
- [[architecture]] — real stack confirmation and repo layout
- [[agentic-stack]] — orchestrator, agents, subagents, skills, MCP inventory
- [[roadmap]] — the 8-phase sequenced delivery plan
- [[glossary]] — definitions of domain terms (BuildAds, Track Score, Tip Out, Pedido Trifásico, Kanban, HITL, etc.)
- [[security]] — hard rules: no `.env.example`, ignored agent config, Apify keys rotated and the rule that outlives them, the publishable key vs RLS, pnpm + ignore-scripts, HITL before publish

## Video / source notes

External sources to ground agentic work before each related planning session. See `videos/` folder:

- [[supabase-mcp-setup]] — PENDING (transcript not retrieved)
- [[ai-working-method-1]] — PENDING (transcript not retrieved)
- [[ai-working-method-2]] — PENDING (transcript not retrieved)
- [[ai-working-method-3]] — PENDING (transcript not retrieved)
- [[ai-working-method-4]] — PENDING (transcript not retrieved)
- [[ai-working-method-5]] — PENDING (transcript not retrieved)
- [[ai-working-method-6]] — PENDING (transcript not retrieved)
- [[ai-working-method-7]] — PENDING (transcript not retrieved)
- [[content-with-claude]] — transcript retrieved successfully

## Graph

- `graph/README.md` — graphify status (PENDING, not runnable in this environment — see note for exact command)

## How to use this vault

1. Before planning a new phase (e.g. Kanban, BuildAds wizard completion), read [[roadmap]] to confirm dependencies are met.
2. Before touching agents/skills/MCP config, read [[agentic-stack]].
3. Before any commit involving secrets, env files, or RLS policies, read [[security]].
4. When unsure what a domain term means, check [[glossary]] first.
