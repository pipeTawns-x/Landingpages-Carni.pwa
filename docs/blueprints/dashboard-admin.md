# Dashboard administrativo — análisis y propuesta

Referencia: proyecto de ferretería de **Programación web** (`facebook.com/edukuk`,
105 mil seguidores, Guatemala). Analizado a partir de 12 capturas del sistema
funcionando y 3 reels con el código en pantalla.

Fecha: 2026-08-24

---

## Lo que hace ese sistema, y qué vale copiar

### Menú lateral — siete secciones

```
Panel · Ventas · Pedidos · Compras · Inventario
Agregar producto · Administrar productos
```

Se identifica como *"SISTEMA DE GESTIÓN V1.0"* y saluda por nombre: *"Hola Edgar"*.
No es un panel de configuración: es la herramienta con la que se opera el negocio
todos los días.

### Administrar Catálogo — la pantalla que más importa

Una tabla con columnas:

| Información del producto | Precio base | Precio oferta | Stock | Oferta | Acciones |
|---|---|---|---|---|---|

Y dos detalles que resuelven el problema de fondo:

- **`Stock` y `Oferta` son interruptores en la propia fila.** Un clic y listo.
  No hay que abrir un formulario para poner algo en oferta.
- **`Acciones` son solo dos íconos**: lápiz y bote. Sin menús desplegables.

Arriba, una tarjeta con `TOTAL PRODUCTOS: 6`. Cifra única, grande, sin gráfica.

**Esto es lo primero que hay que construir.** Es el 80% del uso real.

### Agregar producto — el formulario completo

Trae cosas que Carni-mvp hoy no tiene:

- **Cuatro cajas de imagen**: una PRINCIPAL y tres OPCIONAL
- **Precio compra · Precio venta · Precio oferta** ← tres precios, no uno
- **Características destacadas**: tres campos de texto sueltos, no un párrafo
- **Etiquetas de estado**: casillas para Oferta / Destacado / Nuevo
- **Gestión de categorías en la misma pantalla**: crear, editar y borrar sin salir

### Módulos de Ventas y Compras

Dos formularios gemelos: *Producto · Cantidad · Precio · Fecha* → Registrar.
Cada uno con su historial y un total al pie (`TOTAL VENTAS: 58 uds.`).

**Compras registra la entrada de mercancía.** Para una carnicería esto es
directamente aplicable: se compra media res, se despieza, se vende por corte.

### Gestión de Pedidos Online

- Buscador por pedido o cliente
- Filtro por estado
- Tabla con **el estado como desplegable editable** en la fila: `ENTREGADO`,
  `ENVIADO`. Se cambia sin entrar al pedido.
- `VER DETALLE` abre una ventana con datos del cliente, dirección de entrega,
  los productos, y **`Imprimir Ticket`**

---

## Lo que NO hay que copiar

En el reel *"Así gestioné el inicio de sesión para administrador, vendedor y
usuario"* resuelve los roles con tokens separados que elige según la URL:

```js
const isAdminDashboard = window.location.pathname.startsWith('/admin');
if (isSellerDashboard) token = sToken;
else if (isAdminDashboard) token = uToken;
```

**El navegador decide el rol.** Es el mismo patrón que causó el hueco del precio
en Carni-mvp: confiar en el cliente.

En Supabase esto sobra. El rol vive en `profiles.role` y lo defiende la base:

```sql
products_admin_only  →  FOR ALL USING (role = 'admin')
```

Una sesión, sin tres tokens, sin mirar el `pathname`. Aunque alguien salte la web
y hable directo con la API, la regla sigue puesta.

---

## Hallazgo: falta el precio de compra

El sistema de la ferretería separa **precio compra** de **precio venta**.
Carni-mvp solo tiene `price_per_kg`.

Sin precio de compra no hay forma de calcular margen. Y el margen es exactamente
lo que el dueño de la carnicería necesita ver para decidir precios — es la razón
por la que el módulo de fidelización lleva congelado desde el 13 de agosto.

**Propuesta**: agregar `products.cost_per_kg`, visible solo para admin vía RLS.
Nunca se expone al cliente.

---

## Propuesta para Carni-mvp

### Orden de construcción

**Fase 1 — la tabla editable**
`admin-products.html` con la tabla de 53 productos. Edición en línea de precio y
stock, interruptor de `is_active`, interruptor de oferta. Sin formularios.

**Fase 2 — alta y baja de producto**
Formulario con: nombre, categoría, descripción, precio compra, precio venta,
precio oferta, stock, `min_quantity_kg`, imagen, etiquetas. Baja con `is_active`
en falso, **nunca borrando** — si se borra, el histórico de ventas se rompe.

**Fase 3 — pedidos**
Tabla con estado editable en la fila, filtro, y detalle con ticket imprimible.
Los estados ya existen en el esquema: `pending`, `confirmed`, `preparing`,
`ready`, `delivered`, `cancelled`.

**Fase 4 — entrada de mercancía**
El módulo de Compras adaptado a carnicería: se registra la canal o la caja que
entra, y se reparte en cortes.

**Fase 5 — métricas**
Ventas del día, ticket promedio, top 5 cortes, margen por producto.
Al final, no al principio.

### Lo que este sistema no trae y aquí sí hace falta

- **Bitácora de cambios de precio**: quién y cuándo. El patrón ya está montado
  en `store_settings` con `updated_by` y `updated_at`.
- **Alerta de stock bajo**: el dueño necesita saber qué reponer, no leer una
  tabla de 53 filas.
- **Los tres mínimos de venta**: `min_quantity_kg` por producto y los mínimos de
  pedido en `store_settings` deben poder editarse desde aquí.

---

## Otro hallazgo útil, de otro reel

*"Activa animaciones al hacer scroll"* — usa **AOS** (Animate On Scroll):

```js
useEffect(() => {
  AOS.init({ duration: 800, once: true });
}, []);
```

Tres líneas y resuelve el pendiente **P-15** sin instalar nada pesado.
`once: true` anima una vez y ya, en vez de repetir en cada scroll.

---

## Sin verificar

- El repositorio del proyecto de ferretería. El análisis sale de capturas del
  sistema corriendo y de tres reels, no del código.
- El resto de los reels del canal: hay más de diez, se revisaron tres.
- `github.com/mvanhorn/last30days-skill` — pendiente de instalar y probar.
