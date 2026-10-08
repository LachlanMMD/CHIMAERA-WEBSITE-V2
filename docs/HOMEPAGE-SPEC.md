# CHIMAERA — Homepage spec (v1)

Source of truth for building the homepage. Wireframe: FigJam "Home" (layout only).
Fonts, colors and the atmosphere system already exist in the repo. This spec defines
layout, content slots, behavior and mobile. **All copy and images are placeholders.**

## How to use this spec (for Claude Code)

- Stack stays as-is: static HTML, CSS with custom properties from `css/tokens.css`, vanilla JS. No frameworks, no Tailwind, no new dependencies.
- Build **one section per session**. Show the diff and explain meaningful changes.
- Never hardcode colors, sizes or font names. Missing token → add it to `tokens.css`.
- Do not change existing behavior marked **KEEP** without asking.
- If the spec is ambiguous, ask. Don't invent design.

---

## 1. Global

| Element | Spec |
|---|---|
| Atmosphere | **KEEP.** One continuous fluid field (`#atmosphere-canvas`) fixed behind the whole page. Content sits on top. Existing JS triggers fire when certain sections fill the viewport; keep them and re-map them to the new section list (see §4). Red zones in the wireframe = where the atmosphere dominates. |
| Header | **KEEP.** No visible header on load. Star icon (top-right) is the menu trigger. |
| Menu | First item: **Next event** (links to the current upcoming event). Then: Events, About, For artists, Contact. |
| Fonts | Adobe Fonts web kit replaces self-hosted woff2 (see §6). |
| Section labels | Format `0N the [name]`, small, lowercase, placed top-left of each section. Numbering must be sequential with no duplicates. |
| Thread | Dashed line connecting 02 → 05, drawn on scroll. Sits **behind images** and above the atmosphere (see §5). |

## 2. Section map

| Order | id | Label | Purpose |
|---|---|---|---|
| 0 | `landing` | none | Editorial video moment |
| 0.5 | `next-event` | none | Fast path to tickets |
| 1 | `idea` | 01 the idea | Mission statement |
| 2 | `artist` | 02 the artist | Artists get a stage |
| 3 | `people` | 03 the people | Everyone is an artist |
| 4 | `practice` | 04 the practice | What happens at an event |
| 5 | `events` | 05 join us | Upcoming (buy) + past (proof) |
| 6 | `footer` | none | Newsletter, contact, legal |

## 3. Sections

### 0 — Landing  **KEEP concept**
- Full viewport. Atmosphere fills the field. Wordmark top-left, star top-right.
- Centered video as an editorial object, intentionally smaller than the viewport (it is not a hero background).
- Video: `muted autoplay loop playsinline`, poster image, no controls.
- Mobile: video width ~80vw, still centered.
- Tighten the "embed" read: no black letterbox bars. Crop the video to its own aspect ratio, or let the atmosphere bleed into the edges.

### 0.5 — Next event  **BUILT** — variant: Line — ruled caption band on the atmosphere
- Compact strip directly after the landing: `date · title · venue` + **Tickets →** button.
- Data from `events` (see §7): first upcoming event. Hidden if none are upcoming.
- If sold out: replace the button with "Sold out — join waitlist" → footer newsletter anchor.
- Mobile: stacks to two lines, full-width button (flex-wrap, no media query).
- Implementation: markup in `index.html`, styles in `css/homepage.css` (`.next-event`), data in
  `data/events.json`, render logic in `js/next-event.js`.

### 1 — 01 the idea
- Left: label, phonetic `[khi-mæ-ra]` (serif italic), statement headline (uppercase sans, placeholder).
- Right: one image.
- **Remove** the second wordmark that the wireframe places in this block.
- Mobile: text, then image.

### 2 — 02 the artist
- Left: H2 + body. Right: image. The thread starts here.
- Mobile: text, then image.

### 3 — 03 the people
- Left: image. Right: label, H2 + body. The thread passes between the two.
- Label sits inside the section, right-aligned (mirrors 02).
- Mobile: text, then image (text first, for consistency).

### 4 — 04 the practice
- Left: H2 + body. Right: collage of 3–4 images, each rotated −6° to 6° and overlapping.
- Rotations are fixed values in CSS, not random per load.
- Mobile: collage becomes a 2-column grid; rotations reduced to ±3°.

### 5 — 05 join us (events)
- Replaces the wireframe's CTA box + carousel. **No carousel.**
- **Upcoming:** grid of event cards (poster, date, title, Tickets button). Desktop 3 columns, tablet 2. Mobile: horizontal CSS scroll-snap, no JS.
- **Past:** smaller strip of past posters with a "SOLD OUT" stamp where true. Links to the event page or nothing.
- Below: a text link **"Are you an artist? →"** to the for-artists page.
- The thread ends here.

### 6 — Footer
- Newsletter signup (provider TBD; use a placeholder form that posts nowhere).
- Instagram, email.
- Legal: [legal entity name], [address], CVR [number]. Required for a business selling tickets.
- Small wordmark.

## 4. Atmosphere triggers

Existing triggers must be re-mapped to the new section ids. Claude Code: list the current triggers (selector → effect) before changing anything, then propose the mapping.

## 5. Thread (scroll-drawn dashed line), prototype first

Build as an isolated prototype in `prototype/thread.html` before integrating.

- One SVG, absolutely positioned behind the content of sections 02–05, `pointer-events: none`.
- z-order: atmosphere < thread < images/text.
- Path is computed from anchor elements (e.g. `[data-thread-anchor]` on images and headings), not hardcoded coordinates, so it survives layout changes. Use cubic béziers between anchors.
- Recompute on **width** change only (ignore height-only resizes from the mobile URL bar), debounced.
- Drawing: `stroke-dasharray` is already used for the dashes, so it can't also do the draw-on effect. Use a **mask**: a solid copy of the path in a `<mask>`, animated via `stroke-dashoffset`, reveals the dashed path.
- Progress = scroll position through the thread container (0 → 1), via a single rAF-throttled scroll handler or a shared scroll loop.
- `prefers-reduced-motion: reduce` → path fully drawn, no animation.
- Mobile: simple vertical wave down the left gutter, same draw behavior. Decide after the prototype.

## 6. Fonts (Adobe Fonts)

- Create a web project on fonts.adobe.com with Minion Pro (regular, italic) and Forma DJR Banner (regular, bold). Add the project domains (production domain, Vercel preview domain, `127.0.0.1`/`localhost`).
- Add to `<head>`: `<link rel="preconnect" href="https://use.typekit.net" crossorigin>` + the kit `<link rel="stylesheet">`.
- Delete the `@font-face` rules for the missing woff2 files.
- Update the font-family tokens to the exact CSS names the kit shows (e.g. `minion-pro`, `forma-djr-banner`; verify in the kit).

## 7. Event data

- One file: `data/events.json`. Fields: `slug, title, date (ISO), venue, poster, ticketUrl, status (upcoming|soldout|past)`.
- `ticketUrl` = one Stripe Payment Link per event/tier.
- Both §0.5 and §5 render from this file. This maps 1:1 to an Astro content collection later.

## 8. Quality bar

- Contrast: body text ≥ 4.5:1 against the atmosphere at its most saturated point. Large headlines ≥ 3:1. Check the actual tokens.
- Images: `loading="lazy"` below the fold, explicit width/height.
- Video: under ~3 MB, WebM + MP4 fallback, poster.
- One scroll loop for the whole page. No `getImageData` or layout reads inside scroll handlers.
- Keyboard: menu trigger and ticket buttons are reachable and visibly focused.

## 9. Cleanup in existing code

- Remove the empty stub sections (`.homepage-idea`, `.homepage-cta`) once the new sections replace them.
- Fix the duplicated "01" labels.
- Map the old section classes to the new ids. List the mapping before renaming.

## 10. Open questions

- Newsletter provider (e.g. Mailchimp, Brevo, Substack)?
- Event detail pages: does a card link to `/events/[slug]`, or straight to Stripe?
- Thread on mobile: keep or drop after the prototype?
