// Comportamiento del encabezado al hacer scroll — el de Louis Vuitton.
//
// Dos estados y nada más:
//
//   sobre el video   → transparente, texto blanco. La foto se ve entera.
//   pasado el video  → BLANCO sólido, texto negro, y ahí se queda pegado.
//
// El blanco es lo que hace que el encabezado conviva con la página en vez de
// flotar como una barra ajena. Es la diferencia que se ve al bajar en
// la.louisvuitton.com: la barra deja de ser una capa encima y pasa a ser parte
// del documento.
//
// La versión anterior de este archivo solo sabía ponerse negro —añadía
// `scrolled-dark` y nunca `scrolled-light`— así que el estado claro estaba
// escrito en el CSS y no lo activaba nadie.
(function () {
  const header = document.getElementById('mainHeader');
  if (!header) return;

  // Solo la landing tiene video detrás. En el resto de páginas el encabezado
  // ya nace sólido y no hay nada que alternar.
  const hero = document.querySelector('.home-hero-video');

  // El cambio ocurre un poco ANTES de que el video termine de salir. Esperar al
  // píxel exacto deja un tramo en el que el texto blanco del encabezado cae
  // sobre el fondo oscuro de la siguiente sección sin ningún velo detrás.
  const MARGEN = 80;

  function puntoDeCambio() {
    if (!hero) return 0;
    return Math.max(hero.offsetHeight - MARGEN, 0);
  }

  function actualizar() {
    const solido = !hero || window.scrollY >= puntoDeCambio();
    header.classList.toggle('main-header--solid', solido);
    // `--over-media` es lo que lo mantiene transparente. Se quita en cuanto
    // deja de haber medio detrás; si no, las dos reglas pelean.
    header.classList.toggle('main-header--over-media', !solido);
  }

  let esperando = false;
  window.addEventListener(
    'scroll',
    () => {
      if (esperando) return;
      esperando = true;
      window.requestAnimationFrame(() => {
        actualizar();
        esperando = false;
      });
    },
    { passive: true }
  );

  // El alto del video cambia al girar el teléfono, y con él el punto de cambio.
  window.addEventListener('resize', actualizar, { passive: true });

  // El estado inicial se aplica SIEMPRE.
  //
  // Antes esto vivía detrás de `if (!prefersReduced)`, así que quien pidiera
  // menos movimiento se quedaba sin el estado correcto —no sin la animación:
  // sin el estado—. Recargar la página a media altura dejaba un encabezado
  // transparente sobre contenido claro. `prefers-reduced-motion` decide si algo
  // se ANIMA, nunca si algo es correcto; esa distinción la maneja la hoja de
  // estilos, que apaga la transición y deja el color.
  actualizar();
})();
