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
The fluid coral/pale field. Coral on the left, pale on the right, a soft wobbling boundary between. It never stands still: idle breath + organic wobble + mouse push (desktop), on top of the scroll position.

**The one number that matters: `colourMidpointX`** (0–1) = where the boundary sits, from the left. `0.75` = coral covers 75% of the width.

**Tune it in `css/tokens.css` (Atmosphere tuning block), not in JS.** `atmosphere.js` reads these once at load; a missing token falls back to the JS default.

| Token | Default | Effect |
|---|---|---|
| `--atmosphere-breath` | 0.03 | Idle breath: boundary swing (fraction of width). 0 = off |
| `--atmosphere-breath-period` | 8 | Seconds per breath |
| `--atmosphere-breath-softness` | 0.2 | How much the edge softens/sharpens with each breath |
| `--atmosphere-speed` | 1 | × wobble/drift speed |
| `--atmosphere-amplitude` | 1 | × wobble/drift distance |
| `--atmosphere-softness` | 1 | × edge softness/blur |
| `--atmosphere-mouse` | 1 | × cursor push (desktop, fine pointer). 0 = off |
| `--atmosphere-coral`, `--atmosphere-pale` | colour tokens | The two colours (hex) |
| `--atmosphere-coral-intensity`, `--atmosphere-opacity` | 1 | Coral alpha, canvas opacity |

**Per-section coverage:** `STOPS` in `js/homepage.js` (landing .75, 01–04 .50, 05 .75). The midpoint eases between section centres as you scroll.

**States** (config objects at the top of `atmosphere.js`; the opening and the nav still use them):

| Config | Used when | Midpoint |
|---|---|---|
| `OPENING_START_CONFIG` | First frame of the intro | 0.00 |
| `OPENING_END_CONFIG` | End of intro = landing; its motion values stay active while scrolling | 0.75 |
| `DEFAULT_CONFIG` | Target when the nav closes. Holds the breath/multiplier defaults. | 0.75 |
| `NAV_CONFIG` | Nav open | 0.50, calmer |
| `HERO_CONFIG` | No longer used by scroll (kept for `enterHeroState`) | 0.50 |

| To change | Where |
|---|---|
| Coverage per section | `js/homepage.js` `STOPS` |
| Motion feel | tokens above |
| Intro sweep length (fallback) | `OPENING_DURATION = 3200`. Normally the intro video's length drives it. |
| When the sweep starts | `js/homepage.js`: `ATMOSPHERE_DELAY = 500` |
| Nav transition speed | `js/navigation.js`: `enterNavState(1800)` / `enterLandingState(1800)` |

**Gotchas**
- **The opening lock:** while the intro plays, `setColourMidpoint` is ignored on purpose. Don't remove `if (openingActive) return;`.
- Closing the nav returns to `DEFAULT_CONFIG` (0.75) mid-page; the next scroll corrects it. Known, minor (bug 9).
- Reduced motion: one frozen frame (`FROZEN_T`), no breath, no mouse.
- The loop pauses when the tab is hidden (`visibilitychange`).

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
- Adding a 6th+ link needs an `nth-child` delay rule, or that link appears before the others. There are 5 links and 5 rules.
- Events and archive point at `/#events` until those pages exist (Astro port).
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

Logic: take events where `status` isn't `"past"` and `date` ≥ today, sort by date, show the first. Status `"soldout"` → `.stamp` + outlined "Join the waitlist" button (→ `#footer`). None → the whole section hides. Fetch fails → the static "See upcoming events" link stays.

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
**Files:** `index.html`, `css/homepage.css` (01 — THE IDEA).

Layout: flex row that wraps. Copy left (label, phonetic, statement, body), one 4:5 photo right. Below ~64rem it stacks, text first.

| To change | Where |
|---|---|
| Headline | `index.html` `#hero-heading` (`<br>` controls line breaks) |
| Headline size | `.homepage-hero__copy h2` `font-size: var(--step-4)` |
| Phonetic line | `index.html` `.homepage-hero__phonetic`; size `var(--step-2)` |
| Photo | `index.html` `.homepage-hero__figure img` (`src` + `srcset`) |
| Photo size / ratio | `.homepage-hero__figure` `flex: 0 1 25rem`, `aspect-ratio: 4 / 5` |
| Content width | `--section-max-width` (token, shared by 01–04) |

### 3.8 02 — the artist / 03 — the people (`#artist`, `#people`)
**Files:** `index.html`, `css/homepage.css` (02 — THE ARTIST / 03 — THE PEOPLE).

Mobile: stacked, text first. ≥64rem: two-column grid. 02 photo right with an inset (`margin-right: var(--space-xl)`); 03 photo left (`order: -1`, so text stays first in the HTML).

| To change | Where |
|---|---|
| H2 size / style (shared with 04) | `.homepage-artist h2, .homepage-people h2, .homepage-practice h2` (`--step-3`) |
| Body width | `… .body-copy` `max-width: 46ch` |
| Photo size | `.encounter__photo` `max-width: 27.5rem`, `--participant` `30rem` |
| Photo ratio | `.encounter__photo` `aspect-ratio: 4 / 5` (the photography is portrait) |
| Breakpoint | `@media (min-width: 64rem)` in the same block |

**Gotcha:** class names still say `encounter__…` and `--participant`. Leftovers from the old combined section; `--participant` = people. No rotation or shadow on these photos: rotation is reserved for the 04 collage.

### 3.9 04 — the practice (`#practice`)
**Files:** `index.html`, `css/homepage.css` (04 — THE PRACTICE).

Copy (label, H2, body, "Get in touch →" to `/contact/`) + `.practice-collage`: 4 absolutely-positioned `<figure>`s, rotations −5°, 3°, −2°, 6°, `--shadow-soft`. ≥64rem: two columns, copy indented `--space-xl`.

| To change | Where |
|---|---|
| Collage photos | `index.html` `.practice-collage__item--1…4 img` |
| Positions / sizes / tilt | `.practice-collage__item--1…4` (`left/top/right/bottom`, `width`, `aspect-ratio`, `rotate`) |
| Collage size | `.practice-collage` `max-width: 33.75rem`, `aspect-ratio: 27 / 23` |

The reveal interaction (spec §7) isn't built; it will reveal `.homepage-practice__link`.

### 3.10 05 — join us (`#events`)
**Files:** `index.html` (header + empty containers), `css/homepage.css` (EVENTS), `css/global.css` (`.stamp`), `js/events.js`, `data/events.json`.

Logic:
- **Upcoming grid:** status `"upcoming"` or `"soldout"`, date ≥ today, soonest first → `.event-card`s. 1–2 cards → a **Next dates** panel follows (`buildNextDatesPanel()`). None → "New events soon" line.
- **Past strip:** status `"past"`, newest first → `.past-poster`s. None → strip hidden.

Card anatomy (built in `buildEventCard()`):

```
.event-card                  pale-warm mat
 ├ .event-card__poster       3:4, keyline border
 │   └ .stamp                (sold out only; top-left, straight)
 ├ .event-card__date
 ├ .event-card__title
 ├ .event-card__venue        serif italic
 ├ .event-card__rule         dashed
 └ .event-card__ticket-link  or  .event-card__waitlist-link
```

| To change | Where |
|---|---|
| Heading / label / artist link | `index.html` `.homepage-events__header` |
| Card width | `.event-card` `flex: 0 1 22.5rem` |
| Card gap | `.homepage-events__grid` `gap` |
| Poster ratio / keyline | `.event-card__poster` `aspect-ratio`, `border` |
| Stamp look (everywhere) | `.stamp` in `css/global.css` |
| Next dates panel | `.event-next-dates` (CSS), copy in `buildNextDatesPanel()` |
| Buttons | `.event-card__ticket-link`, `.event-card__waitlist-link` (`--rule-width-strong` outline) |
| Mobile scroll row | `@media (max-width: 600px)`: cards + panel `flex: 0 0 78vw` |
| Past poster size | `.past-poster` `flex: 0 0 150px` |
| Archive link | `index.html` `.homepage-events__archive-link` (→ `/#events` for now) |
| Empty-state text | `index.html` `.homepage-events__empty` |

### 3.11 Footer
**Files:** `components/footer.html` (markup, every page), `css/footer.css` (linked on every page).

Newsletter (placeholder form; swap in the MailerLite embed), Explore, Contact, bottom row with the coral wordmark + legal line + Privacy/Terms.

| To change | Where |
|---|---|
| Newsletter copy / form | `footer.html` `.site-footer__newsletter` |
| Links | `footer.html` `.site-footer__list` |
| Legal line | `footer.html` `.site-footer__legal` |
| Column widths | `.site-footer__newsletter` `flex: 1 1 22rem`; nav/contact `flex: 0 1 14rem` |

**Open:** Instagram/Facebook links are still `#`.

### 3.12 Subpages (about, contact)
**Files:** `about/index.html`, `contact/index.html`, `css/page.css`, `js/page-chrome.js`.

No intro video, so `page-chrome.js` ends the atmosphere's opening state immediately and reveals the header. Sections use `.page-intro` and `.page-section`, plus `field-atmosphere` + `data-field="coral"` so header ink sampling works (the homepage does the same).

| To change | Where |
|---|---|
| H1 size | `.page-intro h1` `font-size: var(--step-6)` |
| Section H2 | `.page-section h2` |
| Divider between sections | `.page-section + .page-section` (`var(--color-ink-30)`) |

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

### 4.4 Per-section atmosphere coverage
Built. Edit the numbers in `STOPS` (`js/homepage.js`); add a row to add a section. Motion feel lives in the `--atmosphere-*` tokens (§3.3).

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

## 5. Known bugs and leftovers

| # | Problem | Status |
|---|---|---|
| 1 | Nav "home" linked to `/index/` | **Fixed** (`/`) |
| 2 | Nav/footer linked to missing `/events/`, `/gallery/` | **Fixed for now** (`/#events`); real pages in the Astro port |
| 3 | 5 nav links, 4 stagger delays | **Fixed** |
| 4 | Header ink never sampled the canvas below the landing | **Fixed** (`field-atmosphere` on every homepage section) |
| 5 | Atmosphere coral ≠ token; dead `--atmosphere-*` tokens | **Fixed** (tokens now drive the atmosphere) |
| 6 | Past events need a manual status change | Expected; the Astro port computes it from the date |
| 7 | Danish strings | **Fixed** |
| 8 | Subpage divider invisible | **Fixed** (`--color-ink-30`) |
| 9 | Nav close sends the atmosphere to 0.75 mid-page | Open, minor |
| 10 | `header-theme.js` pixel sampling every 1.2 s | **Reduced** to 2.5 s; scroll-end sampling would be better |
| 11 | `CLAUDE.md` current state stale | **Fixed** |
| 12 | Footer not to spec | **Fixed** |
| 13 | Instagram/Facebook footer links are `#` | Open: needs the real handles |
| 14 | Section labels (`.eyebrow`) are serif italic; spec §1 says micro sans | Open: decide, then change `.eyebrow` once (affects subpages) |

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
