# Auditoría del export de Claude Design: Diseño1.1.zip

Fecha de la auditoría: 2026-09-29. Alcance: solo lectura del export; no se tocó código del repo. Evidencia visual en `capturas-1.1/` (12 JPG, todos por debajo de 250 KB, ver sección 10).

## 0. Resumen ejecutivo

- El export es un canvas de 16 archivos `.dc.html` (runtime propio `support.js`, etiquetas `dc-import`, `sc-for`, `sc-if`). No se puede importar a React tal cual: hay que portarlo a mano. El HTML es plano con estilos en línea, así que el mapeo a clases de Tailwind es mecánico pero largo (Landing 124 KB, Componentes 181 KB).
- El sistema visual es coherente y sobrio: fondo casi negro, un solo rojo, arena `#E4D1B0`, Fraunces para titulares y Geist para la interfaz, 0 sombras, 0 vidrio, un solo degradado (velo del hero). Componentes trae un bloque `@theme` de Tailwind v4 listo para copiar (sección 4).
- Verificador automático: 30/43. De los 13 fallos, 12 son trabajo pendiente que la propia Bitácora declara como PARCIAL (Índice con miniaturas, Movimiento, Acceso con mascota, Métricas del chatbot) y 1 es un falso negativo del script (orden del Landing, que sí es correcto). Nota real por esa lectura: 31/43.
- Pedidos de Eduardo: (f) orden del Landing cumple en móvil y escritorio; (d) logotipo tipográfico cumple; (e) la tarjeta es un solo componente con 4 variantes; (a) hero móvil NO cumple (388 x 700 px); (b) el efecto del encabezado se perdió; (c) la burbuja del chatbot es un chat genérico.
- Queja del menú lateral del panel: en este export el menú móvil del panel (botón hamburguesa de AdminNav) no tiene cajón diseñado, por eso no hay X. El escritorio usa una columna fija que no necesita cerrarse. Los cinco overlays de tienda y compra (menú lateral, buscador, asistente, carrito, dirección de entrega) sí tienen X de 44 a 52 px; las confirmaciones del panel cierran solo con "Cancelar".
- Hallazgo funcional en el Landing: el carrusel "Filete Mignon" recorre 8 cortes distintos, pero el título, la descripción, el precio $689 y los botones son estáticos y no siguen a la foto activa.
- Faltan por diseñar: Métricas del chatbot (pantallas 43, 44, 45 y su entrada en AdminNav), el acceso con mascota en su versión final (panel, pose, 480 ms), el cuadro de Movimiento, un cajón del panel en móvil y cualquier tamaño de tablet (solo existen frames de 390 y 1440).

## 1. Qué trae el zip

Zip de 61.5 MB (62.3 MB descomprimido, 245 archivos). Por carpeta:

| Carpeta | Peso | Qué es | Va al repo |
|---|---|---|---|
| raíz (16 `.dc.html` + `support.js` + `github.md`) | 1.0 MB | Diseño y runtime del canvas | Solo como referencia, no se importa |
| `uploads/` (136 archivos) | 35.7 MB | Capturas del sitio viejo, referencias (Apple, Louis Vuitton, Freitag, Orbe, Sweetgreen, Uber, Django Unfold), mock de Stitch, mascota en varios tamaños, video y su póster | No; solo consulta |
| `docs/design/capturas-actuales/` | 16.3 MB | Capturas del sitio actual | No |
| `public/` (47 archivos) | 6.6 MB | Fotos de producto `.webp`, `marca/` (monograma 512 y 320, favicon 16 y 32), `recursos_web/` | Sí, tras revisar (ver riesgos) |
| `docs/design/assets/` | 0.4 MB | Mascota en `.webp`, dos pósters del video | Sí, lo que use la web |
| `scraps/`, `thumbs/` | 2.1 MB | Recortes de trabajo y miniaturas | No |

Fuentes: Fraunces (variable, opsz 9 a 144) y Geist (400 a 700), cargadas desde Google Fonts. En el repo conviene autoalojarlas.

Video del hero: `uploads/video-portada-carne.mp4`, H.264, 1280 x 720, 10 s, 24 fps, 1.6 MB, sin audio. El README del video menciona además `.webm` y `.mp4` en `assets/video/`; esos dos archivos no vienen en el zip (solo los dos pósters `.jpg`).

## 2. Lectura del verificador (30/43)

Informe base: `docs/design/verificacion/export-diseño1.1.md`. No se rehízo; solo se clasificaron los 13 fallos.

| Fallo | Causa real |
|---|---|
| Bitácora PARCIAL (8 coincidencias) | Real. Hay 4 entradas PARCIAL en la Bitácora: A1 Índice con miniaturas, B1 Movimiento, C1 Acceso con mascota, C2 Métricas del chatbot |
| Índice con miniaturas (2 de 16) y "miniatura pendiente" (1) | A1 pendiente. Las 50 fichas del Índice muestran el hueco gris "miniatura pendiente · 390 x 844". La coincidencia de "por tomar" en Catálogo y ficha es una nota de documentación ("Fotos por tomar en sesión: los 44 productos sin foto propia"), no texto de interfaz |
| Curva de hojas, Acceso 480 ms | B1 pendiente (falta el cuadro Movimiento) |
| Arco y paneles de la mascota | C1 pendiente en código: falta montar `panel-escritorio` y `panel-movil`, el cambio de pose a los 229 ms y la tira de 5 cuadros. Visualmente sí hay un arco recortado en el panel rojo (captura 10) |
| "me sirvió", "Enseñar la respuesta", "Pasar a preguntas frecuentes", teléfono enmascarado, "¿cuánto vendí esta semana?", AdminNav con Clientes, Chatbot y BuildAds | C2 pendiente: las pantallas 43 a 45 están marcadas "Se diseña en la pasada 3" y AdminNav no tiene entrada de chatbot. "Corregir" aparece 2 veces solo por casualidad en BuildAds |
| Orden de secciones del Landing | Falso negativo. El script tomó la primera aparición de "Filete Mignon" (posición 59, dentro del texto introductorio de la página). El orden real de los `h2` renderizados es correcto (sección 6f) |

## 3. Inventario de lo que el diseño contiene

Cada archivo muestra sus pantallas en dos marcos: móvil 390 y escritorio 1440. No hay marco de tablet.

### 3.1 Landing (07)

Encabezado (componente) y, en orden vertical, verificado con posiciones renderizadas:

| # | Sección | Contenido | Móvil (px desde el tope) | Escritorio |
|---|---|---|---|---|
| 1 | Hero | Video a sangre de fondo, titular Fraunces 56 px (móvil) y 96 px (escritorio) que aparece palabra por palabra cada 50 ms, botón rojo "Ver productos", botón de pausa de 44 px, velo de degradado 0 %, 55 %, 80 % | 512 (titular) | 573 |
| 1b | Franja de datos | Entrega a domicilio "Pedido mínimo $150", Recoger "Sin mínimo", "Lunes a sábado 8:00 a 17:00" | tras el hero | tras el hero |
| 2 | "Todo lo del mostrador" | Bento de 9 categorías: Carnes rojas (grande), Cortes especiales, Pollo, Cerdo, Preparadas, Embutidos, Ofertas, Merch, Otros | 1063 | 1092 |
| 3 | "Filete Mignon" | Carrusel `scroll-snap` de 8 fotos (Filete Mignon, Rib Eye, Tomahawk, New York Strip, Porterhouse, Arrachera, Flank Steak, Top Sirloin) con 8 puntos y flechas en escritorio; texto fijo con descripción, $689 / kg, Agregar y Ver la ficha | 2547 | 2234 |
| 4 | "Lo que se lleva la gente" | 4 tarjetas (Flank Steak, Top Sirloin, Bistec de Res, Diezmillo) | 2859 | 2800 |
| 5 | "Ofertas" | 4 tarjetas de paquete (Asador $1,599, Parrillada Familiar $3,249, Carnitas $389, Vacío en Oferta $379 / kg) con la nota "Todo paquete requiere un 50 % de anticipo" | 3644 | 3540 |
| 6 | "Preguntas frecuentes" | Acordeón de 5 preguntas (pedido mínimo abierta, zonas, precio en vez de peso, peso no exacto, cómo pago); en escritorio, botón "Escribir por WhatsApp" | 4367 | 4426 |
| 7 | "Carnicería de familia, pieza por pieza" | Texto de la carnicería, ubicación con "Cómo llegar", y en escritorio tres cifras: 4.7 de 5 con 61 opiniones, 53 productos, 8:00 a 17:00 | 5306 | 4969 |
| 8 | "Horarios y puntaje" | Lunes a sábado 8:00 a 17:00, domingos y festivos cerrado, calificación 4.7 | 5897 | 5609 |
| 9 | "Contacto y dirección" | Tarjetas de Teléfono (+52 444 271 5470), WhatsApp (botón rojo "Chatear"), Correo; filas de Facebook e Instagram; mapa de Google incrustado con "Cómo llegar" | 6230 | 5879 |
| 10 | "Comentarios" | 4.7 con 61 opiniones en Google; dos filas de reseñas que se desplazan en direcciones opuestas (animación de 70 s); botón "Detener el giro" | 7402 | 7128 |
| 11 | Pie | Componente Pie | 7961 | 7744 |

Además: variantes A y B de "Contacto directo" al final del archivo (una de ellas con verde `#25D366` solo en WhatsApp), tabla de autorrevisión y notas "De lo nuestro / De lo mío / Mejora".

### 3.2 Catálogo (08) y ficha (09)

- Catálogo: encabezado editorial (kicker "CATÁLOGO", categoría, descripción, conteo), rejilla de Tarjeta (2 columnas en móvil, 4 en escritorio), filtros: en móvil un riel de chips pegado al hacer scroll (con 4 categorías caben sin desplazar; con 20 aparece "Todas · 20" que abre el menú), en escritorio columna lateral fija con 9 categorías. Estados de tarjeta: normal, "Pocas piezas", "Agotado" (atenuada).
- Ficha (ejemplo Porterhouse): migas, una sola foto ("Foto propia del producto · una sola foto, sin galería"), precio por kg y por libra, selector "¿Cómo lo quieres?" con tres modos (Por peso con stepper y atajos de ½, 1, 1½, 2 kg; Por precio con "Te cortamos unos 518 g"; Por pieza), Grosor (1", 1¼", 1½", 2", 2½"), total aproximado, "Agregar al carrito" (rojo), "Guardar en favoritos", aviso de que el peso final puede variar, sección "Va bien con" con 4 tarjetas. En móvil, barra inferior fija con total y Agregar.

### 3.3 Inicio de sesión del cliente (10 a 16)

Siete pantallas: Ingresar, Registrarse, Recuperar (pedir correo, revisa tu correo, código de 6 dígitos, nueva contraseña) y Sin conexión.

- Escritorio: dos mitades. Un panel rojo `#DC2626` de unos 640 px con el carnicero en un arco recortado y un mensaje cruzado ("¿Primera vez por aquí?" en Ingresar, "¿Ya compras con nosotros?" en Registrarse, con botón que lleva a la otra pantalla), y el formulario en la otra mitad.
- Móvil: panel rojo compacto con mascota de busto arriba y selector segmentado Ingresar / Registrarse.
- Campos de 52 px, foco rojo con anillo de 2 px, error con borde rojo e ícono, verde solo cuando algo salió bien. Registrarse: nombre, correo, contraseña con medidor de fuerza y 4 reglas, bloque opcional "Para tus entregas" (teléfono con WhatsApp, calle, colonia, código postal).

### 3.4 Perfil del cliente (34 a 41, 46, 47)

Diez secciones: Mis pedidos, Mis direcciones, Favoritos, Recetario, Receta abierta, Calorías y proteína, Recetas guardadas, Mi nivel, Mi enlace de afiliado, Mis datos. Cada una con su estado vacío al lado. Escritorio: columna fija a la izquierda con avatar y nivel. Móvil: riel de chips bajo el encabezado, sin cajón. Niveles: Vecino 0 % (al registrarse), Asador 5 % (desde 5 pedidos o $3,000), Parrillero 10 % (desde 20 pedidos o $12,000). Marcado "falta backend": recetario, recetas guardadas, calorías, niveles y afiliado.

### 3.5 Compra (17 a 19)

Checkout en 4 bloques: 1) recibir (a domicilio, mínimo $150, o recoger sin mínimo), 2) datos, 3) dirección de entrega (con "Cambiar", que abre hoja en móvil o ventana en escritorio), 4) pago ("Pagar al recoger o al recibir" primero; "Tarjeta en línea" por pasarela, marcada falta backend, sin campos de tarjeta). Resumen "Tu pedido" con renglones, "¿Tienes un código?" plegado y total en arena. Incluye variante con paquete y anticipo del 50 %. Después, Confirmación con número de pedido y Estado del pedido.

### 3.6 Panel administrativo (20 y 21)

- Inicio: selector Hoy / 7 días / 30 días, 4 KPI (Ventas $8,420, Pedidos 23, Ticket promedio $366, Stock bajo 5) cada uno con minigráfico de 7 días, gráfica "Ventas por día" de 14 barras (eje $0 a $15k, hoy en rojo), lista de stock bajo, tabla "Últimos pedidos".
- Pedidos: tablero de 5 columnas; en escritorio se arrastra la tarjeta, en móvil se usa "Avanzar a Confirmado" con la siguiente pila asomando a la derecha; cancelados fuera del flujo.

### 3.7 Productos, clientes y ajustes (22 a 27, 48)

Productos (lista con buscador y filtros), Alta y edición por pestañas, Confirmar borrado y cambio de precio, Clientes (312 clientes, 27 nuevos este mes, 64 % vuelve a comprar, ficha lateral), Ajustes (tienda y redes, zonas de entrega con 8 colonias y 1 solo para recoger, asistente con horario y 4 reglas de paso a WhatsApp), Cerrar sesión.

### 3.8 AdminNav (componente)

Tres modos: `escritorio` (aside fijo de 248 px), `movil-arriba` (barra de 56 px con hamburguesa o flecha, título y acción) y `movil-abajo` (5 pestañas: Inicio, Pedidos, Productos, Clientes, Más). Entradas: Inicio, Pedidos (con contador 7), Productos, Clientes, BuildAds, ProductAds, Ajustes. Sin entrada de chatbot. Pie del aside: avatar "Eduardo Torres / Administrador" y "Cerrar sesión".

### 3.9 Encabezado, Pie, Tarjeta

- Encabezado: hamburguesa a la izquierda, logotipo tipográfico al centro, lupa y carrito con contador a la derecha; 56 px en móvil, 72 px en escritorio (60 px con scroll y sin subtítulo). Dos estados solamente: arriba (`#0B0B0C`) y con scroll (`#151517`).
- Pie: marca con lema, tres botones redondos de redes (Facebook, Instagram, WhatsApp), columna Información (Sobre nosotros, Productos, Contacto), columna Contacto rápido (teléfono, correo, dirección) y derechos.
- Tarjeta: un solo componente con variantes `normal`, `agotado`, `oferta` y `chica`. Foto, nombre en Fraunces, precio por kg y por libra, botón "+" de 44 px que se expande a "Agregado" 1.5 s, hover -2 px, presión 0.97 en 160 ms.

### 3.10 Componentes (01 a 06 y 49), más Cierre, BuildAds y ProductAds, Inventario Django, Índice

- Componentes: Logotipo y monograma (49), Encabezado (01), Menú lateral con categorías en chips (02), Buscador a pantalla completa en tres estados (03), Tarjeta (04), Carrito (05), Burbuja y panel del asistente (06), hoja de tokens y contrato de tokens.
- Cierre: reúne Tarjeta única, Botones, Campos, Chips / segmentado / insignias / estados y la tabla "Lo que no coincidía y cómo quedó".
- BuildAds y ProductAds (42a a 42i, 50): estado vacío, asistente de 5 pasos (canal, objetivo, presupuesto y zona, creativo, cuenta), campañas retomables, revisión con aprobación humana, ProductAds con interruptor, y "Catálogo de la semana" (hoja A4 794 x 1123 y carrusel de 6 cuadros de 1080 x 1350, botones Descargar, Compartir y Abrir en Canva). Todo marcado "falta backend".
- Inventario Django (28 a 33): mismas piezas en HTML plano sin modales; menú del teléfono con `<details>`; tarjeta de inventario propia con Editar y Borrar.
- Índice: 50 fichas en 9 grupos, con las miniaturas todavía como huecos grises.

## 4. Tokens realmente usados

Conteo sobre los 15 archivos de diseño (sin el Índice).

**Contrato declarado** (Componentes, "Contrato de tokens para copiar al repo"), ya escrito como `@theme` de Tailwind v4:

| Token | Valor | Usos |
|---|---|---|
| bg | `#0B0B0C` | 257 |
| surface-1 / 2 / 3 | `#151517` / `#1C1C1F` / `#232326` | 343 / 191 / 12 |
| border | `#3F3F46` | 922 |
| text | `#F5F3EF` | 576 |
| text-muted | `#A8A29B` | 944 |
| red / red-hover | `#DC2626` / `#C81E1E` | 325 / 21 |
| sand | `#E4D1B0` | 456 |
| gold | `#F59E0B` | 42 |
| success | `#059669` | 94 |
| danger | `#F43F5E` | 8 |

Radios declarados: card 16, input 12, dialog 20, sheet 24, pill 999. Fuentes: `--font-display` Fraunces, `--font-sans` Geist. Espaciado: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96. Easing declarado: `--ease-out-expo: cubic-bezier(.16, 1, .3, 1)`.

**Usado pero fuera del contrato:**

- Colores: `#FFFFFF` (128, texto sobre rojo), `#52525B` (18), `#25D366` (6, verde de WhatsApp), `#F2DCC4` (2), `#C8302F` (1); scrims `rgba(11,11,12,0.72)` (13), `0.8`, `0.78`, `0.6`, `0.55`; tinte `rgba(220,38,38,0.12)` para el ítem activo.
- Radios: 999 (597), 12 (136), 16 (100), 14 (94, sin token), 20 (66), 24 (23), y sueltos 10, 8, 18, 28, 6, 4, 32. Burbujas de chat asimétricas `16 16 16 4` y `16 16 4 16`; hojas `28 28 0 0` y `24 24 0 0`.
- Tipografía: cuerpo 12, 13, 14, 15 (el más usado, 439), 16; títulos 17, 18, 19, 20, 22, 24, 26, 28, 30 (69), 32, 34, 36, 40, 44, 48, 64, 84, 96. Pesos 600 (916 usos), 500, 400 y pesos fraccionarios de fuente variable 420, 440, 460, 480, 560. Interletraje: 0.04em (187 usos, en mayúsculas), 0.14 a 0.22em (logotipo y subtítulos), -0.03 a -0.01em (titulares). `text-transform: uppercase` en 173 lugares. Cifras con `tabular-nums`.
- Espaciado: además de la escala, `gap` de 6 (148), 14 (106), 10 (101), 3, 2 y 28. Relleno más común `12px 16px` (158).
- Sombras: ninguna real (solo `inset` de 2 px en dos sitios). Profundidad por borde y por cambio de superficie.
- Degradados: uno (velo del hero). Vidrio o `backdrop-filter`: ninguno. Filtros: `saturate(0.6)` para agotado.
- Movimiento: `cubic-bezier(0.23, 1, 0.32, 1)` (19 usos) domina; el contrato declara otro (`.16, 1, .3, 1`, 2 usos), no coinciden. Duraciones: 160 y 180 ms (tarjeta y botón), 420 ms con 50 ms de escalón (titular), 200 ms (altura del encabezado), 350 y 700 ms (transformaciones de hojas), 70 s (reseñas). Hay `prefers-reduced-motion` para tarjeta, titular y reseñas; el video no tiene manejo propio más allá del botón de pausa.
- Estados: focos con anillo rojo de 2 px en campos; hover de borde `#3F3F46` a `#E4D1B0` en botones de ícono.

**Contraste medido** (contra fondo `#0B0B0C` salvo indicación): texto `#F5F3EF` 17.75:1; muted `#A8A29B` 7.78:1 (6.72:1 sobre surface-2); arena 13.16:1; blanco sobre botón rojo 4.83:1; rojo como texto 4.07:1 (3.78:1 sobre `#151517`); borde `#3F3F46` 1.88:1. El diseño hace `a { color: #DC2626 }` en todas las páginas, así que los enlaces rojos pequeños (por ejemplo "Editar" en direcciones) quedan por debajo de 4.5:1. El borde de 1.88:1 no llega a 3:1 como límite de campo.

## 5. Overlays, cajones, hojas y menús

"Esc" y "fondo" describen lo que el diseño especifica. El export es estático: solo el buscador de escritorio escribe "Esc para cerrar"; ninguna otra pieza documenta cierre con Escape ni con toque en el fondo, así que esos comportamientos hay que definirlos al implementar.

| Overlay | Dónde | X visible | Esc | Fondo (scrim) |
|---|---|---|---|---|
| Menú lateral público, móvil 328 px y escritorio 400 px | Componentes 02 | Sí, 44 px, `aria-label="Cerrar el menú"`, arriba a la derecha | No especificado | Scrim dibujado (0.72), cierre por toque sin especificar |
| Buscador a pantalla completa (3 estados móvil, 1 escritorio) | Componentes 03, Cierre | Sí, 48 px móvil y 52 px escritorio | Escritorio: rótulo "Esc para cerrar" | No aplica (pantalla completa) |
| Asistente: hoja móvil con agarradera y panel de escritorio de 400 px | Componentes 06 | Sí, 44 px, "Cerrar el asistente" | No especificado | Móvil: el encabezado queda atenuado; toque sin especificar |
| Carrito: hoja móvil, hoja vacía y cajón derecho de 440 px | Componentes 05 | Sí, 44 px, "Cerrar el carrito" (3 apariciones) | No especificado | Scrim dibujado, toque sin especificar |
| Dirección de entrega: hoja móvil y ventana de escritorio | Compra 17 | Sí, 44 px, "Cerrar", además de "Cancelar" en escritorio | No especificado | Scrim dibujado |
| Confirmar cambio de precio, Confirmar borrado o desactivar, Cerrar sesión | Productos 24 y 27 | No. Cierran con "Cancelar" o "Seguir en el panel" | No especificado | Sin página de fondo ni scrim dibujados |
| **AdminNav móvil: botón hamburguesa "Abrir el menú"** | AdminNav `movil-arriba` | **No hay cajón diseñado, por lo tanto no hay X ni ningún estado abierto** | No | No |
| AdminNav escritorio | AdminNav `escritorio` | Aside fijo de 248 px, no se cierra | n/a | n/a |
| Asistente de campañas de BuildAds | BuildAds 42b a 42f | Página completa con botón "Salir" (ícono X + texto, 44 px móvil, 48 px escritorio); oculta AdminNav | No especificado | n/a |
| Menú del teléfono del Inventario Django | Django | Desplegable `<details>` "Menú", no es overlay | n/a | n/a |
| Menú de Mi cuenta | Perfil | Riel de chips en móvil, columna fija en escritorio; no es overlay | n/a | n/a |

Sobre la queja de Eduardo: el menú deslizable del panel que critica no existe en este export. La barra superior móvil de AdminNav pinta una hamburguesa y las pestañas inferiores ya cubren cinco destinos, con lo que hay dos navegaciones a la vez. La pestaña "Más" solo enlaza a la página de Productos (`Productos, clientes y ajustes`), sin lista que ofrezca BuildAds, ProductAds, Ajustes ni Cerrar sesión. En consecuencia, en móvil no hay camino diseñado hacia BuildAds y ProductAds salvo el resaltado de "Más" cuando esas pantallas están activas. Hay que diseñar un cajón (X de 44 px arriba a la derecha, scrim, Esc, foco atrapado, cierre al elegir destino) o sustituir la hamburguesa por una hoja "Más" con X.

Otras marcas: los botones de puntos del carrusel del Landing miden 28 x 28 px (2 en el archivo), por debajo de los 44 px que el propio diseño exige; los botones "Quitar reciente" del buscador miden 40 x 40.

## 6. Contraste con el feedback de Eduardo

**(a) Video del hero en móvil: NO cumple.** El hero mide 388 x 700 px (83 % de 844); en escritorio, 1438 x 765 px (85 %). El video de 1280 x 720 se recorta con `object-fit: cover`, así que en móvil solo se ve alrededor del 31 % del ancho del cuadro. Una caja 16:9 a 390 px de ancho mide 219 px, cerca de un tercio de la actual, y mostraría el cuadro completo. Sí cumple que el video va como fondo detrás del texto, con botón de pausa y velo de degradado. El texto arranca en 455 px dentro del hero móvil; con 219 px de alto hay que rehacer la composición (titular más chico o video 16:9 bajo el encabezado con el texto encima). README del video: la fuente de 1280 px se ve blanda a pantalla completa en escritorio. Captura 01.

**(b) Efecto del encabezado: se perdió.** El encabezado del diseño es una fila propia, opaca, encima del hero (no lo cubre), con solo dos estados de fondo: `#0B0B0C` arriba y `#151517` con scroll. El hover solo cambia el borde de los botones de ícono (`#3F3F46` a `#E4D1B0`). No hay estado transparente sobre el video ni cambio de fondo al pasar el cursor. Referencia del sitio anterior (leída de solo lectura en `~/Desktop/Carni-mvp/css/layout/_header.scss`, rama `practicas-ebac`): `.main-header--over-media` deja el fondo transparente con un velo superior (`rgba(0,0,0,.55)` a 0), `:hover` y `:focus-within` pasan a `rgba(0,0,0,.92)` en 0.3 s, el héroe sube por debajo del encabezado con margen negativo igual a `--header-height` (56, 64, 72 px), y `.main-header--solid` (`#0a0a0a` con línea y sombra, 0.32 s) toma el control al bajar. Ese comportamiento es el que hay que devolver al React.

**(c) Burbuja del chatbot: parece un chat genérico. Confirmado.** Cerrada: círculo de 56 px con borde arena y glifo de burbuja de chat en móvil; píldora de 48 px "¿Te ayudo con el corte?" con el mismo glifo en escritorio. Abierta: panel neutro (globos grises del asistente a la izquierda, globo arena del usuario a la derecha, respuestas rápidas, campo y botón de envío rojo, tarjeta chica para recomendar). No hay avatar, nombre, rostro ni voz de carnicero. Los recursos de la mascota existen (`carnicero-ingresar-busto@2x.webp`, 19 KB) pero solo se usan en el acceso. La burbuja móvil está posicionada con `top: 772px` absoluto en el marco, es decir, el diseño no dice dónde queda fija (esquina inferior derecha) ni cómo convive con la barra inferior. Captura 07.

**(d) Logotipo tipográfico: cumple.** "CARNICERÍA" en Geist 560, interletraje 0.22em, subtítulo "EL SEÑOR DE LA MISERICORDIA" a 0.16em entre dos líneas de 1 px, monograma "C" para íconos (512, 320 circular, favicon 32 y 16). El verificador confirma 0 logotipos en imagen. Una excepción: el marco de escritorio del carrito en Componentes (línea 1236) conserva un placeholder viejo, un cuadro rojo con "C" y el texto "Carni". Captura 04.

**(e) Tarjeta de producto única: cumple.** `Tarjeta.dc.html` es un solo componente con 4 variantes (`normal`, `agotado`, `oferta`, `chica`) y 52 usos en 7 archivos (31 normales, 15 `chica`, 2 `oferta`, 4 dinámicos). Hay dos piezas que no son Tarjeta: la diapositiva grande del carrusel "Filete Mignon" (foto con rótulo) y la tarjeta de inventario del Django. El Inventario Django la describe como "la misma tarjeta del sitio", pero es otra composición (kicker de categoría, "Existencia", Editar y Borrar). Captura 09.

**(f) Orden del Landing: cumple en ambos anchos.** Hero, mostrador, Filete Mignon, lo que se lleva la gente, ofertas, preguntas frecuentes, carnicería de familia, horarios y puntaje, contacto y dirección, comentarios, pie. Posiciones en la sección 3.1. El único desvío es interno: el carrusel "Filete Mignon" no concuerda con su texto (ver riesgos). Capturas 02 y 03.

## 7. ¿Qué se lee como Canva y qué como editorial moderno?

Se lee editorial moderno: fondo casi negro con neutros cálidos, un rojo de acento, arena para detalle; contraste serif expresivo (Fraunces con pesos fraccionarios y `text-wrap: balance`) contra grotesca sobria (Geist); cifras tabulares; bordes finos en lugar de sombras; íconos de trazo único de 1.8 px; fotografía como protagonista; logotipo tipográfico; sin emojis, sin gradientes decorativos, sin vidrio, sin sombras duras, sin texto degradado.

Puntos con aire de plantilla o de Canva, ordenados por peso:

1. **Panel rojo con mascota del acceso** (captura 10). Ilustración de caricatura plana con contorno grueso dentro de un panel rojo saturado de ~640 px con recorte en arco. Es el único lugar donde el rojo es superficie y no acento, y es lo más cercano a un banner de plantilla. La mascota es identidad del negocio; lo cuestionable es el panel rojo completo y el tamaño.
2. **Fotos repetidas** (captura 09). "Carnes rojas" muestra seis tarjetas con la misma foto base y distinto recorte; 44 de 53 productos no tienen foto propia (solo 9 fotos propias). Las miniaturas de las categorías Otros y Merch parecen generadas con IA (letrero "OTROS PRODUCTOS", frascos). Esto es lo que más delata "stock" en el conjunto.
3. **Kickers en mayúsculas sobre cada título**: 8 en el Landing (Categorías, De la vitrina, Cortes especiales · 20 en stock, Los más pedidos, Esta semana, Antes de pedir, Sobre nosotros, Ubicación) y 173 usos de `uppercase` en todo el diseño. Es un tic de plantilla editorial; el titular Fraunces ya carga el peso.
4. **Tarjetas de KPI con número grande, delta y minigráfico** en 4 de 4 KPI del panel: es el patrón "hero metric" de tablero genérico; los minigráficos son decorativos (28 y 36 px de alto).
5. **Barra roja de 3 px a la izquierda** en el ítem activo (AdminNav, menú lateral, Mi cuenta): raya lateral de acento, fórmula repetida de plantillas de panel.
6. **Botones e inputs todo en píldora (999 px, 597 usos)**: cohesivo, pero es la forma por defecto de SaaS.
7. **Burbuja del chat** como círculo o píldora con glifo de chat estándar (punto c).
8. **Ruido de diseño dentro de la interfaz**: la etiqueta "EJEMPLO · EN PRODUCCIÓN SALEN DE GOOGLE O FACEBOOK · FALTA BACKEND" sobre "Comentarios", "ejemplo · confirmar con el dueño" junto a la calificación, y las píldoras naranjas "falta backend" (aparecen en 11 de los 16 archivos). No deben llegar al React como texto.

## 8. Riesgos para pasar a React + Tailwind v4

1. **Runtime no portable.** `support.js` y las etiquetas `dc-*` son propios de Claude Design; el paso a React es reescritura, no conversión.
2. **Carrusel "Filete Mignon" incoherente**: 8 fotos de 8 cortes con un texto y un precio fijos ($689, "Ver la ficha") que no cambian con la foto activa. Hay que decidir si es galería de un producto o carrusel de cortes.
3. **Hero móvil de 700 px y encabezado sólido** contradicen lo que Eduardo pidió (a y b).
4. **Panel móvil sin cajón** y sin acceso a BuildAds, ProductAds, Ajustes ni chatbot.
5. **Pendientes de diseño**: Métricas del chatbot (43 a 45), acceso final con mascota, Movimiento, Índice con miniaturas, tablet.
6. **Cobertura de fotos**: 44 de 53 productos sin foto propia; `rib-eye.webp` es en realidad un T-bone y `frutasverduras*.webp` pertenece a una categoría que no existe; `premium*.webp` pide revisión por marcas de agua (notas del propio diseño).
7. **Datos sin confirmar**: correo con dos dominios (`carniceriasenmisericordia.com` en el pie, `carniceriamisericordia.com` en `chatbot.js`); calificación 4.7 con 61 reseñas y reseñas de ejemplo (falta backend); colonias de entrega "confirmar con el dueño"; nota "Confirmar con el dueño" dentro de todas las tarjetas de paquete, redactada de forma que no se sabe si es texto para el cliente o una nota interna.
8. **Faltan funciones de backend** marcadas: pago con tarjeta, recetario y niveles, BuildAds y ProductAds, asistente con catálogo real, plantilla de correo en Supabase para el código de 6 dígitos.
9. **Deriva de tokens**: `--ease-out-expo` del contrato no es la curva que usan los componentes; hay 14 px de radio (94 usos) y otros radios sin token; los enlaces rojos por defecto no llegan a 4.5:1.
10. **Google Maps incrustado** y **Google Fonts** externos: revisar CSP y política de privacidad; autoalojar fuentes.
11. **Dos marcos** (390 y 1440): los saltos intermedios (768 a 1280) los tiene que decidir la implementación.

## 9. Preguntas que solo Eduardo puede responder

1. En el carrusel "Filete Mignon": ¿es un carrusel de 8 cortes distintos (entonces el título, texto y precio deben cambiar con cada foto) o una galería del Filete Mignon?
2. Hero móvil: ¿16:9 exacto (390 x 219) como fondo con el titular encima, o 16:9 más alto con el texto debajo del video?
3. Cajón del panel en móvil: ¿quieres mantener la hamburguesa (con cajón y X) o preferir una pestaña "Más" que abra una hoja con X que liste Clientes, BuildAds, ProductAds, Ajustes y Cerrar sesión?
4. ¿Las confirmaciones destructivas del panel (borrar, cambiar precio, cerrar sesión) deben llevar también X además de "Cancelar", o basta con "Cancelar"?
5. Panel rojo del acceso: ¿se mantiene la mascota con panel rojo completo, o solo la mascota sobre fondo oscuro?
6. La burbuja del asistente: ¿debe usar el busto del carnicero como avatar y tener nombre propio?
7. ¿Qué correo es el correcto: `contacto@carniceriasenmisericordia.com` o el dominio `carniceriamisericordia.com`?
8. ¿"Confirmar con el dueño" en las tarjetas de paquete es texto para el cliente o una nota interna?

## 10. Evidencia

Capturas en `docs/design/rediseno/investigacion/capturas-1.1/`:

| Archivo | Muestra |
|---|---|
| `01-hero-movil-700px-vs-16x9.jpg` | Hero móvil de 700 px con el 16:9 pedido superpuesto en amarillo |
| `02-landing-movil-secciones.jpg` | Landing móvil completo en dos tiras |
| `03-landing-escritorio-secciones.jpg` | Landing escritorio: hero, mostrador, carrusel, ofertas, preguntas, contacto, comentarios, pie |
| `04-encabezado-y-logotipo.jpg` | Estados del encabezado (arriba y con scroll) y hoja del logotipo |
| `05-menu-lateral-publico.jpg` | Menú lateral móvil y escritorio con X |
| `06-buscador-pantalla-completa.jpg` | Buscador en tres estados y escritorio con "Esc para cerrar" |
| `07-asistente-burbuja-y-panel.jpg` | Burbuja cerrada, hoja móvil y panel de escritorio |
| `08-carrito-hoja-y-cajon.jpg` | Carrito en hoja, vacío y cajón |
| `09-catalogo-tarjeta-unica.jpg` | Catálogo móvil y escritorio con la Tarjeta |
| `10-acceso-ingresar-mascota.jpg` | Ingresar y Registrarse con el panel rojo y la mascota |
| `11-admin-inicio-y-adminnav.jpg` | Panel Inicio con barra móvil (hamburguesa) y AdminNav de escritorio |
| `12-admin-confirmaciones-sin-x.jpg` | Hojas y ventana de confirmación sin X |

## 11. Método y límites

- Renderizado con Chrome headless (`--headless=new`, ventana de 2000 a 2400 px de ancho) servido con `python3 -m http.server 8801` desde una copia extraída en el directorio temporal de la sesión; capturas de regiones con el protocolo de depuración del propio Chrome. El servidor y el navegador se detuvieron al terminar.
- Los números de tamaño, posición y orden salen del DOM renderizado (`getBoundingClientRect`) y del HTML fuente. El contraste se calculó con la fórmula WCAG 2.
- Las conclusiones sobre Escape, cierre por fondo y foco son sobre lo especificado en el diseño; al ser un canvas estático, no hay comportamiento que probar.
- No se ejecutó `web-design-guidelines` contra su fuente remota (revisa código, no un export de diseño); los criterios de "aire de plantilla" siguen la guía de la skill `impeccable`.
- No se revisó pantalla por pantalla el contenido de Recuperar contraseña (12 a 15), Sin conexión (16), Recetario ni las pantallas 42d a 42i de BuildAds más allá de sus títulos y su código.
