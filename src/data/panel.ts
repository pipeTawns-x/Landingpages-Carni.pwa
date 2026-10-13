import { urlPanelDelEntorno } from './panelEnv';

/**
 * Traspaso de la sesión de la tienda al panel de Django (contrato S4: secciones 5b
 * y 6 de `docs/CONTRATO_PANEL_DJANGO.md`, rama `practicas-ebac`). El `access_token`
 * viaja SOLO en el cuerpo de un POST. No importa ningún cliente de Supabase.
 */

/** Cuánto espera el formulario (con el token) en el DOM si la navegación nunca ocurre. */
export const ESPERA_NAVEGACION_MS = 10_000;

export type ResultadoTraspaso = 'sin_panel' | 'enviado' | 'error';
export type ResultadoSalida = 'sin_senal' | 'cerrada' | 'fallida';
type Sesion = { data: { session: { access_token?: string | null } | null }; error: unknown };

/** Lo único que el traspaso le pide al cliente de Supabase. */
export interface ClienteRefrescable {
  auth: { refreshSession(): Promise<Sesion> };
}

/** Lo único que la salida le pide al cliente de Supabase. */
export interface ClienteCerrable {
  auth: { signOut(opciones: { scope: 'local' }): Promise<{ error: unknown }> };
}

/**
 * Devuelve `<origen>/panel/sesion/`, o `null` si el valor no sirve. Pura. Solo
 * `https`, o `http` para `localhost`, `127.0.0.1` y `[::1]` EXACTOS; rechaza
 * credenciales, otros esquemas, vacíos, ilegibles y relativos (`//host`). Usa solo
 * el ORIGEN. Recorta los espacios de los extremos; los de adentro la invalidan.
 */
export function urlSesionPanel(valor: unknown): string | null {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (texto === '' || /[\s\u0000-\u001f\u007f]/.test(texto)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }

  const esHttpLocal = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username !== '' || url.password !== '' || (url.protocol !== 'https:' && !esHttpLocal)) {
    return null;
  }

  return `${url.origin}/panel/sesion/`;
}

/**
 * Entrega la sesión del admin a Django con un POST de formulario. `"sin_panel"`: no hay
 * URL válida, no se toca Supabase. `"enviado"`: el navegador abandona la página. `"error"`:
 * no se pudo renovar el token; sin formulario, se puede reintentar. El doble envío lo evita
 * quien llama con su botón deshabilitado. Sin `rel="noreferrer"`: con `no-referrer` el POST
 * sale con `Origin: null` y Django lo rechaza (contrato, 5b). Si el CSP de Netlify gana
 * `form-action`, debe incluir el host de Django o este POST se bloquea.
 */
export async function handoffToPanel(
  cliente: ClienteRefrescable,
  urlPanel: string | null | undefined = urlPanelDelEntorno()
): Promise<ResultadoTraspaso> {
  const destino = urlSesionPanel(urlPanel);
  if (destino === null) {
    if (typeof urlPanel === 'string' && urlPanel !== '') {
      console.warn('VITE_PANEL_URL no es valida; se ignora');
    }
    return 'sin_panel';
  }

  // Recién emitido: el backend rechaza los tokens más viejos que su máximo.
  const sesion = await cliente.auth.refreshSession().catch(() => null);
  const token = sesion?.error ? null : sesion?.data.session?.access_token;
  if (typeof token !== 'string' || token.trim() === '') {
    return 'error';
  }

  const formulario = document.createElement('form');
  formulario.setAttribute('method', 'post');
  formulario.setAttribute('action', destino);
  const campo = document.createElement('input');
  campo.setAttribute('type', 'hidden');
  campo.setAttribute('name', 'access_token');
  campo.setAttribute('value', token);
  formulario.appendChild(campo);

  try {
    document.body.appendChild(formulario);
    formulario.submit();
  } catch {
    formulario.remove(); // Sin registrar el motivo: el formulario lleva el token.
    return 'error';
  }

  // Si la navegación nunca ocurre (Esc, un panel que no contesta), el token no se queda en el DOM.
  setTimeout(() => formulario.remove(), ESPERA_NAVEGACION_MS);
  return 'enviado';
}

/** Respaldo: auth-js devuelve el error de `signOut` ANTES de borrar la sesión local (`_signOut`); se borra a mano su clave. */
function sesionLocalBorrada(cliente: ClienteCerrable): boolean {
  try {
    // `storageKey` es `protected` en el tipo de supabase-js, pero existe en ejecución.
    const clave = (cliente.auth as unknown as { storageKey?: unknown }).storageKey;
    if (typeof clave !== 'string' || clave === '') {
      return false;
    }
    window.localStorage.removeItem(clave);
    return window.localStorage.getItem(clave) === null;
  } catch {
    return false; // Almacenamiento bloqueado.
  }
}

/**
 * Cierra también la sesión de Supabase al salir del panel (`/panel/salir/` cierra solo
 * la de Django; contrato, 5b). Actúa SOLO con `?salir=1` y un `pathname` que termina en
 * `/accessweb.html`; si no, `"sin_senal"` sin llamar a Supabase ni tocar la URL. Llama a
 * `signOut({ scope: "local" })` y, al terminar, quita el parámetro: si la pestaña se cierra
 * a media salida, reabrirla la reintenta. `"fallida"`: ni así se pudo borrar la sesión local.
 *
 * RIESGO ACEPTADO: un enlace a `accessweb.html?salir=1` puede cerrarle la sesión a
 * alguien (logout CSRF: molestia, sin exposición de datos).
 * PENDIENTE DEL BACKEND: hoy `views.salir` redirige sin `?salir=1`; hasta que lo
 * agregue (solo en `salir`), esto no se activa nunca.
 */
export async function cerrarSesionTrasSalirDelPanel(
  cliente: ClienteCerrable,
  ubicacion: Pick<Location, 'href'> = window.location,
  historial: Pick<History, 'state' | 'replaceState'> = window.history
): Promise<ResultadoSalida> {
  const url = new URL(ubicacion.href);
  if (url.searchParams.get('salir') !== '1' || !url.pathname.endsWith('/accessweb.html')) {
    return 'sin_senal';
  }

  const cerrada = await cliente.auth.signOut({ scope: 'local' }).then(({ error }) => !error, () => false);
  const resultado = cerrada || sesionLocalBorrada(cliente) ? 'cerrada' : 'fallida';

  url.searchParams.delete('salir');
  try {
    historial.replaceState(historial.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Un historial que no se deja reescribir no debe impedir la salida.
  }
  return resultado;
}
