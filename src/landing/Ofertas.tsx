import { assetUrl } from '@src/ui/assetUrl';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import { Tarjeta } from '@src/ui/Tarjeta';
import { IconoFlecha } from '@src/ui/iconos';
import { OFERTAS, rutaCategoria } from './datos';
import { buscarProductoPorNombre, useCatalogoVivo } from './useCatalogoVivo';

/**
 * "Ofertas". En 390px es un riel horizontal con scroll-snap (intencional,
 * como el de reseñas: no cuenta como scroll horizontal de página). En
 * escritorio es una rejilla de 4 columnas.
 */
export function Ofertas(): JSX.Element {
  const catalogo = useCatalogoVivo();

  return (
    <section className="pt-14 lg:pt-[120px]">
      <div className="flex flex-col gap-2 px-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:px-8">
        <div className="flex flex-col gap-2 lg:gap-2.5">
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">Esta semana</span>
          <h2 className="m-0 font-display text-[30px] font-[460] leading-9 lg:text-[44px] lg:leading-[50px]">
            Ofertas
          </h2>
          <span className="text-sm text-text-muted lg:text-[15px]">
            Precio por paquete, no por kilo. Sujetos a existencia.
          </span>
        </div>
        <a
          href={rutaCategoria('ofertas')}
          className="hidden h-11 items-center gap-2 text-[15px] font-semibold text-text no-underline lg:flex"
        >
          Ver todas las ofertas
          <IconoFlecha size={18} className="shrink-0 text-sand" />
        </a>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto px-4 pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] lg:mt-7 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-8 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {OFERTAS.map((producto) => {
          const real = buscarProductoPorNombre(catalogo, producto.nombre);
          const enlace = real ? `products.html#/producto/${real.id}` : producto.enlace;
          const precio = real ? formatearPrecio(real.price_per_kg) : producto.precio;
          const stock = real ? `${real.stock} en stock` : producto.stock;

          return (
            <div key={producto.nombre} className="w-[240px] shrink-0 [scroll-snap-align:start] lg:w-auto">
              <Tarjeta
                variante="oferta"
                foto={assetUrl(producto.foto)}
                posicion={producto.posicion}
                categoria={producto.categoria}
                nombre={producto.nombre}
                descripcion={producto.descripcion}
                precio={precio}
                unidad={producto.unidad}
                stock={stock}
                enlace={enlace}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
