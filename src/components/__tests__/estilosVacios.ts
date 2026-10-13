/**
 * Lo que Jest ve cuando un componente importa un archivo de estilos.
 *
 * Por qué hace falta: los `.css` de producción se los carga Vite, que los
 * inyecta en la página. Jest no tiene a nadie que los cargue, así que un
 * `import './Hoja.css'` cae en su resolutor, no encuentra transformador para
 * esa extensión y revienta el módulo entero —con un error que habla de
 * sintaxis, no de estilos, y apunta a la línea del import como si el problema
 * fuera el componente.
 *
 * La respuesta es un objeto vacío: en las pruebas no hay nada que pintar, y
 * ninguna de ellas lee clases ni comprueba CSS —lo que se comprueba es el
 * comportamiento—. En Vite y en el navegador el archivo sigue siendo el de
 * verdad; esto solo desactiva la carga para el runner.
 *
 * Va emparejado con `moduleNameMapper` en `jest.config.js`: sin el mapper, este
 * archivo no se llega a usar.
 */
export default {};
