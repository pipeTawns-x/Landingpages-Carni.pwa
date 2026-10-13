import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * El único archivo de las páginas nuevas que lee variables de entorno públicas.
 *
 * Nunca lanza. Sin URL o sin llave anónima devuelve `null` y quien lo llama
 * decide qué pintar (la tienda usa la semilla; el panel avisa que no está
 * disponible). Así ninguna página se queda en blanco por una variable ausente,
 * que es lo que le pasaba a la landing anterior al importar el cliente
 * compartido: aquel módulo lanzaba al evaluarse.
 *
 * Solo viajan al navegador la URL del proyecto y la llave anónima (pública por
 * diseño; la protege RLS). Ninguna otra clave pasa por aquí.
 *
 * OJO AL IMPORTARLO EN UNA PRUEBA: `import.meta` no sobrevive al CommonJS que
 * genera Babel para Jest, así que el módulo no se puede ni parsear. Es lo mismo
 * que pasa con `assetUrl` —que lee el entorno por esta misma vía— y la respuesta
 * es la misma: en las pruebas se sustituye por un mock. Lo que no puede ser es
 * un `throw` al evaluarse, porque eso deja la tienda en blanco antes de que
 * nadie pinte nada; de eso se encarga `hayConfiguracion()`.
 */
const URL_PROYECTO: string = import.meta.env.VITE_SUPABASE_URL ?? '';
const LLAVE_ANONIMA: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_KEY ?? '';

/** True si hay URL y llave anónima. No dice si el servidor responde. */
export function hayConfiguracion(): boolean {
  return URL_PROYECTO.trim() !== '' && LLAVE_ANONIMA.trim() !== '';
}

/**
 * Las mismas dos claves, para quien habla REST con axios.
 *
 * POR QUÉ NO SE SACAN DEL CLIENTE
 * ------------------------------
 * `SupabaseClient` declara `supabaseUrl` y `supabaseKey` como `protected`: no se
 * leen desde fuera, y safe-castearlas para leerlas sería mentirle al
 * compilador. Además, para construir una URL de PostgREST no hace falta cargar
 * el paquete: `obtenerSupabase()` se paga cuando alguien consulta de verdad.
 *
 * Lo que se pierde es exactamente nada: son las mismas variables que ya están
 * leídas aquí, y este es el único módulo que las lee.
 */
export function credencialesSupabase(): { url: string; llaveAnonima: string } | null {
  if (!hayConfiguracion()) {
    return null;
  }

  return { url: URL_PROYECTO, llaveAnonima: LLAVE_ANONIMA };
}

/**
 * Promesa memorizada: un solo cliente por documento.
 *
 * Dos clientes en la misma página compartirían el almacenamiento de la sesión y
 * el navegador avisaría de instancias duplicadas.
 */
let cliente: Promise<SupabaseClient | null> | null = null;

async function crearCliente(): Promise<SupabaseClient | null> {
  if (!hayConfiguracion()) {
    return null;
  }

  try {
    // Paquete npm, cargado bajo demanda: la tienda no paga el peso del cliente
    // hasta que hace falta consultar.
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(URL_PROYECTO, LLAVE_ANONIMA, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  } catch {
    return null;
  }
}

export function obtenerSupabase(): Promise<SupabaseClient | null> {
  if (!cliente) {
    cliente = crearCliente();
  }
  return cliente;
}
