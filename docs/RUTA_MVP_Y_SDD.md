# Ruta MVP y protocolo SDD — Carni-mvp

Fecha: 12 agosto 2026. Escrito tras leer el repo directamente, no de memoria ni de documentos previos.

**Qué es esto**: la respuesta ordenada a un pedido que juntaba ocho cosas a la vez (rediseño, prácticas de EBAC, BuildAds, afiliados, Figma, animaciones). No inventa un plan nuevo — muestra que casi todo ya tiene lugar en `docs/brain/roadmap.md`, y ordena lo que faltaba.

---

## 1. Dónde estamos hoy (verificado)

| Qué | Estado | Evidencia |
|---|---|---|
| `main` local vs `origin/main` | sincronizado | `git rev-list --left-right --count` → `0 0` |
| Regresión `5a752b3e` (bloqueo de Fase 1) | **resuelta** | `git merge-base --is-ancestor` → no está en `main` |
| Commit `217cacd1` (949 líneas, prácticas React) | **sin respaldo** | `git branch -r --contains 217cacd1` → vacío |
| `practicas/react/` en GitHub | **no existe** | `git ls-tree origin/main` no lo lista |
| `src/modules/buildads/` | scaffold presente | `BuildAdsOrchestrator.tsx` |
| Blueprint de rediseño | escrito, sin implementar | `docs/blueprints/web-redesign.md` |
| `docs/` completo | **sin commitear** | aparece como untracked en `git status` |

Dos cosas urgentes salen de aquí:

1. **`217cacd1` no está en ningún remoto.** Es el único trabajo sin respaldo.
2. **`docs/` entero está untracked.** Todo el brain, los blueprints y el triage viven solo en el disco. Si se pierde el disco, se pierde el pensamiento del proyecto.

La Fase 1 del roadmap está prácticamente cerrada: la regresión ya no está en main. Lo que queda de esa fase es rotar la llave de Apify y correr `/sdd-init`.

---

## 2. Dos carriles que no se cruzan

El error de la sesión pasada fue mezclar objetivos. Se separan así:

**Carril EBAC** — `practicas/react/`, rama `practicas-ebac`, CSS plano, dominio Carni.
Lo evalúa un tutor humano contra una consigna literal. Vive aparte del sitio.

**Carril producto** — `src/`, `css/`, rama `main`, SCSS 7-1.
Lo evalúa el negocio. Sigue el roadmap de 8 fases.

Comparten el dominio (productos reales del seed, paleta, nombres) pero **no comparten pipeline**. La razón es concreta: la consigna 6.28.9 exige un `styles.css` plano por carpeta de componente. El sitio corre SCSS 7-1. Meter SCSS en la práctica la reprueba.

La traducción correcta: la práctica usa `styles.css` planos **con los mismos hex** de `css/abstracts/_variables.scss` (`$carni-red #DC2626`, `$carni-gold #F59E0B`, superficies `#050505 / #111111 / #181818`). Cumple EBAC al pie de la letra y se ve como Carni.

Esto también confirma lo que ya decía el blueprint: `ebac-react.html` está **fuera del alcance del rediseño**, textual en `web-redesign.md`.

---

## 3. Protocolo: abogado del diablo → SDD → implementación

La skill `abogado-del-diablo` está instalada (`~/.claude/skills/abogado-del-diablo/SKILL.md`, registrada en `.atl/skill-registry.md`). Según `docs/tooling/triage.md` su función es: *"Devil's advocate review skill; challenges decisions before committing to them."*

**No pude leer su `SKILL.md` desde Cowork** — está fuera de las carpetas conectadas. El contrato interno lo lee Code, que sí la tiene. Lo que sigue es el protocolo de encadenado, no el contenido de la skill.

### El orden importa

El abogado del diablo va **antes** de la SDD, no después. Su trabajo es romper la idea mientras cambiarla todavía es barato. Una spec escrita sobre una premisa falsa produce código correcto que resuelve el problema equivocado.

### Paso a paso

**Paso 1 — Escribe la tesis en una frase.**
Una sola, afirmativa, falsable. No "mejorar el dashboard" sino "el dashboard debe mostrar un Kanban de 5 columnas en tiempo real porque el carnicero hoy pierde pedidos entre WhatsApp y papel".
Si no la puedes escribir en una frase, todavía no sabes qué quieres.

**Paso 2 — Invoca la skill contra esa tesis.**

```
Usa la skill abogado-del-diablo contra esta tesis:
"<tu tesis en una frase>"

Contexto: docs/brain/vision.md, docs/brain/roadmap.md fase N.
Restricciones duras: React 18 + Vite 7 + TypeScript + Express 5 + SCSS 7-1.
Sin Next.js, sin Tailwind, sin Storybook, sin rutas nuevas.

Quiero que ataques: la premisa, el alcance, la dependencia oculta
y el costo de mantenimiento. No propongas soluciones todavía.
```

**Paso 3 — Clasifica cada objeción en tres cubetas.**

- **Mata la idea** → no se hace. Se documenta por qué y se cierra.
- **Cambia el alcance** → se hace, pero más chico o en otro orden.
- **Ruido** → se descarta con una línea de justificación.

Esta clasificación la haces tú. La skill objeta; decidir es tuyo.

**Paso 4 — Reescribe la tesis con lo que sobrevivió.**
Casi siempre queda más chica y más clara. Esa es la señal de que funcionó.

**Paso 5 — Ahora sí, la SDD.**
Con la tesis endurecida, entra el stack de spec-driven que ya tienes instalado:

| Herramienta | Cuándo | Path |
|---|---|---|
| `openspec` | propuesta, spec y design doc | `~/.claude/skills/openspec/SKILL.md` |
| `spec-kit` | hacer la spec ejecutable | `~/.claude/skills/spec-kit/SKILL.md` |
| `archon` | ciclo plan→implement→validate en YAML | `~/.claude/skills/archon/SKILL.md` |
| `gentle-ai` | motor de workflow SDD canónico | `~/.config/opencode/skills/gentle-ai` |
| `work-unit-commits` | partir la implementación en commits revisables | `gentle-ai/.../work-unit-commits/SKILL.md` |
| `judgment-day` | revisión adversarial doble antes de mergear | `gentle-ai/.../judgment-day/SKILL.md` |

**Paso 6 — Cierra el ciclo.**
`judgment-day` antes del merge, `mem_save` en engram al cerrar el hito, y commit de `docs/` para que el razonamiento quede versionado.

### Regla de oro

El abogado del diablo se corre **una vez por fase**, sobre la tesis de esa fase. No sobre cada tarea — se vuelve ruido y dejas de escucharlo.

---

## 4. Tu lista, mapeada contra el roadmap que ya escribiste

Nada de lo que pediste necesita un plan nuevo. Todo cae en las 8 fases de `docs/brain/roadmap.md`:

| Lo que pediste | Fase | Estado |
|---|---|---|
| Rediseño de la página, más dinámico | **Fase 2** — Bento redesign, SCSS only | blueprint listo, sin implementar |
| Figma Dashboard Redesign | **Fase 2** | el Figma es insumo, no autoridad de stack |
| Animaciones estilo los reels | **Fase 2** | requiere skill que **no está instalada** |
| Carrito y checkout real | **Fase 3** | `useCart.ts` existe, sin cablear a UI |
| Paneles de dashboard admin | **Fase 4** — Kanban 5 columnas | pendiente |
| BuildAds / ProductAds / SaleAds | **Fase 5** — wizard de 6 pasos | scaffold `BuildAdsOrchestrator.tsx` |
| Programa de afiliados / fidelización | **Fase 6** — Track Score | pendiente, hay benchmark en `competitor-scan.md` |
| Bot de WhatsApp | **Fase 7** — n8n | pendiente |
| **Prácticas React 1 y 2** | **fuera del roadmap** | carril EBAC, paralelo |

El roadmap tiene dependencias duras. Fase 4 necesita la tabla `orders` de Fase 3. Fase 6 necesita que Fase 3 escriba pedidos. Saltarse el orden es rehacer trabajo.

### Skills que te faltan para lo que pediste

De `docs/tooling/triage.md`, marcadas **Missing**:

- `Hainrixz/tododeia-animaciones` — animaciones para bento/maximalism. **Es la que necesitas para el efecto de los reels.**
- `Hainrixz/construyeconia` — referencia para diseño de afiliados y fidelización (Fase 6).
- `Hainrixz/claude-ads` — generación de copy publicitario, núcleo de BuildAds (Fase 5).
- `jordanrendric/claude-video-vision` — análisis de video, si quieres procesar referencias en video.

Las tres primeras son las que desbloquean lo que pediste. Se instalan antes de su fase, no antes de todas.

---

## 5. Sobre los videos de referencia

Los reels de Facebook están detrás de tu login y son video: no se pueden leer ni raspar desde aquí, y raspar tu cuenta de guardados no es algo que se vaya a hacer.

Lo que sí funciona, en orden de utilidad:

1. **Nombra el efecto.** "Cards que se levantan al hover", "scroll con parallax", "transición entre secciones", "cursor magnético". Con el nombre se mapea directo contra los tokens que ya tienes.
2. **Capturas de los frames** que te gustaron.
3. **Instala `tododeia-animaciones`** y deja que la skill traiga el catálogo de patrones.

El transcript del video de SaleAds que mandaste **ya está en el repo**: `docs/brain/videos/transcripts/saleads-video__-a58SJXxrmk.txt`. Ese sí se puede leer entero cuando entremos a Fase 5.

---

## 6. Orden sugerido para las próximas dos semanas

**Ahora mismo (hoy)**
1. `git push -u origin practicas-ebac` — respaldo de las 949 líneas.
2. Commitear `docs/` — el brain no puede vivir untracked.

**Esta semana — cerrar EBAC**
3. Los 3 huecos de la Práctica 2: extraer la lista a su componente, agregar el segundo componente de lista, un `styles.css` por carpeta.
4. Texto de entrega con rutas verificadas contra el repo ya subido.

**Después — arrancar producto**
5. Rotar llave de Apify y correr `/sdd-init` (cierra Fase 1).
6. Instalar `tododeia-animaciones`.
7. Abogado del diablo sobre la tesis de Fase 2, luego SDD, luego implementación con validación por screenshots a 320/768/1024.

---

## 7. Lo que no verifiqué

Honestidad sobre los límites de este documento:

- **No leí `SKILL.md` de `abogado-del-diablo`.** Está fuera de las carpetas conectadas a Cowork. El paso a paso de arriba es protocolo de encadenado, no el contrato de la skill.
- **No leí el Figma.** El link requiere sesión.
- **No abrí los reels de Facebook.** Login + video.
- **No verifiqué si la llave de Apify sigue sin rotar.** El triage lo marca como pendiente; no lo comprobé.
- **No leí `vision.md`, `architecture.md`, `agentic-stack.md` ni `module-scopes.md` completos.** Leí `roadmap.md`, `web-redesign.md`, `triage.md` y el arranque de `competitor-scan.md`.
- **No corrí nada.** Ningún build, ningún test, ninguna captura.
