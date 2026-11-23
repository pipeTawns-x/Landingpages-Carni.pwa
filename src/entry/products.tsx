// Bootstrap's global and the styles come first, statically: `{% vite_asset %}` turns the CSS of
// this entry into <link> tags, and a style imported from a dynamic chunk would load late.
//
// `?products` is not read by anything: it only gives each stylesheet a module identity of its own.
// The landing imports the same files, and a stylesheet two entries share is hoisted into a common
// chunk that `{% vite_asset %}` lists AFTER the CSS of the entry, which would put Bootstrap behind
// the site's rules (and the landing's own rules behind the site's). With its own copy, each page
// keeps its stylesheets in the order written here: Bootstrap first, the site wins.
import '../../js/modules/ui/bootstrap-js.js';
import '@src/landing/bootstrap-first.css?products';
import '@src/styles/fuentes';
import '@src/styles/redesign.css?products';
import '@src/styles/tokens-globales.css?products';
import '../../css/styles.css?products';
import '../../css/components/products-page.css';

// bootstrap-js.js sets the global `bootstrap` the legacy modules read. js/modules/ui/
// bootstrap-global.js is not imported here: it also brings Bootstrap's CSS, from a shared chunk
// that `{% vite_asset %}` lists after the site's own rules (see src/entry/home.tsx).

// Two pages share this entry. The Django page (backend/ventas/templates/ventas/productos.html)
// paints its own catalogue and only needs behaviour; the static products.html at the root, served
// by the Vite dev server, mounts its React app. Each branch is its own chunk, so the page that
// does not use it never loads it.
if (document.body.hasAttribute('data-server-store')) {
  void import('@src/products/server-products').then(({ initServerProducts }) => initServerProducts());
} else {
  void import('@src/products/legacy-products').then(({ mountLegacyCatalog }) => mountLegacyCatalog());
}
