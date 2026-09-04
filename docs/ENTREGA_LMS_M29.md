Hola, profe Sergio. Espero que se encuentre muy bien.

Le comparto la Práctica m29 de React III. Igual que en la m28, la construí
**dentro del proyecto real** en lugar de como un ejercicio aparte: es la tienda
en línea de la Carnicería El Señor de La Misericordia, un negocio familiar de San
Luis Potosí. Los requisitos técnicos se cumplen íntegros; lo que cambia es el
dominio, no la técnica.

Lo que se puede probar, sin instalar nada:

• Catálogo
  https://carniwebpwa.netlify.app/products.html

• Ficha de producto, que es donde vive todo lo del módulo
  https://carniwebpwa.netlify.app/products.html#/producto/13

• Pull request con el código
  https://github.com/pipeTawns-x/Landingpages-Carni.pwa/pull/8

Al tocar cualquier tarjeta del catálogo se abre su ficha: ahí están las dos
rutas, useParams y Link funcionando.


DÓNDE SE CUMPLE CADA REQUISITO

1. Custom hook con carga, éxito y error
   src/hooks/useSupabaseQuery.ts

2. Petición GET a una API
   js/modules/supabase.js — la base de datos es Supabase

3. Formulario controlado
   src/pages/ProductoDetalle.tsx — modo de compra, cantidad, unidad, grosor y
   observaciones para el carnicero

4. Renderizado condicional: cargando, error y vacío
   src/pages/ProductoDetalle.tsx — las tres ramas, más los tres modos de compra

5. Botón de reintentar
   La función reintentar() del hook, con un contador en las dependencias del
   efecto

6. Dos rutas con React Router
   src/entry/products.tsx — "/" y "/producto/:id"

7. useParams
   src/pages/ProductoDetalle.tsx — el id del producto sale de la URL

8. Link en cada elemento
   src/components/ProductCard/ProductCard.tsx


SOBRE LA ADAPTACIÓN AL PRODUCTO REAL

El módulo pide un custom hook. La práctica terminó con cuatro, y cada uno existe
por una de las dos razones que usted explicó en clase: DRY o complejidad.

El más interesante es useUnidadInteligente. En una carnicería el precio va por
kilo, así que quien quiere medio kilo escribe "0.5" — y "0.5 kg" no es como nadie
pide carne. El hook convierte solo: 0.5 kg pasa a 500 g, 1000 g pasa a 1 kg, y
avisa lo que hizo. La conversión espera a que el cliente deje de escribir, porque
convertir a media tecla le cambia el campo bajo los dedos.

También quiero comentarle tres defectos reales que salieron al hacerla, porque
creo que ahí se aprendió más que en el código nuevo. Ninguno se dedujo leyendo:
los tres se midieron en el navegador.

El primero costaba dinero. La función que decide si un corte se cotiza por grosor
comparaba contra una categoría que no existe en la base de datos, y además pedía
una etiqueta que el código de React nunca escribe. Fallaba por las dos
condiciones a la vez, sin un solo error en consola: tres Rib Eye de pulgada y
media se cobraban en $372.00 en lugar de $892.80.

El segundo fue el parpadeo del catálogo. Montaba directo sobre un arreglo de
respaldo con 33 productos escritos a mano y un instante después los cambiaba por
los 53 reales de la base. Por medio segundo el cliente veía productos que la
carnicería no vende. Se resolvió con un esqueleto de carga desde estado vacío, y
ahí apliqué algo de la clase 3: el setLoading va en el finally y nunca dentro del
try, porque si va en la rama del éxito, una petición que falla deja el esqueleto
girando para siempre y el mensaje de error no llega nunca a verse.

El tercero fue un error de lectura mío. Un documento del proyecto afirmaba que
React estaba tirando nueve campos del carrito. Sembré un producto configurado,
recargué, y los ocho sobrevivieron: la línea que lo "probaba" era un comentario
en pasado que describía un bug ya arreglado. Aprendí a comprobar el tiempo verbal
de un comentario antes de construir encima.

Una decisión técnica que quiero justificar: usé HashRouter y no BrowserRouter. El
sitio se publica en dos destinos que sirven desde raíces distintas — Netlify desde
la raíz y GitHub Pages desde un subdirectorio. Un router de ruta necesitaría un
basename por destino más una regla de reescritura en el servidor para que
/producto/12 no diera 404. Un hash nunca llega al servidor, y la ruta, useParams
y Link funcionan igual.

Quedo atento a sus comentarios y a lo que haya que corregir.

Muchas gracias por la revisión y por la retroalimentación de la práctica
anterior; la de "dar continuidad al proyecto" fue justo lo que guió esta entrega.

Saludos cordiales,
Eduardo Torres Aguilar
