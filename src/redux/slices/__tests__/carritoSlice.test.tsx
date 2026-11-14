import { describe, expect, test } from '@jest/globals';
import type { OrderLine, SolicitudLinea } from '@src/types/database';
import carritoReducer, { agregarProducto, editarLinea, quitarProducto } from '../carritoSlice';

const BISTEC: OrderLine = {
  lineId: 'bistec-1',
  productId: 1,
  name: 'Bistec de Res',
  pricePerKg: 200,
  quantity: 1,
  image: '/img/products/res.webp',
  categorySlug: 'carnes-rojas',
  unit: 'kg'
};

const MOLIDA: OrderLine = { ...BISTEC, lineId: 'molida-2', productId: 2, name: 'Molida', pricePerKg: 140 };

const MEDIO_KILO_POR_DINERO: SolicitudLinea = {
  product_id: 1,
  mode: 'money',
  amount: '100',
  unit: null,
  thickness_in: null,
  note: 'sin grasa'
};

describe('carritoSlice: editarLinea', () => {
  test('stores the request and the estimated quantity on that line, and touches no other', () => {
    const antes = [BISTEC, MOLIDA];

    const despues = carritoReducer(antes, editarLinea({ lineId: 'bistec-1', solicitud: MEDIO_KILO_POR_DINERO, cantidad: 0.5 }));

    expect(despues[0]).toEqual({ ...BISTEC, quantity: 0.5, solicitud: MEDIO_KILO_POR_DINERO });
    expect(despues[1]).toBe(antes[1]);
    expect(despues).toHaveLength(2);
  });

  test('an unknown line is a no-op: the same state comes back', () => {
    const antes = [BISTEC];

    const despues = carritoReducer(antes, editarLinea({ lineId: 'no-existe', solicitud: MEDIO_KILO_POR_DINERO, cantidad: 0.5 }));

    expect(despues).toBe(antes);
  });

  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'a quantity of %s never reaches the cart: the line stays as it was',
    (cantidad) => {
      const antes = [BISTEC];

      const despues = carritoReducer(antes, editarLinea({ lineId: 'bistec-1', solicitud: MEDIO_KILO_POR_DINERO, cantidad }));

      expect(despues).toBe(antes);
    }
  );
});

describe('carritoSlice: lo que ya hacía sigue igual', () => {
  test('adding the same line twice keeps one, and removing it empties the cart', () => {
    let estado = carritoReducer([], agregarProducto(BISTEC));
    estado = carritoReducer(estado, agregarProducto(BISTEC));
    expect(estado).toHaveLength(1);

    estado = carritoReducer(estado, quitarProducto('bistec-1'));
    expect(estado).toEqual([]);
  });
});
