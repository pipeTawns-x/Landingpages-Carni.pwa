import type { CategoriaVista } from '@src/data/catalogo';
import { CeldaBento } from '@src/ui/Tarjeta';
import { CATEGORIAS_BENTO, CONTENEDOR } from './datos';

export interface MostradorProps {
  categorias: readonly CategoriaVista[];
}

/**
 * "Todo lo del mostrador": las nueve categorías de la tienda como un bento.
 *
 * Móvil: dos columnas, con Carnes rojas a lo ancho. Escritorio: cuatro columnas,
 * con Carnes rojas en 2×2. Cinco celdas llevan foto y cuatro son tipográficas
 * (las de fotos vetadas), y eso da el ritmo sin inventar imágenes.
 *
 * El nombre sale del catálogo y el orden, la descripción y la foto de
 * `CATEGORIAS_BENTO`. Una categoría que el catálogo no trae no se pinta. No hay
 * cifras de productos: un conteo caducaría en cuanto cambie el inventario.
 */
export function Mostrador({ categorias }: MostradorProps): JSX.Element {
  return (
    <section id="mostrador" className="pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div className={CONTENEDOR}>
        <h2 className="text-seccion">Todo lo del mostrador</h2>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4 lg:gap-4">
          {CATEGORIAS_BENTO.map((entrada) => {
            const categoria = categorias.find((c) => c.slug === entrada.slug);
            if (!categoria) {
              return null;
            }
            return (
              <CeldaBento
                key={entrada.slug}
                slug={entrada.slug}
                nombre={categoria.nombre}
                descripcion={entrada.descripcion}
                href={`catalogo.html#categoria=${entrada.slug}`}
                foto={entrada.foto}
                posicion={entrada.posicion}
                grande={entrada.grande}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
