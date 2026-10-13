import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import '@src/styles/fuentes';
import '@src/styles/tailwind.css';
import { store } from '@src/redux/store';
import { Catalogo } from '@src/catalogo/Catalogo';
import { Carcasa } from '@src/ui/Carcasa';

/** Entrada de catalogo.html: la misma carcasa que la landing, con el catálogo dentro. */
const raiz = document.getElementById('raiz');

if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <Provider store={store}>
        <Carcasa pagina="catalogo">
          <Catalogo />
        </Carcasa>
      </Provider>
    </StrictMode>
  );
}
