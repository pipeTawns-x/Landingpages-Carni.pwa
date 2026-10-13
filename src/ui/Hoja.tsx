import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconoCerrar } from './iconos';
import './Hoja.css';

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
  /**
   * Que el foco inicial caiga en el primer control del contenido en vez de en
   * el título.
   *
   * La regla por defecto es el título, porque es lo que hace que un lector de
   * pantalla anuncie "Tu pedido, diálogo" y no un control suelto. Pero hay hojas
   * que son UNA TAREA y no una lectura: la de búsqueda existe para escribir en un
   * campo, y dejar el foco en la X obliga a tabular para empezar a teclear.
   * Quien la monta decide; la primitiva no lo adivina.
   */
  focoEnContenido?: boolean;
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
 * El marco —caja, velo, cabecera, cuerpo y pie— no se pinta aquí: está en
 * `./Hoja.css`, con clases suyas y tokens con respaldo, para que la hoja se vea
 * igual en las páginas que cargan Tailwind y en las que no lo cargan. Este
 * archivo solo decide qué lado es y qué va dentro.
 */
export function Hoja({
  abierta,
  alCerrar,
  titulo,
  etiquetaCerrar,
  nombre,
  lado = 'derecha',
  descripcion,
  inicioEncabezado,
  focoEnContenido = false,
  pie,
  children
}: HojaProps): JSX.Element {
  const dialogo = useRef<HTMLDialogElement>(null);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
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

      // El foco se lo lleva el ÚLTIMO efecto en ejecutarse, y el del hijo corre
      // antes que el de la hoja: si el contenido se enfocara a sí mismo, esta
      // línea se lo quitaría. Por eso la política vive aquí y no en el hijo.
      const primero = focoEnContenido
        ? contenido.current?.querySelector<HTMLElement>(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
          )
        : null;

      (primero ?? encabezado.current)?.focus({ preventScroll: true });
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
      className={`hoja hoja--${lado}`}
    >
      <div className="hoja__interior">
        <header className="hoja__cabecera">
          {inicioEncabezado ? <div className="hoja__inicio">{inicioEncabezado}</div> : null}
          <div className="hoja__titulos">
            <h2 id={idTitulo} ref={encabezado} tabIndex={-1} className="hoja__titulo">
              {titulo}
            </h2>
            {descripcion ? (
              <p id={idDescripcion} className="hoja__descripcion">
                {descripcion}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            data-cerrar
            aria-label={etiquetaCerrar}
            onClick={() => dialogo.current?.close()}
            className="hoja__cerrar"
          >
            <IconoCerrar tamano={20} />
          </button>
        </header>

        <div ref={contenido} className="hoja__cuerpo">
          {children}
        </div>

        {pie ? <footer className="hoja__pie">{pie}</footer> : null}
      </div>
    </dialog>
  );
}
