# Reset de producción — guion para Eduardo

**Esto lo ejecutas tú, no el agente.** Cada paso toca la base real.

Antes de empezar, lee la advertencia del final. No es formalidad.

---

## Por qué hay que hacer esto

Producción y las migraciones del repo son **dos esquemas distintos**, y llevan
tiempo separados:

| | Producción hoy | Las migraciones dicen |
|---|---|---|
| Columna del total | `orders.total_amount` | `orders.total` (`202604100001_initial_schema.sql:59`) |
| `categories` | no existe | debe existir |
| `favorites` | no existe | debe existir |
| `promotions` | no existe | debe existir |

Mientras eso siga así, cualquier migración nueva se aplica sobre un esquema que
no es el que espera, y falla o —peor— pasa a medias.

`orders` y `order_items` están **vacías**, así que no hay ventas que perder. El
único dato vivo es una fila en `profiles`: tu cuenta, con rol `admin`. Esa se
recupera en el paso 4.

Ya está probado en local: `supabase db reset` aplicó las 4 migraciones y sembró
**53 productos en 9 categorías** sin un solo error.

---

## Paso 1 · Vaciar el esquema `public`

Entra al **SQL Editor** del dashboard de Supabase y pega esto.

Borra el esquema entero y lo vuelve a crear vacío. Las dos últimas líneas son
las que más importan: sin ellas el esquema queda sin permisos y la aplicación
no puede ni leer.

```sql
-- Borra el esquema public completo, con todo lo que cuelga de él.
DROP SCHEMA public CASCADE;

-- Lo vuelve a crear vacío.
CREATE SCHEMA public;

-- Devuelve los permisos que Supabase espera encontrar. Sin esto, PostgREST
-- y el cliente del navegador se quedan sin acceso.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
```

**Tu cuenta no se borra.** Los usuarios viven en el esquema `auth`, que este
comando no toca. Lo que sí se borra es tu fila en `public.profiles`, y por eso
existe el paso 4.

---

## Paso 2 · Que Supabase olvide las migraciones viejas

Supabase lleva una lista de qué migraciones ya corrió. Como acabas de borrar
todo, esa lista quedó mintiendo: dice que tres migraciones están aplicadas
cuando ya no existe nada de ellas.

Esto las marca como revertidas, para que el siguiente paso las vuelva a correr
desde cero.

```bash
cd ~/Desktop/Carni-mvp

supabase migration repair 202604100001 202604100002 202604100003 --status reverted
```

Sintaxis sacada de `supabase migration repair --help`, no inventada:

```
Usage: supabase migration repair [version] ... [flags]
  --status [ applied | reverted ]   Version status to update.
  --linked                          (default true) — actúa sobre el proyecto enlazado
```

`--linked` viene activado por defecto, así que apunta a producción sin que
tengas que escribirlo.

Si te pide contraseña, es la de la base de datos, la que está en
*Project Settings → Database*. No es la de tu cuenta de Supabase.

**Comprueba antes de seguir:**

```bash
supabase migration list
```

Las cuatro deben aparecer **sin marca en Remote**. Si alguna sigue marcada,
repite el `repair` con esa versión antes de continuar.

---

## Paso 3 · Aplicar las 4 migraciones

Ahora sí, sube el esquema del repo a producción. Corre las cuatro en orden y
deja la base igual que la local que ya probamos.

```bash
supabase db push
```

Las que va a aplicar:

```
202604100001_initial_schema.sql    7 tablas
202604100002_rls_policies.sql      políticas de acceso por tabla
202604100003_functions.sql         8 funciones RPC
202608210001_precio_server_side.sql  precio server-side + mínimos de compra
```

Esa última es la importante: cierra el hueco donde el navegador mandaba el
precio. A partir de ahí el total lo calcula la base leyendo `products`, y nadie
puede comprar un corte de $649 a $1 desde la consola.

**Ojo:** `db push` **no** corre `seed.sql`. El seed es solo para local. Los
productos de producción los cargas desde el dashboard, o pegando el `INSERT`
de `supabase/seed.sql` en el SQL Editor si quieres el catálogo completo de una.

---

## Paso 4 · Recuperar tu rol de admin

El paso 1 borró tu fila de `profiles`, pero tu usuario sigue existiendo en
`auth`. Esto lo vuelve a crear con rol `admin`, buscándote por correo para no
tener que copiar tu UUID a mano.

Pégalo en el SQL Editor:

```sql
INSERT INTO public.profiles (id, full_name, phone, role, points)
SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Eduardo'),
    COALESCE(u.raw_user_meta_data->>'phone', '4440000000'),
    'admin',
    0
FROM auth.users u
WHERE u.email = 'trippipeaguilar@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

**Comprueba que quedó:**

```sql
SELECT p.id, p.role, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;
```

Debe devolver una fila, con `role = admin` y tu correo.

Un detalle: `phone` tiene un `CHECK` de exactamente 10 caracteres. Si el número
que trae tu cuenta tiene otra longitud, el `INSERT` falla — cámbialo por uno de
10 dígitos y listo.

---

## Antes de tocar nada: no hay respaldos

**No hay copias de seguridad configuradas en este proyecto.** Ni automáticas ni
manuales. Lo que borres, se fue.

Hoy eso importa poco porque `orders` y `order_items` están vacías y el único
dato real es tu perfil, que se recupera en el paso 4. Pero en cuanto entre la
primera venta real, esto deja de ser aceptable.

Antes de correr el paso 1, una red de seguridad barata:

```bash
supabase db dump --linked -f respaldo-antes-del-reset.sql
```

Guarda ese archivo fuera del repo. Tarda segundos y te deja marcha atrás.

Y ponlo en la lista de pendientes: **configurar respaldos automáticos** antes
de que el negocio empiece a vender de verdad.

---

## Después del reset

Queda un paso que **no** depende de producción y ya está hecho en la rama
`pruebas`: `js/modules/supabase.js` mandaba `p_address` cuando la función se
llama `p_delivery_address`. Postgres rechaza una llamada RPC con un parámetro
que no existe, así que `createOrder()` fallaba siempre — por eso `orders` nunca
tuvo una sola fila.

Con el esquema correcto en producción **y** ese arreglo, los pedidos por fin
pueden llegar a la base.
