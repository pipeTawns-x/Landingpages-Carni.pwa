# 05 · Abogado del diablo: rediseño del MVP y plan agéntico (R2)

Fecha: 2026-09-29. Rol: abogado del diablo hostil (skill `abogado-del-diablo`), con la vara de "moderno, no Canva" de `design-taste-frontend` e `impeccable`.
Alcance: las 15 decisiones y las unidades U-A a U-G de `ESTADO.md`, el export `Diseño1.1.zip` (vía `investigacion/01`), el código de la rama `pruebas` y el plan de ejecución con agentes.
Modo: solo lectura. Lo único escrito es este archivo. No se ejecutó npm, no se tocó git.

Mediciones propias de esta fase (además de los informes 01 a 04):
- Consultas `SELECT` a la base local `supabase_db_Carni-mvp` (catálogo, políticas de `orders`, restricciones, usuarios).
- `dig` sobre los dos dominios de correo del sitio.
- `rg` sobre `src/`, `js/`, `netlify.toml`, `landing.html` y las definiciones de agentes en `.claude/agents/` y `~/.claude/agents/`.
- `ffprobe` sobre los dos videos de portada.
- Lectura de las capturas `capturas-1.1/02-landing-movil-secciones.jpg` y `10-acceso-ingresar-mascota.jpg`.

---

## 1. Veredicto

1. El plan no muere por el diseño: muere por amplitud. Siete unidades, cinco superficies y dos capas de estilos, con un presupuesto que ya gastó 46 puntos de la ventana de 5 h solo en investigar.
2. Tres premisas del plan son falsas y se pueden medir hoy: el efecto viejo del encabezado no era vidrio, los 405 KB son de otro video y el correo del sitio apunta a un dominio sin DNS.
3. El export 1.1 todavía se lee como plantilla: todo va en tarjeta con borde, hay 8 kickers en mayúsculas, el horario y la calificación salen tres veces cada uno, y al menos 44 de 53 productos usan la foto de otro.
4. El plan agéntico supone paralelismo sobre un solo árbol de trabajo, agentes que no se descubren desde `pruebas` (`carni-qa`, `design-handoff`) y jueces que su frontmatter fija en Sonnet.
5. Se salva si la primera entrega es un solo recorrido coherente (landing, superposiciones, asistente, catálogo y carcasa del panel) con 4 escritores en secuencia, compuertas medidas y una sola revisión dual al final.

## 2. La falla que lo mata

Eduardo abre `http://localhost:3002/landing.html` y ve dos ediciones cosidas:
- una landing nueva cuyo botón "Ver productos" lo lleva al `products.html` viejo;
- un carrito montado con styled-components y su `GlobalStyles` (`src/components/CartPanel/montar.tsx:3,7`) encima de Tailwind;
- una ficha de 581 líneas sin tocar;
- un panel que no puede abrir porque la base local tiene 0 usuarios.

Todo eso llega después de quemar la semana en siete unidades en paralelo que se pisaron en `Encabezado.tsx`. La amplitud sin costuras cerradas es lo que lo mata. La profundidad en un solo recorrido es lo que lo salva.

### Premisas falsas (verificadas)

| # | Premisa del plan | Realidad | Evidencia |
|---|---|---|---|
| P1 | "Volver el efecto del Encabezado" = vidrio con `backdrop-blur` (D3) | El efecto viejo no desenfoca. Es transparente con velo, `rgba(0,0,0,.92)` en `:hover` y `:focus-within`, y sólido al bajar. El `backdrop-filter: none` es deliberado, porque en `sticky` re-muestrea y parpadea. | `css/layout/_header.scss:7-26`, `:65-98` (citado en `02-sitio-actual.md` §3) |
| P2 | El video del hero pesa 405 KB en 640×360 (D11) | Los 405 KB se midieron sobre `public/img/Videos/VideoCarniwebP01.mp4` (15,04 s). El video del diseño es `docs/design/assets/video/portada-carne.mp4` (10,0 s, 1,7 MB) y nadie lo ha recodificado. | `04-referencias` §1 y §3.2; `ffprobe` de ambos archivos |
| P3 | "Se usa el correo del sitio actual" (D15) | `carniceriasenmisericordia.com` (el de `src/landing/datos.ts:314`) y `carniceriamisericordia.com` (el de `chatbot.js`) no devuelven NS, MX ni A. El mismo `dig` sí resuelve el MX de gmail.com. Un correo a ese dominio rebota. | `dig +short MX/NS/A`, 2026-09-29 |
| P4 | "Las unidades con archivos distintos pueden ir en paralelo" | Los disparadores del menú y del carrito (U-D) viven en `Encabezado.tsx` (U-B). El asistente (U-F) se monta en `Landing.tsx` (U-C). Todas dependen de la Hoja y de los tokens de U-A. Además comparten un solo índice de git. | `ESTADO.md:103`; `02-sitio-actual.md` §2 (`Encabezado.tsx:54-66`) |
| P5 | Con `.env` apuntando a `localhost:54321`, Brave verifica todo (D10) | Sirve para el catálogo. El panel y el acceso no se pueden probar: `auth.users` = 0 y `profiles` con rol admin = 0 en la base local. | `SELECT count(*) FROM auth.users` |
| P6 | `carni-qa` y `design-handoff` están disponibles como agentes | Solo existen en `~/Desktop/Carni-mvp/.claude/agents/` (rama `practicas-ebac`). No están en `Carni-mvp-pruebas/.claude/agents/` ni en el worktree de la sesión, ni en `~/.claude/agents/`. | `eza .claude/agents` en los tres árboles |
| P7 | Los jueces corren en Opus (política de Eduardo) | `jd-judge-a.md:7` y `jd-judge-b.md:7` fijan `model: sonnet`. Los `impeccable-*` usan `model: inherit`. `guardian-de-datos` fija `opus` y no tiene `Bash`. | frontmatter en `~/.claude/agents/` y `.claude/agents/guardian-de-datos.md:4-5` |
| P8 | Las reseñas son "de ejemplo" (etiqueta del diseño) | Son reales, leídas del perfil de Google el 2026-09-03, con enlace al perfil. Lo falso es la etiqueta "EJEMPLO · FALTA BACKEND" del diseño. | `src/data/resenas.ts:9-25` |

---

## 3. Ataque por ángulo

### 3.1 Lo que sigue leyéndose a Canva o a plantilla, y el arreglo concreto

Evidencia principal: `capturas-1.1/02-landing-movil-secciones.jpg`.

1. **Todo es tarjeta.** Ubicación, Horarios, Teléfono, WhatsApp, Correo, las cifras de "Carnicería de familia" y el cuadro de calificación van en la misma caja con borde, radio de 16 y `surface-1`. Tres tarjetas idénticas apiladas (Teléfono, WhatsApp, Correo), cada una con su botón de píldora a todo el ancho, es el patrón de plantilla más reconocible de la página.
   - Regla que lo prohíbe: `design-taste-frontend` SKILL.md:214 ("cards ONLY when elevation communicates real hierarchy").
   - **Arreglo:** la caja con borde queda reservada a la Tarjeta de producto. La información pasa a filas separadas por hairline (`divide-y divide-border`) sobre el fondo. Cada fila completa es el objetivo táctil, con un chevron. Hay un solo botón rojo por pantalla.
2. **Kickers en mayúsculas sobre cada título.** Hay 8 en la landing y 173 usos de `uppercase` en el diseño (`01` §7.3).
   - **Arreglo:** como máximo dos en toda la landing, ninguno en la portada. El titular Fraunces ya carga la jerarquía.
3. **Datos repetidos como relleno.** El horario sale en la franja de datos, en la cifra "8:00–17:00" de Familia y en "Horarios y puntaje". El 4.7 sale en Familia, en Horarios y en Comentarios. "53 productos en el mostrador" es relleno.
   - **Arreglo:** cada dato vive una vez en su sección. Se quitan las tres cifras de Familia (el patrón "hero metric"). El 4.7 queda en Horarios y puntaje y en Comentarios, porque `resenas.ts:17-25` exige mostrar el promedio real junto a la selección.
4. **La misma foto en fila.** La base local tiene 53 productos y 18 `image_url` distintas:
   - `pollo.webp` ×8, `cerdo.webp` ×7, `res.webp` ×6, `preparadas.webp` ×6, `embutidos.webp` ×5, `merch.webp` ×5, `otrosproductos.webp` ×3, `frutasverduras.webp` ×2 (de una categoría que no existe) y `premium.webp` ×2;
   - en Ofertas, Asador y Parrillada muestran el mismo trozo de carne cruda.
   - **Arreglo:** la Tarjeta sigue siendo el mismo componente, con una variante `ilustrativa`. Si la foto es de categoría, lleva el rótulo "Foto ilustrativa". En una rejilla donde la misma foto se repetiría más de dos veces, la variante es tipográfica: nombre en Fraunces, ícono Lucide de la categoría y precio, sin foto. Así se lee editorial y honesto, no como banco de imágenes.
5. **Píldora para todo** (radio 999 en 597 usos).
   - **Arreglo:** la píldora queda para los botones. Chips, campos y filas van a 12 px. Es el "shape consistency lock" de `design-taste-frontend` SKILL.md:217.
6. **Raya roja de 3 px** en el ítem activo (AdminNav, menú lateral, Mi cuenta). Es la raya lateral que `impeccable` veta.
   - **Arreglo:** tinte de fondo `red/12` más peso 600.
7. **Tarjetas KPI con minigráfico decorativo** (`01` §3.6).
   - **Arreglo:** con `orders` = 0 no hay nada que graficar. En v1, estados vacíos honestos y sin minigráficos.
8. **Ruido de diseño como texto de interfaz:** "falta backend", "EJEMPLO · EN PRODUCCIÓN…", "ejemplo · confirmar con el dueño", "Confirmar con el dueño" dentro de las tarjetas de paquete (captura 02, columna 3).
   - **Arreglo:** compuerta con `rg` que exige 0 coincidencias en `src/` y en el DOM renderizado antes de abrir Brave.
9. **Riesgo de fondo, no se anula:** Fraunces + Geist + casi negro + un rojo es el perfil por defecto de Claude Design. `design-taste-frontend` SKILL.md:180 veta Fraunces como elección por defecto. No lo anulo, porque Eduardo aprobó el sistema en los bucles y cambiarlo cuesta una ronda de diseño. Lo que lo rescata es la disciplina, no la fuente:
   - 6 tamaños en vez de 18 (`01` §4);
   - el eje `opsz` de Fraunces en los titulares;
   - sin pesos fraccionarios sueltos;
   - fotografía real como protagonista.
10. **Panel rojo con mascota de caricatura** en el acceso (captura 10). Es lo más cercano a un banner de plantilla (`01` §7.1). Es elección de Eduardo (D6) y se respeta. Queda fuera de la primera entrega (sección 6), así que hoy no cuesta nada.

### 3.2 Realismo móvil

- **El vidrio sobre video es el efecto equivocado en el dispositivo equivocado.**
  - Cada fotograma del video obliga a volver a desenfocar la franja del encabezado. En Android de gama baja eso es trabajo de GPU continuo. `04` §2.5 lo marca [NO PROBADO] y `docs/design/referencias/direcciones.md` ya había descartado el "glassmorphism pesado".
  - En el modo de bajo consumo de iOS el autoplay puede bloquearse ([NO PROBADO], `04` §10.2): el vidrio quedaría encima de un póster fijo.
  - En móvil no hay hover. Con un hero de 219 px, el vidrio "al primer scroll" dura unos 160 px de recorrido y nadie lo percibe como efecto.
  - **Arreglo:** el efecto viejo, literal (sección 5, D3).
- **El hero 16:9 es más chico de lo que parece.**
  - A 360 px (Android común) mide 202 px. El encabezado `fixed` de 56 px tapa la franja superior, y quedan unos 146 px para titular y botón.
  - Un titular de 56 px en tres líneas (el del diseño) no cabe. Titular a 28–32 px en dos líneas como máximo, sin kicker, y el párrafo fuera de la caja, como ya propone `04` §3.1.
  - Hay que medirlo a 360, 390 y 414.
- **El titular que aparece palabra por palabra** (50 ms por palabra, `01` §3.1) es el elemento LCP. Animar su opacidad desde 0 retrasa el LCP.
  - **Arreglo:** el titular se pinta a opacidad 1. Solo el botón o el kicker entran con movimiento.
- **Video en 4G.** `preload="none"` + póster + archivo chico es correcto, pero el archivo chico todavía no existe para el video del diseño (P2).
  - Recodificar `portada-carne.mp4` a 640×360, CRF 30, sin audio, con `+faststart`, y medir.
  - Usar `portada-carne-poster.webp` (33 KB), que ya existe.
- **Fuentes.** Fraunces variable con todos sus ejes pesa varias veces lo que pesa Geist.
  - Autoalojar solo el subconjunto latino y los ejes `wght` y `opsz`.
  - Medir los bytes totales en woff2 (meta de 150 KB o menos).
  - `landing.html` hoy las pide a Google Fonts, y `design-taste-frontend` SKILL.md:133 lo prohíbe en producción.
- **Google Maps incrustado** en Contacto: el iframe descarga cientos de KB de JavaScript de terceros en móvil.
  - **Arreglo:** fachada. Imagen estática o bloque de dirección con "Cómo llegar", y el iframe solo al tocar.
- **Táctil sin hover.** El `hover:` de Tailwind v4 ya se limita a `(hover: hover)`, así que la elevación de la Tarjeta (`src/ui/Tarjeta.tsx:105`) no se pega en el teléfono. El hallazgo #718 queda resuelto por el framework.
  - A Eduardo hay que decírselo en la entrega: en el teléfono el efecto del encabezado lo dispara el scroll o el foco, porque no hay cursor.
- **Áreas seguras.** `landing.html:5` no declara `viewport-fit=cover`, así que el `env(safe-area-inset-top)` de la receta vale 0. No rompe nada en Safari, pero en la PWA instalada el encabezado puede quedar bajo la barra de estado. Hay que decidirlo y medirlo.

### 3.3 Accesibilidad, "X en todo" y trampa de foco

- **`<dialog>` con `showModal()` es la decisión correcta** (D5, `04` §8): Escape, fondo inerte, foco de vuelta y capa superior.
- **La Lupa no es `<dialog>`.** Es un `div role="dialog"` (`Lupa.tsx:405`). Si algo la abre desde dentro de un `<dialog>` modal (por ejemplo, un buscador dentro del menú hamburguesa), se pinta debajo de la capa superior y queda inerte e inalcanzable.
  - **Regla:** nunca abrir la Lupa desde dentro de un diálogo nativo. Si hace falta, se cierra el diálogo primero.
- **Anillo de foco rojo sobre botón rojo.** El foco es `outline 2px` rojo (`04` §2.4), y el CTA principal es rojo: sobre él el anillo no se ve.
  - **Arreglo:** anillo arena `#E4D1B0` (13,16:1 sobre el fondo) con `ring-offset-2 ring-offset-bg` en todo el sitio.
- **Contrastes que no pasan** (`01` §4):
  - enlaces rojos como texto: 4,07:1 (3,78:1 sobre `surface-1`), por debajo de 4,5:1;
  - borde de campo `#3F3F46`: 1,88:1, por debajo del 3:1 que exige WCAG 1.4.11.
  - **Arreglo:** los enlaces van en texto con subrayado, o en arena. Los campos llevan un borde de 3:1 o más (medir el tono).
- **Objetivos táctiles:** los puntos del carrusel miden 28 px y "Quitar reciente" 40 px (`01` §5).
  - **Arreglo:** zona táctil de 44 px, o puntos decorativos con el contador "Corte 3 de 8" y las flechas como controles.
- **Confirmaciones del panel sin X** (`capturas-1.1/12-admin-confirmaciones-sin-x.jpg`). La regla de Eduardo es literal ("ninguna ventana… sin su X"), así que llevan X además de "Cancelar".
- **Movimiento reducido:**
  - titular sin animación;
  - carrusel con `behavior: 'auto'`;
  - reseñas quietas, con el botón "Detener el giro" siempre visible (WCAG 2.2.2);
  - hojas a 150 ms o menos, sin desplazamiento;
  - video solo con póster.
- **Lanzador del asistente contra el botón "+" de la Tarjeta.** En la rejilla de 2 columnas el "+" de 44 px está en la esquina inferior derecha de la tarjeta derecha, justo donde se fija el lanzador de 64 px.
  - **Arreglo:** en las páginas de rejilla el lanzador baja a 48 px y se oculta mientras se hace scroll hacia abajo, o no se muestra.
  - Medirlo con intersección de rectángulos a 360 y 390.
- **Idioma:** `landing.html:2` dice `lang="es"`. Usar `es-MX` para la lectura de cifras y horas.

### 3.4 Verdad de los datos

- **Existencias falsas.** `datos.ts:121` y `:257` escriben "20 en stock" a mano. En la base, `stock` va de 8 a 150 y es semilla, no inventario: nadie lo actualiza y `orders` tiene 0 filas.
  - Mostrar cifras de existencia al cliente es afirmar algo que no se sabe. "Pocas piezas" nunca aparecería (mínimo 8).
  - **Regla:** en la interfaz del cliente no se muestran números de existencia. Solo "Agotado" cuando `is_active` sea falso o `stock` sea 0.
- **Precios.** Los precios de la base coinciden con el diseño (Filete Mignon $689, Rib Eye $549, Tomahawk $649, New York $529, Porterhouse $579, Arrachera $449, Flank $399, Top Sirloin $389).
  - Vienen del Catálogo 2024 del dueño (memoria `redes-y-catalogo`), así que pueden estar viejos.
  - **Regla:** precio solo desde la base (con la semilla como respaldo) y un aviso único junto a los precios ("Precios de referencia; el peso final puede variar"), no uno por tarjeta.
  - `precio_por_lb` sale de la columna `price_per_lb`, no de multiplicar por 0,4536 en el cliente, para tener una sola fuente.
- **Fotos.** Al menos 44 de 53 productos comparten foto (3.1.4). Además, `rib-eye.webp` es en realidad un T-bone (`01` §8.6), y el carrusel lo rotularía "Rib Eye".
  - **Arreglo:** el carrusel va con 7 cortes (sin Rib Eye) hasta que haya foto propia.
  - **Prohibido** generar fotos de producto con `imagen-gratis` o mflux: una foto generada de un corte que se vende es una representación falsa. La IA sirve para texturas o ilustración editorial, nunca para mostrar un producto.
- **Nombre prohibido que viene de la base.** "Paquete Carnitas por Kilo" existe como producto en la base local ($389, `cerdo.webp`). Con datos vivos aparece en Ofertas aunque se borre de `datos.ts:242`.
  - Enmascararlo en el frontend es esconder la deriva de datos.
  - **Arreglo:** va en el traspaso al chat de backend como corrección de datos. Mientras tanto se muestra tal cual y queda anotado en la entrega.
- **El carrusel depende de la base.** Si gana la semilla (33 productos, `shared.tsx:28` con un tope de 2 s), los cortes que no están en ella desaparecen.
  - **Arreglo:** el respaldo del carrusel se escribe con los mismos 7 u 8 cortes y precios de la base, y la insignia de origen de datos lo delata (sección 3.7).
- **El asistente nunca inventa.**
  - El guion de `04` §5.3 es correcto, pero el chip "¿Cuánto por persona?" necesita gramos que nadie aprobó (`04` §10.2).
  - **Arreglo:** esa intención responde solo con datos que existen: los nombres de los paquetes en la base ("4 a 6 personas", "8 a 10 personas") y el enlace a Ofertas. Sin gramos.
  - Compuerta: el guion no contiene dígitos salvo el horario (regex en la revisión).
- **Reseñas.** Son reales (P8). Se muestran con fecha de lectura y enlace al perfil, y se quita la etiqueta "EJEMPLO".

### 3.5 Seguridad: qué hace el frontend ahora y qué es propuesta

Base medida en la base local, que tiene las mismas políticas que producción según `03`:
- `orders_insert_own` con `WITH CHECK (user_id = auth.uid())`;
- `orders_update_own` con `USING (user_id = auth.uid() AND status = 'pending')` y un `WITH CHECK` que solo mira `user_id`;
- `order_items_insert_order`.

`orders_status_check` sí restringe `status` a 6 valores, así que no hay XSS almacenado por esa columna en `js/modules/pages/dashboard.js:166-181`. Pero **no hay restricción sobre `total`**: un cliente puede poner su pedido en `delivered` o `confirmed`, o con total 0 o negativo.

**El frontend, en la primera entrega:**
1. **Cliente Supabase perezoso desde el paquete npm** para las páginas nuevas. Hoy existe una cadena estática que deja en blanco la landing si falta el `.env`: `src/entry/landing.tsx:6` → `Lupa/montar.tsx:4` → `Lupa.tsx:3` → `js/modules/supabase.js:10-14` (`throw`). Además `supabase.js:2` importa `@supabase/supabase-js@2` desde jsdelivr en tiempo de ejecución, con versión flotante y sin integridad: es riesgo de cadena de suministro y una dependencia de red. No se toca `js/modules/supabase.js`, para no romper las páginas viejas.
2. **Guardia del panel:**
   - `supabase.auth.getUser()` (valida el JWT con el servidor, no `getSession()`) y luego RPC `is_admin()`;
   - no se pinta nada del panel (ni esqueleto con datos) antes de las dos respuestas;
   - al fallar, `location.replace` al acceso.
   - Se dice en el código y en la entrega que esto es experiencia de uso: la seguridad real es RLS.
3. **`signOut()` real** en "Cerrar sesión", con el alcance global por defecto. Después `location.replace`, para que Atrás no muestre datos en caché. Cierra P-42.
4. **Cero `innerHTML` o `dangerouslySetInnerHTML`** en las páginas nuevas. Los textos del cliente (`notes`, `delivery_address`) se pintan siempre como nodos de texto de React. El token de sesión vive en `localStorage`: un XSS equivale a tomar la cuenta del admin, y el CSP de producción permite `'unsafe-inline'` (`netlify.toml:35`).
5. **Nunca escribir `orders` ni `order_items` directo.** Solo el RPC `create_order_with_items`. Compuerta con `rg "from\('orders'\)\.(insert|update|upsert)"` en `src/` = 0. El checkout no entra en la primera entrega, pero la regla queda escrita.
6. **Asistente sin superficie de ataque:** sin campo libre, sin escribir en `chat_messages` (la tabla no existe en producción; `chatbot.js:143-166` le escribe "fire-and-forget") y sin ninguna llave de LLM con prefijo `VITE_`. `GROQ_API_KEY` es solo de servidor. Un escritor tentado a "hacerlo IA" filtraría la llave en el bundle.
7. **Páginas nuevas listas para un CSP estricto:**
   - fuentes autoalojadas, así sale `fonts.googleapis.com`;
   - Lucide empaquetado, sin CDN;
   - Maps por fachada;
   - sin scripts en línea.
   - Prueba: `rg "eval\(|new Function"` sobre `dist/` = 0.

**Propuesta, no se aplica (D13, contrato compartido `supabase/migrations`):**
- `REVOKE INSERT, UPDATE ON orders, order_items FROM authenticated`, quitar `orders_insert_own`, `orders_update_own` y `order_items_insert_order`, y forzar el RPC;
- `CHECK (total >= 0)`;
- `REVOKE EXECUTE … FROM anon, public` en las 10 funciones `SECURITY DEFINER`, empezando por las de trigger;
- `search_path` fijo en las 4 funciones mutables;
- activar la protección de contraseñas filtradas;
- desactivar `pg_graphql` si no se usa;
- quitar `'unsafe-eval'` del CSP (`'unsafe-inline'` después, cuando `accessweb.html:329-363` deje de tener script en línea);
- Django: `is_staff` o grupos por vista y ajustes `SECURE_*`. Django no está en `main` ni en producción, así que en v1 el panel no lo toca.

La propuesta llega con una prueba, no solo con texto (cambio C11).

### 3.6 Alcance y costo

- **Presupuesto medido por la propia bitácora** (`ESTADO.md:118-119`): la ventana de 5 h pasó de 35 a 81 % (46 puntos) mientras el límite semanal pasó de 54 a 59 % (5 puntos). **Estimación: 1 punto de la ventana de 5 h ≈ 0,11 puntos semanales.**
- El plan actual pide 7 unidades de hasta 15 % cada una (hasta 105 % de una ventana) más revisiones. Una revisión fresca por unidad serían 7 corridas más, cerca de dos ventanas. Eso son 20 a 25 puntos semanales, con el semanal ya en 59 % antes de esta fase: la semana se acaba antes de que Eduardo vea algo coherente.
- La propuesta (sección 7) cuesta unos 95 a 120 puntos de ventana, es decir 1 a 1,3 ventanas: unos 10 a 13 puntos semanales. Es una estimación, no una medición.
- **Costo oculto:**
  - Cada commit de código dispara `gga run` con `PROVIDER="claude"` y `STRICT_MODE="true"` (`02` §7): es una corrida de modelo por commit.
  - `RULES_FILE="AGENTS.md"`, y `AGENTS.md` exige `styles.scss` co-locado por componente React (sección Estilos). Un componente Tailwind sin `styles.scss` puede ser rechazado.
  - Si ocurre, se usa `--no-verify` y se anota (D14). Ningún escritor crea `styles.scss` vacíos para complacer al hook: eso es basura con forma de cumplimiento.
- Lo que no cabe en la primera entrega está en la sección 6, ordenado.

### 3.7 Docker y verificación en Brave

| Bloqueo | Estado medido | Qué hacer |
|---|---|---|
| Contenedor | `carni-landing-dev` salió con código 1 hace 2 días (SIGTERM, no fallo) | `docker start carni-landing-dev`; `curl -sI http://localhost:3002/landing.html` → 200 |
| `.env` en `pruebas` | No existe (`eza -a`) | Crearlo con `VITE_SUPABASE_URL=http://localhost:54321` y la clave anónima local, copiada del `.env` del checkout principal sin imprimirla. **Reiniciar el contenedor**, porque Vite lee `.env` solo al arrancar. |
| `host.docker.internal` | El navegador del host no lo resuelve (`02` §5) | `localhost:54321` responde: Kong está publicado en `0.0.0.0:54321` y el stack local lleva 40 h arriba |
| `supabase.js` lanza al importarse | Cadena estática confirmada (3.5.1) | Cliente perezoso en las páginas nuevas (C2) |
| Datos en el teléfono | Con `localhost:54321` embebido, un teléfono en la LAN pide a su propio localhost y cae a la semilla sin avisar | Insignia solo de desarrollo (`import.meta.env.DEV`): "Datos: vivos · 53" o "Datos: semilla". Si Eduardo prueba en el teléfono, se agrega un proxy de Vite `/supabase` → `host.docker.internal:54321` (S). |
| Panel y acceso | 0 usuarios y 0 admins locales | Crear un admin de prueba local (registro contra GoTrue local y rol `admin` por SQL en la base local), con las credenciales anotadas en un archivo de semilla o fixture del proyecto, nunca en el chat. Sin esto, U-G no se verifica. |
| Stack local caído al abrir | Posible tras reiniciar la Mac | La insignia lo delata. En la entrega: "si dice semilla, `supabase start`". |
| Estilos cruzados | `CartPanel/montar.tsx:7` monta `GlobalStyles` de styled-components en la página Tailwind | No montar `montarCarrito()` en las páginas nuevas: el carrito nuevo es la Hoja. La Lupa se mantiene (cumple con X, Escape y foco). Su restilizado queda diferido. |
| Worktree equivocado | La sesión orquestadora vive en `.claude/worktrees/frontend-react-tailwind-prompt-d5687d` (otra rama). `pruebas` está en `~/Desktop/Carni-mvp-pruebas`. | Toda instrucción a escritores con `WT=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas`, comprobación previa de `git -C "$WT" branch --show-current` = `pruebas`, y al final `git status` limpio en el worktree de la sesión |

### 3.8 Decisiones que anulo o corrijo

Ver la sección 5.

### 3.9 El plan agéntico

Ver la sección 7.

### 3.10 Pre-mortem (cómo muere en una semana)

1. Día 1: se lanzan U-B, U-C, U-D y U-F en paralelo sobre el mismo árbol. U-D agrega el cajón del menú en `Encabezado.tsx` mientras U-B lo reescribe a `fixed`. El commit de U-C se lleva archivos que U-F dejó preparados en el índice.
2. GGA rechaza el primer commit por la regla de `styles.scss`. Un escritor la "arregla" creando SCSS vacíos, y otro reintenta dos veces en Opus.
3. Día 2: la landing muestra "Paquete Carnitas por Kilo" y "20 en stock" en vivo. El correo del pie rebota. El vidrio va a 20 fps en el Android de la tía.
4. `carni-qa` no se encuentra y la revisión cae a un agente genérico sin las reglas del repo.
5. Los jueces corren en Sonnet sin que nadie lo note.
6. Día 3: el límite semanal pasa de 85 %. Eduardo abre Brave: la landing es nueva, el catálogo es el viejo, el carrito es otro, el panel no abre (sin usuario) y la sección de contacto son tres tarjetas iguales.
7. Veredicto de Eduardo: "sigue pareciendo Canva y no terminaste".

---

## 4. Cambios, ordenados por severidad (máximo 12)

| Id | Cambio | Por qué | Evidencia | Costo |
|---|---|---|---|---|
| C1 | Antes de cualquier escritor, commit de línea base del prototipo sin seguimiento. Git lo maneja solo el orquestador: los escritores nunca hacen `add`, `commit`, `checkout`, `switch` ni `stash`. | Hoy no hay forma de hacer diff ni de volver atrás sobre 2100 líneas. Con un solo actor de git no hay índices cruzados. | `git status`: `?? landing.html`, `?? src/landing/`, `?? src/ui/`, `?? src/styles/tailwind.css`, `M package.json`, `M vite.config.js` | S |
| C2 | Cliente Supabase perezoso (`src/data/supabase.ts`, paquete npm) para las páginas nuevas. Cortar la cadena estática a `js/modules/supabase.js`. No montar `CartPanel/montar` ni `GlobalStyles` en páginas Tailwind. | Sin `.env` la landing queda en blanco. El import de jsdelivr es riesgo de cadena de suministro. Los estilos globales rompen "misma edición". | `landing.tsx:6-7`, `Lupa/montar.tsx:4`, `Lupa.tsx:3`, `supabase.js:2,10-14`, `CartPanel/montar.tsx:3,7` | S |
| C3 | Encabezado con el efecto viejo, literal: transparente con velo sobre el video; `:hover` (solo `hover: hover`) y `:focus-within` a `rgba(0,0,0,.92)` con el velo apagado; sólido al pasar el hero. Sin `backdrop-blur` en móvil. Blur solo en escritorio y solo si la traza de rendimiento lo aprueba. | Es lo que Eduardo pidió devolver. El blur sobre video es el mayor riesgo de rendimiento y no está probado. | `_header.scss:7-26,65-98`; `04` §2.5 [NO PROBADO]; `ESTADO.md:77` | S |
| C4 | Quitarle a la landing su aire de plantilla: caja con borde solo en productos; información en filas con hairline; máximo 2 kickers; cada dato una sola vez; fuera las cifras de Familia y "53 productos"; filas como objetivo táctil en vez de píldoras apiladas; compuerta de cadenas de ruido (`falta backend`, `EJEMPLO`, `confirmar con el dueño`) = 0. | Es la diferencia entre "editorial" y "Canva" que Eduardo exige. | captura `02-landing-movil-secciones.jpg`; `01` §7; `design-taste-frontend` SKILL.md:214, :217, :251 | M |
| C5 | Verdad de datos en Tarjeta y secciones: sin cifras de existencia; variante `ilustrativa` ("Foto ilustrativa" o tipográfica) para productos con foto de categoría; carrusel de 7 cortes sin Rib Eye (la foto es un T-bone); precio y `price_per_lb` de la base; respaldo del carrusel con los mismos cortes; ninguna foto de producto generada con IA. | Mostrar existencias inventadas y la foto de otro producto es afirmar algo falso al comprador. | base local: 18 `image_url` para 53 productos, `stock` de 8 a 150; `datos.ts:119-124,257`; `01` §8.6 | M |
| C6 | Quitar el correo del sitio mientras no exista una dirección que funcione. Contacto = teléfono, WhatsApp y mapa. | Los dos dominios no tienen DNS: el enlace `mailto:` rebota. | `dig` NS/MX/A vacíos; `datos.ts:314-315` | S |
| C7 | Asistente: lanzador con el SVG propio de la burbuja con cuchilla (pedido literal de Eduardo); busto de la mascota solo dentro, como avatar; sin campo libre; guion sin cifras salvo el horario; porciones con los nombres de paquete de la base; sin escritura en `chat_messages`; sin llave `VITE_` de LLM; sin chocar con el "+" de la Tarjeta. | Un chat común es lo que Eduardo rechazó. La caricatura flotando en todas las páginas arrastra el estilo del acceso al sitio editorial. | `ESTADO.md:81`; `04` §5.1 y §6.4; `chatbot.js:143-166` | S |
| C8 | Hero: titular de 28–32 px y dos líneas en móvil, sin kicker, sin animación de entrada en el titular (LCP); recodificar `portada-carne.mp4` (no `VideoCarniwebP01`) y usar `portada-carne-poster.webp`; contraste medido sobre `portada-carne-cuadro-claro.jpg`; Maps por fachada; fuentes autoalojadas en subconjunto. | El 16:9 a 360 px deja unos 146 px útiles. Los 405 KB son de otro archivo. El titular animado retrasa el LCP. | `ffprobe` (10,0 s frente a 15,04 s); `01` §3.1; `04` §3.2; `landing.html` con Google Fonts | S |
| C9 | Verificación de datos: `.env` con `localhost:54321` y reinicio del contenedor; insignia de origen de datos solo en desarrollo; proxy de Vite solo si se prueba en el teléfono. | Sin la insignia, "se ve bien" puede ser la semilla, y el teléfono cae a la semilla en silencio. | `02` §5; `shared.tsx:28` | S |
| C10 | Panel v1 = solo la carcasa: aside de 248 px en escritorio y cajón `Hoja izquierda` con X en móvil (sin la barra inferior de 5 pestañas en v1); guardia `getUser()` + `is_admin()`; `signOut()` real; Inicio con estados vacíos honestos; confirmaciones con X; admin de prueba local anotado en una fixture. | Es la queja explícita de Eduardo (menú sin X) y el riesgo P-42. El kanban, el CRUD y los KPI no tienen datos (`orders` = 0) y no caben en el presupuesto. | `01` §3.8 y §5 (dos navegaciones a la vez); `03` C.1.2; `auth.users` = 0 | M |
| C11 | Propuesta de seguridad con prueba: `guardian-de-datos` escribe la migración y un guion de prueba RLS en `docs/design/rediseno/seguridad/`. El orquestador lo ejecuta en la base local dentro de `BEGIN … ROLLBACK` (mismas políticas verificadas en local), comprobando que un `authenticated` ya no puede insertar un pedido ni cambiar `total` o `status`. Se agrega `CHECK (total >= 0)` y la corrección de datos "Paquete Carnitas por Kilo" para el chat de backend. | Una migración sin prueba es texto. El agente no tiene `Bash` (`guardian-de-datos.md:4`), así que la prueba la corre el orquestador. | políticas y restricciones consultadas en `pg_policy` y `pg_constraint` | S |
| C12 | Ejecución: un solo escritor a la vez, 4 corridas fusionadas en vez de 7 unidades, compuertas mecánicas por corrida, una sola revisión dual al final con los jueces forzados a Opus. No usar `carni-qa` ni `design-handoff` como tipo de agente. | Paralelismo sobre un solo árbol e índice; agentes que no se descubren; jueces fijados en Sonnet; presupuesto. | `ESTADO.md:103`; P4, P6 y P7 | S |

---

## 5. Decisiones anuladas o corregidas

**Anuladas**

- **D3 (encabezado con vidrio `backdrop-blur`).** Se reemplaza por el efecto viejo literal (C3): transparente con velo → `rgba(0,0,0,.92)` en hover real y en `focus-within` → sólido al pasar el hero, con 200–300 ms y `motion-reduce` instantáneo. El blur solo entra como mejora de escritorio si la traza lo aprueba.
- **D15 (correo del sitio actual).** El dominio no existe en DNS. No se muestra correo hasta que Eduardo dé uno que funcione; queda anotado.
- **D11, en su cifra y su archivo.** "Video de 405 KB" no corresponde al video del diseño. Fuente única: `portada-carne.mp4`, recodificada y medida. `VideoCarniwebP01.*` queda para las páginas viejas.
- **`ESTADO.md:103`, "las unidades con archivos distintos pueden ir en paralelo".** Se reemplaza por un escritor en secuencia (regla global del stack: "single writer thread… no parallel writers unless isolated worktrees are explicitly approved"). La única corrida en paralelo es `guardian-de-datos`, que escribe en otra carpeta y no hace commits.
- **U-E (Acceso) dentro de la primera entrega.** Se difiere. El diseño promete un código de 6 dígitos que no existe (hoy hay magic link, `contexto-previo.md` #718), el SMTP por defecto da 2 correos por hora y no hay usuarios locales. Rehacer los flujos de autenticación es trabajo de seguridad, no de maquillaje.

**Corregidas (se mantienen con un cambio)**

- **D1 (carrusel dinámico).** Se mantiene, con 7 cortes (sin Rib Eye, cuya foto es un T-bone) y con respaldo propio si gana la semilla.
- **D2 (hero 16:9).** Se mantiene, con titular de dos líneas y 32 px como máximo, sin kicker ni animación de entrada. En escritorio, `85svh` con un tope de 800 px, porque el video de 1280 px se ve blando a pantalla completa (`01` §6a).
- **D4 (cajón del panel).** Se mantiene el cajón con X. La barra inferior de 5 pestañas del diseño no entra en v1: dos navegaciones a la vez en 390 px son 120 px de cromo, y "Más" hoy no lleva a ningún lado (`01` §5).
- **D5.** Las confirmaciones destructivas del panel también llevan X.
- **D7 (chatbot).** El lanzador es el SVG propio (pedido literal de Eduardo). El busto de la mascota va solo dentro del panel. `design-taste-frontend` SKILL.md:143 veta dibujar íconos a mano; el pedido explícito del dueño gana para este único ícono.
- **D9 (rutas).** Se mantiene `landing.html`, pero "Ver productos" apunta a la entrada nueva del catálogo, no a `products.html`. La Tarjeta enlaza a la ficha vieja, y esa costura queda anotada.
- **D10 (`.env`).** Se mantiene, más el reinicio del contenedor, la insignia de origen de datos y el admin de prueba local.
- **D13 (migración propuesta).** Se mantiene sin aplicar, con la prueba `BEGIN … ROLLBACK` en local y `CHECK (total >= 0)`.
- **D14 (commits).** Se mantiene, más el commit de línea base, git solo en manos del orquestador y la prohibición de crear `styles.scss` para complacer a GGA.

**Sin cambio:** D6 (se difiere con el acceso), D8 (Lucide), D12 (panel solo con Supabase).

---

## 6. Alcance de la primera entrega

**Imprescindible, en orden de prioridad** (si el presupuesto se corta, se entrega hasta donde se llegó, y cada paso es presentable por sí solo):

1. **Preparación del orquestador, sin agentes:** commit de línea base; `.env`; `docker start` y reinicio; video recodificado y medido con `ffmpeg` en el host (no es npm); comprobación de ruta y rama.
2. **Base y carcasa:**
   - un solo `@theme` con los tokens del contrato;
   - escala de 6 tamaños;
   - fuentes autoalojadas en subconjunto;
   - cliente Supabase perezoso;
   - `Hoja` sobre `<dialog>`, con las siete reglas de `04` §8;
   - íconos (Lucide y los propios);
   - Encabezado con el efecto viejo, logotipo tipográfico, menú hamburguesa (Hoja izquierda con X), carrito como Hoja derecha con el contrato `carni_cart_v1` y `cart:updated`;
   - Pie sin correo, con los enlaces reales de redes (memoria `redes-y-catalogo-carniceria.md`; si no están, se ocultan).
3. **Landing en el orden exacto:** portada, mostrador, carrusel de Filete Mignon, lo que se lleva la gente, ofertas, preguntas frecuentes, carnicería de familia, horarios y puntaje, contacto y dirección, comentarios y pie.
   - Cada sección con el tratamiento de C4 y C5.
   - Hero según C8.
   - Carrusel dinámico con 7 cortes.
   - Ofertas desde la base.
   - Comentarios reales con fecha y enlace.
   - Maps por fachada.
4. **Asistente** según C7.
5. **Catálogo:** entrada nueva con filtro de categoría (riel de chips en móvil, columna en escritorio) y la misma Tarjeta con sus variantes `normal`, `oferta`, `chica`, `agotado` e `ilustrativa`. La ficha sigue siendo la vieja (costura anotada).
6. **Carcasa del panel** según C10, verificada con el admin de prueba local.
7. **Propuesta de seguridad con prueba** (C11) y traspaso al chat de backend.

**Diferido, en este orden:**

1. Acceso (Ingresar / Registrarse con la mascota): primero hay que alinear el diseño con el magic link real.
2. Ficha de producto en Tailwind y checkout (solo RPC).
3. Restilizado de la Lupa a Tailwind (hoy cumple X, Escape y foco).
4. Panel: Pedidos (kanban), Productos (CRUD con confirmaciones), Clientes, Ajustes y la barra inferior móvil.
5. Endurecimiento del CSP (`unsafe-eval` primero) con `devops-captain`.
6. Aplicar la migración de seguridad (chat de backend) y la corrección de datos.
7. Asistente con backend (LLM del lado del servidor, `ai-engineer`) y Métricas del chatbot (43 a 45, aún sin diseñar).
8. BuildAds y ProductAds, perfil del cliente (10 secciones, casi todas "falta backend").
9. Fotografía real de producto y del mostrador: el mayor salto de calidad posible, y no lo puede hacer un agente.
10. Reemplazar `index.html` (requiere autorización de Eduardo) y diseño específico de tablet.

---

## 7. Crítica del plan agéntico y plantilla propuesta

### 7.1 Qué está mal en el plan de ejecución actual

- **Paralelismo de escritores sobre un solo árbol** (P4). Rompe la regla global de un solo escritor y comparte índice de git. Cuesta más de lo que ahorra, porque cada escritor paralelo vuelve a leer el diseño y la base.
- **Siete unidades, siete corridas.** Cada corrida paga de nuevo la lectura de contexto (tokens, `AGENTS.md`, recetas). Fusionar en 4 corridas elimina 3 lecturas completas.
- **Revisión fresca por unidad.** Son 7 corridas de revisión. Las compuertas mecánicas (tipos, build, pruebas, `rg`, capturas, medidas) atrapan lo mismo por casi nada. El juicio humano-equivalente se paga una sola vez al final, con dos lentes.
- **Tipos de agente que no existen desde aquí** (P6). `carni-qa` y `design-handoff` solo están en `practicas-ebac`. Copiarlos a `pruebas` sería "introducir una capa local nueva" (HITL de `AGENTS.md`). No se usan: sus funciones las cubren las compuertas y el juez A.
- **Modelos fijados en el frontmatter** (P7). Los jueces caen en Sonnet si no se pasa `model: 'opus'` en cada llamada. `impeccable-*` hereda el modelo de la sesión, que puede ser Opus sin querer. `guardian-de-datos` es Opus fijo: una sola corrida corta.
- **SDD completo** (explore, propose, spec, design, tasks, apply, verify, archive): serían de 5 a 8 corridas que duplican lo que ya hacen `ESTADO.md`, este informe y el plano del arquitecto. Es un desperdicio para esta entrega.
- **Carga de skills.** `design-taste-frontend` tiene 1206 líneas. Pasar 8 a 10 `SKILL.md` a cada escritor es pagar contexto que no se usa. Cada escritor recibe de 3 a 4 skills, con las secciones que aplican.

### 7.2 Plantilla propuesta

| Rol | Tipo de agente | Modelo | Cantidad | Skills (rutas) | Qué hace | Escribe |
|---|---|---|---|---|---|---|
| Orquestador | la sesión (no es agente) | el de la sesión | 1 | `punto-de-control`, `guardemos-esto` (por nombre con `Skill`), `carni-frontend-guardrails` | Preparación (C1, `.env`, Docker, `ffmpeg`); lanza el workflow; vuelve a correr build y compuertas `rg` antes de cada commit; es el único que hace commits (`PATH=/opt/homebrew/bin:$PATH git -C "$WT" commit`, luego `git log -1`); corre la prueba `BEGIN…ROLLBACK`; crea el admin de prueba local; mide; abre Brave; guarda el avance en Engram bajo `carni-mvp` (minúscula), clave `rediseno-mvp/progreso` | `ESTADO.md`, commits |
| Arquitecto (R3, ya encadenado) | `Plan` | opus | 1 | `~/.claude/skills/the-architect/SKILL.md` | Convierte este informe en `06-plano.md`: contratos de componentes (`Hoja`, `Tarjeta`, `Encabezado`, cliente Supabase), criterios de aceptación medibles por corrida y listas de archivos permitidos por escritor | `docs/design/rediseno/06-plano.md` |
| Escritor W1 · base y carcasa | `carni-frontend-specialist` | sonnet | 1 | `.claude/skills/carni-frontend-guardrails/SKILL.md`, `~/.claude/skills/building-components/SKILL.md`, `~/.agents/skills/vercel-react-best-practices/SKILL.md`, `~/.claude/skills/emil-design-eng/SKILL.md` | Tokens, fuentes, cliente perezoso, `Hoja`, íconos, Encabezado (efecto viejo), menú, carrito como Hoja, Pie; corre su propia compuerta y devuelve la evidencia | `src/styles/`, `src/ui/`, `src/data/supabase.ts`, `public/fonts/`, `landing.html`, `src/entry/landing.tsx`, `package.json` (solo `lucide-react`, vía Docker) |
| Escritor W2 · landing | `carni-frontend-specialist` | sonnet | 1 | `~/.claude/skills/impeccable/SKILL.md` (más `reference/craft-floor.md`), `~/.agents/skills/design-taste-frontend/SKILL.md` (solo §4.4 y las reglas de hero, bento y repetición, líneas 213-252), `carni-frontend-guardrails`, `emil-design-eng` | Las 11 secciones en orden con C4, C5 y C8; carrusel con `ResizeObserver`; reseñas con pausa; Maps por fachada | `src/landing/`, `public/img/Videos/` (video recodificado por el orquestador) |
| Guardián de datos (en paralelo con W2) | `guardian-de-datos` | opus (fijo) | 1 | `.claude/skills/supabase-postgres-vesta-style/SKILL.md`, skill `supabase-postgres-best-practices` | Migración propuesta, guion de prueba RLS y traspaso al chat de backend; nunca aplica y no tiene `Bash` | `docs/design/rediseno/seguridad/` |
| Escritor W3 · catálogo | `carni-frontend-specialist` | sonnet | 1 | `building-components`, `vercel-react-best-practices`, `impeccable` | Entrada nueva del catálogo, filtro, Tarjeta única con variante `ilustrativa`, enlace de "Ver productos" | entrada nueva `.html`, `src/entry/`, `src/pages/catalogo/`, `src/ui/Tarjeta.tsx`, `vite.config.js` (una entrada) |
| Escritor W4 · asistente y panel | `carni-frontend-specialist` | sonnet | 1 | `building-components`, skill `supabase` (auth: `getUser`, `signOut`), `~/.agents/skills/web-design-guidelines/SKILL.md`, `carni-frontend-guardrails` | Asistente (C7) y carcasa del panel (C10) con guardia, `signOut()`, cajón con X y confirmaciones con X | `src/ui/Asistente*.tsx`, entrada nueva del panel, `src/pages/panel/`, `vite.config.js` (una entrada) |
| Juez A · UX, a11y y listón editorial | `jd-judge-a` | **opus (forzado en la llamada)** | 1 | `web-design-guidelines`, `impeccable`, `building-components`, `~/.agents/skills/hallmark/SKILL.md` (modo audit) | Revisión ciega del diff desde la línea base: las 7 reglas de superposición, contraste, foco, movimiento reducido, las 11 exigencias de Eduardo punto por punto (crítico de completitud) y el aire de plantilla | informe devuelto (no escribe archivos) |
| Juez B · seguridad y verdad de datos | `jd-judge-b` | **opus (forzado en la llamada)** | 1 | `.claude/skills/cyber-neo-auditoria/SKILL.md`, skill `supabase`, skill `security-review` | Revisión ciega: guardia, `signOut`, `innerHTML`, escrituras a `orders`, llaves `VITE_`, CDN, cadenas prohibidas, cifras inventadas en guion y tarjetas | informe devuelto |
| Corrector | `jd-fix-agent` | sonnet | 1 (2 como máximo) | las del escritor dueño del archivo | Corrige solo los hallazgos CONFIRMED por los dos jueces o CRITICAL de uno; vuelve a correr la compuerta | archivos de los hallazgos |

**Total: 8 corridas de agente** (4 escritores, 1 guardián, 2 jueces, 1 corrector), más el arquitecto que ya está encadenado. Opus: 3 corridas (guardián y jueces). Si un escritor falla dos veces, se relanza esa corrida en Opus (política de Eduardo), no la siguiente.

### 7.3 Forma del flujo (Workflow)

```
preflight (orquestador, en línea)       -> C1, .env, docker start/restart, ffmpeg, rama y ruta
pipeline(W1)                             -> compuerta del escritor -> orquestador: build + rg -> commit
parallel( pipeline(W2), guardian )       -> compuerta -> commit W2; el orquestador corre BEGIN…ROLLBACK
punto-de-control                         -> <60 sigue · 60-79 corto · 80-89 pausa · >=90 pausa ya
pipeline(W3) -> commit -> pipeline(W4) -> commit
punto-de-control
parallel( jd-judge-a[opus], jd-judge-b[opus] )   ciegos, lentes distintas
jd-fix-agent (solo CONFIRMED o CRITICAL) -> compuerta -> commit
re-juicio solo si hubo CRITICAL, una vez como máximo
orquestador: mediciones de la sección 8, capturas 360/390/768/1024/1440, Brave, Engram, ESTADO.md
```

Cada instrucción a un escritor lleva:
- `WT` absoluto y la comprobación de rama;
- la lista de archivos permitidos (tomada de `06-plano.md`);
- los criterios de aceptación;
- las prohibiciones: nada de git de escritura, npm fuera de Docker, `styles.scss`, `innerHTML`, llaves `VITE_` nuevas, fotos de producto con IA, ni tocar `js/modules/supabase.js` o las páginas viejas;
- el contrato de resultado: estado, archivos, evidencia de la compuerta y riesgos.

La compuerta del escritor corre dentro de Docker:
- `docker exec carni-landing-dev npm run ts:check`
- `docker exec carni-landing-dev npm run build`
- `docker exec carni-landing-dev npm test`
- las compuertas `rg`;
- capturas con Chrome sin cabeza (receta de `01` §11).

### 7.4 Dónde un agente es desperdicio

| Candidato | Por qué no |
|---|---|
| `estudio-visual` para el video | Es un solo comando `ffmpeg`. El orquestador lo corre en línea |
| `impeccable-asset-producer`, `impeccable-documenter` | No hay activos nuevos que producir. La documentación es `ESTADO.md` |
| `security-guardian` | Se solapa con el juez B. Usarlo solo si se omite el juez B |
| `devops-captain` | En v1 no hay cambios de CI ni de CSP |
| `ai-engineer` | En v1 no hay LLM |
| `carni-qa`, `design-handoff` | No se descubren desde `pruebas` (P6) |
| Cadena SDD completa | Duplica este informe y el plano |
| `Explore` o nueva investigación | Ya está hecha y destilada |
| graphify | Ya se decidió omitirlo |
| `ui-ux-pro-max`, `mobile-native`, `apple-design`, `redesign-existing-projects` para escritores | La dirección ya está decidida. Cargarlas es contexto pagado sin uso. `hallmark` solo para el juez A |
| Revisión por unidad | La reemplazan las compuertas mecánicas |
| Bucle hasta que se seque | Un solo ciclo de corrección y a lo sumo un re-juicio |

### 7.5 Costo esperado (estimación, no medición)

Puntos de la ventana de 5 h:

| Corrida | Puntos |
|---|---|
| W1 | ~15 |
| W2 | ~15 |
| W3 | ~10 |
| W4 | ~12 |
| Guardián | ~5 |
| Jueces | ~14 (2 × ~7) |
| Corrector | ~6 |
| Orquestador (preparación, compuertas, commits, mediciones, Brave) | ~10 |
| GGA en 5 commits | ~5 a 8 |
| **Total** | **~92 a 95 (tope de 120 con un re-juicio)** |

Eso son 1 a 1,3 ventanas: **unos 10 a 13 puntos semanales**, con la razón de la bitácora (0,11). Hay dos pausas de `punto-de-control` previstas: después de W2 y antes de los jueces.

---

## 8. Lo que se debe demostrar con una medición antes de que Eduardo lo vea

Cada punto con su umbral. El orquestador lo corre y deja el resultado en `ESTADO.md`. "Se ve bien" no cuenta como medición.

1. **Hero móvil:** alto de la caja a 360, 390 y 414 px ≥ 16:9 y ≤ 260 px. Titular en 2 líneas o menos. CTA visible sin scroll. Escritorio a 1440×900: 85 % del alto, con tope de 800 px (`getBoundingClientRect`).
2. **Contraste sobre video:** logotipo e íconos del encabezado y titular del hero, con el velo, sobre `portada-carne-cuadro-claro.jpg`: ≥ 4,5:1 para texto normal y ≥ 3:1 para texto grande e íconos.
3. **Video:** bytes del MP4 recodificado (meta ≤ 450 KB). Ninguna petición de video antes de `load` más inactividad (registro de red). Con `prefers-reduced-motion`, 0 peticiones de video.
4. **LCP proxy:** traza con Chrome sin cabeza, CPU 4× y red "Fast 4G" por CDP. LCP ≤ 2,5 s y el elemento LCP es el póster o el titular. El titular nunca tiene opacidad 0 al cargar.
5. **Encabezado:** estilos computados en la cima (transparente), con hover a 1440 (`rgba(0,0,0,.92)`), con `focus-within` por teclado y tras el scroll (sólido). Si hay blur en escritorio: traza de 5 s con el video corriendo y hover, sin fotogramas largos sostenidos (> 16 ms en serie); si no pasa, se quita.
6. **Superposiciones** (menú, carrito, asistente, cajón del panel, confirmaciones): las 7 comprobaciones de `04` §8.5, ejecutadas por CDP, no afirmadas:
   - X ≥ 44 px con `aria-label` propio;
   - Escape;
   - clic en el fondo;
   - foco de vuelta al disparador;
   - scroll bloqueado;
   - movimiento reducido ≤ 150 ms;
   - título anunciado.
7. **Foco visible:** anillo arena con desplazamiento, visible sobre el botón rojo. Contraste del borde de los campos ≥ 3:1.
8. **Objetivos táctiles:** todo control interactivo ≥ 44×44 px a 390, incluidos los puntos del carrusel.
9. **Origen de datos:** la insignia dice "vivos". El catálogo pinta 53 productos (o los filtrados). Los precios de los cortes del carrusel en el DOM son iguales a los de `SELECT name, price_per_kg`.
10. **Cadenas prohibidas en el DOM renderizado y en `src/`** = 0: `falta backend`, `EJEMPLO`, `confirmar con el dueño`, `Picaña`/`picaña`, cifras de existencia (`/\d+ en (stock|existencia)/`), `$689` fuera de Filete Mignon, el dominio de correo muerto. "Paquete Carnitas por Kilo" se cuenta aparte y se reporta como deriva de la base.
11. **Tarjeta:** todo producto con foto de categoría muestra "Foto ilustrativa" o la variante tipográfica (conteo en el DOM igual al conteo de la base).
12. **Asistente:** 0 campos de texto; el guion no contiene dígitos salvo el horario (regex); intersección entre el lanzador y cualquier botón "+" = 0 a 360 y 390; 0 peticiones a `chat_messages`.
13. **Panel:**
    - sin sesión, 0 peticiones a tablas de admin y redirección;
    - con el admin de prueba local, el cajón con X funciona;
    - "Cerrar sesión" borra la clave `sb-*-auth-token` de `localStorage`;
    - Atrás no muestra datos.
14. **Red:** 0 peticiones a `cdn.jsdelivr.net`, `fonts.googleapis.com` y `fonts.gstatic.com` desde las páginas nuevas. Bytes de fuentes en woff2 ≤ 150 KB.
15. **Seguridad de construcción:** en `dist/`, `rg "eval\(|new Function"` = 0 y ninguna cadena `service_role`, `sb_secret_` ni `GROQ`. En `src/`, 0 coincidencias de `innerHTML`/`dangerouslySetInnerHTML` y de escrituras directas a `orders`.
16. **Consola:** 0 errores en landing, catálogo y panel a 390 y 1440 (panel del navegador integrado o CDP).
17. **Tipos, build y pruebas** dentro de Docker en verde. Las 29 pruebas existentes siguen pasando, porque las páginas viejas no se tocan.
18. **Prueba RLS de la propuesta:** dentro de `BEGIN … ROLLBACK` en la base local, un `authenticated` no puede `INSERT` en `orders` ni cambiar `total` o `status`, y `create_order_with_items` sigue funcionando.
19. **Anchos intermedios:** capturas a 768 y 1024, sin desbordes horizontales (`scrollWidth == clientWidth`).
20. **Árboles de trabajo:** `git -C "$WT" log -1` muestra el commit de la corrida, y el worktree de la sesión orquestadora no tiene cambios nuevos.

---

## 9. Supuestos registrados (Eduardo dijo "no me preguntes")

1. Las reseñas de `src/data/resenas.ts` son reales, según su propio comentario (leídas el 2026-09-03). No se volvieron a verificar contra Google en esta fase.
2. La base local refleja el catálogo de producción (53 productos en ambas, según `03`). Las políticas de `orders` se verificaron en la local, y `03` las derivó en producción.
3. Los precios de la base son los del Catálogo 2024 del dueño y pueden estar desactualizados. Por eso llevan un aviso único.
4. "Se mezcla con el video" se interpreta como el estado transparente con velo del encabezado viejo, no como desenfoque.
5. El admin de prueba local es un dato de prueba de la aplicación de Eduardo en `localhost`. Sus credenciales viven en un archivo de fixture del proyecto, no en el chat ni en commits públicos.
6. Los enlaces reales de Facebook e Instagram están en la memoria `redes-y-catalogo-carniceria.md`. Si el escritor no los encuentra ahí, el Pie los oculta, como hoy.
7. La estimación de costo usa una sola observación de la bitácora (46 puntos de la ventana = 5 puntos semanales). Puede variar ±30 %.
