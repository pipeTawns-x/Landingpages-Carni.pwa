¡Hola, profe Sergio! Espero que se encuentre muy bien.

Le comparto la Práctica m29 de React III. Como en la m28, seguí dándole
continuidad al mismo proyecto en lugar de hacer un ejercicio aparte: es la
tienda en línea de la Carnicería El Señor de La Misericordia, un negocio
familiar de aquí de San Luis Potosí.

Los requisitos técnicos se cumplen íntegros; lo que cambió es el dominio, no la
técnica.

Su comentario de la práctica pasada —el de ajustarme a los flujos propuestos
porque algunas actividades dan continuidad al proyecto anterior— fue justo lo
que guió esta entrega.


PARA CORRERLO EN LOCAL

    git clone -b entrega-react-m29 https://github.com/pipeTawns-x/Landingpages-Carni.pwa.git
    cd Landingpages-Carni.pwa
    npm install
    npm run dev

Abre en:  http://localhost:3002/products.html
La ficha, que es donde vive todo lo del módulo:
          http://localhost:3002/products.html#/producto/13

Las credenciales de la base son públicas por diseño (la llave anon de Supabase),
así que el catálogo carga sin configurar nada.


TAMBIÉN ESTÁ PUBLICADO

Catálogo:  https://carniwebpwa.netlify.app/products.html
Ficha:     https://carniwebpwa.netlify.app/products.html#/producto/13
Código:    https://github.com/pipeTawns-x/Landingpages-Carni.pwa/pull/8

Al tocar cualquier tarjeta del catálogo se abre su ficha: ahí están las dos
rutas, useParams y Link funcionando.


LOS OCHO REQUISITOS, CON SU ARCHIVO Y SU LÍNEA

1. Custom hook con carga, éxito y error
   src/hooks/useSupabaseQuery.ts:30

2. Petición GET a una API
   js/modules/supabase.js:163  ·  getProductById(), contra Supabase

3. Formulario controlado
   src/pages/ProductoDetalle.tsx:386  ·  el campo de observaciones, junto a los
   controles de modo, cantidad, unidad y grosor

4. Renderizado condicional: cargando, error y vacío
   src/pages/ProductoDetalle.tsx:203 (cargando) y :214 (error)

5. Botón de reintentar
   src/hooks/useSupabaseQuery.ts:41  ·  reintentar(), un contador en las
   dependencias del efecto

6. Dos rutas con React Router
   src/entry/products.tsx:405 y :406  ·  "/" y "/producto/:id"

7. useParams
   src/pages/ProductoDetalle.tsx:110

8. Link en cada elemento
   src/components/ProductCard/ProductCard.tsx:162


SOBRE LA ADAPTACIÓN AL NEGOCIO REAL

El módulo pide un custom hook. La práctica terminó con cuatro, y cada uno existe
por una de las dos razones que usted explicó en clase: DRY o complejidad. Esa
segunda —extraer aunque no se reutilice, solo porque el componente creció— fue la
que más me sirvió, y creo que es la que casi nadie aplica.

   src/hooks/useSupabaseQuery.ts:30     los tres estados de toda petición
   src/hooks/useUnidadInteligente.ts:59 la conversión de unidades
   src/hooks/usePedido.ts:33            el pedido, compartido por las tres páginas

El que más me gustó escribir es useUnidadInteligente. En una carnicería el precio
va por kilo, así que quien quiere medio kilo escribe "0.5", y "0.5 kg" no es como
nadie pide carne. El hook convierte solo: 0.5 kg pasa a 500 g, 1000 g pasa a 1 kg,
y avisa lo que hizo para que el cliente lo confirme. La conversión espera a que
deje de escribir, porque convertir a media tecla le cambia el campo bajo los
dedos: quien teclea "1000" vería el campo saltar a "0.1 kg" al llegar al tercer
número.

También hay una sección de testimonios con las reseñas reales del negocio en
Google. La hice siguiendo el patrón de carrusel de la ARIA Authoring Practices
Guide del W3C (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), que es más
estricto de lo que parece: para en el hover, para al recibir foco y no se reanuda
al salir, el botón de pausa es obligatorio, y el contenedor va con aria-live="off"
para no interrumpir a un lector de pantalla cada seis segundos.

   src/data/resenas.ts                              los datos
   src/components/Testimonios/TestimonioCard.tsx:23  la tarjeta con props
   src/components/Testimonios/Testimonios.tsx        la sección animada


LOS CUATRO DEFECTOS REALES QUE SALIERON

Creo que aquí aprendí más que escribiendo lo nuevo. Ninguno lo deduje leyendo el
código: los cuatro los medí en el navegador.

1. Un cobro de menos, en silencio.
La función que decide si un corte se cotiza por grosor comparaba contra una
categoría que no existe en la base, y además pedía una etiqueta que el código de
React nunca escribe. Fallaba por las dos condiciones a la vez y sin un solo error
en consola: tres Rib Eye de pulgada y media se cobraban en $372.00 en lugar de
$892.80. Eran $520.80 menos por pedido.
   js/modules/core/cart.js:97 y js/modules/core/premium-cuts.js:67

2. La búsqueda servía un catálogo inventado.
Traía precios escritos a mano que no eran los de la base y rutas de imagen ya
migradas. Al rastrearlo aparecieron 1103 líneas de código muerto en seis
archivos, incluido un custom hook completo que nadie importaba nunca.

3. Dos manejadores peleando por el mismo clic.
Un script viejo seguía enganchado al mismo botón de la lupa y hacía
window.location.href. A veces ganaba el salto y el panel simplemente no abría.
Se veía como intermitencia y era una carrera entre dos manejadores.

4. Una clase que se quedaba pegada al body.
El panel de búsqueda quitaba su clase al cerrarse, pero un cambio de ruta lo
desmonta sin llamar nunca a esa función, y la clase quedaba puesta. Lo único que
volvía a tocar el body era un efecto del carrito, así que para salir de la
búsqueda había que abrir el carrito. Ahora la limpieza va en el retorno del
useEffect, que es lo que corre al desmontar.


UNA DECISIÓN QUE QUIERO JUSTIFICAR

Usé HashRouter y no BrowserRouter. El sitio se publica en dos destinos que sirven
desde raíces distintas: Netlify desde la raíz y GitHub Pages desde un
subdirectorio. Un router de ruta necesitaría un basename distinto por destino,
más una regla de reescritura en el servidor para que /producto/12 —una URL sin
archivo detrás— no diera 404. Un hash nunca llega al servidor, y la ruta,
useParams y Link funcionan exactamente igual.

Si prefiere verlo con BrowserRouter para efectos de la práctica, me dice y hago
el cambio sin problema.


LOS COMMITS

acc3fdb3  el motor de cotización premium era inalcanzable y cobraba de menos
64cf252a  borrar 1103 líneas de código muerto verificado
71a9c21d  ficha de producto con los tres modos de compra y ruta propia
8308e355  la lupa al estilo LV y un solo carrito en las tres páginas
22a4226c  borrar ui/search.js, que peleaba con el panel por el mismo botón
b474f9f9  carrusel de testimonios accesible con componente de tarjeta

https://github.com/pipeTawns-x/Landingpages-Carni.pwa/commits/entrega-react-m29


Quedo atento a sus comentarios y a lo que haya que corregir.

Muchas gracias por la revisión y por la retroalimentación de la anterior.

¡Salu2!
Eduardo Torres Aguilar
