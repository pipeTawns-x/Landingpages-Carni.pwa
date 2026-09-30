import { useSelector } from 'react-redux';
import type { EstadoRaiz } from '@src/redux/store';
import { Encabezado } from '@src/ui/Encabezado';
import { Pie } from '@src/ui/Pie';
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
 * La landing completa, en el orden exacto del diseño (07 — Landing completa):
 * portada, datos rápidos, bento, destacado, más pedidos, opiniones,
 * preguntas, ofertas, nosotros, horario, contacto directo, pie.
 *
 * El botón flotante del asistente ("¿Te ayudo con el corte?") NO se
 * renderiza. El diseño lo pide cableado al chat existente
 * (js/modules/chatbot.js), pero ese chat solo tiene estilo a través de
 * css/components/_chatbot.scss — una hoja que depende de variables CSS y de
 * un @keyframes definidos en el resto de la hoja 7-1 del sitio viejo
 * (--carni-gold, pulse-ring), no autocontenida. Cargar esa hoja en esta
 * página aislada de Tailwind iba contra la decisión de aislamiento (nada de
 * Bootstrap/SCSS heredado aquí), y reescribirle el estilo de cero era
 * rediseñar un componente que el encargo pide explícitamente NO rediseñar.
 * Es el camino que el propio encargo deja abierto: "otherwise do not render
 * it and report it". Reportado también en la entrega.
 */
export function Landing(): JSX.Element {
  const cuenta = useSelector((estado: EstadoRaiz) => estado.carrito.length);

  return (
    <>
      <Encabezado cuenta={cuenta} />
      <main>
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
      </main>
      <Pie />
    </>
  );
}
