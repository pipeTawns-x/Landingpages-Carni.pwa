import { useEffect, useRef, useState, type RefObject } from 'react';
import type { CategoriaVista } from '@src/data/catalogo';
import { CeldaBento } from '@src/ui/Tarjeta';
import { CATEGORIAS_BENTO, CONTENEDOR } from './datos';

export interface MostradorProps {
  categorias: readonly CategoriaVista[];
}

/** Retraso entre la entrada de una celda y la siguiente, en ms. */
const ESCALON_MS = 80;

/**
 * La entrada escalonada del mostrador (postmortem E5): las celdas entran una
 * tras otra (opacidad de 0 a 1 y `translateY(18px)`, 0.45 s, retraso por
 * celda) cuando la rejilla entra en pantalla.
 *
 * Es mejora progresiva y se puede apagar de tres formas, y en todas el
 * contenido queda visible:
 *   - sin IntersectionObserver (jsdom, navegadores viejos): visible ya;
 *   - con `prefers-reduced-motion: reduce`: no se esconde nunca;
 *   - si el observador nunca avisa: visible ya, porque se dispara con un
 *     respaldo de scroll como el del encabezado.
 *
 * El traslado lo pinta CSS con `translate` y `opacity` (solo GPU); el
 * retardo por celda llega como `transition-delay` en línea.
 */
function useEntradaEscalonada(): { ref: RefObject<HTMLDivElement | null>; visible: boolean } {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observador.observe(nodo);

    // Respaldo por scroll, como el del encabezado: si el observador falla o
    // llega tarde, el estado se corrige igual. Los dos escriben lo mismo.
    let cuadro = 0;
    const evaluar = (): void => {
      cuadro = 0;
      const caja = nodo.getBoundingClientRect();
      if (caja.top < window.innerHeight * 0.85) {
        setVisible(true);
      }
    };
    const alScrollear = (): void => {
      if (cuadro === 0) {
        if (typeof window.requestAnimationFrame === 'function') {
          cuadro = window.requestAnimationFrame(evaluar);
        } else {
          evaluar();
        }
      }
    };
    window.addEventListener('scroll', alScrollear, { passive: true });

    return () => {
      observador.disconnect();
      window.removeEventListener('scroll', alScrollear);
      window.cancelAnimationFrame?.(cuadro);
    };
  }, []);

  return { ref, visible };
}

/**
 * "Todo lo del mostrador": las nueve categorías de la tienda como un bento.
 *
 * Móvil: dos columnas, con Carnes rojas a lo ancho. Escritorio: cuatro columnas,
 * con Carnes rojas en 2×2. Cinco celdas llevan foto y cuatro son tipográficas
 * (las de fotos vetadas), y eso da el ritmo sin inventar imágenes.
 *
 * El nombre sale del catálogo y el orden, la descripción y la foto de
 * `CATEGORIAS_BENTO`. Una categoría que el catálogo no trae no se pinta. No hay
 * cifras de productos: un conteo caducaría en cuanto cambie el inventario.
 */
export function Mostrador({ categorias }: MostradorProps): JSX.Element {
  const { ref, visible } = useEntradaEscalonada();
  let celdasPintadas = 0;

  return (
    <section id="mostrador" className="pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div className={CONTENEDOR}>
        <h2 className="text-seccion">Todo lo del mostrador</h2>

        <div ref={ref} className="mt-8 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4 lg:gap-4">
          {CATEGORIAS_BENTO.map((entrada) => {
            const categoria = categorias.find((c) => c.slug === entrada.slug);
            if (!categoria) {
              return null;
            }
            const orden = celdasPintadas;
            celdasPintadas += 1;
            return (
              <CeldaBento
                key={entrada.slug}
                slug={entrada.slug}
                nombre={categoria.nombre}
                descripcion={entrada.descripcion}
                href={`catalogo.html#categoria=${entrada.slug}`}
                foto={entrada.foto}
                posicion={entrada.posicion}
                grande={entrada.grande}
                entrada={visible ? 'visible' : 'pendiente'}
                retrasoMs={visible ? orden * ESCALON_MS : 0}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
