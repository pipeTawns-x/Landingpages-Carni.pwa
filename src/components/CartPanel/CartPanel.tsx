import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { OrderList } from '@src/components/OrderList/OrderList';
import type { OrderLine } from '@src/types/database';

export interface CartPanelProps {
  isOpen: boolean;
  order: OrderLine[];
  total: number;
  onClose: () => void;
  onRemove: (lineId: string) => void;
}

/**
 * Panel lateral del pedido — reglas propias (antes CartPanel/styles.css, 124
 * líneas). El estado abierto/cerrado es la prop transitoria $isOpen, que mueve
 * el panel on/off-canvas sin filtrarse al DOM.
 *
 * La regla `body.cart-is-open { padding-right }` (desktop) y su nuevo
 * complemento móvil (overflow hidden) viven en GlobalStyles: el estado se
 * anuncia en <body> y lo leen también otros componentes.
 */
const Panel = styled.aside<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1040;
  width: 380px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.charcoal};
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.45);
  transform: translateX(100%);
  visibility: hidden;
  transition: transform 0.28s ease, visibility 0s linear 0.28s;
  will-change: transform;

  @media (max-width: 575.98px) {
    width: 100%;
  }

  ${({ $isOpen }) =>
    $isOpen &&
    `
    transform: translateX(0);
    visibility: visible;
    transition: transform 0.28s ease, visibility 0s linear 0s;
  `}

  .cart-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .cart-panel__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
  }

  .cart-panel__count {
    margin: 0.15rem 0 0;
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  .cart-panel__close {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    color: ${({ theme }) => theme.colors.text};
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    transition: transform ${({ theme }) => theme.transitionFast};

    &:hover {
      transform: scale(1.08);
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.carniRed};
      outline-offset: 2px;
    }
  }

  .cart-panel__body {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 1.25rem;
  }

  .cart-panel__footer {
    padding: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: #0d0d0d;
  }

  .cart-panel__total-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
  }

  .cart-panel__total {
    font-size: 1.35rem;
    color: ${({ theme }) => theme.colors.text};
  }

  .cart-panel__checkout {
    width: 100%;
    padding: 0.85rem 1rem;
    border: none;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.carniRed};
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    transition: transform ${({ theme }) => theme.transitionFast}, opacity ${({ theme }) => theme.transitionFast};

    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid #ffffff;
      outline-offset: 2px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    .cart-panel__close,
    .cart-panel__checkout {
      transition: none;
    }
  }
`;

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
