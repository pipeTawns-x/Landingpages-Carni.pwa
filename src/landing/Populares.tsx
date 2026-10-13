import type { ProductoVista } from '@src/data/catalogo';
import { elegirPresentacion } from '@src/ui/presentacionProducto';
import { Tarjeta } from '@src/ui/Tarjeta';
import { CONTENEDOR, IDS_POPULARES, seleccionar } from './datos';

export interface PopularesProps {
  productos: readonly ProductoVista[];
}

/**
 * "Lo que se lleva la gente": cuatro Tarjetas, dos por fila en móvil y cuatro
 * en escritorio. La presentación de cada una (foto propia, ilustrativa o
 * tipográfica) se decide sobre esta lista, que es la que se ve.
 */
export function Populares({ productos }: PopularesProps): JSX.Element {
  const elegidos = seleccionar(productos, IDS_POPULARES);
  const presentacion = elegirPresentacion(elegidos);

  return (
    <section id="populares" className="pb-16 lg:pb-24">
      <div className={CONTENEDOR}>
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-seccion">Lo que se lleva la gente</h2>
          <a
            href="catalogo.html"
            className="hidden min-h-11 shrink-0 items-center text-ui text-sand underline underline-offset-4 transition-colors duration-150 ease-out-strong hover:text-text sm:inline-flex"
          >
            Ver productos
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4 lg:gap-6">
          {elegidos.map((producto) => (
            <Tarjeta
              key={producto.id}
              producto={producto}
              presentacion={presentacion.get(producto.id) ?? 'tipografica'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
