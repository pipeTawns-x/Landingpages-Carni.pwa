// Bootstrap from node_modules instead of a CDN: Django's CSP only allows 'self'.
// The legacy modules (ui.js, cart.js) read `bootstrap` as a global, as the CDN bundle
// used to provide, so this module sets it.
import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

window.bootstrap = bootstrap;
