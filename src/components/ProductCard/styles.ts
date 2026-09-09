/**
 * Estilos de ProductCard.
 *
 * Viven aparte del `.tsx` porque el enunciado del modulo pide un archivo de
 * estilos por componente, y porque separa la decision visual de la logica: el
 * componente dice QUE renderiza, este archivo dice COMO se ve.
 */

import styled from 'styled-components';

/**
 * El tamano de la tarjeta vive aqui, no en el componente.
 *
 * Es una decision puramente visual: el `.tsx` no cambia de comportamiento segun
 * el tamano, solo cambia como se ve. Definirlo junto a la regla que lo consume
 * evita que `styles.ts` tenga que importar del `.tsx` que ya lo importa a el.
 */
export type TamanoTarjeta = 'small' | 'medium' | 'large';

/**
 * Reglas propias vendrían de ProductCard/styles.css (9 líneas) y ahora viven
 * aquí. El look real de la tarjeta lo sigue dando la capa global `tw-*`
 * (redesign.css + _productos.scss): este styled-component solo cubre lo que el
 * componente considera suyo, y las variantes de tamaño/IA se pasan como props
 * transitorias ($size, $isIAContent) que alimentan las clases globales sin
 * filtrarse al DOM.
 */
export const Shell = styled.article<{ $size: TamanoTarjeta; $isIAContent: boolean }>`
  /* 'tw-card-shell--' + $size y 'tw-card-shell--ia' se resuelven abajo en el
     className: los estilos de esas variantes son de la capa global. Las props
     transitorias existen para que el estilo propio y el global lean la misma
     fuente de verdad. */
  &[hidden] {
    display: none;
  }

  .producto-card__title {
    color: ${({ theme }) => theme.colors.text};
  }

  .producto-card__description {
    color: #b8b8b8;
  }
`;
