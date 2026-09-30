import { useState } from 'react';
import { IconoAsistente, IconoChevron } from '@src/ui/iconos';
import { PREGUNTAS_VISIBLES, WHATSAPP_HREF } from './datos';

/**
 * "Preguntas frecuentes". Solo se muestran las tres preguntas confirmadas
 * (`PREGUNTAS_VISIBLES` en datos.ts) — las otras dos del diseño llevaban una
 * etiqueta interna ("por confirmar con el dueño", "falta backend") que no es
 * algo que un cliente deba leer, así que quedan fuera del render.
 */
export function PreguntasFrecuentes(): JSX.Element {
  const [abierta, setAbierta] = useState(0);

  return (
    <section className="px-4 pt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start lg:gap-16 lg:px-8 lg:pt-[120px]">
      <div className="flex flex-col gap-2 lg:gap-3.5">
        <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">Antes de pedir</span>
        <h2 className="m-0 font-display text-[30px] font-[460] leading-9 lg:text-[44px] lg:leading-[50px]">
          Preguntas frecuentes
        </h2>
        <p className="m-0 hidden max-w-[36ch] text-pretty text-base leading-6 text-text-muted lg:block">
          ¿No está tu duda? Escríbele al carnicero, contesta en horario de tienda.
        </p>
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 hidden h-12 items-center gap-2 self-start rounded-pill border border-sand px-[22px] text-[15px] font-semibold text-text no-underline lg:flex"
        >
          <IconoAsistente size={18} />
          Escribir por WhatsApp
        </a>
      </div>

      <div className="mt-5 border-t border-border lg:mt-0">
        {PREGUNTAS_VISIBLES.map((item, indice) => {
          const abiertaAhora = abierta === indice;
          return (
            <div key={item.pregunta} className="border-b border-border">
              <button
                type="button"
                aria-expanded={abiertaAhora}
                onClick={() => setAbierta((actual) => (actual === indice ? -1 : indice))}
                className="flex min-h-[60px] w-full items-center justify-between gap-4 bg-transparent py-3.5 text-left text-base font-semibold leading-[22px] text-text lg:min-h-[68px] lg:gap-6 lg:py-[18px] lg:text-lg lg:leading-[26px]"
              >
                {item.pregunta}
                <IconoChevron
                  size={20}
                  className={`shrink-0 text-sand transition-transform duration-200 lg:hidden ${
                    abiertaAhora ? 'rotate-180' : ''
                  }`}
                />
                <IconoChevron
                  size={22}
                  className={`hidden shrink-0 text-sand transition-transform duration-200 lg:block ${
                    abiertaAhora ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {abiertaAhora ? (
                <div className="flex flex-col items-start gap-2 pb-5 pr-8 lg:pb-6 lg:pr-16">
                  <p className="m-0 max-w-[64ch] text-pretty text-[15px] leading-6 text-text-muted lg:text-base lg:leading-[26px]">
                    {item.respuesta}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
