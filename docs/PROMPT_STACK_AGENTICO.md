# Construir el stack agéntico de verdad

**Para Claude Code. Ejecútalo en `~/Desktop/Carni-mvp`, rama `pruebas`.**

Esto no es trabajo de producto. **No toques `src/`, `js/`, `css/` ni ningún `*.html`.**
El bloque del carrito queda en pausa.

---

## 1 · Por qué existe este trabajo

Eduardo lleva meses acumulando herramientas. Tiene 50 skills registradas, 9 agentes,
una carpeta de agentes paralela, 108 links guardados, Engram con memoria, graphify
indexando el repo, y un registro que lo lista todo.

Y aun así, esta semana el trabajo se hizo a mano y salió mal.

**El caso concreto, del 26 de agosto de 2026.** Se pidió mejorar el diseño de una
rejilla de categorías. Nadie usó ninguna herramienta de diseño. El resultado: un
botón que quedó en `rgba(0,0,0,0)` porque delegaba el color a Bootstrap y perdía la
cascada, y una medición de contraste hecha **contra un color plano que nunca llega
solo a la pantalla** — se midió el velo, no los píxeles compuestos sobre la foto.

Ambos errores están cubiertos por skills que Eduardo **ya tenía instaladas**:
`ui-ux-pro-max` trae el piso de contraste, `impeccable` trae el anti-patrón exacto
de las rejillas uniformes.

Ninguna se disparó. Este es el motivo:

```
Skills instaladas y registradas:  50
Sin descripción:                  19   (38%)
```

**Una skill sin descripción nunca se dispara.** El agente no tiene con qué decidir
cuándo usarla. Existe en disco, ocupa una fila en el registro, y nadie la invoca
jamás. Las 19 mudas incluyen **todas** las de diseño.

Compara. Una que funciona:

> `carni-supabase` — *"Supabase patterns and conventions for Carni-mvp. Trigger when
> writing queries, migrations, RLS policies, or any Supabase interaction in this
> project."*

Una muda:

> `ui-ux-pro-max` — *—*

Misma carpeta, mismo formato, mismo agente. Una se invoca, la otra no.

**Lo que se arregla aquí no es una skill. Es la razón por la que no se usaron.**

### Lo que Eduardo quiere al terminar

Un equipo agéntico que funcione de verdad: skills que se disparan, agentes que
existen para Claude Code, subagentes que se delegan, y un orquestador que sabe qué
tiene y a quién mandarle cada cosa. No un inventario. Un equipo.

Y que se mantenga solo, para no repetir esto en dos meses.

---

## 2 · Contexto verificado

Medido el 26 de agosto de 2026. **Confírmalo, no lo asumas.** Si algo no coincide,
párate y dilo en vez de improvisar.

| Qué | Estado |
|---|---|
| `.atl/skill-registry.md` | Existe, 12 KB. Lo genera `gentle-ai skill-registry refresh`. Escanea 8 carpetas: `.claude/skills` del repo, y las de `~/.claude`, `~/.config/opencode`, `~/.gemini`, `~/.cursor`, `~/.copilot`, `~/.codex`, `~/.kiro`. **El índice ya existe: no lo construyas de nuevo.** |
| `.claude/skills/` | Solo 2 propias: `investigador`, `judgment-day` |
| `.claude/agents/` | 9 archivos `.md` |
| `agents/` (raíz) | Carpeta suelta con `AGENTS.md`, `STITCH_REDESIGN_PROMPT.md` y subcarpetas `agents/`, `orchestrator/`, `skills/`, `subagents/`, `workflows/` |
| `.mcp.json` | **Solo** `supabase` (read_only) y `playwright`. Engram NO aparece |
| Hooks de git | `pre-commit`, `post-commit`, `post-checkout` |
| `graphify-out/` | `graph.json`, `GRAPH_REPORT.md`, `manifest.json` |
| `docs/tooling/LINKS.md` | 108 links |
| GGA | v2.10.1, **sin proveedor configurado** tras actualizar. Si sigue roto al commitear, usa `--no-verify` y **dilo** |

**Las 19 skills mudas:**

```
abogado-del-diablo · agente-pagokit · awesome-design-md · building-components
chrome-bridge-automation · claude-banana · deep-research · frontend-design
humanizer · impeccable · playwright-cli · seo-audit · shadcn-ui
the-architect · ui-ux-pro-max · vercel-deploy · vercel-react-best-practices
web-design-guidelines · web-reader
```

**Dato que decide la fase 4:** Claude Code solo descubre agentes en `.claude/agents/`
y `~/.claude/agents/`, y los busca recursivamente. El `name` debe ser minúsculas y
guiones. `tools` es una cadena separada por comas con nombres de herramientas
**reales**. **Un frontmatter mal formado se salta en silencio, sin avisar** — ya pasó
aquí con 7 agentes que nadie sabía que estaban muertos.

---

## 3 · La regla que gobierna todo: nada de cascarones

Esta es la razón de ser del trabajo, así que va antes que las fases.

**Ningún artefacto se da por creado hasta que pasa su compuerta.** No hay "lo dejé
listo pero no lo probé". Si no pasa, no cuenta, y va a la lista de rechazados con
su motivo.

### Compuerta de una skill

Las cinco, todas:

1. **Origen alcanzado.** Si viene de un repo, se descargó su README y respondió 200.
   Si el repo está archivado o lleva más de un año sin `pushed_at`, **no se crea la
   skill**: se anota como descartada con esa razón.
2. **Frontmatter válido.** Se parsea sin error, con `name` en minúsculas y guiones,
   y `description` no vacía.
3. **Descripción que dispara.** Dice qué hace **y cuándo activarse**, con casos
   concretos. `"Herramienta de diseño"` no pasa. `"Trigger when reviewing contrast,
   spacing or type scale in a UI"` sí.
4. **Contenido verificable.** Al menos un comando, ruta o patrón concreto que
   **corriste o leíste del propio paquete**. Consejo genérico no pasa. Aplica la
   regla de la skill `investigador`: la salida de un comando manda sobre el `--help`,
   y el `--help` manda sobre el README. Tu memoria no es una fuente.
5. **Aparece en el registro.** Después de `gentle-ai skill-registry refresh --force`,
   sale listada **con su descripción**.

### Compuerta de un agente o subagente

1. Vive en `.claude/agents/`.
2. Frontmatter parsea, `name` en minúsculas y guiones, `description` no vacía.
3. `tools` lista solo herramientas que existen de verdad.
4. **Claude Code lo lista.** Compruébalo, no lo supongas.

### Compuerta del orquestador

1. Referencia `.atl/skill-registry.md` por ruta.
2. Sabe delegar pasando **rutas** de `SKILL.md`, nunca resúmenes. Es el contrato que
   el propio registro declara: el `SKILL.md` es la fuente de verdad, y un resumen la
   degrada y pierde la intención del autor.
3. Nombra a sus agentes por el `name` exacto con el que Claude Code los lista.

---

## 4 · Fase 1 — Recoger el contexto que ya existe. Solo lectura.

**No escribas ni un archivo en toda esta fase.**

### 1.1 · Reconocer el terreno

Invoca la skill `investigador` y corre su Paso 0. Después comprueba, uno por uno:

- **Engram.** ¿Responde? ¿Desde dónde está configurado: `.mcp.json` del proyecto,
  `~/.claude.json`, o global? ¿Cuántas observaciones tiene?
- **graphify.** ¿Responde? ¿`graph.json` está al día o es de hace semanas?
- **`gentle-ai`.** ¿Instalado? ¿Qué versión?

Si algo **no** responde, dilo y sigue sin ello. **No afirmes que consultaste una
memoria que no pudiste abrir.** Eso ya pasó en este proyecto y costó una sesión.

### 1.2 · Vaciar Engram

Esto es el corazón de la fase y no se puede saltar.

Engram guarda cientos de observaciones tipadas: `architecture`, `session_summary`,
`decision`, `config`, `bugfix`, `discovery`, `pattern`, `preference`, `learning`.
Ahí está el contexto que se perdió entre sesiones.

Sácalo todo y clasifícalo. **Una advertencia práctica:** su buscador tokeniza por
palabra suelta. **Busca por palabras, no por frases** — buscar `"stack agéntico"`
devuelve vacío donde `agentico` devuelve resultados.

Lo que necesito de vuelta:

- Cada **link** que aparezca en la memoria y **no** esté en `docs/tooling/LINKS.md`
- Cada **decisión** registrada que hoy no viva en ningún documento del repo
- Cada **preferencia** de Eduardo sobre cómo trabajar
- Cada **learning** o **bugfix** que debería ser una skill y no lo es
- Todo lo que se contradiga con lo que dicen los documentos del repo hoy

### 1.3 · Leer el grafo

`graphify-out/graph.json` y `GRAPH_REPORT.md` traen la estructura real del código.
Úsalos para saber qué módulos existen, cuáles están aislados y cuáles concentran
dependencias. Eso dice qué agentes hacen falta de verdad, en vez de inventarlos.

Si el grafo está viejo, dilo con su fecha y decide si vale regenerarlo.

### 1.4 · Por qué están mudas las 19

Abre las 19 `SKILL.md` y dame la causa de **cada una**. No las agrupes:

- ¿falta el campo `description`?
- ¿el YAML está mal formado y el frontmatter se ignora entero?
- ¿el archivo no se llama `SKILL.md`?
- ¿no hay frontmatter en absoluto?
- ¿la skill está vacía por dentro?

Compara contra `carni-supabase` para tener el patrón que sí funciona.

### 1.5 · Los 108 links, uno por uno

Esta es la parte que Eduardo lleva semanas pidiendo y nunca se hizo completa.

**Ve a cada link.** No los juzgues por el nombre. Para los repos de GitHub, la API da
datos duros sin clonar nada:

```bash
curl -s https://api.github.com/repos/<owner>/<repo> \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['stargazers_count'], d['pushed_at'], d['archived'], d['fork'])"
```

Y búscale el linaje: si un repo tiene muchísimas estrellas y nadie lo menciona,
revisa si es un fork o un port. Eso explica el número y cambia la evaluación —
ya pasó aquí con OmniRoute, que resultó ser un fork de `9router`.

**Clasifica cada uno en exactamente una casilla:**

| Casilla | Cuándo | Qué se genera |
|---|---|---|
| **Skill** | Es un procedimiento repetible con pasos o comandos concretos. Responde *"cómo se hace X"* | `SKILL.md` en `.claude/skills/<nombre>/` |
| **Agente** | Es un rol con alcance propio al que se le delega una tarea entera | `.md` en `.claude/agents/` |
| **Subagente** | Es un especialista estrecho que otro agente invoca | `.md` en `.claude/agents/`, referenciado por su agente |
| **Contexto del orquestador** | No es un procedimiento: es saber que algo existe y cuándo enrutar hacia allá | Una línea en el bloque de contexto del orquestador |
| **Solo link** | Video, artículo, repo archivado, o algo sin procedimiento extraíble | Se queda en `LINKS.md` con una nota de por qué |
| **Descartar** | Roto, abandonado, o duplica algo que ya tienes mejor | Se anota como descartado con el motivo |

**No fuerces nada a ser skill.** Un video de YouTube no es una skill. Un repo
archivado tampoco. Si la mayoría cae en "solo link", eso es un hallazgo válido y
quiero saberlo.

### 1.6 · Las dos estructuras de agentes

Inventario de `agents/` archivo por archivo: qué contiene, y si su equivalente ya
existe en `.claude/agents/`. Dime cuál lee Claude Code de verdad, cuál está muerta,
y qué contenido único hay en la muerta que valga rescatar.

Mira aparte `agents/AGENTS.md` y `agents/STITCH_REDESIGN_PROMPT.md`: pueden ser
documentos vivos que solo están mal ubicados.

### 1.7 · Reporte y PARA

Entrega:

1. Qué respondió y qué no, de Engram, graphify y gentle-ai
2. Lo que sacaste de Engram, por categoría
3. La causa de cada una de las 19 mudas
4. **La tabla de los 108 links clasificados**, con su evidencia
5. El inventario de las dos carpetas de agentes
6. **Cuántos artefactos vas a generar de cada tipo**

**No escribas nada todavía.** Espera el visto bueno.

---

## 5 · Fase 2 — Darles voz a las 19

Solo con visto bueno.

Escribe la descripción que le falta a cada una:

- Sale de **leer** el `SKILL.md` completo, no de adivinar por el nombre
- Formato del que funciona: qué hace + *"Trigger when..."* con casos concretos
- En el idioma en que esté escrita la skill. **No traduzcas**
- Si una está vacía o rota por dentro, **no le inventes descripción**: márcala para
  retirar y di por qué

**Prioriza las de diseño** — `ui-ux-pro-max`, `awesome-design-md`, `frontend-design`,
`web-design-guidelines`, `impeccable`. Son las que hacen falta para lo siguiente que
va a hacer Eduardo, y son las que fallaron esta semana.

Corre `gentle-ai skill-registry refresh --force`. **Pega el conteo antes y después.**

**Compuerta:** el registro debe reportar **cero** skills mudas. Si queda alguna,
no terminaste.

---

## 6 · Fase 3 — Generar lo que falta

Solo lo que la fase 1.5 clasificó y yo aprobé. Cada artefacto pasa su compuerta de
la sección 3 antes de contar como hecho.

### 3.1 · Skills nuevas

Una carpeta por skill en `.claude/skills/<nombre>/` con su `SKILL.md`.

**El contenido sale de haber leído la fuente**, no de lo que suene razonable. Si el
README no alcanza para escribir un procedimiento concreto, **no inventes uno**:
mándala a la lista de rechazadas con esa razón. Una skill vaga es peor que no
tenerla — se dispara y desperdicia el turno.

Cada una lleva en su frontmatter:

```yaml
source:        <url del repo>
source_commit: <sha contra el que se escribió>
verified:      <fecha>
```

### 3.2 · Agentes y subagentes

En `.claude/agents/`, con el formato que Claude Code sí lee. Cada uno declara su
alcance, sus herramientas reales, y **qué skills debe leer antes de trabajar** —
por ruta, no por resumen.

### 3.3 · El orquestador

`.claude/agents/carni-orchestrator.md` debe:

- Leer `.atl/skill-registry.md`
- Saber qué agentes existen, por su `name` exacto
- Saber cuándo delegar y a quién
- Pasar **rutas** de `SKILL.md` a los subagentes, nunca resúmenes

### 3.4 · Consolidar los agentes — **nada se borra**

La carpeta `agents/` de la raíz no la lee nadie. Es documentación disfrazada de
sistema, y eso es peor que no tenerla: alguien la va a leer y va a creer que está
viva.

- Lo que tenga contenido único → pórtalo a `.claude/agents/` con el formato correcto
- Lo duplicado u obsoleto → **mover** a `docs/archivo/agents-sin-usar/`, con un README
  de tres líneas por archivo: qué era, por qué se retiró, con qué se reemplaza
- **Borrar es decisión de Eduardo, no tuya.** Él quiere el contexto conservado en un
  lugar buscable, no perdido

Al terminar debe quedar **una sola estructura**, y tienes que poder demostrar con
evidencia cuál lee Claude Code.

### 3.5 · Engram en su sitio

Averigua antes de tocar: ¿está en `~/.claude.json`, en la config global, o en ningún
lado? ¿Se invoca por stdio o por http? ¿Está corriendo?

La respuesta decide si hay que agregarlo al proyecto o si ya llega por herencia y
agregarlo lo duplicaría.

Si hay que agregarlo: la entrada en `.mcp.json` va **sin credenciales**. Si Engram
necesita una llave, va por variable de entorno y me dices cuál para que Eduardo la
ponga. **Ese archivo vive en el repo: ningún secreto ahí dentro.**

---

## 7 · Fase 4 — El lazo de verificación

**Aquí es donde esto deja de ser un cascarón.** No declares nada terminado sin correr
esto.

### El ciclo

```
1. Corre gentle-ai skill-registry refresh --force
2. Cuenta las mudas.                          ¿> 0?  → arréglalas, vuelve a 1
3. Lista los agentes que Claude Code descubre
4. Compara contra los archivos de .claude/agents/
   ¿Alguno no aparece? → su frontmatter está roto → arréglalo, vuelve a 3
5. Por cada skill nueva, verifica las 5 condiciones de la sección 3
   ¿Alguna falla? → arréglala o recházala con motivo, vuelve a 1
6. Abre el orquestador y comprueba que cada agente que nombra existe
   con ese name exacto.  ¿Alguno no? → corrígelo, vuelve a 3
7. Cuando 2, 4, 5 y 6 pasen todos, termina.
```

**Máximo tres vueltas.** Si a la tercera algo sigue fallando, **para y repórtalo**.
Insistir a ciegas es cómo se generan cascarones nuevos encima de los viejos.

### El reporte final

Una tabla, y quiero los rechazos tanto como los éxitos:

| Artefacto | Tipo | Origen | Compuerta | Estado |
|---|---|---|---|---|

Más:

- Skills mudas: **antes N → después M**. Si M no es cero, di por qué
- Agentes que Claude Code lista, antes y después
- **La lista de rechazados con su motivo.** Es la parte más valiosa: dice qué de los
  108 links no servía, y ahorra que alguien lo vuelva a intentar

---

## 8 · Fase 5 — Que no se vuelva a pudrir

### 5.1 · Trazabilidad

Cada `SKILL.md` de origen externo lleva `source`, `source_commit` y `verified`. Las
propias de Eduardo no los llevan.

### 5.2 · `docs/tooling/SKILLS_LOOP.md`

El procedimiento de mantenimiento, en dos tiempos, y **el orden importa**:

1. **Barato, sin modelo.** Para cada `source`, una llamada a la API de GitHub por
   `pushed_at`. Si es posterior a `verified`, se marca desactualizada. Cuesta
   segundos. Ya hay una tarea programada que corre esto los lunes a las 8:30 y avisa
   solo cuando algo se movió.
2. **Caro, con `investigador`.** **Solo las marcadas.** Lee el README y los cambios,
   propone la actualización, espera aprobación humana.

Nunca al revés. Revisar las 50 con un modelo cada semana es quemar créditos para
descubrir que 48 no cambiaron.

Documenta también la regla que hoy falta: **una skill sin `description` se considera
rota**, y el refresh del registro debería gritarlo. Si el registro pudiera fallar
cuando alguna sale muda, nada de esto habría pasado.

### 5.3 · Commit

Archivo por archivo, verificado con `git diff --cached --name-only`. **Nunca
`git add .`.**

Mensaje bilingüe. Asunto:

```
feat(agents): construir el stack agentico con skills, agentes y orquestador
```

En el cuerpo, en prosa: que 19 de 50 skills no tenían descripción y por eso ningún
agente las invocaba nunca —incluidas todas las de diseño, que es lo que hizo que el
rediseño del bento se hiciera a mano y saliera con un botón transparente—; qué se
sacó de Engram; cuántos de los 108 links se convirtieron en qué; que la carpeta
`agents/` de la raíz no la lee Claude Code y su contenido se archivó en vez de
borrarse; y qué pasó con Engram en `.mcp.json`.

Push a `origin/pruebas`. **No mergees.**

---

## 9 · Prohibido

- Tocar `src/`, `js/`, `css/` o cualquier `*.html` — esto no es trabajo de producto
- Arrancar el bloque del carrito: está en pausa
- **Borrar** cualquier agente, skill o documento. Se archiva en `docs/archivo/`
- Crear una skill sin haber alcanzado su fuente
- Inventar una descripción sin haber leído el `SKILL.md` completo
- Afirmar que consultaste Engram o graphify si no respondieron
- Escribir cualquier credencial en `.mcp.json` o en cualquier archivo del repo
- Declarar algo terminado sin haber corrido el lazo de la fase 4
- Mergear · tocar `main` · borrar ramas · `--force` · `sudo`

Si GGA se salta o falla, **dilo en el reporte**. No lo escondas.

---

## 10 · Al terminar

Si descubriste que un procedimiento de aquí no funciona, o que un comando de la
documentación está mal, **escríbelo en la skill correspondiente**. Este stack se
corrige con lo que se aprende en cada corrida; si no, envejece igual que el manual
que nos falló.
