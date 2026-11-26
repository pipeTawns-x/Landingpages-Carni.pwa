import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import {
  buscarProductos,
  reiniciarResultados
} from '@src/redux/slices/busquedaSlice';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import type { Despacho, EstadoRaiz } from '@src/redux/store';
import type { Product } from '@src/types/database';
import { SoloLectores, Cuerpo, SearchForm, SearchInput, GhostButton, ChipRow, ChipLinea, RowLabel, Chip, RecentChip, SectionHeader, ResultsGrid, ResultCard, ResultThumb, ResultInfo, ResultName, ResultPrice, EmptyState } from './styles';

export interface LupaProps {
  /** Qué hacer cuando el usuario elige un resultado. Lo decide la web anfitriona. */
  onPickProduct: (product: Product) => void;
}

/*
 * Lupa de búsqueda — Práctica 4.
 *
 * ESTE ARCHIVO ES CONTENIDO, NO UNA SUPERPOSICIÓN.
 * -------------------------------------------------
 * Antes era un popin entero: telón, panel, botón de cerrar, ciclo de foco y
 * listeners sobre los disparadores del encabezado. Todo eso vive ahora en
 * `src/ui/Hoja.tsx`, que es la base única de superposiciones del proyecto. Aquí
 * queda lo que la hoja no puede dar por hecho: el campo, las sugerencias, la
 * rejilla de resultados y los tres estados de la búsqueda.
 *
 * Las dos consecuencias que se notan al leer el código:
 *
 *   - No hay `open`. Quien la abre —`Carcasa` en la tienda nueva,
 *     `montarLupa()` en index y accessweb, `LupaConRuta` en products— decide si
 *     se cierra al elegir un resultado, y si hace falta al navegar.
 *   - No hay `triggerRef`. El foco lo devuelve el navegador al cerrar el diálogo
 *     nativo; `Hoja` solo añade el plan B para Safari de escritorio, que no
 *     enfoca los botones al pulsarlos, y pone el foco inicial en el campo
 *     cuando quien la monta pide `focoEnContenido`.
 *
 * Búsqueda en vivo contra Supabase con el patrón #547: columna restringida
 * (sin stock ni metadata), .ilike parametrizado con escape de %/_/\, mínimo 2
 * caracteres, límite de 12 y debounce de 250ms.
 */

/**
 * Columnas mínimas para un resultado: nada de stock ni metadata interna.
 *
 * TODAS TIENEN QUE EXISTIR EN LA TABLA. `is_promoted` y `badge` estuvieron aquí
 * y no son columnas de `products`: son campos opcionales del tipo `Product`
 * (src/types/database.ts) que solo el seed rellena. PostgREST respondía 400
 * —«column products.is_promoted does not exist»— a CADA búsqueda, y como el
 * fallo caía en el suelo de seed, la lista se veía correcta y la búsqueda en
 * vivo no funcionó nunca. TypeScript no lo puede ver: esto es un string.
 */
const RESULT_SELECT =
  'id, name, description, price_per_kg, price_per_lb, image_url, categories(id, name, slug)';

const TENDENCIAS = ['arrachera', 'rib eye', 'pollo', 'promos'] as const;

const PALABRAS_ROTATIVAS = ['un corte', 'una promoción'] as const;

const RECIENTES_KEY = 'carni_busquedas_v1';
const MAX_RECIENTES = 5;
const DEBOUNCE_MS = 250;
const CICLO_PLACEHOLDER_MS = 4000;
const MIN_TERM_LENGTH = 2;

/* ------------------------------------------------------------------ helpers */

/*
 * El precio de esta rejilla usa la variante `vitrina`: codigo de moneda delante
 * en vez de simbolo, y dos decimales fijos para que "MXN 85.00" y "MXN 120.50"
 * no se alineen distinto en la misma fila. Es la lectura de la referencia y se
 * mantiene tal cual.
 *
 * Lo que cambia es de donde sale: el bloque de `Intl` que vivia aqui era una de
 * SEIS copias, y la que mas se habia alejado de las demas. Ahora la diferencia
 * es un argumento con nombre —no un `Intl.NumberFormat` distinto en cada
 * archivo—, asi que se ve que es una decision y no una divergencia.
 */

function categorySlug(product: Product): string {
  if (Array.isArray(product.categories)) {
    return product.categories[0]?.slug ?? '';
  }
  return product.categories?.slug ?? '';
}

function categoryName(product: Product): string {
  if (Array.isArray(product.categories) && product.categories[0]?.name) {
    return product.categories[0].name;
  }
  if (!Array.isArray(product.categories) && product.categories?.name) {
    return product.categories.name;
  }
  return 'Corte especial';
}

function priceUnit(product: Product): string {
  const slug = categorySlug(product);
  if (slug === 'merch') {
    return '/ pieza';
  }
  if (slug === 'ofertas' && !product.price_per_lb) {
    return '/ paquete';
  }
  return '/ kg';
}

function readRecientes(): string[] {
  try {
    const raw = window.localStorage.getItem(RECIENTES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECIENTES) : [];
  } catch {
    return [];
  }
}

function rememberTerm(term: string): string[] {
  const next = [term, ...readRecientes().filter((t) => t !== term)].slice(0, MAX_RECIENTES);
  try {
    window.localStorage.setItem(RECIENTES_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible: los recientes no son críticos */
  }
  return next;
}

/* ---------------------------------------------------------------- estilos */
/* ---------------------------------------------------------------- componente */

/**
 * Qué se ve en las dos secciones de la hoja.
 *
 * AQUI VIVIA LA ULTIMA GUARIDA DEL FALLO MUDO, y era la peor porque parecia
 * inofensiva. Esta funcion recibia `term` y NO LO USABA: con la lista viva
 * vacia mostraba el seed SIEMPRE, sin preguntarse por qué estaba vacía.
 *
 * Y hay dos motivos muy distintos para que esté vacía:
 *
 *   1. El cliente todavía no buscó nada. La hoja recién abrió y hay que
 *      llenarlo con algo — eso es un ESCAPARATE, y es legítimo. La referencia
 *      hace lo mismo: al abrir muestra "Lo nuevo" sin que nadie haya tecleado.
 *
 *   2. El cliente buscó y no hubo coincidencias. Eso es un RESULTADO, y el
 *      resultado es CERO. Rellenarlo con seis cortes del seed —con precios que
 *      no son los de la base— es contestarle otra cosa a la pregunta que hizo.
 *
 * Se arreglo el 400 en el slice y el error quedó visible, pero el camino del
 * VACIO seguía mintiendo un archivo más abajo: buscar «a,b» ahora devuelve 200
 * con cuerpo vacío y la pantalla igual pintaba seis cortes inventados.
 *
 * El parámetro que hacía falta ya estaba en la firma. Solo había que leerlo.
 */
function splitResults(term: string, live: Product[]): { fresh: Product[]; featured: Product[] } {
  if (live.length > 0) {
    const middle = Math.ceil(live.length / 2);
    return { fresh: live.slice(0, middle), featured: live.slice(middle) };
  }

  /* Buscó de verdad y no hubo nada: cero es cero. El estado vacío de más abajo
     se encarga de decírselo con sus palabras. */
  if (term.length >= MIN_TERM_LENGTH) {
    return { fresh: [], featured: [] };
  }

  /* Todavía no buscó: el seed entra como escaparate, no como respuesta. */
  const byIdDesc = [...SEED_PRODUCTS].sort((a, b) => Number(b.id) - Number(a.id));
  return {
    fresh: byIdDesc.slice(0, 6),
    featured: SEED_PRODUCTS.filter((p) => p.is_promoted || p.badge).slice(0, 6)
  };
}

export function Lupa({ onPickProduct }: LupaProps): JSX.Element {
  const [term, setTerm] = useState<string>('');
  /*
    Los resultados ya no son estado local: viven en el slice de busqueda.

    Antes esta pantalla tenia su propio `results` y su propio `searching`, y
    ningun campo para el error — por eso un 400 de Supabase entraba como "no
    hay resultados" y un respaldo local lo tapaba con precios inventados.
    Ahora los tres estados son del slice y el error tiene su propio lugar.
  */
  const { resultados: results, cargando: searching, error: errorBusqueda } = useSelector(
    (estado: EstadoRaiz) => estado.busqueda
  );
  const despachar = useDispatch<Despacho>();
  const [recientes, setRecientes] = useState<string[]>(() => readRecientes());
  const [palabraIndex, setPalabraIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  /* Rotación del placeholder estilo LV (--speed: 4s). */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPalabraIndex((index) => (index + 1) % PALABRAS_ROTATIVAS.length);
    }, CICLO_PLACEHOLDER_MS);
    return () => window.clearInterval(timer);
  }, []);

  /* Búsqueda con debounce: solo a partir de 2 caracteres. */
  useEffect(() => {
    const query = term.trim();
    if (query.length < MIN_TERM_LENGTH) {
      despachar(reiniciarResultados());
      return;
    }

    /* El debounce se queda: el thunk maneja los estados, no el ritmo. Sin esto
       cada tecla seria una consulta a la base. */
    const timer = window.setTimeout(() => {
      void despachar(buscarProductos(query));
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [term, despachar]);

  const query = term.trim();
  const { fresh, featured } = splitResults(query, results);

  const runTerm = useCallback(
    (value: string) => {
      setTerm(value);
      setRecientes(rememberTerm(value.trim()));
      inputRef.current?.focus();
    },
    []
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = term.trim();
      if (value.length >= MIN_TERM_LENGTH) {
        runTerm(value);
      }
    },
    [term, runTerm]
  );

  /**
   * Elegir un resultado no cierra nada: eso es del anfitrión.
   *
   * `LupaConRuta` cierra la hoja y navega dentro del router del catálogo.
   * `Carcasa` va a `products.html`, que es una página distinta: ahí no hace
   * falta cerrar, porque la hoja se va con el documento entero. Antes era esta
   * función la que llamaba a `setOpen(false)`, y con dos anfitriones distintos
   * solo podía acertar una de las dos veces.
   */
  const handlePick = useCallback(
    (product: Product) => {
      const value = term.trim();
      if (value.length >= MIN_TERM_LENGTH) {
        setRecientes(rememberTerm(value));
      }
      onPickProduct(product);
    },
    [term, onPickProduct]
  );

  return (
    <Cuerpo>
      {/*
        La región de búsqueda —con el nombre "búsqueda", no "diálogo"— baja aquí
        al formulario, que es su sitio. Quien lo lea sigue encontrando una región
        de búsqueda; lo que se perdió a propósito es que la Lupa se anunciara
        además como modal, porque el diálogo lo declara `Hoja` y no puede haber
        dos nombres para la misma ventana.

        OJO: esta compuerta (`D6`) cuenta con `rg` y no distingue un comentario
        de codigo. Escribir aquí el nombre exacto del rol que se está quitando
        seguiría haciendo creer que la Lupa trae su propia superposición.
      */}
      <SearchForm onSubmit={handleSubmit} role="search">
        <SearchInput
          aria-autocomplete="list"
          aria-controls="lupa-resultados"
          aria-describedby="lupa-ayuda"
          aria-label="Buscar un corte o una promoción"
          autoComplete="off"
          onChange={(event) => setTerm(event.target.value)}
          placeholder={`Búsqueda de ${PALABRAS_ROTATIVAS[palabraIndex]}`}
          ref={inputRef}
          spellCheck={false}
          type="search"
          value={term}
        />
        {/* Solo LIMPIAR vive dentro del campo. La de cerrar se fue a la
            esquina: juntas eran dos circulos identicos y, justo cuando el
            cliente ya habia escrito, no se sabia cual vaciaba y cual salia. */}
        {term ? (
          <GhostButton aria-label="Limpiar la búsqueda" onClick={() => setTerm('')} type="button">
            ×
          </GhostButton>
        ) : null}
      </SearchForm>

      {/*
        Quien no ve la pantalla no se entera de que debajo hay una lista que
        cambia sola mientras teclea. La descripción se lee una vez, al
        enfocar el campo; el `status` avisa del recuento cada vez que la
        lista cambia, sin robar el foco. Es lo que hace la lupa de Louis
        Vuitton con su label larga, dicho con las dos piezas que hoy
        corresponden.
      */}
      <SoloLectores id="lupa-ayuda">
        Escribe al menos {MIN_TERM_LENGTH} letras. Las sugerencias aparecen debajo y se
        actualizan mientras escribes.
      </SoloLectores>
      <SoloLectores aria-live="polite" role="status">
        {query.length >= MIN_TERM_LENGTH
          ? searching
            ? `Buscando ${query}`
            : `${fresh.length + featured.length} resultados para ${query}`
          : ''}
      </SoloLectores>

      <ChipRow aria-label="Búsquedas de tendencia">
        <RowLabel>Búsquedas de tendencias</RowLabel>
        <ChipLinea>
          {TENDENCIAS.map((tendencia) => (
            <Chip key={tendencia} onClick={() => runTerm(tendencia)} type="button">
              {tendencia}
            </Chip>
          ))}
        </ChipLinea>
      </ChipRow>

      {recientes.length > 0 ? (
        <ChipRow aria-label="Búsquedas recientes">
          <RowLabel>Recientes</RowLabel>
          <ChipLinea>
          {recientes.map((reciente) => (
            <RecentChip key={reciente} onClick={() => runTerm(reciente)} type="button">
              {reciente}
              <i
                aria-hidden="true"
                onClick={(event) => {
                  event.stopPropagation();
                  setRecientes(readRecientes().filter((t) => t !== reciente));
                  try {
                    window.localStorage.setItem(
                      RECIENTES_KEY,
                      JSON.stringify(readRecientes().filter((t) => t !== reciente))
                    );
                  } catch {
                    /* sin almacenamiento: nada que limpiar */
                  }
                }}
              >
                ×
              </i>
            </RecentChip>
          ))}
          </ChipLinea>
        </ChipRow>
      ) : null}

      {query.length >= MIN_TERM_LENGTH &&
      searching &&
      fresh.length === 0 &&
      featured.length === 0 ? (
        <EmptyState>Buscando «{query}»…</EmptyState>
      ) : null}

      {/*
        El error, VISIBLE y con salida.

        Este bloque es la razon de ser de la practica. Antes un fallo del
        servidor no llegaba nunca a la pantalla: se leia `data`, se ignoraba
        `error`, y un respaldo local rellenaba la lista con precios que no
        eran los de la base. El cliente veia una busqueda que funcionaba.

        Ahora `rejected` tiene su propia rama en el slice, su propio campo
        en el estado, y aqui su propio lugar en la pantalla — con un boton
        para reintentar, que es lo que el enunciado pide.
      */}
      {errorBusqueda ? (
        <EmptyState role="alert">
          No pudimos buscar «{query}». {errorBusqueda}{' '}
          <button type="button" onClick={() => void despachar(buscarProductos(query))}>
            Reintentar
          </button>
        </EmptyState>
      ) : null}

      <div id="lupa-resultados">
        {fresh.length > 0 ? (
        <section>
          <SectionHeader>Lo nuevo</SectionHeader>
          <ResultsGrid>
            {fresh.map((product) => (
              <ResultCard key={product.id} onClick={() => handlePick(product)} type="button">
                <ResultThumb
                  alt=""
                  aria-hidden="true"
                  src={product.image_url ?? '/img/products/res.png'}
                />
                <ResultInfo>
                  <ResultName>{product.name}</ResultName>
                  <ResultPrice>
                    {formatearPrecio(product.price_per_kg, 'vitrina')} <small>{priceUnit(product)}</small>
                  </ResultPrice>
                </ResultInfo>
              </ResultCard>
            ))}
          </ResultsGrid>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section>
          <SectionHeader>Cortes destacados</SectionHeader>
          <ResultsGrid>
            {featured.map((product) => (
              <ResultCard key={product.id} onClick={() => handlePick(product)} type="button">
                <ResultThumb
                  alt=""
                  aria-hidden="true"
                  src={product.image_url ?? '/img/products/res.png'}
                />
                <ResultInfo>
                  <ResultName>{product.name}</ResultName>
                  <ResultPrice>
                    {formatearPrecio(product.price_per_kg, 'vitrina')} <small>{priceUnit(product)}</small>
                  </ResultPrice>
                </ResultInfo>
              </ResultCard>
            ))}
          </ResultsGrid>
        </section>
      ) : null}

      {query.length >= MIN_TERM_LENGTH &&
        !searching &&
        fresh.length === 0 &&
        featured.length === 0 ? (
          <EmptyState>Sin resultados para «{query}». Prueba con otro corte.</EmptyState>
        ) : null}
      </div>
    </Cuerpo>
  );
}