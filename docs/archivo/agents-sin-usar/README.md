# Capa agéntica retirada — 2026-08-27

Esto no lo leía ninguna herramienta. Claude Code solo descubre agentes en
`.claude/agents/` y skills en `.claude/skills/`, y el registro de `gentle-ai`
escanea ocho carpetas de las que `agents/` nunca fue una.

Estaba bien escrito y era invisible, que es peor que estar roto: alguien lo
lee y cree que el sistema está vivo.

**No se borró nada.** Se conserva aquí para poder consultarlo.

| Archivo | Qué era | Por qué se retiró | Con qué se reemplaza |
|---|---|---|---|
| `AGENTS.md` | Reglas de la capa local | Duplicaba el `AGENTS.md` de la raíz, que es el canónico y el que GGA usa como `RULES_FILE` | `/AGENTS.md` |
| `orchestrator/carni-orchestrator.agent.md` | Orquestador local | Ya portado, con frontmatter válido | `.claude/agents/carni-orchestrator.md` |
| `agents/*.agent.md` | 3 agentes de rol | Ya portados | `.claude/agents/{ai-engineer,devops-captain,security-guardian}.md` |
| `subagents/*.agent.md` | 3 especialistas | Ya portados | `.claude/agents/carni-{docs-curator,frontend-specialist,node-backend-planner}.md` |
| `workflows/local-agentic-flow.md` | Flujo documentado | Documentación, no ejecutable | Se conserva como referencia histórica |

**Lo que NO vino a parar aquí**, porque tenía contenido único y vivo:

- Las nueve skills de `agents/skills/` → movidas a `.claude/skills/`. Estaban
  bien formadas, con frontmatter válido; solo vivían donde nadie las escanea.
  Al moverlas, Claude Code las listó de inmediato.
- `STITCH_REDESIGN_PROMPT.md` → movido a `docs/blueprints/`. No es un agente:
  es un blueprint de rediseño visual, y sigue siendo documento vivo.
