# CHIMAERA — website

Copenhagen creative platform: art, workshops, events, community.
Static HTML/CSS/vanilla JS, no build step. Deployed on Vercel. Astro migration planned later.

## Run
- Local: VS Code Live Server (http://127.0.0.1:5500). Stop it during large edits; it reloads on every file write.

## Structure
- index.html, about/, contact/ — pages
- components/ — header.html, navigation.html, footer.html, injected by js/include.js
- css/tokens.css — ALL colors, type, spacing. Never hardcode values; add missing tokens here.
- css/ — global, typography, navigation, homepage, page (subpages)
- js/atmosphere.js — continuous fluid background canvas + section triggers
- js/ — include, navigation, header-theme, homepage, page-chrome
- assets/ — images, video, logo. Don't open image files unless asked.

## Rules
- Preserve the existing architecture. Never rewrite unrelated code.
- Explain meaningful changes; show the diff before large edits.
- No frameworks, no Tailwind, no new dependencies without asking.
- Atmosphere behavior and the star menu trigger: don't change without asking.
- One task per session.

## Specs
- Homepage: docs/HOMEPAGE-SPEC.md — read it before any homepage work.

## Current state
- Homepage being rebuilt to spec. Fonts now served by an Adobe Fonts kit (self-hosted woff2 files
  were missing) — `--font-banner`/`--font-display`/`--font-text`/`--font-micro`/`--font-serif` in
  `css/tokens.css`, kit link in every page's `<head>`.
- Section 0.5 "Next event" built (variant: Line). Reads `data/events.json` via `js/next-event.js`.
- Next: scroll jank audit, then thread prototype.
