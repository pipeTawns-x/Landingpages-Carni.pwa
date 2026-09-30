import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@src/types/database';

export interface CatalogoVivo {
  /** Productos reales, indexados por nombre en minúsculas. */
  porNombre: Map<string, Product>;
}

function normalizar(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/**
 * Trae el catálogo real — mismo `fetchProducts()` que ya usan Showcase.tsx y
 * CategoryBento (Supabase con el seed de seedProducts.ts como piso) — e
 * indexa por nombre.
 *
 * POR QUÉ EXISTE: el contenido de datos.ts se escribió a partir del diseño
 * (Landing.dc.html), que no trae ids de producto. Se verificó contra la base
 * local que los nueve productos que cita el diseño (Bistec de Res,
 * Diezmillo, Filete Mignon, Flank Steak, Top Sirloin y los cuatro paquetes
 * de Ofertas) SÍ existen ahí bajo el mismo nombre exacto, con el mismo
 * precio y la misma existencia — pero no están en `seedProducts.ts`, el
 * piso de respaldo (ahí "Diezmillo" trae otro precio). El nombre es la
 * única llave que las dos fuentes comparten, así que las tarjetas de la
 * landing arrancan con el texto estático del diseño y, si el catálogo real
 * responde y trae un producto con ese nombre, cada tarjeta cambia su enlace
 * a la ficha real (`/producto/<id>`) y su insignia de existencia al dato
 * vivo. Si no lo encuentra, se queda con el valor estático — nunca se
 * inventa un id.
 */
export function useCatalogoVivo(): CatalogoVivo {
  const [productos, setProductos] = useState<Product[]>([]);

  useEffect(() => {
    let cancelado = false;

    /*
     * `import()` dinámico a propósito, no un `import { fetchProducts }`
     * estático arriba del archivo.
     *
     * `src/entry/shared.tsx` importa `js/modules/supabase.js`, que LANZA en
     * el nivel superior del módulo si faltan las variables VITE_SUPABASE_*.
     * Un import estático propaga ese lanzamiento durante la carga del
     * bundle —antes de que exista ningún try/catch que lo atrape— y se
     * lleva por delante el montaje entero de React. Se comprobó en vivo:
     * así es como la landing quedaba en blanco en este entorno.
     *
     * El `import()` dinámico convierte esa misma excepción en una promesa
     * rechazada, que el `.catch()` de abajo sí puede atrapar. Y como el
     * catálogo estático de datos.ts ya es un piso completo y correcto, no
     * encontrar el catálogo vivo no es un error para esta sección: la
     * tarjeta simplemente se queda con el valor del diseño.
     */
    import('@src/entry/shared')
      .then((modulo) => modulo.fetchProducts())
      .then((resultado) => {
        if (!cancelado) {
          setProductos(resultado.products);
        }
      })
      .catch(() => {
        /* Sin catálogo vivo: las tarjetas se quedan con datos.ts. */
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const porNombre = useMemo(() => new Map(productos.map((p) => [normalizar(p.name), p] as const)), [productos]);

  return { porNombre };
}

/** Busca un producto real por nombre exacto (sin distinguir mayúsculas). */
export function buscarProductoPorNombre(catalogo: CatalogoVivo, nombre: string): Product | undefined {
  return catalogo.porNombre.get(normalizar(nombre));
}
