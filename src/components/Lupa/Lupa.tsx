import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../../js/modules/supabase.js';
import { SEED_PRODUCTS } from '@src/data/seedProducts';
import type { Product } from '@src/types/database';

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

/** Columnas mínimas para un resultado: nada de stock ni metadata interna. */
const RESULT_SELECT =
  'id, name, description, price_per_kg, price_per_lb, image_url, is_promoted, badge, categories(id, name, slug)';

const TENDENCIAS = ['arrachera', 'rib eye', 'pollo', 'promos'] as const;

const PALABRAS_ROTATIVAS = ['un corte', 'una promoción'] as const;

const RECIENTES_KEY = 'carni_busquedas_v1';
const MAX_RECIENTES = 5;
const DEBOUNCE_MS = 250;
const TIMEOUT_MS = 1500;
const CICLO_PLACEHOLDER_MS = 4000;
const MIN_TERM_LENGTH = 2;

/* ------------------------------------------------------------------ helpers */

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
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
      const { data } = settled as { data: Product[] | null };
      if (Array.isArray(data) && data.length > 0) {
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

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 1020;
  background: rgba(5, 5, 5, 0.45);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition: opacity 0.28s ease, visibility 0s linear ${({ $open }) => ($open ? '0s' : '0.28s')};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

const Popin = styled.div<{ $open: boolean }>`
  position: fixed;
  top: var(--carni-header-h, 84px);
  left: 0;
  right: 0;
  z-index: 1030;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 3px solid ${({ theme }) => theme.colors.carniRed};
  border-radius: 0 0 ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadowXl};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transform: ${({ $open }) => ($open ? 'translateY(0)' : 'translateY(-12px)')};
  transition: opacity 0.28s ease, transform 0.28s ease, visibility 0s linear ${({ $open }) => ($open ? '0s' : '0.28s')};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 1.5rem;
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(54, 52, 50, 0.12);
`;

const SearchIcon = styled.svg`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.carniBrown};
  opacity: 0.65;
`;

const SearchInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.carniBrown};
  padding: 0.25rem 0;
  ::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    opacity: 1;
  }
`;

const GhostButton = styled.button`
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(54, 52, 50, 0.07);
  color: ${({ theme }) => theme.colors.carniBrown};
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitionFast}, background ${({ theme }) => theme.transitionFast};

  &:hover {
    transform: rotate(90deg);
    background: rgba(54, 52, 50, 0.14);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.carniRed};
    outline-offset: 2px;
  }
`;

const ChipRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.9rem 0 0.1rem;
`;

const RowLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.carniGold};
  margin-right: 0.25rem;
`;

const Chip = styled.button`
  border: 1px solid rgba(54, 52, 50, 0.18);
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.carniBrown};
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitionFast}, color ${({ theme }) => theme.transitionFast},
    border-color ${({ theme }) => theme.transitionFast};

  &:hover {
    background: ${({ theme }) => theme.colors.carniRed};
    border-color: ${({ theme }) => theme.colors.carniRed};
    color: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.carniRed};
    outline-offset: 2px;
  }
`;

const RecentChip = styled(Chip)`
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  i {
    font-style: normal;
    opacity: 0.55;
    font-size: 0.7rem;
  }
`;

const SectionHeader = styled.h3`
  margin: 1.25rem 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.carniBrown};

  &::after {
    content: '';
    flex: 1 1 auto;
    height: 1px;
    background: rgba(54, 52, 50, 0.12);
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
`;

const ResultCard = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  padding: 0.6rem;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitionFast}, border-color ${({ theme }) => theme.transitionFast};

  &:hover {
    background: rgba(54, 52, 50, 0.04);
    border-color: rgba(54, 52, 50, 0.12);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.carniRed};
    outline-offset: 2px;
  }
`;

const ResultThumb = styled.img`
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
`;

const ResultInfo = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const ResultName = styled.strong`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.carniBrown};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ResultMeta = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ResultPrice = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.carniBrown};
  white-space: nowrap;

  small {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const EmptyState = styled.p`
  margin: 1rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  font-style: italic;
`;

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
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
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
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchProducts(query).then((found) => {
        setResults(found);
        setSearching(false);
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [term]);

  /* Cerrar con Escape y devolver el foco al disparador. */
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus();

    return () => document.removeEventListener('keydown', onKeyDown);
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
      <Popin $open={open} id="lupa-popin" role="search" aria-label="Búsqueda de productos">
        <Inner>
          <SearchForm onSubmit={handleSubmit}>
            <SearchIcon
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </SearchIcon>
            <SearchInput
              aria-label="Buscar un corte o una promoción"
              autoComplete="off"
              onChange={(event) => setTerm(event.target.value)}
              placeholder={`Búsqueda de ${PALABRAS_ROTATIVAS[palabraIndex]}`}
              ref={inputRef}
              spellCheck={false}
              type="search"
              value={term}
            />
            {term ? (
              <GhostButton aria-label="Limpiar la búsqueda" onClick={() => setTerm('')} type="button">
                ×
              </GhostButton>
            ) : null}
            <GhostButton aria-label="Cerrar la búsqueda" onClick={() => setOpen(false)} type="button">
              ✕
            </GhostButton>
          </SearchForm>

          <ChipRow aria-label="Búsquedas de tendencia">
            <RowLabel>Tendencias</RowLabel>
            {TENDENCIAS.map((tendencia) => (
              <Chip key={tendencia} onClick={() => runTerm(tendencia)} type="button">
                {tendencia}
              </Chip>
            ))}
          </ChipRow>

          {recientes.length > 0 ? (
            <ChipRow aria-label="Búsquedas recientes">
              <RowLabel>Recientes</RowLabel>
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
            </ChipRow>
          ) : null}

          {query.length >= MIN_TERM_LENGTH && searching && fresh.length === 0 && featured.length === 0 ? (
            <EmptyState>Buscando «{query}»…</EmptyState>
          ) : null}

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
                      <ResultMeta>{categoryName(product)}</ResultMeta>
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
                      <ResultMeta>{categoryName(product)}</ResultMeta>
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
        </Inner>
      </Popin>
    </>
  );
}