import type { ComponentType } from 'react';
import type { ProductoVista } from '@src/data/catalogo';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import { assetUrl } from './assetUrl';
import { ICONO_POR_CATEGORIA, IconoOtros, IconoSiguiente } from './iconos';
import { unidadDe, type Presentacion } from './presentacionProducto';

export type VarianteTarjeta = 'normal' | 'oferta' | 'chica';

export interface TarjetaProps {
  producto: ProductoVista;
  /** La calcula quien pinta la lista, con `elegirPresentacion` sobre la lista visible. */
  presentacion: Presentacion;
  /** "Agotado" no es una variante: se deriva de `!producto.disponible`. */
  variante?: VarianteTarjeta;
  /** Por defecto, la ficha del producto en las páginas viejas. */
  enlace?: string;
  /** True en la primera fila: la imagen carga de inmediato y con prioridad. */
  prioridad?: boolean;
}

type IconoCategoria = ComponentType<{ className?: string; tamano?: number }>;

function iconoDe(slug: string): IconoCategoria {
  return ICONO_POR_CATEGORIA[slug] ?? IconoOtros;
}

/**
 * Precio por kilo tal como viene de la base: sin centavos si es entero y con
 * ellos si no, para no redondear nunca un precio real.
 */
export function precioPorKg(valor: number): string {
  return formatearPrecio(valor, Number.isInteger(valor) ? 'tarjeta' : 'ticket');
}

/** Precio por libra de su columna, con centavos. Nunca se calcula desde el kilo. */
export function precioPorLb(valor: number): string {
  return formatearPrecio(valor, 'ticket');
}

/** La ficha del producto: donde se elige peso o pieza y se agrega de verdad. */
export function enlaceDeFicha(id: number): string {
  return `products.html#/producto/${id}`;
}

/**
 * React 18 no conoce `fetchPriority` y avisa en consola; el atributo en
 * minúsculas sí llega al navegador tal cual.
 */
const PRIORIDAD_ALTA: Record<string, string> = { fetchpriority: 'high' };

const BOTON_AGREGAR =
  'inline-flex h-11 w-full touch-manipulation items-center justify-center rounded-pill bg-red text-ui font-medium text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-[0.97] motion-reduce:transition-none';

function IconoMas(): JSX.Element {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * La tarjeta de producto: la única pieza con borde y fondo del sitio, junto con
 * las celdas del mostrador. Se usa igual en la landing, el catálogo y el asistente.
 *
 * "Agregar" lleva a la ficha, que es donde se configura el peso o la pieza y de
 * donde sale el único alta real en el pedido. Esta tarjeta no agrega por su
 * cuenta ni inventa cantidades: muestra lo que la base dice.
 */
export function Tarjeta({
  producto,
  presentacion,
  variante = 'normal',
  enlace,
  prioridad = false
}: TarjetaProps): JSX.Element {
  const { id, nombre, precioKg, precioLb, foto, categoria } = producto;
  const href = enlace ?? enlaceDeFicha(id);
  const agotado = !producto.disponible;
  const unidad = unidadDe(nombre);
  const Icono = iconoDe(categoria.slug);
  /** Sin foto propia o con presentación tipográfica no hay imagen: va el ícono. */
  const srcFoto = presentacion !== 'tipografica' && foto ? assetUrl(foto) : null;

  if (variante === 'chica') {
    return (
      <article
        data-tarjeta
        data-producto-id={id}
        data-presentacion={presentacion}
        className="flex items-center gap-3 rounded-card border border-border bg-surface-1 p-2"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-control bg-surface-2">
          {srcFoto ? (
            <img
              src={srcFoto}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className={`size-full object-cover ${agotado ? 'saturate-60' : ''}`}
            />
          ) : (
            <span aria-hidden="true" className="grid size-full place-items-center text-sand">
              <Icono tamano={24} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-sans text-ui font-medium">{nombre}</h3>
          <p className="text-meta text-text-muted tabular-nums">
            <span data-precio-kg={precioKg}>{precioPorKg(precioKg)}</span> / {unidad}
          </p>
        </div>

        {agotado ? (
          <span className="shrink-0 px-2 text-meta text-red-text">Agotado</span>
        ) : (
          <a
            href={href}
            aria-label={`Agregar ${nombre}`}
            className="grid size-11 shrink-0 touch-manipulation place-items-center rounded-full bg-red text-white transition-[background-color,scale] duration-150 ease-out-strong hover:bg-red-hover active:scale-95 motion-reduce:transition-none"
          >
            <IconoMas />
          </a>
        )}
      </article>
    );
  }

  return (
    <article
      data-tarjeta
      data-producto-id={id}
      data-presentacion={presentacion}
      className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface-1 transition-[translate,border-color] duration-150 ease-out-strong hover:-translate-y-0.5 hover:border-red/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* La cabeza crece si la fila es más alta que ella: todas las tarjetas de una fila miden lo mismo. */}
      <div className="relative aspect-[4/5] shrink-0 grow overflow-hidden bg-surface-2">
        {srcFoto ? (
          <img
            src={srcFoto}
            alt={nombre}
            width={400}
            height={500}
            loading={prioridad ? 'eager' : 'lazy'}
            {...(prioridad ? PRIORIDAD_ALTA : {})}
            decoding="async"
            className={`absolute inset-0 size-full object-cover ${agotado ? 'saturate-60' : ''}`}
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 grid place-items-center text-sand">
            <Icono tamano={48} />
          </div>
        )}

        {presentacion === 'ilustrativa' ? (
          <span className="absolute bottom-2 left-2 rounded-control bg-surface-2/90 px-2 py-1 text-meta text-text">
            Foto ilustrativa
          </span>
        ) : null}

        {variante === 'oferta' ? (
          <span className="absolute top-2 right-2 rounded-control bg-gold px-2 py-1 text-meta font-medium text-bg">
            Oferta
          </span>
        ) : null}
      </div>

      <div className="flex flex-col p-3 lg:p-4">
        <p className="text-meta text-sand">{categoria.nombre}</p>
        <h3 className="mt-1 font-display text-titulo">{nombre}</h3>

        <p className="mt-2 text-ui font-semibold tabular-nums">
          <span data-precio-kg={precioKg}>{precioPorKg(precioKg)}</span>{' '}
          <span className="font-normal text-text-muted">/ {unidad}</span>
        </p>
        {unidad === 'kg' && precioLb !== null ? (
          <p className="text-meta text-text-muted tabular-nums">{precioPorLb(precioLb)} / lb</p>
        ) : null}

        <div className="mt-3">
          {agotado ? (
            <button
              type="button"
              disabled
              className="h-11 w-full cursor-not-allowed rounded-pill bg-surface-2 text-ui font-medium text-red-text"
            >
              Agotado
            </button>
          ) : (
            <a href={href} aria-label={`Agregar ${nombre}`} className={BOTON_AGREGAR}>
              Agregar
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- mostrador */

export interface CeldaBentoProps {
  nombre: string;
  descripcion: string;
  /** `catalogo.html#categoria=<slug>` */
  href: string;
  slug: string;
  /** Foto de la celda; sin ella, la celda es tipográfica con el ícono de la categoría. */
  foto?: string;
  posicion?: string;
  /** La celda grande del mostrador: ocupa todo el ancho en móvil y 2×2 en escritorio. */
  grande?: boolean;
}

/**
 * Una celda del mostrador de categorías. Vive junto a la Tarjeta porque es la
 * otra pieza del sitio con borde y fondo: todo lo demás va en filas con hairline.
 *
 * Sin degradados encima de la foto: el nombre va debajo, sobre el fondo de la
 * celda, así se lee igual con cualquier foto.
 */
export function CeldaBento({
  nombre,
  descripcion,
  href,
  slug,
  foto,
  posicion,
  grande = false
}: CeldaBentoProps): JSX.Element {
  const Icono = iconoDe(slug);

  return (
    <a
      href={href}
      data-celda={slug}
      className={`group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface-1 transition-[border-color] duration-150 ease-out-strong hover:border-sand/50 ${
        grande ? 'col-span-2 lg:col-span-2 lg:row-span-2' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden bg-surface-2 ${
          grande ? 'aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1' : 'aspect-[4/3]'
        }`}
      >
        {foto ? (
          <img
            src={assetUrl(foto)}
            alt=""
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: posicion }}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-sand">
            <Icono tamano={48} />
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 p-3 lg:p-4">
        <div className="min-w-0">
          <h3 className="font-display text-titulo">{nombre}</h3>
          <p className="mt-1 text-meta text-text-muted">{descripcion}</p>
        </div>
        <IconoSiguiente
          tamano={18}
          className="mt-1 shrink-0 text-text-muted transition-colors duration-150 ease-out-strong group-hover:text-sand"
        />
      </div>
    </a>
  );
}
