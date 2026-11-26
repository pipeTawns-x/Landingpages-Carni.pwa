import { Lupa } from '@src/components/Lupa/Lupa';
import type { Product } from '@src/types/database';
import { Hoja } from './Hoja';

export interface LupaHojaProps {
  abierta: boolean;
  alCerrar: () => void;
  /** Qué hacer con el producto elegido. Lo decide la carcasa, no la Lupa. */
  alElegir: (producto: Product) => void;
}

/**
 * La búsqueda de la tienda nueva: la MISMA `Hoja` que el menú y el pedido.
 *
 * Este archivo es el que reemplaza al popin que la Lupa se montaba antes. No
 * decide nada —no hay estado, no hay foco, no hay fondo—: pone el contenido de
 * la Lupa dentro de la superposición compartida y pide que el foco caiga en el
 * campo, que es lo único que se hace aquí y no en las hojas de lectura.
 *
 * Va centrada y no como hoja lateral porque la búsqueda es una tarea corta con
 * campo y resultados: entra, se lee, se elige y sale. Y lleva descripción
 * propia para que el lector de pantalla anuncie "Buscar, diálogo, busca por
 * nombre o descripción" en vez de dejar al usuario adivinando qué hay dentro.
 */
export function LupaHoja({ abierta, alCerrar, alElegir }: LupaHojaProps): JSX.Element {
  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      nombre="buscar"
      lado="centro"
      titulo="Buscar"
      etiquetaCerrar="Cerrar la búsqueda"
      descripcion="Busca por nombre o descripción del corte."
      focoEnContenido
    >
      <Lupa onPickProduct={alElegir} />
    </Hoja>
  );
}