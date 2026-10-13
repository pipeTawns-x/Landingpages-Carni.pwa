/**
 * Cómo se presenta la cabeza de una Tarjeta de producto.
 *
 * Módulo puro y sin imports de ejecución: se prueba en Jest sin tocar el
 * catálogo ni `import.meta`.
 *
 * El catálogo tiene 53 productos pero pocas fotos propias. Muchos comparten la
 * foto genérica de su categoría, y repetirla en una fila entera se ve como un
 * error, no como un diseño. Por eso cada tarjeta se presenta de una de tres
 * maneras, decidida sobre la lista que de verdad se está pintando:
 *
 *   - `foto`: foto propia del producto.
 *   - `ilustrativa`: foto de la categoría, rotulada "Foto ilustrativa", cuando
 *     aparece una o dos veces en la lista.
 *   - `tipografica`: sin imagen, con el ícono de la categoría. Es lo honesto
 *     cuando la foto falta, es de un corte distinto, tiene marca de agua o se
 *     repetiría demasiado.
 */

export type Presentacion = 'foto' | 'ilustrativa' | 'tipografica';

/** Fotos genéricas de categoría: sirven de ilustración, no de foto del producto. */
export const FOTOS_DE_CATEGORIA: ReadonlySet<string> = new Set([
  'res.webp',
  'pollo.webp',
  'cerdo.webp',
  'preparadas.webp',
  'embutidos.webp',
  'merch.webp',
  'otrosproductos.webp',
  'frutasverduras.webp',
  'premium.webp'
]);

/**
 * Fotos que no se muestran nunca en una tarjeta:
 *   - `pollo.webp`: trae marca de agua de banco de imágenes.
 *   - `premium.webp`: marca de agua por revisar.
 *   - `merch.webp` y `otrosproductos.webp`: aspecto de imagen generada.
 *   - `frutasverduras.webp`: la categoría no existe en la tienda.
 *   - `rib-eye.webp`: en realidad muestra un T-bone.
 */
export const FOTOS_VETADAS: ReadonlySet<string> = new Set([
  'pollo.webp',
  'premium.webp',
  'merch.webp',
  'otrosproductos.webp',
  'frutasverduras.webp',
  'rib-eye.webp'
]);

/** Desde cuántas veces en una misma lista una foto de categoría deja de servir. */
const REPETICIONES_PERMITIDAS = 2;

/** `"/img/products/res.webp?v=2"` a `"res.webp"`. */
function nombreDeArchivo(foto: string): string {
  const sinConsulta = foto.split(/[?#]/)[0] ?? '';
  return sinConsulta.slice(sinConsulta.lastIndexOf('/') + 1).toLowerCase();
}

/**
 * Decide la presentación de cada producto de la lista visible.
 *
 * Reglas, en este orden:
 *   1. Sin foto, o foto vetada: `tipografica`.
 *   2. Foto de categoría: si se repite más de dos veces en la lista,
 *      `tipografica`; si no, `ilustrativa`.
 *   3. Cualquier otra: `foto` (es propia del producto).
 *
 * Devuelve un mapa por `id`. Quien pinta la lista debe pasar la lista que se ve,
 * no el catálogo entero: la misma foto puede sobrar en una fila y estar bien en
 * otra.
 */
export function elegirPresentacion(
  lista: ReadonlyArray<{ id: number; foto: string | null }>
): Map<number, Presentacion> {
  const veces = new Map<string, number>();
  for (const { foto } of lista) {
    if (foto) {
      const archivo = nombreDeArchivo(foto);
      veces.set(archivo, (veces.get(archivo) ?? 0) + 1);
    }
  }

  const resultado = new Map<number, Presentacion>();
  for (const { id, foto } of lista) {
    if (!foto) {
      resultado.set(id, 'tipografica');
      continue;
    }

    const archivo = nombreDeArchivo(foto);
    if (FOTOS_VETADAS.has(archivo)) {
      resultado.set(id, 'tipografica');
    } else if (FOTOS_DE_CATEGORIA.has(archivo)) {
      resultado.set(id, (veces.get(archivo) ?? 0) > REPETICIONES_PERMITIDAS ? 'tipografica' : 'ilustrativa');
    } else {
      resultado.set(id, 'foto');
    }
  }
  return resultado;
}

export type Unidad = 'kg' | 'paquete';

/**
 * En qué se cobra un producto. Un paquete se vende por paquete, salvo los que
 * dicen "por kilo" en su nombre, que siguen siendo por peso.
 */
export function unidadDe(nombre: string): Unidad {
  return /^Paquete /.test(nombre) && !/por kilo/i.test(nombre) ? 'paquete' : 'kg';
}
