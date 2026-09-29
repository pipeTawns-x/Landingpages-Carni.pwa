Loop final de diseño, versión 2.1. Son tres pasadas. Hoy ejecutas solo la PASADA 1; las siguientes llegan con un mensaje corto: "Sigue con la PASADA N".

CÓMO TRABAJAR
- Trabaja ítem por ítem, sin preguntarme.
- Al cerrar cada ítem, anótalo en la Bitácora del Índice con:
  - su número;
  - las pantallas que tocaste;
  - los valores medidos: contraste en x:1, tamaños en px y duraciones en ms;
  - su estado: CERRADO o PARCIAL.
  El Índice es el ítem 1.1; créalo primero.
- Si te cortas, o si tu indicador de uso pasa del 80 %:
  - termina el ítem en curso;
  - si no alcanzas, anótalo en la Bitácora como "PARCIAL: falta …", nunca como cerrado, y detente.
  - Antes del 80 % no te detengas, salvo al cerrar una pasada. Si no ves el indicador, sigue hasta que te corten.
- Al volver:
  - relee este archivo (docs/design/loop-final.md, rama pruebas) y la Bitácora;
  - retoma primero los ítems PARCIAL y luego el primer ítem sin anotar;
  - nunca rehagas un ítem CERRADO, salvo que Claude Code te mande "Correcciones de la PASADA N". En ese caso corrige solo esos puntos, anótalos en la Bitácora y escribe "CORRECCIONES N LISTAS".
- Al cerrar la pasada:
  1. Revisa como abogado del diablo: los 3 puntos más débiles de la pasada y cómo los resolviste.
  2. Llena la tabla de aceptación de la pasada con lo que mediste, no con "Pasa".
  3. Escribe el reporte en la Bitácora y en el chat. Empieza con "PASADA N LISTA" y termina con "Eduardo: exporta el proyecto como .zip y avísale a Claude Code antes de la siguiente pasada." Luego detente.
- loop-agentico.md y loop-estado.md son del orquestador de Claude Code. No los sigas.

ANTES DE EMPEZAR
1. Adjunta tus skills:
   - "Create design system", antes de tocar Componentes;
   - "Frontend design", en cada grupo de pantallas.
2. Lee el repo por partes (rama pruebas, docs/design), no todo al inicio:
   - datos/catalogo-real.md: el catálogo real, sacado de la base. Son 53 productos en 9 categorías, con precios, mínimos y fotos. Úsalo desde la pasada 1 y no inventes productos.
   - capturas-actuales/: el sitio de hoy. Al tocar una pantalla, compárala con su captura. No abras las 59 de golpe.
   - En la pasada 2:
     - skills/emil-kowalski/, con las reglas de animación de Emil Kowalski. En cada movimiento usa emil-design-eng, animate, review-animations (con STANDARDS.md), apple-design y mobile-native.
     - referencias/capturas/:
       - orbe-*: portada editorial y revelado al hacer scroll.
       - apple-*: nitidez y movimiento.
       - louisvuitton-* y oyla-joyeria-catalogo: tarjetas quietas.
       - verdara-kpis: KPI con minigráfico.
       - sweetgreen-recetas: recetas.
       - freitag-catalogo: catálogo con un solo tratamiento de foto.
       - django-unfold-login: el panel en Django.
     - assets/video/, con su README.md.
   - En la pasada 3: assets/mascota/, con su README.md, más uber-login-ilustracion y chatgpt-asistente de referencias/capturas/.
   - Si no puedes abrir docs/design/ de la rama pruebas, escribe "SIN ACCESO AL REPO" y detente. No inventes referencias ni recursos.
3. Precedencia: si este archivo contradice loop-mejoras.md o direccion-visual.md, gana este archivo.
   - Este archivo sustituye a loop-mejoras.md §0 en cómo se corre: bloques, ritmo, informe final y "movimiento casi nulo".
   - De esos dos archivos siguen vigentes los criterios G0 a G14, los tokens, la disposición del lienzo (§1) y las reglas anti-slop, salvo en estos puntos, donde gana este archivo:
     1. "máx. 1-2 elementos animados por vista" se sustituye por la tabla de Movimiento de 2.1, y "solo opacity y transform" admite clip-path en los revelados de 2.2;
     2. "solo ease-out exponencial" admite las curvas de este archivo y un resorte leve, sin rebote visible, en el Kanban;
     3. el Display de direccion-visual.md §2 y §2.1 no rige para el titular de la Portada, que se rige por 2.2; el press de la Tarjeta es el de 2.1;
     4. G2.7 no rige: 2.1 pide "Agregado ✓", sin toast;
     5. G7.3 no rige: en 2.3 el cliente no ve el número exacto de stock;
     6. G0.7, G6.3, la variación de recorte de loop-mejoras.md §0 y direccion-visual.md §5 no rigen: 2.3 pide una foto por producto;
     7. "una sola familia de íconos, sin color de marca" no rige en la variante B de las tarjetas de contacto de 1.3;
     8. BuildAds ya no está congelado (1.7 y 1.8);
     9. "cálido solo en la portada y en los estados vacíos" no rige para el Acceso (3.1).
4. Esto es diseño, no código. Todo se hace en las páginas de este proyecto.

REGLAS DE TODAS LAS PASADAS
- Lo aprobado se queda, salvo donde un ítem de este archivo lo nombra: lupa (1.8), menú (1.4 y 2.3), Kanban (2.1), Ingresar y Registrarse (3.1), Landing (2.2), Catálogo y ficha (2.3). Lo que ningún ítem nombra no se toca.
- No borres Encabezado, Tarjeta, Pie ni AdminNav.
- Cada pantalla nueva o cambiada va en móvil 390 y en escritorio 1440, con su nota "De lo nuestro · De lo mío · Mejora".
- Nada de "Pasa" sin medir. Cada autorrevisión lleva números: contraste medido, tamaños y duraciones.
- Cada movimiento lleva una tira de 3 cuadros (inicio, mitad, final) con su duración y su curva. El Acceso lleva 5 (ver 3.1).
- Ningún enlace en "#".
- Nada que el negocio no haga hoy. Lo que no exista se marca "falta backend" o "confirmar con el dueño".

═══ PASADA 1 · Lo prometido ═══

1.1 Índice. Es la primera página. Un solo tablero con todas las pantallas, agrupadas en: Componentes · Tienda · Cuenta del cliente · Compra · Mi cuenta · Panel administrativo · Métricas del chatbot · Inventario Django · BuildAds y ProductAds.
- Cada pantalla lleva su número, su nombre, su miniatura móvil, un enlace a su página y una etiqueta: "rediseño de la captura NN", o "nueva" si no existía en el sitio.
- Conserva la numeración de la 43 a la 48: 43 Resumen, 44 Conversación, 45 Ayudante del panel, 46 Recetas guardadas, 47 Mis datos y 48 Ajustes. Las pantallas nuevas de este loop van desde la 49.
- Al final va la sección Bitácora.

1.2 Logotipo.
- El logotipo tipográfico del Encabezado, "CARNICERÍA · EL SEÑOR DE LA MISERICORDIA", reemplaza la foto del letrero y el sello redondo en todo el sitio: tienda, acceso, panel e inventario Django.
- Afínalo: espaciado, grosor y las líneas del subtítulo.
- En Componentes agrega una variante cuadrada (monograma) para el ícono de la app, el favicon y la foto de perfil de Facebook e Instagram.

1.3 Links reales. Van en el Pie, en Contacto directo del Landing (una fila para Facebook y otra para Instagram) y en Mi enlace (compartir por WhatsApp, por Facebook y con el menú de compartir del teléfono).
- Facebook: https://www.facebook.com/profile.php?id=100054786668816
- Instagram: https://www.instagram.com/carniceria.misericordia/
- WhatsApp: https://wa.me/524442715470 · +52 444 271 5470
Pon lado a lado dos variantes de los íconos de contacto para que Eduardo elija: A) monocromos, como ahora; B) glifos con su color de marca, solo en las tres tarjetas de contacto.

1.4 Mi cuenta.
- "Mis datos": nombre, teléfono, correo, contraseña y "Cerrar sesión", visible en 390 sin desplazar. Va en el menú de Mi cuenta.
- "Recetas guardadas", en el menú, lleva a la pestaña "Guardadas" del Recetario, con su estado vacío.

1.5 Ajustes. Agrega tres secciones y diseña el detalle de las dos primeras:
- "Datos de la tienda y redes": teléfono, WhatsApp, correo, dirección, horario, Facebook e Instagram. De aquí salen el Landing y el Pie.
- "Zonas de entrega": las colonias que cubre el domicilio, las mismas que valida Mis direcciones. Los datos de ejemplo van marcados "confirmar colonias con el dueño".
- "Asistente": en qué horario contesta y cuándo pasa la conversación a WhatsApp. Lleva "falta backend".

1.6 Paquetes. La fuente es el Catálogo 2024 de la tienda, que dice textualmente "Todo paquete se requiere un 50% de anticipo" y "Los precios pueden ser modificados según la alta demanda". En la tienda se escribe así:
- en las tarjetas de los 3 paquetes reales de Ofertas (datos/catalogo-real.md): "Todo paquete requiere un 50 % de anticipo." y "Los precios pueden modificarse según la alta demanda.";
- en Compra, cuando el carrito lleva un paquete: "Anticipo del 50 %". Con paquete en el carrito, "Pagar al recoger o al recibir" cubre solo el resto; el anticipo se cobra con la pasarela alojada de 2.4, marcada "falta backend".
- Todo va marcado "confirmar con el dueño", incluido cómo y cuándo se cobra el anticipo.

1.7 BuildAds · "Catálogo de la semana". Hoy la tienda arma su catálogo a mano en Canva.
- La pieza se arma sola con las ofertas y los cortes del sitio, en hoja A4 y en carrusel de Instagram de 1080×1350. Para el ejemplo usa las 4 ofertas reales de datos/catalogo-real.md, con sus precios.
- Lleva "Descargar" y "Compartir".
- Déjala lista para exportar a Canva.

1.8 Correcciones de oficio.
- Todo el texto del lienzo con contraste de 4.5:1 o más (hay títulos a 1.05:1 en Fundamentos) y cero imágenes rotas.
- Panel: un minigráfico de 7 días dentro de cada KPI; el eje de ventas en $0 / $5k / $10k / $15k.
- BuildAds y ProductAds: durante el asistente se oculta AdminNav y queda un "Salir" arriba.
- Textos fieles al negocio:
  - el ejemplo de "sin resultados" de la lupa no puede ser la picaña, que sí se vende;
  - "Paquete Carnitas" sin "por Kilo";
  - las calorías por porción de 150 g, no "kcal por día";
  - "Revisa tu correo" sin prometer ningún tiempo.
- Recuperar contraseña: se queda con el código de 6 dígitos, marcado "falta configurar la plantilla del correo en Supabase".
- Mi nivel y Ajustes: los niveles 0 / 5 / 10 % se quedan, porque Eduardo los aprobó. Junto a los $50 + $50 de afiliados pon "cifras por confirmar con el dueño".

Aceptación de la pasada 1 (con números):
- búsqueda de href="#": 0 resultados;
- existen el Índice, Mis datos, "Datos de la tienda y redes", "Zonas de entrega" y "Asistente";
- el Índice tiene tantas fichas como pantallas del proyecto, cada una con sus cinco datos y con la numeración de 1.1;
- logotipo tipográfico en tienda, acceso, panel e inventario Django: 0 fotos del letrero y 0 sellos redondos;
- el monograma, entregado en 512×512 (ícono de la app), 32×32 y 16×16 (favicon) y 320×320 con recorte circular, y legible a 16 px;
- las tres URLs de 1.3 en el Pie y en Contacto directo, y las 3 acciones de Mi enlace;
- Mis datos, con "Cerrar sesión" completo, en un cuadro de 390×844 sin desplazar;
- "Recetas guardadas" con 3 recetas de ejemplo y con su estado vacío;
- las frases de 1.6 en todas las tarjetas de paquete (anota cuántas son) y la del anticipo en Compra con paquete;
- "Catálogo de la semana" en A4 y en 1080×1350, con "Descargar" y "Compartir";
- cada KPI del panel con su minigráfico de 7 días (anota cuántos son) y el eje de ventas en $0 / $5k / $10k / $15k;
- 0 resultados al buscar "picaña" en el ejemplo de "sin resultados", "por Kilo" junto a "Paquete Carnitas", "kcal por día" y cualquier plazo junto a "Revisa tu correo";
- la tabla de contraste lista todos los estilos de texto del lienzo (color sobre su fondo), no solo los títulos corregidos, y ninguno baja de 4.5:1;
- 0 imágenes rotas.

═══ PASADA 2 · Movimiento, portada, catálogo y compra ═══

2.1 Frame "Movimiento" en Componentes. Es una tabla con columnas: qué se mueve, por qué, frecuencia, duración, curva y reduced-motion. Cada fila lleva su tira de 3 cuadros.
- assets/movimiento/ todavía no existe, así que dibuja tú la tira de cada fila. Si Claude Code la crea antes de esta pasada, úsala como referencia exacta y no la redibujes.
- Filas:
  - Encabezado: altura fija. Al bajar, el subtítulo se va con opacity y translateY(−4px) en 160 ms, cubic-bezier(0.23, 1, 0.32, 1). Nunca animar height.
  - Tarjeta, solo dentro de @media (hover: hover) and (pointer: fine):
    - hover: translateY(−2px) en 160 ms, cubic-bezier(0.23, 1, 0.32, 1);
    - al presionar, en cualquier dispositivo: scale(0.97) en 160 ms, con la misma curva.
  - Hojas del carrito y del menú: 240–320 ms con cubic-bezier(0.32, 0.72, 0, 1); la salida es un 30 % más rápida. En móvil se cierran con un gesto.
  - Catálogo → ficha: la foto de la tarjeta se convierte en la foto de la ficha (view transition), en 280 ms con cubic-bezier(0.32, 0.72, 0, 1).
  - "Agregar" → "Agregado ✓" en 180 ms, cubic-bezier(0.23, 1, 0.32, 1).
    - Vuelve a "Agregar" a los 1.5 s.
    - El contador del carrito sube +1 con scale 1 → 1.15 → 1 en 200 ms.
    - La hoja del carrito no se abre sola. Sin toast y sin fotos volando.
  - Estado del pedido: la línea de progreso se llena en 320 ms, cubic-bezier(0.23, 1, 0.32, 1), al avanzar de estado.
  - Kanban: arrastre con resorte leve, sin rebote visible (unos 300 ms percibidos). Por teclado: las flechas mueven la tarjeta de columna.
- Salvo el Acceso (480 ms, en 3.1), ningún movimiento pasa de 320 ms.
- Qué NO se anima: el scroll secuestrado en el catálogo, los contadores de KPI, los fondos a pantalla completa y nada que dependa de cada tecla en el buscador.

2.2 Portada (Landing).
- El video va a sangre: 100 % del ancho y 80–85vh.
  - Usa assets/video/portada-carne.mp4: 10 s de mostrador, corte y carne asada, ya sin el teléfono con texto basura.
  - El póster es portada-carne-poster.jpg, el cuchillo cortando.
- Aviso: el video mide 1280×720, así que a sangre en escritorio se ve suave. Dilo en la nota "Mejora" de esa pantalla y no lo des por resuelto.
- "Caja negra" es un rectángulo de color sólido con borde o esquinas visibles. No lleva ninguna, ni tarjeta encima. El degradado de abajo, que empieza en 0 %, sí está permitido.
- En la primera vista solo se mueven el video y el titular. Los revelados empiezan al hacer scroll.
- El titular va en Fraunces, clamp(56px, 7vw, 112px), tracking −0.03em, alineado a la izquierda y directo sobre el video.
  - Ocupa como máximo 3 líneas en 390 y 2 en 1440.
  - Va entre el 65 % y el 92 % de la altura del cuadro, nunca en la mitad de arriba.
  - Debajo del titular, dentro de la franja, va un solo botón principal.
  - Entra palabra por palabra, con 40–60 ms entre palabras. Con reduced-motion, queda estático.
- Degradado de negro sobre el video: 0 % al 40 % de la altura, 55 % al 65 % y 80 % en el borde inferior.
  - Claude Code lo midió sobre assets/video/portada-carne-cuadro-claro.jpg, el cuadro más claro del video en el segundo 1.29.
  - En la zona del titular, ese cuadro pide hasta 51 % de negro para llegar a 4.5:1. El degradado anterior, de 0 a 75 % sobre el 45 % inferior, solo daba 25 % a esa altura.
- Mide el contraste del titular (#F5F3EF) en su línea más alta, sobre portada-carne-cuadro-claro.jpg. El umbral es 4.5:1. Si no llega, sube el degradado (hasta 90 %) o baja el titular, y anota cuál usaste.
- Las imágenes del Landing se revelan con clip-path, una sola vez por carga. Anótalo junto a la pantalla.
- "Sobre nosotros": como no hay foto real, quita el hueco "por tomar". No dejes marcos vacíos.

2.3 Catálogo y fotos.
- Toda foto nueva lleva un solo tratamiento: el mismo fondo, la misma luz y un solo ángulo, 45° o cenital, como Louis Vuitton y Freitag. Elige el ángulo y anota cuál.
- assets/fotos-referencia/ todavía no existe. Donde falte foto, pon "foto pendiente". Si Claude Code la crea, úsala solo como dirección de arte, rotulada "Referencia, no es el producto".
- Una foto por producto: se elimina la regla G0.7 ("tres vecinos, una sola foto"). Si un producto no tiene foto propia, se marca "foto pendiente" en vez de repetir otra. Según datos/catalogo-real.md, solo 9 de los 53 productos tienen foto propia: los 8 Cortes Especiales y "Vacío en Oferta". Un marcador "foto pendiente" no cuenta como foto repetida; la misma fotografía en dos productos distintos, sí.
- Las fotos con marca de agua o destello de IA (pollo, "Otros") se marcan "reemplazar".
- Tarjeta de rejilla: foto, nombre, precio con unidad y un botón "+" de 44 px en contorno, sin relleno rojo. "Más quieta" quiere decir: sin insignias, sin sombra fuerte y sin rojo lleno. Conserva el hover de 2.1.
- Rojo lleno (#DC2626):
  - en la rejilla del Catálogo hay 0 botones con relleno #DC2626;
  - en cada cuadro completo de 390 y de 1440 (encabezado, filtros y rejilla juntos) hay como máximo 1;
  - el rojo lleno queda para "Agregar" en la ficha y "Pagar" en el carrito.
  - Reporta el conteo de cada cuadro.
- La ficha muestra galería solo si hay dos o más fotos distintas.
- El stock va con unidad. El cliente ve "Disponible", "Pocas piezas" o "Agotado"; el número exacto (por ejemplo "18 kg") solo aparece en el panel. Al tope del contador, la ficha dice "Es todo lo disponible", sin número.
- El menú muestra solo las 9 categorías reales de datos/catalogo-real.md. "Frutas y verduras" y "Especias" no existen en la base: se quitan.

2.4 Compra, sin prometer lo que no existe.
- Métodos de pago:
  - primero, "Pagar al recoger o al recibir";
  - la tarjeta va como segunda opción, a través de una pasarela alojada, sin campos de tarjeta dibujados, y marcada "falta backend".
- Si el peso varía, pon una frase de ajuste junto al total.
- Mínimos reales de la base: para recoger no hay mínimo; a domicilio el mínimo es $150.
- Paquetes: como en 1.6.
- "¿Tienes un código?" va plegado.

Aceptación de la pasada 2:
- la tabla de Movimiento con una fila por cada movimiento de 2.1, 2.2 y 3.1, cada una con duración, curva y tira;
- el video al 100 % del ancho y 80–85vh, con la nota "Mejora" que dice que mide 1280×720;
- el titular a 4.5:1 o más en su línea más alta, medido sobre portada-carne-cuadro-claro.jpg, y con el degradado que usaste anotado;
- 0 cajas negras y 0 tarjetas sobre el video, y 1 solo botón principal en la franja;
- 0 botones con relleno #DC2626 en la rejilla del Catálogo, y como máximo 1 por cuadro completo de 390 y de 1440;
- el cliente ve solo "Disponible", "Pocas piezas" o "Agotado", y el número exacto solo en el panel;
- el menú con solo las 9 categorías de la base;
- en Compra, "Pagar al recoger o al recibir" va primero, la tarjeta va segunda con "falta backend" y hay 0 campos de tarjeta dibujados;
- 0 marcos vacíos en "Sobre nosotros";
- 0 fotos repetidas entre productos distintos.

═══ PASADA 3 · Acceso y métricas del chatbot ═══

3.1 Acceso (Inicio de sesión del cliente). Eduardo eligió conservar al carnicero, mejorado.
- Usa solo los archivos de assets/mascota/ (lee su README.md): el mismo carnicero en dos poses, sin fondo de tienda.
- Escritorio:
  - va dentro del arco crema (arch-escritorio), con la cabeza y los brazos saliendo por arriba;
  - el arco mide unos 520 px de ancho y del 57 al 62 % de la altura del panel;
  - el personaje queda bien parado abajo, con su sombra de contacto;
  - usa panel-escritorio-* como referencia exacta.
- Móvil (390):
  - dentro del panel rojo (panel-movil-*, 358×232), el título va a la izquierda: a 20 px del borde izquierdo, a 22 px del borde superior y con unos 172 px de ancho;
  - a la derecha va el arco pequeño (arch-movil, 140×196) con el busto encima (carnicero-*-busto), la cabeza completa y dentro del panel;
  - el busto ya viene recortado con la forma del arco: se apila sobre arch-movil como indica el README, sin volver a recortarlo;
  - al cambiar entre Ingresar y Registrarse, el selector se mueve en 220 ms y la pose cambia con un corte duro a mitad de ese recorrido, tapado con un blur de 2 px o menos durante 120 ms o menos. Nunca hay un fundido entre los dos paneles.
- Nunca se ven dos personajes a la vez.
- Tiempos en escritorio:
  - el panel se desliza en 480 ms con cubic-bezier(0.77, 0, 0.175, 1);
  - la pose cambia a mitad del recorrido, tapada con un blur de 2 px o menos durante 120 ms o menos;
  - el formulario se puede enfocar desde el primer cuadro;
  - con reduced-motion, basta un cambio de opacidad de 150–200 ms.
- La tira del Acceso lleva 5 cuadros, en 390 y en 1440: el 0, 25, 50, 75 y 100 % del recorrido. Bajo cada cuadro se anota cuántos carniceros se ven: 1 en los 5.
- Replica el ritmo del video de prueba assets/mascota/acceso-transicion.mp4 y de su tira acceso-transicion-tira.jpg.

3.2 Métricas del chatbot. Eduardo la pidió; todo lleva "falta backend".
- Referencias:
  - El minuto 31 del video de Kilian Párraga muestra una pantalla "Métricas del Chatbot" con los mensajes entrantes y salientes de 30 días, el total de interacciones y los usuarios únicos. No abras YouTube: basta esta descripción.
  - Si existen docs/design/referencias/capturas/chatbot-*.jpg, úsalos.
  - Para la pantalla 45 usa chatgpt-asistente.jpg.
  - Parte de ahí y hazla útil para la carnicería.
- En AdminNav, "Chatbot" va entre Clientes y BuildAds. En móvil va dentro de "Más".
- 43 Resumen:
  - filtros Hoy · 7 días · 30 días y canal Web · WhatsApp;
  - cifras: conversaciones, personas atendidas, resueltas por el asistente, pasadas a una persona, pedidos que empezaron en el chat y clientes que marcaron "me sirvió";
  - una gráfica de mensajes entrantes y salientes por día;
  - "Lo que más preguntan": temas ordenados (horario, pedido mínimo, zonas, precios, qué corte para asar…), cada uno con su conteo y su tendencia;
  - "Sin respuesta": lo que el asistente no supo contestar, con dos acciones, "Enseñar la respuesta" y "Pasar a preguntas frecuentes".
- 44 Conversación, con las mismas burbujas del chat de la tienda:
  - en cada respuesta del asistente hay un botón "Corregir": el administrador escribe cómo debió contestar y lo guarda como respuesta aprobada, que el asistente usa desde ese momento;
  - al lado va la lista de correcciones activas, que se pueden editar o apagar;
  - el teléfono del cliente va enmascarado, por ejemplo +52 ••• ••• ••34.
- 45 Ayudante del panel: la burbuja del asistente dentro del panel, abierta, contestando preguntas del negocio como "¿cuánto vendí esta semana?" o "¿qué cortes se están agotando?".

Aceptación final:
- 43 con 6 cifras, 3 periodos, 2 canales, 1 gráfica de 2 series y al menos 5 temas con conteo y tendencia, y "Sin respuesta" con sus 2 acciones;
- 44 con "Corregir" en cada respuesta del asistente, la lista de correcciones con "editar" y "apagar", y el teléfono enmascarado;
- 45 con la burbuja abierta y las 2 preguntas de ejemplo;
- AdminNav con Clientes · Chatbot · BuildAds en 1440, y "Chatbot" dentro de "Más" en 390;
- 43, 44 y 45 con la etiqueta "falta backend";
- la tira del Acceso con 480 ms, cubic-bezier(0.77, 0, 0.175, 1), blur de 2 px o menos durante 120 ms o menos, y 1 carnicero en cada uno de sus 5 cuadros, en 390 y en 1440;
- el Índice actualizado con todas las pantallas;
- lo que falta de backend, de fotos y de decisiones del dueño.
