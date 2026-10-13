import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
// Las fuentes van antes que la hoja de Tailwind para que sus @font-face ya existan al resolver el tema.
import '@src/styles/fuentes';
import '@src/styles/tailwind.css';
import { store } from '@src/redux/store';
import { Landing } from '@src/landing/Landing';
import { Carcasa } from '@src/ui/Carcasa';

/**
 * Entrada de landing.html: la carcasa (encabezado, menú, pedido, pie) alrededor
 * de la landing. `sobrePortada` deja que el encabezado nazca transparente sobre
 * el video de la portada.
 */
const raiz = document.getElementById('raiz');

if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <Provider store={store}>
        <Carcasa pagina="inicio" sobrePortada>
          <Landing />
        </Carcasa>
      </Provider>
    </StrictMode>
  );
}
