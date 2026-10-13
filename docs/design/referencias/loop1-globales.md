# Loop 1 — Global pieces research: search overlay, cart, header/hamburger

Research only, no repo edits. Sourced via WebFetch/WebSearch (no Playwright). Louis Vuitton's own site wasn't directly fetchable this pass — the LV reference is carried from Eduardo's description, not verified live.

## Search overlay

- **prebuiltui.com/components/search-bar** — https://prebuiltui.com/components/search-bar. Copy-paste Tailwind pill inputs (icon, button, rounded, mic). Light-mode by default, no overlay behavior — a shape reference for the pill field only; dark tokens would need to be applied manually.
- **Baymard autocomplete research** — https://baymard.com/blog/autocomplete-design. Only 19% of sites get autocomplete right despite 80% shipping it. Concrete rules: cap suggestions at ~10 desktop / 4–8 mobile; bold the *predicted* text portion, not what the user typed; darken the page behind the field when active; on mobile, strip sticky headers and other competing chrome from the suggestion area.
- **Sparq — 22 best search UI examples** — https://www.sparq.ai/blogs/best-search-ui-examples. **Samsung**'s full-page overlay removes the header entirely (no second search field visible); **Speedo** dims the rest of the page instead. **Target** shows trending searches before any typing (the "tendencias" behavior). **Princess Polly** combines images, names, prices, trending terms and collection shortcuts — closest match to "suggestion rows with section titles." **Prada**'s suggestions refresh live per keystroke, including category/color variants. **Bombas** ships large tappable cards + a sticky filter bar on mobile.
- **Mobbin's overlay glossary returned HTTP 403** — auth-walled, consistent with the investigador skill's note on Mobbin. Unusable this pass.
- **htmlrev.com** and **horizonx.so/explore** did not surface a component labeled full-screen search overlay; horizonx's closest hit is a filter panel, a different pattern. Inspiration only.

**The four questions:** (a) *Header underneath* — never two search fields at once; Samsung/Speedo hide or dim it, Samawa Perfumes (also in the Sparq list) slides a side panel over a hidden page. (b) *Close affordance* — none of the sources specify an icon beyond X-top-right/Esc convention; the shared functional signal is the darkened/removed background itself. (c) *States* — empty = trending only (Target); typing = live suggestions with bold predicted text + category scoping (Baymard, Prada); no-results is an undocumented gap in every source — plan a trending+categories fallback rather than inventing behavior. (d) *390px grid* — Baymard's 4–8-item cap plus stripped chrome, and Bombas's large-tap-card pattern, are the concrete mobile references.

## Cart

- **Vervaunt roundup** — https://vervaunt.com/ecommerce-cart-drawers-examples-technologies-ux-best-practices. Kettle & Fire, Natreve, Primal Kitchen: Shopify-Plus drawers with quantity editing, a free-delivery progress bar, direct-to-checkout CTA. Recess uses a gift-note field instead of recommendations. None confirmed dark.
- **CommerceGurus** — https://www.commercegurus.com/best-ecommerce-cart-drawers/. SpaceNK, Passenger, Sous Chef, L'Amarue, Huron: a "you're $X from free shipping" progress bar is the standard minimum-order device. Spacegoods pairs its bar with a countdown-timer reservation state (urgency). Huron auto-adds a free gift past threshold. Also not confirmed dark.
- **Dark gap** — neither roundup names a confirmed dark drawer. Closest verified dark reference: **horizonx.so/explore**, which lists paid dark-mode product-card components (pricing, steppers, swatches) and a dark checkout kit — paid inspiration, not a free live site. Recommendation: build the progress-bar + stepper pattern above on the existing near-black `#DC2626` palette rather than copy a specific dark cart 1:1.

## Header / hamburger

- **UXPin — 8 types of mobile navigation** — https://www.uxpin.com/studio/blog/mobile-navigation-examples/. Names hamburger/side-drawer as right for many items. Its own active-state rule: mark the current item "using color, weight, or an underline," never a filled pill — matches Eduardo's constraint directly. Composite real examples cited: Spotify, Google Calendar, Google Maps (drawer + tab-bar, not pure single pattern).
- horizonx.so and htmlrev.com surfaced no named hamburger/drawer component this pass (horizonx leans checkout/e-commerce, not nav chrome).
- **styles.refero.design** — https://styles.refero.design/ — gallery of real sites' *tone*, not components. Useful only as dark-palette mood (Resend's near-black-plus-neon-accent, Authkit's dark glass), not structure.

## Anti-slop rules (hallmark skill, applied to these three pieces)

Source: `~/.claude/skills/hallmark/references/anti-patterns.md` and `references/typography.md`.

1. **The AI nav** — wordmark-left / 4–5 links / CTA-right / sticky / hairline-border is "the most-recognised AI nav fingerprint." Route to a deliberate archetype instead.
2. **Focus rings that animate in** — rings must appear instantly, on the search input, cart stepper, and every drawer link.
3. **Hover-only affordances** — cart icon and search trigger need an equivalent focus/tap state.
4. **Bounce/elastic easing** — no overshoot on drawer/overlay open-close; exponential ease-out only.
5. **Wrap-to-two-lines clickable text** — cart CTAs and nav labels must never wrap to a second line (gate 49).
6. **Mismatched icon sets** — one icon library across search glass, close X, cart bag, hamburger lines.
7. **Generic emoji as feature icon** — no sparkle/emoji on cart badges or trending-search chips.
8. **Celebratory success toasts** — add-to-cart is silent success (drawer opens / count bumps), not a confirmation toast.
9. **Tabular data without tabular-nums** — cart prices/quantities need `font-variant-numeric: tabular-nums`.
10. **2+1 typography rule + banned defaults** — Inter/Roboto/system-ui-only is banned; pick a real display+body pairing from the allowlist.

## Licensing notes

- **prebuiltui.com** — free copy-paste; license terms not read this pass, verify on-site before lifting code.
- **htmlrev.com** — aggregator; each linked template carries its own license.
- **horizonx.so/explore** — explicitly paid, inspiration-only per the brief.
- **styles.refero.design** — gallery of real third-party sites; DNA/mood reference only per hallmark's `study` discipline — never pixel-clone, no code/asset copying.
- **Mobbin** — subscription/auth-walled; 403 here, unverified.
- Baymard, Vervaunt, CommerceGurus, UXPin, Sparq — editorial research content, cited for findings only, not for reusable code or assets.
