# LOOP-BACKEND-PANEL · agente de backend (Django + Supabase) · rama practicas-ebac

Se trabaja en ramas de tema desde `practicas-ebac`; cada fase sale en un PR y Eduardo lo mergea. La coordinación con el rediseño está en `docs/CONTRATO_PANEL_DJANGO.md`.

## 1. Propósito y alcance

- Servir el panel administrativo con Django sobre el HTML que ya existe, rediseñado en el lugar por el otro agente.
- Las prácticas M13 (vistas), M14 (modelos y admin) y M15 (plantillas) quedan como partes reales de ese panel.
- QUÉ NO SE HACE:
  - páginas o paneles paralelos;
  - plantillas con un diseño propio;
  - DDL sobre tablas de Supabase;
  - migraciones aplicadas sin el OK de Eduardo;
  - entregas con capturas que no muestren el proyecto rediseñado.

## 2. Contexto a leer primero

1. `docs/DECISION_PANEL_DJANGO_2026-10-06.md` y `docs/CONTRATO_PANEL_DJANGO.md`.
2. Engram `carni-mvp`, también `Landingpages-Carni.pwa` porque está partido: `panel-django/*`, `frontend/entrega/*` y `revision/frontend-a-backend/*`.
3. `docs/PANEL_DJANGO_ESTADO.md`, que dice dónde retomar.
4. El diseño: `docs/design/claude-design-1.1/` (Inventario Django 28–33; Productos 22–24).

## 3. Reglas duras

- Una slice por commit. Commit convencional bilingüe "tipo(ámbito): English / español", sin atribución a IA. `git add` con rutas exactas. Nunca `--no-verify`.
- `migrate` siempre con la etiqueta de la app. Las tablas de Supabase son `managed = False`.
- Dinero siempre `Decimal`. Python con `uv`; npm solo en Docker.
- Toda plantilla del panel nace de un archivo HTML que ya existe (`git mv`). El commit dice cuál.
- Si una ruta cambia, se buscan con `rg` todas las referencias y se actualizan en el mismo commit.
- Commits de producto y de curso, separados.

## 4. Equipo

| Rol | Qué hace |
|---|---|
| Orquestador | El único que commitea |
| Escritor | Subagente que implementa |
| Revisor | Contexto fresco, otro subagente |
| Seguridad | Revisa el traspaso de sesión y los permisos |
| QA visual | Capturas a 390 y 1440 |

Si algo falla dos veces, se escala a Eduardo.

## 5. Pasos

### Fase 0 · acuerdo
- B0. Decisión, contrato, este loop y el estado (este commit).

### Fase 1 · cimientos (B6 y B7 esperan al rediseño)
- B6. Tokens sincronizados desde `pruebas` y Tailwind standalone en Docker. Espera a S1.
- B7. `panel/base.html` a partir de `dashboar.html` movido. Espera a S2.
- B8. Traspaso Supabase → Django con JWKS y rol de admin, más la migración de lectura de `profiles` (solo local).
- B9. Salida real, `panel_admin_required` en cada vista, cookies seguras y CSP.

### Fase 2 · Productos en el panel (M13 corregida)
- B1. Bug: la ficha con todos los valores en cero.
- B2. `inventory/services.py`, con mirrors de solo lectura de `OrderItem` y `Favorite`.
- B10. Lista: `admin-products.html` movido + buscador, chips, paginación y estado vacío.
- B11. Detalle.
- B12. Formulario.
- B13. Confirmaciones.
- B14. Rutas `/panel/productos/`.
- B15. El `base.html` claro de la M13 se reemplaza.

### Fase 3 · M14 integrada y entrega
- B4. Django Admin con las mismas reglas del panel.
- B3. Historial de cambios (opcional).
- B5. Entrega M14: Word con capturas del panel rediseñado y mensaje para el LMS.
- B17. M15 Django Templates.

### Backlog (en orden)
1. Seguridad de pedidos.
2. Ajustes / `store_settings`.
3. Pedidos (kanban).
4. KPIs de Inicio.
5. Clientes.
6. Métricas del chatbot.
7. BuildAds.
8. Hosting y CI.
9. Columna `unit`.

## 6. Gates (cada slice)

```bash
cd backend
uv run ruff check . && uv run ruff format --check .
uv run python manage.py check && uv run python manage.py makemigrations --check --dry-run
uv run python manage.py test
```

En slices de interfaz, además:
- capturas a 390 y 1440 comparadas con el kit del rediseño;
- 0 errores de consola.

El SQL se prueba dentro de `BEGIN … ROLLBACK` en el Postgres local.

## 7. Auditor después de cada commit

- ¿Una sola slice?
- ¿Solo rutas del backend?
- ¿Nada de DDL sobre `public`?
- ¿Toda URL nueva exige admin?
- ¿Solo `Decimal`?
- ¿Referencias buscadas con `rg`?
- ¿Mensaje bilingüe?
- ¿La plantilla nació de un archivo existente?

## 8. Guardar y retomar

- Una línea por slice en `docs/PANEL_DJANGO_ESTADO.md` (sha, gates, siguiente) y una nota en Engram `panel-django/progreso`.
- Se retoma en la primera slice que no esté HECHA.
- Las páginas se piden al rediseño en Engram `contrato/pedido/<pagina>`.

## 9. Mensaje de arranque

Retoma desde `docs/PANEL_DJANGO_ESTADO.md`. No preguntes nada que no sea una decisión de Eduardo. Si algo bloquea, anótalo como BLOQUEADO y sigue con la siguiente slice independiente.
