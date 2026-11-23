/**
 * The category rail of the catalogue (backend/ventas/templates/ventas/parciales/_catalogo.html).
 *
 * Django paints the chips as links. The arrows exist for a pointer on a wide screen (a finger
 * already drags, and a floating button would only cover a chip), so they stay `hidden` until
 * this script runs, and each is enabled only where there is more to see. The active chip is
 * brought into view: a deep link can land on a category halfway down the rail.
 */

/** Eight tenths of a screen, not a whole one: a chip stays visible, so the reader knows it moved. */
const STEP = 0.8;
/** Sub-pixel layout makes exact equality unreliable and would leave the right arrow lit at the end. */
const SLACK = 4;

export function wireCarril(): void {
  const rail = document.querySelector<HTMLElement>('[data-carril]');
  if (!rail) {
    return;
  }
  const arrows = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-carril-flecha]'));
  const arrowFor = (side: string): HTMLButtonElement | undefined =>
    arrows.find((arrow) => arrow.dataset.carrilFlecha === side);

  const measure = (): void => {
    const left = arrowFor('-1');
    const right = arrowFor('1');
    if (left) {
      left.disabled = rail.scrollLeft <= SLACK;
    }
    if (right) {
      right.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - SLACK;
    }
  };

  for (const arrow of arrows) {
    arrow.hidden = false;
    arrow.addEventListener('click', () => {
      const sign = Number(arrow.dataset.carrilFlecha) < 0 ? -1 : 1;
      rail.scrollBy({ left: sign * rail.clientWidth * STEP, behavior: 'smooth' });
    });
  }

  rail.addEventListener('scroll', measure, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  measure();

  const active = rail.querySelector<HTMLElement>('.tw-filter-chip--active');
  if (active) {
    // Measured against the rail with rectangles, not with `offsetLeft`: that one is relative to
    // the offset parent, which is the carril that also holds the arrows and not the rail itself.
    const chip = active.getBoundingClientRect();
    const left = chip.left - rail.getBoundingClientRect().left + rail.scrollLeft;
    const outLeft = left < rail.scrollLeft;
    const outRight = left + chip.width > rail.scrollLeft + rail.clientWidth;
    if (outLeft || outRight) {
      rail.scrollTo({ left: left - 16, behavior: 'smooth' });
    }
  }
}
