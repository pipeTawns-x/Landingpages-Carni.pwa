/**
 * El reducer del carrito.
 *
 * Funcion PURA: mismas entradas, misma salida, y no toca nada de fuera. No lee
 * `localStorage`, no llama a Supabase, no dispara eventos. Solo recibe el
 * estado anterior y una accion, y devuelve el estado siguiente.
 *
 * Y devuelve uno NUEVO, nunca el mismo mutado. React-Redux decide si hay que
 * volver a pintar comparando referencias: si se hiciera `estado.push(...)`, la
 * referencia seria la misma, la comparacion daria "no cambio nada" y la
 * pantalla se quedaria quieta con los datos viejos. Ese es el bug clasico de
 * Redux y por eso `push`, `splice` y `sort` no aparecen aqui.
 */
import type { OrderLine } from '@src/types/database';
import {
  AGREGAR_PRODUCTO,
  HIDRATAR_CARRITO,
  QUITAR_PRODUCTO,
  VACIAR_CARRITO,
  type AccionCarrito
} from './carritoActions';

const estadoInicial: OrderLine[] = [];

export function carritoReducer(
  estado: OrderLine[] = estadoInicial,
  accion: AccionCarrito
): OrderLine[] {
  switch (accion.type) {
    case AGREGAR_PRODUCTO:
      return [...estado, accion.payload];

    case QUITAR_PRODUCTO:
      return estado.filter((linea) => linea.lineId !== accion.payload);

    case VACIAR_CARRITO:
      return [];

    case HIDRATAR_CARRITO:
      return accion.payload;

    default:
      return estado;
  }
}
