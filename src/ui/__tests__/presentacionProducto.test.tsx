/**
 * Los globales de Jest se importan a mano: `tsconfig.json` fija `types` sin los
 * de Jest, así que `describe` y `expect` no existen para TypeScript aunque sí
 * existan al ejecutar.
 */
import { describe, expect, test } from '@jest/globals';
import semilla from '@src/data/semillaCatalogo.json';
import {
  FOTOS_DE_CATEGORIA,
  FOTOS_VETADAS,
  elegirPresentacion,
  unidadDe,
  type Presentacion
} from '../presentacionProducto';

/**
 * Se prueba contra la copia real del catálogo (la semilla de 53 productos) y no
 * contra datos inventados: lo que importa es que las listas de la landing caigan
 * en la presentación que el diseño espera.
 */
const FILAS = semilla as Array<{ id: number; name: string; image_url: string | null; category_slug: string }>;

function lista(ids: number[]): Array<{ id: number; foto: string | null }> {
  return ids.map((id) => {
    const fila = FILAS.find((f) => f.id === id);
    if (!fila) {
      throw new Error(`El producto ${id} no está en la semilla`);
    }
    return { id, foto: fila.image_url };
  });
}

function presentaciones(ids: number[]): Presentacion[] {
  const mapa = elegirPresentacion(lista(ids));
  return ids.map((id) => mapa.get(id) as Presentacion);
}

describe('elegirPresentacion', () => {
  test('ofertas 40, 41 y 42: la primera con foto propia, las dos de paquete sin imagen', () => {
    expect(presentaciones([40, 41, 42])).toEqual(['foto', 'tipografica', 'tipografica']);
  });

  test('populares 14, 12, 1 y 3: dos fotos propias y dos ilustrativas', () => {
    expect(presentaciones([14, 12, 1, 3])).toEqual(['foto', 'foto', 'ilustrativa', 'ilustrativa']);
  });

  test('los ocho productos de pollo son tipográficos: su foto está vetada', () => {
    const ids = FILAS.filter((f) => f.category_slug === 'pollo').map((f) => f.id);
    expect(ids).toHaveLength(8);
    expect(presentaciones(ids)).toEqual(Array(8).fill('tipografica'));
  });

  test('Rib Eye (8) es tipográfico: su foto muestra otro corte', () => {
    expect(presentaciones([8])).toEqual(['tipografica']);
  });

  test('sin foto, la presentación es tipográfica', () => {
    const mapa = elegirPresentacion([{ id: 99, foto: null }]);
    expect(mapa.get(99)).toBe('tipografica');
  });

  test('una foto de categoría que se repite más de dos veces deja de servir', () => {
    // Las seis de Carnes rojas comparten `res.webp`: demasiadas para una sola lista.
    expect(presentaciones([1, 2, 3])).toEqual(['tipografica', 'tipografica', 'tipografica']);
    // Con dos veces todavía sirve de ilustración.
    expect(presentaciones([1, 2])).toEqual(['ilustrativa', 'ilustrativa']);
  });

  test('la decisión se toma sobre la lista visible: la misma foto cambia de presentación', () => {
    expect(elegirPresentacion(lista([1])).get(1)).toBe('ilustrativa');
    expect(elegirPresentacion(lista([1, 2, 3])).get(1)).toBe('tipografica');
  });

  test('solo cuenta el nombre del archivo: una URL completa o con consulta se reconoce igual', () => {
    const mapa = elegirPresentacion([
      { id: 1, foto: 'https://ejemplo.test/storage/res.webp?v=2' },
      { id: 2, foto: '/img/products/POLLO.webp' },
      { id: 3, foto: 'https://ejemplo.test/storage/propia-del-dueno.webp' }
    ]);
    expect(mapa.get(1)).toBe('ilustrativa');
    expect(mapa.get(2)).toBe('tipografica');
    expect(mapa.get(3)).toBe('foto');
  });

  test('ninguna foto vetada sirve a la vez de ilustración', () => {
    for (const vetada of FOTOS_VETADAS) {
      const mapa = elegirPresentacion([{ id: 1, foto: `/img/products/${vetada}` }]);
      expect(mapa.get(1)).toBe('tipografica');
    }
    expect(FOTOS_DE_CATEGORIA.has('res.webp')).toBe(true);
  });
});

describe('unidadDe', () => {
  test('los paquetes se cobran por paquete', () => {
    expect(unidadDe('Paquete Asador 4 a 6 Personas')).toBe('paquete');
    expect(unidadDe('Paquete Parrillada Familiar 8 a 10 Personas')).toBe('paquete');
    expect(unidadDe('Paquete Familiar de Res')).toBe('paquete');
  });

  test('"Paquete Carnitas por Kilo" se cobra por kilo', () => {
    expect(unidadDe('Paquete Carnitas por Kilo')).toBe('kg');
  });

  test('un corte suelto se cobra por kilo', () => {
    expect(unidadDe('Filete Mignon')).toBe('kg');
    // "Paquete" solo cuenta al inicio del nombre.
    expect(unidadDe('Carne para paquete')).toBe('kg');
  });
});
