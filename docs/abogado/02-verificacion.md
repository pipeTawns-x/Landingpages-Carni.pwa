# Verificación de Objeciones — Programa de Afiliados/Referidos

Verificador: agente independiente. No participé en la redacción de
`01-objeciones.md`; solo verifico cada objeción contra las fuentes de
verdad listadas abajo.

Fuentes de verdad usadas:

- `supabase/migrations/202604100001_initial_schema.sql`
- `supabase/migrations/202604100002_rls_policies.sql`
- `supabase/migrations/202604100003_functions.sql`
- `supabase/seed.sql`
- `docs/blueprints/module-scopes.md`
- `docs/brain/vision.md`
- `src/`, `server/`, `package.json` (grep de `affiliates`/`referrals`/`track_score`)

Nota de alcance: solo existen tres migraciones aplicadas
(`202604100001`, `202604100002`, `202604100003`); no hay una cuarta
migración que agregue constraints posteriores. Confirmado con
`Glob supabase/migrations/*.sql`.

---

## Objeción 1: El teléfono de 10 dígitos no es una identidad

- Cita: `202604100001_initial_schema.sql` línea 15, `202604100003_functions.sql` líneas 8-29.
- Verificación de línea 15: `    phone TEXT CHECK (char_length(phone) = 10),` — existe tal cual, sin `UNIQUE`. Revisé el archivo completo: el único `UNIQUE` en todo el schema está en `categories.name`, `categories.slug` y `promotions.code`; `profiles.phone` no lo tiene.
- Verificación de `handle_new_user()` (líneas 8-29): la función existe exactamente en ese rango. Línea 18: `NULLIF(NEW.raw_user_meta_data->>'phone', ''),` — copia el valor del metadata del cliente sin validación externa, tal como afirma la objeción. No hay llamada a proveedor OTP en ninguna de las tres migraciones.
- Consecuencia: se sigue directamente de la evidencia — un CHECK de longitud no impide duplicados (no hay UNIQUE) ni valida que el string sea un teléfono real. No es una suposición sobre el sistema, es la ausencia comprobada de dos controles (UNIQUE, validación externa).
- **Veredicto: CONFIRMADA**

## Objeción 2: `create_order_with_items()` no valida el precio contra `products`

- Cita: `202604100003_functions.sql` líneas 244-291; `202604100001_initial_schema.sql` líneas 70-77.
- Verificación: la función ocupa exactamente las líneas 244-291. Línea 265: `v_line_total := (v_item->>'quantity_kg')::DECIMAL(10,3) * (v_item->>'unit_price')::DECIMAL(10,2);` (la objeción cita la fórmula simplificada sin los modificadores de precisión, pero el origen de ambos valores —`v_item`, es decir `p_items` enviado por el cliente— es correcto). Repasé toda la función: no hay ningún `SELECT`/`JOIN` contra `products.price_per_kg` ni `products.price_per_lb` en ningún punto del cuerpo.
- Verificación de `order_items` (líneas 70-77): existen tal cual — `quantity_kg DECIMAL(10,3) NOT NULL` y `unit_price DECIMAL(10,2) NOT NULL`, sin `CHECK (... > 0)` en ninguna de las dos columnas.
- Consecuencia: se sigue de la evidencia. El texto es cuidadoso al decir "si el gate... usa `orders.total`" (condicional, no afirma que el gate ya exista) y aclara que la vulnerabilidad es independiente del módulo de afiliados — no exagera.
- **Veredicto: CONFIRMADA**

## Objeción 3: `protect_profile_system_fields()` revierte en silencio

- Cita: `202604100003_functions.sql` líneas 53-69 y 119-145.
- Verificación: `protect_profile_system_fields()` existe exactamente en líneas 53-69. Líneas 65-66: `NEW.role := OLD.role; NEW.points := OLD.points;` cuando el caller no es admin — confirmado, sin `RAISE`, el UPDATE no falla, solo no cambia el valor.
- Verificación de `add_points()` (líneas 119-145): línea 131, `RAISE EXCEPTION 'Only admins can add points';` — cita exacta.
- Consecuencia: se sigue directamente. Un UPDATE directo a `profiles.points` con JWT de cliente "tiene éxito" (no hay excepción del trigger) pero el valor no cambia — es exactamente el comportamiento de un revert silencioso.
- **Veredicto: CONFIRMADA**

## Objeción 4: Las reglas anti-colusión no existen

- Cita: `docs/blueprints/module-scopes.md` línea 78.
- Verificación: línea 78 dice textualmente: `Anti-abuse note (scope flag): self-referral and reward farming must be guarded server-side; exact rules are a spec-phase decision.` — cita exacta.
- Verificación adicional: grep de `affiliates`/`referrals` en `supabase/` no arroja resultados — no existe ninguna tabla, columna, constraint ni función relacionada con referidos en las migraciones aplicadas, así que no puede existir una regla anti-colusión a nivel de schema.
- Consecuencia: se sigue de la evidencia sin necesitar suposiciones adicionales.
- **Veredicto: CONFIRMADA**

## Objeción 5: `track_score` no existe en el schema aplicado

- Cita: `202604100001_initial_schema.sql` línea 20; `docs/blueprints/module-scopes.md` líneas 76 y 85.
- Verificación de línea 20: `    points INTEGER NOT NULL DEFAULT 0` — es la única columna de recompensa en `profiles`. No hay `track_score` en ninguna migración.
- Verificación de línea 76: `Possible write to loyalty (\`profiles.track_score\` / store credit) on qualification.` — cita exacta.
- Verificación de línea 85: `...plus loyalty columns owned by Track Score: track_score, level, generosity_points, total_spent).` — cita exacta.
- Grep de `track_score` en todo el repo: aparece solo en archivos de `docs/` (incluye `docs/brain/vision.md`, `docs/blueprints/module-scopes.md`, y otros documentos de planeación) — cero resultados en `supabase/migrations/`, `src/`, o `server/`.
- Consecuencia: se sigue de la evidencia — el "destino" de la recompensa que propone el blueprint no tiene columna real hoy, y el único destino real (`profiles.points`) ya está protegido por el trigger de la Objeción 3 (referencia cruzada correcta, no repite evidencia sin marcarla).
- **Veredicto: CONFIRMADA**

## Objeción 6: No hay mecanismo para revocar una recompensa otorgada

- Cita: `202604100003_functions.sql` líneas 297-314 y 151-182; `docs/blueprints/module-scopes.md` línea 76.
- Verificación de `cancel_order()` (líneas 297-314): existe exactamente en ese rango. Línea 308: `AND status = 'pending';` — confirma que solo cubre pedidos pendientes, no `delivered`.
- Verificación de `update_order_status()` (líneas 151-182): existe exactamente en ese rango, es admin-only (líneas 158-164), valida el string contra la lista de estados permitidos (línea 167) pero no valida la transición desde el estado actual (no hay lectura de `orders.status` antes del UPDATE), y no toca `referrals` ni `profiles.points` en ningún punto del cuerpo — confirmado, no existe tabla `referrals` y no hay ninguna referencia a `points` en esta función.
- Verificación de línea 76 de `module-scopes.md`: `reward_status pending/granted/void` — cita exacta.
- Consecuencia: se sigue de la evidencia. No hay trigger ni función que mueva `granted → void`; el texto no afirma más de lo que la ausencia de código permite concluir.
- **Veredicto: CONFIRMADA**

## Objeción 7: No hay presión competitiva verificada

- Cita: ninguna. El texto dice "según el contexto verificado" y describe a Carnívoros (Shopify, PayPal, sin loyalty) sin señalar un archivo fuente.
- Verificación: busqué `Carnívoros`/`carnivoros`, `Shopify`, `PayPal` en `docs/brain/vision.md` y `docs/blueprints/module-scopes.md` (las únicas fuentes de contexto de negocio permitidas) — cero resultados en ambos archivos. Existe un `docs/blueprints/competitor-scan.md` en el repo con ese contenido, pero **no está en la lista de fuentes de verdad autorizadas** para esta verificación, y la objeción tampoco lo cita explícitamente.
- Regla aplicada: "Si no cita ningún archivo, márcala inmediatamente como SIN EVIDENCIA." La objeción no cita ninguno para su afirmación central (comparación competitiva).
- **Veredicto: SIN EVIDENCIA** — el dato competitivo no es verificable dentro de las fuentes de verdad asignadas. (La premisa secundaria sobre Track Score inexistente sí está confirmada en la Objeción 5, pero no sostiene por sí sola la tesis de "falta de presión competitiva".)

## Objeción 8: No hay techo de gasto ni control de exposición

- Cita: `docs/blueprints/module-scopes.md` línea 76; `202604100001_initial_schema.sql` líneas 92-100.
- Verificación de línea 76: `\`affiliates\` (profile_id, referral_code, status, total_referred, total_rewarded), \`referrals\` (referrer_id, referred_profile_id, first_order_id, reward_status pending/granted/void, created_at).` — cita exacta; en efecto no aparece ninguna columna de presupuesto, tope o límite por período.
- Verificación de `promotions` (líneas 92-100): existe exactamente en ese rango, con `min_purchase DECIMAL(10,2)`, `valid_from DATE`, `valid_until DATE`, `is_active BOOLEAN` — confirma el patrón de controles de exposición que sí existe hoy para un mecanismo análogo.
- Consecuencia: se sigue de la evidencia y de las Objeciones 2 y 4 ya confirmadas (precio manipulable + sin regla anti-colusión), sin agregar afirmaciones nuevas no sostenidas. La propia objeción etiqueta su confianza como "especulativa" porque `affiliates`/`referrals` no existen todavía — eso es correcto y no resta validez al contraste de patrón, que sí es verificable en código real (`promotions`).
- **Veredicto: CONFIRMADA**

---

## Conteo por categoría

| Categoría | Cantidad |
|---|---|
| CONFIRMADA | 7 |
| PARCIAL | 0 |
| SIN EVIDENCIA | 1 |
| FALSA | 0 |
| NO VERIFICABLE | 0 |
| **Total** | **8** |

## Veredicto de continuidad

`sin_evidencia + falsas` = 1. `total` = 8. 1/8 = 12.5%, no es mayor a
la mitad del total.

**Veredicto: CONTINUAR**
