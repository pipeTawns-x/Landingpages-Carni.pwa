import { createRoot } from 'react-dom/client';
import { CartPanel } from './CartPanel';
import { usePedido } from '@src/hooks/usePedido';
import { leerPedidoGuardado } from '@src/lib/pedidoStorage';

/**
 * The order follows the customer between pages.
 *
 * `index.html`, `products.html` and `accessweb.html` are three separate HTML
 * documents, so nothing survives the jump in memory. What does survive is the
 * `carni_cart_v1` key, and `usePedido` reads it on every mount — so a cut added
 * on the landing is already in the ticket when the catalogue opens, and the
 * other way round.
 *
 * The `storage` event covers the rest: a second tab writing the key updates this
 * one without a reload.
 */
function CarritoGlobal(): JSX.Element {
  const pedido = usePedido({ leer: leerPedidoGuardado });
  return (
    <CartPanel
      isOpen={pedido.abierto}
      onClose={pedido.cerrar}
      onRemove={pedido.quitar}
      order={pedido.lineas}
      total={pedido.total}
    />
  );
}

/**
 * Mounts the same drawer on the pages outside the catalogue.
 *
 * The landing showed no cart at all and `accessweb.html` still opened a red
 * Bootstrap modal — three pages of one shop with three different carts. They
 * share the drawer now, and they already shared the data: one `localStorage` key
 * and the `cart:updated` event.
 */
export function montarCarrito(): void {
  if (document.getElementById('carritoRoot')) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'carritoRoot';
  document.body.appendChild(host);

  createRoot(host).render(<CarritoGlobal />);
}
