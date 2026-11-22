import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { LLAVE_PEDIDO, leerPedidoGuardado } from '@src/lib/pedidoStorage';
import { agregarProducto, editarLinea, vaciarCarrito } from '@src/redux/slices/carritoSlice';
import { store } from '@src/redux/store';
import type { OrderLine, SolicitudLinea } from '@src/types/database';

/**
 * The real search slice pulls in the Supabase client, which reads `import.meta.env`
 * (it does not exist under Babel's CommonJS). The cart does not need it.
 */
jest.mock('@src/redux/slices/busquedaSlice', () => ({ __esModule: true, default: (estado = {}) => estado }));

const SOLICITUD: SolicitudLinea = {
  product_id: 1,
  mode: 'money',
  amount: '100',
  unit: null,
  thickness_in: null,
  note: null
};

/** A premium cut as `cart.js` wrote it: it carries fields React never models. */
const CORTE: OrderLine = {
  lineId: 'rib-1',
  productId: 1,
  name: 'Rib Eye',
  pricePerKg: 200,
  quantity: 1,
  image: '/img/products/ribeye.webp',
  categorySlug: 'cortes-especiales',
  unit: 'kg',
  legacy: { id: 1, name: 'Rib Eye', price: 200, tipo: 'corte', grosor: 1.5, avgPieceWeightKg: 0.3 }
};

function leerDisco(): Array<Record<string, unknown>> {
  return JSON.parse(window.localStorage.getItem(LLAVE_PEDIDO) ?? '[]') as Array<Record<string, unknown>>;
}

describe('el pedido en disco', () => {
  beforeEach(() => {
    store.dispatch(vaciarCarrito());
    window.localStorage.clear();
  });

  test('a request edited in the editor survives a reload, next to the fields only cart.js reads', () => {
    store.dispatch(agregarProducto(CORTE));
    store.dispatch(editarLinea({ lineId: 'rib-1', solicitud: SOLICITUD, cantidad: 0.5 }));

    const [item] = leerDisco();
    expect(item).toMatchObject({ solicitud: SOLICITUD, peso: 0.5, piezas: 0, tipo: 'corte', grosor: 1.5 });

    const [restaurada] = leerPedidoGuardado();
    expect(restaurada.solicitud).toEqual(SOLICITUD);
    expect(restaurada.quantity).toBe(0.5);
  });

  test('a line that never went through the editor writes no `solicitud` key (the old shape is untouched)', () => {
    store.dispatch(agregarProducto(CORTE));

    const [item] = leerDisco();
    expect(item).not.toHaveProperty('solicitud');
    expect(item).toMatchObject({ peso: 1, piezas: 0, grosor: 1.5 });
    expect(leerPedidoGuardado()[0].solicitud).toBeUndefined();
  });

  test.each([
    ['an unknown mode', { ...SOLICITUD, mode: 'barter' }],
    ['an amount that is not text', { ...SOLICITUD, amount: 100 }],
    ['an unknown unit', { ...SOLICITUD, unit: 'oz' }],
    ['an endless note', { ...SOLICITUD, note: 'x'.repeat(501) }],
    ['something that is not an object', 'hola']
  ])('a corrupted `solicitud` (%s) is ignored: the line still reads by its quantity', (_nombre, corrupta) => {
    window.localStorage.setItem(
      LLAVE_PEDIDO,
      JSON.stringify([{ id: 1, name: 'Rib Eye', price: 200, tipo: 'kg', peso: 2, piezas: 0, solicitud: corrupta }])
    );

    const [linea] = leerPedidoGuardado();

    expect(linea.solicitud).toBeUndefined();
    expect(linea.quantity).toBe(2);
  });
});
