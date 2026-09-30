import {
  CORREO,
  CORREO_HREF,
  DIRECCION_LINEA1,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  TELEFONO,
  TELEFONO_HREF,
  WHATSAPP_HREF
} from '@src/landing/datos';
import { IconoCorreo, IconoFacebook, IconoInstagram, IconoTelefono, IconoUbicacion, IconoWhatsapp } from './iconos';

/**
 * El pie de la tienda: marca, Información, Contacto rápido.
 *
 * Facebook e Instagram se muestran solo cuando `FACEBOOK_URL`/`INSTAGRAM_URL`
 * (datos.ts) traigan una URL real — hoy están vacías: el encargo pedía usar
 * las URL reales que ya existieran en index.html, y están ahí, pero como
 * `href="#"`. Se confirmó buscando "facebook.com"/"instagram.com" en todo el
 * repo y no hay ninguna URL real de este negocio en ningún archivo. El gate
 * de calidad dice "nunca href='#'", así que los dos íconos quedan apagados
 * en vez de fingir un enlace. WhatsApp sí tiene URL real
 * (`wa.me/524442715470`) y se queda siempre.
 */
export function Pie(): JSX.Element {
  return (
    <footer className="box-border border-t border-border bg-surface-1 px-5 pb-7 pt-12 font-sans text-text lg:px-12 lg:pb-8 lg:pt-[72px]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-9 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12">
        <div className="flex flex-col gap-5">
          <a
            href="index.html"
            aria-label="Carnicería El Señor de La Misericordia, ir al inicio"
            className="flex flex-col items-start gap-[7px] self-start leading-none text-text no-underline"
          >
            <span className="text-[26px] font-semibold tracking-[0.18em]">CARNICERÍA</span>
            <span className="flex items-center gap-2 whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-sand">
              EL SEÑOR DE LA MISERICORDIA
              <span className="h-px w-6 bg-sand" />
            </span>
          </a>
          <div className="flex flex-col gap-2">
            <p className="m-0 max-w-[40ch] text-base leading-[25px] text-text text-pretty">
              Productos cárnicos frescos de la más alta calidad, cortados como los pides.
            </p>
            <p className="m-0 max-w-[40ch] text-[15px] leading-[23px] text-text-muted text-pretty">
              Cortes selectos hasta tu puerta · San Luis Potosí, México.
            </p>
          </div>
          <div className="flex gap-2.5">
            {FACEBOOK_URL ? (
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-text hover:border-sand"
              >
                <IconoFacebook />
              </a>
            ) : null}
            {INSTAGRAM_URL ? (
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-text hover:border-sand"
              >
                <IconoInstagram />
              </a>
            ) : null}
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-text hover:border-sand"
            >
              <IconoWhatsapp />
            </a>
          </div>
        </div>

        <nav aria-label="Información" className="flex flex-col gap-1">
          <span className="pb-1.5 font-display text-[21px] font-[460] leading-7 text-sand">Información</span>
          <a href="#sobre-nosotros" className="flex min-h-11 items-center text-base text-text no-underline hover:text-sand">
            Sobre nosotros
          </a>
          <a href="products.html" className="flex min-h-11 items-center text-base text-text no-underline hover:text-sand">
            Productos
          </a>
          <a href="#contacto" className="flex min-h-11 items-center text-base text-text no-underline hover:text-sand">
            Contacto
          </a>
        </nav>

        <div className="flex flex-col gap-1">
          <span className="pb-1.5 font-display text-[21px] font-[460] leading-7 text-sand">Contacto rápido</span>
          <a
            href={TELEFONO_HREF}
            className="flex min-h-11 items-center gap-3 text-base tabular-nums text-text no-underline hover:text-sand"
          >
            <IconoTelefono size={18} className="shrink-0 text-text-muted" />
            {TELEFONO}
          </a>
          <a
            href={CORREO_HREF}
            className="flex min-h-11 items-center gap-3 text-base text-text no-underline hover:text-sand"
            style={{ overflowWrap: 'anywhere' }}
          >
            <IconoCorreo size={18} className="shrink-0 text-text-muted" />
            {CORREO}
          </a>
          <span className="flex min-h-11 items-center gap-3 text-base leading-[22px] text-text-muted">
            <IconoUbicacion size={18} className="shrink-0 text-text-muted" />
            {DIRECCION_LINEA1}
          </span>
        </div>
      </div>

      <div className="mx-auto mt-9 max-w-[1440px] border-t border-border pt-6 text-sm text-text-muted lg:mt-14 lg:text-center">
        © 2026 Carnicería El Señor de La Misericordia. Todos los derechos reservados.
      </div>
    </footer>
  );
}
