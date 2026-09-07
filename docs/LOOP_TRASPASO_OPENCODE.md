# Lazo de traspaso · Para el agente que continúa en OpenCode o Kimi

**Repositorio: `~/Desktop/Carni-mvp`. Rama `main`, HEAD `76eff873`.**

No arrancas de cero. Hay meses de trabajo, un sistema de diseño que funciona y
una entrega de EBAC lista. **Tu primer trabajo no es escribir código: es
entender qué hay y comprobar que lo que te contaron es cierto.**

---

## Paso 0 · Recupera la memoria antes de mirar el código

```
mem_search(query: "carni/estado/2026-09-04", project: "carni-mvp")
mem_get_observation(id)          ← obligatorio: la búsqueda viene truncada
```

Esa observación es el punto de traspaso. Después, para cada tema que toques:

```
carni/carrito/modos-trifasicos        los tres modos de compra
carni/carrito/premium-inalcanzable    el defecto de los $520.80
carni/carrito/ambiguedad-peso-piezas  por qué peso y piezas se contradecían
carni/carrito/cajon-unico-contenedor  cajón vs página, y por qué se revirtió
carni/carrito/spec-codepen            los campos reales del pen dPGYMxJ
carni/landing/resenas-google          las 7 reseñas y la línea de PROFECO
carni/auth/proveedores-sociales       Google, Facebook, Apple ID. X fuera
carni/ebac-react-3/…                  29 observaciones del módulo anterior
```

El grafo del repositorio se regenera solo en cada commit, en `graphify-out/`
(ignorado por git). Para orientarte:

```bash
graphify explain "ProductoDetalle"
graphify path "usePedido" "CartPanel"
```

---

## Paso 1 · Verifica el terreno tú mismo. No te fíes de este documento.

```bash
git log --oneline -12
git status --short                  # hay trabajo sin commitear de sesiones viejas
npx tsc --noEmit                    # debe salir vacío
npm run build                       # destino Netlify
npm run build -- --base=/Landingpages-Carni.pwa/   # destino GitHub Pages
```

**El servidor de desarrollo va en el puerto 3002**, no en el 5173. Está en
`vite.config.js:9` y en `package.json:8`. Un agente anterior escribió 5199 de
memoria y colgó de ahí todas sus verificaciones: apuntaban a un origen muerto.

```bash
curl -sI http://localhost:3002/index.html | head -1
# si no responde:  nohup npm run dev > /tmp/vite.log 2>&1 &
```

---

## Paso 2 · Ponme a prueba. Estas seis afirmaciones son mías y pueden estar mal.

**No las creas. Compruébalas.** Si alguna es falsa, dilo con la evidencia — eso
vale más que cualquier código que escribas hoy.

**1.** *"El motor de cotización premium era inalcanzable y cobraba $520.80 de
menos por pedido de Rib Eye."*
Siembra en `localStorage` un item con `categoria: 'cortes-especiales'`, `tipo: 'kg'`,
`grosor: 1.5`, `basePeso: 0.4`, `orderMode: 'pieces'`, `requestedPieces: 3`.
Importa `js/modules/core/premium-cuts.js` en la consola y comprueba
`esCortePremium`. ¿Da `true`? ¿Y antes del arreglo daba `false`?

**2.** *"No existe ninguna categoría con slug `premium` en Supabase."*
Consulta la tabla `categories` con la llave anon del `.env`. ¿Cuántas hay? ¿Cómo
se llaman?

**3.** *"El carrito no bloquea la página en escritorio, y sí en móvil."*
Abre el cajón a 1440 y mira `getComputedStyle(document.body).overflow`. Repite a
375. **Ojo:** el desplazamiento programático no se puede medir si el panel del
navegador reporta `document.hidden`. Compruébalo antes de creer un cero.

**4.** *"Los cinco componentes con estilos tienen un `.scss` que nadie lee."*
Es el defecto abierto del módulo de Estilos. Verifica qué importa cada `.tsx` y
cuenta las líneas de cada `.scss`. ¿Son 42 muertas en CartPanel y 24 en
ProductCard, o son otras?

**5.** *"Las 13 rutas archivo:línea de `docs/ENTREGA_LMS_M29.md` son exactas."*
Recórrelas con `sed -n '<n>p' <archivo>`. Un tutor que hace clic en una línea
equivocada califica peor que uno que no ve la lista.

**6.** *"La lupa abre a la primera y cierra sin dejar nada colgado."*
Ábrela y ciérrala tres veces seguidas en las tres páginas. Después de cada
cierre: ¿queda `overflow` en el `body`? ¿queda la clase `lupa-abierta`? ¿queda
algún telón?

---

## Paso 3 · Lo que sigue, y en este orden

**`docs/LOOP_ESTILOS_REACT.md`, bloques 2, 3 y 4.** Es la práctica de EBAC que
está abierta.

- **Bloque 2:** instalar `styled-components`, `ThemeProvider` con los valores
  **reales** de `css/abstracts/_variables.scss` —los mismos, no unos nuevos— y
  `createGlobalStyle`. Sin tocar componentes. El sitio se ve igual.
- **Bloque 3:** migrar de dos en dos, empezando por `CartPanel`, `ProductCard` y
  `CarrilCategorias`. Al migrar cada uno, **borra su `.css` y su `.scss`**.
- **Bloque 4:** el mensaje del LMS, con la estructura de `docs/ENTREGA_LMS_M29.md`.

El método del profesor está en `docs/RESUMEN_ESTILOS_REACT.md`, sacado de las
transcripciones reales: carpeta `src/theme/` con `index` y `global`,
`styled-reset` desde npm, `ThemeProvider` arriba de todo, y los valores leídos
con `props => props.theme.algo`.

**El riesgo real de ese bloque:** los componentes comparten clases con el SCSS
global (`tw-card-shell`, `producto-card`), y esas reglas pueden pelear con los
estilos nuevos. **Verifica mirando, con capturas antes y después a 390 y 1440.**

---

## Las ocho reglas de método. Se cumplen aunque nadie las repita.

**1 · Mide antes de creer, incluso a este documento.** Si el código lo
contradice, gana el código. Lo reportas y sigues.

**2 · Un comentario en pasado no es evidencia de un fallo presente.** Un brief de
este proyecto afirmó que React tiraba nueve campos del carrito; se sembró el
dato, se recargó, y los ocho sobrevivían. La línea que lo "probaba" describía un
bug ya arreglado.

**3 · Reproduce el defecto antes de arreglarlo.** Siembra el dato, recarga, mide,
y **solo entonces** toca código. Si no puedes reproducirlo, dilo.

**4 · Lee lo que hay sin commitear antes de tocarlo.** `git status` primero. Un
agente sobrescribió con `cat >` un hook que ya existía y estaba commiteado.

**5 · Un cambio, una verificación.** Para lo visual, captura a **390 px**. Para
lo lógico, un caso que falle antes y pase después. *"Debería funcionar"* no es
una verificación.

**6 · Separa lo medido de lo interpretado.** Y di explícitamente **qué no
pudiste verificar**. Cinco cosas honestas valen más que ocho inventadas.

**7 · Cuando dos diseños chocan, no elijas tú.** Es decisión de producto.
Pregunta.

**8 · No amplíes el alcance por tu cuenta.** Si encuentras algo roto que no está
en el brief, anótalo en `docs/PENDIENTES.md` y sigue.

---

## Trampas de este repositorio, ya pagadas

- **`npm run css:components`** compila `sass src/components:src/components` — el
  directorio **entero**. Borra sin avisar cualquier edición hecha a mano en un
  `.css` generado. Ahí vivió durante días un `overflow: hidden` que congelaba el
  escritorio y que **no estaba en su `.scss` fuente**.
- **El panel del navegador reporta `document.hidden = true`.** No procesa
  desplazamiento programático ni despacha `focusin`. Esas dos cosas **no se
  pueden medir ahí** — no las reportes como defecto sin comprobar `document.hidden`.
- **`grid-template-areas`:** un hijo sin área asignada **no se queda fuera de la
  rejilla, se coloca solo**. Así se rompió la ficha en escritorio.
- **Un elemento `sticky` se estira al alto de su área de rejilla.** Con
  `align-self: start` se queda en su fila.
- **Vite deja su caché de dependencias vieja** tras instalar un paquete nuevo, y
  React queda duplicado: página en blanco con `Invalid hook call`, mientras
  `tsc` y el build siguen en verde. Se arregla con `rm -rf node_modules/.vite`.
- **GGA no corre desde el 27 de agosto** (`No provider configured`, es P-27).
  Todos los commits van con `--no-verify` **y lo dicen en el mensaje**.

---

## Prohibido

- Tocar `netlify.toml` o `vite.config.js` — los dos sitios están sanos
- Poner un `base` fijo en `vite.config.js`: rompería Netlify
- Tocar `server/routes/buildads.ts` — congelado por
  `docs/DECISION_ALCANCE_2026-08-13.md`
- Arrancar los 45 SCSS de las páginas de JavaScript plano. **Se migra la capa de
  React, no el sitio entero**
- Inventar el peso por pieza o los grosores de pollo, cerdo y embutidos. Los que
  hay son **valores por defecto editables** a la espera de la báscula de la dueña
  (P-19 y P-36)
- `git add .` · `--force` · `sudo` · reescribir historia · borrar ramas
- Decir que algo funciona sin haberlo abierto a **390 px**

---

## Cierre de cada tanda

- `docs/PENDIENTES.md` con la skill `pendientes-carni`: **borrar, no tachar**
- Commit archivo por archivo, verificado con `git diff --cached --name-only`
- Mensaje bilingüe, explicando **por qué** fallaba, no solo qué se cambió
- Guardar en Engram lo que se decidió, lo que se rompió y lo que se aprendió

**Dos cosas cerradas y verificadas valen más que seis empezadas.** Ha sido el
problema de este proyecto desde el principio.
