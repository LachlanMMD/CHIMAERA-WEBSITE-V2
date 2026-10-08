# CHIMAERA — website

Copenhagen creative platform: art, workshops, events, community.
Astro (static output). Pages in src/, plain CSS/JS in public/ (no bundling). Deployed on Vercel.

## Run

- `npm run dev` → http://localhost:4321 (shows draft events). `npm run build` before bigger commits.

## Structure

- src/pages/ — index.astro, about.astro, contact.astro, archive.astro, events/[slug].astro, data/events.json.ts
- src/layouts/Base.astro — head, header, nav, footer, shared scripts; pages pass extra css/js
- src/components/ — Header, Navigation, Footer
- src/content/events/ — one .md per event (copy _template.md); schema in src/content.config.ts
- src/lib/events.ts — event status (past is computed from the date), URLs, date format
- src/assets/events/<slug>/ — archive photos/clips per event (read by src/lib/media.ts); scripts/clip.sh cuts clips
- public/css/tokens.css — ALL colors, type, spacing. Never hardcode values; add missing tokens here.
- public/css/ — global, typography, navigation, homepage, footer, event, archive, page (subpages)
- public/js/ — atmosphere, navigation, header-theme, homepage, page-chrome, next-event, events, archive
- public/assets/ — images, video, logo. Don't open image files unless asked.

## Rules

- Preserve the existing architecture. Never rewrite unrelated code.
- Explain meaningful changes; show the diff before large edits.
- No frameworks, no Tailwind, no new dependencies without asking.
- Atmosphere behavior and the star menu trigger: don't change without asking.
- JS/CSS stay plain files in public/ unless asked; link them via Base.astro `styles`/`scripts`.
- One task per session.

## Specs

- Homepage: docs/HOMEPAGE-SPEC.md — read it before any homepage work.

## Current state

- Ported to Astro with zero visual change (homepage, about, contact identical to the static version).
- Homepage built to docs/HOMEPAGE-SPEC.md v2.2. Event pages from the events collection (spec §11).
- Atmosphere: per-section STOPS in public/js/homepage.js; idle breath + mouse; tuning in `--atmosphere-*` tokens.
- Homepage photos: web-sized copies in public/assets/images/optimized/ (640/1280w). Don't link the 6000px originals.
- Sample/past events are `draft: true` (dev only) until checked.
- Archive built (spec §12): media from src/assets/events/<slug>/; past event URLs redirect to /archive/#slug.
- Next: events index page, privacy + terms pages, footer colour, connect Vercel.

## Docs

- docs/COMPONENT-GUIDE.md — where every component lives (files, selectors, recipes). Read the relevant section instead of searching the codebase.
- docs/HOMEPAGE-SPEC.md — the target design. Read only for homepage layout work.

## Working style (token budget matters)

- Only open files the task names, or the ones the guide points to. No repo-wide searches unless asked.
- Never read assets/ or large files whole; read the relevant function or CSS block.
- No explanations unless something is ambiguous. Show the diff, not a summary of it.
- Don't verify in the browser unless asked. Do run `npm run build` after changes.
- One task per session.
