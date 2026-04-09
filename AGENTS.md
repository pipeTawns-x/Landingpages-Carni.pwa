# Carni-mvp Agent Entry Point

Este archivo existe para que herramientas como Copilot, Claude Code u otros agentes descubran reglas locales del repo.

La capa global del usuario (`stack-ia` / `gentle-ai`) sigue siendo la base principal y su orquestador debe permanecer activo.
La capa local de Carni-mvp solo agrega contexto especifico del producto, del repo y del human-in-the-loop.

La capa local de agentes, subagentes, skills y workflows del repo vive dentro de `agents/`.
La carpeta `.github/` queda reservada solo para integraciones que GitHub exige por convencion, como CI.

Lee primero:

1. `README.md`
2. `agents/AGENTS.md`
3. `docs/TASK_PLAN.md`
4. `docs/IMPLEMENTATION_PLAN.md`
5. `agents/orchestrator/carni-orchestrator.agent.md`

Si la tarea es de rediseño visual, consultar tambien `agents/STITCH_REDESIGN_PROMPT.md`.

Si una regla local entra en conflicto con la capa global del usuario, prevalece la capa global y la regla local debe simplificarse.
