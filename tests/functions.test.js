/**
 * Los 16 tests que pide el enunciado: cuatro por funcion.
 *
 * De los cuatro, TRES son casos borde. Eso no es casualidad del profesor: el
 * bug casi nunca esta en el caso normal —ese lo probaste a mano al escribirlo—
 * sino en el arreglo vacio, el negativo, el cero y el divisor que es cero.
 */
import { sumArray, countWords, findMax, isDivisible } from '../functions.js';

describe('sumArray', () => {
  test('suma un arreglo de numeros positivos', () => {
    expect(sumArray([1, 2, 3, 4])).toBe(10);
  });

  test('suma un arreglo de numeros negativos', () => {
    expect(sumArray([-1, -2, -3])).toBe(-6);
  });

  test('un arreglo vacio devuelve 0', () => {
    expect(sumArray([])).toBe(0);
  });

  test('el cero no altera la suma', () => {
    expect(sumArray([5, 0, 5])).toBe(10);
  });
});

describe('countWords', () => {
  test('cuenta las palabras de una frase normal', () => {
    expect(countWords('Hola mundo esto es una prueba')).toBe(6);
  });

  test('ignora los espacios del principio y del final', () => {
    expect(countWords('   Hola mundo   ')).toBe(2);
  });

  test('una cadena vacia devuelve 0', () => {
    expect(countWords('')).toBe(0);
  });

  test('varios espacios seguidos cuentan como uno', () => {
    expect(countWords('Hola     mundo')).toBe(2);
  });
});

describe('findMax', () => {
  test('encuentra el mayor entre positivos', () => {
    expect(findMax([5, 2, 9, 3])).toBe(9);
  });

  test('encuentra el mayor entre negativos', () => {
    expect(findMax([-5, -2, -9])).toBe(-2);
  });

  test('un arreglo vacio devuelve null', () => {
    /* null y no 0: con [-5,-2,-9] el maximo es negativo, asi que un 0 seria
       indistinguible de un resultado real. */
    expect(findMax([])).toBeNull();
  });

  test('si todos son iguales devuelve ese numero', () => {
    expect(findMax([7, 7, 7])).toBe(7);
  });
});

describe('isDivisible', () => {
  test('10 entre 2 es divisible', () => {
    expect(isDivisible(10, 2)).toBe(true);
  });

  test('10 entre 3 no es divisible', () => {
    expect(isDivisible(10, 3)).toBe(false);
  });

  test('dividir entre cero devuelve el mensaje, no un error', () => {
    expect(isDivisible(10, 0)).toBe('No se puede dividir entre cero');
  });

  test('funciona con numeros negativos', () => {
    expect(isDivisible(-10, 2)).toBe(true);
  });
});
