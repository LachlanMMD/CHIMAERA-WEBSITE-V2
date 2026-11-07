# Friendsgiving Nº 03 — signup (/threeheads/friendsgiving/)

Secret, unlinked, `noindex,nofollow`, never in the sitemap or `robots.txt` (same reasons as `docs/THREEHEADS-WAITLIST.md`). Shared via the poster / IG story link only.

| File | What |
|---|---|
| `src/pages/threeheads/friendsgiving.astro` | Page + `APPS_SCRIPT_URL`, `MOBILEPAY_BOX`, `PRICE` constants at the top. Standalone `<html>`. Winged-trio slot is a comment at the top of `<main>`. |
| `public/css/friendsgiving.css` | All styles for the page. |
| `public/css/tokens.css` | `--friendsgiving-*` tokens. |
| `public/js/friendsgiving-signup.js` | GET spots left on load; POST signup; reads the JSON reply. |
| `public/assets/images/friendsgiving/towel.jpg` | Paper-towel background (1080×1920, ~400 KB). |

**Own Sheet + own Apps Script deployment**, separate from the Three Heads waitlist.

Fields posted (URL-encoded): `name`, `phone`, `email`, `diet`, `allergies`, `plusOne` (`yes` or absent), `plusName`, `plusDiet`, `plusAllergies`, `consent` (`yes`), `website` (honeypot).

Replies (`{ status, … }`): `confirmed` (+ `amount`), `waitlist`, `duplicate`, `closed`, `missing fields`, `bad phone`, `bad email`, `error`. GET replies `{ left, closed }`.

Rules (all enforced in the script, the page only displays them):
- **Capacity 40 heads**, +1s included. Only `confirmed` rows count.
- Full → new signups go in as `waitlist` (no payment asked). Promote someone by changing their Status to `confirmed` and texting them.
- **Deadline** 01.12.26 23:59 Copenhagen → `closed`.
- Duplicate = same phone (ignoring spaces / +45) or same email.
- Confirmation email on every signup (confirmed or waitlist), sent from the Google account that owns the script.
- Directions: fill `DIRECTIONS`, then run `sendDirections` once from the editor. It emails every `confirmed` row that hasn't had them yet and ticks "Directions sent".

---

## 1. Apps Script code

```js
/**
 * Friendsgiving Nº 03 signup → Google Sheet (+ confirmation email).
 * Bound to its own spreadsheet (Extensions → Apps Script).
 */
var SHEET_NAME = "Signups";
var CAPACITY = 40;                                    // heads, +1s included
var PRICE = 100;                                      // kr per head — must match PRICE in the page
var MOBILEPAY_BOX = "1080XP";
var DEADLINE = new Date("2026-12-01T23:59:00+01:00"); // Copenhagen (CET)
var DIRECTIONS = "";                                  // fill in, then run sendDirections()

var HEADERS = ["Timestamp", "Status", "Name", "Phone", "Email", "Diet", "Allergies",
  "Plus one", "+1 name", "+1 diet", "+1 allergies", "Heads", "Amount (kr)", "Paid", "Directions sent"];
var COL = { status: 2, name: 3, phone: 4, email: 5, heads: 12, paid: 14, directions: 15 };

function doGet() {
  return reply_({ left: Math.max(0, CAPACITY - confirmedHeads_(rows_())), closed: new Date() > DEADLINE });
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return reply_({ status: "ignored" }); // honeypot

  if (new Date() > DEADLINE) return reply_({ status: "closed" });

  var name = clean_(p.name, 100);
  var phone = clean_(p.phone, 30);
  var email = String(p.email || "").trim().toLowerCase().slice(0, 120);
  var plus = p.plusOne === "yes";
  var plusName = clean_(p.plusName, 100);

  if (!name || !phone || !email || p.consent !== "yes" || (plus && !plusName)) return reply_({ status: "missing fields" });
  if (!/^[+0-9 ()\-]{6,20}$/.test(String(p.phone).trim())) return reply_({ status: "bad phone" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply_({ status: "bad email" });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // two people can't both take the last seat
  var result;
  try {
    var rows = rows_();
    var key = normPhone_(phone);
    var dupe = rows.some(function (r) {
      return normPhone_(r[COL.phone - 1]) === key || String(r[COL.email - 1]).toLowerCase() === email;
    });
    if (dupe) return reply_({ status: "duplicate" });

    var heads = plus ? 2 : 1;
    var status = confirmedHeads_(rows) + heads <= CAPACITY ? "confirmed" : "waitlist";
    var amount = status === "confirmed" ? heads * PRICE : 0;

    var sheet = sheet_();
    sheet.appendRow([new Date(), status, name, phone, email,
      clean_(p.diet, 20), clean_(p.allergies, 200),
      plus ? "yes" : "no", plus ? plusName : "", plus ? clean_(p.plusDiet, 20) : "", plus ? clean_(p.plusAllergies, 200) : "",
      heads, amount, false, false]);
    var last = sheet.getLastRow();
    sheet.getRange(last, COL.paid).insertCheckboxes();
    sheet.getRange(last, COL.directions).insertCheckboxes();
    result = { status: status, amount: amount };
  } finally {
    lock.releaseLock();
  }

  try {
    sendConfirmation_(email, name, result.status, result.amount, plus ? plusName : "");
  } catch (err) {
    console.error(err); // the row is saved; a failed email shouldn't fail the signup
  }
  return reply_(result);
}

function sendConfirmation_(email, name, status, amount, plusName) {
  var first = String(name).replace(/^'/, "").split(" ")[0];
  var lines = status === "confirmed"
    ? ["Hi " + first + ",", "",
       "You're in for Friendsgiving" + (plusName ? " (+ " + plusName + ")" : "") + ".", "",
       "Pay " + amount + " kr to MobilePay Box " + MOBILEPAY_BOX + ", with your name in the message.", "",
       "05.12.26 · 18:00 doors · 18:30 dinner · DJ till late",
       "Hagemanns Kollegium, Kristianiagade 10, Østerbro · BYOB", "",
       "Directions follow closer to the day.", "", "Three Heads"]
    : ["Hi " + first + ",", "",
       "Friendsgiving is full, so you're on the waitlist. If a seat opens we'll text you. Don't pay anything yet.", "",
       "Three Heads"];
  MailApp.sendEmail({
    to: email,
    subject: status === "confirmed" ? "You're in · Friendsgiving 05.12" : "Waitlist · Friendsgiving 05.12",
    body: lines.join("\n"),
    name: "Three Heads",
  });
}

// Run once from the editor after filling DIRECTIONS.
function sendDirections() {
  if (!DIRECTIONS) throw new Error("Fill DIRECTIONS first.");
  var sheet = sheet_();
  var rows = rows_();
  rows.forEach(function (r, i) {
    if (r[COL.status - 1] !== "confirmed" || r[COL.directions - 1] === true) return;
    MailApp.sendEmail({
      to: r[COL.email - 1],
      subject: "Finding us · Friendsgiving 05.12",
      body: "Hi " + String(r[COL.name - 1]).replace(/^'/, "").split(" ")[0] + ",\n\n" + DIRECTIONS + "\n\nSee you Saturday.\nThree Heads",
      name: "Three Heads",
    });
    sheet.getRange(i + 2, COL.directions).setValue(true);
  });
}

function confirmedHeads_(rows) {
  return rows.reduce(function (sum, r) {
    return r[COL.status - 1] === "confirmed" ? sum + Number(r[COL.heads - 1] || 0) : sum;
  }, 0);
}

function rows_() {
  var sheet = sheet_();
  var n = sheet.getLastRow() - 1;
  return n < 1 ? [] : sheet.getRange(2, 1, n, HEADERS.length).getValues();
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

function normPhone_(v) {
  return String(v).replace(/\D/g, "").replace(/^45(?=\d{8}$)/, "");
}

// Trim, cap length, neutralise spreadsheet formulas (=, +, -, @).
function clean_(value, max) {
  var s = String(value || "").trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

## 2. Setup (once)

1. Google Drive → **New → Google Sheets**, e.g. "Friendsgiving 03 signups".
2. **Extensions → Apps Script** → paste the code above → **Save**.
3. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone** → Deploy → authorise. The authorisation asks for Sheets **and** "send email as you" (MailApp).
4. Copy the `/exec` URL into `APPS_SCRIPT_URL` in `src/pages/threeheads/friendsgiving.astro`.
5. Adobe Fonts → kit `koo7phy` → add **Cooper Black** → publish the kit. Until then titles fall back to Georgia.
6. **Test before sharing:** open the live page. If the line under "Sign up" changes to "40 spots left…", reading responses works. Sign up with your own number and email, check the row and the email, then delete the row.

Redeploying after edits: **Manage deployments → Edit → New version** (same URL). See `docs/THREEHEADS-WAITLIST.md` §3.

## 3. GDPR (privacy entry added 07.11.2026)

Collects name, phone, email, diet and allergies. **Allergies are health data** (special category, Art. 9): the consent checkbox covers it, but keep the Sheet unshared and **delete the Sheet after the event**. Add to `uses` in `src/pages/privacy.astro` (alongside the waitlist entry):

```js
  {
    title: "Three Heads Friendsgiving signup",
    data: "Name, phone, email, dietary needs and allergies (yours and your +1's)",
    purpose: "Seating, cooking for your diet, payment and directions for the 05.12.26 dinner",
    basis: "Consent, Art. 6(1)(a) and Art. 9(2)(a) for allergies",
    retention: "Deleted within 30 days after the dinner",
  },
```
