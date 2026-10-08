# CHIMAERA — Build prompts (homepage → Astro)

Paste one prompt per Claude Code session, in order. After each: check at 375px and 1440px, commit, `/clear`.
Model: Sonnet. Each prompt names its files so Claude Code doesn't search.

Before P1: commit `docs/HOMEPAGE-SPEC.md` (v2.2) and this file.

---

## P1 — Bug batch (guide §5)

```
Read docs/COMPONENT-GUIDE.md §5 only. Fix bugs 1, 2, 3, 4, 5, 7, 8, 10. Nothing else.

Specifics:
- 1 + 2: components/navigation.html links become, in this order:
  home → "/", events → "/#events", archive → "/#events", about → "/about/", contact → "/contact/".
  Labels: "home", "events", "archive", "about", "contact".
- 5: in js/atmosphere.js DEFAULT_CONFIG set coral to "#e35039". Leave the --atmosphere-* tokens alone (P2 wires them).
- 7: translate the Danish strings listed in §5 to English. Tagline: "CHIMAERA.CPH — a creative community around art, design and tactile processes."
- 10: raise the header-theme.js sampling interval to 2500.

Constraints:
- Touch only the files each bug names.
- One commit per bug: "fix(#N): <short>".
- If a fix is unclear or exceeds ~10 lines, stop and ask.
- End with one line per bug + changed files.
```

## P2 — Atmosphere: stops + breath + token knobs

```
Read docs/HOMEPAGE-SPEC.md §4 and docs/COMPONENT-GUIDE.md §3.3 and §4.4. Open only js/atmosphere.js, js/homepage.js, css/tokens.css.

1. Apply COMPONENT-GUIDE §4.4 (setColourMidpoint + STOPS), with the STOPS numbers from HOMEPAGE-SPEC §4.1:
   landing 0.75, #idea 0.50, #artist 0.50, #people 0.50, #practice 0.50, #events 0.75.
2. Breath (spec §4.2) in drawFrame():
   - add to DEFAULT_CONFIG: breathAmplitude: 0.03, breathPeriod: 8, breathSoftness: 0.2
   - var breath = Math.sin((time / breathPeriod) * Math.PI * 2);
   - add breath * breathAmplitude to centerXFrac (next to globalSwayFrac);
   - multiply featherFrac by (1 + breath * breathSoftness) before the clamp.
   - Reduced motion: no breath (FROZEN_T path unchanged).
3. Token knobs (spec §4.2 table): at mount, read the --atmosphere-* custom properties once via
   getComputedStyle(document.documentElement). Coral/pale override config.coral/pale; speed,
   amplitude, softness, mouse multiply their config values; breath tokens set the breath values.
   Missing/invalid token → keep the JS default. Add the new tokens to tokens.css with the spec defaults,
   in the existing "Atmosphere defaults" block, each with a one-line comment.
   Wire or delete --atmosphere-coral-intensity, --atmosphere-opacity, --atmosphere-scale. No dead tokens.
4. Don't touch the opening sequence, NAV_CONFIG, or the opening lock (`if (openingActive) return;`).

Show the diff before writing. Commit: "feat(atmosphere): section stops, idle breath, token knobs".
Then update COMPONENT-GUIDE §3.3 (knob table → tokens) and §4.4 (new numbers). Commit: "docs: atmosphere".
```

## P3 — Type scale swap

```
Read docs/HOMEPAGE-SPEC.md §1 (Type roles). Open only css/homepage.css.
- #idea statement h2: font-family var(--font-banner), font-size var(--step-4).
- #artist, #people, #practice, #events h2: font-size var(--step-3).
Change only those font-size/font-family declarations. Show the diff. Commit: "style: statement step-4, H2 step-3".
```

## P4 — 01 the idea

```
Read docs/HOMEPAGE-SPEC.md §3 "1 — 01 — the idea". Open only index.html (#idea block) and the HERO block in css/homepage.css.
- Keep the existing headline and body copy.
- Add the phonetic line [khi-mæ-ra] between label and headline (serif italic, ~1.9rem; reuse .eyebrow styling where possible, new modifier class if needed).
- Gallery: ASK ME before changing it (spec says one 4:5 image; the code has three).
- Layout: copy left, image right at ≥64rem; stacked on mobile, text first.
Show the diff. Commit: "feat(idea): match spec v2.2".
```

## P5 — 02 / 03 two-column

```
Read docs/HOMEPAGE-SPEC.md §3 sections 2 and 3, and docs/COMPONENT-GUIDE.md §4.6. Open only css/homepage.css (ARTIST/PEOPLE block).
Apply §4.6. Additions: 02 image inset ~80px from the right edge at ≥64rem (no inset below). 03 image left at ≥64rem via order: -1; text-first source order unchanged.
No HTML changes unless unavoidable — ask first. Commit: "feat(artist, people): two-column layout".
```

## P6 — 04 the practice

```
Read docs/HOMEPAGE-SPEC.md §3 "4 — 04 — the practice" (not §7). Open only index.html (#practice) and css/homepage.css.
- Wrap copy in .homepage-practice__copy (label, H2, body, then a text link "Get in touch →" to /contact/).
- Add .homepage-practice__collage: 4 <figure>s with placeholder images (reuse /assets/images/HOMEPAGE/HERO*.JPG for now),
  rotations −5°, 3°, −2°, 6°, overlapping, soft shadow, aspect-ratio 27/23 container. Static: no interaction.
- Desktop ≥64rem: two columns, copy indented ~64px. Mobile: stacked, collage full width, no indent.
- Images: loading="lazy", width/height set, alt="" (decorative).
Commit: "feat(practice): copy + static collage".
```

## P7 — 05 join us + next-event stamp

```
Read docs/HOMEPAGE-SPEC.md §1 (Stamp, Buttons) and §3 "0.5" and "5". Open only index.html (#events), js/events.js, js/next-event.js, css/homepage.css (NEXT EVENT + EVENTS blocks).
1. Stamp: one class .stamp in homepage.css per spec §1. Replace .event-card__soldout-tag and .past-poster__stamp styling with it:
   straight, inside the poster's top-left, no overhang. Next-event sold out: .stamp + secondary "Join the waitlist" button.
2. Cards: flex 0 1 360px, left-aligned. Mobile scroll-snap row unchanged.
3. "Next dates" panel: rendered by events.js after the cards when upcoming count is 1 or 2 (markup and copy in spec §3.5). 0 → existing empty state. 3 → no panel.
4. Artist link → /contact/. Past row: label left, "Archive →" right (href /#events for now).
Show the diff for events.js before writing. Commit: "feat(events): stamp, card width, next-dates panel".
```

## P8 — Footer

```
Read docs/HOMEPAGE-SPEC.md §3 "6 — Footer". Open only components/footer.html, css/global.css or css/homepage.css (wherever .site-footer lives now), and the pages' <head> link lists.
- Rebuild components/footer.html to spec: newsletter (placeholder form), Explore, Contact, bottom row with wordmark + legal row.
  Keep the existing wordmark image.
- Move all .site-footer CSS into a new css/footer.css; link it from index.html, about/index.html, contact/index.html.
- Links ≥ 44px. Visually-hidden label on the email input. Footer sits above the atmosphere (positioned, z-index).
Commit: "feat(footer): rebuild to spec v2.2".
```

## P9 — Docs sync

```
Update CLAUDE.md "Current state" and docs/COMPONENT-GUIDE.md sections 3.6–3.11 and §5 to match the code as it is now.
Mark bugs done in §5. Don't touch code. Commit: "docs: sync after homepage build".
```

---

## After P9: Astro port

Use the port prompt from the planning chat (branch `astro-port`, zero visual change, step by step), then the events-collection prompt (content collection, `/events/[slug]`, archive). Design the event pages in the canvas before that second prompt.
