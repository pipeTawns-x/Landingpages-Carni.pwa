/**
 * Los globales de Jest se importan a mano.
 *
 * `tsconfig.json` fija `types: ["node", "react", "react-dom"]`, y esa lista NO
 * incluye los tipos de Jest, asi que `describe` y `expect` no existen para
 * TypeScript aunque si existan al ejecutar. Importarlos de @jest/globals es lo
 * que deja pasar `npm run ts:check` sin tener que tocar el tsconfig del
 * proyecto entero por culpa de los tests.
 */
import { describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartPanel } from '@src/components/CartPanel/CartPanel';
import { renderConProveedores } from '@src/components/__tests__/renderConProveedores';
import {
  LINEA_GORRA,
  LINEA_RIB_EYE,
  TOTAL_DEL_PEDIDO
} from '@src/components/__tests__/lineasDeEjemplo';

const PEDIDO = [LINEA_RIB_EYE, LINEA_GORRA];

describe('CartPanel', () => {
  test('renderiza las lineas que recibe por la prop order', () => {
    renderConProveedores(
      <CartPanel
        isOpen
        order={PEDIDO}
        total={TOTAL_DEL_PEDIDO}
        onClose={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    // `screen` consulta document.body, no el contenedor que devuelve render(),
    // y eso es justo lo que hace falta aqui: CartPanel se dibuja con
    // createPortal(..., document.body) para escapar del contexto de apilamiento
    // de su padre. Buscando dentro del contenedor no se encontraria nada.
    expect(screen.getByText(LINEA_RIB_EYE.name)).toBeInTheDocument();
    expect(screen.getByText(LINEA_GORRA.name)).toBeInTheDocument();
    // El encabezado es responsabilidad de CartPanel, no de OrderList: cuenta
    // LINEAS, no unidades, aunque la gorra lleve cantidad 2.
    expect(screen.getByText('2 productos')).toBeInTheDocument();
  });

  test('muestra el mensaje de vacio cuando el pedido no tiene lineas', () => {
    renderConProveedores(
      <CartPanel isOpen order={[]} total={0} onClose={jest.fn()} onRemove={jest.fn()} />
    );

    // Por texto parcial: la frase completa sigue con "Agrega cortes desde el
    // catalogo..." y atarse a la redaccion entera haria fallar el test por una
    // coma que alguien mueva.
    expect(screen.getByText(/tu pedido está vacío/i)).toBeInTheDocument();
    // Un pedido vacio no se puede continuar. Es el mismo estado, por eso va en
    // el mismo test y no en uno aparte.
    expect(screen.getByRole('button', { name: /continuar con el pedido/i })).toBeDisabled();
  });

  test('el boton de quitar llama a onRemove con el lineId de esa linea', async () => {
    const onRemove = jest.fn<(lineId: string) => void>();
    const usuario = userEvent.setup();

    renderConProveedores(
      <CartPanel
        isOpen
        order={PEDIDO}
        total={TOTAL_DEL_PEDIDO}
        onClose={jest.fn()}
        onRemove={onRemove}
      />
    );

    // Se busca por nombre accesible, que es lo que oye un lector de pantalla.
    // Los dos botones de quitar dibujan el mismo caracter "x", asi que por
    // texto visible serian indistinguibles; el aria-label lleva el nombre del
    // producto y por eso se puede apuntar a la fila correcta.
    await usuario.click(screen.getByRole('button', { name: /quitar gorra con logo del pedido/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(LINEA_GORRA.lineId);
  });

  test('muestra el total del pedido formateado en pesos mexicanos', () => {
    renderConProveedores(
      <CartPanel
        isOpen
        order={PEDIDO}
        total={TOTAL_DEL_PEDIDO}
        onClose={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    // $950.00 es el total; las lineas valen $450.00 y $500.00, asi que la
    // cadena es unica en el documento y getByText no puede confundirse.
    expect(screen.getByText('$950.00')).toBeInTheDocument();
  });
});
