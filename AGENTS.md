# Carni-mvp Agent Entry Point

Este archivo existe para que herramientas como Copilot, Claude Code u otros agentes descubran reglas locales del repo.

La capa global del usuario (`stack-ia` / `gentle-ai`) sigue siendo la base principal y su orquestador debe permanecer activo.
La capa local de Carni-mvp solo agrega contexto especifico del producto, del repo y del human-in-the-loop.

La capa local de agentes, subagentes, skills y workflows del repo vive dentro de `agents/`.
La carpeta `.github/` queda reservada solo para integraciones que GitHub exige por convencion, como CI.

## Estructura agentica local

- `agents/orchestrator/`: orquestador local que coordina el trabajo del repo sin reemplazar stack-ia.
- `agents/agents/`: agentes de rol para seguridad, DevOps e integraciones IA.
- `agents/subagents/`: especialistas de implementacion por dominio.
- `agents/skills/`: workflows reutilizables y guardrails locales.
- `agents/workflows/`: flujos documentados y reglas operativas locales.

## Roles locales

- `carni-orchestrator`: coordina tareas locales y deriva por especialidad.
- `carni-frontend-specialist`: protege rutas HTML, UI, SCSS 7-1 y PWA.
- `carni-node-backend-planner`: aterriza Node, Supabase, APIs y roadmap backend.
- `carni-docs-curator`: mantiene README, entregas y estado documental veraz.
- `security-guardian`: revisa secretos, auth, RLS y riesgos de seguridad.
- `devops-captain`: cuida Docker, CI, pipelines y gobernanza de entrega.
- `ai-engineer`: aterriza integraciones IA, n8n, prompts y automatizacion local.

## Skills activos

| Skill                           | Trigger                        | Uso principal                            |
| ------------------------------- | ------------------------------ | ---------------------------------------- |
| `carni-frontend-guardrails`     | frontend, PWA, Vite, SCSS      | mantener estable la UI actual            |
| `carni-node-ebac`               | Node.js, app.js, npm, Docker   | validar y evolucionar la capa Node       |
| `carni-release-check`           | entrega, PR, release           | revisar entregas y claims del repo       |
| `api-design-dashboard-safe`     | API design, dashboard, Prowler | endpoints seguros y checklist defensivo  |
| `supabase-postgres-vesta-style` | Supabase, PostgreSQL, RLS      | multi-tenant, esquemas y politicas       |
| `devops-docker-dashboard`       | Docker, compose, comandos      | operacion local y despliegue consistente |
| `ci-security-and-governance`    | CI, TruffleHog, gates          | pipelines con escaneo y controles        |
| `n8n-workflow-method-local`     | n8n, workflows, triggers       | automatizaciones locales robustas        |
| `analytics-tracking-dashboard`  | analytics, eventos, Chart.js   | instrumentacion y metricas del dashboard |

## Seguridad

- Nunca hardcodear secrets.
- RLS en todas las tablas que lleguen a produccion.
- El escaneo y las barreras de seguridad deben quedar en CI.

## Referencias

- Prowler: https://github.com/prowler-cloud/prowler
- roadmaps.sh: Backend, Frontend, DevOps, AI Agents

Lee primero:

1. `README.md`
2. `agents/AGENTS.md`
3. `docs/TASK_PLAN.md`
4. `docs/IMPLEMENTATION_PLAN.md`
5. `agents/orchestrator/carni-orchestrator.agent.md`

Si la tarea es de rediseño visual, consultar tambien `agents/STITCH_REDESIGN_PROMPT.md`.

Si una regla local entra en conflicto con la capa global del usuario, prevalece la capa global y la regla local debe simplificarse.
