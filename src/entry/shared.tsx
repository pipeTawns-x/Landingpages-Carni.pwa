import { createRoot } from 'react-dom/client';
import { getProducts } from '../../js/modules/supabase.js';
import type { Product } from '@src/types/database';

export async function fetchProducts(): Promise<Product[]> {
  const data = (await getProducts({ limit: 24, inStock: true })) as unknown;
  return Array.isArray(data) ? (data as Product[]) : [];
}

export function mountReactNode(selector: string, node: JSX.Element): void {
  const host = document.querySelector<HTMLElement>(selector);
  if (!host) {
    return;
  }

  const root = createRoot(host);
  root.render(node);
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
