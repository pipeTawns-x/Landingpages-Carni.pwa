import { useMemo, type ReactNode } from 'react';
import { HORARIO, NEGOCIO } from '@src/data/negocio';
import { useCatalogo } from '@src/data/useCatalogo';
import { Hoja } from './Hoja';
import { ICONO_POR_CATEGORIA, IconoOtros, IconoSiguiente } from './iconos';

export interface MenuHojaProps {
  abierta: boolean;
  alCerrar: () => void;
  /** Página en la que se está: su fila queda marcada. */
  pagina: 'inicio' | 'catalogo';
}

interface FilaProps {
  href: string;
  activa?: boolean;
  /** Abre en otra pestaña y no cierra el menú. */
  externa?: boolean;
  alNavegar: () => void;
  children: ReactNode;
}

/**
 * Una fila de 48 px con chevron. Separadas por hairline, sin cajas.
 *
 * El enlace cierra la hoja al pulsarse: si el destino es esta misma página no
 * habría recarga y el menú se quedaría tapando lo que el cliente pidió ver; si
 * es otra, al volver atrás el navegador no debe restaurar el menú abierto.
 */
function Fila({ href, activa = false, externa = false, alNavegar, children }: FilaProps): JSX.Element {
  const destino = externa ? { target: '_blank', rel: 'noopener noreferrer' } : { onClick: alNavegar };

  return (
    <li>
      <a
        href={href}
        aria-current={activa ? 'page' : undefined}
        {...destino}
        className={`flex min-h-12 items-center justify-between gap-3 px-5 text-ui text-text transition-colors duration-150 ease-out-strong hover:bg-surface-2 ${
          activa ? 'bg-red/12 font-semibold' : ''
        }`}
      >
        <span>{children}</span>
        <IconoSiguiente tamano={18} className="shrink-0 text-text-muted" />
      </a>
    </li>
  );
}

function Rotulo({ children }: { children: ReactNode }): JSX.Element {
  return <h3 className="px-5 pt-5 pb-2 font-sans text-meta font-medium text-text-muted">{children}</h3>;
}

const LISTA = 'divide-y divide-border border-y border-border';

/**
 * El menú de la tienda: una hoja por la izquierda con tres grupos, Tienda,
 * Categorías y Ayuda. No lleva buscador dentro (sería una superposición sobre
 * otra); la búsqueda vive en el encabezado.
 */
export function MenuHoja({ abierta, alCerrar, pagina }: MenuHojaProps): JSX.Element {
  const { productos, categorias } = useCatalogo();

  // Solo las categorías que hoy tienen al menos un producto.
  const categoriasConProductos = useMemo(() => {
    const conProductos = new Set(productos.map((p) => p.categoria.slug));
    return categorias.filter((c) => conProductos.has(c.slug));
  }, [productos, categorias]);

  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      nombre="menu"
      lado="izquierda"
      titulo="Menú"
      etiquetaCerrar="Cerrar el menú"
    >
      <nav aria-label="Menú principal" className="pb-5">
        <Rotulo>Tienda</Rotulo>
        <ul className={LISTA}>
          <Fila href="landing.html" activa={pagina === 'inicio'} alNavegar={alCerrar}>
            Inicio
          </Fila>
          <Fila href="catalogo.html" activa={pagina === 'catalogo'} alNavegar={alCerrar}>
            Productos
          </Fila>
          <Fila href="catalogo.html#categoria=ofertas" alNavegar={alCerrar}>
            Ofertas
          </Fila>
        </ul>

        <Rotulo>Categorías</Rotulo>
        <ul className="flex flex-wrap gap-2 px-5">
          {categoriasConProductos.map((categoria) => {
            const Icono = ICONO_POR_CATEGORIA[categoria.slug] ?? IconoOtros;
            return (
              <li key={categoria.slug}>
                <a
                  href={`catalogo.html#categoria=${categoria.slug}`}
                  onClick={alCerrar}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-control px-3 text-ui text-text transition-[background-color,scale] duration-150 ease-out-strong hover:bg-surface-2 active:scale-[0.97]"
                >
                  <Icono tamano={18} className="text-sand" />
                  {categoria.nombre}
                </a>
              </li>
            );
          })}
        </ul>

        <Rotulo>Ayuda</Rotulo>
        <ul className={LISTA}>
          <Fila href="landing.html#preguntas" alNavegar={alCerrar}>
            Preguntas frecuentes
          </Fila>
          <Fila href="landing.html#contacto" alNavegar={alCerrar}>
            Contacto
          </Fila>
          <Fila href={NEGOCIO.whatsappHref} externa alNavegar={alCerrar}>
            Escribir por WhatsApp
          </Fila>
          <Fila href="accessweb.html" alNavegar={alCerrar}>
            Ingresar
          </Fila>
        </ul>
      </nav>

      <p className="px-5 pb-6 text-meta text-text-muted">
        {HORARIO.dias}, de {HORARIO.abre} a {HORARIO.cierra}. {HORARIO.cerrado}.
      </p>
    </Hoja>
  );
}
