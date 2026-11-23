import { createRoot } from 'react-dom/client';
import { Testimonios } from '@src/components/Testimonios/Testimonios';
import { governHeader } from './header-state';

/**
 * What the Django landing page (backend/ventas/templates/ventas/index.html) needs from the
 * browser. Django already painted the page: the header, the categories, the showcase, the about
 * and contact sections and the footer are plain HTML. This wires the behaviour on top of them.
 *
 * Nothing here talks to Supabase. The catalogue comes from Django, and the cart, the account and
 * the search are links and a form to Django's own pages, so there is no second copy of the cart in
 * localStorage to drift from the real one.
 */

type CarouselInstance = { dispose: () => void };
type BootstrapGlobal = {
  Carousel: {
    new (element: Element, config: Record<string, unknown>): CarouselInstance;
    getInstance: (element: Element) => CarouselInstance | null;
  };
};

const reducedMotion = (): MediaQueryList => window.matchMedia('(prefers-reduced-motion: reduce)');

/** The reviews are an island, as in index.html: their texts live in src/data/resenas.ts. */
function mountReviews(): void {
  const host = document.getElementById('resenasReactRoot');
  if (host) {
    createRoot(host).render(<Testimonios />);
  }
}

/** The magnifier opens a dialog whose form sends the visitor to the filtered catalogue. */
function wireSearch(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-store-search]');
  document.getElementById('searchBtn')?.addEventListener('click', () => dialog?.showModal());
  document.querySelector('[data-search-close]')?.addEventListener('click', () => dialog?.close());
}

/**
 * The drawer opens and closes in js/modules/ui/header.js, which flips `aria-hidden`. This keeps
 * the rest of the page out of reach while it is open: `inert` outside, focus trapped inside, and
 * focus returned to the button that opened it.
 */
function containDrawerFocus(): void {
  const drawer = document.getElementById('mobileDrawer');
  const toggle = document.getElementById('menuToggle');
  if (!drawer) {
    return;
  }

  drawer.inert = true;
  new MutationObserver(() => {
    const open = drawer.getAttribute('aria-hidden') === 'false';
    toggle?.setAttribute('aria-expanded', String(open));
    drawer.inert = !open;
    if (open) {
      drawer.querySelector<HTMLElement>('button, a[href]')?.focus();
    } else if (drawer.contains(document.activeElement)) {
      toggle?.focus();
    }
  }).observe(drawer, { attributes: true, attributeFilter: ['aria-hidden'] });

  drawer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }
    const controls = drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}

/**
 * Bootstrap rotates the showcase every five seconds, so the visitor needs a control to stop it
 * (WCAG 2.2.2), and someone who asked for less motion gets it still from the start. The carousel
 * is built again with `ride: false` when it is paused: pausing an instance is not enough, because
 * Bootstrap resumes a hover-paused carousel when the pointer leaves.
 */
function controlCarousel(): void {
  const carousel = document.getElementById('showcaseCarousel');
  const button = document.querySelector<HTMLButtonElement>('[data-showcase-pause]');
  const bootstrap = (window as unknown as { bootstrap?: BootstrapGlobal }).bootstrap;
  if (!carousel || !bootstrap) {
    return;
  }

  const preference = reducedMotion();
  let chosen: boolean | null = null; // true: the visitor paused it; null: follow the preference
  const paused = (): boolean => chosen ?? preference.matches;

  const apply = (): void => {
    bootstrap.Carousel.getInstance(carousel)?.dispose();
    new bootstrap.Carousel(carousel, {
      ride: paused() ? false : 'carousel',
      interval: 5000,
      pause: 'hover',
      touch: true
    });
    if (button) {
      button.textContent = paused() ? 'Reanudar carrusel' : 'Pausar carrusel';
    }
  };

  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      chosen = !paused();
      apply();
    });
  }
  preference.addEventListener('change', () => {
    chosen = null;
    apply();
  });
  apply();
}

export function initServerStore(): void {
  void import('../../js/modules/ui/header.js');
  void import('../../js/modules/ui/hero-video.js');
  void import('../../js/modules/chatbot.js');
  mountReviews();
  wireSearch();
  containDrawerFocus();
  governHeader();
  controlCarousel();
}
