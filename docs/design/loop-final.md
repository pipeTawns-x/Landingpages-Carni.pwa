Loop final de diseño, en tres pasadas. Trabaja sin preguntarme. Al cerrar cada pasada, deja su reporte en la página Índice y sigue con la siguiente. Si te detienes, vuelve a leer este archivo (docs/design/loop-final.md) y retoma en la pasada donde ibas.

ANTES DE EMPEZAR
1. Adjunta tus skills "Create design system", antes de tocar Componentes, y "Frontend design", en cada grupo de pantallas.
2. Lee estas carpetas del repo (rama pruebas, docs/design):
   - skills/emil-kowalski/: las reglas de animación y pulido de Emil Kowalski. Usa emil-design-eng, animate, review-animations (con STANDARDS.md), apple-design y mobile-native en cada movimiento.
   - referencias/capturas/: el nivel al que hay que llegar.
     - orbe-*: portada editorial y revelado al hacer scroll.
     - apple-*: nitidez y movimiento.
     - louisvuitton-* y oyla-joyeria-catalogo: tarjetas quietas.
     - uber-login-ilustracion: una ilustración junto al acceso.
     - verdara-kpis: KPI con minigráfico.
     - sweetgreen-recetas: recetas.
     - freitag-catalogo: catálogo con un solo tratamiento de foto.
     - django-unfold-login: el panel en Django.
   - assets/video/ y assets/mascota/: los recursos nuevos. Cada carpeta explica sus archivos en su README.md.
3. Queda revocada la regla "movimiento casi nulo" de loop-mejoras.md §0. Eduardo pidió un rediseño con animaciones: movimiento con propósito y con las reglas de Emil.
4. Esto es diseño, no código. Todo se hace en las páginas de este proyecto.

REGLAS DE TODAS LAS PASADAS
- Mejora, no rehagas. Lo aprobado se queda: la lupa, el chat, el menú, el Kanban y la transición entre Ingresar y Registrarse, que se afina pero no se cambia.
- No borres Encabezado, Tarjeta, Pie ni AdminNav.
- Nada de "Pasa" sin medir. Cada autorrevisión lleva números: contraste medido, tamaños y duraciones.
- Cada movimiento lleva una tira de 3 cuadros (inicio, mitad, final) con su duración y su curva.
- Ningún enlace en "#".
- Nada que el negocio no haga hoy. Si no existe, se marca "falta backend" o "confirmar con el dueño".

═══ PASADA 1 · Lo prometido, sin recursos nuevos ═══

1.1 Índice: la primera página. Todas las pantallas con miniatura, la etiqueta "rediseño de la captura NN" o "nueva" y un enlace a cada una.

1.2 Links reales, en el Pie, en Contacto directo (una fila para Facebook y otra para Instagram) y en Mi enlace (compartir por WhatsApp, por Facebook y con el menú de compartir del teléfono):
- Facebook: https://www.facebook.com/profile.php?id=100054786668816
- Instagram: https://www.instagram.com/carniceria.misericordia/
- WhatsApp: https://wa.me/524442715470 · +52 444 271 5470
Pon lado a lado dos variantes de los íconos de contacto para que Eduardo elija: A) monocromos, como ahora; B) glifos con su color de marca, solo en las tres tarjetas de contacto.

1.3 Mi cuenta:
- "Mis datos": nombre, teléfono, correo, contraseña y "Cerrar sesión" visible en 390 sin desplazar.
- "Recetas guardadas" pasa a ser la pestaña "Guardadas" dentro de Recetario.

1.4 Ajustes:
- Agrega "Datos de la tienda y redes": teléfono, WhatsApp, correo, dirección, horario, Facebook e Instagram. De ahí salen el Landing y el Pie.
- Si Eduardo ya dio la lista de colonias de entrega, agrega también "Zonas de entrega". Si no, no la agregues; donde Compra o Mis direcciones validen la colonia, marca "confirmar colonias con el dueño".

1.5 BuildAds: "Catálogo de la semana", una hoja A4 y un carrusel de 1080×1350 armados desde Ofertas, con "Descargar" y "Compartir".

1.6 Correcciones de oficio:
- Todo el texto del lienzo con contraste de 4.5:1 o más (hay títulos a 1.05:1 en Fundamentos) y cero imágenes rotas.
- Panel: un minigráfico de 7 días dentro de cada KPI; el eje de ventas en $0 / $5k / $10k / $15k.
- BuildAds y ProductAds: durante el asistente se oculta AdminNav y queda un "Salir" arriba.
- Textos fieles al negocio:
  - el ejemplo de "sin resultados" no puede ser la picaña, que sí se vende;
  - "Paquete Carnitas" sin "por Kilo";
  - las calorías por porción de 150 g, no "kcal por día";
  - "Revisa tu correo" sin prometer ningún tiempo.
- Recuperar contraseña: se queda con el código de 6 dígitos, marcado "falta configurar la plantilla del correo en Supabase".
- Mi nivel y Ajustes: los niveles 0 / 5 / 10 % se quedan (Eduardo los aprobó). Junto a los $50 + $50 de afiliados pon "cifras por confirmar con el dueño".
- Se pospone el monograma del logotipo.

Reporte de la pasada 1:
- una búsqueda de href="#" que dé 0 resultados;
- el Índice, Mis datos y "Datos de la tienda y redes" existen;
- el contraste medido de cada título que corregiste.

═══ PASADA 2 · Movimiento, portada, catálogo y compra ═══

2.1 Frame "Movimiento" en Componentes. Una tabla con columnas: qué se mueve, por qué, frecuencia, duración, curva y reduced-motion. Cada fila lleva su tira de 3 cuadros.
- Encabezado: altura fija. Al bajar, el subtítulo se va con opacity y translateY(−4px) en 160 ms, cubic-bezier(0.23, 1, 0.32, 1). Nunca animar height.
- Tarjeta: el hover de −2 px solo dentro de @media (hover: hover) and (pointer: fine). Al presionar, scale(0.97) en 160 ms.
- Hojas del carrito y del menú: 240–320 ms con cubic-bezier(0.32, 0.72, 0, 1); la salida es un 30 % más rápida. En móvil se cierran con un gesto.
- Catálogo → ficha: la foto de la tarjeta se convierte en la foto de la ficha (view transition).
- "Agregar" → "Agregado ✓" en 160–200 ms, y +1 en el ícono del carrito. Sin fotos volando.
- Estado del pedido: la línea de progreso se llena al avanzar de estado.
- Kanban: arrastre con resorte leve, con alternativa por teclado.
- Qué NO se anima: el scroll secuestrado en el catálogo, los contadores de KPI, los fondos a pantalla completa y nada que dependa de cada tecla en el buscador.

2.2 Portada (Landing):
- El video va a sangre: 100 % del ancho y 80–85vh, sin tarjeta ni caja negra encima. Usa assets/video/portada-carne.mp4 (10 s de mostrador, corte y carne asada, ya sin el teléfono con texto basura) y el póster portada-carne-poster.jpg (el cuchillo cortando).
- Aviso: el video mide 1280×720, así que a sangre en escritorio se ve suave. Dilo en la nota "Mejora" de esa pantalla y no lo des por resuelto.
- Titular en Fraunces, clamp(56px, 7vw, 112px), tracking −0.03em, directo sobre el video.
  - Lleva un degradado de negro de 0 % a 75 % de opacidad sobre el 45 % inferior del cuadro. El titular va dentro de esa franja, nunca en la mitad de arriba.
  - Mide el contraste sobre el cuadro más claro del video (el azulejo blanco del mostrador), no solo sobre el póster.
  - Entra palabra por palabra, con 40–60 ms entre palabras. Con reduced-motion, estático.
- Revelado de las imágenes del Landing con clip-path. Anota junto a la pantalla que se dispara una vez por carga.
- "Sobre nosotros": sin foto real, quita el hueco "por tomar". No dejes marcos vacíos.

2.3 Catálogo y fotos:
- Un solo tratamiento para toda foto nueva: el mismo fondo, la misma luz y el mismo ángulo (45° o cenital), como Louis Vuitton y Freitag.
- Una foto por producto: se elimina la regla G0.7 ("tres vecinos, una sola foto"). Si un producto no tiene foto propia, se marca "foto pendiente" en vez de repetir otra.
- Las fotos con marca de agua o destello de IA (pollo, "Otros") se marcan "reemplazar".
- Tarjeta de rejilla más quieta: foto, nombre, precio con unidad y un botón "+" de 44 px. El rojo lleno queda solo para la ficha y el carrito, y como mucho hay un botón rojo lleno por vista de rejilla.
- La ficha muestra galería solo si hay dos o más fotos distintas.
- Stock con unidad. El cliente ve "Disponible", "Pocas piezas" o "Agotado"; el número exacto (por ejemplo "18 kg") solo aparece en el panel.
- Del menú se ocultan las categorías con 0 productos (Frutas y verduras, Especias).

2.4 Compra, sin prometer lo que no existe:
- Métodos de pago:
  - primero, "Pagar al recoger o al recibir";
  - la tarjeta va como segunda opción, a través de una pasarela alojada (sin campos de tarjeta dibujados) y marcada "falta backend".
- Si el peso varía, una frase de ajuste junto al total.
- Paquetes: "Anticipo del 50 % hoy y el resto al recoger", marcado "confirmar con el dueño".
- "¿Tienes un código?" va plegado.

Reporte de la pasada 2:
- la tabla de Movimiento con sus tiras;
- la captura del Landing a 1440 sin caja negra;
- la captura del Catálogo con un solo botón rojo lleno por vista.

═══ PASADA 3 · Acceso y métricas del chatbot ═══

3.1 Acceso (Inicio de sesión del cliente). Eduardo eligió conservar al carnicero, mejorado.
- Usa solo los archivos de assets/mascota/ (lee su README.md): el mismo carnicero en dos poses, sin fondo de tienda.
- Escritorio:
  - dentro del arco crema (arch-escritorio), con la cabeza y los brazos saliendo por arriba;
  - el arco mide unos 520 px de ancho y el 57–62 % de la altura del panel;
  - el personaje queda bien parado abajo, con su sombra de contacto;
  - usa panel-escritorio-* como referencia exacta.
- Móvil (390):
  - el texto va a la izquierda del slider rojo;
  - a la derecha, el arco pequeño (arch-movil, 140×196) con el busto del carnicero (carnicero-*-busto), la cabeza completa y dentro del panel;
  - el busto ya viene recortado con la forma del arco: se apila sobre arch-movil como indica el README, sin volver a recortarlo;
  - usa panel-movil-* como referencia exacta.
- Nunca se ven dos personajes a la vez, en ningún cuadro de la tira.
- Tiempos:
  - el panel se desliza en 480 ms con cubic-bezier(0.77, 0, 0.175, 1);
  - la pose cambia en el cuadro intermedio de la tira, tapada con un blur de 2 px o menos durante 120 ms o menos;
  - en móvil, el selector se mueve en 220 ms;
  - el formulario se puede enfocar desde el primer cuadro;
  - con reduced-motion, cambio de opacidad de 150–200 ms.
- Replica el ritmo del video de prueba assets/mascota/acceso-transicion.mp4 y de su tira acceso-transicion-tira.jpg.

3.2 Métricas del chatbot. Eduardo la pidió; va con "falta backend".
- Página nueva, con "Chatbot" en AdminNav entre Clientes y BuildAds. En móvil va dentro de "Más".
- Resumen:
  - filtros Hoy · 7 días · 30 días y canal Web · WhatsApp;
  - cifras: conversaciones, personas atendidas, resueltas por el asistente, pasadas a una persona y pedidos que empezaron en el chat;
  - una gráfica de mensajes entrantes y salientes por día;
  - "Lo que más preguntan" y "Sin respuesta", con las acciones "Enseñar la respuesta" y "Pasar a preguntas frecuentes";
  - la burbuja del ayudante del panel, abierta.
- Conversación:
  - las mismas burbujas del chat de la tienda;
  - en cada respuesta del asistente, un botón "Corregir" que la guarda como respuesta aprobada;
  - al lado, la lista de correcciones activas;
  - el teléfono del cliente va enmascarado.

Reporte final:
- la tira del acceso sin dos personajes en ningún cuadro;
- las pantallas del chatbot;
- el Índice actualizado;
- lo que falta de backend, de fotos y de decisiones del dueño.
