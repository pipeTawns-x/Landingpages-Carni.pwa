# Investigación — contexto agéntico, memoria y scraping

**Fecha**: 2026-08-21 · **Método**: todo ejecutado en esta máquina. Lo que no se
pudo comprobar dice **NO VERIFICADO** y explica qué faltó.

---

## Paso 0 · ¿Engram ya tenía la lista de links?

**No.** Se sospechaba que `LINKS.md` era redundante porque Engram supuestamente
ya tenía todo desde hace meses. Es falso.

Comparación de URLs, normalizando protocolo, `www.`, barra final y query string,
excluyendo `localhost`:

| | URLs únicas |
|---|---|
| `docs/tooling/LINKS.md` | **106** |
| Engram (toda la DB, 487 observaciones) | **57** |
| Solo en Engram | 36 |
| **Solo en LINKS.md** | **85** |
| En ambos | 21 |

**Engram tenía 21 de 106.** Escribir el `.md` a mano no fue duplicar trabajo:
fue recuperar el 80% que se había perdido en el chat.

Acción tomada: los 85 ausentes se guardaron en Engram como observación `#487`
(`reference`, proyecto `carni-mvp`).

Gotcha metodológico: sin normalizar `www.` y la barra final, el diff daba 89 y
17. Cuatro falsos positivos. **Al comparar catálogos de URLs, normalizar antes
de diffear.**

### Los 13 recursos que Engram tenía y `LINKS.md` no

Descartando endpoints, `localhost`, PRs del propio proyecto y sitios de
competencia, quedan como candidatos reales a agregar:

```
github.com/anil-matcha/open-generative-ai
github.com/bradautomates/claude-video
github.com/emilkowalski/skills
github.com/gentlemangrouping
github.com/nowork-studio/toprank
mcp.higgsfield.ai/mcp
open-design.ai/install.sh
saleads.ai
tododeia.com/community/claude-ads
tododeia.com/community/guia-skills-claude
tododeia.com/community/whatsapp-agentkit
youtube.com/live/uxdQGdTGf8I
youtube.com/live/x0YoHwt_1IY
```

**NO VERIFICADO**: no se agregaron a `LINKS.md` todavía — se dejan aquí para que
Eduardo decida cuáles entran, porque varios pueden ser ruido de sesiones viejas.

---

## Paso 2 · Lo real y el cascarón

| Herramienta | Qué hace | ¿Instalada? | ¿Guarda contexto? | ¿Sirve? |
|---|---|---|---|---|
| **engram** | Memoria persistente entre sesiones y agentes | ✅ `/opt/homebrew/bin/engram` v1.10.0 | **Sí, de verdad** | **Sí — es la pieza central** |
| **gentle-ai** | Configurador de ecosistema: convenciones, skills, reglas | ✅ `/opt/homebrew/bin/gentle-ai` | **No, ni lo pretende** | Sí, pero para otra cosa |
| **graphify** | Grafo del repo desde AST, sin LLM | ✅ binario + skill | Parcial: estructura de código | Sí — ahorra tokens |
| **scrapling** | Scraping adaptativo | ⚠️ **instalada pero rota** | No | Todavía no |
| **markitdown** | HTML/PDF/docx → markdown | ✅ `/opt/anaconda3/bin/markitdown` | No | Sí, como conversor |
| **browser-harness** | Control de navegador vía CDP | ✅ skill | No | Sin probar |
| **yt-dlp** | Bajar video y subtítulos | ✅ `/opt/anaconda3/bin/yt-dlp` | No | **Sí — probado 13 veces** |
| firecrawl · crawl4ai | Scraping con IA | ❌ no instaladas | — | — |

### Engram — NO es un cascarón

La duda era si guarda decisiones y conversaciones, o solo indexa archivos.
**Guarda decisiones.** Prueba dura, `engram stats` + la tabla `observations`:

```
487 observaciones · 451 sesiones · 9 proyectos

architecture 166 · session_summary 72 · decision 49 · config 46
bugfix 42 · discovery 35 · pattern 29 · passive 13 · preference 13
learning 10 · reference 6 · feature 2 · security 2 · documentation 1
```

`decision`, `bugfix`, `pattern`, `preference`, `learning` no son índices de
archivos: son razonamiento. El contenido es estructurado —What / Why / Where /
Learned— con fecha y proyecto.

**Responde la pregunta 4** (¿resuelve que Claude Code, OpenCode y Kimi compartan
contexto?): **sí, en una misma máquina**, porque los tres apuntan al mismo
SQLite vía MCP. `engram setup <agente>` instala la integración para `opencode`,
`claude-code`, `gemini-cli` y `codex` — está en su `--help`.

Entre **máquinas distintas** hace falta Engram Cloud (ver abajo). **NO
VERIFICADO**: no se probó Kimi, que no aparece en la lista de `engram setup`.

### gentle-ai — no es cascarón, es otra cosa

La sospecha era que su registry no guarda contexto. **Confirmado, textual**, en
`.atl/skill-registry.md:20`:

> **Delegator use only.** This registry is an index, not a summary. Any agent
> that launches subagents reads it to select relevant skills, then passes exact
> `SKILL.md` paths for the subagent to read before work.

Pero eso no lo vuelve inútil: **un índice haciendo de índice no es un
cascarón.** El error es esperar que guarde memoria. Su trabajo es enrutar
skills; el de Engram es recordar. Son capas distintas.

Ojo con una cosa: el registry **se desactualiza**. Marcaba `graphify`,
`playwright-mcp` y `browser-harness` como ausentes cuando ya estaban
instalados. Verificar contra disco antes de creerle.

### Scrapling — cascarón parcial, y tiene arreglo

El binario está en `/opt/anaconda3/bin/scrapling`, pero **ningún fetcher
arranca**:

```
ModuleNotFoundError: No module named 'curl_cffi'
```

El arreglo está en su propio `--help`: `scrapling install`, que baja las
dependencias de todos los fetchers.

**NO VERIFICADO**: no se ejecutó porque instalar requiere autorización.

Dato que sí se confirmó y es importante: **Scrapling expone servidor MCP**.

```bash
scrapling mcp            # stdio
scrapling mcp --http     # streamable-http
```

---

## Paso 1 · Lo que salió de los videos

Tres transcripciones bajadas con `yt-dlp` y guardadas en
`docs/brain/videos/transcripts/`. Se usó yt-dlp, no Scrapling, porque Scrapling
está roto.

### `6ChZMEMJ8hA` — "Tu agente de IA está CIEGO" · 18:07 · 13 ago 2026

El más útil de los tres, y el más nuevo.

**El problema** (min ~2): tu agente corre en un servidor con IP de data center.
Hay listas públicas de rangos ASN. La escalera de bloqueo es siempre la misma:
*rate limit → CAPTCHA → baneo de IP*. Resultado, un 403 y cero contenido.

> "Tu agente es un genio, pero está ciego."

**La solución** (min ~5): proxy residencial. Una IP real de una red doméstica
real de un país real. Herramienta del video: **DataImpulse** — 90M IPs, 195
países, pago por GB sin suscripción ni expiración.

**Configuración, solo 4 datos**: login, password, host `gw.dataimpulse.com`,
puerto `823` (HTTP/HTTPS rotativo). SOCKS5 en 824, sticky del 10000 al 20000.

**Sintaxis de parámetros**, que según él no está clara en la documentación:
`__` abre parámetros · `;` separa parámetros · `.` separa clave de valor · `,`
separa múltiples valores. Ejemplo: `cr.ar` para Argentina.

**La decisión de arquitectura, que es lo que hay que llevarse** (min ~11): lo
montó como **MCP, no como variable de entorno**.

> "Si vos haces eso, cualquier petición que haga el agente las va a hacer todas
> a través del proxy residencial... le estás metiendo latencia a cada token."

Su MCP expone dos tools: `fetch_page` y `check_exit_ip`. Unas 30 líneas, con
Zod para validar.

**Las reglas que recomienda poner en `AGENTS.md`** (min ~14):

- Para leer una página pública, usar `fetch_page`, **no** `webfetch`
- Si el contenido depende del país, pasar `country` explícito siempre
- Si haces varias peticiones al mismo sitio, usar la misma sesión
- **Si te devuelve 403, no reintentes igual** — cambia de país o fija sesión

**La prueba** (min ~16): misma URL que daba 403. Con `country=ar` seguía
fallando; con Estados Unidos devolvió 412 propiedades con precios reales.

> "Es el mismo agente, el mismo modelo, la misma prompt. La única diferencia es
> por dónde salió. Solamente le di ojos."

Y la tesis de fondo:

> "El cuello de botella no está en el modelo, es el acceso que se le da al
> modelo."

### `JPZkbGgJNUQ` — "Engram Cloud" · 27:40 · 2 may 2026

**El problema**: cada máquina tiene su propio SQLite de Engram. La del trabajo
no sabe lo que aprendió la personal.

**Qué es**: explícitamente **no** es SaaS. Es **local-first** — el SQLite local
sigue siendo la fuente de la verdad. Si el servidor se cae, seguís trabajando.

**Hace tres cosas**: replica la memoria entre tus propias máquinas, copiada por
proyecto · da un dashboard en el navegador para que vos veas qué tiene tu
agente en la cabeza · **lo desplegás en tu propia infraestructura**.

**Autenticación, dos caminos**: las máquinas usan Bearer token; los humanos
hacen login y el servidor firma una cookie **HMAC-256 válida 8 horas**.

**Seguridad en 5 etapas**, y la que más importa: aunque tengas el token
correcto, si tu proyecto no está en la allowlist, rechazado.

**Auto-sync**: ciclo con tick cada **30 segundos**.

**Qué necesita la VPS**: root por SSH, Linux moderno, Docker, reverse proxy,
HTTPS con Let's Encrypt, DNS apuntable.

El comando manual `engram sync` ya existía antes de Cloud.

### `UoS_LP-PCG8` — "El ECOSISTEMA que le falta a tu agente" · 30:37 · 21 mar 2026

Tutorial de instalación del stack completo con un comando. Es el más viejo de
los tres y el que menos aporta ahora, porque el stack **ya está instalado en
esta máquina**. Se deja transcrito por si hace falta consultarlo.

### Lo que NO se hizo del Paso 1

**NO VERIFICADO**: no se raspó el listado completo del canal
`youtube.com/@gentlemanprogramming/videos`. Se bajaron los tres videos que
nombraste explícitamente, por ID. Sacar el catálogo entero del canal es
posible con `yt-dlp --flat-playlist` sobre la URL del canal, pero no se ejecutó
para no gastar contexto en 200+ títulos sin criterio de filtro.

La skill `/last30days` **no existe** en esta máquina — se verificó antes de
intentar invocarla, como pediste.

---

## La recomendación — una sola

**Arreglá Scrapling y montalo como MCP. En ese orden, y nada más por ahora.**

Por qué esta y no otra:

Ya tenés memoria que funciona (Engram, 487 observaciones reales), ya tenés
grafo (graphify, 1243 nodos), ya tenés orquestación (gentle-ai + 9 agentes).
**Lo único que te falta de verdad es que el agente pueda leer el mundo real.**

Y el arreglo es de un comando —`scrapling install`— sobre algo que ya está en
tu disco. No es instalar una herramienta nueva: es terminar de instalar una que
quedó a medias.

Una vez arreglada, `scrapling mcp` la expone a Claude Code, OpenCode y Kimi por
igual, sin escribir código. Eso convierte una biblioteca de Python en una
capacidad compartida por los tres agentes.

El proxy residencial del video viene **después**, y solo si te topás con 403 de
verdad. Es un gasto mensual y una complejidad que no necesitás hasta que un
sitio te cierre la puerta.

---

## Lo que NO se pudo verificar

- **Si `scrapling install` arregla los fetchers.** No se ejecutó: instalar
  requiere tu autorización. Es lo primero a probar.
- **El listado completo del canal de Gentleman.** Solo los 3 videos que
  nombraste, por ID.
- **Kimi con Engram.** `engram setup` lista `opencode`, `claude-code`,
  `gemini-cli` y `codex`. Kimi no aparece. Habría que ver si acepta un MCP
  genérico por stdio.
- **Engram Cloud.** Nada probado — requiere VPS con Docker, y Docker está
  apagado en esta máquina.
- **DataImpulse ni ningún proxy residencial.** No hay ninguno configurado aquí.
  Todo lo del video es lo que él documenta, no lo que se probó.
- **browser-harness y Playwright MCP.** Instalados pero sin ejercitar contra
  una página con JavaScript.
- **Firecrawl, 21st.dev, Higgsfield.** No instalados, no probados.

---

## Entregables de esta sesión

```
~/.claude/skills/investigador/SKILL.md              nueva, con comandos verificados
docs/tooling/investigacion-contexto-agentico.md     este documento
docs/brain/videos/transcripts/
  gentleman-agente-ciego-ojos-mundo-real__6ChZMEMJ8hA.txt      18.5 KB
  gentleman-engram-cloud__JPZkbGgJNUQ.txt                      26.5 KB
  gentleman-ecosistema-engram-sdd-skills__UoS_LP-PCG8.txt      34.2 KB
Engram #487                                          los 85 links ausentes
```

**Nada commiteado.** Eduardo revisa antes.
