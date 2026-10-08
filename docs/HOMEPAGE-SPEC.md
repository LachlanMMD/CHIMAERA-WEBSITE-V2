# CHIMAERA — Homepage spec (v2)

Source of truth for building the homepage.
Visual reference: the "CHIMAERA — Next event strip" design canvas, row "Full homepage"
(desktop + mobile). The canvas uses stand-in fonts (Archivo/Crimson Pro); the real fonts are the Adobe kit.
**All copy and images are placeholders** unless stated.

## How to use this spec (for Claude Code)

- Stack stays as-is: static HTML, CSS custom properties from `css/tokens.css`, vanilla JS (IIFE, 'use strict', like the existing files). No frameworks, no Tailwind, no new dependencies.
- One section per session. Report → wait for approval → change → verify → commit.
- Never hardcode colors, sizes or font names. Missing token → add it to `tokens.css`.
- Don't change behavior marked **KEEP** without asking. If the spec is ambiguous, ask.

---

## 1. Global

| Element | Spec |
|---|---|
| Atmosphere | **KEEP** the continuous fluid canvas behind the page and its scroll-driven shifts. Per-section coverage targets are in §4. |
| Header | **KEEP.** No visible header on load. Star (top-right) = menu trigger. Wordmark stays **white** (logo; exempt from contrast). |
| Text color | Ink (`--color-ink`) is the default for all content text, site-wide. White only for the wordmark, the nav overlay, and inverse elements on ink backgrounds. |
| Section labels | Dash format: `01 — the idea`, `02 — the artist`, `03 — the people`, `04 — the practice`, `05 — join us`. Sequential, no duplicates. |
| Type roles | Huge statement → `--font-banner`; section H2 → `--font-display` 700; UI/text sans → `--font-text`; labels and small caps → `--font-micro`; body paragraphs + italic accents → `--font-serif` (Minion Pro). |
| Body size | `--text-body: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)`, `--leading-body: 1.5`, `--measure: 62ch`. |
| Thread | Dashed line 02 → 05, ink at 70% opacity, 2.5px, dash 12/9, drawn on scroll. Behind images and text, above the atmosphere (§6). |

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
Ruled caption band directly under the landing, on the atmosphere, all ink. Label "Next event" · date · title + venue · Tickets button (ink bg, pale-warm text, min-height 48px). Sold out → "Sold out" tag + "Join the waitlist" (#footer). No upcoming event → section hidden. Rendered by `js/next-event.js` from `data/events.json`.

### 1 — 01 — the idea
Left: label, phonetic `[khi-mæ-ra]` (serif italic, ~1.9rem), statement headline (banner, uppercase, ~4rem, max ~13ch), intro paragraph (serif, body size). Right: one image, 4:5, max ~400px. No second wordmark. Mobile: text, then image.

### 2 — 02 — the artist
Left: label, H2 "The artist", body. Right: image 3:2, max ~440px, inset from the right edge. Thread starts at the end of the body text and passes behind the image.

### 3 — 03 — the people
Left: image 4:3, max ~480px. Right: label, H2 "The people", body ("We believe that everyone is an artist." + placeholder). Mobile: text **before** image (use `flex-wrap: wrap-reverse` or source order + CSS).

### 4 — 04 — the practice
Left: label, H2 [Heading], body (indented). Right: collage of 4 images, fixed rotations −5°, 3°, −2°, 6°, overlapping, soft shadow. Mobile: collage full width, same composition scaled.
**Later:** interactive collage (§7).

### 5 — 05 — join us (events)
- Header row: label + H2 "Upcoming" left; "Are you an artist? →" link right.
- Upcoming cards from `data/events.json`: 3 columns desktop (`flex: 1 1 280px`), horizontal scroll-snap on mobile. **Card framing: pending decision between A (passe-partout), B (ticket stub), C (frame + caption). See the canvas "05 — event card framing options".** Every card: poster 3:4, date, title, venue, Tickets / Sold out + Join the waitlist.
- "Past events" strip: small posters (~150px, 3:4) in a horizontally scrolling row, "Sold out" stamp where true, date bottom-left.

### 6 — Footer (ink background, pale-warm text)
- Column 1, Newsletter: label, one line of copy, email input (visually-hidden label) + coral Subscribe button. Provider TBD; placeholder form for now.
- Column 2, Explore: Home, All events, Archive, Gallery, About, Contact (same as the nav).
- Column 3, Contact: info@chimaeracollective.dk (mailto), Instagram, Facebook.
- Bottom row (above a thin rule): large wordmark left; right: [Legal entity name] · [Address], København · CVR [number] · Privacy policy · Terms & conditions.
- `id="footer"` (target of the waitlist links).

## 4. Atmosphere coverage per section

The atmosphere shifts as you scroll. Target coverage from the left edge, measured at the section's midpoint:

| Section | Coverage |
|---|---|
| landing | default (~70%) |
| 01 the idea | ~50% |
| 02 the artist | ~30–40% |
| 03 the people | ~50% |
| 04 the practice | ~30–40% |
| 05 join us | back to default (same as landing) |

Claude Code: list the existing triggers (selector → effect) and propose how to hit these targets with the current atmosphere.js API before changing anything. Transitions between states stay smooth (no hard cuts).

## 5. Event data

`data/events.json`, fields: `slug, title, date (ISO), venue, poster, ticketUrl, status (upcoming|soldout|past)`. `ticketUrl` = Stripe Payment Link per event/tier. Sections 0.5 and 05 both render from this file. Maps 1:1 to an Astro content collection later.

## 6. Thread (scroll-drawn dashed line), prototype first

Prototype in `prototype/thread.html` before integrating.
- One SVG behind the content of sections 02–05, `pointer-events: none`. z-order: atmosphere < thread < images/text.
- Path computed from anchor elements (`[data-thread-anchor]`), cubic béziers, not hardcoded coordinates.
- Recompute on **width** change only, debounced.
- Dashes use `stroke-dasharray`, so the draw-on effect uses a **mask**: a solid copy of the path in a `<mask>`, animated via `stroke-dashoffset`.
- Progress = scroll through the thread container (0 → 1), in the page's single rAF scroll loop.
- `prefers-reduced-motion: reduce` → fully drawn, static.
- Mobile: thread off by default; prototype a vertical variant before deciding.

## 7. 04 collage interaction (later; don't build yet)

Images move outward to reveal a hidden button ("[for the curious →]", destination TBD).
- Desktop: triggered by hover **and** `:focus-within` (keyboard users must reach the button).
- Mobile (primary audience, no hover): auto-spread when the collage crosses the viewport center (IntersectionObserver), plus a tap toggle on the collage (a real `<button aria-expanded>`).
- Motion: `transform` only (GPU-friendly), ~400ms ease-out, each image moves along its own vector away from the center.
- `prefers-reduced-motion`: no movement, button always visible.

## 8. Fonts

Adobe Fonts kit `koo7phy` via `<link>` + preconnect on every page. Font-family names from the kit: `forma-djr-greek-banner/display/text/micro`, `minion-pro`. No self-hosted Adobe fonts (license). Kit trimmed to used styles; `font-display: swap` set in the Adobe project.

## 9. Quality bar

- Contrast: ink on coral ≈ 4.5:1 (passes at body size); white on coral ≈ 3.9:1 (headlines/logo only).
- Images: `loading="lazy"` below the fold, explicit width/height. Video < ~3 MB, WebM + MP4 fallback, poster.
- One scroll loop for the page; no layout reads or `getImageData` in scroll handlers.
- Touch targets ≥ 44px. Visible `:focus-visible` on all interactive elements.

## 10. Open questions

- Event card framing: A, B or C (or a hybrid).
- Newsletter provider (Mailchimp, Brevo, Substack…).
- Event cards: link to `/events/[slug]` detail pages or straight to Stripe?
- Collage button destination (§7).
- Footer pages (Archive, Gallery, Privacy, Terms) don't exist yet.
