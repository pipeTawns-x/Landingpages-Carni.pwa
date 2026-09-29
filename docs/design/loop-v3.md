# Loop v3 · tandas cortas, verificadas por pasada

## Qué aprendimos de la pasada 1

**Sí funcionó** (export `diseños1.zip` y chat de Claude Design, 2026-09-29):
- los puntos 1.2 a 1.7, en CERRADO:
  - el logotipo y el monograma (pantalla 49);
  - 87 `href="#"` pasaron a 0, con los links reales;
  - Mis datos (47) y Recetas guardadas (46);
  - Ajustes (48), con sus tres secciones y las 9 categorías reales;
  - las frases de Paquetes y la pantalla "Compra con paquete";
  - el Catálogo de la semana (50);
- la tanda 1A: "salmón" en lugar de "picaña", "Revisa tu correo" sin plazo, la nota de Supabase, 4 de 4 KPI con minigráfico, el eje hasta $15k y el Índice sin imágenes rotas.

**No funcionó:**
1. **La pasada era demasiado grande**, y el límite de 5 horas, que comparten Claude Design y Claude Code, la cortó a medias.
2. **Las miniaturas.** Claude Design no puede tomarse capturas a sí mismo. Las genera Claude Code al final, cuando las pantallas ya no cambian.
3. **La premisa de la picaña.** En la base no hay picaña, así que el ejemplo de "sin resultados" ahora es "salmón".
4. **Falta cerrar formalmente la pasada 1:** la tabla de contraste medida, la revisión en pantalla de lo que cambió en 1A, el abogado del diablo y "PASADA 1 LISTA".

## Cómo se trabaja

- **Una tanda por mensaje, en este orden:** 1C → 2A → 2B → 2C → 3A → 3B → F. Cuando Claude Design escriba "TANDA X LISTA" o "PASADA N LISTA", se pega la siguiente.
- **Antes de la tanda 2A**, en Claude Design se abre un chat nuevo ("New chat"). El proyecto y los archivos se quedan, y cada mensaje deja de cargar los 341k tokens del chat viejo.
- **Presupuesto.** Si el límite de 5 horas pasa del 80 %, Claude Design termina la tanda en curso y se detiene. Eduardo puede preguntar en Claude Code "¿cómo vamos?" para leer el uso real.
- **Verificación por pasada.** Al cerrar las pasadas 1, 2 y 3, Eduardo exporta el .zip a Descargas y avisa en Claude Code. Claude Code corre `docs/design/verificacion/verificar_export.py` y anota el resultado en `loop-estado.md`. Si algo falla, da una línea de correcciones.
- **Tanda F.** Después de la pasada 3, Claude Code genera las miniaturas en `docs/design/miniaturas/` a partir del último export, y luego se pega la tanda F.

## Mensajes para pegar en Claude Design

### Tanda 1C · cierre de la pasada 1

```
TANDA 1C · cierre de la pasada 1. Reglas: docs/design/loop-final.md (rama pruebas) y la Bitácora del Índice. Solo haz esto:

1. Revisa en pantalla, a 390 y a 1440, lo que cambiaste en la tanda 1A: el Panel (minigráficos y eje), Componentes e Inventario Django ("salmón") y "Revisa tu correo" (pantalla 14). Corrige lo que se vea mal.
2. Tabla de contraste medida: todos los estilos de texto del lienzo (color sobre su fondo), cada uno con su x:1. Si alguno baja de 4.5:1, corrígelo y anótalo.
3. Cierra la pasada 1: el abogado del diablo (3 puntos débiles y cómo los resolviste) y la tabla completa de "Aceptación de la pasada 1", con números.

Al terminar escribe "PASADA 1 LISTA" con esa tabla y detente. Eduardo exportará el .zip.
```

### Tanda 2A · Movimiento (en un chat nuevo)

```
TANDA 2A · Movimiento. Reglas: docs/design/loop-final.md (rama pruebas) y la Bitácora del Índice, que dice qué está CERRADO. Antes lee skills/emil-kowalski/: emil-design-eng, animate, review-animations con STANDARDS.md, apple-design y mobile-native. Solo haz el ítem 2.1: el frame "Movimiento" en Componentes.

Aceptación (con números):
- las 7 filas de 2.1, cada una con duración en ms, curva, reduced-motion y su tira de 3 cuadros;
- ninguna fila pasa de 320 ms;
- la lista de lo que NO se anima;
- el ítem 2.1 en CERRADO en la Bitácora.

Al terminar escribe "TANDA 2A LISTA" con esa tabla y detente.
```

### Tanda 2B · Portada

```
TANDA 2B · Portada. Reglas: docs/design/loop-final.md (rama pruebas), ítem 2.2, y la Bitácora del Índice. Lee assets/video/ y su README.md. Solo haz el ítem 2.2 y agrega a la tabla de Movimiento sus 2 filas: la entrada del titular palabra por palabra y el revelado con clip-path.

Aceptación (con números):
- el video al 100 % del ancho y a 80–85vh, con la nota "Mejora" que dice que mide 1280×720;
- el titular a 4.5:1 o más en su línea más alta, medido sobre assets/video/portada-carne-cuadro-claro.jpg, con el degradado que usaste anotado;
- 0 cajas negras y 0 tarjetas sobre el video, y 1 solo botón principal en la franja;
- 0 marcos vacíos en "Sobre nosotros";
- 2 filas nuevas en la tabla de Movimiento.

Al terminar escribe "TANDA 2B LISTA" con esa tabla y detente.
```

### Tanda 2C · Catálogo, fotos y Compra

```
TANDA 2C · Catálogo, fotos y Compra. Reglas: docs/design/loop-final.md (rama pruebas), ítems 2.3 y 2.4, y la Bitácora del Índice. Usa datos/catalogo-real.md para productos, precios, fotos, categorías y mínimos. Solo haz 2.3 y 2.4.

Aceptación (con números):
- 0 botones con relleno #DC2626 en la rejilla del Catálogo, y como máximo 1 por cuadro completo de 390 y de 1440 (anota el conteo de cada cuadro);
- "foto pendiente" en los 44 productos sin foto propia, y 0 fotos repetidas entre productos distintos;
- el cliente ve solo "Disponible", "Pocas piezas" o "Agotado"; el número exacto, solo en el panel;
- el menú con solo las 9 categorías de la base;
- en Compra, "Pagar al recoger o al recibir" va primero, la tarjeta va segunda con "falta backend", hay 0 campos de tarjeta dibujados y aparecen los mínimos: $0 para recoger y $150 a domicilio.

Luego cierra la pasada 2: el abogado del diablo (3 puntos) y la tabla completa de "Aceptación de la pasada 2". Escribe "PASADA 2 LISTA" y detente. Eduardo exportará el .zip.
```

### Tanda 3A · Acceso

```
TANDA 3A · Acceso. Reglas: docs/design/loop-final.md (rama pruebas), ítem 3.1, y la Bitácora del Índice. Lee assets/mascota/ y su README.md, y referencias/capturas/uber-login-ilustracion. Solo haz 3.1 y agrega su fila a la tabla de Movimiento.

Aceptación (con números):
- escritorio: el carnicero dentro del arco crema (unos 520 px de ancho, del 57 al 62 % del panel), con su sombra de contacto, igual a panel-escritorio-*;
- móvil: el título a la izquierda dentro del panel rojo de 358×232 y el busto a la derecha, igual a panel-movil-*;
- la tira del Acceso con 5 cuadros en 390 y en 1440, 480 ms, cubic-bezier(0.77, 0, 0.175, 1), blur de 2 px o menos durante 120 ms o menos, y 1 carnicero en cada cuadro;
- 0 fundidos entre las dos poses.

Al terminar escribe "TANDA 3A LISTA" con esa tabla y detente.
```

### Tanda 3B · Métricas del chatbot

```
TANDA 3B · Métricas del chatbot. Reglas: docs/design/loop-final.md (rama pruebas), ítem 3.2, y la Bitácora del Índice. Para la pantalla 45 usa referencias/capturas/chatgpt-asistente. Solo haz 3.2.

Aceptación (con números):
- 43 con 6 cifras, 3 periodos, 2 canales, 1 gráfica de 2 series y al menos 5 temas con conteo y tendencia; "Sin respuesta" con sus 2 acciones;
- 44 con "Corregir" en cada respuesta del asistente, la lista de correcciones con "editar" y "apagar", y el teléfono enmascarado;
- 45 con la burbuja abierta y las 2 preguntas de ejemplo;
- AdminNav con Clientes · Chatbot · BuildAds en 1440, y "Chatbot" dentro de "Más" en 390;
- 43, 44 y 45 con "falta backend".

Luego cierra la pasada 3:
- el abogado del diablo (3 puntos);
- la tabla completa de "Aceptación final";
- el Índice actualizado;
- lo que falta de backend, de fotos y de decisiones del dueño.
Escribe "PASADA 3 LISTA" y detente. Eduardo exportará el .zip.
```

### Tanda F · Miniaturas (después de que Claude Code las suba)

```
TANDA F · miniaturas del Índice. En docs/design/miniaturas/ (rama pruebas) está la miniatura de cada pantalla, una por número (NN.webp), y su lista en README.md. Cambia el hueco "miniatura pendiente" de cada ficha del Índice por su miniatura.

Aceptación: 0 huecos "miniatura pendiente" y 0 imágenes rotas en el Índice.

Escribe "TANDA F LISTA" y detente.
```
