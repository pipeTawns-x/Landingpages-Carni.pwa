# Security — Hard Rules

Source: engram observations #414, #425, and standing project hard rules. These are non-negotiable for any agent or human working on Carni-mvp.

## Never create a `.env.example`

No `.env.example` file should ever be created in this repo. Never hardcode secrets in code, docs, or commit messages. If an example of env-var shape is needed, describe it in prose in a doc — never as a committed file with even placeholder values that could be mistaken for real ones.

## Leaked Apify key — rotation required

A previous session leaked an Apify API key. **Before adding Apify anywhere** (MCP config, code, docs), the owner must rotate the key at apify.com. This is flagged SECURITY CRITICAL in [[agentic-stack]] → Blockers. Do not reference the old key value anywhere, including in this vault.

## Supply Chain Defense

- Package manager: **pnpm**
- `ignore-scripts=true` — prevents arbitrary install-time script execution
- 3-day cooldown before adopting new packages — gives time for malicious-package reports to surface

See [[architecture]] for the confirmed stack this policy applies to.

## HITL before publish

Any AI-proposed action that has external or financial effect requires [[glossary#hitl|Human-In-The-Loop]] approval before execution:

- BuildAds campaign authorization (admin reviews → one-click Authorize → publish to Meta/TikTok/WhatsApp) — see [[vision#buildads--6-step-wizard]]
- `productads-autonomo` skill's stock-triggered campaign proposals (planned) — see [[agentic-stack]]
- `ebac-workflow` skill: practice work stays on `practicas-ebac` branch, HITL required before any merge to main — see [[agentic-stack]]

## RLS (Row-Level Security)

All Supabase tables handling customer or financial data (orders, profiles, tips_ledger, promotions) must enforce RLS policies. Sensitive logic (payment status transitions, tip-out calculation, score computation) runs server-side only — via Supabase Edge Functions or the local Express server — never trusted to client-side code. See [[architecture]] for where the Express server lives (`server/`).

## Planned skill: `silver-security`

Not yet created (see [[agentic-stack]] → What is missing). Intended to combine GGA pre-commit hook guidance with agentshield patterns: secret scanning, RLS audits, and supply-chain defense enforcement. Should encode the rules in this note as automated checks once built.

## MCP/OAuth handling

The Supabase MCP server in `.mcp.json` is pinned to a specific project and requires OAuth approval via the Claude Code TUI — this is an explicit owner action, never something an agent should attempt to bypass or auto-approve. See [[agentic-stack]] → Blockers requiring owner action.
