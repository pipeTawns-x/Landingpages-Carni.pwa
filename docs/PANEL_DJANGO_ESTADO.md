# Estado del panel Django (backend)

Se actualiza en cada slice. Se retoma en la primera que no esté HECHA.

| Slice | Qué | Estado | Sha | Espera |
|---|---|---|---|---|
| B0 | Decisión, contrato, loop y estado | HECHO | (este commit) | — |
| B1 | Bug: ficha con todos los valores en cero | HECHO | `8e750cc2` | — |
| B2 | `inventory/services.py` + mirrors `OrderItem` y `Favorite` | HECHO | `7aa61146` | — |
| B4 | Django Admin con las reglas del panel | PENDIENTE | | B2 |
| B8 | Traspaso Supabase → Django | PENDIENTE | | Docker/Supabase prendidos para el gate SQL |
| B9 | Salida, permisos y endurecimiento | PENDIENTE | | B8 |
| B6 | Tokens y Tailwind | ESPERA | | S1 (tokens.css del rediseño) |
| B7 | `panel/base.html` desde `dashboar.html` | ESPERA | | S2 |
| B10–B13 | Productos en el panel | ESPERA | | S3 |
| B14 | Rutas `/panel/productos/` | PENDIENTE | | B10–B13 |
| B15 | Reemplazar el `base.html` claro de la M13 | PENDIENTE | | B14 |
| B3 | Historial de cambios (opcional) | PENDIENTE | | B2 |
| B5 | Entrega M14 | PENDIENTE | | B10, B4 |
| B17 | M15 Django Templates | PENDIENTE | | Fase 2 |

## Bitácora

- 2026-10-06: plan aprobado por Eduardo. Diseño 1.1 traído desde pruebas@115490ea (`f4a21027`). La M14 no se manda al LMS hasta B5.
- 2026-10-06:
  - Todo lo de las ramas extra (`entrega-m14-django-models-admin` y `panel-django`) pasó directo a `practicas-ebac` (`6b720395`), y esas ramas se borraron. La M14 literal (`backend/ecommerce/`, `4ed789e4` y `2e222757`) ya está en `practicas-ebac`.
  - El contrato y el loop se corrigieron con la revisión del agente de rediseño.
  - B1 quedó empezado sin commitear en el worktree: pruebas y el arreglo en `inventory/views.py`. Se revisa y commitea cuando Eduardo dé la orden de seguir.
- 2026-10-07:
  - GGA revisa gratis: Gemini Flash-Lite con el revisor `gga-reviewer` y el snapshot de OpenCode apagado (`e77de1f3`, `7b513e8e`).
  - Los dos loops leen el contexto del otro agente en Engram antes de cada paso (`1869c669`, `541ddfeb`).
  - B1 hecho (`8e750cc2`): `product_update` guarda la ficha aunque todos sus valores sean cero, igual que `product_create`. Pasan 42 pruebas.
  - B2 hecho (`7aa61146`): `inventory/services.py` concentra la confirmación de precio, borrar o desactivar y cuándo se guarda la ficha; los mirrors `OrderItem` y `Favorite` (solo lectura, sin DDL: la migración `0002` es solo estado) reemplazan el SQL crudo. Pasan 81 pruebas.
