import { mountReactNode } from './shared';
import '@src/styles/redesign.css';

function CustomersStudio(): JSX.Element {
  return (
    <section className="tw-redesign-root tw-admin-ribbon">
      <div className="tw-admin-ribbon__content">
        <p className="tw-kicker">Mercy Club</p>
        <h2>Vista de clientes, lealtad y activación comercial</h2>
        <p>
          Esta capa eleva la sección de clientes a una lectura de comunidad: adquisición, afiliación,
          score y ventanas de retención para campañas futuras.
        </p>
        <div className="tw-admin-ribbon__grid">
          <article className="tw-mini-card"><h3>Segmentación</h3><p>Detecta clientes activos, nuevos y con alta recurrencia para rewards o bundles.</p></article>
          <article className="tw-mini-card"><h3>Fidelización</h3><p>Prepara la base visual para score, puntos y experiencias premium del Mercy Club.</p></article>
        </div>
      </div>
    </section>
  );
}

mountReactNode('#adminCustomersStudioRoot', <CustomersStudio />);
