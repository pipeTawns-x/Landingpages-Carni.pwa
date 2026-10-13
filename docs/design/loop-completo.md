Loop del rediseño completo. Trabaja hasta terminar TODO lo que sigue, sin preguntarme y sin detenerte entre secciones.

- Solo te detienes si se acaba el límite de uso. En ese caso escribe "PAUSA: sigo en <ítem>"; cuando Eduardo escriba "continúa", sigues exactamente ahí.
- Terminas únicamente cuando la TABLA FINAL tiene todas sus filas en ✓. Entonces escribe "REDISEÑO COMPLETO".

CÓMO TRABAJAR
- La pasada 1 ya está cerrada (Bitácora: 1.1 a 1.8 en CERRADO). No la rehagas.
- Trabaja ítem por ítem, en el orden de abajo.
  - Al cerrar cada ítem, anótalo en la Bitácora del Índice con: número, pantallas tocadas, valores medidos y CERRADO.
  - Si el límite te corta a medias, anótalo como "PARCIAL: falta …". Al volver, termina primero lo PARCIAL.
- Cero pendientes: ninguna pantalla queda con un hueco, un "pendiente", un "por tomar" ni una imagen rota. Lo que dependa del negocio se diseña con datos de ejemplo y lleva la etiqueta "confirmar con el dueño" o "falta backend".
- Cada pantalla nueva o cambiada va en 390 y en 1440, con su nota "De lo nuestro · De lo mío · Mejora".
- Nada de "Pasa" sin medir: contraste en x:1, tamaños en px y duraciones en ms.
- No borres Encabezado, Tarjeta, Pie ni AdminNav.
- Si algo aquí contradice loop-mejoras.md o direccion-visual.md, gana este mensaje. Las nueve excepciones de "Precedencia" de loop-final.md siguen valiendo.

RECURSOS
- Eduardo subió la carpeta "subir-a-claude-design", con video/, mascota/, datos/ y referencias/.
- Si no la ves, impórtala del repo, rama pruebas: docs/design/assets/video/, docs/design/assets/mascota/, docs/design/datos/ y docs/design/referencias/capturas/.
- Si no tienes ninguna de las dos, escribe "SIN RECURSOS: <archivo>" y sigue con el siguiente ítem que no lo necesite.
- datos/catalogo-real.md es el catálogo real: 53 productos, 9 categorías, precios, mínimos y qué productos tienen foto propia. No inventes productos.

═══ A · Índice con miniaturas reales ═══

A1. Cada ficha del Índice muestra su pantalla en miniatura viva:
- un iframe de su página, con #ancla a esa pantalla en 390;
- escalado para caber en la ficha;
- con loading="lazy", pointer-events: none, tabindex="-1" y aria-hidden="true".
Quita los huecos grises y el texto "miniatura pendiente".

A2. Si el lienzo no muestra los iframes:
- usa thumbs/NN.png, con un onerror que oculte la imagen si falta;
- deja la ficha tipográfica limpia (número, nombre, grupo y etiqueta), sin la palabra "pendiente";
- anota en la Bitácora cuál de las dos usaste.

═══ B · Movimiento, portada, catálogo y compra ═══

B1. Frame "Movimiento" en Componentes. Es una tabla con columnas: qué se mueve, por qué, frecuencia, duración, curva y reduced-motion. Cada fila lleva su tira de 3 cuadros (inicio, mitad, final), dibujada por ti.
- Encabezado: altura fija. Al bajar, el subtítulo se va con opacity y translateY(−4px) en 160 ms, cubic-bezier(0.23, 1, 0.32, 1). Nunca animar height.
- Tarjeta, dentro de @media (hover: hover) and (pointer: fine):
  - hover: translateY(−2px) en 160 ms, cubic-bezier(0.23, 1, 0.32, 1);
  - al presionar, en cualquier dispositivo: scale(0.97) en 160 ms, con la misma curva.
- Hojas del carrito y del menú: 240–320 ms con cubic-bezier(0.32, 0.72, 0, 1); la salida es un 30 % más rápida. En móvil se cierran con un gesto.
- Catálogo → ficha: la foto de la tarjeta se convierte en la foto de la ficha (view transition), en 280 ms con cubic-bezier(0.32, 0.72, 0, 1).
- "Agregar" → "Agregado ✓" en 180 ms, cubic-bezier(0.23, 1, 0.32, 1).
  - Vuelve a "Agregar" a los 1.5 s.
  - El contador del carrito sube +1 con scale 1 → 1.15 → 1 en 200 ms.
  - La hoja no se abre sola. Sin toast y sin fotos volando.
- Estado del pedido: la línea de progreso se llena en 320 ms, cubic-bezier(0.23, 1, 0.32, 1).
- Kanban: arrastre con resorte leve, sin rebote visible (unos 300 ms). Por teclado, las flechas mueven la tarjeta de columna.
- Salvo el Acceso (480 ms), nada pasa de 320 ms.
- Qué NO se anima: el scroll secuestrado del catálogo, los contadores de KPI, los fondos a pantalla completa y nada que dependa de cada tecla en el buscador.

B2. Portada (Landing).
- El video va a sangre: 100 % del ancho y 80–85vh.
  - Usa video/portada-carne.mp4, con el póster video/portada-carne-poster.jpg.
  - En la nota "Mejora" di que el video mide 1280×720 y que a sangre se ve suave.
- Sin caja negra ni tarjeta sobre el video. Una "caja negra" es un rectángulo sólido con borde o esquinas visibles. El degradado sí está permitido.
- En la primera vista solo se mueven el video y el titular. Los revelados con clip-path empiezan al hacer scroll y se disparan una vez por carga.
- El titular va en Fraunces, clamp(56px, 7vw, 112px), tracking −0.03em, alineado a la izquierda.
  - Ocupa como máximo 3 líneas en 390 y 2 en 1440, entre el 65 % y el 92 % de la altura del cuadro.
  - Debajo va un solo botón principal.
  - Entra palabra por palabra, con 40–60 ms entre palabras. Con reduced-motion, queda estático.
- Degradado de negro: 0 % al 40 % de la altura, 55 % al 65 % y 80 % en el borde inferior.
  - Mide el contraste del titular (#F5F3EF) en su línea más alta, sobre video/portada-carne-cuadro-claro.jpg. El umbral es 4.5:1.
  - Claude Code ya midió 4.96:1 en 1440 y 5.59:1 en 390 con ese degradado.
- "Sobre nosotros": sin foto real, sin marcos vacíos ni el hueco "por tomar". Resuélvelo con tipografía y datos de la tienda.

B3. Catálogo y fotos.
- Fotos:
  - Los 9 productos con foto propia la usan: los 8 Cortes Especiales y "Vacío en Oferta".
  - Los otros 44 usan la foto real de su categoría (public/img/products/…). En la ficha, esa foto lleva la leyenda "Foto ilustrativa".
  - En la rejilla, dos tarjetas vecinas no llevan la misma foto: intercala categorías o usa otro encuadre de la misma foto.
  - Nunca va una imagen de IA como foto de producto.
  - En la nota "Mejora", lista las fotos que hay que tomar y las que tienen marca de agua o destello de IA.
- Tratamiento: el mismo fondo, la misma luz y un solo ángulo para todas las fotos. Elige 45° o cenital y anótalo.
- Tarjeta de rejilla: foto, nombre, precio con unidad y un botón "+" de 44 px en contorno. Sin insignias, sin sombra fuerte y sin relleno rojo.
- Rojo lleno (#DC2626):
  - 0 en la rejilla;
  - como máximo 1 por cuadro completo de 390 y de 1440;
  - queda solo para "Agregar" en la ficha y "Pagar" en el carrito.
- La ficha muestra galería solo si hay dos o más fotos distintas.
- Stock: el cliente ve "Disponible", "Pocas piezas" o "Agotado", y al tope del contador "Es todo lo disponible". El número exacto solo aparece en el panel.
- El menú muestra solo las 9 categorías de la base. Se quitan "Frutas y verduras" y "Especias".

B4. Compra.
- Métodos de pago:
  - primero, "Pagar al recoger o al recibir";
  - segundo, la tarjeta por una pasarela alojada, sin campos de tarjeta dibujados y con "falta backend".
- Si el peso varía, una frase de ajuste junto al total.
- Mínimos: para recoger no hay mínimo; a domicilio, $150.
- Con un paquete en el carrito: "Anticipo del 50 %". El anticipo se cobra por la pasarela; "Pagar al recoger o al recibir" cubre el resto. Todo marcado "confirmar con el dueño".
- "¿Tienes un código?" va plegado.

═══ C · Acceso y métricas del chatbot ═══

C1. Acceso (Inicio de sesión del cliente). Usa solo mascota/ y lee su README.md: el mismo carnicero en dos poses.
- Escritorio:
  - el arco crema (arch-escritorio) mide 520 px y del 57 al 62 % de la altura del panel;
  - la cabeza y los brazos salen por arriba;
  - el personaje queda bien parado, con su sombra;
  - panel-escritorio-* es la referencia exacta.
- Móvil 390, dentro del panel rojo (panel-movil-*, 358×232):
  - el título va a la izquierda, a 20 px del borde izquierdo y a 22 px del superior, con unos 172 px de ancho;
  - a la derecha va arch-movil (140×196) con carnicero-*-busto encima, ya recortado; se apila como dice el README.
- Transición:
  - el panel se desliza en 480 ms con cubic-bezier(0.77, 0, 0.175, 1); en móvil, el selector en 220 ms;
  - la pose cambia con un corte duro a mitad del recorrido, tapado con un blur de 2 px o menos durante 120 ms o menos;
  - nunca hay un fundido ni se ven dos personajes;
  - el formulario se puede enfocar desde el primer cuadro;
  - con reduced-motion, un cambio de opacidad de 150–200 ms.
- La tira lleva 5 cuadros (0, 25, 50, 75 y 100 %) en 390 y en 1440, cada uno con "1 carnicero". Replica el ritmo de mascota/acceso-transicion.mp4.

C2. Métricas del chatbot. Todo lleva "falta backend".
- Referencias: el video de Kilian Párraga (minuto 31) muestra mensajes entrantes y salientes de 30 días, interacciones y usuarios únicos. No abras YouTube. Para la pantalla 45 usa referencias/chatgpt-asistente.jpg.
- En AdminNav, "Chatbot" va entre Clientes y BuildAds. En móvil va dentro de "Más".
- 43 Resumen:
  - filtros Hoy · 7 días · 30 días y canal Web · WhatsApp;
  - 6 cifras: conversaciones, personas atendidas, resueltas por el asistente, pasadas a una persona, pedidos que empezaron en el chat y clientes que marcaron "me sirvió";
  - la gráfica de mensajes entrantes y salientes por día;
  - "Lo que más preguntan": al menos 5 temas, con su conteo y su tendencia;
  - "Sin respuesta", con "Enseñar la respuesta" y "Pasar a preguntas frecuentes".
- 44 Conversación, con las burbujas del chat de la tienda:
  - "Corregir" en cada respuesta del asistente, que se guarda como respuesta aprobada;
  - al lado, la lista de correcciones activas, con "editar" y "apagar";
  - el teléfono enmascarado, por ejemplo +52 ••• ••• ••34.
- 45 Ayudante del panel: la burbuja abierta, contestando "¿cuánto vendí esta semana?" y "¿qué cortes se están agotando?".

═══ TABLA FINAL (todas en ✓ para escribir "REDISEÑO COMPLETO") ═══
- Índice: todas las fichas con miniatura viva o thumbs/NN.png; 0 imágenes rotas y 0 "pendiente".
- Movimiento: una fila por cada movimiento de B1, B2 y C1, con duración, curva y tira.
- Portada: video a sangre sin caja negra; titular a 4.5:1 o más sobre el cuadro más claro; 1 botón principal.
- Catálogo: 0 rellenos rojos en la rejilla y como máximo 1 por cuadro; 0 vecinas con la misma foto; "Foto ilustrativa" en las fichas que la usan; solo las 9 categorías.
- Compra: pago al recoger primero; tarjeta segunda con "falta backend"; 0 campos de tarjeta; $150 a domicilio; anticipo con paquete.
- Acceso: tira de 5 cuadros con 1 carnicero en cada uno, en 390 y en 1440.
- Chatbot: 43, 44 y 45 completas y AdminNav con Clientes · Chatbot · BuildAds.
- En todo el proyecto:
  - 0 href="#";
  - 0 "PARCIAL" en la Bitácora;
  - 0 "pendiente", "por tomar" o "miniatura pendiente";
  - 0 imágenes rotas;
  - todo texto a 4.5:1 o más.
- Índice actualizado y Bitácora con A1–C2 en CERRADO.

Al terminar escribe "REDISEÑO COMPLETO", pega la tabla con sus números y di: "Eduardo: exporta el .zip para que Claude Code lo verifique."
