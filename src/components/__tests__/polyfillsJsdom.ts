/**
 * Lo que jsdom no trae y las librerías que usamos sí necesitan.
 *
 * TRAMPA: el entorno jsdom de Jest arma su propio objeto global y NO le copia
 * TextEncoder ni TextDecoder, aunque Node los tenga desde la v11. Cualquier
 * navegador de verdad los expone, asi que la libreria da por hecho que estan y
 * los usa al cargarse. El sintoma es feo y despista: las tres suites mueren con
 * "ReferenceError: TextEncoder is not defined" apuntando a la LINEA DEL IMPORT
 * de react-router-dom, como si el problema fuera importar el router.
 *
 * Y lo mismo pasa con `<dialog>`: `Hoja` lo abre con `showModal()` y lo cierra
 * con `close()`, y jsdom no implementa ninguno de los dos. Sin el shim, cualquier
 * prueba que monte una Hoja —la de la Hoja, la de la búsqueda— muere con
 * "dialog.showModal is not a function" y parece un fallo de la hoja cuando lo
 * que falta es el metodo.
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

/**
 * `showModal` deja el atributo `open`, que es lo que hace visible el diálogo para
 * el lector de pantalla; `close` lo quita y dispara `close`, como el navegador.
 * Con eso, la inertia y el foco los pone el código de `Hoja`, no el shim.
 */
if (typeof HTMLDialogElement !== 'undefined') {
  const prototipo = HTMLDialogElement.prototype;

  if (typeof prototipo.showModal !== 'function') {
    prototipo.showModal = function showModal(this: HTMLDialogElement): void {
      this.setAttribute('open', '');
    };
  }

  if (typeof prototipo.close !== 'function') {
    prototipo.close = function close(this: HTMLDialogElement): void {
      if (!this.hasAttribute('open')) {
        return;
      }
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
