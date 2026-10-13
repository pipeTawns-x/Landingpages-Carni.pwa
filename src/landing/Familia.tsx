import { NEGOCIO } from '@src/data/negocio';
import { CONTENEDOR } from './datos';

/**
 * "Carnicería de familia, pieza por pieza": un bloque editorial a lo ancho, sin
 * cajas, sin fotos de relleno y sin cifras. Va sobre una franja de fondo más
 * claro que rompe el ritmo de hairlines de las secciones de alrededor.
 *
 * El lema es el del Catálogo 2024 del dueño y sale de `negocio.ts`.
 */
export function Familia(): JSX.Element {
  return (
    <section id="familia" className="bg-surface-1 py-20 lg:py-32">
      <div className={`${CONTENEDOR} lg:grid lg:grid-cols-12 lg:gap-x-12`}>
        <h2 className="text-seccion lg:col-span-5">Carnicería de familia, pieza por pieza</h2>

        <div className="mt-8 lg:col-span-7 lg:mt-0">
          <p className="max-w-[24ch] font-display text-seccion font-normal text-sand">{NEGOCIO.lema}</p>

          <div className="mt-8 flex max-w-[54ch] flex-col gap-5 text-lead text-text-muted lg:mt-12">
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
