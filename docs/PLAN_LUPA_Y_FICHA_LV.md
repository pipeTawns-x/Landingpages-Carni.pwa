# Plan — cerrar la distancia con la referencia real de LV

Fecha: 2026-09-07 · Fuente: el Figma de Eduardo
(`figma.com/design/4MogwdMwRjIOGsyyEVEGXr`) · Rama: `practicas-ebac`

## De dónde sale esto

Tres capas `Html → Body` en ese Figma. **No son dibujos: son DOM real de
louisvuitton.com pegado con la extensión de Kimi** (hay un nodo
`kimi-web-extension → Html → Body` en el árbol). Eso las hace medibles: el panel
de Figma da anchos, altos y padding exactos.

Importa decir por qué esta es la única fuente válida: **louisvuitton.com bloquea
al navegador automatizado** ("Access denied"). No se puede volver a mirar el
sitio en vivo desde aquí. El Figma sí.

Método para releerlo: abrir el archivo en el Chrome real, clic en una capa del
panel izquierdo y `shift+2` (zoom a la selección); doble clic repetido sobre el
lienzo entra un nivel por vez. `~/Downloads` no es legible desde la terminal, así
que exportar PNG no sirve — hay que leer con zoom.

## Lo que dice la referencia

**Popin de búsqueda — 1509 × 1029 px.** Árbol:
`Container > Dialog-false > (Background > Heading 1 > Container×3) + Overlay`,
con el Overlay como HERMANO del diálogo.

Blanco, ancho completo, casi la altura de la ventana. Wordmark centrado arriba.
`×` suelta en la esquina superior derecha. Campo en píldora de ~570px, centrado,
**sin icono de lupa adentro**. Debajo y centrado:
`BÚSQUEDAS DE TENDENCIAS` en versalitas y los términos como **enlaces de texto
plano**, no chips. Rejilla de **seis columnas**, tarjeta **vertical**: imagen
sobre gris ~#F8F8F8 con aire, corazón de favorito arriba a la derecha, nombre de
hasta dos líneas, precio `MXN 67,000.00`. Sin categoría, sin badge, sin botón de
agregar.

**Ficha — 1509 × 5222 px.** Dos columnas: galería de fotos apiladas
verticalmente a la izquierda, panel de 360px **pegajoso** a la derecha (la
columna lleva `padding-bottom: 2743.5px`). Mini-cabecera pegajosa de 1509 × 128
con miniatura + nombre + precio a la izquierda y el botón a la derecha.

Panel, en este orden: SKU gris arriba del título (con corazón a la derecha) ·
título · precio · fila `Colores` con el nombre de la variante alineado a la
derecha y miniaturas de foto debajo · `Seleccione su talla` como fila-acordeón
con chevron y filetes · **un** botón primario en píldora de ancho completo ·
texto de apoyo con enlace · descripción truncada con degradado · filas apiladas
(`Encontrar en la tienda` +, `Entregas y Devoluciones` ›, `Regalos` ›).

## Cómo se verificó

31 brechas mapeadas por cinco revisores en paralelo, y cada una sometida a un
verificador adversarial con la orden de REFUTARLA leyendo el archivo.
**29 confirmadas.** Las dos restantes no son errores de hecho —el código es tal
como se describe— sino decisiones de diseño nuestras que se discuten abajo.

---

## Lo que NO se copia, y por qué

Antes del plan, cuatro cosas que la referencia tiene y aquí serían un error:

1. **El botón negro.** El rojo `#c8302f` es el acento de marca de la carnicería.
   Se cambia el radio a píldora; el color se queda. Copiar el negro de LV no
   tiene razón de negocio.
2. **La etiqueta en gris.** `RowLabel` usa `carniGold`, que
   `src/theme/carniTheme.ts:15` documenta como *"kickers y jerarquía cálida"* —
   una etiqueta en versalitas ES un kicker. El sistema está funcionando. Lo que
   sí cambia es el TEXTO: `Tendencias` → `Búsquedas de tendencias`.
3. **Las miniaturas de foto como variantes.** `Product`
   (`src/types/database.ts:9-22`) tiene un solo `image_url`. Portar el patrón
   sería inventar datos.
4. **El `padding-bottom: 2743.5px`.** Es un parche del DOM de LV. Aquí
   `align-self: start` ya resuelve el pegajoso.

---

## TANDA 1 — la lupa se parece a la referencia (bajo riesgo)

Todo en `src/components/Lupa/Lupa.tsx`. Cambios de estilo, sin lógica.

| # | Qué | Dónde |
|---|---|---|
| 1 | El campo pasa a píldora centrada de 570px: quitar `padding-bottom` y `border-bottom` de `SearchForm`, poner `border: 1px`, `border-radius: 999px`, `max-width: 570px`, `margin: 0 auto` | `:235` |
| 2 | Borrar el icono de lupa de dentro del campo (JSX y el styled) | `:603` y `:243` |
| 3 | Rejilla a seis columnas: `repeat(6, minmax(0,1fr))` con escalones a 4/3/2 hacia abajo. El `minmax(0,…)` no es opcional: con `auto`, un nombre largo desborda la pista | `:363` |
| 4 | Tarjeta vertical: `flex-direction: column`, y el thumb pasa de cuadro fijo de 56px a `width:100%; aspect-ratio: 3/4` | `:367`, `:390` |
| 5 | Fondo `#F8F8F8` + `object-fit: contain` + padding en el thumb. Agregar `surfaceMuted` al tema en vez de clavar el hex | `:390` |
| 6 | Nombre a dos líneas: cambiar el `nowrap`/`ellipsis` por `-webkit-line-clamp: 2`, con `min-height: 2.4em` para que los precios alineen en la rejilla | `:405` |
| 7 | Quitar la etiqueta de categoría de la tarjeta. **`categoryName` NO se borra**: la usa `searchSeed` (`:122`) | `:710`, `:734`, `:414` |
| 8 | Precio `MXN 67,000.00`: `currencyDisplay: 'code'` + 2 decimales fijos. Este `formatPrice` es local al archivo, no se filtra | `:51` |
| 9 | Encabezado de sección: banda gris con margen negativo, en vez del filete que se estira | `:342` |
| 10 | Tendencias como texto: vaciar `Chip` de borde/fondo/padding, subrayado en hover. **Ojo: `RecentChip` extiende `Chip`** y hereda el cambio | `:305`, `:329` |
| 11 | Etiqueta y términos apilados y centrados; texto a `Búsquedas de tendencias` | `:288`, `:656` |

## TANDA 2 — la lupa se comporta como la referencia (medio)

Esta tanda arregla **un defecto real, no una diferencia estética**.

Hoy el popin es **modal para el ratón y no-modal para el teclado**: el `Backdrop`
(`:182`) es `inset: 0` con `pointer-events: auto`, así que el clic queda
atrapado; pero no hay `focus trap`, el resto de la página no está `inert`, y el
foco no vuelve al disparador. Es la peor de las dos combinaciones: quien ve la
pantalla queda encerrado, quien usa lector de pantalla no se entera del encierro.

| # | Qué | Dónde |
|---|---|---|
| 12 | `role="dialog" aria-modal="true" aria-labelledby` en el Popin, y **mover** `role="search"` al `<SearchForm>`, que es su lugar de verdad | `:600`, `:602` |
| 13 | Wordmark de la carnicería como primer hijo de `<Inner>`. Nivel `h2`, no `h1`: `index.html` y `products.html` **no tienen ningún `h1`** y no hay que robárselo. Sirve además de `aria-labelledby` | `:601` |
| 14 | `triggerRef` se guarda en `:539` y **nunca se lee**. El comentario de `:518` promete devolver el foco y el código no lo hace. Llamar `triggerRef.current?.focus()` al cerrar + ciclado de Tab | `:539` |
| 15 | Sacar la `×` de cerrar del formulario a la esquina superior derecha, absoluta. **No siempre son dos botones iguales**: el de limpiar es condicional (`{term ? … }`), así que la confusión aparece justo cuando el cliente ya escribió | `:630` |
| 16 | Popin a altura de ventana (`bottom: 0`) y `overflow-y: auto` en `<Inner>` | `:193`, `:210` |
| 17 | Corazón de favorito: `ResultCard` pasa de `button` a `div` relativo, el nombre se envuelve en un botón con `::after { inset: 0 }` para conservar UN solo control accesible, y el corazón va absoluto encima. **Ya hay tabla `favorites`** (`js/modules/utils/offline.js:140`) | `:367` |

## TANDA 3 — la ficha adopta el patrón del panel (bajo)

Todo en `src/pages/ProductoDetalle.tsx` salvo lo indicado.

| # | Qué | Dónde |
|---|---|---|
| 18 | El lugar de arriba del título es de la referencia, no de la marca: leer `metadata.sku ?? 'CR-{id}'` con el mismo patrón que ya usa `pesoPorPieza()` (`:55-66`). **`.ficha__marca` ya tiene el estilo exacto** que pide la referencia (`redesign.css:917`) — no hace falta CSS nuevo | `:276` |
| 19 | Precio con `Intl.NumberFormat('es-MX')`. Hoy sale crudo. Sacarlo a un helper: el mismo crudo se repite en el resumen (`:406`) | `:280`, `:406` |
| 20 | Fila etiqueta-izquierda / valor-derecha para el modo elegido, con los chips debajo sin tocar | `:289` |
| 21 | El grosor parte en dos spans con `space-between`, en vez del punto medio dentro de la etiqueta | `:367`, `redesign.css:974` |
| 22 | Botón a píldora: `border-radius: 999px`. **Solo el radio** | `redesign.css:1027` |
| 23 | Segunda línea de apoyo con el canal real: WhatsApp con enlace. El descargo del precio se queda, cumple otra función | `:428` |

## TANDA 4 — la ficha se comporta como la referencia (medio/alto)

| # | Qué | Dónde |
|---|---|---|
| 24 | **El pegajoso estaba en el elemento equivocado.** `redesign.css:1095` documenta que se probó `position: sticky` en la FOTO y Eduardo lo rechazó tres veces. En la referencia el pegajoso es el PANEL y la que corre es la galería. Agregar `position: sticky; top: calc(var(--header-height,72px) + 1rem)` a `.ficha__cuerpo`. La grilla ya tiene `align-items: start` (`:1085`) y ningún ancestro tiene `overflow` que lo rompa | `redesign.css:1109` |
| 25 | Galería de varias fotos **sin inventar nada**: `metadata.galeria ?? [image_url]`, y `.ficha__lienzo` a `display: grid`. Con una sola foto el render es idéntico al de hoy — cero regresión — y el día que el panel admin cargue segundas tomas, la columna crece sola y le da altura real al scroll que el pegajoso necesita | `:265` |
| 26 | Mini-cabecera pegajosa con miniatura + nombre + subtotal + el MISMO `agregarAlPedido()`. **El patrón ya está escrito en este repo**: `src/entry/home.tsx:187-219` usa un centinela de 1px con IntersectionObserver y hasta documenta el caso de "el observer no reporta nada". Copiarlo, no reinventarlo. Se oculta arriba de 900px, donde el panel pegajoso ya deja el CTA en pantalla | `:418` |
| 27 | Descripción al final, truncada a 4 líneas con degradado | `:287` |
| 28 | Fila-acordeón con `<details>`: **Observaciones**, que es el campo menos usado. Cantidad y grosor se quedan abiertos — son la decisión principal, esconderlos empeora la compra | `:306`, `:384` |
| 29 | Filas apiladas al final con el contenido que el negocio ya tiene: "Cómo lo entregamos", "Dónde estamos", "Cómo lo cortamos". Reutiliza el CSS de la 28: las dos se cierran con un solo bloque de estilos | `:431` |

---

## Orden y por qué

1. **Tanda 1** primero: es todo estilo, riesgo casi nulo, y es lo que Eduardo ve.
2. **Tanda 2** después: toca semántica y foco. Merece su propia verificación.
3. **Tanda 3** en paralelo si hace falta: no cruza con la lupa.
4. **Tanda 4** al final, y en este orden interno: **25 antes que 24**. Un panel
   pegajoso sin galería alta no tiene contra qué pegarse.

Cada tanda cierra con captura a 390 y 1440 antes y después. Sin captura no se
mergea.
