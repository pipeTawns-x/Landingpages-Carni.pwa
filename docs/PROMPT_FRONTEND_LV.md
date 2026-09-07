# Frontend estilo Louis Vuitton + carrito trifásico

**Para Claude Code. `~/Desktop/Carni-mvp`, rama `pruebas`.**

Continúa un trabajo que ya arrancó. Lee todo antes de tocar nada: hay cuatro trampas
documentadas aquí que ya costaron tiempo, y si las repites vas a perder el mismo día
otra vez.

---

## 1 · Qué se está construyendo y para quién

Eduardo le va a **proponer esta web a su hermana**, dueña de *Carnicería El Señor de
La Misericordia* en San Luis Potosí. Todavía no hay trato. Por eso no puede ir a
grabar al local ni pedirle fotos: **todo el contenido visual es generado o de prueba**,
igual que el catálogo. La web es la propuesta.

La referencia visual es **Louis Vuitton** (`la.louisvuitton.com/esp-mx/homepage`): video
a pantalla completa detrás de un encabezado transparente, secciones amplias, tipografía
que respira.

**El orden acordado, y no se altera:**

```
1 · Encabezado          ← en curso, casi listo
2 · Bento sin velo oscuro
3 · Sección nueva: carrusel + 4 tarjetas de promociones
4 · Carrito trifásico en un solo cajón lateral
```

---

## 2 · Reglas que gobiernan todo

**Móvil primero, de verdad.** La base son estilos de teléfono y las pantallas grandes
*agregan* con `min-width`. No `max-width` quitando cosas. Es la diferencia entre decir
que es mobile first y serlo, y Eduardo ya reclamó que no se respetaba.

**No inventes. Si no lo puedes verificar, pregunta.** Palabras suyas.

**Verifica en el navegador antes de decir que algo funciona.** El servidor vive en
`localhost:3002`; si no responde, levántalo con `nohup npm run dev` según la skill
`servidor-vivo-carni`.

**No commitees sin avisar.** Hay doce archivos modificados sin versionar y ese es hoy
el riesgo más grande del repo.

---

## 3 · Cómo compilar el CSS — sin esto no ves nada

`css/styles.css` es un archivo **compilado**. Editar el `.scss` no cambia lo que el
navegador lee. No hay script de npm para esto y `sass` no está en `node_modules`:

```bash
cd ~/Desktop/Carni-mvp
npx sass css/styles.scss css/styles.css --no-source-map
```

Suelta un montón de advertencias de obsolescencia por `@import` y por `darken()`. **Son
advertencias, no errores.** Migrar a `@use` es un pendiente aparte; no lo hagas aquí.

---

## 4 · Las cuatro trampas ya descubiertas

Cada una costó una sesión. Están aquí para que no las repitas.

### 4.1 · `.dark-premium .main-header` gana por especificidad

Existe `.dark-premium .main-header { background: rgba(17,17,17,.98) }`, con
especificidad **0,2,0**. Cualquier clase suelta que intente ponerlo transparente
**pierde**. Por eso el selector del encabezado transparente lleva `.dark-premium`
delante: se empata el peso y se gana por orden.

Antes de pelear con un estilo, pregúntale al navegador quién gana:

```js
for (const sh of document.styleSheets) {
  for (const r of sh.cssRules) {
    if (r.selectorText && el.matches(r.selectorText) && r.style.background) {
      console.log(r.selectorText, r.style.background);
    }
  }
}
```

### 4.2 · El bento se volvió invisible por una dependencia de `useEffect`

`src/entry/home.tsx` tenía `}, []);` con el comentario *"FIX P-09: evita que el observer
se recree"*. Ese arreglo del parpadeo **mató el revelado**: el efecto corría una sola
vez al montar, cuando la rejilla estaba vacía porque las categorías venían de Supabase.
El observer no vigilaba nada y las nueve tarjetas se quedaban en `opacity: 0`.

**Ya está arreglado** — depende de `[categories.length]` y sale temprano si la rejilla
está vacía. **No lo revuelvas a `[]`.**

### 4.3 · `--header-height` tiene que vivir en `:root`

Estaba dentro de `.main-header`, así que solo la veían sus descendientes. El héroe es su
**hermano** y necesita ese número para subirse por debajo. Ya se movió a `:root`, con
tres valores por punto de quiebre: 56 / 64 / 72 px.

Y ojo: una regla imponía `min-height: 84px` al contenedor, así que el encabezado medía
88 reales mientras el héroe subía 72 — quedaba una banda vacía de 16px sobre el video.
Ahora la altura la manda `--header-height` **y nada más**.

### 4.4 · El video se va a romper al publicar

`vite.config.js:38` sigue con `publicDir: 'img'`. Eso copia el contenido de `img/` a la
**raíz** de `dist/`, así que `img/Videos/VideoCarniwebP01.mp4` **no existirá en esa ruta
en producción**. Funciona en localhost y muere en el sitio publicado.

Es el pendiente **P-06**. No lo arregles en esta tanda —toca el build y merece su propia
verificación— pero **no lo olvides** y no digas que el video quedó listo mientras siga así.

**Además pesa 14 MB.** Un hero de 14 MB en datos móviles es una grosería con un cliente
que pide carne desde el teléfono. El objetivo son 4 MB o menos. Pendiente aparte.

---

## 5 · Estado actual, verificado

### Hecho y sin compilar todavía

**Encabezado en tres zonas**, en `index.html` y en `products.html`:

```
izquierda   hamburguesa · lupa      (flex: 1 1 0)
centro      el logo                 (flex: 0 0 auto)
derecha     carrito · usuario · clima  (flex: 1 1 0, justify-end)
```

Los costados reparten el sobrante en partes iguales — antes medían 317 contra 155 y el
logo caía 73px corrido a la derecha.

**Móvil primero:** 56px de alto, logo 34px, buscador solo con la lupa. A 768px sube a
64/42. A 992px aparece la etiqueta del buscador y llega a 72/48.

**Encabezado transparente sobre el video**, con dos defensas para que el texto no se
pierda: un degradado sutil de arriba hacia abajo que oscurece solo la franja de los
iconos, y **fondo negro sólido al pasar el cursor** (`:hover` y `:focus-within`, para
que quien navegue con teclado tenga el mismo contraste). `prefers-reduced-motion`
desactiva la transición.

En `products.html` el encabezado es **idéntico en estructura pero con fondo sólido**: no
hay video detrás. Y ahí se descubrió que esa página **nunca cargaba `weather.js`** —
habría mostrado `--°C` para siempre. Ya lo carga.

**Clima:** solo icono y temperatura. Se retiraron la descripción y la humedad porque en
móvil rompían la fila. Y se corrigió `weather.js:40`, que reescribía la clase del icono
con `fs-3 me-2`: en cuanto respondía la API el icono **saltaba a 1.75rem** y desalineaba
todo. No era el CSS, era el JavaScript pisándolo.

### Pendiente inmediato

Compilar el SCSS y **verificar en el navegador a 375, 768 y 1280**.

---

## 6 · Paso 2 · El bento sin velo oscuro

**El problema:** hoy las tarjetas llevan un velo oscuro encima de la foto para que el
texto se lea. Eduardo dice que apaga el bento y tiene razón: la foto de la carne es el
producto, y taparla para poder escribir encima es resolver el problema por el lado caro.

**La solución es la misma técnica del encabezado**, y él lo pidió así explícitamente:

- **Quitar el velo general.** La foto se ve completa.
- **Un degradado localizado**, solo en la franja baja donde vive el texto. De
  transparente arriba a oscuro abajo. No se percibe como una capa: se percibe como
  profundidad.
- **Al pasar el cursor**, el velo se intensifica y la imagen hace un zoom suave *dentro
  de su marco* — `overflow: hidden` en el contenedor, `scale` en el `<img>`. **El marco
  no se mueve.**

**Advertencia que ya nos mordió una vez.** El 26 de agosto se midió el contraste del
texto **contra el color del velo**, tratándolo como si fuera plano. No lo es: es un
`rgba` sobre una foto. Donde el velo baja de opacidad y debajo hay carne clara, el
compuesto queda en tono medio y el texto se disuelve. Salió 8.2:1 sobre el papel y en
pantalla no se leía.

**Mide sobre la composición real**, no sobre la capa intermedia: toma una captura,
muestrea el píxel detrás del texto en la baldosa **más clara** —Cerdo o Merch— y calcula
desde ahí. El piso es 4.5:1.

**No toques:** los nombres, los enlaces (`products.html?categoria=<slug>`), ni de dónde
vienen los datos. Eso está verificado y correcto: nueve categorías leídas de
`public.categories`.

**Tampoco toques `.category-card { opacity: 0 }` ni la clase `is-visible`.** Es el
revelado escalonado y ya funciona.

---

## 7 · Paso 3 · La sección nueva

Louis Vuitton tiene, después del hero, una sección ancha con una imagen y debajo una
fila de productos. **Aquí va lo mismo pero con contenido nuestro**, y va **entre el
bento y "Sobre Nosotros"**:

### 7.1 · Un carrusel de Bootstrap

Responsivo y estético. Bootstrap 5.3.7 ya está cargado, así que usa su componente, no
uno propio.

Qué muestra: **lo decide Eduardo.** Pregúntale antes de llenarlo — pueden ser cortes
destacados, o fotos del local, o las promociones. No lo llenes con lo primero que
encuentres.

Requisitos: controles accesibles con teclado, `aria-label` en las flechas, **pausa al
pasar el cursor**, y que respete `prefers-reduced-motion` (sin auto-avance para quien lo
tenga activado). En móvil una sola diapositiva a la vez, sin flechas diminutas: gestos
de deslizar.

### 7.2 · Cuatro tarjetas de promociones

Debajo del carrusel. Cuatro, en rejilla.

Móvil primero: **una columna** en teléfono, **dos** desde 768px, **cuatro** desde 992px.

Los datos: la tabla `promotions` ya existe en Supabase con RLS que permite lectura
pública de las activas (`202604100002_rls_policies.sql`). **Verifica si tiene filas**
antes de decidir. Si está vacía, dilo y pregunta: no inventes promociones.

### 7.3 · El orden final de la landing

```
encabezado (transparente, sobre el video)
video hero
bento de categorías
carrusel + 4 promociones      ← nuevo
sobre nosotros
horarios
contacto directo
pie
```

---

## 8 · Paso 4 · El carrito trifásico — lo más delicado

### 8.1 · Antes de escribir una línea, lee el CodePen

```
https://codepen.io/pipeTawns-x/pen/dPGYMxJ
```

**Es obligatorio.** Ahí está la lógica que Eduardo ya tenía y que se perdió en alguna
refactorización. No la reconstruyas de memoria ni la deduzcas del nombre.

Si no puedes abrirlo, **para y dilo**. No inventes una versión "parecida": ya pasó en
este proyecto y costó una sesión.

### 8.2 · Qué es el pedido trifásico

Tres formas de pedir el mismo producto:

- **Por peso** — kilos o gramos. *"Dame kilo y medio de arrachera."*
- **Por precio** — *"Dame $150 de arrachera"*, y el sistema calcula el peso.
- **Por pieza** — *"Dame dos pollos enteros."*

Es el **diferenciador del proyecto**: según `docs/INVESTIGACION_Y_PROMPTS.md:87`, ningún
competidor revisado lo tiene. No es un detalle de interfaz, es la razón de ser.

**Estado real, y esto importa:** el modo por peso funciona porque existe `price_per_kg`.
Los otros dos **no tienen de dónde salir**. El de pieza necesita un peso promedio por
pieza y esa columna **no existe en ninguna migración**. Está registrado como **P-19** y
**P-20**.

Así que: **la interfaz se construye ahora, el modelo de datos se decide aparte.** Si al
llegar ahí falta un dato, **pregunta** — no inventes una columna ni un valor por
omisión.

### 8.3 · Un solo carrito, un cajón lateral

Hoy conviven dos implementaciones y esto está verificado:

```
js/modules/core/cart.js       modal centrado. Su comentario de la línea 11 dice
                              "Modal automático al agregar productos".
                              Es el de GENERAR TICKET / VACIAR / SEGUIR COMPRANDO.
                              Lo carga index.html Y products.html.

src/components/CartPanel/     cajón lateral en React. Montado SOLO en
                              src/entry/products.tsx.
```

Por eso en la landing sale el modal y en el catálogo el cajón. **El objetivo es el cajón
lateral, y solo ese, en las dos páginas**, con la lógica trifásica adentro.

### 8.4 · Inventario ANTES de borrar — no negociable

`cart.js` son **671 líneas**. Léelo entero y dime qué hace que el cajón **no** haga.
Al menos esto vive solo ahí:

- el selector de **tipo de entrega** (recoger en tienda / domicilio)
- **generar ticket**
- **vaciar**
- el **peso editable por línea**

Repórtalo antes de tocar nada. Borrar sin esto pierde funciones que Eduardo sí usa.

**Ya verificado y no hace falta repetirlo:** los dos carritos comparten la misma llave de
almacenamiento, `carni_cart_v1` — `cart.js:22` y `useCart.ts:4`. No hay carrito fantasma.

### 8.5 · Cómo debe comportarse

Eduardo fue muy claro: **con el cajón abierto se tiene que poder seguir navegando y
agregando.** El caso real es *"ya pedí tres cosas y me faltaba una cuarta"* — no debe
tener que cerrar el carrito para seguir comprando.

Y **responsivo**: a 375px de ancho el cajón sigue usable y con salida visible. No una
capa que tapa la pantalla entera sin botón de cerrar.

---

## 9 · Verificación — antes de decir que algo quedó

Para cada paso, en el navegador de verdad, a **375, 768 y 1280**:

1. Sin desbordes horizontales
2. Consola sin errores nuevos
3. El bento sigue con sus nueve categorías, nombres de la base y enlaces con slug
4. El encabezado no se parte en dos filas en ningún ancho
5. Con `prefers-reduced-motion: reduce`, nada se anima
6. **Captura de pantalla.** Esto es visual: una lista de palomitas no dice si quedó bien

Si algo falla, **dilo**. Cinco de seis honestos valen más que seis de seis inventados.

---

## 10 · Prohibido

- Tocar `supabase/`, la base de datos, o cualquier migración
- Escribir una línea de BuildAds o ProductAds — están congelados
- Reconstruir la lógica trifásica sin haber leído el CodePen
- Borrar de `cart.js` sin el inventario del punto 8.4
- Volver la dependencia de `useEffect` a `[]` en `home.tsx`
- Cambiar nombres, enlaces u origen de datos del bento
- Instalar librerías de animación: se hace con CSS e IntersectionObserver
- Medir contraste contra el color del velo en vez de contra los píxeles compuestos
- Decir que algo funciona sin haberlo abierto en el navegador
- Mergear · tocar `main` · `--force` · `sudo`

Si GGA se salta o falla, **dilo en el reporte**. No lo escondas.

---

## 11 · Al terminar cada paso

Para, reporta con evidencia, y espera visto bueno antes del siguiente. Son cuatro pasos
y Eduardo quiere ver cada uno en su localhost antes de que sigas.
