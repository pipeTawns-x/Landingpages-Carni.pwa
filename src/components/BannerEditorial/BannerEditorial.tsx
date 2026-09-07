import { Link } from 'react-router-dom';
import { assetUrl } from '@src/entry/shared';

export interface BannerEditorialProps {
  imagen?: string;
  antetitulo?: string;
  titulo?: string;
  texto?: string;
  enlace?: string;
  etiquetaEnlace?: string;
}

/**
 * The closing image of the page — the last thing before the footer.
 *
 * Borrowed from how Louis Vuitton and carnivoros.mx end a product page: one
 * photograph that fills the width, a short line of copy over it, one link. It is
 * not a promotion strip with three offers and a countdown; it is a full stop.
 *
 * The text is props with defaults rather than hardcoded copy, so the admin panel
 * can drive it later without touching this component. What it must never become
 * is a second catalogue: one image, one sentence, one destination.
 */
export function BannerEditorial({
  imagen = '/img/products/premium.webp',
  antetitulo = 'Del mostrador a tu mesa',
  titulo = 'Cortes que valen la espera',
  texto = 'Seleccionamos pieza por pieza, todos los días, en San Luis Potosí.',
  enlace = '/',
  etiquetaEnlace = 'Ver el catálogo'
}: BannerEditorialProps): JSX.Element {
  return (
    <section className="banner" aria-label={titulo}>
      <img
        className="banner__foto"
        src={assetUrl(imagen)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1600}
        height={900}
      />

      {/* The veil is what makes the copy readable over a photograph whose
          brightness nobody controls. Measured on the composited pixels, not on
          the overlay colour — that mistake cost this project a round already. */}
      <div className="banner__velo" aria-hidden="true" />

      <div className="banner__texto">
        <p className="banner__antetitulo">{antetitulo}</p>
        <h2 className="banner__titulo">{titulo}</h2>
        <p className="banner__linea">{texto}</p>
        <Link className="banner__accion" to={enlace}>{etiquetaEnlace}</Link>
      </div>
    </section>
  );
}

export default BannerEditorial;
