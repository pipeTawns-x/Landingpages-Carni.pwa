/**
 * Estilos de ProductList.
 *
 * Viven aparte del `.tsx` porque el enunciado del modulo pide un archivo de
 * estilos por componente, y porque separa la decision visual de la logica: el
 * componente dice QUE renderiza, este archivo dice COMO se ve.
 */

import styled from 'styled-components';

/**
 * Rejilla del catálogo (antes en ProductList/styles.css, 24 líneas).
 * La regla `.cart-is-open .product-list` — que cede una columna en desktop con
 * el carrito abierto — vive en GlobalStyles porque cruza el árbol: el estado se
 * anuncia en <body>, no en este componente.
 */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
