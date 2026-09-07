# Mapa de corridas — qué herramienta va con cada tarea

Respuesta a: *"¿el prompt de afiliados resuelve también el rediseño, las prácticas y BuildAds?"*

**No.** Ese prompt ataca una sola tesis. El abogado del diablo funciona porque va a fondo contra *una* premisa; dale cinco y devuelve generalidades.

Y más importante: **para dos de esas cinco tareas el abogado del diablo es la herramienta equivocada.**

---

## La regla para elegir herramienta

| Si la tarea es… | La herramienta es… |
|---|---|
| una **decisión abierta** con riesgo de estar mal planteada | `abogado-del-diablo` |
| **cumplir un requisito literal** que alguien más va a verificar | checklist contra la consigna |
| una **decisión ya tomada** que solo falta ejecutar bien | la skill de ejecución + su puerta de calidad |

El abogado del diablo se paga cuando equivocarse cuesta caro y todavía se puede cambiar de opinión. Si ya no hay opinión que cambiar, es ruido.

---

## Las cinco tareas, clasificadas

### 1. Afiliados → **abogado del diablo** ✅

Decisión abierta, cero implementación, riesgo económico real (la recompensa sale del bolsillo del dueño) y superficie de fraude grande.

Prompt listo: `docs/prompts/abogado-del-diablo-afiliados.md`.

**Es la corrida que ya vas a hacer. Empieza por esta.**

---

### 2. Rediseño de la página → **abogado del diablo solo sobre el alcance**, luego skills de ejecución

La dirección visual ya está decidida en `docs/blueprints/web-redesign.md`: paleta bloqueada, bento conservado, SCSS 7-1, sin framework nuevo. No hay tesis de producto que romper.

Lo único discutible es el **alcance**, y eso sí merece una corrida corta:

> *"El rediseño puede cubrir las 7 páginas sin tocar el montaje de `src/entry/*.tsx` ni agregar rutas, solo con los SCSS existentes."*

Después de eso, la ejecución usa:

| Skill | Para qué |
|---|---|
| `hallmark` | 57 gates anti-slop; evita que quede con cara de plantilla de IA |
| `ui-ux-pro-max` | auditoría UX y redesign |
| `impeccable` | refuerzo de calidad de diseño |
| `playwright-cli` | capturas a 320 / 768 / 1024 como evidencia |
| `tododeia-animaciones` | **falta instalar** — es la de las micro-interacciones tipo los reels |

El Figma es insumo visual, no autoridad de stack. Igual que el prompt de STITCH que pedía Tailwind: se toma la dirección, se descarta el stack.

---

### 3. Práctica 1 de React → **checklist, no abogado del diablo** ❌

Está aprobada 100/100 y no se reentrega. El código de clases con dominio Carni ya existe en `practicas/react/practica-01/`.

Lo que quieres —"que quede como debió haber quedado, con funcionalidad real"— es un objetivo tuyo, no de EBAC. Se resuelve subiéndola tal cual para que el tutor de la P2 encuentre un cimiento coherente. Aquí no hay nada que objetar: hay un `git push` pendiente.

**Herramienta correcta**: la consigna del M27 como checklist. Ya está verificada y cumple.

---

### 4. Práctica 2 de React → **checklist, no abogado del diablo** ❌

Tampoco hay tesis. Hay una consigna literal (6.28.9) y tres huecos verificados leyendo tu código:

1. El `.map()` está inline en `InventoryApp.jsx`; la consigna pide un componente hijo que reciba el array por props
2. Falta el segundo componente de lista — hoy `flashOffers` es un `Set` renderizado inline
3. Hay un solo `styles.css` en la raíz; la consigna pide uno por carpeta de componente

Bonus fino: el `useEffect` está envuelto en `if (flashOffers.size > 0)`, así que no imprime cuando la lista se vacía. La consigna dice "cada vez que se actualice".

Sobre "funcionalidad real": **ya la tiene**. Usa los 14 productos reales del seed con sus `product_id` verdaderos, updates inmutables, persistencia en localStorage. No es un ejercicio vacío. Lo que falta son requisitos formales, no sustancia.

**Herramienta correcta**: la consigna como checklist + tú escribiendo el código. Son ~40 minutos y es justo el ejercicio que te preguntan en entrevista.

---

### 5. BuildAds y ProductAds → **abogado del diablo** ✅

Aquí sí, y con fuerza. Hay un agente proponiendo gastar dinero real en publicidad basándose en stock.

> *"Un agente puede proponer campañas publicitarias leyendo el stock real, sin publicar nada ni gastar un peso sin autorización humana explícita."*

Vectores a atacar: qué pasa si el stock está mal capturado y el agente promociona lo que no hay; qué pasa si alguien aprueba sin leer; cómo se revierte una campaña ya publicada en Meta; qué pasa si el ADN de Marca extrae identidad de un feed con contenido ajeno; y quién responde si la campaña incumple políticas de la plataforma.

**Corre esta después de afiliados**, no antes: comparten el patrón de "agente que actúa con consecuencia económica", y lo que aprendas en la primera te afina la segunda.

---

## Orden de corridas

```
1. Afiliados          ← ahora, es la prueba de la herramienta
2. BuildAds/ProductAds ← mismo patrón, más contexto
3. Alcance del rediseño ← corta, solo el alcance

(las prácticas no llevan corrida — llevan checklist)
```

---

## Sobre traer los videos y links a la sesión

Los links de referencia que pasaste caen en tres grupos, y cada uno se trata distinto:

**YouTube (SaleAds)** — se puede leer. Dos caminos:
- El transcript **ya está en tu repo**: `docs/brain/videos/transcripts/saleads-video__-a58SJXxrmk.txt`. Es lo más barato: Code lo abre y listo.
- Para videos nuevos, `markitdown` convierte URLs de YouTube a Markdown directamente.

**Facebook (los reels)** — no se puede y no se va a hacer. Están detrás de tu login, son video, y raspar tu cuenta de guardados no es algo que vaya a ejecutarse. Alternativas, en orden de utilidad:
1. **Nombra el efecto**: "cards que se levantan al hover", "scroll con parallax", "transición entre secciones", "cursor magnético". Con el nombre se mapea directo contra los tokens que ya tienes.
2. Capturas de los frames que te gustaron.
3. Instalar `tododeia-animaciones` y dejar que la skill traiga el catálogo de patrones.

**Figma** — requiere sesión. Si quieres que entre al diseño, expórtalo o pasa capturas.

### Herramientas de lectura web que ya tienes instaladas

| Skill | Para qué |
|---|---|
| `markitdown` | PDF, Word, Excel, imágenes, audio, HTML, **URLs de YouTube** → Markdown |
| `web-reader` | lectura de páginas |
| `deep-research` | investigación multi-fuente |
| `browser-harness` | control de navegador vía CDP |
| `playwright-cli` | automatización y capturas |

Marcadas sin conectar en `docs/tooling/triage.md`: Apify y ScrapeGraphAI. Las llaves de Apify que se filtraron fueron rotadas el 2026-08-25 y están muertas; ya no bloquean nada. La regla que sigue vigente es que ninguna llave se escriba en el repo: al conectar, la aporta el dueño por variable de entorno.

---

## Lo que no verifiqué

- El `SKILL.md` de `abogado-del-diablo` sigue sin leerse desde Cowork (fuera de las carpetas conectadas). Si su contrato pide otro formato de entrada, ese archivo manda sobre estos prompts.
- No probé `markitdown` contra ninguna URL.
- ~~No confirmé si la llave de Apify ya se rotó.~~ Confirmado: rotadas el 2026-08-25.
