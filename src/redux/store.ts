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

export const store = configureStore({
  reducer: {
    carrito: carritoReducer,
    busqueda: busquedaReducer
  }
});

export type EstadoRaiz = ReturnType<typeof store.getState>;
export type Despacho = typeof store.dispatch;
