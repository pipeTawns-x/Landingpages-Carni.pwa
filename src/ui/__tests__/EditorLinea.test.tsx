import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { OrderLine, SolicitudLinea } from '@src/types/database';
import { EditorLinea } from '../EditorLinea';

const BISTEC: OrderLine = {
  lineId: 'bistec-1',
  productId: 1,
  name: 'Bistec de Res',
  pricePerKg: 200,
  quantity: 1,
  image: '/img/products/res.webp',
  categorySlug: 'carnes-rojas',
  unit: 'kg'
};

/** A cut the old cart stored with an average piece weight: it can also be sold by piece. */
const BISTEC_POR_PIEZA: OrderLine = {
  ...BISTEC,
  legacy: { id: 1, name: 'Bistec de Res', price: 200, tipo: 'kg', avgPieceWeightKg: 0.15 }
};

const GORRA: OrderLine = {
  lineId: 'gorra-1',
  productId: 99,
  name: 'Gorra',
  pricePerKg: 250,
  quantity: 2,
  image: '/img/products/gorra.webp',
  categorySlug: 'merch',
  unit: 'unidad'
};

function montar(linea: OrderLine): { alGuardar: jest.Mock<(s: SolicitudLinea, c: number) => void> } {
  const alGuardar = jest.fn<(s: SolicitudLinea, c: number) => void>();
  render(<EditorLinea linea={linea} alGuardar={alGuardar} />);
  return { alGuardar };
}

describe('EditorLinea', () => {
  test('is a radio group that offers only the ways the product can be sold', () => {
    montar(BISTEC);

    expect(screen.getByRole('radiogroup', { name: 'Cómo quieres pedirlo' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['money', 'weight']);
  });

  test('merchandise is only ever sold by piece: no money, no weight', () => {
    montar(GORRA);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(1);
    expect(screen.getByRole('radio', { name: 'Por piezas' })).toBeChecked();
    expect(screen.queryByRole('radio', { name: 'Por dinero' })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Por peso' })).toBeNull();
  });

  test('a cut with a piece weight also offers pieces', () => {
    montar(BISTEC_POR_PIEZA);

    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['money', 'weight', 'pieces']);
  });

  test('starts on how the line was already asked for', () => {
    montar(BISTEC);

    expect(screen.getByRole('radio', { name: 'Por peso' })).toBeChecked();
    expect(screen.getByLabelText('Peso')).toHaveValue('1');
  });

  test('by money: $100 of a $200 kilo is half a kilo, and the line is saved with the exact D7 shape', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(BISTEC);

    await usuario.click(screen.getByRole('radio', { name: 'Por dinero' }));
    await usuario.type(screen.getByLabelText('¿Cuánto quieres gastar? (pesos)'), '100');

    expect(alGuardar).toHaveBeenLastCalledWith(
      { product_id: 1, mode: 'money', amount: '100', unit: null, thickness_in: null, note: null },
      0.5
    );
    expect(screen.getByRole('status')).toHaveTextContent('Estimado: 0.500 kg');
    expect(screen.getByRole('status')).toHaveTextContent('$100.00');
  });

  test('by weight in pounds: 1 lb is 0.454 kg and $90.72, computed from the exact weight', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(BISTEC);

    await usuario.selectOptions(screen.getByLabelText('Unidad'), 'lb');
    await usuario.clear(screen.getByLabelText('Peso'));
    await usuario.type(screen.getByLabelText('Peso'), '1');

    expect(alGuardar).toHaveBeenLastCalledWith(
      { product_id: 1, mode: 'weight', amount: '1', unit: 'lb', thickness_in: null, note: null },
      0.454
    );
    expect(screen.getByRole('status')).toHaveTextContent('$90.72');
  });

  test('by pieces: 3 pieces of 150 g are 0.450 kg and $90.00', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(BISTEC_POR_PIEZA);

    await usuario.click(screen.getByRole('radio', { name: 'Por piezas' }));
    await usuario.type(screen.getByLabelText('Piezas'), '3');

    expect(alGuardar).toHaveBeenLastCalledWith(
      { product_id: 1, mode: 'pieces', amount: '3', unit: null, thickness_in: null, note: null },
      0.45
    );
    expect(screen.getByRole('status')).toHaveTextContent('$90.00');
  });

  test('a piece-priced product reports pieces, not kilos', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(GORRA);

    await usuario.clear(screen.getByLabelText('Piezas'));
    await usuario.type(screen.getByLabelText('Piezas'), '3');

    expect(alGuardar).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'pieces', amount: '3' }), 3);
    expect(screen.getByRole('status')).toHaveTextContent('Estimado: 3 piezas');
    expect(screen.getByRole('status')).toHaveTextContent('$750.00');
  });

  test('zero is announced as an error and nothing is saved for it', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(BISTEC);

    await usuario.clear(screen.getByLabelText('Peso'));
    await usuario.type(screen.getByLabelText('Peso'), '0');

    expect(screen.getByRole('alert')).toHaveTextContent('Escribe una cantidad mayor que cero.');
    expect(screen.getByLabelText('Peso')).toHaveAttribute('aria-invalid', 'true');
    expect(alGuardar).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('half-typed numbers do not flash an error, and a decimal comma is understood', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(BISTEC);

    await usuario.clear(screen.getByLabelText('Peso'));
    await usuario.type(screen.getByLabelText('Peso'), '0,');
    expect(screen.getByRole('alert')).toBeInTheDocument(); // "0" is still not a valid amount

    await usuario.type(screen.getByLabelText('Peso'), '5');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(alGuardar).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'weight', amount: '0.5' }), 0.5);
  });

  test('pieces must be whole numbers', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(GORRA);

    await usuario.clear(screen.getByLabelText('Piezas'));
    await usuario.type(screen.getByLabelText('Piezas'), '2.5');

    expect(screen.getByRole('alert')).toHaveTextContent('Las piezas son un número entero, mayor que cero.');
    expect(alGuardar).not.toHaveBeenCalledWith(expect.objectContaining({ amount: '2.5' }), expect.anything());
  });

  test('the counter note travels with the request', async () => {
    const usuario = userEvent.setup();
    const { alGuardar } = montar(BISTEC);

    await usuario.type(screen.getByLabelText('Nota para el mostrador (opcional)'), 'sin grasa');

    expect(alGuardar).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'weight', amount: '1', note: 'sin grasa' }), 1);
  });
});
