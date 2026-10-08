# CHIMAERA — Component guide

How every part of the site works, where it lives, and how to change it yourself.
Written against the code as of 08.10.2026. When code and this guide disagree, the code wins; update the guide.

---

## 0. How the page fits together

```
index.html
 ├─ <head>: Adobe kit → tokens.css → global.css → typography.css → navigation.css → homepage.css
 ├─ #atmosphere-canvas            fixed, behind everything (z-index 0)
 ├─ [data-include] header.html    ┐ fetched and injected by include.js,
 ├─ [data-include] navigation.html├ then include.js fires "chimaera:includes-loaded"
 ├─ .site-content > main          │
 │    .landing → .next-event → #idea → #artist → #people → #practice → #events
 └─ [data-include] footer.html    ┘

Scripts (bottom of body), all wait for "chimaera:includes-loaded":
 include.js     injects components
 atmosphere.js  draws the canvas, exposes window.ChimaeraAtmosphere.main
 navigation.js  star → opens nav, switches atmosphere to NAV state
 header-theme.js samples what's behind wordmark + star, flips white/coral
 homepage.js    opening sequence + scroll → atmosphere midpoint
 next-event.js  data/events.json → strip under the landing
 events.js      data/events.json → section 05 cards + past strip
```

Rules that hold everywhere:
- **Values live in `css/tokens.css`.** Components reference tokens. Change a token and every component using it follows.
- **Nothing has a background except the footer area and the cards.** The atmosphere must stay visible.
- **Text is ink (`--color-ink`) by default.** White only in the nav overlay, the star, and captions on photos.
- **Components load via `fetch()`.** Opening `index.html` as a file (`file://`) shows no header, nav or footer. Always use Live Server.

---

## 1. Your editing loop (cheapest to most expensive)

1. **DevTools first.** Right-click → Inspect → edit values live in the Styles panel until it looks right. Nothing is saved.
2. **Copy the winning values into the file** named in this guide. Prefer changing a token over hardcoding a value.
3. **Check two widths:** 1440 px and 390 px (DevTools → device toolbar, `Cmd+Shift+M`).
4. **Commit small:** `git add -A && git commit -m "what changed"`. Small commits make bad changes easy to undo (`git restore <file>` before committing, `git revert <hash>` after).
5. **Claude Code only** for logic changes or bugs you can't trace (template in §6).

Live Server reloads on every save. If it reloads in a loop, stop it while editing many files at once.

---

## 2. Tokens — `css/tokens.css`

| Group | Tokens | Controls |
|---|---|---|
| Colour | `--color-coral`, `-coral-deep`, `-coral-soft`, `--color-pale`, `--color-pale-warm`, `--color-ink`, `--color-ink-25/30/45`, `--color-white` | Every colour on the site except the atmosphere (see §3.3) |
| Fonts | `--font-banner` (huge headlines), `--font-display` (H2s, nav), `--font-text` (body, buttons), `--font-micro` (labels), `--font-serif` (italic accents) | Font roles. Names must match the Adobe kit exactly. |
| Type scale | `--step--1` … `--step-6` | Fluid heading sizes. `--step-4` = section H2s, `--step-3` = nav links, `--step-6` = subpage H1 |
| Body | `--text-body`, `--leading-body`, `--measure` | All `.body-copy` paragraphs (16→17 px, 1.5 line height, 62 characters max) |
| Small | `--text-small` | Labels, eyebrows, dates, venues (12→13 px) |
| Space | `--space-3xs` (4 px) … `--space-3xl` (144 px) | All margins, padding, gaps |
| Structure | `--page-margin`, `--content-max-width`, `--tap-target-min`, `--rule-width` | Side margins, strip width, button height (48 px), line thickness |
| Motion | `--ease-editorial`, `--duration-fast/medium/slow` | Transitions |

**Dead tokens:** the `--atmosphere-*` block is not read by anything. The comment says `atmosphere.js` reads it; it doesn't. Edit the atmosphere in `atmosphere.js` (§3.3), or delete the block to avoid confusion.

**Adding a token:** add it under the right group with a comment, then use `var(--your-token)`. Name by role (`--text-small`), not by value (`--size-13`).

---

## 3. Components

### 3.1 Header: wordmark + star
**Files:** `components/header.html`, `css/navigation.css` (sections HEADER, WORDMARK, NAV TRIGGER), `js/header-theme.js` (colour switching).

The header is fixed and invisible on load (`opacity: 0`). `homepage.js` (or `page-chrome.js` on subpages) adds `.header--revealing` to fade it in.

| To change | Where | What |
|---|---|---|
| Wordmark size | `.wordmark-img` | `height: 4rem` |
| Wordmark position | `.wordmark-img` | `transform: translate(-10px, -30px)` (x, y) |
| Star size | `.nav-star-button` | `width` + `height: 9.5rem` |
| Star position | `.nav-star-button` | `transform: translate(42px, -25px)` |
| Star rotation on hover / open | `.nav-star-button:hover .nav-star-button__img` (35deg), `[aria-expanded="true"]` (135deg) | `rotate()` values |
| Header fade-in speed | `.site-header` | `transition: opacity 400ms` |
| When the header appears on the homepage | `js/homepage.js` | `HEADER_DELAY = 1800` (ms after intro starts) |
| Header padding | `.site-header` | `padding: var(--space-m) var(--page-margin)` |

**Gotchas**
- The wordmark is **two stacked images** (coral PNG, white PNG). `header-theme.js` sets `data-ink="on-dark"` (show white) or `"on-light"` (show coral). Replacing the logo means replacing both files in `assets/logo/`.
- The negative translate offsets are compensating for whitespace in the PNG/SVG files. Crop the files tighter and you can set these to 0.

### 3.2 Header colour switching: `js/header-theme.js`
Decides white vs coral for wordmark and star by looking at what's behind each one.

How it decides, per point:
1. Find the nearest ancestor with `data-field`. **None → white.**
2. If that element has class `landing` or `field-atmosphere`, sample the actual canvas pixel. Brighter than `LUMINANCE_THRESHOLD` (0.72) → coral, else white.
3. Otherwise `data-field="pale"` → coral, anything else → white.

| To change | Where |
|---|---|
| Sensitivity (when it flips) | `LUMINANCE_THRESHOLD = 0.72`. Lower = flips to coral sooner. |
| Sample points | `leftX = 24`, `rightX = window.innerWidth - 40` |
| Re-sample interval | `window.setInterval(sample, 1200)` |

**Gotcha (current bug):** only `.landing` samples the canvas. `#idea`, `#practice`, `#events` have no `data-field` (→ always white), and `#artist`/`#people` have `data-field="coral"` without `field-atmosphere` (→ always white). When the atmosphere's pale side sits under the star, the white star disappears. Fix in §5, bug 4.

### 3.3 Atmosphere: `js/atmosphere.js`
The fluid coral/pale field. Coral on the left, pale on the right, a soft wobbling boundary between.

**The one number that matters: `colourMidpointX`** (0–1) = where the boundary sits, from the left. `0.75` = coral covers 75% of the width.

**States** (config objects at the top of the file):

| Config | Used when | Midpoint |
|---|---|---|
| `OPENING_START_CONFIG` | First frame of the intro | 0.00 |
| `OPENING_END_CONFIG` | End of intro = landing | 0.75 |
| `DEFAULT_CONFIG` | Initial values; target when the nav closes. **Also holds the colours.** | 0.75 |
| `HERO_CONFIG` | Scrolled to #idea | 0.50 |
| `NAV_CONFIG` | Nav open | 0.50, calmer |

**Parameters** (same in every config):

| Parameter | Effect | Typical |
|---|---|---|
| `colourMidpointX` | Boundary position | 0–1 |
| `organicDeviation` | How far the boundary wobbles | 0.01–0.05 |
| `movementSpeed` | Animation speed | 8 (calm) – 25 (lively) |
| `movementAmplitude` | Multiplies the wobble | 0.5–1.5 |
| `mouseInfluence` | How much the cursor pushes the boundary (desktop only) | 0–0.1 |
| `softness` | Width of the soft edge + blur | 1 = default, higher = softer |
| `verticalPosition` | Tilt pivot | 0.5 |
| `coral`, `pale` (DEFAULT_CONFIG only) | The two colours | hex |

| To change | Where |
|---|---|
| Atmosphere colours | `DEFAULT_CONFIG.coral` / `.pale`. **Currently `#e25139`, while the token is `#e35039`.** Make them match. |
| Intro sweep length (fallback) | `OPENING_DURATION = 3200`. Normally the intro video's length drives it. |
| When the sweep starts | `js/homepage.js`: `ATMOSPHERE_DELAY = 500` |
| Nav transition speed | `js/navigation.js`: `enterNavState(1800)` / `enterLandingState(1800)` |
| Per-section coverage | Not built yet. Recipe in §4.4. |

**Gotchas**
- Scroll currently only moves the atmosphere between landing (0.75) and #idea (0.50). Everything after #idea stays at 0.50.
- **The opening lock:** while the intro plays, `setScrollProgress` is ignored on purpose. Don't remove `if (openingActive) return;`.
- Closing the nav always returns to `DEFAULT_CONFIG` (0.75), even mid-page; the next scroll snaps it back. Known, minor.
- Reduced motion: the canvas draws one frozen frame (`FROZEN_T`) and never animates.

### 3.4 Navigation panel
**Files:** `components/navigation.html` (links), `css/navigation.css` (BACKDROP, NAV PANEL, NAV LINKS), `js/navigation.js` (open/close, focus trap, Escape).

| To change | Where | What |
|---|---|---|
| Links | `components/navigation.html` | `<li><a href>` items |
| Link size / font | `.site-nav__list a` | `font-size: var(--step-3)`, `font-family`, `text-transform: lowercase` |
| Gap between links | `.site-nav__list` | `gap: var(--space-l)` |
| Panel width | `.site-nav` | `width: min(30rem, 88vw)` |
| Slide-in speed | `.site-nav` | `transition: transform 900ms` |
| Page blur strength | `.nav-backdrop` and `body.nav-open main, body.nav-open footer` | `blur(14px)` (change both) |
| Link stagger | `.site-nav.is-open .site-nav__list li:nth-child(n)` | `transition-delay` per item |
| Bottom tagline | `.site-nav__meta` in navigation.html | Text |

**Gotchas**
- Adding a 5th+ link needs an `nth-child` delay rule, or that link appears before the others. There are 5 links and only 4 rules right now.
- The panel has no background on purpose. Text is white over the atmosphere and the blurred page.

### 3.5 Landing
**Files:** `index.html` (`.landing`), `css/homepage.css` (LANDING, INTRO WEBM, LANDING VHS VIDEO, SCROLL CUE), `js/homepage.js` (opening sequence).

Sequence: `intro.webm` plays full screen → its `ended` event adds `.landing--revealed` → intro fades out, VHS video fades in.

| To change | Where | What |
|---|---|---|
| Intro video | `index.html` `.landing__gif` `<source>` | File path |
| Centre video | `.landing__video` `<source>`s + `poster` | File paths (WebM + MP4 + poster) |
| Centre video size | `.landing__video` | `width: min(640px, 74vw)`, `aspect-ratio: 16 / 9` |
| Video glow | `.landing__video` | `box-shadow: 0 0 9rem 1rem rgba(227,80,57,.22)` |
| Fade speeds | `.landing__gif` (700ms), `.landing__video` (1400ms) | `transition` |
| Scroll cue | `.landing__scroll-cue`, `.landing__scroll-cue-line`, `@keyframes scroll-cue` | Size, opacity, speed (2.4s) |

**Gotchas**
- If the intro video fails to play (autoplay blocked), the code skips straight to the revealed state. If the landing ever stays blank, check the console for a video error first.
- Replacing the intro with a different length is fine: the atmosphere sweep reads `intro.duration`.
- The spec says no letterbox bars on the centre video. If your clip has bars baked in, crop the file; CSS can't remove them cleanly.

### 3.6 Next-event strip (0.5)
**Files:** `index.html` (`#next-event`), `css/homepage.css` (NEXT EVENT), `js/next-event.js`, `data/events.json`.

Logic: take events where `status` isn't `"past"` and `date` ≥ today, sort by date, show the first. Status `"soldout"` → "Sold out" + "Join the waitlist" (→ `#footer`). None → the whole section hides. Fetch fails → the static "See upcoming events" link stays.

| To change | Where |
|---|---|
| Label text | `index.html` `.next-event__label` |
| Title size | `.next-event__title` `font-size: 1.875rem` |
| Strip width | `--content-max-width` (token) |
| Rules above/below | `.next-event` `border-top/bottom` |
| Button look | `.next-event__ticket-link` |
| Button text / arrow | `js/next-event.js` `renderTickets()` and `ARROW_SVG` |
| Sold-out text | `js/next-event.js` `renderSoldOut()` |
| Date format | `formatDate()` in `next-event.js` **and** `events.js` (duplicated) |

### 3.7 01 — the idea (`#idea`, class `.homepage-hero`)
**Files:** `index.html`, `css/homepage.css` (HOMEPAGE HERO, HERO TEXT, HERO IMAGES, RESPONSIVE).

Layout: text block absolutely positioned on the left half; three images absolutely positioned inside `.homepage-hero__gallery` (right 50%), placed by % values.

| To change | Where |
|---|---|
| Headline | `index.html` `#hero-heading` (`<br>` controls line breaks) |
| Headline size | `.homepage-hero__copy h2` `font-size: clamp(2.4rem, 4.1vw, 5rem)` |
| Text position / width | `.homepage-hero__copy` `left`, `top`, `width: min(42rem, 40vw)` |
| Image positions | `.homepage-hero__image--1/2/3` `top`, `left`, `width`, `aspect-ratio`, `z-index` |
| Images | `index.html` `src` of the three `<img>` |

**Gotchas**
- **Mobile overrides live at the bottom** of `homepage.css` under `@media (max-width: 800px)`. Change a desktop value and nothing happens on mobile → you need to change it there too.
- Everything is absolutely positioned inside a `100svh` box with `overflow: hidden`. Longer headline copy on a short phone screen will clip. Check at 390×667 after copy changes.
- The spec's phonetic line `[khi-mæ-ra]` and intro paragraph aren't in this section yet.

### 3.8 02 — the artist / 03 — the people (`#artist`, `#people`)
**Files:** `index.html`, `css/homepage.css` (ARTIST / PEOPLE, PHOTOGRAPHS).

Both share one rule set (`.homepage-artist, .homepage-people`) and currently render as a **stacked column at every width**. The two-column layout from the mockup isn't built yet (starter in §4.6).

| To change | Where |
|---|---|
| H2 size / style (shared) | `.homepage-artist h2, .homepage-people h2` |
| Body width | `.homepage-artist .body-copy, …` `max-width: 34ch` |
| Section padding | `.homepage-artist, .homepage-people` `padding-block` |
| Photo size | `.encounter__photo` `width: min(21rem, 74vw)`, `--participant` `min(25rem, 80vw)` |
| Photo tilt | `.encounter__photo--artist` `rotate(-3deg)`, `--participant` `rotate(2deg)` |
| Photo shadow | `.encounter__photo` `box-shadow` |
| People text alignment | `.encounter__text--participant` (right-aligned now) |

**Gotcha:** class names still say `encounter__…` and `--participant`. Those are leftovers from the old combined section. They work; just know `--participant` = people.

### 3.9 04 — the practice (`#practice`)
A stub: label, heading, placeholder, `min-height: 60svh`. Styles in `.homepage-practice`. The collage and hover reveal from the spec are not built.

### 3.10 05 — join us (`#events`)
**Files:** `index.html` (header + empty containers), `css/homepage.css` (EVENTS), `js/events.js`, `data/events.json`.

Logic:
- **Upcoming grid:** status `"upcoming"` or `"soldout"`, date ≥ today, soonest first → `.event-card`s. None → "New events soon" line.
- **Past strip:** status `"past"`, newest first → `.past-poster`s. None → strip hidden.

Card anatomy (built in `buildEventCard()`):

```
.event-card                  pale-warm mat
 ├ .event-card__poster       3:4, keyline border
 │   └ .event-card__soldout-tag   (sold out only)
 ├ .event-card__date
 ├ .event-card__title
 ├ .event-card__venue        serif italic
 ├ .event-card__rule         dashed
 └ .event-card__ticket-link  or  .event-card__waitlist-link
```

| To change | Where |
|---|---|
| Heading / label / artist link | `index.html` `.homepage-events__header` |
| Card width | `.event-card` `flex: 1 1 280px` (minimum width before wrapping) |
| Card gap | `.homepage-events__grid` `gap` |
| Mat padding | `.event-card` `padding` |
| Poster ratio / keyline | `.event-card__poster` `aspect-ratio`, `border` |
| Sold-out tag | `.event-card__soldout-tag` (`rotate(8deg)`, colour, position) |
| Title size | `.event-card__title` `font-size: 1.5rem` |
| Dashed rule | `.event-card__rule` `border-top: 2px dashed` |
| Buttons | `.event-card__ticket-link`, `.event-card__waitlist-link` |
| Button text | `js/events.js` `buildEventCard()` |
| Mobile scroll row | `@media (max-width: 600px)` block: card `flex: 0 0 80vw` |
| Past poster size | `.past-poster` `flex: 0 0 150px; width: 150px` |
| Past stamp | `.past-poster__stamp` |
| Empty-state text | `index.html` `.homepage-events__empty` |
| Reserved height while loading | `.homepage-events__grid` `min-height: 34rem` |

### 3.11 Footer
**Files:** `components/footer.html` (markup, shared by every page), `css/homepage.css` (FOOTER).

**Not built to spec yet.** It currently has the wordmark, phonetic line, a Danish tagline and 4 links. Missing: newsletter (MailerLite), Explore column, contact (info@, Instagram, Facebook), legal row (CVR, privacy, terms).

**Gotcha:** footer styles live in `homepage.css`, which is why `about/` and `contact/` also load `homepage.css`. Anything you change in `homepage.css` can affect subpages. Moving the FOOTER block into its own `css/footer.css` (linked on every page) would fix this.

### 3.12 Subpages (about, contact)
**Files:** `about/index.html`, `contact/index.html`, `css/page.css`, `js/page-chrome.js`.

No intro video, so `page-chrome.js` ends the atmosphere's opening state immediately and reveals the header. Sections use `.page-intro` and `.page-section`, plus `field-atmosphere` + `data-field="coral"` so header ink sampling works (the homepage should copy this; see bug 4).

| To change | Where |
|---|---|
| H1 size | `.page-intro h1` `font-size: var(--step-6)` |
| Section H2 | `.page-section h2` |
| Divider between sections | `.page-section + .page-section` (**currently white at 25%, nearly invisible on pale; switch to `var(--color-ink-30)`**) |

---

## 4. Recipes

### 4.1 Add an event
Edit `data/events.json`. It's a list; add an object, with a comma between objects:

```json
{
  "slug": "art-week-allinge-2026",
  "title": "Art Week Allinge",
  "date": "2026-11-21",
  "venue": "Ved Linden, Copenhagen",
  "poster": "/assets/images/events/art-week-allinge.jpg",
  "ticketUrl": "https://buy.stripe.com/your-payment-link",
  "status": "upcoming"
}
```

| Field | Rule |
|---|---|
| `date` | `YYYY-MM-DD`, always |
| `poster` | Path starting with `/`, or `null` for a placeholder. Crop to 3:4, ~900 px wide, JPG/WebP under ~200 KB. |
| `ticketUrl` | Your Stripe Payment Link |
| `status` | `"upcoming"`, `"soldout"` or `"past"` |
| `soldOut` | **Past events only:** `true`/`false` for the stamp |

**Lifecycle (important):**
1. New event → `"status": "upcoming"`.
2. Sells out → `"status": "soldout"`. The button becomes "Join the waitlist" in both the strip and the card.
3. **After the date, change it to `"status": "past"` and add `"soldOut": true` or `false`.** The site does not do this for you. An event whose date has passed but is still marked `upcoming` disappears from the site entirely until you change its status.

Validate before saving: paste the file into [jsonlint.com](https://jsonlint.com). One missing comma breaks both the strip and section 05 (they silently fall back to "See upcoming events" / "New events soon").

### 4.2 Change a colour everywhere
Change the token in `tokens.css`. For the coral, also change `DEFAULT_CONFIG.coral` in `atmosphere.js`, and the hardcoded `rgba(227, 80, 57, 0.22)` glow in `.landing__video`.

### 4.3 Change type
- Font for a role: change the `--font-*` token. The name must match the Adobe kit (check fonts.adobe.com → your web project → font names).
- Body size: `--text-body`. Section H2s: they use `--step-4`; change the token to resize all of them, or change one selector to resize one.

### 4.4 Per-section atmosphere coverage (from the spec)
Targets: landing 0.75, #idea 0.50, #artist 0.35, #people 0.50, #practice 0.35, #events 0.75. Two edits.

**Step 1: `js/atmosphere.js`.** In the `handle` object, directly after the `setScrollProgress: function (progress) { … },` block, add:

```js
      // --------------------------------------------------------
      // SET MIDPOINT DIRECTLY (per-section scroll stops)
      // --------------------------------------------------------

      setColourMidpoint: function (x) {
        if (openingActive) {
          return;
        }

        currentConfig = Object.assign({}, currentConfig, {
          colourMidpointX: clamp(x, 0, 1),
        });

        transitioning = false;

        transitionFrom = null;

        if (REDUCED_MOTION) {
          drawFrame(FROZEN_T);
        }
      },
```

**Step 2: `js/homepage.js`.** Inside `setup()`, directly after the `easeInOutCubic` function, add the stops table and lookup:

```js
    /*
     * Atmosphere midpoint per section (0 = all pale, 1 = all coral).
     * Between two sections, the midpoint eases from one value to the
     * next as the viewport centre travels between their centres.
     * Edit the numbers to tune; add a row to add a section.
     */

    var STOPS = [
      { selector: ".landing", midpoint: 0.75 },
      { selector: "#idea", midpoint: 0.5 },
      { selector: "#artist", midpoint: 0.35 },
      { selector: "#people", midpoint: 0.5 },
      { selector: "#practice", midpoint: 0.35 },
      { selector: "#events", midpoint: 0.75 },
    ];

    function midpointForScroll() {
      var viewportCentre = window.innerHeight / 2;
      var points = [];

      STOPS.forEach(function (stop) {
        var el = document.querySelector(stop.selector);
        if (!el) return;

        var rect = el.getBoundingClientRect();
        points.push({ centre: rect.top + rect.height / 2, midpoint: stop.midpoint });
      });

      if (!points.length) return null;

      if (viewportCentre <= points[0].centre) return points[0].midpoint;

      for (var i = 0; i < points.length - 1; i++) {
        var a = points[i];
        var b = points[i + 1];

        if (viewportCentre >= a.centre && viewportCentre <= b.centre) {
          var t = (viewportCentre - a.centre) / (b.centre - a.centre);
          return a.midpoint + (b.midpoint - a.midpoint) * easeInOutCubic(t);
        }
      }

      return points[points.length - 1].midpoint;
    }
```

Then replace the **body** of `updateAtmosphere()` with:

```js
    function updateAtmosphere() {
      ticking = false;

      var midpoint = midpointForScroll();

      if (midpoint !== null && typeof atmosphere.setColourMidpoint === "function") {
        atmosphere.setColourMidpoint(midpoint);
      }
    }
```

What you give up: the old version also slowed the movement slightly between landing and #idea. If you miss it, it's a separate small change.
Verify: scroll slowly top to bottom; the boundary should move left at 02 and 04 and swing back right at 05. To tune, change only the numbers in `STOPS`.
Do bug 4 (§5) in the same commit, or the star turns invisible at 02/04.

### 4.5 Add a homepage section
1. Copy an existing `<section>` in `index.html`, give it a unique `id` and `aria-labelledby`.
2. Add `class="… field-atmosphere" data-field="coral"` (so header ink works).
3. Add its styles as a new commented block in `homepage.css`, using tokens.
4. If it should move the atmosphere, add a row to `STOPS` (§4.4).
5. Update `docs/HOMEPAGE-SPEC.md` §2.

### 4.6 Two-column layout for 02 / 03 (starting point)
Add at the end of the ARTIST / PEOPLE block in `homepage.css`, then tune in DevTools:

```css
@media (min-width: 64rem) {
  .homepage-artist,
  .homepage-people {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    column-gap: var(--space-xl);
    min-height: 100svh;
  }

  /* 03: image left, text right (text stays first in the HTML for mobile) */
  .homepage-people .encounter__photo {
    order: -1;
  }

  .encounter__text--participant {
    align-self: center;
    text-align: left;
  }

  .encounter__text--participant .body-copy {
    margin-left: 0;
  }

  .encounter__photo--artist,
  .encounter__photo--participant {
    align-self: center;
    justify-self: center;
  }
}
```

### 4.7 Add a page
1. Copy `about/` to e.g. `events/` → `events/index.html`.
2. Change `<title>`, `<meta name="description">`, the canonical URL and the content.
3. Keep the `<head>` CSS links (including `homepage.css`, for the footer) and the script list (`page-chrome.js`, not `homepage.js`).
4. Every `<section>` gets `field-atmosphere` + `data-field="coral"`.

---

## 5. Known bugs and leftovers (found in this read-through)

| # | Problem | Fix |
|---|---|---|
| 1 | Nav "home" links to `/index/`, which doesn't exist | `components/navigation.html`: `href="/"` |
| 2 | Nav/footer link to `/events/` and `/gallery/`, which don't exist yet | Build the pages, or point them at `/#events` for now |
| 3 | 5 nav links, only 4 stagger delays | `navigation.css`: add `.site-nav.is-open .site-nav__list li:nth-child(5) { transition-delay: 360ms; }` |
| 4 | Header ink never samples the canvas below the landing → the white star vanishes over the pale side | `index.html`: on `#idea`, `#artist`, `#people`, `#practice`, `#events` add class `field-atmosphere` and `data-field="coral"` |
| 5 | Atmosphere coral `#e25139` ≠ token `#e35039`; `--atmosphere-*` tokens unused | Match the hex in `atmosphere.js`; delete or document the dead tokens |
| 6 | Past events need a manual status change | Expected behaviour; follow the lifecycle in §4.1 |
| 7 | Danish strings remain: page `<title>`/`og:title` ("kreativt fællesskab"), nav tagline, footer tagline | Translate in `index.html`, `about/`, `contact/`, `navigation.html`, `footer.html` |
| 8 | Subpage section divider is white at 25% (invisible on pale) | `page.css`: `border-top: var(--rule-width) solid var(--color-ink-30)` |
| 9 | Nav close sends the atmosphere to 0.75 mid-page; it snaps back on the next scroll | Minor; leave until it bothers you |
| 10 | `header-theme.js` reads a canvas pixel every 1.2 s plus on every scroll (`getImageData`). Likely remaining source of jank. | Raise the interval to 2500, or sample on scroll-end only |
| 11 | `CLAUDE.md` "Current state" says #events is a stub | Update it; Claude Code trusts it |
| 12 | Footer not to spec (newsletter, columns, legal) | Next build task |

---

## 6. When you do use Claude Code

Template that keeps sessions cheap:

```
In <file>, <selector or function>: <exact change>.
Context: docs/COMPONENT-GUIDE.md §<n>.
Don't touch other files. Show the diff only, no explanation unless something is ambiguous.
```

- Name the file and the selector. Don't make it search.
- One change per session, then `/clear`.
- Use the smaller model (`/model`) for edits like these; keep the big one for bugs.
- After a change it made, update this guide yourself if the "where" moved.
