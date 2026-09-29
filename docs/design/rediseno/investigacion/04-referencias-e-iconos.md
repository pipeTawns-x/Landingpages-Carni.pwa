# 04 · Referencias convertidas en recetas, y elección de íconos

Fase R1 del rediseño, agente 04. Solo lectura sobre el código de la app; lo único creado es este informe y las capturas de `04-evidencia/`.

Los valores marcados **[PROBADO]** se ejecutaron en un navegador Chromium con una página de prueba (las clases de Tailwind v4 de este informe, tal cual). Lo marcado **[NO PROBADO]** sale de documentación citada o de razonamiento y hay que verificarlo en el dispositivo real antes de darlo por bueno.

---

## 0. Resumen ejecutivo

| # | Tema | Decisión |
|---|---|---|
| 1 | Encabezado sobre video | `fixed`, transparente con degradado en la cima. Se vuelve vidrio (`bg-bg/60` + `backdrop-blur` + hairline) con scroll, con hover real (`@media (hover: hover)`) o con foco dentro. En táctil, el scroll y el foco reemplazan al hover. |
| 2 | Hero | Móvil: caja `aspect-video` que **crece** con el texto (mínimo 16:9), video absoluto detrás. Escritorio: `lg:h-[85svh]`. Video con `preload="none"`, póster, `<source media>` (360p móvil, 720p escritorio), reproducción por IntersectionObserver y modo solo-póster con movimiento reducido o ahorro de datos. |
| 3 | Carrusel | `scroll-snap` nativo, botones con `aria-disabled`, puntos en una píldora, `ResizeObserver` para medir. Sin dependencias. |
| 4 | Asistente | Hoja modal con la mascota, sugerencia "¿Te ayudo a elegir tu corte?", chips y respuestas guionadas que solo usan datos reales del repo. Sin campo de texto mientras no exista backend. |
| 5 | Íconos | **Lucide** (`lucide-react`, ISC). Se conservan los 14 íconos propios de `src/ui/iconos.tsx`. Dos SVG propios: `IconoCuchilla` y `IconoAsistenteCarnicero`. |
| 6 | Lista "moderno, no Canva" | 12 reglas (9 de hacer y 3 de evitar) sacadas de Louis Vuitton, Freitag, ORBE, Apple, ChatGPT, Hallmark y Emil, más 5 micro-interacciones con valores. |
| 7 | Estándar de cierre | `<dialog>` nativo con `showModal()`: X visible, Escape, clic en el fondo, fondo inerte y foco de vuelta al botón que lo abrió. |

---

## 1. Método y límites

**Leído.** 6 de las 14 capturas de `docs/design/referencias/capturas/`: `orbe-portada`, `orbe-movil`, `chatgpt-asistente`, `louisvuitton-tarjetas`, `freitag-catalogo`, `apple-portada`. Las 8 restantes no las abrí. Las de ChatGPT y Freitag son páginas de refero.design con una descripción textual del estilo, no los sitios reales.
También leí `src/ui/iconos.tsx`, `Encabezado.tsx`, `src/landing/Portada.tsx`, `src/landing/datos.ts`, `Horario.tsx`, `src/styles/tailwind.css`, `CartPanel.tsx`, el foco de `Lupa.tsx`, el README de la mascota, y las skills `hallmark`, `emil-design-eng` y `apple-design` (solo las secciones necesarias).

**Página de prueba** (en el scratchpad, no está en el repo): Tailwind v4 desde el build de navegador (`@tailwindcss/browser@4`), que **no** es la tubería del repo (`tailwindcss ^4.3.3` con `@tailwindcss/vite`). Sirve para comprobar que las clases generan el CSS esperado, no para medir rendimiento.

**Límites de la prueba.**
- Solo Chromium. No probé Safari, iOS, Firefox, lector de pantalla ni gestos táctiles reales.
- El panel del navegador integrado detiene el renderizado entre llamadas: `requestAnimationFrame`, `ResizeObserver` y transiciones avanzan cuando se toma una captura. Esto no ocurre en un navegador normal. Por eso algunas lecturas iniciales salieron desfasadas; las medidas de abajo son posteriores a un fotograma.
- Las variantes `reduced-transparency:`, `contrast-more:` y `not-supports-[...]` **no** se ejercitaron.

### Medidas [PROBADO]

| Prueba | Resultado |
|---|---|
| Encabezado, vidrio por scroll (375 px) | `backdrop-filter: blur(16px) saturate(1.5)`, fondo `#0b0b0c` al 60 %, `::before` (degradado) con `opacity: 0`, sombra hairline `rgba(255,255,255,.08)` |
| Encabezado, hover (1440 px) | `blur(24px) saturate(1.5)`; el CSS generado por la variante incluye `@media (hover: hover) { …:hover }` |
| Hero móvil (375 px) | caja de 375 × **232 px**; el mínimo 16:9 sería 211 px; creció por el texto |
| Hero escritorio (1440 × 900) | 765 px = **85,0 %** del alto |
| Video | original 1280×720, 15 s, 1,6 MB. Variante 640×360, H.264, CRF 30, sin audio: **405 KB**. WebM VP9 CRF 38: 461 KB (peor). Póster 640 px: 15 KB |
| `<source media>` | a 980 px Chrome eligió `hero-360.mp4`; a 1440 px, `VideoCarniwebP01.mp4` |
| `<dialog>` | al abrir, el foco cae en el primer enfocable; **Escape** cierra y el foco vuelve al botón que lo abrió; **clic en el fondo** cierra y devuelve el foco igual; `html` queda con `overflow: hidden` abierto y `visible` cerrado; 4 Tab ciclan X → enlace → WhatsApp → X |
| Carrusel (1440 px) | paso = 350 px = tarjeta 326 + separación 24; un clic en "siguiente" avanza **exactamente** una tarjeta; "anterior" queda `aria-disabled="true"` en el inicio |
| Hoja del asistente (375 px) | ocupa 640 px de alto (tope de `min(80dvh, 640px)`); el foco inicial cae en el título |

Capturas en `docs/design/rediseno/investigacion/04-evidencia/`: `movil-hero-carrusel-lanzador.jpg`, `movil-cajon-abierto.jpg`, `movil-asistente-hoja.jpg`, `escritorio-hero-85svh.jpg`, `escritorio-asistente-panel.jpg`, `icono-cuchilla-diagonal.jpg`, `icono-burbuja-cuchilla.jpg`.

---

## 2. Receta 1 · Encabezado transparente que se mezcla con el video

**Referencia.** Louis Vuitton: menú y búsqueda a la izquierda, marca al centro, íconos a la derecha, sin caja ni sombra. Apple (skill `apple-design`, §12): la barra es una capa translúcida con `backdrop-filter` y el contenido corre por debajo, no una tira opaca.

### 2.1 CSS (añadir a `src/styles/tailwind.css`)

```css
@theme {
  /* dentro del @theme existente */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);      /* cajones y hojas */
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);  /* micro-interacciones */
}

/* "glass" = data-glass="true" (scroll) OR foco dentro OR hover con puntero real */
@custom-variant glass {
  &:is([data-glass="true"], :focus-within) { @slot; }
  @media (hover: hover) { &:hover { @slot; } }
}
@custom-variant reduced-transparency (@media (prefers-reduced-transparency: reduce));

@layer base {
  html:has(dialog:modal) { overflow: hidden; }   /* bloquea el scroll bajo cualquier modal */
}
```
[PROBADO] `glass:` generó `.glass\:bg-bg\/60:is([data-glass="true"], :focus-within)` y, aparte, el mismo estilo dentro de `@media (hover: hover)` con `:hover`. En Tailwind v4 el `hover:` estándar ya solo aplica con `(hover: hover)`; la variante propia se necesita para juntar las tres causas en una.

### 2.2 Clases del `<header>` (móvil primero)

```tsx
<header
  data-glass={vidrio ? 'true' : 'false'}
  className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between px-1.5 pt-[env(safe-area-inset-top)] text-text lg:h-[72px] lg:px-6
    before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-linear-to-b before:from-black/55 before:to-transparent before:transition-opacity before:duration-200 before:ease-out
    transition-[background-color,backdrop-filter,box-shadow] duration-200 ease-out motion-reduce:transition-none
    glass:bg-bg/60 glass:backdrop-blur-lg lg:glass:backdrop-blur-xl glass:backdrop-saturate-150
    glass:shadow-[0_1px_0_0_rgb(255_255_255/0.08)] glass:before:opacity-0
    not-supports-[backdrop-filter:blur(1px)]:glass:bg-bg/90
    reduced-transparency:glass:bg-bg reduced-transparency:glass:backdrop-blur-none
    contrast-more:glass:bg-bg contrast-more:glass:backdrop-blur-none"
>
```

Por qué así:
- El degradado va en un `::before` con transición de `opacity`. Un `background-image` no se anima, así que meter el degradado en el propio `<header>` haría un salto al pasar a vidrio.
- Sin el degradado, texto claro sobre un fotograma luminoso del video no llega a 4,5:1. Comprobar con el fotograma más claro del video final (criterio de aceptación, no medido aquí).
- Duración 200 ms, `ease-out`: regla de Emil (interfaz por debajo de 300 ms, nunca `ease-in`).
- `blur-lg` (16 px) en móvil y `blur-xl` (24 px) en escritorio. El mismo 60 % de opacidad da el efecto "se mezcla con el video": se ve el color del video a través, pero desenfocado.
- `saturate(1.5)` evita que el video se vea lavado bajo el vidrio (la skill de Apple usa 180 %; 150 % probado).
- `h-[calc(3.5rem+env(safe-area-inset-top))]` solo importa con `viewport-fit=cover`. Sin esa meta, `env()` vale 0.

### 2.3 Estado de scroll (centinela, sin escuchar `scroll`)

```tsx
export function useVidrio(forzado = false) {
  const centinela = useRef<HTMLDivElement>(null);
  const [vidrio, setVidrio] = useState(false);
  useEffect(() => {
    const el = centinela.current;
    if (!el || !('IntersectionObserver' in window)) { setVidrio(true); return; }
    const io = new IntersectionObserver(([e]) => setVidrio(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { centinela, vidrio: vidrio || forzado };
}
// primer hijo del documento:
// <div ref={centinela} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2" />
```
[PROBADO] con el centinela: `glass` pasó a `true` al bajar 120 px y volvió a `false` en la cima. El `scroll` + `rAF` que ya usa `Encabezado.tsx` (umbral de 8 px) es equivalente; cambiar de uno a otro es opcional.

### 2.4 Táctil, teclado y movimiento reducido

| Situación | Comportamiento |
|---|---|
| Puntero fino con hover | Hover sobre el encabezado = vidrio, con transición de 200 ms. |
| **Táctil (sin hover)** | El hover no existe y no hace falta: el encabezado solo tiene tres botones siempre visibles (menú, marca, pedido), no esconde nada. En la cima queda transparente con degradado; **el scroll (>8 px) lo vuelve vidrio**. Si algún día hay un menú desplegable bajo el encabezado, pasar `forzado` a `useVidrio` mientras esté abierto. Con `<dialog>` el problema no aparece: la capa superior tapa el encabezado. |
| Teclado | `:focus-within` activa el vidrio en cuanto el foco entra. Foco visible ya definido: `outline 2px solid var(--color-red)`. |
| `prefers-reduced-motion` | `motion-reduce:transition-none`: el cambio es instantáneo. El desenfoque sigue (no es movimiento). |
| `prefers-reduced-transparency` / `prefers-contrast: more` | Fondo sólido `bg-bg`, sin desenfoque. `prefers-reduced-transparency` no es Baseline (Chrome 118, Firefox 113, Safari no; MDN), por eso es solo una mejora progresiva. |
| Sin `backdrop-filter` | `bg-bg/90` (casi opaco). `backdrop-filter` sin prefijo: Chrome 76, Firefox 103, Safari 18. |

### 2.5 Advertencia de rendimiento

`docs/design/referencias/direcciones.md` ya descartó el "glassmorphism pesado" por costo en Android de gama baja con 4G. Esta receta lo limita a **una sola capa** de 56–72 px de alto y sin `backdrop-filter` en los fondos de los `<dialog>` (los `::backdrop` de la receta 7 son negro plano). Aun así, **[NO PROBADO]** sobre un video reproduciéndose en un Android de gama baja o un iPhone; hacerlo antes de aceptar.

---

## 3. Receta 2 · Hero con video

**Referencias.** ORBE (HorizonX): portada con video en pantalla completa. Apple y Freitag: un solo mensaje, un CTA en píldora. Petición de Eduardo: en móvil un video 16:9 pequeño como fondo del texto; en escritorio a sangre, 80–85 vh.

### 3.1 Estructura y clases [PROBADO]

```tsx
<section className="relative">
  <div className="relative isolate grid aspect-video content-end gap-2 rounded-b-[28px] px-4 pb-4 pt-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] text-text
                  lg:aspect-auto lg:h-[85svh] lg:min-h-[560px] lg:max-h-[920px] lg:rounded-none lg:px-12 lg:pb-16 lg:pt-[72px]">
    {/* medios: el recorte vive AQUÍ, no en la caja con aspect-ratio */}
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden rounded-b-[28px] bg-surface-2 lg:rounded-none">
      <video ref={ref} className="size-full object-cover" style={{ objectPosition: '74% 40%' }}
             muted loop playsInline preload="none" poster={assetUrl('/img/Videos/VideoCarniwebP01-poster.jpg')}
             disablePictureInPicture tabIndex={-1}>
        <source media="(min-width: 1024px)" src={assetUrl('/img/Videos/VideoCarniwebP01.mp4')} type="video/mp4" />
        <source src={assetUrl('/img/Videos/hero-360.mp4')} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />
    </div>

    <span className="text-xs font-medium uppercase tracking-[0.04em] text-sand">Carnicería familiar · San Luis Potosí</span>
    <h1 className="m-0 max-w-[14ch] text-balance font-display text-[32px]/[36px] font-[480] tracking-[-0.01em] lg:text-[68px]/[72px]">
      Cortes del día, listos para el asador
    </h1>
    <a href="products.html" className="mt-1 flex h-11 w-fit items-center rounded-full bg-red px-6 text-[15px] font-semibold text-white active:scale-[0.97] lg:h-[52px]">Ver productos</a>
    {/* botón de pausa 44 px: el que ya existe en Portada.tsx */}
  </div>
  {/* en móvil el párrafo baja de la caja para que la caja sea pequeña */}
  <p className="px-4 pt-3 text-base text-text-muted lg:hidden">…</p>
</section>
```

- **"Ajustado al bloque de texto".** `aspect-video` fija el mínimo 16:9 y la caja crece si el texto es más alto. Medido: 375 × 232 px con eyebrow + título de 2 líneas + un botón (mínimo 211). Con el párrafo dentro de la caja se iría a ~300 px; por eso baja fuera.
- **Trampa.** No poner `overflow-hidden` en la caja que lleva `aspect-video`: por la regla de tamaño mínimo automático, el contenido podría dejar de empujar la altura. Lo que probé es el recorte en el contenedor absoluto de medios. El efecto de `overflow-hidden` en la caja con ratio **[NO PROBADO]**.
- **Escritorio.** `lg:h-[85svh]` (`svh` evita saltos por la barra del navegador móvil; en escritorio equivale a `vh`). Medido 85,0 %. El encabezado queda encima porque es `fixed`; `pt-[72px]` mantiene el contenido debajo de él.
- **Cambio frente a hoy.** `Portada.tsx` es una tarjeta redondeada de 320 px / 640 px con margen. Esta receta es a sangre en escritorio y con esquinas inferiores redondeadas en móvil. Confirmar que Eduardo quiere ese cambio (ver §10).

### 3.2 Póster y bytes

| Recurso | Valor |
|---|---|
| Póster | `VideoCarniwebP01-poster.jpg` (43 KB) ya existe. Precargarlo: `<link rel="preload" as="image" href="…poster.jpg" fetchpriority="high">` en `landing.html`. El póster de un `<video>` cuenta como candidato a LCP. |
| Video móvil | Nuevo: `ffmpeg -i VideoCarniwebP01.mp4 -an -vf scale=640:-2 -c:v libx264 -preset slow -crf 30 -movflags +faststart -pix_fmt yuv420p hero-360.mp4` → **405 KB** (medido) frente a 1,6 MB. |
| WebM | No hace falta: a 640 px el VP9 midió 461 KB, más que el H.264. Un solo MP4 evita duplicar archivos. |
| `<source media>` | Válido en `<video>` según MDN; en Firefox solo desde la 120 (BCD). [PROBADO] en Chrome (980 px → 360p, 1440 px → grande). Se evalúa al cargar, no al redimensionar. |
| `preload="none"` | No baja nada hasta el `play()`. [PROBADO]: con `preload="none"` Chrome sí resolvió qué `<source>` usar. |

### 3.3 Reproducción perezosa y bajo ancho de banda

```tsx
type Modo = 'video' | 'poster';
function decidirModo(): Modo {
  if (typeof window === 'undefined') return 'poster';
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const lento = !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ''));
  return reducir || lento ? 'poster' : 'video';
}

useEffect(() => {
  const v = ref.current;
  if (!v || modo === 'poster') { setEstado('pausa'); return; }
  v.muted = true; v.defaultMuted = true;   // React no siempre escribe el atributo `muted` (facebook/react#10389)
  let io: IntersectionObserver | undefined;
  const arrancar = () => {
    io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !pausaUsuario.current) v.play().then(() => setEstado('reproduciendo')).catch(() => setEstado('bloqueado'));
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
  };
  const cuandoLibre = (f: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(f) : window.setTimeout(f, 200));
  const alCargar = () => cuandoLibre(arrancar);
  document.readyState === 'complete' ? alCargar() : window.addEventListener('load', alCargar, { once: true });
  return () => { io?.disconnect(); window.removeEventListener('load', alCargar); };
}, [modo]);
```

Fragmento: `ref`, `modo` (resultado de `decidirModo()`), `pausaUsuario` (`useRef<boolean>`) y `setEstado` son el estado del componente.

| Caso | Qué pasa |
|---|---|
| `prefers-reduced-motion: reduce` | Solo póster; el botón "Reproducir el video" queda disponible (acción del usuario). |
| Ahorro de datos / 2G | Solo póster. `saveData` existe únicamente en Chromium (Chrome 65; Firefox y Safari no; MDN). Es un extra: la protección real para todos es `preload="none"` + archivo de 405 KB + botón de pausa. |
| Autoplay bloqueado (`play()` rechazado) | Se mantiene el póster y el botón muestra "Reproducir". WebKit permite autoplay silenciado con `playsinline` y video visible. Que el modo de bajo consumo de iOS lo bloquee **[NO PROBADO en un iPhone]**; por eso el `catch`. |
| Fuera de pantalla / pestaña oculta | `pause()` por el observador. |
| Pausa manual | `pausaUsuario` impide que el observador reanude solo. |
| Accesibilidad | Video de fondo `aria-hidden` y `tabIndex={-1}`. El botón de pausa cumple WCAG 2.2.2 (contenido que se mueve más de 5 s). |

[PROBADO] `play` y `playing` se dispararon y `currentTime` avanzó (1,25 s a los 1,2 s); el inicio automático se retrasó hasta renderizar por lo explicado en §1.

---

## 4. Receta 3 · Carrusel de cortes (y galería del Filete Mignon)

**Referencia.** ORBE en móvil (`orbe-movil.jpg`): flecha, píldora con puntos, flecha, en una sola fila compacta bajo el carrusel, con el siguiente elemento asomando por el borde.

### 4.1 Hook [PROBADO su lógica en la página de prueba]

```tsx
function useCarrusel(pista: RefObject<HTMLDivElement>) {
  const [activo, setActivo] = useState(0);
  const [inicio, setInicio] = useState(true);
  const [fin, setFin] = useState(false);

  const paso = () => {
    const s = pista.current?.children;
    return s && s.length > 1 ? (s[1] as HTMLElement).offsetLeft - (s[0] as HTMLElement).offsetLeft : 0;
  };
  const medir = useCallback(() => {
    const p = pista.current; if (!p) return;
    const max = p.scrollWidth - p.clientWidth;
    const alFinal = p.scrollLeft >= max - 2;
    setInicio(p.scrollLeft <= 2);
    setFin(alFinal);
    setActivo(alFinal ? p.children.length - 1 : Math.round(p.scrollLeft / (paso() || 1)));
  }, [pista]);

  useEffect(() => {
    const p = pista.current; if (!p) return;
    let raf = 0;
    const alScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; medir(); }); };
    p.addEventListener('scroll', alScroll, { passive: true });
    const ro = new ResizeObserver(medir); ro.observe(p);   // ← imprescindible, ver 4.4
    medir();
    return () => { p.removeEventListener('scroll', alScroll); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [medir, pista]);

  const suave = (): ScrollBehavior => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const mover = (dir: 1 | -1) => pista.current?.scrollBy({ left: dir * paso(), behavior: suave() });
  const ir = (i: number) => {
    const s = pista.current?.children; if (!s) return;
    pista.current!.scrollTo({ left: (s[i] as HTMLElement).offsetLeft - (s[0] as HTMLElement).offsetLeft, behavior: suave() });
  };
  return { activo, inicio, fin, mover, ir };
}
```

### 4.2 Marcado y clases

```tsx
<section aria-roledescription="carousel" aria-label="Cortes destacados" className="py-10">
  <div ref={pista} id="pista" tabIndex={0} role="group" aria-label="Lista de cortes. Desliza o usa las flechas."
       onKeyDown={teclas}
       className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2
                  [scrollbar-width:none] [&::-webkit-scrollbar]:hidden motion-safe:scroll-smooth lg:scroll-px-8 lg:gap-6 lg:px-8">
    {cortes.map((c, i) => (
      <div key={c.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} de ${cortes.length}`}
           className="w-[72%] shrink-0 snap-start snap-always sm:w-[44%] lg:w-[calc((100%-3*1.5rem)/4)]">
        <Tarjeta {...c} />   {/* la misma Tarjeta de producto del resto del sitio */}
      </div>
    ))}
  </div>

  {/* controles móviles: flecha · píldora de puntos · flecha */}
  <div className="mt-4 flex items-center justify-center gap-3 lg:hidden">
    <button type="button" aria-controls="pista" aria-label="Cortes anteriores" aria-disabled={inicio} onClick={() => !inicio && mover(-1)}
            className="size-11 rounded-full bg-surface-2 transition-transform duration-150 ease-out active:scale-[0.97] aria-disabled:opacity-40">
      <ChevronLeft aria-hidden strokeWidth={1.8} className="mx-auto" />
    </button>
    <div role="group" aria-label="Elegir corte" className="flex h-11 items-center rounded-full bg-surface-2 px-2">
      {cortes.map((c, i) => (
        <button key={c.id} type="button" aria-label={`Ir al corte ${i + 1}: ${c.nombre}`}
                aria-current={i === activo} aria-disabled={i === activo} onClick={() => ir(i)}
                className="group grid h-11 w-6 place-items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-text/35 transition-[width,background-color] duration-200 ease-out group-aria-[current=true]:w-6 group-aria-[current=true]:bg-text" />
        </button>
      ))}
    </div>
    <button type="button" aria-controls="pista" aria-label="Cortes siguientes" aria-disabled={fin} onClick={() => !fin && mover(1)} …>…</button>
  </div>
  <p role="status" className="sr-only">{`Corte ${activo + 1} de ${cortes.length}`}</p>
</section>
```

Variante **galería del Filete Mignon** (3 fotos en `PRODUCTO_DESTACADO`: principal, detalle y tercera): mismas clases con `w-[88%] lg:w-[calc((100%-1.5rem)/2)]` por diapositiva.

### 4.3 Teclado, deslizar y movimiento

```tsx
const teclas = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); mover(-1); }
  if (e.key === 'Home') { e.preventDefault(); ir(0); }
  if (e.key === 'End')  { e.preventDefault(); ir(cortes.length - 1); }
};
```

| Aspecto | Comportamiento |
|---|---|
| Deslizar | Nativo. `snap-mandatory` asienta en la tarjeta más cercana; `snap-always` (`scroll-snap-stop: always`, Chrome 75, Firefox 103, Safari 15) evita saltarse varias con un golpe fuerte. `overscroll-x-contain` evita que el gesto dispare "atrás" del navegador en el borde. |
| Teclado | La pista es enfocable (`tabIndex=0`, imprescindible para regiones desplazables) y tiene sus propias flechas/Home/End: no dependo de que cada navegador salte de punto de anclaje con las flechas. Los botones responden a Enter y Espacio de forma nativa. |
| Botones al límite | `aria-disabled`, **no** `disabled`: un botón que se deshabilita con el foco encima lo pierde. |
| Anuncio | `role="status"` con "Corte 3 de 8" tras asentarse. Es un criterio propio: el patrón APG sugiere `aria-live="polite"` en la pista, pero con scroll continuo anunciaría contenido a cada fotograma. |
| Diapositivas | APG: `aria-roledescription="carousel"`/`"slide"`, nombre por posición. Punto actual con `aria-current` **y** `aria-disabled` (APG pide `aria-disabled` en el actual). No hay rotación automática, así que no se necesita botón de pausa. |
| Movimiento reducido | `motion-safe:scroll-smooth` y `behavior: 'auto'` en JS. |
| Objetivos táctiles | Puntos de 24 × 44 px (WCAG 2.2, 2.5.8: mínimo 24 px). Un punto de 20 px de ancho **incumple** la separación mínima; el de la prueba original tenía 20 px y lo corregí a `w-6`. |
| Imágenes | `loading="lazy"` desde la 3.ª tarjeta, `width`/`height` explícitos, `decoding="async"`. |

### 4.4 Hallazgo de la prueba

Si `medir()` solo corre al hacer `scroll` o al cambiar el tamaño de la **ventana**, el carrusel puede quedar con las dos flechas deshabilitadas y "8 de 8" al cargar (se midió con el CSS aún sin aplicar: `scrollWidth == clientWidth`). El `ResizeObserver` sobre la pista lo corrige [PROBADO: tras el arreglo, "Corte 1 de 8" y "anterior" deshabilitado].

### 4.5 Lo que no se usa

`::scroll-button()`, `::scroll-marker` y `scroll-marker-group` (carruseles solo con CSS): salieron en Chrome 135 y **no existen** en Firefox ni Safari (MDN/BCD; developer.chrome.com). Pueden añadirse después como mejora progresiva; no como base.

---

## 5. Receta 4 · Asistente que no es un chat común

**Referencias.** ChatGPT (`chatgpt-asistente.jpg`, resumen de refero): superficie plana, un solo borde hairline, jerarquía por peso. ORBE: controles compactos. La mascota da la personalidad; no hace falta decorar más.

### 5.1 Piezas

| Pieza | Especificación |
|---|---|
| Lanzador | Botón circular de **64 px** (`size-16`), fondo `sand`, `ring-1 ring-black/20`, con `carnicero-ingresar-busto@2x.webp` recortado en círculo: `<img class="absolute left-1/2 top-1.5 w-[70px] max-w-none -translate-x-1/2">`. El recorte se vio bien en la prueba (cara y gorro completos). Posición: `fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-30 lg:bottom-6 lg:right-6`. Presión: `active:scale-[0.97]`. |
| Sugerencia | Globo `bg-text text-bg` con "¿Te ayudo a elegir tu corte?", cola abajo a la derecha, `rounded-2xl rounded-br-md`, X de 44 px. Entra con `transition duration-200 ease-out-strong starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none`. |
| Panel | `<dialog>` modal (receta 7). Móvil: hoja inferior `h-[min(80dvh,640px)] w-full rounded-t-3xl`. Escritorio: flotante `lg:bottom-24 lg:right-6 lg:h-[560px] lg:w-[380px] lg:rounded-3xl`, origen abajo a la derecha. [PROBADO ambos] |
| Cabecera | Mascota de 40 px en círculo (`w-11 top-1`), título "Asistente de la carnicería", subtítulo "Respuestas guiadas · no es una persona", X de 44 px. |
| Conversación | `role="log" aria-live="polite" aria-relevant="additions"`. La respuesta llega tras 450 ms (0 con movimiento reducido). |
| Chips | Botones de 44 px: "Para asar", "Para guisar", "¿Cuánto por persona?", "Horario". Tras cada respuesta, chips de seguimiento. |
| Salida segura | Botón fijo "Hablar por WhatsApp" (`WHATSAPP_HREF` de `datos.ts`, con `?text=` prellenado, sin datos personales). |
| Campo de texto | **No hay.** Un campo que no responde es un chat falso. Texto fijo bajo los chips: "Escribir tu propia pregunta llegará pronto. Mientras tanto, escríbenos por WhatsApp." |

### 5.2 Reglas de la sugerencia

Aparece a los 6 s; solo una vez por sesión (`sessionStorage` dentro de `try/catch`, porque puede lanzar en modo privado); se oculta sola a los 10 s o al pulsar X o el lanzador; nunca si hay un `dialog[open]`; sin `aria-live` (duplica la etiqueta del botón). En la prueba se usó 1,5 s para verla; en producción 6 s.

```tsx
const CLAVE = 'carni:asistente:sugerencia';
const yaVista = () => { try { return sessionStorage.getItem(CLAVE) === '1'; } catch { return false; } };
const marcarVista = () => { try { sessionStorage.setItem(CLAVE, '1'); } catch { /* modo privado */ } };
```

### 5.3 Guion y adaptador (sin backend)

```ts
export type IntentId = 'asar' | 'guisar' | 'porciones' | 'horario';
export interface Respuesta { texto: string; acciones?: { etiqueta: string; href: string }[]; siguientes?: IntentId[] }
export interface Asistente { responder(intent: IntentId): Promise<Respuesta> }

export const asistenteGuionado: Asistente = { responder: async (id) => GUION[id] };
// Cuando exista backend: asistenteRemoto con la MISMA firma; el resto del código no cambia.
```

| Intención | Respuesta (fuente en el repo) |
|---|---|
| `asar` | "Para asar suelen elegirse los cortes especiales (rib eye, tomahawk, arrachera) y las carnes rojas. Lo que hay hoy lo ves en el catálogo." Acciones: `rutaCategoria('cortes-especiales')`, `rutaCategoria('carnes-rojas')`. Fuente: `CATEGORIAS_BENTO[].descripcion` en `datos.ts`. |
| `guisar` | "Para guisar mira las carnes rojas: bistec, diezmillo, molida y para caldo. Revisa en el catálogo lo disponible hoy." Acción: `rutaCategoria('carnes-rojas')`. |
| `porciones` | Texto con cifras de gramos **pendiente de aprobación** (ver §10), más "Para 4 a 10 personas hay paquetes en Ofertas" (`CATEGORIAS_BENTO`) y acción `rutaCategoria('ofertas')`. |
| `horario` | "Lunes a sábado de 8:00 a 17:00. Domingos y festivos, cerrado." Fuente: `DATOS_RAPIDOS` y `Horario.tsx`. |
| Cualquier otra cosa | No existe entrada libre; el único camino es WhatsApp. |

**Lo que el asistente nunca dice:** precio, existencias, "hay / no hay", tiempo de entrega, promociones, ni cifras que no estén en el repo o aprobadas por Eduardo. `datos.ts` avisa que casi todo lo que contiene es "contenido de DISEÑO, no datos reales del catálogo", y `PRODUCTO_DESTACADO` trae "$689" y "20 en stock" escritos a mano. **El guion no debe leer nunca esos campos.** Se redacta con "suelen elegirse" y se envía al catálogo vivo para lo disponible.

Implementación: los textos se pintan como nodos de React (sin `innerHTML`); en la prueba usé `insertAdjacentHTML` con cadenas fijas solo por rapidez.

**Honestidad del rótulo.** Se llama "Asistente… Respuestas guiadas · no es una persona", no "IA": sin backend son respuestas guionadas. Cambiar el rótulo cuando exista el backend.

### 5.4 Accesibilidad [PROBADO]

Al abrir, el foco cae en el `<h2 tabIndex={-1}>` (es el primero enfocable en el DOM), sin abrir el teclado del teléfono ni saltar al primer chip. Lanzador: `aria-haspopup="dialog"` y `aria-label="Abrir el asistente de la carnicería"`.

### 5.5 Activos

`docs/design/assets/mascota/carnicero-ingresar-busto.webp` (10 KB) y `@2x` (20 KB), transparentes. Hay que copiarlos a `public/img/mascota/` y referenciarlos con `assetUrl()`. La otra pose (`registro`) tiene los brazos abiertos y queda para el estado "escribiendo" o el saludo.

---

## 6. Receta 5 · Íconos

### 6.1 Lo que el repo usa hoy

`src/ui/iconos.tsx` tiene **14 íconos propios** (menú, buscar, carrito, flecha, chevron, ubicación, reloj, teléfono, correo, Facebook, Instagram, WhatsApp, pausa/play, burbuja del asistente) y `Estrella`. Todos en cuadrícula 24, trazo 1,8, `round`/`round`, `currentColor`, copiados de los SVG aprobados en Claude Design. **`package.json` no tiene ninguna librería de íconos.**

### 6.2 Comparación (datos verificados en los paquetes, 2026-09)

| Set | Licencia | Paquete npm | Tree-shaking | Cantidad | Carne / carnicería | Chat |
|---|---|---|---|---|---|---|
| **Lucide** | ISC | `lucide-react` 1.49.0 | `sideEffects: false`, un `.mjs` por ícono (`dist/esm/icons/beef.mjs`) | ≈2.100 SVG | `beef`, `drumstick`, `ham`, `bone`, `fish`, `egg`, `chef-hat`, `cooking-pot`, `hand-platter`, `flame`, `store`. **No** hay cleaver, vaca, chorizo, cerdo ni parrilla. Sin marcas (Facebook/Instagram/WhatsApp). | `message-circle`, `message-circle-heart`, `bot-message-square` |
| Tabler | MIT | `@tabler/icons-react` 3.48.0 | Sí, pero el barril hace que **Vite en desarrollo** genere miles de módulos/chunks (issues tabler-icons #1233, vite #19017); pide importaciones profundas | 5.166 outline | `meat`, `sausage`, `pig`, `grill`, `grill-fork`, `grill-spatula`, `bone`, `chef-hat`, `fish`. Sin cleaver ni vaca. Con marcas. | `message-circle`, `message-circle-heart`, `robot` |
| Phosphor | MIT | `@phosphor-icons/react` | Sí; desaconseja importar todo con comodín | 1.512 × 6 pesos | `cow`, `knife`, `chef-hat`, `cooking-pot`, `fork-knife`, `hamburger`. Sin carne ni cleaver. | `chat-circle`, `chat-circle-dots`, `robot` |
| Iconoir | MIT | `iconoir-react` | Sí | 1.383 regular | `bbq`, `cutlery`, `fish`. Sin carne ni chef. | `chat-bubble`, `message` |
| Heroicons | MIT | `@heroicons/react` | Sí (importar de la ruta ESM) | 324 outline | Nada de comida. | `chat-bubble-left-right` y otros |
| game-icons.net | **CC BY 3.0** (atribución obligatoria) | `@iconify-json/game-icons` o `react-icons/gi` | Según el envoltorio | 4.133 | `meat-cleaver`, `cleaver`, `steak`, `meat`, `chef-toque`, `cow`, `meat-hook`, `sausage`, `ham-shank`, `bacon`, `bull` | `chat-bubble`, `talk` |

game-icons.net tiene justo el cleaver y el bistec, pero son rellenos, detallados y en cuadrícula 512: chocan con el trazo de 1,8 del resto, y exigen mostrar el crédito del autor en la web. **No recomendado.**

### 6.3 Recomendación: **Lucide**, y los 14 propios se quedan

Motivos: (1) ISC, sin obligación de mostrar atribución en la interfaz; (2) un módulo por ícono y `sideEffects: false`, con lo que el tree-shaking es predecible y no repite el problema de chunks de Tabler en Vite; (3) mismo lenguaje que los 14 propios (cuadrícula 24, terminaciones redondas) y `strokeWidth={1.8}` los iguala exactamente; (4) cubre las cuatro categorías de carne con íconos reales (`beef`, `drumstick`, `ham`, `fish`) y los de interfaz que faltan.
Compromiso: Tabler tendría `sausage`, `pig`, `grill` y las marcas, pero cuesta el problema de Vite; Phosphor aporta `cow` y `knife`, pero su trazo base es más fino y los seis pesos no se usarían. Mezclar dos sets queda descartado.

Instalación: `npm install lucide-react` **dentro de Docker o `.devcontainer/`**, no en el host (regla del repo). No la ejecuté.

```tsx
// src/ui/iconosLucide.tsx: un solo punto de entrada, mismo trazo que iconos.tsx
import { Beef, Drumstick, Ham, Fish, HandPlatter, Flame, X, ChevronLeft, ChevronRight, type LucideProps } from 'lucide-react';

const base: LucideProps = { strokeWidth: 1.8, 'aria-hidden': true, focusable: false };
export const IconoRes = (p: LucideProps) => <Beef {...base} {...p} />;
export const IconoPollo = (p: LucideProps) => <Drumstick {...base} {...p} />;
export const IconoCerdo = (p: LucideProps) => <Ham {...base} {...p} />;
export const IconoCerrar = (p: LucideProps) => <X {...base} {...p} />;
```

Si el servidor de desarrollo se vuelve lento con el barril de `lucide-react`, cambiar a importaciones profundas (`lucide-react/dist/esm/icons/beef`): el paquete no declara `exports`, así que la ruta existe.

Categorías (slugs de `datos.ts`) → ícono:

| Categoría | Ícono |
|---|---|
| carnes-rojas | `Beef` |
| cortes-especiales | **`IconoCuchilla`** (propio, abajo) |
| pollo | `Drumstick` |
| cerdo | `Ham` |
| preparadas | `HandPlatter` |
| embutidos | **sin ícono en Lucide**; hay que dibujar uno (cápsula a 45° con dos atados) o no llevar ícono. No entrego un trazo que no probé. |
| ofertas, merch, otros | `Package`, `Shirt`, `Tag` (verificados en el set) |

### 6.4 Dos SVG propios [PROBADOS visualmente a 24, 48 y 120 px]

Mismo formato que `iconos.tsx` (24×24, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.8}`, `strokeLinecap="round"`, `strokeLinejoin="round"`).

**`IconoCuchilla`** — cleaver diagonal. Se lee bien desde 24 px.
```tsx
<svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
  <g transform="rotate(-38 12 12)">
    <path d="M8 5.5h10.5a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H8Z" transform="translate(-1 1)" />
    <path d="M6.6 8.2H2.6a1.2 1.2 0 0 0-1.2 1.2v.2a1.2 1.2 0 0 0 1.2 1.2h4" />
    <path d="M17.5 9h.01" />
  </g>
</svg>
```

**`IconoAsistenteCarnicero`** — burbuja redonda con cleaver dentro. Solo desde **32 px** (a 24 px se empasta). Se usa como respaldo si la imagen de la mascota no carga y como marca de los mensajes del asistente. La burbuja es la del `IconoAsistente` actual, ensanchada; el cleaver es el anterior a escala 0,56 con trazo compensado (3,2 dentro del grupo = 1,8 visual).
```tsx
<svg width={size} height={size} viewBox="0 0 24 24" className={className} {...trazo}>
  <path d="M21 11.5a8.5 8.5 0 1 0-3.4 6.8L21 20l-1-3.4A8.5 8.5 0 0 0 21 11.5Z" />
  <g transform="translate(12.2 11.6) rotate(-38) scale(.56) translate(-10.2 -12.25)" strokeWidth={3.2}>
    <path d="M8 5.5h10.5a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H8Z" transform="translate(-1 1)" />
    <path d="M6.6 8.2H2.6a1.2 1.2 0 0 0-1.2 1.2v.2a1.2 1.2 0 0 0 1.2 1.2h4" />
  </g>
</svg>
```

Probé además una hoja-burbuja con el mango como cola y otra con toque de chef dentro: la primera se leía como un letrero y la segunda no se distinguía. Descartadas. El lanzador principal es la **mascota**, no este glifo (§5).

---

## 7. Receta 6 · Lista "moderno, no Canva" y micro-interacciones

### 7.1 Doce reglas (de las capturas leídas, de Hallmark y de Emil)

**Hacer**
1. **Un solo acento** (`#DC2626`) para la acción principal y el precio; el resto es tinta, papel y arena. Freitag: la única gama cromática es el producto; Apple: un solo CTA azul en píldora.
2. **El producto es la decoración.** Fotografía a sangre, sin marcos, sin pegatinas, sin sombra en tarjetas. Louis Vuitton (`louisvuitton-tarjetas.jpg`): rejilla plana, imagen y etiqueta centrada debajo, nada más.
3. **Jerarquía con tamaño, peso y espacio**, no con cajas. Bordes hairline de 1 px (`border-border`) en lugar de sombras: ChatGPT describe una única línea hairline como toda su elevación.
4. **Dos familias, romanas**: Fraunces para títulos y Geist para lo demás; pocos tamaños grandes (hero 68/72, secciones 26–40). Sin cursivas en títulos (Hallmark).
5. **Controles compactos y agrupados**: flecha + puntos + flecha en una píldora (ORBE); botones en píldora de 44–52 px.
6. **Encabezado mínimo**: menú, marca, dos íconos (Louis Vuitton), transparente sobre el video y vidrio al bajar.
7. **Estructura variada**: bento y ritmos asimétricos; no repetir "tres tarjetas iguales" (Hallmark, diversidad estructural; `direcciones.md`).
8. **Movimiento solo para explicar un cambio de estado**: `transform` y `opacity`, ≤300 ms, `cubic-bezier(0.23,1,0.32,1)`, con `prefers-reduced-motion` siempre resuelto.
9. **Contenido real**: nada de métricas, existencias ni precios inventados; nada de marcos de navegador falsos (Hallmark).

**Evitar**
10. **Adornos genéricos**: pegatinas, emojis como íconos, estallidos de "oferta", manchas de degradado, brillos, texto con degradado. Los recortes con contorno de Apple (`apple-portada.jpg`) son dirección de arte con el propio producto, escasos; no se copian como recurso.
11. **Redondear todo y apilar sombras**: escala de radios 28 (hero y paneles), 16 (tarjetas), píldora solo en botones; sin tarjeta dentro de tarjeta.
12. **Texto sobre imagen sin velo** o con contraste menor a 4,5:1, y todo centrado por defecto.

### 7.2 Cinco micro-interacciones que valen la pena

| # | Micro-interacción | Valores |
|---|---|---|
| 1 | **Presión**: botones y tarjetas se hunden al pulsar | `active:scale-[0.97]`, `transition-transform duration-150 ease-out` (Emil). Solo con hover real para el resto de efectos: `hover:` de Tailwind v4 ya lo garantiza. |
| 2 | **Encabezado que se materializa** | 200 ms, `ease-out`, fondo + desenfoque (§2). [PROBADO] |
| 3 | **Carrusel**: snap, punto que se alarga y botón que se hunde | punto 6 → 24 px en 200 ms `ease-out`; desplazamiento suave nativo, `auto` con movimiento reducido. [PROBADO] |
| 4 | **Agregar al pedido**: el ícono del carrito hace "pop" y el botón dice "Agregado" | badge `scale 1 → 1.15 → 1` en 220 ms; etiqueta "Agregado" 1,2 s y vuelve. Sin toast. [NO PROBADO] |
| 5 | **Asistente**: sugerencia que sube y aparece, hoja que sale del borde | sugerencia `translate-y-2` + opacidad en 200 ms (`starting:`); hoja móvil 300 ms con `--ease-drawer`; en escritorio escala 0,95 → 1 con origen abajo a la derecha; chips con 40 ms de escalonado. Los modales centrados **no** cambian de origen. [PROBADO la hoja y la sugerencia] |

---

## 8. Receta 7 · Estándar de cierre para todo lo que se superpone

**Regla.** Carrito, menú móvil, menú lateral del panel, modales y panel del asistente cumplen **las siete**: X visible, Escape, clic en el fondo, fondo inerte (trampa de foco), foco de vuelta, bloqueo de scroll, título accesible.

**Cómo.** Con un `<dialog>` nativo abierto con `showModal()`. Es el camino más corto porque el navegador ya hace lo difícil:
- Fondo inerte y el `::backdrop` (MDN).
- Escape cierra (MDN).
- Al cerrar, restaura el foco al elemento previo (algoritmo "close the dialog" del estándar HTML) — [PROBADO: tras Escape y tras clic en el fondo, `document.activeElement` era el botón que lo abrió].
- Capa superior: queda por encima de cualquier `z-index`, lo que elimina el error que describe `CartPanel.tsx` (el encabezado tapando el título y la X de su propio cajón).
- `<dialog>` es Baseline desde marzo de 2022.

### 8.1 Componente

```tsx
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconoCerrar } from './iconosLucide';

const LADOS = {
  derecha:   'm-0 ml-auto h-dvh max-h-none w-[min(92vw,420px)] max-w-none translate-x-full bg-surface-1 p-0 text-text opacity-0 open:translate-x-0 open:opacity-100 starting:open:translate-x-full starting:open:opacity-0',
  izquierda: 'm-0 mr-auto h-dvh max-h-none w-[min(86vw,360px)] max-w-none -translate-x-full bg-surface-1 p-0 text-text opacity-0 open:translate-x-0 open:opacity-100 starting:open:-translate-x-full starting:open:opacity-0',
  hoja:      'm-0 mt-auto h-[min(80dvh,640px)] max-h-none w-full max-w-none translate-y-full rounded-t-3xl bg-surface-1 p-0 text-text opacity-0 open:translate-y-0 open:opacity-100 starting:open:translate-y-full starting:open:opacity-0 lg:fixed lg:inset-auto lg:bottom-24 lg:right-6 lg:mt-0 lg:h-[560px] lg:w-[380px] lg:origin-bottom-right lg:translate-y-3 lg:scale-95 lg:rounded-3xl open:lg:translate-y-0 open:lg:scale-100 starting:open:lg:translate-y-3 starting:open:lg:scale-95',
} as const;

const COMUN =
  'transition-[translate,scale,opacity,display,overlay] transition-discrete duration-300 ease-drawer motion-reduce:duration-150 ' +
  'backdrop:bg-black/60 backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0 ' +
  'backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-300';

interface Props { abierta: boolean; alCerrar: () => void; titulo: string; lado?: keyof typeof LADOS; pie?: ReactNode; children: ReactNode }

export function Superposicion({ abierta, alCerrar, titulo, lado = 'derecha', pie, children }: Props): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const presionado = useRef<EventTarget | null>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();   // el guardia evita el error en StrictMode
    if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={alCerrar}                                   // Escape, X, clic en el fondo: todo termina aquí
      onPointerDown={(e) => { presionado.current = e.target; }}
      onClick={(e) => {                                    // el clic en el ::backdrop apunta al propio <dialog>
        if (e.target === e.currentTarget && presionado.current === e.currentTarget) e.currentTarget.close();
      }}
      className={`${LADOS[lado]} ${COMUN}`}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          <h2 id={idTitulo} tabIndex={-1} className="m-0 font-display text-lg font-medium">{titulo}</h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label={`Cerrar ${titulo.toLowerCase()}`}
                  className="flex size-11 items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.97]">
            <IconoCerrar />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {pie}
      </div>
    </dialog>
  );
}
```

[PROBADO] las clases de `derecha`, `izquierda` y `hoja`: el `<dialog>` abre, anima y cierra. El componente en sí (React) no se ejecutó; su lógica es la de la página de prueba.
[NO PROBADO] el lado `centro` para modales centrados: `m-auto w-[min(92vw,520px)] max-h-[85dvh] rounded-3xl scale-95 opacity-0 open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0`, misma técnica de transición, con `transform-origin` en el centro.

### 8.2 Por qué cada línea

| Línea | Razón |
|---|---|
| `showModal()` y no `show()`/`open` | Solo `showModal()` deja el fondo inerte, activa Escape y pone el `::backdrop`. |
| `onClose` en vez de `onCancel` | `close` se dispara con cualquiera de las tres vías, así el estado de React nunca se desincroniza. |
| `presionado` | Si alguien selecciona texto dentro y suelta fuera, `click` cae en el `<dialog>`; sin comprobar dónde empezó, se cerraría por accidente. |
| `<h2 tabIndex={-1}>` primero en el DOM | Recibe el foco inicial (el APG lo recomienda para contenido largo). [PROBADO: `activeElement` fue el título.] |
| `transition-[…,display,overlay] transition-discrete` + `starting:` | Permite animar también la salida. Chrome 117, Firefox 129, Safari 17.4–17.5 (BCD). |
| Fondo negro plano en `backdrop:` | Sin `backdrop-filter` en el fondo: solo el encabezado paga ese costo. |
| `html:has(dialog:modal){overflow:hidden}` | Bloquea el scroll. [PROBADO: `hidden` abierto, `visible` cerrado.] Considerar `scrollbar-gutter: stable` en `html` para evitar el salto de 15 px en escritorio [NO PROBADO]. |
| Sin `closedby="any"` | El atributo existe en Chrome 134 y Firefox 141, y en Safari solo en preview (BCD). El clic en el fondo se resuelve por JavaScript en todos. |

### 8.3 Sobre "trampa de foco"

Dentro de un modal nativo el foco no se sale al documento de atrás (el fondo es inerte). En el navegador integrado de la prueba, 4 Tab ciclaron X → enlace → WhatsApp → X. En navegadores de escritorio el foco puede pasar por la interfaz del navegador antes de volver, comportamiento que el APG acepta. Si Eduardo quiere un ciclado literal, añadir el manejador de Tab de 25 líneas que ya existe en `Lupa.tsx` (líneas ~275–305).

### 8.4 Cómo aplica a cada superposición

| Superposición | Lado | Disparador |
|---|---|---|
| Carrito (pedido) | `derecha` | `aria-haspopup="dialog"`, `aria-label` con la cuenta de artículos |
| Menú hamburguesa móvil | `izquierda` | botón `#menuToggle` (hoy "cableado y a la espera") |
| Menú lateral del panel (AdminNav) | `<aside>` fijo desde `lg`; por debajo de `lg`, `izquierda` | `aria-expanded` + `aria-controls`; misma X. Es la falla que motivó esta regla. |
| Modales (confirmar, ficha rápida) | `centro` | el botón que los abre |
| Panel del asistente | `hoja` | el lanzador |

### 8.5 Lista de aceptación (por superposición)

1. La X se ve sin pasar el cursor, mide ≥44 px y tiene un `aria-label` propio ("Cerrar el pedido"), no "Cerrar".
2. Escape cierra y el foco vuelve al botón que la abrió.
3. Clic en el fondo cierra; un clic dentro no.
4. Con el teclado no se alcanza nada del fondo; Shift+Tab desde el primero va al último o a la interfaz del navegador.
5. El scroll de la página queda bloqueado y se libera al cerrar.
6. Con `prefers-reduced-motion` la animación pasa a ≤150 ms sin desplazamiento.
7. Lector de pantalla: anuncia el título (`aria-labelledby`).

---

## 9. Choques con el código actual

| Archivo | Hallazgo |
|---|---|
| `src/components/CartPanel/CartPanel.tsx` (~líneas 48–56) | Está declarado **"deliberately not a dialog"**: sin fondo, sin trampa de foco, para poder seguir navegando el catálogo con el cajón abierto. Tiene Escape, X y foco inicial en la X; **le faltan** fondo, trampa y devolución de foco. Contradice la regla 8; ver pregunta 1. |
| `src/components/Lupa/Lupa.tsx` (~265–330) | Sí tiene `role="dialog"`, `aria-modal`, Escape, ciclado de Tab y devolución del foco. No revisé si tiene X visible ni fondo. Es la única implementación previa que cumple casi todo; conviene migrarla al mismo `Superposicion`. |
| `src/ui/Encabezado.tsx` | Hoy `relative` con fondo sólido (`bg-bg` / `bg-surface-1`) y un `scroll` + `rAF` con umbral de 8 px. Pasa a `fixed` con las clases de §2. El botón `#menuToggle` no abre nada todavía. |
| `src/landing/Portada.tsx` | Tarjeta de 320 / 640 px con video `webm+mp4` de 1,3–1,6 MB para todos. La receta lo cambia a hero a sangre en escritorio, MP4 de 405 KB en móvil y arranque diferido. Conserva el botón de pausa. |
| `src/landing/datos.ts` | Horario duplicado: está en `DATOS_RAPIDOS` y en el JSX de `Horario.tsx`. Extraer una constante `HORARIO` para que la web y el asistente lean lo mismo. |
| `src/styles/tailwind.css` | Alcance de la hoja: solo `landing.html`. Las variantes `glass` y `reduced-transparency` y el `html:has(dialog:modal)` deben quedar donde las carguen también el catálogo, el acceso y el panel, o repetirse allí. |

---

## 10. Riesgos y preguntas para Eduardo

### Riesgos

1. **Desenfoque sobre video en gama baja.** Está probado que las clases funcionan, no que fluyan en un Android modesto ni en un iPhone. Medir en dispositivo real; si falla, bajar a `backdrop-blur-md` o a fondo sólido en móvil.
2. **Autoplay en iOS.** Con ahorro de batería puede bloquearse; el `catch` deja el póster y un botón de reproducir, pero no lo verifiqué en un iPhone.
3. **`saveData` solo en Chromium**, y `prefers-reduced-transparency` sin Safari. Son mejoras progresivas, no garantías.
4. **Datos de diseño disfrazados de datos.** `PRODUCTO_DESTACADO` ($689, "20 en stock") y las descripciones de categorías son texto de Claude Design. El asistente no debe leer los primeros y solo puede repetir las segundas si Eduardo las confirma.
5. **Dependencia nueva y activos nuevos.** `lucide-react` (dentro de Docker) y copiar la mascota a `public/img/mascota/`: son cambios estructurales menores para los que el repo pide aprobación humana.
6. **Cobertura de prueba.** Solo Chromium, con el Tailwind de navegador y sin tubería de Vite. Las variantes `reduced-transparency:`, `contrast-more:`, `not-supports-[...]` y el lado `centro` no se ejercitaron.
7. **Un carrusel mal medido se ve roto** (flechas deshabilitadas, contador equivocado) si se omite el `ResizeObserver`.

### Preguntas que solo Eduardo puede responder

1. **Carrito modal o no.** El cajón actual es no modal a propósito (el catálogo sigue clicable). El estándar nuevo pide fondo y trampa de foco. ¿Todo modal, también en escritorio? Mi recomendación: modal en todo, con velo ligero en escritorio.
2. **Gramos por persona.** El asistente necesita cifras. Propuesta de partida, que no es dato del repo: 200–250 g por persona en carne sin hueso y 300–350 g con hueso. ¿Las aprueba o da las de la carnicería?
3. **Descripciones de categoría.** ¿Son ciertas y estables ("Bistec, diezmillo, molida y para caldo"; "Rib eye, tomahawk, arrachera"; "Pechuga, pierna y muslo, alas")? El asistente las repetirá.
4. **Cómo se llama el asistente.** Propongo "Respuestas guiadas · no es una persona" mientras no haya backend, en vez de "IA". ¿De acuerdo?
5. **Hero a sangre.** Esta receta reemplaza la tarjeta redondeada actual por un hero de 85 vh a sangre en escritorio. ¿Es lo que quiere?

---

## 11. Fuentes

**Íconos**
- Lucide, licencia ISC: https://lucide.dev/license · paquete: https://www.npmjs.com/package/lucide-react · ejemplo `beef`: https://lucide.dev/icons/beef
- Tabler (MIT, 5.166 outline, 6.220 en total): https://tabler.io/icons · problema con Vite: https://github.com/tabler/tabler-icons/issues/1233 · https://github.com/vitejs/vite/issues/19017
- Phosphor (MIT, seis pesos): https://github.com/phosphor-icons/react · https://www.npmjs.com/package/@phosphor-icons/react
- Iconoir (MIT): https://github.com/iconoir-icons/iconoir · Heroicons (MIT): https://github.com/tailwindlabs/heroicons
- game-icons.net (CC BY 3.0, atribución obligatoria): https://game-icons.net/about.html · metadatos: https://cdn.jsdelivr.net/npm/@iconify-json/game-icons/info.json
- Listas de archivos de cada paquete (jsDelivr): https://data.jsdelivr.com/v1/packages/npm/lucide-static

**Plataforma web**
- `<dialog>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog · restauración de foco: https://html.spec.whatwg.org/multipage/interactive-elements.html#close-the-dialog
- Patrón de diálogo modal (APG): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ · carrusel (APG): https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
- Carruseles con CSS: https://developer.chrome.com/blog/carousels-with-css
- Variantes de Tailwind v4: https://tailwindcss.com/docs/hover-focus-and-other-states
- `prefers-reduced-transparency`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency · `saveData`: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData · `<source media>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/source
- Versiones por navegador: https://github.com/mdn/browser-compat-data
- Video en iOS: https://webkit.org/blog/6784/new-video-policies-for-ios/ · atributo `muted` en React: https://github.com/facebook/react/issues/10389
- WCAG 2.2, pausar contenido en movimiento: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html · tamaño de objetivo: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

**Referencias visuales:** `docs/design/referencias/capturas/` (`orbe-portada`, `orbe-movil`, `chatgpt-asistente`, `louisvuitton-tarjetas`, `freitag-catalogo`, `apple-portada`) y `docs/design/referencias/direcciones.md`.
**Skills consultadas:** `hallmark`, `emil-design-eng`, `apple-design` (§12, materiales y profundidad).
