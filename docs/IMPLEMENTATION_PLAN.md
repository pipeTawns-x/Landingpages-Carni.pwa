# Implementation Plan

## Base tecnica activa

- entrypoints HTML en raiz
- SCSS 7-1 en `css/`
- modulos ES en `js/modules/`
- PWA con `manifest.json`, `offline.html` y service worker
- desarrollo Node/Vite dentro de `.devcontainer/`
- build productivo actual con `vite build`
- practica Node.js aislada en `app.js` con `axios`, `dotenv` y `chalk`

## Capa agentica local

- `AGENTS.md`: punto de entrada para herramientas
- `agents/AGENTS.md`: reglas locales del producto
- `agents/STITCH_REDESIGN_PROMPT.md`: referencia visual para tareas de UI
- `.github/agents/`: agentes locales descubribles por VS Code para orquestacion, frontend, Node y documentacion
- `.github/skills/`: skills locales reutilizables para frontend guardrails, Node/EBAC y release checks

## Regla de capas

- capa local del repo: `AGENTS.md`, `agents/AGENTS.md`, `.github/agents/`, `.github/skills/`
- capa global del usuario: `stack-ia` / `gentle-ai` / `engram`
- la capa local agrega contexto de Carni-mvp y no reemplaza el orquestador global

## Regla de convivencia con stack-ia

1. el orquestador principal sigue en la capa global del usuario
2. el repo solo versiona restricciones propias del producto
3. si una regla local compite con la global, la local debe reducirse
4. cambios estructurales futuros requieren human-in-the-loop

## Validacion actual

- `npm run build`: validacion principal del frontend/PWA
- `node --check app.js`: validacion sintactica minima de la capa Node.js
- GitHub Actions debe ejecutar ambos pasos en cada push para evitar drift entre el repo y la entrega

## CI minima requerida

- workflow en `.github/workflows/ci.yml`
- Node `20.19.0` para alinear Vite y Netlify
- `npm ci`
- `node --check app.js`
- `npm run build`
- verificacion de entrypoints generados en `dist/`

## Estructura de assets

- `img/carrusel_products/`: hero y carrusel de landing
- `img/products/`: categorias, cortes y fallbacks del ecommerce
- `img/recursos_web/`: logo, auth y banner del repo

## Prioridades de implementacion

1. estabilidad de rutas y assets
2. consistencia documental y de entorno
3. integracion progresiva con backend real sin romper el frontend actual
4. mantener la capa local agentica pequena, util y compatible con `stack-ia`
5. automatizar validacion minima con CI antes de escalar a backend real
