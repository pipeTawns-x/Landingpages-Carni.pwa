import semillaProductos from './semillaCatalogo.json';
import semillaCategorias from './semillaCategorias.json';
import { obtenerSupabase } from './supabase';

/**
 * El catálogo que ve la tienda, venga de donde venga.
 *
 * Hay dos orígenes y la pantalla no tiene que distinguirlos:
 *   - `vivo`: la base, por lectura pública (llave anónima, RLS de solo lectura).
 *   - `semilla`: una copia de esa misma base que viaja con el sitio. Se usa
 *     cuando no hay configuración, cuando la consulta falla o cuando tarda más
 *     de `TIEMPO_MAXIMO_MS`.
 *
 * Reglas que este módulo hace cumplir:
 *   - Nada lanza al importarse ni al cargar. `cargarCatalogo()` nunca rechaza.
 *   - El precio se muestra como viene de la base. Este módulo no calcula ni
 *     convierte precios (la libra sale de su columna, jamás de kilo por un
 *     factor).
 *   - El número de piezas disponibles no sale de aquí: solo `disponible`.
 */

export interface ProductoVista {
  id: number;
  nombre: string;
  descripcion: string;
  /** `price_per_kg`, tal cual. */
  precioKg: number;
  /** `price_per_lb`, de su columna. Puede faltar. */
  precioLb: number | null;
  /** `image_url` sin resolver, p. ej. "/img/products/res.webp"; se pasa por `assetUrl()`. */
  foto: string | null;
  categoria: { slug: string; nombre: string };
  /** Activo y con piezas. La cantidad exacta no se expone. */
  disponible: boolean;
}

export interface CategoriaVista {
  slug: string;
  nombre: string;
  orden: number;
}

export type OrigenDatos = 'vivo' | 'semilla';

export interface Catalogo {
  origen: OrigenDatos;
  productos: ProductoVista[];
  categorias: CategoriaVista[];
}

/** A partir de aquí la tienda deja de esperar a la base y pinta la semilla. */
export const TIEMPO_MAXIMO_MS = 2500;

/* ------------------------------------------------------------------ semilla */

interface FilaSemilla {
  id: number;
  name: string;
  description: string;
  price_per_kg: number;
  price_per_lb: number | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  category_slug: string;
  category_name: string;
}

const FILAS_SEMILLA: FilaSemilla[] = semillaProductos;

function desdeFilaSemilla(fila: FilaSemilla): ProductoVista {
  return {
    id: fila.id,
    nombre: fila.name,
    descripcion: fila.description,
    precioKg: fila.price_per_kg,
    precioLb: fila.price_per_lb,
    foto: fila.image_url,
    categoria: { slug: fila.category_slug, nombre: fila.category_name },
    disponible: fila.is_active && fila.stock > 0
  };
}

function ordenarCategorias(categorias: CategoriaVista[]): CategoriaVista[] {
  return [...categorias].sort((a, b) => a.orden - b.orden);
}

export const CATALOGO_SEMILLA: Catalogo = {
  origen: 'semilla',
  productos: FILAS_SEMILLA.filter((fila) => fila.is_active).map(desdeFilaSemilla),
  categorias: ordenarCategorias(
    semillaCategorias.map((c) => ({ slug: c.slug, nombre: c.name, orden: c.order }))
  )
};

/* --------------------------------------------------------------------- vivo */

interface CategoriaFila {
  slug: string;
  name: string;
}

interface FilaViva {
  id: number;
  name: string;
  description: string | null;
  price_per_kg: number | string;
  price_per_lb: number | string | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
  /** La relación llega como objeto; se tolera un arreglo de uno por si cambia el esquema. */
  categories: CategoriaFila | CategoriaFila[] | null;
}

const COLUMNAS_PRODUCTO =
  'id,name,description,price_per_kg,price_per_lb,image_url,stock,is_active,categories(slug,name)';

const CATEGORIA_SIN_CLASIFICAR = { slug: 'otros', nombre: 'Otros' } as const;

function desdeFilaViva(fila: FilaViva): ProductoVista {
  const relacion = Array.isArray(fila.categories) ? fila.categories[0] : fila.categories;

  return {
    id: fila.id,
    nombre: fila.name,
    descripcion: fila.description ?? '',
    precioKg: Number(fila.price_per_kg),
    precioLb: fila.price_per_lb === null ? null : Number(fila.price_per_lb),
    foto: fila.image_url,
    categoria: relacion
      ? { slug: relacion.slug, nombre: relacion.name }
      : { ...CATEGORIA_SIN_CLASIFICAR },
    disponible: fila.is_active && (fila.stock ?? 0) > 0
  };
}

/** `null` si no hay cliente o si la base respondió con error. */
async function consultarVivo(): Promise<Catalogo | null> {
  const supabase = await obtenerSupabase();
  if (!supabase) {
    return null;
  }

  // Las dos consultas no dependen una de otra: van juntas.
  const [productos, categorias] = await Promise.all([
    supabase.from('products').select(COLUMNAS_PRODUCTO).eq('is_active', true).order('id'),
    supabase.from('categories').select('slug,name,order').order('order')
  ]);

  if (productos.error || categorias.error || !productos.data || !categorias.data) {
    return null;
  }

  const filas = productos.data as unknown as FilaViva[];
  const filasCategoria = categorias.data as unknown as { slug: string; name: string; order: number }[];

  return {
    origen: 'vivo',
    productos: filas.map(desdeFilaViva),
    categorias: ordenarCategorias(
      filasCategoria.map((c) => ({ slug: c.slug, nombre: c.name, orden: c.order }))
    )
  };
}

/** Resuelve `null` si la promesa tarda más de `ms` o falla. Nunca rechaza. */
function conLimite<T>(promesa: Promise<T | null>, ms: number): Promise<T | null> {
  return new Promise((resolver) => {
    const temporizador = setTimeout(() => resolver(null), ms);
    const terminar = (valor: T | null): void => {
      clearTimeout(temporizador);
      resolver(valor);
    };
    promesa.then(terminar, () => terminar(null));
  });
}

/**
 * Una sola consulta por documento: todos los que pidan el catálogo comparten la
 * misma promesa.
 */
let carga: Promise<Catalogo> | null = null;

export function cargarCatalogo(): Promise<Catalogo> {
  if (!carga) {
    carga = conLimite(consultarVivo(), TIEMPO_MAXIMO_MS).then((vivo) => vivo ?? CATALOGO_SEMILLA);
  }
  return carga;
}

export function productoPorId(catalogo: Catalogo, id: number): ProductoVista | undefined {
  return catalogo.productos.find((producto) => producto.id === id);
}
