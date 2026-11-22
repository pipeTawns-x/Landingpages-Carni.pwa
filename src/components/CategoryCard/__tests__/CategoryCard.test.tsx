import { describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import { CategoryCard } from '@src/components/CategoryCard/CategoryCard';
import type { Category } from '@src/entry/shared';
import { renderConProveedores } from '@src/components/__tests__/renderConProveedores';

// Same double as ProductCard's test: the real module reads import.meta.env and
// pulls in the Supabase client, neither of which Jest can load.
jest.mock('@src/entry/shared', () => ({
  assetUrl: (ruta: string) => ruta
}));

function categoria(slug: string): Category {
  return { id: 1, name: 'Res', slug, image_url: null, order: 1 };
}

describe('CategoryCard link to the catalog', () => {
  test('encodes the slug so reserved characters cannot change the query string', () => {
    renderConProveedores(<CategoryCard category={categoria('res & cerdo?x=1')} position={1} />);

    const enlace = screen.getByRole('link', { name: 'Ver Productos' });

    expect(enlace.getAttribute('href')).toBe(
      'products.html?categoria=res%20%26%20cerdo%3Fx%3D1'
    );
  });

  test('keeps a plain database slug unchanged', () => {
    renderConProveedores(<CategoryCard category={categoria('cortes-premium')} position={2} />);

    const enlace = screen.getByRole('link', { name: 'Ver Productos' });

    expect(enlace.getAttribute('href')).toBe('products.html?categoria=cortes-premium');
  });
});
