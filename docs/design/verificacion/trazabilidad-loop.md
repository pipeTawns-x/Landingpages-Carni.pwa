# Trazabilidad del loop final (v2) contra los pedidos de Eduardo y el loop del 2026-09-23

Verificador independiente, con contexto limpio. Postura de abogado del diablo aplicada solo a la pregunta de cobertura. No se editó el loop.

- Objeto bajo prueba: `docs/design/loop-final.md` (2 526 palabras, tres pasadas).
- Fuentes: `verificacion/fuentes/pedidos-eduardo.md` (P1 a P18), `verificacion/fuentes/loop-2026-09-23.md` (8 ítems), `loop-mejoras.md`, `direccion-visual.md` (que `loop-mejoras.md` declara vigente), `loop-agentico.md`, `loop-estado.md` y los README de `assets/mascota/` y `assets/video/`.
- Comprobaciones hechas: existencia de cada archivo citado (`test -e`, `eza`), dimensiones y duración de los assets (`ffprobe`), lectura de la tira `acceso-transicion-tira.jpg`, cotejo carácter por carácter de las URLs y de las citas del Catálogo 2024 con la memoria del proyecto (`redes-y-catalogo-carniceria.md`).
- Límite: no se abrió Claude Design. Lo que dependa de su estado interno (por ejemplo, si el Recetario ya tiene la pestaña "Guardadas") queda marcado como no verificable.

Claves de las tablas:

- CT = "CÓMO TRABAJAR". AE = "ANTES DE EMPEZAR" (puntos 1 a 4). RG = "REGLAS DE TODAS LAS PASADAS".
- AC1 y AC2 = "Aceptación de la pasada 1 y 2". ACF = "Aceptación final".
- §1.1 a §3.2 = ítems numerados de `loop-final.md`.
- "Riesgo N" remite a la sección 9 de este informe.

## 1. Veredicto

No está listo para pegarse tal cual. Ocho defectos permiten que Claude Design omita, malinterprete o haga a medias un ítem y aun así cierre con "PASADA N LISTA", y los criterios del verificador en `loop-agentico.md` (U2, U6, U9) repiten los mismos huecos, de modo que nadie lo detectaría. La cobertura del contenido no es el problema (ver tablas A a D); la capacidad de comprobarla, sí.

**El defecto que lo mata: el Riesgo 1.** El pedido P18 exige "que se verifique que de verdad hace las mejoras", y ni `loop-final.md` ni `loop-agentico.md` miden las URLs de 1.3, "Recetas guardadas", los paquetes de 1.6 ni el "Catálogo de la semana" de 1.7. Los pedidos P7 y P8 de Eduardo no tienen criterio de aceptación en ningún archivo.

## 2. Resultado en cifras

| Tabla | Filas | CUBIERTO | PARCIAL | FALTA | CONTRADICE | Fuera del loop |
|---|---|---|---|---|---|---|
| A. Pedidos P1 a P18 | 18 | 10 | 5 | 0 | 0 | 3 |
| B. Los 8 ítems del 09-23, a nivel de detalle | 49 | 44 | 5 | 0 | 0 | 0 |
| C. Reglas transversales del 09-23 | 8 | 7 | 1 | 0 | 0 | 0 |
| D. Reglas antiguas que el loop nuevo contradice | 13 | 0 | 1 | 0 | 12 | 0 |

Ninguna fila completa está en FALTA. Sí faltan sub-partes dentro de filas PARCIAL: los kits de tododeia (P13) y la comparación contra las referencias (P12).

## 3. Tabla A. Pedidos de Eduardo (P1 a P18)

| Pedido | Dónde está en loop-final.md | Estado | Nota |
|---|---|---|---|
| P1. Índice de todas las pantallas | §1.1; AC1 ("existen el Índice"); ACF ("el Índice actualizado") | CUBIERTO | AC1 solo mide que el Índice exista, no que esté completo (riesgo 1). Se perdió el rango 01 a 48 (I1.b). |
| P2. La lupa se queda | RG, 1.ª viñeta ("Lo aprobado se queda: la lupa") | CUBIERTO | §1.8 modifica el ejemplo de "sin resultados" de esa misma lupa y RG no admite excepciones (riesgo 2). |
| P3. El logotipo tipográfico reemplaza al logo en imagen | §1.2; AC1 (0 fotos del letrero, 0 sellos redondos) | CUBIERTO | El monograma queda fuera de AC1 (riesgo 1). |
| P4. Links reales de Facebook, Instagram y WhatsApp, y "todo lo que falte" | §1.3; §1.5 ("Datos de la tienda y redes") | CUBIERTO | Las tres URLs coinciden carácter por carácter con las del 09-23 y con la memoria del proyecto. AC1 mide solo `href="#"`, no que las URLs estén puestas. La variante B contradice reglas vigentes (D11). |
| P5. Métricas del chatbot; el administrador corrige al asistente; el asistente ayuda al administrador | §3.2 (pantallas 43, 44 y 45); ACF | CUBIERTO | La referencia es un video de YouTube que Claude Design no puede abrir (riesgo 4). ACF solo verifica que existan las pantallas y el orden de AdminNav (riesgo 1). |
| P6. Perfil completo: Mis datos, Recetas guardadas, datos de la tienda en Ajustes | §1.4; §1.5; AC1 | PARCIAL | Recetas guardadas quedó solo con su estado vacío (I5.a). La pestaña "Guardadas" del Recetario se da por existente y no es verificable desde el repo. |
| P7. Paquetes con 50 % de anticipo, como dice el Catálogo 2024 | §1.6; §2.4 ("Paquetes: como en 1.6") | CUBIERTO | Las citas del catálogo están reescritas y "hoy" y "al recoger" son afirmaciones nuevas que chocan con §2.4 (riesgo 7). Sin línea de aceptación (riesgo 1). |
| P8. Catálogo de la semana en BuildAds | §1.7 | CUBIERTO | Sin línea de aceptación (riesgo 1). "Lista para exportar a Canva" no dice qué dibujar. |
| P9. Antes de cualquier código: lista de diferencias entre el diseño y la web actual, cada una cuestionada, y esperar confirmación | Fuera del loop de Claude Design (`loop-agentico.md`, "Cierre", punto 3). Traspaso: AE 4 | FUERA DEL LOOP | Traspaso correcto en lo mínimo: AE 4 ("Esto es diseño, no código") impide que Claude Design toque código. La lista y la espera son del orquestador. |
| P10. Acceso: la transición gusta pero "se ven dos imágenes"; edición profesional del carnicero | §3.1; RG ("se afina pero no se cambia"); ACF | CUBIERTO | "Nunca dos personajes a la vez" es coherente con el README y con la tira de prueba (un solo carnicero en cada uno de sus 3 cuadros). El caso móvil se puede leer mal y no se puede comprobar (riesgo 8). |
| P11. Llegar al nivel de las referencias (Motion Sites, htmlrev, refero, HorizonX, Apple, OYLA) | AE 2 (lista de `referencias/capturas/`) | CUBIERTO | Las 13 capturas citadas existen y cada una tiene superficie asignada. "Nivel" no se mide y ningún criterio pide nombrar la referencia usada. `chatgpt-asistente.jpg` existe y no se cita. |
| P12. Comparar las capturas actuales con lo de Claude Design y con las referencias | AE 2 ("Compara cada pantalla nueva o cambiada con su captura"); RG (nota "De lo nuestro · De lo mío · Mejora") | PARCIAL | Hay comparación con la captura y ninguna con la referencia. El verificador de `loop-agentico.md` mide con Playwright; comparar contra capturas y referencias no es explícito. Reponer en RG: la nota pasa a "De lo nuestro · De lo mío · Mejora · Referencia usada". |
| P13. Rediseño con animaciones: Hyperframes, skills de Emil Kowalski y kits de tododeia | §2.1; §2.2; §3.1; AE 2 y 3 | PARCIAL | Emil: cubierto (las cinco skills citadas existen). Hyperframes: no se nombra en `loop-final.md`; en `loop-agentico.md` solo lo usa el agente estudio-visual en U3 (opcional, pendiente). Kits de tododeia: FALTA en ambos archivos; la skill `tododeia-animaciones` sigue sin instalar (`docs/PENDIENTES.md`, línea 449). |
| P14. "No tienes excusa por la cual no hacer imágenes": mejorar las imágenes | §2.2 (video y póster); §2.3 ("foto pendiente", "reemplazar"); §3.1 (mascota); §1.8 (0 imágenes rotas) | PARCIAL | Los assets de video y mascota existen. Para fotos de producto el loop elige "foto pendiente": es una decisión consciente (`loop-agentico.md`, U4: una imagen de IA no pasa por foto de producto), pero P14 queda sin imagen nueva de producto. `assets/fotos-referencia/` no existe (riesgo 4). |
| P15. Solo mejoras en Claude Design; nada de código hasta que él autorice | AE 4 | CUBIERTO | Reforzado por el cierre de `loop-agentico.md` ("No empieces código"). |
| P16. Guardar avances, revisar, medir el límite de 5 h y pausar solo entre 80 y 90 %, sin perder trabajo | Fuera del loop de Claude Design (skill `punto-de-control`, `loop-agentico.md`). Traspaso: CT | FUERA DEL LOOP | Traspaso parcial. Bitácora y parada por pasada correctas. Faltan el umbral 80 a 90 % ("si ves que se acerca el límite de uso" no es medible) y un estado PARCIAL: "suelta el ítem" más "nunca rehagas un ítem ya anotado" pierde el ítem soltado (riesgo 3). |
| P17. Que el loop use agentes, skills y conectores; investigar plugins oficiales de Anthropic y generadores de imágenes gratis | Fuera del loop de Claude Design. Traspaso: AE 1 y 2 | FUERA DEL LOOP | Traspaso correcto: skills nombradas y rutas verificadas. Claude Design no usa agentes ni conectores. `loop-agentico.md` cubre agentes, skills y un generador gratuito (U4), pero ninguna unidad investiga plugins oficiales de Anthropic ni conectores. |
| P18. Que el loop termine en la última pasada y se verifique que de verdad hace las mejoras | CT (cierre: "PASADA N LISTA" y "detente"; "Claude Code verifica tu exportación .zip"); ACF | PARCIAL | Termina en la pasada 3. La verificación es de Claude Code (fuera del loop) y el traspaso existe, pero queda ciega para P4 (URLs), P6 (Recetas guardadas), P7 y P8: ni `loop-final.md` ni `loop-agentico.md` (U2, U6, U9) los miden (riesgo 1). Tampoco prevé la ronda "CORRECCIONES N LISTAS" (riesgo 3). |

## 4. Tabla B. Los 8 ítems del loop del 2026-09-23, a nivel de detalle

Correspondencia de numeración: ítem 1 del 09-23 = §1.1; ítem 2 = §1.3; ítem 3 = §1.2; ítem 4 = §3.2; ítem 5 = §1.4; ítem 6 = §1.5; ítem 7 = §1.6; ítem 8 = §1.7.

| Ítem del 09-23 | Dónde está en loop-final.md | Estado | Nota |
|---|---|---|---|
| **Ítem 1. ÍNDICE** | | | |
| I1.a. Página nueva "Índice", la primera de la lista | §1.1 ("Es la primera página") | CUBIERTO | — |
| I1.b. "Un solo tablero con las pantallas 01 a 48" | §1.1 ("todas las pantallas") | PARCIAL | Se perdió el rango 01 a 48 y la numeración de las pantallas 46, 47 y 48. Solo 43, 44 y 45 conservan número (§3.2). El Índice nace en la pasada 1 y el grupo "Métricas del chatbot" no tiene pantallas hasta la pasada 3, así que puede renumerarse o quedar vacío. Reponer: riesgo 1, línea sobre el Índice. |
| I1.c. Nueve grupos, con esos nombres y en ese orden | §1.1 | CUBIERTO | Idénticos y en el mismo orden. |
| I1.d. Cada pantalla con número, nombre, miniatura móvil, enlace y etiqueta "rediseño de la captura NN" o "nueva" | §1.1 | CUBIERTO | AC1 solo mide que el Índice exista. |
| I1.e. Al terminar, actualizar el Índice y dejar el reporte final de backend y fotos | ACF; CT ("Escribe el reporte") | CUBIERTO | Se suman las "decisiones del dueño". El Índice solo se exige actualizado al final de la pasada 3. |
| **Ítem 2. LINKS REALES** | | | |
| I2.a. Facebook: `https://www.facebook.com/profile.php?id=100054786668816` | §1.3 | CUBIERTO | Idéntica. |
| I2.b. Instagram: `https://www.instagram.com/carniceria.misericordia/` | §1.3 | CUBIERTO | Idéntica. |
| I2.c. WhatsApp `https://wa.me/524442715470` y teléfono +52 444 271 5470 | §1.3 | CUBIERTO | Idénticos. |
| I2.d. Pie con íconos de Facebook, Instagram y WhatsApp | §1.3 ("Van en el Pie") | CUBIERTO | La palabra "íconos" ya no aparece para el Pie; la cubren las variantes A y B. |
| I2.e. Contacto directo del Landing: fila "Síguenos en Facebook" y otra igual para Instagram | §1.3 | PARCIAL | Se perdió el rótulo "Síguenos en Facebook". La variante B habla de "las tres tarjetas de contacto" y el resto del ítem de "filas": dos nombres para el mismo bloque. Reponer en §1.3: una fila "Síguenos en Facebook" y otra "Síguenos en Instagram". |
| I2.f. Mi enlace: compartir por WhatsApp, por Facebook y con el menú de compartir del teléfono | §1.3 | CUBIERTO | Idéntico. |
| **Ítem 3. LOGOTIPO** | | | |
| I3.a. El logotipo tipográfico del Encabezado reemplaza la foto del letrero y el sello redondo | §1.2 | CUBIERTO | Texto idéntico, incluido "CARNICERÍA · EL SEÑOR DE LA MISERICORDIA". |
| I3.b. En todo el sitio: tienda, acceso, panel e inventario Django | §1.2; AC1 | CUBIERTO | AC1 lo mide (0 fotos del letrero, 0 sellos redondos), pero no dice cómo contarlos. |
| I3.c. Afinar espaciado, grosor y líneas del subtítulo | §1.2 | CUBIERTO | Sin medida. |
| I3.d. Monograma cuadrado en Componentes, para el ícono de la app, el favicon y la foto de perfil de Facebook e Instagram | §1.2 | CUBIERTO | Sin tamaños, sin criterio de legibilidad a 16 px, sin recorte circular para la foto de perfil, y fuera de AC1 (riesgo 1). |
| **Ítem 4. MÉTRICAS DEL CHATBOT (pantallas 43 a 45)** | | | |
| I4.a. Referencia: video de Kilian Párraga, minuto 31 (mensajes de 30 días, interacciones totales, usuarios únicos) | §3.2 | CUBIERTO | Agrega el ID `l7ll5zTLHso`. Claude Design no reproduce YouTube; los `chatbot-*.jpg` no existen ni se citan (riesgo 4). |
| I4.b. 43: filtros Hoy · 7 días · 30 días y canal Web · WhatsApp | §3.2 | CUBIERTO | — |
| I4.c. 43: seis cifras (conversaciones, personas atendidas, resueltas por el asistente, pasadas a una persona, pedidos que empezaron en el chat, "me sirvió") | §3.2 | CUBIERTO | Las seis están. |
| I4.d. Cifra de clientes que marcaron "me sirvió" | §3.2 | CUBIERTO | Presupone un control "me sirvió" en el chat de la tienda que ningún ítem pide dibujar, y el chat es "aprobado, se queda" (RG). Queda cubierta por "falta backend", sin dibujar de dónde sale el dato. |
| I4.e. 43: gráfica de mensajes entrantes y salientes por día | §3.2 | CUBIERTO | Sin criterio medible (dos series, rango de días). |
| I4.f. 43: "Lo que más preguntan", temas ordenados con conteo y tendencia | §3.2 | CUBIERTO | Se conservan los cinco temas de ejemplo y "su tendencia". |
| I4.g. 43: "Sin respuesta" con "Enseñar la respuesta" y "Pasar a preguntas frecuentes" | §3.2 | CUBIERTO | — |
| I4.h. 44: conversación con las mismas burbujas del chat de la tienda | §3.2 | CUBIERTO | Cae la palabra "abierta"; sin efecto. |
| I4.i. 44: "Corregir" en cada respuesta del asistente; se escribe cómo debió contestar y se guarda como respuesta aprobada que el asistente usa desde ese momento | §3.2 | CUBIERTO | — |
| I4.j. 44: lista de correcciones activas, que se pueden editar o apagar | §3.2 | CUBIERTO | Sin criterio de aceptación. |
| I4.k. 44: teléfono del cliente enmascarado | §3.2 | CUBIERTO | Sin formato de máscara. |
| I4.l. 45: Ayudante del panel, burbuja abierta, con las dos preguntas de ejemplo | §3.2 | CUBIERTO | Se conservan las dos preguntas. |
| I4.m. "Chatbot" en AdminNav entre Clientes y BuildAds; en móvil dentro de "Más" | §3.2; ACF | CUBIERTO | ACF mide el orden en escritorio, no el caso móvil. |
| I4.n. Todo con "falta backend" | §3.2 (encabezado) | CUBIERTO | ACF no lo comprueba. |
| **Ítem 5. MI CUENTA (pantallas 46 y 47)** | | | |
| I5.a. 46 Recetas guardadas: lista con el formato del recetario | §1.4 | PARCIAL | El loop solo manda la entrada del menú a la pestaña "Guardadas" del Recetario; la lista poblada ya no se pide. La pestaña se da por existente y no es verificable desde el repo. Reponer en §1.4: "Recetas guardadas", en el menú, lleva a la pestaña "Guardadas" del Recetario, con la lista en el formato del recetario (3 recetas de ejemplo) y su estado vacío. |
| I5.b. 46: estado vacío | §1.4 | CUBIERTO | — |
| I5.c. 47 Mis datos: nombre, teléfono, correo y contraseña | §1.4 | CUBIERTO | — |
| I5.d. "Cerrar sesión" visible al final | §1.4 ("visible en 390 sin desplazar") | CUBIERTO | Criterio más estricto, pero no fija la altura del cuadro de 390 (riesgo 1). |
| I5.e. Agregar Mis datos al menú de Mi cuenta | §1.4 | CUBIERTO | — |
| **Ítem 6. AJUSTES (pantalla 48)** | | | |
| I6.a. Tres secciones nuevas sobre precios, mínimos, niveles, afiliados y categorías | §1.5 | CUBIERTO | — |
| I6.b. "Datos de la tienda y redes": teléfono, WhatsApp, correo, dirección, horario, Facebook e Instagram | §1.5 | CUBIERTO | Los siete campos. |
| I6.c. "Lo que se cambie aquí cambia en todo el sitio" | §1.5 ("De aquí salen el Landing y el Pie") | PARCIAL | El alcance bajó de "todo el sitio" a dos superficies. Contacto directo, Mi enlace, Compra y el Asistente (que pasa a WhatsApp) usan los mismos datos y no se nombran. Reponer: "De aquí salen el Landing, el Pie, Contacto directo, Mi enlace, Compra y el Asistente." |
| I6.d. "Zonas de entrega": colonias del domicilio, las que usa Mis direcciones | §1.5 | CUBIERTO | Agrega "confirmar colonias con el dueño". |
| I6.e. "Asistente": horario y cuándo pasa la conversación a WhatsApp | §1.5 | CUBIERTO | Agrega "falta backend". |
| I6.f. Diseñar el detalle de las dos primeras | §1.5; AC1 | CUBIERTO | AC1 solo exige que las secciones existan, no que tengan detalle. |
| **Ítem 7. PAQUETES** | | | |
| I7.a. Regla "Todo paquete se requiere un 50 % de anticipo" en las tarjetas de paquete de Ofertas | §1.6 | CUBIERTO | Cita reescrita: "Todo paquete requiere 50 % de anticipo". Corrección gramatical, mismo sentido, pero entre comillas como si fuera literal. |
| I7.b. Aviso "Los precios pueden ser modificados según la alta demanda" | §1.6 | PARCIAL | El loop pone "Los precios pueden cambiar según la demanda". Cae "alta": el aviso deja de ser "si hay mucha demanda" y pasa a "siempre según la demanda". Reponer la cita literal (riesgo 7). |
| I7.c. Mostrarlo en Compra cuando el carrito lleve un paquete | §1.6; §2.4 | CUBIERTO | Agrega "Anticipo del 50 % hoy y el resto al recoger": "hoy" y "al recoger" no salen del Catálogo y chocan con §2.4 (riesgo 7). |
| I7.d. Marcado "confirmar con el dueño" | §1.6 ("Todo va marcado") | CUBIERTO | Sin línea de aceptación para todo el ítem (riesgo 1). |
| **Ítem 8. CATÁLOGO DE LA SEMANA** | | | |
| I8.a. Pieza "Catálogo de la semana" dentro de BuildAds | §1.7 | CUBIERTO | — |
| I8.b. Armada sola con las ofertas y los cortes del sitio | §1.7 | CUBIERTO | — |
| I8.c. Vista en hoja A4 | §1.7 | CUBIERTO | Sin dimensiones de la hoja (solo el carrusel las tiene). |
| I8.d. Vista en carrusel de Instagram | §1.7 | CUBIERTO | Agrega 1080×1350; no fija el número de láminas. |
| I8.e. "Descargar" y "Compartir" | §1.7 | CUBIERTO | — |

Adición sin origen en el loop del 09-23: "Déjala lista para exportar a Canva" (§1.7) no dice qué dibujar. Propuesta: "Déjala lista para exportar a Canva: un botón "Abrir en Canva" marcado "falta backend"."

## 5. Tabla C. Reglas transversales del loop del 09-23 (REGLAS y RITMO)

| Regla del 09-23 | Dónde está en loop-final.md | Estado | Nota |
|---|---|---|---|
| C1. "Trabaja en loop hasta terminar, sin preguntarme" | CT, 1.ª viñeta ("Trabaja ítem por ítem, sin preguntarme") | CUBIERTO | Ahora son tres pasadas con parada obligatoria. |
| C2. "Mejora lo que existe, no rehagas lo aprobado" | RG, 1.ª viñeta | CUBIERTO | — |
| C3. Lista de lo que no se toca: Landing (aprobada y ya en código), lupa, chat, menú lateral, Kanban, catálogo y ficha; "solo cambian donde una mejora de abajo los nombra" | RG, 1.ª viñeta | PARCIAL | Desaparecen Landing, catálogo y ficha sin razón declarada (§2.2 y §2.3 los rediseñan), se agrega la transición Ingresar y Registrarse, y cae la cláusula de excepción: RG choca con §1.8 (lupa), §1.4 y §2.3 (menú), §2.1 (Kanban) y §3.1 (Acceso). Riesgo 2. |
| C4. Cada pantalla nueva o cambiada se compara con su captura en `capturas-actuales` | AE 2 | CUBIERTO | — |
| C5. "No borres Encabezado, Tarjeta, Pie ni AdminNav: las demás páginas los importan" | RG | CUBIERTO | Cae la razón; sin efecto. |
| C6. "Datos reales. Lo que todavía no exista en la base se marca 'falta backend'" | RG ("Nada que el negocio no haga hoy. Lo que no exista se marca 'falta backend' o 'confirmar con el dueño'") | CUBIERTO | Reformulada y ampliada; "falta backend" sobrevive. |
| C7. "Ningún enlace puede quedar en '#'" | RG; AC1 | CUBIERTO | Con medida (0 resultados). |
| C8. RITMO: móvil 390 y escritorio 1440, nota "De lo nuestro · De lo mío · Mejora"; al terminar, Índice actualizado y reporte final de backend o fotos | RG; ACF | CUBIERTO | No fija la altura de los cuadros de 390 y de 1440. |

## 6. Tabla D. Reglas de `loop-mejoras.md` y `direccion-visual.md` que el loop nuevo contradice

`loop-final.md` revoca a propósito "movimiento casi nulo" de `loop-mejoras.md` §0 y nada más. `loop-mejoras.md` declara `direccion-visual.md` como vinculante (§0), y no consta que Claude Design haya soltado esos dos archivos de su contexto: el loop nuevo cita `loop-mejoras.md` por nombre. Estas son las otras reglas que siguen escritas y que los ítems nuevos violan.

| Regla vigente (fuente) | Dónde la contradice loop-final.md | Estado | Nota |
|---|---|---|---|
| D1. "Restrained everywhere, warm in two places only (landing hero and empty states)" (`loop-mejoras.md` §0) | §3.1 (carnicero con arco crema en el Acceso); §1.3 variante B | CONTRADICE | Gravedad baja. Es decisión de Eduardo (P10: conservar al carnicero). Declararla como excepción. |
| D2. Display 40/44 en 390 y 64/68 en 1440, tracking −0.04em (`direccion-visual.md` §2) | §2.2: Fraunces `clamp(56px, 7vw, 112px)`, tracking −0.03em (unos 101 px a 1440) | CONTRADICE | Gravedad alta. El mínimo de 56 px ya supera al Display de 390 (40 px). |
| D3. Presupuesto de caracteres del Display: 28 en 390 y 48 en 1440; "nunca tres líneas" (`direccion-visual.md` §2.1) | §2.2: titular de 56 px como mínimo en 390 | CONTRADICE | Gravedad media. Con 56 px caben unas 13 letras por línea en 358 px (estimación con 0,47 em por letra); un titular de 28 caracteres ocupa tres líneas. El loop no da el texto del titular ni un máximo de líneas. |
| D4. "Max 1–2 animated elements per view" (`direccion-visual.md` §6) | §2.1 y §2.2 (titular palabra por palabra, revelados, Encabezado, Tarjeta, hojas, "Agregado ✓"); Portada con video, titular y revelados en la misma vista | CONTRADICE | Gravedad alta. |
| D5. "Animates: opacity/transform only" (`direccion-visual.md` §6) | §2.2: revelado con `clip-path` | CONTRADICE | Gravedad media. |
| D6. "No bounce or elastic easing — exponential ease-out only" (`loop-mejoras.md` §6; curva `cubic-bezier(.16,1,.3,1)` en `direccion-visual.md` §6) | §2.1 Kanban con "resorte leve"; §3.1 `cubic-bezier(0.77, 0, 0.175, 1)` (ease-in-out); §2.1 `cubic-bezier(0.32, 0.72, 0, 1)` | CONTRADICE | Gravedad media. |
| D7. Tarjeta presionada: `scale(0.98)` en 80 ms (`direccion-visual.md` §4) | §2.1: `scale(0.97)` en 160 ms | CONTRADICE | Gravedad baja: valor numérico distinto. |
| D8. "Add-to-cart is silent"; G2.7: la hoja se abre y el contador sube, sin toast (`loop-mejoras.md` §6 y G2.7) | §2.1: "Agregar" pasa a "Agregado ✓" y "+1" en el carrito | CONTRADICE | Gravedad media. Cambia la etiqueta del botón y no dice si la hoja del carrito se abre. |
| D9. G7.3: el tope de stock muestra "Stock disponible: X" (`loop-mejoras.md` G7.3; `direccion-visual.md` §4, stepper) | §2.3: el cliente ve solo "Disponible", "Pocas piezas" o "Agotado"; el número exacto solo en el panel | CONTRADICE | Gravedad media. |
| D10. G0.7, G6.3, variación de recorte (`loop-mejoras.md` §0) y regla de fotos (`direccion-visual.md` §5) | §2.3 revoca solo "la regla G0.7" | PARCIAL | G6.3, §0 y `direccion-visual.md` §5 dependen de G0.7 y no se nombran. |
| D11. "No new colors, fonts, icon sets" (§4) y "one icon family… no brand colors" (§6) (`loop-mejoras.md`) | §1.3 variante B (glifos con color de marca) | CONTRADICE | Gravedad baja: es una opción para que Eduardo elija, pero el loop no la declara excepción. |
| D12. "BuildAds stays frozen — do not design it in this run" (`loop-mejoras.md` §2.1) | §1.7 y §1.8 (piezas de BuildAds) | CONTRADICE | Gravedad baja: la propia G14 de `loop-mejoras.md` ya diseña BuildAds; regla obsoleta que conviene derogar por escrito. |
| D13. "Read per group, not everything up front" (`loop-mejoras.md` §0, punto 1) | AE 2: "Lee estas carpetas del repo" (5 skills de 8 a 27 KB, 14 referencias, 59 capturas) | CONTRADICE | Gravedad baja, pero gasta el límite de uso (P16): "lee estas carpetas" invita a abrirlo todo al inicio. |

## 7. Verificación de archivos citados por el loop

Todas las rutas son relativas a `docs/design/`. Comprobado con `test -e`, `eza` y `ffprobe` el 2026-09-28.

| Ruta | ¿Existe? | Comentario |
|---|---|---|
| `skills/emil-kowalski/` con `emil-design-eng`, `animate`, `review-animations` (más `STANDARDS.md`), `apple-design`, `mobile-native` | Sí | Las cinco skills y `STANDARDS.md` existen. Hay dos más sin citar: `animation-vocabulary` y `find-animation-opportunities`. |
| `referencias/capturas/`: `orbe-movil`, `orbe-portada`, `orbe-scroll`, `apple-movil`, `apple-portada`, `louisvuitton-portada`, `louisvuitton-tarjetas`, `oyla-joyeria-catalogo`, `uber-login-ilustracion`, `verdara-kpis`, `sweetgreen-recetas`, `freitag-catalogo`, `django-unfold-login` | Sí (13 de 13) | `chatgpt-asistente.jpg` existe y no se cita; serviría a la pantalla 45. |
| `capturas-actuales/` | Sí | 59 imágenes. |
| `assets/video/`: `portada-carne.mp4`, `portada-carne-poster.jpg`, `README.md` | Sí | El mp4 mide 1280×720, 10,0 s a 24 fps, como dicen el README y el loop. |
| `assets/mascota/`: `arch-escritorio`, `arch-movil`, `carnicero-*-busto`, `panel-escritorio-*`, `panel-movil-*`, `acceso-transicion.mp4`, `acceso-transicion-tira.jpg`, `README.md` | Sí | Dimensiones verificadas: `arch-movil` 140×196; `arch-escritorio` 520×493 (58 % de 850, dentro del 57 al 62 % del loop); `carnicero-*-busto` 140×232; `panel-escritorio-*` 660×850; `panel-movil-*` 358×232; `acceso-transicion.mp4` 1320×850 a 60 fps y 3,07 s. La tira muestra un solo carnicero en cada uno de sus 3 cuadros (0, 233 y 480 ms). |
| `assets/movimiento/` | **No** | §2.1 lo cita con "si hay tiras". La unidad U3 de `loop-agentico.md` es opcional y no se ha hecho. |
| `assets/fotos-referencia/` | **No** | §2.3 lo cita con "Si hay referencias". La unidad U4 es opcional, pide instalar `mflux` y un modelo de 4,6 GB, y no se ha hecho. |
| `referencias/capturas/chatbot-*.jpg` | **No** | El loop no los cita; `loop-agentico.md` (U7, opcional) los planea. Sin ellos, §3.2 depende de un video de YouTube. |
| `assets/video/portada-carne-cuadro-claro.jpg` | **No** | El loop no lo cita; hace falta para medir lo que pide §2.2 (riesgo 5). |
| `loop-mejoras.md` (§0), `loop-agentico.md`, `loop-estado.md` | Sí | El loop los nombra bien. |

Cotejo de cifras entre el README de `assets/mascota/` y el loop: coinciden 480 ms, `cubic-bezier(0.77, 0, 0.175, 1)`, blur de 2 px o menos durante 120 ms o menos, reduced-motion de 150 a 200 ms, arco de unos 520 px y arco móvil de 140×196. Sin fuente en el README: "en móvil, el selector se mueve en 220 ms" (el README solo define el caso de escritorio).

## 8. Traspaso al orquestador (P9, P16, P17 y partes de P12, P13, P14, P18)

| Elemento | ¿Lo traspasa bien loop-final.md? | Evidencia | Hueco |
|---|---|---|---|
| Bitácora | Sí | CT ("anótalo en la Bitácora del Índice"; "Escribe el reporte en la Bitácora y en el chat"); §1.1 ("Al final va la sección Bitácora"); `loop-agentico.md` ("El reporte viaja dentro del .zip, en la Bitácora del Índice") | Sin formato definido ("sus medidas" puede leerse como el tamaño de las pantallas); sin estado PARCIAL (riesgo 3). |
| Parada por pasada | Sí | Encabezado ("Hoy ejecutas solo la PASADA 1"); CT ("Empieza con "PASADA N LISTA" y detente"); la línea que enviará el orquestador para las pasadas 2 y 3 es coherente | — |
| Verificación por Claude Code | Sí, en una frase | CT ("Entre pasadas, Claude Code verifica tu exportación .zip…"); coherente con U2, U6 y U9 | No pide a Claude Design que avise de la exportación; no menciona "CORRECCIONES N LISTAS" y choca con "Nunca rehagas" (riesgo 3). Los criterios de U2, U6 y U9 repiten los huecos de AC1, AC2 y ACF (riesgo 1). |
| Presupuesto de uso (P16) | Parcial | CT ("si ves que se acerca el límite de uso"); `punto-de-control`: 60 a 79 % SIGO EN CORTO, 80 a 89 % PAUSO, 90 % o más PAUSO YA | La frase no es medible y omite la banda 80 a 90 %. |
| Lista de diferencias y espera de confirmación (P9) | No aparece en el loop | `loop-agentico.md`, "Cierre", punto 3; AE 4 ("Esto es diseño, no código") | Suficiente: Claude Design no puede escribir código en el repo. |
| Skills, agentes, conectores e investigación (P17) | Skills sí; el resto no aplica a Claude Design | AE 1 y 2 (skills nombradas, rutas verificadas) | `loop-agentico.md` no tiene unidad para plugins oficiales de Anthropic ni conectores. |

## 9. Los 8 riesgos, ordenados por gravedad, con la frase exacta

Cada bloque de código es texto para pegar en `loop-final.md`, en el lugar indicado. Están escritos en la voz del loop.

### Riesgo 1. La aceptación mide una fracción de lo que el loop ordena (el que lo mata)

Dónde: AC1, AC2, ACF.

Qué falla:

- AC1 tiene cinco viñetas (`href="#"`, existencia de cinco secciones, logotipo, contraste de "cada título que corregiste", imágenes rotas). No mide 1.3, "Recetas guardadas", el monograma, 1.6, 1.7, el minigráfico, el eje, "Salir", los cuatro textos de 1.8 ni la completitud del Índice.
- AC2 tiene cuatro viñetas y omite casi todo de 2.2 (80–85vh, aviso de 1280×720, entrada palabra por palabra, "Sobre nosotros"), 2.3 (stock, categorías vacías, "foto pendiente") y 2.4 completo.
- ACF omite las medidas de 3.1 y el detalle de 3.2.
- 1.8 ordena "todo el texto del lienzo con contraste de 4.5:1 o más", pero AC1 mide solo "cada título que corregiste".
- `loop-agentico.md` (U2, U6, U9) copia los mismos criterios. Los pedidos P4 (URLs), P6 (Recetas guardadas), P7 y P8 no tienen criterio de aceptación en ningún archivo.
- Las filas de la tabla de Movimiento (§2.1) piden duración y curva, pero 5 de las 7 filas no traen alguna de las dos, y las de §2.2 y §3.1 no tienen fila.

Qué puede hacer Claude Design: cerrar "PASADA N LISTA" con 1.7 sin hacer y llenar la tabla sin ningún "Pasa" vacío.

Frase exacta, al final de "Aceptación de la pasada 1 (con números)":

```
- las tres URLs de 1.3 aparecen en el Pie y en Contacto directo, y Mi enlace tiene sus 3 acciones (WhatsApp, Facebook y menú de compartir del teléfono);
- el monograma se entrega en 512×512 (ícono de la app), 32×32 y 16×16 (favicon) y 320×320 con recorte circular, y se lee a 16 px;
- el Índice tiene tantas fichas como pantallas del proyecto, cada una con sus cinco datos, y conserva la numeración 43 a 48 (43 Resumen, 44 Conversación, 45 Ayudante del panel, 46 Recetas guardadas, 47 Mis datos, 48 Ajustes); las pantallas nuevas de este loop van desde la 49;
- Mis datos, con "Cerrar sesión" completo, cabe en un cuadro de 390×844 sin desplazar;
- "Recetas guardadas" muestra la lista con 3 recetas de ejemplo y su estado vacío;
- todas las tarjetas de paquete de Ofertas llevan las dos frases de 1.6 (anota cuántas son), y Compra con paquete lleva la frase del anticipo;
- "Catálogo de la semana" existe en A4 y en 1080×1350, con "Descargar" y "Compartir";
- cada KPI del panel lleva su minigráfico de 7 días (anota cuántos son) y el eje de ventas dice $0 / $5k / $10k / $15k;
- búsquedas con 0 resultados: "picaña" dentro del ejemplo de "sin resultados", "por Kilo" junto a "Paquete Carnitas", "kcal por día" y cualquier plazo junto a "Revisa tu correo";
- la tabla de contraste lista todos los estilos de texto del lienzo (color sobre su fondo), no solo los títulos que corregiste, y ninguno baja de 4.5:1.
```

Frase exacta, al final de "Aceptación de la pasada 2" (reemplaza la viñeta "el Catálogo con un solo botón rojo lleno por vista"):

```
- el video ocupa 100 % del ancho y 80-85vh, y la nota "Mejora" dice que mide 1280×720;
- el titular alcanza 4.5:1 en su línea más alta, medido sobre el cuadro más claro del video;
- botones con relleno #DC2626 en la rejilla del Catálogo: 0, y como máximo 1 en cada cuadro completo de 390 y de 1440;
- el cliente ve solo "Disponible", "Pocas piezas" o "Agotado", y el número exacto aparece solo en el panel;
- categorías con 0 productos ocultas en el menú: 2;
- en Compra, "Pagar al recoger o al recibir" va primero, la tarjeta va segunda con "falta backend" y hay 0 campos de tarjeta dibujados;
- marcos vacíos en "Sobre nosotros": 0;
- 0 fotos repetidas entre productos distintos; un marcador "foto pendiente" no cuenta como repetida;
- la tabla de Movimiento tiene una fila por cada movimiento de 2.2 y de 3.1, y da duración y curva a las siete filas de 2.1 (ninguna pasa de 320 ms).
```

Frase exacta, al final de "Aceptación final":

```
- 43 tiene 6 cifras, 3 periodos, 2 canales, 1 gráfica de 2 series y al menos 5 temas con conteo y tendencia, y "Sin respuesta" tiene sus 2 acciones;
- en 44, cada respuesta del asistente lleva "Corregir", la lista de correcciones tiene "editar" y "apagar", y el teléfono aparece enmascarado (por ejemplo, +52 ••• ••• ••34);
- 45 muestra la burbuja abierta con las 2 preguntas de ejemplo;
- AdminNav dice Clientes · Chatbot · BuildAds en 1440, y "Chatbot" está dentro de "Más" en 390;
- 43, 44 y 45 llevan la etiqueta "falta backend";
- la tira del Acceso declara 480 ms, cubic-bezier(0.77, 0, 0.175, 1), blur de 2 px o menos durante 120 ms o menos, y cuántos carniceros se ven en cada cuadro (1 en todos).
```

Nota: "ninguna pasa de 320 ms" es una propuesta derivada de los valores del propio 2.1 (las hojas llegan a 320 ms; el resto, a 200 ms). El Acceso queda fuera porque su panel dura 480 ms por diseño.

### Riesgo 2. Las reglas viejas siguen vigentes y chocan con lo nuevo

Dónde: AE 3 y RG, 1.ª viñeta.

Qué falla: AE 3 revoca solo "movimiento casi nulo". `direccion-visual.md` y `loop-mejoras.md` conservan 12 reglas que los ítems 1.3, 1.7, 1.8, 2.1, 2.2, 2.3 y 3.1 violan y una que revocan a medias (tabla D). Además RG dice "Lo aprobado se queda: la lupa, el chat, el menú, el Kanban", quitó la cláusula del 09-23 "Solo cambian donde una mejora de abajo los nombra", y a la vez §1.8, §1.4, §2.3, §2.1 y §3.1 modifican esos mismos elementos. La Landing, el catálogo y la ficha salieron de la lista sin razón declarada.

Qué puede hacer Claude Design: obedecer la regla más vieja o la más restrictiva y omitir el ítem nuevo (dejar "Agregar" sin "Agregado ✓", titular a 64 px, "Stock disponible: X" en la ficha), o mezclar ambas y anotar el ítem como cerrado.

Frase exacta, en lugar de la 3.ª viñeta de AE 3 ("Queda revocada la regla…") y bajo RG:

```
Precedencia: si este archivo contradice loop-mejoras.md o direccion-visual.md, gana este archivo. Sustituye a loop-mejoras.md §0 en cómo se corre (bloques, ritmo, informe final y "movimiento casi nulo"). De esos dos archivos siguen vigentes los criterios G0 a G14, los tokens, la disposición del lienzo (§1) y las reglas anti-slop, salvo en estos puntos, donde gana este archivo: (1) "máx. 1-2 elementos animados por vista" se sustituye por la tabla de Movimiento de 2.1, y "solo opacity y transform" admite clip-path en los revelados de 2.2; (2) "solo ease-out exponencial" admite las curvas de este archivo y un resorte leve, sin rebote visible, en el Kanban; (3) el Display de direccion-visual.md §2 y §2.1 no rige para el titular de la Portada (rige 2.2) y el press de la Tarjeta es el de 2.1; (4) G2.7 no rige: 2.1 pide "Agregado ✓" sin toast; (5) G7.3 no rige: en 2.3 el cliente no ve el número exacto de stock; (6) G0.7, G6.3, la variación de recorte de loop-mejoras.md §0 y direccion-visual.md §5 no rigen: 2.3 pide una foto por producto; (7) "una sola familia de íconos, sin color de marca" no rige en las tarjetas de contacto de 1.3; (8) BuildAds ya no está congelado (1.7 y 1.8); (9) "cálido solo en la portada y en los estados vacíos" no rige para el Acceso (3.1).
Lee por grupo, no todo al inicio: no abras las 59 capturas antes de dibujar.
Lo aprobado se queda salvo donde un ítem de este archivo lo nombra: lupa (1.8), menú (1.4 y 2.3), Kanban (2.1), Ingresar y Registrarse (3.1), Landing (2.2), Catálogo y ficha (2.3). Lo que ningún ítem nombra no se toca.
```

### Riesgo 3. El ítem "soltado" se pierde, "Nunca rehagas" bloquea las correcciones, y faltan la exportación y el umbral

Dónde: CT, viñetas 3, 4 y 5.

Qué falla:

- "Termina o suelta el ítem en curso y anótalo" más "Retoma en el primer ítem sin anotar. Nunca rehagas un ítem ya anotado". Un ítem soltado a medias queda anotado y por tanto no se retoma jamás. P16 pide "sin perder trabajo", y el loop está diseñado para cortarse por límite de uso, así que esta es la ruta esperada, no la excepcional.
- `loop-agentico.md` prevé "Correcciones de la PASADA N… escribe CORRECCIONES N LISTAS", que contradice "Nunca rehagas un ítem ya anotado".
- CT dice que Claude Code verifica "tu exportación .zip", pero nunca pide a Claude Design que avise de exportar.
- "Si ves que se acerca el límite de uso" no es medible y omite la banda 80 a 90 % de P16.
- "Sus medidas" (Bitácora) se puede leer como el tamaño de las pantallas.

Frase exacta, en lugar de la viñeta "Si te cortas…" de CT; la última línea se agrega al final de la viñeta "Al cerrar la pasada":

```
- Si te cortas, o si tu indicador de uso pasa del 80 %: termina el ítem en curso; si no alcanzas, anótalo en la Bitácora como "PARCIAL: falta …" (nunca como cerrado) y detente. Antes del 80 % no te detengas, salvo al cerrar una pasada. Si no ves el indicador, sigue hasta que te corten.
- Al volver, relee este archivo y la Bitácora; retoma primero los ítems PARCIAL y luego el primer ítem sin anotar. Nunca rehagas un ítem cerrado, salvo que Claude Code te mande "Correcciones de la PASADA N": corrige solo esos puntos, anótalos en la Bitácora y escribe "CORRECCIONES N LISTAS".
- La Bitácora lleva, por ítem: número, pantallas tocadas, valores medidos (contraste en x:1, tamaños en px, duraciones en ms) y estado (CERRADO o PARCIAL).
- Cierra el reporte con: "Eduardo: exporta el proyecto como .zip y entrégaselo a Claude Code antes de la siguiente pasada."
```

### Riesgo 4. Recursos que no existen o que Claude Design no puede abrir

Dónde: §2.1, §2.3, §3.2, AE 2.

Qué falla (verificado):

- `assets/movimiento/` y `assets/fotos-referencia/` no existen. Las unidades U3 y U4 de `loop-agentico.md` son opcionales, y U4 exige instalar software con permiso de Eduardo. El loop los cita con "si hay", sin decir qué hacer si no hay.
- La referencia de §3.2 es un video de YouTube (minuto 31) que Claude Design no puede reproducir. Los archivos que el orquestador planea para eso (`referencias/capturas/chatbot-*.jpg`, U7, opcional) no existen y el loop no los cita. `chatgpt-asistente.jpg` sí existe y no se cita.
- Desapareció el respaldo de `loop-mejoras.md` ("si la herramienta no puede leer la carpeta, Eduardo la arrastra una vez"). Si Claude Design no lee la rama `pruebas`, el loop entero (skills, referencias, capturas, assets) se queda sin base.

Qué puede hacer Claude Design: detenerse a preguntar, inventar las tiras o las referencias, o dar el ítem por cubierto sin la fuente.

Frases exactas:

```
2.1, en lugar de "si hay tiras en assets/movimiento/, úsalas como referencia exacta":
assets/movimiento/ todavía no existe: dibuja tú la tira de 3 cuadros de cada fila; si Claude Code la crea antes de la PASADA 2, úsala como referencia exacta y no la redibujes.

2.3, en lugar de "Si hay referencias en assets/fotos-referencia/, úsalas solo como dirección de arte, rotuladas ...":
assets/fotos-referencia/ todavía no existe: donde falte foto pon "foto pendiente"; si Claude Code la crea, úsala solo como dirección de arte, rotulada "Referencia, no es el producto".

3.2, en lugar de "Referencia: en el video de Kilian Párraga (youtube l7ll5zTLHso, minuto 31) hay ...":
Referencia: docs/design/referencias/capturas/chatbot-*.jpg (dos paneles reales y el cuadro del minuto 31:25 del video de Kilian Párraga, que muestra "Métricas del Chatbot" con los mensajes entrantes y salientes de 30 días, el total de interacciones y los usuarios únicos) y chatgpt-asistente.jpg para la pantalla 45. No abras YouTube. Si chatbot-*.jpg no existe, diseña desde el texto de este ítem y anótalo en la Bitácora. Parte de ahí y hazla útil para la carnicería.

AE 2, al final:
Si no puedes abrir docs/design/ de la rama pruebas, escribe "SIN ACCESO AL REPO" y detente; no inventes referencias ni recursos.
```

Nota para el orquestador: cada frase supone decidir U3, U4 y U7 antes de la pasada correspondiente. Si se saltan, "si Claude Code la crea" queda inocuo.

### Riesgo 5. Portada (2.2): sin umbral, sin cuadro más claro, con "caja negra" indefinida y sin botón

Dónde: §2.2 y AC2.

Qué falla:

- "Mide el contraste sobre el cuadro más claro del video… no solo sobre el póster" no fija umbral. §1.8 pide 4.5:1 para el lienzo, `direccion-visual.md` §8 (puerta 1) pide 3:1 para texto grande, y §2.2 no dice cuál rige.
- No hay archivo de ese cuadro: `assets/video/` tiene solo el póster (el cuchillo cortando) y el mp4, y Claude Design no puede recorrer un mp4 para hallar el cuadro más claro.
- Con la geometría del propio loop el umbral puede ser inalcanzable. Cálculo propio, con supuestos: cuadro de 720 px (80vh sobre 900), franja del 45 % (324 px), titular de 2 líneas de 100 px pegado al borde inferior, texto `#F5F3EF`, azulejo `#FFFFFF`. El borde superior del titular queda bajo un 29 % de negro y da unos 1,8:1. Para 4,5:1 sobre blanco puro hace falta al menos 56 % de negro en ese borde, y la rampa de 0 a 75 % solo lo alcanza en el 25 % inferior de la franja. Con un azulejo a `#E0E0E0` sube a unos 2,4:1. Ni siquiera llega a 3:1.
- "Sin tarjeta ni caja negra" y "degradado de negro a 75 %" se pueden leer como lo mismo.
- `loop-mejoras.md` G5.1 exige "one primary CTA" en el hero; 2.2 no lo menciona una vez quitada la tarjeta.

Qué puede hacer Claude Design: medir sobre el póster (lo que el loop prohíbe), escribir un número sin sustento, quitar el degradado por miedo a la "caja negra", o perder el botón principal.

Frase exacta, en lugar de la viñeta "Mide el contraste sobre el cuadro más claro del video…" de 2.2:

```
Mide el contraste del titular (#F5F3EF) en su línea más alta, sobre el cuadro más claro del video (el azulejo blanco del mostrador; usa docs/design/assets/video/portada-carne-cuadro-claro.jpg, que Claude Code agrega antes de la PASADA 2). Umbral: 4.5:1. Si no llega, sube la opacidad final del degradado (hasta 90 %) o baja el titular a una línea, y anota cuál usaste. El titular ocupa como máximo 3 líneas en 390 y 2 en 1440. "Caja negra" es un rectángulo de color sólido con borde o esquinas visibles; el degradado, con 0 % de opacidad en su borde superior, está permitido. Deja un solo botón principal dentro de la franja, debajo del titular.
```

### Riesgo 6. Catálogo (2.3): el botón rojo se dice de tres maneras, "por vista" no está definido y hay cruces con 2.1

Dónde: §2.3, §2.1 y AC2.

Qué falla:

- 2.3 dice "El rojo lleno queda solo para la ficha y el carrito" (0 en la rejilla) y "Como mucho hay un botón rojo lleno por vista de rejilla" (0 o 1). AC2 dice "un solo botón rojo lleno por vista" (exactamente 1). `loop-agentico.md` (U6) repite "1 botón rojo lleno por vista".
- "Vista" no se define (cuadro de 390, cuadro de 1440 o pantalla completa). El "+" de 44 px no tiene color asignado.
- 2.3 pide una tarjeta "más quieta" y 2.1 le da hover de −2 px y press.
- "El mismo ángulo (45° o cenital)" permite mezclar los dos.
- AC2 exige "0 fotos repetidas" y los marcadores "foto pendiente" son idénticos entre productos.

Qué puede hacer Claude Design: cumplir una lectura y que el verificador aplique otra; el criterio queda sin medir o falla por construcción.

Frase exacta, en lugar de la viñeta "Tarjeta de rejilla más quieta…" de 2.3 (y la viñeta correspondiente de AC2, ya reemplazada en el Riesgo 1):

```
Tarjeta de rejilla: foto, nombre, precio con unidad y un botón "+" de 44 px en contorno, sin relleno rojo. En la rejilla del Catálogo hay 0 botones con relleno #DC2626; en cada cuadro completo de 390 y de 1440 (encabezado, filtros y rejilla juntos) hay como máximo 1. Reporta el conteo de cada cuadro. La Tarjeta de rejilla no lleva elevación al pasar el cursor; el hover de −2 px de 2.1 vale para las Tarjetas de carruseles y recomendaciones. Elige un solo ángulo para todas las fotos, 45° o cenital, y anota cuál elegiste. Un marcador "foto pendiente" no cuenta como foto repetida; la misma fotografía en dos productos distintos, sí.
```

Nota: la cláusula sobre el hover es una propuesta a confirmar con Eduardo. La alternativa es conservar el −2 px y quitar "más quieta".

### Riesgo 7. Compra (1.6 contra 2.4): el anticipo no tiene canal de cobro y las citas del catálogo están alteradas

Dónde: §1.6 y §2.4.

Qué falla:

- §1.6 pide en Compra "Anticipo del 50 % hoy y el resto al recoger". §2.4 pone "Pagar al recoger o al recibir" primero y la tarjeta segunda, con "falta backend". Un anticipo "hoy" solo puede pagarse por la segunda opción, que no existe, y "al recoger" excluye la entrega a domicilio.
- "Hoy" y "al recoger" no salen del Catálogo 2024, que dice solo "Todo paquete se requiere un 50% de anticipo".
- Las dos citas van entre comillas y reescritas: el original es "Todo paquete se requiere un 50% de anticipo" y "Los precios pueden ser modificados según la alta demanda"; el loop pone "Todo paquete requiere 50 % de anticipo" y "Los precios pueden cambiar según la demanda". Cae "alta".

Qué puede hacer Claude Design: dibujar un flujo imposible (carrito con paquete que ofrece pagar todo al recoger) o publicar frases que el negocio no dijo.

Frase exacta, en lugar de §1.6 completo:

```
1.6 Paquetes. El Catálogo 2024 de la tienda dice "Todo paquete se requiere un 50 % de anticipo" y "Los precios pueden ser modificados según la alta demanda".
- Muéstralo tal cual en las tarjetas de paquete de Ofertas.
- En Compra, cuando el carrito lleva un paquete, muestra "Anticipo del 50 %". Con paquete en el carrito, "Pagar al recoger o al recibir" solo cubre el resto; el anticipo se cobra con la pasarela alojada de 2.4, marcada "falta backend".
- Todo va marcado "confirmar con el dueño", incluido cómo y cuándo se cobra el anticipo.
```

### Riesgo 8. Acceso móvil (3.1): se puede leer mal y no se puede comprobar

Dónde: §3.1, viñetas "Móvil (390)" y "Tiempos"; ACF.

Qué falla:

- "El texto va a la izquierda del slider rojo; a la derecha va el arco pequeño… dentro del panel". El README no usa "slider": el panel rojo (358×232) lleva el título dentro, a la izquierda (a 20 px del borde izquierdo y 22 px del superior, unos 172 px de ancho), y el arco a la derecha. Leída literal, la frase pone el texto fuera del panel.
- "En móvil, el selector se mueve en 220 ms" no tiene fuente en el README (que solo define los 480 ms de escritorio) y no dice cómo cambia la pose en 390. Si se resuelve con un fundido entre `panel-movil-ingresar` y `panel-movil-registro`, reaparecen las dos imágenes de P10.
- La comprobación "sin dos personajes en ningún cuadro de la tira" se hace sobre 3 cuadros (inicio, mitad, final), que no cubren el instante del corte (unos 229 ms).

Qué puede hacer Claude Design: sacar el texto del panel, resolver el cambio de pose con un fundido en móvil, o dar el ítem por cumplido con una tira de 3 cuadros que no lo prueba.

Frase exacta, en lugar de las viñetas "Móvil (390)" y "en móvil, el selector se mueve en 220 ms" de 3.1:

```
Móvil (390): dentro del panel rojo (panel-movil-*, 358×232) el título va a la izquierda (a 20 px del borde izquierdo y 22 px del superior, unos 172 px de ancho) y a la derecha va el arco pequeño (arch-movil, 140×196) con el busto encima (carnicero-*-busto), la cabeza completa y dentro del panel. Al cambiar entre Ingresar y Registrarse, el selector se mueve en 220 ms y la pose cambia con un corte duro a mitad de ese recorrido, tapado con un blur de 2 px o menos durante 120 ms o menos; nunca hay un fundido entre los dos paneles. La tira del Acceso lleva 5 cuadros en 390 y en 1440 (0, 25, 50, 75 y 100 % del recorrido) y bajo cada cuadro se anota cuántos carniceros se ven: 1 en los 5.
```

## 10. Observaciones fuera del alcance (para el orquestador)

1. `loop-agentico.md` entrega una pasada a Claude Design solo si el límite de 5 h va por debajo del 50 %, y si no, pausa. Eso pausa entre el 50 y el 79 %, fuera de la banda "solo entre el 80 y el 90 %" de P16. Puede ser una decisión legítima (dimensionar la pasada), pero contradice la letra del pedido: conviene confirmarla con Eduardo o documentarla.
2. Ninguna unidad de `loop-agentico.md` investiga plugins oficiales de Anthropic ni conectores (P17). Solo se ve un generador gratuito (U4, con permiso de instalación).
3. Los "kits de tododeia" (P13) no aparecen en `loop-final.md` ni en `loop-agentico.md`; la skill `tododeia-animaciones` sigue sin instalar (`docs/PENDIENTES.md`, línea 449).
4. U3, U4 y U7 son opcionales. Si se saltan, `loop-final.md` debe traer las frases del Riesgo 4; si se hacen, hay que crear los archivos antes de la pasada correspondiente.
5. El cuadro más claro del video (`portada-carne-cuadro-claro.jpg`) no existe: hay que extraerlo con `ffmpeg` antes de la pasada 2 si se adopta la frase del Riesgo 5.
6. U9 verifica "teléfono enmascarado" y ACF no lo dice. La frase del Riesgo 1 lo alinea.

## 11. Correcciones aplicadas en la versión 2.1 (2026-09-28)

| Riesgo | Qué se hizo |
|---|---|
| 1 | Se agregaron las viñetas medibles de las tres aceptaciones. U2, U6 y U9 de `loop-agentico.md` ahora remiten a esas listas y no las copian. |
| 2 | Se agregó la cláusula de precedencia con sus nueve excepciones, "lee por partes" y "lo aprobado se queda salvo donde un ítem lo nombra". |
| 3 | Se agregaron el estado PARCIAL, la excepción de correcciones con "CORRECCIONES N LISTAS", el formato de la Bitácora, el umbral del 80 % y el aviso de exportar el .zip. |
| 4 | Las tiras y las fotos de referencia son condicionales. El chatbot se describe sin abrir YouTube, se cita `chatgpt-asistente.jpg` y se agregó "SIN ACCESO AL REPO". |
| 5 | Se extrajo `assets/video/portada-carne-cuadro-claro.jpg` (segundo 1.29) y se midió. El degradado quedó en 0 % al 40 %, 55 % al 65 % y 80 % abajo: el titular da 4.96:1 en 1440 y 5.59:1 en 390. También se definió "caja negra" y hay un solo botón principal. |
| 6 | La rejilla lleva 0 rellenos rojos y como máximo 1 por cuadro, el "+" va en contorno y el ángulo es uno solo, anotado. Diferencia con la propuesta: se conserva el hover de −2 px, porque "más quieta" se definió como sin insignias, sin sombra fuerte y sin rojo lleno. |
| 7 | La cita del Catálogo 2024 va textual como fuente, y el texto de la tienda va corregido. El anticipo se cobra por la pasarela de 2.4 ("falta backend"), y cómo y cuándo queda por confirmar con el dueño. |
| 8 | El texto va dentro del panel móvil, con corte duro a mitad de los 220 ms, sin fundido y con una tira de 5 cuadros. |
| §10.1 | El umbral para mandar una pasada a Claude Design sube a 80 %; entre 50 y 79 % solo se avisa. |
| §10.2 | Se instalaron los plugins oficiales `frontend-design` y `session-report`. |
