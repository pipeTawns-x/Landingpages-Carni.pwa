import { useState } from 'react';
import { CALIFICACION, PERFIL_GOOGLE, RESENAS, TOTAL_OPINIONES } from '@src/data/resenas';
import { Estrella, IconoPausa } from '@src/ui/iconos';

/**
 * "Lo que dicen los clientes" — dos filas que giran en sentidos opuestos.
 *
 * Nombrada `Opiniones` y no `Testimonios`: ese nombre ya existe en
 * src/components/Testimonios (el carrusel de una sola tarjeta que usa
 * index.html hoy). Esta es una sección nueva y distinta — dos filas en
 * bucle horizontal, sin carrusel — así que llamarla igual habría chocado.
 *
 * Reseñas reales de src/data/resenas.ts, las mismas siete que ya usa
 * Testimonios.tsx. La calificación (4.7) y el total (61) también salen de
 * ahí, no del diseño.
 */
export function Opiniones(): JSX.Element {
  const [girando, setGirando] = useState(true);
  const [reducirMovimiento] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const fila1 = RESENAS.slice(0, 4);
  const fila2 = [...RESENAS.slice(4), ...RESENAS.slice(0, 1)];
  const estrellas = Array.from({ length: 5 }, (_, i) => Math.max(0, Math.min(1, CALIFICACION - i)));

  return (
    <section className="pt-14 lg:pt-[120px]">
      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:gap-3.5">
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">
            Lo que dicen los clientes
          </span>
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <span className="font-display text-5xl font-[480] leading-[52px] tabular-nums lg:text-[64px] lg:leading-[68px]">
              {CALIFICACION}
            </span>
            <span className="flex flex-col gap-1 lg:gap-1.5">
              <span aria-label={`${CALIFICACION} de 5 estrellas`} className="flex gap-0.5 lg:gap-[3px]">
                {estrellas.map((relleno, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Estrella key={i} relleno={relleno} />
                ))}
              </span>
              <a
                href={PERFIL_GOOGLE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text underline decoration-sand underline-offset-4 lg:text-[15px]"
              >
                {TOTAL_OPINIONES} opiniones en Google
                {/* El diseño solo agrega "· ver todas" en la franja de escritorio
                    (Landing.dc.html línea ~321); en móvil el enlace se queda
                    corto (línea ~129). Mismo href real en los dos anchos. */}
                <span className="hidden lg:inline"> · ver todas</span>
              </a>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGirando((v) => !v)}
          className="hidden h-11 items-center gap-2 self-start rounded-pill border border-border px-[18px] text-sm font-semibold text-text lg:flex"
        >
          <IconoPausa size={14} />
          {girando ? 'Detener el giro' : 'Reanudar el giro'}
        </button>
      </div>

      <div className="mt-5 overflow-hidden lg:mt-7">
        <div
          data-giro="izq"
          className="flex w-max animate-[carni-izq_70s_linear_infinite] gap-3 pl-4 lg:animate-[carni-izq_80s_linear_infinite] lg:gap-4 lg:pl-8"
          style={{ animationPlayState: reducirMovimiento ? 'paused' : girando ? 'running' : 'paused' }}
        >
          {[...fila1, ...fila1].map((r, i) => (
            <figure
              // eslint-disable-next-line react/no-array-index-key
              key={`${r.autor}-${i}`}
              className="m-0 box-border flex w-[280px] shrink-0 flex-col gap-3.5 rounded-2xl border border-border bg-surface-1 p-[18px] lg:w-[400px] lg:gap-[18px] lg:rounded-[20px] lg:p-6"
            >
              <blockquote className="m-0 text-pretty font-display text-[17px] font-[420] leading-[25px] lg:text-[21px] lg:leading-[30px]">
                «{r.texto}»
              </blockquote>
              <figcaption className="mt-auto flex flex-col gap-0.5">
                <span className="text-sm font-semibold leading-[18px] lg:text-[15px] lg:leading-5">{r.autor}</span>
                <span className="text-[13px] leading-[18px] tabular-nums text-text-muted lg:text-sm lg:leading-5">
                  {r.opiniones} opiniones en Google
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-hidden lg:mt-4">
        <div
          data-giro="der"
          className="flex w-max animate-[carni-der_70s_linear_infinite] gap-3 pl-4 lg:animate-[carni-der_80s_linear_infinite] lg:gap-4 lg:pl-8"
          style={{ animationPlayState: reducirMovimiento ? 'paused' : girando ? 'running' : 'paused' }}
        >
          {[...fila2, ...fila2].map((r, i) => (
            <figure
              // eslint-disable-next-line react/no-array-index-key
              key={`${r.autor}-${i}`}
              className="m-0 box-border flex w-[280px] shrink-0 flex-col gap-3.5 rounded-2xl border border-border bg-surface-1 p-[18px] lg:w-[400px] lg:gap-[18px] lg:rounded-[20px] lg:p-6"
            >
              <blockquote className="m-0 text-pretty font-display text-[17px] font-[420] leading-[25px] lg:text-[21px] lg:leading-[30px]">
                «{r.texto}»
              </blockquote>
              <figcaption className="mt-auto flex flex-col gap-0.5">
                <span className="text-sm font-semibold leading-[18px] lg:text-[15px] lg:leading-5">{r.autor}</span>
                <span className="text-[13px] leading-[18px] tabular-nums text-text-muted lg:text-sm lg:leading-5">
                  {r.opiniones} opiniones en Google
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 lg:hidden">
        <button
          type="button"
          onClick={() => setGirando((v) => !v)}
          className="flex h-11 items-center gap-2 rounded-pill border border-border px-[18px] text-sm font-semibold text-text"
        >
          <IconoPausa size={14} />
          {girando ? 'Detener el giro' : 'Reanudar el giro'}
        </button>
      </div>
    </section>
  );
}
