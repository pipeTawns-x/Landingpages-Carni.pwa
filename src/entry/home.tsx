import { Testimonios } from '@src/components/Testimonios/Testimonios';
import { montarCarrito } from '@src/components/CartPanel/montar';
import { montarLupa } from '@src/components/Lupa/montar';
import { useEffect, useRef, useState } from 'react';
import { mountReactNode, fetchCategories } from './shared';
import type { Category } from './shared';
import { CategoryCard } from '@src/components/CategoryCard/CategoryCard';
import { Showcase } from '@src/components/Showcase/Showcase';

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

    // Nothing to observe yet. The categories arrive from Supabase after the
    // first paint, so the first run of this effect finds an empty grid. Bailing
    // out here — instead of building an observer over nothing — is what lets
    // the second run, the one that has the nine tiles, do the real work.
    if (tiles.length === 0) {
      return;
    }

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
  // Depende de `categories.length`, no de `[]`.
  //
  // Con `[]` el efecto corría una sola vez, al montar, cuando la rejilla todavía
  // estaba vacía porque las categorías venían en camino desde Supabase. El
  // observer no vigilaba nada, el failsafe recorría una lista vacía, y cuando
  // las nueve tarjetas se pintaban ya nadie les ponía `is-visible`: se quedaban
  // en `opacity: 0` para siempre. El bento no desapareció, se volvió invisible.
  //
  // Con `categories.length` el efecto corre dos veces —vacío y luego con las
  // nueve— y la segunda vez sí hay algo que observar. No vuelve el parpadeo
  // porque la limpieza desconecta el observer anterior, y porque `length` solo
  // cambia cuando llegan los datos, no en cada render.
}, [categories.length]);

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

/**
 * El estado del encabezado: transparente sobre el video, NEGRO sólido en
 * cuanto el video sale, y pegado arriba todo el rato.
 *
 * POR QUÉ VIVE AQUÍ, AL NIVEL DEL MÓDULO, Y NO EN UN COMPONENTE
 * -------------------------------------------------------------
 * Se intentó de tres formas antes y ninguna llegó a cambiar la clase:
 *
 * 1. `js/modules/ui/header-scroll.js`, script suelto. Peleaba con
 *    `js/modules/ui/header.js`, que escribía sus propias clases sobre el
 *    mismo elemento —incluida una que lo sacaba de pantalla con
 *    `translateY(-100%)`— y además Vite servía copias viejas del archivo.
 * 2. Un componente React montado en un `<div hidden>`. El efecto SÍ corría —se
 *    comprobó viendo su centinela en el DOM— pero un recargado en caliente lo
 *    desmontaba, la limpieza retiraba el centinela y no volvía a montarse. Un
 *    elemento que vive fuera de React no debería depender de su ciclo de vida.
 * 3. Con `addEventListener('scroll')` en vez de observer: mismo resultado.
 *
 * Aquí no hay ciclo de vida que se pierda: este módulo se ejecuta una vez y ya
 * está probado que llega hasta el final —monta el bento y la vitrina—.
 *
 * El disparador es un IntersectionObserver sobre un centinela de 1px al pie
 * del video, no un `scroll`: el navegador avisa del cruce una vez, en lugar de
 * preguntar "¿dónde estoy?" en cada fotograma. Es el mismo patrón que ya usa
 * el revelado del bento, unas líneas más arriba.
 */
function gobernarEncabezado(): void {
  const header = document.getElementById('mainHeader');
  if (!header) {
    return;
  }

  const solido = (si: boolean): void => {
    header.classList.toggle('main-header--solid', si);
    // `--over-media` es lo que lo mantiene transparente. Se quita en cuanto
    // deja de haber medio detrás, o las dos reglas pelean.
    header.classList.toggle('main-header--over-media', !si);
  };

  const hero = document.querySelector<HTMLElement>('.home-hero-video');

  // Sin video detrás —productos, panel, cualquier otra página— la barra nace
  // sólida y no hay nada que observar.
  if (!hero || typeof IntersectionObserver === 'undefined') {
    solido(true);
    return;
  }

  // EL CENTINELA VA FUERA DEL HERO, COMO HERMANO. No dentro.
  //
  // Primero se puso dentro, absoluto en `bottom: 0`. El hero lleva
  // `overflow: hidden`, así que un elemento de 1px pegado al borde inferior
  // queda recortado a área CERO — y a un elemento de área cero el
  // IntersectionObserver no le reporta nada. Ni siquiera la llamada inicial,
  // que normalmente siempre llega. Por eso la clase no cambiaba nunca aunque
  // el código sí se ejecutara: el centinela estaba en el DOM y era invisible
  // para el observador.
  //
  // Como hermano, justo debajo del hero, está en flujo normal y sin recortar.
  const centinela = document.createElement('div');
  centinela.dataset.rol = 'centinela-encabezado';
  centinela.setAttribute('aria-hidden', 'true');
  centinela.style.height = '1px';
  centinela.style.width = '100%';
  centinela.style.pointerEvents = 'none';
  hero.insertAdjacentElement('afterend', centinela);

  const observador = new IntersectionObserver(
    ([entrada]) => {
      // Centinela a la vista = el video sigue detrás de la barra.
      solido(!entrada.isIntersecting);
    },
    {
      // El margen negativo arriba equivale al alto de la barra: el cambio
      // ocurre cuando el centinela pasa por debajo del encabezado, no cuando
      // toca el borde de la pantalla.
      rootMargin: '-56px 0px 0px 0px',
      threshold: 0
    }
  );

  observador.observe(centinela);

  // SEGUNDO DISPARADOR, a propósito redundante.
  //
  // El observer es el mecanismo bueno y basta por sí solo. Pero este estado es
  // de los que, si falla, dejan texto blanco sobre fondo claro —ilegible— y no
  // se pudo confirmar el cruce en el navegador de pruebas, que no scrollea por
  // guion. Un listener de scroll cuesta prácticamente nada y quita el punto
  // único de fallo: si cualquiera de los dos avisa, el estado se corrige.
  //
  // Los dos escriben lo mismo, así que competir no les hace daño.
  let encolado = false;
  const alScrollear = (): void => {
    if (encolado) {
      return;
    }
    encolado = true;
    window.requestAnimationFrame(() => {
      encolado = false;
      solido(centinela.getBoundingClientRect().top <= 56);
    });
  };

  window.addEventListener('scroll', alScrollear, { passive: true });
  window.addEventListener('resize', alScrollear, { passive: true });
  alScrollear();
}

gobernarEncabezado();

mountReactNode('#categoriesReactRoot', <CategoryBento />);
mountReactNode('#showcaseReactRoot', <Showcase />);
mountReactNode('#resenasReactRoot', <Testimonios />);

// The magnifier behaves the same on all three pages. Without this, tapping it
// here still threw the customer out to the catalogue before they typed a letter.
montarLupa();
montarCarrito();

// El arranque del carrusel vive ahora en el propio componente Showcase:
// atarlo a un `setTimeout` desde aquí era una carrera contra la petición de
// productos, y la perdía. Ver src/components/Showcase/Showcase.tsx.

