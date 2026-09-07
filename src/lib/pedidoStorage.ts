import type { CartLegacyItem, OrderLine } from '@src/types/database';

export const LLAVE_PEDIDO = 'carni_cart_v1';

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
        legacy: item
      };
    });
  } catch {
    return [];
  }
}
