// Bootstrap's global and the styles come first, statically: `{% vite_asset %}` turns the CSS of
// this entry into <link> tags, and a style imported from a dynamic chunk would load late.
import '../../js/modules/ui/bootstrap-js.js';
import '@src/landing/bootstrap-first.css';
import '@src/styles/fuentes';
import '@src/styles/redesign.css';
import '@src/styles/tokens-globales.css';
import '../../css/styles.css';
import '../../css/components/store-motion.css';

// bootstrap-js.js sets the global `bootstrap` the legacy modules read. js/modules/ui/
// bootstrap-global.js is not imported here: it also brings Bootstrap's CSS, from a shared chunk
// that `{% vite_asset %}` lists after the site's own rules.

// Two pages share this entry. The Django page (backend/ventas/templates/ventas/index.html)
// paints its own sections and only needs behaviour; the static index.html at the root, served by
// the Vite dev server, mounts its React islands. Each branch is its own chunk, so the page that
// does not use it never loads it.
if (document.body.hasAttribute('data-server-store')) {
  void import('@src/landing/server-store').then(({ initServerStore }) => initServerStore());
} else {
  void import('@src/landing/legacy-home').then(({ mountLegacyStore }) => mountLegacyStore());
}
