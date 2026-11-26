/**
 * Los globales de Jest se importan a mano: `tsconfig.json` fija `types` sin los
 * de Jest, así que `describe` y `expect` no existen para TypeScript aunque sí
 * existan al ejecutar.
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import type { CategoriaVista } from '@src/data/catalogo';
import { Mostrador } from '@src/landing/Mostrador';

/**
 * `assetUrl` lee `import.meta.env`, que no existe en el CommonJS que genera
 * Babel para Jest. Aquí no se prueba esa resolución: se sustituye por una
 * identidad.
 */
jest.mock('@src/ui/assetUrl', () => ({ assetUrl: (ruta: string) => ruta }));

const CATEGORIAS: CategoriaVista[] = [
  { slug: 'carnes-rojas', nombre: 'Carnes Rojas', orden: 1 },
  { slug: 'cortes-especiales', nombre: 'Cortes Especiales', orden: 2 },
  { slug: 'pollo', nombre: 'Pollo', orden: 3 },
  { slug: 'cerdo', nombre: 'Cerdo', orden: 4 }
];

/**
 * Doble de IntersectionObserver: captura el callback y deja dispararlo a
 * demanda. jsdom no trae la API, y el relevo escalonado depende de ella.
 */
class ObservadorFalso {
  static instancias: ObservadorFalso[] = [];
  private alIntersectar: IntersectionObserverCallback;

  constructor(alIntersectar: IntersectionObserverCallback) {
    this.alIntersectar = alIntersectar;
    ObservadorFalso.instancias.push(this);
  }

  observe(): void {}

  disconnect(): void {}

  unobserve(): void {}

  disparar(isIntersecting: boolean): void {
    this.alIntersectar(
      [{ isIntersecting, boundingClientRect: { top: 0 } } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

function celdas(): HTMLElement[] {
  return screen.getAllByRole('link').filter((enlace) => enlace.hasAttribute('data-celda'));
}

function pintar(): void {
  render(<Mostrador categorias={CATEGORIAS} />);
}

describe('Mostrador — entrada escalonada al bajar', () => {
  beforeEach(() => {
    ObservadorFalso.instancias = [];
    (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
      ObservadorFalso as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    jest.restoreAllMocks();
  });

  test('sin IntersectionObserver las celdas nacen visibles (mejora progresiva)', () => {
    delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    pintar();

    for (const celda of celdas()) {
      expect(celda).toHaveAttribute('data-entrada', 'visible');
    }
  });

  test('en reposo, antes de entrar en pantalla, están pendientes y sin traslado', () => {
    pintar();

    const lista = celdas();
    expect(lista.length).toBe(4);
    for (const celda of lista) {
      expect(celda).toHaveAttribute('data-entrada', 'pendiente');
    }
  });

  test('al entrar en pantalla se revelan, con retraso de 80 ms por celda', () => {
    pintar();

    const [primera] = ObservadorFalso.instancias;
    primera.disparar(true);

    const lista = celdas();
    lista.forEach((celda, i) => {
      expect(celda).toHaveAttribute('data-entrada', 'visible');
      expect(celda.style.transitionDelay).toBe(`${i * 80}ms`);
    });
  });

  test('el observador se desconecta tras el primer aviso: el relevo es de una sola vez', () => {
    pintar();

    const [primera] = ObservadorFalso.instancias;
    let desconectado = false;
    primera.disconnect = () => {
      desconectado = true;
    };
    primera.disparar(true);

    expect(desconectado).toBe(true);
  });

  test('con movimiento reducido no se esconden nunca', () => {
    const original = window.matchMedia;
    window.matchMedia = ((consulta: string) => ({
      matches: consulta.includes('prefers-reduced-motion')
    })) as unknown as typeof window.matchMedia;
    pintar();

    for (const celda of celdas()) {
      expect(celda).toHaveAttribute('data-entrada', 'visible');
    }
    window.matchMedia = original;
  });
});
