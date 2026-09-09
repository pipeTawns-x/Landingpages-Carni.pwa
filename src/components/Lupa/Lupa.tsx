import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../../../js/modules/supabase.js';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import {
  buscarProductos,
  reiniciarResultados
} from '@src/redux/slices/busquedaSlice';
import type { Despacho, EstadoRaiz } from '@src/redux/store';
import type { Product } from '@src/types/database';
import { Backdrop, Popin, Inner, Encabezado, Wordmark, CerrarEsquina, SoloLectores, SearchForm, SearchInput, GhostButton, ChipRow, ChipLinea, RowLabel, Chip, RecentChip, SectionHeader, ResultsGrid, ResultCard, ResultThumb, ResultInfo, ResultName, ResultPrice, EmptyState } from './styles';

export interface LupaProps {
  /** Qué hacer cuando el usuario elige un resultado. Lo decide la web anfitriona. */
  onPickProduct: (product: Product) => void;
}

/*
 * Lupa de búsqueda — Práctica 4.
 *
 * Popin estilo Louis Vuitton adaptado a Carni: desciende del header con un
 * telón atenuado detrás, la página sigue usable (sin body lock) y el estado
 * abierto se anuncia con aria-expanded en el botón estático del header.
 *
 * Búsqueda en vivo contra Supabase con el patrón #547: columna restringida
 * (sin stock ni metadata), .ilike parametrizado con escape de %/_/\, mínimo 2
 * caracteres, límite de 12 y debounce de 250ms. Si Supabase no responde en
 * 1.5s, cae al seed — el mismo suelo duro que usa fetchProducts().
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
const TIMEOUT_MS = 1500;
const CICLO_PLACEHOLDER_MS = 4000;
const MIN_TERM_LENGTH = 2;

/* ------------------------------------------------------------------ helpers */

/**
 * Precio como en la referencia: "MXN 1,234.00".
 *
 * `currencyDisplay: 'code'` pone el codigo delante en vez del simbolo, y los
 * dos decimales fijos evitan que "$85" y "$120.50" se alineen distinto en la
 * misma fila de la rejilla. Es local a este archivo: no se filtra al carrito ni
 * a las tarjetas del catalogo, que tienen su propio formato.
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

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

/**
 * Escapa los comodines de LIKE y los separadores del `.or()` de PostgREST.
 * PostgREST envía la búsqueda parametrizada a PostgreSQL, pero `%` y `_` son
 * comodines del patrón: un término que los contenga ampliaría la búsqueda en
 * vez de buscarlos al pie de la letra. Además, `.or()` usa comas para separar
 * condiciones y paréntesis para agruparlas: un término con `,` o `()` rompería
 * la sintaxis del filtro (400 silencioso que degrada al seed).
 */
function escapeIlkce(term: string): string {
  return term.replace(/[\\%_,()]/g, (char) => `\\${char}`);
}

function searchSeed(term: string): Product[] {
  const needle = term.toLowerCase();
  return SEED_PRODUCTS.filter((product) => {
    const haystack = `${product.name} ${product.description} ${categoryName(product)}`.toLowerCase();
    return haystack.includes(needle);
  }).slice(0, 12);
}

/**
 * Búsqueda en vivo con suelo duro de seed. Devuelve siempre una lista en el
 * plazo de TIMEOUT_MS: si Supabase no responde, el seed filtra localmente.
 */
async function searchProducts(term: string): Promise<Product[]> {
  const escaped = escapeIlkce(term);
  const pattern = `%${escaped}%`;

  let timeoutId = 0;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(null), TIMEOUT_MS);
  });

  try {
    const request = supabase
      .from('products')
      .select(RESULT_SELECT)
      .eq('is_active', true)
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .limit(12) as Promise<unknown>;

    const settled = await Promise.race([request, timeout]);

    if (settled !== null && typeof settled === 'object') {
      // Supabase NO lanza: devuelve `{ data, error }`. Leer solo `data` deja
      // pasar un 400 como si fuera «sin resultados», y el seed lo disfraza de
      // búsqueda que funciona. El error se mira antes que los datos.
      const { data, error } = settled as {
        data: Product[] | null;
        error: { message: string; code?: string } | null;
      };

      if (error) {
        console.error(
          `[carni] La búsqueda de «${term}» falló en Supabase (${error.code ?? 's/n'}): ${error.message}. Se usó el seed.`
        );
      } else if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }

    if (settled === null) {
      console.warn(`[carni] Supabase no respondió en ${TIMEOUT_MS}ms; la Lupa usó el seed para «${term}».`);
    }
  } catch (error) {
    console.warn('[carni] Supabase inalcanzable; la Lupa usó el seed.', error);
  } finally {
    window.clearTimeout(timeoutId);
  }

  return searchSeed(term);
}

/* ---------------------------------------------------------------- estilos */
/* El contenido hace scroll ADENTRO del popin: el panel ocupa la ventana entera,
   asi que sin esto una busqueda con muchos resultados se desbordaria por abajo
   sin forma de alcanzarla. */
/* La franja de arriba: wordmark centrado y la x en su esquina. En la referencia
   la x vive aqui, lejos del campo — no pegada al boton de limpiar, donde se
   confunden dos circulos identicos. */
/* Pildora centrada, como la referencia. Antes era una linea inferior de ancho
   completo y llevaba un icono de lupa adentro; ese icono era la SEGUNDA lupa
   que se veia en pantalla. Fuera. */
/* Texto plano, no pildora. En la referencia las tendencias son enlaces y el
   hover las subraya — se comprobo en el video, con el cursor sobre "bolsas". */
/* Las recientes SI son pildoras: llevan su propia x para borrarse, y sin
   carcasa esa x quedaria flotando junto al texto sin decir a quien pertenece.
   Como extiende Chip, hay que devolverle lo que Chip acaba de perder. */
/* Etiqueta pequena a la izquierda, sin filete. En la referencia el gris es de
   la BANDA de la rejilla, no de la etiqueta, y sangra de borde a borde. */
/* SEIS columnas, y bajando por escalones.
   `minmax(0, 1fr)` no es opcional: con `auto`, un nombre largo ensancha su
   pista y desarma la rejilla entera. */
/* Vertical: foto arriba, texto debajo. Era horizontal con una miniatura de
   56px, que es una lista de resultados, no una vitrina. */
/* `contain`, no `cover`: la foto se ve entera sobre su fondo, sin recortarle el
   corte al cliente. El gris con aire es lo que le da la vitrina. */
/* Dos lineas, no una. "Filete de Pollo Empanizado" cortado en la primera es
   media palabra; el `min-height` mantiene los precios alineados en la fila
   aunque un nombre ocupe una linea y su vecino dos. */
/* ------------------------------------------------------------- componente */

/**
 * Binds the static search triggers of each page (`#searchBtn` en index y
 * products, el enlace `.header-search` de accessweb) al mismo popin.
 */
function bindTriggers(open: () => void): () => void {
  const searchBtn = document.getElementById('searchBtn');
  const accessLink = document.querySelector<HTMLAnchorElement>('.header-search');

  const onClick = (event: Event): void => {
    event.preventDefault();
    open();
  };

  searchBtn?.addEventListener('click', onClick);
  accessLink?.addEventListener('click', onClick);

  return () => {
    searchBtn?.removeEventListener('click', onClick);
    accessLink?.removeEventListener('click', onClick);
  };
}

/**
 * Resultado "Lo nuevo": recientes del seed (id desc), o primera mitad de una
 * búsqueda en vivo. "Cortes destacados": promocionados, o segunda mitad.
 */
function splitResults(term: string, live: Product[]): { fresh: Product[]; featured: Product[] } {
  if (live.length > 0) {
    const middle = Math.ceil(live.length / 2);
    return { fresh: live.slice(0, middle), featured: live.slice(middle) };
  }

  const byIdDesc = [...SEED_PRODUCTS].sort((a, b) => Number(b.id) - Number(a.id));
  return {
    fresh: byIdDesc.slice(0, 6),
    featured: SEED_PRODUCTS.filter((p) => p.is_promoted || p.badge).slice(0, 6)
  };
}

export function Lupa({ onPickProduct }: LupaProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(() => new URLSearchParams(window.location.search).has('search'));
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
  const triggerRef = useRef<HTMLElement | null>(null);

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

  const popinRef = useRef<HTMLDivElement>(null);

  /**
   * El foco pertenece al dialogo mientras esta abierto, y VUELVE al cerrarse.
   *
   * El comentario que habia aqui prometia exactamente esto y el codigo no lo
   * hacia: `triggerRef` se guardaba al abrir y no se leia en ningun sitio del
   * archivo. Quien navega con teclado abria la busqueda, la cerraba con Escape
   * y aparecia al principio de la pagina, sin ninguna relacion con el boton que
   * habia pulsado.
   *
   * El ciclado de Tab es la otra mitad. Sin el, `aria-modal="true"` seria una
   * etiqueta falsa: el atributo promete que no hay nada mas que alcanzar, y con
   * dos tabulaciones se salia al encabezado de la pagina que hay detras.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const focusables = (): HTMLElement[] =>
      Array.from(
        popinRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const lista = focusables();
      if (lista.length === 0) {
        return;
      }

      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const actual = document.activeElement;

      if (event.shiftKey && actual === primero) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && actual === ultimo) {
        event.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      /* Al cerrar, el foco vuelve de donde vino. Si el popin se abrio por
         deep-link (?search) no hubo disparador y no hay a donde volver: se deja
         en paz en vez de mandarlo a un sitio arbitrario. */
      triggerRef.current?.focus();
    };
  }, [open]);

  /* Un solo binding por montaje: los triggers estáticos viven en el HTML. */
  useEffect(() => {
    const openLupa = (): void => {
      triggerRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };

    const unbind = bindTriggers(openLupa);

    /* Los enlaces antiguos (?search=true) siguen abriendo el popin. */
    if (new URLSearchParams(window.location.search).has('search')) {
      setOpen(true);
    }

    return unbind;
  }, []);

  /* aria-expanded en el botón estático, sin tocar el HTML. */
  useEffect(() => {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.setAttribute('aria-expanded', String(open));
      searchBtn.setAttribute('aria-controls', 'lupa-popin');
    }
  }, [open]);

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

  const handlePick = useCallback(
    (product: Product) => {
      const value = term.trim();
      if (value.length >= MIN_TERM_LENGTH) {
        setRecientes(rememberTerm(value));
      }
      setOpen(false);
      onPickProduct(product);
    },
    [term, onPickProduct]
  );

  return (
    <>
      <Backdrop $open={open} aria-hidden="true" onClick={() => setOpen(false)} />
      {/*
        Dialogo, no landmark de busqueda.
        --------------------------------
        El fondo oscuro cubre la ventana entera y atrapa el puntero, asi que
        para quien ve la pantalla esto YA se comportaba como un modal. Lo que
        faltaba era decirlo: con `role="search"` un lector de pantalla lo
        anunciaba como una region mas de la pagina y nadie avisaba de que el
        resto habia quedado detras de un telon. Era modal para el raton y no
        modal para el teclado — la peor de las dos combinaciones.

        El `role="search"` no se pierde: baja al formulario, que es su sitio.
      */}
      <Popin
        $open={open}
        id="lupa-popin"
        ref={popinRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lupa-titulo"
      >
        <Inner>
          <Encabezado>
            <Wordmark id="lupa-titulo">Carnicería</Wordmark>
            <CerrarEsquina aria-label="Cerrar la búsqueda" onClick={() => setOpen(false)} type="button">
              ✕
            </CerrarEsquina>
          </Encabezado>

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

          {query.length >= MIN_TERM_LENGTH && searching && fresh.length === 0 && featured.length === 0 ? (
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
                        {formatPrice(product.price_per_kg)} <small>{priceUnit(product)}</small>
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
                        {formatPrice(product.price_per_kg)} <small>{priceUnit(product)}</small>
                      </ResultPrice>
                    </ResultInfo>
                  </ResultCard>
                ))}
              </ResultsGrid>
            </section>
          ) : null}

          {query.length >= MIN_TERM_LENGTH && !searching && fresh.length === 0 && featured.length === 0 ? (
            <EmptyState>Sin resultados para «{query}». Prueba con otro corte.</EmptyState>
          ) : null}
          </div>
        </Inner>
      </Popin>
    </>
  );
}