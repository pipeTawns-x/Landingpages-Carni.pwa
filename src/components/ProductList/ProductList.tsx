import { ProductCard } from '@src/components/ProductCard/ProductCard';
import type { Product } from '@src/types/database';
import './styles.css';

export interface ProductListProps {
  /** The catalogue to render. Owned by the root component and passed down. */
  products: Product[];
}

/**
 * Renders the catalogue it receives through props.
 *
 * It holds no state of its own: the array arrives from the root component and
 * this component only decides how each entry looks.
 */
export function ProductList({ products }: ProductListProps): JSX.Element {
  if (products.length === 0) {
    return (
      <div className="tw-empty-state">
        <p>Por ahora no tenemos cortes publicados en esta categoría. Prueba con otra selección.</p>
      </div>
    );
  }

  return (
    <div className="product-list">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          // Every card is the same size. The old `index % 6 === 0 ? 'large'`
          // made one card in six twice as wide, and its row-mates grew empty
          // space to match the taller box.
          size="medium"
          isIAContent={Boolean(product.is_promoted)}
        />
      ))}
    </div>
  );
}
