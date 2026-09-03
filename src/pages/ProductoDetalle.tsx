import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById } from '../../js/modules/supabase.js';
import { esCortePremium } from '../../js/modules/core/premium-cuts.js';
import { cotizar } from '../../js/modules/core/quote.js';
import { useSupabaseQuery } from '@src/hooks/useSupabaseQuery';
import { useUnidadInteligente } from '@src/hooks/useUnidadInteligente';
import { claveDeVariante } from '@src/lib/lineaPedido';
import { assetUrl } from '@src/entry/shared';
import type { Product } from '@src/types/database';

type Modo = 'weight' | 'pieces' | 'price';

const LLAVE_PEDIDO = 'carni_cart_v1';

/**
 * Per-piece weight in kilos, at the reference thickness.
 *
 * `products` is exactly twelve columns and none of them is a piece weight
 * (P-19), so this reads `metadata`, which the admin panel will fill. Until it
 * has a value the piece mode is not offered at all — inventing a number means a
 * customer ordering "3 rib eye" and getting a weight nobody measured, billed at
 * a price nobody agreed to.
 */
function pesoPorPieza(p: Product): number | null {
  const meta = (p as unknown as { metadata?: Record<string, unknown> }).metadata;
  const v = meta?.peso_por_pieza_kg;
  return typeof v === 'number' && v > 0 ? v : null;
}

function grosorPorDefecto(p: Product): number {
  const meta = (p as unknown as { metadata?: Record<string, unknown> }).metadata;
  const v = meta?.grosor_pulgadas;
  return typeof v === 'number' && v > 0 ? v : 1.25;
}

export function ProductoDetalle(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  const { datos: producto, isLoading, error, reintentar } = useSupabaseQuery<Product>(
    () => {
      if (!id) return Promise.reject(new Error('La dirección no trae el producto.'));
      return getProductById(id) as Promise<Product>;
    },
    [id]
  );

  const [modo, setModo] = useState<Modo>('weight');
  const peso = useUnidadInteligente('1', 'kg');
  const [piezas, setPiezas] = useState<string>('1');
  const [presupuesto, setPresupuesto] = useState<string>('200');
  const [grosor, setGrosor] = useState<number>(1.25);
  const [observaciones, setObservaciones] = useState<string>('');
  const [agregado, setAgregado] = useState<boolean>(false);

  const esPremium = producto ? esCortePremium(producto) : false;
  const pesoPieza = producto ? pesoPorPieza(producto) : null;

  const cotizacion = useMemo(() => {
    if (!producto) return null;
    return cotizar({
      modo,
      precioPorKg: producto.price_per_kg,
      basePeso: pesoPieza ?? undefined,
      grosor: esPremium ? grosor : undefined,
      pesoKg: peso.kilos,
      piezas: Number(piezas),
      presupuesto: Number(presupuesto),
      minimoKg: (producto as unknown as { min_quantity_kg?: number }).min_quantity_kg
    });
  }, [producto, modo, peso.kilos, piezas, presupuesto, grosor, esPremium, pesoPieza]);

  function agregarAlPedido(): void {
    if (!producto || !cotizacion) return;

    const linea = {
      id: producto.id,
      name: producto.name,
      price: producto.price_per_kg,
      img: producto.image_url ?? '/img/products/res.webp',
      tipo: 'kg',
      categoria: (producto as unknown as { categories?: { slug?: string } }).categories?.slug ?? '',
      orderMode: modo,
      grosor: esPremium ? grosor : undefined,
      basePeso: pesoPieza ?? undefined,
      requestedWeightKg: modo === 'weight' ? peso.kilos : undefined,
      requestedPieces: modo === 'pieces' ? Number(piezas) : undefined,
      requestedBudget: modo === 'price' ? Number(presupuesto) : undefined,
      observaciones: observaciones.trim() || undefined,
      peso: cotizacion.pesoTotalKg,
      piezas: modo === 'pieces' ? Number(piezas) : 0,
      variante: claveDeVariante({
        productId: producto.id,
        orderMode: modo,
        grosorIn: esPremium ? grosor : null,
        observaciones
      })
    };

    let actual: Array<Record<string, unknown>> = [];
    try {
      const crudo = window.localStorage.getItem(LLAVE_PEDIDO);
      const leido: unknown = crudo ? JSON.parse(crudo) : [];
      actual = Array.isArray(leido) ? (leido as Array<Record<string, unknown>>) : [];
    } catch {
      // A corrupt cart is discarded, never allowed to break the page. The
      // customer loses nothing they could have used anyway.
      actual = [];
    }

    // Same variant → the weights add up instead of listing the cut twice.
    const yaEsta = actual.findIndex((l) => l.variante === linea.variante);
    if (yaEsta >= 0) {
      const previo = actual[yaEsta];
      actual[yaEsta] = {
        ...previo,
        ...linea,
        peso: Number(previo.peso ?? 0) + cotizacion.pesoTotalKg,
        piezas: Number(previo.piezas ?? 0) + (modo === 'pieces' ? Number(piezas) : 0)
      };
    } else {
      actual.push(linea);
    }

    window.localStorage.setItem(LLAVE_PEDIDO, JSON.stringify(actual));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: actual.length } }));
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 4000);
  }

  if (isLoading) {
    return (
      <section className="ficha" aria-busy="true">
        <div className="ficha__esqueleto ficha__esqueleto--foto" />
        <div className="ficha__esqueleto ficha__esqueleto--titulo" />
        <div className="ficha__esqueleto ficha__esqueleto--linea" />
        <span className="visually-hidden">Cargando el corte…</span>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ficha ficha--aviso" role="alert">
        <h2 className="ficha__titulo">No pudimos cargar este corte</h2>
        <p className="ficha__nota">{error.message}</p>
        <button className="ficha__boton" type="button" onClick={reintentar}>Reintentar</button>
        <Link className="ficha__volver" to="/">Volver al catálogo</Link>
      </section>
    );
  }

  if (!producto) {
    return (
      <section className="ficha ficha--aviso">
        <h2 className="ficha__titulo">Ese corte ya no está en el mostrador</h2>
        <Link className="ficha__volver" to="/">Ver todo el catálogo</Link>
      </section>
    );
  }

  const modos: Array<{ clave: Modo; etiqueta: string }> = [
    { clave: 'weight', etiqueta: 'Por peso' },
    { clave: 'price', etiqueta: 'Por precio' }
  ];
  if (pesoPieza !== null) modos.push({ clave: 'pieces', etiqueta: 'Por pieza' });

  return (
    <section className="ficha">
      <Link className="ficha__volver" to="/">← Todo el catálogo</Link>

      <div className="ficha__lienzo">
        <img
          className="ficha__foto"
          src={assetUrl(producto.image_url ?? '/img/products/res.webp')}
          alt={producto.name}
          width={1000}
          height={1000}
        />
      </div>

      <div className="ficha__cuerpo">
        <p className="ficha__marca">Carnicería El Señor de La Misericordia</p>
        <h1 className="ficha__titulo">{producto.name}</h1>

        <p className="ficha__precio">
          ${producto.price_per_kg}
          <span className="ficha__unidad"> / kg</span>
          {producto.price_per_lb ? (
            <span className="ficha__libra">${producto.price_per_lb} / lb</span>
          ) : null}
        </p>

        {producto.description ? <p className="ficha__nota">{producto.description}</p> : null}

        <h2 className="ficha__pregunta">¿Cómo lo quieres?</h2>

        <div className="ficha__modos" role="tablist" aria-label="Forma de compra">
          {modos.map((m) => (
            <button
              key={m.clave}
              className={`ficha__modo ${modo === m.clave ? 'ficha__modo--activo' : ''}`}
              type="button"
              role="tab"
              aria-selected={modo === m.clave}
              onClick={() => setModo(m.clave)}
            >
              {m.etiqueta}
            </button>
          ))}
        </div>

        <div className="ficha__campos">
          {modo === 'weight' ? (
            <label className="ficha__campo">
              <span className="ficha__etiqueta">Cantidad</span>
              <span className="ficha__fila">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={peso.cantidad}
                  onChange={(e) => peso.alCambiarCantidad(e.target.value)}
                  aria-label="Cantidad"
                />
                <select
                  value={peso.unidad}
                  onChange={(e) => peso.alCambiarUnidad(e.target.value as 'kg' | 'g' | 'lb')}
                  aria-label="Unidad"
                >
                  <option value="kg">kilos</option>
                  <option value="g">gramos</option>
                  <option value="lb">libras</option>
                </select>
              </span>
              {/* The conversion never happens in silence: it says what it did so
                  the customer can check it against what they meant. */}
              {peso.aviso ? (
                <span className="ficha__conversion" role="status">{peso.aviso}</span>
              ) : null}
            </label>
          ) : null}

          {modo === 'price' ? (
            <label className="ficha__campo">
              <span className="ficha__etiqueta">¿De cuánto?</span>
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
            <label className="ficha__campo">
              <span className="ficha__etiqueta">¿Cuántas piezas?</span>
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

          {esPremium ? (
            <label className="ficha__campo">
              <span className="ficha__etiqueta">Grosor del corte · {grosor.toFixed(2)}"</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.25"
                value={grosor}
                onChange={(e) => setGrosor(Number(e.target.value))}
                aria-label="Grosor en pulgadas"
              />
              <span className="ficha__escala"><span>0.5"</span><span>3"</span></span>
            </label>
          ) : null}

          {/* Free text from the customer. It travels with the line, reaches the
              admin panel and gets printed on the order — without it the counter
              does not know what to cut. */}
          <label className="ficha__campo">
            <span className="ficha__etiqueta">Observaciones para el carnicero</span>
            <textarea
              rows={2}
              maxLength={240}
              placeholder="Sin tanta grasa, en bisteces delgados, para asar…"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              aria-label="Observaciones"
            />
          </label>
        </div>

        {pesoPieza === null ? (
          <p className="ficha__nota ficha__nota--aviso">
            Este corte todavía no se puede pedir por pieza: falta registrar cuánto pesa cada una.
          </p>
        ) : null}

        <div className="ficha__resumen">
          <div className="ficha__resumen-linea">
            <span>Subtotal</span>
            <strong>${cotizacion?.total.toFixed(2) ?? '0.00'}</strong>
          </div>
          {cotizacion && cotizacion.pesoTotalKg > 0 ? (
            <p className="ficha__resumen-detalle">
              {producto.name} · aproximadamente {cotizacion.pesoTotalKg} kg
              {esPremium ? ` · ${grosor.toFixed(2)}"` : ''}
              {modo === 'pieces' ? ` · ${piezas} piezas` : ''}
              {cotizacion.bajoMinimo ? ' · ajustado al mínimo de venta' : ''}
            </p>
          ) : null}
        </div>

        <button className="ficha__boton" type="button" onClick={agregarAlPedido}>
          Agregar al pedido
        </button>

        {agregado ? (
          <p className="ficha__confirmacion" role="status">
            Listo, va en tu pedido. Puedes revisarlo en el carrito.
          </p>
        ) : null}

        <p className="ficha__nota ficha__nota--tenue">
          El total definitivo lo calcula el servidor con el precio del día.
        </p>
      </div>
    </section>
  );
}

export default ProductoDetalle;
