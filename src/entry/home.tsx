import { useEffect, useState } from 'react';
import { mountReactNode, fetchProducts, categoryLabel } from './shared';
import { ProductCard } from '@src/components/ProductCard';
import { BentoGrid } from '@src/components/BentoGrid';
import { useCart } from '@src/hooks/useCart';
import type { Product } from '@src/types/database';
import '@src/styles/redesign.css';

function HomeShowcase(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart, count, total } = useCart();

  useEffect(() => {
    void fetchProducts().then((items) => setProducts(items.slice(0, 6)));
  }, []);

  const featured = products[0];
  const secondary = products.slice(1, 3);

  return (
    <section className="tw-redesign-root tw-catalog-shell">
      <div className="tw-catalog-shell__header">
        <p className="tw-kicker">Edición 2026</p>
        <h2>Bienvenido a tu mesa de cortes, antojos y pedidos de confianza</h2>
        <p>
          Descubre los cortes favoritos de la casa, arma tu pedido sin complicarte y encuentra
          recomendaciones pensadas para el cliente de todos los dias, con sabor de carniceria real.
        </p>
        <div className="tw-summary-strip">
          <div className="tw-summary-pill"><strong>{products.length || '--'}</strong><span>Cortes recomendados hoy</span></div>
          <div className="tw-summary-pill"><strong>{count}</strong><span>Productos apartados</span></div>
          <div className="tw-summary-pill"><strong>${Math.round(total)}</strong><span>Total de tu seleccion</span></div>
          <div className="tw-summary-pill"><strong>24h</strong><span>Pedidos listos para entrega</span></div>
        </div>
      </div>

      {featured ? (
        <div className="tw-hero-grid">
          <div className="tw-hero-grid__primary">
            <article className="tw-highlight-card">
              <img src={featured.image_url ?? 'img/products/premium.png'} alt={featured.name} />
              <div className="tw-highlight-card__content">
                <p className="tw-kicker">Recomendacion del carnicero</p>
                <h2>{featured.name}</h2>
                <p>{featured.description}</p>
                <button type="button" className="tw-button tw-button--primary" onClick={() => addToCart(featured, 1)}>
                  Agregar al carrito
                </button>
              </div>
            </article>
          </div>
          <div className="tw-hero-grid__secondary">
            {secondary.map((product) => (
              <article className="tw-highlight-card" key={product.id}>
                <img src={product.image_url ?? 'img/products/res.png'} alt={product.name} />
                <div className="tw-highlight-card__content">
                  <p className="tw-kicker">{categoryLabel(product)}</p>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <BentoGrid
        gap="1.5rem"
        columns={{ mobile: 1, tablet: 2, desktop: 3 }}
        items={products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={{ ...product, badge: index === 0 ? 'Don Carlos Recomienda' : product.badge }}
            size={index === 0 ? 'large' : index % 2 === 0 ? 'medium' : 'small'}
            onAddToCart={(id) => {
              const current = products.find((item) => item.id === id);
              if (current) {
                addToCart(current, 1);
              }
            }}
            isIAContent={Boolean(product.is_promoted)}
          />
        ))}
      />
    </section>
  );
}

mountReactNode('#homeReactRoot', <HomeShowcase />);
