import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import '@src/styles/tailwind.css';
import { store } from '@src/redux/store';
import { Landing } from '@src/landing/Landing';
import { montarLupa } from '@src/components/Lupa/montar';
import { montarCarrito } from '@src/components/CartPanel/montar';

/**
 * Entrada de la landing nueva. Aislada de las demás páginas a propósito
 * (decisión de la migración a Tailwind): `landing.html` es un documento
 * nuevo, no reemplaza `index.html` todavía, y esta es la ÚNICA entrada que
 * importa `tailwind.css`.
 *
 * La lupa y el carrito NO se reconstruyen: se reutiliza el mismo mecanismo
 * que ya usa `src/entry/home.tsx" — montarLupa()/montarCarrito() crean su
 * propia raíz de React aparte, con su propio Provider/ThemeProvider, y se
 * enganchan a los botones del encabezado por id (`#searchBtn`, `#cartBtn`),
 * que Encabezado.tsx ya trae. GlobalStyles, que esas dos funciones también
 * montan, solo toca `body.cart-is-open` — no interfiere con Tailwind.
 */
const host = document.getElementById('landing-root');

if (host) {
  createRoot(host).render(
    <Provider store={store}>
      <Landing />
    </Provider>
  );
}

montarLupa();
montarCarrito();
