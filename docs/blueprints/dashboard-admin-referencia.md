# Dashboard administrativo — referencia y decisiones

Fuente: capturas del proyecto **Ferretería Kemi** del canal *Programación web*
(`facebook.com/edukuk`, 105 mil seguidores, Guatemala). React + Vite en
`localhost:5173`. Analizadas el 24 de agosto de 2026.

Es un sistema completo en producción, no una maqueta. Sirve como referencia
de **qué módulos hacen falta de verdad**, no de cómo deben verse.

---

## Lo que él tiene

### Menú lateral del panel

```
Panel · Ventas · Pedidos · Compras · Inventario
Agregar producto · Administrar productos
```

Siete secciones. Ninguna es un gráfico. Todas son operativas.

### Administrar Catálogo

Una tabla, y la clave está en cómo se edita:

| Columna | Cómo funciona |
|---|---|
| Información del producto | foto pequeña + nombre + descripción corta |
| Precio base | texto |
| Precio oferta | texto, dice "Sin oferta activa" cuando no hay |
| **Stock** | **interruptor**, no campo |
| **Oferta** | **interruptor**, no campo |
| Acciones | lápiz y bote de basura |

Arriba: contador `TOTAL PRODUCTOS 6` y un botón `ACTUALIZAR LISTA`.

**Por qué importa el interruptor.** Activar y desactivar es lo que se hace
veinte veces al día. Con un interruptor son cero clics de más; con un
formulario son cuatro. Esa diferencia decide si el dueño usa el panel o te
llama por teléfono.

### Agregar producto

Dos bloques en la misma pantalla:

**Gestión de categorías** arriba — un campo, un botón *Añadir*, y al lado la
lista de las que existen con sus acciones. No es una pantalla aparte.

**Registrar nuevo producto**:

```
MULTIMEDIA        4 recuadros: 1 PRINCIPAL + 3 OPCIONAL
NOMBRE · CATEGORÍA (select) · CANTIDAD (stock)
PRECIO COMPRA · PRECIO VENTA · PRECIO OFERTA
MARCA / COLOR
CARACTERÍSTICAS DESTACADAS   tres campos sueltos, uno por viñeta
ETIQUETAS DE ESTADO          casillas: Oferta · Destacado · Nuevo
DESCRIPCIÓN AMPLIADA         área de texto
[ Guardar Producto en Inventario ]
```

### Módulos de Ventas y Compras

Los dos con la misma forma: un formulario de una línea arriba, y el historial
abajo con un total acumulado.

```
Ventas:   Producto · Cantidad · Precio Venta (Auto) · Fecha · [Registrar]
          Historial · TOTAL VENTAS 58 uds.

Compras:  Producto · Cantidad · Precio Compra · Fecha · [Registrar]
          Historial · TOTALES 128 uds.
```

`Precio Venta (Auto)` se llena solo al elegir el producto. El de compra se
escribe, porque cambia con cada proveedor.

### Gestión de Pedidos Online

```
[Buscar pedido o cliente]  [Filtrar por estado ▾]  [Refrescar Lista]

CLIENTE · ITEMS · TOTAL · ESTADO ▾ · FECHA · VER DETALLE
```

**El estado se cambia desde un desplegable en la misma fila.** No hay que
abrir el pedido para marcarlo como enviado.

El detalle abre en ventana: datos del cliente, dirección de entrega, tabla de
productos, subtotal, envío, total. Y dos botones: **Imprimir Ticket** y Cerrar.

### La tienda pública

- Cabecera: buscador ancho, navegación, **botón `Admin` destacado**, carrito
  con contador
- Portada: banner grande + dos tarjetas laterales — **es un bento**
- *Productos Destacados* en carrusel horizontal con flecha
- Tarjeta: imagen, nombre, estrellas, precio grande, chip *Entrega rápida*
- **Botón flotante de WhatsApp** abajo a la derecha
- Ficha de producto: miniaturas a la izquierda, selector `− 1 al carrito +`,
  características en viñetas, sellos de confianza
- Carrito: tabla a la izquierda, *Resumen del Pedido* en panel lateral con la
  entrega editable
- Aviso verde flotante al agregar: *"Producto agregado al carrito"*

---

## Lo que hay que copiar, y por qué

### 1. Tres precios, no uno — el hallazgo importante

Él guarda **precio de compra**, **precio de venta** y **precio de oferta**.

`products` de Carni-mvp hoy solo tiene `price_per_kg` y `price_per_lb`.
**Sin precio de compra no existe el margen.** Y el margen es justo el dato
que falta para descongelar el módulo de fidelización, que está detenido desde
el 13 de agosto esperando exactamente eso.

Faltan en el esquema:

```sql
cost_per_kg        DECIMAL(10,2)   -- lo que cuesta traerlo
sale_price_per_kg  DECIMAL(10,2)   -- precio de oferta, NULL si no hay
is_featured        BOOLEAN         -- "Destacado"
is_new             BOOLEAN         -- "Nuevo"
```

`is_promoted` ya existe y cubre la etiqueta de oferta.

### 2. Módulo de Compras

Registra lo que entra a la carnicería. Con eso el stock se mueve solo y el
costo real queda anotado. Hoy el stock se escribe a mano, que es como no
tenerlo.

### 3. Interruptores en la tabla

Stock y oferta se activan desde la fila. Es la diferencia entre un panel que
se usa y uno que se abandona.

### 4. Imprimir ticket

En una carnicería esto no es un extra: es el papel que va con el pedido.

### 5. Botón Admin en la cabecera pública

Acceso visible, no una dirección escondida. La protección no está en ocultar
la puerta — está en la política de la base.

---

## Lo que NO se copia

**Su manejo de sesión por rol.** El reel *"Así gestioné el inicio de sesión
para administrador, vendedor y usuario"* muestra esto:

```js
const isAdminDashboard = window.location.pathname.startsWith('/admin');
if (isSellerDashboard) token = sToken;
else if (isAdminDashboard) token = uToken;
```

**El rol lo decide `window.location.pathname`.** El navegador. El mismo lugar
donde estaba el precio de Carni-mvp hasta el 24 de agosto.

Carni-mvp no necesita eso: el rol vive en `profiles.role` y lo defiende la
política `products_admin_only`. Una sesión, sin tres tokens. Aunque alguien
salte la web y le hable directo a la API, la regla sigue puesta.

**Vender por pieza.** Él vende taladros; aquí se vende al peso. El formulario
de venta necesita kilos y respetar `min_quantity_kg`.

**Su diseño visual.** Naranja y azul de ferretería. La paleta de Carni-mvp ya
está decidida en `docs/blueprints/direccion-rediseno-2026.md`.

---

## Otro hallazgo del mismo canal

Reel *"Activa animaciones al hacer scroll"* — usa **AOS**:

```js
useEffect(() => {
  AOS.init({ duration: 800, once: true });
}, []);
```

Resuelve el pendiente **P-15** sin instalar nada pesado. `once: true` anima
una sola vez, no cada vez que se sube y baja.

---

## Orden sugerido

```
1. Administrar productos   tabla + interruptores + editar en línea
2. Pedidos                 lista, cambio de estado, detalle, ticket
3. Agregar producto        formulario completo
4. Compras                 entradas de inventario
5. Ventas                  ventas de mostrador
6. Panel                   métricas, hasta el final
```

El panel de métricas va último. Un carnicero no abre el sistema para ver una
gráfica: lo abre para cambiar el precio de la arrachera porque subió el
ganado.
