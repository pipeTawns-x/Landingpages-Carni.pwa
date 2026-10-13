import type { ReactNode } from 'react';
import { NEGOCIO, whatsappConTexto } from '@src/data/negocio';
import {
  IconoFacebook,
  IconoInstagram,
  IconoSiguiente,
  IconoTelefono,
  IconoUbicacion,
  IconoWhatsapp
} from '@src/ui/iconos';
import { CONTENEDOR } from './datos';

const EXTERNO = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** `https://www.instagram.com/carniceria.misericordia/` a `@carniceria.misericordia`. */
function usuarioDe(url: string): string {
  const ruta = new URL(url).pathname.split('/').filter(Boolean);
  return `@${ruta[ruta.length - 1] ?? ''}`;
}

interface FilaProps {
  href: string;
  etiqueta: string;
  icono: ReactNode;
  externo?: boolean;
  /** Texto de la acción, a la derecha del valor: solo la dirección lo lleva ("Cómo llegar"). */
  accion?: string;
  children: ReactNode;
}

/**
 * Una fila de contacto. La fila ENTERA es el enlace, así el objetivo táctil mide
 * el ancho de la pantalla y nunca menos de 64 px de alto.
 */
function Fila({ href, etiqueta, icono, externo = false, accion, children }: FilaProps): JSX.Element {
  return (
    <li>
      <a
        href={href}
        {...(externo ? EXTERNO : {})}
        className="group flex min-h-16 items-center gap-4 border-b border-border py-3 transition-colors duration-150 ease-out-strong hover:bg-surface-1 lg:grid lg:grid-cols-[14rem_1fr_auto] lg:gap-6 lg:px-2"
      >
        <span className="flex items-center gap-4">
          <span aria-hidden="true" className="shrink-0 text-text-muted">
            {icono}
          </span>
          <span className="hidden text-ui text-text-muted lg:inline">{etiqueta}</span>
        </span>

        <span className="min-w-0 flex-1 lg:flex-none">
          <span className="block text-meta text-text-muted lg:hidden">{etiqueta}</span>
          <span className="block text-lead">{children}</span>
          {accion ? <span className="mt-1 block text-ui text-sand sm:hidden">{accion}</span> : null}
        </span>

        <span className="flex shrink-0 items-center gap-3 text-ui text-sand">
          {accion ? <span className="hidden sm:inline">{accion}</span> : null}
          <IconoSiguiente
            tamano={18}
            className="text-text-muted transition-transform duration-150 ease-out-strong group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </span>
      </a>
    </li>
  );
}

/**
 * "Contacto y dirección": filas con hairline y un único botón rojo. Sin correo,
 * porque el negocio atiende por teléfono y WhatsApp, y sin mapa incrustado: el
 * enlace de "Cómo llegar" abre Maps, que ya sabe guiar.
 */
export function Contacto(): JSX.Element {
  return (
    <section id="contacto" className="border-t border-border py-16 lg:py-24">
      <div className={CONTENEDOR}>
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-seccion">Contacto y dirección</h2>
          <a
            href={whatsappConTexto('Hola, quiero hacer un pedido.')}
            {...EXTERNO}
            className="inline-flex h-12 w-full touch-manipulation items-center justify-center gap-2.5 rounded-pill bg-red px-8 text-ui font-medium text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-[0.97] motion-reduce:transition-none sm:w-auto"
          >
            <IconoWhatsapp size={20} />
            Escribir por WhatsApp
          </a>
        </div>

        <ul className="mt-8 border-t border-border lg:mt-12">
          <Fila href={NEGOCIO.telefonoHref} etiqueta="Teléfono" icono={<IconoTelefono tamano={20} />}>
            <span className="tabular-nums">{NEGOCIO.telefono}</span>
          </Fila>
          <Fila
            href={NEGOCIO.mapaHref}
            externo
            etiqueta="Dirección"
            accion="Cómo llegar"
            icono={<IconoUbicacion tamano={20} />}
          >
            {NEGOCIO.direccion[0]}
            <span className="block text-ui text-text-muted">{NEGOCIO.direccion[1]}</span>
          </Fila>
          <Fila href={NEGOCIO.facebook} externo etiqueta="Facebook" icono={<IconoFacebook size={20} />}>
            {NEGOCIO.nombre}
          </Fila>
          <Fila href={NEGOCIO.instagram} externo etiqueta="Instagram" icono={<IconoInstagram size={20} />}>
            {usuarioDe(NEGOCIO.instagram)}
          </Fila>
        </ul>
      </div>
    </section>
  );
}
