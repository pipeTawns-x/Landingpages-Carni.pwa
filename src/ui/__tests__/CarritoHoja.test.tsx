import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { LLAVE_PEDIDO } from '@src/lib/pedidoStorage';
import { vaciarCarrito } from '@src/redux/slices/carritoSlice';
import { store } from '@src/redux/store';
import { CarritoHoja } from '../CarritoHoja';

/** `assetUrl` reads `import.meta.env`, which Babel's CommonJS output does not have. */
jest.mock('../assetUrl', () => ({ assetUrl: (ruta: string) => ruta }));

/** The real search slice pulls in the Supabase client (also `import.meta.env`). The cart does not need it. */
jest.mock('@src/redux/slices/busquedaSlice', () => ({ __esModule: true, default: (estado = {}) => estado }));

/** jsdom has no `matchMedia`; `usePedido` listens to one to decide whether to lock the page scroll. */
beforeEach(() => {
  window.matchMedia = ((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false
  })) as typeof window.matchMedia;
  store.dispatch(vaciarCarrito());
  window.localStorage.clear();
});

/** What `cart.js` writes for one kilo of steak. */
function guardarPedido(): void {
  window.localStorage.setItem(
    LLAVE_PEDIDO,
    JSON.stringify([
      { id: 1, name: 'Bistec de Res', price: 200, img: '/img/products/res.webp', tipo: 'kg', peso: 1, piezas: 0, categoria: 'carnes-rojas' }
    ])
  );
}

function montar(): void {
  render(
    <Provider store={store}>
      <CarritoHoja abierta alCerrar={() => undefined} />
    </Provider>
  );
}

describe('CarritoHoja', () => {
  test('an empty order says so and points to the catalogue (unchanged)', () => {
    montar();

    expect(screen.getByText('Tu pedido está vacío.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver productos' })).toHaveAttribute('href', 'catalogo.html');
  });

  test('the empty state shows the empty-bag illustration with its alt text, at both widths', () => {
    montar();

    const img = screen.getByRole('img', { name: 'Bolsa del mandado vacía sobre el mostrador.' });
    expect(img).toHaveAttribute(
      'srcset',
      '/img/comercio-v1/vacio-carrito-800.webp 800w, /img/comercio-v1/vacio-carrito.webp 1152w'
    );
  });

  test('a line keeps showing its quantity, unit price and approximate total (unchanged)', () => {
    guardarPedido();
    montar();

    expect(screen.getByText(/1 kg ×/)).toBeInTheDocument();
    expect(screen.getByText('Total aproximado')).toBeInTheDocument();
    expect(screen.getAllByText('$200.00').length).toBeGreaterThan(0);
  });

  test('removing a line still empties the order (unchanged)', async () => {
    const usuario = userEvent.setup();
    guardarPedido();
    montar();

    await usuario.click(screen.getByRole('button', { name: 'Quitar Bistec de Res' }));

    expect(screen.getByText('Tu pedido está vacío.')).toBeInTheDocument();
  });

  test('the editor opens under its own line and closes again', async () => {
    const usuario = userEvent.setup();
    guardarPedido();
    montar();

    const boton = screen.getByRole('button', { name: 'Editar Bistec de Res' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('radiogroup')).toBeNull();

    await usuario.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('radiogroup', { name: 'Cómo quieres pedirlo' })).toBeInTheDocument();

    await usuario.click(boton);
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  test('asking for $100 of steak turns the line into half a kilo and moves the total, and it persists', async () => {
    const usuario = userEvent.setup();
    guardarPedido();
    montar();

    await usuario.click(screen.getByRole('button', { name: 'Editar Bistec de Res' }));
    await usuario.click(screen.getByRole('radio', { name: 'Por dinero' }));
    await usuario.type(screen.getByLabelText('¿Cuánto quieres gastar? (pesos)'), '100');

    expect(screen.getByText(/0\.5 kg ×/)).toBeInTheDocument();
    const pie = screen.getByText('Total aproximado').parentElement as HTMLElement;
    expect(within(pie).getByText('$100.00')).toBeInTheDocument();

    const guardado = JSON.parse(window.localStorage.getItem(LLAVE_PEDIDO) ?? '[]') as Array<Record<string, unknown>>;
    expect(guardado[0]).toMatchObject({
      peso: 0.5,
      solicitud: { product_id: 1, mode: 'money', amount: '100', unit: null, thickness_in: null, note: null }
    });
  });
});
