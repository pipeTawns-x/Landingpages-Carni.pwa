/**
 * El store, ahora con Redux Toolkit.
 *
 * Compara con lo que habia en el modulo anterior: `createStore`, un enhancer
 * escrito a mano para las devtools y un cast para tiparlo. `configureStore`
 * trae las devtools ya conectadas y el middleware de thunk incluido, que es lo
 * que permite despachar `buscarProductos` — una funcion asincrona — como si
 * fuera una accion cualquiera.
 *
 * POR QUE ESTE PROYECTO LO NECESITA
 * ---------------------------------
 * Carni-mvp no es una SPA: son islas de React sobre paginas HTML que NO
 * comparten arbol. El cajon del pedido, la ficha y el catalogo se montan por
 * separado, asi que un `useState` en una no existe para las otras.
 */
import { configureStore } from '@reduxjs/toolkit';
import carritoReducer from './slices/carritoSlice';
import busquedaReducer from './slices/busquedaSlice';
import { LLAVE_PEDIDO } from '@src/lib/pedidoStorage';
import type { CartLegacyItem, OrderLine } from '@src/types/database';

export const store = configureStore({
  reducer: {
    carrito: carritoReducer,
    busqueda: busquedaReducer
  }
});

export type EstadoRaiz = ReturnType<typeof store.getState>;
export type Despacho = typeof store.dispatch;

/**
 * Convierte una linea del pedido al item que espera el disco.
 *
 * El store guarda `OrderLine` y el disco guarda el formato viejo que lee
 * `js/modules/core/cart.js`, que es JavaScript plano: son dos formas distintas
 * de la misma cosa y alguien tiene que traducir.
 *
 * SE MEZCLA SOBRE EL ORIGINAL, NO SE RECONSTRUYE. `CartLegacyItem` trae nueve
 * campos que React nunca modela —grosor, basePeso, orderMode y los datos de la
 * cotizacion— y todos son necesarios en `cart.js`. Por eso `leerPedidoGuardado`
 * conserva el item original en `linea.legacy`: armar el objeto desde cero
 * borraba esos campos y un corte premium ya configurado volvia como una linea
 * por kilo cualquiera.
 */
function aItemLegacy(linea: OrderLine): CartLegacyItem {
  const original: Partial<CartLegacyItem> = linea.legacy ?? {};

  return {
    ...original,
    id: linea.productId,
    name: linea.name,
    price: linea.pricePerKg,
    img: linea.image,
    // 'corte' no existe en `OrderLine.unit`, pero `isPremiumCutItem()` de
    // cart.js lo necesita para mostrar el control de grosor. Si la linea vino
    // de un corte, conserva su tipo.
    tipo: original.tipo === 'corte' ? 'corte' : linea.unit,
    // El disco separa peso y piezas en dos campos; el store tiene uno solo y
    // una unidad. El campo que no aplica va en 0, nunca ausente.
    peso: linea.unit === 'kg' ? linea.quantity : 0,
    piezas: linea.unit === 'kg' ? 0 : linea.quantity,
    categoria: linea.categorySlug
  };
}

/**
 * EL DISCO ES UN EFECTO DEL STORE, NO UNA ESCRITURA A MANO.
 *
 * QUE ESTABA ROTO
 * ---------------
 * El pedido vivia en dos sitios: el store (memoria) y `localStorage` (disco).
 * Al agregar se escribian los dos, pero al quitar solo se tocaba el store: la
 * linea desaparecia de la pantalla y seguia en el disco, asi que al recargar
 * `usePedido` la hidrataba de vuelta y el producto REAPARECIA.
 *
 * La causa de fondo no era esa accion en particular: era que la sincronizacion
 * estaba escrita accion por accion, a mano. Eso siempre termina fallando,
 * porque cada accion nueva es otra oportunidad de olvidarse de una.
 *
 * Una sola suscripcion cubre TODAS las acciones —las de hoy y las que se
 * escriban dentro de un año— porque no mira que accion paso, mira el resultado.
 *
 * POR QUE COMPARA LA REFERENCIA ANTES DE ESCRIBIR
 * ----------------------------------------------
 * Eso no es una optimizacion, es lo que evita un borrado. `subscribe` se
 * dispara con CUALQUIER accion, incluidas las tres de la busqueda. En una
 * pagina donde el carrito todavia no se hidrato el store lo tiene vacio, asi
 * que la primera busqueda habria escrito `[]` encima del pedido guardado. Con
 * la comparacion, una accion que no toca el carrito no escribe nada: Immer
 * devuelve la MISMA referencia cuando el reducer no lo modifico.
 *
 * POR QUE NO SE DISPARA 'cart:updated'
 * ------------------------------------
 * `usePedido` escucha ese evento y rehidrata el store desde el disco. Si esta
 * escritura lo emitiera, la rehidratacion volveria a cambiar el store, la
 * suscripcion volveria a escribir y el evento se realimentaria solo. En
 * `products.tsx` hay una bandera que corta ese lazo, pero la landing y el
 * acceso montan el cajon SIN esa bandera, asi que ahi el lazo no tendria freno.
 *
 * Lo que se paga por no emitirlo: el contador del encabezado, que lo pinta
 * `cart.js` al oir el evento, se queda con el numero viejo hasta la siguiente
 * recarga. Es un numero desactualizado, no un pedido perdido. Queda anotado.
 *
 * ENTRE PESTAÑAS NO SE CICLA, Y CONVIENE SABER POR QUE: otra pestaña oye
 * `storage`, rehidrata y reescribe lo mismo que acaba de leer. La ida y vuelta
 * es idempotente —salvo la primera pasada, que normaliza ids viejos guardados
 * como texto— asi que el contenido deja de cambiar y el rebote se apaga solo.
 */
if (typeof window !== 'undefined') {
  let carritoAnterior: OrderLine[] = store.getState().carrito;

  store.subscribe(() => {
    const carritoActual = store.getState().carrito;
    if (carritoActual === carritoAnterior) {
      return;
    }
    carritoAnterior = carritoActual;

    try {
      window.localStorage.setItem(LLAVE_PEDIDO, JSON.stringify(carritoActual.map(aItemLegacy)));
    } catch {
      /* En navegacion privada `localStorage` lanza al escribir. El pedido sigue
         funcionando en memoria durante la visita; lo unico que se pierde es que
         sobreviva a la recarga, y eso ya era asi antes de este cambio. */
    }
  });
}
