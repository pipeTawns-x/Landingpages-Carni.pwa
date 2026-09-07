---
name: guardemos-esto
description: "Persist the current context so it survives the session. Use when the user says 'guardemos esto', 'save this', 'guardá esto', 'que no se pierda' or 'anotá esto' — saves to Engram, refreshes the graphify graph, and writes a doc when it is a plan or a decision."
user-invocable: true
---

# Guardemos esto

## Cuándo se usa

Cuando el usuario dice, en cualquier idioma y con cualquier variante:

- "guardemos esto" · "guardá esto" · "guarda esto"
- "save this" · "let's save this"
- "que no se pierda" · "anotá esto" · "apuntá esto"

También **sin que lo pidan**, cuando acaba de pasar algo de lo que la próxima
sesión no puede enterarse sola: una decisión de arquitectura, un bug con su
causa raíz, una convención acordada, un descubrimiento no obvio del código.

## Por qué existe

El conocimiento de una sesión se evapora en la compactación. Peor: un
orquestador que perdió el hilo empieza a **inventar**. En este mismo repo, un
resumen de sesión listó como "archivos relevantes" dos documentos que nunca
existieron y un hook que no estaba escrito. Nadie mintió a propósito — se
guardó la intención en vez del hecho.

Esta skill existe para que lo que se guarde sea **verificable**, y para que las
tres memorias del proyecto —Engram, el grafo y `docs/`— no se desincronicen
entre ellas.

## Los tres pasos. En este orden.

### 1. Engram — el hecho

```
mem_suggest_topic_key(title: "<título>", type: "<tipo>")   # si el tema va a evolucionar
mem_save(
  project: "Carni-mvp",
  title:   "<verbo + qué, corto y buscable>",
  type:    "decision | architecture | bugfix | pattern | config | discovery | preference",
  topic_key: "<clave estable, ej. carni/lupa/busqueda-en-vivo>",
  content: "**What**: … **Why**: … **Where**: … **Learned**: …"
)
```

Reglas que no se negocian:

- **`project` es siempre `Carni-mvp`.** Los alias (`carni-mvp`,
  `Landingpages-Carni.pwa`) se unificaron el 2026-07-25 y volver a partirlos
  esconde observaciones.
- **Mismo tema → mismo `topic_key`.** Es un upsert: reusar la clave actualiza,
  cambiarla duplica. Temas distintos NUNCA comparten clave.
- **`Where` lleva rutas reales.** Antes de escribirlas, comprobalas. Una ruta
  inventada en memoria es peor que no tener memoria: la próxima sesión la cree.
- **`Learned` es la parte que vale.** El código ya está en el repo; lo que el
  repo no guarda es qué te sorprendió.

### 2. graphify — el mapa

El repo tiene un hook de git que reconstruye el grafo en cada commit. Si
guardás sin commitear, o querés el grafo al día ahora mismo:

```bash
graphify update .
```

`update` es el comando correcto: re-extrae solo el código y **no necesita clave
de LLM**. `graphify . --update` no es lo mismo y pide clave para los documentos
e imágenes.

Si responde *"new graph has N nodes but existing has M — refusing to
overwrite"*, es que el código encogió (un refactor que borró archivos). **No
uses `--force` por tu cuenta**: decilo y que decida Eduardo.

### 3. docs/ — solo si es plan o decisión

Un hallazgo suelto vive en Engram y se acabó. Se escribe a `docs/` cuando otra
persona va a tener que **actuar** sobre esto:

- deuda o defecto → `docs/PENDIENTES.md` (fuente única de verdad de la deuda)
- decisión con alternativas y plan → documento propio, ej. `docs/MIGRACION_TAILWIND.md`
- por qué se hizo algo → `docs/blueprints/`

No se duplica: si algo está en `PENDIENTES.md`, ese manda y el otro se corrige.

## Al terminar

Decí en una línea qué se guardó y dónde, con la `topic_key` textual. Si un paso
no se pudo hacer —el grafo se negó, no hay documento porque no era un plan—
decilo también. Un "listo" que tapa un paso saltado es exactamente el problema
que esta skill vino a resolver.

## Lo que esta skill NO hace

- No commitea ni empuja nada.
- No decide por el usuario si algo merece guardarse: ante la duda, guarda.
- No resume la sesión entera. Para eso está `mem_session_summary`, al cerrar.
