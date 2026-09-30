/**
 * Contenido estático de la landing.
 *
 * Todo lo que vive aquí es contenido de DISEÑO (Landing.dc.html), no datos
 * reales del catálogo. Donde el diseño usa un producto real, el comentario de
 * cada bloque dice si se pudo enlazar a `src/data/seedProducts.ts` o si se
 * quedó estático porque el producto no existe ahí con ese nombre — ver el
 * reporte de la implementación para el detalle completo.
 *
 * Los nueve slugs de categoría (`carnes-rojas`, `cortes-especiales`, `cerdo`,
 * `pollo`, `embutidos`, `preparadas`, `ofertas`, `merch`, `otros`) son los
 * mismos que ya usa `products.html?categoria=<slug>` en el resto del sitio
 * (ver FALLBACK_CATEGORIES en src/entry/shared.tsx y los chips del drawer en
 * index.html). No se inventó ninguno nuevo.
 */

export const RUTA_CATALOGO = 'products.html';

export function rutaCategoria(slug: string): string {
  return `${RUTA_CATALOGO}?categoria=${slug}`;
}

/* ------------------------------------------------------------ datos rápidos */

export interface DatoRapido {
  etiqueta: string;
  valor: string;
}

export const DATOS_RAPIDOS: DatoRapido[] = [
  { etiqueta: 'Entrega a domicilio', valor: 'Pedido mínimo $150' },
  { etiqueta: 'Recoger en tienda', valor: 'Sin mínimo' },
  { etiqueta: 'Lunes a sábado', valor: '8:00 a 17:00' }
];

/* ---------------------------------------------------------------- categorías */

export interface CategoriaBento {
  slug: string;
  nombre: string;
  descripcion?: string;
  archivo: string;
  posicion: string;
  /** Columnas/filas que ocupa en móvil (2 columnas) y en escritorio (5 columnas). Sin definir = 1. */
  columnasMovil?: number;
  filasMovil?: number;
  columnasEscritorio?: number;
  filasEscritorio?: number;
}

/**
 * Las nueve categorías del bento, en el orden del diseño.
 *
 * `archivo` son los mismos .webp que ya sirve `public/img/products/`
 * (verificados en disco). El nombre completo de categoría y el slug salen de
 * `FALLBACK_CATEGORIES` en src/entry/shared.tsx para que el enlace de cada
 * pieza caiga en el mismo filtro que ya usan el bento de index.html y los
 * chips del menú.
 */
export const CATEGORIAS_BENTO: CategoriaBento[] = [
  {
    slug: 'carnes-rojas',
    nombre: 'Carnes rojas',
    descripcion: 'Bistec, diezmillo, molida y para caldo',
    archivo: 'res-alto.webp',
    posicion: '50% 50%',
    columnasMovil: 2,
    filasMovil: 2,
    columnasEscritorio: 2,
    filasEscritorio: 2
  },
  {
    slug: 'cortes-especiales',
    nombre: 'Cortes especiales',
    descripcion: 'Rib eye, tomahawk, arrachera',
    archivo: 'premium-alto.webp',
    posicion: '50% 45%',
    columnasEscritorio: 2
  },
  {
    slug: 'pollo',
    nombre: 'Pollo',
    descripcion: 'Pechuga, pierna y muslo, alas',
    archivo: 'pollo-alto.webp',
    posicion: '50% 50%',
    filasEscritorio: 2
  },
  { slug: 'cerdo', nombre: 'Cerdo', archivo: 'cerdo-alto.webp', posicion: '50% 60%' },
  { slug: 'preparadas', nombre: 'Preparadas', archivo: 'preparadas-alto.webp', posicion: '50% 50%' },
  { slug: 'embutidos', nombre: 'Embutidos', archivo: 'embutidos-alto.webp', posicion: '50% 50%' },
  {
    slug: 'ofertas',
    nombre: 'Ofertas',
    descripcion: 'Paquetes para 4 a 10 personas',
    archivo: 'premium-detalle.webp',
    posicion: '50% 50%',
    columnasEscritorio: 2
  },
  { slug: 'merch', nombre: 'Merch', archivo: 'merch-alto.webp', posicion: '50% 40%' },
  { slug: 'otros', nombre: 'Otros', archivo: 'otrosproductos.webp', posicion: '30% 30%' }
];

/* --------------------------------------------------------------- destacado */

/**
 * "Filete Mignon", el producto destacado de "De la vitrina".
 *
 * NO está en `src/data/seedProducts.ts` (el piso de respaldo) con ese
 * nombre. SÍ está en el catálogo real — se confirmó consultando el Postgres
 * local de Supabase directamente (id 10, categoría cortes-especiales, $689
 * / kg, 20 en existencia): son los mismos valores que trae el diseño y
 * también `docs/cargar-catalogo-y-admin.sql`. `src/landing/useCatalogoVivo.ts`
 * usa el mismo `fetchProducts()` que ya usan Showcase.tsx y CategoryBento
 * para buscar este nombre en el catálogo vivo; si lo encuentra, "Agregar" y
 * "Ver la ficha" enlazan a `/producto/10` (o el id que corresponda) en vez
 * del enlace de categoría de aquí abajo, que queda como piso si el catálogo
 * no respondiera.
 */
export const PRODUCTO_DESTACADO = {
  nombre: 'Filete Mignon',
  categoria: 'Cortes especiales · 20 en stock',
  descripcion:
    'La parte más suave del animal. Poca grasa, textura de mantequilla. La pieza de 1¼ pulgadas sale en unos 250 g.',
  precio: '$689',
  precioPorLibra: '$312.53 / lb',
  fotoPrincipal: '/img/products/filet_mignon-alto.webp',
  fotoDetalle: '/img/products/filet_mignon-detalle.webp',
  fotoTercera: '/img/products/filet_mignon.webp',
  enlace: rutaCategoria('cortes-especiales')
};

/* ------------------------------------------------------- lo más pedido */

export interface ProductoTarjeta {
  foto: string;
  posicion: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  precio: string;
  unidad: 'kg' | 'pieza' | 'paquete';
  stock: string;
  enlace: string;
}

/**
 * Los cuatro cortes de "Lo que se lleva la gente".
 *
 * Ninguno de los cuatro está en `seedProducts.ts` (el piso de respaldo) bajo
 * este nombre — "Diezmillo" sí existe ahí (id 5), pero con otro precio ($169
 * vs los $249 de aquí) y otra foto. En el catálogo REAL (Supabase, verificado
 * contra el Postgres local) los cuatro sí existen, con estos mismos valores.
 * `useCatalogoVivo.ts` los busca por nombre en el catálogo vivo y, si los
 * encuentra, "Agregar" enlaza a la ficha real en vez del enlace de categoría
 * de aquí abajo — que se queda como piso para cuando el catálogo no
 * responda, igual que hace el resto del sitio con `seedProducts.ts`.
 */
export const PRODUCTOS_MAS_PEDIDOS: ProductoTarjeta[] = [
  {
    foto: '/img/products/flak_steak.webp',
    posicion: '50% 50%',
    categoria: 'Cortes especiales',
    nombre: 'Flank Steak',
    descripcion: 'Fibra larga, para asar entero',
    precio: '$399',
    unidad: 'kg',
    stock: '28 en stock',
    enlace: rutaCategoria('cortes-especiales')
  },
  {
    foto: '/img/products/top_sirloin.webp',
    posicion: '40% 50%',
    categoria: 'Cortes especiales',
    nombre: 'Top Sirloin',
    descripcion: 'Entre precio y suavidad',
    precio: '$389',
    unidad: 'kg',
    stock: '35 en stock',
    enlace: rutaCategoria('cortes-especiales')
  },
  {
    foto: '/img/products/res.webp',
    posicion: '30% 50%',
    categoria: 'Carnes rojas',
    nombre: 'Bistec de Res',
    descripcion: 'Pulpa delgada, sartén o comal',
    precio: '$289',
    unidad: 'kg',
    stock: '80 en stock',
    enlace: rutaCategoria('carnes-rojas')
  },
  {
    foto: '/img/products/res.webp',
    posicion: '75% 60%',
    categoria: 'Carnes rojas',
    nombre: 'Diezmillo',
    descripcion: 'Jaspeado, aguanta cocción larga',
    precio: '$249',
    unidad: 'kg',
    stock: '60 en stock',
    enlace: rutaCategoria('carnes-rojas')
  }
];

/* ------------------------------------------------------------------ ofertas */

/**
 * Los cuatro paquetes de "Ofertas". Mismo caso que "Lo que se lleva la
 * gente": no están en `seedProducts.ts` con estos nombres (ahí las ofertas
 * se llaman "Paquete Familiar de Res", "Combo Premium", etc., con otros
 * precios), pero sí existen en el catálogo real con estos nombres y precios
 * exactos. `useCatalogoVivo.ts` los resuelve igual; el enlace de aquí abajo
 * es el piso para cuando el catálogo no responde.
 */
export const OFERTAS: ProductoTarjeta[] = [
  {
    foto: '/img/products/premium.webp',
    posicion: '50% 50%',
    categoria: 'Ofertas',
    nombre: 'Paquete Asador 4 a 6 Personas',
    descripcion: 'Arrachera, chorizo argentino, cebolla cambray y carbón',
    precio: '$1,599',
    unidad: 'paquete',
    stock: '12 en stock',
    enlace: rutaCategoria('ofertas')
  },
  {
    foto: '/img/products/premium-alto.webp',
    posicion: '50% 50%',
    categoria: 'Ofertas',
    nombre: 'Parrillada Familiar 8 a 10 Personas',
    descripcion: 'Rib eye, costilla, pollo marinado y embutidos',
    precio: '$3,249',
    unidad: 'paquete',
    stock: '8 en stock',
    enlace: rutaCategoria('ofertas')
  },
  {
    foto: '/img/products/cerdo-alto.webp',
    posicion: '50% 50%',
    categoria: 'Ofertas',
    nombre: 'Paquete Carnitas por Kilo',
    descripcion: 'Con tortillas, salsa y cebolla; se encarga un día antes',
    precio: '$389',
    unidad: 'paquete',
    stock: '15 en stock',
    enlace: rutaCategoria('ofertas')
  },
  {
    foto: '/img/products/bravette_steak.webp',
    posicion: '50% 50%',
    categoria: 'Ofertas',
    nombre: 'Vacío en Oferta',
    descripcion: 'Bavette de la semana, a precio de temporada',
    precio: '$379',
    unidad: 'kg',
    stock: '20 en stock',
    enlace: rutaCategoria('ofertas')
  }
];

/* --------------------------------------------------------------------- FAQ */

export interface Pregunta {
  pregunta: string;
  respuesta: string;
  /** Presente solo en las preguntas que NO se muestran al público. */
  pendiente?: string;
}

/**
 * Las cinco preguntas del diseño. Dos traían una etiqueta interna en
 * Landing.dc.html: "por confirmar con el dueño" y "falta backend". Esas
 * etiquetas son notas de trabajo, no algo que un cliente deba leer, así que
 * las dos preguntas correspondientes NO se exportan en `PREGUNTAS_VISIBLES`
 * — quedan aquí, marcadas `pendiente`, para cuando Eduardo confirme el
 * criterio de peso real y el backend de pago.
 */
export const PREGUNTAS: Pregunta[] = [
  {
    pregunta: '¿Cuál es el pedido mínimo?',
    respuesta: 'Para entrega a domicilio, $150. Si pasas a recoger a la tienda no hay mínimo.'
  },
  {
    pregunta: '¿A qué zonas entregan?',
    respuesta:
      'A zonas participantes de San Luis Potosí. Cuando escribes tu dirección en el pedido te decimos si tu colonia está cubierta.'
  },
  {
    pregunta: '¿Puedo pedir por precio en vez de por peso?',
    respuesta: 'Sí. En cada corte eliges por peso, por precio o por pieza, y el grosor que quieres.'
  },
  {
    pregunta: '¿Y si el peso no sale exacto?',
    respuesta:
      'El cuchillo no siempre cae en el gramo. Cortamos lo más cerca posible de lo que pediste y se cobra el peso real de la pieza.',
    pendiente: 'por confirmar con el dueño'
  },
  {
    pregunta: '¿Cómo pago?',
    respuesta: 'Con tarjeta al confirmar el pedido. Si pasas a recoger, también en el mostrador.',
    pendiente: 'falta backend'
  }
];

/** Solo las tres preguntas confirmadas — lo único que se renderiza. */
export const PREGUNTAS_VISIBLES: Pregunta[] = PREGUNTAS.filter((p) => !p.pendiente);

/* ---------------------------------------------------------------- contacto */

export const TELEFONO = '+52 444 271 5470';
export const TELEFONO_HREF = 'tel:+524442715470';
export const WHATSAPP_HREF = 'https://wa.me/524442715470';
export const CORREO = 'contacto@carniceriasenmisericordia.com';
export const CORREO_HREF = `mailto:${CORREO}`;
export const DIRECCION_LINEA1 = 'Agua Marina 110, Manuel J. Othón';
export const DIRECCION_LINEA2 = '78150 San Luis Potosí, S.L.P.';
export const MAPA_HREF =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Agua Marina 110, Manuel J. Othón, 78150 San Luis Potosí');

/* ------------------------------------------------------------ redes sociales */

/**
 * Interruptor de una sola constante: cadena vacía = el ícono o la fila NO se
 * renderiza en ningún sitio. index.html no trae ninguna URL real de
 * Facebook ni de Instagram — sus íconos son `href="#"` de marcador — y se
 * buscó "facebook.com"/"instagram.com" en todo el repo sin encontrar
 * ninguna URL propia del negocio. El gate de calidad prohíbe publicar
 * `href="#"`, así que quedan apagados hasta que Eduardo confirme la URL
 * real. En cuanto se llene aquí, el ícono del pie (y, para Facebook, la
 * fila de Contacto Directo) aparece solo, sin tocar ningún componente.
 */
export const FACEBOOK_URL = '';
export const INSTAGRAM_URL = '';
