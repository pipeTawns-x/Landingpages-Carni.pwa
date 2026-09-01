# Pendientes — Carni-mvp

**Fuente única de verdad.** Si un pendiente está aquí y también en otro documento, este manda y el otro se corrige.

Los blueprints guardan **decisiones** (por qué se hizo algo). Este archivo guarda **deuda** (qué falta). No se mezclan.

Estados: `abierto` · `en curso` · `congelado`

Última revisión: 2026-08-31

> **Aviso de techo.** Este archivo ronda los 19 pendientes abiertos. Según la regla del propio proyecto, pasar de ~20 no es un problema del archivo: es señal de que se están acumulando decisiones sin tomar. La tanda 1 debería cerrarse antes de agregar nada nuevo.

> **Estado operativo local del 2026-08-31.** La landing de [index.html](index.html) ya usa video de fondo y el catálogo de [products.html](products.html) mantiene la vista de carrito lateral y la lógica de productos premium. El cambio visual quedó concentrado en landing y catálogo, sin tocar el flujo de login ni la base funcional del admin. El sitio público sigue sin reflejar estos cambios porque la rama de despliegue sigue apuntando a `practicas-ebac` y no a `main`.

---

## 🔴 Seguridad — bloquean el merge a `main`

Al 2026-08-25 **no queda ningún 🔴 vivo**. Lo único en esta sección está congelado con su módulo.

### P-03 · Dos huecos en `server/routes/buildads.ts`

**Estado:** congelado con el módulo · **Evidencia:** `server/routes/buildads.ts`

`voice_id` sin validar se concatena a una ruta, con la API key adjunta. Y los errores del servicio externo se reenvían crudos al navegador.

Congelado porque BuildAds lo está. **Se descongela junto con el módulo, no después.**

---

## 🟠 Despliegue — el sitio público no muestra tu trabajo

### P-04 · GitHub Pages publica otra rama, y publica el repo crudo

**Estado:** abierto · **Evidencia:** _Settings → Pages_ del repositorio, verificado el 2026-08-25

La configuración dice, textual:

```
Source: Deploy from a branch
Branch: practicas-ebac   /(root)
```

Son **dos defectos en uno**, y por eso el sitio público lleva meses sin moverse:

1. **Publica desde `practicas-ebac`, no desde `main`.** Mergear a `main` no toca el sitio. Se comprobó: el merge del PR #6 no disparó ningún despliegue.
2. **Publica la raíz del repositorio tal cual, sin construir.** Por eso el navegador recibe un `.tsx` crudo, que ningún navegador ejecuta.

Comprobado en vivo el 2026-08-25 sobre `https://pipetawns-x.github.io/Landingpages-Carni.pwa/`: nueve tarjetas fijas, el texto "Selección Premium" todavía presente, y React sin arrancar.

**Ojo:** cambiar la rama a `main` no basta y empeora las cosas — seguiría sirviendo el repo crudo, ahora con la versión que además espera un backend. Hay que pasar a _GitHub Actions_ como fuente y publicar `dist/` con `actions/deploy-pages`.

**Depende de P-18** — sin las variables, el `dist/` publicado arranca lanzando un error.

### P-25 · El CI lleva rojo desde el 19 de agosto

**Estado:** abierto · **Evidencia:** _Carni CI_ corridas #17 a #25, todas en fallo

Nueve corridas seguidas fallando, incluida la del merge a `main`. Falla siempre en el mismo sitio, a los 10 segundos:

```
npm error code EUSAGE
npm ci can only install packages when your package.json and
package-lock.json are in sync.
Missing: sass@1.103.1 from lock file
Missing: chokidar@5.0.0 from lock file
Missing: immutable@5.1.9 from lock file
```

Alguien agregó `sass` a `package.json` y nunca commiteó el `package-lock.json` actualizado. `npm ci` —a diferencia de `npm install`— se niega a instalar si los dos archivos no coinciden, que es justo para lo que sirve.

Consecuencia: **el CI dejó de proteger nada.** Un rojo permanente se vuelve ruido y se ignora, que es exactamente lo que pasó al mergear el PR #6.

**Arreglo:** `npm install` en local y commitear el `package-lock.json` resultante. Un comando.

**Nota aparte:** `docs/brain/security.md:15` declara **pnpm** como gestor del proyecto, pero el repo usa `package-lock.json` y el CI corre `npm ci`. Otra regla que la realidad contradice. Decidir cuál gana antes de tocar el lockfile.

### P-18 · El build de producción no tiene credenciales de Supabase

**Estado:** abierto · **Evidencia:** `.github/workflows/ci.yml:30`, `js/modules/supabase.js:10-14`

Vite incrusta las variables `VITE_*` **en el momento de construir**, leyéndolas del `.env` local. Ese archivo está en `.gitignore` y no llega a GitHub, y el flujo de trabajo no define ninguna. Así que el `dist/` que produce el CI sale sin URL ni llave, y `supabase.js` lanza `Supabase configuration missing` al cargar.

O sea: aunque hubiera despliegue, el sitio público quedaría **peor** que hoy — hoy al menos cae al catálogo del código.

**Arreglo:** guardar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como _repository secrets_ y pasarlas como `env:` al paso de build. La llave publishable es pública por diseño; lo que protege los datos es RLS, no el secreto de la llave.

### P-05 · Rutas absolutas que rompen bajo subcarpeta

**Estado:** abierto · **Evidencia:** `index.html:552`, `js/modules/core/api.js:8`

`/src/entry/home.tsx` y `/js/modules/utils/service-worker.js` apuntan a la raíz del dominio, pero el sitio vive en `/Landingpages-Carni.pwa/`. Además un `.tsx` crudo no lo ejecuta ningún navegador.

### P-06 · `publicDir: 'img'` deja el build sin imágenes

**Estado:** abierto · **Evidencia:** `vite.config.js:38`

Vite copia `img/*` a la raíz de `dist/`, así que `dist/img` no existe y las rutas `/img/products/…` fallan. En desarrollo no se nota porque Vite sirve el árbol del proyecto tal cual — el fallo solo aparece en el build.
**Ojo:** `publicDir: false` NO es el arreglo — desactiva la copia entera. Mover a `public/img/` y usar `publicDir: 'public'`.

---

## 🟠 Migración a React — landing

### P-10 · Modal de corte premium huérfano

**Estado:** resuelto · **Evidencia:** `products.html:415`, `js/modules/core/cart.js:526`

`openPremiumOrderModal()` está conectada al flujo real: al confirmar, llama a `window.CarniCart.addItem()`, que abre el `#cartModal` con la lógica trifásica aplicada (weight/pieces/price + grosor). La limitación de `products.peso_promedio` (P-19/P-20) afecta solo el modo "por pieza" en productos no premium.

---

## 🟡 Reglas del negocio que la base todavía no conoce

### P-19 · El despiece del pollo solo existe como texto, no como regla

**Estado:** abierto · **Evidencia:** `docs/cargar-catalogo-y-admin.sql` (descripción de _Pierna y Muslo_), `supabase/migrations/202604100001_initial_schema.sql:38-50`

Las reglas del mostrador —la pierna no se vende sin su muslo; media pechuga va con o sin ala; medio pollo a lo largo equivale a pierna con muslo más pechuga y ala— están escritas **en la descripción del producto, en prosa**. Un humano las lee; la base no.

`products` no tiene ninguna columna que las represente: no hay unidad de venta, ni pieza, ni composición, ni productos que se excluyan entre sí. `create_order_with_items()` valida precio, cantidad y stock, y nada más. Hoy nada impide un pedido que en el mostrador no se puede despachar.

**Arreglo:** modelar la unidad de venta y la composición de las piezas antes de escribir validaciones. Es decisión de diseño de datos, no un parche. **Bloquea P-20.**

### P-20 · El carrito trifásico no tiene datos que lo sostengan

**Estado:** abierto · **Evidencia:** `docs/PLAN_MVP_COMPLETO.md:52`, `supabase/migrations/202604100001_initial_schema.sql:38-50`

El modo **por peso** funciona: `price_per_kg` existe. Los otros dos no tienen de dónde salir:

- **por precio** ("dame $150 de arrachera") — se puede derivar del precio por kilo, pero nadie decidió cómo se redondea al pesar
- **por pieza** — necesita peso promedio por pieza, y esa columna no existe en ninguna migración

Es el diferenciador del proyecto según `docs/INVESTIGACION_Y_PROMPTS.md:87`, y lleva desde el 12 de agosto bloqueado por la misma columna faltante.

**Depende de P-19:** la unidad de venta y la pieza son el mismo modelo de datos. Resolverlos por separado es hacerlo dos veces.

### P-21 · Los mínimos existen pero no hay dónde editarlos

**Estado:** abierto · **Evidencia:** `supabase/migrations/202608210001_precio_server_side.sql:60-105`

`store_settings` guarda `min_order_delivery` y `min_order_pickup`, y cada producto tiene su `min_quantity_kg`. Todo verificado llegando al navegador el 25 de agosto. Pero **solo se pueden cambiar desde el SQL Editor**, y el dueño de la carnicería no va a entrar ahí.

Faltan además, y son del mismo formulario: la unidad de venta de cada producto, y si un premium se vende por pieza o por paquete.

**Arreglo:** la fase 1 del dashboard, según `docs/blueprints/dashboard-admin.md:113`. **Depende de P-19 y P-20** para saber qué campos tiene que mostrar.

### P-22 · El desarrollo local escribe en la base de producción

**Estado:** abierto · **Evidencia:** `.env:2`

`VITE_SUPABASE_URL` apunta al proyecto real. Hoy no hay ventas y da igual, pero en cuanto entre el primer pedido cada prueba local va a ensuciar datos del negocio.

**Arreglo:** un segundo proyecto de Supabase para pruebas, o `supabase start` en local con el mismo esquema. **Ojo:** volver a apuntar a `host.docker.internal` no es la respuesta — ese nombre no resuelve fuera de un contenedor, y fue lo que tuvo la tienda sin backend desde abril.

### P-23 · No hay respaldos configurados

**Estado:** abierto

El proyecto de Supabase no tiene copias de seguridad, ni automáticas ni manuales. Lo que se borre, se fue. Hoy importa poco porque `orders` está vacía; deja de ser aceptable con la primera venta real.

**Arreglo:** revisar qué ofrece el plan gratuito y, mientras tanto, un `supabase db dump --linked` guardado fuera del repo.

---

## 🟡 Calidad — hallazgos de GGA ya triageados

### P-11 · `formatPrice` duplicado tres veces

`CartPanel.tsx:14` · `OrderList.tsx:22` · `ProductCard.tsx:11` → extraer a un módulo común.

### P-12 · Dos textos de respaldo para la misma categoría

`shared.tsx:89` devuelve `'Selección Carni'`; `ProductCard.tsx:87` devuelve `'Corte especial'`. Dejar uno.

### P-13 · Decisión contradictoria del tamaño de tarjeta

`ProductList.tsx:32-35` fija todo en `"medium"`; `home.tsx:74` varía por índice. Definir quién manda.

### P-24 · `js/modules/supabase.js` entró sin revisión de GGA

**Estado:** abierto · **Evidencia:** commit `58134436`

El arreglo de `p_address` se commiteó con `--no-verify` porque la sesión de GGA había expirado. Es el archivo por donde pasa cada llamada a la base y nadie lo revisó.

**Arreglo:** `/login` en Claude Code y correr GGA sobre ese archivo.

### P-26 · El slug de categoría no pasa por `encodeURIComponent`

**Estado:** abierto · **Evidencia:** `src/components/CategoryCard/CategoryCard.tsx`

El `href` arma `products.html?categoria=${slug}` interpolando el slug crudo. Hoy no explota porque solo un admin crea categorías y los slugs reales son `[a-z-]`, sin caracteres que necesiten escaparse. Pero la seguridad descansa en una convención, no en el código.

**Arreglo:** envolver el slug en `encodeURIComponent()`. Un cambio de una línea; se anotó en vez de hacerlo para no mezclarlo con la migración del bento.

### P-27 · GGA lleva tres sesiones sin poder correr

**Estado:** abierto · **Evidencia:** commits `58134436` y el del bento

`Failed to authenticate: OAuth session expired and could not be refreshed`. Falla determinista, tres intentos, en dos sesiones distintas. **Nunca llega a ver el diff**: no es que rechace código, es que no arranca. Hay `gga` 2.8.1 instalado y existe la 2.10.1.

**Arreglo:** probar `brew update && brew upgrade gga`. Si sigue igual, revisar dónde guarda su credencial, que parece ser aparte de la de Claude Code.

**Actualización 2026-08-27:** se actualizó a 2.10.1. El error cambió, no se resolvió: ahora dice `❌ No provider configured · Run 'gga init'`. La versión nueva no lee el `~/.config/gga/config` que declara `PROVIDER="claude"`. `gga init` es config global y lo corre Eduardo.

### P-28 · `gentle-ai` no sigue enlaces simbólicos; Claude Code sí

**Estado:** abierto · **Evidencia:** experimento del 2026-08-27, `gentle-ai` 1.39.4

Se probó si una misma skill puede vivir en un solo archivo y exponerse a varias herramientas mediante un enlace simbólico. Se creó `.claude/skills/PRUEBA-symlink-carni-node-ebac` apuntando a `agents/skills/carni-node-ebac`, y el resultado quedó partido:

- **Claude Code SÍ la descubre.** La listó entre las skills disponibles, con su descripción cargada desde el destino del enlace. Evidencia directa del harness, no de un archivo de configuración.
- **`gentle-ai skill-registry refresh --force` NO la ve.** El registro siguió reportando 50 skills, sin rastro de la enlazada ni por su nombre de enlace ni por el del destino.

**Por qué importa:** cierra la puerta a compartir una skill entre Cursor, opencode y Claude sin duplicarla. Una skill enlazada queda **invocable pero ausente del índice**, y ese índice es justo lo que el orquestador lee para decidir a quién delegar. Medio funcionando es peor que las dos puntas: se dispara sola y nadie sabe que existe.

Por eso las nueve skills de `agents/skills/` se **movieron** a `.claude/skills/` en vez de enlazarse.

**Arreglo posible:** que `gentle-ai` resuelva enlaces al escanear, o que el registro acepte carpetas adicionales por configuración. Hasta entonces, `.claude/skills/` es la única fuente y una skill compartida entre herramientas hay que duplicarla.

---

### P-29 · Remotion es de pago si la carnicería pasa de tres empleados

**Estado:** abierto · **Bloquea:** P-14 · **Evidencia:** `LICENSE.md` del repositorio, leído el 2026-08-27

Remotion no es software libre sin condiciones. Textual de su `LICENSE.md`:

> _"Individuals and small companies are allowed to use Remotion to create videos for free (even commercial), while a company license is required for for-profit organizations of a certain size."_

Gratis para individuos, organizaciones de **hasta tres empleados** y sin fines de lucro. Por encima de eso hace falta licencia comercial de pago.

**Por qué importa:** P-14 es video de fondo para la landing y el login de un negocio con fines de lucro. Si la carnicería tiene cuatro empleados o más, adoptar Remotion sin licencia es incumplimiento, no un descuido técnico. Y no se descubre al final: se descubre al contar.

**Qué falta:** que Eduardo cuente los empleados. Si son tres o menos, adelante. Si son más, se paga la licencia o se resuelve P-14 con otra herramienta —Higgsfield ya está conectado y es candidato.

La restricción también vive dentro de `.claude/skills/video-remotion/SKILL.md`, para que aparezca cuando la skill se dispare y no solo cuando alguien lea este archivo.

---

### P-30 · `agent-teams-lite` está archivado y sigue gobernando el orquestador

**Estado:** abierto · **Evidencia:** `gh api repos/Gentleman-Programming/agent-teams-lite` el 2026-08-27

El repositorio está **archivado** por su autor, último push el 2026-03-26. Sus instrucciones son la base de las reglas del orquestador que este stack usa en cada sesión.

No deja de funcionar —es Markdown puro, sin dependencias— pero **no va a recibir arreglos**. Cualquier incompatibilidad futura con Claude Code se resuelve aquí o no se resuelve.

**Qué falta:** decidir si se congela la copia local como propia y se mantiene desde el repo, o si se busca reemplazo. No urge; sí conviene saberlo antes de que algo se rompa y se busque el arreglo aguas arriba.

---

### P-31 · La skill `vercel-deploy` dice que este repo publica en GitHub Pages, y no

**Estado:** abierto · **Evidencia:** `netlify.toml` en la raíz + `gh api repos/pipeTawns-x/Carni-mvp/pages` → 404, el 2026-08-27

La skill global `vercel-deploy` (del paquete `claude-webkit`) lleva esto en su propia descripción:

> _"Ojo: este repo publica en GitHub Pages, no en Vercel."_

Las dos mitades fallan. GitHub Pages devuelve **404**: no está habilitado. Y el repositorio tiene un `netlify.toml` completo —build, functions, edge-functions, CSP, redirects de SPA—. **El destino real es Netlify.**

**Por qué importa:** es una skill que se dispara con la palabra "desplegar" y afirma un hecho falso sobre este proyecto. Un agente que la cargue va a razonar sobre el host equivocado.

**Qué falta:** el archivo vive en `~/.claude/skills/claude-webkit/vercel-deploy/SKILL.md`, fuera del repositorio, dentro de un paquete de terceros. Corregirlo ahí se pierde en la próxima actualización del paquete. Entra en el mismo problema que P-32: skills globales sin versionar.

Además, **no hay ninguna skill que sepa desplegar a Netlify**, que es a donde este proyecto realmente publica.

---

### P-32 · Las skills globales viven sin versionar en `~/.claude/skills/`

**Estado:** abierto · **Evidencia:** `~/.claude/skills` no está bajo control de versiones, comprobado el 2026-08-27

De las 63 skills del registro, la mayoría vive en `~/.claude/skills/`, fuera de cualquier repositorio. Se comprobó que no hay carpeta de dotfiles (`~/dotfiles`, `~/.dotfiles`) ni repositorio propio en GitHub que las contenga.

**Por qué importa:** son el criterio de trabajo del stack entero. Hoy existen en un solo disco, sin historia, sin copia y sin forma de saber qué cambió ni cuándo. Un `rm -rf` distraído las borra sin rastro. Y las 19 descripciones que se escribieron el 2026-08-27 para desmutear skills están exactamente ahí.

**Criterio para repartirlas:**

- Las que hablan de **Carni-mvp** → al repositorio, en `.claude/skills/`
- Las **generales** (diseño, investigación, escritura) → global está bien, pero necesitan un hogar versionado propio

**Qué falta:** decidir si se crea un repositorio de skills personales. **No se creó nada** — la decisión es de Eduardo, no de un agente.

P-31 es un caso concreto de este problema: una skill de terceros con un dato falso que no se puede corregir de forma duradera.

---

### P-33 · `$HOME` es un repositorio de git por accidente

**Estado:** abierto · **Riesgo: alto** · **Evidencia:** `git -C ~ rev-parse` el 2026-08-27

El directorio personal contiene un `.git`. No se tocó nada; solo se leyó:

- **Sin remoto** configurado
- **Cero commits** y **cero archivos rastreados**
- Rama actual: `feat-mvp-preparar-ecommerce-para-pruebas-con-delivery-0001` — un nombre de rama **de Carni-mvp**
- `~/.gitignore` contiene una sola línea: `node_modules`

El nombre de la rama delata el origen: un `git checkout -b` corrido con el `cwd` equivocado en alguna sesión anterior.

**Por qué es alto:** un `git add -A` o un `git add .` ejecutado desde `$HOME` —o por cualquier agente que se despiste de directorio— dejaría en escena `~/.ssh`, `~/.aws`, `~/.config`, todos los `.env` de todos los proyectos y los perfiles del navegador. Con `~/.gitignore` frenando únicamente `node_modules`. Es exactamente la clase de accidente que ya costó dos llaves de Apify.

**Qué falta:** Eduardo decide. Lo natural es borrar `~/.git`, pero **eso no lo hace un agente** y no se hizo. Se comprobó primero que no hubiera nada que perder: cero commits, cero archivos rastreados, así que no contiene historia de nadie.

Refuerza la regla que ya está en `AGENTS.md`: nunca `git add .`, siempre archivo por archivo, siempre verificado con `git diff --cached --name-only`.

---

## 🔵 Diseño — mejoras planeadas

### P-14 · Video de fondo con IA e imágenes propias de producto

**Estado:** abierto · **Referencia:** `docs/blueprints/direccion-rediseno-2026.md:166`

Dos cosas que se hacen juntas porque salen del mismo motor y de la misma sesión de trabajo:

1. **Video de fondo con Higgsfield** para el hero de landing y login. Nunca se probó. Mismo motor que necesitará BuildAds.
2. **Imagen propia por producto.** Hoy los 53 comparten la imagen de su categoría — las ocho piezas de pollo se ven idénticas. Incluye generar la mercancía (gorra, hielera, cuchillo, tabla, delantal), que no existe fotografiada.

Ahora tiene sentido hacerlo: con el backend conectado, `products.image_url` se cambia desde la base y se ve al instante, sin tocar código.

### P-15 · Micro-interacciones y animación por scroll

**Estado:** abierto

_Scroll-driven animations_, _sticky sections_, _parallax_, _staggered reveals_. Skill `tododeia-animaciones` sin instalar. AOS resuelve la parte de scroll con tres líneas — ver `docs/blueprints/dashboard-admin.md:148`.
Ya se puede tomar: el bento se migró a React el 2026-08-25, así que animarlo ya no es trabajo que se tire.

### P-16 · Escalas de 10 tonos por color

**Estado:** abierto · **Referencia:** `docs/blueprints/direccion-rediseno-2026.md:38`

Hoy hay un hex por rol. Se generan con `color.scale()` de Sass o `color-mix()` nativo.

---

## ⚪ Congelado por decisión del 2026-08-13

Fidelización · Afiliados · BuildAds · ProductAds

Congelado hasta que el dueño de la carnicería entregue márgenes reales. **Congelado no es pendiente**: no se trabaja, no se planea y no cuenta como deuda. Ver `docs/DECISION_ALCANCE_2026-08-13.md`.

---

## Orden de ataque

```
TANDA 1   P-18, P-04              el sitio público por fin muestra el trabajo
          P-05, P-06                 ← sin P-18 no tiene sentido desplegar
TANDA 2   P-19, P-20              modelar unidad de venta, pieza y despiece
          P-21                       ← el dashboard sale de ahí
TANDA 3   P-09                    parpadeo del bento — RESUELTO en home.tsx:106
TANDA 4   P-10                    modal premium — RESUELTO; conectado al carrito real
TANDA 6   P-15, P-16              animación scroll, escalas de 10 tonos
```

`P-11`, `P-12`, `P-13` se resuelven de paso cuando se toque cada archivo. No merecen tanda propia.
`P-24` se resuelve en cuanto haya sesión de GGA viva.

**Cerrados el 2026-08-25:**

- **P-01** — el precio del pedido lo ponía el cliente. Arreglado en `supabase/migrations/202608210001_precio_server_side.sql`, verificado en producción.
- **P-02** — las dos llaves de Apify filtradas. Rotadas por el dueño en apify.com. Las anteriores ya no son válidas; la vigente se llama `Carniweb` y no vive en el repo.
- **P-17** — los respaldos `.env.bak-*` sueltos en el árbol de trabajo. Borrados, y la regla `.env.bak-*` quedó en el `.gitignore`. De paso se eliminó `.env.example`, que llevaba rastreado desde `10f64909` contra la regla dura de `docs/brain/security.md:5`.

Su rastro vive en los commits `ba3e025f`, `b6ce68e9` y `de277ccb`, no aquí.
