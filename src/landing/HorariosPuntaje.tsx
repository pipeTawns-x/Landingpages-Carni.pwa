import { HORARIO } from '@src/data/negocio';
import { CALIFICACION, PERFIL_GOOGLE, TOTAL_OPINIONES } from '@src/data/resenas';
import { IconoSiguiente } from '@src/ui/iconos';
import { CONTENEDOR } from './datos';

const FILA = 'flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border py-4';

const FORMATO_NOTA = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "Domingos y festivos, cerrado" en el día y el estado; si la cadena cambia de forma, se muestra entera. */
function separarCerrado(texto: string): { dias: string; estado: string } {
  const [dias, ...resto] = texto.split(', ');
  const estado = resto.join(', ');
  if (!dias || !estado) {
    return { dias: texto, estado: '' };
  }
  return { dias, estado: estado.charAt(0).toUpperCase() + estado.slice(1) };
}

const TRAZO_ESTRELLA = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z';

/**
 * Cinco estrellas, cada una rellena de 0 a 1 según la nota. La de abajo es la
 * estrella vacía; la de arriba, en dorado, se recorta al ancho que corresponde.
 */
function Estrellas({ valor }: { valor: number }): JSX.Element {
  return (
    <span role="img" aria-label={`${FORMATO_NOTA.format(valor)} de 5 estrellas`} className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const relleno = Math.max(0, Math.min(1, valor - i));
        return (
          <span key={i} aria-hidden="true" className="relative block size-[18px]">
            <svg viewBox="0 0 24 24" className="absolute inset-0 size-full fill-border-control">
              <path d={TRAZO_ESTRELLA} />
            </svg>
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${relleno * 100}%` }}>
              <svg viewBox="0 0 24 24" className="size-[18px] fill-gold">
                <path d={TRAZO_ESTRELLA} />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * "Horarios y puntaje": filas con hairline, sin cajas. Es el único lugar de la
 * landing donde aparece el horario. El horario sale de `negocio.ts` y la nota de
 * `resenas.ts`, con enlace al perfil de Google para que cualquiera pueda leer el
 * resto de las opiniones.
 */
export function HorariosPuntaje(): JSX.Element {
  const cerrado = separarCerrado(HORARIO.cerrado);

  return (
    <section id="horarios" className="border-t border-border py-16 lg:py-24">
      <div className={CONTENEDOR}>
        <h2 className="text-seccion">Horarios y puntaje</h2>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-2 lg:gap-x-16">
          <dl className="border-t border-border">
            <div className={FILA}>
              <dt className="text-ui text-text-muted">{HORARIO.dias}</dt>
              <dd className="text-lead font-medium tabular-nums">
                {HORARIO.abre} a {HORARIO.cierra}
              </dd>
            </div>
            <div className={FILA}>
              <dt className="text-ui text-text-muted">{cerrado.dias}</dt>
              {cerrado.estado ? <dd className="text-lead font-medium">{cerrado.estado}</dd> : null}
            </div>
          </dl>

          <div className="border-t border-border">
            <dl>
              <div className={FILA}>
                <dt className="text-ui text-text-muted">Calificación en Google</dt>
                <dd className="flex items-center gap-3">
                  <Estrellas valor={CALIFICACION} />
                  <span className="text-lead font-medium tabular-nums">{FORMATO_NOTA.format(CALIFICACION)} de 5</span>
                </dd>
              </div>
            </dl>
            <a
              href={PERFIL_GOOGLE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-16 items-center justify-between gap-6 border-b border-border py-4 text-ui text-text transition-colors duration-150 ease-out-strong hover:text-sand"
            >
              Ver las {TOTAL_OPINIONES} opiniones en Google
              <IconoSiguiente tamano={18} className="shrink-0 text-text-muted" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
