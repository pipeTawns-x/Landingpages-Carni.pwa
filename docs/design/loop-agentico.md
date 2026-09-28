# Loop agéntico · última pasada del rediseño

Eres el orquestador de Claude Code de Carni-mvp. Este loop termina el rediseño en Claude Design con agentes y puntos de control, sin gastar de más y sin perder avances.

**No escribe código.** Termina cuando el rediseño queda verificado.

## Arranque y reanudación

- Se corre en una sesión nueva de Claude Code, abierta en `~/Desktop/Carni-mvp-pruebas` (rama `pruebas`) y en modo auto.
  - Una sesión nueva sale más barata que una larga, porque cada turno vuelve a leer todo el contexto.
  - Con Sonnet basta, porque el orquestador solo coordina.
- Eduardo pega siempre la misma línea, tanto para arrancar como para retomar:

```
/goal Sigue docs/design/loop-agentico.md desde docs/design/loop-estado.md. La meta se cumple cuando tu último mensaje imprime "REDISEÑO TERMINADO", un PUNTO DE CONTROL con PAUSO o PAUSO YA, una línea para Claude Design o una pregunta para Eduardo; si no, detente tras 40 turnos.
```

- Al arrancar:
  1. Lee `docs/design/loop-estado.md` y `mem_search("loop/rediseno-final/estado", project: "carni-mvp")`.
  2. Comprueba con `git log` y con las rutas de evidencia que lo marcado "hecho" existe de verdad.
  3. Si hay en `~/Downloads` un .zip con archivos `.dc.html` más nuevo que la última unidad hecha, la siguiente unidad es verificar esa pasada.
  4. Si no lo hay, sigue en la unidad de "Siguiente".

## Reglas del orquestador

1. Aplica la skill `punto-de-control` después de cada unidad y cada vez que vuelva un agente, e imprime su bloque. Con PAUSO o PAUSO YA, termina el turno.
2. Coordinas; no produces ni investigas a mano.
   - Cada agente recibe rutas exactas (nunca "explora"), las rutas de las skills que debe leer (salen de `.atl/skill-registry.md`) y dónde guardar su trabajo.
   - Devuelve 300 palabras o menos y deja sus entregables en el repo antes de volver, nunca solo en /tmp.
3. Los agentes usan `model: sonnet`. `opus` solo en U10, y solo si el punto de control dice SIGO.
4. Dos agentes nunca escriben el mismo archivo. Los que no dependen entre sí van en paralelo y en segundo plano.
5. Si un agente muere por límite (429), se retoma con SendMessage; no se relanza.
6. A Eduardo, una sola pregunta a la vez, y solo si bloquea.
7. Lo que el negocio no hace hoy se marca "falta backend" o "confirmar con el dueño".
8. En cada commit agrega rutas exactas, nunca `git add .`.
   - Nunca subas el código aparcado de la landing: `landing.html`, `src/entry/landing.tsx`, `src/landing/`, `src/ui/`, `src/styles/tailwind.css`, `vite.config.js`, `package*.json`, `docs/design/mockups/`.
   - Tampoco subas `.atl/skill-registry.md`.

## Equipo

| Rol | Agente | Skills que lee |
|---|---|---|
| Verificador | general-purpose, contexto limpio | web-design-guidelines, impeccable, review-animations y `docs/design/skills/emil-kowalski/review-animations/STANDARDS.md` |
| Estudio visual | estudio-visual | hyperframes, hyperframes-animation, claude-banana, media-use |
| Movimiento | general-purpose | emil-design-eng, animate, apple-design, mobile-native, animation-vocabulary |
| Referencias | general-purpose | investigador |
| Abogado del diablo | general-purpose, contexto limpio | abogado-del-diablo, hallmark, design-taste-frontend |
| Juicio final | jd-judge-a y jd-judge-b | judgment-day |
| Pendientes | orquestador | pendientes-carni |

## Cómo trabaja Claude Design

Claude Design pinta el lienzo y gasta del mismo límite de 5 horas y semanal que Claude Code. En cada pasada:

1. El punto de control confirma que el límite de 5 horas va por debajo del 50 %. Si no, PAUSO hasta que se reinicie.
2. Imprimes para Eduardo la línea de la pasada, con N = 1, 2 o 3:
   `Lee docs/design/loop-final.md (rama pruebas) y ejecuta solo la PASADA N.`
3. Cuando Claude Design escriba "PASADA N LISTA", Eduardo:
   - exporta el proyecto en .zip (Export → .zip) a `~/Downloads`;
   - pega la línea fija.

   El reporte viaja dentro del .zip, en la Bitácora del Índice.
4. El verificador:
   - descomprime ese .zip en una carpeta temporal;
   - sirve las páginas en local;
   - mide con Playwright a 1440 y a 390;
   - escribe su informe en el repo.
5. Si algo falla, imprimes una línea de correcciones para Claude Design, de 10 renglones o menos:
   `Correcciones de la PASADA N: <lista>. Anota cada una en la Bitácora y escribe "CORRECCIONES N LISTAS".`
   - Después se verifica otra vez solo lo que falló.
   - Hay una sola ronda por pasada; lo que siga fallando va a Pendientes.

## Unidades

| # | Unidad | Quién | Entregable | Acepta si |
|---|---|---|---|---|
| U0 | Estado inicial | orquestador | `docs/design/loop-estado.md` | existe y está en Engram |
| U1 | Pasada 1 a Claude Design | orquestador | la línea de la pasada 1 | 5 h por debajo del 50 % |
| U2 | Verificar pasada 1 | verificador | `docs/design/verificacion/pasada-1/informe.md` | 0 `href="#"`; existen Índice, Mis datos y Datos de la tienda y redes; cada título corregido medido a 4.5:1 o más |
| U3 | Tiras de movimiento | movimiento y estudio visual | `docs/design/assets/movimiento/` con README | una tira de 3 cuadros por fila de 2.1, con duración y curva impresas |
| U4 | Referencia de foto | estudio visual | `docs/design/assets/fotos-referencia/` con README | 3 bodegones con un solo tratamiento, rotulados "Referencia, no es el producto" |
| U5 | Pasada 2 a Claude Design | orquestador | la línea de la pasada 2 | 5 h por debajo del 50 % |
| U6 | Verificar pasada 2 | verificador | `docs/design/verificacion/pasada-2/informe.md` y capturas | Landing a 1440 sin caja negra; contraste del titular medido sobre el cuadro más claro del video; 1 botón rojo lleno por vista del catálogo; tabla de Movimiento con sus tiras |
| U7 | Referencias del chatbot | referencias | `docs/design/referencias/capturas/chatbot-*.jpg` | 2 paneles de métricas de chatbots reales y 1 cuadro del video que mandó Eduardo (youtube l7ll5zTLHso, minuto 31:25) |
| U8 | Pasada 3 a Claude Design | orquestador | la línea de la pasada 3 | 5 h por debajo del 50 % |
| U9 | Verificar pasada 3 | verificador | `docs/design/verificacion/pasada-3/informe.md` | tira del acceso sin dos personajes en ningún cuadro; pantallas del chatbot; teléfono enmascarado; Chatbot entre Clientes y BuildAds |
| U10 | Revisión final | abogado del diablo; juicio final si hay SIGO | `docs/design/verificacion/final.md` | 5 correcciones o menos, cada una con su pantalla y su medida |
| U11 | Pendientes | orquestador | `docs/PENDIENTES.md` | backend, fotos reales y decisiones del dueño, sin duplicados |
| U12 | Cierre | orquestador | commit y push a `pruebas`, solo docs | imprime "REDISEÑO TERMINADO" |

- **U3, U4 y U7 son opcionales.** Solo se hacen con SIGO. Con SIGO EN CORTO se saltan: Claude Design dibuja las tiras y usa las referencias que ya existen.
- **U4 instala software.** Necesita `mflux` y un modelo de 4.6 GB (FLUX.2 klein 4B), que corre local y gratis en este Mac.
  - Antes de instalar, pregúntale a Eduardo una vez. Si dice que no, se salta.
  - Una imagen de IA nunca pasa por foto de producto (LFPC art. 32). Solo sirve como referencia rotulada o en lugar de una "foto pendiente".
- **Las correcciones de U10** usan una sola línea para Claude Design y una sola verificación más.

## Cierre

Con U12 hecho:
1. Imprime el último PUNTO DE CONTROL.
2. Llama a `mem_session_summary` con el proyecto `carni-mvp`.
3. Imprime "REDISEÑO TERMINADO", con lo que falta y con la fase siguiente: la lista de diferencias entre el diseño y la web actual, cada una cuestionada, para que Eduardo la confirme antes de tocar código.

Y ahí te detienes. No empieces código.
