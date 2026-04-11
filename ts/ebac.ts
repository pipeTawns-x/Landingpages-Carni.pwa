/**
 * Práctica EBAC: Calcular edad a partir de fecha de nacimiento
 * 
 * Ejercicio real para el proyecto Carni-mvp
 * Recibe una fecha en formato YYYY-MM-DD y devuelve la edad en años
 * 
 * @param fechaNac - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns Edad en años como número
 * 
 * Ejemplos:
 *   calcularEdad("1990-05-15") // 35 (si hoy es 2026-04-11)
 *   calcularEdad("2010-01-01") // 16
 *   calcularEdad("invalid")    // NaN
 */

export function calcularEdad(fechaNac: string): number {
  const fecha = new Date(fechaNac);
  
  if (isNaN(fecha.getTime())) {
    return NaN;
  }
  
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNac = fecha.getMonth();
  const diaActual = hoy.getDate();
  const diaNac = fecha.getDate();
  
  if (mesActual < mesNac || (mesActual === mesNac && diaActual < diaNac)) {
    edad--;
  }
  
  return edad;
}

export function esMayorDeEdad(fechaNac: string, edadMinima: number = 18): boolean {
  const edad = calcularEdad(fechaNac);
  return !isNaN(edad) && edad >= edadMinima;
}

export function getFechaMinimaNacimiento(edadMinima: number = 18): string {
  const hoy = new Date();
  const anioMaximo = hoy.getFullYear() - edadMinima;
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anioMaximo}-${mes}-${dia}`;
}

export function runEbacDemo(): void {
  const testCases = ['1990-05-15', '2008-01-01', '2015-06-20', 'invalid'];
  
  console.log('\n=== Práctica EBAC: Calcular Edad ===\n');
  
  testCases.forEach(fecha => {
    const edad = calcularEdad(fecha);
    console.log(`  Fecha: ${fecha} -> Edad: ${isNaN(edad) ? 'INVÁLIDA' : edad} años`);
  });
  
  console.log(`\n  Fecha mínima para mayor de edad: ${getFechaMinimaNacimiento()}`);
  console.log('\n');
}