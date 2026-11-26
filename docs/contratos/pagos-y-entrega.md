# Contrato de pagos y entrega (T9, T9b y T10)

Spec: `odd/tasks/rediseno-moderno.md`, T9 (S11, S15.8 y la parte de pagos de S16), T9b (PayPal, opcional) y T10 (S12 y la parte de código de S16). Decisiones de Eduardo: Engram #3362 (pago completo antes de salir, código o QR), #3388 (corrige #3387: aviso al cliente, envío gratis desde un monto, Stripe y PayPal; roles y chatbot fuera de esta entrega). Entradas: `docs/contratos/precios-y-envio.md` (§4 punto 6, F-32), `docs/contratos/inventario-por-fuente.md`, `docs/auditoria/rediseno-seguridad.md` (sección 9 (f) y sección 12, F-46), y el informe de F-04 (L25).

Este documento es solo el contrato: no hay código ni migración todavía. Todo lo marcado **SUPOSICIÓN** o **Decisión de Eduardo** está en la §9.

## 1. Qué ya existe y se reusa (no se duplica)

| Pieza | Dónde | Cómo la usa T9/T10 |
|---|---|---|
| Máquina de estados del pedido | `public.set_order_status` (`supabase/migrations/20261113000002_comercio_v1_cotizacion_y_pedidos.sql:503`), reescrita por T7b en `20261125000001_inventario_por_fuente.sql` (escrita, NO aplicada) | Estados `pending → confirmed → preparing → ready → delivered`, y `cancelled` desde cualquiera antes de `delivered`. Es el único punto que mueve el stock: al pasar `pending → confirmed` bloquea los productos y sus fuentes por id ascendente y descuenta exactamente lo vendido. **T9 y T10 no agregan estados de pedido.** |
| Precio cerrado por línea | `inventory.pricing.close_price` y `order_total` (T7a) | El total que se cobra sale de aquí, nunca del cliente. |
| Envío por zonas | `ventas.shipping.delivery_quote` / `delivery_fee` | La cuota de la zona; el envío gratis desde un monto se aplica encima (§2.3). |
| Pedido invitado y regla de 3 pendientes por teléfono | `create_order_web` (`20261117000002_create_order_web.sql`, escrita, NO aplicada) | Se reusa la validación de nombre y teléfono y la regla `too_many_pending`. |
| Moneda | `orders.currency` (`MXN`/`USD`), `fx_rate_used`, `total_usd`, CHECK `orders_usd_requires_rate`; tasa en `services.current_fx` (`backend/ventas/services.py:264`) | El cobro en USD usa la tasa vigente del panel y la guarda en el pedido. |
| Límite de intentos | `ventas/throttle.py` y `carrito._throttled` (`ventas/views/carrito.py:314`) | Antes de leer la base en la creación del pago. El webhook NO lleva límite por IP (L20). |
| Entorno | `require_env` (`backend/config/settings.py:34`) y `STORE_ORIGIN` (`:241`) | Variables nuevas con `require_env`; las URL de regreso de Stripe se arman con `STORE_ORIGIN`. |
| CSP | `form-action 'self'` (`backend/config/middleware.py:50`), `connect-src 'self' …` (`:46`) | No se afloja: Checkout se inicia por JSON a nuestro propio origen y se navega con `window.location` (§2.5). |

Las skills `carni-stripe` y `carni-order-flow` describen el stack anterior (React con Stripe Elements). De ellas se conserva lo que sigue vigente: el pedido nace `pending` antes del pago, el webhook lo pasa a `confirmed`, la firma siempre se verifica y ningún dato de tarjeta toca el servidor. Aquí se usa **Checkout alojado** de Stripe, así que no hace falta `js.stripe.com` ni llave publicable.

## 2. T9: flujo de punta a punta

```
cliente ──POST JSON /pagos/checkout/──▶ Django (límite, ≤50 líneas, total, topes)
                                          │ transacción 1: pedido pending + reserva + order_payments(open)
                                          ▼
                                      Stripe: crear sesión (expires_at = ahora + 30 min, idempotente)
cliente ◀── {"url": ...} ── Django     │
cliente ── window.location.assign(url) ─▶ checkout.stripe.com ── paga ──▶ Stripe
Stripe ──POST /pagos/stripe/webhook/ (cuerpo crudo firmado)──▶ Django
                                          │ transacción 2: evento nuevo + pedido pending + montos iguales
                                          │   → set_order_status(confirmed) (descuenta con bloqueo de fila)
                                          │   → consume la reserva → emite el código de entrega (T10)
                                          ▼
                                      200
```

### 2.1 Entrada: `POST /pagos/checkout/` (JSON)

- `@require_POST`, **sin** `csrf_exempt`: el token va en la cabecera `X-CSRFToken` (lo atiende `frontend` con F-23).
- Límite de intentos **antes de tocar la base**: las mismas llaves de `carrito._throttled` (IP y sesión).
- Cuerpo acotado (por ejemplo 32 KB; más grande → 413) y **a lo más 50 líneas antes de consultar productos** (`MAX_ORDER_LINES`, F-32).
- Cada línea: `product_id`, `mode` y solo los campos permitidos del modo (`pricing._ALLOWED_FIELDS`). Cualquier otro campo (`total`, `unit_price`, `currency` por línea) se rechaza con `invalid_items`.
- Unidades (S15.8: g, kg o lb): la vista acepta `unit` en `g`, `kg` o `lb` **solo para el modo por peso**, y la convierte a gramos enteros antes de `close_price`: 1 lb = 453.59237 g exactos, redondeo mitad hacia arriba al gramo. `close_price` sigue recibiendo `grams`; el campo `unit` nunca le llega.
- Datos del cliente con o sin cuenta (#3362 regla 2): sin cuenta, nombre y teléfono obligatorios (las reglas de `create_order_web`); `delivery_type` `pickup` o `delivery`; para domicilio, la dirección y la zona (§2.3).
- Moneda del cobro: `MXN` (por defecto) o `USD`.

### 2.2 Total en el servidor

1. Cargar **solo productos activos** (L22: `close_price` no mira `is_active` del producto), sus tamaños activos y las piezas enteras **de ese producto** (L22: `PieceVariant` no lleva `product_id`).
2. **F-46:** la ruta de pieza fija de `close_price` (`pricing.py:264`) se salta `sale_modes` y `low_stock`. T9 comprueba antes de llamarla que `"pieces" in product.sale_modes` y que haya stock en piezas suficiente; si no, `sale_mode_not_allowed` o `insufficient_stock`. Se corrige dentro de `close_price` (la comprobación se mueve antes de la ruta fija), con su prueba RED, para que ningún otro llamador herede el hueco.
3. `close_price` por línea (con el `price_per_kg` de la promoción vigente, §8.4 del contrato de precios) y `order_total(lineas, envio)`.
4. Envío (§2.3) y conversión a USD si aplica: `total_usd = total_mxn / tasa`, al centavo, mitad hacia arriba, con la tasa de `current_fx`; si la tasa está `stale` o `missing`, el cobro en USD se rechaza con un mensaje que ofrece MXN.
5. **Topes de F-32** antes de crear nada:
   - total mínimo: el mayor entre el mínimo de Stripe (10.00 MXN o 0.50 USD, https://docs.stripe.com/currencies) y el mínimo de la tienda;
   - total máximo de la tienda (Stripe solo limita por dígitos);
   - peso máximo por línea de piezas (hoy solo el modo dinero tiene tope, `pricing.py:271-272`).
   Los tres valores viven en `shop_settings` (§5) y los edita el panel (T7d). **Decisión de Eduardo** (§9), con valores propuestos.
6. Lo que se guarda en el pedido y lo que se manda a Stripe es **exactamente ese total**. Nada del cliente entra al total.

### 2.3 Envío gratis desde un monto y cuota por zona

- `shop_settings.free_shipping_from_mxn` (nulo = desactivado). Si `delivery_type = 'delivery'` y el subtotal de las líneas en MXN (ya con promociones, antes del envío) es mayor o igual al umbral, el envío es 0; si no, la cuota de la zona.
- La zona tiene que ser entregable aun con envío gratis: `out_of_range` sigue rechazando.
- **SUPOSICIÓN:** el servidor no mide kilómetros (no hay geocodificación propia, y mandar la dirección a un servicio de terceros necesita el OK de Eduardo, regla global 4). Hasta que se decida, el cliente elige la zona de una lista que da el servidor (nombre de zona o colonias) y la cuota sale de esa fila. El mapa de terceros, si llega, solo muestra.

### 2.4 Reserva del stock de la fuente (S15.8, supuesto A2)

**Plazo:** la sesión de Checkout se crea con `expires_at = ahora + 30 minutos`. La regla de Stripe: `expires_at` "can be anywhere from 30 minutes to 24 hours after Checkout Session creation. By default, this value is 24 hours from creation" (https://docs.stripe.com/api/checkout/sessions/create). Se toma el mínimo porque es carne con existencia limitada (el patrón de Stripe "Manage limited inventory", https://docs.stripe.com/payments/checkout/managing-limited-inventory). El valor vive en `shop_settings.checkout_minutes` (30 a 1440; fuera de ese rango se rechaza al escribir).

**Reserva:** una función nueva `reserve_order_stock(p_order_id, p_expires_at)`, SECURITY DEFINER con `search_path ''`, EXECUTE solo para `django`:

1. Calcula lo que necesita el pedido con **la misma regla de reparto** que `set_order_status` (primero el stock propio y luego la fuente; gramos exactos por modo). Para no tener dos copias, la regla se extrae a un ayudante SQL `_order_stock_needs(p_order_id)` que usan las dos funciones.
2. Bloquea los productos y sus fuentes **por id ascendente** (el mismo orden de T7b: sin deadlock nuevo).
3. Disponible = `stock` menos las reservas activas de **otros** pedidos (`released_at IS NULL AND consumed_at IS NULL AND expires_at + gracia > now()`). Si no alcanza: `insufficient_stock` y **no se crea la sesión de pago** ("sin stock suficiente, no deja pagar").
4. Inserta una fila de `stock_reservations` por producto que guarda el stock (la fuente o el producto propio), con `expires_at` = el de la sesión.

`low_stock` deja de ser solo un aviso en la web: la reserva lo vuelve bloqueante (F-32, tercer punto).

**Gracia:** una reserva cuenta como activa hasta `expires_at + 10 minutos`, para que un webhook `checkout.session.completed` que llegue con retraso encuentre su stock apartado.

### 2.5 Crear la sesión de Checkout e ir a pagar

Transacción 1 (en la base, una sola): crear el pedido `pending` con las líneas cerradas, `payment_method = 'tarjeta'`, la moneda y la tasa; reservar (§2.4); crear la fila `order_payments` en estado `open` con el total en unidades menores y la moneda. Si algo falla, nada queda escrito.

Después, fuera de la transacción, la llamada a Stripe (`POST /v1/checkout/sessions`):

- `mode=payment`, `payment_method_types=["card"]` (S16: "Stripe (varias tarjetas)"; §9 explica por qué OXXO y SPEI quedan fuera de esta entrega);
- una línea por línea del pedido con `price_data.unit_amount` = el total cerrado de la línea y `quantity=1`, más una línea de envío si cobra; la suma es exactamente el total guardado;
- `currency` en minúsculas (`mxn`/`usd`), `client_reference_id` = id del pedido, `metadata[order_id]` = id del pedido;
- `expires_at` (§2.4), `locale=es-419`;
- `success_url = STORE_ORIGIN + /pedido/<folio>/?session_id={CHECKOUT_SESSION_ID}` y `cancel_url = STORE_ORIGIN + /carrito/`;
- cabecera `Idempotency-Key: checkout-<order_id>` (un reintento no crea dos sesiones).

Se guarda `session_id` y `expires_at` en `order_payments` y se responde `{"url": session.url}`. El navegador hace `window.location.assign(url)`. **Por qué así (nota de L20):** un `<form>` POST que redirige a `checkout.stripe.com` puede quedar bloqueado en Chromium por `form-action 'self'`; un `fetch` al propio origen más una navegación con `window.location` no está sujeto a `form-action`, así que la CSP no cambia (ni `form-action`, ni `script-src`, ni `connect-src`).

Si Stripe falla o no responde: el pedido pasa a `cancelled` con `set_order_status` (libera la reserva, §2.8), `order_payments` queda `expired`, y la respuesta es 502 con un mensaje para la persona. Nunca se reintenta en un bucle.

La página `success_url` **no confirma nada**: solo muestra "estamos confirmando tu pago" y el estado que ya tenga el pedido. La única confirmación es el webhook.

### 2.6 Webhook: `POST /pagos/stripe/webhook/`

- `csrf_exempt` (es lo único sin CSRF: lo autentica la firma), `require_POST`, cuerpo de a lo más 64 KB (si no, 413), **sin límite por IP** (L20: Stripe sale de muchas IP y el contador no debe tumbar pagos).
- **Firma sobre el cuerpo crudo** (`request.body`, sin parsear ni normalizar): cabecera `Stripe-Signature`; mensaje firmado = `t + "." + cuerpo`; HMAC-SHA256 con `STRIPE_WEBHOOK_SECRET`; vale si **alguna** entrada `v1` coincide, comparada en tiempo constante; las `v0` se ignoran; se rechaza si `|ahora - t| > 300 s` (la tolerancia por omisión de las librerías de Stripe; nunca 0). Fuente: https://docs.stripe.com/webhooks ("Verify webhook signatures manually" y "Preventing replay attacks"). Firma inválida o vencida → 400 sin tocar la base.
- Eventos que se procesan: `checkout.session.completed` con `payment_status = "paid"` y `checkout.session.expired`. Cualquier otro → 200 sin efecto (se registra el tipo).
- **Idempotencia por id de evento:** tabla `payment_events (event_id PK)`; `INSERT … ON CONFLICT DO NOTHING` dentro de la misma transacción que el cambio de estado. Si ya existía → 200 sin efecto. Si la transacción falla por algo transitorio, se revierte todo (también el registro del evento) y se responde 500 para que Stripe reintente.
- **Idempotencia por estado:** se bloquea la fila de `order_payments` por `session_id` (`FOR UPDATE`). Solo un pago `open` con su pedido `pending` puede confirmarse. Si el pedido ya está `confirmed` o más adelante → 200 sin efecto.
- **Montos:** `amount_total` y `currency` del evento deben ser iguales al total en unidades menores y a la moneda guardados en `order_payments`, y `client_reference_id`/`metadata.order_id` igual al pedido de esa sesión. Si no coinciden: no se confirma, `order_payments.status = 'mismatch'`, se registra un error con el id del pedido (sin datos de tarjeta) y se responde 200 (reintentar no lo arregla); queda para revisión y reembolso desde el panel.
- **La venta:** `set_order_status(order_id, 'confirmed', 'stripe')`. Esa función ya bloquea la fila del pedido y luego productos y fuentes por id ascendente, y descuenta exactamente lo vendido. Además, en la misma transacción: marca las reservas del pedido como consumidas (§2.8), `order_payments.status = 'paid'` con `payment_intent` y fecha, y emite el código de entrega (T10).
- **Pago que llega sin stock** (la reserva venció y otro se llevó el stock, o un conteo bajó la existencia): `set_order_status` lanza `insufficient_stock`. Se guarda el evento, el pedido pasa a `cancelled`, `order_payments.status = 'refund_pending'`, y después de la transacción se pide el reembolso a Stripe con `Idempotency-Key: refund-<payment_intent>`. Si el reembolso falla, queda `refund_pending` y el barrido lo reintenta (§2.7). Lo mismo si el pago llega cuando el pedido ya caducó.
- `checkout.session.expired`: si el pedido sigue `pending`, `set_order_status(..., 'cancelled', 'stripe')` y `order_payments.status = 'expired'`.

### 2.7 Caducidad de los pendientes sin pago (#3362 regla 5)

Tres capas, la primera es la principal:

1. El evento `checkout.session.expired` (§2.6).
2. Un barrido acotado (por ejemplo 20 pedidos) al inicio de cada `POST /pagos/checkout/`: pedidos `pending` con `order_payments.expires_at + gracia < now()`. Para cada uno pide a Stripe expirar la sesión (`POST /v1/checkout/sessions/{id}/expire`): si la expira o ya estaba expirada → cancela el pedido; si Stripe dice que se completó → no la cancela (el webhook la confirma). También reintenta los `refund_pending`.
3. El comando `manage.py expire_unpaid_orders`, el mismo barrido sin tope, para un cron. Programarlo en Render es configuración de despliegue: **Decisión de Eduardo**.

Cancelar un `pending` no repone stock (nunca se descontó): solo libera la reserva. Así el pedido caducado también libera el cupo de la regla de 3 pendientes por teléfono.

### 2.8 Cambios a `set_order_status`

Mínimos, en una migración nueva (escrita, NO aplicada; Riesgo 1 y 4):

- `pending → confirmed`: usa `_order_stock_needs` (la misma regla), comprueba contra `stock` menos las reservas activas de **otros** pedidos y marca las del propio como `consumed_at = now()`.
- `pending → cancelled`: marca las reservas del pedido como `released_at = now()`.
- Nada más cambia: los mismos estados, el mismo orden de bloqueo y la misma devolución al cancelar desde `confirmed` en adelante.

### 2.9 F-04: la IP del cliente para el límite de intentos

Detrás del proxy (`DJANGO_BEHIND_PROXY`, `CHECKOUT_TRUST_FORWARDED_FOR`), `client_ip` (`ventas/throttle.py:33-40`) lee `CF-Connecting-IP`, validada con `ipaddress`; si falta o no es una IP, la **última** entrada de `X-Forwarded-For` como hoy; si no, `REMOTE_ADDR`. Nunca la entrada de la izquierda, `True-Client-IP` ni `X-Real-IP`. IPv6 agrupada por /64 (`_key_of`). Sin proxy, siempre `REMOTE_ADDR` aunque venga `CF-Connecting-IP`. El comentario de `settings.py:341-342` se corrige para nombrar la cabecera real. Invariante documentado: si algún día otro servicio de la red privada de Render llama a Django, esta regla se revisa (ahí `CF-Connecting-IP` llega como la mande quien llama). Una variable de saltos de confianza no entra sin el OK de Eduardo (cambia el contrato del entorno).

### 2.10 WhatsApp (S11, "igual con la web y con el whatsapp")

En esta entrega no se construye el chatbot (L27). El servicio que crea pedido, reserva y sesión es una función de dominio (`payments.start_checkout(...)`) que no depende de la vista; T11 la llamará con `channel = 'whatsapp'` y mandará el `url` de Checkout como link de pago. Ningún pedido de WhatsApp pasa a preparación sin el mismo webhook.

## 3. SDK oficial de Stripe o sin SDK

Solo se usan cuatro operaciones: crear sesión, expirar sesión, reembolsar y verificar la firma del webhook. En los dos casos el código de Carni habla con un puerto propio (`payments.gateway.PaymentGateway`, con `create_checkout`, `expire_checkout` y `refund`) y las pruebas usan un doble de ese puerto; la verificación de firma se prueba con firmas HMAC reales hechas en la prueba con un secreto de prueba.

| | SDK oficial (`stripe` para Python) | Sin SDK (`urllib` de la biblioteca estándar) |
|---|---|---|
| Firma del webhook | `stripe.Webhook.construct_event` (mantenida por Stripe, tolerancia de 300 s) | unas 30 líneas propias con `hmac.compare_digest`, documentadas por Stripe paso a paso |
| Llamadas a la API | tipadas; codificación de parámetros anidados (`line_items[0][price_data][…]`), reintentos de red e `Idempotency-Key` resueltos | hay que codificar a mano los parámetros anidados, fijar `Stripe-Version`, el tiempo de espera y los errores; es donde suelen estar los errores |
| Dependencias | una nueva (y las suyas) en `uv.lock`; superficie de cadena de suministro y un pin más que vigilar en "ya es lunes" | ninguna |
| Instalación | necesita red: el comando lo corre Eduardo | nada que instalar |
| Versión de la API | fijada por la versión del SDK | fijada a mano en la cabecera |

**Recomendación: el SDK oficial**, fijado en `uv.lock`, detrás del puerto. Es dinero real (Riesgo 1 y 2): la codificación de parámetros, los reintentos y la verificación de firma mantenidos por Stripe valen más que ahorrar una dependencia, y es un paquete del propio proveedor con el que ya se habla. El puerto deja cambiar de opinión sin tocar el dominio. Comando para Eduardo (en `backend/`, con red): `uv add stripe`; después, la auditoría de dependencias (`supply-chain-risk-auditor`) sobre el lock antes del commit.

## 4. Variables de entorno (en `backend/.env`; solo los nombres)

Cada una se lee con `require_env`: si falta, Django no arranca y el mensaje nombra la variable y `backend/.env`. `settings_test.py` pone valores de prueba fijos; nadie lee `backend/.env`.

| Variable | Para qué | Nota |
|---|---|---|
| `STRIPE_SECRET_KEY` | La llave secreta de Stripe (en esta etapa, la de **modo prueba**, `sk_test_…`) para crear, expirar y reembolsar sesiones | Solo servidor. Nunca con prefijo `VITE_*`. |
| `STRIPE_WEBHOOK_SECRET` | El secreto de firma del endpoint (`whsec_…`) para verificar el webhook | Es distinto el de `stripe listen` en local y el del endpoint del Dashboard. |
| `DELIVERY_CODE_PEPPER` | La llave HMAC de los códigos de entrega (T10) | Aleatoria, de 32 bytes o más. Cambiarla invalida todos los códigos vivos. |

No hace falta llave publicable (Checkout alojado). `STORE_ORIGIN` ya existe y se reusa para las URL de regreso. Para PayPal (T9b, opcional), los nombres serían `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_WEBHOOK_ID` (este último lo exige su verificación de firma); solo se agregan si T9b entra. Desplegar exige declarar las mismas variables en `render.yaml` con `sync: false`: es configuración de entrega (Riesgo 5), en su propio commit.

## 5. Modelo de datos nuevo (migración escrita, NO aplicada)

Todas con RLS activado y sin políticas para `anon` ni `authenticated`; las escrituras pasan por funciones SECURITY DEFINER con `search_path ''` y EXECUTE solo para `django`; dinero en `numeric(12,2)` o unidades menores `bigint`, nunca float. Privilegios de las secuencias revocados para `anon` y `authenticated` (F-28).

| Tabla | Columnas clave | Reglas |
|---|---|---|
| `order_payments` | `order_id` (único, FK), `provider` (`stripe`; `paypal` si T9b), `session_id` (único), `payment_intent_id`, `amount_minor bigint > 0`, `currency` (`mxn`/`usd`), `expires_at`, `status`, `paid_at`, `created_at`, `updated_at` | `status` en `open`, `paid`, `expired`, `mismatch`, `refund_pending`, `refunded`. Es el estado **del cobro**, no del pedido: el pedido sigue con su máquina de estados. |
| `payment_events` | `event_id text PK`, `type`, `order_id`, `received_at` | Idempotencia del webhook. |
| `stock_reservations` | `order_id`, `product_id` (el que guarda el stock: fuente o propio), `qty numeric(10,3) > 0`, `expires_at`, `consumed_at`, `released_at` | Índice parcial por `product_id` donde `consumed_at IS NULL AND released_at IS NULL`. |
| `shop_settings` (una fila) | `free_shipping_from_mxn`, `order_min_mxn`, `order_max_mxn`, `max_line_weight_kg`, `checkout_minutes` (30 a 1440), `delivery_window_hours` | CHECK de rangos y `<> 'NaN'` (F-31). La edita el panel (T7d). |
| `order_delivery_codes` | `order_id` (único, FK), `code_hmac bytea`, `nonce bytea`, `issued_at`, `expires_at`, `attempts smallint` (0 a 5), `locked_at`, `used_at`, `used_by`, `used_channel` | T10, §6. |
| `orders.public_ref` (columna nueva) | folio público, 8 caracteres en base32 de Crockford (sin I, L, O, U), único | Separado del código; es lo que ve el cliente y lo que se dicta. |

## 6. T10: código de entrega y QR

### 6.1 Emisión

- **Solo tras el pago confirmado**: dentro de la transacción del webhook que pasa el pedido a `confirmed` (§2.6). Ningún otro camino emite códigos.
- Código de 6 dígitos: `secrets.randbelow(10**6)`, con ceros a la izquierda. Se guarda `nonce` aleatorio (16 bytes) y `code_hmac = HMAC-SHA256(DELIVERY_CODE_PEPPER, "verify|" + order_id + "|" + código)`. **Nunca se guarda en claro.** Atado al pedido: el mismo código no vale para otro pedido.
- **Mostrarlo sin guardarlo en claro:** el código se deriva, no se sortea al azar sin rastro: `código = int(HMAC-SHA256(pepper, "code|" + order_id + "|" + nonce)) mod 10^6`. Así la página del pedido puede volver a mostrárselo a su dueño, y una copia filtrada de la base no basta para conocerlo (falta el pepper). Reemitir = nuevo `nonce` (el código anterior deja de valer).
- **QR con el mismo token:** contenido `CARNI:<folio>:<código>`, generado en el servidor como SVG en línea (§6.4). No es otro secreto: es el mismo código.
- **Caducidad:** `expires_at = fin de la ventana de entrega + 24 h`. **SUPOSICIÓN:** como el pedido aún no guarda una ventana, fin de la ventana = `paid_at + shop_settings.delivery_window_hours` (propuesta: 4 h, como el "2 horas aproximadamente" de Grill House con margen). Si Eduardo quiere ventanas elegidas por el cliente, se agrega la columna al pedido y esta regla toma ese valor.
- **Dónde lo ve el cliente:** `/pedido/<folio>/`, solo si la sesión es la dueña del pedido (con cuenta: `user_id`; invitado: el id del pedido guardado en su sesión al crear el pago). Nunca en la URL, nunca en un log. La página muestra el código, el QR, el folio y el aviso literal: **"no compartas tu código hasta recibir tu pedido"**.

### 6.2 Validación: un solo servicio

`delivery.redeem(folio, código, actor, channel)`, en una transacción:

1. Busca el pedido por folio y bloquea su fila de `order_delivery_codes` (`FOR UPDATE`). Pedir folio y código juntos evita adivinar un código contra todos los pedidos a la vez.
2. Resultado, en este orden: `not_found`; `used`; `locked` (5 fallos); `expired`; `not_ready` (el pedido no está en `ready`); `wrong` (con los intentos restantes); `ok`.
3. Comparación en tiempo constante (`hmac.compare_digest`) del HMAC del código recibido con `code_hmac`.
4. Un fallo suma `attempts` **y se guarda** (la transacción no se revierte por un código incorrecto); al quinto, `locked_at = now()`. Desbloquear es reemitir desde el panel (solo administrador), con nuevo `nonce`.
5. `ok`: `used_at`, `used_by`, `used_channel`, y `set_order_status(order_id, 'delivered', actor)` en la misma transacción. Un solo uso: un segundo intento devuelve `used`.

Estados: se reusan los de `set_order_status`. La entrega solo ocurre en `ready → delivered`; preparar y marcar listo siguen siendo del panel (y de T11 después). No se inventan estados paralelos.

### 6.3 Quién valida

- **Recogida (supuesto A4):** el mostrador desde el panel, en la sección Entregas: un formulario POST con CSRF, `panel_admin_required`, que acepta folio y código o el texto del QR (un lector USB lo teclea como `CARNI:<folio>:<código>` y el servidor lo separa). Límite de intentos por usuario del panel (por ejemplo 30 por minuto) además de los 5 por código.
- **Domicilio:** el mismo `delivery.redeem` con `channel = 'whatsapp'` queda listo y probado para el webhook de WhatsApp de T11, sin chatbot, sin endpoint nuevo y sin simular mensajes (L27). La foto de prueba, los roles y la bitácora de S16 son de T11.

### 6.4 Librería de QR

**Segno** (https://github.com/heuer/segno, consultada con context7): Python puro, **sin dependencias**, conforme a ISO/IEC 18004, y genera SVG en línea con `segno.make(texto, error='m').svg_inline(scale=…)`. No llama a la red al generar. El SVG en línea no necesita `img-src data:` ni JavaScript, así que no cambia la CSP. Instalar sí necesita red: `uv add segno`, lo corre Eduardo. Alternativa sin dependencia: mostrar solo el código de 6 dígitos y el folio, y agregar el QR después; no se escribe un codificador de QR propio. Ningún servicio de QR de terceros (L28).

## 7. Pruebas RED

Django (`TestCase`, `settings_test`), con el doble del puerto de pagos y firmas reales hechas en la prueba. Cada regla tiene su prueba y cada prueba afirma todos los efectos visibles (respuesta, código de estado, filas guardadas). Las de SQL van en `supabase/tests/pagos_y_entrega.sql` con `plan(n)` (no `no_plan()`, F-45), y se corren contra Postgres antes de aplicar.

### T9

1. El total que se manda a Stripe es el de `close_price` + envío; un `total`, `unit_price` o `currency` por línea en el cuerpo da `invalid_items` y no crea pedido ni sesión.
2. 51 líneas → rechazo **sin consultar productos** (`assertNumQueries(0)` después del límite).
3. El límite de intentos responde 429 antes de leer la base.
4. Sin `X-CSRFToken` → 403; el webhook no exige CSRF.
5. Producto inactivo → rechazo; pieza de otro producto → rechazo (L22).
6. F-46: producto sin `"pieces"` en `sale_modes` pedido por pieza fija → `sale_mode_not_allowed`; piezas sin stock suficiente → `insufficient_stock`.
7. Unidades: 1 lb → 454 g; 0.5 kg → 500 g; `unit` en modo pieza o dinero → `invalid_items`.
8. USD: con tasa vigente cobra `total_usd` en centavos y guarda `fx_rate_used`; con tasa `stale` o `missing` rechaza USD.
9. Envío gratis: subtotal igual al umbral → envío 0; un centavo menos → cuota de la zona; umbral nulo → siempre cuota; zona fuera de rango → rechazo aun con envío gratis.
10. Topes F-32: 9.99 MXN y 0.49 USD rechazados; el máximo de la tienda + 0.01 rechazado; línea de piezas sobre el peso máximo rechazada.
11. Reserva: con 1 kg disponible, dos pedidos de 0.7 kg → el segundo `insufficient_stock` y sin sesión de Stripe; la reserva de un pedido vencido (más la gracia) ya no cuenta.
12. La sesión se crea con `expires_at` = ahora + `checkout_minutes`, `client_reference_id`, `metadata.order_id`, `payment_method_types=["card"]` e `Idempotency-Key`; la respuesta es JSON `{"url"}` y no un redirect.
13. Stripe falla → pedido `cancelled`, reserva liberada, 502.
14. Webhook con firma inválida, sin cabecera, con `t` de hace 301 s o con el cuerpo cambiado en un byte → 400 y la base sin cambios; firma con varias `v1` donde una coincide → vale.
15. Webhook válido → pedido `confirmed`, stock descontado una vez, reserva consumida, `order_payments.paid`, código emitido.
16. El mismo evento dos veces → un solo descuento y un solo código; otro evento de la misma sesión con el pedido ya `confirmed` → 200 sin efecto.
17. `amount_total` o `currency` distintos → sin confirmar, `mismatch`, 200.
18. Pago que llega sin stock o con el pedido caducado → `cancelled`, `refund_pending`, reembolso pedido con su `Idempotency-Key`.
19. `checkout.session.expired` → `cancelled` y reserva liberada; un evento de tipo desconocido → 200 sin efecto.
20. Barrido: un `pending` vencido se cancela si Stripe expira la sesión, y no se cancela si Stripe dice que se completó.
21. F-04: las 7 pruebas del informe en `test_contract_throttle.py` (CF-Connecting-IP gana; dos CF distintas con la misma última XFF no comparten contador; sin CF, la última XFF como hoy; la izquierda nunca gana; sin proxy, `REMOTE_ADDR`; IPv6 por /64; valor inválido → siguiente fuente).
22. Comportamiento previo intacto: el carrito (`carrito.pedido`) y `cotizar` siguen respondiendo igual (una prueba por comando que comparte el código tocado).
23. SQL: `reserve_order_stock` y el nuevo `set_order_status` (concurrencia por id ascendente, reservas de otros pedidos, consumo y liberación); `anon` y `authenticated` sin EXECUTE ni SELECT en las tablas nuevas; `relrowsecurity` activado.

### T10

1. Sin pago confirmado no hay código; tras el webhook hay exactamente uno.
2. La base nunca contiene el código en claro (se busca el texto de 6 dígitos en la fila y no aparece); el HMAC depende del pepper (otro pepper no valida).
3. Código correcto con el pedido en `ready` → `delivered`, `used_at` y `used_by` guardados.
4. Segundo uso → `used`, sin cambio de estado.
5. Cinco códigos incorrectos → `locked`; el sexto, aun correcto, → `locked`; los intentos fallidos quedan guardados.
6. Pasadas 24 h del fin de la ventana → `expired`.
7. Pedido en `confirmed` o `preparing` → `not_ready`.
8. El código de un pedido no vale para otro pedido.
9. Reemitir (solo administrador) invalida el código anterior y pone `attempts = 0`.
10. La página del pedido muestra el código, el QR y el aviso literal "no compartas tu código hasta recibir tu pedido" solo a su dueño; otra sesión recibe 404.
11. El QR decodifica a `CARNI:<folio>:<código>`; el formulario del panel acepta el texto del QR y lo separa.
12. El formulario de recogida exige administrador y CSRF, y tiene su límite de intentos.
13. `delivery.redeem(..., channel='whatsapp')` funciona sin vista ni chatbot (listo para T11).
14. El folio no revela el código ni el id del pedido, y es único.

## 8. Superficie de archivos (para las tandas siguientes)

T9:
- `supabase/migrations/<fecha>_pagos_y_reserva.sql` (nuevo; `order_payments`, `payment_events`, `stock_reservations`, `shop_settings`, `orders.public_ref`, `_order_stock_needs`, `reserve_order_stock`, `set_order_status`) y `supabase/tests/pagos_y_entrega.sql` (nuevo). Commit propio, antes del código.
- `backend/payments/` (app nueva: `apps.py`, `gateway.py` (puerto), `stripe_gateway.py` (adaptador), `checkout.py` (dominio), `webhook.py`, `views.py`, `urls.py`, `models.py` con `managed = False`, `management/commands/expire_unpaid_orders.py`, `tests/`).
- `backend/inventory/pricing.py` (F-46) y su prueba.
- `backend/ventas/throttle.py`, `backend/ventas/tests/test_contract_throttle.py` (F-04).
- `backend/config/settings.py`, `backend/config/settings_test.py`, `backend/config/urls.py`.
- `backend/pyproject.toml` y `backend/uv.lock` (los cambia el comando de Eduardo).
- `docs/contratos/pagos-y-entrega.md` (este) y el diagrama `docs/diagramas/t9-pagos.html`.
- Fuera de mi superficie, de `frontend`: el `fetch` con `X-CSRFToken` y `window.location.assign` en el carrito, y la página `/pedido/<folio>/`.

T10:
- `supabase/migrations/<fecha>_codigo_de_entrega.sql` (nuevo; `order_delivery_codes` y su función de canje) y sus aserciones en `supabase/tests/pagos_y_entrega.sql`.
- `backend/delivery/` (app nueva: `codes.py`, `service.py` con `redeem`, `models.py`, `tests/`), o un módulo dentro de `backend/payments/` si el lead prefiere una sola app.
- `backend/panel/` (la vista de Entregas para la recogida) y su plantilla; el diagrama `docs/diagramas/t10-entrega.html`.

## 9. Supuestos y decisiones para Eduardo

1. **Topes de F-32** (valores propuestos, editables en el panel): total mínimo de la tienda 50.00 MXN; total máximo 20 000.00 MXN; peso máximo por línea de piezas 30 kg. Stripe impone además 10.00 MXN y 0.50 USD de mínimo.
2. **Plazo del pago:** 30 minutos (el mínimo que permite Stripe). Más tiempo aparta la carne más tiempo.
3. **Solo tarjeta en esta entrega.** OXXO y SPEI son pagos asíncronos: la sesión termina sin pago y el dinero puede llegar días después, cuando la reserva de 30 minutos ya venció. Agregarlos pide otra política de reserva. #3362 los mencionaba; S16 dice "Stripe (varias tarjetas)".
4. **Zona de envío:** el cliente elige la zona de una lista del servidor hasta que se decida cómo medir la distancia; mandar direcciones a un servicio de mapas de terceros necesita tu OK.
5. **Ventana de entrega:** 4 h después del pago, hasta que el pedido tenga una ventana elegida por el cliente; el código caduca 24 h después de esa ventana.
6. **Cron de caducidad en Render** (`expire_unpaid_orders`): opcional, porque el evento de Stripe y el barrido ya caducan los pendientes; programarlo es configuración de despliegue.
7. **Dependencias:** `uv add stripe` y `uv add segno` en `backend/`, con red, los corres tú.
8. **Llaves:** `STRIPE_SECRET_KEY` (modo prueba), `STRIPE_WEBHOOK_SECRET` y `DELIVERY_CODE_PEPPER` en `backend/.env`. Para el webhook local: `stripe listen --forward-to localhost:<puerto>/pagos/stripe/webhook/` te da su propio `whsec_…`.
9. **Precio de la web:** se cobra con `close_price` (recomendación §8.3 del contrato de precios); `quote_line` del SQL queda para el panel. Por eso el pedido de Checkout se guarda con una función que recibe las líneas ya cerradas por Django, no con `create_order_web` (que cotiza con `quote_cart` y no conoce los tamaños). La paridad de las dos rutas la sigue fijando `GoldenCaseParityTests`.
10. **PayPal (T9b):** opcional; mismo total, mismo `order_payments` con `provider = 'paypal'`, webhook verificado con la API de verificación de PayPal. Solo si alcanza.
