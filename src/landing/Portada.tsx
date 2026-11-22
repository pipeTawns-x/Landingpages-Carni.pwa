import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { assetUrl } from '@src/ui/assetUrl';
import { Cenefa } from '@src/ui/Cenefa';
import { FotoAmbiente } from '@src/ui/FotoAmbiente';
import { IconoPausa, IconoReproducir } from '@src/ui/iconos';
import { CARPETA_AMBIENTE, CONTENEDOR } from './datos';

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

/** Lead paragraph: over the photo on desktop, just below the box on phones. */
const ENTRADILLA = 'Carnicería familiar en San Luis Potosí. Elige tus cortes y te los preparamos.';

/**
 * The hero lives in one of two worlds, and never a mix.
 *
 * - `nuevo`: the dark counter photograph made for the redesign (still image).
 * - `clasico`: the original poster and video, exactly as they were.
 *
 * It starts in `nuevo`. If that photograph is not on the server (it is delivered
 * separately from the code) the first load error moves the hero to `clasico`, so
 * the page is whole at every moment instead of showing a broken image, and the
 * old video never plays over the new photograph.
 */
type Mundo = 'nuevo' | 'clasico';

interface FuenteVideo {
  src: string;
  media?: string;
}

const POSTER_CLASICO = '/img/Videos/portada-carne-poster.webp';

const VIDEO_CLASICO: readonly FuenteVideo[] = [
  { src: '/img/Videos/portada-carne-720.mp4', media: '(min-width: 1024px)' },
  { src: '/img/Videos/portada-carne-360.mp4' }
];

/**
 * The loop that goes with the new photograph (`portada-mostrador-loop.mp4`) has
 * not been generated yet. Flip this to `true` when the file is in
 * `public/img/comercio-v1/`; until then the new hero is the still photograph and
 * offers no video control, because there is nothing to play.
 */
const HAY_VIDEO_NUEVO = false;

const VIDEO_NUEVO: readonly FuenteVideo[] = HAY_VIDEO_NUEVO
  ? [{ src: `${CARPETA_AMBIENTE}/portada-mostrador-loop.mp4` }]
  : [];

/** Staggers the entrance of the three hero pieces. See `@utility entra` in tailwind.css. */
function retardo(ms: number): CSSProperties {
  return { '--retardo': `${ms}ms` } as CSSProperties;
}

/**
 * La portada: la foto del mostrador (o el video clásico), el titular y una sola
 * acción, con la cenefa de azulejos como borde.
 *
 * En celular es una caja vertical 4:5 (el titular cae en su tercio oscuro); de
 * 640 px a 1023 px es 16:9, y en escritorio ocupa el 85 % de la pantalla a
 * sangre. La caja crece si el texto pide más alto; la entradilla baja fuera de la
 * caja en móvil para que no la infle.
 *
 * El encabezado nace transparente sobre la foto y se vuelve sólido cuando
 * `#fin-portada` (el centinela de 1 px al pie de la caja) sube bajo él; eso lo
 * resuelve `Encabezado`, aquí solo se coloca el centinela.
 *
 * El video (solo en el mundo clásico, o en el nuevo cuando exista el loop):
 *   - `preload="none"`: no baja nada hasta reproducirse.
 *   - Empieza después del evento `load` y de un momento de inactividad, y solo
 *     mientras al menos el 25 % de la caja está a la vista.
 *   - Con movimiento reducido o ahorro de datos se queda quieto y el botón
 *     ofrece reproducirlo.
 *   - Una pausa del visitante se respeta: el observador no la deshace.
 */
export function Portada(): JSX.Element {
  const video = useRef<HTMLVideoElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const pausaDelVisitante = useRef(false);
  const [posterSolo] = useState(soloPoster);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [mundo, setMundo] = useState<Mundo>('nuevo');

  const fuentes = mundo === 'clasico' ? VIDEO_CLASICO : VIDEO_NUEVO;
  const hayVideo = fuentes.length > 0;

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
  }, [posterSolo, hayVideo]);

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
        className="relative isolate grid aspect-[4/5] content-end pt-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] pb-12 text-text sm:aspect-video lg:aspect-auto lg:h-[min(85svh,800px)] lg:min-h-[560px] lg:pt-[72px] lg:pb-24"
      >
        {/* Medios: el recorte vive aquí y no en la caja con proporción, para que el texto pueda empujar su alto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden rounded-b-sheet bg-surface-2 lg:rounded-none"
        >
          {mundo === 'nuevo' ? (
            <FotoAmbiente
              base={`${CARPETA_AMBIENTE}/portada-mostrador`}
              anchoGrande={1344}
              alt=""
              sizes="100vw"
              width={1344}
              height={768}
              prioridad
              alternativa={{ media: '(max-width: 639px)', base: `${CARPETA_AMBIENTE}/portada-mostrador-vertical` }}
              alFallar={() => setMundo('clasico')}
              className="absolute inset-0 size-full object-cover object-[50%_72%] sm:object-[74%_40%]"
            />
          ) : null}

          {hayVideo ? (
            <video
              ref={video}
              className={`size-full object-cover ${
                mundo === 'nuevo'
                  ? `absolute inset-0 transition-opacity duration-300 ease-out-strong motion-reduce:transition-none ${
                      reproduciendo ? 'opacity-100' : 'opacity-0'
                    }`
                  : ''
              }`}
              style={{ objectPosition: '74% 40%' }}
              muted
              loop
              playsInline
              preload="none"
              disablePictureInPicture
              tabIndex={-1}
              aria-hidden="true"
              poster={mundo === 'clasico' ? assetUrl(POSTER_CLASICO) : undefined}
              onPlay={() => setReproduciendo(true)}
              onPause={() => setReproduciendo(false)}
            >
              {fuentes.map((fuente) => (
                <source key={fuente.src} media={fuente.media} src={assetUrl(fuente.src)} type="video/mp4" />
              ))}
            </video>
          ) : null}

          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/10" />
          <Cenefa className="absolute inset-x-0 bottom-0 h-7 lg:h-10" />
        </div>

        <div className={`${CONTENEDOR} flex flex-col items-start gap-3 lg:gap-5`}>
          <h1 className="entra text-portada lg:max-w-[22ch]" style={retardo(0)}>
            Cortes <em className="font-normal text-sand italic">frescos</em>, del mostrador a tu mesa
          </h1>
          <p className="entra hidden max-w-[46ch] text-lead text-text lg:block" style={retardo(70)}>
            {ENTRADILLA}
          </p>
          <a
            href="catalogo.html"
            className="entra inline-flex h-11 touch-manipulation items-center rounded-pill bg-red px-6 text-ui font-medium text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-[0.97] motion-reduce:transition-none lg:h-12 lg:px-8"
            style={retardo(140)}
          >
            Ver productos
          </a>
        </div>

        {hayVideo ? (
          <button
            type="button"
            onClick={alternar}
            aria-label={reproduciendo ? 'Pausar el video' : 'Reproducir el video'}
            className="absolute right-3 bottom-10 grid size-11 touch-manipulation place-items-center rounded-full border border-border-control bg-bg/70 text-text transition-[background-color,scale] duration-150 ease-out-strong hover:bg-bg active:scale-95 motion-reduce:transition-none lg:right-6 lg:bottom-16"
          >
            {reproduciendo ? <IconoPausa tamano={20} /> : <IconoReproducir tamano={20} />}
          </button>
        ) : null}
      </div>

      {/* Centinela: el encabezado pasa a sólido cuando esto sube bajo él. */}
      <div id="fin-portada" aria-hidden="true" className="h-px" />

      <p className={`${CONTENEDOR} pt-5 text-lead text-text-muted lg:hidden`}>{ENTRADILLA}</p>
    </section>
  );
}
