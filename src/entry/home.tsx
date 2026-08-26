import { useEffect, useRef, useState } from 'react';
import { mountReactNode, fetchCategories } from './shared';
import type { Category } from './shared';
import { CategoryCard } from '@src/components/CategoryCard/CategoryCard';

/**
 * The nine category tiles on the landing page.
 *
 * These used to be written by hand in index.html, and had drifted: the markup
 * said "Selección Premium", "Merchandising" and "Ofertas Especiales" while the
 * database said "Cortes Especiales", "Merch" and "Ofertas". Nothing kept them in
 * step because nothing connected them.
 *
 * BentoGrid is deliberately not used here. It is a generic wrapper that lays out
 * `ReactNode[]` on its own column rules, and this grid is not generic: each tile
 * has a hand-placed `grid-area` in `css/pages/_bento-main.scss`, keyed by
 * `category-card-N`. Wrapping it would fight that layout. The markup below is
 * the same `.bento-categories-grid` the CSS already targets.
 */
function CategoryBento(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchCategories().then(({ categories: items }) => setCategories(items));
  }, []);

  /**
   * Reveals the tiles as they scroll into view.
   *
   * One observer for the nine tiles rather than one per card: the callback
   * receives every entry that crossed the threshold, so a single instance does
   * the same work with a ninth of the bookkeeping.
   *
   * `unobserve` on the way out is what makes it fire once. Re-animating a tile
   * every time it scrolls past is the kind of motion that reads as broken
   * rather than polished.
   *
   * Nothing here decides whether motion is appropriate — that belongs to the
   * stylesheet, which honours `prefers-reduced-motion`. This only marks what
   * has been seen.
   */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }

    const tiles = Array.from(grid.children);

    // Without IntersectionObserver the tiles simply start visible. A browser
    // that cannot animate them should still be able to read them.
    if (typeof IntersectionObserver === 'undefined') {
      tiles.forEach((tile) => tile.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // `isIntersecting` alone leaves a tile invisible forever if the page
          // jumped straight past it — an anchor link, a restored scroll
          // position, a browser find. That tile never intersects, so the
          // callback never fires again and it stays at opacity 0.
          //
          // The first callback does run for every observed element, whatever
          // its position, so a negative `bottom` is the signal that the tile is
          // already behind the reader. Reveal it and move on.
          const alreadyPassed = entry.boundingClientRect.bottom < 0;

          if (entry.isIntersecting || alreadyPassed) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      // 12% of the tile is enough to commit. Waiting for half of a tall bento
      // tile means the reveal fires after the reader is already looking at it.
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    tiles.forEach((tile) => observer.observe(tile));

    /**
     * Failsafe: reveal everything after a second and a half regardless.
     *
     * The tiles start at `opacity: 0` and only JavaScript brings them back, so
     * anything that keeps the observer from firing hides the catalogue's front
     * door permanently. That is not hypothetical — `IntersectionObserver` does
     * not fire while `document.hidden` is true, which is exactly what happens
     * when the page is opened in a background tab or restored from a session.
     * The reader switches to the tab and finds nine empty rectangles.
     *
     * The animation is decoration. The categories are the page. Decoration
     * never gets to decide whether the content exists.
     */
    const failsafe = window.setTimeout(() => {
      tiles.forEach((tile) => tile.classList.add('is-visible'));
      observer.disconnect();
    }, 1500);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, [categories]);

  return (
    <div className="bento-categories-grid" ref={gridRef}>
      {categories.map((category, index) => (
        <CategoryCard
          key={category.slug}
          category={category}
          // `order` decides the tile's slot. It falls back to the array
          // position so a row with a null order still lands somewhere real
          // instead of collapsing onto `category-card-undefined`.
          position={category.order ?? index + 1}
          // Staggers the reveal. The delay is read by the stylesheet, so a
          // reader who asked for reduced motion gets no delay and no fade —
          // the value is simply ignored.
          revealIndex={index}
        />
      ))}
    </div>
  );
}

mountReactNode('#categoriesReactRoot', <CategoryBento />);
