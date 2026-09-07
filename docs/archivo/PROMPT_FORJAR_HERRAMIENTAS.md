# Forjar las herramientas — Fase 3 con lazo de reintentos

**Para Claude Code. En `~/Desktop/Carni-mvp`, rama `pruebas`.**

Continúa `docs/PROMPT_STACK_AGENTICO.md`, cuyas fases 1 y 2 ya están hechas:
59 skills registradas, **cero mudas**, `agents/` archivada, `AGENTS.md` corregido.

**No toques `src/`, `js/`, `css/` ni ningún `*.html`.** Esto es forjar herramientas,
no producto. El frontend viene después, y viene mejor armado gracias a esto.

---

## 1 · El contexto que te falta: qué son BuildAds y ProductAds

Eduardo lleva meses trabajando esto y nunca quedó escrito en un solo lugar. Va aquí,
porque sin ello no puedes decidir qué herramientas hacen falta.

### El producto que lo inspira

**`saleads.ai`** es un producto externo. Eduardo lo tomó como referencia de a dónde
quiere llegar. Está en `docs/tooling/investigacion-contexto-agentico.md:47`.

### ⚠️ Colisión de nombres — léela antes de seguir

En los blueprints de este repo, **`SaleAds` también es el nombre de un módulo propio**
de Carni-mvp, y **no es lo mismo** que el producto externo.

`docs/blueprints/module-scopes.md:46` lo define así:

> *"SaleAds es la superficie INTERNA de promociones — ofertas flash y banners
> mostrados dentro de la PWA (el 'banner estilo Netflix' que se actualiza solo cuando
> una campaña se autoriza). Distinto de BuildAds (que crea campañas) y ProductAds
> (que las propone de forma autónoma)."*

**Dos cosas con el mismo nombre es cómo se pudre la documentación.** Si al trabajar
ves ambigüedad, señálalo; no lo resuelvas por tu cuenta renombrando nada.

### Los tres módulos, y en qué se distinguen

| Módulo | Qué hace | Quién decide |
|---|---|---|
| **BuildAds** | **Crea** campañas publicitarias. Asistente de 6 pasos: texto, imagen, voz, video, segmentación, publicación | El administrador arma y autoriza |
| **ProductAds** | **Propone** campañas solo, disparado por el inventario. Aprende de cómo el administrador gestiona, genera contenido y difunde | El administrador **solo valida**. Esa es toda la diferencia |
| **SaleAds** *(módulo)* | **Muestra** la promoción dentro de la tienda: banner estilo Netflix que se actualiza cuando una campaña se autoriza | Automático al autorizar |

La cadena completa: *ProductAds propone → el administrador valida → BuildAds produce la
pieza → SaleAds la muestra en la tienda y se difunde a Meta, Instagram, WhatsApp y
TikTok.*

**El salto de BuildAds a ProductAds es el aprendizaje.** ProductAds observa qué
autoriza el administrador, qué contenido genera y cómo lo distribuye, y con eso propone
lo siguiente. Por eso no es "BuildAds automático": es BuildAds que aprendió.

### Estado real hoy

**Congelados por decisión del 2026-08-13**, hasta que el dueño de la carnicería entregue
márgenes reales. Ver `docs/DECISION_ALCANCE_2026-08-13.md`.

**Que estén congelados no significa que sus herramientas no se preparen.** Eduardo está
forjando ahora lo que va a necesitar después. Una herramienta lista el día que arranca
el módulo vale mucho más que empezar a buscarla ese día.

Pero: **preparar la herramienta ≠ descongelar el módulo.** No escribas una línea de
código de BuildAds ni de ProductAds.

### El bot de WhatsApp

Otro módulo que viene y hoy no existe. Tres usos, y son distintos:

1. **Pedidos** de clientes por WhatsApp
2. **Gestión del proceso** por parte de los trabajadores de la carnicería
3. **Atención al cliente**

`n8n` es el candidato para orquestarlo. Ya existe la skill `n8n-workflow-method-local`
—método, sin uso todavía— y en `LINKS.md` hay `czlonkowski/n8n-mcp`,
`Hainrixz/whatsapp-agentkit` y `rmyndharis/OpenWA`.

---

## 2 · Qué hay que forjar

De los 56 repos vivos, estas son las candidatas. **Cada una tiene un destino sugerido,
no decidido.** El lazo de la sección 3 decide la forma final.

### Grupo A · Lo que se usa ya

| Candidata | Para | Nota |
|---|---|---|
| `mcp.higgsfield.ai/mcp` | **P-14** video del hero | Es **MCP, no skill**. Está en Engram `#448`, no en `LINKS.md` |
| `remotion-dev/remotion` | **P-14** video con React | 57k ⭐. Nuestro stack |
| `davideast/stitch-mcp` | **P-21** dashboard | Ya existe `docs/blueprints/STITCH_REDESIGN_PROMPT.md` |

### Grupo B · Se prepara ahora, se usa cuando el módulo arranque

| Candidata | Para | Nota |
|---|---|---|
| `microsoft/VibeVoice` | **BuildAds** — la voz de "Don Carlos" | 53k ⭐ |
| `czlonkowski/n8n-mcp` | **bot de WhatsApp** | 22k ⭐ |
| `Hainrixz/whatsapp-agentkit` | **bot de WhatsApp** | Verifica salud antes |
| `rmyndharis/OpenWA` | **bot de WhatsApp** | Verifica salud antes |
| `Hainrixz/claude-ads` | **BuildAds** — generación de anuncios | |
| `Hainrixz/agente-pagokit` | pagos | Ya instalada, ya con voz |

**Marca estas claramente como "preparada, no activa"** en su descripción, para que
ningún agente crea que el módulo está vivo.

### Grupo C · Transversal, con advertencia

**`rtk-ai/rtk`** — 77k ⭐. Proxy que reduce el consumo de tokens 60-90%. Es la que más
puede servir: a Eduardo se le acabaron los créditos tres veces esta semana.

**Pero es un proxy que enruta TODAS las llamadas al modelo.** Es la misma familia que
OmniRoute, donde encontramos que el `postinstall` escribía un `.env` y que instalaba una
CA en el almacén de confianza del sistema. Antes de recomendarla, revisa
específicamente: su `postinstall`, si toca el trust store, y si escribe fuera de su
carpeta. Con las llaves de Supabase de por medio, eso se decide a conciencia.

### Grupo D · Leer, no adoptar

**`EvoMap/evolver`** — 8,869 ⭐, GPL-3.0, último push 2026-07-07. Motor auto-evolutivo
para agentes, con "evolución auditable". Etiquetas: `self-evolving`, `skill-library`,
`prompt-governance`.

Es literalmente lo que estamos construyendo a mano. **Léelo y extrae ideas para nuestro
lazo, pero no lo instales.** Dos razones: acabamos de pasar un día arreglando skills que
se pudrieron solas, y un sistema que se modifica a sí mismo encima de eso es apostar
doble. Y GPL-3.0 tiene consecuencias si esto algún día se vende.

**Entrégame un resumen de sus ideas aplicables.** Eso vale más que instalarlo.

### Ya descartadas — no las revisites

`claude-video-vision` (ya existe `ver-videos-de-eduardo`, funciona) ·
`claude-cookbooks` (son recetas, es link) · `editor-pro-max` (230 ⭐ contra Remotion
con 57k) · `claude-token-efficient` (es un `CLAUDE.md`: léelo y aplica lo que sirva a
nuestro `AGENTS.md`, sin instalarlo) · los 30 de contexto agéntico y memoria (el área
que ya está saturada con 59 skills y la que produjo las 19 mudas)

---

## 3 · El lazo — la escalera de formas

**Esta es la parte que importa.** Una candidata no se descarta porque no encaje como
skill: **baja un peldaño y se prueba en la siguiente forma.** Solo se descarta cuando
no encaja en ninguna.

### La escalera

Para cada candidata, en este orden. Te quedas en el primer peldaño que encaje:

```
1 · ¿Es un procedimiento repetible con pasos o comandos concretos?
      → SKILL en .claude/skills/<nombre>/SKILL.md

2 · ¿No, pero es un rol con alcance propio al que se delega una tarea entera?
      → AGENTE en .claude/agents/<nombre>.md

3 · ¿No, pero es un especialista estrecho que otro agente invoca?
      → SUBAGENTE en .claude/agents/, referenciado por su agente

4 · ¿No, pero es un servicio externo con endpoint?
      → entrada en .mcp.json, SIN credenciales

5 · ¿No, pero es conocimiento que hay que consultar, no ejecutar?
      → documento en docs/blueprints/ o docs/tooling/

6 · ¿No, pero es un dato suelto que debe sobrevivir entre sesiones?
      → observación en Engram, con su tipo correcto

7 · Nada de lo anterior
      → queda en LINKS.md con una nota de por qué no se convirtió
```

**Nunca se pierde.** El peldaño 7 también es un resultado válido y hay que registrarlo.

### El reintento

Si un artefacto **falla su compuerta**, no lo descartes ni lo dejes roto:

```
Intento 1 · Arréglalo en la misma forma.
            ¿Falta descripción? escríbela. ¿Frontmatter roto? repáralo.

Intento 2 · Si vuelve a fallar, BAJA UN PELDAÑO de la escalera y créalo
            en la forma siguiente. Una skill que no se puede escribir con
            fundamento suele ser un documento perfectamente bueno.

Intento 3 · Si también falla, sube la información a Engram como observación
            y anótalo en LINKS.md con el motivo.

Máximo tres intentos por candidata. A la tercera, PARA con esa y sigue con
la siguiente. No entres en bucle.
```

### Las compuertas — nada cuenta hasta que pasa la suya

**Skill.** Las cinco:

1. **Origen alcanzado.** README descargado, respuesta 200. Repo archivado o más de un
   año sin `pushed_at` → no se crea: se anota como descartada con esa razón.
2. **Frontmatter válido.** Parsea, `name` en minúsculas y guiones, `description` no vacía.
3. **Descripción que dispara.** Qué hace **y cuándo activarse**, con casos concretos.
   `"Herramienta de video"` no pasa.
4. **Contenido verificable.** Al menos un comando, ruta o patrón concreto que corriste o
   leíste del propio paquete. Aplica la regla de `investigador`: la salida de un comando
   manda sobre el `--help`, y el `--help` sobre el README. **Tu memoria no es una fuente.**
5. **Aparece en el registro** tras `gentle-ai skill-registry refresh --force`, con su
   descripción.

**Agente o subagente.** Vive en `.claude/agents/`, frontmatter válido, `tools` con
herramientas que existen, y **Claude Code lo lista**. Compruébalo, no lo supongas.

**Entrada MCP.** El endpoint responde, o dices qué credencial falta. **Ningún secreto en
`.mcp.json`**: ese archivo está en el repo.

**Documento.** Tiene fuente citada y dice cuándo consultarlo.

**Observación en Engram.** Tipo correcto, y recuperable buscándola después. **El buscador
tokeniza por palabra suelta: busca por palabras, no por frases.**

### El ciclo de cierre

Cuando termines todas las candidatas:

```
1. gentle-ai skill-registry refresh --force
2. ¿Alguna skill muda?               → arréglala, vuelve a 1
3. Lista los agentes que Claude Code descubre
4. ¿Falta alguno de .claude/agents/? → frontmatter roto, arréglalo, vuelve a 3
5. Abre el orquestador: ¿cada agente que nombra existe con ese name exacto?
                                     → si no, corrígelo, vuelve a 3
6. ¿Las entradas nuevas de .mcp.json responden?
                                     → si no, di cuál y por qué
7. Cuando 2, 4, 5 y 6 pasen, termina.
```

**Máximo tres vueltas del ciclo.** Si a la tercera algo sigue fallando, **para y
repórtalo**. Insistir a ciegas es cómo se generan cascarones nuevos sobre los viejos.

---

## 4 · Lo que hay que dejar escrito

### 4.1 · El documento de los tres módulos

Crea `docs/blueprints/buildads-productads-saleads.md` con lo de la sección 1 de este
documento, ampliado con lo que encuentres en Engram y en los blueprints existentes.

**Incluye la colisión de nombres explícitamente.** Que el próximo que lea sepa que
`saleads.ai` (externo) y `SaleAds` (módulo interno) son cosas distintas.

Y deja claro que **están congelados**, con liga a `docs/DECISION_ALCANCE_2026-08-13.md`,
y que preparar sus herramientas no los descongela.

### 4.2 · Pendientes

En `docs/PENDIENTES.md`, con evidencia:

- Las **19 descripciones no versionadas**. Viven en `~/.claude/skills/`, fuera del repo,
  y existen solo en esta máquina. Propón dónde deben vivir: las de Carni-mvp al repo,
  las generales a un repo de skills personales de Eduardo. Averigua si ya existe uno.
- **GGA: dos fallos apilados.** `GGA_PROVIDER=claude` rodea el primero —el parseo de su
  config—; el `OAuth session expired` sigue debajo y lleva tres sesiones. Anótalo con esa
  evidencia. **No lo persigas más de paso:** o se le dedica una sesión o se decide
  reemplazarlo. Un guardián que se rodea en cada commit no protege, cobra peaje.
- La **colisión de nombres SaleAds**.

### 4.3 · Que el orquestador lo sepa

`.claude/agents/carni-orchestrator.md` debe conocer las herramientas nuevas y **cuándo
NO usarlas**: las del grupo B están preparadas para módulos congelados. Que sepa que
existen y que no las invoque hasta que el módulo arranque.

### 4.4 · Commit

Archivo por archivo, verificado con `git diff --cached --name-only`. Nunca `git add .`.
Mensaje bilingüe. Asunto:

```
feat(agents): forjar las herramientas de video, whatsapp y dashboard
```

Si GGA sigue sin poder revisar, `--no-verify` y **dilo en el mensaje**.

Push a `origin/pruebas`. **No mergees.**

---

## 5 · Prohibido

- Tocar `src/`, `js/`, `css/` o cualquier `*.html`
- Escribir código de BuildAds, ProductAds o SaleAds — están congelados
- Instalar `evolver`: se lee, no se adopta
- Recomendar `rtk` sin haber revisado su `postinstall` y si toca el trust store
- Crear una skill sin haber alcanzado su fuente
- Inventar una descripción sin haber leído el paquete
- Afirmar que consultaste Engram si no respondió
- Escribir cualquier credencial en `.mcp.json` o en cualquier archivo del repo
- Declarar algo terminado sin haber corrido el ciclo de cierre
- Entrar en bucle: tres intentos por candidata, tres vueltas del ciclo, y paras
- Mergear · tocar `main` · borrar ramas · `--force` · `sudo`

---

## 6 · El reporte final

Una tabla, y los rechazos valen tanto como los éxitos:

| Candidata | Peldaño final | Intentos | Compuerta | Evidencia |
|---|---|---|---|---|

Más:

- Skills: **antes N → después M**. Mudas: debe ser **cero**
- Agentes que Claude Code lista, antes y después
- Entradas nuevas en `.mcp.json` y cuáles esperan credencial de Eduardo
- **Qué bajó de peldaño y por qué.** Es la parte más informativa: dice qué no daba para
  skill y en qué sí encajó
- Las ideas aplicables que sacaste de `evolver`
- Tu veredicto sobre `rtk`, con la evidencia de seguridad

---

## 7 · Después de esto

Lo siguiente es el frontend, con las herramientas ya en la mano: el video del hero,
las imágenes propias de producto, y unificar el carrito en uno solo lateral.

**Ese es el punto de todo esto.** No estamos coleccionando herramientas: estamos
forjando las que hacían falta para que el próximo trabajo de producto no salga a mano
y con un botón transparente.
