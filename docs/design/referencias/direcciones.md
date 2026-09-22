# Three design directions for Carni

Sourced against: motionsites.ai (verified as platform; the specific "oyla" jewelry template could **not** be located — see note below), htmlrev.com free Django/Tailwind templates (verified), horizonx.so/explore (verified), styles.refero.design (verified, with exact tokens pulled from Vercel, Cursor, Linear, Resend entries).

**Verification note on "oyla":** I searched motionsites.ai directly and via web search (`site:motionsites.ai oyla`, plus jewelry-scroll-video queries) and found no template named "oyla." The homepage does list a **"Orla Fashion"** project (fashion, not jewelry) — likely what was meant, but I did not open its dedicated page (no stable URL surfaced) so its specifics are **UNVERIFIED**. What I can verify from motionsites.ai's homepage and `/templates` page: it's a library of AI-prompt templates (React + Tailwind + Framer Motion) organized by category (SaaS, Agency, Portfolio, Ecommerce, 3D), built around scroll-triggered animation and cinematic hero sections — that platform-level pattern is what Direction 1 borrows, not a pixel copy of "oyla."

---

## Direction 1 — "Mercado editorial en movimiento"

**Feels like:** a butcher counter shot like an editorial spread — a big serif headline over the hero video, the video itself cut like a knife stroke as you scroll, then a dense, photo-led product grid. Confident, tactile, food-forward.

**Sourced from:** motionsites.ai's platform pattern (scroll-triggered hero video/reveal → big type → product grid — verified structurally, not from "oyla" specifically) + htmlrev.com's Tailwind product-landing templates (Block, Daiva) for section discipline. **Take:** the scroll-driven hero edit as a motion metaphor, big display type, grid-after-hero rhythm. **Drop:** jewelry/luxury lighting and pastel palettes, generic SaaS gradients — none fit near-black + one red.

**Surfaces:**
- **Hero:** existing video crops/reveals on scroll (one cut, not a montage) under a large Fraunces headline.
- **Category bento:** photo-led tiles, sized by category popularity, no glass/blur.
- **Product card:** one reusable card, diagonal-cropped photo, price/weight in a small serif numeral badge.
- **Search overlay:** full-screen editorial takeover, oversized serif input.
- **Cart drawer:** right panel, hairline-red divider.
- **Product config page:** Por peso / Por precio / Por pieza as bold serif tab labels; thickness slider styled as a butcher's ruler/cut-line graphic.
- **Accessweb / admin / Django inventory:** this direction pulls back here — editorial flourish is dropped, motion budget goes to zero, and it defers to plain Fraunces/General Sans headings over otherwise-utilitarian layout (it does not try to "bento-ify" ops screens).

**Type:** Fraunces (display, variable serif, warm/rustic — Google Fonts) + General Sans (body/UI — Fontshare).

**Surface strategy:** near-black stays the base; the red accent marks only price, CTA, and the cut-line graphic — never decorative.

**Photography:** repeated category photos are hidden by the diagonal-crop treatment (crop varies per card even on a shared source image, so repetition reads less).

**Motion budget:** one scroll-triggered hero cut + card-entry fade — nothing else animates.

**Why it won't look AI-generated:** the "cut" motion is tied to the butchery metaphor, not a generic parallax; serif-numeral price badges are an unusual, specific choice no default stack reaches for.

**Risk:** scroll-driven video is heavy on the mid-range Android phones common in SLP; and it depends on genuinely dramatic footage. Carni's real photos repeat across items and may read as amateur once put under this much editorial spotlight — the treatment flatters good photography and exposes weak photography.

---

## Direction 2 — "Cárnico bento — panel operativo"

**Feels like:** a disciplined ops tool wearing Carni's brand — hairline-bordered cards on near-black, one red accent, monospace numerals for every price and weight. Feels engineered, trustworthy, fast.

**Sourced from:** horizonx.so/explore's bento-grid/dashboard pattern (verified: modular tiles, dark surfaces, dashboard-style cards) + styles.refero.design's Vercel entry (`#fafafa`/`#171717` hairline-border monochrome + one accent, "trusts contrast and typography over color") and Linear entry (near-black `#08090a` canvas, one accent `#e4f222`, 8/12/24/96 spacing ladder, Inter Variable at `510/1` for display, mono for data). **Take:** hairline-card system, single-accent-on-dark discipline, the spacing ladder, mono-for-numbers pattern. **Drop:** horizonx's multi-accent neon (purple/teal/orange — Carni keeps ONE red), heavy glassmorphism/blur (mobile perf cost on MX 4G), Linear's acid-lime and Vercel's white canvas (Carni stays near-black + #DC2626 only).

**Surfaces:**
- **Hero:** same video, but framed inside a bento tile rather than full-bleed — smaller motion budget than Direction 1.
- **Category bento:** direct application of horizonx's modular grid.
- **Product card:** one reusable hairline-bordered card, weight/price as a mono tag top-right.
- **Search overlay:** command-palette style (⌘K-like), monochrome with a red focus ring — needs a visible search-icon fallback for non-power-users.
- **Cart drawer:** same hairline system, itemized mono numerals.
- **Product config page:** three modes as a segmented pill control; thickness slider as a horizontal tick-mono ruler with live mono-numeral price recalculation.
- **Accessweb:** the easiest of the three — already low-color, low-motion.
- **Admin dashboard:** this direction's native home — stat tiles, hairline grid, red reserved for alerts/CTAs, mono KPIs.
- **Django inventory:** ports cleanly with zero JS — hairline borders + mono table numerals are exactly what htmlrev.com's verified free Django admin templates (Unfold, Django Daisy — both Tailwind-based) already do as static markup.

**Type:** Instrument Sans (display + body, Google Fonts) + JetBrains Mono (labels/prices/weights).

**Motion budget:** near-zero; state changes (hover, focus) only — no scroll choreography.

**Why it won't look AI-generated:** the discipline of "color only marks meaning" (price, alert, CTA) rather than decoration is a specific, sourced constraint, not a default Tailwind template look.

**Risk:** a bento/dashboard aesthetic can read as "SaaS tool" rather than "carnicería," which may alienate an older or less tech-forward Potosino clientele who wants to feel they're buying meat, not running a dashboard. The ⌘K search pattern is a power-user convention most retail shoppers won't discover without the icon fallback.

---

## Direction 3 — "Mostrador digital — server-plain, human warm"

**Feels like:** deliberately boring where it needs to be (forms, admin, Django) and warm only in a few human moments (hero, empty states). Proves restraint can still feel intentional.

**Sourced from:** htmlrev.com's free Django templates (verified: Unfold, Django Daisy, Grappelli, Soft UI Dashboard Django — plain, dense, server-rendered, some dark-mode-capable) + styles.refero.design's Cursor entry (warm-tinted neutrals, EB Garamond as an editorial serif accent, hairline borders, no gradients/pills) and Resend entry (`#000000` canvas, hairline borders, no shadows, monospace-as-identity, 150ms restrained motion). **Take:** the proof that no-JS, server-rendered admin templates can look intentional; Cursor's idea of a serif used sparingly for warmth; Resend's "no gradients, no shadows" restraint. **Drop:** Cursor's literal cream/parchment canvas (wrong for Carni's near-black brand — we invert it to warm near-black), Resend's violet accent (Carni is red-only) and its 77–96px display sizes (legibility/perf risk on small Android screens).

**Surfaces:**
- **Hero:** video kept minimal, one quiet Newsreader line overlaid — no scroll-driven spectacle; the argument is Carni needs trust, not a show.
- **Category bento:** plain 2–3 column grid, Switzer labels, no glass.
- **Product card:** same reused card, no crop trick — consistent `object-fit` photo + Switzer name + mono price.
- **Search overlay:** simple slide-down bar, not a takeover.
- **Cart drawer:** plain right panel, Switzer throughout.
- **Product config page:** modes as plain tabs (a pattern that could later port 1:1 to a server-rendered fallback); thickness slider is a near-native range input with Switzer tick labels — deliberately unbreakable on older Android WebViews.
- **Accessweb:** the safest by construction — near-zero motion, high built-in contrast.
- **Admin dashboard + Django inventory:** this direction's true home — build tokens as plain Tailwind utility classes first (matching Unfold/Django Daisy's approach), so the same system works identically whether rendered by React or by Django templates with zero JS.

**Type:** Newsreader (Google Fonts, quiet editorial serif, used only for hero/empty-states) + Switzer (Fontshare grotesk, carries ~95% of the UI including every admin/Django screen) + JetBrains Mono for prices/weights.

**Motion budget:** near-zero everywhere; 150ms ease-out transitions only, no scroll choreography, no reveal animation.

**Why it won't look AI-generated:** it refuses the default AI instinct to animate everything — the design is legible specifically because it stops.

**Risk:** deliberate restraint demands more design discipline, not less — with weak photography or imprecise spacing this direction reads as unfinished or cheap rather than confident. It's also the least forgiving of the shared-category-image problem: a plain grid has nothing else to distract from repeated photos, so the repetition is more exposed than in Direction 1 or 2.
