/**
 * Qué cuenta como corte premium — la única fuente de verdad.
 *
 * Este archivo existe por un defecto que costó dinero real y no daba ningún
 * error. `isPremiumCutItem()` exigía `categoria === 'premium'`, pero en Supabase
 * NO existe ninguna categoría con ese slug: los reales son `cortes-especiales`,
 * `carnes-rojas`, `cerdo`, `pollo`, `embutidos`, `preparadas`, `ofertas`,
 * `merch` y `otros`.
 *
 * El vocabulario `'premium'` venía de catálogos escritos a mano que sobrevivieron
 * a la migración a Supabase y que se borraron el 2026-09-02. Mientras tanto, todo
 * el motor de cotización —los tres modos, el grosor, el peso unitario— quedaba
 * inalcanzable: cada corte caía en la rama simple y se cobraba de menos.
 *
 * Medido: 3 Rib Eye de 1.5" cobraban $372.00 en vez de $892.80. $520.80 perdidos
 * por pedido, en silencio.
 *
 * Lo importan tanto el JavaScript plano (`cart.js`) como las islas de React, para
 * que no vuelvan a existir dos criterios que digan cosas distintas.
 */

/**
 * Las categorías cuyos productos se cotizan por grosor y pieza.
 *
 * Es una lista y no una sola cadena porque la carnicería puede abrir otra
 * categoría de cortes finos sin que haya que tocar la lógica de cotización.
 */
export const SLUGS_CORTE_PREMIUM = [
  'cortes-especiales',
  // Alias histórico. Ningún producto de Supabase lo usa, pero el navegador de un
  // cliente que armó su carrito antes del 2026-09-02 todavía guarda artículos con
  // `categoria: 'premium'`. Quitarlo de la lista los degradaría a la rama simple
  // y les cambiaría el precio a mitad de compra.
  'premium'
];

/**
 * Grosor de referencia, en pulgadas, contra el que se escala el peso unitario.
 *
 * Vive aquí y no en `cart.js` porque el panel de administración va a tener que
 * poder cambiarlo: el valor salió de una recomendación general, no de la
 * carnicería. Ver P-36.
 */
export const GROSOR_REFERENCIA_IN = 1.25;

/**
 * ¿Este artículo se cotiza como corte premium?
 *
 * Acepta las dos formas que circulan por el proyecto: la del carrito
 * (`{ tipo, categoria }`) y la de la base (`{ categories, metadata }`).
 *
 * `metadata.es_corte_premium` **manda sobre el slug**, en los dos sentidos. Es
 * la válvula para que la dueña marque un corte premium que no vive en
 * `cortes-especiales`, o excluya uno que sí, sin migrar el esquema: la columna
 * `metadata` ya existe como JSONB y hoy está vacía en todos los productos.
 *
 * **No exige `tipo === 'corte'`, y eso es deliberado.** La comprobación anterior lo
 * pedía, pero `src/entry/products.tsx:192` deriva la unidad de la categoría y solo
 * produce `'kg'`, `'unidad'` o `'paquete'` — nunca `'corte'`. Un Rib Eye recién
 * agregado del catálogo salía con `tipo: 'kg'`, así que la comprobación fallaba por
 * las dos condiciones a la vez. La categoría ya dice que es un corte; pedir además
 * una etiqueta que nadie escribe solo volvía inalcanzable el motor de cotización.
 *
 * @param {{tipo?: string, categoria?: string, categories?: unknown, metadata?: Record<string, unknown>|null}} item
 * @returns {boolean}
 */
export function esCortePremium(item) {
  if (!item) {
    return false;
  }

  // La anulación explícita del panel gana, valga true o false.
  const marca = item.metadata && item.metadata.es_corte_premium;
  if (typeof marca === 'boolean') {
    return marca;
  }

  return SLUGS_CORTE_PREMIUM.includes(slugDeCategoria(item));
}

/**
 * Saca el slug de categoría de cualquiera de las formas que usa el proyecto.
 *
 * El carrito guarda `categoria` como cadena; la base devuelve `categories`, que
 * según la consulta llega como objeto o como arreglo de un elemento.
 *
 * @param {{categoria?: string, categories?: unknown}} item
 * @returns {string}
 */
export function slugDeCategoria(item) {
  if (typeof item.categoria === 'string' && item.categoria) {
    return item.categoria;
  }

  const cats = item.categories;
  if (Array.isArray(cats)) {
    return (cats[0] && cats[0].slug) || '';
  }

  return (cats && cats.slug) || '';
}
