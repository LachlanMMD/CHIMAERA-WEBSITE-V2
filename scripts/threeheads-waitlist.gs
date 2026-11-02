/**
 * THREE HEADS — waitlist receiver (Google Apps Script)
 *
 * Lives inside the "Three Heads — waitlist" Google Sheet:
 * Extensions → Apps Script → paste this file → Deploy as a web app.
 * Full steps: docs/THREEHEADS-WAITLIST.md.
 *
 * The site's /threeheads/ form POSTs here. Each sign-up becomes one row:
 *   Joined | Name | Phone | Status | Notes
 * Status and Notes are yours: invited, came, declined, allergies, etc.
 * The script only ever appends; it never reads or changes your edits.
 *
 * This file is the source of truth. If you change the script in the
 * Apps Script editor, copy it back here.
 */

var HEADERS = ["Joined", "Name", "Phone", "Status", "Notes"];

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot filled → a bot. Answer "ok" so it doesn't retry.
  if (p.website) return reply({ ok: true });

  var name = clean(p.name, 80);
  var phone = clean(p.phone, 24);
  var digits = phone.replace(/\D/g, "");

  if (!name) return reply({ ok: false, error: "name" });
  if (digits.length < 8 || digits.length > 15) return reply({ ok: false, error: "phone" });
  if (p.consent !== "yes") return reply({ ok: false, error: "consent" });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // two sign-ups at the same second don't overwrite each other

  try {
    var sheet = getSheet();

    // Already on the list (same digits)? Don't add a duplicate row.
    var last = sheet.getLastRow();
    if (last > 1) {
      var phones = sheet.getRange(2, 3, last - 1, 1).getDisplayValues();
      for (var i = 0; i < phones.length; i++) {
        if (String(phones[i][0]).replace(/\D/g, "") === digits) return reply({ ok: true, duplicate: true });
      }
    }

    // Leading ' keeps values as text: phone numbers stay "+45 …", and
    // anything starting with = + - @ can't run as a formula.
    sheet.appendRow([new Date(), "'" + name, "'" + phone, "", ""]);
  } finally {
    lock.releaseLock();
  }

  return reply({ ok: true });
}

// Visiting the /exec URL in a browser shows this, so you can check it's live.
function doGet() {
  return reply({ ok: true, service: "three-heads-waitlist" });
}

// The first tab, whatever it's called. Add other tabs to the right freely.
function getSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  // First run: header row, frozen and bold; Joined as a readable date.
  if (sheet.getFrozenRows() === 0) {
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.getRange("A2:A").setNumberFormat("dd.mm.yyyy hh:mm");
  }
  return sheet;
}

function clean(value, max) {
  return String(value || "")
    .replace(/[\u0000-\u001f]/g, " ")
    .trim()
    .slice(0, max);
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
