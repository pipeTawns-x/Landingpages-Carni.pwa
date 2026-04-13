import { mountReactNode } from './shared';
import '@src/styles/redesign.css';

function OfflineExperience(): JSX.Element {
  return (
    <section className="tw-redesign-root tw-offline-shell">
      <div className="tw-offline-shell__content">
        <p className="tw-kicker">Modo Offline</p>
        <h2>La carnicería sigue respondiendo incluso sin conexión</h2>
        <p>
          El estado offline ahora tiene una presentación más clara y alineada a la marca, para que el usuario entienda
          qué partes del catálogo siguen disponibles y cómo volver a sincronizar cuando regrese la conexión.
        </p>
      </div>
    </section>
  );
}

mountReactNode('#offlineReactRoot', <OfflineExperience />);
