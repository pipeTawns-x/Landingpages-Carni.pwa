# Abogado del Diablo — Programa de Afiliados/Referidos

Tesis atacada: "Un cliente de Carni-mvp puede referir a otro cliente y cobrar una recompensa, sin que exista una forma rentable de defraudar el sistema."

Alcance evaluado: `docs/blueprints/module-scopes.md` sección "Affiliate program" (tablas `affiliates` y `referrals`, aún no implementadas) contra el schema real en `supabase/migrations/` y `supabase/seed.sql`.

---

## Objeción 1: El teléfono de 10 dígitos no es una identidad, es un formato de string

- Supuesto que rompe: que `profiles.phone` funciona como barrera contra cuentas duplicadas del mismo referente (auto-referido).
- Evidencia que la sostiene: `supabase/migrations/202604100001_initial_schema.sql` línea 15 — `phone TEXT CHECK (char_length(phone) = 10)`. No hay `UNIQUE`, no hay regex de formato, no hay verificación OTP en ninguna migración. `handle_new_user()` (`202604100003_functions.sql` líneas 8-29) copia `raw_user_meta_data->>'phone'` directo, sin validarlo contra un proveedor externo.
- Consecuencia si nadie la atiende: cualquier string de 10 dígitos pasa el CHECK — no tiene que corresponder a un teléfono real, y aun siéndolo, nada impide repetirlo entre cuentas (sin `UNIQUE`) o comprar N chips prepago a 50 pesos cada uno. La tesis entera depende de que el teléfono discrimine identidades únicas; hoy solo discrimina longitud de string.
- Confianza: alta

## Objeción 2: `create_order_with_items()` acepta el precio unitario que manda el cliente, sin validarlo contra `products`

- Supuesto que rompe: que una "primera compra calificada" tiene un valor económico real verificado por el servidor.
- Evidencia que la sostiene: `supabase/migrations/202604100003_functions.sql` líneas 244-291. `v_line_total := (v_item->>'quantity_kg')::DECIMAL * (v_item->>'unit_price')::DECIMAL` — ambos valores vienen del JSONB `p_items` enviado por el cliente. No hay JOIN contra `products.price_per_kg` / `price_per_lb`. `order_items` (schema líneas 70-77) tampoco tiene CHECK `> 0` en `quantity_kg` ni `unit_price`.
- Consecuencia si nadie la atiende: si el gate de "compra calificante" del programa de afiliados usa `orders.total`, es manipulable a costo cero — el cliente decide qué precio queda escrito en la base. Un referido puede satisfacer la condición de recompensa con una orden de valor casi nulo, sin necesitar ninguna cuenta falsa ni colusión sofisticada. Esta vulnerabilidad ya existe hoy, independiente del módulo de afiliados; el módulo solo la hereda y la vuelve rentable.
- Confianza: alta

## Objeción 3: `protect_profile_system_fields()` revierte en silencio cualquier recompensa escrita con el JWT del propio cliente

- Supuesto que rompe: que otorgar la recompensa (puntos/crédito) es tan simple como hacer un UPDATE a `profiles`.
- Evidencia que la sostiene: `supabase/migrations/202604100003_functions.sql` líneas 53-69 — si `auth.uid()` no es NULL y el perfil que ejecuta el UPDATE no tiene `role = 'admin'`, el trigger fuerza `NEW.points := OLD.points`. Además, `add_points()` (líneas 119-145) hace `RAISE EXCEPTION 'Only admins can add points'` si el caller no es admin.
- Consecuencia si nadie la atiende: un endpoint de afiliados que intente acreditar puntos usando el JWT del cliente referente/referido (patrón natural para un flujo self-service) no falla con error visible — el UPDATE "tiene éxito" pero `points` queda sin cambio. Es un bug silencioso: el cliente reclama que nunca cobró la recompensa y no hay log de error que lo explique.
- Confianza: alta

## Objeción 4: Las reglas anti-colusión no existen ni en documento, están marcadas como pendientes

- Supuesto que rompe: que el sistema ya contempla cómo evitar que dos clientes reales se refieran mutuamente en ciclo (A refiere a B, B refiere a A meses después) o farmeen recompensas coordinadamente.
- Evidencia que la sostiene: `docs/blueprints/module-scopes.md` línea 78 — "Anti-abuse note (scope flag): self-referral and reward farming must be guarded server-side; exact rules are a spec-phase decision." No hay columna, constraint, ni función que limite referidos por par de usuarios, ventana de tiempo, o direccionalidad.
- Consecuencia si nadie la atiende: la colusión entre dos identidades reales y verificables (no fraude de identidad, fraude de comportamiento coordinado) queda completamente fuera del blueprint actual. No es que el diseño anti-fraude esté mal — es que todavía no hay diseño.
- Confianza: alta

## Objeción 5: El destino de la recompensa (`track_score`) no existe en el schema aplicado

- Supuesto que rompe: que hay una cuenta o columna donde acreditar la recompensa hoy.
- Evidencia que la sostiene: `profiles` solo tiene `points INTEGER` (`202604100001_initial_schema.sql` línea 20). `docs/blueprints/module-scopes.md` línea 76 propone escribir en "`profiles.track_score` / store credit" y línea 85 lista `track_score, level, generosity_points, total_spent` como columnas de Track Score — ninguna existe en las migraciones reales. Búsqueda de `track_score` en el repo: solo aparece en `docs/`, cero resultados en `supabase/migrations/`.
- Consecuencia si nadie la atiende: el programa de afiliados depende de un módulo (Track Score) que hoy es solo texto de scope, no schema. El único destino real disponible (`profiles.points`) ya está protegido por un trigger que asume que solo un admin debería tocarlo (ver Objeción 3).
- Confianza: alta

## Objeción 6: No hay mecanismo para revocar una recompensa ya otorgada

- Supuesto que rompe: que si el pedido que originó la recompensa se cancela después, la recompensa se puede revertir.
- Evidencia que la sostiene: `cancel_order()` (`202604100003_functions.sql` líneas 297-314) solo cancela pedidos propios con `status = 'pending'` — no cubre pedidos `delivered`. `update_order_status()` (líneas 151-182), la única función capaz de mover `delivered → cancelled`, es admin-only, no valida transición de estado (solo que el string esté en la lista permitida) y no dispara nada sobre `referrals` ni `profiles.points`. El scope de `referrals` (`module-scopes.md` línea 76) define `reward_status ∈ {pending, granted, void}` pero ningún archivo del repo define qué proceso mueve `granted → void`.
- Consecuencia si nadie la atiende: revocar una recompensa ya pagada es un proceso 100% manual — alguien tiene que detectar el fraude, entrar como admin, y revertir a mano tanto el estado del pedido como los puntos ya acreditados. El sistema no ayuda en nada de ese proceso.
- Confianza: alta

## Objeción 7: No hay presión competitiva verificada que justifique el riesgo que se está abriendo

- Supuesto que rompe: que el programa de afiliados resuelve un problema competitivo real de esta carnicería, no que se copia porque "otros lo tienen".
- Evidencia que la sostiene: según el contexto verificado, Carnívoros (carnivoros.mx) — el único competidor verificado — corre en Shopify, vende por pieza/paquete, solo acepta PayPal, "sin programa de lealtad". Al mismo tiempo, Track Score (la base de lealtad de la que depende el destino de la recompensa, ver Objeción 5) tampoco existe todavía.
- Consecuencia si nadie la atiende: se está diseñando la capa de crecimiento (referidos) antes que la capa base (lealtad) exista, sin evidencia de que el competidor esté ganando clientes por tener este feature — porque no lo tiene. El riesgo de fraude se asume sin una amenaza de mercado comprobada que lo justifique.
- Confianza: media — la comparación competitiva es dato verificado; la conclusión de "sin presión de mercado" es interpretación sobre ese dato.

## Objeción 8: No hay techo de gasto ni control de exposición por período

- Supuesto que rompe: que el dueño puede predecir cuánto le va a costar el programa en un mes dado.
- Evidencia que la sostiene: `affiliates` (`module-scopes.md` línea 76) define `total_referred` y `total_rewarded` como contadores acumulativos, sin columna de presupuesto máximo, tope mensual, ni límite de recompensas por período en ninguna de las dos tablas propuestas. Contraste directo: `promotions`, la tabla análoga que sí existe hoy, tiene `min_purchase`, `valid_from`, `valid_until`, `is_active` como controles de exposición (`202604100001_initial_schema.sql` líneas 92-100) — el diseño de `referrals`/`affiliates` no replica ese patrón.
- Consecuencia si nadie la atiende: sin tope de gasto, una red de colusión (Objeción 4) combinada con órdenes calificantes de costo manipulado (Objeción 2) puede escalar recompensas otorgadas sin ningún freno automático — el único freno sería que el dueño lo note revisando `total_rewarded` a mano.
- Confianza: especulativa — `affiliates` y `referrals` no existen todavía; esto es una proyección sobre el scope documentado, no sobre código real.

---

**Total de objeciones: 8**
