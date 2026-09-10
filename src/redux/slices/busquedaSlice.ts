/**
 * La busqueda de la Lupa, con sus tres estados explicitos.
 *
 * ESTE SLICE ARREGLA UN BUG QUE COSTO SEMANAS, y por eso vale la pena.
 *
 * La Lupa devolvia HTTP 400 en CADA busqueda y nadie se enteraba. El codigo
 * leia `data` e ignoraba `error` —Supabase no lanza excepciones, devuelve las
 * dos cosas— y un respaldo local llenaba la lista con precios inventados: el
 * pollo entero salia a 85 el kilo cuando en la base vale 119. La pantalla se
 * veia perfecta mientras el servidor rechazaba todo.
 *
 * Con `createAsyncThunk` ese bug NO SE PUEDE ESCRIBIR. `pending`, `fulfilled` y
 * `rejected` son tres ramas separadas del reducer: un fallo no tiene donde
 * esconderse porque tiene su propia rama y su propio campo en el estado.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { Product } from '@src/types/database';

/** Columnas minimas de un resultado: nada de stock ni metadata interna. */
const COLUMNAS =
  'id, name, description, price_per_kg, price_per_lb, image_url, categories(id, name, slug)';

const MINIMO_LETRAS = 2;
const LIMITE = 12;

/*
  Las credenciales se leen igual que en `js/modules/supabase.js`, con la misma
  guarda y las mismas dos claves.

  La guarda `typeof import.meta` existe porque este modulo tambien se carga
  fuera de Vite —Jest, por ejemplo—, donde `import.meta.env` no esta inyectado y
  el acceso directo reventaria al importar el store entero.

  Se aceptan las DOS claves a proposito: hay entornos desplegados que todavia
  definen la vieja `VITE_SUPABASE_KEY`, y leer solo la nueva los dejaria sin
  buscador sin decir por que.
*/
const entorno = (typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : {}) as Record<string, string | undefined>;

const SUPABASE_URL = entorno.VITE_SUPABASE_URL;
const ANON_KEY = entorno.VITE_SUPABASE_ANON_KEY || entorno.VITE_SUPABASE_KEY;

/**
 * Escapa los comodines de LIKE y los separadores de `.or()` de PostgREST.
 *
 * `%` y `_` son comodines del patron, y `.or()` separa condiciones con comas y
 * las agrupa con parentesis: un termino que traiga cualquiera de esos rompe el
 * filtro y devuelve 400.
 *
 * MEDIDO CONTRA EL SERVIDOR, NO SUPUESTO: `\%`, `\_`, `\(` y `\)` si funcionan,
 * pero `\,` NO. Buscar "a,b" sigue devolviendo 400 (PGRST100, "failed to parse
 * logic tree"), porque la coma separa las condiciones del arbol logico y ahi la
 * barra invertida no la desarma. Lo que si funciona es entrecomillar el valor
 * —`name.ilike."%a,b%"`—, verificado tambien contra el servidor. No se cambia
 * en esta entrega para no mover el escape junto con el cambio de cliente: el
 * fallo es anterior a axios y se comporta igual con los dos. Queda anotado.
 */
function escapar(termino: string): string {
  return termino.replace(/[\\%_,()]/g, (c) => `\\${c}`);
}

export interface EstadoBusqueda {
  resultados: Product[];
  cargando: boolean;
  error: string | null;
  termino: string;
}

const estadoInicial: EstadoBusqueda = {
  resultados: [],
  cargando: false,
  error: null,
  termino: ''
};

/**
 * Traduce cualquier fallo de la peticion a UNA frase que se pueda mostrar.
 *
 * PostgREST responde los errores con un cuerpo JSON que trae `message` —el
 * texto util, "failed to parse logic tree..."—. Si el fallo ni siquiera llego
 * al servidor (red caida, DNS, timeout) no hay `response` y solo queda el
 * mensaje de axios. Las dos ramas terminan en un string, que es lo unico que
 * `rejectValue` acepta y lo unico que la pantalla sabe pintar.
 */
function mensajeDeError(fallo: unknown): string {
  if (axios.isAxiosError(fallo)) {
    const cuerpo = fallo.response?.data as { message?: string } | undefined;
    return cuerpo?.message ?? fallo.message;
  }

  return fallo instanceof Error ? fallo.message : 'No pudimos buscar en este momento.';
}

/**
 * La peticion asincrona, ahora contra la API REST de Supabase con axios.
 *
 * POR QUE AXIOS Y NO EL CLIENTE DE SUPABASE
 * -----------------------------------------
 * Primero, porque el enunciado del proyecto lo pide con esas palabras: "para
 * las peticiones se debera de utilizar Axios". Segundo, porque de paso deja los
 * errores HTTP en un solo sitio: axios LANZA en 4xx/5xx, asi que todos los
 * fallos —400 de filtro, 401 de llave, red caida— caen por el mismo `catch` y
 * salen por la misma puerta.
 *
 * OJO CON EL CAMBIO DE CONTRATO, QUE ES LA TRAMPA
 * -----------------------------------------------
 * El cliente de Supabase NO lanza: devuelve `{ data, error }`, y por eso el bug
 * original pudo esconderse durante semanas leyendo solo `data`. Axios hace lo
 * contrario y por eso hay `try/catch`: sin el, un 400 saldria del thunk como
 * promesa rechazada sin pasar por `rejectWithValue` y `accion.payload` llegaria
 * `undefined` a la rama `rejected`. La lista seguiria vaciandose, si, pero el
 * mensaje del servidor —el que dice QUE se rompio— se perderia otra vez.
 *
 * `select`, `is_active` y `or` son los mismos parametros que el cliente ponia
 * en la URL; lo unico que cambia es quien los escribe. El `or` va entre
 * parentesis porque asi lo exige PostgREST para un arbol logico, y eso era algo
 * que `.or()` agregaba solo.
 */
export const buscarProductos = createAsyncThunk<
  Product[],
  string,
  { rejectValue: string }
>('busqueda/buscarProductos', async (termino, { rejectWithValue }) => {
  const limpio = termino.trim();
  if (limpio.length < MINIMO_LETRAS) {
    return [];
  }

  /* Sin credenciales la URL quedaria como "undefined/rest/v1/products" y el
     fallo llegaria disfrazado de error de red. Al no importar ya el cliente de
     Supabase, este modulo perdio la validacion que aquel hacia al cargarse; se
     repone aqui para que el aviso diga la verdad. */
  if (!SUPABASE_URL || !ANON_KEY) {
    return rejectWithValue('Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }

  const patron = `%${escapar(limpio)}%`;

  try {
    const respuesta = await axios.get<Product[]>(`${SUPABASE_URL}/rest/v1/products`, {
      params: {
        select: COLUMNAS,
        is_active: 'eq.true',
        or: `(name.ilike.${patron},description.ilike.${patron})`,
        limit: LIMITE
      },
      /* Las dos cabeceras hacen falta y no son la misma: `apikey` identifica al
         proyecto y `Authorization` es la que decide bajo que rol corren las
         politicas RLS. Con solo una de ellas la respuesta es 401. */
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`
      }
    });

    return respuesta.data ?? [];
  } catch (fallo) {
    return rejectWithValue(mensajeDeError(fallo));
  }
});

const busquedaSlice = createSlice({
  name: 'busqueda',
  initialState: estadoInicial,
  reducers: {
    reiniciarResultados(estado) {
      estado.resultados = [];
      estado.error = null;
      estado.termino = '';
    },
    fijarTermino(estado, accion: PayloadAction<string>) {
      estado.termino = accion.payload;
    }
  },
  /*
    Los tres estados del thunk. No los despacha nadie a mano: RTK los emite solo
    segun como termine la promesa.
  */
  extraReducers: (builder) => {
    builder
      .addCase(buscarProductos.pending, (estado) => {
        estado.cargando = true;
        estado.error = null;
      })
      .addCase(buscarProductos.fulfilled, (estado, accion) => {
        estado.cargando = false;
        estado.resultados = accion.payload;
      })
      .addCase(buscarProductos.rejected, (estado, accion) => {
        estado.cargando = false;
        /* El error se GUARDA y se muestra. Antes se perdia en silencio y la
           lista se llenaba con datos locales como si nada hubiera fallado. */
        estado.error = accion.payload ?? 'No pudimos buscar en este momento.';
        estado.resultados = [];
      });
  }
});

export const { reiniciarResultados, fijarTermino } = busquedaSlice.actions;

export default busquedaSlice.reducer;
