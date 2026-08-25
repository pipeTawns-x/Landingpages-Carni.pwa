# Handoff — sesión de Cowork, 12 agosto 2026

Contexto para la sesión de Claude Code. Todo lo marcado **verificado** se leyó de la fuente en esta sesión. Lo no verificado está en la sección 9. No des nada más por cierto.

---

## 1. Quién y cómo se trabaja

Felipe Eduardo Torres Aguilar. Modelo explícito: **él orquesta y verifica, tú trabajas y rindes cuentas.**

- Nada irreversible sin su sí explícito en el chat. Borrador primero, siempre.
- Si falta un dato, se pregunta. No se adivina.
- Si algo no se pudo verificar, se dice. Un "no lo revisé" vale más que una suposición.
- Español natural y directo. Nada que suene a IA en material que él vaya a usar o entregar.

**Lección de esta sesión, y es importante**: se afirmaron cosas sin comprobarlas tres veces seguidas — que no había carpeta conectada, que el texto de entrega describía el repo real, que `Song.js` sentaba precedente. Las tres eran falsas. La cura es una sola: **abrir el archivo antes de opinar.**

---

## 2. Dos carriles que no se cruzan

| | Carril EBAC | Carril producto |
|---|---|---|
| Vive en | `practicas/react/`, rama `practicas-ebac` | `src/`, `css/`, rama `main` |
| Estilos | `styles.css` **planos**, uno por carpeta de componente | SCSS 7-1 |
| Lo evalúa | tutor humano contra consigna literal | el negocio |
| Comparte | dominio: productos del seed, paleta, nombres | |
| **No** comparte | pipeline, alcance, complejidad | |

La práctica toma el **dominio** del producto, no su **complejidad**. `ebac-react.html` está fuera del alcance del rediseño (textual en `docs/blueprints/web-redesign.md`).

---

## 3. Estado del repo — verificado con git

```
main ↔ origin/main         sincronizado (rev-list 0 0)
217cacd1                   949 líneas, SIN respaldo en ningún remoto
practicas/react/           existe SOLO en 217cacd1 — no está en GitHub
origin/main src/components/  BentoGrid.tsx, Header.js, ProductCard.tsx, Song.js
5a752b3e (regresión Fase 1) NO está en main → ya resuelta
docs/                      untracked completo
```

**Consecuencia que explica todo**: el tutor de EBAC abrió el repo público, encontró `src/components/Song.js` genérico y calificó eso. Nunca vio el trabajo de Carni porque nunca se subió. El texto de entrega mencionaba `src/components/OrderLineItem.js`, **archivo que jamás existió en ninguna rama**.

**Urgente**: `git push -u origin practicas-ebac` y commitear `docs/`.

---

## 4. Schema Supabase — verificado en las migraciones

7 tablas en `supabase/migrations/202604100001_initial_schema.sql`: `profiles`, `categories`, `products`, `orders`, `order_items`, `favorites`, `promotions`. Más 8 RPCs y RLS por tabla con `get_user_role()` / `is_admin()`.

```sql
profiles: id UUID (= auth.uid), full_name, phone TEXT CHECK(char_length = 10),
          address JSONB, role ∈ {customer, admin}, points INTEGER
products: category_id, name, price_per_kg, price_per_lb, image_url, stock,
          is_active, metadata JSONB   -- 14 productos en seed.sql
orders:   user_id, total, delivery_type, delivery_address, notes,
          status ∈ {pending, confirmed, preparing, ready, delivered, cancelled}
```

Funciones: `handle_new_user()`, `protect_profile_system_fields()`, `create_order_with_items()`, `cancel_order()`, `apply_promotion()`, `add_points()`, `update_order_status()`, 3 RPC de favoritos.

### Huecos entre el schema y la visión

| Hueco | Bloquea | Fase |
|---|---|---|
| `products.peso_promedio` no existe | el modo **por pieza** del carrito trifásico | 3 |
| `status` no distingue prepago de efectivo | bifurcación Tarjeta / Efectivo | 3 |
| `tips_ledger` no existe | propinas, tip-out 6–8%, ranking de honestidad | 3 / 7 |
| `profiles.track_score` no existe (hay `points`) | niveles Principiante→VIP | 6 |
| `tier_settings` no existe | umbrales por nivel | 6 |
| `affiliates` / `referrals` no existen | **todo el programa de afiliados** | 6b |
| `campaign_proposals` no existe | loop HITL de BuildAds | 5 |

Decisión pendiente de spec: si `track_score` reemplaza a `points` o convive. Existe ya el RPC `add_points`.

---

## 5. EBAC — estado verificado en el LMS

- **70% completado** · 28/41 módulos · 290/410 lecciones · **27/40 actividades**
- Módulo actual: **28 · React II**, 9/11
- Única actividad pendiente del curso entero: **6.28.9**
- Práctica 1 (M27): **aprobada 100/100** por el tutor Salvador P. Cruzaley, sin observaciones. No se reentrega.
- Entrega: repo GitHub sin `node_modules`, link en plataforma. Mínimo 70, **3 intentos**, califica humano en un día hábil.

### Consigna 6.28.9 — los 8 requisitos literales

1. Refactorizar `Header` y `Song` de clase a funcionales, conservando props
2. Componente `SearchResults` que reciba un array por props, iterado con `map`
3. `key` única por elemento
4. Componente `Library`, también con array por props y `map`
5. `useState` en App para **dos** estados: resultados, y biblioteca **inicialmente vacía**
6. Botón "Agregar a mi biblioteca" en cada elemento, que actualice el estado
7. `useEffect` en App que imprima **cada vez** que la biblioteca se actualice
8. **Un `styles.css` en cada carpeta de componente**, no uno global

### Los 3 huecos — verificados leyendo el código de `practicas/react/practica-02/`

1. El `.map()` está **inline** en `InventoryApp.jsx`, no en un componente hijo que reciba el array por props → incumple 2 y 4
2. No hay segundo componente de lista; `flashOffers` es un `Set` renderizado inline → incumple 4
3. Un solo `styles.css` en la raíz de `practica-02` → incumple 8

Detalle fino: el `useEffect` está envuelto en `if (flashOffers.size > 0)`, así que no imprime cuando la lista se vacía. Cumple 7 a medias.

**Ya cumple**: refactor a funcionales, `key={product.id}` con los 14 ids reales del seed, botón que actualiza el segundo estado, updates inmutables con spread, lazy init desde localStorage.

**Sobre "funcionalidad real": ya la tiene.** Usa el seed real. Lo que falta son requisitos formales, no sustancia.

Conflicto duro: la consigna exige `styles.css` **plano** por carpeta; el sitio corre SCSS 7-1. La traducción correcta es CSS plano con los mismos hex de `_variables.scss`.

---

## 6. Investigación de esta sesión

### Competencia — Carnívoros corre en Shopify, no WordPress

Evidencia: `meta-shopify-checkout-api-token`, `cdn/shop/files/`, "Tecnología de Shopify" en el pie.

- Precios **por pieza y paquete, nunca por kilo**: Arrachera Select $339, Cowboy Select $355, T-Bone $349.50, Costilla de Cerdo $250
- Paquetes por número de personas: $1,599 (8–10) hasta $3,249 (20–22)
- **Solo PayPal** como método de pago
- Sin fidelización, sin PWA, banner de noviembre 2021

**Diferenciadores de Carni-mvp**: el pedido trifásico (peso/precio/pieza) no lo tiene nadie del sector revisado. La bifurcación Efectivo/Tarjeta ataca el hueco de PayPal. Vale copiarles la idea de vender paquetes por número de personas.

### Los 8 reels de referencia — leídos del post, no del video

| Autor | Tema |
|---|---|
| Juanbertorello.ia | "Tu web sigue pareciendo IA" — la receta de 3 herramientas |
| Píldoras de programación | Firecrawl para web scraping |
| Soy Enrique Rocha | Diseñar con Claude con las mejores skills |
| Midudev | React Doctor — detecta `useEffect` innecesarios y errores de accesibilidad |
| Midudev | **GSAP + ScrollTrigger** — animación estilo Apple al scroll |
| Soy Enrique Rocha | Animaciones web profesionales |
| Soy Enrique Rocha | "Claude con reglas gasta mucho menos" |
| Soy Enrique Rocha | Claude como investigador |

**La receta del primero, textual**: *"le pediste una web, no un diseño"*. Tres herramientas: **UI/UX Pro Max** (ya instalada, sin usar), **21st.dev** (animaciones listas), **Higgsfield** (video animado de fondo — es lo que Eduardo quiere para landing, login y registro).

Contraargumentos reales de los comentarios: *"mejor framer + lottie que GSAP"*, *"mal optimizado, mucho peso, me lo echan para atrás"*.

### Estado del rediseño — verificado

- **39 archivos SCSS** en 7-1 completa
- **9 entrypoints HTML**
- `_bento-main.scss` con el mapa `category-card-1..9`
- Paleta: `$carni-red #DC2626`, `$carni-gold #F59E0B`
- **`package.json` sin GSAP, sin framer-motion, sin lottie.** Ninguna librería de animación

La estructura está completa y sana. Falta la capa de movimiento y el criterio de diseño.

---

## 7. El loop del abogado del diablo — estado

Archivo: `.archon/workflows/abogado-del-diablo.yaml`, validado (parsea, tipos únicos, `depends_on` resueltos, `when:` dentro de la sintaxis soportada).

```
precheck-skills (bash) → generar → verificar ─┬→ prompt-defectuoso (cancel)
                                              └→ juzgar → decidir (approval)
```

Dos fallos que se encontraron y corrigieron leyendo la doc de `archon.diy`:

1. **`when:` no soporta paréntesis ni aritmética.** Solo comparaciones contra literal entre comillas simples, con `&&` / `||`. Las expresiones inválidas hacen *fail-closed* y saltan el nodo con un warning. Se resolvió haciendo que `verificar` emita un `veredicto` enum en su `output_format`.
2. **Las skills fallan en silencio.** La doc: *"if a named skill doesn't exist, the SDK may fail silently"*. Archon solo descubre skills en `.claude/skills/` y `~/.claude/skills/`. Se agregó el nodo `precheck-skills` en bash para convertirlo en fallo ruidoso.

**Skills — verificado en disco:**
```
OK  abogado-del-diablo → ~/.claude/skills/   (usuario)
OK  judgment-day       → .claude/skills/     (proyecto, copiada esta sesión, v1.4)
```
`judgment-day` v1.4 trae `references/` y los agentes `jd-judge-a`, `jd-judge-b`, `jd-fix-agent`.

**Archon**: `which archon` devolvió *not found*. Se está instalando con `brew install coleam00/archon/archon`. El README advierte que los binarios compilados necesitan `CLAUDE_BIN_PATH` apuntando al ejecutable de Claude Code.

### La tesis a atacar

> "Un cliente de Carni-mvp puede referir a otro cliente y cobrar una recompensa, sin que exista una forma rentable de defraudar el sistema."

Se eligió afiliados porque es el módulo con menos decisiones tomadas: alcance escrito en `module-scopes.md`, cero implementación.

Después de correr: clasificar cada objeción en **mata la idea / cambia el alcance / ruido** y reescribir la tesis. Esa parte la hace Eduardo, no la herramienta.

---

## 8. Documentos producidos en esta sesión

```
docs/RUTA_MVP_Y_SDD.md              ruta y protocolo abogado→SDD
docs/PLAN_MVP_COMPLETO.md           alcance completo, 8 fases, migraciones
docs/INVESTIGACION_Y_PROMPTS.md     los 8 reels, competencia, los 6 prompts
docs/prompts/abogado-del-diablo-afiliados.md
docs/prompts/mapa-de-corridas.md    qué herramienta va con cada tarea
docs/prompts/loop-abogado-del-diablo.md
.archon/workflows/abogado-del-diablo.yaml
```

Todos untracked. Hay que commitearlos.

### Orden acordado

```
HOY          push de practicas-ebac + commit de docs/
ESTA SEMANA  correr el loop sobre afiliados
             los 3 huecos de la Práctica 2 → entregar
LUEGO        Fase 2 rediseño · Fase 3 carrito ← el corazón
             Fase 4 Kanban · 5 BuildAds · 6 Track Score · 6b afiliados
             Fase 7 WhatsApp · 8 skills y vault
```

Las prácticas de EBAC **no llevan corrida del abogado del diablo** — llevan checklist contra la consigna. No hay tesis que romper, hay requisitos que cumplir.

---

## 9. Lo que NO se verificó

- **`SKILL.md` de `abogado-del-diablo`** — fuera de las carpetas conectadas a Cowork. Su contrato manda sobre cualquier prompt escrito aquí.
- **Ninguno de los 8 videos se vio.** Se leyó el texto del post, autor y comentarios.
- **El Figma** del Dashboard Redesign — requiere sesión.
- **`facebook.com/watch/saved/` solo devolvió 12 videos** y los 8 de referencia no están ahí. Hay otra colección sin localizar.
- **La llave de Apify**: `apify_api_jkZn...` está filtrada y marcada como pendiente de rotar en `docs/tooling/triage.md`. No se comprobó si ya se rotó. **No usarla.**
- **No se leyeron completos**: `architecture.md`, `agentic-stack.md`, `security.md`, `glossary.md`, `module-scopes.md` (solo la sección de afiliados), `competitor-scan.md` (3 fichas).
- **No se probó** Firecrawl, 21st.dev, Higgsfield ni GSAP.
- **No se verificó** si existen las imágenes de los 14 productos del seed.
- **No se corrió nada**: ni build, ni tests, ni capturas, ni migraciones, ni Lighthouse.
- **Supabase MCP en read_only**: los 8 tools de escritura visibles son por falta de la capa cliente `--read-only`, **no es una falla**. No usarlos. No se verificó si una escritura sería rechazada — no probarlo.
