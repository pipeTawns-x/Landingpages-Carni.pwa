import { useEffect, useState } from 'react';
import { usePedido } from '@src/hooks/usePedido';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import { leerPedidoGuardado } from '@src/lib/pedidoStorage';
import { etiquetaUnidad, totalDeLinea } from '@src/lib/solicitudLinea';
import { assetUrl } from './assetUrl';
import { EditorLinea } from './EditorLinea';
import { FotoAmbiente } from './FotoAmbiente';
import { Hoja } from './Hoja';
import { IconoCerrar } from './iconos';

export interface CarritoHojaProps {
  abierta: boolean;
  alCerrar: () => void;
}

const FORMATO_CANTIDAD = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 });

const BOTON_ROJO =
  'inline-flex h-12 items-center justify-center rounded-pill bg-red px-6 text-ui font-medium text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-[0.97]';

/**
 * El pedido en curso, en una hoja por la derecha.
 *
 * Lee el mismo pedido que las páginas viejas (`carni_cart_v1` y el evento
 * `cart:updated`), así que lo agregado en un lado aparece en el otro.
 *
 * Cada línea trae su editor ("Editar"): por dinero, por peso o por piezas. Abre
 * uno a la vez, debajo de su propia línea. Todo número es una estimación; el
 * servidor recalcula el total al crear el pedido.
 *
 * Si está abierta o cerrada NO se toma de `usePedido`: el gancho recuerda ese
 * dato en el almacenamiento y lo restaura al cargar, y un diálogo modal que se
 * abre solo al entrar a la página sería un secuestro. Aquí manda el estado
 * local de la carcasa.
 */
export function CarritoHoja({ abierta, alCerrar }: CarritoHojaProps): JSX.Element {
  const { lineas, total, quitar, editar, cerrar } = usePedido({ leer: leerPedidoGuardado });
  const [editando, setEditando] = useState<string | null>(null);

  // Las páginas viejas guardan "cajón abierto" y el gancho lo hereda al montar:
  // en el teléfono eso bloquearía el scroll de una página que no tiene cajón.
  // Se descarta ese valor heredado.
  useEffect(() => {
    cerrar();
  }, [cerrar]);

  const hayLineas = lineas.length > 0;

  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      nombre="carrito"
      lado="derecha"
      titulo="Tu pedido"
      etiquetaCerrar="Cerrar el pedido"
      pie={
        hayLineas ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-ui text-text">Total aproximado</span>
              <span className="text-titulo font-semibold tabular-nums">{formatearPrecio(total, 'ticket')}</span>
            </div>
            <p className="text-meta text-text-muted">
              El peso final puede variar; el total se confirma al preparar tu pedido.
            </p>
            <a href="products.html#/carrito" onClick={alCerrar} className={`${BOTON_ROJO} w-full`}>
              Continuar con el pedido
            </a>
          </div>
        ) : undefined
      }
    >
      {hayLineas ? (
        <ul className="divide-y divide-border px-5">
          {lineas.map((linea) => {
            const abierto = editando === linea.lineId;
            return (
              <li key={linea.lineId} className="py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={assetUrl(linea.image)}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="size-14 shrink-0 rounded-control bg-surface-2 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-ui font-medium text-text">{linea.name}</p>
                    <p className="text-meta text-text-muted">
                      {FORMATO_CANTIDAD.format(linea.quantity)} {etiquetaUnidad(linea.unit, linea.quantity)} ×{' '}
                      {formatearPrecio(linea.pricePerKg, 'ticket')}
                    </p>
                    <button
                      type="button"
                      aria-label={`Editar ${linea.name}`}
                      aria-expanded={abierto}
                      aria-controls={`editor-${linea.lineId}`}
                      onClick={() => setEditando(abierto ? null : linea.lineId)}
                      className="inline-flex min-h-11 items-center text-meta text-sand underline underline-offset-4 transition-colors duration-150 ease-out-strong hover:text-text"
                    >
                      Editar
                    </button>
                  </div>
                  <p className="shrink-0 text-ui font-medium text-text tabular-nums">
                    {formatearPrecio(totalDeLinea(linea), 'ticket')}
                  </p>
                  <button
                    type="button"
                    aria-label={`Quitar ${linea.name}`}
                    onClick={() => quitar(linea.lineId)}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition-[background-color,color,scale] duration-150 ease-out-strong hover:bg-surface-2 hover:text-text active:scale-95"
                  >
                    <IconoCerrar tamano={18} />
                  </button>
                </div>

                {abierto ? (
                  <div id={`editor-${linea.lineId}`} className="mt-3">
                    <EditorLinea linea={linea} alGuardar={(solicitud, cantidad) => editar(linea.lineId, solicitud, cantidad)} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-5 px-5 py-10">
          <div className="aspect-[4/3] w-60 overflow-hidden rounded-card bg-surface-2">
            <FotoAmbiente
              base="/img/comercio-v1/vacio-carrito"
              anchoGrande={1152}
              alt="Bolsa del mandado vacía sobre el mostrador."
              sizes="240px"
              width={1152}
              height={864}
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-display text-titulo">Tu pedido está vacío.</p>
            <p className="text-ui text-text-muted">Elige tus cortes en el catálogo y aparecerán aquí.</p>
          </div>
          <a href="catalogo.html" onClick={alCerrar} className={BOTON_ROJO}>
            Ver productos
          </a>
        </div>
      )}
    </Hoja>
  );
}
