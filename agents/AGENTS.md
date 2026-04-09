# AGENTS.md — Reglas Locales de Carni-mvp

Estas reglas son locales al repo.
No sustituyen `stack-ia` ni `gentle-ai`; solo agregan contexto del producto, del flujo de trabajo y de las restricciones tecnicas de Carni-mvp.
El orquestador principal sigue viviendo en la capa global del usuario y debe mantenerse activo.

## Prioridad de Capas

1. Capa global del usuario: `stack-ia` / `gentle-ai`
2. Reglas locales de Carni-mvp
3. Instrucciones ad hoc de una tarea puntual

Si una regla local contradice la capa global, gana la capa global.

## Objetivo del Repo

Carni-mvp es un MVP frontend para una carniceria con landing, catalogo, auth, carrito, PWA y dashboard admin base.

La meta local es evolucionar el producto sin romper la base funcional actual.

## Reglas para Desarrolladores y Colaboradores

- Mantener entrypoints HTML en raiz: `index.html`, `products.html`, `accessweb.html`, `dashboar.html`.
- No renombrar rutas ni mover HTML sin revisar referencias en JS, CSS, manifest y service worker.
- Mantener SCSS 7-1 dentro de `css/` y JS modular dentro de `js/modules/`.
- Variables publicas del frontend solo con prefijo `VITE_*`.
- El contrato local de entorno es `.env`; no agregar archivos espejo de entorno ni duplicados documentales.
- No hardcodear secrets en codigo fuente.
- Todo comando `npm` se ejecuta dentro de Docker o `.devcontainer/`; nunca en el host.
- El flujo de Node/Vite se ejecuta dentro de `.devcontainer/`.
- Documentar como actual solo lo que realmente existe y funciona en el repo.

## Reglas para Agentes, MCPs y Herramientas de IA

- No crear una segunda plataforma agentica dentro del repo.
- Toda la capa local de agentes, subagentes, skills y workflows del repo debe vivir dentro de `agents/`.
- `.github/` solo puede usarse para integraciones que GitHub requiere por convencion, por ejemplo `workflows/`.
- Mantener esa capa minima, enfocada en Carni-mvp y compatible con `gentle-ai`.
- Usar estas reglas locales solo para restricciones del producto y del repo.
- No tocar otros proyectos del workspace cuando el usuario delimite el alcance a Carni-mvp.
- Antes de cambios estructurales, borrados, renombres o limpieza agresiva, aplicar human-in-the-loop.
- La orquestacion obligatoria de tareas complejas sigue el stack global; esta capa local solo define guardrails de producto.

## Human In The Loop

Se requiere aprobacion explicita antes de:

- borrar archivos o carpetas fuera de lo pedido exactamente
- renombrar rutas publicas o assets usados por la web
- mover estructura HTML, CSS o JS que pueda romper paginas
- cambiar contrato de variables de entorno o integraciones
- introducir una capa local nueva de instrucciones/skills/agentes

## Contexto Visual y Producto

- La direccion visual objetivo es maximalismo mexicano equilibrado.
- El dashboard debe sentirse operativo, no generico.
- El rediseño puede evolucionar a bento grid si mantiene claridad comercial.
- Astro, Tailwind y Alpine son objetivos de evolucion, no estado actual del repo.

## Archivos Locales de Referencia

- `README.md`
- `docs/TASK_PLAN.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `agents/STITCH_REDESIGN_PROMPT.md`
- `agents/orchestrator/carni-orchestrator.agent.md`
- `agents/agents/*.agent.md`
- `agents/subagents/*.agent.md`
- `agents/skills/*/SKILL.md`
- `agents/workflows/*.md`

## Limite de Esta Capa Local

Este repo no debe replicar la estructura completa de VESTA-dashboard.
Solo debe conservar reglas y contexto local utiles para colaboradores humanos y agentes.
Los agentes y skills locales deben permanecer pequenos, especificos y orientados al dominio de Carni-mvp.

## Roles Locales Disponibles

- `carni-orchestrator`: coordina tareas locales del repo y delega por dominio.
- `security-guardian`: revisa secretos, auth, RLS y criterios estilo Prowler.
- `devops-captain`: valida Docker, CI, pipelines y gobernanza de entrega.
- `ai-engineer`: diseña integraciones IA, prompts, n8n y automatizacion local.
- `carni-frontend-specialist`: trabaja UI, HTML raiz, SCSS 7-1, PWA y Vite.
- `carni-node-backend-planner`: aterriza la evolucion Node, Supabase, n8n y APIs.
- `carni-docs-curator`: mantiene README, entregables, roadmap y contexto tecnico veraz.

## Skills Locales Activos

| Skill                           | Descripcion                                        | Trigger principal            |
| ------------------------------- | -------------------------------------------------- | ---------------------------- |
| `carni-frontend-guardrails`     | preserva rutas, assets, PWA y consistencia visual  | frontend, SCSS, PWA, Vite    |
| `carni-node-ebac`               | valida la capa Node y exige npm solo en contenedor | Node.js, npm, Docker         |
| `carni-release-check`           | revisa entregas y claims del repo                  | release, PR, entrega         |
| `api-design-dashboard-safe`     | define endpoints seguros y checklist defensivo     | API, dashboard, security     |
| `supabase-postgres-vesta-style` | diseña esquemas, roles y RLS multi-tenant          | Supabase, PostgreSQL, RLS    |
| `devops-docker-dashboard`       | fija comandos Docker y operacion local             | Docker, compose, pipelines   |
| `ci-security-and-governance`    | endurece CI con escaneo y gates                    | CI, TruffleHog, governance   |
| `n8n-workflow-method-local`     | documenta triggers, errores y reintentos           | n8n, workflows, automation   |
| `analytics-tracking-dashboard`  | define eventos y metricas del dashboard            | analytics, metrics, Chart.js |
