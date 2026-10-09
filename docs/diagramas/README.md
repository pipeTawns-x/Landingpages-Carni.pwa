# Diagramas del proyecto

Diagramas interactivos generados con [Archify](https://github.com/tt-a1i/archify) 3.0.1 (licencia MIT), instalado como skill del proyecto en [`.claude/skills/archify/`](../../.claude/skills/archify/). Cada archivo `.html` es autónomo: se abre con doble clic en cualquier navegador, sin instalar nada, y permite acercar, trazar rutas, cambiar a tema oscuro y exportar desde el botón **Exportar**.

**Estado verificado.** Rama `practicas-ebac` en `f040dbe5`, la revisión fijada en `meta.repository` de cada fuente. El rediseño de la tienda se leyó en `origin/pruebas` en `e29b05e0`. Cada nodo lleva referencias `archivo:línea` (la insignia **SRC** del visor) que Archify comprobó contra los bytes confirmados de esa revisión con `--repo-root`.

## Diagramas

| Diagrama | Qué muestra | Interactivo | Imagen | Vectorial |
|---|---|---|---|---|
| Arquitectura actual (`architecture`) | La tienda, Supabase y Django tal como existen hoy, con lo planeado, congelado o solo de pruebas señalado, y los patrones de diseño verificados en cada pieza | [`arquitectura.html`](arquitectura.html) | [`arquitectura.png`](exportes/arquitectura.png) | [`arquitectura.svg`](exportes/arquitectura.svg) |
| Ciclo de la práctica M14 (`workflow`) | `create_test_products`, `bulk_create`, 500 filas, `dumpdata`, fixture, `all().delete()`, 0 filas, `loaddata` y la lista del admin, con las cifras reales de la terminal | [`ciclo-m14.html`](ciclo-m14.html) | [`ciclo-m14.png`](exportes/ciclo-m14.png) | [`ciclo-m14.svg`](exportes/ciclo-m14.svg) |
| Acceso al panel (`sequence`) | Del inicio de sesión en la tienda a la sesión de Django: lo que existe, el POST pendiente (contrato S4) y la verificación del token con JWKS | [`secuencia-acceso-panel.html`](secuencia-acceso-panel.html) | [`secuencia-acceso-panel.png`](exportes/secuencia-acceso-panel.png) | [`secuencia-acceso-panel.svg`](exportes/secuencia-acceso-panel.svg) |

Los tres pasaron las cuatro compuertas de `archify finalize` en modo `showcase`: validación del esquema, entrega, revisión estricta del HTML y revisión en un navegador real. Los PNG y los SVG salen del menú **Exportar** del propio visor (PNG sin pérdida y SVG claro), en tema claro.

## Cómo leerlos

- **Línea punteada morada o la palabra «planeado» o «pendiente»**: todavía no existe en el código. **Línea punteada roja**: autenticación o decisión de rol, que sí existe.
- Las etiquetas pequeñas al pie de cada nodo (*tags*) nombran el patrón de diseño. En el visor aparecen al acercar el diagrama (175 %); en las exportaciones ya vienen visibles.
- La insignia **SRC n** de cada nodo abre las referencias `archivo:línea` que respaldan lo que dice.
- Las tarjetas bajo el diagrama resumen lo que no cabe en un nodo.

## Patrones de diseño (Refactoring Guru)

Los nombres y las definiciones siguen el [catálogo en español de Refactoring Guru](https://refactoring.guru/es/design-patterns/catalog), que usa los nombres ingleses (Observer, Facade, Proxy…) y menciona entre paréntesis el nombre en español. Solo se dibujan como patrón los que el código muestra; las analogías y los descartes se declaran aparte.

### Confirmados en código propio

| Patrón | Dónde | Por qué |
|---|---|---|
| [Observer](https://refactoring.guru/es/design-patterns/observer) (Observador) | [`src/redux/store.ts:116-152`](../../src/redux/store.ts#L116-L152)<br>[`js/modules/core/cart.js:55-65`](../../js/modules/core/cart.js#L55-L65)<br>[`src/hooks/usePedido.ts:130-131`](../../src/hooks/usePedido.ts#L130-L131)<br>[`js/modules/core/cart.js:657`](../../js/modules/core/cart.js#L657) | El store de Redux avisa a su suscripción cuando cambia el pedido; esta lo guarda y emite `cart:updated`, y `usePedido` y el carrito clásico se suscriben a ese evento en lugar de llamarse entre islas que no comparten árbol. |
| [Observer](https://refactoring.guru/es/design-patterns/observer) (Observador) | [`backend/ecommerce/signals.py:32-42`](../../backend/ecommerce/signals.py#L32-L42)<br>[`backend/ecommerce/apps.py:9-11`](../../backend/ecommerce/apps.py#L9-L11)<br>[`backend/ecommerce/tests.py:147-150`](../../backend/ecommerce/tests.py#L147-L150)<br>[`backend/ecommerce/tests.py:152-161`](../../backend/ecommerce/tests.py#L152-L161) | `fill_product_slug` se suscribe a `pre_save` y Django la notifica antes de cada guardado; `bulk_create` no la envía y `loaddata` la envía con `raw=True`, por eso el ciclo M14 fija los slugs a mano. |
| [Facade](https://refactoring.guru/es/design-patterns/facade) (Fachada) | [`backend/inventory/services.py:85-112`](../../backend/inventory/services.py#L85-L112)<br>[`backend/inventory/services.py:120-133`](../../backend/inventory/services.py#L120-L133)<br>llamadas: [`backend/inventory/views.py:82`](../../backend/inventory/views.py#L82), [`backend/inventory/views.py:175`](../../backend/inventory/views.py#L175), [`backend/inventory/admin.py:137-150`](../../backend/inventory/admin.py#L137-L150) | `services.py` reduce el subsistema (modelos espejo, savepoint, reglas) a pocas funciones que llaman las vistas y el admin; es un módulo de funciones, no una clase. |
| [Facade](https://refactoring.guru/es/design-patterns/facade) (Fachada) | [`js/modules/supabase.js:15-92`](../../js/modules/supabase.js#L15-L92)<br>llamadas: [`src/entry/shared.tsx:2`](../../src/entry/shared.tsx#L2), [`src/pages/ProductoDetalle.tsx:4`](../../src/pages/ProductoDetalle.tsx#L4) | `getProducts`, `getCategories`, `createOrder`… esconden las consultas de supabase-js, el nombre del RPC y el mapeo de parámetros que las islas y los módulos de la tienda no necesitan conocer. |
| [Proxy](https://refactoring.guru/es/design-patterns/proxy) (Proxy de protección) | [`backend/panel/access.py:82-103`](../../backend/panel/access.py#L82-L103)<br>usos: [`backend/inventory/views.py:27-28`](../../backend/inventory/views.py#L27-L28), [`backend/inventory/views.py:165-166`](../../backend/inventory/views.py#L165-L166), [`backend/panel/views.py:115-116`](../../backend/panel/views.py#L115-L116) | `panel_admin_required` conserva la firma de la vista, comprueba la sesión del traspaso y `profiles.role`, y solo entonces delega en la vista; envuelve las cinco vistas de productos, `inicio` y `mas`. |
| [Decorator](https://refactoring.guru/es/design-patterns/decorator) (Decorador) | [`backend/panel/views.py:49-53`](../../backend/panel/views.py#L49-L53) | Cuatro decoradores apilados (`csrf_exempt`, `require_POST`, `sensitive_post_parameters`, `never_cache`) añaden cada uno un comportamiento a la vista `sesion` sin modificarla. |
| [Singleton](https://refactoring.guru/es/design-patterns/singleton) (Instancia única) | [`backend/panel/supabase_auth.py:71-80`](../../backend/panel/supabase_auth.py#L71-L80)<br>[`js/modules/supabase.js:15-27`](../../js/modules/supabase.js#L15-L27) | `@lru_cache(maxsize=1)` entrega siempre el mismo `PyJWKClient` y su caché de llaves, y `supabase.js` se evalúa una vez, así que todos importan el único `createClient`; son variantes idiomáticas, sin constructor privado. |

### Patrones que aporta el framework y que el proyecto usa

| Patrón | Dónde | Por qué |
|---|---|---|
| [Template Method](https://refactoring.guru/es/design-patterns/template-method) (Método plantilla) | [`backend/templates/panel/base.html:101-108`](../../backend/templates/panel/base.html#L101-L108)<br>[`backend/templates/inventory/product_list.html:17-22`](../../backend/templates/inventory/product_list.html#L17-L22) | `base.html` fija el esqueleto de toda página del panel y cada plantilla solo rellena los bloques `title`, `titulo`, `accion` y `contenido`. |
| [Template Method](https://refactoring.guru/es/design-patterns/template-method) (Método plantilla) | [`backend/ecommerce/management/commands/create_test_products.py:13-30`](../../backend/ecommerce/management/commands/create_test_products.py#L13-L30)<br>[`backend/inventory/admin.py:130-150`](../../backend/inventory/admin.py#L130-L150) | `Command` hereda de `BaseCommand` y sobrescribe `add_arguments` y `handle`, y `ProductAdmin` redefine ganchos de `ModelAdmin`; el método plantilla vive en Django. |
| [Chain of Responsibility](https://refactoring.guru/es/design-patterns/chain-of-responsibility) (Cadena de responsabilidad) | [`backend/config/settings.py:72-80`](../../backend/config/settings.py#L72-L80) | `MIDDLEWARE` es la cadena: cada middleware procesa la petición y la pasa al siguiente o la corta; el proyecto solo decide el orden. |

Referencias del framework (Django 5.2.17, instalado en `backend/.venv`): `django/core/management/base.py:439-464` y `:621` (`execute` llama a `handle`, que es abstracto), `django/db/models/base.py:988` (`save_base` envía `pre_save`), `django/db/models/query.py:758-759` (`bulk_create` no llama a `save()` ni envía señales), `django/core/serializers/base.py:264-265` (`loaddata` guarda con `raw=True`), `django/core/handlers/base.py:26-99` (arma la cadena de middleware) y `django/contrib/admin/options.py:392`, `:1317` y `:1323` (los ganchos de `ModelAdmin`).

### Analogías (se muestran como analogía, no como patrón)

| Patrón | Dónde | Por qué |
|---|---|---|
| [Memento](https://refactoring.guru/es/design-patterns/memento) (Recuerdo) | [`backend/ecommerce/README.md:31-38`](../../backend/ecommerce/README.md#L31-L38)<br>[`backend/ecommerce/tests.py:201-225`](../../backend/ecommerce/tests.py#L201-L225) | `dumpdata` y `loaddata` guardan y restauran el estado de una tabla, y la prueba de ida y vuelta comprueba que pk, slug y precio vuelven iguales. Es solo una analogía: el fixture expone todos los valores y no hay un originador que se restaure a sí mismo. |
| [Command](https://refactoring.guru/es/design-patterns/command) (Comando) | [`backend/ecommerce/management/commands/create_test_products.py:13-30`](../../backend/ecommerce/management/commands/create_test_products.py#L13-L30)<br>[`backend/ecommerce/tests.py:30`](../../backend/ecommerce/tests.py#L30) | `create_test_products` es un objeto que encapsula una operación y sus argumentos, y el invocador (`manage.py` o `call_command`) lo ejecuta por una interfaz común. Falta lo que distingue al patrón: cola, historial o deshacer. |
| [Adapter](https://refactoring.guru/es/design-patterns/adapter) (Adaptador) | [`backend/panel/access.py:26-50`](../../backend/panel/access.py#L26-L50)<br>[`backend/panel/supabase_auth.py:57-63`](../../backend/panel/supabase_auth.py#L57-L63) | `get_or_create_panel_user` traduce una identidad de Supabase al usuario de Django para que `login()` y las sesiones funcionen sin cambios. Convierte datos; no envuelve un objeto con otra interfaz. |
| [Bridge](https://refactoring.guru/es/design-patterns/bridge) (Puente) / [Strategy](https://refactoring.guru/es/design-patterns/strategy) (Estrategia) por configuración | [`backend/config/settings_test.py:33-38`](../../backend/config/settings_test.py#L33-L38)<br>[`backend/manage.py:17-24`](../../backend/manage.py#L17-L24)<br>[`backend/config/checks.py:25-26`](../../backend/config/checks.py#L25-L26) | El ORM de Django trabaja contra un motor intercambiable y las pruebas cambian Postgres por SQLite sin tocar los modelos. El patrón lo implementa Django; el proyecto solo elige la implementación. |

### Revisados y no contados

| Patrón | Dónde | Por qué |
|---|---|---|
| [Proxy](https://refactoring.guru/es/design-patterns/proxy) (Proxy de caché) en el service worker | [`js/modules/utils/service-worker.js:51-106`](../../js/modules/utils/service-worker.js#L51-L106)<br>[`js/modules/core/api.js:5-17`](../../js/modules/core/api.js#L5-L17)<br>[`docs/PENDIENTES.md:46-56`](../../docs/PENDIENTES.md#L46-L56) | El código sí implementa el patrón (red primero para `/rest/v1/`, caché primero para lo demás), pero `registerServiceWorker()` nadie la llama en ninguna rama: es código muerto, y el pendiente P-05 lo confirma. No se cuenta como patrón en uso. |
| [Strategy](https://refactoring.guru/es/design-patterns/strategy) (Estrategia) en la verificación del token (JWKS o secreto) | [`backend/panel/supabase_auth.py:83-96`](../../backend/panel/supabase_auth.py#L83-L96) | Una sola bifurcación `if` devuelve la clave y los algoritmos según la configuración. No hay una familia de objetos intercambiables: es el estado previo a un Strategy y, con dos variantes, no se justifica. |
| [Composite](https://refactoring.guru/es/design-patterns/composite) (Objeto compuesto) en el árbol de React | [`src/components/ProductList/ProductList.tsx:41-53`](../../src/components/ProductList/ProductList.tsx#L41-L53) | El árbol de componentes es el modelo de React, no un diseño propio: ningún componente de `src/components` declara una interfaz común de contenedor y hoja (ninguno usa `children`). Los contenedores con `children` existen en `pruebas` ([`pruebas:src/ui/Carcasa.tsx:15-28`](https://github.com/pipeTawns-x/Landingpages-Carni.pwa/blob/e29b05e0ae3540fce6ab5ce8450a95d317bcaff8/src/ui/Carcasa.tsx#L15-L28)), pero sería atribuirle al proyecto lo que ya hace el framework. |
| [Decorator](https://refactoring.guru/es/design-patterns/decorator) (Decorador) en `withErrorHandling` | [`js/modules/supabase.js:321-330`](../../js/modules/supabase.js#L321-L330) | Está definida y exportada, pero ningún archivo la aplica. |
| `ReadOnlyModel` y `ReadOnlyQuerySet` | [`backend/inventory/models.py:165-200`](../../backend/inventory/models.py#L165-L200) | No encaja en el catálogo: es una salvaguarda por herencia que hace fallar las escrituras sobre los espejos de tablas de Supabase. |

## Lo que dice el código

Hallazgos que corrigen supuestos habituales sobre el proyecto:

- **React es la versión 18**, no la 19 ([`package.json:35-36`](../../package.json#L35-L36)). Tailwind v4 está solo en la rama `pruebas` ([`pruebas:package.json:50`](https://github.com/pipeTawns-x/Landingpages-Carni.pwa/blob/e29b05e0ae3540fce6ab5ce8450a95d317bcaff8/package.json#L50) y [`pruebas:package.json:63`](https://github.com/pipeTawns-x/Landingpages-Carni.pwa/blob/e29b05e0ae3540fce6ab5ce8450a95d317bcaff8/package.json#L63)); en esta revisión la tienda usa styled-components.
- **El panel de Django no usa React.** Es HTML con una hoja de Tailwind v4 compilada en Docker, sin JavaScript: [`backend/README.md:284-286`](../../backend/README.md#L284-L286) y una prueba que falla si una página del panel lleva `<script>` ([`backend/panel/test_frame.py:114-116`](../../backend/panel/test_frame.py#L114-L116)). Las islas de React existen solo en la tienda ([`src/entry/shared.tsx:155-163`](../../src/entry/shared.tsx#L155-L163)).
- **El traspaso de la tienda al panel no está conectado.** Django ya implementa `/panel/sesion/` ([`backend/panel/views.py:49-82`](../../backend/panel/views.py#L49-L82)), pero la tienda manda al administrador a `index.html` ([`js/modules/core/auth.js:215-219`](../../js/modules/core/auth.js#L215-L219) y [`js/modules/utils/admin-auth.js:46-49`](../../js/modules/utils/admin-auth.js#L46-L49)); en `pruebas` lo manda a `dashboar.html` ([`pruebas:js/modules/core/auth.js:216-219`](https://github.com/pipeTawns-x/Landingpages-Carni.pwa/blob/e29b05e0ae3540fce6ab5ce8450a95d317bcaff8/js/modules/core/auth.js#L216-L219)). El contrato lo deja como S4 ([`docs/CONTRATO_PANEL_DJANGO.md:70-74`](../../docs/CONTRATO_PANEL_DJANGO.md#L70-L74)).
- **El service worker existe, pero nadie lo registra** ([`js/modules/core/api.js:5-17`](../../js/modules/core/api.js#L5-L17) y [`docs/PENDIENTES.md:46-56`](../../docs/PENDIENTES.md#L46-L56)). El manifiesto sí está enlazado. El README dice «PWA + Offline: Funcional» ([`README.md:82`](../../README.md#L82)); no coincide con el código.
- **Alojamiento.** La tienda se publica en Netlify (producción, desde `main`) y en GitHub Pages (muestrario) ([`docs/PENDIENTES.md:31-39`](../../docs/PENDIENTES.md#L31-L39) y [`.github/workflows/deploy-pages.yml:3-6`](../../.github/workflows/deploy-pages.yml#L3-L6)). Django no tiene despliegue: el contrato lo describe solo en local ([`docs/CONTRATO_PANEL_DJANGO.md:120`](../../docs/CONTRATO_PANEL_DJANGO.md#L120)) y `origin/main` no contiene `backend/` (comprobado con `git ls-tree origin/main`). `netlify.toml` declara `functions` y `edge_functions` ([`netlify.toml:4-5`](../../netlify.toml#L4-L5)), pero ninguna de las dos carpetas existe.
- **Sin conectar.** La API de BuildAds (`server/`, [`server/app.ts:1-27`](../../server/app.ts#L1-L27)) solo corre con `npm run api:dev`, su pantalla no es una entrada de Vite ([`vite.config.js:26-33`](../../vite.config.js#L26-L33)) y la funcionalidad está congelada ([`README.md:194`](../../README.md#L194)). El asistente de `pruebas` es un esqueleto que devuelve `null` ([`pruebas:src/asistente/Asistente.tsx:5-8`](https://github.com/pipeTawns-x/Landingpages-Carni.pwa/blob/e29b05e0ae3540fce6ab5ce8450a95d317bcaff8/src/asistente/Asistente.tsx#L5-L8)).
- **Comentario desactualizado.** [`backend/config/settings.py:176-178`](../../backend/config/settings.py#L176-L178) dice que el Supabase local firma con HS256, pero el contrato y el README documentan que firma con ES256 y usa JWKS ([`docs/CONTRATO_PANEL_DJANGO.md:98`](../../docs/CONTRATO_PANEL_DJANGO.md#L98)). El código no depende del comentario.
- **Cifras de M14.** `ecommerce/tests.py` tiene 22 pruebas y el backend completo 371 (conteo de funciones `test_`; coincide con la última corrida de `manage.py test`). La captura `docs/entrega-m14/07-terminal-pruebas.png` todavía muestra 38.

## Cómo regenerarlos

Las fuentes son JSON (en [`fuentes/`](fuentes/)), cada uno un candidato de Archify con sus `sources` por nodo; ese JSON es la fuente de verdad y se edita a mano, así que un cambio de arquitectura es un cambio de texto revisable. Desde la raíz del repositorio:

```bash
export ARCHIFY_CHROME="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"   # o el Chrome o Chromium que se use
node .claude/skills/archify/bin/archify.mjs finalize architecture docs/diagramas/fuentes/arquitectura.json docs/diagramas/arquitectura.html --quality showcase --repo-root . --out-dir "$TMPDIR/archify-arquitectura" --json
node .claude/skills/archify/bin/archify.mjs finalize workflow docs/diagramas/fuentes/ciclo-m14.json docs/diagramas/ciclo-m14.html --quality showcase --repo-root . --out-dir "$TMPDIR/archify-ciclo-m14" --json
node .claude/skills/archify/bin/archify.mjs finalize sequence docs/diagramas/fuentes/secuencia-acceso-panel.json docs/diagramas/secuencia-acceso-panel.html --quality showcase --repo-root . --out-dir "$TMPDIR/archify-secuencia" --json
```

Requisitos: Node 18 o superior y un Chrome o Chromium para la revisión en navegador; aquí se usó Brave, indicado con `ARCHIFY_CHROME`. `--out-dir` deja los resúmenes y los recibos del navegador fuera de esta carpeta, que solo conserva las fuentes, los `.html` y las exportaciones. `finalize` también escribe un `*.delivery.json` junto a cada `.html` (la procedencia que liga el HTML con su fuente). No se versiona, porque guarda la ruta absoluta de la máquina donde se generó; cada corrida lo vuelve a crear.

`--repo-root .` hace que Archify compare cada referencia `archivo:línea` con los bytes confirmados de la revisión que fija `meta.repository` (`f040dbe50984c06a8ca9a2de6518ced108f69761`). Cuando el código cambie, hay que actualizar esa revisión y las líneas de cada nodo; si no, la compuerta de validación lo rechaza.

Para volver a sacar las imágenes: abrir el `.html`, **Exportar** y elegir **PNG** y **SVG · Claro**; guardarlos en [`exportes/`](exportes/).

## Para las entregas del LMS

Los PNG de `exportes/` están en tema claro y a alta resolución, listos para pegar en el documento de entrega; enlaza además el `.html` del repositorio para que quien revise pueda explorar el diagrama.
