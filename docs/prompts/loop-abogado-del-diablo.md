# Loop de 3 pasadas para el abogado del diablo

Problema que resuelve: una sola corrida produce objeciones mezcladas — algunas apoyadas en evidencia real del repo, otras inventadas con cara de hallazgo. No hay forma de distinguirlas leyendo.

**Lo que NO funciona**: repetir "critica, ahora critica tu crítica". Un modelo al que le pides criticar de nuevo genera objeciones cada vez más rebuscadas para justificar la pasada extra. Más ruido, no menos error.

**Lo que sí funciona**: tres pasadas con roles distintos, cada una con permiso de matar el trabajo de la anterior, y un criterio de parada explícito.

```
PASADA 1  GENERAR    → objeciones crudas, sin filtro
PASADA 2  VERIFICAR  → cada objeción contra el repo; mata las que no se sostienen
PASADA 3  JUZGAR     → de las sobrevivientes, cuáles son letales de verdad
                  ↓
        TÚ clasificas en 3 cubetas y reescribes la tesis
```

Regla que hace que funcione: **la pasada 2 arranca en sesión nueva y no ve el razonamiento de la pasada 1**, solo su lista de objeciones. Si ve cómo llegó ahí, tiende a defenderlas en vez de verificarlas. Es el mismo principio de la revisión a ciegas.

---

## PASADA 1 — Generar

El prompt de afiliados que ya tienes (`docs/prompts/abogado-del-diablo-afiliados.md` o el PROMPT 1 de `INVESTIGACION_Y_PROMPTS.md`).

Añádele esta línea al final, porque la pasada 2 la necesita:

```
FORMATO DE SALIDA — numera cada objeción y dale esta estructura exacta:

  ## Objeción N: <título en una línea>
  - Supuesto que rompe:
  - Evidencia que la sostiene: <archivo, tabla o columna concretos>
  - Consecuencia si nadie la atiende:
  - Confianza: alta | media | especulativa

Guarda la salida completa en docs/abogado/01-afiliados-objeciones.md
```

---

## PASADA 2 — Verificar

**Sesión nueva de Code. No continúes la anterior.**

```
Eres verificador. Alguien más escribió las objeciones de
docs/abogado/01-afiliados-objeciones.md. No sabes quién ni cómo llegó a ellas,
y no te importa. Tu único trabajo es comprobar si cada una se sostiene con
evidencia real de este repositorio.

Repo: ~/Desktop/Carni-mvp

FUENTES DE VERDAD — solo estas cuentan como evidencia:
  supabase/migrations/202604100001_initial_schema.sql
  supabase/migrations/202604100002_rls_policies.sql
  supabase/migrations/202604100003_functions.sql
  supabase/seed.sql
  src/, server/, package.json
  docs/blueprints/module-scopes.md
  docs/brain/vision.md

Para CADA objeción, en orden:

1. Abre los archivos que cita. Si no cita ninguno, márcala de inmediato como
   SIN EVIDENCIA.
2. Verifica que la tabla, columna, función o archivo mencionado EXISTA de verdad.
   Pega la línea exacta que lo prueba.
3. Verifica que la consecuencia se siga de esa evidencia y no de una suposición
   sobre cómo funciona el sistema.
4. Emite uno de estos veredictos:

   CONFIRMADA      — la evidencia existe y sostiene la objeción
   PARCIAL         — la evidencia existe pero la consecuencia está exagerada
   SIN EVIDENCIA   — no cita nada verificable, o lo que cita no existe
   FALSA           — lo que afirma es contradicho por el repo

5. Si el veredicto es FALSA, pega la línea del repo que la contradice.

REGLAS
- No agregues objeciones nuevas. No es tu trabajo.
- No propongas soluciones.
- No escribas código ni toques archivos fuera del reporte.
- Si no puedes verificar algo por falta de acceso, escribe NO VERIFICABLE y di
  qué necesitarías. No adivines.

SALIDA: docs/abogado/02-afiliados-verificacion.md
Termina con un conteo: cuántas CONFIRMADA, PARCIAL, SIN EVIDENCIA, FALSA.
```

---

## PASADA 3 — Juzgar

**Tercera sesión.** Aquí entra `judgment-day`, que ya tienes instalada (revisión adversarial doble).

```
Usa la skill judgment-day sobre docs/abogado/02-afiliados-verificacion.md

Trabaja SOLO con las objeciones marcadas CONFIRMADA o PARCIAL.
Descarta las SIN EVIDENCIA y las FALSAS — ya murieron.

Tesis original:
"Un cliente de Carni-mvp puede referir a otro cliente y cobrar una recompensa,
sin que exista una forma rentable de defraudar el sistema."

Para cada objeción sobreviviente responde:

1. ¿Mata la tesis, la reduce, o solo agrega una restricción de implementación?
2. Si mata: ¿qué tendría que ser verdad para que la tesis se salvara?
3. Si reduce: ¿cuál es la versión más chica de la tesis que sobrevive a esta
   objeción?
4. Costo de atenderla: alto / medio / bajo, y por qué.

Al final, y solo al final, escribe la TESIS SOBREVIVIENTE: la versión más chica
que aguanta todas las objeciones confirmadas. Una frase.

REGLAS: no código, no archivos, no soluciones de implementación.
SALIDA: docs/abogado/03-afiliados-juicio.md
```

---

## Criterio de parada

Se para el loop cuando pasa cualquiera de estas:

- La pasada 3 devuelve una tesis sobreviviente que aguanta todo lo confirmado
- La pasada 2 reporta **más del 50% SIN EVIDENCIA o FALSA** → el problema es el prompt de la pasada 1, no la idea. Reescribe el prompt, no corras otra pasada
- La tesis sobreviviente queda tan reducida que ya no vale la pena construirla → decisión tomada, y es un buen resultado

**No corras una cuarta pasada.** Si a la tercera no hay claridad, el problema es la tesis, no la cantidad de análisis.

---

## Lo que sigue siendo tuyo

El loop **no decide**. Produce objeciones verificadas y ordenadas. La clasificación final en tres cubetas —**mata la idea / cambia el alcance / ruido**— y la decisión de construir o no, son tuyas. Esa parte no se automatiza, y no debería.

---

## Sobre automatizarlo del todo

Tienes `archon` instalada, que es un motor de workflows en YAML para ciclos plan→implement→validate. En teoría este loop cabe ahí como un workflow reutilizable para las 6 tesis.

**No te doy el YAML porque no leí su `SKILL.md`** — está en `~/.claude/skills/archon/` y no alcanzo esa ruta desde Cowork. Inventarte la sintaxis sería exactamente el error que este loop existe para evitar.

Si lo quieres automatizado: pídele a Code que lea `~/.claude/skills/archon/SKILL.md` y convierta estas tres pasadas en un workflow. El contrato de esa skill manda sobre lo que yo escriba aquí.

---

## Costo

Tres pasadas son tres veces el gasto de una. Vale la pena en afiliados y en el rediseño, donde equivocarse cuesta semanas o dinero real. Para las prácticas de React, con una pasada basta — el riesgo es una calificación, no el negocio.

Nota lateral: uno de los reels que guardaste, de Soy Enrique Rocha, se llama *"Claude con reglas gasta mucho menos"*. Aplica aquí. Las reglas explícitas de cada pasada —qué no hacer, qué formato, cuándo parar— son justamente lo que evita que el loop se vaya de precio.
