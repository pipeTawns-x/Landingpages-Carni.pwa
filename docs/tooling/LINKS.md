# Lista de herramientas y recursos — Eduardo

Fuente única de los links que Eduardo ha compartido para el stack agéntico.
Vive en el repo para que deje de perderse en el chat. Si aparece un link nuevo,
se agrega aquí primero.

Estado de verificación: el 2026-08-27 se pasaron **los 73 repositorios de
GitHub por `gh api`**. Todos responden, ninguno es fork ni port, dos están
archivados (`agent-teams-lite`, `get-shit-done`). Eso verifica que existen y
están vivos — **no** que se hayan evaluado uno por uno. Ver
`docs/tooling/triage.md` para lo que sí se leyó a fondo.

---

## Gateways y enrutamiento de modelos

- https://github.com/diegosouzapw/OmniRoute — **verificado 22 ago 2026.**
  53,154 ⭐ · 7,255 forks · TypeScript · MIT · activo. Un endpoint local
  (`localhost:20128/v1`) que consolida 340+ proveedores con auto-fallback.
  Expone MCP. Trae RTK y Caveman integrados — dos entradas que ya están sueltas
  en esta lista.
  **Antes de adoptarlo, tres cosas del propio README:** (1) es un *fork* de
  `9router` y un puerto del proyecto Go `CLIProxyAPI`, no es original;
  (2) el `postinstall` puede escribir un `.env` local; (3) incluye
  MITM/TPROXY transparente que **instala una CA en el almacén de confianza
  del sistema**. Para un proyecto con llaves reales de Supabase, eso se decide
  a conciencia, no por inercia.
- https://github.com/rtk-ai/rtk — **auditado y skill escrita** el 2026-08-27:
  `rtk-token-proxy`. Sin MITM, sin CA, sin sudo, no toca el perfil de shell;
  escribe solo en `$HOME/.local/bin`. Apache-2.0. NO instalado — decide Eduardo.
- https://github.com/juliusbrussee/caveman

## Directorios de recursos

- https://itsfree.dev/es — 110 recursos gratuitos en 14 categorías, de midu.
  Sin registro. Útil para buscar la alternativa gratis antes de contratar algo
  del roadmap: email transaccional, monitoreo, almacenamiento de imágenes.

## Scraping e investigación con IA

- https://github.com/D4Vinci/Scrapling
- https://github.com/ScrapeGraphAI/Scrapegraph-ai
- https://github.com/vercel-labs/agent-browser
- https://github.com/browser-use/bux
- https://github.com/microsoft/playwright-mcp
- https://www.browser-harness.com/
- https://console.apify.com/
- https://github.com/Hainrixz/claude-webkit

## Contexto agéntico, memoria y grafos

- https://github.com/Gentleman-Programming/engram
- https://github.com/Gentleman-Programming/gentle-ai
- https://github.com/safishamsi/graphify
- https://github.com/davidkimai/Context-Engineering
- https://github.com/mksglu/context-mode
- https://github.com/garrytan/gbrain
- https://github.com/mixedbread-ai/mgrep
- https://github.com/Vinzent03/obsidian-git
- https://github.com/kepano/obsidian-skills
- https://github.com/drona23/claude-token-efficient

## Gentleman Programming

- https://github.com/Alan-TheGentleman
- https://github.com/Gentleman-Programming/gentleman-guardian-angel
- https://github.com/Gentleman-Programming/agent-teams-lite — **ARCHIVADO**
  por su autor, último push 2026-03-26. Sigue siendo la base de las
  instrucciones del orquestador. No deja de funcionar, pero no va a recibir
  arreglos. Verificado con `gh api` el 2026-08-27.
- https://github.com/Gentleman-Programming/Gentleman-Skills
- https://www.youtube.com/@gentlemanprogramming/videos

## Orquestación de agentes y specs

- https://github.com/crewAIInc/crewAI
- https://github.com/langchain-ai/langchain
- https://github.com/run-llama/llama_index
- https://github.com/google/adk-python
- https://github.com/Fission-AI/OpenSpec
- https://github.com/github/spec-kit
- https://github.com/Hainrixz/the-architect
- https://github.com/obra/superpowers
- https://github.com/BloopAI/vibe-kanban
- https://github.com/gsd-build/get-shit-done — **ARCHIVADO**, último push
  2026-05-31. 64.6k estrellas y congelado. Verificado el 2026-08-27.
- https://github.com/EvoMap/evolver
- https://github.com/multica-ai/multica

## Calidad, seguridad y revisión

- https://github.com/affaan-m/agentshield
- https://github.com/snyk/agent-scan
- https://github.com/tirth8205/code-review-graph
- https://github.com/Hainrixz/abogado-del-diablo
- https://github.com/hardikpandya/stop-slop
- https://github.com/shanraisshan/claude-code-best-practice
- https://github.com/affaan-m/ECC
- https://github.com/Hainrixz/cyber-neo — **skill escrita** el 2026-08-27:
  `cyber-neo-auditoria`. Auditoría OWASP 2025 / CWE Top 25 de solo lectura,
  con semgrep, trivy y gitleaks. No duplica a `ci-security-and-governance`
  (solo TruffleHog) ni a `supply-chain-defense` (solo `npm audit`).
  NO instalado — decide Eduardo.

### Rechazado

- https://github.com/Hainrixz/all-deploy — **no se adopta.** Enruta a
  Vercel, Railway, Docker+SSH y cloudflared. Los archivos de despliegue
  que reconoce son `vercel.json`, `railway.toml`, `fly.toml`, `Dockerfile`
  y `render.yaml` (su `SKILL.md:107`). **`netlify.toml` no está en la
  lista**, y este proyecto publica en Netlify. No detectaría ni su propia
  configuración. Escalón 5: queda anotado, no se escribe skill.

## Diseño y UI

- https://github.com/nolly-studio/cult-ui
- https://github.com/nutlope/hallmark
- https://open-design.ai/es/
- https://github.com/nexu-io/open-design
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/VoltAgent/awesome-design-md
- https://github.com/pbakaus/impeccable
- https://github.com/Hainrixz/tododeia-animaciones
- https://github.com/davideast/stitch-mcp
- https://refactoring.guru/es/design-patterns
- https://github.com/garrytan/gstack
- https://github.com/nowork-studio/NotFair

## Contenido, video y marketing

- https://github.com/Hainrixz/claude-ads
- https://github.com/jordanrendric/claude-video-vision
- https://github.com/remotion-dev/remotion
- https://github.com/microsoft/VibeVoice
- https://github.com/Hainrixz/editor-pro-max
- https://github.com/Hainrixz/humanizalo
- https://github.com/coreyhaines31/marketingskills
- https://github.com/skills-sh/claude-seo
- https://github.com/Hainrixz/claude-seo-ai

## Skills y aprendizaje

- https://github.com/anthropics/skills
- https://github.com/anthropics/claude-cookbooks
- https://github.com/anthropics/claude-quickstarts
- https://github.com/anthropics/anthropic-sdk-typescript
- https://github.com/yusufkaraaslan/Skill_Seekers
- https://github.com/multica-ai/andrej-karpathy-skills
- https://github.com/Hainrixz/aprende-skill
- https://github.com/Hainrixz/construyeconia

## Integraciones y pagos

- https://github.com/Hainrixz/agente-pagokit
- https://github.com/Hainrixz/whatsapp-agentkit
- https://github.com/rmyndharis/OpenWA
- https://github.com/czlonkowski/n8n-mcp
- https://supabase.com/docs/guides/ai-tools/mcp

## Comunidad tododeia

- https://www.tododeia.com/community
- https://www.tododeia.com/community/crea-contenido-con-claude
- https://www.tododeia.com/community/agencia-marketing-claude
- https://www.tododeia.com/community/higgsfield-mcp
- https://www.tododeia.com/community/stack-ai-contenido
- https://www.tododeia.com/community/kit-extraccion-claude

## Videos

Verificado: `JPZkbGgJNUQ` = *"La EVOLUCIÓN del contexto compartido entre
AGENTES: Engram Cloud"* — Gentleman Programming. El resto sin ver.

- https://www.youtube.com/live/-a58SJXxrmk — **nuevo el 2026-08-27**, sin ver
- https://youtu.be/JPZkbGgJNUQ
- https://youtu.be/UoS_LP-PCG8
- https://youtu.be/6ChZMEMJ8hA
- https://youtu.be/3xLpDc_6uVI
- https://youtu.be/SOxuW5K2FFY
- https://youtu.be/X0oHLHIL7Mk
- https://youtu.be/KILEn2VSXX8
- https://youtu.be/5Q7jV8TpMXA
- https://youtu.be/EF5d0zGxYiY
- https://youtu.be/3spCFnMSGIY
- https://youtu.be/eZkdvPMBwYI
- https://youtu.be/l7ll5zTLHso
- https://youtu.be/lqbZfBBcLUY
- https://youtu.be/hY6TqQvlMRE
- https://youtu.be/nNdPT-FhlLU  *(Supabase con IA es una Locura — Fazt Code)*
- https://youtu.be/rqXzTBYHB3A
- https://www.youtube.com/live/uRzoVP63RiI
- https://www.youtube.com/live/V-eiE0M-mWM
- https://www.youtube.com/live/0DhghJpWwVQ
- https://www.youtube.com/live/GarWqdHzwac

## PDFs

- https://thebigschool.com/wp-content/uploads/2026/02/7_Prompts_para-Programar_mas_rapido.pdf
- https://thebigschool.com/wp-content/uploads/2025/09/EBOOK_200_PROMPTS_MDEV1.pdf

---

## Nota de seguridad

Las dos llaves de Apify que se filtraron en sesiones anteriores fueron
**rotadas por el dueño el 2026-08-25 y ya no sirven**. La vigente se llama
`Carniweb` y no vive en este repositorio.

La regla sigue en pie: **ninguna llave de Apify vuelve a escribirse acá** —ni
en `.env`, ni en un documento, ni en un mensaje de commit, ni en la memoria de
un agente. Cuando se conecte el MCP de Apify, la llave la aporta el dueño por
variable de entorno en tiempo de ejecución.

Ver `docs/brain/security.md`, sección "Apify keys — rotated, and the rule that
outlives them", para el detalle de qué se aprendió del incidente.
