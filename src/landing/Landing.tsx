import { useCatalogo } from '@src/data/useCatalogo';
import { CarruselCortes } from '@src/ui/CarruselCortes';
import { Comentarios } from './Comentarios';
import { Contacto } from './Contacto';
import { CONTENEDOR, IDS_CORTES, seleccionar } from './datos';
import { Familia } from './Familia';
import { HorariosPuntaje } from './HorariosPuntaje';
import { Mostrador } from './Mostrador';
import { Ofertas } from './Ofertas';
import { Populares } from './Populares';
import { Portada } from './Portada';
import { PreguntasFrecuentes } from './PreguntasFrecuentes';

/**
 * La landing completa, en el orden fijado: portada, mostrador, cortes (el
 * carrusel), populares, ofertas, preguntas, familia, horarios, contacto y
 * comentarios. El pie lo pinta `Carcasa`.
 *
 * Cada `<section>` es hija directa de `<main>` y lleva su `id`: los enlaces del
 * pie y del menú (`#preguntas`, `#contacto`) caen aquí.
 *
 * El catálogo se pide una sola vez. La primera pintura ya trae la copia del
 * catálogo, así que la página nace con su altura final; al llegar la respuesta
 * viva, las secciones se repintan con los datos de la base.
 */
export function Landing(): JSX.Element {
  const catalogo = useCatalogo();
  const cortes = seleccionar(catalogo.productos, IDS_CORTES);

  return (
    <>
      <Portada />
      <Mostrador categorias={catalogo.categorias} />

      <section id="cortes" className="pb-16 lg:pb-24">
        <div className={CONTENEDOR}>
          <CarruselCortes cortes={cortes} titulo="Cortes especiales" />
        </div>
      </section>

      <Populares productos={catalogo.productos} />
      <Ofertas productos={catalogo.productos} />
      <PreguntasFrecuentes />
      <Familia />
      <HorariosPuntaje />
      <Contacto />
      <Comentarios />
    </>
  );
}
