/**
 * Estilos de Lupa.
 *
 * Viven aparte del `.tsx` porque el enunciado del modulo pide un archivo de
 * estilos por componente, y porque separa la decision visual de la logica: el
 * componente dice QUE renderiza, este archivo dice COMO se ve.
 *
 * DE DONDE SALE CADA COLOR: DOS FUENTES, UNA DECLARADA
 * ---------------------------------------------------
 * Este componente vive en dos paginas que no comparten hoja de estilos:
 *
 *   - la carcasa nueva (landing, catalogo), oscura, con los tokens `--color-*`
 *     de `src/styles/tailwind.css`;
 *   - las paginas viejas (index, products, accessweb), claras, que nunca
 *     cargaron Tailwind —cargar su preflight ahi parte el Bootstrap que las
 *     sostiene— y siguen con la paleta de `carniTheme`.
 *
 * Por eso cada color se escribe `var(--token, valor-viejo)`: en la carcasa manda
 * el token y la pagina vieja cae al valor de `carniTheme`. La paleta vieja no se
 * copia a mano en ningun sitio: se lee del tema, que es donde ya vivia.
 *
 * Consecuencia que conviene no perder: la hoja y su marco los pone `Hoja`, no
 * este archivo. Aqui solo se pinta CONTENIDO.
 */

import styled from 'styled-components';
import { carniTheme } from '@src/theme/carniTheme';

/* ------------------------------------------------------------- tokens ---- */

/** Texto principal. */
const TEXTO = `var(--color-text, ${carniTheme.colors.carniBrown})`;

/** Texto apagado: etiquetas, unidades, "sin resultados". */
const TEXTO_APAGADO = `var(--color-text-muted, ${carniTheme.colors.textMuted})`;

/** Fondo de la hoja. */
const SUPERFICIE = `var(--color-surface-1, ${carniTheme.colors.surface})`;

/** Fondo de la banda gris de la foto. */
const SUPERFICIE_2 = `var(--color-surface-2, ${carniTheme.colors.surfaceMuted})`;

/**
 * El dorado se queda: `carniTheme` lo documenta como el token de kickers, y una
 * etiqueta en versalitas ES un kicker. Se adapta el patron, no la paleta.
 */
const DORADO = `var(--color-gold, ${carniTheme.colors.carniGold})`;

/** El anillo de foco: arena en la carcasa, el rojo viejo en las paginas suyas. */
const FOCO = `var(--color-sand, ${carniTheme.colors.carniRed})`;

/**
 * Filetes y lavados derivados del texto, no colores sueltos.
 *
 * Antes eran `rgba(54, 52, 50, 0.22)` y sus hermanos, escritos a mano. Sobre un
 * fondo oscuro un negro al 22 % no se ve: el mismo valor hay que sacarlo de la
 * tinta que haya delante. `color-mix` hace justo eso.
 */
const MEZCLA = (porcentaje: number): string =>
  `color-mix(in srgb, ${TEXTO} ${porcentaje}%, transparent)`;

/**
 * Se mueve a mano donde se animaba color de fondo y no `all`.
 *
 * `theme.transitionFast` es `all 0.15s ease`, y `all` transiciona tambien lo que
 * nadie quiere mover —el ancho de una caja al cargar una fuente—: en una rejilla
 * de seis columnas eso se ve como un tirón. Se nombran las propiedades y el
 * tiempo se queda en 150 ms, que es lo que se veía antes.
 */
const MOVIMIENTO = '0.15s ease';

/**
 * Texto que solo existe para un lector de pantalla.
 *
 * No se usa `display: none` ni `visibility: hidden`: eso lo esconde también del
 * lector, que es justo lo contrario de lo que se busca. El recorte de 1px es el
 * patrón estándar para dejarlo audible e invisible.
 */
export const SoloLectores = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * El cuerpo de la hoja: contenido y scroll.
 *
 * Antes esta caja era la que hacia scroll dentro del popin, que ocupaba la
 * ventana entera. Ahora quien scrollea es el contenedor de `Hoja` —mismo
 * problema, misma solucion, en el sitio que corresponde— y aqui solo queda el
 * aire de arriba y de abajo.
 */
export const Cuerpo = styled.div`
  position: relative;
  padding: 1.75rem 0 2rem;
`;

/* Pildora centrada, como la referencia. Antes era una linea inferior de ancho
   completo y llevaba un icono de lupa adentro; ese icono era la SEGUNDA lupa
   que se veia en pantalla. Fuera. La de cerrar tampoco va aqui: vive en el
   marco de `Hoja`, lejos del campo, donde no se confunde con la de limpiar. */
export const SearchForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: min(605px, calc(100% - 3rem));
  margin: 0 auto;
  padding: 0.7rem 1.2rem;
  border: 1px solid ${MEZCLA(22)};
  border-radius: 999px;
  background: ${SUPERFICIE};

  &:focus-within {
    border-color: ${MEZCLA(50)};
  }
`;

export const SearchInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: ${TEXTO};
  padding: 0.25rem 0;
  ::placeholder {
    color: ${TEXTO_APAGADO};
    opacity: 1;
  }
`;

export const GhostButton = styled.button`
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: ${MEZCLA(7)};
  color: ${TEXTO};
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  transition: transform ${MOVIMIENTO}, background-color ${MOVIMIENTO};

  &:hover {
    transform: rotate(90deg);
    background: ${MEZCLA(14)};
  }

  &:focus-visible {
    outline: 2px solid ${FOCO};
    outline-offset: 2px;
  }
`;

/* Etiqueta arriba y terminos debajo, centrados los dos. */
export const ChipRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 1.1rem 1.5rem 0.2rem;
`;

export const ChipLinea = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.1rem;
`;

export const RowLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${DORADO};
`;

/* Texto plano, no pildora. En la referencia las tendencias son enlaces y el
   hover las subraya — se comprobo en el video, con el cursor sobre "bolsas". */
export const Chip = styled.button`
  border: 0;
  border-radius: 0;
  background: none;
  padding: 0;
  color: ${TEXTO};
  font-size: 0.9rem;
  font-weight: 400;
  cursor: pointer;
  transition: color ${MOVIMIENTO};

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    outline: 2px solid ${FOCO};
    outline-offset: 3px;
  }
`;

/* Las recientes SI son pildoras: llevan su propia x para borrarse, y sin
   carcasa esa x quedaria flotando junto al texto sin decir a quien pertenece.
   Como extiende Chip, hay que devolverle lo que Chip acaba de perder. */
export const RecentChip = styled(Chip)`
  border: 1px solid ${MEZCLA(18)};
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  &:hover { text-decoration: none; background: ${MEZCLA(5)}; }

  i {
    font-style: normal;
    opacity: 0.55;
    font-size: 0.7rem;
  }
`;

export const SectionHeader = styled.h3`
  margin: 1.5rem 0 0.5rem;
  padding: 0 1.5rem;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  color: ${TEXTO_APAGADO};
`;

/* SEIS columnas, y bajando por escalones.
   `minmax(0, 1fr)` no es opcional: con `auto`, un nombre largo ensancha su
   pista y desarma la rejilla entera. */
export const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;

  @media (max-width: 1200px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 900px)  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 600px)  { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

/* Vertical: foto arriba, texto debajo. Era horizontal con una miniatura de
   56px, que es una lista de resultados, no una vitrina. */
export const ResultCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  text-align: left;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;

  &:hover img { opacity: 0.88; }

  &:focus-visible {
    outline: 2px solid ${FOCO};
    outline-offset: -2px;
  }
`;

/* `contain`, no `cover`: la foto se ve entera sobre su fondo, sin recortarle el
   corte al cliente. El gris con aire es lo que le da la vitrina. */
export const ResultThumb = styled.img`
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 4;
  object-fit: contain;
  background: ${SUPERFICIE_2};
  padding: 0.9rem;
  transition: opacity ${MOVIMIENTO};
`;

/* El texto vive FUERA de la banda gris, sobre el fondo de la hoja. */
export const ResultInfo = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.75rem 1.1rem;
`;

/* Dos lineas, no una. "Filete de Pollo Empanizado" cortado en la primera es
   media palabra; el `min-height` mantiene los precios alineados en la fila
   aunque un nombre ocupe una linea y su vecino dos. */
export const ResultName = styled.strong`
  font-size: 0.82rem;
  font-weight: 400;
  color: ${TEXTO};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
  line-height: 1.3;
  min-height: 2.6em;
`;

export const ResultPrice = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${TEXTO};
  white-space: nowrap;

  small {
    font-weight: 500;
    color: ${TEXTO_APAGADO};
  }
`;

export const EmptyState = styled.p`
  margin: 1rem 0 0;
  color: ${TEXTO_APAGADO};
  font-size: 0.9rem;
  font-style: italic;
`;