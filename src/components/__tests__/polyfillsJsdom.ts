/**
 * Lo que jsdom no trae y react-router si necesita.
 *
 * TRAMPA: el entorno jsdom de Jest arma su propio objeto global y NO le copia
 * TextEncoder ni TextDecoder, aunque Node los tenga desde la v11. Cualquier
 * navegador de verdad los expone, asi que la libreria da por hecho que estan y
 * los usa al cargarse. El sintoma es feo y despista: las tres suites mueren con
 * "ReferenceError: TextEncoder is not defined" apuntando a la LINEA DEL IMPORT
 * de react-router-dom, como si el problema fuera importar el router.
 *
 * Va en `setupFiles` y no dentro del helper de render porque tiene que
 * ejecutarse ANTES del primer import: Babel sube todos los `require` al
 * principio del archivo, asi que una asignacion escrita entre dos imports
 * igualmente correria tarde.
 */
import { TextDecoder, TextEncoder } from 'node:util';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}
