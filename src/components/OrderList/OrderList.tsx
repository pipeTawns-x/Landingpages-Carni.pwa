import styled from 'styled-components';
import type { OrderLine } from '@src/types/database';

export interface OrderListProps {
  /** The lines currently in the order. Owned by the root component. */
  order: OrderLine[];
  onRemove: (lineId: string) => void;
}

/**
 * Estilos propios de las líneas del pedido (antes OrderList/styles.css, ~85
 * líneas). El componente conserva sus clases `order-list__*` como hooks de
 * debug; el aspecto lo dicta este styled-component co-locado.
 */
const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .order-list__item {
    display: grid;
    grid-template-columns: 48px 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem;
    border-radius: ${({ theme }) => theme.radii.md};
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .order-list__thumb {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }

  .order-list__info {
    min-width: 0;
  }

  .order-list__name {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .order-list__meta {
    margin: 0;
    font-size: 0.78rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  .order-list__line-total {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text};
    white-space: nowrap;
  }

  .order-list__remove {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    /* carni-red al 16 % — el fondo del botón de quitar */
    background: rgba(220, 38, 38, 0.16);
    color: #ff8f8f;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    transition: transform ${({ theme }) => theme.transitionFast};

    &:hover {
      transform: scale(1.12);
    }

    &:focus-visible {
      outline: 2px solid #ff8f8f;
      outline-offset: 2px;
    }
  }
`;

const Empty = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  line-height: 1.5;
`;

function unitLabel(unit: OrderLine['unit'], quantity: number): string {
  if (unit === 'unidad') {
    return quantity === 1 ? 'pieza' : 'piezas';
  }

  if (unit === 'paquete') {
    return quantity === 1 ? 'paquete' : 'paquetes';
  }

  return 'kg';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Renders the order it receives through props.
 *
 * This replaces the Bootstrap cart modal as the view of the order. It owns no
 * state: every line arrives from the root component, and removing one is
 * reported upwards rather than handled here.
 */
export function OrderList({ order, onRemove }: OrderListProps): JSX.Element {
  if (order.length === 0) {
    return (
      <Empty className="order-list__empty">
        Tu pedido está vacío. Agrega cortes desde el catálogo y aparecerán aquí.
      </Empty>
    );
  }

  return (
    <List className="order-list">
      {order.map((line) => (
        <li className="order-list__item" key={line.lineId}>
          <img className="order-list__thumb" src={line.image} alt="" aria-hidden="true" />
          <div className="order-list__info">
            <p className="order-list__name">{line.name}</p>
            <p className="order-list__meta">
              {/* The unit travels on the line. Hardcoding "kg" here billed a cap
                  as "1 kg × $250", contradicting the card it was added from. */}
              {line.quantity} {unitLabel(line.unit, line.quantity)} × {formatPrice(line.pricePerKg)}
            </p>
          </div>
          <strong className="order-list__line-total">
            {formatPrice(line.pricePerKg * line.quantity)}
          </strong>
          <button
            aria-label={`Quitar ${line.name} del pedido`}
            className="order-list__remove"
            onClick={() => onRemove(line.lineId)}
            type="button"
          >
            ×
          </button>
</li>
    ))}
    </List>
  );
}
