import type { Resena } from '@src/data/resenas';

export interface TestimonioCardProps extends Resena {
  /** True for the slide currently on screen. The rest stay in the DOM, hidden. */
  activo: boolean;
  /** Position within the set, for the "3 de 7" that screen readers announce. */
  posicion: number;
  total: number;
}

/**
 * One review. The whole section is seven of these with different props.
 *
 * `role="group"` with `aria-roledescription="slide"` is what the ARIA Authoring
 * Practices Guide asks of each slide in a carousel, along with a name that says
 * which one it is:
 * https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 *
 * The inactive slides keep their place in the layout rather than unmounting, so
 * the section never changes height as it rotates — a card that jumps while
 * someone is reading it is worse than no animation at all.
 */
export function TestimonioCard({
  autor,
  opiniones,
  texto,
  activo,
  posicion,
  total
}: TestimonioCardProps): JSX.Element {
  return (
    <figure
      className={`resena ${activo ? 'resena--activa' : ''}`}
      role="group"
      aria-roledescription="testimonio"
      aria-label={`${posicion} de ${total}: ${autor}`}
      aria-hidden={activo ? undefined : true}
    >
      <p className="resena__estrellas" aria-hidden="true">★★★★★</p>
      <blockquote className="resena__texto">«{texto}»</blockquote>
      <figcaption className="resena__autor">
        {autor}
        <span className="resena__opiniones">{opiniones} opiniones en Google</span>
      </figcaption>
    </figure>
  );
}

export default TestimonioCard;
