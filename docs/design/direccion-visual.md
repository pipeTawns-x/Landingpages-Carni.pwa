# Visual direction — spec sheet for the canvas tool

Numbers only, execute as written. Source of truth: `spec-rediseno-v1.md` v1.4 §5/§5.1/§6, `loop-mejoras.md` §6.
Palette anchors (fixed by spec): near-black bg, red `#DC2626` primary, sand `#E4D1B0`, gold `#F59E0B` (stars/badges only), green `#059669` (success only).

## 1. Surfaces and elevation (near-black)

| Token | Hex | Contrast on bg | Used for |
|---|---|---|---|
| `bg` | `#0B0B0C` | — | page background |
| `surface-1` | `#151517` | not contrast-bearing | card **on** page. Surfaces separate by border, never by their own contrast |
| `surface-2` | `#1C1C1F` | not contrast-bearing | overlay **above** page (search, cart backdrop) |
| `surface-3` | `#232326` | not contrast-bearing | sheet/modal **above** overlay |
| `border` | `#3F3F46` | 3.1:1 vs bg | hairlines only, never shadows (G4.1). 3:1 is the WCAG minimum for a component boundary, so this is the one non-text value that must be measured |
| `text` | `#F5F3EF` | 18.9:1 | body/headings |
| `text-muted` | `#A8A29B` | 8.1:1 | labels, secondary price — warm gray, never gray-on-gray (ui-ux-pro-max §6) |
| `red` / `red-hover` | `#DC2626` / `#C81E1E` | white-on-red 4.53:1 (WCAG AA) | primary actions, focus, active nav |
| `danger` | `#F43F5E` | white-on-danger 4.6:1 | errors — distinct hue so a form error near a red CTA reads unambiguously |
| `sand` | `#E4D1B0` | 13.7:1 | subtle accents, drag handles |
| `gold` | `#F59E0B` | 8.4:1 | stars, badges only |
| `success` | `#059669` | 6.2:1 | success text/Entregado only |

Elevation: **page → surface-1 (card) → surface-2 (overlay) → surface-3 (sheet above overlay)**. No level-skipping — a sheet opened from an overlay sits at surface-3, never surface-1.

## 2. Type scale — two families

**Recommendation: A) Fraunces (display/h1/h2/h3) + Geist (body/label/price/button)** — working pick pending Eduardo's G0.1 letter. Fraunces' `opsz` axis (9–144) covers butcher-editorial display down to a controlled h3 without a third face; Geist ships tabular lining figures by default, so it — not Fraunces — carries every price, KPI and table numeral (craft-floor: tabular numerals must be themed).

| Role | 390px | 1440px | Weight/axis |
|---|---|---|---|
| Display | Fraunces 40/44, track -0.04em (tracking floor, craft-floor) | 64/68, opsz 96 | wght 480, WONK 0 |
| H1 | Fraunces 32/38 | 44/50 | wght 480, opsz 72→96 |
| H2 | Fraunces 24/30 | 30/36 | wght 440, opsz 48 |
| H3 | Fraunces 20/26 | 22/28 | wght 440, opsz 24 |
| Body | Geist 16/24 (1.5 — ui-ux-pro-max leading rule) | 16/26, measure 65–75ch (craft-floor) | wght 400 |
| Small | Geist 13/18 | 13/18 | wght 400 |
| Label | Geist 12/16, +0.04em, uppercase | 12/16 | wght 500 |
| Price | Geist **tabular**, 18/22 primary + 14/18 secondary | 22/26 + 16/20 | wght 600 primary, 400 secondary. The unit is decided by category (spec §5): meat = `/ kg` primary with `/ lb` secondary; merch = `/ pieza`, no secondary; package offer = `/ paquete`, no secondary |
| Button | Geist 15/20 | 15/20 | wght 600 |

## 2.1 Character budget (Spanish copy runs longer than English)

| Role | 390 px | 1440 px | If it overflows |
|---|---|---|---|
| Display | 28 chars | 48 chars | drop one size step, never wrap to three lines |
| H1 | 34 chars | 60 chars | two lines maximum |
| H2 | 42 chars | 70 chars | two lines maximum |
| H3 / card name | 38 chars | 48 chars | clamp to 2 lines with ellipsis |
| Button label | 18 chars | 24 chars | shorten the copy, never wrap |
| Chip | 14 chars | 18 chars | shorten the copy |

Test strings that must fit before a frame passes: "Carnicería El Señor de La Misericordia", "Chambarete con tuétano para caldo", "Continuar con el pedido", "Preparando".

\1

4px scale: `4·8·12·16·20·24·32·48·64·96`.

| Component | Radius |
|---|---|
| Product card | 16px |
| Button (pill) | 999px |
| Input | 12px |
| Chip | 999px |
| Bottom sheet (mobile) | 24px top corners only (G2.1 minimum) |
| Drawer (desktop cart) | 16px left corners only |
| Search overlay (desktop) | 20px bottom corners, flush top |
| Dialog/modal | 20px |
| Admin card/table container | 12px |

## 4. Component specs

**Product card** — image 4:5, 16px padding, radius 16px, 1px `border`. Price unit-aware (spec §5): meat `$X / kg` + `$Y / lb` secondary; merch `$X / pieza`; package offer `$X / paquete` — never a hardcoded pair. States: default; hover (desktop, translateY(-2px) + border→red 30%, 160ms); pressed (scale 0.98, 80ms); out-of-stock (image desaturate 40%, gray badge, Agregar disabled); compact (1:1 image, 12px padding, 1-line name — search/carousel); offer (gold corner ribbon + struck secondary price — `DESIGN-AHEAD: no discount/offer-date column exists`, §5.1).

**Buttons** — primary pill: `red` bg, white text, 44px height, hover `red-hover`, 2px offset focus ring. Secondary: 1px border/sand outline. Ghost: text-only, underline on hover. Icon button: 44×44 hit area, 20px glyph.

**Input** — `surface-1` bg, 1px border, radius 12px, 48px height, label above (Geist 500 13px), accented placeholders ("Contraseña", "Correo electrónico" — F0.5). Focus: 2px `red` ring + border. Error: border `danger` + inline message. Disabled: 40% opacity.

**Chip** — default `surface-2` + border, text-muted, 32px height, 999px. Active: `red` bg, white text (chips are the one place a filled pill is correct — G3.2 bans it only for *nav*).

**Qty stepper** — 44px row, ±buttons 44×44, number min-width 32px tabular. At max: "+" disabled + hint "Stock disponible: X".

**Admin table row** — 48px height (40px dense), 12/16px cell padding, `border-bottom` hairline only, never a shadow (G4.1). Numeric columns right-aligned, tabular.

**KPI card** — `surface-1`, 1px border, radius 12px, 20px padding. Formula: label → value (H2, tabular) → delta (arrow icon + color, never color alone) → period → optional 48px sparkline (dashboardcn formula, borders-over-shadows — AdminLTE).

**Status chip (6, G4.4)** — pill, 24px height, 14px icon + 12px label, 6px gap. Color is secondary to icon+label on all six:

| Status | Treatment |
|---|---|
| Pendiente | neutral `surface-2`, clock icon |
| Confirmado | neutral `surface-2`, check icon |
| Preparando | neutral `surface-2`, knife/cut icon |
| Listo | neutral `surface-2`, package icon |
| Entregado | `success` 12% tint bg + text, check-circle icon |
| Cancelado | `danger` 12% tint bg + text, x-circle icon |

**Sheet/drawer** — mobile bottom sheet: `surface-3`, 24px top radius, 32×4px sand drag handle, max 90vh, flat scrim `bg` @70% (no blur — craft-floor bans decorative glass). Desktop cart drawer: 420px, right-anchored, 16px left radius. Desktop search overlay: `surface-2`, max-width 720px centered, pill input 56px, no inner icon, focus ring on the pill itself, close ×44px top-right (G1.3).

## 5. Photography rule (repeated product photos, G0.7)

Several SKUs share one category photo. Rule, in order:
1. **Crop variation** — different focal point/zoom per product from the same source image.
2. **Label hierarchy carries the read**: category label → name (bold, 2-line clamp) → cut detail line ("corte para asar, 2.5 cm") — text, not photo, is what a customer scans.
3. **One scrim gradient only** — bottom-to-transparent black scrim under text-on-photo, the sole gradient allowed anywhere (spec §6).
4. Corner badge (stock/offer) breaks repetition across an otherwise-identical grid.

## 6. Motion budget

| What | Duration | Easing |
|---|---|---|
| Hover/press (button, card) | 80–160ms | exponential ease-out `cubic-bezier(.16,1,.3,1)` |
| Sheet/drawer/overlay entrance | 240–320ms | same ease-out; exit ~30% faster than entry |
| Chevron rotate (FAQ) | 200ms | ease-out |
| Testimonials marquee | continuous, 40s/loop | linear (constant-rate motion keeps linear — ui-ux-pro-max) |
| Focus ring | 0ms | never transitions in (anti-slop gate) |

Animates: `opacity`/`transform` only. Never: width/height/top/left (CLS), or hover-only with no visible non-hover state (mobile has no hover). Max 1–2 animated elements per view (Excessive Motion, ui-ux-pro-max). Reduced-motion: testimonials → static grid; sheets/overlays → 50ms fade; scroll storyboard (F3.1/G6.1) → poster frames only.

## 7. Admin density (Operate mode)

Row height 48px (40px dense toggle), table font 13–14px (below 16px marketing body — density is the Operate-mode priority), 12/16px cell padding. At 390px: **card-transform, not horizontal scroll** (G4.6) — each row becomes a `surface-1` card (radius 12px, 16px padding); primary column (status chip + name) as header, secondary columns as stacked `label: value`, low-priority columns drop into the card body. Sidebar → bottom-triggered full-height drawer, same scrim/radius as public sheets.

## 8. Ten craft gates (check by looking at the frame)

1. Body/placeholder contrast ≥4.5:1, large text ≥3:1 (craft-floor: Contrast).
2. No gradient text, no glass/blur decoration — only the photo scrim is a gradient (craft-floor: Refuse).
3. Every price/qty/table numeral is tabular — digits don't shift column width (craft-floor: browser surfaces).
4. One search affordance at a time; header search hides when the overlay is open (G1.2).
5. Active nav = color/weight/underline, red, never a filled pill, never amber (G3.2).
6. All six status chips pair an icon with the label; color is never the only signal (G4.4).
7. Focus rings appear instantly, 2px, red, on every interactive element (priority-1 a11y).
8. No hard offset shadows, no colored border-left callouts, no default-Bootstrap look (G4.1/G4.3).
9. Clickable labels never wrap two lines; touch targets ≥44×44px, ≥8px apart (priority-2 touch).
10. Any text over a photo sits on a scrim, checked at the photo's lightest region (§6, G5.2).

---
`DESIGN-AHEAD` markers used above: offer card variant (§5.1); any checkout frame built from these tokens inherits the order-number note too (§5.1).
