# LOOP — revisar lo entregado y cerrar la Práctica 4

Rama: `practicas-ebac` · Cabeza al escribir esto: `1e8c1fbc` · PR #9: MERGEABLE
Lección: https://lms.ebac.mx/lesson/c5998627-c749-4d51-bf17-ee5fc88c9abd

Eduardo está mirando la web en Brave mientras vos la revisás. Trabajá en
paralelo, no lo esperes.

---

## PASO 0 — Cargá contexto. NO lo vuelvas a investigar.

Todo esto ya se investigó y se pagó. Leelo, no lo repitas.

**Engram — OJO, ESTO SE COMPROBÓ Y FALLA SI LO HACÉS DISTINTO.**

Las observaciones de esta tanda quedaron guardadas bajo el proyecto
**`Landingpages-Carni.pwa`**, NO bajo `Carni-mvp`, aunque se pasó `Carni-mvp` al
guardar. `mem_search` con `project: "Carni-mvp"` devuelve CERO, y `mem_context`
con ese filtro devuelve "No previous session memories found". No es que no
estén: es que el filtro las esconde.

**Buscá SIN filtro de proyecto**, o mejor, andá directo por id con
`mem_get_observation`, que es lo único que no depende de la búsqueda:

| id | qué trae |
|---|---|
| **564** | el Figma de Eduardo medido: popin 1509×1029, panel 360px, los 9 puntos del panel, y el método para releerlo |
| **565** | las 31 brechas mapeadas y las 29 confirmadas leyendo el código |
| **566** | qué se implementó en esta tanda y las trampas que costaron caro |
| **559** | por qué la búsqueda de la lupa nunca funcionó (columnas fantasma, 400 silencioso) |
| **562** | P-38: hay DOS sitios de Netlify y uno sirve la web muerta |
| **545** | el markup real de la lupa de LV extraído de un snapshot |
| **554** | P-10.1: `getProducts` expone stock y metadata al navegador anónimo |

Una corrección sobre la #564: dice que el DOM se pegó al Figma con la extensión
de Kimi. **Es Anima** ("Anima: Clone website & ...") — Eduardo lo confirmó con
una captura. Lo demás de esa observación está medido y es bueno.

Si vas a guardar algo nuevo, guardalo y **después comprobá que se encuentra**.
Un `mem_save` que responde "Memory saved" no garantiza que la próxima sesión lo
vaya a encontrar con el filtro que use.

**Grafo**: `graphify-out/` está al día (1833 nodos). El hook de git lo
reconstruye en cada commit. Si necesitás actualizarlo a mano el comando es
`graphify update .` — **`graphify . --update` NO es lo mismo y pide clave de LLM**.

**Documentos**:
- `docs/PLAN_LUPA_Y_FICHA_LV.md` — el plan de las cuatro tandas, con archivo:línea
- `docs/MIGRACION_TAILWIND.md` — por qué Tailwind después, y el plan por componente
- `docs/PENDIENTES.md` — deuda. **Fuente única de verdad**: si algo está acá, esto manda
- `docs/LOOP_ENTREGA_LMS_P4.md` — el mensaje LMS anterior. **Era demasiado largo**

**Lo que dio el video y el Figma no** (ya está en engram, va acá porque ordena todo):
el popin de LV **tapa el encabezado entero** — `top: 0`, no colgado del header.
Por eso ahí sólo hay UNA lupa: no esconden nada, el panel la cubre. Hover en
tendencia = subrayado. Las tarjetas de la rejilla no tienen gap ni radio: las
fotos se tocan y el texto va fuera de la banda gris.

---

## PASO 1 — Revisá. Con evidencia, no con opinión.

Servidor: `npm run dev` → **puerto 3002** (`vite.config.js:9`). No 5173, no 5199.

Herramientas: el MCP de navegador que tengas (Playwright o el panel), a **390 y
1440**. Las cuatro páginas: `index.html`, `products.html`,
`products.html#/producto/13`, `accessweb.html`.

Comprobá esto y guardá el número, no la impresión:

1. **Una sola lupa.** Con el popin abierto no puede verse la píldora del header.
2. **Rejilla de seis columnas** con escalones a 4/3/2.
3. **Búsqueda contra Supabase**: la petición con `ilike` tiene que dar **200**.
   Si da 400, algo volvió a pedir una columna que no existe.
4. **Foco**: abrir con el botón, cerrar con Escape, el foco vuelve al botón.
   Tab tiene que ciclar dentro del popin y no salirse.
5. **Ficha**: tres fotos apiladas, el panel pegajoso mientras corren, y al
   terminar la tercera el banner y los sugeridos **sin que nada los tape**.
6. **El botón "Agregar al pedido" alcanzable** con el panel pegado.
7. **Carrito abierto sobrevive** landing → catálogo → acceso.
8. Consola sin rojos. El 403 de fontawesome es externo y preexistente.

### Trampas de medición que YA se pagaron. No las vuelvas a pagar.

- **La lista renderizada MIENTE cuando hay respaldo local.** La lupa mostraba
  resultados creíbles con precios inventados mientras Supabase devolvía 400 en
  cada búsqueda. Leé `responseStatus` de
  `performance.getEntriesByType('resource')`, no la pantalla.
- **Si el panel del navegador está oculto**, `document.hidden` es `true`:
  `scrollTo()` no hace nada, `computer:scroll` da timeout y las capturas salen
  negras. `getBoundingClientRect()` y `scrollHeight` SÍ son fiables ahí. Si no
  podés ver algo, decilo — no lo inventes.
- **`mouseenter` nativo no dispara `onMouseEnter` de React** (React delega por
  `mouseover`).
- **`rg -r` es `--replace`, no "recursivo".** `rg -rn 'carni_cart'` reemplaza el
  match y te hace leer basura.
- Los dos previews de Netlify: **`carniwebpwa` es el bueno**. `carni-pwa` no
  tiene las variables de Supabase y sirve la web muerta (P-38).

---

## PASO 2 — Arreglá lo que la revisión encuentre, y lo que falta

Pendiente conocido del plan:

- **Punto 26** — mini-cabecera pegajosa en la ficha: miniatura + nombre +
  subtotal + un botón que llame al **mismo** `agregarAlPedido()`, sin duplicar
  lógica. El patrón ya está escrito en `src/entry/home.tsx`: centinela de 1px
  con IntersectionObserver, y hasta documenta el caso de "el observer no reporta
  nada". Copialo de ahí. Se oculta arriba de 900px: ahí el panel pegajoso ya
  deja el CTA en pantalla y la barra sería ruido.
- **Punto 29** — filas apiladas al pie del panel: "Cómo lo entregamos", "Dónde
  estamos", "Cómo lo cortamos". Reutilizan el CSS de `.ficha__acordeon` que ya
  existe. No escribas ese bloque dos veces.
- **Punto 17** — corazón de favorito en la tarjeta de resultado. Hay tabla
  `favorites` en Supabase (`js/modules/utils/offline.js:140`). Si no querés
  tocar persistencia todavía, dejalo visual con `aria-pressed`.

**La regla de Eduardo, textual**: *"algo sobrepuesto se ve roto, algo duplicado
es recursividad, evitala."* Si tu cambio hace que algo se dibuje dos veces o uno
encima de otro, está mal aunque compile.

---

## PASO 3 — Que cumpla la práctica

Entrá a la lección y leé el enunciado. Si el visor de Adobe no deja avanzar,
usá la skill `ebac-lms-reader`, que trae la técnica.

Todo esto va con **styled-components**, no con Tailwind. El enunciado lo pide
por nombre y esa decisión ya está tomada y documentada.

Comprobá una por una y con archivo:línea REAL:
instalación · tema con `ThemeProvider` · `createGlobalStyle` · componentes
estilizados · estilos que dependen de props (`$` transitorias) · herencia con
`styled(X)`.

---

## PASO 4 — Las ramas

- **`practicas-ebac`** lleva la práctica y es lo urgente. Ahí va todo esto.
- **PR #9** (`practicas-ebac` → `main`) está MERGEABLE. **NO lo mergees vos**:
  es decisión de Eduardo.
- **Tailwind es después del merge**, no ahora. Está como P-37 con su plan por
  componente en `docs/MIGRACION_TAILWIND.md`. En el mensaje del LMS se menciona
  en dos o tres líneas, no más: styled-components está en modo mantenimiento
  desde el 17/03/2025 y aun así cumple el enunciado y no está roto.

---

## PASO 5 — El mensaje del LMS

Dejalo en `docs/` listo para copiar. **NO lo publiques: lo pega Eduardo.**

**MÁS CORTO QUE EL ANTERIOR.** El de la práctica pasada se fue a 136 líneas y
era demasiado. Apuntá a la mitad. Estructura:

1. Saludo breve al profe Sergio y por qué se sigue el mismo proyecto
2. Cómo correrlo en local (rama, clone, `npm run dev`, puerto 3002)
3. Dónde está cada requisito — `archivo.tsx:línea`, **verificada una por una**
4. Un párrafo de adaptación al negocio
5. **Dos** defectos reales, no cinco. Los mejores
6. Tres líneas sobre Tailwind y por qué la entrega va con styled-components
7. Cierre con "un salu2"

Links reales: commit y URL completa del PR. Sin links rotos.

---

## REGLAS DURAS

- NO tocar: los 45 SCSS vanilla, `css/` 7-1, `vite.config.js`, `netlify.toml`,
  `server/routes/buildads.ts`.
- NO renombrar rutas públicas: `index` · `products` · `accessweb` · `dashboar`.
- NO: `npm run css:components` · `git add .` · `--force` · `sudo` · reescribir
  historia empujada · mergear a `main` · publicar en el LMS.
- Commits **por archivo**, conventional commits, mensajes bilingües,
  `--no-verify` (GGA caído), sin `Co-Authored-By` ni atribución de IA.
- **Los mensajes de commit van con `-F -` y heredoc citado.** Con `-m "..."` el
  shell interpreta las comillas invertidas y te trunca el mensaje a la mitad.
  Ya pasó.
- npm en Docker/devcontainer, o declarás "fuerza mayor" (precedente P-27) y lo
  corrés en el host. Hoy Docker no está levantado.
- **Evidencia > opinión.** Nada de "debería verse igual" sin el número o la
  captura que lo pruebe.

## CIERRE

Antes de decir que terminaste: `mem_save` de lo aprendido con `topic_key`
estable, y `mem_session_summary`. Existe la skill `guardemos-esto` que hace los
tres pasos (Engram, grafo, `docs/`) — usala.

Reporte final a Eduardo en español: qué verificaste y con qué evidencia · qué
arreglaste con commits · el mensaje del LMS listo · estado del PR.
