/**
 * Los globales de Jest se importan a mano: `tsconfig.json` fija `types` sin los
 * de Jest, así que `describe` y `expect` no existen para TypeScript aunque sí
 * existan al ejecutar.
 *
 * Lo que se comprueba aquí es el contrato de la rebanada 1.1 en una prueba de
 * arquitectura y tres de comportamiento: la búsqueda NO vuelve a traer
 * superposición propia, vive dentro de la `Hoja` compartida, sigue buscando a
 * partir de dos letras y no se inventa resultados cuando la conexión falla.
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { renderConProveedores } from '@src/components/__tests__/renderConProveedores';
import { store } from '@src/redux/store';
import { reiniciarResultados } from '@src/redux/slices/busquedaSlice';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import type { Product } from '@src/types/database';
import { LupaHoja } from '../LupaHoja';

/** El escaparate se arma con los seis productos de mayor id, igual que en la Lupa. */
const ESCAPARATE: Product[] = [...SEED_PRODUCTS]
  .sort((a, b) => Number(b.id) - Number(a.id))
  .slice(0, 6);

/**
 * El módulo que guarda las credenciales se sustituye, igual que hace
 * `Tarjeta.test.tsx` con `assetUrl`: `src/data/supabase.ts` lee `import.meta.env`
 * y ese código no se puede parsear en el CommonJS que genera Babel para Jest.
 *
 * La gracia del mock es que se puede ESPIAR. Devolver `null` equivale a un
 * entorno sin credenciales, y contar las llamadas deja demostrado lo que la
 * rebanada 1.1 pide: que el slice ya no lee variables por su cuenta sino que
 * pregunta al módulo común —y solo pregunta cuando de verdad va a buscar.
 */
const mockCredenciales = jest.fn<() => null>(() => null);

jest.mock('@src/data/supabase', () => ({
  credencialesSupabase: () => mockCredenciales(),
  hayConfiguracion: () => false,
  obtenerSupabase: () => Promise.resolve(null)
}));

function pintar(alElegir = jest.fn<(producto: Product) => void>()) {
  const resultado = renderConProveedores(
    <Provider store={store}>
      <LupaHoja abierta alCerrar={jest.fn()} alElegir={alElegir} />
    </Provider>
  );

  return { alElegir, ...resultado };
}

const campo = (): HTMLElement => screen.getByLabelText('Buscar un corte o una promoción');

describe('LupaHoja', () => {
  // El store es el de la aplicación y las pruebas comparten estado: sin resetear,
  // el `cargando` o el `error` de una prueba se cuelan en la siguiente.
  beforeEach(() => {
    store.dispatch(reiniciarResultados());
    window.localStorage.clear();
    mockCredenciales.mockClear();
  });

  test('la búsqueda se monta DENTRO de la hoja compartida', async () => {
    pintar();

    // El nombre accesible lo pone `Hoja` a partir de su título. Antes la Lupa se
    // declaraba a sí misma como diálogo, y por eso había dos nombres —y dos
    // superposiciones— para la misma ventana.
    const hoja = await screen.findByRole('dialog', { name: 'Buscar' });

    expect(hoja).toHaveAttribute('data-superposicion', 'buscar');
    // El id también lo pone la hoja: es el contrato con `aria-controls` del
    // disparador y con el plan B de foco de Safari.
    expect(hoja).toHaveAttribute('id', 'hoja-buscar');
    expect(within(hoja).getByLabelText('Buscar un corte o una promoción')).toBeInTheDocument();
  });

  test('con una sola letra no consulta: sigue el escaparate', async () => {
    pintar();

    await userEvent.type(campo(), 'a');

    // Nadie ha buscado nada todavía, así que lo que hay en pantalla es el
    // escaparate. Si el mínimo se hubiera roto, este texto desaparecería y en su
    // lugar aparecería el estado vacío de una consulta que no se hizo.
    expect(screen.getByText('Lo nuevo')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    // Ni siquiera se le pregunta al módulo común por las credenciales: con una
    // letra no hay petición que hacer.
    expect(mockCredenciales).not.toHaveBeenCalled();
  });

  test('con dos letras busca y, sin conexión, lo dice en vez de inventar', async () => {
    pintar();

    await userEvent.type(campo(), 'arr');

    // Pasadas las dos letras, el escaparate ya no vale: lo que hay en pantalla es
    // la respuesta a una pregunta. Si la respuesta es cero, cero se pinta —que es
    // justo lo que dejaba de mentir en la práctica anterior— y en este entorno,
    // sin credenciales, el cero llega como un fallo VISIBLE.
    const aviso = await screen.findByRole('alert', undefined, { timeout: 3000 });
    expect(screen.queryByText('Lo nuevo')).not.toBeInTheDocument();

    // Y la consulta sale por el módulo común, no leyendo variables aparte.
    expect(mockCredenciales).toHaveBeenCalled();

    // Lo que NO puede aparecer es una rejilla de seis cortes con precios que no
    // son los de la base.
    expect(aviso).toHaveTextContent('arr');
    expect(aviso).toHaveTextContent(/no pudimos buscar/i);
  });

  test('elegir un resultado lo devuelve al anfitrión sin cerrar la hoja por su cuenta', async () => {
    const { alElegir } = pintar();

    const [primero] = ESCAPARATE;
    const tarjeta = screen.getByText(primero.name).closest('button');
    expect(tarjeta).not.toBeNull();

    await userEvent.click(tarjeta as HTMLButtonElement);

    expect(alElegir).toHaveBeenCalledTimes(1);
    expect(alElegir.mock.calls[0][0]).toMatchObject({ id: primero.id, name: primero.name });
    // El contenido sigue montado: cerrar la hoja es del anfitrión, que sabe si
    // después navega dentro de la página o se va a otra.
    expect(screen.getByRole('dialog', { name: 'Buscar' })).toBeInTheDocument();
  });
});