import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OrderList } from '@src/components/OrderList/OrderList';
import type { OrderLine } from '@src/types/database';
import { Panel } from './styles';

export interface CartPanelProps {
  isOpen: boolean;
  order: OrderLine[];
  total: number;
  onClose: () => void;
  onRemove: (lineId: string) => void;
}
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Side panel that shows the current order.
 *
 * Deliberately not a dialog: there is no backdrop and focus is never trapped,
 * so the catalogue stays scrollable and clickable while the panel is open and
 * lines can be added or removed without closing it. That is the whole reason
 * this replaces the Bootstrap modal, which blocked the page behind it.
 */
export function CartPanel({ isOpen, order, total, onClose, onRemove }: CartPanelProps): JSX.Element {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const itemCount = order.length;

  /**
   * El cajón se dibuja en `body`, no donde lo pongan.
   *
   * En products.html el panel colgaba de un `div.container-fluid` con
   * `position: relative; z-index: 20`. Eso abre un CONTEXTO DE APILAMIENTO: el
   * `z-index: 1040` del panel deja de compararse con el resto de la página y
   * pasa a ordenarse solo entre sus hermanos, mientras la caja entera compite
   * con el encabezado como si valiera 20. Resultado en un teléfono: el header
   * (z-index 1035) tapaba el título del pedido y su botón de cerrar, así que el
   * cliente no podía ni leer ni cerrar su propio cajón.
   *
   * Subirlo por `z-index` sería perseguir el número equivocado — el problema no
   * es cuánto vale, es contra quién compite. El portal lo saca del árbol de
   * cajas sin sacarlo del árbol de React: los eventos siguen subiendo hasta
   * aquí, y el panel ya no depende de dónde lo monten.
   */
  return createPortal(
    <Panel
      aria-hidden={!isOpen}
      aria-label="Tu pedido"
      className="cart-panel"
      $isOpen={isOpen}
      // Keeps the panel and everything inside it out of the tab order and out of
      // the accessibility tree while it is off-canvas.
      {...(isOpen ? {} : { inert: '' })}
    >
      <header className="cart-panel__header">
        <div>
          <h2 className="cart-panel__title">Tu pedido</h2>
          <p className="cart-panel__count">
            {itemCount === 1 ? '1 producto' : `${itemCount} productos`}
          </p>
        </div>
        <button
          aria-label="Cerrar el pedido"
          className="cart-panel__close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          ×
        </button>
      </header>

      <div className="cart-panel__body">
        <OrderList order={order} onRemove={onRemove} />
      </div>

      <footer className="cart-panel__footer">
        <div className="cart-panel__total-row">
          <span>Total</span>
          <strong className="cart-panel__total">{formatPrice(total)}</strong>
        </div>
        <button className="cart-panel__checkout" disabled={itemCount === 0} type="button">
          Continuar con el pedido
        </button>
      </footer>
    </Panel>,
    document.body
  );
}
