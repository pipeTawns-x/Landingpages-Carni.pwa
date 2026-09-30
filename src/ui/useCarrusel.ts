import { useCallback, useEffect, useState, type RefObject } from 'react';

const CONSULTA_MOVIMIENTO_REDUCIDO = '(prefers-reduced-motion: reduce)';

/** Tolerancia en píxeles: el navegador asienta el scroll con decimales. */
const MARGEN = 2;

function comportamiento(): ScrollBehavior {
  return window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO).matches ? 'auto' : 'smooth';
}

export interface EstadoCarrusel {
  /** Índice de la diapositiva que manda: la del inicio de la pista, o la última si ya se llegó al final. */
  activo: number;
  /** La pista está en su extremo izquierdo. */
  inicio: boolean;
  /** La pista está en su extremo derecho. */
  fin: boolean;
  /** Avanza o retrocede una diapositiva. */
  mover: (direccion: 1 | -1) => void;
  /** Lleva la diapositiva `i` al inicio de la pista (o al tope, si no cabe). */
  ir: (i: number) => void;
}

/**
 * La lógica de un carrusel de scroll-snap: cuál es la diapositiva activa, si se
 * llegó a un extremo y cómo moverse. El deslizamiento lo hace el navegador; el
 * hook solo lo mide y lo dirige.
 *
 * Decisiones que no son obvias:
 *   - El paso se mide entre el hijo 0 y el hijo 1 en cada uso. No se guarda: el
 *     ancho de las diapositivas cambia con la pantalla.
 *   - El `scroll` es pasivo y se agrupa por cuadro de animación.
 *   - Hace falta un `ResizeObserver` sobre la pista. Si solo se midiera al hacer
 *     scroll o al cambiar el tamaño de la ventana, la pista puede medirse antes
 *     de que el CSS termine de aplicarse (`scrollWidth === clientWidth`) y el
 *     carrusel arranca con las dos flechas deshabilitadas y "7 de 7".
 *   - Con movimiento reducido el desplazamiento es inmediato.
 */
export function useCarrusel(pista: RefObject<HTMLDivElement>): EstadoCarrusel {
  const [activo, setActivo] = useState(0);
  const [inicio, setInicio] = useState(true);
  const [fin, setFin] = useState(false);

  const paso = useCallback((): number => {
    const hijos = pista.current?.children;
    if (!hijos || hijos.length < 2) {
      return 0;
    }
    return (hijos[1] as HTMLElement).offsetLeft - (hijos[0] as HTMLElement).offsetLeft;
  }, [pista]);

  const medir = useCallback((): void => {
    const p = pista.current;
    if (!p) {
      return;
    }

    const maximo = p.scrollWidth - p.clientWidth;
    const alFinal = maximo > MARGEN && p.scrollLeft >= maximo - MARGEN;
    setInicio(p.scrollLeft <= MARGEN);
    setFin(maximo <= MARGEN || alFinal);
    setActivo(alFinal ? p.children.length - 1 : Math.round(p.scrollLeft / (paso() || 1)));
  }, [pista, paso]);

  useEffect(() => {
    const p = pista.current;
    if (!p) {
      return;
    }

    let cuadro = 0;
    const alScrollear = (): void => {
      if (cuadro === 0) {
        cuadro = window.requestAnimationFrame(() => {
          cuadro = 0;
          medir();
        });
      }
    };

    p.addEventListener('scroll', alScrollear, { passive: true });
    const observador = new ResizeObserver(medir);
    observador.observe(p);
    medir();

    return () => {
      p.removeEventListener('scroll', alScrollear);
      observador.disconnect();
      window.cancelAnimationFrame(cuadro);
    };
  }, [medir, pista]);

  const mover = useCallback(
    (direccion: 1 | -1): void => {
      pista.current?.scrollBy({ left: direccion * paso(), behavior: comportamiento() });
    },
    [pista, paso]
  );

  const ir = useCallback(
    (i: number): void => {
      const p = pista.current;
      const hijos = p?.children;
      if (!p || !hijos || !hijos[i]) {
        return;
      }
      p.scrollTo({
        left: (hijos[i] as HTMLElement).offsetLeft - (hijos[0] as HTMLElement).offsetLeft,
        behavior: comportamiento()
      });
    },
    [pista]
  );

  return { activo, inicio, fin, mover, ir };
}
