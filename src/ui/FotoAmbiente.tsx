import { useState, type CSSProperties } from 'react';
import { assetUrl } from './assetUrl';

/** React 18 does not know `fetchPriority` and warns; the lowercase attribute reaches the browser as is. */
const PRIORIDAD_ALTA: Record<string, string> = { fetchpriority: 'high' };

type Paso = 'nueva' | 'respaldo' | 'ninguna';

export interface FotoAmbienteProps {
  /** Path without extension or width suffix: `/img/comercio-v1/categoria-pollo`. */
  base: string;
  /** Real width in px of the large file (`<base>.webp`). The small one is `<base>-800.webp`. */
  anchoGrande: number;
  /** Empty when the image is decoration (the text next to it already says everything). */
  alt: string;
  sizes: string;
  width: number;
  height: number;
  /** A photo that already existed. It is used when the new file is not there (yet). */
  respaldo?: string;
  /** True for the first image on screen: loads at once and with priority. */
  prioridad?: boolean;
  /**
   * Art direction: below this media query a different single file replaces the
   * image (a portrait crop for phones). It goes away together with the new file.
   */
  alternativa?: { media: string; base: string };
  className?: string;
  style?: CSSProperties;
  /** Called once, the first time the new file fails to load. */
  alFallar?: () => void;
}

/**
 * An ambience image (illustration, texture, empty state) with two safety nets.
 *
 * The new files arrive on their own schedule and a missing one must never show a
 * broken-image icon. So the image walks down a short ladder on every load error:
 * the new file, then the photo that was there before, then nothing at all. With
 * nothing, the container's own background (a design token) is what you see.
 *
 * Ambience only: a product for sale always keeps its own real photo.
 */
export function FotoAmbiente({
  base,
  anchoGrande,
  alt,
  sizes,
  width,
  height,
  respaldo,
  prioridad = false,
  alternativa,
  className,
  style,
  alFallar
}: FotoAmbienteProps): JSX.Element | null {
  const [paso, setPaso] = useState<Paso>('nueva');

  if (paso === 'ninguna') {
    return null;
  }

  const alError = (): void => {
    if (paso === 'nueva') {
      alFallar?.();
      setPaso(respaldo ? 'respaldo' : 'ninguna');
    } else {
      setPaso('ninguna');
    }
  };

  const comunes = {
    alt,
    width,
    height,
    decoding: 'async' as const,
    loading: prioridad ? ('eager' as const) : ('lazy' as const),
    className,
    style,
    onError: alError,
    ...(prioridad ? PRIORIDAD_ALTA : {})
  };

  if (paso === 'respaldo' && respaldo) {
    return <img src={assetUrl(respaldo)} {...comunes} />;
  }

  const grande = `${assetUrl(base)}.webp`;
  const imagen = (
    <img
      src={grande}
      srcSet={`${assetUrl(base)}-800.webp 800w, ${grande} ${anchoGrande}w`}
      sizes={sizes}
      {...comunes}
    />
  );

  if (!alternativa) {
    return imagen;
  }

  return (
    <picture>
      <source media={alternativa.media} srcSet={`${assetUrl(alternativa.base)}.webp`} />
      {imagen}
    </picture>
  );
}
