import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CartLegacyItem, Product } from '@src/types/database';

const LEGACY_CART_KEY = 'carni_cart_v1';

function readCart(): CartLegacyItem[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_CART_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartLegacyItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartLegacyItem[]): void {
  window.localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: items.length } }));
}

function mapProductToLegacyItem(product: Product, quantity: number): CartLegacyItem {
  return {
    id: product.id,
    name: product.name,
    price: product.price_per_kg,
    img: product.image_url ?? 'img/products/res.png',
    tipo: 'kg',
    peso: quantity,
    categoria: resolveProductCategory(product)
  };
}

function resolveProductCategory(product: Product): string {
  if (Array.isArray(product.categories) && product.categories[0]?.slug) {
    return product.categories[0].slug;
  }

  if (!Array.isArray(product.categories) && product.categories?.slug) {
    return product.categories.slug;
  }

  return 'res';
}

export interface UseCartResult {
  items: CartLegacyItem[];
  count: number;
  total: number;
  addToCart: (product: Product, quantity?: number) => void;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartLegacyItem[]>(() => readCart());

  useEffect(() => {
    const syncCart = (): void => {
      setItems(readCart());
    };

    window.addEventListener('storage', syncCart);
    window.addEventListener('cart:updated', syncCart as EventListener);

    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('cart:updated', syncCart as EventListener);
    };
  }, []);

  const addToCart = useCallback((product: Product, quantity = 1): void => {
    const cart = readCart();
    const nextItem = mapProductToLegacyItem(product, quantity);
    cart.push(nextItem);
    writeCart(cart);
    setItems(cart);
  }, []);

  const count = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.piezas ?? 1), 0);
  }, [items]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = item.tipo === 'unidad' || item.tipo === 'paquete'
        ? item.piezas ?? 1
        : item.peso ?? 1;
      return sum + item.price * quantity;
    }, 0);
  }, [items]);

  return { items, count, total, addToCart };
}
