/**
 * Las acciones del carrito.
 *
 * Una accion es un OBJETO PLANO que describe que paso, nunca como cambiarlo.
 * "El cliente agrego un producto" es una accion; "empujalo al array" no lo es.
 * Esa separacion es la que hace que el estado se pueda auditar: la lista de
 * acciones es la historia de lo que hizo el cliente, y se puede releer.
 */
import type { OrderLine } from '@src/types/database';

export const AGREGAR_PRODUCTO = 'AGREGAR_PRODUCTO' as const;
export const QUITAR_PRODUCTO = 'QUITAR_PRODUCTO' as const;
export const VACIAR_CARRITO = 'VACIAR_CARRITO' as const;
export const HIDRATAR_CARRITO = 'HIDRATAR_CARRITO' as const;

export interface AccionAgregar {
  type: typeof AGREGAR_PRODUCTO;
  payload: OrderLine;
}

export interface AccionQuitar {
  type: typeof QUITAR_PRODUCTO;
  payload: string;
}

export interface AccionVaciar {
  type: typeof VACIAR_CARRITO;
}

/**
 * El carrito no nace vacio: ya vive en `localStorage` y lo escriben tambien el
 * `cart.js` plano y otras pestañas. Esta accion es la puerta por la que ese
 * estado externo entra al store, en vez de que cada componente lo lea por su
 * cuenta.
 */
export interface AccionHidratar {
  type: typeof HIDRATAR_CARRITO;
  payload: OrderLine[];
}

export type AccionCarrito = AccionAgregar | AccionQuitar | AccionVaciar | AccionHidratar;

export function agregarProducto(linea: OrderLine): AccionAgregar {
  return { type: AGREGAR_PRODUCTO, payload: linea };
}

export function quitarProducto(lineId: string): AccionQuitar {
  return { type: QUITAR_PRODUCTO, payload: lineId };
}

export function vaciarCarrito(): AccionVaciar {
  return { type: VACIAR_CARRITO };
}

export function hidratarCarrito(lineas: OrderLine[]): AccionHidratar {
  return { type: HIDRATAR_CARRITO, payload: lineas };
}
