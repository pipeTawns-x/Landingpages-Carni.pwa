# Skill Registry — Carni-mvp

This file is the local discovery index for SDD, stack-ia, and the Carni-mvp agentic layer.
Global stack-ia / gentle-ai remains the primary orchestration layer. The local layer only adds repo-specific guardrails and domain routing.

## Usage Rules

- Read this file before selecting local agents or skills.
- Prefer the global orchestrator first, then delegate into the local Carni layer when repo-specific context matters.
- Do not invent agents or skills outside this registry.
- Keep root HTML routes stable unless the user explicitly approves structural changes.

## SDD Context

- Project: Carni-mvp
- Persistence mode: engram
- SDD topic key: sdd-init/Carni-mvp
- No openspec directory is used for this project initialization.

## Local Orchestrator

- carni-orchestrator
  Path: agents/orchestrator/carni-orchestrator.agent.md
  Use for: multi-area Carni tasks spanning frontend, backend planning, docs, security, DevOps, or AI integration.

## Local Subagents

- carni-frontend-specialist
  Path: agents/subagents/carni-frontend-specialist.agent.md
  Use for: root HTML, SCSS 7-1, JS modules, Vite, responsive UI, PWA.
- carni-node-backend-planner
  Path: agents/subagents/carni-node-backend-planner.agent.md
  Use for: Node.js, backend evolution, Supabase integration, auth, APIs, n8n direction.
- carni-docs-curator
  Path: agents/subagents/carni-docs-curator.agent.md
  Use for: README, implementation notes, EBAC delivery context, truthful repo docs.

## Local Specialist Agents

- security-guardian
  Path: agents/agents/security-guardian.agent.md
  Use for: secrets, auth, RLS, trust boundaries, Prowler-style review.
- devops-captain
  Path: agents/agents/devops-captain.agent.md
  Use for: Docker, devcontainer, CI, pipelines, operational governance.
- ai-engineer
  Path: agents/agents/ai-engineer.agent.md
  Use for: AI integrations, prompts, n8n workflows, automation design.

## Local Skills

- analytics-tracking-dashboard
  Path: agents/skills/analytics-tracking-dashboard/
  Trigger: analytics, events, dashboard metrics, Chart.js.
- api-design-dashboard-safe
  Path: agents/skills/api-design-dashboard-safe/
  Trigger: API design, dashboard endpoints, secure patterns.
- carni-frontend-guardrails
  Path: agents/skills/carni-frontend-guardrails/
  Trigger: frontend, SCSS, Vite, root HTML, PWA guardrails.
- carni-node-ebac
  Path: agents/skills/carni-node-ebac/
  Trigger: Node.js, app.js, npm, Docker, EBAC layer.
- carni-release-check
  Path: agents/skills/carni-release-check/
  Trigger: releases, PR review, submission integrity.
- ci-security-and-governance
  Path: agents/skills/ci-security-and-governance/
  Trigger: CI, secret scanning, governance gates.
- devops-docker-dashboard
  Path: agents/skills/devops-docker-dashboard/
  Trigger: Docker, compose, local runtime, container operations.
- n8n-workflow-method-local
  Path: agents/skills/n8n-workflow-method-local/
  Trigger: n8n, workflow design, retries, automation structure.
- supabase-postgres-vesta-style
  Path: agents/skills/supabase-postgres-vesta-style/
  Trigger: Supabase, PostgreSQL, schemas, RLS, multi-tenant design.

## Local Convention Files

- AGENTS.md
- agents/AGENTS.md
- agents/STITCH_REDESIGN_PROMPT.md
- agents/orchestrator/carni-orchestrator.agent.md
- agents/workflows/local-agentic-flow.md

## Project Context Snapshot

- Frontend: Vanilla JS + SCSS 7-1 + Bootstrap + Vite multipage.
- TypeScript: present with tsconfig and typed domain models under ts/.
- Backend layer: Node.js EBAC script plus Supabase-backed JS modules.
- Product constraints: preserve index.html, products.html, accessweb.html, dashboar.html and current cart/auth/PWA behavior.
- Visual direction: maximalismo mexicano equilibrado.
- Operational rule: npm is expected in Docker or devcontainer according to local repo rules.
