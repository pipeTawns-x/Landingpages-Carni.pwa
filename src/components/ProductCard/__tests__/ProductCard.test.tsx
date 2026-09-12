import { describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import { ProductCard } from '@src/components/ProductCard/ProductCard';
import type { Product } from '@src/types/database';
import { renderConProveedores } from '@src/components/__tests__/renderConProveedores';

/**
 * `@src/entry/shared` se reemplaza por un doble, y no por comodidad.
 *
 * ProductCard solo necesita `assetUrl` de ese modulo, pero el modulo entero
 * hace dos cosas que Jest no puede cargar:
 *
 * 1. Lee `import.meta.env.BASE_URL`. `import.meta` es sintaxis de modulo ESM y
 *    los tests se compilan a CommonJS, asi que ni siquiera llega a ejecutarse:
 *    falla al analizar el archivo.
 * 2. Arrastra el cliente de Supabase y `react-dom/client` al importarse, o sea
 *    red y montaje real, dentro de un test de una tarjeta.
 *
 * El doble devuelve la ruta tal cual, que es EXACTAMENTE lo que hace la funcion
 * real en produccion (Netlify sirve desde la raiz, BASE_URL es "/"). Lo que se
 * pierde es el caso de GitHub Pages, y ese le toca a un test de `assetUrl`, no
 * a uno de ProductCard.
 */
jest.mock('@src/entry/shared', () => ({
  assetUrl: (ruta: string) => ruta
}));

const RIB_EYE: Product = {
  id: 7,
  name: 'Rib Eye',
  description: 'Corte de costilla con marmoleo parejo, madurado en seco.',
  price_per_kg: 449,
  stock: 12,
  category_id: 2,
  image_url: '/img/products/rib-eye.webp',
  is_active: true,
  categories: { id: 2, name: 'Cortes Especiales', slug: 'cortes-especiales' }
};

describe('ProductCard', () => {
  test('muestra el nombre y el precio del producto', () => {
    renderConProveedores(<ProductCard product={RIB_EYE} size="medium" />);

    // Por rol de encabezado: el nombre no es un texto suelto en la tarjeta, es
    // su titulo, y eso es parte de lo que se esta probando.
    expect(screen.getByRole('heading', { name: RIB_EYE.name })).toBeInTheDocument();
    // Sin centavos: la tarjeta del catalogo formatea con maximumFractionDigits 0.
    expect(screen.getByText('$449')).toBeInTheDocument();
    // La unidad se deduce de la categoria, no del precio. Un corte va por kilo.
    expect(screen.getByText('/ kg')).toBeInTheDocument();
  });

  /**
   * ADAPTACION del ejemplo del enunciado.
   *
   * El ejemplo prueba que el boton de agregar llame a `onAddToCart` con el id.
   * Esta tarjeta NO tiene esa prop y no es un olvido: agregar desde el catalogo
   * metia un kilo entero sin preguntar, asi que "Agregar" dejo de ser un boton
   * con callback y paso a ser un ENLACE a la ficha, donde el cliente elige peso,
   * piezas o presupuesto. Nada entra al pedido sin pasar por ahi.
   *
   * Probar un `onAddToCart` inexistente seria copiar la estructura del ejemplo y
   * dejar sin probar la funcionalidad real. Lo que hay que garantizar es que el
   * control lleve al producto correcto: si el id se arma mal, el cliente termina
   * configurando otro corte.
   */
  test('el control de agregar lleva a la ficha de ese producto', () => {
    renderConProveedores(<ProductCard product={RIB_EYE} size="medium" />);

    const enlace = screen.getByRole('link', { name: /configurar y agregar rib eye/i });

    expect(enlace).toHaveTextContent('Agregar');
    expect(enlace).toHaveAttribute('href', `/producto/${RIB_EYE.id}`);
  });
});

/**
 * Los caminos que la tarjeta toma cuando el dato NO viene completo.
 *
 * Estos casos existen porque el catalogo real los tiene: productos sin foto
 * propia, categorias que se venden por pieza y no por kilo, y filas donde
 * `categories` llega como arreglo en vez de objeto segun como se hizo la
 * consulta. Ninguno de los tres es un caso raro de laboratorio: los tres estan
 * hoy en la base de la carniceria.
 */
describe('ProductCard — cuando el dato viene incompleto', () => {
  test('sin foto propia cae en una del repertorio en vez de romper la tarjeta', () => {
    const sinFoto: Product = { ...RIB_EYE, id: 3, image_url: null };
    renderConProveedores(<ProductCard product={sinFoto} size="medium" />);

    const img = screen.getByRole('img', { name: sinFoto.name });
    /* Lo que importa no es CUAL foto sale, sino que salga alguna: un `src`
       vacio deja el hueco roto del icono de imagen en el catalogo. */
    expect(img).toHaveAttribute('src', expect.stringContaining('/img/products/'));
  });

  test('la unidad sale de la categoria: merch se vende por pieza', () => {
    const gorra: Product = {
      ...RIB_EYE,
      id: 21,
      name: 'Gorra con Logo',
      price_per_kg: 250,
      categories: { id: 8, name: 'Merch', slug: 'merch' }
    };
    renderConProveedores(<ProductCard product={gorra} size="small" />);

    expect(screen.getByText('/ pieza')).toBeInTheDocument();
  });

  test('un paquete de ofertas se vende por paquete, no por kilo', () => {
    const paquete: Product = {
      ...RIB_EYE,
      id: 44,
      name: 'Paquete Asador',
      price_per_lb: null,
      categories: { id: 9, name: 'Ofertas', slug: 'ofertas' }
    };
    renderConProveedores(<ProductCard product={paquete} size="large" />);

    expect(screen.getByText('/ paquete')).toBeInTheDocument();
  });

  test('categories como arreglo se lee igual que como objeto', () => {
    /* Segun como se arme el `select` de PostgREST, la relacion vuelve como
       objeto o como arreglo. La tarjeta tiene que sobrevivir a las dos. */
    const comoArreglo = {
      ...RIB_EYE,
      id: 5,
      categories: [{ id: 2, name: 'Cortes Especiales', slug: 'cortes-especiales' }]
    } as unknown as Product;
    renderConProveedores(<ProductCard product={comoArreglo} size="medium" />);

    expect(screen.getByText('Cortes Especiales')).toBeInTheDocument();
  });

  test('sin categoria muestra el texto de respaldo y no un hueco', () => {
    const huerfano = { ...RIB_EYE, id: 9, categories: null } as unknown as Product;
    renderConProveedores(<ProductCard product={huerfano} size="medium" />);

    expect(screen.getByText('Corte especial')).toBeInTheDocument();
  });
});
