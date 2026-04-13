import { useEffect, useMemo, useState } from 'react';
import { BentoGrid } from '@src/components/BentoGrid';
import { ProductCard } from '@src/components/ProductCard';
import { useCart } from '@src/hooks/useCart';
import type { Product } from '@src/types/database';
import { fetchProducts, mountReactNode, categoryLabel } from './shared';
import '@src/styles/redesign.css';

function CatalogExperience(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { addToCart } = useCart();

  useEffect(() => {
    void fetchProducts().then(setProducts);
  }, []);

  const filters = useMemo(() => {
    const labels = new Set<string>();
    products.forEach((product) => labels.add(categoryLabel(product)));
    return ['all', ...Array.from(labels)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') {
      return products;
    }

    return products.filter((product) => categoryLabel(product) === activeFilter);
  }, [activeFilter, products]);

  return (
    <section className="tw-redesign-root tw-catalog-shell">
      <div className="tw-catalog-shell__header">
        <p className="tw-kicker">Catálogo Maestro</p>
        <h2>Elige tu corte, compara opciones y arma tu pedido sin perder tiempo</h2>
        <p>
          Aqui reunimos los productos mas buscados de la carniceria para que cualquier cliente pueda
          encontrar res, pollo, cerdo y especiales con una navegacion clara y directa.
        </p>
        <div className="tw-filter-row">
          {filters.map((filter) => (
            <button
              className={`tw-filter-chip ${activeFilter === filter ? 'tw-filter-chip--active' : ''}`}
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'all' ? 'Todo el catálogo' : filter}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="tw-empty-state"><p>Por ahora no tenemos cortes publicados en esta categoria. Prueba con otra seleccion.</p></div>
      ) : (
        <BentoGrid
          gap="1.5rem"
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
          items={filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={{ ...product, badge: index % 5 === 0 ? 'Oferta Especial' : product.badge }}
              size={index % 6 === 0 ? 'large' : 'small'}
              onAddToCart={(id) => {
                const current = products.find((item) => item.id === id);
                if (current) {
                  addToCart(current, 1);
                }
              }}
              isIAContent={Boolean(product.is_promoted || index % 4 === 0)}
            />
          ))}
        />
      )}
    </section>
  );
}

mountReactNode('#productsReactRoot', <CatalogExperience />);
