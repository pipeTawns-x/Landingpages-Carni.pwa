---
name: Carni-mvp — Mostrador Digital
description: Near-black butcher-shop storefront and admin system for "Carnicería El Señor de La Misericordia." Fraunces display + Geist UI/numerals, one red accent, purposeful motion under 300 ms, mobile-first at 390px. One contract for the store (React + Tailwind) and the admin panel served by Django.
source-of-truth: src/styles/tokens.css
colors:
  bg: "#0B0B0C"
  surface-1: "#151517"
  surface-2: "#1C1C1F"
  surface-3: "#232326"
  border: "#3F3F46"
  border-control: "#71717A"
  text: "#F5F3EF"
  text-muted: "#A8A29B"
  red: "#DC2626"
  red-hover: "#C81E1E"
  red-text: "#F05252"
  sand: "#E4D1B0"
  gold: "#F59E0B"
  success: "#059669"
  danger: "#F43F5E"
  veil: "rgb(0 0 0 / 0.92)"
typography:
  display: "Fraunces Variable (self-hosted with Fontsource)"
  ui: "Geist Variable (self-hosted with Fontsource), tabular figures for every number"
rounded:
  control: "12px"
  card: "16px"
  dialog: "20px"
  sheet: "24px"
  pill: "9999px, buttons only"
motion:
  ease-out-strong: "cubic-bezier(0.23, 1, 0.32, 1)"
  ease-drawer: "cubic-bezier(0.32, 0.72, 0, 1)"
spacing: "4px base — 4 8 12 16 20 24 32 48 64 96"
---

## Source of truth

`src/styles/tokens.css` holds the real `@theme` and is the only place a token is changed. Two Tailwind pipelines import it and generate the same values: the store (`src/styles/tailwind.css`, with Vite) and the admin panel that Django serves (its own Tailwind v4 build). This file explains the system; it never redefines a value. If they disagree, `tokens.css` wins and this file is fixed in the same commit.

## Overview

"Mostrador digital": near-black surfaces, one red accent, editorial typography, motion that explains
and never decorates. No backdrop blur, no decorative gradients: the only gradients are the scrim over
the hero video and the header veil. Two type families, no exceptions. Component inventory:
`docs/design/arquitectura-componentes.md`.

## Colors

| Token | Hex | Contrast | Use |
|---|---|---|---|
| `bg` | `#0B0B0C` | — | page background |
| `surface-1/2/3` | `#151517` / `#1C1C1F` / `#232326` | not contrast-bearing | card / overlay / sheet |
| `border` | `#3F3F46` | 1.88:1 vs bg | decorative hairlines ONLY. Never the edge of a control |
| `border-control` | `#71717A` | ≥ 3.24:1 on bg and the three surfaces | fields, chips, toggles |
| `text` / `text-muted` | `#F5F3EF` / `#A8A29B` | 18.9:1 / 8.1:1 | body / labels |
| `red` / `red-hover` | `#DC2626` / `#C81E1E` | white on red 4.83:1 / 5.74:1 | FILL only: the primary button |
| `red-text` | `#F05252` | ≥ 4.5:1 on bg and the three surfaces | red used as text |
| `sand` | `#E4D1B0` | 13.16:1 | focus ring, links, details |
| `gold` | `#F59E0B` | 8.4:1 | stars and badges only |
| `success` / `danger` | `#059669` / `#F43F5E` | 6.2:1 / 4.6:1 | success text / errors |
| `veil` | `rgb(0 0 0 / 0.92)` | — | header on real hover or focus-within |

One accent (`red`) for every primary action. Never use `red` as text color: use `red-text`.

## Typography

Fraunces (headings) + Geist (body, labels, numbers). The default Tailwind sizes are erased (`--text-*: initial`): only these six roles exist.

| Role | Token | Size / line height |
|---|---|---|
| Label, notes | `text-meta` | 13/18 |
| Body and UI | `text-ui` | 15/22 |
| Lead paragraph | `text-lead` | 18/26 |
| Card title, h3 | `text-titulo` | clamp 18 to 24 / 1.2 |
| Section h2 | `text-seccion` | clamp 28 to 48 / 1.08, −0.01em |
| Hero h1 | `text-portada` | clamp 28 to 72 / 1.04, −0.015em (31 px at 390, 72 px at 1440) |

Spanish runs longer than English: the hero h1 takes at most 3 lines at 390 and 2 at 1440. Every number (price, quantity, KPI, table cell) uses Geist tabular figures.

## Layout

4px base spacing. Mobile-first: 390px then 1440px. Touch targets ≥ 44×44px and ≥ 8px apart. One header and one footer reused by every public page. The header is transparent over the hero video, turns `veil` on real hover (fine pointer) or focus-within, and is solid `bg` after the hero. There is no hover on touch: there the header goes solid on the first scroll.

## Elevation & Depth

Strict stack: **page (`bg`) → card (`surface-1`) → overlay (`surface-2`) → sheet (`surface-3`)**. Surfaces separate by a 1px `border` hairline, never by a shadow. No hard offset shadows, no colored border-left callouts, no default-Bootstrap look.

## Shapes

One radius per component: control 12px · card 16px · dialog 20px · sheet 24px (top corners; the hero's bottom corners on mobile) · pill 9999px, buttons only. The admin panel uses the same radii.

## Motion

Interface motion stays under 300 ms and never uses ease-in. `ease-out-strong` for presses (`scale(0.97)`, 160 ms), the header and carousel dots; `ease-drawer` for sheets and drawers (240–320 ms, exit 30% faster). Animate only `transform` and `opacity`. With `prefers-reduced-motion` sheets only fade (150 ms) and rotating content stops. The login panel slide is the one exception: 480 ms, `cubic-bezier(0.77, 0, 0.175, 1)`.

## Components

Core primitives (full inventory in `docs/design/arquitectura-componentes.md`):

- **Button** — primary pill (`red`, white text, 44px, 2px `sand` focus ring); secondary (`sand` outline); ghost; icon (44×44).
- **Input** — `surface-1`, 1px `border-control`, 12px radius, 48px height, label above, `danger` border and inline message on error.
- **Filter chip** — `surface-2` with `border-control`; `red` fill when active (chips only, never nav).
- **Qty stepper** — 44px row, ±44×44 buttons, tabular number, "+" disabled at the stock maximum.
- **Product card (Tarjeta)** — one card for the whole site: photo, name, price with unit and a 44px "+" button in outline. The filled red button lives only in the product detail ("Agregar") and the cart ("Pagar"). Products without their own photo show the category photo labeled "Foto ilustrativa".
- **Sheet (Hoja)** — native `<dialog>` with `showModal()`: visible 44px close button, Escape, backdrop click, focus trap and focus return. Every drawer, menu, modal and confirmation uses it.
- **Status chip** — 24px pill, 14px icon + 12px label; the icon always pairs with color.
- **KPI card** — `surface-1`, 12px radius, 20px padding; label, tabular value, delta, period.

## Do's and Don'ts

- Do keep every number in Geist tabular figures.
- Do pair every status chip's color with an icon and a label.
- Do show focus rings instantly: 2px `sand`, on every interactive element, also on red.
- Do give every overlay a visible close button, Escape and backdrop click.
- Do make add-to-cart explicit and quiet: the button reads "Agregado ✓" for 1.5 s and the cart counter goes +1. The cart sheet does not open by itself. No toast.
- Don't show exact stock to customers: "Disponible", "Pocas piezas" or "Agotado". The number appears only in the admin panel.
- Don't use `red` as text, a gradient other than the video scrim and header veil, backdrop blur, or emoji icons.
- Don't hardcode a kg+lb price pair: the unit comes from the category and from the database.
- Don't show two search affordances at once.
- Don't wrap a clickable label to two lines.
