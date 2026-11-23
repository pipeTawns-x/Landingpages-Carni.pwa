import { governHeader } from '../landing/header-state';
import { containDrawerFocus, wireSearchDialog } from '../ui/menu-drawer';
import { wireBolsa } from './bolsa';
import { wireCarril } from './carril';
import { wireConfigurador } from './configurador';

/**
 * What the Django products page (backend/ventas/templates/ventas/productos.html) needs from the
 * browser. Django already painted the page: the header, the catalogue or the sheet, the cart
 * drawer, the footer and the assistant are plain HTML, and the cart is the one of the session.
 * This wires the behaviour on top of them; the page works, less comfortably, without any of it.
 *
 * Nothing here talks to Supabase and nothing keeps a second copy of the cart in localStorage.
 */
export function initServerProducts(): void {
  // The header and the assistant are older modules that find their elements by id: they load after
  // the page so they never delay the first paint.
  void import('../../js/modules/ui/header.js');
  void import('../../js/modules/chatbot.js');
  wireSearchDialog();
  containDrawerFocus();
  governHeader();
  wireBolsa();
  wireCarril();
  wireConfigurador();
}
