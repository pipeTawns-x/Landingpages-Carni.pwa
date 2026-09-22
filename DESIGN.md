---
name: Carni-mvp — Mostrador Digital
description: Near-black butcher-shop storefront and admin system for "Carnicería El Señor de La Misericordia." Fraunces display + Geist UI/numerals, one red accent, restrained motion, mobile-first at 390px.
colors:
  bg: "#0B0B0C"
  surface-1: "#151517"
  surface-2: "#1C1C1F"
  surface-3: "#232326"
  border: "#3F3F46"
  text: "#F5F3EF"
  text-muted: "#A8A29B"
  red: "#DC2626"
  red-hover: "#C81E1E"
  danger: "#F43F5E"
  sand: "#E4D1B0"
  gold: "#F59E0B"
  success: "#059669"
typography:
  display: "Fraunces — variable, opsz 9–144, wght 440–480, WONK 0"
  ui: "Geist — 400–600, tabular figures on for every number"
rounded:
  card: "16px"
  pill: "999px"
  input: "12px"
  sheet: "24px top only"
  drawer: "16px left only"
  search: "20px bottom only"
  dialog: "20px"
  admin: "12px"
spacing: "4px base — 4 8 12 16 20 24 32 48 64 96"
components: [button, input, filter-chip, qty-stepper, product-card, price-block, sheet-drawer, status-chip, kpi-card, data-table]
---

## Overview

"Mostrador digital": restrained everywhere, warm only in the landing hero and empty states.
Near-black surfaces, one red accent, near-zero motion, no decorative glass or gradients. Ports to
Django templates with no JavaScript. Two type families, no exceptions. Full component inventory and
per-stack ownership: `docs/design/arquitectura-componentes.md`.

## Colors

| Token | Hex | Contrast | Use |
|---|---|---|---|
| `bg` | `#0B0B0C` | — | page background |
| `surface-1/2/3` | `#151517` / `#1C1C1F` / `#232326` | not contrast-bearing | card / overlay / sheet |
| `border` | `#3F3F46` | 3.1:1 vs bg | hairlines only, never shadows |
| `text` / `text-muted` | `#F5F3EF` / `#A8A29B` | 18.9:1 / 8.1:1 | body / labels, secondary price |
| `red` / `red-hover` | `#DC2626` / `#C81E1E` | white-on-red 4.53:1 | primary actions, focus, active nav |
| `danger` | `#F43F5E` | white-on-danger 4.6:1 | errors |
| `sand` | `#E4D1B0` | 13.7:1 | subtle accents, drag handles |
| `gold` | `#F59E0B` | 8.4:1 | stars, badges only |
| `success` | `#059669` | 6.2:1 | success text, Entregado only |

One accent (`red`) for every primary action site-wide; `gold`/`success` never substitute for it.

## Typography

Fraunces (display/h1/h2/h3, `opsz` range, editorial without a third face) + Geist (body/label/price/
button, ships tabular lining figures so every number is themed and never shifts column width).

| Role | 390px | 1440px | Weight/axis |
|---|---|---|---|
| Display | 40/44, track −0.04em | 64/68, opsz 96 | wght 480, WONK 0 |
| H1 | 32/38 | 44/50 | wght 480, opsz 72→96 |
| H2 | 24/30 | 30/36 | wght 440, opsz 48 |
| H3 | 20/26 | 22/28 | wght 440, opsz 24 |
| Body | Geist 16/24 | 16/26, measure 65–75ch | wght 400 |
| Small | Geist 13/18 | 13/18 | wght 400 |
| Label | Geist 12/16, +0.04em, uppercase | 12/16 | wght 500 |
| Price | Geist tabular 18/22 + 14/18 secondary | 22/26 + 16/20 | wght 600 / 400 |
| Button | Geist 15/20 | 15/20 | wght 600 |

Spanish runs longer than English: Display caps at 28/48 characters (390/1440), H3/card name clamps
to 2 lines. Overflow drops a size step or shortens the label, never wraps to three lines.

## Layout

4px base spacing: `4·8·12·16·20·24·32·48·64·96`. Mobile-first: 390px then 1440px. Touch targets
≥44×44px, ≥8px apart. Body measure 65–75ch at desktop. One header and one footer reused by every
public page, including a scrolled header state.

## Elevation & Depth

Strict stack, no level-skipping: **page (`bg`) → card (`surface-1`) → overlay (`surface-2`) → sheet
(`surface-3`)**. Surfaces separate by a 1px `border` hairline, never by their own contrast or a
shadow. No hard offset shadows, no colored border-left callouts, no default-Bootstrap look.

## Shapes

One radius per component, never mixed: card 16px · button/chip 999px · input 12px · bottom sheet
24px (top only) · desktop cart drawer 16px (left only) · desktop search 20px (bottom only, flush
top) · dialog 20px · admin card/table 12px.

## Components

Full inventory (23 components, reuse map, stack ownership) is
`docs/design/arquitectura-componentes.md`. Core primitives:

- **Button** — primary pill (`red`, white text, 44px, 2px focus ring); secondary (`sand` outline);
  ghost (underline on hover); icon (44×44, 20px glyph).
- **Input** — `surface-1`, 1px border, 12px radius, 48px height, label above, 2px `red` focus ring,
  `danger` border + inline message on error.
- **Filter chip** — `surface-2`+border default, `red` fill when active (the one place a filled pill
  is correct — chips only, never nav).
- **Qty stepper** — 44px row, ±44×44 buttons, tabular number, "+" disabled at stock max.
- **Product card** — 4:5 image, 16px padding/radius, unit-aware price block, six states.
- **Status chip** — 24px pill, 14px icon + 12px label; icon always pairs with color, never color
  alone, across all six order statuses.
- **KPI card** — `surface-1`, 12px radius, 20px padding; label → tabular value → delta → period →
  optional 48px sparkline.

## Do's and Don'ts

- Do keep every number (price, qty, KPI, table cell) in Geist tabular figures.
- Do pair every status chip's color with an icon and a label.
- Do show focus rings instantly (0ms), 2px, red, on every interactive element.
- Do treat add-to-cart as a silent success: sheet opens, counter increases, no toast.
- Don't use a gradient anywhere except the one photo scrim; no glassmorphism, no emoji icons.
- Don't fill the active nav item as a pill or mark it amber — red, by color/weight/underline.
- Don't hardcode a kg+lb price pair — the unit is derived from the category (spec §5).
- Don't show two search affordances at once — header search hides while the overlay is open.
- Don't wrap a clickable label to two lines; touch targets stay ≥44×44px.

---

```css
@theme {
  /* Colors (direccion-visual.md §1) */
  --color-bg: #0B0B0C;
  --color-surface-1: #151517;
  --color-surface-2: #1C1C1F;
  --color-surface-3: #232326;
  --color-border: #3F3F46;
  --color-text: #F5F3EF;
  --color-text-muted: #A8A29B;
  --color-red: #DC2626;
  --color-red-hover: #C81E1E;
  --color-danger: #F43F5E;
  --color-sand: #E4D1B0;
  --color-gold: #F59E0B;
  --color-success: #059669;

  /* Two families (§2). Variable-font axes (opsz/wght/WONK) aren't a single @theme token — set
     via font-variation-settings on the display component. */
  --font-display: "Fraunces", ui-serif, serif;
  --font-sans: "Geist", ui-sans-serif, sans-serif; /* tabular figures on, carries every numeral */

  /* Type scale, 390px base (§2); 1440px override below */
  --text-display: 2.5rem; --text-display--line-height: 1.1;      /* 40/44 */
  --text-h1: 2rem; --text-h1--line-height: 1.19;                 /* 32/38 */
  --text-h2: 1.5rem; --text-h2--line-height: 1.25;                /* 24/30 */
  --text-h3: 1.25rem; --text-h3--line-height: 1.3;                /* 20/26 */
  --text-body: 1rem; --text-body--line-height: 1.5;               /* 16/24 */
  --text-small: 0.8125rem; --text-small--line-height: 1.38;       /* 13/18 */
  --text-label: 0.75rem; --text-label--line-height: 1.33;         /* 12/16 */
  --text-price: 1.125rem; --text-price--line-height: 1.22;        /* 18/22 */
  --text-price-secondary: 0.875rem; --text-price-secondary--line-height: 1.29; /* 14/18 */
  --text-button: 0.9375rem; --text-button--line-height: 1.33;     /* 15/20 */

  /* Radius, one per component (§3). Sheet/drawer/search are single-side — apply as
     rounded-t-*/rounded-l-*/rounded-b-* utilities using these values. */
  --radius-card: 1rem;        /* 16px */
  --radius-pill: 999px;
  --radius-input: 0.75rem;    /* 12px */
  --radius-sheet: 1.5rem;     /* 24px, top only */
  --radius-drawer: 1rem;      /* 16px, left only */
  --radius-search: 1.25rem;   /* 20px, bottom only, flush top */
  --radius-dialog: 1.25rem;   /* 20px */
  --radius-admin: 0.75rem;    /* 12px */

  /* Spacing: Tailwind v4's default 0.25rem (4px) base already generates 4·8·12·16·20·24·32·48·64·96
     as spacing-1/2/3/4/5/6/8/12/16/24. No override needed. */
}

/* 1440px type scale (§2) */
@media (min-width: 1440px) {
  :root {
    --text-display: 4rem;         /* 64/68, opsz 96 */
    --text-h1: 2.75rem;           /* 44/50 */
    --text-h2: 1.875rem;          /* 30/36 */
    --text-h3: 1.375rem;          /* 22/28 */
    --text-body: 1rem;            /* 16/26, measure 65–75ch */
    --text-price: 1.375rem; --text-price--line-height: 1.18;         /* 22/26 */
    --text-price-secondary: 1rem; --text-price-secondary--line-height: 1.25; /* 16/20 */
  }
}
```
