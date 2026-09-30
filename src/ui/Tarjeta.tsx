export type VarianteTarjeta = 'normal' | 'agotado' | 'oferta' | 'chica';
export type UnidadTarjeta = 'kg' | 'pieza' | 'paquete';

export interface TarjetaProps {
  variante?: VarianteTarjeta;
  unidad?: UnidadTarjeta;
  foto: string;
  posicion?: string;
  categoria: string;
  nombre: string;
  descripcion?: string;
  /** Precio como string ya formateado, p.ej. "$289". */
  precio: string;
  /** Precio anterior, si aplica — tacha el actual y agrega "Antes $X / u". */
  antes?: string;
  /** Sobreescribe la línea secundaria de precio (si no, se calcula sola). */
  segunda?: string;
  /** Texto de la insignia (p. ej. "28 en stock"). Se ignora si `variante === 'agotado'`. */
  stock?: string;
  /**
   * A dónde manda el botón "Agregar".
   *
   * No es un despacho a Redux: la ficha del producto (src/pages/ProductoDetalle.tsx)
   * es donde vive la configuración real de peso/precio/pieza, y desde ahí sale
   * el único `agregarProducto` que existe en el código — el propio
   * ProductCard.tsx de la tienda tampoco agrega directo, enlaza a la ficha.
   * Esta tarjeta hace lo mismo: `enlace` es la ficha real cuando el producto
   * tiene id confirmado, o el catálogo filtrado por categoría cuando no.
   */
  enlace: string;
  /** Solo para la variante "chica": mostrar el botón "+" redondo. */
  conBoton?: boolean;
}

/**
 * Tarjeta de producto — componente compartido de Componentes en el diseño
 * (Tarjeta.dc.html), usada tal cual en "Lo que se lleva la gente" y en
 * "Ofertas".
 *
 * La regla de precio por libra es la del diseño, literal:
 * libra = precio-por-kg × 0.4536, "Sin precio por libra" en piezas,
 * "Precio por paquete, no por kilo" en paquetes.
 */
export function Tarjeta({
  variante = 'normal',
  unidad = 'kg',
  foto,
  posicion = '50% 50%',
  categoria,
  nombre,
  descripcion,
  precio,
  antes,
  segunda,
  stock,
  enlace,
  conBoton = true
}: TarjetaProps): JSX.Element {
  const agotado = variante === 'agotado';
  const esOferta = variante === 'oferta';
  const chica = variante === 'chica';

  const numero = parseFloat(precio.replace(/[^0-9.]/g, '')) || 0;
  const porLibra = `$${(numero * 0.4536).toFixed(2)} / lb`;
  const lineaSecundaria =
    segunda ??
    (antes
      ? `Antes ${antes} / ${unidad}`
      : unidad === 'kg'
        ? porLibra
        : unidad === 'pieza'
          ? 'Sin precio por libra'
          : 'Precio por paquete, no por kilo');

  const colorTexto = agotado ? 'text-text-muted' : 'text-text';
  const etiquetaAgregar = `Agregar ${nombre}`;

  if (chica) {
    return (
      <div className="box-border flex h-full items-center gap-3 rounded-card border border-border bg-surface-1 p-3 font-sans text-text [container-type:inline-size]">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          <img src={foto} alt={nombre} className="h-full w-full object-cover" style={{ objectPosition: posicion }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">{categoria}</span>
          <span className={`font-display text-base font-[440] leading-5 text-balance ${colorTexto}`}>{nombre}</span>
          <span className={`text-[15px] font-semibold leading-5 tabular-nums ${colorTexto}`}>
            {precio} <span className="text-[13px] font-normal text-text-muted">/ {unidad}</span>
          </span>
        </div>
        {conBoton ? (
          <a
            href={enlace}
            aria-label={etiquetaAgregar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-red text-xl text-white no-underline hover:bg-red-hover"
          >
            +
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface-1 font-sans text-text transition-[transform,border-color] duration-150 [container-type:inline-size] hover:-translate-y-0.5 hover:border-red/30">
      <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-surface-2">
        <img
          src={foto}
          alt={nombre}
          className="h-full w-full object-cover"
          style={{ objectPosition: posicion, filter: agotado ? 'saturate(0.6)' : undefined }}
          loading="lazy"
        />
        {!agotado && stock ? (
          <span className="absolute left-2 top-2 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium tabular-nums text-text lg:left-3 lg:top-3">
            {stock}
          </span>
        ) : null}
        {agotado ? (
          <span className="absolute left-2 top-2 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium tabular-nums text-text-muted lg:left-3 lg:top-3">
            Sin stock
          </span>
        ) : null}
      </div>
      {esOferta ? (
        <span className="absolute right-0 top-0 rounded-bl-xl bg-gold px-3 py-1.5 text-xs font-semibold text-bg">
          Oferta
        </span>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">{categoria}</span>
        <span
          className={`font-display text-[clamp(18px,calc(14px+2.6cqi),22px)] font-[440] leading-[1.25] text-balance ${colorTexto}`}
        >
          {nombre}
        </span>
        {descripcion ? <span className="text-[13px] leading-[18px] text-text-muted">{descripcion}</span> : null}
        <div className="mt-auto flex flex-col gap-0.5 pt-1">
          <div className={`flex flex-wrap items-baseline gap-1.5 tabular-nums ${colorTexto}`}>
            <span className="text-[clamp(18px,calc(13px+3cqi),22px)] font-semibold leading-[1.2]">{precio}</span>
            <span className="text-[clamp(14px,calc(11px+1.6cqi),16px)] leading-5 text-text-muted">/ {unidad}</span>
          </div>
          <span
            className="text-[clamp(13px,calc(10px+1.6cqi),15px)] leading-5 tabular-nums text-text-muted"
            style={{ textDecoration: antes ? 'line-through' : 'none' }}
          >
            {lineaSecundaria}
          </span>
        </div>
        {!agotado ? (
          <a
            href={enlace}
            aria-label={etiquetaAgregar}
            className="mt-1 flex h-11 w-full items-center justify-center rounded-pill bg-red text-center text-[15px] font-semibold leading-5 text-white no-underline transition-colors hover:bg-red-hover active:scale-[0.98]"
          >
            Agregar
          </a>
        ) : (
          <button
            disabled
            type="button"
            className="mt-1 h-11 w-full cursor-not-allowed rounded-pill border border-border bg-surface-2 text-[15px] font-semibold leading-5 text-text-muted"
          >
            Sin stock
          </button>
        )}
      </div>
    </article>
  );
}
