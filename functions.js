/**
 * Funciones del enunciado de la practica m33 (Testing con Jest).
 *
 * Vienen del Pen del profesor y se copian tal cual:
 * https://codepen.io/jos_manolo/pen/pvzbXrX
 *
 * Este archivo es DEL CURSO, no del producto. Vive en `practicas-ebac` y no
 * llega a `main` — la carniceria no suma arreglos genericos, cotiza cortes.
 * Ver docs/REGLA_ENTREGAS_Y_RAMAS.md.
 */

export function sumArray(numbers) {
  if (!Array.isArray(numbers)) return 0;
  return numbers.reduce((total, n) => total + n, 0);
}

export function countWords(text) {
  if (typeof text !== 'string') return 0;
  const limpio = text.trim();
  if (limpio === '') return 0;
  return limpio.split(/\s+/).length;
}

export function findMax(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;
  return Math.max(...numbers);
}

export function isDivisible(num, divisor) {
  if (divisor === 0) return 'No se puede dividir entre cero';
  return num % divisor === 0;
}
