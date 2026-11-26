# Carrito trifásico — versión de Claude para revisión

> **Para Gemini:** este documento es la versión de Claude de la lógica del carrito de la carnicería "El Señor de La Misericordia" (San Luis Potosí). Parte del chat que Eduardo tuvo contigo y de casi un año de decisiones del proyecto. Te pedimos tres cosas: señalar errores de lógica o de cálculo, señalar huecos, y responder las preguntas abiertas de la sección 13. Cada afirmación sobre el código actual lleva su archivo y línea.

Fecha: 2026-11-19. Estado: lógica de negocio, sin código nuevo todavía.

---

## 1. Principio rector: el panel manda

Todo lo que el cliente ve en la web sale del panel de administración (dashboard). La administradora (la hermana de Eduardo) da de alta, edita y elimina productos **sin tocar una línea de código**:

- precio maestro por kilo;
- si el producto se vende por pieza (sí o no, producto por producto);
- el peso estándar de la pieza y su descripción;
- las presentaciones y opciones del producto (sección 6);
- los paquetes (sección 7);
- el stock y su renovación semanal (sección 8);
- el tipo de cambio manual, cuando haga falta (sección 9).

El código solo contiene **reglas de cálculo**, nunca precios ni productos.

**Valores iniciales:** mientras la administradora no configure, los precios arrancan con referencias públicas de la competencia (Carnívoros y Grill House, sección 12). Son un punto de partida editable, no el precio final.

---

## 2. Regla de oro: un solo precio maestro

Cada producto tiene **un solo precio base: pesos mexicanos (MXN) por kilogramo**. Todo lo demás se deriva de él:

- precio por gramo y por libra;
- precio por pieza;
- precio en dólares.

Internamente el motor habla en **gramos y MXN**. Si mañana el kilo sube de $150 a $160, se cambia un solo número y todo se recalcula.

El precio lo calcula **siempre el servidor**. El navegador manda el producto, el modo y la cantidad, nunca un precio. Esto ya existe: `quote_line` en `supabase/migrations/20261113000002_comercio_v1_cotizacion_y_pedidos.sql:30`.

---

## 3. Los tres modos de pedido

En un mismo carrito cada línea elige su propio modo: un producto por pieza, otro por gramos, otro por dinero, otro en libras.

### A. Por peso (exacto)
El cliente dice "500 g", "1.5 kg" o "2 lb".

```
gramos  = cantidad × factor      (kg = 1000, g = 1, lb = 453.59237)
total   = gramos / 1000 × precio_kg
```
Ejemplo: 500 g de bistec de puerco a $150/kg → 0.5 × 150 = **$75.00**.

### B. Por dinero
El cliente dice "dame $100 de bistec" (o "$10 USD").

```
monto_mxn     = monto (o monto_usd × tasa_de_la_casa)
gramos_surtir = monto_mxn / precio_kg × 1000
```
Ejemplo: $100 a $150/kg → **667 g**. El carnicero ve "surtir aprox. 667 g".

### C. Por pieza (estandarizada)
La administradora define en el panel el **peso estándar de una pieza** (ejemplo: 1 bistec de puerco = 150 g).

```
precio_pieza = peso_pieza_g / 1000 × precio_kg
total        = piezas × precio_pieza
```
Ejemplo: 150 / 1000 × 150 = **$22.50 por pieza**; 3 piezas = **$67.50**.

**Decisión de Eduardo:** en la tarjeta del producto el precio por pieza se presenta como **precio estandarizado**, no como "precio estimado". La dueña lo fijó, y el carnicero corta a ese tamaño. Por eso no se muestra un aviso de "el monto final puede variar".

**El grosor** (cortes premium) no es un cuarto modo. Es una entrada dentro del modo pieza, y solo aparece cuando el corte lo admite: de 0.5" a 3" en pasos de 0.25", con 1.25" por defecto. Escala el peso de la pieza: `peso × (grosor / grosor_por_defecto)`.

**Estado en el código:** los tres modos ya funcionan en el servidor con estas fórmulas.
- Peso: `20261113000002_...sql:109`.
- Dinero: `:123`.
- Pieza: `:170`, que calcula `piezas × avg_piece_weight_kg × factor_grosor × precio`.

---

## 4. Descripción del producto y de la pieza

Cada producto lleva un texto que escribe la administradora en el panel y que se muestra en la tarjeta. Explica qué compra el cliente:

- "Una pieza de pierna de pollo es pierna con muslo. No se vende la pierna sola."
- "Una pechuga con hueso es la pechuga completa con su hueso."

---

## 5. Comentarios del cliente por línea

Viene del CodePen original (`observaciones`). Cada línea del carrito lleva su propio comentario libre ("sin tanta grasa", "el bistec de una pulgada con más grasa"). El comentario viaja con la línea, llega al tablero de pedidos y se imprime en el pedido. Sin esto el mostrador no sabe qué cortar.

**Estado en el código:** hoy solo hay **una nota por pedido** al pagar (`backend/ventas/views/carrito.py:95`), no una por línea. **Falta.**

---

## 6. Productos con presentaciones y opciones (caso del pollo)

**Problema:** en México se pide "medio pollo a lo largo", "medio pollo a lo ancho", "dos piernas", "una pechuga completa", "media pechuga con ala". No se quiere crear un producto por cada combinación (media pechuga con ala, media sin ala, completa con ala, completa sin ala…).

**Propuesta:** un producto con **presentaciones** y **complementos** configurables desde el panel.

### Pollo entero
| Presentación | Qué lleva | Peso estándar |
|---|---|---|
| Entero | todo el pollo | el de la semana (ej. 2.5 kg) |
| Mitad a lo largo | 1 ala + media pechuga + 1 pierna con muslo | 50 % del pollo |
| Mitad a lo ancho, parte de piernas | 2 piernas con muslo | lo define la dueña |
| Mitad a lo ancho, parte de pechuga | pechuga + 2 alas | lo define la dueña |

Las dos mitades a lo largo son iguales, así que tienen el mismo precio. Las dos mitades a lo ancho **no**: una es de piernas y la otra de pechuga con alas, y pueden tener distinto peso y distinto precio por kilo.

### Productos por parte
- **Pierna con muslo**, por pieza: siempre juntas, no se vende la pierna sola.
- **Alitas**, por kilo o por pieza.
- **Alitas adobadas** (para asar o freír): es otro producto, con su propio precio.
- **Pechuga con hueso**, con presentación *completa* o *mitad* y el complemento **"con ala / sin ala"**. Un solo producto cubre las cuatro combinaciones.

**Cómo se cobra:** cada presentación y cada complemento tiene un peso estándar en el panel y, si hace falta, su propio precio por kilo. El precio es siempre `peso × precio_kg`. "Dos pechugas" son dos pechugas completas: la cantidad multiplica la presentación elegida.

**Estado en el código:** no existen presentaciones ni complementos (no hay tablas de variantes ni opciones). **Falta.**

---

## 7. Paquetes

Un paquete es un conjunto de productos con **precio fijo por paquete**: "paquete parrillero", "paquete para asar", paquetes por número de personas (la idea viene de Carnívoros y del Catálogo 2024, sin copiarlos). La administradora los arma en el panel: nombre, contenido, precio y para cuántas personas. El botón "Agregar paquete" lo manda directo al carrito.

Regla previa del Catálogo 2024: **anticipo del 50 % en paquetes** (Engram #804). Hay que confirmar si sigue vigente.

**Estado en el código:** un producto puede tener `price_unit = 'package'` y se cobra por unidad (`supabase/migrations/20261113000001_comercio_v1_esquema.sql:79`), pero **no se guarda qué contiene** el paquete. **Falta el contenido.**

---

## 8. Stock semanal y estandarización por lote

**Caso real:** los martes llega el pollo. La semana pasada pesaba 2 kg; esta semana pesa 2.5 kg.

1. Llega el surtido. El carnicero reporta el peso real ("el pollo viene más grande").
2. La administradora registra el **lote nuevo** en el panel y actualiza el peso estándar (2 kg → 2.5 kg). Es **manual, a propósito**: lo decide una persona.
3. Las líneas que se surten con el **stock anterior** se cobran con el estándar anterior.
4. Cuando el stock anterior se acaba, las **órdenes nuevas** entran con el estándar del lote nuevo.
5. Como la web vende las 24 horas, la estandarización se hace **antes de abrir el lote nuevo a la venta** (ejemplo: el martes, en media hora).

Hay productos que se estandarizan una sola vez. Por ejemplo, el bistec de 150 g: se le enseña al carnicero el tamaño y se mantiene. En el modo dinero hay más tolerancia en el corte. En el modo pieza el carnicero apunta al peso estándar.

**Estado en el código:** ya existen `purchase_lots`, `stock_movements` y `price_history` (`20261113000001_...sql:211`, `:259`). Lo que no existe es amarrar el peso estándar al lote, ni pasar automáticamente al lote siguiente cuando el anterior se agota. **Falta.**

---

## 9. Dólares y libras ("gabacho friendly")

**Regla:** el precio maestro sigue en MXN. El precio en USD se calcula al momento, y no se debe perder dinero vendiendo en dólares ni en pesos.

1. **Tasa automática diaria**, de una fuente oficial (Banxico FIX).
2. **Override manual** desde el panel, solo para administradores con sesión segura. La tasa manual gana a la automática del mismo día.
3. **Margen de protección (spread):** la tasa de la casa es un poco menor que la del mercado, para cubrir comisiones y la variación del día.
4. **Snapshot:** cada pedido guarda la tasa con la que se cobró.
5. **Freno de seguridad:** si la tasa tiene más de 4 días, se apaga el cobro en USD. **Propuesta nueva:** si la tasa nueva cambia más de un X % respecto a la anterior (una caída o un brinco abrupto), se pausan las ventas en USD y se avisa al administrador hasta que alguien confirme.
6. **Libras:** 1 lb = 453.59237 g. En la tarjeta se muestra el precio por kg y por lb, y la equivalencia (1 lb ≈ 454 g).

**Estado en el código:**
- La tabla `fx_rates` ya tiene margen del 2 %, fuente `banxico`/`manual`/`fallback` y prioridad de la manual (`20261113000001_...sql:319`).
- La vista `current_fx` calcula `house_rate` y marca `stale` a los 4 días.
- El pedido guarda `fx_rate_used` (`:162`).
- **Falta:** el proceso que trae la tasa cada día (no hay cliente de Banxico en `backend/`) y el freno por cambio abrupto.

**Corrección a un cálculo:** $150 MXN **no** son $100.93 USD. A unos 18–20 MXN por dólar, $150 MXN son alrededor de **$7.50–8.30 USD**. Por eso la conversión la hace siempre el servidor con la tasa del día, nunca una calculadora manual.

---

## 10. Impuestos, comisiones y pagos

- **IVA:** cada producto indica si su precio incluye IVA. En México la ley de protección al consumidor exige mostrar el **precio total con impuestos** al cliente. Hay alimentos con **tasa 0 %** (la carne fresca, en principio) y otros al 16 % (preparados o adobados, posiblemente). **Lo confirma un contador**, no el código.
- **Comisiones de pasarela** (Stripe, PayPal): decidir si se absorben en el precio o se muestran desglosadas en el total.
- **Pagos:** el cliente paga con Stripe. El WhatsApp es para los trabajadores (PREPARANDO, LISTO, ENTREGADO), no para cobrar.
- **Tarjetas y cuentas guardadas:** **nunca se guardan números de tarjeta ni de cuenta en nuestra base**. Se usan los métodos de pago guardados del propio Stripe (un "Customer" con su token). Así el cliente frecuente paga en un clic y nosotros no almacenamos datos que nos obliguen a una certificación PCI completa.
- **Flujo de cliente frecuente:** pide y paga la noche anterior, la web le avisa cuando su pedido está LISTO, y pasa a recogerlo temprano.

**Estado en el código:** no hay columnas de IVA ni de comisiones. **Falta.**

---

## 11. Seguridad (no negociable)

- Solo usuarios con rol de administrador cambian precios, pesos estándar, lotes y tipo de cambio. Cada cambio queda registrado con quién y cuándo (`staff_ref`, `price_history`).
- El precio nunca viaja desde el navegador: el servidor recalcula todo.
- El tipo de cambio manual exige sesión de administrador. Un brinco abrupto pausa el cobro en USD.
- Ningún secreto en el código: llaves en el `.env` o en el gestor de secretos.

---

## 12. Precios de referencia (valores iniciales editables)

Lectura pública del 2026-11-17, MXN (Engram #3246):

**Carnívoros** (carnivoros.mx). Las páginas de producto respondieron 429, así que no muestran la unidad:
- Arrachera Select 339; Cowboy Select 355; T-Bone Select 349.50; Costilla de cerdo 250; Alitas Hot 169; Chistorra 89.
- Paquetes: Carnívoro $1,599 (8–10 personas), Uno $1,799, Dos $2,599, Tres $3,249.

**Grill House CDMX**: vende piezas de peso fijo con gramos y grosor en el nombre. Por ejemplo:
- New York CAB $258 por 340 g (3/4");
- pollo entero $108 por 1.4 kg;
- pechuga $199 por 1.24 kg.

**Hueco:** a Carnívoros le falta la unidad (por kg o por pieza) y no lista bistec de puerco, molida ni chuleta. Hay que completar esa lectura antes de usar sus precios como base.

---

## 13. Preguntas abiertas para revisar

1. **Pollo:** ¿las presentaciones se expresan como **porcentaje del pollo de la semana** (mitad = 50 %), para que al cambiar 2 kg → 2.5 kg se actualicen solas, o cada presentación lleva su propio peso?
2. **Mitad a lo ancho:** ¿la parte de pechuga y la de piernas tienen **precio por kilo distinto**, o el mismo precio por kilo con distinto peso?
3. **Freno del tipo de cambio:** ¿a partir de qué porcentaje de cambio se pausan las ventas en USD?
4. **Paquetes:** ¿sigue el anticipo del 50 %?
5. **Comisiones:** ¿se absorben en el precio o se cobran aparte?
6. **Lote nuevo:** si un pedido mezcla stock viejo y nuevo, ¿se cobra todo con el estándar viejo, todo con el nuevo, o cada parte con el suyo?
