import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@src/styles/fuentes';
import '@src/styles/tailwind.css';
import { Panel } from '@src/panel/Panel';

/**
 * Entrada de panel.html. Sin Provider: el panel no usa el carrito, y sin la
 * tienda de Redux tampoco se toca el almacenamiento del pedido.
 */
const raiz = document.getElementById('raiz');

if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <Panel />
    </StrictMode>
  );
}
