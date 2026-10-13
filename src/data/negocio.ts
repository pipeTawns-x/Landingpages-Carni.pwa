/**
 * Los datos del negocio, en un solo sitio.
 *
 * Horario, teléfono, WhatsApp, dirección y redes salen de aquí y de ningún
 * otro archivo: si algo cambia en el mostrador, se corrige en esta línea y las
 * tres páginas nuevas se mueven juntas. Solo hay cadenas reales; no hay correo
 * porque el negocio no publica uno.
 */
export const NEGOCIO = {
  nombre: 'Carnicería El Señor de La Misericordia',
  lema: 'Siempre contando con la mejor calidad y frescura',
  telefono: '+52 444 271 5470',
  telefonoHref: 'tel:+524442715470',
  whatsappHref: 'https://wa.me/524442715470',
  direccion: ['Agua Marina 110, Manuel J. Othón', '78150 San Luis Potosí, S.L.P.'],
  mapaHref:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Agua Marina 110, Manuel J. Othón, 78150 San Luis Potosí'),
  facebook: 'https://www.facebook.com/profile.php?id=100054786668816',
  instagram: 'https://www.instagram.com/carniceria.misericordia/'
} as const;

export const HORARIO = {
  dias: 'Lunes a sábado',
  abre: '8:00',
  cierra: '17:00',
  cerrado: 'Domingos y festivos, cerrado'
} as const;

/**
 * Enlace de WhatsApp con un mensaje ya escrito.
 *
 * El texto viaja codificado en la URL y nunca lleva datos personales: quien
 * escribe decide qué más contar una vez abierto el chat.
 */
export function whatsappConTexto(texto: string): string {
  return `${NEGOCIO.whatsappHref}?text=${encodeURIComponent(texto)}`;
}
