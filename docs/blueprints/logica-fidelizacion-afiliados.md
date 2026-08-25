# Lógica de negocio — Fidelización y Afiliados

Fecha: 13 agosto 2026. Borrador para revisión de Eduardo. **Los números son mock defendibles, no decisiones tomadas.** La sección 8 dice qué falta y quién lo tiene.

Responde a la pregunta: *"¿esto se configura en el dashboard o tiene que quedar como lógica de negocio?"*

**Respuesta corta: las dos, y la línea entre una y otra es lo más importante de este documento.**

---

## 1. Parámetro vs. invariante

Un **parámetro** es un número que cambia sin cambiar el comportamiento del sistema. Cuánto vale un punto, dónde empieza VIP2, qué porcentaje descuenta pagar por web. Esos van a base de datos y se editan desde el dashboard.

Un **invariante** es una regla que define *qué* hace el sistema, no *cuánto*. Que un punto se calcule sobre un total validado en el servidor. Que no puedas referirte a ti mismo. Esos van en código y en constraints de base de datos, y **no se exponen en el dashboard** — porque un admin que los apaga por error abre un boquete y nadie se entera.

La regla para saber a cuál pertenece algo:

> Si cambiarlo puede costar dinero pero no romper la integridad → **parámetro**.
> Si cambiarlo puede permitir fraude o corromper datos → **invariante**.

Tu `vision.md` ya proponía `tier_settings` con "configurable thresholds per level". Este documento extiende esa idea y le pone el límite.

---

## 2. Los invariantes — código, no dashboard

Estos **no** aparecen en ninguna pantalla de configuración. No son negociables.

| # | Invariante | Por qué |
|---|---|---|
| I1 | Los puntos se calculan sobre un total recalculado **server-side** contra `products`, nunca sobre un monto que envía el cliente | La objeción 2 del abogado del diablo: hoy `create_order_with_items()` acepta `unit_price` del cliente. Si esto es configurable, cualquiera se auto-otorga puntos infinitos |
| I2 | Todo otorgamiento pasa por una función `SECURITY DEFINER` (hoy `add_points()`), nunca por `UPDATE` directo | `protect_profile_system_fields()` revierte en silencio: un UPDATE directo "tiene éxito" pero no escribe, y nadie se entera |
| I3 | Un perfil no puede referirse a sí mismo | El fraude más obvio de cualquier programa de referidos |
| I4 | Un referido solo califica tras una **primera compra entregada** (`status = 'delivered'`), no al registrarse | Registrarse es gratis; comprar y recibir, no |
| I5 | Existe un tope de exposición por cliente y global | El *valor* del tope es parámetro. Que **exista** es invariante |
| I6 | Existe una ventana entre otorgar y poder canjear | El plazo es parámetro. Que exista la ventana, no |
| I7 | Todo movimiento de puntos deja rastro en un ledger inmutable | Sin historial no hay forma de auditar ni revertir |
| I8 | Los descuentos apilados nunca superan un tope por pedido | Sin esto, tres promociones legítimas pueden vender a pérdida |

---

## 3. Los parámetros — dashboard administrativo

Todo esto vive en base de datos y se edita desde el panel. Cada cambio queda versionado con fecha y quién lo hizo.

### 3.1 Motor de puntos

| Parámetro | Mock | Justificación |
|---|---|---|
| `pesos_por_punto` | **100** | Es lo que ya hace tu `loyalty.js` línea 96 |
| `valor_punto_mxn` | **0.50** | Tu regla actual: 100 pts = $50 |
| `retorno_efectivo` | **5%** | Resultado de los dos anteriores. Coincide con ButcherBox (2 pts/USD, 1000 pts = $10) |
| `puntos_caducan_meses` | **6** | Mismo benchmark. Sin caducidad, el pasivo crece para siempre |
| `minimo_canje_puntos` | **100** | Evita canjes de $1 que cuestan más en fricción que en dinero |

> **Contradicción a resolver**: `docs/brain/vision.md` línea 34 dice "1 point per $10 MXN". Tu código dice $100. Con $10 devolverías **50%** de cada venta. Es un error de documentación, no una decisión — pero hay que corregirlo en `vision.md` para que nadie lo implemente.

### 3.2 Niveles

Cuatro niveles, calificación **mixta**: hay que cumplir gasto **y** frecuencia. Solo con gasto, un cliente que compra $6,000 una vez al año empata con uno que compra $500 cada semana — y el segundo vale mucho más.

| Nivel | Gasto en 6 meses | Compras en 6 meses | Beneficios (mock) |
|---|---|---|---|
| **Principiante** | — | — | Acumula puntos. Nada más |
| **Regular** | $3,000 | 6 | +1% en puntos · acceso a ofertas relámpago |
| **Premium** | $9,000 | 15 | +2% en puntos · envío gratis desde $500 · 24h de acceso anticipado a ofertas |
| **VIP** | $20,000 | 30 | +3% en puntos · envío siempre gratis · prioridad en el Kanban · corona morada |

**Ventana móvil de 6 meses**, no acumulado histórico. Un cliente que dejó de comprar hace un año no debería seguir siendo VIP.

**Por qué los umbrales tienen que ser editables, y no es capricho**: la carne subió **16.5% anual**. Un umbral de $20,000 fijado hoy equivale a $17,000 de poder de compra el año entrante — el cliente llega a VIP comprando *menos carne*. Sin ajuste periódico, los niveles se degradan solos.

**Nota sobre el beneficio de envío**: regalar envío cuesta gasolina y tiempo, no producto. Es el beneficio más barato de dar y el que más se percibe. Los descuentos en dinero salen directo del margen.

### 3.3 Afiliados

| Parámetro | Mock | Nota |
|---|---|---|
| `recompensa_referidor` | **200 puntos** ($100) | Se paga una sola vez por referido calificado |
| `recompensa_referido` | **10% en su primera compra**, tope $150 | El gancho para que el invitado lo use |
| `compra_minima_calificante` | **$400** | Debe ser mayor a lo que cuesta la recompensa combinada |
| `ventana_retencion_dias` | **14** | Entre otorgar y poder canjear. Cubre devoluciones |
| `max_referidos_por_mes` | **5** | Frena el farmeo industrial |
| `max_referidos_totales` | **20** | Tope de vida por cuenta |

**Cómo funciona el QR y el link**, que es lo que pediste:

Cada perfil genera un `referral_code` único al alcanzar nivel Regular — no antes, porque un recién registrado no debería poder invitar a nadie. El código produce dos cosas idénticas por dentro: un link `carni.mx/?ref=CODIGO` y un QR que apunta al mismo link.

El invitado abre el link, el código queda guardado en su sesión, se registra, y en su primera compra entregada por encima del mínimo se dispara la calificación. Ahí empieza la ventana de retención de 14 días. Pasada la ventana sin devolución ni contracargo, los puntos del que refirió se vuelven canjeables.

Que el código se libere en nivel Regular es una defensa barata: obliga a que quien invita ya sea cliente real con historial, no una cuenta creada esa mañana.

### 3.4 Canal y forma de pago

Aquí está lo que preguntaste sobre precio único e IVA.

| Parámetro | Mock |
|---|---|
| `descuento_pago_web` | **3%** |
| `tope_descuento_apilado_por_pedido` | **12%** |

**El precio del producto es uno solo**, igual en mostrador que en web. El descuento por pagar en línea se aplica al pedido, no al precio de lista. Así el catálogo es honesto y no hay que mantener dos listas.

**Corrección importante a tu razonamiento**: dijiste que el descuento web sirve "para cubrir comisiones de Stripe". Va al revés — Stripe cobra ~3.6%, y si además descuentas 3%, ese pedido te cuesta 6.6% más que cobrarlo en efectivo.

El descuento por pago web se justifica, pero por otras razones, y son buenas:

- Cobras **antes** de cortar la carne. Cero pedidos apartados que nadie recoge
- Eliminas el manejo de efectivo y sus faltantes
- Te quedas con el dato del cliente, que es lo que alimenta todo el programa de puntos
- Reduces tiempo de mostrador en hora pico

Si al final el 3% no compensa, se baja desde el dashboard. Por eso es parámetro.

**El tope de apilado de 12% es la pieza que faltaba.** Hoy nadie ha sumado los descuentos:

| Concepto | Máximo |
|---|---|
| Puntos ganados | 5% + 3% de bono VIP = 8% |
| Descuento por pago web | 3% |
| Canje de puntos previos | variable |
| Comisión de Stripe | 3.6% |

Un VIP pagando por web con puntos acumulados puede llevarse **más del 15%** de una sola venta, más la comisión. Sobre márgenes de carnicería eso puede ser el pedido completo sin utilidad. El tope corta ahí, sin importar cuántas promociones legítimas se junten.

---

## 4. Tablas nuevas

```sql
-- Configuración editable desde el dashboard
tier_settings          -- nivel, min_gasto, min_compras, ventana_meses,
                       -- bono_puntos_pct, envio_gratis_desde, prioridad_kanban
loyalty_settings       -- clave, valor, tipo, actualizado_por, actualizado_en

-- Operación
points_ledger          -- perfil_id, delta, motivo, order_id, referral_id,
                       -- creado_en   (append-only, nunca UPDATE ni DELETE)
affiliates             -- profile_id, referral_code UNIQUE, status,
                       -- total_referred, total_rewarded
referrals              -- referrer_id, referred_profile_id, first_order_id,
                       -- reward_status ∈ {pending, granted, void, expired},
                       -- qualified_at, redeemable_at, created_at
```

`points_ledger` es el que no estaba en ningún plan previo y es imprescindible. Hoy `profiles.points` guarda un saldo sin historia: no se puede auditar, ni revertir, ni explicarle a un cliente por qué tiene los puntos que tiene.

Cambios a lo existente:

```sql
ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN nivel TEXT DEFAULT 'principiante';
ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
```

El `UNIQUE` en `phone` sale de la objeción 1: hoy el teléfono solo tiene un CHECK de longitud, así que dos cuentas pueden traer el mismo número.

---

## 5. Posicionamiento de precio — mercado agosto 2026

Referencias reales, para calibrar antes de decidir descuentos:

| Fuente | Precio |
|---|---|
| Bistec, mercados CDMX | $185 – $260 /kg |
| Bistec, Guadalajara | $215 – $235 /kg |
| Carnívoros SLP (premium, Shopify) | Arrachera Select $339 · T-Bone $349.50 · Costilla cerdo $250 — **por pieza, no por kilo** |
| Inflación de res | **+16.5% anual** |

Contra tu seed: **Molida 80/20 a $155 está por debajo del piso nacional** de bistec/molida. O es un precio de captación deliberado, o está desactualizado. Vale revisarlo — no puedes construir un programa de puntos del 5% sobre un producto que ya vendes bajo mercado.

Y con la carne subiendo 16.5% al año, cualquier parámetro fijado en pesos necesita revisión al menos semestral. Otra razón para que viva en el dashboard y no en el código.

---

## 6. Qué se ve en el dashboard

```
Configuración → Fidelización
  Motor de puntos      pesos por punto · valor del punto · caducidad · mínimo de canje
  Niveles              tabla editable de los 4 niveles con sus umbrales y beneficios
  Afiliados            recompensas · compra mínima · ventana · topes por mes y de vida
  Canal                descuento por pago web · tope de apilado

Cada cambio pide confirmación, muestra el impacto estimado en % de retorno,
y queda registrado con fecha y usuario.
```

Los invariantes de la sección 2 **no aparecen aquí**. No hay switch para apagarlos.

---

## 7. Orden de construcción

```
1. Arreglar I1 — create_order_with_items() valida precio contra products
   (es un agujero activo, va antes que todo lo demás)
2. points_ledger + migrar el saldo actual de profiles.points
3. loyalty_settings + tier_settings + la UI del dashboard
4. Motor de niveles sobre el ledger
5. Afiliados: código, QR, link, atribución, ventana de retención
6. Topes de apilado en el checkout
```

El paso 1 no es parte de este módulo y aun así va primero: sin él, todo lo que se construya encima se puede falsificar desde el navegador.

---

## 8. Lo que solo el dueño puede responder

Estos números son mock hasta que él los confirme. **Ninguno bloquea construir el MVP** — todos son editables desde el dashboard. Pero antes de operar con dinero real hay que preguntarle:

1. **Margen bruto promedio por categoría.** Define si el 5% de retorno es sostenible. Es el dato que ningún scraping te da.
2. **Ticket promedio real.** Los umbrales de nivel son adivinanza sin esto.
3. **Frecuencia del cliente recurrente.** ¿Semanal, quincenal?
4. **Costo real de una entrega.** Define si "envío gratis" es barato o caro como beneficio.
5. **Cuánto está dispuesto a invertir en adquirir un cliente nuevo.** Es el techo de la recompensa de afiliados.

Mientras tanto, los mock de este documento están calibrados contra tu código actual y contra un benchmark real del sector. Son defendibles, no inventados. Pero son mock.

---

## 9. Lo que no verifiqué

- **No leí el `admin-customers.html` completo** — solo confirmé que la tarjeta "Afiliados: 42" es un valor escrito a mano, sin backend
- **No revisé si `loyalty.js` está activo en producción** o solo cargado; sé que `index.html` y `dashboard.js` lo importan
- **Los precios de mercado** son de notas de prensa de 2026, no de un scraping directo a supermercados de SLP
- **No hay dato de precios de carnicerías de mostrador en SLP** — no publican en internet. Si los quieres, hay que levantarlos a mano
- **Ningún número de este documento viene del dueño de la carnicería.** Todos son mock calibrados
- **No corrí nada**: ni migraciones, ni tests, ni build
