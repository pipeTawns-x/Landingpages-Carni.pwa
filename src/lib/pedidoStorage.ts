import type { CartLegacyItem, OrderLine, SolicitudLinea } from '@src/types/database';

export const LLAVE_PEDIDO = 'carni_cart_v1';

const MODOS: ReadonlySet<unknown> = new Set(['money', 'weight', 'pieces']);
const UNIDADES: ReadonlySet<unknown> = new Set(['kg', 'g', 'lb']);

/**
 * `solicitud` viene del almacenamiento, que otra pestaña o un script pudo escribir:
 * solo se acepta si tiene la forma exacta de D7 y topes de largo. Cualquier otra
 * cosa se ignora y la línea se lee como siempre, por su cantidad y su unidad.
 */
function leerSolicitud(valor: unknown): SolicitudLinea | undefined {
  if (typeof valor !== 'object' || valor === null) {
    return undefined;
  }
  const s = valor as Record<string, unknown>;
  const unit = s.unit ?? null;
  const grosor = s.thickness_in ?? null;
  const nota = s.note ?? null;
  const textoONulo = (v: unknown, maximo: number): v is string | null =>
    v === null || (typeof v === 'string' && v.length <= maximo);

  if (
    (typeof s.product_id !== 'number' && typeof s.product_id !== 'string') ||
    !MODOS.has(s.mode) ||
    typeof s.amount !== 'string' ||
    s.amount.length > 32 ||
    !(unit === null || UNIDADES.has(unit)) ||
    !textoONulo(grosor, 16) ||
    !textoONulo(nota, 500)
  ) {
    return undefined;
  }

  return {
    product_id: s.product_id,
    mode: s.mode as SolicitudLinea['mode'],
    amount: s.amount,
    unit: unit as SolicitudLinea['unit'],
    thickness_in: grosor,
    note: nota
  };
}

/**
 * Reads whatever is already in the shared cart key and turns it into order
 * lines.
 *
 * Two writers share `carni_cart_v1`: this file and the vanilla
 * js/modules/core/cart.js. (A third, src/hooks/useCart.ts, was deleted on
 * 2026-09-02 — it had zero importers.) The order used to mount empty and immediately
 * overwrite the key, so a cart filled on index.html was destroyed the moment the
 * customer opened the catalogue — and a plain refresh lost it too.
 *
 * Hydrating here makes the write below non-empty. It does not by itself make it
 * non-destructive: the legacy item carries fields this model has no place for,
 * so each one is kept on `OrderLine.legacy` and merged back in syncLegacyCart.
 */
export function leerPedidoGuardado(): OrderLine[] {
  try {
    const raw = window.localStorage.getItem(LLAVE_PEDIDO);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartLegacyItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item, index) => {
      const unit: OrderLine['unit'] =
        item.tipo === 'unidad' || item.tipo === 'paquete' ? item.tipo : 'kg';

      // Read the field that matches the unit. A piece-priced line stores
      // `peso: 0`, and `??` only falls through on null/undefined — never on 0 —
      // so reading `peso ?? piezas` gave a quantity of 0 and billed the whole
      // line at $0.00 after a refresh.
      const stored = unit === 'kg' ? item.peso : item.piezas;

      // The vanilla catalogue stores string slugs ('bisteck_res'), so Number()
      // yielded NaN — and JSON.stringify writes NaN as null, wiping the id of
      // every line in a returning customer's cart. Only convert what is
      // actually numeric; keep the original otherwise.
      const numericId = typeof item.id === 'number' ? item.id : Number(item.id);
      const productId = Number.isFinite(numericId) ? numericId : item.id;
      const solicitud = leerSolicitud(item.solicitud);

      return {
        lineId: `${item.id}-restored-${index}`,
        productId,
        name: item.name,
        pricePerKg: item.price,
        quantity: stored && stored > 0 ? stored : 1,
        image: item.img ?? '/img/products/res.png',
        categorySlug: item.categoria ?? 'res',
        unit,
        // Carried untouched so syncLegacyCart can merge the fields React never
        // models — grosor, basePeso, the orderMode quote inputs — instead of
        // rebuilding the legacy shape and dropping them.
        legacy: item,
        ...(solicitud ? { solicitud } : {})
      };
    });
  } catch {
    return [];
  }
}
