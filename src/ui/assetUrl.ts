/**
 * Copia deliberada de `assetUrl` (el `shared.tsx` de las entradas), no una reexportación.
 *
 * Ese `shared.tsx` importa, en su primera línea, `getProducts` y
 * `getCategories` del cliente vanilla de Supabase (`supabase.js`) — y ese archivo LANZA una
 * excepción en el nivel superior del módulo si `VITE_SUPABASE_URL` /
 * `VITE_SUPABASE_ANON_KEY` no están definidas (líneas 10-14 de ese archivo).
 * Un `import` estático de cualquier cosa de `shared.tsx`, aunque sea solo
 * `assetUrl`, evalúa el módulo completo — y ese lanzamiento no es un rechazo
 * de promesa que un `try/catch` alrededor de una llamada pueda atrapar: es
 * una excepción sincrónica durante la carga del módulo, así que revienta
 * TODO el árbol de imports que llega hasta ella.
 *
 * Se comprobó en vivo: con la landing importando `assetUrl` desde
 * el `shared.tsx` de las entradas, la página quedaba completamente en blanco en este
 * entorno (sin las variables de Supabase configuradas) — React nunca
 * llegaba a montar nada. `index.html` tiene el mismo problema de fondo
 * (`home.tsx` también importa de `shared.tsx`), pero ahí queda parcialmente
 * disimulado porque la mayoría de esa página es HTML estático con islas de
 * React sueltas; aquí la página ENTERA es React, así que un módulo que
 * revienta al importarse se lleva todo.
 *
 * `assetUrl` en sí no toca Supabase para nada — es una función pura sobre
 * `import.meta.env.BASE_URL` — así que copiarla aquí, fuera de esa cadena de
 * imports, es lo que evita el problema sin tocar `shared.tsx` (un módulo
 * compartido con otras páginas, fuera del alcance de esta tarea) ni
 * el cliente vanilla (`supabase.js`). Debe quedar en sincronía a mano si
 * `assetUrl` cambia allá.
 */
export function assetUrl(path: string): string {
  if (!path) return path;
  // URLs absolutas y data URIs ya están resueltas; se dejan como están.
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
