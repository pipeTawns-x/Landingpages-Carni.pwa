/**
 * Traspaso de la sesión de la tienda al panel de Django (S4): validación de la URL, POST con el
 * token y salida que cierra también la sesión de Supabase. Los globales de Jest se importan a mano.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cerrarSesionTrasSalirDelPanel,
  handoffToPanel,
  urlSesionPanel,
  type ClienteCerrable,
  type ClienteRefrescable
} from '../panel';

// `panelEnv` lee `import.meta.env`, que Babel no puede parsear para Jest: se sustituye por un
// mock que cada prueba mueve. La flecha es perezosa: Babel sube `jest.mock` sobre las constantes.
const mockUrlEntorno = jest.fn<() => string | undefined>(() => undefined);
jest.mock('../panelEnv', () => ({ urlPanelDelEntorno: () => mockUrlEntorno() }));

/** Un token de mentira con forma de JWT. Ninguno de estos valores es una credencial. */
const TOKEN = 'eyJhbGciOiJFUzI1NiJ9.cuerpo-del-token.firma-del-token';
const PANEL = 'http://localhost:8000';
const DESTINO = 'http://localhost:8000/panel/sesion/';

type Sesion = Awaited<ReturnType<ClienteRefrescable['auth']['refreshSession']>>;
type Salida = Awaited<ReturnType<ClienteCerrable['auth']['signOut']>>;
type Nivel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const conSesion = (token: string | null = TOKEN): Sesion => ({ data: { session: { access_token: token } }, error: null });
const formularios = (): HTMLFormElement[] => Array.from(document.querySelectorAll('form'));
const espiar = (nivel: Nivel) => jest.spyOn(console, nivel).mockImplementation(() => undefined);

/** Una promesa que se resuelve cuando la prueba lo decide. */
function diferida<T>(): { promesa: Promise<T>; resolver: (valor: T) => void } {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((resuelve) => (resolver = resuelve));
  return { promesa, resolver };
}

describe('urlSesionPanel', () => {
  const ACEPTADOS: Array<[string, string]> = [
    ['http://localhost:8000', DESTINO],
    ['http://127.0.0.1:8000/x?y#z', 'http://127.0.0.1:8000/panel/sesion/'],
    ['http://[::1]:8000', 'http://[::1]:8000/panel/sesion/'],
    ['https://panel.example.com/', 'https://panel.example.com/panel/sesion/'],
    ['https://panel.example.com:8443/a/b?c=d#e', 'https://panel.example.com:8443/panel/sesion/'],
    ['https://panel.example.com/panel/sesion/', 'https://panel.example.com/panel/sesion/'],
    ['https://localhost', 'https://localhost/panel/sesion/'],
    ['HTTPS://Panel.Example.com', 'https://panel.example.com/panel/sesion/'],
    ['HTTP://LOCALHOST:8000', DESTINO],
    ['  http://localhost:8000  ', DESTINO],
    ['\thttps://panel.example.com\n', 'https://panel.example.com/panel/sesion/']
  ];
  // Cada rechazado es un bypass o un caso de borde: servidor remoto por http, servidor que solo
  // EMPIEZA como uno local, otras IP, esquemas peligrosos, credenciales, relativos y basura.
  const RECHAZADOS: unknown[] = [
    undefined, null, 42, {}, '', '   ', 'http://panel.example.com', 'http://localhost.evil.com', 'http://127.0.0.1.evil.com',
    'http://127.0.0.2:8000', 'http://0.0.0.0:8000', 'http://[::2]:8000', 'javascript:alert(1)', 'JAVASCRIPT:alert(1)',
    'data:text/html,x', 'ftp://h', 'file:///etc/passwd', 'blob:https://panel.example.com/uuid', 'https://u:p@h',
    'https://user@panel.example.com', 'https://good.com@evil.com', 'http://localhost:8000@evil.com', '//h', '//localhost:8000',
    '/panel/sesion/', 'localhost:8000', 'not a url', 'https://', 'https://pa nel.example.com', 'https://panel.example.com/a b',
    'https://panel.example.com/\nx'
  ];
  const CASOS: Array<[unknown, string | null]> = [...ACEPTADOS, ...RECHAZADOS.map((valor): [unknown, null] => [valor, null])];

  it.each(CASOS)('urlSesionPanel(%j) -> %j', (valor, esperado) => {
    expect(urlSesionPanel(valor)).toBe(esperado);
  });
});

describe('handoffToPanel', () => {
  let submit: jest.SpiedFunction<HTMLFormElement['submit']>;
  let consola: Record<Nivel, ReturnType<typeof espiar>>;
  /** Lo que el formulario tenía en el instante exacto del `submit()`: TODOS sus atributos y campos. */
  let capturas: Array<{ atributos: string[][]; campos: Array<Array<string | null>>; conectado: boolean }>;

  function clienteRefrescable(implementacion: () => Promise<Sesion> = async () => conSesion()) {
    const refreshSession = jest.fn<() => Promise<Sesion>>(implementacion);
    return { cliente: { auth: { refreshSession } } satisfies ClienteRefrescable, refreshSession };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    capturas = [];
    mockUrlEntorno.mockReset();
    // jsdom no navega: `submit()` solo escribe "Not implemented". Un espía fotografía el formulario.
    submit = jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (this: HTMLFormElement) {
      const campos = Array.from(this.querySelectorAll('input')).map((c) => [c.getAttribute('type'), c.getAttribute('name'), c.getAttribute('value')]);
      capturas.push({ atributos: Array.from(this.attributes).map((a) => [a.name, a.value]), campos, conectado: this.isConnected });
    });
    consola = { log: espiar('log'), info: espiar('info'), warn: espiar('warn'), error: espiar('error'), debug: espiar('debug') };
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it.each<[string, string | null | undefined, number]>([
    ['null', null, 0],
    ['cadena vacía', '', 0],
    ['undefined sin variable de entorno', undefined, 0],
    ['http con un servidor remoto', 'http://panel.example.com', 1],
    ['un esquema peligroso', 'javascript:alert(1)', 1],
    ['credenciales en la URL', 'https://u:p@panel.example.com', 1],
    ['solo espacios', '   ', 1]
  ])('sin panel (%s): "sin_panel" sin tocar Supabase ni el DOM y sin el valor en el aviso', async (_caso, valor, avisos) => {
    const { cliente, refreshSession } = clienteRefrescable();

    await expect(handoffToPanel(cliente, valor)).resolves.toBe('sin_panel');

    expect(refreshSession).not.toHaveBeenCalled();
    expect(formularios()).toHaveLength(0);
    expect(submit).not.toHaveBeenCalled();
    expect(consola.warn.mock.calls).toEqual(Array(avisos).fill(['VITE_PANEL_URL no es valida; se ignora']));
    (['log', 'info', 'error', 'debug'] as const).forEach((nivel) => expect(consola[nivel]).not.toHaveBeenCalled());
  });

  it('sin argumento usa el entorno, y un null explícito le gana', async () => {
    mockUrlEntorno.mockReturnValue(PANEL);
    const { cliente, refreshSession } = clienteRefrescable();

    await expect(handoffToPanel(cliente, null)).resolves.toBe('sin_panel');
    expect(refreshSession).not.toHaveBeenCalled();

    await expect(handoffToPanel(cliente)).resolves.toBe('enviado');
    expect(capturas[0]?.atributos).toContainEqual(['action', DESTINO]);
  });

  it.each<[string, () => Promise<Sesion>]>([
    ['refreshSession devuelve un error', async () => ({ data: { session: null }, error: { message: 'Invalid Refresh Token' } })],
    ['un error con sesión incluida', async () => ({ data: { session: { access_token: TOKEN } }, error: { message: 'falló' } })],
    ['no hay sesión', async () => ({ data: { session: null }, error: null })],
    ['access_token vacío', async () => conSesion('')],
    ['access_token de solo espacios', async () => conSesion('   ')],
    ['access_token nulo', async () => conSesion(null)],
    ['refreshSession lanza', async () => Promise.reject(new Error('sin red'))]
  ])('si %s: "error", sin formulario ni envío', async (_caso, implementacion) => {
    const { cliente } = clienteRefrescable(implementacion);

    await expect(handoffToPanel(cliente, PANEL)).resolves.toBe('error');

    expect(formularios()).toHaveLength(0);
    expect(submit).not.toHaveBeenCalled();
  });

  it('si el envío del formulario lanza: "error" y el formulario con el token no se queda', async () => {
    submit.mockImplementation(() => { throw new Error('envío bloqueado'); });

    await expect(handoffToPanel(clienteRefrescable().cliente, PANEL)).resolves.toBe('error');

    expect(formularios()).toHaveLength(0);
  });

  it('renueva el token ANTES de enviar y manda un solo POST, sin más atributos (rel, target, enctype), con un solo campo', async () => {
    const refresco = diferida<Sesion>();
    const { cliente, refreshSession } = clienteRefrescable(() => refresco.promesa);

    const traspaso = handoffToPanel(cliente, PANEL);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
    expect(formularios()).toHaveLength(0);

    refresco.resolver(conSesion());
    await expect(traspaso).resolves.toBe('enviado');

    expect(submit).toHaveBeenCalledTimes(1);
    expect(capturas).toEqual([{ atributos: [['method', 'post'], ['action', DESTINO]], campos: [['hidden', 'access_token', TOKEN]], conectado: true }]);
    expect(formularios()).toHaveLength(1);
    expect(formularios()[0]?.querySelectorAll('input, textarea, select, button')).toHaveLength(1);
  });

  it('el token no aparece en la URL, las cookies, localStorage, sessionStorage, window.name ni la consola', async () => {
    const href = window.location.href;

    await handoffToPanel(clienteRefrescable().cliente, PANEL);

    expect(window.location.href).toBe(href);
    const sitios = [formularios()[0]?.getAttribute('action'), document.cookie, window.name, JSON.stringify({ ...window.localStorage }), JSON.stringify({ ...window.sessionStorage })];
    sitios.forEach((sitio) => expect(sitio).not.toContain(TOKEN));
    Object.values(consola).forEach((espia) => expect(JSON.stringify(espia.mock.calls)).not.toContain(TOKEN));
  });

  it('retira el formulario con el token a los 10 s si la página sigue viva', async () => {
    await handoffToPanel(clienteRefrescable().cliente, PANEL);
    jest.advanceTimersByTime(9_999); // Literal a propósito: la constante exportada no puede validarse a sí misma.
    expect(formularios()).toHaveLength(1);

    jest.advanceTimersByTime(1);
    expect(formularios()).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('el cliente real de Supabase cumple la forma estructural que pide el módulo', () => {
    // Lo comprueba `tsc` (`npm run ts:check`): si `SupabaseClient` dejara de encajar, no compilaría.
    const comoClientes = (cliente: SupabaseClient): [ClienteRefrescable, ClienteCerrable] => [cliente, cliente];

    expect(typeof comoClientes).toBe('function');
  });
});

describe('cerrarSesionTrasSalirDelPanel', () => {
  type LlamadaSalida = (opciones: { scope: 'local' }) => Promise<Salida>;

  /** La clave en la que el cliente real de Supabase guarda su sesión (`auth.storageKey`). */
  const CLAVE = 'sb-127-auth-token';
  const fallo: LlamadaSalida = async () => ({ error: { message: 'sin red' } });

  function clienteCerrable(implementacion: LlamadaSalida = async () => ({ error: null }), storageKey?: string) {
    const signOut = jest.fn<LlamadaSalida>(implementacion);
    // `storageKey` es `protected` en el tipo real: en ejecución sí está y el respaldo lo lee.
    const auth = storageKey === undefined ? { signOut } : Object.assign({ signOut }, { storageKey });
    return { cliente: { auth } satisfies ClienteCerrable, signOut };
  }

  const irA = (ruta: string): void => window.history.replaceState({ marca: 'estado' }, '', ruta);
  const bloquearRemoveItem = (borra: () => void) => () => jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(borra);

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
    jest.restoreAllMocks();
  });

  it.each([
    '/accessweb.html', '/accessweb.html?salir=0', '/accessweb.html?admin=true', '/accessweb.html?salir=11', '/index.html?salir=1', '/?salir=1',
    '/accessweb.html.js?salir=1'
  ])('sin la señal (%s): "sin_senal", sin llamar a Supabase y con la URL intacta', async (ruta) => {
    irA(ruta);
    const href = window.location.href;
    const { cliente, signOut } = clienteCerrable();

    await expect(cerrarSesionTrasSalirDelPanel(cliente)).resolves.toBe('sin_senal');
    expect(signOut).not.toHaveBeenCalled();
    expect(window.location.href).toBe(href);
  });

  it.each([
    ['/accessweb.html?admin=true&salir=1#login', '?admin=true', '#login'],
    ['/accessweb.html?salir=1&admin=true&x=a%20b', '?admin=true&x=a+b', ''],
    ['/accessweb.html?salir=1', '', ''],
    ['/Landingpages-Carni.pwa/accessweb.html?salir=1', '', '']
  ])('con %s cierra una vez con alcance local y deja la consulta en %j y el hash en %j', async (ruta, consulta, hash) => {
    irA(ruta);
    const { cliente, signOut } = clienteCerrable();

    await expect(cerrarSesionTrasSalirDelPanel(cliente)).resolves.toBe('cerrada');

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(window.location.pathname).toBe(ruta.split('?')[0]);
    expect(window.location.search).toBe(consulta);
    expect(window.location.hash).toBe(hash);
    expect(window.history.state).toEqual({ marca: 'estado' });
  });

  it('quita ?salir al terminar, no antes: si la pestaña se cierra a media salida, reabrirla la reintenta', async () => {
    irA('/accessweb.html?salir=1');
    const cierre = diferida<Salida>();
    const { cliente, signOut } = clienteCerrable(() => cierre.promesa);

    const resultado = cerrarSesionTrasSalirDelPanel(cliente);
    await Promise.resolve();
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe('?salir=1');

    cierre.resolver({ error: null });
    await expect(resultado).resolves.toBe('cerrada');
    expect(window.location.search).toBe('');
  });

  it.each<[string, LlamadaSalida]>([
    ['devuelve un error', fallo],
    ['lanza', async () => Promise.reject(new Error('sin red'))],
    ['resuelve sin respuesta', (async () => undefined) as unknown as LlamadaSalida]
  ])('si signOut %s, borra a mano la sesión local y devuelve "cerrada"', async (_caso, implementacion) => {
    irA('/accessweb.html?salir=1');
    window.localStorage.setItem(CLAVE, '{"sesion":"de-mentira"}');
    window.localStorage.setItem('otra-clave', 'se-queda');
    const { cliente, signOut } = clienteCerrable(implementacion, CLAVE);

    await expect(cerrarSesionTrasSalirDelPanel(cliente)).resolves.toBe('cerrada');

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(CLAVE)).toBeNull();
    expect(window.localStorage.getItem('otra-clave')).toBe('se-queda');
  });

  it.each<[string, string | undefined, (() => unknown) | null]>([
    ['el cliente no tiene storageKey', undefined, null],
    ['la storageKey está vacía', '', null],
    ['removeItem lanza (almacenamiento bloqueado)', CLAVE, bloquearRemoveItem(() => { throw new Error('bloqueado'); })],
    ['removeItem no borra nada', CLAVE, bloquearRemoveItem(() => undefined)]
  ])('si signOut falla y %s: "fallida"', async (_caso, clave, bloquear) => {
    irA('/accessweb.html?salir=1');
    window.localStorage.setItem(CLAVE, '{"sesion":"de-mentira"}');
    const { cliente } = clienteCerrable(fallo, clave);
    bloquear?.();

    await expect(cerrarSesionTrasSalirDelPanel(cliente)).resolves.toBe('fallida');

    expect(window.location.search).toBe('');
  });

  it('con ubicación e historial inyectados, un historial que lanza no impide cerrar la sesión', async () => {
    const ubicacion = { href: 'https://tienda.example.com/accessweb.html?salir=1' };
    const historial = { state: null, replaceState: jest.fn<History['replaceState']>(() => { throw new Error('historial bloqueado'); }) };
    const { cliente, signOut } = clienteCerrable();

    await expect(cerrarSesionTrasSalirDelPanel(cliente, ubicacion, historial)).resolves.toBe('cerrada');

    expect(historial.replaceState).toHaveBeenCalledWith(null, '', '/accessweb.html');
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
