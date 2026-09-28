# Access Web mascot assets

Butcher mascot for the login (`Ingresar`) / register (`Registrarse`) panel, in two poses: waving with a cleaver over a butcher block (`ingresar`), and arms open (`registro`). Backgrounds were removed with macOS Vision (`VNGenerateForegroundInstanceMaskRequest`), Vision fusion fragments (stray meat/scale bits) were erased and the silhouette was rebuilt with a clean choke-and-stroke outline (see "Cleanup notes" below), then everything below was composited from those two clean cutouts. All images are WebP (q85), transparent PNG source where noted, sRGB.

## Files and where they go

| File | Layout role |
| --- | --- |
| `carnicero-ingresar-560.webp` / `-1120.webp` | Full-figure transparent cutout, waving pose. Standalone asset (not pre-composited into a panel). 560 = @1x, 1120 = @2x. |
| `carnicero-registro-560.webp` / `-1120.webp` | Full-figure transparent cutout, arms-open pose. Same sizing as above. |
| `carnicero-ingresar-busto.webp` / `-busto@2x.webp` | Transparent bust: exactly the clipped layer used inside the mobile arch (see "Mobile layout" below for the exact stacking offset), 140px wide @1x / 280px @2x, bottom-aligned with `arch-movil`. |
| `carnicero-registro-busto.webp` / `-busto@2x.webp` | Same, arms-open pose. |
| `arch-escritorio.webp` / `@2x.webp` | Standalone cream (`#F2DCC4`) arch shape, 520×493 logical, for the desktop panel. Top fully rounded (radius = width/2), bottom flat, subtle paper grain baked in. |
| `arch-movil.webp` / `@2x.webp` / `@3x.webp` | Same shape at mobile size, 140×196 logical. |
| `panel-escritorio-ingresar.webp` / `@2x.webp` | Full desktop composite, 660×850 logical: red (`#DC2626`) rounded panel (radius 28) + arch + grounded waving figure + contact shadow. |
| `panel-escritorio-registro.webp` / `@2x.webp` | Same, arms-open pose. |
| `panel-movil-ingresar.webp` / `@2x.webp` / `@3x.webp` | Full mobile composite, 358×232 logical: red rounded panel (radius 24) with the LEFT ~192px left empty for real HTML title text (title sits at left 20px/top 22px, ~172px wide — not baked into this image) and the arch + "break the frame" bust on the right. |
| `panel-movil-registro.webp` / `@2x.webp` / `@3x.webp` | Same, arms-open pose. |
| `acceso-transicion.mp4` | 1320×850, 60fps, 3.06s proof of the FULL-SLIDE panel transition: Ingresar → Registrarse → Ingresar. |
| `acceso-transicion-tira.jpg` | 3-frame strip at 50% scale, captioned "0 ms" / "233 ms" / "480 ms" — see "Transition spec" below. |

## Desktop layout measurements (achieved) — unchanged from the previous pass

- Panel 660×850, radius 28. Arch 520×493 (79% × 58% of panel), bottom-anchored, horizontally centered, top radius 260 (semicircle).
- Grounding margin (gap between the panel bottom and the figure's lowest pixel): **58px** for Ingresar, **90px** for Registrarse — both hit exactly.
- Breakout above the arch top: ~207px (Ingresar) vs ~51px (Registrarse). These differ a lot because the two source poses aren't the same height relative to their own head size (the waving arm + table pushes Ingresar's bounding box much taller) — see "Shared scale" below.
- Contact shadow: ellipse 220×30 (Ingresar) / 160×20 (Registrarse), 40% opacity, 17px blur.
- Paper grain: ±6 luminosity noise, masked to inside the arch only.

### Shared scale (head match)

The two source illustrations aren't drawn at the same relative scale — at native resolution the arms-open pose's head is noticeably bigger than the waving pose's head. Both desktop panels use **one shared base scale** for the arms-open pose, and the waving pose gets that **same base scale × 1.45**, so the heads read as the same size when the panel toggles between the two. Margins (58/90) were then hit exactly at that shared scale; breakout is what's left over and is allowed to differ (a real geometric tradeoff, not a mistake — you cannot force an identical bottom margin AND an identical breakout out of two differently-proportioned source poses with a single shared scale factor).

## Mobile layout (achieved) — "break the frame" rule, new in this pass

The first mobile pass used a rectangular bust crop; the straight crop edges showed over the red and the two poses' heads didn't match in size. Rebuilt on a different rule:

- **Below the neck line, everything is clipped to the arch silhouette** (140×196, right 12, bottom 0, top radius 70) — the raised hand, the cleaver, fingers, all of it, exactly like the shoulders and torso.
- **Above the neck line, only the head + cap may extend past the arch.** This is a *second*, smaller shape unioned with the arch: a head-sized circle (radius 58, i.e. 116px wide — wider than the head for brim margin, narrower than the arch's own 140px) positioned so its top clears both poses' cap tops, then linearly **tapered out to the arch's exact 140px width by the neck line**. The taper matters: a circle sized to the arch's own full width would jump straight out to x=arch-left immediately above its curve, and on the Ingresar pose that width happens to be exactly where the raised arm crosses on its way to the raised hand — a fixed-width exemption pulled in a disconnected floating chunk of forearm. Tapering keeps the exemption at head width through the zone the arm passes through and only opens to full arch width near the neck line, where the two shapes must match for a seamless handoff anyway. Every visible boundary is therefore either the arch's own curve, the head-circle's curve, the linear taper between them, or the character's own natural silhouette (gaps between fingers, etc.) — never a straight crop edge.
- **One shared head width for both poses.** Both are independently scaled so the eye-level ear-to-ear width is exactly **104px @1x** (within the requested 96–112px window) — solved directly (`scale = 104 / native_ear_to_ear_width`), not tuned by eye, so the match is exact by construction rather than approximate.
- **Same chin y for both poses.** Both are independently positioned so the chin lands at **y=126 @1x**, solved the same way (`y_offset = 126 - native_chin_y * scale`).
- **Cap top clears the panel top** by construction: **12.9px** (Ingresar) / **16.0px** (Registrarse) below the panel's own top edge, both ≥ the required 10px.
- Native landmarks the scale/position solve was built from (measured off the cleaned cutouts): Ingresar cap-top y=195, chin y=419, ears x=406–612 (206px wide); Registrarse cap-top y=224, chin y=519, ears x=370–649 (279px wide).

### Busto stacking offset

`carnicero-*-busto.webp` is exactly the same clipped character layer used inside the panel, rendered on its own **140×232 @1x** canvas (140 = arch width, 232 = full panel height) at the identical position — just cropped to the arch's own x-span instead of the full 358px panel width. To reconstruct the panel's arch+character region from the two standalone files: place `arch-movil` and the matching `carnicero-*-busto` **bottom-aligned** (both files' bottom edge on the same baseline). Because busto's canvas is 232 tall and arch-movil's is 196 tall, that puts arch-movil's top-left corner at pixel **(0, 36)** inside the busto canvas (232 − 196 = 36, matching `ARCH_Y` in the panel) — busto simply extends 36px higher than arch-movil to carry the head breakout. At @2x, double both figures (arch-movil top-left lands at (0, 72) inside the 280×464 busto canvas).

## Transition spec

The approved transition is a full 660px slide (not a small "shift and settle" bump — that was wrong in the previous pass). Direction follows the live page (`css/pages/_access.scss`'s `.left-panel`/`.right-panel` + `.sign-up-mode` swap): **Ingresar = mascot panel in the LEFT slot, form in the RIGHT slot; Registrarse = panel RIGHT, form LEFT.** This proof only defines the **timing and the swap** — if the live page's own slide direction or exact duration differs from what's implemented today, keep the page's direction and just bring the timing/swap below in line with it.

| Property | Duration | Curve | Reduced motion |
| --- | --- | --- | --- |
| Panel position (`transform: translateX`) | 480ms | `cubic-bezier(0.77, 0, 0.175, 1)` | 150–200ms opacity swap only (no slide, no blur) |

- The panel slides the full 660px between the two slots — no bump, no bounce, straight `translateX` driven by the eased progress.
- The character pose does a **hard swap** — exactly one fully-rendered panel exists at any instant, never a crossfade of both — timed to the curve's max-velocity point, found numerically (not assumed at the midpoint): **t = 0.477 of the 480ms slide, i.e. 229ms in.** Measured swap frames in the delivered MP4 (60fps, 16.7ms/frame): **frame 62 (of 184, 0-indexed)** at t≈1033ms absolute for the Ingresar→Registrarse slide, **frame 139** at t≈2317ms absolute for the return slide (each ≈229ms into its own 480ms slide, matching the curve's max-velocity point to within one frame).
- A Gaussian blur ramps 0→2px→0 over a ≤120ms window centered on each swap instant, masking the cut (the "masking imperfect crossfades" technique — blur < 20px, used only because tuning easing/duration alone can't hide a discrete content change).
- The form revealed by the slide is a textless wireframe card (`#151517` card, `#232326` field/label bars, `#3F3F46` button bar) already sitting, fully opaque, in the slot the panel is leaving — visible and focusable from the first frame of the slide, simply uncovered by the panel's own motion, not faded in. The form in the slot the panel is *arriving* at fades out over the **last 120ms** of the slide, finishing just as the panel arrives to cover it.
- `prefers-reduced-motion`: drop the slide and blur entirely, cross-swap opacity over 150–200ms instead.

## Resolution caveat

The native Vision cutout is about **599×790px** (Ingresar, tight-cropped) / **940×811px** (Registro, arms spread). The `-1120` full-figure export is roughly a **1.4× upscale** past that native detail ceiling — expected softening at that size, not a bug. The `@2x`/`@3x` panel and arch exports are re-rendered from the same source at full working resolution (not a pixel-upscale of the @1x PNG), so they stay sharp; only the `-1120` standalone figure and any custom size beyond ~800px tall on the full figure will show upscale softness.

## Cleanup notes (background removal)

Vision's `VNGenerateForegroundInstanceMaskRequest` fused two extra objects into the single foreground instance in the source art: a maroon meat/sausage scrap resting on the raised hand in both poses, and a grey rectangular fragment (reads like a digital scale) floating between the neck and the raised cleaver arm in the Ingresar pose only. Both were solidly connected to the main silhouette (not just anti-aliasing contact — confirmed by connected-component analysis at multiple alpha thresholds), so removal is a box-gated erase (color-gated for the maroon fill; for the grey fragment, gated to protect the collar's white and the cleaver blade's blue-tinted grey specifically, inside a tightly re-measured box) rather than a blind rectangle — the first attempt at the grey fragment used a plain rectangle and ate a hole through the shirt collar and notched the cleaver's edge; re-measuring the fragment's true bounds against the collar and blade in a fine pixel grid fixed both.

The outline/edge quality needed two rebuilds. **v1** recolored edge pixels by nearest-interior-pixel lookup (`distance_transform_edt`) to kill a color halo; on curved boundaries (the cap, fingertips) that nearest-neighbor selection is a Voronoi partition that changes direction abruptly wherever the nearest source pixel switches, which painted a grey, jaggy, streaky band — radial streaks on the cap, "chewed teeth" on the straight table-leg edges. Replaced by **choke and stroke**: build a clean binary silhouette from the Vision alpha (≥0.5), fill only fully-enclosed pinholes under ~400px² (real see-through gaps that open to the exterior are left alone), smooth it with a radius-2 disk opening then closing, choke (erode) the interior fill, and paint one uniform anti-aliased outline stroke on top in a single sampled color (median of the character's own existing dark outline pixels, ≈(15,11,9) for Ingresar / (4,4,3) for Registro). There is no per-pixel nearest-neighbor color decision at the visible edge anywhere in this pipeline.

**v2** fixed a double contour v1's choke-and-stroke still had: the stroke only reached 2px deep while Vision's own color contamination reaches ~5-6px deep (see the halo measurement above), so there was a band where neither the stroke nor the solid interior fill had opaque coverage yet — showing contaminated, partially-transparent color as a visible second line alongside the real one. Now: choke **4px** (was 2px) and the stroke spans the **full 4px choke depth outward to +1px** (was choke−1, a 2px ring that fell short of the fill's own retreat and left a gap) — stroke and fill now meet with zero gap by construction. The fill layer's own RGB is also sanitized (nearest fully-trusted-core pixel, `alpha>0.98` eroded 2px further) before use, so even a sub-pixel seam shows already-clean color underneath rather than raw Vision contamination — this sanitization only ever touches the fill's *interior* color, never decides the shape of a visible edge, so it doesn't reintroduce v1's streaking. Verified with a ≥300-normal silhouette scan on the @2x desktop panels checking for the double-dip signature (dark → light → dark → light) specifically, not just any pixel exceeding a lightness threshold (which would also flag ordinary 1px antialiasing as a false positive) — remaining flags on both poses are at concave multi-region junctions (between raised fingers, where a shoe meets the table) where a locally-estimated contour normal isn't a reliable single-edge probe; each was confirmed clean by direct visual inspection.
