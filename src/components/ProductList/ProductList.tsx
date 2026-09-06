import styled from 'styled-components';
import { ProductCard } from '@src/components/ProductCard/ProductCard';
import type { Product } from '@src/types/database';

export interface ProductListProps {
  /** The catalogue to render. Owned by the root component and passed down. */
  products: Product[];
  onAddToOrder: (product: Product) => void;
}

/**
 * Rejilla del catálogo (antes en ProductList/styles.css, 24 líneas).
 * La regla `.cart-is-open .product-list` — que cede una columna en desktop con
 * el carrito abierto — vive en GlobalStyles porque cruza el árbol: el estado se
 * anuncia en <body>, no en este componente.
 */
const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

/**
 * Renders the catalogue it receives through props.
 *
 * It holds no state of its own: the array arrives from the root component and
 * this component only decides how each entry looks.
 */
export function ProductList({ products, onAddToOrder }: ProductListProps): JSX.Element {
  if (products.length === 0) {
    return (
      <div className="tw-empty-state">
        <p>Por ahora no tenemos cortes publicados en esta categoría. Prueba con otra selección.</p>
      </div>
    );
  }

  return (
    <Grid className="product-list">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          // Every card is the same size. The old `index % 6 === 0 ? 'large'`
          // made one card in six twice as wide, and its row-mates grew empty
          // space to match the taller box.
          size="medium"
          onAddToCart={() => onAddToOrder(product)}
          isIAContent={Boolean(product.is_promoted)}
        />
      ))}
    </Grid>
  );
}
