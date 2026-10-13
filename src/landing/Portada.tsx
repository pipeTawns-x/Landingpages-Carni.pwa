import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '@src/ui/assetUrl';
import { IconoPausa, IconoReproducir } from '@src/ui/iconos';
import { CONTENEDOR } from './datos';

type ConexionLimitada = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * ¿Hay que quedarse solo con el póster?
 *
 * Sí con movimiento reducido, con ahorro de datos o con una conexión 2G. Es un
 * extra: la protección real para todos es que el video no se descarga hasta
 * reproducirse, pesa unos 300 KB en móvil y tiene su botón de pausa.
 */
function soloPoster(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conexion = (navigator as ConexionLimitada).connection;
  const lenta = !!conexion && (conexion.saveData === true || /(^|-)2g$/.test(conexion.effectiveType ?? ''));
  return reducir || lenta;
}

const TITULAR = 'Cortes frescos, del mostrador a tu mesa';
const ENTRADILLA = 'Carnicería familiar en San Luis Potosí. Elige tus cortes y te los preparamos.';

/**
 * La portada: el video de fondo, el titular y una sola acción.
 *
 * En móvil es una caja 16:9 (unos 220 px a 390) que crece si el texto pide más
 * alto; la entradilla baja fuera de la caja para que no la infle. En escritorio
 * ocupa el 85 % de la pantalla a sangre.
 *
 * El encabezado nace transparente sobre el video y se vuelve sólido cuando
 * `#fin-portada` (el centinela de 1 px al pie de la caja) sube bajo él; eso lo
 * resuelve `Encabezado`, aquí solo se coloca el centinela.
 *
 * El video:
 *   - `preload="none"`: no baja nada hasta reproducirse.
 *   - Empieza después del evento `load` y de un momento de inactividad, y solo
 *     mientras al menos el 25 % de la caja está a la vista.
 *   - Con movimiento reducido o ahorro de datos se queda en el póster y el botón
 *     ofrece reproducirlo.
 *   - Una pausa del visitante se respeta: el observador no la deshace.
 */
export function Portada(): JSX.Element {
  const video = useRef<HTMLVideoElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const pausaDelVisitante = useRef(false);
  const [posterSolo] = useState(soloPoster);
  const [reproduciendo, setReproduciendo] = useState(false);

  useEffect(() => {
    const v = video.current;
    const c = caja.current;
    if (!v || !c || posterSolo) {
      return;
    }

    // React no siempre escribe el atributo `muted`, y sin él el autoplay se bloquea.
    v.muted = true;
    v.defaultMuted = true;

    let observador: IntersectionObserver | undefined;
    let cancelarEspera: () => void = () => undefined;
    let cancelado = false;

    const arrancar = (): void => {
      if (cancelado) {
        return;
      }
      observador = new IntersectionObserver(
        ([entrada]) => {
          if (entrada.isIntersecting && !pausaDelVisitante.current) {
            // Un autoplay bloqueado no es un error: queda el póster y el botón dice "Reproducir".
            void v.play().catch(() => undefined);
          } else {
            v.pause();
          }
        },
        { threshold: 0.25 }
      );
      observador.observe(c);
    };

    // Después de `load`, y cuando el navegador esté libre: el video nunca compite con la primera pintura.
    const cuandoLibre = (): void => {
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(arrancar);
        cancelarEspera = () => window.cancelIdleCallback(id);
      } else {
        const id = window.setTimeout(arrancar, 200);
        cancelarEspera = () => window.clearTimeout(id);
      }
    };

    if (document.readyState === 'complete') {
      cuandoLibre();
    } else {
      window.addEventListener('load', cuandoLibre, { once: true });
    }

    return () => {
      cancelado = true;
      window.removeEventListener('load', cuandoLibre);
      cancelarEspera();
      observador?.disconnect();
    };
  }, [posterSolo]);

  const alternar = (): void => {
    const v = video.current;
    if (!v) {
      return;
    }
    if (v.paused) {
      pausaDelVisitante.current = false;
      void v.play().catch(() => undefined);
    } else {
      pausaDelVisitante.current = true;
      v.pause();
    }
  };

  return (
    <section id="portada" className="relative">
      <div
        ref={caja}
        className="relative isolate grid aspect-video content-end pt-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] pb-4 text-text lg:aspect-auto lg:h-[min(85svh,800px)] lg:min-h-[560px] lg:pt-[72px] lg:pb-16"
      >
        {/* Medios: el recorte vive aquí y no en la caja con proporción, para que el texto pueda empujar su alto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden rounded-b-sheet bg-surface-2 lg:rounded-none"
        >
          <video
            ref={video}
            className="size-full object-cover"
            style={{ objectPosition: '74% 40%' }}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            tabIndex={-1}
            aria-hidden="true"
            poster={assetUrl('/img/Videos/portada-carne-poster.webp')}
            onPlay={() => setReproduciendo(true)}
            onPause={() => setReproduciendo(false)}
          >
            <source media="(min-width: 1024px)" src={assetUrl('/img/Videos/portada-carne-720.mp4')} type="video/mp4" />
            <source src={assetUrl('/img/Videos/portada-carne-360.mp4')} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-black/10" />
        </div>

        <div className={`${CONTENEDOR} flex flex-col items-start gap-3 lg:gap-5`}>
          <h1 className="text-portada lg:max-w-[22ch]">{TITULAR}</h1>
          <p className="hidden max-w-[46ch] text-lead text-text lg:block">{ENTRADILLA}</p>
          <a
            href="catalogo.html"
            className="inline-flex h-11 touch-manipulation items-center rounded-pill bg-red px-6 text-ui font-medium text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-[0.97] motion-reduce:transition-none lg:h-12 lg:px-8"
          >
            Ver productos
          </a>
        </div>

        <button
          type="button"
          onClick={alternar}
          aria-label={reproduciendo ? 'Pausar el video' : 'Reproducir el video'}
          className="absolute right-3 bottom-3 grid size-11 touch-manipulation place-items-center rounded-full border border-border-control bg-bg/70 text-text transition-[background-color,scale] duration-150 ease-out-strong hover:bg-bg active:scale-95 motion-reduce:transition-none lg:right-6 lg:bottom-6"
        >
          {reproduciendo ? <IconoPausa tamano={20} /> : <IconoReproducir tamano={20} />}
        </button>
      </div>

      {/* Centinela: el encabezado pasa a sólido cuando esto sube bajo él. */}
      <div id="fin-portada" aria-hidden="true" className="h-px" />

      <p className={`${CONTENEDOR} pt-5 text-lead text-text-muted lg:hidden`}>{ENTRADILLA}</p>
    </section>
  );
}
