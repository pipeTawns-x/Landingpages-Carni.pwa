# Rediseño del MVP · plan y estado

Esta es la fuente única del avance de la etapa de código (desde 2026-09-30). Si el límite de uso corta el trabajo, se retoma en la primera fase que no diga HECHO.

Autorización: Eduardo autorizó el código el 2026-09-30 ("desarrollar el rediseño en el MVP, React + Tailwind", "ya no me preguntes"). Las etapas de diseño en Claude Design terminaron con `Diseño1.1.zip`.

## Encargo de Eduardo (2026-09-30)

- Entregar el primer rediseño del MVP en React + Tailwind v4, abierto en Brave para que él lo verifique.
- Landing:
  - orden exacto: portada, mostrador, carrusel de Filete Mignon, lo que se lleva la gente, ofertas, preguntas frecuentes, carnicería de familia, horarios y puntaje, contacto y dirección, comentarios, pie;
  - en móvil el video no debe ser tan alto: tamaño YouTube (16:9), como fondo del texto, ajustado al bloque;
  - volver el efecto del Encabezado: al pasar el cursor el fondo cambia y se mezcla con el video (móvil primero y escritorio).
- Logotipo tipográfico en lugar de la imagen.
- Chatbot de IA más cuidado: no un chat común. "¿Te ayudo a elegir tu corte?", un ícono SVG propio, sin inventar respuestas (falta backend).
- Catálogo, inicio de sesión, registro, carrito, slider y menú hamburguesa: misma edición y la misma Tarjeta de producto.
- Panel: seguro; y **ninguna ventana, slider ni menú sin su X para cerrar** (falla del AdminNav en el diseño).
- Estándar: desarrollador y diseñador senior; nada que un profesional de UX/UI no permitiría.
- Seguridad: Cyber Neo, Supabase, Django. Revisar lo último del chat de backend (que se perdió) y de OpenCode.
- Orden: investigación → abogado del diablo → arquitecto → desarrollo por unidades → revisión → abrir en Brave. Sin preguntar. Guardar el avance en cada paso y pausar entre el 80 y el 90 % del límite de 5 horas.

## Fases

| Fase | Qué | Quién | Estado |
|---|---|---|---|
| R0 | Presupuesto, export 1.1 medido (30 de 43), skills resueltas | orquestador | HECHO |
| R1 | Investigación en paralelo (4 informes en `investigacion/`) | 4 agentes | HECHO (costó 46 puntos del límite de 5 h) |
| R2 | Abogado del diablo → `05-abogado-del-diablo.md` | 1 agente (opus) | HECHO |
| R3 | Arquitecto → `06-plano.md` | 1 agente (opus) | HECHO |
| R4 | Desarrollo por unidades (ver "Unidades de R4") | escritores, uno por unidad | pendiente |
| R5 | Revisión fresca, seguridad y pruebas | agentes | pendiente |
| R6 | Abrir en Brave y entregar a Eduardo | orquestador | pendiente |

## Lo que dice la investigación (resumen para no releer 140 KB)

Informes: `investigacion/01-export-1.1.md`, `02-sitio-actual.md`, `03-backend-y-opencode.md`, `04-referencias-e-iconos.md`.

**Diseño 1.1**
- Los 16 `.dc.html` traen el runtime de Claude Design: pasar a React es reescritura, no conversión.
- El sistema visual es coherente: fondo casi negro, un rojo, arena, Fraunces y Geist, sin sombras. Componentes ya trae un bloque `@theme` de Tailwind v4.
- El orden de la Landing cumple. El ✗ del verificador es un falso negativo (tomó "Filete Mignon" del texto introductorio).
- Siguen PARCIAL en el diseño: Métricas del chatbot (43 a 45), Acceso con mascota, cuadro de Movimiento e Índice con miniaturas.
- Hero móvil de 388×700 (83 % de la pantalla): es lo que Eduardo quiere reducir. Un 16:9 a 390 mide 219 px.
- AdminNav móvil dibuja una hamburguesa sin cajón: por eso no hay X. "Más" solo enlaza a Productos.
- Las hojas de tienda y compra sí tienen X, pero ninguna define cierre por toque en el fondo. Las confirmaciones del panel cierran solo con "Cancelar".
- La burbuja del asistente es un chat genérico (círculo de 56 px con glifo estándar).
- El carrusel Filete Mignon recorre 8 cortes distintos, pero título, precio y botones son estáticos.

**Sitio actual**
- El efecto viejo del Encabezado: `css/layout/_header.scss:65-98` (transparente sobre el video, velo degradado, `rgba(0,0,0,.92)` en `:hover` y `:focus-within`, hero con margen negativo) y `src/entry/home.tsx:192-270` (IntersectionObserver).
- El prototipo Tailwind (`landing.html`, `src/landing/`, `src/ui/`) está viejo frente al diseño 1.1: encabezado opaco, Opiniones antes que FAQ y Ofertas, redes vacías, "Paquete Carnitas por Kilo", sin chatbot.
- `supabase.js:10-14` lanza al importarse sin variables `VITE_*`; el worktree pruebas no tiene `.env`.
- Docker: el contenedor `carni-landing-dev` existe y está detenido (puerto 3002). Todo npm va con `docker exec carni-landing-dev npm ...`. Se abre con `docker start carni-landing-dev` y luego `http://localhost:3002/landing.html`.
- GGA falla en los commits de código porque corre bajo bash 3.2. Con `PATH=/opt/homebrew/bin:$PATH` carga bien.
- El chatbot solo existe en vanilla (`js/modules/chatbot.js`). Lupa y CartPanel ya traen X, Escape y foco: son la base de la nueva Hoja.

**Backend y OpenCode**
- El panel de hoy es 100 % Supabase (supabase-js con el JWT del usuario, RLS `is_admin()`). Django es solo un panel local de inventario (`/inventario/`, sin API), no está en `main` ni en producción.
- **Riesgo alto:** los clientes pueden escribir `orders` y `order_items` directo (estado, total, precios), saltándose el RPC de precios del servidor. `orders` tiene 0 filas: arreglarlo hoy es barato.
- Advisors de Supabase: 4 funciones con `search_path` mutable, 10 funciones SECURITY DEFINER ejecutables por `anon`, protección de contraseñas filtradas apagada.
- El bundle está limpio de claves privadas. El CSP de `netlify.toml` conserva `unsafe-inline` y `unsafe-eval`.
- Último trabajo del chat de backend: M13 entregado el 2026-09-21. OpenCode iba en M14 (`seed_demo_products`), con los subagentes fallando por cuota del modelo; no hay nada implementado.
- OpenCode guarda en Engram bajo el proyecto `Carni-mvp` (con mayúscula), invisible para las búsquedas de `carni-mvp`.

**Referencias e íconos**
- Recetas probadas en Chromium: encabezado con vidrio (`@custom-variant glass`: scroll, foco dentro o hover con puntero fino), hero móvil `aspect-video` que crece con el texto, carrusel con scroll-snap y botones, asistente, cierre con `<dialog>` + `showModal()`.
- El video baja de 1.6 MB a 405 KB con 640×360 H.264 CRF 30 sin audio.
- Íconos: Lucide (ISC) como único set + los 14 propios + dos SVG propios (cuchilla y burbuja con cleaver). game-icons.net exige atribución (CC BY 3.0) y su estilo choca con el trazo.
- Evidencias en `investigacion/04-evidencia/`.

## Decisiones ya tomadas (Eduardo dijo "no me preguntes")

Cada una sale de la investigación. El abogado del diablo puede cambiarlas con razones.

1. **Carrusel Filete Mignon:** 8 cortes distintos; título, descripción, precio y botones siguen a la foto activa y salen de la base (un $689 fijo sería falso para los otros cortes).
2. **Hero móvil:** 16:9 mínimo (unos 219 px a 390) que crece con el texto, con el video de fondo y velo. En escritorio, 85 svh a sangre.
3. **Efecto del Encabezado:** transparente sobre el video; con scroll, foco dentro o hover con puntero fino toma vidrio (`backdrop-blur`) que se mezcla con el video. En táctil no hay hover: vidrio al primer scroll.
4. **Panel en móvil:** hamburguesa con cajón nuevo (`<dialog>`, X, Escape, toque en el fondo, foco devuelto) con Clientes, Chatbot, BuildAds, ProductAds, Ajustes y "Cerrar sesión" (que llama `signOut()`).
5. **Todo overlay** (carrito, menú, panel, modales, chat, confirmaciones destructivas) lleva X visible, Escape, toque en el fondo y trampa de foco. El carrito pasa a ser modal, con velo ligero en escritorio.
6. **Acceso:** se conserva el panel rojo con el carnicero (Eduardo lo eligió), con los archivos de `docs/design/assets/mascota/`.
7. **Chatbot:** burbuja con SVG propio de cleaver, saludo "¿Te ayudo a elegir tu corte?", chips (para asar, para guisar, cuánto por persona, horario), busto del carnicero como avatar. Solo respuestas guiadas; nunca precios ni existencias inventados. Rótulo "Respuestas guiadas, no es una persona" hasta que haya backend.
8. **Íconos:** Lucide + los propios (nueva dependencia `lucide-react`, instalada dentro de Docker).
9. **Rutas:** el rediseño vive en `landing.html` (y las demás entradas nuevas) hasta que Eduardo autorice reemplazar `index.html` (regla de AGENTS.md). Se abre en Brave en `http://localhost:3002/landing.html`.
10. **Datos vivos:** se crea `.env` en pruebas con la URL de Supabase local (`http://localhost:54321`) y su clave anónima local, sin imprimir valores. Sin ese archivo Brave cae al seed.
11. **Recursos:** el video (405 KB en 640×360 y el grande) y la mascota se copian a `public/`. Los assets pesados (uploads, capturas-actuales) no entran al repo.
12. **Panel v1:** habla solo con Supabase (PostgREST/RPC), como hoy. Django queda aparte; no se le inventa una API.
13. **Seguridad de pedidos:** se redacta una migración propuesta (cerrar INSERT/UPDATE directo en `orders` y `order_items`, revocar EXECUTE a `anon` en las SECURITY DEFINER, `search_path` fijo). **No se aplica**: `supabase/migrations` es contrato común con el chat de backend. Va como propuesta en `docs/design/rediseno/seguridad/` y en el handoff `handoff/chat-backend-desde-frontend`.
14. **Commits:** `PATH=/opt/homebrew/bin:$PATH git commit ...` — con ese PATH el hook GGA pasó en el commit de la investigación (77d19808); sin él falla con "No provider configured". Si aun así falla, `--no-verify` y se avisa a Eduardo. Comprobar siempre con `git log -1` que el commit existe.
15. **Correo y "confirmar con el dueño":** se usa el correo del sitio actual; "confirmar con el dueño" es nota interna y no sale al cliente.

## Unidades de R4 (cada una ≤ 15 % del límite de 5 h; una por ventana si hace falta)

| Unidad | Qué | Archivos que toca (para no chocar) |
|---|---|---|
| U-A | Base: `.env`, Docker arriba, tokens Tailwind del diseño, fuentes autoalojadas, `lucide-react`, Hoja (`<dialog>`), copia de recursos a `public/` | `src/styles/`, `src/ui/Hoja.tsx`, `src/ui/iconos.tsx`, `public/`, `package.json` |
| U-B | Encabezado con vidrio, Portada (video 16:9 móvil / 85 svh escritorio), Pie, logotipo | `src/ui/Encabezado.tsx`, `src/ui/Pie.tsx`, `src/landing/Portada.tsx` |
| U-C | Landing en el orden exacto, carrusel dinámico, Ofertas, FAQ, Familia, Horarios y puntaje, Contacto, Comentarios | `src/landing/*` (excepto Portada) |
| U-D | Catálogo y ficha, Tarjeta, carrito (Hoja), menú hamburguesa, Lupa | `src/pages/`, `src/components/` |
| U-E | Acceso (Ingresar / Registrarse) con la mascota | `src/entry/`, `src/pages/` de acceso |
| U-F | Chatbot | `src/ui/Asistente*.tsx` |
| U-G | Panel: cajón móvil, X, cierre de sesión con `signOut()`, Chatbot en AdminNav | `src/pages/` de panel |

Las unidades con archivos distintos pueden ir en paralelo. Cada una termina con: typecheck y build dentro de Docker, y una captura en 390 y 1440.

## Graphify (después del reinicio, no antes)

Los grafos de código se regeneran solos con cada commit (sin gastar modelo). Falta indexar el diseño: `docs/design/rediseno/` (informes) y los `.dc.html` de `Diseño1.1.zip`. Graphify lo hace con el modelo, así que gasta límite: correrlo una vez al inicio de R2, solo sobre los informes y los tres `.dc.html` clave (Landing, AdminNav, Inicio de sesión), no sobre las capturas.

## Para retomar

Cuando el límite se reinicie, escribe "retoma" en el chat de Claude Code del frente de diseño. El orquestador lee este archivo y sigue en R2:
1. Mide el presupuesto.
2. Lanza el abogado del diablo y el arquitecto con `model: opus` y con las rutas de las skills.
3. Sigue con R4 por unidades.

## Bitácora

- 2026-09-30 · R0 · 5 h 35 % · semanal 54 % · contexto 52 % · SIGO.
- 2026-09-30 · R1 HECHO · 4 informes en `investigacion/` (1.9 MB con evidencias). 5 h **81 %** (se reinicia en 2 h 18 min) · semanal 59 % · contexto 55 % · **PAUSO**: la investigación gastó 46 puntos; lanzar Opus y escritores ahora los cortaría a medias.
- 2026-09-30 · R2 preparado · contexto previo destilado en `contexto-previo.md`. 5 h **84 %** · semanal 59 % · contexto 58 % · sigue PAUSO. Graphify sobre el diseño queda para R2 porque usa el modelo.
- 2026-09-30 · RETOMA · el límite se reinició: 5 h **0 %** (4 h 52 min) · semanal 59 % · contexto 59 % · SIGO. Lanzado R2 + R3 (abogado del diablo y arquitecto, opus, en cadena) → `05-abogado-del-diablo.md` y `06-plano.md`. Graphify sobre el diseño se omite: los informes destilados cubren lo mismo y ahorra límite.
- 2026-09-30 · Eduardo exige que el abogado del diablo y el arquitecto digan CÓMO se hace el rediseño con el stack agéntico: skills, si se usan agentes, cuántos y qué hace cada uno. Se detuvo la primera corrida y se relanzó como v2 (wf_46237072-6e5): el abogado critica el plan agéntico y propone una plantilla de roles; el arquitecto abre `06-plano.md` con la sección "0. Plan agéntico" (plantilla de agentes, orquestación, skills por fase, costo). Si se corta: `Workflow({scriptPath, resumeFromRunId: "wf_46237072-6e5"})`.
- 2026-09-30 01:05 · R2 y R3 HECHOS · `05-abogado-del-diablo.md` (12 cambios) y `06-plano.md` (plano con plan agéntico, 127 KB, completo hasta §8). El arquitecto escribió el archivo y luego lo cortó el límite de sesión antes de devolver su resumen; el archivo está íntegro. Límite reiniciado: 5 h **6 %** · semanal **71 %** (alto: ahorrar) · contexto 62 %. Siguiente: leer §Resumen y §0 del plano y ejecutar U0.
