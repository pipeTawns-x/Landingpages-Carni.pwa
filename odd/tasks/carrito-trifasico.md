# carrito-trifasico · lógica, datos y servidor
Objetivo: cobrar antes de despachar con pesos estandarizados por lote, todo configurado desde el panel sin tocar código. Rama `backend`, sin push (Eduardo aprueba). Estrategia de entrega: ask-on-risk. Pruebas: `cd backend && .venv/bin/python manage.py test --settings=config.settings_test` y SQL local de Supabase.
Base de lógica: `docs/carrito-trifasico.md` del worktree `carrito-trifasico-logica-d66065`. Las respuestas de Eduardo del 2026-11-19 (L2) cierran su sección 13.

## Specs

- **S1. El panel manda.** Precios, pesos estándar y stock se cambian desde el dashboard, sin código. Eduardo: "desde el dashboard le subo 10 pesitos al producto. Y se renderiza en el frontend."
- **S2. Precio maestro por kilo en MXN.** La parte del pollo es su propio producto con su propio precio por kilo, no un porcentaje del pollo entero. Eduardo: "Basta con que mi hermana suba el producto pechugas de pollo y estandarice el precio de la pechuga de pollo por kilo."
- **S3. Precio por pieza = peso estándar del lote × precio por kilo (MXN).** Se vende por pieza (pollo entero; pechuga con hueso o sin hueso, con alas o sin alas), no por kilo suelto. Cada semana llega un lote y se estandariza su peso. Ejemplo de Eduardo: pollo entero a $75 MXN el kilo; lote anterior de 1.5 kg por pollo = $112.50 la pieza; lote nuevo de 2.5 kg = $187.50 la pieza: "es el mismo pollo, diferente tamaño".
- **S4. Registro del lote pesando una pieza.** "la bolsa en cantidad de pollos trae 20 pollos, lo subo y con pesar un pollo que estandariza toda la bolsa". El lote guarda: producto, piezas, peso estándar por pieza y precio por kilo vigente.
- **S5. Cada pedido sale completo de un solo lote; nunca se mezclan lotes.** (Reemplaza el FIFO mezclado del 2026-11-19 temprano.) Eduardo: "No le vas a dar las del lote viejo más unas del lote nuevo porque pues, se va a ver la diferencia… Puede que la persona se incomode"; "así que todo del mismo lote. ¿Estamos de acuerdo?". Ejemplo: hay 6 piernas del lote viejo y piden 8 → las 8 salen del lote nuevo; las 6 viejas quedan para quien pida pocas ("3 personas por 2 piernas"). Regla de asignación: el lote más antiguo que alcance para la cantidad completa. Si ningún lote alcanza solo, entonces sí se mezclan: "que se haga de los dos y ya. No hay problema."
- **S6. Aviso de stock bajo al administrador y al cliente.** Al administrador: "oye, se me está acabando el pollo, mándame, pide pollo." Se pide antes de que se acabe: "Ya tengo 3 pollos, voy a pedir una bolsa de pollos". Al cliente: "tener disclaimer en los productos de ya solamente me quedan tantas piezas".
- **S7. Dólares: el precio en pesos no cambia.** Eduardo: "Mi hermana tiene el bistec de 150… en dólares son tanto y en pesos son 150. Bueno, eso no cambia." Si el dólar baja, cuesta más dólares; si sube, cuesta menos; el equivalente en pesos siempre es el precio maestro. **No hay freno por porcentaje de cambio** (se retira esa propuesta de la sección 9).
- **S8. Paquetes como Carnívoros: precio fijo, contenido listado y precio por persona.** Sin anticipo del 50 %: Eduardo: "Anticipo del 50%. ¿Cuándo putas yo aclaré eso? No, Claudia, eso es una mamada." Referencia real (Carnívoros, `products.json`, 2026-11-19): "PAQUETE CARNIVORO (8 a 10 personas)" $1,599, "Precio por persona: $159.00", incluye "1 kg ARRACHERA SELECT 1 kg T-BONE SELECT 1 kg AGUJA NORTEÑA SELECT" más complementos por paquete.
- **S9. Despacho por estados desde el teléfono del carnicero.** Al pagar se levanta la orden y va a un carnicero por WhatsApp. El tablero cambia solo: tomar el pedido pasa a "en proceso"; luego "pedido listo", "listo para recoger" o "listo para entrega", y "en ruta para entrega". Eduardo: "No todos los carniceros van a tener una iPad, pero sí todos pueden tener un teléfono."
- **S10. Comisiones.** Eduardo pide investigarlo en Carnívoros y Grill House antes de decidir: "Ve a investigar carnívoros y es que grill house. ¿Cómo se lleva una carnicería?" Pendiente de evidencia; no se inventa una regla.
- **S11. Despiece desde el dashboard: sacar piezas de un lote y meterlas en otros productos.** Ejemplo de Eduardo con 3 pollos del lote viejo: 3 pechugas pasan al producto de bistec de pechuga; 6 alitas pasan como "media docena de alitas adobadas"; 6 piernas con muslo pasan al producto piernas, vendidas por pieza. "saco ese producto de pollos y lo meto a la sección de alitas". Las piezas derivadas conservan su lote de origen, y la regla S5 de un solo lote también aplica a ellas.
- **S12. La lógica vale para todos los productos**, no solo para el pollo: "esta lógica se va a manejar, por ejemplo, para otros productos. Para todos los productos en sí."
- **S13. Investigación a fondo de Grill House y Carnívoros**, con scraping e ingeniería inversa con REA: "que hagas bien el scrapping, la investigación e inclusive una ingeniería inversa con RIA para Guildhouse y Carnívoros". Claude: precios, unidades, envío y comisiones. Codex: flujos e interfaz.
- **S14. Cortes premium: precio estandarizado por corte y por tamaño, desde el dashboard.** "en el ejemplo de los cortes premium, se estandaricen los precios por corte, por tamaño del corte… Y todo esto desde el dashboard." Cada tamaño es un peso estándar; precio = peso × precio por kilo del corte.

## Tasks

| ID | Specs | Ruta | Estado | Commit |
|---|---|---|---|---|
| T1 | S3, S4 | inline | hecho: `register_lot` + `action=lot` en `/panel/compras/` (falta que Codex pinte el formulario) | ver L9 |
| T2 | S5 | inline | a medias: la cotización ya usa un solo lote (`_lot_allocation`, aviso `mixed_lots`); falta descontar el lote al confirmar | ver L9 |
| T2b | S11, S12 | inline | pendiente: despiece de un lote a productos destino | — |
| T3 | S6 | inline | pendiente: umbral de stock bajo por producto, aviso al admin y "quedan N piezas" en la tienda | — |
| T4 | S7 | inline | pendiente: retirar el freno por porcentaje; precio USD = MXN / tasa del día | — |
| T5 | S8 | inline | pendiente: contenido del paquete y personas en el modelo y el panel | — |
| T6 | S9 | inline | pendiente: estados de despacho desde el teléfono (revisar lo que ya existe del Kanban) | — |
| T8 | S14 | inline | pendiente: tamaños estándar por corte premium | — |
| T7 | S10, S13 | investigación | hecho (L8): precios por tamaño, envío y pagos; comisiones no publicadas | — |

## Log

- **L1 (2026-11-19, Eduardo):** "Onda, Codex y tú están en un nuevo chat. Tú ya sabes qué hacer. Codex igual, pónganse a trabajar. Un visa rápido."
- **L2 (2026-11-19, Eduardo, respuestas a la sección 13):** contesta las seis preguntas (ver S2, S5, S7, S8 y S10) y corrige que no se debieron preguntar: "Primero investiga, carajo, o dime si en verdad investigaste e hiciste scrapping de precios, como mínimo, dime si sí o si no."
- **L3 (2026-11-19, evidencia):**
  - Engram #3246 (2026-11-17) ya tenía una lectura pública de precios, pero las páginas de producto de Carnívoros respondieron 429.
  - Hoy se leyó el catálogo público `products.json` de los dos sitios, sin saltar protecciones.
  - **Moneda: pesos mexicanos (MXN), no dólares.** `cart.js` de las dos tiendas devuelve `"currency":"MXN"` y `meta.json` `"country":"MX"`. Todos los `$` de abajo son MXN.
  - **Carnívoros:** 46 productos. No vende pollo, salvo "Alitas Hot" a $169. Los cortes van por kg; los 10 paquetes tienen precio fijo, contenido en kg y precio por persona.
  - **Grill House:** 815 productos. Vende el pollo como pieza de peso estándar: "Pollo Entero Pilgrim's 1.4 kg" a $108 la pieza y "Pechuga Premium Delipollo 1.24 kg" a $199 MXN, con la etiqueta "$160 / kg" (MXN; 199 / 1.24 = 160.5), y en la descripción "El peso de las piezas podría diferir hasta +-5%". Las alitas van a $125 la bolsa de 1 kg.
  - Coincide con S2 y S3: peso estándar × precio por kilo, cobrado por adelantado.
- **L4:** Siguiente paso: T1.
- **L5 (2026-11-19, Eduardo, corrección):** el ejemplo de la pechuga en $/kg confundió; la regla es precio por pieza con peso estándar del lote. Extractos textuales: "ponle que en el stock tenga 3 pollos de la semana pasada, con un peso de 1500"; "llega una nueva bolsa con un peso por pollo de igual precio, 75 por kilo, pero ojo, acá el pollo completo pesa 2,5 kilos"; "por pollo de 112 del precio del pollo anterior, ahora se sube a $187 o $187.5 pesos"; "te piden 4 pollos, serían de $750 la cuenta". Se reescriben S3, S4 y S5; se agregan S5b, S11, S12 y S13. Codex recibe un prompt nuevo con el diseño anterior de `main` como punto de partida.
- **L6 (2026-11-19, Eduardo, corrección):** "Lo del lote viejo primero no, acuérdate que eso se va a sacar y se puede que desde el dashboard yo pueda sacar ese producto de ese lote viejo y ponerlo en otros productos"; "así que todo del mismo lote. ¿Estamos de acuerdo?". S5 pasa a un solo lote por pedido (se retira S5b); S11 toma sus ejemplos; se agrega S14 (cortes premium por tamaño). Codex recibe la parte 2 corregida.
- **L7 (2026-11-19, Eduardo):** "En casos de que si ningún lote… pues que se haga de los dos y ya." WhatsApp y cobro real quedan fuera de esta funcionalidad. Instalar los recursos (REA incluido) y hacer la ingeniería inversa antes de desarrollar: "ODD, primero hay un proceso de investigación". Django se queda como base; se permiten tecnologías de diseño más avanzadas. Entregas cortas para que Eduardo verifique.
- **L8 (2026-11-19, investigación con REA y carritos públicos).** REA 6.7.0 quedó registrado en Claude Code y Codex. En OpenCode el setup respondió `needs_human` (falla al escribir) y queda pendiente. El respaldo está en `~/agentic-global-respaldos/2026-11-19/rea-setup/`. Para las tiendas se usó `rea inspect-web-page` sobre Brave sin cabeza con un perfil temporal, y las rutas públicas de Shopify. Todos los precios están en MXN.
  - **Cortes premium por tamaño (S14), Grill House.** Cada corte se vende en tamaños fijos y el precio de cada tamaño es su peso por el precio por kilo:
    - Rib Eye CAB 340 g: $265 ($779/kg).
    - Rib Eye CAB 500 g: $390.
    - Rib Eye CAB 700 g: $545.
    - Rib Eye Vigar: 340 g $139, 500 g $205, 700 g $287.
    - Wagyu SRF: 300 g $690, 400 g $920, 500 g $1,150, 600 g $1,380 ($2,300/kg).
  - **Piezas enteras con su peso real como variante (= el lote de Eduardo).** Rib Eye Lipón CAB: 7.0 kg $5,453, 7.3 kg $5,687 y 7.6 kg $5,920 ($779/kg). Ojo de Rib Eye SRF: 3.6 a 4.8 kg a $2,800/kg. Pollo: "Pollo Entero 1.4 kg" a $108 la pieza.
  - **Sucursales.** Grill House maneja una tienda por ciudad con su propio subdominio (`grillhouse_store_switcher.js`): CDMX, GDL, QRO, Metepec, Saltillo, Chihuahua y PVR.
  - **Envío de Carnívoros (San Luis Potosí, sucursal Zenón Fernández).** Cobra por zonas de distancia y el precio no cambia con el tamaño del pedido (se probó con 1 y con 6 arracheras):
    - Zona 1, 0 a 5.5 km: $50.
    - Zona 2, 5.5 a 11 km: $90.
    - Zona 3, 11 a 16 km: $160.
    - Zona 4, 16 a 22 km: $210.
  - **Envío de Grill House CDMX.** Cuesta $79, gratis desde $1,899. Entrega en 24 h si se pide antes de las 3 pm y en 48 h si se pide después. Hay un express de unas 2 h dentro del horario; fuera de horario se programa de 11 a 1.
  - **Pagos.** Grill House acepta tarjetas, Apple Pay, Google Pay y PayPal. Carnívoros, solo PayPal.
  - **Devoluciones.** Solo se reclaman el día de la entrega, con foto.
  - **Comisiones.** Ninguna de las dos publica comisiones a repartidores ni a afiliados. No se inventa una regla: S10 sigue abierta.
- **L9 (2026-11-19, T1 y la cotización de T2).**
  - Migración `20261119000001_lotes_por_pieza.sql`: agrega las columnas `piece_weight_kg`, `pieces_left` y `source_lot_id` en `purchase_lots`, y las funciones `register_lot` (solo django) y `_lot_allocation` (nadie). `quote_line` cambia solo en la rama "por pieza, precio por kilo".
  - RED observado: con la migración vacía, `lotes_por_pieza` dio 0 ok y 4 fallas.
  - GREEN: suite SQL con 847 pruebas y 0 fallas, de las cuales 48 son nuevas, con los ejemplos de Eduardo: 2, 3 y 4 pollos; 22 y 25 mezclan lotes.
  - La reversa deja `quote_line` idéntica: md5 del cuerpo `1c22a7d6…` y la misma ACL.
  - Django: 1003 pruebas OK, 15 nuevas. RED observado: 17 fallas, solo en las pruebas nuevas.
  - Supuesto: un producto que se vende por pieza necesita el interruptor "se vende por pieza", y ese interruptor hoy pide el peso promedio del corte (`inventory/services.py:179`). Cuando hay lote, el peso del lote manda. Que el interruptor funcione solo con lotes queda pendiente.
  - Riesgo: punto 1 (migración y precio cobrado) y punto 3 (nuevo aviso en `quote_line`).

