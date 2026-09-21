# Loop 1 — Admin dashboard references (dark, 390px, order statuses, KPI cards)

Research only. No repo files touched. Scope: Carni-mvp admin redesign — dashboard, products, orders (6 statuses: Pendiente, Confirmado, Preparando, Listo, Entregado, Cancelado), customers, settings.

## Dashboards (dark, modern, admin/fintech)

- **HorizonX explore gallery** — https://horizonx.so/explore. Dark concepts worth stealing: "Finance App" (neon-green glass balance/cards), "Nocturne Studio Dashboard" (dark creative-studio dashboard), "Dashboard Components" set (KPI cards with sparklines/area charts, radial progress meter, status-tagged task list). Inspiration only; several items are paid concepts, not code.
- **htmlrev.com free Tailwind templates** — https://htmlrev.com/free-tailwind-templates.html. Two real dark options: "Admin Template Night" (https://www.tailwindtoolbox.com/templates/admin-template-night, "complete lights-out mode") and "Dark App Dashboard" (https://pixelcave.com/freebies/dark-app-dashboard-tailwind). Rest of the list (TailAdmin, Datta Able, Windster) is light by default; no licenses stated on the listing page itself.
- **htmlrev.com free React templates** — https://htmlrev.com/free-react-templates.html. Dark picks: "Vision UI Dashboard React" (Creative Tim, https://www.creative-tim.com/product/vision-ui-dashboard-react), "DashDarkX" (https://themewagon.com/themes/dashdarkx/), "Pulse CRM" (https://codescandy.com/template/pulse-crm-dashboard-modern-react-admin-template/). Also lists **TailAdmin** (https://tailadmin.com/) — gray background + blue accents, dark/light toggle across all components, freemium (free core + paid Pro).
- **prebuiltui.com "Dashboard UI" search** — https://prebuiltui.com/search/dashboard-ui (`/components/dashboard` 404s; correct path confirmed via `curl` against the page's own JSON-LD `ItemList`). Caveat: despite "22+ Dashboard UI Templates," the items are SaaS/e-commerce/clinic **landing pages** with an embedded dashboard-preview screenshot, not standalone admin panels — weak source, useful only for the "hero + dashboard mockup" pattern.
- **django-unfold (MIT)** — https://github.com/unfoldadmin/django-unfold. Directly relevant since Carni's admin is Django. Built on `django.contrib.admin`, Tailwind-based with dark mode built in. Collapsible sidebar + top bar, tab navigation for grouping fieldsets. Changelists get dropdown/autocomplete/date-range/facet filters. Forms support conditional fields, sortable inlines, Trix WYSIWYG. Dashboard KPI cards plus Chart.js charts; Alpine.js + HTMX for interactivity.

## Data tables that survive 390px

- **Setproduct — Data Table UI Design guide** — https://www.setproduct.com/blog/data-table-ui-design. Four responsive strategies: (1) horizontal scroll with a frozen first column, (2) full card transformation ("each row becomes a stacked card," best for small datasets, breaks down past a few dozen rows), (3) hide non-critical columns, push them to a detail view, (4) "priority+" — show top columns, reveal the rest on demand. Recommends **pagination over infinite scroll**, and flags "pagination without a total count" as an anti-pattern.
- **DataTables.net responsive breakpoints reference** — https://datatables.net/reference/option/responsive.breakpoints. Default tiers: desktop (∞), tablet-l (1024px), tablet-p (768px), mobile-l (480px), mobile-p (320px) — a usable scale for where Carni's 390px viewport should switch to cards.
- **fwdtools responsive table→cards snippet** — https://fwdtools.com/ui-snippets/responsive-table-cards/. Free HTML/CSS reference implementation of the row-to-card collapse pattern above.
- Sticky headers and row actions: not independently verified beyond the Setproduct guidance — flagging as a gap rather than guessing.

## Order status boards

- **Flowbite Kanban** — https://flowbite.com/application-ui/demo/pages/kanban/. Columns = status (To Do / In Progress / Done), cards carry priority badges (High/Medium/Low/Lowest) and category tags, plus a "Group by" control — status lives as a per-card badge, not a separate dropdown. Open source (Flowbite core).
- **shadcnuikit Kanban app** — https://shadcnuikit.com/dashboard/apps/kanban. Same status-as-column idea but exposes a **Board / List / Table view toggle** at the top — the same order data is browsable as kanban or flat table, which maps well to Carni needing both an operational board and a searchable order list. Paid template.
- **AdminLTE — dashboard color-scheme guidance** — https://adminlte.io/blog/best-admin-dashboard-color-schemes/. Rule for avoiding a "rainbow": limit to 5–7 semantic colors max ("beyond that, human perception cannot reliably distinguish categories"), never reuse the brand color as a status color, never encode status by hue alone (pair with icon/label, ~8% of men have red-green color-blindness), and in dark mode "increase the lightness of these colors slightly" for contrast. With 6 statuses (Pendiente…Cancelado), Carni sits right at that ceiling — hue alone won't be enough.

## KPI cards

- **dashboardcn** — https://dashboardcn.com/. shadcn/ui-based, MIT, no Pro tier/license key/account. KPI Card = "value, period-over-period delta, and an optional sparkline"; cards use borders rather than shadows. 27 components / 25 blocks, owned source code via CLI.
- **PanelUI KPI component** — https://panelui.dev/docs/components/kpi. Four layers: large value, trend (auto-colored % change), small sparkline ("not meant for precise reading"), metadata (title, icon, period caption e.g. "last 30d", optional progress bar). Open source.
- **HorizonX "Dashboard Components" set** — https://horizonx.so/explore/dashboard-components. KPI cards with sparklines/area charts bundled with a radial progress meter and status-tagged task list — a fuller worked example of the same value+delta+sparkline+period formula.

## What makes them premium instead of "bootstrap admin"

Concrete, observable traits across the sources above: (1) **density** — smaller type scale (13–14px body vs Bootstrap's 16px default) and tighter vertical rhythm fit more real content above the fold without feeling cramped; (2) **borders over shadows** — dashboardcn and Unfold favor 1px hairline borders on cards/tables instead of drop shadows, reading flatter than the soft-shadow Bootstrap-card look; (3) **restrained, semantic color** — accent reserved for one brand action, status color kept to the 5–7-color ceiling (AdminLTE), everything else grayscale; (4) consistent corner-radius/spacing scale rather than mixed defaults; (5) a genuine dark-mode pass (contrast-adjusted lightness, not inverted grays) — present in Unfold, TailAdmin, dashboardcn, absent from stock Bootstrap admin themes.

## Licensing quick-reference

- MIT / free, no strings: django-unfold, dashboardcn, PanelUI, Flowbite (core), fwdtools snippet.
- Free core + paid Pro tier: TailAdmin.
- Paid / commercial template: shadcnuikit Kanban.
- Inspiration only, not shippable code: HorizonX gallery items (several marked Premium).
- No license stated on the page itself: the htmlrev.com listing pages (license lives on each template's own site, not on htmlrev).
