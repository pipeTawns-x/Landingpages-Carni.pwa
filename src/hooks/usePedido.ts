import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrderLine } from '@src/types/database';

export interface Pedido {
  lineas: OrderLine[];
  total: number;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  quitar: (lineId: string) => void;
}

export interface OpcionesPedido {
  /** Reads the order back from storage. Injected so the hook owns no parsing. */
  leer: () => OrderLine[];
  /** True while our own write is in flight, so the listener ignores it. */
  estaSincronizando?: () => boolean;
}

/**
 * The order and the drawer, shared by every route.
 *
 * This used to live inside the catalogue component, which meant the drawer only
 * existed on the catalogue route — open a product and the cart button did
 * nothing, because there was no panel mounted to open. Lifting it here lets one
 * drawer serve the catalogue and the configuration page alike.
 *
 * State travels through `localStorage` and the `cart:updated` event rather than
 * through props. That is not a shortcut: the cart button lives in the static
 * HTML header, outside React entirely, and `js/modules/core/cart.js` writes the
 * same key. Events are the only channel all three share.
 */
export function usePedido({ leer, estaSincronizando }: OpcionesPedido): Pedido {
  const [lineas, setLineas] = useState<OrderLine[]>(() => leer());
  const [abierto, setAbierto] = useState<boolean>(false);

  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const quitar = useCallback((lineId: string) => {
    setLineas((actuales) => actuales.filter((l) => l.lineId !== lineId));
  }, []);

  const total = useMemo(
    () => lineas.reduce((suma, l) => suma + l.pricePerKg * l.quantity, 0),
    [lineas]
  );

  // Someone else wrote the key: another tab, the vanilla cart, or the
  // configuration page adding a line.
  useEffect(() => {
    const rehidratar = (): void => {
      if (estaSincronizando?.()) {
        return;
      }
      setLineas(leer());
    };

    window.addEventListener('storage', rehidratar);
    window.addEventListener('cart:updated', rehidratar as EventListener);
    return () => {
      window.removeEventListener('storage', rehidratar);
      window.removeEventListener('cart:updated', rehidratar as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The cart button is in the static header, outside this tree, so it is bound
  // by id rather than through a prop.
  useEffect(() => {
    const boton = document.getElementById('cartBtn');

    const alternar = (e: Event): void => {
      e.preventDefault();
      setAbierto((v) => !v);
    };

    boton?.addEventListener('click', alternar);
    window.addEventListener('cart:open', abrir);
    window.addEventListener('cart:close', cerrar);

    return () => {
      boton?.removeEventListener('click', alternar);
      window.removeEventListener('cart:open', abrir);
      window.removeEventListener('cart:close', cerrar);
    };
  }, [abrir, cerrar]);

  /**
   * The drawer only takes the page hostage on a phone.
   *
   * On a wide screen it must not: Eduardo had this working and a later change
   * locked `body` at every width, so with the cart open the catalogue froze and
   * nothing else could be added. A phone is the exception — the panel covers the
   * screen there and scrolling the page behind it scrolls nothing anyone can
   * see.
   *
   * The listener matters as much as the check: resizing a desktop window while
   * the drawer is open would otherwise keep whichever lock was applied when it
   * opened.
   */
  useEffect(() => {
    const angosto = window.matchMedia('(max-width: 767.98px)');

    const aplicar = (): void => {
      const bloquear = abierto && angosto.matches;
      document.body.classList.toggle('cart-is-open', abierto);
      document.body.style.overflow = bloquear ? 'hidden' : '';
      document.body.style.touchAction = bloquear ? 'none' : '';
    };

    aplicar();
    angosto.addEventListener('change', aplicar);
    return () => {
      angosto.removeEventListener('change', aplicar);
      document.body.classList.remove('cart-is-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [abierto]);

  return { lineas, total, abierto, abrir, cerrar, quitar };
}
