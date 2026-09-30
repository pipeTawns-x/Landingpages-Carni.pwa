import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '@src/ui/assetUrl';
import { IconoPausa, IconoPlay } from '@src/ui/iconos';
import { rutaCategoria } from './datos';

/**
 * El hero: video real (no el `<img>` de marcador que traía el canvas — el
 * diseño anotaba que faltaba el .mp4, pero el .mp4 y el .webm ya existen en
 * public/img/Videos/, junto con el póster).
 *
 * Es el único <h1> de la página: el diseño usa <h2> ahí porque el propio
 * canvas se queda con el <h1>, pero en el documento real el titular del hero
 * es el título de la página.
 */
export function Portada(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enPausa, setEnPausa] = useState(false);

  const [reducirMovimiento] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reducirMovimiento) {
      videoRef.current?.pause();
      setEnPausa(true);
    }
  }, [reducirMovimiento]);

  function alternarVideo(): void {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setEnPausa(false);
    } else {
      video.pause();
      setEnPausa(true);
    }
  }

  return (
    <section className="relative">
      <div className="px-3 pt-3 lg:px-8 lg:pt-6">
        <div className="relative h-[320px] overflow-hidden rounded-[24px] bg-surface-2 lg:h-[640px] lg:rounded-[28px]">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            style={{ objectPosition: '74% 40%' }}
            autoPlay={!reducirMovimiento}
            muted
            loop
            playsInline
            preload="metadata"
            poster={assetUrl('/img/Videos/VideoCarniwebP01-poster.jpg')}
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={assetUrl('/img/Videos/VideoCarniwebP01.webm')} type="video/webm" />
            <source src={assetUrl('/img/Videos/VideoCarniwebP01.mp4')} type="video/mp4" />
          </video>

          <button
            type="button"
            onClick={alternarVideo}
            aria-label={enPausa ? 'Reanudar el video' : 'Pausar el video'}
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-pill border border-border bg-bg text-text lg:bottom-6 lg:right-6 lg:h-12 lg:w-12"
          >
            {enPausa ? <IconoPlay /> : <IconoPausa />}
          </button>
        </div>

        {/* En móvil, px-1 más el px-3 del contenedor da 16 px: el mismo margen que el resto de la página.
            En escritorio el bloque muerde la esquina inferior izquierda del video, al ras de su borde. */}
        <div className="flex flex-col gap-3.5 px-1 pb-2 pt-6 lg:absolute lg:bottom-0 lg:left-8 lg:w-[680px] lg:rounded-tr-[28px] lg:bg-bg lg:pb-0 lg:pl-0 lg:pr-12 lg:pt-10">
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand lg:text-[13px]">
            Carnicería familiar · San Luis Potosí
          </span>
          <h1 className="m-0 text-balance font-display text-[40px] font-[480] leading-[44px] tracking-[-0.01em] lg:text-[68px] lg:leading-[72px] lg:tracking-[-0.015em]">
            Cortes del día, listos para el asador
          </h1>
          <p className="m-0 max-w-[46ch] text-pretty text-base leading-6 text-text-muted lg:text-lg lg:leading-7">
            Pide en línea y recoge en el mostrador, o te lo llevamos a domicilio desde $150.
          </p>
          <div className="flex flex-col gap-2 pt-1.5 lg:flex-row lg:pt-1">
            <a
              href="products.html"
              className="flex h-12 items-center justify-center rounded-pill bg-red px-7 text-center text-[15px] font-semibold text-white no-underline hover:bg-red-hover lg:h-[52px] lg:text-base"
            >
              Ver productos
            </a>
            <a
              href={rutaCategoria('ofertas')}
              className="flex h-12 items-center justify-center rounded-pill border border-sand px-7 text-center text-[15px] font-semibold text-text no-underline lg:h-[52px] lg:text-base"
            >
              Ver ofertas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
