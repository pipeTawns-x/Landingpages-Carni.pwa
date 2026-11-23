# Contract of `/productos/` (T4a, S2, S6)

Owner: `backend-datos`. Consumer: `frontend` (T4b, `backend/ventas/templates/ventas/productos.html`).
Source of truth is the code; every line below was read from it (`file:line` in brackets).

Legend: **EXISTS** = in the tree today and covered by tests; **NEW** = added by this slice, test first.
Until a NEW item shows `GREEN` in its status line, do not rely on it in production code.

## 0. Ground rules

- The store is public. Nothing here needs a login (AGENTS.md documents the guest-checkout exception).
- **No price is ever computed in Python or in the browser.** Every number comes from the Postgres function `public.quote_cart` through `ventas.services.get_gateway()` [`services.py:178`]. A client cannot send a price: no form has such a field [`forms.py:19`].
- Money and quantities are `Decimal` on the server and travel as **strings** in JSON (`"100.00"`, `"0.500"`). Never `parseFloat` them for arithmetic; only for display (`toLocaleString("es-MX")`).
- Errors are one Spanish sentence for the customer. The sentence comes from `ventas/domain.py` (`ERROR_MESSAGES`, `UNAVAILABLE_MESSAGE`, `GENERIC_REFUSAL`) or from the form. Show it as is; do not map codes in the browser.
- Time zone of the store: America/Mexico_City. Currency: `MXN` (default) or `USD`.
- **Every string in these answers is plain text, not HTML.** Product names come from the panel and notes from the customer. Put them in the page with `textContent` (or a framework's escaped interpolation), never `innerHTML`.
- `Accept: application/json` is what selects JSON on the cart writes. `fetch` without it sends `*/*` and gets the form behavior (a redirect followed by an HTML page): always set the header.

### CSRF (every POST)

`CsrfViewMiddleware` is on. A POST without a valid token is a **403 with an HTML body** (Django's default page), never JSON. Treat any non-2xx response whose body is not JSON as "generic failure" and show `GENERIC_REFUSAL`.

- Forms: `{% csrf_token %}` (hidden input `csrfmiddlewaretoken`).
- `fetch`: send the same token in the header `X-CSRFToken` and `credentials: "same-origin"`. Read it from the hidden input of any form on the page (the `csrftoken` cookie is not HttpOnly, but the input is the stable source).

```js
await fetch(url, {
  method: "POST",
  credentials: "same-origin",
  headers: { Accept: "application/json", "X-CSRFToken": token },
  body: new FormData(form),            // multipart or urlencoded, both work
});
```

The CSP only allows `'self'`: call same-origin paths, load nothing from a CDN.

### Status codes used

| Code | Meaning here |
|---|---|
| 200 | done / quote answered |
| 302 | HTML mode of a cart POST (POST, redirect, GET) |
| 400 | the line is invalid, or the store refused it (reason in `error`) |
| 403 | CSRF token missing or wrong (HTML body) |
| 404 | product unknown or inactive, or the line is not in the cart |
| 405 | wrong method |
| 409 | the cart already has 50 lines (NEW, JSON mode) |
| 429 | rate limit; body has the sentence |
| 503 | the database could not answer; the cause is only in the server log |

## 1. Catalogue page: `ventas:catalogo` GET `/productos/` (EXISTS)

`/products.html` answers a 301 to it, query kept [`comun.py:34`]. Only GET/HEAD.

Query parameters:

| Param | Rule |
|---|---|
| `q` | free text, matched against name and description (`icontains`). NEW: cut to 80 characters, like the live search. |
| `category` | category id, digits only; anything else is ignored. NEW: an id of more than 9 digits is ignored too (it used to be a 500: the database refused the number); leading zeros are dropped (`007` selects `7`). |
| `page` | page number; not a number gives page 1, out of range gives the last page (`Paginator.get_page`) [`comun.py:17`]. |

Context [`comun.py:21`]:

| Key | Type | Notes |
|---|---|---|
| `page_obj` | Django `Page` | 24 products per page [`productos.py:23`], ordered `name, pk`. Only active products of active categories [`catalog.py:42`]. `page_obj.paginator.count` is the total, `.num_pages` the pages, `has_previous`/`has_next`/`previous_page_number`/`next_page_number`. |
| `categories` | queryset | active categories ordered `order, name`: `pk`, `name`, `slug`. |
| `query` | str | the stripped `q` that was applied (NEW: at most 80 characters). |
| `selected_category` | str | `"<id>"` or `""`. Compare with `category.pk\|stringformat:"d"`. |

Product attributes available on each item of `page_obj`: `pk`, `name`, `description` (may be `None`), `category.pk`, `category.name`, `price_per_kg` (Decimal, the price of the unit), `price_per_lb` (Decimal), `unit_label` (`"kg"`, `"pieza"` or `"paquete"`), `image_src` (address or `""`). `price_per_kg` is the price **per `unit_label`** (per piece or package when it is not `kg`). **Never** read cost or margin: the catalogue has no cost. `stock` exists on the object and may be tested with `> 0` ("sold out" or not); do not print the figure.

Links of the pagination: keep `q` and `category` in them (`?page=2&q=...&category=...`).

## 2. Product page: `ventas:producto` GET `/productos/<pk>/` (EXISTS)

404 when the product is inactive or its category is. Context [`productos.py:68`]:

| Key | Type | Notes |
|---|---|---|
| `product` | Product | attributes as above plus `description`. |
| `modes` | list of `(value, label)` | only the ways the store accepts for this product, in the order `weight`, `money`, `pieces`. Labels: `Por peso`, `Por dinero`, `Por piezas`. A product sold per piece or package has only `pieces`. |
| `units` | tuple | `("kg", "g", "lb")`, the weight units. |
| `asks_thickness` | bool | true only when `pieces` is offered and the cut spec has a default thickness. |
| `thickness` | dict | `min`, `max`, `default` (Decimal, inches), `step` (`"0.25"`), `marcas` (list of Decimal every 0.5). Defaults 0.50 / 3.00 / 1.25 when the panel gave no range. |
| `relacionados` | queryset | up to 4 active products of the same category, without this one. |

The form posts to `ventas:tienda_agregar` (section 5). Fields of a line:

| Field | Rule |
|---|---|
| `mode` | `money`, `weight` or `pieces`; required. |
| `amount` | `Decimal`, at most 10 digits and 3 decimals, minimum 0.001; for `pieces` a whole number (`"Las piezas van en números enteros."`). Required. |
| `unit` | `kg`, `g` or `lb`; required **only** for `weight`; ignored for other modes (the page shows it for all modes, that is not an error) [`carrito.py:123`]. |
| `thickness_in` | inches, `Decimal` (4 digits, 2 decimals); only for `pieces`; ignored for other modes. |
| `note` | up to 200 characters, free text. |

## 3. Live quote: `ventas:producto_cotizar` GET `/productos/<pk>/cotizar/` (EXISTS, extended)

Reads only. It changes no cart and no order. Same line fields as section 2, passed in the query string. Never cached (`Cache-Control: no-store`). Limit: 90 requests per client IP and minute, checked **before** any lookup [`productos.py:33`].

NEW parameter: `currency` = `MXN` (default) or `USD`; any other value is treated as `MXN`. With `USD`, the amount of a `money` line means dollars.

Answer 200 (all numbers are strings except `piezas`):

```json
{
  "total": "100.00",        // MXN, line total after discount            (EXISTS)
  "descuento": "0.00",      // MXN discount already applied               (EXISTS)
  "kg": "0.500",            // quantity in kilos, 3 decimals              (EXISTS)
  "piezas": null,           // integer for a pieces line, else null       (EXISTS)
  "moneda": "MXN",          // the currency that was asked                (NEW)
  "total_usd": "5.12",      // dollars, rounded up to the cent; null when there is no valid exchange rate (NEW)
  "avisos": []              // Spanish sentences, e.g. "Poco stock: puede que no alcance." (NEW)
}
```

Errors (all `{"error": "<sentence>"}`):

| Status | When | Sentence |
|---|---|---|
| 400 | the line fails the form | first form error, e.g. `Las piezas van en números enteros.`, `Elige la unidad del peso.` |
| 400 | the store refuses | `domain.message_for(code)`, e.g. `Este producto no se vende de esa forma.`, `No hay un tipo de cambio vigente para cobrar en dólares.` |
| 404 | product unknown or inactive | NEW: JSON `{"error": "Un producto del carrito ya no está disponible."}` (was an HTML 404) |
| 405 | not GET/HEAD | empty body |
| 429 | over 90 per minute | `Demasiadas consultas, espera un momento.` |
| 503 | database unavailable | `No se pudo hablar con la base de datos de la tienda. Inténtalo de nuevo en un momento.` |

## 4. Live search: `ventas:buscar` GET `/buscar/?q=` (EXISTS)

Fewer than 2 characters gives `{"resultados": []}`; `q` is cut to 80. Up to 8 active products:

```json
{"resultados": [{"nombre": "Bistec", "url": "/productos/7/", "precio": "200.00", "unidad": "kg", "imagen": ""}]}
```

`Cache-Control: private, max-age=30`. 429 gives `{"resultados": [], "error": "Demasiadas búsquedas."}` (120 per minute per IP).

## 5. Cart: `/carrito/agregar|actualizar|quitar/<pk>/` (POST)

The cart lives in the session under its own key (`tienda_cart`), apart from the counter cart of the panel. One line per product: adding a product already in the cart **replaces** its line (idempotent). At most 50 lines. The line stores only what was asked (`product_id, mode, amount, unit, thickness_in, note`), never a price [`cart.py:18`]. Before a line is kept, the store is asked to quote it, so the cart never holds a line the store would refuse [`carrito.py:159`].

| Route | Name | Effect |
|---|---|---|
| `/carrito/agregar/<pk>/` | `ventas:tienda_agregar` | add or replace the line of that product |
| `/carrito/actualizar/<pk>/` | `ventas:tienda_actualizar` | change the line; the line must already exist |
| `/carrito/quitar/<pk>/` | `ventas:tienda_quitar` | remove the line |

### 5.1 HTML mode (EXISTS, the default; works without JavaScript)

POST form, then **302** and a flash message (`django.contrib.messages`, level `success`, `warning` or `error`). `next` (hidden field) says where to go back; only a path of this site is accepted, anything else falls back to `ventas:catalogo` (`agregar`) or `ventas:carrito` (`actualizar` and `quitar`) [`_safe_next`]. NEW: `actualizar` and `quitar` honour `next` too (they ignored it before), also when the line is not in the cart, so a drawer on any page can change a line without leaving the page. 404 for an inactive product on `agregar`/`actualizar`.

### 5.2 JSON mode (NEW): send `Accept: application/json`

No redirect, no flash. Same fields, same validation, same CSRF rule. Body of a success (200):

```json
{
  "ok": true,
  "mensaje": "Bistec se agregó a tu carrito.",
  "carrito": {
    "total_lineas": 1,
    "lineas": [
      {"producto_id": 7, "nombre": "Bistec", "url": "/productos/7/", "imagen": "",
       "cantidad": "1 kg", "nota": null}
    ]
  }
}
```

`carrito` is the same list the header drawer prints (`bolsa`, section 7): `cantidad` is how the customer asked for it in words (`"0.5 kg"`, `"$150"`, `"4 piezas · 1.25 in"`). **No price in it**; the totals are on the cart page or in the quote of section 3.

Body of a failure: `{"ok": false, "error": "<sentence>"}`:

| Status | When | Sentence |
|---|---|---|
| 400 | the form refuses the line | `No se agregó la línea: <reason>` |
| 400 | the store refuses the line | `domain.message_for(code)` |
| 404 | product unknown or inactive | `Un producto del carrito ya no está disponible.` |
| 404 | `actualizar` or `quitar` of a product that is not in the cart | `Ese producto ya no estaba en tu carrito.` (the line is not there: drop it from your drawer) |
| 409 | the cart already has 50 lines | `El pedido tiene demasiadas líneas (el máximo es 50).` |
| 429 | more than 60 cart writes per client IP and minute (both modes) | `Demasiadas consultas, espera un momento.` |
| 503 | database unavailable | `No se pudo hablar con la base de datos de la tienda. Inténtalo de nuevo en un momento.` |

The three routes share one counter per client IP (60 a minute). It is spent before anything else is read, so a 404 or a refused line counts; a request that is not a POST (405) does not. Only the answers of 200 carry `carrito` (a refusal costs no query).

In HTML mode the same refusals are flash `error` messages (the absent-line one is a `warning`) and a 302 to the same place as before; the limit is checked first in both modes, and over it the form gets the 302 with the sentence, never a 429 page.

## 6. Cart page and guest checkout

### `ventas:carrito` GET `/carrito/?currency=MXN|USD` (EXISTS, HTML only)

Template `ventas/tienda/carrito.html`. The quote is asked again on every visit; nothing is taken from the browser. Context [`carrito.py:202`]: `rows` (each `{line, quote, product, modes, asks_thickness, warnings, error?}`; `quote` has `line_total_mxn`, `discount_mxn`, `quantity_kg`, `pieces`, `line_total_usd`), `quote` (cart total: `total_mxn`, `total_usd`, `fx`), `currency`, `other_currency`, `blocked` (true when any line is refused or the cart is empty: the order button must be disabled), `order_form`, `units`, `delivery_labels`, `payment_labels`. USD without a valid rate falls back to MXN with a warning message.

### `ventas:tienda_pedido` POST `/carrito/pedido/` (EXISTS, HTML only)

Guest order: no account. Controls that compensate for it (AGENTS.md exception): CSRF, validation on the server, **at most 3 pending orders per phone** [`carrito.py:44`, enforced by `public.create_order_web`], and **at most `CHECKOUT_THROTTLE_LIMIT` (5) attempts per client IP and per session in `CHECKOUT_THROTTLE_WINDOW_SECONDS` (3600)** [`carrito.py:242`].

Fields (`StoreOrderForm`): `customer_name` (≤120), `customer_phone` (7-20 characters, digits, spaces, `+ ( ) -`), `delivery_type` (`pickup` or `delivery`), `delivery_address` (required when `delivery`), `payment_method` (`efectivo`, `transferencia`, `tarjeta`; optional), `notes` (≤450), `currency`. No price, channel or status field exists.

Outcomes: success is a **302** to `ventas:pedido_confirmado` (`/pedido/confirmado/`, which reads only the order of this session); invalid data or a store refusal re-renders the cart page with **200** and the sentences as messages; over the attempt limit is a **429** page (`Hiciste demasiados intentos de pedido en poco tiempo. Espera un rato e inténtalo de nuevo, o escríbenos por WhatsApp.`). Empty cart: 302 to the cart with `Tu carrito está vacío: agrega productos antes de pedir.`

**Fails closed** (NEW, audit F-01): if the database has no `public.create_order_web` (its migration `20261117000002_create_order_web.sql` is not applied), the order is **refused** with `No se pudo hablar con la base de datos de la tienda. Inténtalo de nuevo en un momento.` (200, the cart is kept) and an error naming the migration goes to the log. It no longer falls back to `create_order_staff`, which has no cap per phone and no 7-digit rule and would file the guest order as a staff one.

There is no JSON mode for the checkout: it stays a plain form (less surface for a public write). If the redesign needs one, ask `backend-datos`.

## 7. Context every page receives (EXISTS, `context_processors.py`)

- `negocio`, `horario`: business data for header and footer.
- `bolsa`: lazy list of `{product, amount, note}` of the public cart for the drawer; `amount` is the sentence of section 5.2; a product that left the catalogue drops out. No price.
- `menu_categorias`: lazy list of the active categories for the menu.

## 8. Not provided (ask if the design needs it)

- Sorting by price and filtering by availability in the catalogue: not implemented, the order is `name, pk`.
- Prices inside the drawer: the drawer shows no price by design; use the cart page or the quote.
- A JSON listing of the catalogue: the page is server-rendered; `buscar` is the only JSON read.
- A JSON cart read (`GET /carrito/` as JSON): the mutation responses already carry the drawer list.

## 9. For the template tests of `frontend`

`backend/ventas/tests/support.py` has `make_store()` (Bistec 200.00/kg sold by money, weight and pieces with a cut spec; Molida 140.00/kg; Camiseta per piece) and `FakeGateway`, which applies `supabase/tests/cotizacion-casos.json`. Patch it with `mock.patch("ventas.services.get_gateway", return_value=gateway)` and clear `django.core.cache` in `setUp` (the limits count there).

## 10. Flow of a cart write and the patterns it uses

```mermaid
sequenceDiagram
    participant B as Browser (island or form)
    participant M as CsrfViewMiddleware
    participant V as agregar / actualizar / quitar
    participant T as throttle (cache)
    participant G as Gateway (quote_cart)
    participant S as Session (tienda_cart)
    B->>M: POST + token (header or hidden input)
    M-->>B: 403 if the token is wrong
    M->>V: request
    V->>T: too_many("carrito", 60/min)
    T-->>V: over the limit gives 429 (JSON) or flash + 302
    V->>G: quote_cart([line]) before keeping it
    G-->>V: refusal gives 400 (store) or 503 (database)
    V->>S: put / remove the line (no price)
    V-->>B: Accept JSON gives 200 {ok, mensaje, carrito}; a form gets flash + 302
```

| Pattern | Where | Why |
|---|---|---|
| Gateway / Adapter to the database functions | `ventas/services.py:167`, `get_gateway` `:414` | prices live in Postgres, never in Python |
| Content negotiation by `Accept` (one view, two answers) | `ventas/views/comun.py:95`, `ventas/views/carrito.py:180` | the form keeps working without JavaScript |
| Fail fast, cheapest check first | limit `carrito.py:203`, `throttle.py:33`, before the quote `:164` | a script cannot reach the database through the cart |
| Validate at the boundary | `CartLineForm` `forms.py:19`, `CATEGORY_ID_MAX_DIGITS` `catalog.py:20` | what the address bar sends is shaped before it reaches a query |
| Session as the cart, never a price | `cart.py:18` | nothing in the browser can lower the total |

Status (2026-11-23): every NEW item of this document is **GREEN**: `backend/ventas/tests/test_contract_productos.py` (12 tests: catalogue inputs, quote currency, dollars, warnings, JSON 404) and `test_contract_carrito.py` (23 tests: JSON mode of the three writes, CSRF, limit). `catalogo` and `producto` still render `ventas/tienda/productos.html` and `producto.html` until `frontend` says its template is ready.
