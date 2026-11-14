/**
 * Bridges a cart line (`OrderLine`) and the estimator (`cotizarLinea`).
 *
 * The catalogue does not carry `sale_modes`, `price_unit` or the piece weight
 * yet (they arrive with the datos migration), so the modes a line can be sold by
 * are derived from what the line already knows: its unit, and the average piece
 * weight the old cart stored for premium cuts. When the catalogue grows those
 * columns, only `productoCotizable` changes.
 */
import type { OrderLine, SolicitudLinea } from '@src/types/database';
import { cotizarLinea, type ProductoCotizable, type CotizacionEstimada } from './cotizarLinea';

/** The columns the estimator reads, derived from the line. A cap or a package is only ever sold by piece. */
export function productoCotizable(linea: OrderLine): ProductoCotizable {
  const porPieza = linea.unit !== 'kg';
  const promedio = linea.legacy?.avgPieceWeightKg;
  const tienePesoPorPieza = typeof promedio === 'number' && promedio > 0;

  return {
    price_per_kg: linea.pricePerKg.toFixed(2),
    price_unit: linea.unit === 'kg' ? 'kg' : linea.unit === 'paquete' ? 'package' : 'piece',
    sale_modes: porPieza ? ['pieces'] : tienePesoPorPieza ? ['money', 'weight', 'pieces'] : ['money', 'weight'],
    avg_piece_weight_kg: tienePesoPorPieza ? String(promedio) : null,
    thickness_default_in: null
  };
}

/** What a line asked for before the editor ever touched it: its own quantity, by weight or by piece. */
export function solicitudInicial(linea: OrderLine): SolicitudLinea {
  return (
    linea.solicitud ?? {
      product_id: linea.productId,
      mode: linea.unit === 'kg' ? 'weight' : 'pieces',
      amount: String(linea.quantity),
      unit: linea.unit === 'kg' ? 'kg' : null,
      thickness_in: null,
      note: null
    }
  );
}

/**
 * Text typed by a person, ready for the estimator: a decimal comma becomes a
 * point, and a trailing separator ("1.") is dropped so half-typed numbers do not
 * flash an error. Empty stays empty.
 */
export function normalizarCantidad(escrito: string): string {
  return escrito.trim().replace(',', '.').replace(/\.$/, '');
}

/**
 * The number `OrderLine.quantity` must hold for a given estimate: kilos for a
 * kg-priced product (that is what price x quantity multiplies), pieces or
 * packages for the rest.
 */
export function cantidadDeLinea(linea: OrderLine, cotizacion: CotizacionEstimada): number {
  return linea.unit === 'kg' ? Number(cotizacion.quantity_kg) : (cotizacion.pieces ?? 0);
}

/** "pieza", "paquete" or "kg": a cap is not "1 kg x $250". */
export function etiquetaUnidad(unidad: OrderLine['unit'], cantidad: number): string {
  if (unidad === 'unidad') {
    return cantidad === 1 ? 'pieza' : 'piezas';
  }
  if (unidad === 'paquete') {
    return cantidad === 1 ? 'paquete' : 'paquetes';
  }
  return 'kg';
}

/**
 * What one line costs. A line that went through the editor is priced by its
 * request, exactly as the server will (1 lb of a $200 kilo is $90.72, not
 * 0.454 kg x $200 = $90.80); any other line is quantity x price, as it always was.
 */
export function totalDeLinea(linea: OrderLine): number {
  if (linea.solicitud) {
    try {
      return Number(estimarSolicitud(linea, linea.solicitud).line_total_mxn);
    } catch {
      /* A request the estimator rejects (corrupted storage) falls back to the plain product. */
    }
  }
  return linea.pricePerKg * linea.quantity;
}

/** Estimates a request against the line's own product. Throws `ErrorCotizacion` like `cotizarLinea`. */
export function estimarSolicitud(linea: OrderLine, solicitud: SolicitudLinea): CotizacionEstimada {
  return cotizarLinea(productoCotizable(linea), {
    mode: solicitud.mode,
    amount: solicitud.amount,
    unit: solicitud.unit,
    thickness_in: solicitud.thickness_in,
    currency: 'MXN'
  });
}
