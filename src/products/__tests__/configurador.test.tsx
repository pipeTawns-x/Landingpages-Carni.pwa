/**
 * The quote widget of the sheet (backend/ventas/templates/ventas/parciales/_ficha.html), the
 * script that was static/tienda/producto.js. It shows the fields of the chosen way, describes the
 * line in words and asks the store for the number (ventas:producto_cotizar, JSON): the browser
 * never computes a price. Each test goes through the form, the way a customer does.
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { wireConfigurador } from '../configurador';

const FORM = (thickness = false): string => `
  <form data-configurador data-cotizar="/productos/7/cotizar/" method="post">
    <input type="radio" name="mode" value="weight" data-modo checked>
    <input type="radio" name="mode" value="money" data-modo>
    <input type="radio" name="mode" value="pieces" data-modo>
    <label for="cantidad" data-etiqueta-cantidad>Cantidad</label>
    <input id="cantidad" name="amount" type="number" data-cantidad>
    <fieldset data-grupo="weight">
      <input type="radio" name="unit" value="kg" checked>
      <input type="radio" name="unit" value="g">
      <input type="radio" name="unit" value="lb">
    </fieldset>
    ${thickness ? `<div data-grupo="pieces"><label>Grosor <output data-grosor-valor>1.25"</output></label>
      <input type="range" name="thickness_in" min="0.5" max="3" step="0.25" value="1.25" data-grosor></div>` : ''}
    <p data-ayuda>ayuda</p>
    <div data-resumen aria-live="polite">
      <strong data-resumen-precio></strong>
      <p data-resumen-texto>Escribe la cantidad para ver tu subtotal.</p>
    </div>
  </form>`;

const q = <T extends Element>(selector: string): T => document.querySelector(selector) as T;
const type = (value: string): void => {
  const amount = q<HTMLInputElement>('[data-cantidad]');
  amount.value = value;
  amount.dispatchEvent(new Event('input', { bubbles: true }));
};
const pick = (mode: string): void => {
  const radio = q<HTMLInputElement>(`[data-modo][value="${mode}"]`);
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
};
let fetchMock: jest.MockedFunction<typeof fetch>;
const answer = (body: unknown, ok = true): void => {
  fetchMock.mockResolvedValueOnce({ ok, json: async () => body } as Response);
};
const settle = async (): Promise<void> => {
  jest.advanceTimersByTime(300);
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
};

describe('wireConfigurador', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = jest.fn<typeof fetch>();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('only the fields of the chosen way are shown, and the question matches it', () => {
    document.body.innerHTML = FORM(true);
    wireConfigurador();

    expect(q<HTMLElement>('[data-grupo="weight"]').hidden).toBe(false);
    expect(q<HTMLElement>('[data-grupo="pieces"]').hidden).toBe(true);
    expect(q('[data-etiqueta-cantidad]').textContent).toBe('¿Cuánto quieres?');

    pick('pieces');

    expect(q<HTMLElement>('[data-grupo="weight"]').hidden).toBe(true);
    expect(q<HTMLElement>('[data-grupo="pieces"]').hidden).toBe(false);
    expect(q('[data-etiqueta-cantidad]').textContent).toBe('¿Cuántas piezas?');
    expect(q<HTMLInputElement>('[data-cantidad]').step).toBe('1');
    expect(q<HTMLInputElement>('[data-cantidad]').inputMode).toBe('numeric');
  });

  test('money is asked in pesos, with the step of money', () => {
    document.body.innerHTML = FORM();
    wireConfigurador();

    pick('money');

    expect(q('[data-etiqueta-cantidad]').textContent).toBe('¿Cuánto quieres gastar?');
    expect(q<HTMLInputElement>('[data-cantidad]').min).toBe('1');
  });

  test('without an amount nothing is asked of the store', () => {
    document.body.innerHTML = FORM();
    wireConfigurador();

    type('');
    jest.advanceTimersByTime(500);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(q('[data-resumen-texto]').textContent).toBe('Escribe la cantidad para ver tu subtotal.');
    expect(q('[data-resumen-precio]').textContent).toBe('');
  });

  test('a zero or negative amount is not a quote either', () => {
    document.body.innerHTML = FORM();
    wireConfigurador();

    type('0');
    type('-2');
    jest.advanceTimersByTime(500);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a weight is quoted by the store with its unit and shown as money', async () => {
    document.body.innerHTML = FORM();
    answer({ total: '300.00', descuento: '0.00', kg: '1.500', piezas: 0 });
    wireConfigurador();

    type('1.5');
    await settle();

    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/productos/7/cotizar/?mode=weight&amount=1.5&unit=kg');
    expect((options.headers as Record<string, string>).Accept).toBe('application/json');
    expect(q('[data-resumen-precio]').textContent).toBe('$300.00');
    expect(q('[data-resumen-texto]').textContent).toBe('1.5 kg');
  });

  test('money and pieces say how much it weighs, and pieces send the thickness', async () => {
    document.body.innerHTML = FORM(true);
    answer({ total: '90.00', descuento: '0.00', kg: '0.450', piezas: 3 });
    wireConfigurador();
    pick('pieces');

    type('3');
    await settle();

    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe('/productos/7/cotizar/?mode=pieces&amount=3&thickness_in=1.25');
    expect(q('[data-resumen-texto]').textContent).toBe('3 piezas de 1.25" · aprox. 0.45 kg');
    expect(q('[data-resumen-precio]').textContent).toBe('$90.00');
  });

  test('moving the thickness updates what is read and asks again', async () => {
    document.body.innerHTML = FORM(true);
    wireConfigurador();
    pick('pieces');
    type('2');
    await settle();
    fetchMock.mockClear();
    answer({ total: '120.00', descuento: '0.00', kg: '0.600', piezas: 2 });

    const slider = q<HTMLInputElement>('[data-grosor]');
    slider.value = '2';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();

    expect(q('[data-grosor-valor]').textContent).toBe('2"');
    expect(slider.getAttribute('aria-valuetext')).toBe('2 pulgadas');
    expect(fetchMock.mock.calls[0][0]).toContain('thickness_in=2');
  });

  test('typing quickly asks once, for the last thing typed', async () => {
    document.body.innerHTML = FORM();
    answer({ total: '40.00', descuento: '0.00', kg: '0.200', piezas: 0 });
    wireConfigurador();

    type('1');
    type('15');
    type('150');
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('amount=150');
  });

  test('when the store refuses the line, the customer reads why and no price is shown', async () => {
    document.body.innerHTML = FORM();
    answer({ error: 'Ese producto no se vende por piezas.' }, false);
    wireConfigurador();

    type('3');
    await settle();

    expect(q('[data-resumen-texto]').textContent).toBe('Ese producto no se vende por piezas.');
    expect(q('[data-resumen-precio]').textContent).toBe('');
    expect(q('[data-resumen-precio]').hasAttribute('aria-busy')).toBe(false);
  });

  test('when the store cannot be reached, the form says so and the cart page still prices it', async () => {
    document.body.innerHTML = FORM();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    wireConfigurador();

    type('2');
    await settle();

    expect(q('[data-resumen-texto]').textContent).toContain('No pudimos calcularlo ahora');
    expect(q('[data-resumen-precio]').textContent).toBe('');
  });

  test('a late answer to an old question never overwrites the newer one', async () => {
    document.body.innerHTML = FORM();
    let release: (value: Response) => void = () => undefined;
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => { release = resolve; })
    );
    answer({ total: '60.00', descuento: '0.00', kg: '0.300', piezas: 0 });
    wireConfigurador();

    type('1');
    await settle();
    type('2');
    await settle();
    release({ ok: true, json: async () => ({ total: '20.00', kg: '0.100', piezas: 0 }) } as Response);
    await settle();

    expect(q('[data-resumen-precio]').textContent).toBe('$60.00');
  });

  test('a request cancelled by a newer keystroke leaves the dots in place and never an error', async () => {
    document.body.innerHTML = FORM();
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          );
        })
    );
    wireConfigurador();
    type('1');
    await settle();

    type('2'); // cancels the request of "1" before the debounce of "2" has fired
    for (let i = 0; i < 4; i += 1) await Promise.resolve();

    expect(q('[data-resumen-precio]').textContent).toBe('…');
    expect(q('[data-resumen-texto]').textContent).not.toContain('No pudimos calcularlo');
  });

  test('a page without the form is left alone', () => {
    document.body.innerHTML = '<p>nada</p>';

    expect(() => wireConfigurador()).not.toThrow();
  });
});
