# Estado del panel Django (backend)

Se actualiza en cada slice. Se retoma en la primera que no esté HECHA.

| Slice | Qué | Estado | Sha | Espera |
|---|---|---|---|---|
| B0 | Decisión, contrato, loop y estado | HECHO | (este commit) | — |
| B1 | Bug: ficha con todos los valores en cero | PENDIENTE | | — |
| B2 | `inventory/services.py` + mirrors `OrderItem` y `Favorite` | PENDIENTE | | — |
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

- 2026-10-06: plan aprobado por Eduardo. Diseño 1.1 traído desde pruebas@115490ea (`f4a21027`). El PR #13 (base técnica de la M14) sigue abierto; la M14 no se manda al LMS hasta B5.
