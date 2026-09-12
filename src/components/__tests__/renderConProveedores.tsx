/**
 * Un solo lugar donde se monta el arbol de proveedores para los tests.
 *
 * Los tres componentes de esta practica no se sostienen solos:
 * - styled-components lee `theme.colors` y `theme.radii` dentro de sus
 *   plantillas, asi que sin ThemeProvider revientan al renderizar.
 * - ProductCard usa <Link>, y un Link fuera de un Router lanza
 *   "useHref() may be used only in the context of a <Router>".
 *
 * Repetir el mismo envoltorio en cada archivo de test seria copiar tres veces
 * la misma decision: el dia que aparezca un Provider de Redux habria que
 * tocar tres archivos y olvidarse de uno.
 */

// Doble proposito, por eso esta aqui y no en `setupFilesAfterEnv`: en tiempo de
// ejecucion registra los matchers (toBeInTheDocument, toHaveAttribute...) y en
// tiempo de compilacion es lo que hace que TypeScript los reconozca sobre el
// `expect` de @jest/globals. Como todos los tests importan este helper, con
// importarlo una vez alcanza.
import '@testing-library/jest-dom/jest-globals';

import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { carniTheme } from '@src/theme/carniTheme';

function Proveedores({ children }: { children: ReactNode }): JSX.Element {
  // MemoryRouter y no BrowserRouter: guarda el historial en memoria en vez de
  // tocar la URL de jsdom, asi un test no arrastra la navegacion del anterior.
  return (
    <ThemeProvider theme={carniTheme}>
      <MemoryRouter>{children}</MemoryRouter>
    </ThemeProvider>
  );
}

export function renderConProveedores(
  ui: ReactElement,
  opciones?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: Proveedores, ...opciones });
}
