/**
 * The category rail of the catalogue (backend/ventas/templates/ventas/parciales/_catalogo.html).
 * The chips are links painted by Django; the arrows only exist for a pointer on a wide screen, so
 * they stay hidden until this script shows them, enabled only where there is more to see.
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { wireCarril } from '../carril';

const PAGE = `
  <button data-carril-flecha="-1" hidden>‹</button>
  <nav data-carril><a class="tw-filter-chip tw-filter-chip--active" href="#">Todo</a><a class="tw-filter-chip" href="#">Cerdo</a></nav>
  <button data-carril-flecha="1" hidden>›</button>`;

const rail = (): HTMLElement => document.querySelector('[data-carril]') as HTMLElement;
const arrow = (side: string): HTMLButtonElement =>
  document.querySelector(`[data-carril-flecha="${side}"]`) as HTMLButtonElement;

function measure(scrollLeft: number, clientWidth: number, scrollWidth: number): void {
  rail().scrollLeft = scrollLeft;
  Object.defineProperty(rail(), 'clientWidth', { value: clientWidth, configurable: true });
  Object.defineProperty(rail(), 'scrollWidth', { value: scrollWidth, configurable: true });
}

describe('wireCarril', () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE;
    rail().scrollBy = jest.fn() as unknown as HTMLElement['scrollBy'];
    rail().scrollTo = jest.fn() as unknown as HTMLElement['scrollTo'];
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('the arrows appear and only the one with something to show is enabled', () => {
    measure(0, 300, 900);
    wireCarril();

    expect(arrow('-1').hidden).toBe(false);
    expect(arrow('-1').disabled).toBe(true);
    expect(arrow('1').disabled).toBe(false);
  });

  test('at the end of the rail the right arrow is the one that rests', () => {
    measure(600, 300, 900);
    wireCarril();
    rail().dispatchEvent(new Event('scroll'));

    expect(arrow('-1').disabled).toBe(false);
    expect(arrow('1').disabled).toBe(true);
  });

  test('an arrow moves the rail eight tenths of its width, leaving a chip in view', () => {
    measure(0, 300, 900);
    wireCarril();

    arrow('1').click();

    expect(rail().scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });
  });

  test('the left arrow moves the other way', () => {
    measure(600, 300, 900);
    wireCarril();
    rail().dispatchEvent(new Event('scroll'));

    arrow('-1').click();

    expect(rail().scrollBy).toHaveBeenCalledWith({ left: -240, behavior: 'smooth' });
  });

  test('a rail that fits in one look needs no arrows enabled', () => {
    measure(0, 900, 900);
    wireCarril();

    expect(arrow('-1').disabled).toBe(true);
    expect(arrow('1').disabled).toBe(true);
  });

  test('an active chip out of view is scrolled to, measured against the rail and not the page', () => {
    // The rail sits 100px from the left of the page (the left arrow takes the space before it),
    // and its active chip is 500px from the left of the page: 400px inside the rail.
    measure(0, 300, 900);
    const chips = document.querySelectorAll<HTMLElement>('.tw-filter-chip');
    chips[0].classList.remove('tw-filter-chip--active');
    chips[1].classList.add('tw-filter-chip--active');
    rail().getBoundingClientRect = () => ({ left: 100, right: 400, width: 300 }) as DOMRect;
    chips[1].getBoundingClientRect = () => ({ left: 500, right: 600, width: 100 }) as DOMRect;

    wireCarril();

    expect(rail().scrollTo).toHaveBeenCalledWith({ left: 384, behavior: 'smooth' });
  });

  test('an active chip already in view does not move the rail', () => {
    measure(0, 300, 900);
    rail().getBoundingClientRect = () => ({ left: 100, right: 400, width: 300 }) as DOMRect;
    document.querySelector('.tw-filter-chip--active')!.getBoundingClientRect = () =>
      ({ left: 120, right: 220, width: 100 }) as DOMRect;

    wireCarril();

    expect(rail().scrollTo).not.toHaveBeenCalled();
  });

  test('a page without the rail is left alone', () => {
    document.body.innerHTML = '<p>nada</p>';

    expect(() => wireCarril()).not.toThrow();
  });
});
