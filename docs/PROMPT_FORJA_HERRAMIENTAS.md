# Forjar las herramientas, y diseñar BuildAds y ProductAds

**Para Claude Code. Ejecútalo en `~/Desktop/Carni-mvp`, rama `pruebas`.**

Continúa el trabajo de `docs/PROMPT_STACK_AGENTICO.md`, cuyas fases 1 y 2 ya están
hechas: 59 skills registradas, **cero mudas**, `agents/` retirada a `docs/archivo/`,
`AGENTS.md` corregido. Commit `f10d4bc7`.

**No es trabajo de producto.** No toques `src/`, `js/`, `css/` ni ningún `*.html`.

---

## 1 · Por qué estamos haciendo esto ahora, y no lo otro

Eduardo lo dijo así, y vale citarlo porque explica el orden entero:

> *"Hay mejores cosas que hacer en el frontend, empezando por el video, mejorar el
> carrito manteniendo uno solo. Pero lo pospusimos, porque primero: ¿cómo voy a
> construir sin herramientas? Ahorita estamos forjando nuestras herramientas."*

Esta semana costó caro no tenerlas. Se pidió mejorar una rejilla de categorías,
nadie usó ninguna herramienta de diseño, y salió un botón en `rgba(0,0,0,0)` más una
medición de contraste hecha contra un color plano que nunca llega solo a la pantalla.
Las skills que cubrían ambos errores **ya estaban instaladas** — y mudas.

Así que: **se forjan las herramientas, se diseña la idea grande, y recién después se
vuelve al frontend.** Ese es el orden y no se altera.

---

## 2 · Contexto que te falta, y que Eduardo lleva meses cargando solo

Esto no está completo en ningún documento del repo. Léelo con atención porque cambia
qué herramientas hacen falta.

### 2.1 · SaleAds, la referencia

Existe un producto llamado **SaleAds** que Eduardo tomó como modelo:

```
https://www.youtube.com/watch?v=-a58SJXxrmk
```

Búscalo en Engram: el link está guardado ahí junto con el resto. Si hay
observaciones sobre él, tráelas — es contexto que ya se registró y nadie ha usado.

### 2.2 · BuildAds — asistido

**BuildAds es la versión de SaleAds para Carni-mvp.** Un asistente que crea campañas
publicitarias: el texto, el contenido visual, y la distribución.

Distribuye a las plataformas de Meta y a TikTok: **WhatsApp, Instagram, TikTok**.

El administrador conduce. La herramienta propone y él aprueba.

### 2.3 · ProductAds — autónomo

**ProductAds es la evolución de BuildAds.** La diferencia no es de funciones, es de
quién lleva el volante:

- **Aprende de cómo el administrador gestiona y genera sus campañas**: qué contenido
  elige, cómo lo redacta, dónde lo publica, qué aprueba y qué rechaza.
- Con eso, propone campañas completas por su cuenta.
- **El administrador pasa de crear a solo validar.**

### 2.4 · La regla que gobierna el diseño de las dos

> **No es un sistema aparte. Se integra en el dashboard administrativo.**

La meta de Eduardo no es una carnicería con una herramienta de anuncios pegada al
lado. Es que Carni-mvp sea un **proyecto de virtualización de negocio o marca
completo**: el dueño entra a un solo panel y desde ahí gestiona el catálogo, los
precios, los pedidos, y también su presencia y su publicidad.

Cualquier propuesta que salga como módulo separado está mal leída.

### 2.5 · El bot de WhatsApp

`n8n` no es una curiosidad: es la pieza para cuando se construya el bot de WhatsApp.
Tres usos concretos:

- **Gestión de pedidos por WhatsApp** — que el cliente pida por ahí
- **Gestión del proceso por parte de los trabajadores** — que el mostrador avance
  el estado del pedido desde el teléfono
- **Atención al cliente por WhatsApp**

### 2.6 · El estado de congelación — léelo antes de proponer nada

`docs/DECISION_ALCANCE_2026-08-13.md` congeló **Fidelización, Afiliados, BuildAds y
ProductAds** hasta que el dueño de la carnicería entregue márgenes reales.

**Ese congelamiento sigue en pie para la construcción.** Lo que se autoriza aquí es
distinto y menor:

- **Sí:** diseñar la arquitectura, dejarla documentada, y tener las herramientas listas
- **No:** escribir una sola línea de BuildAds o ProductAds

Actualiza `docs/DECISION_ALCANCE_2026-08-13.md` para que diga exactamente eso, sin
descongelar nada. Un documento que prohíbe pensar es tan malo como uno que autoriza
construir sin márgenes.

---

## 3 · El estado de las herramientas, verificado

| | |
|---|---|
| Registro | 59 skills, **0 mudas** |
| `.claude/skills/` | 11 carpetas (2 propias + 9 rescatadas) |
| `.claude/agents/` | 9 agentes, todos con frontmatter válido |
| `.mcp.json` | solo `supabase` (read_only) y `playwright` |
| Engram | 493 observaciones, llega por plugin de Claude Code, **no** por MCP |
| graphify | al día, 1328 nodos, construido desde HEAD |
| GGA | **dos fallos apilados** (ver abajo) |

**Sobre GGA, para que no lo persigas de paso:** `GGA_PROVIDER=claude` rodea el fallo
de parseo de su config, pero debajo sigue `OAuth session expired`, que lleva tres
sesiones. Si te bloquea, `--no-verify` y **dilo en el reporte**. No inviertas tiempo
en él aquí.

**Y un hallazgo abierto:** las 19 descripciones que escribiste viven en
`~/.claude/skills/`, fuera del repo. **No están versionadas en ningún lado.** Existen
solo en esta máquina. Está en la fase 5.

---

## 4 · Las herramientas que sí hacen falta

De los 56 repos vivos quedaron estas. El criterio no es "se ve interesante", es
**sirve para algo que está en la ruta**.

### Grupo A — para trabajar ya

| Herramienta | Para qué |
|---|---|
| `mcp.higgsfield.ai/mcp` | Video generado con IA. **P-14.** Es MCP, no skill — está en Engram, observación `#448` |
| `remotion-dev/remotion` | Video programático con React. Mismo stack del proyecto. **P-14** |
| `davideast/stitch-mcp` | De diseño de Stitch a código. **P-21**, y ya existe `docs/blueprints/STITCH_REDESIGN_PROMPT.md` |
| `rtk-ai/rtk` | Proxy que reduce el consumo de tokens. Transversal. **Con advertencia, ver 4.3** |

### Grupo B — para cuando se descongele, pero se preparan ahora

Eduardo fue explícito: *"déjala pendiente... estaría bien que las tuvieras en skills
para el momento en el que ya nos pongamos a desarrollar"*.

| Herramienta | Para qué |
|---|---|
| `microsoft/VibeVoice` | Voz para el contenido de BuildAds |
| `czlonkowski/n8n-mcp` | El bot de WhatsApp: pedidos, proceso y atención |

Se crean sus skills **ahora**, marcadas con su pendiente. No se usan todavía.

### 4.3 · La advertencia sobre `rtk`

Es la que más puede servir —Eduardo se ha quedado sin créditos tres veces esta
semana— y la que más hay que mirar antes de adoptar.

**Es un proxy que enruta todas las llamadas al modelo.** Es la misma familia que
OmniRoute, donde ya encontramos que el `postinstall` escribía un `.env` local y que
incluía MITM transparente que **instala una CA en el almacén de confianza del
sistema**.

Revisa específicamente, y repórtalo antes de recomendar:

1. Qué hace su `postinstall`
2. Si toca el almacén de certificados del sistema
3. Si escribe archivos fuera de su propia carpeta
4. Si es un fork o un port de otro proyecto — busca el linaje, como con OmniRoute

Con las llaves de Supabase de por medio, esto se decide a conciencia, no por inercia.

### 4.4 · Descartadas, y por qué

Para que nadie las vuelva a proponer:

| | |
|---|---|
| `claude-video-vision` | Ya existe `ver-videos-de-eduardo`, creada con `skill-creator`, y funciona |
| `claude-cookbooks` | Son recetas, no un procedimiento. Es link, no skill |
| `editor-pro-max` | 230 ⭐ contra Remotion con 57 mil para el mismo trabajo |
| `evolver` | Marcada dudosa por el propio evaluador |
| `claude-token-efficient` | Es un `CLAUDE.md`, no una skill. **Léelo y aplica lo que sirva a nuestro `AGENTS.md`**, sin instalarlo |
| Los 30 de contexto agéntico | Ya hay 59 skills en esa área. Es la que produjo las 19 mudas |

---

## 5 · El lazo de forja — nada se pierde por el camino

Esto es lo que Eduardo pidió explícitamente: que si algo falla, **se intente de otra
forma**, no que se abandone.

### La escalera

Para cada herramienta, baja escalón por escalón hasta que uno funcione:

```
1 · ¿Es un procedimiento repetible?          → SKILL.md en .claude/skills/
    ¿La fuente respondió? ¿hay comandos concretos?

2 · ¿Es un servicio con endpoint?            → entrada en .mcp.json
    (Higgsfield y n8n caen aquí, no en skill)      SIN credenciales

3 · ¿Es un rol al que se delega una tarea?   → .md en .claude/agents/

4 · ¿Es conocimiento, no procedimiento?      → docs/blueprints/ o docs/brain/

5 · ¿Nada de lo anterior?                    → observación en Engram
                                               + línea en LINKS.md con el motivo
```

**Ningún escalón se salta y nada se descarta en silencio.** Si una skill no se puede
escribir porque el README no da para un procedimiento concreto, **no inventes uno**:
baja al escalón 4 y guárdalo como conocimiento. Una skill vaga es peor que no
tenerla, porque se dispara y desperdicia el turno.

### Reintentos

Si un escalón falla, **cambia de método antes de rendirte**:

- Fuente inalcanzable por `curl` → prueba `gh api`, que va autenticado y no choca con
  el límite de 60 peticiones por hora
- README insuficiente → busca `docs/`, `examples/`, o los tests del repo
- Repo enorme → lee solo el README y el árbol de primer nivel, no lo clones

**Máximo tres métodos distintos por herramienta.** A la cuarta, baja de escalón y
anota qué intentaste. Insistir a ciegas es cómo se generan cascarones nuevos.

### La compuerta

Nada cuenta como hecho sin esto:

**Una skill** — las cinco:
1. Fuente alcanzada, respondió 200
2. Frontmatter parsea, con `name` en minúsculas y guiones y `description` no vacía
3. La descripción dice **qué hace y cuándo activarse**, con casos concretos
4. Al menos un comando, ruta o patrón que corriste o leíste del propio paquete
5. Aparece en el registro **con su descripción** tras
   `gentle-ai skill-registry refresh --force`

**Una entrada MCP** — el servidor responde, y `.mcp.json` no contiene ninguna
credencial. Si hace falta una llave, va por variable de entorno y **le dices a
Eduardo cuál** para que la ponga él.

**Un agente** — Claude Code lo lista. Compruébalo, no lo supongas.

---

## 6 · Diseñar BuildAds y ProductAds — con dos agentes, no solo

Eduardo lo pidió así, y tiene razón en el método:

> *"Para esto necesitamos el arquitecto para que nos ayude a generar la idea y el
> abogado del diablo para mejorarla."*

### 6.1 · Primero, contexto

Antes de invocar a nadie, junta:

- Todo lo que Engram tenga sobre SaleAds, BuildAds y ProductAds
- `docs/blueprints/dashboard-admin.md` — el análisis del sistema de la ferretería
- `docs/DECISION_ALCANCE_2026-08-13.md` — por qué se congeló
- El esquema real de la base: qué tablas existen hoy

Si Engram no responde, **dilo**. No afirmes que consultaste una memoria que no
pudiste abrir.

### 6.2 · `the-architect` propone

Que diseñe la arquitectura de BuildAds y ProductAds **integrados en el dashboard
administrativo**, no como módulo aparte. Debe cubrir:

- Qué tablas nuevas hacen falta y cómo se relacionan con `products`, `orders` y
  `profiles`
- Dónde vive la lógica: RLS, funciones `SECURITY DEFINER`, o el servidor de `server/`
- Cómo ProductAds **aprende** de las decisiones del administrador: qué se registra,
  dónde, y cómo se consulta
- Los puntos de aprobación humana, que en este proyecto no son opcionales
- Qué se conecta con qué: Higgsfield, VibeVoice, n8n, las APIs de Meta y TikTok

### 6.3 · `abogado-del-diablo` la ataca

Que busque los agujeros. Como mínimo:

- ¿Qué pasa si ProductAds propone una campaña con un precio equivocado?
- ¿Quién responde si publica algo inapropiado en nombre del negocio?
- ¿Cuánto cuesta al mes generar video y voz para cada campaña, de verdad?
- ¿Qué pasa si el administrador aprueba sin leer, que es lo que va a pasar?
- ¿Cómo se aprende de un administrador que aprueba todo?

### 6.4 · El resultado

Un blueprint en `docs/blueprints/buildads-productads.md`. Es un **diseño**, no una
autorización de construir. Debe llevar arriba, en grande:

> **Congelado para construcción.** Ver `docs/DECISION_ALCANCE_2026-08-13.md`. Este
> documento define la arquitectura para cuando se descongele; no autoriza escribir
> código.

Y debe incluir la sección de objeciones del abogado del diablo **con las respuestas**,
o con la admisión de que no la hay. Un blueprint que solo trae la propuesta y no las
objeciones es publicidad, no ingeniería.

---

## 7 · El lazo de verificación — antes de decir que terminaste

```
1. gentle-ai skill-registry refresh --force
2. Cuenta las mudas.                     ¿> 0?  → arréglalas, vuelve a 1
3. Lista los agentes que Claude Code descubre
4. ¿Falta alguno de .claude/agents/?     → frontmatter roto, arréglalo, vuelve a 3
5. Por cada entrada nueva de .mcp.json, comprueba que el servidor responde
   y que NO hay credenciales en el archivo
6. Por cada skill nueva, verifica las 5 condiciones de la sección 5
7. Abre el orquestador: ¿cada agente que nombra existe con ese name exacto?
8. Cuando 2, 4, 5, 6 y 7 pasen, termina.
```

**Máximo tres vueltas.** Si a la tercera algo sigue fallando, **para y repórtalo**.

---

## 8 · Fase 5 · Que no se pierda

### 8.1 · Las 19 descripciones sin versionar

Es el hallazgo abierto más serio. Propón dónde deben vivir, con este criterio:

- Las que hablan de **Carni-mvp** → al repo, en `.claude/skills/`
- Las **generales** (diseño, investigación) → globales está bien, pero necesitan un
  hogar versionado

Averigua si Eduardo ya tiene un repo de dotfiles o de skills personales. Si no
existe, propón crearlo y dilo — no lo crees por tu cuenta. Anótalo como pendiente
con evidencia.

### 8.2 · Trazabilidad

Cada `SKILL.md` de origen externo lleva `source`, `source_commit` y `verified`.
Ya hay una tarea programada que revisa esos campos los lunes a las 8:30.

### 8.3 · Commit

Archivo por archivo, verificado con `git diff --cached --name-only`. Nunca
`git add .`. Mensaje bilingüe. Asunto:

```
feat(agents): forjar las herramientas y disenar BuildAds y ProductAds
```

En el cuerpo, en prosa: qué herramientas se crearon y por qué escalón de la escalera
cayó cada una; qué se descartó y por qué; que BuildAds y ProductAds quedaron
**diseñados y congelados**, integrados en el dashboard, no como sistema aparte.

Push a `origin/pruebas`. **No mergees.**

---

## 9 · Prohibido

- Tocar `src/`, `js/`, `css/` o cualquier `*.html`
- Escribir una sola línea de BuildAds o ProductAds: están congelados
- Descongelar `docs/DECISION_ALCANCE_2026-08-13.md`
- Crear una skill sin haber alcanzado su fuente
- Inventar un procedimiento porque el README no daba
- Escribir cualquier credencial en `.mcp.json` o en cualquier archivo del repo
- Adoptar `rtk` sin el informe de seguridad de la sección 4.3
- Declarar algo terminado sin el lazo de la sección 7
- Mergear · tocar `main` · borrar ramas · `--force` · `sudo`

Si GGA se salta o falla, **dilo**. No lo escondas.

---

## 10 · Y después de esto

Vuelve el frontend, que es lo que Eduardo quiere de verdad: el video, y dejar un solo
carrito lateral en toda la web. Ese trabajo está pausado en el bloque 2 del prompt
anterior, con el inventario de `cart.js` a medias.

**No lo arranques aquí.** Solo que sepas hacia dónde vamos.
