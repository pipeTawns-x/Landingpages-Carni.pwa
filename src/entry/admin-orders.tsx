import { mountReactNode } from './shared';
import '@src/styles/redesign.css';

function OrdersStudio(): JSX.Element {
  return (
    <section className="tw-redesign-root tw-admin-ribbon">
      <div className="tw-admin-ribbon__content">
        <p className="tw-kicker">Orders Command</p>
        <h2>Seguimiento de pedidos, tickets y contexto operativo</h2>
        <p>
          El módulo de pedidos ahora tiene un frente visual más alineado al dashboard principal, listo para enlazar
          tickets, logística y validación comercial sin eliminar la tabla operativa actual.
        </p>
        <div className="tw-admin-ribbon__grid">
          <article className="tw-mini-card"><h3>Prioridad logística</h3><p>Identifica pedidos pendientes, entregas y excepciones de forma inmediata.</p></article>
          <article className="tw-mini-card"><h3>Trazabilidad</h3><p>Prepara la vista para ticketing, impresión y auditoría de detalle por pedido.</p></article>
        </div>
      </div>
    </section>
  );
}

mountReactNode('#adminOrdersStudioRoot', <OrdersStudio />);
