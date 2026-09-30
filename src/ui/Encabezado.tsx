import { useEffect, useRef, useState } from 'react';
import { IconoBuscar, IconoMenu, IconoPedido } from './iconos';
import { Logotipo } from './Logotipo';

export interface EncabezadoProps {
  /** True solo en la landing: el encabezado nace transparente sobre el video. */
  sobrePortada: boolean;
  /** Líneas del pedido: la insignia del carrito. */
  cuenta: number;
  menuAbierto: boolean;
  carritoAbierto: boolean;
  alAbrirMenu: () => void;
  alAbrirCarrito: () => void;
  /** 'catalogo.html#buscar' en la landing; '#buscar' en el catálogo. */
  hrefBuscar: string;
}

/** Alto del encabezado sin la zona segura, en píxeles. Debe coincidir con las clases de abajo. */
const ALTO_MOVIL = 56;
const ALTO_ESCRITORIO = 72;
const CONSULTA_ESCRITORIO = '(min-width: 1024px)';
const CONSULTA_MOVIMIENTO_REDUCIDO = '(prefers-reduced-motion: reduce)';

/**
 * ¿Ya pasó la portada por debajo del encabezado?
 *
 * Con el centinela `#fin-portada` (1 px al final de la portada) se usa un
 * IntersectionObserver: la portada "termina" cuando el centinela sube por
 * encima del borde inferior del encabezado. El margen del observador es el alto
 * del encabezado y se recalcula al cruzar el punto de corte de escritorio.
 *
 * Sin centinela (una página sin portada) o sin IntersectionObserver, el
 * respaldo es el scroll: sólido a partir de 8 px. Es un oyente pasivo que se
 * agrupa por cuadro de animación.
 */
function usePasoPortada(activo: boolean): boolean {
  const [paso, setPaso] = useState(false);

  useEffect(() => {
    if (!activo) {
      return;
    }

    const escritorio = window.matchMedia(CONSULTA_ESCRITORIO);
    const alto = (): number => (escritorio.matches ? ALTO_ESCRITORIO : ALTO_MOVIL);
    const centinela = document.getElementById('fin-portada');

    if (centinela && 'IntersectionObserver' in window) {
      let observador: IntersectionObserver | null = null;

      const observar = (): void => {
        observador?.disconnect();
        observador = new IntersectionObserver(
          ([entrada]) => {
            // Fuera del área y por encima: la portada ya quedó atrás. Fuera del
            // área pero por debajo: la portada sigue ocupando la pantalla.
            setPaso(!entrada.isIntersecting && entrada.boundingClientRect.top < alto());
          },
          { rootMargin: `-${alto()}px 0px 0px 0px` }
        );
        observador.observe(centinela);
      };

      observar();
      escritorio.addEventListener('change', observar);
      return () => {
        escritorio.removeEventListener('change', observar);
        observador?.disconnect();
      };
    }

    let cuadro = 0;
    const evaluar = (): void => {
      cuadro = 0;
      setPaso(window.scrollY >= 8);
    };
    const alScrollear = (): void => {
      if (cuadro === 0) {
        cuadro = window.requestAnimationFrame(evaluar);
      }
    };

    evaluar();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => {
      window.removeEventListener('scroll', alScrollear);
      window.cancelAnimationFrame(cuadro);
    };
  }, [activo]);

  return paso;
}

/**
 * Un "pop" breve en la insignia cuando la cuenta cambia.
 *
 * Se ignora durante los primeros 400 ms: al montar, el pedido guardado se
 * hidrata y la cuenta salta de 0 a N. Eso es cargar la página, no agregar algo.
 * Con movimiento reducido no hay pop.
 */
function usePopInsignia(cuenta: number) {
  const insignia = useRef<HTMLSpanElement>(null);
  const lista = useRef(false);
  const anterior = useRef(cuenta);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      lista.current = true;
    }, 400);
    return () => window.clearTimeout(temporizador);
  }, []);

  useEffect(() => {
    if (cuenta === anterior.current) {
      return;
    }
    anterior.current = cuenta;

    const elemento = insignia.current;
    if (!lista.current || !elemento || typeof elemento.animate !== 'function') {
      return;
    }
    if (window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO).matches) {
      return;
    }

    elemento.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.15)', offset: 0.5 }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    );
  }, [cuenta]);

  return insignia;
}

const BOTON =
  'grid size-11 shrink-0 place-items-center rounded-full text-text transition-[background-color,scale] duration-150 ease-out-strong hover:bg-surface-2 active:scale-95 motion-reduce:transition-none';

/**
 * El encabezado de la tienda: menú, marca, búsqueda y pedido.
 *
 * Dos estados, en `data-estado`:
 *   - `sobre-video`: transparente, con un velo suave arriba para que los íconos
 *     se lean sobre el video. Con un puntero fino encima, o con el foco del
 *     teclado dentro, se vuelve casi negro para leer cómodo.
 *   - `solido`: fondo sólido con una línea fina debajo. Es el único estado en
 *     páginas sin portada y el que toma la landing al pasar la portada.
 *
 * En pantallas táctiles no hay hover: el efecto lo dan el paso a sólido y el
 * `focus-within`.
 */
export function Encabezado({
  sobrePortada,
  cuenta,
  menuAbierto,
  carritoAbierto,
  alAbrirMenu,
  alAbrirCarrito,
  hrefBuscar
}: EncabezadoProps): JSX.Element {
  const paso = usePasoPortada(sobrePortada);
  const insignia = usePopInsignia(cuenta);
  const estado = sobrePortada && !paso ? 'sobre-video' : 'solido';

  return (
    <header
      data-estado={estado}
      className="group fixed inset-x-0 top-0 z-40 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-240 ease-out-strong data-[estado=solido]:bg-bg data-[estado=solido]:shadow-[0_1px_0_rgb(255_255_255/0.08)] data-[estado=sobre-video]:bg-transparent data-[estado=sobre-video]:hover:bg-veil data-[estado=sobre-video]:focus-within:bg-veil motion-reduce:transition-none lg:h-[calc(4.5rem+env(safe-area-inset-top))]"
    >
      {/* Velo superior: solo sobre el video y solo sin hover ni foco dentro. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/55 via-black/28 via-55% to-transparent opacity-0 transition-opacity duration-240 ease-out-strong group-data-[estado=sobre-video]:opacity-100 group-data-[estado=sobre-video]:group-hover:opacity-0 group-data-[estado=sobre-video]:group-focus-within:opacity-0 motion-reduce:transition-none"
      />

      <div className="relative grid h-full grid-cols-[1fr_auto_1fr] items-center px-1.5 lg:px-6">
        <button
          type="button"
          data-abre="menu"
          aria-label="Abrir el menú"
          aria-haspopup="dialog"
          aria-expanded={menuAbierto}
          aria-controls="hoja-menu"
          onClick={alAbrirMenu}
          className={`justify-self-start ${BOTON}`}
        >
          <IconoMenu />
        </button>

        <a
          href="landing.html"
          aria-label="Carnicería El Señor de La Misericordia, ir al inicio"
          className="justify-self-center rounded-control px-2 py-1 text-text no-underline"
        >
          <Logotipo tamano="encabezado" />
        </a>

        <div className="flex items-center justify-self-end">
          <a href={hrefBuscar} aria-label="Buscar en el catálogo" className={BOTON}>
            <IconoBuscar />
          </a>

          <button
            type="button"
            data-abre="carrito"
            aria-label={`Abrir el pedido, ${cuenta} ${cuenta === 1 ? 'producto' : 'productos'}`}
            aria-haspopup="dialog"
            aria-expanded={carritoAbierto}
            aria-controls="hoja-carrito"
            onClick={alAbrirCarrito}
            className={`relative ${BOTON}`}
          >
            <IconoPedido />
            {cuenta > 0 ? (
              <span
                ref={insignia}
                aria-hidden="true"
                className="absolute top-0.5 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-red px-1.5 text-meta leading-none font-semibold text-white tabular-nums"
              >
                {cuenta > 99 ? '99+' : cuenta}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
