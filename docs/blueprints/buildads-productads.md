# BuildAds y ProductAds — decisiones abiertas

> # ⛔ CONGELADO
>
> Por `docs/DECISION_ALCANCE_2026-08-13.md`. Lo que falta para descongelar, textual
> de esa tabla:
>
> | Módulo | Estado | Qué falta para descongelarlo |
> |---|---|---|
> | BuildAds | Scaffold `BuildAdsOrchestrator.tsx` | Presupuesto publicitario real, llaves de Predis y ElevenLabs |
> | ProductAds | Nada construido | Fotos de producto de calidad |
>
> **Este documento no diseña nada.** No hay arquitectura, no hay esquema, no hay
> componentes, no hay plan de implementación. Solo registra las tres preguntas
> que hay que responder **antes** de que diseñar tenga sentido, para que no se
> vuelvan a descubrir desde cero cuando llegue el momento.
>
> Escribir una línea de BuildAds o ProductAds sigue prohibido.

---

## Por qué existe este archivo

El 2026-08-27 se le pidió a `the-architect` que diseñara los dos módulos. Su
regla 1 es que la fase de descubrimiento es obligatoria: **no genera el
blueprint antes de completarla.** Al recorrerla aparecieron tres preguntas que
no se pueden resolver leyendo el código, porque no son técnicas: son del
negocio.

Y son de las que bifurcan la arquitectura, no de las que se ajustan después.
Responderlas mal cuesta una reescritura; responderlas tarde cuesta lo mismo.

Se dejaron sin responder a propósito. Aquí quedan escritas.

---

## Decisión abierta 1 · Cómo aprende ProductAds

**La pregunta:** cuando una campaña funciona mejor que otra, ¿qué hace el
sistema con esa información?

Tres caminos, y no son intercambiables:

| Camino | Qué implica | Coste de equivocarse |
|---|---|---|
| **Bitácora de decisiones + reglas** | Guardar qué se publicó, qué resultó, y reglas escritas por una persona | Bajo. Se puede migrar después |
| **Embeddings sobre resultados** | Base vectorial, modelo de similitud, infraestructura nueva | Alto. Trae dependencias que ya no se sacan |
| **Las dos, por fases** | Empezar por la bitácora, y solo si hay volumen, añadir la parte vectorial | Bajo, si de verdad se respeta el orden |

**Por qué bifurca:** la opción vectorial mete una base de datos nueva, un modelo
de embeddings y un coste recurrente en un módulo que todavía no ha demostrado
que vende un kilo de carne. La bitácora es una tabla.

**El dato que falta:** cuántas campañas al mes va a correr la carnicería. Por
debajo de cierto volumen no hay nada que aprender — no hay muestra. Con dos
campañas al mes, un modelo de similitud es teatro.

---

## Decisión abierta 2 · Cómo se publica: por API o a mano

**La pregunta:** ¿existen cuentas de desarrollador de Meta y de TikTok, o no?

| Si existen | Si no existen |
|---|---|
| Publicación por API, con OAuth, refresco de tokens, manejo de rechazos y cuotas | Exportación manual: el sistema genera la pieza, una persona la sube |

**Por qué bifurca:** no es un detalle de integración, es **la mitad del módulo**.
La vía API arrastra almacenamiento de tokens de terceros, renovación,
tratamiento de rechazos de la plataforma y revisión de la app por Meta —que
tarda semanas y puede ser denegada. La vía manual no arrastra nada de eso: el
sistema termina en un archivo descargable.

**Por qué importa aquí y no en general:** este proyecto ya tiene reglas duras
sobre credenciales. Guardar tokens de Meta y TikTok abre una superficie que hoy
no existe, en un repositorio que ya filtró llaves una vez.

**El dato que falta:** si Eduardo o el dueño tienen esas cuentas creadas, y si
están dispuestos a pasar por la revisión de aplicación de Meta.

---

## Decisión abierta 3 · Si hay techo de gasto, y quién lo hace cumplir

**La pregunta:** ¿hay un límite mensual de gasto publicitario?

| Si hay techo | Si no hay |
|---|---|
| Hace falta una tabla de presupuesto con tope duro, verificado **en el servidor** antes de cada publicación | El módulo no necesita saber de dinero |

**Por qué bifurca:** un tope que se verifica en el cliente no es un tope. Esta
lección ya se pagó en este proyecto: **P-01** fue exactamente eso —el precio del
pedido lo ponía el cliente— y hubo que arreglarlo con una migración que mueve el
cálculo al servidor. La misma forma de error, aplicada a gasto publicitario,
significa que un fallo del navegador quema dinero real.

Si hay techo, se diseña desde el primer día con la restricción en la base de
datos. No se añade después.

**El dato que falta:** el número. Es el mismo que la decisión del 2026-08-13
lista como bloqueante para BuildAds: *"presupuesto publicitario real"*.

---

## Lo que NO se hizo, y por qué

- **No se diseñó la arquitectura.** El módulo está congelado y las tres
  preguntas siguen abiertas. Diseñar sobre tres incógnitas produce un documento
  que hay que tirar.
- **No se pasó por `abogado-del-diablo`.** No hay propuesta que atacar. Un
  abogado del diablo sobre un documento sin tesis no produce objeciones, produce
  ruido.
- **No se tocó `docs/DECISION_ALCANCE_2026-08-13.md`.** Sigue congelado, con las
  mismas condiciones.
- **No se escribió una línea de código de ninguno de los dos módulos.**

## Cómo se retoma

Cuando el dueño entregue los números, este archivo se lee **antes** de invocar
al arquitecto. Las tres preguntas dejan de ser incógnitas y el descubrimiento
arranca desde aquí en vez de desde cero.

Mientras tanto: congelado.
