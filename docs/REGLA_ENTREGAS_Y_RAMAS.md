# Regla — qué es del curso y qué es del producto

Estado: vigente desde 2026-09-09 · La fija Eduardo · La siguen todos los agentes

## La regla

**Lo que existe solo para cumplir un enunciado del LMS NO va a `main`.**

Vive en `practicas-ebac` mientras dura la evaluacion, y cuando el bloque
termina se queda en esa rama o pasa a `pruebas`. `main` es el producto que la
carniceria vende, y ahi no entra codigo que solo existe para que un tutor lo
vea.

## Por que

Una practica y un producto responden a preguntas distintas.

La practica pregunta: *"¿demostraste que sabes usar esta herramienta?"* — y a
veces para eso hay que escribir cosas que el negocio no necesita. La practica
m33 pide una funcion `sumArray` que suma un arreglo. La carniceria no suma
arreglos genericos: cotiza cortes.

El producto pregunta: *"¿esto le sirve a quien compra carne?"*

Mezclarlas ensucia `main` con codigo de ejemplo que nadie mantiene y que el dia
de mañana alguien va a leer preguntandose para que existe.

## Como se aplica

**En cada practica se entregan las DOS cosas:**

1. **Lo que el enunciado pide, al pie de la letra.** Con los nombres exactos,
   en las rutas exactas. El tutor tiene que encontrarlo sin buscar. Ya costo 25
   puntos entregar algo que el revisor no vio donde esperaba.
2. **La adaptacion al proyecto real**, cuando el concepto lo permita. Eso es lo
   que subio las entregas anteriores a 100: no demostrar que se copia un
   tutorial, sino que se entiende para que sirve.

**Y se separan por archivo, no por rama.** Las dos viven en `practicas-ebac`.
Al merge a `main` solo pasa la segunda.

## Ejemplo — practica m33, Testing con Jest

| Que | Donde | Va a main |
|---|---|---|
| `functions.js` con sumArray, countWords, findMax, isDivisible | raiz del repo | NO |
| `tests/functions.test.js` con los 16 tests del enunciado | `tests/` | NO |
| Tests de `quote.js`, `premium-cuts.js` y los slices | junto a su codigo | SI |

Los dos primeros son del curso: cumplen el enunciado y se quedan en
`practicas-ebac`. El tercero es del producto y protege una funcion que ya
cobro 520.80 pesos de menos sin avisar.

## Lo que NO cambia

- `main` recibe la version completa o no recibe nada. No hay goteo de practicas.
- El merge a `main` lo decide Eduardo, nunca un agente.
- Mientras dura la evaluacion, la rama por defecto del repo es `practicas-ebac`.
