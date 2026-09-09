/**
 * El store: un solo contenedor para el estado del carrito.
 *
 * POR QUE ESTE PROYECTO LO NECESITA DE VERDAD
 * -------------------------------------------
 * Carni-mvp no es una SPA. Es un conjunto de paginas HTML con islas de React
 * montadas encima, y esas islas NO COMPARTEN ARBOL: el cajon del pedido, la
 * ficha del producto y el catalogo se montan por separado. Un `useState` en una
 * no existe para las otras.
 *
 * Hasta ahora eso se resolvia con `localStorage` mas un `CustomEvent`
 * ('cart:updated'), y CINCO archivos escribian la misma llave. Eso es un bus de
 * eventos casero. Redux es el bus de verdad, y encima con historial.
 *
 * Se usa `createStore` y no `configureStore` a proposito: este modulo enseña
 * Redux clasico. La migracion a Redux Toolkit es el modulo siguiente, y ahi
 * este archivo se reduce a tres lineas.
 */
import { createStore, type StoreEnhancer } from 'redux';
import { carritoReducer } from './carritoReducer';

export const store = createStore(
  carritoReducer,
  /* Las devtools de Redux, solo si la extension esta instalada. Sirven para ver
     la lista de acciones despachadas: es el argumento mas visible de por que
     una accion es un objeto y no una llamada a funcion. */
  (window as unknown as { __REDUX_DEVTOOLS_EXTENSION__?: () => StoreEnhancer })
    .__REDUX_DEVTOOLS_EXTENSION__?.()
);

export type EstadoRaiz = ReturnType<typeof store.getState>;
export type Despacho = typeof store.dispatch;
