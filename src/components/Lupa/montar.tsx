import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { Lupa } from './Lupa';
import { carniTheme } from '@src/theme/carniTheme';

/**
 * Mounts the search popin on the pages that are not the catalogue.
 *
 * `index.html` and `accessweb.html` have no router, so a result cannot navigate
 * in place — it leaves for `products.html` with the product in the hash, and the
 * catalogue's own router picks it up on arrival. Same panel, same data, one line
 * of difference in what a result does.
 *
 * The host node is created here rather than added to each HTML file: this is a
 * React concern and the pages should not have to know it exists. The triggers
 * (`#searchBtn`, `.header-search`) do live in the static header, and the
 * component binds them by selector — that is why the popin works from a root
 * appended to `body`.
 *
 * The theme is provided here because the popin is styled-components: a root
 * created outside the page's own tree inherits no context from it.
 */
export function montarLupa(): void {
  if (document.getElementById('lupaRoot')) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'lupaRoot';
  document.body.appendChild(host);

  createRoot(host).render(
    <ThemeProvider theme={carniTheme}>
      <Lupa
        onPickProduct={(producto) => {
          window.location.href = `products.html#/producto/${producto.id}`;
        }}
      />
    </ThemeProvider>
  );
}
