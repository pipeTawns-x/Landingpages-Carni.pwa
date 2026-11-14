import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render } from '@testing-library/react';
import { FotoAmbiente } from '../FotoAmbiente';

/** `assetUrl` reads `import.meta.env`, which Babel's CommonJS output does not have. */
jest.mock('../assetUrl', () => ({ assetUrl: (ruta: string) => ruta }));

const BASE = '/img/comercio-v1/categoria-pollo';

function foto(props: Partial<React.ComponentProps<typeof FotoAmbiente>> = {}): JSX.Element {
  return (
    <FotoAmbiente
      base={BASE}
      anchoGrande={1344}
      alt=""
      sizes="(min-width: 1024px) 25vw, 50vw"
      width={1344}
      height={768}
      {...props}
    />
  );
}

describe('FotoAmbiente', () => {
  test('asks for both widths of the new photo and lets the browser choose', () => {
    const { container } = render(foto());
    const img = container.querySelector('img');

    expect(img).toHaveAttribute('src', `${BASE}.webp`);
    expect(img).toHaveAttribute('srcset', `${BASE}-800.webp 800w, ${BASE}.webp 1344w`);
    expect(img).toHaveAttribute('sizes', '(min-width: 1024px) 25vw, 50vw');
    expect(img).toHaveAttribute('width', '1344');
    expect(img).toHaveAttribute('height', '768');
  });

  test('is lazy by default and eager with high priority when it is the first thing on screen', () => {
    const normal = render(foto()).container.querySelector('img');
    expect(normal).toHaveAttribute('loading', 'lazy');
    expect(normal).not.toHaveAttribute('fetchpriority');

    const primera = render(foto({ prioridad: true })).container.querySelectorAll('img')[0];
    expect(primera).toHaveAttribute('loading', 'eager');
    expect(primera).toHaveAttribute('fetchpriority', 'high');
  });

  test('keeps the alt text the caller gives, empty meaning decorative', () => {
    const decorativa = render(foto()).container.querySelector('img');
    expect(decorativa).toHaveAttribute('alt', '');

    const informativa = render(foto({ alt: 'Bolsa del mandado vacía sobre el mostrador.' })).container.querySelectorAll(
      'img'
    )[0];
    expect(informativa).toHaveAttribute('alt', 'Bolsa del mandado vacía sobre el mostrador.');
  });

  test('when the new file is missing it falls back to the photo that already existed', () => {
    const alFallar = jest.fn();
    const { container } = render(foto({ respaldo: '/img/products/pollo.webp', alFallar }));

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/img/products/pollo.webp');
    expect(img).not.toHaveAttribute('srcset');
    expect(alFallar).toHaveBeenCalledTimes(1);
  });

  test('when nothing loads it renders nothing, so the container background shows instead of a broken icon', () => {
    const { container } = render(foto({ respaldo: '/img/products/pollo.webp' }));

    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
  });

  test('without a fallback the first failure removes the image and still reports it once', () => {
    const alFallar = jest.fn();
    const { container } = render(foto({ alFallar }));

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
    expect(alFallar).toHaveBeenCalledTimes(1);
  });

  test('art direction: a narrow-screen file replaces the image below its media query, and goes away with it', () => {
    const { container } = render(
      foto({ alternativa: { media: '(max-width: 639px)', base: '/img/comercio-v1/portada-mostrador-vertical' } })
    );

    const fuente = container.querySelector('picture > source');
    expect(fuente).toHaveAttribute('media', '(max-width: 639px)');
    expect(fuente).toHaveAttribute('srcset', '/img/comercio-v1/portada-mostrador-vertical.webp');

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('picture')).toBeNull();
  });
});
