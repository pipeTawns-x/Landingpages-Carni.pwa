import { Portada } from './Portada';
import { DatosRapidos } from './DatosRapidos';
import { BentoCategorias } from './BentoCategorias';
import { Destacado } from './Destacado';
import { MasPedidos } from './MasPedidos';
import { Opiniones } from './Opiniones';
import { PreguntasFrecuentes } from './PreguntasFrecuentes';
import { Ofertas } from './Ofertas';
import { Nosotros } from './Nosotros';
import { Horario } from './Horario';
import { ContactoDirecto } from './ContactoDirecto';

/**
 * La landing completa, en el orden del diseño: portada, datos rápidos, bento,
 * destacado, más pedidos, opiniones, preguntas, ofertas, nosotros, horario y
 * contacto directo.
 *
 * El encabezado, el `<main>`, el pie, el menú, el pedido y el asistente los
 * pinta `Carcasa`; aquí solo van las secciones.
 */
export function Landing(): JSX.Element {
  return (
    <>
      <Portada />
      <DatosRapidos />
      <BentoCategorias />
      <Destacado />
      <MasPedidos />
      <Opiniones />
      <PreguntasFrecuentes />
      <Ofertas />
      <Nosotros />
      <Horario />
      <ContactoDirecto />
    </>
  );
}
