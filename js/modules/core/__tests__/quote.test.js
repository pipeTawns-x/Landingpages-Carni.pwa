/**
 * Pruebas del motor de cotizacion.
 *
 * POR QUE ESTE ARCHIVO Y NO OTRO
 * ------------------------------
 * Aqui vivio el cobro de menos de 520.80 pesos. Tres Rib Eye de pulgada y
 * media se cobraban 372.00 en vez de 892.80, y no habia UN SOLO error en
 * consola: la funcion devolvia un numero, solo que el numero estaba mal.
 *
 * Ese es exactamente el bug que una prueba unitaria existe para atrapar.
 * Funcion pura, entrada conocida, salida verificable. Un test de estos lo
 * cazaba el primer dia.
 *
 * A diferencia de functions.js —que es del curso y se queda en
 * practicas-ebac— esto protege dinero real de la carniceria.
 */
import {
  LIBRAS_POR_KG,
  aKilogramos,
  redondear,
  pesoUnitario,
  cotizar
} from '../quote.js';

describe('aKilogramos — la unidad que teclea el cliente', () => {
  test('los kilos se quedan como estan', () => {
    expect(aKilogramos(2, 'kg')).toBe(2);
  });

  test('500 gramos son medio kilo', () => {
    expect(aKilogramos(500, 'g')).toBe(0.5);
  });

  test('una libra son 0.4536 kilos', () => {
    expect(aKilogramos(1, 'lb')).toBeCloseTo(1 / LIBRAS_POR_KG, 5);
  });

  /* El borde de verdad: el campo vacio. Si esto devolviera NaN, el total del
     ticket saldria NaN y el cliente veria "$NaN" en pantalla. */
  test('un valor vacio o basura da 0, nunca NaN', () => {
    expect(aKilogramos('', 'kg')).toBe(0);
    expect(aKilogramos('abc', 'kg')).toBe(0);
    expect(aKilogramos(undefined, 'kg')).toBe(0);
  });
});

describe('pesoUnitario — cuanto pesa una pieza segun su grosor', () => {
  test('al grosor de referencia la pieza pesa su base', () => {
    expect(pesoUnitario(0.35, 1.25)).toBeCloseTo(0.35, 3);
  });

  test('mas grueso pesa mas: 1.5 pulgadas sobre 1.25 de referencia', () => {
    expect(pesoUnitario(0.4, 1.5)).toBeCloseTo(0.48, 3);
  });

  /* Suelos duros. Sin ellos, un grosor de 0 daria un peso de 0 y el corte
     saldria gratis. */
  test('un grosor de 0 cae al minimo, no a cero', () => {
    expect(pesoUnitario(0.4, 0)).toBeGreaterThan(0);
  });

  test('sin peso base usa el de por defecto en vez de dar 0', () => {
    expect(pesoUnitario(null, 1.25)).toBeGreaterThan(0);
  });
});

describe('cotizar — los tres modos de pedir carne', () => {
  test('por peso: dos kilos a 289 el kilo son 578', () => {
    const c = cotizar({ modo: 'weight', precioPorKg: 289, pesoKg: 2 });
    expect(c.pesoTotalKg).toBe(2);
    expect(c.total).toBeCloseTo(578, 2);
  });

  /**
   * EL CASO QUE COSTO 520.80 PESOS.
   *
   * Tres Rib Eye de pulgada y media. Con la base de 0.4 kg por pieza al grosor
   * de referencia de 1.25", cada pieza a 1.5" pesa 0.48 kg. Tres son 1.44 kg,
   * y a 620 el kilo dan 892.80.
   *
   * El bug cobraba 372.00 porque no aplicaba el grosor: usaba 0.2 kg por pieza.
   */
  test('por pieza: tres Rib Eye de 1.5 pulgadas dan 892.80 y no 372', () => {
    const c = cotizar({
      modo: 'pieces',
      precioPorKg: 620,
      basePeso: 0.4,
      grosor: 1.5,
      piezas: 3
    });
    expect(c.pesoTotalKg).toBeCloseTo(1.44, 2);
    expect(c.total).toBeCloseTo(892.8, 1);
    expect(c.total).not.toBeCloseTo(372, 1);
  });

  test('por precio: "deme 200 pesos" a 400 el kilo son medio kilo', () => {
    const c = cotizar({ modo: 'price', precioPorKg: 400, presupuesto: 200 });
    expect(c.pesoTotalKg).toBeCloseTo(0.5, 3);
  });

  /* Division por cero disfrazada: un producto sin precio cargado. Sin la
     guarda, presupuesto/0 daria Infinity y el ticket mostraria "Infinity kg". */
  test('un precio de 0 no revienta ni devuelve Infinity', () => {
    const c = cotizar({ modo: 'price', precioPorKg: 0, presupuesto: 200 });
    expect(c.pesoTotalKg).toBe(0);
    expect(Number.isFinite(c.pesoTotalKg)).toBe(true);
  });

  test('el minimo de venta sube el peso cuando el pedido queda por debajo', () => {
    const c = cotizar({ modo: 'weight', precioPorKg: 289, pesoKg: 0.1, minimoKg: 0.5 });
    expect(c.pesoTotalKg).toBe(0.5);
  });

  test('un modo desconocido cae en peso en vez de romper', () => {
    const c = cotizar({ modo: 'inventado', precioPorKg: 100, pesoKg: 1 });
    expect(c.modo).toBe('weight');
  });
});

describe('redondear', () => {
  test('corta a tres decimales por defecto', () => {
    expect(redondear(1.23456)).toBe(1.235);
  });

  test('un valor invalido da 0, no NaN', () => {
    expect(redondear('abc')).toBe(0);
  });
});
