# Three Heads — waitlist (/threeheads/)

Secret, unlinked page. Not in nav, footer or sitemap (the sitemap is the hand-kept `STATIC_PATHS` list in `src/pages/sitemap.xml.ts`; just never add it there). `noindex,nofollow`. It is deliberately **not** in `robots.txt`: a `Disallow` line would publish the path to anyone reading that file, and would stop crawlers from seeing the noindex tag.

| File | What |
|---|---|
| `src/pages/threeheads.astro` | Page + `APPS_SCRIPT_URL` constant at the top. Standalone `<html>` (no `Base.astro`). Heads SVG slot is a comment above the wordmark. |
| `public/css/threeheads.css` | All styles for the page. |
| `public/css/tokens.css` | `--threeheads-*` colours + `--font-threeheads-wordmark`. |
| `public/js/threeheads-waitlist.js` | `fetch` with `mode: "no-cors"`, thank-you / error states. |

Fields posted (URL-encoded): `name`, `phone`, `referral`, `consent` (`yes`), `website` (honeypot, must be empty).

Because of `no-cors` the browser can't read the response, so the page shows "thank you" whenever the request reaches Google — even if the script rejects it. Check the Sheet, not the page, when testing.

---

## 1. Apps Script code

```js
/**
 * Three Heads waitlist → Google Sheet.
 * Bound to the spreadsheet (Extensions → Apps Script). Appends one row per
 * signup to the sheet named "Waitlist", creating it with headers if missing.
 */
var SHEET_NAME = "Waitlist";
var HEADERS = ["Timestamp", "Name", "Phone", "Referral", "Consent"];

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: people never see the "website" field; bots fill it.
  if (p.website) return reply_("ignored");

  var name = clean_(p.name, 100);
  var phone = clean_(p.phone, 30);
  var referral = clean_(p.referral, 200);
  var consent = p.consent === "yes";

  if (!name || !phone || !consent) return reply_("missing fields");
  if (!/^[+0-9 ()\-]{6,20}$/.test(phone)) return reply_("bad phone");

  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // two signups at once don't overwrite each other
  try {
    sheet_().appendRow([new Date(), name, phone, referral, consent ? "yes" : "no"]);
  } finally {
    lock.releaseLock();
  }
  return reply_("ok");
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap length, and neutralise spreadsheet formulas (=, +, -, @ at the
// start would otherwise be evaluated by Sheets). Phone numbers starting with
// "+" are stored as text for the same reason.
function clean_(value, max) {
  var s = String(value || "").trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply_(status) {
  return ContentService.createTextOutput(JSON.stringify({ status: status }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Note: `clean_` prefixes `+45…` with `'` so Sheets keeps it as text instead of a formula/number; the apostrophe doesn't show in the cell. The phone regex is checked on the raw value before that, so it's fine.

## 2. Setup (once)

1. Google Drive → **New → Google Sheets**. Name it e.g. "Three Heads waitlist". (You can rename the first tab to `Waitlist`, or let the script create it.)
2. In the Sheet: **Extensions → Apps Script**.
3. Delete the placeholder `myFunction`, paste the code above, **Save**.
4. **Deploy → New deployment** → gear icon → **Web app**.
   - Description: `v1`
   - **Execute as: Me**
   - **Who has access: Anyone**
5. **Deploy** → authorise with your Google account (Advanced → Go to project → Allow; it's your own script).
6. Copy the **Web app URL** (ends in `/exec`).
7. Paste it into `APPS_SCRIPT_URL` at the top of `src/pages/threeheads.astro`, replacing `PASTE_APPS_SCRIPT_URL`. Commit, deploy.
8. Test: submit the form on the live site, then check the Sheet for the row.

"Anyone" is required: visitors aren't signed into your Google account. The URL is safe to publish — it can only run `doPost`, which only appends rows.

## 3. Redeploying after you edit the script

Saving the script does **not** change what the live URL runs. Each deployment points at a frozen version.

- **Keep the same URL (normal case):** **Deploy → Manage deployments** → select the existing deployment → pencil (Edit) → **Version: New version** → **Deploy**. Same deployment ID, so the `/exec` URL stays the same and nothing on the site changes.
- **New deployment** (Deploy → New deployment) creates a new deployment ID and therefore a **new URL**. Only do this deliberately; then update `APPS_SCRIPT_URL` and redeploy the site. The old URL keeps running its old version until you archive it in Manage deployments.
- The `/dev` URL (Test deployments) runs the latest saved code but only works for you while signed in. Don't put it on the site.

## 4. GDPR — privacy page entry (pending, after PR #21)

The waitlist collects phone numbers, so `/privacy/` must list it before the link is shared. Not done on this branch because PR #21 has `src/pages/privacy.astro` open. Once #21 is merged, add:

**a) In the `uses` array in `src/pages/privacy.astro`** (after "Newsletter"):

```js
  {
    title: "Three Heads waitlist",
    data: "Name, phone number, optionally who invited you",
    purpose: "Texting you about Three Heads supper club dinners (invitations, dates, seats)",
    basis: "Consent, Art. 6(1)(a)",
    retention: "Until you ask us to delete it or withdraw consent, or when the waitlist is closed; reviewed at least once a year",
  },
```

**b) In "Recipients and processors"**, add a list item:

```html
<li>Google (Google Workspace / Google Sheets and Apps Script): stores the Three Heads waitlist.</li>
```

The existing note about transfers outside the EU (Data Privacy Framework / standard contractual clauses) already covers Google. Bump `UPDATED` to the merge date.

Operationally: delete a row in the Sheet when someone asks (info@chimaeracollective.dk); that is the whole deletion process.
