import { createGlobalStyle } from 'styled-components';

/**
 * Estilos globales de la capa React.
 *
 * Solo viven aquí las reglas que por naturaleza salen del árbol de un
 * componente: estados que se anuncian en <body> (carrito abierto). Los estilos
 * de cada componente migran a su styled-component co-locado; estas tres reglas
 * no pertenecen a ningún componente porque su selector lo cruza:
 *
 * - `body.cart-is-open` lo lee el header, el grid y el panel a la vez, y
 *   vivían en CartPanel/styles.css y ProductList/styles.css antes de la
 *   migración a styled-components.
 * - El bloqueo de scroll móvil es el complemento del padding de escritorio:
 *   en desktop el catálogo se adelgaza (padding-right), en móvil se congela
 *   (overflow hidden) porque el panel cubre la pantalla completa.
 */
const GlobalStyles = createGlobalStyle`
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    body.cart-is-open {
      padding-right: 380px;
    }
  }

  @media (max-width: 575.98px) {
    body.cart-is-open {
      overflow: hidden;
    }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    body.cart-is-open .product-list {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

export default GlobalStyles;