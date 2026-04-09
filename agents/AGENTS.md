# AGENTS.md — Reglas Locales de Carni-mvp

Estas reglas son locales al repo.
No sustituyen `stack-ia` ni `gentle-ai`; solo agregan contexto del producto, del flujo de trabajo y de las restricciones tecnicas de Carni-mvp.
El orquestador principal sigue viviendo en la capa global del usuario y debe mantenerse activo.

## Prioridad de Capas

1. Capa global del usuario: `stack-ia` / `gentle-ai`
2. Reglas locales de Carni-mvp
3. Instrucciones ad hoc de una tarea puntual

Si una regla local contradice la capa global, gana la capa global.

## Objetivo del Repo

Carni-mvp es un MVP frontend para una carniceria con landing, catalogo, auth, carrito, PWA y dashboard admin base.

La meta local es evolucionar el producto sin romper la base funcional actual.

## Reglas para Desarrolladores y Colaboradores

- Mantener entrypoints HTML en raiz: `index.html`, `products.html`, `accessweb.html`, `dashboar.html`.
- No renombrar rutas ni mover HTML sin revisar referencias en JS, CSS, manifest y service worker.
- Mantener SCSS 7-1 dentro de `css/` y JS modular dentro de `js/modules/`.
- Variables publicas del frontend solo con prefijo `VITE_*`.
- El contrato local de entorno es `.env`; no agregar archivos espejo de entorno ni duplicados documentales.
- No hardcodear secrets en codigo fuente.
- El flujo de Node/Vite se ejecuta dentro de `.devcontainer/`.
- Documentar como actual solo lo que realmente existe y funciona en el repo.

## Reglas para Agentes, MCPs y Herramientas de IA

- No crear una segunda plataforma agentica dentro del repo.
- No generar `skills`, `subagents`, `orchestrators` o instrucciones locales nuevas salvo que el usuario lo pida explicitamente.
- Usar estas reglas locales solo para restricciones del producto y del repo.
- No tocar otros proyectos del workspace cuando el usuario delimite el alcance a Carni-mvp.
- Antes de cambios estructurales, borrados, renombres o limpieza agresiva, aplicar human-in-the-loop.
- La orquestacion obligatoria de tareas complejas sigue el stack global; esta capa local solo define guardrails de producto.

## Human In The Loop

Se requiere aprobacion explicita antes de:

- borrar archivos o carpetas fuera de lo pedido exactamente
- renombrar rutas publicas o assets usados por la web
- mover estructura HTML, CSS o JS que pueda romper paginas
- cambiar contrato de variables de entorno o integraciones
- introducir una capa local nueva de instrucciones/skills/agentes

## Contexto Visual y Producto

- La direccion visual objetivo es maximalismo mexicano equilibrado.
- El dashboard debe sentirse operativo, no generico.
- El rediseño puede evolucionar a bento grid si mantiene claridad comercial.
- Astro, Tailwind y Alpine son objetivos de evolucion, no estado actual del repo.

## Archivos Locales de Referencia

- `README.md`
- `docs/TASK_PLAN.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `agents/STITCH_REDESIGN_PROMPT.md`

## Limite de Esta Capa Local

Este repo no debe replicar la estructura completa de VESTA-dashboard.
Solo debe conservar reglas y contexto local utiles para colaboradores humanos y agentes.
