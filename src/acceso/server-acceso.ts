// What the Django sign-in page (backend/ventas/templates/ventas/acceso.html) needs from the browser
// besides static/tienda/acceso.js, which owns every bit of the sign-in logic. Nothing here reads a
// password, talks to a server or stores anything: it is the header, the search dialog and the
// show-password buttons, so the page can be checked on its own as a piece of interface.
import { governHeader } from '../landing/header-state';
import { containDrawerFocus, wireSearchDialog } from '../ui/menu-drawer';

const SHOW = 'Mostrar contraseña';
const HIDE = 'Ocultar contraseña';

/**
 * Each button flips the `type` of the field it controls between password and text. The label
 * changes with the state, so the button is not announced as a toggle (no `aria-pressed`).
 */
function wirePasswordToggles(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-ver-clave]').forEach((button) => {
    const field = document.getElementById(button.getAttribute('aria-controls') ?? '');
    if (!(field instanceof HTMLInputElement)) {
      return;
    }
    const icon = button.querySelector('i');
    button.addEventListener('click', () => {
      const reveal = field.type === 'password';
      field.type = reveal ? 'text' : 'password';
      button.setAttribute('aria-label', reveal ? HIDE : SHOW);
      icon?.classList.toggle('bi-eye', !reveal);
      icon?.classList.toggle('bi-eye-slash', reveal);
    });
  });
}

export function initServerAcceso(): void {
  // The header module is older and finds its elements by id: it loads after the page so it never
  // delays the first paint.
  void import('../../js/modules/ui/header.js');
  wireSearchDialog();
  containDrawerFocus();
  governHeader();
  wirePasswordToggles();
}
