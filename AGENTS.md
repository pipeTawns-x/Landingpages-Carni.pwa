# Carni-mvp Agent Entry Point

Este archivo existe para que herramientas como Copilot, Claude Code u otros agentes descubran reglas locales del repo.
Este es el unico archivo canonico de reglas de agentes para Carni-mvp (consolida el antiguo `agents/AGENTS.md`).

La capa global del usuario (`stack-ia` / `gentle-ai`) sigue siendo la base principal y su orquestador debe permanecer activo.
La capa local de Carni-mvp solo agrega contexto especifico del producto, del repo y del human-in-the-loop.

La capa local de agentes, subagentes, skills y workflows del repo vive dentro de `agents/`.
La carpeta `.github/` queda reservada solo para integraciones que GitHub exige por convencion, como CI.

## Prioridad de Capas

1. Capa global del usuario: `stack-ia` / `gentle-ai`
2. Reglas locales de Carni-mvp (este archivo)
3. Instrucciones ad hoc de una tarea puntual

Si una regla local contradice la capa global, gana la capa global y la regla local debe simplificarse.

## Objetivo del Repo

Carni-mvp es un MVP frontend para una carniceria con landing, catalogo, auth, carrito, PWA y dashboard admin base.
La meta local es evolucionar el producto sin romper la base funcional actual.

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

| Skill                            | Trigger                          | Uso principal                            |
| --------------------------------- | --------------------------------- | ------------------------------------------ |
| `carni-frontend-guardrails`      | frontend, PWA, Vite, SCSS         | mantener estable la UI actual              |
| `carni-node-ebac`                | Node.js, app.js, npm, Docker      | validar y evolucionar la capa Node         |
| `carni-release-check`            | entrega, PR, release              | revisar entregas y claims del repo         |
| `api-design-dashboard-safe`      | API design, dashboard, Prowler    | endpoints seguros y checklist defensivo    |
| `supabase-postgres-vesta-style`  | Supabase, PostgreSQL, RLS         | multi-tenant, esquemas y politicas         |
| `devops-docker-dashboard`        | Docker, compose, comandos         | operacion local y despliegue consistente   |
| `ci-security-and-governance`     | CI, TruffleHog, gates             | pipelines con escaneo y controles          |
| `n8n-workflow-method-local`      | n8n, workflows, triggers          | automatizaciones locales robustas          |
| `analytics-tracking-dashboard`   | analytics, eventos, Chart.js      | instrumentacion y metricas del dashboard   |

## Reglas para Desarrolladores y Colaboradores

- Mantener entrypoints HTML en raiz: `index.html`, `products.html`, `accessweb.html`, `dashboar.html`.
- No renombrar rutas ni mover HTML sin revisar referencias en JS, CSS, manifest y service worker.
- Mantener JS modular dentro de `js/modules/`.

### Estilos

- `css/` mantiene la arquitectura 7-1 para los estilos globales del sitio: variables, base, layout, paginas y componentes compartidos entre paginas HTML.
- Los componentes de React llevan su propia hoja de estilos co-locada en su carpeta, bajo `src/components/<Componente>/styles.scss`, compilada al `.css` hermano que importa el componente. Es el patron de co-locacion habitual en React y lo exige la actividad 6.28.9 de EBAC.
- Ningun otro directorio contiene SCSS.

- Variables publicas del frontend solo con prefijo `VITE_*`.
- El contrato local de entorno es `.env`; no agregar archivos espejo de entorno ni duplicados documentales.
- No hardcodear secrets en codigo fuente.
- Todo comando `npm` se ejecuta dentro de Docker o `.devcontainer/`; nunca en el host.
- El flujo de Node/Vite se ejecuta dentro de `.devcontainer/`.
- Documentar como actual solo lo que realmente existe y funciona en el repo.

## Servidor de desarrollo

Antes de cualquier tarea que dependa de la web —capturas, verificacion visual, medicion de rendimiento, revision de consola— comprobar que el servidor responde:

    curl -sI http://localhost:3002/index.html | head -1

Si no responde, levantarlo desacoplado de la sesion:

    nohup npm run dev > /tmp/vite.log 2>&1 &
    echo $! > /tmp/vite.pid
    sleep 4
    curl -sI http://localhost:3002/index.html | head -1

`nohup` evita que el proceso muera al terminar la sesion que lo lanzo. El PID queda registrado para detenerlo con `kill $(cat /tmp/vite.pid)`.

Nunca levantar el servidor como tarea en segundo plano del agente: ese proceso es hijo de la sesion y muere con ella.

Si no arranca, leer `/tmp/vite.log` antes de reintentar. Dos fallos seguidos significan revisar el log, no insistir.

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

## Seguridad

- Nunca hardcodear secrets.
- RLS en todas las tablas que lleguen a produccion.
- El escaneo y las barreras de seguridad deben quedar en CI.

## Limite de Esta Capa Local

Este repo no debe replicar la estructura completa de VESTA-dashboard.
Solo debe conservar reglas y contexto local utiles para colaboradores humanos y agentes.
Los agentes y skills locales deben permanecer pequenos, especificos y orientados al dominio de Carni-mvp.

## Referencias

- Prowler: https://github.com/prowler-cloud/prowler
- roadmaps.sh: Backend, Frontend, DevOps, AI Agents

## Archivos Locales de Referencia

- `README.md`
- `docs/index.md`
- `docs/TASK_PLAN.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `agents/STITCH_REDESIGN_PROMPT.md`
- `agents/orchestrator/carni-orchestrator.agent.md`
- `agents/agents/*.agent.md`
- `agents/subagents/*.agent.md`
- `agents/skills/*/SKILL.md`
- `agents/workflows/*.md`

Lee primero:

1. `README.md`
2. `docs/TASK_PLAN.md`
3. `docs/IMPLEMENTATION_PLAN.md`
4. `agents/orchestrator/carni-orchestrator.agent.md`

Si la tarea es de rediseño visual, consultar tambien `agents/STITCH_REDESIGN_PROMPT.md`.

Si una regla local entra en conflicto con la capa global del usuario, prevalece la capa global y la regla local debe simplificarse.
