import { whatsappConTexto } from '@src/data/negocio';
import { IconoAbajo } from '@src/ui/iconos';
import { CONTENEDOR, PREGUNTAS_VISIBLES } from './datos';

/** `name` agrupa los `<details>`: abrir uno cierra el anterior. React 18 no lo tipa, pero el navegador lo entiende. */
const GRUPO = { name: 'preguntas' };

/**
 * "Preguntas frecuentes": `<details>` y `<summary>` nativos en filas con
 * hairline. El navegador aporta lo difícil (teclado, estado, lector de pantalla)
 * sin una línea de JavaScript.
 *
 * Escritorio: el título y el enlace a WhatsApp quedan fijos a la izquierda
 * mientras la lista corre a la derecha. Móvil: todo en una columna.
 */
export function PreguntasFrecuentes(): JSX.Element {
  return (
    <section id="preguntas" className="border-t border-border py-16 lg:py-24">
      <div className={`${CONTENEDOR} lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-seccion">Preguntas frecuentes</h2>
          <a
            href={whatsappConTexto('Hola, tengo una pregunta.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center text-ui text-sand underline underline-offset-4 transition-colors duration-150 ease-out-strong hover:text-text"
          >
            Escribir por WhatsApp
          </a>
        </div>

        <div className="mt-8 border-t border-border lg:mt-0">
          {PREGUNTAS_VISIBLES.map((item, indice) => (
            <details key={item.pregunta} open={indice === 0} {...GRUPO} className="group border-b border-border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lead font-medium transition-colors duration-150 ease-out-strong hover:text-sand [&::-webkit-details-marker]:hidden">
                {item.pregunta}
                <IconoAbajo
                  tamano={20}
                  className="shrink-0 text-sand transition-transform duration-200 ease-out-strong group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="max-w-[64ch] pr-10 pb-5 text-ui text-text-muted">{item.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
