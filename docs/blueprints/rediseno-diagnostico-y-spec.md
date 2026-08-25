# Rediseño — diagnóstico de la web viva y spec de cambios

Fecha: 13 agosto 2026. Verificado abriendo **https://pipetawns-x.github.io/Landingpages-Carni.pwa/** en el navegador, no leyendo código.

---

## 1. Lo primero: la web NO está caída

Está viva y funciona más de lo que parecía. El carrusel del hero corre, el widget del clima trae datos reales (28°C, despejado, 29% humedad), el filtro de categorías del catálogo responde y cambia la URL (`?categoria=cerdo`), y el badge del carrito muestra 3.

Eso importa porque el rediseño **no arranca de cero**: arranca de algo que ya funciona y hay que no romper.

**Pero el deploy de Netlify sí está mal configurado.** `netlify.toml` tiene los placeholders sin reemplazar:

```toml
VITE_SUPABASE_URL = "https://your-project-ref.supabase.co"
VITE_SUPABASE_KEY = "your-anon-key"
VITE_BASE_URL    = "https://your-site-url.netlify.app"
```

Lo que está vivo es **GitHub Pages**, que sirve archivos estáticos y por eso no necesita esas variables. Esa es la razón de que "estuviera caída" en Netlify y funcione aquí.

---

## 2. Landing — el bento

### El problema real, medido

Cada tarjeta de categoría mide alrededor de **680 px de alto**, y de esos, unos **450–500 px son vacío negro** entre la descripción y el botón.

La causa es la combinación de dos reglas: `grid-template-rows: repeat(6, 1fr)` estira todas las filas al alto de la celda más alta, y las tarjetas usan `justify-content: space-between`, que empuja el botón hasta el fondo de ese espacio estirado.

Consecuencias visibles:

- La imagen ocupa solo la franja superior (~150 px) y flota sobre un mar negro
- La tarjeta de **Pollo** se queda sin botón "Ver productos" — no alcanza a renderizarlo
- La tarjeta de **Otros Productos** tiene el botón separado de su propia imagen, desalineado del resto
- El bento entero ocupa tres pantallas de scroll cuando debería ser una

### Cómo se arregla

1. Cambiar `grid-template-rows: repeat(6, 1fr)` por `grid-auto-rows: minmax(140px, auto)`. Las filas dejan de estirarse al máximo.
2. Quitar `justify-content: space-between` de `.category-body`. El contenido se apila arriba y el botón queda pegado al texto.
3. La imagen pasa a `background-image` con `object-fit: cover` sobre **toda** la tarjeta, con un degradado oscuro de abajo hacia arriba para que el texto se lea encima. Eso es lo que hace que "las imágenes jueguen bien": hoy son un banner recortado, deben ser el fondo.
4. El botón "Ver productos" desaparece de las tarjetas chicas — la tarjeta completa es clickeable. Solo las 2×2 conservan botón visible.

Con eso el bento cabe en una pantalla y media, no en tres.

### El mapa de spans se conserva

Verificado en `_bento-main.scss`, grid de 4 columnas × 6 filas:

| Card | Columna | Fila | Tamaño |
|---|---|---|---|
| 1 · Cortes de Res | 1 / 3 | 1 / 3 | 2×2 |
| 2 · Cerdo | 3 / 4 | 1 / 3 | 1×2 |
| 3 · Pollo | 4 / 5 | 1 / 4 | 1×3 |
| 4 · Embutidos | 2 / 4 | 3 / 5 | 2×2 |
| 5 · Preparadas | 1 / 2 | 3 / 5 | 1×2 |
| 6 · Selección Premium | 1 / 3 | 5 / 7 | 2×2 |
| 7 · Merchandising | 3 / 4 | 5 / 7 | 1×2 |
| 8 · Otros Productos | 4 / 5 | 4 / 6 | 1×2 |
| 9 | 4 / 5 | 6 / 7 | 1×1 |

El mapa está bien pensado. **No se toca.** Lo que se arregla es el alto de las filas y el interior de las tarjetas.

---

## 3. Landing — la marca aparece tres veces

En la primera pantalla, sin hacer scroll, el nombre del negocio se repite tres veces:

1. El **logo**, que ya dice "CARNICERÍA / EL SEÑOR DE LA MISERICORDIA"
2. El **título** al lado del logo: "El Señor de la Misericordia"
3. La **tarjeta lateral** del hero: "CARNICERÍA / El Señor de La Misericordia"

**Cambio:** se queda solo el logo. Fuera el título del header y fuera la tarjeta de marca del hero. Ese espacio del hero lo gana el clima, que sí aporta información.

---

## 4. Header y navegación

Hoy: `HOME · PRODUCTS · CLUB MISERICORDIA · ABOUT` + iconos de búsqueda, carrito y usuario.

| Cambio | Detalle |
|---|---|
| Menú hamburguesa | Tres barras, junto a los iconos. Se perdió y hay que reponerlo |
| Buscador | Que se expanda y ocupe el ancho que hoy usan los links del menú |
| Solo el logo | Fuera el texto de marca del header |
| Header sticky | Al hacer scroll se encima sobre el título "Nuestras Categorías". Falta `scroll-margin-top` en las secciones |

---

## 5. Catálogo — el problema no es el filtro

**El filtro sí funciona.** Verificado: clic en CERDO carga "Cortes de Cerdo" y cambia la URL a `?categoria=cerdo`.

El problema es el contenido, y por eso se siente que "solo carga una categoría":

- Dentro de cada categoría, **las cuatro tarjetas usan exactamente la misma foto**. Cuatro cortes de res con idéntica imagen; cuatro de cerdo con idéntica imagen.
- Los nombres siguen una plantilla mecánica: *Bisteck de X · Trocito de X · Trozo de X · Molida de X*
- Cuatro productos por categoría, siempre cuatro

Es un catálogo generado por plantilla, no un catálogo real.

**Y hay una desconexión de datos:** los precios de `products.html` ($180, $160, $150, $170) **no coinciden con `supabase/seed.sql`** (Rib Eye $550, Picaña $320, Arrachera $280). Son dos catálogos distintos que no se hablan.

Lo que sí está bien y hay que conservar: el **precio por kg como principal y por libra como secundario**. Ningún competidor que revisé lo tiene.

### Cambios

1. Una imagen distinta por producto — hay 9 fotos de cortes en `img/products/` sin usar
2. Alinear nombres y precios con el seed real
3. Subir el contraste del nombre del producto (hoy es gris sobre negro, se pierde)
4. Agregar el badge de stock que ya existe en el diseño del Figma

---

## 6. Carrito — de modal a panel lateral

Hoy abre como popup y tapa el catálogo. Hay que salir para seguir comprando.

**Cambio:** panel lateral (drawer) que entra desde la derecha, con el catálogo visible y usable al lado. El usuario agrega, ve el total actualizarse, y sigue navegando sin cerrar nada.

Ese panel es el `OrderList` de la Práctica 2. Se construye una vez y sirve en los dos lados.

Contenido, tomado del Figma: toggle Domicilio/Recoger, línea por producto con cantidad editable, subtotal, envío, total, puntos que gana, botón de confirmar.

---

## 7. Registro y login

- **Los campos están exageradamente apretados** en el responsive. El formulario de registro tiene siete campos y no respira.
- **Solución:** dividir en dos bloques como ya propone el Figma — "Datos esenciales" (email, teléfono, contraseña) visibles, y "Datos de entrega (opcional)" plegados o con scroll interno. Se puede completar después.
- **La validación falla.** Pendiente de revisar campo por campo.
- **Fuera el "Club Misericordia" de esta pantalla.** Login es login. Mezclarlo con el programa de lealtad confunde el propósito de la página.
- Se conserva el panel deslizante entre login y registro — es una interacción de firma y está bien hecha (954 líneas en `_access.scss`).

---

## 8. Dashboard — el hueco real

Medido en líneas de SCSS:

| Archivo | Líneas | Estado |
|---|---|---|
| `_home.scss` | 901 | landing, muy trabajada |
| `_access.scss` | 954 | login/registro, muy trabajado |
| `_productos.scss` | 437 | catálogo |
| `_cards.scss` | 367 | tarjetas |
| `_bento-main.scss` | 181 | bento |
| `_admin.scss` | 133 | básico |
| `_cart.scss` | 92 | solo el contador, sin drawer |
| `_dashboard.scss` | 86 | casi vacío |
| `_dashboard-layout.scss` | **0** | **vacío** |
| `_sidebar.scss` | **0** | **vacío** |

Los dos archivos de layout del dashboard **están literalmente vacíos**. Por eso el dashboard del Figma no existe en código: no hay ni sidebar ni layout.

### Sobre el acceso al dashboard

Hoy no se puede entrar porque el rol de admin depende de Supabase, y Supabase no está conectado en el deploy.

**Salida para poder trabajar:** un modo de demostración con datos falsos, activado por un parámetro en la URL (`?demo=1`), que renderiza el dashboard sin backend. Sirve para diseñarlo, mostrarlo y avanzar; se apaga cuando el backend esté listo.

Eso desbloquea el rediseño del dashboard sin depender del backend, que es tu punto débil hoy.

---

## 9. Orden propuesto

```
1. Bento: alto de filas + interior de tarjetas      ← el cambio más visible
2. Header: hamburguesa, buscador, fuera el título
3. Catálogo: imágenes reales, datos del seed, contraste
4. Carrito lateral                                  ← también es la Práctica 2
5. Registro: dos bloques + validación
6. Dashboard en modo demo
```

Los pasos 1 a 4 tocan la landing y el catálogo, que es lo que ve un evaluador. El 4 además avanza la práctica.

---

## 10. Lo que no verifiqué

- **No abrí `accessweb.html`** en el navegador; lo de los campos apretados viene de lo que Eduardo describió, no de mi observación directa
- **No probé la validación** del formulario de registro
- **No revisé el responsive a 320 y 768** — las capturas son de escritorio a 1397 px
- **No probé el carrito** ni el flujo de agregar producto
- **No medí el rendimiento** (peso de página, tiempo de carga) pese a que las imágenes pesan hasta 1.8 MB
- **No revisé `dashboar.html` ni las tres páginas de admin**
- **No confirmé si existe un deploy de Netlify activo** aparte de GitHub Pages
