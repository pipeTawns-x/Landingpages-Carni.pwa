# Plan MVP completo — Carni-mvp

Fecha: 12 agosto 2026. Escrito leyendo el repo, las migraciones y los blueprints directamente. Todo lo que no pude verificar está marcado en la sección 9.

**Para qué sirve**: es el documento que se lleva a Code. Contiene el alcance completo del MVP, el estado real verificado, los huecos entre lo que hay y lo que se quiere, y el protocolo para correr el abogado del diablo fase por fase antes de escribir specs.

**Regla que gobierna todo el documento**: el plan es completo, la ejecución es por fases. Cada fase tiene una puerta. No se abre la siguiente sin cerrar la anterior.

---

## 1. Tesis del MVP

> Carni-mvp convierte la operación de una carnicería familiar —hoy repartida entre WhatsApp, papel y memoria— en un sistema donde el pedido entra por la PWA, se cobra correctamente aunque el peso final varíe, se despacha desde un tablero visible, y genera por sí solo la publicidad y la lealtad que traen al siguiente cliente.

Cuatro promesas, en orden de dependencia:

1. **Cobrar bien** — pedido trifásico (peso / precio / pieza) con ajuste post-pesaje.
2. **Despachar bien** — Kanban en tiempo real, sincronizado con WhatsApp.
3. **Retener** — Track Score y programa de afiliados.
4. **Atraer** — BuildAds y ProductAds alimentados por el stock real.

Nada de la promesa 2 funciona sin la 1. Nada de la 3 y 4 funciona sin la 2.

---

## 2. Estado real verificado — schema vs. visión

### Lo que existe hoy en Supabase

7 tablas, en `supabase/migrations/202604100001_initial_schema.sql`:

| Tabla | Notas |
|---|---|
| `profiles` | `id, full_name, phone, address (JSONB), role, points, created_at, updated_at` |
| `categories` | `name, slug, image_url, is_active, order` |
| `products` | `category_id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active, metadata (JSONB)` |
| `orders` | `user_id, total, status, delivery_type, delivery_address, notes` |
| `order_items` | `order_id, product_id, quantity_kg, unit_price, subtotal` |
| `favorites` | PK compuesta `user_id + product_id` |
| `promotions` | `code, discount_percent, min_purchase, valid_from/until` |

Más 8 RPCs (`create_order_with_items`, `cancel_order`, `apply_promotion`, `add_points`, `update_order_status`, y los 3 de favoritos) y RLS por tabla con `get_user_role()` / `is_admin()`.

`orders.status` acepta 6 valores: `pending, confirmed, preparing, ready, delivered, cancelled`.

### Los huecos, uno por uno

Esto es lo que separa el schema de hoy de la visión en `docs/brain/vision.md`. Cada línea es una migración concreta.

| Hueco | Qué falta | Bloquea | Fase |
|---|---|---|---|
| **`products.peso_promedio`** | la columna no existe | el modo **por pieza** del carrito trifásico no tiene dato que lo sostenga | 3 |
| **Estados de pago** | `status` no distingue prepago de efectivo | la bifurcación Tarjeta / Efectivo del checkout | 3 |
| **`tips_ledger`** | tabla inexistente | propinas, tip-out del 6–8%, ranking de honestidad | 3 / 7 |
| **`profiles.track_score`** | hoy solo hay `points INTEGER` | niveles Principiante→VIP, generosity points, flash offers | 6 |
| **`tier_settings`** | tabla inexistente | umbrales configurables por nivel | 6 |
| **`affiliates` / `referrals`** | tablas inexistentes | **todo el programa de afiliados** | 6b |
| **`campaign_proposals`** | tabla inexistente | el loop HITL de BuildAds | 5 |

**Lectura importante**: el programa de afiliados es lo único de tu lista que no está implementado *ni especificado en detalle*. Sí tiene alcance escrito en `docs/blueprints/module-scopes.md` (tablas `affiliates` y `referrals`, anti-fraude server-side), pero ninguna decisión tomada. **Por eso es el mejor candidato para estrenar el abogado del diablo.**

---

## 3. Los dos carriles

| | Carril EBAC | Carril producto |
|---|---|---|
| Vive en | `practicas/react/`, rama `practicas-ebac` | `src/`, `css/`, rama `main` |
| Estilos | `styles.css` **planos**, uno por carpeta de componente | SCSS 7-1 |
| Lo evalúa | un tutor humano, contra consigna literal | el negocio |
| Comparten | dominio: productos del seed, paleta, nombres | |
| **No** comparten | pipeline, alcance, complejidad | |

La práctica toma el **dominio** del producto, no su **complejidad**. Si la práctica crece para servirle al MVP, incumple la consigna. `ebac-react.html` está explícitamente fuera del alcance del rediseño (textual en `docs/blueprints/web-redesign.md`).

Paleta compartida, desde `css/abstracts/_variables.scss` (verificada): `$carni-red #DC2626`, `$carni-gold #F59E0B`, superficies oscuras `#050505 / #111111 / #181818`.

---

## 4. Protocolo: abogado del diablo → SDD → implementación

`abogado-del-diablo` está instalada en `~/.claude/skills/abogado-del-diablo/SKILL.md` y registrada en `.atl/skill-registry.md`. Su función, según `docs/tooling/triage.md`: *"Devil's advocate review skill; challenges decisions before committing to them."*

**El contrato interno de la skill no se leyó desde Cowork** (fuera de las carpetas conectadas). Code sí la tiene. Lo de abajo es el protocolo de encadenado.

### Por qué va antes y no después

Una spec escrita sobre una premisa falsa produce código correcto que resuelve el problema equivocado. El abogado del diablo rompe la idea mientras cambiarla todavía cuesta una conversación y no un sprint.

### Los 6 pasos

**1. Tesis en una frase.** Afirmativa y falsable. No "mejorar el dashboard" sino "el dashboard debe mostrar un Kanban de 5 columnas en tiempo real porque hoy se pierden pedidos entre WhatsApp y papel". Si no cabe en una frase, todavía no sabes qué quieres.

**2. Invocar la skill.** Prompt base:

```
Usa la skill abogado-del-diablo contra esta tesis:
"<tesis en una frase>"

Contexto: docs/brain/vision.md, docs/brain/roadmap.md fase N,
docs/blueprints/module-scopes.md, docs/PLAN_MVP_COMPLETO.md sección 2.
Schema real: supabase/migrations/202604100001_initial_schema.sql

Restricciones duras: React 18 + Vite 7 + TypeScript + Express 5 + SCSS 7-1.
Sin Next.js, sin Tailwind, sin Storybook, sin rutas nuevas.

Ataca: la premisa, el alcance, la dependencia oculta, el costo de
mantenimiento y el modo de fraude o abuso. No propongas soluciones.
```

**3. Clasificar cada objeción en tres cubetas.** Esto lo haces tú, no la skill.

- **Mata la idea** → no se hace; se documenta por qué y se cierra
- **Cambia el alcance** → se hace más chico o en otro orden
- **Ruido** → se descarta con una línea de justificación

**4. Reescribir la tesis** con lo que sobrevivió. Casi siempre queda más chica. Esa es la señal de que funcionó.

**5. Ahora sí la SDD**, con el stack ya instalado:

| Herramienta | Cuándo |
|---|---|
| `openspec` | propuesta, spec, design doc |
| `spec-kit` | volver la spec ejecutable |
| `archon` | ciclo plan→implement→validate en YAML |
| `gentle-ai` | motor de workflow SDD |
| `work-unit-commits` | partir en commits revisables |
| `judgment-day` | revisión adversarial antes del merge |

**6. Cerrar el ciclo.** `judgment-day` antes de mergear, `mem_save` en engram, y commit de `docs/`.

**Regla de oro**: una corrida por fase, sobre la tesis de la fase. No por tarea — se vuelve ruido y dejas de escucharlo.

---

## 5. Las fases, con detalle de ejecución

### Fase 0 — Respaldo (hoy, sin discusión)

- `git push -u origin practicas-ebac` — 949 líneas de `217cacd1` sin respaldo en ningún remoto
- Commitear `docs/` — todo el brain está untracked

**Puerta**: `git branch -r --contains 217cacd1` devuelve algo.

---

### Fase 1 — Cerrar el unblock

La regresión `5a752b3e` **ya no está en main** (verificado). Lo que queda:

- ~~Rotar la llave de Apify~~ — hecho el 2026-08-25; las filtradas están muertas
- Correr `/sdd-init` para cachear stack y capacidades de testing

**Puerta**: SDD inicializado, sin llaves comprometidas en el árbol.

---

### Fase EBAC (paralela, se cierra esta semana)

**Práctica 2 — los 3 huecos verificados contra la consigna 6.28.9:**

1. Extraer el `.map()` inline de `InventoryApp.jsx` a un componente hijo que reciba el array por props
2. Agregar el segundo componente de lista (la "biblioteca") que hoy vive como `Set` renderizado inline
3. Un `styles.css` por carpeta de componente — hoy hay uno solo en la raíz

Ya cumplen: refactor a funcionales, `key={product.id}` con ids reales del seed, botón que actualiza el segundo estado, `useEffect` que loguea al cambiar.

Detalle fino: el `useEffect` está envuelto en `if (flashOffers.size > 0)`, así que no imprime cuando la lista se vacía. La consigna dice "cada vez que se actualice".

**Práctica 1** — aprobada 100/100, no se reentrega. El código de clases con dominio Carni ya existe en `practicas/react/practica-01/`. Se sube tal cual para que el tutor de la P2 encuentre un cimiento coherente.

**Puerta**: repo público con las dos prácticas visibles, texto de entrega con rutas verificadas contra el repo ya subido.

---

### Fase 2 — Rediseño (SCSS only, 7 páginas)

Blueprint completo en `docs/blueprints/web-redesign.md`. Resumen operativo:

- Tokens ya bloqueados en `_variables.scss` — no se inventan nuevos
- El mapa bento `category-card-1..9` se conserva; se mejora padding y tipografía, no se reinventa
- 7 entrypoints: `index`, `products`, `accessweb`, `dashboar`, `admin-products`, `admin-customers`, `admin-orders`
- Validación con screenshots a **320 / 768 / 1024**
- Sin Tailwind, sin framework nuevo, sin rutas nuevas, sin tocar el montaje de `src/entry/*.tsx`

**Falta instalar**: `Hainrixz/tododeia-animaciones` — marcada Missing en `docs/tooling/triage.md`. Es la que trae los patrones de micro-interacción tipo los reels de referencia.

El Figma del Dashboard Redesign es **insumo visual, no autoridad de stack**. Igual que pasó con el prompt de STITCH que pedía Tailwind: se toma la dirección visual, se descarta el stack.

**Tesis para el abogado del diablo**: *"El rediseño puede cubrir las 7 páginas sin tocar el montaje de entries ni agregar rutas, solo con los SCSS existentes."*

**Puerta**: hallmark pasando, cero regresiones de navegación, capturas en los 3 breakpoints.

---

### Fase 3 — Carrito trifásico y checkout

El corazón del MVP. Sin esto, nada más importa.

**Migraciones necesarias:**

```sql
-- products: soporte para modo "por pieza"
ALTER TABLE products ADD COLUMN peso_promedio DECIMAL(10,3);

-- orders: bifurcación de pago
-- ampliar el CHECK de status con los estados de prepago/efectivo

-- nueva tabla de propinas
CREATE TABLE tips_ledger (...);  -- monto, order_id, butcher_id, tip_out_pct, created_at
```

**Implementación:**

- Cablear `src/hooks/useCart.ts` (existe) al entry `products.tsx`
- Selector de propina antes del cargo final: 8% / 10% / 15% / libre
- Tip-out: retención automática 6–8%, redistribuida a personal de apoyo
- Bifurcación: Tarjeta (Stripe, prepago) vs. Efectivo (congelado hasta pesaje)
- Skill: `carni-stripe`, `agente-pagokit` (para Clip/Conekta/MercadoPago si entra pago local)

**Tesis para el abogado del diablo**: *"El modo por pieza puede cobrarse con un peso estimado y ajustarse después del pesaje real sin generar disputas de cobro."*
Esa tesis tiene un flanco obvio: qué pasa si el peso real excede el estimado y ya cobraste con tarjeta. Que la skill lo ataque.

**Puerta**: pedido completo escribiendo en `orders` + `order_items`, con propina registrada en `tips_ledger`.

---

### Fase 4 — Kanban de despacho

**Dependencia dura**: Fase 3 escribiendo pedidos.

- Nuevo `src/modules/kanban/`, tablero de 5 columnas
- Mapeo pendiente de decidir: los 6 estados de `orders.status` contra las 5 columnas de la visión (Recibidos, En Espera, Preparando, Listos, En Camino/Entregados)
- Realtime vía Supabase subscriptions
- Se monta en `dashboar.html` vía `src/entry/dashboard.tsx`
- Tarjeta: ID grande, badge delivery/pickup, cliente, emojis de producto, timer que enrojece a los 30 min, avatar del carnicero, botones Tomar / Ver
- Drag & drop con patrones de `cult-ui`

**Tesis**: *"Los 6 estados actuales de orders alcanzan para las 5 columnas sin agregar una máquina de estados paralela."*

**Puerta**: dos navegadores abiertos, mover una tarjeta en uno se refleja en el otro.

---

### Fase 5 — BuildAds y ProductAds

**Dependencia**: Fase 1 (Supabase MCP) + el scaffold `src/modules/buildads/BuildAdsOrchestrator.tsx` que ya existe.

**Migración**: tabla `campaign_proposals` (`product_id`, `reason` ∈ {excess_stock, low_stock, high_tip_target}, `suggested_action`, `status` ∈ {pending, approved, rejected}).

**Wizard de 6 pasos** (detalle en `vision.md`):
plataforma y objetivo → config de campaña (geo, presupuesto $4/$10/$20, idioma) → loading de agentes → preview de estrategia → elección de creativo (IA o subir archivos) → generar y lanzar con botón Authorize.

**Loop HITL**: agentes vigilan `products.stock` → detectan exceso de picaña → proponen campaña → admin revisa → un clic autoriza → escribe en `promotions` (banner interno) y publica a Meta/TikTok/WhatsApp.

**ADN de Marca**: extracción de identidad desde feeds sociales, muestras de audio y texto descriptivo.

**Falta instalar**: `Hainrixz/claude-ads` (Missing). Skill disponible: `buildads-wizard`, `meta-ads-analyzer`, `claude-banana` (prompts de imagen), `hyperframes` (render de video para ProductAds).

Transcript de referencia ya en el repo: `docs/brain/videos/transcripts/saleads-video__-a58SJXxrmk.txt`.

**Tesis**: *"Un agente puede proponer campañas desde el stock sin publicar nada sin autorización humana explícita."*

**Puerta**: una propuesta generada desde stock real, revisada y autorizada a mano, visible como banner en la PWA.

---

### Fase 6 — Track Score / Fidelización

**Migraciones:**

```sql
ALTER TABLE profiles
  ADD COLUMN track_score BIGINT DEFAULT 0,
  ADD COLUMN level TEXT DEFAULT 'principiante',
  ADD COLUMN generosity_points BIGINT DEFAULT 0,
  ADD COLUMN total_spent DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN last_flash_offer_at TIMESTAMPTZ;

CREATE TABLE tier_settings (...);  -- min_points, min_spending, discount_pct, priority_queue
```

Ojo: hoy `profiles` tiene `points INTEGER` y existe el RPC `add_points`. Hay que decidir si `track_score` reemplaza a `points` o convive. **Decisión de spec, no de implementación.**

- Algoritmo: 1 punto por cada $10 MXN; bonus por reseñas con foto ligadas a compra real; propinas sobre umbral disparan flash offer al día siguiente
- Niveles: Principiante → Regular → Premium → VIP
- VIP: 10% sobre $10k MXN, acceso temprano, prioridad en Kanban, corona morada

Benchmark real en `docs/blueprints/competitor-scan.md` (Sizzle Society de ButcherBox: 2 pts por dólar, mínimo 1000 pts para redimir, decay a 6 meses).

---

### Fase 6b — Programa de afiliados

**Es lo menos definido de todo el plan.** Alcance en `module-scopes.md`, cero implementación.

```sql
CREATE TABLE affiliates (
  profile_id, referral_code UNIQUE, status, total_referred, total_rewarded
);
CREATE TABLE referrals (
  referrer_id, referred_profile_id, first_order_id,
  reward_status ∈ {pending, granted, void}, created_at
);
```

- UI de cliente en `src/modules/affiliate/` (share del código, ver estado)
- Servidor en `server/routes/affiliate.ts` — generación de código, atribución y otorgamiento de premio **todo server-side**, para bloquear auto-referido y farmeo
- RLS: cada cliente ve solo sus propios referidos
- Distinto de Track Score: aquel premia gasto propio, este premia adquisición

**Tesis para el abogado del diablo** — y esta es la que más le va a doler:
*"Un cliente puede referir a otro y cobrar recompensa sin que exista forma rentable de defraudar el sistema."*

Que ataque: cuentas falsas, auto-referido con segundo teléfono, farmeo de primeras compras mínimas, colusión entre dos clientes, y qué pasa si el referido cancela el pedido después de otorgada la recompensa.

**Esta fase no se implementa hasta que el abogado del diablo la haya roto y hayas reescrito la tesis.**

---

### Fase 7 — Bot de WhatsApp (n8n)

**Dependencia**: Fase 4 (columnas del Kanban).

Flujo: pedido en la PWA → mensaje estructurado al carnicero asignado → responde con palabra clave:

- `PREPARANDO` → status `en_preparacion`, notifica cliente, actualiza Kanban
- `LISTO` → recalcula total con peso real, envía link de pago con selector de propina
- `ENTREGADO + 40` → cierra pedido, registra propina en `tips_ledger`, calcula tip-out

Ranking de honestidad: propinas reportadas contra calificaciones del cliente, alimenta un leaderboard mensual.

Skill: `n8n-workflow-method-local`. MCP de n8n marcado **UNKNOWN — verify** en el triage.

---

### Fase 8 — Skills faltantes y brain vault

- Crear `productads-autonomo`, `ebac-workflow`, `silver-security` con `skill-creator`
- Correr `graphify` sobre el repo → exportar a `docs/brain/graph/`

---

## 6. Skills que faltan instalar, por fase

De `docs/tooling/triage.md`, marcadas **Missing** y relevantes a lo pedido:

| Skill | Para qué | Fase |
|---|---|---|
| `Hainrixz/tododeia-animaciones` | micro-interacciones bento/maximalism | 2 |
| `Hainrixz/claude-ads` | copy publicitario, núcleo de BuildAds | 5 |
| `Hainrixz/construyeconia` | referencia de diseño de afiliados y lealtad | 6 / 6b |
| `jordanrendric/claude-video-vision` | análisis de video de referencia | opcional |
| `gentleman-guardian-angel` | seguridad pre-deploy | antes de producción |
| `affaan-m/agentshield` | guardas de inyección de prompt | antes de agentes autónomos |

Se instalan **antes de su fase**, no todas de golpe.

---

## 7. Puertas de calidad, para todas las fases

- Conventional Commits. En `practicas-ebac`, lenguaje académico; en `main`, lenguaje de producto
- Cero regresiones: `index.html`, `products.html`, `accessweb.html`, `dashboar.html`, assets, PWA y service worker siguen funcionando
- Sin cambios estructurales, borrados ni renombres sin OK explícito
- Supabase MCP en read_only: los 8 tools de escritura visibles son por falta de la capa cliente `--read-only`, **no es una falla**. No se usan
- `judgment-day` antes de cada merge
- `mem_save` en engram al cerrar cada hito
- Si hay dos caminos válidos, se pregunta

---

## 8. Orden de ejecución

```
HOY          Fase 0 — push + commit de docs/
ESTA SEMANA  Fase EBAC — 3 huecos de la P2, entrega
             Fase 1 — Apify rotado ✅, falta /sdd-init
LUEGO        Fase 2 — rediseño (instalar tododeia-animaciones)
             Fase 3 — carrito trifásico  ← el corazón
             Fase 4 — Kanban
             Fase 5 — BuildAds
             Fase 6 — Track Score
             Fase 6b — Afiliados  ← abogado del diablo primero, sin excepción
             Fase 7 — WhatsApp
             Fase 8 — skills y vault
```

Fases 3 y 4 son las que convierten esto de sitio bonito en negocio operando. Si hubiera que sacrificar algo, se sacrifica lo de abajo, nunca lo de arriba.

---

## 9. Lo que no verifiqué

- **`SKILL.md` de `abogado-del-diablo`**: fuera de las carpetas conectadas a Cowork. El protocolo de la sección 4 es de encadenado, no el contrato de la skill
- **El Figma** del Dashboard Redesign: requiere sesión
- **Los reels de Facebook**: login y video; no se leyeron ni se van a raspar
- ~~Si la llave de Apify sigue sin rotar~~ — resuelto: el dueño las rotó el 2026-08-25
- **`vision.md` leído completo**; `architecture.md`, `agentic-stack.md`, `security.md`, `glossary.md` y `module-scopes.md` solo parcialmente
- **`competitor-scan.md`**: leídas las primeras 3 fichas de competidor
- **No corrí nada**: ni build, ni tests, ni capturas, ni migraciones
- **El mapeo 6 estados → 5 columnas del Kanban** no está decidido en ningún documento; queda como decisión de spec en Fase 4
