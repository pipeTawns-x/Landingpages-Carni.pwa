import { IconoReloj } from '@src/ui/iconos';

export function Horario(): JSX.Element {
  return (
    <section className="px-4 pt-14 lg:px-8 lg:pt-[120px]">
      <div className="flex flex-col rounded-[24px] border border-border bg-surface-1 px-5 pb-1.5 pt-5 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:rounded-[28px] lg:px-12 lg:py-11">
        <span className="flex items-center gap-3.5 pb-3.5 lg:gap-5 lg:pb-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-border bg-surface-2 text-sand lg:h-[60px] lg:w-[60px]">
            <IconoReloj size={20} className="lg:hidden" />
            <IconoReloj size={28} className="hidden lg:block" />
          </span>
          <h2 className="m-0 font-display text-[26px] font-[460] leading-8 lg:text-[40px] lg:leading-[46px]">
            Horario de atención
          </h2>
        </span>

        <span className="flex min-h-[60px] items-center justify-between gap-3 border-t border-border text-base lg:min-h-0 lg:flex-col lg:items-start lg:gap-1.5 lg:border-l lg:border-t-0 lg:pl-8">
          <span className="text-base lg:text-base lg:leading-[22px] lg:text-text-muted">Lunes a sábado</span>
          <span className="text-xl font-semibold leading-[26px] tabular-nums lg:text-[36px] lg:leading-[42px]">
            8:00 – 17:00
          </span>
        </span>

        <span className="flex min-h-[60px] items-center justify-between gap-3 border-t border-border text-base lg:min-h-0 lg:flex-col lg:items-start lg:gap-1.5 lg:border-l lg:border-t-0 lg:pl-8">
          <span className="text-base lg:text-base lg:leading-[22px] lg:text-text-muted">Domingos y festivos</span>
          <span className="text-xl font-semibold leading-[26px] text-text-muted lg:text-[36px] lg:leading-[42px]">
            Cerrado
          </span>
        </span>
      </div>
    </section>
  );
}
