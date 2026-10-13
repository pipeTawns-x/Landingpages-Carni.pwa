# Current design captures (as-is)

Reference captures of the live site before the redesign, taken on 2026-09-17 from
https://pipetawns-x.github.io/Landingpages-Carni.pwa/ (deployed from `main`).
They document what exists today. They are not design proposals.

## Sources

| Files | Source | Viewport |
|---|---|---|
| `01`–`35` `*-desktop.png` | Frames from two screen recordings made by Eduardo in Brave with an admin session, cropped to the page area | 1796 × 1084 CSS px (DPR 1, browser zoom 100%) |
| `36`–`40` `*-390.png` | Playwright, no session, full page | 390 px wide |
| `41-offline-full-1440.png` | Playwright, no session, full page | 1440 px wide |

Full-page captures taller than 4000 px are split into `-partNN` files of 3000 px each, in scroll order.

## Index

### Landing — `index.html`

| File | State |
|---|---|
| `01-index-hero-desktop.png` | Hero video, header, "Nuestras Categorías" start |
| `02-index-menu-drawer-desktop.png` | Side menu drawer open |
| `03-index-search-overlay-desktop.png` | Search overlay open (white) |
| `04-index-cart-drawer-desktop.png` | Cart drawer "Tu pedido" with 3 items |
| `05-index-login-modal-desktop.png` | Login modal opened from the header |
| `06-index-categories-bento-desktop.png` | Category bento grid |
| `07-index-featured-product-desktop.png` | Featured product (Filete Mignon) |
| `08-index-reviews-desktop.png` | "Lo que se lleva la gente" and reviews (4.7) |
| `09-index-about-hours-desktop.png` | "Sobre Nosotros" and opening hours banner |
| `10-index-contact-footer-desktop.png` | "Contacto Directo" cards and footer |
| `36-index-full-390-part01..03.png` | Full page, mobile |
| `37-index-menu-open-390.png` | Mobile menu drawer open |

### Catalog and product detail — `products.html`

| File | State |
|---|---|
| `11-products-catalog-header-desktop.png` | Catalog header, filter chips ("Todo el catálogo" active) |
| `12-products-grid-desktop.png` | Product card grid |
| `13-products-grid-end-footer-desktop.png` | "Otros productos" cards and footer |
| `14-products-filter-active-desktop.png` | Filter "Embutidos" active |
| `15-products-filter-merch-desktop.png` | Filter "Merch" active |
| `16-products-chat-open-desktop.png` | Virtual assistant chat panel open |
| `17-product-detail-by-weight-desktop.png` | Product detail, "Por peso" mode |
| `18-product-detail-recommendations-desktop.png` | "Cortes que valen la espera" and "También de carnes rojas" |
| `19-product-detail-loading-desktop.png` | Product detail loading skeleton |
| `20-product-detail-breadcrumb-desktop.png` | Product detail with breadcrumb and gallery |
| `21-product-detail-by-price-desktop.png` | Product detail, "Por precio" mode with thickness slider |
| `22-product-detail-by-piece-desktop.png` | Product detail, "Por pieza" mode |
| `38-products-full-390-part01..10.png` | Full catalog page, mobile |

### Access — `accessweb.html`

| File | State |
|---|---|
| `23-accessweb-login-desktop.png` | Login panel (validation tooltip on the empty email field) |
| `24-accessweb-register-desktop.png` | Register panel after the login/register transition |
| `25-accessweb-editorial-footer-desktop.png` | Editorial section and footer |
| `39-accessweb-full-390.png` | Full page, mobile |

### Offline — `offline.html`

| File | State |
|---|---|
| `40-offline-full-390.png` | Mobile |
| `41-offline-full-1440.png` | Desktop |

### Admin (requires session)

| File | Page | State |
|---|---|---|
| `26-admin-dashboard-top-desktop.png` | `dashboar.html` | Sidebar, header, "Dashboard Matrix" and BuildAds ribbons |
| `27-admin-dashboard-notifications-menu-desktop.png` | `dashboar.html` | Notifications dropdown open (bell) |
| `28-admin-dashboard-kpis-charts-desktop.png` | `dashboar.html` | KPI cards, stock alert, charts |
| `29-admin-dashboard-orders-table-desktop.png` | `dashboar.html` | Recent orders table (DataTables) with actions |
| `30-admin-dashboard-buildads-form-desktop.png` | `dashboar.html` | BuildAds brief form and editorial preview |
| `31-admin-products-desktop.png` | `admin-products.html` | Inventory charts and table |
| `32-admin-products-ribbon-desktop.png` | `admin-products.html` | "Inventory Atelier" ribbon above the inventory |
| `33-admin-orders-desktop.png` | `admin-orders.html` | Order tracking table |
| `34-admin-customers-desktop.png` | `admin-customers.html` | KPIs and charts |
| `35-admin-customers-directory-desktop.png` | `admin-customers.html` | Customer directory table |

## Not captured (gaps)

- Admin pages at mobile width.
- Admin user menu ("ADMIN" dropdown with "Cerrar sesión"). That item is a plain link to `index.html` and does not sign out.
- Product detail and cart at mobile width.
- Hover, focus and error states, except the empty-field tooltip in `23`.
- Frames where the browser autofill showed a personal email were excluded on purpose.
