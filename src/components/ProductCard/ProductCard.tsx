import type { Product } from '@src/types/database';
import './styles.css';

export interface ProductCardProps {
  product: Product;
  size: 'small' | 'medium' | 'large';
  onAddToCart: (id: number, qty: number) => void;
  isIAContent?: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(price);
}

// Last-resort pool, only reached when a product carries no image_url at all.
// The seed now points every product at a file that exists, so this should stay
// unused; indexing by id keeps the choice stable and avoids handing the whole
// catalogue one shared photo the way the old res.png fallback did.
const CUT_IMAGES = [
  '/img/products/tomahawk.webp',
  '/img/products/rib-eye.webp',
  '/img/products/porterhouse.webp',
  '/img/products/filet_mignon.webp',
  '/img/products/ney_york_strip.webp',
  '/img/products/top_sirloin.webp',
  '/img/products/skirt_steak.webp',
  '/img/products/flak_steak.webp',
  '/img/products/bravette_steak.webp'
] as const;

function resolveImage(product: Product): string {
  if (product.image_url) return product.image_url;
  const index = Math.abs(Number(product.id) || 0) % CUT_IMAGES.length;
  return CUT_IMAGES[index];
}

// Every WebP in img/products/ was converted from a PNG that is still on disk,
// so the fallback is a straight extension swap. Browsers without WebP support
// pick up the <img> instead of the <source>.
function pngFallback(webpPath: string): string {
  return webpPath.replace(/\.webp$/i, '.png');
}

function categorySlug(product: Product): string {
  if (Array.isArray(product.categories)) {
    return product.categories[0]?.slug ?? '';
  }

  return product.categories?.slug ?? '';
}

/**
 * Not everything in the catalogue is sold by weight.
 *
 * Merchandising is priced per piece and the bundles under Ofertas Especiales
 * are priced per package. The products table only has price_per_kg, so the price
 * lives there and the unit is derived from the category instead — showing
 * "Gorra con Logo $250 / kg" would simply be wrong.
 */
function priceUnit(product: Product): string {
  const slug = categorySlug(product);

  if (slug === 'merch') {
    return '/ pieza';
  }

  if (slug === 'ofertas' && !product.price_per_lb) {
    return '/ paquete';
  }

  return '/ kg';
}

function resolveCategory(product: Product): string {
  if (Array.isArray(product.categories) && product.categories[0]?.name) {
    return product.categories[0].name;
  }

  if (!Array.isArray(product.categories) && product.categories?.name) {
    return product.categories.name;
  }

  return 'Corte especial';
}

export function ProductCard({ product, size, onAddToCart, isIAContent = false }: ProductCardProps): JSX.Element {
  const badge = product.badge ?? (product.is_promoted ? 'Oferta Especial' : undefined);
  const image = resolveImage(product);
  const inStock = Number(product.stock) > 0;

  return (
    // `producto-card` and `data-categoria` are the hooks js/modules/ui/search.js
    // filters on. They used to live on the vanilla cards; those are gone, so the
    // React card carries them or the search box stops filtering. No CSS is bound
    // to these class names — they exist purely so the search keeps working.
    <article
      className={`tw-card-shell tw-card-shell--${size} ${isIAContent ? 'tw-card-shell--ia' : ''} producto-card`}
      data-categoria={categorySlug(product)}
    >
      <div className="tw-card-shell__image-wrap">
        <picture>
          <source srcSet={image} type="image/webp" />
          <img
            className="tw-card-shell__image"
            src={pngFallback(image)}
            alt={product.name}
            loading="lazy"
            // Explicit dimensions give the image an intrinsic ratio before it
            // downloads, so a lazily loaded photo cannot resize its card as it
            // arrives. CSS still drives the rendered size; these only fix the
            // 4:3 box the layout reserves.
            width={800}
            height={600}
          />
        </picture>
        <span
          className={`tw-card-shell__stock-badge ${inStock ? '' : 'tw-card-shell__stock-badge--out'}`}
        >
          {inStock ? `${product.stock} en stock` : 'Sin stock'}
        </span>
        {badge ? <span className="tw-card-shell__badge">{badge}</span> : null}
      </div>
      <div className="tw-card-shell__body">
        <div className="tw-card-shell__meta">
          <p className="tw-card-shell__category">{resolveCategory(product)}</p>
        </div>
        <h3 className="tw-card-shell__title producto-card__title">{product.name}</h3>
        <p className="tw-card-shell__description producto-card__description">{product.description}</p>
        <div className="tw-card-shell__footer">
          <div>
            <strong className="tw-card-shell__price">{formatPrice(product.price_per_kg)}</strong>
            <span className="tw-card-shell__unit">{priceUnit(product)}</span>
            {product.price_per_lb ? (
              <span className="tw-card-shell__price-alt">
                {formatPrice(product.price_per_lb)} / lb
              </span>
            ) : null}
          </div>
          <button
            className="tw-button tw-button--primary"
            type="button"
            onClick={() => onAddToCart(product.id, 1)}
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
