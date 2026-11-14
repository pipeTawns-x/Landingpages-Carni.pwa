import { NEGOCIO } from '@src/data/negocio';
import { FotoAmbiente } from '@src/ui/FotoAmbiente';
import { CARPETA_AMBIENTE, CONTENEDOR } from './datos';

/**
 * "Carnicería de familia, pieza por pieza": un bloque editorial a lo ancho, sin
 * cajas, sin fotos de relleno y sin cifras. Va sobre una franja de fondo más
 * claro que rompe el ritmo de hairlines de las secciones de alrededor.
 *
 * Detrás lleva la textura de talavera oscura, tapada por un velo de `bg` al 80 %:
 * se adivina, no compite con el texto. Si el archivo todavía no existe queda el
 * fondo liso de siempre. El texto va en `text` pleno (no atenuado) para que el
 * contraste aguante cualquier zona de la textura.
 *
 * El lema es el del Catálogo 2024 del dueño y sale de `negocio.ts`.
 */
export function Familia(): JSX.Element {
  return (
    <section id="familia" className="relative isolate overflow-hidden bg-surface-1 py-20 lg:py-32">
      <FotoAmbiente
        base={`${CARPETA_AMBIENTE}/textura-talavera-oscura`}
        anchoGrande={1344}
        alt=""
        sizes="100vw"
        width={1344}
        height={768}
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bg/80" />

      <div className={`${CONTENEDOR} lg:grid lg:grid-cols-12 lg:gap-x-12`}>
        <h2 className="text-seccion lg:col-span-5">Carnicería de familia, pieza por pieza</h2>

        <div className="mt-8 lg:col-span-7 lg:mt-0">
          <p className="max-w-[24ch] font-display text-seccion font-normal text-sand">{NEGOCIO.lema}</p>

          <div className="mt-8 flex max-w-[54ch] flex-col gap-5 text-lead text-text lg:mt-12">
            <p>
              Somos El Señor de La Misericordia, una carnicería familiar de la colonia Manuel J. Othón.
              Seleccionamos pieza por pieza, todos los días, y la cortamos como la pides.
            </p>
            <p>
              Quien vuelve, vuelve por la atención de los dueños, porque sabemos de dónde viene cada corte y por
              precios justos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
