import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Lupa } from './Lupa';
import { store } from '@src/redux/store';
import { Hoja } from '@src/ui/Hoja';
import type { Product } from '@src/types/database';

/** El deep-link viejo: `accessweb.html` enlaza a `products.html?search=true`. */
function llegaConBusqueda(): boolean {
  return new URLSearchParams(window.location.search).has('search');
}

/**
 * Los disparadores de las páginas viejas abren la hoja de búsqueda.
 *
 * `#searchBtn` es el botón del encabezado de `index.html` y `products.html`;
 * `.header-search` es el enlace del encabezado de `accessweb.html`. Viven en el
 * HTML estático y no se pueden cambiar sin tocar archivos que esta rebanada no
 * toca, así que se enlazan por selector, como se hizo siempre.
 *
 * Lo que cambia es quién escucha: antes el componente `Lupa` se ataba a sí mismo
 * al montarse. Ahora es un contenido y no puede saber que existe un botón
 * fuera de su árbol, así que de eso se encarga el anfitrión —esta función en
 * `index`/`accessweb`, y el mismo hook en `LupaConRuta` de `products`—.
 *
 * `aria-expanded`, `aria-controls` y `data-abre` se ponen aquí por el mismo
 * motivo: `Hoja` devuelve el foco buscando `[data-abre="buscar"]` cuando el
 * navegador no lo hace —Safari de escritorio no enfoca los botones al pulsarlos—
 * y el disparador del encabezado nuevo declara el mismo contrato
 * (`data-abre`, `aria-controls`, `aria-haspopup`, `aria-expanded`). Esos dos
 * atributos están admitidos también en el rol `link`, así que el enlace de
 * `accessweb.html` puede llevar lo mismo que el botón sin cambiar de código.
 *
 * `alAbrir` se guarda en un ref a propósito: si fuera dependencia del efecto,
 * un `() => setAbierta(true)` recreado en cada render re-ataría los
 * listeners sin parar y volvería a abrir la hoja en bucle.
 */
export function usarDisparadoresLupa(abierta: boolean, alAbrir: () => void): void {
  const alAbrirActual = useRef(alAbrir);
  alAbrirActual.current = alAbrir;

  useEffect(() => {
    const disparadores = disparadoresEstaticos();

    const alPulsar = (event: Event): void => {
      // Sin esto, el enlace de `accessweb.html` saldría de la página en vez de
      // abrir la búsqueda, y el botón navegaría a `#`.
      event.preventDefault();
      alAbrirActual.current();
    };

    /*
     * Un enlace NO se activa con la barra espaciadora: solo con Enter. Y como el
     * clic ya no navega, ese enlace es un disparador y tiene que comportarse como
     * los otros dos, que sí son botones. Con solo el `click` del ratón era un
     * disparador de un uso: el teclado lo traverseaba sin abrir nada.
     *
     * Al `<button>` no se le ata nada: ya responde a Espacio con un `click`, y
     * atar también el `keydown` lo abriría dos veces.
     */
    const alPulsarEspacio = (event: KeyboardEvent): void => {
      if (event.key !== ' ' && event.key !== 'Spacebar') {
        return;
      }
      event.preventDefault();
      alAbrirActual.current();
    };

    for (const disparador of disparadores) {
      disparador.addEventListener('click', alPulsar);
      if (disparador.tagName === 'A') {
        disparador.addEventListener('keydown', alPulsarEspacio);
      }
    }

    if (llegaConBusqueda()) {
      alAbrirActual.current();
    }

    return () => {
      for (const disparador of disparadores) {
        disparador.removeEventListener('click', alPulsar);
        disparador.removeEventListener('keydown', alPulsarEspacio);
      }
    };
  }, []);

  useEffect(() => {
    for (const disparador of disparadoresEstaticos()) {
      disparador.setAttribute('aria-expanded', String(abierta));
      disparador.setAttribute('aria-controls', 'hoja-buscar');
      disparador.setAttribute('aria-haspopup', 'dialog');
      disparador.setAttribute('data-abre', 'buscar');
    }
  }, [abierta]);
}

/**
 * Los mismos dos nodos, leídos otra vez: el HTML estático puede llegar tarde.
 *
 * En `index.html` y `products.html` el disparador es un `<button>` que tiene las
 * dos marcas —clase e id—, así que las dos búsquedas dan el mismo nodo y el
 * clic se ata una sola vez.
 */
function disparadoresEstaticos(): HTMLElement[] {
  return [
    document.getElementById('searchBtn'),
    document.querySelector<HTMLElement>('.header-search')
  ].filter((disparador): disparador is HTMLElement => disparador !== null);
}

/**
 * Monta la búsqueda en las páginas que no son el catálogo.
 *
 * `index.html` y `accessweb.html` no tienen router, así que un resultado no
 * puede navegar en el sitio: se va a `products.html` con el producto en el hash
 * y el router del catálogo lo recoge al llegar. Mismo panel, mismos datos, una
 * línea de diferencia en lo que hace un resultado.
 *
 * El nodo anfitrión se crea aquí y no en cada HTML: es un asunto de React y las
 * páginas no deberían saber que existe.
 *
 * El `Provider` es obligatorio: la Lupa lee sus resultados del store y esta raíz
 * nace fuera del árbol de la página, así que no hereda nada de él. Ya no hace
 * falta `ThemeProvider` porque los estilos de la Lupa sacan su plan B del tema
 * por importación, no del contexto.
 */
export function montarLupa(): void {
  if (document.getElementById('lupaRoot')) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'lupaRoot';
  document.body.appendChild(host);

  createRoot(host).render(
    <Provider store={store}>
      <LupaLegacy
        alElegir={(producto) => {
          window.location.href = `products.html#/producto/${producto.id}`;
        }}
      />
    </Provider>
  );
}

/** La búsqueda de las páginas viejas: hoja compartida y contenido de la Lupa. */
function LupaLegacy({ alElegir }: { alElegir: (producto: Product) => void }): JSX.Element {
  const [abierta, setAbierta] = useState<boolean>(llegaConBusqueda);
  usarDisparadoresLupa(abierta, () => setAbierta(true));

  return (
    <Hoja
      abierta={abierta}
      alCerrar={() => setAbierta(false)}
      nombre="buscar"
      lado="centro"
      titulo="Buscar"
      etiquetaCerrar="Cerrar la búsqueda"
      focoEnContenido
    >
      <Lupa
        onPickProduct={(producto) => {
          setAbierta(false);
          alElegir(producto);
        }}
      />
    </Hoja>
  );
}
