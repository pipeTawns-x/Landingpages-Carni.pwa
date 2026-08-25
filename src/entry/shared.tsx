import { createRoot } from 'react-dom/client';
import { getProducts } from '../../js/modules/supabase.js';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import type { Product } from '@src/types/database';

/** How long the live catalogue gets before the seed wins. */
const PRODUCTS_TIMEOUT_MS = 2000;

/**
 * Result of a catalogue load. `live` says whether the data came from Supabase,
 * so the caller can tell a real update from the fallback it already rendered.
 */
export interface ProductsResult {
  products: Product[];
  live: boolean;
}

/**
 * Loads the catalogue, with the seed as a hard floor.
 *
 * VITE_SUPABASE_URL points at host.docker.internal, which does not resolve
 * outside Docker. The Supabase client retries on DNS failure, and the retries
 * took **7.4 seconds** to give up — the whole time the grid sat empty, because
 * the fallback only ran once the chain finally rejected.
 *
 * The request is now capped: whatever has not answered within two seconds is
 * abandoned and the seed stands. Nothing here blocks the first paint either —
 * the caller starts from the seed and only swaps if live data actually arrives.
 */
export async function fetchProducts(): Promise<ProductsResult> {
  // Held so the timer can be cleared once the race settles; otherwise it keeps
  // ticking for two seconds after the answer already arrived.
  let timeoutId = 0;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(null), PRODUCTS_TIMEOUT_MS);
  });

  try {
    // The catalogue is 33 products across 9 categories. A limit of 24 silently
    // truncated the last two categories out of the chip row.
    const request = getProducts({ limit: 100, inStock: true }) as Promise<unknown>;
    const data = await Promise.race([request, timeout]);

    if (Array.isArray(data) && data.length > 0) {
      return { products: data as Product[], live: true };
    }

    if (data === null) {
      console.warn(
        `[carni] Supabase did not answer within ${PRODUCTS_TIMEOUT_MS}ms; showing the seed catalogue.`
      );
    }
  } catch (error) {
    console.warn('[carni] Supabase unreachable, using the seed catalogue.', error);
  } finally {
    window.clearTimeout(timeoutId);
  }

  return { products: SEED_PRODUCTS, live: false };
}

export function mountReactNode(selector: string, node: JSX.Element): void {
  const host = document.querySelector<HTMLElement>(selector);
  if (!host) {
    return;
  }

  const root = createRoot(host);
  root.render(node);
}

export function categorySlugOf(product: Product): string {
  if (Array.isArray(product.categories)) {
    return product.categories[0]?.slug ?? '';
  }

  return product.categories?.slug ?? '';
}

export function categoryLabel(product: Product): string {
  if (Array.isArray(product.categories) && product.categories[0]?.name) {
    return product.categories[0].name;
  }

  if (!Array.isArray(product.categories) && product.categories?.name) {
    return product.categories.name;
  }

  return 'Selección Carni';
}
