# Implementation Plan

## Base tecnica activa

- entrypoints HTML en raiz
- SCSS 7-1 en `css/`
- modulos ES en `js/modules/`
- PWA con `manifest.json`, `offline.html` y service worker
- desarrollo Node/Vite dentro de `.devcontainer/`

## Capa agentica local

- `AGENTS.md`: punto de entrada para herramientas
- `agents/AGENTS.md`: reglas locales del producto
- `agents/STITCH_REDESIGN_PROMPT.md`: referencia visual para tareas de UI

## Regla de convivencia con stack-ia

1. el orquestador principal sigue en la capa global del usuario
2. el repo solo versiona restricciones propias del producto
3. si una regla local compite con la global, la local debe reducirse
4. cambios estructurales futuros requieren human-in-the-loop

## Estructura de assets

- `img/carrusel_products/`: hero y carrusel de landing
- `img/products/`: categorias, cortes y fallbacks del ecommerce
- `img/recursos_web/`: logo, auth y banner del repo

## Prioridades de implementacion

1. estabilidad de rutas y assets
2. consistencia documental y de entorno
3. integracion progresiva con backend real sin romper el frontend actual
