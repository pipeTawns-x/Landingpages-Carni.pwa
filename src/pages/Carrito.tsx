/**
 * El pedido como PAGINA, y no solo como cajon.
 *
 * El cajon lateral (`CartPanel`) sigue existiendo y sigue siendo el atajo: se
 * abre encima del catalogo sin sacar al cliente de donde estaba. Lo que no
 * puede hacer un cajon es tener direccion propia. Un ticket que se puede
 * enlazar, recargar y mandar por WhatsApp necesita una ruta, y esa ruta es
 * `#/carrito`.
 *
 * Esta pagina NO tiene estado propio ni vuelve a leer `localStorage`. Lee del
 * store, que es donde vive el pedido desde que se movio a Redux; quien lo
 * hidrata desde el almacenamiento es `usePedido`, montado una sola vez en
 * `CarritoGlobal` por fuera de `<Routes>`. Volver a hidratar aqui seria una
 * segunda copia de la misma logica compitiendo por la misma llave.
 */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { OrderList } from '@src/components/OrderList/OrderList';
import { formatearPrecio } from '@src/lib/formatearPrecio';
import { quitarProducto } from '@src/redux/slices/carritoSlice';
import type { Despacho, EstadoRaiz } from '@src/redux/store';

/*
 * La deuda que este archivo declaraba —«el formateador es local, y es la sexta
 * copia de este mismo bloque en el repo»— esta pagada: las seis copias viven
 * ahora en `src/lib/formatearPrecio.ts`. Aqui se pide la variante `ticket`, con
 * centavos, porque el total de una hoja de pedido tiene que cuadrar al centavo
 * con lo que suman sus lineas.
 */

/**
 * La hoja del ticket.
 *
 * Reusa los tokens de `.ficha` en redesign.css —misma tinta, mismo acento,
 * misma crema— en vez de inventar una paleta nueva: es la misma tienda y la
 * misma pagina HTML.
 *
 * Lo que NO se reusa es la clase `.ficha` entera, y es a proposito. A partir de
 * 900px esa clase se vuelve una rejilla con `grid-template-areas`, y una rejilla
 * asi COLOCA SOLA a cualquier hijo que no tenga area asignada: el ticket habria
 * quedado partido en dos columnas contra el hueco vacio de la foto. Es la misma
 * trampa que ya esta documentada en redesign.css junto a esa regla.
 */
const Hoja = styled.section`
  --tinta: #f4f1ea;
  --tenue: rgba(244, 241, 234, 0.62);
  --linea: rgba(244, 241, 234, 0.14);
  --acento: #c8302f;
  --crema: #e2cfa4;
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1.25rem 4rem;
  color: var(--tinta);

  .carrito__volver {
    display: inline-block;
    min-height: 44px;
    line-height: 44px;
    color: var(--tenue);
    text-decoration: none;
    font-size: 0.82rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .carrito__volver:hover {
    color: var(--tinta);
  }

  .carrito__marca {
    margin: 0 0 0.5rem;
    font-size: 0.7rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tenue);
  }

  .carrito__titulo {
    margin: 0 0 0.25rem;
    font-size: clamp(1.75rem, 6vw, 2.4rem);
    line-height: 1.1;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .carrito__conteo {
    margin: 0 0 1.75rem;
    font-size: 0.85rem;
    color: var(--tenue);
  }

  .carrito__resumen {
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--linea);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .carrito__resumen span {
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--tenue);
  }

  .carrito__resumen strong {
    font-size: 1.9rem;
    font-weight: 600;
    color: var(--crema);
  }

  .carrito__nota {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: var(--tenue);
  }

  /* El enlace de vuelta se dibuja como el boton de la ficha porque, con el
     pedido vacio, es la unica accion que queda en la pantalla. Un enlace de
     texto ahi dentro se lee como una nota al pie, no como la salida. */
  .carrito__cta {
    display: block;
    width: 100%;
    min-height: 52px;
    line-height: 52px;
    margin-top: 1.5rem;
    border-radius: 2px;
    background: var(--acento);
    color: #fff;
    font-size: 0.86rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: center;
    text-decoration: none;
    transition: filter 0.18s ease;
  }

  .carrito__cta:hover {
    filter: brightness(1.1);
  }
`;

export function Carrito(): JSX.Element {
  const lineas = useSelector((estado: EstadoRaiz) => estado.carrito);
  const despachar = useDispatch<Despacho>();

  /**
   * El total se calcula aqui y no se pide prestado a `usePedido`.
   *
   * Ese hook tambien devuelve el total, pero montarlo en esta pagina montaria
   * de nuevo TODO lo que trae consigo: el enlace al boton `#cartBtn` del
   * encabezado estatico, los escuchas de `storage` y `cart:updated`, y el
   * bloqueo del scroll del `body`. `CarritoGlobal` ya lo tiene montado por
   * fuera de las rutas, asi que serian dos copias peleandose por el mismo boton
   * y por el mismo `overflow`. Una suma de tres lineas sale mas barata que eso.
   */
  const total = useMemo(
    () => lineas.reduce((suma, linea) => suma + linea.pricePerKg * linea.quantity, 0),
    [lineas]
  );

  const vacio = lineas.length === 0;

  return (
    <Hoja className="carrito">
      <nav aria-label="Dónde estás">
        <Link className="carrito__volver" to="/">
          Todo el catálogo
        </Link>
      </nav>

      <p className="carrito__marca">Carnicería El Señor de La Misericordia</p>
      <h1 className="carrito__titulo">Tu pedido</h1>
      <p className="carrito__conteo">
        {lineas.length === 1 ? '1 producto' : `${lineas.length} productos`}
      </p>

      {/* La lista es el MISMO componente que pinta el cajon lateral. El mensaje
          de pedido vacio tambien sale de ahi, asi que esta pagina no lo vuelve a
          escribir: si esa frase cambia, cambia en los dos sitios a la vez. */}
      <OrderList order={lineas} onRemove={(lineId) => despachar(quitarProducto(lineId))} />

      {vacio ? (
        <Link className="carrito__cta" to="/">
          Ver el catálogo
        </Link>
      ) : (
        <div className="carrito__resumen">
          <span>Total</span>
          <strong>{formatearPrecio(total, 'ticket')}</strong>
        </div>
      )}

      {vacio ? null : (
        <p className="carrito__nota">
          El total definitivo lo calcula el servidor con el precio del día.
        </p>
      )}
    </Hoja>
  );
}

export default Carrito;
