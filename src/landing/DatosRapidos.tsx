import { DATOS_RAPIDOS } from './datos';

/** La franja de tres datos justo debajo del hero: mínimo, recoger, horario. */
export function DatosRapidos(): JSX.Element {
  return (
    <div className="mx-4 mt-6 border-t border-border lg:mx-8 lg:mt-10 lg:border-b">
      <div className="lg:grid lg:grid-cols-3">
        {DATOS_RAPIDOS.map((dato, indice) => (
          <div
            key={dato.etiqueta}
            className={`flex flex-col gap-0.5 border-b border-border py-3 lg:gap-1 lg:border-b-0 lg:py-5 lg:px-6 ${
              indice > 0 ? 'lg:border-l' : ''
            }`}
          >
            <span className="text-sm text-text-muted lg:text-[14px]">{dato.etiqueta}</span>
            <span className="text-base font-semibold leading-[22px] tabular-nums lg:text-xl lg:leading-[26px]">
              {dato.valor}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
