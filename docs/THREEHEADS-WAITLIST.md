# Three Heads waitlist (/threeheads/)

Unlisted sign-up page for the Three Heads supper club. Name + phone → one row in a Google Sheet.

## Files

- `src/pages/threeheads.astro`: the page. Standalone (no Base.astro, no CHIMAERA chrome). `WAITLIST_ENDPOINT` at the top.
- `public/css/threeheads.css`: all styles and its own `--th-*` tokens (deliberately separate from tokens.css).
- `public/js/threeheads-waitlist.js`: validation, submit, confirmation, inline errors.
- `scripts/threeheads-waitlist.gs`: the Apps Script that writes to the sheet. Source of truth; copy edits back here.

## Keeping it secret

- Not linked anywhere on the site. Not in `sitemap.xml.ts` (explicit path list). `noindex, nofollow`.
- Not in robots.txt on purpose: a Disallow line would publish the URL.
- It's unlisted, not private. Anyone with the link can sign up.

## One-time setup (≈5 min)

1. Open the sheet **Three Heads — waitlist** in Google Drive.
2. Extensions → Apps Script. Delete the sample code, paste all of `scripts/threeheads-waitlist.gs`, save.
3. Deploy → New deployment → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone** (required: visitors aren't signed in to Google; the script can only append rows)
4. Authorise when Google asks ("Google hasn't verified this app" → Advanced → Go to project. It's your own script).
5. Copy the web app URL (ends in `/exec`). Open it in a browser: it should show `{"ok":true,"service":"three-heads-waitlist"}`.
6. Paste it into `WAITLIST_ENDPOINT` in `src/pages/threeheads.astro`, commit, deploy.
7. Sign up once yourself on the live page; check the row lands.

Until step 6 the page works but the button says sign-ups aren't open yet.

## Changing the script later

Edit in Apps Script, then Deploy → **Manage deployments** → edit the existing one → Version: New version. That keeps the same `/exec` URL. "New deployment" makes a new URL, which the site doesn't know.

## The sheet

Columns: Joined | Name | Phone | Status | Notes. The script only appends; Status and Notes are yours. Duplicate phone numbers (same digits) are ignored. Delete a row when someone asks to be removed (privacy policy promises this).

## Later

- Swap the wordmark (Minion Pro italic placeholder in an SVG `<text>`, roughened by the `#th-lino` filter) for the real Three Heads lettering / lino heads as an SVG.
- Handwriting font: commented `@font-face` at the top of threeheads.css.
- Merging into CHIMAERA: the page is self-contained, so it can move under Base.astro or a new route without touching anything else.
