# CHIMAERA — Homepage spec (v2.2)

Source of truth for building the homepage.
Visual reference: the design canvas, page "Homepage": artboards "Homepage — full, desktop",
"Homepage — full, mobile" (canonical) and "System — tokens & components".
The canvas uses stand-in fonts (Archivo/Crimson Pro); the real fonts are the Adobe kit.
Copy and images in the canvas are placeholders. **Real copy already in `src/pages/index.astro` wins over canvas placeholders.**

## How to use this spec (for Claude Code)

- Stack: Astro (static output). CSS custom properties from `public/css/tokens.css`, vanilla JS in `public/js/` (IIFE, 'use strict', like the existing files). No UI frameworks, no Tailwind, no new dependencies without asking.
- One section per session. Report → wait for approval → change → verify → commit.
- Never hardcode colors, sizes or font names. Missing token → add it to `tokens.css`.
- Don't change behavior marked **KEEP** without asking. If the spec is ambiguous, ask.
- Mobile (≈375–390px) is the primary audience. Every change must work there first.

---

## 1. Global

| Element | Spec |
|---|---|
| Ground | `--color-pale` (#f1f6f8). `--color-pale-warm` is only for card mats and text on ink. |
| Atmosphere | **KEEP** the continuous fluid canvas. It is never still: idle "breath" + organic wobble + mouse response (desktop). Coverage stops in §4. All tuning knobs live in `tokens.css` (§4.2). |
| Header | **KEEP.** No visible header on load. Star (top-right) = menu trigger. Wordmark stays **white** (logo; exempt from contrast). |
| Text color | Ink (`--color-ink`) is the default for all content text, site-wide. White only for the wordmark, the nav overlay, and inverse elements on ink backgrounds. |
| Section labels | Dash format: `01 — the idea`, `02 — the artist`, `03 — the people`, `04 — the practice`, `05 — join us`. |
| Type roles | 01 statement → `--font-banner`, `--step-4`, 700, uppercase. Section H2 → `--font-display` 700, `--step-3`. UI sans → `--font-text`. Labels/small caps → `--font-micro`, `--text-small`. Body paragraphs + italic accents → `--font-serif` (Minion Pro). The statement must always be the largest type on the page after the wordmark. |
| Body size | `--text-body`, `--leading-body: 1.5`, `--measure: 62ch`. |
| Stamp | **One** "Sold out" stamp everywhere (next-event strip, event cards, past posters): `--color-coral-deep` background, `--color-pale-warm` text, `--font-micro` 700 uppercase, letter-spacing 0.1em, padding ~5px 9px. **Never rotated.** On posters it sits inside the top-left corner (12px inset), never overhanging. |
| Rotation | Reserved for the 04 collage. Nothing else is rotated. |
| Buttons | Primary: ink fill, pale-warm text, min-height 48px. Secondary: 1.5px ink outline, transparent. Text link: ink, 600, trailing arrow. Touch targets ≥ 44px. |
| Thread | Dashed line 02 → 05, ink at 70% opacity, 2.5px, dash 12/9, drawn on scroll. Behind images and text, above the atmosphere (§6). Off on mobile. |

## 2. Section map

| Order | id | Label |
|---|---|---|
| 0 | `landing` | none |
| 0.5 | `next-event` | none |
| 1 | `idea` | 01 — the idea |
| 2 | `artist` | 02 — the artist |
| 3 | `people` | 03 — the people |
| 4 | `practice` | 04 — the practice |
| 5 | `events` | 05 — join us |
| 6 | `footer` | none |

## 3. Sections

### 0 — Landing  **KEEP concept**
Full viewport. Wordmark top-left (white), star top-right. Centered editorial video (4:3, `muted autoplay loop playsinline`, poster, no controls, no letterbox bars). Mobile: video ~80vw.

### 0.5 — Next event  (variant: Line)
Ruled caption band directly under the landing, on the atmosphere, all ink. Label "Next event" · date · title + venue · Tickets button (primary). Sold out → stamp + secondary "Join the waitlist" button (→ #footer), same pair as on event cards. No upcoming event → section hidden. Rendered by `public/js/next-event.js`.

### 1 — 01 — the idea
Left: label, phonetic `[khi-mæ-ra]` (serif italic, ~1.9rem), statement headline (§1 type roles, max ~13ch), intro paragraph (serif, body size). Right: one image, 4:5, max ~400px. Mobile: text, then image. No second wordmark.

### 2 — 02 — the artist
Desktop ≥64rem: two columns. Left: label, H2 "The artist", body. Right: image 3:2, max ~440px, inset ~80px from the right edge. Mobile: stacked, no inset.

### 3 — 03 — the people
Desktop: image 4:3 (max ~480px) left, text right. Mobile: text **before** image (source order text-first, `order: -1` on the image at desktop).

### 4 — 04 — the practice
Left (indented ~64px on desktop, no indent on mobile): label, H2 [Heading], body, then a text link **"Get in touch →" to `/contact/`** (visible now). Right: collage of 4 images, fixed rotations −5°, 3°, −2°, 6°, overlapping, soft shadow. Mobile: collage full width, same composition scaled.
**Later:** the collage reveal (§7) will use this same link as its revealed button.

### 5 — 05 — join us (events)
- Header row: label + H2 "Upcoming" left; "Are you an artist? →" text link right, to `/contact/`.
- Upcoming cards: realistically 1–2 at a time, max 3. Cards `flex: 0 1 360px`, left-aligned (never stretched full width). Mobile: horizontal scroll-snap row, cards ~78% width.
- **Card = passe-partout + dashed rule:** pale-warm mat, padding ~1rem (slightly more at the bottom); poster 3:4 with 1px `--color-ink-25` keyline; caption on the mat: date (micro, uppercase), title (display 700, 1.5rem), venue (serif italic); 2px dashed `--color-ink-45` rule; primary Tickets button, full card width. Sold out: stamp (§1) inside the poster + secondary "Join the waitlist" (→ #footer).
- **"Next dates" panel** when there are 1–2 upcoming events: same width as a card, transparent, 2px dashed `--color-ink-45` border, content bottom-aligned: label "Next dates", serif line "New dates reach the newsletter before they go on sale here.", secondary button "Get first access" (→ #footer). 0 upcoming → existing empty state line. 3 upcoming → no panel.
- "Past events" row: label left, "Archive →" text link right (to `/#events` until the archive page exists). Small posters (~150px, 3:4) in a horizontal scroll row; stamp where sold out; date bottom-left.

### 6 — Footer (ink background, pale-warm text) — `src/components/Footer.astro`, styles in `public/css/footer.css`
- Column 1, Newsletter: label, one line of copy, email input (visually-hidden label) + coral Subscribe button (ink text). MailerLite embed later; placeholder form for now (no action, `type="button"`).
- Column 2, Explore: Events, Archive, About, Contact. Events/Archive → `/#events` until those pages exist.
- Column 3, Contact: info@chimaeracollective.dk (mailto), Instagram, Facebook.
- Bottom row (above a thin pale-warm 20% rule): large wordmark left; right: `CHIMAERA.CPH · Ved Linden 4, 3. th., 2300 København S · CVR 45933091` · Privacy policy · Terms & conditions.
- All links ≥ 44px tall. `id="footer"` (waitlist target). The footer ends the atmosphere.

## 4. Atmosphere

### 4.1 Coverage per section
Coral coverage from the left edge, at the section's midpoint. Between sections the midpoint eases smoothly (no hard cuts).

| Section | Coverage |
|---|---|
| landing | 0.75 |
| 01 the idea | 0.50 |
| 02 the artist | 0.50 |
| 03 the people | 0.50 |
| 04 the practice | 0.50 |
| 05 join us | 0.75 |

Implementation: `STOPS` table in `public/js/homepage.js` + `setColourMidpoint()` in `public/js/atmosphere.js` (recipe: COMPONENT-GUIDE §4.4, with these numbers).

### 4.2 Alive when idle
On top of scroll position, the boundary always moves:
- **Breath:** a slow sine on the midpoint (±0.03, ~8s period) and on the edge softness (±20%). Added to the existing global sway; never replaces it.
- **Organic wobble:** existing noise terms, **KEEP**.
- **Mouse (desktop, fine pointer only):** existing `mouseInfluence`, **KEEP**.
- **Reduced motion:** one static frame at the scroll stop, no breath, no mouse.
- Pauses when the tab is hidden (existing `visibilitychange`, **KEEP**).

All knobs are CSS custom properties in `tokens.css`, read once by `atmosphere.js` at mount (fallback to the JS defaults if a token is missing):

| Token | Default | Effect |
|---|---|---|
| `--atmosphere-coral` | `var(--color-coral)` | Coral colour (replaces the hardcoded `#e25139`) |
| `--atmosphere-pale` | `var(--color-pale)` | Pale colour |
| `--atmosphere-speed` | 1 | Multiplies `movementSpeed` |
| `--atmosphere-amplitude` | 1 | Multiplies `movementAmplitude` |
| `--atmosphere-softness` | 1 | Multiplies `softness` |
| `--atmosphere-breath` | 0.03 | Breath amplitude (fraction of width) |
| `--atmosphere-breath-period` | 8 | Breath period in seconds |
| `--atmosphere-breath-softness` | 0.2 | Breath effect on edge softness |
| `--atmosphere-mouse` | 1 | Multiplies `mouseInfluence` (0 = off) |

`--atmosphere-coral-intensity`, `--atmosphere-opacity`, `--atmosphere-scale`: wire them the same way or delete them. No dead tokens.

## 5. Event data

Events are an Astro content collection: one markdown file per event in `src/content/events/` (schema: `src/content.config.ts`, fields as in §11). At build time `src/pages/data/events.json.ts` turns them into `/data/events.json` (`slug, title, date, venue, poster, ticketUrl, status, soldOut, url`), which sections 0.5 and 05 read. Status is computed: past if the date has passed, else soldout/upcoming.

## 6. Thread (scroll-drawn dashed line), prototype first

Prototype in `prototype/thread.html` before integrating.
- One SVG behind the content of sections 02–05, `pointer-events: none`. z-order: atmosphere < thread < images/text.
- Path computed from anchor elements (`[data-thread-anchor]`), cubic béziers, not hardcoded coordinates.
- Recompute on **width** change only, debounced.
- Draw-on effect uses a **mask**: a solid copy of the path in a `<mask>`, animated via `stroke-dashoffset`.
- Progress = scroll through the thread container (0 → 1), in the page's single rAF scroll loop.
- `prefers-reduced-motion: reduce` → fully drawn, static.
- Mobile: off.

## 7. 04 collage interaction (later; don't build yet)

Images move outward to reveal the "Get in touch" link.
- Desktop: hover **and** `:focus-within`.
- Mobile: auto-spread when the collage crosses the viewport center (IntersectionObserver), plus a tap toggle (a real `<button aria-expanded>`).
- Motion: `transform` only, ~400ms ease-out, each image along its own vector away from the center.
- `prefers-reduced-motion`: no movement, link always visible.

## 8. Fonts

Adobe Fonts kit `koo7phy` via `<link>` + preconnect on every page. Family names: `forma-djr-greek-banner/display/text/micro`, `minion-pro`. No self-hosted Adobe fonts (license). `font-display: swap` set in the Adobe project.

## 9. Quality bar

- Contrast: ink on coral ≈ 4.5:1; white on coral ≈ 3.9:1 (logo/headlines only); pale-warm on coral-deep ≈ 4.5:1 (stamp).
- Images: `loading="lazy"` below the fold, explicit width/height. Video < ~3 MB, WebM + MP4 fallback, poster.
- One scroll loop for the page; no layout reads or `getImageData` in scroll handlers.
- Touch targets ≥ 44px. Visible `:focus-visible` on all interactive elements.
- No horizontal page scroll at 375px.

## 11. Event page (`/events/<slug>/` from `src/pages/events/[slug].astro`, data in `src/content/events/`, `public/css/event.css`)

Quiet and short; reference: the old chimaeracollective.dk event pages. No host/artist block (events aren't artist-led for now).
- Mobile: one centred column (max ~37.5rem). ≥64rem: poster left (sticky), text right.
- Order: "← All events" · poster in the pale-warm mat (card language, scaled up) · medium (serif italic) · H1 title (`--step-4`) · date · time / venue · area · two short serif paragraphs · three one-line details (Duration, Bring, Experience) · one button.
- Button by state: upcoming → primary "Tickets · [price] kr →" (Stripe); sold out → stamp on poster + secondary "Join the waitlist"; past → photo grid + "Hear about the next one first →".
- Not on the page: refund rule, full address, capacity — these live in the Stripe checkout and confirmation email.
- Fields (= the Astro content schema): title, medium, date, time, venue, area, price, stripeUrl, soldOut, poster, duration, bring, experience, photos[], body (two short paragraphs).

## 12. Archive (`/archive/`, `src/pages/archive.astro`, `public/css/archive.css`, `public/js/archive.js`)

Option C "contact sheets" from the canvas (page "Archive").
- Header: label "archive", H1 "Past evenings", then a short thank-you note on a pale-warm mat (no collage opener).
- Evenings: past events only, newest first. Title line: name (display 700, `--step-2`) · medium (serif italic) · date · stamp if sold out; right side: count ("20 photos · 2 clips") and ←/→ buttons (desktop/fine pointer only).
- Strip: one horizontal row per evening, fixed height (~240–340px), items keep their own aspect ratio, scroll-snap. Media order = file names in `src/assets/events/<slug>/`.
- Clips: never autoplay in the strip; poster + ▶ badge; play muted and looped in the lightbox only.
- Lightbox: full-screen ink `<dialog>`; evening title, close; ← n / total →; swipe and arrow keys; steps within one evening.
- Past events have no page of their own; `/events/<slug>/` redirects to `/archive/#<slug>`, and homepage past posters link there.

## 10. Open questions

- Collage reveal (§7): build after the Astro port.
- Archive, events index, event pages, privacy, terms: built in the Astro port.
