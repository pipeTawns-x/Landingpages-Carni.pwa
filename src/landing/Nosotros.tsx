import { DIRECCION_LINEA1, DIRECCION_LINEA2, MAPA_HREF } from './datos';
import { IconoUbicacion } from '@src/ui/iconos';

/**
 * "Sobre nosotros" + ubicación. El recuadro punteado "Foto del mostrador con
 * la familia · por tomar" se deja tal cual el diseño: es un pendiente real,
 * no un marcador que haya que resolver aquí.
 */
export function Nosotros(): JSX.Element {
  return (
    <section id="sobre-nosotros" className="px-4 pt-14 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pt-[120px]">
      <div className="flex h-[240px] items-center justify-center rounded-[24px] border border-dashed border-border bg-surface-1 px-6 text-center text-sm leading-5 text-text-muted lg:h-[560px] lg:rounded-[28px] lg:px-0">
        Foto del mostrador con la familia · por tomar
      </div>

      <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:gap-4.5">
        <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">Sobre nosotros</span>
        <h2 className="m-0 text-balance font-display text-[30px] font-[460] leading-9 lg:text-[48px] lg:leading-[54px]">
          Carnicería de familia, pieza por pieza
        </h2>
        <p className="m-0 text-pretty text-base leading-[25px] text-text-muted lg:max-w-[48ch] lg:text-lg lg:leading-[29px]">
          Somos El Señor de La Misericordia, una carnicería familiar de la colonia Manuel J. Othón. Seleccionamos
          pieza por pieza, todos los días, y la cortamos como la pides.
        </p>
        <p className="m-0 text-pretty text-base leading-[25px] text-text-muted lg:max-w-[48ch] lg:text-lg lg:leading-[29px]">
          Quien vuelve, vuelve por la atención de los dueños, porque sabemos de dónde viene cada corte y por precios
          justos.
        </p>

        <div className="mt-1 flex flex-col gap-3.5 rounded-[20px] border border-border bg-surface-1 p-5 lg:mt-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:rounded-[24px] lg:p-6">
          <span className="flex items-center gap-3.5 lg:gap-[18px]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-border bg-surface-2 text-sand lg:h-[52px] lg:w-[52px]">
              <IconoUbicacion size={20} />
            </span>
            <span className="flex flex-col gap-0.5 lg:hidden">
              <span className="font-display text-[22px] font-[460] leading-[26px]">Ubicación</span>
            </span>
            <span className="hidden flex-col gap-0.5 lg:flex">
              <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-text-muted">Ubicación</span>
              <span className="text-lg font-semibold leading-[26px]">{DIRECCION_LINEA1}</span>
              <span className="text-[15px] leading-[22px] text-text-muted">{DIRECCION_LINEA2}</span>
            </span>
          </span>
          <span className="flex flex-col gap-0.5 lg:hidden">
            <span className="text-base leading-[23px]">{DIRECCION_LINEA1}</span>
            <span className="text-[15px] leading-[22px] text-text-muted">{DIRECCION_LINEA2}</span>
          </span>
          <a
            href={MAPA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill border border-sand px-[22px] text-[15px] font-semibold tabular-nums text-text no-underline hover:border-text"
          >
            Cómo llegar
          </a>
        </div>
      </div>
    </section>
  );
}
