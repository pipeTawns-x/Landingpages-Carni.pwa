import { Link } from 'react-router-dom';
import { getProducts } from '../../../js/modules/supabase.js';
import { useSupabaseQuery } from '@src/hooks/useSupabaseQuery';
import { assetUrl } from '@src/entry/shared';
import type { Product } from '@src/types/database';

const CUANTOS = 4;

export interface RelacionadosProps {
  /** The product being looked at — it never appears among its own suggestions. */
  producto: Product;
}

/**
 * Four more cuts from the same counter, shown under the configuration.
 *
 * Without this the only way out of a product page is the browser's back button
 * or a trip through the whole category list. Somebody who opened Porterhouse
 * from Cortes Especiales wants the other cuts in that case, not the top of the
 * catalogue — so the suggestions come from the same category as the product
 * being read.
 *
 * Four, and not more: a row that scrolls forever competes with the decision the
 * customer came here to make.
 */
export function Relacionados({ producto }: RelacionadosProps): JSX.Element | null {
  const categoriaId = (producto as unknown as { category_id?: number }).category_id ?? null;
  const nombreCategoria =
    (producto as unknown as { categories?: { name?: string } }).categories?.name ?? 'el catálogo';

  const { datos, isLoading, error } = useSupabaseQuery<Product[]>(
    () => {
      if (categoriaId === null) {
        return Promise.resolve([] as Product[]);
      }
      // One more than needed, because the current product is filtered out below
      // and would otherwise leave a gap in the row.
      return getProducts({ category: categoriaId, limit: CUANTOS + 1 }) as Promise<Product[]>;
    },
    [categoriaId]
  );

  // A failed suggestion strip is not worth an error message: the customer came
  // for the cut above, and a red box under it would read as if that had failed.
  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="sugeridos" aria-busy="true" aria-label="Cargando sugerencias">
        <h2 className="sugeridos__titulo">También de {nombreCategoria}</h2>
        <div className="sugeridos__carril">
          {Array.from({ length: CUANTOS }, (_, i) => (
            <div className="sugeridos__esqueleto" key={i} />
          ))}
        </div>
      </section>
    );
  }

  const otros = (datos ?? []).filter((p) => p.id !== producto.id).slice(0, CUANTOS);

  // A category with a single product has nothing to suggest. An empty heading
  // over an empty row looks broken; showing nothing does not.
  if (otros.length === 0) {
    return null;
  }

  return (
    <section className="sugeridos" aria-label={`Más cortes de ${nombreCategoria}`}>
      <div className="sugeridos__encabezado">
        <h2 className="sugeridos__titulo">También de {nombreCategoria}</h2>
        <Link className="sugeridos__todos" to="/">Ver todo</Link>
      </div>

      {/* Scrolls sideways on a phone and settles into a row on a wide screen.
          Four cards squeezed into 390 px would be four thumbnails nobody can
          read. */}
      <div className="sugeridos__carril">
        {otros.map((p) => (
          <Link className="sugeridos__card" key={p.id} to={`/producto/${p.id}`}>
            <img
              className="sugeridos__foto"
              src={assetUrl(p.image_url ?? '/img/products/res.webp')}
              alt={p.name}
              loading="lazy"
              width={400}
              height={400}
            />
            <span className="sugeridos__nombre">{p.name}</span>
            <span className="sugeridos__precio">${p.price_per_kg} / kg</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Relacionados;
