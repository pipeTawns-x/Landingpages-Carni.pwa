import { mountReactNode } from './shared';
import '@src/styles/redesign.css';

function AuthExperience(): JSX.Element {
  return (
    <section className="tw-redesign-root tw-auth-strip">
      <div className="tw-auth-strip__content">
        <p className="tw-kicker">Acceso Premium</p>
        <h2>Login y registro con identidad editorial, confianza y claridad móvil</h2>
        <p>
          Se preservan los efectos visuales del acceso actual, pero se suma una capa editorial que explica beneficios,
          delivery, seguimiento y la experiencia premium del club digital.
        </p>
        <div className="tw-auth-strip__grid">
          <article className="tw-mini-card"><h3>Entrega y pickup</h3><p>Compra, agenda y confirma pedidos con seguimiento para tienda o envío.</p></article>
          <article className="tw-mini-card"><h3>Mercy Club</h3><p>Acumula puntos, recibe ofertas especiales y conserva tu historial de compras.</p></article>
        </div>
      </div>
    </section>
  );
}

mountReactNode('#authExperienceRoot', <AuthExperience />);
