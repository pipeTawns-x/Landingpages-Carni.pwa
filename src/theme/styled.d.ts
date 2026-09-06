import 'styled-components';
import type { CarniTheme } from './carniTheme';

/**
 * Extiende DefaultTheme con los tokens de Carni.
 *
 * Con esto los styled-components tipan `props.theme` sin cast: la misma
 * sobrecarga documentada por styled-components (module augmentation) que
 * requiere la práctica de estilos.
 */
declare module 'styled-components' {
  export interface DefaultTheme extends CarniTheme {}
}