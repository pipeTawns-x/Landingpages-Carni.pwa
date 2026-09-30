import { assetUrl } from '@src/ui/assetUrl';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import { PRODUCTO_DESTACADO } from './datos';
import { buscarProductoPorNombre, useCatalogoVivo } from './useCatalogoVivo';

/**
 * "De la vitrina" — el Filete Mignon destacado.
 *
 * "Agregar" y "Ver la ficha" enlazan a la ficha real
 * (`products.html#/producto/<id>`) cuando el catálogo vivo trae un producto
 * llamado "Filete Mignon" — lo trae: se verificó contra la base local
 * (id 10, $689/kg, 20 en existencia, igual que el diseño). Si el catálogo no
 * respondiera, cae al enlace de categoría estático de datos.ts.
 */
export function Destacado(): JSX.Element {
  const p = PRODUCTO_DESTACADO;
  const catalogo = useCatalogoVivo();
  const real = buscarProductoPorNombre(catalogo, p.nombre);

  const enlace = real ? `products.html#/producto/${real.id}` : p.enlace;
  const precio = real ? formatearPrecio(real.price_per_kg) : p.precio;
  const stock = real ? real.stock : null;

  return (
    <section className="px-4 pt-14 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-8 lg:pt-[120px]">
      {/* En móvil (línea 86 del diseño) el rótulo va ARRIBA de las fotos, como
          primer hijo de la sección. En escritorio se apaga aquí — `hidden`
          saca el elemento del flujo de la rejilla, así que no ocupa una
          columna de más — y reaparece dentro de la columna de texto, abajo. */}
      <span className="mb-3.5 block text-xs font-medium uppercase tracking-[0.04em] text-sand lg:hidden">
        De la vitrina
      </span>

      {/* Altura explícita en cada ancho (300 / 600, líneas 87 y 277 del
          diseño) en vez del `style={{height:300}}` fijo que había antes —
          ese valor no cambiaba nunca en escritorio y las fotos terminaban
          más altas que su caja, encimándose con la sección siguiente.
          `h-full min-h-0` en cada celda de la rejilla (incluida la anidada)
          es lo que impide que una imagen "empuje" su contenedor: sin eso,
          el tamaño mínimo por defecto de una celda de grid es el de su
          contenido, no el de la pista. */}
      <div className="grid h-[300px] grid-cols-[2fr_1fr] gap-2 lg:h-[600px] lg:gap-3">
        <div className="h-full min-h-0 overflow-hidden rounded-[24px] bg-surface-2 lg:rounded-[28px]">
          <img src={assetUrl(p.fotoPrincipal)} alt="Filete Mignon" className="h-full w-full object-cover" />
        </div>
        <div className="grid h-full min-h-0 grid-rows-2 gap-2 lg:gap-3">
          <div className="h-full min-h-0 overflow-hidden rounded-2xl bg-surface-2">
            <img src={assetUrl(p.fotoDetalle)} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="h-full min-h-0 overflow-hidden rounded-2xl bg-surface-2">
            <img src={assetUrl(p.fotoTercera)} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 lg:mt-0 lg:gap-4">
        <span className="hidden text-xs font-medium uppercase tracking-[0.04em] text-sand lg:block">
          De la vitrina
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.04em] text-text-muted lg:text-[13px]">
          Cortes especiales · {stock ?? 20} en stock
        </span>
        <h2 className="m-0 font-display text-[34px] font-[460] leading-10 lg:text-[56px] lg:leading-[60px]">
          {p.nombre}
        </h2>
        <p className="m-0 max-w-[44ch] text-pretty text-base leading-6 text-text-muted lg:text-lg lg:leading-7">
          {p.descripcion}
        </p>
        <div className="flex items-baseline gap-2 pt-1 tabular-nums lg:gap-2.5">
          <span className="text-[28px] font-semibold leading-8 lg:text-[36px] lg:leading-10">{precio}</span>
          <span className="text-base text-text-muted lg:text-lg">/ kg</span>
          <span className="ml-2 text-[15px] text-text-muted lg:ml-3 lg:text-base">{p.precioPorLibra}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1.5 lg:flex lg:gap-3 lg:pt-2">
          <a
            href={enlace}
            className="flex h-12 items-center justify-center rounded-pill bg-red px-8 text-center text-[15px] font-semibold text-white no-underline hover:bg-red-hover lg:h-[52px] lg:text-base"
          >
            Agregar
          </a>
          <a
            href={enlace}
            className="flex h-12 items-center justify-center rounded-pill border border-sand px-7 text-center text-[15px] font-semibold text-text no-underline lg:h-[52px] lg:text-base"
          >
            Ver la ficha
          </a>
        </div>
      </div>
    </section>
  );
}
