import type { ProductoVista } from '@src/data/catalogo';

/**
 * Lo que la landing decide por su cuenta: qué productos muestra, en qué orden y
 * qué dice cada categoría. Los precios, los nombres y las fotos NO están aquí:
 * salen del catálogo. Los datos del negocio (teléfono, horario, dirección,
 * redes) salen de `src/data/negocio.ts`.
 */

/** Ancho y márgenes del contenido: el mismo que usa el pie, para que todo alinee. */
export const CONTENEDOR = 'mx-auto w-full max-w-7xl px-5 lg:px-6';

/* ------------------------------------------------------------- selección */

/**
 * Los siete cortes del carrusel, en este orden.
 * Filete Mignon, Tomahawk, New York Strip, Porterhouse, Arrachera, Flank Steak
 * y Top Sirloin. Rib Eye (8) queda fuera porque su foto muestra un T-bone.
 */
export const IDS_CORTES: readonly number[] = [10, 7, 11, 9, 13, 14, 12];

/** "Lo que se lleva la gente": Flank Steak, Top Sirloin, Bistec de Res y Diezmillo. */
export const IDS_POPULARES: readonly number[] = [14, 12, 1, 3];

/** Las tres ofertas: Vacío en Oferta y los dos paquetes de asador. */
export const IDS_OFERTAS: readonly number[] = [40, 41, 42];

/**
 * Resuelve una lista de ids contra el catálogo, en ese mismo orden.
 * Un id que ya no existe se omite: la landing no inventa el producto que falta.
 */
export function seleccionar(productos: readonly ProductoVista[], ids: readonly number[]): ProductoVista[] {
  const resultado: ProductoVista[] = [];
  for (const id of ids) {
    const producto = productos.find((p) => p.id === id);
    if (producto) {
      resultado.push(producto);
    }
  }
  return resultado;
}

/* ------------------------------------------------------- mostrador (bento) */

export interface CategoriaBento {
  slug: string;
  /** Una línea con lo que hay en esa categoría, tomada de los productos reales. */
  descripcion: string;
  /** Foto de la celda. Sin ella, la celda es tipográfica. */
  foto?: string;
  posicion?: string;
  grande?: boolean;
}

/**
 * Las nueve categorías del mostrador, en el orden de la tienda.
 *
 * El nombre visible sale del catálogo; aquí solo viven la descripción y la foto.
 * Pollo, Ofertas, Merch y Otros no llevan foto: sus imágenes de categoría están
 * vetadas (marca de agua, aspecto generado o una categoría que no existe), así
 * que la celda es tipográfica. Ninguna descripción lleva cifras de productos.
 */
export const CATEGORIAS_BENTO: readonly CategoriaBento[] = [
  {
    slug: 'carnes-rojas',
    descripcion: 'Bistec, diezmillo, molida y para caldo',
    foto: '/img/products/res.webp',
    posicion: '50% 50%',
    grande: true
  },
  {
    slug: 'cortes-especiales',
    descripcion: 'Filete mignon, tomahawk, arrachera',
    foto: '/img/products/filet_mignon.webp',
    posicion: '50% 50%'
  },
  { slug: 'pollo', descripcion: 'Pechuga, pierna y muslo, alas' },
  {
    slug: 'cerdo',
    descripcion: 'Chuleta, costilla, lomo y carnitas',
    foto: '/img/products/cerdo.webp',
    posicion: '50% 50%'
  },
  {
    slug: 'preparadas',
    descripcion: 'Chorizos, bistec adobado y pollo marinado',
    foto: '/img/products/preparadas.webp',
    posicion: '50% 50%'
  },
  {
    slug: 'embutidos',
    descripcion: 'Salchicha, longaniza, tocino y jamón',
    foto: '/img/products/embutidos.webp',
    posicion: '50% 50%'
  },
  { slug: 'ofertas', descripcion: 'Paquetes para 4 a 10 personas' },
  { slug: 'merch', descripcion: 'Gorra, delantal, hielera y cuchillo' },
  { slug: 'otros', descripcion: 'Carbón, leña, hielo y cebolla cambray' }
];

/* ------------------------------------------------------------ preguntas */

export interface Pregunta {
  pregunta: string;
  respuesta: string;
  /** Solo las publicadas llegan a la página. */
  publicada: boolean;
}

/**
 * Las cinco preguntas del diseño. Dos no se publican: sus respuestas dependen de
 * una política de peso real y de un cobro que todavía no existe, y una respuesta
 * que el negocio no puede cumplir es peor que no tener la pregunta. Quedan aquí,
 * sin publicar, hasta que la carnicería las valide.
 */
export const PREGUNTAS: readonly Pregunta[] = [
  {
    pregunta: '¿Cuál es el pedido mínimo?',
    respuesta: 'Para entrega a domicilio, $150. Si pasas a recoger a la tienda no hay mínimo.',
    publicada: true
  },
  {
    pregunta: '¿A qué zonas entregan?',
    respuesta:
      'A zonas participantes de San Luis Potosí. Cuando escribes tu dirección en el pedido te decimos si tu colonia está cubierta.',
    publicada: true
  },
  {
    pregunta: '¿Puedo pedir por precio en vez de por peso?',
    respuesta: 'Sí. En cada corte eliges por peso, por precio o por pieza, y el grosor que quieres.',
    publicada: true
  },
  {
    pregunta: '¿Y si el peso no sale exacto?',
    respuesta:
      'El cuchillo no siempre cae en el gramo. Cortamos lo más cerca posible de lo que pediste y se cobra el peso real de la pieza.',
    publicada: false
  },
  {
    pregunta: '¿Cómo pago?',
    respuesta: 'Con tarjeta al confirmar el pedido. Si pasas a recoger, también en el mostrador.',
    publicada: false
  }
];

/** Lo único que se renderiza. */
export const PREGUNTAS_VISIBLES: readonly Pregunta[] = PREGUNTAS.filter((p) => p.publicada);

/* ------------------------------------------------------------ comentarios */

/**
 * Cuándo se leyeron las opiniones de `resenas.ts` en el perfil de Google. El
 * archivo no guarda la fecha de cada reseña, así que no se inventa ninguna: se
 * dice cuándo se leyó la selección.
 */
export const FECHA_LECTURA_RESENAS = '3 de septiembre de 2026';
