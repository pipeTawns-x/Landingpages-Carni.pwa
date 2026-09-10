import { describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import { OrderList } from '@src/components/OrderList/OrderList';
import { renderConProveedores } from '@src/components/__tests__/renderConProveedores';
import { LINEA_GORRA, LINEA_RIB_EYE } from '@src/components/__tests__/lineasDeEjemplo';

const PEDIDO = [LINEA_RIB_EYE, LINEA_GORRA];

describe('OrderList', () => {
  test('pinta una fila por cada linea del pedido', () => {
    renderConProveedores(<OrderList order={PEDIDO} onRemove={jest.fn()} />);

    // Por rol y no por la clase `.order-list__item`: el rol "listitem" es lo
    // que la lista significa para quien la lee, y sobrevive a que alguien
    // renombre la clase o cambie el CSS. Un test que se agarra de la clase se
    // rompe con un refactor visual que no rompio nada de verdad.
    expect(screen.getAllByRole('listitem')).toHaveLength(PEDIDO.length);
  });

  test('cada fila muestra su nombre, su unidad y sus precios', () => {
    renderConProveedores(<OrderList order={PEDIDO} onRemove={jest.fn()} />);

    expect(screen.getByText('Rib Eye')).toBeInTheDocument();
    expect(screen.getByText('1 kg × $450.00')).toBeInTheDocument();
    expect(screen.getByText('$450.00')).toBeInTheDocument();

    // La unidad viaja EN la linea, no se asume. Esta fila tiene unit 'unidad',
    // asi que tiene que decir "2 piezas x $250.00" y nunca "2 kg": cobrar una
    // gorra por kilo fue un error real de este carrito.
    expect(screen.getByText('Gorra con Logo')).toBeInTheDocument();
    expect(screen.getByText('2 piezas × $250.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });
});
