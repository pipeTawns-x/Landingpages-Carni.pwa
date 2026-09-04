import { createRoot } from 'react-dom/client';
import { Lupa } from './Lupa';

/**
 * Mounts the search overlay on the pages that are not the catalogue.
 *
 * `index.html` and `accessweb.html` have no router, so a result cannot navigate
 * in place — it leaves for `products.html` with the product in the hash, and the
 * catalogue's own router picks it up on arrival. Same panel, same data, one line
 * of difference in what a result does.
 *
 * The host node is created here rather than added to each HTML file: this is a
 * React concern and the pages should not have to know it exists.
 */
export function montarLupa(): void {
  if (document.getElementById('lupaRoot')) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'lupaRoot';
  document.body.appendChild(host);

  createRoot(host).render(
    <Lupa
      irAlProducto={(id) => {
        window.location.href = `products.html#/producto/${id}`;
      }}
    />
  );
}
