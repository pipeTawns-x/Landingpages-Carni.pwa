import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProducts } from '../../../js/modules/supabase.js';
import { useSupabaseQuery } from '@src/hooks/useSupabaseQuery';
import { assetUrl } from '@src/entry/shared';
import type { Product } from '@src/types/database';

const LLAVE_RECIENTES = 'carni_busquedas_v1';
const MAX_RECIENTES = 5;
const RETARDO_MS = 250;

/** Terms customers actually type, kept short so the row never wraps. */
const TENDENCIAS = ['arrachera', 'rib eye', 'pollo', 'chorizo', 'ofertas'];

function leerRecientes(): string[] {
  try {
    const raw = window.localStorage.getItem(LLAVE_RECIENTES);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as string[]).slice(0, MAX_RECIENTES) : [];
  } catch {
    return [];
  }
}

function guardarReciente(termino: string): void {
  const limpio = termino.trim();
  if (limpio.length < 2) return;
  try {
    const previas = leerRecientes().filter((t) => t.toLowerCase() !== limpio.toLowerCase());
    window.localStorage.setItem(
      LLAVE_RECIENTES,
      JSON.stringify([limpio, ...previas].slice(0, MAX_RECIENTES))
    );
  } catch {
    /* Private browsing refuses to write. A lost history is not worth an error. */
  }
}

export interface LupaProps {
  /** Where a result goes. Differs per page: the catalogue routes, the rest link out. */
  irAlProducto: (id: number | string) => void;
}

/**
 * The search panel — a full overlay, not a jump to another page.
 *
 * `js/modules/ui/search.js:20` sent the customer to `products.html?search=true`
 * the moment they touched the magnifier. Tapping search on the landing page
 * threw them out of it before they had typed a letter.
 *
 * The shape is borrowed from how Louis Vuitton does it: the field on top,
 * trending terms as plain words underneath, and curated rows below that — so an
 * empty search is still worth opening. Two rows here, and the difference between
 * them is the point:
 *
 *   "Lo más pedido"           the shop's own numbers decide
 *   "Recomendado por la tienda"  a person decides
 *
 * Today both read from the catalogue. Wiring the first to real order counts and
 * the second to an admin flag is dashboard work, and it is written down as
 * pending rather than faked here.
 */
export function Lupa({ irAlProducto }: LupaProps): JSX.Element | null {
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [recientes, setRecientes] = useState<string[]>([]);
  const campo = useRef<HTMLInputElement>(null);
  const disparador = useRef<Element | null>(null);

  const { datos, isLoading } = useSupabaseQuery<Product[]>(
    () => getProducts({ limit: 60 }) as Promise<Product[]>,
    []
  );

  const catalogo = useMemo(() => datos ?? [], [datos]);

  const abrir = useCallback(() => {
    disparador.current = document.activeElement;
    setRecientes(leerRecientes());
    setAbierta(true);
    // Two magnifiers on screen at once is one too many. The header keeps its
    // own, and while the panel is open the page's is redundant — the field is
    // already focused and waiting.
    document.body.classList.add('lupa-abierta');
  }, []);

  const cerrar = useCallback(() => {
    document.body.classList.remove('lupa-abierta');
    setAbierta(false);
    setTexto('');
    setConsulta('');
    // Focus goes back where it came from. Dropping it on <body> leaves a
    // keyboard user at the top of the document with no idea what happened.
    (disparador.current as HTMLElement | null)?.focus?.();
  }, []);

  // The magnifier lives in the static HTML header on all three pages, so it is
  // bound by id rather than through a prop.
  useEffect(() => {
    const botones = [
      document.getElementById('searchBtn'),
      ...Array.from(document.querySelectorAll('.header-search'))
    ].filter(Boolean) as HTMLElement[];

    const alClic = (e: Event): void => {
      e.preventDefault();
      abrir();
    };

    botones.forEach((b) => b.addEventListener('click', alClic));
    return () => botones.forEach((b) => b.removeEventListener('click', alClic));
  }, [abrir]);

  useEffect(() => {
    if (!abierta) return;
    campo.current?.focus();
    const alTeclado = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') cerrar();
    };
    document.addEventListener('keydown', alTeclado);
    return () => document.removeEventListener('keydown', alTeclado);
  }, [abierta, cerrar]);

  /**
   * Waits for a pause before searching.
   *
   * Filtering on every keystroke re-renders the grid five times for a
   * five-letter word, and on a phone that reads as the list flickering under the
   * thumb.
   */
  useEffect(() => {
    const t = window.setTimeout(() => setConsulta(texto), RETARDO_MS);
    return () => window.clearTimeout(t);
  }, [texto]);

  const resultados = useMemo(() => {
    const q = consulta.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalogo
      .filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
      .slice(0, 12);
  }, [consulta, catalogo]);

  const masPedido = useMemo(() => catalogo.slice(0, 6), [catalogo]);
  const recomendado = useMemo(() => catalogo.slice(6, 12), [catalogo]);

  if (!abierta) return null;

  const elegir = (p: Product): void => {
    guardarReciente(p.name);
    cerrar();
    irAlProducto(p.id);
  };

  const fila = (titulo: string, nota: string, items: Product[]): JSX.Element | null =>
    items.length === 0 ? null : (
      <section className="lupa__seccion">
        <h2 className="lupa__titulo">
          {titulo} <span className="lupa__nota">{nota}</span>
        </h2>
        <div className="lupa__carril">
          {items.map((p) => (
            <button className="lupa__card" key={p.id} type="button" onClick={() => elegir(p)}>
              <img
                className="lupa__foto"
                src={assetUrl(p.image_url ?? '/img/products/res.webp')}
                alt=""
                loading="lazy"
                width={300}
                height={375}
              />
              <span className="lupa__nombre">{p.name}</span>
              <span className="lupa__precio">${p.price_per_kg} / kg</span>
            </button>
          ))}
        </div>
      </section>
    );

  return (
    <div className="lupa" role="dialog" aria-modal="true" aria-label="Buscar productos">
      <div className="lupa__barra">
        <label className="lupa__campo">
          <span className="visually-hidden">Buscar cortes y productos</span>
          <input
            ref={campo}
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar cortes y productos…"
            autoComplete="off"
          />
        </label>
        <button className="lupa__cerrar" type="button" onClick={cerrar} aria-label="Cerrar la búsqueda">
          ×
        </button>
      </div>

      <div className="lupa__cuerpo">
        {consulta.trim().length >= 2 ? (
          resultados.length > 0 ? (
            fila('Resultados', `${resultados.length}`, resultados)
          ) : (
            <p className="lupa__vacio">
              No encontramos «{consulta}». Prueba con el nombre del corte.
            </p>
          )
        ) : (
          <>
            {recientes.length > 0 ? (
              <section className="lupa__seccion">
                <h2 className="lupa__titulo">Tus búsquedas</h2>
                <div className="lupa__terminos">
                  {recientes.map((t) => (
                    <button className="lupa__termino" key={t} type="button" onClick={() => setTexto(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="lupa__seccion">
              <h2 className="lupa__titulo">Búsquedas frecuentes</h2>
              <div className="lupa__terminos">
                {TENDENCIAS.map((t) => (
                  <button className="lupa__termino" key={t} type="button" onClick={() => setTexto(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </section>

            {isLoading ? (
              <div className="lupa__carril" aria-busy="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <div className="lupa__esqueleto" key={i} />
                ))}
              </div>
            ) : (
              <>
                {fila('Lo más pedido', 'lo dicen las ventas', masPedido)}
                {fila('Recomendado por la tienda', 'lo elige el mostrador', recomendado)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Lupa;
