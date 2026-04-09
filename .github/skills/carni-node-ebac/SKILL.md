---
name: carni-node-ebac
description: "Node.js and EBAC practice workflow for Carni-mvp. Use for app.js, package.json, axios, dotenv, CommonJS, Node validation, Dockerized npm flows, and evolving the project from EBAC basics toward a real backend roadmap."
user-invocable: true
---

# Carni Node EBAC

## When to Use

- Working on `app.js`
- Updating `package.json` for Node scripts
- Validating EBAC Node.js practice requirements
- Planning the next Node.js layer for Carni-mvp
- Connecting Node work with Supabase, APIs, Docker, or n8n roadmap

## Procedure

1. Separate current Node implementation from future backend roadmap.
2. Keep the educational Node script isolated from the frontend runtime.
3. Use public APIs or safe env-driven integrations for validation.
4. Prefer `.devcontainer/` as the canonical execution environment.
5. Capture follow-up evolution in terms of Express, DB, auth, testing, and deployment.

## Current Baseline

- `app.js` in root
- `axios`, `dotenv`, and `chalk`
- `npm run ebac`
- `npm run ebac:check`

## Recommended Evolution

1. Express API layer
2. Supabase/PostgreSQL data access
3. JWT or OAuth auth
4. Jest coverage for Node scripts and services
5. Docker + CI/CD + cloud deployment

## References

- [node roadmap](./references/node-roadmap.md)
