import { assetUrl } from '@src/ui/assetUrl';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import { Tarjeta } from '@src/ui/Tarjeta';
import { PRODUCTOS_MAS_PEDIDOS } from './datos';
import { buscarProductoPorNombre, useCatalogoVivo } from './useCatalogoVivo';

export function MasPedidos(): JSX.Element {
  const catalogo = useCatalogoVivo();

  return (
    <section className="px-4 pt-14 lg:px-8 lg:pt-[120px]">
      <div className="flex flex-col gap-2 lg:gap-2.5">
        <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">Los más pedidos</span>
        <h2 className="m-0 font-display text-[30px] font-[460] leading-9 lg:text-[44px] lg:leading-[50px]">
          Lo que se lleva la gente
        </h2>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:mt-7 lg:grid-cols-4 lg:gap-6">
        {PRODUCTOS_MAS_PEDIDOS.map((producto) => {
          const real = buscarProductoPorNombre(catalogo, producto.nombre);
          const enlace = real ? `products.html#/producto/${real.id}` : producto.enlace;
          const precio = real ? formatearPrecio(real.price_per_kg) : producto.precio;
          const stock = real ? `${real.stock} en stock` : producto.stock;

          return (
            <Tarjeta
              key={producto.nombre}
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
          );
        })}
      </div>
    </section>
  );
}
