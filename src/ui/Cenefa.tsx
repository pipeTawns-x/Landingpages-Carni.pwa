import { useId } from 'react';

/** Side of one tile in the SVG's own units. */
const LADO = 48;
/** The band is this many tiles wide and centred, so it fills any screen up to ~100x its height. */
const BALDOSAS = 100;

export interface CenefaProps {
  /**
   * The class sets the height, and the tile scales with it (`h-7 lg:h-10`):
   * the viewBox is as tall as one tile, so band height and tile size are the
   * same thing.
   */
  className?: string;
}

/**
 * A band of talavera tiles: cobalt ground, a sand diamond with an eight-point
 * star inside, a marigold centre and a pink dot where four tiles meet.
 *
 * It is the one piece of Mexican ornament the site repeats (hero edge, offers,
 * footer), so it is drawn once, from the design tokens, and never edited per
 * page. Purely decorative: hidden from assistive technology.
 *
 * Every instance builds its own pattern id. Two bands on one page that shared an
 * id would break as soon as the first one stopped rendering (a hidden section,
 * a sheet closing): the second would point at a pattern that no longer exists.
 */
export function Cenefa({ className = 'h-8' }: CenefaProps): JSX.Element {
  const id = `cenefa-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const mitad = LADO / 2;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="presentation"
      viewBox={`0 0 ${LADO * BALDOSAS} ${LADO}`}
      preserveAspectRatio="xMidYMid slice"
      className={`block w-full ${className}`}
    >
      <defs>
        <pattern id={id} width={LADO} height={LADO} patternUnits="userSpaceOnUse">
          <rect width={LADO} height={LADO} className="fill-talavera" />
          <path
            d={`M${mitad} 2 ${LADO - 2} ${mitad} ${mitad} ${LADO - 2} 2 ${mitad}Z`}
            className="fill-none stroke-sand"
            strokeWidth={1.5}
          />
          <rect x={16} y={16} width={16} height={16} className="fill-none stroke-sand" strokeWidth={1.25} />
          <rect
            x={16}
            y={16}
            width={16}
            height={16}
            transform={`rotate(45 ${mitad} ${mitad})`}
            className="fill-none stroke-sand"
            strokeWidth={1.25}
          />
          <circle cx={mitad} cy={mitad} r={3} className="fill-gold" />
          {/* Four quarter circles, one per corner: next to its neighbours they close into whole dots. */}
          <circle cx={0} cy={0} r={3.5} className="fill-rosa" />
          <circle cx={LADO} cy={0} r={3.5} className="fill-rosa" />
          <circle cx={0} cy={LADO} r={3.5} className="fill-rosa" />
          <circle cx={LADO} cy={LADO} r={3.5} className="fill-rosa" />
        </pattern>
      </defs>
      <rect data-cenefa-franja width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
