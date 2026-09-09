/**
 * Estilos de CategoryCard.
 *
 * SOLO lo que la version React necesita y el markup escrito a mano no.
 *
 * El aspecto del tile —`.category-card`, `.category-img`, `.category-body`,
 * `.category-title`, `.category-desc`— y la colocacion de `.category-card-1` a
 * `-9` en la rejilla viven en `css/pages/_bento-main.scss`. NO se duplican aqui
 * a proposito: copiarlas seria la forma mas rapida de que las dos versiones se
 * separen sin que nadie lo note.
 *
 * Por eso el componente CONSERVA sus clases: styled-components agrega la suya
 * ademas, no en lugar de. Quitarlas dejaria el tile fuera de su celda del bento.
 */
import styled from 'styled-components';

export const Tarjeta = styled.article`
  /* El tile entero es un enlace al catalogo, asi que toda su superficie deberia
     decirlo. El markup anterior solo mostraba el cursor sobre el boton. */
  .category-img,
  .category-title {
    cursor: pointer;
  }

  /* Sin ancho minimo, los iconos de Bootstrap Icons tienen anchos distintos y
     los titulos de las nueve tarjetas arrancan cada uno en una x diferente. */
  .category-title > i.bi {
    display: inline-block;
    min-width: 1em;
  }
`;
