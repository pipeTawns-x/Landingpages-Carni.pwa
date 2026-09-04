import { useEffect, useRef, useState } from 'react';
import { RESENAS, CALIFICACION, TOTAL_OPINIONES, PERFIL_GOOGLE } from '@src/data/resenas';

/**
 * What customers actually say, from the shop's Google profile.
 *
 * Sandra's review leads on purpose. Six of the seven say some version of
 * "excelente"; hers says *"siempre tienen fila pero atienden súper rápido"* —
 * it names an annoyance and turns it into proof the place works. That convinces
 * more than six compliments in a row.
 */
export function Testimonios(): JSX.Element {
  const seccion = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = seccion.current;
    if (!el) return;

    // Without IntersectionObserver the cards simply start visible. A browser
    // that cannot animate them must still be able to read them.
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Only now does the section agree to start hidden: the observer exists and
    // will be the one to reveal it. Adding the class from CSS instead would hide
    // the cards even where nothing can ever bring them back.
    el.classList.add('resenas--animar');

    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className={`resenas ${visible ? 'resenas--visible' : ''}`}
      ref={seccion}
      aria-labelledby="resenasTitulo"
    >
      <div className="resenas__encabezado">
        <p className="resenas__antetitulo">Lo que dicen los clientes</p>
        <h2 className="resenas__titulo" id="resenasTitulo">
          {CALIFICACION} <span className="resenas__estrellas" aria-hidden="true">★★★★★</span>
        </h2>
        <a className="resenas__enlace" href={PERFIL_GOOGLE} target="_blank" rel="noopener noreferrer">
          {TOTAL_OPINIONES} opiniones en Google
        </a>
      </div>

      <div className="resenas__carril">
        {RESENAS.map((r, i) => (
          <figure
            className="resenas__card"
            key={r.autor}
            style={{ '--retraso': `${i * 70}ms` } as React.CSSProperties}
          >
            <blockquote className="resenas__texto">«{r.texto}»</blockquote>
            <figcaption className="resenas__autor">
              {r.autor}
              <span className="resenas__opiniones">{r.opiniones} opiniones</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default Testimonios;
