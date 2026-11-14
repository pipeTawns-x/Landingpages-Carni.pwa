import type { ProductoVista } from '@src/data/catalogo';
import { Cenefa } from '@src/ui/Cenefa';
import { elegirPresentacion } from '@src/ui/presentacionProducto';
import { Tarjeta } from '@src/ui/Tarjeta';
import { CONTENEDOR, IDS_OFERTAS, seleccionar } from './datos';

export interface OfertasProps {
  productos: readonly ProductoVista[];
}

/**
 * "Ofertas": tres Tarjetas de oferta sobre una franja de azul talavera, con una
 * cenefa de azulejos arriba y abajo. Es el único bloque de color pleno de la
 * landing: rompe el negro del resto y marca dónde están las promociones.
 *
 * Móvil: un riel con deslizamiento por imanes y tarjetas al 80 % para que se
 * asome la siguiente. Escritorio: una cuadrícula asimétrica de 1,4 / 1 / 1, que
 * no se parece a la de Populares. Cada tarjeta mide lo suyo y se alinea arriba:
 * estirar las angostas hasta igualar a la ancha las llenaría de fondo vacío.
 *
 * Las tarjetas conservan su fondo `surface-1` y su foto real: son producto a la
 * venta. El azul solo es el escenario. La nota es la única de la landing sobre el
 * peso y el anticipo.
 */
export function Ofertas({ productos }: OfertasProps): JSX.Element {
  const elegidos = seleccionar(productos, IDS_OFERTAS);
  const presentacion = elegirPresentacion(elegidos);

  return (
    <section id="ofertas" className="bg-talavera-deep">
      <Cenefa className="h-7 lg:h-10" />

      <div className={`${CONTENEDOR} py-14 lg:py-20`}>
        <h2 className="text-seccion text-sand">Ofertas</h2>

        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:mt-12 lg:grid lg:grid-cols-[1.4fr_1fr_1fr] lg:items-start lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {elegidos.map((producto) => (
            <div key={producto.id} className="w-[80%] shrink-0 snap-start lg:w-auto">
              <Tarjeta
                producto={producto}
                variante="oferta"
                presentacion={presentacion.get(producto.id) ?? 'tipografica'}
              />
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-[60ch] text-meta text-text-muted">
          Todo paquete requiere un 50 % de anticipo. Precios de referencia; el peso final puede variar.
        </p>
      </div>

      <Cenefa className="h-7 lg:h-10" />
    </section>
  );
}
