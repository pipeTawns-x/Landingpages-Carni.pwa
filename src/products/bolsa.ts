/**
 * The cart drawer of the Django products page (backend/ventas/templates/ventas/parciales/_bolsa.html).
 *
 * It is a native modal <dialog>, so the browser already makes the page inert, keeps the focus
 * inside, closes it with Escape and gives the focus back to the opener. This only adds what the
 * browser does not: the header's cart link opens the drawer instead of navigating (a modified
 * click still navigates, as any link), arriving at #bolsa opens it (a removal that redirects back
 * here keeps it open), the focus lands on the cart button when nothing holds it after closing
 * (Safari does not focus a link on click, so the browser has nothing to give back to), and the
 * light dismiss works where `closedby` is missing.
 */

function pressedOutside(event: MouseEvent, dialog: HTMLDialogElement): boolean {
  const box = dialog.getBoundingClientRect();
  return (
    event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
  );
}

/** A press and a release outside the panel close the drawer; a text selection that ends there does not. */
function lightDismissFallback(dialog: HTMLDialogElement): void {
  if ('closedBy' in HTMLDialogElement.prototype) {
    return;
  }
  let pressStartedOutside = false;
  dialog.addEventListener('pointerdown', (event) => {
    pressStartedOutside = pressedOutside(event, dialog);
  });
  dialog.addEventListener('pointerup', (event) => {
    if (pressStartedOutside && pressedOutside(event, dialog)) {
      dialog.close();
    }
  });
}

const isPlainClick = (event: MouseEvent): boolean =>
  event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

export function wireBolsa(): void {
  const dialog = document.getElementById('bolsa') as HTMLDialogElement | null;
  const trigger = document.getElementById('cartBtn');
  if (!dialog || !trigger || typeof dialog.showModal !== 'function') {
    return;
  }

  const open = (): void => {
    if (!dialog.open) {
      dialog.showModal();
    }
    trigger.setAttribute('aria-expanded', 'true');
  };

  trigger.setAttribute('aria-expanded', 'false');
  trigger.addEventListener('click', (event) => {
    if (!isPlainClick(event)) {
      return;
    }
    event.preventDefault();
    open();
  });

  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    void Promise.resolve().then(() => {
      const holder = document.activeElement;
      if (!holder || holder === document.body) {
        trigger.focus();
      }
    });
  });

  lightDismissFallback(dialog);

  if (window.location.hash === '#bolsa') {
    open();
  }
}
