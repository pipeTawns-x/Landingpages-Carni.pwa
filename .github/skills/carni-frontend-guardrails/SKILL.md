---
name: carni-frontend-guardrails
description: 'Frontend guardrails for Carni-mvp. Use for root HTML pages, SCSS 7-1, responsive fixes, Vite build issues, PWA behavior, catalog UI, dashboard UI, cart, auth, or preserving route stability.'
user-invocable: true
---

# Carni Frontend Guardrails

## When to Use
- Editing `index.html`, `products.html`, `accessweb.html`, `dashboar.html`, or admin HTML pages
- Fixing Vite build issues tied to frontend files
- Adjusting SCSS inside the 7-1 structure
- Improving UI without breaking the existing MVP flows

## Procedure
1. Confirm the task stays inside Carni-mvp.
2. Trace references before renaming or moving frontend files.
3. Preserve root entrypoints and public navigation.
4. Keep SCSS inside `css/` and JS modules inside `js/modules/`.
5. Validate with targeted checks or build when appropriate.

## Hard Rules
- Do not rename root HTML pages without approval.
- Do not move assets or routes casually.
- Do not introduce a generic UI that ignores the repo's visual direction.
- Do not expose secrets through frontend code.

## References
- [frontend areas](./references/frontend-areas.md)