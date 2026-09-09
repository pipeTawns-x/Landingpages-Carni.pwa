# LOOP — Redux 2: Toolkit y las peticiones asíncronas

Rama: `practicas-ebac` · Redux 1 entregado en `76799a00` y `abf459a5`
Human-in-the-loop: Eduardo pega el mensaje, Eduardo confirma, recién ahí se cierra.

---

## PASO 0 — Leer el enunciado. NO empezar sin él.

El enunciado literal de la práctica de Redux 2 **todavía no se leyó**. Lo que se
sabe viene de tres fuentes que coinciden, pero ninguna es el enunciado:

1. La práctica de Redux 1 dice textual: *"Esta actividad será una introducción
   básica antes de migrar a Redux Toolkit en el siguiente módulo"*.
2. Eduardo lo describió: refactorizar a Redux Toolkit y usar funciones
   asíncronas para las peticiones.
3. El índice del curso tiene la sección "Redux II".

**Primero se abre la práctica en el LMS y se lee.** Si el enunciado pide algo
distinto de lo que dice este loop, manda el enunciado.

Cómo llegar: desde `/lesson/3dc29fe6-444e-4736-b934-5f48b7b1eb51` (la práctica
de Redux 1), seguir "Ir a la siguiente lección" hasta pasar Redux II. El botón
está en la página y el link real sale de `a[href*="/lesson/"]`.

---

## PASO 1 — De `createStore` a `configureStore`

`src/redux/store.ts` hoy tiene ~20 líneas: `createStore`, el enhancer de
devtools tipado a mano. Con Toolkit son tres.

`configureStore` ya trae devtools, ya trae el middleware de thunks y ya avisa si
mutás el estado sin querer. Lo que en Redux clásico había que armar, viene puesto.

## PASO 2 — De reducer + actions a `createSlice`

Hoy son dos archivos: `carritoActions.ts` (las constantes, los tipos y las
funciones) y `carritoReducer.ts` (el `switch`). `createSlice` los reemplaza por
uno solo y **genera las acciones a partir de los nombres de las funciones**.

Y el detalle que hay que entender, no memorizar: dentro de `createSlice` **sí se
puede escribir `push`**. Parece que contradice todo lo del módulo anterior, y no:
Toolkit usa Immer, que intercepta la mutación y construye el objeto nuevo por
debajo. Escribís como si mutaras; por dentro no se muta nada.

Se conservan las cuatro acciones que ya existen: agregar, quitar, vaciar,
hidratar.

## PASO 3 — `createAsyncThunk` para Supabase

Aquí la práctica deja de ser un ejercicio.

Hoy las peticiones viven repartidas: `useSupabaseQuery.ts` tiene sus propios
`isLoading` y `error`, y la Lupa tiene los suyos aparte. Se convierten en thunks:

    buscarProductos     la Lupa
    cargarCatalogo      el catálogo
    cargarProducto      la ficha

Cada uno da tres estados automáticos —`pending`, `fulfilled`, `rejected`— y el
slice los atiende en `extraReducers`.

**El argumento fuerte, y es del propio proyecto:** la Lupa tuvo un bug que costó
semanas. Devolvía HTTP 400 en cada búsqueda y nadie se enteró, porque el código
leía `data`, ignoraba `error`, y un respaldo local llenaba la lista con precios
inventados: "Pollo Entero $85/kg" cuando en la base vale $119.

Con `createAsyncThunk` ese bug **no se puede escribir**. `rejected` es un estado
explícito del slice. Un error no tiene dónde esconderse.

## PASO 4 — Verificar, y con evidencia

- [ ] `npx tsc --noEmit` y `npm run build` en 0
- [ ] agregar desde la ficha → aparece en el cajón
- [ ] quitar desde el cajón → desaparece
- [ ] buscar en la Lupa → la petición devuelve **200**, no 400
- [ ] apagar la red → el slice queda en `rejected`, la UI lo dice, y NO inventa
      resultados
- [ ] el `cart.js` plano sigue funcionando (es el que no es React)

Ese quinto punto es la prueba de que la práctica sirvió para algo.

## PASO 5 — Entregar

1. Claudia implementa y verifica
2. Claudia entrega el mensaje **en el chat**, no en un documento
3. Eduardo lo pega en el LMS y espera al tutor
4. Eduardo pasa la respuesta
5. Si hay correcciones, se reparan y se vuelve al punto 3

---

## REGLAS

- Commits por unidad de trabajo, conventional commits, mensajes bilingües,
  `--no-verify`, sin `git add .`, sin `Co-Authored-By`.
- Mensajes de commit con `-F -` y heredoc citado: con `-m "..."` el shell come
  las comillas invertidas y trunca el mensaje.
- No publicar en el LMS. Eduardo pega, Eduardo confirma.
- Evidencia antes que opinión: si no se midió, se dice.
- El `cart.js` plano no se toca. No es React y no puede usar hooks; sigue
  leyendo `localStorage`, que es el puente.
