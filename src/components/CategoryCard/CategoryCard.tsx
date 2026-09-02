import { assetUrl } from '@src/entry/shared';
import type { Category } from '@src/entry/shared';
import './styles.css';

export interface CategoryCardProps {
  category: Category;
  /**
   * Which tile this is in the bento layout, 1 through 9. Drives
   * `category-card-N`, whose grid-area is defined in
   * `css/pages/_bento-main.scss`. Comes from the `order` column, not from the
   * array index, so reordering in the database moves the tile.
   */
  position: number;
  /**
   * Position in the reveal sequence, 0-based. Becomes the `--reveal-delay`
   * custom property so the tiles cascade instead of all landing at once.
   * The stylesheet ignores it entirely under `prefers-reduced-motion`.
   */
  revealIndex?: number;
}

/**
 * Copy the database does not carry.
 *
 * `public.categories` holds id, name, slug, image_url, is_active and order —
 * no description and no icon, because those are presentation and belong here.
 * The strings are the ones the hand-written tiles already showed, kept word for
 * word so the migration changes where the data comes from and nothing else.
 *
 * Keyed by slug, which is the stable identifier; renaming a category in the
 * dashboard changes `name` but not `slug`, so the copy survives the rename.
 */
const PRESENTATION: Record<string, { icon: string; description: string }> = {
  'carnes-rojas': { icon: 'bi-fire', description: 'Selección premium para parrilla y asados' },
  'cortes-especiales': { icon: 'bi-star-fill', description: 'Cortes exclusivos y gourmet' },
  cerdo: { icon: 'bi-egg-fried', description: 'Chuletas, costillas y carnitas' },
  pollo: { icon: 'bi-egg', description: 'Fresco del día, en todas sus piezas' },
  embutidos: { icon: 'bi-link', description: 'Salchichas, longaniza y tocino' },
  preparadas: { icon: 'bi-basket', description: 'Chorizos y carnes ya sazonadas' },
  ofertas: { icon: 'bi-tag-fill', description: 'Paquetes y precios de temporada' },
  merch: { icon: 'bi-bag-fill', description: 'Gorras, cuchillos y accesorios' },
  otros: { icon: 'bi-box-seam', description: 'Carbón, hielo y lo que falte para el asador' }
};

const FALLBACK_PRESENTATION = { icon: 'bi-shop', description: 'Productos de la carnicería' };

/**
 * Every `.webp` in `img/products/` has a `.png` sibling, so the fallback for
 * browsers without WebP support is a straight extension swap. The `<source>`
 * serves the modern format; the `<img>` is what everyone else gets.
 */
function pngFallback(path: string): string {
  return path.replace(/\.webp$/i, '.png');
}

export function CategoryCard({
  category,
  position,
  revealIndex = 0
}: CategoryCardProps): JSX.Element {
  const { icon, description } = PRESENTATION[category.slug] ?? FALLBACK_PRESENTATION;
  const image = category.image_url ?? '/img/products/otrosproductos.webp';

  return (
    // The `<article>` owns the grid slot and the hover target, and it never
    // moves. Everything that animates lives on `__lift` inside it. Lifting the
    // article itself slid it out from under the cursor, which dropped the
    // hover, which put it back, which caught the cursor again — the flicker
    // recorded as P-09. The pointer area has to stay still.
    <article
      className={`category-card category-card-${position}`}
      style={{ '--reveal-delay': `${revealIndex * 70}ms` } as React.CSSProperties}
    >
      <div className="category-card__lift">
        <picture>
          <source srcSet={assetUrl(image)} type="image/webp" />
          <img src={assetUrl(pngFallback(image))} alt={category.name} className="category-img" />
        </picture>
        <div className="category-body">
          <h3 className="category-title">
            <i className={`bi ${icon} me-2`} style={{ color: '#d22222' }} />
            {category.name}
          </h3>
          {/* Everything inside `category-reveal` is hidden at rest on
              pointer devices and expands on hover, so the photo — which is
              the product — is what the tile shows first. On touch screens
              there is no hover, so the stylesheet leaves it open. The
              collapse animates `grid-template-rows` from 0fr to 1fr, which
              is why this wrapper exists: it needs a single grid child. */}
          <div className="category-reveal">
            <div className="category-reveal__inner">
              <p className="category-desc">{description}</p>
              {/* products.tsx reads `?categoria=` and matches it against the
                  product's own slug. These now emit the real database slug, so
                  the alias map that translated the old hand-written values is
                  no longer in play. */}
              <a href={`products.html?categoria=${category.slug}`} className="btn btn-danger w-100">
                Ver Productos
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
