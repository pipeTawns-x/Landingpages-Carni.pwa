import type { ReactNode } from 'react';
import { NEGOCIO } from '@src/data/negocio';
import { IconoFacebook, IconoInstagram, IconoTelefono, IconoUbicacion, IconoWhatsapp } from './iconos';
import { Logotipo } from './Logotipo';

const ENLACE =
  'inline-flex min-h-11 items-center gap-2.5 text-ui text-text underline-offset-4 transition-colors duration-150 ease-out-strong hover:text-sand hover:underline';

const EXTERNO = { target: '_blank', rel: 'noopener noreferrer' } as const;

function Columna({ titulo, children }: { titulo: string; children: ReactNode }): JSX.Element {
  return (
    <div>
      <h2 className="font-sans text-meta font-medium text-text-muted">{titulo}</h2>
      <ul className="mt-2 flex flex-col">{children}</ul>
    </div>
  );
}

/**
 * El pie de la tienda: filas y columnas con hairline, sin cajas.
 * Todo dato del negocio sale de `src/data/negocio.ts`. No lleva correo: el
 * negocio atiende por teléfono y WhatsApp.
 */
export function Pie(): JSX.Element {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1.2fr_1fr] lg:gap-12">
          <div className="flex flex-col items-start gap-4">
            <a href="landing.html" aria-label="Carnicería El Señor de La Misericordia, ir al inicio">
              <Logotipo tamano="pie" />
            </a>
            <p className="max-w-[28ch] text-ui text-text-muted">{NEGOCIO.lema}</p>
          </div>

          <Columna titulo="Tienda">
            <li>
              <a href="catalogo.html" className={ENLACE}>
                Productos
              </a>
            </li>
            <li>
              <a href="catalogo.html#categoria=ofertas" className={ENLACE}>
                Ofertas
              </a>
            </li>
            <li>
              <a href="landing.html#preguntas" className={ENLACE}>
                Preguntas frecuentes
              </a>
            </li>
          </Columna>

          <Columna titulo="Contacto">
            <li>
              <a href={NEGOCIO.telefonoHref} className={ENLACE}>
                <IconoTelefono tamano={18} className="shrink-0 text-text-muted" />
                {NEGOCIO.telefono}
              </a>
            </li>
            <li>
              <a href={NEGOCIO.whatsappHref} {...EXTERNO} className={ENLACE}>
                <IconoWhatsapp size={18} className="shrink-0 text-text-muted" />
                Escribir por WhatsApp
              </a>
            </li>
            <li className="mt-2 flex gap-2.5 text-ui text-text-muted">
              <IconoUbicacion tamano={18} className="mt-0.5 shrink-0" />
              <address className="not-italic">
                {NEGOCIO.direccion[0]}
                <br />
                {NEGOCIO.direccion[1]}
              </address>
            </li>
            <li>
              <a href={NEGOCIO.mapaHref} {...EXTERNO} className={`${ENLACE} pl-7`}>
                Cómo llegar
              </a>
            </li>
          </Columna>

          <Columna titulo="Redes">
            <li>
              <a href={NEGOCIO.facebook} {...EXTERNO} className={ENLACE}>
                <IconoFacebook size={18} className="shrink-0 text-text-muted" />
                Facebook
              </a>
            </li>
            <li>
              <a href={NEGOCIO.instagram} {...EXTERNO} className={ENLACE}>
                <IconoInstagram size={18} className="shrink-0 text-text-muted" />
                Instagram
              </a>
            </li>
          </Columna>
        </div>

        <p className="mt-12 border-t border-border pt-6 text-meta text-text-muted">
          © 2026 Carnicería El Señor de La Misericordia
        </p>
      </div>
    </footer>
  );
}
