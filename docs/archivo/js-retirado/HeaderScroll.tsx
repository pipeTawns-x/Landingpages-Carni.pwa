import { useEffect } from 'react';

/**
 * Owns the landing header's state: transparent over the hero video, solid
 * black once the video is gone, pinned to the top the whole time.
 *
 * WHY AN INTERSECTION OBSERVER AND NOT A SCROLL LISTENER
 * ------------------------------------------------------
 * Three earlier attempts used `window.addEventListener('scroll', ...)` and
 * none of them ever flipped the class on this page. The logic was right —
 * calling the same function by hand from the console applied
 * `main-header--solid` correctly on the first try — but the listener never
 * ran. Rather than keep guessing why the event did or did not reach `window`
 * on a page with this much third-party script on it, the trigger moved to
 * something that does not depend on that event at all.
 *
 * An observer is also the better tool on its own merits: the browser reports
 * the crossing once instead of the page asking "where am I?" on every frame,
 * and it is already the pattern used for the bento reveal in `home.tsx`.
 *
 * The sentinel is a 1px element parked at the bottom of the hero. While any
 * part of it is on screen the video is still behind the bar; the moment it
 * leaves through the top, the bar goes solid.
 *
 * The component renders nothing. It exists for the effect.
 */
export function HeaderScroll(): null {
  useEffect(() => {
    const header = document.getElementById('mainHeader');
    if (!header) {
      return;
    }

    const hero = document.querySelector<HTMLElement>('.home-hero-video');

    function setSolid(solid: boolean): void {
      header!.classList.toggle('main-header--solid', solid);
      // `--over-media` is what keeps it transparent. It comes off the moment
      // there is no media behind it, or the two rules fight each other.
      header!.classList.toggle('main-header--over-media', !solid);
    }

    // No hero on this page — products, dashboard, anywhere else. The bar is
    // solid from the start and there is nothing to observe.
    if (!hero) {
      setSolid(true);
      return;
    }

    // The sentinel sits at the bottom of the hero, raised by the header's own
    // height so the switch lands exactly when the video's last row of pixels
    // passes under the bar rather than after it.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText =
      'position:absolute;left:0;right:0;bottom:var(--header-height,56px);height:1px;pointer-events:none;';
    hero.appendChild(sentinel);

    // Without IntersectionObserver the bar simply stays solid, which is the
    // legible state. A browser that cannot observe should not be left with
    // white text on an unknown background.
    if (typeof IntersectionObserver === 'undefined') {
      setSolid(true);
      return () => sentinel.remove();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Visible sentinel means the hero is still behind the bar.
        setSolid(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  return null;
}
