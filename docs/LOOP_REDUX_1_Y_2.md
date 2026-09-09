# LOOP — Reparar el 75, después Redux 1, después Redux 2

Rama: `practicas-ebac` · Human-in-the-loop en cada entrega · Nadie pasa de paso
sin que Eduardo confirme que el LMS respondió.

---

## PASO 0 — Por qué salió 75, verificado

El feedback de Salvador dice que "no se identifica createGlobalStyle, un tema
compartido y ThemeProvider, componentes creados con styled-components, estilos
dinámicos con props".

**Todo eso SÍ existe.** Está verificado línea por línea. Lo que pasó es otra
cosa, y son tres causas distintas:

### Causa 1 — el revisor miró `main`, y en `main` no hay nada de esto

Comprobado:
- `origin/main` → `package.json` NO contiene `styled-components`
- `origin/main` → `src/theme/carniTheme.ts` NO existe
- PR #9 → `state: OPEN`, `mergedAt: null`

El mensaje decía `git clone -b practicas-ebac`, pero un revisor que abre el repo
en el navegador no clona: ve la rama por defecto, que es `main`. Y ahí la
práctica literalmente no está. Por eso su lista de faltantes es exactamente la
lista de todo lo que entregamos.

**Esto vale la mayor parte de los 25 puntos y es culpa de la entrega, no del
revisor.**

**Arreglo, decidido por Eduardo el 2026-09-09: NO se mergea a `main`.**

`main` recibe la versión completa —Redux 1, Redux 2, styled-components, React
1/2/3 y testing— o no recibe nada. No se le hace un goteo de prácticas a la
rama de producción, y el repo se queda atrasado a la vista mientras tanto. Es
una decisión de producto, no una omisión.

Lo que SÍ se hace, y resuelve la causa sin tocar `main`: **cambiar la rama por
defecto del repositorio a `practicas-ebac`** mientras dura la evaluación.

    gh repo edit pipeTawns-x/Landingpages-Carni.pwa --default-branch practicas-ebac

Un revisor que abre el repo en el navegador cae en la rama que tiene la
práctica. No mueve una línea de código, no mergea nada, y se revierte en un
comando el día que `main` reciba la versión completa.

Es de Eduardo ejecutarlo: toca la configuración del repositorio.

### Causa 2 — quedan archivos CSS que el paso 1 mandaba borrar

El enunciado abre con: *"Elimina los archivos CSS que habías creado en los
módulos anteriores"*. Sobrevivieron dos:

    src/components/CategoryCard/styles.css
    src/components/CategoryCard/styles.scss

Y el feedback lo señala textual: *"solo algunos componentes cuentan con
styles.scss y styles.css"*.

Arreglo: migrar `CategoryCard` a styled-components y borrar los dos archivos.

### Causa 3 — no hay un archivo de estilos por componente

El enunciado pide: *"Crea un archivo de estilos para cada componente en la
carpeta components y a su vez en la carpeta de cada componente"*.

Hoy los `styled` viven INLINE dentro de cada `.tsx`:

    ProductList.tsx      1 styled
    ProductCard.tsx      1 styled
    OrderList.tsx        2 styled
    CartPanel.tsx        1 styled
    Lupa.tsx            22 styled
    archivos styles.ts:  0

Funciona, pero no cumple el enunciado literal. Y para `Lupa.tsx` tampoco es
buena práctica: 22 componentes estilizados dentro del archivo de lógica.

Arreglo: extraer a `src/components/<Componente>/styles.ts` y que el `.tsx`
importe. Es mecánico, no cambia una sola regla CSS, y de paso deja `Lupa.tsx`
legible.

### Verificación del paso 0 (la hace Claudia, no Eduardo)

- [ ] `fd -e css -e scss . src/components/` devuelve CERO
- [ ] `fd 'styles.ts' src/components/` devuelve un archivo por componente
- [ ] `npx tsc --noEmit` y `npm run build` en 0
- [ ] captura a 390 y 1440: NADA cambió visualmente
- [ ] lo que el revisor ve al abrir el repo contiene la práctica

---

## PASO 1 — Redux 1: el carrito

### Por qué el carrito y no otra cosa

La práctica original gestiona favoritos en una biblioteca musical: agregar,
quitar, y que la lista viva en un store central.

En Carni-mvp el equivalente no hay que inventarlo — **ya existe el problema que
Redux resuelve**. Hoy escriben el estado del carrito CINCO archivos distintos:

    src/pages/ProductoDetalle.tsx
    src/components/CartPanel/montar.tsx
    src/lib/pedidoStorage.ts
    src/entry/products.tsx
    js/modules/core/cart.js

Y se coordinan con `localStorage` más un `CustomEvent('cart:updated')`. O sea:
un bus de eventos casero, escrito a mano, porque el sitio no es una SPA sino
islas de React que no comparten árbol.

Eso es exactamente para lo que existe Redux. No es un ejercicio adaptado: es el
reemplazo de un parche que ya duele.

### Qué se construye

- `src/store/index.ts` — el store
- `src/store/carritoSlice.ts` — el reducer y las acciones:
  `agregarProducto`, `quitarProducto`, `vaciarCarrito`, `abrirCajon`,
  `cerrarCajon`
- `<Provider>` en cada isla que lo necesite
- `useSelector` / `useDispatch` en `CartPanel`, `ProductoDetalle` y `ProductCard`
- Un puente para `js/modules/core/cart.js`, que es vanilla y no puede usar hooks

### El detalle que hace que valga la pena

`js/modules/core/cart.js` es JavaScript plano y seguirá existiendo. El store se
suscribe y escribe `localStorage`; el vanilla lee de ahí. Redux pasa a ser la
única fuente de verdad y el evento casero se queda solo como aviso al vanilla,
no como mecanismo de sincronización.

### Entrega y human-in-the-loop

1. Claudia implementa y verifica
2. Claudia entrega el mensaje del LMS a Eduardo
3. **Eduardo lo pega en el LMS y espera la respuesta del maestro**
4. Eduardo le pasa a Claudia la respuesta
5. Si hay correcciones, se reparan y se vuelve al punto 3
6. **Solo con el visto bueno se pasa al PASO 2**

No se empieza Redux 2 antes. No se hace doble entrega.

---

## PASO 2 — Redux 2: Redux Toolkit y las consultas a Supabase

### Qué pide

Refactorizar a Redux Toolkit y manejar las peticiones asíncronas con
`createAsyncThunk`.

### Dónde encaja aquí

Las consultas a Supabase. Hoy viven repartidas: `useSupabaseQuery.ts` tiene sus
propios `isLoading` y `error`, y `Lupa.tsx` tiene los suyos aparte.

Se convierten en thunks:

    fetchProductos        el catálogo
    fetchProductoPorId    la ficha
    buscarProductos       la Lupa

### El argumento fuerte, y es del propio proyecto

La Lupa tuvo un bug que costó semanas: la búsqueda devolvía **HTTP 400 en cada
consulta** y nadie se enteró, porque el código leía `data` e ignoraba `error`, y
un respaldo local llenaba la lista con precios inventados.

Con `createAsyncThunk` ese bug **no se puede escribir**: `pending`, `fulfilled`
y `rejected` son tres estados explícitos del slice. Un error no tiene dónde
esconderse.

Eso no es "adaptar la práctica". Es que la práctica arregla algo que ya pasó.

### Entrega

Mismo ciclo del paso 1: implementar, verificar, entregar el mensaje, esperar la
respuesta de Eduardo.

---

## LA MIGRACIÓN A TAILWIND — cuándo, y por qué ahí

**Recomendación: después de ENTREGAR testing, antes del bloque de accesibilidad.**

El orden completo del temario que queda:

    Redux 1 → Redux 2 → Testing → [MIGRACIÓN] → Accesibilidad → Integración
    → Habilidades y entrevistas → Proyecto final

Por qué NO antes de Redux:
- Redux 1 y 2 refactorizan los componentes de la práctica de estilos. Si esos
  componentes dejan de ser styled-components ahora, la cadena de prácticas se
  rompe y el maestro no puede seguir el hilo.

Por qué DESPUÉS de entregar testing, y no antes:
- Testing es una práctica evaluada. No se cambia la capa de estilos de todo el
  proyecto justo antes de una entrega que van a calificar.
- Y al revés funciona a favor: los tests quedan escritos y aprobados sobre
  código estable, y después son la red de la migración.

Por qué los tests NO se rompen por migrar (y qué sí detectan):
- React Testing Library consulta por **rol y texto accesible**, no por clases.
  Un test bien escrito no se entera de que cambió el CSS. Si se rompe por eso,
  el test estaba mal escrito y conviene saberlo.
- Pero si la migración borra un `aria-label`, cambia un rol o rompe un texto
  accesible, ahí **sí** fallan. Eso no es CSS, y es exactamente lo que se quiere
  que salte.

Por qué NO después de accesibilidad:
- Accesibilidad audita contraste, foco visible y estados. Todo eso es CSS. Si se
  audita antes de migrar, se audita dos veces.

Y el proyecto final es un portafolio: llega con la migración hecha y con la
historia completa que contar — por qué se entregó con styled-components, por qué
se migró, y qué se midió antes y después.

---

## REGLAS

- Commits por archivo, conventional commits, mensajes bilingües, `--no-verify`,
  sin `git add .`, sin `Co-Authored-By`.
- Mensajes de commit con `-F -` y heredoc citado: con `-m "..."` el shell come
  las comillas invertidas y trunca el mensaje.
- Nada de publicar en el LMS. Eduardo pega, Eduardo confirma.
- Evidencia antes que opinión: si no lo medí, lo digo.
