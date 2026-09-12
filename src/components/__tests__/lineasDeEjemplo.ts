import type { OrderLine } from '@src/types/database';

/**
 * Las dos lineas de pedido que comparten CartPanel y OrderList.
 *
 * Viven aqui y no dentro de cada archivo de test porque son EL MISMO dato: si
 * `OrderLine` gana un campo obligatorio, el compilador tiene que avisar en un
 * solo sitio y no en dos que se fueron separando.
 *
 * No son dos lineas por adorno. La segunda hace visible un error que con una
 * sola linea pasaria desapercibido: un componente que siempre devolviera
 * `order[0].lineId` aprobaria el test del boton de quitar.
 */

/** Vendida por peso: su etiqueta es "kg". */
export const LINEA_RIB_EYE: OrderLine = {
  lineId: 'linea-rib-eye',
  productId: 7,
  name: 'Rib Eye',
  pricePerKg: 450,
  quantity: 1,
  image: '/img/products/rib-eye.webp',
  categorySlug: 'cortes-especiales',
  unit: 'kg'
};

/**
 * Vendida por pieza y con productId de texto.
 *
 * Las dos cosas son deliberadas: `unit: 'unidad'` obliga a que la fila diga
 * "2 piezas" y no "2 kg", que fue un error real del carrito; y el id de texto
 * recuerda que los pedidos guardados por la version vieja del sitio traen
 * slugs, no numeros.
 */
export const LINEA_GORRA: OrderLine = {
  lineId: 'linea-gorra',
  productId: 'gorra-logo',
  name: 'Gorra con Logo',
  pricePerKg: 250,
  quantity: 2,
  image: '/img/products/merch.webp',
  categorySlug: 'merch',
  unit: 'unidad'
};

/** Lo que suman las dos lineas: 450 x 1 + 250 x 2. */
export const TOTAL_DEL_PEDIDO =
  LINEA_RIB_EYE.pricePerKg * LINEA_RIB_EYE.quantity +
  LINEA_GORRA.pricePerKg * LINEA_GORRA.quantity;
