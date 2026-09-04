import { useCallback, useMemo, useState } from 'react';

/**
 * Keeps the quantity in the unit a person would actually say out loud.
 *
 * Eduardo's observation, and it is a real counter problem: a customer who thinks
 * in kilos wants "medio kilo" and types `0.500` in the kilos field. Nobody says
 * "zero point five kilos" — they say "half a kilo" or "five hundred grams". The
 * other direction happens too: someone types `1000` in the grams field when they
 * mean one kilo.
 *
 * So the field converts itself:
 *
 *   0.500 kg  →   500 g      a fraction of a kilo reads better as grams
 *   0.98 kg   →   980 g
 *   1000 g    →     1 kg     a thousand grams reads better as a kilo
 *   2500 g    →   2.5 kg
 *
 * **Nothing is ever silently recalculated.** The weight in kilos is identical
 * before and after — only the label the customer reads changes. And every
 * conversion announces itself, so the person can check it against what they
 * meant before confirming. A butcher shop that quietly reinterprets an order
 * loses a customer the first time it guesses wrong.
 *
 * Pounds are deliberately left out of the automatic switch: a customer who
 * chose pounds chose them on purpose, and 0.5 lb is a normal thing to ask for.
 */
export type UnidadPeso = 'kg' | 'g' | 'lb';

/** Below this many kilos, the amount reads better in grams. */
const UMBRAL_A_GRAMOS = 1;

/** At or above this many grams, the amount reads better in kilos. */
const UMBRAL_A_KILOS = 1000;

export interface UnidadInteligente {
  cantidad: string;
  unidad: UnidadPeso;
  /** The weight in kilos, whatever unit is on screen. This is what gets quoted. */
  kilos: number;
  /** Set when the last edit changed the unit, so the UI can say so. */
  aviso: string | null;
  alCambiarCantidad: (valor: string) => void;
  alCambiarUnidad: (unidad: UnidadPeso) => void;
}

/** Converts any supported unit to kilograms. The pound factor is exact. */
export function aKilos(valor: number, unidad: UnidadPeso): number {
  if (unidad === 'g') return valor / 1000;
  if (unidad === 'lb') return valor / 2.20462;
  return valor;
}

/** Trims the trailing zeros a raw division leaves behind: 2.500 → "2.5". */
function limpio(n: number): string {
  return String(Number(n.toFixed(3)));
}

export function useUnidadInteligente(
  cantidadInicial = '1',
  unidadInicial: UnidadPeso = 'kg'
): UnidadInteligente {
  const [cantidad, setCantidad] = useState<string>(cantidadInicial);
  const [unidad, setUnidad] = useState<UnidadPeso>(unidadInicial);
  const [aviso, setAviso] = useState<string | null>(null);

  const alCambiarCantidad = useCallback(
    (valor: string) => {
      const n = Number(valor);

      // While the field is empty, mid-typing ("0.", "1.5e") or not a number,
      // nothing is converted. Converting on every keystroke would fight the
      // person as they type.
      if (valor === '' || Number.isNaN(n) || n <= 0) {
        setCantidad(valor);
        setAviso(null);
        return;
      }

      if (unidad === 'kg' && n < UMBRAL_A_GRAMOS) {
        const gramos = Math.round(n * 1000);
        setCantidad(limpio(gramos));
        setUnidad('g');
        setAviso(`${valor} kg son ${gramos} g — lo cambiamos para que se lea mejor.`);
        return;
      }

      if (unidad === 'g' && n >= UMBRAL_A_KILOS) {
        const kilos = n / 1000;
        setCantidad(limpio(kilos));
        setUnidad('kg');
        setAviso(`${valor} g son ${limpio(kilos)} kg — lo cambiamos para que se lea mejor.`);
        return;
      }

      setCantidad(valor);
      setAviso(null);
    },
    [unidad]
  );

  // Changing the unit by hand converts the amount instead of reinterpreting it.
  // Without this, switching kg → g on "2" would silently turn two kilos into two
  // grams: same number on screen, a thousandth of the meat.
  const alCambiarUnidad = useCallback(
    (nueva: UnidadPeso) => {
      const n = Number(cantidad);
      if (Number.isNaN(n) || n <= 0) {
        setUnidad(nueva);
        setAviso(null);
        return;
      }

      const enKilos = aKilos(n, unidad);
      const convertido =
        nueva === 'g' ? enKilos * 1000 : nueva === 'lb' ? enKilos * 2.20462 : enKilos;

      setCantidad(limpio(convertido));
      setUnidad(nueva);
      setAviso(null);
    },
    [cantidad, unidad]
  );

  const kilos = useMemo(() => {
    const n = Number(cantidad);
    return Number.isNaN(n) || n <= 0 ? 0 : aKilos(n, unidad);
  }, [cantidad, unidad]);

  return { cantidad, unidad, kilos, aviso, alCambiarCantidad, alCambiarUnidad };
}
