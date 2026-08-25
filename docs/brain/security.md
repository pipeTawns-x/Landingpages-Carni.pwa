# Security — Hard Rules

Source: engram observations #414, #425, and standing project hard rules. These are non-negotiable for any agent or human working on Carni-mvp.

## Never create a `.env.example`

No `.env.example` file should ever be created in this repo. Never hardcode secrets in code, docs, or commit messages. If an example of env-var shape is needed, describe it in prose in a doc — never as a committed file with even placeholder values that could be mistaken for real ones.

Enforced mechanically since 2026-08-25: `.env.example` is listed in `.gitignore`, so the rule no longer depends on anyone remembering it.

### The shape of the environment, in prose

This is the description the rule above asks for, so nobody needs a file to find it out.

The frontend needs exactly two variables, both read by Vite at build time and therefore both visible in the browser bundle:

- `VITE_SUPABASE_URL` — the project's REST endpoint. For production it is the `https://<project-ref>.supabase.co` address from the dashboard. For local work it is `http://127.0.0.1:54321`, printed by `supabase status`. **Never `host.docker.internal`**: that name only resolves inside a container, and pointing the browser at it is why the frontend never reached the database until 2026-08-25.
- `VITE_SUPABASE_ANON_KEY` — the publishable key. See the section below on why this one is safe to ship.

Optional, and only needed by the pieces that use them: `APIFY_TOKEN` for the Apify MCP (still pending rotation, see above), and the Predis and ElevenLabs keys for BuildAds, which stay server-side and are frozen along with that module.

Anything prefixed `VITE_` ends up in the bundle. If a value must stay secret, it cannot carry that prefix.

## Files that must never reach the repository

Added to `.gitignore` on 2026-08-25, each for a reason worth stating:

- **`.env.bak-*`** — timestamped backups carrying real keys. None of the earlier rules caught them: `.env` matches exactly, and `.env.*.local` demands that suffix. Two of these sat untracked on disk before anyone noticed. They never reached git history, verified with `git log --all -- '.env.bak*'`.
- **`.mcp.json`** and **`.claude/settings.local.json`** — where AI tooling writes configuration on its own, which makes them exactly the kind of file a careless `git add .` sweeps up. Both were clean when checked, but that is luck, not design. `settings.local.json` was already covered by the machine's global gitignore; that protects whoever configured it, not whoever clones the repo, so the rule now lives in the project.

## The publishable key is public by design

`VITE_SUPABASE_ANON_KEY` — the publishable key, `sb_publishable_*` in the current naming — **is meant to be visible**. It ships inside the browser bundle by construction; there is no way to hide it and still have the frontend talk to Supabase. Treating it as a secret is a misunderstanding that leads to hiding the wrong thing.

What actually protects the data is **RLS**. The publishable key only says which project you are talking to; the row-level policies decide what you are allowed to read or write. A project with a public key and correct policies is safe. A project with a hidden key and no policies is not.

What must **never** appear in the browser, the repo, or a commit message:

- `sb_secret_*` and the legacy `service_role` key — both bypass RLS entirely
- The database password from *Project Settings → Database*

Those belong in the server environment or in the operator's hands, never behind a `VITE_` prefix.

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
