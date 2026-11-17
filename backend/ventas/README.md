# ventas

The sales of the store, on the real catalogue: a public catalogue and the sale at the counter inside the admin panel.

Every price, discount, stock check and exchange rate is decided by the Postgres functions of the store (`public.quote_cart`, `public.create_order_staff`). Django never computes a total and never writes an order. The session cart holds only what the staff asked for (`product_id`, `mode`, `amount`, `unit`, `thickness_in`, `note`), never a price.

## URLs

| Name | Path | Who |
|---|---|---|
| `ventas:catalogo` | `/productos/` (old `/products.html` answers 301) | anyone (read only) |
| `ventas:nueva` | `/panel/ventas/nueva/` | panel admin |
| `ventas:carrito_agregar` | `/panel/ventas/carrito/agregar/<pk>/` | panel admin, POST |
| `ventas:carrito_actualizar` | `/panel/ventas/carrito/actualizar/<pk>/` | panel admin, POST |
| `ventas:carrito_quitar` | `/panel/ventas/carrito/quitar/<pk>/` | panel admin, POST |
| `ventas:procesar` | `/panel/ventas/procesar/` | panel admin, POST |
| `ventas:pedido_detalle` | `/panel/ventas/pedidos/<uuid>/` | panel admin |

Every panel route is wrapped in `panel.access.panel_admin_required`, and every POST carries Django's CSRF token.

## Modules

- `services.py`: the only door to the database functions. All values go as parameters; a `RAISE EXCEPTION '<code>: ...'` becomes `GatewayError(code)`; any other failure becomes `GatewayUnavailable`, whose message says nothing of the cause.
- `cart.py`: the session cart (at most 50 lines, one per product).
- `catalog.py`: which ways of selling a form offers for a product (money, weight, pieces).
- `forms.py`: a cart line and the order. Neither has a price field.
- `domain.py`: every label and message shown to the staff, in Spanish.
- `models.py`: `PanelOrder`, a read-only mirror of the `panel_orders` view.

## Tests

```bash
cd backend
.venv/bin/python manage.py test --settings=config.settings_test ventas
```

The tests replace the gateway with `tests/support.py:FakeGateway`, which applies `supabase/tests/cotizacion-casos.json`, the same cases file the SQL tests of the functions read.
