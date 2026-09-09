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
import { supabase } from '../../../js/modules/supabase.js';
import type { Product } from '@src/types/database';

/** Columnas minimas de un resultado: nada de stock ni metadata interna. */
const COLUMNAS =
  'id, name, description, price_per_kg, price_per_lb, image_url, categories(id, name, slug)';

const MINIMO_LETRAS = 2;
const LIMITE = 12;

/**
 * Escapa los comodines de LIKE y los separadores de `.or()` de PostgREST.
 *
 * `%` y `_` son comodines del patron, y `.or()` separa condiciones con comas y
 * las agrupa con parentesis: un termino que traiga cualquiera de esos rompe el
 * filtro y devuelve 400.
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
 * La peticion asincrona.
 *
 * `rejectWithValue` es la pieza clave: convierte el `error` que Supabase
 * DEVUELVE —no lanza— en un rechazo de verdad del thunk. Sin esto, un 400
 * volveria por la rama `fulfilled` con la lista vacia, que es exactamente el
 * disfraz que tenia el bug.
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

  const patron = `%${escapar(limpio)}%`;

  const { data, error } = await supabase
    .from('products')
    .select(COLUMNAS)
    .eq('is_active', true)
    .or(`name.ilike.${patron},description.ilike.${patron}`)
    .limit(LIMITE);

  if (error) {
    return rejectWithValue(error.message);
  }

  return (data ?? []) as Product[];
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
