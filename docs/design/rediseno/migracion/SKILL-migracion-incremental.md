---
name: migracion-incremental
description: "Trigger: migrar, migración, rediseño en el proyecto, strangler, no crear desde cero, migrate in place. Migrates an existing site page by page in place, never as a parallel rebuild."
license: Apache-2.0
metadata:
  author: "pipeTawns-x"
  version: "1.0"
---

## Activation Contract

Use when an existing site must adopt a new stack or design (for example static HTML + SCSS to React + Tailwind). The project already exists; the job is to IMPROVE it step by step, not to build another one next to it.

## Hard Rules

- Migrate in place. The existing entry files keep their names and routes (for Carni-mvp: index.html, products.html, accessweb.html, dashboar.html). Do not create a parallel page, a parallel folder of components that duplicates existing ones, or a new root HTML file.
- Extend or replace the existing module before writing a new one. Search first (rg, graphify), name the file you are replacing or reusing in the commit body.
- One slice per commit: one page, one component or one behavior. A commit that touches two pages is wrong.
- Keep every non-visual duty of the old page until the new one has parity: PWA manifest and service worker, SEO meta and structured data, analytics, accessibility features, redirects.
- Delete an old file only after the new one passes the parity checklist, and list the deletion in the commit body. Rollback is always `git revert <sha>` of one commit.
- Commits are conventional and bilingual: `type(scope): English summary / resumen en español`. No AI attribution. The body says what moved, what was reused and which routes were checked.
- If a route or filename changes, grep every reference first (manifest, service worker, sitemap, redirects, links, JS `location`, vite inputs, tests, docs) and update them in the same commit.
- Agents own disjoint files. The orchestrator is the only one who commits, verifies the result against the request and stops anything that duplicates.
- Save progress at every slice (state file in the repo + Engram, project lowercase) and stop at the budget gates of the active checkpoint skill.

## Decision Gates

| Situation | Action |
|---|---|
| The old page already does it (Lupa, cart drawer, header effect) | Port or restyle the old module; do not rebuild |
| The new design needs something the old page lacks | Add it inside the existing module, then mention it in the commit |
| Two slices want the same file | Sequence them; never run them in parallel |
| Parity is unclear | Write the old behavior as a checklist item and test it before deleting |

## Execution Steps

1. Inventory: per page, list scripts, styles, PWA links, meta, modules and behaviors (rg/graphify); note what React code already exists.
2. Map old to new and list everything the new code does not do yet.
3. Pick the smallest safe slice. Write its acceptance (measured at 390 and 1440) and its rollback.
4. Port the behavior first, then the look. Reuse tokens and primitives.
5. Run the gates (typecheck, tests, build, route and reference greps, captures) inside the project's container.
6. Review with fresh context against the map, then commit (bilingual message) and verify with `git log -1`.
7. Checkpoint (state file + Engram), then the next slice.

## Output Contract

Per slice return: files changed, files reused, old files deleted (if any), references updated, parity checklist with results, measurements, commit sha, next slice.

## References

- In Carni-mvp: `docs/design/rediseno/migracion/MAPA.md` (map and order) and `docs/design/rediseno/LOOP-OPENCODE.md` (the loop).
