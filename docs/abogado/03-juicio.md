# Juicio de la Tesis — Programa de Afiliados/Referidos

Juez: síntesis sobre `02-verificacion.md`. No re-verifico evidencia contra
las fuentes de verdad — eso ya está cerrado. Tomo como dadas las 7
objeciones marcadas **CONFIRMADA** (no hubo PARCIALES) y razono sus
implicaciones sobre la tesis. La Objeción 7 (**SIN EVIDENCIA**) queda
excluida por regla del enunciado — no se analiza, está muerta.

Tesis evaluada:

> Un cliente de Carni-mvp puede referir a otro cliente y cobrar una
> recompensa, sin que exista una forma rentable de defraudar el sistema.

Para cada objeción se responde: (1) si mata, reduce, o solo agrega una
restricción de implementación; (2) si mata, qué la salvaría; (3) si
reduce, la versión mínima que sobrevive; (4) costo de atenderla.

---

## Objeción 1: El teléfono de 10 dígitos no es una identidad

**1. Efecto: Reduce.**
La tesis presupone dos identidades distintas — "un cliente... a otro
cliente". Sin `UNIQUE` en `phone` y sin verificación externa (OTP), el
sistema no puede distinguir "otro cliente real" de "la misma persona con
un segundo string de 10 caracteres inventado". No mata la tesis porque
el problema tiene solución conocida (verificación externa de identidad),
pero la vuelve condicional: deja de ser una afirmación sobre el sistema
tal como está documentado hoy.

**3. Versión mínima que sobrevive:** un cliente con identidad
externamente verificada y única puede referir a otro cliente igualmente
verificado y cobrar una recompensa — "verificada" no es adorno, es la
condición que salva la tesis.

**4. Costo: Medio.** La verificación por OTP es un patrón estándar (hay
proveedores ya resueltos para esto), no requiere arquitectura nueva. Pero
sí implica: costo recurrente por verificación, fricción adicional en el
alta que puede afectar conversión, y una migración a `UNIQUE` que primero
debe resolver cualquier duplicado ya sembrado.

## Objeción 2: `create_order_with_items()` no valida el precio contra `products`

**1. Efecto: Reduce — la más peligrosa de las siete.**
Si el evento que califica a un referido depende de `orders.total`, y ese
total se calcula enteramente sobre un `unit_price` que envía el cliente
—sin cotejo contra `products` ni `CHECK` de positividad—, el costo de
entrada para calificar un referido puede acercarse a cero. Eso convierte
"referir y cobrar" en "declarar un precio y cobrar", rentable por
definición si la recompensa supera el precio declarado. La propia
verificación deja esto condicional ("si el gate... usa `orders.total`"),
así que no mata de forma absoluta: existe una salida, que el evento
calificante no dependa de un valor que controla el cliente.

**3. Versión mínima que sobrevive:** el evento que dispara la recompensa
se calcula sobre un valor validado server-side contra el precio real del
producto, nunca sobre un total declarado por el cliente.

**4. Costo: Bajo.** Es una corrección mecánica y acotada — cotejar contra
una fuente de verdad que ya existe (`products`) y agregar validación de
positividad — sin proveedor externo ni decisión de negocio abierta. El
único matiz es qué precio usar si cambió entre que el cliente armó el
carrito y confirmó el pedido; es un detalle de rango acotado, no una
investigación.

## Objeción 3: `protect_profile_system_fields()` revierte en silencio

**1. Efecto: Restricción de implementación — no mata ni reduce.**
El revert silencioso no abre una vía de fraude: al contrario, confirma
que un `UPDATE` directo de cliente a `points` ya está bloqueado hoy. El
riesgo real es otro: si quien construye el otorgamiento de recompensas no
conoce este comportamiento y escribe un `UPDATE` directo en vez de pasar
por una función admin-context (como ya existe `add_points()`), la
recompensa **legítima** tampoco se otorga, y nadie se entera porque no
hay excepción que lo delate. Eso puede romper el lado funcional de la
tesis ("puede... cobrar una recompensa") por un motivo de implementación,
no de seguridad ni de alcance — no cambia lo que la tesis afirma sobre el
fraude.

**4. Costo: Bajo.** El camino correcto ya existe y ya funciona
(`add_points()`); falta usarlo para el otorgamiento y, para no perder
visibilidad de intentos de fraude, dejar rastro de los intentos
bloqueados.

## Objeción 4: Las reglas anti-colusión no existen

**1. Efecto: Reduce — la reducción más severa de las siete.**
El propio blueprint admite que las reglas anti-colusión son "una decisión
de fase de spec", no un detalle pendiente menor. Cruzada con la Objeción
1 (identidad no verificada), hoy no hay ninguna barrera —ni siquiera de
diseño— contra el caso más obvio de fraude en cualquier programa de
referidos: auto-referirse. Esto empuja fuerte hacia "mata", pero no mata
del todo: bloquear el auto-referido más burdo (misma identidad
verificada) es una regla barata y conocida, y ningún programa de
referidos real logra "cero colusión entre cómplices reales" de forma
absoluta — el estándar de la industria es acotar la pérdida esperada, no
eliminarla matemáticamente. La tesis sobrevive solo si "rentable" se
relee como "rentable por encima de un umbral tolerado y vigilado", no
como "imposible en absoluto".

**3. Versión mínima que sobrevive:** no existe forma de defraudar que sea
rentable más allá de un umbral acotado y monitoreado — el sistema no
puede garantizar cero colusión entre cómplices reales distintos, solo
hacerla no rentable a escala.

**4. Costo: Alto.** El bloqueo trivial (misma identidad no puede
referirse a sí misma) es barato una vez resuelta la Objeción 1, pero eso
no es lo que falta: falta la política completa — qué cuenta como
colusión entre dos identidades distintas y verificadas (mismo hogar,
mismo dispositivo, mismo método de pago, patrones de velocidad) — y esa
es una decisión de negocio sin respuesta obvia, más costosa en
definición de política y posible revisión manual que en código.

## Objeción 5: `track_score` no existe en el schema aplicado

**1. Efecto: Restricción de implementación — no mata ni reduce.**
Que `track_score` no exista no bloquea la tesis: ya hay un destino real y
funcional para una recompensa (`profiles.points`, protegido y accesible
vía `add_points()` según la Objeción 3). Esta objeción aporta una
aclaración de secuencia — a qué columna concreta debe apuntar el
otorgamiento hoy (`points`) frente a la aspiración documentada a futuro
(`track_score`, de otro módulo) — no una condición nueva que la tesis
deba incorporar. La tesis no dice "usando `track_score`"; dice "cobrar
una recompensa", y eso ya es alcanzable con lo que existe.

**4. Costo: Bajo.** La pieza protegida ya está construida y probada
(Objeción 3); lo pendiente es una decisión de secuencia (otorgar sobre
`points` ahora, migrar a `track_score` cuando ese módulo exista), no
ingeniería de seguridad nueva.

## Objeción 6: No hay mecanismo para revocar una recompensa otorgada

**1. Efecto: Reduce.**
Ninguna defensa de prevención (identidad, precio validado, reglas
anti-colusión) es perfecta — ningún sistema de prevención lo es; el
estándar realista es prevención + detección + corrección. Esta objeción
confirma que el tercer pilar no existe: no hay transición
`granted → void`, `cancel_order()` solo cubre pedidos `pending` (no
`delivered`), y `update_order_status()` no toca `referrals` ni `points`.
Todo fraude que pase la prevención queda con el pago consumado de forma
permanente, sin importar cuán tarde se detecte. No mata la tesis porque
revocar una recompensa **aún no canjeada** es un patrón conocido y
construible; pero si ya fue canjeada (gastada como crédito o descuento)
antes de detectarse el fraude, no hay revocación técnica posible — esa
porción sí es pérdida irrecuperable pase lo que pase.

**3. Versión mínima que sobrevive:** existe una ventana de retención
entre el otorgamiento y la posibilidad de canje, y un mecanismo que
revoca la recompensa dentro de esa ventana si se detecta fraude — el
sistema acota la pérdida a lo canjeado antes de la detección, no la
elimina.

**4. Costo: Alto.** Requiere una transición de estado nueva, reglas de
negocio sobre cuándo dispararla (reembolso, cancelación tardía, revisión
manual) y, para ser efectiva, probablemente un período de espera antes
de que la recompensa sea canjeable — decisión tanto de producto (afecta
la experiencia del que refiere) como de ingeniería.

## Objeción 8: No hay techo de gasto ni control de exposición

**1. Efecto: Reduce — define el piso de lo que "rentable" puede significar.**
Dado ya en la Objeción 4 que "cero fraude" no es un estándar realista, la
pregunta que queda es cuánta pérdida tolera el negocio. Sin tope de gasto
(por cliente ni global) y sin columnas para sostenerlo —a diferencia de
`promotions`, que ya demuestra el mismo patrón de control de exposición
construido y en uso—, cualquier fuga que sobreviva a las demás defensas
puede repetirse indefinidamente y acumular pérdida sin techo. Para un
negocio con márgenes acotados eso no es un detalle menor. No mata la
tesis porque el patrón para resolverlo ya existe en el propio código
(`promotions`); solo falta aplicarlo a referidos.

**3. Versión mínima que sobrevive:** existe un tope de exposición (por
cliente y global) que acota la pérdida máxima posible incluso si las
demás defensas fallan.

**4. Costo: Bajo.** No es un problema nuevo para el equipo — `promotions`
ya resuelve el mismo tipo de control de exposición con columnas
aplicadas y funcionando; replicar esa forma para referidos es extender
un patrón probado, no inventar uno.

---

## Resumen

| # | Objeción | Efecto sobre la tesis | Costo |
|---|---|---|---|
| 1 | Teléfono no es identidad | Reduce | Medio |
| 2 | Precio no validado contra `products` | Reduce (la más peligrosa) | Bajo |
| 3 | Revert silencioso en `points` | Restricción de implementación | Bajo |
| 4 | Sin reglas anti-colusión | Reduce (la más severa) | Alto |
| 5 | `track_score` no existe | Restricción de implementación | Bajo |
| 6 | Sin revocación de recompensa otorgada | Reduce | Alto |
| 8 | Sin techo de gasto/exposición | Reduce | Bajo |

Ninguna objeción confirmada mata la tesis por sí sola. Cinco la reducen
(1, 2, 4, 6, 8) — cada una agrega una precondición real de la que depende
la verdad del enunciado. Dos son restricciones de implementación (3, 5)
que no cambian el alcance de lo que se afirma, solo cómo construirlo bien.

## Tesis sobreviviente

> Un cliente con identidad verificada de forma única puede referir a otro
> cliente igualmente verificado y cobrar una recompensa —siempre que el
> evento que la dispara se valide server-side y nunca sobre un monto
> declarado por el cliente, esté acotada por un tope de exposición por
> cliente y global, y quede sujeta a una ventana de retención revocable
> ante fraude detectado— de modo que ninguna forma de defraudar el
> sistema sea rentable por encima de ese tope, sin que esto garantice
> cero colusión entre cómplices reales ni la recuperación de recompensas
> ya canjeadas antes de la detección.
