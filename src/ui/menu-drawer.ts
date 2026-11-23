/**
 * What the header of a Django page needs from the browser beyond what js/modules/ui/header.js does.
 *
 * header.js opens and closes the menu drawer by flipping `aria-hidden`. These two functions keep
 * the rest of the page out of reach while it is open and wire the search dialog; they are the same
 * ones the landing needs (src/landing/server-store.tsx carries its own copy until the pages share
 * one header).
 */

const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Keeps the closed drawer out of the tab order (`inert`), opens it to the keyboard when it opens,
 * moves the focus to its first control, wraps Tab inside it, and returns the focus to the menu
 * button when it closes (only if the focus was inside: it never steals it from somewhere else).
 */
export function containDrawerFocus(): void {
  const drawer = document.getElementById('mobileDrawer');
  const toggle = document.getElementById('menuToggle');
  if (!drawer) {
    return;
  }

  drawer.inert = true;
  new MutationObserver(() => {
    const open = drawer.getAttribute('aria-hidden') === 'false';
    toggle?.setAttribute('aria-expanded', String(open));
    drawer.inert = !open;
    if (open) {
      drawer.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    } else if (drawer.contains(document.activeElement)) {
      toggle?.focus();
    }
  }).observe(drawer, { attributes: true, attributeFilter: ['aria-hidden'] });

  drawer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }
    const controls = drawer.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}

/** The magnifier opens a native modal dialog whose form sends the visitor to the filtered catalogue. */
export function wireSearchDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-store-search]');
  if (!dialog) {
    return;
  }
  document.getElementById('searchBtn')?.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());
}
