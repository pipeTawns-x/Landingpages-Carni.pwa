/**
 * The header over the landing: transparent over the film, solid as soon as the film leaves the
 * screen, and solid from the start on a page with no film. One passive listener, throttled to a
 * frame, reads where the bottom of the film is: the same answer in every browser, and no state
 * kept anywhere but the class.
 *
 * Both landings use it: the Django page (server-store.tsx) and the static index.html of the Vite
 * dev server (legacy-home.tsx).
 */

/** The bar is 56px tall: it turns solid when the film's bottom edge passes under it. */
const BAR_HEIGHT = 56;

export function governHeader(): void {
  const header = document.getElementById('mainHeader');
  if (!header) {
    return;
  }

  const setSolid = (solid: boolean): void => {
    header.classList.toggle('main-header--solid', solid);
    // `--over-media` is what keeps the bar transparent: the two classes never go together.
    header.classList.toggle('main-header--over-media', !solid);
  };

  const hero = document.querySelector('.home-hero-video');
  if (!hero) {
    setSolid(true);
    return;
  }

  let queued = false;
  const update = (): void => {
    queued = false;
    setSolid(hero.getBoundingClientRect().bottom <= BAR_HEIGHT);
  };
  const queue = (): void => {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  update();
}
