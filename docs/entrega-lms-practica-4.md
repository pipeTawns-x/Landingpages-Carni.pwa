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

Los seis requisitos están, pero ninguno es de adorno: cada uno hace un trabajo real en una tienda que vende. `$isOpen` es lo que abre y cierra el cajón del pedido. `$open` levanta el buscador. `$size` decide el tamaño de cada tarjeta del catálogo. Y la herencia es `RecentChip = styled(Chip)`, que son las búsquedas recientes de verdad, guardadas y que se pueden borrar una por una.

Dos cosas que me parecieron lo más útil del módulo:

El tema no me lo inventé. `carniTheme.ts` copia los valores de `css/abstracts/_variables.scss`, que es de donde ya vivían los 45 archivos SCSS del proyecto. Así la parte de React y el CSS de siempre hablan el mismo idioma, y si mañana cambia un color hay un solo lugar donde tocarlo.

El prefijo `$` de las props tampoco es adorno. Sin él, styled-components le pasa la prop al DOM y el navegador se queja por cada `isOpen` que no es un atributo HTML de verdad. Con `$` se queda en la plantilla y ya.

## Lo que me salió mal y tuve que arreglar

Aquí aprendí más que escribiendo lo nuevo.

**El buscador nunca funcionó, y se veía perfecto.** Le pedía a la base dos columnas que no existen, así que el servidor respondía 400 en cada búsqueda desde el primer día. No se notaba porque el error caía en unos datos de respaldo que tengo en el código y la lista salía creíble: "Pollo Entero, $85 el kilo" cuando en la base vale $119. Lo que lo tapaba era una línea: yo leía solo los datos y no el error. Supabase no lanza excepciones, devuelve las dos cosas, así que un 400 entraba como si fuera "no hay resultados". Ahora leo el error primero.

**Y un lío de scroll que me costó tres intentos.** En la ficha del producto quería que el panel de configuración se quedara fijo mientras corren las fotos. Primero puse el sticky en la foto y se montaba encima de los productos sugeridos. Lo quité. Luego lo puse en el panel y pasó lo mismo al revés: ahora era el panel el que tapaba las tarjetas. El detalle es que un elemento pegajoso se frena en el borde de su contenedor, y el mío era hijo directo de la rejilla, así que no tenía dónde pararse. Metiéndolo en una columna que sí se estira, se detiene justo donde terminan las fotos.

## Sobre la herramienta, y hacia dónde va el proyecto

Mientras hacía la práctica me puse a investigar y vi tres videos que juntos cuentan la historia completa.

El primero es de **midudev**, sobre styled-components en modo mantenimiento: https://youtu.be/9GiosVIaDSY — Su propio mantenedor lo anunció en marzo de 2025 y lo dijo así: para proyectos nuevos no lo recomendaría.

El segundo es de **Gentleman Programming**, del curso de Next.js: https://youtu.be/ndWmjeoRHR4 — Y me llamó la atención la fecha, porque es de 2023, dos años antes del anuncio. Ahí ya dice: *"a mí me encanta styled-components, me apasiona, en el trabajo lo usamos y es mágico, pero en server rendering es un dolor más que otra cosa"*. O sea que el problema no apareció de golpe: se veía venir.

El tercero es de **Jesús Elías**: https://youtu.be/3jwGbwSr4WE — Se llama "Integrando Styled Components y NativeWind", y al principio pensé que era un video de usar los dos a la vez. No lo es: arranca diciendo que el objetivo es *migrar* de uno al otro. Lo que se ve conviviendo es la mudanza a medias, no el destino.

Entonces, ¿styled-components está muerto? Congelado, más bien: recibe parches de seguridad pero no funciones nuevas. Pero comparado con Tailwind sí se queda atrás, y por razones que se notan en el navegador. styled-components mete el CSS mientras la página se dibuja, así que el estilo pesa en tiempo de ejecución y en cada isla de React que tengo. Tailwind no: el CSS sale del build ya listo, no arrastra librería al navegador, y sigue actualizándose — ya va por la v4. Menos peso, página menos lenta y una herramienta viva son tres cosas que a una tienda que vende sí le importan.

Aun así la entrega va con styled-components a propósito, porque es lo que pide la práctica y porque estar congelado no es estar roto: para lo que hace hoy el proyecto, funciona perfecto.

Lo que sí dejé planeado es migrar a Tailwind en la rama `main`, que es la que va a producción. Y no de un tirón: componente por componente, empezando por los más aislados y dejando el buscador para el final, con captura antes y después en cada paso. Si algo se rompe, se rompe un componente y no la web entera.

Gracias por la revisión, profe. Un salUdos.
