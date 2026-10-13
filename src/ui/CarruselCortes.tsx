import { useRef, type KeyboardEvent } from 'react';
import type { ProductoVista } from '@src/data/catalogo';
import { assetUrl } from './assetUrl';
import { IconoAnterior, IconoSiguiente } from './iconos';
import { unidadDe } from './presentacionProducto';
import { enlaceDeFicha, precioPorKg, precioPorLb } from './Tarjeta';
import { useCarrusel } from './useCarrusel';

export interface CarruselCortesProps {
  cortes: ProductoVista[];
  /** El h2 estático de la sección. */
  titulo: string;
}

const FLECHA =
  'grid size-11 touch-manipulation place-items-center rounded-full bg-surface-2 text-text transition-[background-color,scale,opacity] duration-150 ease-out-strong hover:bg-surface-3 active:scale-95 aria-disabled:opacity-40 aria-disabled:hover:bg-surface-2 aria-disabled:active:scale-100 motion-reduce:transition-none';

/**
 * Carrusel de cortes especiales: una galería de fotos que desliza por sí sola y
 * un detalle que sigue a la foto activa (nombre, descripción, precio y el botón
 * para agregar), todo de la base.
 *
 * Las diapositivas NO son Tarjetas: aquí la foto manda y la información va
 * aparte, en una sola pieza que cambia con la diapositiva. Así una foto de corte
 * nunca carga con los datos de otro.
 *
 * Controles en una sola fila en todos los anchos: flecha, puntos, flecha. Las
 * flechas usan `aria-disabled` y no `disabled`: un botón que se deshabilita con
 * el foco encima lo pierde.
 */
export function CarruselCortes({ cortes, titulo }: CarruselCortesProps): JSX.Element | null {
  const pista = useRef<HTMLDivElement>(null);
  const { activo, inicio, fin, mover, ir } = useCarrusel(pista);
  const total = cortes.length;

  if (total === 0) {
    return null;
  }

  const indice = Math.min(activo, total - 1);
  const corte = cortes[indice];
  const unidad = unidadDe(corte.nombre);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      mover(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      mover(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      ir(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      ir(total - 1);
    }
  };

  return (
    <div>
      <h2 className="text-seccion">{titulo}</h2>

      <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-[1.6fr_1fr] lg:items-center lg:gap-12">
        <div>
          <div
            ref={pista}
            id="pista-cortes"
            tabIndex={0}
            role="group"
            aria-roledescription="carousel"
            aria-label="Cortes especiales. Desliza o usa las flechas."
            onKeyDown={alTeclear}
            className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 [scrollbar-width:none] motion-safe:scroll-smooth lg:mx-0 lg:scroll-px-0 lg:gap-4 lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {cortes.map((c, i) => (
              <div
                key={c.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${total}`}
                data-producto-id={c.id}
                className="w-[86%] shrink-0 snap-start snap-always lg:w-[62%]"
              >
                {c.foto ? (
                  <img
                    src={assetUrl(c.foto)}
                    alt={c.nombre}
                    width={640}
                    height={512}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="aspect-[5/4] w-full rounded-card bg-surface-2 object-cover"
                  />
                ) : (
                  <div className="aspect-[5/4] w-full rounded-card bg-surface-2" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 lg:justify-start">
            <button
              type="button"
              aria-controls="pista-cortes"
              aria-label="Corte anterior"
              aria-disabled={inicio}
              onClick={() => {
                if (!inicio) {
                  mover(-1);
                }
              }}
              className={FLECHA}
            >
              <IconoAnterior />
            </button>

            <div role="group" aria-label="Elegir corte" className="flex h-11 items-center rounded-full bg-surface-2 px-2">
              {cortes.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Ir al corte ${i + 1}: ${c.nombre}`}
                  aria-current={i === indice}
                  aria-disabled={i === indice}
                  onClick={() => {
                    if (i !== indice) {
                      ir(i);
                    }
                  }}
                  className="group grid h-11 w-6 touch-manipulation place-items-center"
                >
                  <span className="block h-1.5 w-1.5 rounded-full bg-text/35 transition-[width,background-color] duration-200 ease-out-strong group-aria-[current=true]:w-6 group-aria-[current=true]:bg-text motion-reduce:transition-none" />
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-controls="pista-cortes"
              aria-label="Corte siguiente"
              aria-disabled={fin}
              onClick={() => {
                if (!fin) {
                  mover(1);
                }
              }}
              className={FLECHA}
            >
              <IconoSiguiente />
            </button>
          </div>
        </div>

        <div
          key={corte.id}
          data-detalle-corte
          data-producto-id={corte.id}
          className="mt-8 flex flex-col items-start gap-4 transition-opacity duration-200 ease-out-strong starting:opacity-0 motion-reduce:transition-none lg:mt-0"
        >
          <h3 className="text-titulo">{corte.nombre}</h3>
          {corte.descripcion ? (
            <p className="line-clamp-3 max-w-[48ch] text-ui text-text-muted">{corte.descripcion}</p>
          ) : null}

          <div>
            <p className="text-titulo font-semibold tabular-nums">
              <span data-precio-kg={corte.precioKg}>{precioPorKg(corte.precioKg)}</span>{' '}
              <span className="font-normal text-text-muted">/ {unidad}</span>
            </p>
            {unidad === 'kg' && corte.precioLb !== null ? (
              <p className="text-meta text-text-muted tabular-nums">{precioPorLb(corte.precioLb)} / lb</p>
            ) : null}
          </div>

          {corte.disponible ? (
            <a
              href={enlaceDeFicha(corte.id)}
              aria-label={`Agregar ${corte.nombre}`}
              className="inline-flex h-12 w-full touch-manipulation items-center justify-center rounded-pill bg-red px-8 text-ui font-medium text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-[0.97] motion-reduce:transition-none sm:w-auto"
            >
              Agregar
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="h-12 w-full cursor-not-allowed rounded-pill bg-surface-2 px-8 text-ui font-medium text-red-text sm:w-auto"
            >
              Agotado
            </button>
          )}
        </div>
      </div>

      <p role="status" className="sr-only">
        {`Corte ${indice + 1} de ${total}: ${corte.nombre}`}
      </p>
    </div>
  );
}
