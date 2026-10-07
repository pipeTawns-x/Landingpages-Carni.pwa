# Estado del panel Django (backend)

Se actualiza en cada slice. Se retoma en la primera que no esté HECHA.

| Slice | Qué | Estado | Sha | Espera |
|---|---|---|---|---|
| B0 | Decisión, contrato, loop y estado | HECHO | (este commit) | — |
| B1 | Bug: ficha con todos los valores en cero | HECHO | `8e750cc2` | — |
| B2 | `inventory/services.py` + mirrors `OrderItem` y `Favorite` | HECHO | `7aa61146` | — |
| B4 | Django Admin con las reglas del panel | HECHO | `df9428b6` | — |
| R | Carrera al borrar: un pedido nuevo desactiva el producto en vez de dar un 500 | HECHO | `61f891c7` | — |
| B8 | Traspaso Supabase → Django | HECHO (gate SQL pendiente) | `877d2510`, migración `4e5d6137` | Docker (pide la contraseña de administrador de macOS) para aplicar la migración y correr el gate SQL; variables nuevas en `backend/.env` |
| B9 | Salida, permisos y endurecimiento | PENDIENTE | | — |
| B6 | Tokens y Tailwind | ESPERA | | S1 (tokens.css del rediseño) |
| B7 | `panel/base.html` desde `dashboar.html` | ESPERA | | S2 |
| B10–B13 | Productos en el panel | ESPERA | | S3 |
| B14 | Rutas `/panel/productos/` | PENDIENTE | | B10–B13 |
| B15 | Reemplazar el `base.html` claro de la M13 | PENDIENTE | | B14 |
| B3 | Historial de cambios (opcional) | PENDIENTE | | — |
| B5 | Entrega M14 | PENDIENTE | | B10 |
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
  - B4 hecho (`df9428b6`): `ProductAdmin` aplica las reglas del panel con los servicios: `price_per_lb` solo lectura, casilla "Confirmar cambio de precio o cantidad mínima" que `ProductAdminForm` exige al cambiar el precio por kg o la cantidad mínima (no en productos nuevos), y `delete_model` y `delete_queryset` borran o desactivan y avisan cuáles se desactivaron. Django sigue mostrando su mensaje de eliminado y registra un borrado para esos productos, porque ambos salen del admin y no de esos dos métodos. Pasan 98 pruebas.
  - R hecho (`61f891c7`): `delete_or_deactivate` borra dentro de un savepoint. Si un pedido llega entre el conteo y el borrado y la base lo rechaza (`ON DELETE RESTRICT`), el producto se desactiva y el resultado lo dice, en vez de un `IntegrityError` (500). Pasan 102 pruebas.
  - B8 hecho (`877d2510`, migración `4e5d6137`): la app `panel` con `POST /panel/sesion/`. Verifica el origen, la firma (JWKS o HS256, un solo modo según la configuración), `exp`, `aud`, el emisor y la edad del token, exige `profiles.role = 'admin'` y abre la sesión de un usuario de Django sin contraseña y sin staff. `panel_admin_required` protege `/panel/` y manda al resto a `/panel/acceso/`, que lleva al login de la tienda. Pasan 202 pruebas, y el traspaso se comprobó de punta a punta en Chrome (tienda en otro puerto → `/panel/sesion/` → panel) con un token de prueba.
  - B8 pendiente de Eduardo: Docker no arranca sin la contraseña de administrador de macOS, así que la migración `4e5d6137` no se aplicó y el gate SQL no corrió. Tampoco están en `backend/.env` las variables nuevas (los valores locales están en `backend/README.md`), sin las cuales Django no arranca.
  - Contrato corregido: la página de la tienda que hace el traspaso no puede mandar `Referrer-Policy: no-referrer`, porque Chrome manda `Origin: null` y Django rechaza el traspaso; tiene que mandar `strict-origin`.
