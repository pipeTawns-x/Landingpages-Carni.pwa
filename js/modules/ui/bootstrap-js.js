// Bootstrap's JavaScript from node_modules instead of a CDN: Django's CSP only allows 'self'.
// The legacy modules (ui.js, cart.js) read `bootstrap` as a global, as the CDN bundle used to
// provide, so this module sets it. It carries no CSS, so a page that orders its own stylesheet
// (src/entry/home.tsx) can import it without pulling Bootstrap's CSS in from a shared chunk.
import * as bootstrap from 'bootstrap';

window.bootstrap = bootstrap;
