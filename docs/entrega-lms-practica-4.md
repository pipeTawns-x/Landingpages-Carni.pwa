¡Hola profe Sergio! ¿Cómo va todo?

Le mando la práctica del módulo de estilos. Otra vez seguí con el mismo proyecto en vez de armar un ejercicio aparte: es la tienda de la Carnicería El Señor de La Misericordia, el negocio de mi hermana aquí en San Luis Potosí. Ya van varias prácticas encima del mismo código y la verdad se nota, porque cada módulo nuevo me obliga a arreglar algo que había dejado a medias.

## Para correrlo

```bash
git clone -b practicas-ebac https://github.com/pipeTawns-x/Landingpages-Carni.pwa.git
cd Landingpages-Carni.pwa
npm install
npm run dev
```

Abre en `http://localhost:3002` (el puerto está fijo en `vite.config.js`).

- **Commit de la práctica:** `f8bb65f1`
- **Pull request:** https://github.com/pipeTawns-x/Landingpages-Carni.pwa/pull/9

## Dónde está cada cosa

| Requisito | Archivo |
|---|---|
| styled-components instalado | `package.json:35` (6.5.3) |
| Tema | `src/theme/carniTheme.ts:9` |
| ThemeProvider | `src/entry/products.tsx:458` |
| Tipos del tema | `src/theme/styled.d.ts:12` |
| createGlobalStyle | `src/styles/globalStyles.ts:18` |
| Estilos según props | `src/components/CartPanel/CartPanel.tsx:24` (`$isOpen`) |
| | `src/components/ProductCard/ProductCard.tsx:20` (`$size`) |
| | `src/components/Lupa/Lupa.tsx:217` (`$open`) |
| Herencia entre componentes | `src/components/Lupa/Lupa.tsx:412` (`styled(Chip)`) |

Dos cosas que me parecieron lo más útil del módulo:

El tema no me lo inventé. `carniTheme.ts` copia los valores de `css/abstracts/_variables.scss`, que es de donde ya vivían los 45 archivos SCSS del proyecto. Así la parte de React y el CSS de siempre hablan el mismo idioma, y si mañana cambia un color hay un solo lugar donde tocarlo.

El prefijo `$` de las props tampoco es adorno. Sin él, styled-components le pasa la prop al DOM y el navegador se queja por cada `isOpen` que no es un atributo HTML de verdad. Con `$` se queda en la plantilla y ya.

## Lo que me salió mal y tuve que arreglar

Aquí aprendí más que escribiendo lo nuevo.

**El buscador nunca funcionó, y se veía perfecto.** Le pedía a la base dos columnas que no existen, así que el servidor respondía 400 en cada búsqueda desde el primer día. No se notaba porque el error caía en unos datos de respaldo que tengo en el código y la lista salía creíble: "Pollo Entero, $85 el kilo" cuando en la base vale $119. Lo que lo tapaba era una línea: yo leía solo los datos y no el error. Supabase no lanza excepciones, devuelve las dos cosas, así que un 400 entraba como si fuera "no hay resultados". Ahora leo el error primero.

**Y un lío de scroll que me costó tres intentos.** En la ficha del producto quería que el panel de configuración se quedara fijo mientras corren las fotos. Primero puse el sticky en la foto y se montaba encima de los productos sugeridos. Lo quité. Luego lo puse en el panel y pasó lo mismo al revés: ahora era el panel el que tapaba las tarjetas. El detalle es que un elemento pegajoso se frena en el borde de su contenedor, y el mío era hijo directo de la rejilla, así que no tenía dónde pararse. Metiéndolo en una columna que sí se estira, se detiene justo donde terminan las fotos.

## Sobre la herramienta

Mientras hacía esto me enteré por un video de midudev de que styled-components está en modo mantenimiento desde marzo de 2025. Su propio mantenedor lo dijo así: para proyectos nuevos no lo recomendaría. Las razones son de fondo: no encaja bien con React Server Components y mete el CSS mientras la página se dibuja, en vez de dejarlo listo desde el build.

Aun así la entrega va con styled-components a propósito, porque es lo que pide la práctica y porque la librería está congelada, no rota. Para lo que hace el proyecto funciona perfecto.

Lo que sí dejé planeado es la migración a Tailwind para la versión de producción, en la rama `main`. Tailwind no tiene coste en tiempo de ejecución, el CSS sale del build, y sigue vivo. La idea es hacerlo de a un componente por vez y en este orden: primero la lista del pedido, que está aislada; luego la tarjeta de producto, que se repite 53 veces y es donde más se nota; después el panel del carrito, que tiene props dinámicas y hay que traducirlas a clases; y de último el buscador, que es el más grande. Con captura antes y después en cada paso, a 390 y a 1440. Si algo se rompe, se rompe un componente y no la web entera.

Gracias por la revisión, profe. Un salUdos.
