/**
 * El set de íconos de la landing.
 *
 * Un solo trazo (1.8) para todo el set, tomado literalmente de los SVG del
 * diseño en Claude Design (Encabezado.dc.html, Tarjeta.dc.html, Pie.dc.html y
 * Landing.dc.html). No son íconos de una librería: son los mismos `<path>`
 * que aprobó Eduardo, para que el trazo sea idéntico en cada instancia.
 *
 * `currentColor` en todos: el color lo decide quien los usa con una clase de
 * texto de Tailwind, no el ícono.
 */

export interface IconoProps {
  className?: string;
  size?: number;
}

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function IconoMenu({ className, size = 22 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo} strokeLinejoin={undefined}>
      <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
    </svg>
  );
}

export function IconoBuscar({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo} strokeLinejoin={undefined}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

export function IconoCarrito({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <path d="M6 7h12l-1.2 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8Z" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
    </svg>
  );
}

/** Flecha larga hacia la derecha: "Ver el catálogo completo", tiles del bento. */
export function IconoFlecha({ className, size = 18 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Chevron de acordeón. Rota 180° vía className cuando la pregunta está abierta. */
export function IconoChevron({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconoUbicacion({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconoReloj({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  );
}

export function IconoTelefono({ className, size = 22 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <path d="M21 16.4v2.8a1.9 1.9 0 0 1-2 1.9 18.7 18.7 0 0 1-8.2-2.9 18.4 18.4 0 0 1-5.7-5.7A18.7 18.7 0 0 1 2.2 4.2 1.9 1.9 0 0 1 4.1 2.1h2.8a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.9 9.6a15 15 0 0 0 5.7 5.7l1.2-1.2a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.6 2Z" />
    </svg>
  );
}

export function IconoCorreo({ className, size = 22 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function IconoFacebook({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <path d="M16 3.5h-2.5A4 4 0 0 0 9.5 7.5V10H7v3.5h2.5v7h3.5v-7h2.6l.6-3.5H13V7.8c0-.6.4-.8 1-.8h2Z" />
    </svg>
  );
}

export function IconoInstagram({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17.2 6.8h.01" />
    </svg>
  );
}

/** Trazo relleno: es el glifo de marca, no un ícono de línea. */
export function IconoWhatsapp({ className, size = 20 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/** Dos barras: pausar el video de la portada. Cuando el video corre, se usa este; al pausarlo, IconoPlay. */
export function IconoPausa({ className, size = 16 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function IconoPlay({ className, size = 16 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M7 5.5v13l11-6.5z" />
    </svg>
  );
}

/** Burbuja del asistente. */
export function IconoAsistente({ className, size = 18 }: IconoProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
      <path d="M20 12a8 8 0 1 0-3.2 6.4L20 19.5l-1-3.2A8 8 0 0 0 20 12Z" />
    </svg>
  );
}

/**
 * Una estrella, rellena de 0 a 1.
 *
 * Dos SVG apilados: el de abajo siempre gris (la estrella vacía), el de
 * arriba dorado y recortado por `overflow:hidden` al ancho que corresponde a
 * `relleno`. Así una estrella puede quedar a 70% llena sin inventar un
 * glifo intermedio — es el mismo truco del diseño.
 */
export function Estrella({ relleno, className }: { relleno: number; className?: string }): JSX.Element {
  const ancho = `${Math.max(0, Math.min(1, relleno)) * 100}%`;
  const trazoEstrella = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z';

  return (
    <span className={`relative block ${className ?? 'h-[18px] w-[18px] lg:h-[22px] lg:w-[22px]'}`}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full">
        <path d={trazoEstrella} fill="#3F3F46" />
      </svg>
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: ancho }}>
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] lg:h-[22px] lg:w-[22px]">
          <path d={trazoEstrella} fill="#F59E0B" />
        </svg>
      </span>
    </span>
  );
}
