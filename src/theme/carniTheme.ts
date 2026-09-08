/**
 * Carni Design Tokens — capa React.
 *
 * Una sola fuente de verdad para los valores de la capa styled-components.
 * Los valores de color provienen 1:1 de `css/abstracts/_variables.scss`
 * ($carni-red, $carni-charcoal, ...) para que la capa React y el SCSS vanilla
 * hablen el mismo ADN: si el SCSS cambia un token, este archivo debe seguirle.
 */
export const carniTheme = {
  colors: {
    /* $carni-red — acción, precio fuerte, acentos */
    carniRed: '#DC2626',
    /* $carni-beige — editorial */
    carniBeige: '#E4D1B0',
    /* $carni-gold — kickers y jerarquía cálida */
    carniGold: '#F59E0B',
    /* $carni-brown — texto fuerte sobre claro */
    carniBrown: '#363432',
    /* $carni-white — superficies claras (popin de la Lupa) */
    surface: '#FFFFFF',
    /* Fondo de la vitrina: la banda gris muy clara detras de cada foto de
       resultado. Vive aqui y no clavado en el componente porque la misma banda
       se reusa en mas de un sitio. */
    surfaceMuted: '#F8F8F8',
    /* --carni-charcoal — superficies oscuras (cart panel) */
    charcoal: '#111111',
    /* --carni-text */
    text: '#F5F5F5',
    /* --carni-text-muted */
    textMuted: '#A3A3A3'
  },
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px'
  },
  radii: {
    /* bordes de componentes de la capa React */
    md: '10px',
    /* fondo del popin de la Lupa */
    lg: '1.25rem'
  },
  /* $shadow-xl */
  shadowXl: '0 10px 25px rgba(0, 0, 0, 0.15)',
  /* $transition-fast / $transition-base */
  transitionFast: 'all 0.15s ease',
  transitionBase: 'all 0.3s ease'
} as const;

export type CarniTheme = typeof carniTheme;