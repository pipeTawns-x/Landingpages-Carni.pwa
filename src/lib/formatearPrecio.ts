/**
 * El precio, en un solo sitio.
 *
 * Este bloque de `Intl.NumberFormat` estaba copiado en SEIS archivos —Lupa,
 * ProductCard, Showcase, OrderList, CartPanel y la pagina Carrito— y las copias
 * ya habian divergido: la Lupa mostraba «MXN 449.00» y la tarjeta del catalogo
 * «$449» para el MISMO producto en la MISMA web. Eso no se descubre leyendo un
 * archivo; se descubre poniendo las dos pantallas al lado.
 *
 * LO QUE SE UNIFICA ES DE DONDE SALE, NO COMO SE VE
 * -------------------------------------------------
 * Las variantes NO son un accidente que haya que aplanar. Son decisiones de
 * pantalla que ya estaban tomadas y que siguen siendo correctas:
 *
 * - La vitrina de la Lupa imita la referencia: codigo de moneda y dos decimales
 *   fijos, para que «$85» y «$120.50» no se alineen distinto en la misma fila de
 *   la rejilla.
 * - Las tarjetas del catalogo van compactas: simbolo y sin centavos. Un muro de
 *   «$449.00» solo suma ruido cuando lo que el cliente hace es comparar cortes.
 * - El ticket —el cajon, la lista de lineas y la pagina del pedido— SI lleva
 *   centavos: ahi ya no se compara, se paga, y un total redondeado a la baja es
 *   una cifra que no cuadra con lo que se cobra.
 *
 * Por eso la funcion recibe una variante en vez de tener tres nombres distintos:
 * el dia que cambie la moneda o la localidad se toca UNA linea, y las tres
 * pantallas se mueven juntas sin volver a divergir.
 *
 * NOTA HONESTA: el encargo hablaba de dos variantes. En el codigo real habia
 * TRES formatos distintos, no dos — el del ticket («$450.00», con centavos y con
 * simbolo) es un tercero que no coincide ni con la vitrina ni con la tarjeta.
 * Aplanarlo contra cualquiera de los otros dos habria cambiado lo que ve el
 * cliente, asi que se conserva tal cual estaba.
 */

/** Las tres pantallas donde hoy se dibuja un precio. */
export type VarianteDePrecio =
  /** Catalogo y vitrina de la portada: simbolo, sin centavos. «$449» */
  | 'tarjeta'
  /** Cajon, lineas del pedido y pagina del carrito: simbolo con centavos. «$450.00» */
  | 'ticket'
  /** Popin de busqueda: codigo de moneda y dos decimales fijos. «MXN 449.00» */
  | 'vitrina';

/**
 * TRAMPA de `Intl`: `minimumFractionDigits` NO se declara en la variante
 * `tarjeta` a proposito. Para MXN el minimo por defecto es 2, y declarar
 * `minimumFractionDigits: 2` junto a `maximumFractionDigits: 0` lanza
 * `RangeError` en tiempo de ejecucion. Omitiendolo, la especificacion baja el
 * minimo hasta el maximo y el resultado es «$449» sin reventar.
 */
const OPCIONES: Record<VarianteDePrecio, Intl.NumberFormatOptions> = {
  tarjeta: {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  },
  ticket: {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  },
  vitrina: {
    style: 'currency',
    currency: 'MXN',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }
};

/**
 * Un formateador por variante, construido una sola vez.
 *
 * `new Intl.NumberFormat(...)` es de las llamadas caras del navegador: carga los
 * datos de localidad y de moneda. Las seis copias lo construian en CADA llamada,
 * y OrderList llama dos veces POR LINEA en cada repintado del pedido. Cachearlo
 * es gratis aqui y no lo era mientras la funcion vivia dentro de cada componente.
 */
const FORMATEADORES = new Map<VarianteDePrecio, Intl.NumberFormat>();

function formateadorDe(variante: VarianteDePrecio): Intl.NumberFormat {
  const cacheado = FORMATEADORES.get(variante);
  if (cacheado) {
    return cacheado;
  }

  const nuevo = new Intl.NumberFormat('es-MX', OPCIONES[variante]);
  FORMATEADORES.set(variante, nuevo);
  return nuevo;
}

/**
 * Formatea un precio en pesos mexicanos.
 *
 * La variante por defecto es `tarjeta` porque es la del catalogo, que es donde
 * el cliente pasa la mayor parte del tiempo; las otras dos se piden por su
 * nombre para que en el sitio de la llamada se lea QUE pantalla es y no un
 * numero suelto de decimales.
 *
 * Acepta `string` ademas de `number` porque PostgREST devuelve las columnas
 * `numeric` como cadena segun la consulta, y la Showcase ya venia defendiendose
 * de eso con un `Number()` propio. Se conserva aqui para no perder esa defensa
 * al borrar la copia.
 */
export function formatearPrecio(
  precio: number | string,
  variante: VarianteDePrecio = 'tarjeta'
): string {
  return formateadorDe(variante).format(Number(precio));
}
