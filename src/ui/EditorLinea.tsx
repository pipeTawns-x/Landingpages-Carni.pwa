import { useId, useState } from 'react';
import { ErrorCotizacion, type CotizacionEstimada, type ModoVenta, type UnidadPeso } from '@src/lib/cotizarLinea';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import {
  cantidadDeLinea,
  estimarSolicitud,
  etiquetaUnidad,
  normalizarCantidad,
  productoCotizable,
  solicitudInicial
} from '@src/lib/solicitudLinea';
import type { OrderLine, SolicitudLinea } from '@src/types/database';

export interface EditorLineaProps {
  linea: OrderLine;
  /** Called with the request (contract D7) and the estimated quantity every time the amount is valid. */
  alGuardar: (solicitud: SolicitudLinea, cantidad: number) => void;
}

interface Borrador {
  modo: ModoVenta;
  monto: string;
  unidad: UnidadPeso;
  nota: string;
}

type Resultado =
  | { tipo: 'vacio' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'ok'; solicitud: SolicitudLinea; cantidad: number; cotizacion: CotizacionEstimada };

const MODOS: ReadonlyArray<{ clave: ModoVenta; etiqueta: string }> = [
  { clave: 'money', etiqueta: 'Por dinero' },
  { clave: 'weight', etiqueta: 'Por peso' },
  { clave: 'pieces', etiqueta: 'Por piezas' }
];

const UNIDADES: readonly UnidadPeso[] = ['kg', 'g', 'lb'];

const CAMPO =
  'h-12 w-full rounded-control border bg-surface-1 px-3 text-ui text-text placeholder:text-text-muted';

function mensajeDeError(error: ErrorCotizacion, modo: ModoVenta): string {
  if (error.codigo === 'sale_mode_not_allowed') {
    return 'Este producto no se vende de esa forma.';
  }
  return modo === 'pieces'
    ? 'Las piezas son un número entero, mayor que cero.'
    : 'Escribe una cantidad mayor que cero.';
}

/** Turns what the person typed into the request and its estimate. Pure: saving is the caller's job. */
function evaluar(linea: OrderLine, borrador: Borrador): Resultado {
  const monto = normalizarCantidad(borrador.monto);
  if (monto === '') {
    return { tipo: 'vacio' };
  }

  const solicitud: SolicitudLinea = {
    product_id: linea.productId,
    mode: borrador.modo,
    amount: monto,
    unit: borrador.modo === 'weight' ? borrador.unidad : null,
    thickness_in: null,
    note: borrador.nota.trim() === '' ? null : borrador.nota.trim()
  };

  try {
    const cotizacion = estimarSolicitud(linea, solicitud);
    return { tipo: 'ok', solicitud, cantidad: cantidadDeLinea(linea, cotizacion), cotizacion };
  } catch (error) {
    if (error instanceof ErrorCotizacion) {
      return { tipo: 'error', mensaje: mensajeDeError(error, borrador.modo) };
    }
    throw error;
  }
}

/**
 * How the customer wants a line: by money, by weight (kg, g or lb) or by pieces.
 *
 * Only the ways the product can really be sold are offered: a cap or a package is
 * only ever sold by piece. Every figure is an ESTIMATE (the word is on screen) and
 * the server recalculates it when the order is created.
 *
 * It saves as the person types, but only when the amount is valid: an empty field
 * waits quietly, a half-typed "1," is read as 1, and an invalid amount says why
 * (`role="alert"`) and leaves the last good request in the cart.
 */
export function EditorLinea({ linea, alGuardar }: EditorLineaProps): JSX.Element {
  const id = useId();
  const permitidos = productoCotizable(linea).sale_modes;
  const inicial = solicitudInicial(linea);

  const [borrador, setBorrador] = useState<Borrador>(() => ({
    modo: permitidos.includes(inicial.mode) ? inicial.mode : permitidos[0],
    monto: inicial.amount,
    unidad: inicial.unit ?? 'kg',
    nota: inicial.note ?? ''
  }));

  const resultado = evaluar(linea, borrador);

  const aplicar = (siguiente: Borrador): void => {
    setBorrador(siguiente);
    const evaluado = evaluar(linea, siguiente);
    if (evaluado.tipo === 'ok') {
      alGuardar(evaluado.solicitud, evaluado.cantidad);
    }
  };

  const etiquetaMonto =
    borrador.modo === 'money' ? '¿Cuánto quieres gastar? (pesos)' : borrador.modo === 'weight' ? 'Peso' : 'Piezas';
  const errorId = `${id}-error`;
  const hayError = resultado.tipo === 'error';

  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface-2 p-4">
      <div role="radiogroup" aria-label="Cómo quieres pedirlo" className="grid auto-cols-fr grid-flow-col gap-2">
        {MODOS.filter((m) => permitidos.includes(m.clave)).map((m) => (
          <label key={m.clave} className="relative block">
            <input
              type="radio"
              name={`${id}-modo`}
              value={m.clave}
              checked={borrador.modo === m.clave}
              onChange={() => setBorrador({ ...borrador, modo: m.clave, monto: '', unidad: 'kg' })}
              className="peer sr-only"
            />
            <span className="flex min-h-11 touch-manipulation items-center justify-center rounded-control border border-border-control px-3 text-center text-ui text-text transition-[background-color,border-color] duration-150 ease-out-strong peer-checked:border-red peer-checked:bg-red peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sand">
              {m.etiqueta}
            </span>
          </label>
        ))}
      </div>

      <div className={borrador.modo === 'weight' ? 'grid grid-cols-[1fr_6rem] gap-3' : 'flex flex-col'}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-monto`} className="text-meta text-text-muted">
            {etiquetaMonto}
          </label>
          <input
            id={`${id}-monto`}
            type="text"
            inputMode={borrador.modo === 'pieces' ? 'numeric' : 'decimal'}
            autoComplete="off"
            value={borrador.monto}
            onChange={(e) => aplicar({ ...borrador, monto: e.target.value })}
            aria-invalid={hayError}
            aria-describedby={hayError ? errorId : undefined}
            className={`${CAMPO} ${hayError ? 'border-danger' : 'border-border-control'}`}
          />
        </div>

        {borrador.modo === 'weight' ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-unidad`} className="text-meta text-text-muted">
              Unidad
            </label>
            <select
              id={`${id}-unidad`}
              value={borrador.unidad}
              onChange={(e) => aplicar({ ...borrador, unidad: e.target.value as UnidadPeso })}
              className={`${CAMPO} border-border-control`}
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-nota`} className="text-meta text-text-muted">
          Nota para el mostrador (opcional)
        </label>
        <input
          id={`${id}-nota`}
          type="text"
          maxLength={120}
          autoComplete="off"
          value={borrador.nota}
          onChange={(e) => aplicar({ ...borrador, nota: e.target.value })}
          className={`${CAMPO} border-border-control`}
        />
      </div>

      {resultado.tipo === 'error' ? (
        <p id={errorId} role="alert" className="text-meta text-danger">
          {resultado.mensaje}
        </p>
      ) : null}

      {resultado.tipo === 'ok' ? (
        <p role="status" className="text-ui text-text tabular-nums">
          Estimado:{' '}
          {linea.unit === 'kg'
            ? `${resultado.cotizacion.quantity_kg} kg`
            : `${resultado.cantidad} ${etiquetaUnidad(linea.unit, resultado.cantidad)}`}{' '}
          · {formatearPrecio(Number(resultado.cotizacion.line_total_mxn), 'ticket')}
        </p>
      ) : null}
    </div>
  );
}
