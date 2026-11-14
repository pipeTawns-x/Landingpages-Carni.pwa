/**
 * Browser-side ESTIMATE of one cart line.
 *
 * The browser only estimates so the customer sees a number while they type. The
 * truth about the money is the server's (`quote_cart`, `create_order_v2`), and
 * every figure that comes out of here is labelled `estimado: true` so the UI can
 * never present it as final.
 *
 * Rules and roundings are the ones in `supabase/tests/cotizacion-casos.json`,
 * which the SQL (`quote_line`), Django and this file all read:
 *   - quantity_kg keeps 3 decimals, money keeps 2, rounding half up;
 *   - weight:  total = round(exact kg * unit price, 2). 1 lb is 0.45359237 kg and
 *              is NEVER rounded to 0.454 before multiplying;
 *   - money:   the customer pays what they asked, kg = round(amount / price, 3);
 *   - pieces:  kg = pieces * average piece weight * (thickness / default
 *              thickness); a product priced per piece or package is simply
 *              pieces * price, with 0 kg;
 *   - USD:     house_rate = round(rate * (1 - buffer / 100), 4) and
 *              total_usd = ceil(total_mxn / house_rate, 2). A rate that is not
 *              fresh switches USD off (`fx_unavailable`): a rate is never invented.
 *
 * All arithmetic is exact: decimals are parsed into fractions of BigInts, so
 * 1.005 kg at $1.00 is $1.01 and not the $1.00 that floating point gives.
 */

export type ModoVenta = 'money' | 'weight' | 'pieces';
export type UnidadPeso = 'kg' | 'g' | 'lb';
export type Moneda = 'MXN' | 'USD';
export type CodigoErrorCotizacion = 'sale_mode_not_allowed' | 'invalid_amount' | 'fx_unavailable';

/** What the estimator needs to know about a product: the same columns the server reads. */
export interface ProductoCotizable {
  /** Price in pesos of one `price_unit` (the column keeps the old name). */
  price_per_kg: string;
  price_unit: 'kg' | 'piece' | 'package';
  sale_modes: readonly ModoVenta[];
  avg_piece_weight_kg?: string | null;
  thickness_default_in?: string | null;
}

export interface Promocion {
  kind: 'percent' | 'amount_off' | 'fixed_price';
  value: string;
}

/** A row of the public `current_fx` view, reduced to what the estimate needs. */
export interface TasaVigente {
  house_rate: string;
  status: 'ok' | 'stale' | 'missing';
}

/** The shape of one cart line (contract D7), plus the currency of `amount`. */
export interface EntradaLinea {
  mode: ModoVenta;
  amount: string;
  unit?: UnidadPeso | null;
  thickness_in?: string | null;
  currency: Moneda;
}

export interface OpcionesCotizacion {
  promo?: Promocion;
  fx?: TasaVigente;
  /** Currency the customer will pay in, when it differs from the one `amount` is written in. */
  cobroEn?: Moneda;
}

export interface CotizacionEstimada {
  quantity_kg: string;
  pieces: number | null;
  /** Unit price after the promotion, per kg, piece or package. */
  unit_price: string;
  line_total_mxn: string;
  discount_mxn: string;
  /** Only when the line is charged in dollars. */
  total_usd: string | null;
  estimado: true;
}

/** Same format the server uses: `<code>: <detail>`, so the UI reads the code before the first colon. */
export class ErrorCotizacion extends Error {
  readonly codigo: CodigoErrorCotizacion;

  constructor(codigo: CodigoErrorCotizacion, detalle: string) {
    super(`${codigo}: ${detalle}`);
    this.name = 'ErrorCotizacion';
    this.codigo = codigo;
  }
}

/* ------------------------------------------------------- exact arithmetic */

/** A positive fraction `n / d` of BigInts: every decimal string becomes one, nothing is ever a float. */
interface Fraccion {
  n: bigint;
  d: bigint;
}

const DECIMAL = /^-?\d+(\.\d+)?$/;
const UNO: Fraccion = { n: 1n, d: 1n };
const CIEN: Fraccion = { n: 100n, d: 1n };
const LIBRA_EN_KG: Fraccion = { n: 45359237n, d: 100000000n };
const GRAMO_EN_KG: Fraccion = { n: 1n, d: 1000n };

const potencia = (exponente: number): bigint => 10n ** BigInt(exponente);

/** `null` when the text is not a plain decimal number (no exponent, no commas, no spaces inside). */
function leer(texto: unknown): Fraccion | null {
  if (typeof texto !== 'string' || !DECIMAL.test(texto.trim())) {
    return null;
  }
  const limpio = texto.trim();
  const negativo = limpio.startsWith('-');
  const [entera, decimales = ''] = (negativo ? limpio.slice(1) : limpio).split('.');
  const n = BigInt(`${entera}${decimales}`);
  return { n: negativo ? -n : n, d: potencia(decimales.length) };
}

const por = (a: Fraccion, b: Fraccion): Fraccion => ({ n: a.n * b.n, d: a.d * b.d });
const entre = (a: Fraccion, b: Fraccion): Fraccion => ({ n: a.n * b.d, d: a.d * b.n });
const menos = (a: Fraccion, b: Fraccion): Fraccion => ({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
const esEntero = (a: Fraccion): boolean => a.n % a.d === 0n;

/** Rounds half up to `decimales` places and returns the value scaled by 10^decimales. Only for values >= 0. */
function redondear(a: Fraccion, decimales: number): bigint {
  const escalado = a.n * potencia(decimales);
  return (2n * escalado + a.d) / (2n * a.d);
}

/** Rounds up to `decimales` places and returns the value scaled by 10^decimales. Only for values >= 0. */
function techo(a: Fraccion, decimales: number): bigint {
  const escalado = a.n * potencia(decimales);
  return (escalado + a.d - 1n) / a.d;
}

function texto(escalado: bigint, decimales: number): string {
  const digitos = escalado.toString().padStart(decimales + 1, '0');
  return decimales === 0 ? digitos : `${digitos.slice(0, -decimales)}.${digitos.slice(-decimales)}`;
}

/** An already-rounded amount, scaled by 10^decimales, back as a fraction so it can keep being multiplied. */
const desdeEscalado = (escalado: bigint, decimales: number): Fraccion => ({ n: escalado, d: potencia(decimales) });

/* ------------------------------------------------------------- the rules */

/** House rate: the rate minus the buffer, rounded to 4 decimals (same rule as the server). */
export function tasaDeLaCasa(rate: string, bufferPct: string): string {
  const tasa = leer(rate);
  const colchon = leer(bufferPct);
  if (!tasa || !colchon) {
    throw new ErrorCotizacion('fx_unavailable', 'the exchange rate is not a number');
  }
  const factor = menos(UNO, entre(colchon, CIEN));
  return texto(redondear(por(tasa, factor), 4), 4);
}

function cantidadValida(valor: string): Fraccion {
  const cantidad = leer(valor);
  if (!cantidad || cantidad.n <= 0n) {
    throw new ErrorCotizacion('invalid_amount', 'the amount must be a number greater than zero');
  }
  return cantidad;
}

function precioConPromocion(precio: Fraccion, promo: Promocion | undefined): Fraccion {
  if (!promo) {
    return precio;
  }
  const valor = leer(promo.value);
  if (!valor || valor.n < 0n) {
    return precio;
  }
  let resultado: Fraccion;
  if (promo.kind === 'percent') {
    resultado = por(precio, menos(UNO, entre(valor, CIEN)));
  } else if (promo.kind === 'amount_off') {
    resultado = menos(precio, valor);
  } else {
    resultado = valor;
  }
  // The promotional price is a stored price: two decimals, never below zero.
  return desdeEscalado(resultado.n < 0n ? 0n : redondear(resultado, 2), 2);
}

function tasaParaDolares(fx: TasaVigente | undefined): Fraccion {
  const tasa = fx && fx.status === 'ok' ? leer(fx.house_rate) : null;
  if (!tasa || tasa.n <= 0n) {
    throw new ErrorCotizacion('fx_unavailable', 'there is no fresh exchange rate');
  }
  return tasa;
}

/** Kilos of a weight line, exact. */
function kilosDePeso(cantidad: Fraccion, unidad: UnidadPeso | null | undefined): Fraccion {
  const medida = unidad ?? 'kg';
  if (medida === 'kg') {
    return cantidad;
  }
  if (medida === 'g') {
    return por(cantidad, GRAMO_EN_KG);
  }
  if (medida === 'lb') {
    return por(cantidad, LIBRA_EN_KG);
  }
  throw new ErrorCotizacion('invalid_amount', 'the unit must be kg, g or lb');
}

/** Kilos of a piece line, exact. Only for products priced per kg that have an average piece weight. */
function kilosDePiezas(producto: ProductoCotizable, piezas: Fraccion, grosor: string | null | undefined): Fraccion {
  const promedio = leer(producto.avg_piece_weight_kg);
  if (!promedio || promedio.n <= 0n) {
    throw new ErrorCotizacion('sale_mode_not_allowed', 'this product has no piece weight');
  }
  let factor = UNO;
  if (grosor !== null && grosor !== undefined && grosor !== '') {
    const pedido = leer(grosor);
    if (!pedido || pedido.n <= 0n) {
      throw new ErrorCotizacion('invalid_amount', 'the thickness must be a number greater than zero');
    }
    const base = leer(producto.thickness_default_in);
    // Without a default thickness there is nothing to scale against: the cut has one thickness.
    factor = base && base.n > 0n ? entre(pedido, base) : UNO;
  }
  return por(por(piezas, promedio), factor);
}

/**
 * Estimates one line. Throws `ErrorCotizacion` with the server's codes
 * (`sale_mode_not_allowed`, `invalid_amount`, `fx_unavailable`).
 *
 * Order of checks, as in the server: is the mode allowed, is the amount valid,
 * and only then is the exchange rate looked at.
 */
export function cotizarLinea(
  producto: ProductoCotizable,
  entrada: EntradaLinea,
  opciones: OpcionesCotizacion = {}
): CotizacionEstimada {
  if (!producto.sale_modes.includes(entrada.mode)) {
    throw new ErrorCotizacion('sale_mode_not_allowed', `this product is not sold by ${entrada.mode}`);
  }

  const cantidad = cantidadValida(entrada.amount);
  const precioLista = leer(producto.price_per_kg);
  if (!precioLista || precioLista.n < 0n) {
    throw new ErrorCotizacion('invalid_amount', 'the product has no valid price');
  }
  const precio = precioConPromocion(precioLista, opciones.promo);

  const montoEnDolares = entrada.mode === 'money' && entrada.currency === 'USD';
  const cobraEnDolares = montoEnDolares || (opciones.cobroEn ?? entrada.currency) === 'USD';
  const tasa = cobraEnDolares ? tasaParaDolares(opciones.fx) : null;

  let kilos: Fraccion | null = null;
  let piezas: number | null = null;
  let totalMxn: bigint;
  let totalLista: bigint;
  let totalUsd: string | null = null;

  if (entrada.mode === 'money') {
    if (precio.n === 0n) {
      throw new ErrorCotizacion('invalid_amount', 'a free product cannot be sold by money');
    }
    if (montoEnDolares && tasa) {
      // The customer pays the dollars they typed; the pesos are what the house rate says they are worth.
      const dolares = redondear(cantidad, 2);
      totalUsd = texto(dolares, 2);
      totalMxn = redondear(por(desdeEscalado(dolares, 2), tasa), 2);
    } else {
      totalMxn = redondear(cantidad, 2);
    }
    kilos = entre(desdeEscalado(totalMxn, 2), precio);
    // Paying what they asked means nothing is discounted: a promotion buys more kilos instead.
    totalLista = totalMxn;
  } else if (entrada.mode === 'weight') {
    kilos = kilosDePeso(cantidad, entrada.unit);
    totalMxn = redondear(por(kilos, precio), 2);
    totalLista = redondear(por(kilos, precioLista), 2);
  } else {
    if (!esEntero(cantidad)) {
      throw new ErrorCotizacion('invalid_amount', 'pieces must be a whole number');
    }
    piezas = Number(cantidad.n / cantidad.d);
    if (producto.price_unit === 'kg') {
      kilos = kilosDePiezas(producto, cantidad, entrada.thickness_in);
      totalMxn = redondear(por(kilos, precio), 2);
      totalLista = redondear(por(kilos, precioLista), 2);
    } else {
      totalMxn = redondear(por(cantidad, precio), 2);
      totalLista = redondear(por(cantidad, precioLista), 2);
    }
  }

  if (totalUsd === null && cobraEnDolares && tasa) {
    totalUsd = texto(techo(entre(desdeEscalado(totalMxn, 2), tasa), 2), 2);
  }

  return {
    quantity_kg: kilos ? texto(redondear(kilos, 3), 3) : '0.000',
    pieces: piezas,
    unit_price: texto(redondear(precio, 2), 2),
    line_total_mxn: texto(totalMxn, 2),
    discount_mxn: texto(totalLista > totalMxn ? totalLista - totalMxn : 0n, 2),
    total_usd: totalUsd,
    estimado: true
  };
}
