Rediseño completo, versión final. Trabaja sin preguntarme, un punto a la vez, y verifica cada punto antes de seguir.

PASO 0 · VERIFICACIÓN PREVIA (antes de tocar nada)
1. Confirma que en el proyecto están los archivos que subió Eduardo (uploads/):
   - video-portada-carne.mp4, video-portada-carne-poster.jpg y video-portada-carne-cuadro-claro.jpg;
   - mascota-panel-escritorio-ingresar.webp, mascota-panel-escritorio-registro.webp, mascota-panel-movil-ingresar.webp, mascota-panel-movil-registro.webp, mascota-arch-escritorio.webp, mascota-arch-movil.webp, mascota-carnicero-ingresar-busto.webp, mascota-carnicero-registro-busto.webp, mascota-acceso-transicion-tira.jpg y mascota-README.md;
   - los 16 thumbs-*.jpg (uno por página);
   - datos-catalogo-real.md.
   Si falta alguno, escribe "FALTA: <archivo>" y detente sin trabajar.
2. Escribe la tabla "Estado actual": cada punto de abajo con ✓ si ya cumple o ✗ si no, con su evidencia. Trabaja solo los ✗. No toques lo que ya está en ✓.

CÓMO TRABAJAR
- Haz los puntos en este orden: 1, 2, 3, 4, 5 y 6.
- Al terminar cada punto, revísalo contra su "Se verifica", con números.
  - Si cumple: anótalo en la Bitácora del Índice como CERRADO, con las medidas, y sigue sin preguntar.
  - Si no cumple: corrígelo una vez y vuelve a verificar.
  - Si sigue sin cumplir: escribe "BLOQUEADO: <punto> — <motivo>" y detente. No sigas con el siguiente punto.
- Si se acaba el límite de uso: escribe "PAUSA: sigo en <punto>". Cuando Eduardo escriba "continúa", retoma ahí.
- Cero pendientes: ningún hueco, "pendiente", "por tomar", imagen rota ni href="#".
- Cada pantalla que cambies va en 390 y en 1440.
- Cada página abre con su pantalla principal arriba; las variantes y notas van después.
- Datos reales de datos-catalogo-real.md. Lo que el negocio aún no tiene se diseña con ejemplo y la etiqueta "ejemplo · confirmar con el dueño" o "falta backend".
- No borres Encabezado, Tarjeta, Pie ni AdminNav.

1 · LANDING, EN ESTE ORDEN EXACTO
En "Landing completa", que va primero en la página, de arriba a abajo:
1. Portada. Video a sangre con video-portada-carne.mp4 y su póster.
   - Degradado de negro: 0 % al 40 % de la altura, 55 % al 65 % y 80 % abajo.
   - El titular "Cortes del día para tu asador" va a 4.5:1 o más sobre video-portada-carne-cuadro-claro.jpg, con un solo botón principal.
2. Todo lo del mostrador (se queda como está).
3. Filete Mignon como CARRUSEL:
   - usa las fotos propias de los 8 Cortes Especiales, una a la vez;
   - se desliza con el dedo en móvil y lleva flechas en escritorio;
   - puntos de posición, sin autoplay, con scroll-snap.
4. Lo que se lleva la gente (se queda como está).
5. Ofertas: va ANTES de Preguntas frecuentes. Lleva los 3 paquetes y "Vacío en Oferta", con su anticipo del 50 %.
6. Preguntas frecuentes.
7. Carnicería de familia, pieza por pieza.
8. Horarios y puntaje: el horario de atención y la calificación de la tienda (estrellas y número de opiniones, "ejemplo · confirmar con el dueño").
9. Contacto y dirección: teléfono, WhatsApp, correo y dirección con mapa.
10. Comentarios: de 3 a 6 opiniones de clientes (nombre, estrellas y texto) rotuladas "ejemplo". En producción salen de Google o Facebook ("falta backend"). Va justo antes del Pie.
11. Pie.

Se verifica:
- lista los títulos de la Landing completa en orden, y deben coincidir 1 a 1 con esta lista;
- el carrusel tiene 8 fotos, puntos y flechas;
- Comentarios es la última sección antes del Pie;
- el contraste del titular medido.

2 · ÍNDICE
- La primera página es "Índice del rediseño". Lleva una ficha por página, 16 en total, en el orden del proyecto.
- Cada ficha lleva:
  - su miniatura real, thumbs-<página>.jpg de uploads/, a todo lo ancho de la ficha;
  - número, nombre, grupo y cuántas pantallas tiene;
  - un enlace a la página;
  - debajo, la lista numerada de sus pantallas, cada una con enlace.
- Quita todos los huecos grises y la palabra "pendiente".
- La Bitácora va al final del Índice.

Se verifica: 16 fichas con imagen que carga, 0 "pendiente" y todos los enlaces abren su página.

3 · ACCESO (Ingresar y Registrarse)
- Escritorio: usa mascota-panel-escritorio-ingresar.webp y mascota-panel-escritorio-registro.webp tal cual, como referencia exacta:
  - arco crema de 520 px;
  - el carnicero con la cabeza y los brazos saliendo por arriba y con su sombra.
- Móvil 390: dentro del panel rojo de 358×232:
  - el título a la izquierda, a 20 px del borde izquierdo y a 22 px del superior;
  - a la derecha, mascota-arch-movil.webp con el busto encima (mascota-carnicero-*-busto.webp), como dice mascota-README.md.
- Transición:
  - el panel se desliza en 480 ms con cubic-bezier(0.77, 0, 0.175, 1); en móvil, el selector en 220 ms;
  - la pose cambia con un corte duro a mitad del recorrido, con un blur de 2 px o menos durante 120 ms o menos;
  - nunca un fundido ni dos personajes a la vez;
  - el formulario se puede enfocar desde el primer cuadro.
- La tira lleva 5 cuadros (0, 25, 50, 75 y 100 %), en 390 y en 1440. Bajo cada uno: "1 carnicero".

Se verifica:
- las 4 imágenes de la mascota en uso;
- 1 carnicero en cada uno de los 10 cuadros;
- Ingresar y Registrarse completos en 390 y en 1440.

4 · MÉTRICAS DEL CHATBOT (pantallas 43, 44 y 45, todo con "falta backend")
- AdminNav: "Chatbot" va entre Clientes y BuildAds. En móvil va dentro de "Más".
- 43 Resumen:
  - filtros Hoy · 7 días · 30 días y canal Web · WhatsApp;
  - 6 cifras: conversaciones, personas atendidas, resueltas por el asistente, pasadas a una persona, pedidos que empezaron en el chat y "me sirvió";
  - la gráfica de mensajes entrantes y salientes por día;
  - "Lo que más preguntan": al menos 5 temas, con conteo y tendencia;
  - "Sin respuesta", con "Enseñar la respuesta" y "Pasar a preguntas frecuentes".
- 44 Conversación:
  - las burbujas del chat de la tienda;
  - "Corregir" en cada respuesta del asistente;
  - la lista de correcciones, con "editar" y "apagar";
  - el teléfono enmascarado, por ejemplo +52 ••• ••• ••34.
- 45 Ayudante del panel: la burbuja abierta respondiendo "¿cuánto vendí esta semana?" y "¿qué cortes se están agotando?". Usa referencia-chatgpt-asistente.jpg.

Se verifica: las 3 pantallas en 390 y en 1440, y AdminNav con Clientes · Chatbot · BuildAds.

5 · MOVIMIENTO (un frame en Componentes)
- Es una tabla: qué se mueve, por qué, frecuencia, duración, curva y reduced-motion. Cada fila lleva su tira de 3 cuadros.
- Filas:
  - Encabezado: subtítulo con opacity y translateY(−4px) en 160 ms, cubic-bezier(0.23, 1, 0.32, 1).
  - Tarjeta: hover de −2 px en 160 ms (solo con puntero fino) y press scale(0.97) en 160 ms.
  - Hojas del carrito y del menú: 240–320 ms con cubic-bezier(0.32, 0.72, 0, 1); la salida es un 30 % más rápida.
  - Catálogo → ficha: view transition en 280 ms.
  - "Agregar" → "Agregado ✓" en 180 ms; el contador del carrito +1 en 200 ms; sin toast.
  - Estado del pedido: la línea de progreso en 320 ms.
  - Kanban: resorte sin rebote; con teclado, las flechas mueven la tarjeta.
  - Acceso: 480 ms (punto 3).
  - Portada: el titular entra palabra por palabra, 40–60 ms entre palabras; el revelado con clip-path, una vez por carga.
- Qué NO se anima: el scroll secuestrado, los contadores de KPI y los fondos a pantalla completa.

Se verifica: 9 filas, cada una con duración, curva y tira.

6 · CIERRE
- En "Catálogo y ficha", la "foto pendiente" que queda pasa a ser la foto real de su categoría, con la leyenda "Foto ilustrativa".
- La Bitácora queda sin ningún PARCIAL.
- El Índice queda actualizado.
- Escribe la TABLA FINAL con los puntos 1 a 6 en ✓ y sus números.
- Escribe "REDISEÑO COMPLETO" y di: "Eduardo: exporta el .zip para que Claude Code lo verifique."
