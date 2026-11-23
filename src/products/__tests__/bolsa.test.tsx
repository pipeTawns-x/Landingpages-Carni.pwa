/**
 * The cart drawer of the Django products page (backend/ventas/templates/ventas/parciales/
 * _bolsa.html): a native modal <dialog>, opened by the header's cart link. The browser provides
 * the inert page, the focus containment and Escape, so these tests only pin what the script adds:
 * the link opens the drawer instead of navigating, a modified click still navigates, the hash
 * #bolsa opens it on arrival, the focus never gets lost on close, and the light dismiss works
 * where the browser has no `closedby`.
 */
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { wireBolsa } from '../bolsa';

const PAGE = `
  <a href="/carrito/" id="cartBtn" aria-controls="bolsa" aria-label="Carrito">Carrito</a>
  <dialog id="bolsa" aria-labelledby="bolsa-titulo" closedby="any">
    <div class="bolsa__panel" data-panel>
      <h2 id="bolsa-titulo">Tu pedido</h2>
      <form method="dialog"><button type="submit" autofocus aria-label="Cerrar el pedido">x</button></form>
    </div>
  </dialog>`;

const trigger = (): HTMLAnchorElement => document.getElementById('cartBtn') as HTMLAnchorElement;
const drawer = (): HTMLDialogElement => document.getElementById('bolsa') as HTMLDialogElement;

function click(init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
  trigger().dispatchEvent(event);
  return event;
}

describe('wireBolsa', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    window.location.hash = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('a click on the cart link opens the drawer instead of leaving the page', () => {
    wireBolsa();
    const event = click();

    expect(event.defaultPrevented).toBe(true);
    expect(drawer().open).toBe(true);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  test('a click with a modifier key still follows the link, as a link should', () => {
    wireBolsa();

    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
      const event = click(init);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(drawer().open).toBe(false);
  });

  test('closing the drawer tells the button it is collapsed again', () => {
    wireBolsa();
    click();

    drawer().close();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  test('when nothing holds the focus after closing, it goes back to the cart button', () => {
    wireBolsa();
    click();
    (document.activeElement as HTMLElement | null)?.blur();

    drawer().close();

    return Promise.resolve().then(() => expect(document.activeElement).toBe(trigger()));
  });

  test('arriving at #bolsa opens the drawer, so a removal that comes back here keeps it open', () => {
    window.location.hash = '#bolsa';
    wireBolsa();

    expect(drawer().open).toBe(true);
  });

  test('without #bolsa the drawer stays closed on arrival', () => {
    wireBolsa();

    expect(drawer().open).toBe(false);
  });

  test('where the browser has no showModal the link keeps working as a plain link', () => {
    const original = HTMLDialogElement.prototype.showModal;
    // @ts-expect-error the point of the test is a browser without the method
    HTMLDialogElement.prototype.showModal = undefined;
    try {
      wireBolsa();
      const event = click();

      expect(event.defaultPrevented).toBe(false);
    } finally {
      HTMLDialogElement.prototype.showModal = original;
    }
  });

  test('where closedby is missing, a press and a release outside the panel close the drawer', () => {
    // jsdom has no closedBy: this is the fallback of the guidance.
    wireBolsa();
    click();
    const panel = document.querySelector('[data-panel]') as HTMLElement;
    panel.getBoundingClientRect = () => ({ left: 100, right: 300, top: 100, bottom: 300 }) as DOMRect;
    drawer().getBoundingClientRect = panel.getBoundingClientRect;

    drawer().dispatchEvent(new MouseEvent('pointerdown', { clientX: 10, clientY: 10, bubbles: true }));
    drawer().dispatchEvent(new MouseEvent('pointerup', { clientX: 10, clientY: 10, bubbles: true }));

    expect(drawer().open).toBe(false);
  });

  test('a press inside the panel does not close the drawer', () => {
    wireBolsa();
    click();
    drawer().getBoundingClientRect = () => ({ left: 0, right: 400, top: 0, bottom: 400 }) as DOMRect;

    drawer().dispatchEvent(new MouseEvent('pointerdown', { clientX: 200, clientY: 200, bubbles: true }));
    drawer().dispatchEvent(new MouseEvent('pointerup', { clientX: 200, clientY: 200, bubbles: true }));

    expect(drawer().open).toBe(true);
  });

  test('a page without the drawer is left alone', () => {
    document.body.innerHTML = '<a href="/carrito/" id="cartBtn">Carrito</a>';

    expect(() => wireBolsa()).not.toThrow();
    expect(click().defaultPrevented).toBe(false);
  });
});
