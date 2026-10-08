# CHIMAERA — website

Site for CHIMAERA.CPH, a Copenhagen creative community. Built with [Astro](https://astro.build) as a static site; CSS and JS are plain files in `public/`.

## Run locally

```
npm install        # once
npm run dev        # http://localhost:4321 — reloads on save, shows draft events
npm run build      # production build into dist/ (drafts excluded)
npm run preview    # serve dist/ to check the production build
```

## Where things live

| What | Where |
|---|---|
| Pages | `src/pages/` (`index.astro`, `about.astro`, `contact.astro`, `events/[slug].astro`) |
| Shared shell (head, header, nav, footer, scripts) | `src/layouts/Base.astro` |
| Header / navigation / footer | `src/components/` |
| Events (one markdown file each) | `src/content/events/` — copy `_template.md` |
| Event fields (schema) | `src/content.config.ts` |
| CSS, JS, images, video | `public/css/`, `public/js/`, `public/assets/` |

Details: `docs/COMPONENT-GUIDE.md`. Design: `docs/HOMEPAGE-SPEC.md`.

## Deploy

Vercel builds `npm run build` and serves `dist/`. A nightly GitHub Action rebuilds the site so finished events move to "past" (needs the `DEPLOY_HOOK_URL` secret, see `.github/workflows/nightly-rebuild.yml`).
