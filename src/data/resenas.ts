export interface Resena {
  autor: string;
  /** How many reviews this person has written on Google — it is what makes them credible. */
  opiniones: number;
  texto: string;
}

/** Where the rating comes from, so nobody has to take our word for it. */
export const PERFIL_GOOGLE =
  'https://www.google.com/maps/place/Carnicer%C3%ADa+El+Se%C3%B1or+de+La+Misericordia/@22.1649636,-101.002778,20.28z';

export const CALIFICACION = 4.7;
export const TOTAL_OPINIONES = 61;

/**
 * Real reviews from the shop's Google profile, read on 2026-09-03.
 *
 * Nothing here is written by us. Picking which ones to show is what every
 * business does with its testimonials, and these are genuine, with names
 * attached. What is not negotiable is that the **real average and the real
 * count stay on screen**, linked to the profile, so anyone can go read the rest
 * — including the ones we did not pick. Showing a selection next to an honest
 * 4.7 is fair; hiding the average would be misleading advertising, and in Mexico
 * that is PROFECO's business.
 *
 * With a real 4.7 there is nothing to dress up.
 *
 * The texts live in this file and not inside the JSX so they can be updated
 * without touching a component.
 */
export const RESENAS: Resena[] = [
  {
    autor: 'Sandra Rodriguez',
    opiniones: 28,
    texto:
      'Tienen muy buena calidad de carne y muy serviciales, la verdad siempre tienen fila pero atienden súper rápido'
  },
  {
    autor: 'Oscar Alcocer',
    opiniones: 378,
    texto: 'Excelente proveedor. Excelente trato de sus dueños. Excelentes recomendaciones!'
  },
  {
    autor: 'Ramon Lopez Medel',
    opiniones: 79,
    texto:
      'Pequeña carnicería atendida por la familia, encuentras carne fresca de puerco, pollo y res'
  },
  {
    autor: 'marco molina',
    opiniones: 307,
    texto: 'Excelente atención y precio. Se recomienda ampliamente.'
  },
  {
    autor: 'Rosy Reyna',
    opiniones: 94,
    texto: 'Excelente servicio y atención por parte del personal y sus propietarios'
  },
  {
    autor: 'claudia hernandez',
    opiniones: 54,
    texto: 'Buena carne, buena atención de sus dueños'
  },
  {
    autor: 'Armando Viramontes',
    opiniones: 16,
    texto: 'Buena carne, buen precio y buena atención'
  }
];
