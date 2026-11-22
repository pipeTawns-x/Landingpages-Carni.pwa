import type { CategoriaVista } from '@src/data/catalogo';
import { CeldaBento } from '@src/ui/Tarjeta';
import { CATEGORIAS_BENTO, CONTENEDOR } from './datos';

export interface MostradorProps {
  categorias: readonly CategoriaVista[];
}

/**
 * "Todo lo del mostrador": las nueve categorías de la tienda como un bento de
 * cartas de lotería, numeradas en el orden en que se ven.
 *
 * Móvil: dos columnas, con Carnes rojas a lo ancho. Escritorio: cuatro columnas,
 * con Carnes rojas en 2×2. Cada carta lleva su ilustración de ambiente; mientras
 * un archivo no exista usa la foto que ya había y, sin ninguna, el ícono de la
 * categoría (nunca una caja vacía).
 *
 * El nombre sale del catálogo, o sea de la base: lo que se agrega, renombra o
 * quita ahí se refleja aquí. El orden, la descripción y las imágenes salen de
 * `CATEGORIAS_BENTO`. Una categoría que el catálogo no trae no se pinta ni gasta
 * número. No hay cifras de productos: un conteo caducaría en cuanto cambie el
 * inventario.
 */
export function Mostrador({ categorias }: MostradorProps): JSX.Element {
  const cartas = CATEGORIAS_BENTO.flatMap((entrada) => {
    const categoria = categorias.find((c) => c.slug === entrada.slug);
    return categoria ? [{ entrada, nombre: categoria.nombre }] : [];
  });

  return (
    <section id="mostrador" className="pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div className={CONTENEDOR}>
        <h2 className="text-seccion">Todo lo del mostrador</h2>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4 lg:gap-4">
          {cartas.map(({ entrada, nombre }, indice) => (
            <CeldaBento
              key={entrada.slug}
              slug={entrada.slug}
              nombre={nombre}
              descripcion={entrada.descripcion}
              href={`catalogo.html#categoria=${entrada.slug}`}
              foto={entrada.foto}
              posicion={entrada.posicion}
              grande={entrada.grande}
              ilustracion={entrada.ilustracion}
              numero={indice + 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
