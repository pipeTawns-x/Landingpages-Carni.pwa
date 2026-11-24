// The static accessweb.html at the root, served by the Vite dev server, mounts this React strip.
// The Django page (backend/ventas/templates/ventas/acceso.html) does not: it loads
// ./server-acceso.ts instead. The code below is the one auth.tsx carried before the split. Its
// copy used to promise a points program and order tracking that do not exist yet, so it is now
// written in the future tense. No visitor sees it, because Django redirects /accessweb.html to
// /acceso/; it goes away with the static page (T8), tracked as P-51 in docs/PENDIENTES.md.
import { ThemeProvider } from 'styled-components';
import { mountReactNode } from '../entry/shared';
import { montarCarrito } from '@src/components/CartPanel/montar';
import { montarLupa } from '@src/components/Lupa/montar';
import { carniTheme } from '@src/theme/carniTheme';

function AuthExperience(): JSX.Element {
  return (
    <section className="tw-redesign-root tw-auth-strip">
      <div className="tw-auth-strip__content">
        <p className="tw-kicker">Acceso Premium</p>
        <h2>Login y registro con identidad editorial, confianza y claridad móvil</h2>
        <p>
          Se preservan los efectos visuales del acceso actual, y más adelante se sumará una capa editorial que
          explicará los beneficios que vienen: entrega, seguimiento y el club digital.
        </p>
        <div className="tw-auth-strip__grid">
          <article className="tw-mini-card"><h3>Entrega y pickup</h3><p>Próximamente podrás comprar, agendar y confirmar pedidos para tienda o envío.</p></article>
          <article className="tw-mini-card"><h3>Mercy Club</h3><p>Próximamente: puntos, ofertas especiales e historial de compras.</p></article>
        </div>
      </div>
    </section>
  );
}

export function mountLegacyAcceso(): void {
  mountReactNode(
    '#authExperienceRoot',
    <ThemeProvider theme={carniTheme}>
      <AuthExperience />
    </ThemeProvider>
  );

  // The search popover and the cart drawer are the same on the three pages. They are mounted
  // apart because their triggers (#searchBtn, .header-search, #cartBtn) live in the static
  // header, outside this tree.
  montarLupa();
  montarCarrito();
}
