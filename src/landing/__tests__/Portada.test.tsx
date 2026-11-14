import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { Portada } from '../Portada';

/** `assetUrl` reads `import.meta.env`, which Babel's CommonJS output does not have. */
jest.mock('../../ui/assetUrl', () => ({ assetUrl: (ruta: string) => ruta }));

/**
 * jsdom has no `matchMedia`. With reduced motion on, the hero never tries to
 * autoplay (no IntersectionObserver involved), which is all these tests need.
 */
beforeEach(() => {
  window.matchMedia = ((consulta: string) => ({
    matches: consulta.includes('prefers-reduced-motion'),
    media: consulta,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false
  })) as typeof window.matchMedia;
});

describe('Portada', () => {
  test('keeps its one action and gives the headline a single emphasised word', () => {
    render(<Portada />);

    const titular = screen.getByRole('heading', { level: 1 });
    expect(titular).toHaveTextContent('Cortes frescos, del mostrador a tu mesa');
    expect(titular.querySelector('em')).toHaveTextContent('frescos');
    expect(screen.getByRole('link', { name: 'Ver productos' })).toHaveAttribute('href', 'catalogo.html');
  });

  test('shows the new counter photo at both widths, with a portrait crop for phones', () => {
    const { container } = render(<Portada />);

    const img = container.querySelector('#portada img');
    expect(img).toHaveAttribute(
      'srcset',
      '/img/comercio-v1/portada-mostrador-800.webp 800w, /img/comercio-v1/portada-mostrador.webp 1344w'
    );
    // Decorative: the headline next to it already says what the page is.
    expect(img).toHaveAttribute('alt', '');
    expect(container.querySelector('picture > source')).toHaveAttribute('media', '(max-width: 639px)');
    expect(container.querySelector('picture > source')).toHaveAttribute(
      'srcset',
      '/img/comercio-v1/portada-mostrador-vertical.webp'
    );
  });

  test('with the new photo there is nothing to play, so there is no video and no video control', () => {
    const { container } = render(<Portada />);

    expect(container.querySelector('video')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('draws the tile band on the hero edge, hidden from assistive technology', () => {
    const { container } = render(<Portada />);

    const banda = container.querySelector('#portada svg[aria-hidden="true"] pattern');
    expect(banda).not.toBeNull();
  });

  test('if the new photo is not there yet it returns to the classic poster and video, with its control', () => {
    const { container } = render(<Portada />);

    fireEvent.error(container.querySelector('#portada img') as HTMLImageElement);

    expect(container.querySelector('#portada img')).toBeNull();
    const video = container.querySelector('video');
    expect(video).toHaveAttribute('poster', '/img/Videos/portada-carne-poster.webp');
    expect(Array.from(video?.querySelectorAll('source') ?? []).map((s) => s.getAttribute('src'))).toEqual([
      '/img/Videos/portada-carne-720.mp4',
      '/img/Videos/portada-carne-360.mp4'
    ]);
    expect(screen.getByRole('button', { name: 'Reproducir el video' })).toBeInTheDocument();
  });

  test('keeps the sentinel the header watches to turn solid', () => {
    const { container } = render(<Portada />);

    expect(container.querySelector('#fin-portada')).toHaveAttribute('aria-hidden', 'true');
  });
});
