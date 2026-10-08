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
- js/ — include, navigation, header-theme, homepage, page-chrome, next-event
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

- Homepage being rebuilt to spec. Fonts via Adobe kit `koo7phy`; ink (`--color-ink`) is the
  site-wide default text color, including over the atmosphere (better contrast than white at both
  ends of the coral/pale gradient).
- Section skeleton built to spec §2: `landing → next-event → #idea → #artist → #people →
  #practice → #events → footer`. `#practice` is still a placeholder stub.
- Section 0.5 "Next event" (`js/next-event.js`) and section 05 "join us" — events grid + past
  strip (`js/events.js`) — both built, reading `data/events.json`.
- Body text tokens (`--text-body`/`--leading-body`/`--measure`/`--text-small`) applied site-wide.
- Next: bugs from `docs/COMPONENT-GUIDE.md` §5, then footer to spec, then atmosphere stops (§4.4).

## Docs

- docs/COMPONENT-GUIDE.md — where every component lives (files, selectors, recipes). Read the relevant section instead of searching the codebase.
- docs/HOMEPAGE-SPEC.md — the target design. Read only for homepage layout work.

## Working style (token budget matters)

- Only open files the task names, or the ones the guide points to. No repo-wide searches unless asked.
- Never read assets/ or large files whole; read the relevant function or CSS block.
- No explanations unless something is ambiguous. Show the diff, not a summary of it.
- Don't verify in the browser unless asked.
- One task per session.
