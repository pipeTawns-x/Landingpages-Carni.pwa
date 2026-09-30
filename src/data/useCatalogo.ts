import { useEffect, useState } from 'react';
import { CATALOGO_SEMILLA, cargarCatalogo, type Catalogo } from './catalogo';

export interface EstadoCatalogo extends Catalogo {
  estado: 'cargando' | 'listo';
}

/**
 * Primer render con la semilla: la página nace con contenido y con su altura
 * final, así que no hay salto de maquetación ni rueda de carga. Al llegar la
 * respuesta real (o vencer el tiempo) se cambia una sola vez.
 *
 * Es una constante de módulo para que la referencia sea estable entre
 * componentes y no provoque repintados por sí sola.
 */
const ESTADO_INICIAL: EstadoCatalogo = { ...CATALOGO_SEMILLA, estado: 'cargando' };

export function useCatalogo(): EstadoCatalogo {
  const [estado, setEstado] = useState<EstadoCatalogo>(ESTADO_INICIAL);

  useEffect(() => {
    let vigente = true;

    void cargarCatalogo().then((catalogo) => {
      if (vigente) {
        setEstado({ ...catalogo, estado: 'listo' });
      }
    });

    return () => {
      vigente = false;
    };
  }, []);

  return estado;
}
