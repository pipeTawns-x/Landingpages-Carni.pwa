# Cerrar el frontend: landing, catálogo y carrito trifásico

**Para Claude Code. `~/Desktop/Carni-mvp`. Se trabaja y se commitea en `main`.**

Esta es una tanda larga. Al terminar, `index.html` y `products.html` quedan listos.
Léela entera antes de tocar nada.

---

## 0 · Cómo se trabaja aquí

**Móvil primero, de verdad.** La base son estilos de teléfono; las pantallas grandes
*agregan* con `min-width`. Nunca `max-width` quitando cosas. Ya se reclamó dos veces que
no se respetaba.

**No inventes. Si no lo puedes verificar, pregunta.** Palabras de Eduardo.

**Verifica en el navegador a 375, 768 y 1440** antes de decir que algo funciona. El
servidor vive en `localhost:3002`; si no responde, levántalo con `nohup npm run dev`
según la skill `servidor-vivo-carni`.

**Compila el CSS o no ves nada.** `css/styles.css` es compilado y no hay script de npm:

```bash
npx sass css/styles.scss css/styles.css --no-source-map
```

Suelta advertencias de obsolescencia por `@import` y `darken()`. **Son advertencias, no
errores.** Migrar a `@use` es otro pendiente.

**Usa las skills que hay.** `modern-web-guidance` antes de cualquier CSS —su propia
descripción dice que es obligatoria—, `design:design-critique` sobre capturas, y
`design:accessibility-review` al final.

**Para al terminar cada bloque.** Son cuatro. Eduardo quiere ver cada uno en su
localhost antes de que sigas.

---

## 1 · Trampas ya descubiertas — no las repitas

Cada una costó una sesión.

**Especificidad: empatar no basta.** Existe `.dark-premium .main-header` con peso 0,2,0.
Otra regla del mismo peso **pierde por orden del archivo**, porque `themes/dark-mode` se
importa en `styles.scss:45` y `layout/header` en la 18. Por eso el selector del
encabezado transparente lleva **dos clases en el mismo elemento**. Antes de pelear con
un estilo, pregúntale al navegador quién gana:

```js
for (const sh of document.styleSheets)
  for (const r of sh.cssRules)
    if (r.selectorText && el.matches(r.selectorText) && r.style.background)
      console.log(r.selectorText, r.style.background);
```

**`useEffect` con `[]` mató el bento.** El efecto corría al montar, con la rejilla vacía
porque las categorías venían de Supabase. Ahora depende de `[categories.length]`. **No
lo revuelvas a `[]`.**

**`--header-height` vive en `:root`.** Estaba en `.main-header` y solo la veían sus
descendientes; el héroe es su **hermano**.

**Nada de `absolute` para envolturas con contenido.** `.category-card__lift` era
`absolute; inset: 0`, no medía nada, y la tarjeta colapsaba a 2px en móvil. Ya está en
flujo. Lo que arregla el parpadeo de P-09 no es la posición absoluta: es que el
`translateY` del hover viva en el **hijo** y no en `.category-card`.

**Contraste: mide la composición, no la capa.** El 26 de agosto se midió el texto contra
el color del velo tratándolo como plano. Dio 8.2:1 y en pantalla no se leía, porque ese
velo está encima de una foto. **Muestrea el píxel real detrás del texto**, en la baldosa
más clara, desde una captura.

---

## 2 · Bloque 1 · El degradado del bento tiene costura

**El defecto, visto en captura:** hay una línea horizontal donde arranca el degradado.
Se lee como un rectángulo negro pegado sobre la foto, no como una sombra que nace de
ella. Y la descripción queda en gris apagado sobre las zonas claras de la carne.

### Qué hacer

**Mata la costura con una curva, no una rampa.** Dos paradas siempre dan banda visible
sobre foto:

```css
linear-gradient(to top,
  rgba(0,0,0,.92)   0%,
  rgba(0,0,0,.86)  18%,
  rgba(0,0,0,.62)  38%,
  rgba(0,0,0,.30)  58%,
  rgba(0,0,0,.10)  76%,
  rgba(0,0,0,0)   100%)
```

Las paradas intermedias son lo que borra el borde: el ojo detecta el **cambio de
pendiente**, no el color. Y que llegue a **cero puro** arriba — un `0.05` residual
también se ve como línea.

**Cubre toda la tarjeta**, no solo la franja baja. Un degradado que arranca a media
altura siempre tendrá un borde donde arranca.

**Sin escalonado de 8 bits.** Sobre negro, un degradado suave hace bandas. Un
`filter: blur(0.4px)` en el pseudo-elemento, o una textura de ruido muy tenue. Amplía la
captura: si ves escalones, no quedó.

**El hover:** el degradado se intensifica y la imagen hace zoom **dentro de su marco** —
`overflow: hidden` en el contenedor, `scale(1.06)` en el `<img>`. **El marco no se
mueve.** Sostén el cursor tres segundos sobre el **borde** de una tarjeta: si parpadea,
volvió P-09, y **dilo** en vez de taparlo.

**`prefers-reduced-motion: reduce`** → sin zoom ni transición. El degradado se queda:
eso es legibilidad, no decoración.

**Mide el contraste** sobre la composición real. Piso: **4.5:1** en la descripción,
**3:1** en el título. Si la descripción no llega, súbele el color — hoy está en gris y
necesita blanco con opacidad, no gris sólido.

### El logo

A 1440 está exacto: desfase de 0px, y el PNG no tiene margen transparente (1254×363, la
tinta llena el lienzo). Eduardo lo ve corrido, así que el problema está en un ancho que
no se pudo medir. **Mídelo a 375, 414, 768 y 1024:**

```js
const l = document.querySelector('.main-header__logo').getBoundingClientRect();
Math.round(l.left + l.width/2 - window.innerWidth/2)
```

Sospecha: en móvil la zona derecha lleva **tres** elementos y la izquierda **dos**. Con
`flex: 1 1 0` reparten igual, pero si el contenido de un lado no cabe en su mitad,
empuja al centro. Si da 0 en todos los anchos, **dilo también** — entonces es el arte
del logo y se resuelve recortando el asset, no con CSS.

**No toques** nombres, enlaces (`products.html?categoria=<slug>`), ni el origen de los
datos. Nueve categorías leídas de `public.categories`, verificado.

---

## 3 · Bloque 2 · La sección nueva

Va **entre el bento y "Sobre Nosotros"**. Referencia: Louis Vuitton tiene, después del
hero, una sección ancha y debajo una fila de productos.

### 3.1 · Carrusel de Bootstrap

Bootstrap 5.3.7 ya está cargado. Usa su componente, no uno propio.

**Qué muestra: pregúntale a Eduardo antes de llenarlo.** No lo llenes con lo primero que
encuentres.

Requisitos: flechas con `aria-label`, navegable con teclado, **pausa al pasar el
cursor**, y **sin auto-avance** para quien tenga `prefers-reduced-motion`. En móvil una
diapositiva a la vez y gestos de deslizar, no flechas diminutas.

### 3.2 · Cuatro tarjetas de promociones

Debajo del carrusel. **Una columna** en teléfono, **dos** desde 768px, **cuatro** desde
992px.

La tabla `promotions` existe en Supabase con lectura pública de las activas
(`202604100002_rls_policies.sql`). **Comprueba si tiene filas.** Si está vacía, dilo y
pregunta — **no inventes promociones**.

### 3.3 · El orden final de la landing

```
encabezado (transparente sobre el video)
video hero
bento de categorías
carrusel + 4 promociones      ← nuevo
sobre nosotros
horarios
contacto directo
pie
```

---

## 4 · Bloque 3 · El carrito trifásico — lo más delicado

### 4.1 · Lee el CodePen antes de escribir una línea

```
https://codepen.io/pipeTawns-x/pen/dPGYMxJ
```

**Obligatorio.** Ahí está la lógica que Eduardo ya tenía y que se perdió al pasar del
modal al cajón lateral. **No la reconstruyas de memoria ni la deduzcas del nombre.**

Si no puedes abrirlo, **para y dilo**. No inventes una versión parecida: ya pasó en este
proyecto y costó una sesión entera.

### 4.2 · Qué es el pedido trifásico, con lo que falta

Formas de pedir el mismo corte:

- **Por peso** — kilos o gramos
- **Por precio** — *"dame $150 de arrachera"*, y el sistema calcula el peso
- **Por pieza** — *"dos pollos enteros"*
- **Por grosor** — el corte se pide por el grosor del bistec, que es como se pide en el
  mostrador de verdad
- **En libras** — además de kg y g, para que le sirva igual a un cliente local y a un
  extranjero

Los dos últimos son **nuevos**: no estaban en la versión vieja. Eduardo los agregó hoy.

**Es el diferenciador del proyecto.** Según `docs/INVESTIGACION_Y_PROMPTS.md:87`, ningún
competidor revisado lo tiene.

### 4.3 · Lo que hoy sostiene cada modo, y lo que no

| Modo | ¿Hay datos? |
|---|---|
| Por peso (kg / g) | **Sí** — `price_per_kg` |
| En libras | **Sí** — `price_per_lb` ya está en la tabla |
| Por precio | Derivable de `price_per_kg`, pero **nadie decidió cómo se redondea al pesar** |
| Por pieza | **No.** Falta el peso promedio por pieza. No existe en ninguna migración |
| Por grosor | **No.** No hay ninguna columna de grosor |

**La interfaz se construye ahora. El modelo de datos se decide aparte** — es P-19 y
P-20. Si al llegar ahí falta un dato, **pregunta**: no inventes una columna ni un valor
por omisión.

Para los modos sin datos, **muestra el control desactivado con una nota honesta**, no lo
escondas. Que Eduardo vea la forma completa aunque falte la mitad de atrás.

### 4.4 · Un solo carrito, un cajón lateral

Verificado, conviven dos:

```
js/modules/core/cart.js       modal centrado. Su comentario de la línea 11 dice
                              "Modal automático al agregar productos". Es el de
                              GENERAR TICKET / VACIAR / SEGUIR COMPRANDO.
                              Lo carga index.html Y products.html.

src/components/CartPanel/     cajón lateral en React, montado SOLO en
                              src/entry/products.tsx:354
```

Por eso en la landing sale el modal y en el catálogo el cajón. **El objetivo es el cajón
lateral, y solo ese, en las dos páginas**, con la lógica trifásica adentro.

**Ya verificado, no lo repitas:** los dos comparten la misma llave de almacenamiento,
`carni_cart_v1` — `cart.js:22` y `useCart.ts:4`. No hay carrito fantasma.

### 4.5 · Inventario ANTES de borrar — no negociable

`cart.js` son **671 líneas**. Léelo entero y reporta **qué hace que el cajón no haga**.
Al menos esto vive solo ahí:

- el selector de **tipo de entrega** (recoger en tienda / domicilio)
- **generar ticket**
- **vaciar**
- el **peso editable por línea**

**Repórtalo antes de tocar nada.** Borrar sin esto pierde funciones que Eduardo usa.

### 4.6 · Cómo debe comportarse

**Con el cajón abierto se tiene que poder seguir navegando y agregando.** El caso real,
en sus palabras: *"ya pedí tres cosas y me faltaba una cuarta"* — no debe cerrar el
carrito para seguir comprando.

**Responsivo:** a 375px el cajón sigue usable y con salida visible. No una capa que tapa
la pantalla entera sin botón de cerrar.

**Y respeta los mínimos que ya existen en la base:** `products.min_quantity_kg` por
producto y `store_settings.min_order_delivery`. Están verificados llegando al navegador.
Si alguien pide menos del mínimo, el carrito lo dice **antes** de llegar al pago.

---

## 5 · Bloque 4 · Cerrar

### 5.1 · Verificación

Para cada bloque, en el navegador, a **375, 768 y 1440**:

1. Sin desborde horizontal
2. Consola sin errores nuevos
3. Nueve categorías con nombres de la base y enlaces con slug
4. El encabezado en una sola fila en todos los anchos
5. Con `prefers-reduced-motion: reduce`, nada se anima
6. El cajón del carrito abre en **las dos páginas** y deja seguir navegando
7. **Capturas.** Esto es visual: una lista de palomitas no dice si quedó bien

Corre `design:accessibility-review` al final.

Si algo falla, **dilo**. Cinco de seis honestos valen más que seis de seis inventados.

### 5.2 · Commit en `main`

Eduardo autorizó trabajar directo en `main`. Primero:

```
gh pr close 6 --comment "Se cierra por decisión de Eduardo: el trabajo continúa
directo en main. El historial de esta rama queda en los commits."
```

**No borres la rama `pruebas`.**

Después, archivo por archivo, verificado con `git diff --cached --name-only`. **Nunca
`git add .`** — hay archivos ignorados con llaves y capturas sueltas que no deben entrar.

Mensajes bilingües, uno por bloque, no uno gigante al final.

Si GGA falla, `--no-verify` y **dilo** en el mensaje y en el reporte.

### 5.3 · Lo que NO se commitea

Los plugins se instalan globales en `~/.claude/`, fuera del repo. `.mcp.json` y
`.claude/settings.local.json` están ignorados (`.gitignore:30` y `:31`) porque pueden
llevar credenciales.

### 5.4 · `docs/PENDIENTES.md`

Cierra lo resuelto: bento invisible, bento de 2px, desfase del encabezado, clima
empalmado, y lo que cierres del carrito.

Y agrega, con evidencia:

> Todo el stack agéntico vive fuera del repo y sin versionar: los plugins en
> `~/.claude/`, las 63 skills del registro, `.mcp.json` y `settings.local.json`, los dos
> ignorados. Si el disco falla o Eduardo cambia de máquina, se pierde entero. Es el
> mismo hallazgo de las 19 descripciones de skills, ahora más grande.

Propón dónde debe vivir: lo de Carni-mvp al repo, lo general y lo que lleva llaves a un
repo de dotfiles aparte con los secretos fuera. **Averigua si ya existe uno. Si no,
propón crearlo — no lo crees por tu cuenta.**

### 5.5 · Deja constancia en el reporte

- **Esto no despliega nada.** Pages publica desde `practicas-ebac` y sirve la raíz del
  repo sin construir. **P-04.**
- **El CI sale rojo y no es por esto.** Lleva fallando desde el 19 de agosto porque
  `package.json` y `package-lock.json` están fuera de sincronía. **P-25.**
- **El video pesa 14 MB** sin comprimir, y `vite.config.js:38` sigue con
  `publicDir: 'img'`, así que en el build la ruta `img/Videos/` no existirá. **P-06.**

---

## 6 · Prohibido

- Reconstruir la lógica trifásica sin haber leído el CodePen
- Borrar de `cart.js` sin el inventario del §4.5
- Inventar columnas o valores por omisión para los modos sin datos
- Volver el `useEffect` de `home.tsx` a `[]`
- Poner envolturas con contenido en `position: absolute`
- Medir contraste contra el color del velo en vez de los píxeles compuestos
- Cambiar nombres, enlaces u origen de datos del bento
- Tocar `supabase/`, la base o cualquier migración
- Escribir una línea de BuildAds o ProductAds — congelados
- Instalar librerías de animación: se hace con CSS e IntersectionObserver
- `git add .` · `--force` · `sudo` · borrar ramas · reescribir historia
- Commitear `.env`, `.env.bak-*`, `.mcp.json` o `settings.local.json`
- Decir que algo funciona sin haberlo abierto en el navegador

Si GGA se salta o falla, **dilo en el reporte**. No lo escondas.
