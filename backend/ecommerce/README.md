# ecommerce — EBAC practices M14 and M15

This app holds two practices of the course: M14 (Django Models & Admin), which is
everything down to the "Práctica M15" section, and M15 (Django Class-based Views),
which is that section.

The M14 assignment: create 500 sample products in bulk with a loop, dump them to a
fixture, delete the whole queryset and load them back from the fixture.

`ecommerce` is a course-only app with a standalone `Product` model. Its table,
`django.ecommerce_product`, is Django-owned and unrelated to the Supabase
catalog. The store-side changes that came with the practice live in `inventory/`
and are described in [`../README.md`](../README.md). Paths below are relative to
`backend/`, where every command runs.

## Where each requirement lives

| Requirement | File |
| --- | --- |
| 500 products created with a loop | `ecommerce/sample_data.py::build_sample_products` (deterministic names, slugs and prices; explicit slugs) |
| `bulk_create` in batches | `ecommerce/management/commands/create_test_products.py` (`--count` 500, `--batch-size` 100) |
| Fixture | `ecommerce/fixtures/products/500Products.json` (500 objects) |
| Delete the whole queryset | `Product.objects.all().delete()` (see the commands below) |
| Reload with `loaddata` | the same fixture file |
| Admin registration | `ecommerce/admin.py` (list, filter, search, read-only slug and timestamps) |
| Abstract model | `ecommerce/models.py::TimeStampedModel` (`created_at`, `updated_at`), inherited by `Product` |
| Slug generated on save | `ecommerce/signals.py` (`pre_save` receiver; `-2`, `-3`... suffix on duplicates) |
| Migration | `ecommerce/migrations/0001_initial.py` |
| Tests | `ecommerce/tests.py` (`uv run python manage.py test ecommerce`) |

## Commands

In the order of the assignment (run from `backend/`):

```bash
uv run python manage.py migrate ecommerce
uv run python manage.py create_test_products
mkdir -p ecommerce/fixtures/products
uv run python manage.py dumpdata ecommerce --indent 4 --format json > ecommerce/fixtures/products/500Products.json
uv run python manage.py shell -v 0 -c "from ecommerce.models import Product; print(Product.objects.all().delete())"
uv run python manage.py loaddata ecommerce/fixtures/products/500Products.json
```

## Things worth knowing

- Always run `migrate` with the app label. `migrate ecommerce` creates the practice
  table and, since M15, the first migration of `auth` if the database does not have it
  yet (`Product.owner` points to the user model); see the warning at the end of
  `../README.md` for a bare `migrate`.
- `bulk_create()` does not call `save()` and sends no `pre_save`, so the slug
  signal never runs for the bulk-created products. `sample_data.py` sets every
  slug itself.
- `create_test_products` refuses to run when any slug it would create already
  exists, so a second run never inserts a partial batch. Delete the products
  first (the fifth command above).
- `loaddata` saves rows as they are in the file (`raw=True`): the slug signal
  returns early, and `created_at` and `updated_at` keep the timestamps stored in
  the fixture.
- The names, slugs and prices are deterministic, but the primary keys and the
  timestamps are not: regenerating the fixture produces new ones.

## Práctica M15 (Django Class-based Views)

El enunciado: crear la clase `ProtectedListView`, que hereda de `LoginRequiredMixin`;
agregarla a las URLs en la ruta `my-products`; y sobrescribir `get_queryset` para que
solo aparezcan los productos del usuario que hace la petición. El commit se llama
"Django Class-based Views".

### Dónde vive cada requisito

| Requisito | Archivo |
| --- | --- |
| `ProtectedListView(LoginRequiredMixin, ListView)` | `ecommerce/views.py` |
| `get_queryset` filtrado por el usuario de la petición | `ecommerce/views.py::ProtectedListView.get_queryset` |
| La ruta `my-products` | `ecommerce/urls.py` (nombre `ecommerce:my-products`), incluida desde `config/urls.py`: la URL es `/my-products/` |
| Qué producto es de quién | `Product.owner` (`ecommerce/models.py`) y la migración `ecommerce/migrations/0002_product_owner.py` |
| A dónde va quien no ha iniciado sesión | `LOGIN_URL = "panel:acceso"` en `config/settings.py` |
| La página | `templates/ecommerce/my_products.html`, sobre el marco `panel/base.html` |
| Darle productos a un usuario | `ecommerce/management/commands/assign_sample_products.py` |
| El dueño en el admin | `ecommerce/admin.py` (columna y filtro `owner`) |
| Pruebas | `ecommerce/test_m15.py` (`uv run python manage.py test ecommerce.test_m15`) |

### Qué cambia con una vista basada en clase

Una vista basada en función (FBV) es una función que recibe el `request` y devuelve una
respuesta; la de `inventory/views.py` hace todo en un solo cuerpo. Una vista basada en
clase (CBV) es una clase: `as_view()` la convierte en una función que, en cada petición,
crea una instancia y llama a `dispatch()`, y `dispatch()` elige el método que corresponde
al verbo HTTP (`get()` para un GET). Lo que se gana es reutilizar comportamiento por
herencia: `ListView` ya sabe consultar, paginar y renderizar una lista, y
`LoginRequiredMixin` ya sabe exigir sesión. Lo que se paga es que el flujo queda repartido
entre varios métodos de varias clases, y hay que saber en qué orden se ejecutan.

`ListView` trae lo siguiente, y la vista solo declara lo que cambia:

| Atributo o método | Para qué sirve aquí |
| --- | --- |
| `model = Product` | De dónde salen los objetos (`get_queryset()` devuelve `Product.objects.all()`). |
| `template_name` | La plantilla. Sin él, Django buscaría `ecommerce/product_list.html`. |
| `context_object_name = "products"` | El nombre de la lista en la plantilla (sin él, la plantilla recibiría `object_list` y `product_list`). |
| `paginate_by = 50` | Pagina de 50 en 50 y agrega `page_obj`, `paginator` e `is_paginated` al contexto. |
| `ordering` | El orden del queryset. |
| `get_queryset()` | El punto donde se decide **qué** objetos se listan. |

### Por qué `LoginRequiredMixin` va primero

Python busca cada método de izquierda a derecha en los ancestros de la clase (el MRO).
Con `class ProtectedListView(LoginRequiredMixin, ListView)` el MRO empieza
`LoginRequiredMixin`, `AccessMixin`, `ListView`... y el primer `dispatch()` que se
encuentra es el del mixin: revisa `request.user.is_authenticated` y, si no hay sesión,
responde con la redirección a `LOGIN_URL` sin leer un solo producto; si la hay, llama a
`super().dispatch()` y la petición sigue su camino hacia `ListView`.

Con las bases al revés, `class ProtectedListView(ListView, LoginRequiredMixin)`, el primer
`dispatch()` que aparece es el de `View`, que no llama a `super()`: el del mixin nunca se
ejecuta, el visitante anónimo no es redirigido y llega a `get_queryset()` con un
`AnonymousUser`. Una prueba fija el orden (`test_the_login_mixin_comes_first...`).

### `get_queryset` y el dueño

```python
def get_queryset(self):
    return super().get_queryset().filter(owner=self.request.user)
```

`super().get_queryset()` aplica `model` y `ordering`; el `filter` lo recorta a los
productos cuyo `owner` es quien hace la petición. Un producto sin dueño (`owner` nulo) no
es igual a ningún usuario, así que no aparece para nadie. `self.request.user` nunca es
anónimo en ese punto, porque el mixin ya mandó a esos visitantes al login.

`ordering = ("name", "pk")` no lo pide el enunciado: `Product.Meta.ordering` solo ordena por
nombre, y dos productos con el mismo nombre podrían repetirse o saltarse al cambiar de
página. El `pk` desempata.

`Product.owner` es una `ForeignKey` a `settings.AUTH_USER_MODEL` (nunca a `auth.User`
directamente, para no atarse a un modelo de usuario concreto), con:

- `on_delete=SET_NULL` y `null=True`: borrar un usuario deja sus productos sin dueño. Con
  `CASCADE` borrarlo borraría también todos sus productos.
- `related_name="sample_products"`: `user.sample_products.all()` son los productos de ese
  usuario.

### `LOGIN_URL` apunta al puente del panel

`LoginRequiredMixin` redirige a `settings.LOGIN_URL`. Aquí vale `"panel:acceso"`, el puente
que ya existe (`GET /panel/acceso/`), porque en este proyecto Django no guarda contraseñas:
el usuario inicia sesión en Supabase, en la tienda, y la tienda entrega la sesión a Django.
El puente manda a quien no tiene sesión al login de la tienda.

Dos cosas que conviene saber:

- El puente **ignora** el `?next=` que Django le agrega (`/panel/acceso/?next=/my-products/`).
  Tras iniciar sesión en la tienda, la persona cae en el panel (`/panel/`) y tiene que volver
  a escribir `/my-products/`. No se cambió el puente para que respete `next`: abrir esa
  redirección a una dirección que viene de la URL pide validarla (`url_has_allowed_host_and_scheme`)
  y es otra práctica.
- `LoginRequiredMixin` solo exige haber iniciado sesión; **no** comprueba el rol de
  administrador. Las vistas del panel sí (`panel_admin_required` lo lee de Supabase en cada
  petición). `/my-products/` no está detrás de ese decorador porque el enunciado pide el
  mixin, y por eso solo muestra los productos de práctica del propio usuario.

### La página

`templates/ecommerce/my_products.html` extiende `panel/base.html` sin modificarlo (llena los
bloques `title`, `titulo`, `accion` y `contenido`). Muestra nombre, precio, existencia y si
el producto está activo, la paginación, un estado vacío y un enlace al catálogo del panel
(`/panel/productos/`). No lleva `<script>`, y solo usa clases que la hoja de estilos
compilada del panel ya define, así que no hizo falta recompilarla: una prueba lo comprueba y
`backend/scripts/build_panel_css.sh --check` sigue en verde.

`ListView` pide la página con `Paginator.page()`, que falla si la página no existe: `?page=9`
o `?page=abc` responden 404. La lista de productos del panel usa `get_page()`, que cae en la
primera o la última página en lugar de fallar.

### Cómo probarlo en local

Desde `backend/`, con el Supabase local y `backend/.env` listos:

```bash
uv run python manage.py migrate ecommerce          # agrega la columna owner (migración 0002)
uv run python manage.py create_test_products       # solo si todavía no hay productos
uv run python manage.py assign_sample_products --supabase-user <uuid> --count 60
uv run python manage.py runserver
```

`migrate ecommerce` agrega la columna `owner`. Como apunta al modelo de usuario, la migración
0002 depende de `auth`: si la base todavía no tiene sus tablas, el mismo comando aplica también
la primera migración de `auth`.

1. `<uuid>` es el id del administrador en Supabase (Authentication → Users en Supabase
   Studio). Es también el `username` del usuario de Django que crea el traspaso, que se ve
   en `/admin/auth/user/`.
2. Abre `/my-products/` en una ventana privada: te manda al puente y de ahí al login de la
   tienda, sin que Django pida contraseña.
3. Inicia sesión en la tienda como ese administrador y abre `http://localhost:8000/my-products/`:
   salen 50 productos en la primera página y 10 en la segunda.
4. Para repartir productos a mano, usa el admin de Django (`/admin/ecommerce/product/`, con un
   superusuario creado con `createsuperuser`): la columna y el filtro «dueño» muestran de quién
   es cada uno. Recarga `/my-products/` y solo aparecen los tuyos.

`assign_sample_products` crea el usuario de Django igual que el traspaso (username igual al
id de Supabase, contraseña inutilizable, sin permisos de staff), asigna los primeros `--count`
productos sin dueño ordenados por `pk` e imprime cuántos asignó; si hay menos de los pedidos,
asigna los que haya y lo avisa. Correrlo otra vez continúa con los siguientes.

## Removing this app

`ecommerce/` is course material and does not go to `main`. To remove it:

1. Drop its table from any database that has it, while the app is still
   installed: `uv run python manage.py migrate ecommerce zero`.
2. Delete `backend/ecommerce/` (this file goes with it).
3. Delete the `"ecommerce.apps.EcommerceConfig"` entry, and the comment above
   it, from `INSTALLED_APPS` in `config/settings.py`. Delete `LOGIN_URL`, and the
   comment above it, from the same file: only `ProtectedListView` asked for a
   login.
4. Delete the `path("", include("ecommerce.urls"))` line, and the comment above
   it, from `config/urls.py`.
5. Delete the "EBAC practice M14" and "EBAC practice M15" subsections from
   `backend/README.md`. Its "Tests" section and the inventory notes stay: they
   document the store, not the course.

`panel/access.py::get_or_create_panel_user_by_id` and the class check of
`panel/test_stylesheet.py` stay: the panel uses them too.

The `inventory/` changes stay: they are the part of the practice meant for
`main`.
