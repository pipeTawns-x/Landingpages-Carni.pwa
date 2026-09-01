import { createRoot } from 'react-dom/client';
import { getProducts, getCategories } from '../../js/modules/supabase.js';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import type { Product } from '@src/types/database';

/** How long the live catalogue gets before the seed wins. */
const PRODUCTS_TIMEOUT_MS = 2000;

/**
 * The nine categories, in display order, as a floor under the live query.
 *
 * These are transcribed from `supabase/seed.sql` and must stay in step with it.
 * The fallback exists because the alternative is worse: the landing page's main
 * section is this grid, and a slow network would leave it blank. A grid that is
 * one rename out of date still sells meat; an empty one does not.
 *
 * The `order` values are the ones the grid layout keys off — `category-card-1`
 * through `-9` in `css/pages/_bento-main.scss` — so they are not arbitrary.
 */
const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Carnes Rojas', slug: 'carnes-rojas', image_url: '/img/products/res.webp', order: 1 },
  { id: 2, name: 'Cortes Especiales', slug: 'cortes-especiales', image_url: '/img/products/premium.webp', order: 2 },
  { id: 3, name: 'Cerdo', slug: 'cerdo', image_url: '/img/products/cerdo.webp', order: 3 },
  { id: 4, name: 'Pollo', slug: 'pollo', image_url: '/img/products/pollo.webp', order: 4 },
  { id: 5, name: 'Embutidos', slug: 'embutidos', image_url: '/img/products/embutidos.webp', order: 5 },
  { id: 6, name: 'Preparadas', slug: 'preparadas', image_url: '/img/products/preparadas.webp', order: 6 },
  { id: 7, name: 'Ofertas', slug: 'ofertas', image_url: '/img/products/premium.webp', order: 7 },
  { id: 8, name: 'Merch', slug: 'merch', image_url: '/img/products/merch.webp', order: 8 },
  { id: 9, name: 'Otros', slug: 'otros', image_url: '/img/products/otrosproductos.webp', order: 9 }
];

/** A row of `public.categories`, narrowed to what the grid actually renders. */
export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  order: number;
}

export interface CategoriesResult {
  categories: Category[];
  live: boolean;
}

/**
 * Loads the categories, capped the same way the catalogue is.
 *
 * Same reasoning as `fetchProducts`: the Supabase client retries on DNS failure
 * and can sit there for seconds before rejecting, and until it does the caller
 * has nothing to paint. Two seconds, then the fallback stands.
 */
export async function fetchCategories(): Promise<CategoriesResult> {
  let timeoutId = 0;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(null), PRODUCTS_TIMEOUT_MS);
  });

  try {
    const request = getCategories() as Promise<unknown>;
    const data = await Promise.race([request, timeout]);

    if (Array.isArray(data) && data.length > 0) {
      return { categories: data as Category[], live: true };
    }

    if (data === null) {
      console.warn(
        `[carni] Supabase did not answer within ${PRODUCTS_TIMEOUT_MS}ms; showing the fallback categories.`
      );
    }
  } catch (error) {
    console.warn('[carni] Supabase unreachable, using the fallback categories.', error);
  } finally {
    window.clearTimeout(timeoutId);
  }

  return { categories: FALLBACK_CATEGORIES, live: false };
}

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
