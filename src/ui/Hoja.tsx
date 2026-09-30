import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconoCerrar } from './iconos';

export type LadoHoja = 'derecha' | 'izquierda' | 'inferior' | 'centro';

export interface HojaProps {
  abierta: boolean;
  /** Se llama UNA vez por cierre, venga de la X, de Escape, del fondo o de `abierta=false`. */
  alCerrar: () => void;
  /** Título visible. El diálogo lo usa como su nombre accesible. */
  titulo: string;
  /** Etiqueta de la X, específica: "Cerrar el pedido", nunca "Cerrar" a secas. */
  etiquetaCerrar: string;
  /** Va a `data-superposicion` del `<dialog>` y a su `id` (`hoja-<nombre>`). */
  nombre: string;
  lado?: LadoHoja;
  /** Subtítulo bajo el título; el diálogo lo usa como descripción. */
  descripcion?: string;
  /** Algo a la izquierda del título, p. ej. el avatar del asistente. */
  inicioEncabezado?: ReactNode;
  /** Acciones fijas al pie. */
  pie?: ReactNode;
  children: ReactNode;
}

/**
 * Toda superposición de la tienda es una Hoja: un `<dialog>` nativo abierto con
 * `showModal()`.
 *
 * El navegador aporta lo difícil: el resto de la página queda inerte, el foco
 * se queda dentro, Escape cierra y el foco vuelve al disparador. Esta capa
 * añade lo que falta:
 *
 *   - las tres vías de cierre (X, Escape, clic en el fondo) terminan en el
 *     mismo `alCerrar`;
 *   - la X es siempre visible y de 44×44;
 *   - el título recibe el foco inicial, así el lector de pantalla anuncia
 *     "Tu pedido, diálogo" y no salta a un control cualquiera;
 *   - el fondo se cierra solo si el clic EMPEZÓ y terminó en el fondo, para que
 *     seleccionar texto dentro y soltar fuera no la cierre por accidente.
 *
 * Nunca se abre una Hoja desde dentro de otra: si una acción necesita otra
 * superposición, primero cierra la actual.
 */

/**
 * Entrada y salida. Solo `translate`, `scale` y `opacity`: se animan en la GPU
 * y una interrupción a medias se reencamina sin saltos. `display` y `overlay`
 * con `transition-discrete` mantienen el diálogo en la capa superior mientras
 * dura la salida; sin soporte, simplemente cierra sin animar.
 */
const TRANSICION =
  'transition-[translate,scale,opacity,display,overlay] transition-discrete duration-300 ease-drawer';

/** El velo de detrás: negro al 60 %, sin desenfoque, con su propio fundido. */
const VELO =
  'backdrop:bg-black/60 backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0 ' +
  'backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-300 backdrop:ease-drawer';

const CAJA_POR_LADO: Record<LadoHoja, string> = {
  derecha:
    'm-0 ml-auto h-dvh max-h-none w-[min(92vw,420px)] max-w-none bg-surface-1 text-text ' +
    'translate-x-full open:translate-x-0 starting:open:translate-x-full',
  izquierda:
    'm-0 mr-auto h-dvh max-h-none w-[min(86vw,360px)] max-w-none bg-surface-1 text-text ' +
    '-translate-x-full open:translate-x-0 starting:open:-translate-x-full',
  inferior:
    'm-0 mt-auto h-[min(80dvh,640px)] max-h-none w-full max-w-none rounded-t-sheet bg-surface-1 text-text ' +
    'translate-y-full open:translate-y-0 starting:open:translate-y-full ' +
    'lg:top-auto lg:right-6 lg:bottom-24 lg:left-auto lg:h-[min(560px,calc(100dvh-8rem))] lg:w-[380px] ' +
    'lg:origin-bottom-right lg:rounded-dialog lg:border lg:border-border lg:translate-y-0 lg:scale-95 lg:opacity-0 ' +
    'lg:open:scale-100 lg:open:opacity-100 lg:starting:open:scale-95 lg:starting:open:opacity-0',
  centro:
    'm-auto w-[min(92vw,480px)] max-h-[85dvh] max-w-none rounded-dialog border border-border bg-surface-1 text-text ' +
    'scale-95 opacity-0 open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0'
};

const INTERIOR_POR_LADO: Record<LadoHoja, string> = {
  derecha: 'h-full',
  izquierda: 'h-full',
  inferior: 'h-full',
  centro: 'max-h-[85dvh]'
};

export function Hoja({
  abierta,
  alCerrar,
  titulo,
  etiquetaCerrar,
  nombre,
  lado = 'derecha',
  descripcion,
  inicioEncabezado,
  pie,
  children
}: HojaProps): JSX.Element {
  const dialogo = useRef<HTMLDialogElement>(null);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const pulsoEnFondo = useRef(false);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const d = dialogo.current;
    if (!d) {
      return;
    }

    // La guarda hace falta: StrictMode monta el efecto dos veces y abrir un
    // diálogo que ya está abierto lanza una excepción.
    if (abierta && !d.open) {
      d.showModal();
      encabezado.current?.focus({ preventScroll: true });
    }
    if (!abierta && d.open) {
      d.close();
    }
  }, [abierta]);

  /**
   * Cualquiera de las vías de cierre acaba aquí, una sola vez.
   *
   * El navegador devuelve el foco al disparador al cerrar. Safari de escritorio
   * no enfoca los botones al hacer clic y, en ese caso, no habría a dónde
   * volver: se busca el disparador por su `data-abre`.
   */
  const alCerrarDialogo = (): void => {
    alCerrar();

    const activo = document.activeElement;
    if (!activo || activo === document.body) {
      document.querySelector<HTMLElement>(`[data-abre="${nombre}"]`)?.focus({ preventScroll: true });
    }
  };

  return (
    <dialog
      ref={dialogo}
      id={`hoja-${nombre}`}
      data-superposicion={nombre}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onClose={alCerrarDialogo}
      onPointerDown={(e) => {
        pulsoEnFondo.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pulsoEnFondo.current && e.target === e.currentTarget) {
          e.currentTarget.close();
        }
        pulsoEnFondo.current = false;
      }}
      className={`overflow-hidden p-0 ${TRANSICION} ${VELO} ${CAJA_POR_LADO[lado]}`}
    >
      <div className={`flex min-h-0 flex-col ${INTERIOR_POR_LADO[lado]}`}>
        <header className="flex shrink-0 items-start gap-3 border-b border-border py-3 pl-5 pr-2">
          {inicioEncabezado ? <div className="shrink-0 pt-0.5">{inicioEncabezado}</div> : null}
          <div className="min-w-0 flex-1 py-2">
            <h2 id={idTitulo} ref={encabezado} tabIndex={-1} className="text-titulo outline-none">
              {titulo}
            </h2>
            {descripcion ? (
              <p id={idDescripcion} className="mt-1 text-meta text-text-muted">
                {descripcion}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            data-cerrar
            aria-label={etiquetaCerrar}
            onClick={() => dialogo.current?.close()}
            className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition-[background-color,color,scale] duration-150 ease-out-strong hover:bg-surface-2 hover:text-text active:scale-95"
          >
            <IconoCerrar tamano={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {pie ? (
          <footer className="shrink-0 border-t border-border px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {pie}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
