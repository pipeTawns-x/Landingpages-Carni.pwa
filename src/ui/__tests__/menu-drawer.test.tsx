/**
 * The menu drawer and the search dialog of the Django pages (backend/ventas/templates/ventas/
 * parciales/_cabecera.html and _buscar.html). js/modules/ui/header.js opens and closes the drawer
 * by flipping `aria-hidden`; this keeps the rest of the page out of reach while it is open (inert
 * outside, focus trapped inside) and gives the focus back to the button that opened it.
 */
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { containDrawerFocus, wireSearchDialog } from '../menu-drawer';

const PAGE = `
  <button id="menuToggle" aria-expanded="false" aria-controls="mobileDrawer">Menu</button>
  <button id="searchBtn">Buscar</button>
  <aside id="mobileDrawer" aria-hidden="true" inert>
    <button id="drawerClose">Cerrar</button>
    <a href="/productos/" id="first-link">Productos</a>
    <a href="/acceso/" id="last-link">Acceso</a>
  </aside>
  <dialog data-store-search><form><input id="q"></form><button type="button" data-search-close>Cerrar búsqueda</button></dialog>`;

const drawer = (): HTMLElement => document.getElementById('mobileDrawer') as HTMLElement;
const toggle = (): HTMLElement => document.getElementById('menuToggle') as HTMLElement;
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function open(): Promise<void> {
  drawer().setAttribute('aria-hidden', 'false');
  await flush();
}
async function close(): Promise<void> {
  drawer().setAttribute('aria-hidden', 'true');
  await flush();
}

describe('containDrawerFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('the closed drawer is out of the tab order and the reading order', () => {
    drawer().inert = false;
    containDrawerFocus();

    expect(drawer().inert).toBe(true);
  });

  test('opening it lets the keyboard in, tells the button and moves the focus inside', async () => {
    containDrawerFocus();

    await open();

    expect(drawer().inert).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(document.getElementById('drawerClose'));
  });

  test('closing it with the focus inside gives the focus back to the menu button', async () => {
    containDrawerFocus();
    await open();

    await close();

    expect(drawer().inert).toBe(true);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
  });

  test('closing it while the focus is elsewhere does not steal the focus', async () => {
    containDrawerFocus();
    await open();
    const other = document.getElementById('searchBtn') as HTMLElement;
    other.focus();

    await close();

    expect(document.activeElement).toBe(other);
  });

  test('Tab on the last control wraps to the first, and Shift+Tab on the first to the last', async () => {
    containDrawerFocus();
    await open();
    const first = document.getElementById('drawerClose') as HTMLElement;
    const last = document.getElementById('last-link') as HTMLElement;

    last.focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    const backward = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    first.dispatchEvent(backward);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  test('Tab in the middle of the drawer is left to the browser', async () => {
    containDrawerFocus();
    await open();
    const middle = document.getElementById('first-link') as HTMLElement;
    middle.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    middle.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  test('a page without the drawer is left alone', () => {
    document.body.innerHTML = '<p>nada</p>';

    expect(() => containDrawerFocus()).not.toThrow();
  });
});

describe('wireSearchDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('the magnifier opens the search dialog and its close button closes it', () => {
    const dialog = document.querySelector('[data-store-search]') as HTMLDialogElement;
    wireSearchDialog();

    (document.getElementById('searchBtn') as HTMLElement).click();
    expect(dialog.open).toBe(true);

    (document.querySelector('[data-search-close]') as HTMLElement).click();
    expect(dialog.open).toBe(false);
  });

  test('without the dialog the magnifier does nothing and breaks nothing', () => {
    document.body.innerHTML = '<button id="searchBtn">Buscar</button>';
    wireSearchDialog();

    expect(() => (document.getElementById('searchBtn') as HTMLElement).click()).not.toThrow();
  });
});
