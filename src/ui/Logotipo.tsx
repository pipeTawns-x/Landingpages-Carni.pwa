export interface LogotipoProps {
  tamano: 'encabezado' | 'pie';
}

/**
 * La marca, escrita. Cero imágenes: es texto, así pesa lo mismo que una línea
 * y nunca se ve borrosa.
 *
 * "CARNICERÍA" va ya en mayúsculas en el texto, no con una clase de estilo. El
 * subtítulo queda entre dos líneas de 1 px, como el sello de una etiqueta de
 * mostrador.
 *
 * En el encabezado el subtítulo mide unos 250 px a 13 px de cuerpo y necesita el
 * centro completo: junto a los tres botones de 44 px solo cabe desde unos
 * 520 px de ancho. Por debajo se oculta y queda "CARNICERÍA" sola; el nombre
 * completo sigue en la etiqueta del enlace y en la portada.
 */
export function Logotipo({ tamano }: LogotipoProps): JSX.Element {
  const ocultaSubtitulo = tamano === 'encabezado' ? 'max-[519px]:hidden' : '';

  return (
    <span className="flex flex-col items-center gap-1 leading-none text-text">
      <span className="pl-[0.22em] font-sans text-ui font-semibold tracking-[0.22em]">CARNICERÍA</span>
      <span className={`flex items-center gap-2 whitespace-nowrap text-meta tracking-[0.16em] text-text-muted ${ocultaSubtitulo}`}>
        <span aria-hidden="true" className="h-px w-4 bg-border" />
        EL SEÑOR DE LA MISERICORDIA
        <span aria-hidden="true" className="h-px w-4 bg-border" />
      </span>
    </span>
  );
}
