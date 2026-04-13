import { mountReactNode } from './shared';
import '@src/styles/redesign.css';

function InventoryStudio(): JSX.Element {
  return (
    <section className="tw-redesign-root tw-admin-ribbon">
      <div className="tw-admin-ribbon__content">
        <p className="tw-kicker">Inventory Atelier</p>
        <h2>Gestión visual de inventario con enfoque premium y operativo</h2>
        <p>
          La vista de productos se convierte en un estudio de control para stock, pricing y activaciones comerciales,
          sin perder la tabla operativa existente como fallback seguro.
        </p>
        <div className="tw-admin-ribbon__grid">
          <article className="tw-mini-card"><h3>Altas rápidas</h3><p>Prepara nuevos productos con lineamientos visuales, tags y oferta especial.</p></article>
          <article className="tw-mini-card"><h3>Product tracer</h3><p>Usa señales de stock y trazabilidad para decidir reposición o promoción.</p></article>
        </div>
      </div>
    </section>
  );
}

mountReactNode('#adminProductsStudioRoot', <InventoryStudio />);
