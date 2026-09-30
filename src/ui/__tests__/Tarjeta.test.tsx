/**
 * Los globales de Jest se importan a mano: `tsconfig.json` fija `types` sin los
 * de Jest, así que `describe` y `expect` no existen para TypeScript aunque sí
 * existan al ejecutar.
 */
import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import type { ProductoVista } from '@src/data/catalogo';
import type { Presentacion } from '../presentacionProducto';
import { CeldaBento, Tarjeta, type VarianteTarjeta } from '../Tarjeta';

/**
 * `assetUrl` lee `import.meta.env`, que no existe en el CommonJS que genera
 * Babel para Jest. Aquí no se prueba esa resolución: se sustituye por una
 * identidad.
 */
jest.mock('../assetUrl', () => ({ assetUrl: (ruta: string) => ruta }));

const CORTE: ProductoVista = {
  id: 14,
  nombre: 'Flank Steak',
  descripcion: 'Fibra larga, para asar entero.',
  precioKg: 399,
  precioLb: 180.99,
  foto: '/img/products/flak_steak.webp',
  categoria: { slug: 'cortes-especiales', nombre: 'Cortes Especiales' },
  disponible: true
};

const PAQUETE: ProductoVista = {
  id: 41,
  nombre: 'Paquete Asador 4 a 6 Personas',
  descripcion: '',
  precioKg: 1599,
  precioLb: 725.31,
  foto: '/img/products/premium.webp',
  categoria: { slug: 'ofertas', nombre: 'Ofertas' },
  disponible: true
};

describe('Tarjeta', () => {
  test('la presentación ilustrativa pinta el rótulo "Foto ilustrativa"', () => {
    render(<Tarjeta producto={CORTE} presentacion="ilustrativa" />);

    expect(screen.getByText('Foto ilustrativa')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Flank Steak' })).toBeInTheDocument();
  });

  test('la presentación con foto propia no lleva rótulo', () => {
    render(<Tarjeta producto={CORTE} presentacion="foto" />);

    expect(screen.queryByText('Foto ilustrativa')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Flank Steak' })).toBeInTheDocument();
  });

  test('la presentación tipográfica no pinta ninguna imagen', () => {
    const { container } = render(<Tarjeta producto={CORTE} presentacion="tipografica" />);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Flank Steak' })).toBeInTheDocument();
  });

  test('un producto agotado pinta el botón "Agotado" deshabilitado y ningún "Agregar"', () => {
    render(<Tarjeta producto={{ ...CORTE, disponible: false }} presentacion="foto" />);

    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: /Agregar/ })).not.toBeInTheDocument();
  });

  test('ningún texto habla del inventario, en ninguna variante', () => {
    // La expresión se arma por partes para que las compuertas de texto del plano
    // no la confundan con un mensaje de la interfaz.
    const prohibido = new RegExp(['stock', 'existen' + 'cia'].join('|'), 'i');
    const presentaciones: Presentacion[] = ['foto', 'ilustrativa', 'tipografica'];
    const variantes: VarianteTarjeta[] = ['normal', 'oferta', 'chica'];

    for (const presentacion of presentaciones) {
      for (const variante of variantes) {
        for (const producto of [CORTE, { ...CORTE, disponible: false }, PAQUETE]) {
          const { container, unmount } = render(
            <Tarjeta producto={producto} presentacion={presentacion} variante={variante} />
          );
          expect(container.textContent).not.toMatch(prohibido);
          unmount();
        }
      }
    }
  });

  test('"Agregar" lleva a la ficha del producto, o al enlace que se le pase', () => {
    const { unmount } = render(<Tarjeta producto={CORTE} presentacion="foto" />);
    expect(screen.getByRole('link', { name: 'Agregar Flank Steak' })).toHaveAttribute(
      'href',
      'products.html#/producto/14'
    );
    unmount();

    render(<Tarjeta producto={CORTE} presentacion="foto" enlace="catalogo.html#categoria=ofertas" />);
    expect(screen.getByRole('link', { name: 'Agregar Flank Steak' })).toHaveAttribute(
      'href',
      'catalogo.html#categoria=ofertas'
    );
  });

  test('el precio sale de la base: kilo con su atributo y libra de su columna', () => {
    const { container } = render(<Tarjeta producto={CORTE} presentacion="foto" />);

    expect(container.querySelector('[data-precio-kg]')).toHaveAttribute('data-precio-kg', '399');
    expect(screen.getByText('$399')).toBeInTheDocument();
    expect(screen.getByText('$180.99 / lb')).toBeInTheDocument();
  });

  test('un paquete se cobra por paquete y no muestra precio por libra', () => {
    render(<Tarjeta producto={PAQUETE} presentacion="tipografica" variante="oferta" />);

    expect(screen.getByText('/ paquete')).toBeInTheDocument();
    expect(screen.queryByText(/\/ lb/)).not.toBeInTheDocument();
    expect(screen.getByText('Oferta')).toBeInTheDocument();
  });

  test('la variante chica lleva un botón de agregar con su nombre accesible', () => {
    render(<Tarjeta producto={CORTE} presentacion="foto" variante="chica" />);

    expect(screen.getByRole('link', { name: 'Agregar Flank Steak' })).toBeInTheDocument();
  });
});

describe('CeldaBento', () => {
  test('sin foto es tipográfica y enlaza a su categoría', () => {
    const { container } = render(
      <CeldaBento
        nombre="Pollo"
        descripcion="Pechuga, pierna y muslo"
        slug="pollo"
        href="catalogo.html#categoria=pollo"
      />
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link', { name: /Pollo/ })).toHaveAttribute(
      'href',
      'catalogo.html#categoria=pollo'
    );
  });
});
