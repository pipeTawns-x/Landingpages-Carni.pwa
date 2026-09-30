import { assetUrl } from '@src/ui/assetUrl';
import { IconoFlecha } from '@src/ui/iconos';
import { CATEGORIAS_BENTO, RUTA_CATALOGO, rutaCategoria } from './datos';

/**
 * Tailwind necesita ver el nombre completo de la clase en el código fuente
 * para generarla — "col-span-" + n armado en tiempo de ejecución no lo
 * detecta su escáner. De ahí estas dos funciones con las cuatro cadenas
 * literales completas, en vez de una plantilla con interpolación.
 */
function claseColumnaMovil(n: number | undefined): string {
  return n === 2 ? 'col-span-2' : 'col-span-1';
}
function claseFilaMovil(n: number | undefined): string {
  return n === 2 ? 'row-span-2' : 'row-span-1';
}
/* Con el prefijo `lg:` ya escrito en las dos ramas — "lg:" + el resultado de
   claseColumnaMovil() en tiempo de ejecución NO basta: el escáner de
   Tailwind lee el texto del archivo, no lo que arma el navegador, así que
   necesita encontrar "lg:col-span-2" ya completo en el código fuente. */
function claseColumnaEscritorio(n: number | undefined): string {
  return n === 2 ? 'lg:col-span-2' : 'lg:col-span-1';
}
function claseFilaEscritorio(n: number | undefined): string {
  return n === 2 ? 'lg:row-span-2' : 'lg:row-span-1';
}

export function BentoCategorias(): JSX.Element {
  return (
    <section className="px-4 pt-14 lg:px-8 lg:pt-24">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-2 lg:gap-2.5">
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">Categorías</span>
          <h2 className="m-0 font-display text-[30px] font-[460] leading-9 lg:text-[44px] lg:leading-[50px]">
            Todo lo del mostrador
          </h2>
        </div>
        <a
          href={RUTA_CATALOGO}
          className="hidden h-11 items-center gap-2 text-[15px] font-semibold text-text no-underline lg:flex"
        >
          Ver el catálogo completo
          <IconoFlecha size={18} className="shrink-0 text-sand" />
        </a>
      </div>

      <div className="mt-5 grid grid-cols-[repeat(2,minmax(0,1fr))] auto-rows-[152px] gap-2.5 lg:mt-7 lg:grid-cols-[repeat(5,minmax(0,1fr))] lg:auto-rows-[232px] lg:gap-4">
        {CATEGORIAS_BENTO.map((tile, indice) => {
          const grandeMovil = indice === 0;
          const grandeEscritorio = Boolean(tile.columnasEscritorio || tile.filasEscritorio);

          return (
            <a
              key={tile.slug}
              href={rutaCategoria(tile.slug)}
              className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-1 text-text no-underline hover:border-sand ${claseColumnaMovil(
                grandeMovil ? (tile.columnasMovil ?? 2) : 1
              )} ${claseFilaMovil(grandeMovil ? (tile.filasMovil ?? 2) : 1)} ${claseColumnaEscritorio(
                tile.columnasEscritorio
              )} ${claseFilaEscritorio(tile.filasEscritorio)}`}
            >
              <span className="block min-h-0 flex-1 bg-surface-2">
                <img
                  src={assetUrl(`/img/products/${tile.archivo}`)}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ objectPosition: tile.posicion }}
                  loading="lazy"
                />
              </span>
              {grandeMovil || grandeEscritorio ? (
                <span
                  className={`flex flex-none flex-col gap-0.5 px-3.5 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-5 lg:py-4 ${
                    grandeMovil ? '' : 'hidden lg:flex'
                  } ${grandeEscritorio ? 'lg:flex' : 'lg:hidden'}`}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-[22px] font-[460] leading-[26px] lg:text-[26px] lg:leading-8">
                      {tile.nombre}
                    </span>
                    {tile.descripcion ? (
                      <span className="text-[13px] leading-[18px] text-text-muted lg:text-sm lg:leading-5">
                        {tile.descripcion}
                      </span>
                    ) : null}
                  </span>
                  <IconoFlecha size={20} className="hidden shrink-0 text-sand lg:block" />
                </span>
              ) : null}
              {!grandeMovil ? (
                <span className="flex h-11 flex-none items-center justify-between gap-1.5 px-3 lg:hidden">
                  <span className="text-[15px] font-semibold leading-[18px]">{tile.nombre}</span>
                  <IconoFlecha size={16} className="shrink-0 text-sand" />
                </span>
              ) : null}
              {!grandeEscritorio ? (
                <span className="hidden h-[52px] flex-none items-center justify-between gap-2 px-4 lg:flex">
                  <span className="text-base font-semibold leading-5">{tile.nombre}</span>
                  <IconoFlecha size={18} className="shrink-0 text-sand" />
                </span>
              ) : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
