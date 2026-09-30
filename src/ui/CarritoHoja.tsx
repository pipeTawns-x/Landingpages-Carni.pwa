import { useEffect } from 'react';
import { usePedido } from '@src/hooks/usePedido';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import { leerPedidoGuardado } from '@src/lib/pedidoStorage';
import type { OrderLine } from '@src/types/database';
import { assetUrl } from './assetUrl';
import { Hoja } from './Hoja';
import { IconoCerrar } from './iconos';

export interface CarritoHojaProps {
  abierta: boolean;
  alCerrar: () => void;
}

const FORMATO_CANTIDAD = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 });

/** La unidad viaja con la línea: una gorra no se cobra como "1 kg × $250". */
function etiquetaUnidad(unidad: OrderLine['unit'], cantidad: number): string {
  if (unidad === 'unidad') {
    return cantidad === 1 ? 'pieza' : 'piezas';
  }
  if (unidad === 'paquete') {
    return cantidad === 1 ? 'paquete' : 'paquetes';
  }
  return 'kg';
}

const BOTON_ROJO =
  'inline-flex h-12 items-center justify-center rounded-pill bg-red px-6 text-ui font-medium text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-[0.97]';

/**
 * El pedido en curso, en una hoja por la derecha.
 *
 * Lee el mismo pedido que las páginas viejas (`carni_cart_v1` y el evento
 * `cart:updated`), así que lo agregado en un lado aparece en el otro.
 *
 * Si está abierta o cerrada NO se toma de `usePedido`: el gancho recuerda ese
 * dato en el almacenamiento y lo restaura al cargar, y un diálogo modal que se
 * abre solo al entrar a la página sería un secuestro. Aquí manda el estado
 * local de la carcasa.
 */
export function CarritoHoja({ abierta, alCerrar }: CarritoHojaProps): JSX.Element {
  const { lineas, total, quitar, cerrar } = usePedido({ leer: leerPedidoGuardado });

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
          {lineas.map((linea) => (
            <li key={linea.lineId} className="flex items-center gap-3 py-3">
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
              </div>
              <p className="shrink-0 text-ui font-medium text-text tabular-nums">
                {formatearPrecio(linea.pricePerKg * linea.quantity, 'ticket')}
              </p>
              <button
                type="button"
                aria-label={`Quitar ${linea.name}`}
                onClick={() => quitar(linea.lineId)}
                className="grid size-11 shrink-0 place-items-center rounded-full text-text-muted transition-[background-color,color,scale] duration-150 ease-out-strong hover:bg-surface-2 hover:text-text active:scale-95"
              >
                <IconoCerrar tamano={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-5 px-5 py-10">
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
