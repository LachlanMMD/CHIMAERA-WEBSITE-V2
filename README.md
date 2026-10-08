# CHIMAERA — website

Site for CHIMAERA.CPH, a Copenhagen creative community. Built with [Astro](https://astro.build) as a static site; CSS and JS are plain files in `public/`.

## Run locally

```
npm install        # once
npm run dev        # http://localhost:4321 — reloads on save, shows draft events
npm run build      # production build into dist/ (drafts excluded)
npm run preview    # serve dist/ to check the production build
```

## Where things live

| What | Where |
|---|---|
| `coral` / `pale` | the two field colours |
| `colourMidpointX` | 0–1, fraction of viewport width where coral meets pale |
| `organicDeviation` | 0–~0.3, how far that boundary wanders from the midpoint |
| `verticalPosition` | 0–1, reserved vertical bias for the field's centre of mass |
| `coralIntensity` | strength of the coral base fill |
| `opacity` | overall canvas opacity |
| `movementSpeed` | drift speed multiplier — "does the atmosphere move on its own?" |
| `movementAmplitude` | multiplier on `organicDeviation` — how far it wanders |
| `mouseInfluence` | 0–~0.3, how strongly the smoothed cursor nudges the field — independent of the above |
| `mouseSmoothing` | 0–1, lerp factor per frame for the cursor follow — lower = lazier/more delayed |
| `softness` | feather-width multiplier (the fog) |
| `scale` | reserved mass-size multiplier |
| `maxFPS` | frame-rate cap |

`movementSpeed`/`movementAmplitude` and `mouseInfluence`/`mouseSmoothing` are
deliberately separate knobs: one controls how alive the field is on its own,
the other controls how much the user's cursor nudges it — independently
tunable, and mouse influence is desktop/`pointer:fine`-only (never simulated
on touch).

Respects `prefers-reduced-motion` (freezes on one balanced frame, disables
both ambient movement and mouse response entirely) and pauses via the Page
Visibility API when the tab is hidden.

It also exposes `window.ChimaeraAtmosphere.getLuminanceAt(x, y)`, which
`js/header-theme.js` uses so the header logo/star never go invisible against
whatever's actually behind them — each samples its own position independently
and switches "ink" (light vs coral) accordingly, whether that's the live
atmosphere, a solid pale section, or a photograph.

## Navigation (`components/header.html` + `components/navigation.html` + `js/navigation.js`)

Single star control (top-right, persistent) opens/closes a left-hand panel.
The panel is a *window* onto the one continuous atmospheric field, not a
second gradient — it mounts a second instance of the same renderer, reading
the same config object and the same clock as the page background, so a
change to e.g. `colourMidpointX` moves both at once; there's no independent
midpoint for the nav.

Getting that right required more than sharing the config, though: the panel
uses `transform` for its own slide animation, which makes it the containing
block for its `position: fixed` canvas — naively, that canvas would then
slide with the panel as a rigid rectangle, visibly detached from the static,
viewport-registered background underneath while the panel is mid-motion
(reads as "an orange rectangle sliding in," not "a window opening onto a
field that's already there"). The fix is a second, *equal-and-opposite*
transform on the canvas (`translateX(var(--nav-width))` against the panel's
`translateX(calc(-1 * var(--nav-width)))`, both driven by the same shared
CSS custom property and the same transition timing) — the two cancel
exactly at every instant of the animation, verified by sampling both
elements' live computed transforms through the transition (sum = 0 at every
sampled frame). The canvas content stays pinned to the viewport throughout;
all that actually animates is the panel's own `overflow-x: hidden` clip
boundary, widening from 0 to the panel's width. What's revealed is always
pixel-identical to the real background at that point in the transition, not
just at rest.

Backdrop (outside the panel) is a separate translucent + blurred layer
(never `filter: blur()` on the real page) — the panel itself stays sharp.
Full focus trap, Escape to close, scroll lock, and focus returns to the
trigger on close — verified via automated keyboard-only pass.

## Deploy

Vercel builds `npm run build` and serves `dist/`. A nightly GitHub Action rebuilds the site so finished events move to "past" (needs the `DEPLOY_HOOK_URL` secret, see `.github/workflows/nightly-rebuild.yml`).
