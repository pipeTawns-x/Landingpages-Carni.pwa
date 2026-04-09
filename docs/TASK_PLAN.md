# Task Plan

## Objetivo actual

Entregar Carni-mvp como MVP frontend estable con capa agentica local minima, contenedor reproducible y estructura de assets/documentacion sin conflicto con el stack global.

## En progreso

- consolidar `img/` a tres carpetas operativas
- dejar `docs/` reservado a planes
- mantener el flujo con human-in-the-loop para cambios estructurales futuros

## Completado

- Docker consolidado en `.devcontainer/`
- auth y rutas principales corregidas a la raiz
- banner real unificado en `img/recursos_web/`
- capa local simplificada en `AGENTS.md` y `agents/AGENTS.md`

## Siguiente corte recomendado

1. conectar Supabase real con RLS y tablas productivas
2. reemplazar placeholders admin por CRUD funcional
3. validar catalogo, carrito y auth con pruebas E2E
