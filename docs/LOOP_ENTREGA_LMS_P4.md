# Entrega LMS — Práctica 4 (Estilos con React)

> **NO PUBLICADO.** Este archivo es el texto listo para que Eduardo lo copie y
> pegue en el LMS. Nadie más lo envía.
>
> Lección: https://lms.ebac.mx/lesson/c5998627-c749-4d51-bf17-ee5fc88c9abd
> Rama: `practicas-ebac` · PR: https://github.com/pipeTawns-x/Landingpages-Carni.pwa/pull/9
> Commit de la práctica: `f8bb65f1` · Cabeza al entregar: `9c399dfd`

---

¡Hola, profe Sergio! Espero que se encuentre muy bien.

Le comparto la Práctica del módulo de Estilos con React. Como en las anteriores,
le seguí dando continuidad al mismo proyecto en lugar de hacer un ejercicio
aparte: la tienda en línea de la Carnicería El Señor de La Misericordia, un
negocio familiar de aquí de San Luis Potosí.

Los requisitos técnicos se cumplen íntegros; lo que cambió es el dominio, no la
técnica.


PARA CORRERLO EN LOCAL

    git clone -b practicas-ebac https://github.com/pipeTawns-x/Landingpages-Carni.pwa.git
    cd Landingpages-Carni.pwa
    npm install
    npm run dev

Abre en http://localhost:3002 (el puerto está fijado en vite.config.js:9).


DÓNDE ESTÁ CADA REQUISITO

1. styled-components instalado y en uso
   package.json:35  ·  styled-components 6.5.3

2. Tema con ThemeProvider
   src/theme/carniTheme.ts:9   ·  los tokens
   src/entry/products.tsx:458  ·  el ThemeProvider del catálogo
   src/theme/styled.d.ts:12    ·  DefaultTheme extendido, para que el tema
                                  tenga tipos dentro de cada plantilla

3. Estilos globales con createGlobalStyle
   src/styles/globalStyles.ts:18

4. Componentes estilizados
   src/components/CartPanel/CartPanel.tsx:24   ·  el cajón del pedido
   src/components/ProductCard/ProductCard.tsx:20 ·  la tarjeta de producto
   src/components/Lupa/Lupa.tsx:193            ·  el popin de búsqueda

5. Estilos que dependen de props
   src/components/CartPanel/CartPanel.tsx:24   ·  $isOpen mueve el panel
   src/components/ProductCard/ProductCard.tsx:20 ·  $size y $isIAContent
   src/components/Lupa/Lupa.tsx:182            ·  $open en el fondo oscuro

6. Herencia entre componentes estilizados
   src/components/Lupa/Lupa.tsx:329  ·  RecentChip = styled(Chip)


SOBRE LA ADAPTACIÓN AL NEGOCIO REAL

El tema no lo inventé: `src/theme/carniTheme.ts` copia 1:1 los valores de
`css/abstracts/_variables.scss`, que es el archivo del que ya vivían los 45 SCSS
del proyecto. Así la capa React y el CSS de siempre hablan el mismo ADN, y si
mañana cambia un token en el SCSS hay un solo lugar al que seguirle.

El prefijo `$` de las props transitorias tampoco es adorno. Sin él,
styled-components pasa la prop al DOM y el navegador escupe un aviso por cada
`isOpen` que no es un atributo HTML válido. Con `$` la prop llega a la plantilla
y se queda ahí.

La lupa de búsqueda está hecha mirando la de Louis Vuitton: un popin que baja
del encabezado —no un overlay que tapa todo—, con dos secciones de resultados y
un mini menú de tendencias debajo del campo. Lo que sí cambié es lo que se
busca: allí son bolsas, aquí son cortes.


LOS TRES DEFECTOS REALES QUE SALIERON

Como en la práctica pasada, aquí aprendí más que escribiendo lo nuevo. Los tres
los medí en el navegador; ninguno lo deduje leyendo el código.

1. La búsqueda en vivo nunca funcionó, y se veía perfecta.
El `select` de la búsqueda pedía dos columnas —`is_promoted` y `badge`— que NO
existen en la tabla: son campos opcionales del tipo de TypeScript que solo
rellena el seed local. PostgREST respondía 400 a cada búsqueda desde el primer
día. No se notaba porque el fallo caía en un respaldo local y la lista se veía
creíble: "Pollo Entero, $85 el kilo" cuando en la base vale $119.

Lo que lo tapaba era una línea: `const { data } = respuesta`. Supabase no lanza
excepciones, devuelve `{ data, error }`; al desestructurar solo `data`, un 400
del servidor entra como si fuera "sin resultados". Ahora se lee `error` antes
que `data`, y un fallo de servidor no puede volver a disfrazarse de búsqueda
que funciona.
   src/components/Lupa/Lupa.tsx:35

2. El cajón del pedido, tapado por el encabezado en el teléfono.
El panel tiene `z-index: 1040` y el encabezado 1035, así que debía ganar. No
ganaba. El panel colgaba de un `div` con `position: relative; z-index: 20`, y
eso abre un contexto de apilamiento: dentro de esa caja el 1040 solo se compara
con sus hermanos, mientras la caja entera compite con el encabezado como si
valiera 20. En un teléfono, el cliente no podía leer el título de su pedido ni
tocar el botón de cerrar.

Subir el número habría sido perseguir el dato equivocado: el problema no era
cuánto valía, era contra quién competía. Se resolvió con `createPortal`, que lo
saca del árbol de cajas sin sacarlo del árbol de React.
   src/components/CartPanel/CartPanel.tsx:217

3. Hojas de estilo huérfanas.
Al migrar aparecieron ocho archivos `.css` y `.scss` que ya no importaba nadie
—42 líneas muertas solo en el panel del carrito— y un `search.js` suelto que
seguía enganchado al mismo botón de la lupa. Se borraron los ocho y el script,
y se limpió también su entrada en el service worker, que lo seguía guardando en
caché.


UNA NOTA SOBRE LA HERRAMIENTA

Mientras hacía la práctica salió que styled-components está en modo
mantenimiento desde el 17 de marzo de 2025. Su propio mantenedor lo dijo así:
"para proyectos nuevos, no recomendaría adoptar styled-components". Las razones
son de fondo: necesita `'use client'` para convivir con React Server Components,
e inyecta el CSS en tiempo de ejecución en vez de extraerlo al build. Lo vi
primero en el video de midudev (https://youtu.be/9GiosVIaDSY) y de ahí fui al
anuncio original.

Aun así la práctica va con styled-components, a propósito: es lo que pide el
enunciado, y la biblioteca está congelada, no rota. La evolución del proyecto a
Tailwind v4 —cero runtime, sin dependencias, plugin oficial de Vite— ya quedó
planificada por escrito, componente por componente y con verificación visual en
cada paso, para hacerla después del merge y no a mitad de una entrega.
   docs/MIGRACION_TAILWIND.md

Gracias por la revisión, profe. Un salu2.
