import { useCatalogo } from '@src/data/useCatalogo';

function Insignia(): JSX.Element {
  const { origen, productos } = useCatalogo();

  return (
    <p
      role="status"
      className="fixed bottom-3 left-3 z-30 rounded-control bg-surface-2 px-2 py-1 text-meta text-text-muted"
    >
      Datos: {origen === 'vivo' ? 'vivos' : 'semilla'} · {productos.length}
    </p>
  );
}

/**
 * Dice de dónde salen los productos que se ven: de la base ("vivos") o de la
 * copia que viaja con el sitio ("semilla"). Sirve para no confundir una base
 * apagada con un catálogo vacío.
 *
 * Solo existe en desarrollo. Va del lado opuesto al lanzador del asistente.
 */
export function InsigniaDatos(): JSX.Element | null {
  if (!import.meta.env.DEV) {
    return null;
  }
  return <Insignia />;
}
