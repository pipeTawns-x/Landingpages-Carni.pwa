import { useEffect, useState } from 'react';
import { fetchProducts, categorySlugOf, assetUrl } from '@src/entry/shared';
import type { Product } from '@src/types/database';

/**
 * The wide section between the category bento and "Sobre Nosotros".
 *
 * Louis Vuitton runs a full-bleed carousel after the hero and a row of product
 * cards under it. This is the same shape with the butcher shop's own catalogue.
 *
 * WHY REAL PRODUCTS AND NOT THE `promotions` TABLE
 * ------------------------------------------------
 * `docs/PROMPT_FRONTEND_LV.md` points at `public.promotions` for these cards.
 * Checked on 2026-08-31: that table holds **zero rows**, and its columns are
 * `code`, `discount_percent`, `min_purchase`, `valid_from`, `valid_until`,
 * `is_active` — it is a **discount-coupon** table for checkout, not a set of
 * promotional cards with a picture and a headline. It cannot fill this section
 * without inventing both the copy and the offer.
 *
 * So the section reads `public.products`, which is real: 53 rows with name,
 * description, price and image. Nothing here fabricates a discount.
 */

/** How many cards sit under the carousel. Four is the layout the brief asks for. */
const CARD_COUNT = 4;

/**
 * How many slides the carousel holds.
 *
 * Was 3, which left the rotation feeling thin — you saw the whole thing in
 * eighteen seconds and it started repeating. Six is what the catalogue can
 * actually fill with distinct, photographed cuts sold by weight.
 */
const SLIDE_COUNT = 6;

/**
 * The categories this section is allowed to draw from.
 *
 * NOT a style choice — a correctness one. The cards print the price followed
 * by "/ kg", and only these four categories are actually sold by weight.
 * Sorting the whole catalogue by price put a **knife at "$650 / kg"** and a
 * cooler at "$890 / kg" into the row, because `merch` rows carry a unit price
 * in the same column. `ofertas` is excluded for the same reason: its rows are
 * whole packages, priced "por paquete, no por kilo" in their own description.
 *
 * Caught on 2026-08-31 by reading what actually rendered.
 */
const SELLABLE_BY_WEIGHT = new Set([
  'cortes-especiales',
  'carnes-rojas',
  'cerdo',
  'pollo'
]);

/**
 * Sorts by price, descending, and keeps the ones that have a picture.
 *
 * A showcase whose point is to look expensive should lead with the cuts that
 * actually are. A card with no image would render as a grey box next to three
 * photographs, which reads as a bug rather than as a product.
 */
function showcaseCandidates(products: Product[]): Product[] {
  return products
    .filter(
      (p) =>
        Boolean(p.image_url) &&
        p.is_active !== false &&
        SELLABLE_BY_WEIGHT.has(categorySlugOf(p))
    )
    .sort((a, b) => Number(b.price_per_kg) - Number(a.price_per_kg));
}

/**
 * Every `.webp` in `img/products/` ships a `.png` sibling, so the fallback is a
 * straight extension swap — same approach as CategoryCard.
 */
function pngFallback(path: string): string {
  return path.replace(/\.webp$/i, '.png');
}

function formatPrice(value: number | string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function Showcase(): JSX.Element | null {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    void fetchProducts().then(({ products: items }) => setProducts(items));
  }, []);

  const candidates = showcaseCandidates(products);
  const slideCount = Math.min(candidates.length, SLIDE_COUNT);

  /**
   * Whether the reader asked for less motion.
   *
   * Read into state rather than checked inline because it drives what gets
   * RENDERED —`data-bs-ride` is present or absent— and because the preference
   * can change while the page is open: someone toggling it in system settings
   * should see the carousel stop, not have to reload.
   */
  const [quietMotion, setQuietMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (): void => setQuietMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /**
   * Initialises the Bootstrap carousel.
   *
   * WHY AN EFFECT IS NEEDED EVEN THOUGH `data-bs-ride` IS DECLARED
   * --------------------------------------------------------------
   * Bootstrap wires up `data-bs-ride="carousel"` elements once, on
   * `DOMContentLoaded`. This carousel does not exist yet at that moment — it
   * renders after the product fetch resolves — so the data API never sees it
   * and the attribute alone does nothing. Verified on 2026-08-31:
   * `Carousel.getInstance()` returned null and the slides only moved on click.
   *
   * `new Carousel(el)` with NO options object is deliberate: Bootstrap then
   * reads `data-bs-interval`, `data-bs-ride` and `data-bs-pause` off the
   * element itself, so the configuration stays declarative in the markup where
   * it can be read, instead of being duplicated here and drifting.
   *
   * An earlier version lived in `home.tsx` behind `setTimeout(..., 300)`. That
   * was a race against the same fetch, and it lost.
   */
  useEffect(() => {
    if (slideCount === 0 || quietMotion) {
      return;
    }

    const el = document.querySelector('#showcaseCarousel');
    if (!el) {
      return;
    }

    // Bootstrap arrives on the window from a script tag, not through the
    // bundle, so there is nothing to import.
    const bs = (window as unknown as {
      bootstrap?: {
        Carousel?: {
          new (e: Element): { dispose(): void };
          getInstance(e: Element): { dispose(): void } | null;
        };
      };
    }).bootstrap;

    if (!bs?.Carousel) {
      console.warn('[carni] Bootstrap no está cargado: el carrusel queda manual.');
      return;
    }

    // A previous instance can survive a hot reload; disposing first avoids two
    // timers driving the same element.
    bs.Carousel.getInstance(el)?.dispose();
    const carousel = new bs.Carousel(el);

    return () => carousel.dispose();
  }, [slideCount, quietMotion]);

  // Nothing to show yet. Rendering an empty carousel shell is worse than
  // rendering nothing: it reserves height and then jumps when the data lands.
  if (candidates.length === 0) {
    return null;
  }

  const slides = candidates.slice(0, SLIDE_COUNT);
  // The cards start after the slides so the same cut is not both the hero of a
  // slide and a card directly beneath it.
  const cards = candidates.slice(SLIDE_COUNT, SLIDE_COUNT + CARD_COUNT);

  return (
    <section className="showcase" aria-labelledby="showcase-title">
      {/*
        Bootstrap 5.3.7 is already loaded, so this uses its carousel rather
        than a hand-rolled one.
      */}
      {/*
        `data-bs-ride` is ABSENT when the reader asked for less motion. Not
        disabled afterwards — absent. Declaring it and then pausing leaves a
        window in which the carousel already moved, which is the one thing the
        preference exists to prevent.

        `data-bs-pause="hover"` is Bootstrap's default, written out because the
        brief asks for it explicitly and a default that is not visible in the
        markup is a default someone removes by accident.
      */}
      <div
        id="showcaseCarousel"
        className="carousel slide showcase__carousel"
        data-bs-ride={quietMotion ? undefined : 'carousel'}
        data-bs-interval="5000"
        data-bs-pause="hover"
        data-bs-touch="true"
      >
        <div className="carousel-indicators">
          {slides.map((product, index) => (
            <button
              key={product.id}
              type="button"
              data-bs-target="#showcaseCarousel"
              data-bs-slide-to={index}
              className={index === 0 ? 'active' : undefined}
              aria-current={index === 0 ? 'true' : undefined}
              aria-label={`Ir a ${product.name}`}
            />
          ))}
        </div>

        <div className="carousel-inner">
          {slides.map((product, index) => (
            <div
              className={`carousel-item${index === 0 ? ' active' : ''}`}
              key={product.id}
            >
              <picture>
                <source srcSet={assetUrl(product.image_url ?? '')} type="image/webp" />
                <img
                  src={assetUrl(pngFallback(product.image_url ?? ''))}
                  className="showcase__slide-img"
                  alt={product.name}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </picture>
              <div className="carousel-caption showcase__caption">
                <h3 className="showcase__slide-title">{product.name}</h3>
                <p className="showcase__slide-desc">{product.description}</p>
                <a className="btn showcase__slide-cta" href="products.html">
                  Ver el catálogo
                </a>
              </div>
            </div>
          ))}
        </div>

        {/*
          The controls carry a real `aria-label` in Spanish instead of
          Bootstrap's default "Previous"/"Next" visually-hidden text, which
          would be read out in English on a page declared `lang="es"`.
        */}
        <button
          className="carousel-control-prev showcase__control"
          type="button"
          data-bs-target="#showcaseCarousel"
          data-bs-slide="prev"
          aria-label="Corte anterior"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true" />
        </button>
        <button
          className="carousel-control-next showcase__control"
          type="button"
          data-bs-target="#showcaseCarousel"
          data-bs-slide="next"
          aria-label="Corte siguiente"
        >
          <span className="carousel-control-next-icon" aria-hidden="true" />
        </button>
      </div>

      {/* El título va DEBAJO del carrusel y ENCIMA de las fichas: el
          carrusel entra a sangre y abre la sección, y el título funciona como
          entrada a la fila de producto en vez de como rótulo de la imagen.
          Es el orden que pidió Eduardo el 2026-08-31 y es el de la referencia:
          Louis Vuitton abre con la imagen y titula la fila, no la foto. */}
      <div className="showcase__head">
        <p className="showcase__eyebrow">De la vitrina</p>
        <h2 className="showcase__title" id="showcase-title">
          Lo que se lleva la gente
        </h2>
      </div>

      <ul className="showcase__cards">
        {cards.map((product) => (
          <li className="showcase-card" key={product.id}>
            <a className="showcase-card__link" href="products.html">
              <div className="showcase-card__frame">
                <picture>
                  <source srcSet={assetUrl(product.image_url ?? '')} type="image/webp" />
                  <img
                    src={assetUrl(pngFallback(product.image_url ?? ''))}
                    className="showcase-card__img"
                    alt={product.name}
                    loading="lazy"
                  />
                </picture>
              </div>
              <div className="showcase-card__body">
                <h3 className="showcase-card__name">{product.name}</h3>
                <p className="showcase-card__price">
                  {formatPrice(product.price_per_kg)}
                  <span className="showcase-card__unit"> / kg</span>
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
