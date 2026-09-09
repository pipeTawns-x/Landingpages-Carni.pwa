/**
 * Estilos de CartPanel.
 *
 * Viven aparte del `.tsx` porque el enunciado del modulo pide un archivo de
 * estilos por componente, y porque separa la decision visual de la logica: el
 * componente dice QUE renderiza, este archivo dice COMO se ve.
 */

import styled from 'styled-components';

/**
 * Panel lateral del pedido — reglas propias (antes CartPanel/styles.css, 124
 * líneas). El estado abierto/cerrado es la prop transitoria $isOpen, que mueve
 * el panel on/off-canvas sin filtrarse al DOM.
 *
 * La regla `body.cart-is-open { padding-right }` (desktop) y su nuevo
 * complemento móvil (overflow hidden) viven en GlobalStyles: el estado se
 * anuncia en <body> y lo leen también otros componentes.
 */
export const Panel = styled.aside<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1040;
  width: 380px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.charcoal};
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.45);
  transform: translateX(100%);
  visibility: hidden;
  transition: transform 0.28s ease, visibility 0s linear 0.28s;
  will-change: transform;

  @media (max-width: 575.98px) {
    width: 100%;
  }

  ${({ $isOpen }) =>
    $isOpen &&
    `
    transform: translateX(0);
    visibility: visible;
    transition: transform 0.28s ease, visibility 0s linear 0s;
  `}

  .cart-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .cart-panel__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
  }

  .cart-panel__count {
    margin: 0.15rem 0 0;
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  .cart-panel__close {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    color: ${({ theme }) => theme.colors.text};
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    transition: transform ${({ theme }) => theme.transitionFast};

    &:hover {
      transform: scale(1.08);
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.carniRed};
      outline-offset: 2px;
    }
  }

  .cart-panel__body {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 1.25rem;
  }

  .cart-panel__footer {
    padding: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: #0d0d0d;
  }

  .cart-panel__total-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
  }

  .cart-panel__total {
    font-size: 1.35rem;
    color: ${({ theme }) => theme.colors.text};
  }

  .cart-panel__checkout {
    width: 100%;
    padding: 0.85rem 1rem;
    border: none;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.carniRed};
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    transition: transform ${({ theme }) => theme.transitionFast}, opacity ${({ theme }) => theme.transitionFast};

    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid #ffffff;
      outline-offset: 2px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    .cart-panel__close,
    .cart-panel__checkout {
      transition: none;
    }
  }
`;
