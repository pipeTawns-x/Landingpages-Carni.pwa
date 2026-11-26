# Rediseño Carni-mvp en el lugar — tramo 1

Objetivo: restaurar y pulir los efectos perdidos del rediseño (postmortem E1–E17), migrando en el lugar, con TDD y capturas.
Rama: `feature/loop-vertical-carni` (worktree `.claude/worktrees/loop-carni`, base `origin/practicas-ebac` = 4e4422af).
Runner: `npx jest` (node+react), `npm run build`, servidor `npm run dev` puerto 3002 (nohup, log /tmp/vite-worktree.log).

## Specs (palabras de Eduardo, verbatim)

- S1: "no es que inventes un dieño es que adaptes el que ya esta utilizando los recursos para crear un rediseño modernos esteticos funcionales con img animaciones etc"
- S2: "deja de hacer documentos" (este archivo es el único permitido).
- S3: rechaza imagen sobre imagen, textos cortados, imágenes repetidas, páginas planas, animaciones trabadas.
- S4 (#501): encabezado transparente→NEGRO sólido al bajar ("acá es negro así que nos funcionará un color negro"); bento en reposo solo foto+nombre, descripción y botón bajan al hover; en táctil todo abierto.
- S5 (E5, original `css/pages/_bento-main.scss:255-264`): entrada escalonada de categorías: opacidad 0→1, `translateY(18px)`, 0.45 s, retraso por tarjeta (`--reveal-delay`), observador con `alreadyPassed` + failsafe 1500 ms (`src/entry/home.tsx:48-144`).
- S6 (E6, original `_bento-main.scss:300-410` + `:85-130`): hover con sombra `0 12px 28px rgba(0,0,0,.45)`, borde rojo `rgba(220,38,38,.35)` y zoom `1.08` de la foto (solo transform); revelado `0fr→1fr` 0.38 s `cubic-bezier(0.22,1,0.36,1)` solo bajo `@media (hover:hover) and (pointer:fine)`; `:focus-within` abre igual.

## Tasks

| ID | S# | Historia | Estado | Evidencia |
|----|----|----------|--------|-----------|
| T1 | S4 | H1 Encabezado: verificar sobre-video/hover/negro-sólido en vivo; capturas 1440+390 | en curso | capturas antes/después |
| T2 | S5,S6 | H2 Bento: entrada escalonada + hover (zoom 1.08, borde rojo, sombra, revelado) con RED→GREEN | en curso | test nuevo + capturas + commit |

## Log

- L1 (2026-11-04): pedido de Eduardo (tramo 1, dos historias, una por commit, capturas antes/después, sin push). Línea base: `npx jest` 156/156 ✅, `npm run build` ✅ (2.26 s), servidor 200 OK desde el worktree. Las 12 fallas previas eran el node_modules de main sin lucide-react (arreglado por Eduardo con npm ci en el worktree).
- L1b: recursos leídos: kit carni-mvp, postmortem (E1–E17), Engram #501, estilo-eduardo (quiere/rechaza/referencias), steak-house ficha, skills servidor-vivo-carni, migracion-incremental, emil-design-eng, animate. Playwright sin Brave conectado (targets vacío) → uso el Playwright del MCP; se reporta.
