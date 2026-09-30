/**
 * Los globales de Jest se importan a mano: `tsconfig.json` fija `types` sin los
 * de Jest, así que `describe` y `expect` no existen para TypeScript aunque sí
 * existan al ejecutar.
 */
import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hoja } from '../Hoja';

/**
 * jsdom no implementa `showModal()` ni `close()` del `<dialog>`. Este polyfill
 * mínimo hace lo justo para probar el comportamiento de la Hoja: abrir pone el
 * atributo `open`; cerrar lo quita y despacha `close`, como el navegador.
 */
beforeAll(() => {
  const prototipo = HTMLDialogElement.prototype;

  if (typeof prototipo.showModal !== 'function') {
    prototipo.showModal = function showModal(this: HTMLDialogElement): void {
      this.setAttribute('open', '');
    };
  }
  if (typeof prototipo.close !== 'function') {
    prototipo.close = function close(this: HTMLDialogElement): void {
      if (!this.hasAttribute('open')) {
        return;
      }
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
});

function pintar(abierta = true, alCerrar: () => void = jest.fn<() => void>()) {
  const propiedades = {
    alCerrar,
    titulo: 'Tu pedido',
    etiquetaCerrar: 'Cerrar el pedido',
    nombre: 'carrito'
  };

  const resultado = render(
    <Hoja abierta={abierta} {...propiedades}>
      <p>Contenido de la hoja</p>
    </Hoja>
  );

  return {
    ...resultado,
    volverAPintar: (nuevaAbierta: boolean) =>
      resultado.rerender(
        <Hoja abierta={nuevaAbierta} {...propiedades}>
          <p>Contenido de la hoja</p>
        </Hoja>
      )
  };
}

describe('Hoja', () => {
  test('pinta el título y la etiqueta específica de la X', () => {
    pintar();

    expect(screen.getByRole('dialog', { name: 'Tu pedido' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tu pedido' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar el pedido' })).toBeInTheDocument();
  });

  test('el diálogo lleva su nombre en data-superposicion y un id derivado', () => {
    pintar();

    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveAttribute('data-superposicion', 'carrito');
    expect(dialogo).toHaveAttribute('id', 'hoja-carrito');
  });

  test('la X cierra y llama a alCerrar una sola vez', async () => {
    const alCerrar = jest.fn<() => void>();
    pintar(true, alCerrar);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar el pedido' }));

    expect(alCerrar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('un clic que empieza y termina en el fondo cierra', () => {
    const alCerrar = jest.fn<() => void>();
    pintar(true, alCerrar);

    const dialogo = screen.getByRole('dialog');
    fireEvent.pointerDown(dialogo);
    fireEvent.click(dialogo);

    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  test('un clic dentro del contenido no cierra', () => {
    const alCerrar = jest.fn<() => void>();
    pintar(true, alCerrar);

    const contenido = screen.getByText('Contenido de la hoja');
    fireEvent.pointerDown(contenido);
    fireEvent.click(contenido);

    expect(alCerrar).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('empezar a seleccionar dentro y soltar en el fondo no cierra', () => {
    const alCerrar = jest.fn<() => void>();
    pintar(true, alCerrar);

    fireEvent.pointerDown(screen.getByText('Contenido de la hoja'));
    fireEvent.click(screen.getByRole('dialog'));

    expect(alCerrar).not.toHaveBeenCalled();
  });

  test('abierta=false la cierra y avisa una sola vez', () => {
    const alCerrar = jest.fn<() => void>();
    const { volverAPintar } = pintar(true, alCerrar);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    volverAPintar(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  test('bajo StrictMode abre el diálogo una sola vez', () => {
    const abrir = jest.spyOn(HTMLDialogElement.prototype, 'showModal');
    abrir.mockClear();

    render(
      <StrictMode>
        <Hoja abierta alCerrar={jest.fn<() => void>()} titulo="Menú" etiquetaCerrar="Cerrar el menú" nombre="menu">
          <p>Enlaces</p>
        </Hoja>
      </StrictMode>
    );

    expect(abrir).toHaveBeenCalledTimes(1);
    abrir.mockRestore();
  });

  test('con descripción, el diálogo la usa como su descripción accesible', () => {
    render(
      <Hoja
        abierta
        alCerrar={jest.fn<() => void>()}
        titulo="Menú"
        etiquetaCerrar="Cerrar el menú"
        nombre="menu"
        descripcion="Navega por la tienda"
      >
        <p>Enlaces</p>
      </Hoja>
    );

    expect(screen.getByRole('dialog', { name: 'Menú', description: 'Navega por la tienda' })).toBeInTheDocument();
  });
});
