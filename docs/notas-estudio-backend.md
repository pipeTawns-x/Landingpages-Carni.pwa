# Notas de estudio · bloque de backend

Lo que fui aprendiendo mientras metía Django en Carni-mvp, del 15 al 22 de septiembre de 2026.
Cada punto dice de dónde salió: una lección del LMS, la documentación oficial, un archivo del
repositorio o algo que se rompió y hubo que arreglar.

La lista sigue abierta. Los módulos 14 (Django Admin) y 15 (Django Templates) todavía no empiezan.

---

## 1. Cómo encajan las piezas del stack

Piénsalo como una casa:

| Pieza | Qué hace en Carni | En la casa |
|---|---|---|
| Supabase | Base de datos, login y reglas de seguridad por fila | El terreno y los cimientos |
| Django | Lógica del negocio, panel protegido en el servidor | La estructura y las instalaciones |
| DRF | La ventanilla por donde React pide datos en JSON | Las ventanillas de servicio |
| React | Las piezas interactivas: carrito, lupa, ficha | Los muebles que se mueven |
| Tailwind | El estilo visual | La pintura |

La pintura sirve en cualquier cuarto, lo sirva Vite o lo sirva Django. Por eso no chocan.

**Supabase y Django trabajan juntos, no se reemplazan.** Una sola base de datos con dos puertas:
la tienda entra por una y el panel por la otra. Django no sustituye a Supabase porque los usuarios
y sus contraseñas viven en Supabase Auth, la tienda es estática y se hospeda en GitHub Pages, que no
corre Python, y habría que rehacer las reglas de seguridad por fila, el almacenamiento de archivos
y el tiempo real.

Fuente: análisis de 9 agentes del 15-sep y el handoff del chat de diseño.

**El carrito es trifásico.** Se vende por peso (kg, g o lb), por precio o por piezas, y la base
guarda todo convertido a kilos. Confundir cómo se guarda con cómo se vende fue mi primer error
en este bloque. Fuente: `js/modules/core/quote.js`.

---

## 2. Django por dentro

**El camino de una petición:** dirección → `urls.py` → vista → modelo (ORM) → Postgres → plantilla →
HTML de vuelta. Fuente: lecciones 13.2 a 13.6 del módulo Django Views.

**Django no genera páginas solas.** La única interfaz automática es el Admin
(`admin.site.register`, lección 13.3). Las páginas de la práctica son HTML que uno escribe y que la
vista rellena con `render()` (lección 13.4). `ListView` y `UpdateView` son lógica ya hecha, no
páginas: igual hay que escribir la plantilla.

Ojo con el glosario del módulo: menciona `RetrieveView`, que no existe en Django. La clase real
para el detalle es `DetailView`; `RetrieveAPIView` es de DRF.

**Las plantillas se pueden estilizar con Tailwind**, porque una plantilla es un archivo HTML y
Tailwind lee las clases que uno escribe ahí. El propio template del curso
(`nickjj/docker-django-example`) ya trae Tailwind 4.1.11 con `@import "tailwindcss" source("/app")`.

**Anatomía del proyecto que armamos:**

- `uv` con `pyproject.toml` y `uv.lock`: cualquier máquina instala exactamente lo mismo.
- `require_env()` en la configuración: si falta una variable, el proyecto no arranca y dice cuál.
  Mejor eso que arrancar con un valor inseguro por defecto.
- `search_path=django,public`: las tablas de Django van a su esquema y las de la tienda se quedan
  en el suyo.
- Solo existe `backend/.env`, privado y documentado con comentarios adentro.

**Por qué no corrimos `migrate` en el paso 1:** si el esquema `django` no existe, Postgres lo salta
y crea las tablas en `public`, mezcladas con las de la tienda. Por eso el chequeo `config.E001`
detiene `migrate` cuando falta el esquema.

---

## 3. Decisiones de datos que no estaban en el enunciado

**`managed = False`.** Los modelos que reflejan tablas ajenas se declaran así: Django lee y escribe
filas, pero nunca cambia su estructura. Como la práctica exige migraciones reales, los atributos
nuevos viven en una tabla propia de Django unida uno a uno con el producto.

**Borrar no siempre es borrar.** `order_items.product_id` está en `ON DELETE RESTRICT`: borrar un
corte que ya aparece en pedidos rompería el historial de ventas, así que se desactiva. En cambio
`favorites.product_id` está en `ON DELETE CASCADE`, y ahí el producto sí desaparece de las listas
de favoritos de los clientes; el panel lo avisa. Fuente: las llaves foráneas de la base, consultadas
con `psql`.

**Dinero con `DecimalField`, nunca con `FloatField`.** Los flotantes arrastran errores de redondeo.
El profe usa `FloatField` en clase; esto es una corrección consciente.

**Un rol de Postgres propio para Django.** `postgres` y `service_role` se saltan las reglas de
seguridad por fila. El rol nuevo tiene solo los permisos que usa, y lee a través de políticas, no
alrededor de ellas.

---

## 4. Seguridad y autenticación

**Recuperar la contraseña no es un CRUD.** Un CRUD administra un recurso: se crea, se lista, se ve,
se edita y se borra. Recuperar la contraseña es un flujo de autenticación: se prueba quién eres y
después se cambia un secreto. La contraseña no se lee nunca, porque se guarda cifrada.

**Se resuelve en Supabase, no con `PasswordResetView` de Django**, porque los usuarios viven en
Supabase Auth. El flujo es `resetPasswordForEmail`, plantilla con `{{ .Token }}`,
`verifyOtp({ type: 'recovery' })` y `updateUser({ password })`. Fuente: documentación oficial de
Supabase, leída el 16-sep.

Dos trampas: el correo por defecto de Supabase solo llega a miembros del equipo de la organización,
y desde el 3 de junio de 2026 los proyectos gratuitos nuevos no pueden editar las plantillas si usan
ese correo. Para clientes de verdad hace falta un servidor de correo propio.

**En el panel de Supabase:** "Send password recovery" manda un correo para cambiar la contraseña y
"Send magic link" manda uno para entrar sin contraseña. Los dos llevan a la Site URL, así que si esa
dirección está mal, ningún correo sirve. La sesión queda guardada por dominio.

**Para cambios sensibles** (precios, mínimos, apariencia) las capas van en este orden: validar en el
servidor, mostrar el antes y el después, limitar por permisos, pedir un segundo factor, dejar
bitácora de quién cambió qué. La verificación en dos pasos con app autenticadora es gratis en
Supabase y deja la marca `aal2` en el token, que Django y las políticas pueden exigir.

---

## 5. Git y el flujo de trabajo

**Tres ramas:** `practicas-ebac` para las prácticas construidas como producto, `pruebas` para el
rediseño y la migración, `main` para lo estable. El producto de las prácticas sí llega a main,
adaptado; el material educativo no.

**Un worktree es otra carpeta del mismo repositorio en otra rama.** Sirve para que dos sesiones
trabajen en paralelo sin cambiarse la rama entre ellas.

**Los commits se arman por unidad de trabajo.** En esta entrega primero fueron las reglas
(`080923cf`) y después el código juzgado por esas reglas (`2aa59f32`). Si van juntos, el código se
revisa con reglas que todavía no existían.

**Los hooks son programas que git corre solo.** El de pre-commit ejecuta GGA, que manda los archivos
a revisar con `AGENTS.md` como reglamento y bloquea el commit si no aprueba. El de post-commit
reconstruye el grafo del proyecto. Saltarse el guardia con `--no-verify` es cómo entran los
errores.

**El trabajo entra por pull request**, no empujado directo a la rama. Así queda revisable y el PR
carga la explicación técnica.

**Cómo se reparte la información de una entrega**, sin repetirla en tres lugares: el mensaje del LMS
lleva saludo, enlaces y despedida; el repositorio y su PR llevan el detalle técnico; el Word lleva
la explicación del código.

---

## 6. Los errores que cometí y cómo salieron a la luz

Esta sección vale más que las otras cinco.

**Dije que todo se vendía por kilo.** Leí la tabla de la base y confundí cómo se guarda un dato con
cómo se vende. Lo corregiste vos y lo verifiqué en `quote.js`.

**Marqué como riesgo una llave del clima que era falsa.** Estaba en el primer commit del
repositorio, pero su valor era `your-o…`, un texto de ejemplo. Alarmé sin mirar el valor.

**Creé un `.env.example`.** Tu regla lo prohíbe y, además, la línea 78 de tu propio `AGENTS.md` ya lo
decía: el contrato de entorno es `.env`, sin archivos espejo.

**Empujé los commits del panel directo a la rama.** Debieron ir por pull request desde el principio.

En el código, la revisión con contexto fresco encontró tres cosas antes de commitear: una dirección
con `?category=abc` tiraba la lista con error 500, no había validación contra precios negativos, y
abrir el formulario de edición escribía una fila vacía en la base. Un GET nunca debe escribir.

**Lo que aprendí del método, no del código:** una revisión hecha por alguien que no escribió el
código encuentra lo que el autor ya no ve. Por eso el guardia del commit y el revisor aparte no son
burocracia.

---

## 7. Herramientas que quedaron aprendidas

- El bash que trae macOS es de 2007 y no puede cargar configuración con `source <(...)`. Por eso
  GGA parecía no tener proveedor: el arreglo fue instalar el bash de Homebrew.
- El `claude` de la terminal tiene su propio login, separado de la aplicación.
- Para capturar el panel sin escribir contraseñas: crear la sesión desde `manage.py shell`, bajar las
  páginas con `curl` usando esa cookie y renderizarlas con Chrome sin ventana.
- Al enviar un formulario con `curl` hace falta el frasco de cookies, porque Django compara la cookie
  del token con el campo del formulario; sin eso responde 403.
- Los diagramas del Word están hechos en HTML y CSS, y capturados. Sale más limpio que con una
  librería de dibujo.
