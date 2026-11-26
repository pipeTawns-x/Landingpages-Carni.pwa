import { useState, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Asistente } from '@src/asistente/Asistente';
import type { EstadoRaiz } from '@src/redux/store';
import type { Product } from '@src/types/database';
import { CarritoHoja } from './CarritoHoja';
import { Encabezado } from './Encabezado';
import { InsigniaDatos } from './InsigniaDatos';
import { LupaHoja } from './LupaHoja';
import { MenuHoja } from './MenuHoja';
import { Pie } from './Pie';

export interface CarcasaProps {
  pagina: 'inicio' | 'catalogo';
  /** True solo en la landing: el contenido arranca bajo el encabezado, sobre el video. */
  sobrePortada?: boolean;
  children: ReactNode;
}

type Superposicion = 'menu' | 'carrito' | 'buscar' | null;

/**
 * Lo que comparten la landing y el catálogo: encabezado, contenido, pie, menú,
 * pedido y asistente.
 *
 * Nunca hay dos superposiciones abiertas a la vez: `abierta` es un solo valor.
 * El asistente lleva su propio estado y se abre sobre cualquiera de las dos
 * porque, al ser modal, ninguna otra cosa puede recibir un clic mientras tanto.
 */
export function Carcasa({ pagina, sobrePortada = false, children }: CarcasaProps): JSX.Element {
  const [abierta, setAbierta] = useState<Superposicion>(null);
  const cuenta = useSelector((estado: EstadoRaiz) => estado.carrito.length);

  const cerrar = (): void => setAbierta(null);

  /**
   * Elegir un corte en la búsqueda sigue yendo a `products.html` con el producto
   * en el hash, que es a donde iban las páginas viejas. Cuando el catálogo
   * termine de mudarse a `catalogo.html` con su propia ruta de detalle, esta es
   * la línea que cambia — y solo esta.
   */
  const elegirProducto = (producto: Product): void => {
    window.location.href = `products.html#/producto/${producto.id}`;
  };

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:bg-sand focus:px-4 focus:py-2.5 focus:text-ui focus:font-medium focus:text-bg"
      >
        Saltar al contenido
      </a>

      <Encabezado
        sobrePortada={sobrePortada}
        cuenta={cuenta}
        menuAbierto={abierta === 'menu'}
        carritoAbierto={abierta === 'carrito'}
        buscarAbierto={abierta === 'buscar'}
        alAbrirMenu={() => setAbierta('menu')}
        alAbrirCarrito={() => setAbierta('carrito')}
        alAbrirBuscar={() => setAbierta('buscar')}
      />

      <div className="flex min-h-dvh flex-col">
        <main
          id="contenido"
          tabIndex={-1}
          className={`flex-1 outline-none ${
            sobrePortada ? '' : 'pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-[calc(4.5rem+env(safe-area-inset-top))]'
          }`}
        >
          {children}
        </main>
        <Pie />
      </div>

      <MenuHoja abierta={abierta === 'menu'} alCerrar={cerrar} pagina={pagina} />
      <CarritoHoja abierta={abierta === 'carrito'} alCerrar={cerrar} />
      <LupaHoja abierta={abierta === 'buscar'} alCerrar={cerrar} alElegir={elegirProducto} />
      <Asistente pagina={pagina} />
      {import.meta.env.DEV ? <InsigniaDatos /> : null}
    </>
  );
}
