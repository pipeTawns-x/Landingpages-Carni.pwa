# Loop para OpenCode · migrar el rediseño DENTRO del proyecto Carni-mvp

Este archivo es el prompt maestro para continuar el trabajo en OpenCode con modelos gratuitos. Se abre OpenCode en `~/Desktop/Carni-mvp-pruebas` (rama `pruebas`) y se pega el "Mensaje de arranque" del final.

## 1 · Qué se hace (y qué NO)

**Se hace:** migrar, poco a poco y en el mismo proyecto, las páginas que ya existen a React + Tailwind v4 con el diseño de Claude Design (`docs/design/claude-design-1.1/`):

| Página de producción (no cambia de nombre ni de ruta) | Qué se mejora |
|---|---|
| `index.html` | landing |
| `products.html` | catálogo y ficha |
| `accessweb.html` | Ingresar y Registrarse (con el panel deslizable y el carnicero) |
| `dashboar.html` (y `admin-*.html`) | panel administrativo |

**NO se hace:** un sitio paralelo. Esto ya pasó y hay que corregirlo: se crearon `landing.html`, `catalogo.html`, `panel.html` y carpetas nuevas (`src/ui`, `src/landing`, `src/catalogo`, `src/panel`, `src/data`) al lado de las páginas reales, y se dejaron fuera piezas que ya existían: la Lupa, el efecto del encabezado sobre el video, el chatbot, la PWA. Lo nuevo que sirve se **reutiliza** (Hoja, Encabezado, Tarjeta, CarruselCortes, capa de datos, tokens); lo demás se integra en las páginas reales.

## 2 · Contexto que ya existe (léelo antes de tocar nada)

1. `docs/design/rediseno/ESTADO.md`: estado, decisiones y deuda.
2. `docs/design/rediseno/migracion/MAPA.md`: mapa página por página, duplicados, pérdidas, referencias a vigilar y orden de pasos. **Si no existe, el paso M0 lo produce.**
3. `docs/design/rediseno/06-plano.md`: plano del arquitecto (tokens en §2, primitivas en §3, seguridad en §5). Donde contradiga este archivo, manda este archivo.
4. `docs/design/rediseno/investigacion/` (4 informes) y `05-abogado-del-diablo.md`.
5. La skill `migracion-incremental`: `~/.claude/skills/migracion-incremental/SKILL.md` (mismo texto en `docs/design/rediseno/migracion/SKILL-migracion-incremental.md`). Cárgala y síguela.
6. Memoria: Engram, proyecto **`carni-mvp` en minúsculas** (con mayúscula `Carni-mvp` se guarda en otro cajón y nadie lo encuentra). Busca `rediseno-mvp/progreso`. Graphify: `graphify-out/` de este árbol (grafo del código).
7. `AGENTS.md` (reglas del repo) y `docs/design/rediseno/gates.sh` (compuertas mecánicas).
8. **`docs/design/rediseno/CONTEXTO-CHAT.md`**: resumen de lo que decidió y falló el agente de Claude Code, con las rutas de las transcripciones completas (§7 de ese archivo). OpenCode debe **auditarlo**: comprobar sus afirmaciones contra el repo y anotar discrepancias en `ESTADO.md`.

## 3 · Reglas duras

1. Se trabaja solo en `~/Desktop/Carni-mvp-pruebas`, rama `pruebas`. `~/Desktop/Carni-mvp` está en `practicas-ebac` (la usa el chat de backend): solo lectura. Nunca `checkout`, `switch`, `stash` ni `reset --hard`.
2. **Migrar en el lugar.** Prohibido crear un `.html` nuevo en la raíz o una entrada nueva en `vite.config.js`. `landing.html`, `catalogo.html` y `panel.html` desaparecen cuando su página real pase el checklist de paridad.
3. **Buscar antes de escribir.** Antes de crear un componente, `rg`/Graphify: si ya existe algo parecido, se reutiliza o se restila. Ejemplo que ya se falló: la Lupa existe (`src/components/Lupa`); se restila y se monta en el Encabezado nuevo, no se reemplaza por un campo de búsqueda.
4. **Una rebanada por commit** (una página, un componente o un comportamiento). Un commit que toca dos páginas está mal.
5. **Commits convencionales y bilingües**, sin atribución a IA, por ejemplo:
   `feat(index): migrate landing to React + Tailwind in place / migra la landing a React + Tailwind en el mismo index.html`
   El cuerpo dice: qué se movió, qué se reutilizó, qué archivos viejos se borraron y qué rutas se revisaron. Así un diseñador o un desarrollador ve en el historial cada paso de la migración.
6. Si cambia un nombre o una ruta: primero `rg` de todas las referencias (manifest, service worker, sitemap, redirects de `netlify.toml`, enlaces de otras páginas, JS con `location`, entradas de vite, pruebas, docs) y se actualizan en el mismo commit.
7. Se conservan los deberes no visuales hasta tener paridad: manifest y service worker, meta SEO y datos estructurados, analítica, accesibilidad, redirects.
8. **Cada ventana, hoja, menú o cajón lleva X visible de al menos 44 px, Escape, toque en el fondo, trampa de foco y foco devuelto.** El menú del panel en móvil es el caso que faltaba.
9. Seguridad: sin llaves privadas en el bundle, sin `innerHTML`, sin CDN, cierre de sesión real (`signOut()`), guardia de admin con `getUser()` + `is_admin()`. **No se aplican migraciones SQL**: `supabase/migrations` es contrato con el chat de backend; solo se redactan propuestas en `docs/design/rediseno/seguridad/`.
10. Datos reales: precios, nombres y mínimos salen de la base (`docs/design/datos/catalogo-real.md` y `src/data/semilla*.json`). Nada de existencias inventadas, nada de fotos generadas con IA como foto de producto, sin correo hasta que exista uno que funcione.
11. `npm`/`node` solo dentro de Docker: `docker exec carni-landing-dev <comando>` (puerto 3002). Tras editar desde el host hay que `docker restart carni-landing-dev` y esperar 8 s antes de medir (el bind mount no propaga cambios a Vite).
12. **Commits con `--no-verify`.** El hook GGA llama a Claude y gasta los créditos de Claude de Eduardo, y además rechaza el código por dos reglas viejas de `AGENTS.md` (SCSS co-locado; "Tailwind no es el estado actual"). Se anota en cada commit de código. Siempre `git log -1` para confirmar que el commit existe.
13. Nunca se hace `git add -A` ni `git add .`: el árbol tiene cambios ajenos (`.atl/skill-registry.md`, `docs/design/loop-final.md`, `docs/design/loop-v3.md`, `docs/design/mockups/`). Se añaden rutas exactas.
14. **`AGENTS.md` no se edita sin aprobación de Eduardo** (el paso 0 del mapa propone una enmienda: queda anotada en `ESTADO.md` como pendiente y no bloquea). Sin preguntar a Eduardo para lo demás. Si algo bloquea de verdad, se anota en `ESTADO.md` como "BLOQUEADO: motivo" y se sigue con otra rebanada independiente.

## 4 · Equipo de agentes y modelos gratuitos

OpenCode de Eduardo tiene credenciales de OpenRouter, Groq, Cloudflare Workers AI, Kimi, NovitaAI y OpenCode Zen. Los modelos de la tabla salen de `opencode models` (comprobado el 2026-09-30). **No se probaron en este repo:** la calidad es una hipótesis, y los planes gratuitos tienen límites de peticiones. Si uno falla o se queda sin cuota, se baja al siguiente de su fila. Para revisar qué hay hoy: `opencode models | rg -i free`.

| Rol | Qué hace | Modelo principal (gratis) | Respaldos |
|---|---|---|---|
| Orquestador (`gentle-orchestrator`) | Lee el estado, elige la rebanada, reparte, corre las compuertas, hace los commits (es el único que commitea), guarda el avance | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` (1 M de contexto, herramientas) | `opencode/nemotron-3-ultra-free`, `groq/openai/gpt-oss-120b`, `cerebras/gpt-oss-120b` |
| Cartógrafo / auditor de duplicados | Solo lectura. Mantiene `MAPA.md` y revisa cada commit contra la lista anti-duplicado (§7) | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` | `openrouter/google/gemma-4-31b-it:free` |
| Escritor de código (1 a la vez) | Implementa UNA rebanada con archivos propios | `openrouter/qwen/qwen3.8-27b:free` (262 k, herramientas) | `groq/qwen/qwen3.8-27b`, `cerebras/qwen-3.8-27b`, `openrouter/poolside/laguna-s-2.1:free`, `openrouter/cohere/north-mini-code:free` |
| Revisor de contexto limpio | Lee solo el diff y los criterios; no vio al escritor | un modelo **distinto** del escritor: `openrouter/nvidia/nemotron-3-super-120b-a12b:free` | `groq/openai/gpt-oss-120b` |
| Seguridad | Revisa guardia de admin, `signOut`, claves, `innerHTML`, propuesta SQL | `groq/openai/gpt-oss-120b` | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` |

Reglas del equipo:
- Un solo escritor a la vez. Dos escritores nunca tocan el mismo archivo.
- El revisor nunca es el mismo modelo que escribió. El auditor corre después de cada commit, no al final.
- Si el modelo de una fila falla dos veces en la misma rebanada, se escala al siguiente y se anota en `ESTADO.md`.
- `kimi-for-coding` tiene credencial: puede usarse como respaldo de escritor si el plan de Eduardo lo incluye. No se asume.
- Skills que cada rol debe leer: escritor → `migracion-incremental`, `carni-frontend-guardrails`, `building-components`, `emil-design-eng`; revisor → `web-design-guidelines`; seguridad → `cyber-neo-auditoria`. Las rutas están en `docs/design/rediseno/06-plano.md` §0.1.

## 5 · Pasos (uno a la vez; el orden fino y los archivos exactos están en `MAPA.md` §4)

**M0 · Mapa y línea base.** Leer el contexto de §2, incluido `CONTEXTO-CHAT.md`. Auditar ese contexto: (a) comprobar con `git log --oneline -15` que los commits citados existen; (b) leer las transcripciones con el `jq` de su §7 y buscar decisiones que contradigan lo que pidió Eduardo; (c) anotar en `ESTADO.md` una línea por discrepancia. Indexar el diseño y los informes en Graphify (`/graphify docs/design/rediseno docs/design/claude-design-1.1`) si la skill funciona con el modelo de OpenCode; si no, se omite y se usa `rg`. Si falta, producir `MAPA.md`. `git log --oneline -8` y `git status`. Comprobar que el contenedor responde (`docker start carni-landing-dev`) y que `docs/design/rediseno/gates.sh --rapido` corre.

**M1 · `index.html` (la landing) en el mismo archivo.**
- Portar el contenido de `landing.html` a `index.html`, conservando lo no visual de la página vieja (PWA, service worker, SEO, analítica).
- Orden fijo: portada, mostrador, carrusel de Filete Mignon, lo que se lleva la gente, ofertas, preguntas frecuentes, carnicería de familia, horarios y puntaje, contacto y dirección, comentarios, pie.
- En móvil el video es un 16:9 de unos 220 px detrás del texto; en escritorio, 85 svh a sangre.
- El encabezado vuelve al efecto viejo: transparente sobre el video, oscuro al pasar el cursor o con foco, sólido después de la portada (`css/layout/_header.scss:65-98`).
- La **Lupa** existente se restila y se monta en el Encabezado. El carrito y el menú usan la `Hoja` con X.
- Borrar `landing.html` solo al pasar el checklist de paridad.

**M2 · `products.html`.** Catálogo con la misma Tarjeta; carrito; ficha. Sin tercer botón rojo por pantalla (rejilla con "+" en contorno, rojo solo en "Agregar" de la ficha y "Pagar" del carrito). Borrar `catalogo.html` al final.

**M3 · `accessweb.html`.** Ingresar y Registrarse con la transición de panel de 480 ms (`cubic-bezier(0.77,0,0.175,1)`) y el carnicero (`docs/design/assets/mascota/`, léase su README). Nunca dos personajes a la vez.

**M4 · `dashboar.html` y `admin-*.html`.** Cajón móvil con X, guardia de admin, `signOut()` real, Inicio con estados vacíos honestos, Chatbot entre Clientes y BuildAds. Borrar `panel.html` al final.

**M5 · Asistente.** Lanzador con SVG propio (cuchilla con burbuja), saludo "¿Te ayudo a elegir tu corte?", chips (para asar, para guisar, cuánto por persona, horario), busto del carnicero (`public/img/mascota/`), solo respuestas guiadas, rótulo "Respuestas guiadas, no es una persona". Sin campo libre mientras no haya backend.

**M6 · Seguridad y cierre.** Propuesta SQL para cerrar la escritura directa en `orders` y `order_items` (sin aplicar), revisión dual (seguridad y UX/accesibilidad) y entrega.

Cada rebanada termina con: compuertas, revisión, commit bilingüe, `git log -1`, `git push origin pruebas`, línea en `ESTADO.md` y nota en Engram (`rediseno-mvp/progreso`).

## 6 · Compuertas y verificación

```bash
WT=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas
docker start carni-landing-dev
docker exec carni-landing-dev npm run ts:check
docker exec carni-landing-dev npm test
docker exec carni-landing-dev npm run build
"$WT"/docs/design/rediseno/gates.sh            # rg: 0 innerHTML, CDN, VITE_ fuera de supabase.ts, cadenas prohibidas...
for p in index products accessweb dashboar; do curl -s -o /dev/null -w "$p %{http_code}\n" http://localhost:3002/$p.html; done
```

- Capturas en 390 y 1440 con Chrome sin cabeza (receta en `06-plano.md` §4.0; el ancho de 390 se toma por CDP porque `--window-size` no baja de 500).
- Medidas que deben cumplirse en la landing: caja de portada 202 a 260 px a 360/390/414; 765 px a 1440×900; encabezado `rgba(0,0,0,0)` arriba, `rgba(0,0,0,.92)` con hover y foco, `rgb(11,11,12)` tras la portada; sin desborde horizontal a 360/390/768/1024/1440.
- Al terminar una página: `open -a "Brave Browser" http://localhost:3002/<pagina>.html` para que Eduardo la vea.

## 7 · Auditor independiente (se corre después de cada commit)

Lista anti-duplicado, con evidencia por cada punto:
1. ¿Apareció algún `.html` nuevo en la raíz o una entrada nueva en `vite.config.js`? Debe ser NO.
2. ¿El commit toca una sola página o rebanada?
3. ¿Se creó un componente que ya existía? Buscar por nombre y por función.
4. ¿Se perdió un comportamiento de la página vieja? Comparar con la lista de `MAPA.md` §2(b).
5. ¿Se cambió una ruta sin actualizar todas sus referencias?
6. ¿Todo overlay nuevo tiene X, Escape, fondo y foco?
7. ¿El mensaje del commit es convencional y bilingüe, y el cuerpo lista lo borrado y lo reutilizado?
Si hay un SÍ malo: el orquestador revierte con `git revert <sha>` y rehace la rebanada.

## 8 · Guardado y reanudación

- El estado vive en `docs/design/rediseno/ESTADO.md` (una línea por rebanada: sha, medidas, pendiente). Engram: `rediseno-mvp/progreso`.
- Reanudar: leer `ESTADO.md`, `git log -5`, `git status`; continuar en la primera rebanada sin HECHO. Si hay archivos a medias de una rebanada, se conservan y se termina desde ahí.
- Subir a GitHub en cada rebanada: `git push origin pruebas`.

## 9 · Mensaje de arranque (pegar en OpenCode)

```text
Eres el orquestador del rediseño de Carni-mvp. Trabajas en ~/Desktop/Carni-mvp-pruebas (rama pruebas). Lee ahora docs/design/rediseno/LOOP-OPENCODE.md completo y síguelo al pie de la letra.
Resumen: la migración se hace DENTRO de las páginas que ya existen (index.html, products.html, accessweb.html, dashboar.html), nunca en un sitio paralelo. Reutiliza lo que ya hay (Lupa, carrito, encabezado, datos) y lo nuevo que sirve (Hoja, Encabezado, Tarjeta, CarruselCortes). Una rebanada por commit, commits convencionales bilingües (inglés / español) con --no-verify, un solo escritor a la vez, revisor y auditor distintos del escritor, y guardas el avance en ESTADO.md y en Engram (proyecto carni-mvp, en minúsculas) tras cada rebanada.
Empieza por M0 (contexto y MAPA.md) y sigue con M1 (index.html). No me preguntes nada; si algo bloquea, anótalo como BLOQUEADO en ESTADO.md y pasa a otra rebanada. Al terminar cada página, ábrela en Brave con: open -a "Brave Browser" http://localhost:3002/<pagina>.html
```
