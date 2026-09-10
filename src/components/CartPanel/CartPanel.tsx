import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OrderList } from '@src/components/OrderList/OrderList';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import type { OrderLine } from '@src/types/database';
import { Panel } from './styles';

export interface CartPanelProps {
  isOpen: boolean;
  order: OrderLine[];
  total: number;
  onClose: () => void;
  onRemove: (lineId: string) => void;
}

/**
 * La direccion del pedido, servible CON router y SIN el.
 *
 * Este panel se monta en dos sitios muy distintos. En `products.tsx` cuelga de
 * un `HashRouter` y podria usar `<Link>`. Pero `montarCarrito()` lo monta
 * tambien en `index.html` y en `accessweb.html`, donde NO HAY ROUTER: alli un
 * `<Link>` o un `useNavigate` lanzan «useHref() may be used only in the context
 * of a <Router>» y se llevan por delante el componente entero — el cliente se
 * queda sin cajon, no sin enlace. Ya paso lo mismo con la Lupa y su Provider.
 *
 * Un `<a>` normal no tiene ese problema porque no sabe nada de React Router, y
 * un fragmento nunca llega al servidor: `products.html#/carrito` es una peticion
 * de `products.html` en Netlify (raiz) y en GitHub Pages (`/Landingpages-
 * Carni.pwa/`) por igual. Por eso la ruta va RELATIVA y sin pasar por
 * `assetUrl()`: el navegador la resuelve contra el documento actual y sale el
 * prefijo correcto solo. Importar `assetUrl` aqui, ademas, arrastraria
 * `import.meta.env` a un archivo que Jest compila a CommonJS y ni siquiera
 * llegaria a ejecutarse.
 *
 * Y estando YA en el catalogo se devuelve solo el fragmento. Cambiar unicamente
 * el `#` es navegacion DENTRO del mismo documento: no recarga y el `HashRouter`
 * la recoge como cualquier otra ruta. Repetir `products.html` en ese caso
 * cambiaria tambien la cadena de consulta, y eso SI es una recarga que ademas
 * tira el `?categoria=` o el `?q=` con el que el cliente venia filtrando.
 */
function hrefDelPedido(): string {
  return window.location.pathname.endsWith('/products.html')
    ? '#/carrito'
    : 'products.html#/carrito';
}

/**
 * Side panel that shows the current order.
 *
 * Deliberately not a dialog: there is no backdrop and focus is never trapped,
 * so the catalogue stays scrollable and clickable while the panel is open and
 * lines can be added or removed without closing it. That is the whole reason
 * this replaces the Bootstrap modal, which blocked the page behind it.
 */
export function CartPanel({ isOpen, order, total, onClose, onRemove }: CartPanelProps): JSX.Element {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const itemCount = order.length;

  /**
   * El cajón se dibuja en `body`, no donde lo pongan.
   *
   * En products.html el panel colgaba de un `div.container-fluid` con
   * `position: relative; z-index: 20`. Eso abre un CONTEXTO DE APILAMIENTO: el
   * `z-index: 1040` del panel deja de compararse con el resto de la página y
   * pasa a ordenarse solo entre sus hermanos, mientras la caja entera compite
   * con el encabezado como si valiera 20. Resultado en un teléfono: el header
   * (z-index 1035) tapaba el título del pedido y su botón de cerrar, así que el
   * cliente no podía ni leer ni cerrar su propio cajón.
   *
   * Subirlo por `z-index` sería perseguir el número equivocado — el problema no
   * es cuánto vale, es contra quién compite. El portal lo saca del árbol de
   * cajas sin sacarlo del árbol de React: los eventos siguen subiendo hasta
   * aquí, y el panel ya no depende de dónde lo monten.
   */
  return createPortal(
    <Panel
      aria-hidden={!isOpen}
      aria-label="Tu pedido"
      className="cart-panel"
      $isOpen={isOpen}
      // Keeps the panel and everything inside it out of the tab order and out of
      // the accessibility tree while it is off-canvas.
      {...(isOpen ? {} : { inert: '' })}
    >
      <header className="cart-panel__header">
        <div>
          <h2 className="cart-panel__title">Tu pedido</h2>
          <p className="cart-panel__count">
            {itemCount === 1 ? '1 producto' : `${itemCount} productos`}
          </p>
        </div>
        <button
          aria-label="Cerrar el pedido"
          className="cart-panel__close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          ×
        </button>
      </header>

      <div className="cart-panel__body">
        <OrderList order={order} onRemove={onRemove} />
      </div>

      <footer className="cart-panel__footer">
        <div className="cart-panel__total-row">
          <span>Total</span>
          <strong className="cart-panel__total">{formatearPrecio(total, 'ticket')}</strong>
        </div>
        {/*
          La puerta al pedido, y por que no se agrega un boton nuevo al lado.

          La ruta `#/carrito` existia y no habia UN SOLO enlace que llevara a
          ella: se llegaba escribiendo la URL. La puerta ya estaba aqui, sin
          hacer nada — «Continuar con el pedido» ya dice lo que toca hacer:
          salir del vistazo rapido y entrar a la revision. Poner otro control
          junto al icono del encabezado serian dos mandos para el mismo recado.

          POR QUE CAMBIA DE ELEMENTO SEGUN EL ESTADO
          ------------------------------------------
          Con el pedido vacio no hay nada que continuar, y en HTML un enlace no
          se puede deshabilitar: `<a>` no admite `disabled` y `aria-disabled`
          avisa al lector de pantalla pero no impide el clic. Un boton apagado
          si es exactamente eso — un mando presente que no se puede accionar—,
          asi que el estado vacio se queda como estaba. Con lineas dentro es una
          NAVEGACION de verdad, y eso es un enlace: se abre en pestaña nueva, se
          copia, se previsualiza en la barra de estado y se anuncia como enlace.
          No son dos controles: es el mismo, dicho con el elemento que
          corresponde a cada estado.
        */}
        {itemCount === 0 ? (
          <button className="cart-panel__checkout" disabled type="button">
            Continuar con el pedido
          </button>
        ) : (
          <a
            className="cart-panel__checkout"
            href={hrefDelPedido()}
            /*
              Cerrar al salir. Sin esto el cajon queda abierto ENCIMA de la
              pagina del pedido, que es la misma lista dos veces.
              `usePedido` recuerda el estado abierto en `localStorage`, asi que
              el cajon reaparecia incluso despues de cambiar de documento.

              TRAMPA: `onClose` provoca un `setState`, y quien borra la llave es
              un `useEffect` de `usePedido`. React ejecuta los efectos pasivos
              en una tarea posterior al clic, mientras el navegador ya empezo a
              pedir `products.html`. En la practica el borrado gana —
              `localStorage` es sincrono y una navegacion tarda mas— pero si
              alguna vez se ve el cajon abierto sobre `#/carrito`, es aqui donde
              hay que mirar, no en el CSS.
            */
            onClick={onClose}
            /*
              Estas tres declaraciones estan en linea porque
              `CartPanel/styles.ts` queda fuera del alcance de este cambio, y
              son justo las que le faltan a un `<a>` para ocupar la caja que
              `.cart-panel__checkout` dibujo para un `<button>`: un enlace es
              `inline`, asi que ignoraria el `width: 100%`, se le saldria el
              relleno vertical por encima de la fila del total, y el navegador
              lo subrayaria. Su sitio natural es la regla de `styles.ts`.
            */
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            Continuar con el pedido
          </a>
        )}
      </footer>
    </Panel>,
    document.body
  );
}
