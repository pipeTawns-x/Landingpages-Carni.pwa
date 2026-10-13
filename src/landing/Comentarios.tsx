import { useEffect, useState } from 'react';
import { CALIFICACION, PERFIL_GOOGLE, RESENAS, TOTAL_OPINIONES, type Resena } from '@src/data/resenas';
import { IconoPausa, IconoReproducir } from '@src/ui/iconos';
import { CONTENEDOR, FECHA_LECTURA_RESENAS } from './datos';

const CONSULTA_MOVIMIENTO_REDUCIDO = '(prefers-reduced-motion: reduce)';

const FORMATO_NOTA = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Cuántas copias de cada fila se pintan mientras gira: dos por mitad, para que la costura nunca se vea. */
const COPIAS_EN_GIRO = 4;

function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO).matches
  );

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO);
    const alCambiar = (): void => setReducido(consulta.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  return reducido;
}

interface FilaResenasProps {
  resenas: readonly Resena[];
  sentido: 'izq' | 'der';
  /** True si la fila gira; si no, es una fila quieta que se desliza con el dedo o el teclado. */
  girando: boolean;
  etiqueta: string;
}

/** Las clases van completas y literales: Tailwind no ve una clase armada por partes. */
const ANIMACION = {
  izq: 'animate-[carni-izq_70s_linear_infinite]',
  der: 'animate-[carni-der_70s_linear_infinite]'
} as const;

/**
 * Una fila de reseñas. Sin cajas: cada reseña es una cita separada de la
 * siguiente por una línea fina.
 *
 * Mientras gira, la fila se pinta varias veces seguidas para que el giro no
 * tenga costura; las copias van ocultas a los lectores de pantalla. Quieta (por
 * pausa del visitante o por movimiento reducido) se pinta una sola vez y se
 * desliza: así ninguna reseña queda fuera de alcance.
 */
function FilaResenas({ resenas, sentido, girando, etiqueta }: FilaResenasProps): JSX.Element {
  const copias = girando ? COPIAS_EN_GIRO : 1;

  return (
    <div
      role={girando ? undefined : 'group'}
      aria-label={girando ? undefined : etiqueta}
      tabIndex={girando ? undefined : 0}
      className={
        girando
          ? 'overflow-hidden'
          : 'overflow-x-auto overscroll-x-contain px-5 [scrollbar-width:thin] lg:px-6'
      }
    >
      <div
        data-giro={sentido}
        className={`flex w-max hover:[animation-play-state:paused] ${girando ? ANIMACION[sentido] : ''}`}
      >
        {Array.from({ length: copias }, (_, copia) => (
          <ul key={copia} aria-hidden={copia > 0 ? true : undefined} className="flex">
            {resenas.map((resena) => (
              <li key={resena.autor} className="w-[19rem] shrink-0 border-l border-border px-6 lg:w-[24rem]">
                <figure className="flex h-full flex-col justify-between gap-6">
                  <blockquote className="font-display text-lead font-normal">«{resena.texto}»</blockquote>
                  <figcaption>
                    <span className="block text-ui font-medium">{resena.autor}</span>
                    <span className="block text-meta text-text-muted tabular-nums">
                      {resena.opiniones} opiniones en Google
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/**
 * "Comentarios": reseñas reales del perfil de Google en dos filas que giran en
 * sentidos opuestos, con el promedio y el total reales a la vista y un enlace al
 * resto. Mostrar una selección junto a la nota verdadera es honesto; esconder la
 * nota no lo sería.
 *
 * El giro se puede detener siempre. Con movimiento reducido no gira y las filas
 * se deslizan a mano. El archivo de reseñas no guarda la fecha de cada una, así
 * que aquí va la fecha en que se leyó la selección, no una fecha inventada.
 */
export function Comentarios(): JSX.Element {
  const [girando, setGirando] = useState(true);
  const reducido = useMovimientoReducido();
  const enGiro = girando && !reducido;

  const mitad = Math.ceil(RESENAS.length / 2);
  const filaA = RESENAS.slice(0, mitad);
  const filaB = RESENAS.slice(mitad);

  return (
    <section id="comentarios" className="border-t border-border py-16 lg:py-24">
      <div className={`${CONTENEDOR} flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between`}>
        <div className="max-w-[60ch]">
          <h2 className="text-seccion">Comentarios</h2>
          <p className="mt-4 text-ui text-text-muted">
            Promedio de {FORMATO_NOTA.format(CALIFICACION)} de 5 en {TOTAL_OPINIONES} opiniones de Google. Selección de{' '}
            {RESENAS.length}, leída el {FECHA_LECTURA_RESENAS}.
          </p>
          <a
            href={PERFIL_GOOGLE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center text-ui text-sand underline underline-offset-4 transition-colors duration-150 ease-out-strong hover:text-text"
          >
            Ver todas en Google
          </a>
        </div>

        <button
          type="button"
          disabled={reducido}
          onClick={() => setGirando((actual) => !actual)}
          className="inline-flex h-11 shrink-0 touch-manipulation items-center gap-2 self-start rounded-pill border border-border-control px-5 text-ui font-medium transition-[background-color,scale] duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97] disabled:cursor-default disabled:text-text-muted disabled:hover:bg-transparent disabled:active:scale-100 motion-reduce:transition-none"
        >
          {enGiro ? <IconoPausa tamano={16} /> : <IconoReproducir tamano={16} />}
          {reducido ? 'Giro detenido' : girando ? 'Detener el giro' : 'Reanudar el giro'}
        </button>
      </div>

      <div className="mt-10 flex flex-col gap-10 lg:mt-14">
        <FilaResenas resenas={filaA} sentido="izq" girando={enGiro} etiqueta="Comentarios, primera fila" />
        <FilaResenas resenas={filaB} sentido="der" girando={enGiro} etiqueta="Comentarios, segunda fila" />
      </div>
    </section>
  );
}
