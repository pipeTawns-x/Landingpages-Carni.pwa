import type { Product } from '@src/types/database';

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
  const image = product.image_url ?? 'img/products/res.png';

  return (
    <article className={`tw-card-shell tw-card-shell--${size} ${isIAContent ? 'tw-card-shell--ia' : ''}`}>
      <div className="tw-card-shell__image-wrap">
        <img className="tw-card-shell__image" src={image} alt={product.name} />
        <span className="tw-card-shell__rail" aria-hidden="true" />
        {badge ? <span className="tw-card-shell__badge">{badge}</span> : null}
      </div>
      <div className="tw-card-shell__body">
        <div className="tw-card-shell__meta">
          <p className="tw-card-shell__category">{resolveCategory(product)}</p>
          <p className="tw-card-shell__stock">Stock disponible: {product.stock}</p>
        </div>
        <h3 className="tw-card-shell__title">{product.name}</h3>
        <p className="tw-card-shell__description">{product.description}</p>
        <div className="tw-card-shell__footer">
          <div>
            <strong className="tw-card-shell__price">{formatPrice(product.price_per_kg)}</strong>
            <span className="tw-card-shell__unit">/ kg</span>
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
