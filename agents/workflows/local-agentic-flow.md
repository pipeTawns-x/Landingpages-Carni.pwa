# Local Agentic Flow

## Purpose

This file documents the local workflow for Carni-mvp without competing with the user's global `stack-ia` layer.

## Local Flow

1. Start from `AGENTS.md`
2. Apply product restrictions in `agents/AGENTS.md`
3. Use `agents/orchestrator/carni-orchestrator.agent.md` when work spans multiple domains
4. Delegate to `agents/subagents/` by specialty
5. Load `agents/skills/` for repeatable local workflows

## Boundary With Stack-ia

- Local layer: product and repo context for Carni-mvp
- Global layer: memory, orchestration backbone, shared skills, and user-wide conventions
- If there is a conflict, the global layer wins

## Execution Rule

- Every `npm` command for Carni-mvp runs only inside Docker or the devcontainer
- Host-side `npm` execution does not count as valid validation for this repo

## Non-Agentic Platform Files

- `.github/workflows/ci.yml` is GitHub platform infrastructure
- It is not part of the local agentic layer even though it lives in `.github/`
