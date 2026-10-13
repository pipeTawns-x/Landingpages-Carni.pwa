# 06 · Plano de construcción del rediseño del MVP (R3)

- **Fecha:** 2026-09-29.
- **Rol:** arquitecto de software senior, con la skill `the-architect`. Se ejecutó sin entrevista porque Eduardo pidió "no me preguntes". Cada decisión que habría sido pregunta queda en la sección 8, "Supuestos".
- **Rama y árbol:** `pruebas`, en `/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas`. En adelante, `$WT`.
- **Modo de esta fase:** solo lectura del código. Lo único escrito es este archivo. No se ejecutó npm. Sobre la base local solo se hicieron consultas `SELECT` (contenedor `supabase_db_Carni-mvp`).
- **Entradas leídas:**
  - `ESTADO.md` y `contexto-previo.md`;
  - `investigacion/01` a `04`;
  - `05-abogado-del-diablo.md`;
  - `src/` (`ui/`, `landing/`, `entry/landing.tsx`, `entry/shared.tsx`, `hooks/usePedido.ts`, `lib/pedidoStorage.ts`, `types/database.ts`, `components/Lupa/montar.tsx`);
  - `package.json`, `vite.config.js`, `jest.config.js`, `tsconfig.json`, `.gitignore`;
  - los agentes de `.claude/agents/` y de `~/.claude/agents/`.
- **Precedencia:** donde choquen, este plano manda sobre `05`, y `05` manda sobre `ESTADO.md`. Donde este plano calla, vale `05`, y después `ESTADO.md`.

**Cómo se usa este documento**
1. El orquestador lee la sección 0 (plan agéntico) y la sección 4 (unidades), y ejecuta.
2. Cada escritor recibe tres cosas:
   - la plantilla de instrucción (§0.7);
   - su unidad de §4;
   - las subsecciones de §1 a §3 que su unidad cita.
3. Nadie necesita releer los informes de investigación: lo que sirve está copiado aquí con su valor exacto.

---

## Resumen

1. **Qué se entrega primero:** un solo recorrido coherente en React y Tailwind v4, repartido en tres entradas.
   - `landing.html`: la landing completa, con el asistente.
   - `catalogo.html`: el catálogo, con la misma Tarjeta y el asistente.
   - `panel.html`: la carcasa del panel.
   - Quedan diferidos el acceso, la ficha, el checkout y el resto del panel (orden en `05` §6).
2. **Quién escribe:** 4 escritores Sonnet, en secuencia, cada uno dueño de archivos distintos.
   - Solo hay dos momentos en paralelo: el guardián de datos junto al escritor de la landing (el guardián solo escribe una propuesta SQL en `docs/`), y los dos jueces finales (solo leen).
3. **Cómo se cierra cada unidad:**
   - compuerta mecánica del escritor;
   - revisión fresca (Sonnet);
   - compuertas del orquestador;
   - commit;
   - `punto-de-control`.
   - Al final hay un juicio dual ciego en Opus (UX, a11y y completitud por un lado; seguridad con Cyber Neo por otro), un corrector y una verificación fresca de la corrección.
4. **Cuántos agentes:** 15 corridas de agente en todo el rediseño.
   - Ya corrieron 2: abogado del diablo y arquitecto.
   - Quedan 13: 10 en Sonnet y 3 en Opus (guardián y dos jueces).
   - Nunca hay más de 2 a la vez.
5. **Costo:** unos 121 puntos de la ventana de 5 h (±30 %). Se termina en lo que queda de la ventana actual más una ventana nueva. En el límite semanal son unos 13 puntos.
6. **Encabezado:** vuelve el efecto viejo, literal.
   - Transparente con velo sobre el video.
   - `rgba(0,0,0,.92)` con hover real y con foco dentro.
   - Sólido al pasar la portada.
   - Sin desenfoque en ninguna pantalla.
7. **Datos:**
   - Cliente Supabase perezoso, tomado del paquete npm.
   - Si falta `.env`, si la consulta falla o si tarda más de 2,5 s, la página pinta una semilla. Esa semilla es copia exacta de los 53 productos activos de la base local.
   - El precio siempre sale de la base. En el pedido manda el servidor (RPC).
8. **Seguridad:**
   - guardia `getUser()` + `is_admin()`;
   - `signOut()` real;
   - cero `innerHTML`, cero CDN y cero llaves `VITE_` nuevas;
   - migración de pedidos propuesta, con prueba `BEGIN … ROLLBACK`, sin aplicar.

---

## 0. Plan agéntico

### 0.1 Skills con su ruta exacta

| Id | Skill | Ruta |
|---|---|---|
| S1 | carni-frontend-guardrails | `/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas/.claude/skills/carni-frontend-guardrails/SKILL.md` |
| S2 | building-components | `/Users/felipeeduardotorresaguilar/.claude/skills/building-components/SKILL.md` |
| S3 | vercel-react-best-practices | `/Users/felipeeduardotorresaguilar/.agents/skills/vercel-react-best-practices/SKILL.md` |
| S4 | emil-design-eng | `/Users/felipeeduardotorresaguilar/.claude/skills/emil-design-eng/SKILL.md` |
| S5 | impeccable + craft-floor | `/Users/felipeeduardotorresaguilar/.claude/skills/impeccable/SKILL.md` y `/Users/felipeeduardotorresaguilar/.claude/skills/impeccable/reference/craft-floor.md` |
| S6 | design-taste-frontend, **solo §4.4 a §4.7 (líneas 213 a 275)** | `/Users/felipeeduardotorresaguilar/.agents/skills/design-taste-frontend/SKILL.md` |
| S7 | web-design-guidelines | `/Users/felipeeduardotorresaguilar/.agents/skills/web-design-guidelines/SKILL.md` |
| S8 | hallmark (modo audit) | `/Users/felipeeduardotorresaguilar/.agents/skills/hallmark/SKILL.md` |
| S9 | cyber-neo-auditoria | `/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas/.claude/skills/cyber-neo-auditoria/SKILL.md` |
| S10 | supabase | `/Users/felipeeduardotorresaguilar/.claude/plugins/marketplaces/supabase-community-supabase-plugin/skills/supabase/SKILL.md` |
| S11 | supabase-postgres-best-practices | `/Users/felipeeduardotorresaguilar/.claude/plugins/marketplaces/supabase-community-supabase-plugin/skills/supabase-postgres-best-practices/SKILL.md` |
| S12 | supabase-postgres-vesta-style | `/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas/.claude/skills/supabase-postgres-vesta-style/SKILL.md` |
| S13 | judgment-day | `/Users/felipeeduardotorresaguilar/.claude/skills/judgment-day/SKILL.md` |
| S14 | punto-de-control | `/Users/felipeeduardotorresaguilar/.claude/skills/punto-de-control/SKILL.md` |
| S15 | the-architect | `/Users/felipeeduardotorresaguilar/.claude/skills/the-architect/SKILL.md` |
| S16 | abogado-del-diablo | `/Users/felipeeduardotorresaguilar/.claude/skills/abogado-del-diablo/SKILL.md` |
| S17 | guardemos-esto, workflow-authoring, security-review | Se cargan por nombre con la herramienta `Skill`. No tienen archivo en `~/.claude/skills/`; se comprobó con `test -f`. |

### 0.2 Plantilla de agentes (quién corre, con qué y qué entrega)

| # | Rol | agentType | Modelo | Instancias | Skills | Qué hace | Archivos que escribe | Compuerta que debe pasar |
|---|---|---|---|---|---|---|---|---|
| A0 | Orquestador | la sesión (no es un agente) | el de la sesión | 1 | S14, S1, S17 (guardemos-esto, workflow-authoring) | Hace U0 y U6. Lanza los tramos T1 a T5. Corre las compuertas antes de cada commit y es el **único que hace commits**. Corre la prueba RLS y crea el admin de prueba local. Mide con Playwright, abre Brave y guarda el avance en Engram. | `ESTADO.md`, commits, `docs/design/rediseno/capturas-r4/` (finales), `supabase/.temp/admin-prueba-local.json` (ignorado por git) | `git -C "$WT" log -1` muestra el commit de cada unidad |
| A1 | Abogado del diablo (R2) · HECHO | agente del workflow `wf_46237072-6e5` | opus | 1 | S16 | Escribió `05-abogado-del-diablo.md` | `05` | ya pasó |
| A2 | Arquitecto (R3) · HECHO al entregar este archivo | `Plan` | opus | 1 | S15 | Escribió este plano | `06-plano.md` | ya pasó |
| A3 | Escritor W1 · cimientos y carcasa | `carni-frontend-specialist` | sonnet | 1 | S1, S2, S3, S4 | U1: tokens, fuentes, dependencias, tres HTML y tres entradas, capa de datos, `Hoja`, íconos, `Encabezado`, `MenuHoja`, `CarritoHoja`, `Pie`, `Carcasa`, `InsigniaDatos` y los esqueletos | lista de U1 (§4) | criterios de U1 |
| A4 | Escritor W2 · landing | `carni-frontend-specialist` | sonnet | 1 | S5, S6, S1, S4 | U2: `Tarjeta` única con sus presentaciones, `CarruselCortes` y las 10 secciones de la landing en el orden fijado | lista de U2 | criterios de U2 |
| A5 | Guardián de datos (en paralelo con A4) | `guardian-de-datos` | opus (fijado en su frontmatter) | 1 | S12, S11 | U2s: migración **propuesta**, guion de prueba RLS y traspaso al chat de backend. No aplica nada y no tiene `Bash`. | `docs/design/rediseno/seguridad/` | la prueba que corre el orquestador sale con código 0 y la base queda sin cambios |
| A6 | Escritor W3 · catálogo y asistente | `carni-frontend-specialist` | sonnet | 1 | S2, S5, S1, S4 | U3: página del catálogo (filtro, búsqueda, rejilla con la Tarjeta) y `Asistente` completo | lista de U3 | criterios de U3 |
| A7 | Escritor W4 · panel | `carni-frontend-specialist` | sonnet | 1 | S2, S10, S7, S1 | U4: guardia de admin, `NavPanel` con cajón y X, Inicio con estados vacíos honestos, confirmación de salida con X y `signOut()` | lista de U4 | criterios de U4 |
| A8 | Revisor de unidad (revisión fresca antes de cada commit de código) | `general-purpose` | sonnet | 5 (U1, U2, U3, U4 y la verificación del corrector) | S7, S1; además S9 en U4 y en la verificación | Lee **solo** el diff de la unidad (`git -C "$WT" diff` más los archivos nuevos) y sus criterios. Busca defectos, incumplimientos de §2, §3 y §5, y archivos fuera de la lista. | nada (devuelve informe) | 0 hallazgos CRITICAL; si hay, la unidad vuelve a su escritor una vez |
| A9 | Juez A · UX, a11y, listón editorial y crítico de completitud | `jd-judge-a` | **opus, forzado en la llamada** (su frontmatter dice sonnet) | 1 | S13, S7, S5, S2, S8 | Revisión ciega del diff completo desde la línea base:<br>• las 7 reglas de superposición;<br>• contraste, foco y movimiento reducido;<br>• aire de plantilla;<br>• las exigencias de Eduardo, una por una, con evidencia (§6.4). | nada | informe con severidades |
| A10 | Juez B · seguridad (Cyber Neo) y verdad de datos | `security-guardian` | **opus, forzado en la llamada** | 1 | S13, S9, S10, S11, S17 (security-review) | Revisión ciega del mismo diff:<br>• guardia, `signOut` y `innerHTML`;<br>• escrituras a `orders`, llaves `VITE_`, CDN y `dist/`;<br>• cifras inventadas;<br>• la propuesta SQL de A5.<br>Entrega en el formato de judgment-day. | nada | informe con severidades |
| A11 | Corrector | `jd-fix-agent` | sonnet | 1 | S13 + las skills del escritor dueño de cada archivo | Corrige solo los hallazgos CONFIRMED (que vieron los dos jueces) o CRITICAL (aunque lo vea uno) y vuelve a correr la compuerta | archivos de los hallazgos | compuerta verde y A8 sin CRITICAL |

**Agentes que se descartan, y por qué:**
- `carni-qa` y `design-handoff`: solo existen en la rama `practicas-ebac`. Copiarlos sería crear una capa local nueva, lo que exige HITL según `AGENTS.md`. Su trabajo lo hacen las mediciones del orquestador (§6) y el juez A.
- `impeccable-*` y `estudio-visual`: no hay activos que producir. El video es un solo comando `ffmpeg` que corre el orquestador.
- `devops-captain` y `ai-engineer`: la v1 no toca CI, CSP ni LLM.
- Cadena SDD: duplicaría `05` y este plano.
- `Explore`: la investigación ya está hecha.

### 0.3 Totales y paralelismo

- **Total del rediseño: 15 corridas de agente.**
  - Ya corrieron 2 (A1 y A2, en Opus).
  - Quedan 13: 4 escritores, 5 revisiones de unidad, 1 guardián, 2 jueces y 1 corrector. De esas, 10 van en Sonnet y 3 en Opus (A5, A9 y A10).
- **Contingencia, que no se cuenta en el total:**
  - hasta 4 corridas de corrección del escritor dueño, una por unidad, cuando A8 encuentra un CRITICAL;
  - si esa corrección falla, la misma corrida se repite **una vez en Opus** (política de Eduardo);
  - un re-juicio como máximo, solo si el corrector tocó un CRITICAL.
- **Paralelismo máximo: 2 a la vez.** Sucede en T2 (W2 junto al guardián) y en T5 (juez A junto al juez B).
- **Los escritores van en secuencia aunque sus archivos sean disjuntos.** Hay dos razones:
  1. `tsc --noEmit` y `vite build` compilan todo el proyecto, así que el archivo a medio escribir de un escritor rompe la compuerta del otro.
  2. La regla global del stack es "un solo escritor, sin escritores en paralelo salvo con árboles aislados aprobados". Aquí no hay árboles aislados: el contenedor monta solo `pruebas`, y cada árbol necesitaría su propio `node_modules` con binarios de Linux arm64.
- **Por qué igual se fija dueño por archivo:**
  - permite revertir una unidad sin tocar las demás;
  - el revisor puede comprobar mecánicamente que nadie salió de su lista.

### 0.4 Orquestación por fase (tramos del Workflow)

Cada tramo es una corrida corta del Workflow. Entre un tramo y el siguiente, el control vuelve al orquestador, que corre compuertas, hace el commit, actualiza `ESTADO.md` y Engram y pasa el punto de control. Así, cortarse a media ventana nunca deja trabajo sin guardar de más de una unidad.

| Tramo | Patrón | Agentes | Qué hace el orquestador después |
|---|---|---|---|
| T0 | en línea, sin agentes | ninguno | U0 completa (§4) y 2 commits |
| T1 | `pipeline`: escritor → revisor fresco → [corrección, una vez] | A3, A8 | compuertas de U1 (§4 y §6.3 para menú y carrito) → commit → `punto-de-control` |
| T2 | `parallel( pipeline(A4 → A8 → [corrección]), A5 )` | A4, A8, A5 | compuertas de U2 → commit de U2 → prueba RLS en `BEGIN … ROLLBACK` → commit de la propuesta → `punto-de-control` (pausa prevista) |
| T3 | `pipeline` | A6, A8 | compuertas de U3 → commit → `punto-de-control` |
| T4 | `pipeline`. **Antes de lanzarlo:** crear el admin de prueba local (§4, U4) | A7, A8 (con S9) | compuertas de U4 → commit → `punto-de-control` (pausa si toca) |
| T5 | juicio dual ciego: `parallel(A9, A10)` → cruce de hallazgos → A11 (solo CONFIRMED o CRITICAL) → A8 sobre el diff del corrector → [re-juicio de un juez, una vez, solo si hubo CRITICAL] | A9, A10, A11, A8 | compuertas → commit de correcciones |
| T6 | en línea, sin agentes | ninguno | Verificación final (§6), tabla de completitud (§6.4), Brave, `ESTADO.md`, Engram, `mem_session_summary` |

Boceto de un tramo. Antes de escribir el guion real, el orquestador carga la skill `workflow-authoring` y ajusta la sintaxis. El boceto fija la forma, no la API.

```js
// T1 — boceto. briefEscritor/briefRevisor/briefCorreccion arman el texto con la plantilla §0.7.
const WT = '/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas';
export default async function t1() {
  return phase('U1', async () => {
    const w = await agent(briefEscritor('U1'), { agentType: 'carni-frontend-specialist', model: 'sonnet' });
    let r = await agent(briefRevisor('U1', w), { agentType: 'general-purpose', model: 'sonnet' });
    if (r.criticos > 0) {                                   // primera corrección: el mismo escritor, en Sonnet
      await agent(briefCorreccion('U1', r), { agentType: 'carni-frontend-specialist', model: 'sonnet' });
      r = await agent(briefRevisor('U1'), { agentType: 'general-purpose', model: 'sonnet' });
      if (r.criticos > 0)                                   // segunda falla: escalar SOLO esta corrida a Opus
        await agent(briefCorreccion('U1', r), { agentType: 'carni-frontend-specialist', model: 'opus' });
    }
    return r;
  });
}
// T2: parallel([() => pipelineU2(), () => agent(briefGuardian, { agentType: 'guardian-de-datos', model: 'opus' })])
// T5: const [a, b] = await parallel([
//        () => agent(briefJuezA, { agentType: 'jd-judge-a', model: 'opus' }),
//        () => agent(briefJuezB, { agentType: 'security-guardian', model: 'opus' })]);
//     const lista = cruzar(a, b);   // CONFIRMED = lo vieron los dos; más cualquier CRITICAL de uno
//     if (lista.length) { await agent(briefCorrector(lista), { agentType: 'jd-fix-agent', model: 'sonnet' });
//                         await agent(briefRevisor('fix'), { agentType: 'general-purpose', model: 'sonnet' }); }
```

**Resultado de cada agente.** Todo agente termina con este bloque, que el guion o el orquestador leen:

```
RESULTADO
estado: listo | bloqueado
criticos: <n>                (solo revisores y jueces)
archivos: [rutas]
compuerta: ts:check=<ok|falla> test=<ok|falla> (<n> pruebas) build=<ok|falla> rg=<0|lista> capturas=[rutas]
desviaciones: [qué se apartó del plano y por qué]
riesgos: [...]
skill_resolution: paths-injected | fallback
```

Si algún resultado dice `skill_resolution: fallback`, el orquestador vuelve a pasar las rutas de §0.1 en la siguiente llamada.

**Revisión fresca antes de cada commit.** La regla global del usuario exige revisión con contexto fresco antes de todo commit de código. La cumple A8 en cada unidad. GGA, que corre en el hook de commit, es una segunda revisión y no la reemplaza (ver §7).

### 0.5 Regla de punto de control y cómo se retoma

**Después de cada unidad, en este orden:**
1. Compuertas del orquestador.
2. Commit con `PATH=/opt/homebrew/bin:$PATH git -C "$WT" commit …`.
3. `git -C "$WT" log -1 --oneline`.
4. Actualizar `ESTADO.md`:
   - la fila de la unidad pasa a HECHO, con el sha;
   - se agrega una línea a la bitácora con el uso de la ventana de 5 h, el semanal y el contexto.
5. `mem_save` con `project: "carni-mvp"`, `topic_key: "rediseno-mvp/progreso"` (se actualiza siempre la misma nota) y `type: "architecture"`.
6. Skill `punto-de-control` (S14):

| Uso de la ventana de 5 h | Qué se hace |
|---|---|
| menos de 60 % | se sigue |
| 60 a 79 % | se sigue solo si el costo de la siguiente unidad (§0.7) deja el uso por debajo de 80 % |
| 80 a 89 % | pausa: se escribe "Para retomar" en `ESTADO.md` y se guarda con `guardemos-esto` |
| 90 % o más | pausa inmediata; no se lanza nada nuevo |

**Cómo se retoma:**
- **Tramo cortado a medias** (el límite cortó un agente): `Workflow({ scriptPath, resumeFromRunId })`, con el `runId` y el `scriptPath` que el orquestador anotó en la bitácora al lanzar el tramo. Los guiones viven en el scratchpad de la sesión orquestadora.
- **Sesión nueva o scratchpad perdido:** el orquestador lee "Para retomar" en `ESTADO.md`. Allí se dice la primera unidad que no está en HECHO y el comando de arranque.
  1. Revisa el árbol con `git -C "$WT" status --porcelain`.
  2. Si hay archivos de esa unidad a medio escribir, los conserva y lanza la corrida de corrección con "continúa desde el estado actual". Si están rotos sin arreglo, los descarta con `git -C "$WT" restore -- <archivos de la unidad>`, nunca con más alcance.
  3. Relanza la unidad.
  4. Las unidades son idempotentes porque cada una termina en su commit.
- **Mientras trabaja:** el orquestador puede fijar `/goal Entregar el primer rediseño en Brave según docs/design/rediseno/06-plano.md` para que la sesión siga de unidad en unidad sin volver a preguntar.

### 0.6 Skills por fase y por qué

| Fase | Skills | Por qué |
|---|---|---|
| Cimientos y componentes (U1) | S1, S2, S3, S4 | S1 son las reglas del repo: Docker, entradas en la raíz, `VITE_*`. S2 cubre `<dialog>`, foco y ARIA. S3 cubre carga perezosa, módulos y sin `useEffect` de más. S4 fija duraciones y curvas por debajo de 300 ms y la presión 0,97. |
| Diseño editorial (U2) | S5 (con `craft-floor.md`), S6 (§4.4 a §4.7), S1, S4 | S5 da el piso de oficio y los vetos (raya lateral, tarjeta dentro de tarjeta, kickers). S6 da las reglas medibles: tarjetas solo con jerarquía real, candado de radios, portada en el primer viewport, a lo sumo un kicker cada 3 secciones, bento sin celdas vacías, sin CTA duplicado. |
| Movimiento | S4 dentro de U1, U2 y U3 | Los valores quedan en los tokens (§2). `animate` y `apple-design` no se cargan: la dirección ya está decidida y cargarlas es contexto pagado sin uso. |
| Catálogo y asistente (U3) | S2, S5, S1, S4 | S2 cubre chips con `aria-pressed`, búsqueda con etiqueta y el diálogo del asistente. S5 cubre textos, estados vacíos y el "no es un chat común". |
| Panel, Supabase y seguridad (U4, U2s, A10) | S10, S7, S9, S11, S12 | S10 cubre `getUser`, `signOut` y RLS. S9 es la auditoría Cyber Neo que pide Eduardo. S11 y S12 sirven para escribir y revisar la migración propuesta. |
| QA y revisión (A8, A9, A10) | S7, S8, S13, S9 | S7 es la guía de interfaz verificable. S8 es la auditoría anti-plantilla, solo para el juez A. S13 es el protocolo ciego de dos jueces. |

**Skills que no se cargan, y por qué:**
- `ui-ux-pro-max`, `redesign-existing-projects`, `frontend-design`, `mobile-native` y `apple-design`: el sistema visual ya está aprobado (export 1.1) y corregido en §2.
- `imagen-gratis` y mflux: generar fotos de producto está prohibido (C5). Una foto generada de un corte que se vende es una representación falsa.
- `graphify`: ya se decidió omitirlo.
- `investigador`: no hace falta investigar más.

### 0.7 Costo estimado y ventanas

Unidad = puntos de la ventana de 5 h. Es una estimación: sale de la única razón medida en la bitácora (46 puntos de ventana ≈ 5 puntos semanales, es decir, 1 punto ≈ 0,11 semanal) y puede variar ±30 %.

| Unidad | Agentes | Puntos de la ventana de 5 h |
|---|---|---|
| U0 · preparación | orquestador | 4 |
| U1 · cimientos y carcasa | W1 18, revisor 3, compuertas, GGA y commit 3 | 24 |
| U2 · landing (+U2s en paralelo) | W2 17, guardián 5 (Opus), revisor 3, prueba RLS y commits 3 | 28 |
| U3 · catálogo y asistente | W3 13, revisor 3, commit 2 | 18 |
| U4 · panel | W4 10, revisor 3, admin local y commit 3 | 16 |
| U5 · juicio dual y corrección | jueces 2 × 7 (Opus), corrector 6, verificación 2, commit 1 | 23 |
| U6 · verificación final y entrega | orquestador | 8 |
| **Total** | | **~121** (con contingencia, hasta ~135) |

**Ventanas esperadas:**
- **Ventana actual (A).** Arranca en el uso que dejen R2 y R3, estimado en ~20 %.
  - U0 → ~24 %, U1 → ~48 %, U2 → ~76 %.
  - U3 llevaría el uso a ~94 %, así que la regla de §0.5 pausa ahí.
- **Ventana B:**
  - U3 → ~18 %, U4 → ~34 %, U5 → ~57 %, U6 → ~65 %.
  - Eduardo ve la entrega en Brave dentro de esta ventana.
- **Total:** la ventana actual más una, dos en total. Unos 13 puntos del límite semanal, que pasaría de ~59 % a ~72-75 %.

### 0.8 Plantilla de instrucción para cada escritor (el "CLAUDE.md" de esta etapa)

El orquestador copia este bloque, rellena `<U>` y los archivos, y agrega la unidad de §4. Es todo lo que el escritor necesita.

```
Eres el escritor de la unidad <U> del rediseño de Carni-mvp. Árbol: WT=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas (rama pruebas).
Antes de nada: test "$(git -C "$WT" branch --show-current)" = pruebas, o te detienes y lo reportas.

Lee en este orden: las skills de tu unidad (rutas absolutas abajo; de S6 solo las líneas 213-275),
luego $WT/docs/design/rediseno/06-plano.md secciones §1, §2, §3.<las que cite tu unidad> y §4.<U>.

Solo puedes crear o editar ESTOS archivos: <lista de §4>. Todo lo demás es de solo lectura.
Prohibido:
- git de escritura (add, commit, checkout, switch, stash, reset, restore, rebase). Los commits los hace el orquestador.
- npm/npx/node fuera de Docker. Todo va con: docker exec carni-landing-dev <comando>.
- crear styles.scss o cualquier SCSS para complacer al hook GGA.
- innerHTML, dangerouslySetInnerHTML, eval, new Function.
- llaves VITE_ nuevas; leer VITE_* fuera de src/data/supabase.ts.
- importar js/modules/**, src/entry/shared.tsx, styled-components, montarLupa o montarCarrito desde archivos nuevos.
- CDN (jsdelivr, unpkg, fonts.googleapis, fonts.gstatic).
- fotos de producto generadas con IA; cifras de existencia; precios escritos a mano.
- tocar las páginas viejas (index.html, products.html, accessweb.html, dashboar.html, admin-*.html) o src/components, src/pages.
Idioma:
- UI en español de México, neutro, sin voseo.
- Identificadores y comentarios en español, como el código existente de src/ui y src/landing.
Termina con la compuerta de §4 (comandos exactos) y devuelve el bloque RESULTADO de §0.4.
Si descubres algo no obvio (una trampa del entorno, un comportamiento raro), guárdalo con mem_save, project "carni-mvp".
```

### 0.9 Qué acepto y qué rechazo del informe 05

| 05 | Decisión | Razón |
|---|---|---|
| C1: commit de línea base; git solo en manos del orquestador | **Acepto** | Es la única forma de hacer diff y de revertir sobre 2100 líneas sin seguimiento |
| C2: cliente perezoso; no montar `CartPanel/montar` ni `GlobalStyles` | **Acepto y amplío** | También se deja de montar la **Lupa** en las páginas nuevas. `Lupa.tsx:3` importa `js/modules/supabase.js`, que trae `supabase-js` desde jsdelivr en tiempo de ejecución y lanza si falta `.env`. Eso contradice C2 y la medición 14 de 05. La búsqueda pasa a ser un campo en el catálogo (§3.7 y U3). El restilizado de la Lupa sigue diferido y las páginas viejas la conservan. |
| C3: efecto viejo literal; blur solo en escritorio si la traza lo aprueba | **Acepto sin el blur** | El efecto viejo no desenfoca. Quitar el blur en todas partes elimina la traza de rendimiento (costo) y un riesgo no probado. Queda como mejora diferida. |
| C4: fuera el aire de plantilla | **Acepto** | Con compuertas mecánicas: `rounded-card` fuera de la Tarjeta = 0, kickers ≤ 2 y cadenas de ruido = 0 (§4, U2) |
| C5: verdad de datos en la Tarjeta | **Acepto y lo concreto** | Presentación `foto`, `ilustrativa` o `tipografica` decidida por una función pura con vetos explícitos (§3.3). Rib Eye también se trata como no propia, porque su foto es un T-bone. |
| C6: sin correo | **Acepto** | Los dos dominios no tienen DNS |
| C7: lanzador con SVG propio y busto solo dentro | **Acepto** | Es el pedido literal de Eduardo |
| C8: portada | **Acepto** | Titular con token `text-portada`: 30 px a 360, 31 px a 390, 72 px a 1440. Sin kicker ni animación. |
| C9: `.env`, reinicio del contenedor e insignia | **Acepto** | Proxy de Vite solo si Eduardo prueba desde el teléfono |
| C10: panel v1 = carcasa | **Acepto** | Sin la barra inferior de 5 pestañas |
| C11: propuesta con prueba | **Acepto** | La prueba se arma concatenando archivos y va a `psql` dentro de una sola transacción (§5.4) |
| C12: un escritor a la vez, 4 corridas, revisión dual final con jueces en Opus | **Acepto con dos cambios** | (a) Se agrega una revisión fresca Sonnet por unidad: la regla global del usuario la exige antes de cada commit de código, y cuesta ~3 puntos cada una. (b) El juez B es `security-guardian` y no `jd-judge-b`. Es agente del repo, se descubre desde `pruebas`, trae `Bash` para revisar `dist/` y cubre la auditoría "security-guardian + Cyber Neo" que pide Eduardo sin sumar corridas. |
| Reparto de W2, W3 y W4 | **Corrijo** | La **Tarjeta pasa a W2**, porque la landing es su primera usuaria y C5 debe existir antes de pintar Ofertas. El **asistente pasa a W3** junto al catálogo, porque las dos son superficies de tienda. **W4 queda solo con el panel**: es la unidad sensible y su revisión se mantiene chica. |
| "Paquete Carnitas por Kilo" se muestra tal cual | **Acepto en parte** | Las secciones de la landing se arman con listas de ids elegidas: es selección editorial, no máscara. Por eso no aparece en la landing. En el catálogo sale tal cual lo trae la base y se reporta como deriva de datos al chat de backend. |
| Compuerta "Picaña = 0 en `src/`" | **Rechazo como está escrita** | La picaña está en el Catálogo 2024 del dueño (memoria `redes-y-catalogo`), y `src/data/seedProducts.ts` sirve a las páginas viejas. Las páginas nuevas usan la copia de la base (§1.6), así que la picaña solo aparecería si la base la tuviera. Lo prohibido es la frase "No tenemos picaña". |
| Respaldo del carrusel con los mismos cortes | **Amplío** | La semilla de las páginas nuevas es una copia exacta de los 53 productos activos de la base local, generada por el orquestador con un `SELECT` (U0). Resuelve el carrusel, la deriva de la semilla de 33 productos y la picaña a la vez. |
| Maps por fachada con iframe al tocar | **Simplifico** | Sin iframe: la dirección y "Cómo llegar" abren Google Maps en otra pestaña. Cero scripts de terceros. |
| Traza de LCP con CPU 4× y "Fast 4G" | **Acepto como "mejor esfuerzo"** | Solo se puede con `browser_run_code_unsafe` de Playwright y una sesión CDP. Si la herramienta no está, se mide sin estrangular y se marca [NO PROBADO con estrangulamiento]. |
| Fuentes ≤ 150 KB | **Acepto como meta** | Si se pasa, Fraunces baja a solo `wght`. El tope duro es 200 KB. |

---

## 1. Arquitectura

### 1.1 Principios

1. **Páginas nuevas, aisladas.** Tailwind entra solo por las tres entradas nuevas. Las páginas viejas siguen en SCSS 7-1 y no se tocan.
2. **Una sola fuente por dato.**
   - Precios y productos: la base, o su copia.
   - Horario, teléfono, WhatsApp, dirección y redes: `src/data/negocio.ts`.
   - Reseñas: `src/data/resenas.ts`.
   - Tokens: el `@theme`.
3. **Nada lanza al importarse.** Sin variables `VITE_*`, la página pinta con la semilla y lo dice la insignia.
4. **Toda superposición es una `Hoja`**, es decir, un `<dialog>` con `showModal()`. No se abre una `Hoja` desde otra.
5. **La tarjeta con borde es solo la Tarjeta de producto.** Lo demás va en filas con hairline.

### 1.2 Estructura de carpetas

```
$WT/
├── landing.html                 U1 (reescrita)     tienda: inicio
├── catalogo.html                U1 (nueva)         tienda: catálogo
├── panel.html                   U1 (nueva)         carcasa del panel
├── vite.config.js               U1                 +2 entradas: catalogo, panel
├── package.json, package-lock   U1                 +lucide-react, +@fontsource-variable/fraunces, +@fontsource-variable/geist
├── public/img/Videos/           U0                 portada-carne-360.mp4, portada-carne-720.mp4, portada-carne-poster.webp
├── public/img/mascota/          U0                 carnicero-ingresar-busto.webp, carnicero-ingresar-busto@2x.webp
└── src/
    ├── entry/landing.tsx, catalogo.tsx, panel.tsx                                       U1
    ├── styles/tailwind.css, fuentes.ts                                                   U1
    ├── data/supabase.ts, catalogo.ts, useCatalogo.ts, negocio.ts                         U1
    │        semillaCatalogo.json, semillaCategorias.json                                 U0
    │        resenas.ts (se conserva, solo lectura) · seedProducts.ts (solo páginas viejas)
    ├── ui/Hoja.tsx, iconos.tsx, Logotipo.tsx, Encabezado.tsx, MenuHoja.tsx,
    │      CarritoHoja.tsx, Pie.tsx, Carcasa.tsx, InsigniaDatos.tsx, __tests__/Hoja.test.tsx   U1
    │      Tarjeta.tsx, presentacionProducto.ts, CarruselCortes.tsx, useCarrusel.ts,
    │      __tests__/Tarjeta.test.tsx, __tests__/presentacionProducto.test.tsx              U2
    │      assetUrl.ts (se conserva)
    ├── landing/Landing.tsx, Portada.tsx, Mostrador.tsx, Populares.tsx, Ofertas.tsx,
    │           PreguntasFrecuentes.tsx, Familia.tsx, HorariosPuntaje.tsx, Contacto.tsx,
    │           Comentarios.tsx, datos.ts                                                   U2
    ├── catalogo/Catalogo.tsx, FiltroCategorias.tsx, buscar.ts, __tests__/buscar.test.tsx   U3 (U1 deja un esqueleto)
    ├── asistente/Asistente.tsx, guion.ts, __tests__/guion.test.tsx,
    │             __tests__/Asistente.test.tsx                                              U3 (U1 deja un esqueleto)
    └── panel/Panel.tsx, acceso.ts, useGuardiaAdmin.ts, NavPanel.tsx, InicioPanel.tsx,
              ConfirmarSalida.tsx, __tests__/acceso.test.tsx, __tests__/NavPanel.test.tsx   U4 (U1 deja un esqueleto)
```

**Qué se reutiliza sin editar:**
- `src/redux/store.ts` y `carritoSlice`;
- `src/hooks/usePedido.ts`;
- `src/lib/pedidoStorage.ts`, `lineaPedido.ts` y `formatearPrecio.ts`;
- `src/ui/assetUrl.ts`;
- `src/data/resenas.ts`.

**Qué no se toca:**
- `src/components/`, `src/pages/`;
- `src/entry/{home,products,auth,dashboard,admin-*,offline,shared}.tsx`;
- `js/`, `css/` y los HTML viejos.

**Qué borra W2** (solo dentro de `src/landing/`, porque sus sucesores los reemplazan y la línea base de C1 los conserva en git): `DatosRapidos.tsx`, `Destacado.tsx`, `MasPedidos.tsx`, `Opiniones.tsx`, `Nosotros.tsx`, `Horario.tsx`, `ContactoDirecto.tsx`, `BentoCategorias.tsx` y `useCatalogoVivo.ts`. Antes de borrar `Nosotros.tsx`, W2 reutiliza su texto.

### 1.3 Entradas y rutas

| Página | Entrada | Qué monta | Enlaza a |
|---|---|---|---|
| `landing.html` | `src/entry/landing.tsx` | `<StrictMode><Provider store><Carcasa pagina="inicio" sobrePortada><Landing/></Carcasa></Provider>` | `catalogo.html`, `catalogo.html#categoria=<slug>`, ficha vieja `products.html#/producto/<id>`, carrito viejo `products.html#/carrito`, `accessweb.html` |
| `catalogo.html` | `src/entry/catalogo.tsx` | `<Carcasa pagina="catalogo"><Catalogo/></Carcasa>`, con el mismo Provider | los mismos |
| `panel.html` | `src/entry/panel.tsx` | `<StrictMode><Panel/></StrictMode>`, sin Provider (no usa el carrito) | `admin-orders.html`, `admin-products.html`, `admin-customers.html`, `dashboar.html` (viejas) |

- Las tres entradas importan `@src/styles/fuentes` y `@src/styles/tailwind.css`, y montan sobre `<div id="raiz">`.
- El catálogo guarda su estado en el hash: `#categoria=<slug>` filtra y `#buscar` enfoca el campo de búsqueda. No hay router.
- **Costuras conocidas, que se anotan en la entrega:**
  - la ficha, el carrito completo y el acceso siguen siendo las páginas viejas;
  - el panel enlaza a las páginas de admin viejas.
- Las páginas nuevas no registran el service worker en v1, para que no se cacheen versiones intermedias.

### 1.4 Estado

| Estado | Dónde vive |
|---|---|
| Carrito | Se reutiliza tal cual: `store` de Redux + `localStorage['carni_cart_v1']` + evento `cart:updated`, leído con `usePedido({ leer: leerPedidoGuardado })`. **El abierto o cerrado de la Hoja del carrito no se toma de `usePedido`**: se usa un `useState` local para que el diálogo nunca se reabra solo al cargar. |
| Catálogo | Promesa memorizada en `catalogo.ts` (una sola consulta por documento) + hook `useCatalogo()` |
| Superposiciones de la tienda | `useState<'menu' \| 'carrito' \| null>` en `Carcasa`. El asistente tiene el suyo. Nunca hay dos abiertas a la vez. |
| Filtro del catálogo | El hash de la URL |
| Sesión | La guarda `supabase-js` en `localStorage` (clave `sb-<ref>-auth-token`). No se copia en ningún otro lado. |

### 1.5 Flujo de datos

```
landing.html / catalogo.html
  └─ entry → Provider(store) → Carcasa ─┬─ Encabezado ── [data-abre=menu|carrito] ──▶ MenuHoja / CarritoHoja (Hoja)
                                         ├─ Asistente (lanzador + sugerencia + Hoja inferior; guion local, sin red)
                                         └─ <main> Landing | Catalogo
                                               └─ useCatalogo() → cargarCatalogo() → obtenerSupabase()
                                                    ├─ cliente listo → PostgREST products + categories (llave anon; RLS: lectura pública)
                                                    └─ sin .env / error / > 2500 ms → CATALOGO_SEMILLA (copia de la base, 53)
Tarjeta "Agregar" → products.html#/producto/:id (ficha vieja) → agregarProducto → carni_cart_v1 + cart:updated → CarritoHoja
Pedido real: solo RPC create_order_with_items. El servidor recalcula precios (migración 202608210001). Fuera de v1.
panel.html → Panel → useGuardiaAdmin: obtenerSupabase → auth.getUser() → rpc('is_admin') → solo entonces NavPanel + Inicio
```

**Autoridad del precio:**
- El cliente muestra `price_per_kg` y `price_per_lb` tal como vienen de la base (o de su copia), con el aviso único "Precios de referencia; el peso final puede variar."
- El cliente nunca calcula un precio que vaya al servidor ni escribe `orders` u `order_items`.

### 1.6 Contratos de la capa de datos

```ts
// src/data/supabase.ts — el ÚNICO archivo nuevo que lee import.meta.env.VITE_*. Nunca lanza.
import type { SupabaseClient } from '@supabase/supabase-js';
export function hayConfiguracion(): boolean;                   // true si hay URL y llave anon (VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_KEY)
export function obtenerSupabase(): Promise<SupabaseClient | null>;
// Implementación obligatoria:
// - promesa memorizada en el módulo.
// - si falta URL o llave → null.
// - createClient desde import('@supabase/supabase-js') (paquete npm, nunca CDN), con
//   { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }.
// - try/catch → null.
```

```ts
// src/data/catalogo.ts
export interface ProductoVista {
  id: number; nombre: string; descripcion: string;
  precioKg: number;            // price_per_kg
  precioLb: number | null;     // price_per_lb, de la columna; nunca × 0.4536 en el cliente
  foto: string | null;         // image_url tal cual, p. ej. "/img/products/res.webp"; se resuelve con assetUrl()
  categoria: { slug: string; nombre: string };
  disponible: boolean;         // is_active && stock > 0. El número de stock NO sale de este módulo.
}
export interface CategoriaVista { slug: string; nombre: string; orden: number }
export type OrigenDatos = 'vivo' | 'semilla';
export interface Catalogo { origen: OrigenDatos; productos: ProductoVista[]; categorias: CategoriaVista[] }
export const TIEMPO_MAXIMO_MS = 2500;
export const CATALOGO_SEMILLA: Catalogo;             // armado desde semillaCatalogo.json + semillaCategorias.json
export function cargarCatalogo(): Promise<Catalogo>; // memorizada; NUNCA rechaza; carrera consulta vs TIEMPO_MAXIMO_MS
export function productoPorId(c: Catalogo, id: number): ProductoVista | undefined;
// Consultas (solo lectura, llave anon):
//   products:   select('id,name,description,price_per_kg,price_per_lb,image_url,stock,is_active,categories(slug,name)')
//               .eq('is_active', true).order('id')
//   categories: select('slug,name,order').order('order')
// Error, null o tiempo agotado → CATALOGO_SEMILLA. Respuesta vacía con éxito → catálogo vivo vacío (estado vacío, no semilla).
```

```ts
// src/data/useCatalogo.ts
export interface EstadoCatalogo extends Catalogo { estado: 'cargando' | 'listo' }
export function useCatalogo(): EstadoCatalogo;
// Primer render: { ...CATALOGO_SEMILLA, estado: 'cargando' }, así no hay salto de maquetación ni spinner.
// Luego: el resultado de cargarCatalogo().
```

```ts
// src/data/negocio.ts — solo cadenas reales; sin correo (C6).
export const NEGOCIO = {
  nombre: 'Carnicería El Señor de La Misericordia',
  lema: 'Siempre contando con la mejor calidad y frescura',   // lema del Catálogo 2024 del dueño
  telefono: '+52 444 271 5470',
  telefonoHref: 'tel:+524442715470',
  whatsappHref: 'https://wa.me/524442715470',
  direccion: ['Agua Marina 110, Manuel J. Othón', '78150 San Luis Potosí, S.L.P.'],
  mapaHref: /* se mueve literal la expresión MAPA_HREF de src/landing/datos.ts:318-320 */ '',
  facebook: 'https://www.facebook.com/profile.php?id=100054786668816',
  instagram: 'https://www.instagram.com/carniceria.misericordia/',
} as const;
export const HORARIO = { dias: 'Lunes a sábado', abre: '8:00', cierra: '17:00', cerrado: 'Domingos y festivos, cerrado' } as const;
export function whatsappConTexto(texto: string): string; // `${NEGOCIO.whatsappHref}?text=${encodeURIComponent(texto)}`, sin datos personales
```

**Forma de la semilla que genera U0.** `semillaCatalogo.json` es un arreglo de 53 objetos:

```
{ id, name, description, price_per_kg, price_per_lb, image_url, stock, is_active, category_slug, category_name }
```

`semillaCategorias.json` es un arreglo de 9 objetos `{ slug, name, order }`. `catalogo.ts` convierte las dos fuentes a `ProductoVista`.

### 1.7 Entorno sin `VITE_*`

| Situación | Tienda | Panel | Insignia (solo en desarrollo) |
|---|---|---|---|
| Sin `.env`, o variables vacías | pinta la semilla, sin errores de consola | muestra "Panel no disponible en este entorno" y no hace ninguna petición | `Datos: semilla · 53` |
| `.env` con `http://localhost:54321` y el stack local arriba | datos vivos | guardia real | `Datos: vivos · 53` |
| Stack local caído | semilla a los 2,5 s | la guardia falla → redirige al acceso | `Datos: semilla · 53` (en la entrega: "si dice semilla, corre `supabase start`") |
| Teléfono en la LAN | semilla: `localhost` apunta al propio teléfono | — | `Datos: semilla` (proxy de Vite solo si Eduardo lo pide) |

- `InsigniaDatos` se pinta solo con `import.meta.env.DEV`.
- Las pruebas de Jest **no importan** `supabase.ts`, `catalogo.ts`, `useCatalogo.ts`, `Carcasa.tsx` ni `useGuardiaAdmin.ts`: `import.meta` no pasa por la transformación Babel/CommonJS de `jest.config.js`. La lógica que se prueba vive en módulos puros (`presentacionProducto.ts`, `buscar.ts`, `guion.ts`, `acceso.ts`).

---

## 2. Tokens de diseño

### 2.1 Bloque único `@theme`

Va en `src/styles/tailwind.css`, lo escribe U1 y lo usan las tres entradas. Sustituye al del prototipo.

```css
@import "tailwindcss";

@theme {
  /* Color: contrato del export 1.1, con las correcciones de contraste de §2.2 */
  --color-bg: #0b0b0c;
  --color-surface-1: #151517;
  --color-surface-2: #1c1c1f;
  --color-surface-3: #232326;
  --color-border: #3f3f46;          /* SOLO hairlines decorativas (1,88:1). Nunca borde de un control. */
  --color-border-control: #71717a;  /* campos, chips, conmutadores: >= 3,24:1 en bg y en las tres superficies */
  --color-text: #f5f3ef;
  --color-text-muted: #a8a29b;
  --color-red: #dc2626;             /* SOLO relleno (botón principal). Texto blanco encima: 4,83:1 */
  --color-red-hover: #c81e1e;       /* texto blanco encima: 5,74:1 */
  --color-red-text: #f05252;        /* rojo como texto: >= 4,50:1 en bg y en las tres superficies */
  --color-sand: #e4d1b0;            /* anillo de foco, enlaces y detalles: 13,16:1 */
  --color-gold: #f59e0b;
  --color-success: #059669;
  --color-danger: #f43f5e;
  --color-veil: rgb(0 0 0 / 0.92);  /* encabezado con hover o con foco dentro */

  /* Tipografía autoalojada (Fontsource): los nombres de familia llevan "Variable" */
  --font-display: "Fraunces Variable", ui-serif, Georgia, serif;
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;

  /* Escala de 6 roles; se borran los tamaños por defecto para que nadie use text-sm/text-xl */
  --text-*: initial;
  --text-meta: 0.8125rem;   --text-meta--line-height: 1.125rem;       /* 13/18: etiquetas, notas */
  --text-ui: 0.9375rem;     --text-ui--line-height: 1.375rem;         /* 15/22: cuerpo e interfaz */
  --text-lead: 1.125rem;    --text-lead--line-height: 1.625rem;       /* 18/26: entradillas */
  --text-titulo: clamp(1.125rem, 1rem + 0.55vw, 1.5rem);              /* 18 → 24: tarjetas, h3 */
  --text-titulo--line-height: 1.2;
  --text-seccion: clamp(1.75rem, 1.25rem + 1.9vw, 3rem);              /* 28 → 48: h2 */
  --text-seccion--line-height: 1.08;
  --text-seccion--letter-spacing: -0.01em;
  --text-portada: clamp(1.75rem, 1rem + 3.9vw, 4.5rem);               /* 30 a 360 · 31 a 390 · 72 a 1440: h1 */
  --text-portada--line-height: 1.04;
  --text-portada--letter-spacing: -0.015em;

  /* Radios: candado documentado (S6 §4.4) */
  --radius-control: 0.75rem;   /* campos, chips, filas táctiles, miniaturas */
  --radius-card: 1rem;         /* Tarjeta de producto y bento */
  --radius-dialog: 1.25rem;    /* diálogos centrados */
  --radius-sheet: 1.5rem;      /* esquinas superiores de la hoja inferior; esquinas inferiores de la portada móvil */
  --radius-pill: 9999px;       /* SOLO botones */

  /* Movimiento (S4): nunca ease-in; interfaz por debajo de 300 ms */
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);   /* presión, encabezado, puntos del carrusel */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);        /* hojas y cajones */
}

@custom-variant reduced-transparency (@media (prefers-reduced-transparency: reduce));

@layer base {
  html { scrollbar-gutter: stable; -webkit-text-size-adjust: 100%; }
  html:has(dialog:modal) { overflow: hidden; }          /* bloquea el scroll bajo cualquier Hoja */
  body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans);
         font-size: var(--text-ui); line-height: var(--text-ui--line-height); }
  h1, h2, h3 { font-family: var(--font-display); font-weight: 500; text-wrap: balance; margin: 0; }
  :focus-visible { outline: 2px solid var(--color-sand); outline-offset: 2px; }   /* visible también sobre el rojo */
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    [data-giro] { animation: none !important; }
  }
}
/* Se conservan tal cual los @keyframes carni-izq y carni-der del prototipo (giro de las reseñas). */
```

**Duraciones** (clases `duration-*` de Tailwind v4, que aceptan cualquier entero):

| Uso | Duración |
|---|---|
| Presión | 150 ms |
| Encabezado | 240 ms |
| Sugerencia y puntos del carrusel | 200 ms |
| Hojas | 300 ms |
| Con `prefers-reduced-motion` | 150 ms o menos, sin desplazamiento (solo opacidad) |

### 2.2 Contraste medido

Fórmula WCAG 2, calculada en esta fase.

| Par | bg | surface-1 | surface-2 | surface-3 | Uso permitido |
|---|---|---|---|---|---|
| text `#F5F3EF` | 17,75 | 16,46 | 15,34 | 14,14 | todo |
| text-muted `#A8A29B` | 7,78 | 7,21 | 6,72 | 6,20 | todo |
| sand `#E4D1B0` | 13,16 | 12,20 | 11,37 | 10,48 | enlaces, foco, detalles |
| red `#DC2626` como texto | **4,07** | **3,78** | 3,52 | 3,25 | **prohibido como texto** |
| red-text `#F05252` | 5,65 | 5,24 | 4,88 | 4,50 | texto rojo (errores, "Agotado") |
| border `#3F3F46` | **1,88** | 1,75 | 1,63 | 1,50 | solo hairlines decorativas |
| border-control `#71717A` | 4,07 | 3,77 | 3,52 | 3,24 | bordes de controles (≥ 3:1, WCAG 1.4.11) |
| blanco sobre red / red-hover | 4,83 / 5,74 | | | | texto de botón |

**Reglas:**
- Los enlaces van en `text` con subrayado, o en `sand`. Nunca en `red`.
- El foco es un contorno `sand` de 2 px con 2 px de separación.
- **Contraste sobre el video:** lo mide el orquestador en U6 (§6.2, punto 2). Si falla, el velo superior del encabezado sube de `black/55` a `black/65` y el de la portada, de `black/75` a `black/82`.

### 2.3 Reglas de uso (verificables con `rg`)

- **Tamaños de texto:** solo `text-meta`, `text-ui`, `text-lead`, `text-titulo`, `text-seccion` y `text-portada`. Cero `text-[..px]`, `text-sm`, `text-xl` y similares.
- **Pesos:**
  - Geist: 400, 500 y 600;
  - Fraunces: 500 en titulares y 400 en la cita de Familia;
  - cero pesos fraccionarios (`font-[440]`).
- **Radios:** solo `rounded-control`, `-card`, `-dialog`, `-sheet`, `-pill` y `-full` (círculos). Cero `rounded-(sm|md|lg|xl|2xl|3xl)`.
- **Sin** `backdrop-blur`, sin sombras (salvo la hairline `shadow-[0_1px_0_rgb(255_255_255/0.08)]` del encabezado sólido) y sin degradados, salvo los dos velos.
- **Mayúsculas:**
  - `uppercase` como máximo 2 veces en `src/landing/` y 0 en `src/ui/`, `src/catalogo/`, `src/asistente/` y `src/panel/`;
  - el logotipo escribe "CARNICERÍA" ya en mayúsculas en el texto, sin la clase.
- **Un botón rojo por pantalla visible.** Cada intención tiene una sola etiqueta en todo el sitio (S6 §4.5):
  - "Ver productos" (ir al catálogo);
  - "Escribir por WhatsApp";
  - "Agregar";
  - "Cómo llegar".

### 2.4 Fuentes autoalojadas

- Se instalan **dentro de Docker**, en U1: `@fontsource-variable/fraunces` y `@fontsource-variable/geist` (licencia OFL). Vite empaqueta los `woff2` y el navegador solo baja el subconjunto latino, por su `unicode-range`.
- `src/styles/fuentes.ts`:
  ```ts
  import '@fontsource-variable/geist';              // familia "Geist Variable", eje wght
  import '@fontsource-variable/fraunces/opsz.css';  // familia "Fraunces Variable", eje opsz
  ```
  El escritor comprueba el contenido real del paquete:
  ```bash
  docker exec carni-landing-dev sh -c 'ls node_modules/@fontsource-variable/fraunces/*.css'
  ```
  - Si `opsz.css` no trae el rango de `font-weight`, usa `full.css`, siempre que la medición de §6.2 (punto 14) quede ≤ 150 KB.
  - Si no, usa `index.css` (solo `wght`) y lo anota en `desviaciones`.
- `font-optical-sizing: auto` (valor por defecto) hace que el eje `opsz` siga al tamaño.
- Se quitan de `landing.html` los `<link>` a Google Fonts.

---

## 3. Primitivas compartidas (contratos exactos)

### 3.1 `Hoja`

Archivo `src/ui/Hoja.tsx`, de U1. Base: receta de `04` §8.

```ts
export type LadoHoja = 'derecha' | 'izquierda' | 'inferior' | 'centro';
export interface HojaProps {
  abierta: boolean;
  alCerrar: () => void;          // se llama UNA vez por cierre, venga de X, Escape, clic en el fondo o abierta=false
  titulo: string;                // <h2 id tabIndex={-1}> visible; el dialog lleva aria-labelledby
  etiquetaCerrar: string;        // aria-label de la X, específico: "Cerrar el pedido", nunca "Cerrar"
  nombre: string;                // data-superposicion="<nombre>" en el <dialog> (lo usan las mediciones)
  lado?: LadoHoja;               // por defecto 'derecha'
  descripcion?: string;          // subtítulo; aria-describedby
  inicioEncabezado?: ReactNode;  // p. ej. el avatar del asistente, a la izquierda del título
  pie?: ReactNode;               // acciones fijas abajo
  children: ReactNode;
}
```

**Comportamiento obligatorio (las 7 reglas):**
1. `<dialog>` nativo. Un efecto hace:
   ```ts
   if (abierta && !d.open) d.showModal();
   if (!abierta && d.open) d.close();
   ```
   La guarda del `if` hace falta por `StrictMode`.
2. `onClose={alCerrar}`, así las tres vías de cierre terminan en el mismo sitio.
3. Clic en el fondo: se guarda el destino de `pointerdown`. En `click`, se cierra solo si `e.target === e.currentTarget` y el `pointerdown` también cayó en el propio `<dialog>`. Así, seleccionar texto dentro y soltar fuera no cierra.
4. **X visible siempre:**
   - `<button type="button" data-cerrar aria-label={etiquetaCerrar}>`, de `size-11` (44×44), arriba a la derecha;
   - lleva `IconoCerrar` de 20 px;
   - llama `ref.current.close()`.
5. **Foco:**
   - el `<h2 tabIndex={-1}>` es el primer enfocable del DOM y recibe el foco inicial;
   - al cerrar, el navegador devuelve el foco al disparador.
6. **Scroll bloqueado** con `html:has(dialog:modal)` (§2.1).
7. **Fondo inerte** (lo da `showModal`). **Movimiento reducido:** 150 ms o menos, solo opacidad.

**Clases por lado** (transición `transition-[translate,scale,opacity,display,overlay] transition-discrete duration-300 ease-drawer motion-reduce:duration-150 motion-reduce:translate-none motion-reduce:scale-100`, `::backdrop` negro al 60 % sin desenfoque):

| Lado | Caja | Entrada |
|---|---|---|
| `derecha` | `m-0 ml-auto h-dvh max-h-none w-[min(92vw,420px)] max-w-none bg-surface-1 p-0 text-text` | desde `translate-x-full` |
| `izquierda` | `m-0 mr-auto h-dvh max-h-none w-[min(86vw,360px)] max-w-none bg-surface-1 p-0 text-text` | desde `-translate-x-full` |
| `inferior` | móvil `m-0 mt-auto h-[min(80dvh,640px)] w-full max-w-none rounded-t-sheet`; desde `lg:` flotante `lg:bottom-24 lg:right-6 lg:h-[560px] lg:w-[380px] lg:rounded-dialog lg:origin-bottom-right` | móvil desde `translate-y-full`; escritorio de `scale-95` a 1 |
| `centro` | `m-auto w-[min(92vw,480px)] max-h-[85dvh] rounded-dialog bg-surface-1 p-0 text-text` | de `scale-95` y opacidad 0 a 1 |

**Reglas de uso:**
- Nunca abrir una `Hoja` desde dentro de otra.
- Si una acción dentro de una `Hoja` debe abrir otra superposición, primero cierra la actual.
- Los disparadores llevan `data-abre="<nombre>"`, `aria-haspopup="dialog"`, `aria-expanded` y `aria-controls`.

**Pruebas** (`src/ui/__tests__/Hoja.test.tsx`, como mínimo 5 casos):
- el título y la etiqueta de la X se pintan;
- la X llama a `alCerrar`;
- el clic en el fondo (`pointerdown` + `click` sobre el `<dialog>`) cierra;
- el clic dentro no cierra;
- `abierta=false` cierra.

Si jsdom no trae `HTMLDialogElement.prototype.showModal`, la prueba define un polyfill mínimo en el propio archivo (`setAttribute('open','')`, y en `close()` quita el atributo y despacha `close`).

### 3.2 `Encabezado` y `Logotipo`

Archivos `src/ui/Encabezado.tsx` y `src/ui/Logotipo.tsx`, de U1. **El efecto viejo, literal**, tomado de `css/layout/_header.scss:65-98` y `:147-165`.

```ts
export interface EncabezadoProps {
  sobrePortada: boolean;   // true solo en la landing
  cuenta: number;          // líneas del carrito
  menuAbierto: boolean;
  carritoAbierto: boolean;
  alAbrirMenu: () => void;
  alAbrirCarrito: () => void;
  hrefBuscar: string;      // 'catalogo.html#buscar' en la landing; '#buscar' en el catálogo
}
```

**Máquina de estados:** el atributo `data-estado` vale `sobre-video` o `solido`.

| Estado | Cuándo | Fondo | Velo `::before` o capa `aria-hidden` |
|---|---|---|---|
| `sobre-video` | `sobrePortada` y `#fin-portada` todavía por debajo del encabezado | `transparent` | degradado `from-black/55 via-black/28 via-55% to-transparent`, opacidad 1 |
| `sobre-video` + hover real (el `hover:` de Tailwind v4 ya exige `(hover: hover)`) o `:focus-within` | puntero fino encima, o foco de teclado dentro | `bg-veil` (`rgba(0,0,0,.92)`) | opacidad 0 |
| `solido` | pasó `#fin-portada`, o la página no tiene portada | `bg-bg` + `shadow-[0_1px_0_rgb(255_255_255/0.08)]` | opacidad 0 |

**Detección del paso de la portada:**
- `IntersectionObserver` sobre `#fin-portada`, un centinela de 1 px que pone `Portada` (U2) al final de la portada.
- `rootMargin: '-56px 0px 0px 0px'`, y `-72px` desde `lg`, medido con `matchMedia`.
- **Respaldo** mientras no exista el centinela (entre U1 y U2) o sin `IntersectionObserver`: `sobre-video` con `scrollY < 8` y `solido` a partir de ahí. Scroll pasivo con `requestAnimationFrame`.

**Transición:**
- `transition-[background-color,box-shadow] duration-240 ease-out-strong` y `motion-reduce:transition-none`;
- el velo usa `transition-opacity duration-240`.

**En táctil no hay hover.** El efecto lo dan el paso a sólido y el `focus-within`. Se le explica a Eduardo en la entrega.

**Medidas:**
- `fixed inset-x-0 top-0 z-40`;
- alto `h-14` (56 px) y `lg:h-[72px]`, más `pt-[env(safe-area-inset-top)]`;
- relleno lateral 6 px en móvil y 24 px desde `lg`.

**Contenido, de izquierda a derecha:**
1. Menú: `data-abre="menu"`, `aria-label="Abrir el menú"`, botón de 44×44.
2. Logotipo centrado: enlace a `landing.html` con `aria-label="Carnicería El Señor de La Misericordia, ir al inicio"`.
3. Buscar: enlace de 44×44 a `hrefBuscar`, con `aria-label="Buscar en el catálogo"`.
4. Carrito: `data-abre="carrito"`, `aria-label="Abrir el pedido, <n> productos"`, con insignia de cuenta. La insignia hace un "pop" de `scale 1 → 1.15 → 1` en 220 ms al cambiar la cuenta, y no lo hace con movimiento reducido.

**`Logotipo`:**
```ts
export function Logotipo(props: { tamano: 'encabezado' | 'pie' }): JSX.Element
```
- "CARNICERÍA" en `font-sans`, peso 600, `tracking-[0.22em]`, `text-ui`, escrito en mayúsculas en el texto.
- Debajo, "EL SEÑOR DE LA MISERICORDIA" en `text-meta`, `tracking-[0.16em]`, entre dos líneas de 1 px `bg-border`.
- En `tamano="encabezado"` y por debajo de 360 px, el subtítulo se oculta (`max-[359px]:hidden`).
- Cero imágenes.

### 3.3 `Tarjeta` y presentación del producto

Archivos `src/ui/Tarjeta.tsx` y `src/ui/presentacionProducto.ts`, de U2.

```ts
// src/ui/presentacionProducto.ts — módulo puro, sin imports de runtime (se prueba en Jest)
export type Presentacion = 'foto' | 'ilustrativa' | 'tipografica';
export const FOTOS_DE_CATEGORIA: ReadonlySet<string>; // res, pollo, cerdo, preparadas, embutidos, merch, otrosproductos, frutasverduras, premium (.webp)
export const FOTOS_VETADAS: ReadonlySet<string>;      // pollo.webp (marca de agua), premium.webp (marca de agua por revisar),
                                                       // merch.webp y otrosproductos.webp (aspecto de IA), frutasverduras.webp
                                                       // (categoría inexistente), rib-eye.webp (en realidad es un T-bone)
export function elegirPresentacion(lista: ReadonlyArray<{ id: number; foto: string | null }>): Map<number, Presentacion>;
//   nombre de archivo de foto (basename) null o en FOTOS_VETADAS             → 'tipografica'
//   basename en FOTOS_DE_CATEGORIA: si se repite > 2 veces en `lista`        → 'tipografica'; si no → 'ilustrativa'
//   cualquier otra (foto propia)                                             → 'foto'
export type Unidad = 'kg' | 'paquete';
export function unidadDe(nombre: string): Unidad;     // /^Paquete /.test(nombre) && !/por kilo/i.test(nombre) ? 'paquete' : 'kg'
```

```ts
// src/ui/Tarjeta.tsx
export type VarianteTarjeta = 'normal' | 'oferta' | 'chica';
export interface TarjetaProps {
  producto: ProductoVista;
  presentacion: Presentacion;   // la calcula quien pinta la lista, con elegirPresentacion(sobre la lista visible)
  variante?: VarianteTarjeta;   // por defecto 'normal'; "agotado" se deriva de !producto.disponible
  enlace?: string;              // por defecto `products.html#/producto/${producto.id}` (ficha vieja)
  prioridad?: boolean;          // true en la primera fila: loading="eager", fetchPriority="high"
}
```

**Maquetación de las variantes `normal` y `oferta`:**
- `<article data-tarjeta data-producto-id={id} data-presentacion={p}>` con `rounded-card border border-border bg-surface-1`.
- **Cabeza de la tarjeta:**
  - `foto` e `ilustrativa`: imagen `aspect-[4/5]` con `object-cover`, `width` y `height` explícitos y `decoding="async"`.
  - `ilustrativa`: además, rótulo "Foto ilustrativa" en `text-meta` sobre `bg-surface-2/90 rounded-control`, abajo a la izquierda.
  - `tipografica`: bloque `aspect-[4/5] bg-surface-2` con el ícono de la categoría de 48 px en `text-sand`, centrado, sin imagen.
- **Cuerpo:**
  - categoría en `text-meta text-sand`, sin mayúsculas;
  - nombre en `font-display text-titulo`;
  - precio en `text-ui font-semibold tabular-nums` con el atributo `data-precio-kg={precioKg}` (se valida contra la base);
  - `/ kg` o `/ paquete` en `text-text-muted`;
  - segunda línea `$<precioLb> / lb`, solo si `unidad === 'kg'` y hay `precioLb`.
- **Acción:** "Agregar", `<a>` de alto `h-11` a todo el ancho, `rounded-pill bg-red text-white hover:bg-red-hover`, con `active:scale-[0.97]` en 150 ms.
- **Agotado:**
  - botón deshabilitado "Agotado" en `text-red-text` sobre `bg-surface-2`;
  - imagen con `saturate(0.6)`.
- **`oferta`:** insignia "Oferta" en `bg-gold text-bg text-meta`, arriba a la derecha.
- **Hover** (solo con puntero que lo tenga): `-translate-y-0.5` y borde `red/30`, en 150 ms.
- **Nunca:** número de existencias, "20 en stock" ni "Pocas piezas".

**Variante `chica`** (asistente y listas compactas):
- una fila `rounded-card border` con miniatura de 48 px `rounded-control` (o ícono si es `tipografica`);
- nombre y precio;
- botón "+" de 44×44 con `aria-label="Agregar <nombre>"`.

**Pruebas:**
- `__tests__/presentacionProducto.test.tsx`, como mínimo 6 casos:
  - Ofertas [40, 41, 42] → [foto, tipografica, tipografica];
  - Populares [14, 12, 1, 3] → [foto, foto, ilustrativa, ilustrativa];
  - 8 productos de pollo → todos `tipografica`;
  - Rib Eye (8) → `tipografica`;
  - `foto` null → `tipografica`;
  - `unidadDe` de los 3 nombres de paquete y de "Paquete Carnitas por Kilo".
- `__tests__/Tarjeta.test.tsx`, como mínimo 4 casos:
  - `ilustrativa` pinta el rótulo;
  - `tipografica` no pinta `<img>`;
  - agotado pinta el botón deshabilitado;
  - ningún texto coincide con `/stock|existencia/i`.

### 3.4 Íconos

Archivo `src/ui/iconos.tsx`, de U1: **la única puerta de íconos**.

- Se conservan **todas** las exportaciones actuales, porque las usan las secciones del prototipo hasta U2. Entre ellas están los glifos de marca Facebook, Instagram y WhatsApp, que Lucide no tiene.
- Se agregan envolturas de Lucide con `strokeWidth={1.8}`, `aria-hidden`, `focusable="false"` y 24 px por defecto:

  ```
  IconoMenu (Menu), IconoBuscar (Search), IconoPedido (ShoppingBag), IconoCerrar (X),
  IconoAnterior (ChevronLeft), IconoSiguiente (ChevronRight), IconoAbajo (ChevronDown),
  IconoUbicacion (MapPin), IconoReloj (Clock), IconoTelefono (Phone), IconoPausa (Pause),
  IconoReproducir (Play), IconoSalir (LogOut), IconoInicio (House), IconoPedidos (ClipboardList),
  IconoClientes (Users), IconoAnuncios (Megaphone), IconoAjustes (Settings), IconoMensajes (MessageCircle),
  IconoRes (Beef), IconoPollo (Drumstick), IconoCerdo (Ham), IconoPreparadas (HandPlatter),
  IconoEmbutidos (UtensilsCrossed), IconoOfertas (Package), IconoMerch (Shirt), IconoOtros (Tag)
  ```

  Si un nombre no existe en la versión instalada, se usa el más cercano del mismo set y se anota.
- Dos SVG propios, con los trazos exactos de `04` §6.4:
  - `IconoCuchilla`: cuchilla diagonal, legible desde 24 px.
  - `IconoAsistenteCarnicero`: burbuja con la cuchilla dentro. **Solo desde 28 px**. Es el glifo del lanzador.
- Mapa de categoría a ícono:
  ```ts
  export const ICONO_POR_CATEGORIA: Record<string, (p: { className?: string; tamano?: number }) => JSX.Element>
  ```
  | Categoría | Ícono |
  |---|---|
  | carnes-rojas | Res |
  | cortes-especiales | Cuchilla |
  | pollo | Pollo |
  | cerdo | Cerdo |
  | preparadas | Preparadas |
  | embutidos | Embutidos |
  | ofertas | Ofertas |
  | merch | Merch |
  | otros | Otros |
- Importaciones con nombre desde `lucide-react`. Si el servidor de desarrollo se vuelve lento, se pasa a rutas profundas (`lucide-react/dist/esm/icons/<nombre>`).

### 3.5 `CarruselCortes`

Archivos `src/ui/CarruselCortes.tsx` y `src/ui/useCarrusel.ts`, de U2.

```ts
export interface CarruselCortesProps { cortes: ProductoVista[]; titulo: string }   // titulo = h2 estático de la sección
export function useCarrusel(pista: RefObject<HTMLDivElement>): {
  activo: number; inicio: boolean; fin: boolean; mover: (dir: 1 | -1) => void; ir: (i: number) => void;
};
```

- **Cortes:** 7, en este orden de ids: **10 Filete Mignon, 7 Tomahawk, 11 New York Strip, 9 Porterhouse, 13 Arrachera, 14 Flank Steak, 12 Top Sirloin**. Rib Eye (8) queda fuera porque su foto es un T-bone. Los 7 tienen foto propia.
- **El hook** es la receta de `04` §4.1, literal:
  - paso medido entre el hijo 0 y el hijo 1;
  - `scroll` pasivo con `requestAnimationFrame`;
  - **`ResizeObserver` sobre la pista (imprescindible)**;
  - `behavior: 'auto'` con movimiento reducido.
- **Pista:**
  - `flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain` con la barra oculta y `tabIndex=0`;
  - `role="group"` con `aria-label="Cortes especiales. Desliza o usa las flechas."`;
  - teclas ←, →, Inicio y Fin.
- **Diapositivas:**
  - `role="group" aria-roledescription="slide" aria-label="<i> de 7"`;
  - ancho `w-[86%]` en móvil y `lg:w-[62%]`;
  - `<img>` de la foto `rounded-card`;
  - las 2 primeras sin `loading="lazy"`.
  - **No son Tarjetas:** en el diseño, la diapositiva del carrusel es una galería.
- **Detalle que sigue a la diapositiva activa** (móvil debajo; escritorio a la derecha, `lg:grid-cols-[1.6fr_1fr]`):
  - `<h3>` con el nombre;
  - la descripción de la base, recortada a 3 líneas, que se omite si viene vacía;
  - el precio por kg (`data-precio-kg`) y por lb;
  - un botón rojo "Agregar" que lleva a la ficha.
- **Controles:** una sola fila en todos los anchos: flecha, píldora de puntos, flecha.
  - Las flechas miden 44×44 y usan `aria-disabled`, no `disabled`.
  - Los puntos son botones de 24×44 con `aria-current` y `aria-disabled` en el activo. El punto se alarga de 6 a 24 px en 200 ms.
  - `<p role="status" class="sr-only">Corte {n} de 7: {nombre}</p>`.
- **Respaldo:** si un id no está en el catálogo, se omite esa diapositiva. Con la semilla (§1.6) están los 7.

### 3.6 `Asistente`

Archivos `src/asistente/Asistente.tsx` y `src/asistente/guion.ts`, de U3. U1 deja un esqueleto que devuelve `null`.

```ts
export function Asistente(props: { pagina: 'inicio' | 'catalogo' }): JSX.Element | null;
```

```ts
// guion.ts — módulo puro. CERO dígitos en sus cadenas: el horario se arma aparte desde HORARIO.
export type Intencion = 'asar' | 'guisar' | 'porciones' | 'horario';
export interface Accion { etiqueta: string; href: string }
export interface Respuesta { texto: string; acciones: Accion[]; mostrarPaquetes?: boolean; siguientes: Intencion[] }
export interface MotorAsistente { responder(intencion: Intencion): Promise<Respuesta> }  // el backend futuro implementa la MISMA firma
export const ETIQUETAS: Record<Intencion, string>;   // 'Para asar' · 'Para guisar' · '¿Cuánto por persona?' · 'Horario'
export const SALUDO = '¿Te ayudo a elegir tu corte? Elige una opción y te digo qué suele llevarse la gente.';
export const GUION_ESTATICO: Record<Exclude<Intencion, 'horario'>, Respuesta>;
export function respuestaHorario(h: typeof HORARIO): Respuesta;
export const asistenteGuionado: MotorAsistente;
export const TEXTO_WHATSAPP = 'Hola, quiero ayuda para elegir un corte.';
```

**Textos fijos del guion** (no se cambian sin aprobación de Eduardo):

| Intención | Texto | Acciones | Siguientes |
|---|---|---|---|
| `asar` | "Para asar, la gente suele elegir cortes especiales como arrachera, new york, tomahawk o filete mignon. Lo que hay hoy lo ves en el catálogo." | "Ver cortes especiales" → `catalogo.html#categoria=cortes-especiales` | porciones, horario |
| `guisar` | "Para guisar suelen elegirse carnes rojas como el bistec de res o el diezmillo. Revisa en el catálogo lo que hay hoy." | "Ver carnes rojas" → `catalogo.html#categoria=carnes-rojas` | asar, horario |
| `porciones` | "Para reuniones hay paquetes pensados por número de personas. Todo paquete pide la mitad de anticipo, y el peso final puede variar." `mostrarPaquetes: true`: se pintan como `Tarjeta chica` los ids 41 y 42 del catálogo. Las cifras de personas salen de la base, no del guion. | "Ver ofertas" → `catalogo.html#categoria=ofertas` | asar, horario |
| `horario` | `${dias}, de ${abre} a ${cierra}. ${cerrado}.` (desde `HORARIO`) | "Cómo llegar" → `NEGOCIO.mapaHref` | asar, guisar |

**Piezas:**
- **Lanzador:**
  - botón circular `bg-sand text-bg ring-1 ring-black/20` con `IconoAsistenteCarnicero` de 28 px;
  - **56 px en `inicio` y 48 px en `catalogo`**;
  - `fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6 z-30`;
  - `data-abre="asistente"`, `aria-haspopup="dialog"`, `aria-label="Abrir el asistente de la carnicería"`, `active:scale-[0.97]`.
  - En `catalogo` se oculta al bajar y reaparece al subir o al llegar al final, con `translate-y` y opacidad en 200 ms.
- **Sugerencia** "¿Te ayudo a elegir tu corte?":
  - globo `bg-text text-bg rounded-card` encima del lanzador, de ancho máximo 240 px, con su X (`aria-label="Cerrar la sugerencia"`, zona de 44×44);
  - aparece a los 6 s y solo una vez por sesión: `sessionStorage['carni:asistente:sugerencia']`, con lectura y escritura en `try/catch`;
  - se oculta sola a los 10 s;
  - nunca aparece si hay un `dialog[open]`;
  - no lleva `aria-live`;
  - tocar el texto abre el asistente.
- **Panel:**
  - `Hoja` con `lado="inferior"`, `nombre="asistente"`, `titulo="Asistente de la carnicería"`, `descripcion="Respuestas guiadas, no es una persona"` y `etiquetaCerrar="Cerrar el asistente"`;
  - `inicioEncabezado`: el busto `carnicero-ingresar-busto.webp` (y `@2x` en `srcSet`) en un círculo de 40 px, con `alt=""`.
- **Conversación:**
  - `role="log" aria-live="polite" aria-relevant="additions"`;
  - arranca con `SALUDO` y los 4 chips (botones de 44 px de alto, `rounded-control border border-border-control`);
  - cada respuesta llega a los 450 ms (0 con movimiento reducido), con un fundido de 150 ms, y trae sus acciones y los chips de seguimiento;
  - **mientras hay una respuesta pendiente, los chips no responden**;
  - el registro se corta en 20 mensajes.
- **Pie de la Hoja:**
  - "Escribir por WhatsApp", botón rojo a `whatsappConTexto(TEXTO_WHATSAPP)` con `target="_blank" rel="noopener noreferrer"`;
  - la línea "Para otra pregunta, escríbenos por WhatsApp.".
- **Sin campo de texto. Sin red.** No escribe en `chat_messages` ni llama a ningún LLM.

**Pruebas:**
- `__tests__/guion.test.tsx`:
  - `JSON.stringify(GUION_ESTATICO) + SALUDO + TEXTO_WHATSAPP` no coincide con `/\d/`;
  - cada intención tiene al menos una acción;
  - nada coincide con `/\$|precio|stock|existencia/i`.
- `__tests__/Asistente.test.tsx`, que no importa `useCatalogo`: se inyecta la lista de paquetes por prop o se aísla en un hijo.
  - el lanzador abre el diálogo;
  - un chip produce su texto;
  - la X cierra;
  - no hay `input` ni `textarea`.

### 3.7 `Carcasa`, `MenuHoja`, `CarritoHoja`, `Pie` e `InsigniaDatos`

Todos son de U1.

**`Carcasa`:**
```ts
export function Carcasa(props: { pagina: 'inicio' | 'catalogo'; sobrePortada?: boolean; children: ReactNode }): JSX.Element
```
Pinta, en este orden:
1. enlace "Saltar al contenido" (visible al enfocarlo);
2. `Encabezado`;
3. `<main id="contenido" tabIndex={-1}>`, con `pt-14 lg:pt-[72px]` cuando no hay portada;
4. `Pie`;
5. `MenuHoja`;
6. `CarritoHoja`;
7. `<Asistente pagina={pagina}/>`;
8. `InsigniaDatos`, solo en desarrollo.

La cuenta del carrito sale de `useSelector((e) => e.carrito.length)`.

**`MenuHoja`:** `Hoja` con `lado="izquierda"`, `nombre="menu"`, `titulo="Menú"` y `etiquetaCerrar="Cerrar el menú"`.
- Contiene filas con hairline (`divide-y divide-border`), cada una de 48 px de alto con chevron. Tres grupos:
  - **Tienda:** Inicio, Productos (`catalogo.html`), Ofertas.
  - **Categorías:** chips `rounded-control` a `catalogo.html#categoria=<slug>`, solo las categorías con al menos 1 producto, según `useCatalogo`.
  - **Ayuda:** Preguntas frecuentes (`landing.html#preguntas`), Contacto (`landing.html#contacto`), "Escribir por WhatsApp" y "Ingresar" (`accessweb.html`).
- **Sin buscador dentro**, para no abrir superposiciones anidadas.
- Un enlace a la misma página cierra la Hoja antes de navegar.
- El ítem activo lleva `bg-red/12` y `font-semibold`, **sin raya lateral**.

**`CarritoHoja`:** `Hoja` con `lado="derecha"`, `nombre="carrito"`, `titulo="Tu pedido"` y `etiquetaCerrar="Cerrar el pedido"`.
- Lee líneas y total con `usePedido({ leer: leerPedidoGuardado })`.
- Por cada línea: nombre, cantidad (mismo formato que `CartPanel.tsx`, con los helpers de `src/lib/`), subtotal y "Quitar" de 44×44 con `aria-label="Quitar <nombre>"`.
- Pie: "Total aproximado" con `formatearPrecio(total, 'ticket')`, la nota "El peso final puede variar; el total se confirma al preparar tu pedido." y el botón rojo "Continuar con el pedido" a `products.html#/carrito` (costura).
- Estado vacío: "Tu pedido está vacío." y el botón "Ver productos".

**`Pie`:**
- Filas y columnas sin cajas:
  - `Logotipo tamano="pie"` y `NEGOCIO.lema`;
  - Tienda: Productos, Ofertas, Preguntas frecuentes;
  - Contacto: teléfono, "Escribir por WhatsApp", dirección y "Cómo llegar";
  - Redes: Facebook e Instagram, como enlaces de texto con ícono, `target="_blank" rel="noopener noreferrer"`;
  - "© 2026 Carnicería El Señor de La Misericordia".
- **Sin correo.**

**`InsigniaDatos`:** solo con `import.meta.env.DEV`.
- `fixed left-3 bottom-3 z-30 text-meta rounded-control bg-surface-2 px-2 py-1`, del lado opuesto al lanzador;
- `role="status"`;
- texto `Datos: vivos · <n>` o `Datos: semilla · <n>`.

### 3.8 Panel

Archivos en `src/panel/`, de U4.

```ts
// acceso.ts — puro, se prueba en Jest
export type Acceso = 'sin-configuracion' | 'sin-sesion' | 'no-admin' | 'admin';
export function decidirAcceso(e: { hayCliente: boolean; usuario: { id: string } | null; esAdmin: boolean | null }): Acceso;
export const DESTINO: Record<Exclude<Acceso, 'admin' | 'sin-configuracion'>, string>;   // sin-sesion → 'accessweb.html?admin=true'; no-admin → 'landing.html'
```

```ts
// useGuardiaAdmin.ts
export type EstadoGuardia =
  | { fase: 'verificando' }
  | { fase: 'sin-configuracion' }
  | { fase: 'admin'; correo: string | null; cliente: SupabaseClient };
export function useGuardiaAdmin(): EstadoGuardia;
// 1) obtenerSupabase() → null ⇒ 'sin-configuracion'
// 2) auth.getUser()  (valida el JWT con el servidor; NUNCA getSession para decidir)
// 3) rpc('is_admin')
// 4) decidirAcceso → 'sin-sesion' | 'no-admin' ⇒ location.replace(DESTINO[...]) y la fase se queda en 'verificando'
// Antes de 'admin' no se pinta NADA del panel: solo <p role="status">Verificando acceso…</p> centrado.
```

**`Panel`:**
- Según la fase, pinta:
  - `verificando`: el estado anterior;
  - `sin-configuracion`: "Panel no disponible en este entorno." con enlace a la tienda;
  - `admin`: `NavPanel` + `InicioPanel`.
- Registra `pageshow`: si `e.persisted`, llama `location.reload()`. Así, "Atrás" desde la caché de retroceso vuelve a pasar por la guardia.

**`NavPanel`:**
```ts
{ activo: 'inicio'; correo: string | null; alPedirSalida: () => void }
```
- **Escritorio (`lg:`):** `aside` fijo de 248 px, `bg-surface-1 border-r border-border`, que no se cierra.
- **Móvil:**
  - barra superior de 56 px con el botón `data-abre="nav-panel"` (`aria-label="Abrir el menú del panel"`, `aria-expanded`, `aria-controls`) y el título "Panel";
  - cajón `Hoja` con `lado="izquierda"`, `nombre="nav-panel"`, `titulo="Menú del panel"` y `etiquetaCerrar="Cerrar el menú del panel"`;
  - **sin barra inferior de pestañas**.
- **Ítems:**
  - Enlaces: Inicio (`panel.html`, `aria-current="page"`), Pedidos (`admin-orders.html`), Productos (`admin-products.html`), Clientes (`admin-customers.html`), BuildAds (`dashboar.html`).
  - Grupo "Próximamente", como texto con `aria-disabled="true"` y **sin `href`**: Chatbot, ProductAds, Ajustes.
  - Al final, "Cerrar sesión".
- Activo: `bg-red/12` y `font-semibold`, sin raya.
- Cero `href="#"`.

**`InicioPanel`:**
- Saludo con el correo.
- Dos filas con hairline y cifras reales:
  - Pedidos: `select('id', { count: 'exact', head: true })` sobre `orders`;
  - Productos activos: lo mismo sobre `products` con `.eq('is_active', true)`.
- Con 0 pedidos, estado vacío: "Todavía no hay pedidos. Cuando un cliente confirme uno, aparecerá aquí."
- **Sin tarjetas KPI y sin minigráficos.**

**`ConfirmarSalida`:** `Hoja` con `lado="centro"`, `nombre="confirmar-salida"`, `titulo="¿Cerrar sesión?"` y `etiquetaCerrar="Cerrar la confirmación"`.
- Texto: "Tendrás que volver a ingresar para entrar al panel."
- Pie: "Cancelar" (secundario) y "Cerrar sesión" (rojo).
- Al confirmar:
  ```ts
  await cliente.auth.signOut();          // alcance global por defecto
  // si da error → await cliente.auth.signOut({ scope: 'local' })
  location.replace('landing.html');
  ```

---

## 4. Unidades (orden de construcción)

### 4.0 Bloques comunes

```bash
WT=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp-pruebas
test "$(git -C "$WT" branch --show-current)" = pruebas || { echo "rama equivocada"; exit 1; }
docker start carni-landing-dev >/dev/null
for p in landing catalogo panel; do curl -s -o /dev/null -w "$p %{http_code}\n" "http://localhost:3002/$p.html"; done   # 200 (catalogo y panel desde U1)

# Compuerta del escritor (dentro de Docker)
docker exec carni-landing-dev npm run ts:check
docker exec carni-landing-dev npm test
docker exec carni-landing-dev npm run build
```

**Compuertas con `rg`.** Todas deben dar 0 coincidencias, salvo donde se indica.

```bash
N="$WT/src/ui $WT/src/data $WT/src/landing $WT/src/catalogo $WT/src/asistente $WT/src/panel $WT/src/entry/landing.tsx $WT/src/entry/catalogo.tsx $WT/src/entry/panel.tsx $WT/landing.html $WT/catalogo.html $WT/panel.html"
X="-g !*.json -g !seedProducts.ts"
rg -n $X "innerHTML|dangerouslySetInnerHTML|eval\(|new Function" $N                                      # G1
rg -n $X "js/modules|styled-components|montarCarrito|montarLupa|entry/shared" $N                         # G2
rg -n $X "cdn\.jsdelivr|unpkg\.com|fonts\.googleapis|fonts\.gstatic" $N                                   # G3
rg -n $X "from\('(orders|order_items)'\)\.(insert|update|upsert|delete)" $N                               # G4
rg -n $X "falta backend|EJEMPLO|onfirmar con el due|No tenemos picaña|carniceriasenmisericordia|carniceriamisericordia\.com|mailto:" $N   # G5
rg -n -P $X "VITE_(?!SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_KEY)" $N                                     # G6
rg -n $X "service_role|sb_secret_|GROQ" $N                                                                # G7
rg -n $X "import\.meta\.env\.VITE" $N | rg -v "src/data/supabase.ts"                                      # G8
rg -n $X "en stock|existencia|Pocas piezas" $N                                                            # G9
rg -n $X "text-\[[0-9]|text-(xs|sm|base|lg|xl|[2-9]xl)\b|font-\[[0-9]" $N                                 # G10
rg -n $X "rounded-(sm|md|lg|xl|2xl|3xl)\b|backdrop-blur" $N                                               # G11
rg -c "uppercase" "$WT/src/ui" "$WT/src/catalogo" "$WT/src/asistente" "$WT/src/panel"                     # G12: 0
rg -o "uppercase" "$WT/src/landing" | wc -l                                                               # G13: ≤ 2
```

**Capturas estáticas** (Chrome sin cabeza; el escritor las toma en 390 y 1440):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CAP="$WT/docs/design/rediseno/capturas-r4"; mkdir -p "$CAP"
cap() {  # cap <pagina> <ancho,alto> <nombre>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=8000 --window-size="$2" --screenshot="$CAP/$3.png" "http://localhost:3002/$1" >/dev/null 2>&1 \
  && sips -s format jpeg -s formatOptions 70 "$CAP/$3.png" --out "$CAP/$3.jpg" >/dev/null && rm -f "$CAP/$3.png"
}
dom() {  # dom <pagina> → DOM ya renderizado, para compuertas de cadenas
  "$CHROME" --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom "http://localhost:3002/$1" > "${TMPDIR:-/tmp}/carni-$1"
}
```

- Cada JPG debe pesar ≤ 250 KB (`stat -f%z`).
- Las capturas con interacción (menú o carrito abiertos, hover) las toma el orquestador con Playwright (§6).

**Lista de archivos permitidos.** Al terminar cada unidad, el orquestador compara `git -C "$WT" status --porcelain --untracked-files=all` contra la lista de la unidad. Se excluyen cambios previos ajenos: `.atl/skill-registry.md`, `docs/design/loop-final.md`, `docs/design/loop-v3.md` y `docs/design/mockups/`. Cualquier archivo fuera de lista es CRITICAL.

---

### U0 · Preparación (orquestador, sin agentes)

- **Meta:** dejar el árbol listo para que ningún escritor tropiece con el entorno.
- **Depende de:** nada.
- **Agente:** A0.
- **Skills:** S14 y S1.

**Pasos y comandos:**

1. `punto-de-control` y comprobación de rama (§4.0).
2. **Línea base (C1).** Solo los archivos del prototipo y los informes; los cambios ajenos se dejan fuera y se reportan.
   ```bash
   git -C "$WT" add -- landing.html src/entry/landing.tsx src/landing src/styles/tailwind.css src/ui package.json package-lock.json vite.config.js docs/design/rediseno/05-abogado-del-diablo.md docs/design/rediseno/06-plano.md
   PATH=/opt/homebrew/bin:$PATH git -C "$WT" commit -m "chore(rediseno): línea base del prototipo Tailwind antes de la etapa de código"
   git -C "$WT" log -1 --oneline
   ```
3. **`.env` sin imprimir valores.** La llave anónima es la del stack local: el `.env` principal apunta a `host.docker.internal`, que es el mismo stack.
   ```bash
   MAIN=/Users/felipeeduardotorresaguilar/Desktop/Carni-mvp/.env
   { echo "VITE_SUPABASE_URL=http://localhost:54321"; rg '^VITE_SUPABASE_ANON_KEY=' "$MAIN"; } > "$WT/.env"; chmod 600 "$WT/.env"
   git -C "$WT" check-ignore -q .env && echo ".env ignorado"
   K=$(rg -o --replace '$1' '^VITE_SUPABASE_ANON_KEY=(.*)$' "$WT/.env"); curl -s -o /dev/null -w "rest %{http_code}\n" -H "apikey: $K" "http://localhost:54321/rest/v1/categories?select=slug&limit=1"; unset K   # 200
   docker restart carni-landing-dev && sleep 4 && curl -sI http://localhost:3002/landing.html | head -1                                              # 200
   ```
4. **Video** (ffmpeg en el host; no es npm):
   ```bash
   SRC="$WT/docs/design/assets/video/portada-carne.mp4"; OUT="$WT/public/img/Videos"
   ffmpeg -y -loglevel error -i "$SRC" -an -vf scale=640:-2  -c:v libx264 -preset slow -crf 30 -movflags +faststart -pix_fmt yuv420p "$OUT/portada-carne-360.mp4"
   ffmpeg -y -loglevel error -i "$SRC" -an -vf scale=1280:-2 -c:v libx264 -preset slow -crf 26 -movflags +faststart -pix_fmt yuv420p "$OUT/portada-carne-720.mp4"
   cp "$WT/docs/design/assets/video/portada-carne-poster.webp" "$OUT/"
   stat -f "%z %N" "$OUT"/portada-carne-*                                           # 360 ≤ 460800 B; 720 ≤ 1258291 B
   ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$OUT/portada-carne-360.mp4" | wc -l   # 0 (sin audio)
   ```
   Si el de 360 pasa de 450 KB, se repite con `-crf 32`.
5. **Mascota:**
   ```bash
   mkdir -p "$WT/public/img/mascota"
   cp "$WT/docs/design/assets/mascota/carnicero-ingresar-busto.webp" "$WT/docs/design/assets/mascota/carnicero-ingresar-busto@2x.webp" "$WT/public/img/mascota/"
   ```
6. **Semilla, copia de la base local** (solo `SELECT`):
   ```bash
   docker exec supabase_db_Carni-mvp psql -U postgres -d postgres -At -c "select json_agg(row_to_json(t) order by t.id) from (select p.id, p.name, p.description, p.price_per_kg, p.price_per_lb, p.image_url, p.stock, p.is_active, c.slug as category_slug, c.name as category_name from products p join categories c on c.id = p.category_id where p.is_active) t;" > "$WT/src/data/semillaCatalogo.json"
   docker exec supabase_db_Carni-mvp psql -U postgres -d postgres -At -c "select json_agg(json_build_object('slug', slug, 'name', name, 'order', \"order\") order by \"order\") from categories;" > "$WT/src/data/semillaCategorias.json"
   python3 -c "import json;print(len(json.load(open('$WT/src/data/semillaCatalogo.json'))), len(json.load(open('$WT/src/data/semillaCategorias.json'))))"   # 53 9
   ```
7. **Línea base de `eval` en `dist/`,** para la medición 15:
   ```bash
   docker exec carni-landing-dev npm run build >/dev/null
   rg -c "eval\(|new Function\(" "$WT/dist/assets" | awk -F: '{s+=$2} END {print s+0}'
   ```
   El número se anota en `ESTADO.md` como `EVAL_BASE`.
8. Commit, `ESTADO.md` (agregar las filas U0 a U6 a la tabla de fases) y Engram.

**Aceptación:**
- 2 commits visibles en `git log`;
- `.env` ignorado y `rest 200`;
- `landing.html` responde 200;
- MP4 de 360 ≤ 450 KB y sin audio; MP4 de 720 ≤ 1,2 MB;
- JSON con 53 productos y 9 categorías;
- `EVAL_BASE` anotado.

**Commit 2:** `chore(rediseno): video de portada recodificado, mascota y semilla del catálogo` (incluye `public/img/Videos/portada-carne-*`, `public/img/mascota/`, `src/data/semilla*.json` y `ESTADO.md`).

---

### U1 · Cimientos y carcasa (W1)

- **Meta:** que las tres páginas nuevas existan con tokens, fuentes, datos, `Hoja`, encabezado con su efecto, menú, carrito y pie, sin depender del resto.
- **Depende de:** U0.
- **Agente:** A3 (`carni-frontend-specialist`, sonnet).
- **Skills:** S1, S2, S3, S4.
- **Lee:** §1, §2, §3.1, §3.2, §3.4 y §3.7.

**Archivos que posee:**
- `package.json` y `package-lock.json`, solo vía:
  ```bash
  docker exec carni-landing-dev npm install lucide-react @fontsource-variable/fraunces @fontsource-variable/geist
  ```
  y después `docker restart carni-landing-dev`.
- `vite.config.js`: solo agregar las entradas `catalogo` y `panel` a `rollupOptions.input`.
- `landing.html`, que se reescribe:
  - `lang="es-MX"`;
  - `viewport` con `viewport-fit=cover`;
  - `theme-color #0B0B0C`;
  - título "Carnicería El Señor de La Misericordia · San Luis Potosí";
  - descripción "Carnicería familiar en San Luis Potosí. Cortes de res, cerdo y pollo, paquetes para asar y pedidos por WhatsApp.", sin emojis y sin precios;
  - `<link rel="preload" as="image" href="img/Videos/portada-carne-poster.webp" fetchpriority="high">`;
  - **sin** Google Fonts y **sin** `js/modules/ui/header.js`;
  - `<div id="raiz">` y el módulo `./src/entry/landing.tsx`.
- `catalogo.html` y `panel.html`, nuevas, con la misma cabeza. `panel.html` lleva además `<meta name="robots" content="noindex">` y no lleva la precarga del póster.
- `src/entry/landing.tsx`, `src/entry/catalogo.tsx` y `src/entry/panel.tsx` (§1.3).
- `src/styles/tailwind.css` y `src/styles/fuentes.ts`.
- `src/data/supabase.ts`, `catalogo.ts`, `useCatalogo.ts` y `negocio.ts`.
- `src/ui/Hoja.tsx`, `iconos.tsx`, `Logotipo.tsx`, `Encabezado.tsx`, `MenuHoja.tsx`, `CarritoHoja.tsx`, `Pie.tsx`, `Carcasa.tsx`, `InsigniaDatos.tsx` y `__tests__/Hoja.test.tsx`.
- **Esqueletos**, que después reemplaza su dueño:
  - `src/catalogo/Catalogo.tsx`: `<section className="px-4 py-10"><h1 className="text-seccion">Catálogo</h1></section>`;
  - `src/asistente/Asistente.tsx`: acepta `{ pagina }` y devuelve `null`;
  - `src/panel/Panel.tsx`: `<p role="status">Panel en construcción</p>`.
- `src/landing/Landing.tsx`: **una sola edición mínima**, quitar `<Encabezado>` y `<Pie>` porque ahora los pinta `Carcasa`. U2 lo reescribe completo.

**Aceptación (medible):**
1. En Docker, `ts:check`, `test` y `build` salen con código 0.
   - Las 29 pruebas previas siguen verdes, más al menos 5 de `Hoja`.
   - Existen `dist/landing.html`, `dist/catalogo.html` y `dist/panel.html`.
2. `curl` devuelve 200 para las tres páginas.
3. G1 a G12 dan 0. G13 no aplica todavía.
4. `git diff package.json` muestra solo las 3 dependencias nuevas.
5. **Encabezado:** alto de 56±1 px a 390 y de 72±1 px a 1440.
   - `data-estado="solido"` en `catalogo.html` con scroll 0.
   - En `landing.html`: `sobre-video` con scroll 0 y `solido` después de 8 px (respaldo sin centinela).
6. **Menú y carrito:** pasan las 7 comprobaciones de §6.3 a 390 y a 1440. Las mide el orquestador.
7. **Sin variables** (build con el entorno vacío y vista previa en 4173; lo corre el orquestador):
   ```bash
   docker exec -e VITE_SUPABASE_URL= -e VITE_SUPABASE_ANON_KEY= carni-landing-dev npx vite build --outDir /tmp/dist-sin-env
   docker exec -d carni-landing-dev npx vite preview --outDir /tmp/dist-sin-env --host 0.0.0.0 --port 4173 --strictPort
   ```
   - `landing.html` y `catalogo.html` en `http://localhost:4173/` pintan `main` con al menos 1 encabezado y **0 errores de consola**.
   - `panel.html` muestra el texto del esqueleto sin errores.
   - Al final: `docker exec carni-landing-dev pkill -f "vite preview"`.
8. **Fuentes:** la suma de `woff2` que pide `landing.html` es ≤ 150 KB (meta) y nunca más de 200 KB. Hay 0 peticiones a `fonts.googleapis.com`, `fonts.gstatic.com` y `cdn.jsdelivr.net`.
9. **Capturas:** `u1-landing-390`, `u1-landing-1440`, `u1-catalogo-390`, `u1-catalogo-1440` y `u1-panel-390`.

**Commit:** `feat(rediseno): cimientos Tailwind y carcasa con encabezado, menú, carrito y pie`

---

### U2 · Landing en el orden fijado (W2)

- **Meta:** las 10 secciones más el pie, en el orden de Eduardo, con la Tarjeta única, el carrusel dinámico y el tratamiento editorial (C4, C5 y C8).
- **Depende de:** U1.
- **Agente:** A4 (`carni-frontend-specialist`, sonnet).
- **Skills:** S5 (con `craft-floor.md`), S6 (líneas 213 a 275), S1 y S4.
- **Lee:** §1.6, §2, §3.3 y §3.5.

**Archivos que posee:**
- `src/ui/Tarjeta.tsx`, `presentacionProducto.ts`, `CarruselCortes.tsx`, `useCarrusel.ts`, `__tests__/Tarjeta.test.tsx` y `__tests__/presentacionProducto.test.tsx`.
- `src/landing/`: `Landing.tsx`, `Portada.tsx`, `Mostrador.tsx`, `Populares.tsx`, `Ofertas.tsx`, `PreguntasFrecuentes.tsx`, `Familia.tsx`, `HorariosPuntaje.tsx`, `Contacto.tsx`, `Comentarios.tsx` y `datos.ts`.
- `datos.ts` queda solo con `CATEGORIAS_BENTO` (descripciones), `PREGUNTAS` / `PREGUNTAS_VISIBLES` y las listas de ids. Se van: correo, `PRODUCTO_DESTACADO`, "20 en stock", `DATOS_RAPIDOS` y las constantes que ahora viven en `negocio.ts`.
- Borra los 9 archivos de §1.2.

**Contenido por sección.** El `id` va en cada `<section>`, que es hija directa de `<main>`.

| # | `id` | h2 (o h1) | Contenido | Fuente |
|---|---|---|---|---|
| 1 | `portada` | h1 "Cortes frescos, del mostrador a tu mesa" | Receta `04` §3.1 con estos cambios:<br>• caja `aspect-video` mínima que crece con el texto, con `rounded-b-sheet` en móvil;<br>• `lg:aspect-auto lg:h-[min(85svh,800px)] lg:min-h-[560px]`, a sangre;<br>• `<video>` con `preload="none"`, `muted`, `loop`, `playsInline`, `disablePictureInPicture`, `aria-hidden`, `tabIndex=-1`, póster `portada-carne-poster.webp` y fuentes `720` con `(min-width:1024px)` y `360` por defecto;<br>• reproducción después de `load` + inactividad, con `IntersectionObserver` al 25 %;<br>• solo póster con movimiento reducido o `saveData`;<br>• velo `bg-linear-to-t from-black/75 via-black/35 to-black/10`;<br>• titular en `text-portada`, a lo sumo 2 líneas, **sin animación de entrada y sin kicker**;<br>• botón rojo "Ver productos" → `catalogo.html`;<br>• botón de pausa de 44×44 abajo a la derecha (`aria-label` "Pausar el video" / "Reproducir el video");<br>• en móvil, el párrafo "Carnicería familiar en San Luis Potosí. Elige tus cortes y te los preparamos." va **fuera** de la caja;<br>• `<div id="fin-portada" aria-hidden className="h-px">` al final. | `negocio.ts` |
| 2 | `mostrador` | "Todo lo del mostrador" | Bento con 9 celdas exactas.<br>• Móvil: 2 columnas, carnes-rojas a lo ancho.<br>• Escritorio: 4 columnas, carnes-rojas en 2×2.<br>• Celdas con foto: carnes-rojas (`res.webp`), cortes-especiales (`filet_mignon.webp`), cerdo, preparadas y embutidos.<br>• Celdas tipográficas (ícono de 48 px en sand): pollo, ofertas, merch y otros.<br>• Nombre en Fraunces y descripción de `CATEGORIAS_BENTO`.<br>• Enlace `catalogo.html#categoria=<slug>`.<br>• **Sin cifras de productos.** | `useCatalogo().categorias` + `datos.ts` |
| 3 | `cortes` | "Cortes especiales" | `CarruselCortes` (§3.5) con los 7 ids | `useCatalogo` |
| 4 | `populares` | "Lo que se lleva la gente" | 4 Tarjetas: ids 14, 12, 1 y 3. 2 columnas en móvil y 4 en escritorio. | `useCatalogo` + `elegirPresentacion` |
| 5 | `ofertas` | "Ofertas" | 3 Tarjetas `variante="oferta"`: ids 40, 41 y 42.<br>• Móvil: riel `snap-x` con tarjetas al 80 % de ancho.<br>• Escritorio: `grid-cols-[1.4fr_1fr_1fr]`, distinto de Populares.<br>• Una sola nota en `text-meta`: "Todo paquete requiere un 50 % de anticipo. Precios de referencia; el peso final puede variar." | `useCatalogo` |
| 6 | `preguntas` | "Preguntas frecuentes" | `<details>/<summary>` nativos en filas con hairline. En escritorio, 2 columnas: h2 y enlace "Escribir por WhatsApp" en sand a la izquierda, lista a la derecha. | `PREGUNTAS_VISIBLES` |
| 7 | `familia` | "Carnicería de familia, pieza por pieza" | Bloque editorial a lo ancho: el lema en Fraunces 400 `text-seccion` y el párrafo de `Nosotros.tsx`, sin las tres cifras, sin la ubicación y sin cajas | `negocio.ts` + texto de `Nosotros.tsx` |
| 8 | `horarios` | "Horarios y puntaje" | Filas: horario (**el único lugar de la landing donde aparece**) y calificación `CALIFICACION` de 5 con `TOTAL_OPINIONES` opiniones en Google, con enlace a `PERFIL_GOOGLE` | `HORARIO`, `resenas.ts` |
| 9 | `contacto` | "Contacto y dirección" | Filas con hairline, cada fila entera es el objetivo táctil (≥ 56 px, con chevron): Teléfono (`tel:`), dirección + "Cómo llegar" (Maps en otra pestaña), Facebook e Instagram. Un solo botón rojo "Escribir por WhatsApp". **Sin correo y sin iframe.** | `NEGOCIO` |
| 10 | `comentarios` | "Comentarios" | Promedio y total (que `resenas.ts` exige junto a la selección). Dos filas en giro de 70 s, con `data-giro`. Botón "Detener el giro" / "Reanudar el giro" siempre visible. Cada reseña con autor, fecha y texto. Enlace "Ver todas en Google". **Sin la etiqueta "EJEMPLO".** | `RESENAS` |

El pie lo pinta `Carcasa`. Kickers: 0 exigidos y 2 como máximo en toda la landing (G13).

**Aceptación:**
1. En Docker, `ts:check`, `test` y `build` salen con código 0. Hay al menos 10 casos nuevos (6 de presentación y 4 de Tarjeta).
2. **Orden de secciones.** En el DOM renderizado, el orden de los `id` de `section` debe ser exactamente `portada mostrador cortes populares ofertas preguntas familia horarios contacto comentarios`:
   ```bash
   dom landing.html; rg -o '<section[^>]*id="([a-z]+)"' -r '$1' "${TMPDIR:-/tmp}/carni-landing.html" | tr '\n' ' '
   ```
3. **Portada** (la mide el orquestador):
   - alto de la caja a 360, 390 y 414 entre 202 y 260 px;
   - h1 de 2 líneas o menos;
   - "Ver productos" visible sin scroll;
   - a 1440×900, 765±2 px.
4. **Encabezado:**
   - `rgba(0, 0, 0, 0)` en la cima;
   - `rgba(0, 0, 0, 0.92)` con hover a 1440 y con foco de teclado dentro;
   - `rgb(11, 11, 12)` después de `#fin-portada`.
5. **Carrusel:**
   - 7 diapositivas; estado "Corte 1 de 7: Filete Mignon";
   - después de "siguiente": "Corte 2 de 7: Tomahawk", y el `h3` del detalle es "Tomahawk";
   - `data-precio-kg` de los 7 cortes igual al de la base (7 de 7);
   - "anterior" con `aria-disabled="true"` al inicio.
6. **Presentación** en el DOM: populares = `foto foto ilustrativa ilustrativa`; ofertas = `foto tipografica tipografica`.
7. G1 a G13 en su valor (G13 ≤ 2). `rg -c "rounded-card" "$WT/src/landing"` = 0, porque la caja con borde es solo de la Tarjeta y del bento vía componente.
8. **DOM renderizado:**
   ```bash
   rg -c "EJEMPLO|falta backend|onfirmar con el due|mailto:|en stock|Paquete Carnitas" "${TMPDIR:-/tmp}/carni-landing.html"
   ```
   Debe dar 0.
9. **Sin desborde horizontal** a 360, 390, 768, 1024 y 1440 (`scrollWidth === clientWidth`).
10. **Objetivos táctiles:** 0 controles de menos de 44×44 en `main` a 390, salvo enlaces dentro de párrafos, que miden ≥ 24 px de alto.
11. **Movimiento reducido:**
    - `animation-name: none` en `[data-giro]`;
    - 0 peticiones de video;
    - hojas en 150 ms o menos.
12. **Video:** 0 peticiones de `.mp4` antes del evento `load`. A 390 se pide `portada-carne-360.mp4`.
13. **Capturas:** `u2-landing-390` (390,844), `u2-landing-390-largo` (390,4200), `u2-landing-1440` (1440,900) y `u2-landing-1440-largo` (1440,5200).

**Commit:** `feat(rediseno): landing en el orden aprobado con tarjeta única y carrusel de cortes`

---

### U2s · Propuesta de seguridad (guardián, en paralelo con U2)

- **Meta:** cerrar el riesgo ALTO de pedidos en una migración **propuesta**, probada y sin aplicar (C11, §5.4).
- **Depende de:** U0.
- **Agente:** A5 (`guardian-de-datos`, opus).
- **Skills:** S12 y S11.

**Archivos que posee** (todos en `docs/design/rediseno/seguridad/`):
- `20261001000000_cerrar_escrituras_directas_pedidos.sql`: la propuesta. **Sin** `BEGIN` ni `COMMIT`, porque Supabase envuelve cada migración en su propia transacción.
- `prueba-rls-pedidos.sql`: la prueba, que corre después de la propuesta dentro de la misma transacción.
- `traspaso-chat-backend.md`: qué aplicar, en qué orden y cómo revertir, más la corrección de datos "Paquete Carnitas por Kilo" y la protección de contraseñas filtradas, que se activa en el panel de Supabase.

**Aceptación.** La prueba la corre A0, porque el guardián no tiene `Bash`:
```bash
S="$WT/docs/design/rediseno/seguridad"
{ echo 'begin;'; cat "$S/20261001000000_cerrar_escrituras_directas_pedidos.sql" "$S/prueba-rls-pedidos.sql"; echo 'rollback;'; } \
 | docker exec -i supabase_db_Carni-mvp psql -U postgres -d postgres -v ON_ERROR_STOP=1 2>&1 | rg -c "NOTICE:  OK:"   # ≥ 7
docker exec supabase_db_Carni-mvp psql -U postgres -d postgres -At -c "select count(*) from pg_policy where polname = 'orders_insert_own';"   # 1: no se aplicó nada
```
- El comando sale con código 0.
- Hay 7 avisos `OK:` o más (lista en §5.4).
- La política vieja sigue existiendo después del `rollback`.

**Commit** (docs; va junto con o después de U2): `docs(seguridad): propuesta de migración para pedidos y funciones SECURITY DEFINER`

---

### U3 · Catálogo y asistente (W3)

- **Meta:** catálogo con filtro, búsqueda y la misma Tarjeta; asistente que no es un chat común.
- **Depende de:** U2, por la Tarjeta y `presentacionProducto`.
- **Agente:** A6 (`carni-frontend-specialist`, sonnet).
- **Skills:** S2, S5, S1 y S4.
- **Lee:** §1.6, §2, §3.1, §3.3, §3.4 y §3.6.

**Archivos que posee:**
- `src/catalogo/Catalogo.tsx`, `FiltroCategorias.tsx`, `buscar.ts` y `__tests__/buscar.test.tsx`;
- `src/asistente/Asistente.tsx`, `guion.ts`, `__tests__/guion.test.tsx` y `__tests__/Asistente.test.tsx`.

**Catálogo:**
- **Encabezado editorial:** h1 "Productos", nombre de la categoría activa y conteo real ("18 productos").
- **Aviso único:** "Precios de referencia; el peso final puede variar."
- **Búsqueda:**
  - `<label for="buscar">Buscar un producto</label>` y `<input id="buscar" type="search">` de 48 px de alto, `rounded-control border-border-control`, con la etiqueta encima (S6 §4.6);
  - filtra en el cliente, sin distinguir mayúsculas ni acentos:
    ```ts
    // buscar.ts
    normalizar(s) = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
    ```
  - `#buscar` en el hash enfoca el campo al cargar y con `hashchange`.
- **Filtro:**
  - móvil: riel de chips pegajoso bajo el encabezado, con desplazamiento horizontal, chips de 44 px con `aria-pressed` y "Todas" primero;
  - escritorio: columna izquierda pegajosa de 240 px con las categorías y su conteo;
  - el estado vive en `#categoria=<slug>`.
- **Rejilla:**
  - 2 columnas en móvil (`gap-3`), 3 en `md` y 4 en `lg`;
  - `elegirPresentacion` sobre la lista visible;
  - `prioridad` en los primeros 4;
  - `pb-28` para que la última fila no quede bajo el lanzador.
- **Estado vacío:** "No encontramos productos con ese nombre." y el botón "Ver productos", que limpia el filtro.

**Asistente:** §3.6 completo.

**Aceptación:**
1. En Docker, `ts:check`, `test` y `build` salen con código 0. Hay al menos 9 casos nuevos: `buscar`, 3; `guion`, 3; `Asistente`, 3.
2. **"Todas" con datos vivos:** 53 Tarjetas; la insignia dice `Datos: vivos · 53`.
3. **Por categoría:** con `#categoria=<slug>`, el conteo de las 9 categorías es igual al de
   ```sql
   select c.slug, count(*) from products p join categories c on c.id = p.category_id where p.is_active group by 1;
   ```
4. **Presentación en "Todas":**
   - `[data-presentacion="foto"]` = 8;
   - las 8 de pollo son `tipografica`;
   - Rib Eye es `tipografica`.
5. **Búsqueda:**
   - "arrach" → 1 resultado;
   - "FILETE" → 1;
   - "zzz" → estado vacío;
   - desde la landing, el ícono de buscar lleva a `catalogo.html#buscar` y `document.activeElement.id === 'buscar'`.
6. **Asistente:**
   - 0 `input` y 0 `textarea` dentro del diálogo;
   - chips de 44 px de alto o más;
   - la sugerencia aparece a los 6±1 s una sola vez por sesión y su X la cierra;
   - lanzador de 56 px en la landing y 48 px en el catálogo;
   - intersección vacía entre el rectángulo del lanzador y cualquier `a` o `button` visible, con scroll 0 y con scroll al final, a 360×780 y a 390×844, en las dos páginas;
   - 0 peticiones que contengan `chat_messages`;
   - "¿Cuánto por persona?" pinta 2 Tarjetas `chica` con los nombres de los ids 41 y 42.
7. El diálogo del asistente pasa las 7 comprobaciones de §6.3.
8. G1 a G12 dan 0.
9. **Capturas:** `u3-catalogo-390`, `u3-catalogo-390-largo` (390,3600) y `u3-catalogo-1440`.

**Commit:** `feat(rediseno): catálogo con filtro y búsqueda, y asistente de respuestas guiadas`

---

### U4 · Carcasa del panel (W4)

- **Meta:** panel seguro por construcción: guardia, cajón con X, cierre de sesión real y estados vacíos honestos (C10).
- **Depende de:** U1 (`Hoja`, `supabase.ts` e íconos) y del admin de prueba local.
- **Agente:** A7 (`carni-frontend-specialist`, sonnet).
- **Skills:** S2, S10, S7 y S1.
- **Lee:** §1.6, §1.7, §3.1, §3.4, §3.8 y §5.1.

**Antes de lanzar W4, el orquestador crea el admin de prueba local.** Es un dato de prueba de la aplicación de Eduardo, solo en `localhost:54321`. La contraseña se genera y nunca se imprime.
```bash
K=$(rg -o --replace '$1' '^VITE_SUPABASE_ANON_KEY=(.*)$' "$WT/.env")
CRED="$WT/supabase/.temp/admin-prueba-local.json"; mkdir -p "$(dirname "$CRED")"
git -C "$WT" check-ignore -q supabase/.temp/admin-prueba-local.json && echo "ignorado por git"      # obligatorio antes de escribir
EMAIL=admin-prueba@carni.test; PASS=$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-24)
curl -s -o /dev/null -w "signup %{http_code}\n" -X POST "http://localhost:54321/auth/v1/signup" -H "apikey: $K" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
printf '{"email":"%s","password":"%s","nota":"Admin de prueba SOLO del Supabase local (localhost:54321)."}\n' "$EMAIL" "$PASS" > "$CRED"; chmod 600 "$CRED"; unset PASS K
docker exec supabase_db_Carni-mvp psql -U postgres -d postgres -c "begin; set local session_replication_role = replica; update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where email = 'admin-prueba@carni.test'; update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'admin-prueba@carni.test'); commit;"
docker exec supabase_db_Carni-mvp psql -U postgres -d postgres -At -c "select role from public.profiles p join auth.users u on u.id = p.id where u.email = 'admin-prueba@carni.test';"   # admin
```

**Archivos que posee:** `src/panel/Panel.tsx`, `acceso.ts`, `useGuardiaAdmin.ts`, `NavPanel.tsx`, `InicioPanel.tsx`, `ConfirmarSalida.tsx`, `__tests__/acceso.test.tsx` y `__tests__/NavPanel.test.tsx`.

**Aceptación:**
1. En Docker, `ts:check`, `test` y `build` salen con código 0. Hay al menos 7 casos nuevos: `decidirAcceso`, 4; `NavPanel`, 3 (ítems, `aria-current` y la X del cajón cierra).
2. **Sin sesión:**
   - `panel.html` termina en `accessweb.html?admin=true`;
   - 0 peticiones a `/rest/v1/`;
   - antes de redirigir, el DOM solo tiene el `role="status"`.
3. **Con el entorno vacío** (vista previa de U1): "Panel no disponible en este entorno" y 0 peticiones.
4. **Con el admin de prueba** (el orquestador ingresa por `accessweb.html` con las credenciales del archivo de fixture):
   - `aside` de 248±1 px a 1440;
   - a 390, barra de 56 px y cajón con X;
   - el cajón y `ConfirmarSalida` pasan las 7 comprobaciones de §6.3.
5. **Cifras de Inicio** iguales a:
   ```sql
   select (select count(*) from orders), (select count(*) from products where is_active);
   ```
6. **Salir:**
   - URL final `landing.html`;
   - `Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k)).length === 0`;
   - volver a `panel.html` redirige otra vez, sin datos.
7. **Ítems:** 5 enlaces, 3 "Próximamente" sin `href` y con `aria-disabled`, y "Cerrar sesión". `rg -c 'href="#"' "$WT/src/panel"` = 0.
8. G1 a G12 dan 0. Ningún `getSession(` en `src/panel/` (`rg -c`).
9. **Capturas:** `u4-panel-390` y `u4-panel-1440`, tomadas por el orquestador con Playwright porque exigen sesión.

**Commit:** `feat(rediseno): carcasa del panel con guardia de admin, cajón con X y cierre de sesión`

---

### U5 · Juicio dual ciego y corrección

- **Depende de:** U1 a U4 y U2s.
- **Agentes:** A9 y A10 en paralelo (opus, forzado); después A11 (sonnet) y A8 (sonnet).
- **Skills:** las de §0.2.

**Instrucciones a los jueces:**
- mismo objetivo: `git -C "$WT" diff <sha-línea-base>..HEAD` más `docs/design/rediseno/seguridad/`;
- **no se muestran el informe del otro**;
- cada hallazgo lleva severidad (CRITICAL, WARNING o SUGGESTION), `archivo:línea`, evidencia y la regla del plano que rompe.

**Lentes:**
- **A9 (juez A):**
  - §2.3, §3 y §6.3;
  - S6 §4.4 a §4.7 y S8 en modo audit;
  - la tabla de completitud §6.4, marcando cada exigencia de Eduardo como CUMPLE o NO CUMPLE con evidencia.
- **A10 (juez B):**
  - §5.1 punto por punto;
  - S9 completo sobre `src/` nuevo y `dist/`;
  - S10 y S11 sobre la propuesta SQL;
  - verdad de datos: cifras en el guion, stock y precios escritos a mano.

**Cruce** (lo hace el orquestador):
- CONFIRMED = lo vieron los dos.
- Van al corrector los CONFIRMED y todos los CRITICAL, aunque los vea uno solo.
- Los WARNING de un solo juez se anotan en `ESTADO.md` como pendientes.

**Aceptación:**
- la compuerta queda verde después de corregir;
- A8 sobre el diff del corrector da 0 CRITICAL;
- si hubo algún CRITICAL, se re-juzga una vez solo con el juez que lo encontró.

**Commit:** `fix(rediseno): hallazgos confirmados de la revisión dual`

---

### U6 · Verificación final y entrega (orquestador)

- **Meta:** probar con mediciones que todo funciona, abrir Brave y dejar el estado guardado.
- **Depende de:** U5.
- **Contenido:** §6 completa.

**Commit:** `docs(rediseno): verificación final y entrega del primer rediseño` (con `ESTADO.md` y `capturas-r4/`).

---

## 5. Seguridad

### 5.1 Requisitos del frontend en v1 (obligatorios)

1. **Guardia del panel:** `auth.getUser()` y después `rpc('is_admin')`.
   - Nada del panel se pinta antes de las dos respuestas.
   - Si falla, `location.replace`.
   - El código y la entrega dicen que la guardia es experiencia de uso: **la seguridad real es RLS**.
2. **Cierre de sesión real:** `signOut()` con alcance global y `location.replace('landing.html')`. `pageshow` recarga si la página viene de la caché de retroceso. Esto cierra P-42 en el panel nuevo.
3. **Sin llaves de servicio en el paquete:**
   - solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (con el alias viejo `VITE_SUPABASE_KEY`);
   - leídas únicamente en `src/data/supabase.ts` (G6, G7 y G8);
   - `GROQ_API_KEY` y cualquier llave de LLM son solo de servidor.
   - En `dist/`: `rg "service_role|sb_secret_|GROQ_API_KEY"` = 0.
4. **Sin `innerHTML` ni `dangerouslySetInnerHTML`** en archivos nuevos (G1). Todo texto que venga de la base o del usuario se pinta como nodo de texto de React. Un XSS equivale a tomar la cuenta del admin, porque el token vive en `localStorage`.
5. **Sin escrituras directas a `orders` ni a `order_items`** (G4). El único camino es el RPC `create_order_with_items`, que no entra en v1.
6. **Sin CDN ni scripts de terceros** en las páginas nuevas (G3):
   - fuentes y Lucide empaquetados;
   - sin iframe de Maps;
   - la Lupa, que arrastra jsdelivr, no se monta.
7. **Enlaces externos** con `target="_blank" rel="noopener noreferrer"`. WhatsApp con texto prellenado fijo, sin datos personales.
8. **Asistente sin superficie de ataque:** sin campo libre, sin red y sin escribir en `chat_messages`.
9. **Git:** `.env` y `supabase/.temp/` ignorados, comprobado con `git check-ignore` antes de escribir en ellos. Las credenciales de prueba nunca se imprimen ni se pegan en el chat.

### 5.2 CSP (nota; no se aplica en v1, lo hace `devops-captain` después)

- **Las páginas nuevas quedan listas para un CSP estricto:**
  - 0 scripts en línea en los HTML;
  - 0 `eval` nuevos (`dist/` ≤ `EVAL_BASE`);
  - fuentes propias;
  - sin iframes.
- **CSP propuesto para cuando `landing.html` reemplace a `index.html`:**
  ```
  default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://<ref>.supabase.co;
  font-src 'self'; media-src 'self'; connect-src 'self' https://<ref>.supabase.co wss://<ref>.supabase.co;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
  ```
  React escribe `style` por CSSOM, así que no necesita `'unsafe-inline'`.
- Hoy `netlify.toml` conserva `'unsafe-inline'` y `'unsafe-eval'` por las páginas viejas. El orden de retiro está en `05` §3.5.

### 5.3 Asistente con backend (contrato para después; no se construye en v1)

- **Motor:** `asistenteRemoto` implementa `MotorAsistente` (§3.6) contra una Edge Function. La llave del LLM vive solo en el servidor.
- **Entrada libre:**
  - como máximo 500 caracteres;
  - `trim`;
  - se quitan los caracteres de control con `/[\u0000-\u001F\u007F]/g`;
  - se valida también en el servidor;
  - se pinta siempre como texto.
- **Límite de peticiones:**
  - en el servidor: 10 por minuto por usuario o por IP, con respuesta 429 y el mensaje "Espera un momento";
  - en el cliente: un mensaje pendiente a la vez.
- **Sin inventar datos:** la respuesta sale de datos consultados (catálogo y horario), nunca de existencias. El registro no guarda datos personales.

### 5.4 Migración propuesta (la escribe A5; **no se aplica**)

**Esquema del contenido:**

```sql
-- 1) Pedidos: solo el RPC puede crear; solo el admin cambia el estado.
drop policy if exists orders_insert_own        on public.orders;
drop policy if exists orders_update_own        on public.orders;
drop policy if exists order_items_insert_order on public.order_items;
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;
grant update (status) on public.orders to authenticated;         -- lo filtra la política orders_admin_update_status (is_admin())
alter table public.orders add constraint orders_total_nonnegative check (total >= 0);
-- El cliente cancela solo con cancel_order (SECURITY DEFINER, valida auth.uid()).

-- 2) Funciones SECURITY DEFINER: nadie anónimo ejecuta; las de trigger no las ejecuta nadie.
revoke execute on function public.handle_new_user()               from public, anon, authenticated;
revoke execute on function public.protect_profile_system_fields() from public, anon, authenticated;
revoke execute on function public.marcar_store_settings()         from public, anon, authenticated;
revoke execute on function public.create_order_with_items(<firma>), public.cancel_order(<firma>),
       public.add_to_favorites(<firma>), public.remove_from_favorites(<firma>), public.get_user_favorites() from public, anon;
-- is_admin() y get_user_role(): se mantienen para authenticated (las usa la guardia).

-- 3) search_path fijo en las 4 mutables.
alter function public.update_updated_at_column() set search_path = '';
alter function public.add_points(<firma>)          set search_path = '';
alter function public.apply_promotion(<firma>)     set search_path = '';
alter function public.update_order_status(<firma>) set search_path = '';
-- (y cualquier referencia sin esquema dentro de esas funciones se califica con public.)

-- 4) pg_graphql: proponer `drop extension if exists pg_graphql;` SOLO si ningún cliente usa /graphql/v1 (rg en el repo = 0).
```

**Firmas:** A5 las toma de `supabase/migrations/*.sql` del repo. No inventa ninguna.

**Prueba** (`prueba-rls-pedidos.sql`, bloques `DO` con `raise notice 'OK: …'`, que corren después de la propuesta dentro de la misma transacción):
1. Crea dentro de la transacción un usuario de prueba en `auth.users`; el `rollback` lo borra.
2. Toma su identidad: `set_config('request.jwt.claims', json_build_object('sub', <uuid>, 'role', 'authenticated')::text, true)` y `set local role authenticated`.
3. **OK** si `insert into orders` falla con `insufficient_privilege`.
4. **OK** si `update orders set total = 0` falla.
5. **OK** si `update orders set status = 'delivered'` no cambia filas o falla, siendo no admin.
6. **OK** si `insert into order_items` falla.
7. **OK** si `select public.create_order_with_items(...)` con un producto activo **funciona** y el total lo fija el servidor.
8. **OK** si, con el rol `anon`, `execute` sobre `handle_new_user` falla.
9. **OK** si `insert` con `total < 0` falla por la restricción.

**Django:** no cambia en v1. El panel no lo llama. Para cuando se exponga:
- permisos `is_staff` o por grupo en cada vista;
- ajustes `SECURE_*`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `CSRF_TRUSTED_ORIGINS` y HSTS;
- decidir si valida el JWT de Supabase (JWKS);
- agregar su host a `connect-src`.

Va en el traspaso al chat de backend.

---

## 6. Verificación final (U6, la hace el orquestador)

### 6.1 Arranque

```bash
test "$(git -C "$WT" branch --show-current)" = pruebas
docker start carni-landing-dev >/dev/null; sleep 3
for p in landing catalogo panel; do curl -s -o /dev/null -w "$p %{http_code}\n" "http://localhost:3002/$p.html"; done   # 200 ×3
docker exec carni-landing-dev npm run ts:check && docker exec carni-landing-dev npm test && docker exec carni-landing-dev npm run build
```

- Las mediciones de geometría, estilos, red y consola se hacen con las herramientas `mcp__playwright__browser_*`: `resize`, `navigate`, `evaluate`, `press_key`, `mouse_click_xy`, `emulate_media`, `network_requests`, `console_messages` y `take_screenshot`.
- El estrangulamiento de CPU y red se hace con `browser_run_code_unsafe` y una sesión CDP (`Emulation.setCPUThrottlingRate`, `Network.emulateNetworkConditions`). Si esa herramienta no está, se anota [NO PROBADO con estrangulamiento].

### 6.2 Mediciones con umbral

Adaptadas de `05` §8. Cada una se anota en `ESTADO.md` con su valor.

| # | Qué | Umbral | Cómo |
|---|---|---|---|
| 1 | Portada móvil y escritorio | 202 a 260 px a 360, 390 y 414; h1 de 2 líneas o menos; CTA visible; 765±2 px a 1440×900 | `getBoundingClientRect` |
| 2 | Contraste sobre el video | Encabezado ≥ 4,5:1 (logotipo) y ≥ 3:1 (íconos); titular ≥ 3:1 (texto grande, 30 px o más) | Con `ffmpeg` sobre `docs/design/assets/video/portada-carne-cuadro-claro.jpg`, recortando la franja superior de 56 px y la franja del titular a escala de 390 (`-vf "scale=390:-1,crop=…,signalstats"`, se lee `YMAX`). Se aproxima L ≈ (YMAX/255)^2,2, se aplica el velo L' = L·(1−α) y se calcula (0,95)/(L'+0,05). Si falla, se ajusta el velo (§2.2). |
| 3 | Video | MP4 de 360 ≤ 450 KB; 0 peticiones de `.mp4` antes de `load`; 0 con movimiento reducido | red |
| 4 | LCP | ≤ 2,5 s con CPU 4× y "Fast 4G" (mejor esfuerzo); el elemento LCP es el póster o el h1; el h1 nunca tiene opacidad 0 al cargar | `PerformanceObserver` de `largest-contentful-paint` |
| 5 | Estados del encabezado | cima `rgba(0, 0, 0, 0)`; hover a 1440 `rgba(0, 0, 0, 0.92)`; foco dentro `rgba(0, 0, 0, 0.92)`; después de la portada `rgb(11, 11, 12)`; `backdrop-filter: none` | `getComputedStyle` |
| 6 | Superposiciones | las 7 comprobaciones de §6.3 en `menu`, `carrito`, `asistente`, `nav-panel` y `confirmar-salida`, a 390 y a 1440 | §6.3 |
| 7 | Foco y campos | contorno `rgb(228, 209, 176)` visible sobre el botón rojo; borde de `#buscar` = `rgb(113, 113, 122)` | `getComputedStyle` después de `Tab` |
| 8 | Objetivos táctiles | 0 controles de menos de 44×44 a 390 (salvo enlaces en párrafos, ≥ 24 px de alto) | `evaluate` sobre `a, button, [role=button]` |
| 9 | Origen de datos | insignia "vivos · 53"; `data-precio-kg` de las 53 Tarjetas igual a `price_per_kg` de la base | `evaluate` + `psql` |
| 10 | Cadenas prohibidas en el DOM de las 3 páginas | 0: `EJEMPLO`, `falta backend`, `onfirmar con el due`, `No tenemos picaña`, `mailto:`, `en stock`, `existencia`, los dos dominios de correo | `dom` + `rg`. "Paquete Carnitas por Kilo": 0 en la landing y ≥ 1 en el catálogo; se reporta como deriva. |
| 11 | Tarjeta honesta | en "Todas", `data-presentacion="foto"` = 8 y ninguna foto de categoría sin rótulo | `evaluate` |
| 12 | Asistente | 0 campos de texto; guion sin dígitos (prueba de Jest); intersección del lanzador con controles = 0 a 360 y 390; 0 peticiones a `chat_messages` | `evaluate` + red |
| 13 | Panel | sin sesión: redirección y 0 `/rest/v1/`; con el admin de prueba: cajón con X; después de salir, 0 claves `sb-*-auth-token`; "Atrás" no muestra datos | red + `evaluate` |
| 14 | Red de las páginas nuevas | 0 peticiones a `cdn.jsdelivr.net`, `fonts.googleapis.com` y `fonts.gstatic.com`; `woff2` ≤ 150 KB (tope duro 200 KB) | `network_requests` |
| 15 | `dist/` | `rg "service_role\|sb_secret_\|GROQ_API_KEY" dist` = 0; conteo de `eval(`/`new Function(` ≤ `EVAL_BASE` | `rg` |
| 16 | Consola | 0 errores en landing, catálogo y panel a 390 y 1440 | `console_messages` |
| 17 | Tipos, construcción y pruebas | verdes; las 29 pruebas viejas pasan y además las nuevas (≥ 35 nuevas en total) | Docker |
| 18 | Prueba RLS | ≥ 7 `OK:` y base sin cambios | U2s |
| 19 | Anchos intermedios | capturas a 768 y 1024 sin desborde (`scrollWidth === clientWidth`) | `resize` + `evaluate` |
| 20 | Árboles de trabajo | `git -C "$WT" log` muestra los commits de U0 a U6; `git -C /Users/felipeeduardotorresaguilar/Desktop/Carni-mvp/.claude/worktrees/frontend-react-tailwind-prompt-d5687d status --porcelain` sin cambios nuevos de esta etapa | git |

**Capturas finales** (Playwright, en `docs/design/rediseno/capturas-r4/`, JPG ≤ 250 KB):
- `final-landing-{360,390,768,1024,1440}`;
- `final-catalogo-{390,1440}`;
- `final-menu-390`, `final-carrito-390`, `final-asistente-390`, `final-asistente-1440`;
- `final-panel-cajon-390`, `final-panel-1440`, `final-confirmar-salida-390`.

### 6.3 Lista "X en todo" (7 comprobaciones por superposición, ejecutadas, no afirmadas)

Para cada `nombre` en `menu`, `carrito` y `asistente` (en `landing.html` y en `catalogo.html`), y `nav-panel` y `confirmar-salida` (en `panel.html`, con sesión de admin):

1. Clic en `[data-abre="<nombre>"]` y después `evaluate`:
   ```js
   () => { const d = document.querySelector('dialog[open]'); if (!d) return { abierto: false };
     const x = d.querySelector('[data-cerrar]'); const r = x.getBoundingClientRect();
     const t = document.getElementById(d.getAttribute('aria-labelledby'));
     return { abierto: true, nombre: d.dataset.superposicion, modal: d.matches(':modal'),
       x: [Math.round(r.width), Math.round(r.height)], etiqueta: x.getAttribute('aria-label'),
       titulo: t && t.textContent.trim(), scrollBloqueado: getComputedStyle(document.documentElement).overflow === 'hidden',
       foco: document.activeElement && document.activeElement.tagName }; }
   ```
   Esperado:
   - `modal: true`;
   - `x` de 44×44 o más;
   - `etiqueta` que empieza con "Cerrar " y no es solo "Cerrar";
   - `titulo` no vacío;
   - `scrollBloqueado: true`;
   - `foco: 'H2'`.
2. `browser_press_key Escape`. Esperado: `!document.querySelector('dialog[open]')` y `document.activeElement.dataset.abre === '<nombre>'`.
3. Se reabre y se hace clic en el fondo con `browser_mouse_click_xy`:

   | Lado | Punto de clic |
   |---|---|
   | `derecha` | (10, 400) |
   | `izquierda` | (ancho − 10, 400) |
   | `inferior` | (ancho/2, 20) en móvil; (20, 20) en escritorio |
   | `centro` | (10, 10) |

   Esperado: cerrado y foco devuelto.
4. Se reabre y se hace clic **dentro**, en el título. Esperado: sigue abierto.
5. Se reabre y se pulsa `Tab` 15 veces. `document.activeElement` siempre queda dentro del `<dialog>` o es `body` (interfaz del navegador).
6. Con `browser_emulate_media` `reducedMotion: 'reduce'`: `getComputedStyle(d).transitionDuration` ≤ `0.15s` y `translate` en `none`.
7. `titulo` coincide con el texto del `h2` y el `dialog` tiene `aria-labelledby`.

**Además, no son `<dialog>` pero cuentan como "ventana" para Eduardo:**
- la **sugerencia del asistente** tiene X de 44×44 y se cierra;
- el **acordeón** de preguntas se cierra con su propio `summary`.

### 6.4 Tabla de completitud (la llena el juez A y la confirma el orquestador)

| Exigencia de Eduardo | Evidencia exigida |
|---|---|
| Orden exacto de la landing | salida del punto 2 de U2 |
| Portada móvil 16:9 pequeña, detrás del texto | medición 1 + `final-landing-390` |
| Vuelve el efecto del encabezado, móvil y escritorio | medición 5 |
| Logotipo tipográfico | 0 `<img>` en `header` |
| Asistente con SVG propio y "¿Te ayudo a elegir tu corte?", más que un chat | medición 12 + `final-asistente-*` |
| La misma Tarjeta en todos lados | `data-tarjeta` en landing, catálogo y asistente; un solo componente (`rg -l "export function Tarjeta" src` = 1) |
| X en toda ventana, menú, slider y cajón (sobre todo el del panel) | §6.3 completo |
| Panel seguro | mediciones 13 y 15 + U2s |
| Seguridad (Cyber Neo, Supabase, Django) | informe del juez B + §5 |
| Estándar senior, editorial, no Canva | informe del juez A (S8) + G10 a G13 |

### 6.5 Abrir en Brave y entregar

```bash
open -a "Brave Browser" "http://localhost:3002/landing.html"
```

Mensaje a Eduardo, en español y corto:
1. Qué ver: landing, catálogo (`catalogo.html`) y panel (`panel.html`, con el admin de prueba cuyas credenciales están en `supabase/.temp/admin-prueba-local.json`).
2. En el teléfono, el efecto del encabezado lo dispara el scroll, porque no hay cursor.
3. Costuras: la ficha, el carrito completo, el acceso y las páginas de admin siguen siendo las viejas.
4. Decisiones que le tocan a él, cada una en una línea:
   - enmienda de la regla de estilos de `AGENTS.md` (ver §7);
   - correo que funcione;
   - fotos reales de producto;
   - aplicar la migración propuesta;
   - corregir "Paquete Carnitas por Kilo" en la base;
   - reemplazar `index.html`.
5. Si la insignia dice "semilla", correr `supabase start`.

**Cierre:**
- `ESTADO.md`: R4, R5 y R6 en HECHO, con la bitácora;
- `mem_save` (`rediseno-mvp/progreso`);
- `guardemos-esto`;
- `mem_session_summary`.

---

## 7. Puntos de guardado y reversión

- **Un commit por unidad:**
  ```bash
  git -C "$WT" add -- <archivos de la unidad> docs/design/rediseno/ESTADO.md docs/design/rediseno/capturas-r4/
  PATH=/opt/homebrew/bin:$PATH git -C "$WT" commit -m "<mensaje de §4>"
  git -C "$WT" log -1 --oneline        # obligatorio: si no aparece, el commit no existe
  ```
  - Mensajes en formato *conventional commits*, **sin atribución a IA** (regla del usuario).
  - Nunca `git add -A` ni `git add .`: el árbol tiene cambios ajenos.
- **GGA** (hook `pre-commit`, `PROVIDER=claude`, `STRICT_MODE=true`, `RULES_FILE=AGENTS.md`):
  - Con `PATH=/opt/homebrew/bin` carga bash 5 y funciona.
  - Si rechaza **solo** por la regla de `styles.scss` co-locado (AGENTS.md §Estilos), el commit se hace con `--no-verify` y se anota en `ESTADO.md` y en la entrega. Esa regla choca con la migración a Tailwind que Eduardo autorizó.
  - **Enmienda propuesta, que no se aplica sin Eduardo:** "Los componentes bajo `src/ui`, `src/landing`, `src/catalogo`, `src/asistente` y `src/panel` usan Tailwind v4 con el `@theme` único de `src/styles/tailwind.css`; `styles.scss` co-locado aplica solo a `src/components/`."
  - Si GGA señala otra cosa, se corrige: en línea si son 10 líneas o menos, o con una corrida de corrección del escritor dueño.
- **Reversión, sin reescribir historia:**
  - Una unidad completa: `git -C "$WT" revert --no-edit <sha>`.
  - Un archivo, a su versión de la línea base: `git -C "$WT" restore --source=<sha-línea-base> -- <ruta>`.
  - Prohibido `reset --hard`, `stash`, `checkout` y `switch` sin orden de Eduardo.
  - `~/Desktop/Carni-mvp` sigue en `practicas-ebac`, en solo lectura.
- **Qué guarda cada punto de control:** el commit, `ESTADO.md` (fila y bitácora con porcentajes), Engram `rediseno-mvp/progreso` y, en las pausas, "Para retomar" y `guardemos-esto`.
- **Base de datos:** nada de esta etapa cambia la base de forma permanente, salvo el admin de prueba local.
  - Para borrarlo:
    ```bash
    docker exec supabase_db_Carni-mvp psql -U postgres -d postgres -c "delete from auth.users where email = 'admin-prueba@carni.test';"
    ```
    La fila de `profiles` se borra en cascada.
  - Ese borrado lo decide Eduardo; no se hace sin pedirlo.

---

## 8. Supuestos

Eduardo dijo "no me preguntes": esto es lo que se decidió en su lugar.

1. **The Architect sin entrevista:** las preguntas de sus fases 1 a 3 se contestaron con `ESTADO.md` y `05`. El plano se guarda en `docs/design/rediseno/06-plano.md` y no en `output/`, como pidió el encargo.
2. **Identificadores en español:** el código existente de `src/ui` y `src/landing` ya los usa (`Tarjeta`, `Encabezado`, `variante`), y la capa global permite extender el idioma del proyecto. El documento y la interfaz van en español neutro.
3. **Los productos de la base local son los de producción.** Según `03`, las dos tienen 53. La semilla nueva es una foto de la base del 2026-09-29 y queda vieja si el catálogo cambia. Se regenera con el comando de U0.
4. **Fotos vetadas:** se tratan como tipográficas `pollo.webp` y `premium.webp` (posible marca de agua, `contexto-previo` #718 y `01` §8.6), `merch.webp` y `otrosproductos.webp` (aspecto de IA), `frutasverduras.webp` (categoría inexistente) y `rib-eye.webp` (es un T-bone). No se abrió cada foto en esta fase: si Eduardo aprueba alguna, sale de `FOTOS_VETADAS`.
5. **"Lo que se lleva la gente"** es el nombre que fijó Eduardo. Con `orders` = 0 no hay datos de popularidad, así que es una selección editorial (ids 14, 12, 1 y 3). No se afirma "los más vendidos".
6. **Ofertas en la landing** = ids 40, 41 y 42. "Paquete Carnitas por Kilo" sale solo en el catálogo.
7. **La regla "50 % de anticipo"** viene del Catálogo 2024 del dueño (memoria `redes-y-catalogo`) y del diseño. El asistente la dice como "la mitad", para no tener dígitos.
8. **Titular de la portada:** "Cortes frescos, del mostrador a tu mesa". Es un texto nuevo y neutro, sin afirmaciones que no se puedan sostener. Eduardo puede cambiarlo sin tocar la maquetación.
9. **Franja de datos del diseño** (entrega, recoger, horario): se quita. El horario vive en "Horarios y puntaje", y el pedido mínimo, en las preguntas frecuentes, que ya lo traen. No está en la lista de secciones de Eduardo.
10. **Hover en táctil:** no existe. El "efecto en móvil" es el paso de transparente a sólido y el foco dentro. Se le dice en la entrega.
11. **Fuentes con Fontsource dentro de Docker:** son dos dependencias nuevas además de `lucide-react`. Su licencia es OFL, igual que en Google Fonts. Se prefirió esto a descargar `woff2` a mano.
12. **Lupa fuera de las páginas nuevas:** la búsqueda del encabezado lleva al campo del catálogo. La Lupa sigue en las páginas viejas.
13. **Admin de prueba local** (`admin-prueba@carni.test`): es un dato de prueba de la aplicación en `localhost`. Credenciales generadas y guardadas en un archivo ignorado por git, nunca en el chat ni en commits. Si GoTrue local exige confirmar el correo, se marca por SQL, solo en local.
14. **El orden de las pausas** usa la estimación de §0.7. Si la medición real de `punto-de-control` difiere, manda la medición.
15. **`carni-frontend-specialist` no fija modelo** en su frontmatter: se pasa `model: 'sonnet'` en cada llamada. `jd-judge-a` y `security-guardian` se llaman con `model: 'opus'`. Si el entorno ignora el parámetro, el orquestador anota el modelo real en la bitácora.
16. **Acceso con mascota:** queda fuera de v1 (lo anuló `05`), igual que la ficha y el checkout. Los recursos de la mascota que se copian en U0 son solo el busto que usa el asistente.
17. **Cambios ajenos:** `.atl/skill-registry.md`, `docs/design/loop-final.md`, `docs/design/loop-v3.md` y `docs/design/mockups/` son de otras sesiones. No entran en ningún commit de esta etapa y se reportan.
18. **Estimación de costo:** usa una sola observación de la bitácora (±30 %). Las corridas de contingencia pueden sumar hasta ~14 puntos.
