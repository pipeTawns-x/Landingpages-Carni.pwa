/**
 * El motor de cotización — los tres modos de compra, en un solo lugar.
 *
 * Vivía dentro del IIFE de `cart.js`, así que solo lo veía el JavaScript plano.
 * El panel de React tenía su propia aritmética —`cantidad × precio`— y no sabía
 * nada de modos ni de grosor, de modo que en `products.html`, que es donde manda
 * React, los tres modos no existían.
 *
 * Aquí lo importan los dos lados. Una sola aritmética, un solo resultado.
 *
 * Los tres modos, como los pidió Eduardo:
 *
 *   weight  "un kilo y medio de bistec"      → requestedWeightKg
 *   price   "deme $200 de New York"          → requestedBudget
 *   pieces  "3 rib eye de 1 pulgada"         → requestedPieces (+ grosor)
 *
 * El grosor NO es un cuarto modo: es una entrada que escala el peso unitario,
 * y solo aplica a los cortes premium.
 */

import { GROSOR_REFERENCIA_IN } from './premium-cuts.js';

/** Factor exacto de libra a kilogramo. No se redondea. */
export const LIBRAS_POR_KG = 2.20462;

/** @typedef {'weight'|'pieces'|'price'} ModoDeCompra */

/**
 * Convierte a kilogramos desde la unidad que eligió el cliente.
 * @param {number} valor
 * @param {'kg'|'g'|'lb'} unidad
 * @returns {number}
 */
export function aKilogramos(valor, unidad) {
  const n = Number(valor) || 0;
  if (unidad === 'g') return n / 1000;
  if (unidad === 'lb') return n / LIBRAS_POR_KG;
  return n;
}

/** Redondea sin arrastrar el error binario de los flotantes. */
export function redondear(valor, decimales = 3) {
  const factor = 10 ** decimales;
  return Math.round((Number(valor) || 0) * factor) / factor;
}

/**
 * Peso de una pieza, escalado por el grosor pedido.
 *
 * `basePeso` es el peso de esa pieza al grosor de referencia. Pedirla más
 * gruesa la hace pesar proporcionalmente más, que es exactamente lo que pasa
 * cuando el carnicero corta.
 *
 * Los mínimos evitan que un dato corrupto del `localStorage` —que el cliente
 * puede editar a mano— produzca un peso de cero y un pedido gratis.
 *
 * @param {number} basePeso kg por pieza al grosor de referencia
 * @param {number} grosor en pulgadas
 */
export function pesoUnitario(basePeso, grosor) {
  const base = Math.max(Number(basePeso) || 0.3, 0.1);
  const gr = Math.max(Number(grosor) || GROSOR_REFERENCIA_IN, 0.5);
  return base * (gr / GROSOR_REFERENCIA_IN);
}

/**
 * Cotiza una línea en cualquiera de los tres modos.
 *
 * Devuelve siempre los mismos campos, sea cual sea el modo, para que la interfaz
 * no tenga que ramificar al pintar: siempre hay un peso total, un número de
 * piezas estimado y un precio.
 *
 * @param {{modo?: ModoDeCompra, precioPorKg: number, basePeso?: number, grosor?: number,
 *          pesoKg?: number, piezas?: number, presupuesto?: number, minimoKg?: number}} cfg
 */
export function cotizar(cfg) {
  const modo = ['weight', 'pieces', 'price'].includes(cfg.modo) ? cfg.modo : 'weight';
  const precioPorKg = Math.max(Number(cfg.precioPorKg) || 0, 0);
  const unitario = pesoUnitario(cfg.basePeso, cfg.grosor);
  const minimoKg = Math.max(Number(cfg.minimoKg) || 0, 0);

  let pesoTotalKg;
  let piezas;

  if (modo === 'pieces') {
    piezas = Math.max(1, Math.round(Number(cfg.piezas) || 1));
    pesoTotalKg = unitario * piezas;
  } else if (modo === 'price') {
    // "Deme $200 de esto." El presupuesto manda y el peso sale de dividir.
    const presupuesto = Math.max(Number(cfg.presupuesto) || 0, 0);
    pesoTotalKg = precioPorKg > 0 ? presupuesto / precioPorKg : 0;
    piezas = unitario > 0 ? Math.max(1, Math.round(pesoTotalKg / unitario)) : 1;
  } else {
    pesoTotalKg = Math.max(Number(cfg.pesoKg) || unitario, 0);
    piezas = unitario > 0 ? Math.max(1, Math.ceil(pesoTotalKg / unitario)) : 1;
  }

  // El mínimo de venta lo valida también el servidor
  // (202608210001_precio_server_side.sql:192). Aplicarlo aquí es cortesía: sirve
  // para que el cliente vea el total correcto antes de confirmar, no para
  // proteger nada.
  const bajoMinimo = minimoKg > 0 && pesoTotalKg < minimoKg;
  if (bajoMinimo) {
    pesoTotalKg = minimoKg;
  }

  return {
    modo,
    pesoUnitarioKg: redondear(unitario),
    pesoTotalKg: redondear(pesoTotalKg),
    piezasEstimadas: piezas,
    // El precio que se PINTA. El que se cobra lo recalcula la base contra
    // products.price_per_kg: localStorage es del cliente y se puede editar.
    total: redondear(pesoTotalKg * precioPorKg, 2),
    bajoMinimo
  };
}
