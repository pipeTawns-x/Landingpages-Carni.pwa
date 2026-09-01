# Lazo de arreglos del frontend — con validación en cada paso

**Para Claude Code. `~/Desktop/Carni-mvp`, rama `main`.**

Cinco arreglos. **Uno a la vez.** No avanzas al siguiente hasta que Eduardo diga que sí.

---

## El protocolo — no es opcional

Para **cada** arreglo, en este orden:

```
1 · ARREGLAS         un solo arreglo, nada más
2 · COMPILAS         npx sass css/styles.scss css/styles.css --no-source-map
3 · VERIFICAS TÚ     en el navegador, con los números del arreglo
4 · PREGUNTAS        le muestras la evidencia y le preguntas si quedó
5 · ESPERAS          no sigues sin su respuesta
6 · SI DICE NO       lo corriges y vuelves al 2. No pasas al siguiente arreglo
7 · SI DICE SÍ       commiteas ese arreglo solo, y pasas al siguiente
```

**Nunca hagas dos arreglos antes de preguntar.** Si algo se rompe, hay que saber cuál
fue, y con dos cambios juntos ya no se sabe.

**Un commit por arreglo.** Mensaje bilingüe. Si GGA falla, `--no-verify` y **dilo**.

### Cómo preguntar

No preguntes *"¿quedó bien?"*. Pregunta algo que se pueda contestar mirando:

> **Arreglo 1 · La línea del bento**
> Quité el `translateY(-6px)` de `.category-card__lift`.
> Medido: al pasar el cursor, el hijo ya no se desplaza — `transform: none`.
> El hueco de 6px bajo la tarjeta desapareció.
> **Pasa el cursor sobre una tarjeta del bento: ¿sigue apareciendo la línea abajo?**

Adjunta captura cuando el arreglo sea visual. Y si un número no te cuadra, **dilo antes
de preguntar**, no después.

---

## Arreglo 1 · La línea horrible bajo el bento

**Evidencia:** `css/pages/_bento-main.scss:304-306`

```scss
&:hover {
  .category-card__lift {
    transform: translateY(-6px);
  }
```

`.category-card__lift` es el envoltorio que hoy contiene **todo** el contenido y vive en
flujo. Al subirlo 6px, **deja al descubierto 6px del fondo de la tarjeta abajo**. Esa es
la línea.

Es un arreglo que se volvió defecto al cambiar el contexto: mover el `translateY` al
hijo resolvía P-09 **cuando el hijo era `absolute; inset: 0`** y llenaba la tarjeta.
Ahora que está en flujo, subirlo abre un hueco.

**Qué hacer:** quitar ese `translateY`. La elevación ya la dan la sombra
(`0 12px 28px rgba(0,0,0,.45)`) y el zoom de la imagen. Los 6px no aportan y causan las
dos cosas: el hueco y el riesgo de que vuelva el parpadeo.

**Criterio de aceptación:**

- Con el cursor encima, `getComputedStyle($0.querySelector('.category-card__lift')).transform`
  devuelve `none`
- No aparece ninguna franja bajo la tarjeta
- Sostienes el cursor **3 segundos sobre el borde** y no parpadea
- Pega la captura del hover

---

## Arreglo 2 · El carrito no funciona en la landing

**Evidencia:** en `index.html`, `#cartBtn` tiene solo `class`, `id` y `aria-label`.

Le quitaron `data-bs-toggle="modal"` y `data-bs-target="#cartModal"` —lo que lo abría— y
**no montaron ningún cajón en su lugar**. El modal sigue en el DOM sin nadie que lo
llame. El botón está muerto.

**Qué hacer:** devolverle la función **al modal existente**, que es lo que hay hoy.

**Este arreglo NO es la unificación del carrito.** Eso es trabajo grande, va después y
necesita leer el CodePen. Aquí solo se trata de que el botón vuelva a hacer algo, porque
ahora mismo la landing tiene un carrito muerto.

**Criterio de aceptación:**

- Clic en el carrito de `index.html` abre algo
- El contador del encabezado sigue reflejando lo que hay en `carni_cart_v1`
- Agregar desde el bento o desde el catálogo actualiza ese contador
- En `products.html` el cajón lateral sigue funcionando como antes

---

## Arreglo 3 · El carrusel no avanza

**Evidencia:** `#showcaseCarousel` tiene `data-bs-ride: null`. Bootstrap sí lo
inicializó, hay 6 diapositivas, 6 indicadores y 6 imágenes distintas. Lo que falta es el
avance automático — por eso hay que darle clic una por una.

**Qué hacer:**

- Agregar `data-bs-ride="carousel"` y un `data-bs-interval` razonable (5000 ms)
- **Pausa al pasar el cursor** — Bootstrap lo trae con `data-bs-pause="hover"`
- **Sin auto-avance** para quien tenga `prefers-reduced-motion: reduce`. Se detecta con
  `matchMedia` y se para la instancia; no basta con CSS
- Las imágenes usan `.png` (`filet_mignon.png`, `tomahawk.png`) cuando el proyecto
  convirtió todo a `.webp` en el commit `ad8ae42a`. **Cámbialas a `.webp`** y comprueba
  que los archivos existan antes

**Criterio de aceptación:**

- Avanza solo cada 5 segundos sin tocar nada
- Se detiene con el cursor encima y sigue al quitarlo
- Con `prefers-reduced-motion` activado no avanza solo
- Ninguna imagen rota, y todas `.webp`
- Los 6 indicadores llevan a su diapositiva

---

## Arreglo 4 · El contraste del bento

**Sigue sin pasar.** Y ojo con cómo se mide, porque ya nos equivocamos una vez.

**No midas contra el color del velo.** El 26 de agosto se midió `#A3A3A3` contra
`#050505` tratando el velo como plano. Dio 8.2:1 y en pantalla no se leía, porque ese
velo es un `rgba` **encima de una foto**.

**Mide sobre la composición real:** toma captura, muestrea el píxel que hay detrás del
título y detrás de la descripción en la baldosa **más clara** —Cerdo o Merch—, y calcula
desde ahí.

**Pisos:** 4.5:1 en la descripción, 3:1 en el título.

Si la descripción no llega, súbele el color: hoy está en gris apagado y necesita blanco
con opacidad, no gris sólido.

**Y revisa el degradado.** Si sigue viéndose una costura donde arranca, es porque tiene
pocas paradas. Una rampa de dos colores siempre deja borde sobre foto; hace falta una
curva:

```css
linear-gradient(to top,
  rgba(0,0,0,.92) 0%, rgba(0,0,0,.86) 18%, rgba(0,0,0,.62) 38%,
  rgba(0,0,0,.30) 58%, rgba(0,0,0,.10) 76%, rgba(0,0,0,0) 100%)
```

El ojo detecta el **cambio de pendiente**, no el color. Y que llegue a **cero puro**
arriba: un `0.05` residual también se ve como línea.

**Criterio de aceptación:**

- La tabla de contraste medida sobre píxeles compuestos, no sobre el velo
- Título ≥ 3:1 y descripción ≥ 4.5:1 en la baldosa más clara
- Captura ampliada del borde del degradado, sin costura ni escalones
- Corre `design:accessibility-review` y pega el resultado

---

## Arreglo 5 · La lupa — esto es función nueva, no un defecto

Hoy el botón manda directo a `products.html`. Eduardo quiere lo que hace cualquier
tienda: **un panel de sugerencias que se abre ahí mismo**, escribes "carne de res", y
**entonces** te lleva al producto exacto.

**Antes de escribir código, pregunta**:

- ¿El panel busca solo productos, o también categorías?
- ¿Se abre al hacer clic en la lupa, o el campo está siempre visible en escritorio?
- ¿Cuántas sugerencias como máximo?

**Lo que ya existe y hay que reutilizar, no reinventar:** `js/modules/ui/search.js` y
`js/modules/core/search.js`. Léelos antes. Si ya hay lógica de búsqueda, se conecta al
panel; no se escribe otra.

**Requisitos que no son negociables:**

- Se cierra con `Escape` y al hacer clic fuera
- Navegable con flechas y `Enter`
- `role="listbox"` en el panel, `role="option"` en cada sugerencia, `aria-expanded` en
  el botón
- El foco vuelve a la lupa al cerrar
- En móvil ocupa el ancho disponible, sin desbordar
- **Con retardo** al teclear (unos 250 ms) para no consultar en cada letra

**Criterio de aceptación:**

- Escribes tres letras y aparecen sugerencias sin salir de `index.html`
- `Escape` cierra y devuelve el foco a la lupa
- Las flechas mueven la selección y `Enter` navega
- A 375px no desborda
- Consola limpia

---

## Reglas que siguen vigentes

- Un arreglo, una pregunta, un commit. **Nunca dos juntos**
- **No inventes.** Si no lo puedes verificar, pregunta
- Verifica a **375, 768 y 1440**, no solo en escritorio
- Móvil primero: `min-width` para agregar, nunca `max-width` para quitar
- Corre `modern-web-guidance` antes de tocar CSS — su descripción dice que es obligatoria
- **No toques** nombres, enlaces ni origen de datos del bento
- **No revuelvas** el `useEffect` de `home.tsx` a `[]`
- **No pongas** envolturas con contenido en `position: absolute`
- **No unifiques el carrito aquí.** Eso necesita leer el CodePen y va en otra tanda
- `git add .` · `--force` · `sudo` · borrar ramas · reescribir historia — prohibidos
- No commitear `.env`, `.env.bak-*`, `.mcp.json` ni `settings.local.json`
- Si GGA falla, `--no-verify` y **dilo**

---

## Al terminar los cinco

Actualiza `docs/PENDIENTES.md` cerrando lo resuelto, y reporta en una tabla:

| Arreglo | Evidencia medida | ¿Eduardo lo aprobó? | Commit |
|---|---|---|---|

Y una frase final que se lea sin interpretar: **los cinco quedaron, o faltó X.**
