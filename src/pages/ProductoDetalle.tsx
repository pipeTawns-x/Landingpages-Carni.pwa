import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById } from '../../js/modules/supabase.js';
import { esCortePremium } from '../../js/modules/core/premium-cuts.js';
import { cotizar, aKilogramos } from '../../js/modules/core/quote.js';
import { useSupabaseQuery } from '@src/hooks/useSupabaseQuery';
import { assetUrl } from '@src/entry/shared';
import type { Product } from '@src/types/database';

type Modo = 'weight' | 'pieces' | 'price';
type UnidadPeso = 'kg' | 'g' | 'lb';

/**
 * Per-piece weight, in kilos, at the reference thickness.
 *
 * The database has no column for this — `products` is exactly twelve columns and
 * none of them is a piece weight (P-19). Until the admin panel can fill
 * `products.metadata`, the piece mode is offered only where that key exists.
 * Inventing a number here would mean a customer ordering "3 rib eye" and getting
 * a weight nobody measured, billed at a price nobody agreed to.
 */
function pesoPorPieza(producto: Product): number | null {
  const meta = (producto as unknown as { metadata?: Record<string, unknown> }).metadata;
  const valor = meta?.peso_por_pieza_kg;
  return typeof valor === 'number' && valor > 0 ? valor : null;
}

/** Default thickness in inches, editable per product from the admin panel (P-36). */
function grosorPorDefecto(producto: Product): number | null {
  const meta = (producto as unknown as { metadata?: Record<string, unknown> }).metadata;
  const valor = meta?.grosor_pulgadas;
  return typeof valor === 'number' && valor > 0 ? valor : null;
}

export function ProductoDetalle(): JSX.Element {
  // The id comes from the URL, not from props — this page is reachable by link
  // and by a pasted address alike.
  const { id } = useParams<{ id: string }>();

  const { datos: producto, isLoading, error, reintentar } = useSupabaseQuery<Product>(
    () => {
      // `useParams` types every segment as possibly undefined, because a route
      // can be reached without it. An empty id is a broken link, not a fetch.
      if (!id) {
        return Promise.reject(new Error('La dirección no trae el producto.'));
      }
      return getProductById(id) as Promise<Product>;
    },
    [id]
  );

  const [modo, setModo] = useState<Modo>('weight');
  const [peso, setPeso] = useState<string>('1');
  const [unidad, setUnidad] = useState<UnidadPeso>('kg');
  const [piezas, setPiezas] = useState<string>('1');
  const [presupuesto, setPresupuesto] = useState<string>('200');
  const [grosor, setGrosor] = useState<number>(1.25);

  const esPremium = producto ? esCortePremium(producto) : false;
  const pesoPieza = producto ? pesoPorPieza(producto) : null;

  const cotizacion = useMemo(() => {
    if (!producto) return null;
    return cotizar({
      modo,
      precioPorKg: producto.price_per_kg,
      basePeso: pesoPieza ?? undefined,
      grosor: esPremium ? grosor : undefined,
      pesoKg: aKilogramos(Number(peso), unidad),
      piezas: Number(piezas),
      presupuesto: Number(presupuesto),
      minimoKg: (producto as unknown as { min_quantity_kg?: number }).min_quantity_kg
    });
  }, [producto, modo, peso, unidad, piezas, presupuesto, grosor, esPremium, pesoPieza]);

  // Three states, three screens. A spinner is not a screen: the skeleton keeps
  // the layout from jumping when the real content lands.
  if (isLoading) {
    return (
      <section className="detalle" aria-busy="true">
        <div className="detalle__esqueleto detalle__esqueleto--foto" />
        <div className="detalle__esqueleto detalle__esqueleto--titulo" />
        <div className="detalle__esqueleto detalle__esqueleto--linea" />
        <span className="visually-hidden">Cargando el producto…</span>
      </section>
    );
  }

  if (error) {
    return (
      <section className="detalle detalle--error" role="alert">
        <h2 className="detalle__titulo">No pudimos cargar este corte</h2>
        <p className="detalle__nota">{error.message}</p>
        <button className="detalle__accion" type="button" onClick={reintentar}>
          Reintentar
        </button>
        <Link className="detalle__volver" to="/">Volver al catálogo</Link>
      </section>
    );
  }

  if (!producto) {
    return (
      <section className="detalle detalle--vacio">
        <h2 className="detalle__titulo">Ese corte ya no está en el mostrador</h2>
        <Link className="detalle__volver" to="/">Ver todo el catálogo</Link>
      </section>
    );
  }

  // Only the modes this product can actually honour. A product that cannot be
  // sold by the piece says so by not offering it — that is honest information,
  // not a hole.
  const modos: Array<{ clave: Modo; etiqueta: string }> = [
    { clave: 'weight', etiqueta: 'Por peso' },
    { clave: 'price', etiqueta: 'Por precio' }
  ];
  if (pesoPieza !== null) {
    modos.push({ clave: 'pieces', etiqueta: 'Por pieza' });
  }

  const imagen = assetUrl(producto.image_url ?? '/img/products/res.webp');

  return (
    <section className="detalle">
      <Link className="detalle__volver" to="/">← Todo el catálogo</Link>

      <img className="detalle__foto" src={imagen} alt={producto.name} width={800} height={600} />

      <h1 className="detalle__titulo">{producto.name}</h1>
      <p className="detalle__precio">
        ${producto.price_per_kg} <span className="detalle__unidad">/ kg</span>
      </p>
      {producto.description ? <p className="detalle__nota">{producto.description}</p> : null}

      <h2 className="detalle__pregunta">¿Cómo lo quieres?</h2>

      <div className="detalle__modos" role="tablist" aria-label="Forma de compra">
        {modos.map((m) => (
          <button
            key={m.clave}
            className={`detalle__modo ${modo === m.clave ? 'detalle__modo--activo' : ''}`}
            type="button"
            role="tab"
            aria-selected={modo === m.clave}
            onClick={() => setModo(m.clave)}
          >
            {m.etiqueta}
          </button>
        ))}
      </div>

      <div className="detalle__entrada">
        {modo === 'weight' ? (
          <label className="detalle__campo">
            <span>Cantidad</span>
            <span className="detalle__fila">
              <input
                type="number"
                min="0"
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                aria-label="Cantidad de producto"
              />
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value as UnidadPeso)}
                aria-label="Unidad de peso"
              >
                <option value="kg">kilos</option>
                <option value="g">gramos</option>
                <option value="lb">libras</option>
              </select>
            </span>
          </label>
        ) : null}

        {modo === 'price' ? (
          <label className="detalle__campo">
            <span>¿De cuánto?</span>
            <input
              type="number"
              min="0"
              step="10"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              aria-label="Presupuesto en pesos"
            />
          </label>
        ) : null}

        {modo === 'pieces' ? (
          <label className="detalle__campo">
            <span>¿Cuántas piezas?</span>
            <input
              type="number"
              min="1"
              step="1"
              value={piezas}
              onChange={(e) => setPiezas(e.target.value)}
              aria-label="Número de piezas"
            />
          </label>
        ) : null}

        {/* Thickness is not a fourth tab: it is an input inside the mode, and
            only for cuts that are actually cut to thickness. */}
        {esPremium ? (
          <label className="detalle__campo">
            <span>Grosor: {grosor.toFixed(2)}"</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.25"
              value={grosor}
              onChange={(e) => setGrosor(Number(e.target.value))}
              aria-label="Grosor del corte en pulgadas"
            />
          </label>
        ) : null}
      </div>

      {pesoPieza === null ? (
        <p className="detalle__nota detalle__nota--aviso">
          Este producto todavía no se puede pedir por pieza: falta registrar
          cuánto pesa cada una.
        </p>
      ) : null}

      <div className="detalle__resumen">
        <span>Subtotal</span>
        <strong>${cotizacion?.total.toFixed(2) ?? '0.00'}</strong>
      </div>
      {cotizacion && cotizacion.pesoTotalKg > 0 ? (
        <p className="detalle__nota">
          Aproximadamente {cotizacion.pesoTotalKg} kg
          {modo !== 'pieces' && pesoPieza !== null
            ? ` · unas ${cotizacion.piezasEstimadas} piezas`
            : ''}
          {cotizacion.bajoMinimo ? ' · ajustado al mínimo de venta' : ''}
        </p>
      ) : null}

      <p className="detalle__nota detalle__nota--tenue">
        El total definitivo lo calcula el servidor con el precio del día.
      </p>
    </section>
  );
}

export default ProductoDetalle;
