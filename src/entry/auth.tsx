// Bootstrap's global and the styles come first, statically: `{% vite_asset %}` turns the CSS of
// this entry into <link> tags, and a style imported from a dynamic chunk would load late.
//
// `?acceso` is not read by anything: it gives each stylesheet a module identity of its own, so the
// pages that import the same files do not hoist them into a shared chunk that `{% vite_asset %}`
// would list AFTER this entry's CSS (and Bootstrap would then override the site). See products.tsx.
// Only the shared files carry it: acceso-page.css is imported by this entry alone, so it needs none.
import '../../js/modules/ui/bootstrap-js.js';
import '@src/landing/bootstrap-first.css?acceso';
import '@src/styles/fuentes';
import '@src/styles/redesign.css?acceso';
import '@src/styles/tokens-globales.css?acceso';
import '../../css/styles.css?acceso';
import '../../css/pages/acceso-page.css';

// Two pages share this entry. The Django page (backend/ventas/templates/ventas/acceso.html) paints
// its own forms and only needs behaviour (the sign-in logic is static/tienda/acceso.js, loaded by
// the template); the static accessweb.html at the root, served by the Vite dev server, mounts its
// React strip. Each branch is its own chunk, so the page that does not use it never loads it.
if (document.body.hasAttribute('data-server-store')) {
  void import('@src/acceso/server-acceso').then(({ initServerAcceso }) => initServerAcceso());
} else {
  void import('@src/acceso/legacy-acceso').then(({ mountLegacyAcceso }) => mountLegacyAcceso());
}
