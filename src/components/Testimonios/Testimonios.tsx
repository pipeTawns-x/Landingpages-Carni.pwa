import { useCallback, useEffect, useRef, useState } from 'react';
import { RESENAS, CALIFICACION, TOTAL_OPINIONES, PERFIL_GOOGLE } from '@src/data/resenas';
import { TestimonioCard } from './TestimonioCard';

/** Long enough to read a short review without rushing it. */
const INTERVALO_MS = 6000;

/**
 * The reviews, rotating.
 *
 * Three pieces, which is the shape Eduardo asked for: the data lives in
 * `src/data/resenas.ts`, one card component takes props, and this section
 * animates between them.
 *
 * The accessibility comes from the ARIA Authoring Practices Guide carousel
 * pattern — https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ — which is
 * specific about auto-rotation, and it is stricter than it looks:
 *
 *   · rotation stops on hover
 *   · rotation stops when anything inside takes keyboard focus, and does NOT
 *     resume on blur — only the button restarts it
 *   · a pause control is mandatory, with a label that says what it will do
 *   · the slide container is `aria-live="off"` while it rotates, so a screen
 *     reader is not interrupted every six seconds
 *
 * That last pair is also WCAG 2.2.2, Pause Stop Hide. `prefers-reduced-motion`
 * counts for conformance, but the guidance is that a visible pause button serves
 * more people, so this has both.
 */
export function Testimonios(): JSX.Element {
  const [indice, setIndice] = useState(0);
  const [enPausa, setEnPausa] = useState(false);
  const [detenidoPorUsuario, setDetenidoPorUsuario] = useState(false);
  const seccion = useRef<HTMLElement>(null);

  const total = RESENAS.length;

  const ir = useCallback(
    (n: number) => setIndice(((n % total) + total) % total),
    [total]
  );

  // Somebody who asked their system for less motion gets no rotation at all,
  // and the section is complete without it: every review is still there, and
  // the arrows still work.
  const [quietud, setQuietud] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const leer = (): void => setQuietud(mq.matches);
    leer();
    mq.addEventListener('change', leer);
    return () => mq.removeEventListener('change', leer);
  }, []);

  useEffect(() => {
    if (quietud || enPausa || detenidoPorUsuario) {
      return;
    }
    const t = window.setInterval(() => setIndice((i) => (i + 1) % total), INTERVALO_MS);
    return () => window.clearInterval(t);
  }, [quietud, enPausa, detenidoPorUsuario, total]);

  /**
   * Focus stops the rotation for good, not until blur.
   *
   * The APG is explicit: it "does not resume unless the user activates the
   * rotation control". Resuming on blur would move the card out from under
   * someone who tabbed in to read it.
   */
  // Se engancha con onFocusCapture: el foco llega a la seccion antes que a
  // cualquier hijo, asi que tabular hacia dentro detiene el giro aunque no se
  // active ningun control.
  const alEnfocar = useCallback(() => setDetenidoPorUsuario(true), []);

  const alternarPausa = useCallback(() => setDetenidoPorUsuario((v) => !v), []);

  const detenida = quietud || detenidoPorUsuario;

  return (
    <section
      className="resenas"
      ref={seccion}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Lo que dicen los clientes"
      onMouseEnter={() => setEnPausa(true)}
      onMouseLeave={() => setEnPausa(false)}
      onFocusCapture={alEnfocar}
    >
      <div className="resenas__encabezado">
        <p className="resenas__antetitulo">Lo que dicen los clientes</p>
        <p className="resenas__nota">
          <span className="resenas__numero">{CALIFICACION}</span>
          <span className="resenas__estrellas" aria-hidden="true">★★★★★</span>
          <span className="visually-hidden">de 5 estrellas</span>
        </p>
        <a className="resenas__enlace" href={PERFIL_GOOGLE} target="_blank" rel="noopener noreferrer">
          {TOTAL_OPINIONES} opiniones en Google
        </a>
      </div>

      {/* `aria-live="off"` while it rotates: a screen reader must not be
          interrupted every six seconds by a change nobody asked for. */}
      <div className="resenas__escenario" aria-live="off" aria-atomic="false">
        {RESENAS.map((r, i) => (
          <TestimonioCard
            key={r.autor}
            {...r}
            activo={i === indice}
            posicion={i + 1}
            total={total}
          />
        ))}
      </div>

      <div className="resenas__mandos">
        <button
          className="resenas__flecha"
          type="button"
          onClick={() => { setDetenidoPorUsuario(true); ir(indice - 1); }}
          aria-label="Testimonio anterior"
        >
          ‹
        </button>

        <div className="resenas__puntos" role="tablist" aria-label="Elegir testimonio">
          {RESENAS.map((r, i) => (
            <button
              key={r.autor}
              className={`resenas__punto ${i === indice ? 'resenas__punto--activo' : ''}`}
              type="button"
              role="tab"
              aria-selected={i === indice}
              aria-label={`Testimonio ${i + 1} de ${total}, ${r.autor}`}
              onClick={() => { setDetenidoPorUsuario(true); ir(i); }}
            />
          ))}
        </div>

        <button
          className="resenas__flecha"
          type="button"
          onClick={() => { setDetenidoPorUsuario(true); ir(indice + 1); }}
          aria-label="Testimonio siguiente"
        >
          ›
        </button>
      </div>

      {/* Mandatory for an auto-rotating carousel, and the label has to say what
          pressing it will do — not what the carousel is doing now. Hidden when
          the system already asked for stillness: there is nothing to pause. */}
      {quietud ? null : (
        <button className="resenas__pausa" type="button" onClick={alternarPausa}>
          {detenida ? 'Reanudar el giro' : 'Detener el giro'}
        </button>
      )}
    </section>
  );
}

export default Testimonios;
