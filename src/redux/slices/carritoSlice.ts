/**
 * El pedido, ahora como slice.
 *
 * Es el mismo reducer del modulo anterior, escrito con `createSlice`. Lo que
 * antes eran TRES archivos —acciones, constantes de tipo y un `switch`— es
 * ahora uno solo, y las acciones ya no se escriben: RTK las genera a partir de
 * los nombres de los reducers.
 *
 * OJO CON LO QUE PARECE UN ERROR Y NO LO ES: aqui abajo hay `push` y `splice`,
 * que en el modulo anterior estaban PROHIBIDOS porque mutar el estado deja la
 * misma referencia y React no repinta. Aqui se puede, y no es que la regla haya
 * cambiado: RTK envuelve cada reducer con Immer, que intercepta esas mutaciones
 * sobre un borrador y devuelve un objeto nuevo. Se escribe mutando; por dentro
 * sigue siendo inmutable.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrderLine, SolicitudLinea } from '@src/types/database';

const estadoInicial: OrderLine[] = [];

const carritoSlice = createSlice({
  name: 'carrito',
  initialState: estadoInicial,
  reducers: {
    /**
     * El enunciado pide comprobar que la linea no exista ya. En una carniceria
     * "existir ya" no es tener el mismo producto: el mismo Rib Eye pedido a una
     * pulgada y a pulgada y media son DOS lineas distintas del ticket, porque
     * son dos cortes distintos. Por eso la comparacion es por `lineId`, que ya
     * incluye el modo y el grosor, y no por `productId`.
     */
    agregarProducto(estado, accion: PayloadAction<OrderLine>) {
      const yaEsta = estado.some((linea) => linea.lineId === accion.payload.lineId);
      if (!yaEsta) {
        estado.push(accion.payload);
      }
    },

    quitarProducto(estado, accion: PayloadAction<string>) {
      const i = estado.findIndex((linea) => linea.lineId === accion.payload);
      if (i !== -1) {
        estado.splice(i, 1);
      }
    },

    vaciarCarrito() {
      return [];
    },

    /**
     * El editor de la línea: guarda lo que el cliente pidió (`solicitud`, la
     * forma D7 que el servidor lee) y la cantidad ESTIMADA que sale de ahí, que
     * es lo que multiplican los totales. Una cantidad que no es positiva y finita
     * no entra al pedido, y una línea que no existe no se inventa: en los dos casos
     * devolver `undefined` deja el estado como estaba, con la misma referencia.
     */
    editarLinea(
      estado,
      accion: PayloadAction<{ lineId: string; solicitud: SolicitudLinea; cantidad: number }>
    ) {
      const { lineId, solicitud, cantidad } = accion.payload;
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return;
      }
      const linea = estado.find((l) => l.lineId === lineId);
      if (!linea) {
        return;
      }
      linea.solicitud = solicitud;
      linea.quantity = cantidad;
    },

    /**
     * La puerta por la que entra el pedido que ya vivia en `localStorage`,
     * escrito por otra pestaña o por el `cart.js` plano.
     */
    hidratarCarrito(_estado, accion: PayloadAction<OrderLine[]>) {
      return accion.payload;
    }
  }
});

export const { agregarProducto, quitarProducto, vaciarCarrito, hidratarCarrito, editarLinea } =
  carritoSlice.actions;

export default carritoSlice.reducer;
