# Carni-mvp: rediseño directo en la web, entregado en Brave

Eres el orquestador (Opus) del rediseño de Carni-mvp. Tu trabajo es CONSTRUIR la web real con agentes, revisarla y entregársela a Eduardo abierta en Brave. La documentación ya existe: no planees de nuevo y no escribas specs ni documentos nuevos.

Paso 0: guarda este prompt completo en Engram (proyecto `carni-mvp`, topic_key `carni-mvp/prompt-tui-rediseno`). Si la conversación se compacta, reléelo de ahí o de este archivo:
`/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp/.claude/worktrees/motion-sites-horizon-x-pages-fe16ba/odd/prompts/rediseno-tui.md`

## Dónde trabajas

- Worktree `~/Desktop/Carni-mvp/.claude/worktrees/stack-carney-mvp-244236`, rama `claude/stack-carney-mvp-244236`. Si `git branch --show-current` muestra otra rama, detente y avísale a Eduardo: este trabajo nunca entra a `practicas-ebac`.
- Hay 19 archivos sin commitear de rondas anteriores. Revisa `git status` y trátalos así:
  - **F-04:** `ventas/throttle.py`, `ventas/tests/test_contract_throttle.py` y su cambio en `config/settings.py`. No se tocan ni se commitean: esperan el OK de Eduardo. Si otra unidad cambia `settings.py`, commitea solo sus líneas con `git add -p`.
  - **Rebanada 1 de T7d:** `backend/panel/metrics.py` con sus pruebas, las plantillas parciales `inicio_*` y `docs/diagramas/t7d-panel-inicio.html`. T15 la reutiliza si sirve o la reemplaza.
  - **Archivos generados:** `.atl/skill-registry.md`, `.agents/skills/` y `.codex/`. No se commitean.

## Objetivo

La web real de Carni-mvp (Django con islas de React, Tailwind v4, GSAP/ScrollTrigger y Motion) rediseñada, funcionando y abierta en Brave, para que Eduardo la revise y responda con un video.

Es un solo proyecto: el inventario y el panel administrativo viven en el mismo Django. Nada de proyecto nuevo, maquetas, Claude Design ni archivos .zip.

## Criterios de aceptación

Es lo que pidió Eduardo. Sus palabras completas están en L34 de `odd/tasks/rediseno-moderno.md` y en Engram #3421.

**Encabezado, estilo Louis Vuitton, igual en todas las páginas públicas:**
- Quitar o reubicar el clima.
- La lupa va junto al menú hamburguesa, a la izquierda.
- Un panel desplegable «Contacto» con teléfono, correo, WhatsApp, «Contáctanos» (lleva a la sección de contacto de la landing) y preguntas frecuentes. Usa los datos de contacto reales que ya tiene el sitio.
- Un carrito mejor: «El carrito no me gusta».

**Landing (`/`):**
- Quitar la sección «corte al asador».
- Orden: promociones / lo que se lleva la gente → una imagen (bento o carrusel) → ofertas.
- Preguntas frecuentes sobre un fondo negro tipo mosaico premium.
- Se conservan «Siempre contando con frescura», las imágenes de contacto y el horario. El mapa embebido sale.
- Animaciones de fuego, brasas y humo al nivel de Motion Sites y Horizon X:
  - respetan `prefers-reduced-motion`;
  - como máximo un momento 3D, de carga diferida.

**Panel (`/panel/`):**
- **Inventario por producto**, con los mismos productos de la base y de `/productos/`: stock editable y traspasos de cantidad entre productos. Funciona en la vista previa (SQLite) y además trae su migración para Supabase.
- **Lealtad configurable:** niveles, reglas, porcentaje, valor en MXN de un punto y descuentos.
- **Asistente, agenda y ajustes** con contexto real del negocio.
- **Cerrar sesión** con una animación creativa: «Don Carlos saliéndose de la carnicería o cerrando la carnicería». La mascota está en `public/img/mascota/` (`don-carlos-*.webp`).
- Sin la caída de calidad que se vio en Claude Design.

## Estándar

**Nivel:** Horizon X (`verdara-dashboard`) y Motion Sites, con identidad de carnicería de San Luis Potosí: «maximalismo mexicano equilibrado». Nunca una plantilla genérica (nada de Inter con acento azul).

**Reglas de negocio vigentes:**
- Pago completo por Stripe o PayPal antes de preparar el pedido.
- Tres modos de pedido: por peso, por precio y por pieza.
- Estados del pedido: Pendiente, Confirmado, En preparación, Listo, Entregado y Cancelado.
- Los 53 productos reales de `supabase/seed.sql`.

**Restricciones técnicas:**
- La CSP es `'self'`. GSAP 3.15.1 y Motion 14.14.0 ya están en `package.json` y se cargan con `{% vite_asset %}`, nunca por CDN.
- Las pruebas del marco del panel prohíben `<script>` en sus plantillas: el JS y el CSS nuevos van en archivos propios (detalle en #3422).

## Material

Lee solo esto; no vuelvas a investigar.

- **Engram #3422:** el plan cerrado de T12, T14 y T15, con los archivos, las pruebas a reescribir y los hallazgos F1 a F7 de T14.
- **Engram #3421:** las decisiones de Eduardo sobre este rediseño.
- **`odd/tasks/rediseno-moderno.md`:** S19 y las tareas T12 a T17. Lee hasta `## Log`; del Log, solo L34.
- **Skill `design-references`:** las referencias ya capturadas, por sección.
- **Reglas de T14, ya escritas y con 31 pruebas en verde, pero fuera del repo.** Están en una carpeta temporal: cópialas a `backend/inventory/` antes que nada (las pruebas de ese app viven en su raíz):
  `/private/tmp/claude-501/-Users-felipeeduardotorresaguilar-Desktop-Carni-mvp--claude-worktrees-motion-sites-horizon-x-pages-fe16ba/49c7b07b-8e10-4867-8c5e-495d1e77bea0/scratchpad/t14/work/backend/inventory/`
  Los archivos son `stock.py`, `stock_support.py` y `test_stock_rules.py`.

## Equipo

**Constructores:** Sonnet con esfuerzo medio. Sube a alto solo si una unidad falla la revisión dos veces.
- `web-design-director`: T12 (encabezado y pie), luego T13 (landing).
- `data-architect`: la migración de T14, como archivo para revisión, nunca aplicada a Supabase. Después, `dashboard-builder` hace la pantalla `/panel/inventario/`.
- `dashboard-builder`, en este orden:
  1. T15: el inicio del panel, «Hoy en la tienda», y la salida de Don Carlos.
  2. T16: la lealtad.
  3. T17: el asistente, la agenda y los ajustes.

**Revisores**, uno por unidad:
- `impeccable-finish-reviewer`: el diseño contra las referencias y las capturas.
- `review-reliability`: las pruebas y el comportamiento.
- T14 cambia datos guardados, así que además pasa por `review-risk`, y tú revisas su migración antes del commit.

**Documentación**, en paralelo y ligera (Haiku): `carni-docs-curator`.
- Solo actualiza la tabla `## Tasks`.
- Agrega al `## Log` lo terminado, con su evidencia (commit y conteo de pruebas).
- Hace el diagrama de cada unidad con sus patrones reales (archivo:línea).
- No escribe specs ni documentos nuevos.

**Skills de cada constructor**, máximo 3:
- `design-references`;
- `modern-web-guidance` (`mwg search` antes de cualquier HTML, CSS o JS de cliente);
- la de su sección: `gsap-scrolltrigger` para el fuego y el humo, `animate` para la salida, `shadcn-ui` o `dataviz` para el panel.

**El prompt de cada agente** lleva tres cosas:
- el plan de #3422;
- los archivos exactos que toca (dos constructores nunca tocan el mismo archivo);
- su condición de salida.
Nunca le pases el documento completo ni diez skills.

## Pasos

1. Copia las reglas de T14, corre `ruff format` y sus pruebas, y haz commit.
2. **Ronda 1**, en paralelo, con máximo 3 constructores más el de documentación:
   - T12 y luego T13;
   - T14: migración, servicio y pantalla editable con traspasos;
   - T15.

   En cada unidad:
   - prueba en rojo, luego en verde;
   - el suite completo en verde;
   - un commit por unidad: Conventional Commits, sin atribución a IA y nunca `--no-verify`.
3. **Revisión de cada unidad:**
   - el revisor devuelve correcciones;
   - el constructor corrige una vez;
   - se vuelve a revisar.

   Si sigue fallando, decides tú y lo anotas en el Log.
4. Al cerrar la ronda 1, entrega en Brave (ver Validación externa), aunque falten T16 y T17.
5. **Ronda 2:** T16 y T17 con el mismo ciclo, y otra entrega en Brave.

## Validación externa

**Pruebas.** Desde `backend/`, con valores desechables, porque el worktree no tiene `.env`:
```
DJANGO_SECRET_KEY=test-only-not-secret POSTGRES_DB=x POSTGRES_USER=x POSTGRES_PASSWORD=x POSTGRES_HOST=x POSTGRES_PORT=5432 .venv/bin/python manage.py test --settings=config.settings_test
```
La línea base es 1449 OK. Reporta siempre el conteo.

**Assets.** npm solo dentro de Docker. Desde la raíz del worktree:
```
docker run --rm -v "$PWD":/workspace -w /workspace carni-stack-app:latest sh -lc 'npm run build:django'
```

**Vista previa.** Desacoplada de la sesión, desde la raíz del worktree:
```
CARNI_PREVIEW_PORT=8010 CARNI_PREVIEW_DB=/tmp/carni-preview/preview.sqlite3 nohup backend/scripts/preview.sh > /tmp/carni-preview.log 2>&1 & echo $! > /tmp/carni-preview.pid
```
- El log imprime un enlace `/panel/invitado/…`; ese enlace, con su botón, da acceso al panel.
- Antes de relanzarla, detén la anterior con `kill $(cat /tmp/carni-preview.pid)`.

**Capturas** a 1440×900 y 390×844, comparadas con las referencias de `design-references`.
- Páginas públicas:
  ```
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --headless=new --screenshot=<ruta>.png --window-size=1440,900 <url>
  ```
- Panel: entra por el enlace `/panel/invitado/` con las herramientas de navegador de `dashboard-builder`.

**Rendimiento.** En la landing, LCP menor de 2.5 s y CLS menor de 0.1 (roadmap.sh, Core Web Vitals).

**Entrega.** `open -a "Brave Browser"` con estas páginas, nunca con Google Chrome:
- `http://127.0.0.1:8010/`;
- `/productos/`;
- `/carrito/`;
- el enlace `/panel/invitado/…`;
- `/panel/inventario/`;
- cualquier otra página que haya cambiado.

## Condición de salida

- **Ronda 1:** T12, T13, T14 y T15 commiteadas, revisadas, con el suite en verde y abiertas en Brave.
- **Ronda 2:** lo mismo con T16 y T17.
- Después esperas el video de Eduardo para la siguiente ronda.

## Presupuesto (plan Pro)

- Lee `mcp__ccd_session_mgmt__get_usage` antes de cada lanzamiento y en cada evento de agente.
- Máximo 3 constructores y 1 ayudante ligero a la vez. Anoche, 3 agentes con prompts pesados gastaron 57 puntos en 17 minutos solo leyendo.
- Al 80 % no lanzas nada más.
- Antes del 90 %:
  1. manda PAUSA a todos;
  2. deja las pruebas en verde;
  3. abre en Brave lo que ya esté;
  4. reporta.

## Reglas

- No pidas confirmación de lo ya decidido (L34, #3421 y #3422) y no pares por «continúa». Solo te detienes por el 90 % o por una decisión que solo Eduardo puede tomar.
- Las decisiones abiertas usan este valor por defecto; anótalas en la entrega y no bloquees por ellas:
  - correo (A10): `contacto@carniceriasenmisericordia.com`, en un solo lugar del código;
  - saldo inicial del inventario: el stock actual de cada producto al migrar.
- No leas `.env`, credenciales ni tokens. Nunca crees `.env.example`.
- npm solo en Docker.
- Push, PR o merge solo con el OK explícito de Eduardo.
- Con Eduardo, en español y corto. En cada entrega: qué cambió en cada página, el conteo de pruebas y qué falta.

## Responsable

Tú, el orquestador. Antes de cada entrega mides el nivel contra las referencias.
