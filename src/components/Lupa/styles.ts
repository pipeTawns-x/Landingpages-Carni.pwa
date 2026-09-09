/**
 * Estilos de Lupa.
 *
 * Viven aparte del `.tsx` porque el enunciado del modulo pide un archivo de
 * estilos por componente, y porque separa la decision visual de la logica: el
 * componente dice QUE renderiza, este archivo dice COMO se ve.
 */

import styled from 'styled-components';

export const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 1020;
  background: rgba(5, 5, 5, 0.45);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition: opacity 0.28s ease, visibility 0s linear ${({ $open }) => ($open ? '0s' : '0.28s')};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

/**
 * El popin TAPA EL ENCABEZADO, y esa es la pieza que faltaba.
 *
 * Colgaba del header (`top: var(--carni-header-h)`), asi que la pildora de
 * busqueda de la barra seguia a la vista con su propia lupa mientras el campo
 * del popin mostraba otra. Eduardo lo vio y lo dijo con todas las letras: "se
 * ven 2 lupas y eso no esta bien, hay que hacerlo igual que la LV, que solo es
 * una lupa".
 *
 * En la referencia no hay ningun truco para esconder la del header: el panel
 * arranca en `top: 0` y la tapa. El wordmark de adentro pasa a ser el unico
 * ancla de marca mientras dura la busqueda. Una sola lupa porque solo hay una
 * barra visible, no porque se este ocultando nada.
 */
export const Popin = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1040;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadowXl};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transform: ${({ $open }) => ($open ? 'translateY(0)' : 'translateY(-12px)')};
  transition: opacity 0.28s ease, transform 0.28s ease, visibility 0s linear ${({ $open }) => ($open ? '0s' : '0.28s')};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

export const Inner = styled.div`
  position: relative;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1.75rem 0 2rem;
`;

export const Encabezado = styled.div`
  position: relative;
  padding: 0 1.5rem 1.25rem;
  text-align: center;
`;

export const Wordmark = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.carniBrown};
`;

export const CerrarEsquina = styled.button`
  position: absolute;
  top: -0.35rem;
  right: 1.5rem;
  border: 0;
  background: none;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.carniBrown};
  opacity: 0.7;

  &:hover { opacity: 1; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.carniRed};
    outline-offset: 3px;
  }
`;

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

export const SearchForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: min(605px, calc(100% - 3rem));
  margin: 0 auto;
  padding: 0.7rem 1.2rem;
  border: 1px solid rgba(54, 52, 50, 0.22);
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};

  &:focus-within {
    border-color: rgba(54, 52, 50, 0.5);
  }
`;

export const SearchInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.carniBrown};
  padding: 0.25rem 0;
  ::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    opacity: 1;
  }
`;

export const GhostButton = styled.button`
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(54, 52, 50, 0.07);
  color: ${({ theme }) => theme.colors.carniBrown};
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitionFast}, background ${({ theme }) => theme.transitionFast};

  &:hover {
    transform: rotate(90deg);
    background: rgba(54, 52, 50, 0.14);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.carniRed};
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
  /* El dorado se queda: carniTheme lo documenta como el token de kickers, y una
     etiqueta en versalitas ES un kicker. Se adapta el patron, no la paleta. */
  color: ${({ theme }) => theme.colors.carniGold};
`;

export const Chip = styled.button`
  border: 0;
  border-radius: 0;
  background: none;
  padding: 0;
  color: ${({ theme }) => theme.colors.carniBrown};
  font-size: 0.9rem;
  font-weight: 400;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitionFast};

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.carniRed};
    outline-offset: 3px;
  }
`;

export const RecentChip = styled(Chip)`
  border: 1px solid rgba(54, 52, 50, 0.18);
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  &:hover { text-decoration: none; background: rgba(54, 52, 50, 0.05); }

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
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;

  @media (max-width: 1200px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 900px)  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 600px)  { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

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
    outline: 2px solid ${({ theme }) => theme.colors.carniRed};
    outline-offset: -2px;
  }
`;

export const ResultThumb = styled.img`
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 4;
  object-fit: contain;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  padding: 0.9rem;
  transition: opacity ${({ theme }) => theme.transitionFast};
`;

/* El texto vive FUERA de la banda gris, sobre blanco. */
export const ResultInfo = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.75rem 1.1rem;
`;

export const ResultName = styled.strong`
  font-size: 0.82rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.carniBrown};
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
  color: ${({ theme }) => theme.colors.carniBrown};
  white-space: nowrap;

  small {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const EmptyState = styled.p`
  margin: 1rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  font-style: italic;
`;
