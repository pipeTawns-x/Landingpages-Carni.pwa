/**
 * Dónde vive el panel de administración (Django). Lectura de entorno, nada más.
 *
 * Es el único archivo que lee la variable pública del panel, igual que
 * `supabase.ts` es el único que lee las de Supabase. Está aparte de `panel.ts`
 * por la misma razón que cuenta el comentario de `supabase.ts`: `import.meta` no
 * sobrevive al CommonJS que genera Babel para Jest, y todo lo que lo toque se
 * sustituye con un mock en las pruebas. Con la lectura en su propio módulo, la
 * lógica del traspaso se prueba entera y solo este archivo se simula.
 *
 * Sin la variable devuelve `undefined` y la tienda se comporta como siempre: el
 * traspaso trata ese valor como "no hay panel configurado".
 */
export function urlPanelDelEntorno(): string | undefined {
  return import.meta.env.VITE_PANEL_URL;
}
