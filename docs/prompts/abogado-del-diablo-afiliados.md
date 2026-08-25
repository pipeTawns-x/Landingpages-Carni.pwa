# Corrida 1 del abogado del diablo — Programa de afiliados

Primera prueba de la herramienta. Se eligió afiliados a propósito: es el módulo con menos decisiones tomadas, así que hay mucho que romper y nada que perder.

Objetivo doble: endurecer la tesis de afiliados **y** ver cómo se comporta la skill.

---

## 1. El prompt — pegar tal cual en Code

```
Usa la skill abogado-del-diablo contra esta tesis:

"Un cliente de Carni-mvp puede referir a otro cliente y cobrar una recompensa,
sin que exista una forma rentable de defraudar el sistema."

═══ CONTEXTO REAL DEL REPO (verificado, no asumir nada más) ═══

Estamos en ~/Desktop/Carni-mvp, repo pipeTawns-x/Landingpages-Carni.pwa.

Schema actual en supabase/migrations/202604100001_initial_schema.sql — 7 tablas:
  profiles      (id UUID = auth.uid, full_name, phone CHECK char_length=10,
                 address JSONB, role ∈ {customer, admin}, points INTEGER)
  categories, products, orders, order_items, favorites, promotions

  orders.status ∈ {pending, confirmed, preparing, ready, delivered, cancelled}
  orders tiene: user_id, total, delivery_type, delivery_address, notes

Funciones existentes (202604100003_functions.sql):
  handle_new_user(), protect_profile_system_fields(),
  create_order_with_items(), cancel_order(), apply_promotion(),
  add_points(), update_order_status(), y los 3 RPC de favoritos

RLS ya definida por tabla, con helpers get_user_role() e is_admin().

NO EXISTE hoy: tabla affiliates, tabla referrals, tips_ledger, tier_settings,
track_score en profiles, ni server/routes/affiliate.ts.
El único route existente es server/routes/buildads.ts.

Alcance propuesto (docs/blueprints/module-scopes.md, sección "Affiliate program"):
  affiliates (profile_id, referral_code UNIQUE, status, total_referred, total_rewarded)
  referrals  (referrer_id, referred_profile_id, first_order_id,
              reward_status ∈ {pending, granted, void}, created_at)
  UI de cliente en src/modules/affiliate/, servidor en server/routes/affiliate.ts
  Atribución y otorgamiento de recompensa 100% server-side.

Contexto de negocio: carnicería familiar real en San Luis Potosí. Clientes
reales, dinero real, márgenes de carnicería. La recompensa sale del bolsillo
del dueño.

═══ RESTRICCIONES DURAS ═══

React 18 + Vite 7 + TypeScript + Express 5 + SCSS 7-1.
Sin Next.js, sin Tailwind, sin Storybook, sin rutas nuevas de página.
Supabase MCP está en read_only: no ejecutes escrituras.

═══ QUÉ QUIERO QUE ATAQUES ═══

1. La premisa — ¿el programa de afiliados resuelve un problema real de esta
   carnicería, o es una función que se copia porque otros la tienen?
2. El fraude — cuenta falsa, auto-referido con segundo teléfono, farmeo de
   primeras compras mínimas, colusión entre dos clientes que se refieren
   mutuamente, referido que cancela el pedido después de otorgada la recompensa.
   El CHECK de 10 dígitos en profiles.phone, ¿alcanza como identidad única?
3. La dependencia oculta — qué de este módulo no puede existir sin Track Score,
   sin la tabla orders escribiendo de verdad, o sin un medio de pago cerrado.
4. El costo de mantenimiento — quién monitorea el fraude cuando el dueño está
   cortando carne, y qué pasa cuando hay que revocar una recompensa ya pagada.
5. La economía — si el margen de carnicería es delgado, ¿de dónde sale la
   recompensa y en qué punto el programa pierde dinero?

═══ REGLAS DE LA CORRIDA ═══

- NO propongas soluciones. Solo objeciones.
- NO escribas código. NO toques ningún archivo. NO hagas commits.
- Ordena las objeciones de más letal a menos.
- Para cada objeción: qué supuesto rompe y qué evidencia del repo la sostiene.
- Si una objeción es especulativa, dilo. No la disfraces de hallazgo.
- Al final: qué NO pudiste evaluar y por qué.
```

---

## 2. Cómo leer la salida — las tres cubetas

Clasificar cada objeción. Esto lo haces tú, no la skill.

| Cubeta | Qué significa | Qué se hace |
|---|---|---|
| **Mata la idea** | el supuesto roto es la base del módulo | no se implementa; se documenta por qué y se cierra |
| **Cambia el alcance** | válida, pero se resuelve haciéndolo más chico o después | se anota como restricción de la spec |
| **Ruido** | genérica, no aplica al negocio o al stack | se descarta con una línea de justificación |

Si todo cae en "ruido", la corrida no sirvió. Si todo cae en "mata la idea", probablemente la tesis estaba mal escrita.

---

## 3. Cómo evaluar la herramienta misma

Esta es la primera corrida, así que también estás probando la skill. Señales:

**Buenas señales**

- Cita archivos y columnas reales del repo, no genéricos
- Encuentra al menos una objeción que no estaba en la lista de ataque
- Distingue lo que verificó de lo que supone
- Las objeciones son específicas de una carnicería, no de "un e-commerce"
- Respeta las reglas: no escribe código, no propone soluciones

**Malas señales**

- Objeciones de manual de seguridad que aplicarían a cualquier proyecto
- Inventa tablas o campos que no existen
- Propone soluciones aunque se le pidió que no
- Toca archivos
- Da todo por igual de grave, sin ordenar

Si sale mal por el segundo grupo, el problema puede ser el prompt y no la skill. Vale una segunda corrida con la tesis reescrita antes de descartarla.

---

## 4. Después de la corrida

1. Reescribe la tesis con lo que sobrevivió. Casi siempre queda más chica — esa es la señal de que funcionó.
2. Si sobrevivió algo implementable, ahí entra `openspec` para la propuesta y la spec.
3. Guarda el resultado: `mem_save` en engram y commit del documento en `docs/`.
4. Anota cómo se portó la skill. Si funcionó, se repite el patrón en cada fase del plan.

---

## 5. Nota de honestidad

No leí `~/.claude/skills/abogado-del-diablo/SKILL.md` — está fuera de las carpetas conectadas a Cowork. Este prompt está construido sobre el contexto verificado del repo y sobre la función declarada en `docs/tooling/triage.md`, no sobre el contrato interno de la skill.

Si al invocarla resulta que espera otro formato de entrada, ajusta el prompt a lo que pida su `SKILL.md` — ese documento manda sobre este.
