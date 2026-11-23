/**
 * The quote widget of the sheet (backend/ventas/templates/ventas/parciales/_ficha.html).
 *
 * The way the CodePen dPGYMxJ worked (Engram #541): only the fields of the chosen way show, the
 * thickness shows its number, and the summary under the form updates as the customer types. The
 * number is the store's (ventas:producto_cotizar, JSON): the browser describes the line in words
 * and formats what it is told, and never computes a price. Without this script the form still
 * sends every field, and the cart page shows the price.
 */

type Way = 'weight' | 'money' | 'pieces';

interface WayCopy {
  label: string;
  help: string;
  step: string;
  min: string;
}

const WAYS: Record<Way, WayCopy> = {
  weight: { label: '¿Cuánto quieres?', help: 'Elige kilos, gramos o libras.', step: 'any', min: '0.001' },
  money: { label: '¿Cuánto quieres gastar?', help: 'En pesos: cortamos lo que alcance.', step: 'any', min: '1' },
  pieces: { label: '¿Cuántas piezas?', help: 'Piezas enteras; el peso final lo da la báscula.', step: '1', min: '1' }
};

const PROMPT = 'Escribe la cantidad para ver tu subtotal.';
const UNAVAILABLE = 'No pudimos calcularlo ahora.';
const UNREACHABLE = `${UNAVAILABLE} El subtotal exacto lo ves en tu carrito.`;
/** Long enough that typing "150" asks once, short enough that the number feels live. */
const DEBOUNCE_MS = 250;

interface Quote {
  total: string;
  kg: string;
  error?: string;
}

const money = (value: string | number): string =>
  Number(value).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export function wireConfigurador(): void {
  const form = document.querySelector<HTMLFormElement>('[data-configurador]');
  const amount = form?.querySelector<HTMLInputElement>('[data-cantidad]');
  const summaryText = form?.querySelector<HTMLElement>('[data-resumen-texto]');
  const summaryPrice = form?.querySelector<HTMLElement>('[data-resumen-precio]');
  if (!form || !amount || !summaryText || !summaryPrice) {
    return;
  }

  const label = form.querySelector<HTMLElement>('[data-etiqueta-cantidad]');
  const help = form.querySelector<HTMLElement>('[data-ayuda]');
  const groups = form.querySelectorAll<HTMLElement>('[data-grupo]');
  const thickness = form.querySelector<HTMLInputElement>('[data-grosor]');
  const thicknessValue = form.querySelector<HTMLElement>('[data-grosor-valor]');
  const endpoint = form.dataset.cotizar ?? '';

  const mode = (): Way =>
    (form.querySelector<HTMLInputElement>('[data-modo]:checked')?.value as Way | undefined) ?? 'weight';
  const unit = (): string => form.querySelector<HTMLInputElement>('[name="unit"]:checked')?.value ?? 'kg';

  const describe = (): string => {
    const value = amount.value.trim();
    if (!value) {
      return '';
    }
    if (mode() === 'money') {
      return `${money(value)} de corte`;
    }
    if (mode() === 'weight') {
      return `${value} ${unit()}`;
    }
    const pieces = `${value} ${value === '1' ? 'pieza' : 'piezas'}`;
    return thickness ? `${pieces} de ${thickness.value}"` : pieces;
  };

  const settle = (text: string, price: string): void => {
    summaryText.textContent = text;
    summaryPrice.textContent = price;
    summaryPrice.removeAttribute('aria-busy');
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  let asked = 0;
  let inFlight: AbortController | undefined;

  const quote = (): void => {
    clearTimeout(timer);
    inFlight?.abort();
    const text = describe();
    if (!text || Number(amount.value) <= 0) {
      asked += 1; // an answer still on its way belongs to a question nobody is asking now
      settle(PROMPT, '');
      return;
    }
    summaryText.textContent = text;
    summaryPrice.textContent = '…';
    summaryPrice.setAttribute('aria-busy', 'true');

    timer = setTimeout(async () => {
      asked += 1;
      const ticket = asked;
      const params = new URLSearchParams({ mode: mode(), amount: amount.value.trim() });
      if (mode() === 'weight') {
        params.set('unit', unit());
      }
      if (mode() === 'pieces' && thickness) {
        params.set('thickness_in', thickness.value);
      }
      inFlight = new AbortController();
      try {
        const response = await fetch(`${endpoint}?${params}`, {
          headers: { Accept: 'application/json' },
          signal: inFlight.signal
        });
        const data = (await response.json()) as Quote;
        if (ticket !== asked) {
          return;
        }
        if (!response.ok) {
          settle(data.error || UNAVAILABLE, '');
          return;
        }
        const kilos = Number(data.kg).toLocaleString('es-MX', { maximumFractionDigits: 3 });
        settle(mode() === 'weight' ? text : `${text} · aprox. ${kilos} kg`, money(data.total));
      } catch (error) {
        // A newer keystroke cancelled this request on purpose: its "…" is still on screen and
        // the next request will replace it, so this is not a failure to report.
        if ((error as Error).name === 'AbortError') {
          return;
        }
        if (ticket === asked) {
          settle(UNREACHABLE, '');
        }
      }
    }, DEBOUNCE_MS);
  };

  const showWay = (): void => {
    const way = WAYS[mode()];
    groups.forEach((group) => {
      group.hidden = group.dataset.grupo !== mode();
    });
    if (label) {
      label.textContent = way.label;
    }
    if (help) {
      help.textContent = way.help;
    }
    amount.step = way.step;
    amount.min = way.min;
    amount.inputMode = mode() === 'pieces' ? 'numeric' : 'decimal';
    quote();
  };

  form.addEventListener('change', (event) => {
    if ((event.target as Element).matches('[data-modo]')) {
      showWay();
    } else {
      quote();
    }
  });
  amount.addEventListener('input', quote);
  if (thickness && thicknessValue) {
    thickness.addEventListener('input', () => {
      thicknessValue.textContent = `${thickness.value}"`;
      thickness.setAttribute('aria-valuetext', `${thickness.value} pulgadas`);
      quote();
    });
  }
  showWay();
}
