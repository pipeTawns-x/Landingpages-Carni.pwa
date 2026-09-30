import { CORREO_HREF, FACEBOOK_URL, TELEFONO, TELEFONO_HREF, WHATSAPP_HREF } from './datos';
import { IconoCorreo, IconoFacebook, IconoFlecha, IconoTelefono, IconoWhatsapp } from '@src/ui/iconos';

/**
 * "Contacto directo". La cuarta fila del diseño, "Síguenos en Facebook",
 * se renderiza SOLO cuando `FACEBOOK_URL` (datos.ts) tenga una URL real —
 * hoy está vacía: no hay ninguna URL real de Facebook en el repo (se buscó
 * "facebook.com" en todo el proyecto — la única que existe hoy en
 * index.html es un `href="#"` de marcador). El gate de calidad pide no
 * publicar nunca un `href="#"`, así que la fila queda apagada en vez de
 * fingir un enlace. Mismo criterio que en Pie.tsx.
 */
export function ContactoDirecto(): JSX.Element {
  return (
    <section id="contacto" className="px-4 pb-14 pt-14 lg:px-8 lg:pb-[120px] lg:pt-[120px]">
      <h2 className="m-0 mb-3.5 font-display text-[30px] font-[460] leading-9 lg:mb-7 lg:text-[44px] lg:leading-[50px]">
        Contacto directo
      </h2>

      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface-1 p-5 lg:items-start lg:gap-5 lg:rounded-[24px] lg:p-8">
          <span className="flex items-center gap-3.5 lg:contents">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border border-border bg-surface-2 text-sand lg:h-14 lg:w-14">
              <IconoTelefono size={22} />
            </span>
            <span className="flex flex-col gap-0.5 lg:gap-1">
              <span className="font-display text-[22px] font-[460] leading-[26px] lg:text-[30px] lg:leading-9">
                Teléfono
              </span>
              <span className="text-[15px] leading-5 text-text-muted">Llama directamente</span>
            </span>
          </span>
          <a
            href={TELEFONO_HREF}
            className="flex h-12 items-center justify-center gap-2 rounded-pill border border-sand px-[22px] text-[15px] font-semibold tabular-nums text-text no-underline hover:border-text lg:mt-2 lg:self-stretch"
          >
            {TELEFONO}
          </a>
        </div>

        <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface-1 p-5 lg:items-start lg:gap-5 lg:rounded-[24px] lg:p-8">
          <span className="flex items-center gap-3.5 lg:contents">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border border-border bg-surface-2 text-sand lg:h-14 lg:w-14">
              <IconoWhatsapp size={22} />
            </span>
            <span className="flex flex-col gap-0.5 lg:gap-1">
              <span className="font-display text-[22px] font-[460] leading-[26px] lg:text-[30px] lg:leading-9">
                WhatsApp
              </span>
              <span className="text-[15px] leading-5 text-text-muted">Mensajes directos</span>
            </span>
          </span>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-pill bg-red text-[15px] font-semibold text-white no-underline hover:bg-red-hover lg:mt-2 lg:self-stretch"
          >
            Chatear
          </a>
        </div>

        <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface-1 p-5 lg:items-start lg:gap-5 lg:rounded-[24px] lg:p-8">
          <span className="flex items-center gap-3.5 lg:contents">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border border-border bg-surface-2 text-sand lg:h-14 lg:w-14">
              <IconoCorreo size={22} />
            </span>
            <span className="flex flex-col gap-0.5 lg:gap-1">
              <span className="font-display text-[22px] font-[460] leading-[26px] lg:text-[30px] lg:leading-9">
                Correo
              </span>
              <span className="text-[15px] leading-5 text-text-muted">Escríbenos</span>
            </span>
          </span>
          <a
            href={CORREO_HREF}
            className="flex h-12 items-center justify-center gap-2 rounded-pill border border-sand px-[22px] text-[15px] font-semibold text-text no-underline hover:border-text lg:mt-2 lg:self-stretch"
          >
            Enviar correo
          </a>
        </div>
      </div>

      {FACEBOOK_URL ? (
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 flex min-h-16 items-center gap-3.5 rounded-[20px] border border-border py-2.5 pl-2.5 pr-4 text-text no-underline hover:border-sand lg:mt-6 lg:min-h-[72px] lg:gap-4 lg:py-3 lg:pl-3 lg:pr-6"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-border bg-surface-2 text-sand">
            <IconoFacebook size={20} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-base font-semibold leading-[22px]">Síguenos en Facebook</span>
            <span className="text-sm leading-5 text-text-muted">Ofertas y cortes del día</span>
          </span>
          <IconoFlecha size={20} className="shrink-0 text-sand" />
        </a>
      ) : null}
    </section>
  );
}
