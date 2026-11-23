import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * The scroll choreography of the Django landing, rescued from the parallel store (Engram #3328):
 *
 * - Titles rise word by word as they enter.
 * - The kinetic strip: its two lines slide in opposite directions with the scroll.
 * - Bento: the tiles open with a wipe from below, in batches; each photo drifts inside its tile.
 * - Cards and questions rise into place as they enter.
 *
 * The hero is not here: its frame opens with a CSS animation (store-motion.css) so it starts on
 * the first paint and the film never jumps. Nothing here touches the film (Eduardo: "sin zoom").
 *
 * The page is complete and still without this file. Everything below runs only while
 * `prefers-reduced-motion: no-preference` matches; if the preference flips to `reduce`, GSAP
 * reverts every tween and every inline style, and the page is back to its static state. A failed
 * import (see src/entry/home.tsx) leaves that same static page.
 */

const EASE = 'expo.out';

/** Cards and questions that rise in. Opacity and a short move only: they stay focusable. */
const RISE = '[data-rise]';
const TITLES = 'main h2';
/** React owns the reviews section: splitting its title would fight its reconciliation. */
const REACT_ROOT = '#resenasReactRoot';

function all<T extends Element>(scope: ParentNode, selector: string): T[] {
  return Array.from(scope.querySelectorAll<T>(selector));
}

/** Titles rise word by word. Hidden only by this tween, so no script means a readable title. */
function riseTitles(scope: HTMLElement): void {
  all<HTMLElement>(scope, TITLES)
    .filter((title) => !title.closest(REACT_ROOT))
    .forEach((title) => {
      const split = SplitText.create(title, { type: 'words' });
      gsap.from(split.words, {
        yPercent: 60,
        opacity: 0,
        duration: 0.9,
        ease: EASE,
        stagger: 0.07,
        scrollTrigger: { trigger: title, start: 'top 90%', once: true }
      });
    });
}

/** The two lines of the strip slide sideways, one each way, tied to the scroll. */
function slideStrip(scope: HTMLElement): void {
  all<HTMLElement>(scope, '[data-kinetic-line]').forEach((line) => {
    const direction = Number(line.dataset.kineticLine) || 1;
    gsap.fromTo(
      line,
      { xPercent: direction > 0 ? 0 : -30 },
      {
        xPercent: direction > 0 ? -30 : 0,
        ease: 'none',
        scrollTrigger: { trigger: line, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      }
    );
  });
}

/**
 * The tiles wipe open from below, in batches as they enter. The clip-path is cleared when a tile
 * is open: a clip-path also clips the focus outline, so it must not outlive the wipe. The photos
 * drift through `--drift`, which the stylesheet turns into a transform next to the hover zoom.
 */
function openBento(scope: HTMLElement): void {
  const tiles = all<HTMLElement>(scope, '[data-bento-tile]');
  if (!tiles.length) {
    return;
  }

  gsap.set(tiles, { clipPath: 'inset(100% 0% 0% 0% round 16px)' });
  ScrollTrigger.batch(tiles, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        clipPath: 'inset(0% 0% 0% 0% round 16px)',
        duration: 1.1,
        ease: EASE,
        stagger: 0.09,
        clearProps: 'clipPath'
      })
  });

  tiles.forEach((tile) => {
    gsap.fromTo(
      tile,
      { '--drift': '-4%' },
      {
        '--drift': '4%',
        ease: 'none',
        scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    );
  });
}

/** Cards and questions rise as they enter, a batch at a time. */
function riseCards(scope: HTMLElement): void {
  const cards = all<HTMLElement>(scope, RISE);
  if (!cards.length) {
    return;
  }

  gsap.set(cards, { y: 48, opacity: 0 });
  ScrollTrigger.batch(cards, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: EASE,
        stagger: 0.1,
        overwrite: true,
        clearProps: 'transform,opacity'
      })
  });
}

/** Fonts and lazy photos change the layout after load: measure again once they are in. */
function refreshWhenSettled(): () => void {
  const refresh = (): void => ScrollTrigger.refresh();
  void document.fonts?.ready.then(refresh);
  if (document.readyState === 'complete') {
    return () => undefined;
  }
  window.addEventListener('load', refresh);
  return () => window.removeEventListener('load', refresh);
}

/** Returns the function that undoes everything, for `pagehide` and for tests. */
export function initLandingMotion(scope: HTMLElement = document.body): () => void {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const media = gsap.matchMedia();

  media.add('(prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('gsap');
    riseTitles(scope);
    slideStrip(scope);
    openBento(scope);
    riseCards(scope);
    const stopRefreshing = refreshWhenSettled();

    // matchMedia reverts the tweens, the triggers and the split titles by itself; this undoes
    // what it does not know about.
    return () => {
      stopRefreshing();
      document.documentElement.classList.remove('gsap');
    };
  });

  return () => media.revert();
}
