import { useEffect, useState } from 'react';
import { IconoBuscar, IconoCarrito, IconoMenu } from './iconos';

export interface EncabezadoProps {
  /** Cuántas líneas hay en el pedido — la insignia roja del carrito. */
  cuenta: number;
  /** La landing la trae; otras páginas podrían no querer lupa. */
  conLupa?: boolean;
}

/**
 * El encabezado de la tienda: hamburguesa, logo centrado, lupa y carrito.
 *
 * Un solo componente responsivo — no dos instancias fijas por ancho como en
 * el canvas de diseño (Encabezado.dc.html tenía un `sc-if` para "movil" y
 * otro para "escritorio" porque el canvas solo sabe congelar anchos). Aquí
 * los dos son el mismo árbol, con clases `lg:` para el salto a escritorio, tal
 * como pide la decisión de "responsive, mobile-first" del encargo.
 *
 * Sin nav de texto: el diseño no lleva enlaces visibles en el header (Inicio
 * / Productos / Contacto viven en el pie y en el menú del cajón), así que no
 * se inventó ninguno.
 */
export function Encabezado({ cuenta, conLupa = true }: EncabezadoProps): JSX.Element {
  const [conScroll, setConScroll] = useState(false);

  useEffect(() => {
    let cuadro = false;
    const evaluar = (): void => {
      cuadro = false;
      setConScroll(window.scrollY > 8);
    };
    const alScrollear = (): void => {
      if (cuadro) return;
      cuadro = true;
      window.requestAnimationFrame(evaluar);
    };

    evaluar();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  const fondo = conScroll ? 'bg-surface-1' : 'bg-bg';
  const hayCuenta = cuenta > 0;
  const etiquetaCarrito = `Mi carrito, ${cuenta} ${cuenta === 1 ? 'artículo' : 'artículos'}`;

  return (
    <header
      className={`relative z-40 box-border flex h-14 items-center justify-between border-b border-border px-1.5 font-sans text-text transition-colors duration-200 lg:px-6 ${
        conScroll ? 'lg:h-[60px]' : 'lg:h-[72px]'
      } ${fondo}`}
    >
      {/* Hamburguesa: mecanismo real de js/modules/ui/header.js (id="menuToggle").
          El cajón (#mobileDrawer) todavía no vive en esta página nueva — su
          diseño visual queda cubierto por otra página de Claude Design, así
          que el botón queda cableado y a la espera; hoy es un no-op seguro
          (header.js comprueba que el elemento exista antes de tocarlo). */}
      <button
        id="menuToggle"
        type="button"
        aria-label="Abrir el menú"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-text lg:h-12 lg:w-12 lg:border-border lg:hover:border-sand"
      >
        <IconoMenu />
      </button>

      <a
        href="index.html"
        aria-label="Carnicería El Señor de La Misericordia, ir al inicio"
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 leading-none text-text no-underline lg:gap-1.5"
      >
        <span className="pl-[0.16em] text-[17px] font-semibold tracking-[0.16em] lg:pl-[0.18em] lg:text-[22px] lg:tracking-[0.18em]">
          CARNICERÍA
        </span>
        <span
          className={`flex items-center gap-1.5 whitespace-nowrap text-[8.5px] font-medium tracking-[0.12em] text-sand lg:hidden`}
        >
          <span className="h-px w-3 bg-sand" />
          EL SEÑOR DE LA MISERICORDIA
          <span className="h-px w-3 bg-sand" />
        </span>
        {!conScroll ? (
          <span className="hidden items-center gap-2 whitespace-nowrap text-[10px] font-medium tracking-[0.14em] text-sand lg:flex">
            <span className="h-px w-5 bg-sand" />
            EL SEÑOR DE LA MISERICORDIA
            <span className="h-px w-5 bg-sand" />
          </span>
        ) : null}
      </a>

      <span className="flex items-center gap-2">
        {conLupa ? (
          <button
            id="searchBtn"
            type="button"
            aria-label="Buscar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-text lg:h-12 lg:w-12 lg:border-border lg:hover:border-sand"
          >
            <IconoBuscar />
          </button>
        ) : null}
        <button
          id="cartBtn"
          type="button"
          aria-label={etiquetaCarrito}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-text lg:h-12 lg:w-12 lg:border-border lg:hover:border-sand"
        >
          <IconoCarrito />
          {hayCuenta ? (
            <span
              className={`absolute right-[3px] top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red px-1 text-[11px] font-semibold tabular-nums text-white lg:-right-0.5 lg:-top-0.5 lg:h-5 lg:min-w-[20px] lg:px-[5px] lg:text-xs ${
                conScroll ? 'outline outline-2 outline-surface-1' : 'outline outline-2 outline-bg'
              } lg:outline-2`}
            >
              {cuenta}
            </span>
          ) : null}
        </button>
      </span>
    </header>
  );
}
