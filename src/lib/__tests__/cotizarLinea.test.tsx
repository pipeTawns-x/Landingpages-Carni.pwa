import { describe, expect, test } from '@jest/globals';
import casosJson from '../../../supabase/tests/cotizacion-casos.json';
import {
  cotizarLinea,
  ErrorCotizacion,
  tasaDeLaCasa,
  type EntradaLinea,
  type ProductoCotizable,
  type Promocion,
  type TasaVigente
} from '../cotizarLinea';

/**
 * The truth about the numbers lives in `supabase/tests/cotizacion-casos.json`.
 * The SQL (`quote_line`), Django and this browser estimator all read the same
 * 18 cases, so the three can never drift apart without a test failing.
 */
interface CasoJson {
  id: string;
  producto: keyof typeof casosJson.productos;
  promo?: Promocion;
  fx?: { dias_de_antiguedad?: number };
  entrada: EntradaLinea;
  cobro_en?: 'MXN' | 'USD';
  esperado?: Record<string, string | number | null>;
  error?: string;
}

const casos = casosJson.casos as unknown as CasoJson[];
const productos = casosJson.productos as unknown as Record<string, ProductoCotizable>;

/** The table stores the age of the rate; the `current_fx` view reports it as a status (stale after 4 days). */
function tasaDe(caso: CasoJson): TasaVigente {
  const dias = caso.fx?.dias_de_antiguedad ?? casosJson.fx.dias_de_antiguedad;
  return { house_rate: casosJson.fx.house_rate, status: dias > 4 ? 'stale' : 'ok' };
}

function cotizar(caso: CasoJson): ReturnType<typeof cotizarLinea> {
  return cotizarLinea(productos[caso.producto], caso.entrada, {
    promo: caso.promo,
    fx: tasaDe(caso),
    cobroEn: caso.cobro_en
  });
}

function capturar(accion: () => unknown): unknown {
  try {
    accion();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('cotizarLinea: los casos compartidos con el servidor', () => {
  test('el archivo trae los 18 casos que prometen las reglas', () => {
    expect(casos).toHaveLength(18);
  });

  test.each(casos.filter((caso) => caso.esperado !== undefined))('$id', (caso) => {
    // `referencia_usd_tasa_pura` is not an output of the line: it is the dollars at the pure rate, a floor.
    const { referencia_usd_tasa_pura: referencia, ...esperado } = caso.esperado ?? {};
    const cotizacion = cotizar(caso);

    expect(cotizacion).toMatchObject(esperado);
    if (referencia !== undefined) {
      // The house rate (rate minus buffer) must never charge less than the pure rate would.
      expect(Number(cotizacion.total_usd)).toBeGreaterThanOrEqual(Number(referencia));
    }
  });

  test.each(casos.filter((caso) => caso.error !== undefined))('$id se rechaza con $error', (caso) => {
    const error = capturar(() => cotizar(caso));

    expect(error).toBeInstanceOf(ErrorCotizacion);
    expect((error as ErrorCotizacion).codigo).toBe(caso.error);
  });
});

describe('cotizarLinea: lo que el navegador promete', () => {
  const BISTEC = productos.bistec;
  const MXN: Pick<EntradaLinea, 'currency'> = { currency: 'MXN' };

  test('toda cifra sale rotulada como estimada: la verdad del dinero la da el servidor', () => {
    const cotizacion = cotizarLinea(BISTEC, { mode: 'money', amount: '100', ...MXN });

    expect(cotizacion.estimado).toBe(true);
  });

  test('el mensaje del error lleva el código al inicio, igual que los del servidor', () => {
    const error = capturar(() => cotizarLinea(BISTEC, { mode: 'weight', amount: '0', unit: 'kg', ...MXN }));

    expect((error as Error).message.split(':')[0]).toBe('invalid_amount');
  });

  test('la aritmética es decimal exacta: 1.005 kg a $1.00 el kilo cobra $1.01, no $1.00 como con flotantes', () => {
    const barato: ProductoCotizable = { price_per_kg: '1.00', price_unit: 'kg', sale_modes: ['money', 'weight'] };

    const cotizacion = cotizarLinea(barato, { mode: 'weight', amount: '1.005', unit: 'kg', ...MXN });

    expect(cotizacion.line_total_mxn).toBe('1.01');
    expect(cotizacion.quantity_kg).toBe('1.005');
  });

  test('sin unidad el peso se entiende en kilos', () => {
    const cotizacion = cotizarLinea(BISTEC, { mode: 'weight', amount: '2', ...MXN });

    expect(cotizacion.quantity_kg).toBe('2.000');
    expect(cotizacion.line_total_mxn).toBe('400.00');
  });

  test('una unidad que no es kg, g ni lb no se interpreta: es una cantidad inválida', () => {
    const error = capturar(() =>
      cotizarLinea(BISTEC, { mode: 'weight', amount: '1', unit: 'oz' as never, ...MXN })
    );

    expect((error as ErrorCotizacion).codigo).toBe('invalid_amount');
  });

  test('el USD sin tasa vigente no se inventa: se rechaza', () => {
    const sinTasa = capturar(() =>
      cotizarLinea(BISTEC, { mode: 'money', amount: '10', currency: 'USD' }, { fx: { house_rate: '0', status: 'missing' } })
    );
    const sinDato = capturar(() => cotizarLinea(BISTEC, { mode: 'money', amount: '10', currency: 'USD' }));

    expect((sinTasa as ErrorCotizacion).codigo).toBe('fx_unavailable');
    expect((sinDato as ErrorCotizacion).codigo).toBe('fx_unavailable');
  });

  test('cobrar en pesos nunca pide tasa de cambio, aunque la tasa esté vencida', () => {
    const cotizacion = cotizarLinea(
      BISTEC,
      { mode: 'money', amount: '100', ...MXN },
      { fx: { house_rate: casosJson.fx.house_rate, status: 'stale' } }
    );

    expect(cotizacion.line_total_mxn).toBe('100.00');
    expect(cotizacion.total_usd).toBeNull();
  });
});

describe('tasaDeLaCasa', () => {
  test('descuenta el colchón de la tasa y redondea a 4 decimales, como el servidor', () => {
    expect(tasaDeLaCasa(casosJson.fx.rate, casosJson.fx.buffer_pct)).toBe(casosJson.fx.house_rate);
  });
});
