# CHIMAERA — website

A lightweight static site (HTML / modern CSS / vanilla JS, no framework, no build step)
for CHIMAERA.CPH, a Copenhagen creative collective.

## Status: landing + first two editorial sections complete, awaiting review

Built so far:

- **Foundation**: design tokens, global reset, typography setup, the
  persistent atmosphere background, the left-opening navigation, and a small
  HTML-partial include system so header/nav/footer live in one place.
- **Landing**: the opening viewport. Deliberately minimal — the atmospheric
  field, a looping muted found-footage VHS clip (fades out while the nav is
  open, fades back in on close — see `css/homepage.css`), and the logo/star
  in the fixed header. No headline, no wordmark, no CTA.
- **Editorial system, section one — "who is chimaera?"**: 50/50 text|image,
  a single full-bleed photograph.
- **Editorial system, section two — "what do we do?"**: the same 50/50
  system varied rather than repeated — the compositional relationship
  reverses (image leads, text follows) and the image side is a paired,
  unequal stack of two photographs (a tactile material study over a wider
  documentary frame of a gathering) rather than one full-bleed shot.
  Establishes that the grid can produce variation, not a template.

Not yet built: the rest of the homepage, and the About/Events/Gallery/Contact
pages (directories are scaffolded, no markup inside yet). Stopping here
deliberately, per the agreed process, for review before continuing.

## Running locally

Any static file server works, e.g.:

```
python3 -m http.server 8080
```

then open `http://localhost:8080/`. (Opening `index.html` directly via
`file://` won't work — the header/nav/footer partials load via `fetch()`,
which needs an http origin.)

## Fonts

Primary: **Minion Pro** (body). Secondary: **Forma DJR Banner** (display/headlines).
Neither is a free font — drop the licensed files into `assets/fonts/` using
these exact names and both activate automatically, no CSS changes needed:

```
assets/fonts/MinionPro-Regular.woff2
assets/fonts/MinionPro-Italic.woff2
assets/fonts/FormaDJRBanner-Regular.woff2
assets/fonts/FormaDJRBanner-Bold.woff2
```

Until then, the site renders on close fallback stacks (see `css/tokens.css`
and `css/typography.css`) so nothing is ever unstyled.

## The atmosphere (`js/atmosphere.js`)

A canvas-based, persistent, organic coral/pale field — two large atmospheric
masses meeting near the horizontal centre of the viewport, soft and foggy,
never a hard edge, slowly drifting, plus a small smoothed response to the
mouse on desktop. Mounted once in the DOM and never re-created between
sections; the nav panel mounts a second instance of the exact same renderer,
reading the same config and the same clock, clipped to the panel (see
"Navigation" below) so it reads as a literal cut-out of the same field.

Rendering technique: the field is composed at very low resolution on an
offscreen buffer (a coral/pale boundary drawn one buffer-row at a time, its
x position a continuous, organic function of y and time — not a stepped
lookup, so it never shows band seams), lightly blurred while still tiny for
genuine fog softness, then upscaled onto the full-resolution canvas. This
keeps the coral/pale split honestly balanced around `colourMidpointX`
(a directional gradient can only push pale to one side of its own centre,
so unlike a big radial blob it can never bleed past its boundary and flood
the other side) while staying cheap — no full-resolution blur filter runs
every frame.

Tunable via `window.ChimaeraAtmosphereConfig` (set before `atmosphere.js`
loads) or by editing `DEFAULT_CONFIG` in the file directly:

| key | meaning |
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

## Assets

- `assets/logo/` — the real CHIMAERA wordmark, recoloured into coral/white/
  black variants from the neutral master you supplied.
- `assets/graphics/mascot-*.png` — the chimera line-art mark, cleanly cut out
  (transparent background) from the pitch deck cover.
- `assets/video/landing-vhs.*` — the landing loop, transcoded from your
  `FIMO02_MOVIE.mov` into web-friendly, audio-stripped mp4/webm (~1.6MB each,
  down from 7MB) plus a poster frame.
- `assets/images/`, `assets/graphics/poster-*.jpg` — your supplied
  photography and event posters, staged for later sections/pages.
  `assets/images/optimized/` holds the resized/compressed pairs actually used
  on the homepage today: `workshop-sketching-1800` (section one),
  `materials-flatlay-1440` and `gathering-table-640` (section two's paired
  image — the second at lower native resolution since that's what the
  supplied source had; it's used small, at roughly 37% of the image half, so
  it doesn't need to hold up at large size).

## Structure

```
/
├── index.html
├── about/ events/ gallery/ contact/   (scaffolded, empty — Phase 6)
├── components/   header.html · navigation.html · footer.html
├── css/          tokens · global · typography · navigation · homepage
├── js/           include · atmosphere · navigation · header-theme
├── assets/       images · fonts · logo · graphics · video
└── README.md
```
