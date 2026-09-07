# Fotos pendientes — catálogo de productos

Estado tras reparar `supabase/seed.sql`: **18 de 18 rutas resuelven** (13 productos + 5 categorías). Ninguna imagen da 404.

Pero ocho productos todavía no tienen foto propia. Están usando la genérica de su categoría o un corte parecido. Nada se inventó ni se escondió: cada caso está listado abajo.

## Productos que necesitan foto propia

| Producto | Precio/kg | Usa hoy | Por qué | Foto que necesita |
|---|---|---|---|---|
| Short Rib | $279.00 | `res.webp` (genérica) | No hay foto de costilla corta en el repo | Costilla corta con hueso, cruda, para BBQ |
| Bisteck de Cerdo | $130.00 | `cerdo.webp` (genérica) | Sin foto de bisteck de cerdo | Láminas delgadas de cerdo crudas |
| Molida de Cerdo | $135.00 | `cerdo.webp` (genérica) | Sin foto de molida | Carne molida de cerdo fresca |
| Pollo Entero | $85.00 | `pollo.webp` (genérica) | Sin foto de pollo entero | Pollo entero crudo, limpio |
| Pechuga de Pollo | $120.00 | `pollo.webp` (genérica) | Sin foto de pechuga | Pechuga sin hueso ni piel |
| Chorizo | $180.00 | `embutidos.webp` (genérica) | Sin foto de chorizo | Chorizo artesanal en tripa, rojo |
| Longaniza | $160.00 | `embutidos.webp` (genérica) | Sin foto de longaniza | Longaniza casera, ristra larga |

**Ojo con las genéricas repetidas.** Bisteck y Molida comparten `cerdo.webp`; Pollo Entero y Pechuga comparten `pollo.webp`; Chorizo y Longaniza comparten `embutidos.webp`. En el catálogo esos pares se ven **idénticos entre sí**. Es el mismo síntoma que teníamos antes, ahora acotado a seis productos en vez de trece, y documentado.

## Sustituto cercano, no genérico

| Producto | Usa hoy | Situación |
|---|---|---|
| T-Bone | `porterhouse.webp` | El Porterhouse y el T-Bone salen del mismo primal y en foto son casi indistinguibles (el Porterhouse tiene el filete más grande). Sirve, pero no es el corte exacto. Reemplazar cuando haya foto de T-Bone. |

## Fotos reales que hay y nadie usa

Tres cortes fotografiados sin producto asignado en el seed. Si la carnicería los vende, ya tienen imagen lista:

| Archivo | Corte |
|---|---|
| `filet_mignon.webp` | Filete de res / medallón |
| `ney_york_strip.webp` | New York Strip |
| `bravette_steak.webp` | Bavette / vacío |

No se crearon productos para ellos: agregar filas al catálogo es una decisión de negocio, no de imágenes.

## Categorías migradas desde el catálogo vanilla — sin fotos por producto

Estas cuatro categorías se migraron a React desde `js/modules/utils/base_dinamica.js`. **Ninguno de sus 20 productos tenía foto propia en el vanilla tampoco**: todos usaban ya la genérica de su categoría. No se inventó ninguna imagen.

| Categoría | Productos | Foto que usan hoy | Fotos propias que faltan |
|---|---|---|---|
| Preparadas | 7 | `preparadas.webp` | Arrachera marinada, carne de pastor, preparado de alambre, alitas adobadas, filete de pollo empanizado, milaneza empanizada, milaneza premium |
| Otros Productos | 4 | `otrosproductos.webp` | Huevo de campo, queso fresco, chorizo verde, manteca de cerdo |
| Ofertas Especiales | 4 | `premium.webp` | Paquete familiar, paquete parrilla, combo premium, promoción martes |
| Merchandising | 5 | `merch.webp` | Gorra, playera básica, playera premium, delantal, taza |

**Esto hace que dentro de esas cuatro categorías todas las tarjetas se vean iguales.** Preparadas muestra siete veces la misma foto, Merchandising cinco, Otros y Ofertas cuatro cada una. Es el mismo síntoma que ya estaba documentado arriba para Cerdo, Pollo y Embutidos, ahora extendido a las categorías nuevas. Se resuelve con fotos, no con código.

`frutasverduras.webp` está en el repo y nadie la usa: podría servir para Otros Productos si la carnicería vende fruta y verdura.

## Stock provisional — pendiente de los números del dueño

El catálogo vanilla **no llevaba stock**. Para que estos 20 productos aparezcan (la consulta filtra `stock > 0`) se les asignó un valor provisional en `supabase/seed.sql`. **No son cantidades reales.**

| Categoría | Rango asignado |
|---|---|
| Preparadas | 20–40 |
| Otros Productos | 35–60 |
| Ofertas Especiales | 10–25 |
| Merchandising | 18–35 |

Los precios sí son los reales del vanilla, copiados uno a uno sin modificar.

## Unidad de venta

Merchandising se vende **por pieza** y los tres paquetes de Ofertas Especiales **por paquete**, no por kilo. El esquema de `products` solo tiene `price_per_kg`, así que el precio vive ahí y la etiqueta se deriva del slug de la categoría en `src/components/ProductCard.tsx`. Si algún día se agrega una columna `unit`, esa función es el único lugar a cambiar.

## Cómo empatar una foto nueva

1. Dejar el archivo en `img/products/` como PNG.
2. Convertir a WebP: `cwebp -q 82 nombre.png -o nombre.webp`
3. Cambiar el `image_url` del producto en `supabase/seed.sql` a `/img/products/nombre.webp`
4. Borrar su fila de este documento.

El PNG se conserva siempre: es el fallback del `<picture>` para navegadores sin soporte WebP.
