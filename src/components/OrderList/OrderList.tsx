import { formatearPrecio } from '@src/lib/formatearPrecio';
import type { OrderLine } from '@src/types/database';
import { List, Empty } from './styles';

export interface OrderListProps {
  /** The lines currently in the order. Owned by the root component. */
  order: OrderLine[];
  onRemove: (lineId: string) => void;
}

/*
 * Los precios de esta lista van en la variante `ticket` —con centavos— y no en
 * la del catalogo. Aqui ya no se comparan cortes, se revisa lo que se va a
 * pagar, y una linea redondeada no cuadra con el total que la suma.
 */

function unitLabel(unit: OrderLine['unit'], quantity: number): string {
  if (unit === 'unidad') {
    return quantity === 1 ? 'pieza' : 'piezas';
  }

  if (unit === 'paquete') {
    return quantity === 1 ? 'paquete' : 'paquetes';
  }

  return 'kg';
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
              {line.quantity} {unitLabel(line.unit, line.quantity)} ×{' '}
              {formatearPrecio(line.pricePerKg, 'ticket')}
            </p>
          </div>
          <strong className="order-list__line-total">
            {formatearPrecio(line.pricePerKg * line.quantity, 'ticket')}
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
