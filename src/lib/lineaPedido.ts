/**
 * What makes two order lines "the same one".
 *
 * This is a business rule, not a technical detail, so it lives in one function:
 * changing the policy means editing this file, not rewriting the cart.
 *
 * The rule, and the reasoning behind each part:
 *
 * - **Product** — obvious.
 * - **Thickness** — two Rib Eye at different thicknesses are two physically
 *   different cuts. The butcher makes different cuts. They cannot merge.
 * - **Notes** — "sin tanta grasa" and "con más grasa" are two different
 *   instructions to the counter. Merging them loses one of them.
 * - **Whether it was ordered by piece** — and this is the subtle one. Weight and
 *   budget both mean "give me this much meat": 1.5 kg of Rib Eye and $500 of Rib
 *   Eye that resolves to 1.5 kg are the same meat, so they merge into one line
 *   rather than showing the customer two identical rows. But "3 rib eye" is a
 *   promise about *count*, not weight — and as Eduardo put it, "3 rib eye" read
 *   as kilos or as pesos is a different order entirely. Merging it into kilos
 *   throws away the number the customer actually asked for.
 *
 * What is deliberately NOT part of the key: **the display unit**. "1000 g" and
 * "1 kg" are the same weight. Splitting on the unit would show two identical Rib
 * Eye rows and have the butcher cut the same thing twice. The unit is how the
 * number was typed, not what the customer takes home.
 */
export interface DatosDeVariante {
  productId: number | string;
  orderMode: 'weight' | 'pieces' | 'price';
  grosorIn?: number | null;
  observaciones?: string | null;
}

export function claveDeVariante(linea: DatosDeVariante): string {
  // Budget and weight collapse to the same bucket; pieces keep their own.
  const porPieza = linea.orderMode === 'pieces' ? 'pza' : 'peso';
  // Thickness only distinguishes lines when the cut actually has one.
  const grosor = typeof linea.grosorIn === 'number' ? linea.grosorIn.toFixed(2) : '-';
  // Notes are compared on their meaning, not their whitespace or casing.
  const notas = (linea.observaciones ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  return `${linea.productId}|${porPieza}|${grosor}|${notas}`;
}

/** True when the two lines should be merged into one instead of listed twice. */
export function esLaMismaLinea(a: DatosDeVariante, b: DatosDeVariante): boolean {
  return claveDeVariante(a) === claveDeVariante(b);
}
