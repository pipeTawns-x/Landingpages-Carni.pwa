import { useCallback, useEffect, useRef, useState } from 'react';

export interface CarrilCategoriasProps {
  filtros: string[];
  activo: string;
  onElegir: (filtro: string) => void;
  etiqueta: (filtro: string) => string;
}

/**
 * The category chips as one scrolling line instead of a grid that wraps.
 *
 * With ten categories and `flex-wrap: wrap`, "Ofertas" dropped alone onto a
 * second row and the block read as crowded — reported twice. A single line keeps
 * a constant height and scans in one look.
 *
 * The arrows are pointer-only. A finger already drags, and a floating button on
 * a phone just covers a chip.
 */
export function CarrilCategorias({
  filtros,
  activo,
  onElegir,
  etiqueta
}: CarrilCategoriasProps): JSX.Element {
  const carril = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  const medir = useCallback(() => {
    const el = carril.current;
    if (!el) return;
    setPuedeIzq(el.scrollLeft > 4);
    // One pixel of slack: sub-pixel layout makes the exact equality unreliable
    // and would leave the right arrow lit at the end of the rail.
    setPuedeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [medir, filtros.length]);

  /**
   * Keeps the selected chip in view.
   *
   * Deep links land on a category that can sit halfway down the rail — arriving
   * at "Ofertas" with the rail at its start shows an active chip nobody can see.
   */
  useEffect(() => {
    const el = carril.current;
    if (!el) return;
    const chip = el.querySelector<HTMLElement>('.tw-filter-chip--active');
    if (!chip) return;
    const fueraIzq = chip.offsetLeft < el.scrollLeft;
    const fueraDer = chip.offsetLeft + chip.offsetWidth > el.scrollLeft + el.clientWidth;
    if (fueraIzq || fueraDer) {
      el.scrollTo({ left: chip.offsetLeft - 16, behavior: 'smooth' });
    }
  }, [activo]);

  const desplazar = (signo: 1 | -1): void => {
    const el = carril.current;
    if (!el) return;
    // Eight tenths of a screen, not a whole one: leaving a chip visible tells
    // the reader the rail moved rather than jumped somewhere else.
    el.scrollBy({ left: signo * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="tw-filter-carril">
      <button
        className="tw-filter-flecha tw-filter-flecha--izq"
        type="button"
        aria-label="Ver categorías anteriores"
        disabled={!puedeIzq}
        onClick={() => desplazar(-1)}
      >
        ‹
      </button>

      <div className="tw-filter-row" ref={carril} onScroll={medir}>
        {filtros.map((filtro) => (
          <button
            className={`tw-filter-chip ${activo === filtro ? 'tw-filter-chip--active' : ''}`}
            key={filtro}
            type="button"
            aria-pressed={activo === filtro}
            onClick={() => onElegir(filtro)}
          >
            {etiqueta(filtro)}
          </button>
        ))}
      </div>

      <button
        className="tw-filter-flecha tw-filter-flecha--der"
        type="button"
        aria-label="Ver más categorías"
        disabled={!puedeDer}
        onClick={() => desplazar(1)}
      >
        ›
      </button>
    </div>
  );
}

export default CarrilCategorias;
