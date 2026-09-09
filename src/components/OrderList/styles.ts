/**
 * Estilos de OrderList.
 *
 * Viven aparte del `.tsx` porque el enunciado del modulo pide un archivo de
 * estilos por componente, y porque separa la decision visual de la logica: el
 * componente dice QUE renderiza, este archivo dice COMO se ve.
 */

import styled from 'styled-components';

/**
 * Estilos propios de las líneas del pedido (antes OrderList/styles.css, ~85
 * líneas). El componente conserva sus clases `order-list__*` como hooks de
 * debug; el aspecto lo dicta este styled-component co-locado.
 */
export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .order-list__item {
    display: grid;
    grid-template-columns: 48px 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem;
    border-radius: ${({ theme }) => theme.radii.md};
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .order-list__thumb {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }

  .order-list__info {
    min-width: 0;
  }

  .order-list__name {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .order-list__meta {
    margin: 0;
    font-size: 0.78rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  .order-list__line-total {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text};
    white-space: nowrap;
  }

  .order-list__remove {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    /* carni-red al 16 % — el fondo del botón de quitar */
    background: rgba(220, 38, 38, 0.16);
    color: #ff8f8f;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    transition: transform ${({ theme }) => theme.transitionFast};

    &:hover {
      transform: scale(1.12);
    }

    &:focus-visible {
      outline: 2px solid #ff8f8f;
      outline-offset: 2px;
    }
  }
`;

export const Empty = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  line-height: 1.5;
`;
