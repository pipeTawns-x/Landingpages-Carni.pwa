# Contract: inventory by source and sale modes (T7b, T7c)

Spec: `odd/tasks/rediseno-moderno.md`, S14.1-S14.7 (T7b: S14.1-3, T7c: S14.4-7), decisions in L25.
Migration: `supabase/migrations/20261125000001_inventario_por_fuente.sql` (written, NOT applied).
SQL test: `supabase/tests/inventario_por_fuente.sql`. Python rules: `backend/inventory/sources.py`
and `backend/inventory/pricing.py` (`close_price`). Nothing here is a parallel inventory: every
change of stock is a row of `stock_movements`, and every entry is a row of `purchase_lots`.

## 1. Vocabulary

| Term | Meaning | Where |
|---|---|---|
| Source (fuente) | A product that holds raw stock in kg and is not cut yet ("pierna de puerco, 10 kg") | `products` row that other products point at |
| Sellable product | What the customer orders (bistec, molida, molida mixta, milanesa) | `products.source_product_id` -> its source |
| Deferred split (reparto diferido) | The normal mode: a sale of a sellable product takes its grams from the source | `set_order_status` on `pending -> confirmed` |
| Explicit cut (despiece) | Optional: the butcher already cut, e.g. 3 kg to molida and 3 kg to molida mixta | `cut_source(...)`, the kg sibling of `cut_lot` |
| Shrink (merma) | Weight lost without a sale: trim, drying, expiry | `stock_movements.reason = 'shrink'` + `shrink_kind` |
| Count (conteo) | Weekly physical count against the system | `stock_counts` + a `stock_movements` row `reason = 'count'` |

## 2. Rules

1. **Entry of a piece (S14.1).** "el lunes llega una pierna de puerco de 10 kg, con costo/kg,
   proveedor y fecha". `register_source_entry(product_id, qty, total_cost, supplier, note,
   staff_ref)` calls the existing `register_purchase` and stores `purchase_lots.supplier`. The date
   is `purchase_lots.created_at`. The stock stays on the source, unsplit.
2. **Deferred split (S14.2).** Each sale deducts EXACTLY the grams sold (L25): by weight, the grams
   ordered; by price, `amount / price per kg`; by piece, `pieces x standard weight`. The product's own
   stock (left by an explicit cut) is used first, the rest comes from its source. Rows are locked in
   ascending product id. The source never goes negative: not enough stock refuses the confirmation
   with `insufficient_stock`.
3. **Explicit cut (S14.2).** `cut_source(source_id, [{product_id, kg}], note, staff_ref)`: moves kg
   from the source to each output's own stock, one `cut` movement per side, never above the source.
4. **Yield factor (assumption A3).** Not used to deduct. `inventory_settings.yield_informative`
   exists and is `false`; nothing reads it yet. If Eduardo wants a theoretical use in the
   reconciliation, it is added behind that flag; until then it has no effect.
5. **Shrink (S14.3).** `record_shrink(product_id, kg, kind, note, staff_ref)`: `kind` in `trim`,
   `drying`, `expiry`; note and actor are required; the stock never goes below zero.
6. **Weekly count (S14.3).** `record_stock_count(product_id, counted, note, staff_ref)` stores
   counted against system, the variance and its percentage, sets the stock to what was counted and
   writes a `count` movement. Thresholds (assumption, from the investigation, configurable in
   `inventory_settings`): alert above `alert_pct` = 2 %, note required above `note_required_pct` = 5 %.
7. **Sale modes (S14.4-6).**
   - By weight: grams ordered; the legend "sujeto al corte del carnicero" travels with the line
     (`sources.legend_for`: weight and money lines carry it, a fixed piece carries none).
   - By price: grams = amount / price per kg. "$260 a $300/kg = 866.7 g". The stock column is
     `numeric(10,3)` kg, so the deduction is rounded half up to the gram: 0.867 kg. USD amounts are
     converted with the panel rate first (`current_fx`).
   - By piece: standard weight with tolerance (`product_cut_specs.avg_piece_weight_kg`,
     `piece_tolerance_kg`), fixed price per piece (`products.price_per_kg` of a `price_unit = 'piece'`
     product, as today). "100 g ±5 g a $20": 3 pieces cost $60.00 and deduct 0.300 kg. The closed
     line (`pricing.ClosedPrice`, `source = "fixed_piece"`) keeps the schema convention: its
     `price_per_kg` is the price of one `price_unit`, here one piece, equal to `unit_price`. The
     piece price rounds half up, like the SQL quote. The weight and the tolerance are finite
     Decimals (weight above zero, tolerance zero or more).
   - Inputs: the Python functions (`inventory.sources`, `pricing.StandardPiece`) take finite
     Decimals only; a float, text or `NaN`/`Infinity` is refused with `invalid_amount`, so a view
     parses the user's input with its ASCII parser first (F-47).
   - Pound: one factor, 1 lb = 0.45359237 kg (`models.POUND_IN_KG`), for `price_per_lb`, the
     price typed per pound and the SQL quote, so the price per pound shown is the one charged.
   - A product sold only by piece refuses weight and money (`sale_mode_not_allowed`). Merchandise
     (`price_unit` piece or package) is never sold by weight.

## 3. What the panel reads (T7d, slice 2)

All money and weights travel as text (exact decimals), never as floats. Every read is for the panel
admin only (`panel_admin_required` in Django; in Postgres only `django` and `service_role` get
SELECT, `anon` and `authenticated` get nothing).

| Widget | Source | Fields (type) | Aggregation (server) | Empty value |
|---|---|---|---|---|
| Stock by source | view `panel_source_stock` | `source_id` int, `source_name` text, `stock_kg` text, `sellable` jsonb `[{product_id, name, own_stock, stock_unit}]`, `last_entry_at` timestamptz | one row per product that has at least one sellable pointing at it | `[]` |
| Entries | view `panel_purchase_performance` (exists) + `purchase_lots.supplier` | as today, plus `supplier` text | newest first, 20 | `[]` |
| Daily reconciliation | function `panel_source_reconciliation(p_day date)` | `source_id`, `source_name`, `sold` jsonb `[{product_id, name, kg}]`, `sold_kg`, `source_drop_kg`, `shrink_kg`, `difference_kg` (text) | the day in America/Mexico_City; `difference = source_drop - sold - shrink` | `[]` |
| Weekly count | table `stock_counts` via view `panel_stock_counts` | `product_id`, `name`, `system_qty`, `counted_qty`, `variance_qty`, `variance_pct` (text), `alert` bool, `note` text, `staff_ref`, `counted_at` | last 8 weeks, newest first | `[]` |
| Shrink % | inside `panel_source_reconciliation` | `shrink_pct` text = shrink kg / (sold kg + shrink kg) x 100 | per source, per day | `"0.00"` |

Fixtures for the Django tests come from `preview_seed` (deterministic keys), never from Supabase.

## 4. Errors (codes for `domain.ERROR_MESSAGES`)

`insufficient_stock`, `sale_mode_not_allowed`, `invalid_amount`, `note_required`,
`invalid_shrink_kind`, `source_cycle` (a product cannot be its own source, nor a source of a source),
`product_not_found`.

## 5. Assumptions and decisions for Eduardo

- A1 (S14): by kg, the sale takes from the oldest lot of the source; one lot per order for pieces.
- A3 (L25): the yield factor never deducts; informative only, off by default.
- Thresholds 2 % / 5 %: a supplier's rule, not a norm (L25); configurable.
- 866.7 g is shown with one decimal, but stock is kept to the gram (0.867 kg).
- `cut_source` is a new function next to `cut_lot`, because `cut_lot` cuts piece lots
  (`purchase_lots.pieces_left`) and a kg source has no pieces.
